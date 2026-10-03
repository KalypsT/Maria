/**
 * Paramètres de l'analyse de faisabilité des parcours (décision D-16).
 *
 * PROVISOIRE : seuils de difficulté à calibrer d'après les essais sur téléphone. Une « fenêtre »
 * est la durée pendant laquelle la pression sur Saut réussit le passage (voir `analyzeLevel`).
 */
export const Difficulty = { Easy: 'easy', Medium: 'medium', Hard: 'hard' } as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

/**
 * Fenêtre minimale (ms) du passage le plus dur d'un parcours de chaque difficulté. Un parcours doit
 * aussi rester sous le seuil de la difficulté inférieure : sa difficulté déclarée est exacte.
 */
export const DIFFICULTY_MIN_WINDOW_MS: Readonly<Record<Difficulty, number>> = {
  easy: 200,
  medium: 100,
  hard: 50,
};

/** Réglages de la recherche de passages (simulation d'entrées scriptées). */
export const MOVE_SEARCH = {
  /**
   * Durées de maintien du saut essayées (pas de 1/120 s) ; 0 = maintenu jusqu'à l'atterrissage.
   * Les sauts courts servent sous les plafonds bas.
   */
  jumpHoldSteps: [0, 8, 20] as readonly number[],
  /** Espacement des positions de départ essayées pour les sauts sans élan (px). */
  standingSampleStepPx: 2,
  /** Durée maximale simulée pour un passage (pas) : longues chutes comprises. */
  maxSteps: 720,
  /** Durée maximale pour s'arrêter après l'atterrissage (pas). */
  settleSteps: 120,
} as const;

/**
 * Recherche des passages par la glissade (D-84) : depuis chaque instant de la course, une glissade
 * seule, ou suivie d'un saut long après quelques pas.
 */
export const SLIDE_SEARCH = {
  /** Pas entre la pression de Capacité et celle de Saut, pour les sauts depuis la glissade. */
  jumpAfterSteps: [2, 8, 14, 20, 26] as readonly number[],
  /** Durées de maintien du saut essayées (sous-ensemble de `jumpHoldSteps`). */
  jumpHoldSteps: [0, 8] as readonly number[],
} as const;

/**
 * Recherche des passages par le saut mural (D-44) : depuis chaque appui (entrée en glissade), un
 * rebond est essayé à intervalles réguliers de la glissade.
 */
export const WALL_SEARCH = {
  /** Intervalle entre deux essais de rebond (pas de 1/120 s) : résolution de la fenêtre. */
  sampleSteps: 2,
  /** Durée de glissade explorée depuis un appui (pas) : au-delà, la fenêtre est déjà large. */
  maxSlideSteps: 72,
  /** Durées de maintien du saut essayées pour un rebond (sous-ensemble de `jumpHoldSteps`). */
  jumpHoldSteps: [0, 8] as readonly number[],
  /** Deux appuis sur le même mur à moins de cette hauteur (px) sont confondus. */
  heightStepPx: 8,
  /** Garde-fou : nombre maximal d'appuis dans une salle. */
  maxNodes: 4000,
} as const;

/**
 * Recherche des passages par la bascule (D-107). Le présent et le souvenir ne diffèrent que dans
 * leurs zones : loin d'elles, basculer un peu plus tôt ou un peu plus tard revient au même ; près
 * d'elles, un essai de bascule est fait tous les `sampleSteps` pas du vol.
 */
export const SHIFT_SEARCH = {
  /** Intervalle entre deux instants de bascule essayés près des zones (pas de 1/120 s). */
  sampleSteps: 4,
  /** Près d'une zone : à moins de ce nombre de tuiles sur les côtés, au-dessus et au-dessous. */
  nearTiles: 1,
  nearTilesAbove: 2,
  /**
   * Les sauts en courant avec bascule sont essayés tous les `launchSteps` pas de course (la
   * fenêtre du saut est donc comptée à cette résolution près).
   */
  launchSteps: 4,
  /** Durée maximale comptée pour un instant de bascule loin des zones (ms) : déjà « facile ». */
  farCapMs: 250,
  /**
   * Sauts essayés avec une bascule en plein vol (sous-ensemble prudent, pour le temps de calcul) :
   * maintiens du saut, direction jamais relâchée, sauts depuis la glissade après ces pas.
   */
  jumpHoldSteps: [0] as readonly number[],
  slideJumpAfterSteps: [8] as readonly number[],
  /** Rebonds (saut mural) avec bascule : essayés tous les `kickSteps` pas de la glissade. */
  kickSteps: 4,
} as const;
