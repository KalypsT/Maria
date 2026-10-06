import type { Surface } from './surfaces';

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
export const DUST_POOL_SIZE = 16;

/** Forme des grains de poussière (D-125), dessinés d'avance en papier, sans rotation à l'affichage. */
export type DustShape = 'puff' | 'chip' | 'blade' | 'grain' | 'leaf';

export interface DustLook {
  readonly shape: DustShape;
  /** Deux teintes, alternées d'un grain à l'autre. */
  readonly colors: readonly [number, number];
  /** Pesanteur des grains (px/s²) : positive, ils retombent au sol ; négative, un nuage qui monte. */
  readonly gravity: number;
  /** Nombre de grains, en part du nombre ordinaire. */
  readonly amount: number;
}

/**
 * Poussière selon la matière du sol (D-125) : copeaux de bois, peluches de tissu, brins d'herbe,
 * poussière de pierre ou de métal, grains de sable, petites feuilles. PROVISOIRE.
 */
export const DUST_LOOK: Readonly<Record<Surface, DustLook>> = {
  wood: { shape: 'chip', colors: [0xd9c4a1, 0xb99c79], gravity: 260, amount: 1 },
  fabric: { shape: 'puff', colors: [0xf2eaf0, 0xdcd2e2], gravity: -18, amount: 0.75 },
  grass: { shape: 'blade', colors: [0x6fa64f, 0x4f8a3c], gravity: 300, amount: 1 },
  stone: { shape: 'puff', colors: [0xd6d0c7, 0xbcb5ab], gravity: -12, amount: 1 },
  sand: { shape: 'grain', colors: [0xcdb07a, 0xa98d5c], gravity: 420, amount: 1.5 },
  metal: { shape: 'puff', colors: [0xe1e5ea, 0xc6ccd4], gravity: -12, amount: 0.5 },
  leaves: { shape: 'leaf', colors: [0x88b560, 0xabc972], gravity: 140, amount: 1 },
};

/** Dans le monde étrange, la poussière prend ses couleurs (turquoise et violet, D-36). */
export const STRANGE_DUST_COLORS: readonly [number, number] = [0x7ff0dc, 0xb59ce6];

/** Grains d'une réception ordinaire ; une réception à pleine vitesse de chute en donne deux fois plus. */
export const DUST_LAND_COUNT = 4;
