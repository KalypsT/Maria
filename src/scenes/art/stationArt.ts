import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * La gare (D-66), dessinée par le code en aplats doux. PLACEHOLDER : formes simples. Ce qu'on
 * foule (quais, abris, passerelle, galerie, comptoir, étagères, wagons, crochets) suit exactement
 * ses tuiles ; façades, verrières, horloges, mâts et feux sont du fond.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const CONCRETE = '#b9b2a6';
const CONCRETE_LIGHT = '#d8d2c6';
const SAFETY = '#f1e7c4';
const METAL = '#5d6f78';
const METAL_LIGHT = '#8ea1aa';
const IRON = '#3f5a52';
const IRON_LIGHT = '#6b8a7e';
const BRICK = '#b5674f';
const BRICK_LIGHT = '#d08a6f';
const STONE = '#d9ccb2';
const STONE_DARK = '#b8a888';
const WOOD = '#9a7352';
const WOOD_LIGHT = '#c79d6f';
const WOOD_DARK = '#6e5038';
const GLASS = 'rgba(200,228,240,0.55)';
const AMBER = '#f2b84e';
const TEAL = '#5ee6d2';
const LOST_THINGS = ['#e2574c', '#f2c14e', '#6d86c2', '#8cc26f', '#b07ac9', '#e38aa0'] as const;

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 71.7 + y * 233.1) * 43758.5453;
  return n - Math.floor(n);
}

/** Ligne (tuiles) du premier sol plein sous (x px, ligne), ou la hauteur de la salle. */
function groundRow(a: ArtContext, x: number, row: number): number {
  const col = Math.floor(x / T);
  for (let r = Math.floor(row); r < a.level.height; r++) {
    if (tileAt(a.level, col, r) === Tile.Solid) {
      return r;
    }
  }
  return a.level.height;
}

/** Une tuile (col, ligne) couverte par un autre meuble que `self` (un abri sous la passerelle). */
function coveredByOther(a: ArtContext, self: Rect, col: number, row: number): boolean {
  return a.level.decor.some(
    (d) =>
      (d.col * T !== self.x || d.row * T !== self.y) &&
      col >= d.col &&
      col < d.col + d.width &&
      row >= d.row &&
      row < d.row + d.height &&
      d.kind !== 'canopyroof',
  );
}

/** Contour des tuiles pleines d'un rectangle, sur chaque côté qui donne sur le vide (D-81). */
export function solidOutline(a: ArtContext, r: Rect, stroke: string, alpha: number): void {
  const { ctx, level } = a;
  const solid = (col: number, row: number) => tileAt(level, col, row) === Tile.Solid;
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
    for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
      if (!solid(col, row)) {
        continue;
      }
      const x = col * T;
      const y = row * T;
      if (!solid(col - 1, row)) {
        ctx.moveTo(x + 0.6, y);
        ctx.lineTo(x + 0.6, y + T);
      }
      if (!solid(col + 1, row)) {
        ctx.moveTo(x + T - 0.6, y);
        ctx.lineTo(x + T - 0.6, y + T);
      }
      if (!solid(col, row + 1)) {
        ctx.moveTo(x, y + T - 0.6);
        ctx.lineTo(x + T, y + T - 0.6);
      }
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** La cheminée de l'atelier du dépôt (D-81) : son sommet, d'où sort la fumée. */
export function depotChimney(r: Rect): { x: number; y: number } {
  return { x: r.x + r.w * 0.18, y: r.y - 2.2 * T };
}

/** Le réverbère du balcon du hall (D-80) : au bout de câble posé au-dessus du balcon. */
export function balconyLamp(level: ArtContext['level'], r: Rect): { x: number; y: number } | null {
  for (const c of level.cables) {
    for (const [x, y] of [
      [c.x1, c.y1],
      [c.x2, c.y2],
    ] as const) {
      if (x >= r.x - T && x <= r.x + r.w && y < r.y && y > r.y - 6 * T) {
        return { x, y };
      }
    }
  }
  return null;
}

/** Tuiles traversables d'un rectangle, en segments (col0, col1, ligne). */
function oneWayRuns(a: ArtContext, r: Rect): [number, number, number][] {
  const runs: [number, number, number][] = [];
  for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
    let start = -1;
    for (let col = r.x / T; col <= (r.x + r.w) / T; col++) {
      const on = col < (r.x + r.w) / T && tileAt(a.level, col, row) === Tile.OneWay;
      if (on && start < 0) {
        start = col;
      } else if (!on && start >= 0) {
        runs.push([start, col - 1, row]);
        start = -1;
      }
    }
  }
  return runs;
}

/** Dernière ligne de tuiles pleines d'un rectangle (en partant du haut), -1 sinon. */
function lastSolidRow(a: ArtContext, r: Rect): number {
  let last = -1;
  for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
    for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
      if (tileAt(a.level, col, row) === Tile.Solid) {
        last = row;
        break;
      }
    }
  }
  return last;
}

/** Un petit objet perdu posé sur une étagère (parapluie, chapeau, valise, gant, écharpe). */
function lostThing(ctx: CanvasRenderingContext2D, x: number, y: number, k: number): void {
  const color = LOST_THINGS[k % LOST_THINGS.length] ?? '#e2574c';
  ctx.fillStyle = color;
  switch (k % 5) {
    case 0:
      // Parapluie fermé, debout.
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 10);
      ctx.lineTo(x + 4, y - 2);
      ctx.lineTo(x, y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(x + 1.5, y - 2, 1, 2);
      break;
    case 1:
      // Chapeau.
      ctx.fillRect(x - 1, y - 2, 8, 2);
      ctx.fillRect(x + 1, y - 6, 4, 4);
      break;
    case 2:
      // Petite valise et sa poignée.
      ctx.fillRect(x, y - 6, 7, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 2, y - 8, 3, 1.2);
      break;
    case 3:
      // Gant.
      ctx.beginPath();
      ctx.roundRect(x, y - 5, 5, 5, 1.5);
      ctx.fill();
      ctx.fillRect(x + 1, y - 7, 1, 2);
      ctx.fillRect(x + 3, y - 7, 1, 2);
      break;
    default:
      // Écharpe pliée.
      ctx.fillRect(x, y - 3, 7, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(x + 2, y - 3, 1, 3);
      ctx.fillRect(x + 5, y - 3, 1, 3);
  }
}

export function stationDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
  return {
    // ——— Dehors : les voies et les quais ———
    stationfacade(a, r) {
      const { ctx } = a;
      const dusk = a.palette.darkness > 0;
      // La gare au fond (D-80) : deux ailes sous un toit d'ardoise, de hautes fenêtres cintrées
      // (quelques-unes allumées au crépuscule) et, au milieu, la tour de l'horloge (le repère).
      const eave = r.y + r.h * 0.42;
      const bottom = r.y + r.h;
      const mid = r.x + r.w / 2;
      const towerW = 5 * T;
      ctx.fillStyle = 'rgba(112,120,134,0.75)';
      ctx.beginPath();
      ctx.moveTo(r.x, eave);
      ctx.lineTo(r.x + 1.5 * T, eave - 1.8 * T);
      ctx.lineTo(r.x + r.w - 1.5 * T, eave - 1.8 * T);
      ctx.lineTo(r.x + r.w, eave);
      ctx.fill();
      ctx.fillStyle = 'rgba(217,204,178,0.8)';
      ctx.fillRect(r.x, eave, r.w, bottom - eave);
      ctx.fillStyle = 'rgba(160,144,114,0.8)';
      ctx.fillRect(r.x, eave, r.w, 3);
      ctx.fillRect(r.x, eave + (bottom - eave) * 0.62, r.w, 2);
      const windowTop = eave + 10;
      const windowH = (bottom - eave) * 0.62 - 16;
      for (let x = r.x + T; x < r.x + r.w - 1.5 * T; x += 2.5 * T) {
        if (Math.abs(x + 6 - mid) < towerW / 2 + 8) {
          continue;
        }
        ctx.fillStyle =
          dusk && hash(x, r.y) > 0.55 ? 'rgba(243,213,138,0.95)' : 'rgba(110,130,150,0.55)';
        ctx.beginPath();
        ctx.roundRect(x, windowTop, 12, windowH, [6, 6, 0, 0]);
        ctx.fill();
        ctx.fillStyle = 'rgba(110,130,150,0.45)';
        ctx.fillRect(x + 2, eave + (bottom - eave) * 0.62 + 6, 8, (bottom - eave) * 0.3);
      }
      // La tour : un toit en pointe, l'horloge, une grande porte cintrée (éclairée le soir).
      const tx = mid - towerW / 2;
      const towerTop = r.y + 2.2 * T;
      ctx.fillStyle = 'rgba(206,192,164,0.9)';
      ctx.fillRect(tx, towerTop, towerW, bottom - towerTop);
      ctx.fillStyle = 'rgba(112,120,134,0.85)';
      ctx.beginPath();
      ctx.moveTo(tx - 4, towerTop);
      ctx.lineTo(mid, r.y);
      ctx.lineTo(tx + towerW + 4, towerTop);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,144,114,0.9)';
      ctx.fillRect(tx - 3, towerTop, towerW + 6, 3);
      const cy = towerTop + 2.2 * T;
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.arc(mid, cy, 1.4 * T, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,72,64,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mid, cy);
      ctx.lineTo(mid + 6, cy - 9);
      ctx.moveTo(mid, cy);
      ctx.lineTo(mid - 2, cy + 13);
      ctx.stroke();
      ctx.fillStyle = dusk ? 'rgba(243,213,138,0.95)' : 'rgba(110,130,150,0.6)';
      ctx.beginPath();
      ctx.roundRect(mid - 1.2 * T, bottom - 3.6 * T, 2.4 * T, 3.6 * T, [1.2 * T, 1.2 * T, 0, 0]);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,144,114,0.9)';
      ctx.fillRect(mid - 1.2 * T, bottom - 2.4 * T, 2.4 * T, 2);
    },
    rails(a, r) {
      const { ctx } = a;
      // Ballast gris sur la voie en contrebas, traverses de bois et deux rails d'acier.
      ctx.fillStyle = '#8f8a84';
      ctx.fillRect(r.x, r.y - 4, r.w, 4 + T);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = r.x + 1; x < r.x + r.w - 2; x += 3) {
        ctx.fillRect(x, r.y - 3 + (hash(x, r.y) * 3 > 1.5 ? 1 : 0), 1.2, 1.2);
      }
      ctx.fillStyle = WOOD_DARK;
      for (let x = r.x + 2; x < r.x + r.w - 4; x += 7) {
        ctx.fillRect(x, r.y - 3, 4, 3);
      }
      ctx.fillStyle = '#6f777c';
      ctx.fillRect(r.x, r.y - 6, r.w, 2.5);
      ctx.fillStyle = '#dfe6ea';
      ctx.fillRect(r.x, r.y - 6, r.w, 0.8);
    },
    quay(a, r) {
      const { ctx } = a;
      tileShape(a, r, CONCRETE, CONCRETE_LIGHT);
      // La bande claire de sécurité, au bord du quai.
      ctx.fillStyle = SAFETY;
      ctx.fillRect(r.x + 1, r.y + 2, r.w - 2, 2);
    },
    shelter(a, r) {
      const { ctx } = a;
      // Abri de quai : toit vert sur deux poteaux de fonte posés sur le quai, un banc dessous.
      const ground = groundRow(a, r.x + 4, r.y / T + 1) * T;
      ctx.fillStyle = IRON;
      ctx.fillRect(r.x + 3, r.y + 4, 2, ground - r.y - 4);
      ctx.fillRect(r.x + r.w - 5, r.y + 4, 2, ground - r.y - 4);
      ctx.fillStyle = 'rgba(110,80,56,0.7)';
      ctx.fillRect(r.x + 8, ground - 6, r.w - 16, 2);
      ctx.fillRect(r.x + 9, ground - 4, 1.5, 4);
      ctx.fillRect(r.x + r.w - 10.5, ground - 4, 1.5, 4);
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, IRON, IRON_LIGHT);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(r.x + 1, r.y + 4, r.w - 2, 2);
    },
    gantry(a, r) {
      const { ctx } = a;
      // Portique de signalisation : deux pieds en treillis et la poutre (traversable).
      for (const x of [r.x + 2, r.x + r.w - 7]) {
        ctx.strokeStyle = METAL;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, r.y + 4, 5, r.h - 4);
        ctx.beginPath();
        for (let y = r.y + 4; y < r.y + r.h - 6; y += 6) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 5, y + 6);
        }
        ctx.stroke();
      }
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, METAL, METAL_LIGHT);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      for (let x = r.x + 4; x < r.x + r.w - 4; x += 8) {
        ctx.moveTo(x, r.y + 4);
        ctx.lineTo(x + 4, r.y + 1);
      }
      ctx.stroke();
    },
    signal(a, r) {
      const { ctx } = a;
      // Feu de voie : un mât, un boîtier noir et sa lentille éteinte (allumée par TrainView).
      ctx.fillStyle = '#4b4f55';
      ctx.fillRect(r.x + T / 2 - 1, r.y + 9, 2, r.h - 9);
      ctx.fillStyle = '#26282c';
      ctx.beginPath();
      ctx.roundRect(r.x + T / 2 - 4, r.y, 8, 11, 2);
      ctx.fill();
      ctx.fillStyle = '#5a2422';
      ctx.beginPath();
      ctx.arc(r.x + T / 2, r.y + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    },
    catenarymast(a, r) {
      const { ctx } = a;
      // Mât de caténaire posé au sol (quai, toit du poste) ; un bras en console tient le bout de
      // câble voisin, avec son isolateur (D-80 : avant, le câble commençait dans le vide).
      const cx = r.x + T / 2;
      const foot = groundRow(a, cx, r.y / T) * T;
      ctx.fillStyle = '#6e737a';
      ctx.fillRect(cx - 1.5, r.y, 3, foot - r.y);
      ctx.fillRect(cx - 3.5, foot - 2, 7, 2);
      ctx.fillStyle = '#9aa0a8';
      ctx.fillRect(cx - 1.5, r.y, 1, foot - r.y);
      let held = false;
      for (const c of a.level.cables) {
        for (const [x, y] of [
          [c.x1, c.y1],
          [c.x2, c.y2],
        ] as const) {
          if (Math.abs(x - cx) > 6 * T || y < r.y - T || y > foot) {
            continue;
          }
          held = true;
          ctx.strokeStyle = '#6e737a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, y);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, Math.max(r.y, y - 12));
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.fillStyle = '#c9d4da';
          ctx.fillRect(x - 1.5, y - 1, 3, 4);
        }
      }
      if (!held) {
        ctx.fillStyle = '#6e737a';
        ctx.fillRect(cx - 8, r.y + 2, 16, 2);
      }
    },
    signalbox(a, r) {
      const { ctx } = a;
      // Poste d'aiguillage sur pilotis : la cabine de briques (pleine), ses vitres (allumées au
      // crépuscule), le toit.
      const bottom = (lastSolidRow(a, r) + 1) * T;
      ctx.fillStyle = WOOD_DARK;
      for (const x of [r.x + 6, r.x + r.w - 9]) {
        ctx.fillRect(x, bottom, 3, r.y + r.h - bottom);
      }
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 7, bottom);
      ctx.lineTo(r.x + r.w - 8, r.y + r.h - 2);
      ctx.moveTo(r.x + r.w - 8, bottom);
      ctx.lineTo(r.x + 7, r.y + r.h - 2);
      ctx.stroke();
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: bottom - r.y }, BRICK, BRICK_LIGHT);
      ctx.fillStyle = a.palette.darkness > 0 ? '#f3d58a' : '#bcdcee';
      for (let x = r.x + 6; x < r.x + r.w - 12; x += 14) {
        ctx.fillRect(x, r.y + 14, 10, 12);
      }
      ctx.fillStyle = '#7a3f34';
      ctx.fillRect(r.x - 2, r.y, r.w + 4, 3);
    },
    luggagecart(a, r) {
      const { ctx } = a;
      // Chariot à bagages (plein, D-80) : des valises oubliées empilées sur un plateau à roulettes,
      // la barre de poussée ; le haut de la pile est le haut de la collision.
      const deckY = r.y + r.h - 5;
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + 1, deckY);
      ctx.lineTo(r.x - 3, r.y + r.h * 0.35);
      ctx.lineTo(r.x - 6, r.y + r.h * 0.35);
      ctx.stroke();
      ctx.fillStyle = METAL;
      ctx.fillRect(r.x, deckY, r.w, 2.5);
      ctx.fillStyle = '#2a2436';
      for (const x of [r.x + 6, r.x + r.w - 6]) {
        ctx.beginPath();
        ctx.arc(x, r.y + r.h - 2.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      const colors = ['#8a5a44', '#6d86c2', '#b0894f', '#7a8f6a', '#a0607a'];
      let y = deckY;
      let k = 0;
      while (y > r.y + 0.5) {
        const h = Math.min(y - r.y, 9 + Math.floor(hash(r.x + k, r.y) * 6));
        const top = y - h;
        const split = hash(r.x, top) > 0.5 ? r.w * (0.4 + hash(top, r.x) * 0.2) : r.w;
        for (const [x0, x1] of [
          [r.x, r.x + split],
          [r.x + split, r.x + r.w],
        ] as const) {
          if (x1 - x0 < 4) {
            continue;
          }
          ctx.fillStyle = colors[(k + Math.floor(x0)) % colors.length] ?? WOOD;
          ctx.beginPath();
          ctx.roundRect(x0 + 0.5, top + 0.5, x1 - x0 - 1, h - 1, 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(x0 + 4, top + 1, 1.5, h - 2);
          ctx.fillRect(x1 - 5.5, top + 1, 1.5, h - 2);
        }
        y = top;
        k++;
      }
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + r.w / 2 - 3, r.y - 2.5, 6, 2.5);
    },
    quaylamp(a, r) {
      const { ctx } = a;
      // Lampadaire de quai (fond, D-80) : un mât de fonte, une crosse, la lanterne allumée au
      // crépuscule.
      const cx = r.x + T / 2;
      const ground = r.y + r.h;
      ctx.fillStyle = IRON;
      ctx.fillRect(cx - 1.5, r.y + 4, 3, ground - r.y - 4);
      ctx.fillRect(cx - 3.5, ground - 4, 7, 4);
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + 5);
      ctx.quadraticCurveTo(cx, r.y, cx + 6, r.y + 2);
      ctx.stroke();
      ctx.fillStyle = a.palette.darkness > 0 ? '#ffe9a8' : '#f4ecd4';
      ctx.beginPath();
      ctx.moveTo(cx + 3, r.y + 4);
      ctx.lineTo(cx + 9, r.y + 4);
      ctx.lineTo(cx + 8, r.y + 11);
      ctx.lineTo(cx + 4, r.y + 11);
      ctx.fill();
      ctx.fillStyle = IRON;
      ctx.fillRect(cx + 2.5, r.y + 3, 7, 1.5);
    },
    canopyroof(a, r) {
      const { ctx } = a;
      // Marquise de verre (D-80) : des fermes de fonte en arc, posées sur le pilier, les piles de
      // la passerelle et des colonnes ; des vitres pâles.
      const chord = r.y + r.h - 4;
      ctx.fillStyle = a.palette.darkness > 0 ? 'rgba(120,140,170,0.45)' : GLASS;
      ctx.fillRect(r.x, r.y, r.w, chord - r.y);
      ctx.strokeStyle = 'rgba(63,90,82,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const span = 6 * T;
      for (let x = r.x; x < r.x + r.w; x += span) {
        ctx.moveTo(x, chord);
        ctx.quadraticCurveTo(x + span / 2, r.y - (chord - r.y) * 0.5, x + span, chord);
        for (let k = 1; k < 6; k++) {
          const hx = x + (span * k) / 6;
          const t = k / 6;
          ctx.moveTo(hx, chord);
          ctx.lineTo(hx, chord - (chord - r.y) * 4 * t * (1 - t) * 0.75);
        }
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(63,90,82,0.9)';
      ctx.fillRect(r.x, chord, r.w, 3);
    },
    canopycolumn(a, r) {
      const { ctx } = a;
      // Colonne de fonte (fond, D-80) : du dessous de la marquise jusqu'au quai, chapiteau et socle.
      const cx = r.x + T / 2;
      const ground = groundRow(a, cx, r.y / T) * T;
      ctx.fillStyle = IRON;
      ctx.fillRect(cx - 2, r.y, 4, ground - r.y);
      ctx.fillRect(cx - 5, r.y, 10, 3);
      ctx.fillRect(cx - 4, ground - 5, 8, 5);
      ctx.fillStyle = IRON_LIGHT;
      ctx.fillRect(cx - 2, r.y + 3, 1, ground - r.y - 8);
      // Les consoles qui tiennent la marquise.
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 12, r.y);
      ctx.quadraticCurveTo(cx - 2, r.y + 2, cx - 1, r.y + 12);
      ctx.moveTo(cx + 12, r.y);
      ctx.quadraticCurveTo(cx + 2, r.y + 2, cx + 1, r.y + 12);
      ctx.stroke();
    },
    globelamp(a, r) {
      const { ctx } = a;
      // Lampe-globe (fond, D-80), au bout de sa tige.
      const cx = r.x + T / 2;
      const gy = r.y + r.h - 6;
      ctx.fillStyle = IRON;
      ctx.fillRect(cx - 0.5, r.y, 1, gy - r.y - 4);
      ctx.fillRect(cx - 2.5, gy - 6, 5, 2.5);
      ctx.fillStyle = a.palette.darkness > 0 ? '#ffe9a8' : '#f4ecd4';
      ctx.beginPath();
      ctx.arc(cx, gy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    },
    pillar(a, r) {
      const { ctx } = a;
      // Pilier de fonte de la marquise (plein), un chapiteau en haut ; sous la partie pleine, sa
      // colonne fine (fond) descend jusqu'au quai : on passe dessous, il tient (D-80).
      const cx = r.x + r.w / 2;
      const ground = groundRow(a, cx, (r.y + r.h) / T) * T;
      if (ground > r.y + r.h) {
        ctx.fillStyle = IRON;
        ctx.fillRect(cx - 2.5, r.y + r.h, 5, ground - r.y - r.h);
        ctx.fillRect(cx - 5, ground - 5, 10, 5);
        ctx.beginPath();
        ctx.moveTo(r.x + 1, r.y + r.h);
        ctx.lineTo(r.x + r.w - 1, r.y + r.h);
        ctx.lineTo(cx + 2.5, r.y + r.h + 6);
        ctx.lineTo(cx - 2.5, r.y + r.h + 6);
        ctx.fill();
        ctx.fillStyle = IRON_LIGHT;
        ctx.fillRect(cx - 2.5, r.y + r.h + 6, 1, ground - r.y - r.h - 11);
      }
      tileShape(a, r, IRON, IRON_LIGHT);
      ctx.fillStyle = IRON_LIGHT;
      ctx.fillRect(r.x - 2, r.y + 2, r.w + 4, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(r.x + r.w - 4, r.y + 5, 3, r.h - 5);
    },
    footbridge(a, r) {
      const { ctx } = a;
      // Passerelle (D-80) : le tablier (traversable) bordé d'une poutre en treillis, sur deux piles
      // posées au bord des quais ; ses escaliers sont des tours de paliers en caillebotis, chaque
      // palier sur ses montants jusqu'au quai.
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        if (coveredByOther(a, r, c0, row)) {
          continue;
        }
        const x = c0 * T;
        const w = (c1 - c0 + 1) * T;
        const y = row * T;
        ctx.strokeStyle = METAL;
        ctx.lineWidth = 1;
        if (c1 - c0 + 1 >= 8) {
          // Piles : là où le sol change (le bord d'un quai), côté quai.
          for (let c = c0; c < c1; c++) {
            const here = groundRow(a, (c + 0.5) * T, row + 1);
            const next = groundRow(a, (c + 1.5) * T, row + 1);
            if (here === next) {
              continue;
            }
            const pc = here < next ? c : c + 1;
            const ground = Math.min(here, next) * T;
            const px = pc * T + 3;
            ctx.strokeRect(px, y + T, 10, ground - y - T);
            ctx.beginPath();
            for (let yy = y + T; yy < ground - 8; yy += 10) {
              ctx.moveTo(px, yy);
              ctx.lineTo(px + 10, yy + 10);
              ctx.moveTo(px + 10, yy);
              ctx.lineTo(px, yy + 10);
            }
            ctx.stroke();
            ctx.fillStyle = METAL;
            ctx.fillRect(px - 2, ground - 3, 14, 3);
          }
          // Poutre en treillis (Warren) au-dessus du tablier.
          ctx.beginPath();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x + w, y - 10);
          for (let bx = x; bx + 12 <= x + w; bx += 12) {
            ctx.moveTo(bx, y);
            ctx.lineTo(bx + 6, y - 10);
            ctx.lineTo(bx + 12, y);
          }
          ctx.stroke();
        } else {
          // Palier : deux montants jusqu'au quai, une entretoise, un garde-corps.
          const ground = groundRow(a, x + 2, row + 1) * T;
          ctx.fillStyle = METAL;
          ctx.fillRect(x + 2, y + T, 2, ground - y - T);
          ctx.fillRect(x + w - 4, y + T, 2, ground - y - T);
          ctx.beginPath();
          ctx.moveTo(x + 3, y + T);
          ctx.lineTo(x + w - 3, Math.min(ground, y + T + w));
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y - 9);
          ctx.lineTo(x + w, y - 9);
          for (let bx = x + 3; bx < x + w; bx += 6) {
            ctx.moveTo(bx, y - 9);
            ctx.lineTo(bx, y);
          }
          ctx.stroke();
        }
        tileShape(a, { x, y, w, h: T }, METAL, METAL_LIGHT);
      }
    },
    stationclock(a, r) {
      const { ctx } = a;
      // Horloge de quai sur son mât : deux faces rondes, les aiguilles sur dix heures dix.
      const cx = r.x + r.w / 2;
      ctx.fillStyle = IRON;
      ctx.fillRect(cx - 1.5, r.y + 14, 3, r.h - 14);
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.arc(cx, r.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + 8);
      ctx.lineTo(cx - 4, r.y + 5);
      ctx.moveTo(cx, r.y + 8);
      ctx.lineTo(cx + 5, r.y + 4);
      ctx.stroke();
    },
    // ——— Le hall ———
    glassroof(a, r) {
      const { ctx } = a;
      // La verrière (D-80) sous la voûte : de grands carreaux (bleu nuit le soir), des montants qui
      // rayonnent, deux tirants de fonte ; la voûte en couvre les coins.
      ctx.fillStyle = a.palette.darkness > 0 ? 'rgba(70,82,120,0.6)' : GLASS;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h + 4 * T;
      ctx.strokeStyle = 'rgba(93,111,120,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -14; k <= 14; k++) {
        const angle = -Math.PI / 2 + k * 0.1;
        ctx.moveTo(cx + Math.cos(angle) * 4 * T, cy + Math.sin(angle) * 4 * T);
        ctx.lineTo(cx + Math.cos(angle) * 60 * T, cy + Math.sin(angle) * 60 * T);
      }
      for (const radius of [7, 10]) {
        ctx.moveTo(cx + radius * T, cy);
        ctx.arc(cx, cy, radius * T, 0, Math.PI, true);
      }
      ctx.stroke();
      ctx.fillStyle = IRON;
      ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3);
      ctx.fillRect(r.x, r.y + r.h * 0.45, r.w, 2);
    },
    bigclock(a, r) {
      const { ctx } = a;
      // La grande horloge du hall : cadran crème, douze traits, les aiguilles (immobiles).
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const radius = Math.min(r.w, r.h) / 2 - 2;
      ctx.fillStyle = WOOD_DARK;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b3440';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const angle = (k * Math.PI) / 6;
        ctx.moveTo(cx + Math.cos(angle) * (radius - 6), cy + Math.sin(angle) * (radius - 6));
        ctx.lineTo(cx + Math.cos(angle) * (radius - 2), cy + Math.sin(angle) * (radius - 2));
      }
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * 0.35, cy - radius * 0.45);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - radius * 0.1, cy + radius * 0.7);
      ctx.stroke();
    },
    departures(a, r) {
      const { ctx } = a;
      // Tableau des départs, suspendu : des lignes de petits volets ambrés (aucun texte).
      ctx.strokeStyle = '#4b4f55';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 8, 0);
      ctx.lineTo(r.x + 8, r.y);
      ctx.moveTo(r.x + r.w - 8, 0);
      ctx.lineTo(r.x + r.w - 8, r.y);
      ctx.stroke();
      ctx.fillStyle = '#26282c';
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 3);
      ctx.fill();
      for (let y = r.y + 6; y < r.y + r.h - 6; y += 12) {
        for (let x = r.x + 6; x < r.x + r.w - 10; x += 8) {
          ctx.fillStyle = hash(x, y) > 0.25 ? AMBER : '#5a4a2a';
          ctx.fillRect(x, y, 6, 7);
        }
      }
    },
    gallery(a, r) {
      const { ctx } = a;
      // Galerie de bois au-dessus du hall, balustres dessous, sur des consoles scellées (D-80).
      tileShape(a, r, WOOD, WOOD_LIGHT);
      ctx.fillStyle = WOOD_DARK;
      for (let x = r.x + 4; x < r.x + r.w - 2; x += 8) {
        ctx.fillRect(x, r.y + 4, 2, 10);
      }
      for (const x of [r.x + r.w * 0.35, r.x + r.w * 0.8]) {
        ctx.beginPath();
        ctx.moveTo(x - 6, r.y + r.h);
        ctx.lineTo(x + 6, r.y + r.h);
        ctx.quadraticCurveTo(x + 1, r.y + r.h + 3, x - 4, r.y + r.h + 16);
        ctx.lineTo(x - 6, r.y + r.h + 16);
        ctx.fill();
      }
    },
    vault(a, r) {
      const { ctx, level, palette: p } = a;
      // La voûte du hall (D-80) : les coins pleins du haut, sous une courbe qui passe par les
      // coins des marches de la collision (hors d'atteinte), bordée d'une moulure.
      const c0 = r.x / T;
      const c1 = (r.x + r.w) / T - 1;
      const bottom = (col: number) => {
        let b = r.y / T;
        for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
          if (tileAt(level, col, row) === Tile.Solid) {
            b = row + 1;
          }
        }
        return b;
      };
      const side = (from: number, step: 1 | -1) => {
        const pts: { x: number; y: number }[] = [];
        for (let col = from; bottom(col) > r.y / T; col += step) {
          if (bottom(col) !== bottom(col + step)) {
            pts.push({ x: (step > 0 ? col + 1 : col) * T, y: bottom(col) * T });
          }
        }
        const wall = step > 0 ? from * T : (from + 1) * T;
        const last = pts[pts.length - 1];
        if (!last) {
          return;
        }
        ctx.beginPath();
        ctx.moveTo(wall, r.y);
        ctx.lineTo(wall, pts[0]?.y ?? r.y);
        const curve = new Path2D();
        curve.moveTo(wall, pts[0]?.y ?? r.y);
        let prev = { x: wall, y: pts[0]?.y ?? r.y };
        for (const pt of pts) {
          const mx = (prev.x + pt.x) / 2;
          const my = (prev.y + pt.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
          curve.quadraticCurveTo(prev.x, prev.y, mx, my);
          prev = pt;
        }
        const end = { x: last.x + step * 2 * T, y: r.y };
        ctx.quadraticCurveTo(prev.x, prev.y, end.x, end.y);
        curve.quadraticCurveTo(prev.x, prev.y, end.x, end.y);
        ctx.closePath();
        ctx.fillStyle = p.structure;
        ctx.fill();
        ctx.strokeStyle = STONE_DARK;
        ctx.lineWidth = 4;
        ctx.stroke(curve);
        ctx.strokeStyle = STONE;
        ctx.lineWidth = 1.5;
        ctx.stroke(curve);
      };
      side(c0, 1);
      side(c1, -1);
    },
    spiralstair(a, r) {
      const { ctx } = a;
      // Escalier en colimaçon de fonte (D-80) : un fût central du sol à la galerie, les marches
      // (traversables) qui tournent autour, à gauche puis à droite, et la rampe en spirale.
      const poleX = r.x + r.w / 2;
      const ground = groundRow(a, poleX, r.y / T) * T;
      const top = r.y - T;
      ctx.fillStyle = IRON;
      ctx.fillRect(poleX - 2.5, top, 5, ground - top);
      ctx.fillRect(poleX - 5, ground - 4, 10, 4);
      ctx.fillRect(poleX - 4, top, 8, 3);
      ctx.fillStyle = IRON_LIGHT;
      ctx.fillRect(poleX - 2.5, top + 3, 1, ground - top - 7);
      const treads = oneWayRuns(a, r).sort((u, v) => v[2] - u[2]);
      // La rampe passe derrière le fût, d'un bout de marche au suivant (claire, lisible sur le
      // mur du soir).
      ctx.strokeStyle = METAL_LIGHT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let prev: { x: number; y: number } | null = null;
      for (const [c0, c1, row] of treads) {
        const left = c0 * T < poleX;
        const outer = { x: left ? c0 * T + 1 : (c1 + 1) * T - 1, y: row * T - 9 };
        ctx.moveTo(outer.x, row * T);
        ctx.lineTo(outer.x, outer.y);
        if (prev) {
          ctx.moveTo(prev.x, prev.y);
          ctx.quadraticCurveTo(poleX, (prev.y + outer.y) / 2 + 8, outer.x, outer.y);
        }
        prev = outer;
      }
      ctx.stroke();
      for (const [c0, c1, row] of treads) {
        const x = c0 * T;
        const w = (c1 - c0 + 1) * T;
        const left = x < poleX;
        // Un bras sous la marche, du fût à son milieu ; la marche, une tôle épaisse.
        ctx.fillStyle = IRON;
        ctx.fillRect(left ? x + w / 2 : poleX, row * T + 4, Math.abs(poleX - (x + w / 2)), 2);
        ctx.fillStyle = IRON_LIGHT;
        ctx.fillRect(x, row * T, w, 5);
        ctx.fillStyle = IRON;
        ctx.fillRect(x, row * T + 3, w, 2);
        tileShape(a, { x, y: row * T, w, h: T }, IRON, IRON_LIGHT);
      }
    },
    balcony(a, r) {
      const { ctx } = a;
      // Balcon de pierre (D-80) sur trois consoles, devant la porte close du chef de gare ; au bout
      // du câble, un réverbère où il est attaché.
      const doorW = 1.8 * T;
      const doorX = r.x + r.w - 2.8 * T;
      ctx.fillStyle = STONE_DARK;
      ctx.beginPath();
      ctx.roundRect(doorX - 3, r.y - 3.6 * T, doorW + 6, 3.6 * T, [doorW, doorW, 0, 0]);
      ctx.fill();
      ctx.fillStyle = WOOD_DARK;
      ctx.beginPath();
      ctx.roundRect(doorX, r.y - 3.4 * T, doorW, 3.4 * T, [doorW / 2, doorW / 2, 0, 0]);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(doorX + doorW / 2 - 0.5, r.y - 2.9 * T, 1, 2.9 * T);
      ctx.fillStyle = AMBER;
      ctx.fillRect(doorX + doorW / 2 + 3, r.y - 1.6 * T, 1.5, 3);
      for (const x of [r.x + T, r.x + r.w / 2, r.x + r.w - T]) {
        ctx.fillStyle = STONE_DARK;
        ctx.beginPath();
        ctx.moveTo(x - 6, r.y + r.h);
        ctx.lineTo(x + 6, r.y + r.h);
        ctx.quadraticCurveTo(x + 2, r.y + r.h + 8, x + 2, r.y + r.h + 20);
        ctx.lineTo(x - 2, r.y + r.h + 20);
        ctx.quadraticCurveTo(x - 4, r.y + r.h + 6, x - 6, r.y + r.h);
        ctx.fill();
      }
      tileShape(a, r, STONE_DARK, STONE);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(r.x, r.y + r.h - 5, r.w, 2);
      const lamp = balconyLamp(a.level, r);
      if (lamp) {
        ctx.fillStyle = IRON;
        ctx.fillRect(lamp.x - 1.5, lamp.y + 2, 3, r.y - lamp.y - 2);
        ctx.fillRect(lamp.x - 3.5, r.y - 3, 7, 3);
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath();
        ctx.moveTo(lamp.x - 4, lamp.y - 8);
        ctx.lineTo(lamp.x + 4, lamp.y - 8);
        ctx.lineTo(lamp.x + 3, lamp.y);
        ctx.lineTo(lamp.x - 3, lamp.y);
        ctx.fill();
        ctx.fillStyle = IRON;
        ctx.fillRect(lamp.x - 5, lamp.y - 10, 10, 2);
        ctx.fillRect(lamp.x - 3, lamp.y, 6, 2);
      }
    },
    kiosk(a, r) {
      const { ctx } = a;
      // Kiosque à journaux (D-80) : un auvent rayé (son haut est la planche traversable) qui
      // retombe sur le comptoir plein, une vitrine éclairée, des journaux.
      const body = { x: r.x + T, y: r.y + T, w: r.w - 2 * T, h: r.h - T };
      tileShape(a, body, '#6d86c2', '#98ade0');
      ctx.fillStyle = a.palette.darkness > 0 ? '#f3d58a' : '#dfe8f2';
      ctx.fillRect(body.x + 4, body.y + 6, body.w - 8, 12);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 === 0 ? '#f3ead7' : '#e6c27a';
        ctx.fillRect(body.x + 6 + k * 9, body.y + 22, 7, 9);
      }
      const awningBottom = r.y + T + 5;
      for (let k = 0, x = r.x; x < r.x + r.w; k++, x += 8) {
        ctx.fillStyle = k % 2 === 0 ? '#e2574c' : '#fbf6ea';
        ctx.beginPath();
        ctx.moveTo(x, r.y);
        ctx.lineTo(Math.min(x + 8, r.x + r.w), r.y);
        ctx.lineTo(Math.min(x + 8, r.x + r.w), awningBottom);
        ctx.arc(x + 4, awningBottom, 4, 0, Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = '#b8443b';
      ctx.fillRect(r.x, r.y, r.w, 2.5);
    },
    lostoffice(a, r) {
      const { ctx } = a;
      const lit = a.palette.darkness > 0;
      // La devanture du bureau des objets trouvés (D-80) : pilastres et corniche de bois, une
      // enseigne (un parapluie et un « ? », aucun texte), deux vitrines où dorment des choses
      // perdues, l'imposte vitrée au-dessus de la porte, allumée le soir.
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(r.x, r.y + 8, r.w, r.h - 8);
      ctx.fillStyle = WOOD;
      ctx.fillRect(r.x - 3, r.y + 6, r.w + 6, 5);
      ctx.fillRect(r.x, r.y + 11, 5, r.h - 11);
      ctx.fillRect(r.x + r.w - 5, r.y + 11, 5, r.h - 11);
      const doorX = r.x + r.w / 2 - 12;
      for (const wx of [r.x + 8, doorX + 28]) {
        const ww = doorX - 4 - (r.x + 8);
        ctx.fillStyle = lit ? 'rgba(243,213,138,0.85)' : 'rgba(188,220,238,0.7)';
        ctx.fillRect(wx, r.y + r.h - 46, ww, 30);
        for (let k = 0; k * 9 + 6 < ww; k++) {
          lostThing(ctx, wx + 2 + k * 9, r.y + r.h - 16, Math.floor(hash(wx + k, r.y) * 5) + k);
        }
        ctx.fillStyle = WOOD;
        ctx.fillRect(wx - 1, r.y + r.h - 16, ww + 2, 4);
      }
      ctx.fillStyle = lit ? '#f3d58a' : 'rgba(188,220,238,0.8)';
      ctx.beginPath();
      ctx.roundRect(doorX, r.y + r.h - 54, 24, 12, [12, 12, 0, 0]);
      ctx.fill();
      ctx.fillStyle = WOOD;
      ctx.fillRect(doorX, r.y + r.h - 40, 24, 40);
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(doorX + 3, r.y + r.h - 36, 18, 14);
      ctx.fillStyle = AMBER;
      ctx.fillRect(doorX + 18, r.y + r.h - 20, 2, 3);
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.roundRect(r.x + r.w / 2 - 22, r.y + 14, 44, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 16, r.y + 28);
      ctx.quadraticCurveTo(r.x + r.w / 2 - 8, r.y + 16, r.x + r.w / 2, r.y + 28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b3440';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2 + 11, r.y + 21, 3.5, Math.PI * 1.1, Math.PI * 2.4);
      ctx.lineTo(r.x + r.w / 2 + 11, r.y + 28);
      ctx.stroke();
    },
    // ——— Le bureau des objets trouvés ———
    lostcounter(a, r) {
      const { ctx } = a;
      // Le guichet : comptoir de bois, une sonnette, un vieux carnet ouvert.
      tileShape(a, r, WOOD, WOOD_LIGHT);
      ctx.fillStyle = '#c9a43a';
      ctx.beginPath();
      ctx.arc(r.x + r.w - 10, r.y - 2, 3, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fbf6ea';
      ctx.fillRect(r.x + 10, r.y - 2, 12, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(r.x + 4, r.y + 8, r.w - 8, 2);
    },
    lostshelf(a, r) {
      const { ctx } = a;
      // Étagères des objets perdus (D-81) : deux rails de bois fixés au mur, du sol au plafond ;
      // les planches (traversables) y sont accrochées, avec dessus des choses perdues par des
      // inconnus ; des parapluies pendent aux rails.
      const top = T;
      const ground = groundRow(a, r.x + 1, r.y / T) * T;
      ctx.fillStyle = 'rgba(110,80,56,0.6)';
      ctx.fillRect(r.x, top, 2.5, ground - top);
      ctx.fillRect(r.x + r.w - 2.5, top, 2.5, ground - top);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(r.x + 2.5, top, 1, ground - top);
      ctx.fillRect(r.x + r.w - 1.5, top, 1, ground - top);
      for (const [x, y, k] of [
        [r.x + 3, r.y + r.h * 0.35, 0],
        [r.x + r.w - 3, r.y + r.h * 0.62, 1],
        [r.x + 3, r.y + r.h * 0.9, 2],
      ] as const) {
        ctx.strokeStyle = '#3b3440';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x + (k === 1 ? -2 : 2), y + 2, 2, Math.PI, 0, k === 1);
        ctx.stroke();
        ctx.fillStyle = LOST_THINGS[(k * 2 + 1) % LOST_THINGS.length] ?? WOOD;
        const ux = x + (k === 1 ? -4 : 4);
        ctx.beginPath();
        ctx.moveTo(ux - 2.5, y + 4);
        ctx.lineTo(ux + 2.5, y + 4);
        ctx.lineTo(ux, y + 22);
        ctx.fill();
      }
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        const x = c0 * T;
        const w = (c1 - c0 + 1) * T;
        ctx.fillStyle = WOOD_DARK;
        const bx = x < r.x + r.w / 2 ? x + 3 : x + w - 9;
        ctx.beginPath();
        ctx.moveTo(bx, row * T + 4);
        ctx.lineTo(bx + 6, row * T + 4);
        ctx.lineTo(x < r.x + r.w / 2 ? bx : bx + 6, row * T + 11);
        ctx.fill();
        tileShape(a, { x, y: row * T, w, h: T }, WOOD, WOOD_LIGHT);
        for (let k = 0; k * 9 + 2 < w - 4; k++) {
          lostThing(ctx, x + 2 + k * 9, row * T, Math.floor(hash(x + k, row) * 5) + k);
        }
      }
    },
    tallcabinet(a, r) {
      const { ctx } = a;
      // Haut placard mural (plein, D-81) : vissé au mur sur deux équerres (on passe dessous) ;
      // dessous, posé au sol, un porte-parapluies (fond).
      const ground = groundRow(a, r.x + r.w / 2, (r.y + r.h) / T) * T;
      ctx.fillStyle = WOOD_DARK;
      for (const x of [r.x + 2, r.x + r.w - 2]) {
        const dir = x < r.x + r.w / 2 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x, r.y + r.h);
        ctx.lineTo(x + dir * 8, r.y + r.h);
        ctx.lineTo(x, r.y + r.h + 10);
        ctx.fill();
      }
      if (ground > r.y + r.h + 2 * T) {
        const cx = r.x + r.w / 2;
        ctx.fillStyle = '#6d86c2';
        ctx.fillRect(cx - 6, ground - 14, 12, 14);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(cx - 6, ground - 14, 12, 2);
        ctx.strokeStyle = '#3b3440';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const [dx, h] of [
          [-3, 24],
          [1, 28],
          [4, 21],
        ] as const) {
          ctx.moveTo(cx + dx, ground - 12);
          ctx.lineTo(cx + dx, ground - h);
          ctx.arc(cx + dx + 2, ground - h, 2, Math.PI, 0);
        }
        ctx.stroke();
      }
      tileShape(a, r, WOOD_DARK, WOOD);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2, r.y + 4);
      ctx.lineTo(r.x + r.w / 2, r.y + r.h - 4);
      ctx.stroke();
      ctx.fillStyle = AMBER;
      ctx.fillRect(r.x + r.w / 2 - 3, r.y + r.h / 2, 1.5, 4);
    },
    desklamp(a, r) {
      const { ctx } = a;
      // Lampe de bureau à abat-jour vert (fond, D-81), posée sur le guichet ; allumée.
      const cx = r.x + r.w / 2;
      const base = r.y + r.h;
      ctx.fillStyle = '#c9a43a';
      ctx.fillRect(cx - 4, base - 2, 8, 2);
      ctx.fillRect(cx - 0.75, base - 11, 1.5, 9);
      ctx.fillStyle = '#3f7a5a';
      ctx.beginPath();
      ctx.moveTo(cx - 7, base - 10);
      ctx.quadraticCurveTo(cx, base - 17, cx + 7, base - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3c9';
      ctx.fillRect(cx - 5, base - 10, 10, 1.5);
    },
    lockers(a, r) {
      const { ctx } = a;
      // Casiers de consigne (pleins) ; tout en haut, une petite porte entrouverte où passe une
      // lueur turquoise (le monde étrange, plus tard).
      tileShape(a, r, METAL, METAL_LIGHT);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let y = r.y + 4; y < r.y + r.h - 8; y += 20) {
        for (let x = r.x + 3; x < r.x + r.w - 8; x += 13) {
          ctx.strokeRect(x, y, 11, 17);
          ctx.fillStyle = '#c9d4da';
          ctx.fillRect(x + 8, y + 8, 1.5, 3);
        }
      }
      const glow = ctx.createLinearGradient(r.x + 3, 0, r.x + 18, 0);
      glow.addColorStop(0, 'rgba(94,230,210,0.9)');
      glow.addColorStop(1, 'rgba(94,230,210,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(r.x + 3, r.y + 4, 14, 17);
      ctx.fillStyle = TEAL;
      ctx.fillRect(r.x + 4, r.y + 5, 1.5, 15);
    },
    // ——— Revisites avec le crochet (le jardin, la rue) ———
    windowbox(a, r) {
      const { ctx } = a;
      // Jardinière de bois sous une fenêtre, des fleurs.
      tileShape(a, r, WOOD, WOOD_LIGHT);
      for (let x = r.x + 3; x < r.x + r.w - 2; x += 5) {
        ctx.fillStyle = '#5d9152';
        ctx.fillRect(x, r.y - 4, 1.5, 4);
        ctx.fillStyle = LOST_THINGS[Math.floor(hash(x, r.y) * LOST_THINGS.length)] ?? '#e2574c';
        ctx.beginPath();
        ctx.arc(x + 0.75, r.y - 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    nest(a, r) {
      const { ctx } = a;
      // Une branche du platane (traversable) et un nid de brindilles.
      tileShape(a, r, '#7d5a3b', '#a57b52');
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#8a6a44';
      ctx.beginPath();
      ctx.ellipse(cx, r.y - 2, 9, 4, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#5b4429';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let k = -7; k <= 7; k += 3) {
        ctx.moveTo(cx + k, r.y - 2);
        ctx.lineTo(cx + k + 3, r.y + 1);
      }
      ctx.stroke();
    },
    // ——— Le monde étrange de la gare (D-68) : silhouettes, lueurs turquoise ———
    upsidehall(a, r) {
      const { ctx, palette: p } = a;
      // Le hall à l'envers : la verrière en bas, ses arcs tournés vers le sol, des bancs au
      // plafond (fond, jamais de collision).
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h * 1.6, r.x + r.w, r.y);
      for (let x = r.x + 16; x < r.x + r.w; x += 16) {
        ctx.moveTo(x, r.y);
        ctx.lineTo(r.x + r.w / 2 + (x - r.x - r.w / 2) * 0.4, r.y + r.h);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.structure;
      for (let x = r.x + 30; x < r.x + r.w - 30; x += 90) {
        ctx.fillRect(x, 4, 40, 4);
        ctx.fillRect(x + 4, 8, 3, 8);
        ctx.fillRect(x + 33, 8, 3, 8);
      }
    },
    upsideclock(a, r) {
      const { ctx, palette: p } = a;
      // La grande horloge, à l'envers, qui flotte ; ses aiguilles reculent (immobiles ici).
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const radius = Math.min(r.w, r.h) / 2 - 2;
      ctx.fillStyle = p.structure;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.rim;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const angle = (k * Math.PI) / 6;
        ctx.moveTo(cx + Math.cos(angle) * (radius - 6), cy + Math.sin(angle) * (radius - 6));
        ctx.lineTo(cx + Math.cos(angle) * (radius - 2), cy + Math.sin(angle) * (radius - 2));
      }
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - radius * 0.35, cy + radius * 0.45);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * 0.1, cy - radius * 0.7);
      ctx.stroke();
    },
    floatsuitcase(a, r) {
      const { ctx, palette: p } = a;
      // Une valise qui flotte (D-81, lisibilité) : son dessus est une planche traversable, bien
      // marquée ; le corps, qu'on traverse d'en dessous, n'est qu'un contour léger (le plein, lui,
      // est rempli et bordé partout).
      ctx.fillStyle = p.wood;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.roundRect(r.x + 1, r.y + 3, r.w - 2, r.h - 3, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r.x + 5, r.y + 4);
      ctx.lineTo(r.x + 5, r.y + r.h - 1);
      ctx.moveTo(r.x + r.w - 5, r.y + 4);
      ctx.lineTo(r.x + r.w - 5, r.y + r.h - 1);
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(r.x + r.w / 2 - 4, r.y - 3, 8, 3);
      ctx.globalAlpha = 1;
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, p.wood, p.woodLight);
    },
    suitcasestack(a, r) {
      const { ctx, palette: p } = a;
      // Une pile de valises (pleine, D-81) : plus sombre que le mur, bordée de turquoise sur tous
      // ses côtés libres, et découpée en valises (bords, poignées) : on la distingue du fond.
      tileShape(a, r, p.structure, p.structure);
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      const vertical = r.h > r.w;
      ctx.beginPath();
      if (vertical) {
        for (let y = r.y + 10; y < r.y + r.h - 4; y += 9 + hash(r.x, y) * 8) {
          ctx.moveTo(r.x + 1, y);
          ctx.lineTo(r.x + r.w - 1, y);
          ctx.moveTo(r.x + r.w / 2 - 3, y - 4);
          ctx.lineTo(r.x + r.w / 2 + 3, y - 4);
        }
      } else {
        for (let x = r.x + 18; x < r.x + r.w - 6; x += 18 + hash(x, r.y) * 14) {
          ctx.moveTo(x, r.y + 2);
          ctx.lineTo(x, r.y + r.h - 2);
          ctx.moveTo(x - 12, r.y + 5);
          ctx.lineTo(x - 6, r.y + 5);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      solidOutline(a, r, p.rim, 0.7);
    },
    lostpile(a, r) {
      const { ctx, palette: p } = a;
      // La montagne des choses perdues (pleine, en marches, D-81) : plus sombre que le mur, bordée
      // de turquoise sur ses côtés libres ; dedans, des valises en contours.
      tileShape(a, r, p.structure, p.structure);
      ctx.globalAlpha = 0.28;
      for (let x = r.x + 3; x < r.x + r.w - 8; x += 9) {
        for (let y = r.y + 10; y < r.y + r.h; y += 12) {
          if (tileAt(a.level, Math.floor(x / T), Math.floor(y / T)) !== Tile.Solid) {
            continue;
          }
          ctx.strokeStyle = p.rim;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(x, y, 6 + hash(x, y) * 4, 4 + hash(y, x) * 3, 1.5);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      solidOutline(a, r, p.rim, 0.7);
    },
    // ——— Le dépôt ———
    depotwindows(a, r) {
      const { ctx } = a;
      const dusk = a.palette.darkness > 0;
      // Le grand atelier au fond du dépôt (D-81) : un toit en sheds (dents de scie), un mur de
      // briques, de hautes verrières à petits carreaux (allumées au crépuscule), une cheminée.
      const roofY = r.y - 8;
      ctx.fillStyle = 'rgba(122,63,52,0.55)';
      ctx.beginPath();
      ctx.moveTo(r.x, roofY);
      for (let x = r.x; x < r.x + r.w; x += 4 * T) {
        ctx.lineTo(x, roofY - 1.2 * T);
        ctx.lineTo(Math.min(x + 4 * T, r.x + r.w), roofY);
      }
      ctx.lineTo(r.x + r.w, roofY);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,228,240,0.4)';
      for (let x = r.x; x < r.x + r.w; x += 4 * T) {
        ctx.fillRect(x, roofY - 1.2 * T, 2, 1.2 * T);
      }
      const chimney = depotChimney(r);
      ctx.fillStyle = 'rgba(122,63,52,0.65)';
      ctx.fillRect(chimney.x - 5, chimney.y, 10, roofY - chimney.y);
      ctx.fillStyle = 'rgba(181,103,79,0.45)';
      ctx.fillRect(r.x, roofY, r.w, r.h + 8);
      ctx.fillStyle = 'rgba(122,63,52,0.5)';
      ctx.fillRect(r.x, roofY, r.w, 4);
      const windowH = r.h * 0.55;
      for (let x = r.x + 10; x < r.x + r.w - 40; x += 70) {
        ctx.fillStyle =
          dusk && hash(x, r.y) > 0.5 ? 'rgba(243,213,138,0.6)' : 'rgba(200,228,240,0.35)';
        ctx.fillRect(x, r.y, 40, windowH);
        ctx.strokeStyle = 'rgba(60,64,70,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = x; gx <= x + 40; gx += 10) {
          ctx.moveTo(gx, r.y);
          ctx.lineTo(gx, r.y + windowH);
        }
        for (let gy = r.y; gy <= r.y + windowH; gy += 12) {
          ctx.moveTo(x, gy);
          ctx.lineTo(x + 40, gy);
        }
        ctx.stroke();
      }
    },
    wagon(a, r) {
      const { ctx } = a;
      // Wagon de marchandises garé (plein) : caisse rouge brique, nervures, roues sur leur bout de
      // rail (D-81).
      tileShape(a, r, BRICK, BRICK_LIGHT);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let x = r.x + 8; x < r.x + r.w - 4; x += 12) {
        ctx.fillRect(x, r.y + 4, 2, r.h - 10);
      }
      ctx.fillStyle = '#6f777c';
      ctx.fillRect(r.x - 6, r.y + r.h - 1.5, r.w + 12, 1.5);
      ctx.fillStyle = '#2a2436';
      for (const x of [r.x + 14, r.x + 26, r.x + r.w - 26, r.x + r.w - 14]) {
        ctx.beginPath();
        ctx.arc(x, r.y + r.h - 1.5, 5, Math.PI, 0);
        ctx.fill();
      }
    },
    trestle(a, r) {
      const { ctx, level } = a;
      // Planche sur deux chevalets de bois (D-81), plantés dans les gravats de la fosse.
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        const x = c0 * T;
        const w = (c1 - c0 + 1) * T;
        let ground = row + 1;
        while (ground < level.height && tileAt(level, c0, ground) === Tile.Empty) {
          ground++;
        }
        const gy = ground * T + 4;
        ctx.strokeStyle = WOOD_DARK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const lx of [x + 5, x + w - 5]) {
          ctx.moveTo(lx, row * T + 3);
          ctx.lineTo(lx - 4, gy);
          ctx.moveTo(lx, row * T + 3);
          ctx.lineTo(lx + 4, gy);
        }
        ctx.stroke();
        tileShape(a, { x, y: row * T, w, h: T }, WOOD, WOOD_LIGHT);
      }
    },
    cranehook(a, r) {
      const { ctx } = a;
      // Crochet du pont roulant (traversable) au bout de sa chaîne.
      const cx = r.x + r.w / 2;
      ctx.strokeStyle = '#4b4f55';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 1.5]);
      ctx.beginPath();
      ctx.moveTo(cx, 6 * T);
      ctx.lineTo(cx, r.y);
      ctx.stroke();
      ctx.setLineDash([]);
      tileShape(a, r, '#e8b23a', '#f5d27a');
      ctx.strokeStyle = '#b98a22';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, r.y + 9, 3, 0, Math.PI);
      ctx.stroke();
    },
    overheadcrane(a, r) {
      const { ctx } = a;
      // Portique roulant (fond, D-81) : la poutre jaune, son chariot, et deux pieds en A posés sur
      // le sol du dépôt (avant, la poutre flottait).
      const beamY = r.y + r.h / 2;
      const ground = (a.level.height - 2) * T;
      ctx.strokeStyle = '#d29f30';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (const x of [r.x + 4, r.x + r.w - 4]) {
        ctx.moveTo(x, beamY);
        ctx.lineTo(x - 10, ground);
        ctx.moveTo(x, beamY);
        ctx.lineTo(x + 10, ground);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const x of [r.x + 4, r.x + r.w - 4]) {
        for (let y = beamY + 3 * T; y < ground - T; y += 4 * T) {
          const spread = (10 * (y - beamY)) / (ground - beamY);
          ctx.moveTo(x - spread, y);
          ctx.lineTo(x + spread, y);
        }
      }
      ctx.stroke();
      ctx.fillStyle = '#e8b23a';
      ctx.fillRect(r.x - 4, beamY - 4, r.w + 8, 8);
      ctx.fillStyle = '#b98a22';
      ctx.fillRect(r.x - 4, beamY + 2, r.w + 8, 2);
      ctx.fillStyle = '#4b4f55';
      ctx.fillRect(r.x + r.w / 2 - 10, beamY - 7, 20, 12);
    },
  };
}

/** Pointes de parapluies perdus (danger du monde étrange de la gare, D-68). */
export function drawUmbrellaTips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  inFloor: boolean,
): void {
  const base = inFloor ? y + 4 : y + T;
  for (let i = 0; i < 2; i++) {
    const px = x + 3 + i * 7;
    const h = 8 + ((col * 3 + i * 5) % 4);
    ctx.fillStyle = '#16112a';
    ctx.beginPath();
    ctx.moveTo(px - 2.5, base);
    ctx.quadraticCurveTo(px - 1, base - h * 0.6, px, base - h);
    ctx.quadraticCurveTo(px + 1, base - h * 0.6, px + 2.5, base);
    ctx.fill();
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}
