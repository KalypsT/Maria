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

/**
 * Le filet en cas d'erreur (D-182) : une erreur qui arrête la boucle du jeu (une exception dans
 * une image arrête Phaser pour de bon) laisse un écran figé. Après une erreur non rattrapée, si
 * aucune image n'a été rendue pendant `stallMs` alors que l'appli est visible, l'écran « Oups »
 * propose de reprendre à la dernière lanterne. Une erreur sans conséquence (un bouton, un son)
 * ne montre rien : la boucle continue.
 */
export const CRASH_GUARD = {
  /** Plus long qu'un chargement de salle ou qu'un dessin de décor sur un téléphone lent. */
  stallMs: 2500,
  /** Longueur maximale du détail technique affiché en petit (pour les retours d'essai). */
  detailMaxChars: 160,
} as const;
