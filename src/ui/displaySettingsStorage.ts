import { DEFAULT_DISPLAY_SETTINGS, type DisplaySettings } from '../config/display';
import { parseDisplaySettings, serializeDisplaySettings } from '../core/settings/displaySettings';

/** Clé de stockage (comme D-13 : localStorage jusqu'à la Phase 5). */
const STORAGE_KEY = 'maria.settings.display';

export function loadDisplaySettings(): DisplaySettings {
  try {
    return parseDisplaySettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_DISPLAY_SETTINGS };
  }
}

export function saveDisplaySettings(settings: Readonly<DisplaySettings>): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeDisplaySettings(settings));
  } catch {
    // Non enregistrés : le réglage vaut pour la session en cours.
  }
}
