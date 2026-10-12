import { ARCADE_CABLES as C } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import { spawnPosition, type LevelData } from '../level/LevelData';
import {
  copyWitness,
  exitCol,
  landsOn,
  levelText,
  pointAt,
  postUnder,
  type CableExit,
  type CablePiece,
  type Candidate,
  type Hitbox,
  type Path,
  type Piece,
  type PostPiece,
  type Witness,
} from './course';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import { mulberry32, ramp, seedOf } from './random';
import { ARCADE_ROOM_META } from './roomMeta';

export type { CableExit } from './course';

/** Un niveau des tyroliennes : son texte (format des salles, D-06) et ce qu'il contient. */
export interface CablesLevel {
  readonly text: string;
  /** Du départ au fanion (tuiles) : ce que vaut le niveau au compteur. */
  readonly lengthTiles: number;
  readonly cables: number;
  readonly posts: number;
  /** Difficulté du niveau (0 au premier, vers 1). */
  readonly difficulty: number;
}

/** Hauteur du haut des briques de jeu (px) : les toucher, c'est l'erreur. */
const HAZARD_TOP = (C.rows - 2) * T;
/** Colonnes vides laissées après la dernière pièce, pour suivre le chemin du témoin. */
const LOOKAHEAD_COLS = 48;
/** Pas de simulation au plus pour atteindre la pièce suivante. */
const MAX_STEPS = 2400;
/** Candidats essayés au plus pour une pièce. */
const MAX_TRIES = 12;
/** Pièces au plus dans un niveau (garde-fou : un câble qui ne se place jamais). */
const MAX_PIECES = 40;

/** Difficulté du niveau n (1, 2, 3…). */
export function cablesDifficulty(n: number): number {
  return 1 - Math.pow(C.difficultyRate, n - 1);
}

/** Nombre de câbles du niveau n. */
export function cablesCount(n: number): number {
  return Math.min(C.cables.max, C.cables.first + Math.floor((n - 1) / C.cables.every));
}

const input: PlayerInput = { moveX: 1, moveY: 0, jumpPressed: false, jumpHeld: false };

function decide(w: Witness, pieces: readonly Piece[], cables: readonly CablePiece[]): void {
  const phys = w.phys;
  const box = phys.box;
  input.moveX = 1;
  input.jumpPressed = false;
  if (w.pressNext) {
    w.pressNext = false;
    input.jumpPressed = true;
    input.jumpHeld = true;
    return;
  }
  if (phys.cable >= 0) {
    w.lastCable = phys.cable;
    input.jumpHeld = true;
    return;
  }
  if (w.lastCable >= 0) {
    const exit = cables[w.lastCable]?.exit;
    w.lastCable = -1;
    if (exit === 'jump') {
      input.jumpHeld = false;
      w.pressNext = true;
      return;
    }
  }
  const post = postUnder(phys, pieces);
  if (post) {
    const jump = !post.goal && box.x + box.width >= (post.col + post.width) * T - 2;
    input.jumpPressed = jump;
    input.jumpHeld = jump;
    return;
  }
  // Après un saut depuis le sol, le parapluie s'ouvre d'une nouvelle pression en l'air (D-62).
  if (!phys.glideOpen && phys.vy >= 0) {
    input.jumpHeld = false;
    w.pressNext = true;
    return;
  }
  input.jumpHeld = true;
}

function pathAfter(
  saved: Witness,
  level: LevelData,
  params: Readonly<MovementParams>,
  pieces: readonly Piece[],
  cables: readonly CablePiece[],
): Path {
  const w = copyWitness(saved, level, params);
  const last = pieces[pieces.length - 1];
  const cableIndex = cables.length - 1;
  const path: Path = { x: [], hookY: [], feetY: [] };
  let left = false;
  for (let i = 0; i < MAX_STEPS; i++) {
    decide(w, pieces, cables);
    w.phys.step(input);
    const box = w.phys.box;
    if (!left) {
      left = last?.kind === 'cable' ? w.phys.cable !== cableIndex : !w.phys.grounded;
      if (!left) {
        continue;
      }
    }
    if (box.y + box.height > HAZARD_TOP || w.phys.grounded) {
      break;
    }
    path.x.push(box.x + box.width / 2);
    path.hookY.push(box.y - params.cableHookAbovePx);
    path.feetY.push(box.y + box.height);
  }
  return path;
}

/**
 * Le crochet croise-t-il le câble de (x1, y1) à (x2, y2) en descendant (au-dessus au début, sur ou
 * sous lui ensuite) avant l'abscisse `xMax` ?
 */
function crosses(
  path: Path,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  xMax: number,
): boolean {
  const at = pointAt(path, x1);
  if (at < 0 || (path.hookY[at] ?? 0) > y1) {
    return false;
  }
  for (let i = at; i < path.x.length; i++) {
    const x = path.x[i] ?? 0;
    if (x > xMax) {
      break;
    }
    if ((path.hookY[i] ?? 0) >= y1 + ((y2 - y1) * (x - x1)) / (x2 - x1)) {
      return true;
    }
  }
  return false;
}

/**
 * Un raccourci qui fait manquer la pièce précédente : tolérée seulement si rien d'autre ne se place
 * (manquer un câble doit faire tomber).
 */
const SKIPPABLE = 1000;

/**
 * Câbles possibles après `from`, d'après le chemin du témoin (`path`). `skip` : le chemin de qui a
 * manqué la pièce précédente (null après un poteau).
 */
function cableCandidates(
  path: Path,
  skip: Path | null,
  from: Piece,
  d: number,
  random: () => number,
): Candidate<CablePiece>[] {
  const gap = Math.round(
    ramp(from.kind === 'cable' ? C.gapAfterCable : C.gapAfterPost, d) + random() * C.gapSpread,
  );
  const length = Math.max(3, Math.round(ramp(C.length, d) + random() * C.lengthSpread));
  const flat = random() < ramp(C.flatChance, d);
  const slope = C.slope.min + random() * (C.slope.max - C.slope.min);
  const dropWanted = flat ? 0 : Math.max(1, Math.round(length * slope));
  const slackTarget = ramp(C.slack, d) + random() * ramp(C.slackSpread, d);
  const ride = ramp(C.ride, d) * T;
  const out: Candidate<CablePiece>[] = [];
  for (let g = Math.max(1, gap); g >= 1; g--) {
    const c1 = exitCol(from) + g;
    const c2 = c1 + length;
    const x1 = c1 * T + T / 2;
    const x2 = c2 * T + T / 2;
    const at = pointAt(path, x1);
    if (at < 0) {
      continue;
    }
    const hook1 = path.hookY[at] ?? 0;
    for (let drop = dropWanted; drop >= 0; drop--) {
      for (let r1 = C.cableRows.min; r1 + drop <= C.cableRows.max; r1++) {
        const y1 = r1 * T + T / 2;
        const slack = y1 - hook1;
        if (slack < C.minSlackPx) {
          continue;
        }
        const y2 = (r1 + drop) * T + T / 2;
        // Le crochet doit croiser le câble assez tôt pour laisser le temps de réagir.
        if (!crosses(path, x1, y1, x2, y2, x2 - ride)) {
          continue;
        }
        const skippable = skip !== null && crosses(skip, x1, y1, x2, y2, x2);
        out.push({
          piece: { kind: 'cable', c1, r1, c2, r2: r1 + drop, exit: 'ride' },
          score:
            Math.abs(slack - slackTarget) +
            4 * (dropWanted - drop) +
            8 * (gap - g) +
            (skippable ? SKIPPABLE : 0),
        });
      }
    }
  }
  return out.sort((a, b) => a.score - b.score).slice(0, MAX_TRIES);
}

function postCandidates(
  path: Path,
  skip: Path | null,
  from: Piece,
  d: number,
  random: () => number,
  goal: boolean,
  minCol: number,
  hitbox: Hitbox,
): Candidate<PostPiece>[] {
  const wanted = exitCol(from) + Math.round(ramp(C.gapBeforePost, d) + random() * C.gapSpread);
  const width = goal ? C.goalWidth : Math.max(2, Math.round(ramp(C.postWidth, d) + random()));
  const slackTarget = ramp(C.slack, d) + random() * ramp(C.slackSpread, d);
  const out: Candidate<PostPiece>[] = [];
  const first = Math.max(minCol, exitCol(from) + 1);
  for (let col = Math.max(first, wanted); col >= first; col--) {
    // Le bord droit de Céleste arrive au-dessus du coin du poteau ; elle s'y pose en planant.
    const at = pointAt(path, col * T - hitbox.width / 2);
    if (at < 0) {
      continue;
    }
    const feet = path.feetY[at] ?? 0;
    for (let top = C.postRows.min; top <= C.postRows.max; top++) {
      const slack = top * T - feet;
      if (slack < C.minSlackPx || !landsOn(path, col, width, top, hitbox)) {
        continue;
      }
      const skippable = skip !== null && landsOn(skip, col, width, top, hitbox);
      out.push({
        piece: { kind: 'post', col, width, top, goal },
        score:
          Math.abs(slack - slackTarget) + 8 * Math.abs(wanted - col) + (skippable ? SKIPPABLE : 0),
      });
    }
  }
  return out.sort((a, b) => a.score - b.score).slice(0, MAX_TRIES);
}

/** Le témoin atteint-il la nouvelle pièce (accroché assez tôt, ou posé dessus) ? */
function reach(
  saved: Witness,
  level: LevelData,
  params: Readonly<MovementParams>,
  pieces: readonly Piece[],
  cables: readonly CablePiece[],
): Witness | null {
  const w = copyWitness(saved, level, params);
  const piece = pieces[pieces.length - 1];
  for (let i = 0; i < MAX_STEPS; i++) {
    decide(w, pieces, cables);
    w.phys.step(input);
    const box = w.phys.box;
    if (box.y + box.height > HAZARD_TOP) {
      return null;
    }
    if (piece?.kind === 'cable' && w.phys.cable === cables.length - 1) {
      return box.x + box.width / 2 <= piece.c2 * T - T / 2 ? w : null;
    }
    if (piece?.kind === 'post' && postUnder(w.phys, pieces) === piece) {
      return w;
    }
  }
  return null;
}

/** Où finit le vol plané depuis le poteau qu'on vient d'atteindre, sans aucun câble (px). */
function glideReach(path: Path): number {
  return (path.x[path.x.length - 1] ?? 0) + 2 * T;
}

/**
 * Le niveau n des tyroliennes (D-166), toujours le même : graine fixe, et chaque pièce placée
 * d'après le chemin du témoin (la vraie physique, la phase du jeu) puis vérifiée par lui. Un poteau
 * n'est jamais à portée du vol plané depuis le précédent : il faut passer par les câbles. Les tests
 * mesurent ensuite chaque niveau avec l'analyse de faisabilité (D-16).
 */
export function generateCablesLevel(
  n: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): CablesLevel {
  const random = mulberry32(seedOf(`cables:${String(n)}`));
  const d = cablesDifficulty(n);
  const header = [
    `; Console (D-166) : les tyroliennes, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: Tyroliennes · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
  const pieces: Piece[] = [
    { kind: 'post', col: 1, width: C.start.width, top: C.start.top, goal: false },
  ];
  const cables: CablePiece[] = [];
  const parse = (list: readonly Piece[]) => {
    const last = list[list.length - 1];
    const width = (last ? exitCol(last) : 0) + LOOKAHEAD_COLS;
    return parseAsciiLevel(`arcade-cables-${String(n)}`, levelText(list, width, C.rows, header));
  };
  let level = parse(pieces);
  const spawn = spawnPosition(level, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(level, params, spawn.x, spawn.y, hitbox);
  phys.canGlide = true;
  phys.canHook = true;
  let saved: Witness = { phys, pressNext: false, lastCable: -1 };
  /** Chemin qui a servi à placer la dernière pièce : celui de qui la manque (null : un poteau). */
  let skip: Path | null = null;

  /** `first` : le dernier câble est le premier de son enchaînement (le seul d'où l'on saute). */
  const tryCable = (last: Piece, first: boolean): boolean => {
    const exits: CableExit[] =
      last.kind === 'cable' && first
        ? random() < ramp(C.jumpExitChance, d)
          ? ['jump', 'ride']
          : ['ride', 'jump']
        : ['ride'];
    for (const exit of exits) {
      if (last.kind === 'cable') {
        last.exit = exit;
      }
      const path = pathAfter(saved, level, params, pieces, cables);
      for (const { piece } of cableCandidates(path, skip, last, d, random)) {
        const next = parse([...pieces, piece]);
        const placed = reach(saved, next, params, [...pieces, piece], [...cables, piece]);
        if (placed) {
          pieces.push(piece);
          cables.push(piece);
          level = next;
          saved = placed;
          skip = path;
          return true;
        }
      }
    }
    if (last.kind === 'cable') {
      last.exit = 'ride';
    }
    return false;
  };
  const tryPost = (last: Piece, goal: boolean, minCol: number): boolean => {
    const path = pathAfter(saved, level, params, pieces, cables);
    for (const { piece } of postCandidates(path, skip, last, d, random, goal, minCol, hitbox)) {
      const next = parse([...pieces, piece]);
      const placed = reach(saved, next, params, [...pieces, piece], cables);
      if (placed) {
        pieces.push(piece);
        level = next;
        saved = placed;
        skip = null;
        return true;
      }
    }
    return false;
  };

  let cablesLeft = cablesCount(n);
  const newChain = () => 1 + Math.floor(random() * Math.round(ramp(C.chain, d)));
  let chainMin = newChain();
  let chain = 0;
  let reachCol = Math.ceil(glideReach(pathAfter(saved, level, params, pieces, cables)) / T);
  for (;;) {
    const last = pieces[pieces.length - 1];
    if (!last || pieces.length > MAX_PIECES) {
      throw new Error(`Tyroliennes, niveau ${String(n)} : trop de pièces`);
    }
    const goal = cablesLeft <= 0;
    let post = false;
    if (chain >= chainMin && tryPost(last, goal, reachCol)) {
      post = true;
    } else if (tryCable(last, chain === 1)) {
      cablesLeft--;
      chain++;
      continue;
    } else if (tryPost(last, goal, 0)) {
      // Aucun câble ne se place ici : un poteau, même à portée du précédent (rare).
      post = true;
    }
    if (!post) {
      throw new Error(
        `Tyroliennes, niveau ${String(n)} : aucune pièce ne se place après ${String(pieces.length)}`,
      );
    }
    if (goal) {
      break;
    }
    chain = 0;
    chainMin = newChain();
    reachCol = Math.ceil(glideReach(pathAfter(saved, level, params, pieces, cables)) / T);
  }

  const goal = pieces[pieces.length - 1];
  const width = goal ? exitCol(goal) + 1 : LOOKAHEAD_COLS;
  const text = levelText(pieces, width, C.rows, header);
  const start = pieces[0];
  const spawnCol = start?.kind === 'post' ? start.col + 1 : 0;
  const goalCol = goal?.kind === 'post' ? goal.col + Math.floor(goal.width / 2) : spawnCol;
  return {
    text,
    lengthTiles: goalCol - spawnCol,
    cables: cables.length,
    posts: pieces.filter((p) => p.kind === 'post').length - 2,
    difficulty: d,
  };
}
