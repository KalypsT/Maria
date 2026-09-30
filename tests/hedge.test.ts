import { describe, expect, it } from 'vitest';
import { StoryFlag } from '../src/config/story';
import { EntityType } from '../src/core/level/LevelData';
import { isStrangeRoom } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  byDifficulty,
  level,
  nodeAt,
  reachable,
  roomOf,
  storyPassages,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';

const TIMEOUT = 180_000;

function trigger(id: string) {
  const t = HOUSE_STORY.triggers.find((candidate) => candidate.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
}
function prop(id: string) {
  const p = HOUSE_STORY.props.find((candidate) => candidate.id === id);
  if (!p) {
    throw new Error(`objet ${id} absent`);
  }
  return p;
}

/** Arrivée dans le jardin renversé (script du trou de la haie). */
function arrival(): Node {
  const step = trigger('hedge-enter').steps.find((s) => s.do === 'room');
  if (step?.do !== 'room') {
    throw new Error('pas de changement de salle');
  }
  return nodeAt(step.room, step.col, step.row);
}
const bonnet = () => nodeAt('garden-thorns', prop('bonnet-thorns').col, prop('bonnet-thorns').row);
/** Veilleuse turquoise sur la haie suspendue, juste avant la cheminée difficile. */
function lastLamp(): Node {
  const lamps = level('garden-thorns').entities.filter((e) => e.type === EntityType.Checkpoint);
  const high = lamps.reduce((a, b) => (b.row < a.row ? b : a));
  return nodeAt('garden-thorns', high.col, high.row);
}

/** Graphe restreint au monde étrange du jardin (on n'en sort que par la fin ou un évanouissement). */
function hedgeGraph(rule: Parameters<typeof zoneGraph>[1]): Map<Node, Set<Node>> {
  const inside = (n: Node) => roomOf(n) === 'garden-upside' || roomOf(n) === 'garden-thorns';
  const result = new Map<Node, Set<Node>>();
  for (const [from, next] of zoneGraph(true, rule, 2, true)) {
    if (inside(from)) {
      result.set(from, new Set([...next].filter(inside)));
    }
  }
  return result;
}

describe('derrière la haie (D-49)', () => {
  it('ses salles sont étranges, absentes de la carte, reliées entre elles seulement', () => {
    for (const id of ['garden-upside', 'garden-thorns']) {
      expect(isStrangeRoom(level(id)), id).toBe(true);
      expect(zone.map[id], id).toBeUndefined();
    }
    const from = storyPassages()
      .filter(([, to]) => to === arrival())
      .map(([f]) => f);
    expect(from.length).toBeGreaterThan(0);
    expect(from.every((n) => roomOf(n) === 'garden-tree')).toBe(true);
  });

  it('on n’y passe qu’une fois le saut mural trouvé dans la cabane', () => {
    for (const id of ['hedge-enter', 'hedge-reenter']) {
      const t = trigger(id);
      const needs = [...(t.when.all ?? [])];
      expect(
        needs.includes(StoryFlag.GardenTreehouse) || needs.includes(StoryFlag.HedgeEntered),
        id,
      ).toBe(true);
    }
    expect(trigger('treehouse-find').room).toBe('garden-treehouse');
  });

  it(
    'chemin jusqu’au bonnet : difficile exactement, la cheminée difficile juste après la veilleuse',
    { timeout: TIMEOUT },
    () => {
      const hard = hedgeGraph(byDifficulty('hard'));
      const medium = hedgeGraph(byDifficulty('medium'));
      expect(reachable(hard, arrival()).has(bonnet()), 'trop difficile').toBe(true);
      expect(reachable(medium, arrival()).has(bonnet()), 'trop facile').toBe(false);
      // Jusqu'à la dernière veilleuse, c'est moyen ; après, c'est le passage difficile.
      expect(reachable(medium, arrival()).has(lastLamp()), 'avant la veilleuse').toBe(true);
      expect(reachable(hard, lastLamp()).has(bonnet())).toBe(true);
    },
  );

  it(
    'Maria reste hors d’atteinte, même en grimpant et avec le saut mural',
    { timeout: TIMEOUT },
    () => {
      const maria = prop('maria-thorns');
      const spot = nodeAt('garden-thorns', maria.col, maria.row);
      expect(reachable(hedgeGraph(null), arrival()).has(spot)).toBe(false);
      expect(maria.when.none).toContain(StoryFlag.HedgeDone);
    },
  );

  it('la fin ramène au pied du grand arbre, Céleste assise dans l’herbe, le bonnet à côté (D-58)', () => {
    const end = trigger('thorns-bonnet');
    const room = end.steps.find((s) => s.do === 'room');
    expect(room?.do === 'room' && room.room).toBe('garden-tree');
    expect(room?.do === 'room' && room.returnPoint).toBe(true);
    const after = end.steps.slice(end.steps.indexOf(room as (typeof end.steps)[number]));
    expect(after.some((s) => s.do === 'pose' && s.pose === 'sit')).toBe(true);
    // Le bonnet se ramasse ensuite avec Agir (les affaires de Maria).
    expect(end.steps.some((s) => s.do === 'memory')).toBe(false);
    expect(prop('bonnet-grass').room).toBe('garden-tree');
    expect(level('garden-tree').entities.some((e) => e.type === EntityType.Checkpoint)).toBe(true);
  });

  it('un escargot sur la haie de la première cheminée', () => {
    expect(level('garden-thorns').entities.some((e) => e.type === EntityType.Snail)).toBe(true);
  });
});
