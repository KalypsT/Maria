import { DEFAULT_COMBAT } from '../src/config/combat';
import type { LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { EntityType, type LevelData, type TilePos } from '../src/core/level/LevelData';

/** Chemin le plus rapide (durées des passages, D-67) dont chaque passage a au moins `minWindow`. */
export function fastest(a: LevelAnalysis, from: number, to: number, minWindow: number): number {
  const best = new Map<number, number>([[from, 0]]);
  const done = new Set<number>();
  for (;;) {
    let u = -1;
    for (const [n, t] of best) {
      if (!done.has(n) && (u < 0 || t < (best.get(u) ?? Infinity))) {
        u = n;
      }
    }
    if (u < 0 || u === to) {
      break;
    }
    done.add(u);
    for (const m of a.moves) {
      if (m.from === u && m.windowMs >= minWindow) {
        const t = (best.get(u) ?? Infinity) + m.durationMs;
        if (t < (best.get(m.to) ?? Infinity)) {
          best.set(m.to, t);
        }
      }
    }
  }
  return best.get(to) ?? Infinity;
}

/**
 * Rythme d'une poursuite (D-67) : pour chaque phase, le temps du chemin le plus rapide de son
 * départ (le départ de la salle, puis les veilleuses de bas en haut) au départ suivant (l'arrivée
 * `end` pour la dernière), et le temps qu'il faut au poursuivant pour y monter (départ sous
 * Céleste, attente, vitesse de la phase ; les crocs-en-jambe ne sont pas comptés).
 */
export function chasePace(
  level: LevelData,
  a: LevelAnalysis,
  start: TilePos,
  end: TilePos,
  minWindow: number,
): { time: number; front: number }[] {
  const chase = level.chase;
  if (!chase) {
    throw new Error(`${level.id} : pas de poursuite`);
  }
  const P = DEFAULT_COMBAT;
  const lamps = level.entities
    .filter((e) => e.type === EntityType.Checkpoint && e.row < start.row)
    .sort((x, y) => y.row - x.row);
  const stops: TilePos[] = [start, ...lamps, end];
  return chase.phases.map((phase, i) => {
    const from = stops[i] ?? start;
    const to = stops[i + 1] ?? end;
    const time = fastest(
      a,
      surfaceUnder(level, a.map, from.col, from.row),
      surfaceUnder(level, a.map, to.col, to.row),
      minWindow,
    );
    const front =
      P.chaseStartDelayMs +
      ((P.chaseRestartGapTiles + from.row - to.row) / (phase.speed * P.chaseSpeedScale)) * 1000;
    return { time, front };
  });
}
