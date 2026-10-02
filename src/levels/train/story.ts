import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryOmen, StoryProp, StoryTrigger } from '../../core/story/story';

/**
 * Histoire du train (D-83, D-85), PLACEHOLDER, réunie à celle de la maison (une seule zone). Le soir
 * du départ de la classe de mer : sur le quai, la maîtresse, les enfants et leurs sacs ; les
 * parents disent au revoir et restent sur le quai. Dans la voiture-couchettes, en route : la
 * camarade glisse sous la grille, Céleste l'imite (la glissade). Puis la nuit : tout le monde
 * dort, une lueur passe dans le couloir ; Céleste la suit jusqu'au bout de la voiture (la suite
 * avec la PR 3). Les personnages ne bougent jamais à l'écran : ils changent de place dans le noir.
 */

/** La porte ouverte du train à quai (D-69), sur le quai de droite des quais. */
const TRAIN_DOOR = { col: 55, row: 26 };
/** La couchette de Céleste : celle du milieu, à gauche du compartiment de la classe. */
const BUNK = { col: 11, row: 11, w: 5, h: 3 };
/** La grille en accordéon entre les deux compartiments : on glisse dessous (D-84). */
const GATE_SIDE = { col: 32, row: 16, w: 6, h: 3 };
/** La porte du bout de la voiture (la voiture suivante, PR 3). */
const END_DOOR = { col: 78, row: 16, w: 6, h: 3 };

const TRIGGERS: StoryTrigger[] = [
  {
    // Le soir du départ (D-85) : Agir à la porte ouverte du train à quai. Dans le noir, le soir
    // tombe sur les quais : la classe est là. Maman et papa disent au revoir ; la maîtresse fait
    // monter les enfants. Le train part ; Céleste pense à Maria (le début d'un niveau, D-70).
    id: 'train-board',
    room: 'station-platforms',
    on: 'interact',
    area: { col: TRAIN_DOOR.col - 2, row: TRAIN_DOOR.row - 2, w: 5, h: 3 },
    mark: { col: TRAIN_DOOR.col, row: TRAIN_DOOR.row - 3 },
    when: { all: [F.GrownOlder], none: [F.TrainBoarding] },
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: TRAIN_DOOR.col - 1, row: TRAIN_DOOR.row - 3, w: 3, h: 4 },
        ms: S.cradleSparkleMs,
      },
      { do: 'wait', ms: 900 },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.TrainBoarding },
      { do: 'place', col: TRAIN_DOOR.col - 2, row: TRAIN_DOOR.row, facing: 1 },
      { do: 'wait', ms: 1200 },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 800 },
      // Les parents restent sur le quai : un cœur, et Céleste leur répond.
      { do: 'thought', icon: 'heart', ms: S.holdMs, by: 'mom-quay' },
      { do: 'wait', ms: S.holdMs },
      { do: 'thought', icon: 'heart', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs },
      // La maîtresse : on monte dans le train.
      { do: 'thought', icon: 'train', ms: S.thoughtMs, by: 'teacher-quay' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      {
        do: 'room',
        room: 'train-couchettes',
        col: 6,
        row: 18,
        facing: 1,
        returnPoint: true,
      },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 1400 },
      // Le train s'ébranle : le paysage se met à défiler derrière les vitres.
      { do: 'flag', id: F.TrainDeparted },
      { do: 'wait', ms: 1600 },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs + 600 },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // La camarade (D-83, D-85) : près de la grille, elle invite Céleste à jouer ; dans le noir
    // d'un clignement, elle est passée de l'autre côté (on ne la voit jamais bouger). Elle montre
    // comment : Céleste apprend la glissade. La maîtresse rappelle l'heure du coucher.
    id: 'train-classmate',
    room: 'train-couchettes',
    on: 'touch',
    area: GATE_SIDE,
    when: { all: [F.TrainDeparted], none: [F.TrainSlide] },
    lock: true,
    steps: [
      { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'classmate-play' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'flag', id: F.TrainSlide },
      { do: 'wait', ms: 400 },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: 600 },
      { do: 'thought', icon: 'slide', ms: S.thoughtMs + 800, by: 'classmate-slid' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'ability', id: 'slide' },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'bed', ms: S.thoughtMs, by: 'teacher-train' },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // L'heure du coucher (D-85) : Agir sur sa couchette. La nuit tombe ; tout le monde dort. Céleste
    // ne dort pas : une lueur turquoise passe dans le couloir, vers le bout de la voiture.
    id: 'train-bedtime',
    room: 'train-couchettes',
    on: 'interact',
    area: BUNK,
    mark: { col: 13, row: 11 },
    when: { all: [F.TrainSlide], none: [F.TrainNight] },
    lock: true,
    steps: [
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.holdMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.TrainNight },
      { do: 'place', col: 13, row: 12, facing: 1 },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 1600 },
      // La lueur passe dans le couloir, de la fenêtre à la grille, et s'en va plus loin.
      { do: 'sparkle', area: { col: 17, row: 15, w: 4, h: 4 }, ms: 1100 },
      { do: 'wait', ms: 700 },
      { do: 'sparkle', area: { col: 25, row: 15, w: 4, h: 4 }, ms: 1100 },
      { do: 'wait', ms: 700 },
      { do: 'sparkle', area: { col: 33, row: 15, w: 4, h: 4 }, ms: 1100 },
      { do: 'wait', ms: 700 },
      { do: 'sparkle', area: { col: 40, row: 15, w: 4, h: 4 }, ms: 1100 },
      { do: 'wait', ms: 900 },
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // La porte du bout de la voiture (PLACEHOLDER) : la lueur est passée par là ; la voiture
    // suivante vient avec la PR 3.
    id: 'train-door',
    room: 'train-couchettes',
    on: 'interact',
    area: END_DOOR,
    mark: { col: 82, row: 15 },
    when: { all: [F.TrainNight] },
    lock: true,
    repeat: true,
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
];

const OMENS: StoryOmen[] = [
  // La nuit, en approchant de la porte du bout de la voiture : la lumière vacille.
  { room: 'train-couchettes', when: { all: [F.TrainNight] }, col: 82, row: 17, radius: 12 },
];

/** Sur le quai, le soir du départ seulement. */
const ON_QUAY = { all: [F.TrainBoarding], none: [F.TrainDeparted] };
/** Dans la voiture-couchettes, avant la nuit. */
const EVENING = { all: [F.TrainDeparted], none: [F.TrainNight] };
const NIGHT = { all: [F.TrainNight] };

const PROPS: StoryProp[] = [
  // Le quai, le soir du départ : la maîtresse, les enfants, maman et papa.
  {
    id: 'teacher-quay',
    room: 'station-platforms',
    kind: 'teacher',
    col: 59,
    row: 26,
    flip: true,
    when: ON_QUAY,
  },
  {
    id: 'kids-quay',
    room: 'station-platforms',
    kind: 'kids-quay',
    col: 63,
    row: 26,
    when: ON_QUAY,
  },
  {
    id: 'mom-quay',
    room: 'station-platforms',
    kind: 'mom-quay',
    col: 68,
    row: 26,
    flip: true,
    when: ON_QUAY,
  },
  {
    id: 'dad-quay',
    room: 'station-platforms',
    kind: 'dad-quay',
    col: 72,
    row: 26,
    flip: true,
    when: ON_QUAY,
  },
  // La voiture-couchettes, le soir : la maîtresse, deux enfants sur les couchettes, la camarade
  // près de la grille, puis de l'autre côté.
  {
    id: 'teacher-train',
    room: 'train-couchettes',
    kind: 'teacher',
    col: 29,
    row: 18,
    flip: true,
    when: EVENING,
  },
  { id: 'kid-cap', room: 'train-couchettes', kind: 'kid-cap-sit', col: 13, row: 15, when: EVENING },
  {
    id: 'kid-bob',
    room: 'train-couchettes',
    kind: 'kid-bob-sit',
    col: 35,
    row: 12,
    flip: true,
    when: EVENING,
  },
  {
    id: 'classmate-play',
    room: 'train-couchettes',
    kind: 'classmate',
    col: 35,
    row: 18,
    flip: true,
    when: { all: [F.TrainDeparted], none: [F.TrainSlide] },
  },
  {
    id: 'classmate-slid',
    room: 'train-couchettes',
    kind: 'classmate-slid',
    col: 42,
    row: 18,
    flip: true,
    when: { all: [F.TrainSlide], none: [F.TrainNight] },
  },
  // La nuit : tout le monde dort.
  {
    id: 'kid-cap-asleep',
    room: 'train-couchettes',
    kind: 'kid-asleep',
    col: 13,
    row: 15,
    when: NIGHT,
  },
  {
    id: 'kid-bob-asleep',
    room: 'train-couchettes',
    kind: 'kid-asleep',
    col: 35,
    row: 12,
    flip: true,
    when: NIGHT,
  },
  {
    id: 'classmate-asleep',
    room: 'train-couchettes',
    kind: 'classmate-asleep',
    col: 35,
    row: 15,
    flip: true,
    when: NIGHT,
  },
];

/** Le soir du départ et la nuit dans le train (jusqu'à l'arrivée, PR 6). */
const TIMES: StoryData['times'] = [{ when: { all: [F.TrainBoarding] }, time: 'evening' }];

/** Le train roule une fois parti (l'arrivée vient avec la PR 6). */
const MOVING: NonNullable<StoryData['moving']> = [
  { room: 'train-couchettes', when: { all: [F.TrainDeparted] } },
];

/** La nuit, les lumières de la voiture-couchettes s'éteignent : seules les veilleuses restent. */
const DIM: NonNullable<StoryData['dim']> = [
  { room: 'train-couchettes', when: { all: [F.TrainNight] } },
];

/** Morceaux de l'histoire du train, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const TRAIN_STORY: Pick<
  StoryData,
  'triggers' | 'omens' | 'props' | 'times' | 'lockedRooms'
> & {
  readonly moving: NonNullable<StoryData['moving']>;
  readonly dim: NonNullable<StoryData['dim']>;
} = {
  triggers: TRIGGERS,
  omens: OMENS,
  props: PROPS,
  times: TIMES,
  lockedRooms: [],
  moving: MOVING,
  dim: DIM,
};
