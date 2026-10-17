import {
  MARIA_ON_RUG,
  ROOM_CAMERA,
  type IntroCamera,
  type IntroGlowColor,
  type IntroKeys,
  type IntroTransition,
} from './intro';

/**
 * Le film de la fin (D-190) : des plans illustrés, joués par le moteur de l'intro (D-185) au
 * milieu du dernier niveau, le jeu arrêté (étape d'histoire `film`). Mêmes coordonnées que l'intro :
 * un plan mesure 1920 × 1080 px, l'écran le couvre. Aucun texte. Durées, cadrages et intensités
 * PROVISOIRES, à régler sur téléphone.
 */

/** Réglages communs aux films. */
export const FILM = {
  /** Le film apparaît par-dessus l'image du jeu (fondu enchaîné), puis s'y fond (ms). */
  fadeInMs: 1600,
  fadeOutMs: 1600,
  /** Images trop longues à charger : pas de film (le jeu ne doit jamais attendre, ms). */
  loadTimeoutMs: 5000,
  /** Largeur maximale du canvas (px réels). */
  maxRenderWidth: 1920,
  /** La respiration de Céleste : période (ms) et amplitude (fraction de sa hauteur). */
  breathMs: 2800,
  breathAmount: 0.006,
  /** Assombrissement des bords de l'image (0 : aucun). */
  vignette: 0.5,
} as const;

/** Images des films (chemins relatifs à la page). Les décors : `scripts/make-intro-art.py`. */
export const FILM_IMAGES = {
  /** Le premier soir de l'intro (plan 3), le coin du tapis. */
  evening: 'art/intro/evening.webp',
  /** Le même cadre, le matin de la fin. */
  morning: 'art/intro/morning.webp',
  celeste: 'art/celeste.png',
  /**
   * Céleste en phase 4 (la tenue de la fin, D-150). PLACEHOLDER : l'illustration de l'écran de
   * départ, debout ; une illustration assise, tournée vers Maria, pourra la remplacer.
   */
  celesteTee: 'art/celeste-tee.png',
  maria: 'art/maria.png',
} as const;
export type FilmImage = keyof typeof FILM_IMAGES;

/** Un personnage ou un objet posé dans le plan (comme ceux de l'intro). */
export interface FilmSprite {
  readonly image: FilmImage;
  /** Centre horizontal et bas de l'image (px du plan), hauteur affichée. */
  readonly x: number;
  readonly bottom: number;
  readonly height: number;
  /** Céleste respire. Maria jamais : elle ne bouge pas (pilier 5). */
  readonly breathe?: boolean;
  /** Opacité au fil du plan ; absente : 1. */
  readonly opacity?: IntroKeys;
  /** Ombre au sol, largeur (px). */
  readonly shadow?: number;
}

/** Un plan du film. Deux plans consécutifs du même décor (`scene`) partagent son temps. */
export interface FilmShot {
  readonly id: string;
  readonly scene: string;
  readonly durationMs: number;
  readonly enter: IntroTransition;
  readonly camera: {
    readonly from: IntroCamera;
    readonly to: IntroCamera;
    readonly moveMs?: number;
    readonly startMs?: number;
  };
  /** Le décor, sur tout le plan (1920 × 1080). */
  readonly backdrop: FilmImage;
  readonly sprites: readonly FilmSprite[];
  readonly glow?: {
    readonly color: IntroGlowColor;
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly strength: IntroKeys;
  };
  readonly motes?: {
    readonly color: IntroGlowColor;
    readonly count: number;
    readonly area: readonly [number, number, number, number];
    readonly rise: boolean;
  };
  /** La bulle cœur, comme en jeu. */
  readonly bubble?: {
    readonly x: number;
    readonly y: number;
    readonly scale: number;
    readonly opacity: IntroKeys;
  };
}

/** Maria, à sa place sur le tapis, la même dans tous les plans (elle ne bouge jamais). */
const MARIA: FilmSprite = { ...MARIA_ON_RUG, image: 'maria' };

/**
 * Le contrechamp (D-190), sur le tapis, le matin de la fin : le premier soir de l'intro revient
 * (Céleste en pyjama, Maria, le cœur), puis se fond dans le même cadre ce matin : Céleste a grandi,
 * Maria est la même, à la même place. La vue se rapproche doucement.
 */
const CONTRECHAMP: readonly FilmShot[] = [
  {
    id: 'then',
    scene: 'evening',
    durationMs: 4400,
    enter: { kind: 'cut' },
    camera: { from: ROOM_CAMERA, to: ROOM_CAMERA },
    backdrop: 'evening',
    sprites: [
      { image: 'celeste', x: 640, bottom: 952, height: 660, breathe: true, shadow: 260 },
      MARIA,
    ],
    glow: { color: 'warm', x: 800, y: 820, radius: 700, strength: [[0, 0.33]] },
    motes: { color: 'warm', count: 18, area: [300, 100, 1700, 900], rise: false },
    bubble: {
      x: 860,
      y: 250,
      scale: 1.15,
      opacity: [
        [700, 0],
        [1100, 1],
        [3300, 1],
        [3700, 0],
      ],
    },
  },
  {
    id: 'now',
    scene: 'morning',
    durationMs: 7600,
    enter: { kind: 'dissolve', ms: 2800 },
    camera: { from: ROOM_CAMERA, to: { x: 960, y: 580, zoom: 1.12 } },
    backdrop: 'morning',
    sprites: [
      { image: 'celesteTee', x: 640, bottom: 952, height: 780, breathe: true, shadow: 290 },
      MARIA,
    ],
    glow: { color: 'warm', x: 900, y: 700, radius: 760, strength: [[0, 0.18]] },
    motes: { color: 'warm', count: 12, area: [300, 100, 1700, 900], rise: false },
  },
];

export const FILMS = {
  contrechamp: CONTRECHAMP,
} as const satisfies Record<string, readonly FilmShot[]>;
export type FilmId = keyof typeof FILMS;

export function isFilmId(id: string): id is FilmId {
  return Object.hasOwn(FILMS, id);
}
