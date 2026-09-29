import { describe, expect, it } from 'vitest';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { EntityType } from '../src/core/level/LevelData';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

const TIMEOUT = 120_000;
/** La maison est la première zone : chaque passage nécessaire reste facile (D-16). */
const MIN_WINDOW_MS = DIFFICULTY_MIN_WINDOW_MS.easy;

const zone = buildZone(HOUSE);
function level(room: string) {
  const result = zone.rooms.get(room);
  if (!result) {
    throw new Error(`salle ${room} absente`);
  }
  return result;
}

/** Analyse de chaque salle, sans puis avec l'escalade (les surfaces sont les mêmes). */
const analyses = new Map<string, LevelAnalysis>();
function analysis(room: string, climb: boolean): LevelAnalysis {
  const key = `${room}:${String(climb)}`;
  let result = analyses.get(key);
  if (!result) {
    result = analyzeLevel(level(room), DEFAULT_MOVEMENT, { climb });
    analyses.set(key, result);
  }
  return result;
}

/** Surface sous une tuile (col, row) : celle où l'on se tient à cet endroit. */
function surfaceAt(room: string, col: number, row: number): number {
  return surfaceUnder(level(room), analysis(room, false).map, col, row);
}

/** Surface sur laquelle on arrive par une sortie (et d'où on la franchit). */
function exitSurface(room: string, exitId: number): number {
  const exit = level(room).exits.find((e) => e.id === exitId);
  if (!exit) {
    throw new Error(`sortie ${room}:${exitId} absente`);
  }
  return surfaceAt(room, exit.side === 'left' ? exit.col + 1 : exit.col - 1, exit.rowMax);
}

type Node = string;
const node = (room: string, surface: number): Node => `${room}#${surface}`;

/**
 * Graphe de la zone : passages dans chaque salle (seulement les faciles si `easyOnly`), sorties
 * entre les salles.
 */
function zoneGraph(climb: boolean, easyOnly: boolean): Map<Node, Set<Node>> {
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  for (const [room, data] of zone.rooms) {
    for (const move of analysis(room, climb).moves) {
      if (!easyOnly || move.windowMs >= MIN_WINDOW_MS) {
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

const home = () => node(zone.start, analysis(zone.start, false).start);

/** Objet de capacité (D-26) : la surface où il est posé. */
function pickup(): Node {
  for (const [room, data] of zone.rooms) {
    const entity = data.entities.find((e) => e.type === EntityType.Ability);
    if (entity) {
      expect(data.meta.ability).toBe('climb');
      return node(room, surfaceAt(room, entity.col, entity.row));
    }
  }
  throw new Error('aucun objet de capacité dans la maison');
}

/** Endroits prévus pour l'escalade (D-26) : où l'on se tient une fois hissée. */
const CLIMB_SPOTS: readonly [string, string, number, number][] = [
  ['dessus de l’armoire', 'bedroom', 3, 8],
  ['trappe à linge', 'hall', 61, 7],
  ['dessus de la bibliothèque', 'living', 50, 8],
  ['dessus des placards hauts', 'kitchen', 45, 8],
];

function where(nodes: Iterable<Node>, climb: boolean): string[] {
  return [...nodes].map((n) => {
    const [room, id] = n.split('#');
    const s = room ? analysis(room, climb).map.surfaces[Number(id)] : undefined;
    return s ? `${room} ligne ${s.row + 1}, col. ${s.colStart + 1}–${s.colEnd + 1}` : n;
  });
}

describe.each([false, true])('maison (D-25), escalade %s', (climb) => {
  it('toutes les salles sont atteignables depuis le lit', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(climb, true), home());
    const rooms = new Set([...seen].map((n) => n.split('#')[0]));
    expect([...zone.rooms.keys()].filter((room) => !rooms.has(room))).toEqual([]);
  });

  it(
    'ne coince jamais Céleste : la chambre reste atteignable facilement',
    { timeout: TIMEOUT },
    () => {
      // Tout ce qu'on peut atteindre, même par un saut raté ou risqué, doit ramener à la chambre
      // par des passages faciles.
      const easy = zoneGraph(climb, true);
      const stuck = [...reachable(zoneGraph(climb, false), home())].filter(
        (n) => !reachable(easy, n).has(home()),
      );
      expect(where(stuck, climb), 'surfaces sans retour possible').toEqual([]);
    },
  );
});

describe('grimper aux rebords dans la maison (D-26)', () => {
  it('l’objet de capacité est atteignable sans grimper', { timeout: TIMEOUT }, () => {
    expect(reachable(zoneGraph(false, true), home()).has(pickup())).toBe(true);
  });

  it('sans grimper, les endroits prévus restent hors d’atteinte', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(false, false), home());
    const open = CLIMB_SPOTS.filter(([, room, col, row]) =>
      seen.has(node(room, surfaceAt(room, col, row))),
    );
    expect(open.map(([name]) => name)).toEqual([]);
  });

  it('en grimpant, ils sont atteignables facilement', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(true, true), pickup());
    for (const [name, room, col, row] of CLIMB_SPOTS) {
      expect(surfaceAt(room, col, row), name).toBeGreaterThanOrEqual(0);
      expect(seen.has(node(room, surfaceAt(room, col, row))), name).toBe(true);
    }
  });

  it('la trappe à linge ferme la boucle : de la buanderie au couloir', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(true, true), pickup());
    expect(seen.has(node('hall', exitSurface('hall', 3)))).toBe(true);
    // Dans la buanderie même : du sol (porte de la cuisine) jusqu'à la trappe, en grimpant.
    const laundry = new Map<Node, Set<Node>>();
    for (const move of analysis('laundry', true).moves) {
      if (move.windowMs >= MIN_WINDOW_MS) {
        const from = node('laundry', move.from);
        laundry.set(from, (laundry.get(from) ?? new Set()).add(node('laundry', move.to)));
      }
    }
    const up = reachable(laundry, node('laundry', exitSurface('laundry', 2)));
    expect(up.has(node('laundry', exitSurface('laundry', 1)))).toBe(true);
  });
});
