import { TILE_SIZE } from './display';

/**
 * Paramètres de mouvement de Céleste.
 *
 * PROVISOIRE : valeurs de départ (spec §14), à régler par essais sur téléphone avec l'overlay de
 * debug (build /Maria/debug/), puis à reporter ici via l'export JSON. Aucune n'est définitive (§45).
 */
export interface MovementParams {
  /** Vitesse horizontale maximale au sol et en l'air (px/s). */
  maxRunSpeed: number;
  /** Accélération au sol vers la vitesse visée (px/s²). */
  groundAcceleration: number;
  /** Décélération au sol sans entrée (px/s²). */
  groundDeceleration: number;
  /** Accélération au sol quand l'entrée est opposée à la vitesse (demi-tour, px/s²). */
  groundTurnAcceleration: number;
  /** Accélération en l'air (contrôle aérien, px/s²). */
  airAcceleration: number;
  /** Décélération en l'air sans entrée (px/s²). */
  airDeceleration: number;
  /** Accélération en l'air quand l'entrée est opposée à la vitesse (px/s²). */
  airTurnAcceleration: number;
  /** Hauteur d'un saut complet (tuiles), bouton maintenu jusqu'au sommet. */
  jumpHeightTiles: number;
  /** Durée de montée d'un saut complet (s). Avec la hauteur, fixe la gravité et l'impulsion. */
  jumpTimeToApex: number;
  /** Multiplicateur de gravité en descente (> 1 : chute plus franche que la montée). */
  fallGravityMultiplier: number;
  /** Facteur appliqué à la vitesse de montée quand le bouton est relâché (hauteur variable). */
  jumpCutMultiplier: number;
  /**
   * Relâchement du saut (D-19) : 0 = coupure de la vitesse (`jumpCutMultiplier`, Phase 1) ;
   * 1 = gravité multipliée par `releaseGravityMultiplier` jusqu'au sommet (saut court plus arrondi).
   */
  jumpReleaseMode: number;
  /** Multiplicateur de gravité en montée après le relâchement (mode 1). */
  releaseGravityMultiplier: number;
  /**
   * Flottement au sommet (D-19) : sous cette vitesse verticale (px/s), Saut maintenu, la gravité est
   * multipliée par `apexGravityMultiplier`. 0 = désactivé. Le saut complet monte un peu plus haut.
   */
  apexHangSpeed: number;
  /** Multiplicateur de gravité pendant le flottement au sommet. */
  apexGravityMultiplier: number;
  /** Vitesse de chute maximale (px/s). */
  maxFallSpeed: number;
  /** Coyote time : saut encore permis après avoir quitté le sol (ms). */
  coyoteTimeMs: number;
  /** Jump buffering : pression mémorisée avant l'atterrissage (ms). */
  jumpBufferMs: number;
  /** Décalage horizontal maximal pour contourner un coin de plafond pendant la montée (px). */
  cornerCorrectionPx: number;
  /** Durée de l'état Land (visuel uniquement, ne bloque pas le contrôle, ms). */
  landDurationMs: number;
  /** Axe vertical (0–1) au-delà duquel « Bas + Saut » traverse une plateforme traversable. */
  dropInputThreshold: number;
  /** Durée pendant laquelle les plateformes traversables sont ignorées après « Bas + Saut » (ms). */
  dropThroughMs: number;
  /**
   * Grimper aux rebords (D-26) : un bord est attrapé si son dessus est au plus à cette distance
   * au-dessus du haut de la hitbox (px, les mains dépassent un peu de la tête).
   */
  ledgeGrabAbovePx: number;
  /**
   * … et au plus à cette distance sous le haut de la hitbox (px). Les pieds sont alors nettement
   * sous le bord : un saut qui suffisait pour s'y poser n'est jamais interrompu.
   */
  ledgeGrabBelowPx: number;
  /** Distance maximale entre la hitbox et le mur pour attraper le bord (px). */
  ledgeGrabSidePx: number;
  /** Axe (0–1) au-delà duquel on pousse vers le bord (accrocher, se hisser) ou on le quitte. */
  ledgeInputThreshold: number;
  /** Suspendue, le haut de la hitbox dépasse le bord de cette hauteur (px). */
  ledgeHangOffsetPx: number;
  /**
   * Durée minimale de suspension avant de se hisser en poussant vers le bord ou vers le haut (ms).
   * Saut hisse tout de suite.
   */
  ledgeHangMinMs: number;
  /** Durée du hissage, de la suspension à debout sur le rebord (ms). */
  ledgeClimbMs: number;
  /** Après avoir lâché un bord, délai avant de pouvoir se raccrocher (ms). */
  ledgeRegrabMs: number;
  /**
   * Saut mural (D-44) : axe (0–1) au-delà duquel on pousse vers un mur (glissade, appui du saut).
   * Plus haut que celui de l'escalade : une diagonale molle ne fait pas glisser.
   */
  wallInputThreshold: number;
  /** Vitesse de chute maximale pendant la glissade contre un mur (px/s). */
  wallSlideSpeed: number;
  /** Hauteur d'un saut mural complet (tuiles), bouton maintenu. */
  wallJumpHeightTiles: number;
  /** Vitesse horizontale donnée par le saut mural, à l'opposé du mur (px/s). */
  wallJumpSpeedX: number;
  /** Après un saut mural, durée pendant laquelle la direction est ignorée (ms). */
  wallJumpLockMs: number;
  /** Saut mural encore permis après avoir quitté le contact du mur (ms). */
  wallCoyoteMs: number;
  /**
   * Parapluie (D-62, D-65) : il s'ouvre au sommet d'un saut tenu, ou par une nouvelle pression de
   * Saut en l'air ; tant que Saut est tenu, la chute est ramenée à cette vitesse (px/s).
   */
  glideFallSpeed: number;
  /** Freinage de la chute à l'ouverture du parapluie (px/s²), jusqu'à `glideFallSpeed`. */
  glideBrake: number;
  /** Délai entre le sommet d'un saut tenu depuis un câble et l'ouverture du parapluie (ms, D-65, D-70). */
  glideAutoDelayMs: number;
  /**
   * Crochet du parapluie (D-65) : en planant, le crochet s'accroche au câble qu'il croise. Hauteur
   * du crochet au-dessus du haut de la hitbox (px) : Céleste pend sous le câble.
   */
  cableHookAbovePx: number;
  /** Vitesse minimale le long d'un câble (px/s). */
  cableMinSpeed: number;
  /** Vitesse maximale le long d'un câble (px/s). */
  cableMaxSpeed: number;
  /** Accélération le long d'un câble en pente, multipliée par sa pente (px/s²). */
  cableAccel: number;
  /** Pente (sinus) en dessous de laquelle un câble est plat : on y garde son sens d'arrivée. */
  cableFlatSlope: number;
  /** Après avoir lâché un câble, délai pendant lequel une pression de Saut fait sauter (ms). */
  cableJumpWindowMs: number;
  /** Hauteur d'un saut depuis un câble (tuiles), bouton maintenu. */
  cableJumpHeightTiles: number;
  /**
   * Glissade (D-84) : au sol, le bouton Capacité lance Céleste, couchée, à cette vitesse (px/s),
   * dans le sens où elle regarde (ou où l'on pousse).
   */
  slideSpeed: number;
  /** Durée de la poussée de la glissade (ms). La distance est `slideSpeed × slideDurationMs`. */
  slideDurationMs: number;
  /** Hauteur de la hitbox couchée (px) : moins d'une tuile, elle passe sous un obstacle bas. */
  slideHeightPx: number;
  /** Sous un plafond trop bas pour se relever, Céleste avance couchée à cette vitesse (px/s). */
  slideCrawlSpeed: number;
  /** Vitesse horizontale d'un saut depuis la glissade (px/s), gardée jusqu'au sol : saut long. */
  slideJumpSpeedX: number;
  /** Délai entre la fin d'une glissade et la suivante (ms). */
  slideCooldownMs: number;
  /** Pression du bouton Capacité mémorisée avant l'atterrissage (ms). */
  slideBufferMs: number;
}

export const DEFAULT_MOVEMENT: Readonly<MovementParams> = {
  maxRunSpeed: 136,
  groundAcceleration: 1400,
  groundDeceleration: 1800,
  groundTurnAcceleration: 2600,
  airAcceleration: 1000,
  airDeceleration: 600,
  airTurnAcceleration: 1600,
  jumpHeightTiles: 3.5,
  jumpTimeToApex: 0.36,
  fallGravityMultiplier: 1.6,
  jumpCutMultiplier: 0.5,
  jumpReleaseMode: 0,
  releaseGravityMultiplier: 3,
  apexHangSpeed: 0,
  apexGravityMultiplier: 0.5,
  maxFallSpeed: 380,
  coyoteTimeMs: 100,
  jumpBufferMs: 100,
  cornerCorrectionPx: 4,
  landDurationMs: 80,
  dropInputThreshold: 0.6,
  dropThroughMs: 100,
  ledgeGrabAbovePx: 6,
  ledgeGrabBelowPx: 10,
  ledgeGrabSidePx: 2,
  ledgeInputThreshold: 0.3,
  ledgeHangOffsetPx: 3,
  ledgeHangMinMs: 120,
  ledgeClimbMs: 240,
  ledgeRegrabMs: 250,
  wallInputThreshold: 0.5,
  wallSlideSpeed: 60,
  wallJumpHeightTiles: 2.5,
  wallJumpSpeedX: 150,
  wallJumpLockMs: 130,
  wallCoyoteMs: 80,
  glideFallSpeed: 50,
  glideBrake: 1600,
  glideAutoDelayMs: 40,
  cableHookAbovePx: 6,
  cableMinSpeed: 110,
  cableMaxSpeed: 240,
  cableAccel: 600,
  cableFlatSlope: 0.1,
  cableJumpWindowMs: 120,
  cableJumpHeightTiles: 2,
  slideSpeed: 230,
  slideDurationMs: 240,
  slideHeightPx: 12,
  slideCrawlSpeed: 70,
  slideJumpSpeedX: 190,
  slideCooldownMs: 250,
  slideBufferMs: 100,
};

/** Bornes des réglages en direct de l'overlay de debug. */
export const MOVEMENT_PARAM_RANGES: Readonly<
  Record<keyof MovementParams, { min: number; max: number; step: number }>
> = {
  maxRunSpeed: { min: 40, max: 320, step: 1 },
  groundAcceleration: { min: 100, max: 6000, step: 50 },
  groundDeceleration: { min: 100, max: 6000, step: 50 },
  groundTurnAcceleration: { min: 100, max: 8000, step: 50 },
  airAcceleration: { min: 0, max: 6000, step: 50 },
  airDeceleration: { min: 0, max: 6000, step: 50 },
  airTurnAcceleration: { min: 0, max: 8000, step: 50 },
  jumpHeightTiles: { min: 0.5, max: 8, step: 0.1 },
  jumpTimeToApex: { min: 0.15, max: 0.8, step: 0.01 },
  fallGravityMultiplier: { min: 0.5, max: 4, step: 0.05 },
  jumpCutMultiplier: { min: 0, max: 1, step: 0.05 },
  jumpReleaseMode: { min: 0, max: 1, step: 1 },
  releaseGravityMultiplier: { min: 1, max: 8, step: 0.1 },
  apexHangSpeed: { min: 0, max: 200, step: 5 },
  apexGravityMultiplier: { min: 0.1, max: 1, step: 0.05 },
  maxFallSpeed: { min: 100, max: 900, step: 10 },
  coyoteTimeMs: { min: 0, max: 250, step: 1 },
  jumpBufferMs: { min: 0, max: 250, step: 1 },
  cornerCorrectionPx: { min: 0, max: 8, step: 1 },
  landDurationMs: { min: 0, max: 300, step: 10 },
  dropInputThreshold: { min: 0.3, max: 0.95, step: 0.05 },
  dropThroughMs: { min: 20, max: 300, step: 10 },
  ledgeGrabAbovePx: { min: 0, max: 16, step: 1 },
  ledgeGrabBelowPx: { min: 0, max: 20, step: 1 },
  ledgeGrabSidePx: { min: 0, max: 6, step: 1 },
  ledgeInputThreshold: { min: 0.1, max: 0.9, step: 0.05 },
  ledgeHangOffsetPx: { min: 0, max: 12, step: 1 },
  ledgeHangMinMs: { min: 0, max: 500, step: 10 },
  ledgeClimbMs: { min: 60, max: 600, step: 10 },
  ledgeRegrabMs: { min: 0, max: 800, step: 10 },
  wallInputThreshold: { min: 0.1, max: 0.95, step: 0.05 },
  wallSlideSpeed: { min: 10, max: 380, step: 5 },
  wallJumpHeightTiles: { min: 0.5, max: 6, step: 0.1 },
  wallJumpSpeedX: { min: 40, max: 400, step: 5 },
  wallJumpLockMs: { min: 0, max: 400, step: 10 },
  wallCoyoteMs: { min: 0, max: 250, step: 5 },
  glideFallSpeed: { min: 10, max: 380, step: 5 },
  glideBrake: { min: 100, max: 6000, step: 50 },
  glideAutoDelayMs: { min: 0, max: 300, step: 5 },
  cableHookAbovePx: { min: 0, max: 16, step: 1 },
  cableMinSpeed: { min: 20, max: 400, step: 5 },
  cableMaxSpeed: { min: 40, max: 600, step: 5 },
  cableAccel: { min: 0, max: 3000, step: 25 },
  cableFlatSlope: { min: 0, max: 0.5, step: 0.01 },
  cableJumpWindowMs: { min: 0, max: 300, step: 5 },
  cableJumpHeightTiles: { min: 0.5, max: 5, step: 0.1 },
  slideSpeed: { min: 60, max: 500, step: 5 },
  slideDurationMs: { min: 60, max: 600, step: 10 },
  slideHeightPx: { min: 8, max: 15, step: 1 },
  slideCrawlSpeed: { min: 20, max: 200, step: 5 },
  slideJumpSpeedX: { min: 60, max: 400, step: 5 },
  slideCooldownMs: { min: 0, max: 1000, step: 10 },
  slideBufferMs: { min: 0, max: 250, step: 5 },
};

/** Hissé sur un rebord, Céleste se tient à cette distance du bord (px), bien posée. */
export const LEDGE_STAND_INSET_PX = 2;
/** Part du hissage consacrée à la montée ; le reste avance sur le rebord. */
export const LEDGE_CLIMB_RISE_SHARE = 0.6;

/** Hitbox de Céleste (px, PROVISOIRE). Largeur < 1 tuile, hauteur < 2 tuiles : passe dans un couloir de 2. */
export const PLAYER_HITBOX = { width: 12, height: 22 } as const;

/** Fréquence de la simulation à pas fixe (décision D-05). */
export const PHYSICS_STEP_HZ = 120;
/** Nombre maximal de pas par image ; au-delà, le temps en retard est abandonné (évite la spirale). */
export const MAX_STEPS_PER_FRAME = 8;

/** Valeurs dérivées, exprimées pour un pas de simulation. Recalculées quand un paramètre change. */
export interface DerivedMovement {
  /** Durée d'un pas (s). */
  dt: number;
  /** Gravité en montée (px/s², vers le bas). */
  riseGravity: number;
  /** Gravité en descente (px/s²). */
  fallGravity: number;
  /** Vitesse initiale d'un saut (px/s, positive, appliquée vers le haut). */
  jumpVelocity: number;
  coyoteSteps: number;
  jumpBufferSteps: number;
  landSteps: number;
  dropSteps: number;
  ledgeHangMinSteps: number;
  ledgeClimbSteps: number;
  ledgeRegrabSteps: number;
  /** Vitesse initiale d'un saut mural (px/s, vers le haut), sous la gravité de montée. */
  wallJumpVelocity: number;
  wallJumpLockSteps: number;
  wallCoyoteSteps: number;
  /** Pas entre le sommet d'un saut tenu depuis un câble et l'ouverture du parapluie (D-65, D-70). */
  glideAutoDelaySteps: number;
  /** Pas après avoir lâché un câble pendant lesquels Saut fait sauter (D-65). */
  cableJumpSteps: number;
  /** Vitesse initiale d'un saut depuis un câble (px/s, vers le haut). */
  cableJumpVelocity: number;
  /** Pas de poussée d'une glissade (D-84). */
  slideSteps: number;
  slideCooldownSteps: number;
  slideBufferSteps: number;
}

export function msToSteps(ms: number, stepHz: number = PHYSICS_STEP_HZ): number {
  return Math.round((ms * stepHz) / 1000);
}

/** Calcule les valeurs par pas. Saut : h = v²/2g et t = v/g, donc g = 2h/t² et v = 2h/t. */
export function deriveMovement(
  params: Readonly<MovementParams>,
  stepHz: number = PHYSICS_STEP_HZ,
  out: DerivedMovement = {
    dt: 0,
    riseGravity: 0,
    fallGravity: 0,
    jumpVelocity: 0,
    coyoteSteps: 0,
    jumpBufferSteps: 0,
    landSteps: 0,
    dropSteps: 0,
    ledgeHangMinSteps: 0,
    ledgeClimbSteps: 0,
    ledgeRegrabSteps: 0,
    wallJumpVelocity: 0,
    wallJumpLockSteps: 0,
    wallCoyoteSteps: 0,
    glideAutoDelaySteps: 0,
    cableJumpSteps: 0,
    cableJumpVelocity: 0,
    slideSteps: 0,
    slideCooldownSteps: 0,
    slideBufferSteps: 0,
  },
): DerivedMovement {
  const heightPx = params.jumpHeightTiles * TILE_SIZE;
  const t = params.jumpTimeToApex;
  out.dt = 1 / stepHz;
  out.riseGravity = (2 * heightPx) / (t * t);
  out.fallGravity = out.riseGravity * params.fallGravityMultiplier;
  out.jumpVelocity = (2 * heightPx) / t;
  out.coyoteSteps = msToSteps(params.coyoteTimeMs, stepHz);
  out.jumpBufferSteps = msToSteps(params.jumpBufferMs, stepHz);
  out.landSteps = msToSteps(params.landDurationMs, stepHz);
  out.dropSteps = msToSteps(params.dropThroughMs, stepHz);
  out.ledgeHangMinSteps = msToSteps(params.ledgeHangMinMs, stepHz);
  out.ledgeClimbSteps = Math.max(1, msToSteps(params.ledgeClimbMs, stepHz));
  out.ledgeRegrabSteps = msToSteps(params.ledgeRegrabMs, stepHz);
  out.wallJumpVelocity = Math.sqrt(2 * out.riseGravity * params.wallJumpHeightTiles * TILE_SIZE);
  out.wallJumpLockSteps = msToSteps(params.wallJumpLockMs, stepHz);
  out.wallCoyoteSteps = msToSteps(params.wallCoyoteMs, stepHz);
  out.glideAutoDelaySteps = msToSteps(params.glideAutoDelayMs, stepHz);
  out.cableJumpSteps = msToSteps(params.cableJumpWindowMs, stepHz);
  out.cableJumpVelocity = Math.sqrt(2 * out.riseGravity * params.cableJumpHeightTiles * TILE_SIZE);
  out.slideSteps = Math.max(1, msToSteps(params.slideDurationMs, stepHz));
  out.slideCooldownSteps = msToSteps(params.slideCooldownMs, stepHz);
  out.slideBufferSteps = msToSteps(params.slideBufferMs, stepHz);
  return out;
}
