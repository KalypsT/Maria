import { describe, expect, it } from 'vitest';
import { buildZone, isStrangeRoom } from '../src/core/world/zone';
import { shellTally, zoneShells } from '../src/core/world/shells';
import { HOUSE } from '../src/levels/house/zone';

describe('les coquilles (D-148)', () => {
  const shells = zoneShells(buildZone(HOUSE));

  it('chaque coquille de la zone, avec son lieu : la page du cahier de sa salle', () => {
    expect(shells.length).toBeGreaterThan(0);
    expect(shells.find((s) => s.name === 'attic-ridge')).toEqual({
      name: 'attic-ridge',
      room: 'attic',
      col: 6,
      row: 5,
      place: 'house',
    });
    // Le jardin est sur la page « Ma maison ».
    expect(shells.find((s) => s.room === 'garden-treehouse')?.place).toBe('house');
    expect(shells.find((s) => s.room === 'street')?.place).toBe('street');
  });

  it('aucune dans un lieu sans retour : monde étrange, maison de la nounou, dernier niveau', () => {
    const zone = buildZone(HOUSE);
    const oneWay = shells.filter((s) => {
      const level = zone.rooms.get(s.room);
      return (
        !level ||
        isStrangeRoom(level) ||
        s.room.startsWith('nanny-') ||
        s.room.startsWith('finale-') ||
        s.place === null
      );
    });
    expect(oneWay.map((s) => s.name)).toEqual([]);
  });

  it('trouvées et en tout, par lieu', () => {
    const total = shells.filter((s) => s.place === 'station').length;
    expect(shellTally(shells, 'station', [])).toEqual({ found: 0, total });
    const found = ['tracks-gantry', 'station-kiosk', 'attic-ridge', 'inconnue'];
    expect(shellTally(shells, 'station', found)).toEqual({ found: 2, total });
    expect(shellTally(shells, 'nowhere', found)).toEqual({ found: 0, total: 0 });
  });
});
