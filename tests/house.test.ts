import { describe, expect, it } from 'vitest';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

const TIMEOUT = 60_000;
/** La maison est la première zone : chaque passage nécessaire reste facile (D-16). */
const MIN_WINDOW_MS = DIFFICULTY_MIN_WINDOW_MS.easy;

const zone = buildZone(HOUSE);
const analyses = new Map<string, LevelAnalysis>();
function analysis(room: string): LevelAnalysis {
  let result = analyses.get(room);
  if (!result) {
    const level = zone.rooms.get(room);
    if (!level) {
      throw new Error(`salle ${room} absente`);
    }
    result = analyzeLevel(level, DEFAULT_MOVEMENT);
    analyses.set(room, result);
  }
  return result;
}

/** Surface sur laquelle on arrive par une sortie (et d'où on la franchit). */
function exitSurface(room: string, exitId: number): number {
  const level = zone.rooms.get(room);
  const exit = level?.exits.find((e) => e.id === exitId);
  if (!level || !exit) {
    throw new Error(`sortie ${room}:${exitId} absente`);
  }
  const inward = exit.side === 'left' ? exit.col + 1 : exit.col - 1;
  return surfaceUnder(level, analysis(room).map, inward, exit.rowMax);
}

type Node = string;
const node = (room: string, surface: number): Node => `${room}#${surface}`;

/**
 * Graphe de la zone : passages dans chaque salle (seulement les faciles si `easyOnly`), sorties
 * entre les salles.
 */
function zoneGraph(easyOnly: boolean): Map<Node, Set<Node>> {
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  for (const [room, level] of zone.rooms) {
    for (const move of analysis(room).moves) {
      if (!easyOnly || move.windowMs >= MIN_WINDOW_MS) {
        edge(node(room, move.from), node(room, move.to));
      }
    }
    for (const exit of level.exits) {
      const to = zone.destination(room, exit.id);
      if (to) {
        edge(node(room, exitSurface(room, exit.id)), node(to.room, exitSurface(to.room, to.exit)));
      }
    }
  }
  return graph;
}

function reachable(graph: Map<Node, Set<Node>>, from: Node): Set<Node> {
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

describe('maison (D-25)', () => {
  const start = () => {
    const level = zone.rooms.get(zone.start);
    if (!level) {
      throw new Error('salle de départ absente');
    }
    return node(zone.start, analysis(zone.start).start);
  };

  it('toutes les salles sont atteignables depuis le lit de Céleste', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(true), start());
    const rooms = new Set([...seen].map((n) => n.split('#')[0]));
    expect([...zone.rooms.keys()].filter((room) => !rooms.has(room))).toEqual([]);
  });

  it(
    'ne coince jamais Céleste : la chambre reste atteignable facilement',
    { timeout: TIMEOUT },
    () => {
      // Tout ce qu'on peut atteindre, même par un saut raté ou risqué, doit ramener à la chambre
      // par des passages faciles.
      const easy = zoneGraph(true);
      const home = start();
      const stuck = [...reachable(zoneGraph(false), home)].filter(
        (n) => !reachable(easy, n).has(home),
      );
      const where = stuck.map((n) => {
        const [room, id] = n.split('#');
        const s = room ? analysis(room).map.surfaces[Number(id)] : undefined;
        return s ? `${room} ligne ${s.row + 1}, col. ${s.colStart + 1}–${s.colEnd + 1}` : n;
      });
      expect(where, 'surfaces sans retour possible').toEqual([]);
    },
  );

  it('la trappe à linge reste fermée sans grimper (D-26)', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(false), start());
    expect(seen.has(node('hall', exitSurface('hall', 3)))).toBe(false);
  });
});
