import { TILE_SIZE } from '../../config/display';
import { Tile, tileAt, type LevelData } from '../level/LevelData';

/** Surface praticable : suite continue de tuiles d'une même ligne sur lesquelles Céleste tient debout. */
export interface Surface {
  readonly id: number;
  /** Ligne des tuiles portantes (le dessus est à `row * TILE_SIZE`). */
  readonly row: number;
  readonly colStart: number;
  /** Dernière colonne comprise. */
  readonly colEnd: number;
  /** Au moins une tuile traversable (Bas + Saut possible). */
  readonly hasOneWay: boolean;
}

export interface SurfaceMap {
  readonly surfaces: readonly Surface[];
  /** Identifiant de surface par tuile portante (index row * width + col), -1 sinon. */
  readonly idByTile: Int32Array;
}

/** Tuile portante avec assez de place au-dessus pour une hitbox de `playerHeight` px. */
function isStandable(level: LevelData, col: number, row: number, headroomTiles: number): boolean {
  const tile = tileAt(level, col, row);
  if (tile !== Tile.Solid && tile !== Tile.OneWay) {
    return false;
  }
  for (let above = 1; above <= headroomTiles; above++) {
    const tileAbove = row - above < 0 ? Tile.Solid : tileAt(level, col, row - above);
    if (tileAbove === Tile.Solid || tileAbove === Tile.Hazard || tileAbove === Tile.Deadly) {
      return false;
    }
  }
  return true;
}

export function findSurfaces(level: LevelData, playerHeight: number): SurfaceMap {
  const headroomTiles = Math.ceil(playerHeight / TILE_SIZE);
  const idByTile = new Int32Array(level.width * level.height).fill(-1);
  const surfaces: Surface[] = [];
  for (let row = 0; row < level.height; row++) {
    let col = 0;
    while (col < level.width) {
      if (!isStandable(level, col, row, headroomTiles)) {
        col++;
        continue;
      }
      const id = surfaces.length;
      const colStart = col;
      let hasOneWay = false;
      while (col < level.width && isStandable(level, col, row, headroomTiles)) {
        hasOneWay ||= tileAt(level, col, row) === Tile.OneWay;
        idByTile[row * level.width + col] = id;
        col++;
      }
      surfaces.push({ id, row, colStart, colEnd: col - 1, hasOneWay });
    }
  }
  return { surfaces, idByTile };
}

/** Surface sous une tuile de marqueur (départ `P`, arrivée `G`) : la tuile juste en dessous. */
export function surfaceUnder(level: LevelData, map: SurfaceMap, col: number, row: number): number {
  if (row + 1 >= level.height) {
    return -1;
  }
  return map.idByTile[(row + 1) * level.width + col] ?? -1;
}
