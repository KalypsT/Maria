import type Phaser from 'phaser';
import { PLACEHOLDER_COLORS, TILE_SIZE as T } from '../config/display';
import type { RunState } from '../core/world/RunState';

const CHECKPOINT_OFF = 'checkpoint-off-placeholder';
const CHECKPOINT_ON = 'checkpoint-on-placeholder';
const WIDTH = 8;
const HEIGHT = 20;

/**
 * Affichage des checkpoints (placeholder neutre, design ouvert §45) : un petit repère qui s'allume
 * quand il est activé, plus vif s'il est le point de retour courant.
 */
export class WorldView {
  private sprites: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
  ) {
    this.createTextures();
    this.rebuild();
  }

  /** Recrée les repères (changement de salle). */
  rebuild(): void {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.sprites = this.run.checkpoints.map((checkpoint) =>
      this.scene.add
        .image((checkpoint.col + 0.5) * T, (checkpoint.row + 1) * T, CHECKPOINT_OFF)
        .setOrigin(0.5, 1)
        .setDepth(5),
    );
  }

  render(): void {
    const checkpoints = this.run.checkpoints;
    for (let i = 0; i < checkpoints.length; i++) {
      const sprite = this.sprites[i];
      const checkpoint = checkpoints[i];
      if (!sprite || !checkpoint) {
        continue;
      }
      const key = checkpoint.activated ? CHECKPOINT_ON : CHECKPOINT_OFF;
      if (sprite.texture.key !== key) {
        sprite.setTexture(key);
      }
      sprite.setAlpha(checkpoint.activated && i !== this.run.current ? 0.65 : 1);
    }
  }

  private createTextures(): void {
    const textures = this.scene.textures;
    if (textures.exists(CHECKPOINT_ON)) {
      return;
    }
    for (const [key, lit] of [
      [CHECKPOINT_OFF, false],
      [CHECKPOINT_ON, true],
    ] as const) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(PLACEHOLDER_COLORS.checkpoint);
      g.fillRect(WIDTH / 2 - 1, 6, 2, HEIGHT - 6);
      g.fillRect(1, HEIGHT - 2, WIDTH - 2, 2);
      g.fillStyle(lit ? PLACEHOLDER_COLORS.checkpointLit : PLACEHOLDER_COLORS.checkpoint);
      g.fillCircle(WIDTH / 2, 4, lit ? 4 : 3);
      g.generateTexture(key, WIDTH, HEIGHT);
      g.destroy();
    }
  }
}
