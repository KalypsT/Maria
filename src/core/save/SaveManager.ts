import type { DecodeResult, SaveProblem } from './checksum';
import { deserializeSave, serializeSave, type SaveData } from './saveData';
import type { SaveStorage } from './SaveStorage';

/** Passage des données au texte stocké, et retour (une partie, ou les réglages, D-184). */
export interface SaveCodec<T> {
  serialize(data: Readonly<T>): string;
  deserialize(text: string | null): DecodeResult<T>;
}

export const SAVE_CODEC: SaveCodec<SaveData> = {
  serialize: serializeSave,
  deserialize: deserializeSave,
};

/** D'où vient la sauvegarde chargée. */
export type LoadSource = 'main' | 'previous' | 'none';

export interface LoadReport<T = SaveData> {
  data: T | null;
  source: LoadSource;
  /** Problème de l'emplacement principal, s'il a été écarté. */
  mainProblem: SaveProblem | null;
  /** Problème de l'emplacement précédent, s'il a aussi été écarté. */
  previousProblem: SaveProblem | null;
  /** Le stockage lui-même a échoué à la lecture. */
  readFailed: boolean;
}

/**
 * Sauvegarde robuste (D-22) : charge l'emplacement principal s'il est valide, sinon le précédent,
 * sinon rien (partie neuve) ; n'échoue jamais. À chaque écriture, le dernier principal **valide**
 * devient le précédent : une écriture abîmée ne peut pas effacer le dernier bon état. Les écritures
 * sont mises en file (jamais deux à la fois).
 */
export class RecordManager<T> {
  /** Texte du dernier principal valide connu (lu ou écrit). */
  private lastValidText: string | null = null;
  /** Vrai une fois l'état du stockage connu (chargé ou écrit) : sinon, relire avant d'écrire. */
  private known = false;
  private queue: Promise<void> = Promise.resolve();
  lastError: string | null = null;

  constructor(
    readonly storage: SaveStorage,
    private readonly codec: SaveCodec<T>,
  ) {}

  async load(): Promise<LoadReport<T>> {
    let slots;
    try {
      slots = await this.storage.read();
    } catch (error) {
      this.lastError = String(error);
      return {
        data: null,
        source: 'none',
        mainProblem: null,
        previousProblem: null,
        readFailed: true,
      };
    }
    const main = this.codec.deserialize(slots.main);
    this.known = true;
    if (main.ok) {
      this.lastValidText = slots.main;
      return {
        data: main.data,
        source: 'main',
        mainProblem: null,
        previousProblem: null,
        readFailed: false,
      };
    }
    const mainProblem = slots.main === null ? null : main.problem;
    const previous = this.codec.deserialize(slots.previous);
    if (previous.ok) {
      this.lastValidText = slots.previous;
      return {
        data: previous.data,
        source: 'previous',
        mainProblem,
        previousProblem: null,
        readFailed: false,
      };
    }
    return {
      data: null,
      source: 'none',
      mainProblem,
      previousProblem: slots.previous === null ? null : previous.problem,
      readFailed: false,
    };
  }

  /** Écrit la sauvegarde ; se résout même en cas d'échec (voir `lastError`). */
  save(data: Readonly<T>): Promise<void> {
    const text = this.codec.serialize(data);
    this.queue = this.queue.then(async () => {
      try {
        if (!this.known) {
          // Écriture sans chargement préalable : le principal actuel, s'il est valide, est conservé.
          const current = await this.storage.read();
          this.lastValidText = this.codec.deserialize(current.main).ok ? current.main : null;
          this.known = true;
        }
        await this.storage.write({ main: text, previous: this.lastValidText });
        this.lastValidText = text;
        this.lastError = null;
      } catch (error) {
        this.lastError = String(error);
      }
    });
    return this.queue;
  }

  /** Attend la fin des écritures en cours (avant de quitter la partie). */
  flush(): Promise<void> {
    return this.queue;
  }

  /** Efface tout (nouvelle partie volontaire). */
  async clear(): Promise<void> {
    await this.queue;
    await this.storage.clear();
    this.lastValidText = null;
    this.known = true;
  }
}

/** Une partie (D-22) : principal et précédent d'un emplacement (D-184). */
export class SaveManager extends RecordManager<SaveData> {
  constructor(storage: SaveStorage) {
    super(storage, SAVE_CODEC);
  }
}
