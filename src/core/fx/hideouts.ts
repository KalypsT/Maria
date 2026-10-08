import { TILE_SIZE as T } from '../../config/display';
import type { LevelData, LevelHide } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';

/**
 * Les cachettes (D-148) : un décor au premier plan (un drap, une glycine…) qui cache une niche et
 * s'efface quand Céleste passe derrière, pour qu'on la voie toujours (pilier 1). Logique pure.
 */

/** Opacité visée d'une cachette : `faded` si Céleste la touche (à `marginPx` près), 1 sinon. */
export function hideTarget(hide: LevelHide, player: Box, marginPx: number, faded: number): number {
  const x0 = hide.col * T - marginPx;
  const y0 = hide.row * T - marginPx;
  const x1 = (hide.col + hide.width) * T + marginPx;
  const y1 = (hide.row + hide.height) * T + marginPx;
  const touches =
    player.x < x1 && player.x + player.width > x0 && player.y < y1 && player.y + player.height > y0;
  return touches ? faded : 1;
}

/** Rapproche une opacité de sa cible, avec une constante de temps (ms). */
export function approachAlpha(
  current: number,
  target: number,
  dtMs: number,
  timeMs: number,
): number {
  if (timeMs <= 0) {
    return target;
  }
  return target + (current - target) * Math.exp(-dtMs / timeMs);
}

/** Index de la cachette qui couvre une tuile (-1 : aucune). */
export function hideAt(level: LevelData, col: number, row: number): number {
  const hides = level.hides ?? [];
  for (let i = 0; i < hides.length; i++) {
    const h = hides[i];
    if (h && col >= h.col && col < h.col + h.width && row >= h.row && row < h.row + h.height) {
      return i;
    }
  }
  return -1;
}
