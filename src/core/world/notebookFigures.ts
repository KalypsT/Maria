import { MARIA_THINGS, MEMORIES, MEMORIES_LATER, STRANGE_THINGS } from '../../config/memories';
import type { SaveData } from '../save/saveData';
import { totalFaints } from '../save/stats';
import { zoneShells } from './shells';
import { isMappedRoom, type Zone } from './zone';

/** Un compte : trouvés et en tout. */
export interface Tally {
  readonly found: number;
  readonly total: number;
}

/**
 * Les chiffres de la page « Mon voyage » du cahier (D-153) : le temps de jeu, les coquilles, les
 * souvenirs (les trois pages du cahier), les lieux découverts (les salles de la carte), les
 * évanouissements. Pur.
 */
export interface NotebookFigures {
  readonly playMs: number;
  readonly shells: Tally;
  readonly memories: Tally;
  readonly places: Tally;
  readonly faints: number;
}

export function notebookFigures(
  zone: Zone,
  data: Pick<Readonly<SaveData>, 'stats' | 'progression'>,
): NotebookFigures {
  const { collectibles, memories, mapRevealed } = data.progression;
  const shells = zoneShells(zone);
  const allMemories = [...MEMORIES, ...MARIA_THINGS, ...STRANGE_THINGS].filter(
    (id) => !MEMORIES_LATER.includes(id),
  );
  let rooms = 0;
  let visited = 0;
  for (const [id, level] of zone.rooms) {
    if (isMappedRoom(level)) {
      rooms++;
      if (mapRevealed.includes(id)) {
        visited++;
      }
    }
  }
  return {
    playMs: data.stats.playMs,
    shells: {
      found: shells.filter((s) => collectibles.includes(s.name)).length,
      total: shells.length,
    },
    memories: {
      found: allMemories.filter((id) => memories.includes(id)).length,
      total: allMemories.length,
    },
    places: { found: visited, total: rooms },
    faints: totalFaints(data.stats),
  };
}
