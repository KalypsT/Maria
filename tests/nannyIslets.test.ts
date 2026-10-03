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
import { ISLET_ROGER, ISLET_SHAPE_BOX, NAP_LIGHTS, NANNY_ARRIVAL } from '../src/levels/nanny/story';
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

/**
 * L'avant-dernier niveau, les îlots de mémoire (D-112, D-113) : chacun, deux salles ; au bout, son
 * objet (déjà vu), des passages vers la maison (et l'îlot voisin), une veilleuse sur la porte de la
 * sieste.
 */
interface Islet {
  readonly name: string;
  readonly rooms: readonly string[];
  /** Le passage de la maison (sortie ou porte) et où il mène. */
  readonly entry: readonly [number, string, number];
  readonly done: string;
  readonly trigger: string;
  readonly object: { readonly id: string; readonly kind: string; readonly room: string };
  readonly at: { readonly col: number; readonly row: number };
  /** Court souvenir rejoué (null : un cœur seulement, D-107). */
  readonly flashback: string | null;
  readonly light: string;
  readonly lightIndex: number;
  /** Portes cachées tant que l'objet n'est pas retrouvé. */
  readonly shortcuts: readonly (readonly [string, number])[];
  /** Trouvailles neuves, dont celles enfermées dans le présent (ouvertes dans le souvenir). */
  readonly secrets: number;
  readonly closed: readonly string[];
}
const ISLETS: readonly Islet[] = [
  {
    name: 'la chambre d’autrefois et le jardin renversé (D-112)',
    rooms: ['nanny-bed', 'nanny-garden'],
    entry: [2, 'nanny-bed', 1],
    done: F.NannyBedDone,
    trigger: 'nanny-roger',
    object: { id: 'nanny-roger', kind: 'roger', room: 'nanny-garden' },
    at: ISLET_ROGER,
    flashback: 'roger',
    light: 'nap-light-bed',
    lightIndex: 0,
    shortcuts: [
      ['nanny-garden', 2],
      ['nanny-house', 3],
    ],
    secrets: 4,
    closed: ['nanny-bed', 'nanny-garden'],
  },
  {
    name: 'l’école et la rue d’autrefois (D-113)',
    rooms: ['nanny-school', 'nanny-street'],
    entry: [5, 'nanny-school', 1],
    done: F.NannySchoolDone,
    trigger: 'nanny-shape-box',
    object: { id: 'nanny-shape-box', kind: 'shape-box', room: 'nanny-street' },
    at: ISLET_SHAPE_BOX,
    flashback: null,
    light: 'nap-light-school',
    lightIndex: 1,
    shortcuts: [
      ['nanny-street', 2],
      ['nanny-house', 4],
      ['nanny-street', 3],
      ['nanny-bed', 3],
    ],
    secrets: 3,
    closed: ['nanny-school'],
  },
];
const ALL = ['nanny-entry', 'nanny-house', ...ISLETS.flatMap((i) => i.rooms)];

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

describe('les îlots de mémoire de la maison de la nounou (D-112, D-113)', () => {
  it('les liaisons : chaque îlot depuis la maison ; les raccourcis', () => {
    expect(zone.destination('nanny-bed', 2)).toEqual({ room: 'nanny-garden', exit: 1 });
    expect(zone.destination('nanny-garden', 2)).toEqual({ room: 'nanny-house', exit: 3 });
    expect(zone.destination('nanny-school', 2)).toEqual({ room: 'nanny-street', exit: 1 });
    expect(zone.destination('nanny-street', 2)).toEqual({ room: 'nanny-house', exit: 4 });
    // Le raccourci vers l'îlot voisin (D-113) : de la rue à la chambre d'autrefois.
    expect(zone.destination('nanny-street', 3)).toEqual({ room: 'nanny-bed', exit: 3 });
    // Les passages dessinés en PR 3 : l'étagère de gauche, le haut de la bibliothèque.
    const house = level('nanny-house');
    expect(house.decor.some((d) => d.kind === 'passagebed' && d.col === 1)).toBe(true);
    const school = need(
      house.decor.find((d) => d.kind === 'passageschool'),
      'passage de l’école',
    );
    const door = need(
      house.doors.find((d) => d.id === 5),
      'porte de la bibliothèque',
    );
    expect(door.col).toBeGreaterThanOrEqual(school.col);
    expect(door.col).toBeLessThan(school.col + school.width);
    expect(mapProblems(zone)).toEqual([]);
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
  });

  it(
    'jamais coincée : de tout endroit atteint, une lanterne (avec la bascule) ; chaque objet est atteint',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const graph = tideGraph(zone, HOUSE_STORY, ALL);
      const start = tideNode('nanny-entry', false, standOn(level('nanny-entry'), NANNY_ARRIVAL));
      const reached = reachableNodes(graph, start);
      expect(stuckNodes(graph, reached, lanternNodes(zone, ALL))).toEqual([]);
      for (const islet of ISLETS) {
        const room = islet.object.room;
        expect(reached.has(tideNode(room, false, standOn(level(room), islet.at)))).toBe(true);
      }
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

  for (const islet of ISLETS) {
    describe(islet.name, () => {
      it('les salles : monde étrange, sur la page « Chez la nounou » ; l’entrée depuis la maison', () => {
        for (const room of islet.rooms) {
          const l = level(room);
          expect(isStrangeRoom(l)).toBe(true);
          expect(isMappedRoom(l)).toBe(true);
          expect(mapPage(zone, room)).toBe('nanny');
          expect(l.meta.music).toBe('strange');
          expect(l.layers).toBeDefined();
        }
        const [exit, room, to] = islet.entry;
        expect(zone.destination('nanny-house', exit)).toEqual({ room, exit: to });
        // L'entrée de l'îlot est toujours ouverte (ordre libre).
        expect(
          HOUSE_STORY.lockedRooms.some((l) => l.room === 'nanny-house' && l.exit === exit),
        ).toBe(false);
      });

      it('son objet : on le regarde, il n’est plus à trouver ; il reste là', () => {
        const t = trigger(islet.trigger);
        expect(t.room).toBe(islet.object.room);
        expect(t.on).toBe('interact');
        expect(t.when).toEqual({ all: [F.NannyHouse], none: [islet.done] });
        const flashbacks = t.steps.flatMap((s) => (s.do === 'flashback' ? [s.id] : []));
        expect(flashbacks).toEqual(islet.flashback ? [islet.flashback] : []);
        expect(t.steps.some((s) => s.do === 'thought' && s.icon === 'heart')).toBe(true);
        // Il ne redevient pas un souvenir à trouver, et Céleste reste là.
        expect(t.steps.some((s) => s.do === 'memory' || s.do === 'room')).toBe(false);
        expect(t.steps).toContainEqual({ do: 'flag', id: islet.done });
        const prop = need(
          HOUSE_STORY.props.find((p) => p.id === islet.object.id),
          islet.object.id,
        );
        expect(prop).toMatchObject({ ...islet.object, ...islet.at, when: {} });
        expect(tileAt(level(islet.object.room), islet.at.col, islet.at.row + 1)).toBe(Tile.Solid);
      });

      it('les raccourcis n’existent qu’une fois l’objet retrouvé', () => {
        const hidden = (room: string, exit: number, flags: string[]) =>
          HOUSE_STORY.lockedRooms.some(
            (l) =>
              l.room === room &&
              l.exit === exit &&
              l.hidden &&
              checkCondition(new Set(flags), l.when),
          );
        for (const [room, exit] of islet.shortcuts) {
          expect(hidden(room, exit, [F.NannyHouse])).toBe(true);
          expect(hidden(room, exit, [F.NannyHouse, islet.done])).toBe(false);
        }
      });

      it('une veilleuse s’allume sur la porte de la sieste', () => {
        const light = need(
          HOUSE_STORY.props.find((p) => p.id === islet.light),
          'veilleuse',
        );
        expect(light).toMatchObject({ room: 'nanny-house', ...NAP_LIGHTS[islet.lightIndex] });
        expect(checkCondition(new Set([F.NannyHouse]), light.when)).toBe(false);
        expect(checkCondition(new Set([F.NannyHouse, islet.done]), light.when)).toBe(true);
        const door = need(
          level('nanny-house').decor.find((d) => d.kind === 'napdoor'),
          'porte de la sieste',
        );
        for (const l of NAP_LIGHTS) {
          expect(l.col).toBeGreaterThanOrEqual(door.col);
          expect(l.col).toBeLessThan(door.col + door.width);
        }
      });

      it('des trouvailles neuves ; certaines enfermées dans le présent, ouvertes dans le souvenir', () => {
        const secrets = islet.rooms.flatMap((room) =>
          level(room)
            .entities.filter((e) => e.type === EntityType.Secret)
            .map((e) => ({ room, ...e })),
        );
        expect(secrets.length).toBe(islet.secrets);
        const closed = secrets.filter(({ room, col, row }) => {
          const present = level(room);
          return [
            [col - 1, row],
            [col + 1, row],
            [col, row - 1],
          ].every(([c, r]) => tileAt(present, c ?? 0, r ?? 0) === Tile.Solid);
        });
        expect(closed.map((s) => s.room).sort()).toEqual([...islet.closed]);
        for (const { room, col, row } of closed) {
          const memory = atLayer(level(room), 'memory');
          expect(tileAt(memory, col, row - 1)).toBe(Tile.Empty);
          expect(standOn(level(room), { col, row }, null, 'memory')).toBeGreaterThanOrEqual(0);
        }
      });
    });
  }
});
