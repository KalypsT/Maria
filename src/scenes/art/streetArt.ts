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
/** Fenêtre allumée au crépuscule (D-77). */
const LIT = '#ffd98a';
const LIT_DARK = '#f2b866';

/** Une maison de la rangée : position, hauteur du toit, fenêtres, cheminée éventuelle. */
export interface House {
  readonly x: number;
  readonly w: number;
  readonly top: number;
  readonly i: number;
  readonly windows: readonly { x: number; y: number; w: number; h: number; lit: boolean }[];
  /** Haut de la cheminée (px logiques), une maison sur deux environ. */
  readonly chimney: { x: number; y: number } | null;
}

/**
 * Rangée de maisons mitoyennes d'un élément `houses` (pseudo-hasard stable) : partagée par le
 * dessin, la lumière (fenêtres allumées au crépuscule) et la fumée des cheminées (D-77).
 */
export function houseLayout(r: Rect): House[] {
  const houses: House[] = [];
  let x = r.x;
  let i = Math.floor(hash(r.x, r.y) * FACADES.length);
  while (x < r.x + r.w - 2) {
    const w = Math.min(r.x + r.w - x, (6 + Math.floor(hash(x, 3) * 4)) * T);
    const top = r.y + Math.floor(hash(x, 5) * 4) * T;
    const windows: { x: number; y: number; w: number; h: number; lit: boolean }[] = [];
    for (let wy = top + 3 * T; wy < r.y + r.h - 4 * T; wy += 4 * T) {
      for (let wx = x + T; wx < x + w - 2 * T; wx += 3 * T) {
        windows.push({ x: wx, y: wy, w: 1.4 * T, h: 1.8 * T, lit: hash(wx, wy) > 0.72 });
      }
    }
    const chimney =
      w >= 6 * T && hash(x, 9) > 0.4
        ? { x: x + w * (0.25 + hash(x, 11) * 0.5), y: top - 10 }
        : null;
    houses.push({ x, w, top, i, windows, chimney });
    x += w;
    i++;
  }
  return houses;
}

/** Fenêtre à volets (maisons, école). */
function window(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lit = false,
): void {
  ctx.fillStyle = STONE_DARK;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 3);
  ctx.fillStyle = lit ? LIT : GLASS;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = lit ? LIT_DARK : GLASS_DARK;
  ctx.fillRect(x, y + h / 2, w, h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(x + w / 2 - 0.5, y, 1, h);
  ctx.fillRect(x, y + h / 2 - 0.5, w, 1);
}

/** Petit rebord de pierre (sous le chat). */
function ledgeDraw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.fillStyle = STONE_DARK;
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = STONE;
  ctx.fillRect(x, y, w, 1.2);
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
      const { ctx, palette: p } = a;
      // Maisons de ville mitoyennes, de largeurs variées : façade, toit, cheminée, fenêtres (au
      // crépuscule, quelques-unes allumées, D-77), porte.
      const dusk = p.darkness > 0;
      for (const house of houseLayout(r)) {
        const { x, w, top, i } = house;
        ctx.fillStyle = FACADES[i % FACADES.length] ?? FACADES[0];
        ctx.fillRect(x, top + 2 * T, w, r.y + r.h - top - 2 * T);
        if (house.chimney) {
          ctx.fillStyle = '#9a5a46';
          ctx.fillRect(house.chimney.x - 4, house.chimney.y, 8, top + T - house.chimney.y);
          ctx.fillStyle = '#7a4536';
          ctx.fillRect(house.chimney.x - 5, house.chimney.y - 2, 10, 3);
        }
        ctx.fillStyle = ROOF;
        ctx.beginPath();
        ctx.moveTo(x - 2, top + 2 * T);
        ctx.lineTo(x + 6, top);
        ctx.lineTo(x + w - 6, top);
        ctx.lineTo(x + w + 2, top + 2 * T);
        ctx.fill();
        ctx.fillStyle = ROOF_DARK;
        ctx.fillRect(x - 2, top + 2 * T - 2, w + 4, 2);
        for (const pane of house.windows) {
          window(ctx, pane.x, pane.y, pane.w, pane.h, dusk && pane.lit);
        }
        const doorX = x + w / 2 - T * 0.7;
        ctx.fillStyle = ['#6d86c2', '#8a5a44', '#5d9152'][i % 3] ?? '#8a5a44';
        ctx.fillRect(doorX, r.y + r.h - 2.4 * T, 1.4 * T, 2.4 * T);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + w - 1, top + 2 * T, 1, r.y + r.h - top - 2 * T);
      }
    },
    planetree(a, r) {
      const { ctx, palette: p } = a;
      // Platane, devant les façades (D-77 : avant, caché derrière elles) : tronc clair tacheté,
      // couronne en haut de la salle, une branche vers le nid, des touffes autour.
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#b7a58c';
      ctx.fillRect(cx - 6, r.y, 12, r.h);
      for (let y = r.y + 8; y < r.y + r.h; y += 11) {
        ctx.fillStyle = hash(cx, y) > 0.5 ? '#d8cdb2' : '#9c8b72';
        ctx.beginPath();
        ctx.ellipse(cx - 3 + hash(y, cx) * 6, y, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Deux branches qui montent vers la couronne.
      ctx.strokeStyle = '#a8977e';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, r.y + 7 * T);
      ctx.lineTo(cx - 3.5 * T, r.y + 2 * T);
      ctx.moveTo(cx, r.y + 6 * T);
      ctx.lineTo(cx + 3.5 * T, r.y + 2 * T);
      ctx.stroke();
      // Une couronne pleine : des touffes serrées sur une ellipse, trois tons, plus claires en haut.
      const crown = { x: cx, y: r.y + 2.6 * T, rx: 6.5 * T, ry: 3 * T };
      for (const [tone, alpha] of [
        [p.leafDark, 1],
        [p.leaf, 1],
        [p.leafLight, 0.7],
      ] as const) {
        ctx.fillStyle = tone;
        ctx.globalAlpha = alpha;
        for (let k = 0; k < 22; k++) {
          const t = (k / 22) * Math.PI * 2;
          const d = 0.35 + 0.6 * hash(k, cx);
          const lift = tone === p.leafLight ? -6 : tone === p.leaf ? -2 : 3;
          const x = crown.x + Math.cos(t) * crown.rx * d;
          const y = crown.y + Math.sin(t) * crown.ry * d + lift;
          const radius = (tone === p.leafLight ? 7 : 13) + hash(cx, k) * 7;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
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
      // Grille verte, et son portillon ouvert au milieu (porte de façade, D-61) : un battant
      // poussé vers l'intérieur, le sol souple de l'aire de jeux derrière.
      const gate = r.x + 12 * T;
      ctx.fillStyle = '#4f7a4a';
      ctx.fillRect(r.x, ground - 4 * T, gate - r.x, 3);
      ctx.fillRect(gate + 4 * T, ground - 4 * T, r.x + r.w - gate - 4 * T, 3);
      for (let x = r.x + 2; x < r.x + r.w; x += 6) {
        if (x < gate - 2 || x > gate + 4 * T + 2) {
          ctx.fillRect(x, ground - 4 * T, 1.5, 4 * T);
        }
      }
      ctx.fillStyle = '#c98a6b';
      ctx.fillRect(gate, ground - 6, 4 * T, 6);
      ctx.fillStyle = '#3f6b3d';
      ctx.fillRect(gate - 3, ground - 5 * T, 3, 5 * T);
      ctx.fillRect(gate + 4 * T, ground - 5 * T, 3, 5 * T);
      ctx.fillRect(gate, ground - 5 * T, 4 * T + 3, 2.5);
      ctx.fillStyle = '#4f7a4a';
      ctx.beginPath();
      ctx.moveTo(gate, ground - 4 * T);
      ctx.lineTo(gate + 1.4 * T, ground - 3.4 * T);
      ctx.lineTo(gate + 1.4 * T, ground - 0.6 * T);
      ctx.lineTo(gate, ground);
      ctx.fill();
    },
    school(a, r) {
      const { ctx } = a;
      // L'école : grand bâtiment clair dont la façade s'arrête à la corniche (D-77 : on marche au
      // pied du toit) ; le toit de tuiles au-dessus, une lucarne et son horloge, rangées de fenêtres.
      const eave = r.y + 5 * T;
      ctx.fillStyle = ROOF;
      ctx.beginPath();
      ctx.moveTo(r.x + T, eave);
      ctx.lineTo(r.x + 3 * T, eave - 3 * T);
      ctx.lineTo(r.x + r.w - 3 * T, eave - 3 * T);
      ctx.lineTo(r.x + r.w - T, eave);
      ctx.fill();
      ctx.fillStyle = ROOF_DARK;
      for (let y = eave - 3 * T + 6; y < eave; y += 7) {
        ctx.fillRect(r.x + 2 * T, y, r.w - 4 * T, 1);
      }
      // Lucarne de l'horloge, au milieu du toit.
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#efe4cc';
      ctx.fillRect(cx - 1.4 * T, eave - 4 * T, 2.8 * T, 3 * T);
      ctx.fillStyle = ROOF;
      ctx.beginPath();
      ctx.moveTo(cx - 1.9 * T, eave - 4 * T);
      ctx.lineTo(cx, eave - 5 * T);
      ctx.lineTo(cx + 1.9 * T, eave - 4 * T);
      ctx.fill();
      ctx.fillStyle = '#fff8e6';
      ctx.beginPath();
      ctx.arc(cx, eave - 2.5 * T, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, eave - 2.5 * T);
      ctx.lineTo(cx, eave - 2.5 * T - 5);
      ctx.moveTo(cx, eave - 2.5 * T);
      ctx.lineTo(cx + 3.5, eave - 2.5 * T);
      ctx.stroke();
      rounded(ctx, { x: r.x, y: eave, w: r.w, h: r.y + r.h - eave }, 2);
      ctx.fillStyle = '#efe4cc';
      ctx.fill();
      ctx.fillStyle = STONE;
      ctx.fillRect(r.x, r.y + r.h - 2 * T, r.w, 2 * T);
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
      // La lanterne est juste sous le chapeau (D-77 : avant, le chapeau flottait au-dessus).
      const cx = r.x + r.w / 2;
      ctx.fillStyle = METAL;
      ctx.fillRect(cx - 1.5, r.y + 11, 3, r.h - 11);
      ctx.fillRect(cx - 4, r.y + r.h - 3, 8, 3);
      ctx.fillStyle = a.palette.darkness > 0 ? '#ffe9a8' : '#fff1b8';
      ctx.beginPath();
      ctx.moveTo(cx - 6, r.y + 4);
      ctx.lineTo(cx + 6, r.y + 4);
      ctx.lineTo(cx + 3, r.y + 11);
      ctx.lineTo(cx - 3, r.y + 11);
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
      // Enseigne : un panneau fixé à la façade (son dessus est la planche), un panier dessiné,
      // pas de texte (pilier 6). D-77 : avant, une planche posée sur le mur, sans attache.
      ctx.fillStyle = '#3f6a3c';
      rounded(ctx, { x: r.x + 1, y: r.y + 2, w: r.w - 2, h: T + 8 }, [0, 0, 3, 3]);
      ctx.fill();
      ctx.fillStyle = METAL;
      for (const x of [r.x + 4, r.x + r.w - 6]) {
        ctx.fillRect(x, r.y + T + 4, 2, 2);
      }
      ledge(a, r, '#4f7a4a', '#8cc26f');
      ctx.strokeStyle = '#fff6f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + 10, 4, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#fff6f0';
      ctx.fillRect(r.x + r.w / 2 - 5, r.y + 10, 10, 5);
    },
    washline(a, r) {
      // Fil à linge tendu d'une fenêtre à l'autre, deux poulies ; le linge est animé au vent.
      const { ctx } = a;
      ctx.strokeStyle = '#8a7b6c';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + 2);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + 7, r.x + r.w, r.y + 2);
      ctx.stroke();
      ctx.fillStyle = METAL;
      for (const x of [r.x, r.x + r.w]) {
        ctx.beginPath();
        ctx.arc(x, r.y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    flag(a, r) {
      // Le mât du drapeau, planté dans le toit ; le drapeau flotte (animé).
      const { ctx } = a;
      ctx.fillStyle = METAL;
      ctx.fillRect(r.x + 1, r.y, 1.5, r.h);
      ctx.beginPath();
      ctx.arc(r.x + 1.75, r.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    },
    cat(a, r) {
      // Chat roux du voisinage, assis sur un rebord de fenêtre (pas celui de la famille, gris).
      const { ctx } = a;
      const base = r.y + r.h;
      ledgeDraw(ctx, r.x - 2, base - 3, r.w + 4);
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#d98a4a';
      ctx.beginPath();
      ctx.ellipse(cx, base - 9, 6, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 1, base - 17, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 2.5, base - 20);
      ctx.lineTo(cx - 1.5, base - 24);
      ctx.lineTo(cx + 0.5, base - 20.5);
      ctx.moveTo(cx + 2, base - 20.5);
      ctx.lineTo(cx + 4, base - 24);
      ctx.lineTo(cx + 5, base - 19.5);
      ctx.fill();
      ctx.fillStyle = '#b86a33';
      ctx.fillRect(cx - 4, base - 11, 8, 1.2);
      ctx.fillRect(cx - 3.5, base - 7, 7, 1.2);
      ctx.fillStyle = '#3a3330';
      ctx.fillRect(cx - 0.5, base - 18, 1, 1);
      ctx.fillRect(cx + 2.5, base - 18, 1, 1);
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
            // Une lisse sous la planche, d'un montant à l'autre : elle repose dessus (D-77).
            const bay = Math.floor((start * T - r.x - 2) / (7 * T));
            const x0 = r.x + 2 + bay * 7 * T;
            ctx.fillStyle = '#8a9aa5';
            ctx.fillRect(x0, row * T + 4, Math.min(7 * T, r.x + r.w - x0), 2);
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
