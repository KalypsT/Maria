import { describe, expect, it } from 'vitest';
import { AUDIO_BUDGET_BYTES, AUDIO_MIX, DEFAULT_AUDIO_SETTINGS } from '../src/config/audio';
import { AudioMix, equalPower, loopOverlapSec } from '../src/core/audio/AudioMix';
import { audioFileMap } from '../src/core/audio/audioFiles';
import { chooseMusic } from '../src/core/audio/musicChoice';
import { sanitizeAudioSettings } from '../src/core/settings/audioSettings';
import { isGardenRoom, isStrangeRoom } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';

/** Avance le mixage de `ms` par pas de 10 ms. */
function run(mix: AudioMix, ms: number): void {
  for (let t = 0; t < ms; t += 10) {
    mix.update(10);
  }
}

describe('choix du thème (D-57)', () => {
  const base = { strange: false, outdoor: false, garden: false } as const;

  it('maison de nuit et de jour, jardin, monde étrange, derrière la haie', () => {
    expect(chooseMusic({ ...base, time: 'evening' })).toBe('house-night');
    expect(chooseMusic({ ...base, time: 'morning' })).toBe('house-day');
    expect(chooseMusic({ ...base, garden: true, time: 'morning' })).toBe('garden');
    expect(chooseMusic({ ...base, strange: true, time: 'morning' })).toBe('strange');
    expect(chooseMusic({ ...base, strange: true, outdoor: true, time: 'morning' })).toBe('hedge');
  });

  it('chaque salle de la maison et du jardin a le thème attendu', () => {
    const themes = new Map<string, string>();
    for (const { id, text } of HOUSE.rooms) {
      const level = parseAsciiLevel(id, text);
      themes.set(
        id,
        chooseMusic({
          strange: isStrangeRoom(level),
          outdoor: Boolean(level.meta.outdoor),
          garden: isGardenRoom(level),
          time: 'morning',
        }),
      );
    }
    expect(themes.get('bedroom')).toBe('house-day');
    expect(themes.get('garden-terrace')).toBe('garden');
    expect(themes.get('living-strange')).toBe('strange');
    expect(themes.get('shadows')).toBe('strange');
    expect(themes.get('garden-upside')).toBe('hedge');
    expect(themes.get('garden-thorns')).toBe('hedge');
  });
});

describe('mixage (D-57)', () => {
  it('fondu enchaîné entre deux thèmes, sans creux de volume', () => {
    const mix = new AudioMix();
    mix.setTrack('house-night');
    run(mix, AUDIO_MIX.crossfadeMs);
    expect(mix.presenceOf('house-night')).toBe(1);
    mix.setTrack('house-day');
    run(mix, AUDIO_MIX.crossfadeMs / 2);
    const a = mix.musicVolume('house-night');
    const b = mix.musicVolume('house-day');
    // Puissance constante : a² + b² reste celle d'un seul thème.
    const full = AUDIO_MIX.musicGain * DEFAULT_AUDIO_SETTINGS.volume;
    expect(a * a + b * b).toBeCloseTo(full * full, 2);
    run(mix, AUDIO_MIX.crossfadeMs);
    expect(mix.presenceOf('house-night')).toBe(0);
    expect(mix.musicVolume('house-day')).toBeCloseTo(full, 5);
  });

  it('silence de Maria : la musique se tait, reste tue, puis revient lentement', () => {
    const mix = new AudioMix();
    mix.setTrack('strange');
    run(mix, AUDIO_MIX.crossfadeMs);
    mix.hush(2000);
    expect(mix.hushing).toBe(true);
    run(mix, AUDIO_MIX.hushOutMs + 10);
    expect(mix.musicVolume('strange')).toBe(0);
    run(mix, 1900);
    expect(mix.musicVolume('strange')).toBe(0);
    run(mix, 200);
    expect(mix.hushing).toBe(false);
    run(mix, AUDIO_MIX.hushInMs / 2);
    const back = mix.musicVolume('strange');
    expect(back).toBeGreaterThan(0);
    expect(back).toBeLessThan(AUDIO_MIX.musicGain * DEFAULT_AUDIO_SETTINGS.volume);
    run(mix, AUDIO_MIX.hushInMs);
    expect(mix.musicVolume('strange')).toBeCloseTo(
      AUDIO_MIX.musicGain * DEFAULT_AUDIO_SETTINGS.volume,
      5,
    );
  });

  it('baisse pendant un jingle et la pause, coupure et volume', () => {
    const mix = new AudioMix();
    mix.setTrack('garden');
    run(mix, AUDIO_MIX.crossfadeMs);
    const full = mix.musicVolume('garden');
    mix.jinglePlaying = true;
    run(mix, AUDIO_MIX.duckMs);
    expect(mix.musicVolume('garden')).toBeCloseTo(full * AUDIO_MIX.jingleDuck, 5);
    mix.jinglePlaying = false;
    mix.paused = true;
    run(mix, AUDIO_MIX.duckMs);
    expect(mix.musicVolume('garden')).toBeCloseTo(full * AUDIO_MIX.pausedDuck, 5);
    mix.settings = { volume: 0.7, muted: true };
    expect(mix.musicVolume('garden')).toBe(0);
    expect(mix.jingleVolume).toBe(0);
    mix.settings = { volume: 0, muted: false };
    expect(mix.musicVolume('garden')).toBe(0);
  });

  it('fondu de boucle : au plus un quart du morceau', () => {
    expect(loopOverlapSec(180, 4000)).toBe(4);
    expect(loopOverlapSec(8, 4000)).toBe(2);
    expect(loopOverlapSec(Number.NaN, 4000)).toBe(0);
    expect(loopOverlapSec(180, 0)).toBe(0);
    expect(equalPower(0)).toBe(0);
    expect(equalPower(1)).toBe(1);
  });
});

describe('fichiers audio (D-57)', () => {
  it('range les fichiers par emplacement, préfère Opus, signale les noms inconnus', () => {
    const { slots, unknown } = audioFileMap({
      '../assets/audio/garden.mp3': '/a/garden-1.mp3',
      '../assets/audio/garden.ogg': '/a/garden-2.ogg',
      '../assets/audio/maria.m4a': '/a/maria.m4a',
      '../assets/audio/jardin.mp3': '/a/jardin.mp3',
      '../assets/audio/title.wav': '/a/title.wav',
    });
    expect(slots.get('garden')).toBe('/a/garden-2.ogg');
    expect(slots.get('maria')).toBe('/a/maria.m4a');
    expect(slots.has('title')).toBe(false);
    expect(unknown.sort()).toEqual(['jardin.mp3', 'title.wav']);
  });

  it('réglages du son bornés', () => {
    expect(sanitizeAudioSettings(undefined)).toEqual(DEFAULT_AUDIO_SETTINGS);
    expect(sanitizeAudioSettings({ volume: -2, muted: true })).toEqual({ volume: 0, muted: true });
  });
});

describe('silences de Maria dans l’histoire (D-57)', () => {
  const hushed = HOUSE_STORY.triggers.filter((t) => t.steps.some((s) => s.do === 'hush'));

  it('aux apparitions et disparitions de Maria, jamais dans un script rejouable', () => {
    expect(hushed.map((t) => t.id).sort()).toEqual(
      [
        'evening-sleep',
        'hedge-enter',
        'living-see',
        'living-vanish',
        'shadows-cradle',
        'thorns-bonnet',
      ].sort(),
    );
    for (const t of hushed) {
      expect(t.repeat ?? false).toBe(false);
      for (const step of t.steps) {
        if (step.do === 'hush') {
          expect(step.ms).toBeGreaterThan(0);
          expect(step.ms).toBeLessThan(20_000);
        }
      }
    }
  });
});

describe('poids de la musique (D-57)', () => {
  it('les fichiers de src/assets/audio ont un nom connu et tiennent dans le budget', () => {
    // `?inline` : chaque fichier en data URL base64 (4 caractères pour 3 octets).
    const files = import.meta.glob<string>(['../src/assets/audio/*.*', '!**/*.md'], {
      eager: true,
      query: '?inline',
      import: 'default',
    });
    const names = Object.keys(files);
    const { unknown } = audioFileMap(Object.fromEntries(names.map((path) => [path, path])));
    expect(unknown).toEqual([]);
    let total = 0;
    for (const path of names) {
      const data = files[path] ?? '';
      total += ((data.length - data.indexOf(',') - 1) * 3) / 4;
    }
    expect(total).toBeLessThanOrEqual(AUDIO_BUDGET_BYTES);
  });
});
