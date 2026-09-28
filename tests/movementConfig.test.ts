import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../src/config/display';
import {
  DEFAULT_MOVEMENT,
  MOVEMENT_PARAM_RANGES,
  deriveMovement,
  msToSteps,
} from '../src/config/movement';

describe('deriveMovement', () => {
  it('déduit gravité et impulsion de la hauteur et du temps de montée', () => {
    const d = deriveMovement(DEFAULT_MOVEMENT, 120);
    const h = DEFAULT_MOVEMENT.jumpHeightTiles * TILE_SIZE;
    expect(d.jumpVelocity / d.riseGravity).toBeCloseTo(DEFAULT_MOVEMENT.jumpTimeToApex, 10);
    expect((d.jumpVelocity * d.jumpVelocity) / (2 * d.riseGravity)).toBeCloseTo(h, 10);
    expect(d.fallGravity).toBeCloseTo(d.riseGravity * DEFAULT_MOVEMENT.fallGravityMultiplier, 10);
    expect(d.dt).toBe(1 / 120);
  });

  it('convertit les durées en nombres entiers de pas', () => {
    expect(msToSteps(100, 120)).toBe(12);
    expect(msToSteps(0, 120)).toBe(0);
    const d = deriveMovement(DEFAULT_MOVEMENT, 120);
    expect(Number.isInteger(d.coyoteSteps)).toBe(true);
    expect(Number.isInteger(d.jumpBufferSteps)).toBe(true);
  });

  it('place chaque valeur par défaut dans les bornes de réglage', () => {
    for (const [key, range] of Object.entries(MOVEMENT_PARAM_RANGES)) {
      const value = DEFAULT_MOVEMENT[key as keyof typeof DEFAULT_MOVEMENT];
      expect(value, key).toBeGreaterThanOrEqual(range.min);
      expect(value, key).toBeLessThanOrEqual(range.max);
    }
  });
});
