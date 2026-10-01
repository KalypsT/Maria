import Phaser from 'phaser';
import { PARALLAX, WORLD_LIFE, type ArtPalette } from '../config/art';
import { GAME_BASE_WIDTH, GAME_HEIGHT, GAME_MAX_WIDTH, TILE_SIZE as T } from '../config/display';
import { nextDelay, wind, wrap } from '../core/fx/worldLife';
import type { LevelData } from '../core/level/LevelData';
import {
  CLOUD_SIZE,
  drawCloud,
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
const BIRD_TEXTURE = 'backdrop-bird';
const BIRD_W = 12;
const BIRD_H = 6;

/** Nuages qui dérivent devant un plan (D-72). */
interface CloudSpec {
  readonly light: string;
  readonly shadow: string;
  /** Hauteurs possibles (px du monde quand la vue est en `ref`). */
  readonly y: readonly [number, number];
  /** Un nuage pour tant de px de large du plan. */
  readonly spacingPx: number;
}

interface PlaneSpec {
  readonly factor: number;
  /** Position de la vue (coin haut gauche) où le plan est à sa place ; défaut : en bas à gauche. */
  readonly ref?: { x: number; y: number };
  readonly draw: (ctx: CanvasRenderingContext2D, e: Extent) => void;
  readonly clouds?: CloudSpec;
  /** Des oiseaux traversent ce plan de temps en temps (D-72). */
  readonly birds?: boolean;
}

/** Image qui suit un plan : position dans le plan (px logiques depuis son coin). */
interface Drifter {
  readonly image: Phaser.GameObjects.Image;
  lx: number;
  readonly ly: number;
  readonly speed: number;
}

interface Plane {
  readonly factor: number;
  readonly ox: number;
  readonly oy: number;
  /** Taille du plan (px logiques). */
  readonly w: number;
  readonly h: number;
  /** Pixels de texture par px logique. */
  readonly scale: number;
  readonly image: Phaser.GameObjects.Image;
  readonly clouds: Drifter[];
  readonly birds: boolean;
  /** Position courante du coin du plan (px du monde). */
  x: number;
  y: number;
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
  /** Vol d'oiseaux (D-72) : images réutilisées, plan traversé, départ, prochain vol. */
  private readonly birds: Phaser.GameObjects.Image[] = [];
  private flockPlane: Plane | null = null;
  private flockStartMs = 0;
  private flockSize = 0;
  private flockX = 0;
  private flockY = 0;
  private nextFlockMs = 0;
  private readonly rand = Math.random;

  constructor(private readonly scene: Phaser.Scene) {}

  clear(): void {
    for (const plane of this.planes) {
      for (const cloud of plane.clouds) {
        const key = cloud.image.texture.key;
        cloud.image.destroy();
        this.scene.textures.remove(key);
      }
      const key = plane.image.texture.key;
      plane.image.destroy();
      this.scene.textures.remove(key);
    }
    this.planes.length = 0;
    for (const bird of this.birds) {
      bird.destroy();
    }
    this.birds.length = 0;
    this.flockPlane = null;
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
      const depth = BACKDROP_DEPTH + index * 0.1;
      const image = this.scene.add
        .image(0, 0, key)
        .setOrigin(0, 0)
        .setScale(1 / scale)
        .setDepth(depth);
      const clouds = spec.clouds
        ? this.makeClouds(spec.clouds, level.id, index, w, y0, scale, depth)
        : [];
      const birds = spec.birds === true;
      this.planes.push({ factor: f, ox, oy, w, h, scale, image, clouds, birds, x: 0, y: 0 });
    });
    if (this.planes.some((plane) => plane.birds)) {
      this.makeBirds();
    }
  }

  /** Nuages répartis sur la largeur du plan, chacun sa forme et sa vitesse. */
  private makeClouds(
    spec: CloudSpec,
    levelId: string,
    index: number,
    planeW: number,
    y0: number,
    scale: number,
    depth: number,
  ): Drifter[] {
    const clouds: Drifter[] = [];
    const count = Math.max(2, Math.ceil(planeW / spec.spacingPx));
    const [slow, fast] = WORLD_LIFE.clouds.speedPxPerS;
    for (let k = 0; k < count; k++) {
      const key = `cloud-${levelId}-${String(index)}-${String(k)}`;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(CLOUD_SIZE.w * scale);
      canvas.height = Math.ceil(CLOUD_SIZE.h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        continue;
      }
      ctx.scale(scale, scale);
      drawCloud(ctx, spec.light, spec.shadow, k * 3.7 + index);
      const textures = this.scene.textures;
      if (textures.exists(key)) {
        textures.remove(key);
      }
      textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      const size = 0.75 + this.rand() * 0.6;
      const image = this.scene.add
        .image(0, 0, key)
        .setOrigin(0, 0)
        .setScale(size / scale)
        .setDepth(depth + 0.05);
      const worldY = spec.y[0] + this.rand() * (spec.y[1] - spec.y[0]);
      clouds.push({
        image,
        lx: ((k + this.rand() * 0.8) / count) * planeW,
        ly: worldY - y0,
        speed: slow + this.rand() * (fast - slow),
      });
    }
    return clouds;
  }

  /** Oiseaux : un « v » qui bat des ailes, partagé par toutes les salles. */
  private makeBirds(): void {
    const textures = this.scene.textures;
    if (!textures.exists(BIRD_TEXTURE)) {
      const s = 4;
      const canvas = document.createElement('canvas');
      canvas.width = BIRD_W * s;
      canvas.height = BIRD_H * s;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(s, s);
        ctx.strokeStyle = 'rgba(45,42,58,0.85)';
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0.8, 1.5);
        ctx.quadraticCurveTo(3.5, 1, BIRD_W / 2, BIRD_H - 1.5);
        ctx.quadraticCurveTo(BIRD_W - 3.5, 1, BIRD_W - 0.8, 1.5);
        ctx.stroke();
        textures.addCanvas(BIRD_TEXTURE, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
    for (let i = 0; i < WORLD_LIFE.birds.count[1]; i++) {
      this.birds.push(
        this.scene.add
          .image(0, 0, BIRD_TEXTURE)
          .setDisplaySize(BIRD_W, BIRD_H)
          .setDepth(BACKDROP_DEPTH + 0.95)
          .setVisible(false),
      );
    }
    this.nextFlockMs =
      this.scene.time.now + nextDelay(this.rand, 2000, WORLD_LIFE.birds.everyMs[0]);
  }

  /**
   * Place les plans pour une vue dont le coin haut gauche est en (`left`, `top`) (px du monde) ;
   * fait dériver les nuages (au vent) et passer les oiseaux.
   */
  update(left: number, top: number, viewWidth: number, nowMs: number, dtMs: number): void {
    const gust = 0.5 + wind(nowMs);
    for (const plane of this.planes) {
      const k = 1 - plane.factor;
      plane.x = plane.ox + left * k;
      plane.y = plane.oy + top * k;
      plane.image.setPosition(plane.x, plane.y);
      this.cropToRoom(plane.image, plane.x, plane.y, plane.scale);
      for (const cloud of plane.clouds) {
        cloud.lx = wrap(
          cloud.lx + (cloud.speed * gust * dtMs) / 1000,
          -CLOUD_SIZE.w * 1.4,
          plane.w,
        );
        const x = plane.x + cloud.lx;
        const y = plane.y + cloud.ly;
        cloud.image.setPosition(x, y);
        this.cropToRoom(cloud.image, x, y, 1 / cloud.image.scaleX);
      }
    }
    this.updateBirds(left, top, viewWidth, nowMs);
  }

  /** Un vol traverse l'écran de gauche à droite, haut dans le ciel, puis on attend le suivant. */
  private updateBirds(left: number, top: number, viewWidth: number, nowMs: number): void {
    if (this.birds.length === 0) {
      return;
    }
    const cfg = WORLD_LIFE.birds;
    if (!this.flockPlane) {
      if (nowMs < this.nextFlockMs) {
        return;
      }
      this.flockPlane = this.planes.find((plane) => plane.birds) ?? null;
      const plane = this.flockPlane;
      if (!plane) {
        return;
      }
      this.flockStartMs = nowMs;
      this.flockSize = cfg.count[0] + Math.floor(this.rand() * (cfg.count[1] - cfg.count[0] + 1));
      // Départ juste à gauche de l'écran, à une hauteur de ciel (dans le plan).
      this.flockX = left - plane.x - 30;
      this.flockY = top - plane.y + 40 + this.rand() * 70;
    }
    const plane = this.flockPlane;
    const t = (nowMs - this.flockStartMs) / cfg.crossMs;
    if (!plane || t >= 1) {
      for (const bird of this.birds) {
        bird.setVisible(false);
      }
      this.flockPlane = null;
      this.nextFlockMs = nowMs + nextDelay(this.rand, cfg.everyMs[0], cfg.everyMs[1]);
      return;
    }
    const lx = this.flockX + t * (viewWidth + 60);
    this.birds.forEach((bird, i) => {
      if (i >= this.flockSize) {
        bird.setVisible(false);
        return;
      }
      // En « v » lâche, chacun son battement.
      const x = plane.x + lx - i * 9 - (i % 2) * 4;
      const y =
        plane.y + this.flockY + (i % 2 === 0 ? i * 3 : -i * 2) + Math.sin(nowMs / 900 + i) * 2;
      const flap = 0.35 + 0.65 * Math.abs(Math.sin((nowMs / cfg.flapMs + i * 0.37) * Math.PI));
      bird
        .setVisible(x > 0 && x < this.roomW && y > 0)
        .setPosition(x, y)
        .setDisplaySize(BIRD_W, BIRD_H * flap);
    });
  }

  /** Recadre une image (coin en `x`, `y`, `s` pixels de texture par px) sur la salle. */
  private cropToRoom(image: Phaser.GameObjects.Image, x: number, y: number, s: number): void {
    const cropX = Math.max(0, -x * s);
    const cropY = Math.max(0, -y * s);
    image.setCrop(cropX, cropY, (this.roomW - x) * s - cropX, (this.roomH - y) * s - cropY);
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
  // Vue en bas de la salle (référence des plans) : les nuages dans le haut de l'écran.
  const refTop = Math.max(0, level.height * T - GAME_HEIGHT);
  const specs: PlaneSpec[] = [
    {
      factor: PARALLAX.sky,
      draw: (ctx, e) => {
        drawSkyPlane(ctx, p, e, floorY);
        drawSkyDecor({ ctx, level, palette: p, images });
      },
      clouds: {
        light: p.wallpaper,
        shadow: p.silhouettes ? p.wallpaper : 'rgba(205,220,235,0.7)',
        y: [refTop + 14, refTop + 110],
        spacingPx: WORLD_LIFE.clouds.spacingPx,
      },
    },
    {
      factor: PARALLAX.farHills,
      birds: !p.silhouettes,
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
      // La nuit, des nuages sombres passent devant la lune ; le matin, des nuages blancs.
      clouds: {
        light: p.stars ? 'rgba(140,155,210,0.42)' : 'rgba(255,255,255,0.8)',
        shadow: p.stars ? 'rgba(24,30,66,0.5)' : 'rgba(210,222,240,0.7)',
        y: [main.y - 8, main.y + main.h * 0.45],
        spacingPx: WORLD_LIFE.clouds.windowSpacingPx,
      },
    },
  ];
}
