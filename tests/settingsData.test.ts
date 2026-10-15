import { describe, expect, it } from 'vitest';
import { DEFAULT_AUDIO_SETTINGS } from '../src/config/audio';
import { DEFAULT_CONTROL_SETTINGS } from '../src/config/controls';
import { DEFAULT_DISPLAY_SETTINGS } from '../src/config/display';
import { checksum } from '../src/core/save/checksum';
import {
  createSettings,
  deserializeSettings,
  migrateLegacySettings,
  sanitizeSettings,
  serializeSettings,
} from '../src/core/save/settingsData';
import { serializeControlSettings } from '../src/core/settings/controlSettings';
import { serializeDisplaySettings } from '../src/core/settings/displaySettings';

describe('settingsData (D-184)', () => {
  it('relit exactement ce qui a été écrit', () => {
    const settings = createSettings();
    settings.controls.buttonScale = 1.2;
    settings.display.renderMode = 'screen';
    settings.audio = { volume: 0.25, muted: true, sfxVolume: 0.4 };
    expect(deserializeSettings(serializeSettings(settings))).toEqual({ ok: true, data: settings });
  });

  it('refuse un enregistrement abîmé, étranger ou plus récent', () => {
    const text = serializeSettings(createSettings());
    expect(deserializeSettings(text.replace('false', 'true'))).toEqual({
      ok: false,
      problem: 'checksum',
    });
    expect(deserializeSettings(text.slice(0, -4))).toEqual({ ok: false, problem: 'unreadable' });
    expect(deserializeSettings('{"format":"maria-save"}')).toEqual({
      ok: false,
      problem: 'format',
    });
    const payload = JSON.stringify(createSettings());
    const future = { format: 'maria-settings', version: 9, checksum: checksum(payload), payload };
    expect(deserializeSettings(JSON.stringify(future))).toEqual({
      ok: false,
      problem: 'future-version',
    });
  });

  it('borne les valeurs, et donne les valeurs par défaut à ce qui manque', () => {
    const odd = sanitizeSettings({
      controls: { buttonScale: 99 },
      display: { renderMode: '8k' },
      audio: { volume: 7, muted: 'oui', sfxVolume: -1 },
    });
    expect(odd.controls.buttonScale).toBeLessThanOrEqual(1.5);
    expect(odd.display).toEqual(DEFAULT_DISPLAY_SETTINGS);
    expect(odd.audio).toEqual({ volume: 1, muted: false, sfxVolume: 0 });
    // Des réglages d'avant les bruitages (D-126) : leur volume par défaut.
    expect(sanitizeSettings({ audio: { volume: 0.5, muted: false } }).audio).toEqual({
      volume: 0.5,
      muted: false,
      sfxVolume: DEFAULT_AUDIO_SETTINGS.sfxVolume,
    });
    expect(sanitizeSettings('rien')).toEqual(createSettings());
  });

  it('reprend les réglages stockés avant la sauvegarde (D-13, D-18)', () => {
    const migrated = migrateLegacySettings(
      serializeControlSettings({ ...DEFAULT_CONTROL_SETTINGS, opacity: 0.4 }),
      serializeDisplaySettings({ renderMode: 'screen' }),
    );
    expect(migrated.controls.opacity).toBe(0.4);
    expect(migrated.display.renderMode).toBe('screen');
    expect(migrateLegacySettings(null, 'n’importe quoi')).toEqual({
      controls: DEFAULT_CONTROL_SETTINGS,
      display: DEFAULT_DISPLAY_SETTINGS,
      audio: DEFAULT_AUDIO_SETTINGS,
      introSeen: false,
    });
  });

  it('l’intro vue (D-186) : retenue, absente des anciens réglages', () => {
    const seen = { ...createSettings(), introSeen: true };
    const read = deserializeSettings(serializeSettings(seen));
    expect(read.ok && read.data.introSeen).toBe(true);
    expect(sanitizeSettings({ introSeen: 'oui' }).introSeen).toBe(false);
    const old = JSON.parse(JSON.stringify(createSettings())) as Record<string, unknown>;
    delete old['introSeen'];
    expect(sanitizeSettings(old).introSeen).toBe(false);
  });
});
