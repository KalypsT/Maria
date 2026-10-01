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
  /** Le soir : maman est venue dire bonne nuit (papa n'est plus à la porte). */
  EveningGoodnight: 'evening.goodnight',
  /** Au matin, Céleste a parlé de Maria à papa (cuisine) et à maman (salon). */
  MorningDad: 'morning.dad',
  MorningMom: 'morning.mom',
  /** Céleste a caressé le chat. */
  CatPetted: 'cat.petted',
  /** Après le monde étrange, papa est passé voir Céleste (il montre maman). */
  DadVisit: 'end.dad',
  /** Câlin de maman au salon (D-58) ; puis la nuit tombe, il faut aller se coucher. */
  MomHug: 'end.mom-hug',
  /** Les affaires de Maria ramassées (D-58) : elles quittent le jeu pour le cahier. */
  SlipperTaken: 'maria.slipper',
  BottleTaken: 'maria.bottle',
  HeadbandTaken: 'maria.headband',
  BonnetTaken: 'maria.bonnet',
  /** Papa a montré le portillon, après le bonnet (D-60). */
  GardenDadGate: 'garden.dad-gate',
  /** Le portillon au bout de l'allée est ouvert (chevillette tirée, D-60) : la rue. */
  GateOpen: 'garden.gate',
  /** À l'aire de jeux (D-61), Céleste a parlé de Maria à maman, assise sur un banc. */
  StreetMom: 'street.mom',
  /** À la supérette (D-63), Céleste a parlé de Maria à papa, qui fait les courses. */
  StreetDad: 'street.dad',
  /** Quelques mois plus tard (D-43) : Céleste a grandi (phase de croissance 2). */
  Grown: 'growth.2',
  /** Le jardin (D-46) : Céleste est sortie pour la première fois (il fait beau, et Maria ?). */
  GardenArrived: 'garden.arrived',
  /** Au jardin, Céleste a parlé de Maria à maman (terrasse) et à papa (potager). */
  GardenMom: 'garden.mom',
  GardenDad: 'garden.dad',
  /** Papa a montré la haie, une fois le saut mural trouvé (D-55). */
  GardenDadHedge: 'garden.dad-hedge',
  /** Céleste a regardé dans le trou de la haie, au fond du jardin. */
  GardenHedge: 'garden.hedge',
  /** Céleste a trouvé la cabane dans l'arbre (et le saut mural). */
  GardenTreehouse: 'garden.treehouse',
  /** Derrière la haie (D-49) : Céleste est passée dans le jardin renversé (première fois). */
  HedgeEntered: 'hedge.entered',
  /** Fin de derrière la haie : le bonnet de Maria ; Céleste revient au pied du grand arbre. */
  HedgeDone: 'hedge.done',
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
  StoryFlag.EveningGoodnight,
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
  /** Avant le clignement (D-35) : scintillements et tremblement, Céleste immobile. */
  omenPeakMs: 1100,
  /** Retour bref après un échec : scintillements plus courts. */
  reomenPeakMs: 500,
  /** Fin : scintillements autour du berceau avant que le cercle se referme sur Céleste. */
  cradleSparkleMs: 1400,
  /** Quelques mois plus tard (D-43) : le noir le plus long du jeu, puis le retour lent. */
  monthsBlackMs: 4200,
  monthsFadeInMs: 3200,
} as const;

/** Période du petit mouvement en boucle des personnages (ms), D-37. */
export const CHARACTER_LOOP_MS = { parent: 1600, cat: 2400 } as const;

/** Agrandissement des bulles de pensée (retour de l'utilisateur : mieux lisibles sur téléphone). */
export const THOUGHT_SCALE = 1.9;

/**
 * Agrandissement des parents (D-37) par rapport à leur dessin de référence (62 px debout, environ
 * 2,4 fois Céleste). PROVISOIRE : à choisir sur maquettes avec l'utilisateur.
 */
export const PARENT_SCALE = 2;
/**
 * Agrandissement du chat (D-42) : vu à hauteur d'enfant, comme les parents. Assis, sa tête arrive
 * à celle de Céleste. PROVISOIRE, à régler sur téléphone.
 */
export const CAT_SCALE = 2;

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
  // Parents (D-37) : à hauteur d'enfant, bien plus grands que Céleste (environ 26 px) ; taille
  // réglée par PARENT_SCALE (le dessin s'agrandit). Largeur avec la marge de la main tendue.
  'dad-door': { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'dad-kitchen': { w: 40 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'mom-bed': { w: 36 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  'mom-sofa': { w: 38 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  // Au jardin (D-46).
  'mom-garden': { w: 40 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  // À l'aire de jeux (D-61), sur un banc.
  'mom-bench': { w: 38 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  // À la supérette (D-63), un panier à la main.
  'dad-shop': { w: 44 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'dad-garden': { w: 44 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  // Le chat gris, agrandi par CAT_SCALE (D-42).
  'cat-sleep': { w: 16 * CAT_SCALE, h: 8 * CAT_SCALE },
  'cat-sit': { w: 12 * CAT_SCALE, h: 14 * CAT_SCALE },
  // Objets à regarder (D-38).
  'music-box': { w: 10, h: 11 },
  plant: { w: 10, h: 16 },
  'baby-photo': { w: 11, h: 10 },
  'height-chart': { w: 7, h: 40 },
  'height-chart-grown': { w: 7, h: 40 },
  bonnet: { w: 14, h: 12 },
  // Le portillon au bout du passage sous le vieux mur (D-60), fermé puis ouvert.
  gate: { w: 14, h: 46 },
  'gate-open': { w: 14, h: 46 },
} as const satisfies Readonly<Record<PropKind, { w: number; h: number }>>;
