import { TILE_SIZE as T } from '../../config/display';
import {
  DECOR_SURFACE,
  DEFAULT_GROUND,
  ROOM_GROUND,
  SURFACE_PROBE_PX,
  Surface,
} from '../../config/surfaces';
import type { Box } from '../physics/gridCollision';
import { Material, Tile, type LevelData } from './LevelData';

/** Sol de la salle (D-125), là où rien d'autre ne dit sa matière. */
export function roomGround(levelId: string): Surface {
  return ROOM_GROUND[levelId] ?? DEFAULT_GROUND;
}

/**
 * Matière de la tuile (col, row), pleine ou traversable : le dernier meuble déclaré qui la couvre
 * et dont la matière est connue, sinon le matériau de la tuile, sinon le sol de la salle. Une
 * planche traversable sans matériau est en bois. Pur, sans allocation.
 */
export function surfaceAt(level: LevelData, col: number, row: number, ground: Surface): Surface {
  const decor = level.decor;
  for (let i = decor.length - 1; i >= 0; i--) {
    const d = decor[i];
    if (d && col >= d.col && col < d.col + d.width && row >= d.row && row < d.row + d.height) {
      const surface = DECOR_SURFACE[d.kind];
      if (surface) {
        return surface;
      }
    }
  }
  const index = row * level.width + col;
  switch (level.materials[index]) {
    case Material.Wood:
      return Surface.Wood;
    case Material.Fabric:
      return Surface.Fabric;
    case Material.Leaf:
      return Surface.Leaves;
    default:
      return level.tiles[index] === Tile.OneWay ? Surface.Wood : ground;
  }
}

function standable(level: LevelData, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= level.width || row >= level.height) {
    return false;
  }
  const tile = level.tiles[row * level.width + col];
  return tile === Tile.Solid || tile === Tile.OneWay;
}

/**
 * Matière sous les pieds de la hitbox : la tuile sous le milieu des pieds, sinon sous l'un des deux
 * bords (Céleste au bord d'un vide), sinon le sol de la salle.
 */
export function surfaceUnder(level: LevelData, box: Readonly<Box>, ground: Surface): Surface {
  const row = Math.floor((box.y + box.height + SURFACE_PROBE_PX) / T);
  const middle = Math.floor((box.x + box.width / 2) / T);
  if (standable(level, middle, row)) {
    return surfaceAt(level, middle, row, ground);
  }
  const left = Math.floor(box.x / T);
  if (standable(level, left, row)) {
    return surfaceAt(level, left, row, ground);
  }
  const right = Math.floor((box.x + box.width - 1) / T);
  if (standable(level, right, row)) {
    return surfaceAt(level, right, row, ground);
  }
  return ground;
}
