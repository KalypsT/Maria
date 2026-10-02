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

export function trainDrawers({ rounded }: ShapeTools): Record<string, Drawer> {
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
  };
}
