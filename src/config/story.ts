import type { PropKind } from '../core/story/story';

/**
 * Histoire (§33, D-31) : identifiants des étapes (drapeaux) et durées de mise en scène. Le contenu
 * narratif est un PLACEHOLDER (§45), décrit en données dans `src/levels/<zone>/story.ts`.
 */
export const StoryFlag = {
  /** Le soir : Céleste a joué avec Maria. */
  EveningPlayed: 'evening.played',
  /** Le soir : Maria est couchée dans son berceau. */
  EveningTucked: 'evening.tucked',
  /** Céleste s'est couchée : la nuit a passé, c'est le matin et Maria n'est plus là. */
  Slept: 'prologue.slept',
  /** Traces de Maria aperçues (couloir, escalier). */
  TraceHall: 'trace.hall',
  TraceStairs: 'trace.stairs',
  /** Maria aperçue en haut de la bibliothèque du salon. */
  MariaSeen: 'living.seen',
  /** Céleste est arrivée en haut : Maria n'y est plus, le salon a basculé (monde étrange). */
  MariaVanished: 'living.vanished',
  /** Céleste a quitté le salon basculé : tout est redevenu normal. */
  LivingLeft: 'living.left',
  /** Le bandeau de Maria, trouvé sur le lit de Céleste. */
  HeadbandFound: 'headband.found',
} as const;
export type StoryFlag = (typeof StoryFlag)[keyof typeof StoryFlag];

/**
 * Drapeaux donnés à une partie commencée avant l'histoire (migration v1 → v2 de la sauvegarde) :
 * le prologue est considéré comme vécu, on ne renvoie pas le joueur au coucher.
 */
export const LEGACY_STORY_FLAGS: readonly string[] = [
  StoryFlag.EveningPlayed,
  StoryFlag.EveningTucked,
  StoryFlag.Slept,
];

/** Mise en scène (ms). PROVISOIRE : à régler sur téléphone. */
export const STORY_TIMING = {
  /** Fondu court (jouer, coucher Maria). */
  fadeMs: 350,
  /** Fondu de la nuit (Céleste s'endort, puis se réveille). */
  nightFadeOutMs: 1100,
  nightBlackMs: 700,
  nightFadeInMs: 1500,
  /** Durée d'affichage d'une bulle de pensée. */
  thoughtMs: 1800,
  /** Apparition et disparition d'une bulle. */
  thoughtFadeMs: 180,
  /** Pause d'un plan fixe (Céleste joue avec Maria). */
  holdMs: 1100,
  /** Délai minimal entre deux bulles « c'est l'heure de dormir » à une porte fermée. */
  lockedExitThoughtMs: 2500,
  /** Bascule vers le monde étrange : un clignement (fondu très court), puis le retour lent. */
  blinkOutMs: 160,
  blinkBlackMs: 240,
  blinkInMs: 700,
} as const;

/**
 * Taille des objets de mise en scène (px logiques). Maria est un peu plus grande qu'un vrai poupon à
 * côté d'une enfant, pour rester lisible à la taille du jeu.
 */
export const PROP_SIZE = {
  'maria-sit': { w: 8, h: 13 },
  cradle: { w: 30, h: 16 },
  'cradle-maria': { w: 30, h: 16 },
  'cradle-undone': { w: 30, h: 16 },
  slipper: { w: 7, h: 4 },
  bottle: { w: 9, h: 5 },
  headband: { w: 10, h: 5 },
} as const satisfies Readonly<Record<PropKind, { w: number; h: number }>>;
