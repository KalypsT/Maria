import {
  CONTROL_SETTING_RANGES,
  DEFAULT_CONTROL_SETTINGS,
  type ControlSettings,
} from '../../config/controls';

/** Version du format stocké ; à incrémenter avec une migration si le format change. */
export const CONTROL_SETTINGS_VERSION = 1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Valide des réglages lus depuis le stockage : toute valeur absente ou invalide retombe sur la
 * valeur par défaut, les nombres sont bornés.
 */
export function sanitizeControlSettings(raw: unknown): ControlSettings {
  const settings: ControlSettings = { ...DEFAULT_CONTROL_SETTINGS };
  if (typeof raw !== 'object' || raw === null) {
    return settings;
  }
  const source = raw as Record<string, unknown>;
  const scale = source['buttonScale'];
  if (typeof scale === 'number' && Number.isFinite(scale)) {
    const range = CONTROL_SETTING_RANGES.buttonScale;
    settings.buttonScale = clamp(scale, range.min, range.max);
  }
  const opacity = source['opacity'];
  if (typeof opacity === 'number' && Number.isFinite(opacity)) {
    const range = CONTROL_SETTING_RANGES.opacity;
    settings.opacity = clamp(opacity, range.min, range.max);
  }
  const mode = source['joystickMode'];
  if (mode === 'digital' || mode === 'analog') {
    settings.joystickMode = mode;
  }
  // Absent des réglages d'avant les vibrations (D-128) : la valeur par défaut, sans migration.
  const vibration = source['vibration'];
  if (typeof vibration === 'boolean') {
    settings.vibration = vibration;
  }
  // Le fil discret (D-129), activé par défaut : de même.
  const hint = source['hint'];
  if (typeof hint === 'boolean') {
    settings.hint = hint;
  }
  return settings;
}

export function serializeControlSettings(settings: Readonly<ControlSettings>): string {
  return JSON.stringify({ version: CONTROL_SETTINGS_VERSION, ...settings });
}

/** Relit un texte stocké (JSON invalide ou d'une autre version → valeurs par défaut). */
export function parseControlSettings(text: string | null): ControlSettings {
  if (text === null) {
    return { ...DEFAULT_CONTROL_SETTINGS };
  }
  try {
    const raw: unknown = JSON.parse(text);
    if (
      typeof raw === 'object' &&
      raw !== null &&
      (raw as Record<string, unknown>)['version'] === CONTROL_SETTINGS_VERSION
    ) {
      return sanitizeControlSettings(raw);
    }
  } catch {
    // JSON illisible : valeurs par défaut.
  }
  return { ...DEFAULT_CONTROL_SETTINGS };
}
