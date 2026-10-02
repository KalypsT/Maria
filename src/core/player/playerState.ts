/** États du joueur (spec §30). */
export const PlayerState = {
  Idle: 'Idle',
  Run: 'Run',
  Jump: 'Jump',
  Fall: 'Fall',
  /** Réception : visuel uniquement, ne bloque jamais le contrôle. */
  Land: 'Land',
  /** Touchée par un ennemi : recul et courte perte de contrôle (D-20). */
  Hurt: 'Hurt',
  /** Suspendue à un rebord (D-26). */
  Hang: 'Hang',
  /** Se hisse sur un rebord (D-26). */
  Climb: 'Climb',
  /** Glisse contre un mur, en descente, en poussant vers lui (D-44). */
  WallSlide: 'WallSlide',
  /** Plane sous le parapluie ouvert, en descente (D-62). */
  Glide: 'Glide',
  /** Accrochée à un câble par le crochet du parapluie, glisse le long (D-65). */
  Cable: 'Cable',
  /** Glissade au sol, couchée (D-84), ou avance couchée sous un plafond trop bas. */
  Slide: 'Slide',
} as const;
export type PlayerState = (typeof PlayerState)[keyof typeof PlayerState];

/**
 * Transition d'état, fonction pure du résultat physique du pas. L'état ne pilote pas la physique :
 * il la décrit (animation, sons, debug), ce qui évite toute dépendance circulaire entre états.
 */
export function nextPlayerState(
  previous: PlayerState,
  grounded: boolean,
  rising: boolean,
  moving: boolean,
  landStepsRemaining: number,
  hurt = false,
  onWall = false,
  gliding = false,
  sliding = false,
): PlayerState {
  if (hurt) {
    return PlayerState.Hurt;
  }
  if (grounded && sliding) {
    return PlayerState.Slide;
  }
  if (!grounded) {
    if (rising) {
      return PlayerState.Jump;
    }
    if (onWall) {
      return PlayerState.WallSlide;
    }
    return gliding ? PlayerState.Glide : PlayerState.Fall;
  }
  if (moving) {
    return PlayerState.Run;
  }
  const landing =
    previous === PlayerState.Jump ||
    previous === PlayerState.Fall ||
    previous === PlayerState.Glide ||
    previous === PlayerState.Cable ||
    previous === PlayerState.Land;
  return landing && landStepsRemaining > 0 ? PlayerState.Land : PlayerState.Idle;
}
