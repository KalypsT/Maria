import type { CameraParams } from '../../config/camera';
import { PHYSICS_STEP_HZ } from '../../config/movement';
import type { Box } from '../physics/gridCollision';

/** Ce que la caméra suit : `PlayerPhysics` convient tel quel. */
export interface CameraSubject {
  readonly box: Box;
  readonly vx: number;
  readonly vy: number;
  readonly grounded: boolean;
}

/** Compteur « jamais » : grand entier, pour ne pas dépasser en incrémentant. */
const NEVER = 1 << 30;

/** Facteur de lissage exponentiel pour un pas : atteint 63 % de l'écart en `timeMs`, sans dépasser. */
function smoothingFactor(timeMs: number, stepHz: number): number {
  return timeMs <= 0 ? 1 : 1 - Math.exp(-1000 / (timeMs * stepHz));
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Caméra de platforming (décision D-15), indépendante de Phaser. `step` avance d'un pas fixe, au
 * même rythme que la simulation du joueur ; l'affichage interpole entre `prevX/prevY` et `x/y`.
 * `x`, `y` : centre de la vue dans le monde (px). Aucune allocation dans `step` (champs numériques
 * initialisés, aucun flottant passé en argument : l'entrée du regard passe par `lookInput`).
 */
export class CameraController {
  x = 0;
  y = 0;
  prevX = 0;
  prevY = 0;
  /** Taille de la vue dans le monde (px) : taille du jeu / zoom. */
  viewWidth = 0;
  viewHeight = 0;
  /** Axe vertical du joystick (-1 haut, 1 bas), écrit avant chaque pas. */
  lookInput = 0;
  /** Hauteur des pieds servant de référence au cadrage vertical (dernier sol, ou bande). */
  refFeetY = 0;
  /** Hauteur des pieds au dernier contact avec le sol. */
  groundFeetY = 0;
  /** Décalage courant de l'anticipation horizontale (px). */
  lookAheadOffset = 0;
  private lookAheadTarget = 0;
  private runDir = 0;
  private runSteps = 0;
  private fallOffset = 0;
  private lookOffset = 0;
  private lookSteps = 0;
  private boundsWidth = 0;
  private boundsHeight = 0;
  private kFollow = 1;
  private kLookAhead = 1;
  private kVertical = 1;
  private kFallFollow = 1;
  private wasGrounded = false;
  private kFall = 1;
  private kLook = 1;
  private lookAheadDelaySteps = 0;
  private lookDelaySteps = 0;
  private readonly params: CameraParams;

  constructor(
    params: Readonly<CameraParams>,
    private readonly stepHz: number = PHYSICS_STEP_HZ,
  ) {
    this.params = { ...params };
    this.setParams(params);
  }

  get settings(): Readonly<CameraParams> {
    return this.params;
  }

  /** Applique de nouveaux paramètres (réglage en direct). Appeler `setView` si le zoom change. */
  setParams(params: Readonly<CameraParams>): void {
    const p = Object.assign(this.params, params);
    const hz = this.stepHz;
    this.kFollow = smoothingFactor(p.followTimeMs, hz);
    this.kLookAhead = smoothingFactor(p.lookAheadTimeMs, hz);
    this.kVertical = smoothingFactor(p.verticalTimeMs, hz);
    this.kFallFollow = smoothingFactor(p.fallFollowTimeMs, hz);
    this.kFall = smoothingFactor(p.fallLookTimeMs, hz);
    this.kLook = smoothingFactor(p.lookTimeMs, hz);
    this.lookAheadDelaySteps = Math.round((p.lookAheadDelayMs * hz) / 1000);
    this.lookDelaySteps = Math.round((p.lookDelayMs * hz) / 1000);
  }

  /** Taille du jeu en px logiques (largeur variable, D-01) ; la vue dans le monde en tient compte avec le zoom. */
  setView(gameWidth: number, gameHeight: number): void {
    this.viewWidth = gameWidth / this.params.zoom;
    this.viewHeight = gameHeight / this.params.zoom;
    this.clampToBounds();
  }

  /** Taille de la salle (px). */
  setBounds(width: number, height: number): void {
    this.boundsWidth = width;
    this.boundsHeight = height;
    this.clampToBounds();
  }

  /** Cadre immédiatement le sujet, sans lissage (arrivée dans une salle, réapparition). */
  reset(subject: CameraSubject): void {
    const box = subject.box;
    const feet = box.y + box.height;
    this.runDir = 0;
    this.runSteps = 0;
    this.lookAheadTarget = 0;
    this.lookAheadOffset = 0;
    this.fallOffset = 0;
    this.lookOffset = 0;
    this.lookSteps = 0;
    this.wasGrounded = subject.grounded;
    this.refFeetY = feet;
    this.groundFeetY = feet;
    this.x = box.x + box.width / 2;
    this.y = feet - this.params.verticalOffsetPx;
    this.clampToMargins(box);
    this.clampToBounds();
    this.prevX = this.x;
    this.prevY = this.y;
  }

  step(subject: CameraSubject): void {
    const p = this.params;
    const box = subject.box;
    const centerX = box.x + box.width / 2;
    const feet = box.y + box.height;
    this.prevX = this.x;
    this.prevY = this.y;

    // Anticipation horizontale : seulement après une course soutenue dans un même sens. À l'arrêt,
    // elle reste en place (pas de recentrage parasite quand Céleste s'arrête).
    const vx = subject.vx;
    const dir = vx >= p.lookAheadMinSpeed ? 1 : vx <= -p.lookAheadMinSpeed ? -1 : 0;
    if (dir === 0) {
      this.runDir = 0;
      this.runSteps = 0;
    } else if (dir === this.runDir) {
      if (this.runSteps < NEVER) {
        this.runSteps++;
      }
    } else {
      this.runDir = dir;
      this.runSteps = 1;
    }
    if (this.runDir !== 0 && this.runSteps >= this.lookAheadDelaySteps) {
      this.lookAheadTarget = this.runDir * p.lookAheadPx;
    }
    this.lookAheadOffset += (this.lookAheadTarget - this.lookAheadOffset) * this.kLookAhead;

    // Horizontal : zone morte autour de la cible, puis lissage.
    const targetX = centerX + this.lookAheadOffset;
    const half = p.deadZoneWidthPx / 2;
    let desiredX = this.x;
    if (targetX > this.x + half) {
      desiredX = targetX - half;
    } else if (targetX < this.x - half) {
      desiredX = targetX + half;
    }
    this.x += (desiredX - this.x) * this.kFollow;

    // Vertical : la référence est le dernier sol ; en l'air elle ne bouge que si Céleste sort de la
    // bande (grande chute, montée d'une tour), jamais pendant un saut ordinaire.
    let falling = false;
    if (subject.grounded) {
      this.refFeetY = feet;
      this.groundFeetY = feet;
    } else if (feet > this.refFeetY + p.bandDownPx) {
      this.refFeetY = feet - p.bandDownPx;
      falling = true;
    } else if (feet < this.refFeetY - p.bandUpPx) {
      this.refFeetY = feet + p.bandUpPx;
    }
    const fallTarget =
      !subject.grounded && subject.vy > 0 && feet - this.groundFeetY >= p.fallLookTriggerPx
        ? p.fallLookAheadPx
        : 0;
    this.fallOffset += (fallTarget - this.fallOffset) * this.kFall;

    const look = this.lookInput;
    if (
      p.lookEnabled >= 1 &&
      subject.grounded &&
      vx === 0 &&
      (look >= p.lookInputThreshold || look <= -p.lookInputThreshold)
    ) {
      if (this.lookSteps < NEVER) {
        this.lookSteps++;
      }
    } else {
      this.lookSteps = 0;
    }
    const lookTarget =
      this.lookSteps > 0 && this.lookSteps >= this.lookDelaySteps
        ? (look > 0 ? 1 : -1) * p.lookDistancePx
        : 0;
    this.lookOffset += (lookTarget - this.lookOffset) * this.kLook;

    const restY = this.refFeetY - p.verticalOffsetPx + this.lookOffset;
    if (subject.grounded && !this.wasGrounded) {
      // Atterrissage : l'avance de chute restante est ramenée à la position actuelle de la vue,
      // qui remonte ensuite en douceur au lieu de descendre encore puis revenir.
      this.fallOffset = Math.max(0, Math.min(this.fallOffset, this.y - restY));
    }
    this.wasGrounded = subject.grounded;
    const targetY = restY + this.fallOffset;
    this.y += (targetY - this.y) * (falling ? this.kFallFollow : this.kVertical);

    this.clampToMargins(box);
    this.clampToBounds();
  }

  /** Garde Céleste à `screenMarginPx` des bords de la vue (le lissage ne doit jamais la perdre). */
  private clampToMargins(box: Box): void {
    const margin = this.params.screenMarginPx;
    const halfW = this.viewWidth / 2;
    const halfH = this.viewHeight / 2;
    if (halfW > margin + box.width) {
      this.x = clamp(this.x, box.x + box.width + margin - halfW, box.x - margin + halfW);
    }
    if (halfH > margin + box.height) {
      this.y = clamp(this.y, box.y + box.height + margin - halfH, box.y - margin + halfH);
    }
  }

  /** Reste dans la salle ; centrée sur un axe où la salle est plus petite que la vue. */
  private clampToBounds(): void {
    const halfW = this.viewWidth / 2;
    const halfH = this.viewHeight / 2;
    this.x =
      this.boundsWidth <= this.viewWidth
        ? this.boundsWidth / 2
        : clamp(this.x, halfW, this.boundsWidth - halfW);
    this.y =
      this.boundsHeight <= this.viewHeight
        ? this.boundsHeight / 2
        : clamp(this.y, halfH, this.boundsHeight - halfH);
  }
}
