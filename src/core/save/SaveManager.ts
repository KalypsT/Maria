import { deserializeSave, serializeSave, type SaveData, type SaveProblem } from './saveData';
import type { SaveStorage } from './SaveStorage';

/** D'où vient la sauvegarde chargée. */
export type LoadSource = 'main' | 'previous' | 'none';

export interface LoadReport {
  data: SaveData | null;
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
export class SaveManager {
  /** Texte du dernier principal valide connu (lu ou écrit). */
  private lastValidText: string | null = null;
  /** Vrai une fois l'état du stockage connu (chargé ou écrit) : sinon, relire avant d'écrire. */
  private known = false;
  private queue: Promise<void> = Promise.resolve();
  lastError: string | null = null;
  lastSavedAt = 0;

  constructor(readonly storage: SaveStorage) {}

  async load(): Promise<LoadReport> {
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
    const main = deserializeSave(slots.main);
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
    const previous = deserializeSave(slots.previous);
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
  save(data: Readonly<SaveData>): Promise<void> {
    const text = serializeSave(data);
    this.queue = this.queue.then(async () => {
      try {
        if (!this.known) {
          // Écriture sans chargement préalable : le principal actuel, s'il est valide, est conservé.
          const current = await this.storage.read();
          this.lastValidText = deserializeSave(current.main).ok ? current.main : null;
          this.known = true;
        }
        await this.storage.write({ main: text, previous: this.lastValidText });
        this.lastValidText = text;
        this.lastSavedAt = data.savedAt;
        this.lastError = null;
      } catch (error) {
        this.lastError = String(error);
      }
    });
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
