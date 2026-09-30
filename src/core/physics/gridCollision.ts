import { TILE_SIZE } from '../../config/display';
import { HAZARD_INSET_PX } from '../../config/world';
import { Tile, tileAt, type LevelData } from '../level/LevelData';

/** Rectangle aligné sur les axes (coin haut gauche, px). Occupe [x, x + width) × [y, y + height). */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Rectangle mobile. Le déplacement demandé est lu dans `dx` / `dy` plutôt que passé en argument :
 * V8 alloue sur le tas un flottant passé à une fonction non inlinée, pas un flottant écrit en place
 * dans un champ (objectif : aucune allocation par pas de simulation).
 */
export interface MovingBox extends Box {
  dx: number;
  dy: number;
  /** Vrai : les plateformes traversables sont ignorées (descente volontaire). */
  passOneWay: boolean;
}

export const HitY = { None: 0, Floor: 1, Ceiling: 2 } as const;
export type HitY = (typeof HitY)[keyof typeof HitY];

/**
 * Tolérance des bords : un rectangle posé exactement sur une frontière de tuile n'occupe pas la
 * tuile suivante. C'est ce qui évite l'accrochage aux jointures entre tuiles (sol, murs).
 */
const EDGE_EPSILON = 1e-6;
/** Tolérance de détection du sol. */
const GROUND_EPSILON = 1e-4;

function firstRow(box: Box): number {
  return Math.floor(box.y / TILE_SIZE);
}
function lastRow(box: Box): number {
  return Math.floor((box.y + box.height - EDGE_EPSILON) / TILE_SIZE);
}
function firstCol(box: Box): number {
  return Math.floor(box.x / TILE_SIZE);
}
function lastCol(box: Box): number {
  return Math.floor((box.x + box.width - EDGE_EPSILON) / TILE_SIZE);
}

function columnBlocked(level: LevelData, col: number, rowFrom: number, rowTo: number): boolean {
  for (let row = rowFrom; row <= rowTo; row++) {
    if (tileAt(level, col, row) === Tile.Solid) {
      return true;
    }
  }
  return false;
}

function rowBlocked(
  level: LevelData,
  row: number,
  colFrom: number,
  colTo: number,
  includeOneWay: boolean,
): boolean {
  for (let col = colFrom; col <= colTo; col++) {
    const tile = tileAt(level, col, row);
    if (tile === Tile.Solid || (includeOneWay && tile === Tile.OneWay)) {
      return true;
    }
  }
  return false;
}

/**
 * Déplace de `box.dx` en balayant toutes les colonnes traversées (aucune traversée possible,
 * quelle que soit la vitesse). Retourne vrai si un mur a arrêté le déplacement.
 */
export function moveX(level: LevelData, box: MovingBox): boolean {
  const dx = box.dx;
  if (dx === 0) {
    return false;
  }
  const rowFrom = firstRow(box);
  const rowTo = lastRow(box);
  if (dx > 0) {
    const right = box.x + box.width;
    const colTo = Math.floor((right + dx - EDGE_EPSILON) / TILE_SIZE);
    for (let col = Math.floor((right - EDGE_EPSILON) / TILE_SIZE) + 1; col <= colTo; col++) {
      if (columnBlocked(level, col, rowFrom, rowTo)) {
        box.x = col * TILE_SIZE - box.width;
        return true;
      }
    }
  } else {
    const colTo = Math.floor((box.x + dx) / TILE_SIZE);
    for (let col = firstCol(box) - 1; col >= colTo; col--) {
      if (columnBlocked(level, col, rowFrom, rowTo)) {
        box.x = (col + 1) * TILE_SIZE;
        return true;
      }
    }
  }
  box.x += dx;
  return false;
}

/**
 * Déplace de `box.dy` en balayant toutes les lignes traversées. En descente, une plateforme
 * traversable bloque seulement si le bas du rectangle était au-dessus d'elle avant le pas ; en
 * montée, elle ne bloque jamais.
 */
export function moveY(level: LevelData, box: MovingBox): HitY {
  const dy = box.dy;
  if (dy === 0) {
    return HitY.None;
  }
  const colFrom = firstCol(box);
  const colTo = lastCol(box);
  if (dy > 0) {
    const bottom = box.y + box.height;
    const rowTo = Math.floor((bottom + dy - EDGE_EPSILON) / TILE_SIZE);
    for (let row = Math.floor((bottom - EDGE_EPSILON) / TILE_SIZE) + 1; row <= rowTo; row++) {
      if (rowBlocked(level, row, colFrom, colTo, !box.passOneWay)) {
        box.y = row * TILE_SIZE - box.height;
        return HitY.Floor;
      }
    }
  } else {
    const rowTo = Math.floor((box.y + dy) / TILE_SIZE);
    for (let row = firstRow(box) - 1; row >= rowTo; row--) {
      if (rowBlocked(level, row, colFrom, colTo, false)) {
        box.y = (row + 1) * TILE_SIZE;
        return HitY.Ceiling;
      }
    }
  }
  box.y += dy;
  return HitY.None;
}

/** Vrai si le rectangle repose exactement sur un sol plein, ou aussi traversable si demandé. */
export function isGrounded(level: LevelData, box: Box, includeOneWay = true): boolean {
  const bottom = box.y + box.height;
  const row = Math.round(bottom / TILE_SIZE);
  if (Math.abs(bottom - row * TILE_SIZE) > GROUND_EPSILON) {
    return false;
  }
  return rowBlocked(level, row, firstCol(box), lastCol(box), includeOneWay);
}

/** Vrai si le rectangle ne chevauche aucune tuile pleine (les traversables sont ignorées). */
/**
 * Vrai si la hitbox, réduite de `HAZARD_INSET_PX` de chaque côté, touche une tuile de danger (D-21),
 * orties ou ronces (l'analyse de faisabilité et l'escalade évitent les deux).
 */
export function touchesHazard(level: LevelData, box: Box): boolean {
  return touchesTile(level, box, Tile.Hazard) || touchesTile(level, box, Tile.Thorns);
}

/** Même contact, avec une seule sorte de danger (orties ou ronces, D-51). */
export function touchesTile(level: LevelData, box: Box, kind: Tile): boolean {
  const inset = HAZARD_INSET_PX;
  const colFrom = Math.floor((box.x + inset) / TILE_SIZE);
  const colTo = Math.floor((box.x + box.width - inset - EDGE_EPSILON) / TILE_SIZE);
  const rowFrom = Math.floor((box.y + inset) / TILE_SIZE);
  const rowTo = Math.floor((box.y + box.height - inset - EDGE_EPSILON) / TILE_SIZE);
  for (let row = rowFrom; row <= rowTo; row++) {
    for (let col = colFrom; col <= colTo; col++) {
      if (tileAt(level, col, row) === kind) {
        return true;
      }
    }
  }
  return false;
}

export function isBoxFree(level: LevelData, box: Box): boolean {
  const colFrom = firstCol(box);
  const colTo = lastCol(box);
  const rowTo = lastRow(box);
  for (let row = firstRow(box); row <= rowTo; row++) {
    if (rowBlocked(level, row, colFrom, colTo, false)) {
      return false;
    }
  }
  return true;
}
