import { PROP_SIZE } from '../../config/story';
import type { PropKind, ThoughtIcon } from '../../core/story/story';

/**
 * Dessins de l'histoire (D-31), PLACEHOLDERS du style D-28 : objets de mise en scène (berceau,
 * traces) et bulles de pensée (pictogrammes au crayon, sans texte). Maria : l'image fournie
 * « maria » si elle est chargée, sinon un poupon dessiné par le code. Appelé au chargement
 * seulement, jamais par image.
 */

/** Tête de Maria dans l'image fournie (fractions de l'image détourée). */
const MARIA_HEAD = { x: 0.14, y: 0, w: 0.72, h: 0.4 } as const;

const INK = '#5b4a44';
const PINK = '#e0598b';
const SKIN = '#b77a52';
const WOOD = '#c79d6f';
const WOOD_DARK = '#8f6a4c';

/** Maria assise (poupon dessiné, remplacé par l'image fournie). */
function drawMariaSit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  image?: CanvasImageSource,
): void {
  if (image) {
    ctx.drawImage(image, 0, 0, w, h);
    return;
  }
  ctx.fillStyle = '#f3e3dc';
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 2, w / 2, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f19bb5';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 3.5, h - 8.5, 7, 6, 2);
  ctx.fill();
  drawMariaHead(ctx, w / 2, h - 10.5, 3.2);
}

/** Tête de poupon : visage, cheveux, bandeau rose et nœud. */
function drawMariaHead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#5a3a2a';
  ctx.beginPath();
  ctx.arc(x, y - 0.3, r + 0.2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(x, y + 0.3, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f6b6c8';
  ctx.fillRect(x - r, y - r * 0.55, 2 * r, r * 0.45);
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.arc(x - r * 0.75, y - r * 0.45, r * 0.32, 0, Math.PI * 2);
  ctx.arc(x - r * 0.35, y - r * 0.6, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1d18';
  ctx.fillRect(x - r * 0.45, y + r * 0.1, r * 0.22, r * 0.25);
  ctx.fillRect(x + r * 0.25, y + r * 0.1, r * 0.22, r * 0.25);
}

/** Tête de Maria dans un cercle de rayon `r` centré en (x, y) : image fournie ou dessin. */
function mariaHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  image?: CanvasImageSource,
): void {
  if (!image) {
    drawMariaHead(ctx, x, y, r * 0.85);
    return;
  }
  const iw = (image as { width: number }).width;
  const ih = (image as { height: number }).height;
  const sw = MARIA_HEAD.w * iw;
  const sh = MARIA_HEAD.h * ih;
  const scale = (2 * r) / Math.max(sw, sh);
  ctx.drawImage(
    image,
    MARIA_HEAD.x * iw,
    MARIA_HEAD.y * ih,
    sw,
    sh,
    x - (sw * scale) / 2,
    y - (sh * scale) / 2,
    sw * scale,
    sh * scale,
  );
}

/** Berceau de poupée en bois sur patins ; `content` : lit fait, Maria couchée, lit défait. */
function drawCradle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  content: 'made' | 'maria' | 'undone',
  image?: CanvasImageSource,
): void {
  // Patins.
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(1, h - 3);
  ctx.quadraticCurveTo(w / 2, h + 1.5, w - 1, h - 3);
  ctx.stroke();
  // Caisse, tête de lit plus haute à gauche.
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.roundRect(3, h - 10, w - 6, 7, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(2, h - 15, 4, 12, [2, 2, 0, 0]);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(w - 6, h - 12, 4, 9, [2, 2, 0, 0]);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let x = 9; x < w - 7; x += 4) {
    ctx.fillRect(x, h - 9, 1, 5);
  }
  // Oreiller.
  ctx.fillStyle = '#f3ead7';
  ctx.beginPath();
  ctx.ellipse(9.5, h - 11, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  if (content === 'maria') {
    mariaHead(ctx, 10, h - 13, 3.6, image);
  }
  // Couverture rose à carreaux.
  ctx.fillStyle = '#f19bb5';
  if (content === 'undone') {
    // Rabattue, qui pend par-dessus le bord.
    ctx.beginPath();
    ctx.moveTo(15, h - 10);
    ctx.quadraticCurveTo(22, h - 13, w - 5, h - 10);
    ctx.lineTo(w - 3, h - 2);
    ctx.quadraticCurveTo(w - 7, h - 4, w - 9, h - 8);
    ctx.lineTo(15, h - 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(9, h - 12, 3, 1);
  } else {
    const top = content === 'maria' ? h - 11.5 : h - 10.5;
    ctx.beginPath();
    ctx.roundRect(content === 'maria' ? 7 : 13, top, w - (content === 'maria' ? 13 : 19), 3.5, 1.5);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let x = content === 'undone' ? 17 : 14; x < w - 7; x += 3) {
    ctx.fillRect(x, h - 10, 1, 1);
  }
}

/** Chausson de poupée, rose. */
function drawSlipper(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f19bb5';
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 1.6, w / 2, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w / 2 + 1, h - 2.5, 2.4, 1.5, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(w / 2 + 1, h - 3.5, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

/** Biberon de poupée couché. */
function drawBottle(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = 'rgba(240,248,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(0.5, h - 4, w - 3.5, 3.5, 1.4);
  ctx.fill();
  ctx.fillStyle = '#f6f0e6';
  ctx.fillRect(1.5, h - 2.4, w - 5.5, 1.6);
  ctx.fillStyle = PINK;
  ctx.fillRect(w - 3.5, h - 4.2, 1.2, 3.9);
  ctx.fillStyle = '#e8c89a';
  ctx.beginPath();
  ctx.ellipse(w - 1.3, h - 2.2, 1.3, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Bandeau de Maria, posé à plat : anneau rose et nœud fleuri. */
function drawHeadband(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeStyle = '#f6b6c8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(w / 2 + 1, h - 2, w / 2 - 1.8, 1.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.ellipse(2.4, h - 3, 1.9, 1.4, -0.5, 0, Math.PI * 2);
  ctx.ellipse(4.8, h - 3.4, 1.9, 1.4, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff4d0';
  ctx.fillRect(2.2, h - 3.6, 0.8, 0.8);
  ctx.fillRect(4.6, h - 3.8, 0.8, 0.8);
  ctx.fillStyle = '#a0405f';
  ctx.beginPath();
  ctx.arc(3.6, h - 3.2, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

export function drawProp(
  ctx: CanvasRenderingContext2D,
  kind: PropKind,
  images: ReadonlyMap<string, CanvasImageSource>,
): void {
  const { w, h } = PROP_SIZE[kind];
  const maria = images.get('maria');
  switch (kind) {
    case 'maria-sit':
      drawMariaSit(ctx, w, h, maria);
      break;
    case 'cradle':
      drawCradle(ctx, w, h, 'made');
      break;
    case 'cradle-maria':
      drawCradle(ctx, w, h, 'maria', maria);
      break;
    case 'cradle-undone':
      drawCradle(ctx, w, h, 'undone');
      break;
    case 'slipper':
      drawSlipper(ctx, w, h);
      break;
    case 'bottle':
      drawBottle(ctx, w, h);
      break;
    case 'headband':
      drawHeadband(ctx, w, h);
      break;
  }
}

/** Taille d'une bulle de pensée (px logiques), petites bulles de la traîne comprises. */
export const THOUGHT_SIZE = { w: 28, h: 26 } as const;

/**
 * Bulle de pensée : nuage clair, deux petites bulles vers la tête (en bas à gauche), pictogramme.
 */
export function drawThought(
  ctx: CanvasRenderingContext2D,
  icon: ThoughtIcon,
  images: ReadonlyMap<string, CanvasImageSource>,
): void {
  const cx = 16;
  const cy = 10;
  ctx.fillStyle = 'rgba(253,248,238,0.95)';
  ctx.strokeStyle = 'rgba(91,74,68,0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const [x, y, r] of [
    [cx - 6, cy + 1, 5],
    [cx, cy - 3, 6.5],
    [cx + 6.5, cy + 1, 5],
    [cx, cy + 4, 5.5],
  ] as const) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 9, cy + 11, 2, 0, Math.PI * 2);
  ctx.moveTo(cx - 11.3, cy + 15);
  ctx.arc(cx - 12.5, cy + 15, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const maria = images.get('maria');
  switch (icon) {
    case 'heart':
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 5);
      ctx.bezierCurveTo(cx - 8, cy - 1, cx - 3, cy - 7, cx, cy - 2.5);
      ctx.bezierCurveTo(cx + 3, cy - 7, cx + 8, cy - 1, cx, cy + 5);
      ctx.fill();
      break;
    case 'cradle':
      ctx.save();
      ctx.translate(cx - 7, cy - 3);
      ctx.scale(0.5, 0.5);
      drawCradle(ctx, 28, 16, 'maria', maria);
      ctx.restore();
      moon(ctx, cx + 6, cy - 4);
      break;
    case 'bed':
      ctx.fillStyle = '#6d86c2';
      ctx.fillRect(cx - 7, cy + 1, 12, 3);
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(cx - 8, cy - 3, 1.6, 8);
      ctx.fillRect(cx - 8, cy + 4, 14, 1.2);
      ctx.fillStyle = '#f3ead7';
      ctx.fillRect(cx - 6, cy - 0.5, 3.5, 1.8);
      moon(ctx, cx + 6, cy - 4);
      break;
    case 'maria':
      mariaHead(ctx, cx, cy, 6, maria);
      break;
    case 'maria-missing':
      ctx.globalAlpha = 0.35;
      mariaHead(ctx, cx - 2, cy + 0.5, 5.5, maria);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 3, 2.2, Math.PI * 1.1, Math.PI * 2.4);
      ctx.lineTo(cx + 6, cy + 1.2);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx + 6, cy + 3.6, 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

function moon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#e6c27a';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x + 1.6, y - 1, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

/** Petite étincelle au-dessus de ce qu'on peut faire (Agir). */
export const SPARKLE_SIZE = 7;
export function drawSparkle(ctx: CanvasRenderingContext2D): void {
  const c = SPARKLE_SIZE / 2;
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, 'rgba(255,236,190,0.8)');
  halo.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SPARKLE_SIZE, SPARKLE_SIZE);
  ctx.fillStyle = '#fff6dc';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? c : 0.9;
    ctx.lineTo(c + Math.cos(angle) * r, c + Math.sin(angle) * r);
  }
  ctx.fill();
}
