import { describe, expect, it } from 'vitest';
import { PHYSICS_STEP_HZ } from '../src/config/movement';
import { createScriptedRun } from './scriptedRun';

/**
 * Garde-fou de performance (condition D-05). Mesure réelle ~0,2 µs/pas sur ordinateur ; le budget
 * est très large pour rester stable en CI. La comparaison avec Arcade et la mesure d'allocations
 * se font dans le navigateur : bench/arcade.html (publié dans le build de debug).
 */
const BUDGET_MICROS_PER_STEP = 10;

describe('performance de la simulation', () => {
  it(`reste sous ${BUDGET_MICROS_PER_STEP} µs par pas`, () => {
    const run = createScriptedRun();
    run(10_000); // échauffement du JIT
    const steps = 60 * PHYSICS_STEP_HZ * 5; // 5 minutes de jeu
    const start = performance.now();
    const player = run(steps);
    const micros = ((performance.now() - start) * 1000) / steps;
    expect(Number.isFinite(player.box.x)).toBe(true);
    expect(micros).toBeLessThan(BUDGET_MICROS_PER_STEP);
  });
});
