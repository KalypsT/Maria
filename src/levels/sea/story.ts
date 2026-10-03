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
/** La pêche à pied (D-99) : la classe sur la plage, à marée basse, jusqu'à la première marée. */
const FISHING = { all: [F.SeaArrived], none: [F.SeaFirstTide] };
const AFTER_TIDE = { all: [F.SeaFirstTide] };
/** La maîtresse sur le sable, pendant la pêche à pied. */
const TEACHER_BEACH = { col: 134, row: 23 };
/** Le banc des marées de la promenade : on s'y assoit (debout sur la tuile du dessus). */
const PROMENADE_BENCH = { col: 61, row: 23 };

/**
 * Le banc des marées (D-95, D-99) : Agir, Céleste s'assoit et regarde la mer ; le noir ; la marée a
 * tourné. Rejouable ; au sec aux deux marées (testé).
 */
function tideBench(id: string, room: string, seat: { col: number; row: number }): StoryTrigger {
  return {
    id,
    room,
    on: 'interact',
    area: { col: seat.col - 3, row: seat.row - 1, w: 7, h: 3 },
    mark: { col: seat.col, row: seat.row - 2 },
    when: AFTER_TIDE,
    lock: true,
    repeat: true,
    steps: [
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'place', ...seat, facing: -1 },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeIn', ms: S.fadeMs },
      { do: 'wait', ms: S.holdMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'toggle', id: F.TideHigh },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'thought', icon: 'tide', ms: S.thoughtMs },
    ],
  };
}

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
    // La pêche à pied (D-99) : la classe sur le sable, à marée basse. Agir près de la maîtresse :
    // elle montre la mer qui monte ; dans le noir, la marée monte, la classe remonte sur la
    // promenade, près du banc ; Céleste regarde la mer.
    id: 'sea-tide-rises',
    room: 'sea-beach',
    on: 'interact',
    area: { col: TEACHER_BEACH.col - 3, row: TEACHER_BEACH.row - 2, w: 7, h: 3 },
    mark: { col: TEACHER_BEACH.col, row: TEACHER_BEACH.row - 4 },
    when: FISHING,
    lock: true,
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'tide', ms: S.thoughtMs, by: 'teacher-beach' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.SeaFirstTide },
      { do: 'toggle', id: F.TideHigh },
      { do: 'room', room: 'sea-promenade', ...PROMENADE_BENCH, facing: -1, returnPoint: true },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'tide', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'teacher-promenade' },
    ],
  },
  // Le banc des marées de la promenade (D-95) ; celui du port viendra avec le port (PR 4).
  tideBench('sea-bench-promenade', 'sea-promenade', PROMENADE_BENCH),
  {
    // La porte du phare, au bout des rochers (PLACEHOLDER jusqu'à la PR 4) : « ? ».
    id: 'sea-lighthouse-door',
    room: 'sea-rocks',
    on: 'interact',
    area: { col: 4, row: 17, w: 6, h: 3 },
    mark: { col: 6, row: 15 },
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
  // La pêche à pied (D-99) : la maîtresse, la camarade et des enfants sur le sable.
  { id: 'teacher-beach', room: 'sea-beach', kind: 'teacher', ...TEACHER_BEACH, when: FISHING },
  {
    id: 'classmate-beach',
    room: 'sea-beach',
    kind: 'classmate',
    col: 126,
    row: 23,
    flip: true,
    when: FISHING,
  },
  { id: 'kids-beach', room: 'sea-beach', kind: 'kids-quay', col: 140, row: 23, when: FISHING },
  // Après la première marée : la classe sur la promenade, près du banc, regarde la mer.
  {
    id: 'teacher-promenade',
    room: 'sea-promenade',
    kind: 'teacher',
    col: 68,
    row: 24,
    flip: true,
    when: AFTER_TIDE,
  },
  {
    id: 'kids-promenade',
    room: 'sea-promenade',
    kind: 'kids-quay',
    col: 52,
    row: 24,
    when: AFTER_TIDE,
  },
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
