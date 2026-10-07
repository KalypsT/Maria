import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryTrigger, TileArea } from '../../core/story/story';

/**
 * Histoire du dernier niveau (D-138, D-139), le monde de Maria, PLACEHOLDER, réunie à celle de la
 * maison (une seule zone). Quelques mois après la classe de mer, un soir : le premier soir rejoué
 * sans Maria, dans la chambre. Papa à la porte rappelle l'heure du lit, le tapis est vide, le
 * berceau défait depuis le premier matin ; Céleste le refait, maman vient dire bonne nuit. La nuit,
 * les lumières éteintes, le berceau vide s'éclaire : l'entrée du monde de Maria (la PR 2 et les
 * suivantes). Maria n'est jamais à l'écran ; les parents ne bougent jamais à l'écran.
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
        area: { col: FINALE_CRADLE.col - 1, row: FINALE_CRADLE.row - 2, w: 3, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'cradle', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // PLACEHOLDER : la nuit, le berceau vide s'éclaire ; l'entrée du monde de Maria (la chambre
    // immense) viendra avec la suite du niveau (D-138). En attendant : « ? ».
    id: 'finale-cradle-glow',
    room: 'bedroom',
    on: 'interact',
    area: CRADLE_AREA,
    mark: CRADLE_MARK,
    when: { all: [F.FinaleNight] },
    lock: true,
    repeat: true,
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
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
    when: { all: [F.FinaleCradle] },
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
      when: { all: [F.FinaleNight] },
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
    // La nuit : Céleste ne sort pas ; elle pense au berceau.
    { room: 'bedroom', when: { all: [F.FinaleNight] }, icon: 'cradle' },
  ],
  // Quelques mois après la classe de mer, c'est le soir (D-139), jusqu'au matin du niveau 8.
  times: [{ when: { all: [F.GrownFourth] }, time: 'evening' }],
  // La nuit : les lumières éteintes, seule la veilleuse reste (D-85).
  dim: [{ room: 'bedroom', when: { all: [F.FinaleNight] } }],
};
