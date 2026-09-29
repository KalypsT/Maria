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
export const THOUGHT_ICONS = [
  'heart',
  'book',
  'blanket',
  'cradle',
  'bed',
  'maria',
  'maria-missing',
  /** « ? » seul : un parent qui ne sait pas (D-37). */
  'question',
  // Objets à regarder (D-38).
  'family',
  'drawing',
  'music',
  'flower',
  /** La photo de Céleste bébé avec Maria (D-39). */
  'baby',
] as const;
export type ThoughtIcon = (typeof THOUGHT_ICONS)[number];

/** Poses imposées par un script (Céleste assise pour jouer, puis au réveil). */
export type ScriptPose = 'sit' | 'stand';

/**
 * Forme d'un fondu : uniforme, ou en cercle centré sur Céleste (`iris`, D-35 : le monde étrange se
 * révèle autour d'elle, ou se referme sur elle).
 */
export type FadeShape = 'plain' | 'iris';

export type StoryStep =
  /** Fondu au noir (bloquant). */
  | { readonly do: 'fadeOut'; readonly ms: number; readonly shape?: FadeShape }
  /** Retour de l'image (bloquant). */
  | { readonly do: 'fadeIn'; readonly ms: number; readonly shape?: FadeShape }
  | { readonly do: 'wait'; readonly ms: number }
  /** Étape vécue, sauvegardée aussitôt. */
  | { readonly do: 'flag'; readonly id: string }
  /**
   * Bulle de pensée (non bloquante), au-dessus de Céleste, ou d'un personnage de la salle (`by` :
   * identifiant de l'objet de mise en scène, un parent par exemple, D-37).
   */
  | {
      readonly do: 'thought';
      readonly icon: ThoughtIcon;
      readonly ms: number;
      readonly by?: string;
    }
  /** Céleste placée debout sur la tuile (col, row), tournée vers `facing` (seulement dans le noir). */
  | { readonly do: 'place'; readonly col: number; readonly row: number; readonly facing: 1 | -1 }
  /**
   * Céleste passe dans une autre salle, debout sur la tuile (col, row) (seulement dans le noir).
   * `returnPoint` : le point de retour devient la veilleuse de cette salle (sauvegardé).
   */
  | {
      readonly do: 'room';
      readonly room: string;
      readonly col: number;
      readonly row: number;
      readonly facing: 1 | -1;
      readonly returnPoint?: boolean;
    }
  | { readonly do: 'pose'; readonly pose: ScriptPose }
  /** Scintillements étranges dans une zone de la salle (non bloquant, D-35). */
  | { readonly do: 'sparkle'; readonly area: TileArea; readonly ms: number }
  /** Souvenir trouvé (D-38), sauvegardé aussitôt ; sans effet s'il l'est déjà. */
  | { readonly do: 'memory'; readonly id: string }
  /** Tremblement de l'image (non bloquant, D-35) ; amplitude dans `src/config/strangeFx.ts`. */
  | { readonly do: 'shake'; readonly ms: number; readonly strength: number };

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
  /**
   * Rejouable (D-38) : un objet qu'on regarde autant qu'on veut. Seulement pour Agir, et avec des
   * étapes sans effet sur l'histoire (bulles, attentes, souvenir).
   */
  readonly repeat?: boolean;
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
  'blanket',
  // Personnages (D-37), à hauteur d'enfant : ils ne marchent jamais à l'écran, une pose par
  // activité, un petit mouvement en boucle.
  'dad-door',
  'dad-kitchen',
  'mom-bed',
  'mom-sofa',
  'cat-sleep',
  'cat-sit',
  // Objets à regarder (D-38), avec un petit mouvement en boucle.
  'music-box',
  'plant',
  /** Photo encadrée de Céleste bébé avec Maria, en haut de la bibliothèque (D-39). */
  'baby-photo',
] as const;
export type PropKind = (typeof PROP_KINDS)[number];

/** Objets animés en boucle (deux images), sans être des personnages. */
export const LOOP_OBJECT_KINDS: ReadonlySet<PropKind> = new Set<PropKind>(['music-box', 'plant']);

/** Personnages : grands (les adultes), animés en boucle, ils peuvent avoir une bulle. */
export const CHARACTER_KINDS: ReadonlySet<PropKind> = new Set<PropKind>([
  'dad-door',
  'dad-kitchen',
  'mom-bed',
  'mom-sofa',
  'cat-sleep',
  'cat-sit',
]);

export interface StoryProp {
  readonly id: string;
  readonly room: string;
  readonly kind: PropKind;
  /** Tuile où il est posé : centre du bas de la tuile. */
  readonly col: number;
  readonly row: number;
  /** Tourné vers la gauche. */
  readonly flip?: boolean;
  /**
   * Objet ramassé par Céleste : il disparaît aussitôt, même à l'écran. Jamais Maria (pilier 5,
   * vérifié par `storyProblems`).
   */
  readonly instant?: boolean;
  readonly when: FlagCondition;
}

export type TimeOfDay = 'evening' | 'morning';

/**
 * Présage (D-35) : dans une salle, tant que la condition est vraie, l'étrangeté monte avec la
 * hauteur de Céleste, de 0 (pieds sur la ligne `fromRow`) à 1 (sur la ligne `toRow`, plus haute).
 */
export interface StoryOmen {
  readonly room: string;
  readonly when: FlagCondition;
  readonly fromRow: number;
  readonly toRow: number;
}

export interface StoryData {
  readonly triggers: readonly StoryTrigger[];
  readonly props: readonly StoryProp[];
  /** Moment de la journée : la première règle vraie l'emporte, sinon `evening`. */
  readonly times: readonly { readonly when: FlagCondition; readonly time: TimeOfDay }[];
  /**
   * Salles dont les sorties sont fermées tant que la condition est vraie ; `speaker` : le
   * personnage qui le rappelle (bulle « au lit » d'un parent), sinon Céleste elle-même.
   */
  readonly lockedRooms: readonly {
    readonly room: string;
    readonly when: FlagCondition;
    readonly speaker?: string;
  }[];
  readonly omens: readonly StoryOmen[];
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
