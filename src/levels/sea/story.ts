import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryProp, StoryTrigger } from '../../core/story/story';

/**
 * Histoire de la station balnéaire (D-95, D-98), PLACEHOLDER, réunie à celle de la maison (une
 * seule zone). Le matin de l'arrivée : la maîtresse et la classe attendent sur le quai de la gare
 * de la mer ; on part ensemble au centre de la classe de mer (le dortoir, les sacs posés). Puis
 * Céleste est libre sur la promenade. La plage, le port et le reste de la baie viennent avec les PR
 * suivantes. Les personnages ne bougent jamais à l'écran : ils changent de place dans le noir.
 */

/** La classe sur le quai de la gare de la mer (D-90), avec la maîtresse. */
const QUAY_CLASS = { col: 5, row: 15, w: 11, h: 3 };
/** Arrivée au dortoir, près de la veilleuse et de sa couchette. */
const DORM_ARRIVAL = { col: 51, row: 11 };
/** La maîtresse au réfectoire, près du passe-plat. */
const TEACHER_CENTRE = { col: 57, row: 23 };

const ON_QUAY = { all: [F.TrainArrived], none: [F.SeaArrived] };
const SETTLED = { all: [F.SeaArrived] };

const TRIGGERS: StoryTrigger[] = [
  {
    // L'arrivée de la classe (D-98) : Agir près de la maîtresse. Céleste demande (« ? ») ; la
    // maîtresse sourit (le soleil). Dans le noir, la classe part au centre : le dortoir, les sacs
    // posés au pied des couchettes, la camarade et les enfants. Céleste pense à Maria (le début d'un
    // niveau, D-70).
    id: 'sea-arrival',
    room: 'sea-station',
    on: 'interact',
    area: QUAY_CLASS,
    mark: { col: 8, row: 12 },
    when: ON_QUAY,
    lock: true,
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'sun', ms: S.thoughtMs, by: 'teacher-sea' },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.SeaArrived },
      { do: 'room', room: 'sea-centre', ...DORM_ARRIVAL, facing: -1, returnPoint: true },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'classmate-dorm' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
    ],
  },
  {
    // Au réfectoire, la maîtresse montre dehors (le soleil) : la journée commence (la plage avec la
    // PR 3). Rejouable.
    id: 'sea-teacher-centre',
    room: 'sea-centre',
    on: 'interact',
    area: { col: TEACHER_CENTRE.col - 3, row: TEACHER_CENTRE.row - 2, w: 6, h: 3 },
    mark: { col: TEACHER_CENTRE.col, row: TEACHER_CENTRE.row - 4 },
    when: SETTLED,
    lock: true,
    repeat: true,
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'sun', ms: S.thoughtMs, by: 'teacher-centre' },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // L'escalier de la plage, fermé par une chaîne (PLACEHOLDER jusqu'à la PR 3) : « ? ».
    id: 'sea-beach-chain',
    room: 'sea-promenade',
    on: 'interact',
    area: { col: 38, row: 22, w: 7, h: 3 },
    mark: { col: 41, row: 21 },
    when: {},
    lock: false,
    repeat: true,
    steps: [{ do: 'thought', icon: 'question', ms: S.thoughtMs }],
  },
  {
    // La grille du port, fermée (PLACEHOLDER jusqu'à la PR 4) : « ? ».
    id: 'sea-port-gate',
    room: 'sea-promenade',
    on: 'interact',
    area: { col: 1, row: 22, w: 5, h: 3 },
    mark: { col: 3, row: 20 },
    when: {},
    lock: false,
    repeat: true,
    steps: [{ do: 'thought', icon: 'question', ms: S.thoughtMs }],
  },
];

const PROPS: StoryProp[] = [
  // Au centre (D-98), une fois arrivés : la maîtresse au réfectoire ; la camarade et deux enfants au
  // dortoir, assis sur les couchettes.
  { id: 'teacher-centre', room: 'sea-centre', kind: 'teacher', ...TEACHER_CENTRE, when: SETTLED },
  {
    id: 'classmate-dorm',
    room: 'sea-centre',
    kind: 'classmate',
    col: 60,
    row: 11,
    flip: true,
    when: SETTLED,
  },
  { id: 'kid-cap-dorm', room: 'sea-centre', kind: 'kid-cap-sit', col: 55, row: 9, when: SETTLED },
  {
    id: 'kid-bob-dorm',
    room: 'sea-centre',
    kind: 'kid-bob-sit',
    col: 65,
    row: 9,
    flip: true,
    when: SETTLED,
  },
];

/** La sortie de la gare de la mer : on part ensemble, avec la classe (la maîtresse le rappelle). */
const LOCKED: StoryData['lockedRooms'] = [
  {
    room: 'sea-station',
    exit: 2,
    when: { none: [F.SeaArrived] },
    speaker: 'teacher-sea',
    icon: 'question',
  },
];

/** Morceaux de l'histoire de la station balnéaire, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const SEA_STORY: Pick<StoryData, 'triggers' | 'props' | 'lockedRooms'> = {
  triggers: TRIGGERS,
  props: PROPS,
  lockedRooms: LOCKED,
};
