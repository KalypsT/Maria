import type { MusicTrack } from '../../config/audio';
import type { TimeOfDay } from '../story/story';

/** Ce qui décide du thème : le monde de la salle et le moment de la journée. */
export interface MusicContext {
  /** Salle du monde étrange (`; @world: strange`). */
  readonly strange: boolean;
  /** Dehors (`; @outdoor: yes`), pour le monde étrange : derrière la haie. */
  readonly outdoor: boolean;
  /** Salle du jardin (`; @world: garden`). */
  readonly garden: boolean;
  /** La rue du quartier (`; @world: street`, D-60). */
  readonly street: boolean;
  readonly time: TimeOfDay;
}

/** Thème d'une salle (D-57). Les parcours d'essai suivent les mêmes règles que la maison. */
export function chooseMusic(context: MusicContext): MusicTrack {
  if (context.strange) {
    return context.outdoor ? 'hedge' : 'strange';
  }
  if (context.garden) {
    return 'garden';
  }
  if (context.street) {
    return 'street';
  }
  return context.time === 'morning' ? 'house-day' : 'house-night';
}
