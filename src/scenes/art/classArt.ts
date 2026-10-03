import type { PropKind } from '../../core/story/story';

/**
 * Les enfants de la classe de mer (D-85), PLACEHOLDERS dans le style « papier découpé » : la
 * camarade qui apprend la glissade à Céleste (une fille aux cheveux noirs en deux macarons, pull
 * jaune, salopette), deux autres enfants, des dormeurs sous leur couverture. À peu près la taille
 * de Céleste. Dessinés tournés vers la droite, pieds en bas du cadre ; deux images (`frame`) pour
 * un petit mouvement en boucle.
 */

interface Kid {
  skin: string;
  skinDark: string;
  hair: string;
  top: string;
  topDark: string;
  legs: string;
  legsDark: string;
  shoe: string;
  /** Coiffure : deux macarons, une casquette, un carré, deux couettes. */
  style: 'puffs' | 'cap' | 'bob' | 'pigtails';
  /** Lunettes rondes (Céleste, spec §2). */
  glasses?: boolean;
}

/** La camarade (une fille, D-83). */
const CLASSMATE: Kid = {
  skin: '#9a6440',
  skinDark: '#7f5134',
  hair: '#1d1715',
  top: '#f2c14e',
  topDark: '#d8a837',
  legs: '#4f6fa8',
  legsDark: '#425d8f',
  shoe: '#e2574c',
  style: 'puffs',
};
const KID_CAP: Kid = {
  skin: '#e7b48d',
  skinDark: '#cf9a74',
  hair: '#6b4a2e',
  top: '#6fa46a',
  topDark: '#5a8a56',
  legs: '#3f4a63',
  legsDark: '#333c52',
  shoe: '#f3ead7',
  style: 'cap',
};
const KID_BOB: Kid = {
  skin: '#f0c7a5',
  skinDark: '#d8ab88',
  hair: '#c08a4e',
  top: '#9b6fb3',
  topDark: '#835d99',
  legs: '#6d86c2',
  legsDark: '#5c72a8',
  shoe: '#f1b9c7',
  style: 'bob',
};
/**
 * Céleste toute petite (D-110), le reflet du miroir de la nounou : couettes courtes, lunettes rondes
 * roses, le pyjama du début (PLACEHOLDER, comme `TODDLER_LOOK`).
 */
const TODDLER: Kid = {
  skin: '#f0c7a5',
  skinDark: '#d8ab88',
  hair: '#6b4630',
  top: '#8fb3e0',
  topDark: '#7a9cc8',
  legs: '#8fb3e0',
  legsDark: '#7a9cc8',
  shoe: '#f1b9c7',
  style: 'pigtails',
  glasses: true,
};
/** Céleste toute petite est dessinée comme un enfant de la classe, en plus petit. */
const TODDLER_SCALE = 0.8;
const EYE = '#2b1d18';
const BLUSH = 'rgba(230,120,130,0.35)';
const BLANKETS = ['#7a8fc4', '#c48a9a', '#8fb08a'] as const;

function round(
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

/** Tête d'enfant de profil (tournée vers la droite), coiffure selon `kid.style`. */
function kidHead(
  ctx: CanvasRenderingContext2D,
  kid: Kid,
  x: number,
  y: number,
  r: number,
  eyesClosed = false,
): void {
  if (kid.style === 'puffs') {
    ctx.fillStyle = kid.hair;
    disc(ctx, x - r * 0.75, y - r * 0.95, r * 0.62);
    disc(ctx, x + r * 0.45, y - r * 1.05, r * 0.58);
  } else if (kid.style === 'pigtails') {
    // Deux petites couettes, de part et d'autre de la tête.
    ctx.fillStyle = kid.hair;
    disc(ctx, x - r * 1.1, y - r * 0.2, r * 0.42);
    disc(ctx, x + r * 0.95, y - r * 0.35, r * 0.38);
  } else if (kid.style === 'bob') {
    ctx.fillStyle = kid.hair;
    round(ctx, x - r * 1.15, y - r * 1.1, r * 2.1, r * 2, r * 0.9);
  }
  ctx.fillStyle = kid.skin;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = kid.skinDark;
  disc(ctx, x - r * 0.15, y + r * 0.15, r * 0.22);
  ctx.fillStyle = kid.hair;
  if (kid.style === 'cap') {
    // Casquette rouge, la visière vers l'avant.
    ctx.fillStyle = '#c8473f';
    ctx.beginPath();
    ctx.arc(x, y - r * 0.2, r * 1.02, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x, y - r * 0.32, r * 1.6, r * 0.28);
  } else {
    // Frange.
    ctx.beginPath();
    ctx.arc(x - r * 0.1, y - r * 0.25, r * 1.02, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  }
  ctx.fillStyle = EYE;
  if (eyesClosed) {
    ctx.fillRect(x + r * 0.35, y + r * 0.12, r * 0.4, 0.6);
  } else {
    ctx.fillRect(x + r * 0.45, y + r * 0.02, 0.9, 1.1);
  }
  ctx.fillStyle = BLUSH;
  disc(ctx, x + r * 0.35, y + r * 0.45, r * 0.26);
  if (kid.glasses) {
    // Les lunettes rondes roses (spec §2).
    ctx.strokeStyle = '#e05a8a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x + r * 0.5, y + r * 0.05, r * 0.32, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Enfant debout ; `wave` : le bras avant levé (0 : le long du corps). */
function kidStanding(
  ctx: CanvasRenderingContext2D,
  kid: Kid,
  w: number,
  h: number,
  wave: number,
  backpack: boolean,
): void {
  const cx = w / 2;
  ctx.fillStyle = kid.legsDark;
  round(ctx, cx - 3.5, h - 10, 3, 9, 1.2);
  ctx.fillStyle = kid.legs;
  round(ctx, cx + 0.3, h - 10, 3, 9, 1.2);
  ctx.fillStyle = kid.shoe;
  round(ctx, cx - 4, h - 2, 4.5, 2, 1);
  round(ctx, cx, h - 2, 5, 2, 1);
  if (backpack) {
    ctx.fillStyle = '#3d6f8f';
    round(ctx, cx - 7.5, h - 19, 5, 8, 1.5);
  }
  ctx.fillStyle = kid.topDark;
  round(ctx, cx - 4.5, h - 19, 3, 8, 1.4);
  ctx.fillStyle = kid.top;
  round(ctx, cx - 4, h - 20, 8, 11, 3);
  if (kid.style === 'puffs') {
    // Salopette : les bretelles.
    ctx.fillStyle = kid.legs;
    ctx.fillRect(cx - 2.5, h - 20, 1.2, 7);
    ctx.fillRect(cx + 1.6, h - 20, 1.2, 7);
    ctx.fillRect(cx - 3.5, h - 14, 7, 4);
  }
  kidHead(ctx, kid, cx + 0.5, h - 24.5, 5);
  ctx.save();
  ctx.translate(cx + 1, h - 18.5);
  ctx.rotate(-wave);
  ctx.fillStyle = kid.top;
  round(ctx, -1.4, 0, 2.8, 4, 1.2);
  ctx.fillStyle = kid.skin;
  round(ctx, -1.1, 3.5, 2.2, 3.5, 1);
  disc(ctx, 0, 7.2, 1.3);
  ctx.restore();
}

/** Enfant assis au bord d'une couchette, les jambes devant. */
function kidSitting(
  ctx: CanvasRenderingContext2D,
  kid: Kid,
  w: number,
  h: number,
  frame: number,
): void {
  const hip = w / 2 - 3;
  ctx.fillStyle = kid.legs;
  round(ctx, hip, h - 4, 9, 3.5, 1.5);
  ctx.fillStyle = kid.shoe;
  round(ctx, hip + 8, h - 4.5, 3, 3, 1);
  ctx.fillStyle = kid.top;
  round(ctx, hip - 3, h - 14, 8, 11, 3);
  kidHead(ctx, kid, hip + 1.5, h - 18.5, 5);
  ctx.save();
  ctx.translate(hip + 2, h - 12.5);
  ctx.rotate(-(frame === 0 ? 0.6 : 0.75));
  ctx.fillStyle = kid.skin;
  round(ctx, -1.1, 0, 2.2, 6, 1);
  ctx.restore();
}

/** Assise par terre, juste après avoir glissé sous la grille : appuyée sur une main, elle rit. */
function kidSlid(
  ctx: CanvasRenderingContext2D,
  kid: Kid,
  w: number,
  h: number,
  frame: number,
): void {
  const hip = w / 2 - 2;
  ctx.fillStyle = kid.legs;
  round(ctx, hip, h - 3.5, 10, 3.5, 1.5);
  ctx.fillStyle = kid.shoe;
  round(ctx, hip + 9, h - 4, 3, 3, 1);
  ctx.save();
  ctx.translate(hip, h - 2);
  ctx.rotate(-0.35);
  ctx.fillStyle = kid.top;
  round(ctx, -4, -11, 8, 11, 3);
  ctx.fillStyle = kid.legs;
  ctx.fillRect(-2.5, -11, 1.2, 6);
  ctx.fillRect(1.6, -11, 1.2, 6);
  kidHead(ctx, kid, 0.5, -15.5, 5);
  ctx.restore();
  ctx.fillStyle = kid.skin;
  round(ctx, hip - 8, h - 9, 2.2, 8, 1);
  disc(ctx, hip - 7, h - 1.3, 1.3);
  // Elle tourne la tête vers Céleste : un petit balancement.
  if (frame === 1) {
    ctx.fillStyle = BLUSH;
    disc(ctx, hip + 3, h - 15, 1.6);
  }
}

/** Dormeur sous sa couverture, la tête sur l'oreiller ; la couverture se soulève un peu. */
function sleeper(
  ctx: CanvasRenderingContext2D,
  kid: Kid,
  w: number,
  h: number,
  frame: number,
  blanket: string,
): void {
  const lift = frame === 0 ? 0 : 0.8;
  ctx.fillStyle = '#fbf7ee';
  round(ctx, w - 11, h - 6, 10, 5, 2);
  kidHead(ctx, kid, w - 6, h - 6.5, 3.8, true);
  ctx.fillStyle = blanket;
  ctx.beginPath();
  ctx.moveTo(1, h);
  ctx.quadraticCurveTo(2, h - 7 - lift, w * 0.45, h - 7.5 - lift);
  ctx.quadraticCurveTo(w - 10, h - 7 - lift, w - 7, h - 4);
  ctx.lineTo(w - 7, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(4, h - 5, w - 14, 1);
}

/** Les enfants de la classe (D-85) ; faux si `kind` n'en est pas un. */
export function drawClassCharacter(
  ctx: CanvasRenderingContext2D,
  kind: PropKind,
  frame: number,
  w: number,
  h: number,
): boolean {
  switch (kind) {
    case 'classmate':
      kidStanding(ctx, CLASSMATE, w, h, frame === 0 ? 2.4 : 2.8, false);
      return true;
    case 'reflection':
      // Le reflet du miroir (D-110) : Céleste toute petite, un peu pâle, comme derrière une vitre.
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.scale(TODDLER_SCALE, TODDLER_SCALE);
      kidStanding(
        ctx,
        TODDLER,
        w / TODDLER_SCALE,
        h / TODDLER_SCALE,
        frame === 0 ? 0.3 : 0.5,
        false,
      );
      ctx.restore();
      return true;
    case 'reflection-through':
      // De l'autre côté du miroir, elle fait signe.
      ctx.save();
      ctx.scale(TODDLER_SCALE, TODDLER_SCALE);
      kidStanding(
        ctx,
        TODDLER,
        w / TODDLER_SCALE,
        h / TODDLER_SCALE,
        frame === 0 ? 2.4 : 2.8,
        false,
      );
      ctx.restore();
      return true;
    case 'classmate-slid':
      kidSlid(ctx, CLASSMATE, w, h, frame);
      return true;
    case 'classmate-asleep':
      sleeper(ctx, CLASSMATE, w, h, frame, BLANKETS[0]);
      return true;
    case 'kid-cap-sit':
      kidSitting(ctx, KID_CAP, w, h, frame);
      return true;
    case 'kid-bob-sit':
      kidSitting(ctx, KID_BOB, w, h, 1 - frame);
      return true;
    case 'kid-asleep':
      sleeper(ctx, KID_BOB, w, h, frame, BLANKETS[1]);
      return true;
    case 'kids-quay': {
      // Sur le quai, trois enfants et leurs sacs à dos : la camarade fait signe.
      const third = w / 3;
      ctx.save();
      kidStanding(ctx, KID_BOB, third, h, 0.1, true);
      ctx.translate(third, 0);
      kidStanding(ctx, KID_CAP, third, h, frame === 0 ? 0.2 : 0.3, true);
      ctx.translate(third, 0);
      kidStanding(ctx, CLASSMATE, third, h, frame === 0 ? 2.5 : 2.9, true);
      ctx.restore();
      return true;
    }
    default:
      return false;
  }
}
