import { MARIA_THINGS, MEMORIES, STRANGE_THINGS } from '../../config/memories';
import { STRANGE_ROOM_PLACES } from '../../config/places';
import { RECORD_SLOTS } from '../../config/records';
import type { Tally } from './notebookFigures';
import { TREASURES } from './treasures';
import { mapPage, type Zone } from './zone';

/**
 * La page des trésors du sac (D-159, D-162) : les familles rangées par type, leurs compteurs, ce
 * qui manque et où le chercher, ce qui est nouveau. Pur.
 */

export type TreasureFamilyId = 'memories' | 'maria' | 'strange';

/** Les familles de trésors, dans l'ordre de la page ; chacune a sa couleur. */
export const TREASURE_FAMILIES: readonly {
  readonly id: TreasureFamilyId;
  readonly title: string;
  readonly items: readonly string[];
}[] = [
  { id: 'memories', title: 'Mes souvenirs', items: MEMORIES },
  { id: 'maria', title: 'Les affaires de Maria', items: MARIA_THINGS },
  { id: 'strange', title: 'Monde étrange', items: STRANGE_THINGS },
];

/** Le lieu (la page de carte) d'une salle ; une salle hors carte, par le début de son nom. */
export function roomPlace(zone: Zone, room: string): string | null {
  return mapPage(zone, room) ?? STRANGE_ROOM_PLACES[room.split('-')[0] ?? ''] ?? null;
}

/** Où chercher (ou où a été trouvé) un trésor : son lieu et sa salle, quand on peut les dire. */
export interface TreasureWhere {
  readonly place: string | null;
  readonly room: string | null;
}

/**
 * L'indice d'un trésor (choix de l'utilisateur, D-160) : trouvé, son lieu et sa salle ; manquant,
 * la salle si Céleste y est déjà passée, sinon le lieu s'il est connu, sinon rien (« ? »).
 */
export function treasureWhere(
  spot: { readonly place: string | null; readonly room: string } | undefined,
  found: boolean,
  visitedRooms: ReadonlySet<string>,
  visitedPlaces: ReadonlySet<string>,
): TreasureWhere {
  if (!spot) {
    return { place: null, room: null };
  }
  const roomKnown = found || visitedRooms.has(spot.room);
  const placeKnown = roomKnown || (spot.place !== null && visitedPlaces.has(spot.place));
  return { place: placeKnown ? spot.place : null, room: roomKnown ? spot.room : null };
}

export interface TreasureCell {
  readonly id: string;
  readonly found: boolean;
  /** Trouvé mais pas encore regardé dans le sac. */
  readonly isNew: boolean;
  readonly where: TreasureWhere;
}

export interface TreasureFamilyView {
  readonly id: TreasureFamilyId;
  readonly title: string;
  readonly cells: readonly TreasureCell[];
  readonly tally: Tally;
}

export interface ShellRow {
  readonly place: string;
  readonly tally: Tally;
}

export interface TreasureBook {
  readonly families: readonly TreasureFamilyView[];
  /** Les coquilles des lieux visités, un rang par lieu (D-148). */
  readonly shells: readonly ShellRow[];
  readonly shellTally: Tally;
  /** Les disques trouvés seulement (D-121 : ils restent secrets). */
  readonly records: readonly TreasureCell[];
  /** Les trésors et les coquilles (pas les disques). */
  readonly total: Tally;
  /** Un trésor ou un disque trouvé, pas encore regardé dans le sac. */
  readonly hasNew: boolean;
}

export interface TreasureBookInput {
  /** Trésors et disques trouvés (les souvenirs de la sauvegarde). */
  readonly found: ReadonlySet<string>;
  /** Trésors et disques déjà regardés dans le sac. */
  readonly viewed: ReadonlySet<string>;
  /** Où est chaque trésor et chaque disque. */
  readonly spots: ReadonlyMap<string, { readonly place: string | null; readonly room: string }>;
  readonly visitedRooms: ReadonlySet<string>;
  readonly visitedPlaces: ReadonlySet<string>;
  /** Les lieux dans l'ordre du voyage. */
  readonly placeOrder: readonly string[];
  /** Les coquilles de la partie : leur lieu, trouvées ou non. */
  readonly shells: readonly { readonly place: string | null; readonly found: boolean }[];
}

export function treasureBook(input: TreasureBookInput): TreasureBook {
  const cell = (id: string): TreasureCell => {
    const found = input.found.has(id);
    return {
      id,
      found,
      isNew: found && !input.viewed.has(id),
      where: treasureWhere(input.spots.get(id), found, input.visitedRooms, input.visitedPlaces),
    };
  };
  const families = TREASURE_FAMILIES.map((family) => {
    const cells = family.items.map(cell);
    return {
      id: family.id,
      title: family.title,
      cells,
      tally: { found: cells.filter((c) => c.found).length, total: cells.length },
    };
  });
  const shells = input.placeOrder
    .filter((place) => input.visitedPlaces.has(place))
    .map((place) => {
      const here = input.shells.filter((shell) => shell.place === place);
      return {
        place,
        tally: { found: here.filter((shell) => shell.found).length, total: here.length },
      };
    })
    .filter((row) => row.tally.total > 0);
  const shellTally = {
    found: input.shells.filter((shell) => shell.found).length,
    total: input.shells.length,
  };
  const records = RECORD_SLOTS.filter((id) => input.found.has(id)).map(cell);
  const found = families.reduce((n, f) => n + f.tally.found, shellTally.found);
  const total = families.reduce((n, f) => n + f.tally.total, shellTally.total);
  return {
    families,
    shells,
    shellTally,
    records,
    total: { found, total },
    hasNew: [...families.flatMap((f) => f.cells), ...records].some((c) => c.isNew),
  };
}

/**
 * Un trésor ou un disque trouvé que le joueur ne connaît pas encore (D-160) : l'étincelle du sac,
 * jusqu'à ce qu'il l'ouvre.
 */
export function hasNewTreasure(found: readonly string[], known: ReadonlySet<string>): boolean {
  const treasures = new Set<string>([...TREASURES, ...RECORD_SLOTS]);
  return found.some((id) => treasures.has(id) && !known.has(id));
}
