import { TILE_SIZE as T } from '../../config/display';
import { DOOR_REACH_TILES } from '../../config/world';
import { Tile, tileAt, type LevelData, type LevelDoor, type LevelExit } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { highTide } from '../level/tide';
import type { Box } from '../physics/gridCollision';

/** Salle d'une zone, avant analyse : identifiant et carte ASCII (D-06). */
export interface RoomSource {
  readonly id: string;
  readonly text: string;
}

/**
 * Zone décrite par des données (D-25, spec §32) : salles et liaisons `salle:sortie` ↔ `salle:sortie`
 * (dans les deux sens).
 */
export interface ZoneSource {
  readonly id: string;
  /** Salle de départ d'une nouvelle partie (sur son `P`). */
  readonly start: string;
  readonly rooms: readonly RoomSource[];
  readonly links: readonly (readonly [string, string])[];
  /**
   * Carte dessinée par Céleste (§24) : boîte de chaque salle, en unités de carte (x vers la
   * droite, y vers le bas). Disposition « imparfaite », dessinée à la main.
   */
  readonly map?: Readonly<Record<string, MapBox>>;
}

export interface MapBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /**
   * Page du cahier où la salle est dessinée (D-60) : « Ma maison », « Mon quartier »… Absente :
   * la page de la zone (son identifiant).
   */
  readonly page?: string;
}

/** Page de carte d'une salle (null : absente de la carte). */
export function mapPage(zone: Zone, room: string): string | null {
  const box = zone.map[room];
  return box ? (box.page ?? zone.id) : null;
}

export interface ExitRef {
  readonly room: string;
  readonly exit: number;
}

export interface Zone {
  readonly id: string;
  readonly start: string;
  readonly rooms: ReadonlyMap<string, LevelData>;
  /** Liaisons telles que déclarées (une fois chacune). */
  readonly links: readonly (readonly [ExitRef, ExitRef])[];
  readonly map: Readonly<Record<string, MapBox>>;
  /** Sortie d'arrivée quand on passe la sortie `exit` de la salle `room` (null si non reliée). */
  destination(room: string, exit: number): ExitRef | null;
}

function parseRef(zoneId: string, text: string): ExitRef {
  const match = /^([\w-]+):([1-9])$/.exec(text);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Zone ${zoneId} : liaison « ${text} » invalide (attendu salle:chiffre)`);
  }
  return { room: match[1], exit: Number(match[2]) };
}

function findExit(level: LevelData, id: number): LevelExit | undefined {
  return level.exits.find((exit) => exit.id === id);
}

function findDoor(level: LevelData, id: number): LevelDoor | undefined {
  return level.doors.find((door) => door.id === id);
}

/** Sortie latérale ou porte de façade (D-61) de ce numéro. */
function findEnd(level: LevelData, id: number): LevelExit | LevelDoor | undefined {
  return findExit(level, id) ?? findDoor(level, id);
}

/**
 * Construit et valide une zone : salles lisibles, liaisons vers des sorties existantes, chaque sortie
 * (ou porte de façade, D-61) reliée exactement une fois, un mur gauche relié à un mur droit
 * (cohérence spatiale), un sol sous chaque sortie et devant chaque porte pour y arriver debout.
 * Toute incohérence lève une erreur explicite.
 */
export function buildZone(source: ZoneSource): Zone {
  const rooms = new Map<string, LevelData>();
  for (const room of source.rooms) {
    if (rooms.has(room.id)) {
      throw new Error(`Zone ${source.id} : salle « ${room.id} » en double`);
    }
    rooms.set(room.id, parseAsciiLevel(room.id, room.text));
  }
  if (!rooms.has(source.start)) {
    throw new Error(`Zone ${source.id} : salle de départ « ${source.start} » inconnue`);
  }
  const key = (ref: ExitRef) => `${ref.room}:${ref.exit}`;
  const table = new Map<string, ExitRef>();
  const links: [ExitRef, ExitRef][] = [];
  for (const [a, b] of source.links) {
    const from = parseRef(source.id, a);
    const to = parseRef(source.id, b);
    const exits = [from, to].map((ref) => {
      const level = rooms.get(ref.room);
      if (!level) {
        throw new Error(`Zone ${source.id} : salle « ${ref.room} » inconnue (${a} ↔ ${b})`);
      }
      const exit = findEnd(level, ref.exit);
      if (!exit) {
        throw new Error(`Zone ${source.id} : sortie ${key(ref)} absente de la carte`);
      }
      return exit;
    });
    links.push([from, to]);
    const [sideA, sideB] = exits.map((exit) => ('side' in exit ? exit.side : null));
    if (sideA && sideA === sideB) {
      throw new Error(`Zone ${source.id} : ${a} ↔ ${b} relie deux murs du même côté`);
    }
    for (const [ref, other] of [
      [from, to],
      [to, from],
    ] as const) {
      if (table.has(key(ref))) {
        throw new Error(`Zone ${source.id} : sortie ${key(ref)} reliée deux fois`);
      }
      table.set(key(ref), other);
    }
  }
  // Une salle de marée (D-95) : on doit arriver debout aux deux marées.
  const variants = [...rooms].flatMap(([roomId, level]) =>
    level.tide
      ? [[roomId, level] as const, [roomId, highTide(level)] as const]
      : [[roomId, level] as const],
  );
  for (const [roomId, level] of variants) {
    for (const exit of level.exits) {
      const ref = { room: roomId, exit: exit.id };
      if (!table.has(key(ref))) {
        throw new Error(`Zone ${source.id} : sortie ${key(ref)} reliée à rien`);
      }
      const inward = exit.side === 'left' ? exit.col + 1 : exit.col - 1;
      const floor = tileAt(level, inward, exit.rowMax + 1);
      if (floor !== Tile.Solid && floor !== Tile.OneWay) {
        throw new Error(`Zone ${source.id} : pas de sol à l'arrivée de la sortie ${key(ref)}`);
      }
    }
    for (const door of level.doors) {
      const ref = { room: roomId, exit: door.id };
      if (!table.has(key(ref))) {
        throw new Error(`Zone ${source.id} : porte ${key(ref)} reliée à rien`);
      }
      const floor = tileAt(level, door.col, door.row + 1);
      const free =
        tileAt(level, door.col, door.row) === Tile.Empty &&
        tileAt(level, door.col, door.row - 1) === Tile.Empty;
      if (!free || (floor !== Tile.Solid && floor !== Tile.OneWay)) {
        throw new Error(`Zone ${source.id} : on ne tient pas debout devant la porte ${key(ref)}`);
      }
    }
  }
  return {
    id: source.id,
    start: source.start,
    rooms,
    links,
    map: source.map ?? {},
    destination: (room, exit) => table.get(`${room}:${exit}`) ?? null,
  };
}

/**
 * Salle du monde étrange (`; @world: strange`, §6.2) : toujours dessinée en silhouettes, absente
 * de la carte de Céleste (D-34).
 */
export function isStrangeRoom(level: LevelData): boolean {
  return level.meta.world === 'strange';
}

/** La rue et le quartier (D-60) : dehors, de jour (`; @world: street`). */
export function isStreetRoom(level: LevelData): boolean {
  return level.meta.world === 'street';
}

/** Salle du jardin (D-46) : dehors, de jour (`; @world: garden`), sur la carte. */
export function isGardenRoom(level: LevelData): boolean {
  return level.meta.world === 'garden';
}

/**
 * Position (coin haut gauche, px) d'une hitbox arrivant par une sortie : juste à l'intérieur, hors de
 * l'ouverture (pour ne pas repartir aussitôt), pieds au bas de l'ouverture. Par une porte de façade
 * (D-61) : debout devant la porte.
 */
export function arrivalPosition(
  level: LevelData,
  exitId: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const door = findDoor(level, exitId);
  if (door) {
    return { x: (door.col + 0.5) * T - width / 2, y: (door.row + 1) * T - height };
  }
  const exit = findExit(level, exitId);
  if (!exit) {
    throw new Error(`Salle ${level.id} : sortie ${exitId} absente`);
  }
  const x = exit.side === 'left' ? (exit.col + 1) * T + 1 : exit.col * T - width - 1;
  return { x, y: (exit.rowMax + 1) * T - height };
}

/**
 * Numéro de la sortie que la hitbox touche (0 si aucune). Sans allocation : appelée à chaque pas.
 */
export function touchedExit(level: LevelData, box: Box): number {
  const exits = level.exits;
  for (let i = 0; i < exits.length; i++) {
    const exit = exits[i];
    if (!exit) {
      continue;
    }
    const left = exit.col * T;
    const top = exit.rowMin * T;
    const bottom = (exit.rowMax + 1) * T;
    if (
      box.x < left + T &&
      box.x + box.width > left &&
      box.y < bottom &&
      box.y + box.height > top
    ) {
      return exit.id;
    }
  }
  return 0;
}

/**
 * Porte de façade (D-61) devant laquelle se tient la hitbox (0 si aucune) : quelques tuiles de
 * part et d'autre, à hauteur de la porte. Sans allocation : appelée à chaque pas.
 */
export function doorAt(level: LevelData, box: Box): number {
  const doors = level.doors;
  for (let i = 0; i < doors.length; i++) {
    const door = doors[i];
    if (!door) {
      continue;
    }
    const left = (door.col - DOOR_REACH_TILES) * T;
    const right = (door.col + DOOR_REACH_TILES + 1) * T;
    const top = (door.row - 2) * T;
    const bottom = (door.row + 1) * T;
    if (box.x < right && box.x + box.width > left && box.y < bottom && box.y + box.height > top) {
      return door.id;
    }
  }
  return 0;
}
