import { DEFAULT_COMBAT, type CombatParams } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { MoveKind, type LevelAnalysis, type Move } from '../src/core/analysis/analyzeLevel';
import { Chase } from '../src/core/boss/Chase';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import type { LevelData, TilePos } from '../src/core/level/LevelData';

/**
 * Chemin le plus rapide (durées des passages, D-67) dont chaque passage a au moins `minWindow` :
 * les passages, dans l'ordre ; null si impossible.
 */
export function fastestPath(
  a: LevelAnalysis,
  from: number,
  to: number,
  minWindow: number,
): Move[] | null {
  const best = new Map<number, number>([[from, 0]]);
  const via = new Map<number, Move>();
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
          via.set(m.to, m);
        }
      }
    }
  }
  if (!best.has(to)) {
    return null;
  }
  const path: Move[] = [];
  for (let n = to; n !== from;) {
    const m = via.get(n);
    if (!m) {
      return null;
    }
    path.unshift(m);
    n = m.from;
  }
  return path;
}

/** Durée du chemin le plus rapide (ms), `Infinity` si impossible. */
export function fastest(a: LevelAnalysis, from: number, to: number, minWindow: number): number {
  const path = fastestPath(a, from, to, minWindow);
  return path ? path.reduce((t, m) => t + m.durationMs, 0) : Infinity;
}

/** Passages lancés en courant depuis le bord arrière de la surface (`runningJumps`). */
const RUN_KINDS = new Set<string>([
  MoveKind.RunningJump,
  MoveKind.WalkOff,
  MoveKind.Slide,
  MoveKind.SlideJump,
]);

/**
 * Poursuite rejouée (D-70, D-87) : le vrai `Chase` mené par une Céleste qui suit le chemin le plus
 * rapide de `start` à `end`, chaque passage `slow` fois plus lent (1 : joueur parfait). Ses pieds vont
 * en ligne droite d'une surface à l'autre pendant le passage (prudent : un saut monte plus haut).
 * Vers le haut, d'un centre de surface à l'autre ; à l'horizontale, de là où elle est jusqu'à son
 * point d'atterrissage (`toX`, sinon le centre de la surface) : la course sur un plancher compte.
 * Retourne le nombre de contacts et la plus petite avance sur le front (tuiles).
 */
export function chaseRun(
  level: LevelData,
  a: LevelAnalysis,
  start: TilePos,
  end: TilePos,
  minWindow: number,
  slow = 1,
  params: Readonly<CombatParams> = DEFAULT_COMBAT,
  hitbox: { readonly width: number; readonly height: number } = { width: 12, height: 26 },
  /** Vitesse de course (px/s) : à l'horizontale, la course déjà faite sur un plancher est retirée. */
  runSpeed = 0,
): { contacts: number; margin: number; done: boolean; timeMs: number } {
  const chase = level.chase;
  if (!chase) {
    throw new Error(`${level.id} : pas de poursuite`);
  }
  const path = fastestPath(
    a,
    surfaceUnder(level, a.map, start.col, start.row),
    surfaceUnder(level, a.map, end.col, end.row),
    minWindow,
  );
  if (!path) {
    throw new Error(`${level.id} : aucun chemin`);
  }
  const HZ = 120;
  const run = new Chase(chase, params, HZ);
  const box = { x: 0, y: 0, width: hitbox.width, height: hitbox.height };
  const horizontal = chase.dir !== 'up';
  let contacts = 0;
  let margin = Infinity;
  /** Bord gauche de Céleste au début du passage en cours (à l'horizontale). */
  let fromX = (start.col + 0.5) * T - box.width / 2;
  const place = (k: number, m: Move) => {
    const f = a.map.surfaces[m.from];
    const t = a.map.surfaces[m.to];
    if (!f || !t) {
      throw new Error('surface inconnue');
    }
    const cx = (sur: typeof f) => ((sur.colStart + sur.colEnd + 1) / 2) * T;
    if (horizontal) {
      const toX = m.toX ?? cx(t) - box.width / 2;
      box.x = fromX + (toX - fromX) * k;
    } else {
      box.x = cx(f) + (cx(t) - cx(f)) * k - box.width / 2;
    }
    box.y = (f.row + (t.row - f.row) * k) * T - box.height;
  };
  // Départ : debout sur la première surface pendant l'attente du poursuivant.
  const first = path[0];
  if (!first) {
    return { contacts: 0, margin: Infinity, done: true, timeMs: 0 };
  }
  place(0, first);
  run.restart();
  let timeMs = 0;
  for (const m of path) {
    let duration = m.durationMs;
    const f = a.map.surfaces[m.from];
    if (horizontal && runSpeed > 0 && f && RUN_KINDS.has(m.kind) && m.dir !== 0) {
      // Un passage en courant compte la course depuis le bord arrière de la surface (D-67) ;
      // Céleste, arrivée plus loin sur ce plancher, n'a plus ce bout à courir.
      const edge = m.dir > 0 ? f.colStart * T : (f.colEnd + 1) * T - box.width;
      const ran = Math.max(0, (fromX - edge) * m.dir);
      duration = Math.max(0, duration - (ran / runSpeed) * 1000);
    }
    timeMs += duration;
    const steps = Math.max(1, Math.round(((duration * slow) / 1000) * HZ));
    for (let s = 1; s <= steps; s++) {
      place(s / steps, m);
      if (run.step(box, false)) {
        contacts++;
      }
      if (run.done) {
        return { contacts, margin, done: true, timeMs };
      }
      margin = Math.min(margin, run.lead(box));
    }
    fromX = box.x;
  }
  return { contacts, margin, done: run.done, timeMs };
}
