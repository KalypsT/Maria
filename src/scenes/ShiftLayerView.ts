import Phaser from 'phaser';
import { SHIFT_LAYER_VIEW, type ArtFinish, type ArtPalette } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { atLayer } from '../core/level/layers';
import { Tile, type Layer, type LevelData, type TileRect } from '../core/level/LevelData';
import { drawRoomLayer, floorRow, type ArtContext } from './art/roomArt';

/** Au-dessus du fond et de l'eau, sous les personnages et la lumière. */
const LAYER_DEPTH = -4;
/** Le voile chaud du souvenir : au-dessus de la lumière, sous l'interface. */
const VEIL_DEPTH = 5;
const SIGN_DEPTH = 9;
/** Marge autour d'une zone dessinée (px logiques) : ombres et liserés qui débordent un peu. */
const PAD = 6;
const LAYERS: readonly Layer[] = ['present', 'memory'];

/** De quoi dessiner une salle habillée (D-28) : les palettes des deux couches, la finition. */
export interface LayerArt {
  readonly present: Readonly<ArtPalette>;
  readonly memory: Readonly<ArtPalette>;
  readonly finish: Readonly<ArtFinish>;
  readonly scale: number;
  readonly images: ReadonlyMap<string, CanvasImageSource>;
}

/**
 * Les deux couches d'une salle (la bascule, D-107). Ce qui n'existe que dans une couche est dessiné
 * à part, zone par zone : plein dans la couche active, en **contour fantôme** dans l'autre (pour
 * prévoir). Une salle habillée dessine ses zones avec l'habillage : le présent dans la palette de la
 * salle (les silhouettes du monde étrange), le souvenir dans les couleurs chaudes et passées des
 * courts souvenirs ; une salle de tuiles (les parcours) les dessine en tuiles. Tout est créé au
 * chargement de la salle ; basculer ne fait que changer des visibilités (aucune création en jeu).
 * Dans le souvenir, un voile chaud recouvre la vue. Le petit signe du refus et l'éclair de la bascule.
 */
export class ShiftLayerView {
  private readonly filled: Record<Layer, Phaser.GameObjects.Graphics>;
  private readonly ghost: Record<Layer, Phaser.GameObjects.Graphics>;
  /** Images des zones d'une salle habillée (pleines, fantômes), par couche. */
  private readonly images: Record<Layer, Phaser.GameObjects.Image[]> = { present: [], memory: [] };
  private readonly ghostImages: Record<Layer, Phaser.GameObjects.Image[]> = {
    present: [],
    memory: [],
  };
  private readonly textureKeys: string[] = [];
  private readonly veil: Phaser.GameObjects.Rectangle;
  private readonly sign: Phaser.GameObjects.Graphics;
  private readonly scratch = document.createElement('canvas');
  private signStart = -1;
  private signKind: 'refuse' | 'flash' = 'refuse';
  private active: Layer = 'present';
  private layered = false;

  constructor(private readonly scene: Phaser.Scene) {
    const make = () => scene.add.graphics().setDepth(LAYER_DEPTH).setVisible(false);
    this.filled = { present: make(), memory: make() };
    this.ghost = { present: make(), memory: make() };
    const v = SHIFT_LAYER_VIEW;
    // Plus grand que tout écran : fixe dans la vue, il n'a pas à suivre les redimensionnements.
    this.veil = scene.add
      .rectangle(0, 0, 8192, 8192, v.memoryVeil, v.memoryVeilAlpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(VEIL_DEPTH)
      .setVisible(false);
    this.sign = scene.add.graphics().setDepth(SIGN_DEPTH).setVisible(false);
  }

  /**
   * Nouvelle salle : prépare ses deux couches (rien sans couches). `art` : salle habillée (null :
   * une salle de tuiles).
   */
  load(level: LevelData, art: LayerArt | null): void {
    this.clear();
    const layers = level.layers;
    this.layered = layers !== null;
    if (layers) {
      for (const layer of LAYERS) {
        const rects = layers[layer];
        if (art) {
          rects.forEach((r, i) => {
            this.bake(level, layer, r, i, art);
          });
        } else {
          this.drawTiles(layer, rects, layers.rawTiles, level.width);
        }
      }
    }
    this.show('present');
  }

  /** La couche active (les autres dessins restent créés). */
  show(layer: Layer): void {
    this.active = layer;
    for (const l of LAYERS) {
      const on = l === layer;
      this.filled[l].setVisible(on);
      this.ghost[l].setVisible(!on);
      for (const image of this.images[l]) {
        image.setVisible(on);
      }
      for (const image of this.ghostImages[l]) {
        image.setVisible(!on);
      }
    }
    this.veil.setVisible(this.layered && layer === 'memory');
  }

  /** Bascule refusée : le petit signe autour de Céleste. */
  refuse(now: number): void {
    this.signKind = 'refuse';
    this.signStart = now;
  }

  /** Bascule réussie : un éclair bref. */
  flash(now: number): void {
    this.signKind = 'flash';
    this.signStart = now;
  }

  /** Une image : le signe suit Céleste (x, y : centre, px). */
  render(now: number, x: number, y: number): void {
    const sign = this.sign;
    const v = SHIFT_LAYER_VIEW;
    const total = this.signKind === 'refuse' ? v.refuseMs : v.flashMs;
    const t = this.signStart < 0 ? 1 : (now - this.signStart) / total;
    if (t >= 1) {
      if (sign.visible) {
        sign.setVisible(false);
        this.signStart = -1;
      }
      return;
    }
    sign.clear();
    sign.setVisible(true);
    if (this.signKind === 'refuse') {
      // L'autre couche ne laisse pas passer : un cercle de sa couleur qui s'ouvre et s'efface.
      const other = v[this.active === 'present' ? 'memory' : 'present'];
      sign.lineStyle(1.5, other.edge, 1 - t);
      sign.strokeCircle(x, y, v.refuseRadiusPx * (0.6 + 0.6 * t));
    } else {
      sign.fillStyle(v[this.active].edge, 0.35 * (1 - t));
      sign.fillCircle(x, y, v.refuseRadiusPx * (1 + t));
    }
  }

  private clear(): void {
    for (const layer of LAYERS) {
      this.filled[layer].clear();
      this.ghost[layer].clear();
      for (const image of [...this.images[layer], ...this.ghostImages[layer]]) {
        image.destroy();
      }
      this.images[layer].length = 0;
      this.ghostImages[layer].length = 0;
    }
    for (const key of this.textureKeys) {
      this.scene.textures.remove(key);
    }
    this.textureKeys.length = 0;
  }

  /** Une zone d'une salle habillée : son dessin plein et son contour fantôme, deux textures. */
  private bake(level: LevelData, layer: Layer, r: TileRect, index: number, art: LayerArt): void {
    const variant = atLayer(level, layer);
    const { width } = level;
    const tiles = new Uint8Array(variant.tiles.length);
    const materials = new Uint8Array(variant.materials.length);
    for (let row = r.row; row < r.row + r.height; row++) {
      for (let col = r.col; col < r.col + r.width; col++) {
        const i = row * width + col;
        tiles[i] = variant.tiles[i] ?? Tile.Empty;
        materials[i] = variant.materials[i] ?? 0;
      }
    }
    const inside = (d: TileRect) =>
      d.col >= r.col &&
      d.row >= r.row &&
      d.col + d.width <= r.col + r.width &&
      d.row + d.height <= r.row + r.height;
    const only: LevelData = {
      ...variant,
      tiles,
      materials,
      decor: variant.decor.filter(inside),
      entities: [],
      cables: [],
    };
    const x0 = r.col * T - PAD;
    const y0 = r.row * T - PAD;
    const w = r.width * T + 2 * PAD;
    const h = r.height * T + 2 * PAD;
    const scale = art.scale;
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
      level: only,
      palette: art[layer],
      images: art.images,
      clip: { x: x0, y: y0, w, h },
    };
    const floorY = floorRow(level) * T;
    drawRoomLayer(context, this.scratch, art.finish, floorY);
    // Le contour fantôme suit les formes, pas leurs ombres : un second dessin, sans ombre.
    const bare = document.createElement('canvas');
    bare.width = canvas.width;
    bare.height = canvas.height;
    const bctx = bare.getContext('2d');
    if (bctx) {
      bctx.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
      const flat = { ...art.finish, playShadow: 0, contactShadow: 0 };
      drawRoomLayer({ ...context, ctx: bctx }, this.scratch, flat, floorY);
    }
    this.scratch.width = this.scratch.height = 1;
    const ghost = outline(bare, SHIFT_LAYER_VIEW[layer].edge, scale);
    const key = `shift-${level.id}-${layer}-${String(index)}`;
    for (const [suffix, source, list] of [
      ['', canvas, this.images[layer]],
      ['-ghost', ghost, this.ghostImages[layer]],
    ] as const) {
      const textures = this.scene.textures;
      if (textures.exists(key + suffix)) {
        textures.remove(key + suffix);
      }
      textures.addCanvas(key + suffix, source)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.textureKeys.push(key + suffix);
      const image = this.scene.add
        .image(x0, y0, key + suffix)
        .setOrigin(0, 0)
        .setScale(1 / scale)
        .setDepth(LAYER_DEPTH)
        .setVisible(false);
      if (suffix) {
        image.setAlpha(SHIFT_LAYER_VIEW.ghostAlpha);
      }
      list.push(image);
    }
  }

  /** Une salle de tuiles (les parcours) : les tuiles de la couche, pleines et en contour. */
  private drawTiles(
    layer: Layer,
    rects: readonly TileRect[],
    tiles: Uint8Array,
    width: number,
  ): void {
    const colors = SHIFT_LAYER_VIEW[layer];
    const filled = this.filled[layer];
    const ghost = this.ghost[layer];
    ghost.lineStyle(SHIFT_LAYER_VIEW.ghostLine, colors.edge, SHIFT_LAYER_VIEW.ghostAlpha);
    for (const r of rects) {
      for (let row = r.row; row < r.row + r.height; row++) {
        for (let col = r.col; col < r.col + r.width; col++) {
          const tile = tiles[row * width + col];
          const x = col * T;
          const y = row * T;
          if (tile === Tile.Solid || tile === Tile.OneWay) {
            const h = tile === Tile.OneWay ? 4 : T;
            filled.fillStyle(colors.fill);
            filled.fillRect(x, y, T, h);
            filled.fillStyle(colors.edge);
            filled.fillRect(x, y, T, 2);
            ghost.strokeRect(x + 0.5, y + 0.5, T - 1, h - 1);
          } else if (tile === Tile.Hazard || tile === Tile.Thorns) {
            filled.fillStyle(colors.edge, 0.8);
            filled.fillTriangle(x, y + T, x + T / 2, y + 6, x + T, y + T);
            ghost.strokeTriangle(x, y + T, x + T / 2, y + 6, x + T, y + T);
          }
        }
      }
    }
  }
}

/**
 * Contour fantôme d'un dessin (D-107) : sa silhouette d'une couleur, épaissie de quelques px, moins
 * la silhouette elle-même ; à l'intérieur, un voile très léger de la même couleur.
 */
function outline(source: HTMLCanvasElement, color: number, scale: number): HTMLCanvasElement {
  const css = `#${color.toString(16).padStart(6, '0')}`;
  const silhouette = document.createElement('canvas');
  silhouette.width = source.width;
  silhouette.height = source.height;
  const sctx = silhouette.getContext('2d');
  const result = document.createElement('canvas');
  result.width = source.width;
  result.height = source.height;
  const rctx = result.getContext('2d');
  if (!sctx || !rctx) {
    return result;
  }
  sctx.drawImage(source, 0, 0);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = css;
  sctx.fillRect(0, 0, silhouette.width, silhouette.height);
  const o = Math.max(1, Math.round(SHIFT_LAYER_VIEW.ghostLine * scale));
  for (const [dx, dy] of [
    [o, 0],
    [-o, 0],
    [0, o],
    [0, -o],
  ] as const) {
    rctx.drawImage(silhouette, dx, dy);
  }
  rctx.globalCompositeOperation = 'destination-out';
  rctx.drawImage(silhouette, 0, 0);
  rctx.globalCompositeOperation = 'source-over';
  rctx.globalAlpha = SHIFT_LAYER_VIEW.ghostFillAlpha;
  rctx.drawImage(silhouette, 0, 0);
  return result;
}
