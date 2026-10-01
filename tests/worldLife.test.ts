import { describe, expect, it } from 'vitest';
import { nextDelay, wind, wrap } from '../src/core/fx/worldLife';

describe('vie du monde réel (D-72)', () => {
  it('fait souffler un vent doux, jamais nul ni au-delà de la rafale', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let t = 0; t < 120000; t += 50) {
      const w = wind(t);
      min = Math.min(min, w);
      max = Math.max(max, w);
    }
    expect(min).toBeGreaterThanOrEqual(0.2);
    expect(max).toBeLessThanOrEqual(1);
    // Il varie vraiment : des calmes et des rafales.
    expect(max - min).toBeGreaterThan(0.5);
  });

  it('enroule une position dans son intervalle', () => {
    expect(wrap(5, 0, 10)).toBe(5);
    expect(wrap(12, 0, 10)).toBe(2);
    expect(wrap(-3, 0, 10)).toBe(7);
    expect(wrap(-25, -20, 30)).toBe(25);
    expect(wrap(3, 4, 4)).toBe(4);
  });

  it('tire un délai dans ses bornes', () => {
    expect(nextDelay(() => 0, 100, 300)).toBe(100);
    expect(nextDelay(() => 0.5, 100, 300)).toBe(200);
  });
});
