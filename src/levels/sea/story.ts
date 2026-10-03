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
/** Le jour, après la première marée, jusqu'au soir de la fête (D-101). */
const DAYTIME = { all: [F.SeaFirstTide], none: [F.SeaEvening] };
const EVENING = { all: [F.SeaEvening] };
/** Arrivée sur la jetée, le soir, près de la lanterne de l'entrée. */
const JETTY_ARRIVAL = { col: 206, row: 15 };
/** Le carrousel, au bout de la jetée. */
const CAROUSEL = { col: 21, row: 15 };
/** La maîtresse sur le sable, pendant la pêche à pied. */
const TEACHER_BEACH = { col: 134, row: 23 };
/** Les bancs des marées (on s'y assoit, debout sur la tuile du dessus) : la promenade, le port. */
const PROMENADE_BENCH = { col: 61, row: 23 };
const PORT_BENCH = { col: 141, row: 16 };

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
  {
    // La maîtresse sur la promenade, le jour : Céleste demande ; la maîtresse montre le soleil (on a le
    // temps de jouer). Rejouable, jusqu'à ce que Céleste ait vu le carrousel du haut du phare.
    id: 'sea-teacher-promenade',
    room: 'sea-promenade',
    on: 'interact',
    area: { col: 65, row: 22, w: 7, h: 3 },
    mark: { col: 68, row: 20 },
    when: { all: [F.SeaFirstTide], none: [F.SeaSawCarousel] },
    lock: true,
    repeat: true,
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'sun', ms: S.thoughtMs, by: 'teacher-promenade' },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le soir de la fête (D-101) : Céleste a vu le carrousel du haut du phare. Agir près de la
    // maîtresse : elle montre la fête (le carrousel) ; dans le noir, le soir tombe sur la baie, la
    // classe est sur la jetée, les lumières de la fête s'allument.
    id: 'sea-evening',
    room: 'sea-promenade',
    on: 'interact',
    area: { col: 65, row: 22, w: 7, h: 3 },
    mark: { col: 68, row: 20 },
    when: { all: [F.SeaSawCarousel], none: [F.SeaEvening] },
    lock: true,
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'carousel', ms: S.thoughtMs, by: 'teacher-promenade' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.SeaEvening },
      { do: 'room', room: 'sea-jetty', ...JETTY_ARRIVAL, facing: -1, returnPoint: true },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'classmate-jetty' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'carousel', ms: S.thoughtMs },
    ],
  },
  {
    // Le carrousel, au bout de la jetée, le soir : la lueur sous les chevaux (PLACEHOLDER jusqu'au
    // monde étrange, PR 6) : « ? ».
    id: 'sea-carousel',
    room: 'sea-jetty',
    on: 'interact',
    area: { col: CAROUSEL.col - 4, row: CAROUSEL.row - 2, w: 9, h: 3 },
    mark: { col: CAROUSEL.col, row: CAROUSEL.row - 4 },
    when: EVENING,
    lock: false,
    repeat: true,
    steps: [{ do: 'thought', icon: 'question', ms: S.thoughtMs }],
  },
  // Les bancs des marées (D-95) : sur la promenade, face à la plage ; devant la capitainerie du port.
  tideBench('sea-bench-promenade', 'sea-promenade', PROMENADE_BENCH),
  tideBench('sea-bench-port', 'sea-port', PORT_BENCH),
  {
    // La galerie du phare (D-100) : tout au bout de la jetée, une lueur turquoise sous le carrousel
    // bâché ; Céleste regarde (« ? »). La fête du soir viendra (PR 5).
    id: 'sea-carousel-seen',
    room: 'sea-lighthouse',
    on: 'touch',
    area: { col: 28, row: 8, w: 5, h: 4 },
    when: { all: [F.SeaFirstTide], none: [F.SeaSawCarousel] },
    lock: true,
    steps: [
      { do: 'sparkle', area: { col: 30, row: 4, w: 3, h: 4 }, ms: S.cradleSparkleMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'flag', id: F.SeaSawCarousel },
      { do: 'wait', ms: S.thoughtMs },
    ],
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
    when: DAYTIME,
  },
  {
    id: 'kids-promenade',
    room: 'sea-promenade',
    kind: 'kids-quay',
    col: 52,
    row: 24,
    when: DAYTIME,
  },
  // Le soir (D-101) : la maîtresse et la classe à la fête, près de l'entrée de la jetée.
  {
    id: 'teacher-jetty',
    room: 'sea-jetty',
    kind: 'teacher',
    col: 197,
    row: 15,
    flip: true,
    when: EVENING,
  },
  { id: 'classmate-jetty', room: 'sea-jetty', kind: 'classmate', col: 182, row: 15, when: EVENING },
  { id: 'kids-jetty', room: 'sea-jetty', kind: 'kids-quay', col: 166, row: 15, when: EVENING },
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

/**
 * La sortie de la gare de la mer : on part ensemble, avec la classe (la maîtresse le rappelle). La
 * grille du port (D-100) : ouverte après la première marée (le temps libre).
 */
const LOCKED: StoryData['lockedRooms'] = [
  // L'arche de la jetée (D-101) : la fête s'installe le jour, on n'y entre que le soir.
  { room: 'sea-port', exit: 3, when: { none: [F.SeaEvening] }, icon: 'question' },
  { room: 'sea-promenade', exit: 4, when: { none: [F.SeaFirstTide] }, icon: 'question' },
  {
    room: 'sea-station',
    exit: 2,
    when: { none: [F.SeaArrived] },
    speaker: 'teacher-sea',
    icon: 'question',
  },
];

/** Morceaux de l'histoire de la station balnéaire, ajoutés à ceux de la maison (`HOUSE_STORY`). */
/** Le soir de la fête (D-101) : toute la baie passe au soir. */
const TIMES: StoryData['times'] = [{ when: EVENING, time: 'evening' }];

/** Le carrousel, le soir : la lumière vacille en approchant (la lueur sous les chevaux). */
const OMENS: StoryData['omens'] = [
  { room: 'sea-jetty', when: EVENING, col: CAROUSEL.col, row: CAROUSEL.row, radius: 14 },
];

export const SEA_STORY: Pick<StoryData, 'triggers' | 'props' | 'lockedRooms' | 'times' | 'omens'> =
  {
    triggers: TRIGGERS,
    props: PROPS,
    lockedRooms: LOCKED,
    times: TIMES,
    omens: OMENS,
  };
