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
  ctx.fillStyle = '#46618f';
  ctx.fillRect(-s * 0.28, s * 0.14, s * 0.12, s * 0.12);
  ctx.fillStyle = '#3b4870';
  ctx.fillRect(-s * 0.3, -s * 0.04, s * 0.16, s * 0.18);
  headAt(ctx, -s * 0.22, -s * 0.12, s * 0.08, '#dca07a', '#8a5a36', false);
  ctx.fillStyle = '#7196c6';
  ctx.fillRect(s * 0.12, s * 0.14, s * 0.12, s * 0.12);
  ctx.fillStyle = '#f1b9c7';
  ctx.fillRect(s * 0.1, -s * 0.02, s * 0.16, s * 0.16);
  headAt(ctx, s * 0.18, -s * 0.1, s * 0.075, '#e2a881', '#4a2e1f', true);
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

/**
 * Le bonnet de Maria (D-49), PLACEHOLDER : petit bonnet tricoté rose, côtes au bord, pompon.
 * Centré sur (0, 0), de taille `s`.
 */
export function bonnet(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#f2a7bd';
  ctx.beginPath();
  ctx.moveTo(-s * 0.38, s * 0.22);
  ctx.quadraticCurveTo(-s * 0.4, -s * 0.3, 0, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.4, -s * 0.3, s * 0.38, s * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e07f9d';
  ctx.fillRect(-s * 0.4, s * 0.12, s * 0.8, s * 0.16);
  ctx.strokeStyle = 'rgba(160,64,95,0.45)';
  ctx.lineWidth = Math.max(0.5, s * 0.03);
  ctx.beginPath();
  for (let x = -s * 0.32; x < s * 0.36; x += s * 0.11) {
    ctx.moveTo(x, s * 0.13);
    ctx.lineTo(x, s * 0.27);
  }
  ctx.stroke();
  ctx.fillStyle = '#fff4f7';
  ctx.beginPath();
  ctx.arc(0, -s * 0.34, s * 0.11, 0, Math.PI * 2);
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

/** Le chausson de Maria (D-58) : petit chausson rose, semelle claire, pompon blanc. */
function slipper(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#e8d6c8';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.2, s * 0.38, s * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ROSE;
  ctx.beginPath();
  ctx.moveTo(-s * 0.36, s * 0.18);
  ctx.quadraticCurveTo(-s * 0.36, -s * 0.02, -s * 0.12, -s * 0.04);
  ctx.quadraticCurveTo(s * 0.22, -s * 0.12, s * 0.36, s * 0.14);
  ctx.lineTo(s * 0.36, s * 0.18);
  ctx.closePath();
  ctx.fill();
  // Ouverture du chausson, côté talon.
  ctx.fillStyle = '#c96f8c';
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, s * 0.02, s * 0.12, s * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff4f7';
  ctx.beginPath();
  ctx.arc(s * 0.16, -s * 0.06, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

/** Le biberon de Maria (D-58) : flacon transparent, lait, bague rose, tétine. */
function bottle(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.save();
  ctx.rotate(-0.35);
  roundRect(ctx, -s * 0.13, -s * 0.12, s * 0.26, s * 0.46, s * 0.06, 'rgba(225,238,250,0.95)');
  roundRect(ctx, -s * 0.11, s * 0.06, s * 0.22, s * 0.26, s * 0.05, '#f6f0e6');
  ctx.strokeStyle = 'rgba(91,74,68,0.35)';
  ctx.lineWidth = Math.max(0.5, s * 0.015);
  ctx.beginPath();
  for (const y of [0, 0.1, 0.2]) {
    ctx.moveTo(-s * 0.13, s * y);
    ctx.lineTo(-s * 0.06, s * y);
  }
  ctx.stroke();
  roundRect(ctx, -s * 0.15, -s * 0.2, s * 0.3, s * 0.09, s * 0.02, PINK);
  ctx.fillStyle = '#e8c89a';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.28, s * 0.07, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Maman (bulle de papa, D-58) : visage et longs cheveux bruns, comme sur la photo de famille. */
export function momHead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const hair = '#4a2e1f';
  // Boucles qui tombent sur les épaules, de chaque côté (jamais sous le menton : pas une barbe).
  ctx.fillStyle = hair;
  for (const side of [-1, 1]) {
    for (const [dx, dy, k] of [
      [0.95, 0.1, 0.5],
      [1.05, 0.75, 0.45],
      [0.95, 1.3, 0.4],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x + side * r * dx, y + r * dy, r * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Tee-shirt rose, col en V.
  roundRect(ctx, x - r * 1.05, y + r * 1.15, r * 2.1, r * 0.75, r * 0.3, '#f1a9bd');
  ctx.fillStyle = '#e2a881';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.28, y + r * 1.15);
  ctx.lineTo(x + r * 0.28, y + r * 1.15);
  ctx.lineTo(x, y + r * 1.5);
  ctx.fill();
  headAt(ctx, x, y, r * 0.85, '#e2a881', hair, false);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y + r * 0.05, r * 0.09, 0, Math.PI * 2);
  ctx.arc(x + r * 0.3, y + r * 0.05, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b5605f';
  ctx.lineWidth = Math.max(0.5, r * 0.1);
  ctx.beginPath();
  ctx.arc(x, y + r * 0.3, r * 0.25, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

/** Papa (bulle de maman, D-63) : cheveux châtains ondulés, barbe courte, tee-shirt marine. */
export function dadHead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const hair = '#6b4a2f';
  roundRect(ctx, x - r * 1.1, y + r * 1.15, r * 2.2, r * 0.75, r * 0.3, '#2f3f66');
  ctx.fillStyle = '#e2a881';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.28, y + r * 1.15);
  ctx.lineTo(x + r * 0.28, y + r * 1.15);
  ctx.lineTo(x, y + r * 1.5);
  ctx.fill();
  headAt(ctx, x, y, r * 0.85, '#e2a881', hair, false);
  // Volume ondulé au-dessus, barbe courte sur le bas du visage.
  ctx.fillStyle = hair;
  for (const dx of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.arc(x + r * dx, y - r * 0.85, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y + r * 0.2, r * 0.82, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.05, r * 0.09, 0, Math.PI * 2);
  ctx.arc(x + r * 0.3, y - r * 0.05, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f3d7c0';
  ctx.lineWidth = Math.max(0.5, r * 0.1);
  ctx.beginPath();
  ctx.arc(x, y + r * 0.3, r * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

/**
 * Toise (D-43) : une bande graduée, des traits au crayon aux tailles de Céleste ; `grown` : les
 * nouveaux traits roses, plus haut (un par croissance, D-69), le dernier avec un petit cœur
 * (quelques mois ont passé). Hauteur `h`, centrée horizontalement en 0, le bas en `h / 2`.
 */
export function heightChart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  grown: number,
): void {
  const top = -h / 2;
  roundRect(ctx, -w / 2, top, w, h, w * 0.15, '#f6e7c8');
  ctx.fillStyle = '#d9b98a';
  ctx.fillRect(-w / 2, top, w * 0.14, h);
  // Graduations.
  ctx.fillStyle = 'rgba(120,90,60,0.55)';
  for (let i = 1; i < 10; i++) {
    const y = top + (h * i) / 10;
    ctx.fillRect(-w / 2, y, w * (i % 2 === 0 ? 0.55 : 0.35), h * 0.012 + 0.2);
  }
  // Traits des tailles passées (au crayon), puis la taille d'aujourd'hui.
  const mark = (fromBottom: number, color: string, thick: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, h / 2 - fromBottom * h, w * 1.05, thick);
  };
  mark(0.5, INK, h * 0.018 + 0.3);
  mark(0.6, INK, h * 0.018 + 0.3);
  mark(0.7, PINK, h * 0.02 + 0.4);
  for (let k = 1; k <= grown; k++) {
    mark(0.7 + 0.08 * k, PINK, h * 0.022 + 0.45);
  }
  if (grown > 0) {
    ctx.fillStyle = PINK;
    const r = w * 0.13;
    const x = w * 0.28;
    const y = h / 2 - (0.76 + 0.08 * grown) * h;
    ctx.beginPath();
    ctx.arc(x - r * 0.55, y, r * 0.6, Math.PI, 0);
    ctx.arc(x + r * 0.55, y, r * 0.6, Math.PI, 0);
    ctx.lineTo(x, y + r * 1.3);
    ctx.closePath();
    ctx.fill();
  }
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

/**
 * La boîte à formes (D-64), vue de face : un cercle, un carré, un triangle et, au milieu, un trou à
 * la forme de Maria (tête ronde, bras, jambes). Le couvercle est bleu, la face jaune ; les trous
 * sont sombres. Sert au souvenir et à l'objet posé dans le monde étrange (`glow` : teinte turquoise).
 */
export function shapeBox(ctx: CanvasRenderingContext2D, s: number, glow = false): void {
  roundRect(ctx, -s * 0.46, -s * 0.24, s * 0.92, s * 0.6, s * 0.05, glow ? '#e8c45a' : '#f2cf5f');
  roundRect(ctx, -s * 0.5, -s * 0.36, s, s * 0.16, s * 0.04, glow ? '#4d7fc0' : '#5b8fd4');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fillRect(-s * 0.46, s * 0.28, s * 0.92, s * 0.08);
  const hole = glow ? '#1c3b45' : '#3b3330';
  ctx.fillStyle = hole;
  // Cercle, carré, triangle sur les côtés.
  ctx.beginPath();
  ctx.arc(-s * 0.32, -s * 0.06, s * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(s * 0.24, -s * 0.13, s * 0.14, s * 0.14);
  ctx.beginPath();
  ctx.moveTo(-s * 0.32, s * 0.08);
  ctx.lineTo(-s * 0.4, s * 0.22);
  ctx.lineTo(-s * 0.24, s * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.31, s * 0.15, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // Le trou à la forme de Maria : tête, corps rond, bras écartés, jambes courtes.
  ctx.beginPath();
  ctx.arc(0, -s * 0.09, s * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, s * 0.07, s * 0.075, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = hole;
  ctx.lineWidth = s * 0.045;
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.02);
  ctx.lineTo(-s * 0.05, s * 0.03);
  ctx.moveTo(s * 0.12, -s * 0.02);
  ctx.lineTo(s * 0.05, s * 0.03);
  ctx.moveTo(-s * 0.04, s * 0.14);
  ctx.lineTo(-s * 0.05, s * 0.22);
  ctx.moveTo(s * 0.04, s * 0.14);
  ctx.lineTo(s * 0.05, s * 0.22);
  ctx.stroke();
  if (glow) {
    // Une lueur turquoise sort du trou de Maria.
    const light = ctx.createRadialGradient(0, s * 0.02, 0, 0, s * 0.02, s * 0.3);
    light.addColorStop(0, 'rgba(120, 236, 220, 0.55)');
    light.addColorStop(1, 'rgba(120, 236, 220, 0)');
    ctx.fillStyle = light;
    ctx.fillRect(-s * 0.3, -s * 0.28, s * 0.6, s * 0.6);
  }
}

/**
 * Roger, la peluche singe (D-68), d'après l'image de l'utilisateur (D-69) : pelage roux tout doux,
 * masque crème (deux lobes sur les yeux, un grand museau), oreilles rondes crème dedans, nez brun,
 * grand sourire ; longs bras et longues jambes qui pendent, bouts des mains crème, longue queue
 * posée sur le côté, petit nombril. Assis, vu de face. En jeu, l'image fournie le remplace.
 */
export function roger(ctx: CanvasRenderingContext2D, s: number): void {
  const fur = '#c9592a';
  const furDark = '#a8451f';
  const cream = '#f8e7d4';
  const ink = '#3a2318';
  const limb = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => {
    ctx.beginPath();
    ctx.moveTo(s * x0, s * y0);
    ctx.quadraticCurveTo(s * cx, s * cy, s * x1, s * y1);
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  // La longue queue, posée sur le côté gauche.
  ctx.strokeStyle = furDark;
  ctx.lineWidth = s * 0.09;
  limb(-0.1, 0.22, -0.3, 0.2, -0.42, 0.26);
  // Le corps, en poire.
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.14, s * 0.17, s * 0.21, 0, 0, Math.PI * 2);
  ctx.fill();
  // Longues jambes, vers l'avant, pieds arrondis.
  ctx.strokeStyle = fur;
  ctx.lineWidth = s * 0.11;
  limb(-0.08, 0.28, -0.13, 0.38, -0.12, 0.44);
  limb(0.08, 0.28, 0.16, 0.36, 0.2, 0.42);
  // Le petit nombril.
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(s * 0.03, s * 0.2, s * 0.012, 0, Math.PI * 2);
  ctx.fill();
  // Longs bras qui pendent, bouts des mains crème.
  ctx.strokeStyle = fur;
  ctx.lineWidth = s * 0.08;
  limb(-0.13, 0.0, -0.24, 0.16, -0.22, 0.32);
  limb(0.13, 0.0, 0.26, 0.14, 0.28, 0.3);
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.arc(-s * 0.22, s * 0.33, s * 0.035, 0, Math.PI * 2);
  ctx.arc(s * 0.28, s * 0.31, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  // Oreilles rondes, crème dedans.
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(-s * 0.2, -s * 0.2, s * 0.075, 0, Math.PI * 2);
  ctx.arc(s * 0.2, -s * 0.2, s * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.arc(-s * 0.2, -s * 0.2, s * 0.042, 0, Math.PI * 2);
  ctx.arc(s * 0.2, -s * 0.2, s * 0.042, 0, Math.PI * 2);
  ctx.fill();
  // La tête, le masque crème (deux lobes sur les yeux, le museau).
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(0, -s * 0.2, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.ellipse(-s * 0.06, -s * 0.24, s * 0.065, s * 0.07, 0, 0, Math.PI * 2);
  ctx.ellipse(s * 0.06, -s * 0.24, s * 0.065, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.13, s * 0.13, s * 0.085, 0, 0, Math.PI * 2);
  ctx.fill();
  // Yeux brodés, nez brun, grand sourire.
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(-s * 0.055, -s * 0.23, s * 0.016, s * 0.022, 0, 0, Math.PI * 2);
  ctx.ellipse(s * 0.055, -s * 0.23, s * 0.016, s * 0.022, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.16, s * 0.03, s * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = s * 0.013;
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.06, 0.35, Math.PI - 0.35);
  ctx.stroke();
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
    case 'height':
      heightChart(ctx, size * 0.34, size * 0.95, 1);
      break;
    case 'bonnet':
      bonnet(ctx, size);
      break;
    case 'slipper':
      slipper(ctx, size);
      break;
    case 'bottle':
      bottle(ctx, size);
      break;
    case 'shape-box':
      shapeBox(ctx, size);
      break;
    case 'roger':
      roger(ctx, size * 0.9);
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
