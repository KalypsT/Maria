import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryOmen, StoryTrigger } from '../../core/story/story';

/**
 * Histoire de la gare (D-66), PLACEHOLDER, réunie à celle de la maison (une seule zone) : la porte
 * de la palissade, l'arrivée sur les voies (Céleste pense à Maria), et tout en haut des casiers du
 * bureau des objets trouvés, la lueur turquoise du monde étrange (pour la PR suivante : une bulle
 * « ? » en attendant). Les parents restent en retrait pendant tout le niveau.
 */

/** Le haut des casiers du bureau des objets trouvés : la porte entrouverte et sa lueur. */
const LOCKERS_TOP = { col: 38, row: 7, w: 5, h: 3 };

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
    // La porte entrouverte en haut des casiers, une lueur turquoise. PLACEHOLDER : le monde
    // étrange de la gare viendra avec la PR suivante (bulle « ? », rejouable).
    id: 'station-lockers',
    room: 'station-lost',
    on: 'interact',
    area: LOCKERS_TOP,
    mark: { col: 39, row: 6 },
    lock: true,
    repeat: true,
    when: {},
    steps: [
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
];

const OMENS: StoryOmen[] = [
  // En grimpant vers le haut des casiers : la lumière vacille, les couleurs se refroidissent.
  { room: 'station-lost', when: {}, col: 40, row: 8, radius: 10 },
];

/** Morceaux de l'histoire de la gare, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const STATION_STORY: Pick<StoryData, 'triggers' | 'omens'> = {
  triggers: TRIGGERS,
  omens: OMENS,
};
