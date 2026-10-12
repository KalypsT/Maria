import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import type { LevelData } from '../level/LevelData';
import { PlayerPhysics } from '../player/PlayerPhysics';

/**
 * Ce que partagent les générateurs de la console (D-166) : les pièces d'un niveau (poteaux, câbles),
 * leur texte au format des salles (D-06), le témoin (un joueur scripté qui utilise la vraie
 * physique) et son chemin.
 */

export type Hitbox = Readonly<{ width: number; height: number }>;

/**
 * Sortie d'un câble par le témoin : tenu jusqu'au bout (`ride`), ou, au bout, Saut lâché puis
 * rappuyé (`jump`, le saut depuis le câble). Comme l'analyse de faisabilité (D-65), un saut ne se
 * fait que depuis le premier câble d'un enchaînement ; les suivants se tiennent jusqu'au bout.
 */
export type CableExit = 'ride' | 'jump';

export interface PostPiece {
  readonly kind: 'post';
  readonly col: number;
  readonly width: number;
  /** Ligne du haut du poteau (il descend jusqu'aux briques de jeu). */
  readonly top: number;
  readonly goal: boolean;
}

export interface CablePiece {
  readonly kind: 'cable';
  readonly c1: number;
  readonly r1: number;
  readonly c2: number;
  readonly r2: number;
  /** Décidée en plaçant la pièce suivante. */
  exit: CableExit;
}

export type Piece = PostPiece | CablePiece;

/**
 * Le texte d'un niveau (format des salles, D-06) : un cadre, les briques de jeu sur la dernière
 * ligne, les poteaux jusqu'en bas, les câbles. `wellDepth` (la grimpette) : entre deux poteaux, les
 * briques de jeu remontent à cette profondeur sous le plus bas des deux (pas de longue chute).
 */
export function levelText(
  pieces: readonly Piece[],
  width: number,
  rows: number,
  header: readonly string[],
  wellDepth = 0,
): string {
  const hazardRow = rows - 2;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const fill = r === 0 || r === rows - 1 ? '#' : r === hazardRow ? '^' : '.';
    const line = new Array<string>(width).fill(fill);
    line[0] = '#';
    line[width - 1] = '#';
    grid.push(line);
  }
  const cables: string[] = [];
  for (const p of pieces) {
    if (p.kind === 'cable') {
      cables.push(`; @cable: ${String(p.c1)} ${String(p.r1)} ${String(p.c2)} ${String(p.r2)}`);
      continue;
    }
    for (let r = p.top; r <= hazardRow; r++) {
      const line = grid[r];
      for (let c = p.col; c < p.col + p.width && line; c++) {
        line[c] = 'b';
      }
    }
    if (p.goal) {
      const line = grid[p.top - 1];
      if (line) {
        line[p.col + Math.floor(p.width / 2)] = 'G';
      }
    }
  }
  if (wellDepth > 0) {
    let previous: PostPiece | null = null;
    for (const p of pieces) {
      if (p.kind !== 'post') {
        continue;
      }
      if (previous) {
        const floor = Math.min(hazardRow, Math.max(previous.top, p.top) + wellDepth);
        for (let c = previous.col + previous.width; c < p.col; c++) {
          for (let r = floor; r <= hazardRow; r++) {
            const line = grid[r];
            if (line) {
              line[c] = r === floor ? '^' : '#';
            }
          }
        }
      }
      previous = p;
    }
  }
  const start = pieces[0];
  if (start?.kind === 'post') {
    const line = grid[start.top - 1];
    if (line) {
      line[start.col + 1] = 'P';
    }
  }
  return [...header, ...cables, ...grid.map((line) => line.join(''))].join('\n');
}

/**
 * Le témoin : un joueur scripté qui prouve, avec la vraie physique, que chaque pièce se passe. Il
 * pousse toujours vers la droite et ne fait que des gestes que l'analyse de faisabilité connaît :
 * sauter au bord d'un poteau, ouvrir le parapluie au sommet, le tenir, sortir d'un câble au bout
 * ou en sautant.
 */
export interface Witness {
  readonly phys: PlayerPhysics;
  /** Presser Saut au pas suivant (lâcher, puis rappuyer : le parapluie, le saut depuis un câble). */
  pressNext: boolean;
  /** Câble tenu au pas précédent (-1 : aucun) : sa sortie se joue au pas où il le quitte. */
  lastCable: number;
}

export function postUnder(phys: PlayerPhysics, pieces: readonly Piece[]): PostPiece | null {
  if (!phys.grounded) {
    return null;
  }
  const box = phys.box;
  const feet = box.y + box.height;
  for (const p of pieces) {
    if (
      p.kind === 'post' &&
      p.top * T === feet &&
      box.x < (p.col + p.width) * T &&
      box.x + box.width > p.col * T
    ) {
      return p;
    }
  }
  return null;
}

export function copyWitness(
  w: Witness,
  level: LevelData,
  params: Readonly<MovementParams>,
): Witness {
  const phys = new PlayerPhysics(level, params, w.phys.box.x, w.phys.box.y, w.phys.box);
  phys.copyFrom(w.phys);
  // La salle grandit devant Céleste seulement : même état, nouvelle collision.
  phys.shiftTo(level, 0);
  return { phys, pressNext: w.pressNext, lastCable: w.lastCable };
}

/** Chemin du témoin après la dernière pièce (rien devant lui) : le crochet et les pieds, par x. */
export interface Path {
  readonly x: number[];
  readonly hookY: number[];
  readonly feetY: number[];
}

/** Premier point du chemin à l'abscisse x ou après (-1 : le chemin s'arrête avant). */
export function pointAt(path: Path, x: number): number {
  for (let i = 0; i < path.x.length; i++) {
    if ((path.x[i] ?? 0) >= x) {
      return i;
    }
  }
  return -1;
}

export interface Candidate<P extends Piece> {
  readonly piece: P;
  readonly score: number;
}

/** Les pieds se posent-ils sur le haut du poteau (passés au-dessus du coin, puis dessus) ? */
export function landsOn(
  path: Path,
  col: number,
  width: number,
  top: number,
  hitbox: Hitbox,
): boolean {
  const at = pointAt(path, col * T - hitbox.width / 2);
  if (at < 0 || (path.feetY[at] ?? 0) > top * T) {
    return false;
  }
  const end = (col + width) * T + hitbox.width / 2 - 4;
  for (let i = at; i < path.x.length && (path.x[i] ?? 0) <= end; i++) {
    if ((path.feetY[i] ?? 0) >= top * T) {
      return true;
    }
  }
  return false;
}

export function exitCol(piece: Piece): number {
  return piece.kind === 'cable' ? piece.c2 : piece.col + piece.width;
}
