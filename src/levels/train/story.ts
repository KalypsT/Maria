import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type {
  StoryData,
  StoryOmen,
  StoryProp,
  StoryStep,
  StoryTrigger,
} from '../../core/story/story';

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

/** La porte de la cuisine du wagon-restaurant : la lueur passe dessous (le monde étrange, D-88). */
const KITCHEN_DOOR = { col: 57, row: 16, w: 6, h: 3 };
/** La lueur sous la porte de la cuisine, qui scintille quand on y entre. */
const KITCHEN_GLOW = { col: 58, row: 15, w: 4, h: 4 };
/** Assise sur sa couchette, la nuit (comme au coucher, D-85). */
const BUNK_SEAT = { col: 13, row: 12 };
/** La cuisine rose (D-88), au bout du train de la vaisselle, après la ligne d'arrivée du chariot. */
const PINK_KITCHEN = { col: 120, row: 11 };
/** Arrivée dans la cuisine étrange (dans le noir). */
const STRANGE_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'train-strange-kitchen',
  col: 3,
  row: 23,
  facing: 1,
};

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
    // Le contrôleur (D-86), bienveillant : il voit passer Céleste, la nuit, et la laisse aller.
    id: 'train-conductor',
    room: 'train-compartments',
    on: 'touch',
    area: { col: 33, row: 16, w: 6, h: 3 },
    when: { all: [F.TrainNight], none: [F.TrainConductor] },
    lock: true,
    steps: [
      { do: 'flag', id: F.TrainConductor },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'conductor' },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Une maman berce son bébé, qui serre son poupon (D-86) : on la regarde, autant qu'on veut.
    id: 'train-mother',
    room: 'train-compartments',
    on: 'interact',
    area: { col: 9, row: 16, w: 5, h: 3 },
    mark: { col: 11, row: 15 },
    when: { all: [F.TrainNight] },
    lock: true,
    repeat: true,
    steps: [
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le chien du fourgon, qui dort dans sa caisse.
    id: 'train-dog',
    room: 'train-baggage',
    on: 'interact',
    area: { col: 37, row: 16, w: 7, h: 3 },
    mark: { col: 40, row: 14 },
    when: { all: [F.TrainNight] },
    lock: true,
    repeat: true,
    steps: [
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // La porte du wagon-restaurant vers le fourgon se pousse de l'intérieur (D-86) : une boucle.
    id: 'train-restaurant-door',
    room: 'train-restaurant',
    on: 'interact',
    area: { col: 1, row: 16, w: 4, h: 3 },
    mark: { col: 2, row: 15 },
    when: { none: [F.TrainRestaurantOpen] },
    lock: true,
    steps: [
      { do: 'flag', id: F.TrainRestaurantOpen },
      { do: 'sparkle', area: { col: 0, row: 14, w: 2, h: 5 }, ms: S.lookMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le monde étrange du train (D-88), comme les casiers de la gare (D-68) : la nuit, Agir à la
    // porte de la cuisine ; la lueur scintille dessous, l'image tremble ; un clignement dans le noir,
    // et la cuisine devenue immense se révèle autour de Céleste.
    id: 'train-strange-enter',
    room: 'train-restaurant',
    on: 'interact',
    area: KITCHEN_DOOR,
    mark: { col: 59, row: 15 },
    when: { all: [F.TrainNight], none: [F.TrainStrange] },
    lock: true,
    steps: [
      { do: 'sparkle', area: KITCHEN_GLOW, ms: S.omenPeakMs + 400 },
      { do: 'shake', ms: S.omenPeakMs, strength: 1 },
      { do: 'wait', ms: S.omenPeakMs },
      { do: 'fadeOut', ms: S.blinkOutMs },
      { do: 'flag', id: F.TrainStrange },
      STRANGE_ARRIVAL,
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.blinkInMs, shape: 'iris' },
      { do: 'wait', ms: 500 },
      { do: 'thought', icon: 'question', ms: S.thoughtMs + 800 },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Après un évanouissement (avant la première veilleuse) : la porte y ramène, plus vite.
    id: 'train-strange-reenter',
    room: 'train-restaurant',
    on: 'interact',
    area: KITCHEN_DOOR,
    mark: { col: 59, row: 15 },
    when: { all: [F.TrainStrange], none: [F.TrainStrangeDone] },
    lock: true,
    steps: [
      { do: 'sparkle', area: KITCHEN_GLOW, ms: S.reomenPeakMs + 300 },
      { do: 'shake', ms: S.reomenPeakMs, strength: 0.6 },
      { do: 'wait', ms: S.reomenPeakMs },
      { do: 'fadeOut', ms: S.blinkOutMs },
      STRANGE_ARRIVAL,
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.reblinkInMs, shape: 'iris' },
    ],
  },
  {
    // Fin du monde étrange du train (D-88) : au bout du train de la vaisselle, la cuisine rose, la
    // dînette d'enfance de Céleste. On la regarde, on ne la prend pas : un souvenir de la rubrique
    // « Monde étrange ». (Le souvenir jouable vient avec la PR 5b.) Le cercle se referme ; Céleste
    // est assise sur sa couchette, la nuit ; elle pense à Maria, puis à son lit. PLACEHOLDER : le
    // matin vient avec la PR 6.
    id: 'train-pink-kitchen',
    room: 'train-strange-dishes',
    on: 'interact',
    area: { col: PINK_KITCHEN.col - 3, row: PINK_KITCHEN.row - 2, w: 6, h: 3 },
    mark: { col: PINK_KITCHEN.col, row: PINK_KITCHEN.row - 3 },
    when: { all: [F.TrainStrange], none: [F.TrainStrangeDone] },
    lock: true,
    steps: [
      { do: 'memory', id: 'pink-kitchen' },
      {
        do: 'sparkle',
        area: { col: PINK_KITCHEN.col - 2, row: PINK_KITCHEN.row - 2, w: 4, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs + S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
      { do: 'flag', id: F.TrainStrangeDone },
      { do: 'room', room: 'train-couchettes', ...BUNK_SEAT, facing: 1, returnPoint: true },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 1200 },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs + 300 },
      { do: 'thought', icon: 'bed', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
];

/**
 * La nuit, la lueur guide Céleste d'une voiture à l'autre : la lumière vacille en approchant. Elle
 * s'arrête une fois la cuisine rose trouvée (D-88).
 */
const NIGHT_OMEN = { all: [F.TrainNight], none: [F.TrainStrangeDone] };
const OMENS: StoryOmen[] = [
  // Le passage vers les compartiments, au bout de la voiture-couchettes.
  { room: 'train-couchettes', when: NIGHT_OMEN, col: 83, row: 17, radius: 12 },
  // La grille vers le fourgon.
  { room: 'train-compartments', when: NIGHT_OMEN, col: 86, row: 17, radius: 12 },
  // L'échelle du toit.
  { room: 'train-baggage', when: NIGHT_OMEN, col: 63, row: 16, radius: 10 },
  // La trappe du wagon-restaurant.
  { room: 'train-roof', when: NIGHT_OMEN, col: 104, row: 13, radius: 12 },
  // La porte de la cuisine.
  { room: 'train-restaurant', when: NIGHT_OMEN, col: 59, row: 17, radius: 12 },
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
  // Le reste du train, la nuit (D-86).
  {
    id: 'mother-baby',
    room: 'train-compartments',
    kind: 'mother-baby',
    col: 10,
    row: 16,
    when: NIGHT,
  },
  {
    id: 'conductor',
    room: 'train-compartments',
    kind: 'conductor',
    col: 41,
    row: 18,
    flip: true,
    when: NIGHT,
  },
  {
    id: 'sleeper-b',
    room: 'train-compartments',
    kind: 'sleeper-seat',
    col: 50,
    row: 16,
    flip: true,
    when: NIGHT,
  },
  {
    id: 'sleeper-c',
    room: 'train-compartments',
    kind: 'sleeper-seat',
    col: 55,
    row: 16,
    when: NIGHT,
  },
  { id: 'dog', room: 'train-baggage', kind: 'dog-sleep', col: 40, row: 18, when: NIGHT },
  // La cuisine rose reste dans le monde étrange (D-88) : on la regarde, on ne la prend pas.
  {
    id: 'pink-kitchen',
    room: 'train-strange-dishes',
    kind: 'pink-kitchen',
    ...PINK_KITCHEN,
    when: {},
  },
];

/** Le soir du départ et la nuit dans le train (jusqu'à l'arrivée, PR 6). */
const TIMES: StoryData['times'] = [{ when: { all: [F.TrainBoarding] }, time: 'evening' }];

/** Le train roule une fois parti (l'arrivée vient avec la PR 6). */
const TRAIN_ROOMS = [
  'train-couchettes',
  'train-compartments',
  'train-baggage',
  'train-roof',
  'train-restaurant',
];
const MOVING: NonNullable<StoryData['moving']> = TRAIN_ROOMS.map((room) => ({
  room,
  when: { all: [F.TrainDeparted] },
}));

/** La nuit, les lumières de la voiture-couchettes s'éteignent : seules les veilleuses restent. */
const DIM: NonNullable<StoryData['dim']> = TRAIN_ROOMS.filter((room) => room !== 'train-roof').map(
  (room) => ({ room, when: { all: [F.TrainNight] } }),
);

/**
 * Portes fermées : le passage vers les compartiments avant la nuit (c'est l'heure du coucher) ;
 * la porte entre le fourgon et le wagon-restaurant tant qu'elle n'a pas été poussée de
 * l'intérieur (D-86).
 */
const LOCKED: StoryData['lockedRooms'] = [
  { room: 'train-couchettes', exit: 1, when: { none: [F.TrainNight] }, icon: 'bed' },
  { room: 'train-baggage', exit: 2, when: { none: [F.TrainRestaurantOpen] }, icon: 'question' },
  { room: 'train-restaurant', exit: 1, when: { none: [F.TrainRestaurantOpen] }, icon: 'question' },
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
  lockedRooms: LOCKED,
  moving: MOVING,
  dim: DIM,
};
