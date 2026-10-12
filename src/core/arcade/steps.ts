import type { StepsTuning } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import { spawnPosition, type LevelData } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import {
  copyWitness,
  exitCol,
  levelText,
  postUnder,
  type Hitbox,
  type Piece,
  type PostPiece,
  type Witness,
} from './course';
import { mulberry32, ramp, seedOf } from './random';
import type { EndlessChunk } from './endless';
import { ARCADE_ROOM_META } from './roomMeta';

/** Un niveau des sauts ou de la grimpette : son texte et ce qu'il contient. */
export interface StepsLevel {
  readonly text: string;
  /** Du départ au fanion (tuiles) : ce que vaut le niveau au compteur. */
  readonly lengthTiles: number;
  readonly posts: number;
  readonly difficulty: number;
}

/** Colonnes vides laissées après le dernier poteau, pendant la génération. */
const LOOKAHEAD_COLS = 24;
/** Pas de simulation au plus pour atteindre le poteau suivant. */
const MAX_STEPS = 1200;
/** Candidats essayés au plus pour un poteau. */
const MAX_TRIES = 16;
/** Écart le plus grand essayé (tuiles). */
const MAX_GAP = 8;
/** Profondeur des puits de la grimpette, sous le plus bas des deux poteaux (tuiles). */
const WELL_DEPTH = 5;

/** Difficulté du niveau n (1, 2, 3…). */
export function stepsDifficulty(tuning: StepsTuning, n: number): number {
  return 1 - Math.pow(tuning.difficultyRate, n - 1);
}

/** Nombre de poteaux du niveau n (sans le départ ni le fanion). */
export function stepsCount(tuning: StepsTuning, n: number): number {
  return Math.min(tuning.posts.max, tuning.posts.first + Math.floor((n - 1) / tuning.posts.every));
}

const input: PlayerInput = { moveX: 1, moveY: 0, jumpPressed: false, jumpHeld: false };

/**
 * Le témoin des sauts et de la grimpette : il court vers la droite et saute, tenu, au bord du
 * poteau ; un rebord trop haut, il s'y accroche et se hisse en poussant vers lui (D-26).
 */
function decide(w: Witness, pieces: readonly Piece[]): void {
  const phys = w.phys;
  const box = phys.box;
  input.moveX = 1;
  input.jumpPressed = false;
  const post = postUnder(phys, pieces);
  if (post) {
    const jump = !post.goal && box.x + box.width >= (post.col + post.width) * T - 2;
    input.jumpPressed = jump;
    input.jumpHeld = jump;
    return;
  }
  input.jumpHeld = true;
}

/** Le témoin atteint-il le dernier poteau de `pieces` (posé dessus), sans toucher un danger ? */
function reach(
  saved: Witness,
  level: LevelData,
  params: Readonly<MovementParams>,
  pieces: readonly Piece[],
): Witness | null {
  const w = copyWitness(saved, level, params);
  const target = pieces[pieces.length - 1];
  for (let i = 0; i < MAX_STEPS; i++) {
    decide(w, pieces);
    w.phys.step(input);
    if (touchesHazard(level, w.phys.box)) {
      return null;
    }
    if (target && postUnder(w.phys, pieces) === target) {
      return w;
    }
  }
  return null;
}

/** Ce que demande la pose des poteaux : un niveau, ou un morceau du mode Sans fin. */
interface StepsBuild {
  readonly key: string;
  readonly name: string;
  /** Le niveau (sa difficulté, son nombre de poteaux) ; le morceau n a celui du niveau n. */
  readonly n: number;
  /** La graine. */
  readonly seed: string;
  readonly tuning: StepsTuning;
  readonly params: Readonly<MovementParams>;
  readonly hitbox: Hitbox;
  readonly abilities: readonly string[];
  readonly header: readonly string[];
  /**
   * Le dernier poteau : le fanion (sa hauteur suit la difficulté), ou une jointure du mode Sans fin
   * (D-167) : un poteau comme celui du départ, à sa hauteur.
   */
  readonly seam: boolean;
}

/**
 * Les poteaux, du départ au dernier : chacun gardé seulement si le témoin (la vraie physique, la
 * phase du jeu) s'y pose depuis le précédent. La difficulté vise un écart, une différence de
 * hauteur et une largeur ; un poteau trop dur pour le témoin cède la place au candidat suivant,
 * plus facile.
 */
function placePosts(b: StepsBuild): PostPiece[] {
  const { tuning, params, hitbox, abilities, n } = b;
  const random = mulberry32(seedOf(b.seed));
  const d = stepsDifficulty(tuning, n);
  const wells = tuning.upOnly ? WELL_DEPTH : 0;
  const pieces: PostPiece[] = [
    { kind: 'post', col: 1, width: tuning.start.width, top: tuning.start.top, goal: false },
  ];
  const parse = (list: readonly Piece[]) => {
    const last = list[list.length - 1];
    const width = (last ? exitCol(last) : 0) + LOOKAHEAD_COLS;
    return parseAsciiLevel(
      `arcade-${b.key}-${String(n)}`,
      levelText(list, width, tuning.rows, b.header, wells),
    );
  };
  const level = parse(pieces);
  const spawn = spawnPosition(level, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(level, params, spawn.x, spawn.y, hitbox);
  phys.canClimb = abilities.includes('climb');
  let saved: Witness = { phys, pressNext: false, lastCable: -1 };
  /** Le témoin sur l'avant-dernier poteau, et la salle d'alors : de quoi tester un raccourci. */
  let before: { witness: Witness; pieces: Piece[] } | null = null;

  const count = stepsCount(tuning, n);
  for (let i = 0; i <= count; i++) {
    const last = i === count;
    const goal = last && !b.seam;
    const prev = pieces[pieces.length - 1];
    if (!prev) {
      break;
    }
    const gapWanted = ramp(tuning.gap, d) + random() * tuning.gapSpread;
    const riseSize = ramp(tuning.rise, d) * (0.5 + random() * 0.5);
    const riseWanted = tuning.upOnly || random() < 0.5 ? riseSize : -riseSize;
    const width = goal
      ? tuning.goalWidth
      : last
        ? tuning.start.width
        : Math.max(1, Math.round(ramp(tuning.width, d) + random() * tuning.widthSpread));
    const candidates: { piece: PostPiece; score: number }[] = [];
    for (let gap = 1; gap <= MAX_GAP; gap++) {
      for (let top = tuning.postRows.min; top <= tuning.postRows.max; top++) {
        const rise = prev.top - top;
        if ((tuning.upOnly && rise < 0) || (last && b.seam && top !== tuning.start.top)) {
          continue;
        }
        candidates.push({
          piece: { kind: 'post', col: exitCol(prev) + gap, width, top, goal },
          score: Math.abs(gap - gapWanted) + 1.5 * Math.abs(rise - riseWanted),
        });
      }
    }
    candidates.sort((a, c) => a.score - c.score);
    type Placed = { witness: Witness; piece: PostPiece };
    let placed: Placed | null = null;
    let fallback: Placed | null = null;
    for (const { piece } of candidates.slice(0, MAX_TRIES * 4)) {
      const list = [...pieces, piece];
      const next = parse(list);
      const witness = reach(saved, next, params, list);
      if (!witness) {
        continue;
      }
      // Sauter par-dessus le poteau précédent ne doit pas suffire.
      const skip = before ? [...before.pieces, piece] : null;
      if (skip && before && reach(before.witness, parse(skip), params, skip)) {
        fallback ??= { witness, piece };
        continue;
      }
      placed = { witness, piece };
      break;
    }
    placed ??= fallback;
    if (!placed) {
      throw new Error(
        `${b.name}, niveau ${String(n)} : aucun poteau ne se place après ${String(i)}`,
      );
    }
    before = { witness: saved, pieces: [...pieces] };
    pieces.push(placed.piece);
    saved = placed.witness;
  }
  return pieces;
}

/**
 * Un niveau des sauts ou de la grimpette (D-166), toujours le même : une graine fixe, les poteaux
 * posés un à un par le témoin (`placePosts`), le fanion sur le dernier. Les tests mesurent ensuite
 * chaque niveau avec l'analyse de faisabilité (D-16).
 */
export function generateStepsLevel(
  key: string,
  name: string,
  n: number,
  tuning: StepsTuning,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): StepsLevel {
  const header = [
    `; Console (D-166) : ${name.toLowerCase()}, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: ${name} · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
  const pieces = placePosts({
    key,
    name,
    n,
    seed: `${key}:${String(n)}`,
    tuning,
    params,
    hitbox,
    abilities,
    header,
    seam: false,
  });
  const wells = tuning.upOnly ? WELL_DEPTH : 0;
  // La grimpette : la salle recadrée au-dessus du poteau le plus haut.
  const highest = Math.min(...pieces.map((p) => p.top));
  const cut = tuning.upOnly ? Math.max(0, highest - tuning.headroom) : 0;
  const shown = pieces.map((p) => ({ ...p, top: p.top - cut }));
  const goal = shown[shown.length - 1];
  const width = goal ? exitCol(goal) + 1 : LOOKAHEAD_COLS;
  const start = shown[0];
  const spawnCol = start ? start.col + 1 : 0;
  const goalCol = goal ? goal.col + Math.floor(goal.width / 2) : spawnCol;
  return {
    text: levelText(shown, width, tuning.rows - cut, header, wells),
    lengthTiles: goalCol - spawnCol,
    posts: stepsCount(tuning, n),
    difficulty: stepsDifficulty(tuning, n),
  };
}

/**
 * Un morceau des sauts pour le mode Sans fin (D-167) : de la jointure de départ (comprise) à la
 * suivante (non comprise), qui ouvre le morceau d'après. Les poteaux sont posés comme ceux du niveau
 * `level` (sa difficulté, son nombre de poteaux), avec une graine propre à la partie et au morceau.
 */
export function generateStepsChunk(
  key: string,
  name: string,
  index: number,
  level: number,
  runSeed: number,
  tuning: StepsTuning,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): EndlessChunk {
  if (tuning.upOnly) {
    throw new Error(`${name} : pas encore de morceaux vers le haut`);
  }
  const pieces = placePosts({
    key,
    name,
    n: level,
    seed: `endless:${key}:${String(runSeed)}:${String(index)}`,
    tuning,
    params,
    hitbox,
    abilities,
    header: [],
    seam: true,
  });
  const next = pieces[pieces.length - 1];
  const end = next ? next.col : 1;
  const lines = levelText(pieces.slice(0, -1), end + 1, tuning.rows, [])
    .split('\n')
    .map((line) => line.slice(1, end).replace('P', '.'));
  return {
    index,
    level,
    lines,
    width: end - 1,
    difficulty: stepsDifficulty(tuning, level),
    posts: pieces.slice(0, -1).map((p) => ({ ...p, col: p.col - 1 })),
    exitTop: tuning.start.top,
  };
}

/**
 * Le témoin des sauts traverse-t-il toute la salle, du départ au dernier poteau de `posts`, sans
 * toucher un danger (les tests : des morceaux collés, D-167) ?
 */
export function crossSteps(
  level: LevelData,
  posts: readonly PostPiece[],
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): boolean {
  const spawn = spawnPosition(level, hitbox.width, hitbox.height);
  const w: Witness = {
    phys: new PlayerPhysics(level, params, spawn.x, spawn.y, hitbox),
    pressNext: false,
    lastCable: -1,
  };
  const target = posts[posts.length - 1];
  for (let i = 0; i < MAX_STEPS * posts.length; i++) {
    decide(w, posts);
    w.phys.step(input);
    if (touchesHazard(level, w.phys.box)) {
      return false;
    }
    if (target && postUnder(w.phys, posts) === target) {
      return true;
    }
  }
  return false;
}
