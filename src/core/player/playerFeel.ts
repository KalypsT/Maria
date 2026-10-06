import type { FeelParams } from '../../config/feel';
import { PHYSICS_STEP_HZ } from '../../config/movement';
import type { Box } from '../physics/gridCollision';

/** Ce que les sensations observent : `PlayerPhysics` convient tel quel. */
export interface FeelSubject {
  readonly vx: number;
  readonly vy: number;
  readonly grounded: boolean;
  readonly facing: number;
  readonly box: Readonly<Box>;
}

/** Événements du dernier pas (masque de bits), pour la poussière. */
export const FeelEvent = { None: 0, Takeoff: 1, Land: 2, Turn: 4 } as const;

/**
 * Sensations visuelles de Céleste (écrasement / étirement, inclinaison), pures et indépendantes de
 * Phaser : n'influencent jamais la physique. Avancées au pas fixe avec le joueur. Aucune allocation
 * dans `step` (champs numériques initialisés, aucun flottant passé en argument).
 */
export class PlayerFeel {
  /** Déformation : > 0 étiré (plus haut, plus étroit), < 0 écrasé. */
  squash = 0;
  /** Vitesse de la déformation (par seconde), pour le ressort. */
  squashVelocity = 0;
  /** Inclinaison (radians, > 0 : penchée vers la droite). */
  lean = 0;
  /** Événements du dernier pas (`FeelEvent`). */
  events = 0;
  /**
   * Hauteur de la dernière chute (px), du plus haut des pieds en l'air jusqu'à la réception : dose
   * la poussière et le bruit de la réception (D-125, D-126). Un saut ordinaire retombe déjà à la
   * vitesse de chute maximale : la vitesse ne distingue pas un petit saut d'une grande chute.
   */
  fallHeight = 0;
  /** Vitesse horizontale maximale, pour l'inclinaison (px/s). Écrite par la scène. */
  maxRunSpeed = 1;
  /** Vitesse de chute maximale, pour l'écrasement (px/s). Écrite par la scène. */
  maxFallSpeed = 1;
  private wasGrounded = true;
  private lastFacing = 1;
  private lastAirVy = 0;
  /** Plus haut des pieds (px, y le plus petit) depuis que Céleste a quitté le sol. */
  private airTopY = 0;
  private kLean = 1;
  private readonly dt: number;
  private readonly params: FeelParams;

  constructor(params: Readonly<FeelParams>, stepHz: number = PHYSICS_STEP_HZ) {
    this.params = { ...params };
    this.dt = 1 / stepHz;
    this.setParams(params);
  }

  get settings(): Readonly<FeelParams> {
    return this.params;
  }

  setParams(params: Readonly<FeelParams>): void {
    Object.assign(this.params, params);
    this.kLean = params.leanTimeMs <= 0 ? 1 : 1 - Math.exp(-(this.dt * 1000) / params.leanTimeMs);
    if (params.squashEnabled < 1) {
      this.squash = 0;
      this.squashVelocity = 0;
      this.lean = 0;
    }
  }

  /** Remet au repos (réapparition, changement de salle). */
  reset(subject: FeelSubject): void {
    this.squash = 0;
    this.squashVelocity = 0;
    this.lean = 0;
    this.events = FeelEvent.None;
    this.wasGrounded = subject.grounded;
    this.lastFacing = subject.facing;
    this.lastAirVy = 0;
    this.airTopY = subject.box.y + subject.box.height;
    this.fallHeight = 0;
  }

  /** Échelle horizontale d'affichage (aire à peu près conservée). */
  get scaleX(): number {
    return 1 - this.squash * 0.6;
  }

  get scaleY(): number {
    return 1 + this.squash;
  }

  step(subject: FeelSubject): void {
    const p = this.params;
    const dt = this.dt;
    let events = FeelEvent.None;
    const grounded = subject.grounded;
    if (this.wasGrounded && !grounded && subject.vy < 0) {
      events |= FeelEvent.Takeoff;
    } else if (!this.wasGrounded && grounded) {
      events |= FeelEvent.Land;
    }
    if (grounded && subject.facing !== this.lastFacing && subject.vx !== 0) {
      events |= FeelEvent.Turn;
    }
    this.events = events;
    const feetY = subject.box.y + subject.box.height;
    if (!grounded) {
      if (this.wasGrounded || feetY < this.airTopY) {
        this.airTopY = feetY;
      }
    } else if (!this.wasGrounded) {
      this.fallHeight = Math.max(0, feetY - this.airTopY);
    }
    this.wasGrounded = grounded;
    this.lastFacing = subject.facing;

    if (p.squashEnabled >= 1) {
      if ((events & FeelEvent.Takeoff) !== 0) {
        this.squash = p.jumpStretch;
        this.squashVelocity = 0;
      } else if ((events & FeelEvent.Land) !== 0) {
        const impact = this.lastAirVy - p.landSquashMinSpeed;
        if (impact > 0) {
          const range = this.maxFallSpeed - p.landSquashMinSpeed;
          const ratio = range > 0 && impact < range ? impact / range : 1;
          this.squash = -p.landSquash * ratio;
          this.squashVelocity = 0;
        }
      } else if ((events & FeelEvent.Turn) !== 0 && this.squash > -p.turnSquash) {
        this.squash = -p.turnSquash;
        this.squashVelocity = 0;
      }
      // Ressort amorti vers la forme au repos (intégration semi-implicite, stable au pas fixe).
      const omega = 2 * Math.PI * p.springHz;
      this.squashVelocity +=
        (-omega * omega * this.squash - 2 * p.springDamping * omega * this.squashVelocity) * dt;
      this.squash += this.squashVelocity * dt;

      const leanTarget = grounded
        ? ((subject.vx / this.maxRunSpeed) * p.leanDeg * Math.PI) / 180
        : 0;
      this.lean += (leanTarget - this.lean) * this.kLean;
    }
    if (!grounded) {
      this.lastAirVy = subject.vy;
    }
  }
}
