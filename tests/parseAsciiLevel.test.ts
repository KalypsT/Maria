import { describe, expect, it } from 'vitest';
import { EntityType, Material, Tile, tileAt } from '../src/core/level/LevelData';
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

  it('lit les matériaux et les sorties latérales (D-25)', () => {
    const level = parseAsciiLevel(
      't',
      ['#######', '#.....#', '1.....2', '1.tbb.2', '#P-b..#', '#######'].join('\n'),
    );
    expect(level.exits).toEqual([
      { id: 1, side: 'left', col: 0, rowMin: 2, rowMax: 3 },
      { id: 2, side: 'right', col: 6, rowMin: 2, rowMax: 3 },
    ]);
    expect(tileAt(level, 0, 2)).toBe(Tile.Empty);
    expect(tileAt(level, 2, 3)).toBe(Tile.Solid);
    expect(tileAt(level, 2, 4)).toBe(Tile.OneWay);
    expect(level.materials[3 * level.width + 2]).toBe(Material.Fabric);
    expect(level.materials[3 * level.width + 3]).toBe(Material.Wood);
    expect(level.materials[4 * level.width + 2]).toBe(Material.Wood);
    expect(level.materials[0]).toBe(Material.Default);
  });

  it('refuse une sortie hors d’un mur latéral ou trop basse', () => {
    expect(() => parseAsciiLevel('t', '#####\n#P1.#\n#.1.#\n#####')).toThrow(/mur gauche ou droit/);
    expect(() => parseAsciiLevel('t', '#####\n1P..#\n#...#\n#####')).toThrow(/au moins 2 tuiles/);
    expect(() => parseAsciiLevel('t', '#####\n1P..#\n#...#\n1...#\n#####')).toThrow(/continue/);
  });

  it('lit l’objet de capacité et sa capacité (D-26)', () => {
    const level = parseAsciiLevel('t', '; @ability: climb\n#####\n#PA.#\n#####');
    expect(level.entities).toEqual([{ type: EntityType.Ability, col: 2, row: 1 }]);
    expect(level.meta.ability).toBe('climb');
    expect(() => parseAsciiLevel('t', '#####\n#PA.#\n#####')).toThrow(/@ability/);
    expect(() => parseAsciiLevel('t', '; @ability: climb\n#####\n#P..#\n#####')).toThrow(
      /@ability/,
    );
    expect(() => parseAsciiLevel('t', '; @ability: climb\n#####\n#PAA#\n#####')).toThrow(
      /@ability/,
    );
  });

  it('charge la salle de test de la Phase 1', () => {
    const level = parseAsciiLevel('test-room', testRoom);
    expect(level.width).toBe(40);
    expect(level.height).toBe(22);
    expect(tileAt(level, level.spawn.col, level.spawn.row + 1)).toBe(Tile.Solid);
  });
});
