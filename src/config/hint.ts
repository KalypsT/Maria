/**
 * Le fil discret (D-129) : après un long moment sans progrès, une petite lueur montre où aller,
 * jamais comment. Activé par défaut, désactivable (menu pause → Aide). Valeurs PROVISOIRES, à
 * régler d'après les essais.
 */
export const HINT = {
  /** Sans progrès pendant ce temps de jeu (ms), la lueur part un peu dans la bonne direction… */
  glimpseMs: 3 * 60 * 1000,
  /** …et au-delà, elle mène jusqu'à la sortie à prendre, ou jusqu'au but dans la salle. */
  leadMs: 5 * 60 * 1000,
  /** Premier palier : la lueur repart de Céleste toutes les… (ms). */
  glimpseEveryMs: 15000,
  /** Premier palier : distance parcourue avant de s'éteindre (px). */
  glimpseDistancePx: 96,
  /** Second palier : la lueur attend au but avant de revenir vers Céleste (ms). */
  leadWaitMs: 2500,
  /** Vitesse de la lueur (px/s). */
  speedPxPerS: 90,
  /** Le but est recalculé au plus toutes les… (ms) : l'itinéraire suit l'histoire. */
  retargetMs: 500,
} as const;

/** Dessin de la lueur : turquoise du monde étrange autour d'un cœur doré (D-129). */
export const HINT_LOOK = {
  /** Cœur doré, halo turquoise. */
  coreColor: '#fff3c4',
  haloColor: 'rgba(127, 240, 220, 0.55)',
  /** Taille dessinée (px logiques) et battement (part de la taille, période en ms). */
  sizePx: 10,
  pulse: 0.18,
  pulseMs: 900,
  /** Traînée : points qui suivent la lueur, de plus en plus pâles. */
  trailDots: 4,
  trailSpacingMs: 70,
  /** Apparition et disparition (ms). */
  fadeMs: 400,
} as const;
