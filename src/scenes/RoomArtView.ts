import Phaser from 'phaser';
import type { ArtPalette } from '../config/art';
import { LEVEL_CHUNK_TILES, TILE_SIZE as T } from '../config/display';
import type { LevelData } from '../core/level/LevelData';
import { drawRoomBackground, drawRoomLight, type ArtContext, type Rect } from './art/roomArt';

/** Profondeurs : le fond sous tout ; la lumière sous les personnages, qui restent lisibles. */
const BACKGROUND_DEPTH = -5;
const LIGHT_DEPTH = 4;

/** Marge (px logiques) autour de la vue où les blocs sont préparés à l'avance (un bloc). */
const PREPARE_MARGIN = LEVEL_CHUNK_TILES * T;
/** Au-delà de cette marge autour de la vue, un bloc préparé est libéré (mémoire graphique). */
const RELEASE_MARGIN = 2 * LEVEL_CHUNK_TILES * T;

interface ArtChunk {
  readonly layer: 'bg' | 'light';
  readonly x0: number;
  readonly y0: number;
  readonly w: number;
  readonly h: number;
  image: Phaser.GameObjects.Image | null;
}

/**
 * Habillage d'une salle (D-28) : fond et lumière, par blocs, dans des textures à l'échelle de
 * l'écran (net en mode « résolution de l'écran », D-18). D-60 : seuls les blocs proches de la vue
 * sont dessinés (un bloc par image, tous d'un coup dans le noir) et les blocs lointains sont
 * libérés : une salle très longue (la rue) ne coûte pas plus qu'une salle de la maison.
 */
export class RoomArtView {
  private readonly chunks: ArtChunk[] = [];
  private readonly scratch = document.createElement('canvas');
  private level: LevelData | null = null;
  private palette: Readonly<ArtPalette> | null = null;
  private images: ReadonlyMap<string, CanvasImageSource> = new Map();
  private scale = 1;
  /** Vrai juste après `build` : la première mise à jour dessine tout ce qui est visible. */
  private fresh = false;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Nombre de blocs dessinés en ce moment (outil de debug). */
  get preparedCount(): number {
    return this.chunks.reduce((n, chunk) => n + (chunk.image ? 1 : 0), 0);
  }

  /** Retire l'habillage courant (textures comprises). */
  clear(): void {
    for (const chunk of this.chunks) {
      this.release(chunk);
    }
    this.chunks.length = 0;
    this.level = null;
  }

  /**
   * Prépare l'habillage de la salle (rien n'est encore dessiné : voir `update`) ; sans effet (et
   * faux) si elle n'est pas habillée.
   */
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
    this.level = level;
    this.palette = palette;
    this.scale = scale;
    this.images = images;
    this.fresh = true;
    const chunkPx = LEVEL_CHUNK_TILES * T;
    for (const layer of ['bg', 'light'] as const) {
      for (let y0 = 0; y0 < level.height * T; y0 += chunkPx) {
        for (let x0 = 0; x0 < level.width * T; x0 += chunkPx) {
          const w = Math.min(chunkPx, level.width * T - x0);
          const h = Math.min(chunkPx, level.height * T - y0);
          this.chunks.push({ layer, x0, y0, w, h, image: null });
        }
      }
    }
    return true;
  }

  /**
   * Dessine les blocs proches de la vue (px logiques) et libère les lointains. Un seul bloc par
   * image, sauf dans le noir (`dark`) ou juste après `build` : tout ce qui manque d'un coup.
   */
  update(view: Readonly<Rect>, dark: boolean): void {
    if (!this.level) {
      return;
    }
    const all = dark || this.fresh;
    this.fresh = false;
    let budget = all ? Infinity : 1;
    for (const chunk of this.chunks) {
      if (chunk.image) {
        if (!near(chunk, view, RELEASE_MARGIN)) {
          this.release(chunk);
        }
      } else if (budget > 0 && near(chunk, view, all ? 0 : PREPARE_MARGIN)) {
        // Dans le noir, seulement le visible ; le reste suit, un bloc par image.
        this.bake(chunk);
        budget--;
      }
    }
    if (!all) {
      return;
    }
    // Premier affichage : la marge est préparée aussi, sans attendre (l'écran est noir).
    for (const chunk of this.chunks) {
      if (!chunk.image && near(chunk, view, PREPARE_MARGIN)) {
        this.bake(chunk);
      }
    }
  }

  private release(chunk: ArtChunk): void {
    const image = chunk.image;
    if (!image) {
      return;
    }
    const key = image.texture.key;
    image.destroy();
    this.scene.textures.remove(key);
    chunk.image = null;
  }

  private bake(chunk: ArtChunk): void {
    const level = this.level;
    const palette = this.palette;
    if (!level || !palette) {
      return;
    }
    const scale = this.scale;
    const { x0, y0, w, h } = chunk;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
    const context: ArtContext = {
      ctx,
      level,
      palette,
      images: this.images,
      clip: { x: x0, y: y0, w, h },
    };
    if (chunk.layer === 'bg') {
      drawRoomBackground(context);
    } else {
      drawRoomLight(context, this.scratch);
      this.scratch.width = this.scratch.height = 1;
    }
    const key = `art-${level.id}-${chunk.layer}-${String(x0)}-${String(y0)}`;
    const textures = this.scene.textures;
    if (textures.exists(key)) {
      textures.remove(key);
    }
    const texture = textures.addCanvas(key, canvas);
    texture?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    chunk.image = this.scene.add
      .image(x0, y0, key)
      .setOrigin(0, 0)
      .setScale(1 / scale)
      .setDepth(chunk.layer === 'bg' ? BACKGROUND_DEPTH : LIGHT_DEPTH);
  }
}

/** Le bloc touche-t-il la vue élargie de `margin` ? */
function near(chunk: ArtChunk, view: Readonly<Rect>, margin: number): boolean {
  return (
    chunk.x0 < view.x + view.w + margin &&
    chunk.x0 + chunk.w > view.x - margin &&
    chunk.y0 < view.y + view.h + margin &&
    chunk.y0 + chunk.h > view.y - margin
  );
}
