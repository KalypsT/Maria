import type { CelesteOutfit } from './growth';

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
  /** Tringle du rideau (planche traversable), D-39. */
  rod: { furniture: true },
  /** Étagère à bocaux de la cuisine (planche traversable), D-39. */
  jarshelf: { furniture: true },
  /** Frigo de la cuisine, à escalader (D-39). */
  fridge: { furniture: true },
  // Fond (sans collision).
  window: { furniture: false },
  frame: { furniture: false },
  /** Photo de famille (souvenir, D-38). */
  photo: { furniture: false },
  /** Dossier du canapé, dessiné derrière l'assise (D-39). */
  sofaback: { furniture: false },
  /** Fil à linge et chaussettes qui sèchent (buanderie, D-39). */
  clothesline: { furniture: false },
  drawing: { furniture: false },
  rug: { furniture: false },
  lamp: { furniture: false },
  coatrack: { furniture: false },
  clock: { furniture: false },
  // Maison déformée (monde étrange, D-35) : fond seulement, jamais de collision.
  door: { furniture: false },
  'door-upside': { furniture: false },
  wallstairs: { furniture: false },
  peel: { furniture: false },
  'giant-chair': { furniture: false },
  'giant-pencil': { furniture: false },
  'bedroom-window': { furniture: false },
  'toy-shadow': { furniture: false },
  'narrow-left': { furniture: false },
  'narrow-right': { furniture: false },
  /** Yeux dans l'ombre : rien de dessiné dans le décor, animés par les effets (D-35). */
  eyes: { furniture: false },
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

/**
 * Illustrations de Céleste fournies par l'utilisateur (D-41, D-43), détourées, une par tenue :
 * écran de départ seulement (celle de la partie sauvegardée). En jeu, Céleste reste la marionnette
 * dessinée par le code (D-29), inspirée de ces images.
 */
export const TITLE_IMAGES: Readonly<Record<CelesteOutfit, string>> = {
  pyjama: 'art/celeste.png',
  dress: 'art/celeste-dress.png',
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

/**
 * Monde étrange (D-28, D-36 : palette « crépuscule » choisie par l'utilisateur) : fonds violets et
 * bleu nuit, halos roses, bords des surfaces praticables en turquoise (lisibilité, pilier 1).
 */
export const STRANGE_PALETTE: Readonly<ArtPalette> = {
  ...REAL_PALETTE,
  wallTop: '#2c2344',
  wallBottom: '#1d1832',
  wallpaper: 'rgba(255,175,225,0.15)',
  wainscot: '#251d38',
  floor: '#0f0c18',
  floorEdge: '#1c1530',
  structure: '#0a0812',
  wood: '#16112a',
  woodLight: '#16112a',
  woodDark: '#0f0b1e',
  fabric: '#16112a',
  fabricLight: '#16112a',
  linen: '#16112a',
  toy: '#16112a',
  toyLight: '#16112a',
  curtain: '#1d1532',
  night: '#4b3b7c',
  nightLow: '#221a46',
  moon: '#ffd8ee',
  rim: 'rgba(140,240,225,0.9)',
  lamp: '255,160,210',
  darkness: 0.42,
  silhouettes: true,
};

/** Rayon du halo d'une veilleuse (px logiques). */
export const LAMP_LIGHT_RADIUS = 110;
/** Rayon de la lumière de la lune autour d'une fenêtre (px logiques). */
export const MOON_LIGHT_RADIUS = 90;
/** Échelle maximale des textures d'habillage (au-delà, mémoire excessive sur téléphone). */
export const MAX_ART_SCALE = 3;
