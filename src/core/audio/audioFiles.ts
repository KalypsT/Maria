import {
  AUDIO_EXTENSIONS,
  JINGLES,
  MUSIC_TRACKS,
  type Jingle,
  type MusicTrack,
} from '../../config/audio';
import { RECORD_SLOTS, type RecordSlot } from '../../config/records';

export type AudioSlot = MusicTrack | Jingle | RecordSlot;

const SLOTS: readonly string[] = [...MUSIC_TRACKS, ...JINGLES, ...RECORD_SLOTS];

/**
 * Fichiers audio trouvés (chemin → adresse) rangés par emplacement : le nom du fichier sans
 * extension est l'emplacement. Si un emplacement a plusieurs formats, le premier de
 * `AUDIO_EXTENSIONS` l'emporte. Les fichiers au nom inconnu sont signalés.
 */
export function audioFileMap(files: Readonly<Record<string, string>>): {
  slots: Map<AudioSlot, string>;
  unknown: string[];
} {
  const slots = new Map<AudioSlot, string>();
  const rank = new Map<AudioSlot, number>();
  const unknown: string[] = [];
  for (const [path, url] of Object.entries(files)) {
    const name = path.slice(path.lastIndexOf('/') + 1);
    const dot = name.lastIndexOf('.');
    const base = name.slice(0, dot);
    const ext = AUDIO_EXTENSIONS.indexOf(
      name.slice(dot + 1).toLowerCase() as (typeof AUDIO_EXTENSIONS)[number],
    );
    if (dot <= 0 || ext < 0 || !SLOTS.includes(base)) {
      unknown.push(name);
      continue;
    }
    const slot = base as AudioSlot;
    if (ext < (rank.get(slot) ?? Infinity)) {
      slots.set(slot, url);
      rank.set(slot, ext);
    }
  }
  return { slots, unknown };
}
