/**
 * Musique (§39, D-57). Les morceaux sont des fichiers déposés dans `src/assets/audio/`, nommés
 * d'après leur emplacement (`garden.ogg`, `house-night.mp3`…). Un emplacement sans fichier reste
 * silencieux : on peut ajouter les morceaux un par un. Valeurs PROVISOIRES, à régler sur téléphone.
 */

/** Thèmes, joués en boucle selon la salle et le moment de la journée. */
export const MUSIC_TRACKS = [
  /** Écran d'accueil. */
  'title',
  /** La maison le soir et la nuit (prologue). */
  'house-night',
  /** La maison le matin, et après la croissance. */
  'house-day',
  /** Le jardin (dehors, de jour). */
  'garden',
  /** Le monde étrange de la maison (salon étrange, passage d'ombres). */
  'strange',
  /** Derrière la haie (le monde étrange, dehors). */
  'hedge',
  /** La rue du quartier (D-60). */
  'street',
  /** L'école étrange, le monde étrange du quartier (D-64). */
  'street-strange',
  /** La gare (D-66), par `; @music: station`. */
  'station',
  /** Le monde étrange de la gare et la tour des objets perdus (D-68). */
  'station-strange',
  /** Le train de nuit (D-85), par `; @music: train`. */
  'train',
  /** Le monde étrange du train : la cuisine étrange et le train de la vaisselle (D-88). */
  'train-strange',
  /**
   * Les souvenirs jouables (D-89), par `; @music: memory-play`. Pas `memory` : ce nom est celui du
   * jingle (un fichier `memory.*` servirait aux deux).
   */
  'memory-play',
] as const;
export type MusicTrack = (typeof MUSIC_TRACKS)[number];

export function isMusicTrack(id: string | undefined): id is MusicTrack {
  return id !== undefined && (MUSIC_TRACKS as readonly string[]).includes(id);
}

/** Courts jingles, joués une fois par-dessus la musique (baissée pendant ce temps). */
export const JINGLES = [
  /** Une capacité ou une trouvaille ramassée. */
  'found',
  /** Un nouveau souvenir dans le cahier. */
  'memory',
  /**
   * Apparition de Maria (étape `hush` de l'histoire) : la musique se tait ; ce jingle étrange est
   * joué s'il existe, sinon c'est le silence (§39, à comparer sur téléphone).
   */
  'maria',
] as const;
export type Jingle = (typeof JINGLES)[number];

/** Formats acceptés, par ordre de préférence si un emplacement en a plusieurs. */
export const AUDIO_EXTENSIONS = ['ogg', 'opus', 'm4a', 'mp3'] as const;

/**
 * Poids maximal de l'ensemble des fichiers audio (précachés pour le hors ligne, D-23) : vérifié
 * par `check:pwa`. Environ 5 thèmes de 2 à 3 minutes en Opus ou MP3 à 96 kbit/s.
 */
export const AUDIO_BUDGET_BYTES = 12 * 1024 * 1024;

export const AUDIO_MIX = {
  /** Fondu enchaîné entre deux thèmes. */
  crossfadeMs: 2500,
  /**
   * Boucle : le morceau repart du début en fondu enchaîné avec sa propre fin (les morceaux ne sont
   * pas forcément composés pour boucler). 0 : boucle sèche.
   */
  loopCrossfadeMs: 4000,
  /** Maria (`hush`) : la musique s'éteint vite… */
  hushOutMs: 1200,
  /** …puis revient lentement. */
  hushInMs: 3500,
  /** Volume de la musique pendant un jingle, et vitesse de la baisse et du retour. */
  jingleDuck: 0.3,
  duckMs: 400,
  /** Volume de la musique pendant la pause. */
  pausedDuck: 0.45,
  /** Volume propre de chaque famille de sons (avant le volume général). */
  musicGain: 0.8,
  jingleGain: 1,
} as const;

export interface AudioSettings {
  /** Volume général, de 0 à 1. */
  volume: number;
  muted: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: Readonly<AudioSettings> = { volume: 0.7, muted: false };
