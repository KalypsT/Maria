import { describe, expect, it } from 'vitest';
import { STRANGE_THINGS } from '../src/config/memories';
import { END_SCREEN } from '../src/config/story';

const ART = new Set(
  Object.keys(import.meta.glob('../public/art/*')).map((path) => path.replace('../public/', '')),
);

describe('l’écran de fin : Maria parmi les jouets d’avant (D-191)', () => {
  it('les jouets du monde étrange de Céleste, sans Eden, chacun son image', () => {
    const ids = END_SCREEN.toys.map((t) => t.id);
    expect([...ids].sort()).toEqual(STRANGE_THINGS.filter((id) => id !== 'eden-tower').sort());
    for (const toy of END_SCREEN.toys) {
      expect(ART.has(toy.image), toy.id).toBe(true);
    }
  });

  it('de part et d’autre de Maria, sur l’étagère, plus petits qu’elle, jamais deux à la même place', () => {
    const lefts = END_SCREEN.toys.map((t) => t.left);
    for (const toy of END_SCREEN.toys) {
      // Maria au milieu (40 à 60 % de la scène élargie) : les jouets à gauche ou à droite.
      expect(toy.left < 40 || toy.left > 60, toy.id).toBe(true);
      expect(toy.left).toBeGreaterThan(0);
      expect(toy.left).toBeLessThan(100);
      // Plus petits que Maria (46 % de la hauteur).
      expect(toy.height, toy.id).toBeLessThan(46);
    }
    expect(lefts.filter((l) => l < 50).length).toBeGreaterThan(0);
    expect(lefts.filter((l) => l > 50).length).toBeGreaterThan(0);
    expect(new Set(lefts).size).toBe(lefts.length);
  });
});
