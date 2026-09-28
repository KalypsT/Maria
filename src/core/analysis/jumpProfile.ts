import { TILE_SIZE as T } from '../../config/display';
import { PLAYER_HITBOX, deriveMovement, type MovementParams } from '../../config/movement';
import type { LevelData } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import { movesFrom } from './analyzeLevel';
import { findSurfaces, surfaceUnder } from './surfaces';

/** Plus grand trou franchissable pour un dénivelé donné. */
export interface GapLimit {
  /** Dénivelé en tuiles : positif = arrivée plus haute que le départ. */
  readonly riseTiles: number;
  /** Plus grand trou franchissable (tuiles), 0 si aucun. */
  readonly maxGapTiles: number;
  /** Fenêtre de timing sur ce plus grand trou (ms). */
  readonly windowMs: number;
}

/** Ce que Céleste peut franchir avec des paramètres donnés (décision D-16). */
export interface JumpProfile {
  /** Hauteur atteinte par les pieds lors d'un saut complet (px). */
  readonly apexPx: number;
  /** Plus haute corniche atteignable (tuiles entières). */
  readonly maxRiseTiles: number;
  /** Durée d'un saut complet sur sol plat, du décollage à l'atterrissage (ms). */
  readonly airtimeMs: number;
  /** Distance horizontale d'un saut complet en courant sur sol plat (px). */
  readonly runningJumpDistancePx: number;
  /** Plus grand trou par dénivelé, du plus haut au plus bas. */
  readonly gaps: readonly GapLimit[];
}

/** Dénivelé le plus bas étudié (tuiles). */
const LOWEST_RISE = -6;
/** Longueur de la piste d'élan (tuiles) : la vitesse maximale est atteinte en moins d'une tuile. */
const RUNWAY_TILES = 6;
const LANDING_TILES = 8;
const MAX_GAP_TILES = 20;

/**
 * Salle canonique : piste d'élan, trou de `gapTiles`, plateforme d'arrivée `riseTiles` plus haut,
 * fosse profonde en dessous (on ne peut pas remonter de la fosse vers l'arrivée).
 */
export function gapLevel(gapTiles: number, riseTiles: number, apexTiles: number): LevelData {
  const headroom = Math.ceil(apexTiles) + 4;
  const runwayRow = headroom + 1 + Math.max(0, riseTiles);
  const landingRow = runwayRow - riseTiles;
  const pitRow = Math.max(runwayRow, landingRow) + Math.ceil(apexTiles) + 3;
  const height = pitRow + 2;
  const width = 1 + RUNWAY_TILES + gapTiles + LANDING_TILES + 1;
  const landingStart = 1 + RUNWAY_TILES + gapTiles;
  const rows: string[] = [];
  for (let row = 0; row < height; row++) {
    let line = '';
    for (let col = 0; col < width; col++) {
      const border = row === 0 || row >= pitRow || col === 0 || col === width - 1;
      const runway = col >= 1 && col <= RUNWAY_TILES && row >= runwayRow;
      const landing =
        col >= landingStart && col < landingStart + LANDING_TILES && row >= landingRow;
      if (border || runway || landing) {
        line += '#';
      } else if (row === runwayRow - 1 && col === 1) {
        line += 'P';
      } else if (row === landingRow - 1 && col === landingStart + LANDING_TILES - 1) {
        line += 'G';
      } else {
        line += '.';
      }
    }
    rows.push(line);
  }
  return parseAsciiLevel(`gap-${gapTiles}-${riseTiles}`, rows.join('\n'));
}

/** Fenêtre (ms) du saut direct de la piste à l'arrivée d'une salle canonique ; 0 si impossible. */
export function gapWindowMs(
  gapTiles: number,
  riseTiles: number,
  params: Readonly<MovementParams>,
): number {
  const derived = deriveMovement(params);
  const apexTiles = (derived.jumpVelocity * derived.jumpVelocity) / (2 * derived.riseGravity) / T;
  const level = gapLevel(gapTiles, riseTiles, apexTiles);
  const map = findSurfaces(level, PLAYER_HITBOX.height);
  const start = surfaceUnder(level, map, level.spawn.col, level.spawn.row);
  const goal = level.goal ? surfaceUnder(level, map, level.goal.col, level.goal.row) : -1;
  const direct = movesFrom(level, params, map, start).find((move) => move.to === goal);
  return direct?.windowMs ?? 0;
}

/** Saut complet en courant sur un sol plat : hauteur, durée, distance, mesurées par la simulation. */
function measureFullJump(params: Readonly<MovementParams>): {
  apexPx: number;
  airtimeSteps: number;
  distancePx: number;
} {
  const width = 200;
  const rows = ['#'.repeat(width)];
  for (let row = 0; row < 12; row++) {
    rows.push(`#${(row === 11 ? 'P' : '.').padEnd(width - 2, '.')}#`);
  }
  rows.push('#'.repeat(width));
  const level = parseAsciiLevel('flat', rows.join('\n'));
  const player = new PlayerPhysics(level, params, T, 12 * T - PLAYER_HITBOX.height);
  const input: PlayerInput = { moveX: 1, moveY: 0, jumpPressed: false, jumpHeld: true };
  for (let i = 0; i < 60; i++) {
    player.step(input);
  }
  const groundY = player.box.y;
  const startX = player.box.x;
  input.jumpPressed = true;
  let apexY = groundY;
  let steps = 0;
  do {
    player.step(input);
    input.jumpPressed = false;
    apexY = Math.min(apexY, player.box.y);
    steps++;
  } while (!player.grounded && steps < 2000);
  return { apexPx: groundY - apexY, airtimeSteps: steps, distancePx: player.box.x - startX };
}

export function computeJumpProfile(params: Readonly<MovementParams>): JumpProfile {
  const derived = deriveMovement(params);
  const full = measureFullJump(params);
  const apexTiles = full.apexPx / T;
  const gaps: GapLimit[] = [];
  let maxRiseTiles = 0;
  // Plus l'arrivée est basse, plus le trou franchissable est grand : chaque recherche part du
  // résultat du dénivelé précédent (quelques analyses par dénivelé au lieu d'une par largeur).
  let guess = 1;
  for (let rise = Math.ceil(apexTiles); rise >= LOWEST_RISE; rise--) {
    let maxGapTiles = 0;
    let windowMs = 0;
    let gap = Math.max(1, guess);
    let window = gapWindowMs(gap, rise, params);
    while (window <= 0 && gap > 1) {
      gap--;
      window = gapWindowMs(gap, rise, params);
    }
    while (window > 0 && gap <= MAX_GAP_TILES) {
      maxGapTiles = gap;
      windowMs = window;
      gap++;
      window = gapWindowMs(gap, rise, params);
    }
    if (maxGapTiles > 0) {
      maxRiseTiles = Math.max(maxRiseTiles, rise);
      guess = maxGapTiles;
    }
    gaps.push({ riseTiles: rise, maxGapTiles, windowMs });
  }
  return {
    apexPx: full.apexPx,
    maxRiseTiles,
    airtimeMs: full.airtimeSteps * derived.dt * 1000,
    runningJumpDistancePx: full.distancePx,
    gaps,
  };
}
