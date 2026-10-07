import type { ArtPalette } from './art';

/**
 * Maquettes du monde étrange (D-130), comparées sur la gare étrange avant de choisir une direction
 * (DEBUG → « Maquette du monde étrange »). Chacune garde les silhouettes de D-28 et rend les appuis
 * plus lisibles (liserés plus épais, une lueur au-dessus, des masses moins noires, un halo autour
 * de Céleste) ; elles diffèrent par la couleur et le motif, tirés du lieu réel. PROVISOIRES.
 */
export const STRANGE_MOCKUPS = ['A', 'B', 'C'] as const;
export type StrangeMockup = (typeof STRANGE_MOCKUPS)[number];

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

export const STRANGE_MOCKUP_NAMES: Readonly<Record<StrangeMockup, string>> = {
  A: 'A : le crépuscule, mieux lu',
  B: 'B : l’heure arrêtée',
  C: 'C : les objets perdus, dans la brume',
};

export const STRANGE_MOCKUP_PALETTES: Readonly<Record<StrangeMockup, Partial<ArtPalette>>> = {
  // A : la palette « crépuscule » de D-36, telle quelle, mais mieux lue : les carreaux du hall de
  // la gare au lieu du papier peint de la maison, des masses violettes plutôt que noires.
  A: {
    ...silhouettes('#231c3f', '#181231'),
    wallMotif: 'tiles',
    wallpaper: 'rgba(255,175,225,0.11)',
    structure: '#1c1632',
    floor: '#1c1632',
    floorEdge: '#2b2347',
    rim: 'rgba(140,240,225,0.95)',
    rimWidth: 2,
    rimGlow: 0.35,
    halo: 0.22,
    haloColor: '140,240,225',
  },
  // B : la nuit de la gare réelle (bleu nuit, lumière ambrée des lampes) : des horloges arrêtées
  // chacune à une autre heure, des liserés ambrés.
  B: {
    ...silhouettes('#1c2843', '#131c30'),
    wallTop: '#1e2b48',
    wallBottom: '#121a30',
    wallpaper: 'rgba(255,214,150,0.13)',
    wallMotif: 'clocks',
    wainscot: '#18223a',
    structure: '#151e34',
    floor: '#151e34',
    floorEdge: '#23314f',
    night: '#2e4a7a',
    nightLow: '#16244a',
    moon: '#ffe1a8',
    rim: 'rgba(255,206,130,0.95)',
    lamp: '255,190,110',
    rimWidth: 2,
    rimGlow: 0.3,
    vignetteColor: '4,8,20',
    halo: 0.24,
    haloColor: '255,200,120',
  },
  // C : les objets perdus dans une brume vert d'eau, des étiquettes de bagage, des liserés dorés
  // pâles.
  C: {
    ...silhouettes('#17323a', '#0f2328'),
    wallTop: '#22454c',
    wallBottom: '#122a30',
    wallpaper: 'rgba(210,255,240,0.10)',
    wallMotif: 'tags',
    wainscot: '#173339',
    structure: '#10262b',
    floor: '#10262b',
    floorEdge: '#1b3a40',
    night: '#2f6b6e',
    nightLow: '#163c42',
    moon: '#f4f0d0',
    rim: 'rgba(255,236,190,0.95)',
    lamp: '190,255,230',
    rimWidth: 2,
    rimGlow: 0.3,
    vignetteColor: '4,16,18',
    halo: 0.22,
    haloColor: '255,236,190',
  },
};
