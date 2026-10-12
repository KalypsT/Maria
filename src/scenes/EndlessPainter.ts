import type Phaser from 'phaser';
import { LEVEL_CHUNK_TILES, TILE_SIZE as T } from '../config/display';
import { stitch, type EndlessChunk } from '../core/arcade/endless';
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
  readonly y: number;
}

/**
 * Le dessin de la bande du mode Sans fin (D-167) : chaque morceau, dessiné seul (le dessin d'une
 * tuile ne regarde que la tuile du dessus), en blocs de `LEVEL_CHUNK_TILES` comme les salles, et
 * **un bloc par pas** : un morceau préparé à l'avance est dessiné avant que Céleste n'y arrive,
 * sans saccade. Quand la bande retire un morceau, ses images disparaissent et les autres reculent ;
 * rien n'est redessiné. Les deux murs de la bande sont à part.
 */
export class EndlessPainter {
  private readonly images = new Map<number, Phaser.GameObjects.Image[]>();
  private readonly queue: Block[] = [];
  private readonly walls: Phaser.GameObjects.Image[] = [];
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

  /** Un morceau à dessiner, sa jointure à `x` px (`header` : le style de la console). */
  add(chunk: EndlessChunk, header: readonly string[], x: number): void {
    const level = parseAsciiLevel(`endless-paint-${String(chunk.index)}`, stitch([chunk], header));
    for (let row0 = 0; row0 < level.height; row0 += LEVEL_CHUNK_TILES) {
      // Les colonnes du morceau sont de 1 à sa largeur (la colonne 0 est un mur).
      for (let col0 = 1; col0 <= chunk.width; col0 += LEVEL_CHUNK_TILES) {
        this.queue.push({
          chunk: chunk.index,
          level,
          col0,
          cols: Math.min(LEVEL_CHUNK_TILES, chunk.width + 1 - col0),
          row0,
          rows: Math.min(LEVEL_CHUNK_TILES, level.height - row0),
          x: x + (col0 - 1) * T,
          y: row0 * T,
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

  /** Les murs de la bande : la première et la dernière colonne de `level`. */
  setWalls(level: LevelData): void {
    if (this.walls.length === 0) {
      const g = this.canvas();
      g.clear();
      for (let row = 0; row < level.height; row++) {
        this.drawTile(g, level, 0, row, 0, row * T);
      }
      const key = 'endless-wall';
      if (this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }
      g.generateTexture(key, T, level.height * T);
      for (let i = 0; i < 2; i++) {
        this.walls.push(this.scene.add.image(0, 0, key).setOrigin(0, 0));
      }
    }
    this.walls[0]?.setX(0);
    this.walls[1]?.setX((level.width - 1) * T);
  }

  /** Tout recule de `dx` px : le morceau `dropped` disparaît (la bande l'a retiré). */
  shift(dx: number, dropped: number): void {
    for (const image of this.images.get(dropped) ?? []) {
      this.remove(image);
    }
    this.images.delete(dropped);
    for (const list of this.images.values()) {
      for (const image of list) {
        image.x -= dx;
      }
    }
    for (const block of this.queue) {
      block.x -= dx;
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
    for (const wall of this.walls) {
      wall.destroy();
    }
    this.walls.length = 0;
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
