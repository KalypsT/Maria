import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * L'école du quartier et son monde étrange (D-64), dessinés par le code. PLACEHOLDER : formes
 * simples. Ce qu'on foule suit exactement ses tuiles ; façades, pieds et tableaux sont du fond.
 * Le monde étrange reprend la classe en silhouettes (palette « crépuscule », §6.2).
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const STONE_DARK = '#b8a98f';
const GLASS = '#bcdcee';
const WOOD = '#b58a5f';
const WOOD_LIGHT = '#d8b183';
const RED = '#d0674f';
const METAL = '#8a9aa5';
const TURQUOISE = 'rgba(140,240,225,0.9)';
/** Craie et cadre des tableaux du monde étrange (D-79). */
const CHALK_STRANGE = 'rgba(170,150,215,0.55)';

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hashS(x: number, y: number): number {
  const n = Math.sin(x * 57.3 + y * 191.9) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Fenêtres de la façade de l'école (cour), partagées par le dessin et la lumière : un quart
 * environ s'allume au crépuscule (D-79).
 */
export function schoolFacadeWindows(
  r: Rect,
): { x: number; y: number; w: number; h: number; lit: boolean }[] {
  const panes: { x: number; y: number; w: number; h: number; lit: boolean }[] = [];
  for (let y = r.y + 4 * T; y < r.y + r.h - 7 * T; y += 4 * T) {
    for (let x = r.x + 2 * T; x < r.x + r.w - 2 * T; x += 4 * T) {
      panes.push({ x, y, w: 2 * T, h: 2.4 * T, lit: hashS(x, y) > 0.6 });
    }
  }
  return panes;
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

export function schoolDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
  const plank = (
    a: ArtContext,
    c0: number,
    c1: number,
    row: number,
    fill: string,
    light: string,
  ) => {
    tileShape(a, { x: c0 * T, y: row * T, w: (c1 - c0 + 1) * T, h: T }, fill, light);
  };

  return {
    // ——— La cour ———
    hopscotch(a, r) {
      // Marelle tracée à la craie sur le sol de la cour, sans chiffres (D-79) : posée sur le haut
      // du sol, sous le rectangle (qui reste vide).
      const { ctx } = a;
      const y = r.y + r.h + 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      const cell = r.w / 6;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        ctx.rect(r.x + k * cell, y, cell, 3);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(242,193,78,0.55)';
      ctx.beginPath();
      ctx.arc(r.x + r.w + 4, y + 1.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    },
    ball(a, r) {
      // Un ballon oublié près du banc (sans collision).
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h - 5;
      ctx.fillStyle = '#e2574c';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff6f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, -0.6, 0.9);
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
      ctx.stroke();
    },
    pigeon() {
      // Animé (WorldLifeView) : il picore, puis s'envole quand Céleste approche.
    },
    cubbybody(a, r) {
      // Casiers de la classe, posés au sol (fond : on passe devant) ; leur dessus est
      // \`cubbytop\` (D-79 : avant, des étagères murales qui flottaient).
      const { ctx } = a;
      let floor = r.y / T + 1;
      while (floor < a.level.height && tileAt(a.level, r.x / T, floor) !== Tile.Solid) {
        floor++;
      }
      const bottom = floor * T;
      ctx.fillStyle = WOOD;
      ctx.fillRect(r.x, r.y + 3, r.w, bottom - r.y - 3);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(r.x + r.w - 2, r.y + 3, 2, bottom - r.y - 3);
      const colors = ['#e2574c', '#6d86c2', '#f2c14e', '#8cc26f'];
      let k = 0;
      for (let y = r.y + 7; y < bottom - 10; y += 13) {
        for (let x = r.x + 3; x < r.x + r.w - 10; x += 14) {
          ctx.fillStyle = 'rgba(70,48,36,0.35)';
          ctx.fillRect(x, y, 12, 10);
          ctx.fillStyle = colors[k % colors.length] ?? '#e2574c';
          ctx.fillRect(x + 1, y + 4, 10, 6);
          k++;
        }
      }
    },
    cubbytop(a, r) {
      tileShape(a, r, WOOD, WOOD_LIGHT);
    },
    ceilingbeams(a, r) {
      // Poutres au plafond de la classe, tous les huit pas (D-79).
      const { ctx } = a;
      for (let x = r.x + 2 * T; x < r.x + r.w - T; x += 8 * T) {
        ctx.fillStyle = '#b58a5f';
        ctx.fillRect(x, r.y, 12, r.h);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x, r.y + r.h - 3, 12, 3);
      }
    },
    frieze(a, r) {
      // Frise de formes au mur (rond, carré, triangle), l'écho de la boîte à formes (D-79).
      const { ctx } = a;
      const colors = ['#e2574c', '#6d86c2', '#f2c14e', '#8cc26f'];
      let k = 0;
      for (let x = r.x + 6; x < r.x + r.w - 6; x += 18) {
        ctx.fillStyle = colors[k % colors.length] ?? '#e2574c';
        const cy = r.y + T / 2;
        ctx.beginPath();
        if (k % 3 === 0) {
          ctx.arc(x, cy, 4, 0, Math.PI * 2);
        } else if (k % 3 === 1) {
          ctx.rect(x - 4, cy - 4, 8, 8);
        } else {
          ctx.moveTo(x - 5, cy + 4);
          ctx.lineTo(x, cy - 5);
          ctx.lineTo(x + 5, cy + 4);
        }
        ctx.fill();
        k++;
      }
    },
    fishbowl(a, r) {
      // Bocal rond du poisson rouge, sur le haut de l'armoire ; le poisson nage (animé).
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h - 8;
      ctx.fillStyle = 'rgba(188,220,238,0.6)';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(cx - 5, cy - 6, 2, 3);
      ctx.fillStyle = '#d9c19a';
      ctx.fillRect(cx - 6, cy + 5, 12, 2);
    },
    schoolfacade(a, r) {
      const { ctx } = a;
      // L'arrière de l'école : mur clair, fenêtres, toit, et la porte de la cour (fond).
      ctx.fillStyle = '#efe4cc';
      ctx.fillRect(r.x, r.y + 2 * T, r.w, r.h - 2 * T);
      ctx.fillStyle = '#b5634f';
      ctx.beginPath();
      ctx.moveTo(r.x - T, r.y + 2 * T);
      ctx.lineTo(r.x + 2 * T, r.y);
      ctx.lineTo(r.x + r.w, r.y);
      ctx.lineTo(r.x + r.w, r.y + 2 * T);
      ctx.fill();
      // Au crépuscule (D-79), quand maman vient chercher Céleste, quelques fenêtres s'allument.
      const dusk = a.palette.darkness > 0;
      for (const pane of schoolFacadeWindows(r)) {
        ctx.fillStyle = STONE_DARK;
        ctx.fillRect(pane.x - 1, pane.y - 1, pane.w + 2, pane.h + 2);
        ctx.fillStyle = dusk && pane.lit ? '#ffd98a' : GLASS;
        ctx.fillRect(pane.x, pane.y, pane.w, pane.h);
      }
      // Porte de la cour, centrée sur la tuile de la porte de façade (col. 52).
      const doorX = 51 * T;
      const ground = r.y + r.h;
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(doorX - 2, ground - 4 * T - 2, 3 * T + 4, 4 * T + 2);
      ctx.fillStyle = '#6d86c2';
      ctx.beginPath();
      ctx.roundRect(doorX, ground - 4 * T, 3 * T, 4 * T, [1.5 * T, 1.5 * T, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#e6c27a';
      ctx.beginPath();
      ctx.arc(doorX + 2.3 * T, ground - 2 * T, 1.5, 0, Math.PI * 2);
      ctx.fill();
    },
    gymgable(a, r) {
      const { ctx } = a;
      // Le pignon du gymnase de l'école (D-134) : un mur de briques haut, une fenêtre, un toit
      // plat bordé de zinc (on arrive dessus) ; à son pied, un petit abri à vélos (fond).
      const ground = r.y + r.h;
      const shelter = { x: r.x + r.w, y: ground - 3 * T, w: 2.5 * T };
      ctx.fillStyle = METAL;
      ctx.fillRect(shelter.x + shelter.w - 2, shelter.y, 2, ground - shelter.y);
      ctx.fillStyle = '#8fa3ad';
      ctx.beginPath();
      ctx.moveTo(shelter.x, shelter.y - 4);
      ctx.lineTo(shelter.x + shelter.w + 3, shelter.y);
      ctx.lineTo(shelter.x + shelter.w + 3, shelter.y + 2.5);
      ctx.lineTo(shelter.x, shelter.y - 1.5);
      ctx.fill();
      ctx.strokeStyle = '#3b3440';
      ctx.lineWidth = 1.5;
      for (const dx of [8, 24]) {
        ctx.beginPath();
        ctx.arc(shelter.x + dx, ground - 6, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(shelter.x + 8, ground - 6);
      ctx.lineTo(shelter.x + 15, ground - 13);
      ctx.lineTo(shelter.x + 24, ground - 6);
      ctx.stroke();
      tileShape(a, r, '#b5634f', '#c97b66');
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      for (let y = r.y + 6, k = 0; y < ground; y += 5, k++) {
        ctx.fillRect(r.x, y, r.w, 1);
        for (let x = r.x + (k % 2 === 0 ? 4 : 9); x < r.x + r.w; x += 10) {
          ctx.fillRect(x, y - 4, 1, 4);
        }
      }
      ctx.fillStyle = '#c8ccd0';
      ctx.fillRect(r.x - 2, r.y, r.w + 4, 3);
      ctx.fillStyle = GLASS;
      ctx.fillRect(r.x + r.w / 2 - 7, r.y + 3 * T, 14, 2 * T);
      ctx.fillStyle = '#f3ead7';
      ctx.fillRect(r.x + r.w / 2 - 0.75, r.y + 3 * T, 1.5, 2 * T);
      ctx.fillRect(r.x + r.w / 2 - 7, r.y + 4 * T, 14, 1.5);
    },
    preau(a, r) {
      const { ctx } = a;
      // Préau : poteaux jusqu'au sol, toit de tuiles (on s'y pose).
      const runs = oneWayRuns(a, r);
      const ground = r.y + r.h;
      for (const [c0, c1, row] of runs) {
        ctx.fillStyle = METAL;
        for (const col of [c0, Math.floor((c0 + c1) / 2), c1]) {
          ctx.fillRect(col * T + T / 2 - 1.5, (row + 1) * T, 3, ground - (row + 1) * T);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(c0 * T, (row + 1) * T, (c1 - c0 + 1) * T, ground - (row + 1) * T);
        plank(a, c0, c1, row, '#b5634f', '#d98a72');
      }
    },
    basketball(a, r) {
      const { ctx } = a;
      // Panier de basket : poteau, panneau, cercle orange ; le haut du panneau est le perchoir.
      const ground = r.y + r.h;
      const cx = r.x + r.w / 2;
      ctx.fillStyle = METAL;
      ctx.fillRect(cx - 1.5, r.y + T, 3, ground - r.y - T);
      ctx.fillStyle = '#f3ead7';
      ctx.fillRect(r.x - 2, r.y + 2, r.w + 4, T + 2);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 4, r.y + 5, 8, 6);
      ctx.strokeStyle = '#e8822e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx + 8, r.y + T + 5, 5, 1.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      plank(a, r.x / T, (r.x + r.w) / T - 1, r.y / T, '#f3ead7', '#ffffff');
    },

    // ——— L'école ———
    kidtable(a, r) {
      const { ctx } = a;
      // Petite table de la classe des petits, et une petite chaise à côté.
      if (a.palette.silhouettes) {
        // Dans un monde étrange (D-113) : la silhouette.
        tileShape(a, r, a.palette.wood, a.palette.woodLight);
        return;
      }
      tileShape(a, r, '#f2c14e', '#f6d77a');
      ctx.fillStyle = '#6d86c2';
      ctx.fillRect(r.x + r.w + 2, r.y + T - 2, 8, 3);
      ctx.fillRect(r.x + r.w + 8, r.y, 2, r.h);
    },
    chalkboard(a, r) {
      const { ctx, palette: p } = a;
      // Tableau noir : des dessins à la craie (un soleil, une maison), jamais de texte. Dans le
      // monde étrange, la craie dessine des formes.
      ctx.fillStyle = p.silhouettes ? '#16112a' : '#3d5a4a';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // Monde étrange : un violet pâle, pas le turquoise (D-79) : le haut du cadre se lisait comme
      // une plateforme ; le turquoise reste réservé à ce qui porte.
      ctx.strokeStyle = p.silhouettes ? CHALK_STRANGE : WOOD;
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = p.silhouettes ? CHALK_STRANGE : 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.2;
      const cx = r.x + r.w * 0.3;
      const cy = r.y + r.h * 0.4;
      ctx.beginPath();
      if (p.silhouettes) {
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.rect(cx + 18, cy - 6, 12, 12);
        ctx.moveTo(cx + 50, cy + 6);
        ctx.lineTo(cx + 57, cy - 7);
        ctx.lineTo(cx + 64, cy + 6);
        ctx.closePath();
      } else {
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        for (let k = 0; k < 8; k++) {
          const angle = (k * Math.PI) / 4;
          ctx.moveTo(cx + Math.cos(angle) * 9, cy + Math.sin(angle) * 9);
          ctx.lineTo(cx + Math.cos(angle) * 13, cy + Math.sin(angle) * 13);
        }
        ctx.rect(cx + 34, cy, 22, 16);
        ctx.moveTo(cx + 30, cy);
        ctx.lineTo(cx + 45, cy - 12);
        ctx.lineTo(cx + 60, cy);
      }
      ctx.stroke();
    },
    oculus(a, r) {
      const { ctx } = a;
      // Oculus au-dessus de l'étagère haute : une lueur turquoise y passe (le monde étrange).
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      ctx.fillStyle = STONE_DARK;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r.w / 2);
      glow.addColorStop(0, '#d8fff8');
      glow.addColorStop(1, '#8fd6cf');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = STONE_DARK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - r.w / 2, cy);
      ctx.lineTo(cx + r.w / 2, cy);
      ctx.moveTo(cx, cy - r.w / 2);
      ctx.lineTo(cx, cy + r.w / 2);
      ctx.stroke();
    },

    // ——— L'école étrange ———
    tabletop(a, r) {
      const { ctx, palette: p } = a;
      // Table géante qui flotte : plateau (on s'y pose) et pieds trop longs qui pendent.
      ctx.fillStyle = p.wood;
      ctx.fillRect(r.x + 3, r.y + T, 3, r.h - T);
      ctx.fillRect(r.x + r.w - 6, r.y + T, 3, r.h - T);
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        plank(a, c0, c1, row, p.wood, p.woodLight);
      }
    },
    bookstack(a, r) {
      const { ctx, palette: p } = a;
      // Pile de livres géants : tranches de largeurs inégales (plein).
      tileShape(a, r, p.wood, p.woodLight);
      ctx.strokeStyle = p.silhouettes ? 'rgba(140,240,225,0.35)' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      for (let y = r.y + 10; y < r.y + r.h; y += 9 + ((y * 7) % 7)) {
        ctx.beginPath();
        ctx.moveTo(r.x + 1, y);
        ctx.lineTo(r.x + r.w - 1, y);
        ctx.stroke();
      }
    },
    floatchair(a, r) {
      const { ctx, palette: p } = a;
      // Chaise d'écolier qui flotte : assise (pleine), dossier et pieds en silhouette.
      tileShape(a, r, p.wood, p.woodLight);
      ctx.fillStyle = p.wood;
      ctx.fillRect(r.x + r.w - 4, r.y - 2 * T, 3, 2 * T);
      ctx.fillRect(r.x + r.w - 10, r.y - 2 * T, 9, 4);
      ctx.fillRect(r.x + 2, r.y + T, 2, 1.5 * T);
      ctx.fillRect(r.x + r.w - 4, r.y + T, 2, 1.5 * T);
    },
    sorterlid(a, r) {
      const { ctx, level, palette: p } = a;
      // Le dessus de l'Educaville géante (D-155, à la place du couvercle de la boîte à formes de
      // D-64), plein ; le trou par lequel on passe. Sur sa tranche, de grosses touches du clavier et
      // le cadran de l'horloge, en creux.
      let start = -1;
      for (let col = r.x / T; col <= (r.x + r.w) / T; col++) {
        const solid = col < (r.x + r.w) / T && tileAt(level, col, r.y / T) === Tile.Solid;
        if (solid && start < 0) {
          start = col;
        } else if (!solid && start >= 0) {
          tileShape(a, { x: start * T, y: r.y, w: (col - start) * T, h: r.h }, p.wood, p.woodLight);
          start = -1;
        }
      }
      ctx.fillStyle = '#07080d';
      const cy = r.y + r.h / 2;
      for (const [x, kind] of [
        [r.x + 3 * T, 'key'],
        [r.x + 4.2 * T, 'key'],
        [r.x + 12 * T, 'clock'],
        [r.x + 32 * T, 'key'],
        [r.x + 39 * T, 'key'],
      ] as const) {
        ctx.beginPath();
        if (kind === 'key') {
          ctx.roundRect(x - 6, cy - 5, 12, 10, 3);
          ctx.fill();
        } else {
          ctx.arc(x, cy, 6.5, 0, Math.PI * 2);
          ctx.fill();
          // Les aiguilles, en relief sur le cadran sombre.
          ctx.strokeStyle = p.woodLight;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, cy);
          ctx.lineTo(x, cy - 4.5);
          ctx.moveTo(x, cy);
          ctx.lineTo(x + 3, cy + 1.5);
          ctx.stroke();
        }
      }
    },
  };
}

/**
 * Pointes de crayons géants (danger qui pique dans l'école étrange, `; @hazard: pencils`) :
 * des mines taillées, en silhouette, bord turquoise.
 */
export function drawPencils(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  inFloor: boolean,
): void {
  const base = inFloor ? y + 4 : y + T;
  for (let i = 0; i < 2; i++) {
    const px = x + 2 + i * 7;
    const h = 7 + ((col * 5 + i * 3) % 4);
    ctx.fillStyle = '#16112a';
    ctx.beginPath();
    ctx.moveTo(px, base);
    ctx.lineTo(px + 2.5, base - h);
    ctx.lineTo(px + 5, base);
    ctx.fill();
    ctx.strokeStyle = TURQUOISE;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = WOOD_LIGHT;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(px + 1, base - 2, 3, 2);
    ctx.globalAlpha = 1;
  }
}
