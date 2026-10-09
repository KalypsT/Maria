import { describe, expect, it } from 'vitest';
import { STATS } from '../src/config/stats';
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
import {
  addFaint,
  addHint,
  addPlayTime,
  createStats,
  formatPlayTime,
  sanitizeStats,
  statsByPlace,
  totalFaints,
} from '../src/core/save/stats';

describe('les stats (D-153)', () => {
  it('le temps de jeu, les évanouissements et le fil discret, salle par salle', () => {
    const stats = createStats();
    addPlayTime(stats, 'kitchen', 1500);
    addPlayTime(stats, 'kitchen', 500);
    addPlayTime(stats, 'garden-tree', 3000);
    addPlayTime(stats, 'kitchen', -10);
    addPlayTime(stats, 'kitchen', Number.NaN);
    addFaint(stats, 'garden-tree');
    addFaint(stats, 'garden-tree');
    addFaint(stats, 'kitchen');
    addHint(stats, 'kitchen');
    expect(stats).toEqual({
      playMs: 5000,
      rooms: {
        kitchen: { ms: 2000, faints: 1, hints: 1 },
        'garden-tree': { ms: 3000, faints: 2, hints: 0 },
      },
    });
    expect(totalFaints(stats)).toBe(3);
    expect(statsByPlace(stats, (room) => (room.startsWith('garden') ? 'garden' : 'house'))).toEqual(
      [
        { place: 'house', ms: 2000, faints: 1, hints: 1 },
        { place: 'garden', ms: 3000, faints: 2, hints: 0 },
      ],
    );
  });

  it('jamais une clé dangereuse ni un nombre sans fin', () => {
    const stats = createStats();
    addFaint(stats, '__proto__');
    addHint(stats, 'une salle');
    expect(stats.rooms).toEqual({});
    expect(Object.getPrototypeOf(stats.rooms)).toBe(Object.prototype);
    addPlayTime(stats, 'kitchen', STATS.maxCount * 2);
    expect(stats.playMs).toBe(STATS.maxCount);
    expect(stats.rooms['kitchen']?.ms).toBe(STATS.maxCount);
  });

  it('lues dans une sauvegarde : bornées, jamais refusées', () => {
    expect(sanitizeStats(undefined)).toEqual(createStats());
    expect(sanitizeStats('texte')).toEqual(createStats());
    expect(sanitizeStats({ playMs: -5, rooms: [] })).toEqual(createStats());
    expect(
      sanitizeStats({
        playMs: 1234.9,
        rooms: {
          kitchen: { ms: 10, faints: 2, hints: Infinity },
          hall2: { ms: 'x' },
          'mauvaise salle': { ms: 1 },
          constructor: { ms: 1 },
          hall: 'rien',
        },
      }),
    ).toEqual({
      playMs: 1234,
      rooms: {
        kitchen: { ms: 10, faints: 2, hints: 0 },
        hall2: { ms: 0, faints: 0, hints: 0 },
      },
    });
    const many: Record<string, unknown> = {};
    for (let i = 0; i < STATS.maxRooms + 10; i++) {
      many[`r${String(i)}`] = { ms: 1 };
    }
    expect(Object.keys(sanitizeStats({ rooms: many }).rooms)).toHaveLength(STATS.maxRooms);
  });

  it('dans la sauvegarde : absentes d’une sauvegarde plus ancienne, gardées par le code', () => {
    const data = createNewSave('bedroom', 0);
    addPlayTime(data.stats, 'bedroom', 90_000);
    addFaint(data.stats, 'bedroom');
    const reloaded = deserializeSave(serializeSave(data));
    expect(reloaded.ok && reloaded.data.stats).toEqual(data.stats);
    const code = decodeSaveCode(encodeSaveCode(data));
    expect(code.ok && code.data.stats).toEqual(data.stats);
    const older: Record<string, unknown> = { ...data };
    delete older['stats'];
    expect(validateSaveData(older)?.stats).toEqual(createStats());
    // Des stats abîmées ne font pas perdre la partie.
    expect(validateSaveData({ ...data, stats: 42 })?.stats).toEqual(createStats());
  });

  it('la partie : le temps en mémoire, l’évanouissement écrit aussitôt, la remise à zéro', async () => {
    let clock = 0;
    const manager = new SaveManager(new MemorySaveStorage());
    const session = new SaveSession(manager, createNewSave('bedroom', 0), () => ++clock);
    session.addPlayTime('bedroom', 1000);
    session.recordHint('bedroom');
    expect(clock).toBe(0);
    await session.recordFaint('bedroom');
    expect(clock).toBe(1);
    const loaded = await manager.load();
    expect(loaded.data?.stats.rooms['bedroom']).toEqual({ ms: 1000, faints: 1, hints: 1 });
    await session.resetStats();
    expect(session.data.stats).toEqual(createStats());
  });

  it('le temps lisible', () => {
    expect(formatPlayTime(0)).toBe('0 s');
    expect(formatPlayTime(42_500)).toBe('42 s');
    expect(formatPlayTime(12 * 60_000 + 5000)).toBe('12 min');
    expect(formatPlayTime(65 * 60_000)).toBe('1 h 05');
  });
});
