import { describe, expect, it } from 'vitest';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { ANALYSIS_TIMEOUT_MS as TIMEOUT } from './timeouts';
import { difficultyOf, shellStage, shellWindow, shellsOf, withoutAbility } from './shellIntent';

/** La maison et le jardin (D-148) : chaque coquille tient son intention. */
const ROOMS = [
  'bedroom',
  'hall',
  'staircase',
  'living',
  'kitchen',
  'laundry',
  'attic',
  'garden-terrace',
  'garden-vegetables',
  'garden-tree',
  'garden-treehouse',
  'garden-alley',
];

describe('les coquilles de la maison et du jardin (D-148)', () => {
  const shells = shellsOf(ROOMS);

  it('chacune a son intention', () => {
    expect(shells.filter((s) => !s.intent).map((s) => s.name)).toEqual([]);
  });

  it.each(shells.filter((s) => s.intent && !s.intent.crawl))(
    '$name ($room)',
    { timeout: TIMEOUT },
    (shell) => {
      const intent = shell.intent;
      if (!intent) {
        return;
      }
      const stage = shellStage(shell.room, intent);
      const w = shellWindow(shell.room, { ...shell, intent }, stage);
      // Exactement à sa difficulté : faisable, et pas plus facile.
      expect(difficultyOf(w), `fenêtre ${String(Math.round(w))} ms`).toBe(intent.difficulty);
      for (const ability of intent.needs) {
        const without = shellWindow(
          shell.room,
          { ...shell, intent },
          withoutAbility(stage, ability),
        );
        expect(without, `sans ${ability}`).toBeLessThan(DIFFICULTY_MIN_WINDOW_MS.hard);
      }
      if (intent.growth) {
        const before = shellWindow(
          shell.room,
          { ...shell, intent },
          { ...stage, phase: stage.phase - 1 },
        );
        expect(before, 'avant la croissance').toBeLessThan(DIFFICULTY_MIN_WINDOW_MS.hard);
      }
    },
  );
});
