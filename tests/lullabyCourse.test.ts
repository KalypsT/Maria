import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { LayerMask, type LevelData, type TilePos } from '../src/core/level/LevelData';
import { erasedLevel, wavePatterns } from '../src/core/level/erase';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { LEVELS } from '../src/levels';
import { fastest } from './pace';

/**
 * Le parcours d'essai 17, la berceuse (D-140) : des étoiles qui s'allument et s'éteignent par
 * vagues. Chaque motif est une variante statique ; le temps est un graphe de (motif, surface) :
 * dans un motif, les passages faciles ; d'un motif au suivant, on reste sur une surface qui reste.
 * Céleste en phase 1, sans capacité (comme les autres parcours).
 */
const source = LEVELS.find((l) => l.id === 'berceuse');
if (!source) {
  throw new Error('parcours 17 absent');
}
const course = parseAsciiLevel(source.id, source.text);
const erase = course.erase;
if (!erase) {
  throw new Error('berceuse absente');
}
const EASY = DIFFICULTY_MIN_WINDOW_MS.easy;
const START = course.spawn;
const GOAL = course.goal ?? { col: 0, row: 0 };
/** Le sol, sous les étoiles : une chute y ramène, sans danger. */
const GROUND_ROW = 24;

const patterns = wavePatterns(erase);
const variants: LevelData[] = patterns.map((m) => erasedLevel(course, m));
const analyses: LevelAnalysis[] = variants.map((v) => analyzeLevel(v, DEFAULT_MOVEMENT, {}));

function variant(k: number): LevelData {
  const v = variants[k % variants.length];
  if (!v) {
    throw new Error(`motif ${String(k)} absent`);
  }
  return v;
}
function analysis(k: number): LevelAnalysis {
  const a = analyses[k % analyses.length];
  if (!a) {
    throw new Error(`motif ${String(k)} absent`);
  }
  return a;
}
const under = (k: number, at: TilePos) => surfaceUnder(variant(k), analysis(k).map, at.col, at.row);

/** La surface du motif suivant sous la même surface, si on y tient debout tout du long (-1 sinon). */
function after(k: number, s: number): number {
  const surface = analysis(k).map.surfaces[s];
  if (!surface) {
    return -1;
  }
  for (let col = surface.colStart; col <= surface.colEnd; col++) {
    if (under(k + 1, { col, row: surface.row - 1 }) < 0) {
      return -1;
    }
  }
  return under(k + 1, { col: surface.colStart, row: surface.row - 1 });
}

/** Surfaces atteintes dans un motif, par des passages faciles. */
function reach(k: number, from: number): Set<number> {
  const a = analysis(k);
  const seen = new Set([from]);
  const queue = [from];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const m of a.moves) {
      if (m.from === n && m.windowMs >= EASY && !seen.has(m.to)) {
        seen.add(m.to);
        queue.push(m.to);
      }
    }
  }
  return seen;
}

/** Le graphe du temps, depuis le départ (on peut y attendre n'importe quel motif). */
function timeReach(): Set<string> {
  const seen = new Set<string>();
  const queue: [number, number][] = [];
  const push = (k: number, s: number) => {
    const key = `${String(k)}:${String(s)}`;
    if (s >= 0 && !seen.has(key)) {
      seen.add(key);
      queue.push([k, s]);
    }
  };
  patterns.forEach((_, k) => {
    push(k, under(k, START));
  });
  for (let node = queue.shift(); node !== undefined; node = queue.shift()) {
    const [k, s] = node;
    for (const t of reach(k, s)) {
      push(k, t);
    }
    push((k + 1) % patterns.length, after(k, s));
  }
  return seen;
}

const isGround = (k: number, s: number) => analysis(k).map.surfaces[s]?.row === GROUND_ROW;

describe('le parcours 17 : la berceuse (D-140)', () => {
  it('huit motifs : dans chaque partie, une ou deux étoiles allumées, l’une après l’autre', () => {
    expect(patterns).toHaveLength(8);
    for (const masks of patterns) {
      for (const part of ['s', 't']) {
        const lit = erase.groups.filter(
          (g, i) => g.id.startsWith(part) && masks[i] === LayerMask.Both,
        );
        expect(lit.length).toBeGreaterThanOrEqual(1);
        expect(lit.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('en suivant la lumière, on arrive ; sans elle (un seul motif), jamais', () => {
    const seen = timeReach();
    const arrived = patterns.some((_, k) => seen.has(`${String(k)}:${String(under(k, GOAL))}`));
    expect(arrived).toBe(true);
    patterns.forEach((_, k) => {
      expect(reach(k, under(k, START)).has(under(k, GOAL)), `motif ${String(k)}`).toBe(false);
    });
  });

  it('une étoile qui va s’éteindre est annoncée assez tôt : un appui qui reste, à portée, sans redescendre', () => {
    const seen = timeReach();
    for (const key of seen) {
      const [k = 0, s = 0] = key.split(':').map(Number);
      if (isGround(k, s) || after(k, s) >= 0) {
        continue;
      }
      // Sur une étoile qui va s'éteindre : une surface qui reste (pas le sol), à portée pendant
      // l'annonce.
      const safe = [...reach(k, s)].filter((t) => !isGround(k, t) && after(k, t) >= 0);
      const best = Math.min(...safe.map((t) => fastest(analysis(k), s, t, EASY)));
      expect(best, `motif ${String(k)}, surface ${String(s)}`).toBeLessThanOrEqual(
        DEFAULT_COMBAT.lullabyWarnMs,
      );
    }
  });

  it('jamais coincée : de partout, dans chaque motif, on revient au départ (le sol)', () => {
    patterns.forEach((_, k) => {
      const start = under(k, START);
      for (let s = 0; s < analysis(k).map.surfaces.length; s++) {
        expect(reach(k, s).has(start), `motif ${String(k)}, surface ${String(s)}`).toBe(true);
      }
    });
  });
});
