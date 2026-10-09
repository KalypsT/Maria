import type { ArtPalette } from '../../config/art';
import type { CelesteOutfit } from '../../config/growth';

/**
 * Pièces de Céleste en « papier découpé » (D-29), dessinées par le code dans le style D-28 :
 * enfant de 5-6 ans (tête ronde assez grosse), couettes basses à nœuds roses, lunettes rondes
 * roses, taches de rousseur. Tenues d'après les illustrations de l'utilisateur (D-41, D-43). Monde étrange :
 * silhouettes, seules les lunettes restent roses.
 * Chaque pièce a sa taille (px logiques) et son point d'attache (origine, en fraction).
 */
export const CELESTE_PARTS = {
  head: { width: 16, height: 14, originX: 7.5 / 16, originY: 13.5 / 14 },
  pigtail: { width: 5, height: 7, originX: 0.5, originY: 0.5 / 7 },
  /** Queue de cheval (D-69), attachée haut derrière la tête par son chouchou rose. */
  ponytail: { width: 7, height: 11, originX: 3.5 / 7, originY: 1 / 11 },
  torso: { width: 11, height: 9, originX: 0.5, originY: 1 },
  arm: { width: 4, height: 8, originX: 0.5, originY: 0.1 },
  leg: { width: 6, height: 9, originX: 2.5 / 6, originY: 0.05 },
  /** Jupe de la robe (D-43), attachée à la hanche, devant les jambes ; vide en pyjama. */
  skirt: { width: 14, height: 7, originX: 0.5, originY: 1.5 / 7 },
  /** Parapluie (D-62), tenu par le manche (en bas) ; ouvert par la pose. */
  umbrella: { width: 24, height: 20, originX: 0.5, originY: 1 },
  /**
   * Parapluie replié, tenu par la pointe, le crochet du manche en haut (D-65) : accroché au câble.
   * Origine : la main (en bas).
   */
  hook: { width: 8, height: 12, originX: 0.5, originY: 1 },
} as const;
export type CelestePart = keyof typeof CELESTE_PARTS;

/**
 * Tenue de la maison (D-41) : pyjama bleu à myrtilles, liserés roses, chaussons lapin roses. Les
 * autres zones auront leur tenue (ouvert, spec §45). Le bleu est plus clair que les murs de la
 * maison, et le liseré sombre détache la silhouette du décor (lisibilité, pilier 1).
 */
const PYJAMA = '#86b0ea';
const PYJAMA_EDGE = 'rgba(28,38,78,0.55)';
const BERRY = '#3d55b0';
const PIPING = '#f7c1cf';
const SLIPPER = '#f3aabb';
const SLIPPER_FACE = '#fbe9dc';
/**
 * Tenue de la phase 2 (D-43) : robe rose à fleurs, col blanc, manches ballon, sabots roses. Le
 * rose se détache bien des murs bleus de la maison.
 */
const DRESS = '#f4b1c0';
const DRESS_EDGE = 'rgba(120,50,70,0.5)';
const FLOWER = '#fdf6ef';
const FLOWER_PINK = '#e7708f';
const COLLAR = '#fffaf4';
const CLOG = '#f39ab2';
const CLOG_HOLE = '#c9607e';
const SKIN_EDGE = 'rgba(150,80,60,0.45)';
/**
 * Tenue de la phase 3 (D-69), d'après l'illustration de l'utilisateur : veste en jean ouverte
 * (manches retroussées, boutons dorés) sur un t-shirt blanc à fleurs roses, short rose à revers,
 * chaussettes blanches, baskets roses et blanches.
 */
const DENIM = '#5f8cc8';
const DENIM_LIGHT = '#8fb2df';
const DENIM_EDGE = 'rgba(24,44,92,0.6)';
const BUTTON = '#c9a25a';
const TEE = '#fbf7f2';
const SHORTS = '#f2a7b6';
const SHORTS_EDGE = 'rgba(130,50,70,0.5)';
const SOCK = '#fdfbf6';
const SNEAKER = '#f4a6b8';
const SNEAKER_WHITE = '#fffaf6';
const SKIN = '#f0c19e';
const HAIR = '#6b4329';
const RIBBON = '#f08aa6';
const FRECKLE = 'rgba(176,98,70,0.7)';
const GLASSES = '#ff6fa3';
const SILHOUETTE = '#07080d';

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCelestePart(
  ctx: CanvasRenderingContext2D,
  part: CelestePart,
  palette: Readonly<ArtPalette>,
  outfit: CelesteOutfit = 'pyjama',
): void {
  const dark = palette.silhouettes;
  if (part === 'umbrella') {
    drawUmbrella(ctx, dark);
    return;
  }
  if (part === 'hook') {
    drawHook(ctx, dark);
    return;
  }
  if (part === 'ponytail') {
    drawPonytail(ctx, dark);
    return;
  }
  if (outfit === 'dress' && part !== 'head' && part !== 'pigtail') {
    drawDressPart(ctx, part, dark);
    return;
  }
  // La tenue de la fin (D-150) n'a pas de dessin par code : celui de la veste, si une pièce manque.
  if ((outfit === 'jacket' || outfit === 'tee') && part !== 'head' && part !== 'pigtail') {
    drawJacketPart(ctx, part, dark);
    return;
  }
  switch (part) {
    case 'head': {
      const cx = 8;
      const cy = 7.2;
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      circle(ctx, cx, cy, 6);
      ctx.fillRect(cx - 1.5, cy + 4, 3, 3);
      if (dark) {
        ctx.strokeStyle = palette.rim;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        ctx.fillStyle = HAIR;
        ctx.beginPath();
        ctx.arc(cx, cy - 0.6, 6.3, Math.PI * 1.0, Math.PI * 2.0);
        ctx.lineTo(cx + 6.3, cy + 0.5);
        ctx.quadraticCurveTo(cx + 1, cy - 2.5, cx - 6.3, cy + 0.5);
        ctx.fill();
        ctx.fillStyle = 'rgba(217,120,143,0.35)';
        circle(ctx, cx + 3.8, cy + 2.8, 1.1);
        ctx.fillStyle = FRECKLE;
        ctx.fillRect(cx + 2.6, cy + 2.4, 0.5, 0.5);
        ctx.fillRect(cx + 3.5, cy + 2.9, 0.5, 0.5);
        ctx.fillRect(cx + 4.5, cy + 2.4, 0.5, 0.5);
      }
      // Lunettes rondes roses (identité de Céleste, spec §2), de trois quarts.
      ctx.strokeStyle = GLASSES;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(cx + 0.2, cy + 0.6, 1.9, 0, Math.PI * 2);
      ctx.moveTo(cx + 6.2, cy + 0.6);
      ctx.arc(cx + 4.4, cy + 0.6, 1.8, 0, Math.PI * 2);
      ctx.stroke();
      if (!dark) {
        ctx.fillStyle = '#2b2530';
        ctx.fillRect(cx - 0.2, cy + 0.2, 0.9, 0.9);
        ctx.fillRect(cx + 4, cy + 0.2, 0.9, 0.9);
      }
      break;
    }
    case 'pigtail':
      ctx.fillStyle = dark ? SILHOUETTE : HAIR;
      ctx.beginPath();
      ctx.ellipse(2.5, 4, 2.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Nœud rose : deux boucles et le centre.
      ctx.fillStyle = dark ? SILHOUETTE : RIBBON;
      ctx.beginPath();
      ctx.moveTo(2.5, 1.3);
      ctx.lineTo(0.2, 0.2);
      ctx.lineTo(0.2, 2.4);
      ctx.closePath();
      ctx.moveTo(2.5, 1.3);
      ctx.lineTo(4.8, 0.2);
      ctx.lineTo(4.8, 2.4);
      ctx.closePath();
      ctx.fill();
      circle(ctx, 2.5, 1.3, 0.7);
      break;
    case 'torso':
      ctx.fillStyle = dark ? SILHOUETTE : PYJAMA;
      ctx.beginPath();
      ctx.roundRect(0.5, 0, 10, 9, [3.5, 3.5, 2, 2]);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = PYJAMA_EDGE;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        // Myrtilles.
        ctx.fillStyle = BERRY;
        for (const [x, y] of [
          [3, 3.2],
          [3.9, 3.7],
          [7.4, 2.6],
          [4.6, 6.4],
        ] as const) {
          circle(ctx, x, y, 0.7);
        }
        // Col et patte boutonnée, liserés roses.
        ctx.strokeStyle = PIPING;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(6.2, 0.4);
        ctx.lineTo(8.2, 2);
        ctx.lineTo(9.6, 0.8);
        ctx.moveTo(8.9, 2.2);
        ctx.lineTo(8.9, 8.6);
        ctx.moveTo(0.8, 8.4);
        ctx.lineTo(10.2, 8.4);
        ctx.stroke();
      }
      break;
    case 'arm':
      ctx.fillStyle = dark ? SILHOUETTE : PYJAMA;
      ctx.beginPath();
      ctx.roundRect(0.5, 0, 3, 5.8, 1.4);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = PYJAMA_EDGE;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fillStyle = PIPING;
        ctx.fillRect(0.6, 5, 2.8, 0.6);
      }
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      circle(ctx, 2, 6.6, 1.3);
      break;
    case 'leg':
      ctx.fillStyle = dark ? SILHOUETTE : PYJAMA;
      ctx.beginPath();
      ctx.roundRect(1, 0, 3, 7.4, 1.2);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = PYJAMA_EDGE;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fillStyle = BERRY;
        circle(ctx, 2.4, 3.2, 0.6);
        ctx.fillStyle = PIPING;
        ctx.fillRect(1.1, 6.2, 2.8, 0.6);
      }
      // Chausson lapin : une oreille dressée à l'avant, le museau clair.
      ctx.fillStyle = dark ? SILHOUETTE : SLIPPER;
      ctx.beginPath();
      ctx.roundRect(0.6, 6.8, 5, 2.2, 1.1);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4.3, 6.4, 0.5, 1, 0.3, 0, Math.PI * 2);
      ctx.fill();
      if (!dark) {
        ctx.fillStyle = SLIPPER_FACE;
        circle(ctx, 4.6, 7.9, 0.7);
      }
      break;
    case 'skirt':
      // Pas de jupe en pyjama.
      break;
  }
}

/** Petites fleurs de la robe (blanches et roses), en points. */
function flowers(ctx: CanvasRenderingContext2D, spots: readonly (readonly [number, number])[]) {
  spots.forEach(([x, y], i) => {
    ctx.fillStyle = i % 2 === 0 ? FLOWER : FLOWER_PINK;
    circle(ctx, x, y, 0.65);
  });
}

/** Robe de la phase 2 (D-43) : corsage, manches ballon, jupe évasée ; jambes nues, sabots. */
function drawDressPart(ctx: CanvasRenderingContext2D, part: CelestePart, dark: boolean): void {
  switch (part) {
    case 'torso':
      ctx.fillStyle = dark ? SILHOUETTE : DRESS;
      ctx.beginPath();
      ctx.roundRect(0.5, 0, 10, 9, [3.5, 3.5, 1, 1]);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = DRESS_EDGE;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        flowers(ctx, [
          [3.2, 4],
          [7, 5.5],
          [4.8, 7.2],
        ]);
        // Col claudine blanc.
        ctx.fillStyle = COLLAR;
        ctx.beginPath();
        ctx.ellipse(7.2, 1, 2.6, 1.3, 0.15, 0, Math.PI);
        ctx.fill();
      }
      break;
    case 'arm':
      // Manche ballon courte, puis le bras nu.
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      ctx.beginPath();
      ctx.roundRect(0.9, 1.5, 2.2, 5, 1.1);
      ctx.fill();
      circle(ctx, 2, 6.6, 1.3);
      ctx.fillStyle = dark ? SILHOUETTE : DRESS;
      ctx.beginPath();
      ctx.ellipse(2, 1.6, 1.9, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = DRESS_EDGE;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      break;
    case 'leg':
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      ctx.beginPath();
      ctx.roundRect(1.3, 0, 2.4, 7.4, 1.1);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = SKIN_EDGE;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      // Sabot rose, bout arrondi, deux trous et la bride.
      ctx.fillStyle = dark ? SILHOUETTE : CLOG;
      ctx.beginPath();
      ctx.roundRect(0.6, 6.6, 5.2, 2.4, [1, 1.3, 1.1, 1.1]);
      ctx.fill();
      if (!dark) {
        ctx.fillStyle = CLOG_HOLE;
        circle(ctx, 3.6, 7.3, 0.35);
        circle(ctx, 4.8, 7.5, 0.35);
        circle(ctx, 1.4, 7.6, 0.45);
      }
      break;
    case 'skirt':
      // Jupe évasée, un peu plus longue derrière ; ourlet ondulé.
      ctx.fillStyle = dark ? SILHOUETTE : DRESS;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(11, 0);
      ctx.quadraticCurveTo(13.2, 3.5, 13.6, 6.4);
      ctx.quadraticCurveTo(7, 7.4, 0.4, 6.6);
      ctx.quadraticCurveTo(1, 3.5, 3, 0);
      ctx.closePath();
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = DRESS_EDGE;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        flowers(ctx, [
          [4, 2.6],
          [8.5, 2],
          [6.2, 4.6],
          [10.8, 4.8],
          [2.6, 5.4],
        ]);
      }
      break;
    default:
      break;
  }
}

/** Queue de cheval (D-69) : le chouchou rose en haut, puis la mèche qui s'évase et ondule. */
function drawPonytail(ctx: CanvasRenderingContext2D, dark: boolean): void {
  ctx.fillStyle = dark ? SILHOUETTE : HAIR;
  ctx.beginPath();
  ctx.moveTo(2.4, 1);
  ctx.quadraticCurveTo(0, 4.5, 0.6, 8.5);
  ctx.quadraticCurveTo(1.6, 10.2, 2.6, 10.8);
  ctx.quadraticCurveTo(3.4, 9.6, 4.4, 10.6);
  ctx.quadraticCurveTo(6.6, 8.2, 5.6, 4.6);
  ctx.quadraticCurveTo(5, 2.4, 4.6, 1);
  ctx.closePath();
  ctx.fill();
  if (!dark) {
    // Quelques mèches plus sombres.
    ctx.strokeStyle = 'rgba(60,34,20,0.5)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(3.2, 2.5);
    ctx.quadraticCurveTo(2, 6, 2.4, 9.6);
    ctx.moveTo(4.2, 2.5);
    ctx.quadraticCurveTo(4.8, 6, 4.2, 9.4);
    ctx.stroke();
  }
  // Chouchou rose : trois petits plis.
  ctx.fillStyle = dark ? SILHOUETTE : RIBBON;
  for (const x of [2.5, 3.5, 4.5]) {
    circle(ctx, x, 1.2, 0.9);
  }
}

/**
 * Tenue de la phase 3 (D-69) : veste en jean ouverte sur le t-shirt à fleurs (devant, à droite),
 * manches retroussées ; le short rose sur le haut des jambes ; chaussettes et baskets.
 */
function drawJacketPart(ctx: CanvasRenderingContext2D, part: CelestePart, dark: boolean): void {
  switch (part) {
    case 'torso':
      ctx.fillStyle = dark ? SILHOUETTE : DENIM;
      ctx.beginPath();
      ctx.roundRect(0.5, 0, 10, 9, [3.5, 3.5, 1, 1]);
      ctx.fill();
      if (dark) {
        break;
      }
      ctx.strokeStyle = DENIM_EDGE;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      // Le t-shirt blanc à fleurs, entre les pans ouverts de la veste.
      ctx.fillStyle = TEE;
      ctx.beginPath();
      ctx.moveTo(6.6, 0.4);
      ctx.lineTo(9.6, 0.8);
      ctx.lineTo(9.9, 8.2);
      ctx.lineTo(8, 8.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = FLOWER_PINK;
      circle(ctx, 8.8, 3, 0.55);
      circle(ctx, 9.1, 5.8, 0.55);
      // Col, poche de poitrine, boutons dorés, couture de la taille.
      ctx.fillStyle = DENIM_LIGHT;
      ctx.beginPath();
      ctx.moveTo(4.6, 0.2);
      ctx.lineTo(7, 0.4);
      ctx.lineTo(6.2, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = DENIM_EDGE;
      ctx.lineWidth = 0.4;
      ctx.strokeRect(5, 3, 2.4, 1.8);
      ctx.fillStyle = BUTTON;
      circle(ctx, 7.6, 3.4, 0.45);
      circle(ctx, 7.8, 6.2, 0.45);
      ctx.fillStyle = DENIM_LIGHT;
      ctx.fillRect(0.8, 7.6, 7.2, 0.9);
      break;
    case 'arm':
      // Manche en jean retroussée au coude, puis l'avant-bras nu.
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      ctx.beginPath();
      ctx.roundRect(0.9, 3, 2.2, 3.6, 1.1);
      ctx.fill();
      circle(ctx, 2, 6.6, 1.3);
      ctx.fillStyle = dark ? SILHOUETTE : DENIM;
      ctx.beginPath();
      ctx.roundRect(0.5, 0, 3, 4.2, 1.4);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = DENIM_EDGE;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fillStyle = DENIM_LIGHT;
        ctx.fillRect(0.5, 3, 3, 1.2);
      }
      break;
    case 'leg':
      // Jambe nue, short rose à revers en haut, chaussette blanche, basket rose et blanche.
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      ctx.beginPath();
      ctx.roundRect(1.3, 0, 2.4, 7.4, 1.1);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = SKIN_EDGE;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.fillStyle = dark ? SILHOUETTE : SHORTS;
      ctx.beginPath();
      ctx.roundRect(0.6, 0, 3.8, 3, [0, 0, 0.6, 0.6]);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = SHORTS_EDGE;
        ctx.lineWidth = 0.4;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(0.6, 2.1, 3.8, 0.8);
        ctx.fillStyle = SOCK;
        ctx.fillRect(1.3, 5.6, 2.4, 1.4);
      }
      ctx.fillStyle = dark ? SILHOUETTE : SNEAKER_WHITE;
      ctx.beginPath();
      ctx.roundRect(0.6, 6.6, 5.2, 2.4, [1, 1.4, 1, 1]);
      ctx.fill();
      if (!dark) {
        ctx.fillStyle = SNEAKER;
        ctx.fillRect(0.6, 6.6, 2, 2.4);
        ctx.beginPath();
        ctx.ellipse(4, 7.8, 1.3, 0.6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(150,80,95,0.45)';
        ctx.fillRect(0.6, 8.5, 5.2, 0.5);
      }
      break;
    default:
      // Pas de jupe : le short est dessiné sur les jambes.
      break;
  }
}

/** Couleurs du parapluie (D-62), PLACEHOLDER : jaune d'enfant, pois blancs, lisible sur le ciel. */
const UMBRELLA = '#f2c14e';
const UMBRELLA_EDGE = '#c9912a';
const UMBRELLA_DOT = '#fff8e6';
const UMBRELLA_HANDLE = '#8a5a44';

/** Parapluie ouvert, vu de côté : dôme festonné, pois, baleines, manche recourbé (bas au centre). */
function drawUmbrella(ctx: CanvasRenderingContext2D, dark: boolean): void {
  const cx = 12;
  ctx.strokeStyle = dark ? SILHOUETTE : UMBRELLA_HANDLE;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, 3);
  ctx.lineTo(cx, 18);
  ctx.arc(cx + 1.8, 18, 1.8, Math.PI, 0, true);
  ctx.stroke();
  ctx.fillStyle = dark ? SILHOUETTE : UMBRELLA;
  ctx.beginPath();
  ctx.moveTo(1, 9);
  ctx.quadraticCurveTo(cx, -3, 23, 9);
  for (let k = 0; k < 4; k++) {
    const x1 = 23 - k * 5.5;
    ctx.quadraticCurveTo(x1 - 2.75, 7, x1 - 5.5, 9);
  }
  ctx.fill();
  if (dark) {
    return;
  }
  ctx.strokeStyle = UMBRELLA_EDGE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (const x of [6.5, 12, 17.5]) {
    ctx.moveTo(cx, 3);
    ctx.lineTo(x, 8.6);
  }
  ctx.stroke();
  ctx.fillStyle = UMBRELLA_DOT;
  for (const [x, y] of [
    [6, 6],
    [12, 4.5],
    [18, 6],
    [9, 7.5],
    [15, 7.5],
  ] as const) {
    circle(ctx, x, y, 0.9);
  }
  ctx.fillStyle = UMBRELLA_EDGE;
  circle(ctx, cx, 2.2, 0.9);
}

/**
 * Parapluie replié, pendu par son crochet (D-65) : le crochet en bois en haut (il passe sur le
 * câble), le manche, puis la toile jaune serrée jusqu'à la main (en bas). PLACEHOLDER.
 */
function drawHook(ctx: CanvasRenderingContext2D, dark: boolean): void {
  const cx = 4;
  ctx.strokeStyle = dark ? SILHOUETTE : UMBRELLA_HANDLE;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - 1.6, 2.2, 1.6, 0, Math.PI, true);
  ctx.moveTo(cx, 2.2);
  ctx.lineTo(cx, 6);
  ctx.stroke();
  ctx.fillStyle = dark ? SILHOUETTE : UMBRELLA;
  ctx.beginPath();
  ctx.moveTo(cx, 5.5);
  ctx.quadraticCurveTo(cx + 2.4, 8.5, cx + 0.6, 11.5);
  ctx.lineTo(cx - 0.6, 11.5);
  ctx.quadraticCurveTo(cx - 2.4, 8.5, cx, 5.5);
  ctx.fill();
  if (!dark) {
    ctx.strokeStyle = UMBRELLA_EDGE;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, 6.5);
    ctx.lineTo(cx, 11);
    ctx.stroke();
  }
}
