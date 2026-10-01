import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type {
  StoryData,
  StoryOmen,
  StoryProp,
  StoryStep,
  StoryTrigger,
} from '../../core/story/story';

/**
 * Histoire de la gare (D-66, D-68), PLACEHOLDER, réunie à celle de la maison (une seule zone) :
 * l'arrivée sur les voies (Céleste pense à Maria) ; tout en haut des casiers du bureau des objets
 * trouvés, le passage vers le monde étrange ; en haut de la tour, Roger et son court souvenir. Les
 * parents restent en retrait pendant tout le niveau.
 */

/** Le haut des casiers du bureau des objets trouvés : la porte entrouverte et sa lueur. */
const LOCKERS_TOP = { col: 38, row: 7, w: 5, h: 3 };
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
    // Fin du monde étrange de la gare (D-68) : tout en haut de la tour, Roger. Céleste le regarde,
    // on ne le prend pas : il devient un souvenir de la rubrique « Monde étrange », et le premier
    // court souvenir du jeu (Céleste toute petite le serre contre elle). Le cercle se referme ;
    // Céleste est assise sur un banc du hall. PLACEHOLDER : la suite (papa, la nuit, la croissance)
    // viendra avec la PR suivante.
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
      { do: 'room', room: 'station-hall', col: 11, row: 35, facing: 1, returnPoint: true },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: S.nightBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs },
      { do: 'wait', ms: 1200 },
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
];

const OMENS: StoryOmen[] = [
  // En grimpant vers le haut des casiers : la lumière vacille, les couleurs se refroidissent.
  { room: 'station-lost', when: { none: [F.StationDone] }, col: 40, row: 8, radius: 10 },
];

const PROPS: StoryProp[] = [
  // Roger reste dans le monde étrange (D-68) : on le regarde, on ne le prend pas.
  { id: 'roger', room: 'station-tower', kind: 'roger', col: 27, row: 6, when: {} },
];

/** Morceaux de l'histoire de la gare, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const STATION_STORY: Pick<StoryData, 'triggers' | 'omens' | 'props'> = {
  triggers: TRIGGERS,
  omens: OMENS,
  props: PROPS,
};
