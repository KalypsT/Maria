import type { ArcadeGameId, ArcadeMode } from '../../config/arcade';
import type { AudioSettings } from '../../config/audio';
import type { ControlSettings } from '../../config/controls';
import type { DisplaySettings } from '../../config/display';
import type { SaveData } from './saveData';
import type { SaveManager } from './SaveManager';
import { submitArcadeScore } from './arcade';
import { addFaint, addHint, addPlayTime, createStats } from './stats';

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

  /** Coquille trouvée (D-27, D-148), enregistrée aussitôt ; sans effet si déjà trouvée. */
  addCollectible(id: string): Promise<void> {
    const collectibles = this.current.progression.collectibles;
    if (collectibles.includes(id)) {
      return Promise.resolve();
    }
    collectibles.push(id);
    return this.persist();
  }

  /** Coquille vue mais pas prise (D-148), pour la carte ; écrite seulement si elle est nouvelle. */
  addSeenCollectible(id: string): Promise<void> {
    const seen = this.current.progression.seenCollectibles;
    if (seen.includes(id) || this.current.progression.collectibles.includes(id)) {
      return Promise.resolve();
    }
    seen.push(id);
    return this.persist();
  }

  /** Trésor vu mais pas pris (D-160), pour la carte ; écrit seulement s'il est nouveau. */
  addSeenTreasure(id: string): Promise<void> {
    const seen = this.current.progression.seenTreasures;
    if (seen.includes(id) || this.current.progression.memories.includes(id)) {
      return Promise.resolve();
    }
    seen.push(id);
    return this.persist();
  }

  /** Trésors regardés dans le sac (D-162) : ils ne sont plus « nouveaux ». Écrits s'il y en a. */
  addViewedTreasures(ids: readonly string[]): Promise<void> {
    const viewed = this.current.progression.viewedTreasures;
    const fresh = ids.filter((id) => !viewed.includes(id));
    if (fresh.length === 0) {
      return Promise.resolve();
    }
    viewed.push(...fresh);
    return this.persist();
  }

  /** Outil de debug (D-148) : une coquille redevient à trouver. */
  removeCollectible(id: string): Promise<void> {
    const collectibles = this.current.progression.collectibles;
    const index = collectibles.indexOf(id);
    if (index < 0) {
      return Promise.resolve();
    }
    collectibles.splice(index, 1);
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

  /** Étape réversible retirée (la marée, D-95), enregistrée aussitôt ; sans effet si absente. */
  removeStoryFlag(flag: string): Promise<void> {
    const flags = this.current.story.flags;
    const index = flags.indexOf(flag);
    if (index < 0) {
      return Promise.resolve();
    }
    flags.splice(index, 1);
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

  setAudio(audio: Readonly<AudioSettings>): Promise<void> {
    this.current.settings.audio = { ...audio };
    return this.persist();
  }

  /**
   * Du temps de jeu dans une salle (D-153), en mémoire : écrit avec la prochaine sauvegarde. Sans
   * allocation (appelé à chaque image).
   */
  addPlayTime(room: string, ms: number): void {
    addPlayTime(this.current.stats, room, ms);
  }

  /** Un évanouissement (D-153), écrit aussitôt (rare). */
  recordFaint(room: string): Promise<void> {
    addFaint(this.current.stats, room);
    return this.persist();
  }

  /** Le fil discret s'allume (D-153), en mémoire : écrit avec la prochaine sauvegarde. */
  recordHint(room: string): void {
    addHint(this.current.stats, room);
  }

  /** Outil de debug (D-153) : les stats remises à zéro. */
  resetStats(): Promise<void> {
    this.current.stats = createStats();
    return this.persist();
  }

  /**
   * Fin d'une partie de la console (D-166) : garde le meilleur score du jeu dans ce mode. Retourne
   * true pour un nouveau record (écrit seulement dans ce cas).
   */
  async recordArcadeScore(game: ArcadeGameId, mode: ArcadeMode, meters: number): Promise<boolean> {
    if (!submitArcadeScore(this.current.arcade, game, mode, meters)) {
      return false;
    }
    await this.persist();
    return true;
  }

  /** Jeux de la console vus dans son menu (D-166) : ils ne sont plus « nouveaux ». */
  markArcadeSeen(games: readonly ArcadeGameId[]): Promise<void> {
    const seen = this.current.arcade.seen;
    const added = games.filter((game) => !seen.includes(game));
    if (added.length === 0) {
      return Promise.resolve();
    }
    seen.push(...added);
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
