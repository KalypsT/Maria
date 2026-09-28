/** Résolution logique du jeu (décision D-01) : hauteur fixe, largeur étendue selon le ratio de l'écran. */
export const GAME_HEIGHT = 360;
/** Largeur pour un écran 16:9. */
export const GAME_BASE_WIDTH = 640;
/** Largeur maximale (écran 20:9). Au-delà, bandes noires latérales. */
export const GAME_MAX_WIDTH = 800;

/** Taille d'une tuile en pixels logiques (décision D-02). */
export const TILE_SIZE = 16;

/** Côté d'un bloc de rendu de salle, en tuiles (décision D-17 : 512 px, sous les limites de texture). */
export const LEVEL_CHUNK_TILES = 32;

/** Couleurs des placeholders géométriques (provisoires, direction artistique non validée). */
export const PLACEHOLDER_COLORS = {
  background: 0x1b1a24,
  celeste: 0xf4a6c8,
  /** Lunettes rondes roses (spec §2). */
  glasses: 0xff4fa3,
  face: 0xf6e3d4,
  solid: 0x4a4760,
  solidEdge: 0x6b678a,
  oneWay: 0x8a7fb0,
  /** Arrivée d'un parcours (placeholder). */
  goal: 0x7fe0c0,
} as const;
