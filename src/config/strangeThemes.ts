import { STRANGE_PALETTE, type ArtPalette } from './art';

/**
 * Les nuances du monde étrange (D-172) : la palette « crépuscule » (`STRANGE_PALETTE`) est commune à
 * tous les mondes étranges ; chaque niveau la fait glisser vers la couleur de son lieu réel et
 * propose un motif de mur par défaut. Une salle choisit sa nuance par `; @tint:` (aucune : celle de
 * la maison) et peut imposer son motif par `; @wall:`. Le liseré turquoise, sa lueur et le halo de
 * Céleste ne changent pas d'un niveau à l'autre (lisibilité des appuis). PLACEHOLDERS, à régler sur
 * téléphone (DEBUG → « Nuance du monde étrange »).
 */
export const STRANGE_TINTS = [
  'house',
  'garden',
  'street',
  'station',
  'train',
  'sea',
  'nanny',
] as const;
export type StrangeTint = (typeof STRANGE_TINTS)[number];

export const STRANGE_TINT_NAMES: Readonly<Record<StrangeTint, string>> = {
  house: 'la maison (le violet de base)',
  garden: 'le jardin (violet mousse)',
  street: 'le quartier (violet craie)',
  station: 'la gare (violet bleuté)',
  train: 'le train (violet prune, cuivré)',
  sea: 'la mer (violet bleu canard)',
  nanny: 'la nounou (violet passé, autrefois)',
};

/**
 * Remplissage des silhouettes (meubles, feuillage) et de leurs ombres. D-182 : un peu plus clairs
 * que les murs de leur nuance, pour qu'on reconnaisse les meubles sans quitter la nuit étrange.
 */
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
  // Le jardin, derrière la haie : dehors, la nuit glisse vers une mousse sombre.
  garden: {
    ...silhouettes('#2e413b', '#1e2d29'),
    wallTop: '#27332f',
    wallBottom: '#1a2420',
    structure: '#1a2522',
    floor: '#1a2522',
    floorEdge: '#28362f',
    night: '#466a58',
    nightLow: '#22382f',
  },
  // Le quartier (l'école étrange) : un violet grisé, comme de la craie, les rayures de l'école.
  street: {
    ...silhouettes('#352f51', '#242039'),
    wallTop: '#2e2a3e',
    wallBottom: '#1f1c2c',
    wainscot: '#28243a',
    wallpaper: 'rgba(235,230,255,0.12)',
    wallMotif: 'stripes',
    structure: '#1f1c30',
    floor: '#1f1c30',
    floorEdge: '#2e2a42',
  },
  // La gare : la nuit bleue du hall réel glissée dans le violet, ses carreaux.
  station: {
    ...silhouettes('#2a2d5a', '#1d2142'),
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
  // Le train : la cuisine et le wagon-restaurant, un violet prune, des reflets cuivrés, les carreaux.
  train: {
    ...silhouettes('#3c2750', '#2a1a3a'),
    wallTop: '#33213e',
    wallBottom: '#22162c',
    wainscot: '#2c1c36',
    wallpaper: 'rgba(255,190,160,0.12)',
    wallMotif: 'tiles',
    structure: '#221630',
    floor: '#221630',
    floorEdge: '#35223f',
    lamp: '255,175,150',
  },
  // La mer : un violet tiré vers le bleu canard, sombre (loin du turquoise des liserés), les rayures
  // du centre de vacances.
  sea: {
    ...silhouettes('#224456', '#15313f'),
    wallTop: '#1c3040',
    wallBottom: '#122230',
    wainscot: '#182a3a',
    wallpaper: 'rgba(200,235,255,0.11)',
    wallMotif: 'stripes',
    structure: '#142834',
    floor: '#142834',
    floorEdge: '#20384a',
    night: '#2a5a70',
    nightLow: '#143246',
  },
  // La maison de la nounou et ses îlots (niveau 7) : autrefois, un violet passé, un peu poussiéreux,
  // un papier peint plus chaud. Reste sombre : le souvenir de la bascule est clair et chaud
  // (`MEMORY_PALETTE`), les deux couches ne se confondent pas.
  nanny: {
    ...silhouettes('#3c304c', '#2a2238'),
    wallTop: '#342a40',
    wallBottom: '#241d2e',
    wainscot: '#2e2538',
    wallpaper: 'rgba(255,215,190,0.11)',
    structure: '#211a2c',
    floor: '#211a2c',
    floorEdge: '#33293f',
    night: '#55457a',
    nightLow: '#271e44',
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
