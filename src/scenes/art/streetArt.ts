import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ArtContext, Rect } from './roomArt';
import type { ShapeTools } from './gardenArt';

/**
 * La rue du quartier (D-60), dessinée par le code en aplats doux, comme le jardin. PLACEHOLDER :
 * formes simples, pas d'image clé. Les meubles (voitures, poubelles, rebords, store, échafaudage)
 * suivent exactement leurs tuiles ; les façades et les lieux sont du fond, sans collision.
 */

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 91.7 + y * 237.3) * 43758.5453;
  return n - Math.floor(n);
}

type Drawer = (a: ArtContext, r: Rect) => void;

const FACADES = ['#f1e3c8', '#f3d5cf', '#e9d9a8', '#dfe6d2', '#f0ddc2'] as const;
const ROOF = '#b5634f';
const ROOF_DARK = '#8f4a3c';
const GLASS = '#bcdcee';
const GLASS_DARK = '#8fb6cf';
const STONE = '#d9ccb4';
const STONE_DARK = '#b8a98f';
const METAL = '#6f7f8a';
const INK = '#5b4a44';

/** Fenêtre à volets (maisons, école). */
function window(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = STONE_DARK;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 3);
  ctx.fillStyle = GLASS;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = GLASS_DARK;
  ctx.fillRect(x, y + h / 2, w, h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(x + w / 2 - 0.5, y, 1, h);
  ctx.fillRect(x, y + h / 2 - 0.5, w, 1);
}

/** Porte fermée (un lieu pour plus tard) : bois, poignée, marche. */
function closedDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = STONE_DARK;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, [w / 2, w / 2, 0, 0]);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x + w / 2 - 0.5, y + 4, 1, h - 4);
  ctx.fillStyle = '#e6c27a';
  ctx.beginPath();
  ctx.arc(x + w / 2 - 3, y + h * 0.55, 1.4, 0, Math.PI * 2);
  ctx.arc(x + w / 2 + 3, y + h * 0.55, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

export function streetDrawers({ tileShape, rounded }: ShapeTools): Record<string, Drawer> {
  /** Planches d'un meuble traversable (rebords, corniches) : aplat et rehaut clair. */
  const ledge = (a: ArtContext, r: Rect, fill: string, light: string) => {
    tileShape(a, r, fill, light);
  };

  return {
    houses(a, r) {
      const { ctx } = a;
      // Maisons de ville mitoyennes, de largeurs variées : façade, toit, fenêtres, porte.
      let x = r.x;
      let i = Math.floor(hash(r.x, r.y) * FACADES.length);
      while (x < r.x + r.w - 2) {
        const w = Math.min(r.x + r.w - x, (6 + Math.floor(hash(x, 3) * 4)) * T);
        const top = r.y + Math.floor(hash(x, 5) * 4) * T;
        ctx.fillStyle = FACADES[i % FACADES.length] ?? FACADES[0];
        ctx.fillRect(x, top + 2 * T, w, r.y + r.h - top - 2 * T);
        ctx.fillStyle = ROOF;
        ctx.beginPath();
        ctx.moveTo(x - 2, top + 2 * T);
        ctx.lineTo(x + 6, top);
        ctx.lineTo(x + w - 6, top);
        ctx.lineTo(x + w + 2, top + 2 * T);
        ctx.fill();
        ctx.fillStyle = ROOF_DARK;
        ctx.fillRect(x - 2, top + 2 * T - 2, w + 4, 2);
        for (let wy = top + 3 * T; wy < r.y + r.h - 4 * T; wy += 4 * T) {
          for (let wx = x + T; wx < x + w - 2 * T; wx += 3 * T) {
            window(ctx, wx, wy, 1.4 * T, 1.8 * T);
          }
        }
        const doorX = x + w / 2 - T * 0.7;
        ctx.fillStyle = ['#6d86c2', '#8a5a44', '#5d9152'][i % 3] ?? '#8a5a44';
        ctx.fillRect(doorX, r.y + r.h - 2.4 * T, 1.4 * T, 2.4 * T);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + w - 1, top + 2 * T, 1, r.y + r.h - top - 2 * T);
        x += w;
        i++;
      }
    },
    planetree(a, r) {
      const { ctx, palette: p } = a;
      // Platane : tronc clair tacheté, qui monte jusqu'aux feuilles du haut de la salle.
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#b7a58c';
      ctx.fillRect(cx - 6, r.y, 12, r.h);
      for (let y = r.y + 8; y < r.y + r.h; y += 11) {
        ctx.fillStyle = hash(cx, y) > 0.5 ? '#d8cdb2' : '#9c8b72';
        ctx.beginPath();
        ctx.ellipse(cx - 3 + hash(y, cx) * 6, y, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p.leaf;
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.arc(cx - 26 + k * 9, r.y + 10 + hash(k, cx) * 10, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      // Grille au pied de l'arbre.
      ctx.fillStyle = METAL;
      ctx.fillRect(cx - 14, r.y + r.h - 2, 28, 2);
    },
    playground(a, r) {
      const { ctx } = a;
      const ground = r.y + r.h;
      // Derrière la grille : toboggan, balançoire, tourniquet.
      ctx.fillStyle = '#e8c86a';
      ctx.beginPath();
      ctx.moveTo(r.x + 3 * T, ground);
      ctx.lineTo(r.x + 3 * T, ground - 7 * T);
      ctx.lineTo(r.x + 4.5 * T, ground - 7 * T);
      ctx.lineTo(r.x + 9 * T, ground);
      ctx.fill();
      ctx.strokeStyle = '#d0674f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(r.x + 2.5 * T, ground);
      ctx.lineTo(r.x + 2.5 * T, ground - 8 * T);
      ctx.moveTo(r.x + 18 * T, ground);
      ctx.lineTo(r.x + 20 * T, ground - 8 * T);
      ctx.lineTo(r.x + 22 * T, ground);
      ctx.moveTo(r.x + 19 * T, ground - 8 * T);
      ctx.lineTo(r.x + 26 * T, ground - 8 * T);
      ctx.moveTo(r.x + 26 * T, ground - 8 * T);
      ctx.lineTo(r.x + 24.5 * T, ground);
      ctx.moveTo(r.x + 26 * T, ground - 8 * T);
      ctx.lineTo(r.x + 27.5 * T, ground);
      ctx.stroke();
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 22 * T, ground - 8 * T);
      ctx.lineTo(r.x + 22 * T, ground - 3 * T);
      ctx.moveTo(r.x + 24 * T, ground - 8 * T);
      ctx.lineTo(r.x + 24 * T, ground - 3 * T);
      ctx.stroke();
      ctx.fillStyle = '#6d86c2';
      ctx.fillRect(r.x + 21.5 * T, ground - 3 * T, 3 * T, 4);
      // Grille verte, et son portillon (fermé par une chaîne) au milieu.
      ctx.fillStyle = '#4f7a4a';
      ctx.fillRect(r.x, ground - 4 * T, r.w, 3);
      for (let x = r.x + 2; x < r.x + r.w; x += 6) {
        ctx.fillRect(x, ground - 4 * T, 1.5, 4 * T);
      }
      const gate = r.x + 12 * T;
      ctx.fillStyle = '#3f6b3d';
      ctx.fillRect(gate - 3, ground - 5 * T, 3, 5 * T);
      ctx.fillRect(gate + 4 * T, ground - 5 * T, 3, 5 * T);
      ctx.fillStyle = '#c9c3b8';
      ctx.beginPath();
      ctx.arc(gate + 2 * T, ground - 2.6 * T, 3, 0, Math.PI * 2);
      ctx.fill();
    },
    school(a, r) {
      const { ctx } = a;
      // L'école : grand bâtiment clair, rangées de fenêtres, fronton avec horloge, drapeau.
      rounded(ctx, { x: r.x, y: r.y + 2 * T, w: r.w, h: r.h - 2 * T }, 2);
      ctx.fillStyle = '#efe4cc';
      ctx.fill();
      ctx.fillStyle = STONE;
      ctx.fillRect(r.x, r.y + r.h - 2 * T, r.w, 2 * T);
      ctx.fillStyle = ROOF;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 6 * T, r.y + 2 * T);
      ctx.lineTo(r.x + r.w / 2, r.y);
      ctx.lineTo(r.x + r.w / 2 + 6 * T, r.y + 2 * T);
      ctx.fill();
      ctx.fillStyle = '#fff8e6';
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + 1.3 * T, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2, r.y + 1.3 * T);
      ctx.lineTo(r.x + r.w / 2, r.y + 1.3 * T - 5);
      ctx.moveTo(r.x + r.w / 2, r.y + 1.3 * T);
      ctx.lineTo(r.x + r.w / 2 + 3.5, r.y + 1.3 * T);
      ctx.stroke();
      for (let wy = r.y + 7 * T; wy < r.y + r.h - 5 * T; wy += 4 * T) {
        for (let wx = r.x + 2 * T; wx < r.x + r.w - 2 * T; wx += 4 * T) {
          window(ctx, wx, wy, 2 * T, 2.4 * T);
        }
      }
      closedDoor(ctx, r.x + r.w / 2 - 2 * T, r.y + r.h - 4 * T, 4 * T, 4 * T, '#6d86c2');
      // Petits dessins d'enfants collés aux vitres du rez-de-chaussée.
      for (const [dx, color] of [
        [4, '#f2c14e'],
        [8, '#e38aa0'],
        [27, '#8cc26f'],
        [31, '#6d86c2'],
      ] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(r.x + dx * T, r.y + r.h - 3 * T, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    shop(a, r) {
      const { ctx } = a;
      // La supérette du coin : façade, vitrine, rideau de fer baissé sur la porte (fermée).
      ctx.fillStyle = '#e4e0d4';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#4f7a4a';
      ctx.fillRect(r.x, r.y + 3 * T, r.w, 1.5 * T);
      window(ctx, r.x + 2 * T, r.y + 5.5 * T, 3 * T, 2.5 * T);
      window(ctx, r.x + r.w - 5 * T, r.y + 5.5 * T, 3 * T, 2.5 * T);
      // Vitrine : fruits et légumes derrière la vitre.
      ctx.fillStyle = GLASS;
      ctx.fillRect(r.x + T, r.y + r.h - 5 * T, 6 * T, 4 * T);
      for (let k = 0; k < 9; k++) {
        ctx.fillStyle = ['#e2574c', '#f2c14e', '#8cc26f'][k % 3] ?? '#8cc26f';
        ctx.beginPath();
        ctx.arc(r.x + 1.8 * T + k * 9, r.y + r.h - 1.6 * T, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      const doorX = r.x + r.w / 2 - 2 * T;
      ctx.fillStyle = '#a8b0b6';
      ctx.fillRect(doorX, r.y + r.h - 4 * T, 4 * T, 4 * T);
      ctx.fillStyle = '#8c959c';
      for (let y = r.y + r.h - 4 * T + 3; y < r.y + r.h; y += 4) {
        ctx.fillRect(doorX, y, 4 * T, 1);
      }
      ctx.fillStyle = GLASS;
      ctx.fillRect(r.x + r.w - 7 * T, r.y + r.h - 5 * T, 6 * T, 4 * T);
    },
    site(a, r) {
      const { ctx } = a;
      const ground = r.y + r.h;
      // Le chantier : une grue au fond, puis la palissade peinte et sa porte (fermée).
      ctx.strokeStyle = '#e8b23a';
      ctx.lineWidth = 2;
      const mast = r.x + r.w - 6 * T;
      ctx.beginPath();
      ctx.moveTo(mast, ground);
      ctx.lineTo(mast, r.y + T);
      ctx.moveTo(mast + T, ground);
      ctx.lineTo(mast + T, r.y + T);
      ctx.moveTo(mast - 22 * T, r.y + T);
      ctx.lineTo(mast + 5 * T, r.y + T);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = r.y + T; y < ground; y += T) {
        ctx.moveTo(mast, y);
        ctx.lineTo(mast + T, y + T);
      }
      ctx.moveTo(mast - 16 * T, r.y + T);
      ctx.lineTo(mast - 16 * T, r.y + 6 * T);
      ctx.stroke();
      ctx.fillStyle = METAL;
      ctx.fillRect(mast - 16 * T - 4, r.y + 6 * T, 8, 5);
      const top = ground - 5 * T;
      for (let x = r.x; x < r.x + r.w; x += 2 * T) {
        ctx.fillStyle = hash(x, 1) > 0.5 ? '#c8a878' : '#b99a6c';
        ctx.fillRect(x, top, 2 * T - 1, 5 * T);
      }
      ctx.fillStyle = '#e8b23a';
      ctx.fillRect(r.x, top + T, r.w, 5);
      ctx.fillStyle = INK;
      for (let x = r.x + 4; x < r.x + r.w; x += 12) {
        ctx.fillRect(x, top + T, 5, 5);
      }
      closedDoor(ctx, r.x + 8 * T, ground - 4 * T, 4 * T, 4 * T, '#9a7352');
    },
    bins(a, r) {
      const { ctx } = a;
      // Poubelles à roulettes, couvercles un peu de travers.
      tileShape(a, r, '#5f8a5a', '#7fa877');
      for (let x = r.x; x < r.x + r.w; x += T) {
        ctx.fillStyle = '#3f6b3d';
        ctx.fillRect(x + 1, r.y - 1, T - 2, 3);
        ctx.fillStyle = '#2c2a2a';
        ctx.beginPath();
        ctx.arc(x + 4, r.y + r.h - 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    car(a, r) {
      const { ctx } = a;
      // Petite voiture garée : carrosserie arrondie, vitres, roues (exactement sur ses tuiles).
      const body = '#d98b4f';
      rounded(ctx, { x: r.x, y: r.y + T * 0.9, w: r.w, h: r.h - T * 1.4 }, [6, 6, 3, 3]);
      ctx.fillStyle = body;
      ctx.fill();
      rounded(ctx, { x: r.x + T * 1.4, y: r.y, w: r.w - T * 2.8, h: T * 1.2 }, [6, 6, 0, 0]);
      ctx.fill();
      ctx.fillStyle = GLASS;
      ctx.fillRect(r.x + T * 1.9, r.y + 3, r.w / 2 - T * 2.2, T * 0.8);
      ctx.fillRect(r.x + r.w / 2 + 2, r.y + 3, r.w / 2 - T * 2.2, T * 0.8);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(r.x + 2, r.y + T * 1.2, r.w - 4, 2);
      ctx.fillStyle = '#2c2a2a';
      for (const wx of [r.x + T * 1.6, r.x + r.w - T * 1.6]) {
        ctx.beginPath();
        ctx.arc(wx, r.y + r.h - 5, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#c9c3b8';
      for (const wx of [r.x + T * 1.6, r.x + r.w - T * 1.6]) {
        ctx.beginPath();
        ctx.arc(wx, r.y + r.h - 5, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff1b8';
      ctx.fillRect(r.x + r.w - 3, r.y + T * 1.3, 3, 3);
    },
    lamppost(a, r) {
      const { ctx } = a;
      // Lampadaire : le chapeau (en haut) est la plateforme ; le mât descend jusqu'au trottoir.
      const cx = r.x + r.w / 2;
      ctx.fillStyle = METAL;
      ctx.fillRect(cx - 1.5, r.y + T, 3, r.h - T);
      ctx.fillRect(cx - 4, r.y + r.h - 3, 8, 3);
      ctx.fillStyle = '#fff1b8';
      ctx.beginPath();
      ctx.moveTo(cx - 5, r.y + T);
      ctx.lineTo(cx + 5, r.y + T);
      ctx.lineTo(cx + 3, r.y + T + 6);
      ctx.lineTo(cx - 3, r.y + T + 6);
      ctx.fill();
      ledge(a, { x: r.x, y: r.y, w: r.w, h: T }, '#4d5a63', '#8a9aa5');
    },
    busstop(a, r) {
      const { ctx } = a;
      // Abribus : toit (plateforme), vitre, banc, panneau.
      ctx.fillStyle = 'rgba(188,220,238,0.45)';
      ctx.fillRect(r.x + 4, r.y + T, r.w - 8, r.h - T - 6);
      ctx.fillStyle = METAL;
      ctx.fillRect(r.x + 2, r.y + T, 2, r.h - T);
      ctx.fillRect(r.x + r.w - 4, r.y + T, 2, r.h - T);
      ctx.fillStyle = '#8a6a50';
      ctx.fillRect(r.x + 3 * T, r.y + r.h - 1.2 * T, 3 * T, 3);
      ctx.fillStyle = '#6d86c2';
      ctx.beginPath();
      ctx.arc(r.x + r.w - 2 * T, r.y + 2 * T, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(r.x + r.w - 2 * T - 2.5, r.y + 2 * T - 1, 5, 2);
      ledge(a, { x: r.x, y: r.y, w: r.w, h: T }, '#5f8a5a', '#8cc26f');
    },
    crates(a, r) {
      const { ctx } = a;
      // Cagettes de fruits empilées.
      tileShape(a, r, '#c9a46b', '#e2c28e');
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (tileAt(a.level, col, row) !== Tile.Solid) {
            continue;
          }
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(col * T + 1, row * T + 5, T - 2, 1.5);
          ctx.fillRect(col * T + 1, row * T + 10, T - 2, 1.5);
          if (tileAt(a.level, col, row - 1) !== Tile.Solid) {
            ctx.fillStyle = ['#e2574c', '#f2c14e', '#8cc26f'][col % 3] ?? '#e2574c';
            for (let k = 0; k < 3; k++) {
              ctx.beginPath();
              ctx.arc(col * T + 3 + k * 5, row * T + 3, 2.4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    },
    sill(a, r) {
      const { ctx } = a;
      // Rebord de fenêtre en pierre, avec un pot de fleurs.
      ledge(a, r, STONE, '#f1e8d6');
      ctx.fillStyle = '#c96f4f';
      ctx.fillRect(r.x + r.w - 9, r.y - 5, 6, 5);
      ctx.fillStyle = '#e38aa0';
      ctx.beginPath();
      ctx.arc(r.x + r.w - 6, r.y - 7, 2.4, 0, Math.PI * 2);
      ctx.fill();
    },
    cornice(a, r) {
      ledge(a, r, STONE_DARK, STONE);
    },
    awning(a, r) {
      const { ctx } = a;
      // Store rayé de la supérette, et son lambrequin festonné.
      ledge(a, r, '#e2574c', '#f39a8f');
      ctx.fillStyle = '#fff6f0';
      for (let x = r.x + 4; x < r.x + r.w; x += 8) {
        ctx.fillRect(x, r.y + 3, 4, r.h - 3);
      }
      ctx.fillStyle = '#e2574c';
      for (let x = r.x + 3; x < r.x + r.w; x += 6) {
        ctx.beginPath();
        ctx.arc(x, r.y + r.h, 3, 0, Math.PI);
        ctx.fill();
      }
    },
    shopsign(a, r) {
      const { ctx } = a;
      // Enseigne suspendue : un panier dessiné, pas de texte (pilier 6).
      ledge(a, r, '#4f7a4a', '#8cc26f');
      ctx.strokeStyle = '#fff6f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + T + 6, 5, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#fff6f0';
      ctx.fillRect(r.x + r.w / 2 - 6, r.y + T + 6, 12, 5);
    },
    scaffold(a, r) {
      const { ctx, level } = a;
      // Échafaudage : montants, diagonales, puis les planches (exactement sur leurs tuiles).
      ctx.strokeStyle = '#8a9aa5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = r.x + 2; x < r.x + r.w; x += 7 * T) {
        ctx.moveTo(x, r.y);
        ctx.lineTo(x, r.y + r.h);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = r.y; y < r.y + r.h - 4 * T; y += 4 * T) {
        for (let x = r.x + 2; x < r.x + r.w - 7 * T; x += 7 * T) {
          ctx.moveTo(x, y + 4 * T);
          ctx.lineTo(x + 7 * T, y);
        }
      }
      ctx.stroke();
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        let start = -1;
        for (let col = r.x / T; col <= (r.x + r.w) / T; col++) {
          const plank = col < (r.x + r.w) / T && tileAt(level, col, row) === Tile.OneWay;
          if (plank && start < 0) {
            start = col;
          } else if (!plank && start >= 0) {
            ledge(
              a,
              { x: start * T, y: row * T, w: (col - start) * T, h: T },
              '#c9a46b',
              '#e2c28e',
            );
            start = -1;
          }
        }
      }
    },
  };
}
