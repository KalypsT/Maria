import type Phaser from 'phaser';
import { SHIFT_LAYER_VIEW } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { Tile, type Layer, type LevelData, type TileRect } from '../core/level/LevelData';

/** Au-dessus du fond et de l'eau, sous les personnages et la lumière. */
const LAYER_DEPTH = -4;
const SIGN_DEPTH = 9;

/**
 * Les deux couches d'une salle (la bascule, D-107) : ce qui n'existe que dans une couche, plein dans
 * la couche active, en contour fantôme dans l'autre. Quatre dessins créés au chargement de la salle ;
 * basculer ne fait que changer leur visibilité (aucune création en jeu). Le petit signe du refus et
 * l'éclair de la bascule. PLACEHOLDER.
 */
export class ShiftLayerView {
  private readonly filled: Record<Layer, Phaser.GameObjects.Graphics>;
  private readonly ghost: Record<Layer, Phaser.GameObjects.Graphics>;
  private readonly sign: Phaser.GameObjects.Graphics;
  private signStart = -1;
  private signKind: 'refuse' | 'flash' = 'refuse';
  private active: Layer = 'present';

  constructor(scene: Phaser.Scene) {
    const make = () => scene.add.graphics().setDepth(LAYER_DEPTH).setVisible(false);
    this.filled = { present: make(), memory: make() };
    this.ghost = { present: make(), memory: make() };
    this.sign = scene.add.graphics().setDepth(SIGN_DEPTH).setVisible(false);
  }

  /** Nouvelle salle : dessine ses deux couches (rien sans couches). */
  load(level: LevelData): void {
    for (const layer of ['present', 'memory'] as const) {
      this.filled[layer].clear();
      this.ghost[layer].clear();
    }
    const layers = level.layers;
    if (layers) {
      this.draw('present', layers.present, layers.rawTiles, level.width);
      this.draw('memory', layers.memory, layers.rawTiles, level.width);
    }
    this.show('present');
  }

  /** La couche active (les autres dessins restent créés). */
  show(layer: Layer): void {
    this.active = layer;
    for (const l of ['present', 'memory'] as const) {
      this.filled[l].setVisible(l === layer);
      this.ghost[l].setVisible(l !== layer);
    }
  }

  /** Bascule refusée : le petit signe autour de Céleste (x, y : centre, px). */
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
    const colors = v[this.active];
    if (this.signKind === 'refuse') {
      // L'autre couche ne laisse pas passer : un cercle de sa couleur qui s'ouvre et s'efface.
      const other = v[this.active === 'present' ? 'memory' : 'present'];
      sign.lineStyle(1.5, other.edge, 1 - t);
      sign.strokeCircle(x, y, v.refuseRadiusPx * (0.6 + 0.6 * t));
    } else {
      sign.fillStyle(colors.edge, 0.35 * (1 - t));
      sign.fillCircle(x, y, v.refuseRadiusPx * (1 + t));
    }
  }

  private draw(layer: Layer, rects: readonly TileRect[], tiles: Uint8Array, width: number): void {
    const colors = SHIFT_LAYER_VIEW[layer];
    const filled = this.filled[layer];
    const ghost = this.ghost[layer];
    ghost.lineStyle(SHIFT_LAYER_VIEW.ghostLine, colors.edge, SHIFT_LAYER_VIEW.ghostAlpha);
    for (const r of rects) {
      for (let row = r.row; row < r.row + r.height; row++) {
        for (let col = r.col; col < r.col + r.width; col++) {
          const tile = tiles[row * width + col];
          if (tile === Tile.Solid || tile === Tile.OneWay) {
            const h = tile === Tile.OneWay ? 4 : T;
            filled.fillStyle(colors.fill);
            filled.fillRect(col * T, row * T, T, h);
            filled.fillStyle(colors.edge);
            filled.fillRect(col * T, row * T, T, 2);
            ghost.strokeRect(col * T + 0.5, row * T + 0.5, T - 1, h - 1);
          } else if (tile === Tile.Hazard || tile === Tile.Thorns) {
            filled.fillStyle(colors.edge, 0.8);
            filled.fillTriangle(
              col * T,
              (row + 1) * T,
              col * T + T / 2,
              row * T + 6,
              (col + 1) * T,
              (row + 1) * T,
            );
            ghost.strokeTriangle(
              col * T,
              (row + 1) * T,
              col * T + T / 2,
              row * T + 6,
              (col + 1) * T,
              (row + 1) * T,
            );
          }
        }
      }
    }
  }
}
