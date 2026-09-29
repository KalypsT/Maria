import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt, type LevelData, type LevelExit } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
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
}

export interface ExitRef {
  readonly room: string;
  readonly exit: number;
}

export interface Zone {
  readonly id: string;
  readonly start: string;
  readonly rooms: ReadonlyMap<string, LevelData>;
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

/**
 * Construit et valide une zone : salles lisibles, liaisons vers des sorties existantes, chaque sortie
 * reliée exactement une fois, un mur gauche relié à un mur droit (cohérence spatiale), un sol sous
 * chaque sortie pour y arriver debout. Toute incohérence lève une erreur explicite.
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
  for (const [a, b] of source.links) {
    const from = parseRef(source.id, a);
    const to = parseRef(source.id, b);
    const exits = [from, to].map((ref) => {
      const level = rooms.get(ref.room);
      if (!level) {
        throw new Error(`Zone ${source.id} : salle « ${ref.room} » inconnue (${a} ↔ ${b})`);
      }
      const exit = findExit(level, ref.exit);
      if (!exit) {
        throw new Error(`Zone ${source.id} : sortie ${key(ref)} absente de la carte`);
      }
      return exit;
    });
    if (exits[0]?.side === exits[1]?.side) {
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
  for (const [roomId, level] of rooms) {
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
  }
  return {
    id: source.id,
    start: source.start,
    rooms,
    destination: (room, exit) => table.get(`${room}:${exit}`) ?? null,
  };
}

/**
 * Position (coin haut gauche, px) d'une hitbox arrivant par une sortie : juste à l'intérieur, hors de
 * l'ouverture (pour ne pas repartir aussitôt), pieds au bas de l'ouverture.
 */
export function arrivalPosition(
  level: LevelData,
  exitId: number,
  width: number,
  height: number,
): { x: number; y: number } {
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
