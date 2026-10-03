import { describe, expect, it } from 'vitest';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { atLayer, commonLayer, layerOf, otherLayer } from '../src/core/level/layers';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';

/** Une petite salle écrite à la main (lignes de 12 tuiles). */
function room(lines: string[], directives: string[]): string {
  return [...directives.map((d) => `; @${d}`), ...lines].join('\n');
}
const GAP = [
  '############',
  '#..........#',
  '#..........#',
  '#..........#',
  '#.P..##....#',
  '####....####',
  '####....####',
  '############',
];

describe('la bascule : deux couches statiques d’une salle (D-107)', () => {
  const level = parseAsciiLevel(
    'gap',
    room(GAP, [
      'shift: present 5 4 2 1',
      'shift: memory 4 5 4 1',
      'decor: lamp 5 4 2 1',
      'decor: plank 4 5 4 1',
      'cable: 1 1 3 1',
    ]),
  );
  const memory = atLayer(level, 'memory');

  it('la salle lue est le présent ; le souvenir a ses propres tuiles', () => {
    expect(layerOf(level)).toBe('present');
    expect(layerOf(memory)).toBe('memory');
    // Le bloc du présent (5-6, ligne 4) ; la planche du souvenir (4-7, ligne 5).
    expect(tileAt(level, 5, 4)).toBe(Tile.Solid);
    expect(tileAt(level, 5, 5)).toBe(Tile.Empty);
    expect(tileAt(memory, 5, 4)).toBe(Tile.Empty);
    expect(tileAt(memory, 5, 5)).toBe(Tile.Empty);
    // `.` dans la zone du souvenir : rien à dessiner, rien de solide.
    expect(tileAt(memory, 4, 5)).toBe(Tile.Empty);
    // Ce qui est commun ne change pas.
    expect(tileAt(memory, 2, 5)).toBe(Tile.Solid);
    const common = commonLayer(level);
    expect(tileAt(common, 5, 4)).toBe(Tile.Empty);
    expect(tileAt(common, 2, 5)).toBe(Tile.Solid);
  });

  it('chaque couche ne garde que son décor ; mêmes entités, même identifiant', () => {
    expect(level.decor.map((d) => d.kind)).toEqual(['lamp']);
    expect(memory.decor.map((d) => d.kind)).toEqual(['plank']);
    expect(commonLayer(level).decor).toEqual([]);
    expect(memory.id).toBe(level.id);
    expect(memory.entities).toEqual(level.entities);
    expect(level.cables.length).toBe(1);
    expect(memory.cables.length).toBe(1);
  });

  it('les variantes sont en cache, et on revient au présent', () => {
    expect(atLayer(level, 'memory')).toBe(memory);
    expect(atLayer(memory, 'present')).toBe(level);
    expect(atLayer(memory, 'memory')).toBe(memory);
    expect(otherLayer('present')).toBe('memory');
    const plain = parseAsciiLevel('plain', room(GAP, []));
    expect(atLayer(plain, 'memory')).toBe(plain);
    expect(layerOf(plain)).toBe('present');
  });

  it('un tronçon peut partir du souvenir et exiger la bascule', () => {
    const l = parseAsciiLevel(
      'l',
      room(GAP, ['shift: memory 4 5 4 1', 'leg: 2,4 9,4 easy shift memory']),
    );
    expect(l.legs[0]).toMatchObject({ needs: ['shift'], layer: 'memory', tide: 'low' });
    const p = parseAsciiLevel('p', room(GAP, ['shift: memory 4 5 4 1', 'leg: 2,4 9,4 easy']));
    expect(p.legs[0]?.layer).toBe('present');
  });

  it('erreurs explicites', () => {
    const bad =
      (directives: string[], lines = GAP) =>
      () =>
        parseAsciiLevel('bad', room(lines, directives));
    expect(bad(['shift: past 1 1 1 1'])).toThrow(/@shift attend/);
    expect(bad(['shift: memory 11 1 3 1'])).toThrow(/hors de la salle/);
    expect(bad(['shift: memory 4 5 4 1', 'shift: present 5 4 2 2'])).toThrow(/se chevauchent/);
    // Le départ, ou le sol sous lui, ne sont jamais propres à une couche.
    expect(bad(['shift: present 2 5 1 1'])).toThrow(/le départ/);
    expect(bad(['shift: memory 1 1 3 1', 'cable: 2 1 9 1'])).toThrow(/câble/);
    expect(bad(['shift: memory 4 5 4 1', 'tide: 7 6', 'sea: 1 1 10 6'])).toThrow(/@tide/);
  });
});
