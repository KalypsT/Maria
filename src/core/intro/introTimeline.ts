import type { IntroCamera, IntroKeys, IntroShot, IntroTransition } from '../../config/intro';

/**
 * Le déroulé de l'intro (D-185), et du film de la fin (D-190), sans dessin : à un instant donné,
 * quels plans sont visibles, avec quelle opacité, quel voile de couleur et quel cadrage. Fonctions
 * pures, testées ; les écrans (`IntroScreen`, `FilmScreen`) ne font que dessiner ce qu'elles
 * décrivent.
 */

/** Ce que le déroulé connaît d'un plan (ceux de l'intro, ceux du film). */
export interface TimelineShot {
  /** Deux plans consécutifs du même décor le partagent (son temps continue). */
  readonly scene: string;
  readonly durationMs: number;
  readonly enter: IntroTransition;
  readonly camera: IntroShot['camera'];
}

/** Valeur interpolée (linéaire) entre des clés triées ; avant la première, après la dernière : bornée. */
export function keyValue(keys: IntroKeys | undefined, t: number, fallback = 1): number {
  if (!keys || keys.length === 0) {
    return fallback;
  }
  const first = keys[0];
  if (!first || t <= first[0]) {
    return first ? first[1] : fallback;
  }
  for (let i = 1; i < keys.length; i++) {
    const next = keys[i];
    const prev = keys[i - 1];
    if (next && prev && t < next[0]) {
      const span = next[0] - prev[0];
      return span <= 0 ? next[1] : prev[1] + ((next[1] - prev[1]) * (t - prev[0])) / span;
    }
  }
  const last = keys[keys.length - 1];
  return last ? last[1] : fallback;
}

/** Accélère puis ralentit (0 → 1). */
export function smooth(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Cadrage d'un plan à `localMs` (copié dans `out`, sans allocation). */
export function cameraAt(shot: TimelineShot, localMs: number, out: IntroCamera): IntroCamera {
  const { from, to, moveMs, startMs } = shot.camera;
  const start = startMs ?? 0;
  const span = moveMs ?? shot.durationMs - start;
  const t = smooth(span > 0 ? (localMs - start) / span : 1);
  out.x = from.x + (to.x - from.x) * t;
  out.y = from.y + (to.y - from.y) * t;
  out.zoom = from.zoom + (to.zoom - from.zoom) * t;
  return out;
}

/** Échelle qui couvre l'écran avec un plan (le surplus est rogné, jamais de bandes). */
export function coverScale(
  viewWidth: number,
  viewHeight: number,
  planWidth: number,
  planHeight: number,
): number {
  return Math.max(viewWidth / planWidth, viewHeight / planHeight);
}

/** Début de chaque plan (ms) et durée totale. */
export interface IntroSchedule {
  starts: readonly number[];
  /** Début du décor de chaque plan : celui du premier plan d'une suite au même décor. */
  sceneStarts: readonly number[];
  totalMs: number;
}

export function introSchedule(shots: readonly TimelineShot[]): IntroSchedule {
  const starts: number[] = [];
  const sceneStarts: number[] = [];
  let t = 0;
  shots.forEach((shot, i) => {
    starts.push(t);
    const prev = shots[i - 1];
    sceneStarts.push(prev?.scene === shot.scene ? (sceneStarts[i - 1] ?? t) : t);
    t += shot.durationMs;
  });
  return { starts, sceneStarts, totalMs: t };
}

/** Un plan à dessiner : son numéro, son temps, celui de son décor, son opacité. */
export interface IntroLayer {
  shot: number;
  localMs: number;
  sceneMs: number;
  alpha: number;
}

/**
 * Ce qu'il faut dessiner à un instant : au plus deux plans (pendant un fondu enchaîné), puis un
 * voile de couleur par-dessus. Objet réutilisé d'une image à l'autre.
 */
export interface IntroFrame {
  layers: [IntroLayer, IntroLayer];
  layerCount: number;
  veilColor: string;
  veilAlpha: number;
  ended: boolean;
}

export function createIntroFrame(): IntroFrame {
  const layer = (): IntroLayer => ({ shot: 0, localMs: 0, sceneMs: 0, alpha: 1 });
  return {
    layers: [layer(), layer()],
    layerCount: 0,
    veilColor: '#000',
    veilAlpha: 0,
    ended: false,
  };
}

function setLayer(
  layer: IntroLayer,
  schedule: IntroSchedule,
  shot: number,
  elapsedMs: number,
  alpha: number,
): void {
  layer.shot = shot;
  layer.localMs = elapsedMs - (schedule.starts[shot] ?? 0);
  layer.sceneMs = elapsedMs - (schedule.sceneStarts[shot] ?? 0);
  layer.alpha = alpha;
}

/** Index du plan en cours à `elapsedMs` (le dernier une fois la fin passée). */
export function shotIndexAt(schedule: IntroSchedule, elapsedMs: number): number {
  let index = 0;
  for (let i = 0; i < schedule.starts.length; i++) {
    if (elapsedMs >= (schedule.starts[i] ?? 0)) {
      index = i;
    }
  }
  return index;
}

/**
 * Remplit `frame` pour l'instant `elapsedMs` du déroulé. La fin (`outroMs`) se fond dans la
 * couleur `outroColor` ; `ended` dès que tout est joué.
 */
export function introFrameAt(
  shots: readonly TimelineShot[],
  schedule: IntroSchedule,
  elapsedMs: number,
  outroMs: number,
  outroColor: string,
  frame: IntroFrame,
): IntroFrame {
  const [current, previous] = frame.layers;
  const index = shotIndexAt(schedule, elapsedMs);
  const shot = shots[index];
  frame.ended = elapsedMs >= schedule.totalMs;
  frame.veilAlpha = 0;
  frame.layerCount = 1;
  setLayer(current, schedule, index, elapsedMs, 1);
  if (shot && index > 0) {
    const local = current.localMs;
    const enter = shot.enter;
    if (enter.kind === 'dissolve' && local < enter.ms) {
      // Le plan précédent, dessous, continue de vivre pendant le fondu.
      setLayer(previous, schedule, index - 1, elapsedMs, 1);
      frame.layers[0] = previous;
      frame.layers[1] = current;
      current.alpha = smooth(local / enter.ms);
      frame.layerCount = 2;
    } else if (enter.kind === 'dip') {
      const half = enter.ms / 2;
      if (local < half) {
        // Le plan précédent s'efface vers la couleur.
        setLayer(current, schedule, index - 1, elapsedMs, 1);
        frame.veilColor = enter.color;
        frame.veilAlpha = smooth(local / half);
      } else if (local < half + enter.holdMs) {
        frame.layerCount = 0;
        frame.veilColor = enter.color;
        frame.veilAlpha = 1;
      } else if (local < enter.ms + enter.holdMs) {
        frame.veilColor = enter.color;
        frame.veilAlpha = 1 - smooth((local - half - enter.holdMs) / half);
      }
    }
  }
  const outroStart = schedule.totalMs - outroMs;
  if (elapsedMs > outroStart) {
    frame.veilColor = outroColor;
    frame.veilAlpha = smooth((elapsedMs - outroStart) / outroMs);
  }
  return frame;
}

/**
 * Quand la caméra reste sur le même décor d'un plan à l'autre par une coupe franche, l'image doit
 * se raccorder : le cadrage de fin du premier est celui de début du second.
 */
export function cutsMatch(prev: TimelineShot, next: TimelineShot): boolean {
  const end = cameraAt(prev, prev.durationMs, { x: 0, y: 0, zoom: 1 });
  const start = cameraAt(next, 0, { x: 0, y: 0, zoom: 1 });
  return (
    Math.abs(end.x - start.x) < 0.5 &&
    Math.abs(end.y - start.y) < 0.5 &&
    Math.abs(end.zoom - start.zoom) < 0.001
  );
}
