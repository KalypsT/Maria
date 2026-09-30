import { PROP_SIZE } from '../../config/story';
import type { PropKind } from '../../core/story/story';

/**
 * Les parents et le chat (D-37), PLACEHOLDERS dans le style « papier découpé » de Céleste (D-29) :
 * aplats doux, formes arrondies. À hauteur d'enfant : les adultes sont grands, leurs visages
 * simples (vus de loin). Dessinés tournés vers la droite ; `flip` les retourne. Deux images par
 * personnage (`frame` 0 ou 1) pour un petit mouvement en boucle. Appelé au chargement seulement.
 */

/**
 * Couleurs et coiffure d'un parent, d'après les illustrations de l'utilisateur (D-53) : maman aux
 * longs cheveux bruns bouclés, tee-shirt rose, jean clair ; papa aux cheveux châtains ondulés, barbe
 * courte, tee-shirt marine, jean foncé retroussé ; les mêmes baskets claires à bande bleue.
 */
interface Person {
  hair: string;
  hairDark: string;
  skin: string;
  skinDark: string;
  top: string;
  topDark: string;
  jeans: string;
  jeansDark: string;
  seam: string;
  curly: boolean;
  beard: boolean;
  cuffs: boolean;
}

const DAD: Person = {
  hair: '#8a5a36',
  hairDark: '#65401f',
  skin: '#dca07a',
  skinDark: '#c48b67',
  top: '#3b4870',
  topDark: '#2f3a5c',
  jeans: '#46618f',
  jeansDark: '#3a5178',
  seam: '#6a84b0',
  curly: false,
  beard: true,
  cuffs: true,
};
const MOM: Person = {
  hair: '#4a2e1f',
  hairDark: '#301d13',
  skin: '#e2a881',
  skinDark: '#c9906c',
  top: '#f1b9c7',
  topDark: '#d99fb0',
  jeans: '#7196c6',
  jeansDark: '#5f82b0',
  seam: '#94b3dc',
  curly: true,
  beard: false,
  cuffs: false,
};
const SHOE = { body: '#e6ddcb', stripe: '#3f5d8f', sole: '#fbf8f1' };
const GLASSES = '#1f1c22';
const CAT = { fur: '#8c919c', dark: '#6f7480', light: '#b4b8c2', nose: '#e39aa8' };
const BLUSH = 'rgba(230,120,130,0.35)';
const EYE = '#2b1d18';

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

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Boucles de maman (en rayons de tête) : masse jusqu'au milieu du dos, derrière la tête. */
const CURLS_BACK: readonly (readonly [number, number, number])[] = [
  [-0.9, -0.5, 0.85],
  [-1.35, 0.3, 0.8],
  [-1.45, 1.2, 0.8],
  [-1.25, 2.1, 0.75],
  [-0.6, 2.5, 0.6],
  [-1.6, 2.8, 0.55],
  [-0.9, 3.1, 0.5],
  [-0.35, 1.5, 0.75],
  [-0.45, 0.5, 0.8],
];
/** Boucles du dessus de la tête, qui dégagent le visage. */
const CURLS_TOP: readonly (readonly [number, number, number])[] = [
  [-0.4, -0.95, 0.7],
  [0.3, -1.1, 0.6],
  [0.85, -0.7, 0.42],
];

/**
 * Tête vue de profil (tournée vers la droite) : visage simple, nez, oreille, coiffure ; lunettes de
 * soleil seulement dehors (D-53).
 */
function head(
  ctx: CanvasRenderingContext2D,
  p: Person,
  x: number,
  y: number,
  r: number,
  glasses: boolean,
): void {
  if (p.curly) {
    ctx.fillStyle = p.hair;
    for (const [dx, dy, dr] of CURLS_BACK) {
      disc(ctx, x + dx * r, y + dy * r, dr * r);
    }
  }
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nez.
  ctx.beginPath();
  ctx.moveTo(x + r * 0.9, y - r * 0.1);
  ctx.lineTo(x + r * 1.2, y + r * 0.3);
  ctx.lineTo(x + r * 0.88, y + r * 0.4);
  ctx.fill();
  if (p.beard) {
    // Barbe courte : le bas du visage ombré, une patte devant l'oreille.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.08, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = p.hairDark;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x - r * 0.5, y + r * 0.55, r * 2, r);
    ctx.fillRect(x - r * 0.45, y, r * 0.4, r * 0.6);
    ctx.restore();
  }
  ctx.fillStyle = p.hair;
  if (p.curly) {
    for (const [dx, dy, dr] of CURLS_TOP) {
      disc(ctx, x + dx * r, y + dy * r, dr * r);
    }
    // Quelques boucles plus sombres dans la masse.
    ctx.strokeStyle = p.hairDark;
    ctx.lineWidth = 0.6;
    for (const [dx, dy, dr] of CURLS_BACK) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, dr * r * 0.5, 0.3, 2.6);
      ctx.stroke();
    }
  } else {
    // Cheveux ondulés mi-courts, en volume sur le dessus, rejetés en arrière.
    ctx.beginPath();
    ctx.moveTo(x - r * 0.95, y + r * 0.6);
    ctx.quadraticCurveTo(x - r * 1.45, y - r * 1.2, x - r * 0.1, y - r * 1.55);
    ctx.quadraticCurveTo(x + r * 1.1, y - r * 1.5, x + r * 0.95, y - r * 0.55);
    ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.8, x + r * 0.1, y - r * 0.55);
    ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.2, x - r * 0.3, y + r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = p.hairDark;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 0.6);
    ctx.quadraticCurveTo(x - r * 0.1, y - r * 1.3, x + r * 0.7, y - r * 0.9);
    ctx.stroke();
  }
  // Oreille (maman : une petite boucle d'oreille).
  ctx.fillStyle = p.skinDark;
  disc(ctx, x - r * 0.1, y + r * 0.15, r * 0.22);
  if (p.curly) {
    ctx.fillStyle = '#f7f2e8';
    disc(ctx, x - r * 0.1, y + r * 0.45, r * 0.1);
  }
  if (glasses) {
    ctx.fillStyle = GLASSES;
    ctx.beginPath();
    ctx.ellipse(x + r * 0.55, y + r * 0.05, r * 0.27, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - r * 0.05, y - r * 0.02, r * 0.4, r * 0.1);
  } else {
    ctx.fillStyle = EYE;
    ctx.fillRect(x + r * 0.45, y + r * 0.05, 0.9, 1.1);
  }
  ctx.fillStyle = BLUSH;
  disc(ctx, x + r * 0.35, y + r * 0.5, r * 0.28);
}

/** Basket claire à bande bleue, semelle blanche ; `x` : talon, pointe vers la droite. */
function shoe(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.fillStyle = SHOE.body;
  round(ctx, x, y - 3.2, w, 3.2, 1.4);
  ctx.fillStyle = SHOE.sole;
  ctx.fillRect(x, y - 1, w, 1);
  ctx.fillStyle = SHOE.stripe;
  ctx.fillRect(x + w * 0.25, y - 2.4, w * 0.45, 0.8);
}

/** Bras : manche courte du tee-shirt, bras nu, main (dans le repère de l'épaule). */
function arm(ctx: CanvasRenderingContext2D, sleeve: string, skin: string, length: number): void {
  ctx.fillStyle = skin;
  round(ctx, -1.6, 3, 3.6, length - 3, 1.8);
  disc(ctx, 0.2, length + 0.5, 2.1);
  ctx.fillStyle = sleeve;
  round(ctx, -2.3, 0, 5, 6, 2);
}

/** Tee-shirt col en V (et ceinture du jean de maman, tee-shirt rentré). */
function tee(
  ctx: CanvasRenderingContext2D,
  p: Person,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = p.top;
  round(ctx, x, y, w, h, 5);
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.55, y);
  ctx.lineTo(x + w - 1.5, y);
  ctx.lineTo(x + w * 0.72, y + 4);
  ctx.fill();
  if (!p.beard) {
    ctx.fillStyle = p.jeans;
    ctx.fillRect(x + 0.5, y + h - 3, w - 1, 3);
    ctx.fillStyle = p.seam;
    ctx.fillRect(x + w * 0.65, y + h - 2.2, 0.9, 0.9);
  }
}

/** Adulte debout (pieds en bas du cadre) ; `armAngle` : bras avant (0 : le long du corps). */
function standing(
  ctx: CanvasRenderingContext2D,
  p: Person,
  w: number,
  h: number,
  armAngle: number,
  headTilt: number,
  glasses = false,
): { handX: number; handY: number } {
  const cx = w / 2 - 1;
  // Jambes en jean, couture claire devant ; papa : bas retroussés.
  ctx.fillStyle = p.jeansDark;
  round(ctx, cx - 5, h - 26, 5, 23, 2);
  ctx.fillStyle = p.jeans;
  round(ctx, cx + 0.5, h - 26, 5, 23, 2);
  ctx.fillStyle = p.seam;
  ctx.fillRect(cx + 3.6, h - 24, 0.6, 20);
  if (p.cuffs) {
    ctx.fillRect(cx - 5, h - 5.5, 5, 1.6);
    ctx.fillRect(cx + 0.5, h - 5.5, 5, 1.6);
  }
  shoe(ctx, cx - 5.5, h, 7);
  shoe(ctx, cx, h, 8);
  // Bras arrière (plus sombre).
  ctx.save();
  ctx.translate(cx - 4, h - 44);
  arm(ctx, p.topDark, p.skinDark, 18);
  ctx.restore();
  tee(ctx, p, cx - 7, h - 46, 14, 23);
  head(ctx, p, cx + 1 + headTilt, h - 52, 6, glasses);
  // Bras avant, qui pivote à l'épaule.
  const sx = cx + 1;
  const sy = h - 43;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-armAngle);
  arm(ctx, p.top, p.skin, 18);
  ctx.restore();
  return { handX: sx + Math.sin(armAngle) * 18.5, handY: sy + Math.cos(armAngle) * 18.5 };
}

/** Adulte assis (sur un lit, un canapé), genoux pliés vers la droite. */
function sitting(
  ctx: CanvasRenderingContext2D,
  p: Person,
  h: number,
  armAngle: number,
): { handX: number; handY: number } {
  const hip = 8;
  // Cuisse et jambe (côté visible), pied posé sur l'assise.
  ctx.fillStyle = p.jeans;
  round(ctx, hip, h - 8, 15, 6, 3);
  round(ctx, hip + 11, h - 12, 5, 11, 2);
  ctx.fillStyle = p.seam;
  ctx.fillRect(hip + 2, h - 7.4, 12, 0.6);
  shoe(ctx, hip + 11, h, 7);
  // Bras arrière.
  ctx.save();
  ctx.translate(hip, h - 27);
  arm(ctx, p.topDark, p.skinDark, 15);
  ctx.restore();
  // Buste, un peu penché en avant.
  ctx.save();
  ctx.translate(hip + 3, h - 6);
  ctx.rotate(0.08);
  tee(ctx, p, -6, -23, 13, 23);
  ctx.restore();
  head(ctx, p, hip + 6, h - 32, 6, false);
  const sx = hip + 5;
  const sy = h - 25;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-armAngle);
  arm(ctx, p.top, p.skin, 15);
  ctx.restore();
  return { handX: sx + Math.sin(armAngle) * 15.5, handY: sy + Math.cos(armAngle) * 15.5 };
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
  'cat-sleep': { w: 16, h: 8, pad: 0 },
  'cat-sit': { w: 12, h: 14, pad: 0 },
  'mom-garden': { w: 40, h: 62, pad: 6 },
  'dad-garden': { w: 44, h: 62, pad: 8 },
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
      standing(ctx, DAD, w, h, 1.2, frame === 0 ? 0 : 0.6);
      break;
    }
    case 'dad-kitchen': {
      // Papa au plan de travail, une tasse qui fume.
      const hand = standing(ctx, DAD, w, h, frame === 0 ? 0.75 : 0.85, 0);
      ctx.fillStyle = '#f3ead7';
      round(ctx, hand.handX - 1, hand.handY - 5, 4.5, 5, 1);
      ctx.fillStyle = '#d9788f';
      ctx.fillRect(hand.handX - 1, hand.handY - 3.5, 4.5, 1);
      steam(ctx, hand.handX + 1.2, hand.handY - 6, frame);
      break;
    }
    case 'mom-bed':
      // Maman assise au bord du lit, la main qui caresse les cheveux de Céleste.
      sitting(ctx, MOM, h, frame === 0 ? 1.1 : 1.3);
      break;
    case 'mom-sofa': {
      // Maman lit sur le canapé ; la page tourne.
      const hand = sitting(ctx, MOM, h, 1.0);
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
    case 'mom-garden': {
      // Au jardin (D-46), maman étend le linge : le bras levé vers le fil, une chaussette.
      const hand = standing(ctx, MOM, w, h, frame === 0 ? 2.7 : 2.9, 0, true);
      ctx.fillStyle = '#8fb8e5';
      round(ctx, hand.handX - 1.5, hand.handY - 1, 3.5, 6, 1.2);
      break;
    }
    case 'dad-garden': {
      // Papa arrose le potager : l'arrosoir penché, quelques gouttes qui tombent.
      const hand = standing(ctx, DAD, w, h, 0.9, 0, true);
      ctx.fillStyle = '#7fa37a';
      round(ctx, hand.handX - 3, hand.handY - 2, 8, 6, 1.5);
      ctx.strokeStyle = '#7fa37a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hand.handX + 5, hand.handY + 1);
      ctx.lineTo(hand.handX + 9, hand.handY + 3);
      ctx.stroke();
      ctx.fillStyle = 'rgba(143,184,229,0.9)';
      for (let i = 0; i < 3; i++) {
        const drop = (frame + i) % 2 === 0 ? 0 : 2;
        ctx.fillRect(hand.handX + 9 + i * 0.8, hand.handY + 5 + i * 3 + drop, 0.9, 1.6);
      }
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
