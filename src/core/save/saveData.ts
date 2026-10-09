import { DEFAULT_CONTROL_SETTINGS, type ControlSettings } from '../../config/controls';
import { DEFAULT_DISPLAY_SETTINGS, type DisplaySettings } from '../../config/display';
import { DEFAULT_AUDIO_SETTINGS, type AudioSettings } from '../../config/audio';
import { parseControlSettings, sanitizeControlSettings } from '../settings/controlSettings';
import { parseDisplaySettings, sanitizeDisplaySettings } from '../settings/displaySettings';
import { sanitizeAudioSettings } from '../settings/audioSettings';
import { LEGACY_STORY_FLAGS } from '../../config/story';
import type { LevelEntity } from '../level/LevelData';
import { createStats, sanitizeStats, type GameStats } from './stats';

/**
 * Sauvegarde (décision D-22) : format versionné, validé strictement, protégé par une somme de
 * contrôle. Pur et indépendant du stockage (IndexedDB, localStorage ou mémoire).
 */
export const SAVE_VERSION = 3;
const RECORD_FORMAT = 'maria-save';
const CODE_PREFIX = 'MARIA1';
const MAX_ID_LENGTH = 64;
const MAX_LIST_LENGTH = 2000;

export interface SaveData {
  version: typeof SAVE_VERSION;
  /** Date de l'écriture (ms depuis l'époque Unix). */
  savedAt: number;
  /** Point de retour : salle et checkpoint (null = départ de la salle). */
  checkpoint: { levelId: string; checkpointId: string | null };
  /** Checkpoints déjà activés, sous la forme `salle:identifiant`. */
  activatedCheckpoints: string[];
  /** Son (D-57) : absent des sauvegardes plus anciennes, valeurs par défaut (aucune migration). */
  settings: { controls: ControlSettings; display: DisplaySettings; audio: AudioSettings };
  /** Progression permanente : prévue, vide tant que ces systèmes n'existent pas. */
  progression: {
    abilities: string[];
    collectibles: string[];
    /**
     * Coquilles vues mais pas encore prises (D-148), dessinées en pointillés sur la carte. Absent
     * des sauvegardes plus anciennes : vide (aucune migration).
     */
    seenCollectibles: string[];
    memories: string[];
    mapRevealed: string[];
  };
  /** Histoire (§33, version 2) : étapes déjà vécues (drapeaux des événements). */
  story: { flags: string[] };
  /** Stats de la partie (D-153) : absentes des sauvegardes plus anciennes, à zéro (aucune migration). */
  stats: GameStats;
}

/** Enregistrement stocké : le contenu sérialisé et sa somme de contrôle. */
export interface SaveRecord {
  format: typeof RECORD_FORMAT;
  version: number;
  checksum: string;
  payload: string;
}

export type SaveProblem =
  /** Texte illisible (JSON invalide ou tronqué). */
  | 'unreadable'
  /** Pas un enregistrement de sauvegarde de MARIA. */
  | 'format'
  /** Contenu modifié ou abîmé (somme de contrôle fausse). */
  | 'checksum'
  /** Version plus récente que ce jeu. */
  | 'future-version'
  /** Contenu ne respectant pas le schéma. */
  | 'schema';

export type DecodeResult = { ok: true; data: SaveData } | { ok: false; problem: SaveProblem };

/**
 * Identifiant d'un checkpoint dans sa salle : le nom fixe de sa lanterne (`; @lantern:`, D-152). Une
 * lanterne sans nom (un parcours d'essai, qui ne sauvegarde rien) prend sa tuile.
 */
export function checkpointId(lantern: Readonly<LevelEntity>): string {
  return lantern.name ?? `c${String(lantern.col)}-${String(lantern.row)}`;
}

/** FNV-1a 32 bits, en hexadécimal : détecte les altérations accidentelles (pas une signature). */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createNewSave(
  levelId: string,
  now: number,
  settings: SaveData['settings'] = {
    controls: { ...DEFAULT_CONTROL_SETTINGS },
    display: { ...DEFAULT_DISPLAY_SETTINGS },
    audio: { ...DEFAULT_AUDIO_SETTINGS },
  },
): SaveData {
  return {
    version: SAVE_VERSION,
    savedAt: now,
    checkpoint: { levelId, checkpointId: null },
    activatedCheckpoints: [],
    settings: {
      controls: { ...settings.controls },
      display: { ...settings.display },
      audio: { ...settings.audio },
    },
    progression: {
      abilities: [],
      collectibles: [],
      seenCollectibles: [],
      memories: [],
      mapRevealed: [],
    },
    story: { flags: [] },
    stats: createStats(),
  };
}

/**
 * Migration depuis les réglages stockés avant la sauvegarde (D-13, D-18 : `localStorage`). Des textes
 * absents ou invalides donnent les valeurs par défaut.
 */
export function migrateLegacySettings(
  controlsText: string | null,
  displayText: string | null,
): SaveData['settings'] {
  return {
    controls: parseControlSettings(controlsText),
    display: parseDisplaySettings(displayText),
    audio: { ...DEFAULT_AUDIO_SETTINGS },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_LIST_LENGTH) {
    return null;
  }
  const list: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0 || item.length > 2 * MAX_ID_LENGTH) {
      return null;
    }
    list.push(item);
  }
  return list;
}

/**
 * Validation stricte de la structure (un seul défaut rejette tout) ; les réglages, eux, sont
 * seulement bornés (un réglage hors bornes ne doit pas faire perdre la progression).
 */
export function validateSaveData(raw: unknown): SaveData | null {
  if (!isRecord(raw) || raw['version'] !== SAVE_VERSION) {
    return null;
  }
  const savedAt = raw['savedAt'];
  const checkpoint = raw['checkpoint'];
  const settings = raw['settings'];
  const progression = raw['progression'];
  if (typeof savedAt !== 'number' || !Number.isFinite(savedAt) || savedAt < 0) {
    return null;
  }
  if (!isRecord(checkpoint) || !isId(checkpoint['levelId'])) {
    return null;
  }
  const cp = checkpoint['checkpointId'];
  if (cp !== null && !isId(cp)) {
    return null;
  }
  const activated = stringList(raw['activatedCheckpoints']);
  if (!activated || !isRecord(settings) || !isRecord(progression)) {
    return null;
  }
  const story = raw['story'];
  const flags = isRecord(story) ? stringList(story['flags']) : null;
  if (!flags) {
    return null;
  }
  const abilities = stringList(progression['abilities']);
  const collectibles = stringList(progression['collectibles']);
  const memories = stringList(progression['memories']);
  const mapRevealed = stringList(progression['mapRevealed']);
  const seen = progression['seenCollectibles'];
  const seenCollectibles = seen === undefined ? [] : stringList(seen);
  if (!abilities || !collectibles || !seenCollectibles || !memories || !mapRevealed) {
    return null;
  }
  return {
    version: SAVE_VERSION,
    savedAt,
    checkpoint: { levelId: checkpoint['levelId'], checkpointId: cp },
    activatedCheckpoints: activated,
    settings: {
      controls: sanitizeControlSettings(settings['controls']),
      display: sanitizeDisplaySettings(settings['display']),
      audio: sanitizeAudioSettings(settings['audio']),
    },
    progression: { abilities, collectibles, seenCollectibles, memories, mapRevealed },
    story: { flags },
    stats: sanitizeStats(raw['stats']),
  };
}

/**
 * Migrations (D-22) : contenu d'une version antérieure → contenu de la version courante, avant
 * validation. Une donnée inattendue est laissée telle quelle : la validation la refusera.
 */
export function migrateSaveData(raw: unknown): unknown {
  if (!isRecord(raw) || typeof raw['version'] !== 'number') {
    return raw;
  }
  let data = raw;
  if (data['version'] === 1) {
    // v1 → v2 (D-31) : une partie commencée avant l'histoire a déjà « vécu » le prologue.
    data = { ...data, version: 2, story: { flags: [...LEGACY_STORY_FLAGS] } };
  }
  if (data['version'] === 2) {
    // v2 → v3 (D-152) : les lanternes, repérées par leur tuile, ont un nom fixe. Aucune vraie partie
    // n'existait : le point de retour revient au départ de sa salle, les lanternes à rallumer.
    const checkpoint = data['checkpoint'];
    data = {
      ...data,
      version: 3,
      checkpoint: isRecord(checkpoint) ? { ...checkpoint, checkpointId: null } : checkpoint,
      activatedCheckpoints: [],
    };
  }
  return data;
}

export function encodeRecord(data: Readonly<SaveData>): SaveRecord {
  const payload = JSON.stringify(data);
  return { format: RECORD_FORMAT, version: SAVE_VERSION, checksum: checksum(payload), payload };
}

/** Enregistrement → texte stocké. */
export function serializeSave(data: Readonly<SaveData>): string {
  return JSON.stringify(encodeRecord(data));
}

/**
 * Contenu (après vérification de la somme de contrôle) → données valides : une version antérieure
 * est d'abord migrée (`migrateSaveData`).
 */
function decodePayload(version: number, payload: string): DecodeResult {
  if (version > SAVE_VERSION) {
    return { ok: false, problem: 'future-version' };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return { ok: false, problem: 'unreadable' };
  }
  const data = validateSaveData(migrateSaveData(raw));
  return data ? { ok: true, data } : { ok: false, problem: 'schema' };
}

/** Texte stocké → données valides, ou la raison du refus. Ne lève jamais d'exception. */
export function deserializeSave(text: string | null): DecodeResult {
  if (text === null) {
    return { ok: false, problem: 'unreadable' };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, problem: 'unreadable' };
  }
  if (
    !isRecord(raw) ||
    raw['format'] !== RECORD_FORMAT ||
    typeof raw['version'] !== 'number' ||
    typeof raw['checksum'] !== 'string' ||
    typeof raw['payload'] !== 'string'
  ) {
    return { ok: false, problem: 'format' };
  }
  if (checksum(raw['payload']) !== raw['checksum']) {
    return { ok: false, problem: 'checksum' };
  }
  return decodePayload(raw['version'], raw['payload']);
}

function toBase64Url(text: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string | null {
  if (!/^[A-Za-z0-9_-]*$/.test(code)) {
    return null;
  }
  try {
    const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Code de sauvegarde à copier (export, D-22) : `MARIA1.<contenu base64url>.<somme de contrôle>`.
 * Recopiable à la main, sans caractère ambigu pour une URL ou un message.
 */
export function encodeSaveCode(data: Readonly<SaveData>): string {
  const record = encodeRecord(data);
  return `${CODE_PREFIX}.${toBase64Url(record.payload)}.${record.checksum}`;
}

/** Code collé → données valides, ou la raison du refus (espaces et retours à la ligne ignorés). */
export function decodeSaveCode(code: string): DecodeResult {
  const parts = code.replace(/\s+/g, '').split('.');
  if (parts.length !== 3 || parts[0] !== CODE_PREFIX) {
    return { ok: false, problem: 'format' };
  }
  const payload = fromBase64Url(parts[1] ?? '');
  if (payload === null) {
    return { ok: false, problem: 'unreadable' };
  }
  if (checksum(payload) !== parts[2]) {
    return { ok: false, problem: 'checksum' };
  }
  // Le code ne porte pas de version à part : celle du contenu fait foi (migration comprise).
  let version = SAVE_VERSION;
  try {
    const raw: unknown = JSON.parse(payload);
    if (isRecord(raw) && typeof raw['version'] === 'number') {
      version = raw['version'];
    }
  } catch {
    return { ok: false, problem: 'unreadable' };
  }
  return decodePayload(version, payload);
}

/** Message lisible pour un refus (interface en français). */
export const SAVE_PROBLEM_LABEL: Readonly<Record<SaveProblem, string>> = {
  unreadable: 'illisible ou incomplète',
  format: "n'est pas une sauvegarde de MARIA",
  checksum: 'abîmée ou modifiée',
  'future-version': "d'une version plus récente du jeu",
  schema: 'au contenu invalide',
};
