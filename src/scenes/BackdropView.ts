import Phaser from 'phaser';
import { PARALLAX, type ArtPalette } from '../config/art';
import { GAME_BASE_WIDTH, GAME_HEIGHT, GAME_MAX_WIDTH, TILE_SIZE as T } from '../config/display';
import type { LevelData } from '../core/level/LevelData';
import {
  drawHillsPlane,
  drawOutsidePlane,
  drawRoofsPlane,
  drawSkyPlane,
  type Extent,
} from './art/backdropArt';
import { drawSkyDecor, floorRow, seesOutside, windowPanes } from './art/roomArt';

/** Sous le fond de la salle (-5) et les objets qui dérivent du monde étrange (-4). */
const BACKDROP_DEPTH = -9;
/** Plus grand côté d'une texture (limite de nombreux téléphones). */
const MAX_TEXTURE_PX = 4096;

interface PlaneSpec {
  readonly factor: number;
  /** Position de la vue (coin haut gauche) où le plan est à sa place ; défaut : en bas à gauche. */
  readonly ref?: { x: number; y: number };
  readonly draw: (ctx: CanvasRenderingContext2D, e: Extent) => void;
}

interface Plane {
  readonly factor: number;
  readonly ox: number;
  readonly oy: number;
  /** Pixels de texture par px logique. */
  readonly scale: number;
  readonly image: Phaser.GameObjects.Image;
}

/** Positions possibles du bord de la vue (px) : la caméra reste dans la salle, centrée si elle est plus petite. */
function viewRange(size: number, minView: number, maxView: number): [number, number] {
  return [Math.min(0, (size - maxView) / 2), Math.max(0, size - minView)];
}

/**
 * Plans lointains (D-71) : ciel, collines et toits dehors, vue par les fenêtres dedans. Chaque
 * plan est une texture dessinée une fois par salle, qui défile à sa vitesse (parallaxe) : le
 * point du plan à l'écran est `x - vue × facteur`. Rien ne touche à la collision.
 */
export class BackdropView {
  private readonly planes: Plane[] = [];
  /** Taille de la salle (px) : les plans n'en débordent pas (salle plus petite que l'écran). */
  private roomW = 0;
  private roomH = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  clear(): void {
    for (const plane of this.planes) {
      const key = plane.image.texture.key;
      plane.image.destroy();
      this.scene.textures.remove(key);
    }
    this.planes.length = 0;
  }

  /** Plans de la salle (aucun si elle ne voit pas le dehors). */
  build(
    level: LevelData,
    palette: Readonly<ArtPalette>,
    artScale: number,
    images: ReadonlyMap<string, CanvasImageSource>,
  ): void {
    this.clear();
    const specs = planeSpecs(level, palette, images);
    const width = level.width * T;
    const height = level.height * T;
    this.roomW = width;
    this.roomH = height;
    const [minX, maxX] = viewRange(width, GAME_BASE_WIDTH, GAME_MAX_WIDTH);
    const [minY, maxY] = viewRange(height, GAME_HEIGHT, GAME_HEIGHT);
    const margin = PARALLAX.marginPx;
    specs.forEach((spec, index) => {
      const f = spec.factor;
      const ox = minX * f - margin;
      const oy = minY * f - margin;
      const w = (maxX - minX) * f + GAME_MAX_WIDTH + 2 * margin;
      const h = (maxY - minY) * f + GAME_HEIGHT + 2 * margin;
      const ref = spec.ref ?? { x: minX, y: maxY };
      // Coordonnées du monde du coin du plan quand la vue est en `ref`.
      const x0 = ox + ref.x * (1 - f);
      const y0 = oy + ref.y * (1 - f);
      const scale = Math.min(artScale, PARALLAX.maxScale, MAX_TEXTURE_PX / w, MAX_TEXTURE_PX / h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(w * scale);
      canvas.height = Math.ceil(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
      spec.draw(ctx, { x0, x1: x0 + w, y0, y1: y0 + h });
      const key = `backdrop-${level.id}-${String(index)}`;
      const textures = this.scene.textures;
      if (textures.exists(key)) {
        textures.remove(key);
      }
      textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      const image = this.scene.add
        .image(0, 0, key)
        .setOrigin(0, 0)
        .setScale(1 / scale)
        .setDepth(BACKDROP_DEPTH + index * 0.1);
      this.planes.push({ factor: f, ox, oy, scale, image });
    });
  }

  /** Place les plans pour une vue dont le coin haut gauche est en (`left`, `top`) (px du monde). */
  update(left: number, top: number): void {
    for (const plane of this.planes) {
      const k = 1 - plane.factor;
      const x = plane.ox + left * k;
      const y = plane.oy + top * k;
      // Recadré sur la salle : au-delà de ses murs, la couleur d'ambiance comme avant.
      const s = plane.scale;
      const cropX = Math.max(0, -x * s);
      const cropY = Math.max(0, -y * s);
      plane.image
        .setPosition(x, y)
        .setCrop(cropX, cropY, (this.roomW - x) * s - cropX, (this.roomH - y) * s - cropY);
    }
  }
}

/** Plans d'une salle : la campagne (jardin), la ville (quartier, gare), ou la vue des fenêtres. */
function planeSpecs(
  level: LevelData,
  p: Readonly<ArtPalette>,
  images: ReadonlyMap<string, CanvasImageSource>,
): PlaneSpec[] {
  if (level.decor.length === 0 || !seesOutside(p)) {
    return [];
  }
  const floorY = floorRow(level) * T;
  if (!p.outdoor) {
    return outsideSpecs(level, p);
  }
  const specs: PlaneSpec[] = [
    {
      factor: PARALLAX.sky,
      draw: (ctx, e) => {
        drawSkyPlane(ctx, p, e, floorY);
        drawSkyDecor({ ctx, level, palette: p, images });
      },
    },
    {
      factor: PARALLAX.farHills,
      draw: (ctx, e) => {
        drawHillsPlane(ctx, p, e, floorY, {
          base: 6 * T,
          amp: 18,
          alpha: 0.28,
          seed: 7,
          trees: false,
        });
      },
    },
  ];
  if (level.meta.world === 'street') {
    specs.push(
      {
        factor: PARALLAX.farRoofs,
        draw: (ctx, e) => {
          drawRoofsPlane(ctx, e, floorY - 1.5 * T, {
            color: p.structure,
            alpha: 0.45,
            seed: 11,
            lights: p.glow > 0.5,
            scale: 0.8,
          });
        },
      },
      {
        factor: PARALLAX.nearRoofs,
        draw: (ctx, e) => {
          drawRoofsPlane(ctx, e, floorY + T, {
            color: p.structure,
            alpha: 0.7,
            seed: 5,
            lights: p.glow > 0.5,
            scale: 1.2,
          });
        },
      },
    );
  } else {
    specs.push(
      {
        factor: PARALLAX.midHills,
        draw: (ctx, e) => {
          drawHillsPlane(ctx, p, e, floorY, {
            base: 3.5 * T,
            amp: 10,
            alpha: 0.42,
            seed: 2,
            trees: true,
          });
        },
      },
      {
        factor: PARALLAX.nearHills,
        draw: (ctx, e) => {
          drawHillsPlane(ctx, p, e, floorY, {
            base: 1.2 * T,
            amp: 7,
            alpha: 0.55,
            seed: 4,
            trees: true,
          });
        },
      },
    );
  }
  return specs;
}

/**
 * Vue par les fenêtres (dedans) : un seul plan, placé pour que la lune soit dans la plus grande
 * fenêtre quand la vue est centrée sur elle.
 */
function outsideSpecs(level: LevelData, p: Readonly<ArtPalette>): PlaneSpec[] {
  const panes = windowPanes(level);
  const main = panes.reduce<(typeof panes)[number] | null>(
    (best, pane) => (!best || pane.w * pane.h > best.w * best.h ? pane : best),
    null,
  );
  if (!main) {
    return [];
  }
  const width = level.width * T;
  const height = level.height * T;
  const [minX, maxX] = viewRange(width, GAME_BASE_WIDTH, GAME_MAX_WIDTH);
  const [minY, maxY] = viewRange(height, GAME_HEIGHT, GAME_HEIGHT);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const ref = {
    x: clamp(main.x + main.w / 2 - GAME_BASE_WIDTH / 2, minX, maxX),
    y: clamp(main.y + main.h / 2 - GAME_HEIGHT / 2, minY, maxY),
  };
  // Une lucarne seule : la lune y passe, plus petite place.
  const moon =
    main.h > T * 2
      ? { x: main.x + main.w * 0.72, y: main.y + main.h * 0.3 }
      : { x: main.x + main.w * 0.7, y: main.y + 4 };
  return [
    {
      factor: PARALLAX.outside,
      ref,
      draw: (ctx, e) => {
        drawOutsidePlane(ctx, p, e, moon, main.y + main.h + 4);
      },
    },
  ];
}
