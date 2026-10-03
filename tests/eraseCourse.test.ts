import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { EntityType, LayerMask, type Layer, type LevelData } from '../src/core/level/LevelData';
import { bandsGone, erasedLevel, wavePatterns } from '../src/core/level/erase';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { LEVELS } from '../src/levels';
import { chaseRun, fastest } from './pace';
import { SEA_PHASE, seaAnalysis, standOn, standOnAny } from './tideGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Le parcours d'essai 16, l'effacement (D-111) : la fuite verticale (les bandes quittent le
 * présent devant l'effacement qui monte) et les vagues au-dessus du bassin. Céleste en phase 3,
 * toutes ses capacités (comme les tronçons, D-96).
 */
const source = LEVELS.find((l) => l.id === 'effacement');
if (!source) {
  throw new Error('parcours 16 absent');
}
const course = parseAsciiLevel(source.id, source.text);
const erase = course.erase;
if (!erase) {
  throw new Error('effacement absent');
}
const START = course.spawn;
/** La lanterne du haut, au bout de la fuite. */
const TOP = { col: 27, row: 16 };
const GOAL = course.goal ?? { col: 0, row: 0 };

/** Surfaces atteintes depuis `from` dans une analyse. */
function reach(level: LevelData, from: number): Set<number> {
  const a = seaAnalysis(level);
  const seen = new Set([from]);
  const queue = [from];
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

/** Couche d'une surface d'une analyse à deux couches. */
function layerOfSurface(level: LevelData, id: number): Layer {
  return id >= (seaAnalysis(level).presentCount ?? Infinity) ? 'memory' : 'present';
}

describe('le parcours 16 : l’effacement (D-111)', () => {
  it(
    'la fuite : les bandes quittent le présent, on monte en basculant',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const gone = erasedLevel(course, bandsGone(erase));
      const top = standOnAny(gone, TOP);
      expect([...reach(gone, standOn(gone, START))].some((s) => top.includes(s))).toBe(true);
      // Sans la bascule, même au départ (les bandes encore là), on ne monte pas.
      const without = seaAnalysis(course, 'shift');
      const from = standOn(course, START, 'shift');
      const seen = new Set([from]);
      const queue = [from];
      for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
        for (const m of without.moves) {
          if (m.from === n && !seen.has(m.to)) {
            seen.add(m.to);
            queue.push(m.to);
          }
        }
      }
      expect(seen.has(standOn(course, TOP, 'shift'))).toBe(false);
    },
  );

  it(
    'le rythme : le joueur parfait n’est jamais touché ; 50 % plus lent, il l’est',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      // Prudent : les bandes déjà parties du présent (le chemin le plus rapide passe par le souvenir).
      const gone = erasedLevel(course, bandsGone(erase));
      const a = seaAnalysis(gone);
      const min = DIFFICULTY_MIN_WINDOW_MS.easy;
      const starts = [
        START,
        ...course.entities.filter((e) => e.type === EntityType.Checkpoint && e.row > TOP.row),
      ];
      for (const start of starts) {
        const run = chaseRun(gone, a, start, TOP, min, 1, DEFAULT_COMBAT, SEA_PHASE.hitbox);
        expect(run.contacts, `depuis la ligne ${String(start.row)}`).toBe(0);
        expect(run.margin, `depuis la ligne ${String(start.row)}`).toBeGreaterThan(2);
      }
      const slow = chaseRun(gone, a, START, TOP, min, 1.5, DEFAULT_COMBAT, SEA_PHASE.hitbox);
      expect(slow.contacts).toBeGreaterThan(0);
    },
  );

  it(
    'les vagues : chaque motif laisse un chemin jusqu’à l’arrivée, et on n’y est jamais coincée',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const patterns = wavePatterns(erase);
      expect(patterns.length).toBe(4);
      for (const masks of patterns) {
        const level = erasedLevel(course, masks);
        const what = Array.from(masks).join('');
        const goal = standOnAny(level, GOAL);
        const top = standOnAny(level, TOP);
        const reached = reach(level, standOn(level, TOP));
        expect(
          goal.some((g) => reached.has(g)),
          what,
        ).toBe(true);
        // De tout endroit atteint, la lanterne du haut ou l'arrivée.
        for (const s of reached) {
          const back = reach(level, s);
          expect(
            [...goal, ...top].some((t) => back.has(t)),
            `${what} : surface ${String(s)}`,
          ).toBe(true);
        }
      }
    },
  );

  it(
    'chaque vague est annoncée assez tôt : de toute plateforme qui va disparaître, un appui qui reste, à portée',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const patterns = wavePatterns(erase);
      patterns.forEach((masks, k) => {
        const next = patterns[(k + 1) % patterns.length];
        if (!next) {
          return;
        }
        const level = erasedLevel(course, masks);
        const after = erasedLevel(course, next);
        const a = seaAnalysis(level);
        // Une surface reste si, dans sa couche, on tient encore debout sur toutes ses tuiles.
        const stays = (id: number) => {
          const s = a.map.surfaces[id];
          if (!s) {
            return false;
          }
          const layer = layerOfSurface(level, id);
          for (let col = s.colStart; col <= s.colEnd; col++) {
            if (standOn(after, { col, row: s.row - 1 }, null, layer) < 0) {
              return false;
            }
          }
          return true;
        };
        const reached = reach(level, standOn(level, TOP));
        for (const s of reached) {
          if (stays(s)) {
            continue;
          }
          const safe = [...reached].filter(stays);
          const best = Math.min(...safe.map((t) => fastest(a, s, t, 0)));
          expect(best, `${Array.from(masks).join('')} : surface ${String(s)}`).toBeLessThanOrEqual(
            DEFAULT_COMBAT.eraseWarnMs,
          );
        }
      });
    },
  );

  it('les vagues ne touchent que les plateformes au-dessus du bassin ; les bandes sont dans les deux couches au départ', () => {
    for (const g of erase.groups) {
      if (g.id.startsWith('band')) {
        expect(g.initial).toBe(LayerMask.Both);
      } else {
        expect(g.rects.every((r) => r.row === 13)).toBe(true);
      }
    }
  });
});
