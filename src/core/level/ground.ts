import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt, type LevelData } from './LevelData';

/**
 * Surface sous les pieds (ombre de Céleste au sol, D-71) : hauteur (px) du dessus de la première
 * tuile non vide sous `feetY`, sur la largeur [left, right[, à au plus `maxPx` ; null sinon. Une
 * tuile que les pieds ont déjà dépassée (plateforme traversée par le dessous) est ignorée.
 */
export function groundBelow(
  level: LevelData,
  left: number,
  right: number,
  feetY: number,
  maxPx: number,
): number | null {
  const col0 = Math.floor(left / T);
  const col1 = Math.floor((right - 0.001) / T);
  // Tolérance : des pieds posés peuvent être une fraction de pixel sous le dessus (interpolation).
  const from = feetY - 1;
  const row1 = Math.floor((feetY + maxPx) / T);
  for (let row = Math.max(0, Math.floor(from / T)); row <= row1; row++) {
    const top = row * T;
    if (top < from || top - feetY > maxPx) {
      continue;
    }
    for (let col = col0; col <= col1; col++) {
      if (tileAt(level, col, row) !== Tile.Empty) {
        return top;
      }
    }
  }
  return null;
}
