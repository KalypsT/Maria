import { MARIA_THINGS, MEMORIES, STRANGE_THINGS, type MemoryId } from '../../config/memories';
import { RECORD_SLOTS } from '../../config/records';
import type { FlagCondition, StoryData } from '../story/story';

/**
 * Les trésors (D-159) : les souvenirs, les affaires de Maria, le monde étrange. Les disques restent
 * secrets (D-121) : ni sur la carte, ni comptés.
 */
export const TREASURES: readonly MemoryId[] = [...MEMORIES, ...MARIA_THINGS, ...STRANGE_THINGS];

/** Où se trouve un trésor (ou un disque) : la salle et la tuile de son déclencheur, et quand il est là. */
export interface TreasureSpot {
  readonly id: string;
  readonly room: string;
  readonly col: number;
  readonly row: number;
  readonly when: FlagCondition;
}

/**
 * Les trésors des déclencheurs de l'histoire (une étape `memory`) : leur étincelle (`mark`), sinon
 * le milieu de leur zone. `ids` : les trésors cherchés (les disques, avec `RECORD_SLOTS`). Pur.
 */
export function treasureSpots(
  story: StoryData,
  ids: readonly string[] = TREASURES,
): TreasureSpot[] {
  const treasures = new Set<string>(ids);
  const spots: TreasureSpot[] = [];
  for (const trigger of story.triggers) {
    for (const step of trigger.steps) {
      if (step.do !== 'memory' || !treasures.has(step.id)) {
        continue;
      }
      const at =
        trigger.mark ??
        (trigger.area
          ? {
              col: trigger.area.col + Math.floor(trigger.area.w / 2),
              row: trigger.area.row + Math.floor(trigger.area.h / 2),
            }
          : null);
      if (at && !spots.some((s) => s.id === step.id && s.room === trigger.room)) {
        spots.push({
          id: step.id,
          room: trigger.room,
          col: at.col,
          row: at.row,
          when: trigger.when,
        });
      }
    }
  }
  return spots;
}

/** Les disques (D-121) : leur place, pour leur fiche dans le sac (ni carte ni compte). */
export function recordSpots(story: StoryData): TreasureSpot[] {
  return treasureSpots(story, RECORD_SLOTS);
}
