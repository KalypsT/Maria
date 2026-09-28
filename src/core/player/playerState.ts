/** États du joueur pour la Phase 1 (spec §30). Les autres (WallSlide, Dash…) viendront avec les capacités. */
export const PlayerState = {
  Idle: 'Idle',
  Run: 'Run',
  Jump: 'Jump',
  Fall: 'Fall',
  /** Réception : visuel uniquement, ne bloque jamais le contrôle. */
  Land: 'Land',
} as const;
export type PlayerState = (typeof PlayerState)[keyof typeof PlayerState];

/**
 * Transition d'état, fonction pure du résultat physique du pas. L'état ne pilote pas la physique :
 * il la décrit (animation, sons, debug), ce qui évite toute dépendance circulaire entre états.
 */
export function nextPlayerState(
  previous: PlayerState,
  grounded: boolean,
  vy: number,
  moving: boolean,
  landStepsRemaining: number,
): PlayerState {
  if (!grounded) {
    return vy < 0 ? PlayerState.Jump : PlayerState.Fall;
  }
  if (moving) {
    return PlayerState.Run;
  }
  const landing =
    previous === PlayerState.Jump || previous === PlayerState.Fall || previous === PlayerState.Land;
  return landing && landStepsRemaining > 0 ? PlayerState.Land : PlayerState.Idle;
}
