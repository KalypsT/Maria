/** Contenu brut des deux emplacements (texte stocké, ou null si vide). */
export interface SaveSlots {
  main: string | null;
  previous: string | null;
}

/**
 * Stockage de la sauvegarde (D-22) : deux emplacements écrits ensemble. Implémentations : IndexedDB
 * (une seule transaction), localStorage (repli), mémoire (tests, ou session seule).
 */
export interface SaveStorage {
  /** Nom affiché dans le debug (« IndexedDB », « localStorage », « mémoire »). */
  readonly kind: string;
  read(): Promise<SaveSlots>;
  /** Écrit les deux emplacements ; en cas d'échec, l'état précédent doit rester intact. */
  write(slots: SaveSlots): Promise<void>;
  clear(): Promise<void>;
}

/** Stockage en mémoire, avec pannes simulées pour les tests. */
export class MemorySaveStorage implements SaveStorage {
  readonly kind = 'mémoire';
  slots: SaveSlots = { main: null, previous: null };
  /** Prochaine écriture en échec (rien n'est écrit : écriture atomique). */
  failNextWrite = false;
  writes = 0;

  read(): Promise<SaveSlots> {
    return Promise.resolve({ ...this.slots });
  }

  write(slots: SaveSlots): Promise<void> {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      return Promise.reject(new Error('écriture interrompue (simulée)'));
    }
    this.slots = { ...slots };
    this.writes++;
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.slots = { main: null, previous: null };
    return Promise.resolve();
  }
}

/** Une écriture du stockage à clés : un texte, ou null pour effacer la clé. */
export type KeyWrite = readonly [key: string, value: string | null];

/**
 * Stockage des parties (D-184) : des textes rangés par clé (les emplacements des parties, les
 * réglages, la dernière partie jouée). Implémentations : IndexedDB (une seule transaction),
 * localStorage (repli), mémoire (tests, ou session seule).
 */
export interface SaveLibraryStorage {
  readonly kind: string;
  get(keys: readonly string[]): Promise<(string | null)[]>;
  /**
   * Écrit plusieurs clés ensemble : tout ou rien si le stockage le permet (IndexedDB), sinon dans
   * l'ordre donné (localStorage) ; en cas d'échec, ce qui n'est pas écrit reste intact.
   */
  set(writes: readonly KeyWrite[]): Promise<void>;
  /**
   * La sauvegarde unique d'avant les parties multiples, en lecture seule : jamais modifiée, elle
   * reste un filet si la nouvelle version est abandonnée.
   */
  readLegacy(): Promise<SaveSlots>;
}

/** Un emplacement (principal et précédent) dans le stockage à clés, sous un préfixe. */
export class KeyedSaveStorage implements SaveStorage {
  readonly kind: string;
  private readonly mainKey: string;
  private readonly previousKey: string;

  constructor(
    private readonly library: SaveLibraryStorage,
    prefix: string,
  ) {
    this.kind = library.kind;
    this.mainKey = `${prefix}.main`;
    this.previousKey = `${prefix}.previous`;
  }

  async read(): Promise<SaveSlots> {
    const [main = null, previous = null] = await this.library.get([this.mainKey, this.previousKey]);
    return { main, previous };
  }

  write(slots: SaveSlots): Promise<void> {
    // Le précédent d'abord : interrompu sans transaction, il reste au moins un état valide.
    return this.library.set([
      [this.previousKey, slots.previous],
      [this.mainKey, slots.main],
    ]);
  }

  clear(): Promise<void> {
    return this.write({ main: null, previous: null });
  }
}

/** Stockage à clés en mémoire, avec pannes simulées pour les tests. */
export class MemorySaveLibraryStorage implements SaveLibraryStorage {
  readonly kind = 'mémoire';
  readonly values = new Map<string, string>();
  legacy: SaveSlots = { main: null, previous: null };
  /** Prochaine écriture en échec (rien n'est écrit : écriture atomique). */
  failNextWrite = false;
  writes = 0;

  get(keys: readonly string[]): Promise<(string | null)[]> {
    return Promise.resolve(keys.map((key) => this.values.get(key) ?? null));
  }

  set(writes: readonly KeyWrite[]): Promise<void> {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      return Promise.reject(new Error('écriture interrompue (simulée)'));
    }
    for (const [key, value] of writes) {
      if (value === null) {
        this.values.delete(key);
      } else {
        this.values.set(key, value);
      }
    }
    this.writes++;
    return Promise.resolve();
  }

  readLegacy(): Promise<SaveSlots> {
    return Promise.resolve({ ...this.legacy });
  }
}
