import { describe, expect, it } from 'vitest';
import { ARCADE, ARCADE_TIMING, ArcadeGameId, ArcadeMode } from '../src/config/arcade';
import { msToSteps } from '../src/config/movement';
import { consoleCards, playable } from '../src/core/arcade/consoleMenu';
import { ArcadeEvent, ArcadePhase, ArcadeRun } from '../src/core/arcade/run';
import { createArcade, submitArcadeScore } from '../src/core/save/arcade';
import { Ability } from '../src/config/abilities';

const HZ = 120;

/** Avance jusqu'à l'événement attendu ; retourne le nombre de pas. */
function until(run: ArcadeRun, event: number): number {
  for (let i = 1; i < 10_000; i++) {
    if ((run.step() & event) !== 0) {
      return i;
    }
  }
  throw new Error('événement jamais arrivé');
}

/** Une partie de la console (D-166) : l'annonce, la distance, le fanion, la chute, quitter. */
describe('une partie de la console', () => {
  it('l’annonce, puis Céleste joue', () => {
    const run = new ArcadeRun(ArcadeGameId.Cables, ArcadeMode.Levels, HZ);
    run.startLevel(40);
    expect(run.playing).toBe(false);
    run.advance(10);
    expect(run.meters).toBe(0);
    expect(until(run, ArcadeEvent.Started)).toBe(msToSteps(ARCADE_TIMING.introMs, HZ));
    expect(run.playing).toBe(true);
  });

  it('la plus grande avancée compte, jusqu’au fanion ; les niveaux finis s’ajoutent', () => {
    const run = new ArcadeRun(ArcadeGameId.Cables, ArcadeMode.Levels, HZ);
    run.startLevel(40);
    until(run, ArcadeEvent.Started);
    run.advance(12);
    run.advance(5);
    expect(run.meters).toBe(Math.floor(12 * ARCADE.metersPerTile));
    run.advance(99);
    expect(run.meters).toBe(Math.floor(40 * ARCADE.metersPerTile));
    run.reachGoal();
    expect(run.phase).toBe(ArcadePhase.Cleared);
    expect(until(run, ArcadeEvent.NextLevel)).toBe(msToSteps(ARCADE_TIMING.clearedMs, HZ));
    expect(run.level).toBe(2);
    run.startLevel(30);
    until(run, ArcadeEvent.Started);
    run.advance(10);
    expect(run.meters).toBe(Math.floor(50 * ARCADE.metersPerTile));
  });

  it('une chute : le score figé, puis la fin', () => {
    const run = new ArcadeRun(ArcadeGameId.Cables, ArcadeMode.Levels, HZ);
    run.startLevel(40);
    run.fall();
    expect(run.phase).toBe(ArcadePhase.Intro); // Pas de chute pendant l'annonce.
    until(run, ArcadeEvent.Started);
    run.advance(20);
    run.fall();
    expect(run.phase).toBe(ArcadePhase.Fallen);
    run.advance(30);
    expect(run.final).toBe(Math.floor(20 * ARCADE.metersPerTile));
    expect(until(run, ArcadeEvent.Over)).toBe(msToSteps(ARCADE_TIMING.fallMs, HZ));
    expect(run.phase).toBe(ArcadePhase.Over);
    expect(run.step()).toBe(ArcadeEvent.None);
  });

  it('quitter compte comme une chute, sans attendre', () => {
    const run = new ArcadeRun(ArcadeGameId.Cables, ArcadeMode.Levels, HZ);
    run.startLevel(40);
    until(run, ArcadeEvent.Started);
    run.advance(16);
    run.quit();
    expect(run.phase).toBe(ArcadePhase.Over);
    expect(run.final).toBe(Math.floor(16 * ARCADE.metersPerTile));
  });
});

describe('le menu de la console', () => {
  it('les huit jeux ; jouables seulement débloqués et prêts ; le record du mode Niveaux', () => {
    const arcade = createArcade();
    submitArcadeScore(arcade, ArcadeGameId.Cables, ArcadeMode.Levels, 33);
    submitArcadeScore(arcade, ArcadeGameId.Cables, ArcadeMode.Endless, 99);
    const cards = consoleCards(new Set([Ability.Climb, Ability.Hook]), new Set(), arcade);
    expect(cards).toHaveLength(8);
    const byId = new Map(cards.map((card) => [card.game.id, card]));
    expect(byId.get(ArcadeGameId.Cables)).toMatchObject({
      unlocked: true,
      ready: true,
      record: 33,
    });
    expect(byId.get(ArcadeGameId.Climb)).toMatchObject({ unlocked: true, ready: false });
    expect(byId.get(ArcadeGameId.Wind)).toMatchObject({ unlocked: false });
    expect(cards.filter(playable).map((card) => card.game.id)).toEqual([ArcadeGameId.Cables]);
  });
});
