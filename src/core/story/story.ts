import type { Box } from '../physics/gridCollision';

/**
 * Histoire pilotée par des données (§33, D-31) : déclencheurs (interaction, contact) qui jouent de
 * courts scripts (fondus, bulles de pensée, étapes vécues), objets de mise en scène qui dépendent
 * des étapes, moment de la journée et portes fermées. Pur et indépendant de Phaser.
 */

/** Condition sur les étapes vécues : toutes celles de `all`, aucune de `none`. */
export interface FlagCondition {
  readonly all?: readonly string[];
  readonly none?: readonly string[];
}

/** Rectangle en tuiles (colonne et ligne du coin haut gauche, largeur, hauteur). */
export interface TileArea {
  readonly col: number;
  readonly row: number;
  readonly w: number;
  readonly h: number;
}

/** Bulles de pensée : des pictogrammes, jamais de texte (pilier 6). */
export const THOUGHT_ICONS = ['heart', 'cradle', 'bed', 'maria', 'maria-missing'] as const;
export type ThoughtIcon = (typeof THOUGHT_ICONS)[number];

/** Poses imposées par un script (Céleste assise pour jouer, puis au réveil). */
export type ScriptPose = 'sit' | 'stand';

export type StoryStep =
  /** Fondu au noir (bloquant). */
  | { readonly do: 'fadeOut'; readonly ms: number }
  /** Retour de l'image (bloquant). */
  | { readonly do: 'fadeIn'; readonly ms: number }
  | { readonly do: 'wait'; readonly ms: number }
  /** Étape vécue, sauvegardée aussitôt. */
  | { readonly do: 'flag'; readonly id: string }
  /** Bulle de pensée au-dessus de Céleste (non bloquante). */
  | { readonly do: 'thought'; readonly icon: ThoughtIcon; readonly ms: number }
  /** Céleste placée debout sur la tuile (col, row), tournée vers `facing` (seulement dans le noir). */
  | { readonly do: 'place'; readonly col: number; readonly row: number; readonly facing: 1 | -1 }
  | { readonly do: 'pose'; readonly pose: ScriptPose };

export interface StoryTrigger {
  readonly id: string;
  readonly room: string;
  /**
   * `interact` : bouton Agir dans la zone ; `touch` : Céleste entre dans la zone ; `leave` :
   * Céleste quitte la salle (par une sortie, une réapparition…).
   */
  readonly on: 'interact' | 'touch' | 'leave';
  /** Zone (tuiles) des déclencheurs `interact` et `touch`. */
  readonly area?: TileArea;
  /** Tuile où une petite étincelle signale ce qu'on peut faire (déclencheur Agir). */
  readonly mark?: { readonly col: number; readonly row: number };
  readonly when: FlagCondition;
  /** Commandes de Céleste suspendues pendant le script. */
  readonly lock: boolean;
  readonly steps: readonly StoryStep[];
}

/** Objets de mise en scène (dessins provisoires ; Maria : image fournie « maria »). */
export const PROP_KINDS = [
  'maria-sit',
  'cradle',
  'cradle-maria',
  'cradle-undone',
  'slipper',
  'bottle',
  'headband',
] as const;
export type PropKind = (typeof PROP_KINDS)[number];

export interface StoryProp {
  readonly id: string;
  readonly room: string;
  readonly kind: PropKind;
  /** Tuile où il est posé : centre du bas de la tuile. */
  readonly col: number;
  readonly row: number;
  /** Tourné vers la gauche. */
  readonly flip?: boolean;
  readonly when: FlagCondition;
}

export type TimeOfDay = 'evening' | 'morning';

export interface StoryData {
  readonly triggers: readonly StoryTrigger[];
  readonly props: readonly StoryProp[];
  /** Moment de la journée : la première règle vraie l'emporte, sinon `evening`. */
  readonly times: readonly { readonly when: FlagCondition; readonly time: TimeOfDay }[];
  /** Salles dont les sorties sont fermées tant que la condition est vraie. */
  readonly lockedRooms: readonly { readonly room: string; readonly when: FlagCondition }[];
  /** Salles basculées dans le monde étrange (§6.2) tant que la condition est vraie. */
  readonly strangeRooms: readonly { readonly room: string; readonly when: FlagCondition }[];
}

export function checkCondition(flags: ReadonlySet<string>, when: FlagCondition): boolean {
  for (const flag of when.all ?? []) {
    if (!flags.has(flag)) {
      return false;
    }
  }
  for (const flag of when.none ?? []) {
    if (flags.has(flag)) {
      return false;
    }
  }
  return true;
}

export function areaOverlaps(area: TileArea, box: Box, tile: number): boolean {
  return (
    box.x < (area.col + area.w) * tile &&
    area.col * tile < box.x + box.width &&
    box.y < (area.row + area.h) * tile &&
    area.row * tile < box.y + box.height
  );
}

/** Rectangles qui se chevauchent (px). */
export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
