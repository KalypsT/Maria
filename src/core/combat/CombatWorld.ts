import {
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
import { touchesHazard, type Box } from '../physics/gridCollision';
import type { PlayerPhysics } from '../player/PlayerPhysics';
import { Chase } from '../boss/Chase';
import { PlayerAttack } from './PlayerAttack';
import { EnemyKind, Patroller, type PatrollerTuning } from './Patroller';

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
  /** Poursuite verticale de la salle (boss, D-67), null sans poursuite. */
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
    if (this.stepTrains(player)) {
      return;
    }
    // Poursuite (D-67) : le toucher fait rebondir Céleste vers le haut, la peur monte.
    if (this.chase?.step(player.box, this.invulnerableSteps > 0)) {
      player.vy = -this.params.chaseContactBounceY;
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
    } else if (touchesHazard(this.level, player.box)) {
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
