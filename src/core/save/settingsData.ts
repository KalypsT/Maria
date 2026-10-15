import { DEFAULT_AUDIO_SETTINGS, type AudioSettings } from '../../config/audio';
import { DEFAULT_CONTROL_SETTINGS, type ControlSettings } from '../../config/controls';
import { DEFAULT_DISPLAY_SETTINGS, type DisplaySettings } from '../../config/display';
import { sanitizeAudioSettings } from '../settings/audioSettings';
import { parseControlSettings, sanitizeControlSettings } from '../settings/controlSettings';
import { parseDisplaySettings, sanitizeDisplaySettings } from '../settings/displaySettings';
import { isRecord, readRecord, writeRecord, type DecodeResult } from './checksum';

/**
 * Les réglages (D-184) : communs à toutes les parties de l'appareil, stockés à part, avec leur
 * version et leur somme de contrôle. Un réglage hors bornes est seulement borné.
 */
export interface GameSettings {
  controls: ControlSettings;
  display: DisplaySettings;
  audio: AudioSettings;
  /** L'intro a été vue en entier une fois sur l'appareil (D-186) : « Passer » est montré d'emblée. */
  introSeen: boolean;
}

export const SETTINGS_VERSION = 1;
const SETTINGS_FORMAT = 'maria-settings';

export function createSettings(): GameSettings {
  return {
    controls: { ...DEFAULT_CONTROL_SETTINGS },
    display: { ...DEFAULT_DISPLAY_SETTINGS },
    audio: { ...DEFAULT_AUDIO_SETTINGS },
    introSeen: false,
  };
}

export function copySettings(settings: Readonly<GameSettings>): GameSettings {
  return {
    controls: { ...settings.controls },
    display: { ...settings.display },
    audio: { ...settings.audio },
    introSeen: settings.introSeen,
  };
}

/** Réglages lus (n'importe quoi) → réglages valides : ce qui manque prend la valeur par défaut. */
export function sanitizeSettings(raw: unknown): GameSettings {
  const source = isRecord(raw) ? raw : {};
  return {
    controls: sanitizeControlSettings(source['controls']),
    display: sanitizeDisplaySettings(source['display']),
    audio: sanitizeAudioSettings(source['audio']),
    introSeen: source['introSeen'] === true,
  };
}

/**
 * Migration depuis les réglages stockés avant la sauvegarde (D-13, D-18 : `localStorage`). Des textes
 * absents ou invalides donnent les valeurs par défaut.
 */
export function migrateLegacySettings(
  controlsText: string | null,
  displayText: string | null,
): GameSettings {
  return {
    controls: parseControlSettings(controlsText),
    display: parseDisplaySettings(displayText),
    audio: { ...DEFAULT_AUDIO_SETTINGS },
    introSeen: false,
  };
}

export function serializeSettings(settings: Readonly<GameSettings>): string {
  return writeRecord(SETTINGS_FORMAT, SETTINGS_VERSION, JSON.stringify(settings));
}

/** Texte stocké → réglages valides, ou la raison du refus. Ne lève jamais d'exception. */
export function deserializeSettings(text: string | null): DecodeResult<GameSettings> {
  const record = readRecord(text, SETTINGS_FORMAT);
  if (!record.ok) {
    return record;
  }
  if (record.version > SETTINGS_VERSION) {
    return { ok: false, problem: 'future-version' };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(record.payload);
  } catch {
    return { ok: false, problem: 'unreadable' };
  }
  return isRecord(raw)
    ? { ok: true, data: sanitizeSettings(raw) }
    : { ok: false, problem: 'schema' };
}
