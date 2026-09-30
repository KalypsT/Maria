import {
  AUDIO_MIX,
  MUSIC_TRACKS,
  type AudioSettings,
  type Jingle,
  type MusicTrack,
} from '../config/audio';
import { AudioMix, equalPower, loopOverlapSec } from '../core/audio/AudioMix';
import { audioFileMap, type AudioSlot } from '../core/audio/audioFiles';

/**
 * Fichiers de `src/assets/audio/` : Vite les publie (nom avec empreinte, donc un morceau remplacé
 * est bien retéléchargé) et le service worker les précache (hors ligne, D-23).
 */
const FILES = import.meta.glob<string>('../assets/audio/*.{ogg,opus,m4a,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/**
 * Un thème : deux lecteurs qui se relaient pour boucler en fondu enchaîné avec la fin du morceau
 * (D-57). Le fichier est lu une fois en mémoire (blob) : pas de requêtes partielles à servir par
 * le service worker, et les deux lecteurs partagent la même copie.
 */
class TrackVoice {
  private readonly players: HTMLAudioElement[] = [];
  private active = 0;
  /** Heure (ms) du début du fondu de boucle ; -1 hors fondu. */
  private loopStart = -1;
  private loading = false;
  playing = false;

  constructor(private readonly url: string) {}

  get ready(): boolean {
    return this.players.length === 2;
  }

  load(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    void fetch(this.url)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error('audio'))))
      .then((blob) => {
        const src = URL.createObjectURL(blob);
        for (let i = 0; i < 2; i++) {
          const player = new Audio(src);
          player.preload = 'auto';
          this.players.push(player);
        }
      })
      .catch(() => {
        // Fichier illisible (hors ligne sans cache…) : ce thème reste silencieux.
      });
  }

  /** Lecture depuis le début (le thème revient) ; échoue sans bruit avant le premier geste. */
  start(): void {
    const player = this.players[this.active];
    if (!player) {
      return;
    }
    player.currentTime = 0;
    player.volume = 0;
    this.loopStart = -1;
    this.playing = true;
    player.play().catch(() => {
      this.playing = false;
    });
  }

  stop(): void {
    for (const player of this.players) {
      player.pause();
    }
    this.playing = false;
    this.loopStart = -1;
  }

  /** Suspendu (appli en arrière-plan) sans revenir au début. */
  suspend(): void {
    for (const player of this.players) {
      player.pause();
    }
  }

  resume(): void {
    if (!this.playing) {
      return;
    }
    const current = this.players[this.active];
    current?.play().catch(() => undefined);
    if (this.loopStart >= 0) {
      this.players[1 - this.active]?.play().catch(() => undefined);
    }
  }

  update(volume: number, now: number): void {
    const current = this.players[this.active];
    const other = this.players[1 - this.active];
    if (!this.playing || !current || !other) {
      return;
    }
    const overlap = loopOverlapSec(current.duration, AUDIO_MIX.loopCrossfadeMs);
    current.loop = overlap <= 0;
    if (overlap > 0 && this.loopStart < 0 && current.currentTime >= current.duration - overlap) {
      // Fin du morceau : l'autre lecteur repart du début pendant que celui-ci s'éteint.
      this.loopStart = now;
      other.currentTime = 0;
      other.play().catch(() => undefined);
    }
    if (this.loopStart < 0) {
      current.volume = clampVolume(volume);
      return;
    }
    const k = (now - this.loopStart) / (overlap * 1000);
    if (k >= 1 || current.ended) {
      current.pause();
      this.active = 1 - this.active;
      this.loopStart = -1;
      other.volume = clampVolume(volume);
      return;
    }
    current.volume = clampVolume(volume * equalPower(1 - k));
    other.volume = clampVolume(volume * equalPower(k));
  }
}

function clampVolume(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Lecteur de musique (§39, D-57) : thèmes en boucle avec fondus enchaînés, jingles, silence de
 * Maria, volume et coupure. Le son démarre au premier geste (règle des navigateurs) et s'arrête
 * quand l'appli passe en arrière-plan. Tous les calculs de volume sont dans `AudioMix` (testé).
 */
export class AudioPlayer {
  readonly mix = new AudioMix();
  private readonly files: Map<AudioSlot, string>;
  private readonly voices = new Map<MusicTrack, TrackVoice>();
  private readonly jingles = new Map<Jingle, HTMLAudioElement>();
  private activeJingle: HTMLAudioElement | null = null;
  private unlocked = false;
  private lastFrame = 0;

  constructor(settings: AudioSettings) {
    const { slots, unknown } = audioFileMap(FILES);
    this.files = slots;
    if (unknown.length > 0) {
      console.warn(`Audio : fichiers au nom inconnu ignorés (${unknown.join(', ')})`);
    }
    this.mix.settings = { ...settings };
    const unlock = () => {
      this.unlocked = true;
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    document.addEventListener('visibilitychange', () => {
      for (const voice of this.voices.values()) {
        if (document.hidden) {
          voice.suspend();
        } else {
          voice.resume();
        }
      }
      if (document.hidden) {
        this.activeJingle?.pause();
      }
    });
    const frame = (now: number) => {
      this.update(now);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /** Emplacements qui ont un fichier (affiché par l'outil de debug). */
  has(slot: AudioSlot): boolean {
    return this.files.has(slot);
  }

  /** Résumé pour l'outil de debug : thème voulu, fichier, lecture, volume, silence. */
  status(): string {
    const track = this.mix.track;
    if (!track) {
      return 'musique aucune';
    }
    const file = this.files.has(track) ? '' : ' (pas de fichier)';
    const playing = this.voices.get(track)?.playing ? ' ▶' : '';
    return (
      `musique ${track}${file}${playing}  vol ${this.mix.musicVolume(track).toFixed(2)}` +
      (this.mix.hushing ? '  silence de Maria' : '') +
      (this.unlocked ? '' : '  (attend un toucher)')
    );
  }

  setMusic(track: MusicTrack | null): void {
    this.mix.setTrack(track);
  }

  setSettings(settings: AudioSettings): void {
    this.mix.settings = { ...settings };
  }

  setPaused(paused: boolean): void {
    this.mix.paused = paused;
  }

  /** Maria apparaît : silence (et jingle étrange s'il existe). */
  hush(ms: number): void {
    this.mix.hush(ms);
    this.playJingle('maria');
  }

  /** Joue un jingle une fois ; pendant le silence de Maria, seul le sien est joué. */
  playJingle(jingle: Jingle): void {
    const url = this.files.get(jingle);
    if (!url || !this.unlocked || document.hidden || (this.mix.hushing && jingle !== 'maria')) {
      return;
    }
    let player = this.jingles.get(jingle);
    if (!player) {
      player = new Audio(url);
      player.addEventListener('ended', () => {
        if (this.activeJingle === player) {
          this.activeJingle = null;
          this.mix.jinglePlaying = false;
        }
      });
      this.jingles.set(jingle, player);
    }
    this.activeJingle?.pause();
    this.activeJingle = player;
    player.currentTime = 0;
    player.volume = clampVolume(this.mix.jingleVolume);
    this.mix.jinglePlaying = true;
    player.play().catch(() => {
      this.activeJingle = null;
      this.mix.jinglePlaying = false;
    });
  }

  private update(now: number): void {
    const dt = this.lastFrame > 0 ? Math.min(100, now - this.lastFrame) : 0;
    this.lastFrame = now;
    const mix = this.mix;
    mix.update(dt);
    if (this.activeJingle) {
      this.activeJingle.volume = clampVolume(mix.jingleVolume);
    }
    for (const track of MUSIC_TRACKS) {
      const presence = mix.presenceOf(track);
      let voice = this.voices.get(track);
      if (!voice) {
        const url = this.files.get(track);
        if (presence <= 0 || !url) {
          continue;
        }
        voice = new TrackVoice(url);
        this.voices.set(track, voice);
      }
      if (presence <= 0) {
        if (voice.playing) {
          voice.stop();
        }
        continue;
      }
      voice.load();
      if (!voice.playing && voice.ready && this.unlocked && !document.hidden) {
        voice.start();
      }
      voice.update(mix.musicVolume(track), now);
    }
  }
}
