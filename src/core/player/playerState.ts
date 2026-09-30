/** États du joueur (spec §30). Les autres (Dash…) viendront avec leurs capacités. */
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
): PlayerState {
  if (hurt) {
    return PlayerState.Hurt;
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
    previous === PlayerState.Land;
  return landing && landStepsRemaining > 0 ? PlayerState.Land : PlayerState.Idle;
}
