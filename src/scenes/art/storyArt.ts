import { memoryImageKey } from '../../config/art';
import { PROP_SIZE, TOWER_CUBES } from '../../config/story';
import type { PropKind, ThoughtIcon } from '../../core/story/story';
import { fitScale, type BubbleKind, type BubbleSide, type SafeBox } from '../../core/story/bubble';
import {
  bonnet,
  dadHead,
  drawMemory,
  drawSketch,
  drawNotes,
  heightChart,
  momHead,
  musicBook,
  pinkKitchen,
  rabbit,
  redPanda,
  teaCup,
  roger,
  toyTown,
  type ToyPhone,
  whiteCloth,
} from './memoryArt';

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

/**
 * Le berceau de poupée deux fois trop grand, sur le coffre de la chambre grande (D-143, D-171), dans
 * un repère de 30 de large. Son côté monte plus haut que le bord : avant, on n'en voit que la
 * couverture, bombée (`hidden`) ; vue de près, la tête de Maria sur l'oreiller (`maria`) ; puis
 * vide, la couverture à plat (`empty`).
 */
function drawBigCradle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  content: 'hidden' | 'maria' | 'empty',
  image?: CanvasImageSource,
): void {
  const k = w / 30;
  const u = h / k;
  ctx.save();
  ctx.scale(k, k);
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(1, u - 3);
  ctx.quadraticCurveTo(15, u + 1.5, 29, u - 3);
  ctx.stroke();
  if (content === 'maria') {
    // L'oreiller et la tête de Maria, au-dessus du bord, du côté de la tête de lit.
    ctx.fillStyle = '#f3ead7';
    ctx.beginPath();
    ctx.ellipse(9.5, u - 12.5, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    mariaHead(ctx, 10, u - 15, 3.6, image);
  }
  ctx.fillStyle = '#f19bb5';
  ctx.beginPath();
  if (content === 'empty') {
    ctx.roundRect(6, u - 12.8, 19, 2, 1);
  } else {
    ctx.moveTo(content === 'maria' ? 12 : 6, u - 11);
    ctx.quadraticCurveTo(13, u - 15, 20, u - 12.5);
    ctx.quadraticCurveTo(24, u - 11.5, 25, u - 11);
    ctx.lineTo(25, u - 9);
    ctx.lineTo(content === 'maria' ? 12 : 6, u - 9);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.roundRect(3, u - 12, 24, 9, 2);
  ctx.roundRect(2, u - 16, 4, 13, [2, 2, 0, 0]);
  ctx.roundRect(24, u - 14, 4, 11, [2, 2, 0, 0]);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let x = 9; x < 23; x += 4) {
    ctx.fillRect(x, u - 11, 1, 7);
  }
  ctx.restore();
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

/**
 * Le portillon (D-60), PLACEHOLDER : lattes de bois sous une traverse, loquet en haut. Ouvert, il
 * est rabattu contre le mur et laisse voir la lumière de la rue.
 */
function drawGate(ctx: CanvasRenderingContext2D, w: number, h: number, open: boolean): void {
  if (open) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,241,200,0.15)');
    g.addColorStop(1, 'rgba(255,241,200,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(3, 2, w - 3, h - 2);
    ctx.fillStyle = WOOD_DARK;
    ctx.fillRect(0, 1, 3, h - 1);
    ctx.fillStyle = '#b58a5f';
    ctx.fillRect(0.5, 2, 1.5, h - 3);
    return;
  }
  ctx.fillStyle = '#b58a5f';
  for (let x = 0.5; x < w - 1; x += 3.4) {
    ctx.beginPath();
    ctx.roundRect(x, 3, 2.6, h - 3, [1.3, 1.3, 0, 0]);
    ctx.fill();
  }
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(0, 10, w, 2.5);
  ctx.fillRect(0, h - 12, w, 2.5);
  // Écharpe en diagonale, et le loquet tout en haut.
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, h - 11);
  ctx.lineTo(w - 1, 12);
  ctx.stroke();
  ctx.fillStyle = '#7a7066';
  ctx.fillRect(w - 5, 4, 5, 2);
}

/** Couverture de Maria, pliée : rose à pois clairs, bord festonné. */
function drawBlanket(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f19bb5';
  ctx.beginPath();
  ctx.roundRect(0.5, h - 4.5, w - 1, 4.5, 1.2);
  ctx.fill();
  ctx.fillStyle = '#e07f9e';
  ctx.fillRect(0.5, h - 2.5, w - 1, 0.8);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let x = 2; x < w - 1; x += 2.5) {
    ctx.fillRect(x, h - 4, 0.8, 0.8);
  }
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

/**
 * La grue du chantier vue de loin par la fenêtre de la chambre, la nuit (D-64) : une silhouette
 * sombre et, au bout de la flèche, une lueur turquoise.
 */
function drawFarCrane(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const mast = w * 0.3;
  const jib = 4;
  ctx.fillStyle = '#141827';
  // Toits lointains au pied de la grue.
  ctx.fillRect(0, h - 5, w, 5);
  ctx.fillRect(w * 0.55, h - 9, w * 0.2, 4);
  ctx.strokeStyle = '#141827';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(mast, h - 5);
  ctx.lineTo(mast, jib);
  ctx.moveTo(mast + 2.5, h - 5);
  ctx.lineTo(mast + 2.5, jib);
  ctx.moveTo(2, jib);
  ctx.lineTo(w - 3, jib);
  ctx.moveTo(mast + 1.25, 0.5);
  ctx.lineTo(w - 3, jib);
  ctx.moveTo(mast + 1.25, 0.5);
  ctx.lineTo(2, jib);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let y = jib; y < h - 6; y += 3) {
    ctx.moveTo(mast, y);
    ctx.lineTo(mast + 2.5, y + 3);
  }
  ctx.stroke();
  // La lueur au bout de la flèche.
  const tipX = w - 4;
  const glow = ctx.createRadialGradient(tipX, jib, 0, tipX, jib, 7);
  glow.addColorStop(0, 'rgba(150, 245, 230, 0.95)');
  glow.addColorStop(0.4, 'rgba(110, 228, 214, 0.5)');
  glow.addColorStop(1, 'rgba(110, 228, 214, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(tipX - 7, jib - 7, 14, 14);
}

/**
 * Le lendemain matin (D-64) : la porte de la palissade du chantier est ouverte ; dedans, le passage
 * vers la gare, dans la lumière du matin. Le battant (à gauche) est rabattu contre la palissade.
 */
function drawSiteGap(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const door = 16;
  // Derrière la palissade, le passage vers la gare, dans la lumière du matin (D-168 : pas la lueur
  // turquoise d'un monde étrange, la gare est le monde réel).
  const inside = ctx.createLinearGradient(door, 0, w, 0);
  inside.addColorStop(0, '#5d5a55');
  inside.addColorStop(1, '#8a8478');
  ctx.fillStyle = inside;
  ctx.fillRect(door, 0, w - door, h);
  const daylight = ctx.createRadialGradient(door + 36, h * 0.55, 0, door + 36, h * 0.55, 34);
  daylight.addColorStop(0, 'rgba(255, 236, 190, 0.6)');
  daylight.addColorStop(1, 'rgba(255, 236, 190, 0)');
  ctx.fillStyle = daylight;
  ctx.fillRect(door, 0, w - door, h);
  // Le battant ouvert, vu par la tranche.
  ctx.fillStyle = '#9a7352';
  ctx.beginPath();
  ctx.moveTo(door, 0);
  ctx.lineTo(door - 12, 4);
  ctx.lineTo(door - 12, h - 2);
  ctx.lineTo(door, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(door - 1, 0, 2, h);
}

/**
 * Quelques mois après la gare (D-69) : un train arrêté le long du quai, sur la voie du fond. Une
 * voiture entière, le bout des voisines ; au milieu, la porte grande ouverte, l'intérieur dans
 * l'ombre et une lueur turquoise qui déborde sur le quai. Le bas est au niveau du quai.
 */
/**
 * La lueur sous la porte du dortoir (D-105, retour d'essai) : un trait de lumière pâle au ras du
 * sol, sous la porte (48 px), et son halo qui remonte un peu sur le bas de la porte.
 */
function drawDoorGlow(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const door = 46;
  const x = (w - door) / 2;
  const halo = ctx.createLinearGradient(0, h, 0, 0);
  halo.addColorStop(0, 'rgba(190, 245, 236, 0.55)');
  halo.addColorStop(1, 'rgba(190, 245, 236, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(x, h - 2);
  ctx.lineTo(x, 0);
  ctx.lineTo(x + door, 0);
  ctx.lineTo(x + door, h - 2);
  ctx.lineTo(w, h);
  ctx.fill();
  ctx.fillStyle = '#e6fffa';
  ctx.fillRect(x, h - 2, door, 2);
}

function drawQuayTrain(ctx: CanvasRenderingContext2D, w: number, h: number, day = false): void {
  const top = 6;
  const car = (x: number, cw: number, radius: number | number[]) => {
    ctx.fillStyle = '#3d5f8f';
    ctx.beginPath();
    ctx.roundRect(x, top, cw, h - top, radius);
    ctx.fill();
    ctx.fillStyle = '#2f4b73';
    ctx.fillRect(x, top, cw, 3);
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(x, h - 14, cw, 4);
  };
  car(0, 24, [0, 4, 0, 0]);
  car(w - 24, 24, [4, 0, 0, 0]);
  const x0 = 28;
  const cw = w - 56;
  car(x0, cw, 5);
  // Soufflets entre les voitures.
  ctx.fillStyle = '#26324a';
  ctx.fillRect(24, top + 8, 4, h - top - 12);
  ctx.fillRect(w - 28, top + 8, 4, h - top - 12);
  // Fenêtres éteintes, de part et d'autre de la porte.
  const door = { x: w / 2 - 10, w: 20, top: top + 10 };
  ctx.fillStyle = '#9fb7cf';
  for (let x = x0 + 8; x < x0 + cw - 16; x += 18) {
    if (x + 12 > door.x - 4 && x < door.x + door.w + 4) {
      continue;
    }
    ctx.fillRect(x, top + 12, 12, 14);
  }
  ctx.fillStyle = '#9fb7cf';
  ctx.fillRect(4, top + 12, 14, 14);
  ctx.fillRect(w - 18, top + 12, 14, 14);
  // La porte ouverte : l'ombre dedans, la lueur turquoise ; de jour (D-90), l'intérieur éclairé.
  ctx.fillStyle = day ? '#5b5f73' : '#141a26';
  ctx.fillRect(door.x, door.top, door.w, h - door.top);
  if (day) {
    ctx.fillStyle = 'rgba(255,240,210,0.35)';
    ctx.fillRect(door.x + 2, door.top + 3, door.w - 4, (h - door.top) * 0.45);
    ctx.fillStyle = '#5a7db0';
    ctx.fillRect(door.x + door.w, door.top, 4, h - door.top);
    return;
  }
  const glow = ctx.createRadialGradient(w / 2, h - 18, 0, w / 2, h - 18, 26);
  glow.addColorStop(0, 'rgba(150, 245, 230, 0.95)');
  glow.addColorStop(0.45, 'rgba(110, 228, 214, 0.55)');
  glow.addColorStop(1, 'rgba(110, 228, 214, 0)');
  ctx.save();
  ctx.beginPath();
  ctx.rect(door.x, door.top, door.w, h - door.top);
  ctx.clip();
  ctx.fillStyle = glow;
  ctx.fillRect(door.x, door.top, door.w, h - door.top);
  ctx.restore();
  // Le battant replié contre la caisse, et la lumière qui déborde au pied de la porte.
  ctx.fillStyle = '#5a7db0';
  ctx.fillRect(door.x + door.w, door.top, 4, h - door.top);
  const spill = ctx.createLinearGradient(0, h - 10, 0, h);
  spill.addColorStop(0, 'rgba(120, 236, 220, 0)');
  spill.addColorStop(1, 'rgba(120, 236, 220, 0.6)');
  ctx.fillStyle = spill;
  ctx.beginPath();
  ctx.moveTo(door.x, h - 10);
  ctx.lineTo(door.x + door.w, h - 10);
  ctx.lineTo(door.x + door.w + 10, h);
  ctx.lineTo(door.x - 10, h);
  ctx.closePath();
  ctx.fill();
}

/** Traits roses de la toise, un par croissance (D-43, D-69). */
const HEIGHT_MARKS = {
  'height-chart': 0,
  'height-chart-grown': 1,
  'height-chart-older': 2,
  'height-chart-fourth': 3,
} as const;

/** Image fournie, entière, centrée en bas dans le cadre (w, h), sans déformation. */
function drawContained(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  w: number,
  h: number,
): void {
  const iw = image instanceof HTMLImageElement ? image.naturalWidth : w;
  const ih = image instanceof HTMLImageElement ? image.naturalHeight : h;
  const k = Math.min(w / iw, h / ih);
  ctx.drawImage(image, (w - iw * k) / 2, h - ih * k, iw * k, ih * k);
}

/** La part du carré de dessin d'un souvenir (`drawMemory`) qu'occupe l'objet, en largeur et en hauteur. */
const MEMORY_SPAN: Readonly<Record<MemoryProp, readonly [number, number]>> = {
  'watering-can': [0.9, 0.6],
  ticket: [0.85, 0.6],
  letter: [0.55, 0.78],
  postcard: [0.88, 0.62],
  'school-drawing': [0.9, 0.72],
  'family-drawing': [0.94, 0.76],
  rattle: [0.5, 0.8],
  spoon: [0.8, 0.3],
};
type MemoryProp =
  | 'watering-can'
  | 'ticket'
  | 'letter'
  | 'postcard'
  | 'school-drawing'
  | 'family-drawing'
  | 'rattle'
  | 'spoon';

/** La lueur turquoise du monde étrange autour d'un trésor ; celle, chaude et grise, du torchon. */
const STRANGE_GLOW = 'rgba(94, 230, 210, 0.35)';
const SOFT_GLOW = 'rgba(255, 244, 222, 0.45)';

/**
 * Un trésor dans le décor (D-170) : son image fournie (`key`), posée au bas de sa place, sur sa
 * lueur s'il en a une ; sinon son dessin par le code (`fallback`).
 */
function drawTreasureProp(
  ctx: CanvasRenderingContext2D,
  key: string,
  w: number,
  h: number,
  images: ReadonlyMap<string, CanvasImageSource>,
  glow: string | null,
  fallback: () => void,
): void {
  const image = images.get(key);
  if (!image) {
    fallback();
    return;
  }
  if (glow) {
    const r = Math.max(w, h) * 0.62;
    const halo = ctx.createRadialGradient(w / 2, h / 2, r * 0.15, w / 2, h / 2, r);
    halo.addColorStop(0, glow);
    halo.addColorStop(1, glow.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = halo;
    ctx.fillRect(w / 2 - r, h / 2 - r, 2 * r, 2 * r);
  }
  drawContained(ctx, image, w, h);
}

/** Un souvenir de Céleste dans le décor (D-169) : son image fournie, ou son dessin par le code. */
function drawMemoryProp(
  ctx: CanvasRenderingContext2D,
  kind: MemoryProp,
  w: number,
  h: number,
  images: ReadonlyMap<string, CanvasImageSource>,
): void {
  const image = images.get(memoryImageKey(kind));
  if (image) {
    drawContained(ctx, image, w, h);
    return;
  }
  const [sw, sh] = MEMORY_SPAN[kind];
  drawMemory(ctx, kind, w / 2, h / 2, Math.min(w / sw, h / sh));
}

/**
 * Les cubes de la tour d'Eden (D-118, D-122) : les quatre couleurs des îlots (`TOWER_CUBES`), une
 * forme simple sur la face (un rond, un triangle, un losange, une étoile), sans lettre. PLACEHOLDER.
 */
const CUBES_IN: Readonly<
  Record<'cube-tower-1' | 'cube-tower-2' | 'cube-tower-3' | 'cube-tower-4', number>
> = {
  'cube-tower-1': 1,
  'cube-tower-2': 2,
  'cube-tower-3': 3,
  'cube-tower-4': 4,
};

/** La forme en relief sur la face d'un cube (`k` : l'îlot), centrée en (cx, cy), de rayon `r`. */
function cubeShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  k: number,
): void {
  ctx.beginPath();
  switch (k % TOWER_CUBES.length) {
    case 0:
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 1:
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r * 0.8);
      ctx.lineTo(cx - r, cy + r * 0.8);
      break;
    case 2:
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      break;
    default:
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const d = i % 2 === 0 ? r * 1.1 : r * 0.45;
        ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      }
  }
  ctx.closePath();
  ctx.fill();
}

/** Un cube de la tour (`k` : l'îlot, dans l'ordre de `TOWER_CUBES`), coin haut gauche (x, y). */
function drawCube(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, k: number): void {
  ctx.fillStyle = TOWER_CUBES[k % TOWER_CUBES.length]?.color ?? '#ec8fab';
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, Math.max(1, s * 0.15));
  ctx.fill();
  // Le dessus, un peu plus clair ; le bord, un trait sombre.
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x + s * 0.12, y + s * 0.06, s * 0.76, s * 0.14);
  ctx.strokeStyle = 'rgba(59,51,48,0.45)';
  ctx.lineWidth = Math.max(0.5, s * 0.06);
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, Math.max(1, s * 0.15));
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  cubeShape(ctx, x + s / 2, y + s * 0.56, s * 0.24, k);
}

/** La tour de cubes (D-118, D-122) : `n` cubes empilés, un peu de travers, dans l'ordre des îlots. */
function drawCubeTower(ctx: CanvasRenderingContext2D, w: number, h: number, n: number): void {
  const s = 8;
  for (let k = 0; k < n; k++) {
    drawCube(ctx, (w - s) / 2 + (k % 2 === 0 ? 0 : 0.8), h - s * (k + 1), s, k);
  }
}

/** La tour tombée (D-122) : les quatre cubes par terre, éparpillés, l'un sur la tranche. */
function drawFallenTower(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const s = 8;
  drawCube(ctx, 1, h - s, s, 0);
  drawCube(ctx, w * 0.32, h - s, s, 2);
  drawCube(ctx, w - s - 1, h - s, s, 3);
  ctx.save();
  ctx.translate(w * 0.62, h - s * 0.75);
  ctx.rotate(0.5);
  drawCube(ctx, -s / 2, -s / 2, s, 1);
  ctx.restore();
}

/** Le tas de cubes (D-118), par terre. */
/**
 * Le tas de cubes du souvenir d'Eden : les `n` derniers des quatre (D-171). Le premier pris est
 * celui du dessus (le rose), puis ceux du bas, de gauche à droite.
 */
function drawCubePile(ctx: CanvasRenderingContext2D, h: number, n: number): void {
  const s = 7;
  const first = 4 - n;
  for (const [k, x, y] of [
    [1, 2, h - s],
    [2, 9, h - s],
    [3, 16, h - s],
    [0, 5.5, h - 2 * s],
  ] as const) {
    if (k >= first) {
      drawCube(ctx, x, y, s, k);
    }
  }
}

/**
 * Un cube d'îlot (D-122), posé au bout de l'îlot : plus gros que ceux de la tour (on le voit de
 * loin), la lueur turquoise du monde étrange autour.
 */
function drawIsletCube(ctx: CanvasRenderingContext2D, w: number, h: number, k: number): void {
  const s = 12;
  const cx = w / 2;
  const cy = h - s / 2;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
  glow.addColorStop(0, 'rgba(120, 240, 220, 0.45)');
  glow.addColorStop(1, 'rgba(120, 240, 220, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  drawCube(ctx, cx - s / 2, h - s, s, k);
}

/** Les cubes d'îlot, dans l'ordre de `TOWER_CUBES`. */
const ISLET_CUBE_INDEX: Partial<Record<PropKind, number>> = {
  'islet-cube-bed': 0,
  'islet-cube-school': 1,
  'islet-cube-station': 2,
  'islet-cube-sea': 3,
};
/** Les cubes dans leur creux, sur la porte de la sieste. */
const NAP_CUBE_INDEX: Partial<Record<PropKind, number>> = {
  'nap-cube-bed': 0,
  'nap-cube-school': 1,
  'nap-cube-station': 2,
  'nap-cube-sea': 3,
};

/**
 * Un cube dans son creux, sur la porte de la sieste (D-122) : centré 16 px au-dessus du bas du
 * cadre (là où `napdoor` dessine le creux), une petite lueur de sa couleur.
 */
function drawNapCube(ctx: CanvasRenderingContext2D, w: number, h: number, k: number): void {
  const s = 8;
  const cx = w / 2;
  const cy = h - 16;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
  glow.addColorStop(0, 'rgba(255, 240, 200, 0.6)');
  glow.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, cy - w / 2, w, w);
  drawCube(ctx, cx - s / 2, cy - s / 2, s, k);
}

/** Les cubes pâlis de la salle de jeux (D-117, D-122) et le cube dont ils sont le pâle reflet. */
const PALE_OF: Partial<Record<PropKind, PropKind>> = {
  'islet-cube-bed-pale': 'islet-cube-bed',
  'islet-cube-school-pale': 'islet-cube-school',
  'islet-cube-station-pale': 'islet-cube-station',
  'islet-cube-sea-pale': 'islet-cube-sea',
};
/** Le voile de l'effacement sur un objet pâli : gris et pâle, pas blanc (D-111). PLACEHOLDER. */
const ERASURE_PALE = 'rgba(196, 196, 204, 0.8)';

/**
 * Les couleurs qui reviennent à une partie de la salle de jeux (D-117) : une lueur chaude et
 * douce, posée sur le mur. PLACEHOLDER.
 */
function drawColorBloom(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, w * 0.5);
  g.addColorStop(0, 'rgba(255, 196, 150, 0.55)');
  g.addColorStop(0.5, 'rgba(240, 150, 170, 0.25)');
  g.addColorStop(1, 'rgba(240, 150, 170, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/**
 * L'effacement (D-111, D-117), au centre de la salle de jeux : une grande forme grise et pâle, sans
 * visage, au bord en brume, comme une tache qui ronge le dessin. Inquiétant, jamais horreur
 * (pilier 8). PLACEHOLDER.
 */
function drawErasureFigure(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h * 0.6, 0, w / 2, h * 0.6, w * 0.5);
  g.addColorStop(0, 'rgba(176, 176, 186, 0.75)');
  g.addColorStop(0.6, 'rgba(160, 160, 172, 0.45)');
  g.addColorStop(1, 'rgba(150, 150, 165, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.6, w * 0.48, h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Des formes de jouets sans couleur qui s'y défont (un cube, une balle), à peine visibles.
  ctx.strokeStyle = 'rgba(220, 220, 228, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.28, h * 0.5, w * 0.12, w * 0.12);
  ctx.beginPath();
  ctx.arc(w * 0.66, h * 0.62, w * 0.07, 0, Math.PI * 2);
  ctx.stroke();
}

/** Couleurs des veilleuses de la porte de la sieste, une par îlot (D-112). PLACEHOLDER. */
/**
 * Le tourne-disque du grenier (D-121), PLACEHOLDER : une valise rose ancien, le couvercle ouvert
 * derrière, le plateau sans disque, le bras levé. Vu de côté, un peu d'en haut.
 */
function drawRecordPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const top = y + h * 0.5;
  // Le couvercle ouvert, derrière.
  ctx.fillStyle = '#9c5468';
  ctx.fillRect(x + w * 0.08, y, w * 0.84, top - y);
  ctx.fillStyle = '#e8cdb4';
  ctx.fillRect(x + w * 0.14, y + h * 0.08, w * 0.72, top - y - h * 0.08);
  // La valise.
  ctx.fillStyle = '#b5677a';
  ctx.fillRect(x, top, w, y + h - top);
  ctx.fillStyle = '#8a4a5c';
  ctx.fillRect(x, y + h - h * 0.12, w, h * 0.12);
  ctx.fillStyle = '#f0dcc4';
  ctx.fillRect(x + w * 0.05, top, w * 0.9, h * 0.16);
  // Les deux boutons de la façade.
  ctx.fillStyle = '#f2e6c9';
  for (const k of [0.72, 0.86]) {
    ctx.beginPath();
    ctx.arc(x + w * k, top + (y + h - top) * 0.55, Math.max(0.6, h * 0.07), 0, Math.PI * 2);
    ctx.fill();
  }
  // Le plateau vide et son axe.
  ctx.fillStyle = '#3b3340';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.4, top + h * 0.06, w * 0.28, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9d2c8';
  ctx.fillRect(x + w * 0.4 - 0.4, top - h * 0.1, 0.8, h * 0.14);
  // Le bras, levé.
  ctx.strokeStyle = '#d9d2c8';
  ctx.lineWidth = Math.max(0.7, h * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.86, top + h * 0.04);
  ctx.lineTo(x + w * 0.84, top - h * 0.14);
  ctx.lineTo(x + w * 0.6, top - h * 0.22);
  ctx.stroke();
}

/** Un disque dans sa pochette, debout (D-121) : le disque dépasse en haut à droite. */
function drawRecordSleeve(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = '#2b2630';
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.42, w * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2e6c9';
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.42, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(0, h * 0.3, w * 0.7, h * 0.7);
  ctx.strokeStyle = 'rgba(59,51,48,0.55)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(0.3, h * 0.3 + 0.3, w * 0.7 - 0.6, h * 0.7 - 0.6);
}

export function drawProp(
  ctx: CanvasRenderingContext2D,
  kind: PropKind,
  images: ReadonlyMap<string, CanvasImageSource>,
): void {
  const { w, h } = PROP_SIZE[kind];
  const maria = images.get('maria');
  const pale = PALE_OF[kind];
  if (pale) {
    // Pâli par l'effacement (D-117) : le vrai objet, sous un voile gris et pâle.
    drawProp(ctx, pale, images);
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = ERASURE_PALE;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }
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
    case 'big-cradle':
      drawBigCradle(ctx, w, h, 'hidden');
      break;
    case 'big-cradle-maria':
      drawBigCradle(ctx, w, h, 'maria', maria);
      break;
    case 'big-cradle-empty':
      drawBigCradle(ctx, w, h, 'empty');
      break;
    case 'slipper':
      drawTreasureProp(ctx, memoryImageKey('slipper'), w, h, images, null, () => {
        drawSlipper(ctx, w, h);
      });
      break;
    case 'bottle':
      drawTreasureProp(ctx, memoryImageKey('bottle'), w, h, images, null, () => {
        drawBottle(ctx, w, h);
      });
      break;
    case 'headband':
      drawTreasureProp(ctx, memoryImageKey('headband'), w, h, images, null, () => {
        drawHeadband(ctx, w, h);
      });
      break;
    case 'blanket':
      drawBlanket(ctx, w, h);
      break;
    case 'bonnet':
      drawTreasureProp(ctx, memoryImageKey('bonnet'), w, h, images, null, () => {
        ctx.save();
        ctx.translate(w / 2, h / 2 + 1);
        bonnet(ctx, Math.min(w, h * 1.1));
        ctx.restore();
      });
      break;
    case 'gate':
      drawGate(ctx, w, h, false);
      break;
    case 'gate-open':
      drawGate(ctx, w, h, true);
      break;
    case 'watering-can':
    case 'ticket':
    case 'letter':
    case 'postcard':
    case 'school-drawing':
    case 'family-drawing':
    case 'rattle':
    case 'spoon':
      drawMemoryProp(ctx, kind, w, h, images);
      break;
    case 'baby-photo':
      // Photo encadrée posée debout, en haut de la bibliothèque.
      drawSketch(ctx, 'baby-photo', w / 2, h / 2, Math.min(w / 0.8, h / 0.88));
      break;
    case 'toy-town-lifted':
      // Au monde étrange (D-155) : le téléphone décroché, une lueur turquoise sort du combiné.
      drawToyTown(ctx, w, h, 'lifted', images);
      break;
    case 'far-crane':
      drawFarCrane(ctx, w, h);
      break;
    case 'roger': {
      // Roger (D-68), assis tout en haut de la tour : on le regarde, on ne le prend pas. L'image
      // fournie (D-69) remplace le dessin.
      const image = images.get('roger');
      if (image) {
        drawContained(ctx, image, w, h);
        break;
      }
      ctx.save();
      ctx.translate(w / 2, h * 0.56);
      roger(ctx, Math.min(w, h) * 1.05);
      ctx.restore();
      break;
    }
    case 'pink-kitchen':
      // La cuisine rose (D-88), au bout du train de la vaisselle : on la regarde, on ne la prend
      // pas. La lueur turquoise du monde étrange autour d'elle.
      drawTreasureProp(ctx, memoryImageKey('pink-kitchen'), w, h, images, STRANGE_GLOW, () => {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        pinkKitchen(ctx, Math.min(w, h), true);
        ctx.restore();
      });
      break;
    case 'music-book':
      // Le livre musical (D-104), sur le toit du carrousel étrange : on le regarde, on ne le prend
      // pas. La lueur turquoise du monde étrange autour de lui.
      drawTreasureProp(ctx, memoryImageKey('music-book'), w, h, images, STRANGE_GLOW, () => {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        musicBook(ctx, Math.min(w, h), true);
        ctx.restore();
      });
      break;
    case 'toy-kitchen':
      // Le souvenir jouable (D-89) : la dînette, telle qu'elle était, sans la lueur.
      ctx.save();
      ctx.translate(w / 2, h / 2);
      pinkKitchen(ctx, Math.min(w, h));
      ctx.restore();
      break;
    case 'tea-table':
      drawTeaTable(ctx, w, h, images.get('roger') ?? null);
      break;
    case 'tea-cup':
    case 'tea-cups-2':
    case 'tea-cups-3': {
      // Une tasse, ou deux, ou trois l'une dans l'autre (D-189), du bas vers le haut, à la place de
      // la tasse seule (5 px de haut) ; chacune dépasse de 2 px de celle d'en dessous.
      const cups = kind === 'tea-cup' ? 1 : kind === 'tea-cups-2' ? 2 : 3;
      const cup = PROP_SIZE['tea-cup'];
      for (let i = 0; i < cups; i++) {
        ctx.save();
        ctx.translate(w / 2, h - cup.h / 2 - i * 2);
        teaCup(ctx, Math.min(cup.w, cup.h));
        ctx.restore();
      }
      break;
    }
    case 'white-cloth':
      // Le torchon blanc (D-116), dans le petit lit de la sieste : on le regarde, on ne le prend pas.
      drawTreasureProp(ctx, memoryImageKey('white-cloth'), w, h, images, SOFT_GLOW, () => {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        whiteCloth(ctx, Math.min(w, h), true);
        ctx.restore();
      });
      break;
    case 'cube-pile':
      drawCubePile(ctx, h, 4);
      break;
    case 'cube-pile-3':
      drawCubePile(ctx, h, 3);
      break;
    case 'cube-pile-2':
      drawCubePile(ctx, h, 2);
      break;
    case 'cube-pile-1':
      drawCubePile(ctx, h, 1);
      break;
    case 'cube-tower-1':
    case 'cube-tower-2':
    case 'cube-tower-3':
    case 'cube-tower-4':
      drawCubeTower(ctx, w, h, CUBES_IN[kind]);
      break;
    case 'cube-tower-fallen':
      drawFallenTower(ctx, w, h);
      break;
    case 'islet-cube-bed':
    case 'islet-cube-school':
    case 'islet-cube-station':
    case 'islet-cube-sea':
      drawIsletCube(ctx, w, h, ISLET_CUBE_INDEX[kind] ?? 0);
      break;
    case 'nap-cube-bed':
    case 'nap-cube-school':
    case 'nap-cube-station':
    case 'nap-cube-sea':
      drawNapCube(ctx, w, h, NAP_CUBE_INDEX[kind] ?? 0);
      break;
    case 'color-bloom':
      drawColorBloom(ctx, w, h);
      break;
    case 'erasure-figure':
      drawErasureFigure(ctx, w, h);
      break;
    case 'site-gap':
      drawSiteGap(ctx, w, h);
      break;
    case 'quay-train':
      drawQuayTrain(ctx, w, h);
      break;
    case 'quay-train-day':
      drawQuayTrain(ctx, w, h, true);
      break;
    case 'door-glow':
      drawDoorGlow(ctx, w, h);
      break;
    case 'console-tv':
      drawConsoleTv(ctx, w, h);
      break;
    case 'height-chart':
    case 'height-chart-grown':
    case 'height-chart-older':
    case 'height-chart-fourth':
      ctx.save();
      ctx.translate(w / 2, h / 2);
      heightChart(ctx, w, h, HEIGHT_MARKS[kind]);
      ctx.restore();
      break;
    case 'record-player':
      drawRecordPlayer(ctx, 0, 0, w, h);
      break;
    case 'record-adventures':
      drawTreasureProp(ctx, kind, w, h, images, null, () => {
        drawRecordSleeve(ctx, w, h, '#e38aa0');
      });
      break;
    // Les deux autres disques (D-156), dans la couleur de leur pochette (`RECORDS`).
    case 'record-early':
      drawTreasureProp(ctx, kind, w, h, images, null, () => {
        drawRecordSleeve(ctx, w, h, '#7fb3a6');
      });
      break;
    case 'record-lullaby':
      drawTreasureProp(ctx, kind, w, h, images, null, () => {
        drawRecordSleeve(ctx, w, h, '#b7a3d6');
      });
      break;
    default:
      break;
  }
}

/** Taille d'une bulle (px logiques), traîne ou pointe comprise (D-165). */
export const BUBBLE_SIZE = { w: 46, h: 40 } as const;

/** Le papier des bulles (style « papier découpé », D-165) et son ombre portée. */
const BUBBLE_PAPER = '#fbf3e3';
const BUBBLE_SHADOW = 'rgba(52,34,28,0.32)';
const BUBBLE_SHADOW_OFFSET = { x: 1.1, y: 1.6 } as const;

/** Centre du nuage et ses lobes : un anneau régulier, aux rayons un peu variés. */
const CLOUD = { x: 25, y: 16 } as const;
const CLOUD_LOBES: readonly (readonly [number, number, number])[] = Array.from(
  { length: 10 },
  (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return [
      CLOUD.x + Math.cos(a) * 14.2,
      CLOUD.y + Math.sin(a) * 9,
      5.4 + 0.7 * Math.sin(i * 2.3 + 0.4),
    ] as const;
  },
);

/** Zone sûre du pictogramme, selon la forme (le pictogramme n'en sort jamais). */
const SAFE: Readonly<Record<BubbleKind, SafeBox>> = {
  thought: { x: CLOUD.x, y: CLOUD.y + 0.3, w: 26, h: 18 },
  speech: { x: 25, y: 16.5, w: 30, h: 19 },
};
/** Agrandissement maximal d'un petit pictogramme. */
const MAX_FIT = 1.5;

/** Le nuage de Céleste et sa traîne de petites bulles, vers sa tête (en bas à gauche). */
function cloudPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.ellipse(CLOUD.x, CLOUD.y, 15, 10, 0, 0, Math.PI * 2);
  for (const [x, y, r] of CLOUD_LOBES) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.moveTo(13.3, 33);
  ctx.arc(10.6, 33, 2.7, 0, Math.PI * 2);
  ctx.moveTo(6.6, 37.4);
  ctx.arc(5, 37.4, 1.6, 0, Math.PI * 2);
}

/** La bulle de parole d'un personnage et sa pointe, vers sa bouche (en bas à gauche). */
function speechPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.roundRect(5, 3, 40, 27, 12.5);
  // Même sens de tracé que le corps : sinon leur recouvrement se vide (règle non nulle).
  ctx.moveTo(20, 28);
  ctx.quadraticCurveTo(14.5, 35, 5, 38.5);
  ctx.quadraticCurveTo(10, 34, 11, 27);
  ctx.closePath();
}

/** Le grain du papier : des points clairs et sombres, toujours les mêmes. */
function paperGrain(ctx: CanvasRenderingContext2D): void {
  let seed = 7;
  const random = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = random() < 0.5 ? 'rgba(120,96,80,0.07)' : 'rgba(255,255,255,0.35)';
    ctx.fillRect(random() * BUBBLE_SIZE.w, random() * BUBBLE_SIZE.h, 0.6, 0.6);
  }
}

/** Rectangle occupé par un pictogramme, mesuré une fois (px logiques, autour de son centre). */
interface IconBounds {
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
}
/** Taille (px logiques) et finesse de la mesure. */
const MEASURE_SIZE = 64;
const MEASURE_RES = 4;
const iconBounds = new Map<string, IconBounds>();

/**
 * Le rectangle qu'occupe vraiment un pictogramme : dessiné une fois à part, ses pixels mesurés. Le
 * même pour toutes les bulles des cubes (les creux ont la taille des cubes).
 */
function measureIcon(
  icon: ThoughtIcon,
  images: ReadonlyMap<string, CanvasImageSource>,
): IconBounds {
  const cacheKey = images.has('maria') ? icon : `${icon}-drawn`;
  const cached = iconBounds.get(cacheKey);
  if (cached) {
    return cached;
  }
  const px = MEASURE_SIZE * MEASURE_RES;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let bounds: IconBounds = { cx: MEASURE_SIZE / 2, cy: MEASURE_SIZE / 2, w: 0, h: 0 };
  if (ctx) {
    ctx.scale(MEASURE_RES, MEASURE_RES);
    drawIconAt(
      ctx,
      icon,
      images,
      MEASURE_SIZE / 2,
      MEASURE_SIZE / 2,
      (1 << TOWER_CUBES.length) - 1,
    );
    const data = ctx.getImageData(0, 0, px, px).data;
    let x0 = px;
    let y0 = px;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        if ((data[(y * px + x) * 4 + 3] ?? 0) > 8) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
      }
    }
    if (x1 >= 0) {
      bounds = {
        cx: (x0 + x1 + 1) / 2 / MEASURE_RES,
        cy: (y0 + y1 + 1) / 2 / MEASURE_RES,
        w: (x1 - x0 + 1) / MEASURE_RES,
        h: (y1 - y0 + 1) / MEASURE_RES,
      };
    }
  }
  iconBounds.set(cacheKey, bounds);
  return bounds;
}

/** Un pictogramme dessiné autour de (cx, cy) ; `cubes` : les cubes trouvés (bulle des cubes). */
function drawIconAt(
  ctx: CanvasRenderingContext2D,
  icon: ThoughtIcon,
  images: ReadonlyMap<string, CanvasImageSource>,
  cx: number,
  cy: number,
  cubes: number,
): void {
  ctx.save();
  if (icon === 'cubes') {
    drawCubeSlots(ctx, cx, cy, cubes);
  } else {
    drawIcon(ctx, icon, images, cx, cy);
  }
  ctx.restore();
}

/**
 * Une bulle (D-165), style « papier découpé » : sans trait, une ombre portée nette, un papier grainé.
 * `thought` : le nuage de Céleste ; `speech` : la bulle de parole d'un autre personnage. `side` -1 :
 * la bulle part vers la gauche (la forme en miroir, jamais le pictogramme). Le pictogramme, mesuré,
 * est posé dans la zone sûre : il ne déborde jamais.
 */
export function drawBubble(
  ctx: CanvasRenderingContext2D,
  kind: BubbleKind,
  icon: ThoughtIcon,
  images: ReadonlyMap<string, CanvasImageSource>,
  side: BubbleSide = 1,
  /** Bulle `cubes` : les cubes déjà trouvés (`towerCubesMask`). */
  cubes = 0,
): void {
  const path = kind === 'thought' ? cloudPath : speechPath;
  ctx.save();
  if (side < 0) {
    ctx.translate(BUBBLE_SIZE.w, 0);
    ctx.scale(-1, 1);
  }
  ctx.save();
  ctx.translate(BUBBLE_SHADOW_OFFSET.x, BUBBLE_SHADOW_OFFSET.y);
  path(ctx);
  ctx.fillStyle = BUBBLE_SHADOW;
  ctx.fill();
  ctx.restore();
  path(ctx);
  ctx.fillStyle = BUBBLE_PAPER;
  ctx.fill();
  ctx.clip();
  paperGrain(ctx);
  ctx.restore();

  const bounds = measureIcon(icon, images);
  const safe = SAFE[kind];
  const k = fitScale(bounds.w, bounds.h, safe, MAX_FIT);
  ctx.save();
  ctx.translate(safe.x, safe.y);
  ctx.scale(k, k);
  ctx.translate(-bounds.cx, -bounds.cy);
  drawIconAt(ctx, icon, images, MEASURE_SIZE / 2, MEASURE_SIZE / 2, cubes);
  ctx.restore();
}

/**
 * Les quatre cubes de la tour d'Eden (D-122), en rang : un cube plein pour chaque îlot fait, un
 * creux en pointillés pour les autres. Sans chiffre ni texte.
 */
function drawCubeSlots(ctx: CanvasRenderingContext2D, cx: number, cy: number, mask: number): void {
  const s = 4.4;
  const gap = 0.9;
  const x0 = cx - (TOWER_CUBES.length * s + (TOWER_CUBES.length - 1) * gap) / 2;
  TOWER_CUBES.forEach((_, k) => {
    const x = x0 + k * (s + gap);
    const y = cy - s / 2 + 0.5;
    if ((mask & (1 << k)) !== 0) {
      drawCube(ctx, x, y, s, k);
      return;
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(91,74,68,0.6)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([0.9, 0.7]);
    ctx.strokeRect(x + 0.25, y + 0.25, s - 0.5, s - 0.5);
    ctx.restore();
  });
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: ThoughtIcon,
  images: ReadonlyMap<string, CanvasImageSource>,
  cx: number,
  cy: number,
): void {
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
      // Des « z » à la place de la lune (D-165).
      ctx.strokeStyle = '#6d86c2';
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [x, y, z] of [
        [cx + 1.5, cy - 3.2, 3.2],
        [cx + 5.2, cy - 6.6, 2.4],
        [cx + 8, cy - 9, 1.8],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(x, y - z);
        ctx.lineTo(x + z, y - z);
        ctx.lineTo(x, y);
        ctx.lineTo(x + z, y);
        ctx.stroke();
      }
      break;
    case 'book': {
      // Livre ouvert : l'histoire du soir.
      ctx.fillStyle = '#6d86c2';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx - 8, cy + 2);
      ctx.lineTo(cx - 8, cy - 4);
      ctx.lineTo(cx, cy - 2);
      ctx.lineTo(cx + 8, cy - 4);
      ctx.lineTo(cx + 8, cy + 2);
      ctx.fill();
      ctx.fillStyle = '#fdf8ee';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 3);
      ctx.lineTo(cx - 7, cy + 1);
      ctx.lineTo(cx - 7, cy - 4.5);
      ctx.lineTo(cx, cy - 2.5);
      ctx.lineTo(cx + 7, cy - 4.5);
      ctx.lineTo(cx + 7, cy + 1);
      ctx.fill();
      ctx.fillStyle = 'rgba(91,74,68,0.5)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(cx - 6, cy - 2.5 + i * 1.5, 4.5, 0.5);
        ctx.fillRect(cx + 1.5, cy - 2.5 + i * 1.5, 4.5, 0.5);
      }
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 6.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'blanket':
      ctx.save();
      ctx.translate(cx - 7.5, cy - 4);
      ctx.scale(1.5, 1.5);
      drawBlanket(ctx, 10, 5);
      ctx.restore();
      break;
    case 'maria':
      mariaHead(ctx, cx, cy, 6, maria);
      break;
    case 'maria-shelf':
      // Maria assise sur une planche, deux équerres dessous (D-144) : là où la ranger.
      ctx.save();
      ctx.translate(cx - 3.2, cy - 8.5);
      ctx.scale(0.8, 0.8);
      drawMariaSit(ctx, 8, 13, maria);
      ctx.restore();
      ctx.fillStyle = WOOD;
      ctx.fillRect(cx - 9, cy + 2, 18, 2);
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(cx - 7, cy + 4, 1.2, 3);
      ctx.fillRect(cx + 5.8, cy + 4, 1.2, 3);
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
    case 'family':
      drawMemory(ctx, 'photo', cx, cy, 18);
      break;
    case 'drawing':
      drawMemory(ctx, 'school-drawing', cx, cy, 18);
      break;
    case 'music':
      drawNotes(ctx, cx, cy, 11);
      break;
    case 'flower':
      drawSketch(ctx, 'plant', cx, cy + 1, 17);
      break;
    case 'baby':
      drawSketch(ctx, 'baby-photo', cx, cy, 17);
      break;
    case 'height':
      drawMemory(ctx, 'height', cx, cy, 18);
      break;
    case 'sea': {
      // La mer (D-169) : un soleil au-dessus de deux vagues.
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(cx + 3, cy - 3.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4f7fb8';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const y of [cy + 1.5, cy + 5]) {
        ctx.moveTo(cx - 8, y);
        for (let x = cx - 8; x < cx + 8; x += 4) {
          ctx.quadraticCurveTo(x + 1, y - 2, x + 2, y);
          ctx.quadraticCurveTo(x + 3, y + 2, x + 4, y);
        }
      }
      ctx.stroke();
      break;
    }
    case 'home':
      // La maison (D-169) : le toit rose, la fenêtre allumée.
      ctx.fillStyle = '#f3ead7';
      ctx.fillRect(cx - 6, cy - 1, 12, 8);
      ctx.fillStyle = '#d9788f';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 0.5);
      ctx.lineTo(cx, cy - 7.5);
      ctx.lineTo(cx + 8, cy - 0.5);
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(cx - 4, cy + 1, 3.5, 3);
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(cx + 1.5, cy + 2, 3, 5);
      break;
    case 'hide-seek':
      // Cache-cache (D-171) : un visage, les deux mains sur les yeux.
      faceIcon(ctx, cx, cy + 1);
      // Deux mains ouvertes, les doigts vers le haut, penchées vers le milieu : elles débordent du
      // visage (sinon on dirait des lunettes).
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(cx + s * 3.2, cy - 0.8);
        ctx.rotate(s * 0.35);
        ctx.fillStyle = HAND;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.roundRect(-2.4, -1.2, 4.8, 4.6, 1.6);
        ctx.fill();
        ctx.stroke();
        for (let f = 0; f < 3; f++) {
          ctx.beginPath();
          ctx.roundRect(-2.2 + f * 1.55, -5.4, 1.3, 4.6, 0.65);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy + 3.8, 1.6, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      break;
    case 'eden-where':
      // Où est Eden ? (D-171) : son visage, blond à la coupe au bol (D-122), et un « ? ».
      faceIcon(ctx, cx - 2, cy + 1);
      ctx.fillStyle = '#e8c96a';
      ctx.beginPath();
      ctx.arc(cx - 2, cy + 0.6, 6.8, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 4.8, cy + 0.2);
      ctx.lineTo(cx - 8.8, cy + 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = INK;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx - 2 + s * 2.4, cy + 2.2, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx + 7, cy - 5, 2.2, Math.PI * 1.1, Math.PI * 2.4);
      ctx.lineTo(cx + 7, cy - 1.8);
      ctx.stroke();
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(cx + 7, cy + 0.6, 0.85, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'handle': {
      // Une porte, la poignée tout en haut, et une petite main qui n'y arrive pas (D-46).
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(cx - 4, cy - 6, 8, 12);
      ctx.fillStyle = '#bfe3b0';
      ctx.fillRect(cx - 2.5, cy - 4.5, 5, 4);
      ctx.fillStyle = '#e6c27a';
      ctx.beginPath();
      ctx.arc(cx + 2.4, cy - 5, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 5);
      ctx.lineTo(cx + 6, cy + 0.5);
      ctx.moveTo(cx + 6, cy + 0.5);
      ctx.lineTo(cx + 5, cy - 1);
      ctx.moveTo(cx + 6, cy + 0.5);
      ctx.lineTo(cx + 7, cy - 1.2);
      ctx.stroke();
      break;
    }
    case 'sun': {
      // Il fait beau : un soleil et une fleur (envie de jouer dehors, D-46).
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 1.5, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(cx - 2 + Math.cos(a) * 4.8, cy - 1.5 + Math.sin(a) * 4.8);
        ctx.lineTo(cx - 2 + Math.cos(a) * 6.3, cy - 1.5 + Math.sin(a) * 6.3);
      }
      ctx.stroke();
      ctx.strokeStyle = '#6f9a62';
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + 6);
      ctx.lineTo(cx + 6, cy + 1);
      ctx.stroke();
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mom':
      momHead(ctx, cx, cy - 2, 4.8);
      break;
    case 'dad':
      dadHead(ctx, cx, cy - 2, 4.8);
      break;
    case 'crane':
      // La grue du chantier (D-63) : mât, flèche, crochet ; un petit point jaune au bout (le parapluie).
      ctx.strokeStyle = '#e8b23a';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy + 7);
      ctx.lineTo(cx + 3, cy - 6);
      ctx.moveTo(cx - 8, cy - 4);
      ctx.lineTo(cx + 7, cy - 4);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 4);
      ctx.lineTo(cx - 2, cy + 1);
      ctx.stroke();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 5.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'train': {
      // Un train (D-69) : une voiture bleue, sa porte ouverte et la lueur turquoise.
      ctx.fillStyle = '#3d5f8f';
      ctx.beginPath();
      ctx.roundRect(cx - 9, cy - 5, 18, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(cx - 9, cy + 2, 18, 1.2);
      ctx.fillStyle = '#bcd0e4';
      ctx.fillRect(cx - 7, cy - 3, 3.5, 3);
      ctx.fillRect(cx + 3.5, cy - 3, 3.5, 3);
      const glow = ctx.createRadialGradient(cx, cy + 1, 0, cx, cy + 1, 4);
      glow.addColorStop(0, 'rgba(150, 245, 230, 1)');
      glow.addColorStop(1, 'rgba(90, 210, 196, 0.9)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 1.8, cy - 3.5, 3.6, 8.5);
      ctx.fillStyle = INK;
      for (const x of [cx - 5.5, cx + 5.5]) {
        ctx.beginPath();
        ctx.arc(x, cy + 6, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'search': {
      // Une loupe : « cherche bien » (D-50).
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 2.5, cy + 2.5);
      ctx.lineTo(cx + 6, cy + 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(191,227,240,0.8)';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(cx - 3, cy - 3.5, 1.2, 1.2);
      break;
    }
    case 'treehouse': {
      // La cabane dans l'arbre (D-50) : feuillage, tronc, petite maison et son toit.
      ctx.fillStyle = '#6f9a62';
      ctx.beginPath();
      ctx.arc(cx, cy - 3.5, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7b5a3e';
      ctx.fillRect(cx - 1.2, cy - 1, 2.4, 8);
      ctx.fillStyle = '#c79d6f';
      ctx.fillRect(cx - 4, cy - 3, 8, 4.5);
      ctx.fillStyle = '#9b5b4a';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 3);
      ctx.lineTo(cx, cy - 6.5);
      ctx.lineTo(cx + 5, cy - 3);
      ctx.fill();
      ctx.fillStyle = '#3a3228';
      ctx.fillRect(cx - 1, cy - 1.5, 2, 3);
      break;
    }
    case 'hedge': {
      // La haie (D-55) : un buisson, un trou sombre au pied, une étincelle dedans. Réduite pour
      // tenir dans le nuage.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(0.78, 0.78);
      ctx.translate(-cx, -cy + 1);
      ctx.fillStyle = '#6f9a62';
      for (const [dx, dy, r] of [
        [-4, -1, 4],
        [0, -3, 4.5],
        [4, -1, 4],
        [-5, 3, 3],
        [5, 3, 3],
      ] as const) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillRect(cx - 7, cy + 1, 14, 5);
      ctx.fillStyle = '#2d3a2a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 3.2, 2.6, 0, Math.PI, 0);
      ctx.lineTo(cx + 3.2, cy + 6);
      ctx.lineTo(cx - 3.2, cy + 6);
      ctx.fill();
      ctx.fillStyle = '#f5e27a';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 1.6);
      ctx.lineTo(cx + 0.8, cy + 3.4);
      ctx.lineTo(cx + 2.4, cy + 4.1);
      ctx.lineTo(cx + 0.8, cy + 4.8);
      ctx.lineTo(cx, cy + 6.4);
      ctx.lineTo(cx - 0.8, cy + 4.8);
      ctx.lineTo(cx - 2.4, cy + 4.1);
      ctx.lineTo(cx - 0.8, cy + 3.4);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'gate':
      // Le portillon (D-60) : deux piliers, lattes, traverse.
      ctx.fillStyle = '#a89478';
      ctx.fillRect(cx - 7, cy - 5, 2.5, 11);
      ctx.fillRect(cx + 4.5, cy - 5, 2.5, 11);
      ctx.fillStyle = '#b58a5f';
      for (let x = cx - 4; x < cx + 4; x += 2.2) {
        ctx.fillRect(x, cy - 3, 1.5, 8);
      }
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(cx - 4.5, cy - 1, 9, 1.4);
      ctx.fillStyle = '#7a7066';
      ctx.fillRect(cx + 2, cy - 3.5, 2.2, 1);
      break;
    case 'cord':
      // La ficelle rouge (D-60) : elle monte le long du mur jusqu'à la chevillette, pendue en haut.
      ctx.fillStyle = '#a89478';
      ctx.fillRect(cx - 7, cy - 6, 2.5, 12);
      ctx.strokeStyle = '#b5534a';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + 6);
      ctx.lineTo(cx + 6, cy + 3);
      ctx.lineTo(cx - 3, cy + 3);
      ctx.lineTo(cx - 3, cy - 2.5);
      ctx.stroke();
      ctx.fillStyle = WOOD_DARK;
      ctx.beginPath();
      ctx.roundRect(cx - 4.5, cy - 6.5, 3, 5, 1.5);
      ctx.fill();
      // Une petite flèche : c'est en haut qu'il faut aller.
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx + 2, cy - 1);
      ctx.lineTo(cx + 2, cy - 6);
      ctx.moveTo(cx + 0.4, cy - 4.4);
      ctx.lineTo(cx + 2, cy - 6);
      ctx.lineTo(cx + 3.6, cy - 4.4);
      ctx.stroke();
      break;
    case 'umbrella': {
      // Aide du parapluie (D-62, D-70) : deux flèches de saut (une nouvelle pression en l'air),
      // puis le parapluie ouvert.
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const y of [cy + 1, cy - 4]) {
        ctx.moveTo(cx - 7.6, y + 2.2);
        ctx.lineTo(cx - 6, y);
        ctx.lineTo(cx - 4.4, y + 2.2);
      }
      ctx.moveTo(cx - 6, cy + 6);
      ctx.lineTo(cx - 6, cy - 4);
      ctx.stroke();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(cx - 1, cy - 1);
      ctx.quadraticCurveTo(cx + 3.5, cy - 8.5, cx + 8, cy - 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a5a44';
      ctx.beginPath();
      ctx.moveTo(cx + 3.5, cy - 3);
      ctx.lineTo(cx + 3.5, cy + 4);
      ctx.arc(cx + 4.4, cy + 4, 0.9, Math.PI, 0, true);
      ctx.stroke();
      break;
    }
    case 'hook': {
      // Aide du crochet (D-65) : un câble en pente, le crochet du parapluie posé dessus, une
      // flèche qui descend le long du câble.
      ctx.strokeStyle = '#3b3640';
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 6);
      ctx.lineTo(cx + 8, cy);
      ctx.stroke();
      ctx.strokeStyle = '#8a5a44';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3.2, 1.3, Math.PI, 0);
      ctx.moveTo(cx - 1.7, cy - 3.2);
      ctx.lineTo(cx - 1.7, cy + 1);
      ctx.stroke();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(cx - 1.7, cy + 0.5);
      ctx.lineTo(cx - 0.6, cy + 5.5);
      ctx.lineTo(cx - 2.8, cy + 5.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx + 1.5, cy - 4.5);
      ctx.lineTo(cx + 7, cy - 2.4);
      ctx.moveTo(cx + 5.2, cy - 4);
      ctx.lineTo(cx + 7, cy - 2.4);
      ctx.lineTo(cx + 5, cy - 1.4);
      ctx.stroke();
      break;
    }
    case 'slide': {
      // Aide de la glissade (D-84, D-85) : une barrière basse, quelqu'un couché qui passe dessous,
      // une flèche.
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 6);
      ctx.lineTo(cx + 9, cy + 6);
      ctx.moveTo(cx + 1, cy + 6);
      ctx.lineTo(cx + 1, cy - 2);
      ctx.lineTo(cx + 8, cy - 2);
      ctx.lineTo(cx + 8, cy + 6);
      ctx.stroke();
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(cx - 0.5, cy + 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy + 3.8);
      ctx.lineTo(cx - 8, cy + 4.5);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 1);
      ctx.lineTo(cx - 3, cy - 1);
      ctx.moveTo(cx - 5, cy - 2.6);
      ctx.lineTo(cx - 3, cy - 1);
      ctx.lineTo(cx - 5, cy + 0.6);
      ctx.stroke();
      break;
    }
    case 'shift': {
      // Aide de la bascule (D-107) : la planche où l'on est (pleine), celle de l'autre couche (en
      // pointillés), et la flèche qui passe de l'une à l'autre.
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.strokeRect(cx - 9, cy + 3, 8, 3);
      ctx.strokeStyle = PINK;
      ctx.setLineDash([1.6, 1.4]);
      ctx.strokeRect(cx + 1, cy - 6, 8, 3);
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 1.5);
      ctx.quadraticCurveTo(cx - 4, cy - 5, cx - 0.5, cy - 4.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx - 2.4, cy - 6);
      ctx.lineTo(cx - 0.5, cy - 4.5);
      ctx.lineTo(cx - 2.6, cy - 3.2);
      ctx.stroke();
      break;
    }
    case 'carousel': {
      // Le carrousel (D-101) : un toit rayé pointu, le mât, un cheval de bois.
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 2);
      ctx.lineTo(cx, cy - 9);
      ctx.lineTo(cx + 9, cy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 2);
      ctx.lineTo(cx + 9, cy - 2);
      ctx.moveTo(cx, cy - 2);
      ctx.lineTo(cx, cy + 7);
      ctx.moveTo(cx - 9, cy + 7);
      ctx.lineTo(cx + 9, cy + 7);
      ctx.stroke();
      ctx.fillStyle = WOOD;
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy + 3, 4, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx + 5, cy - 1, 2, 3);
      break;
    }
    case 'tide': {
      // La marée (D-99) : deux vagues bleues, une flèche qui monte à côté.
      ctx.strokeStyle = '#4f86b8';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const y of [cy + 1, cy + 5]) {
        ctx.moveTo(cx - 9, y);
        ctx.quadraticCurveTo(cx - 6, y - 3, cx - 3, y);
        ctx.quadraticCurveTo(cx, y + 3, cx + 3, y);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy + 6);
      ctx.lineTo(cx + 7, cy - 5);
      ctx.moveTo(cx + 5, cy - 3);
      ctx.lineTo(cx + 7, cy - 5);
      ctx.lineTo(cx + 9, cy - 3);
      ctx.stroke();
      break;
    }
    case 'record':
      // Le tourne-disque sans disque (D-121), et un petit « ? » au crayon.
      drawRecordPlayer(ctx, cx - 9, cy - 3, 12, 8);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 3, 2.2, Math.PI * 1.1, Math.PI * 2.4);
      ctx.lineTo(cx + 6, cy + 0.5);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx + 6, cy + 3, 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'question':
      // « ? » seul, au crayon : un parent qui ne sait pas (D-37).
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy - 2.5, 3, Math.PI * 1.1, Math.PI * 2.4);
      ctx.lineTo(cx, cy + 2);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 1, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'smile':
      faceIcon(ctx, cx, cy);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + s * 2.4, cy - 0.6, 1.2, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy + 1.1, 2.6, Math.PI * 0.18, Math.PI * 0.82);
      ctx.stroke();
      break;
    case 'hush':
      faceIcon(ctx, cx, cy);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * 2.4 - 1, cy - 0.9);
        ctx.lineTo(cx + s * 2.4 + 1, cy - 0.9);
        ctx.stroke();
      }
      // Le doigt sur la bouche, et le poing.
      ctx.fillStyle = HAND;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.roundRect(cx - 0.95, cy + 0.4, 1.9, 7.4, 0.95);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(cx - 2.2, cy + 5.2, 4.4, 3.6, 1.4);
      ctx.fill();
      ctx.stroke();
      break;
    case 'wave': {
      // Une main ouverte, un peu penchée, et deux traits de mouvement.
      ctx.save();
      ctx.translate(cx, cy + 1);
      ctx.rotate(-0.22);
      ctx.fillStyle = HAND;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.6;
      const tops = [1.2, 0, 0.3, 1.5] as const;
      tops.forEach((top, i) => {
        ctx.beginPath();
        ctx.roundRect(-3.9 + i * 2.05, -7 + top, 1.85, 7, 0.92);
        ctx.fill();
        ctx.stroke();
      });
      ctx.save();
      ctx.translate(-4, 1.8);
      ctx.rotate(-0.75);
      ctx.beginPath();
      ctx.roundRect(-1, -4.6, 2, 5, 1);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.roundRect(-4.1, -2, 8.2, 7, 2.6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(91,74,68,0.75)';
      ctx.lineWidth = 0.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2.5, 7.5, Math.PI * 1.08, Math.PI * 1.32);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 2, cy - 2.5, 7.5, -Math.PI * 0.32, -Math.PI * 0.08);
      ctx.stroke();
      break;
    }
    case 'wonder':
      ctx.fillStyle = GOLD;
      sparkleStar(ctx, cx - 1, cy + 0.5, 6.8);
      ctx.fillStyle = '#fff3c4';
      sparkleStar(ctx, cx - 1, cy + 0.5, 2.4);
      ctx.fillStyle = GOLD;
      sparkleStar(ctx, cx + 6, cy - 4.5, 2.6);
      ctx.fillStyle = PINK;
      sparkleStar(ctx, cx + 5.5, cy + 5, 1.8);
      break;
    case 'miss':
      // Un petit nuage gris et trois gouttes.
      ctx.fillStyle = '#a9b6c8';
      ctx.beginPath();
      ctx.arc(cx - 3.4, cy - 1.2, 3.3, 0, Math.PI * 2);
      ctx.arc(cx + 0.4, cy - 3.2, 4.2, 0, Math.PI * 2);
      ctx.arc(cx + 4.1, cy - 0.9, 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 3.4, cy - 1.2, 7.5, 3.2);
      ctx.fillStyle = '#5d86c9';
      for (const [dx, dy] of [
        [-3, 5],
        [0.6, 6.6],
        [4, 4.8],
      ] as const) {
        const x = cx + dx;
        const y = cy + dy;
        ctx.beginPath();
        ctx.moveTo(x, y - 2.2);
        ctx.quadraticCurveTo(x + 1.2, y - 0.2, x, y + 0.9);
        ctx.quadraticCurveTo(x - 1.2, y - 0.2, x, y - 2.2);
        ctx.fill();
      }
      break;
    case 'call':
      // « ! » : papa appelle Céleste (D-166).
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.roundRect(cx - 1.4, cy - 7.5, 2.8, 10, 1.4);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + 5.6, 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'gamepad':
      drawGamepad(ctx, cx, cy, 1);
      break;
    case 'tv':
      // La télé et sa console : installée dans la chambre (D-166).
      drawTv(ctx, cx - 8, cy - 7, 13, 10);
      ctx.fillStyle = TV_BODY;
      ctx.fillRect(cx - 3, cy + 3, 3, 2);
      ctx.fillRect(cx - 5, cy + 5, 7, 1.5);
      ctx.fillStyle = CONSOLE_PINK;
      ctx.strokeStyle = CONSOLE_DARK;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.roundRect(cx + 3, cy + 2.5, 6, 4, 1);
      ctx.fill();
      ctx.stroke();
      break;
    case 'locked':
      // Une porte cintrée et son cadenas.
      ctx.fillStyle = WOOD_DARK;
      ctx.beginPath();
      ctx.roundRect(cx - 6, cy - 7.5, 10, 15, [4.5, 4.5, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 0.7;
      ctx.strokeRect(cx - 4.4, cy - 3.6, 6.8, 3.6);
      ctx.strokeRect(cx - 4.4, cy + 1.2, 6.8, 4.4);
      ctx.strokeStyle = '#8b8f96';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(cx + 4.4, cy + 0.6, 2.3, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#e6c27a';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.roundRect(cx + 1.1, cy + 0.6, 6.6, 5.4, 1.1);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx + 4.4, cy + 2.8, 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx + 4.05, cy + 2.8, 0.7, 1.7);
      break;
  }
}

const HAND = '#f1c9a5';
const GOLD = '#f2c14e';
/** La console de Céleste (D-166) : le rose de la console, l'écran pastel. PLACEHOLDER. */
const CONSOLE_PINK = '#f2a7c3';
const CONSOLE_DARK = '#7a2f4d';
const CONSOLE_SCREEN = '#fde6ef';
const CONSOLE_MAUVE = '#9b7fd1';
const TV_BODY = '#4a3a44';

/** Une manette rose : la croix et deux boutons (pictogramme du cadeau, et sur la console). */
function drawGamepad(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.fillStyle = CONSOLE_PINK;
  ctx.strokeStyle = CONSOLE_DARK;
  ctx.lineWidth = 0.9 * s;
  ctx.beginPath();
  ctx.roundRect(cx - 7 * s, cy - 3.5 * s, 14 * s, 7 * s, 3.5 * s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CONSOLE_DARK;
  ctx.fillRect(cx - 5.2 * s, cy - 0.5 * s, 3.6 * s, 1 * s);
  ctx.fillRect(cx - 3.9 * s, cy - 1.8 * s, 1 * s, 3.6 * s);
  ctx.beginPath();
  ctx.arc(cx + 3 * s, cy + 0.9 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.arc(cx + 5 * s, cy - 0.9 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();
}

/** Une petite télé à l'écran pastel (un poteau, un câble) ; `s` : l'échelle. */
function drawTv(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = TV_BODY;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2.5);
  ctx.fill();
  const sx = x + 2.5;
  const sy = y + 2.5;
  const sw = w - 5;
  const sh = h - 5;
  ctx.fillStyle = CONSOLE_SCREEN;
  ctx.fillRect(sx, sy, sw, sh);
  // Un écran des tyroliennes : un câble, un poteau mauve.
  ctx.strokeStyle = TV_BODY;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(sx + sw * 0.1, sy + sh * 0.25);
  ctx.lineTo(sx + sw * 0.62, sy + sh * 0.5);
  ctx.stroke();
  ctx.fillStyle = CONSOLE_MAUVE;
  ctx.fillRect(sx + sw * 0.7, sy + sh * 0.6, sw * 0.18, sh * 0.4);
}

/** La console de salon sur le bureau de la chambre (D-166) : la télé, la console, la manette. */
function drawConsoleTv(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  drawTv(ctx, 3, 2, 26, 20);
  // Le pied de la télé.
  ctx.fillStyle = TV_BODY;
  ctx.fillRect(13, 22, 6, 4);
  ctx.fillRect(9, h - 3, 14, 3);
  // La console à côté, et la manette posée dessus, reliée par son fil.
  ctx.fillStyle = CONSOLE_PINK;
  ctx.strokeStyle = CONSOLE_DARK;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(w - 14, h - 7, 13, 7, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CONSOLE_DARK;
  ctx.fillRect(w - 11, h - 4.5, 7, 1);
  ctx.strokeStyle = TV_BODY;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(w - 7, h - 7);
  ctx.quadraticCurveTo(w - 3, h - 12, w - 7.5, h - 12.5);
  ctx.stroke();
  drawGamepad(ctx, w - 8, h - 14.5, 0.55);
}

/** Un visage rond aux joues roses (sourire, « chut »). */
function faceIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillStyle = '#fbe6cf';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(cx, cy, 6.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(224,89,139,0.45)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + s * 3.7, cy + 1.7, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Une étoile à quatre branches, aux côtés creusés. */
function sparkleStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const k = r * 0.24;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k, y - k, x + r, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + r);
  ctx.quadraticCurveTo(x - k, y + k, x - r, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - r);
  ctx.fill();
}

/**
 * Un croissant de lune : le disque, moins la morsure, découpée par un masque (et non effacée : elle
 * trouait ce qui était dessous, la bulle comprise, D-165).
 */
function moon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 4, y - 4, 8, 8);
  ctx.arc(x + 1.6, y - 1, 2.6, 0, Math.PI * 2);
  ctx.clip('evenodd');
  ctx.fillStyle = '#e6c27a';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Petite étincelle au-dessus de ce qu'on peut faire (Agir). */
export const SPARKLE_SIZE = 7;
/** Taille (px logiques) du cœur d'Agir maintenu (D-171). */
export const HOLD_HEART_SIZE = 14;

/**
 * Le cœur d'Agir maintenu (D-171), à la place de l'étincelle : vide (un contour pâle, un halo), ou
 * plein (rose) ; le plein se découvre de bas en haut à mesure qu'on maintient.
 */
export function drawHoldHeart(ctx: CanvasRenderingContext2D, filled: boolean): void {
  const c = HOLD_HEART_SIZE / 2;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(c, c + 5.5);
    ctx.bezierCurveTo(c - 8.5, c - 1, c - 3.2, c - 7.5, c, c - 2.7);
    ctx.bezierCurveTo(c + 3.2, c - 7.5, c + 8.5, c - 1, c, c + 5.5);
  };
  if (filled) {
    ctx.fillStyle = PINK;
    path();
    ctx.fill();
    return;
  }
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, 'rgba(255,236,190,0.55)');
  halo.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, HOLD_HEART_SIZE, HOLD_HEART_SIZE);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeStyle = 'rgba(255,240,245,0.9)';
  ctx.lineWidth = 1.2;
  path();
  ctx.fill();
  ctx.stroke();
}

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

/**
 * La petite table du thé (D-89) : un plateau rond et bas sur un pied ; Roger assis à gauche (l'image
 * fournie, sinon le dessin), le lapin derrière, le panda roux à droite. La tasse posée par Céleste
 * est un objet à part (`tea-cup`).
 */
function drawTeaTable(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rogerImage: CanvasImageSource | null,
): void {
  const plush = h * 0.62;
  // Le lapin, derrière la table.
  ctx.save();
  ctx.translate(w * 0.5, h * 0.3);
  rabbit(ctx, plush);
  ctx.restore();
  // La table : le plateau, le pied, son ombre.
  ctx.fillStyle = 'rgba(80,40,30,0.18)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h - 1, w * 0.2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98f6b';
  // Le plateau arrive au bas de la tuile du dessus : la tasse posée (`tea-cup`) repose dessus.
  ctx.fillRect(w * 0.5 - 1.5, h * 0.47, 3, h * 0.53);
  ctx.fillStyle = '#e8b998';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.47, w * 0.2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Roger, à gauche, et le panda roux, à droite, assis par terre.
  if (rogerImage) {
    ctx.drawImage(rogerImage, w * 0.06, h - plush * 1.05, plush * 0.9, plush * 1.05);
  } else {
    ctx.save();
    ctx.translate(w * 0.17, h - plush * 0.5);
    roger(ctx, plush);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(w * 0.83, h - plush * 0.55);
  redPanda(ctx, plush);
  ctx.restore();
}

/**
 * L'Educaville posée dans le monde étrange (D-155) : l'image de l'utilisateur (`toy-town`, et
 * `toy-town-lifted` décroché) si elle est chargée, sinon le dessin par le code. Qui sonne, le jouet
 * tremble un peu.
 */
export function drawToyTown(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phone: ToyPhone,
  images: ReadonlyMap<string, CanvasImageSource>,
): void {
  const image = images.get(phone === 'lifted' ? 'toy-town-lifted' : 'toy-town');
  if (image instanceof HTMLImageElement) {
    const k = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * k;
    const dh = image.naturalHeight * k;
    ctx.save();
    ctx.translate(w / 2, h);
    const ringing = phone === 'ring0' || phone === 'ring1';
    if (ringing) {
      ctx.rotate(phone === 'ring0' ? -0.02 : 0.02);
    }
    ctx.drawImage(image, -dw / 2, -dh, dw, dh);
    if (ringing) {
      // Les ondes de la sonnerie, à gauche du combiné (sur le flanc gauche de l'image).
      ctx.strokeStyle = 'rgba(255, 244, 200, 0.85)';
      ctx.lineWidth = 0.8;
      for (let k = 0; k < 2; k++) {
        const r = dh * (0.1 + k * 0.08 + (phone === 'ring1' ? 0.03 : 0));
        ctx.beginPath();
        ctx.arc(-dw * 0.44, -dh * 0.45, r, Math.PI * 0.75, Math.PI * 1.25);
        ctx.stroke();
      }
    }
    if (phone === 'lifted') {
      // La lueur sort du combiné décroché, en haut à gauche de l'image.
      const light = ctx.createRadialGradient(
        -dw * 0.37,
        -dh * 0.75,
        0,
        -dw * 0.37,
        -dh * 0.75,
        dh * 0.42,
      );
      light.addColorStop(0, 'rgba(120, 236, 220, 0.5)');
      light.addColorStop(1, 'rgba(120, 236, 220, 0)');
      ctx.fillStyle = light;
      ctx.fillRect(-dw * 0.37 - dh * 0.42, -dh * 0.75 - dh * 0.42, dh * 0.84, dh * 0.84);
    }
    ctx.restore();
    return;
  }
  const size = Math.min(w, h / 0.72);
  ctx.save();
  ctx.translate(w / 2, h - size * 0.3);
  toyTown(ctx, size, phone);
  ctx.restore();
}
