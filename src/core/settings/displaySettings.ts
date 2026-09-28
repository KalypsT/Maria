import { DEFAULT_DISPLAY_SETTINGS, type DisplaySettings } from '../../config/display';

/** Version du format stocké ; à incrémenter avec une migration si le format change. */
export const DISPLAY_SETTINGS_VERSION = 1;

/** Valide des réglages lus depuis le stockage : toute valeur invalide retombe sur la valeur par défaut. */
export function sanitizeDisplaySettings(raw: unknown): DisplaySettings {
  const settings: DisplaySettings = { ...DEFAULT_DISPLAY_SETTINGS };
  if (typeof raw !== 'object' || raw === null) {
    return settings;
  }
  const mode = (raw as Record<string, unknown>)['renderMode'];
  if (mode === 'logical' || mode === 'screen') {
    settings.renderMode = mode;
  }
  return settings;
}

export function serializeDisplaySettings(settings: Readonly<DisplaySettings>): string {
  return JSON.stringify({ version: DISPLAY_SETTINGS_VERSION, ...settings });
}

/** Relit un texte stocké (JSON invalide ou d'une autre version → valeurs par défaut). */
export function parseDisplaySettings(text: string | null): DisplaySettings {
  if (text === null) {
    return { ...DEFAULT_DISPLAY_SETTINGS };
  }
  try {
    const raw: unknown = JSON.parse(text);
    if (
      typeof raw === 'object' &&
      raw !== null &&
      (raw as Record<string, unknown>)['version'] === DISPLAY_SETTINGS_VERSION
    ) {
      return sanitizeDisplaySettings(raw);
    }
  } catch {
    // JSON illisible : valeurs par défaut.
  }
  return { ...DEFAULT_DISPLAY_SETTINGS };
}
