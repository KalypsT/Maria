import { STRANGE_PALETTE, type ArtPalette } from './art';

/**
 * Les nuances du monde étrange (D-172) : la palette « crépuscule » (`STRANGE_PALETTE`) est commune à
 * tous les mondes étranges ; chaque niveau la fait glisser vers la couleur de son lieu réel et
 * propose un motif de mur par défaut. Une salle choisit sa nuance par `; @tint:` (aucune : celle de
 * la maison) et peut imposer son motif par `; @wall:`. Le liseré turquoise, sa lueur et le halo de
 * Céleste ne changent pas d'un niveau à l'autre (lisibilité des appuis). PLACEHOLDERS, à régler sur
 * téléphone (DEBUG → « Nuance du monde étrange »).
 */
export const STRANGE_TINTS = ['house', 'station'] as const;
export type StrangeTint = (typeof STRANGE_TINTS)[number];

export const STRANGE_TINT_NAMES: Readonly<Record<StrangeTint, string>> = {
  house: 'la maison (le violet de base)',
  station: 'la gare (violet bleuté)',
};

/** Remplissage des silhouettes (meubles, feuillage) et de leurs ombres. */
function silhouettes(fill: string, dark: string): Partial<ArtPalette> {
  return {
    wood: fill,
    woodLight: fill,
    woodDark: dark,
    fabric: fill,
    fabricLight: fill,
    linen: fill,
    toy: fill,
    toyLight: fill,
    leaf: fill,
    leafLight: fill,
    leafDark: dark,
  };
}

const STRANGE_TINT_PALETTES: Readonly<Record<StrangeTint, Partial<ArtPalette>>> = {
  // La maison : le violet de base, le papier peint à pois.
  house: {},
  // La gare : la nuit bleue du hall réel glissée dans le violet, ses carreaux.
  station: {
    ...silhouettes('#1f2142', '#151830'),
    wallTop: '#262a4a',
    wallBottom: '#181b34',
    wainscot: '#1f2340',
    wallpaper: 'rgba(215,205,255,0.11)',
    wallMotif: 'tiles',
    structure: '#181a33',
    floor: '#181a33',
    floorEdge: '#262a4b',
    night: '#3d4580',
    nightLow: '#1c2148',
  },
};

/** Nuance d'une salle (`; @tint:`) ; inconnue ou absente : celle de la maison. */
export function strangeTint(value: string | undefined): StrangeTint {
  return STRANGE_TINTS.find((t) => t === value) ?? 'house';
}

const STRANGE_PALETTES = Object.fromEntries(
  STRANGE_TINTS.map((t) => [t, { ...STRANGE_PALETTE, ...STRANGE_TINT_PALETTES[t] }]),
) as Readonly<Record<StrangeTint, Readonly<ArtPalette>>>;

/** Palette du monde étrange dans cette nuance (calculée une fois). */
export function strangePalette(tint: StrangeTint): Readonly<ArtPalette> {
  return STRANGE_PALETTES[tint];
}
