import { PATROLLER_HITBOX } from '../../config/combat';
import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt, type LevelData } from '../level/LevelData';
import { HitY, isGrounded, moveX, moveY, type MovingBox } from '../physics/gridCollision';

export const PatrollerState = { Patrol: 0, Stunned: 1, Dispersed: 2 } as const;
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

  constructor(
    readonly spawnCol: number,
    readonly spawnRow: number,
  ) {
    this.box = {
      x: 0,
      y: 0,
      width: PATROLLER_HITBOX.width,
      height: PATROLLER_HITBOX.height,
      dx: 0,
      dy: 0,
      passOneWay: false,
    };
    this.reset();
  }

  /** Remet à la position de départ, en patrouille, vers la droite. */
  reset(): void {
    this.box.x = this.prevX = (this.spawnCol + 0.5) * T - this.box.width / 2;
    this.box.y = this.prevY = (this.spawnRow + 1) * T - this.box.height;
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
