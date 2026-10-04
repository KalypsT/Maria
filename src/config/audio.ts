/**
 * Musique (§39, D-57). Les morceaux sont des fichiers déposés dans `src/assets/audio/`, nommés
 * d'après leur emplacement (`garden.m4a`, `house.m4a`…). Un emplacement sans fichier reste
 * silencieux : on peut ajouter les morceaux un par un. Valeurs PROVISOIRES, à régler sur téléphone.
 */

/** Thèmes, joués en boucle selon la salle et le moment de la journée. */
export const MUSIC_TRACKS = [
  /** Écran d'accueil. */
  'title',
  /** La maison, de jour comme de nuit (D-94). */
  'house',
  /** Le jardin (dehors, de jour). */
  'garden',
  /**
   * Tous les mondes étranges (D-94) : la maison, derrière la haie, l'école, la gare et sa tour,
   * la cuisine et le train de la vaisselle.
   */
  'strange',
  /** La rue du quartier (D-60). */
  'street',
  /** La gare (D-66), par `; @music: station`. */
  'station',
  /** Le train de nuit (D-85), par `; @music: train`. */
  'train',
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

/**
 * Courts jingles, joués une fois par-dessus la musique, sans la baisser (D-121) ; seule
 * l'apparition de Maria la baisse (`hushWithJingle`).
 */
export const JINGLES = [
  /** Une capacité ou une trouvaille ramassée. */
  'found',
  /** Un nouveau souvenir dans le cahier. */
  'memory',
  /**
   * Apparition de Maria (étape `hush` de l'histoire) : ce jingle étrange est joué par-dessus le
   * thème s'il existe (D-94) ; sans lui, la musique se tait (§39).
   */
  'maria',
] as const;
export type Jingle = (typeof JINGLES)[number];

/** Formats acceptés, par ordre de préférence si un emplacement en a plusieurs. */
export const AUDIO_EXTENSIONS = ['ogg', 'opus', 'm4a', 'mp3'] as const;

/**
 * Poids maximal de l'ensemble des fichiers audio (précachés pour le hors ligne, D-23) : vérifié
 * par `check:pwa`. Les thèmes et les jingles en AAC 96 kbit/s (D-92).
 */
export const AUDIO_BUDGET_BYTES = 25 * 1024 * 1024;

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
  /**
   * Volume de la musique pendant l'apparition de Maria quand son jingle existe (D-94, D-121) : on
   * entend encore le thème (ou le disque), baissé. Sans fichier `maria`, c'est le silence. Les
   * autres jingles se jouent par-dessus la musique, sans la baisser (D-121).
   */
  hushWithJingle: 0.8,
  /** Vitesse de la baisse et du retour pendant la pause. */
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
