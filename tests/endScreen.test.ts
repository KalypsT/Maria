import { describe, expect, it } from 'vitest';
import { MEMORY_IMAGES } from '../src/config/art';
import { MARIA_THINGS } from '../src/config/memories';
import { END_SCREEN } from '../src/config/story';

const ART = new Set(
  Object.keys(import.meta.glob('../public/art/*')).map((path) =>
    path.replace('../public/art/', ''),
  ),
);

describe('l’écran de fin : les affaires de Maria autour d’elle (D-190)', () => {
  it('une place pour chacune, son image, de part et d’autre de Maria, sur l’étagère', () => {
    const spots = Object.entries(END_SCREEN.things);
    expect(spots.map(([id]) => id).sort()).toEqual([...MARIA_THINGS].sort());
    for (const [id, spot] of spots) {
      const file = MEMORY_IMAGES[id as (typeof MARIA_THINGS)[number]];
      expect(file && ART.has(file), id).toBe(true);
      // Maria au milieu : les affaires à gauche ou à droite, jamais sur elle.
      expect(spot.left < 35 || spot.left > 65, id).toBe(true);
      expect(spot.left).toBeGreaterThan(0);
      expect(spot.left).toBeLessThan(100);
      // Petites, à l'échelle d'une poupée (Maria : 46 % de la hauteur).
      expect(spot.height).toBeLessThan(15);
    }
    // Jamais deux à la même place.
    const lefts = spots.map(([, s]) => s.left);
    expect(new Set(lefts).size).toBe(lefts.length);
  });
});
