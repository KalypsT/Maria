import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../src/config/display';
import { GROWTH_PHASES, growthPhase } from '../src/config/growth';
import { StoryFlag } from '../src/config/story';
import { checkCondition, type StoryStep } from '../src/core/story/story';
import { isStrangeRoom } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  analysis,
  node,
  nodeAt,
  phase,
  reachable,
  roomDifficulty,
  where,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
const F = StoryFlag;
const home = () => node(zone.start, analysis(zone.start, false).start);
/** Toutes les portes ouvertes par l'histoire (portillon, palissade, école). */
const OPEN = [F.GateOpen, F.StreetMorning, F.SchoolOpen];

function trigger(id: string) {
  const t = HOUSE_STORY.triggers.find((c) => c.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
}

function prop(id: string) {
  const p = HOUSE_STORY.props.find((c) => c.id === id);
  if (!p) {
    throw new Error(`objet ${id} absent`);
  }
  return p;
}

const rooms = (steps: readonly StoryStep[]) =>
  steps.flatMap((s) => (s.do === 'room' ? [s.room] : []));

describe('fin de la gare (D-69)', () => {
  it('Roger, puis papa sous l’horloge du hall la nuit, puis la chambre', () => {
    const steps = trigger('station-roger').steps;
    expect(rooms(steps)).toEqual(['station-hall', 'bedroom']);
    expect(steps.some((s) => s.do === 'thought' && s.by === 'dad-hall')).toBe(true);
    const dad = prop('dad-hall');
    expect(dad.room).toBe('station-hall');
    expect(checkCondition(new Set([F.StationDone]), dad.when)).toBe(true);
    expect(checkCondition(new Set([F.StationDone, F.GrownOlder]), dad.when)).toBe(false);
    // Sous la grande horloge : Céleste est placée dans la largeur du cadran.
    const place = steps.find((s) => s.do === 'room' && s.room === 'station-hall');
    const clock = zone.rooms.get('station-hall')?.decor.find((d) => d.kind === 'bigclock');
    if (place?.do !== 'room' || !clock) {
      throw new Error('hall sans horloge');
    }
    expect(place.col).toBeGreaterThanOrEqual(clock.col);
    expect(place.col).toBeLessThan(clock.col + clock.width);
  });

  it('la nuit après la gare : soir, chambre fermée, se coucher fait passer des mois', () => {
    const night = new Set([F.Slept, F.Grown, F.StreetMorning, F.StationDone]);
    const story = HOUSE_STORY;
    const time = (flags: Set<string>) =>
      story.times.find((t) => checkCondition(flags, t.when))?.time;
    expect(time(night)).toBe('evening');
    expect(time(new Set([...night, F.GrownOlder]))).toBe('morning');
    const lock = story.lockedRooms.find(
      (l) => l.room === 'bedroom' && l.exit === undefined && checkCondition(night, l.when),
    );
    expect(lock?.icon).toBe('bed');
    const months = trigger('station-months');
    expect(months.room).toBe('bedroom');
    expect(checkCondition(night, months.when)).toBe(true);
    expect(months.steps.some((s) => s.do === 'flag' && s.id === F.GrownOlder)).toBe(true);
    expect(months.steps.some((s) => s.do === 'thought' && s.icon === 'train')).toBe(true);
    // Un seul déclencheur au lit à la fois.
    const bed = story.triggers.filter(
      (t) => t.room === 'bedroom' && t.area?.col === 7 && checkCondition(night, t.when),
    );
    expect(bed.map((t) => t.id)).toEqual(['station-months']);
  });

  it('la toise : un troisième trait, une seule toise à la fois', () => {
    const charts = HOUSE_STORY.props.filter((p) => p.kind.startsWith('height-chart'));
    for (const flags of [[], [F.Grown], [F.Grown, F.GrownOlder]]) {
      const shown = charts.filter((p) => checkCondition(new Set(flags), p.when));
      expect(shown, flags.join()).toHaveLength(1);
    }
    expect(prop('height-chart-older').when.all).toContain(F.GrownOlder);
  });

  it('phase 3 : queue de cheval, veste ; plus grande mais < 2 tuiles, influence modérée', () => {
    const older = growthPhase(new Set([F.Grown, F.GrownOlder]));
    expect(older.id).toBe(3);
    expect(older.hair).toBe('ponytail');
    expect(older.outfit).toBe('jacket');
    expect(GROWTH_PHASES.map((p) => p.id)).toEqual([1, 2, 3]);
    const grown = phase(2);
    expect(older.hitbox.height).toBeGreaterThan(grown.hitbox.height);
    expect(older.hitbox.height).toBeLessThan(2 * TILE_SIZE);
    expect(older.hitbox.width).toBeLessThan(TILE_SIZE);
    for (const key of ['jumpHeightTiles', 'maxRunSpeed'] as const) {
      const before = grown.movementScale[key] ?? 1;
      const after = older.movementScale[key] ?? 1;
      expect(after, key).toBeGreaterThanOrEqual(before);
      expect(after / before, key).toBeLessThan(1.1);
    }
  });

  it('le train à quai : seulement après les mois, posé sur le quai, une bulle « ? »', () => {
    const train = prop('quay-train');
    expect(train.room).toBe('station-platforms');
    expect(checkCondition(new Set([F.StationDone]), train.when)).toBe(false);
    expect(checkCondition(new Set([F.GrownOlder]), train.when)).toBe(true);
    const hint = trigger('station-train');
    expect(hint.on).toBe('touch');
    expect(hint.steps.some((s) => s.do === 'thought' && s.icon === 'question')).toBe(true);
    // On n'y monte pas (encore) : aucun changement de salle.
    expect(rooms(hint.steps)).toEqual([]);
  });

  describe('croissance : rien ne se ferme (graphe de toute la zone)', () => {
    const real = (n: Node) => {
      const data = zone.rooms.get(n.split('#')[0] ?? '');
      return data !== undefined && !isStrangeRoom(data);
    };

    it(
      'rien d’atteignable en phase 2 ne se ferme en phase 3 ; le train à quai est atteignable',
      { timeout: TIMEOUT },
      () => {
        const before = reachable(
          zoneGraph(true, roomDifficulty, 2, true, OPEN, true, true),
          home(),
        );
        const after = reachable(zoneGraph(true, roomDifficulty, 3, true, OPEN, true, true), home());
        const closed = [...before].filter((n) => real(n) && !after.has(n));
        expect(where(closed, true)).toEqual([]);
        expect(after.has(nodeAt('station-platforms', 55, 26))).toBe(true);
      },
    );
  });
});
