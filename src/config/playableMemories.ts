import type { GrowthPhase } from './growth';
import type { MemoryId } from './memories';
import { PLAYER_HITBOX } from './movement';
import type { StoryProp, TileArea } from '../core/story/story';

/**
 * Souvenirs jouables (D-89) : un court moment d'enfance qu'on joue, sans texte, dans une petite
 * salle à part (hors partie : la sauvegarde n'est jamais modifiée). Une liste d'actions à faire
 * dans l'ordre avec Agir ; à la fin, un cœur, puis la salle reste seule un instant. Réutilisable :
 * un autre souvenir (Eden, niveau 7) n'est qu'une autre salle et une autre liste. PLACEHOLDER.
 */

/** Geste de Céleste pour une action (pose « les mains devant »). */
export type MemoryGesture = 'stir' | 'pour' | 'serve';

export interface MemoryAction {
  /** Zone (tuiles) où Agir fait l'action. */
  readonly area: TileArea;
  /** Petite étincelle qui montre où faire l'action (tuile). */
  readonly mark: { readonly col: number; readonly row: number };
  readonly gesture: MemoryGesture;
  /** Céleste tient la tasse après cette action (jusqu'à la suivante qui la pose). */
  readonly carry: boolean;
  /** Étape du souvenir posée par l'action (objets qui changent ; jamais sauvegardée). */
  readonly sets?: string;
  /** Scintillement (vapeur, thé versé) au moment du geste. */
  readonly sparkle?: TileArea;
  /**
   * Après le geste, un clignement dans le noir (D-118) : l'étape `sets` ne vient qu'au noir. Les
   * personnages changent de place ainsi, jamais à l'écran.
   */
  readonly blink?: boolean;
}

export interface PlayableMemoryData {
  /** Salle du souvenir (`src/levels/memories/`), hors de la zone. */
  readonly room: string;
  /** Céleste au début (tuile où elle se tient debout). */
  readonly start: { readonly col: number; readonly row: number; readonly facing: 1 | -1 };
  readonly actions: readonly MemoryAction[];
  /** Objets de mise en scène de la salle, selon les étapes du souvenir. */
  readonly props: readonly StoryProp[];
  /** Ce que Céleste porte entre deux actions (`carry`) : la tasse par défaut, ou un cube (D-118). */
  readonly carried?: 'cup' | 'cube';
  /**
   * La fin (D-118) : par défaut, la salle reste seule (sans Céleste). `keepCeleste` : Céleste reste,
   * seule ; `sets` : l'étape posée dans le noir, avant (quelqu'un n'est plus là).
   */
  readonly alone?: { readonly keepCeleste: boolean; readonly sets?: string };
}

/**
 * Céleste toute petite (D-89), dans les souvenirs : la marionnette de la phase 1 en plus petit, ses
 * couettes courtes, ses lunettes rondes roses, le pyjama. Elle marche seulement (pas de saut, pas
 * de capacité) ; son pas est plus lent. Physique commune (pilier 7) : seuls ces paramètres changent,
 * et seulement dans un souvenir. PLACEHOLDER.
 */
export const TODDLER_LOOK: GrowthPhase = {
  id: 0,
  flag: null,
  hitbox: { width: PLAYER_HITBOX.width, height: 18 },
  movementScale: { maxRunSpeed: 0.55 },
  bodyScale: 0.78,
  hairScale: 0.75,
  hair: 'pigtails',
  outfit: 'pyjama',
};

/** Temps du souvenir (ms). PROVISOIRES. */
export const PLAYABLE_MEMORY_TIMING = {
  /** Le souvenir apparaît (depuis le noir). */
  introMs: 1800,
  /** Un geste (remuer, verser, poser) : Céleste ne bouge pas pendant ce temps. */
  gestureMs: 1500,
  /** Le cœur, après la dernière action. */
  heartMs: 2200,
  /** Fondu au noir, puis la petite cuisine revient sans Céleste. */
  fadeMs: 1500,
  /** La petite cuisine reste seule. */
  aloneMs: 2800,
  /** Un clignement dans le noir (D-118) : fondu, noir, retour. */
  blinkMs: 1400,
};

/** Étapes du souvenir de la cuisine (jamais sauvegardées). */
export const KITCHEN_MEMORY_STEP = {
  /** La casserole a été remuée : un peu de vapeur. */
  stirred: 'memory.stirred',
  /** Le thé est versé : la tasse quitte la dînette, Céleste la porte. */
  poured: 'memory.poured',
  /** La tasse est posée devant Roger et ses peluches. */
  served: 'memory.served',
} as const;

const DINETTE = { col: 11, row: 19 };
const TEA_TABLE = { col: 27, row: 19 };

/**
 * Le souvenir de la cuisine rose (D-83, D-89) : Céleste toute petite, dans un coin de la cuisine,
 * devant sa dînette rose. Elle remue la casserole, verse le thé, l'apporte à Roger et ses peluches
 * (un panda roux, un lapin) assis autour d'une petite table. Un cœur ; la petite cuisine reste
 * seule. Maria n'y est pas (pilier 5) ; aucun parent (l'histoire de la famille reste ouverte, §45).
 */
const KITCHEN: PlayableMemoryData = {
  room: 'memory-kitchen',
  start: { col: 17, row: 19, facing: -1 },
  actions: [
    {
      area: { col: DINETTE.col - 1, row: DINETTE.row - 2, w: 4, h: 3 },
      mark: { col: DINETTE.col - 1, row: DINETTE.row - 3 },
      gesture: 'stir',
      carry: false,
      sets: KITCHEN_MEMORY_STEP.stirred,
      sparkle: { col: DINETTE.col - 1, row: DINETTE.row - 3, w: 2, h: 2 },
    },
    {
      area: { col: DINETTE.col - 1, row: DINETTE.row - 2, w: 4, h: 3 },
      mark: { col: DINETTE.col + 1, row: DINETTE.row - 3 },
      gesture: 'pour',
      carry: true,
      sets: KITCHEN_MEMORY_STEP.poured,
      sparkle: { col: DINETTE.col, row: DINETTE.row - 2, w: 2, h: 1 },
    },
    {
      area: { col: TEA_TABLE.col - 3, row: TEA_TABLE.row - 2, w: 6, h: 3 },
      mark: { col: TEA_TABLE.col, row: TEA_TABLE.row - 3 },
      gesture: 'serve',
      carry: false,
      sets: KITCHEN_MEMORY_STEP.served,
    },
  ],
  props: [
    // La dînette rose (sans la lueur du monde étrange) ; la tasse attend dessus jusqu'au thé versé.
    { id: 'toy-kitchen', room: 'memory-kitchen', kind: 'toy-kitchen', ...DINETTE, when: {} },
    {
      id: 'cup-dinette',
      room: 'memory-kitchen',
      kind: 'tea-cup',
      col: DINETTE.col + 1,
      row: DINETTE.row - 2,
      when: { none: [KITCHEN_MEMORY_STEP.poured] },
      instant: true,
    },
    // Roger et ses peluches autour de la petite table ; la tasse posée devant eux.
    { id: 'tea-table', room: 'memory-kitchen', kind: 'tea-table', ...TEA_TABLE, when: {} },
    {
      id: 'cup-table',
      room: 'memory-kitchen',
      kind: 'tea-cup',
      col: TEA_TABLE.col,
      row: TEA_TABLE.row - 1,
      when: { all: [KITCHEN_MEMORY_STEP.served] },
      instant: true,
    },
  ],
};

/** Étapes du souvenir d'Eden (D-118, jamais sauvegardées). */
export const EDEN_MEMORY_STEP = {
  /** Un cube pris dans le tas, puis posé sur la tour. */
  cube1: 'memory.eden-cube-1',
  tower2: 'memory.eden-tower-2',
  cube2: 'memory.eden-cube-2',
  /** Dans le noir, Eden a posé le sien : la tour a quatre cubes. */
  tower4: 'memory.eden-tower-4',
  /** Cache-cache : Eden s'est caché derrière le pouf, puis derrière le rideau. */
  hideA: 'memory.eden-hide-a',
  hideB: 'memory.eden-hide-b',
  /** Trouvé : il rit. */
  found: 'memory.eden-found',
  /** À la fin, dans le noir : Eden n'est plus là. */
  gone: 'memory.eden-gone',
} as const;

const PILE = { col: 13, row: 19 };
const TOWER = { col: 19, row: 19 };
const EDEN_AT = { col: 21, row: 19 };
/** Les cachettes : derrière le pouf, derrière le coffre à jouets (sa tête dépasse, dessus). */
const HIDE_A = { col: 31, row: 17 };
const HIDE_B = { col: 4, row: 17 };
const NANNY = { col: 40, row: 19 };
/** Céleste se tient devant une cachette (par terre, à côté). */
const beside = (p: { col: number; row: number }, side: -1 | 1) => ({
  area: { col: side < 0 ? p.col - 4 : p.col, row: p.row, w: 4, h: 3 },
  mark: { col: p.col, row: p.row - 1 },
});
const E = EDEN_MEMORY_STEP;

/** Agir sur une case (zone de 4 × 3 tuiles autour, étincelle au-dessus). */
const at = (p: { col: number; row: number }, w = 4) => ({
  area: { col: p.col - Math.floor(w / 2), row: p.row - 2, w, h: 3 },
  mark: { col: p.col, row: p.row - 3 },
});

/**
 * Le souvenir d'Eden (D-107, D-118) : chez la nounou, quand ils étaient tout petits. Céleste et
 * Eden construisent une tour de cubes à deux (elle prend un cube dans le tas et le pose ; dans le
 * noir d'un clignement, Eden a posé le sien), puis un cache-cache simple : Eden se cache (on ne le
 * voit jamais bouger, il change de place dans le noir), Céleste le trouve derrière le pouf, puis
 * derrière le rideau ; il rit. La nounou, une silhouette bienveillante, regarde depuis son fauteuil,
 * sans un mot. Un cœur ; dans le noir, Eden n'est plus là ; Céleste reste seule. Sans texte. Maria
 * n'y est pas (pilier 5). Plus long que celui de la cuisine.
 */
const EDEN: PlayableMemoryData = {
  room: 'memory-eden',
  start: { col: 8, row: 19, facing: 1 },
  carried: 'cube',
  alone: { keepCeleste: true, sets: E.gone },
  actions: [
    { ...at(PILE), gesture: 'serve', carry: true, sets: E.cube1 },
    { ...at(TOWER), gesture: 'serve', carry: false, sets: E.tower2 },
    { ...at(PILE), gesture: 'serve', carry: true, sets: E.cube2 },
    { ...at(TOWER), gesture: 'serve', carry: false, sets: E.tower4, blink: true },
    // Le cache-cache : Céleste touche Eden (à lui de se cacher) ; dans le noir, il est caché.
    { ...at(EDEN_AT), gesture: 'serve', carry: false, sets: E.hideA, blink: true },
    { ...beside(HIDE_A, -1), gesture: 'serve', carry: false, sets: E.hideB, blink: true },
    { ...beside(HIDE_B, 1), gesture: 'serve', carry: false, sets: E.found, blink: true },
  ],
  props: [
    { id: 'eden-pile', room: 'memory-eden', kind: 'cube-pile', ...PILE, when: {} },
    {
      id: 'eden-tower-1',
      room: 'memory-eden',
      kind: 'cube-tower-1',
      ...TOWER,
      when: { none: [E.tower2] },
      instant: true,
    },
    {
      id: 'eden-tower-2',
      room: 'memory-eden',
      kind: 'cube-tower-2',
      ...TOWER,
      when: { all: [E.tower2], none: [E.tower4] },
      instant: true,
    },
    {
      id: 'eden-tower-4',
      room: 'memory-eden',
      kind: 'cube-tower-4',
      ...TOWER,
      when: { all: [E.tower4] },
      instant: true,
    },
    // Eden : assis près de la tour, puis caché (on voit dépasser sa tête), puis trouvé, il rit.
    {
      id: 'eden-sit',
      room: 'memory-eden',
      kind: 'eden-small',
      ...EDEN_AT,
      flip: true,
      when: { none: [E.hideA] },
      instant: true,
    },
    {
      id: 'eden-hide-a',
      room: 'memory-eden',
      kind: 'eden-peek',
      ...HIDE_A,
      when: { all: [E.hideA], none: [E.hideB] },
      instant: true,
    },
    {
      id: 'eden-hide-b',
      room: 'memory-eden',
      kind: 'eden-peek',
      ...HIDE_B,
      flip: true,
      when: { all: [E.hideB], none: [E.found] },
      instant: true,
    },
    {
      id: 'eden-found',
      room: 'memory-eden',
      kind: 'eden-laugh',
      col: HIDE_B.col + 3,
      row: 19,
      when: { all: [E.found], none: [E.gone] },
      instant: true,
    },
    // La nounou, dans son fauteuil : une silhouette bienveillante qui regarde, sans visage net.
    { id: 'eden-nanny', room: 'memory-eden', kind: 'nanny-shadow', ...NANNY, flip: true, when: {} },
  ],
};

export const PLAYABLE_MEMORIES = { kitchen: KITCHEN, eden: EDEN } as const;
export type PlayableMemoryId = keyof typeof PLAYABLE_MEMORIES;

/** Le souvenir jouable lié à un souvenir du cahier, s'il en a un : on le rejoue en le touchant. */
export function playableOf(id: MemoryId): PlayableMemoryId | null {
  if (id === 'pink-kitchen') {
    return 'kitchen';
  }
  return id === 'eden-tower' ? 'eden' : null;
}
