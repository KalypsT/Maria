import type Phaser from 'phaser';
import { LEVEL_CHUNK_TILES, TILE_SIZE as T } from '../config/display';
import { CONSOLE_TILE_COLORS } from '../config/arcade';
import { stitch, type EndlessChunk, type FrameRect } from '../core/arcade/endless';
import { commonLayer } from '../core/level/layers';
import type { LevelData } from '../core/level/LevelData';
import { parseAsciiLevel } from '../core/level/parseAsciiLevel';

/** Dessine une tuile de `level` à (x, y) dans un bloc ; retourne faux si elle est vide. */
export type DrawTile = (
  g: Phaser.GameObjects.Graphics,
  level: LevelData,
  col: number,
  row: number,
  x: number,
  y: number,
) => boolean;

/** Un bloc à dessiner : des colonnes et des lignes d'un morceau, et sa place (px). */
interface Block {
  readonly chunk: number;
  readonly level: LevelData;
  readonly col0: number;
  readonly cols: number;
  readonly row0: number;
  readonly rows: number;
  x: number;
  y: number;
}

/**
 * Le dessin de la bande du mode Sans fin (D-167) : chaque morceau, dessiné seul (le dessin d'une
 * tuile ne regarde que la tuile du dessus), en blocs de `LEVEL_CHUNK_TILES` comme les salles, et
 * **un bloc par pas** : un morceau préparé à l'avance est dessiné avant que Céleste n'y arrive,
 * sans saccade. Quand la bande retire un morceau, ses images disparaissent et les autres reculent ;
 * rien n'est redessiné. Le cadre de la bande (sa bordure, et ce qu'aucun morceau ne couvre) est un
 * seul dessin à part, refait au recul (quelques rectangles).
 */
export class EndlessPainter {
  private readonly images = new Map<number, Phaser.GameObjects.Image[]>();
  private readonly queue: Block[] = [];
  private frame: Phaser.GameObjects.Graphics | null = null;
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private serial = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly drawTile: DrawTile,
  ) {}

  /** Des blocs attendent d'être dessinés. */
  get pending(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Un morceau à dessiner, la case de sa première colonne et de sa première ligne à (`x`, `y`) px
   * (`header` : le style de la console).
   */
  add(chunk: EndlessChunk, header: readonly string[], x: number, y: number): void {
    // Les zones d'une seule couche (les deux mondes) sont dessinées à part (`ShiftLayerView`).
    const level = commonLayer(
      parseAsciiLevel(`endless-paint-${String(chunk.index)}`, stitch([chunk], header)),
    );
    // Les lignes et les colonnes du morceau sont de 1 à sa taille (autour : le cadre).
    const rows = chunk.lines.length;
    for (let row0 = 1; row0 <= rows; row0 += LEVEL_CHUNK_TILES) {
      for (let col0 = 1; col0 <= chunk.width; col0 += LEVEL_CHUNK_TILES) {
        this.queue.push({
          chunk: chunk.index,
          level,
          col0,
          cols: Math.min(LEVEL_CHUNK_TILES, chunk.width + 1 - col0),
          row0,
          rows: Math.min(LEVEL_CHUNK_TILES, rows + 1 - row0),
          x: x + (col0 - 1) * T,
          y: y + (row0 - 1) * T,
        });
      }
    }
  }

  /** Dessine au plus `count` blocs en attente. */
  step(count = 1): void {
    for (let i = 0; i < count; i++) {
      const block = this.queue.shift();
      if (!block) {
        return;
      }
      this.paint(block);
    }
  }

  /** Dessine tout ce qui attend, tout de suite. */
  finish(): void {
    this.step(this.queue.length);
  }

  /** Le cadre de la bande : ses rectangles pleins (`frameRects`). */
  setFrame(rects: readonly FrameRect[]): void {
    const g = (this.frame ??= this.scene.add.graphics());
    g.clear();
    for (const r of rects) {
      g.fillStyle(CONSOLE_TILE_COLORS.frame);
      g.fillRect(r.col * T, r.row * T, r.width * T, r.height * T);
      if (r.edge) {
        g.fillStyle(CONSOLE_TILE_COLORS.frameEdge);
        g.fillRect(r.col * T, r.row * T, r.width * T, 2);
      }
    }
  }

  /** Tout se déplace de (`dx`, `dy`) px : le morceau `dropped` disparaît (la bande l'a retiré). */
  shift(dx: number, dy: number, dropped: number): void {
    for (const image of this.images.get(dropped) ?? []) {
      this.remove(image);
    }
    this.images.delete(dropped);
    for (const list of this.images.values()) {
      for (const image of list) {
        image.x += dx;
        image.y += dy;
      }
    }
    for (const block of this.queue) {
      block.x += dx;
      block.y += dy;
    }
  }

  /** La partie est finie : plus rien. */
  clear(): void {
    for (const list of this.images.values()) {
      for (const image of list) {
        this.remove(image);
      }
    }
    this.images.clear();
    this.queue.length = 0;
    this.frame?.clear();
  }

  private paint(block: Block): void {
    const g = this.canvas();
    g.clear();
    let drawn = false;
    for (let row = block.row0; row < block.row0 + block.rows; row++) {
      for (let col = block.col0; col < block.col0 + block.cols; col++) {
        drawn =
          this.drawTile(g, block.level, col, row, (col - block.col0) * T, (row - block.row0) * T) ||
          drawn;
      }
    }
    if (!drawn) {
      return;
    }
    const key = `endless-${String(this.serial++)}`;
    g.generateTexture(key, block.cols * T, block.rows * T);
    const image = this.scene.add.image(block.x, block.y, key).setOrigin(0, 0);
    const list = this.images.get(block.chunk) ?? [];
    list.push(image);
    this.images.set(block.chunk, list);
  }

  private remove(image: Phaser.GameObjects.Image): void {
    const key = image.texture.key;
    image.destroy();
    this.scene.textures.remove(key);
  }

  private canvas(): Phaser.GameObjects.Graphics {
    this.graphics ??= this.scene.make.graphics({}, false);
    return this.graphics;
  }
}
