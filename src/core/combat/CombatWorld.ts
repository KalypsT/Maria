import {
  LUGGAGE_BOX,
  LuggagePhase,
  TUNNEL_CLEAR_PX,
  TrainPhase,
  cyclePhase,
  cycleWarnProgress,
  luggageState,
  TRAIN_GUST_AHEAD_PX,
  TRAIN_GUST_TILES,
  TRAIN_LENGTH_PX,
  trainLeft,
  trainProgress,
  type CombatParams,
} from '../../config/combat';
import { TILE_SIZE } from '../../config/display';
import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import { EntityType, Tile, tileAt, type LevelData } from '../level/LevelData';
import { touchesSting, type Box } from '../physics/gridCollision';
import type { PlayerPhysics } from '../player/PlayerPhysics';
import { Chase } from '../boss/Chase';
import { PlayerAttack } from './PlayerAttack';
import { EnemyKind, Patroller, type PatrollerTuning } from './Patroller';

/** Valise qui peut tomber d'un filet (D-86) : où elle repose, et la hauteur de sa chute (px). */
export interface LuggageDrop {
  /** Bord gauche et bas de la valise sur son filet (px). */
  readonly x: number;
  readonly y: number;
  readonly dropPx: number;
}

/** Ligne (tuiles) du premier sol (plein ou traversable) sous la tuile (col, row), ou la hauteur. */
function groundBelow(level: LevelData, col: number, row: number): number {
  for (let r = row; r < level.height; r++) {
    const tile = tileAt(level, col, r);
    if (tile === Tile.Solid || tile === Tile.OneWay) {
      return r;
    }
  }
  return level.height;
}

/**
 * Les vagues d'une salle (`; @waves: ligne left|right`, D-99) : la ligne et le sens de la terre, à
 * marée haute seulement ; null sinon.
 */
export function wavesOf(level: LevelData): { readonly row: number; readonly dir: 1 | -1 } | null {
  const waves = /^(\d+)\s+(left|right)$/.exec(level.meta.waves?.trim() ?? '');
  if (!waves || !level.tide?.high) {
    return null;
  }
  return { row: Number(waves[1]), dir: waves[2] === 'left' ? -1 : 1 };
}

/** Événements du dernier pas (masque de bits), pour le feedback. */
export const CombatEvent = { None: 0, Hit: 1, Disperse: 2, Hurt: 4 } as const;

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * Combat minimal (D-20), pur et indépendant de Phaser : coup de bâton de Céleste, patrouilleurs de
 * la salle, coups portés, contact et recul. Avancé au pas fixe juste après `PlayerPhysics.step`.
 * Aucune allocation dans `step`.
 */
export class CombatWorld {
  readonly attack: PlayerAttack;
  enemies: Patroller[] = [];
  /** Zone de frappe courante (valide si `attack.active`). */
  readonly attackBox: Box = { x: 0, y: 0, width: 0, height: 0 };
  /** Pas d'arrêt sur image restants : la scène suspend toute la simulation. */
  hitstopSteps = 0;
  /** Pas d'invulnérabilité restants de Céleste. */
  invulnerableSteps = 0;
  /** Événements du dernier pas (`CombatEvent`). */
  events = 0;
  /** Index de l'ennemi concerné par le dernier événement. */
  lastEnemy = -1;
  readonly tuning: PatrollerTuning = {
    dt: 0,
    speed: 0,
    friction: 0,
    gravity: 0,
    maxFall: 0,
    knockback: 0,
    hits: 1,
    stunSteps: 0,
    flashSteps: 0,
    spiderDrop: 0,
    spiderPhaseStep: 0,
    snailStep: 0,
  };
  private hitstopTotal = 0;
  /** Pas restants avant qu'un danger qui pique puisse piquer de nouveau (D-51). */
  private stingSteps = 0;
  private stingTotal = 0;
  private hurtSteps = 0;
  private invulnerableTotal = 0;
  /** Pas écoulés depuis le chargement de la salle ou la réapparition (cycle des trains, D-66). */
  trainSteps = 0;
  /** Train dont le souffle a déjà repoussé Céleste pendant ce passage (un seul souffle par train). */
  private trainGusted = -1;
  /** Pas écoulés depuis le chargement ou la réapparition (tunnels, valises, D-86). */
  hazardSteps = 0;
  /**
   * Le train est arrêté (à quai, de jour, D-90) : ni tunnel ni valise qui tombe ; les valises
   * restent sur leurs filets. Posé par la scène selon l'histoire.
   */
  still = false;
  /** Le tunnel en cours a déjà repoussé Céleste (une fois par tunnel). */
  private tunnelHit = false;
  /**
   * Ligne des vagues (`; @waves:`, D-99), -1 sans vagues ou à marée basse ; `waveDir` : le sens de
   * la terre (où la vague repousse Céleste).
   */
  waveRow = -1;
  waveDir: 1 | -1 = 1;
  /** La vague en cours a déjà repoussé Céleste (une fois par vague). */
  private waveHit = false;
  /** Ligne du toit sous les tunnels (`; @tunnel:`), -1 sans tunnel. */
  tunnelRow = -1;
  /** Valises qui tombent des filets (`; @decor: fallingcase`). */
  luggage: LuggageDrop[] = [];
  /** État d'une valise (réutilisé : aucune allocation). */
  private readonly luggageScratch = { phase: LuggagePhase.Rack as LuggagePhase, fallen: 0 };
  private readonly luggageBox: Box = { x: 0, y: 0, width: LUGGAGE_BOX.width, height: 0 };
  /** Poursuite de la salle (boss, D-67, D-87), null sans poursuite. */
  chase: Chase | null = null;
  /** Zone du souffle (réutilisée : aucune allocation). */
  private readonly gustBox: Box = { x: 0, y: 0, width: 0, height: 0 };
  private readonly params: CombatParams;

  constructor(
    private level: LevelData,
    params: Readonly<CombatParams>,
    private readonly stepHz: number = PHYSICS_STEP_HZ,
  ) {
    this.params = { ...params };
    this.attack = new PlayerAttack(params, stepHz);
    this.setParams(params);
    this.load(level);
  }

  /** Salle courante (l'affichage y cherche où s'attache le fil des araignées). */
  get room(): LevelData {
    return this.level;
  }

  get settings(): Readonly<CombatParams> {
    return this.params;
  }

  setParams(params: Readonly<CombatParams>): void {
    const p = Object.assign(this.params, params);
    const hz = this.stepHz;
    this.attack.setParams(p);
    this.hitstopTotal = msToSteps(p.hitstopMs, hz);
    this.hurtSteps = msToSteps(p.hurtControlMs, hz);
    this.invulnerableTotal = msToSteps(p.invulnerabilityMs, hz);
    this.stingTotal = msToSteps(p.stingCooldownMs, hz);
    this.chase?.setParams(p);
    const t = this.tuning;
    t.dt = 1 / hz;
    t.speed = p.patrollerSpeed;
    t.friction = p.patrollerFriction;
    t.gravity = p.patrollerGravity;
    t.maxFall = p.patrollerMaxFall;
    t.knockback = p.patrollerKnockback;
    t.hits = p.patrollerHits;
    t.stunSteps = msToSteps(p.patrollerStunMs, hz);
    t.flashSteps = msToSteps(p.hitFlashMs, hz);
    t.spiderDrop = p.spiderDropTiles * TILE_SIZE;
    t.spiderPhaseStep = (2 * Math.PI * 1000) / (p.spiderPeriodMs * hz);
    t.snailStep = p.snailSpeed / hz;
  }

  /** Nouvelle salle : ennemis créés depuis ses marqueurs (allocation au chargement seulement). */
  load(level: LevelData): void {
    this.level = level;
    this.chase = level.chase ? new Chase(level.chase, this.params, this.stepHz) : null;
    const tunnel = Number(level.meta.tunnel);
    this.tunnelRow = level.meta.tunnel !== undefined && Number.isFinite(tunnel) ? tunnel : -1;
    // Les vagues (D-99) : seulement à marée haute.
    const waves = wavesOf(level);
    this.waveRow = waves?.row ?? -1;
    this.waveDir = waves?.dir ?? 1;
    // Une valise par `fallingcase` : posée sur le filet (sa tuile), elle tombe jusqu'au sol dessous.
    this.luggage = level.decor
      .filter((d) => d.kind === 'fallingcase')
      .map((d) => {
        const bottom = (d.row + 1) * TILE_SIZE;
        const ground = groundBelow(level, d.col, d.row + 2) * TILE_SIZE;
        return {
          x: (d.col + 0.5) * TILE_SIZE - LUGGAGE_BOX.width / 2,
          y: bottom,
          dropPx: ground - bottom,
        };
      });
    this.enemies = level.entities
      .filter(
        (e) =>
          e.type === EntityType.Patroller ||
          e.type === EntityType.Spider ||
          e.type === EntityType.Snail,
      )
      .map((e) => {
        if (e.type === EntityType.Snail) {
          // Collé au mur plein à sa gauche, sinon à sa droite.
          const side = tileAt(level, e.col - 1, e.row) === Tile.Solid ? -1 : 1;
          return new Patroller(e.col, e.row, EnemyKind.Snail, side);
        }
        return new Patroller(
          e.col,
          e.row,
          e.type === EntityType.Spider ? EnemyKind.Spider : EnemyKind.Walker,
        );
      });
    this.reset();
  }

  /**
   * Ennemis remis à leur départ, coup et invulnérabilité annulés (réapparition après un
   * évanouissement, D-56 : les ennemis vaincus reviennent aussi). Sans cela, un ennemi dispersé le
   * reste tant que Céleste est dans la salle.
   */
  reset(): void {
    for (const enemy of this.enemies) {
      enemy.reset();
    }
    this.attack.reset();
    this.hitstopSteps = 0;
    this.invulnerableSteps = 0;
    this.stingSteps = 0;
    this.events = 0;
    this.lastEnemy = -1;
    this.trainSteps = 0;
    this.trainGusted = -1;
    this.hazardSteps = 0;
    this.tunnelHit = false;
    this.waveHit = false;
    this.chase?.restart();
  }

  /** Temps du cycle des trains (ms). */
  get trainMs(): number {
    return (this.trainSteps * 1000) / this.stepHz;
  }

  /** Décalage du cycle du train `index` : deux voies d'une salle ne passent pas ensemble. */
  trainOffsetMs(index: number): number {
    return index * (this.params.trainPeriodMs / 2);
  }

  /**
   * Souffle d'un train qui passe (D-66) : sur la voie, là où passe le train, Céleste est repoussée
   * dans le sens du train et vers le haut, et la peur monte, une fois par passage. Vrai si elle vient
   * d'être repoussée.
   */
  private stepTrains(player: PlayerPhysics): boolean {
    const trains = this.level.trains;
    if (trains.length === 0) {
      return false;
    }
    this.trainSteps++;
    const ms = this.trainMs;
    const gust = this.gustBox;
    for (let i = 0; i < trains.length; i++) {
      const train = trains[i];
      if (!train) {
        continue;
      }
      // Le souffle accompagne le train : là où il passe, et un peu devant lui.
      const progress = trainProgress(ms, this.trainOffsetMs(i), this.params);
      if (progress < 0) {
        if (this.trainGusted === i) {
          this.trainGusted = -1;
        }
        continue;
      }
      gust.x =
        trainLeft(progress, this.level.width * TILE_SIZE, train.dir) -
        (train.dir < 0 ? TRAIN_GUST_AHEAD_PX : 0);
      gust.width = TRAIN_LENGTH_PX + TRAIN_GUST_AHEAD_PX;
      gust.y = (train.row - TRAIN_GUST_TILES) * TILE_SIZE;
      gust.height = TRAIN_GUST_TILES * TILE_SIZE;
      if (this.trainGusted !== i && overlaps(player.box, gust)) {
        this.trainGusted = i;
        player.vx = train.dir * this.params.trainGustX;
        player.vy = -this.params.trainGustY;
        player.startHurt(this.hurtSteps);
        this.invulnerableSteps = Math.max(this.invulnerableSteps, this.invulnerableTotal);
        this.events |= CombatEvent.Hurt;
        this.lastEnemy = -1;
        return true;
      }
    }
    return false;
  }

  /** Temps du cycle des tunnels et des valises (ms). */
  get hazardMs(): number {
    return (this.hazardSteps * 1000) / this.stepHz;
  }

  /** Moment du tunnel (D-86) : calme, annonce, dedans. */
  get tunnelPhase(): TrainPhase {
    const p = this.params;
    return cyclePhase(this.hazardMs, p.tunnelPeriodMs, p.tunnelWarnMs, p.tunnelPassMs);
  }

  /**
   * Tunnel (D-86) : dans le tunnel, tout ce qui dépasse au-dessus de la ligne du toit (moins
   * `TUNNEL_CLEAR_PX`) est balayé : Céleste debout est repoussée vers l'arrière, la peur monte, une
   * fois par tunnel. Vrai si elle vient d'être repoussée.
   */
  private stepTunnel(player: PlayerPhysics): boolean {
    if (this.tunnelRow < 0) {
      return false;
    }
    if (this.tunnelPhase !== TrainPhase.Passing) {
      this.tunnelHit = false;
      return false;
    }
    if (this.tunnelHit || player.box.y >= this.tunnelRow * TILE_SIZE - TUNNEL_CLEAR_PX) {
      return false;
    }
    this.tunnelHit = true;
    player.vx = -this.params.tunnelPushX;
    player.vy = this.params.tunnelPushY;
    player.startHurt(this.hurtSteps);
    this.invulnerableSteps = Math.max(this.invulnerableSteps, this.invulnerableTotal);
    this.events |= CombatEvent.Hurt;
    this.lastEnemy = -1;
    return true;
  }

  /** Avancement de l'annonce de la vague (0 → 1), -1 hors de l'annonce (D-99, pour le dessin). */
  get waveWarnProgress(): number {
    const p = this.params;
    return cycleWarnProgress(this.hazardMs, p.wavePeriodMs, p.waveWarnMs, p.wavePassMs);
  }

  /** Moment de la vague (D-99) : calme, annonce, elle balaie. */
  get wavePhase(): TrainPhase {
    const p = this.params;
    return cyclePhase(this.hazardMs, p.wavePeriodMs, p.waveWarnMs, p.wavePassMs);
  }

  /**
   * Vague (D-99) : pendant qu'elle balaie, Céleste qui a les pieds sous la ligne des vagues est
   * repoussée vers la terre et un peu soulevée, la peur monte, une fois par vague. Vrai si elle
   * vient d'être repoussée.
   */
  private stepWave(player: PlayerPhysics): boolean {
    if (this.waveRow < 0) {
      return false;
    }
    if (this.wavePhase !== TrainPhase.Passing) {
      this.waveHit = false;
      return false;
    }
    if (this.waveHit || player.box.y + player.box.height <= this.waveRow * TILE_SIZE) {
      return false;
    }
    this.waveHit = true;
    player.vx = this.waveDir * this.params.wavePushX;
    player.vy = -this.params.wavePushY;
    player.startHurt(this.hurtSteps);
    this.invulnerableSteps = Math.max(this.invulnerableSteps, this.invulnerableTotal);
    this.events |= CombatEvent.Hurt;
    this.lastEnemy = -1;
    return true;
  }

  /** Boîte de la valise `index` en ce moment (px), ou null si elle n'est pas en train de tomber. */
  fallingBox(index: number): Box | null {
    const drop = this.luggage[index];
    if (!drop) {
      return null;
    }
    const state = this.luggageScratch;
    luggageState(this.hazardMs, index, this.luggage.length, drop.dropPx, this.params, state);
    if (state.phase !== LuggagePhase.Fall) {
      return null;
    }
    const box = this.luggageBox;
    box.x = drop.x;
    box.height = LUGGAGE_BOX.height;
    box.y = drop.y - LUGGAGE_BOX.height + state.fallen;
    return box;
  }

  /** Valise qui tombe (D-86) : touchée, Céleste recule et la peur monte. */
  private stepLuggage(player: PlayerPhysics): boolean {
    if (this.luggage.length === 0 || this.invulnerableSteps > 0) {
      return false;
    }
    const box = player.box;
    for (let i = 0; i < this.luggage.length; i++) {
      const falling = this.fallingBox(i);
      if (falling && overlaps(box, falling)) {
        const away = box.x + box.width / 2 < falling.x + falling.width / 2 ? -1 : 1;
        player.vx = away * this.params.hurtKnockbackX;
        player.vy = -this.params.hurtKnockbackY;
        player.startHurt(this.hurtSteps);
        this.invulnerableSteps = this.invulnerableTotal;
        this.events |= CombatEvent.Hurt;
        this.lastEnemy = -1;
        return true;
      }
    }
    return false;
  }

  /** Un pas, après celui de Céleste. `attackPressed` : front de pression d'Attaque. */
  step(player: PlayerPhysics, attackPressed: boolean): void {
    this.events = 0;
    const attack = this.attack;
    const enemies = this.enemies;
    const tuning = this.tuning;
    attack.step(
      attackPressed && player.hurtSteps === 0 && !player.onLedge && player.cable < 0 && !player.low,
      player.facing,
    );
    if (attack.hitbox(player.box, this.attackBox)) {
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (
          enemy &&
          overlaps(this.attackBox, enemy.box) &&
          enemy.hit(attack.swing, attack.facing, tuning)
        ) {
          this.events |= enemy.dispersed ? CombatEvent.Disperse : CombatEvent.Hit;
          this.lastEnemy = i;
          this.hitstopSteps = this.hitstopTotal;
        }
      }
    }
    for (const enemy of enemies) {
      enemy.step(this.level, tuning);
    }
    if (!this.still) {
      this.hazardSteps++;
    }
    if (
      this.stepTrains(player) ||
      (!this.still &&
        (this.stepTunnel(player) || this.stepLuggage(player) || this.stepWave(player)))
    ) {
      return;
    }
    // Poursuite (D-67, D-87) : le toucher fait rebondir Céleste vers le haut, ou la pousse en avant
    // dans le sens de la fuite (horizontale) ; la peur monte.
    const chase = this.chase;
    if (chase?.step(player.box, this.invulnerableSteps > 0)) {
      if (chase.horizontal) {
        player.vx = chase.sign * this.params.chaseContactPushX;
        player.vy = -this.params.chaseContactHopY;
      } else {
        player.vy = -this.params.chaseContactBounceY;
      }
      player.startHurt(this.hurtSteps);
      this.invulnerableSteps = Math.max(this.invulnerableSteps, this.invulnerableTotal);
      this.events |= CombatEvent.Hurt;
      this.lastEnemy = -1;
      return;
    }
    // Danger du sol (orties, ronces, briques de jeu, D-51, D-56) : il pique. Céleste rebondit vers
    // le haut en gardant son élan (elle continue dans le sens où elle allait) ; la peur monte. Son
    // propre délai, plus court que l'invulnérabilité : rester dedans pique encore.
    if (this.stingSteps > 0) {
      this.stingSteps--;
    } else if (touchesSting(this.level, player.box)) {
      const forward = player.vx > 0 ? 1 : player.vx < 0 ? -1 : player.facing;
      player.vx = forward * this.params.hurtKnockbackX;
      player.vy = -this.params.stingBounceY;
      player.startHurt(this.hurtSteps);
      this.stingSteps = this.stingTotal;
      this.invulnerableSteps = Math.max(this.invulnerableSteps, this.stingTotal);
      this.events |= CombatEvent.Hurt;
      this.lastEnemy = -1;
      return;
    }
    if (this.invulnerableSteps > 0) {
      this.invulnerableSteps--;
      return;
    }
    const box = player.box;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy?.dangerous && overlaps(box, enemy.box)) {
        // Recul à l'opposé de l'ennemi, écrit dans les vitesses (aucun flottant en argument).
        const away = box.x + box.width / 2 < enemy.box.x + enemy.box.width / 2 ? -1 : 1;
        player.vx = away * this.params.hurtKnockbackX;
        player.vy = -this.params.hurtKnockbackY;
        player.startHurt(this.hurtSteps);
        this.invulnerableSteps = this.invulnerableTotal;
        this.events |= CombatEvent.Hurt;
        this.lastEnemy = i;
        return;
      }
    }
  }
}
