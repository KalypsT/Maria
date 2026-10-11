import { describe, expect, it } from 'vitest';
import { MEMORY_NAMES } from '../src/config/memories';
import { MAP_PLACES } from '../src/config/places';
import {
  hasNewTreasure,
  roomPlace,
  treasureBook,
  treasureWhere,
  type TreasureBookInput,
} from '../src/core/world/treasureBook';
import { TREASURES, recordSpots, treasureSpots } from '../src/core/world/treasures';
import { buildZone } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { HOUSE } from '../src/levels/house/zone';

const zone = buildZone(HOUSE);
const ORDER = MAP_PLACES.map((place) => place.id);

function input(changes: Partial<TreasureBookInput> = {}): TreasureBookInput {
  return {
    found: new Set(),
    viewed: new Set(),
    spots: new Map([
      ['photo', { place: 'house', room: 'living' }],
      ['roger', { place: 'station', room: 'station-tower' }],
      ['record-adventures', { place: 'station', room: 'station-lost' }],
    ]),
    visitedRooms: new Set(['bedroom', 'living']),
    visitedPlaces: new Set(['house']),
    placeOrder: ORDER,
    shells: [
      { place: 'house', found: true },
      { place: 'house', found: false },
      { place: 'street', found: false },
    ],
    ...changes,
  };
}

describe('les trésors du sac (D-162)', () => {
  it('chaque trésor et chaque disque a un lieu, même dans un monde étrange ; et un nom', () => {
    for (const spot of [...treasureSpots(HOUSE_STORY), ...recordSpots(HOUSE_STORY)]) {
      expect(ORDER, `${spot.id} (${spot.room})`).toContain(roomPlace(zone, spot.room));
    }
    expect(roomPlace(zone, 'school-strange')).toBe('street');
    expect(roomPlace(zone, 'station-tower')).toBe('station');
    for (const id of TREASURES) {
      expect(MEMORY_NAMES[id].length, id).toBeGreaterThan(0);
    }
    expect(MEMORY_NAMES['shape-box']).toBe("L'Educaville");
  });

  it('l’indice : la salle si Céleste y est passée, sinon le lieu connu, sinon rien', () => {
    const rooms = new Set(['living']);
    const places = new Set(['house', 'station']);
    expect(treasureWhere({ place: 'house', room: 'living' }, false, rooms, places)).toEqual({
      place: 'house',
      room: 'living',
    });
    expect(
      treasureWhere({ place: 'station', room: 'station-tower' }, false, rooms, places),
    ).toEqual({ place: 'station', room: null });
    expect(treasureWhere({ place: 'sea', room: 'sea-centre' }, false, rooms, places)).toEqual({
      place: null,
      room: null,
    });
    // Trouvé : où il était, toujours.
    expect(treasureWhere({ place: 'sea', room: 'sea-centre' }, true, rooms, places)).toEqual({
      place: 'sea',
      room: 'sea-centre',
    });
  });

  it('les compteurs, le total, les coquilles des lieux visités seulement', () => {
    const book = treasureBook(input({ found: new Set(['photo', 'slipper']) }));
    expect(book.families.map((f) => f.tally.found)).toEqual([1, 1, 0]);
    expect(book.shells).toEqual([{ place: 'house', tally: { found: 1, total: 2 } }]);
    expect(book.shellTally).toEqual({ found: 1, total: 3 });
    expect(book.total).toEqual({ found: 3, total: 16 + 3 });
  });

  it('les disques : seulement trouvés, jamais comptés', () => {
    const none = treasureBook(input());
    expect(none.records).toEqual([]);
    const one = treasureBook(input({ found: new Set(['record-adventures']) }));
    expect(one.records.map((r) => r.id)).toEqual(['record-adventures']);
    expect(one.total).toEqual(none.total);
  });

  it('« nouveau » : trouvé, pas encore regardé ; l’étincelle du sac ignore les coquilles', () => {
    const book = treasureBook(
      input({ found: new Set(['photo', 'roger']), viewed: new Set(['photo']) }),
    );
    const cells = book.families.flatMap((f) => f.cells);
    expect(cells.find((c) => c.id === 'photo')?.isNew).toBe(false);
    expect(cells.find((c) => c.id === 'roger')?.isNew).toBe(true);
    expect(book.hasNew).toBe(true);
    expect(hasNewTreasure(['photo', 'roger'], new Set(['photo']))).toBe(true);
    expect(hasNewTreasure(['photo', 'roger'], new Set(['photo', 'roger']))).toBe(false);
    expect(hasNewTreasure(['attic-ridge'], new Set())).toBe(false);
    expect(hasNewTreasure(['record-early'], new Set())).toBe(true);
  });
});
