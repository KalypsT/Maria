/**
 * Les bulles (D-165) : Céleste pense (un nuage et sa traîne), les autres personnages parlent (une
 * bulle ronde et sa pointe). Règles pures, sans Phaser : le côté de la bulle, le recadrage du
 * pictogramme.
 */

export type BubbleKind = 'thought' | 'speech';

/** 1 : la bulle part vers la droite (traîne ou pointe en bas à gauche) ; -1 : vers la gauche. */
export type BubbleSide = 1 | -1;

/**
 * Le côté de la bulle : vers la droite, sauf si elle sortirait de la salle (un personnage au bord
 * droit, papa à la porte de la chambre). `anchorX` : le point d'attache (la tête), en px du monde ;
 * `width` : la largeur de la bulle ; `roomRight` : le bord droit de la salle (0 : inconnu).
 */
export function bubbleSide(anchorX: number, width: number, roomRight: number): BubbleSide {
  return roomRight > 0 && anchorX + width > roomRight && anchorX - width >= 0 ? -1 : 1;
}

/** Un rectangle (px logiques du dessin). */
export interface SafeBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * L'agrandissement d'un pictogramme mesuré (`w` × `h`) pour tenir dans la zone sûre de la bulle,
 * sans dépasser `max` (les petits pictogrammes ne deviennent pas énormes).
 */
export function fitScale(w: number, h: number, safe: SafeBox, max: number): number {
  if (w <= 0 || h <= 0) {
    return 1;
  }
  return Math.min(max, safe.w / w, safe.h / h);
}

/** Nom de la texture d'une bulle (`cubes` : les cubes trouvés, pour la bulle des cubes). */
export function bubbleKey(kind: BubbleKind, icon: string, side: BubbleSide, cubes = 0): string {
  const base = `bubble-${kind}-${icon}-${side > 0 ? 'r' : 'l'}`;
  return icon === 'cubes' ? `${base}-${String(cubes)}` : base;
}
