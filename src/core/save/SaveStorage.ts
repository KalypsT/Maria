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
