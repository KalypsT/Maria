import { DEFAULT_AUDIO_SETTINGS, type AudioSettings } from '../../config/audio';

/**
 * Valide des réglages du son lus depuis la sauvegarde : une valeur absente (sauvegarde d'avant le
 * son) ou invalide retombe sur la valeur par défaut, le volume est borné entre 0 et 1.
 */
export function sanitizeAudioSettings(raw: unknown): AudioSettings {
  const settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  if (typeof raw !== 'object' || raw === null) {
    return settings;
  }
  const source = raw as Record<string, unknown>;
  const volume = source['volume'];
  if (typeof volume === 'number' && Number.isFinite(volume)) {
    settings.volume = Math.min(1, Math.max(0, volume));
  }
  const muted = source['muted'];
  if (typeof muted === 'boolean') {
    settings.muted = muted;
  }
  return settings;
}
