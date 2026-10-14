import { JOURNEY, JOURNEY_STEPS, TREASURE_FINDS } from '../../config/journey';
import type { SaveData } from '../save/saveData';
import { zoneShells } from './shells';
import type { Zone } from './zone';

/** Un compte : faits et en tout. */
export interface JourneyTally {
  readonly done: number;
  readonly total: number;
}

/** L'avancement du voyage (D-180). */
export interface JourneyProgress {
  /** Les étapes de l'histoire vécues. */
  readonly story: JourneyTally;
  /** Les trouvailles : coquilles, souvenirs, affaires de Maria, disques. */
  readonly finds: JourneyTally;
  /** De 0 à 100, arrondi vers le bas : 100 seulement quand tout est fait. */
  readonly percent: number;
}

/**
 * L'avancement du voyage (D-180) : moitié les étapes de l'histoire, moitié les trouvailles (chacune
 * autant). La console n'y compte pas. Pur.
 */
export function journeyProgress(
  zone: Zone,
  data: Pick<Readonly<SaveData>, 'story' | 'progression'>,
): JourneyProgress {
  const flags = new Set(data.story.flags);
  const { collectibles, memories } = data.progression;
  const story = {
    done: JOURNEY_STEPS.filter((step) => flags.has(step)).length,
    total: JOURNEY_STEPS.length,
  };
  const shells = zoneShells(zone);
  const finds = {
    done:
      shells.filter((shell) => collectibles.includes(shell.name)).length +
      TREASURE_FINDS.filter((id) => memories.includes(id)).length,
    total: shells.length + TREASURE_FINDS.length,
  };
  const share = (t: JourneyTally) => (t.total > 0 ? t.done / t.total : 1);
  const ratio = JOURNEY.storyShare * share(story) + (1 - JOURNEY.storyShare) * share(finds);
  const complete = story.done === story.total && finds.done === finds.total;
  // Arrondi vers le bas, et jamais 100 avant la toute fin (les arrondis des fractions).
  const percent = complete ? 100 : Math.min(99, Math.floor(ratio * 100 + 1e-9));
  return { story, finds, percent };
}
