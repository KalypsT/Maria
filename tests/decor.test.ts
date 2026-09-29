import { describe, expect, it } from 'vitest';
import { decorProblems } from '../src/core/level/decor';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

describe('habillage des salles (D-28)', () => {
  it('signale les meubles sans habillage et les éléments inconnus', () => {
    const room = (decor: string) => parseAsciiLevel('t', `${decor}\n#####\n#Pbt#\n#####`);
    expect(decorProblems(room(''))).toEqual([]);
    expect(decorProblems(room('; @decor: bed 2 1 1 1'))).toEqual([
      'tuile de meuble (colonne 4, ligne 2) sans habillage',
    ]);
    expect(decorProblems(room('; @decor: bed 2 1 2 1\n; @decor: sofa 1 1 1 1'))).toEqual([
      'élément inconnu « sofa »',
    ]);
  });

  it('les salles habillées de la maison sont cohérentes avec leur collision', () => {
    const zone = buildZone(HOUSE);
    expect(zone.rooms.get('bedroom')?.decor.length).toBeGreaterThan(0);
    for (const [id, level] of zone.rooms) {
      expect(decorProblems(level), id).toEqual([]);
    }
  });
});
