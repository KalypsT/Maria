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
  /** En haut de la bibliothèque du salon, après le monde étrange : Céleste bébé avec Maria. */
  'bookcase',
  /** Quelques mois plus tard (D-43) : la toise de la chambre, avec un nouveau trait. */
  'height',
] as const;

/**
 * Les affaires de Maria (D-58), un autre onglet du cahier : ramassées avec Agir, elles quittent
 * alors le jeu. Enregistrées avec les souvenirs dans la sauvegarde (aucune migration). L'ordre est
 * celui des cases.
 */
export const MARIA_THINGS = [
  /** Un chausson de poupée, au matin, dans le couloir. */
  'slipper',
  /** Un biberon de poupée, sur le palier de l'escalier. */
  'bottle',
  /** Le bandeau de Maria, à la fin du monde étrange. */
  'headband',
  /** Le bonnet de Maria, à la sortie de derrière la haie (D-49). */
  'bonnet',
] as const;

/**
 * Le monde étrange (D-64), un autre onglet du cahier : des souvenirs de choses vues là-bas, qu'on
 * regarde (Agir) sans les prendre ; elles y restent. L'ordre est celui des cases.
 */
export const STRANGE_THINGS = [
  /** La boîte à formes, au plafond du monde étrange de l'école. */
  'shape-box',
  /** Roger, la peluche singe, tout en haut de la tour des objets perdus (D-68). */
  'roger',
  /** La cuisine rose, la dînette d'enfance de Céleste, au bout du train de la vaisselle (D-88). */
  'pink-kitchen',
] as const;

export type MemoryId =
  (typeof MEMORIES)[number] | (typeof MARIA_THINGS)[number] | (typeof STRANGE_THINGS)[number];

/** Souvenirs dont l'obtention n'est pas encore en jeu (la case reste vide). */
export const MEMORIES_LATER: readonly MemoryId[] = [];

export function isMemory(id: string): id is MemoryId {
  return (
    (MEMORIES as readonly string[]).includes(id) ||
    (MARIA_THINGS as readonly string[]).includes(id) ||
    (STRANGE_THINGS as readonly string[]).includes(id)
  );
}

/**
 * Courts souvenirs (D-68) : une vignette de quelques secondes, non jouable, sans texte, montrée
 * quand on trouve certains objets, et rejouée en touchant leur case dans le cahier.
 */
export const FLASHBACKS = ['roger'] as const;
export type FlashbackId = (typeof FLASHBACKS)[number];

/** Le court souvenir lié à un souvenir du cahier, s'il en a un. */
export function flashbackOf(id: MemoryId): FlashbackId | null {
  return (FLASHBACKS as readonly string[]).includes(id) ? (id as FlashbackId) : null;
}
