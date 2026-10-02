import { TILE_SIZE as T } from '../../config/display';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';
import { solidOutline } from './stationArt';

/**
 * Le monde étrange du train (D-88), en silhouettes comme celui de la gare, PLACEHOLDER : la cuisine
 * devenue immense (fourneaux, hotte, étagères de vaisselle) et le wagon-restaurant sans fin, de
 * travers (tables et chaises au plafond, piles d'assiettes). Les pleins sont plus sombres que le
 * mur et bordés de turquoise sur leurs côtés libres (lisibilité, D-81).
 */

type Drawer = (a: ArtContext, r: Rect) => void;

/** Lueur des plaques chaudes : un rose chaud passé, jamais du feu. */
const PLATE_GLOW = '#e98aa6';
const PLATE_DARK = '#2a1a2e';
const CHINA = '#8f86a8';
const CHINA_LIGHT = '#bdb4d1';

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 61.7 + y * 113.1) * 43758.5453;
  return n - Math.floor(n);
}

export function trainStrangeDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
  return {
    strangestove(a, r) {
      // Un fourneau géant (plein) : la porte du four et son hublot, une rangée de boutons ; ou la
      // hotte au-dessus des plaques, ses lamelles.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      if (r.w > r.h) {
        // La hotte : des lamelles.
        ctx.beginPath();
        for (let x = r.x + 6; x < r.x + r.w - 2; x += 6) {
          ctx.moveTo(x, r.y + r.h - 10);
          ctx.lineTo(x, r.y + r.h - 3);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(r.x + r.w / 2, r.y + r.h * 0.6, Math.min(r.w, r.h) * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        for (let x = r.x + 5; x < r.x + r.w - 3; x += 7) {
          ctx.beginPath();
          ctx.arc(x, r.y + 5, 1.6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      solidOutline(a, r, p.rim, 0.7);
    },
    dishshelf(a, r) {
      // Une étagère de vaisselle (pleine) : des planches, des assiettes debout, des bols.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.globalAlpha = 0.35;
      for (let y = r.y + 12; y < r.y + r.h - 2; y += 14) {
        ctx.fillStyle = p.rim;
        ctx.fillRect(r.x + 1, y, r.w - 2, 1);
        for (let x = r.x + 3; x < r.x + r.w - 4; x += 5 + hash(x, y) * 3) {
          ctx.fillStyle = hash(y, x) > 0.5 ? CHINA_LIGHT : CHINA;
          ctx.beginPath();
          ctx.ellipse(x + 1.5, y - 4, 1.4, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      solidOutline(a, r, p.rim, 0.7);
    },
    dishstack(a, r) {
      // Une pile d'assiettes et de soupières (pleine) : des bords clairs serrés, qui penchent.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.globalAlpha = 0.4;
      for (let y = r.y + r.h - 3; y > r.y + 2; y -= 4) {
        const lean = (hash(r.x, y) - 0.5) * 3;
        ctx.fillStyle = hash(y, r.x) > 0.6 ? CHINA_LIGHT : CHINA;
        ctx.fillRect(r.x + 2 + lean, y, r.w - 4, 1.4);
      }
      ctx.globalAlpha = 1;
      solidOutline(a, r, p.rim, 0.7);
    },
    upsidedining(a, r) {
      // Le wagon-restaurant de travers (fond, jamais de collision) : des tables et leurs chaises
      // pendues au plafond, des lampes de table qui tombent vers le haut ; des fenêtres où défile
      // la nuit.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.structure;
      ctx.globalAlpha = 0.55;
      for (let x = r.x + 20; x < r.x + r.w - 40; x += 9 * T) {
        // La table à l'envers : le plateau en haut, les pieds vers le bas.
        ctx.fillRect(x, r.y + 2, 4 * T, 4);
        ctx.fillRect(x + 6, r.y + 6, 3, 18);
        ctx.fillRect(x + 4 * T - 9, r.y + 6, 3, 18);
        // Deux chaises renversées de part et d'autre.
        ctx.fillRect(x - 14, r.y + 2, 10, 3);
        ctx.fillRect(x - 14, r.y + 5, 2, 14);
        ctx.fillRect(x + 4 * T + 4, r.y + 2, 10, 3);
        ctx.fillRect(x + 4 * T + 12, r.y + 5, 2, 14);
      }
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = p.rim;
      ctx.lineWidth = 1;
      for (let x = r.x + 5 * T; x < r.x + r.w - 6 * T; x += 9 * T) {
        ctx.strokeRect(x, r.y + r.h - 4 * T, 3 * T, 2 * T);
      }
      ctx.globalAlpha = 1;
    },
  };
}

/** Plaques chaudes de la cuisine étrange (D-88) : des cercles qui luisent d'un rose chaud. */
export function drawHotPlates(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  inFloor: boolean,
): void {
  const top = inFloor ? y + 2 : y + T - 4;
  ctx.fillStyle = PLATE_DARK;
  ctx.fillRect(x, top, T, 4);
  // Une lueur rose chaude au-dessus de chaque plaque (une plaque pour deux cases), qui se voit de loin.
  ctx.fillStyle = PLATE_GLOW;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x, top - 6, T, 6);
  if (col % 2 === 0) {
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = PLATE_GLOW;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x + T, top + 1, 6.5, 1.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + T, top + 1, 3, 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Vaisselle cassée du train de la vaisselle (D-88) : des éclats pâles, posés, sans danger dessiné. */
export function drawBrokenDishes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  inFloor: boolean,
): void {
  const base = inFloor ? y + 4 : y + T;
  for (let i = 0; i < 3; i++) {
    const px = x + 2 + i * 5;
    const h = 3 + ((col * 5 + i * 3) % 4);
    ctx.fillStyle = i % 2 ? CHINA_LIGHT : CHINA;
    ctx.beginPath();
    ctx.moveTo(px, base);
    ctx.lineTo(px + 1.5, base - h);
    ctx.lineTo(px + 4, base - h + 1.5);
    ctx.lineTo(px + 4.5, base);
    ctx.fill();
  }
}
