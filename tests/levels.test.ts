import { describe, expect, it } from 'vitest';
import { LEVELS, ZONES, roomName, startRoom, zoneRoom } from '../src/levels';

describe('registre des salles (D-25)', () => {
  it('identifiants uniques entre zones et parcours (clés de sauvegarde)', () => {
    const ids = [...ZONES.flatMap((zone) => [...zone.rooms.keys()]), ...LEVELS.map((l) => l.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('une nouvelle partie commence dans la chambre de Céleste', () => {
    expect(startRoom().level.id).toBe('bedroom');
    expect(roomName('bedroom')).toBe('Chambre');
  });

  it('les parcours d’essai sont hors zone', () => {
    expect(zoneRoom('premiers-pas')).toBeNull();
    expect(roomName('premiers-pas')).toBe('1. Premiers pas');
    expect(roomName('inconnue')).toBeNull();
  });
});
