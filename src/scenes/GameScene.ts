import Phaser from 'phaser';
import { LEVEL_CHUNK_TILES, PLACEHOLDER_COLORS, TILE_SIZE } from '../config/display';
import {
  DEFAULT_MOVEMENT,
  MAX_STEPS_PER_FRAME,
  PHYSICS_STEP_HZ,
  PLAYER_HITBOX,
  type MovementParams,
} from '../config/movement';
import { FixedStepClock } from '../core/FixedStepClock';
import { InputController } from '../core/input/InputController';
import { KeyboardSource } from '../core/input/KeyboardSource';
import { TouchSource } from '../core/input/TouchSource';
import { Tile, spawnPosition, tileAt, type LevelData } from '../core/level/LevelData';
import { parseAsciiLevel } from '../core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../core/player/PlayerPhysics';
import testRoomText from '../levels/test-room.txt?raw';
import { loadControlSettings, saveControlSettings } from '../ui/controlSettingsStorage';
import { PauseMenu } from '../ui/PauseMenu';

const PLAYER_TEXTURE = 'celeste-placeholder';
/** Durée d'image maximale prise en compte (onglet en arrière-plan, pause du navigateur). */
const MAX_FRAME_SECONDS = 0.25;

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
  readonly clock = new FixedStepClock(1 / PHYSICS_STEP_HZ, MAX_STEPS_PER_FRAME);
  readonly frameStats: FrameStats = { steps: 0, simulationMs: 0 };
  level!: LevelData;
  player!: PlayerPhysics;
  /** Commandes tactiles, absentes sur ordinateur. */
  touch?: TouchSource;
  paused = false;
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
    this.level = parseAsciiLevel('test-room', testRoomText);
    this.drawLevel();
    this.createPlayerTexture();
    const { x, y } = spawnPosition(this.level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
    this.player = new PlayerPhysics(this.level, this.movement, x, y);
    this.playerSprite = this.add.image(x, y, PLAYER_TEXTURE).setOrigin(0, 0);

    const keyboard = new KeyboardSource();
    this.controls.sources.push(keyboard);
    const detachKeyboard = keyboard.attach(window);
    let detachTouch: (() => void) | undefined;
    const controlSettings = loadControlSettings();
    // En dev et dans le build de debug, `?touch` force l'affichage sur ordinateur (essai à la souris).
    const forceTouch = __DEBUG_TOOLS__ && new URLSearchParams(location.search).has('touch');
    if (forceTouch || TouchSource.isTouchDevice()) {
      this.touch = new TouchSource(document.body, controlSettings);
      this.controls.sources.push(this.touch);
      detachTouch = this.touch.attach(window);
    }
    this.pauseMenu = new PauseMenu({
      settings: controlSettings,
      showTouchSettings: this.touch !== undefined,
      onResume: () => {
        this.setPaused(false);
      },
      onSettingsChange: (settings) => {
        saveControlSettings(settings);
        this.touch?.setSettings(settings);
      },
    });
    const onVisibility = () => {
      if (document.hidden) {
        this.setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    this.centerCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.centerCamera);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detachKeyboard();
      detachTouch?.();
      document.removeEventListener('visibilitychange', onVisibility);
      this.pauseMenu?.destroy();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.centerCamera);
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
    for (let i = 0; i < steps; i++) {
      input.moveX = this.controls.moveX;
      input.moveY = this.controls.moveY;
      input.jumpPressed = this.controls.consumePressed('Jump');
      input.jumpHeld = this.controls.isHeld('Jump');
      this.player.step(input);
    }
    if (__DEBUG_TOOLS__) {
      this.frameStats.steps = steps;
      this.frameStats.simulationMs = performance.now() - start;
    }

    const alpha = this.clock.alpha;
    const player = this.player;
    this.playerSprite.setPosition(
      player.prevX + (player.box.x - player.prevX) * alpha,
      player.prevY + (player.box.y - player.prevY) * alpha,
    );
    this.playerSprite.setFlipX(player.facing < 0);
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
  }

  respawn(): void {
    const { x, y } = spawnPosition(this.level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
    this.player.reset(x, y);
    this.clock.reset();
  }

  private readonly centerCamera = (): void => {
    this.cameras.main.centerOn(
      (this.level.width * TILE_SIZE) / 2,
      (this.level.height * TILE_SIZE) / 2,
    );
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
