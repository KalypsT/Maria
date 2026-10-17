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
  maria: 'art/maria.png',
  /**
   * Le film des années (D-190) : la chambre à chaque âge, capturée dans le jeu dans un même cadre
   * (`scripts/film/capture-room.js`) ; Maria de près sur son étagère ; le mur derrière la toise.
   */
  age7Day: 'art/film/room-age7-day.webp',
  age7Night: 'art/film/room-age7-night.webp',
  age9: 'art/film/room-age9.webp',
  age12: 'art/film/room-age12.webp',
  age15: 'art/film/room-age15.webp',
  age18: 'art/film/room-age18.webp',
  mariaClose: 'art/film/maria-close.webp',
  toiseWall: 'art/film/toise-wall.webp',
  /** Son téléphone, sur le bureau, à 15 ans (PLACEHOLDER, dessiné par le script). */
  phone: 'art/film/phone.png',
  /** La chambre une nuit, à 13 ans : papa à la porte. */
  age13Night: 'art/film/room-age13-night.webp',
  /**
   * Céleste qui grandit (D-190, PR 7) : à 9 ans debout, son cartable ; à 12 ans assise sur son lit,
   * un casque ; à 15 ans debout, son téléphone ; à 18 ans à la porte, sa valise, tournée vers Maria.
   * PLACEHOLDER : des silhouettes (`scripts/make-intro-art.py film`) jusqu'aux illustrations de
   * l'utilisateur, aux mêmes noms (prompts dans `docs/PROMPTS_PERSONNAGES.md`).
   */
  celeste9: 'art/film/celeste-9.png',
  celeste12: 'art/film/celeste-12.png',
  celeste15: 'art/film/celeste-15.png',
  celeste18: 'art/film/celeste-18.png',
  /** Papa à la porte (D-37, D-123), tourné vers la chambre. */
  dad: 'art/dad-door.png',
  /** La dernière nuit, la chambre vide : le dernier signe (PR 8). */
  age18Night: 'art/film/room-age18-night.webp',
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

/** Les saisons à la fenêtre de la chambre (D-190) : sa couleur, et ce qui passe derrière. */
export type FilmSeason = 'winter' | 'spring' | 'summer' | 'autumn';

/**
 * La chambre dans les décors du film des années (px du plan) : le verre de la fenêtre, le sol. Le
 * soleil tombe de la fenêtre jusqu'au sol, vers la gauche.
 */
export const FILM_ROOM = {
  window: { x: 870, y: 156, w: 420, h: 336 },
  floorY: 972,
  /** Le carré de soleil : sa largeur sous la fenêtre, son décalage au sol, son intensité. */
  sun: { width: 300, slant: 380, alpha: 0.09 },
  /** La porte de la chambre (vers le couloir), au bas du mur de droite : sa lumière, ouverte. */
  door: { x: 1872, y: 822, w: 48, h: 150, spill: 240 },
} as const;

/** Les saisons : la teinte du verre, la couleur et le nombre de ce qui passe, sa chute (px/s). */
export const FILM_SEASONS: Readonly<
  Record<
    FilmSeason,
    {
      readonly tint: string;
      readonly tintAlpha: number;
      readonly color: string;
      readonly count: number;
      readonly fall: number;
    }
  >
> = {
  winter: { tint: '#e8f0fa', tintAlpha: 0.4, color: '#ffffff', count: 34, fall: 70 },
  spring: { tint: '#ffe6f0', tintAlpha: 0.2, color: '#f7b6cf', count: 18, fall: 34 },
  summer: { tint: '#fff1b8', tintAlpha: 0.18, color: '#7fb069', count: 8, fall: 10 },
  autumn: { tint: '#f6c48a', tintAlpha: 0.26, color: '#d9772f', count: 16, fall: 52 },
};

/**
 * La toise de la chambre en gros plan (D-190) : dessinée par le film, un trait rose à chaque âge
 * (comme les traits du jeu, D-43) et l'âge écrit au crayon à côté, de la main d'un parent. Choix de
 * l'utilisateur : 4 ans en phase 1, un an de plus à chaque phase, 7 ans à la fin ; puis un an de
 * plus à chaque trait, jusqu'à 18 ans. Les tailles (cm) ralentissent : elle a fini de grandir.
 * PROVISOIRE.
 */
export const FILM_TOISE = {
  firstAge: 4,
  /** La taille à chaque âge, de 4 à 18 ans (cm). */
  heights: [102, 109, 115, 121, 127, 133, 138, 143, 149, 155, 159, 162, 165, 167, 169],
  /** La planche : son milieu (x), sa largeur, le haut et le bas (cm), l'échelle (px par cm). */
  x: 960,
  width: 150,
  topCm: 176,
  bottomCm: 90,
  pxPerCm: 18,
  /** y du plan à 0 cm (le sol, loin sous l'image). */
  zeroY: 2700,
  /** Le trait, puis l'âge écrit (ms chacun). */
  lineMs: 500,
  wordMs: 500,
  lineColor: '#e0679a',
  textColor: '#4a4458',
  font: "700 46px 'Maria Hand', 'Comic Sans MS', cursive",
  /** À partir de cet âge, les traits se serrent : l'âge s'écrit d'un côté puis de l'autre. */
  alternateFrom: 15,
  /** La vue se rapproche de la planche. */
  zoom: 1.35,
} as const;

/** y du plan d'une taille sur la toise (cm). */
export function toiseY(cm: number): number {
  return FILM_TOISE.zeroY - cm * FILM_TOISE.pxPerCm;
}

/** La taille (cm) à un âge, sur la toise (bornée aux âges connus). */
export function toiseHeight(age: number): number {
  const { heights, firstAge } = FILM_TOISE;
  const i = Math.min(heights.length - 1, Math.max(0, age - firstAge));
  return heights[i] ?? 0;
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
  /** La saison à la fenêtre (un décor de la chambre). */
  readonly season?: FilmSeason;
  /** Le carré de soleil : sa place sous la fenêtre au fil du plan (x, px du plan). */
  readonly sun?: IntroKeys;
  /**
   * La toise en gros plan : les traits jusqu'à l'âge `shown`, puis ceux jusqu'à `write`, tracés
   * l'un après l'autre à partir de `fromMs`. Le décor reste fixe, la vue monte avec les traits.
   */
  readonly toise?: { readonly shown: number; readonly write: number; readonly fromMs: number };
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

/** Toute la chambre, immobile (le cadre des décors du film des années). */
const WHOLE: FilmShot['camera'] = {
  from: { x: 960, y: 540, zoom: 1 },
  to: { x: 960, y: 540, zoom: 1 },
};
/** La vue de la toise : centrée sur la taille d'un âge, entre deux âges au fil du plan. */
function toiseCamera(fromAge: number, toAge: number): FilmShot['camera'] {
  const at = (age: number) => ({
    x: FILM_TOISE.x + 60,
    y: toiseY(toiseHeight(age)) + 90,
    zoom: FILM_TOISE.zoom,
  });
  return { from: at(fromAge), to: at(toAge) };
}
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
/** La boîte à musique, sur l'étagère au-dessus du lit (la cabane partie), dans les décors. */
const MUSIC_BOX = { x: 312, y: 612 } as const;
/** Le téléphone, debout contre la lampe du bureau. */
const PHONE: FilmSprite = { image: 'phone', x: 1424, bottom: 742, height: 66 };
/**
 * Quelqu'un passe dans les années, comme dans un time-lapse : il apparaît dans le fondu, reste,
 * puis s'efface avant la fin du plan.
 */
const passing = (ms: number): IntroKeys => [
  [0, 0],
  [500, 0],
  [1100, 1],
  [ms - 700, 1],
  [ms - 200, 0],
];
/**
 * Céleste qui grandit, à l'échelle du jeu (Céleste à 7 ans ≈ 110 px du plan, papa ≈ 390) : de plus
 * en plus grande dans sa chambre d'enfant. Le sol : `FILM_ROOM.floorY`. PROVISOIRE.
 */
const CELESTE_AT = {
  /** Debout juste sous l'étagère de Maria, son cartable ; elle ne lève pas les yeux. */
  9: { image: 'celeste9', x: 1300, bottom: 972, height: 150 },
  /** Assise sur son lit, un casque. */
  12: { image: 'celeste12', x: 330, bottom: 792, height: 150 },
  /** Debout sous la fenêtre, son téléphone. */
  15: { image: 'celeste15', x: 760, bottom: 972, height: 260 },
  /** À la porte, sa valise, tournée vers Maria. */
  18: { image: 'celeste18', x: 1720, bottom: 972, height: 320 },
} as const satisfies Record<number, FilmSprite>;

/**
 * Le film des années (D-190), quand la porte s'est refermée : la chambre, Maria sur son étagère.
 * D'abord des nuits, lentes, des noirs de plus en plus courts ; puis les années, en fondus de plus
 * en plus rapides : le soleil qui traverse la pièce, les saisons à la fenêtre, les choses de bébé
 * qui s'en vont, les siennes qui arrivent ; entre elles, la toise : un trait plus haut, son âge.
 * Puis tout ralentit sur Maria, la même. Le noir. Céleste qui grandit et papa : la PR 7.
 */
const YEARS: readonly FilmShot[] = [
  {
    id: 'left',
    scene: 'room',
    durationMs: 3800,
    enter: { kind: 'cut' },
    camera: WHOLE,
    backdrop: 'age7Day',
    sprites: [],
    sun: sunAcross(3800),
  },
  {
    id: 'night-1',
    scene: 'night-1',
    durationMs: 5200,
    enter: night(1800, 900),
    camera: WHOLE,
    backdrop: 'age7Night',
    sprites: [],
  },
  {
    id: 'day-2',
    scene: 'day-2',
    durationMs: 4000,
    enter: night(1400, 500),
    camera: WHOLE,
    backdrop: 'age7Day',
    sprites: [],
    sun: sunAcross(4000),
  },
  {
    id: 'night-2',
    scene: 'night-2',
    durationMs: 2900,
    enter: night(1000, 300),
    camera: WHOLE,
    backdrop: 'age7Night',
    sprites: [],
  },
  {
    id: 'day-3',
    scene: 'day-3',
    durationMs: 2400,
    enter: night(800, 200),
    camera: WHOLE,
    backdrop: 'age7Day',
    sprites: [],
    sun: sunAcross(2400),
  },
  {
    id: 'night-3',
    scene: 'night-3',
    durationMs: 1500,
    enter: night(600, 100),
    camera: WHOLE,
    backdrop: 'age7Night',
    sprites: [],
  },
  {
    id: 'day-4',
    scene: 'day-4',
    durationMs: 1500,
    enter: night(400, 80),
    camera: WHOLE,
    backdrop: 'age7Day',
    sprites: [],
    sun: sunAcross(1500),
  },
  {
    id: 'toise-8',
    scene: 'toise-8',
    durationMs: 3600,
    enter: dissolve(600),
    camera: toiseCamera(6, 8),
    backdrop: 'toiseWall',
    sprites: [],
    toise: { shown: 7, write: 8, fromMs: 1100 },
  },
  {
    id: 'age9-winter',
    scene: 'age9-winter',
    durationMs: 2800,
    enter: dissolve(900),
    camera: WHOLE,
    backdrop: 'age9',
    sprites: [],
    season: 'winter',
    sun: sunAcross(2800),
  },
  {
    id: 'age9-spring',
    scene: 'age9-spring',
    durationMs: 3400,
    enter: dissolve(700),
    camera: WHOLE,
    backdrop: 'age9',
    sprites: [{ ...CELESTE_AT[9], opacity: passing(3400) }],
    season: 'spring',
    sun: sunAcross(3400),
  },
  {
    id: 'age9-summer',
    scene: 'age9-summer',
    durationMs: 2000,
    enter: dissolve(700),
    camera: WHOLE,
    backdrop: 'age9',
    sprites: [],
    season: 'summer',
    sun: sunAcross(2000),
  },
  {
    id: 'toise-11',
    scene: 'toise-11',
    durationMs: 4400,
    enter: dissolve(600),
    camera: toiseCamera(8, 11),
    backdrop: 'toiseWall',
    sprites: [],
    toise: { shown: 8, write: 11, fromMs: 700 },
  },
  {
    id: 'age12-autumn',
    scene: 'age12-autumn',
    durationMs: 2200,
    enter: dissolve(800),
    camera: WHOLE,
    backdrop: 'age12',
    sprites: [],
    season: 'autumn',
    sun: sunAcross(2200),
  },
  {
    id: 'age12-winter',
    scene: 'age12-winter',
    durationMs: 3400,
    enter: dissolve(600),
    camera: WHOLE,
    backdrop: 'age12',
    sprites: [{ ...CELESTE_AT[12], opacity: passing(3400) }],
    season: 'winter',
    sun: sunAcross(3400),
  },
  {
    id: 'age12-spring',
    scene: 'age12-spring',
    durationMs: 1800,
    enter: dissolve(600),
    camera: WHOLE,
    backdrop: 'age12',
    sprites: [],
    season: 'spring',
    sun: sunAcross(1800),
  },
  {
    // Une nuit : la porte s'entrouvre, papa regarde l'étagère, sans un mot, et referme doucement.
    id: 'age13-night',
    scene: 'age13-night',
    durationMs: 7000,
    enter: dissolve(900),
    camera: WHOLE,
    backdrop: 'age13Night',
    sprites: [
      {
        image: 'dad',
        x: 1832,
        bottom: 972,
        height: 390,
        flip: true,
        opacity: [
          [1500, 0],
          [2200, 1],
          [4800, 1],
          [5400, 0],
        ],
      },
    ],
    door: [
      [700, 0],
      [1500, 1],
      [5400, 1],
      [6400, 0],
    ],
  },
  {
    id: 'toise-14',
    scene: 'toise-14',
    durationMs: 4200,
    enter: dissolve(600),
    camera: toiseCamera(11, 14),
    backdrop: 'toiseWall',
    sprites: [],
    toise: { shown: 11, write: 14, fromMs: 600 },
  },
  {
    id: 'age15-summer',
    scene: 'age15-summer',
    durationMs: 3400,
    enter: dissolve(700),
    camera: WHOLE,
    backdrop: 'age15',
    // Son téléphone à la main : pas sur le bureau.
    sprites: [{ ...CELESTE_AT[15], opacity: passing(3400) }],
    season: 'summer',
    sun: sunAcross(3400),
  },
  {
    id: 'age15-autumn',
    scene: 'age15-autumn',
    durationMs: 1800,
    enter: dissolve(600),
    camera: WHOLE,
    backdrop: 'age15',
    sprites: [PHONE],
    season: 'autumn',
    sun: sunAcross(1800),
  },
  {
    id: 'toise-18',
    scene: 'toise-18',
    durationMs: 5600,
    enter: dissolve(600),
    camera: toiseCamera(14, 18),
    backdrop: 'toiseWall',
    sprites: [],
    toise: { shown: 14, write: 18, fromMs: 700 },
  },
  {
    // Le départ, à 18 ans : la porte s'ouvre ; elle est là, sa valise, tournée vers Maria, un
    // moment ; elle s'en va ; la porte se ferme. Comme à 7 ans. Elle ne la reprend pas.
    id: 'age18',
    scene: 'age18',
    durationMs: 7600,
    enter: dissolve(900),
    camera: WHOLE,
    backdrop: 'age18',
    sprites: [
      {
        ...CELESTE_AT[18],
        opacity: [
          [800, 0],
          [1500, 1],
          [5200, 1],
          [5900, 0],
        ],
      },
    ],
    season: 'spring',
    sun: sunAcross(7600),
    door: [
      [0, 0],
      [800, 1],
      [6000, 1],
      [7000, 0],
    ],
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
    backdrop: 'age18Night',
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
  years: { shots: YEARS, outroMs: 2200 },
} as const satisfies Record<string, Film>;
export type FilmId = keyof typeof FILMS;

export function isFilmId(id: string): id is FilmId {
  return Object.hasOwn(FILMS, id);
}
