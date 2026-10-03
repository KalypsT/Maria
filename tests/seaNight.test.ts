import { describe, expect, it } from 'vitest';
import { FLASHBACKS, flashbackOf } from '../src/config/memories';
import { StoryFlag as F } from '../src/config/story';
import { checkCondition } from '../src/core/story/story';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { reachableNodes, seaAnalysis, standOn, stuckNodes, tideGraph, tideNode } from './tideGraph';
import { level, storyPassages, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** La station balnéaire, PR 9 (D-105) : le court souvenir, la nuit, le couloir en boucle, la fin. */
const CORRIDORS = [
  'sea-corridor',
  'sea-corridor-sand',
  'sea-corridor-room',
  'sea-corridor-station',
  'sea-corridor-sea',
];
const LAST_DOOR = { col: 45, row: 9 };

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}
const trigger = (id: string) =>
  need(
    HOUSE_STORY.triggers.find((c) => c.id === id),
    id,
  );
const BOOK_DONE = [F.SeaEvening, F.SeaStrange, F.SeaStrangeDone];

describe('la nuit, le couloir en boucle, la fin (D-105)', () => {
  it('le court souvenir du livre musical : après le cœur, avant le cercle ; rejouable dans le cahier', () => {
    expect(FLASHBACKS).toContain('music-book');
    expect(flashbackOf('music-book')).toBe('music-book');
    const order = trigger('sea-music-book').steps.map((s) => s.do);
    expect(order.indexOf('flashback')).toBeGreaterThan(order.indexOf('thought'));
    expect(order.indexOf('flashback')).toBeLessThan(order.indexOf('fadeOut'));
    // Puis la nuit : la mélodie, une lueur sous la porte du dortoir.
    const steps = trigger('sea-music-book').steps;
    expect(steps.some((s) => s.do === 'thought' && s.icon === 'music')).toBe(true);
  });

  it('la nuit au dortoir : les murs de nuit ; les enfants dorment ; la maîtresse n’est plus là', () => {
    expect(level('sea-centre').meta.nightwalls).toBeTruthy();
    const night = new Set<string>([F.SeaArrived, ...BOOK_DONE]);
    const shown = HOUSE_STORY.props
      .filter((p) => p.room === 'sea-centre' && checkCondition(night, p.when))
      .map((p) => p.kind)
      .sort();
    expect(shown).toEqual(['classmate-asleep', 'kid-asleep', 'kid-asleep']);
    const day = new Set<string>([F.SeaArrived]);
    expect(
      HOUSE_STORY.props.some(
        (p) => p.room === 'sea-centre' && p.kind === 'teacher' && checkCondition(day, p.when),
      ),
    ).toBe(true);
  });

  it('la porte du dortoir mène au couloir, la nuit seulement ; jamais par une sortie', () => {
    const t = trigger('sea-corridor-enter');
    expect(t.room).toBe('sea-centre');
    expect(t.when).toEqual({ all: [F.SeaStrangeDone], none: [F.SeaEnd] });
    expect(t.steps.find((s) => s.do === 'room')).toMatchObject({ room: 'sea-corridor' });
    const into = storyPassages().filter(([, to]) => CORRIDORS.some((c) => to.startsWith(`${c}#`)));
    expect(into.length).toBeGreaterThan(0);
    expect(into.every(([from]) => from.startsWith('sea-centre#'))).toBe(true);
    // La lumière vacille près de la porte, la nuit.
    const omen = HOUSE_STORY.omens.find((o) => o.room === 'sea-centre');
    expect(omen && checkCondition(new Set(BOOK_DONE), omen.when)).toBe(true);
  });

  it('le couloir revient sur lui-même : cinq couloirs pareils en anneau, le décor change à chaque tour', () => {
    const tiles = (id: string) => level(id).tiles.join();
    for (const [i, room] of CORRIDORS.entries()) {
      const next = need(CORRIDORS[(i + 1) % CORRIDORS.length], 'suivant');
      expect(zone.destination(room, 2), room).toEqual({ room: next, exit: 1 });
      expect(isStrangeRoom(level(room)), room).toBe(true);
      expect(mapPage(zone, room), room).toBeNull();
      expect(tiles(room), room).toBe(tiles('sea-corridor'));
    }
    const decor = CORRIDORS.map((room) =>
      level(room)
        .decor.map((d) => d.kind)
        .sort()
        .join(),
    );
    expect(new Set(decor).size).toBe(CORRIDORS.length);
    // Aucun personnage : ni parents ni Maria (pilier 5, D-95).
    expect(HOUSE_STORY.props.filter((p) => CORRIDORS.includes(p.room))).toEqual([]);
  });

  it('au dernier tour, la porte qui n’était pas là : la lueur, le noir, la fin du niveau', () => {
    const last = level('sea-corridor-sea');
    expect(last.decor.some((d) => d.kind === 'strangedoor')).toBe(true);
    expect(CORRIDORS.filter((c) => level(c).decor.some((d) => d.kind === 'strangedoor'))).toEqual([
      'sea-corridor-sea',
    ]);
    const end = trigger('sea-end-door');
    expect(end.room).toBe('sea-corridor-sea');
    expect(end.when).toEqual({ all: [F.SeaStrangeDone], none: [F.SeaEnd] });
    const order = end.steps.map((s) => s.do);
    expect(order.indexOf('flag')).toBeGreaterThan(order.indexOf('fadeOut'));
    expect(end.steps.find((s) => s.do === 'flag')).toEqual({ do: 'flag', id: F.SeaEnd });
    // Ensuite, la même nuit, l'entrée de la maison de la nounou (le niveau 7, D-110) ; une partie
    // sauvegardée juste après la fin y entre par la même porte.
    const toNanny = end.steps.find((s) => s.do === 'room');
    expect(toNanny).toMatchObject({ do: 'room', room: 'nanny-entry' });
    expect(order.indexOf('room')).toBeGreaterThan(order.indexOf('flag'));
    const later = trigger('sea-end-later');
    expect(later.when).toEqual({ all: [F.SeaEnd], none: [F.NannyArrived] });
    expect(later.steps.find((s) => s.do === 'room')).toMatchObject({ room: 'nanny-entry' });
    expect(standOn(last, LAST_DOOR)).toBeGreaterThanOrEqual(0);
  });

  it(
    'du couloir, on rejoint toujours la porte qui n’était pas là (on fait le tour)',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const graph = tideGraph(zone, HOUSE_STORY, CORRIDORS);
      const from = tideNode(
        'sea-corridor',
        false,
        standOn(level('sea-corridor'), { col: 6, row: 9 }),
      );
      const door = tideNode(
        'sea-corridor-sea',
        false,
        standOn(level('sea-corridor-sea'), LAST_DOOR),
      );
      const reached = reachableNodes(graph, from);
      expect(reached.has(door)).toBe(true);
      expect(stuckNodes(graph, reached, [door])).toEqual([]);
      expect(seaAnalysis(level('sea-corridor')).map.surfaces).toHaveLength(1);
    },
  );
});
