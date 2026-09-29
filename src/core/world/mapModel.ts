import { TILE_SIZE as T } from '../../config/display';
import { EntityType } from '../level/LevelData';
import { checkpointId } from '../save/saveData';
import { secretId } from './Pickups';
import { isStrangeRoom, type MapBox, type Zone } from './zone';

/** Point sur la carte (unités de carte). */
export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export interface MapRoom {
  readonly id: string;
  readonly name: string;
  readonly box: MapBox;
  /** Visitée (dessinée) ou devinée (voisine d'une salle visitée : contour et « ? »). */
  readonly visited: boolean;
  /** Découverte depuis la dernière ouverture de la carte (tracé animé). */
  readonly fresh: boolean;
  /** Veilleuses allumées ; `current` : le point de retour. */
  readonly lamps: readonly (MapPoint & { readonly current: boolean })[];
  /** Trouvailles déjà ramassées (les autres ne sont jamais révélées, §24). */
  readonly stars: readonly MapPoint[];
  /** Icône de la salle (`; @icon:`), dessinée par la carte. */
  readonly icon: string | null;
}

export interface MapLink {
  readonly from: MapPoint;
  readonly to: MapPoint;
  /** Côté de chaque extrémité (-1 : mur gauche, 1 : mur droit), pour les amorces. */
  readonly fromSide: number;
  readonly toSide: number;
  /** Passage direct (salles côte à côte) ou lointain (trappe, passage secret : pointillés). */
  readonly direct: boolean;
}

export interface MapModel {
  readonly rooms: readonly MapRoom[];
  readonly links: readonly MapLink[];
  /** Céleste, dans sa salle (null hors de la zone). */
  readonly celeste: MapPoint | null;
}

/** Ce que la carte lit de la partie. */
export interface MapProgress {
  readonly visited: readonly string[];
  /** Salles déjà dessinées lors d'une ouverture précédente. */
  readonly seen: ReadonlySet<string>;
  readonly activatedCheckpoints: readonly string[];
  readonly checkpoint: { readonly levelId: string; readonly checkpointId: string | null };
  readonly collectibles: readonly string[];
  /** Salle et position de Céleste (px), ou null. */
  readonly celeste: { readonly room: string; readonly x: number; readonly y: number } | null;
}

/** Écart maximal entre deux salles pour que leur passage soit « direct » (unités de carte). */
const DIRECT_GAP = 0.6;

/**
 * Modèle de la carte dessinée par Céleste (§24), pur : quelles salles dessiner, lesquelles sont
 * devinées, où placer les liaisons, Céleste, les veilleuses allumées et les trouvailles trouvées.
 */
export function buildMapModel(zone: Zone, progress: MapProgress): MapModel {
  const visited = new Set(progress.visited.filter((id) => zone.rooms.has(id)));
  const guessed = new Set<string>();
  for (const [a, b] of zone.links) {
    if (visited.has(a.room) && !visited.has(b.room)) {
      guessed.add(b.room);
    }
    if (visited.has(b.room) && !visited.has(a.room)) {
      guessed.add(a.room);
    }
  }
  const at = (roomId: string, px: number, py: number): MapPoint | null => {
    const box = zone.map[roomId];
    const level = zone.rooms.get(roomId);
    if (!box || !level) {
      return null;
    }
    return {
      x: box.x + (px / (level.width * T)) * box.w,
      y: box.y + (py / (level.height * T)) * box.h,
    };
  };
  const rooms: MapRoom[] = [];
  for (const [id, level] of zone.rooms) {
    const box = zone.map[id];
    const isVisited = visited.has(id);
    if (!box || (!isVisited && !guessed.has(id))) {
      continue;
    }
    const lamps: (MapPoint & { current: boolean })[] = [];
    const stars: MapPoint[] = [];
    if (isVisited) {
      for (const entity of level.entities) {
        const center = at(id, (entity.col + 0.5) * T, (entity.row + 0.5) * T);
        if (!center) {
          continue;
        }
        if (entity.type === EntityType.Checkpoint) {
          const cp = checkpointId(entity.col, entity.row);
          if (progress.activatedCheckpoints.includes(`${id}:${cp}`)) {
            const current =
              progress.checkpoint.levelId === id && progress.checkpoint.checkpointId === cp;
            lamps.push({ ...center, current });
          }
        } else if (
          entity.type === EntityType.Secret &&
          progress.collectibles.includes(secretId(id, entity.col, entity.row))
        ) {
          stars.push(center);
        }
      }
    }
    rooms.push({
      id,
      name: level.meta.name ?? id,
      box,
      visited: isVisited,
      fresh: isVisited && !progress.seen.has(id),
      lamps,
      stars,
      icon: level.meta.icon ?? null,
    });
  }
  const shown = new Set(rooms.map((room) => room.id));
  const links: MapLink[] = [];
  for (const [a, b] of zone.links) {
    if (
      !shown.has(a.room) ||
      !shown.has(b.room) ||
      (!visited.has(a.room) && !visited.has(b.room))
    ) {
      continue;
    }
    const from = exitPoint(zone, a.room, a.exit);
    const to = exitPoint(zone, b.room, b.exit);
    if (from && to) {
      links.push({
        from,
        to,
        fromSide: exitSide(zone, a.room, a.exit),
        toSide: exitSide(zone, b.room, b.exit),
        // Salles côte à côte : l'écart horizontal suffit (les portes peuvent être décalées).
        direct: Math.abs(from.x - to.x) <= DIRECT_GAP,
      });
    }
  }
  const c = progress.celeste;
  const celeste = c && visited.has(c.room) ? at(c.room, c.x, c.y) : null;
  return { rooms, links, celeste };
}

function exitSide(zone: Zone, roomId: string, exitId: number): number {
  const exit = zone.rooms.get(roomId)?.exits.find((e) => e.id === exitId);
  return exit?.side === 'left' ? -1 : 1;
}

/** Point d'une sortie sur le bord de la boîte de sa salle. */
function exitPoint(zone: Zone, roomId: string, exitId: number): MapPoint | null {
  const box = zone.map[roomId];
  const level = zone.rooms.get(roomId);
  const exit = level?.exits.find((e) => e.id === exitId);
  if (!box || !level || !exit) {
    return null;
  }
  const middle = (exit.rowMin + exit.rowMax + 1) / 2 / level.height;
  return { x: exit.side === 'left' ? box.x : box.x + box.w, y: box.y + middle * box.h };
}

/**
 * Cohérence de la carte d'une zone : une boîte par salle, sans chevauchement. Les salles du monde
 * étrange n'y figurent jamais (D-34).
 */
export function mapProblems(zone: Zone): string[] {
  const problems: string[] = [];
  const boxes = [...zone.rooms].map(([id, level]) => ({ id, level, box: zone.map[id] }));
  for (const { id, level, box } of boxes) {
    if (isStrangeRoom(level) && box) {
      problems.push(`salle étrange ${id} dessinée sur la carte`);
    } else if (!isStrangeRoom(level) && !box) {
      problems.push(`salle ${id} absente de la carte`);
    }
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]?.box;
      const b = boxes[j]?.box;
      if (a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
        problems.push(
          `${String(boxes[i]?.id)} et ${String(boxes[j]?.id)} se chevauchent sur la carte`,
        );
      }
    }
  }
  return problems;
}
