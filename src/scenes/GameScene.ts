import Phaser from 'phaser';
import { DEFAULT_CAMERA, type CameraParams } from '../config/camera';
import { DEFAULT_COMBAT, type CombatParams } from '../config/combat';
import { DEFAULT_FEEL, type FeelParams } from '../config/feel';
import {
  GAME_HEIGHT,
  LEVEL_CHUNK_TILES,
  PLACEHOLDER_COLORS,
  TILE_SIZE,
  type DisplaySettings,
} from '../config/display';
import {
  DEFAULT_MOVEMENT,
  MAX_STEPS_PER_FRAME,
  PHYSICS_STEP_HZ,
  PLAYER_HITBOX,
  type MovementParams,
} from '../config/movement';
import { CameraController } from '../core/camera/CameraController';
import { CombatWorld } from '../core/combat/CombatWorld';
import { FixedStepClock } from '../core/FixedStepClock';
import { InputController } from '../core/input/InputController';
import { KeyboardSource } from '../core/input/KeyboardSource';
import { TouchSource } from '../core/input/TouchSource';
import { Tile, tileAt, type LevelData } from '../core/level/LevelData';
import { parseAsciiLevel } from '../core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../core/player/PlayerPhysics';
import { PlayerFeel } from '../core/player/playerFeel';
import { LEVELS, levelName, type LevelSource } from '../levels';
import { DEFAULT_WORLD, type WorldParams } from '../config/world';
import type { SaveSession } from '../core/save/SaveSession';
import { RunEvent, RunState } from '../core/world/RunState';
import { Hud } from '../ui/Hud';
import { PauseMenu } from '../ui/PauseMenu';
import { CombatView } from './CombatView';
import { DustPool } from './DustPool';
import { WorldView } from './WorldView';

const PLAYER_TEXTURE = 'celeste-placeholder';
/** Durée d'image maximale prise en compte (onglet en arrière-plan, pause du navigateur). */
const MAX_FRAME_SECONDS = 0.25;
/** Clé du registre Phaser où main.ts dépose la partie en cours (D-22). */
export const SESSION_KEY = 'maria-session';

function levelSource(id: string): LevelSource {
  const first = LEVELS[0];
  if (!first) {
    throw new Error('Aucune salle déclarée dans src/levels/index.ts');
  }
  return LEVELS.find((level) => level.id === id) ?? first;
}

/** Événement du jeu émis quand les réglages d'affichage changent (main.ts redimensionne le canvas). */
export const DISPLAY_SETTINGS_EVENT = 'maria-display-settings';

/** Mesures de la dernière image, lues par l'overlay de debug. */
export interface FrameStats {
  steps: number;
  simulationMs: number;
}

/**
 * Scène du prototype de mouvement : la simulation (pure, pas fixe) avance ici, Phaser ne fait que
 * l'affichage, interpolé entre les deux derniers pas.
 */
export class GameScene extends Phaser.Scene {
  readonly controls = new InputController();
  /** Paramètres courants (modifiables en direct par l'overlay de debug). */
  readonly movement: MovementParams = { ...DEFAULT_MOVEMENT };
  /** Paramètres de caméra courants (modifiables en direct par l'overlay de debug). */
  readonly cameraParams: CameraParams = { ...DEFAULT_CAMERA };
  readonly camera = new CameraController(this.cameraParams);
  /** Sensations visuelles (écrasement, inclinaison, poussière), modifiables par l'overlay. */
  readonly feelParams: FeelParams = { ...DEFAULT_FEEL };
  readonly feel = new PlayerFeel(this.feelParams);
  private dust!: DustPool;
  /** Combat minimal (D-20), modifiable par l'overlay. */
  readonly combatParams: CombatParams = { ...DEFAULT_COMBAT };
  combat!: CombatWorld;
  private combatView!: CombatView;
  /** Échec, jauge de peur et checkpoints (D-21), modifiables par l'overlay. */
  readonly worldParams: WorldParams = { ...DEFAULT_WORLD };
  run!: RunState;
  session!: SaveSession;
  private worldView!: WorldView;
  private hud!: Hud;
  /** Heure de la dernière réapparition (fondu de retour), -1 sinon. */
  private reappearAtMs = -1;
  readonly clock = new FixedStepClock(1 / PHYSICS_STEP_HZ, MAX_STEPS_PER_FRAME);
  readonly frameStats: FrameStats = { steps: 0, simulationMs: 0 };
  level!: LevelData;
  player!: PlayerPhysics;
  /** Commandes tactiles, absentes sur ordinateur. */
  touch?: TouchSource;
  paused = false;
  /** Réglages d'affichage courants (D-18). */
  displaySettings!: DisplaySettings;
  private pauseMenu?: PauseMenu;
  private playerSprite!: Phaser.GameObjects.Image;
  private readonly levelImages: Phaser.GameObjects.Image[] = [];
  private readonly playerInput: PlayerInput = {
    moveX: 0,
    moveY: 0,
    jumpPressed: false,
    jumpHeld: false,
  };

  constructor() {
    super('Game');
  }

  create(): void {
    this.session = this.registry.get(SESSION_KEY) as SaveSession;
    const save = this.session.data;
    const source = levelSource(save.checkpoint.levelId);
    this.level = parseAsciiLevel(source.id, source.text);
    this.drawLevel();
    this.createPlayerTexture();
    this.run = new RunState(this.level, this.worldParams);
    this.run.load(
      this.level,
      save.activatedCheckpoints,
      source.id === save.checkpoint.levelId ? save.checkpoint.checkpointId : null,
    );
    const { x, y } = this.respawnPosition();
    this.player = new PlayerPhysics(this.level, this.movement, x, y);
    // Origine aux pieds : l'écrasement et l'inclinaison se font autour du point d'appui.
    this.playerSprite = this.add.image(x, y, PLAYER_TEXTURE).setOrigin(0.5, 1).setDepth(10);
    this.dust = new DustPool(this, this.feelParams);
    this.combat = new CombatWorld(this.level, this.combatParams);
    this.combatView = new CombatView(this, this.combat, this.combatParams, this.dust);
    this.worldView = new WorldView(this, this.run);
    this.hud = new Hud();
    this.applyMovement();
    this.feel.reset(this.player);

    const keyboard = new KeyboardSource();
    this.controls.sources.push(keyboard);
    const detachKeyboard = keyboard.attach(window);
    let detachTouch: (() => void) | undefined;
    const controlSettings = { ...save.settings.controls };
    // En dev et dans le build de debug, `?touch` force l'affichage sur ordinateur (essai à la souris).
    const forceTouch = __DEBUG_TOOLS__ && new URLSearchParams(location.search).has('touch');
    if (forceTouch || TouchSource.isTouchDevice()) {
      this.touch = new TouchSource(document.body, controlSettings);
      this.controls.sources.push(this.touch);
      detachTouch = this.touch.attach(window);
    }
    this.displaySettings = { ...save.settings.display };
    this.pauseMenu = new PauseMenu({
      settings: controlSettings,
      display: this.displaySettings,
      onDisplayChange: (settings) => {
        this.setDisplaySettings(settings);
      },
      showTouchSettings: this.touch !== undefined,
      onResume: () => {
        this.setPaused(false);
      },
      onSettingsChange: (settings) => {
        void this.session.setControls(settings);
        this.touch?.setSettings(settings);
      },
      levels: LEVELS.map((level) => ({ id: level.id, name: levelName(level) })),
      currentLevelId: () => this.level.id,
      onLevelChange: (id) => {
        const level = LEVELS.find((candidate) => candidate.id === id);
        if (level) {
          this.loadLevel(level);
        }
      },
    });
    const onVisibility = () => {
      if (document.hidden) {
        this.setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    this.applyCamera();
    this.resetCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detachKeyboard();
      detachTouch?.();
      document.removeEventListener('visibilitychange', onVisibility);
      this.pauseMenu?.destroy();
      this.hud.destroy();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    });

    if (__DEBUG_TOOLS__) {
      void import('../debug/DebugOverlay').then(({ installDebugOverlay }) => {
        installDebugOverlay(this);
      });
    }
  }

  override update(): void {
    const frameSeconds = Math.min(this.game.loop.rawDelta / 1000, MAX_FRAME_SECONDS);
    this.controls.update();
    if (this.controls.consumePressed('Pause')) {
      this.setPaused(!this.paused);
    }
    if (this.paused) {
      return;
    }
    const steps = this.clock.advance(frameSeconds);
    const start = __DEBUG_TOOLS__ ? performance.now() : 0;
    const input = this.playerInput;
    const camera = this.camera;
    const feel = this.feel;
    const combat = this.combat;
    const run = this.run;
    for (let i = 0; i < steps; i++) {
      if (combat.hitstopSteps > 0) {
        // Arrêt sur image : toute la simulation est suspendue, les pressions restent mémorisées.
        combat.hitstopSteps--;
        this.freezeInterpolation();
        continue;
      }
      if (run.fainting) {
        // Évanouissement (D-21) : rien ne bouge ; à la fin, retour au point de retour.
        run.stepFainting();
        this.freezeInterpolation();
        if ((run.events & RunEvent.Respawn) !== 0) {
          this.respawnAtCheckpoint();
        }
        continue;
      }
      input.moveX = this.controls.moveX;
      input.moveY = this.controls.moveY;
      input.jumpPressed = this.controls.consumePressed('Jump');
      input.jumpHeld = this.controls.isHeld('Jump');
      this.player.step(input);
      combat.step(this.player, this.controls.consumePressed('Attack'));
      if (combat.events !== 0) {
        this.combatView.onEvents(combat.events);
      }
      run.step(this.player.box, combat.events);
      if ((run.events & RunEvent.CheckpointActivated) !== 0) {
        // Sauvegarde automatique au checkpoint (D-22), sans attendre l'écriture.
        const checkpoint = run.checkpoints[run.current];
        void this.session.setCheckpoint(this.level.id, checkpoint ? checkpoint.id : null);
      }
      camera.lookInput = input.moveY;
      camera.step(this.player);
      feel.step(this.player);
      if (feel.events !== 0) {
        this.dust.emit(feel.events, this.player.box, this.player.facing);
      }
    }
    if (__DEBUG_TOOLS__) {
      this.frameStats.steps = steps;
      this.frameStats.simulationMs = performance.now() - start;
    }

    const alpha = this.clock.alpha;
    const player = this.player;
    const box = player.box;
    this.playerSprite
      .setPosition(
        player.prevX + (box.x - player.prevX) * alpha + box.width / 2,
        player.prevY + (box.y - player.prevY) * alpha + box.height,
      )
      .setScale(feel.scaleX, feel.scaleY)
      .setRotation(feel.lean)
      .setFlipX(player.facing < 0);
    this.combatView.render(alpha, player, this.playerSprite);
    this.worldView.render();
    this.renderRunState();
    this.dust.update();
    this.cameras.main.centerOn(
      camera.prevX + (camera.x - camera.prevX) * alpha,
      camera.prevY + (camera.y - camera.prevY) * alpha,
    );
  }

  /** Met le jeu en pause (simulation arrêtée, menu affiché) ou le reprend. */
  setPaused(paused: boolean): void {
    if (paused === this.paused) {
      return;
    }
    this.paused = paused;
    this.clock.reset();
    this.touch?.releaseAll();
    if (paused) {
      this.pauseMenu?.open();
    } else {
      this.pauseMenu?.close();
      // Une pression de saut faite pendant la pause ne doit pas partir à la reprise.
      this.controls.consumePressed('Jump');
    }
  }

  /** Applique les paramètres courants au joueur (après un réglage en direct). */
  applyMovement(): void {
    this.player.setParams(this.movement);
    this.feel.maxRunSpeed = this.movement.maxRunSpeed;
    this.feel.maxFallSpeed = this.movement.maxFallSpeed;
  }

  /** Applique les réglages de combat (overlay). */
  applyCombat(): void {
    this.combat.setParams(this.combatParams);
  }

  /** Ennemis remis à leur départ (overlay). */
  resetEnemies(): void {
    this.combat.reset();
  }

  /** Pendant l'arrêt sur image, l'interpolation ne doit pas faire osciller l'affichage. */
  private freezeInterpolation(): void {
    const player = this.player;
    player.prevX = player.box.x;
    player.prevY = player.box.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;
    for (const enemy of this.combat.enemies) {
      enemy.prevX = enemy.box.x;
      enemy.prevY = enemy.box.y;
    }
  }

  /** Applique les réglages de sensations visuelles (overlay). */
  applyFeel(): void {
    this.feel.setParams(this.feelParams);
  }

  /** Applique les paramètres de caméra courants (après un réglage en direct ou un changement de zoom). */
  applyCamera(): void {
    this.camera.setParams(this.cameraParams);
    this.onResize();
  }

  /** Change la résolution de rendu (D-18) : sauvegardée, puis appliquée par main.ts. */
  setDisplaySettings(settings: Readonly<DisplaySettings>): void {
    this.displaySettings = { ...settings };
    void this.session.setDisplay(this.displaySettings);
    this.game.events.emit(DISPLAY_SETTINGS_EVENT, this.displaySettings);
  }

  /** Échelle de rendu courante (D-18) : 1 à la résolution logique. */
  get renderScale(): number {
    return this.scale.height / GAME_HEIGHT;
  }

  /** Applique les réglages d'échec et de jauge (overlay). */
  applyWorld(): void {
    this.run.setParams(this.worldParams);
  }

  /** Position (px) de réapparition : pieds au bas de la tuile du checkpoint courant ou du départ. */
  private respawnPosition(): { x: number; y: number } {
    const tile = this.run.respawnTile();
    return {
      x: (tile.col + 0.5) * TILE_SIZE - PLAYER_HITBOX.width / 2,
      y: (tile.row + 1) * TILE_SIZE - PLAYER_HITBOX.height,
    };
  }

  /** Fin de l'évanouissement : retour au point de retour, monde local restauré (§20.2). */
  private respawnAtCheckpoint(): void {
    this.respawn();
    this.reappearAtMs = this.time.now;
  }

  /** Voile de l'évanouissement, jauge de peur, transparence de Céleste. */
  private renderRunState(): void {
    const run = this.run;
    this.hud.setFear(run.fear, this.worldParams.fearMax);
    if (run.fainting) {
      const progress = run.faintProgress;
      this.hud.setVeil(progress);
      this.playerSprite.setAlpha(1 - progress);
      return;
    }
    if (this.reappearAtMs >= 0) {
      const duration = this.worldParams.reappearMs;
      const k = duration > 0 ? (this.time.now - this.reappearAtMs) / duration : 1;
      this.hud.setVeil(1 - k);
      if (k >= 1) {
        this.reappearAtMs = -1;
      }
    } else {
      this.hud.setVeil(0);
    }
  }

  respawn(): void {
    const { x, y } = this.respawnPosition();
    this.player.reset(x, y, this.level);
    this.feel.reset(this.player);
    this.combat.reset();
    this.clock.reset();
    this.resetCamera();
  }

  /** Charge une autre salle et y replace Céleste au départ ; le choix est sauvegardé. */
  loadLevel(source: LevelSource): void {
    this.level = parseAsciiLevel(source.id, source.text);
    this.drawLevel();
    this.combat.load(this.level);
    this.combatView.rebuild();
    this.run.load(this.level, this.session.data.activatedCheckpoints, null);
    this.worldView.rebuild();
    this.respawn();
    void this.session.setCheckpoint(this.level.id, null);
  }

  private resetCamera(): void {
    const camera = this.camera;
    camera.setBounds(this.level.width * TILE_SIZE, this.level.height * TILE_SIZE);
    camera.reset(this.player);
    this.cameras.main.centerOn(camera.x, camera.y);
  }

  /**
   * Largeur logique variable (D-01) et échelle de rendu (D-18) : la vue de la caméra est la taille
   * logique ; le zoom Phaser est le zoom de caméra × l'échelle de rendu.
   */
  private readonly onResize = (): void => {
    const scale = this.renderScale;
    this.camera.setView(this.scale.width / scale, this.scale.height / scale);
    this.cameras.main.setZoom(this.cameraParams.zoom * scale);
    this.cameras.main.centerOn(this.camera.x, this.camera.y);
  };

  /**
   * Dessine la salle une seule fois, par blocs (D-17) : une image par bloc, et les blocs hors
   * écran ne sont pas dessinés par Phaser. Remplace le dessin de la salle précédente.
   */
  private drawLevel(): void {
    for (const image of this.levelImages) {
      const key = image.texture.key;
      image.destroy();
      this.textures.remove(key);
    }
    this.levelImages.length = 0;
    const level = this.level;
    const chunkPx = LEVEL_CHUNK_TILES * TILE_SIZE;
    const g = this.make.graphics({}, false);
    for (let chunkRow = 0; chunkRow * LEVEL_CHUNK_TILES < level.height; chunkRow++) {
      for (let chunkCol = 0; chunkCol * LEVEL_CHUNK_TILES < level.width; chunkCol++) {
        const col0 = chunkCol * LEVEL_CHUNK_TILES;
        const row0 = chunkRow * LEVEL_CHUNK_TILES;
        const cols = Math.min(LEVEL_CHUNK_TILES, level.width - col0);
        const rows = Math.min(LEVEL_CHUNK_TILES, level.height - row0);
        g.clear();
        let drawn = false;
        for (let row = row0; row < row0 + rows; row++) {
          for (let col = col0; col < col0 + cols; col++) {
            drawn =
              this.drawTile(g, col, row, (col - col0) * TILE_SIZE, (row - row0) * TILE_SIZE) ||
              drawn;
          }
        }
        if (!drawn) {
          continue;
        }
        const key = `level-${level.id}-${chunkCol}-${chunkRow}`;
        if (this.textures.exists(key)) {
          this.textures.remove(key);
        }
        g.generateTexture(key, cols * TILE_SIZE, rows * TILE_SIZE);
        this.levelImages.push(
          this.add.image(chunkCol * chunkPx, chunkRow * chunkPx, key).setOrigin(0, 0),
        );
      }
    }
    g.destroy();
  }

  /** Dessine une tuile à (x, y) dans le bloc ; retourne faux si elle est vide. */
  private drawTile(
    g: Phaser.GameObjects.Graphics,
    col: number,
    row: number,
    x: number,
    y: number,
  ): boolean {
    const level = this.level;
    const tile = tileAt(level, col, row);
    if (tile === Tile.Solid) {
      g.fillStyle(PLACEHOLDER_COLORS.solid);
      g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      if (tileAt(level, col, row - 1) !== Tile.Solid) {
        g.fillStyle(PLACEHOLDER_COLORS.solidEdge);
        g.fillRect(x, y, TILE_SIZE, 2);
      }
      return true;
    }
    if (tile === Tile.Hazard) {
      // Placeholder de danger (design ouvert, §45) : rangée de pointes émoussées, sans violence.
      g.fillStyle(PLACEHOLDER_COLORS.hazard);
      for (let i = 0; i < 4; i++) {
        g.fillTriangle(
          x + i * 4,
          y + TILE_SIZE,
          x + i * 4 + 2,
          y + 6,
          x + i * 4 + 4,
          y + TILE_SIZE,
        );
      }
      return true;
    }
    if (tile === Tile.OneWay) {
      g.fillStyle(PLACEHOLDER_COLORS.oneWay);
      g.fillRect(x, y, TILE_SIZE, 3);
      g.fillStyle(PLACEHOLDER_COLORS.oneWay, 0.25);
      g.fillRect(x, y + 3, TILE_SIZE, 5);
      return true;
    }
    const goal = level.goal;
    if (goal?.col === col && goal.row === row) {
      // Placeholder d'arrivée : un fanion.
      g.fillStyle(PLACEHOLDER_COLORS.goal);
      g.fillRect(x + 3, y, 2, TILE_SIZE);
      g.fillTriangle(x + 5, y, x + 15, y + 4, x + 5, y + 8);
      return true;
    }
    return false;
  }

  /** Placeholder de Céleste (D-07) : corps rose et lunettes rondes roses, tourné vers la droite. */
  private createPlayerTexture(): void {
    if (this.textures.exists(PLAYER_TEXTURE)) {
      return;
    }
    const { width, height } = PLAYER_HITBOX;
    const g = this.make.graphics({}, false);
    g.fillStyle(PLACEHOLDER_COLORS.celeste);
    g.fillRect(0, 0, width, height);
    g.fillStyle(PLACEHOLDER_COLORS.face);
    g.fillRect(2, 2, width - 3, 8);
    g.lineStyle(1, PLACEHOLDER_COLORS.glasses);
    g.strokeCircle(6, 6, 2);
    g.strokeCircle(10, 6, 2);
    g.generateTexture(PLAYER_TEXTURE, width, height);
    g.destroy();
  }
}
