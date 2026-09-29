import { MemorySaveStorage, type SaveSlots, type SaveStorage } from '../core/save/SaveStorage';

const DB_NAME = 'maria';
const DB_VERSION = 1;
const STORE = 'save';
const MAIN_KEY = 'main';
const PREVIOUS_KEY = 'previous';
const LOCAL_MAIN = 'maria.save.main';
const LOCAL_PREVIOUS = 'maria.save.previous';
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

/** IndexedDB (D-22) : les deux emplacements sont écrits dans une seule transaction (atomique). */
export class IndexedDbSaveStorage implements SaveStorage {
  readonly kind = 'IndexedDB';

  private constructor(private readonly db: IDBDatabase) {}

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
      request.onblocked = () => {
        window.clearTimeout(timer);
        reject(new Error('IndexedDB : ouverture bloquée'));
      };
    });
  }

  async read(): Promise<SaveSlots> {
    const store = this.db.transaction(STORE, 'readonly').objectStore(STORE);
    const [main, previous] = await Promise.all([
      requestResult<unknown>(store.get(MAIN_KEY)),
      requestResult<unknown>(store.get(PREVIOUS_KEY)),
    ]);
    return { main: asText(main), previous: asText(previous) };
  }

  write(slots: SaveSlots): Promise<void> {
    const tx = this.db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    if (slots.previous === null) {
      store.delete(PREVIOUS_KEY);
    } else {
      store.put(slots.previous, PREVIOUS_KEY);
    }
    if (slots.main === null) {
      store.delete(MAIN_KEY);
    } else {
      store.put(slots.main, MAIN_KEY);
    }
    return transactionDone(tx);
  }

  clear(): Promise<void> {
    const tx = this.db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    return transactionDone(tx);
  }
}

/**
 * Repli sur localStorage (IndexedDB indisponible, navigation privée…). Pas de transaction : le
 * précédent est écrit avant le principal, pour qu'une interruption laisse au moins un état valide.
 */
export class LocalSaveStorage implements SaveStorage {
  readonly kind = 'localStorage';

  read(): Promise<SaveSlots> {
    return Promise.resolve({
      main: localStorage.getItem(LOCAL_MAIN),
      previous: localStorage.getItem(LOCAL_PREVIOUS),
    });
  }

  write(slots: SaveSlots): Promise<void> {
    try {
      if (slots.previous === null) {
        localStorage.removeItem(LOCAL_PREVIOUS);
      } else {
        localStorage.setItem(LOCAL_PREVIOUS, slots.previous);
      }
      if (slots.main === null) {
        localStorage.removeItem(LOCAL_MAIN);
      } else {
        localStorage.setItem(LOCAL_MAIN, slots.main);
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  clear(): Promise<void> {
    localStorage.removeItem(LOCAL_MAIN);
    localStorage.removeItem(LOCAL_PREVIOUS);
    return Promise.resolve();
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
export async function openBrowserSaveStorage(): Promise<SaveStorage> {
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
  return new MemorySaveStorage();
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
