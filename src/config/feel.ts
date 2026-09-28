/**
 * Sensations visuelles de Céleste (passe de fluidité) : n'agissent que sur l'affichage, jamais sur
 * la physique. PROVISOIRE : désactivées par défaut, à comparer sur téléphone avec l'overlay.
 */
export interface FeelParams {
  /** Écrasement / étirement et inclinaison : 1 activé, 0 désactivé. */
  squashEnabled: number;
  /** Étirement vertical au décollage (fraction de la taille). */
  jumpStretch: number;
  /** Écrasement maximal à la réception (fraction), atteint à la vitesse de chute maximale. */
  landSquash: number;
  /** Vitesse d'impact sous laquelle la réception n'écrase pas (px/s). */
  landSquashMinSpeed: number;
  /** Écrasement au demi-tour au sol (fraction). */
  turnSquash: number;
  /** Fréquence du ressort de retour à la forme (Hz). */
  springHz: number;
  /** Amortissement du ressort (1 = sans rebond, < 1 = retour élastique). */
  springDamping: number;
  /** Inclinaison en course à pleine vitesse (degrés). */
  leanDeg: number;
  /** Constante de temps de l'inclinaison (ms). */
  leanTimeMs: number;
  /** Poussière au décollage, à la réception et au demi-tour : 1 activée, 0 désactivée. */
  dustEnabled: number;
  /** Durée de vie d'une particule de poussière (ms). */
  dustLifeMs: number;
  /** Vitesse horizontale des particules (px/s). */
  dustSpeed: number;
}

export const DEFAULT_FEEL: Readonly<FeelParams> = {
  squashEnabled: 0,
  jumpStretch: 0.18,
  landSquash: 0.28,
  landSquashMinSpeed: 120,
  turnSquash: 0.08,
  springHz: 7,
  springDamping: 0.45,
  leanDeg: 5,
  leanTimeMs: 90,
  dustEnabled: 0,
  dustLifeMs: 280,
  dustSpeed: 40,
};

export const FEEL_PARAM_RANGES: Readonly<
  Record<keyof FeelParams, { min: number; max: number; step: number }>
> = {
  squashEnabled: { min: 0, max: 1, step: 1 },
  jumpStretch: { min: 0, max: 0.5, step: 0.01 },
  landSquash: { min: 0, max: 0.5, step: 0.01 },
  landSquashMinSpeed: { min: 0, max: 400, step: 10 },
  turnSquash: { min: 0, max: 0.3, step: 0.01 },
  springHz: { min: 1, max: 20, step: 0.5 },
  springDamping: { min: 0.1, max: 1.5, step: 0.05 },
  leanDeg: { min: 0, max: 20, step: 0.5 },
  leanTimeMs: { min: 0, max: 400, step: 10 },
  dustEnabled: { min: 0, max: 1, step: 1 },
  dustLifeMs: { min: 50, max: 800, step: 10 },
  dustSpeed: { min: 0, max: 150, step: 5 },
};

/** Nombre de particules de poussière réutilisées (aucune création en jeu). */
export const DUST_POOL_SIZE = 8;
