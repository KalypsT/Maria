import { ARCADE_CORRIDOR as C } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import { spawnPosition, type LevelData } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import type { Hitbox } from './course';
import { mulberry32, ramp, seedOf } from './random';
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

/**
 * Un geste du témoin, quand le bord droit de sa boîte atteint `atX` (px) : glisser, sauter, ou
 * glisser puis sauter (le saut long) quand le bord droit atteint `jumpX`.
 */
export interface CorridorAction {
  readonly kind: 'slide' | 'jump' | 'slide-jump';
  readonly atX: number;
  readonly jumpX?: number;
}

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
/** Pas de simulation au plus pour passer un obstacle (et pour tout le niveau, à la fin). */
const MAX_STEPS = 900;
/** Départs du geste essayés avant l'obstacle (px), et après son bord (le temps de grâce). */
const SCAN_BEFORE_PX = 110;
const SCAN_AFTER_PX = 6;
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

/** Le témoin qui suit un plan : le geste suivant, et le saut long en attente. */
interface Driver {
  readonly phys: PlayerPhysics;
  next: number;
  jumpX: number;
}

const input: PlayerInput = {
  moveX: 1,
  moveY: 0,
  jumpPressed: false,
  jumpHeld: true,
  abilityPressed: false,
};

/** Un pas : il court vers la droite, Saut tenu ; le geste du plan quand il arrive à sa place. */
function drive(driver: Driver, plan: readonly CorridorAction[]): void {
  const box = driver.phys.box;
  const right = box.x + box.width;
  input.jumpPressed = false;
  input.abilityPressed = false;
  const action = plan[driver.next];
  if (action && right >= action.atX) {
    driver.next++;
    if (action.kind === 'jump') {
      input.jumpPressed = true;
    } else {
      input.abilityPressed = true;
      driver.jumpX = action.jumpX ?? Number.POSITIVE_INFINITY;
    }
  } else if (right >= driver.jumpX) {
    input.jumpPressed = true;
    driver.jumpX = Number.POSITIVE_INFINITY;
  }
  driver.phys.step(input);
}

function copyPhys(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
): PlayerPhysics {
  const phys = new PlayerPhysics(level, params, from.box.x, from.box.y, from.box);
  phys.copyFrom(from);
  phys.shiftTo(level, 0);
  return phys;
}

/**
 * Depuis `from`, le témoin passe-t-il l'obstacle avec ce geste : posé au sol au-delà de `clearX`
 * (px), le geste fait, sans toucher de danger ? Retourne son état d'alors.
 */
function pass(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
  action: CorridorAction,
  clearX: number,
): PlayerPhysics | null {
  const driver: Driver = {
    phys: copyPhys(from, level, params),
    next: 0,
    jumpX: Number.POSITIVE_INFINITY,
  };
  const plan = [action];
  for (let i = 0; i < MAX_STEPS; i++) {
    drive(driver, plan);
    const phys = driver.phys;
    if (touchesHazard(level, phys.box)) {
      return null;
    }
    if (
      driver.next === 1 &&
      driver.jumpX === Number.POSITIVE_INFINITY &&
      phys.grounded &&
      phys.box.x >= clearX
    ) {
      return phys;
    }
  }
  return null;
}

/** Le meilleur geste pour un obstacle : la plus longue plage de départs qui passent, et son milieu. */
interface Best {
  readonly action: CorridorAction;
  readonly window: number;
  readonly phys: PlayerPhysics;
}

/**
 * Essaie le geste à chaque px avant l'obstacle (jamais avant la place du témoin : le geste se décide
 * après l'obstacle précédent) ; `make` donne le geste d'un départ. Garde la plus longue plage.
 */
function scan(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
  edgeX: number,
  clearX: number,
  make: (x: number) => CorridorAction,
): Best | null {
  const first = Math.max(edgeX - SCAN_BEFORE_PX, Math.ceil(from.box.x + from.box.width) + 1);
  let best: Best | null = null;
  let runStart = -1;
  const close = (end: number) => {
    const window = end - runStart;
    if (runStart >= 0 && window > (best?.window ?? 0)) {
      const action = make(runStart + Math.floor(window / 2));
      const phys = pass(from, level, params, action, clearX);
      if (phys) {
        best = { action, window, phys };
      }
    }
    runStart = -1;
  };
  for (let x = first; x <= edgeX + SCAN_AFTER_PX; x++) {
    if (pass(from, level, params, make(x), clearX)) {
      if (runStart < 0) {
        runStart = x;
      }
    } else {
      close(x);
    }
  }
  close(edgeX + SCAN_AFTER_PX + 1);
  return best;
}

/** Le meilleur geste pour passer cet obstacle (null : rien ne passe). */
function bestFor(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
  o: CorridorObstacle,
  long: boolean,
): Best | null {
  const edgeX = o.col * T;
  const clearX = (o.col + o.width) * T;
  if (o.kind !== 'pit') {
    return scan(from, level, params, edgeX, clearX, (atX) => ({ kind: 'slide', atX }));
  }
  const jump = scan(from, level, params, edgeX, clearX, (atX) => ({ kind: 'jump', atX }));
  if (!long) {
    return jump;
  }
  if (jump) {
    // Un saut long demandé : un saut en courant ne doit pas suffire.
    return null;
  }
  let best: Best | null = null;
  for (const lead of SLIDE_LEADS_PX) {
    const found = scan(from, level, params, edgeX, clearX, (jumpX) => ({
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
  const random = mulberry32(seedOf(`corridor:${String(n)}`));
  const d = corridorDifficulty(n);
  const header = [
    `; Console (D-166) : le couloir, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: Le couloir · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
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
    type Placed = { obstacle: CorridorObstacle; best: Best };
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
    difficulty: d,
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
  const spawn = spawnPosition(level, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(level, params, spawn.x, spawn.y, hitbox);
  phys.canSlide = true;
  const driver: Driver = { phys, next: 0, jumpX: Number.POSITIVE_INFINITY };
  let lastX = Number.NaN;
  for (let i = 0; i < MAX_STEPS * (plan.length + 2); i++) {
    drive(driver, plan);
    if (touchesHazard(level, phys.box)) {
      return -1;
    }
    if (driver.next === plan.length && phys.grounded && !phys.low && phys.box.x === lastX) {
      return phys.box.x;
    }
    lastX = phys.box.x;
  }
  return -1;
}
