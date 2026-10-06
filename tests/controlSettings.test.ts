import { describe, expect, it } from 'vitest';
import { CONTROL_SETTING_RANGES, DEFAULT_CONTROL_SETTINGS } from '../src/config/controls';
import {
  parseControlSettings,
  sanitizeControlSettings,
  serializeControlSettings,
} from '../src/core/settings/controlSettings';

describe('réglages des commandes', () => {
  it('borne les nombres et rejette les valeurs invalides', () => {
    const settings = sanitizeControlSettings({
      buttonScale: 99,
      opacity: -3,
      joystickMode: 'gyro',
    });
    expect(settings.buttonScale).toBe(CONTROL_SETTING_RANGES.buttonScale.max);
    expect(settings.opacity).toBe(CONTROL_SETTING_RANGES.opacity.min);
    expect(settings.joystickMode).toBe(DEFAULT_CONTROL_SETTINGS.joystickMode);
  });

  it('retombe sur les valeurs par défaut pour une entrée invalide', () => {
    expect(sanitizeControlSettings(null)).toEqual(DEFAULT_CONTROL_SETTINGS);
    expect(sanitizeControlSettings({ buttonScale: Number.NaN })).toEqual(DEFAULT_CONTROL_SETTINGS);
    expect(parseControlSettings(null)).toEqual(DEFAULT_CONTROL_SETTINGS);
    expect(parseControlSettings('{pas du json')).toEqual(DEFAULT_CONTROL_SETTINGS);
  });

  it('relit sans perte ce qui a été sérialisé', () => {
    const settings = {
      buttonScale: 1.25,
      opacity: 0.4,
      joystickMode: 'analog',
      vibration: false,
    } as const;
    expect(parseControlSettings(serializeControlSettings(settings))).toEqual(settings);
  });

  it('les vibrations (D-128) : gardées, et activées par défaut pour des réglages plus anciens', () => {
    expect(sanitizeControlSettings({ vibration: false }).vibration).toBe(false);
    expect(sanitizeControlSettings({ buttonScale: 1 }).vibration).toBe(true);
    expect(sanitizeControlSettings({ vibration: 'oui' }).vibration).toBe(true);
  });

  it('ignore une version inconnue', () => {
    expect(parseControlSettings('{"version":99,"buttonScale":1.5}')).toEqual(
      DEFAULT_CONTROL_SETTINGS,
    );
  });
});
