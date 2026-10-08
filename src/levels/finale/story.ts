import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryStep, StoryTrigger, TileArea } from '../../core/story/story';

/**
 * Histoire du dernier niveau (D-138, D-139), le monde de Maria, PLACEHOLDER, réunie à celle de la
 * maison (une seule zone). Quelques mois après la classe de mer, un soir : le premier soir rejoué
 * sans Maria, dans la chambre. Papa à la porte rappelle l'heure du lit, le tapis est vide, le
 * berceau défait depuis le premier matin ; Céleste le refait, maman vient dire bonne nuit. La nuit,
 * les lumières éteintes, le berceau vide s'éclaire : l'entrée du monde de Maria, la chambre immense
 * (D-141), son ciel (D-142), la chambre grande ; par sa porte, la vraie chambre, la nuit : Maria dort
 * dans son berceau, Céleste la prend dans ses bras (D-143). Le matin, le tapis, l'étagère, la porte
 * et le dernier plan (D-144). Maria ne bouge jamais à l'écran ; les parents non plus.
 */

/** Le tapis, là où Maria était assise le premier soir (D-31) : Céleste s'y assoit, seule. */
const RUG_AREA: TileArea = { col: 18, row: 17, w: 4, h: 3 };
/** Assise sur le tapis, à sa place du premier soir, tournée vers la place vide de Maria. */
const RUG_SEAT = { col: 21, row: 19 };
/** Le berceau, sur le coffre à jouets (D-31) ; on l'atteint du sol ou du dessus du coffre. */
export const FINALE_CRADLE = { col: 23, row: 17 };
const CRADLE_AREA: TileArea = { col: 20, row: 15, w: 7, h: 5 };
const CRADLE_MARK = { col: FINALE_CRADLE.col, row: FINALE_CRADLE.row - 1 };
/** Debout sur le coffre, à côté du berceau (comme quand elle y avait couché Maria). */
const CRADLE_SIDE = { col: 25, row: 17 };
/** Là où le berceau scintille, la nuit. */
const CRADLE_GLOW: TileArea = {
  col: FINALE_CRADLE.col - 1,
  row: FINALE_CRADLE.row - 2,
  w: 3,
  h: 3,
};
/** Dans le berceau devenu immense (la chambre immense, D-141) : on y arrive, dans le noir. */
export const IMMENSE_START = { col: 88, row: 31 };
const IMMENSE_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'finale-bed',
  ...IMMENSE_START,
  facing: -1,
  returnPoint: true,
};
/** Le ciel de la chambre (D-142) : on y arrive sur le dessus de l'armoire, dans le noir. */
export const SKY_START = { col: 5, row: 26 };
/** Le dessus de l'armoire de la chambre immense : les étoiles y continuent, vers le ciel. */
const WARDROBE_TOP: TileArea = { col: 2, row: 1, w: 14, h: 3 };
const WARDROBE_STARS: TileArea = { col: 4, row: 0, w: 10, h: 3 };
const SKY_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'finale-sky',
  ...SKY_START,
  facing: 1,
  returnPoint: true,
};
/** La petite porte du grenier, en haut du mur de droite du ciel de la chambre. */
const ATTIC_DOOR: TileArea = { col: 155, row: 15, w: 4, h: 5 };
/** La chambre grande (D-143) : on y arrive par sa petite porte du grenier, sur l'étagère haute. */
export const BIG_START = { col: 86, row: 15 };
const BIG_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'finale-big',
  ...BIG_START,
  facing: -1,
  returnPoint: true,
};
/** La porte de la chambre grande, en bas du mur de droite : derrière, la vraie chambre. */
const BIG_DOOR: TileArea = { col: 84, row: 34, w: 6, h: 6 };
/** La vraie chambre, la nuit (D-143) : Céleste entre par sa porte. */
export const HOME_START = { col: 43, row: 19 };
const HOME_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'bedroom',
  ...HOME_START,
  facing: -1,
  returnPoint: true,
};
/** Maria, à côté de Céleste sur son lit, après le cercle (D-143). */
const MARIA_BED = { col: 10, row: 15 };
/** Le matin (D-144) : Maria sur le tapis, à sa place du premier soir (D-31), en face de Céleste. */
const MARIA_RUG = { col: 19, row: 19 };
/**
 * Là où Céleste la range : l'étagère du surmeuble, là où était la couverture le premier soir (D-31) ;
 * Céleste debout à côté d'elle.
 */
export const MARIA_SHELF = { col: 33, row: 11 };
const SHELF_STAND = { col: 35, row: 11 };
const SHELF_GLOW: TileArea = { col: 31, row: 9, w: 5, h: 3 };
/**
 * Devant la porte de la chambre, sur toute la hauteur : en sortant, le dernier plan (D-144). On ne
 * peut pas atteindre la porte sans y passer.
 */
const LEAVE_AREA: TileArea = { col: 41, row: 9, w: 4, h: 11 };
/** Le couloir, juste derrière la porte de la chambre : Céleste s'en va. */
const HALL_ARRIVAL: StoryStep = { do: 'room', room: 'hall', col: 3, row: 15, facing: 1 };
/** Le lit : Agir pour se coucher (le premier soir, D-37). */
const BED_AREA: TileArea = { col: 7, row: 13, w: 11, h: 3 };
const BED_SEAT = { col: 12, row: 15 };

const TRIGGERS: StoryTrigger[] = [
  {
    // Le tapis vide : là où, le premier soir, Céleste jouait avec Maria (D-31). Elle s'y assoit à
    // sa place, regarde la place vide et pense à Maria ; puis au berceau.
    id: 'finale-rug',
    room: 'bedroom',
    on: 'interact',
    area: RUG_AREA,
    mark: { col: 19, row: 18 },
    when: { all: [F.GrownFourth], none: [F.FinaleRug] },
    lock: true,
    steps: [
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleRug },
      { do: 'place', ...RUG_SEAT, facing: -1 },
      { do: 'pose', pose: 'sit' },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'maria', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs + S.lookMs },
      { do: 'pose', pose: 'stand' },
      { do: 'thought', icon: 'cradle', ms: S.thoughtMs },
    ],
  },
  {
    // Le berceau, défait depuis le premier matin (D-31) : Céleste le refait, la couverture bien
    // bordée, pour personne. Elle le regarde, pense à Maria ; puis l'heure du lit.
    id: 'finale-cradle',
    room: 'bedroom',
    on: 'interact',
    area: CRADLE_AREA,
    mark: CRADLE_MARK,
    when: { all: [F.FinaleRug], none: [F.FinaleCradle] },
    lock: true,
    steps: [
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleCradle },
      { do: 'place', ...CRADLE_SIDE, facing: -1 },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'maria', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs + 200 },
      { do: 'thought', icon: 'bed', ms: S.thoughtMs },
    ],
  },
  {
    // Au lit, comme le premier soir (D-37) : maman vient dire bonne nuit. Puis la nuit : les
    // lumières s'éteignent, seule la veilleuse reste ; Céleste ne dort pas. Le berceau vide
    // s'éclaire.
    id: 'finale-sleep',
    room: 'bedroom',
    on: 'interact',
    area: BED_AREA,
    mark: { col: 9, row: 14 },
    when: { all: [F.FinaleCradle], none: [F.FinaleGoodnight] },
    lock: true,
    steps: [
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.holdMs },
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleGoodnight },
      { do: 'place', ...BED_SEAT, facing: 1 },
      { do: 'pose', pose: 'sit' },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: 500 },
      { do: 'thought', icon: 'heart', ms: S.holdMs, by: 'mom-bed-finale' },
      { do: 'wait', ms: S.holdMs + 200 },
      { do: 'thought', icon: 'heart', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.FinaleNight },
      { do: 'place', ...BED_SEAT, facing: 1 },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 1200 },
      {
        do: 'sparkle',
        area: CRADLE_GLOW,
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'cradle', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le berceau vide, la nuit (D-141) : la lumière vacille, tout tremble ; le cercle se referme sur
    // Céleste, et s'ouvre : elle est dans le berceau, devenu immense, dans la chambre du premier
    // soir. Le monde de Maria.
    id: 'finale-enter',
    room: 'bedroom',
    on: 'interact',
    area: CRADLE_AREA,
    mark: CRADLE_MARK,
    when: { all: [F.FinaleNight], none: [F.FinaleEntered] },
    lock: true,
    steps: [
      { do: 'sparkle', area: CRADLE_GLOW, ms: S.omenPeakMs + 600 },
      { do: 'shake', ms: S.omenPeakMs, strength: 0.8 },
      { do: 'wait', ms: S.omenPeakMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
      { do: 'flag', id: F.FinaleEntered },
      IMMENSE_ARRIVAL,
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs, shape: 'iris' },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
    ],
  },
  {
    // Une partie reprise dans la chambre après l'entrée (rien ne l'y ramène d'habitude : la chambre
    // immense a ses veilleuses) : le berceau y ramène.
    id: 'finale-reenter',
    room: 'bedroom',
    on: 'interact',
    area: CRADLE_AREA,
    mark: CRADLE_MARK,
    when: { all: [F.FinaleEntered], none: [F.FinaleHome] },
    lock: true,
    steps: [
      { do: 'sparkle', area: CRADLE_GLOW, ms: S.reomenPeakMs + 300 },
      { do: 'wait', ms: S.reomenPeakMs },
      { do: 'fadeOut', ms: S.blinkOutMs, shape: 'iris' },
      IMMENSE_ARRIVAL,
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.reblinkInMs, shape: 'iris' },
    ],
  },
  {
    // La boîte à musique, sur la traverse de la cabane (D-141) : en arrivant près d'elle, elle se met
    // à jouer, seule ; les étoiles de la veilleuse s'éclairent au mur. La berceuse.
    id: 'finale-music-box',
    room: 'finale-bed',
    on: 'touch',
    area: { col: 34, row: 10, w: 14, h: 3 },
    when: { all: [F.FinaleEntered], none: [F.FinaleMusicBox] },
    lock: true,
    steps: [
      { do: 'flag', id: F.FinaleMusicBox },
      { do: 'sparkle', area: { col: 49, row: 8, w: 6, h: 5 }, ms: S.cradleSparkleMs },
      { do: 'wait', ms: 600 },
      { do: 'thought', icon: 'music', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'sparkle', area: { col: 25, row: 5, w: 10, h: 6 }, ms: S.cradleSparkleMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le dessus de l'armoire (D-142) : les étoiles continuent au-dessus, Céleste les suit ; le
    // noir, et le ciel de la chambre.
    id: 'finale-sky',
    room: 'finale-bed',
    on: 'touch',
    area: WARDROBE_TOP,
    when: { all: [F.FinaleEntered], none: [F.FinaleSky] },
    lock: true,
    steps: [
      { do: 'sparkle', area: WARDROBE_STARS, ms: S.cradleSparkleMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleSky },
      SKY_ARRIVAL,
      { do: 'fadeIn', ms: S.fadeMs },
    ],
  },
  {
    // Une partie reprise en bas après le ciel : le dessus de l'armoire y ramène.
    id: 'finale-sky-again',
    room: 'finale-bed',
    on: 'touch',
    area: WARDROBE_TOP,
    when: { all: [F.FinaleSky] },
    lock: true,
    steps: [{ do: 'fadeOut', ms: S.fadeMs }, SKY_ARRIVAL, { do: 'fadeIn', ms: S.fadeMs }],
  },
  {
    // La petite porte du grenier, au bout du ciel de la chambre (D-143) : elle s'ouvre ; derrière,
    // la chambre grande.
    id: 'finale-big',
    room: 'finale-sky',
    on: 'interact',
    area: ATTIC_DOOR,
    mark: { col: 157, row: 14 },
    when: { all: [F.FinaleSky], none: [F.FinaleBig] },
    lock: true,
    steps: [
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleBig },
      BIG_ARRIVAL,
      { do: 'fadeIn', ms: S.fadeMs },
    ],
  },
  {
    // Une partie reprise dans le ciel après la chambre grande : la petite porte y ramène.
    id: 'finale-big-again',
    room: 'finale-sky',
    on: 'interact',
    area: ATTIC_DOOR,
    mark: { col: 157, row: 14 },
    when: { all: [F.FinaleBig] },
    lock: true,
    steps: [{ do: 'fadeOut', ms: S.fadeMs }, BIG_ARRIVAL, { do: 'fadeIn', ms: S.fadeMs }],
  },
  {
    // La porte de la chambre grande (D-143) : derrière, la vraie chambre, la nuit. Maria dort dans
    // son berceau, sous sa couverture, comme Céleste l'avait couchée le premier soir.
    id: 'finale-home',
    room: 'finale-big',
    on: 'interact',
    area: BIG_DOOR,
    mark: { col: 88, row: 32 },
    when: { all: [F.FinaleBig], none: [F.FinaleHome] },
    lock: true,
    steps: [
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.FinaleHome },
      HOME_ARRIVAL,
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Une partie reprise dans la chambre grande après la vraie chambre : la porte y ramène.
    id: 'finale-home-again',
    room: 'finale-big',
    on: 'interact',
    area: BIG_DOOR,
    mark: { col: 88, row: 32 },
    when: { all: [F.FinaleHome] },
    lock: true,
    steps: [{ do: 'fadeOut', ms: S.fadeMs }, HOME_ARRIVAL, { do: 'fadeIn', ms: S.fadeMs }],
  },
  {
    // Maria retrouvée (D-143, §11). Dans le noir, Céleste la prend dans ses bras ; le cœur du
    // prologue. Le cercle se referme : Céleste sur son lit, Maria assise à côté d'elle. Maria ne
    // bouge jamais à l'écran (pilier 5) : elle change de place dans le noir.
    id: 'finale-found',
    room: 'bedroom',
    on: 'interact',
    area: CRADLE_AREA,
    mark: CRADLE_MARK,
    when: { all: [F.FinaleHome], none: [F.FinaleFound] },
    lock: true,
    steps: [
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleFound },
      { do: 'place', ...CRADLE_SIDE, facing: -1 },
      { do: 'pose', pose: 'hold' },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'heart', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs + S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
      { do: 'flag', id: F.FinaleTogether },
      { do: 'place', ...BED_SEAT, facing: -1 },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs, shape: 'iris' },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le matin (D-144) : Céleste s'endort, Maria à côté d'elle ; elle se réveille, Maria dans les
    // bras, le cœur. Elle la pose à côté d'elle (dans le noir) ; une étincelle sur le tapis, là où
    // était la toute première action du jeu.
    id: 'finale-morning',
    room: 'bedroom',
    on: 'interact',
    area: BED_AREA,
    mark: { col: 9, row: 14 },
    when: { all: [F.FinaleTogether], none: [F.FinaleMorning] },
    lock: true,
    steps: [
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.holdMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.FinaleMorning },
      { do: 'place', ...BED_SEAT, facing: 1 },
      { do: 'pose', pose: 'hold-sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'heart', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs + S.lookMs },
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleAwake },
      { do: 'pose', pose: 'sit' },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'sparkle', area: RUG_AREA, ms: S.cradleSparkleMs },
    ],
  },
  {
    // Sur le tapis, comme le premier soir (D-31) : Céleste s'assoit en face de Maria, un câlin,
    // l'histoire du soir commence… et s'efface. Elle la regarde : elle a grandi (§11). Puis elle
    // pense à l'étagère où la ranger.
    id: 'finale-play',
    room: 'bedroom',
    on: 'interact',
    area: RUG_AREA,
    mark: { col: 19, row: 18 },
    when: { all: [F.FinaleAwake], none: [F.FinalePlayed] },
    lock: true,
    steps: [
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinalePlayed },
      { do: 'place', ...RUG_SEAT, facing: -1 },
      { do: 'pose', pose: 'sit' },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'thought', icon: 'heart', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs + 200 },
      { do: 'thought', icon: 'book', ms: S.fadingBookMs },
      { do: 'wait', ms: S.fadingBookMs + S.holdMs + S.lookMs },
      { do: 'pose', pose: 'stand' },
      { do: 'thought', icon: 'maria-shelf', ms: S.thoughtMs },
    ],
  },
  {
    // Ranger Maria (§11) : dans le noir, Céleste la porte sur l'étagère du surmeuble, là où était la
    // couverture le premier soir, et la pose avec soin. Le dernier câlin.
    id: 'finale-shelf',
    room: 'bedroom',
    on: 'interact',
    area: RUG_AREA,
    mark: { col: 19, row: 18 },
    when: { all: [F.FinalePlayed], none: [F.FinaleShelved] },
    lock: true,
    steps: [
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleShelved },
      { do: 'place', ...SHELF_STAND, facing: -1 },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'heart', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs + S.lookMs },
    ],
  },
  {
    // C'est le joueur qui fait sortir Céleste (D-138). Le dernier plan (§12) : la vue reste sur
    // Maria ; un très léger signe du monde étrange ; Maria ne bouge pas ; tout redevient normal ; le
    // noir. Céleste ne revient pas la chercher.
    id: 'finale-leave',
    room: 'bedroom',
    on: 'touch',
    area: LEAVE_AREA,
    when: { all: [F.FinaleShelved], none: [F.FinaleGone] },
    lock: true,
    steps: [
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.FinaleGone },
      { do: 'gone' },
      { do: 'look', ...MARIA_SHELF },
      {
        do: 'hush',
        ms:
          S.nightFadeInMs +
          S.lastShotMs +
          S.glimmerMs +
          S.lookMs +
          S.nightFadeOutMs +
          S.nightBlackMs,
      },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: S.lastShotMs },
      { do: 'glimmer', ms: S.glimmerMs },
      { do: 'sparkle', area: SHELF_GLOW, ms: S.glimmerMs },
      { do: 'wait', ms: S.glimmerMs + S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'look' },
      { do: 'wait', ms: S.nightBlackMs },
      HALL_ARRIVAL,
      { do: 'fadeIn', ms: S.nightFadeInMs },
    ],
  },
];

const PROPS: StoryData['props'] = [
  // Papa à la porte, le soir (D-37) : l'heure du lit. Il est parti quand maman dit bonne nuit.
  {
    id: 'dad-door-finale',
    room: 'bedroom',
    kind: 'dad-door',
    col: 43,
    row: 19,
    flip: true,
    when: { all: [F.GrownFourth], none: [F.FinaleGoodnight] },
  },
  // Maman au bord du lit, pour la bonne nuit (D-37).
  {
    id: 'mom-bed-finale',
    room: 'bedroom',
    kind: 'mom-bed',
    col: 16,
    row: 15,
    flip: true,
    when: { all: [F.FinaleGoodnight], none: [F.FinaleNight] },
  },
  // Le chat gris dort sur le tabouret, comme le premier soir (D-37).
  {
    id: 'cat-sleep-finale',
    room: 'bedroom',
    kind: 'cat-sleep',
    col: 27,
    row: 16,
    when: { all: [F.GrownFourth] },
  },
  // Le berceau refait, vide, la couverture bordée (le berceau défait disparaît dans le même noir).
  {
    id: 'cradle-finale',
    room: 'bedroom',
    kind: 'cradle',
    ...FINALE_CRADLE,
    when: { all: [F.FinaleCradle], none: [F.FinaleHome] },
  },
  // De retour par la porte, la nuit (D-143) : Maria dort dans son berceau, sous sa couverture.
  {
    id: 'cradle-maria-finale',
    room: 'bedroom',
    kind: 'cradle-maria',
    ...FINALE_CRADLE,
    when: { all: [F.FinaleHome], none: [F.FinaleFound] },
  },
  // Maria dans les bras de Céleste, puis à côté d'elle : le berceau est vide.
  {
    id: 'cradle-empty-finale',
    room: 'bedroom',
    kind: 'cradle',
    ...FINALE_CRADLE,
    when: { all: [F.FinaleFound] },
  },
  // Le cercle refermé : Maria assise sur le lit, à côté de Céleste, la nuit.
  {
    id: 'maria-bed-finale',
    room: 'bedroom',
    kind: 'maria-sit',
    ...MARIA_BED,
    when: { all: [F.FinaleTogether], none: [F.FinaleMorning] },
  },
  // Le matin (D-144) : réveillée, Maria dans les bras, puis à côté d'elle sur le lit…
  {
    id: 'maria-bed-morning',
    room: 'bedroom',
    kind: 'maria-sit',
    ...MARIA_BED,
    when: { all: [F.FinaleAwake], none: [F.FinalePlayed] },
  },
  // … sur le tapis, à sa place du premier soir…
  {
    id: 'maria-rug-morning',
    room: 'bedroom',
    kind: 'maria-sit',
    ...MARIA_RUG,
    when: { all: [F.FinalePlayed], none: [F.FinaleShelved] },
  },
  // … rangée sur l'étagère du surmeuble. Elle y reste (Céleste ne revient pas la chercher).
  {
    id: 'maria-shelf-finale',
    room: 'bedroom',
    kind: 'maria-sit',
    ...MARIA_SHELF,
    when: { all: [F.FinaleShelved] },
  },
];

/** Morceaux de l'histoire du dernier niveau, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const FINALE_STORY: Pick<
  StoryData,
  'triggers' | 'props' | 'omens' | 'lockedRooms' | 'times'
> & {
  readonly dim: NonNullable<StoryData['dim']>;
} = {
  triggers: TRIGGERS,
  props: PROPS,
  omens: [
    // La nuit, en approchant du berceau vide, la lumière vacille (D-35, D-40).
    {
      room: 'bedroom',
      when: { all: [F.FinaleNight], none: [F.FinaleHome] },
      col: FINALE_CRADLE.col,
      row: FINALE_CRADLE.row - 1,
      radius: 10,
    },
  ],
  lockedRooms: [
    // Le soir : c'est l'heure du lit, papa le rappelle à la porte (D-31, D-37).
    {
      room: 'bedroom',
      when: { all: [F.GrownFourth], none: [F.FinaleNight] },
      speaker: 'dad-door-finale',
    },
    // Le matin (D-144) : pas avant d'avoir joué avec Maria, puis de l'avoir rangée. Ensuite, la
    // porte : le dernier plan.
    { room: 'bedroom', when: { all: [F.FinaleMorning], none: [F.FinalePlayed] }, icon: 'maria' },
    {
      room: 'bedroom',
      when: { all: [F.FinalePlayed], none: [F.FinaleShelved] },
      icon: 'maria-shelf',
    },
    // Maria retrouvée, à côté d'elle (D-143) : Céleste pense à dormir.
    {
      room: 'bedroom',
      when: { all: [F.FinaleTogether], none: [F.FinaleMorning] },
      icon: 'bed',
    },
    // La nuit : Céleste ne sort pas ; elle pense au berceau.
    { room: 'bedroom', when: { all: [F.FinaleNight], none: [F.FinaleMorning] }, icon: 'cradle' },
  ],
  // Quelques mois après la classe de mer, c'est le soir (D-139), jusqu'au matin du niveau 8 (D-144).
  times: [
    { when: { all: [F.FinaleMorning] }, time: 'morning' },
    { when: { all: [F.GrownFourth] }, time: 'evening' },
  ],
  // La nuit : les lumières éteintes, seule la veilleuse reste (D-85).
  dim: [{ room: 'bedroom', when: { all: [F.FinaleNight], none: [F.FinaleMorning] } }],
};
