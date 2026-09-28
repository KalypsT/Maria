import { DEFAULT_CONTROL_SETTINGS, type ControlSettings } from '../config/controls';
import { parseControlSettings, serializeControlSettings } from '../core/settings/controlSettings';

/** Clé de stockage (décision D-13 : localStorage jusqu'à la Phase 5). */
const STORAGE_KEY = 'maria.settings.controls';

export function loadControlSettings(): ControlSettings {
  try {
    return parseControlSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_CONTROL_SETTINGS }; // stockage inaccessible (navigation privée…)
  }
}

export function saveControlSettings(settings: Readonly<ControlSettings>): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeControlSettings(settings));
  } catch {
    // Non enregistrés : les réglages restent valables pour la session en cours.
  }
}
