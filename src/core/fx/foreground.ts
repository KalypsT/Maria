import { TILE_SIZE as T } from '../../config/display';
import { EntityType, Tile, tileAt, type LevelData } from '../level/LevelData';

/**
 * Avant-plan (D-72) : silhouettes posées au bas de l'écran, qui défilent plus vite que la salle.
 * Logique pure : placement des pièces et zones où elles doivent s'effacer (jamais de danger ni
 * d'objet de jeu caché).
 */

export interface ForegroundPiece {
  /** Position dans le plan (px) : à l'écran, `x - vue × facteur`. */
  readonly x: number;
  readonly width: number;
  /** Graine de la forme (déterministe). */
  readonly seed: number;
}

/** Intervalle horizontal du monde (px), [x0, x1[. */
export type Span = readonly [number, number];

function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Pièces du plan pour des vues dont le bord gauche va de `minView` à `maxView` (px) et larges
 * d'au plus `viewWidth` : tout l'intervalle visible est couvert, avec des trous irréguliers.
 */
export function foregroundPieces(
  minView: number,
  maxView: number,
  viewWidth: number,
  factor: number,
  spacing: { min: number; max: number; width: [number, number] },
  seed: number,
): ForegroundPiece[] {
  const pieces: ForegroundPiece[] = [];
  const start = minView * factor - spacing.max;
  const end = maxView * factor + viewWidth + spacing.max;
  let x = start + hash(seed) * spacing.max;
  let k = 0;
  while (x < end) {
    const h = hash(seed + k * 7.31);
    const width = spacing.width[0] + h * (spacing.width[1] - spacing.width[0]);
    pieces.push({ x, width, seed: seed + k });
    x += width + spacing.min + hash(seed + k * 3.17 + 0.5) * (spacing.max - spacing.min);
    k++;
  }
  return pieces;
}

/**
 * Zones au ras du sol (ligne `floorRow`) que l'avant-plan ne doit pas cacher : dangers posés sur
 * le sol ou dedans, objets de jeu et ennemis de départ au sol, sorties au niveau du sol.
 */
export function protectedSpans(level: LevelData, floorRow: number, marginPx: number): Span[] {
  const cols = new Set<number>();
  for (let col = 0; col < level.width; col++) {
    for (const row of [floorRow - 1, floorRow]) {
      const tile = tileAt(level, col, row);
      if (tile === Tile.Hazard || tile === Tile.Thorns) {
        cols.add(col);
      }
    }
  }
  for (const e of level.entities) {
    if (e.row >= floorRow - 2 && e.type !== EntityType.Spider) {
      cols.add(e.col);
    }
  }
  for (const exit of level.exits) {
    if (exit.rowMax >= floorRow - 1) {
      cols.add(exit.col);
    }
  }
  const spans: [number, number][] = [];
  for (const col of [...cols].sort((a, b) => a - b)) {
    const x0 = col * T - marginPx;
    const x1 = (col + 1) * T + marginPx;
    const last = spans.at(-1);
    if (last && x0 <= last[1]) {
      last[1] = x1;
    } else {
      spans.push([x0, x1]);
    }
  }
  return spans;
}

/** L'intervalle [x0, x1[ touche-t-il une des zones (triées) ? */
export function overlapsSpans(spans: readonly Span[], x0: number, x1: number): boolean {
  for (const [a, b] of spans) {
    if (a >= x1) {
      return false;
    }
    if (b > x0) {
      return true;
    }
  }
  return false;
}
