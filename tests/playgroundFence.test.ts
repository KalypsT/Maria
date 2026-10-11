import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { ZONES } from '../src/levels';

describe('le trou du grillage de l’aire de jeux se remarque (D-158)', () => {
  it('le pigeon du toit de la tour s’envole tout droit, à hauteur du trou', () => {
    const room = ZONES[0]?.rooms.get('playground');
    const fence = room?.decor.find((d) => d.kind === 'schoolfence');
    const pigeon = room?.decor.find((d) => d.kind === 'holepigeon');
    if (!room || !fence || !pigeon) {
      throw new Error('aire de jeux, grillage ou pigeon absent');
    }
    // Il vole à l'horizontale, son corps à 8 px au-dessus de ses pattes : rien de plein entre le
    // toit de la tour et l'autre côté du grillage.
    const flightRow = Math.floor(((pigeon.row + pigeon.height) * T - 8) / T);
    for (let col = pigeon.col + pigeon.width; col < fence.col + fence.width; col++) {
      expect(tileAt(room, col, flightRow), `colonne ${String(col)}`).not.toBe(Tile.Solid);
    }
  });
});
