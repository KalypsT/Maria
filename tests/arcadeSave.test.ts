import { describe, expect, it } from 'vitest';
import { ARCADE, ArcadeGameId, ArcadeMode } from '../src/config/arcade';
import {
  arcadeChoosable,
  arcadeReached,
  arcadeStartTiles,
  arcadeRecord,
  createArcade,
  noteArcadeStart,
  reachArcadeLevel,
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
        reached: { jumps: 7.6, cables: 0, wind: 'abîmé', inconnu: 4, climb: 1e9 },
      }),
    ).toEqual({
      records: {
        cables: { levels: 12, endless: 0 },
        jumps: { levels: 0, endless: ARCADE.maxRecordMeters },
      },
      seen: ['cables', 'wind'],
      reached: { jumps: 7, climb: 100_000 },
      done: {},
    });
    // Une console d'avant le mode Sans fin (D-167), sans `reached`.
    expect(sanitizeArcade({ records: {}, seen: ['jumps'] })).toEqual({
      records: {},
      seen: ['jumps'],
      reached: {},
      done: {},
    });
  });

  it('absente d’une sauvegarde plus ancienne, gardée par l’écriture et le code', () => {
    const data = createNewSave('bedroom', 0);
    submitArcadeScore(data.arcade, ArcadeGameId.Cables, ArcadeMode.Levels, 37);
    data.arcade.seen.push(ArcadeGameId.Cables);
    reachArcadeLevel(data.arcade, ArcadeGameId.Cables, 6);
    noteArcadeStart(data.arcade, ArcadeGameId.Cables, 2, 40);
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

  it('le niveau le plus haut atteint en mode Niveaux (D-167), seulement s’il monte', async () => {
    const arcade = createArcade();
    expect(arcadeReached(arcade, ArcadeGameId.Jumps)).toBe(0);
    expect(reachArcadeLevel(arcade, ArcadeGameId.Jumps, 1)).toBe(true);
    expect(reachArcadeLevel(arcade, ArcadeGameId.Jumps, 4)).toBe(true);
    expect(reachArcadeLevel(arcade, ArcadeGameId.Jumps, 2)).toBe(false);
    expect(arcadeReached(arcade, ArcadeGameId.Jumps)).toBe(4);

    let clock = 0;
    const manager = new SaveManager(new MemorySaveStorage());
    const session = new SaveSession(manager, createNewSave('bedroom', 0), () => ++clock);
    await session.recordArcadeLevel(ArcadeGameId.Climb, 3);
    expect(clock).toBe(1);
    await session.recordArcadeLevel(ArcadeGameId.Climb, 3);
    await session.recordArcadeLevel(ArcadeGameId.Climb, 1);
    expect(clock).toBe(1);
    expect((await manager.load()).data?.arcade.reached).toEqual({ climb: 3 });
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

  it('choisir son niveau (D-176) : la distance au début de chaque niveau, mètres cumulés', async () => {
    const arcade = createArcade();
    const id = ArcadeGameId.Jumps;
    expect(arcadeChoosable(arcade, id)).toBe(1);
    expect(arcadeStartTiles(arcade, id, 1)).toBe(0);
    expect(arcadeStartTiles(arcade, id, 2)).toBeNull();
    // Seulement la suivante connue, et croissante.
    expect(noteArcadeStart(arcade, id, 1, 0)).toBe(false);
    expect(noteArcadeStart(arcade, id, 3, 90)).toBe(false);
    expect(noteArcadeStart(arcade, id, 2, 40)).toBe(true);
    expect(noteArcadeStart(arcade, id, 2, 40)).toBe(false);
    expect(noteArcadeStart(arcade, id, 3, 30)).toBe(false);
    expect(noteArcadeStart(arcade, id, 3, 90)).toBe(true);
    expect(arcade.done).toEqual({ jumps: [40, 90] });
    expect(arcadeStartTiles(arcade, id, 3)).toBe(90);
    // Choisi : atteint, et sa distance connue.
    reachArcadeLevel(arcade, id, 2);
    expect(arcadeChoosable(arcade, id)).toBe(2);
    reachArcadeLevel(arcade, id, 9);
    expect(arcadeChoosable(arcade, id)).toBe(3);

    // Lue jusqu'à la première valeur abîmée.
    expect(
      sanitizeArcade({
        records: {},
        seen: [],
        done: { jumps: [40, 90, 80, 120], climb: 'abîmé', cables: [0], inconnu: [5] },
      }).done,
    ).toEqual({ jumps: [40, 90] });

    let clock = 0;
    const manager = new SaveManager(new MemorySaveStorage());
    const session = new SaveSession(manager, createNewSave('bedroom', 0), () => ++clock);
    await session.recordArcadeLevel(id, 1, 0);
    await session.recordArcadeLevel(id, 2, 40);
    expect(clock).toBe(2);
    // Repartir du niveau 2 : rien de nouveau.
    await session.recordArcadeLevel(id, 2, 40);
    expect(clock).toBe(2);
    expect((await manager.load()).data?.arcade.done).toEqual({ jumps: [40] });
  });
});
