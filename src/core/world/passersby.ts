import type { PasserbyKind, ThoughtIcon, TimeOfDay } from '../story/story';

/**
 * Les passants et les animaux (D-155) : de la vie dans le monde réel, hors de l'histoire et de la
 * sauvegarde. Ils sont posés là, sans collision, derrière Céleste ; quand elle passe tout près, ils
 * réagissent une fois par visite de la salle (une pose, une petite bulle sans texte), ou s'enfuient
 * (le chat). Fonctions pures, sans Phaser.
 */
export interface PasserbySpot {
  readonly id: string;
  readonly room: string;
  readonly kind: PasserbyKind;
  /** Tuile où il est posé : centre du bas de la tuile (comme les objets de l'histoire). */
  readonly col: number;
  readonly row: number;
  /** Décalage vertical (px) : posé sur un rebord plus fin qu'une tuile. */
  readonly dy?: number;
  /** Tourné vers la gauche. */
  readonly flip?: boolean;
  /** Moments de la journée où il est là (tous si absent). */
  readonly times?: readonly TimeOfDay[];
}

export interface PasserbyReaction {
  /** Pose prise quand Céleste est tout près (en fondu), quittée quand elle s'éloigne. */
  readonly pose?: PasserbyKind;
  /** Petite bulle au-dessus de sa tête, la première fois que Céleste approche. */
  readonly bubble?: ThoughtIcon;
  /** Il s'enfuit (le chat) : la pose `pose` le temps du bond, puis il est parti jusqu'à la visite suivante. */
  readonly flee?: boolean;
  /** Proximité mesurée en largeur seulement (à une fenêtre, en hauteur : Céleste passe dessous). */
  readonly column?: boolean;
  /** Distance « tout près » propre à ce passant (px), à la place de celle des réglages. */
  readonly nearPx?: number;
}

export interface PasserbyTuning {
  /** Distance (px) en deçà de laquelle Céleste est « tout près ». */
  readonly nearPx: number;
  /** Distance (px) au-delà de laquelle elle ne l'est plus (hystérésis : pas de va-et-vient). */
  readonly farPx: number;
  /** Durée du fondu d'une pose à l'autre (ms). */
  readonly fadeMs: number;
  /** Durée du bond du chat (ms). */
  readonly fleeMs: number;
}

/** État d'un passant pendant une visite de la salle. */
export interface PasserbyState {
  near: boolean;
  /** Il a déjà réagi (bulle) pendant cette visite. */
  greeted: boolean;
  /** De la première pose (0) à la seconde (1). */
  blend: number;
  /** Temps écoulé depuis le début du bond (ms), -1 : il ne s'enfuit pas. */
  fleeMs: number;
}

export function newPasserbyState(): PasserbyState {
  return { near: false, greeted: false, blend: 0, fleeMs: -1 };
}

/** Parti pour de bon (le bond du chat est fini). */
export function passerbyGone(state: PasserbyState, tuning: PasserbyTuning): boolean {
  return state.fleeMs >= tuning.fleeMs;
}

/**
 * Distance (px) d'un point (le centre de Céleste) au rectangle d'un passant ; en largeur seulement
 * pour `column`.
 */
export function passerbyDistance(
  x: number,
  y: number,
  box: Readonly<{ x: number; y: number; width: number; height: number }>,
  column = false,
): number {
  const dx = Math.max(box.x - x, 0, x - (box.x + box.width));
  if (column) {
    return dx;
  }
  const dy = Math.max(box.y - y, 0, y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

/**
 * Une image : Céleste est à `distance` px. Vrai au moment où la bulle doit apparaître (une fois par
 * visite). Sans allocation.
 */
export function stepPasserby(
  state: PasserbyState,
  distance: number,
  dtMs: number,
  reaction: PasserbyReaction,
  tuning: PasserbyTuning,
): boolean {
  const wasNear = state.near;
  const nearPx = reaction.nearPx ?? tuning.nearPx;
  state.near = wasNear ? distance <= Math.max(tuning.farPx, nearPx * 2) : distance < nearPx;
  if (reaction.flee) {
    if (state.fleeMs >= 0) {
      state.fleeMs = Math.min(tuning.fleeMs, state.fleeMs + dtMs);
    } else if (state.near) {
      state.fleeMs = 0;
      state.blend = 1;
    }
    return false;
  }
  if (reaction.pose) {
    const step = tuning.fadeMs > 0 ? dtMs / tuning.fadeMs : 1;
    state.blend = state.near ? Math.min(1, state.blend + step) : Math.max(0, state.blend - step);
  }
  if (state.near && !wasNear && !state.greeted) {
    state.greeted = true;
    return reaction.bubble !== undefined;
  }
  return false;
}

/** Les passants d'une salle à ce moment de la journée (aucun dans un monde étrange). */
export function passersbyIn(
  spots: readonly PasserbySpot[],
  room: string,
  time: TimeOfDay,
  strange: boolean,
): PasserbySpot[] {
  if (strange) {
    return [];
  }
  return spots.filter((s) => s.room === room && (s.times === undefined || s.times.includes(time)));
}
