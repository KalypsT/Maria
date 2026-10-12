import { ARCADE_CORRIDOR as C } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import { spawnPosition, type LevelData } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { PlayerPhysics } from '../player/PlayerPhysics';
import type { Hitbox } from './course';
import { replayRun, scanAction, type RunAction, type RunBest } from './runner';
import { mulberry32, ramp, seedOf } from './random';
import type { EndlessChunk } from './endless';
import { ARCADE_ROOM_META } from './roomMeta';

/**
 * Un obstacle du couloir : une barre qui pend du plafond, un tunnel (sa bouche, puis un plafond bas
 * solide), un trou dans le sol. `col` : première colonne ; `width` : en tuiles.
 */
export interface CorridorObstacle {
  readonly kind: 'bar' | 'tunnel' | 'pit';
  readonly col: number;
  readonly width: number;
}

/** Un geste du témoin (`runner.ts`). */
export type CorridorAction = RunAction;

/** Un niveau du couloir : son texte, le plan du témoin (les tests le rejouent), ses obstacles. */
export interface CorridorLevel {
  readonly text: string;
  readonly plan: readonly CorridorAction[];
  readonly obstacles: readonly CorridorObstacle[];
  /** Du départ au fanion (tuiles) : ce que vaut le niveau au compteur. */
  readonly lengthTiles: number;
  readonly difficulty: number;
}

/** Colonnes de sol laissées après le dernier obstacle, pendant la génération. */
const LOOKAHEAD_COLS = 24;
/** Saut long : la glissade part ces distances (px) avant le saut. */
const SLIDE_LEADS_PX = [16, 32, 48];
/** Écart tiré en plus essayé, au plus (tuiles), si l'obstacle ne passe pas à l'écart visé. */
const MORE_GAP = 4;
/** Largeur de trou la plus grande essayée (tuiles). */
const MAX_PIT = 10;
/** Colonne du départ de Céleste. */
const SPAWN_COL = 2;

/** Difficulté du niveau n (1, 2, 3…). */
export function corridorDifficulty(n: number): number {
  return 1 - Math.pow(C.difficultyRate, n - 1);
}

/** Nombre d'obstacles du niveau n. */
export function corridorCount(n: number): number {
  return Math.min(C.obstacles.max, C.obstacles.first + Math.floor((n - 1) / C.obstacles.every));
}

function levelText(
  obstacles: readonly CorridorObstacle[],
  width: number,
  goalCol: number | null,
  header: readonly string[],
): string {
  const rows = C.rows;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const fill = r <= C.ceilingRow || r === rows - 1 ? '#' : r >= C.floorRow ? 'b' : '.';
    const line = new Array<string>(width).fill(fill);
    line[0] = '#';
    line[width - 1] = '#';
    grid.push(line);
  }
  const paint = (col: number, w: number, from: number, to: number, tile: string) => {
    for (let r = from; r <= to; r++) {
      const line = grid[r];
      for (let c = col; c < col + w && line; c++) {
        line[c] = tile;
      }
    }
  };
  // Une tuile de passage sous les barres et les tunnels : couchée seulement.
  const low = C.floorRow - 2;
  for (const o of obstacles) {
    if (o.kind === 'bar') {
      paint(o.col, o.width, C.ceilingRow + 1, low, '^');
    } else if (o.kind === 'tunnel') {
      paint(o.col, 1, C.ceilingRow + 1, low, '^');
      paint(o.col + 1, o.width - 1, C.ceilingRow + 1, low, 'b');
    } else {
      paint(o.col, o.width, C.floorRow, rows - 2, '^');
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

/** Le meilleur geste pour passer cet obstacle (null : rien ne passe). */
function bestFor(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
  o: CorridorObstacle,
  long: boolean,
): RunBest | null {
  const edgeX = o.col * T;
  const clearX = (o.col + o.width) * T;
  if (o.kind !== 'pit') {
    return scanAction(from, level, params, edgeX, clearX, (atX) => ({ kind: 'slide', atX }));
  }
  const jump = scanAction(from, level, params, edgeX, clearX, (atX) => ({ kind: 'jump', atX }));
  if (!long) {
    return jump;
  }
  if (jump) {
    // Un saut long demandé : un saut en courant ne doit pas suffire.
    return null;
  }
  let best: RunBest | null = null;
  for (const lead of SLIDE_LEADS_PX) {
    const found = scanAction(from, level, params, edgeX, clearX, (jumpX) => ({
      kind: 'slide-jump',
      atX: jumpX - lead,
      jumpX,
    }));
    if (found && found.window > (best?.window ?? 0)) {
      best = found;
    }
  }
  return best;
}

/** Les obstacles posés par le témoin, ses gestes, et où finit le dernier (colonne). */
interface Placement {
  readonly obstacles: CorridorObstacle[];
  readonly plan: CorridorAction[];
  readonly end: number;
}

/**
 * Les obstacles du niveau `n` (sa difficulté, leur nombre), avec la graine `seed` : chacun gardé
 * seulement si le témoin le passe depuis l'obstacle précédent, sur une plage de départs assez
 * longue ; il part au milieu.
 */
function placeObstacles(
  n: number,
  seed: string,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  header: readonly string[],
): Placement {
  const random = mulberry32(seedOf(seed));
  const d = corridorDifficulty(n);
  const id = `arcade-corridor-${String(n)}`;
  const parse = (list: readonly CorridorObstacle[], end: number) =>
    parseAsciiLevel(id, levelText(list, end + LOOKAHEAD_COLS, null, header));

  const obstacles: CorridorObstacle[] = [];
  const plan: CorridorAction[] = [];
  let end = 1 + C.startCols;
  const start = parse(obstacles, end);
  const spawn = spawnPosition(start, hitbox.width, hitbox.height);
  let saved = new PlayerPhysics(start, params, spawn.x, spawn.y, hitbox);
  saved.canSlide = true;
  const minWindow = ramp(C.minWindowPx, d);

  const count = corridorCount(n);
  for (let k = 0; k < count; k++) {
    const roll = random();
    const pitChance = ramp(C.pitChance, d);
    const kind =
      roll < pitChance ? 'pit' : roll < pitChance + ramp(C.tunnelChance, d) ? 'tunnel' : 'bar';
    const long = kind === 'pit' && random() < ramp(C.longJumpChance, d);
    const gapWanted = Math.max(1, Math.round(ramp(C.gap, d) + random() * C.gapSpread));
    let sizes: number[];
    if (kind === 'bar') {
      const wanted = ramp(C.barWidth, d) + random() * C.barSpread;
      sizes = [1, 2, 3].sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted));
    } else if (kind === 'tunnel') {
      const wanted = Math.round(ramp(C.tunnelLength, d) + random());
      sizes = [wanted, wanted - 1, wanted + 1, 3].filter((s) => s >= 2);
    } else if (long) {
      // Le trou le plus étroit qu'un saut en courant ne passe plus.
      sizes = Array.from({ length: MAX_PIT - 2 }, (_, i) => i + 3);
    } else {
      const wanted = ramp(C.pitWidth, d) + random() * C.pitSpread;
      sizes = Array.from({ length: MAX_PIT - 1 }, (_, i) => i + 2).sort(
        (a, b) => Math.abs(a - wanted) - Math.abs(b - wanted),
      );
    }
    type Placed = { obstacle: CorridorObstacle; best: RunBest };
    const tryPlace = (list: readonly (readonly [CorridorObstacle, boolean])[]): Placed | null => {
      for (const [obstacle, isLong] of list) {
        const level = parse([...obstacles, obstacle], obstacle.col + obstacle.width);
        const best = bestFor(saved, level, params, obstacle, isLong);
        if (best && best.window >= minWindow) {
          return { obstacle, best };
        }
      }
      return null;
    };
    const wanted: (readonly [CorridorObstacle, boolean])[] = [];
    for (let gap = gapWanted; gap <= gapWanted + MORE_GAP; gap++) {
      for (const width of sizes) {
        wanted.push([{ kind, col: end + gap, width }, long]);
      }
    }
    // Rien ne passe : une barre étroite, plus loin.
    const easy = Array.from(
      { length: MORE_GAP + 4 },
      (_, i) => [{ kind: 'bar', col: end + gapWanted + i, width: 1 }, false] as const,
    );
    const placed = tryPlace(wanted) ?? tryPlace(easy);
    if (!placed) {
      throw new Error(
        `Le couloir, niveau ${String(n)} : aucun obstacle ne se place après ${String(k)}`,
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
 * Le niveau n du couloir (D-166), toujours le même : une graine fixe, des obstacles de plus en plus
 * serrés (barres, tunnels, trous), et chacun gardé seulement si le témoin (la vraie physique, la
 * phase du jeu) le passe depuis l'obstacle précédent, sur une plage de départs assez longue ; il
 * part au milieu. Les trous les plus larges demandent le saut long depuis la glissade (un saut en
 * courant n'y suffit pas). Une dernière vérification rejoue tout le plan ; les tests mesurent
 * ensuite chaque niveau avec l'analyse de faisabilité (D-16).
 */
export function generateCorridorLevel(
  n: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): CorridorLevel {
  const header = [
    `; Console (D-166) : le couloir, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: Le couloir · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
  const id = `arcade-corridor-${String(n)}`;
  const { obstacles, plan, end } = placeObstacles(
    n,
    `corridor:${String(n)}`,
    params,
    hitbox,
    header,
  );
  const goalCol = end + C.goalCols;
  const width = goalCol + 4;
  const text = levelText(obstacles, width, goalCol, header);
  const replay = runPlan(parseAsciiLevel(id, text), plan, params, hitbox);
  if (replay < (goalCol - 1) * T) {
    throw new Error(`Le couloir, niveau ${String(n)} : le témoin n'arrive pas au fanion`);
  }
  return {
    text,
    plan,
    obstacles,
    lengthTiles: goalCol - SPAWN_COL,
    difficulty: corridorDifficulty(n),
  };
}

/**
 * Un morceau du couloir pour le mode Sans fin (D-167) : sa jointure est le sol de départ (sans
 * obstacle), et il s'arrête une tuile après son dernier obstacle, où commence le sol du suivant.
 * Les obstacles sont posés comme ceux du niveau `level`, avec une graine propre à la partie et au
 * morceau.
 */
export function generateCorridorChunk(
  index: number,
  level: number,
  runSeed: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): EndlessChunk {
  const header = ARCADE_ROOM_META;
  const { obstacles, plan, end } = placeObstacles(
    level,
    `endless:corridor:${String(runSeed)}:${String(index)}`,
    params,
    hitbox,
    header,
  );
  // La jointure suivante commence une tuile après le dernier obstacle.
  const next = end + 1;
  const lines = levelText(obstacles, next + 1, null, [])
    .split('\n')
    .map((line) => line.slice(1, next).replace('P', '.'));
  return {
    index,
    level,
    lines,
    width: next - 1,
    difficulty: corridorDifficulty(level),
    posts: [{ kind: 'post', col: 0, width: C.startCols, top: C.floorRow, goal: false }],
    exit: { top: C.floorRow, layer: 'present' },
    plan: plan.map((action) => ({
      ...action,
      atX: action.atX - T,
      ...(action.jumpX !== undefined ? { jumpX: action.jumpX - T } : {}),
    })),
  };
}

/**
 * Rejoue un plan depuis le départ (la vraie physique, la glissade prêtée) : retourne l'abscisse
 * (px) où le témoin s'arrête contre le mur du fond, tous les gestes faits ; -1 s'il touche un
 * danger, ou s'il n'y arrive pas.
 */
export function runPlan(
  level: LevelData,
  plan: readonly CorridorAction[],
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): number {
  return replayRun(level, plan, params, hitbox, true);
}
