/**
 * Délai des tests d'analyse de faisabilité (D-16) : un garde-fou contre un test bloqué, pas une
 * mesure de vitesse (voir `performance.test.ts`). Sur la machine de la CI, toutes les analyses
 * tournent en parallèle et la suite dure environ 15 minutes : un délai serré y fait échouer, au
 * hasard de la charge, des tests qui passent. Un seul délai, large, pour tous.
 */
export const ANALYSIS_TIMEOUT_MS = 1_800_000;
