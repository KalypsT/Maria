import { describe, expect, it } from 'vitest';
import { CHARACTER_IMAGES } from '../src/config/art';
import { PROP_SIZE } from '../src/config/story';
import type { PropKind } from '../src/core/story/story';
import { characterHeadroom, characterOverhang } from '../src/scenes/art/familyArt';

/** Hauteur d'un adulte debout : l'échelle des poses assises sans `height`. */
const STANDING_H = PROP_SIZE['dad-door'].h;

describe('cadre des personnages illustrés assis', () => {
  it("l'image entière tient dans la texture (ni la tête ni les jambes coupées)", () => {
    for (const [kind, character] of Object.entries(CHARACTER_IMAGES)) {
      const seat = character.seat;
      if (seat === undefined) {
        continue;
      }
      const k = kind as PropKind;
      const drawnH = character.height ?? STANDING_H;
      const top = PROP_SIZE[k].h - seat * drawnH;
      expect(top + characterHeadroom(k), kind).toBeGreaterThanOrEqual(0);
      expect(top + drawnH, kind).toBeLessThanOrEqual(PROP_SIZE[k].h + characterOverhang(k));
    }
  });

  it('maman accroupie près du banc et sur le canapé : la tête dépasse du cadre', () => {
    expect(characterHeadroom('mom-bench')).toBeGreaterThan(0);
    expect(characterHeadroom('mom-sofa')).toBeGreaterThan(0);
    expect(characterHeadroom('mom-bed')).toBe(0);
    expect(characterHeadroom('dad-door')).toBe(0);
  });
});
