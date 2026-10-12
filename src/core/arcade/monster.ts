import { ARCADE_MONSTER as C } from '../../config/arcade';
import { DEFAULT_COMBAT, type CombatParams } from '../../config/combat';
import { TILE_SIZE as T } from '../../config/display';
import { PHYSICS_STEP_HZ, type MovementParams } from '../../config/movement';
import { Chase, ChaseEvent } from '../boss/Chase';
import { spawnPosition, type LevelData } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics } from '../player/PlayerPhysics';
import type { Hitbox } from './course';
import { mulberry32, ramp, seedOf } from './random';
import { chunkLines, type EndlessChunk } from './endless';
import { ARCADE_ROOM_META } from './roomMeta';
import {
  drive,
  RUN_MAX_STEPS,
  scanAction,
  startDriver,
  type RunAction,
  type RunBest,
} from './runner';

/** Un obstacle de la course : un trou dans le sol, ou un bloc posé dessus. En tuiles. */
export interface MonsterObstacle {
  readonly kind: 'pit' | 'block';
  readonly col: number;
  readonly width: number;
  /** Hauteur d'un bloc (0 pour un trou). */
  readonly height: number;
}

/** Un niveau du monstre : son texte, le plan du témoin, ses obstacles, le monstre. */
export interface MonsterLevel {
  readonly text: string;
  readonly plan: readonly RunAction[];
  readonly obstacles: readonly MonsterObstacle[];
  /** Vitesse du monstre par tronçon (tuiles/s), et l'avance la plus petite du témoin (tuiles). */
  readonly speeds: readonly number[];
  readonly lead: number;
  readonly lengthTiles: number;
  readonly difficulty: number;
}

/** Colonnes de sol laissées après le dernier obstacle, pendant la génération. */
const LOOKAHEAD_COLS = 24;
/** Écart tiré en plus essayé, au plus (tuiles), si l'obstacle ne passe pas à l'écart visé. */
const MORE_GAP = 4;
/** Colonne du départ de Céleste. */
const SPAWN_COL = 2;
/** Le fanion : le monstre s'arrête quand Céleste arrive à cette distance de lui (tuiles). */
const END_BEFORE_GOAL = 3;
/** Recherche de la vitesse du monstre : bornes (tuiles/s) et essais. */
const SPEED_MIN = 0.5;
const SPEED_MAX = 40;
const SPEED_TRIES = 30;

/** Difficulté du niveau n (1, 2, 3…). */
export function monsterDifficulty(n: number): number {
  return 1 - Math.pow(C.difficultyRate, n - 1);
}

/** Nombre d'obstacles du niveau n. */
export function monsterCount(n: number): number {
  return Math.min(C.obstacles.max, C.obstacles.first + Math.floor((n - 1) / C.obstacles.every));
}

/**
 * Les réglages de la poursuite dans la console (D-166) : le monstre part plus tôt et plus près que
 * les poursuites de l'histoire.
 */
export function monsterChaseParams(base: Readonly<CombatParams>): CombatParams {
  return {
    ...base,
    chaseSideStartDelayMs: C.startDelayMs,
    chaseSideRestartGapTiles: C.startGapTiles,
  };
}

/**
 * La poursuite du mode Sans fin (D-167) : comme dans les niveaux, plus **la laisse** : au-delà de
 * `ARCADE_MONSTER.endless.leashTiles` derrière Céleste, le monstre rattrape jusqu'à cette distance.
 * Il court un peu moins vite qu'elle : une hésitation se rattrape, de moins en moins vite.
 */
export function monsterEndlessParams(base: Readonly<CombatParams>): CombatParams {
  const e = C.endless;
  return {
    ...monsterChaseParams(base),
    chaseCatchUpGapTiles: e.leashTiles,
    chaseCatchUpRate: e.catchUpRate,
    chaseCatchUpMaxSpeed: e.catchUpMaxSpeed,
  };
}

function levelText(
  obstacles: readonly MonsterObstacle[],
  width: number,
  goalCol: number | null,
  header: readonly string[],
): string {
  const rows = C.rows;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const fill = r === 0 || r === rows - 1 ? '#' : r >= C.floorRow ? 'b' : '.';
    const line = new Array<string>(width).fill(fill);
    line[0] = '#';
    line[width - 1] = '#';
    grid.push(line);
  }
  for (const o of obstacles) {
    const [from, to, tile] =
      o.kind === 'pit' ? [C.floorRow, rows - 2, '^'] : [C.floorRow - o.height, C.floorRow - 1, 'b'];
    for (let r = from; r <= to; r++) {
      const line = grid[r];
      for (let c = o.col; c < o.col + o.width && line; c++) {
        line[c] = tile;
      }
    }
  }
  const above = grid[C.floorRow - 1];
  if (above) {
    above[SPAWN_COL] = 'P';
    if (goalCol !== null) {
      above[goalCol] = 'G';
    }
  }
  return [...header, ...grid.map((line) => line.join(''))].join('\n');
}

/** Les tronçons du monstre : la colonne où chacun finit, et son facteur de vitesse. */
function sections(goalCol: number): { until: number; factor: number }[] {
  const end = goalCol - END_BEFORE_GOAL;
  const span = end - SPAWN_COL;
  return Array.from({ length: C.sections }, (_, k) => ({
    until: k === C.sections - 1 ? end : SPAWN_COL + Math.round((span * (k + 1)) / C.sections),
    factor: ramp(C.speedProfile, C.sections > 1 ? k / (C.sections - 1) : 0),
  }));
}

function chaseLines(goalCol: number, speeds: readonly number[]): string[] {
  return [
    `; @chase: right ${String(goalCol - END_BEFORE_GOAL)}`,
    '; @chase-look: monster',
    ...sections(goalCol).map(
      (s, k) => `; @chase-phase: ${String(s.until)} ${(speeds[k] ?? 0).toFixed(2)}`,
    ),
  ];
}

/**
 * La course du témoin poursuivi : son avance la plus petite sur le monstre (tuiles), de son réveil
 * à la ligne d'arrivée ; -Infinity s'il est touché, s'il touche un danger, ou s'il n'arrive pas.
 */
export function chaseLead(
  level: LevelData,
  plan: readonly RunAction[],
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  chaseParams: Readonly<CombatParams> = monsterChaseParams(DEFAULT_COMBAT),
): number {
  const data = level.chase;
  if (!data) {
    return Number.NEGATIVE_INFINITY;
  }
  const chase = new Chase(data, chaseParams, PHYSICS_STEP_HZ);
  const driver = startDriver(level, params, hitbox, false);
  const box = driver.phys.box;
  let lead = Number.POSITIVE_INFINITY;
  let awake = false;
  for (let i = 0; i < RUN_MAX_STEPS * (plan.length + 2); i++) {
    drive(driver, plan);
    if (touchesHazard(level, box)) {
      return Number.NEGATIVE_INFINITY;
    }
    if (chase.step(box, false)) {
      return Number.NEGATIVE_INFINITY;
    }
    if (chase.done) {
      return lead;
    }
    // L'avance compte une fois le monstre réveillé (il attend un instant au départ).
    awake ||= (chase.events & ChaseEvent.Wake) !== 0;
    if (awake) {
      lead = Math.min(lead, chase.lead(box));
    }
  }
  return Number.NEGATIVE_INFINITY;
}

/** Le meilleur saut pour passer cet obstacle (null : rien ne passe). */
function bestFor(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
  o: MonsterObstacle,
): RunBest | null {
  return scanAction(from, level, params, o.col * T, (o.col + o.width) * T, (atX) => ({
    kind: 'jump',
    atX,
  }));
}

/** Les obstacles posés par le témoin, ses sauts, et où finit le dernier (colonne). */
interface Placement {
  readonly obstacles: MonsterObstacle[];
  readonly plan: RunAction[];
  readonly end: number;
}

/**
 * Les obstacles du niveau `n` (sa difficulté, leur nombre), avec la graine `seed` : chacun gardé
 * seulement si le témoin le passe en sautant, sur une plage de départs assez longue.
 */
function placeObstacles(
  n: number,
  seed: string,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  header: readonly string[],
): Placement {
  const random = mulberry32(seedOf(seed));
  const d = monsterDifficulty(n);
  const id = `arcade-monster-${String(n)}`;
  const parse = (list: readonly MonsterObstacle[], end: number) =>
    parseAsciiLevel(id, levelText(list, end + LOOKAHEAD_COLS, null, header));

  const obstacles: MonsterObstacle[] = [];
  const plan: RunAction[] = [];
  let end = 1 + C.startCols;
  const start = parse(obstacles, end);
  const spawn = spawnPosition(start, hitbox.width, hitbox.height);
  let saved = new PlayerPhysics(start, params, spawn.x, spawn.y, hitbox);
  const minWindow = ramp(C.minWindowPx, d);

  const count = monsterCount(n);
  for (let k = 0; k < count; k++) {
    const pit = random() < ramp(C.pitChance, d);
    const gapWanted = Math.max(1, Math.round(ramp(C.gap, d) + random() * C.gapSpread));
    const shapes: { width: number; height: number }[] = [];
    if (pit) {
      const wanted = ramp(C.pitWidth, d) + random() * C.pitSpread;
      for (let w = 1; w <= 7; w++) {
        shapes.push({ width: w, height: 0 });
      }
      shapes.sort((a, b) => Math.abs(a.width - wanted) - Math.abs(b.width - wanted));
    } else {
      const height = Math.max(1, Math.min(3, Math.round(ramp(C.blockHeight, d) + random())));
      const width = Math.round(ramp(C.blockWidth, d) + random() * C.blockSpread);
      for (let h = height; h >= 1; h--) {
        shapes.push({ width, height: h });
      }
    }
    type Placed = { obstacle: MonsterObstacle; best: RunBest };
    let placed: Placed | null = null;
    const candidates: MonsterObstacle[] = [];
    for (let gap = gapWanted; gap <= gapWanted + MORE_GAP; gap++) {
      for (const shape of shapes) {
        candidates.push({ kind: pit ? 'pit' : 'block', col: end + gap, ...shape });
      }
    }
    for (const obstacle of candidates) {
      const level = parse([...obstacles, obstacle], obstacle.col + obstacle.width);
      const best = bestFor(saved, level, params, obstacle);
      if (best && best.window >= minWindow) {
        placed = { obstacle, best };
        break;
      }
    }
    if (!placed) {
      throw new Error(
        `Le monstre, niveau ${String(n)} : aucun obstacle ne se place après ${String(k)}`,
      );
    }
    obstacles.push(placed.obstacle);
    plan.push(placed.best.action);
    saved = placed.best.phys;
    end = placed.obstacle.col + placed.obstacle.width;
  }

  return { obstacles, plan, end };
}

/**
 * Le niveau n du monstre (D-166), toujours le même : une graine fixe ; des trous et des blocs de
 * plus en plus serrés, chacun gardé seulement si le témoin (la vraie physique, la phase du jeu, sans
 * capacité) le passe en courant, sur une plage de départs assez longue (il saute au milieu). Puis
 * le monstre : il accélère d'un tronçon à l'autre, et sa vitesse est cherchée pour que le témoin
 * garde au plus juste `lead` tuiles d'avance (de moins en moins). Une dernière course le vérifie.
 */
export function generateMonsterLevel(
  n: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): MonsterLevel {
  const d = monsterDifficulty(n);
  const header = [
    `; Console (D-166) : le monstre, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: Le monstre · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
  const id = `arcade-monster-${String(n)}`;
  const { obstacles, plan, end } = placeObstacles(
    n,
    `monster:${String(n)}`,
    params,
    hitbox,
    header,
  );

  const goalCol = end + C.goalCols;
  const width = goalCol + 4;
  const ground = levelText(obstacles, width, goalCol, header);
  const factors = sections(goalCol).map((s) => s.factor);
  const textAt = (speed: number) => {
    const speeds = factors.map((f) => Math.floor(speed * f * 100) / 100);
    const lines = ground.split('\n');
    const at = header.length;
    return {
      speeds,
      text: [...lines.slice(0, at), ...chaseLines(goalCol, speeds), ...lines.slice(at)].join('\n'),
    };
  };
  const leadAt = (speed: number) =>
    chaseLead(parseAsciiLevel(id, textAt(speed).text), plan, params, hitbox);

  // La vitesse la plus grande où le témoin garde encore `lead` tuiles d'avance.
  const target = ramp(C.lead, d);
  let lo = SPEED_MIN;
  let hi = SPEED_MAX;
  for (let i = 0; i < SPEED_TRIES; i++) {
    const mid = (lo + hi) / 2;
    if (leadAt(mid) >= target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const { text, speeds } = textAt(lo);
  const lead = leadAt(lo);
  if (!(lead >= target)) {
    throw new Error(`Le monstre, niveau ${String(n)} : le témoin n'échappe pas au monstre`);
  }
  return {
    text,
    plan,
    obstacles,
    speeds,
    lead,
    lengthTiles: goalCol - SPAWN_COL,
    difficulty: d,
  };
}

/**
 * Un morceau du monstre pour le mode Sans fin (D-167) : sa jointure est le sol de départ (sans
 * obstacle), et il s'arrête une tuile après son dernier obstacle. Les obstacles sont posés comme
 * ceux du niveau `level` ; le monstre y court à une part de l'allure du témoin dans le morceau (les
 * sauts et les blocs la ralentissent), une part qui monte avec la difficulté
 * (`ARCADE_MONSTER.endless.speed`), tenu en laisse (`monsterEndlessParams`).
 */
export function generateMonsterChunk(
  index: number,
  level: number,
  runSeed: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): EndlessChunk {
  const { obstacles, plan, end } = placeObstacles(
    level,
    `endless:monster:${String(runSeed)}:${String(index)}`,
    params,
    hitbox,
    ARCADE_ROOM_META,
  );
  const next = end + 1;
  const lines = chunkLines(levelText(obstacles, next + 1, null, []), 1, next);
  // L'allure du témoin dans ce morceau (les sauts, les blocs : il ne court pas toujours à fond).
  const pace = paceOf(
    parseAsciiLevel(
      'endless-monster',
      levelText(obstacles, next + LOOKAHEAD_COLS, null, ARCADE_ROOM_META),
    ),
    plan,
    params,
    hitbox,
    next * T,
  );
  return {
    index,
    level,
    lines,
    width: next - 1,
    difficulty: monsterDifficulty(level),
    posts: [{ kind: 'post', col: 0, width: C.startCols, top: C.floorRow, goal: false }],
    exit: { top: C.floorRow, layer: 'present' },
    anchorIn: { col: 0, row: C.floorRow - 1 },
    anchorOut: { col: next - 1, row: C.floorRow - 1 },
    plan: plan.map((action) => ({ ...action, atX: action.atX - T })),
    speed: Math.floor(pace * ramp(C.endless.speed, monsterDifficulty(level)) * 100) / 100,
  };
}

/**
 * L'allure du témoin (tuiles/s), de son départ jusqu'à `endX` (px) : la distance, sur le temps mis
 * en suivant son plan (la vraie physique).
 */
function paceOf(
  level: LevelData,
  plan: readonly RunAction[],
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  endX: number,
): number {
  const driver = startDriver(level, params, hitbox, false);
  const box = driver.phys.box;
  const startX = box.x;
  for (let i = 1; i < RUN_MAX_STEPS * (plan.length + 2); i++) {
    drive(driver, plan);
    if (box.x >= endX) {
      return (box.x - startX) / T / (i / PHYSICS_STEP_HZ);
    }
  }
  return params.maxRunSpeed / T;
}
