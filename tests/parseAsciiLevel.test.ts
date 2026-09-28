import { describe, expect, it } from 'vitest';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import testRoom from '../src/levels/test-room.txt?raw';

describe('parseAsciiLevel', () => {
  it('lit la grille, le départ et ignore commentaires et lignes vides', () => {
    const level = parseAsciiLevel('t', '\n; commentaire\n#####\r\n#.P=#\n#####\n\n');
    expect(level.width).toBe(5);
    expect(level.height).toBe(3);
    expect(level.spawn).toEqual({ col: 2, row: 1 });
    expect(tileAt(level, 0, 0)).toBe(Tile.Solid);
    expect(tileAt(level, 1, 1)).toBe(Tile.Empty);
    expect(tileAt(level, 2, 1)).toBe(Tile.Empty);
    expect(tileAt(level, 3, 1)).toBe(Tile.OneWay);
  });

  it('considère l’extérieur de la grille comme plein', () => {
    const level = parseAsciiLevel('t', 'P.');
    expect(tileAt(level, -1, 0)).toBe(Tile.Solid);
    expect(tileAt(level, 2, 0)).toBe(Tile.Solid);
    expect(tileAt(level, 0, 1)).toBe(Tile.Solid);
  });

  it('signale une ligne de mauvaise largeur avec son numéro', () => {
    expect(() => parseAsciiLevel('t', '###\n#P\n###')).toThrow(/ligne 2/);
  });

  it('signale un caractère inconnu', () => {
    expect(() => parseAsciiLevel('t', '#P?')).toThrow(/colonne 3/);
  });

  it('exige exactement un point de départ', () => {
    expect(() => parseAsciiLevel('t', '###')).toThrow(/manquant/);
    expect(() => parseAsciiLevel('t', 'PP')).toThrow(/plusieurs/);
    expect(() => parseAsciiLevel('t', '')).toThrow(/vide/);
  });

  it('lit l’arrivée et les métadonnées', () => {
    const level = parseAsciiLevel(
      't',
      '; @name: Essai\n;@difficulty :  medium\n; @ sans clé\n#####\n#P.G#\n#####',
    );
    expect(level.goal).toEqual({ col: 3, row: 1 });
    expect(tileAt(level, 3, 1)).toBe(Tile.Empty);
    expect(level.meta).toEqual({ name: 'Essai', difficulty: 'medium' });
    expect(parseAsciiLevel('t', 'P').goal).toBeNull();
    expect(() => parseAsciiLevel('t', 'PGG')).toThrow(/plusieurs arrivées/);
  });

  it('lit les patrouilleurs (tuile vide)', () => {
    const level = parseAsciiLevel('t', '#####\n#Pe.#\n#####');
    expect(level.entities).toEqual([{ type: 'patroller', col: 2, row: 1 }]);
    expect(tileAt(level, 2, 1)).toBe(Tile.Empty);
    expect(parseAsciiLevel('t', 'P').entities).toEqual([]);
  });

  it('charge la salle de test de la Phase 1', () => {
    const level = parseAsciiLevel('test-room', testRoom);
    expect(level.width).toBe(40);
    expect(level.height).toBe(22);
    expect(tileAt(level, level.spawn.col, level.spawn.row + 1)).toBe(Tile.Solid);
  });
});
