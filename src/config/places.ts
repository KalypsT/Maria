/**
 * Les lieux du cahier (D-60, D-160) : une page de carte par lieu, dans l'ordre du voyage de
 * Céleste. Le pictogramme est celui de la rangée des lieux, à gauche de la carte, dans le sac.
 * La maison et le jardin restent une seule page (choix de l'utilisateur, D-159).
 */
export const MAP_PLACES = [
  { id: 'house', title: 'Ma maison', icon: 'house' },
  { id: 'street', title: 'Mon quartier', icon: 'swing' },
  { id: 'station', title: 'La gare', icon: 'clock' },
  { id: 'train', title: 'Le train', icon: 'train' },
  { id: 'sea', title: 'La mer', icon: 'sea' },
  // L'avant-dernier niveau (D-107) : la maison de la nounou et ses îlots de mémoire.
  { id: 'nanny', title: 'Chez la nounou', icon: 'armchair' },
] as const;

export type PlaceIcon = (typeof MAP_PLACES)[number]['icon'];

/**
 * Le lieu des salles hors carte (les mondes étranges, D-64… ; la salle de jeux de la nounou), par
 * le début de leur identifiant : pour l'indice de lieu d'un trésor (D-160).
 */
export const STRANGE_ROOM_PLACES: Readonly<Record<string, string>> = {
  garden: 'house',
  school: 'street',
  station: 'station',
  train: 'train',
  sea: 'sea',
  nanny: 'nanny',
};

/** Le nom d'une page de carte. */
export function placeTitle(page: string): string {
  return MAP_PLACES.find((place) => place.id === page)?.title ?? page;
}
