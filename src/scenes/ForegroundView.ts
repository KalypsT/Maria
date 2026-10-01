import Phaser from 'phaser';
import { FOREGROUND, PARALLAX, type ArtPalette } from '../config/art';
import { GAME_BASE_WIDTH, GAME_MAX_WIDTH, TILE_SIZE as T } from '../config/display';
import { foregroundPieces, overlapsSpans, protectedSpans, type Span } from '../core/fx/foreground';
import type { LevelData } from '../core/level/LevelData';
import { floorRow } from './art/roomArt';

/** Devant les personnages, sous le vignettage (11,4) et les bulles (12). */
const FOREGROUND_DEPTH = 11.3;
/** Profondeur maximale du sol prise par une pièce (px) : sous la bande, on ne voit plus rien. */
const MAX_BAND_PX = 42;
/** Débord sous la base, hors de l'écran (px). */
const BELOW_PX = 6;

/** Ce qui ne doit pas être caché : une boîte en px du monde. */
export interface ForegroundObstacle {
  readonly box: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

interface Piece {
  readonly x: number;
  readonly width: number;
  readonly image: Phaser.GameObjects.Image;
  alpha: number;
}

type Shape = 'grass' | 'flowers' | 'leaves' | 'weeds';

/** Couleur hexadécimale assombrie (`k` : part gardée). */
function shade(hex: string, k: number): string {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  const c = (v: number) => Math.round(v * k);
  return `rgb(${String(c((n >> 16) & 255))},${String(c((n >> 8) & 255))},${String(c(n & 255))})`;
}

function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Avant-plan (D-71) : silhouettes sombres et floues posées au bas de l'écran (herbes et fleurs au
 * jardin, herbes folles dans la rue ; rien dedans), qui défilent plus vite que la salle. Elles ne dépassent du sol que de quelques pixels et s'effacent près de Céleste
 * et des dangers ou objets de jeu (pilier 1). Aucune allocation par image.
 */
export class ForegroundView {
  private readonly pieces: Piece[] = [];
  private spans: Span[] = [];
  private floorY = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  clear(): void {
    for (const piece of this.pieces) {
      const key = piece.image.texture.key;
      piece.image.destroy();
      this.scene.textures.remove(key);
    }
    this.pieces.length = 0;
    this.spans = [];
  }

  build(level: LevelData, palette: Readonly<ArtPalette>, artScale: number): void {
    this.clear();
    const row = floorRow(level);
    const height = level.height * T;
    const floorY = row * T;
    if (level.decor.length === 0 || floorY >= height) {
      return;
    }
    this.floorY = floorY;
    this.spans = protectedSpans(level, row, FOREGROUND.protectMarginPx);
    const band = Math.min(height - floorY, MAX_BAND_PX);
    const f = PARALLAX.foreground;
    const width = level.width * T;
    const minView = Math.min(0, (width - GAME_MAX_WIDTH) / 2);
    const maxView = Math.max(0, width - GAME_BASE_WIDTH);
    let seed = 0;
    for (let i = 0; i < level.id.length; i++) {
      seed += level.id.charCodeAt(i);
    }
    const shapes = shapesFor(palette);
    if (shapes.length === 0) {
      return;
    }
    const color =
      palette.outdoor && !palette.paved
        ? shade(palette.leafDark, 0.42)
        : shade(palette.structure, 0.38);
    // Floues comme ce qui est trop près de l'objectif : dessinées petit, agrandies en douceur.
    const scale = Math.max(1, artScale * 0.5);
    for (const p of foregroundPieces(
      minView,
      maxView,
      GAME_MAX_WIDTH,
      f,
      FOREGROUND.spacing,
      seed,
    )) {
      const rise =
        FOREGROUND.minRisePx + hash(p.seed) * (FOREGROUND.maxRisePx - FOREGROUND.minRisePx);
      const h = band + BELOW_PX + rise;
      // Marge pour le flou, sauf en bas (hors de l'écran).
      const pad = FOREGROUND.blurPx * 2;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil((p.width + 2 * pad) * scale);
      canvas.height = Math.ceil((h + pad) * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        continue;
      }
      // Flou par l'ombre (portable) : la forme est dessinée hors de la toile, seule son ombre
      // floue y tombe. Le décalage de l'ombre n'est pas transformé : en pixels de la toile.
      const away = 4 * (p.width + 2 * pad + h);
      ctx.setTransform(scale, 0, 0, scale, (pad - away) * scale, pad * scale);
      ctx.shadowColor = color;
      ctx.shadowBlur = FOREGROUND.blurPx * scale;
      ctx.shadowOffsetX = away * scale;
      ctx.fillStyle = color;
      const shape = shapes[Math.floor(hash(p.seed + 0.37) * shapes.length)] ?? 'grass';
      drawShape(ctx, shape, p.width, h, p.seed);
      const key = `fg-${level.id}-${String(p.seed)}`;
      const textures = this.scene.textures;
      if (textures.exists(key)) {
        textures.remove(key);
      }
      textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      const image = this.scene.add
        .image(0, floorY + band + BELOW_PX, key)
        .setOrigin(pad / (p.width + 2 * pad), 1)
        .setScale(1 / scale)
        .setDepth(FOREGROUND_DEPTH)
        .setAlpha(FOREGROUND.alpha)
        .setVisible(false);
      this.pieces.push({ x: p.x, width: p.width, image, alpha: FOREGROUND.alpha });
    }
  }

  /**
   * Place les pièces pour une vue (bord gauche `left`, largeur `viewWidth`, px du monde) ;
   * Céleste en `celesteX` (milieu), pieds en `feetY`.
   */
  update(
    left: number,
    viewWidth: number,
    celesteX: number,
    feetY: number,
    enemies: readonly ForegroundObstacle[],
    dtMs: number,
  ): void {
    const shift = left * (1 - PARALLAX.foreground);
    const near = feetY > this.floorY - 4 * T;
    const margin = FOREGROUND.fadeMarginPx;
    const k = Math.min(1, dtMs / FOREGROUND.fadeTimeMs);
    for (const piece of this.pieces) {
      const x = piece.x + shift;
      const visible = x < left + viewWidth && x + piece.width > left;
      piece.image.setVisible(visible);
      if (!visible) {
        continue;
      }
      let hides =
        (near && celesteX > x - margin && celesteX < x + piece.width + margin) ||
        overlapsSpans(this.spans, x, x + piece.width);
      for (const enemy of enemies) {
        const b = enemy.box;
        hides ||=
          b.y + b.height > this.floorY - 2 * T &&
          b.x + b.width > x - margin / 2 &&
          b.x < x + piece.width + margin / 2;
      }
      const target = hides ? FOREGROUND.fadedAlpha : FOREGROUND.alpha;
      piece.alpha += (target - piece.alpha) * k;
      piece.image.setX(x).setAlpha(piece.alpha);
    }
  }
}

function shapesFor(p: Readonly<ArtPalette>): readonly Shape[] {
  if (!p.outdoor) {
    return [];
  }
  return p.paved ? ['weeds'] : ['grass', 'flowers', 'grass', 'leaves'];
}

/** Silhouette d'une pièce, posée sur le bas de la toile (`w` × `h`, px logiques). */
function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  w: number,
  h: number,
  seed: number,
): void {
  const r = (n: number) => hash(seed * 1.7 + n);
  switch (shape) {
    case 'grass':
    case 'weeds': {
      const blades = shape === 'grass' ? 9 : 5;
      for (let i = 0; i < blades; i++) {
        const x = 3 + r(i) * (w - 6);
        const top = r(i + 0.5) * (h * 0.35);
        const lean = (r(i + 0.8) - 0.5) * 12;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, h);
        ctx.quadraticCurveTo(x - 1, h * 0.5, x + lean, top);
        ctx.quadraticCurveTo(x + 1, h * 0.5, x + 2.5, h);
        ctx.fill();
      }
      ctx.fillRect(0, h - 6, w, 6);
      break;
    }
    case 'flowers': {
      for (let i = 0; i < 4; i++) {
        const x = 5 + r(i) * (w - 10);
        const top = 2 + r(i + 0.4) * (h * 0.3);
        ctx.fillRect(x - 0.7, top, 1.4, h - top);
        ctx.beginPath();
        ctx.arc(x, top, 2.5 + r(i + 0.6) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(w / 2, h, w / 2, h * 0.45, 0, Math.PI, 0);
      ctx.fill();
      break;
    }
    case 'leaves': {
      for (let i = 0; i < 6; i++) {
        const x = 4 + r(i) * (w - 8);
        const y = h * (0.25 + r(i + 0.3) * 0.5);
        ctx.beginPath();
        ctx.ellipse(x, y, 6 + r(i + 0.6) * 4, 3, (r(i + 0.9) - 0.5) * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillRect(0, h * 0.55, w, h * 0.45);
      break;
    }
  }
}
