import { describe, expect, it } from 'vitest';
import { EntityType } from '../src/core/level/LevelData';
import { isStrangeRoom } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  byDifficulty,
  level,
  nodeAt,
  reachable,
  storyPassages,
  where,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;

function trigger(id: string) {
  const t = HOUSE_STORY.triggers.find((candidate) => candidate.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
}

/** Arrivée dans le salon étrange (script du haut de la bibliothèque). */
function arrival(): Node {
  const step = trigger('living-vanish').steps.find((s) => s.do === 'room');
  if (step?.do !== 'room') {
    throw new Error('pas de changement de salle');
  }
  return nodeAt(step.room, step.col, step.row);
}

/** Berceau vide : là où l'on se tient pour Agir. */
function cradle(): Node {
  const prop = HOUSE_STORY.props.find((p) => p.id === 'cradle-shadows');
  if (!prop) {
    throw new Error('berceau absent');
  }
  return nodeAt('shadows', prop.col, prop.row);
}

/** Graphe restreint au monde étrange (on n'en sort que par la fin ou un évanouissement). */
function strangeGraph(rule: Parameters<typeof zoneGraph>[1]): Map<Node, Set<Node>> {
  const inside = (n: Node) => isStrangeRoom(level(n.split('#')[0] ?? ''));
  const result = new Map<Node, Set<Node>>();
  for (const [from, next] of zoneGraph(true, rule)) {
    if (inside(from)) {
      result.set(from, new Set([...next].filter(inside)));
    }
  }
  return result;
}

describe('monde étrange (D-34)', () => {
  it('ses salles sont déclarées étranges et absentes de la carte', () => {
    const strange = [...zone.rooms].filter(([, l]) => isStrangeRoom(l)).map(([id]) => id);
    expect(strange).toEqual([
      'living-strange',
      'shadows',
      'garden-upside',
      'garden-thorns',
      'school-strange',
      'station-strange',
      'station-tower',
      'train-strange-kitchen',
      'train-strange-dishes',
      'sea-strange-fair',
      'sea-strange-wave',
      'sea-corridor',
      'sea-corridor-sand',
      'sea-corridor-room',
      'sea-corridor-station',
      'sea-corridor-sea',
      'nanny-entry',
      'nanny-house',
      'nanny-bed',
      'nanny-garden',
      'nanny-school',
      'nanny-street',
      'nanny-station',
      'nanny-train',
    ]);
    // La maison de la nounou a sa page du cahier (D-107) ; les autres restent hors carte.
    for (const id of strange) {
      expect(zone.map[id] === undefined, id).toBe(!id.startsWith('nanny-'));
    }
  });

  it('on y entre par le haut de la bibliothèque, jamais par une porte', () => {
    const from = storyPassages()
      .filter(([, to]) => to === arrival())
      .map(([f]) => f);
    expect(from.length).toBeGreaterThan(0);
    expect(from.every((n) => n.startsWith('living#'))).toBe(true);
    for (const [a, b] of zone.links) {
      expect(isStrangeRoom(level(a.room))).toBe(isStrangeRoom(level(b.room)));
    }
  });

  it('chemin principal de difficulté moyenne exactement (D-16)', { timeout: TIMEOUT }, () => {
    const medium = strangeGraph(byDifficulty('medium'));
    const easy = strangeGraph(byDifficulty('easy'));
    expect(reachable(medium, arrival()).has(cradle()), 'trop difficile').toBe(true);
    expect(reachable(easy, arrival()).has(cradle()), 'trop facile').toBe(false);
  });

  it(
    'ne coince jamais : de partout, le berceau reste atteignable au plus en moyen',
    { timeout: TIMEOUT },
    () => {
      const medium = strangeGraph(byDifficulty('medium'));
      const stuck = [...reachable(strangeGraph(null), arrival())].filter(
        (n) => !reachable(medium, n).has(cradle()),
      );
      expect(where(stuck, true), 'surfaces sans retour possible').toEqual([]);
    },
  );

  it('Maria reste hors d’atteinte, même en grimpant', { timeout: TIMEOUT }, () => {
    const maria = HOUSE_STORY.props.find((p) => p.id === 'maria-shadows');
    expect(maria).toBeDefined();
    if (maria) {
      const seen = reachable(strangeGraph(null), arrival());
      expect(seen.has(nodeAt('shadows', maria.col, maria.row))).toBe(false);
    }
  });

  it('la trouvaille du passage est difficile, jamais nécessaire', { timeout: TIMEOUT }, () => {
    const secret = level('shadows').entities.find((e) => e.type === EntityType.Secret);
    expect(secret).toBeDefined();
    if (secret) {
      const at = nodeAt('shadows', secret.col, secret.row);
      expect(
        reachable(strangeGraph(byDifficulty('medium')), arrival()).has(at),
        'trop facile',
      ).toBe(false);
      expect(
        reachable(strangeGraph(byDifficulty('hard')), arrival()).has(at),
        'trop difficile',
      ).toBe(true);
    }
  });

  it('une seule veilleuse, dans le passage d’ombres', () => {
    const lamps = (room: string) =>
      level(room).entities.filter((e) => e.type === EntityType.Checkpoint).length;
    expect(lamps('living-strange')).toBe(0);
    expect(lamps('shadows')).toBe(1);
  });
});
