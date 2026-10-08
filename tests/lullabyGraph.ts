import { layerSurfaceUnder, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import type { Layer, LevelData, TilePos } from '../src/core/level/LevelData';
import { erasedLevel, wavePatterns } from '../src/core/level/erase';

/**
 * La berceuse (D-140) dans le temps : chaque motif des étoiles est une variante statique, analysée ;
 * le temps est un graphe de (motif, surface). Dans un motif, les passages à la fenêtre voulue ; d'un
 * motif au suivant, on reste sur une surface qui reste (dans sa couche).
 */
export interface LullabyGraph {
  readonly patterns: readonly Uint8Array[];
  /** La salle dans un motif des étoiles. */
  variant(k: number): LevelData;
  analysis(k: number): LevelAnalysis;
  /** Surface où l'on se tient sur la tuile, dans un motif et une couche (-1 : aucune). */
  under(k: number, at: TilePos, layer?: Layer): number;
  /** Couche d'une surface d'un motif. */
  layerOf(k: number, s: number): Layer;
  /** La surface du motif suivant sous la même surface, si on y tient tout du long (-1 sinon). */
  after(k: number, s: number): number;
  /** Surfaces atteintes dans un motif. */
  reach(k: number, from: number): Set<number>;
  /** Le graphe du temps depuis une tuile (où l'on peut attendre n'importe quel motif). */
  timeReach(start: TilePos): Set<string>;
  /** Le graphe du temps depuis un nœud (`motif:surface`). */
  timeReachFrom(key: string): Set<string>;
}

export const nodeKey = (k: number, s: number): string => `${String(k)}:${String(s)}`;

export function lullabyGraph(
  level: LevelData,
  analyze: (variant: LevelData) => LevelAnalysis,
  minWindow: number,
): LullabyGraph {
  const erase = level.erase;
  if (!erase) {
    throw new Error(`${level.id} : pas d'étoiles`);
  }
  const patterns = wavePatterns(erase);
  const variants = patterns.map((m) => erasedLevel(level, m));
  const analyses = variants.map(analyze);
  const n = patterns.length;
  const variant = (k: number) => {
    const v = variants[k % n];
    if (!v) {
      throw new Error(`motif ${String(k)} absent`);
    }
    return v;
  };
  const analysis = (k: number) => {
    const a = analyses[k % n];
    if (!a) {
      throw new Error(`motif ${String(k)} absent`);
    }
    return a;
  };
  const under = (k: number, at: TilePos, layer: Layer = 'present') => {
    const a = analysis(k);
    return a.presentCount === undefined
      ? surfaceUnder(variant(k), a.map, at.col, at.row)
      : layerSurfaceUnder(variant(k), a, layer, at.col, at.row);
  };
  const layerOf = (k: number, s: number): Layer =>
    s >= (analysis(k).presentCount ?? Infinity) ? 'memory' : 'present';
  const after = (k: number, s: number) => {
    const surface = analysis(k).map.surfaces[s];
    if (!surface) {
      return -1;
    }
    const layer = layerOf(k, s);
    for (let col = surface.colStart; col <= surface.colEnd; col++) {
      if (under(k + 1, { col, row: surface.row - 1 }, layer) < 0) {
        return -1;
      }
    }
    return under(k + 1, { col: surface.colStart, row: surface.row - 1 }, layer);
  };
  const reach = (k: number, from: number) => {
    const a = analysis(k);
    const seen = new Set([from]);
    const queue = [from];
    for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
      for (const m of a.moves) {
        if (m.from === s && m.windowMs >= minWindow && !seen.has(m.to)) {
          seen.add(m.to);
          queue.push(m.to);
        }
      }
    }
    return seen;
  };
  const walk = (starts: readonly [number, number][]) => {
    const seen = new Set<string>();
    const queue: [number, number][] = [];
    const push = (k: number, s: number) => {
      const key = nodeKey(k, s);
      if (s >= 0 && !seen.has(key)) {
        seen.add(key);
        queue.push([k, s]);
      }
    };
    for (const [k, s] of starts) {
      push(k, s);
    }
    for (let node = queue.shift(); node !== undefined; node = queue.shift()) {
      const [k, s] = node;
      for (const t of reach(k, s)) {
        push(k, t);
      }
      push((k + 1) % n, after(k, s));
    }
    return seen;
  };
  return {
    patterns,
    variant,
    analysis,
    under,
    layerOf,
    after,
    reach,
    timeReach: (start) => walk(patterns.map((_, k) => [k, under(k, start)] as [number, number])),
    timeReachFrom: (key) => {
      const [k = 0, s = 0] = key.split(':').map(Number);
      return walk([[k, s]]);
    },
  };
}
