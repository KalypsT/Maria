/**
 * Compteur de saccades (outil de debug, D-124) : une image qui arrive trop tard après la précédente
 * est une saccade, attribuée au travail de l'image précédente (dessin du décor, chargement d'une
 * salle, reste du jeu) ou, à défaut, au rendu et au navigateur. PROVISOIRE.
 */
export const HITCH = {
  /** Écart entre deux images (ms) au-delà duquel c'est une saccade (une image et demie à 60 Hz). */
  hitchMs: 25,
  /** Au-delà (ms), une grosse saccade : un à-coup net en plein saut. */
  bigHitchMs: 50,
  /** Au-delà (ms), l'écart suit une interruption (onglet masqué, appel) : ignoré. */
  resumeMs: 1000,
  /** Part de l'écart qu'un travail doit occuper pour en être la cause. */
  causeShare: 0.4,
  /** Saccades récentes gardées pour la liste de l'overlay. */
  recentCount: 8,
} as const;
