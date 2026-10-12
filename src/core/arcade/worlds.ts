import { ARCADE_WORLDS as C } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import { spawnPosition, type Layer, type LevelData } from '../level/LevelData';
import { atLayer, otherLayer } from '../level/layers';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import { postUnder, type Hitbox, type PostPiece } from './course';
import { mulberry32, ramp, seedOf } from './random';
import type { EndlessChunk, EndlessEntry } from './endless';
import { ARCADE_ROOM_META } from './roomMeta';

/** Un poteau des deux mondes : d'une seule couche (D-107), ou des deux. */
export interface WorldsPost extends PostPiece {
  readonly layer: Layer | 'both';
}

/**
 * Une colonne de briques de jeu d'une seule couche, du plafond jusqu'à la ligne `bottom` comprise :
 * une porte (dans un écart) ou un mur (sur un poteau commun).
 */
export interface WorldsGate {
  readonly col: number;
  readonly bottom: number;
  readonly layer: Layer;
}

/** Un niveau des deux mondes : son texte, ses pièces et les bascules du témoin (les tests les rejouent). */
export interface WorldsLevel {
  readonly text: string;
  readonly posts: readonly WorldsPost[];
  readonly gates: readonly WorldsGate[];
  /** Le témoin bascule quand le bord droit de sa boîte atteint chacune de ces abscisses (px). */
  readonly shifts: readonly number[];
  /** Du départ au fanion (tuiles) : ce que vaut le niveau au compteur. */
  readonly lengthTiles: number;
  readonly difficulty: number;
}

/** Colonnes vides laissées après le dernier poteau, pendant la génération. */
const LOOKAHEAD_COLS = 24;
/** Pas de simulation au plus pour atteindre le poteau suivant. */
const MAX_STEPS = 1200;
/** Candidats essayés au plus pour un poteau. */
const MAX_TRIES = 48;
/** Écart le plus grand essayé (tuiles). */
const MAX_GAP = 7;
/** Colonnes d'un large poteau à murs avant le premier mur, et après le second. */
const WALL_MARGIN = 3;

/** Difficulté du niveau n (1, 2, 3…). */
export function worldsDifficulty(n: number): number {
  return 1 - Math.pow(C.difficultyRate, n - 1);
}

/** Nombre de poteaux du niveau n (sans le départ ni le fanion). */
export function worldsCount(n: number): number {
  return Math.min(C.posts.max, C.posts.first + Math.floor((n - 1) / C.posts.every));
}

function levelText(
  posts: readonly WorldsPost[],
  gates: readonly WorldsGate[],
  width: number,
  header: readonly string[],
): string {
  const rows = C.rows;
  const hazardRow = rows - 2;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const fill = r === 0 || r === rows - 1 ? '#' : r === hazardRow ? '^' : '.';
    const line = new Array<string>(width).fill(fill);
    line[0] = '#';
    line[width - 1] = '#';
    grid.push(line);
  }
  const zones: string[] = [];
  const zone = (layer: Layer, col: number, row: number, w: number, h: number) => {
    zones.push(`; @shift: ${layer} ${String(col)} ${String(row)} ${String(w)} ${String(h)}`);
  };
  for (const p of posts) {
    // Un poteau d'une seule couche s'arrête au-dessus des briques de jeu : dans l'autre couche,
    // elles restent dessous.
    const bottom = p.layer === 'both' ? hazardRow : hazardRow - 1;
    for (let r = p.top; r <= bottom; r++) {
      const line = grid[r];
      for (let c = p.col; c < p.col + p.width && line; c++) {
        line[c] = 'b';
      }
    }
    if (p.layer !== 'both') {
      zone(p.layer, p.col, p.top, p.width, hazardRow - p.top);
    }
    if (p.goal) {
      const line = grid[p.top - 1];
      if (line) {
        line[p.col + Math.floor(p.width / 2)] = 'G';
      }
    }
  }
  for (const g of gates) {
    for (let r = 1; r <= g.bottom; r++) {
      const line = grid[r];
      if (line) {
        line[g.col] = '^';
      }
    }
    zone(g.layer, g.col, 1, 1, g.bottom);
  }
  const start = posts[0];
  const line = start ? grid[start.top - 1] : undefined;
  if (start && line) {
    line[start.col + 1] = 'P';
  }
  return [...header, ...zones, ...grid.map((l) => l.join(''))].join('\n');
}

/** Les deux couches d'une salle. */
type Levels = Readonly<Record<Layer, LevelData>>;

function layersOf(level: LevelData): Levels {
  return { present: atLayer(level, 'present'), memory: atLayer(level, 'memory') };
}

/** Le témoin : la vraie physique, sa couche, la prochaine bascule du plan. */
interface Witness {
  readonly phys: PlayerPhysics;
  layer: Layer;
  next: number;
}

const input: PlayerInput = { moveX: 1, moveY: 0, jumpPressed: false, jumpHeld: true };

/**
 * Un pas du témoin : il bascule à la prochaine abscisse du plan, court vers la droite et saute,
 * tenu, au bord du poteau. False s'il ne peut pas basculer (la place manque) ou touche un danger.
 */
function stepWitness(
  w: Witness,
  levels: Levels,
  posts: readonly WorldsPost[],
  shifts: readonly number[],
  params: Readonly<MovementParams>,
): boolean {
  const phys = w.phys;
  const right = phys.box.x + phys.box.width;
  const at = shifts[w.next];
  if (at !== undefined && right >= at) {
    w.next++;
    const to = otherLayer(w.layer);
    if (!phys.shiftTo(levels[to], params.shiftNudgePx)) {
      return false;
    }
    w.layer = to;
  }
  const post = postUnder(phys, posts);
  const jump = post !== null && !post.goal && right >= (post.col + post.width) * T - 2;
  input.jumpPressed = jump;
  input.jumpHeld = jump || post === null;
  phys.step(input);
  return !touchesHazard(levels[w.layer], phys.box);
}

function copyWitness(w: Witness, levels: Levels, params: Readonly<MovementParams>): Witness {
  const level = levels[w.layer];
  const phys = new PlayerPhysics(level, params, w.phys.box.x, w.phys.box.y, w.phys.box);
  phys.copyFrom(w.phys);
  phys.shiftTo(level, 0);
  return { phys, layer: w.layer, next: w.next };
}

/**
 * Le témoin se pose-t-il sur le dernier poteau, toutes les bascules du plan faites, au-delà de
 * `clearX` (px) ? Retourne son état d'alors.
 */
function reach(
  saved: Witness,
  levels: Levels,
  params: Readonly<MovementParams>,
  posts: readonly WorldsPost[],
  shifts: readonly number[],
  clearX: number,
): Witness | null {
  const w = copyWitness(saved, levels, params);
  const target = posts[posts.length - 1];
  for (let i = 0; i < MAX_STEPS; i++) {
    if (!stepWitness(w, levels, posts, shifts, params)) {
      return null;
    }
    if (
      w.next === shifts.length &&
      w.phys.box.x >= clearX &&
      target &&
      postUnder(w.phys, posts) === target
    ) {
      return w;
    }
  }
  return null;
}

/** Une bascule placée : son abscisse (le milieu de la plage qui passe), la plage, le témoin après. */
interface Scan {
  readonly x: number;
  readonly window: number;
  readonly witness: Witness;
}

/**
 * Essaie la bascule `index` du plan à chaque px de `from` à `to` (les autres restent où elles
 * sont) ; garde la plus longue plage qui passe, et bascule en son milieu.
 */
function scan(
  saved: Witness,
  levels: Levels,
  params: Readonly<MovementParams>,
  posts: readonly WorldsPost[],
  shifts: number[],
  index: number,
  from: number,
  to: number,
  clearX: number,
): Scan | null {
  let bestStart = -1;
  let bestWindow = 0;
  let runStart = -1;
  for (let x = from; x <= to + 1; x++) {
    shifts[index] = x;
    const ok = x <= to && reach(saved, levels, params, posts, shifts, clearX) !== null;
    if (ok && runStart < 0) {
      runStart = x;
    } else if (!ok && runStart >= 0) {
      if (x - runStart > bestWindow) {
        bestWindow = x - runStart;
        bestStart = runStart;
      }
      runStart = -1;
    }
  }
  if (bestStart < 0) {
    return null;
  }
  const x = bestStart + Math.floor(bestWindow / 2);
  shifts[index] = x;
  const witness = reach(saved, levels, params, posts, shifts, clearX);
  return witness ? { x, window: bestWindow, witness } : null;
}

/** Un poteau retenu : ses portes ou ses murs, ses bascules, le témoin posé dessus. */
interface Placed {
  readonly post: WorldsPost;
  readonly gates: readonly WorldsGate[];
  readonly shifts: readonly number[];
  readonly witness: Witness;
}

/** Les pièces posées par le témoin, ses bascules, et sa couche en arrivant sur le dernier poteau. */
interface Placement {
  readonly posts: WorldsPost[];
  readonly gates: WorldsGate[];
  readonly shifts: number[];
  readonly layer: Layer;
}

/**
 * Les poteaux du niveau `n` (sa difficulté, leur nombre), avec la graine `seed` : le départ (commun
 * aux deux couches) en haut de la ligne `startTop`, le témoin dans la couche `startLayer` ; `seam` :
 * le dernier poteau est une jointure du mode Sans fin (D-167), sans fanion.
 */
function placeWorlds(
  n: number,
  seed: string,
  startTop: number,
  startLayer: Layer,
  seam: boolean,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  header: readonly string[],
): Placement {
  const random = mulberry32(seedOf(seed));
  const d = worldsDifficulty(n);
  const id = `arcade-worlds-${String(n)}`;
  const hazardRow = C.rows - 2;
  const posts: WorldsPost[] = [
    { kind: 'post', col: 1, width: C.start.width, top: startTop, goal: false, layer: 'both' },
  ];
  const gates: WorldsGate[] = [];
  const shifts: number[] = [];
  const parse = (list: readonly WorldsPost[], gateList: readonly WorldsGate[]) => {
    const last = list[list.length - 1];
    const width = (last ? last.col + last.width : 0) + LOOKAHEAD_COLS;
    return layersOf(parseAsciiLevel(id, levelText(list, gateList, width, header)));
  };
  const first = parse(posts, gates);
  const spawn = spawnPosition(first.present, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(first[startLayer], params, spawn.x, spawn.y, hitbox);
  let saved: Witness = { phys, layer: startLayer, next: 0 };
  const minWindow = ramp(C.minWindowPx, d);

  const count = worldsCount(n);
  for (let i = 0; i <= count; i++) {
    const goal = i === count;
    /** Le dernier poteau : le fanion, ou une jointure du mode Sans fin (D-167), sans fanion. */
    const lastWidth = seam ? C.start.width : C.goalWidth;
    const last = posts[posts.length - 1];
    if (!last) {
      break;
    }
    const cur = saved.layer;
    const walls = !goal && random() < ramp(C.wallsChance, d);
    const rest = !goal && !walls && random() < ramp(C.restChance, d);
    const gated = !goal && !walls && !rest && random() < ramp(C.gateChance, d);
    const gapWanted = ramp(C.gap, d) + random() * C.gapSpread;
    const riseSize = ramp(C.rise, d) * (0.5 + random() * 0.5);
    const riseWanted = random() < 0.5 ? riseSize : -riseSize;
    const postWidth = Math.max(1, Math.round(ramp(C.width, d) + random() * C.widthSpread));
    const exit = last.col + last.width;
    const candidates: { gap: number; top: number; score: number }[] = [];
    for (let gap = 1; gap <= MAX_GAP; gap++) {
      for (let top = C.postRows.min; top <= C.postRows.max; top++) {
        candidates.push({
          gap,
          top,
          score: Math.abs(gap - gapWanted) + 1.5 * Math.abs(last.top - top - riseWanted),
        });
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    const savedRight = saved.phys.box.x + saved.phys.box.width;
    const takeoff = Math.max(savedRight + 1, exit * T - 1);

    /** Un poteau commun (le fanion, un répit), sans bascule. */
    const placeBoth = (gap: number, top: number): Placed | null => {
      const post: WorldsPost = {
        kind: 'post',
        col: exit + gap,
        width: goal ? lastWidth : postWidth,
        top,
        goal: goal && !seam,
        layer: 'both',
      };
      const list = [...posts, post];
      const witness = reach(saved, parse(list, gates), params, list, shifts, 0);
      return witness ? { post, gates: [], shifts: [], witness } : null;
    };

    /** Un large poteau commun, deux murs : celui de la couche du témoin, puis celui de l'autre. */
    const placeWalls = (gap: number, top: number): Placed | null => {
      const spacing = Math.round(ramp(C.wallSpacing, d));
      const post: WorldsPost = {
        kind: 'post',
        col: exit + gap,
        width: 2 * WALL_MARGIN + spacing,
        top,
        goal: false,
        layer: 'both',
      };
      const list = [...posts, post];
      const a = post.col + WALL_MARGIN;
      const b = a + spacing;
      const pieceGates: WorldsGate[] = [
        { col: a, bottom: top - 1, layer: cur },
        { col: b, bottom: top - 1, layer: otherLayer(cur) },
      ];
      const levels = parse(list, [...gates, ...pieceGates]);
      const clearX = (b + 1) * T;
      const lo = (a + 1) * T - 2 + hitbox.width;
      const hi = b * T + 2;
      const plan = [...shifts, a * T - hitbox.width, Math.floor((lo + hi) / 2)];
      const second = scan(saved, levels, params, list, plan, plan.length - 1, lo, hi, clearX);
      if (!second || second.window < minWindow) {
        return null;
      }
      const at = plan.length - 2;
      const firstShift = scan(saved, levels, params, list, plan, at, takeoff, a * T + 2, clearX);
      if (!firstShift || firstShift.window < minWindow) {
        return null;
      }
      return {
        post,
        gates: pieceGates,
        shifts: plan.slice(shifts.length),
        witness: firstShift.witness,
      };
    };

    /**
     * Un poteau de l'autre couche : on bascule en plein saut. Avec des portes : une de la couche
     * d'arrivée, puis, `gateSpacing` colonnes plus loin, une de la couche de départ ; la bascule
     * se fait entre les deux.
     */
    const placeOther = (gap: number, top: number, withGates: boolean): Placed | null => {
      const layer = otherLayer(cur);
      const post: WorldsPost = {
        kind: 'post',
        col: exit + gap,
        width: postWidth,
        top,
        goal,
        layer,
      };
      const list = [...posts, post];
      const pieceGates: WorldsGate[] = [];
      if (withGates) {
        const spacing = Math.round(ramp(C.gateSpacing, d));
        const room = gap - spacing - 1;
        if (room < 0) {
          return null;
        }
        const early = exit + Math.floor(room / 2);
        pieceGates.push(
          { col: early, bottom: hazardRow - 1, layer },
          { col: early + spacing, bottom: hazardRow - 1, layer: cur },
        );
      }
      const levels = parse(list, [...gates, ...pieceGates]);
      const plan = [...shifts, 0];
      const to = post.col * T + hitbox.width;
      const found = scan(saved, levels, params, list, plan, plan.length - 1, takeoff, to, 0);
      if (!found || found.window < minWindow) {
        return null;
      }
      return { post, gates: pieceGates, shifts: [found.x], witness: found.witness };
    };

    // Ce qui est voulu, puis plus simple si rien ne se place : sans portes, un répit.
    const tries: ((gap: number, top: number) => Placed | null)[] = goal
      ? [placeBoth]
      : rest
        ? [placeBoth]
        : [
            ...(walls ? [placeWalls] : []),
            ...(gated ? [(g: number, t: number) => placeOther(g, t, true)] : []),
            (g: number, t: number) => placeOther(g, t, false),
            placeBoth,
          ];
    let placed: Placed | null = null;
    for (const attempt of tries) {
      for (const c of candidates.slice(0, MAX_TRIES)) {
        placed = attempt(c.gap, c.top);
        if (placed) {
          break;
        }
      }
      if (placed) {
        break;
      }
    }
    if (!placed) {
      throw new Error(
        `Les deux mondes, niveau ${String(n)} : aucun poteau ne se place après ${String(i)}`,
      );
    }
    posts.push(placed.post);
    gates.push(...placed.gates);
    shifts.push(...placed.shifts);
    saved = placed.witness;
  }

  return { posts, gates, shifts, layer: saved.layer };
}

/**
 * Le niveau n des deux mondes (D-166), toujours le même : une graine fixe ; chaque poteau gardé
 * seulement si le témoin (la vraie physique, la phase du jeu) s'y pose depuis le précédent, en
 * basculant quand il le faut. Il essaie chaque bascule à chaque px et garde la plus longue plage
 * qui passe (au moins `minWindowPx`), en son milieu. Les tests rejouent ses bascules et mesurent
 * chaque niveau avec l'analyse de faisabilité (D-16, la bascule, D-108).
 */
export function generateWorldsLevel(
  n: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): WorldsLevel {
  const header = [
    `; Console (D-166) : les deux mondes, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: Les deux mondes · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
  const id = `arcade-worlds-${String(n)}`;
  const { posts, gates, shifts } = placeWorlds(
    n,
    `worlds:${String(n)}`,
    C.start.top,
    'present',
    false,
    params,
    hitbox,
    header,
  );
  const goalPost = posts[posts.length - 1];
  const width = goalPost ? goalPost.col + goalPost.width + 1 : LOOKAHEAD_COLS;
  const text = levelText(posts, gates, width, header);
  if (!replayWorlds(parseAsciiLevel(id, text), posts, shifts, params, hitbox)) {
    throw new Error(`Les deux mondes, niveau ${String(n)} : le témoin n'arrive pas au fanion`);
  }
  const spawnCol = (posts[0]?.col ?? 0) + 1;
  const goalCol = goalPost ? goalPost.col + Math.floor(goalPost.width / 2) : spawnCol;
  return {
    text,
    posts,
    gates,
    shifts,
    lengthTiles: goalCol - spawnCol,
    difficulty: worldsDifficulty(n),
  };
}

/**
 * Un morceau des deux mondes pour le mode Sans fin (D-167) : de sa jointure (un poteau commun aux
 * deux couches, en haut de la ligne de `entry`, le témoin dans sa couche) à la suivante, non
 * comprise, dont la hauteur est libre ; le morceau d'après part de là, dans la couche où le témoin
 * y arrive. Ses zones d'une seule couche sont en colonnes du morceau.
 */
export function generateWorldsChunk(
  index: number,
  level: number,
  runSeed: number,
  entry: EndlessEntry | null,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): EndlessChunk {
  const { posts, gates, shifts, layer } = placeWorlds(
    level,
    `endless:worlds:${String(runSeed)}:${String(index)}`,
    entry?.top ?? C.start.top,
    entry?.layer ?? 'present',
    true,
    params,
    hitbox,
    ARCADE_ROOM_META,
  );
  const next = posts[posts.length - 1];
  const end = next ? next.col : 1;
  const lines = levelText(posts.slice(0, -1), gates, end + 1, [])
    .split('\n')
    .filter((line) => !line.startsWith(';'))
    .map((line) => line.slice(1, end).replace('P', '.'));
  const zones = [
    ...posts.slice(0, -1).flatMap((p) =>
      p.layer === 'both'
        ? []
        : [
            {
              layer: p.layer,
              col: p.col - 1,
              row: p.top,
              width: p.width,
              height: C.rows - 2 - p.top,
            },
          ],
    ),
    ...gates.map((g) => ({ layer: g.layer, col: g.col - 1, row: 1, width: 1, height: g.bottom })),
  ];
  return {
    index,
    level,
    lines,
    width: end - 1,
    difficulty: worldsDifficulty(level),
    posts: posts.slice(0, -1).map((p) => ({ ...p, col: p.col - 1 })),
    exit: { top: next?.top ?? C.start.top, layer },
    zones,
    shifts: shifts.map((x) => x - T),
  };
}

/**
 * Rejoue les bascules du témoin depuis le départ, dans le présent (la vraie physique) : true s'il
 * se pose sur le poteau du fanion, toutes les bascules faites, sans toucher de danger.
 */
export function replayWorlds(
  level: LevelData,
  posts: readonly WorldsPost[],
  shifts: readonly number[],
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): boolean {
  const levels = layersOf(level);
  const spawn = spawnPosition(levels.present, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(levels.present, params, spawn.x, spawn.y, hitbox);
  const w: Witness = { phys, layer: 'present', next: 0 };
  const goal = posts[posts.length - 1];
  for (let i = 0; i < MAX_STEPS * posts.length; i++) {
    if (!stepWitness(w, levels, posts, shifts, params)) {
      return false;
    }
    if (w.next === shifts.length && goal && postUnder(phys, posts) === goal) {
      return true;
    }
  }
  return false;
}
