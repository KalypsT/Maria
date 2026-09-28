import type { CombatParams } from '../../config/combat';
import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import type { Box } from '../physics/gridCollision';

export const AttackPhase = { Idle: 0, Startup: 1, Active: 2, Recovery: 3 } as const;
export type AttackPhase = (typeof AttackPhase)[keyof typeof AttackPhase];

/** Compteur « jamais » : grand entier, pour ne pas dépasser en incrémentant. */
const NEVER = 1 << 30;

/**
 * Coup de bâton de Céleste (D-20), pur et indépendant de Phaser : préparation, frappe active,
 * récupération, recharge ; pression mémorisée brièvement. Ne touche jamais au mouvement.
 * Aucune allocation dans `step` (arguments booléens et entiers seulement).
 */
export class PlayerAttack {
  phase: AttackPhase = AttackPhase.Idle;
  /** Pas restants dans la phase courante. */
  phaseSteps = 0;
  /** Orientation figée pendant le coup (1 droite, -1 gauche). */
  facing = 1;
  /** Numéro du coup courant : un ennemi n'est touché qu'une fois par coup. */
  swing = 0;
  private cooldownSteps = 0;
  private stepsSincePressed = NEVER;
  private startupSteps = 0;
  private activeSteps = 1;
  private recoverySteps = 0;
  private cooldownTotal = 0;
  private bufferSteps = 0;
  private readonly params: CombatParams;

  constructor(
    params: Readonly<CombatParams>,
    private readonly stepHz: number = PHYSICS_STEP_HZ,
  ) {
    this.params = { ...params };
    this.setParams(params);
  }

  setParams(params: Readonly<CombatParams>): void {
    const p = Object.assign(this.params, params);
    const hz = this.stepHz;
    this.startupSteps = msToSteps(p.attackStartupMs, hz);
    this.activeSteps = Math.max(1, msToSteps(p.attackActiveMs, hz));
    this.recoverySteps = msToSteps(p.attackRecoveryMs, hz);
    this.cooldownTotal = msToSteps(p.attackCooldownMs, hz);
    this.bufferSteps = msToSteps(p.attackBufferMs, hz);
  }

  get active(): boolean {
    return this.phase === AttackPhase.Active;
  }

  /** Vrai pendant le geste et la recharge : une pression est alors mémorisée. */
  get busy(): boolean {
    return this.phase !== AttackPhase.Idle || this.cooldownSteps > 0;
  }

  reset(): void {
    this.phase = AttackPhase.Idle;
    this.phaseSteps = 0;
    this.cooldownSteps = 0;
    this.stepsSincePressed = NEVER;
  }

  /** Un pas : `pressed` = front de pression d'Attaque ; `facing` = orientation de Céleste. */
  step(pressed: boolean, facing: number): void {
    if (pressed) {
      this.stepsSincePressed = 0;
    }
    if (this.phase !== AttackPhase.Idle) {
      this.phaseSteps--;
      if (this.phaseSteps <= 0) {
        this.advancePhase();
      }
    } else if (this.cooldownSteps > 0) {
      this.cooldownSteps--;
    }
    if (
      this.phase === AttackPhase.Idle &&
      this.cooldownSteps === 0 &&
      this.stepsSincePressed <= this.bufferSteps
    ) {
      this.stepsSincePressed = NEVER;
      this.facing = facing < 0 ? -1 : 1;
      this.swing++;
      this.phase = AttackPhase.Startup;
      this.phaseSteps = this.startupSteps;
      if (this.phaseSteps <= 0) {
        this.advancePhase();
      }
    }
    if (this.stepsSincePressed < NEVER) {
      this.stepsSincePressed++;
    }
  }

  /**
   * Zone de frappe devant la hitbox `body`, écrite dans `out` (aucune allocation). Retourne vrai si
   * le coup touche pendant ce pas.
   */
  hitbox(body: Box, out: Box): boolean {
    const p = this.params;
    out.width = p.attackReachPx;
    out.height = p.attackHeightPx;
    out.x = this.facing > 0 ? body.x + body.width : body.x - p.attackReachPx;
    out.y = body.y + p.attackOffsetYPx;
    return this.phase === AttackPhase.Active;
  }

  private advancePhase(): void {
    if (this.phase === AttackPhase.Startup) {
      this.phase = AttackPhase.Active;
      this.phaseSteps = this.activeSteps;
    } else if (this.phase === AttackPhase.Active) {
      this.phase = AttackPhase.Recovery;
      this.phaseSteps = this.recoverySteps;
      if (this.phaseSteps <= 0) {
        this.advancePhase();
      }
    } else {
      this.phase = AttackPhase.Idle;
      this.phaseSteps = 0;
      this.cooldownSteps = this.cooldownTotal;
    }
  }
}
