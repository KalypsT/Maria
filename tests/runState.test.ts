import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, msToSteps } from '../src/config/movement';
import { DEFAULT_WORLD, type WorldParams } from '../src/config/world';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { FaintCause, RunEvent, RunState } from '../src/core/world/RunState';

function rig(map: string[], world: Partial<WorldParams> = {}) {
  const level = parseAsciiLevel('run', map.join('\n'));
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  const combat = new CombatWorld(level, DEFAULT_COMBAT);
  const run = new RunState(level, { ...DEFAULT_WORLD, ...world });
  const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
  let events = 0;
  return {
    level,
    player,
    combat,
    run,
    input,
    step(steps: number) {
      for (let i = 0; i < steps; i++) {
        if (run.fainting) {
          run.stepFainting();
        } else {
          player.step(input);
          combat.step(player, false);
          run.step(player.box, combat.events);
        }
        events |= run.events;
      }
    },
    takeEvents() {
      const e = events;
      events = 0;
      return e;
    },
  };
}

const faintSteps = msToSteps(DEFAULT_WORLD.faintMs);

describe('RunState (D-21)', () => {
  it('danger : évanouissement, puis retour au départ sans checkpoint', () => {
    const r = rig(['##########', '#........#', '#P...^...#', '##########']);
    r.input.moveX = 1;
    r.step(200);
    const events = r.takeEvents();
    expect(events & RunEvent.Fainted).not.toBe(0);
    expect(events & RunEvent.Respawn).not.toBe(0);
    expect(r.run.respawnTile()).toEqual(r.level.spawn);
  });

  it('l’évanouissement dure le temps réglé', () => {
    const r = rig(['##########', '#........#', '#P^......#', '##########']);
    r.input.moveX = 1;
    let fainted = -1;
    let respawned = -1;
    for (let i = 0; i < 300 && respawned < 0; i++) {
      r.step(1);
      const e = r.takeEvents();
      if (e & RunEvent.Fainted) {
        fainted = i;
        expect(r.run.faintCause).toBe(FaintCause.Hazard);
      }
      if (e & RunEvent.Respawn) {
        respawned = i;
      }
    }
    expect(respawned - fainted).toBe(faintSteps);
  });

  it('checkpoint : activé au contact, devient le point de retour et vide la jauge', () => {
    const r = rig(['############', '#..........#', '#P...C..^..#', '############']);
    r.run.fear = 2;
    r.input.moveX = 1;
    r.step(60);
    const events = r.takeEvents();
    expect(events & RunEvent.CheckpointActivated).not.toBe(0);
    expect(r.run.fear).toBe(0);
    expect(r.run.checkpoints[0]?.activated).toBe(true);
    expect(r.run.currentKey).toBe('run:c5-2');
    expect(r.run.respawnTile()).toEqual({ col: 5, row: 2 });
    // Toucher de nouveau le même checkpoint ne redéclenche pas de sauvegarde.
    r.input.moveX = -1;
    r.step(30);
    r.input.moveX = 1;
    r.step(30);
    expect(r.takeEvents() & RunEvent.CheckpointActivated).toBe(0);
  });

  it('jauge de peur : chaque contact la remplit, pleine elle fait s’évanouir', () => {
    const r = rig(
      ['################', '#..............#', '#e....P........#', '################'],
      {
        fearMax: 2,
      },
    );
    let hurts = 0;
    let faintedAfter = -1;
    for (let i = 0; i < 2000 && faintedAfter < 0; i++) {
      r.step(1);
      if (r.combat.events & CombatEvent.Hurt) {
        hurts++;
      }
      if (r.takeEvents() & RunEvent.Fainted) {
        faintedAfter = hurts;
        expect(r.run.faintCause).toBe(FaintCause.Fear);
      }
    }
    expect(faintedAfter).toBe(2);
    r.step(faintSteps);
    expect(r.run.fear).toBe(0);
  });

  it('diminution naturelle de la jauge, si activée', () => {
    const r = rig(['######', '#P...#', '######'], { fearDecayMs: 1000 });
    r.run.fear = 2;
    r.step(msToSteps(1000));
    expect(r.run.fear).toBe(1);
    const off = rig(['######', '#P...#', '######']);
    off.run.fear = 2;
    off.step(msToSteps(5000));
    expect(off.run.fear).toBe(2);
  });

  it('reprend les checkpoints activés et le point de retour d’une sauvegarde', () => {
    const r = rig(['############', '#..........#', '#P..C...C..#', '############']);
    r.run.load(r.level, ['run:c8-2', 'autre:c1-1'], 'c8-2');
    expect(r.run.checkpoints.map((c) => c.activated)).toEqual([false, true]);
    expect(r.run.respawnTile()).toEqual({ col: 8, row: 2 });
    r.run.load(r.level, [], 'inconnu');
    expect(r.run.respawnTile()).toEqual(r.level.spawn);
  });
});
