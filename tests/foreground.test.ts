import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { foregroundPieces, overlapsSpans, protectedSpans } from '../src/core/fx/foreground';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';

const SPACING = { min: 60, max: 200, width: [30, 70] as [number, number] };

describe('avant-plan (D-71)', () => {
  it('couvre tout ce que la vue peut montrer, pour toute position de la caméra', () => {
    const pieces = foregroundPieces(0, 2000, 800, 1.35, SPACING, 3);
    const first = pieces[0];
    const last = pieces.at(-1);
    expect(first && first.x).toBeLessThanOrEqual(0);
    expect(last && last.x + last.width).toBeGreaterThanOrEqual(2000 * 1.35 + 800);
    // Trous irréguliers, jamais plus grands que l'espacement maximal.
    for (let i = 1; i < pieces.length; i++) {
      const a = pieces[i - 1];
      const b = pieces[i];
      if (a && b) {
        const gap = b.x - (a.x + a.width);
        expect(gap).toBeGreaterThanOrEqual(SPACING.min);
        expect(gap).toBeLessThanOrEqual(SPACING.max);
      }
    }
  });

  it('est déterministe', () => {
    expect(foregroundPieces(0, 500, 640, 1.35, SPACING, 9)).toEqual(
      foregroundPieces(0, 500, 640, 1.35, SPACING, 9),
    );
  });

  it('protège les dangers du sol, les objets de jeu au sol et les sorties', () => {
    const level = parseAsciiLevel(
      'fg',
      ['##########', '#........#', '1........#', '1.P.C..^.#', '##########'].join('\n'),
    );
    const spans = protectedSpans(level, 4, 0);
    // Sortie (colonne 0), veilleuse (colonne 4), danger (colonne 7).
    expect(spans).toEqual([
      [0, T],
      [4 * T, 5 * T],
      [7 * T, 8 * T],
    ]);
    expect(overlapsSpans(spans, 4.5 * T, 4.6 * T)).toBe(true);
    expect(overlapsSpans(spans, 5.2 * T, 6.8 * T)).toBe(false);
    // Les marges fusionnent les zones voisines.
    expect(protectedSpans(level, 4, 2 * T)).toEqual([[-2 * T, 10 * T]]);
  });
});
