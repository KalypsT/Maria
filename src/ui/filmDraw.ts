import type { IntroGlowColor } from '../config/intro';

/**
 * Le dessin des plans illustrés, commun à l'intro (D-185) et au film de la fin (D-190) : les
 * personnages, leur ombre, les halos, les poussières, la bulle cœur. Coordonnées du plan (px).
 */

export const TAU = Math.PI * 2;

const GLOW_RGB: Readonly<Record<IntroGlowColor, string>> = {
  warm: '255, 176, 96',
  teal: '80, 225, 210',
};
const MOTE_FILL: Readonly<Record<IntroGlowColor, string>> = {
  warm: 'rgb(255, 214, 160)',
  teal: 'rgb(150, 245, 230)',
};
/** Les deux petits ronds sous la bulle (décalage et rayon, px à l'échelle 1). */
const BUBBLE_DOTS = [
  [-40, 78, 14],
  [-62, 108, 8],
] as const;

export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

/** Pseudo-hasard fixe (0 → 1) : les poussières sont les mêmes à chaque fois. */
export function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Un halo radial, dessiné une fois, posé ensuite à l'échelle voulue. */
function makeGlow(rgb: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, `rgba(${rgb}, 1)`);
    g.addColorStop(0.35, `rgba(${rgb}, 0.45)`);
    g.addColorStop(0.7, `rgba(${rgb}, 0.12)`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  return canvas;
}

export type Glows = Readonly<Record<IntroGlowColor, HTMLCanvasElement>>;

export function createGlows(): Glows {
  return { warm: makeGlow(GLOW_RGB.warm), teal: makeGlow(GLOW_RGB.teal) };
}

/** Un personnage ou un objet : centre horizontal et bas de l'image, hauteur affichée. */
export interface DrawnSprite {
  readonly x: number;
  readonly bottom: number;
  readonly height: number;
  readonly breathe?: boolean;
}

/**
 * Un personnage, respirant s'il le faut (`breathMs`, `breathAmount`). `pad` : marge d'un halo
 * autour de l'image source (sa hauteur affichée est celle de l'objet, sans la marge).
 */
export function drawSprite(
  c: CanvasRenderingContext2D,
  img: HTMLImageElement,
  s: DrawnSprite,
  t: number,
  pad: number,
  breathMs: number,
  breathAmount: number,
): void {
  const scale = s.height / (img.naturalHeight - 2 * pad);
  const breath = s.breathe ? 1 + breathAmount * Math.sin((TAU * t) / breathMs) : 1;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale * breath;
  c.drawImage(img, s.x - w / 2, s.bottom + pad * scale - h, w, h);
}

export function drawShadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  c.fillStyle = 'rgb(10, 12, 30)';
  for (let i = 0; i < 3; i++) {
    const k = 1 - i * 0.22;
    c.globalAlpha = 0.14;
    c.beginPath();
    c.ellipse(x, y, (w / 2) * k, w * 0.07 * k, 0, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;
}

export function drawGlow(
  c: CanvasRenderingContext2D,
  glows: Glows,
  color: IntroGlowColor,
  x: number,
  y: number,
  r: number,
  alpha: number,
): void {
  if (alpha <= 0) {
    return;
  }
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = Math.min(1, alpha);
  c.drawImage(glows[color], x - r, y - r, r * 2, r * 2);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

/** Des poussières qui flottent (ou montent) dans la lumière. */
export interface Motes {
  readonly color: IntroGlowColor;
  readonly count: number;
  readonly area: readonly [number, number, number, number];
  readonly rise: boolean;
}

export function drawMotes(c: CanvasRenderingContext2D, motes: Motes | undefined, t: number): void {
  if (!motes) {
    return;
  }
  const [x0, y0, x1, y1] = motes.area;
  const w = x1 - x0;
  const h = y1 - y0;
  c.fillStyle = MOTE_FILL[motes.color];
  for (let i = 0; i < motes.count; i++) {
    const a = hash(i + 1);
    const b = hash(i + 101);
    const phase = hash(i + 201) * TAU;
    const sway = Math.sin(t / (2400 + a * 2600) + phase) * 22;
    const x = x0 + a * w + sway;
    const y = motes.rise
      ? y1 - ((b * h + t * (0.018 + a * 0.03)) % h)
      : y0 + b * h + Math.cos(t / (3000 + b * 2000) + phase) * 16;
    c.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t / 1400 + phase));
    c.beginPath();
    c.arc(x, y, 1.4 + hash(i + 301) * 2.4, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;
}

/** La bulle cœur, comme en jeu (D-31). */
export function drawHeartBubble(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  alpha: number,
): void {
  if (alpha <= 0) {
    return;
  }
  c.globalAlpha = alpha;
  c.fillStyle = 'rgba(246, 238, 222, 0.94)';
  c.strokeStyle = 'rgb(120, 104, 92)';
  c.lineWidth = 4;
  c.beginPath();
  c.ellipse(x, y, 62 * s, 53 * s, 0, 0, TAU);
  c.fill();
  c.stroke();
  for (const [dx, dy, r] of BUBBLE_DOTS) {
    c.beginPath();
    c.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
    c.fill();
    c.stroke();
  }
  const k = 30 * s;
  c.fillStyle = 'rgb(222, 112, 140)';
  c.beginPath();
  c.moveTo(x, y + k * 0.75);
  c.bezierCurveTo(x - k * 1.3, y - k * 0.1, x - k * 0.6, y - k * 1.05, x, y - k * 0.45);
  c.bezierCurveTo(x + k * 0.6, y - k * 1.05, x + k * 1.3, y - k * 0.1, x, y + k * 0.75);
  c.fill();
  c.globalAlpha = 1;
}

/** Les bords de l'image assombris, dessinés une fois à la taille de l'écran. */
export function paintVignette(canvas: HTMLCanvasElement, strength: number): void {
  const v = canvas.getContext('2d');
  if (!v) {
    return;
  }
  const { width, height } = canvas;
  const r = Math.hypot(width, height) / 2;
  const g = v.createRadialGradient(width / 2, height / 2, r * 0.45, width / 2, height / 2, r);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, `rgba(0, 0, 0, ${String(strength)})`);
  v.fillStyle = g;
  v.fillRect(0, 0, width, height);
}
