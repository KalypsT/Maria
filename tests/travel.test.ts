import { describe, expect, it } from 'vitest';
import { StoryFlag as F } from '../src/config/story';
import { TRAVEL_LANTERNS } from '../src/config/travel';
import { checkCondition } from '../src/core/story/story';
import {
  departureKeys,
  departureProblem,
  litLanternNear,
  reachableRooms,
  travelArrival,
  travelBlocked,
  travelOffered,
  travelOptions,
  travelPoints,
  travelScript,
  type TravelState,
} from '../src/core/world/travel';
import { buildZone, isMappedRoom, isStrangeRoom, returnLantern } from '../src/core/world/zone';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { storyProblems } from '../src/core/story/storyProblems';
import { TILE_SIZE as T } from '../src/config/display';
import { HOUSE } from '../src/levels/house/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { PHASE4 } from './finaleFlags';

/** Le voyage rapide (D-163). */

const zone = buildZone(HOUSE);
const points = travelPoints(zone, TRAVEL_LANTERNS);

function room(id: string) {
  const level = zone.rooms.get(id);
  if (!level) {
    throw new Error(`salle ${id} absente`);
  }
  return level;
}

/** Les sorties fermées par l'histoire, pour ces étapes (comme `StoryDirector.exitsLocked`). */
function lockedBy(flags: ReadonlySet<string>) {
  return (room: string, exit: number) =>
    HOUSE_STORY.lockedRooms.some(
      (lock) =>
        lock.room === room &&
        (lock.exit === undefined || lock.exit === exit) &&
        checkCondition(flags, lock.when),
    );
}

function states(from: string, list: readonly string[]): Record<string, TravelState> {
  const flags = new Set(list);
  return Object.fromEntries(
    travelOptions(zone, points, from, flags, lockedBy(flags)).map((o) => [o.point.level, o.state]),
  );
}

/** Après la fin (D-145) : « Continuer », chez elle, le matin ; le train et la mer vécus. */
const AFTER_END = [
  ...PHASE4,
  F.TrainBoarding,
  F.TrainDeparted,
  F.TrainSlide,
  F.TrainNight,
  F.TrainMorning,
  F.SeaArrived,
  F.SeaFirstTide,
  F.SeaEvening,
  F.SeaStrangeDone,
  F.FinaleNight,
  F.FinaleEntered,
  F.FinaleHome,
  F.FinaleFound,
  F.FinaleTogether,
  F.FinaleMorning,
  F.FinaleAwake,
  F.FinalePlayed,
  F.FinaleShelved,
  F.FinaleGone,
];

/** Quelques mois après la gare (D-69) : la phase 3, avant le train. */
const PHASE3 = PHASE4.slice(0, PHASE4.indexOf(F.GrownOlder) + 1);

describe('les veilleuses principales', () => {
  it('une par niveau, du monde réel, sur la carte', () => {
    expect(points.map((p) => p.level)).toEqual([
      'house',
      'garden',
      'street',
      'station',
      'train',
      'sea',
    ]);
    for (const point of points) {
      const level = room(point.room);
      expect(isStrangeRoom(level), point.lantern).toBe(false);
      expect(isMappedRoom(level), point.lantern).toBe(true);
    }
  });

  it('leurs salles', () => {
    expect(points.map((p) => p.room)).toEqual([
      'bedroom',
      'garden-terrace',
      'street',
      'station-hall',
      'train-couchettes',
      'sea-promenade',
    ]);
  });

  it('débloquées par de vraies étapes', () => {
    const known = new Set<string>(Object.values(F));
    for (const point of TRAVEL_LANTERNS) {
      expect(point.unlockedBy.length).toBeGreaterThan(0);
      for (const flag of point.unlockedBy) {
        expect(known.has(flag), flag).toBe(true);
      }
    }
  });

  it('une lanterne inconnue est refusée', () => {
    expect(() =>
      travelPoints(zone, [
        { level: 'house', lantern: 'nowhere', unlockedBy: [F.Slept], title: '?', icon: 'house' },
      ]),
    ).toThrow(/nowhere/);
  });
});

describe('où aller', () => {
  it('après la fin : toutes, de chaque salle du monde réel', () => {
    for (const [id, level] of zone.rooms) {
      if (isStrangeRoom(level)) {
        continue;
      }
      for (const [where, state] of Object.entries(states(id, AFTER_END))) {
        expect(state === 'open' || state === 'here', `${id} → ${where}`).toBe(true);
      }
    }
  });

  it('la veilleuse de la salle même : « ici »', () => {
    expect(states('street', AFTER_END)['street']).toBe('here');
    expect(states('street', AFTER_END)['house']).toBe('open');
  });

  it('pas avant la fin du monde étrange du niveau', () => {
    expect(states('station-hall', PHASE3)).toEqual({
      house: 'open',
      garden: 'open',
      street: 'open',
      station: 'here',
      train: 'locked',
      sea: 'locked',
    });
    expect(states('garden-terrace', [...PHASE3.slice(0, PHASE3.indexOf(F.HedgeDone))])).toEqual({
      house: 'open',
      garden: 'locked',
      street: 'locked',
      station: 'locked',
      train: 'locked',
      sea: 'locked',
    });
  });

  it('le train en route : rien à pied', () => {
    const rolling = [...PHASE3, F.TrainBoarding, F.TrainDeparted, F.TrainSlide, F.TrainNight];
    expect(reachableRooms(zone, 'train-couchettes', lockedBy(new Set(rolling))).has('street')).toBe(
      false,
    );
    expect(states('train-couchettes', rolling)['house']).toBe('far');
  });

  it('la chambre fermée le soir : on ne sort pas', () => {
    const night = PHASE3.slice(0, PHASE3.indexOf(F.GrownOlder));
    expect(states('bedroom', night)).toMatchObject({ house: 'here', garden: 'far', street: 'far' });
    expect(states('hall', night)).toMatchObject({ house: 'open', street: 'open' });
  });

  it('une porte qui ne s’ouvre que de l’intérieur : à sens unique', () => {
    const flags = new Set<string>();
    const locked = lockedBy(flags);
    expect(locked('street', 5)).toBe(true);
    expect(reachableRooms(zone, 'school', locked).has('street')).toBe(true);
  });
});

describe('les moments sans voyage', () => {
  it('loin de la maison le soir, le dernier niveau', () => {
    expect(travelBlocked(new Set(PHASE3))).toBe(false);
    expect(travelBlocked(new Set([...PHASE3, F.TrainBoarding]))).toBe(true);
    expect(travelBlocked(new Set([...PHASE3, F.TrainBoarding, F.TrainArrived]))).toBe(false);
    expect(travelBlocked(new Set([...PHASE3, F.TrainArrived, F.SeaEvening]))).toBe(true);
    expect(travelBlocked(new Set([...PHASE3, F.TrainArrived, F.SeaEvening, F.SeaEnd]))).toBe(true);
    expect(travelBlocked(new Set([...PHASE4.slice(0, -1), F.SeaEvening]))).toBe(false);
    expect(travelBlocked(new Set(PHASE4))).toBe(true);
    expect(travelBlocked(new Set(AFTER_END))).toBe(false);
  });
});

describe('le départ', () => {
  const bedroom = room('bedroom');
  const shadows = room('shadows');
  const [toybox] = points;
  if (!toybox) {
    throw new Error('aucune veilleuse');
  }
  const flags = new Set(AFTER_END);
  const box = (col: number) => ({ x: col * T, y: (toybox.row - 1) * T, width: 12, height: 28 });
  const lit = () => true;

  it('près d’une lanterne allumée seulement', () => {
    expect(litLanternNear(bedroom, box(toybox.col + 1), lit)?.name).toBe('bedroom-toybox');
    expect(litLanternNear(bedroom, box(toybox.col + 1), () => false)).toBeNull();
    expect(litLanternNear(bedroom, box(toybox.col + 6), lit)).toBeNull();
    expect(
      litLanternNear(bedroom, box(toybox.col + 1), (key) => key === 'bedroom:bedroom-toybox'),
    ).not.toBeNull();
  });

  it('les raisons, dans l’ordre', () => {
    const lantern = litLanternNear(bedroom, box(toybox.col), lit);
    expect(departureProblem({ level: bedroom, busy: false, flags, lantern })).toBeNull();
    expect(departureProblem({ level: null, busy: false, flags, lantern })).toBe('zone');
    expect(departureProblem({ level: shadows, busy: false, flags, lantern })).toBe('strange');
    expect(departureProblem({ level: bedroom, busy: true, flags, lantern })).toBe('busy');
    expect(departureProblem({ level: bedroom, busy: false, flags: new Set(PHASE4), lantern })).toBe(
      'story',
    );
    expect(departureProblem({ level: bedroom, busy: false, flags, lantern: null })).toBe('lantern');
  });
});

describe('le voyage dans le jeu (PR 2)', () => {
  it('Céleste arrive debout à côté de chaque veilleuse, qui devient le point de retour', () => {
    for (const point of points) {
      const level = room(point.room);
      const at = travelArrival(level, point);
      expect(Math.abs(at.col - point.col), point.lantern).toBeGreaterThan(0);
      expect(tileAt(level, at.col, at.row), point.lantern).toBe(Tile.Empty);
      expect(tileAt(level, at.col, at.row - 1), point.lantern).toBe(Tile.Empty);
      expect([Tile.Solid, Tile.OneWay], point.lantern).toContain(tileAt(level, at.col, at.row + 1));
      // Tournée vers la veilleuse.
      expect(Math.sign(point.col - at.col), point.lantern).toBe(at.facing);
      expect(returnLantern(level, at.col, at.row)?.name, point.lantern).toBe(point.lantern);
    }
  });

  it('le script : assise, le noir, la salle et son point de retour, l\u2019image revient', () => {
    const triggers = points.map((point) =>
      travelScript(point, travelArrival(room(point.room), point)),
    );
    const steps = triggers[0]?.steps.map((step) => step.do);
    expect(steps).toEqual(['pose', 'wait', 'fadeOut', 'room', 'pose', 'wait', 'fadeIn']);
    expect(triggers.every((t) => t.lock)).toBe(true);
    // Les règles des scripts de l'histoire (la salle seulement dans le noir…), sauf celles d'un
    // déclencheur posé dans une salle (sa zone, son étincelle, une seule fois) : le voyage se lance
    // depuis la carte, autant de fois qu'on veut.
    const placed = /sans zone|sans repère|ne se désactive pas/;
    expect(
      storyProblems(
        { ...HOUSE_STORY, triggers: [...HOUSE_STORY.triggers, ...triggers] },
        zone,
      ).filter((problem) => !placed.test(problem)),
    ).toEqual([]);
  });

  it('proposé avec deux veilleuses débloquées et une où aller', () => {
    const flags = (list: readonly string[]) => new Set(list);
    const options = (from: string, list: readonly string[]) =>
      travelOptions(zone, points, from, flags(list), lockedBy(flags(list)));
    const firstMorning = PHASE3.slice(0, PHASE3.indexOf(F.HedgeDone));
    expect(travelOffered(options('kitchen', firstMorning))).toBe(false);
    expect(travelOffered(options('kitchen', PHASE3))).toBe(true);
    expect(travelOffered(options('bedroom', AFTER_END))).toBe(true);
  });

  it('on part seulement d’une veilleuse bleue débloquée (D-189)', () => {
    const before = departureKeys(points, new Set());
    expect(before.size).toBe(0);
    const after = departureKeys(points, new Set(AFTER_END));
    expect([...after].sort()).toEqual(points.map((p) => `${p.room}:${p.lantern}`).sort());
    // Une autre lanterne allumée de la chambre ne fait pas partir.
    expect([...after].every((key) => points.some((p) => key === `${p.room}:${p.lantern}`))).toBe(
      true,
    );
  });

  it('chaque veilleuse a son nom et son dessin sur la page « Voyager » (D-189)', () => {
    expect(new Set(points.map((p) => p.title)).size).toBe(points.length);
    expect(points.every((p) => p.title.length > 0)).toBe(true);
  });
});
