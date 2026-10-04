import {
  AUDIO_MIX,
  DEFAULT_AUDIO_SETTINGS,
  MUSIC_TRACKS,
  type AudioSettings,
  type MusicTrack,
} from '../../config/audio';
import { RECORD_SLOTS, type RecordSlot } from '../../config/records';

export type AudioMixParams = typeof AUDIO_MIX;

/** Ce qui se joue en musique : un thème en boucle, ou un disque une fois (D-121). */
export type MusicSlot = MusicTrack | RecordSlot;
export const MUSIC_SLOTS: readonly MusicSlot[] = [...MUSIC_TRACKS, ...RECORD_SLOTS];

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
 * silence de Maria (`hush`), baisse pendant la pause, volume général (les jingles ne baissent
 * plus la musique, D-121). Un disque (D-121) passe avant le thème : le thème s'éteint, le disque
 * joue, puis le thème revient en fondu à la fin du disque ou quand on l'arrête. Le lecteur lit
 * les volumes calculés ici et les applique aux morceaux. Aucune allocation dans `update`.
 */
export class AudioMix {
  /** Thème voulu ; null : aucun. */
  track: MusicTrack | null = null;
  /** Disque en cours (D-121) ; null : aucun, le thème joue. */
  record: RecordSlot | null = null;
  settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  paused = false;
  private readonly presence = new Map<MusicSlot, number>(MUSIC_SLOTS.map((t) => [t, 0]));
  /** Silence de Maria : niveau (1 = musique normale) et temps restant tout bas. */
  private hushLevel = 1;
  private hushHoldMs = 0;
  private hushActive = false;
  /** Niveau visé pendant le silence (0 : silence complet). */
  private hushFloor = 0;
  private duck = 1;

  constructor(private readonly params: AudioMixParams = AUDIO_MIX) {}

  /** Change de thème en fondu enchaîné (sans effet si c'est déjà lui). */
  setTrack(track: MusicTrack | null): void {
    this.track = track;
  }

  /** Joue un disque (D-121) à la place du thème ; il remplace celui en cours. */
  playRecord(record: RecordSlot): void {
    this.record = record;
  }

  /** Arrête le disque (tourne-disque) : le thème revient en fondu. */
  stopRecord(): void {
    this.record = null;
  }

  /** Le disque est fini (ou illisible) : le thème revient, sauf si un autre disque l'a remplacé. */
  recordEnded(record: RecordSlot): void {
    if (this.record === record) {
      this.record = null;
    }
  }

  /**
   * Maria apparaît : la musique s'éteint vite (jusqu'à `floor`, 0 : silence complet), reste ainsi
   * `ms`, puis revient lentement. Un nouveau silence pendant le premier le prolonge.
   */
  hush(ms: number, floor = 0): void {
    this.hushFloor = this.hushActive ? Math.min(this.hushFloor, floor) : floor;
    this.hushActive = true;
    this.hushHoldMs = Math.max(this.hushHoldMs, ms);
  }

  /** Vrai pendant le silence de Maria (les autres jingles ne sont pas joués). */
  get hushing(): boolean {
    return this.hushActive;
  }

  update(dtMs: number): void {
    const p = this.params;
    const playing: MusicSlot | null = this.record ?? this.track;
    for (const t of MUSIC_SLOTS) {
      const current = this.presence.get(t) ?? 0;
      const target = t === playing ? 1 : 0;
      const fadeMs = t.startsWith('record-') ? p.recordFadeMs : p.crossfadeMs;
      this.presence.set(t, approach(current, target, dtMs / Math.max(1, fadeMs)));
    }
    if (this.hushActive) {
      if (this.hushLevel > this.hushFloor) {
        this.hushLevel = approach(this.hushLevel, this.hushFloor, dtMs / Math.max(1, p.hushOutMs));
      } else if (this.hushHoldMs > 0) {
        this.hushHoldMs = Math.max(0, this.hushHoldMs - dtMs);
      } else {
        this.hushActive = false;
      }
    } else {
      this.hushLevel = approach(this.hushLevel, 1, dtMs / Math.max(1, p.hushInMs));
    }
    const duckTarget = this.paused ? p.pausedDuck : 1;
    this.duck = approach(this.duck, duckTarget, dtMs / Math.max(1, p.duckMs));
  }

  /** Volume général (0 si le son est coupé). */
  get master(): number {
    return this.settings.muted ? 0 : Math.min(1, Math.max(0, this.settings.volume));
  }

  /** Présence d'un thème ou d'un disque, de 0 (absent) à 1 : démarre et arrête sa lecture. */
  presenceOf(track: MusicSlot): number {
    return this.presence.get(track) ?? 0;
  }

  /** Volume d'un thème ou d'un disque à appliquer au morceau. */
  musicVolume(track: MusicSlot): number {
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
