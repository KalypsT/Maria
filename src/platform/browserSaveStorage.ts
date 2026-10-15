import {
  MemorySaveLibraryStorage,
  type KeyWrite,
  type SaveLibraryStorage,
  type SaveSlots,
} from '../core/save/SaveStorage';

const DB_NAME = 'maria';
/** Version 2 (D-184) : le magasin des parties s'ajoute ; celui de l'ancienne sauvegarde reste. */
const DB_VERSION = 2;
/** L'ancienne sauvegarde unique (D-22), lue seulement pour la reprise. */
const LEGACY_STORE = 'save';
const STORE = 'library';
const LEGACY_MAIN_KEY = 'main';
const LEGACY_PREVIOUS_KEY = 'previous';
const LOCAL_LEGACY_MAIN = 'maria.save.main';
const LOCAL_LEGACY_PREVIOUS = 'maria.save.previous';
const LOCAL_PREFIX = 'maria.library.';
/** Au-delà, IndexedDB est jugé indisponible (certains navigateurs ne répondent jamais). */
const OPEN_TIMEOUT_MS = 3000;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB : requête en échec'));
    };
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB : transaction en échec'));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error('IndexedDB : transaction annulée'));
    };
  });
}

function asText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** IndexedDB (D-22, D-184) : plusieurs clés écrites dans une seule transaction (atomique). */
export class IndexedDbSaveStorage implements SaveLibraryStorage {
  readonly kind = 'IndexedDB';

  private constructor(private readonly db: IDBDatabase) {
    // Une version plus récente du jeu ouverte ailleurs : céder la base plutôt que la bloquer.
    db.onversionchange = () => {
      db.close();
    };
  }

  static open(): Promise<IndexedDbSaveStorage> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error('IndexedDB : ouverture trop longue'));
      }, OPEN_TIMEOUT_MS);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => {
        window.clearTimeout(timer);
        resolve(new IndexedDbSaveStorage(request.result));
      };
      request.onerror = () => {
        window.clearTimeout(timer);
        reject(request.error ?? new Error('IndexedDB : ouverture impossible'));
      };
      // Bloquée par un onglet de l'ancienne version : on attend qu'il se ferme, jusqu'au délai.
    });
  }

  async get(keys: readonly string[]): Promise<(string | null)[]> {
    const store = this.db.transaction(STORE, 'readonly').objectStore(STORE);
    const values = await Promise.all(keys.map((key) => requestResult<unknown>(store.get(key))));
    return values.map(asText);
  }

  set(writes: readonly KeyWrite[]): Promise<void> {
    const tx = this.db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const [key, value] of writes) {
      if (value === null) {
        store.delete(key);
      } else {
        store.put(value, key);
      }
    }
    return transactionDone(tx);
  }

  async readLegacy(): Promise<SaveSlots> {
    if (!this.db.objectStoreNames.contains(LEGACY_STORE)) {
      return { main: null, previous: null };
    }
    const store = this.db.transaction(LEGACY_STORE, 'readonly').objectStore(LEGACY_STORE);
    const [main, previous] = await Promise.all([
      requestResult<unknown>(store.get(LEGACY_MAIN_KEY)),
      requestResult<unknown>(store.get(LEGACY_PREVIOUS_KEY)),
    ]);
    return { main: asText(main), previous: asText(previous) };
  }
}

/**
 * Repli sur localStorage (IndexedDB indisponible, navigation privée…). Pas de transaction : les clés
 * sont écrites dans l'ordre donné, pour qu'une interruption laisse au moins un état valide.
 */
export class LocalSaveStorage implements SaveLibraryStorage {
  readonly kind = 'localStorage';

  get(keys: readonly string[]): Promise<(string | null)[]> {
    return Promise.resolve(keys.map((key) => localStorage.getItem(LOCAL_PREFIX + key)));
  }

  set(writes: readonly KeyWrite[]): Promise<void> {
    try {
      for (const [key, value] of writes) {
        if (value === null) {
          localStorage.removeItem(LOCAL_PREFIX + key);
        } else {
          localStorage.setItem(LOCAL_PREFIX + key, value);
        }
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  readLegacy(): Promise<SaveSlots> {
    return Promise.resolve({
      main: localStorage.getItem(LOCAL_LEGACY_MAIN),
      previous: localStorage.getItem(LOCAL_LEGACY_PREVIOUS),
    });
  }

  /** Vrai si localStorage accepte une écriture. */
  static available(): boolean {
    try {
      const key = 'maria.save.test';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}

/** Meilleur stockage disponible : IndexedDB, sinon localStorage, sinon mémoire (session seule). */
export async function openBrowserSaveStorage(): Promise<SaveLibraryStorage> {
  if (typeof indexedDB !== 'undefined') {
    try {
      return await IndexedDbSaveStorage.open();
    } catch {
      // Repli ci-dessous.
    }
  }
  if (LocalSaveStorage.available()) {
    return new LocalSaveStorage();
  }
  return new MemorySaveLibraryStorage();
}

/**
 * Demande au navigateur de ne pas effacer le stockage du jeu (D-22). Retourne null si l'API
 * n'existe pas. Sans effet sur iOS hors installation : le code de sauvegarde reste la parade.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') {
      return null;
    }
    if (await navigator.storage.persisted()) {
      return true;
    }
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}
