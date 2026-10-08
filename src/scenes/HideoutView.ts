import Phaser from 'phaser';
import { HIDEOUT } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { approachAlpha, hideTarget } from '../core/fx/hideouts';
import type { LevelData } from '../core/level/LevelData';
import type { Box } from '../core/physics/gridCollision';
import { drawHideout } from './art/hideoutArt';

/**
 * Les cachettes de la salle (D-148) : dessinées une fois par salle, au premier plan ; chacune
 * s'efface quand Céleste passe derrière. Sans allocation par image.
 */
export class HideoutView {
  private sprites: Phaser.GameObjects.Image[] = [];
  private level: LevelData | null = null;
  /** Opacité de chaque cachette (1 : elle cache). */
  readonly alphas: number[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  /** Nouvelle salle, ou échelle de l'écran (D-28) changée : les cachettes redessinées. */
  load(level: LevelData, scale: number, night: boolean): void {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.level = level;
    const hides = level.hides ?? [];
    this.alphas.length = 0;
    this.sprites = hides.map((hide, i) => {
      const key = `hideout-${String(i)}`;
      const w = hide.width * T;
      const h = hide.height * T;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(w * scale);
      canvas.height = Math.ceil(h * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        drawHideout(ctx, hide.kind, w, h, night);
      }
      const textures = this.scene.textures;
      if (textures.exists(key)) {
        textures.remove(key);
      }
      textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.alphas.push(1);
      return this.scene.add
        .image(hide.col * T, hide.row * T, key)
        .setOrigin(0, 0)
        .setScale(1 / scale)
        .setDepth(HIDEOUT.depth);
    });
  }

  /** Chaque image : l'opacité suit Céleste (effacée derrière la cachette). */
  update(player: Box, dtMs: number): void {
    const hides = this.level?.hides ?? [];
    for (let i = 0; i < hides.length; i++) {
      const hide = hides[i];
      const sprite = this.sprites[i];
      if (!hide || !sprite) {
        continue;
      }
      const target = hideTarget(hide, player, HIDEOUT.marginPx, HIDEOUT.fadedAlpha);
      const alpha = approachAlpha(this.alphas[i] ?? 1, target, dtMs, HIDEOUT.fadeTimeMs);
      this.alphas[i] = alpha;
      sprite.setAlpha(alpha);
    }
  }
}
