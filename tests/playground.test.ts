import { describe, expect, it } from 'vitest';
import { StoryFlag } from '../src/config/story';
import { EntityType } from '../src/core/level/LevelData';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { buildMapModel } from '../src/core/world/mapModel';
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

const TIMEOUT = 300_000;
const F = StoryFlag;
const OPEN = [F.GateOpen];
const easy = byDifficulty('easy');
const medium = byDifficulty('medium');
const hard = byDifficulty('hard');
/** Arrivée dans l'aire de jeux, par le portillon (porte de façade de la rue). */
const arrival = () => node('playground', exitSurface('playground', 1));
const home = () => node(zone.start, analysis(zone.start, false).start);
/** Graphe restreint à l'aire de jeux : ce qu'on y fait depuis le portillon. */
function inPlayground(rule: Parameters<typeof zoneGraph>[1]): Map<Node, Set<Node>> {
  const result = new Map<Node, Set<Node>>();
  for (const [from, next] of zoneGraph(true, rule, 2, true, OPEN)) {
    if (roomOf(from) === 'playground') {
      result.set(from, new Set([...next].filter((n) => roomOf(n) === 'playground')));
    }
  }
  return result;
}
/** Plateforme de la tour du toboggan : là d'où l'on voit l'école. */
const deck = () => nodeAt('playground', 60, 15);
/** Trou du grillage de l'école (plus tard, avec le parapluie). */
const fenceHole = () => nodeAt('playground', 77, 12);

describe('l’aire de jeux (D-61)', () => {
  it('derrière une porte de façade de la rue, dessinée au-dessus de la rue dans le cahier', () => {
    expect(zone.destination('street', 2)).toEqual({ room: 'playground', exit: 1 });
    expect(level('street').doors.map((d) => d.id)).toEqual([2]);
    expect(isStreetRoom(level('playground'))).toBe(true);
    expect(mapPage(zone, 'playground')).toBe('street');
    const model = buildMapModel(
      zone,
      {
        visited: ['street', 'playground'],
        seen: new Set(),
        activatedCheckpoints: [],
        checkpoint: { levelId: 'street', checkpointId: null },
        collectibles: [],
        celeste: null,
      },
      'street',
    );
    const link = model.links.find((l) => l.fromSide === 0 || l.toSide === 0);
    const street = zone.map.street;
    expect(link?.direct, 'trait direct de la porte au lieu').toBe(true);
    expect(link ? [link.from.y, link.to.y] : []).toContain(street?.y);
  });

  it(
    'la tour du toboggan : moyenne exactement ; le nichoir : difficile exactement',
    { timeout: TIMEOUT },
    () => {
      expect(reachable(inPlayground(medium), arrival()).has(deck())).toBe(true);
      expect(reachable(inPlayground(easy), arrival()).has(deck()), 'trop facile').toBe(false);
      const secrets = level('playground').entities.filter((e) => e.type === EntityType.Secret);
      expect(secrets).toHaveLength(1);
      for (const s of secrets) {
        const at = nodeAt('playground', s.col, s.row);
        expect(reachable(inPlayground(hard), arrival()).has(at)).toBe(true);
        expect(reachable(inPlayground(medium), arrival()).has(at), 'trop facile').toBe(false);
      }
    },
  );

  it(
    'le trou du grillage de l’école reste hors d’atteinte (même en difficile)',
    { timeout: TIMEOUT },
    () => {
      expect(reachable(inPlayground(null), arrival()).has(fenceHole())).toBe(false);
    },
  );

  it('ne coince jamais Céleste : la maison reste atteignable', { timeout: TIMEOUT }, () => {
    const safe = zoneGraph(true, roomDifficulty, 2, true, OPEN);
    const all = reachable(zoneGraph(true, null, 2, true, OPEN), arrival());
    const stuck = [...all].filter((n) => !reachable(safe, n).has(home()));
    expect(where(stuck, true), 'surfaces sans retour possible').toEqual([]);
    // Depuis la rue, l'aire de jeux s'atteint par le trottoir (facile).
    const street = node('street', exitSurface('street', 1));
    expect(reachable(zoneGraph(true, easy, 2, true, OPEN), street).has(arrival())).toBe(true);
  });

  it('maman quitte le linge pour un banc de l’aire de jeux, une fois le portillon ouvert', () => {
    const prop = (id: string) => HOUSE_STORY.props.find((p) => p.id === id);
    expect(prop('mom-garden')?.when.none).toContain(F.GateOpen);
    expect(prop('mom-bench')?.room).toBe('playground');
    expect(prop('mom-bench')?.when.all).toContain(F.GateOpen);
    const talk = HOUSE_STORY.triggers.find((t) => t.id === 'street-mom');
    expect(talk?.steps.some((s) => s.do === 'thought' && s.by === 'mom-bench')).toBe(true);
    // Au jardin, la terrasse ne la fait plus parler.
    expect(HOUSE_STORY.triggers.find((t) => t.id === 'garden-mom')?.when.none).toContain(
      F.GateOpen,
    );
  });

  it('parler à maman : une fois, près du banc', () => {
    const noop = () => undefined;
    const said: string[] = [];
    const d = new StoryDirector(
      HOUSE_STORY,
      {
        flagSet: noop,
        place: noop,
        room: noop,
        pose: noop,
        think: (icon, _ms, by) => said.push(`${by ?? 'celeste'}:${icon}`),
        sparkle: noop,
        shake: noop,
        memory: noop,
        hush: noop,
      },
      100,
    );
    d.setFlags([F.Grown, F.HedgeDone, F.GateOpen]);
    const bench = { x: 9 * 16, y: 27 * 16 - 26, width: 12, height: 26 };
    d.step('playground', bench, true);
    for (let i = 0; i < 2000 && d.busy; i++) {
      d.step('playground', bench, false);
    }
    expect(d.flags.has(F.StreetMom)).toBe(true);
    expect(said).toContain('mom-bench:heart');
    d.step('playground', bench, false);
    expect(d.interactable).toBe(-1);
  });
});
