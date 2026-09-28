import {
  GAME_BASE_WIDTH,
  GAME_HEIGHT,
  GAME_MAX_WIDTH,
  MAX_RENDER_SCALE,
  type RenderMode,
} from '../config/display';

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

/**
 * Échelle du rendu (décision D-18) : 1 à la résolution logique ; à la résolution de l'écran, rapport
 * entre la hauteur physique du conteneur et la hauteur logique, entre 1 et `MAX_RENDER_SCALE`.
 */
export function computeRenderScale(
  mode: RenderMode,
  viewportHeight: number,
  devicePixelRatio: number,
): number {
  if (mode === 'logical' || viewportHeight <= 0 || !(devicePixelRatio > 0)) {
    return 1;
  }
  return Math.min(MAX_RENDER_SCALE, Math.max(1, (viewportHeight * devicePixelRatio) / GAME_HEIGHT));
}

/** Taille du canvas (px) pour une largeur logique et une échelle de rendu. */
export function renderSize(
  logicalWidth: number,
  renderScale: number,
): { width: number; height: number } {
  return {
    width: Math.round(logicalWidth * renderScale),
    height: Math.round(GAME_HEIGHT * renderScale),
  };
}
