import type { MemoryId } from '../../config/memories';

/**
 * Dessins des souvenirs (D-38), PLACEHOLDERS : chaque souvenir tient dans un carré de côté `size`
 * centré en (cx, cy). Ils servent en petit dans les bulles de pensée et en grand dans le cahier
 * de Céleste. Aplats doux, comme le reste du style D-28.
 */

const INK = '#5b4a44';
const PINK = '#e0598b';
const ROSE = '#f19bb5';
const WOOD_DARK = '#8f6a4c';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function headAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  skin: string,
  hair: string,
  long: boolean,
): void {
  if (long) {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.5, r * 1.15, r * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.25, r * 1.02, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
}

/** La photo de famille : papa, maman, Céleste (lunettes roses) et le chat gris. */
function photo(ctx: CanvasRenderingContext2D, s: number): void {
  roundRect(ctx, -s * 0.46, -s * 0.36, s * 0.92, s * 0.72, s * 0.04, WOOD_DARK);
  roundRect(ctx, -s * 0.4, -s * 0.3, s * 0.8, s * 0.6, s * 0.02, '#cfe0ef');
  ctx.fillStyle = '#9bc49a';
  ctx.fillRect(-s * 0.4, s * 0.12, s * 0.8, s * 0.18);
  // Papa (grand), maman (cheveux longs), Céleste devant, le chat à ses pieds.
  ctx.fillStyle = '#4f6f8f';
  ctx.fillRect(-s * 0.3, -s * 0.04, s * 0.16, s * 0.3);
  headAt(ctx, -s * 0.22, -s * 0.12, s * 0.08, '#d9a27c', '#3b2a22', false);
  ctx.fillStyle = '#b56e8a';
  ctx.fillRect(s * 0.1, -s * 0.02, s * 0.16, s * 0.28);
  headAt(ctx, s * 0.18, -s * 0.1, s * 0.075, '#e7b995', '#6b3f2a', true);
  ctx.fillStyle = '#f1a9bd';
  ctx.fillRect(-s * 0.07, s * 0.08, s * 0.12, s * 0.18);
  headAt(ctx, -s * 0.01, s * 0.03, s * 0.065, '#e7b995', '#5a3a2a', false);
  ctx.strokeStyle = '#ff6fa3';
  ctx.lineWidth = Math.max(0.6, s * 0.012);
  ctx.beginPath();
  ctx.arc(-s * 0.03, s * 0.035, s * 0.02, 0, Math.PI * 2);
  ctx.arc(s * 0.02, s * 0.035, s * 0.02, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#8c919c';
  ctx.beginPath();
  ctx.ellipse(s * 0.1, s * 0.24, s * 0.06, s * 0.035, 0, 0, Math.PI * 2);
  ctx.arc(s * 0.15, s * 0.2, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

/** Le dessin de Céleste : une maison, un soleil, trois bonhommes et le chat. */
function drawing(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.save();
  ctx.rotate(-0.05);
  roundRect(ctx, -s * 0.44, -s * 0.34, s * 0.88, s * 0.68, s * 0.02, '#fdf8ee');
  ctx.lineWidth = Math.max(0.8, s * 0.02);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#d9788f';
  ctx.strokeRect(-s * 0.3, -s * 0.02, s * 0.3, s * 0.24);
  ctx.beginPath();
  ctx.moveTo(-s * 0.34, -s * 0.02);
  ctx.lineTo(-s * 0.15, -s * 0.2);
  ctx.lineTo(s * 0.04, -s * 0.02);
  ctx.stroke();
  ctx.strokeStyle = '#e6c27a';
  ctx.beginPath();
  ctx.arc(s * 0.28, -s * 0.18, s * 0.07, 0, Math.PI * 2);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.moveTo(s * 0.28 + Math.cos(a) * s * 0.1, -s * 0.18 + Math.sin(a) * s * 0.1);
    ctx.lineTo(s * 0.28 + Math.cos(a) * s * 0.14, -s * 0.18 + Math.sin(a) * s * 0.14);
  }
  ctx.stroke();
  ctx.strokeStyle = '#4f6f8f';
  for (const [x, h] of [
    [s * 0.12, 0.2],
    [s * 0.22, 0.18],
    [s * 0.31, 0.12],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, s * (0.22 - h), s * 0.03, 0, Math.PI * 2);
    ctx.moveTo(x, s * (0.25 - h));
    ctx.lineTo(x, s * 0.22);
    ctx.stroke();
  }
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.arc(0, -s * 0.33, s * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** La boîte à musique ouverte : une petite danseuse, des notes qui s'envolent. */
function musicBox(ctx: CanvasRenderingContext2D, s: number): void {
  roundRect(ctx, -s * 0.3, s * 0.02, s * 0.6, s * 0.28, s * 0.04, '#b56e8a');
  ctx.fillStyle = '#e6c27a';
  ctx.fillRect(-s * 0.3, s * 0.1, s * 0.6, s * 0.03);
  ctx.save();
  ctx.translate(-s * 0.3, s * 0.02);
  ctx.rotate(-0.9);
  roundRect(ctx, 0, -s * 0.06, s * 0.6, s * 0.06, s * 0.02, '#9d5d77');
  ctx.restore();
  ctx.fillStyle = ROSE;
  ctx.beginPath();
  ctx.moveTo(-s * 0.02, s * 0.02);
  ctx.lineTo(-s * 0.08, -s * 0.04);
  ctx.lineTo(s * 0.04, -s * 0.04);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.02, -s * 0.1, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  music(ctx, s * 0.22, -s * 0.2, s * 0.35);
}

/** Deux notes de musique (croche liée) centrées en (x, y), de hauteur `h`. */
function music(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.8, h * 0.06);
  for (const dx of [-h * 0.25, h * 0.25]) {
    ctx.beginPath();
    ctx.ellipse(x + dx - h * 0.08, y + h * 0.28, h * 0.11, h * 0.08, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + dx, y + h * 0.28);
    ctx.lineTo(x + dx, y - h * 0.22);
    ctx.stroke();
  }
  ctx.lineWidth = Math.max(1, h * 0.1);
  ctx.beginPath();
  ctx.moveTo(x - h * 0.25, y - h * 0.22);
  ctx.lineTo(x + h * 0.25, y - h * 0.3);
  ctx.stroke();
}

/** La plante de la cuisine, avec une fleur. */
function plant(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#c96f4f';
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, s * 0.1);
  ctx.lineTo(s * 0.16, s * 0.1);
  ctx.lineTo(s * 0.12, s * 0.34);
  ctx.lineTo(-s * 0.12, s * 0.34);
  ctx.fill();
  ctx.fillStyle = '#7fa37a';
  for (const [x, y, a] of [
    [-s * 0.12, -s * 0.02, -0.7],
    [s * 0.12, -s * 0.04, 0.7],
    [-s * 0.06, -s * 0.14, -0.3],
    [s * 0.08, -s * 0.16, 0.4],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.05, s * 0.13, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#5f8a5a';
  ctx.lineWidth = Math.max(0.8, s * 0.02);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.1);
  ctx.lineTo(0, -s * 0.24);
  ctx.stroke();
  ctx.fillStyle = ROSE;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * s * 0.06, -s * 0.28 + Math.sin(a) * s * 0.06, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e6c27a';
  ctx.beginPath();
  ctx.arc(0, -s * 0.28, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

/** Le bandeau de Maria : anneau rose et nœud fleuri. */
function headband(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = '#f6b6c8';
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.05, s * 0.3, s * 0.16, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.ellipse(-s * 0.24, -s * 0.04, s * 0.1, s * 0.07, -0.5, 0, Math.PI * 2);
  ctx.ellipse(-s * 0.1, -s * 0.07, s * 0.1, s * 0.07, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a0405f';
  ctx.beginPath();
  ctx.arc(-s * 0.17, -s * 0.05, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
}

/** La photo de Céleste bébé, Maria dans les bras (D-39). */
function babyPhoto(ctx: CanvasRenderingContext2D, s: number): void {
  roundRect(ctx, -s * 0.4, -s * 0.44, s * 0.8, s * 0.88, s * 0.04, '#e6c27a');
  roundRect(ctx, -s * 0.33, -s * 0.37, s * 0.66, s * 0.74, s * 0.02, '#f6e7d8');
  // Céleste bébé, assise, grosse tête ronde, petites couettes.
  ctx.fillStyle = '#f1a9bd';
  ctx.beginPath();
  ctx.ellipse(-s * 0.04, s * 0.18, s * 0.17, s * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e7b995';
  ctx.beginPath();
  ctx.arc(-s * 0.04, -s * 0.08, s * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3a2a';
  ctx.beginPath();
  ctx.arc(-s * 0.04, -s * 0.12, s * 0.14, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.19, -s * 0.12, s * 0.035, 0, Math.PI * 2);
  ctx.arc(s * 0.11, -s * 0.12, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1d18';
  ctx.fillRect(-s * 0.09, -s * 0.07, s * 0.025, s * 0.03);
  ctx.fillRect(s * 0.01, -s * 0.07, s * 0.025, s * 0.03);
  // Maria dans ses bras : petite tête et bandeau rose.
  ctx.fillStyle = '#b77a52';
  ctx.beginPath();
  ctx.arc(s * 0.13, s * 0.1, s * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f6b6c8';
  ctx.fillRect(s * 0.06, s * 0.05, s * 0.15, s * 0.03);
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.arc(s * 0.08, s * 0.05, s * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ROSE;
  ctx.beginPath();
  ctx.ellipse(s * 0.13, s * 0.21, s * 0.07, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  // Le bras de Céleste autour de Maria.
  ctx.fillStyle = '#e7b995';
  ctx.beginPath();
  ctx.ellipse(s * 0.06, s * 0.16, s * 0.1, s * 0.035, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawMemory(
  ctx: CanvasRenderingContext2D,
  id: MemoryId,
  cx: number,
  cy: number,
  size: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  switch (id) {
    case 'photo':
      photo(ctx, size);
      break;
    case 'drawing':
      drawing(ctx, size);
      break;
    case 'music-box':
      musicBox(ctx, size);
      break;
    case 'plant':
      plant(ctx, size);
      break;
    case 'headband':
      headband(ctx, size);
      break;
    case 'bookcase':
      babyPhoto(ctx, size);
      break;
  }
  ctx.restore();
}

/** Notes de musique seules (bulle de la boîte à musique). */
export function drawNotes(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number): void {
  music(ctx, cx, cy, h);
}

/** Boîte à musique et plante posées dans la maison (objets de mise en scène), deux images. */
export function drawLoopObject(
  ctx: CanvasRenderingContext2D,
  kind: 'music-box' | 'plant',
  w: number,
  h: number,
  frame: number,
): void {
  if (kind === 'music-box') {
    roundRect(ctx, 1, h - 6, w - 2, 6, 1.2, '#b56e8a');
    ctx.fillStyle = '#e6c27a';
    ctx.fillRect(1, h - 4, w - 2, 0.8);
    ctx.save();
    ctx.translate(1, h - 6);
    ctx.rotate(-0.8);
    roundRect(ctx, 0, -1.4, w - 2, 1.4, 0.5, '#9d5d77');
    ctx.restore();
    // La danseuse tourne : de face, puis de profil.
    ctx.fillStyle = ROSE;
    const half = frame === 0 ? 1.8 : 0.9;
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 6);
    ctx.lineTo(w / 2 - half, h - 8);
    ctx.lineTo(w / 2 + half, h - 8);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w / 2, h - 9, 0.9, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Plante : pot et feuilles qui frémissent.
  ctx.fillStyle = '#c96f4f';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 3.5, h - 5);
  ctx.lineTo(w / 2 + 3.5, h - 5);
  ctx.lineTo(w / 2 + 2.6, h);
  ctx.lineTo(w / 2 - 2.6, h);
  ctx.fill();
  const sway = frame === 0 ? 0 : 0.18;
  ctx.fillStyle = '#7fa37a';
  for (const [x, y, a] of [
    [w / 2 - 2.5, h - 8, -0.7],
    [w / 2 + 2.5, h - 8.5, 0.7],
    [w / 2 - 1, h - 11, -0.2],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, 1.3, 3.2, a + sway, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = ROSE;
  ctx.beginPath();
  ctx.arc(w / 2 + 1 + sway * 3, h - 13, 1.4, 0, Math.PI * 2);
  ctx.fill();
}
