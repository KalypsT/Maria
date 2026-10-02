import type Phaser from 'phaser';
import { WATER_LIFE } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { Tile, tileAt, type LevelData } from '../core/level/LevelData';

const WAVE_TEXTURE = 'water-wave';
const STRANGE_WAVE_TEXTURE = 'water-wave-strange';
/** Au-dessus du fond et de l'eau dessinée avec lui, sous la lumière et les personnages. */
const WATER_DEPTH = -4.5;

/** Ligne de surface d'une nappe d'eau : une suite de tuiles d'eau sans eau au-dessus. */
export interface WaterSurface {
  readonly row: number;
  readonly colStart: number;
  /** Dernière colonne comprise. */
  readonly colEnd: number;
}

/** Surfaces de l'eau d'une salle (D-97), de haut en bas puis de gauche à droite. */
export function waterSurfaces(level: LevelData): WaterSurface[] {
  const found: WaterSurface[] = [];
  for (let row = 0; row < level.height; row++) {
    let col = 0;
    while (col < level.width) {
      const top = (c: number) =>
        tileAt(level, c, row) === Tile.Water && tileAt(level, c, row - 1) !== Tile.Water;
      if (!top(col)) {
        col++;
        continue;
      }
      const colStart = col;
      while (col < level.width && top(col)) {
        col++;
      }
      found.push({ row, colStart, colEnd: col - 1 });
    }
  }
  return found;
}

/** Une bande de vaguelettes (motif périodique sans couture), claire sur transparent. */
function makeWaveTexture(scene: Phaser.Scene, key: string, crest: number, foam: number): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const { periodPx: w, heightPx: h } = WATER_LIFE;
  const g = scene.make.graphics({}, false);
  g.fillStyle(crest, 0.85);
  for (let x = 0; x < w; x++) {
    const y = 2 + Math.round(Math.sin((x / w) * Math.PI * 4) * 1.2);
    g.fillRect(x, y, 1, 1.5);
  }
  g.fillStyle(foam, 0.6);
  for (let x = 3; x < w; x += 9) {
    g.fillRect(x, h - 2, 2, 1);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

/**
 * La surface de l'eau (D-97), visuel seulement : une bande de vaguelettes par nappe, deux couches qui
 * défilent lentement en sens contraires. Créées au chargement de la salle, aucune création en jeu.
 */
export class WaterView {
  private readonly layers: Phaser.GameObjects.TileSprite[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    makeWaveTexture(scene, WAVE_TEXTURE, WATER_LIFE.crest, WATER_LIFE.foam);
    makeWaveTexture(scene, STRANGE_WAVE_TEXTURE, WATER_LIFE.strangeCrest, WATER_LIFE.strangeFoam);
  }

  load(level: LevelData, strange: boolean): void {
    this.clear();
    const key = strange ? STRANGE_WAVE_TEXTURE : WAVE_TEXTURE;
    for (const s of waterSurfaces(level)) {
      const width = (s.colEnd - s.colStart + 1) * T;
      for (let layer = 0; layer < 2; layer++) {
        const sprite = this.scene.add
          .tileSprite(s.colStart * T, s.row * T - 2 + layer, width, WATER_LIFE.heightPx, key)
          .setOrigin(0, 0)
          .setDepth(WATER_DEPTH)
          .setAlpha(layer === 0 ? 1 : 0.5);
        this.layers.push(sprite);
      }
    }
  }

  clear(): void {
    for (const sprite of this.layers) {
      sprite.destroy();
    }
    this.layers.length = 0;
  }

  /** Une fois par image : les vaguelettes défilent (deux couches en sens contraires). */
  update(nowMs: number): void {
    const shift = (nowMs / 1000) * WATER_LIFE.speedPxPerS;
    for (let i = 0; i < this.layers.length; i++) {
      const sprite = this.layers[i];
      if (sprite) {
        sprite.tilePositionX = i % 2 === 0 ? shift : -shift * 0.6;
      }
    }
  }
}
