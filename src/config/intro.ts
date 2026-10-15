import type { MusicTrack } from './audio';

/**
 * L'intro au lancement (D-185), d'après le story-board validé : la boîte à musique, le dessin, le
 * premier soir, Céleste qui grandit, le berceau vide, les choses perdues, Céleste. Aucun texte. Le
 * plan 8 (le titre qui s'écrit) appartient à l'écran titre. Durées, cadrages et intensités
 * PROVISOIRES, à régler sur téléphone.
 *
 * Coordonnées : un plan mesure 1920 × 1080 px ; l'écran le couvre (le surplus est rogné).
 */
export const INTRO_VIEW = { width: 1920, height: 1080 } as const;

/** Images de l'intro (chemins relatifs à la page). Les décors : `scripts/make-intro-art.py`. */
export const INTRO_IMAGES = {
  musicBox: 'art/memory-music-box.webp',
  drawing: 'art/memory-family-drawing.webp',
  evening: 'art/intro/evening.webp',
  cradle: 'art/intro/cradle.webp',
  strange: 'art/intro/strange.webp',
  celeste: 'art/celeste.png',
  celesteDress: 'art/celeste-dress.png',
  celesteRim: 'art/intro/celeste-rim.webp',
  maria: 'art/maria.png',
  toyTown: 'art/intro/toy-town.webp',
  lostSlipper: 'art/intro/lost-slipper.webp',
  lostSpoon: 'art/intro/lost-spoon.webp',
  lostRattle: 'art/intro/lost-rattle.webp',
  lostBottle: 'art/intro/lost-bottle.webp',
  lostBonnet: 'art/intro/lost-bonnet.webp',
  lostBook: 'art/intro/lost-book.webp',
} as const;
export type IntroImage = keyof typeof INTRO_IMAGES;

/** Marge des halos (`celesteRim`, `toyTown`) autour de l'image source, en px source (le script). */
export const INTRO_RIM_PAD = 40;

/** Réglages généraux de l'intro. */
export const INTRO = {
  /** Le bouton « Passer », montré par un toucher pendant l'intro (ms). */
  skipButtonMs: 3000,
  /** Passer : fondu vers le papier de l'écran titre (ms). */
  skipFadeMs: 450,
  /** La fin : fondu vers le papier de l'écran titre, sur la fin du dernier plan (ms). */
  outroMs: 1400,
  /** Le papier du cahier (`--paper`, l'écran titre) : l'intro s'y fond. */
  paper: '#f3ead7',
  /** Images trop longues à charger : pas d'intro (le jeu ne doit jamais attendre). */
  loadTimeoutMs: 8000,
  /** Largeur maximale du canvas (px réels) : au-delà, le téléphone travaille pour rien. */
  maxRenderWidth: 1920,
  /** La respiration de Céleste : période (ms) et amplitude (fraction de sa hauteur). */
  breathMs: 2800,
  breathAmount: 0.006,
  /** L'étincelle sur la boîte qui attend (comme les choses à faire en jeu, D-31) : période (ms). */
  sparkleMs: 1600,
  /** Assombrissement des bords de l'image (0 : aucun). */
  vignette: 0.6,
} as const;

/** Une valeur qui évolue au fil du plan : clés (ms depuis le début du plan, valeur), linéaire. */
export type IntroKeys = readonly (readonly [number, number])[];

/** Cadrage : le point du plan au centre de l'écran, et le grossissement. */
export interface IntroCamera {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Passage vers un plan, au début de celui-ci (sa durée compte dans celle du plan) :
 * - `cut` : coupe franche ;
 * - `dissolve` : fondu enchaîné ;
 * - `dip` : le plan précédent s'efface vers une couleur, qui tient `holdMs`, puis le plan apparaît.
 */
export type IntroTransition =
  | { kind: 'cut' }
  | { kind: 'dissolve'; ms: number }
  | { kind: 'dip'; ms: number; holdMs: number; color: string };

/** Les décors. Deux plans consécutifs du même décor le partagent (son temps continue). */
export type IntroScene = 'music-box' | 'drawing' | 'room' | 'cradle' | 'strange';

export type IntroGlowColor = 'warm' | 'teal';

/** Un personnage ou un objet posé dans le plan. */
export interface IntroSprite {
  image: IntroImage;
  /** Centre horizontal et bas de l'image (px du plan), hauteur affichée. */
  x: number;
  bottom: number;
  height: number;
  /** Céleste respire. Maria jamais : elle ne bouge pas (pilier 5). */
  breathe?: boolean;
  /** Opacité au fil du plan ; absente : 1. */
  opacity?: IntroKeys;
  /** Ombre au sol, largeur (px). */
  shadow?: number;
}

export interface IntroShot {
  id: string;
  scene: IntroScene;
  durationMs: number;
  enter: IntroTransition;
  /** Musique demandée au début du plan (null : silence) ; absente : inchangée. */
  music?: MusicTrack | null;
  camera: { from: IntroCamera; to: IntroCamera; moveMs?: number; startMs?: number };
  sprites: readonly IntroSprite[];
  /** Halo lumineux (ajouté), son intensité au fil du plan. */
  glow?: { color: IntroGlowColor; x: number; y: number; radius: number; strength: IntroKeys };
  /** Poussières qui flottent (ou montent) dans la lumière. */
  motes?: {
    color: IntroGlowColor;
    count: number;
    area: readonly [number, number, number, number];
    rise: boolean;
  };
  /** Voile noir sur le décor (la boîte qui s'éclaire). */
  darkness?: IntroKeys;
  /** La bulle cœur, comme en jeu (D-31). */
  bubble?: { x: number; y: number; scale: number; opacity: IntroKeys };
}

const BLACK = '#0b0a10';

/** La place de Maria sur le tapis, la même dans les deux plans de la chambre (pilier 5). */
const MARIA_ON_RUG: IntroSprite = {
  image: 'maria',
  x: 1140,
  bottom: 950,
  height: 250,
  shadow: 230,
};
const ROOM_CAMERA: IntroCamera = { x: 1010, y: 540, zoom: 1.04 };
/** Céleste au bord du monde étrange : hors de l'image au plan 6, elle y est déjà. */
const CELESTE_STRANGE: readonly IntroSprite[] = [
  { image: 'celesteRim', x: 60, bottom: 1040, height: 720, breathe: true, opacity: [[0, 0.55]] },
  { image: 'celeste', x: 60, bottom: 1040, height: 720, breathe: true, shadow: 280 },
];
const LOST_CAMERA_END: IntroCamera = { x: 1150, y: 470, zoom: 1 };

export const INTRO_SHOTS: readonly IntroShot[] = [
  {
    id: 'music-box',
    scene: 'music-box',
    durationMs: 5000,
    enter: { kind: 'cut' },
    music: 'ending',
    camera: { from: { x: 960, y: 540, zoom: 1 }, to: { x: 960, y: 530, zoom: 1.06 } },
    sprites: [{ image: 'musicBox', x: 960, bottom: 820, height: 470, shadow: 380 }],
    glow: {
      color: 'warm',
      x: 960,
      y: 560,
      radius: 640,
      strength: [
        [0, 0.12],
        [2600, 0.6],
      ],
    },
    motes: { color: 'warm', count: 36, area: [560, 200, 1360, 820], rise: false },
    darkness: [
      [0, 0.72],
      [2600, 0],
    ],
  },
  {
    id: 'drawing',
    scene: 'drawing',
    durationMs: 5000,
    enter: { kind: 'dissolve', ms: 1500 },
    camera: { from: { x: 960, y: 540, zoom: 1 }, to: { x: 1150, y: 600, zoom: 1.6 } },
    sprites: [],
  },
  {
    // Le dessin s'efface dans le noir : Maria n'apparaît jamais sous nos yeux (pilier 5).
    id: 'evening',
    scene: 'room',
    durationMs: 8000,
    enter: { kind: 'dip', ms: 1400, holdMs: 200, color: BLACK },
    camera: { from: { x: 900, y: 540, zoom: 1 }, to: ROOM_CAMERA },
    sprites: [
      { image: 'celeste', x: 640, bottom: 952, height: 660, breathe: true, shadow: 260 },
      MARIA_ON_RUG,
    ],
    glow: { color: 'warm', x: 800, y: 820, radius: 700, strength: [[0, 0.33]] },
    motes: { color: 'warm', count: 18, area: [300, 100, 1700, 900], rise: false },
    bubble: {
      x: 860,
      y: 250,
      scale: 1.15,
      opacity: [
        [1800, 0],
        [2300, 1],
        [6200, 1],
        [6700, 0],
      ],
    },
  },
  {
    // Elle grandit (pyjama, puis robe) ; Maria reste à sa place, la même.
    id: 'growing',
    scene: 'room',
    durationMs: 5000,
    enter: { kind: 'cut' },
    camera: { from: ROOM_CAMERA, to: ROOM_CAMERA },
    sprites: [
      {
        image: 'celeste',
        x: 640,
        bottom: 952,
        height: 660,
        breathe: true,
        // La robe arrive par-dessus avant que le pyjama ne s'efface : le décor ne transparaît pas.
        opacity: [
          [1600, 1],
          [3200, 0],
        ],
        shadow: 260,
      },
      {
        image: 'celesteDress',
        x: 640,
        bottom: 952,
        height: 705,
        breathe: true,
        opacity: [
          [1200, 0],
          [2600, 1],
        ],
        shadow: 270,
      },
      MARIA_ON_RUG,
    ],
    glow: {
      color: 'warm',
      x: 800,
      y: 820,
      radius: 700,
      strength: [
        [0, 0.33],
        [5000, 0.24],
      ],
    },
  },
  {
    id: 'cradle',
    scene: 'cradle',
    durationMs: 5200,
    enter: { kind: 'dip', ms: 900, holdMs: 1000, color: BLACK },
    music: null,
    camera: { from: { x: 960, y: 540, zoom: 1 }, to: { x: 760, y: 470, zoom: 1.2 } },
    sprites: [],
    glow: {
      color: 'teal',
      x: 600,
      y: 420,
      radius: 560,
      strength: [
        [1800, 0],
        [4800, 0.9],
      ],
    },
    motes: { color: 'teal', count: 40, area: [300, 120, 900, 560], rise: true },
  },
  {
    // La lueur envahit l'image, puis la chambre basculée apparaît.
    id: 'lost',
    scene: 'strange',
    durationMs: 7000,
    enter: { kind: 'dip', ms: 1400, holdMs: 150, color: '#bff5ee' },
    music: 'strange',
    camera: { from: { x: 1150, y: 560, zoom: 1 }, to: LOST_CAMERA_END, startMs: 0, moveMs: 6000 },
    sprites: CELESTE_STRANGE,
    glow: { color: 'teal', x: 1140, y: 520, radius: 760, strength: [[0, 0.42]] },
    motes: { color: 'teal', count: 60, area: [-200, -100, 2200, 1150], rise: true },
  },
  {
    // La caméra glisse jusqu'à Céleste (même décor : pas de coupure visible).
    id: 'celeste',
    scene: 'strange',
    durationMs: 4800,
    enter: { kind: 'cut' },
    camera: { from: LOST_CAMERA_END, to: { x: 560, y: 600, zoom: 1.15 }, moveMs: 2000 },
    sprites: CELESTE_STRANGE,
    glow: {
      color: 'teal',
      x: 900,
      y: 520,
      radius: 820,
      strength: [
        [0, 0.42],
        [2000, 0.5],
      ],
    },
    motes: { color: 'teal', count: 60, area: [-200, -100, 2200, 1150], rise: true },
  },
];

/** Le dessin de famille, scotché dans le cahier (plan 2). */
export const INTRO_DRAWING = { x: 1000, y: 530, width: 1220, rotateDeg: -2.2 } as const;

/** Le décor de chaque scène : une image et sa place (px du plan) ; absent : fond uni ou dessiné. */
export const INTRO_BACKDROPS: Readonly<
  Partial<
    Record<IntroScene, { image: IntroImage; x: number; y: number; width: number; height: number }>
  >
> = {
  room: { image: 'evening', x: 0, y: 0, width: 1920, height: 1080 },
  cradle: { image: 'cradle', x: 0, y: 0, width: 1920, height: 1080 },
  // Plus large que l'écran : la caméra glisse jusqu'à Céleste.
  strange: { image: 'strange', x: -400, y: -150, width: 2720, height: 1530 },
};

/** Un objet perdu qui flotte (plan 6) : sa place, sa dérive (px) et sa période (ms). */
export interface IntroLostThing {
  image: IntroImage;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  periodMs: number;
  swayDeg: number;
}

/** Le monde des choses perdues : des ombres floues, qu'on devine sans les reconnaître. */
export const INTRO_LOST: readonly IntroLostThing[] = [
  { image: 'lostSlipper', x: 420, y: 330, driftX: 30, driftY: 18, periodMs: 9000, swayDeg: 7 },
  { image: 'lostSpoon', x: 780, y: 220, driftX: 24, driftY: 22, periodMs: 7600, swayDeg: 10 },
  { image: 'lostRattle', x: 1040, y: 380, driftX: 20, driftY: 26, periodMs: 8400, swayDeg: 8 },
  { image: 'lostBottle', x: 560, y: 640, driftX: 26, driftY: 16, periodMs: 10200, swayDeg: 6 },
  { image: 'lostBonnet', x: 1560, y: 260, driftX: 28, driftY: 20, periodMs: 9400, swayDeg: 6 },
  { image: 'lostBook', x: 1720, y: 540, driftX: 22, driftY: 18, periodMs: 11000, swayDeg: 5 },
];

/**
 * La ville-jouet en ombre (plan 6), bas de l'objet en (`x`, `bottom`), hauteur source 360 px ;
 * ses yeux (px de l'image source) s'allument au fil du décor (`eyesOpen`, ms depuis son début).
 */
export const INTRO_TOY_TOWN = {
  x: 1450,
  bottom: 1010,
  sourceHeight: 360,
  eyes: [
    [198, 170],
    [238, 170],
    [453, 140],
    [488, 140],
  ],
  eyeRadius: 7,
  eyesOpen: [
    [2500, 0],
    [3600, 1],
  ],
} as const;
