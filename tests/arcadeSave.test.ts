import { describe, expect, it } from 'vitest';
import { ARCADE, ArcadeGameId, ArcadeMode } from '../src/config/arcade';
import {
  arcadeRecord,
  createArcade,
  sanitizeArcade,
  submitArcadeScore,
} from '../src/core/save/arcade';
import { SaveManager } from '../src/core/save/SaveManager';
import { SaveSession } from '../src/core/save/SaveSession';
import { MemorySaveStorage } from '../src/core/save/SaveStorage';
import {
  createNewSave,
  decodeSaveCode,
  deserializeSave,
  encodeSaveCode,
  serializeSave,
  validateSaveData,
} from '../src/core/save/saveData';

/** La console dans la sauvegarde (D-166) : les records et les jeux vus, sans migration. */
describe('la console dans la sauvegarde', () => {
  it('un record par jeu et par mode, seulement s’il est battu', () => {
    const arcade = createArcade();
    expect(arcadeRecord(arcade, ArcadeGameId.Cables, ArcadeMode.Levels)).toBe(0);
    expect(submitArcadeScore(arcade, ArcadeGameId.Cables, ArcadeMode.Levels, 42.8)).toBe(true);
    expect(submitArcadeScore(arcade, ArcadeGameId.Cables, ArcadeMode.Levels, 42)).toBe(false);
    expect(submitArcadeScore(arcade, ArcadeGameId.Cables, ArcadeMode.Levels, 30)).toBe(false);
    expect(submitArcadeScore(arcade, ArcadeGameId.Cables, ArcadeMode.Endless, 12)).toBe(true);
    expect(submitArcadeScore(arcade, ArcadeGameId.Jumps, ArcadeMode.Levels, 0)).toBe(false);
    expect(arcade.records).toEqual({ cables: { levels: 42, endless: 12 } });
    expect(arcadeRecord(arcade, ArcadeGameId.Cables, ArcadeMode.Endless)).toBe(12);
  });

  it('lue sans jamais refuser : jeux inconnus écartés, scores bornés', () => {
    expect(sanitizeArcade(undefined)).toEqual(createArcade());
    expect(sanitizeArcade(42)).toEqual(createArcade());
    expect(
      sanitizeArcade({
        records: {
          cables: { levels: 12.7, endless: -3 },
          jumps: { levels: Number.NaN, endless: 1e12 },
          inconnu: { levels: 5, endless: 5 },
          monster: 'abîmé',
        },
        seen: ['cables', 'cables', 'inconnu', 3, 'wind'],
      }),
    ).toEqual({
      records: {
        cables: { levels: 12, endless: 0 },
        jumps: { levels: 0, endless: ARCADE.maxRecordMeters },
      },
      seen: ['cables', 'wind'],
    });
  });

  it('absente d’une sauvegarde plus ancienne, gardée par l’écriture et le code', () => {
    const data = createNewSave('bedroom', 0);
    submitArcadeScore(data.arcade, ArcadeGameId.Cables, ArcadeMode.Levels, 37);
    data.arcade.seen.push(ArcadeGameId.Cables);
    const reloaded = deserializeSave(serializeSave(data));
    expect(reloaded.ok && reloaded.data.arcade).toEqual(data.arcade);
    const code = decodeSaveCode(encodeSaveCode(data));
    expect(code.ok && code.data.arcade).toEqual(data.arcade);
    const older: Record<string, unknown> = { ...data };
    delete older['arcade'];
    expect(validateSaveData(older)?.arcade).toEqual(createArcade());
    // Des records abîmés ne font pas perdre la partie.
    expect(validateSaveData({ ...data, arcade: 'abîmé' })?.arcade).toEqual(createArcade());
  });

  it('la partie : écrite seulement pour un nouveau record', async () => {
    let clock = 0;
    const manager = new SaveManager(new MemorySaveStorage());
    const session = new SaveSession(manager, createNewSave('bedroom', 0), () => ++clock);
    expect(await session.recordArcadeScore(ArcadeGameId.Cables, ArcadeMode.Levels, 20)).toBe(true);
    expect(clock).toBe(1);
    expect(await session.recordArcadeScore(ArcadeGameId.Cables, ArcadeMode.Levels, 10)).toBe(false);
    expect(clock).toBe(1);
    expect((await manager.load()).data?.arcade.records).toEqual({
      cables: { levels: 20, endless: 0 },
    });
  });
});
