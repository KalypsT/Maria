import { describe, expect, it } from 'vitest';
import { CAMERA_PARAM_RANGES, DEFAULT_CAMERA } from '../src/config/camera';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { DEFAULT_FEEL } from '../src/config/feel';
import { DEFAULT_WORLD } from '../src/config/world';
import { DEFAULT_MOVEMENT, MOVEMENT_PARAM_RANGES } from '../src/config/movement';
import {
  cameraToJson,
  combatToJson,
  feelToJson,
  movementToJson,
  sanitizeCameraOverrides,
  sanitizeCombatOverrides,
  sanitizeFeelOverrides,
  sanitizeMovementOverrides,
  sanitizeWorldOverrides,
  worldToJson,
} from '../src/debug/movementOverrides';

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

describe('sanitizeCameraOverrides', () => {
  it('borne les réglages de caméra et relit un export', () => {
    expect(sanitizeCameraOverrides({ zoom: 10, deadZoneWidthPx: 30, other: 1 })).toEqual({
      zoom: CAMERA_PARAM_RANGES.zoom.max,
      deadZoneWidthPx: 30,
    });
    expect(sanitizeCameraOverrides(JSON.parse(cameraToJson(DEFAULT_CAMERA)))).toEqual(
      DEFAULT_CAMERA,
    );
  });
});

describe('sanitizeFeelOverrides', () => {
  it('borne les sensations et relit un export', () => {
    expect(sanitizeFeelOverrides({ squashEnabled: 5, leanDeg: 3 })).toEqual({
      squashEnabled: 1,
      leanDeg: 3,
    });
    expect(sanitizeFeelOverrides(JSON.parse(feelToJson(DEFAULT_FEEL)))).toEqual(DEFAULT_FEEL);
  });
});

describe('sanitizeCombatOverrides', () => {
  it('borne les réglages de combat et relit un export', () => {
    expect(sanitizeCombatOverrides({ patrollerHits: 99, hitstopMs: 30, x: 1 })).toEqual({
      patrollerHits: 5,
      hitstopMs: 30,
    });
    expect(sanitizeCombatOverrides(JSON.parse(combatToJson(DEFAULT_COMBAT)))).toEqual(
      DEFAULT_COMBAT,
    );
  });
});

describe('sanitizeWorldOverrides', () => {
  it('borne les réglages d’échec et relit un export', () => {
    expect(sanitizeWorldOverrides({ fearMax: 50, faintMs: 300 })).toEqual({
      fearMax: 6,
      faintMs: 300,
    });
    expect(sanitizeWorldOverrides(JSON.parse(worldToJson(DEFAULT_WORLD)))).toEqual(DEFAULT_WORLD);
  });
});
