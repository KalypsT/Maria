import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * Le train (D-83, D-85), dessiné par le code en aplats doux. PLACEHOLDER : formes simples. Ce qu'on
 * foule (couchettes, tablette, filet, chariot, grille) suit exactement ses tuiles ; plafond,
 * portes et fenêtres sont du fond.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const ALU = '#a9b6c2';
const ALU_LIGHT = '#d3dde6';
const ALU_DARK = '#6f7d8a';
const MATTRESS = '#3f5386';
const MATTRESS_LIGHT = '#5c71a8';
const SHEET = '#efe8d8';
const VENEER = '#a27b58';
const VENEER_LIGHT = '#c49a72';
const VENEER_DARK = '#7c5b40';
const RUBBER = '#3b3f4c';
const RUBBER_LIGHT = '#575c6c';
const SUITCASES = ['#c8574a', '#e0b44f', '#5f7fb8', '#7aa66a', '#9b6fb3'] as const;

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 91.3 + y * 157.9) * 43758.5453;
  return n - Math.floor(n);
}

/** Lignes (tuiles) des planches traversables d'une colonne du rectangle, de haut en bas. */
function shelfRows(a: ArtContext, r: Rect, col: number): number[] {
  const rows: number[] = [];
  for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
    if (tileAt(a.level, col, row) === Tile.OneWay) {
      rows.push(row);
    }
  }
  return rows;
}

export function trainDrawers({ rounded, tileShape }: ShapeTools): Record<string, Drawer> {
  return {
    carceiling(a, r) {
      // Le plafond de la voiture : un bandeau clair, des plafonniers allongés (éteints la nuit,
      // une lueur pâle), les bouches d'aération.
      const { ctx } = a;
      ctx.fillStyle = 'rgba(232,226,212,0.55)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
      for (let x = r.x + 2 * T; x < r.x + r.w - 2 * T; x += 7 * T) {
        ctx.fillStyle = 'rgba(255,246,220,0.75)';
        rounded(ctx, { x, y: r.y + 3, w: 3 * T, h: 6 }, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(120,128,140,0.5)';
        for (let k = 0; k < 4; k++) {
          ctx.fillRect(x + 4 * T + k * 4, r.y + 4, 2, 6);
        }
      }
    },
    traindoor(a, r) {
      // Porte de bout de voiture (ou porte de la plateforme) : un battant gris-bleu, une vitre
      // haute, une poignée ; fermée.
      const { ctx } = a;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      rounded(ctx, { x: r.x - 3, y: r.y - 3, w: r.w + 6, h: r.h + 3 }, [6, 6, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#7f93a8';
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: r.h }, [5, 5, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#9fb2c4';
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = 'rgba(20,26,46,0.85)';
      rounded(ctx, { x: r.x + 8, y: r.y + 10, w: r.w - 16, h: r.h * 0.38 }, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,190,220,0.25)';
      ctx.beginPath();
      ctx.moveTo(r.x + 10, r.y + 12 + r.h * 0.3);
      ctx.lineTo(r.x + 20, r.y + 12);
      ctx.lineTo(r.x + 26, r.y + 12);
      ctx.lineTo(r.x + 14, r.y + 12 + r.h * 0.3);
      ctx.fill();
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(r.x + r.w - 12, r.y + r.h * 0.55, 6, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(r.x + r.w / 2 - 0.5, r.y + 4, 1, r.h - 4);
    },
    trainwindow(a, r) {
      // Grande fenêtre aux coins arrondis, cadre d'aluminium, un rideau retroussé en haut ; la vue
      // (le paysage qui défile) est un plan lointain derrière la vitre (D-85).
      const { ctx } = a;
      ctx.strokeStyle = ALU;
      ctx.lineWidth = 4;
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: r.h }, 10);
      ctx.stroke();
      ctx.strokeStyle = ALU_LIGHT;
      ctx.lineWidth = 1;
      rounded(ctx, { x: r.x - 1.5, y: r.y - 1.5, w: r.w + 3, h: r.h + 3 }, 11);
      ctx.stroke();
      // Rebord sous la vitre.
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(r.x - 4, r.y + r.h + 2, r.w + 8, 3);
      // Rideau roulé en haut, et ses deux cordons.
      ctx.fillStyle = '#8c3f55';
      rounded(ctx, { x: r.x + 4, y: r.y - 2, w: r.w - 8, h: 6 }, 3);
      ctx.fill();
      ctx.fillStyle = '#b25a73';
      ctx.fillRect(r.x + 4, r.y - 2, r.w - 8, 2);
      ctx.fillStyle = '#e6c27a';
      ctx.fillRect(r.x + 10, r.y + 4, 1, 5);
      ctx.fillRect(r.x + r.w - 11, r.y + 4, 1, 5);
    },
    trainlamp(a, r) {
      // Liseuse au-dessus des couchettes : un petit bras chromé, l'abat-jour allumé.
      const { ctx } = a;
      const x = r.x + r.w / 2;
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(x - 1, r.y, 2, r.h - 6);
      ctx.fillStyle = ALU;
      ctx.beginPath();
      ctx.moveTo(x - 6, r.y + r.h);
      ctx.lineTo(x - 3, r.y + r.h - 7);
      ctx.lineTo(x + 3, r.y + r.h - 7);
      ctx.lineTo(x + 6, r.y + r.h);
      ctx.closePath();
      ctx.fill();
      // Allumée le soir, éteinte la nuit (lumières éteintes, D-85).
      ctx.fillStyle = a.palette.glow >= 0.5 ? 'rgba(255,224,160,0.95)' : 'rgba(90,96,110,0.9)';
      ctx.fillRect(x - 5, r.y + r.h - 1.5, 10, 1.5);
    },
    partition(a, r) {
      // Cloison entre deux compartiments : du bois plaqué, une baguette claire, une applique de
      // numéro (sans chiffre).
      const { ctx } = a;
      ctx.fillStyle = VENEER;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = VENEER_LIGHT;
      ctx.fillRect(r.x, r.y, 2, r.h);
      ctx.fillStyle = VENEER_DARK;
      ctx.fillRect(r.x + r.w - 2, r.y, 2, r.h);
      ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3);
      ctx.fillStyle = ALU_LIGHT;
      rounded(ctx, { x: r.x + r.w / 2 - 3, y: r.y + r.h * 0.45, w: 6, h: 4 }, 1);
      ctx.fill();
    },
    accordiongate(a, r) {
      // La grille en accordéon entre les compartiments, à moitié dépliée : les plis de caoutchouc
      // et, en bas, une tuile libre (on glisse dessous, D-84).
      const { ctx } = a;
      ctx.fillStyle = RUBBER;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      for (let y = r.y + 2; y < r.y + r.h - 2; y += 5) {
        ctx.fillStyle = RUBBER_LIGHT;
        ctx.fillRect(r.x + 1, y, r.w - 2, 2);
      }
      // Le bas de la grille : une barre métallique, et l'ombre de l'espace libre dessous.
      ctx.fillStyle = ALU;
      ctx.fillRect(r.x - 1, r.y + r.h - 3, r.w + 2, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(r.x - 1, r.y + r.h, r.w + 2, 2);
    },
    bunks(a, r) {
      // Couchettes superposées contre la cloison : montants d'aluminium du plafond au plancher,
      // un matelas bleu et un drap sur chaque planche, une petite échelle.
      const { ctx } = a;
      const left = r.x;
      const right = r.x + r.w;
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(left + 1, r.y - 4, 2, r.h + 4);
      ctx.fillRect(right - 3, r.y - 4, 2, r.h + 4);
      const col = r.x / T + 1;
      for (const row of shelfRows(a, r, col)) {
        const y = row * T;
        // Planche (ce qu'on foule, exactement la tuile), matelas, drap, oreiller.
        ctx.fillStyle = ALU;
        ctx.fillRect(left, y + 6, r.w, 3);
        ctx.fillStyle = MATTRESS;
        rounded(ctx, { x: left + 1, y: y + 1, w: r.w - 2, h: 6 }, 2);
        ctx.fill();
        ctx.fillStyle = MATTRESS_LIGHT;
        ctx.fillRect(left + 2, y + 1, r.w - 4, 1.5);
        ctx.fillStyle = SHEET;
        rounded(ctx, { x: left + 3, y: y - 0.5, w: r.w * 0.55, h: 3 }, 1.5);
        ctx.fill();
        ctx.fillStyle = '#fbf7ee';
        rounded(ctx, { x: right - 13, y: y - 2.5, w: 10, h: 4.5 }, 2);
        ctx.fill();
        // Garde-corps des couchettes du haut (sangle).
        if (row < (r.y + r.h) / T - 6) {
          ctx.strokeStyle = 'rgba(40,46,70,0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(left + 4, y - 4);
          ctx.lineTo(right - 4, y - 4);
          ctx.stroke();
        }
      }
      // Échelle sur le côté.
      const lx = r.x + r.w / 2 - 3;
      ctx.strokeStyle = ALU_LIGHT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, r.y + T);
      ctx.lineTo(lx, r.y + r.h);
      ctx.moveTo(lx + 6, r.y + T);
      ctx.lineTo(lx + 6, r.y + r.h);
      for (let y = r.y + T + 4; y < r.y + r.h; y += 8) {
        ctx.moveTo(lx, y);
        ctx.lineTo(lx + 6, y);
      }
      ctx.stroke();
    },
    foldtable(a, r) {
      // Tablette sous la fenêtre, sur son pied replié en équerre jusqu'au plancher.
      const { ctx } = a;
      ctx.fillStyle = ALU_DARK;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 1, r.y + 4);
      ctx.lineTo(r.x + r.w / 2 + 1, r.y + 4);
      ctx.lineTo(r.x + r.w / 2 + 1, r.y + r.h);
      ctx.lineTo(r.x + r.w / 2 - 1, r.y + r.h);
      ctx.fill();
      ctx.fillRect(r.x + r.w / 2 - 6, r.y + r.h - 2, 12, 2);
      ctx.fillStyle = '#e4ddcf';
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 5 }, 2);
      ctx.fill();
      ctx.fillStyle = ALU;
      ctx.fillRect(r.x, r.y + 4, r.w, 1.5);
      // Une gourde et une petite boîte de biscuits.
      ctx.fillStyle = '#6aa6c9';
      rounded(ctx, { x: r.x + 10, y: r.y - 8, w: 5, h: 8 }, 2);
      ctx.fill();
      ctx.fillStyle = '#e2a14f';
      ctx.fillRect(r.x + r.w - 26, r.y - 5, 12, 5);
    },
    rack(a, r) {
      // Le filet à bagages, accroché à la paroi : une barre d'aluminium, le filet, des valises.
      const { ctx } = a;
      ctx.fillStyle = ALU_DARK;
      for (let x = r.x + 6; x < r.x + r.w; x += 5 * T) {
        ctx.fillRect(x, r.y - 6, 2, 10);
      }
      let x = r.x + 4;
      let k = 0;
      while (x < r.x + r.w - 20) {
        const w = 18 + hash(x, r.y) * 16;
        if (hash(x, r.y + 3) < 0.25) {
          x += w * 0.6;
          continue;
        }
        const h = 7 + hash(x, r.y + 7) * 5;
        ctx.fillStyle = SUITCASES[k % SUITCASES.length] ?? SUITCASES[0];
        rounded(ctx, { x, y: r.y - h + 1, w, h }, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x, r.y - 1.5, w, 1.5);
        x += w + 3;
        k++;
      }
      ctx.fillStyle = ALU;
      ctx.fillRect(r.x, r.y + 1, r.w, 3);
      ctx.strokeStyle = 'rgba(80,90,104,0.6)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let nx = r.x; nx < r.x + r.w; nx += 4) {
        ctx.moveTo(nx, r.y + 4);
        ctx.lineTo(nx + 3, r.y + 8);
      }
      ctx.stroke();
    },
    trolley(a, r) {
      // Le chariot du vendeur, garé : caisse inox, plateau de friandises, quatre roulettes. Les
      // roulettes laissent une tuile libre dessous (on glisse dessous, D-84).
      const { ctx } = a;
      const body = { x: r.x, y: r.y, w: r.w, h: 2 * T };
      ctx.fillStyle = '#b9c3cc';
      rounded(ctx, body, 3);
      ctx.fill();
      ctx.fillStyle = '#dfe6ec';
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let x = r.x + 8; x < r.x + r.w - 4; x += 10) {
        ctx.fillRect(x, r.y + 7, 1, 2 * T - 10);
      }
      // Sur le plateau : des paquets colorés.
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = SUITCASES[(k + 2) % SUITCASES.length] ?? SUITCASES[0];
        ctx.fillRect(r.x + 4 + k * 11, r.y - 5 - (k % 2) * 2, 8, 5 + (k % 2) * 2);
      }
      // Poignée.
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(r.x + r.w - 2, r.y - 8, 2, 10);
      ctx.fillRect(r.x + r.w - 8, r.y - 8, 8, 2);
      // Roulettes.
      ctx.fillStyle = RUBBER;
      for (const x of [r.x + 6, r.x + r.w - 6]) {
        ctx.fillRect(x - 1, r.y + 2 * T, 2, T - 5);
        ctx.beginPath();
        ctx.arc(x, r.y + r.h - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    // ——— Les compartiments (D-86) ———
    carbench(a, r) {
      // Banquette : l'assise (pleine, ses tuiles), le dossier haut et l'appui-tête dessinés derrière
      // (on passe devant).
      const { ctx } = a;
      const seatY = r.y + r.h - 2 * T;
      const backLeft = tileAt(a.level, r.x / T - 1, seatY / T) !== Tile.Empty;
      const bx = backLeft ? r.x : r.x + r.w - 6;
      ctx.fillStyle = '#3c4f7c';
      rounded(ctx, { x: bx, y: r.y, w: 6, h: seatY - r.y + 4 }, [3, 3, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#efe8d8';
      ctx.fillRect(bx + 1, r.y + 2, 4, 5);
      tileShape(a, { x: r.x, y: seatY, w: r.w, h: 2 * T }, '#4a6098', '#6b82b8');
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = r.x + 6; x < r.x + r.w; x += 10) {
        ctx.fillRect(x, seatY + 4, 1, 2 * T - 6);
      }
    },
    hatshelf(a, r) {
      // Étagère à chapeaux : une barre et ses consoles, un chapeau oublié.
      const { ctx } = a;
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(r.x + 2, r.y + 3, 2, 8);
      ctx.fillRect(r.x + r.w - 4, r.y + 3, 2, 8);
      ctx.fillStyle = ALU;
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#6e5038';
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y - 1, 9, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      rounded(ctx, { x: r.x + r.w / 2 - 5, y: r.y - 7, w: 10, h: 6 }, [4, 4, 0, 0]);
      ctx.fill();
    },
    suitcases(a, r) {
      // Une pile de valises (pleine, ses tuiles), de tailles et de couleurs différentes.
      const { ctx } = a;
      let y = r.y + r.h;
      let k = 0;
      while (y > r.y + 2) {
        const h = Math.min(y - r.y, 10 + hash(r.x, y) * 8);
        const inset = hash(y, r.x) * 4;
        ctx.fillStyle = SUITCASES[k % SUITCASES.length] ?? SUITCASES[0];
        rounded(ctx, { x: r.x + inset, y: y - h, w: r.w - inset - hash(k, y) * 4, h }, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(r.x + inset + 1, y - h + 1, r.w - inset - 6, 1.5);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(r.x + r.w / 2 - 3, y - h - 1.5, 6, 1.5);
        y -= h;
        k++;
      }
    },
    fallingcase() {
      // La valise elle-même est dessinée par `TrainRideView` (elle tremble, puis tombe).
    },
    // ——— Le fourgon (D-86) ———
    trunks(a, r) {
      tileShape(a, r, '#7a5638', '#9c7350');
      const { ctx } = a;
      ctx.fillStyle = '#c9a24e';
      for (let x = r.x + 6; x < r.x + r.w - 4; x += 14) {
        ctx.fillRect(x, r.y + 3, 2, r.h - 6);
      }
      ctx.fillRect(r.x + 2, r.y + r.h / 2, r.w - 4, 1.5);
    },
    cargocrates(a, r) {
      // Caisses de bois empilées, planches et clous.
      const { ctx } = a;
      tileShape(a, r, '#a67d4f', '#c9a070');
      ctx.strokeStyle = 'rgba(80,52,30,0.55)';
      ctx.lineWidth = 1;
      for (let y = r.y + T * 1.5; y < r.y + r.h; y += T * 1.5) {
        ctx.beginPath();
        ctx.moveTo(r.x + 1, y);
        ctx.lineTo(r.x + r.w - 1, y);
        ctx.stroke();
      }
      ctx.beginPath();
      for (let y = r.y; y < r.y + r.h - T; y += T * 1.5) {
        ctx.moveTo(r.x + 2, y + 2);
        ctx.lineTo(r.x + r.w - 2, y + T * 1.5 - 2);
      }
      ctx.stroke();
    },
    bike(a, r) {
      // Un vélo pendu par sa roue avant à un crochet ; son cadre est la planche où l'on se pose.
      const { ctx } = a;
      const y = r.y;
      ctx.strokeStyle = ALU_DARK;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2, y - 10);
      ctx.lineTo(r.x + r.w / 2, y - 3);
      ctx.stroke();
      ctx.strokeStyle = '#2f3440';
      ctx.lineWidth = 1.6;
      for (const cx of [r.x + 4, r.x + r.w - 4]) {
        ctx.beginPath();
        ctx.arc(cx, y + 9, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#c8473f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(r.x, y + 1.5);
      ctx.lineTo(r.x + r.w, y + 1.5);
      ctx.moveTo(r.x + 4, y + 9);
      ctx.lineTo(r.x + r.w / 2, y + 2);
      ctx.lineTo(r.x + r.w - 4, y + 9);
      ctx.stroke();
    },
    hookrail(a, r) {
      // Le rail des crochets, vissé sous le plafond par des tiges.
      const { ctx } = a;
      ctx.fillStyle = ALU_DARK;
      for (let x = r.x + 4; x < r.x + r.w; x += 3 * T) {
        ctx.fillRect(x, 2 * T, 2, r.y - 2 * T);
      }
      ctx.fillStyle = ALU;
      ctx.fillRect(r.x, r.y, r.w, 4);
      ctx.fillStyle = ALU_LIGHT;
      ctx.fillRect(r.x, r.y, r.w, 1);
      ctx.strokeStyle = ALU_DARK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = r.x + 6; x < r.x + r.w; x += 9) {
        ctx.moveTo(x, r.y + 4);
        ctx.arc(x + 2, r.y + 8, 2, Math.PI, Math.PI * 0.2, true);
      }
      ctx.stroke();
    },
    dogcrate(a, r) {
      // La caisse de transport du chien : grillagée devant, posée au sol (le chien y dort).
      const { ctx } = a;
      ctx.fillStyle = '#8f9aa8';
      rounded(ctx, r, 4);
      ctx.fill();
      ctx.fillStyle = '#20242e';
      rounded(ctx, { x: r.x + 4, y: r.y + 5, w: r.w - 8, h: r.h - 8 }, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,210,220,0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = r.x + 7; x < r.x + r.w - 4; x += 4) {
        ctx.moveTo(x, r.y + 5);
        ctx.lineTo(x, r.y + r.h - 3);
      }
      ctx.stroke();
    },
    parcels(a, r) {
      tileShape(a, r, '#c9a26e', '#dfbf8f');
      const { ctx } = a;
      ctx.fillStyle = 'rgba(120,80,40,0.5)';
      ctx.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
      ctx.fillRect(r.x, r.y + r.h / 2, r.w, 2);
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(r.x + 4, r.y + 4, 10, 6);
    },
    highshelf(a, r) {
      // Étagère haute sur ses deux consoles, des cartons dessus.
      const { ctx } = a;
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(r.x + 4, r.y + 3, 2, 10);
      ctx.fillRect(r.x + r.w - 6, r.y + 3, 2, 10);
      ctx.fillStyle = VENEER;
      ctx.fillRect(r.x, r.y, r.w, 4);
      ctx.fillStyle = VENEER_LIGHT;
      ctx.fillRect(r.x, r.y, r.w, 1.5);
      ctx.fillStyle = '#c9a26e';
      ctx.fillRect(r.x + r.w - 26, r.y - 10, 12, 10);
      ctx.fillRect(r.x + r.w - 12, r.y - 7, 9, 7);
    },
    roofladder(a, r) {
      // L'échelle de fer jusqu'à la trappe du plafond (la trappe entrouverte, la nuit dehors).
      const { ctx } = a;
      ctx.fillStyle = 'rgba(14,18,38,0.95)';
      ctx.fillRect(r.x - 4, r.y - 4, r.w + 8, 10);
      ctx.strokeStyle = ALU_DARK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r.x + 3, r.y);
      ctx.lineTo(r.x + 3, r.y + r.h);
      ctx.moveTo(r.x + r.w - 3, r.y);
      ctx.lineTo(r.x + r.w - 3, r.y + r.h);
      for (let y = r.y + 8; y < r.y + r.h; y += 9) {
        ctx.moveTo(r.x + 3, y);
        ctx.lineTo(r.x + r.w - 3, y);
      }
      ctx.stroke();
    },
    // ——— Le toit (D-86) ———
    carroof(a, r) {
      // Une voiture vue de dehors : le toit bombé (ce qu'on foule, ses tuiles), la caisse bleue, ses
      // fenêtres éclairées (ou éteintes, la nuit), le filet blanc.
      const { ctx, level } = a;
      tileShape(a, r, '#3d5f8f', '#5c7fb0');
      ctx.fillStyle = '#8a9db5';
      for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
        for (let row = r.y / T; row < r.y / T + 3; row++) {
          if (
            tileAt(level, col, row) === Tile.Solid &&
            tileAt(level, col, row - 1) === Tile.Empty
          ) {
            ctx.fillRect(col * T, row * T, T, 3);
          }
        }
      }
      const body = r.y + 3 * T;
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(r.x, body + 2 * T, r.w, 3);
      for (let x = r.x + 10; x < r.x + r.w - 20; x += 26) {
        ctx.fillStyle = hash(x, body) < 0.3 ? 'rgba(255,214,140,0.85)' : 'rgba(26,34,62,0.9)';
        rounded(ctx, { x, y: body + 4, w: 16, h: 14 }, 3);
        ctx.fill();
      }
    },
    gangway(a, r) {
      // Le soufflet entre deux voitures, plus bas que les toits : des plis de caoutchouc.
      const { ctx } = a;
      tileShape(a, r, RUBBER, RUBBER_LIGHT);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let x = r.x + 3; x < r.x + r.w; x += 5) {
        ctx.fillRect(x, r.y + 2, 1.5, r.h - 2);
      }
    },
    roofvent(a, r) {
      tileShape(a, r, '#7d8a99', '#a5b2c0');
      const { ctx } = a;
      ctx.fillStyle = 'rgba(30,36,48,0.6)';
      for (let x = r.x + 3; x < r.x + r.w - 2; x += 4) {
        ctx.fillRect(x, r.y + 5, 2, r.h - 8);
      }
    },
    kitchenchimney(a, r) {
      // La cheminée de la cuisine : un conduit d'inox, son chapeau ; un filet de vapeur.
      tileShape(a, r, '#9aa6b2', '#c6d0d9');
      const { ctx } = a;
      ctx.fillStyle = '#6f7d8a';
      ctx.fillRect(r.x - 3, r.y, r.w + 6, 3);
      ctx.fillStyle = 'rgba(230,236,244,0.35)';
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2 - 6, r.y - 10, 7, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(r.x + r.w / 2 - 16, r.y - 16, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    roofhatch(a, r) {
      // La trappe du wagon-restaurant, rabattue : un cadre et le trou sombre (on y descend, Agir).
      const { ctx } = a;
      ctx.fillStyle = '#5c7fb0';
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
      ctx.fillStyle = '#7f93a8';
      ctx.save();
      ctx.translate(r.x + r.w, r.y + r.h - 4);
      ctx.rotate(-1.1);
      ctx.fillRect(0, -3, r.w - 4, 3);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,210,140,0.35)';
      ctx.fillRect(r.x + 4, r.y + r.h - 3, r.w - 8, 3);
    },
    // ——— Le wagon-restaurant (D-86) ———
    diningtable(a, r) {
      // Une table et sa nappe, les chaises retournées dessus (fermé la nuit) ; le pied jusqu'au sol.
      const { ctx } = a;
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(r.x + r.w / 2 - 1.5, r.y + 4, 3, r.h - 4);
      ctx.fillRect(r.x + r.w / 2 - 8, r.y + r.h - 2, 16, 2);
      ctx.fillStyle = '#f3ead7';
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 6 }, 2);
      ctx.fill();
      ctx.fillStyle = '#c86a6a';
      ctx.fillRect(r.x, r.y + 4, r.w, 2);
      ctx.strokeStyle = VENEER_DARK;
      ctx.lineWidth = 1.6;
      for (const side of [-1, 1]) {
        const cx = r.x + r.w / 2 + side * r.w * 0.22;
        ctx.beginPath();
        ctx.moveTo(cx - 6, r.y);
        ctx.lineTo(cx + 6, r.y);
        ctx.moveTo(cx - 5, r.y);
        ctx.lineTo(cx - 6, r.y - 9);
        ctx.moveTo(cx + 5, r.y);
        ctx.lineTo(cx + 6, r.y - 9);
        ctx.moveTo(cx + side * 6, r.y);
        ctx.lineTo(cx + side * 6, r.y + 6);
        ctx.stroke();
      }
    },
    barcounter(a, r) {
      // Le comptoir : bois sombre, plateau clair, tabourets devant, une caisse enregistreuse.
      tileShape(a, r, VENEER_DARK, VENEER);
      const { ctx } = a;
      ctx.fillStyle = '#e4ddcf';
      ctx.fillRect(r.x - 2, r.y, r.w + 4, 3);
      ctx.fillStyle = '#5a6b7a';
      ctx.fillRect(r.x + r.w - 20, r.y - 8, 12, 8);
      ctx.fillStyle = ALU;
      for (let x = r.x + 8; x < r.x + r.w - 8; x += 22) {
        ctx.fillRect(x, r.y + 2 * T, 2, r.h - 2 * T);
        ctx.fillStyle = '#c86a6a';
        rounded(ctx, { x: x - 5, y: r.y + 2 * T - 3, w: 12, h: 4 }, 2);
        ctx.fill();
        ctx.fillStyle = ALU;
      }
    },
    glassrack(a, r) {
      // Le porte-verres pendu au-dessus du comptoir : des verres à l'envers.
      const { ctx } = a;
      ctx.fillStyle = ALU_DARK;
      ctx.fillRect(r.x + 2, 2 * T, 1.5, r.y - 2 * T);
      ctx.fillRect(r.x + r.w - 3.5, 2 * T, 1.5, r.y - 2 * T);
      ctx.fillStyle = ALU;
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = 'rgba(210,230,240,0.6)';
      for (let x = r.x + 3; x < r.x + r.w - 3; x += 7) {
        ctx.fillRect(x, r.y + 3, 4, 6);
      }
    },
    bottleshelf(a, r) {
      // L'étagère des bouteilles, accrochée au mur.
      const { ctx } = a;
      ctx.fillStyle = VENEER;
      ctx.fillRect(r.x, r.y, r.w, 4);
      const colors = ['#4f7a4a', '#8a3f55', '#c9a24e', '#5f7fb8'];
      for (let x = r.x + 4, k = 0; x < r.x + r.w - 6; x += 9, k++) {
        ctx.fillStyle = colors[k % colors.length] ?? '#4f7a4a';
        rounded(ctx, { x, y: r.y - 11, w: 5, h: 11 }, [2, 2, 0, 0]);
        ctx.fill();
        ctx.fillRect(x + 1.5, r.y - 15, 2, 5);
      }
    },
    kitchendoor(a, r) {
      // La porte battante de la cuisine, son hublot ; une lueur turquoise passe dessous (PR 5).
      const { ctx } = a;
      ctx.fillStyle = '#b9c3cc';
      rounded(ctx, r, [4, 4, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#dfe6ec';
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = 'rgba(20,26,46,0.85)';
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h * 0.3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(r.x + r.w / 2 - 0.5, r.y + 4, 1, r.h - 4);
      const glow = ctx.createLinearGradient(0, r.y + r.h - 8, 0, r.y + r.h);
      glow.addColorStop(0, 'rgba(110,228,214,0)');
      glow.addColorStop(1, 'rgba(120,236,220,0.75)');
      ctx.fillStyle = glow;
      ctx.fillRect(r.x - 6, r.y + r.h - 8, r.w + 12, 8);
    },
    hatchladder(a, r) {
      // L'échelle sous la trappe du toit, et la trappe ouverte sur la nuit.
      const { ctx } = a;
      ctx.fillStyle = 'rgba(14,18,38,0.95)';
      ctx.fillRect(r.x - 4, r.y - 4, r.w + 8, 10);
      ctx.strokeStyle = ALU_DARK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r.x + 3, r.y);
      ctx.lineTo(r.x + 3, r.y + r.h);
      ctx.moveTo(r.x + r.w - 3, r.y);
      ctx.lineTo(r.x + r.w - 3, r.y + r.h);
      for (let y = r.y + 8; y < r.y + r.h; y += 9) {
        ctx.moveTo(r.x + 3, y);
        ctx.lineTo(r.x + r.w - 3, y);
      }
      ctx.stroke();
    },
  };
}
