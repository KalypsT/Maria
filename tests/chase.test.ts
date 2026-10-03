import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { Chase, ChaseEvent } from '../src/core/boss/Chase';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { EntityType, type LevelData } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics } from '../src/core/player/PlayerPhysics';
import { LEVELS } from '../src/levels';
import { chaseRun } from './pace';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

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

describe('poursuite verticale (boss, D-67, D-70)', () => {
  it('@chase : ligne d’arrivée, phases de bas en haut, crocs-en-jambe', () => {
    const level = course();
    expect(level.chase?.dir).toBe('up');
    expect(level.chase?.end).toBe(7);
    // Une seule vitesse, constante (D-70).
    expect(level.chase?.phases).toEqual([{ until: 7, speed: 2.8 }]);
    expect(level.chase?.trips).toHaveLength(1);
    expect(level.meta.camera).toBe('up');
    const bad = (extra: string) => () => parseAsciiLevel('c', `${extra}\n####\n#P.#\n####`);
    expect(bad('; @chase: 1')).toThrow(/chase-phase/);
    expect(bad('; @chase: 1\n; @chase-phase: 1 1\n; @chase-phase: 2 1')).toThrow(/de bas en haut/);
    expect(bad('; @chase: x')).toThrow(/mal formé/);
  });

  it('il attend un peu, puis monte à vitesse constante', () => {
    const level = course();
    const chase = new Chase(need(level.chase, 'poursuite'), P, HZ);
    const feet = 98 * T;
    chase.step(box(40, feet), false);
    expect(chase.front).toBe(feet + P.chaseRestartGapTiles * T);
    const delaySteps = (P.chaseStartDelayMs / 1000) * HZ;
    for (let s = 1; s < delaySteps; s++) {
      chase.step(box(40, feet), false);
    }
    const y0 = chase.front;
    expect(y0).toBe(feet + P.chaseRestartGapTiles * T);
    for (let s = 0; s < HZ; s++) {
      chase.step(box(40, feet), false);
    }
    // Une seconde de montée à la vitesse de la salle (pas de rattrapage : il est assez près).
    expect(y0 - chase.front).toBeCloseTo(2.8 * T, 3);
  });

  it('il se met en marche une seule fois, à la fin de l’attente (réveil)', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    const delaySteps = (P.chaseStartDelayMs / 1000) * HZ;
    const wakes: number[] = [];
    for (let s = 0; s < delaySteps * 2; s++) {
      chase.step(box(40, 98 * T), false);
      if (chase.events & ChaseEvent.Wake) {
        wakes.push(s);
      }
    }
    // Le premier pas compte dans l'attente : il se réveille au dernier pas d'attente.
    expect(wakes).toEqual([delaySteps - 1]);
    // Une réapparition : il attend puis se réveille de nouveau.
    chase.restart();
    let woke = 0;
    for (let s = 0; s <= delaySteps; s++) {
      chase.step(box(40, 98 * T), false);
      woke += chase.events & ChaseEvent.Wake ? 1 : 0;
    }
    expect(woke).toBe(1);
  });

  it('trop loin, il accélère peu à peu, sans jamais sauter (rattrapage doux)', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    for (let s = 0; s <= (P.chaseStartDelayMs / 1000) * HZ; s++) {
      chase.step(box(40, 98 * T), false);
    }
    // Céleste loin au-dessus : chaque pas le fait monter un peu plus vite, au plus à la vitesse max.
    let previous = 0;
    for (let s = 0; s < HZ * 3; s++) {
      const y = chase.front;
      chase.step(box(40, 60 * T), false);
      const moved = y - chase.front;
      expect(moved).toBeLessThanOrEqual((P.chaseCatchUpMaxSpeed * T) / HZ + 1e-9);
      expect(moved).toBeGreaterThanOrEqual(previous - 1e-9);
      expect(moved).toBeGreaterThan((2.8 * T) / HZ);
      previous = moved;
    }
  });

  it('le toucher : contact une fois, il recule et s’arrête ; invulnérable, rien', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    const feet = 90 * T;
    chase.step(box(40, feet), false);
    chase.front = feet - 10;
    expect(chase.step(box(40, feet), false)).toBe(true);
    expect(chase.events & ChaseEvent.Contact).toBeTruthy();
    expect(chase.front).toBeGreaterThanOrEqual(feet + P.chaseContactRecoilTiles * T);
    expect(chase.paused).toBe(true);
    chase.front = feet - 10;
    expect(chase.step(box(40, feet), true)).toBe(false);
  });

  it('le croc-en-jambe le fait reculer et s’arrêter, une fois par essai', () => {
    const level = course();
    const trip = need(need(level.chase, 'poursuite').trips[0], 'croc-en-jambe');
    const chase = new Chase(need(level.chase, 'poursuite'), P, HZ);
    const feet = (trip.row + 2) * T;
    // Hors du croc-en-jambe d'abord (à la même hauteur), puis dedans.
    chase.step(box(200, feet), false);
    const before = chase.front;
    chase.step(box(trip.col * T + 4, feet), false);
    expect(chase.events & ChaseEvent.Trip).toBeTruthy();
    expect(chase.front).toBeCloseTo(before + trip.recoil * T, 3);
    const after = chase.front;
    chase.step(box(trip.col * T + 4, feet), false);
    expect(chase.events & ChaseEvent.Trip).toBeFalsy();
    expect(chase.front).toBe(after);
    chase.restart();
    chase.step(box(trip.col * T + 4, feet), false);
    expect(chase.events & ChaseEvent.Trip).toBeTruthy();
  });

  it('la ligne d’arrivée l’arrête : il redescend', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    chase.step(box(40, 8 * T), false);
    expect(chase.done).toBe(true);
    const y = chase.front;
    chase.step(box(40, 8 * T), false);
    expect(chase.front).toBeGreaterThan(y);
  });

  it('dans le combat : le toucher fait rebondir Céleste et monter la peur', () => {
    const level = course();
    const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, 2 * T, 98 * T - 22);
    const combat = new CombatWorld(level, P);
    combat.step(player, false);
    const chase = need(combat.chase, 'poursuite');
    chase.front = player.box.y + player.box.height - 10;
    combat.step(player, false);
    expect(combat.events & CombatEvent.Hurt).toBeTruthy();
    expect(player.vy).toBe(-P.chaseContactBounceY);
  });

  it(
    'linéaire et pressant : le chemin le plus rapide le devance toujours, un joueur bien plus lent est rattrapé',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const level = course();
      const a = analyzeLevel(level, DEFAULT_MOVEMENT, {
        climb: true,
        wallJump: true,
        glide: true,
        hook: true,
      });
      const goal = need(level.goal, 'arrivée');
      const starts = [
        level.spawn,
        ...level.entities.filter((e) => e.type === EntityType.Checkpoint),
      ];
      for (const start of starts) {
        const run = chaseRun(level, a, start, goal, DIFFICULTY_MIN_WINDOW_MS.easy);
        expect(run.contacts, `depuis la ligne ${String(start.row)}`).toBe(0);
        expect(run.margin, `depuis la ligne ${String(start.row)}`).toBeGreaterThan(2);
      }
      const slow = chaseRun(level, a, level.spawn, goal, DIFFICULTY_MIN_WINDOW_MS.easy, 1.5);
      expect(slow.contacts).toBeGreaterThan(0);
    },
  );
});
