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
}

export interface PlayableMemoryData {
  /** Salle du souvenir (`src/levels/memories/`), hors de la zone. */
  readonly room: string;
  /** Céleste au début (tuile où elle se tient debout). */
  readonly start: { readonly col: number; readonly row: number; readonly facing: 1 | -1 };
  readonly actions: readonly MemoryAction[];
  /** Objets de mise en scène de la salle, selon les étapes du souvenir. */
  readonly props: readonly StoryProp[];
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

export const PLAYABLE_MEMORIES = { kitchen: KITCHEN } as const;
export type PlayableMemoryId = keyof typeof PLAYABLE_MEMORIES;

/** Le souvenir jouable lié à un souvenir du cahier, s'il en a un : on le rejoue en le touchant. */
export function playableOf(id: MemoryId): PlayableMemoryId | null {
  return id === 'pink-kitchen' ? 'kitchen' : null;
}
