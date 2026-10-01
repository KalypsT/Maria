/**
 * Vie du monde réel (D-72) : logique pure, déterministe. Rien ici ne touche à la collision ni au
 * mouvement (pilier 1).
 */

/**
 * Vent commun (D-72) : de 0 (calme) à 1 (rafale), lent et doux. Le linge, les feuilles et les
 * nuages le suivent ensemble.
 */
export function wind(nowMs: number): number {
  const slow = 0.5 + 0.5 * Math.sin(nowMs / 9000);
  const gust = 0.5 + 0.5 * Math.sin(nowMs / 3700 + 1.3);
  return 0.2 + 0.55 * slow * slow + 0.25 * gust;
}

/** `x` ramené dans [min, max[ (ce qui sort d'un côté revient de l'autre). */
export function wrap(x: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) {
    return min;
  }
  return min + ((((x - min) % span) + span) % span);
}

/** Délai (ms) jusqu'au prochain événement, tiré dans [min, max] (`rand` dans [0, 1[). */
export function nextDelay(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}
