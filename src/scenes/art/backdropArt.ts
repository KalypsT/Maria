import type { ArtPalette } from '../../config/art';
import { TILE_SIZE as T } from '../../config/display';

/**
 * Plans lointains (D-71) : ciel, collines, toits de la ville, vue par les fenêtres. Chacun est
 * dessiné une fois par salle sur sa propre texture, qui défile moins vite que la salle
 * (parallaxe, `BackdropView`). Coordonnées du monde (px logiques) ; `Extent` est la partie du plan
 * qui peut apparaître à l'écran.
 */
export interface Extent {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

/** Variation déterministe dans [0, 1[ : le même plan d'un dessin à l'autre. */
function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Premier multiple de `step` (plus `offset`) avant `x`. */
function startAt(x: number, step: number, offset = 0): number {
  return Math.floor((x - offset) / step) * step + offset;
}

/** Ciel du dehors : dégradé jusqu'à l'horizon (le sol), nuages en coussins. */
export function drawSkyPlane(
  ctx: CanvasRenderingContext2D,
  p: Readonly<ArtPalette>,
  e: Extent,
  floorY: number,
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, floorY);
  sky.addColorStop(0, p.wallTop);
  sky.addColorStop(1, p.wallBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0);
  const puffs = [
    [0, 0, 14, 6],
    [12, -5, 12, 8],
    [25, -2, 13, 7],
    [37, 1, 11, 5],
  ] as const;
  for (let x = startAt(e.x0 - 60, 110, 20); x < e.x1; x += 110) {
    const k = Math.round(x / 110);
    const y = 26 + hash(k) * 70;
    const size = 0.8 + hash(k + 0.5) * 0.6;
    ctx.fillStyle = p.silhouettes ? p.wallpaper : 'rgba(205,220,235,0.7)';
    for (const [dx, dy, rx, ry] of puffs) {
      ctx.beginPath();
      ctx.ellipse(x + dx * size, y + dy * size + 2, rx * size, ry * size, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = p.wallpaper;
    for (const [dx, dy, rx, ry] of puffs) {
      ctx.beginPath();
      ctx.ellipse(x + dx * size, y + dy * size, rx * size, ry * size, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Collines (pâles : jamais prises pour une surface), remplies jusqu'au bas du plan ; une rangée
 * d'arbres ronds en option.
 */
export function drawHillsPlane(
  ctx: CanvasRenderingContext2D,
  p: Readonly<ArtPalette>,
  e: Extent,
  floorY: number,
  hill: { base: number; amp: number; alpha: number; seed: number; trees: boolean },
): void {
  const ridge = (x: number) =>
    floorY -
    hill.base -
    Math.sin(x / (40 + hill.seed) + hill.seed) * hill.amp -
    Math.sin(x / 13 + hill.seed) * 3;
  ctx.save();
  ctx.globalAlpha = hill.alpha;
  ctx.fillStyle = p.wainscot;
  ctx.beginPath();
  ctx.moveTo(e.x0, e.y1);
  for (let x = startAt(e.x0, 10); x <= e.x1 + 10; x += 10) {
    ctx.lineTo(x, ridge(x));
  }
  ctx.lineTo(e.x1 + 10, e.y1);
  ctx.fill();
  if (hill.trees) {
    for (let x = startAt(e.x0 - 30, 60); x < e.x1 + 30; x += 60) {
      const k = Math.round(x / 60) + hill.seed;
      if (hash(k) < 0.25) {
        continue;
      }
      const tx = x + hash(k + 0.3) * 30;
      const base = ridge(tx) + 2;
      const size = 0.8 + hash(k + 0.7) * 0.5;
      ctx.fillRect(tx - 1.5 * size, base - 10 * size, 3 * size, 12 * size);
      ctx.beginPath();
      ctx.arc(tx, base - 16 * size, 9 * size, 0, Math.PI * 2);
      ctx.arc(tx - 6 * size, base - 11 * size, 6 * size, 0, Math.PI * 2);
      ctx.arc(tx + 6 * size, base - 11 * size, 6 * size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Toits de la ville (silhouettes), posés sur `baseY` et remplis jusqu'au bas du plan : pignons,
 * toits plats, cheminées ; quelques fenêtres allumées la nuit.
 */
export function drawRoofsPlane(
  ctx: CanvasRenderingContext2D,
  e: Extent,
  baseY: number,
  roofs: { color: string; alpha: number; seed: number; lights: boolean; scale: number },
): void {
  ctx.save();
  ctx.globalAlpha = roofs.alpha;
  const s = roofs.scale;
  let x = startAt(e.x0 - 80 * s, 40 * s);
  while (x < e.x1 + 40 * s) {
    const k = Math.round(x / (7 * s)) + roofs.seed;
    const w = (28 + hash(k) * 44) * s;
    const h = (18 + hash(k + 0.1) * 46) * s;
    const top = baseY - h;
    ctx.fillStyle = roofs.color;
    ctx.fillRect(x, top, w + 0.5, e.y1 - top);
    const kind = hash(k + 0.2);
    if (kind < 0.55) {
      // Pignon.
      ctx.beginPath();
      ctx.moveTo(x - 2 * s, top);
      ctx.lineTo(x + w / 2, top - (10 + hash(k + 0.3) * 10) * s);
      ctx.lineTo(x + w + 2 * s, top);
      ctx.fill();
    } else if (kind < 0.8) {
      // Toit en pente, cheminée.
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + w * 0.2, top - 8 * s);
      ctx.lineTo(x + w * 0.8, top - 8 * s);
      ctx.lineTo(x + w, top);
      ctx.fill();
      ctx.fillRect(x + w * 0.65, top - 15 * s, 5 * s, 9 * s);
    }
    if (roofs.lights) {
      ctx.fillStyle = '#ffcf7a';
      for (let wy = top + 7 * s; wy < baseY - 6 * s; wy += 11 * s) {
        for (let wx = x + 5 * s; wx < x + w - 6 * s; wx += 9 * s) {
          if (hash(wx * 0.37 + wy * 0.91 + roofs.seed) < 0.16) {
            ctx.fillRect(wx, wy, 3 * s, 4 * s);
          }
        }
      }
    }
    x += w + (hash(k + 0.4) < 0.3 ? (6 + hash(k + 0.5) * 20) * s : 0);
  }
  ctx.restore();
}

/**
 * Vue par les fenêtres (dedans) : ciel de la palette (nuit ou matin), étoiles, la lune (ou le
 * soleil pâle du matin) et les toits de la ville qui dépassent du bas des fenêtres.
 */
export function drawOutsidePlane(
  ctx: CanvasRenderingContext2D,
  p: Readonly<ArtPalette>,
  e: Extent,
  moon: { x: number; y: number } | null,
  roofsY: number,
): void {
  const sky = ctx.createLinearGradient(0, roofsY - 6 * T, 0, roofsY);
  sky.addColorStop(0, p.night);
  sky.addColorStop(1, p.nightLow);
  ctx.fillStyle = sky;
  ctx.fillRect(e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0);
  if (p.stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let x = startAt(e.x0, 9); x < e.x1; x += 9) {
      for (let y = startAt(e.y0, 9); y < roofsY; y += 9) {
        const h = hash(x * 0.131 + y * 0.717);
        if (h < 0.05) {
          const size = h < 0.012 ? 1.5 : 1;
          ctx.fillRect(x + hash(h * 91) * 8, y + hash(h * 57) * 8, size, size);
        }
      }
    }
  }
  if (moon) {
    const glow = ctx.createRadialGradient(moon.x, moon.y, 0, moon.x, moon.y, 30);
    glow.addColorStop(0, 'rgba(255,245,215,0.35)');
    glow.addColorStop(1, 'rgba(255,245,215,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(moon.x - 30, moon.y - 30, 60, 60);
    ctx.fillStyle = p.moon;
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  drawRoofsPlane(ctx, e, roofsY, {
    color: p.stars ? '#141a36' : '#7d86b0',
    alpha: p.stars ? 0.95 : 0.55,
    seed: 3,
    lights: p.stars,
    scale: 0.8,
  });
}
