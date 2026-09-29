/**
 * Effets du monde étrange (D-35) : présages, scintillements, tremblements, animations d'ambiance.
 * PROVISOIRE : à régler sur téléphone. Rien ici ne touche à la collision ni au mouvement (pilier 1) :
 * tout ce qui bouge est purement visuel, en arrière du plan de jeu ou à faible opacité.
 */
export const STRANGE_FX = {
  /** Présage : voile turquoise froid (opacité maximale au sommet). */
  omenTint: 0.22,
  omenTintColor: 0x1d4f55,
  /** Présage : la lumière vacille (assombrissement maximal d'un vacillement), au-delà de ce seuil. */
  omenFlicker: 0.18,
  omenFlickerFrom: 0.2,
  /** Présage : tremblement continu (px logiques) au sommet, à partir de ce seuil. */
  omenShakePx: 1.2,
  omenShakeFrom: 0.5,
  /** Tremblement d'un script : amplitude (px logiques) pour une force de 1. */
  shakePx: 2.5,
  /** Scintillements : nombre maximal à l'écran, durée de vie (ms), taille (px). */
  sparkleCount: 28,
  sparkleLifeMs: 900,
  sparkleSize: 8,
  /** Poussière qui monte : nombre, vitesse (px/s), durée de vie (ms). */
  dustCount: 22,
  dustRisePxPerS: 9,
  dustLifeMs: 6000,
  /** Objets de la maison qui dérivent (arrière-plan) : nombre, vitesse (px/s), opacité. */
  driftCount: 4,
  driftPxPerS: 6,
  driftAlpha: 0.38,
  /** Marge vide (tuiles) autour d'un objet à la dérive : jamais près d'une surface. */
  driftClearTiles: 2,
  /** Horloge : l'aiguille recule par à-coups (angle, période). */
  clockTickRad: 0.35,
  clockTickMs: 900,
  /** Rideaux : amplitude de l'ondulation et période (ms). */
  curtainSway: 0.12,
  curtainMs: 3400,
  /** Lampe : vacillement irrégulier (opacité minimale du halo supplémentaire). */
  lampFlickerMin: 0.15,
  /** Lueur sous les meubles qui flottent : respiration (période, amplitude). */
  glowBreathMs: 4200,
  glowBreath: 0.35,
  /** Yeux : fermeture quand Céleste approche, réouverture plus loin (tuiles), délai (ms). */
  eyesCloseTiles: 5,
  eyesOpenTiles: 8,
  eyesReopenMs: 2500,
  /** Yeux : clignement spontané (intervalle moyen, durée, ms). */
  eyesBlinkEveryMs: 4200,
  eyesBlinkMs: 160,
} as const;
