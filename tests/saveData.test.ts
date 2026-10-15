import { describe, expect, it } from 'vitest';
import {
  checkpointId,
  checksum,
  createNewSave,
  decodeSaveCode,
  deserializeSave,
  encodeSaveCode,
  legacySaveSettings,
  migrateSaveData,
  serializeSave,
  validateSaveData,
  type SaveData,
} from '../src/core/save/saveData';
import { LEGACY_STORY_FLAGS } from '../src/config/story';

function sample(): SaveData {
  const data = createNewSave('premiers-pas', 1_700_000_000_000);
  data.checkpoint = { levelId: 'kitchen', checkpointId: 'kitchen-counter' };
  data.activatedCheckpoints = ['kitchen:kitchen-counter', 'bedroom:bedroom-toybox'];
  data.story.flags = ['evening.played'];
  return data;
}

describe('saveData', () => {
  it('relit exactement ce qui a été écrit', () => {
    const data = sample();
    const result = deserializeSave(serializeSave(data));
    expect(result).toEqual({ ok: true, data });
  });

  it('détecte un contenu modifié, tronqué ou étranger', () => {
    const text = serializeSave(sample());
    const record = JSON.parse(text) as { payload: string };
    record.payload = record.payload.replace('kitchen-counter', 'kitchen-sink');
    expect(deserializeSave(JSON.stringify(record))).toEqual({ ok: false, problem: 'checksum' });
    expect(deserializeSave(text.slice(0, text.length - 5))).toEqual({
      ok: false,
      problem: 'unreadable',
    });
    expect(deserializeSave('{"hello":1}')).toEqual({ ok: false, problem: 'format' });
    expect(deserializeSave(null)).toEqual({ ok: false, problem: 'unreadable' });
  });

  it('refuse une version plus récente et un contenu hors schéma (même avec la bonne somme)', () => {
    const data = sample();
    const future = JSON.parse(serializeSave(data)) as { version: number };
    future.version = 99;
    expect(deserializeSave(JSON.stringify(future))).toEqual({
      ok: false,
      problem: 'future-version',
    });
    const payload = JSON.stringify({ ...data, activatedCheckpoints: 'tous' });
    const bad = { format: 'maria-save', version: 1, checksum: checksum(payload), payload };
    expect(deserializeSave(JSON.stringify(bad))).toEqual({ ok: false, problem: 'schema' });
  });

  it('valide strictement la structure', () => {
    const data = sample();
    expect(validateSaveData({ ...data, savedAt: -1 })).toBeNull();
    expect(
      validateSaveData({ ...data, checkpoint: { levelId: '', checkpointId: null } }),
    ).toBeNull();
    expect(
      validateSaveData({ ...data, progression: { ...data.progression, abilities: [3] } }),
    ).toBeNull();
    expect(validateSaveData({ ...data, version: 3 })).toBeNull();
    expect(validateSaveData({ ...data, version: 5 })).toBeNull();
    expect(validateSaveData({ ...data, story: undefined })).toBeNull();
    expect(validateSaveData({ ...data, story: { flags: [''] } })).toBeNull();
    // Des réglages restés dans le contenu (D-184) sont ignorés.
    const odd = validateSaveData({ ...data, settings: { controls: 'n’importe quoi' } });
    expect(odd).toEqual(data);
  });

  it('migre une sauvegarde de la version 3 (D-184) : les réglages sortent de la partie', () => {
    const current = sample();
    const settings = {
      controls: { buttonScale: 1.2, opacity: 0.4 },
      display: { renderMode: 'screen' },
      audio: { volume: 0.25, muted: true, sfxVolume: 0.4 },
    };
    const payload = JSON.stringify({ ...current, version: 3, settings });
    const text = JSON.stringify({
      format: 'maria-save',
      version: 3,
      checksum: checksum(payload),
      payload,
    });
    expect(deserializeSave(text)).toEqual({ ok: true, data: current });
    // Les réglages de l'ancienne sauvegarde deviennent ceux de l'appareil.
    expect(legacySaveSettings(text)).toMatchObject({
      controls: { buttonScale: 1.2, opacity: 0.4 },
      display: { renderMode: 'screen' },
      audio: { volume: 0.25, muted: true, sfxVolume: 0.4 },
    });
    expect(legacySaveSettings(text.replace('kitchen', 'cuisine'))).toBeNull();
    expect(legacySaveSettings(serializeSave(current))).toBeNull();
    expect(legacySaveSettings(null)).toBeNull();
    // Un code exporté par la version 3 s'importe encore.
    const bytes = new TextEncoder().encode(payload);
    const base64 = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeSaveCode(`MARIA1.${base64}.${checksum(payload)}`)).toEqual({
      ok: true,
      data: current,
    });
  });

  it('les coquilles vues (D-148) : gardées, vides dans une sauvegarde plus ancienne', () => {
    const data = sample();
    data.progression.seenCollectibles = ['attic-ridge'];
    expect(deserializeSave(serializeSave(data))).toMatchObject({
      ok: true,
      data: { progression: { seenCollectibles: ['attic-ridge'] } },
    });
    const older: Partial<SaveData['progression']> = { ...data.progression };
    delete older.seenCollectibles;
    expect(validateSaveData({ ...data, progression: older })?.progression.seenCollectibles).toEqual(
      [],
    );
    expect(
      validateSaveData({ ...data, progression: { ...older, seenCollectibles: [3] } }),
    ).toBeNull();
  });

  it('les trésors vus (D-160) : gardés, vides dans une sauvegarde plus ancienne', () => {
    const data = sample();
    data.progression.seenTreasures = ['ticket'];
    expect(deserializeSave(serializeSave(data))).toMatchObject({
      ok: true,
      data: { progression: { seenTreasures: ['ticket'] } },
    });
    const older: Partial<SaveData['progression']> = { ...data.progression };
    delete older.seenTreasures;
    expect(validateSaveData({ ...data, progression: older })?.progression.seenTreasures).toEqual(
      [],
    );
    expect(validateSaveData({ ...data, progression: { ...older, seenTreasures: [3] } })).toBeNull();
  });

  it('exporte et réimporte un code de sauvegarde, et refuse un code abîmé', () => {
    const data = sample();
    const code = encodeSaveCode(data);
    expect(code).toMatch(/^MARIA1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    expect(decodeSaveCode(code)).toEqual({ ok: true, data });
    // Collé avec des espaces et un retour à la ligne : accepté.
    expect(decodeSaveCode(` ${code.slice(0, 20)}\n${code.slice(20)} `)).toEqual({ ok: true, data });
    // Un caractère changé, tronqué, ou autre chose : refusé.
    const parts = code.split('.');
    const middle = parts[1] ?? '';
    const flipped = `${parts[0] ?? ''}.${(middle[5] === 'A' ? 'B' : 'A') + middle.slice(1)}.${parts[2] ?? ''}`;
    expect(decodeSaveCode(flipped).ok).toBe(false);
    expect(decodeSaveCode(code.slice(0, -3)).ok).toBe(false);
    expect(decodeSaveCode('bonjour')).toEqual({ ok: false, problem: 'format' });
  });

  it('migre une sauvegarde et un code de la version 1 (D-31) : prologue considéré comme vécu', () => {
    const current = sample();
    const v1: Record<string, unknown> = { ...current, version: 1 };
    delete v1['story'];
    const payload = JSON.stringify(v1);
    const record = { format: 'maria-save', version: 1, checksum: checksum(payload), payload };
    // Puis v2 → v3 (D-152) : les lanternes repérées par leur tuile sont oubliées.
    const expected: SaveData = {
      ...current,
      checkpoint: { levelId: 'kitchen', checkpointId: null },
      activatedCheckpoints: [],
      story: { flags: [...LEGACY_STORY_FLAGS] },
    };
    expect(deserializeSave(JSON.stringify(record))).toEqual({ ok: true, data: expected });
    const bytes = new TextEncoder().encode(payload);
    const base64 = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeSaveCode(`MARIA1.${base64}.${checksum(payload)}`)).toEqual({
      ok: true,
      data: expected,
    });
    expect(migrateSaveData(v1)).toMatchObject({ version: 4 });
    expect(migrateSaveData('texte')).toBe('texte');
  });

  it('migre une sauvegarde de la version 2 (D-152) : point de retour au départ de la salle', () => {
    const current = sample();
    const v2 = {
      ...current,
      version: 2,
      checkpoint: { levelId: 'kitchen', checkpointId: 'c46-16' },
      activatedCheckpoints: ['kitchen:c46-16'],
    };
    const payload = JSON.stringify(v2);
    const record = { format: 'maria-save', version: 2, checksum: checksum(payload), payload };
    expect(deserializeSave(JSON.stringify(record))).toEqual({
      ok: true,
      data: {
        ...current,
        checkpoint: { levelId: 'kitchen', checkpointId: null },
        activatedCheckpoints: [],
      },
    });
  });

  it("l'identifiant d'une lanterne : son nom fixe (D-152), sinon sa tuile (parcours d'essai)", () => {
    expect(checkpointId({ type: 'checkpoint', col: 4, row: 7, name: 'hall-clock' })).toBe(
      'hall-clock',
    );
    expect(checkpointId({ type: 'checkpoint', col: 4, row: 7 })).toBe('c4-7');
  });

  it('une nouvelle partie commence avant le prologue', () => {
    expect(createNewSave('bedroom', 0).story).toEqual({ flags: [] });
  });

  it('calcule une somme de contrôle stable', () => {
    expect(checksum('')).toBe('811c9dc5');
    expect(checksum('MARIA')).toBe(checksum('MARIA'));
    expect(checksum('MARIA')).not.toBe(checksum('MARIB'));
  });
});
