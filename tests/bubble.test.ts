import { describe, expect, it } from 'vitest';
import { THOUGHT_ICONS } from '../src/core/story/story';
import { bubbleKey, bubbleSide, fitScale } from '../src/core/story/bubble';

describe('les bulles (D-165)', () => {
  it('partent vers la droite, sauf au bord droit de la salle', () => {
    expect(bubbleSide(100, 80, 640)).toBe(1);
    expect(bubbleSide(600, 80, 640)).toBe(-1);
    // Salle inconnue, ou trop étroite pour la bulle à gauche : vers la droite.
    expect(bubbleSide(600, 80, 0)).toBe(1);
    expect(bubbleSide(60, 80, 100)).toBe(1);
  });

  it('recadrent le pictogramme dans la zone sûre, sans trop grossir les petits', () => {
    const safe = { x: 0, y: 0, w: 26, h: 18 };
    expect(fitScale(52, 18, safe, 1.5)).toBeCloseTo(0.5);
    expect(fitScale(13, 36, safe, 1.5)).toBeCloseTo(0.5);
    expect(fitScale(4, 4, safe, 1.5)).toBe(1.5);
    expect(fitScale(0, 4, safe, 1.5)).toBe(1);
  });

  it('ont une texture par forme, pictogramme, côté et cubes trouvés', () => {
    const keys = new Set<string>();
    for (const kind of ['thought', 'speech'] as const) {
      for (const icon of THOUGHT_ICONS) {
        for (const side of [1, -1] as const) {
          keys.add(bubbleKey(kind, icon, side));
        }
      }
    }
    expect(keys.size).toBe(THOUGHT_ICONS.length * 4);
    expect(bubbleKey('thought', 'cubes', 1, 3)).not.toBe(bubbleKey('thought', 'cubes', 1, 5));
  });

  it('ont les nouveaux pictogrammes', () => {
    for (const icon of ['smile', 'wave', 'hush', 'wonder', 'miss', 'locked'] as const) {
      expect(THOUGHT_ICONS).toContain(icon);
    }
  });
});
