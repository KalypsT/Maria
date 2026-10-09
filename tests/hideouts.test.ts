import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { approachAlpha, hideAt, hideTarget } from '../src/core/fx/hideouts';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';

describe('les cachettes (D-148)', () => {
  const hide = { kind: 'sheet', col: 4, row: 1, width: 2, height: 3 };

  it('s’effacent quand Céleste les touche, à une marge près ; cachent sinon', () => {
    const at = (x: number) => ({ x, y: 2 * T, width: 12, height: 24 });
    expect(hideTarget(hide, at(4 * T), 4, 0.2)).toBe(0.2);
    expect(hideTarget(hide, at(6 * T + 2), 4, 0.2)).toBe(0.2);
    expect(hideTarget(hide, at(6 * T + 6), 4, 0.2)).toBe(1);
    expect(hideTarget(hide, at(0), 4, 0.2)).toBe(1);
  });

  it('l’opacité rejoint sa cible en douceur', () => {
    expect(approachAlpha(1, 0.2, 0, 140)).toBe(1);
    const mid = approachAlpha(1, 0.2, 140, 140);
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(1);
    expect(approachAlpha(1, 0.2, 5000, 140)).toBeCloseTo(0.2, 5);
    expect(approachAlpha(1, 0.2, 16, 0)).toBe(0.2);
  });

  it('une tuile sous une cachette', () => {
    const level = parseAsciiLevel(
      'r',
      ['; @hide: sheet 2 0 2 2', '######', '#P.S.#', '######'].join('\n'),
    );
    expect(hideAt(level, 3, 1)).toBe(0);
    expect(hideAt(level, 4, 1)).toBe(-1);
    expect(hideAt(parseAsciiLevel('r', '#####\n#P..#\n#####'), 2, 1)).toBe(-1);
  });
});
