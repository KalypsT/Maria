import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { atLayer } from '../src/core/level/layers';
import type { Layer } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { LayerShift, ShiftEvent } from '../src/core/player/LayerShift';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';

/**
 * Le présent : un mur au milieu (colonnes 7-8). Le souvenir : pas de mur, mais une planche au-dessus
 * de la fosse (colonnes 11-14, ligne 6) qui n'existe pas dans le présent.
 */
const ROOM = [
  '; @shift: present 7 3 2 4',
  '; @shift: memory 11 6 4 1',
  '####################',
  '#..................#',
  '#..................#',
  '#......##..........#',
  '#......##..........#',
  '#.P....##..........#',
  '##########====######',
  '##########....######',
  '####################',
].join('\n');

const present = parseAsciiLevel('shift-room', ROOM);
const memory = atLayer(present, 'memory');
const H = PLAYER_HITBOX.height;
const idle: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };

function standing(col: number): PlayerPhysics {
  return new PlayerPhysics(present, DEFAULT_MOVEMENT, col * T + 2, 6 * T - H);
}

describe('la bascule dans la physique (D-107)', () => {
  it('sur un sol commun : même place, même état, autre collision', () => {
    const p = standing(3);
    expect(p.shiftTo(memory)).toBe(true);
    expect(p.collisionLevel).toBe(memory);
    expect(p.grounded).toBe(true);
    expect(p.box.x).toBe(3 * T + 2);
  });

  it('refusée si Céleste se retrouverait dans un mur', () => {
    const p = standing(3);
    p.shiftTo(memory);
    // Dans le souvenir, elle va où est le mur du présent, puis veut y revenir.
    p.reset(7 * T + 2, 6 * T - H, memory);
    expect(p.shiftTo(present)).toBe(false);
    expect(p.collisionLevel).toBe(memory);
    expect(p.box.x).toBe(7 * T + 2);
  });

  it('la marge décale Céleste de quelques px au plus', () => {
    const p = standing(3);
    p.reset(9 * T - 2, 6 * T - H, memory);
    expect(p.shiftTo(present, 0)).toBe(false);
    expect(p.shiftTo(present, 3)).toBe(true);
    expect(p.box.x).toBe(9 * T);
  });

  it('la planche du souvenir porte, et disparaît dans le présent : on tombe', () => {
    const p = new PlayerPhysics(memory, DEFAULT_MOVEMENT, 12 * T, 6 * T - H);
    expect(p.grounded).toBe(true);
    expect(p.shiftTo(present)).toBe(true);
    expect(p.grounded).toBe(false);
    for (let i = 0; i < 60; i++) {
      p.step(idle);
    }
    expect(p.box.y + H).toBeGreaterThan(6 * T);
  });

  it('refusée suspendue à un rebord ; aucun effet sur une salle sans couches', () => {
    const plain = parseAsciiLevel('plain', ROOM.replace(/; @shift.*\n/g, ''));
    const p = new PlayerPhysics(plain, DEFAULT_MOVEMENT, 3 * T, 6 * T - H);
    expect(p.shiftTo(atLayer(plain, 'memory'))).toBe(true);
    expect(p.collisionLevel).toBe(plain);
  });
});

describe('la bascule : pression gardée, délai, refus (D-107)', () => {
  function host(free: () => boolean) {
    const log: Layer[] = [];
    return {
      log,
      tryShift(to: Layer) {
        if (!free()) {
          return false;
        }
        log.push(to);
        return true;
      },
    };
  }

  it('bascule tout de suite quand la place suffit, puis attend le délai', () => {
    const s = new LayerShift();
    const h = host(() => true);
    expect(s.step(true, DEFAULT_MOVEMENT, h)).toBe(ShiftEvent.Shifted);
    expect(s.layer).toBe('memory');
    // Pressée de nouveau pendant le délai : la pression attend, puis repasse au présent.
    let event: ShiftEvent = s.step(true, DEFAULT_MOVEMENT, h);
    let steps = 0;
    while (event === ShiftEvent.None && steps++ < 100) {
      event = s.step(false, DEFAULT_MOVEMENT, h);
    }
    expect(h.log).toEqual(['memory', 'present']);
    expect(s.layer).toBe('present');
  });

  it('garde la pression tant que la place manque, puis refuse avec un signe', () => {
    let free = false;
    const s = new LayerShift();
    const h = host(() => free);
    expect(s.step(true, DEFAULT_MOVEMENT, h)).toBe(ShiftEvent.None);
    free = true;
    expect(s.step(false, DEFAULT_MOVEMENT, h)).toBe(ShiftEvent.Shifted);
    free = false;
    s.reset();
    expect(s.layer).toBe('present');
    const events: ShiftEvent[] = [s.step(true, DEFAULT_MOVEMENT, h)];
    for (let i = 0; i < 40; i++) {
      events.push(s.step(false, DEFAULT_MOVEMENT, h));
    }
    expect(events.filter((e) => e === ShiftEvent.Refused)).toHaveLength(1);
    expect(s.layer).toBe('present');
  });

  it('sans tampon, un seul essai', () => {
    const s = new LayerShift();
    const params = { ...DEFAULT_MOVEMENT, shiftBufferMs: 0 };
    expect(
      s.step(
        true,
        params,
        host(() => false),
      ),
    ).toBe(ShiftEvent.Refused);
  });
});

describe('la bascule et le dernier appui (D-107)', () => {
  it('le dernier appui retient sa couche', async () => {
    const { RunState } = await import('../src/core/world/RunState');
    const { DEFAULT_WORLD } = await import('../src/config/world');
    const run = new RunState(present, DEFAULT_WORLD);
    const box = { x: 12 * T, y: 6 * T - H, width: PLAYER_HITBOX.width, height: H };
    run.setLayer(memory);
    run.step(box, 0, true);
    expect(run.footing?.level).toBe(memory);
    run.setLayer(present);
    run.step({ ...box, x: 3 * T }, 0, true);
    expect(run.footing?.level).toBe(present);
  });
});
