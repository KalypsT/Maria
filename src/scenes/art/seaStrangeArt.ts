import { TILE_SIZE as T } from '../../config/display';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';
import { solidOutline } from './stationArt';

/**
 * La fête engloutie (D-102), le monde étrange de la station balnéaire, en silhouettes comme les
 * autres mondes étranges, PLACEHOLDER : la fête de la jetée sous une eau immobile, démesurée. Les
 * pleins sont plus sombres que le ciel et bordés de turquoise sur leurs côtés libres (lisibilité,
 * D-81) ; les rayures des toiles et les ampoules restent à peine visibles, passées.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

/** Rayures passées des toiles (un rose fané sur la silhouette). */
const FADED_STRIPE = 'rgba(255,170,205,0.16)';
/** Ampoules éteintes ou presque : un turquoise pâle. */
const BULB = 'rgba(150,245,230,0.75)';
const GILT = 'rgba(230,200,140,0.35)';
const BALLOON = ['rgba(255,160,205,0.55)', 'rgba(150,245,230,0.5)', 'rgba(205,180,255,0.5)'];

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 47.3 + y * 191.9) * 43758.5453;
  return n - Math.floor(n);
}

/** Les chevaux de bois : un peu plus clairs que les pleins, bordés de turquoise (lisibilité). */
const HORSE = '#2b2346';
const HORSE_RIM = 'rgba(140,240,225,0.55)';

/** Un cheval de bois de profil (silhouette), centré en (x, y), tourné vers `dir` (1 : droite). */
function horse(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) {
  ctx.fillStyle = HORSE;
  ctx.strokeStyle = HORSE_RIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 5, 0, 0, Math.PI * 2);
  // L'encolure et la tête, dressées.
  ctx.moveTo(x + dir * 6, y - 2);
  ctx.lineTo(x + dir * 11, y - 12);
  ctx.lineTo(x + dir * 16, y - 10);
  ctx.lineTo(x + dir * 13, y - 6);
  ctx.lineTo(x + dir * 9, y + 1);
  ctx.closePath();
  // Les jambes, repliées au galop, et la queue.
  ctx.rect(x - 8, y + 3, 2, 7);
  ctx.rect(x + 5, y + 3, 2, 6);
  ctx.rect(x - dir * 13, y - 2, 4, 2);
  ctx.stroke();
  ctx.fill();
}

/** Une rangée d'ampoules le long d'un bord. */
function bulbs(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, step = 8) {
  ctx.fillStyle = BULB;
  for (let x = x0 + step / 2; x < x1; x += step) {
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Un bord festonné (une toile qui pend) sous `y`, de x0 à x1. */
function scallops(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, fill: string) {
  ctx.fillStyle = fill;
  for (let x = x0; x < x1; x += 8) {
    ctx.beginPath();
    ctx.arc(x + 4, y, 4, 0, Math.PI);
    ctx.fill();
  }
}

export function seaStrangeDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
  return {
    drownedcarousel(a, r) {
      // Le toit du carrousel englouti (plein) : le chapiteau qui dépasse de l'eau, ses rayures
      // passées, son bord festonné et ses ampoules ; au-dessus, le mât tordu et sa couronne.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      const cx = r.x + 9 * T;
      const top = r.y + 2 * T;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y + 2 * T, r.w, r.h - 2 * T);
      ctx.clip();
      ctx.fillStyle = FADED_STRIPE;
      for (let k = -8; k < 8; k += 2) {
        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(cx + k * 2 * T, r.y + r.h);
        ctx.lineTo(cx + (k + 1) * 2 * T, r.y + r.h);
        ctx.fill();
      }
      ctx.restore();
      // Le mât, penché, et sa couronne (du décor : on ne s'y tient pas).
      ctx.strokeStyle = p.structure;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, top + 4);
      ctx.lineTo(cx + 10, r.y - 4 * T);
      ctx.stroke();
      ctx.strokeStyle = GILT;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = p.structure;
      ctx.beginPath();
      ctx.moveTo(cx + 2, r.y - 4 * T);
      ctx.lineTo(cx + 10, r.y - 6 * T);
      ctx.lineTo(cx + 18, r.y - 4 * T);
      ctx.fill();
      bulbs(ctx, r.x + T, r.x + r.w - 4 * T, r.y + 3 * T + 3, 9);
      solidOutline(a, r, p.rim, 0.7);
    },
    horsepole(a, r) {
      // Une barre de carrousel (pleine, une tuile de large), torsadée de rayures passées ; un cheval
      // de bois y est fixé, tourné dans le mauvais sens.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.fillStyle = FADED_STRIPE;
      for (let y = r.y; y < r.y + r.h; y += 10) {
        ctx.beginPath();
        ctx.moveTo(r.x, y);
        ctx.lineTo(r.x + r.w, y + 5);
        ctx.lineTo(r.x + r.w, y + 8);
        ctx.lineTo(r.x, y + 3);
        ctx.fill();
      }
      const dir = hash(r.x, r.y) > 0.5 ? 1 : -1;
      horse(ctx, r.x + r.w / 2 - dir * 4, r.y + Math.min(r.h * 0.35, 5 * T), dir);
      solidOutline(a, r, p.rim, 0.7);
    },
    carouselbeam(a, r) {
      // La traverse du plafond du carrousel (pleine) : une poutre dorée et ses festons.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.fillStyle = GILT;
      ctx.fillRect(r.x + 2, r.y + 3, r.w - 4, 1);
      scallops(ctx, r.x, r.x + r.w, r.y + r.h, p.structure);
      bulbs(ctx, r.x, r.x + r.w, r.y + r.h + 2, 10);
      solidOutline(a, r, p.rim, 0.7);
    },
    fairawning(a, r) {
      // Une toile de stand qui pend (pleine) : des rayures verticales passées, un bord festonné et
      // ses ampoules.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.fillStyle = FADED_STRIPE;
      for (let x = r.x; x < r.x + r.w; x += 2 * T) {
        ctx.fillRect(x, r.y, T, r.h);
      }
      scallops(ctx, r.x, r.x + r.w, r.y + r.h, p.structure);
      bulbs(ctx, r.x, r.x + r.w, r.y + r.h + 3);
      solidOutline(a, r, p.rim, 0.7);
    },
    drownedstall(a, r) {
      // Un stand englouti (plein) : le toit et son bandeau d'ampoules, le comptoir ; plus bas, la
      // devanture noyée, une fenêtre sombre.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.fillStyle = FADED_STRIPE;
      for (let x = r.x; x < r.x + r.w; x += 2 * T) {
        ctx.fillRect(x, r.y + 2, T, 6);
      }
      bulbs(ctx, r.x, r.x + r.w, r.y + 11);
      if (r.h > 3 * T) {
        ctx.strokeStyle = p.rim;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1;
        for (let x = r.x + 2 * T; x + 3 * T < r.x + r.w; x += 6 * T) {
          ctx.strokeRect(x, r.y + 2 * T, 3 * T, 2 * T);
        }
        ctx.globalAlpha = 1;
      }
      solidOutline(a, r, p.rim, 0.7);
    },
    balloons(a, r) {
      // Une grappe de ballons qui monte (fond), leurs ficelles qui pendent, immobiles.
      const { ctx } = a;
      for (let k = 0; k < 5; k++) {
        const x = r.x + r.w * (0.2 + 0.6 * hash(r.x + k, r.y));
        const y = r.y + 8 + k * 5 + hash(k, r.x) * 6;
        ctx.strokeStyle = 'rgba(150,245,230,0.25)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y + 6);
        ctx.lineTo(r.x + r.w / 2, r.y + r.h);
        ctx.stroke();
        ctx.fillStyle = BALLOON[k % BALLOON.length] ?? BULB;
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    drownedwheel(a, r) {
      // La grande roue à demi noyée (fond lointain) : la jante, les rayons, les nacelles ; l'une
      // d'elles luit en turquoise.
      const { ctx, palette: p } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.w / 2;
      const radius = r.w / 2 - 6;
      ctx.strokeStyle = p.structure;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 12; k++) {
        const t = (k / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(t) * radius, cy + Math.sin(t) * radius);
        ctx.stroke();
        ctx.fillStyle = k === 9 ? 'rgba(120,240,220,0.7)' : p.structure;
        ctx.fillRect(cx + Math.cos(t) * radius - 4, cy + Math.sin(t) * radius, 8, 7);
      }
    },
    sunkenhorses(a, r) {
      // Des têtes de chevaux de bois qui dépassent de l'eau (fond), immobiles.
      const { ctx } = a;
      for (let x = r.x + 6; x < r.x + r.w - 6; x += 3 * T) {
        const dir = hash(x, r.y) > 0.5 ? 1 : -1;
        horse(ctx, x, r.y + r.h - 2 + hash(r.y, x) * 3, dir);
      }
    },
    bigtop(a, r) {
      // Le bord du grand chapiteau, tout en haut (plein) : une toile festonnée.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      scallops(ctx, r.x, r.x + r.w, r.y + r.h, p.structure);
      ctx.fillStyle = FADED_STRIPE;
      for (let x = r.x; x < r.x + r.w; x += 16) {
        ctx.beginPath();
        ctx.arc(x + 4, r.y + r.h, 3, 0, Math.PI);
        ctx.fill();
      }
    },
  };
}
