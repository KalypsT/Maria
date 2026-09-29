import { DIFFICULTY_MIN_WINDOW_MS, type Difficulty } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import type { StoryData } from '../src/core/story/story';
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

/** Analyse de chaque salle, sans puis avec l'escalade (les surfaces sont les mêmes). */
const analyses = new Map<string, LevelAnalysis>();
export function analysis(room: string, climb: boolean): LevelAnalysis {
  const key = `${room}:${String(climb)}`;
  let result = analyses.get(key);
  if (!result) {
    result = analyzeLevel(level(room), DEFAULT_MOVEMENT, { climb });
    analyses.set(key, result);
  }
  return result;
}

/** Surface sous une tuile (col, row) : celle où l'on se tient à cet endroit (-1 : aucune). */
export function surfaceAt(room: string, col: number, row: number): number {
  return surfaceUnder(level(room), analysis(room, false).map, col, row);
}

/** Surface sur laquelle on arrive par une sortie (et d'où on la franchit). */
export function exitSurface(room: string, exitId: number): number {
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

export function zoneGraph(climb: boolean, rule: WindowRule): Map<Node, Set<Node>> {
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  for (const [room, data] of zone.rooms) {
    const min = rule ? rule(room) : 0;
    for (const move of analysis(room, climb).moves) {
      if (move.windowMs >= min) {
        edge(node(room, move.from), node(room, move.to));
      }
    }
    for (const exit of data.exits) {
      const to = zone.destination(room, exit.id);
      if (to) {
        edge(node(room, exitSurface(room, exit.id)), node(to.room, exitSurface(to.room, to.exit)));
      }
    }
  }
  for (const [from, to] of storyPassages()) {
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

export function where(nodes: Iterable<Node>, climb: boolean): string[] {
  return [...nodes].map((n) => {
    const [room, id] = n.split('#');
    const s = room ? analysis(room, climb).map.surfaces[Number(id)] : undefined;
    return s ? `${room} ligne ${s.row + 1}, col. ${s.colStart + 1}–${s.colEnd + 1}` : n;
  });
}
