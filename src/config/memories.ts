/**
 * Mes souvenirs (spec §22.1, D-38, refaits en D-164) : la vie de famille de Céleste, au moins un
 * par lieu du voyage, chacun lié à papa, à maman ou à la maison. Liste validée par l'utilisateur
 * (la liste reste ouverte, §45). L'ordre est celui des cases (l'ordre du voyage) ; un souvenir pas
 * encore trouvé est une case vide en pointillés (complétion explicite, §23). Ceux qu'on peut porter
 * (l'arrosoir, le billet, la lettre, la carte postale) quittent le décor quand Céleste les prend ;
 * les autres restent en place, on les regarde autant qu'on veut.
 */
export const MEMORIES = [
  /** La toise de la chambre : un trait de plus à chaque croissance (D-43). */
  'height',
  /** La photo de famille du salon : papa, maman, Céleste et le chat. */
  'photo',
  /** La boîte à musique sur l'étagère au-dessus du lit : sa berceuse revient à la fin. */
  'music-box',
  /** Le petit arrosoir rose, dans le potager où papa arrose. */
  'watering-can',
  /** Le dessin de Céleste, punaisé au mur de la classe. */
  'school-drawing',
  /** Le billet de train, sur le banc du quai, le soir du départ en classe de mer. */
  'ticket',
  /** La lettre de maman, sur la couchette du haut, dans le train. */
  'letter',
  /** La carte postale que Céleste a dessinée pour ses parents, sur sa couchette du dortoir. */
  'postcard',
  /** Après la fin : le dessin de la famille au complet, Maria dans les bras, au mur de la chambre. */
  'family-drawing',
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
  /**
   * L'Educaville (D-155 ; la boîte à formes de D-64, dont elle garde le nom dans la sauvegarde), au
   * plafond du monde étrange de l'école.
   */
  'shape-box',
  /** Roger, la peluche singe, tout en haut de la tour des objets perdus (D-68). */
  'roger',
  /** La cuisine rose, la dînette d'enfance de Céleste, au bout du train de la vaisselle (D-88). */
  'pink-kitchen',
  /** Le livre musical, sur le toit du carrousel étrange, au bout de la vague (D-104). */
  'music-book',
  /** Le torchon blanc, dans le petit lit de la sieste chez la nounou (D-116). */
  'white-cloth',
  /**
   * La tour de cubes d'Eden, dans la salle de jeux de la nounou (D-118) : on y rejoue le souvenir
   * d'Eden.
   */
  'eden-tower',
] as const;

export type MemoryId =
  (typeof MEMORIES)[number] | (typeof MARIA_THINGS)[number] | (typeof STRANGE_THINGS)[number];

/**
 * Le nom de chaque trésor, sur sa fiche dans le sac (D-160, noms validés par l'utilisateur ; ceux
 * des souvenirs de D-164 sont des PLACEHOLDERS).
 */
export const MEMORY_NAMES: Readonly<Record<MemoryId, string>> = {
  height: 'La toise',
  photo: 'La photo de famille',
  'music-box': 'La boîte à musique',
  'watering-can': 'Le petit arrosoir',
  'school-drawing': 'Mon dessin de l’école',
  ticket: 'Le billet de train',
  letter: 'La lettre de maman',
  postcard: 'La carte postale',
  'family-drawing': 'Toute la famille',
  slipper: 'Le chausson de Maria',
  bottle: 'Le biberon de Maria',
  headband: 'Le bandeau de Maria',
  bonnet: 'Le bonnet de Maria',
  'shape-box': "L'Educaville",
  roger: 'Roger',
  'pink-kitchen': 'La cuisine rose',
  'music-book': 'Le livre qui chante',
  'white-cloth': 'Le torchon blanc',
  'eden-tower': "La tour d'Eden",
};

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
export const FLASHBACKS = ['roger', 'music-book', 'white-cloth'] as const;
export type FlashbackId = (typeof FLASHBACKS)[number];

/** Le court souvenir lié à un souvenir du cahier, s'il en a un. */
export function flashbackOf(id: MemoryId): FlashbackId | null {
  return (FLASHBACKS as readonly string[]).includes(id) ? (id as FlashbackId) : null;
}
