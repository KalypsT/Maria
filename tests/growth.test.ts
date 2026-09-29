import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../src/config/display';
import { GROWTH_PHASES, growthPhase, phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { PlayerPhysics } from '../src/core/player/PlayerPhysics';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';

describe('croissance (D-43)', () => {
  it('la phase se déduit des drapeaux de l’histoire (aucune migration de sauvegarde)', () => {
    expect(growthPhase(new Set()).id).toBe(1);
    expect(growthPhase(new Set([StoryFlag.StrangeDone])).id).toBe(1);
    expect(growthPhase(new Set([StoryFlag.Grown])).id).toBe(2);
  });

  it.each(GROWTH_PHASES.map((p) => [p.id, p] as const))(
    'phase %i : hitbox < 1 tuile de large et < 2 de haut, influence modérée',
    (_id, phase) => {
      expect(phase.hitbox.width).toBeLessThan(TILE_SIZE);
      expect(phase.hitbox.height).toBeLessThan(2 * TILE_SIZE);
      for (const factor of Object.values(phase.movementScale)) {
        expect(factor).toBeGreaterThan(0.8);
        expect(factor).toBeLessThan(1.3);
      }
    },
  );

  it('les facteurs s’appliquent aux paramètres réglés en direct', () => {
    const phase = growthPhase(new Set([StoryFlag.Grown]));
    const base = { ...DEFAULT_MOVEMENT, jumpHeightTiles: 3 };
    const out = phaseMovement(base, phase);
    expect(out.jumpHeightTiles).toBeCloseTo(3 * (phase.movementScale.jumpHeightTiles ?? 1));
    expect(out.coyoteTimeMs).toBe(base.coyoteTimeMs);
    expect(phaseMovement(base, growthPhase(new Set()))).toEqual(base);
  });

  it('grandir garde les pieds et le centre à la même place', () => {
    const level = parseAsciiLevel('t', ['.....', '.....', '.....', '..P..', '#####'].join('\n'));
    const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, 20, 64 - 22);
    const feet = player.box.y + player.box.height;
    const center = player.box.x + player.box.width / 2;
    player.setHitbox({ width: 12, height: 26 });
    expect(player.box.y + player.box.height).toBe(feet);
    expect(player.box.x + player.box.width / 2).toBe(center);
    expect(player.box.height).toBe(26);
  });
});
