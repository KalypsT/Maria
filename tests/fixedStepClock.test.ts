import { describe, expect, it } from 'vitest';
import { FixedStepClock } from '../src/core/FixedStepClock';

const STEP = 1 / 120;

function totalSteps(clock: FixedStepClock, hz: number, seconds: number): number {
  let steps = 0;
  const frames = Math.round(seconds * hz);
  for (let i = 1; i <= frames; i++) {
    // Deltas issus de temps absolus, comme les horodatages d'images réels.
    steps += clock.advance(i / hz - (i - 1) / hz);
  }
  return steps;
}

describe('FixedStepClock', () => {
  it.each([60, 90, 120, 144, 30])('donne 120 pas par seconde à %i Hz', (hz) => {
    expect(totalSteps(new FixedStepClock(STEP, 8), hz, 10)).toBe(1200);
  });

  it('donne exactement 2 pas par image à 60 Hz', () => {
    const clock = new FixedStepClock(STEP, 8);
    for (let i = 0; i < 600; i++) {
      expect(clock.advance(1 / 60)).toBe(2);
    }
  });

  it('expose un facteur d’interpolation entre 0 et 1', () => {
    const clock = new FixedStepClock(STEP, 8);
    clock.advance(STEP * 1.5);
    expect(clock.alpha).toBeCloseTo(0.5, 9);
  });

  it('plafonne le nombre de pas et abandonne le retard', () => {
    const clock = new FixedStepClock(STEP, 8);
    expect(clock.advance(1)).toBe(8);
    expect(clock.droppedSteps).toBeGreaterThan(0);
    expect(clock.alpha).toBe(0);
    expect(clock.advance(1 / 60)).toBe(2);
  });

  it('ignore les durées nulles ou invalides', () => {
    const clock = new FixedStepClock(STEP, 8);
    expect(clock.advance(0)).toBe(0);
    expect(clock.advance(-1)).toBe(0);
    expect(clock.advance(Number.NaN)).toBe(0);
  });
});
