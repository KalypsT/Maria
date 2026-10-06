import type { AudioSettings } from '../config/audio';
import { SFX_GAIN, SFX_MIX, SFX_SLOTS, TEST_TONES, type SfxSlot } from '../config/sfx';
import { pickVariant, sfxFileMap } from '../core/audio/sfx';

/**
 * Fichiers de `src/assets/sfx/` : Vite les publie (nom avec empreinte) et le service worker les
 * précache (hors ligne, D-23).
 */
const FILES = import.meta.glob<string>('../assets/sfx/*.{ogg,opus,m4a,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Volume d'un son de test (build de debug). */
const TEST_TONE_GAIN = 0.25;

/**
 * Bruitages (D-126) : Web Audio, pour une latence faible et plusieurs sons à la fois (la musique,
 * elle, passe par des lecteurs `<audio>`). Les sons sont décodés une fois, au premier geste (règle
 * des navigateurs). Chaque lecture tire une variante (jamais la même deux fois de suite) et varie un
 * peu la hauteur ; dans le monde étrange, les mêmes sons passent par un filtre et un écho. Un
 * emplacement sans fichier reste silencieux, ou joue un son de test dans le build de debug.
 */
export class SfxPlayer {
  /** Sons de test pour les emplacements sans fichier (build de debug seulement). */
  testTones = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private strangeIn: GainNode | null = null;
  private readonly files: Map<SfxSlot, string[]>;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly lastPlayed = new Map<SfxSlot, number>();
  private readonly lastVariant = new Map<SfxSlot, number>();
  private settings: AudioSettings;
  private strange = false;
  private voices = 0;

  constructor(settings: AudioSettings) {
    this.settings = { ...settings };
    const { slots, unknown } = sfxFileMap(FILES);
    this.files = slots;
    if (unknown.length > 0) {
      console.warn(`Bruitages : fichiers au nom inconnu ignorés (${unknown.join(', ')})`);
    }
    const unlock = () => {
      this.start();
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        void this.context?.suspend();
      } else {
        void this.context?.resume();
      }
    });
  }

  /** Emplacements qui ont au moins un fichier. */
  has(slot: SfxSlot): boolean {
    return (this.files.get(slot)?.length ?? 0) > 0;
  }

  /** Résumé pour l'outil de debug : emplacements pourvus, sons décodés, voix en cours. */
  status(): string {
    const filled = SFX_SLOTS.filter((slot) => this.has(slot)).length;
    const state = this.context ? this.context.state : 'attend un toucher';
    return (
      `bruitages ${String(filled)}/${String(SFX_SLOTS.length)}  décodés ${String(this.buffers.size)}` +
      `  voix ${String(this.voices)}  ${state}${this.testTones ? '  sons de test' : ''}`
    );
  }

  setSettings(settings: AudioSettings): void {
    this.settings = { ...settings };
    this.applyVolume();
  }

  /** Monde étrange : les sons suivants passent par le filtre et l'écho. */
  setStrange(strange: boolean): void {
    this.strange = strange;
  }

  /**
   * Joue un bruitage, à `volume` (0–1) en plus du volume de l'emplacement. Ignoré tant que le son
   * n'est pas débloqué ou décodé, trop tôt après la même lecture, ou au-delà du nombre de voix.
   */
  play(slot: SfxSlot, volume = 1): void {
    const context = this.context;
    if (!context || context.state !== 'running' || document.hidden) {
      return;
    }
    const now = context.currentTime * 1000;
    const last = this.lastPlayed.get(slot);
    if (
      (last !== undefined && now - last < SFX_MIX.minIntervalMs) ||
      this.voices >= SFX_MIX.maxVoices
    ) {
      return;
    }
    const gain = volume * (SFX_GAIN[slot] ?? 1);
    const urls = this.files.get(slot);
    if (!urls || urls.length === 0) {
      if (__DEBUG_TOOLS__ && this.testTones) {
        this.lastPlayed.set(slot, now);
        this.tone(context, slot, gain);
      }
      return;
    }
    const variant = pickVariant(urls.length, this.lastVariant.get(slot) ?? -1, Math.random());
    const buffer = this.buffers.get(urls[variant] ?? '');
    if (!buffer) {
      return;
    }
    this.lastPlayed.set(slot, now);
    this.lastVariant.set(slot, variant);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (Math.random() * 2 - 1) * SFX_MIX.pitchVariation;
    const level = context.createGain();
    level.gain.value = gain;
    source.connect(level);
    this.route(source, level);
    source.start();
  }

  /** Crée le contexte audio au premier geste, le circuit (direct, étrange) et décode les sons. */
  private start(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    if (typeof AudioContext === 'undefined') {
      return;
    }
    const context = new AudioContext({ latencyHint: 'interactive' });
    const master = context.createGain();
    master.connect(context.destination);
    const dry = context.createGain();
    dry.connect(master);
    // Monde étrange : assourdi (passe-bas), avec un écho qui se répète en s'éteignant.
    const strange = SFX_MIX.strange;
    const strangeIn = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = strange.lowpassHz;
    strangeIn.connect(filter);
    filter.connect(master);
    const delay = context.createDelay(1);
    delay.delayTime.value = strange.echoDelayS;
    const feedback = context.createGain();
    feedback.gain.value = strange.echoFeedback;
    const wet = context.createGain();
    wet.gain.value = strange.echoGain;
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    this.context = context;
    this.master = master;
    this.dry = dry;
    this.strangeIn = strangeIn;
    this.applyVolume();
    for (const urls of this.files.values()) {
      for (const url of urls) {
        this.decode(context, url);
      }
    }
  }

  private decode(context: AudioContext, url: string): void {
    fetch(url)
      .then((response) =>
        response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status))),
      )
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        this.buffers.set(url, buffer);
      })
      .catch(() => {
        console.warn(`Bruitage illisible : ${url}`);
      });
  }

  private applyVolume(): void {
    if (this.master) {
      const { muted, volume, sfxVolume } = this.settings;
      this.master.gain.value = muted ? 0 : volume * sfxVolume * SFX_MIX.gain;
    }
  }

  /** Branche un son (sa sortie `output`) sur le circuit direct ou étrange, et compte sa voix. */
  private route(source: AudioScheduledSourceNode, output: AudioNode): void {
    const bus = this.strange ? this.strangeIn : this.dry;
    if (!bus) {
      return;
    }
    output.connect(bus);
    this.voices++;
    source.onended = () => {
      this.voices--;
      output.disconnect();
    };
  }

  /** Son de test (build de debug) : un court glissando, différent pour chaque emplacement. */
  private tone(context: AudioContext, slot: SfxSlot, gain: number): void {
    const { from, to, ms, wave } = TEST_TONES[slot];
    const start = context.currentTime;
    const end = start + ms / 1000;
    const oscillator = context.createOscillator();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, end);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(TEST_TONE_GAIN * gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.001, end);
    oscillator.connect(envelope);
    this.route(oscillator, envelope);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}
