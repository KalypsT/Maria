import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { Chase, ChaseEvent } from '../src/core/boss/Chase';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { EntityType, type LevelData } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics } from '../src/core/player/PlayerPhysics';
import { LEVELS } from '../src/levels';
import { fastest } from './pace';

const P = DEFAULT_COMBAT;

/** Valeur présente, sinon l'échec du test (sans assertion non nulle). */
function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}
const HZ = 120;
const box = (x: number, feetY: number) => ({ x, y: feetY - 22, width: 12, height: 22 });

function course(): LevelData {
  const source = LEVELS.find((l) => l.id === 'poursuite');
  if (!source) {
    throw new Error('parcours 10 absent');
  }
  return parseAsciiLevel('poursuite', source.text);
}

describe('poursuite verticale (boss, D-67)', () => {
  it('@chase : ligne d’arrivée, phases de bas en haut, crocs-en-jambe', () => {
    const level = course();
    expect(level.chase?.endRow).toBe(7);
    expect(level.chase?.phases.map((p) => p.untilRow)).toEqual([73, 59, 7]);
    expect(level.chase?.trips).toHaveLength(1);
    expect(level.meta.camera).toBe('up');
    const bad = (extra: string) => () => parseAsciiLevel('c', `${extra}\n####\n#P.#\n####`);
    expect(bad('; @chase: 1')).toThrow(/chase-phase/);
    expect(bad('; @chase: 1\n; @chase-phase: 1 1\n; @chase-phase: 2 1')).toThrow(/de bas en haut/);
    expect(bad('; @chase: x')).toThrow(/mal formé/);
  });

  it('il attend un peu, puis monte à la vitesse de la phase', () => {
    const level = course();
    const chase = new Chase(need(level.chase, 'poursuite'), P, HZ);
    const feet = 98 * T;
    chase.step(box(40, feet), false);
    expect(chase.frontY).toBe(feet + P.chaseRestartGapTiles * T);
    const delaySteps = (P.chaseStartDelayMs / 1000) * HZ;
    for (let s = 1; s < delaySteps; s++) {
      chase.step(box(40, feet), false);
    }
    const y0 = chase.frontY;
    expect(y0).toBe(feet + P.chaseRestartGapTiles * T);
    for (let s = 0; s < HZ; s++) {
      chase.step(box(40, feet), false);
    }
    // Une seconde de montée à la vitesse de la phase 1 (le contact l'arrête avant les pieds).
    expect(y0 - chase.frontY).toBeCloseTo(5.1 * T, 3);
  });

  it('il ne reste jamais trop loin : il remonte hors de la vue', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    for (let s = 0; s <= (P.chaseStartDelayMs / 1000) * HZ; s++) {
      chase.step(box(40, 98 * T), false);
    }
    chase.step(box(40, 70 * T), false);
    expect(chase.frontY).toBeLessThanOrEqual(70 * T + P.chaseMaxGapTiles * T);
  });

  it('le toucher : contact une fois, il recule et s’arrête ; invulnérable, rien', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    const feet = 90 * T;
    chase.step(box(40, feet), false);
    chase.frontY = feet - 10;
    expect(chase.step(box(40, feet), false)).toBe(true);
    expect(chase.events & ChaseEvent.Contact).toBeTruthy();
    expect(chase.frontY).toBeGreaterThanOrEqual(feet + P.chaseContactRecoilTiles * T);
    expect(chase.paused).toBe(true);
    chase.frontY = feet - 10;
    expect(chase.step(box(40, feet), true)).toBe(false);
  });

  it('le croc-en-jambe le fait reculer et s’arrêter, une fois par essai', () => {
    const level = course();
    const trip = need(need(level.chase, 'poursuite').trips[0], 'croc-en-jambe');
    const chase = new Chase(need(level.chase, 'poursuite'), P, HZ);
    const feet = (trip.row + 2) * T;
    // Hors du croc-en-jambe d'abord (à la même hauteur), puis dedans.
    chase.step(box(200, feet), false);
    const before = chase.frontY;
    chase.step(box(trip.col * T + 4, feet), false);
    expect(chase.events & ChaseEvent.Trip).toBeTruthy();
    expect(chase.frontY).toBeCloseTo(before + trip.recoil * T, 3);
    const after = chase.frontY;
    chase.step(box(trip.col * T + 4, feet), false);
    expect(chase.events & ChaseEvent.Trip).toBeFalsy();
    expect(chase.frontY).toBe(after);
    chase.restart();
    chase.step(box(trip.col * T + 4, feet), false);
    expect(chase.events & ChaseEvent.Trip).toBeTruthy();
  });

  it('la ligne d’arrivée l’arrête : il redescend', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    chase.step(box(40, 8 * T), false);
    expect(chase.done).toBe(true);
    const y = chase.frontY;
    chase.step(box(40, 8 * T), false);
    expect(chase.frontY).toBeGreaterThan(y);
  });

  it('dans le combat : le toucher fait rebondir Céleste et monter la peur', () => {
    const level = course();
    const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, 2 * T, 98 * T - 22);
    const combat = new CombatWorld(level, P);
    combat.step(player, false);
    const chase = need(combat.chase, 'poursuite');
    chase.frontY = player.box.y + player.box.height - 10;
    combat.step(player, false);
    expect(combat.events & CombatEvent.Hurt).toBeTruthy();
    expect(player.vy).toBe(-P.chaseContactBounceY);
  });

  it(
    'chaque phase laisse le temps de passer : le chemin le plus rapide devance le poursuivant',
    { timeout: 120_000 },
    () => {
      const level = course();
      const a = analyzeLevel(level, DEFAULT_MOVEMENT, {
        climb: true,
        wallJump: true,
        glide: true,
        hook: true,
      });
      const lamps = level.entities
        .filter((e) => e.type === EntityType.Checkpoint)
        .sort((x, y) => y.row - x.row);
      const goal = need(level.goal, 'arrivée');
      const stops = [
        { col: level.spawn.col, row: level.spawn.row },
        ...lamps.map((l) => ({ col: l.col, row: l.row })),
        goal,
      ];
      const phases = need(level.chase, 'poursuite').phases;
      const report: string[] = [];
      const checks: [number, number][] = [];
      for (let i = 0; i < phases.length; i++) {
        const from = need(stops[i], 'étape');
        const to = need(stops[i + 1], 'étape');
        const time = fastest(
          a,
          surfaceUnder(level, a.map, from.col, from.row),
          surfaceUnder(level, a.map, to.col, to.row),
          DIFFICULTY_MIN_WINDOW_MS.easy,
        );
        // Le poursuivant repart sous les pieds de Céleste, attend, puis monte jusqu'à l'arrivée de
        // la phase (les crocs-en-jambe, en plus, ne sont pas comptés).
        const rise = from.row - to.row;
        const front =
          P.chaseStartDelayMs +
          ((P.chaseRestartGapTiles + rise) / ((phases[i]?.speed ?? 1) * P.chaseSpeedScale)) * 1000;
        report.push(
          `phase ${String(i + 1)} : ${time.toFixed(0)} ms, poursuivant ${front.toFixed(0)} ms`,
        );
        checks.push([time, front]);
      }
      console.info(report.join('\n'));
      for (const [time, front] of checks) {
        expect(time, report.join(' ; ')).toBeLessThan(front * 0.8);
        // Pas trop lent non plus : il presse vraiment (au moins 40 % du temps disponible).
        expect(time, report.join(' ; ')).toBeGreaterThan(front * 0.4);
      }
    },
  );
});
