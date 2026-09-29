import type Phaser from 'phaser';
import { PLACEHOLDER_COLORS, TILE_SIZE as T } from '../config/display';
import { PickupKind, type Pickups } from '../core/world/Pickups';
import type { RunState } from '../core/world/RunState';

const CHECKPOINT_OFF = 'checkpoint-off-placeholder';
const CHECKPOINT_ON = 'checkpoint-on-placeholder';
const PICKUP = 'ability-pickup-placeholder';
const SECRET = 'secret-pickup-placeholder';
const WIDTH = 8;
const HEIGHT = 20;
const PICKUP_SIZE = 10;
/** Flottement de l'objet de capacité : amplitude (px) et période (ms). */
const PICKUP_BOB_PX = 2;
const PICKUP_BOB_MS = 1600;

/**
 * Affichage des checkpoints (placeholder neutre, design ouvert §45) : un petit repère qui s'allume
 * quand il est activé, plus vif s'il est le point de retour courant. Objets de capacité (D-26) :
 * une petite lueur qui flotte ; trouvailles (D-27) : la même, rose (placeholders, nature ouverte).
 */
export class WorldView {
  private sprites: Phaser.GameObjects.Image[] = [];
  private pickupSprites: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly pickups: Pickups,
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
    for (const sprite of this.pickupSprites) {
      sprite.destroy();
    }
    this.pickupSprites = this.pickups.items.map((item) =>
      this.scene.add
        .image(
          (item.col + 0.5) * T,
          (item.row + 0.5) * T,
          item.kind === PickupKind.Secret ? SECRET : PICKUP,
        )
        .setDepth(6)
        .setVisible(!item.taken),
    );
  }

  render(): void {
    const items = this.pickups.items;
    const bob = Math.sin((this.scene.time.now / PICKUP_BOB_MS) * Math.PI * 2) * PICKUP_BOB_PX;
    for (let i = 0; i < items.length; i++) {
      const sprite = this.pickupSprites[i];
      const item = items[i];
      if (sprite && item) {
        sprite.setVisible(!item.taken).setY((item.row + 0.5) * T + bob);
      }
    }
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
    for (const [key, color] of [
      [PICKUP, PLACEHOLDER_COLORS.checkpointLit],
      [SECRET, PLACEHOLDER_COLORS.secret],
    ] as const) {
      const glow = this.scene.make.graphics({}, false);
      const c = PICKUP_SIZE / 2;
      glow.fillStyle(color, 0.3);
      glow.fillCircle(c, c, c);
      glow.fillStyle(color);
      glow.fillTriangle(c, 1, c + 3, c, c - 3, c);
      glow.fillTriangle(c, PICKUP_SIZE - 1, c + 3, c, c - 3, c);
      glow.generateTexture(key, PICKUP_SIZE, PICKUP_SIZE);
      glow.destroy();
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
