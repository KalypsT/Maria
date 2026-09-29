import { describe, expect, it } from 'vitest';
import { DEFAULT_CONTROL_SETTINGS } from '../src/config/controls';
import { DEFAULT_DISPLAY_SETTINGS } from '../src/config/display';
import {
  checkpointId,
  checksum,
  createNewSave,
  decodeSaveCode,
  deserializeSave,
  encodeSaveCode,
  migrateLegacySettings,
  migrateSaveData,
  serializeSave,
  validateSaveData,
  type SaveData,
} from '../src/core/save/saveData';
import { LEGACY_STORY_FLAGS } from '../src/config/story';
import { serializeControlSettings } from '../src/core/settings/controlSettings';
import { serializeDisplaySettings } from '../src/core/settings/displaySettings';

function sample(): SaveData {
  const data = createNewSave('premiers-pas', 1_700_000_000_000);
  data.checkpoint = { levelId: 'checkpoints', checkpointId: checkpointId(12, 7) };
  data.activatedCheckpoints = ['checkpoints:c12-7', 'checkpoints:c3-7'];
  data.settings.controls.buttonScale = 1.2;
  data.settings.display.renderMode = 'screen';
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
    record.payload = record.payload.replace('checkpoints', 'checkpointz');
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

  it('valide strictement la structure, mais borne seulement les réglages', () => {
    const data = sample();
    expect(validateSaveData({ ...data, savedAt: -1 })).toBeNull();
    expect(
      validateSaveData({ ...data, checkpoint: { levelId: '', checkpointId: null } }),
    ).toBeNull();
    expect(
      validateSaveData({ ...data, progression: { ...data.progression, abilities: [3] } }),
    ).toBeNull();
    expect(validateSaveData({ ...data, version: 3 })).toBeNull();
    expect(validateSaveData({ ...data, story: undefined })).toBeNull();
    expect(validateSaveData({ ...data, story: { flags: [''] } })).toBeNull();
    const odd = validateSaveData({
      ...data,
      settings: { controls: { buttonScale: 99 }, display: { renderMode: '8k' } },
    });
    expect(odd?.settings.controls.buttonScale).toBeLessThanOrEqual(1.5);
    expect(odd?.settings.display).toEqual(DEFAULT_DISPLAY_SETTINGS);
    expect(odd?.activatedCheckpoints).toEqual(data.activatedCheckpoints);
  });

  it('reprend les réglages stockés avant la sauvegarde (D-13, D-18)', () => {
    const migrated = migrateLegacySettings(
      serializeControlSettings({ ...DEFAULT_CONTROL_SETTINGS, opacity: 0.4 }),
      serializeDisplaySettings({ renderMode: 'screen' }),
    );
    expect(migrated.controls.opacity).toBe(0.4);
    expect(migrated.display.renderMode).toBe('screen');
    expect(migrateLegacySettings(null, 'n’importe quoi')).toEqual({
      controls: DEFAULT_CONTROL_SETTINGS,
      display: DEFAULT_DISPLAY_SETTINGS,
    });
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
    const expected: SaveData = { ...current, story: { flags: [...LEGACY_STORY_FLAGS] } };
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
    expect(migrateSaveData(v1)).toMatchObject({ version: 2 });
    expect(migrateSaveData('texte')).toBe('texte');
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
