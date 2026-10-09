import { describe, expect, it } from 'vitest';
import { MARIA_THINGS, MEMORIES, STRANGE_THINGS } from '../src/config/memories';
import { createNewSave } from '../src/core/save/saveData';
import { addFaint, addPlayTime } from '../src/core/save/stats';
import { notebookFigures } from '../src/core/world/notebookFigures';
import { zoneShells } from '../src/core/world/shells';
import { buildZone, isMappedRoom } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

const zone = buildZone(HOUSE);

describe('la page « Mon voyage » du cahier (D-153)', () => {
  it('une nouvelle partie : tout à zéro, les totaux du jeu', () => {
    const f = notebookFigures(zone, createNewSave('bedroom', 0));
    const mapped = [...zone.rooms.values()].filter(isMappedRoom).length;
    expect(f).toEqual({
      playMs: 0,
      shells: { found: 0, total: zoneShells(zone).length },
      memories: { found: 0, total: MEMORIES.length + MARIA_THINGS.length + STRANGE_THINGS.length },
      places: { found: 0, total: mapped },
      faints: 0,
    });
  });

  it('la partie avance : le temps, les coquilles, les souvenirs, les lieux, les évanouissements', () => {
    const data = createNewSave('bedroom', 0);
    addPlayTime(data.stats, 'bedroom', 65_000);
    addFaint(data.stats, 'garden-tree');
    addFaint(data.stats, 'site');
    data.progression.collectibles.push('attic-ridge', 'pas-une-coquille');
    data.progression.memories.push('photo', 'slipper', 'record-adventures');
    // Une salle du monde étrange (hors carte) ne compte pas parmi les lieux.
    data.progression.mapRevealed.push('bedroom', 'hall', 'living-strange');
    const f = notebookFigures(zone, data);
    expect(f.playMs).toBe(65_000);
    expect(f.faints).toBe(2);
    expect(f.shells.found).toBe(1);
    expect(f.memories.found).toBe(2);
    expect(f.places.found).toBe(2);
  });
});
