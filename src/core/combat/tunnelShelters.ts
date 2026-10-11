import { TILE_SIZE as T } from '../../config/display';
import { TUNNEL_CLEAR_PX } from '../../config/combat';
import { Tile, tileAt, type LevelData } from '../level/LevelData';

/** Un abri du toit (D-86, D-164) : un sol sous la ligne du toit, d'une colonne à l'autre. */
export interface TunnelShelter {
  /** Première et dernière colonne du sol. */
  readonly col0: number;
  readonly col1: number;
  /** Ligne du sol (la tuile sur laquelle on se tient). */
  readonly row: number;
}

/**
 * Les abris d'un toit à tunnels (D-164, retour d'essai : les montrer pendant l'annonce) : les sols
 * plus bas que la ligne du toit (`; @tunnel:`) où Céleste debout (`standHeight` px) n'est pas
 * balayée par le tunnel (la même règle que `CombatWorld`) : les creux du toit, le soufflet entre
 * deux voitures. Pur.
 */
export function tunnelShelters(
  level: LevelData,
  tunnelRow: number,
  standHeight: number,
): TunnelShelter[] {
  const shelters: TunnelShelter[] = [];
  if (tunnelRow < 0) {
    return shelters;
  }
  const sweep = tunnelRow * T - TUNNEL_CLEAR_PX;
  for (let row = tunnelRow + 1; row < level.height; row++) {
    if (row * T - standHeight < sweep) {
      continue;
    }
    let start = -1;
    for (let col = 0; col <= level.width; col++) {
      const tile = tileAt(level, col, row);
      const floor =
        col < level.width &&
        (tile === Tile.Solid || tile === Tile.OneWay) &&
        tileAt(level, col, row - 1) === Tile.Empty &&
        tileAt(level, col, row - 2) === Tile.Empty;
      if (floor && start < 0) {
        start = col;
      } else if (!floor && start >= 0) {
        shelters.push({ col0: start, col1: col - 1, row });
        start = -1;
      }
    }
  }
  return shelters;
}
