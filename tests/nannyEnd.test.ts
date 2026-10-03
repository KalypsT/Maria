import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../src/config/display';
import { GROWTH_PHASES, growthPhase } from '../src/config/growth';
import { StoryFlag as F } from '../src/config/story';
import { checkCondition, type StoryStep } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { isStrangeRoom } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  analysis,
  node,
  reachable,
  roomDifficulty,
  where,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** L'avant-dernier niveau, PR 12 (D-119) : le réveil, le train du retour, la phase 4. */
function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}
const eden = need(
  HOUSE_STORY.triggers.find((t) => t.id === 'nanny-eden'),
  'Eden',
);
const rooms = (steps: readonly StoryStep[]) =>
  steps.flatMap((s) => (s.do === 'room' ? [s.room] : []));

describe('la fin du niveau 7 : le réveil, le retour, la phase 4 (D-119)', () => {
  it('après Eden : le dortoir à l’aube, le train du retour, puis chez elle', () => {
    expect(rooms(eden.steps)).toEqual(['sea-centre', 'train-couchettes', 'bedroom']);
    const order = eden.steps.map((s) => s.do);
    // Chaque changement de salle dans le noir.
    eden.steps.forEach((s, k) => {
      if (s.do === 'room') {
        expect(order.lastIndexOf('fadeOut', k)).toBeGreaterThan(order.lastIndexOf('fadeIn', k));
      }
    });
    // Le réveil, point de retour ; puis la maison, point de retour.
    const back = eden.steps.filter((s) => s.do === 'room' && s.returnPoint === true);
    expect(back.map((s) => (s.do === 'room' ? s.room : ''))).toEqual(['sea-centre', 'bedroom']);
    // La phase 4 vient dans le noir, avant la chambre.
    const grow = eden.steps.findIndex((s) => s.do === 'flag' && s.id === F.GrownFourth);
    expect(grow).toBeGreaterThan(order.lastIndexOf('fadeOut'));
    expect(grow).toBeLessThan(order.lastIndexOf('room'));
    // Le niveau 8 reste ouvert : une bulle « ? » (PLACEHOLDER), la dernière.
    const last = [...eden.steps].reverse().find((s) => s.do === 'thought');
    expect(last).toMatchObject({ do: 'thought', icon: 'question' });
  });

  it('le jour revient au réveil ; le train roule le temps de la scène', () => {
    const story = new StoryDirector(HOUSE_STORY, { play: () => undefined } as never);
    const all = [F.SeaEvening, F.SeaStrangeDone, F.SeaEnd, F.NannyEden];
    story.setFlags(all);
    expect(story.timeOfDay()).toBe('evening');
    story.setFlags([...all, F.NannyWake]);
    expect(story.timeOfDay()).toBe('morning');
    const moving = (flags: string[]) =>
      (HOUSE_STORY.moving ?? []).some(
        (m) => m.room === 'train-couchettes' && checkCondition(new Set(flags), m.when),
      );
    expect(moving([F.TrainArrived, F.NannyWake])).toBe(true);
    expect(moving([F.TrainArrived, F.NannyWake, F.GrownFourth])).toBe(false);
  });

  it('la phase 4 : plus grande à l’écran, un peu plus rapide ; la toise a un quatrième trait', () => {
    const p4 = growthPhase(new Set([F.Grown, F.GrownOlder, F.GrownFourth]));
    const p3 = need(
      GROWTH_PHASES.find((p) => p.id === 3),
      'phase 3',
    );
    expect(p4.id).toBe(4);
    // Plus grande à l'écran ; la hitbox de la phase 3 (le grenier, D-119), toujours < 2 tuiles.
    expect(p4.bodyScale).toBeGreaterThan(p3.bodyScale);
    expect(p4.hitbox.height).toBe(p3.hitbox.height);
    expect(p4.hitbox.height).toBeLessThan(2 * TILE_SIZE);
    expect(p4.movementScale.maxRunSpeed).toBeGreaterThan(p3.movementScale.maxRunSpeed ?? 1);
    expect(p4.movementScale.jumpHeightTiles).toBe(p3.movementScale.jumpHeightTiles);
    const flags = new Set([F.Grown, F.GrownOlder, F.GrownFourth]);
    const charts = HOUSE_STORY.props.filter(
      (p) =>
        p.room === 'bedroom' && p.kind.startsWith('height-chart') && checkCondition(flags, p.when),
    );
    expect(charts.map((p) => p.kind)).toEqual(['height-chart-fourth']);
  });

  it('ni Maria ni parents à l’écran pendant la fin du niveau', () => {
    const flags = new Set<string>([
      F.Slept,
      F.Grown,
      F.GrownOlder,
      F.SeaStrangeDone,
      F.SeaEnd,
      F.NannyEden,
      F.NannyWake,
    ]);
    for (const room of ['sea-centre', 'train-couchettes']) {
      const shown = HOUSE_STORY.props.filter(
        (p) => p.room === room && checkCondition(flags, p.when),
      );
      expect(
        shown.filter((p) => p.kind.startsWith('maria') || /^(mom|dad)-/.test(p.kind)),
        room,
      ).toEqual([]);
    }
  });

  it(
    'grandir : rien d’atteignable en phase 3 ne se ferme en phase 4',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const real = (n: Node) => {
        const data = zone.rooms.get(n.split('#')[0] ?? '');
        return data !== undefined && !isStrangeRoom(data);
      };
      const open = [F.GateOpen, F.StreetMorning, F.SchoolOpen];
      const home = () => node(zone.start, analysis(zone.start, false).start);
      const before = reachable(zoneGraph(true, roomDifficulty, 3, true, open, true, true), home());
      const after = reachable(zoneGraph(true, roomDifficulty, 4, true, open, true, true), home());
      const closed = [...before].filter((n) => real(n) && !after.has(n));
      expect(where(closed, true)).toEqual([]);
    },
  );
});
