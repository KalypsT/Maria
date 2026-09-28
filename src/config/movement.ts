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
  maxFallSpeed: 380,
  coyoteTimeMs: 100,
  jumpBufferMs: 100,
  cornerCorrectionPx: 4,
  landDurationMs: 80,
  dropInputThreshold: 0.6,
  dropThroughMs: 100,
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
  maxFallSpeed: { min: 100, max: 900, step: 10 },
  coyoteTimeMs: { min: 0, max: 250, step: 1 },
  jumpBufferMs: { min: 0, max: 250, step: 1 },
  cornerCorrectionPx: { min: 0, max: 8, step: 1 },
  landDurationMs: { min: 0, max: 300, step: 10 },
  dropInputThreshold: { min: 0.3, max: 0.95, step: 0.05 },
  dropThroughMs: { min: 20, max: 300, step: 10 },
};

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
  return out;
}
