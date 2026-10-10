import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryProp, StoryStep, StoryTrigger } from '../../core/story/story';
import { NANNY_ENTER } from '../nanny/story';

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
/** Au centre, de jour et le soir de la fête, avant le livre musical (ensuite, la nuit, D-105). */
const DAY_CENTRE = { all: [F.SeaArrived], none: [F.SeaStrangeDone] };
/** La nuit au dortoir et après (D-105). */
const NIGHT_ON = { all: [F.SeaStrangeDone] };
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
/** La lueur sous les chevaux du carrousel, qui scintille quand on y entre (D-102). */
const CAROUSEL_GLOW = { col: CAROUSEL.col - 3, row: CAROUSEL.row - 4, w: 7, h: 4 };
/** Arrivée dans la fête engloutie (dans le noir), sur le toit du carrousel englouti. */
const STRANGE_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'sea-strange-fair',
  col: 6,
  row: 18,
  facing: 1,
};
/** Le livre musical (D-104), sur le toit du carrousel étrange, au bout de la vague. */
const MUSIC_BOOK = { col: 181, row: 13 };
/** Assise sur sa couchette, au dortoir (fin provisoire du monde étrange, D-104). */
const BUNK_SEAT = { col: 45, row: 9 };
/** Le monde étrange, en cours (avant le livre musical). */
const IN_STRANGE = { all: [F.SeaStrange], none: [F.SeaStrangeDone] };
/** La nuit au dortoir (D-105), après le livre musical, jusqu'à la fin du niveau. */
const NIGHT = { all: [F.SeaStrangeDone], none: [F.SeaEnd] };
/** La porte du dortoir, entre deux couchettes : elle donne sur le couloir en boucle. */
const DORM_DOOR = { col: 60, row: 11 };
/** La porte qui n'était pas là, au dernier tour du couloir. */
const LAST_DOOR = { col: 45, row: 9 };

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
    // Le disque « Avant même ta naissance » (D-156), sur l'armoire du dortoir, au-dessus des
    // couchettes : Agir le ramasse ; il ira sur le tourne-disque du grenier.
    id: 'take-record-lullaby',
    room: 'sea-centre',
    on: 'interact',
    area: { col: 69, row: 1, w: 2, h: 2 },
    mark: { col: 70, row: 1 },
    when: { none: [F.RecordLullaby] },
    lock: true,
    steps: [
      { do: 'flag', id: F.RecordLullaby },
      { do: 'memory', id: 'record-lullaby' },
      { do: 'thought', icon: 'music', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
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
    // Le monde étrange de la station balnéaire (D-102), comme la cuisine du train (D-88) : le soir,
    // Agir devant le carrousel ; la lueur scintille sous les chevaux, l'image tremble ; un
    // clignement dans le noir, et la fête engloutie se révèle autour de Céleste.
    id: 'sea-strange-enter',
    room: 'sea-jetty',
    on: 'interact',
    area: { col: CAROUSEL.col - 4, row: CAROUSEL.row - 2, w: 9, h: 3 },
    mark: { col: CAROUSEL.col, row: CAROUSEL.row - 4 },
    when: { all: [F.SeaEvening], none: [F.SeaStrange] },
    lock: true,
    steps: [
      { do: 'sparkle', area: CAROUSEL_GLOW, ms: S.omenPeakMs + 400 },
      { do: 'shake', ms: S.omenPeakMs, strength: 1 },
      { do: 'wait', ms: S.omenPeakMs },
      { do: 'fadeOut', ms: S.blinkOutMs },
      { do: 'flag', id: F.SeaStrange },
      STRANGE_ARRIVAL,
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.blinkInMs, shape: 'iris' },
      { do: 'wait', ms: 500 },
      { do: 'thought', icon: 'question', ms: S.thoughtMs + 800 },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Après un évanouissement avant la première veilleuse : le carrousel y ramène, plus vite.
    id: 'sea-strange-reenter',
    room: 'sea-jetty',
    on: 'interact',
    area: { col: CAROUSEL.col - 4, row: CAROUSEL.row - 2, w: 9, h: 3 },
    mark: { col: CAROUSEL.col, row: CAROUSEL.row - 4 },
    when: IN_STRANGE,
    lock: true,
    steps: [
      { do: 'sparkle', area: CAROUSEL_GLOW, ms: S.reomenPeakMs + 300 },
      { do: 'shake', ms: S.reomenPeakMs, strength: 0.6 },
      { do: 'wait', ms: S.reomenPeakMs },
      { do: 'fadeOut', ms: S.blinkOutMs },
      STRANGE_ARRIVAL,
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.reblinkInMs, shape: 'iris' },
    ],
  },
  {
    // Fin du monde étrange de la station balnéaire (D-104) : au bout de la vague, sur le toit du
    // carrousel étrange, le livre musical de quand Céleste était toute petite. On le regarde, on ne
    // le prend pas : un souvenir de la rubrique « Monde étrange ». Le cercle se referme ; Céleste est
    // assise sur sa couchette, au dortoir ; elle pense à Maria (la fin d'un monde étrange, D-70),
    // puis à son lit. PLACEHOLDER : le court souvenir et la nuit viennent avec la PR 9.
    id: 'sea-music-book',
    room: 'sea-strange-wave',
    on: 'interact',
    area: { col: MUSIC_BOOK.col - 3, row: MUSIC_BOOK.row - 2, w: 7, h: 3 },
    mark: { col: MUSIC_BOOK.col, row: MUSIC_BOOK.row - 3 },
    when: IN_STRANGE,
    lock: true,
    steps: [
      { do: 'memory', id: 'music-book' },
      {
        do: 'sparkle',
        area: { col: MUSIC_BOOK.col - 2, row: MUSIC_BOOK.row - 2, w: 4, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      // Le court souvenir (D-105) : Céleste toute petite, seule, appuie sur un bouton du livre ;
      // des notes dessinées s'en échappent.
      { do: 'flashback', id: 'music-book', ms: S.flashbackMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
      { do: 'flag', id: F.SeaStrangeDone },
      { do: 'room', room: 'sea-centre', ...BUNK_SEAT, facing: 1, returnPoint: true },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 1200 },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs + 300 },
      { do: 'thought', icon: 'bed', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs + S.lookMs },
      // La nuit (D-105) : tout le monde dort ; la mélodie du livre, d'on ne sait où ; une lueur sous
      // la porte du dortoir.
      { do: 'thought', icon: 'music', ms: S.thoughtMs + 600 },
      {
        do: 'sparkle',
        area: { col: DORM_DOOR.col - 1, row: DORM_DOOR.row - 3, w: 3, h: 4 },
        ms: S.cradleSparkleMs,
      },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // La porte du dortoir, la nuit (D-105) : la mélodie vient de derrière ; Céleste l'ouvre. Dans le
    // noir, un couloir qui n'était pas là, celui du centre la nuit. Il revient sur lui-même.
    id: 'sea-corridor-enter',
    room: 'sea-centre',
    on: 'interact',
    area: { col: DORM_DOOR.col - 2, row: DORM_DOOR.row - 2, w: 5, h: 3 },
    mark: { col: DORM_DOOR.col, row: DORM_DOOR.row - 4 },
    when: NIGHT,
    lock: true,
    steps: [
      { do: 'thought', icon: 'music', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'fadeOut', ms: S.fadeMs },
      { do: 'room', room: 'sea-corridor', col: 6, row: 9, facing: 1 },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeIn', ms: S.fadeMs },
    ],
  },
  {
    // La fin de la station balnéaire (D-105) : au cinquième tour du couloir, une porte qui n'était
    // pas là, sa lueur. Céleste l'ouvre ; la lumière ; le noir, longtemps. Derrière, la même nuit,
    // l'entrée de la maison de la nounou (le niveau 7, D-110).
    id: 'sea-end-door',
    room: 'sea-corridor-sea',
    on: 'interact',
    area: { col: LAST_DOOR.col - 2, row: LAST_DOOR.row - 2, w: 5, h: 3 },
    mark: { col: LAST_DOOR.col, row: LAST_DOOR.row - 5 },
    when: NIGHT,
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: LAST_DOOR.col - 1, row: LAST_DOOR.row - 4, w: 3, h: 5 },
        ms: S.omenPeakMs + 1200,
      },
      { do: 'shake', ms: S.omenPeakMs, strength: 0.6 },
      { do: 'wait', ms: S.omenPeakMs + 600 },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.SeaEnd },
      { do: 'wait', ms: S.monthsBlackMs },
      ...NANNY_ENTER,
    ],
  },
  {
    // Une partie sauvegardée juste après la fin, avant le niveau 7 (l'ancien « ? ») : la porte,
    // ouverte sur la lueur, mène à la maison de la nounou.
    id: 'sea-end-later',
    room: 'sea-corridor-sea',
    on: 'interact',
    area: { col: LAST_DOOR.col - 2, row: LAST_DOOR.row - 2, w: 5, h: 3 },
    mark: { col: LAST_DOOR.col, row: LAST_DOOR.row - 5 },
    when: { all: [F.SeaEnd], none: [F.NannyArrived] },
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: LAST_DOOR.col - 1, row: LAST_DOOR.row - 4, w: 3, h: 5 },
        ms: 900,
      },
      { do: 'wait', ms: 600 },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'wait', ms: S.nightBlackMs },
      ...NANNY_ENTER,
    ],
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
  // Le disque « Avant même ta naissance » (D-156), sur l'armoire du dortoir.
  {
    id: 'record-lullaby',
    room: 'sea-centre',
    kind: 'record-lullaby',
    col: 70,
    row: 2,
    instant: true,
    when: { none: [F.RecordLullaby] },
  },
  // Le livre musical (D-104), sur le toit du carrousel étrange, tant qu'on ne l'a pas trouvé.
  {
    id: 'music-book',
    room: 'sea-strange-wave',
    kind: 'music-book',
    ...MUSIC_BOOK,
    when: IN_STRANGE,
  },
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
  {
    id: 'teacher-centre',
    room: 'sea-centre',
    kind: 'teacher',
    ...TEACHER_CENTRE,
    when: DAY_CENTRE,
  },
  {
    id: 'classmate-dorm',
    room: 'sea-centre',
    kind: 'classmate',
    col: 60,
    row: 11,
    flip: true,
    when: DAY_CENTRE,
  },
  {
    id: 'kid-cap-dorm',
    room: 'sea-centre',
    kind: 'kid-cap-sit',
    col: 55,
    row: 9,
    when: DAY_CENTRE,
  },
  {
    id: 'kid-bob-dorm',
    room: 'sea-centre',
    kind: 'kid-bob-sit',
    col: 65,
    row: 9,
    flip: true,
    when: DAY_CENTRE,
  },
  // La nuit (D-105) : la camarade et deux enfants dorment sur leurs couchettes.
  {
    id: 'classmate-night',
    room: 'sea-centre',
    kind: 'classmate-asleep',
    col: 55,
    row: 6,
    when: NIGHT_ON,
  },
  { id: 'kid-night-1', room: 'sea-centre', kind: 'kid-asleep', col: 55, row: 9, when: NIGHT_ON },
  { id: 'kid-night-2', room: 'sea-centre', kind: 'kid-asleep', col: 65, row: 9, when: NIGHT_ON },
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

/**
 * Le carrousel, le soir : la lumière vacille en approchant (la lueur sous les chevaux), jusqu'au
 * livre musical (D-104).
 */
const OMENS: StoryData['omens'] = [
  // La nuit (D-105), la lumière vacille près de la porte du dortoir, puis de la porte du couloir.
  { room: 'sea-centre', when: NIGHT, col: DORM_DOOR.col, row: DORM_DOOR.row, radius: 10 },
  { room: 'sea-corridor-sea', when: NIGHT, col: LAST_DOOR.col, row: LAST_DOOR.row, radius: 12 },
  {
    room: 'sea-jetty',
    when: { all: [F.SeaEvening], none: [F.SeaStrangeDone] },
    col: CAROUSEL.col,
    row: CAROUSEL.row,
    radius: 14,
  },
];

export const SEA_STORY: Pick<StoryData, 'triggers' | 'props' | 'lockedRooms' | 'times' | 'omens'> =
  {
    triggers: TRIGGERS,
    props: PROPS,
    lockedRooms: LOCKED,
    times: TIMES,
    omens: OMENS,
  };
