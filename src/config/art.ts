/**
 * Direction artistique (D-28) : livre illustré en aplats doux, nuit bleutée, lumière de veilleuse ;
 * monde étrange en silhouettes et lumière turquoise. PROVISOIRE : couleurs et intensités à régler
 * sur téléphone.
 */

/**
 * Éléments d'habillage connus. `furniture` : meuble posé sur des tuiles pleines ou traversables
 * (vérifié) ; sinon élément de fond (fenêtre, cadre…), sans contrainte.
 */
export const DECOR_KINDS: Readonly<Record<string, { readonly furniture: boolean }>> = {
  // Chambre.
  wardrobe: { furniture: true },
  headboard: { furniture: true },
  bed: { furniture: true },
  toybox: { furniture: true },
  stool: { furniture: true },
  desk: { furniture: true },
  books: { furniture: true },
  shelf: { furniture: true },
  // Meubles dessinés d'après leurs tuiles (forme exacte de la collision) + détails.
  console: { furniture: true },
  basket: { furniture: true },
  bench: { furniture: true },
  wallshelf: { furniture: true },
  ledge: { furniture: true },
  stairs: { furniture: true },
  landing: { furniture: true },
  buffet: { furniture: true },
  trunk: { furniture: true },
  boxes: { furniture: true },
  rolledrug: { furniture: true },
  beam: { furniture: true },
  skylight: { furniture: true },
  sofa: { furniture: true },
  pouf: { furniture: true },
  table: { furniture: true },
  chair: { furniture: true },
  bookcase: { furniture: true },
  counter: { furniture: true },
  cupboard: { furniture: true },
  hood: { furniture: true },
  machine: { furniture: true },
  laundry: { furniture: true },
  // Fond (sans collision).
  window: { furniture: false },
  frame: { furniture: false },
  drawing: { furniture: false },
  rug: { furniture: false },
  lamp: { furniture: false },
  coatrack: { furniture: false },
  clock: { furniture: false },
};

/** Revêtement du mur d'une salle (`; @wall:`), dessiné par le code. */
export const WALL_STYLES = ['dots', 'stripes', 'planks', 'tiles'] as const;
export type WallStyle = (typeof WALL_STYLES)[number];

/**
 * Images fournies (voir le document « Créer des images pour le jeu ») : nom d'élément → fichier
 * sous `public/art/`. Un élément absent de cette liste est dessiné par le code.
 */
export const ART_IMAGES: Readonly<Record<string, string>> = {
  /** Maria (D-31) : image fournie par l'utilisateur, détourée. */
  maria: 'maria.png',
};

/** Palette d'une salle habillée ; le monde étrange en est une variante (§6.2). */
export interface ArtPalette {
  wallTop: string;
  wallBottom: string;
  wallpaper: string;
  wainscot: string;
  floor: string;
  floorEdge: string;
  structure: string;
  wood: string;
  woodLight: string;
  woodDark: string;
  fabric: string;
  fabricLight: string;
  linen: string;
  toy: string;
  toyLight: string;
  curtain: string;
  night: string;
  nightLow: string;
  moon: string;
  /** Liseré des surfaces praticables (lisibilité en jeu). */
  rim: string;
  /** Halo des veilleuses. */
  lamp: string;
  /** Obscurité de la pièce (0 : aucune). */
  darkness: number;
  /** Meubles réduits à des silhouettes (monde étrange). */
  silhouettes: boolean;
  /** Étoiles dans les fenêtres (la nuit). */
  stars: boolean;
  /** Intensité des halos des lampes (1 : la nuit). */
  glow: number;
}

export const REAL_PALETTE: Readonly<ArtPalette> = {
  wallTop: '#44507a',
  wallBottom: '#353f63',
  wallpaper: 'rgba(255,236,200,0.09)',
  wainscot: '#4a4f72',
  floor: '#6a5242',
  floorEdge: '#7d6250',
  structure: '#2a2436',
  wood: '#9a7352',
  woodLight: '#c79d6f',
  woodDark: '#7a5a40',
  fabric: '#6d86c2',
  fabricLight: '#98ade0',
  linen: '#f3ead7',
  toy: '#d98b4f',
  toyLight: '#f0ad74',
  curtain: '#b85f75',
  night: '#3a4f8a',
  nightLow: '#1f2a55',
  moon: '#fbefc6',
  rim: 'rgba(255,214,140,0.7)',
  lamp: '255,196,120',
  darkness: 0.42,
  silhouettes: false,
  stars: true,
  glow: 1,
};

/**
 * Le matin (D-31), première version de la palette « jour » : même maison, murs plus clairs, ciel
 * d'aube dans les fenêtres, obscurité presque levée. PROVISOIRE.
 */
export const DAY_PALETTE: Readonly<ArtPalette> = {
  ...REAL_PALETTE,
  wallTop: '#9fa9cf',
  wallBottom: '#8690ba',
  wallpaper: 'rgba(255,244,220,0.16)',
  wainscot: '#7f86ad',
  floor: '#8a6a50',
  floorEdge: '#a07e62',
  structure: '#4a4258',
  night: '#8fc3ea',
  nightLow: '#f6dcb6',
  moon: '#fff4cf',
  rim: 'rgba(255,240,205,0.55)',
  darkness: 0.1,
  stars: false,
  glow: 0.35,
};

export const STRANGE_PALETTE: Readonly<ArtPalette> = {
  ...REAL_PALETTE,
  wallTop: '#1b2a36',
  wallBottom: '#132028',
  wallpaper: 'rgba(140,255,230,0.18)',
  wainscot: '#1a2630',
  floor: '#0c1016',
  floorEdge: '#0f1a22',
  structure: '#07090e',
  wood: '#10121c',
  woodLight: '#10121c',
  woodDark: '#0b0c14',
  fabric: '#10121c',
  fabricLight: '#10121c',
  linen: '#10121c',
  toy: '#10121c',
  toyLight: '#10121c',
  curtain: '#0d141c',
  night: '#1f6b6b',
  nightLow: '#0c2e36',
  moon: '#b4fff0',
  rim: 'rgba(120,240,220,0.85)',
  lamp: '90,230,210',
  darkness: 0.45,
  silhouettes: true,
};

/** Rayon du halo d'une veilleuse (px logiques). */
export const LAMP_LIGHT_RADIUS = 110;
/** Rayon de la lumière de la lune autour d'une fenêtre (px logiques). */
export const MOON_LIGHT_RADIUS = 90;
/** Échelle maximale des textures d'habillage (au-delà, mémoire excessive sur téléphone). */
export const MAX_ART_SCALE = 3;
