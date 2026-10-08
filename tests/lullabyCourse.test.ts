import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { LayerMask } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { LEVELS } from '../src/levels';
import { lullabyGraph, nodeKey } from './lullabyGraph';
import { fastest } from './pace';

/**
 * Le parcours d'essai 17, la berceuse (D-140) : des étoiles qui s'allument et s'éteignent par
 * vagues, suivies dans le temps (`lullabyGraph`). Céleste en phase 1, sans capacité (comme les
 * autres parcours).
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

const graph = lullabyGraph(course, (v) => analyzeLevel(v, DEFAULT_MOVEMENT, {}), EASY);
const { patterns } = graph;
const isGround = (k: number, s: number) => graph.analysis(k).map.surfaces[s]?.row === GROUND_ROW;

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
    const seen = graph.timeReach(START);
    expect(patterns.some((_, k) => seen.has(nodeKey(k, graph.under(k, GOAL))))).toBe(true);
    patterns.forEach((_, k) => {
      expect(
        graph.reach(k, graph.under(k, START)).has(graph.under(k, GOAL)),
        `motif ${String(k)}`,
      ).toBe(false);
    });
  });

  it('une étoile qui va s’éteindre est annoncée assez tôt : un appui qui reste, à portée, sans redescendre', () => {
    for (const key of graph.timeReach(START)) {
      const [k = 0, s = 0] = key.split(':').map(Number);
      if (isGround(k, s) || graph.after(k, s) >= 0) {
        continue;
      }
      const safe = [...graph.reach(k, s)].filter((t) => !isGround(k, t) && graph.after(k, t) >= 0);
      const best = Math.min(...safe.map((t) => fastest(graph.analysis(k), s, t, EASY)));
      expect(best, `motif ${String(k)}, surface ${String(s)}`).toBeLessThanOrEqual(
        DEFAULT_COMBAT.lullabyWarnMs,
      );
    }
  });

  it('jamais coincée : de partout, dans chaque motif, on revient au départ (le sol)', () => {
    patterns.forEach((_, k) => {
      const start = graph.under(k, START);
      for (let s = 0; s < graph.analysis(k).map.surfaces.length; s++) {
        expect(graph.reach(k, s).has(start), `motif ${String(k)}, surface ${String(s)}`).toBe(true);
      }
    });
  });
});
