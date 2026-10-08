import { describe, expect, it } from 'vitest';
import { phaseMovement } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { analyzeLevel, describeMove, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { EntityType } from '../src/core/level/LevelData';
import { checkCondition, type StoryStep } from '../src/core/story/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { level, phase } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
const F = StoryFlag;
const ROOM = 'train-couchettes';
const P3 = phase(3);

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

const flagIndex = (steps: readonly StoryStep[], id: string) =>
  steps.findIndex((s) => s.do === 'flag' && s.id === id);

/** Analyses de la voiture-couchettes en phase 3, avec toutes les capacités ; glissade en option. */
const cache = new Map<boolean, LevelAnalysis>();
function analysis(slide: boolean): LevelAnalysis {
  let result = cache.get(slide);
  if (!result) {
    result = analyzeLevel(level(ROOM), phaseMovement(DEFAULT_MOVEMENT, P3), {
      climb: true,
      wallJump: true,
      glide: true,
      hook: true,
      slide,
      hitbox: P3.hitbox,
    });
    cache.set(slide, result);
  }
  return result;
}

function surfaceAt(a: LevelAnalysis, col: number, row: number): number {
  return surfaceUnder(level(ROOM), a.map, col, row);
}

/** Surfaces atteignables depuis `from` par des passages d'au moins `minMs` de fenêtre. */
function reach(a: LevelAnalysis, from: number, minMs = 0): Set<number> {
  const seen = new Set([from]);
  const queue = [from];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const move of a.moves) {
      if (move.from === n && move.windowMs >= minMs && !seen.has(move.to)) {
        seen.add(move.to);
        queue.push(move.to);
      }
    }
  }
  return seen;
}

const ARRIVAL = { col: 6, row: 18 };
const BEYOND_GATE = { col: 45, row: 18 };
const END_DOOR = { col: 81, row: 18 };
const easy = DIFFICULTY_MIN_WINDOW_MS.easy;
const medium = DIFFICULTY_MIN_WINDOW_MS.medium;

describe('le train, PR 2 : le départ et la voiture-couchettes (D-85)', () => {
  it('Agir à la porte du train à quai : le quai le soir, les parents, puis la voiture, en route', () => {
    const board = trigger('train-board');
    expect(board.room).toBe('station-platforms');
    expect(board.on).toBe('interact');
    expect(checkCondition(new Set([F.GrownOlder]), board.when)).toBe(true);
    expect(checkCondition(new Set([F.Grown]), board.when)).toBe(false);
    const steps = board.steps;
    // Les parents disent au revoir sur le quai ; ils ne montent pas.
    expect(steps.some((s) => s.do === 'thought' && s.by === 'mom-quay')).toBe(true);
    const room = steps.find((s) => s.do === 'room');
    expect(room?.do === 'room' && room.room).toBe(ROOM);
    expect(room?.do === 'room' && room.returnPoint).toBe(true);
    // Le départ se voit : le train s'ébranle une fois Céleste dans la voiture.
    expect(flagIndex(steps, F.TrainDeparted)).toBeGreaterThan(steps.indexOf(room as StoryStep));
    for (const id of ['mom-quay', 'dad-quay', 'teacher-quay', 'kids-quay']) {
      const p = prop(id);
      expect(p.room, id).toBe('station-platforms');
      expect(checkCondition(new Set([F.GrownOlder, F.TrainBoarding]), p.when), id).toBe(true);
      expect(checkCondition(new Set([F.TrainBoarding, F.TrainDeparted]), p.when), id).toBe(false);
    }
    // Pas de parents dans le train (choix de l'utilisateur, D-83).
    expect(
      HOUSE_STORY.props.filter((p) => p.room.startsWith('train-')).map((p) => p.kind),
    ).not.toEqual(expect.arrayContaining(['mom-quay']));
    expect(
      HOUSE_STORY.props.some((p) => p.room.startsWith('train-') && /^(mom|dad)-/.test(p.kind)),
    ).toBe(false);
    // Le train à quai part avec la classe.
    const quay = prop('quay-train');
    expect(checkCondition(new Set([F.GrownOlder, F.TrainBoarding]), quay.when)).toBe(true);
    expect(checkCondition(new Set([F.GrownOlder, F.TrainDeparted]), quay.when)).toBe(false);
  });

  it('le train roule une fois parti ; la nuit, les lumières s’éteignent', () => {
    const moving = HOUSE_STORY.moving?.find((m) => m.room === ROOM);
    expect(moving && checkCondition(new Set([F.TrainDeparted]), moving.when)).toBe(true);
    expect(moving && checkCondition(new Set([F.TrainBoarding]), moving.when)).toBe(false);
    const dim = HOUSE_STORY.dim?.find((d) => d.room === ROOM);
    expect(dim && checkCondition(new Set([F.TrainNight]), dim.when)).toBe(true);
    expect(dim && checkCondition(new Set([F.TrainSlide]), dim.when)).toBe(false);
    expect(level(ROOM).meta.vehicle).toBe('train');
  });

  it('la camarade glisse sous la grille dans le noir, puis Céleste apprend la glissade', () => {
    const t = trigger('train-classmate');
    const steps = t.steps;
    const out = steps.findIndex((s) => s.do === 'fadeOut');
    const back = steps.findIndex((s) => s.do === 'fadeIn');
    const swap = flagIndex(steps, F.TrainSlide);
    // La camarade change de place seulement dans le noir (on ne la voit jamais bouger).
    expect(out).toBeGreaterThanOrEqual(0);
    expect(swap).toBeGreaterThan(out);
    expect(swap).toBeLessThan(back);
    expect(steps.some((s) => s.do === 'ability' && s.id === 'slide')).toBe(true);
    const before = prop('classmate-play');
    const after = prop('classmate-slid');
    expect(checkCondition(new Set([F.TrainDeparted]), before.when)).toBe(true);
    expect(checkCondition(new Set([F.TrainDeparted, F.TrainSlide]), before.when)).toBe(false);
    expect(checkCondition(new Set([F.TrainDeparted, F.TrainSlide]), after.when)).toBe(true);
    // Elle est d'un côté puis de l'autre de la grille (colonnes 39-40).
    expect(before.col).toBeLessThan(38);
    expect(after.col).toBeGreaterThan(39);
  });

  it(
    'sans la glissade, la grille ferme le compartiment suivant ; avec, toute la voiture s’ouvre',
    { timeout: TIMEOUT },
    () => {
      const without = analysis(false);
      const from = surfaceAt(without, ARRIVAL.col, ARRIVAL.row);
      expect(reach(without, from).has(surfaceAt(without, BEYOND_GATE.col, BEYOND_GATE.row))).toBe(
        false,
      );
      const withSlide = analysis(true);
      const start = surfaceAt(withSlide, ARRIVAL.col, ARRIVAL.row);
      const easyReach = reach(withSlide, start, easy);
      expect(easyReach.has(surfaceAt(withSlide, BEYOND_GATE.col, BEYOND_GATE.row))).toBe(true);
      expect(easyReach.has(surfaceAt(withSlide, END_DOOR.col, END_DOOR.row))).toBe(true);
    },
  );

  it(
    'sa couchette (le coucher) s’atteint facilement, sans la glissade',
    { timeout: TIMEOUT },
    () => {
      const a = analysis(false);
      const start = surfaceAt(a, ARRIVAL.col, ARRIVAL.row);
      const bunk = trigger('train-bedtime').area;
      if (!bunk) {
        throw new Error('couchette sans zone');
      }
      const target = surfaceAt(a, bunk.col + 2, bunk.row + 1);
      expect(target).toBeGreaterThanOrEqual(0);
      expect(reach(a, start, easy).has(target)).toBe(true);
    },
  );

  it(
    'la trouvaille du filet à bagages est moyenne, par un saut long depuis la glissade',
    { timeout: TIMEOUT },
    () => {
      const a = analysis(true);
      const start = surfaceAt(a, ARRIVAL.col, ARRIVAL.row);
      const secret = level(ROOM).entities.find((e) => e.type === EntityType.Shell);
      if (!secret) {
        throw new Error('trouvaille absente');
      }
      const target = surfaceAt(a, secret.col, secret.row);
      const where = a.moves
        .filter((m) => m.to === target)
        .map((m) => describeMove(m, a.map))
        .join(' ; ');
      expect(reach(a, start, medium).has(target), where).toBe(true);
      expect(reach(a, start, easy).has(target), where).toBe(false);
      // Elle demande un saut long depuis la glissade (une revisite dans le train même).
      const without = analysis(false);
      expect(
        reach(without, surfaceAt(without, ARRIVAL.col, ARRIVAL.row)).has(
          surfaceAt(without, secret.col, secret.row),
        ),
      ).toBe(false);
    },
  );

  it(
    'ne coince jamais Céleste : de partout, l’arrivée reste atteignable',
    { timeout: TIMEOUT },
    () => {
      const a = analysis(true);
      const start = surfaceAt(a, ARRIVAL.col, ARRIVAL.row);
      const all = reach(a, start);
      const stuck = [...all].filter((s) => !reach(a, s, easy).has(start));
      const where = stuck.map((s) => {
        const surface = a.map.surfaces[s];
        return surface ? `ligne ${surface.row + 1}, col. ${surface.colStart + 1}` : String(s);
      });
      expect(where).toEqual([]);
    },
  );
});
