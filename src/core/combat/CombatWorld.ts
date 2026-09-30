import type { CombatParams } from '../../config/combat';
import { TILE_SIZE } from '../../config/display';
import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import { EntityType, Tile, tileAt, type LevelData } from '../level/LevelData';
import { touchesTile, type Box } from '../physics/gridCollision';
import type { PlayerPhysics } from '../player/PlayerPhysics';
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

  /** Ennemis remis à leur départ, coup et invulnérabilité annulés (réapparition). */
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
  }

  /** Un pas, après celui de Céleste. `attackPressed` : front de pression d'Attaque. */
  step(player: PlayerPhysics, attackPressed: boolean): void {
    this.events = 0;
    const attack = this.attack;
    const enemies = this.enemies;
    const tuning = this.tuning;
    attack.step(attackPressed && player.hurtSteps === 0 && !player.onLedge, player.facing);
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
    // Danger qui pique (orties, briques de jeu, D-51) : Céleste rebondit vers le haut et en arrière
    // (d'où elle venait), comme touchée par un ennemi ; la jauge de peur monte. Son propre délai,
    // plus court que l'invulnérabilité : rester dedans pique encore (on ne traverse pas une fosse).
    if (this.stingSteps > 0) {
      this.stingSteps--;
    } else if (touchesTile(this.level, player.box, Tile.Hazard)) {
      const back = player.vx > 0 ? -1 : player.vx < 0 ? 1 : -player.facing;
      player.vx = back * this.params.hurtKnockbackX;
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
