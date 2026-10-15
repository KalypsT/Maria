import type { TITLE_ENTRANCE } from '../../config/intro';

/** Le calendrier du plan 8 (D-185) : quand chaque élément de l'écran titre apparaît (ms). */
export interface TitleEntranceSchedule {
  /** Début du trait de chaque lettre. */
  letterStarts: readonly number[];
  portraitStart: number;
  panelStart: number;
  /** Tout est en place : l'écran titre redevient l'écran titre. */
  totalMs: number;
}

export function titleEntranceSchedule(
  entrance: typeof TITLE_ENTRANCE,
  letters: number,
): TitleEntranceSchedule {
  const letterStarts = Array.from(
    { length: letters },
    (_, i) => entrance.startMs + i * entrance.letterGapMs,
  );
  const lettersEnd = (letterStarts[letters - 1] ?? entrance.startMs) + entrance.letterMs;
  const portraitStart = Math.max(0, lettersEnd - entrance.overlapMs);
  const panelStart = Math.max(0, portraitStart + entrance.portraitMs - entrance.overlapMs);
  return { letterStarts, portraitStart, panelStart, totalMs: panelStart + entrance.panelMs };
}
