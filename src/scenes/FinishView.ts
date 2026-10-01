import Phaser from 'phaser';
import type { ArtFinish, ArtPalette } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import type { LevelData } from '../core/level/LevelData';
import { groundBelow } from '../core/level/ground';

/** Ombre au sol : sous Céleste et les objets de mise en scène, au-dessus des liserés. */
const SHADOW_DEPTH = 4.6;
/** Vignettage : au-dessus des personnages, sous le présage et les bulles. */
const VIGNETTE_DEPTH = 11.4;
const SHADOW_TEXTURE = 'finish-shadow';
const VIGNETTE_TEXTURE = 'finish-vignette';
/** Taille de la texture du vignettage, étirée à l'écran (dégradé : le flou ne se voit pas). */
const VIGNETTE_W = 320;
const VIGNETTE_H = 180;
/** Largeur de l'ombre (× largeur de la hitbox), posée ; elle rétrécit avec la hauteur. */
const SHADOW_WIDTH = 1.8;

/**
 * Finition en jeu (D-71) : l'ombre de Céleste au sol (on voit où elle va retomber) et le
 * vignettage de l'écran. Deux images, aucune allocation par image.
 */
export class FinishView {
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly vignette: Phaser.GameObjects.Image;
  private vignetteColor = '';
  private vignetteAlpha = 0;

  constructor(private readonly scene: Phaser.Scene) {
    if (!scene.textures.exists(SHADOW_TEXTURE)) {
      smoothTexture(scene, SHADOW_TEXTURE, 64, 16, (ctx) => {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(20,14,24,1)');
        g.addColorStop(0.6, 'rgba(20,14,24,0.6)');
        g.addColorStop(1, 'rgba(20,14,24,0)');
        ctx.scale(1, 0.25);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
      });
    }
    this.shadow = scene.add.image(0, 0, SHADOW_TEXTURE).setDepth(SHADOW_DEPTH).setVisible(false);
    this.vignette = scene.add
      .image(0, 0, '__DEFAULT')
      .setScrollFactor(0)
      .setDepth(VIGNETTE_DEPTH)
      .setVisible(false);
  }

  /** Vignettage de la palette (texture refaite si sa couleur change). */
  setPalette(palette: Readonly<ArtPalette>, finish: Readonly<ArtFinish>): void {
    this.vignetteAlpha = Math.min(1, palette.vignette * finish.vignette);
    if (palette.vignetteColor !== this.vignetteColor) {
      this.vignetteColor = palette.vignetteColor;
      const textures = this.scene.textures;
      if (textures.exists(VIGNETTE_TEXTURE)) {
        this.vignette.setTexture('__DEFAULT');
        textures.remove(VIGNETTE_TEXTURE);
      }
      // Cercle dans un carré, aplati : étiré à l'écran, une ellipse qui épouse ses proportions.
      const rgb = palette.vignetteColor;
      const made = smoothTexture(this.scene, VIGNETTE_TEXTURE, VIGNETTE_W, VIGNETTE_H, (ctx) => {
        const r = VIGNETTE_W / 2;
        const g = ctx.createRadialGradient(r, r, r * 0.45, r, r, r * 1.42);
        g.addColorStop(0, `rgba(${rgb},0)`);
        g.addColorStop(0.55, `rgba(${rgb},0.35)`);
        g.addColorStop(1, `rgba(${rgb},1)`);
        ctx.scale(1, VIGNETTE_H / VIGNETTE_W);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VIGNETTE_W, VIGNETTE_W);
      });
      if (made) {
        this.vignette.setTexture(VIGNETTE_TEXTURE);
      }
    }
  }

  /**
   * Ombre sous Céleste (pieds en `x`, `feetY`, px logiques), d'autant plus petite et pâle qu'elle
   * est haut ; vignettage calé sur la vue de la caméra.
   */
  render(
    level: LevelData,
    finish: Readonly<ArtFinish>,
    x: number,
    feetY: number,
    width: number,
    alpha: number,
  ): void {
    const maxPx = finish.celesteShadowTiles * T;
    const top =
      finish.celesteShadow > 0 && alpha > 0
        ? groundBelow(level, x - width / 2, x + width / 2, feetY, maxPx)
        : null;
    const shadow = this.shadow;
    if (top === null) {
      shadow.setVisible(false);
    } else {
      const near = 1 - Math.max(0, top - feetY) / maxPx;
      const w = width * SHADOW_WIDTH * (0.55 + 0.45 * near);
      shadow
        .setVisible(true)
        .setPosition(x, top)
        .setDisplaySize(w, w / 3)
        .setAlpha(Math.min(1, finish.celesteShadow * (0.35 + 0.65 * near) * alpha));
    }
    const camera = this.scene.cameras.main;
    const vignette = this.vignette;
    if (this.vignetteAlpha <= 0) {
      vignette.setVisible(false);
      return;
    }
    // Objet fixe à l'écran : la caméra l'agrandit de son zoom autour du centre.
    vignette
      .setVisible(true)
      .setAlpha(this.vignetteAlpha)
      .setPosition(camera.width / 2, camera.height / 2)
      .setDisplaySize(camera.width / camera.zoom + 2, camera.height / camera.zoom + 2);
  }
}

/** Texture dessinée sur une toile, filtrée en douceur (le jeu est en `pixelArt`). */
function smoothTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return false;
  }
  draw(ctx);
  const texture = scene.textures.addCanvas(key, canvas);
  texture?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return texture !== null;
}
