import { Ability } from './abilities';
import type { SynthTone } from './sfx';
import { StoryFlag } from './story';

/**
 * La console de Céleste (D-166) : un mode à part, hors de l'histoire. Un jeu par capacité, débloqué
 * avec elle, joué avec la Céleste de la phase où la capacité s'obtient ; des niveaux générés (une
 * graine fixe : toujours les mêmes), de plus en plus durs, un record en mètres par jeu et par mode.
 * L'identifiant d'un jeu est écrit dans la sauvegarde (ses records) : ne jamais le changer.
 */
export const ArcadeGameId = {
  Jumps: 'jumps',
  Climb: 'climb',
  Chimney: 'chimney',
  Wind: 'wind',
  Cables: 'cables',
  Corridor: 'corridor',
  Worlds: 'worlds',
  Monster: 'monster',
} as const;
export type ArcadeGameId = (typeof ArcadeGameId)[keyof typeof ArcadeGameId];

/** Les deux modes (D-166) : des niveaux qui s'enchaînent ; un parcours sans fin (plus tard). */
export const ArcadeMode = { Levels: 'levels', Endless: 'endless' } as const;
export type ArcadeMode = (typeof ArcadeMode)[keyof typeof ArcadeMode];

export interface ArcadeGame {
  readonly id: ArcadeGameId;
  /** Nom sur l'écran de la console (PLACEHOLDER). */
  readonly name: string;
  /** Capacité qui débloque le jeu ; null : dès le cadeau (les sauts) ou par une étape (le monstre). */
  readonly ability: Ability | null;
  /** Étape de l'histoire qui débloque le jeu, à la place d'une capacité (le monstre). */
  readonly flag?: string;
  /** Phase de croissance de Céleste dans ce jeu : celle où la capacité s'obtient (D-43). */
  readonly phase: number;
  /** Capacités prêtées pendant le jeu (celles qu'il entraîne, pas plus). */
  readonly abilities: readonly Ability[];
  /** Le compteur compte la hauteur (la cheminée) ; sinon l'avancée vers la droite. */
  readonly axis?: 'up';
}

/**
 * Les huit jeux, dans l'ordre du menu. Les capacités prêtées des jeux qui n'ont pas encore de
 * générateur sont provisoires : elles se règlent avec leur jeu.
 */
export const ARCADE_GAMES: readonly ArcadeGame[] = [
  { id: ArcadeGameId.Jumps, name: 'Les sauts', ability: null, phase: 2, abilities: [] },
  // Grimper s'obtient avant de grandir (le matin du premier jour).
  {
    id: ArcadeGameId.Climb,
    name: 'La grimpette',
    ability: Ability.Climb,
    phase: 1,
    abilities: [Ability.Climb],
  },
  {
    id: ArcadeGameId.Chimney,
    name: 'La cheminée',
    ability: Ability.WallJump,
    phase: 2,
    abilities: [Ability.WallJump],
    axis: 'up',
  },
  {
    id: ArcadeGameId.Wind,
    name: 'Le grand vent',
    ability: Ability.Umbrella,
    phase: 2,
    abilities: [Ability.Umbrella],
  },
  // Le crochet s'obtient à l'arrivée à la gare, avant ses « mois plus tard » (la phase 3).
  {
    id: ArcadeGameId.Cables,
    name: 'Les tyroliennes',
    ability: Ability.Hook,
    phase: 2,
    abilities: [Ability.Umbrella, Ability.Hook],
  },
  {
    id: ArcadeGameId.Corridor,
    name: 'Le couloir',
    ability: Ability.Slide,
    phase: 3,
    abilities: [Ability.Slide],
  },
  {
    id: ArcadeGameId.Worlds,
    name: 'Les deux mondes',
    ability: Ability.Shift,
    phase: 3,
    abilities: [Ability.Shift],
  },
  // Le seul jeu où quelque chose pousse : débloqué après la vague de la mer (proposé, D-166).
  {
    id: ArcadeGameId.Monster,
    name: 'Le monstre',
    ability: null,
    flag: StoryFlag.SeaStrangeDone,
    phase: 3,
    abilities: [],
  },
];

/** Réglages communs. PROVISOIRES, à régler sur téléphone. */
export const ARCADE = {
  /** Mètres du compteur par tuile parcourue (Céleste mesure à peu près deux tuiles). */
  metersPerTile: 0.5,
  /** Record le plus grand gardé (m) : une valeur aberrante de la sauvegarde est bornée. */
  maxRecordMeters: 1_000_000,
  /** Niveaux de chaque jeu vérifiés un par un par les tests (faisables, passage le plus dur). */
  verifiedLevels: 20,
  /** Fenêtre minimale (ms) du passage le plus dur d'un niveau : même au plus dur, il reste juste. */
  minWindowMs: 50,
  /** Fenêtre minimale (ms) du passage le plus dur du premier niveau de chaque jeu (facile). */
  firstLevelWindowMs: 200,
};

/** Bornes d'un réglage qui suit la difficulté : `from` au niveau 1, `to` au plus dur. */
export interface Ramp {
  readonly from: number;
  readonly to: number;
}

/**
 * Les tyroliennes (D-166) : de câble en câble, des poteaux entre les enchaînements, au-dessus des
 * briques de jeu. Distances en tuiles, marges en px. PROVISOIRES, à régler sur téléphone.
 */
export const ARCADE_CABLES = {
  /** Hauteur du niveau (tuiles) : tout l'écran, sans défilement vertical (360 px). */
  rows: 22,
  /** Lignes permises pour les câbles (centre des tuiles). */
  cableRows: { min: 3, max: 15 },
  /** Lignes permises pour le haut des poteaux. */
  postRows: { min: 8, max: 19 },
  /** Poteau de départ : largeur et ligne du haut. */
  start: { width: 6, top: 12 },
  /** Poteau d'arrivée (le fanion) : largeur. */
  goalWidth: 6,
  /** Difficulté du niveau n : 1 − rate^(n−1) (0 au premier niveau, vers 1 ensuite). */
  difficultyRate: 0.85,
  /** Câbles par niveau : `first`, un de plus tous les `every` niveaux, au plus `max`. */
  cables: { first: 3, every: 3, max: 8 },
  /**
   * Câbles d'affilée au moins entre deux poteaux (tirés de 1 à cette valeur). Un poteau n'est de
   * toute façon jamais à portée du vol plané depuis le précédent.
   */
  chain: { from: 1, to: 4 } satisfies Ramp,
  /** Écart avant un câble (tuiles), depuis le bout du précédent ou le bord d'un poteau. */
  gapAfterCable: { from: 1, to: 4 } satisfies Ramp,
  gapAfterPost: { from: 2, to: 6 } satisfies Ramp,
  /** Écart avant un poteau (tuiles). */
  gapBeforePost: { from: 1, to: 3 } satisfies Ramp,
  /** Écart tiré en plus (tuiles, de 0 à cette valeur). */
  gapSpread: 2,
  /** Longueur d'un câble (tuiles), et longueur tirée en plus. */
  length: { from: 9, to: 4 } satisfies Ramp,
  lengthSpread: 3,
  /** Pente d'un câble qui descend (tuiles de descente par tuile). */
  slope: { min: 0.12, max: 0.3 },
  /** Chance d'un câble plat (on y garde son élan, sans accélérer). */
  flatChance: { from: 0.1, to: 0.4 } satisfies Ramp,
  /**
   * Marge visée (px) entre le chemin du témoin et le bout d'un câble ou le coin d'un poteau qu'il
   * survole : plus elle est petite, plus le passage demande de précision. Et la marge tirée en plus.
   */
  slack: { from: 20, to: 4 } satisfies Ramp,
  slackSpread: { from: 10, to: 3 } satisfies Ramp,
  /** Marge minimale (px) : en dessous, un câble ou un poteau n'est pas retenu. */
  minSlackPx: 2,
  /** Longueur de câble qui reste au moins après l'accroche (tuiles) : le temps de réagir. */
  ride: { from: 4, to: 2 } satisfies Ramp,
  /**
   * Chance que le câble suivant demande de sauter depuis le premier câble d'un enchaînement (au
   * bout : lâcher puis rappuyer).
   */
  jumpExitChance: { from: 0, to: 0.75 } satisfies Ramp,
  /** Largeur d'un poteau (tuiles). */
  postWidth: { from: 4, to: 2 } satisfies Ramp,
};

/**
 * La console de salon dans la chambre (D-166) : la télé posée sur le bureau (centre du bas de la
 * tuile), la zone où Agir l'allume (devant le bureau, ou dessus), l'étincelle au-dessus.
 */
export const CONSOLE_TV = {
  room: 'bedroom',
  // Le bout gauche du bureau : loin de l'étagère où Maria s'assoit après la fin (sans étincelle
  // sur elle, D-144).
  col: 30,
  row: 14,
  area: { col: 28, row: 13, w: 7, h: 7 },
  mark: { col: 30, row: 12 },
} as const;

/** Le nom de la console, sur son écran d'accueil (PLACEHOLDER, D-166). */
export const ARCADE_TITLE = 'Les jeux de Céleste';

/** Rythme d'une partie (ms). PROVISOIRE, à régler sur téléphone. */
export const ARCADE_TIMING = {
  /** « Niveau n » affiché, Céleste immobile, avant de jouer. */
  introMs: 900,
  /** « Niveau n réussi » sur le fanion, avant le niveau suivant. */
  clearedMs: 1200,
  /** Après une chute, avant l'écran « Oups ! ». */
  fallMs: 700,
  /** Le mode Sans fin (D-167) : « 100 m » affiché, à chaque repère. */
  milestoneMs: 1000,
};

/**
 * Les bips de la console (D-166) : des sons synthétisés, dans tous les builds, en attendant la
 * musique de l'utilisateur. PLACEHOLDER.
 */
export const ARCADE_CHIMES = {
  /** Le choix se déplace dans un menu. */
  move: { from: 880, to: 880, ms: 40, wave: 'square' },
  /** Un choix validé. */
  select: { from: 660, to: 990, ms: 90, wave: 'square' },
  /** Un niveau commence. */
  start: { from: 523, to: 784, ms: 160, wave: 'triangle' },
  /** Le fanion atteint. */
  cleared: { from: 784, to: 1568, ms: 260, wave: 'triangle' },
  /** Une chute. */
  fall: { from: 620, to: 140, ms: 420, wave: 'triangle' },
  /** Le mode Sans fin passe un repère (tous les 100 m, D-167). */
  milestone: { from: 988, to: 1319, ms: 140, wave: 'triangle' },
  /** Le monstre se réveille. */
  wake: { from: 196, to: 147, ms: 260, wave: 'square' },
  /** Un nouveau record. */
  record: { from: 1046, to: 2093, ms: 380, wave: 'square' },
} satisfies Record<string, SynthTone>;
export type ArcadeChime = keyof typeof ARCADE_CHIMES;

/** Volume des bips (0–1), sous le volume des bruitages. */
export const ARCADE_CHIME_GAIN = 0.12;

/**
 * Couleurs des tuiles dans les salles de la console (D-166) : le style pastel de la maquette (les
 * salles de la console ne sont pas habillées). PLACEHOLDER.
 */
export const CONSOLE_TILE_COLORS = {
  /** Le cadre de l'écran (murs, plafond, sol). */
  frame: 0xe7c6dd,
  frameEdge: 0xf6dceb,
  /** Les poteaux. */
  post: 0x9b7fd1,
  postEdge: 0xfff6fa,
  /** Les briques de jeu (l'erreur). */
  hazard: 0xff6f9f,
  /** Le fanion. */
  goal: 0xff3d86,
} as const;

/**
 * Les sauts et la grimpette (D-166) : de poteau en poteau, au-dessus des briques de jeu. Distances
 * en tuiles. PROVISOIRES, à régler sur téléphone.
 */
export interface StepsTuning {
  /** Hauteur du niveau (tuiles) pendant la génération ; la grimpette la recadre ensuite. */
  readonly rows: number;
  /** Lignes permises pour le haut des poteaux (la grimpette : seulement le bas). */
  readonly postRows: { readonly min: number; readonly max: number };
  /** Poteau de départ : largeur et ligne du haut. */
  readonly start: { readonly width: number; readonly top: number };
  readonly goalWidth: number;
  /** Difficulté du niveau n : 1 − rate^(n−1). */
  readonly difficultyRate: number;
  /** Poteaux par niveau (sans le départ ni le fanion) : `first`, un de plus tous les `every`. */
  readonly posts: { readonly first: number; readonly every: number; readonly max: number };
  /** Écart visé entre deux poteaux, et l'écart tiré en plus. */
  readonly gap: Ramp;
  readonly gapSpread: number;
  /** Différence de hauteur visée (tuiles), tirée jusqu'à cette valeur. */
  readonly rise: Ramp;
  /** Seulement vers le haut (la grimpette), sinon vers le haut ou le bas. */
  readonly upOnly: boolean;
  /** Largeur d'un poteau, et la largeur tirée en plus. */
  readonly width: Ramp;
  readonly widthSpread: number;
  /** Lignes laissées au-dessus du poteau le plus haut (la grimpette). */
  readonly headroom: number;
}

/** Les sauts : de pierre en pierre, de plus en plus étroites, espacées et décalées. */
export const ARCADE_JUMPS: StepsTuning = {
  rows: 22,
  postRows: { min: 9, max: 19 },
  start: { width: 6, top: 15 },
  goalWidth: 6,
  difficultyRate: 0.85,
  posts: { first: 5, every: 2, max: 14 },
  gap: { from: 2, to: 5 },
  gapSpread: 1,
  rise: { from: 1, to: 3 },
  upOnly: false,
  width: { from: 4, to: 1.5 },
  widthSpread: 1,
  headroom: 0,
};

/** La grimpette : des rebords de plus en plus hauts, où Céleste s'accroche et se hisse. */
export const ARCADE_CLIMB: StepsTuning = {
  rows: 120,
  postRows: { min: 8, max: 116 },
  start: { width: 6, top: 112 },
  goalWidth: 6,
  difficultyRate: 0.85,
  posts: { first: 5, every: 2, max: 12 },
  gap: { from: 1, to: 3 },
  gapSpread: 1,
  rise: { from: 1.5, to: 4.5 },
  upOnly: true,
  width: { from: 4, to: 2 },
  widthSpread: 1,
  headroom: 10,
};

/**
 * La cheminée (D-166) : monter entre deux murs en sauts muraux, de section en section ; des briques
 * de jeu sur les murs et au fond. Le compteur compte la hauteur. PROVISOIRES, à régler sur téléphone.
 */
export const ARCADE_CHIMNEY = {
  /** Largeur de la salle (tuiles). */
  cols: 22,
  /** Hauteur d'une section (tuiles) : la largeur de la cheminée change d'une section à l'autre. */
  sectionRows: 6,
  /** Sections par niveau : `first`, une de plus tous les `every` niveaux, au plus `max`. */
  sections: { first: 3, every: 2, max: 10 },
  /** Difficulté du niveau n : 1 − rate^(n−1). */
  difficultyRate: 0.85,
  /**
   * Largeur intérieure visée (tuiles), la largeur tirée en plus, et ses bornes : au-delà de 5
   * tuiles, un saut mural monte moins qu'on ne retombe en traversant.
   */
  width: { from: 3, to: 5 } satisfies Ramp,
  widthSpread: 1,
  minWidth: 3,
  maxWidth: 5,
  /** Décalage d'une section à l'autre, au plus (tuiles) : de petits rebords, des surplombs. */
  shift: { from: 0, to: 1 } satisfies Ramp,
  /** Briques de jeu sur les murs, par section. */
  patches: { from: 0, to: 3 } satisfies Ramp,
  /** Marge entre le chemin du témoin et une brique de jeu du mur (px). */
  patchMarginPx: { from: 24, to: 6 } satisfies Ramp,
  /** Lignes au-dessus du haut de la cheminée (le poteau du fanion). */
  headroom: 6,
  /**
   * Niveaux vérifiés un par un par l'analyse (elle est lente sur une haute cheminée) ; le témoin
   * prouve déjà chaque niveau avec la vraie physique.
   */
  verifiedLevels: 12,
};

/**
 * Le grand vent (D-166) : une longue descente en planant entre des portes de briques de jeu.
 * PROVISOIRES, à régler sur téléphone.
 */
export const ARCADE_WIND = {
  /** Poteau de départ, en haut à gauche : largeur et ligne du haut. */
  start: { width: 5, top: 5 },
  goalWidth: 6,
  difficultyRate: 0.85,
  /** Portes par niveau : `first`, une de plus tous les `every` niveaux, au plus `max`. */
  gates: { first: 4, every: 2, max: 12 },
  /** Écart entre deux portes (tuiles) visé, et l'écart tiré en plus. */
  spacing: { from: 9, to: 5 } satisfies Ramp,
  spacingSpread: 2,
  /** Épaisseur d'une porte (tuiles). */
  thickness: { from: 1, to: 2 } satisfies Ramp,
  /** Marge au-dessus et au-dessous du chemin du témoin, dans l'ouverture d'une porte (px). */
  margin: { from: 26, to: 9 } satisfies Ramp,
  /**
   * Chance que le témoin change d'allure entre deux portes : planer en freinant, ou fermer le
   * parapluie un instant pour descendre plus vite (sinon, planer à pleine vitesse).
   */
  change: { from: 0, to: 0.75 } satisfies Ramp,
  /** Fermer le parapluie (le témoin) : durée en pas de 1/120 s. */
  dropSteps: { from: 8, to: 22 } satisfies Ramp,
  /** Lignes sous l'arrivée (le fond pique). */
  below: 3,
};

/**
 * Le couloir (D-166) : courir sur un sol, glisser sous les barres de briques de jeu qui pendent du
 * plafond (une tuile de passage), sous les tunnels (bouche de briques de jeu, plafond bas), sauter
 * les trous, de plus en plus larges : les plus larges demandent un saut long depuis la glissade.
 * Distances en tuiles. PROVISOIRES, à régler sur téléphone.
 */
export const ARCADE_CORRIDOR = {
  /** Hauteur du niveau (tuiles) : tout l'écran. */
  rows: 22,
  /** Ligne du haut du sol, et dernière ligne du plafond (le couloir est entre les deux). */
  floorRow: 17,
  ceilingRow: 9,
  /** Sol avant le premier obstacle, et après le dernier jusqu'au fanion (tuiles). */
  startCols: 8,
  goalCols: 6,
  difficultyRate: 0.85,
  /** Obstacles par niveau : `first`, un de plus tous les `every` niveaux, au plus `max`. */
  obstacles: { first: 5, every: 2, max: 14 },
  /** Sol entre deux obstacles (tuiles) visé, de plus en plus serré, et le sol tiré en plus. */
  gap: { from: 7, to: 2 } satisfies Ramp,
  gapSpread: 2,
  /** Chances d'un trou, et d'un tunnel (sinon, une barre). */
  pitChance: { from: 0.3, to: 0.4 } satisfies Ramp,
  tunnelChance: { from: 0.15, to: 0.2 } satisfies Ramp,
  /**
   * Largeur d'une barre (tuiles) visée, et la largeur tirée en plus : plus elle est large, plus la
   * glissade doit partir juste.
   */
  barWidth: { from: 1, to: 2.2 } satisfies Ramp,
  barSpread: 0.45,
  /** Longueur d'un tunnel (tuiles), sa bouche comprise. */
  tunnelLength: { from: 3, to: 6 } satisfies Ramp,
  /** Largeur d'un trou (tuiles) visée, et la largeur tirée en plus. */
  pitWidth: { from: 2, to: 5 } satisfies Ramp,
  pitSpread: 1,
  /** Chance qu'un trou soit trop large pour un saut en courant : le saut long depuis la glissade. */
  longJumpChance: { from: 0, to: 0.6 } satisfies Ramp,
  /**
   * Plage de départs du geste (px) où le témoin passe, au moins : en dessous, l'obstacle n'est pas
   * retenu. Le témoin part au milieu de la plage.
   */
  minWindowPx: { from: 16, to: 8 } satisfies Ramp,
};

/**
 * Les deux mondes (D-166) : de poteau en poteau au-dessus des briques de jeu, comme les sauts, mais
 * les poteaux n'existent souvent que dans une couche (le présent ou le souvenir, D-107) : on bascule
 * en plein saut. Des portes de briques de jeu d'une seule couche resserrent le moment de la bascule ;
 * plus tard, des murs d'une seule couche sur de larges poteaux communs : basculer en courant.
 * Distances en tuiles. PROVISOIRES, à régler sur téléphone.
 */
export const ARCADE_WORLDS = {
  rows: 22,
  /** Lignes permises pour le haut des poteaux. */
  postRows: { min: 10, max: 18 },
  /** Poteau de départ (commun aux deux couches) : largeur et ligne du haut. */
  start: { width: 6, top: 15 },
  goalWidth: 6,
  difficultyRate: 0.85,
  /** Poteaux par niveau (sans le départ ni le fanion) : `first`, un de plus tous les `every`. */
  posts: { first: 5, every: 2, max: 14 },
  /** Écart visé entre deux poteaux (tuiles), et l'écart tiré en plus. */
  gap: { from: 3, to: 4 } satisfies Ramp,
  gapSpread: 1,
  /** Différence de hauteur visée (tuiles), tirée jusqu'à cette valeur, vers le haut ou le bas. */
  rise: { from: 0.5, to: 2 } satisfies Ramp,
  /** Largeur d'un poteau, et la largeur tirée en plus. */
  width: { from: 4, to: 2 } satisfies Ramp,
  widthSpread: 1,
  /** Chance d'un poteau commun aux deux couches (un répit : pas de bascule). */
  restChance: { from: 0.15, to: 0.1 } satisfies Ramp,
  /**
   * Chance de portes autour d'un saut qui bascule : une porte de la couche d'arrivée près du départ
   * (basculer trop tôt, c'est la toucher), une de la couche de départ près de l'arrivée (trop tard).
   */
  gateChance: { from: 0, to: 0.9 } satisfies Ramp,
  /** Colonnes entre les deux portes (tuiles) : la place pour basculer. */
  gateSpacing: { from: 4.4, to: 3 } satisfies Ramp,
  /** Chance d'un large poteau commun avec deux murs d'une seule couche (basculer, puis revenir). */
  wallsChance: { from: 0, to: 0.25 } satisfies Ramp,
  /** Colonnes entre les deux murs (tuiles). */
  wallSpacing: { from: 5, to: 3 } satisfies Ramp,
  /**
   * Plage de bascules (px) où le témoin passe, au moins : en dessous, le poteau n'est pas retenu.
   * Le témoin bascule au milieu de la plage.
   */
  minWindowPx: { from: 24, to: 8 } satisfies Ramp,
};

/**
 * Le monstre (D-166) : le seul jeu où quelque chose pousse Céleste. Une course vers la droite sur un
 * sol, des trous et des blocs (on court et on saute, sans capacité) ; derrière, une masse pastel sans
 * visage (la poursuite des boss, D-67, D-87) : la toucher, c'est l'erreur. Sa vitesse se règle sur le
 * témoin : il garde au plus juste `lead` tuiles d'avance. Distances en tuiles. PROVISOIRES, à régler
 * sur téléphone.
 */
export const ARCADE_MONSTER = {
  rows: 22,
  /** Ligne du haut du sol. */
  floorRow: 17,
  /** Sol avant le premier obstacle, et après le dernier jusqu'au fanion (tuiles). */
  startCols: 10,
  goalCols: 8,
  difficultyRate: 0.85,
  /** Obstacles par niveau : `first`, un de plus tous les `every` niveaux, au plus `max`. */
  obstacles: { first: 6, every: 2, max: 16 },
  /** Sol entre deux obstacles (tuiles) visé, et le sol tiré en plus. */
  gap: { from: 6, to: 2 } satisfies Ramp,
  gapSpread: 3,
  /** Chance d'un trou (sinon, un bloc). */
  pitChance: { from: 0.45, to: 0.5 } satisfies Ramp,
  /** Largeur d'un trou (tuiles) visée, et la largeur tirée en plus. */
  pitWidth: { from: 2, to: 4.5 } satisfies Ramp,
  pitSpread: 1,
  /** Hauteur d'un bloc (tuiles) visée, tirée jusqu'à une tuile de plus ; sa largeur, tirée en plus. */
  blockHeight: { from: 1, to: 2.4 } satisfies Ramp,
  blockWidth: { from: 2, to: 3 } satisfies Ramp,
  blockSpread: 3,
  /** Plage de départs du saut (px) où le témoin passe, au moins. */
  minWindowPx: { from: 20, to: 8 } satisfies Ramp,
  /** Le monstre part après ce délai (ms), à cette distance derrière Céleste (tuiles). */
  startDelayMs: 600,
  startGapTiles: 5,
  /** Tronçons de vitesse : le monstre accélère d'un tronçon à l'autre (vitesse relative). */
  sections: 3,
  speedProfile: { from: 0.8, to: 1.15 } satisfies Ramp,
  /**
   * L'avance la plus petite du témoin sur le monstre, une fois réveillé (tuiles) : de moins en moins
   * de marge (à pleine course, une tuile se perd en un dixième de seconde).
   */
  lead: { from: 8, to: 3 } satisfies Ramp,
  /**
   * Le mode Sans fin (D-167) : la vitesse du monstre, une part de l'allure du témoin dans le morceau
   * (les sauts et les blocs le ralentissent), qui monte avec la difficulté ; **sa laisse** : au-delà de `leashTiles` derrière Céleste, il rattrape (de
   * `catchUpRate` tuiles/s par tuile de retard en plus, jusqu'à `catchUpMaxSpeed` tuiles/s).
   */
  endless: {
    speed: { from: 0.7, to: 0.95 } satisfies Ramp,
    leashTiles: 8,
    catchUpRate: 1.5,
    catchUpMaxSpeed: 16,
  },
};

/** Le mode Sans fin (D-167). PROVISOIRES, à régler sur téléphone. */
export const ARCADE_ENDLESS = {
  /**
   * Plafond de la difficulté : le morceau n a celle du niveau n, jusqu'au plus dur vérifié par les
   * tests ; au-delà, elle ne monte plus.
   */
  capLevel: ARCADE.verifiedLevels,
  /** Niveau à atteindre dans le mode Niveaux d'un jeu pour ouvrir son mode Sans fin (PLACEHOLDER). */
  unlockLevel: 5,
  /** Un bip tous les… (m). */
  milestoneMeters: 100,
};
