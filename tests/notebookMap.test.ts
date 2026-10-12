import { describe, expect, it } from 'vitest';
import { MAP_PLACES } from '../src/config/places';
import { notebookPlaces } from '../src/core/world/backpack';
import { buildMapModel, type MapProgress } from '../src/core/world/mapModel';
import { TREASURES, treasureSpots } from '../src/core/world/treasures';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';
import { HOUSE_STORY } from '../src/levels/house/story';

const zone = buildZone(HOUSE);
const ORDER = MAP_PLACES.map((place) => place.id);

function progress(changes: Partial<MapProgress> = {}): MapProgress {
  return {
    visited: ['bedroom'],
    seen: new Set(),
    activatedCheckpoints: [],
    checkpoint: { levelId: 'bedroom', checkpointId: null },
    collectibles: [],
    celeste: null,
    ...changes,
  };
}

describe('la carte du sac (D-160)', () => {
  it('chaque page de carte est un lieu de la rangée, dans l’ordre du voyage', () => {
    const pages = new Set(Object.values(zone.map).map((box) => box.page ?? zone.id));
    expect([...pages].sort()).toEqual([...ORDER].sort());
  });

  it('les lieux visités, puis un seul « ? » pour le prochain ; le point rose où est Céleste', () => {
    expect(notebookPlaces(ORDER, new Set(['house']), 'house')).toEqual([
      { id: 'house', state: 'visited', here: true },
      { id: 'street', state: 'next', here: false },
    ]);
    expect(
      notebookPlaces(ORDER, new Set(['house', 'street', 'station']), 'street').map((p) => p.id),
    ).toEqual(['house', 'street', 'station', 'train']);
    // Tout visité : plus de « ? ».
    const all = notebookPlaces(ORDER, new Set(ORDER), null);
    expect(all.every((place) => place.state === 'visited')).toBe(true);
    expect(all.some((place) => place.here)).toBe(false);
  });

  it('chaque trésor a sa place dans une salle de la carte ; les disques restent secrets', () => {
    const spots = treasureSpots(HOUSE_STORY);
    for (const id of TREASURES) {
      expect(
        spots.some((spot) => spot.id === id),
        id,
      ).toBe(true);
    }
    expect(spots.some((spot) => spot.id.startsWith('record-'))).toBe(false);
    for (const spot of spots) {
      expect(zone.rooms.has(spot.room), spot.room).toBe(true);
    }
  });

  it('un trésor vu mais pas pris est en pointillés dans sa salle visitée', () => {
    const spots = treasureSpots(HOUSE_STORY);
    const photo = spots.find((spot) => spot.id === 'photo');
    if (!photo) {
      throw new Error('photo absente');
    }
    const at = (seen: string[], taken: string[], visited = [photo.room]) =>
      buildMapModel(zone, progress({ visited, treasures: { spots, seen, taken } })).rooms.find(
        (room) => room.id === photo.room,
      )?.seenTreasures.length ?? 0;
    expect(at([], [])).toBe(0);
    expect(at(['photo'], [])).toBe(1);
    expect(at(['photo'], ['photo'])).toBe(0);
  });
});
