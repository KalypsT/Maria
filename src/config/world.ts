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
  /** Changement de salle (D-25) : fondu au noir en passant une sortie, jeu suspendu (ms). */
  roomFadeOutMs: number;
  /** Retour à l'image dans la nouvelle salle, jeu en marche (ms). */
  roomFadeInMs: number;
}

export const DEFAULT_WORLD: Readonly<WorldParams> = {
  fearMax: 3,
  fearDecayMs: 0,
  faintMs: 450,
  reappearMs: 300,
  roomFadeOutMs: 150,
  roomFadeInMs: 200,
};

export const WORLD_PARAM_RANGES: Readonly<
  Record<keyof WorldParams, { min: number; max: number; step: number }>
> = {
  fearMax: { min: 1, max: 6, step: 1 },
  fearDecayMs: { min: 0, max: 20000, step: 500 },
  faintMs: { min: 0, max: 1500, step: 50 },
  reappearMs: { min: 0, max: 1500, step: 50 },
  roomFadeOutMs: { min: 0, max: 1000, step: 25 },
  roomFadeInMs: { min: 0, max: 1000, step: 25 },
};

/**
 * Tolérance des dangers (px) : la hitbox est réduite d'autant de chaque côté pour le contact avec
 * une tuile de danger ; un frôlement ne compte pas (précision avant réalisme).
 */
export const HAZARD_INSET_PX = 2;

/**
 * Portes de façade (D-61) : on peut en ouvrir une (Agir) à au plus ce nombre de tuiles de part et
 * d'autre de la tuile où l'on se tient devant elle.
 */
export const DOOR_REACH_TILES = 2;
