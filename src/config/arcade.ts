import { Ability } from './abilities';
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
