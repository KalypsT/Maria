import { TILE_SIZE as T } from '../../config/display';
import {
  LEDGE_CLIMB_RISE_SHARE,
  LEDGE_STAND_INSET_PX,
  PLAYER_HITBOX,
  deriveMovement,
  type DerivedMovement,
  type MovementParams,
} from '../../config/movement';
import { Tile, tileAt, type LevelData } from '../level/LevelData';
import {
  HitY,
  isBoxFree,
  isGrounded,
  moveX,
  moveY,
  touchesHazard,
  type Box,
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
 * Saut mural (D-44) : le mur est touché si une tuile pleine est à cette distance du côté de la
 * hitbox (px), à hauteur des mains (`WALL_GRIP_FROM_TOP_PX` sous le haut de la hitbox).
 */
const WALL_CONTACT_PX = 1;
const WALL_GRIP_FROM_TOP_PX = 4;

/** Rebord (D-26) : rien, suspendue, en train de se hisser. */
const Ledge = { None: 0, Hang: 1, Climb: 2 } as const;
type Ledge = (typeof Ledge)[keyof typeof Ledge];

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
  /** Capacité « grimper aux rebords » acquise (D-26). Sans elle, le mouvement est inchangé. */
  canClimb = false;
  /** Capacité « saut mural » acquise (D-44). Sans elle, le mouvement est inchangé. */
  canWallJump = false;
  /** Côté du mur touché en poussant vers lui à la fin du dernier pas (1 : à droite), 0 sinon. */
  wallDir = 0;
  /** Pas écoulés depuis le dernier contact avec un mur (tolérance du saut mural). */
  private stepsSinceWall = NEVER;
  /** Dernier mur touché : côté et colonne de sa tuile. */
  private lastWallDir = 0;
  private lastWallCol = 0;
  /** Pas restants pendant lesquels la direction est ignorée, après un saut mural. */
  private wallLockSteps = 0;
  /**
   * Mur quitté par le dernier saut mural (côté, colonne) : il ne retient plus Céleste avant
   * qu'elle ait touché le sol, un rebord ou un autre mur. Un seul mur ne se remonte donc pas.
   */
  private noCatchDir = 0;
  private noCatchCol = 0;
  private ledge: Ledge = Ledge.None;
  private ledgeSteps = 0;
  /** Côté du rebord (1 : à droite de Céleste). */
  private ledgeDir = 0;
  /** Suspendue : hitbox en (ledgeHangX, ledgeHangY) ; debout sur le rebord : (ledgeStandX, ledgeStandY). */
  private ledgeHangX = 0;
  private ledgeHangY = 0;
  private ledgeStandX = 0;
  private ledgeStandY = 0;
  private regrabSteps = 0;
  /** Hitbox d'essai des positions de rebord (réutilisée : aucune allocation). */
  private readonly probe: Box = { x: 0, y: 0, width: 0, height: 0 };
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
    hitbox: Readonly<{ width: number; height: number }> = PLAYER_HITBOX,
  ) {
    this.params = { ...params };
    this.derived = deriveMovement(this.params);
    this.box = {
      x,
      y,
      width: hitbox.width,
      height: hitbox.height,
      dx: 0,
      dy: 0,
      passOneWay: false,
    };
    this.probe.width = hitbox.width;
    this.probe.height = hitbox.height;
    this.prevX = x;
    this.prevY = y;
    this.grounded = isGrounded(level, this.box);
    this.stepsSinceGrounded = this.grounded ? 0 : NEVER;
    this.state = this.grounded ? PlayerState.Idle : PlayerState.Fall;
  }

  /** Suspendue à un rebord ou en train de s'y hisser (pas d'attaque, pas de gravité). */
  get onLedge(): boolean {
    return this.ledge !== Ledge.None;
  }

  get movement(): Readonly<MovementParams> {
    return this.params;
  }

  /** Applique de nouveaux paramètres (réglage en direct). */
  setParams(params: Readonly<MovementParams>): void {
    Object.assign(this.params, params);
    deriveMovement(this.params, undefined, this.derived);
  }

  /**
   * Change la taille de la hitbox (croissance, D-43), pieds et centre à la même place. À appeler
   * seulement là où la place suffit (pendant un noir, avant `reset` à un point sûr).
   */
  setHitbox(hitbox: Readonly<{ width: number; height: number }>): void {
    const box = this.box;
    box.x += (box.width - hitbox.width) / 2;
    box.y += box.height - hitbox.height;
    box.width = this.probe.width = hitbox.width;
    box.height = this.probe.height = hitbox.height;
    this.prevX = box.x;
    this.prevY = box.y;
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
    this.ledge = Ledge.None;
    this.ledgeSteps = 0;
    this.regrabSteps = 0;
    this.clearWall();
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
    this.canClimb = other.canClimb;
    this.ledge = other.ledge;
    this.ledgeSteps = other.ledgeSteps;
    this.ledgeDir = other.ledgeDir;
    this.ledgeHangX = other.ledgeHangX;
    this.ledgeHangY = other.ledgeHangY;
    this.ledgeStandX = other.ledgeStandX;
    this.ledgeStandY = other.ledgeStandY;
    this.regrabSteps = other.regrabSteps;
    this.canWallJump = other.canWallJump;
    this.wallDir = other.wallDir;
    this.stepsSinceWall = other.stepsSinceWall;
    this.lastWallDir = other.lastWallDir;
    this.lastWallCol = other.lastWallCol;
    this.wallLockSteps = other.wallLockSteps;
    this.noCatchDir = other.noCatchDir;
    this.noCatchCol = other.noCatchCol;
  }

  /** Oublie tout contact avec un mur (sol, rebord, remise à zéro, coup reçu). */
  private clearWall(): void {
    this.wallDir = 0;
    this.stepsSinceWall = NEVER;
    this.wallLockSteps = 0;
    this.noCatchDir = 0;
  }

  /** En glissade contre un mur (D-44). */
  get wallSliding(): boolean {
    return this.state === PlayerState.WallSlide;
  }

  /** Colonne de la tuile du dernier mur touché (analyse de faisabilité). */
  get wallCol(): number {
    return this.lastWallCol;
  }

  /**
   * Mur quitté par le dernier saut mural, qui ne retient plus Céleste, résumé en un entier (0 :
   * aucun). Sert à distinguer deux appuis en apparence identiques dans l'analyse de faisabilité.
   */
  get releasedWall(): number {
    return this.noCatchDir === 0 ? 0 : this.noCatchDir * (this.noCatchCol + 1);
  }

  /**
   * Touchée (D-20) : le recul est déjà écrit dans `vx` / `vy` par l'appelant (aucun flottant en
   * argument) ; pendant `steps` pas, direction et saut sont ignorés.
   */
  startHurt(steps: number): void {
    this.ledge = Ledge.None;
    this.clearWall();
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
    if (this.ledge !== Ledge.None) {
      this.stepLedge(input);
      return;
    }

    // Touchée : direction et saut ignorés pendant la perte de contrôle.
    const hurt = this.hurtSteps > 0;
    const jumpPressed = input.jumpPressed && !hurt;
    const jumpHeld = input.jumpHeld && !hurt;

    // Horizontal : accélération vers la vitesse visée, demi-tour plus vif, décélération sans entrée.
    // Juste après un saut mural, la direction est ignorée et l'élan conservé (D-44).
    const locked = this.wallLockSteps > 0;
    const moveInput = hurt || locked ? 0 : input.moveX;
    let accel: number;
    if (locked) {
      accel = 0;
    } else if (moveInput !== 0) {
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
    } else if (
      this.canWallJump &&
      !this.grounded &&
      this.stepsSinceJumpPressed <= d.jumpBufferSteps &&
      this.stepsSinceWall <= d.wallCoyoteSteps
    ) {
      // Saut mural (D-44) : impulsion en diagonale, à l'opposé du dernier mur touché.
      const away = -this.lastWallDir;
      this.vx = away * p.wallJumpSpeedX;
      this.vy = -d.wallJumpVelocity;
      this.facing = away;
      this.wallLockSteps = d.wallJumpLockSteps;
      this.noCatchDir = this.lastWallDir;
      this.noCatchCol = this.lastWallCol;
      this.wallDir = 0;
      this.stepsSinceWall = NEVER;
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
    // Glissade (D-44) : en descente, contre le mur touché au pas précédent, en poussant toujours
    // vers lui : la chute est aussitôt ramenée à la vitesse de glissade.
    let maxFall = p.maxFallSpeed;
    if (
      this.wallDir !== 0 &&
      this.vy >= 0 &&
      moveInput * this.wallDir >= p.wallInputThreshold &&
      !this.grounded
    ) {
      maxFall = p.wallSlideSpeed;
      if (this.vy > maxFall) {
        this.vy = maxFall;
      }
    }
    const startVy = this.vy;
    this.vy = Math.min(startVy + gravity * dt, maxFall);
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
    if (this.wallLockSteps > 0) {
      this.wallLockSteps--;
    }
    if (this.grounded) {
      this.noCatchDir = 0;
    }
    this.updateWallContact(moveInput, hurt);
    if (this.regrabSteps > 0) {
      this.regrabSteps--;
    } else if (this.canClimb && !hurt && !this.grounded && this.vy >= 0 && this.tryGrab(input)) {
      return;
    }
    this.state = nextPlayerState(
      this.state,
      this.grounded,
      this.vy < 0,
      this.vx !== 0 || moveInput !== 0,
      this.landStepsRemaining,
      this.hurtSteps > 0,
      this.wallDir !== 0,
    );
    if (this.state === PlayerState.WallSlide) {
      // Dos au mur, tournée vers le côté où elle va rebondir.
      this.facing = -this.wallDir;
    }
  }

  /**
   * Contact avec un mur (D-44) : en l'air, en poussant vers une tuile pleine touchée à hauteur des
   * mains. Sert à la glissade (pas suivant) et au saut mural, avec une courte tolérance après
   * l'avoir quitté. Le mur quitté par le dernier saut mural ne compte pas.
   */
  private updateWallContact(moveInput: number, hurt: boolean): void {
    const p = this.params;
    const dir = moveInput >= p.wallInputThreshold ? 1 : moveInput <= -p.wallInputThreshold ? -1 : 0;
    this.wallDir = 0;
    if (this.canWallJump && !hurt && !this.grounded && dir !== 0) {
      const box = this.box;
      const col =
        dir > 0
          ? Math.floor((box.x + box.width + WALL_CONTACT_PX) / T)
          : Math.floor((box.x - WALL_CONTACT_PX) / T);
      const row = Math.floor((box.y + WALL_GRIP_FROM_TOP_PX) / T);
      if (
        tileAt(this.level, col, row) === Tile.Solid &&
        (dir !== this.noCatchDir || col !== this.noCatchCol)
      ) {
        this.wallDir = dir;
        this.lastWallDir = dir;
        this.lastWallCol = col;
        this.stepsSinceWall = 0;
        return;
      }
    }
    if (this.stepsSinceWall < NEVER) {
      this.stepsSinceWall++;
    }
  }

  /**
   * En descente contre un mur, en poussant vers lui : attrape le bord d'une tuile pleine dont le
   * dessus est à hauteur des mains (D-26). Le hissage est vérifié d'avance (passage libre, rebord
   * praticable) : une fois accrochée, Céleste ne peut pas se coincer.
   */
  private tryGrab(input: PlayerInput): boolean {
    const p = this.params;
    const threshold = p.ledgeInputThreshold;
    const dir = input.moveX >= threshold ? 1 : input.moveX <= -threshold ? -1 : 0;
    if (dir === 0) {
      return false;
    }
    const level = this.level;
    const box = this.box;
    const probe = this.probe;
    const col =
      dir > 0
        ? Math.floor((box.x + box.width + p.ledgeGrabSidePx) / T)
        : Math.floor((box.x - p.ledgeGrabSidePx) / T);
    const rowFrom = Math.ceil((box.y - p.ledgeGrabAbovePx) / T);
    const rowTo = Math.floor((box.y + p.ledgeGrabBelowPx) / T);
    for (let row = rowFrom; row <= rowTo; row++) {
      if (tileAt(level, col, row) !== Tile.Solid || tileAt(level, col, row - 1) === Tile.Solid) {
        continue;
      }
      const top = row * T;
      // Suspendue, contre le mur.
      probe.x = dir > 0 ? col * T - box.width : (col + 1) * T;
      probe.y = top - p.ledgeHangOffsetPx;
      if (!isBoxFree(level, probe)) {
        continue;
      }
      // Montée le long du mur, jusqu'au-dessus du bord.
      probe.y = top - box.height;
      if (!isBoxFree(level, probe)) {
        continue;
      }
      // Debout sur le rebord.
      probe.x =
        dir > 0 ? col * T + LEDGE_STAND_INSET_PX : (col + 1) * T - box.width - LEDGE_STAND_INSET_PX;
      if (
        !isBoxFree(level, probe) ||
        !isGrounded(level, probe, false) ||
        touchesHazard(level, probe)
      ) {
        continue;
      }
      this.ledge = Ledge.Hang;
      this.ledgeSteps = 0;
      this.ledgeDir = dir;
      this.clearWall();
      this.ledgeHangX = dir > 0 ? col * T - box.width : (col + 1) * T;
      this.ledgeHangY = top - p.ledgeHangOffsetPx;
      this.ledgeStandX = probe.x;
      this.ledgeStandY = top - box.height;
      box.x = this.ledgeHangX;
      box.y = this.ledgeHangY;
      this.vx = 0;
      this.vy = 0;
      this.facing = dir;
      this.grounded = false;
      this.stepsSinceGrounded = NEVER;
      this.stepsSinceJumpPressed = NEVER;
      this.jumpCutAvailable = false;
      this.releaseGravityActive = false;
      this.landStepsRemaining = 0;
      this.dropStepsRemaining = 0;
      box.passOneWay = false;
      this.state = PlayerState.Hang;
      return true;
    }
    return false;
  }

  /**
   * Suspendue : Saut hisse ; pousser vers le bord ou vers le haut hisse après un court instant ;
   * pousser vers le bas ou à l'opposé lâche. Hissage : montée puis avance sur le rebord, sur un
   * trajet vérifié à l'accroche (sans collision).
   */
  private stepLedge(input: PlayerInput): void {
    const p = this.params;
    const d = this.derived;
    const box = this.box;
    this.ledgeSteps++;
    if (this.ledge === Ledge.Hang) {
      const threshold = p.ledgeInputThreshold;
      const toward = input.moveX * this.ledgeDir >= threshold || input.moveY <= -threshold;
      const away = input.moveX * this.ledgeDir <= -threshold || input.moveY >= threshold;
      if (input.jumpPressed || (toward && this.ledgeSteps >= d.ledgeHangMinSteps)) {
        this.ledge = Ledge.Climb;
        this.ledgeSteps = 0;
        this.state = PlayerState.Climb;
      } else if (away) {
        this.ledge = Ledge.None;
        this.regrabSteps = d.ledgeRegrabSteps;
        this.state = PlayerState.Fall;
      }
      return;
    }
    const t = Math.min(1, this.ledgeSteps / d.ledgeClimbSteps);
    if (t < LEDGE_CLIMB_RISE_SHARE) {
      box.x = this.ledgeHangX;
      box.y = this.ledgeHangY + (this.ledgeStandY - this.ledgeHangY) * (t / LEDGE_CLIMB_RISE_SHARE);
    } else {
      box.y = this.ledgeStandY;
      box.x =
        this.ledgeHangX +
        (this.ledgeStandX - this.ledgeHangX) *
          ((t - LEDGE_CLIMB_RISE_SHARE) / (1 - LEDGE_CLIMB_RISE_SHARE));
    }
    if (t >= 1) {
      this.ledge = Ledge.None;
      this.grounded = isGrounded(this.level, box);
      this.stepsSinceGrounded = this.grounded ? 0 : NEVER;
      this.stepsSinceJumpPressed = NEVER;
      this.state = this.grounded ? PlayerState.Idle : PlayerState.Fall;
    }
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
