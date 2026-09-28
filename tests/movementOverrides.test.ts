import { describe, expect, it } from 'vitest';
import { DEFAULT_MOVEMENT, MOVEMENT_PARAM_RANGES } from '../src/config/movement';
import { movementToJson, sanitizeMovementOverrides } from '../src/debug/movementOverrides';

describe('sanitizeMovementOverrides', () => {
  it('garde les clés connues et numériques, bornées', () => {
    const result = sanitizeMovementOverrides({
      maxRunSpeed: 150,
      coyoteTimeMs: 99_999,
      jumpHeightTiles: 'haut',
      unknown: 3,
      airAcceleration: Number.NaN,
    });
    expect(result).toEqual({
      maxRunSpeed: 150,
      coyoteTimeMs: MOVEMENT_PARAM_RANGES.coyoteTimeMs.max,
    });
  });

  it('résiste aux entrées invalides', () => {
    expect(sanitizeMovementOverrides(null)).toEqual({});
    expect(sanitizeMovementOverrides('x')).toEqual({});
  });

  it('relit sans perte un export JSON', () => {
    const json = movementToJson(DEFAULT_MOVEMENT);
    expect(sanitizeMovementOverrides(JSON.parse(json))).toEqual(DEFAULT_MOVEMENT);
  });
});
