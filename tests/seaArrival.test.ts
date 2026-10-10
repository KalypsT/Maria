import { describe, expect, it } from 'vitest';
import { StoryFlag as F } from '../src/config/story';
import { EntityType } from '../src/core/level/LevelData';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import { checkCondition } from '../src/core/story/story';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  lanternNodes,
  reachableNodes,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** La station balnéaire, PR 2 (D-98) : l'arrivée, la promenade, le centre. */
const SEA_ROOMS = ['sea-station', 'sea-promenade', 'sea-centre'] as const;
const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((c) => c.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};
const noop = () => undefined;
const host: StoryHost = {
  flagSet: noop,
  place: noop,
  room: noop,
  pose: noop,
  think: noop,
  sparkle: noop,
  shake: noop,
  memory: noop,
  hush: noop,
  ability: noop,
  play: noop,
};
function director(flags: readonly string[]): StoryDirector {
  const d = new StoryDirector(HOUSE_STORY, host);
  d.setFlags(flags);
  return d;
}
const ARRIVED = [F.TrainMorning, F.TrainArrived];
const SETTLED = [...ARRIVED, F.SeaArrived];

describe('la station balnéaire : l’arrivée (D-98)', () => {
  it('Agir près de la maîtresse : la classe part au centre, dans le noir ; Céleste pense à Maria', () => {
    const t = trigger('sea-arrival');
    expect(t.room).toBe('sea-station');
    expect(t.when).toEqual({ all: [F.TrainArrived], none: [F.SeaArrived] });
    const order = t.steps.map((s) => s.do);
    const dark = order.indexOf('fadeOut');
    expect(order.indexOf('flag')).toBeGreaterThan(dark);
    const room = t.steps.find((s) => s.do === 'room');
    expect(room).toMatchObject({ room: 'sea-centre', returnPoint: true });
    expect(order.indexOf('room')).toBeLessThan(order.indexOf('fadeIn'));
    const thoughts = t.steps.filter((s) => s.do === 'thought').map((s) => s.icon);
    expect(thoughts[thoughts.length - 1]).toBe('maria');
    // Ni parent ni Eden : la maîtresse et la classe seulement.
    const people = HOUSE_STORY.props.filter((p) => p.room.startsWith('sea-')).map((p) => p.kind);
    expect(people.some((k) => k.startsWith('mom') || k.startsWith('dad'))).toBe(false);
  });

  it('la sortie de la gare de la mer : on part avec la classe (la maîtresse le rappelle)', () => {
    expect(director(ARRIVED).exitsLocked('sea-station', 2)).toBe(true);
    expect(director(ARRIVED).lockSpeaker('sea-station', 2)).toBe('teacher-sea');
    expect(director(SETTLED).exitsLocked('sea-station', 2)).toBe(false);
    // Le train reste ouvert : on peut toujours rentrer à la gare de la ville.
    expect(director(ARRIVED).exitsLocked('sea-station', 1)).toBe(false);
  });

  it('la classe : sur le quai jusqu’au départ, puis au centre', () => {
    // Les personnages (pas le disque caché sur l'armoire du dortoir, D-156).
    const shown = (flags: readonly string[], room: string) =>
      HOUSE_STORY.props
        .filter((p) => p.room === room && checkCondition(new Set(flags), p.when))
        .map((p) => p.kind)
        .filter((kind) => !kind.startsWith('record-'));
    expect(shown(ARRIVED, 'sea-station')).toEqual(expect.arrayContaining(['teacher', 'kids-quay']));
    expect(shown(SETTLED, 'sea-station')).not.toContain('teacher');
    expect(shown(ARRIVED, 'sea-centre')).toEqual([]);
    expect(shown(SETTLED, 'sea-centre')).toEqual(
      expect.arrayContaining(['teacher', 'classmate', 'kid-cap-sit', 'kid-bob-sit']),
    );
  });

  it('les salles : la page « La mer » du cahier, liaisons, lanternes, difficultés', () => {
    for (const room of SEA_ROOMS) {
      expect(isStrangeRoom(level(room)), room).toBe(false);
      expect(mapPage(zone, room), room).toBe('sea');
    }
    expect(zone.destination('sea-station', 2)).toEqual({ room: 'sea-promenade', exit: 1 });
    expect(zone.destination('sea-promenade', 2)).toEqual({ room: 'sea-centre', exit: 1 });
    const lamps = (room: string) =>
      level(room)
        .entities.filter((e) => e.type === EntityType.Checkpoint)
        .map((e) => [e.col, e.row]);
    expect(lamps('sea-promenade')).toEqual([[57, 24]]);
    expect(lamps('sea-centre')).toEqual([[50, 11]]);
    // La difficulté déclarée est celle du tronçon le plus dur (les défis, `; @leg:`).
    for (const room of ['sea-promenade', 'sea-centre']) {
      expect(level(room).meta.difficulty, room).toBe('medium');
      expect(
        level(room).legs.map((l) => l.difficulty),
        room,
      ).toContain('medium');
      expect(
        level(room).legs.map((l) => l.difficulty),
        room,
      ).not.toContain('hard');
    }
  });

  it(
    'jamais coincée : de la gare, la promenade, le centre ; tout ce qu’on atteint ramène à une lanterne',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const rooms = [...SEA_ROOMS];
      const graph = tideGraph(zone, HOUSE_STORY, rooms);
      const station = level('sea-station');
      const start = tideNode('sea-station', false, standOn(station, { col: 24, row: 17 }));
      const reached = reachableNodes(graph, start);
      const centreLamp = tideNode(
        'sea-centre',
        false,
        standOn(level('sea-centre'), { col: 50, row: 11 }),
      );
      expect(reached.has(centreLamp)).toBe(true);
      const lows = [...reached].filter((n) => n.includes('@low'));
      expect(stuckNodes(graph, lows, lanternNodes(zone, rooms))).toEqual([]);
    },
  );
});
