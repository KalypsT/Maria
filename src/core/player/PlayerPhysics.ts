import {
  PLAYER_HITBOX,
  deriveMovement,
  type DerivedMovement,
  type MovementParams,
} from '../../config/movement';
import type { LevelData } from '../level/LevelData';
import {
  HitY,
  isBoxFree,
  isGrounded,
  moveX,
  moveY,
  type MovingBox,
} from '../physics/gridCollision';
import { PlayerState, nextPlayerState } from './playerState';

/** Entrées lues par un pas de simulation. */
export interface PlayerInput {
  /** -1 à 1. */
  moveX: number;
  /** -1 (haut) à 1 (bas) ; « Bas + Saut » traverse une plateforme traversable. */
  moveY: number;
  /** Front de pression du saut depuis le pas précédent. */
  jumpPressed: boolean;
  jumpHeld: boolean;
}

/** Compteur « jamais » : grand entier, pour ne pas dépasser en incrémentant. */
const NEVER = 1 << 30;

/**
 * Physique de Céleste, indépendante de Phaser. Un appel à `step` = un pas fixe (1/120 s).
 * Aucune allocation dans `step` : l'état est muté en place, et aucun flottant n'est passé en
 * argument ni retourné par une fonction non inlinée (V8 l'allouerait sur le tas), d'où les
 * déplacements transmis par `box.dx` / `box.dy`. Vérifié au profileur de tas (bench/arcade.html).
 */
export class PlayerPhysics {
  readonly box: MovingBox;
  vx = 0;
  vy = 0;
  /**
   * Position au début du dernier pas, pour l'interpolation d'affichage. Initialisée à un nombre dès
   * la déclaration : un champ d'abord `undefined` ferait allouer chaque écriture de flottant par V8.
   */
  prevX = 0;
  prevY = 0;
  grounded = false;
  state: PlayerState = PlayerState.Fall;
  /** 1 à droite, -1 à gauche. */
  facing = 1;
  /** Pas écoulés depuis le dernier contact avec le sol (coyote time). */
  stepsSinceGrounded = NEVER;
  /** Pas écoulés depuis la dernière pression de saut non consommée (jump buffering). */
  stepsSinceJumpPressed = NEVER;
  /** Pas restants de perte de contrôle après avoir été touchée (D-20). */
  hurtSteps = 0;
  private jumpCutAvailable = false;
  /** Saut relâché pendant la montée, en mode « gravité au relâchement » (D-19). */
  private releaseGravityActive = false;
  private landStepsRemaining = 0;
  private dropStepsRemaining = 0;
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
    this.box = {
      x,
      y,
      width: PLAYER_HITBOX.width,
      height: PLAYER_HITBOX.height,
      dx: 0,
      dy: 0,
      passOneWay: false,
    };
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
    this.releaseGravityActive = false;
    this.hurtSteps = 0;
    this.landStepsRemaining = 0;
    this.dropStepsRemaining = 0;
    this.box.passOneWay = false;
    this.grounded = isGrounded(level, this.box);
    this.stepsSinceGrounded = this.grounded ? 0 : NEVER;
    this.state = this.grounded ? PlayerState.Idle : PlayerState.Fall;
  }

  /**
   * Copie l'état complet d'un autre joueur (même salle, mêmes paramètres). Sert à l'analyse de
   * faisabilité (D-16) : essayer plusieurs entrées à partir d'un même instant sans tout rejouer.
   */
  copyFrom(other: PlayerPhysics): void {
    const box = this.box;
    const from = other.box;
    box.x = from.x;
    box.y = from.y;
    box.dx = from.dx;
    box.dy = from.dy;
    box.passOneWay = from.passOneWay;
    this.level = other.level;
    this.vx = other.vx;
    this.vy = other.vy;
    this.prevX = other.prevX;
    this.prevY = other.prevY;
    this.grounded = other.grounded;
    this.state = other.state;
    this.facing = other.facing;
    this.stepsSinceGrounded = other.stepsSinceGrounded;
    this.stepsSinceJumpPressed = other.stepsSinceJumpPressed;
    this.jumpCutAvailable = other.jumpCutAvailable;
    this.releaseGravityActive = other.releaseGravityActive;
    this.hurtSteps = other.hurtSteps;
    this.landStepsRemaining = other.landStepsRemaining;
    this.dropStepsRemaining = other.dropStepsRemaining;
  }

  /**
   * Touchée (D-20) : le recul est déjà écrit dans `vx` / `vy` par l'appelant (aucun flottant en
   * argument) ; pendant `steps` pas, direction et saut sont ignorés.
   */
  startHurt(steps: number): void {
    this.hurtSteps = steps;
    this.state = PlayerState.Hurt;
    this.grounded = false;
    this.stepsSinceGrounded = NEVER;
    this.stepsSinceJumpPressed = NEVER;
    this.jumpCutAvailable = false;
    this.releaseGravityActive = false;
  }

  step(input: PlayerInput): void {
    const p = this.params;
    const d = this.derived;
    const dt = d.dt;
    const box = this.box;
    this.prevX = box.x;
    this.prevY = box.y;

    // Touchée : direction et saut ignorés pendant la perte de contrôle.
    const hurt = this.hurtSteps > 0;
    const jumpPressed = input.jumpPressed && !hurt;
    const jumpHeld = input.jumpHeld && !hurt;

    // Horizontal : accélération vers la vitesse visée, demi-tour plus vif, décélération sans entrée.
    const moveInput = hurt ? 0 : input.moveX;
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
    const targetVx = moveInput * p.maxRunSpeed;
    const maxDelta = accel * dt;
    this.vx =
      this.vx < targetVx
        ? Math.min(this.vx + maxDelta, targetVx)
        : Math.max(this.vx - maxDelta, targetVx);

    // Bas + Saut sur une plateforme traversable : on la traverse au lieu de sauter.
    if (
      jumpPressed &&
      input.moveY > p.dropInputThreshold &&
      this.grounded &&
      !isGrounded(this.level, box, false)
    ) {
      this.dropStepsRemaining = d.dropSteps;
      this.grounded = false;
      this.stepsSinceGrounded = NEVER;
      this.stepsSinceJumpPressed = NEVER;
    } else if (jumpPressed) {
      this.stepsSinceJumpPressed = 0;
    }

    // Saut : buffer (pression récente) × coyote (sol récent).
    if (
      this.stepsSinceJumpPressed <= d.jumpBufferSteps &&
      this.stepsSinceGrounded <= d.coyoteSteps
    ) {
      this.vy = -d.jumpVelocity;
      this.grounded = false;
      this.stepsSinceGrounded = NEVER;
      this.stepsSinceJumpPressed = NEVER;
      this.jumpCutAvailable = true;
      this.releaseGravityActive = false;
    }
    // Hauteur variable : relâcher pendant la montée coupe la vitesse (ou, en mode 1, alourdit la
    // gravité jusqu'au sommet), une fois par saut.
    if (this.jumpCutAvailable && this.vy < 0 && !jumpHeld) {
      if (p.jumpReleaseMode >= 1) {
        this.releaseGravityActive = true;
      } else {
        this.vy *= p.jumpCutMultiplier;
      }
      this.jumpCutAvailable = false;
    }

    // Vertical : intégration exacte à gravité constante sur le pas (trapèze sur la vitesse).
    let gravity = this.vy < 0 ? d.riseGravity : d.fallGravity;
    if (this.releaseGravityActive && this.vy < 0) {
      gravity *= p.releaseGravityMultiplier;
    }
    // Flottement au sommet : Saut maintenu et vitesse verticale faible (D-19).
    if (
      p.apexHangSpeed > 0 &&
      jumpHeld &&
      !this.grounded &&
      this.vy > -p.apexHangSpeed &&
      this.vy < p.apexHangSpeed
    ) {
      gravity *= p.apexGravityMultiplier;
    }
    const startVy = this.vy;
    this.vy = Math.min(startVy + gravity * dt, p.maxFallSpeed);
    box.dy = (startVy + this.vy) * 0.5 * dt;
    box.dx = this.vx * dt;

    if (moveX(this.level, box)) {
      this.vx = 0;
    }
    box.passOneWay = this.dropStepsRemaining > 0;
    const hit = moveY(this.level, box);
    if (hit === HitY.Floor) {
      this.vy = 0;
    } else if (hit === HitY.Ceiling && !this.tryCornerCorrection(input)) {
      this.vy = 0;
      this.jumpCutAvailable = false;
      this.releaseGravityActive = false;
    }

    const wasGrounded = this.grounded;
    this.grounded = this.vy >= 0 && isGrounded(this.level, box, !box.passOneWay);
    if (this.dropStepsRemaining > 0) {
      this.dropStepsRemaining--;
    }
    if (this.vy >= 0) {
      this.jumpCutAvailable = false;
      this.releaseGravityActive = false;
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
    if (this.hurtSteps > 0) {
      this.hurtSteps--;
    }
    this.state = nextPlayerState(
      this.state,
      this.grounded,
      this.vy < 0,
      this.vx !== 0 || moveInput !== 0,
      this.landStepsRemaining,
      this.hurtSteps > 0,
    );
  }

  /**
   * En montée contre un coin de plafond, décale horizontalement de quelques pixels si cela libère
   * le passage : un saut qui frôle un coin n'est pas stoppé net (précision avant réalisme).
   * La hauteur visée est `prevY + box.dy` (moveX ne modifie pas y).
   */
  private tryCornerCorrection(input: PlayerInput): boolean {
    const box = this.box;
    const blockedX = box.x;
    const blockedY = box.y;
    const targetY = this.prevY + box.dy;
    const preferred = input.moveX < 0 ? -1 : 1;
    for (let offset = 1; offset <= this.params.cornerCorrectionPx; offset++) {
      for (let side = 0; side < 2; side++) {
        box.x = blockedX + (side === 0 ? preferred : -preferred) * offset;
        box.y = blockedY;
        if (!isBoxFree(this.level, box)) {
          continue;
        }
        box.y = targetY;
        if (isBoxFree(this.level, box)) {
          box.y = blockedY;
          box.dy = targetY - blockedY;
          moveY(this.level, box);
          return true;
        }
      }
    }
    box.x = blockedX;
    box.y = blockedY;
    return false;
  }
}
