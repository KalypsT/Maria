import Phaser from 'phaser';
import type { ArtPalette } from '../config/art';
import { LEVEL_CHUNK_TILES, TILE_SIZE as T } from '../config/display';
import type { LevelData } from '../core/level/LevelData';
import { drawRoomBackground, drawRoomLight, type ArtContext } from './art/roomArt';

/** Profondeurs : le fond sous tout ; la lumière sous les personnages, qui restent lisibles. */
const BACKGROUND_DEPTH = -5;
const LIGHT_DEPTH = 4;

/**
 * Habillage d'une salle (D-28) : fond et lumière dessinés une fois au chargement, par blocs, dans
 * des textures à l'échelle de l'écran (net en mode « résolution de l'écran », D-18).
 */
export class RoomArtView {
  private readonly images: Phaser.GameObjects.Image[] = [];
  private readonly scratch = document.createElement('canvas');

  constructor(private readonly scene: Phaser.Scene) {}

  /** Retire l'habillage courant (textures comprises). */
  clear(): void {
    for (const image of this.images) {
      const key = image.texture.key;
      image.destroy();
      this.scene.textures.remove(key);
    }
    this.images.length = 0;
  }

  /** Dessine la salle ; sans effet (et faux) si elle n'est pas habillée. */
  build(
    level: LevelData,
    palette: Readonly<ArtPalette>,
    scale: number,
    images: ReadonlyMap<string, CanvasImageSource>,
  ): boolean {
    this.clear();
    if (level.decor.length === 0) {
      return false;
    }
    this.bake(level, 'bg', scale, BACKGROUND_DEPTH, (ctx) => {
      drawRoomBackground({ ctx, level, palette, images });
    });
    this.bake(level, 'light', scale, LIGHT_DEPTH, (ctx) => {
      const context: ArtContext = { ctx, level, palette, images };
      drawRoomLight(context, this.scratch);
    });
    this.scratch.width = this.scratch.height = 1;
    return true;
  }

  private bake(
    level: LevelData,
    layer: string,
    scale: number,
    depth: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ): void {
    const chunkPx = LEVEL_CHUNK_TILES * T;
    const textures = this.scene.textures;
    for (let y0 = 0; y0 < level.height * T; y0 += chunkPx) {
      for (let x0 = 0; x0 < level.width * T; x0 += chunkPx) {
        const w = Math.min(chunkPx, level.width * T - x0);
        const h = Math.min(chunkPx, level.height * T - y0);
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(w * scale);
        canvas.height = Math.ceil(h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          continue;
        }
        ctx.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
        draw(ctx);
        const key = `art-${level.id}-${layer}-${String(x0)}-${String(y0)}`;
        if (textures.exists(key)) {
          textures.remove(key);
        }
        const texture = textures.addCanvas(key, canvas);
        texture?.setFilter(Phaser.Textures.FilterMode.LINEAR);
        this.images.push(
          this.scene.add
            .image(x0, y0, key)
            .setOrigin(0, 0)
            .setScale(1 / scale)
            .setDepth(depth),
        );
      }
    }
  }
}
