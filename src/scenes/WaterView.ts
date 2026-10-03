import type Phaser from 'phaser';
import { WATER_LIFE } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { Tile, tileAt, type LevelData } from '../core/level/LevelData';

const WAVE_TEXTURE = 'water-wave';
const STRANGE_WAVE_TEXTURE = 'water-wave-strange';
/** Au-dessus du fond et de l'eau dessinée avec lui, sous la lumière et les personnages. */
const WATER_DEPTH = -4.5;

/** Ligne de surface d'une nappe d'eau : une suite de tuiles d'eau sous de l'air. */
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
      // Une surface est sous de l'air : sous une planche ou un rocher, l'eau n'a pas de vaguelettes.
      const top = (c: number) =>
        tileAt(level, c, row) === Tile.Water && tileAt(level, c, row - 1) === Tile.Empty;
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
  /** Vaguelettes d'une seule couche (D-115). */
  private readonly layered: {
    readonly sprite: Phaser.GameObjects.TileSprite;
    readonly layer: 'present' | 'memory';
  }[] = [];
  /** Les vagues (D-99) : la bande d'écume qui balaie, la crête qui monte pendant l'annonce. */
  private waveBand: Phaser.GameObjects.Rectangle | null = null;
  private waveCrest: Phaser.GameObjects.TileSprite | null = null;
  private waveTop = 0;
  private waterTop = 0;

  constructor(private readonly scene: Phaser.Scene) {
    makeWaveTexture(scene, WAVE_TEXTURE, WATER_LIFE.crest, WATER_LIFE.foam);
    makeWaveTexture(scene, STRANGE_WAVE_TEXTURE, WATER_LIFE.strangeCrest, WATER_LIFE.strangeFoam);
  }

  /** `waveRow` : la ligne des vagues (-1 sans vagues), `waterRow` : la première ligne d'eau. */
  load(level: LevelData, strange: boolean, waveRow = -1, waterRow = -1): void {
    this.clear();
    const key = strange ? STRANGE_WAVE_TEXTURE : WAVE_TEXTURE;
    if (waveRow >= 0 && waterRow > waveRow) {
      const width = level.width * T;
      this.waveTop = waveRow * T;
      this.waterTop = waterRow * T;
      this.waveBand = this.scene.add
        .rectangle(0, this.waveTop, width, this.waterTop - this.waveTop, WATER_LIFE.foam)
        .setOrigin(0, 0)
        .setDepth(WATER_DEPTH + 0.1)
        .setAlpha(0);
      this.waveCrest = this.scene.add
        .tileSprite(0, this.waterTop - 3, width, WATER_LIFE.heightPx, key)
        .setOrigin(0, 0)
        .setDepth(WATER_DEPTH + 0.2)
        .setScale(1, 1.6)
        .setVisible(false);
    }
    // L'effacement (D-111) : pas de vaguelettes, il ne bouge pas.
    const erasure = level.meta.void === 'erasure';
    for (const s of erasure ? [] : waterSurfaces(level)) {
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

  /**
   * L'eau d'une seule couche (D-115, la marée haute du présent) : les vaguelettes des nappes qui
   * n'existent que dans le présent ou que dans le souvenir, montrées selon la couche active
   * (`showLayer`). Après `load` (la salle sans ses zones).
   */
  loadLayers(present: LevelData, memory: LevelData, strange: boolean): void {
    const key = strange ? STRANGE_WAVE_TEXTURE : WAVE_TEXTURE;
    const keyOf = (s: WaterSurface) => `${String(s.row)}:${String(s.colStart)}:${String(s.colEnd)}`;
    const inPresent = waterSurfaces(present);
    const inMemory = waterSurfaces(memory);
    const both = new Set(inPresent.map(keyOf).filter((k) => inMemory.some((m) => keyOf(m) === k)));
    for (const [layer, surfaces] of [
      ['present', inPresent],
      ['memory', inMemory],
    ] as const) {
      for (const s of surfaces) {
        if (both.has(keyOf(s))) {
          continue;
        }
        const width = (s.colEnd - s.colStart + 1) * T;
        for (let k = 0; k < 2; k++) {
          const sprite = this.scene.add
            .tileSprite(s.colStart * T, s.row * T - 2 + k, width, WATER_LIFE.heightPx, key)
            .setOrigin(0, 0)
            .setDepth(WATER_DEPTH)
            .setAlpha(k === 0 ? 1 : 0.5)
            .setVisible(layer === 'present');
          this.layers.push(sprite);
          this.layered.push({ sprite, layer });
        }
      }
    }
  }

  /** Montre les vaguelettes de la couche active (D-115). */
  showLayer(layer: 'present' | 'memory'): void {
    for (const { sprite, layer: of } of this.layered) {
      sprite.setVisible(of === layer);
    }
  }

  clear(): void {
    for (const sprite of this.layers) {
      sprite.destroy();
    }
    this.layers.length = 0;
    this.layered.length = 0;
    this.waveBand?.destroy();
    this.waveCrest?.destroy();
    this.waveBand = null;
    this.waveCrest = null;
  }

  /**
   * Les vagues (D-99), une fois par image : pendant l'annonce (`warn` de 0 à 1), la crête d'écume
   * monte de l'eau jusqu'à la ligne des vagues ; quand elle balaie, la bande d'écume (`passing`).
   */
  updateWaves(nowMs: number, warn: number, passing: boolean): void {
    const band = this.waveBand;
    const crest = this.waveCrest;
    if (!band || !crest) {
      return;
    }
    band.setAlpha(passing ? WATER_LIFE.waveBandAlpha : 0);
    const k = passing ? 1 : warn;
    crest.setVisible(passing || warn >= 0);
    crest.y = this.waterTop - 3 - (this.waterTop - this.waveTop) * Math.max(0, k);
    crest.tilePositionX = (nowMs / 1000) * WATER_LIFE.speedPxPerS * 4;
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
