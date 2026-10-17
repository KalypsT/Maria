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
  /** Le même jour, sans le chat sur le tabouret (D-191). */
  roomDayNoCat: 'art/film/room-day-nocat.webp',
  roomNight: 'art/film/room-night.webp',
  mariaClose: 'art/film/maria-close.webp',
  /**
   * Céleste qui rentre de l'école, son cartable (D-191) : illustration de l'utilisateur, détourée
   * (`scripts/art-cutout.py`), faite pour 9 ans (D-190) ; à cette taille, elle passe pour 7 ans.
   */
  celesteSchool: 'art/film/celeste-school.png',
  /**
   * Ses traces dans la chambre, les jours qui passent (D-191) : son cartable posé, son gilet, un
   * dessin, un livre ouvert, ses chaussons. PLACEHOLDERS, dessinés par
   * `scripts/make-intro-art.py film`.
   */
  schoolbag: 'art/film/schoolbag.png',
  cardigan: 'art/film/cardigan.png',
  drawing: 'art/film/drawing.png',
  openBook: 'art/film/open-book.png',
  slippers: 'art/film/slippers.png',
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

/**
 * L'heure et le temps d'un jour (D-191) : `gold` le matin, soleil bas et doré ; `noon` midi, clair ;
 * `rain` la pluie, gris, des gouttes sur la vitre, pas de soleil ; `dusk` le soir, orangé.
 */
export type FilmDay = 'gold' | 'noon' | 'rain' | 'dusk';

/**
 * Leur lumière, dessinée par le film par-dessus le décor : la teinte de toute la pièce (sa couleur,
 * sa force, sa façon de se poser), la couleur et la force du carré de soleil (null : pas de
 * soleil), la teinte du ciel dans la vitre, et le nombre de gouttes qui coulent sur la vitre.
 * PROVISOIRE.
 */
export const FILM_DAYS: Readonly<
  Record<
    FilmDay,
    {
      readonly tint: string;
      readonly tintAlpha: number;
      readonly tintMode: 'multiply' | 'soft-light';
      readonly sun: string | null;
      readonly sunAlpha: number;
      readonly sky: string;
      readonly skyAlpha: number;
      readonly rain: number;
    }
  >
> = {
  gold: {
    tint: '#ffc06e',
    tintAlpha: 0.32,
    tintMode: 'soft-light',
    sun: 'rgb(255, 200, 120)',
    sunAlpha: 0.2,
    sky: '#ffdca0',
    skyAlpha: 0.4,
    rain: 0,
  },
  noon: {
    tint: '#ffffff',
    tintAlpha: 0.18,
    tintMode: 'soft-light',
    sun: 'rgb(255, 246, 220)',
    sunAlpha: 0.13,
    sky: '#cfeaff',
    skyAlpha: 0.3,
    rain: 0,
  },
  rain: {
    tint: '#7a8698',
    tintAlpha: 0.5,
    tintMode: 'multiply',
    sun: null,
    sunAlpha: 0,
    sky: '#97a3b2',
    skyAlpha: 0.75,
    rain: 34,
  },
  dusk: {
    tint: '#ff9e6e',
    tintAlpha: 0.42,
    tintMode: 'multiply',
    sun: 'rgb(255, 150, 90)',
    sunAlpha: 0.16,
    sky: '#ff9e7c',
    skyAlpha: 0.6,
    rain: 0,
  },
};

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
  /** L'heure et le temps du jour (D-191) ; absent : la lumière du décor, telle quelle. */
  readonly day?: FilmDay;
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
   * autour d'un point, et un halo léger ; leur intensité au fil du plan. `flat` : la hauteur de
   * l'ovale où elles s'allument, par rapport à sa largeur (absente : 0,75).
   */
  readonly sparkles?: {
    readonly x: number;
    readonly y: number;
    readonly radius: number;
    readonly flat?: number;
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
/**
 * Les jours et les nuits (D-191, retour d'essai) : plus près, la moitié de la chambre où passe sa
 * vie (la fenêtre, l'étagère, le bureau, le tabouret, la porte) ; le sol reste dans l'image sur un
 * téléphone (plus large que 16:9, l'image est rognée en haut et en bas). PROVISOIRE.
 */
const DAYS: FilmShot['camera'] = {
  from: { x: 1181, y: 640, zoom: 1.3 },
  to: { x: 1181, y: 640, zoom: 1.3 },
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
/**
 * L'étagère de Maria et des jouets d'avant (D-191), dans les décors : son milieu, sa demi-largeur,
 * la hauteur de l'ovale qui l'entoure (par rapport à sa largeur).
 */
const SHELF = { x: 1345, y: 560, radius: 200, flat: 0.42 } as const;
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
/**
 * Les traces de sa vie, une ou deux par jour (D-191) ; jamais Maria ni les jouets. Son cartable,
 * posé sous le bureau, entre le caisson et le pied ; son gilet sur le tabouret (le chat n'y dort
 * pas ce jour-là) ; un dessin contre le fond du surmeuble ; un livre ouvert par terre ; ses
 * chaussons près de la porte (elle est à l'école). Places PROVISOIRES.
 */
const SCHOOLBAG: FilmSprite = { image: 'schoolbag', x: 1440, bottom: 972, height: 40 };
const CARDIGAN: FilmSprite = { image: 'cardigan', x: 1034, bottom: 884, height: 76 };
const DRAWING: FilmSprite = { image: 'drawing', x: 1405, bottom: 733, height: 62 };
const OPEN_BOOK: FilmSprite = { image: 'openBook', x: 700, bottom: 976, height: 24 };
const SLIPPERS: FilmSprite = { image: 'slippers', x: 1688, bottom: 975, height: 22 };

/**
 * Quelques semaines (D-191), quand la porte s'est refermée : la chambre, Maria sur son étagère.
 * D'abord des nuits, des noirs de plus en plus courts ; puis un jour, la porte s'ouvre : Céleste
 * rentre de l'école, son cartable ; elle s'efface, le cartable reste posé sous le bureau. Puis des
 * jours en fondus : le cartable là, pas là, là (l'école, sa vie à elle). Maria ne bouge pas. Puis
 * tout ralentit sur Maria, la même ; le dernier signe ; le noir. Céleste reste une enfant : la
 * fin ne la fait pas grandir au-delà du jeu.
 *
 * Retour d'essai : les jours se ressemblaient. Chacun a maintenant son heure et son temps (`day`) et
 * ses traces à elle ; le chat dort sur le tabouret, ou pas ; la vue est plus près.
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
    camera: DAYS,
    backdrop: 'roomNight',
    sprites: [],
  },
  {
    // La pluie ; son gilet sur le tabouret.
    id: 'day-2',
    scene: 'day-2',
    durationMs: 4200,
    enter: night(1400, 500),
    camera: DAYS,
    backdrop: 'roomDayNoCat',
    sprites: [CARDIGAN],
    day: 'rain',
  },
  {
    id: 'night-2',
    scene: 'night-2',
    durationMs: 2900,
    enter: night(1000, 300),
    camera: DAYS,
    backdrop: 'roomNight',
    sprites: [],
  },
  {
    // Le matin ; un dessin contre le fond du surmeuble ; le chat sur le tabouret.
    id: 'day-3',
    scene: 'day-3',
    durationMs: 3200,
    enter: night(800, 200),
    camera: DAYS,
    backdrop: 'roomDay',
    sprites: [DRAWING],
    sun: sunAcross(3200),
    day: 'gold',
  },
  {
    id: 'night-3',
    scene: 'night-3',
    durationMs: 1500,
    enter: night(600, 100),
    camera: DAYS,
    backdrop: 'roomNight',
    sprites: [],
  },
  {
    // En fin de journée, la porte s'ouvre : elle rentre de l'école, son cartable sur le dos ;
    // elle s'efface, le cartable reste, posé sous le bureau ; la porte se referme.
    id: 'school',
    scene: 'school',
    durationMs: 7600,
    enter: night(400, 80),
    camera: DAYS,
    backdrop: 'roomDay',
    sprites: [
      DRAWING,
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
    sun: [
      [0, 1060],
      [7600, 940],
    ],
    day: 'dusk',
    door: [
      [0, 0],
      [700, 1],
      [5200, 1],
      [6200, 0],
    ],
  },
  {
    // Midi : le cartable, un livre ouvert par terre ; le chat est parti.
    id: 'bag-1',
    scene: 'bag-1',
    durationMs: 2800,
    enter: dissolve(700),
    camera: DAYS,
    backdrop: 'roomDayNoCat',
    sprites: [SCHOOLBAG, OPEN_BOOK],
    sun: sunAcross(2800),
    day: 'noon',
  },
  {
    // La pluie : elle est à l'école ; ses chaussons près de la porte.
    id: 'bag-0',
    scene: 'bag-0',
    durationMs: 2600,
    enter: dissolve(600),
    camera: DAYS,
    backdrop: 'roomDay',
    sprites: [SLIPPERS],
    day: 'rain',
  },
  {
    // Un matin : le cartable, prêt ; son gilet, un dessin.
    id: 'bag-2',
    scene: 'bag-2',
    durationMs: 2800,
    enter: dissolve(600),
    camera: DAYS,
    backdrop: 'roomDayNoCat',
    sprites: [SCHOOLBAG, CARDIGAN, DRAWING],
    sun: sunAcross(2800),
    day: 'gold',
  },
  {
    // Maria, la même : la vue s'approche lentement, le soleil passe sur elle. Autour d'elle, sur
    // l'étagère floue du décor, les jouets d'avant (D-191) : la vue est sur elle, eux restent
    // flous, et le soleil passe sur eux aussi.
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
      radius: 760,
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
    // notes de la berceuse ; des étoiles turquoise s'allument autour de l'étagère, de Maria et des
    // jouets d'avant (D-191). Elle ne bouge pas. Puis tout redevient normal. Le jeu s'est ouvert
    // sur cette boîte (l'intro, plan 1).
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
    // Autour de toute l'étagère (D-191) : Maria et les jouets d'avant, ensemble.
    sparkles: {
      x: SHELF.x,
      y: SHELF.y,
      radius: SHELF.radius,
      flat: SHELF.flat,
      count: 14,
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
