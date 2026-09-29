import type { ControlSettings } from '../../config/controls';
import type { DisplaySettings } from '../../config/display';
import type { SaveData } from './saveData';
import type { SaveManager } from './SaveManager';

/**
 * Partie en cours (D-22) : la sauvegarde courante et les modifications du jeu (checkpoint, salle,
 * réglages), écrites par `SaveManager`. Pure : l'horloge est injectée.
 */
export class SaveSession {
  constructor(
    readonly manager: SaveManager,
    private current: SaveData,
    private readonly now: () => number = Date.now,
  ) {}

  get data(): Readonly<SaveData> {
    return this.current;
  }

  /** Nouveau point de retour (`checkpointKey` = `salle:checkpoint`), marqué activé. */
  setCheckpoint(levelId: string, checkpointId: string | null): Promise<void> {
    this.current.checkpoint = { levelId, checkpointId };
    if (checkpointId !== null) {
      const key = `${levelId}:${checkpointId}`;
      if (!this.current.activatedCheckpoints.includes(key)) {
        this.current.activatedCheckpoints.push(key);
      }
    }
    return this.persist();
  }

  /**
   * Salle visitée (D-25), ajoutée à la carte révélée ; écrite seulement si elle est nouvelle.
   * Le point de retour ne change pas.
   */
  revealRoom(roomId: string): Promise<void> {
    const revealed = this.current.progression.mapRevealed;
    if (revealed.includes(roomId)) {
      return Promise.resolve();
    }
    revealed.push(roomId);
    return this.persist();
  }

  /** Capacité obtenue (D-26), enregistrée aussitôt ; sans effet si elle est déjà acquise. */
  unlockAbility(ability: string): Promise<void> {
    const abilities = this.current.progression.abilities;
    if (abilities.includes(ability)) {
      return Promise.resolve();
    }
    abilities.push(ability);
    return this.persist();
  }

  /** Trouvaille découverte (secret, D-27), enregistrée aussitôt ; sans effet si déjà trouvée. */
  addCollectible(id: string): Promise<void> {
    const collectibles = this.current.progression.collectibles;
    if (collectibles.includes(id)) {
      return Promise.resolve();
    }
    collectibles.push(id);
    return this.persist();
  }

  /** Souvenir trouvé (§22.1, D-38), enregistré aussitôt ; sans effet s'il l'est déjà. */
  addMemory(id: string): Promise<void> {
    const memories = this.current.progression.memories;
    if (memories.includes(id)) {
      return Promise.resolve();
    }
    memories.push(id);
    return this.persist();
  }

  /** Étape de l'histoire vécue (§33, D-31), enregistrée aussitôt ; sans effet si déjà notée. */
  addStoryFlag(flag: string): Promise<void> {
    const flags = this.current.story.flags;
    if (flags.includes(flag)) {
      return Promise.resolve();
    }
    flags.push(flag);
    return this.persist();
  }

  setControls(controls: Readonly<ControlSettings>): Promise<void> {
    this.current.settings.controls = { ...controls };
    return this.persist();
  }

  setDisplay(display: Readonly<DisplaySettings>): Promise<void> {
    this.current.settings.display = { ...display };
    return this.persist();
  }

  /** Remplace toute la partie (import d'un code de sauvegarde). */
  replace(data: SaveData): Promise<void> {
    this.current = data;
    return this.persist();
  }

  persist(): Promise<void> {
    this.current.savedAt = this.now();
    return this.manager.save(this.current);
  }
}
