import { describe, expect, it } from 'vitest';
import { HAPTICS, HAPTIC_MIN_GAP_MS } from '../src/config/haptics';

describe('vibrations (D-128)', () => {
  it('des motifs brefs qui finissent par une vibration', () => {
    for (const [moment, pattern] of Object.entries(HAPTICS)) {
      expect(pattern.length % 2, moment).toBe(1);
      expect(pattern.every((ms) => ms > 0)).toBe(true);
      expect(
        pattern.reduce((sum, ms) => sum + ms, 0),
        moment,
      ).toBeLessThanOrEqual(200);
    }
    expect(HAPTIC_MIN_GAP_MS).toBeGreaterThan(0);
  });
});
