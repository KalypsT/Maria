import {
  PLAYER_HITBOX,
  deriveMovement,
  type DerivedMovement,
  type MovementParams,
} from '../../config/movement';
import type { LevelData } from '../level/LevelData';
import { HitY, isAreaFree, isGrounded, moveX, moveY, type Box } from '../physics/gridCollision';
import { PlayerState, nextPlayerState } from './playerState';

/** Entrées lues par un pas de simulation. */
export interface PlayerInput {
  /** -1 à 1. */
  moveX: number;
  /** Front de pression du saut depuis le pas précédent. */
  jumpPressed: boolean;
  jumpHeld: boolean;
}

/** Compteur « jamais » : grand entier, pour ne pas dépasser en incrémentant. */
const NEVER = 1 << 30;

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) {
    return Math.min(value + maxDelta, target);
  }
  return Math.max(value - maxDelta, target);
}

/**
 * Physique de Céleste, indépendante de Phaser. Un appel à `step` = un pas fixe (1/120 s).
 * Aucune allocation dans `step` : l'état est muté en place.
 */
export class PlayerPhysics {
  readonly box: Box;
  vx = 0;
  vy = 0;
  /** Position au début du dernier pas, pour l'interpolation d'affichage. */
  prevX: number;
  prevY: number;
  grounded = false;
  state: PlayerState = PlayerState.Fall;
  /** 1 à droite, -1 à gauche. */
  facing = 1;
  /** Pas écoulés depuis le dernier contact avec le sol (coyote time). */
  stepsSinceGrounded = NEVER;
  /** Pas écoulés depuis la dernière pression de saut non consommée (jump buffering). */
  stepsSinceJumpPressed = NEVER;
  private jumpCutAvailable = false;
  private landStepsRemaining = 0;
  private params: MovementParams;
  readonly derived: DerivedMovement;

  constructor(
    private level: LevelData,
    params: Readonly<MovementParams>,
    x: number,
    y: number,
  ) {
    this.params = { ...params };
    this.derived = deriveMovement(this.params);
    this.box = { x, y, width: PLAYER_HITBOX.width, height: PLAYER_HITBOX.height };
    this.prevX = x;
    this.prevY = y;
    this.grounded = isGrounded(level, this.box);
    this.stepsSinceGrounded = this.grounded ? 0 : NEVER;
    this.state = this.grounded ? PlayerState.Idle : PlayerState.Fall;
  }

  get movement(): Readonly<MovementParams> {
    return this.params;
  }

  /** Applique de nouveaux paramètres (réglage en direct). */
  setParams(params: Readonly<MovementParams>): void {
    Object.assign(this.params, params);
    deriveMovement(this.params, undefined, this.derived);
  }

  /** Replace le joueur, immobile, à une position. */
  reset(x: number, y: number, level: LevelData = this.level): void {
    this.level = level;
    this.box.x = this.prevX = x;
    this.box.y = this.prevY = y;
    this.vx = this.vy = 0;
    this.stepsSinceJumpPressed = NEVER;
    this.jumpCutAvailable = false;
    this.landStepsRemaining = 0;
    this.grounded = isGrounded(level, this.box);
    this.stepsSinceGrounded = this.grounded ? 0 : NEVER;
    this.state = this.grounded ? PlayerState.Idle : PlayerState.Fall;
  }

  step(input: PlayerInput): void {
    const p = this.params;
    const d = this.derived;
    const dt = d.dt;
    const box = this.box;
    this.prevX = box.x;
    this.prevY = box.y;

    // Horizontal : accélération vers la vitesse visée, demi-tour plus vif, décélération sans entrée.
    const moveInput = input.moveX;
    let accel: number;
    if (moveInput !== 0) {
      const turning = this.vx !== 0 && Math.sign(this.vx) !== Math.sign(moveInput);
      if (this.grounded) {
        accel = turning ? p.groundTurnAcceleration : p.groundAcceleration;
      } else {
        accel = turning ? p.airTurnAcceleration : p.airAcceleration;
      }
      this.facing = moveInput > 0 ? 1 : -1;
    } else {
      accel = this.grounded ? p.groundDeceleration : p.airDeceleration;
    }
    this.vx = approach(this.vx, moveInput * p.maxRunSpeed, accel * dt);

    // Saut : buffer (pression récente) × coyote (sol récent).
    if (input.jumpPressed) {
      this.stepsSinceJumpPressed = 0;
    }
    if (
      this.stepsSinceJumpPressed <= d.jumpBufferSteps &&
      this.stepsSinceGrounded <= d.coyoteSteps
    ) {
      this.vy = -d.jumpVelocity;
      this.grounded = false;
      this.stepsSinceGrounded = NEVER;
      this.stepsSinceJumpPressed = NEVER;
      this.jumpCutAvailable = true;
    }
    // Hauteur variable : relâcher pendant la montée coupe la vitesse, une fois par saut.
    if (this.jumpCutAvailable && this.vy < 0 && !input.jumpHeld) {
      this.vy *= p.jumpCutMultiplier;
      this.jumpCutAvailable = false;
    }

    // Vertical : intégration exacte à gravité constante sur le pas (trapèze sur la vitesse).
    const gravity = this.vy < 0 ? d.riseGravity : d.fallGravity;
    const startVy = this.vy;
    this.vy = Math.min(startVy + gravity * dt, p.maxFallSpeed);
    const dy = (startVy + this.vy) * 0.5 * dt;

    if (moveX(this.level, box, this.vx * dt)) {
      this.vx = 0;
    }
    const startY = box.y;
    const hit = moveY(this.level, box, dy);
    if (hit === HitY.Floor) {
      this.vy = 0;
    } else if (hit === HitY.Ceiling && !this.tryCornerCorrection(startY + dy, moveInput)) {
      this.vy = 0;
      this.jumpCutAvailable = false;
    }

    const wasGrounded = this.grounded;
    this.grounded = this.vy >= 0 && isGrounded(this.level, box);
    if (this.vy >= 0) {
      this.jumpCutAvailable = false;
    }
    if (this.grounded) {
      this.stepsSinceGrounded = 0;
    } else if (this.stepsSinceGrounded < NEVER) {
      this.stepsSinceGrounded++;
    }
    if (this.stepsSinceJumpPressed < NEVER) {
      this.stepsSinceJumpPressed++;
    }
    if (this.grounded && !wasGrounded) {
      this.landStepsRemaining = d.landSteps;
    } else if (this.landStepsRemaining > 0) {
      this.landStepsRemaining--;
    }
    this.state = nextPlayerState(
      this.state,
      this.grounded,
      this.vy,
      this.vx !== 0 || moveInput !== 0,
      this.landStepsRemaining,
    );
  }

  /**
   * En montée contre un coin de plafond, décale horizontalement de quelques pixels si cela libère
   * le passage : un saut qui frôle un coin n'est pas stoppé net (précision avant réalisme).
   */
  private tryCornerCorrection(targetY: number, moveInput: number): boolean {
    const box = this.box;
    const preferred = moveInput < 0 ? -1 : 1;
    for (let offset = 1; offset <= this.params.cornerCorrectionPx; offset++) {
      for (let side = 0; side < 2; side++) {
        const dir = side === 0 ? preferred : -preferred;
        const x = box.x + dir * offset;
        if (
          isAreaFree(this.level, x, box.y, box.width, box.height) &&
          isAreaFree(this.level, x, targetY, box.width, box.height)
        ) {
          box.x = x;
          moveY(this.level, box, targetY - box.y);
          return true;
        }
      }
    }
    return false;
  }
}
