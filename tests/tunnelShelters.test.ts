import { describe, expect, it } from 'vitest';
import { GROWTH_PHASES } from '../src/config/growth';
import { tunnelShelters } from '../src/core/combat/tunnelShelters';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

/** Les abris du toit du train (D-164) : ceux que l'annonce du tunnel éclaire. */

const roof = buildZone(HOUSE).rooms.get('train-roof');

describe('les abris du toit du train', () => {
  it('les trois creux et le soufflet, à toutes les tailles de Céleste', () => {
    if (!roof) {
      throw new Error('toit absent');
    }
    const row = Number(roof.meta.tunnel);
    for (const phase of GROWTH_PHASES) {
      const shelters = tunnelShelters(roof, row, phase.hitbox.height);
      expect(shelters.map((s) => [s.col0, s.col1])).toEqual([
        [20, 22],
        [41, 45],
        [62, 64],
        [80, 82],
      ]);
    }
  });

  it('sans tunnel, aucun abri', () => {
    if (!roof) {
      throw new Error('toit absent');
    }
    expect(tunnelShelters(roof, -1, 28)).toEqual([]);
  });
});
