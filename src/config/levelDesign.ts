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
