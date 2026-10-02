import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type {
  StoryData,
  StoryOmen,
  StoryProp,
  StoryStep,
  StoryTrigger,
} from '../../core/story/story';

/**
 * Histoire de la gare (D-66, D-68, D-69), PLACEHOLDER, réunie à celle de la maison (une seule
 * zone) : l'arrivée sur les voies (Céleste pense à Maria) ; tout en haut des casiers du bureau des
 * objets trouvés, le passage vers le monde étrange ; en haut de la tour, Roger et son court
 * souvenir. Les parents restent en retrait pendant tout le niveau ; à la fin, papa seul vient
 * chercher Céleste sous l'horloge du hall, la nuit. Puis des mois passent (phase 3) ; un train
 * attend à quai, sa porte ouverte (la suite, sans figer le niveau suivant).
 */

/** Le haut des casiers du bureau des objets trouvés : la porte entrouverte et sa lueur. */
const LOCKERS_TOP = { col: 38, row: 7, w: 5, h: 3 };
/** Sous la grande horloge du hall (D-69) : Céleste assise par terre, papa à sa gauche. */
const UNDER_CLOCK = { col: 36, row: 37 };
const DAD_HALL = { col: 32, row: 37 };
/** La porte ouverte du train à quai (D-69), sur le quai de droite des quais. */
const TRAIN_DOOR = { col: 55, row: 26 };
/** Arrivée dans le monde étrange de la gare (dans le noir). */
const STRANGE_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'station-strange',
  col: 3,
  row: 37,
  facing: 1,
};

const TRIGGERS: StoryTrigger[] = [
  {
    // En arrivant sur les voies : loin de la maison, Céleste pense à Maria.
    id: 'station-arrived',
    room: 'station-tracks',
    on: 'touch',
    area: { col: 1, row: 22, w: 8, h: 3 },
    when: { none: [F.StationArrived] },
    lock: true,
    steps: [
      { do: 'flag', id: F.StationArrived },
      { do: 'wait', ms: 600 },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs + 600 },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le monde étrange de la gare (D-68) : en haut des casiers, la porte entrouverte et sa lueur.
    // Agir : un clignement dans le noir, et le hall à l'envers se révèle autour de Céleste.
    id: 'station-enter',
    room: 'station-lost',
    on: 'interact',
    area: LOCKERS_TOP,
    mark: { col: 39, row: 6 },
    when: { none: [F.StationStrange] },
    lock: true,
    steps: [
      { do: 'sparkle', area: { col: 38, row: 6, w: 4, h: 4 }, ms: S.omenPeakMs + 400 },
      { do: 'shake', ms: S.omenPeakMs, strength: 1 },
      { do: 'wait', ms: S.omenPeakMs },
      { do: 'fadeOut', ms: S.blinkOutMs },
      { do: 'flag', id: F.StationStrange },
      STRANGE_ARRIVAL,
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.blinkInMs, shape: 'iris' },
      { do: 'wait', ms: 500 },
      { do: 'thought', icon: 'question', ms: S.thoughtMs + 800 },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Après un évanouissement (avant la première veilleuse) : les casiers y ramènent, plus vite.
    id: 'station-reenter',
    room: 'station-lost',
    on: 'interact',
    area: LOCKERS_TOP,
    mark: { col: 39, row: 6 },
    when: { all: [F.StationStrange], none: [F.StationDone] },
    lock: true,
    steps: [
      { do: 'sparkle', area: { col: 38, row: 6, w: 4, h: 4 }, ms: S.reomenPeakMs + 300 },
      { do: 'shake', ms: S.reomenPeakMs, strength: 0.6 },
      { do: 'wait', ms: S.reomenPeakMs },
      { do: 'fadeOut', ms: S.blinkOutMs },
      STRANGE_ARRIVAL,
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.reblinkInMs, shape: 'iris' },
    ],
  },
  {
    // Fin du monde étrange de la gare (D-68, D-69) : tout en haut de la tour, Roger. Céleste le
    // regarde, on ne le prend pas : il devient un souvenir de la rubrique « Monde étrange », et le
    // premier court souvenir du jeu (Céleste toute petite le serre contre elle). Le cercle se
    // referme ; Céleste est assise sous la grande horloge du hall, la nuit. Papa seul vient la
    // chercher (un cœur). La nuit, dans sa chambre, elle pense à son lit.
    id: 'station-roger',
    room: 'station-tower',
    on: 'interact',
    area: { col: 23, row: 4, w: 7, h: 3 },
    mark: { col: 27, row: 3 },
    when: { all: [F.StationStrange], none: [F.StationDone] },
    lock: true,
    steps: [
      { do: 'memory', id: 'roger' },
      { do: 'sparkle', area: { col: 25, row: 4, w: 4, h: 3 }, ms: S.cradleSparkleMs + 600 },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'flashback', id: 'roger', ms: S.flashbackMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
      { do: 'flag', id: F.StationDone },
      { do: 'room', room: 'station-hall', ...UNDER_CLOCK, facing: -1, returnPoint: true },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 1200 },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs + 300 },
      // Papa est venu la chercher, à hauteur d'enfant : un cœur, et Céleste lui répond.
      { do: 'thought', icon: 'heart', ms: S.holdMs, by: 'dad-hall' },
      { do: 'wait', ms: S.holdMs },
      { do: 'thought', icon: 'heart', ms: S.holdMs },
      { do: 'wait', ms: S.holdMs },
      // La nuit, dans sa chambre.
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'room', room: 'bedroom', col: 12, row: 15, facing: 1, returnPoint: true },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 900 },
      { do: 'thought', icon: 'bed', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Quelques mois plus tard (D-69, comme D-43) : se coucher après la gare. Le noir le plus long ;
    // au retour, Céleste a encore grandi (phase 3 : queue de cheval, veste en jean) et la toise a
    // un troisième trait. Au réveil, elle pense à un train, sa porte ouverte et sa lueur.
    id: 'station-months',
    room: 'bedroom',
    on: 'interact',
    area: { col: 7, row: 13, w: 11, h: 3 },
    mark: { col: 9, row: 14 },
    when: { all: [F.StationDone], none: [F.GrownOlder] },
    lock: true,
    steps: [
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.holdMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.GrownOlder },
      { do: 'place', col: 12, row: 15, facing: 1 },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.monthsBlackMs },
      { do: 'fadeIn', ms: S.monthsFadeInMs },
      { do: 'wait', ms: 1400 },
      { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 800 },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'train', ms: S.thoughtMs + 800 },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le train à quai (D-69) : en passant devant sa porte ouverte, la lueur scintille ; Céleste
    // s'arrête, une bulle « ? ». On n'y monte pas (encore) : la suite reste ouverte.
    id: 'station-train',
    room: 'station-platforms',
    on: 'touch',
    area: { col: TRAIN_DOOR.col - 3, row: TRAIN_DOOR.row - 2, w: 7, h: 3 },
    when: { all: [F.GrownOlder], none: [F.StationTrain] },
    lock: true,
    steps: [
      { do: 'flag', id: F.StationTrain },
      {
        do: 'sparkle',
        area: { col: TRAIN_DOOR.col - 1, row: TRAIN_DOOR.row - 3, w: 3, h: 4 },
        ms: S.cradleSparkleMs + 800,
      },
      { do: 'wait', ms: 600 },
      { do: 'thought', icon: 'question', ms: S.thoughtMs + 800 },
      { do: 'wait', ms: S.lookMs },
    ],
  },
];

const OMENS: StoryOmen[] = [
  // En grimpant vers le haut des casiers : la lumière vacille, les couleurs se refroidissent.
  { room: 'station-lost', when: { none: [F.StationDone] }, col: 40, row: 8, radius: 10 },
  // Devant la porte ouverte du train à quai (D-69) : la suite, jusqu'au départ (D-85).
  {
    room: 'station-platforms',
    when: { all: [F.GrownOlder], none: [F.TrainBoarding] },
    col: TRAIN_DOOR.col,
    row: TRAIN_DOOR.row,
    radius: 10,
  },
];

const PROPS: StoryProp[] = [
  // Roger reste dans le monde étrange (D-68) : on le regarde, on ne le prend pas.
  { id: 'roger', room: 'station-tower', kind: 'roger', col: 27, row: 6, when: {} },
  {
    // Papa vient chercher Céleste sous l'horloge du hall, la nuit (D-69).
    id: 'dad-hall',
    room: 'station-hall',
    kind: 'dad-hall',
    ...DAD_HALL,
    when: { all: [F.StationDone], none: [F.GrownOlder] },
  },
  {
    // Quelques mois plus tard (D-69) : le train arrêté à quai, sa porte ouverte ; il part avec la
    // classe (D-85).
    id: 'quay-train',
    room: 'station-platforms',
    kind: 'quay-train',
    ...TRAIN_DOOR,
    when: { all: [F.GrownOlder], none: [F.TrainDeparted] },
  },
];

/** La nuit après la gare (D-69), jusqu'au matin, quelques mois plus tard. */
const TIMES: StoryData['times'] = [
  { when: { all: [F.StationDone], none: [F.GrownOlder] }, time: 'evening' },
];

const LOCKED_ROOMS: StoryData['lockedRooms'] = [
  // La nuit après la gare (D-69) : c'est l'heure de dormir.
  { room: 'bedroom', when: { all: [F.StationDone], none: [F.GrownOlder] }, icon: 'bed' },
];

/** Morceaux de l'histoire de la gare, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const STATION_STORY: Pick<
  StoryData,
  'triggers' | 'omens' | 'props' | 'times' | 'lockedRooms'
> = {
  triggers: TRIGGERS,
  omens: OMENS,
  props: PROPS,
  times: TIMES,
  lockedRooms: LOCKED_ROOMS,
};
