/**
 * Échec et retour au checkpoint (décision D-21). PROVISOIRE : valeurs à régler sur téléphone.
 */
export interface WorldParams {
  /** Crans de la jauge de peur ; pleine, Céleste s'évanouit. */
  fearMax: number;
  /** Diminution naturelle d'un cran (ms, 0 = jamais). */
  fearDecayMs: number;
  /** Durée de l'évanouissement avant le retour (ms) : Céleste s'estompe, fondu au noir. */
  faintMs: number;
  /** Durée du retour à l'image après la réapparition (ms). */
  reappearMs: number;
}

export const DEFAULT_WORLD: Readonly<WorldParams> = {
  fearMax: 3,
  fearDecayMs: 0,
  faintMs: 450,
  reappearMs: 300,
};

export const WORLD_PARAM_RANGES: Readonly<
  Record<keyof WorldParams, { min: number; max: number; step: number }>
> = {
  fearMax: { min: 1, max: 6, step: 1 },
  fearDecayMs: { min: 0, max: 20000, step: 500 },
  faintMs: { min: 0, max: 1500, step: 50 },
  reappearMs: { min: 0, max: 1500, step: 50 },
};

/**
 * Tolérance des dangers (px) : la hitbox est réduite d'autant de chaque côté pour le contact avec
 * une tuile de danger ; un frôlement ne compte pas (précision avant réalisme).
 */
export const HAZARD_INSET_PX = 2;
