import Phaser from 'phaser';
import { DEFAULT_CONTROL_SETTINGS } from '../config/controls';
import { PLACEHOLDER_COLORS, TILE_SIZE } from '../config/display';
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
  private playerSprite!: Phaser.GameObjects.Image;
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
    // En dev et dans le build de debug, `?touch` force l'affichage sur ordinateur (essai à la souris).
    const forceTouch = __DEBUG_TOOLS__ && new URLSearchParams(location.search).has('touch');
    if (forceTouch || TouchSource.isTouchDevice()) {
      const touch = new TouchSource(document.body, DEFAULT_CONTROL_SETTINGS);
      this.controls.sources.push(touch);
      detachTouch = touch.attach(window);
    }

    this.centerCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.centerCamera);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detachKeyboard();
      detachTouch?.();
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

  /** Dessine la grille une seule fois dans une texture : une seule image affichée par la suite. */
  private drawLevel(): void {
    const g = this.make.graphics({}, false);
    const level = this.level;
    for (let row = 0; row < level.height; row++) {
      for (let col = 0; col < level.width; col++) {
        const tile = tileAt(level, col, row);
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        if (tile === Tile.Solid) {
          g.fillStyle(PLACEHOLDER_COLORS.solid);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          if (tileAt(level, col, row - 1) !== Tile.Solid) {
            g.fillStyle(PLACEHOLDER_COLORS.solidEdge);
            g.fillRect(x, y, TILE_SIZE, 2);
          }
        } else if (tile === Tile.OneWay) {
          g.fillStyle(PLACEHOLDER_COLORS.oneWay);
          g.fillRect(x, y, TILE_SIZE, 3);
          g.fillStyle(PLACEHOLDER_COLORS.oneWay, 0.25);
          g.fillRect(x, y + 3, TILE_SIZE, 5);
        }
      }
    }
    const key = `level-${level.id}`;
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    g.generateTexture(key, level.width * TILE_SIZE, level.height * TILE_SIZE);
    g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0);
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
