import { PATROLLER_HITBOX, SPIDER_HITBOX } from '../../config/combat';
import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt, type LevelData } from '../level/LevelData';
import { HitY, isGrounded, moveX, moveY, type MovingBox } from '../physics/gridCollision';

export const PatrollerState = { Patrol: 0, Stunned: 1, Dispersed: 2 } as const;

/**
 * Sorte d'ennemi : jouet qui marche sur sa plateforme (D-20), ou araignée qui monte et descend au
 * bout de son fil (jardin, D-46), sous son point d'attache (le haut de sa tuile de départ).
 */
export const EnemyKind = { Walker: 0, Spider: 1 } as const;
export type EnemyKind = (typeof EnemyKind)[keyof typeof EnemyKind];
export type PatrollerState = (typeof PatrollerState)[keyof typeof PatrollerState];

/** Réglages du patrouilleur exprimés par pas, partagés par tous (calculés par `CombatWorld`). */
export interface PatrollerTuning {
  dt: number;
  speed: number;
  friction: number;
  gravity: number;
  maxFall: number;
  knockback: number;
  hits: number;
  stunSteps: number;
  flashSteps: number;
  /** Araignée : descente (px) et avance de la phase par pas (rad). */
  spiderDrop: number;
  spiderPhaseStep: number;
}

/** Petit saut du patrouilleur repoussé, pour que le coup se lise (px/s vers le haut). */
const STUN_HOP = 90;

/**
 * Patrouilleur (D-20) : marche sur sa plateforme et fait demi-tour au bord ou contre un mur. Un coup
 * le repousse et l'étourdit (inoffensif un moment) ; le dernier coup le disperse (pas de gore).
 * Pur, indépendant de Phaser, même collision que Céleste ; aucune allocation dans `step`.
 */
export class Patroller {
  readonly box: MovingBox;
  vx = 0;
  vy = 0;
  /** Sens de marche : 1 droite, -1 gauche. */
  dir = 1;
  state: PatrollerState = PatrollerState.Patrol;
  grounded = false;
  prevX = 0;
  prevY = 0;
  hitsTaken = 0;
  stunSteps = 0;
  /** Pas restants de clignotement après un coup. */
  flashSteps = 0;
  private lastSwing = -1;
  /** Araignée : phase de la montée et descente (rad), 0 en haut. */
  phase = 0;

  constructor(
    readonly spawnCol: number,
    readonly spawnRow: number,
    readonly kind: EnemyKind = EnemyKind.Walker,
  ) {
    const hitbox = kind === EnemyKind.Spider ? SPIDER_HITBOX : PATROLLER_HITBOX;
    this.box = {
      x: 0,
      y: 0,
      width: hitbox.width,
      height: hitbox.height,
      dx: 0,
      dy: 0,
      passOneWay: false,
    };
    this.reset();
  }

  /** Point d'attache du fil de l'araignée (px) : le haut de sa tuile de départ. */
  get anchorY(): number {
    return this.spawnRow * T;
  }

  /** Remet à la position de départ, en patrouille, vers la droite. */
  reset(): void {
    this.box.x = this.prevX = (this.spawnCol + 0.5) * T - this.box.width / 2;
    this.box.y = this.prevY =
      this.kind === EnemyKind.Spider ? this.anchorY : (this.spawnRow + 1) * T - this.box.height;
    // Araignées voisines décalées : elles ne montent pas toutes ensemble.
    this.phase = ((this.spawnCol * 0.618) % 1) * 2 * Math.PI;
    this.vx = this.vy = 0;
    this.dir = 1;
    this.state = PatrollerState.Patrol;
    this.hitsTaken = 0;
    this.stunSteps = 0;
    this.flashSteps = 0;
    this.lastSwing = -1;
    this.grounded = true;
  }

  /** Blesse Céleste au contact : seulement en patrouille (étourdi ou dispersé, il est inoffensif). */
  get dangerous(): boolean {
    return this.state === PatrollerState.Patrol;
  }

  get dispersed(): boolean {
    return this.state === PatrollerState.Dispersed;
  }

  /**
   * Coup numéro `swing` venant du côté `fromDir` (1 : frappé vers la droite). Un même coup ne compte
   * qu'une fois. Retourne vrai si le coup a porté.
   */
  hit(swing: number, fromDir: number, tuning: Readonly<PatrollerTuning>): boolean {
    if (this.state === PatrollerState.Dispersed || swing === this.lastSwing) {
      return false;
    }
    this.lastSwing = swing;
    this.hitsTaken++;
    this.flashSteps = tuning.flashSteps;
    if (this.hitsTaken >= tuning.hits) {
      this.state = PatrollerState.Dispersed;
      this.vx = this.vy = 0;
      return true;
    }
    this.state = PatrollerState.Stunned;
    this.stunSteps = tuning.stunSteps;
    if (this.kind === EnemyKind.Spider) {
      // L'araignée effrayée remonte vers son point d'attache.
      return true;
    }
    this.vx = (fromDir < 0 ? -1 : 1) * tuning.knockback;
    this.vy = -STUN_HOP;
    this.grounded = false;
    return true;
  }

  step(level: LevelData, tuning: Readonly<PatrollerTuning>): void {
    const box = this.box;
    this.prevX = box.x;
    this.prevY = box.y;
    if (this.state === PatrollerState.Dispersed) {
      return;
    }
    if (this.flashSteps > 0) {
      this.flashSteps--;
    }
    if (this.kind === EnemyKind.Spider) {
      this.stepSpider(tuning);
      return;
    }
    const dt = tuning.dt;
    if (this.state === PatrollerState.Stunned) {
      const brake = tuning.friction * dt;
      this.vx = this.vx > brake ? this.vx - brake : this.vx < -brake ? this.vx + brake : 0;
      this.stunSteps--;
      if (this.stunSteps <= 0 && this.grounded) {
        this.state = PatrollerState.Patrol;
      }
    } else {
      if (this.grounded && this.edgeAhead(level)) {
        this.dir = -this.dir;
      }
      this.vx = this.dir * tuning.speed;
    }

    const startVy = this.vy;
    this.vy = Math.min(startVy + tuning.gravity * dt, tuning.maxFall);
    box.dx = this.vx * dt;
    box.dy = (startVy + this.vy) * 0.5 * dt;
    if (moveX(level, box)) {
      this.vx = 0;
      if (this.state === PatrollerState.Patrol) {
        this.dir = -this.dir;
      }
    }
    if (moveY(level, box) !== HitY.None) {
      this.vy = 0;
    }
    this.grounded = this.vy >= 0 && isGrounded(level, box);
  }

  /**
   * Araignée (D-46) : descente et remontée douces sous le point d'attache, sans collision (on la
   * place dans le vide). Effrayée, elle remonte d'abord jusqu'en haut, inoffensive, puis reprend.
   */
  private stepSpider(tuning: Readonly<PatrollerTuning>): void {
    if (this.state === PatrollerState.Stunned) {
      this.stunSteps--;
      // Remonte (la phase revient vers 0 ou 2π, le haut) deux fois plus vite.
      const up = this.phase % (2 * Math.PI);
      this.phase =
        up < Math.PI
          ? Math.max(0, up - 2 * tuning.spiderPhaseStep)
          : Math.min(2 * Math.PI, up + 2 * tuning.spiderPhaseStep);
      if (this.stunSteps <= 0) {
        this.state = PatrollerState.Patrol;
      }
    } else {
      this.phase += tuning.spiderPhaseStep;
      if (this.phase > 2 * Math.PI) {
        this.phase -= 2 * Math.PI;
      }
    }
    this.dir = this.phase < Math.PI ? 1 : -1;
    this.box.y = this.anchorY + tuning.spiderDrop * 0.5 * (1 - Math.cos(this.phase));
  }

  /** Vrai si le sol s'arrête juste devant (bord de plateforme) : on fait demi-tour sans tomber. */
  private edgeAhead(level: LevelData): boolean {
    const box = this.box;
    const frontX = this.dir > 0 ? box.x + box.width + 0.01 : box.x - 0.01;
    const col = Math.floor(frontX / T);
    const row = Math.floor((box.y + box.height + 0.01) / T);
    const tile = tileAt(level, col, row);
    return tile !== Tile.Solid && tile !== Tile.OneWay;
  }
}
