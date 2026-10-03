import { describe, expect, it } from 'vitest';
import { Ability } from '../src/config/abilities';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import { atLayer } from '../src/core/level/layers';
import { checkCondition } from '../src/core/story/story';
import { storyProblems } from '../src/core/story/storyProblems';
import { isMappedRoom, isStrangeRoom, mapPage } from '../src/core/world/zone';
import { mapProblems } from '../src/core/world/mapModel';
import { HOUSE_STORY } from '../src/levels/house/story';
import { ISLET_ROGER, NAP_LIGHTS, NANNY_ARRIVAL } from '../src/levels/nanny/story';
import {
  lanternNodes,
  reachableNodes,
  seaAnalysis,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** L'avant-dernier niveau, PR 5 (D-112) : l'îlot de mémoire 1, la chambre et le jardin renversé. */
const ISLET = ['nanny-bed', 'nanny-garden'];
const ALL = ['nanny-entry', 'nanny-house', ...ISLET];

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

/** Surfaces atteintes dans une salle depuis `from`, sans une capacité. */
function reachWithout(room: string, ability: string, from: { col: number; row: number }) {
  const l = level(room);
  const a = seaAnalysis(l, ability);
  const start = standOn(l, from, ability);
  const seen = new Set([start]);
  const queue = [start];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const m of a.moves) {
      if (m.from === n && !seen.has(m.to)) {
        seen.add(m.to);
        queue.push(m.to);
      }
    }
  }
  return seen;
}

describe('l’îlot de mémoire 1 : la chambre d’autrefois et le jardin renversé (D-112)', () => {
  it('les salles : monde étrange, sur la page « Chez la nounou » ; reliées à la maison', () => {
    for (const room of ISLET) {
      const l = level(room);
      expect(isStrangeRoom(l)).toBe(true);
      expect(isMappedRoom(l)).toBe(true);
      expect(mapPage(zone, room)).toBe('nanny');
      expect(l.meta.music).toBe('strange');
      expect(l.layers).toBeDefined();
    }
    // L'étagère de gauche de la maison (son passage dessiné en PR 3), puis le jardin.
    expect(zone.destination('nanny-house', 2)).toEqual({ room: 'nanny-bed', exit: 1 });
    expect(zone.destination('nanny-bed', 2)).toEqual({ room: 'nanny-garden', exit: 1 });
    expect(zone.destination('nanny-garden', 2)).toEqual({ room: 'nanny-house', exit: 3 });
    expect(level('nanny-house').decor.some((d) => d.kind === 'passagebed' && d.col === 1)).toBe(
      true,
    );
    expect(mapProblems(zone)).toEqual([]);
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
  });

  it('Roger, en haut de l’arrosoir : son court souvenir revient, il n’est plus à trouver', () => {
    const roger = trigger('nanny-roger');
    expect(roger.room).toBe('nanny-garden');
    expect(roger.on).toBe('interact');
    expect(roger.when).toEqual({ all: [F.NannyHouse], none: [F.NannyBedDone] });
    expect(roger.steps.some((s) => s.do === 'flashback' && s.id === 'roger')).toBe(true);
    // Il ne redevient pas un souvenir à trouver, et Céleste reste là.
    expect(roger.steps.some((s) => s.do === 'memory' || s.do === 'room')).toBe(false);
    expect(roger.steps).toContainEqual({ do: 'flag', id: F.NannyBedDone });
    const prop = need(
      HOUSE_STORY.props.find((p) => p.id === 'nanny-roger'),
      'Roger',
    );
    expect(prop).toMatchObject({ room: 'nanny-garden', kind: 'roger', ...ISLET_ROGER, when: {} });
    // Debout sur l'arrosoir, à portée de la zone du déclencheur.
    const garden = level('nanny-garden');
    expect(tileAt(garden, ISLET_ROGER.col, ISLET_ROGER.row + 1)).toBe(Tile.Solid);
  });

  it('le raccourci vers la maison n’existe qu’une fois Roger retrouvé', () => {
    const hidden = (room: string, exit: number, flags: string[]) =>
      HOUSE_STORY.lockedRooms.some(
        (l) =>
          l.room === room && l.exit === exit && l.hidden && checkCondition(new Set(flags), l.when),
      );
    for (const [room, exit] of [
      ['nanny-garden', 2],
      ['nanny-house', 3],
    ] as const) {
      expect(hidden(room, exit, [F.NannyHouse])).toBe(true);
      expect(hidden(room, exit, [F.NannyHouse, F.NannyBedDone])).toBe(false);
    }
    // L'entrée de l'îlot, elle, est toujours ouverte (ordre libre).
    expect(HOUSE_STORY.lockedRooms.some((l) => l.room === 'nanny-house' && l.exit === 2)).toBe(
      false,
    );
  });

  it('une veilleuse rose s’allume sur la porte de la sieste', () => {
    const light = need(
      HOUSE_STORY.props.find((p) => p.id === 'nap-light-bed'),
      'veilleuse',
    );
    expect(light).toMatchObject({ room: 'nanny-house', ...NAP_LIGHTS[0] });
    expect(checkCondition(new Set([F.NannyHouse]), light.when)).toBe(false);
    expect(checkCondition(new Set([F.NannyHouse, F.NannyBedDone]), light.when)).toBe(true);
    const door = need(
      level('nanny-house').decor.find((d) => d.kind === 'napdoor'),
      'porte de la sieste',
    );
    for (const l of NAP_LIGHTS) {
      expect(l.col).toBeGreaterThanOrEqual(door.col);
      expect(l.col).toBeLessThan(door.col + door.width);
    }
  });

  it(
    'jamais coincée : de tout endroit atteint, une lanterne (avec la bascule) ; Roger est atteint',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const graph = tideGraph(zone, HOUSE_STORY, ALL);
      const start = tideNode('nanny-entry', false, standOn(level('nanny-entry'), NANNY_ARRIVAL));
      const reached = reachableNodes(graph, start);
      expect(stuckNodes(graph, reached, lanternNodes(zone, ALL))).toEqual([]);
      const garden = level('nanny-garden');
      expect(reached.has(tideNode('nanny-garden', false, standOn(garden, ISLET_ROGER)))).toBe(true);
    },
  );

  it(
    'sans la bascule, ni la chambre ni l’arrosoir ne se montent',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const bed = level('nanny-bed');
      const toGarden = standOn(bed, { col: 3, row: 7 }, Ability.Shift);
      expect(reachWithout('nanny-bed', Ability.Shift, { col: 72, row: 36 }).has(toGarden)).toBe(
        false,
      );
      const garden = level('nanny-garden');
      const top = standOn(garden, ISLET_ROGER, Ability.Shift);
      expect(reachWithout('nanny-garden', Ability.Shift, { col: 30, row: 28 }).has(top)).toBe(
        false,
      );
    },
  );

  it('quatre trouvailles neuves ; deux sont enfermées dans le présent, ouvertes dans le souvenir', () => {
    const secrets = ISLET.flatMap((room) =>
      level(room)
        .entities.filter((e) => e.type === EntityType.Secret)
        .map((e) => ({ room, ...e })),
    );
    expect(secrets.length).toBe(4);
    const closed = secrets.filter(({ room, col, row }) => {
      const present = level(room);
      return [
        [col - 1, row],
        [col + 1, row],
        [col, row - 1],
      ].every(([c, r]) => tileAt(present, c ?? 0, r ?? 0) === Tile.Solid);
    });
    expect(closed.map((s) => s.room).sort()).toEqual(['nanny-bed', 'nanny-garden']);
    for (const { room, col, row } of closed) {
      const memory = atLayer(level(room), 'memory');
      expect(tileAt(memory, col, row - 1)).toBe(Tile.Empty);
      expect(standOn(level(room), { col, row }, null, 'memory')).toBeGreaterThanOrEqual(0);
    }
  });
});
