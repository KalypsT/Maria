import Phaser from 'phaser';
import { ERASURE_COLORS, SHIFT_LAYER_VIEW, type ArtFinish, type ArtPalette } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { erasedLevel } from '../core/level/erase';
import { atLayer, rawOf } from '../core/level/layers';
import {
  LayerMask,
  Tile,
  type Layer,
  type LevelData,
  type TileRect,
} from '../core/level/LevelData';
import { drawRoomLayer, floorRow, type ArtContext } from './art/roomArt';

/** Au-dessus du fond et de l'eau, sous les personnages et la lumière. */
const LAYER_DEPTH = -4;
/** L'annonce de l'effacement, juste au-dessus des couches. */
const WHITEN_DEPTH = -3.9;
/** Le voile chaud du souvenir : au-dessus de la lumière, sous l'interface. */
const VEIL_DEPTH = 5;
const SIGN_DEPTH = 9;
/** Marge autour d'une zone dessinée (px logiques) : ombres et liserés qui débordent un peu. */
const PAD = 6;
const LAYERS: readonly Layer[] = ['present', 'memory'];
const BIT: Readonly<Record<Layer, number>> = {
  present: LayerMask.Present,
  memory: LayerMask.Memory,
};

/** De quoi dessiner une salle habillée (D-28) : les palettes des deux couches, la finition. */
export interface LayerArt {
  readonly present: Readonly<ArtPalette>;
  readonly memory: Readonly<ArtPalette>;
  readonly finish: Readonly<ArtFinish>;
  readonly scale: number;
  readonly images: ReadonlyMap<string, CanvasImageSource>;
}

type Shown = Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

/**
 * Une zone dessinée à part : une zone `; @shift:` (groupe -1), ou un groupe de l'effacement dans
 * une couche (D-111). Son dessin plein et son contour fantôme.
 */
interface Area {
  readonly layer: Layer;
  readonly group: number;
  readonly rects: readonly TileRect[];
  readonly filled: Shown;
  readonly ghost: Shown;
}

/** Ce que l'effacement donne à la vue : les couches de chaque groupe et leurs annonces. */
export interface EraseShown {
  readonly masks: ArrayLike<number>;
  /** Couches visées par l'annonce en cours de chaque groupe (-1 : aucune). */
  readonly target: ArrayLike<number>;
  announce(group: number): number;
}

/**
 * Les deux couches d'une salle (la bascule, D-107). Ce qui n'existe que dans une couche est dessiné
 * à part, zone par zone : plein dans la couche active, en **contour fantôme** dans l'autre (pour
 * prévoir). Une salle habillée dessine ses zones avec l'habillage : le présent dans la palette de la
 * salle (les silhouettes du monde étrange), le souvenir dans les couleurs chaudes et passées des
 * courts souvenirs ; une salle de tuiles (les parcours) les dessine en tuiles. Les groupes de
 * l'effacement (D-111) sont dessinés de même, dans chaque couche, et montrés selon leurs couches du
 * moment ; une plateforme annoncée blanchit. Tout est créé au chargement de la salle ; basculer ou
 * effacer ne fait que changer des visibilités (aucune création en jeu). Dans le souvenir, un voile
 * chaud recouvre la vue. Le petit signe du refus et l'éclair de la bascule.
 */
export class ShiftLayerView {
  private readonly areas: Area[] = [];
  private readonly textureKeys: string[] = [];
  private readonly veil: Phaser.GameObjects.Rectangle;
  private readonly sign: Phaser.GameObjects.Graphics;
  private readonly whiten: Phaser.GameObjects.Graphics;
  private readonly scratch = document.createElement('canvas');
  private signStart = -1;
  private signKind: 'refuse' | 'flash' = 'refuse';
  private active: Layer = 'present';
  private layered = false;
  private masks: ArrayLike<number> | null = null;
  private whitened = false;

  constructor(private readonly scene: Phaser.Scene) {
    const v = SHIFT_LAYER_VIEW;
    // Plus grand que tout écran : fixe dans la vue, il n'a pas à suivre les redimensionnements.
    this.veil = scene.add
      .rectangle(0, 0, 8192, 8192, v.memoryVeil, v.memoryVeilAlpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(VEIL_DEPTH)
      .setVisible(false);
    this.sign = scene.add.graphics().setDepth(SIGN_DEPTH).setVisible(false);
    this.whiten = scene.add.graphics().setDepth(WHITEN_DEPTH);
  }

  /**
   * Nouvelle salle : prépare ses deux couches et les groupes de l'effacement (rien sans eux).
   * `base` : la salle telle que lue (ses zones `; @shift:`, ses groupes) ; `art` : salle habillée
   * (null : une salle de tuiles).
   */
  load(base: LevelData, art: LayerArt | null): void {
    this.clear();
    const layers = base.layers;
    const erase = base.erase;
    this.layered = layers !== null || erase !== null;
    const tiles = rawOf(base).tiles;
    if (layers) {
      for (const layer of LAYERS) {
        layers[layer].forEach((r, i) => {
          this.add(atLayer(base, layer), layer, -1, [r], String(i), tiles, art);
        });
      }
    }
    if (erase) {
      // Chaque groupe, dans chaque couche : dessiné depuis le motif où il est dans les deux.
      const everywhere = erasedLevel(
        base,
        erase.groups.map(() => LayerMask.Both),
      );
      erase.groups.forEach((g, i) => {
        for (const layer of LAYERS) {
          this.add(atLayer(everywhere, layer), layer, i, g.rects, `g${String(i)}`, tiles, art);
        }
      });
    }
    this.masks = erase ? erase.groups.map((g) => g.initial) : null;
    this.show('present');
  }

  /** La couche active ; `masks` : les couches de chaque groupe de l'effacement (s'il y en a). */
  show(layer: Layer, masks: ArrayLike<number> | null = this.masks): void {
    this.active = layer;
    this.masks = masks;
    const bit = BIT[layer];
    for (const area of this.areas) {
      if (area.group < 0) {
        area.filled.setVisible(area.layer === layer);
        area.ghost.setVisible(area.layer !== layer);
        continue;
      }
      const mask = masks?.[area.group] ?? 0;
      const here = (mask & BIT[area.layer]) !== 0;
      area.filled.setVisible(here && area.layer === layer);
      // L'autre couche en fantôme, seulement si le groupe n'est pas aussi dans la couche active.
      area.ghost.setVisible(here && area.layer !== layer && (mask & bit) === 0);
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

  /**
   * Une image : le signe suit Céleste (x, y : centre, px) ; les plateformes annoncées par
   * l'effacement blanchissent (dans la couche active).
   */
  render(now: number, x: number, y: number, erase: EraseShown | null = null): void {
    this.renderWhiten(now, erase);
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

  /** L'annonce de l'effacement : un voile gris pâle qui monte sur la plateforme, en battant. */
  private renderWhiten(now: number, erase: EraseShown | null): void {
    const g = this.whiten;
    if (!erase || !this.masks) {
      if (this.whitened) {
        g.clear();
        this.whitened = false;
      }
      return;
    }
    let any = false;
    const bit = BIT[this.active];
    for (const area of this.areas) {
      if (area.group < 0 || area.layer !== this.active) {
        continue;
      }
      const a = erase.announce(area.group);
      const mask = this.masks[area.group] ?? 0;
      const target = erase.target[area.group] ?? -1;
      // Elle blanchit avant de quitter la couche active ; une lueur pâle là où elle va apparaître.
      const leaving = (mask & bit) !== 0;
      const coming = !leaving && target >= 0 && (target & bit) !== 0;
      if (a <= 0 || (!leaving && !coming)) {
        continue;
      }
      if (!any) {
        g.clear();
        any = true;
      }
      const beat = 0.75 + 0.25 * Math.sin(now / 90);
      const alpha = leaving ? 0.15 + 0.7 * a : 0.08 + 0.3 * a;
      g.fillStyle(ERASURE_COLORS.tile, Math.min(0.9, alpha * beat));
      for (const r of area.rects) {
        g.fillRect(r.col * T, r.row * T, r.width * T, r.height * T);
      }
    }
    if (!any && this.whitened) {
      g.clear();
    }
    this.whitened = any;
  }

  private clear(): void {
    for (const area of this.areas) {
      area.filled.destroy();
      area.ghost.destroy();
    }
    this.areas.length = 0;
    for (const key of this.textureKeys) {
      this.scene.textures.remove(key);
    }
    this.textureKeys.length = 0;
    this.whiten.clear();
    this.whitened = false;
  }

  /** Une zone : dessinée avec l'habillage, ou en tuiles. */
  private add(
    variant: LevelData,
    layer: Layer,
    group: number,
    rects: readonly TileRect[],
    tag: string,
    tiles: Uint8Array,
    art: LayerArt | null,
  ): void {
    const made = art
      ? this.bake(variant, layer, rects, tag, art)
      : this.drawTiles(layer, rects, tiles, variant.width);
    if (made) {
      this.areas.push({ layer, group, rects, ...made });
    }
  }

  /** Une zone d'une salle habillée : son dessin plein et son contour fantôme, deux textures. */
  private bake(
    variant: LevelData,
    layer: Layer,
    rects: readonly TileRect[],
    tag: string,
    art: LayerArt,
  ): { filled: Shown; ghost: Shown } | null {
    const { width } = variant;
    const tiles = new Uint8Array(variant.tiles.length);
    const materials = new Uint8Array(variant.materials.length);
    let col0 = Infinity;
    let row0 = Infinity;
    let col1 = -Infinity;
    let row1 = -Infinity;
    for (const r of rects) {
      col0 = Math.min(col0, r.col);
      row0 = Math.min(row0, r.row);
      col1 = Math.max(col1, r.col + r.width);
      row1 = Math.max(row1, r.row + r.height);
      for (let row = r.row; row < r.row + r.height; row++) {
        for (let col = r.col; col < r.col + r.width; col++) {
          const i = row * width + col;
          tiles[i] = variant.tiles[i] ?? Tile.Empty;
          materials[i] = variant.materials[i] ?? 0;
        }
      }
    }
    const inside = (d: TileRect) =>
      rects.some(
        (r) =>
          d.col >= r.col &&
          d.row >= r.row &&
          d.col + d.width <= r.col + r.width &&
          d.row + d.height <= r.row + r.height,
      );
    const only: LevelData = {
      ...variant,
      tiles,
      materials,
      decor: variant.decor.filter(inside),
      entities: [],
      cables: [],
    };
    const x0 = col0 * T - PAD;
    const y0 = row0 * T - PAD;
    const w = (col1 - col0) * T + 2 * PAD;
    const h = (row1 - row0) * T + 2 * PAD;
    const scale = art.scale;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
    const context: ArtContext = {
      ctx,
      level: only,
      palette: art[layer],
      images: art.images,
      clip: { x: x0, y: y0, w, h },
    };
    const floorY = floorRow(variant) * T;
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
    const ghostCanvas = outline(bare, SHIFT_LAYER_VIEW[layer].edge, scale);
    const key = `shift-${variant.id}-${layer}-${tag}`;
    const make = (suffix: string, source: HTMLCanvasElement) => {
      const textures = this.scene.textures;
      if (textures.exists(key + suffix)) {
        textures.remove(key + suffix);
      }
      textures.addCanvas(key + suffix, source)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.textureKeys.push(key + suffix);
      return this.scene.add
        .image(x0, y0, key + suffix)
        .setOrigin(0, 0)
        .setScale(1 / scale)
        .setDepth(LAYER_DEPTH)
        .setVisible(false);
    };
    return {
      filled: make('', canvas),
      ghost: make('-ghost', ghostCanvas).setAlpha(SHIFT_LAYER_VIEW.ghostAlpha),
    };
  }

  /** Une salle de tuiles (les parcours) : les tuiles de la zone, pleines et en contour. */
  private drawTiles(
    layer: Layer,
    rects: readonly TileRect[],
    tiles: Uint8Array,
    width: number,
  ): { filled: Shown; ghost: Shown } {
    const colors = SHIFT_LAYER_VIEW[layer];
    const filled = this.scene.add.graphics().setDepth(LAYER_DEPTH).setVisible(false);
    const ghost = this.scene.add.graphics().setDepth(LAYER_DEPTH).setVisible(false);
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
    return { filled, ghost };
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
