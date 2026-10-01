import { describe, expect, it } from 'vitest';
import { StoryFlag } from '../src/config/story';
import { EntityType } from '../src/core/level/LevelData';
import { isStreetRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  analysis,
  byDifficulty,
  exitSurface,
  level,
  node,
  nodeAt,
  reachable,
  roomDifficulty,
  roomOf,
  where,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';

const TIMEOUT = 600_000;
const F = StoryFlag;
const OPEN = [F.GateOpen];
const easy = byDifficulty('easy');
const medium = byDifficulty('medium');
const hard = byDifficulty('hard');
const home = () => node(zone.start, analysis(zone.start, false).start);
const at = (room: string, exit: number) => node(room, exitSurface(room, exit));

/** Graphe restreint à quelques salles (avec ou sans le parapluie). */
function within(
  rooms: readonly string[],
  rule: Parameters<typeof zoneGraph>[1],
  glide = false,
): Map<Node, Set<Node>> {
  const inside = (n: Node) => rooms.includes(roomOf(n));
  const result = new Map<Node, Set<Node>>();
  for (const [from, next] of zoneGraph(true, rule, 2, true, OPEN, glide)) {
    if (inside(from)) {
      result.set(from, new Set([...next].filter(inside)));
    }
  }
  return result;
}
/** Surface d'un objet de la salle (le premier de ce type). */
function entity(room: string, type: EntityType): Node {
  const e = level(room).entities.find((candidate) => candidate.type === type);
  if (!e) {
    throw new Error(`aucun ${type} dans ${room}`);
  }
  return nodeAt(room, e.col, e.row);
}
const umbrella = () => entity('site', EntityType.Ability);

describe('la supérette et le chantier (D-63)', () => {
  it('derrière la porte de la supérette, la réserve donne sur le chantier, qui revient à la rue', () => {
    expect(zone.destination('street', 4)).toEqual({ room: 'shop', exit: 1 });
    expect(zone.destination('shop', 2)).toEqual({ room: 'site', exit: 1 });
    expect(zone.destination('site', 2)).toEqual({ room: 'street', exit: 3 });
    for (const room of ['shop', 'site']) {
      expect(isStreetRoom(level(room)), room).toBe(true);
      expect(mapPage(zone, room), room).toBe('street');
    }
    expect(level('shop').meta.indoor).toBe('yes');
    expect(level('site').meta.ability).toBe('umbrella');
  });

  it(
    'la porte de la réserve : moyenne exactement depuis l’entrée de la supérette',
    { timeout: TIMEOUT },
    () => {
      const door = at('shop', 2);
      expect(reachable(within(['shop'], medium), at('shop', 1)).has(door)).toBe(true);
      expect(reachable(within(['shop'], easy), at('shop', 1)).has(door), 'trop facile').toBe(false);
    },
  );

  it(
    'le chantier : moyen jusqu’à la lanterne de l’échafaudage, difficile ensuite jusqu’au parapluie',
    { timeout: TIMEOUT },
    () => {
      const lamps = level('site').entities.filter((e) => e.type === EntityType.Checkpoint);
      const scaffoldLamp = lamps.reduce((a, b) => (b.row < a.row ? b : a));
      const high = nodeAt('site', scaffoldLamp.col, scaffoldLamp.row);
      const from = at('site', 1);
      expect(reachable(within(['site'], medium), from).has(high)).toBe(true);
      expect(reachable(within(['site'], easy), from).has(high), 'lanterne trop facile').toBe(false);
      expect(reachable(within(['site'], hard), from).has(umbrella())).toBe(true);
      expect(reachable(within(['site'], medium), from).has(umbrella()), 'trop facile').toBe(false);
    },
  );

  it(
    'la sortie haute du chantier et sa trouvaille : seulement avec le parapluie',
    { timeout: TIMEOUT },
    () => {
      const exit = at('site', 2);
      const secret = entity('site', EntityType.Secret);
      const from = at('site', 1);
      expect(reachable(within(['site'], null), from).has(exit), 'sans parapluie').toBe(false);
      expect(reachable(within(['site'], null), from).has(secret), 'sans parapluie').toBe(false);
      const glide = within(['site'], hard, true);
      expect(reachable(glide, umbrella()).has(exit)).toBe(true);
      expect(reachable(glide, umbrella()).has(secret)).toBe(true);
      expect(reachable(within(['site'], medium, true), umbrella()).has(secret), 'trop facile').toBe(
        false,
      );
    },
  );

  it(
    'une boucle : du parapluie, on revient en planant en haut de l’échafaudage de la rue',
    { timeout: TIMEOUT },
    () => {
      const loop = within(['site', 'street'], hard, true);
      expect(reachable(loop, umbrella()).has(at('street', 3))).toBe(true);
    },
  );

  it(
    'ne coince jamais Céleste, avec ou sans le parapluie : la maison reste atteignable',
    { timeout: TIMEOUT },
    () => {
      for (const glide of [false, true]) {
        const safe = zoneGraph(true, roomDifficulty, 2, true, OPEN, glide);
        const all = reachable(zoneGraph(true, null, 2, true, OPEN, glide), at('street', 4));
        const stuck = [...all].filter((n) => !reachable(safe, n).has(home()));
        expect(where(stuck, true), `sans retour (parapluie : ${String(glide)})`).toEqual([]);
      }
    },
  );

  it('papa quitte le potager pour la supérette ; maman le montre, papa montre la grue', () => {
    const prop = (id: string) => HOUSE_STORY.props.find((p) => p.id === id);
    expect(prop('dad-garden')?.when.none).toContain(F.GateOpen);
    expect(prop('dad-shop')?.room).toBe('shop');
    const trigger = (id: string) => HOUSE_STORY.triggers.find((t) => t.id === id);
    expect(trigger('street-mom')?.steps.some((s) => s.do === 'thought' && s.icon === 'dad')).toBe(
      true,
    );
    expect(
      trigger('street-dad')?.steps.some(
        (s) => s.do === 'thought' && s.icon === 'crane' && s.by === 'dad-shop',
      ),
    ).toBe(true);
    expect(trigger('street-shop')).toBeUndefined();
  });

  it('la porte de la supérette s’atteint facilement par le trottoir', { timeout: TIMEOUT }, () => {
    const street = at('street', 1);
    expect(reachable(zoneGraph(true, easy, 2, true, OPEN), street).has(at('shop', 1))).toBe(true);
  });

  it(
    'revisites avec le parapluie : l’antenne de la rue et le nichoir du potager, moyens',
    { timeout: TIMEOUT },
    () => {
      const cases = [
        { room: 'street', from: at('street', 1), col: 133 },
        { room: 'garden-vegetables', from: at('garden-vegetables', 1), col: 60 },
      ];
      for (const { room, from, col } of cases) {
        const secret = level(room).entities.find(
          (e) => e.type === EntityType.Secret && e.col === col,
        );
        if (!secret) {
          throw new Error(`trouvaille absente (${room})`);
        }
        const target = nodeAt(room, secret.col, secret.row);
        expect(reachable(within([room], null), from).has(target), `${room} sans parapluie`).toBe(
          false,
        );
        expect(reachable(within([room], medium, true), from).has(target), room).toBe(true);
        expect(reachable(within([room], easy, true), from).has(target), `${room} facile`).toBe(
          false,
        );
      }
    },
  );
});
