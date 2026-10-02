/** Résolution logique du jeu (décision D-01) : hauteur fixe, largeur étendue selon le ratio de l'écran. */
export const GAME_HEIGHT = 360;
/** Largeur pour un écran 16:9. */
export const GAME_BASE_WIDTH = 640;
/** Largeur maximale (écran 20:9). Au-delà, bandes noires latérales. */
export const GAME_MAX_WIDTH = 800;

/**
 * Résolution de rendu (décision D-18) : `logical` = canvas à la taille logique, agrandi par le CSS
 * (déplacements par pixel logique) ; `screen` = canvas à la résolution de l'écran, zoom de caméra
 * égal à l'échelle (déplacements au pixel physique, pixel art toujours net).
 */
export type RenderMode = 'logical' | 'screen';

export interface DisplaySettings {
  renderMode: RenderMode;
}

export const DEFAULT_DISPLAY_SETTINGS: Readonly<DisplaySettings> = { renderMode: 'screen' };

/** Échelle maximale du rendu à la résolution de l'écran (coût GPU : ≈ échelle² pixels). */
export const MAX_RENDER_SCALE = 3;

/** Taille d'une tuile en pixels logiques (décision D-02). */
export const TILE_SIZE = 16;

/** Côté d'un bloc de rendu de salle, en tuiles (décision D-17 : 512 px, sous les limites de texture). */
export const LEVEL_CHUNK_TILES = 32;

/**
 * Couleurs des placeholders géométriques (PROVISOIRES, direction artistique ouverte §45, thème « C ») :
 * la maison la nuit, douce et mate (aucun néon) ; le rose est réservé à Céleste (lunettes, §2).
 * Interface : variables CSS de src/style.css (le cahier de Céleste).
 */
export const PLACEHOLDER_COLORS = {
  /** Fond par défaut (une salle peut avoir sa propre ambiance). */
  background: 0x262a35,
  celeste: 0xf1c9d2,
  /** Lunettes rondes roses (spec §2). */
  glasses: 0xe0598b,
  face: 0xf6e3d4,
  /** Murs et planchers. */
  solid: 0x51493f,
  solidEdge: 0x6f6356,
  /** Planches traversables. */
  oneWay: 0xa08563,
  /** L'eau (D-95). */
  water: 0x34708a,
  /** Meubles en bois (lit, table, chaise, étagère). */
  wood: 0x7d5f45,
  woodEdge: 0x9d7a58,
  /** Tissus (lit, canapé, coussins). */
  fabric: 0x5f6f8e,
  fabricEdge: 0x7e8eab,
  /** Feuillage (haies, frondaisons du jardin, D-46). */
  leaf: 0x4f7a4a,
  leafEdge: 0x6f9a62,
  /** Arrivée d'un parcours (placeholder). */
  goal: 0xe6c27a,
  /** Patrouilleur (placeholder neutre, design ouvert) : ocre, distinct de Céleste et du décor. */
  enemy: 0xc9823f,
  enemyEyes: 0x262a35,
  /** Danger (placeholder, D-21) : rouge brique éteint. */
  hazard: 0xa0584a,
  /** Checkpoint éteint / allumé (placeholders, D-21) : une veilleuse. */
  checkpoint: 0x7a7066,
  checkpointLit: 0xf2c879,
  /** Trouvaille (secret, D-27) : rose des crayons de Céleste. */
  secret: 0xe38aa0,
  /** Sortie vers une autre salle (placeholder, D-25). */
  exit: 0xf2e6c9,
  /** Bâton de Céleste et arc de frappe (placeholders). */
  stick: 0xc9a46b,
  slash: 0xfff4e0,
} as const;
