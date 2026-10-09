import { CHARACTER_IMAGES } from '../../config/art';
import { PASSERBY_FRAMES, PASSERBY_LINES, PASSERBY_STOOLS } from '../../config/passersby';
import { PROP_SIZE } from '../../config/story';
import type { PasserbyKind } from '../../core/story/story';
import { characterOverhang, drawCharacter, illustratedBox } from './familyArt';

/**
 * Les passants (D-155) : l'image fournie (`CHARACTER_IMAGES`), sinon une silhouette provisoire
 * (PLACEHOLDER, en attendant les images de l'utilisateur) ; la fenêtre de la voisine et le tabouret
 * de la caissière sont dessinés par le code.
 */

/** L'image du passant est chargée. */
export function passerbyIllustrated(
  kind: PasserbyKind,
  images: ReadonlyMap<string, CanvasImageSource>,
): boolean {
  const character = CHARACTER_IMAGES[kind];
  return character !== undefined && images.get(character.file) instanceof HTMLImageElement;
}

/** Taille du dessin (px logiques) : le cadre, et ce qui pend dessous (jambes, tabouret). */
export function passerbySize(kind: PasserbyKind): { w: number; h: number; below: number } {
  const frame = PASSERBY_FRAMES[kind];
  const size = frame ?? PROP_SIZE[kind];
  const below = Math.max(characterOverhang(kind), PASSERBY_LINES[kind]?.below ?? 0);
  return { w: size.w, h: size.h, below: frame ? 0 : below };
}

export function drawPasserby(
  ctx: CanvasRenderingContext2D,
  kind: PasserbyKind,
  images: ReadonlyMap<string, CanvasImageSource>,
  evening: boolean,
): void {
  const { w, h, below } = passerbySize(kind);
  const frame = PASSERBY_FRAMES[kind];
  if (frame) {
    if (frame.style === 'window') {
      windowBack(ctx, w, frame.inner, evening);
    } else {
      cartBack(ctx, w, evening);
    }
    ctx.save();
    ctx.translate(frame.inner.x, frame.inner.y);
    if (passerbyIllustrated(kind, images)) {
      drawCharacter(ctx, kind, 0, images);
    } else {
      bust(ctx, kind, PROP_SIZE[kind].w, PROP_SIZE[kind].h);
    }
    ctx.restore();
    if (frame.style === 'window') {
      windowSill(ctx, w, h);
    } else {
      cartFront(ctx, w, h);
    }
    return;
  }
  if (PASSERBY_STOOLS.has(kind)) {
    stool(ctx, w / 2, h, below);
  }
  const line = PASSERBY_LINES[kind];
  const character = CHARACTER_IMAGES[kind];
  const image = character && images.get(character.file);
  if (character && image instanceof HTMLImageElement) {
    drawCharacter(ctx, kind, 0, images);
    if (line) {
      const box = illustratedBox(character, image, PROP_SIZE[kind]);
      fishingLine(ctx, box.left + line.tip.x * box.w, box.top + line.tip.y * box.h, h + below);
    }
    return;
  }
  switch (kind) {
    case 'busstop-man':
    case 'busstop-man-look':
      adult(ctx, w / 2, h, ADULTS.busstop);
      newspaper(ctx, w / 2 + 6, h - 82, kind === 'busstop-man-look');
      break;
    case 'dog-walker':
      adult(ctx, w * 0.32, h, ADULTS.walker);
      smallDog(ctx, w * 0.78, h);
      leash(ctx, w * 0.32 + 12, h - 64, w * 0.78 - 4, h - 16);
      break;
    case 'cashier':
      seatedAdult(ctx, w / 2, h, below, ADULTS.cashier);
      break;
    case 'ginger-cat-sit':
      gingerCatSit(ctx, w, h);
      break;
    case 'ginger-cat-leap':
      gingerCatLeap(ctx, w, h);
      break;
    case 'traveler-suitcase':
    case 'traveler-wave':
      suitcase(ctx, w / 2 + 8, h);
      seatedAdult(ctx, w / 2, h - 30, 26, ADULTS.traveler);
      break;
    case 'traveler-board':
      adult(ctx, w / 2, h, ADULTS.board);
      break;
    case 'old-couple':
      bench(ctx, w, h);
      seatedAdult(ctx, w * 0.36, h - 22, 18, ADULTS.oldMan);
      seatedAdult(ctx, w * 0.6, h - 22, 18, ADULTS.oldWoman);
      break;
    case 'fisherman':
    case 'fisherman-nod':
      seatedAdult(ctx, w / 2, h, Math.min(below, 44), ADULTS.fisherman);
      fishingLine(ctx, w / 2 + 34, h - 70, h + below);
      break;
    case 'neighbor-window':
    case 'neighbor-wave':
    case 'candyfloss-vendor':
      break;
  }
}

/** Le fil de pêche, du bout de la canne jusqu'en bas du dessin (la mer). */
function fishingLine(ctx: CanvasRenderingContext2D, x: number, y: number, bottom: number): void {
  ctx.strokeStyle = 'rgba(240,240,235,0.85)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, bottom);
  ctx.stroke();
}

/** L'auvent rayé du chariot de barbe à papa et ses deux montants, derrière le forain. */
function cartBack(ctx: CanvasRenderingContext2D, w: number, evening: boolean): void {
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(4, 8, 2, 52);
  ctx.fillRect(w - 6, 8, 2, 52);
  for (let k = 0; k < 8; k++) {
    ctx.fillStyle = k % 2 === 0 ? '#e5534b' : '#fdf6ec';
    ctx.fillRect(1 + k * ((w - 2) / 8), 2, (w - 2) / 8 + 0.5, 7);
  }
  for (let k = 0; k < 8; k++) {
    ctx.fillStyle = k % 2 === 0 ? '#e5534b' : '#fdf6ec';
    disc(ctx, 1 + (k + 0.5) * ((w - 2) / 8), 9, (w - 2) / 16);
  }
  if (evening) {
    ctx.fillStyle = '#ffe9a0';
    for (let x = 4; x < w; x += 8) {
      disc(ctx, x, 12, 1.4);
    }
  }
}

/** Le comptoir du chariot, devant le forain : rayé de rose, la cuve à barbe à papa, les roues. */
function cartFront(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const top = h - 32;
  ctx.fillStyle = '#c98d5a';
  ctx.fillRect(0, top, w, 4);
  for (let k = 0; k < 6; k++) {
    ctx.fillStyle = k % 2 === 0 ? '#f2a7bf' : '#fdf6ec';
    ctx.fillRect(2 + k * ((w - 4) / 6), top + 4, (w - 4) / 6 + 0.5, 22);
  }
  ctx.fillStyle = '#d6dde3';
  ctx.beginPath();
  ctx.ellipse(w - 16, top - 3, 10, 5, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#f6c7d6';
  disc(ctx, w - 16, top - 6, 5);
  ctx.fillStyle = '#3b3440';
  disc(ctx, 12, h - 4, 4);
  disc(ctx, w - 12, h - 4, 4);
}

/** Buste provisoire (la voisine, le forain), en attendant l'image. */
function bust(ctx: CanvasRenderingContext2D, kind: PasserbyKind, w: number, h: number): void {
  if (kind === 'candyfloss-vendor') {
    const c = ADULTS.vendor;
    ctx.fillStyle = c.top;
    roundRect(ctx, w / 2 - 12, h - 30, 24, 32, 6);
    ctx.fillStyle = c.skin;
    disc(ctx, w / 2 + 2, h - 38, 8);
    ctx.fillStyle = '#f6c7d6';
    disc(ctx, w / 2 + 16, h - 40, 6);
    return;
  }
  neighborBust(ctx, w, h, kind === 'neighbor-wave');
}

function suitcase(ctx: CanvasRenderingContext2D, cx: number, floor: number): void {
  ctx.fillStyle = '#7a2b35';
  roundRect(ctx, cx - 14, floor - 32, 28, 30, 3);
  ctx.fillStyle = '#2b2226';
  disc(ctx, cx - 10, floor - 1.5, 1.6);
  disc(ctx, cx + 10, floor - 1.5, 1.6);
}

/** Le banc du vieux couple (le leur, à part du banc des marées). */
function bench(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#4f5d6b';
  ctx.fillRect(w * 0.18, h - 22, 2, 22);
  ctx.fillRect(w * 0.82 - 2, h - 22, 2, 22);
  ctx.fillStyle = '#8c6a4a';
  ctx.fillRect(w * 0.14, h - 24, w * 0.72, 4);
  ctx.fillRect(w * 0.14, h - 40, w * 0.72, 3);
  ctx.fillRect(w * 0.14, h - 33, w * 0.72, 3);
}

interface AdultColors {
  readonly skin: string;
  readonly hair: string;
  readonly top: string;
  readonly legs: string;
  readonly shoes: string;
}

/** Couleurs des silhouettes provisoires, d'après les prompts (D-155). */
const ADULTS = {
  busstop: { skin: '#8a5a3c', hair: '#8f8a80', top: '#e3d3b0', legs: '#4a4c52', shoes: '#7a4a2a' },
  walker: { skin: '#f0cfb4', hair: '#d0572a', top: '#d9a630', legs: '#3d5687', shoes: '#4f7a4a' },
  cashier: { skin: '#c99872', hair: '#3a3634', top: '#b8343e', legs: '#3d5687', shoes: '#f2f0ea' },
  neighbor: { skin: '#f2d6c4', hair: '#ece8e2', top: '#b9a3cf', legs: '#b9a3cf', shoes: '#b9a3cf' },
  traveler: { skin: '#f0d2b8', hair: '#1f1b1d', top: '#b8894f', legs: '#2c2f36', shoes: '#8a5a32' },
  board: { skin: '#f2d6c4', hair: '#d8b45a', top: '#283a5c', legs: '#7a7c80', shoes: '#d9d3c6' },
  oldMan: { skin: '#f0d0bc', hair: '#e8e4dc', top: '#2f3c5c', legs: '#c9b48e', shoes: '#5a4632' },
  oldWoman: { skin: '#f2d6c4', hair: '#f0ece6', top: '#8fa9d6', legs: '#c9b48e', shoes: '#8a6a4a' },
  fisherman: {
    skin: '#e3a387',
    hair: '#f0ece6',
    top: '#e8c22a',
    legs: '#2f3c5c',
    shoes: '#1f1f22',
  },
  vendor: { skin: '#c99872', hair: '#1f1b1d', top: '#d9534f', legs: '#2c2f36', shoes: '#2c2f36' },
} as const satisfies Record<string, AdultColors>;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Un adulte debout de profil, tourné vers la droite (à hauteur d'enfant : 124 px). */
function adult(ctx: CanvasRenderingContext2D, cx: number, foot: number, c: AdultColors): void {
  const k = foot / 124;
  ctx.save();
  ctx.translate(cx, foot);
  ctx.scale(k, k);
  ctx.fillStyle = c.legs;
  roundRect(ctx, -9, -58, 8, 56, 3);
  roundRect(ctx, 1, -58, 8, 56, 3);
  ctx.fillStyle = c.shoes;
  roundRect(ctx, -10, -5, 13, 5, 2);
  roundRect(ctx, 0, -5, 13, 5, 2);
  ctx.fillStyle = c.top;
  roundRect(ctx, -13, -100, 26, 48, 7);
  ctx.fillStyle = c.skin;
  disc(ctx, 2, -111, 10);
  ctx.fillStyle = c.hair;
  ctx.beginPath();
  ctx.arc(0, -114, 10, Math.PI * 0.95, Math.PI * 1.9);
  ctx.fill();
  ctx.restore();
}

/** Un adulte assis sur un tabouret (les jambes pendent de `below` px), tourné vers la droite. */
function seatedAdult(
  ctx: CanvasRenderingContext2D,
  cx: number,
  seat: number,
  below: number,
  c: AdultColors,
): void {
  ctx.fillStyle = c.legs;
  roundRect(ctx, cx - 8, seat - 9, 26, 10, 4);
  roundRect(ctx, cx + 10, seat - 6, 9, below + 4, 3);
  ctx.fillStyle = c.shoes;
  roundRect(ctx, cx + 9, seat + below - 5, 14, 5, 2);
  ctx.fillStyle = c.top;
  roundRect(ctx, cx - 12, seat - 52, 24, 46, 7);
  ctx.fillStyle = c.skin;
  roundRect(ctx, cx + 4, seat - 38, 22, 6, 3);
  disc(ctx, cx + 2, seat - 62, 10);
  ctx.fillStyle = c.hair;
  ctx.beginPath();
  ctx.arc(cx, seat - 65, 10, Math.PI * 0.95, Math.PI * 1.9);
  ctx.fill();
}

/** Le journal du monsieur de l'abribus ; baissé quand il regarde Céleste. */
function newspaper(ctx: CanvasRenderingContext2D, x: number, y: number, lowered: boolean): void {
  ctx.fillStyle = '#f1ede2';
  roundRect(ctx, x, y + (lowered ? 12 : 0), 22, 16, 1);
  ctx.fillStyle = '#b6b0a2';
  for (let k = 0; k < 4; k++) {
    ctx.fillRect(x + 3, y + (lowered ? 12 : 0) + 3 + k * 3, 16, 1);
  }
}

function smallDog(ctx: CanvasRenderingContext2D, x: number, ground: number): void {
  ctx.fillStyle = '#f4f0e8';
  ctx.beginPath();
  ctx.ellipse(x, ground - 8, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  disc(ctx, x - 5, ground - 16, 5);
  ctx.fillStyle = '#9a6234';
  ctx.beginPath();
  ctx.ellipse(x - 2, ground - 17, 2, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 3, ground - 9, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f4f0e8';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 7, ground - 9);
  ctx.quadraticCurveTo(x + 12, ground - 12, x + 10, ground - 17);
  ctx.stroke();
}

function leash(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, y1 + 4, x1, y1);
  ctx.stroke();
}

/** La voisine : son buste, accoudée ; elle salue d'une main levée. */
function neighborBust(ctx: CanvasRenderingContext2D, w: number, h: number, wave: boolean): void {
  const c = ADULTS.neighbor;
  ctx.fillStyle = c.top;
  roundRect(ctx, w / 2 - 10, h - 15, 20, 17, 5);
  ctx.fillStyle = c.skin;
  disc(ctx, w / 2, h - 21, 6);
  ctx.fillStyle = c.hair;
  disc(ctx, w / 2, h - 27, 3.2);
  ctx.beginPath();
  ctx.arc(w / 2, h - 22, 6, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.top;
  roundRect(ctx, w / 2 - 12, h - 5, 24, 4, 2);
  if (wave) {
    roundRect(ctx, w / 2 + 8, h - 24, 4, 12, 2);
    ctx.fillStyle = c.skin;
    disc(ctx, w / 2 + 10, h - 25, 2.4);
  }
}

/** Le fond de la fenêtre ouverte : volets, embrasure, la pièce derrière (allumée le soir). */
function windowBack(
  ctx: CanvasRenderingContext2D,
  w: number,
  inner: { x: number; y: number },
  evening: boolean,
): void {
  const iw = w - 2 * inner.x;
  ctx.fillStyle = '#5f8f8a';
  ctx.fillRect(0, inner.y, inner.x - 1, iw);
  ctx.fillRect(w - inner.x + 1, inner.y, inner.x - 1, iw);
  ctx.fillStyle = '#8c8174';
  ctx.fillRect(inner.x - 2, inner.y - 2, iw + 4, iw + 2);
  ctx.fillStyle = evening ? '#f2c46b' : '#4a3f48';
  ctx.fillRect(inner.x, inner.y, iw, iw);
  ctx.fillStyle = evening ? 'rgba(255,240,200,0.5)' : 'rgba(255,255,255,0.12)';
  ctx.fillRect(inner.x, inner.y, 6, iw);
  ctx.fillRect(inner.x + iw - 6, inner.y, 6, iw);
}

/** Le rebord et sa jardinière fleurie, devant le buste. */
function windowSill(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#b8ad9c';
  ctx.fillRect(1, h - 9, w - 2, 3);
  ctx.fillStyle = '#b5653f';
  ctx.fillRect(5, h - 6, w - 10, 6);
  const flowers = ['#e86a8a', '#f2c14e', '#e86a8a', '#ffffff', '#e86a8a'];
  ctx.fillStyle = '#5d8a4a';
  ctx.fillRect(6, h - 11, w - 12, 3);
  flowers.forEach((color, k) => {
    ctx.fillStyle = color;
    disc(ctx, 8 + k * ((w - 16) / (flowers.length - 1)), h - 11, 1.8);
  });
}

/** Le tabouret haut de la caissière, sous l'assise, jusqu'au sol. */
function stool(ctx: CanvasRenderingContext2D, cx: number, seat: number, height: number): void {
  ctx.fillStyle = '#5c5f66';
  ctx.fillRect(cx - 1.5, seat, 3, height);
  ctx.fillRect(cx - 8, seat + height * 0.6, 16, 2);
  ctx.fillRect(cx - 9, seat + height - 2, 18, 2);
  ctx.fillStyle = '#2f3a4a';
  ctx.beginPath();
  ctx.ellipse(cx, seat + 1.5, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

const GINGER = { fur: '#e08a43', stripe: '#b8622a', white: '#f6efe4', eye: '#7fb069' } as const;

function gingerCatSit(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const k = w / 24;
  ctx.save();
  ctx.scale(k, k);
  const H = h / k;
  ctx.strokeStyle = GINGER.fur;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(5, H - 3);
  ctx.quadraticCurveTo(1, H - 1, 2, H + 0);
  ctx.stroke();
  ctx.fillStyle = GINGER.fur;
  ctx.beginPath();
  ctx.ellipse(10, H - 9, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GINGER.white;
  ctx.beginPath();
  ctx.ellipse(14, H - 8, 3.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(12, H - 2.5, 5, 2.5);
  ctx.fillStyle = GINGER.fur;
  ctx.beginPath();
  ctx.ellipse(16, H - 20, 6, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, H - 23);
  ctx.lineTo(12.5, H - 28);
  ctx.lineTo(15.5, H - 25);
  ctx.moveTo(17.5, H - 25.5);
  ctx.lineTo(21, H - 28);
  ctx.lineTo(21, H - 22.5);
  ctx.fill();
  ctx.fillStyle = GINGER.stripe;
  ctx.fillRect(5, H - 14, 6, 1.4);
  ctx.fillRect(4, H - 10, 6, 1.4);
  ctx.fillStyle = GINGER.eye;
  ctx.fillRect(18, H - 21.5, 2, 1.4);
  ctx.restore();
}

function gingerCatLeap(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const k = w / 44;
  ctx.save();
  ctx.scale(k, k);
  const H = h / k;
  ctx.strokeStyle = GINGER.fur;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, H - 13);
  ctx.lineTo(1, H - 16);
  ctx.moveTo(30, H - 12);
  ctx.lineTo(39, H - 7);
  ctx.moveTo(14, H - 10);
  ctx.lineTo(6, H - 4);
  ctx.stroke();
  ctx.fillStyle = GINGER.fur;
  ctx.beginPath();
  ctx.ellipse(21, H - 13, 12, 5.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(35, H - 16, 5.2, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(32, H - 19);
  ctx.lineTo(32, H - 23);
  ctx.lineTo(35, H - 20);
  ctx.moveTo(36.5, H - 20.5);
  ctx.lineTo(39.5, H - 23);
  ctx.lineTo(39.5, H - 18.5);
  ctx.fill();
  ctx.fillStyle = GINGER.stripe;
  ctx.fillRect(15, H - 18, 1.4, 5);
  ctx.fillRect(20, H - 18.5, 1.4, 5);
  ctx.fillRect(25, H - 18, 1.4, 5);
  ctx.fillStyle = GINGER.eye;
  ctx.fillRect(37, H - 17.5, 2, 1.4);
  ctx.restore();
}
