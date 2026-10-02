import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COMBAT,
  LuggagePhase,
  TrainPhase,
  cyclePhase,
  luggageState,
} from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, msToSteps } from '../src/config/movement';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';

const P = DEFAULT_COMBAT;

/**
 * Un toit de train : la ligne 6 (le toit), un creux entre deux voitures (colonnes 9-11, deux lignes
 * plus bas), un tunnel sur la ligne 6 ; une valise sur un filet au-dessus du plancher, à droite.
 */
const ROOF = [
  '; @tunnel: 6',
  '; @decor: fallingcase 16 2 1 1',
  '####################',
  '#..................#',
  '#..................#',
  '#...............---#',
  '#..................#',
  '#..P...............#',
  '#########...########',
  '#########...########',
  '####################',
];

function rig() {
  const level = parseAsciiLevel('roof', ROOF.join('\n'));
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, 3 * T, 6 * T - PLAYER_HITBOX.height);
  player.canSlide = true;
  const world = new CombatWorld(level, P);
  const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
  const place = (col: number, floorRow: number) => {
    player.reset((col + 0.5) * T - PLAYER_HITBOX.width / 2, floorRow * T - PLAYER_HITBOX.height);
  };
  const step = (n: number) => {
    let events = 0;
    for (let i = 0; i < n; i++) {
      player.step(input);
      world.step(player, false);
      events |= world.events;
      input.abilityPressed = false;
    }
    return events;
  };
  return { level, player, world, input, place, step };
}

/** Pas jusqu'au début du passage d'un tunnel (depuis le chargement). */
const toTunnel = msToSteps(P.tunnelPeriodMs - P.tunnelPassMs) + 1;

describe('tunnels du toit (D-86)', () => {
  it('calme, annonce, puis dedans : le cycle commence par le calme', () => {
    const at = (ms: number) => cyclePhase(ms, P.tunnelPeriodMs, P.tunnelWarnMs, P.tunnelPassMs);
    expect(at(0)).toBe(TrainPhase.Calm);
    expect(at(P.tunnelPeriodMs - P.tunnelPassMs - 1)).toBe(TrainPhase.Warning);
    expect(at(P.tunnelPeriodMs - 1)).toBe(TrainPhase.Passing);
    expect(at(P.tunnelPeriodMs + 1)).toBe(TrainPhase.Calm);
  });

  it('debout sur le toit dans le tunnel : repoussée vers l’arrière, une seule fois', () => {
    const r = rig();
    r.place(5, 6);
    expect(r.step(toTunnel - 2) & CombatEvent.Hurt).toBe(0);
    const events = r.step(4);
    expect(events & CombatEvent.Hurt).not.toBe(0);
    expect(r.player.vx).toBeLessThan(0);
    // Une seule fois par tunnel, même en restant debout dedans.
    r.place(5, 6);
    expect(r.step(msToSteps(P.tunnelPassMs) - 10) & CombatEvent.Hurt).toBe(0);
  });

  it('à l’abri entre deux voitures, ou couchée en glissade, le tunnel passe sans rien faire', () => {
    const sheltered = rig();
    sheltered.place(10, 8);
    expect(sheltered.step(toTunnel + msToSteps(P.tunnelPassMs) - 2) & CombatEvent.Hurt).toBe(0);
    const low = rig();
    low.place(5, 6);
    low.step(toTunnel - 3);
    low.input.abilityPressed = true;
    expect(low.step(3) & CombatEvent.Hurt).toBe(0);
    expect(low.player.low).toBe(true);
  });
});

describe('valises qui tombent (D-86)', () => {
  it('sur le filet, qui tremble, qui tombe de plus en plus vite, puis au sol', () => {
    const state = { phase: LuggagePhase.Rack as LuggagePhase, fallen: 0 };
    const phases: LuggagePhase[] = [];
    let last = -1;
    for (let ms = 0; ms < P.luggagePeriodMs + 500; ms += 10) {
      luggageState(ms, 0, 1, 64, P, state);
      if (phases.at(-1) !== state.phase) {
        phases.push(state.phase);
      }
      if (state.phase === LuggagePhase.Fall) {
        expect(state.fallen).toBeGreaterThanOrEqual(last);
        last = state.fallen;
      }
      expect(state.fallen).toBeLessThanOrEqual(64);
    }
    expect(phases.slice(0, 5)).toEqual([
      LuggagePhase.Rack,
      LuggagePhase.Shake,
      LuggagePhase.Fall,
      LuggagePhase.Lie,
      LuggagePhase.Rack,
    ]);
  });

  it('deux valises d’une salle ne tombent pas ensemble', () => {
    const a = { phase: LuggagePhase.Rack as LuggagePhase, fallen: 0 };
    const b = { phase: LuggagePhase.Rack as LuggagePhase, fallen: 0 };
    for (let ms = 0; ms < 2 * P.luggagePeriodMs; ms += 20) {
      luggageState(ms, 0, 2, 64, P, a);
      luggageState(ms, 1, 2, 64, P, b);
      expect(a.phase === LuggagePhase.Fall && b.phase === LuggagePhase.Fall).toBe(false);
    }
  });

  it('sous le filet, la valise qui tombe touche Céleste ; ailleurs, rien', () => {
    const under = rig();
    under.place(16, 8 - 2);
    // Le plancher sous le filet est la ligne 6 (le toit) : Céleste y est debout.
    expect(under.world.luggage).toHaveLength(1);
    let hurt = 0;
    for (let i = 0; i < msToSteps(P.luggagePeriodMs) + 10; i++) {
      hurt |= under.step(1);
      under.place(16, 6);
    }
    expect(hurt & CombatEvent.Hurt).not.toBe(0);
    const away = rig();
    let none = 0;
    for (let i = 0; i < msToSteps(P.luggagePeriodMs) + 10; i++) {
      none |= away.step(1);
      away.place(5, 6);
    }
    // Loin de la valise (et avant le premier tunnel) : jamais touchée par elle.
    expect(away.world.fallingBox(0) === null || away.player.box.x < 10 * T).toBe(true);
    expect(msToSteps(P.luggagePeriodMs) + 10).toBeLessThan(toTunnel);
    expect(none & CombatEvent.Hurt).toBe(0);
  });
});
