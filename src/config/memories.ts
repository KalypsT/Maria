/**
 * Souvenirs (spec §22.1, D-38) : objets de la maison qu'on regarde (Agir) et qu'on revoit ensuite
 * dans le cahier de Céleste. PLACEHOLDER : la liste est ouverte (§45). L'ordre est celui des cases
 * de la page ; un souvenir pas encore trouvé est une case vide en pointillés (complétion
 * explicite, §23).
 */
export const MEMORIES = [
  /** La photo de famille (salon) : papa, maman, Céleste et le chat. */
  'photo',
  /** Le dessin de Céleste punaisé au mur de sa chambre. */
  'drawing',
  /** La boîte à musique sur l'étagère au-dessus du lit. */
  'music-box',
  /** La plante de la cuisine. */
  'plant',
  /** Le bandeau de Maria, trouvé à la fin du monde étrange. */
  'headband',
  /** En haut de la bibliothèque du salon, après le monde étrange : Céleste bébé avec Maria. */
  'bookcase',
  /** Quelques mois plus tard (D-43) : la toise de la chambre, avec un nouveau trait. */
  'height',
] as const;
export type MemoryId = (typeof MEMORIES)[number];

/** Souvenirs dont l'obtention n'est pas encore en jeu (la case reste vide). */
export const MEMORIES_LATER: readonly MemoryId[] = [];

export function isMemory(id: string): id is MemoryId {
  return (MEMORIES as readonly string[]).includes(id);
}
