import { PROP_SIZE } from '../../config/story';
import type { PropKind } from '../../core/story/story';

/**
 * Les parents et le chat (D-37), PLACEHOLDERS dans le style « papier découpé » de Céleste (D-29) :
 * aplats doux, formes arrondies. À hauteur d'enfant : les adultes sont grands, leurs visages
 * simples (vus de loin). Dessinés tournés vers la droite ; `flip` les retourne. Deux images par
 * personnage (`frame` 0 ou 1) pour un petit mouvement en boucle. Appelé au chargement seulement.
 */

const DAD = {
  hair: '#3b2a22',
  skin: '#d9a27c',
  top: '#4f6f8f',
  topDark: '#43607c',
  legs: '#3a3f55',
  shoes: '#5a4636',
};
const MOM = {
  hair: '#6b3f2a',
  skin: '#e7b995',
  top: '#b56e8a',
  topDark: '#9d5d77',
  legs: '#5b4a6e',
  shoes: '#6a5242',
};
const CAT = { fur: '#8c919c', dark: '#6f7480', light: '#b4b8c2', nose: '#e39aa8' };
const BLUSH = 'rgba(230,120,130,0.35)';
const EYE = '#2b1d18';

type Colors = typeof DAD;

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Tête vue de profil (tournée vers la droite) : visage simple, cheveux ; `long` : cheveux longs. */
function head(
  ctx: CanvasRenderingContext2D,
  c: Colors,
  x: number,
  y: number,
  r: number,
  long: boolean,
): void {
  if (long) {
    // Cheveux longs derrière la nuque, noués en queue basse.
    ctx.fillStyle = c.hair;
    round(ctx, x - r - 1.2, y - r * 0.4, r * 1.2, r * 2.4, r * 0.6);
  }
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cheveux : calotte, un peu plus bas derrière.
  ctx.fillStyle = c.hair;
  ctx.beginPath();
  ctx.moveTo(x - r - 0.4, y + (long ? r * 0.9 : r * 0.2));
  ctx.quadraticCurveTo(x - r * 1.2, y - r * 1.3, x + r * 0.2, y - r * 1.12);
  ctx.quadraticCurveTo(x + r * 1.15, y - r * 0.9, x + r * 0.9, y - r * 0.2);
  ctx.quadraticCurveTo(x, y - r * 0.55, x - r * 0.3, y + r * 0.1);
  ctx.closePath();
  ctx.fill();
  // Visage vu de loin : un œil, une joue.
  ctx.fillStyle = EYE;
  ctx.fillRect(x + r * 0.45, y + r * 0.05, 0.9, 1.1);
  ctx.fillStyle = BLUSH;
  ctx.beginPath();
  ctx.arc(x + r * 0.35, y + r * 0.5, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

/** Adulte debout (pieds en bas du cadre) ; `arm` : angle du bras avant (0 : le long du corps). */
function standing(
  ctx: CanvasRenderingContext2D,
  c: Colors,
  w: number,
  h: number,
  arm: number,
  headTilt: number,
  long: boolean,
): { handX: number; handY: number } {
  const cx = w / 2 - 1;
  // Jambes.
  ctx.fillStyle = c.legs;
  round(ctx, cx - 5, h - 26, 5, 24, 2);
  round(ctx, cx + 0.5, h - 26, 5, 24, 2);
  ctx.fillStyle = c.shoes;
  round(ctx, cx - 5.5, h - 3, 7, 3, 1.5);
  round(ctx, cx, h - 3, 8, 3, 1.5);
  // Bras arrière (plus sombre).
  ctx.fillStyle = c.topDark;
  round(ctx, cx - 6, h - 44, 4, 19, 2);
  // Buste.
  ctx.fillStyle = c.top;
  round(ctx, cx - 7, h - 46, 14, 23, 5);
  // Tête.
  head(ctx, c, cx + 1 + headTilt, h - 52, 6, long);
  // Bras avant, qui pivote à l'épaule.
  const sx = cx + 1;
  const sy = h - 43;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-arm);
  ctx.fillStyle = c.top;
  round(ctx, -2, 0, 4.5, 18, 2);
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(0.2, 18.5, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return { handX: sx + Math.sin(arm) * 18.5, handY: sy + Math.cos(arm) * 18.5 };
}

/** Adulte assis (sur un lit, un canapé), genoux pliés vers la droite. */
function sitting(
  ctx: CanvasRenderingContext2D,
  c: Colors,
  h: number,
  arm: number,
  long: boolean,
): { handX: number; handY: number } {
  const hip = 8;
  // Cuisse et jambe (côté visible), pied posé sur l'assise.
  ctx.fillStyle = c.legs;
  round(ctx, hip, h - 8, 15, 6, 3);
  round(ctx, hip + 11, h - 12, 5, 12, 2);
  ctx.fillStyle = c.shoes;
  round(ctx, hip + 11, h - 3, 7, 3, 1.5);
  // Bras arrière.
  ctx.fillStyle = c.topDark;
  round(ctx, hip - 2, h - 27, 4, 16, 2);
  // Buste, un peu penché en avant.
  ctx.save();
  ctx.translate(hip + 3, h - 6);
  ctx.rotate(0.08);
  ctx.fillStyle = c.top;
  round(ctx, -6, -23, 13, 23, 5);
  ctx.restore();
  head(ctx, c, hip + 6, h - 32, 6, long);
  const sx = hip + 5;
  const sy = h - 25;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-arm);
  ctx.fillStyle = c.top;
  round(ctx, -2, 0, 4.5, 15, 2);
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(0.2, 15.5, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return { handX: sx + Math.sin(arm) * 15.5, handY: sy + Math.cos(arm) * 15.5 };
}

function steam(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const sx = x - 1 + i * 2.2;
    const lift = frame === 0 ? 0 : 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, y - lift);
    ctx.quadraticCurveTo(sx + (i === frame ? 1.6 : -1.6), y - 3 - lift, sx, y - 6 - lift);
    ctx.stroke();
  }
}

function catSleep(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number): void {
  const breathe = frame === 0 ? 0 : 0.5;
  ctx.fillStyle = CAT.fur;
  ctx.beginPath();
  ctx.ellipse(w / 2 - 1, h - 3, 6.5, 3 + breathe, 0, 0, Math.PI * 2);
  ctx.fill();
  // Queue enroulée devant.
  ctx.strokeStyle = CAT.dark;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 6, h - 2);
  ctx.quadraticCurveTo(w / 2, h + 0.5, w / 2 + 5, h - 1.5);
  ctx.stroke();
  // Tête posée, oreilles, yeux fermés.
  ctx.fillStyle = CAT.fur;
  ctx.beginPath();
  ctx.ellipse(w - 4, h - 3.5, 3.2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w - 6, h - 5.5);
  ctx.lineTo(w - 5.2, h - 8);
  ctx.lineTo(w - 4, h - 6);
  ctx.moveTo(w - 3.5, h - 6);
  ctx.lineTo(w - 2.2, h - 8);
  ctx.lineTo(w - 1.6, h - 5.2);
  ctx.fill();
  ctx.strokeStyle = CAT.dark;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(w - 3, h - 3.4, 0.8, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = CAT.light;
  ctx.fillRect(w / 2 - 4, h - 4.5 - breathe, 3, 0.8);
}

function catSit(ctx: CanvasRenderingContext2D, h: number, frame: number): void {
  // Queue sur le sol, dont le bout bouge.
  ctx.strokeStyle = CAT.dark;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(3, h - 1.5);
  ctx.quadraticCurveTo(-0.5, h - 1, 0.5, frame === 0 ? h - 4 : h - 5.5);
  ctx.stroke();
  // Corps assis.
  ctx.fillStyle = CAT.fur;
  ctx.beginPath();
  ctx.ellipse(5, h - 4.5, 4, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CAT.light;
  ctx.beginPath();
  ctx.ellipse(7, h - 4, 1.6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tête levée vers le haut (il regarde quelque chose).
  ctx.fillStyle = CAT.fur;
  ctx.beginPath();
  ctx.ellipse(8, h - 10, 3, 2.7, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(5.8, h - 11.5);
  ctx.lineTo(6.2, h - 14);
  ctx.lineTo(7.8, h - 12.5);
  ctx.moveTo(8.8, h - 12.8);
  ctx.lineTo(10.6, h - 14);
  ctx.lineTo(10.6, h - 11.2);
  ctx.fill();
  ctx.fillStyle = '#e6d27a';
  ctx.fillRect(9, h - 11, 1.1, 1.1);
  ctx.fillStyle = CAT.nose;
  ctx.fillRect(10.6, h - 9.6, 0.8, 0.7);
}

/**
 * Taille de référence du dessin de chaque personnage (px logiques) : la taille à l'écran
 * (`PROP_SIZE`, réglable dans la configuration) en est un agrandissement. `pad` : marge de
 * chaque côté du corps pour que la main tendue (et ce qu'elle tient) ne soit pas coupée ; elle
 * est symétrique, pour que le corps reste centré sur sa tuile, retourné ou non (D-40).
 */
const DRAWN_SIZE: Readonly<Partial<Record<PropKind, { w: number; h: number; pad: number }>>> = {
  'dad-door': { w: 42, h: 62, pad: 8 },
  'dad-kitchen': { w: 40, h: 62, pad: 6 },
  'mom-bed': { w: 36, h: 44, pad: 4 },
  'mom-sofa': { w: 38, h: 44, pad: 4 },
};

export function drawCharacter(ctx: CanvasRenderingContext2D, kind: PropKind, frame: number): void {
  const size = PROP_SIZE[kind];
  const { w, h, pad } = DRAWN_SIZE[kind] ?? { ...size, pad: 0 };
  ctx.save();
  ctx.scale(size.w / w, size.h / h);
  ctx.translate(pad, 0);
  drawAt(ctx, kind, frame, w - 2 * pad, h);
  ctx.restore();
}

function drawAt(
  ctx: CanvasRenderingContext2D,
  kind: PropKind,
  frame: number,
  w: number,
  h: number,
): void {
  switch (kind) {
    case 'dad-door': {
      // Papa dans l'embrasure, la main tendue vers Céleste ; il penche un peu la tête.
      standing(ctx, DAD, w, h, 1.2, frame === 0 ? 0 : 0.6, false);
      break;
    }
    case 'dad-kitchen': {
      // Papa au plan de travail, une tasse qui fume.
      const hand = standing(ctx, DAD, w, h, frame === 0 ? 0.75 : 0.85, 0, false);
      ctx.fillStyle = '#f3ead7';
      round(ctx, hand.handX - 1, hand.handY - 5, 4.5, 5, 1);
      ctx.fillStyle = '#d9788f';
      ctx.fillRect(hand.handX - 1, hand.handY - 3.5, 4.5, 1);
      steam(ctx, hand.handX + 1.2, hand.handY - 6, frame);
      break;
    }
    case 'mom-bed':
      // Maman assise au bord du lit, la main qui caresse les cheveux de Céleste.
      sitting(ctx, MOM, h, frame === 0 ? 1.1 : 1.3, true);
      break;
    case 'mom-sofa': {
      // Maman lit sur le canapé ; la page tourne.
      const hand = sitting(ctx, MOM, h, 1.0, true);
      ctx.fillStyle = '#6d86c2';
      ctx.beginPath();
      ctx.moveTo(hand.handX - 4, hand.handY - 1);
      ctx.lineTo(hand.handX + 5, hand.handY - 4);
      ctx.lineTo(hand.handX + 6, hand.handY + 2);
      ctx.lineTo(hand.handX - 3, hand.handY + 4);
      ctx.fill();
      ctx.fillStyle = '#fdf8ee';
      ctx.beginPath();
      ctx.moveTo(hand.handX - 3, hand.handY - 0.5);
      ctx.lineTo(hand.handX + (frame === 0 ? 4.5 : 2.5), hand.handY - (frame === 0 ? 3.5 : 5));
      ctx.lineTo(hand.handX + 5, hand.handY + 1.5);
      ctx.lineTo(hand.handX - 2.5, hand.handY + 3.5);
      ctx.fill();
      break;
    }
    case 'cat-sleep':
      catSleep(ctx, w, h, frame);
      break;
    case 'cat-sit':
      catSit(ctx, h, frame);
      break;
    default:
      break;
  }
}
