import { describe, expect, it } from 'vitest';
import { openSaveStorage, StorageWaitError } from '../src/core/save/openStorage';
import { MemorySaveLibraryStorage, type SaveLibraryStorage } from '../src/core/save/SaveStorage';

function named(kind: string): SaveLibraryStorage {
  return Object.assign(new MemorySaveLibraryStorage(), { kind });
}

const local = () => named('localStorage');
const memory = () => named('mémoire');

describe('le stockage des parties à l’ouverture (D-186)', () => {
  it('IndexedDB quand il répond', async () => {
    const opening = await openSaveStorage({
      indexedDb: () => Promise.resolve(named('IndexedDB')),
      local,
      memory,
    });
    expect(opening.ok && opening.storage.kind).toBe('IndexedDB');
  });

  it('IndexedDB bloqué ou trop long : pas de repli, la raison est rendue', async () => {
    for (const reason of ['blocked', 'timeout'] as const) {
      const opening = await openSaveStorage({
        indexedDb: () => Promise.reject(new StorageWaitError(reason)),
        local,
        memory,
      });
      expect(opening).toEqual({ ok: false, reason });
    }
  });

  it('IndexedDB absent ou refusé durablement : localStorage, sinon la mémoire', async () => {
    const absent = await openSaveStorage({ indexedDb: null, local, memory });
    expect(absent.ok && absent.storage.kind).toBe('localStorage');
    const refused = await openSaveStorage({
      indexedDb: () => Promise.reject(new Error('SecurityError')),
      local: () => null,
      memory,
    });
    expect(refused.ok && refused.storage.kind).toBe('mémoire');
  });
});
