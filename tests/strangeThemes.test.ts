import { describe, expect, it } from 'vitest';
import { REAL_PALETTE, STRANGE_PALETTE, WALL_STYLES } from '../src/config/art';
import { STRANGE_MOCKUPS, STRANGE_MOCKUP_PALETTES } from '../src/config/strangeThemes';

describe('maquettes du monde étrange (D-130)', () => {
  it('le jeu ne change pas tant qu’aucune maquette n’est choisie', () => {
    for (const palette of [REAL_PALETTE, STRANGE_PALETTE]) {
      expect(palette.rimWidth).toBe(1);
      expect(palette.rimGlow).toBe(0);
      expect(palette.wallMotif).toBeNull();
      expect(palette.halo).toBe(0);
    }
  });

  it('chaque maquette rend les appuis plus lisibles et impose un motif connu', () => {
    for (const mockup of STRANGE_MOCKUPS) {
      const palette = { ...STRANGE_PALETTE, ...STRANGE_MOCKUP_PALETTES[mockup] };
      expect(palette.rimWidth, mockup).toBeGreaterThan(1);
      expect(palette.rimGlow, mockup).toBeGreaterThan(0);
      expect(palette.halo, mockup).toBeGreaterThan(0);
      expect(WALL_STYLES as readonly (string | null)[]).toContain(palette.wallMotif);
      expect(palette.silhouettes, mockup).toBe(true);
    }
  });
});
