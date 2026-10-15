import { SAVE_SLOT_COUNT } from '../../config/save';
import { legacySaveSettings } from './saveData';
import { RecordManager, SaveManager, type SaveCodec } from './SaveManager';
import {
  KeyedSaveStorage,
  type KeyWrite,
  type SaveLibraryStorage,
  type SaveSlots,
  type SaveStorage,
} from './SaveStorage';
import { deserializeSettings, serializeSettings, type GameSettings } from './settingsData';

/** Version du rangement par clés ; son absence déclenche la reprise de l'ancienne sauvegarde. */
const LAYOUT_KEY = 'layout';
const LAYOUT_VERSION = '2';
const LAST_SLOT_KEY = 'last-slot';
const SETTINGS_PREFIX = 'settings';

const SETTINGS_CODEC: SaveCodec<GameSettings> = {
  serialize: serializeSettings,
  deserialize: deserializeSettings,
};

function slotPrefix(slot: number): string {
  return `slot${String(slot)}`;
}

export function isSaveSlot(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= SAVE_SLOT_COUNT;
}

/** Les numéros des parties, de 1 à `SAVE_SLOT_COUNT`. */
export const SAVE_SLOTS: readonly number[] = Array.from(
  { length: SAVE_SLOT_COUNT },
  (_, i) => i + 1,
);

export interface LibraryReport {
  /** L'ancienne sauvegarde unique vient d'être copiée dans la partie 1. */
  migrated: boolean;
  /**
   * La copie a échoué : la partie 1 lit encore l'ancienne sauvegarde (rien n'est perdu), et la copie
   * est retentée au prochain lancement.
   */
  migrationError: string | null;
  /** Les réglages de l'appareil (jamais absents : valeurs par défaut au besoin). */
  settings: GameSettings;
  /** La dernière partie jouée (la partie 1 par défaut). */
  lastSlot: number;
}

/**
 * Tant que la reprise n'a pas pu s'écrire : l'emplacement de la partie 1 s'il a déjà été écrit,
 * sinon l'ancienne sauvegarde. Les écritures vont dans l'emplacement.
 */
class LegacyFallbackStorage implements SaveStorage {
  readonly kind: string;

  constructor(
    private readonly slot: KeyedSaveStorage,
    private readonly library: SaveLibraryStorage,
  ) {
    this.kind = slot.kind;
  }

  async read(): Promise<SaveSlots> {
    const own = await this.slot.read();
    return own.main !== null || own.previous !== null ? own : this.library.readLegacy();
  }

  write(slots: SaveSlots): Promise<void> {
    return this.slot.write(slots);
  }

  clear(): Promise<void> {
    return this.slot.clear();
  }
}

/**
 * Les parties d'un appareil (D-184) : des emplacements fixes, chacun avec son principal et son
 * précédent (la robustesse de D-22, inchangée), et les réglages communs, rangés à part.
 *
 * Au premier lancement, l'ancienne sauvegarde unique est **copiée** dans la partie 1 et ses
 * réglages deviennent ceux de l'appareil, en une seule écriture ; l'original n'est jamais modifié.
 * La reprise n'a lieu qu'une fois (repère `layout`), et jamais par-dessus une partie déjà écrite.
 */
export class SaveLibrary {
  readonly settingsManager: RecordManager<GameSettings>;
  /** La reprise n'a pas pu s'écrire : la partie 1 lit encore l'ancienne sauvegarde. */
  private legacyFallback = false;

  constructor(readonly storage: SaveLibraryStorage) {
    this.settingsManager = new RecordManager(
      new KeyedSaveStorage(storage, SETTINGS_PREFIX),
      SETTINGS_CODEC,
    );
  }

  /** Reprend l'ancienne sauvegarde si besoin, puis lit les réglages et la dernière partie jouée. */
  async open(defaultSettings: () => GameSettings): Promise<LibraryReport> {
    let migrated = false;
    let migrationError: string | null = null;
    let legacySettings: GameSettings | null = null;
    try {
      const slotKeys = SAVE_SLOTS.flatMap((slot) => [
        `${slotPrefix(slot)}.main`,
        `${slotPrefix(slot)}.previous`,
      ]);
      const [layout = null, settingsMain = null, ...slotTexts] = await this.storage.get([
        LAYOUT_KEY,
        `${SETTINGS_PREFIX}.main`,
        ...slotKeys,
      ]);
      if (layout === null) {
        const legacy = await this.storage.readLegacy();
        const hasLegacy = legacy.main !== null || legacy.previous !== null;
        // Une partie déjà écrite (reprise interrompue puis jouée) n'est jamais recouverte.
        const copy = hasLegacy && slotTexts.every((text) => text === null);
        legacySettings = legacySaveSettings(legacy.main) ?? legacySaveSettings(legacy.previous);
        const writes: KeyWrite[] = [];
        if (copy) {
          writes.push(
            [`${slotPrefix(1)}.previous`, legacy.previous],
            [`${slotPrefix(1)}.main`, legacy.main],
            [LAST_SLOT_KEY, '1'],
          );
        }
        if (legacySettings && settingsMain === null) {
          writes.push([`${SETTINGS_PREFIX}.main`, serializeSettings(legacySettings)]);
        }
        // Le repère en dernier : sans transaction, une reprise interrompue est refaite.
        writes.push([LAYOUT_KEY, LAYOUT_VERSION]);
        try {
          await this.storage.set(writes);
          migrated = copy;
        } catch (error) {
          migrationError = String(error);
          this.legacyFallback = copy;
        }
      }
    } catch (error) {
      migrationError = String(error);
    }
    const settings =
      (await this.settingsManager.load()).data ?? legacySettings ?? defaultSettings();
    return { migrated, migrationError, settings, lastSlot: await this.lastSlot() };
  }

  /** Le stockage d'une partie (principal et précédent). */
  slotStorage(slot: number): SaveStorage {
    const own = new KeyedSaveStorage(this.storage, slotPrefix(slot));
    return slot === 1 && this.legacyFallback ? new LegacyFallbackStorage(own, this.storage) : own;
  }

  slotManager(slot: number): SaveManager {
    return new SaveManager(this.slotStorage(slot));
  }

  async lastSlot(): Promise<number> {
    try {
      const [text = null] = await this.storage.get([LAST_SLOT_KEY]);
      const slot = Number(text);
      return text !== null && isSaveSlot(slot) ? slot : 1;
    } catch {
      return 1;
    }
  }

  /** Retient la partie jouée, reprise par « Continuer ». Sans conséquence si l'écriture échoue. */
  async setLastSlot(slot: number): Promise<void> {
    try {
      await this.storage.set([[LAST_SLOT_KEY, String(slot)]]);
    } catch {
      // La partie 1 sera proposée : rien n'est perdu.
    }
  }
}
