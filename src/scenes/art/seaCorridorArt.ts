import { TILE_SIZE as T } from '../../config/display';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';
import { solidOutline } from './stationArt';

/**
 * Le couloir en boucle (D-105), la fin de la station balnéaire, en silhouettes comme les mondes
 * étranges, PLACEHOLDER : le couloir du centre la nuit, qui revient sur lui-même et change à chaque
 * tour (du sable ; le papier peint de sa chambre et la toise ; l'horloge de la gare et des valises ;
 * la mer en bas, le ciel à l'envers) ; au dernier, une porte qui n'était pas là. Ce qui vient d'un
 * autre lieu garde un peu de sa couleur, passée.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const SAND = 'rgba(230, 205, 150, 0.55)';
const SAND_LIGHT = 'rgba(245, 225, 180, 0.6)';
/** Le papier peint de la chambre de Céleste : de petits pois roses sur un fond pâle (passé). */
const PAPER = 'rgba(250, 225, 235, 0.14)';
const PAPER_DOT = 'rgba(255, 160, 200, 0.4)';
const SEA = 'rgba(70, 150, 190, 0.55)';
const SEA_LIGHT = 'rgba(160, 235, 230, 0.7)';
const SKY = 'rgba(150, 175, 235, 0.6)';
const CLOUD = 'rgba(250, 245, 255, 0.75)';
const GLOW = 'rgba(120, 240, 220, 0.75)';

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 23.1 + y * 77.7) * 43758.5453;
  return n - Math.floor(n);
}

export function seaCorridorDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
  return {
    corridordoors(a, r) {
      // Les portes des chambres, le long du mur, toutes fermées ; une veilleuse entre chacune.
      const { ctx, palette: p } = a;
      for (let x = r.x + 2 * T; x + 3 * T < r.x + r.w; x += 9 * T) {
        ctx.fillStyle = p.structure;
        ctx.fillRect(x, r.y + r.h - 5 * T, 3 * T, 5 * T);
        ctx.strokeStyle = p.rim;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, r.y + r.h - 5 * T + 0.5, 3 * T - 1, 5 * T - 1);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = p.rim;
        ctx.beginPath();
        ctx.arc(x + 3 * T - 6, r.y + r.h - 2.5 * T, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // La veilleuse, une petite lueur rose au ras du sol.
        ctx.fillStyle = 'rgba(255, 170, 210, 0.7)';
        ctx.beginPath();
        ctx.arc(x + 6 * T, r.y + r.h - 8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    },
    sanddrift(a, r) {
      // Du sable, entré on ne sait d'où : des dunes basses le long du couloir, plus hautes contre
      // les murs.
      const { ctx } = a;
      const floor = r.y + r.h;
      ctx.fillStyle = SAND;
      ctx.beginPath();
      ctx.moveTo(r.x, floor);
      for (let x = r.x; x <= r.x + r.w; x += 8) {
        const edge = Math.min(x - r.x, r.x + r.w - x) / r.w;
        const h = 4 + Math.sin(x * 0.07) * 3 + hash(x, 1) * 2 + Math.max(0, 0.15 - edge) * 90;
        ctx.lineTo(x, floor - Math.min(r.h, h));
      }
      ctx.lineTo(r.x + r.w, floor);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = SAND_LIGHT;
      for (let k = 0; k < r.w / 12; k++) {
        ctx.fillRect(r.x + hash(k, 2) * r.w, floor - 2 - hash(k, 3) * 4, 2, 1);
      }
    },
    bedroomwallpaper(a, r) {
      // Le papier peint de la chambre de Céleste, ici : de petits pois roses en quinconce.
      const { ctx } = a;
      ctx.fillStyle = PAPER;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = PAPER_DOT;
      for (let y = r.y + 6; y < r.y + r.h; y += 12) {
        const shift = ((y - r.y) / 12) % 2 === 0 ? 0 : 6;
        for (let x = r.x + 6 + shift; x < r.x + r.w; x += 12) {
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    heightmark(a, r) {
      // La toise de sa chambre (D-43), fixée au mur du couloir : une règle en bois et trois traits,
      // les trois tailles de Céleste.
      const { ctx } = a;
      ctx.fillStyle = 'rgba(225, 190, 140, 0.6)';
      ctx.fillRect(r.x + r.w / 2 - 4, r.y, 8, r.h);
      ctx.fillStyle = 'rgba(90, 60, 40, 0.6)';
      for (let y = r.y + 4; y < r.y + r.h; y += 6) {
        ctx.fillRect(r.x + r.w / 2 - 4, y, (y - r.y) % 24 === 4 ? 6 : 3, 1);
      }
      ctx.fillStyle = 'rgba(255, 110, 160, 0.85)';
      for (const k of [0.75, 0.6, 0.48]) {
        ctx.fillRect(r.x + r.w / 2 - 7, r.y + r.h * k, 14, 1.5);
      }
    },
    corridorsuitcases(a, r) {
      // Des valises posées dans le couloir (fond), comme au bureau des objets trouvés.
      const { ctx, palette: p } = a;
      let y = r.y + r.h;
      let k = 0;
      while (y > r.y + 6) {
        const w = Math.min(r.w, (2 + hash(k, 4) * 2) * T);
        const h = 8 + hash(k, 5) * 6;
        const x = r.x + hash(k, 6) * (r.w - w);
        ctx.fillStyle = k % 2 === 0 ? 'rgba(150, 90, 70, 0.55)' : 'rgba(90, 110, 150, 0.55)';
        ctx.beginPath();
        ctx.roundRect(x, y - h, w, h, 2);
        ctx.fill();
        ctx.strokeStyle = p.rim;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + w / 2 - 3, y - h - 3, 6, 3);
        ctx.globalAlpha = 1;
        y -= h;
        k++;
      }
    },
    seabelow(a, r) {
      // Le sol devenu une vitre (plein) : en dessous, la mer, ses vagues et leur écume.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.structure, p.structure);
      ctx.fillStyle = SEA;
      ctx.fillRect(r.x, r.y + 2, r.w, r.h - 2);
      ctx.strokeStyle = SEA_LIGHT;
      ctx.lineWidth = 1;
      for (let y = r.y + 6; y < r.y + r.h; y += 7) {
        ctx.beginPath();
        for (let x = r.x; x <= r.x + r.w; x += 6) {
          const yy = y + Math.sin(x * 0.2 + y) * 1.5;
          if (x === r.x) {
            ctx.moveTo(x, yy);
          } else {
            ctx.lineTo(x, yy);
          }
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(r.x, r.y, r.w, 2);
      solidOutline(a, r, p.rim, 0.7);
    },
    skyreversed(a, r) {
      // Le plafond devenu un ciel à l'envers : le bleu en bas, des nuages qui pendent, la lune.
      const { ctx } = a;
      const grad = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      grad.addColorStop(0, 'rgba(60, 50, 120, 0.5)');
      grad.addColorStop(1, SKY);
      ctx.fillStyle = grad;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = CLOUD;
      for (let x = r.x + 3 * T; x < r.x + r.w - 3 * T; x += 11 * T) {
        const cy = r.y + 6 + hash(x, 7) * 6;
        for (const [dx, rr] of [
          [0, 6],
          [7, 8],
          [15, 6],
        ] as const) {
          ctx.beginPath();
          ctx.arc(x + dx, cy, rr, 0, Math.PI);
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(255, 240, 210, 0.7)';
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.7, r.y + r.h - 8, 5, 0, Math.PI * 2);
      ctx.fill();
    },
    strangedoor(a, r) {
      // La porte qui n'était pas là : sombre, entrouverte ; la lueur turquoise passe par ses bords.
      const { ctx, palette: p } = a;
      const glow = ctx.createRadialGradient(
        r.x + r.w / 2,
        r.y + r.h / 2,
        2,
        r.x + r.w / 2,
        r.y + r.h / 2,
        r.h,
      );
      glow.addColorStop(0, 'rgba(120, 240, 220, 0.35)');
      glow.addColorStop(1, 'rgba(120, 240, 220, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(r.x - r.h, r.y - r.h / 2, r.w + 2 * r.h, r.h * 2);
      ctx.fillStyle = p.structure;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = GLOW;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 0.75);
      ctx.fillStyle = GLOW;
      ctx.fillRect(r.x + r.w - 3, r.y + 2, 2, r.h - 2);
    },
  };
}
