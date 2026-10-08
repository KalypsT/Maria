import { describe, expect, it } from 'vitest';
import { DEFAULT_FEEL, type FeelParams } from '../src/config/feel';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { FeelEvent, PlayerFeel } from '../src/core/player/playerFeel';

const ROOM = [
  '########################################',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#...................P..................#',
  '##########################.............#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '########################################',
].join('\n');

function rig(overrides: Partial<FeelParams> = {}) {
  const level = parseAsciiLevel('feel', ROOM);
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  const feel = new PlayerFeel({ ...DEFAULT_FEEL, squashEnabled: 1, ...overrides });
  feel.maxRunSpeed = DEFAULT_MOVEMENT.maxRunSpeed;
  feel.maxFallSpeed = DEFAULT_MOVEMENT.maxFallSpeed;
  feel.reset(player);
  const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
  let events = 0;
  const run = (steps: number, each?: () => void) => {
    for (let i = 0; i < steps; i++) {
      player.step(input);
      feel.step(player);
      events |= feel.events;
      input.jumpPressed = false;
      each?.();
    }
  };
  return {
    player,
    feel,
    input,
    run,
    takeEvents: () => {
      const e = events;
      events = 0;
      return e;
    },
  };
}

describe('PlayerFeel', () => {
  it('ne fait rien quand désactivé (par défaut)', () => {
    expect(DEFAULT_FEEL.squashEnabled).toBe(0);
    const r = rig({ squashEnabled: 0 });
    r.input.moveX = 1;
    r.input.jumpPressed = true;
    r.input.jumpHeld = true;
    r.run(300, () => {
      expect(r.feel.scaleX).toBe(1);
      expect(r.feel.scaleY).toBe(1);
      expect(r.feel.lean).toBe(0);
    });
  });

  it('étire au décollage puis revient à la forme au repos', () => {
    const r = rig();
    r.input.jumpPressed = true;
    r.input.jumpHeld = true;
    r.run(1);
    expect(r.takeEvents() & FeelEvent.Takeoff).not.toBe(0);
    expect(r.feel.scaleY).toBeGreaterThan(1.1);
    expect(r.feel.scaleX).toBeLessThan(1);
    r.run(40);
    expect(Math.abs(r.feel.squash)).toBeLessThan(0.02);
  });

  it('écrase davantage après une grande chute qu’après un petit saut', () => {
    const landingSquash = (fallFromLedge: boolean) => {
      const r = rig();
      if (fallFromLedge) {
        r.input.moveX = 1;
      } else {
        r.input.jumpPressed = true;
        r.input.jumpHeld = false;
      }
      let min = 0;
      r.run(240, () => {
        if ((r.feel.events & FeelEvent.Land) !== 0) {
          r.input.moveX = 0;
        }
        min = Math.min(min, r.feel.squash);
      });
      expect(r.takeEvents() & FeelEvent.Land).not.toBe(0);
      return -min;
    };
    const small = landingSquash(false);
    const big = landingSquash(true);
    expect(big).toBeGreaterThan(small);
    expect(big).toBeLessThanOrEqual(DEFAULT_FEEL.landSquash + 1e-9);
  });

  it('mesure la hauteur de la chute, pour doser la poussière (D-125)', () => {
    const fallHeight = (fallFromLedge: boolean) => {
      const r = rig({ squashEnabled: 0 });
      if (fallFromLedge) {
        r.input.moveX = 1;
      } else {
        r.input.jumpPressed = true;
        r.input.jumpHeld = true;
      }
      let height = -1;
      r.run(240, () => {
        if ((r.feel.events & FeelEvent.Land) !== 0 && height < 0) {
          r.input.moveX = 0;
          height = r.feel.fallHeight;
        }
      });
      return height;
    };
    // Un saut complet sur place : sa hauteur ; la chute du rebord : 7 tuiles, plus haut.
    const jump = fallHeight(false);
    expect(jump).toBeGreaterThan(DEFAULT_MOVEMENT.jumpHeightTiles * 16 - 4);
    expect(jump).toBeLessThan(DEFAULT_MOVEMENT.jumpHeightTiles * 16 + 4);
    expect(fallHeight(true)).toBeCloseTo(7 * 16, 0);
  });

  it('penche dans le sens de la course, sans pencher en l’air', () => {
    const r = rig();
    r.input.moveX = 1;
    r.run(60);
    expect(r.feel.lean).toBeGreaterThan(0);
    expect(r.feel.lean).toBeLessThanOrEqual((DEFAULT_FEEL.leanDeg * Math.PI) / 180 + 1e-9);
    r.input.moveX = -1;
    r.run(60);
    expect(r.feel.lean).toBeLessThan(0);
    expect(r.takeEvents() & FeelEvent.Turn).not.toBe(0);
  });

  it('reste borné : le ressort ne diverge pas', () => {
    const r = rig({ springHz: 20, springDamping: 0.1 });
    r.input.jumpPressed = true;
    r.input.jumpHeld = true;
    r.run(1);
    // Un ressort amorti ne dépasse jamais l'amplitude de son déclencheur (saut ou réception).
    const bound = Math.max(DEFAULT_FEEL.jumpStretch, DEFAULT_FEEL.landSquash);
    r.run(600, () => {
      expect(Math.abs(r.feel.squash)).toBeLessThanOrEqual(bound + 1e-9);
    });
    expect(Math.abs(r.feel.squash)).toBeLessThan(0.01);
  });
});
