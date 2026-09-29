import type { PropKind } from '../core/story/story';

/**
 * Histoire (§33, D-31) : identifiants des étapes (drapeaux) et durées de mise en scène. Le contenu
 * narratif est un PLACEHOLDER (§45), décrit en données dans `src/levels/<zone>/story.ts`.
 */
export const StoryFlag = {
  /** Le soir : Céleste a joué avec Maria. */
  EveningPlayed: 'evening.played',
  /** Le soir : Céleste a pris la couverture de Maria sur l'étagère. */
  EveningBlanket: 'evening.blanket',
  /** Le soir : Maria est couchée dans son berceau. */
  EveningTucked: 'evening.tucked',
  /** Céleste s'est couchée : la nuit a passé, c'est le matin et Maria n'est plus là. */
  Slept: 'prologue.slept',
  /** Traces de Maria aperçues (couloir, escalier). */
  TraceHall: 'trace.hall',
  TraceStairs: 'trace.stairs',
  /** Maria aperçue en haut de la bibliothèque du salon. */
  MariaSeen: 'living.seen',
  /**
   * Céleste est arrivée en haut : Maria n'y est plus, Céleste est passée dans le salon étrange
   * (première fois ; ensuite, le haut de la bibliothèque y ramène tant que la fin n'est pas vécue).
   */
  MariaVanished: 'living.vanished',
  /**
   * Fin du monde étrange (D-34) : le berceau vide en haut du passage d'ombres ; Céleste se
   * retrouve sur son lit, à côté du bandeau de Maria.
   */
  StrangeDone: 'strange.done',
} as const;
export type StoryFlag = (typeof StoryFlag)[keyof typeof StoryFlag];

/**
 * Drapeaux donnés à une partie commencée avant l'histoire (migration v1 → v2 de la sauvegarde) :
 * le prologue est considéré comme vécu, on ne renvoie pas le joueur au coucher.
 */
export const LEGACY_STORY_FLAGS: readonly string[] = [
  StoryFlag.EveningPlayed,
  StoryFlag.EveningBlanket,
  StoryFlag.EveningTucked,
  StoryFlag.Slept,
];

/**
 * Mise en scène (ms). PROVISOIRE : à régler sur téléphone. Retour de l'utilisateur : ralentir
 * l'histoire pour que le joueur s'en imprègne (bulles plus longues, nuit et bascule plus lentes).
 */
export const STORY_TIMING = {
  /** Fondu court (jouer, coucher Maria). */
  fadeMs: 600,
  /** Fondu de la nuit (Céleste s'endort, puis se réveille). */
  nightFadeOutMs: 1900,
  nightBlackMs: 2000,
  nightFadeInMs: 2600,
  /** Durée d'affichage d'une bulle de pensée. */
  thoughtMs: 3000,
  /** Apparition et disparition d'une bulle. */
  thoughtFadeMs: 250,
  /** Plan fixe (Céleste joue avec Maria, la regarde dormir). */
  holdMs: 2600,
  /** Céleste s'arrête pour regarder (trace, Maria aperçue, retour dans la chambre). */
  lookMs: 1400,
  /** Délai minimal entre deux bulles « c'est l'heure de dormir » à une porte fermée. */
  lockedExitThoughtMs: 3500,
  /** Bascule vers le monde étrange : un clignement, un noir, puis le retour lent. */
  blinkOutMs: 300,
  blinkBlackMs: 700,
  blinkInMs: 1500,
  /** Retour dans le monde étrange après un échec : clignement plus bref, sans bulle. */
  reblinkInMs: 800,
} as const;

/** Agrandissement des bulles de pensée (retour de l'utilisateur : mieux lisibles sur téléphone). */
export const THOUGHT_SCALE = 1.6;

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
  blanket: { w: 10, h: 5 },
} as const satisfies Readonly<Record<PropKind, { w: number; h: number }>>;
