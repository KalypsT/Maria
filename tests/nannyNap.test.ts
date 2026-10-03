import { describe, expect, it } from 'vitest';
import { FLASHBACKS, STRANGE_THINGS, flashbackOf } from '../src/config/memories';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import { checkCondition } from '../src/core/story/story';
import { storyProblems } from '../src/core/story/storyProblems';
import { isMappedRoom, isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { ISLETS_DONE, NAP_DOOR, WHITE_CLOTH } from '../src/levels/nanny/story';
import {
  lanternNodes,
  reachableNodes,
  standOn,
  standOnAny,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** L'avant-dernier niveau, PR 9 (D-116) : la chambre de la sieste et le torchon blanc. */
const NAP = 'nanny-nap';

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}

describe('la chambre de la sieste et le torchon blanc (D-116)', () => {
  it('la petite porte de la sieste ne s’ouvre qu’une fois les quatre îlots faits', () => {
    const house = level('nanny-house');
    const door = need(
      house.doors.find((d) => d.id === 10),
      'porte de la sieste',
    );
    expect(door).toMatchObject(NAP_DOOR);
    expect(zone.destination('nanny-house', 10)).toEqual({ room: NAP, exit: 1 });
    const locked = (flags: string[]) =>
      HOUSE_STORY.lockedRooms.some(
        (l) => l.room === 'nanny-house' && l.exit === 10 && checkCondition(new Set(flags), l.when),
      );
    for (let k = 0; k < ISLETS_DONE.length; k++) {
      // Trois veilleuses sur quatre : encore fermée.
      expect(locked(ISLETS_DONE.filter((_, i) => i !== k))).toBe(true);
    }
    expect(locked([...ISLETS_DONE])).toBe(false);
    // Une porte fermée qu'on voit (la porte de la sieste, dessinée en PR 3), pas une porte cachée.
    expect(HOUSE_STORY.lockedRooms.some((l) => l.exit === 10 && l.hidden)).toBe(false);
  });

  it('la salle : monde étrange, sur la page « Chez la nounou », difficile', () => {
    const nap = level(NAP);
    expect(isStrangeRoom(nap)).toBe(true);
    expect(isMappedRoom(nap)).toBe(true);
    expect(mapPage(zone, NAP)).toBe('nanny');
    expect(nap.meta.difficulty).toBe('hard');
    expect(nap.legs.filter((l) => l.difficulty === 'hard').length).toBe(3);
  });

  it('une lanterne juste avant chaque passage difficile (D-107)', () => {
    const nap = level(NAP);
    const lamps = nap.entities.filter((e) => e.type === EntityType.Checkpoint);
    for (const leg of nap.legs) {
      const start = standOnAny(nap, leg.from);
      expect(
        lamps.some((l) => standOnAny(nap, l).some((s) => start.includes(s))),
        `${String(leg.from.col)},${String(leg.from.row)}`,
      ).toBe(true);
    }
  });

  it(
    'jamais coincée : de tout endroit atteint, une lanterne ; le petit lit est atteint',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const rooms = ['nanny-house', NAP];
      const graph = tideGraph(zone, HOUSE_STORY, rooms);
      const start = tideNode('nanny-house', false, standOn(level('nanny-house'), NAP_DOOR));
      const reached = reachableNodes(graph, start);
      expect(stuckNodes(graph, reached, lanternNodes(zone, rooms))).toEqual([]);
      expect(reached.has(tideNode(NAP, false, standOn(level(NAP), WHITE_CLOTH)))).toBe(true);
    },
  );

  it('le torchon blanc : un souvenir du monde étrange, son court souvenir', () => {
    // Ajouté à la fin de la rubrique ; la tour d'Eden (D-118) vient après.
    expect(STRANGE_THINGS.indexOf('white-cloth')).toBe(4);
    expect(FLASHBACKS).toContain('white-cloth');
    expect(flashbackOf('white-cloth')).toBe('white-cloth');
    const t = need(
      HOUSE_STORY.triggers.find((c) => c.id === 'nanny-cloth'),
      'torchon',
    );
    expect(t.room).toBe(NAP);
    expect(t.on).toBe('interact');
    expect(t.when).toEqual({ all: [...ISLETS_DONE], none: [F.NannyClothDone] });
    expect(t.steps[0]).toEqual({ do: 'memory', id: 'white-cloth' });
    expect(t.steps.some((s) => s.do === 'flashback' && s.id === 'white-cloth')).toBe(true);
    expect(t.steps).toContainEqual({ do: 'flag', id: F.NannyClothDone });
    // Il reste là. Puis l'effacement (D-117) : dans le noir, en bas de la cage d'escalier.
    const order = t.steps.map((s) => s.do);
    expect(order.indexOf('room')).toBeGreaterThan(order.indexOf('flashback'));
    expect(order.indexOf('room')).toBeGreaterThan(order.indexOf('fadeOut'));
    expect(t.steps.find((s) => s.do === 'room')).toMatchObject({
      room: 'nanny-stairs',
      returnPoint: true,
    });
    const prop = need(
      HOUSE_STORY.props.find((p) => p.id === 'nanny-white-cloth'),
      'torchon',
    );
    expect(prop).toMatchObject({ room: NAP, kind: 'white-cloth', ...WHITE_CLOTH, when: {} });
    expect(tileAt(level(NAP), WHITE_CLOTH.col, WHITE_CLOTH.row + 1)).toBe(Tile.Solid);
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
  });
});
