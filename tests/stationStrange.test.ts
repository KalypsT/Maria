import { describe, expect, it } from 'vitest';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { STRANGE_THINGS, flashbackOf } from '../src/config/memories';
import { StoryFlag } from '../src/config/story';
import { EntityType } from '../src/core/level/LevelData';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { chaseRun } from './pace';
import {
  analysis,
  byDifficulty,
  exitSurface,
  level,
  node,
  nodeAt,
  reachable,
  storyPassages,
  where,
  zone,
  type Node,
  type WindowRule,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
const F = StoryFlag;
const STRANGE = 'station-strange';
const TOWER = 'station-tower';
const easy = byDifficulty('easy');
const medium = byDifficulty('medium');

/** Graphe des deux salles étranges de la gare, Céleste grandie, avec tout (crochet en option). */
function strange(rule: WindowRule, hook = true): Map<Node, Set<Node>> {
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  for (const room of [STRANGE, TOWER]) {
    const min = rule ? rule(room) : 0;
    for (const move of analysis(room, true, 2, true, true, hook).moves) {
      if (move.windowMs >= min) {
        edge(node(room, move.from), node(room, move.to));
      }
    }
  }
  edge(node(STRANGE, exitSurface(STRANGE, 1)), node(TOWER, exitSurface(TOWER, 1)));
  edge(node(TOWER, exitSurface(TOWER, 1)), node(STRANGE, exitSurface(STRANGE, 1)));
  return graph;
}

const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((c) => c.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};
const arrival = () => nodeAt(STRANGE, 3, 37);
const lamp = () => {
  const e = level(STRANGE).entities.find((c) => c.type === EntityType.Checkpoint);
  if (!e) {
    throw new Error('veilleuse absente');
  }
  return nodeAt(STRANGE, e.col, e.row);
};
const rogerNode = () => nodeAt(TOWER, 27, 6);

describe('le monde étrange de la gare (D-68)', () => {
  it('on y entre par le haut des casiers ; hors de la carte ; sa musique', () => {
    for (const room of [STRANGE, TOWER]) {
      expect(isStrangeRoom(level(room)), room).toBe(true);
      expect(level(room).meta.music, room).toBe('station-strange');
    }
    expect(mapPage(zone, STRANGE)).toBeNull();
    expect(zone.destination(STRANGE, 1)).toEqual({ room: TOWER, exit: 1 });
    const passages = storyPassages().filter(([, to]) => to.startsWith(STRANGE));
    expect(passages.length).toBeGreaterThan(0);
    expect(passages.every(([from]) => from.startsWith('station-lost#'))).toBe(true);
    expect(trigger('station-enter').when.none).toEqual([F.StationStrange]);
    expect(trigger('station-reenter').when).toEqual({
      all: [F.StationStrange],
      none: [F.StationDone],
    });
  });

  it(
    'moyen jusqu’à la veilleuse turquoise ; la tour seulement avec le crochet',
    { timeout: TIMEOUT },
    () => {
      expect(reachable(strange(medium), arrival()).has(lamp())).toBe(true);
      expect(reachable(strange(easy), arrival()).has(lamp()), 'trop facile').toBe(false);
      const tower = node(TOWER, exitSurface(TOWER, 1));
      expect(reachable(strange(medium), lamp()).has(tower)).toBe(true);
      expect(reachable(strange(easy), lamp()).has(tower), 'trop facile').toBe(false);
      expect(reachable(strange(null, false), arrival()).has(tower), 'sans crochet').toBe(false);
    },
  );

  it(
    'la tour mène à Roger (moyen en statique : la difficulté vient du poursuivant)',
    {
      timeout: TIMEOUT,
    },
    () => {
      const entrance = node(TOWER, exitSurface(TOWER, 1));
      expect(level(TOWER).chase?.endRow).toBe(7);
      expect(reachable(strange(medium), entrance).has(rogerNode())).toBe(true);
      expect(reachable(strange(easy), entrance).has(rogerNode()), 'trop facile').toBe(false);
    },
  );

  it(
    'la poursuite (Céleste grandie) : le chemin le plus rapide la devance toujours, un joueur bien plus lent est rattrapé',
    { timeout: TIMEOUT },
    () => {
      const tower = level(TOWER);
      const a = analysis(TOWER, true, 2, true, true, true);
      const top = { col: 27, row: 6 };
      const starts = [
        tower.spawn,
        ...tower.entities.filter(
          (e) => e.type === EntityType.Checkpoint && e.row < tower.spawn.row,
        ),
      ];
      for (const start of starts) {
        const run = chaseRun(tower, a, start, top, DIFFICULTY_MIN_WINDOW_MS.medium);
        expect(run.contacts, `depuis la ligne ${String(start.row)}`).toBe(0);
        expect(run.margin, `depuis la ligne ${String(start.row)}`).toBeGreaterThan(3);
      }
      // Un peu difficile : 50 % plus lent que le chemin parfait, il touche Céleste.
      const slow = chaseRun(tower, a, tower.spawn, top, DIFFICULTY_MIN_WINDOW_MS.medium, 1.5);
      expect(slow.contacts).toBeGreaterThan(0);
    },
  );

  it('Roger : on le regarde sans le prendre ; un souvenir du « Monde étrange » et son court souvenir', () => {
    const t = trigger('station-roger');
    expect(t.room).toBe(TOWER);
    expect(t.steps.some((s) => s.do === 'memory' && s.id === 'roger')).toBe(true);
    expect(t.steps.filter((s) => s.do === 'flashback').map((s) => s)).toMatchObject([
      { id: 'roger' },
    ]);
    expect(STRANGE_THINGS).toContain('roger');
    expect(flashbackOf('roger')).toBe('roger');
    expect(flashbackOf('shape-box')).toBeNull();
    const prop = HOUSE_STORY.props.find((p) => p.id === 'roger');
    expect(prop?.room).toBe(TOWER);
    expect(prop?.instant).toBeFalsy();
    // Maria n'est pas dans ce monde étrange (pilier 5).
    expect(
      HOUSE_STORY.props.filter((p) => p.room.startsWith('station-') && p.kind.startsWith('maria')),
    ).toEqual([]);
    // La fin ramène Céleste dans le hall, assise, avec un point de retour.
    const room = t.steps.find((s) => s.do === 'room');
    expect(room).toMatchObject({ room: 'station-hall', returnPoint: true });
  });

  it(
    'ne coince jamais Céleste : de partout, Roger reste atteignable (pas de sortie volontaire)',
    { timeout: TIMEOUT },
    () => {
      const roomRule: WindowRule = (room) =>
        DIFFICULTY_MIN_WINDOW_MS[(level(room).meta.difficulty ?? 'easy') as 'easy'];
      const safe = strange(roomRule);
      const all = reachable(strange(null), arrival());
      const stuck = [...all].filter((n) => !reachable(safe, n).has(rogerNode()));
      expect(where(stuck, true)).toEqual([]);
    },
  );
});
