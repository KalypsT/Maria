import { GAME_BASE_WIDTH, GAME_HEIGHT, GAME_MAX_WIDTH } from '../config/display';

/**
 * Largeur logique du jeu pour un conteneur donné : la hauteur est fixe et la largeur suit le ratio
 * de l'écran, bornée entre 16:9 et 20:9. Hors de ces bornes, le mode FIT ajoute des bandes noires.
 */
export function computeGameWidth(viewportWidth: number, viewportHeight: number): number {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return GAME_BASE_WIDTH;
  }
  const width = Math.round((GAME_HEIGHT * viewportWidth) / viewportHeight);
  return Math.min(GAME_MAX_WIDTH, Math.max(GAME_BASE_WIDTH, width));
}
