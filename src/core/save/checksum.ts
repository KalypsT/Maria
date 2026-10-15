/** FNV-1a 32 bits, en hexadécimal : détecte les altérations accidentelles (pas une signature). */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

export type DecodeResult<T> = { ok: true; data: T } | { ok: false; problem: SaveProblem };

/**
 * Texte stocké `{ format, version, checksum, payload }` → version et contenu dont la somme de
 * contrôle est juste, ou la raison du refus. Ne lève jamais d'exception.
 */
export function readRecord(
  text: string | null,
  format: string,
): { ok: true; version: number; payload: string } | { ok: false; problem: SaveProblem } {
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
    raw['format'] !== format ||
    typeof raw['version'] !== 'number' ||
    typeof raw['checksum'] !== 'string' ||
    typeof raw['payload'] !== 'string'
  ) {
    return { ok: false, problem: 'format' };
  }
  if (checksum(raw['payload']) !== raw['checksum']) {
    return { ok: false, problem: 'checksum' };
  }
  return { ok: true, version: raw['version'], payload: raw['payload'] };
}

/** Contenu → texte stocké, avec sa somme de contrôle. */
export function writeRecord(format: string, version: number, payload: string): string {
  return JSON.stringify({ format, version, checksum: checksum(payload), payload });
}
