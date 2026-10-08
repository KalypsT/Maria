import { describe, expect, it } from 'vitest';
import { buildZone } from '../src/core/world/zone';
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
    // Le jardin est sur la page « Ma maison » ; une salle hors de la carte n'a pas de lieu.
    expect(shells.find((s) => s.room === 'garden-treehouse')?.place).toBe('house');
    expect(shells.find((s) => s.room === 'street')?.place).toBe('street');
    expect(shells.find((s) => s.room === 'shadows')?.place).toBeNull();
  });

  it('trouvées et en tout, par lieu', () => {
    const total = shells.filter((s) => s.place === 'station').length;
    expect(shellTally(shells, 'station', [])).toEqual({ found: 0, total });
    const found = ['tracks-gantry', 'station-kiosk', 'attic-ridge', 'inconnue'];
    expect(shellTally(shells, 'station', found)).toEqual({ found: 2, total });
    expect(shellTally(shells, 'nowhere', found)).toEqual({ found: 0, total: 0 });
  });
});
