import {
  AUDIO_MIX,
  DEFAULT_AUDIO_SETTINGS,
  MUSIC_TRACKS,
  type AudioSettings,
  type MusicTrack,
} from '../../config/audio';

export type AudioMixParams = typeof AUDIO_MIX;

/** Rapproche `value` de `target` d'au plus `step`. */
function approach(value: number, target: number, step: number): number {
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step);
}

/** Fondu à puissance constante : pas de creux de volume au milieu d'un fondu enchaîné. */
export function equalPower(k: number): number {
  return Math.sin((Math.min(1, Math.max(0, k)) * Math.PI) / 2);
}

/**
 * Mixage (D-57), pur et indépendant du navigateur : présence de chaque thème (fondus enchaînés),
 * silence de Maria (`hush`), baisse pendant un jingle ou la pause, volume général. Le lecteur lit
 * les volumes calculés ici et les applique aux morceaux. Aucune allocation dans `update`.
 */
export class AudioMix {
  /** Thème voulu ; null : aucun. */
  track: MusicTrack | null = null;
  settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  paused = false;
  jinglePlaying = false;
  private readonly presence = new Map<MusicTrack, number>(MUSIC_TRACKS.map((t) => [t, 0]));
  /** Silence de Maria : niveau (1 = musique normale) et temps restant tout bas. */
  private hushLevel = 1;
  private hushHoldMs = 0;
  private hushActive = false;
  private duck = 1;

  constructor(private readonly params: AudioMixParams = AUDIO_MIX) {}

  /** Change de thème en fondu enchaîné (sans effet si c'est déjà lui). */
  setTrack(track: MusicTrack | null): void {
    this.track = track;
  }

  /**
   * Maria apparaît : la musique s'éteint vite, reste tue `ms`, puis revient lentement. Un nouveau
   * silence pendant le premier le prolonge.
   */
  hush(ms: number): void {
    this.hushActive = true;
    this.hushHoldMs = Math.max(this.hushHoldMs, ms);
  }

  /** Vrai pendant le silence de Maria (les autres jingles ne sont pas joués). */
  get hushing(): boolean {
    return this.hushActive;
  }

  update(dtMs: number): void {
    const p = this.params;
    for (const t of MUSIC_TRACKS) {
      const current = this.presence.get(t) ?? 0;
      const target = t === this.track ? 1 : 0;
      this.presence.set(t, approach(current, target, dtMs / Math.max(1, p.crossfadeMs)));
    }
    if (this.hushActive) {
      if (this.hushLevel > 0) {
        this.hushLevel = approach(this.hushLevel, 0, dtMs / Math.max(1, p.hushOutMs));
      } else if (this.hushHoldMs > 0) {
        this.hushHoldMs = Math.max(0, this.hushHoldMs - dtMs);
      } else {
        this.hushActive = false;
      }
    } else {
      this.hushLevel = approach(this.hushLevel, 1, dtMs / Math.max(1, p.hushInMs));
    }
    let duckTarget = 1;
    if (this.jinglePlaying) {
      duckTarget = Math.min(duckTarget, p.jingleDuck);
    }
    if (this.paused) {
      duckTarget = Math.min(duckTarget, p.pausedDuck);
    }
    this.duck = approach(this.duck, duckTarget, dtMs / Math.max(1, p.duckMs));
  }

  /** Volume général (0 si le son est coupé). */
  get master(): number {
    return this.settings.muted ? 0 : Math.min(1, Math.max(0, this.settings.volume));
  }

  /** Présence d'un thème, de 0 (absent) à 1 : sert à démarrer et arrêter sa lecture. */
  presenceOf(track: MusicTrack): number {
    return this.presence.get(track) ?? 0;
  }

  /** Volume d'un thème à appliquer au morceau. */
  musicVolume(track: MusicTrack): number {
    return (
      equalPower(this.presenceOf(track)) *
      equalPower(this.hushLevel) *
      this.duck *
      this.params.musicGain *
      this.master
    );
  }

  get jingleVolume(): number {
    return this.params.jingleGain * this.master;
  }
}

/**
 * Durée (s) du fondu de boucle d'un morceau de `durationSec` : au plus un quart du morceau, pour
 * qu'un morceau court ne se chevauche pas lui-même. 0 : boucle sèche.
 */
export function loopOverlapSec(durationSec: number, loopCrossfadeMs: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(loopCrossfadeMs / 1000, durationSec / 4));
}
