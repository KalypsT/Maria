import { describe, expect, it } from 'vitest';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { HAZARD_INSET_PX } from '../src/config/world';
import { MoveKind, analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { findSurfaces } from '../src/core/analysis/surfaces';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { touchesHazard, type Box } from '../src/core/physics/gridCollision';

function level(rows: string[]) {
  return parseAsciiLevel('danger', rows.join('\n'));
}

describe('dangers et checkpoints (D-21)', () => {
  it('lit les dangers et les checkpoints', () => {
    const l = level(['######', '#P.C.#', '#.^^.#', '######']);
    expect(tileAt(l, 2, 2)).toBe(Tile.Hazard);
    expect(tileAt(l, 3, 1)).toBe(Tile.Empty);
    expect(l.entities).toEqual([{ type: EntityType.Checkpoint, col: 3, row: 1 }]);
  });

  it('touche un danger avec une tolérance de quelques pixels', () => {
    const l = level(['#####', '#P..#', '#.^.#', '#####']);
    const box: Box = {
      x: 32,
      y: 32 - PLAYER_HITBOX.height,
      width: 12,
      height: PLAYER_HITBOX.height,
    };
    // Posée juste au-dessus : pas de contact.
    expect(touchesHazard(l, box)).toBe(false);
    // Enfoncée de moins que la tolérance : toujours pas.
    box.y += HAZARD_INSET_PX - 0.5;
    expect(touchesHazard(l, box)).toBe(false);
    box.y += 1;
    expect(touchesHazard(l, box)).toBe(true);
    // Frôlement latéral en deçà de la tolérance.
    box.y = 34;
    box.x = 48 - HAZARD_INSET_PX + 0.5;
    box.height = 10;
    expect(touchesHazard(l, box)).toBe(false);
  });

  it('ne compte pas comme surface une tuile sous un danger ni un danger lui-même', () => {
    const l = level(['########', '#......#', '#..^...#', '#......#', '#P.^^..#', '########']);
    const surfaces = findSurfaces(l, PLAYER_HITBOX.height).surfaces;
    const floor = surfaces.filter((s) => s.row === 5);
    // Le sol sous les dangers (colonnes 3-4) est coupé ; la colonne 3 est aussi sous le danger du haut.
    expect(floor.map((s) => [s.colStart, s.colEnd])).toEqual([
      [1, 2],
      [5, 6],
    ]);
  });

  it('franchit un bassin de dangers en sautant, jamais en tombant dedans', () => {
    const analysis = analyzeLevel(
      level([
        '##################',
        '#................#',
        '#................#',
        '#................#',
        '#................#',
        '#P............G..#',
        '#######^^^########',
        '##################',
      ]),
      DEFAULT_MOVEMENT,
    );
    expect(analysis.path?.map((m) => m.kind)).toEqual([MoveKind.RunningJump]);
    // Aucun passage ne mène dans le bassin.
    expect(analysis.moves.every((m) => m.to >= 0)).toBe(true);
  });

  it('refuse un chemin qui oblige à toucher un danger', () => {
    const analysis = analyzeLevel(
      level([
        '##############',
        '#............#',
        '#....^^^^....#',
        '#....^^^^....#',
        '#P...^^^^..G.#',
        '##############',
      ]),
      DEFAULT_MOVEMENT,
    );
    expect(analysis.path).toBeNull();
  });
});
