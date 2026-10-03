import type { FlashbackId } from '../../config/memories';
import type { PlayableMemoryId } from '../../config/playableMemories';
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
  /** La toise, un nouveau trait plus haut (D-43). */
  'height',
  /** Une porte dont la poignée est trop haute (porte de derrière, D-46). */
  'handle',
  /** Le soleil : il fait beau, envie de jouer dehors (D-46). */
  'sun',
  /** Une loupe : « cherche bien » (maman au jardin, D-50). */
  'search',
  /** La cabane dans l'arbre (papa au jardin, D-50) : un indice, sans texte. */
  'treehouse',
  /** La haie et son trou qui scintille (papa au jardin, après le saut mural, D-55). */
  'hedge',
  /** Maman (papa la montre après le monde étrange, D-58). */
  'mom',
  /** Le portillon du jardin (fermé, ou montré par papa, D-60). */
  'gate',
  /** La ficelle rouge et la chevillette, pendue en haut (papa la montre avant le portillon, D-60). */
  'cord',
  /** Aide du parapluie (D-62, D-65) : Saut tenu (longue flèche), puis le parapluie ouvert. */
  'umbrella',
  /** Aide du crochet (D-65) : le parapluie accroché à un câble, et la glissade le long. */
  'hook',
  /** Papa (maman le montre à l'aire de jeux : il est à la supérette, D-63). */
  'dad',
  /** La grue du chantier (papa la montre à la supérette, D-63). */
  'crane',
  /** Un train, sa porte ouverte et sa lueur turquoise (au réveil, après la gare, D-69). */
  'train',
  /** Aide de la glissade (D-84, D-85) : une barrière basse, et quelqu'un qui glisse dessous. */
  'slide',
  /** Une vague, sa flèche qui monte : la marée monte (la pêche à pied, D-99) ; le banc des marées. */
  'tide',
  /** Un petit carrousel, son toit rayé et un cheval (la fête du soir, D-101). */
  'carousel',
  /**
   * Aide de la bascule (D-107) : une planche pleine, une autre en pointillés, et la flèche qui passe
   * de l'une à l'autre.
   */
  'shift',
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
   * Étape réversible (la marée, D-95), sauvegardée aussitôt : posée si elle ne l'est pas, retirée
   * sinon. Seulement dans le noir (la salle change à ce moment).
   */
  | { readonly do: 'toggle'; readonly id: string }
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
  | { readonly do: 'shake'; readonly ms: number; readonly strength: number }
  /**
   * Maria apparaît (non bloquant, D-57) : la musique se tait pendant `ms` (jingle étrange s'il
   * existe), puis revient lentement.
   */
  | { readonly do: 'hush'; readonly ms: number }
  /**
   * Court souvenir (D-68, bloquant) : une vignette plein écran pendant `ms`, qui apparaît et
   * disparaît lentement. Non jouable, sans texte.
   */
  | { readonly do: 'flashback'; readonly id: FlashbackId; readonly ms: number }
  /**
   * Capacité apprise (D-85) : sauvegardée aussitôt, avec son indice et sa bulle d'aide, comme un
   * objet de capacité ramassé. La glissade s'apprend en imitant la camarade du train.
   */
  | { readonly do: 'ability'; readonly id: string }
  /**
   * Souvenir jouable (D-89, bloquant) : la scène met le jeu de côté, joue le souvenir, puis revient
   * là où était Céleste, toujours dans le noir. À placer après un fondu au noir.
   */
  | { readonly do: 'play'; readonly id: PlayableMemoryId };

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
  // Au jardin (D-46).
  'mom-garden',
  'dad-garden',
  // À l'aire de jeux du quartier (D-61).
  'mom-bench',
  'dad-shop',
  // L'école (D-64).
  'mom-yard',
  // La gare (D-69) : papa vient chercher Céleste sous l'horloge du hall, la nuit.
  'dad-hall',
  /** La boîte à formes (objet d'enfance, seulement dans le monde étrange) ; un trou en forme de Maria. */
  'shape-box',
  /** La grue au loin, une lueur turquoise au bout de la flèche, par la fenêtre de la chambre. */
  'far-crane',
  /** La palissade du chantier, ouverte le lendemain (le niveau suivant). */
  'site-gap',
  /**
   * Quelques mois après la gare (D-69) : un train arrêté à quai, sa porte ouverte, une lueur
   * turquoise (la suite, sans figer le niveau suivant).
   */
  'quay-train',
  /** Le train à quai, de jour (D-90) : la porte ouverte, sans lueur ; il relie les deux gares. */
  'quay-train-day',
  // Objets à regarder (D-38), avec un petit mouvement en boucle.
  'music-box',
  'plant',
  /** Photo encadrée de Céleste bébé avec Maria, en haut de la bibliothèque (D-39). */
  'baby-photo',
  /** Toise au mur de la chambre (D-43) ; un trait de plus quand Céleste a grandi. */
  'height-chart',
  'height-chart-grown',
  /** La toise, un troisième trait (D-69). */
  'height-chart-older',
  /** Le bonnet de Maria (D-49) : au bout de la ronce, puis dans l'herbe au pied du grand arbre. */
  'bonnet',
  /** Le portillon au bout de l'allée (D-60), fermé puis ouvert. */
  'gate',
  'gate-open',
  /** Roger, la peluche singe, tout en haut de la tour des objets perdus (D-68). */
  'roger',
  // Le train (D-85) : la classe de mer. Sur le quai, le soir, les parents disent au revoir ; la
  // maîtresse, les enfants et leurs sacs. Dans la voiture-couchettes : la camarade qui montre la
  // glissade, des enfants assis sur les couchettes, puis endormis.
  'teacher',
  'mom-quay',
  'dad-quay',
  'kids-quay',
  'classmate',
  'classmate-slid',
  'classmate-asleep',
  'kid-cap-sit',
  'kid-bob-sit',
  'kid-asleep',
  // Le reste du train (D-86).
  'mother-baby',
  'conductor',
  'sleeper-seat',
  'dog-sleep',
  /** La cuisine rose (D-88), la dînette d'enfance de Céleste, au bout du train de la vaisselle. */
  'pink-kitchen',
  /** Le livre musical (D-104), sur le toit du carrousel étrange, au bout de la vague. */
  'music-book',
  // Le souvenir jouable de la cuisine (D-89), dans sa propre salle : la dînette (sans la lueur), la
  // petite table où sont assis Roger, un panda roux et un lapin, la tasse.
  'toy-kitchen',
  'tea-table',
  'tea-cup',
  /**
   * Le reflet du miroir de la nounou (D-110) : Céleste toute petite, dans la vitre ; puis passée de
   * l'autre côté (elle change de place dans le noir).
   */
  'reflection',
  'reflection-through',
  /**
   * Les veilleuses de la porte de la sieste chez la nounou (D-112), une par îlot de mémoire,
   * allumées quand on y a retrouvé son objet : rose pour la chambre et le jardin renversé, jaune
   * pour l'école et la rue, turquoise pour la gare et le train, bleue pour la plage et le carrousel.
   */
  'nap-light-bed',
  'nap-light-school',
  'nap-light-station',
  'nap-light-sea',
  /** Le torchon blanc (D-116), dans le petit lit de la sieste. */
  'white-cloth',
] as const;
export type PropKind = (typeof PROP_KINDS)[number];

/** Objets animés en boucle (deux images), sans être des personnages. */
export const LOOP_OBJECT_KINDS: ReadonlySet<PropKind> = new Set<PropKind>(['music-box', 'plant']);

/**
 * Fixés au mur (la toise, D-43) ou faisant partie du mur (le portillon, D-60) : plus hauts que
 * Céleste, sans rien cacher.
 */
export const WALL_PROP_KINDS: ReadonlySet<PropKind> = new Set<PropKind>([
  'height-chart',
  'height-chart-grown',
  'height-chart-older',
  'gate',
  'gate-open',
  'site-gap',
  'quay-train',
  'quay-train-day',
]);

/** Vus par une fenêtre (D-64) : posés sur le mur, sans surface sous eux. */
export const WINDOW_PROP_KINDS: ReadonlySet<PropKind> = new Set<PropKind>([
  'far-crane',
  'nap-light-bed',
  'nap-light-school',
  'nap-light-station',
  'nap-light-sea',
]);

/** Personnages : grands (les adultes), animés en boucle, ils peuvent avoir une bulle. */
export const CHARACTER_KINDS: ReadonlySet<PropKind> = new Set<PropKind>([
  'dad-door',
  'dad-kitchen',
  'mom-bed',
  'mom-sofa',
  'cat-sleep',
  'cat-sit',
  'mom-garden',
  'dad-garden',
  'mom-bench',
  'dad-shop',
  'mom-yard',
  'dad-hall',
  'teacher',
  'mom-quay',
  'dad-quay',
  'kids-quay',
  'classmate',
  'classmate-slid',
  'classmate-asleep',
  'kid-cap-sit',
  'kid-bob-sit',
  'kid-asleep',
  'mother-baby',
  'conductor',
  'sleeper-seat',
  'dog-sleep',
  'reflection',
  'reflection-through',
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
 * Présage (D-35, corrigé en D-40) : dans une salle, tant que la condition est vraie, l'étrangeté
 * monte à mesure que Céleste approche d'un point (Maria), de 0 (à `radius` tuiles ou plus) à 1
 * (sur place). Seulement près de Maria, jamais à l'autre bout de la pièce.
 */
export interface StoryOmen {
  readonly room: string;
  readonly when: FlagCondition;
  /** Point visé (tuile) : là où est Maria. */
  readonly col: number;
  readonly row: number;
  /** Distance (tuiles) à partir de laquelle le présage commence. */
  readonly radius: number;
}

export interface StoryData {
  readonly triggers: readonly StoryTrigger[];
  readonly props: readonly StoryProp[];
  /** Moment de la journée : la première règle vraie l'emporte, sinon `evening`. */
  readonly times: readonly { readonly when: FlagCondition; readonly time: TimeOfDay }[];
  /**
   * Salles dont les sorties sont fermées tant que la condition est vraie ; `speaker` : le
   * personnage qui le rappelle (bulle « au lit » d'un parent), sinon Céleste elle-même. `exit` :
   * une seule sortie fermée (la porte de derrière, D-46) ; `icon` : la bulle (« au lit » sinon).
   */
  readonly lockedRooms: readonly {
    readonly room: string;
    readonly exit?: number;
    readonly when: FlagCondition;
    readonly speaker?: string;
    readonly icon?: ThoughtIcon;
    /**
     * Porte de façade fermée qu'on ne voit pas comme une porte (D-90) : ni étincelle, ni Agir,
     * tant qu'elle est fermée (la porte du train à quai, quand le train n'est pas là).
     */
    readonly hidden?: boolean;
  }[];
  readonly omens: readonly StoryOmen[];
  /**
   * Salles qui roulent (D-85) : le train en route. Le paysage défile derrière les vitres, la voiture
   * a des secousses (visuelles seulement : jamais sur Céleste, pilier 1). Sinon, à l'arrêt.
   */
  readonly moving?: readonly { readonly room: string; readonly when: FlagCondition }[];
  /**
   * Lumières éteintes (D-85) : la nuit dans le train, la salle est plus sombre et les liseuses
   * s'éteignent ; seules les veilleuses restent. Changé dans le noir d'un fondu (salle redessinée).
   */
  readonly dim?: readonly { readonly room: string; readonly when: FlagCondition }[];
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
