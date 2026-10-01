import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, type MovementParams } from '../src/config/movement';
import {
  computeJumpProfile,
  gapWindowMs,
  type JumpProfile,
} from '../src/core/analysis/jumpProfile';

/** Garde-fou contre un test bloqué, pas une mesure de vitesse : large, car la CI analyse les salles en parallèle. */
const TIMEOUT = 300_000;

function gapAt(profile: JumpProfile, rise: number): number {
  return profile.gaps.find((gap) => gap.riseTiles === rise)?.maxGapTiles ?? 0;
}

function withParams(changes: Partial<MovementParams>): MovementParams {
  return { ...DEFAULT_MOVEMENT, ...changes };
}

describe('computeJumpProfile', () => {
  const profile = computeJumpProfile(DEFAULT_MOVEMENT);

  it('mesure la hauteur configurée et la corniche la plus haute', () => {
    expect(profile.apexPx).toBeCloseTo(DEFAULT_MOVEMENT.jumpHeightTiles * T, 0);
    expect(profile.maxRiseTiles).toBe(Math.floor(DEFAULT_MOVEMENT.jumpHeightTiles));
    expect(profile.airtimeMs).toBeGreaterThan(DEFAULT_MOVEMENT.jumpTimeToApex * 1000);
    expect(profile.runningJumpDistancePx).toBeCloseTo(
      (DEFAULT_MOVEMENT.maxRunSpeed * profile.airtimeMs) / 1000,
      -1,
    );
  });

  it('franchit des trous plus grands quand l’arrivée est plus basse', () => {
    const franchissables = profile.gaps.filter((gap) => gap.maxGapTiles > 0);
    for (let i = 1; i < franchissables.length; i++) {
      const higher = franchissables[i - 1];
      const lower = franchissables[i];
      expect(lower?.maxGapTiles).toBeGreaterThanOrEqual(higher?.maxGapTiles ?? 0);
    }
    // Rapport lisible dans la sortie des tests (valeurs provisoires, D-16).
    console.info(
      `Profil de saut : ${profile.apexPx.toFixed(1)} px (${profile.maxRiseTiles} tuiles), ` +
        `${profile.airtimeMs.toFixed(0)} ms, ${profile.runningJumpDistancePx.toFixed(0)} px en courant\n` +
        profile.gaps
          .map(
            (gap) =>
              `  dénivelé ${String(gap.riseTiles).padStart(2)} : trou max ${gap.maxGapTiles} tuiles ` +
              `(fenêtre ${gap.windowMs.toFixed(0)} ms)`,
          )
          .join('\n'),
    );
  });

  it(
    'suit les paramètres : saut plus haut, course plus rapide, sans coyote',
    () => {
      const higher = computeJumpProfile(withParams({ jumpHeightTiles: 5 }));
      expect(higher.maxRiseTiles).toBeGreaterThanOrEqual(4);
      expect(higher.maxRiseTiles).toBeGreaterThan(profile.maxRiseTiles);

      const faster = computeJumpProfile(withParams({ maxRunSpeed: 180 }));
      expect(gapAt(faster, 0)).toBeGreaterThan(gapAt(profile, 0));

      const flat = gapAt(profile, 0);
      const withCoyote = gapWindowMs(flat - 1, 0, DEFAULT_MOVEMENT);
      const withoutCoyote = gapWindowMs(flat - 1, 0, withParams({ coyoteTimeMs: 0 }));
      expect(withoutCoyote).toBeLessThan(withCoyote);
    },
    TIMEOUT,
  );

  it('annonce l’impossible : trou trop large, corniche trop haute', () => {
    expect(gapWindowMs(gapAt(profile, 0) + 1, 0, DEFAULT_MOVEMENT)).toBe(0);
    expect(gapWindowMs(1, profile.maxRiseTiles + 1, DEFAULT_MOVEMENT)).toBe(0);
  });
});
