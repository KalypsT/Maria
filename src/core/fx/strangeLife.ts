import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt, type LevelData } from '../level/LevelData';

/**
 * Vie du monde étrange (D-35), pure et testée : yeux qui se ferment quand Céleste approche, zones
 * vides où des objets peuvent dériver. Rien ici n'a de collision (pilier 1).
 */

export interface EyesParams {
  readonly eyesCloseTiles: number;
  readonly eyesOpenTiles: number;
  readonly eyesReopenMs: number;
  readonly eyesBlinkEveryMs: number;
  readonly eyesBlinkMs: number;
}

/** Une paire d'yeux dans l'ombre (centre en px). */
export interface Eyes {
  readonly x: number;
  readonly y: number;
  /** Ouverture affichée (0 fermés, 1 ouverts). */
  openness: number;
  /** Céleste est passée trop près : ils restent fermés jusqu'à ce qu'elle soit loin depuis un moment. */
  shy: boolean;
  reopenAt: number;
  nextBlinkAt: number;
  blinkUntil: number;
}

export function createEyes(x: number, y: number, nowMs: number, rand: () => number): Eyes {
  return {
    x,
    y,
    openness: 1,
    shy: false,
    reopenAt: 0,
    nextBlinkAt: nowMs + 1000 + rand() * 3000,
    blinkUntil: 0,
  };
}

/** Vitesse de fermeture et d'ouverture (ouverture par ms) : ils se ferment vite, s'ouvrent lentement. */
const CLOSE_PER_MS = 1 / 120;
const OPEN_PER_MS = 1 / 700;

/** Un pas des yeux (`dtMs` depuis le précédent), Céleste au point (x, y) en px. Sans allocation. */
export function stepEyes(
  eyes: Eyes,
  celesteX: number,
  celesteY: number,
  nowMs: number,
  dtMs: number,
  params: EyesParams,
  rand: () => number,
): void {
  const distance = Math.hypot(celesteX - eyes.x, celesteY - eyes.y) / T;
  if (distance < params.eyesCloseTiles) {
    eyes.shy = true;
  }
  if (eyes.shy && distance <= params.eyesOpenTiles) {
    // Ils attendent qu'elle soit loin depuis un moment pour se rouvrir.
    eyes.reopenAt = nowMs + params.eyesReopenMs;
  } else if (eyes.shy && nowMs >= eyes.reopenAt) {
    eyes.shy = false;
  }
  if (!eyes.shy && nowMs >= eyes.nextBlinkAt) {
    eyes.blinkUntil = nowMs + params.eyesBlinkMs;
    eyes.nextBlinkAt = nowMs + params.eyesBlinkEveryMs * (0.5 + rand());
  }
  const target = eyes.shy || nowMs < eyes.blinkUntil ? 0 : 1;
  if (eyes.openness > target) {
    eyes.openness = Math.max(target, eyes.openness - dtMs * CLOSE_PER_MS);
  } else if (eyes.openness < target) {
    eyes.openness = Math.min(target, eyes.openness + dtMs * OPEN_PER_MS);
  }
}

/**
 * Le point (px) est loin de tout : aucune tuile non vide à moins de `clearTiles` tuiles. Un objet à
 * la dérive n'y passe jamais pour une plateforme.
 */
export function isClearSpot(level: LevelData, x: number, y: number, clearTiles: number): boolean {
  const col = Math.floor(x / T);
  const row = Math.floor(y / T);
  for (let r = row - clearTiles; r <= row + clearTiles; r++) {
    for (let c = col - clearTiles; c <= col + clearTiles; c++) {
      if (tileAt(level, c, r) !== Tile.Empty) {
        return false;
      }
    }
  }
  return true;
}

/** Générateur pseudo-aléatoire reproductible (effets visuels seulement). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export interface TremorParams {
  readonly tremorEveryMinMs: number;
  readonly tremorEveryMaxMs: number;
  readonly tremorMinMs: number;
  readonly tremorMaxMs: number;
}

/** Frissons du monde étrange (D-36) : de temps en temps, jamais pendant un saut. */
export interface Tremor {
  /** Prochain frisson possible (ms). */
  nextAt: number;
  /** Fin du frisson en cours (ms), -1 sans frisson. */
  until: number;
  /** Durée du frisson en cours (ms). */
  lengthMs: number;
}

export function createTremor(nowMs: number, params: TremorParams, rand: () => number): Tremor {
  return { nextAt: nowMs + delay(params, rand), until: -1, lengthMs: 1 };
}

function delay(params: TremorParams, rand: () => number): number {
  return params.tremorEveryMinMs + rand() * (params.tremorEveryMaxMs - params.tremorEveryMinMs);
}

/**
 * Un pas : un frisson commence à son heure, seulement quand Céleste a les pieds au sol (sinon il
 * attend qu'elle se pose : un tremblement en plein saut fausserait le timing, pilier 1). Renvoie
 * l'intensité du frisson (0 à 1, qui s'apaise sur la fin).
 */
export function stepTremor(
  tremor: Tremor,
  nowMs: number,
  grounded: boolean,
  params: TremorParams,
  rand: () => number,
): number {
  if (tremor.until >= 0 && nowMs >= tremor.until) {
    tremor.until = -1;
    tremor.nextAt = nowMs + delay(params, rand);
  }
  if (tremor.until < 0 && nowMs >= tremor.nextAt && grounded) {
    tremor.lengthMs = params.tremorMinMs + rand() * (params.tremorMaxMs - params.tremorMinMs);
    tremor.until = nowMs + tremor.lengthMs;
  }
  if (tremor.until < 0) {
    return 0;
  }
  return Math.min(1, ((tremor.until - nowMs) / tremor.lengthMs) * 2);
}
