import { DIFFICULTY_MIN_WINDOW_MS, type Difficulty } from '../src/config/levelDesign';
import { GROWTH_PHASES, phaseMovement, type GrowthPhase } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { findSurfaces, surfaceUnder, type SurfaceMap } from '../src/core/analysis/surfaces';
import { StoryFlag } from '../src/config/story';
import { checkCondition, type StoryData } from '../src/core/story/story';
import { buildZone } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { HOUSE } from '../src/levels/house/zone';

/**
 * Graphe de faisabilité de la maison (D-16, D-25) : surfaces de chaque salle, passages entre elles,
 * sorties, et passages de l'histoire (changement de salle dans le noir, D-34). Partagé par les
 * tests de la maison et du monde étrange.
 */
export const zone = buildZone(HOUSE);

export function level(room: string) {
  const result = zone.rooms.get(room);
  if (!result) {
    throw new Error(`salle ${room} absente`);
  }
  return result;
}

/** Phase de croissance (D-43) d'après son numéro. */
export function phase(id: number): GrowthPhase {
  const result = GROWTH_PHASES.find((p) => p.id === id);
  if (!result) {
    throw new Error(`phase ${String(id)} absente`);
  }
  return result;
}

/**
 * Analyse de chaque salle, sans puis avec l'escalade (et le saut mural, D-44), à une phase de croissance (les surfaces
 * sont les mêmes : toute hauteur de hitbox < 2 tuiles demande les mêmes 2 tuiles libres).
 */
const analyses = new Map<string, LevelAnalysis>();
export function analysis(
  room: string,
  climb: boolean,
  growth = 1,
  wallJump = false,
): LevelAnalysis {
  const key = `${room}:${String(climb)}:${String(growth)}:${String(wallJump)}`;
  let result = analyses.get(key);
  if (!result) {
    const p = phase(growth);
    result = analyzeLevel(level(room), phaseMovement(DEFAULT_MOVEMENT, p), {
      climb,
      wallJump,
      hitbox: p.hitbox,
    });
    analyses.set(key, result);
  }
  return result;
}

/**
 * Surfaces de chaque salle : les mêmes (mêmes indices) que celles de l'analyse, sans calculer les
 * passages (plusieurs secondes par salle).
 */
const surfaceMaps = new Map<string, SurfaceMap>();
function surfaces(room: string): SurfaceMap {
  let map = surfaceMaps.get(room);
  if (!map) {
    map = findSurfaces(level(room), phase(1).hitbox.height);
    surfaceMaps.set(room, map);
  }
  return map;
}

/** Surface sous une tuile (col, row) : celle où l'on se tient à cet endroit (-1 : aucune). */
export function surfaceAt(room: string, col: number, row: number): number {
  return surfaceUnder(level(room), surfaces(room), col, row);
}

/** Surface sur laquelle on arrive par une sortie ou une porte de façade (et d'où on la franchit). */
export function exitSurface(room: string, exitId: number): number {
  const door = level(room).doors.find((d) => d.id === exitId);
  if (door) {
    return surfaceAt(room, door.col, door.row);
  }
  const exit = level(room).exits.find((e) => e.id === exitId);
  if (!exit) {
    throw new Error(`sortie ${room}:${exitId} absente`);
  }
  return surfaceAt(room, exit.side === 'left' ? exit.col + 1 : exit.col - 1, exit.rowMax);
}

export type Node = string;
export const node = (room: string, surface: number): Node => `${room}#${surface}`;
export const nodeAt = (room: string, col: number, row: number): Node =>
  node(room, surfaceAt(room, col, row));

/** Fenêtre minimale des passages retenus dans une salle ; null : tous les passages. */
export type WindowRule = ((room: string) => number) | null;
export const fixedWindow = (ms: number) => () => ms;
export const byDifficulty = (difficulty: Difficulty) =>
  fixedWindow(DIFFICULTY_MIN_WINDOW_MS[difficulty]);
/** Difficulté déclarée par chaque salle (`; @difficulty:`), facile par défaut (D-16). */
export const roomDifficulty: WindowRule = (room) => {
  const declared = level(room).meta.difficulty as Difficulty | undefined;
  return DIFFICULTY_MIN_WINDOW_MS[declared ?? 'easy'];
};

/**
 * Passages de l'histoire : d'une surface de la zone d'un déclencheur à l'endroit où un script
 * `room` place Céleste (quelles que soient les étapes vécues).
 */
export function storyPassages(story: StoryData = HOUSE_STORY): [Node, Node][] {
  const passages: [Node, Node][] = [];
  for (const t of story.triggers) {
    const step = t.steps.find((s) => s.do === 'room');
    if (!t.area || step?.do !== 'room') {
      continue;
    }
    const to = nodeAt(step.room, step.col, step.row);
    const seen = new Set<number>();
    // Tuiles de la zone, et la ligne du dessous (Céleste debout touche la zone par le haut).
    for (let row = t.area.row; row <= t.area.row + t.area.h; row++) {
      for (let col = t.area.col; col < t.area.col + t.area.w; col++) {
        const s = surfaceAt(t.room, col, row);
        if (s >= 0 && !seen.has(s)) {
          seen.add(s);
          passages.push([node(t.room, s), to]);
        }
      }
    }
  }
  return passages;
}

export function zoneGraph(
  climb: boolean,
  rule: WindowRule,
  growth = 1,
  wallJump = false,
  /** Étapes vécues qui ouvrent des portes fermées (le portillon, D-60). */
  flags: readonly string[] = [],
): Map<Node, Set<Node>> {
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  // Portes fermées selon la phase de croissance (la porte de derrière, D-46), dans les deux sens.
  const phaseFlags = new Set<string>([...flags, ...(growth >= 2 ? [StoryFlag.Grown] : [])]);
  const closed = new Set<string>();
  for (const lock of HOUSE_STORY.lockedRooms) {
    if (lock.exit !== undefined && checkCondition(phaseFlags, lock.when)) {
      closed.add(`${lock.room}:${String(lock.exit)}`);
      const other = zone.destination(lock.room, lock.exit);
      if (other) {
        closed.add(`${other.room}:${String(other.exit)}`);
      }
    }
  }
  for (const [room, data] of zone.rooms) {
    const min = rule ? rule(room) : 0;
    for (const move of analysis(room, climb, growth, wallJump).moves) {
      if (move.windowMs >= min) {
        edge(node(room, move.from), node(room, move.to));
      }
    }
    for (const exit of [...data.exits, ...data.doors]) {
      const to = zone.destination(room, exit.id);
      if (to && !closed.has(`${room}:${String(exit.id)}`)) {
        edge(node(room, exitSurface(room, exit.id)), node(to.room, exitSurface(to.room, to.exit)));
      }
    }
  }
  // Passages de l'histoire : le monde étrange de la maison a lieu avant que Céleste grandisse,
  // celui du jardin après (D-49), et le trou de la haie ne s'ouvre qu'une fois le saut mural
  // trouvé dans la cabane.
  for (const [from, to] of storyPassages()) {
    const inGarden = roomOf(from).startsWith('garden-');
    if (inGarden !== growth >= 2 || (roomOf(from) === 'garden-tree' && !wallJump)) {
      continue;
    }
    edge(from, to);
  }
  return graph;
}

export function reachable(graph: Map<Node, Set<Node>>, from: Node): Set<Node> {
  const seen = new Set([from]);
  const queue = [from];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const next of graph.get(n) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/** Salle d'un nœud du graphe. */
export const roomOf = (n: Node): string => n.split('#')[0] ?? '';

export function where(nodes: Iterable<Node>, climb: boolean): string[] {
  return [...nodes].map((n) => {
    const [room, id] = n.split('#');
    const s = room ? analysis(room, climb).map.surfaces[Number(id)] : undefined;
    return s ? `${room} ligne ${s.row + 1}, col. ${s.colStart + 1}–${s.colEnd + 1}` : n;
  });
}
