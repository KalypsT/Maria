import { LEGACY_STORY_FLAGS } from '../../config/story';
import type { LevelEntity } from '../level/LevelData';
import { createArcade, sanitizeArcade, type ArcadeSave } from './arcade';
import { createStats, sanitizeStats, type GameStats } from './stats';
import {
  checksum,
  isRecord,
  readRecord,
  writeRecord,
  type DecodeResult as RecordDecodeResult,
  type SaveProblem,
} from './checksum';
import { sanitizeSettings, type GameSettings } from './settingsData';

export { checksum, type SaveProblem };

/**
 * Sauvegarde (décision D-22) : format versionné, validé strictement, protégé par une somme de
 * contrôle. Pur et indépendant du stockage (IndexedDB, localStorage ou mémoire).
 */
export const SAVE_VERSION = 4;
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
  /** Progression permanente : prévue, vide tant que ces systèmes n'existent pas. */
  progression: {
    abilities: string[];
    collectibles: string[];
    /**
     * Coquilles vues mais pas encore prises (D-148), dessinées en pointillés sur la carte. Absent
     * des sauvegardes plus anciennes : vide (aucune migration).
     */
    seenCollectibles: string[];
    /**
     * Trésors vus mais pas encore pris (D-160 : souvenirs, affaires de Maria, monde étrange),
     * dessinés en pointillés sur la carte. Absent des sauvegardes plus anciennes : vide (aucune
     * migration).
     */
    seenTreasures: string[];
    /**
     * Trésors et disques trouvés déjà regardés dans le sac (D-162) : les autres sont « nouveaux ».
     * Absent des sauvegardes plus anciennes : vide (aucune migration).
     */
    viewedTreasures: string[];
    memories: string[];
    mapRevealed: string[];
  };
  /** Histoire (§33, version 2) : étapes déjà vécues (drapeaux des événements). */
  story: { flags: string[] };
  /** Stats de la partie (D-153) : absentes des sauvegardes plus anciennes, à zéro (aucune migration). */
  stats: GameStats;
  /**
   * La console (D-166) : records et jeux déjà vus. Absente des sauvegardes plus anciennes : vide
   * (aucune migration).
   */
  arcade: ArcadeSave;
}

/** Enregistrement stocké : le contenu sérialisé et sa somme de contrôle. */
export interface SaveRecord {
  format: typeof RECORD_FORMAT;
  version: number;
  checksum: string;
  payload: string;
}

export type DecodeResult = RecordDecodeResult<SaveData>;

/**
 * Identifiant d'un checkpoint dans sa salle : le nom fixe de sa lanterne (`; @lantern:`, D-152). Une
 * lanterne sans nom (un parcours d'essai, qui ne sauvegarde rien) prend sa tuile.
 */
export function checkpointId(lantern: Readonly<LevelEntity>): string {
  return lantern.name ?? `c${String(lantern.col)}-${String(lantern.row)}`;
}

export function createNewSave(levelId: string, now: number): SaveData {
  return {
    version: SAVE_VERSION,
    savedAt: now,
    checkpoint: { levelId, checkpointId: null },
    activatedCheckpoints: [],
    progression: {
      abilities: [],
      collectibles: [],
      seenCollectibles: [],
      seenTreasures: [],
      viewedTreasures: [],
      memories: [],
      mapRevealed: [],
    },
    story: { flags: [] },
    stats: createStats(),
    arcade: createArcade(),
  };
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
 * Validation stricte de la structure (un seul défaut rejette tout) ; les stats et la console, elles,
 * sont seulement bornées.
 */
export function validateSaveData(raw: unknown): SaveData | null {
  if (!isRecord(raw) || raw['version'] !== SAVE_VERSION) {
    return null;
  }
  const savedAt = raw['savedAt'];
  const checkpoint = raw['checkpoint'];
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
  if (!activated || !isRecord(progression)) {
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
  const seenT = progression['seenTreasures'];
  const seenTreasures = seenT === undefined ? [] : stringList(seenT);
  const viewedT = progression['viewedTreasures'];
  const viewedTreasures = viewedT === undefined ? [] : stringList(viewedT);
  if (
    !abilities ||
    !collectibles ||
    !seenCollectibles ||
    !seenTreasures ||
    !viewedTreasures ||
    !memories ||
    !mapRevealed
  ) {
    return null;
  }
  return {
    version: SAVE_VERSION,
    savedAt,
    checkpoint: { levelId: checkpoint['levelId'], checkpointId: cp },
    activatedCheckpoints: activated,
    progression: {
      abilities,
      collectibles,
      seenCollectibles,
      seenTreasures,
      viewedTreasures,
      memories,
      mapRevealed,
    },
    story: { flags },
    stats: sanitizeStats(raw['stats']),
    arcade: sanitizeArcade(raw['arcade']),
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
  if (data['version'] === 3) {
    // v3 → v4 (D-184) : les réglages sont communs à toutes les parties, stockés à part.
    data = { ...data, version: 4 };
    delete data['settings'];
  }
  return data;
}

/**
 * Les réglages d'une sauvegarde d'avant les parties multiples (versions 1 à 3, D-184), pour en faire
 * les réglages de l'appareil. Null si le texte n'est pas une sauvegarde intacte ou n'en a pas.
 */
export function legacySaveSettings(text: string | null): GameSettings | null {
  const record = readRecord(text, RECORD_FORMAT);
  if (!record.ok || record.version > 3) {
    return null;
  }
  try {
    const raw: unknown = JSON.parse(record.payload);
    return isRecord(raw) && isRecord(raw['settings']) ? sanitizeSettings(raw['settings']) : null;
  } catch {
    return null;
  }
}

export function encodeRecord(data: Readonly<SaveData>): SaveRecord {
  const payload = JSON.stringify(data);
  return { format: RECORD_FORMAT, version: SAVE_VERSION, checksum: checksum(payload), payload };
}

/** Enregistrement → texte stocké. */
export function serializeSave(data: Readonly<SaveData>): string {
  return writeRecord(RECORD_FORMAT, SAVE_VERSION, JSON.stringify(data));
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
  const record = readRecord(text, RECORD_FORMAT);
  return record.ok ? decodePayload(record.version, record.payload) : record;
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
