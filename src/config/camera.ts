/**
 * Paramètres de la caméra (décision D-15, spec §37).
 *
 * PROVISOIRE : valeurs de départ, à régler sur téléphone avec l'overlay de debug. Toutes les
 * distances sont en px logiques du monde (une tuile = 16 px), indépendantes de la largeur d'écran.
 */
export interface CameraParams {
  /** Zoom (D-02) : 1 = 360 px de haut visibles. */
  zoom: number;
  /** Largeur de la zone morte horizontale, centrée (px). */
  deadZoneWidthPx: number;
  /** Constante de temps du suivi horizontal (ms) : plus petit = plus serré. */
  followTimeMs: number;
  /** Anticipation horizontale dans le sens de la course (px). */
  lookAheadPx: number;
  /** Vitesse horizontale au-delà de laquelle Céleste « court » pour l'anticipation (px/s). */
  lookAheadMinSpeed: number;
  /** Durée de course dans un même sens avant de déplacer l'anticipation (ms) : ignore les tapotements. */
  lookAheadDelayMs: number;
  /** Constante de temps du glissement de l'anticipation (ms). */
  lookAheadTimeMs: number;
  /** Hauteur du centre de la vue au-dessus des pieds de Céleste posée (px). */
  verticalOffsetPx: number;
  /** Montée au-dessus du dernier sol tolérée sans suivre (px) ; > hauteur de saut : un saut ne bouge pas la vue. */
  bandUpPx: number;
  /** Descente sous le dernier sol tolérée sans suivre (px). */
  bandDownPx: number;
  /** Constante de temps du recadrage vertical (ms), après un atterrissage. */
  verticalTimeMs: number;
  /** Constante de temps du suivi vertical quand Céleste tombe sous la bande (ms) : serré, pour voir où elle va. */
  fallFollowTimeMs: number;
  /** Anticipation vers le bas pendant une grande chute (px). */
  fallLookAheadPx: number;
  /**
   * Chute sous le dernier sol qui déclenche l'anticipation vers le bas (px). Une distance plutôt
   * qu'une vitesse : un saut ordinaire retombe déjà à la vitesse de chute maximale.
   */
  fallLookTriggerPx: number;
  /** Constante de temps de l'anticipation de chute (ms). */
  fallLookTimeMs: number;
  /** Distance minimale garantie entre Céleste et les bords de la vue (px), sauf aux bords de la salle. */
  screenMarginPx: number;
  /** Regard haut/bas au joystick, à l'arrêt au sol : 1 activé, 0 désactivé. */
  lookEnabled: number;
  /** Distance du regard haut/bas (px). */
  lookDistancePx: number;
  /** Maintien avant que le regard haut/bas ne démarre (ms). */
  lookDelayMs: number;
  /** Constante de temps du regard haut/bas (ms). */
  lookTimeMs: number;
  /** Axe vertical (0–1) au-delà duquel le joystick compte comme « regarder ». */
  lookInputThreshold: number;
}

export const DEFAULT_CAMERA: Readonly<CameraParams> = {
  zoom: 1,
  deadZoneWidthPx: 24,
  followTimeMs: 90,
  lookAheadPx: 56,
  lookAheadMinSpeed: 60,
  lookAheadDelayMs: 250,
  lookAheadTimeMs: 450,
  verticalOffsetPx: 40,
  bandUpPx: 72,
  bandDownPx: 56,
  verticalTimeMs: 180,
  fallFollowTimeMs: 60,
  fallLookAheadPx: 96,
  fallLookTriggerPx: 64,
  fallLookTimeMs: 180,
  screenMarginPx: 40,
  lookEnabled: 0,
  lookDistancePx: 80,
  lookDelayMs: 350,
  lookTimeMs: 250,
  lookInputThreshold: 0.6,
};

/** Bornes des réglages en direct de l'overlay de debug. */
export const CAMERA_PARAM_RANGES: Readonly<
  Record<keyof CameraParams, { min: number; max: number; step: number }>
> = {
  // Pas de 0,25 : un zoom quelconque ferait scintiller les tuiles en pixel art (D-03).
  zoom: { min: 1, max: 3, step: 0.25 },
  deadZoneWidthPx: { min: 0, max: 160, step: 2 },
  followTimeMs: { min: 0, max: 500, step: 5 },
  lookAheadPx: { min: 0, max: 160, step: 2 },
  lookAheadMinSpeed: { min: 0, max: 200, step: 5 },
  lookAheadDelayMs: { min: 0, max: 1000, step: 10 },
  lookAheadTimeMs: { min: 0, max: 1500, step: 10 },
  verticalOffsetPx: { min: -80, max: 120, step: 2 },
  bandUpPx: { min: 0, max: 200, step: 2 },
  bandDownPx: { min: 0, max: 200, step: 2 },
  verticalTimeMs: { min: 0, max: 800, step: 5 },
  fallFollowTimeMs: { min: 0, max: 500, step: 5 },
  fallLookAheadPx: { min: 0, max: 160, step: 2 },
  fallLookTriggerPx: { min: 0, max: 320, step: 4 },
  fallLookTimeMs: { min: 0, max: 1500, step: 10 },
  screenMarginPx: { min: 0, max: 160, step: 2 },
  lookEnabled: { min: 0, max: 1, step: 1 },
  lookDistancePx: { min: 0, max: 160, step: 2 },
  lookDelayMs: { min: 0, max: 1500, step: 10 },
  lookTimeMs: { min: 0, max: 1000, step: 10 },
  lookInputThreshold: { min: 0.3, max: 0.95, step: 0.05 },
};
