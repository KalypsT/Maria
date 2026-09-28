/** Résolution logique du jeu (décision D-01) : hauteur fixe, largeur étendue selon le ratio de l'écran. */
export const GAME_HEIGHT = 360;
/** Largeur pour un écran 16:9. */
export const GAME_BASE_WIDTH = 640;
/** Largeur maximale (écran 20:9). Au-delà, bandes noires latérales. */
export const GAME_MAX_WIDTH = 800;

/** Taille d'une tuile en pixels logiques (décision D-02). */
export const TILE_SIZE = 16;

/** Couleurs des placeholders géométriques (provisoires, direction artistique non validée). */
export const PLACEHOLDER_COLORS = {
  background: 0x1b1a24,
  celeste: 0xf4a6c8,
} as const;

/** Taille du rectangle placeholder de Céleste, en pixels logiques (provisoire). */
export const CELESTE_PLACEHOLDER_SIZE = { width: 12, height: 22 } as const;
