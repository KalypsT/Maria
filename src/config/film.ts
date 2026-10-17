import type { MusicTrack } from './audio';
import type { SfxSlot } from './sfx';
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
  /** Un film qui finit dans le noir reste ce temps à l'écran, le temps que le jeu y passe (ms). */
  blackHoldMs: 400,
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
  /** Céleste en phase 4, assise, tournée vers Maria (illustration de l'utilisateur, D-190). */
  celesteTeeSit: 'art/film/celeste-tee-sit.png',
  maria: 'art/maria.png',
  /**
   * Le film de la fin (D-190, D-191) : la chambre ce matin-là, le jour et la nuit, capturée dans le
   * jeu dans un même cadre (`scripts/film/capture-room.js`) ; Maria de près sur son étagère.
   */
  roomDay: 'art/film/room-day.webp',
  roomNight: 'art/film/room-night.webp',
  mariaClose: 'art/film/maria-close.webp',
  /**
   * Céleste qui rentre de l'école, son cartable (D-191) : illustration de l'utilisateur, détourée
   * (`scripts/art-cutout.py`), faite pour 9 ans (D-190) ; à cette taille, elle passe pour 7 ans.
   */
  celesteSchool: 'art/film/celeste-school.png',
  /** Son cartable posé (PLACEHOLDER, dessiné par `scripts/make-intro-art.py film`). */
  schoolbag: 'art/film/schoolbag.png',
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
  /** Retournée (l'image regarde à gauche). */
  readonly flip?: boolean;
}

/**
 * La chambre dans les décors du film (px du plan) : le verre de la fenêtre, le sol. Le soleil tombe
 * de la fenêtre jusqu'au sol, vers la gauche.
 */
export const FILM_ROOM = {
  window: { x: 870, y: 156, w: 420, h: 336 },
  floorY: 972,
  /** Le carré de soleil : sa largeur sous la fenêtre, son décalage au sol, son intensité. */
  sun: { width: 300, slant: 380, alpha: 0.09 },
  /** La porte de la chambre (vers le couloir), au bas du mur de droite : sa lumière, ouverte. */
  door: { x: 1872, y: 822, w: 48, h: 150, spill: 240 },
} as const;

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
  /** Le carré de soleil : sa place sous la fenêtre au fil du plan (x, px du plan). */
  readonly sun?: IntroKeys;
  /** La porte de la chambre : ouverte de 0 (fermée) à 1, la lumière du couloir (D-190). */
  readonly door?: IntroKeys;
  /** La musique au début du plan (null : le silence) ; absente : inchangée. */
  readonly music?: MusicTrack | null;
  /** Des bruitages pendant le plan : le moment (ms) et l'emplacement. */
  readonly sfx?: readonly (readonly [number, SfxSlot])[];
  /**
   * Le monde étrange, un instant (D-190, le dernier signe) : des étoiles turquoise qui scintillent
   * autour d'un point, et un halo léger ; leur intensité au fil du plan.
   */
  readonly sparkles?: {
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly count: number;
    readonly strength: IntroKeys;
  };
}

/** Un film : ses plans ; `outroMs` : il finit dans le noir (sinon, il se fond dans le jeu). */
export interface Film {
  readonly shots: readonly FilmShot[];
  readonly outroMs?: number;
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
    durationMs: 10400,
    enter: { kind: 'dissolve', ms: 2800 },
    camera: { from: ROOM_CAMERA, to: { x: 960, y: 580, zoom: 1.12 } },
    backdrop: 'morning',
    // Debout d'abord, à la place du premier soir : elle a grandi. Puis, en fondu (comme le pyjama
    // et la robe de l'intro), assise devant Maria, qu'elle regarde.
    sprites: [
      {
        image: 'celesteTee',
        x: 640,
        bottom: 952,
        height: 780,
        breathe: true,
        shadow: 290,
        opacity: [
          [5800, 1],
          [7000, 0],
        ],
      },
      {
        image: 'celesteTeeSit',
        x: 760,
        bottom: 958,
        height: 450,
        breathe: true,
        shadow: 330,
        opacity: [
          [5000, 0],
          [6200, 1],
        ],
      },
      MARIA,
    ],
    glow: { color: 'warm', x: 900, y: 700, radius: 760, strength: [[0, 0.18]] },
    motes: { color: 'warm', count: 12, area: [300, 100, 1700, 900], rise: false },
  },
];

/** Toute la chambre, immobile (le cadre des décors du film). */
const WHOLE: FilmShot['camera'] = {
  from: { x: 960, y: 540, zoom: 1 },
  to: { x: 960, y: 540, zoom: 1 },
};
/** Une nuit (un noir) : de plus en plus courte. */
const night = (ms: number, holdMs: number): IntroTransition => ({
  kind: 'dip',
  ms,
  holdMs,
  color: '#000',
});
const dissolve = (ms: number): IntroTransition => ({ kind: 'dissolve', ms });
/** Le soleil traverse la pièce pendant le plan (de droite à gauche, x sous la fenêtre). */
const sunAcross = (ms: number): IntroKeys => [
  [0, 1180],
  [ms, 820],
];
/** La boîte à musique, sur la traverse du lit cabane, dans les décors. */
const MUSIC_BOX = { x: 312, y: 612 } as const;
/**
 * Céleste à l'échelle du jeu (≈ 110 px du plan à 7 ans), juste entrée par la porte, entre elle et la
 * toise, tournée vers la chambre (l'illustration regarde à droite : retournée). Elle ne lève pas les
 * yeux vers l'étagère. PROVISOIRE.
 */
const CELESTE_SCHOOL: FilmSprite = {
  image: 'celesteSchool',
  x: 1815,
  bottom: 972,
  height: 112,
  flip: true,
};
/** Son cartable, posé sous le bureau, entre le caisson et le pied (PROVISOIRE). */
const SCHOOLBAG: FilmSprite = { image: 'schoolbag', x: 1440, bottom: 972, height: 40 };

/**
 * Quelques semaines (D-191), quand la porte s'est refermée : la chambre, Maria sur son étagère.
 * D'abord des nuits, des noirs de plus en plus courts ; puis un jour, la porte s'ouvre : Céleste
 * rentre de l'école, son cartable ; elle s'efface, le cartable reste posé sous le bureau. Puis des
 * jours en fondus : le cartable là, pas là, là (l'école, sa vie à elle). Maria ne bouge pas. Puis
 * tout ralentit sur Maria, la même ; le dernier signe ; le noir. Céleste reste une enfant : la
 * fin ne la fait pas grandir au-delà du jeu.
 */
const WEEKS: readonly FilmShot[] = [
  {
    id: 'left',
    scene: 'room',
    durationMs: 3800,
    enter: { kind: 'cut' },
    camera: WHOLE,
    backdrop: 'roomDay',
    sprites: [],
    sun: sunAcross(3800),
  },
  {
    id: 'night-1',
    scene: 'night-1',
    durationMs: 5200,
    enter: night(1800, 900),
    camera: WHOLE,
    backdrop: 'roomNight',
    sprites: [],
  },
  {
    id: 'day-2',
    scene: 'day-2',
    durationMs: 4000,
    enter: night(1400, 500),
    camera: WHOLE,
    backdrop: 'roomDay',
    sprites: [],
    sun: sunAcross(4000),
  },
  {
    id: 'night-2',
    scene: 'night-2',
    durationMs: 2900,
    enter: night(1000, 300),
    camera: WHOLE,
    backdrop: 'roomNight',
    sprites: [],
  },
  {
    id: 'day-3',
    scene: 'day-3',
    durationMs: 2400,
    enter: night(800, 200),
    camera: WHOLE,
    backdrop: 'roomDay',
    sprites: [],
    sun: sunAcross(2400),
  },
  {
    id: 'night-3',
    scene: 'night-3',
    durationMs: 1500,
    enter: night(600, 100),
    camera: WHOLE,
    backdrop: 'roomNight',
    sprites: [],
  },
  {
    // Un jour, la porte s'ouvre : elle rentre de l'école, son cartable sur le dos, un moment ;
    // elle s'efface, le cartable reste, posé sous le bureau ; la porte se referme.
    id: 'school',
    scene: 'school',
    durationMs: 7600,
    enter: night(400, 80),
    camera: WHOLE,
    backdrop: 'roomDay',
    sprites: [
      {
        ...CELESTE_SCHOOL,
        opacity: [
          [800, 0],
          [1500, 1],
          [4400, 1],
          [5100, 0],
        ],
      },
      {
        ...SCHOOLBAG,
        opacity: [
          [4400, 0],
          [5100, 1],
        ],
      },
    ],
    sun: sunAcross(7600),
    door: [
      [0, 0],
      [700, 1],
      [5200, 1],
      [6200, 0],
    ],
  },
  {
    id: 'bag-1',
    scene: 'bag-1',
    durationMs: 2200,
    enter: dissolve(700),
    camera: WHOLE,
    backdrop: 'roomDay',
    sprites: [SCHOOLBAG],
    sun: sunAcross(2200),
  },
  {
    // Elle est à l'école.
    id: 'bag-0',
    scene: 'bag-0',
    durationMs: 1800,
    enter: dissolve(600),
    camera: WHOLE,
    backdrop: 'roomDay',
    sprites: [],
    sun: sunAcross(1800),
  },
  {
    id: 'bag-2',
    scene: 'bag-2',
    durationMs: 1800,
    enter: dissolve(600),
    camera: WHOLE,
    backdrop: 'roomDay',
    sprites: [SCHOOLBAG],
    sun: sunAcross(1800),
  },
  {
    // Maria, la même : la vue s'approche lentement, le soleil passe sur elle.
    id: 'maria',
    scene: 'maria',
    durationMs: 8000,
    enter: dissolve(1800),
    camera: { from: { x: 960, y: 560, zoom: 1 }, to: { x: 960, y: 590, zoom: 1.14 } },
    backdrop: 'mariaClose',
    sprites: [{ image: 'maria', x: 960, bottom: 716, height: 420 }],
    // Le soleil passe sur elle, une fois.
    glow: {
      color: 'warm',
      x: 960,
      y: 560,
      radius: 620,
      strength: [
        [0, 0.05],
        [3600, 0.42],
        [7200, 0.1],
      ],
    },
  },
  {
    // Le dernier signe (§12, choix B) : la dernière nuit, la chambre vide. La musique se tait. La
    // boîte à musique, sur son étagère au-dessus du lit, s'éclaire en turquoise et joue seule trois
    // notes de la berceuse ; des étoiles turquoise s'allument au mur autour de Maria. Elle ne bouge
    // pas. Puis tout redevient normal. Le jeu s'est ouvert sur cette boîte (l'intro, plan 1).
    id: 'last-sign',
    scene: 'last-sign',
    durationMs: 9400,
    enter: dissolve(1800),
    camera: { from: { x: 960, y: 540, zoom: 1 }, to: { x: 900, y: 560, zoom: 1.06 } },
    backdrop: 'roomNight',
    sprites: [],
    music: null,
    glow: {
      color: 'teal',
      x: MUSIC_BOX.x,
      y: MUSIC_BOX.y,
      radius: 170,
      strength: [
        [2300, 0],
        [2900, 0.85],
        [5600, 0.6],
        [6900, 0],
      ],
    },
    sfx: [
      [2700, 'lullaby'],
      [3400, 'lullaby'],
      [4400, 'lullaby'],
    ],
    sparkles: {
      x: 1320,
      y: 555,
      radius: 150,
      count: 9,
      strength: [
        [3200, 0],
        [4000, 1],
        [6000, 1],
        [7300, 0],
      ],
    },
  },
];

export const FILMS = {
  contrechamp: { shots: CONTRECHAMP },
  weeks: { shots: WEEKS, outroMs: 2200 },
} as const satisfies Record<string, Film>;
export type FilmId = keyof typeof FILMS;

export function isFilmId(id: string): id is FilmId {
  return Object.hasOwn(FILMS, id);
}
