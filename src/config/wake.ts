/**
 * L'écran qui reste allumé (D-186) : pendant l'intro, les scènes et le jeu, le téléphone ne se met
 * pas en veille. Sans aucun toucher pendant `idleMs` (téléphone posé sur la pause), la veille
 * normale reprend, pour la batterie ; le toucher suivant rallume la demande. PROVISOIRE.
 */
export const SCREEN_WAKE = {
  /** Sans toucher ni touche pendant ce temps (ms), la veille du téléphone reprend. */
  idleMs: 5 * 60 * 1000,
  /** Fréquence à laquelle l'inactivité est vérifiée (ms). */
  checkMs: 15 * 1000,
} as const;
