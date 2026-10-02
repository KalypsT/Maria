import type { MusicTrack } from '../../config/audio';

/** Ce qui décide du thème : le monde de la salle (D-94 : plus le moment de la journée). */
export interface MusicContext {
  /** Salle du monde étrange (`; @world: strange`). */
  readonly strange: boolean;
  /** Salle du jardin (`; @world: garden`). */
  readonly garden: boolean;
  /** La rue du quartier (`; @world: street`, D-60). */
  readonly street: boolean;
  /** Thème imposé par la salle (`; @music:`, D-64), s'il existe. */
  readonly room?: MusicTrack | null;
}

/** Thème d'une salle (D-57). Les parcours d'essai suivent les mêmes règles que la maison. */
export function chooseMusic(context: MusicContext): MusicTrack {
  if (context.room) {
    return context.room;
  }
  if (context.strange) {
    return 'strange';
  }
  if (context.garden) {
    return 'garden';
  }
  if (context.street) {
    return 'street';
  }
  return 'house';
}
