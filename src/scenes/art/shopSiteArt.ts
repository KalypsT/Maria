import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * La supérette et le chantier du quartier (D-63), dessinés par le code en aplats doux. PLACEHOLDER :
 * formes simples. Ce qu'on foule (caisse, étagères, frigos, cartons, mur, banche, flèche, mât)
 * suit exactement ses tuiles ; montants, câbles et vitrines sont du fond.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const METAL = '#8a9aa5';
const METAL_LIGHT = '#b8c4cc';
const CARDBOARD = '#c9a46b';
const CARDBOARD_LIGHT = '#e2c28e';
const YELLOW = '#e8b23a';
const YELLOW_DARK = '#b98a22';
const CONCRETE = '#b7b2a8';
const CONCRETE_LIGHT = '#d4d0c7';
const PRODUCTS = ['#e2574c', '#f2c14e', '#8cc26f', '#6d86c2', '#e38aa0', '#f3ead7'] as const;

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 57.3 + y * 191.9) * 43758.5453;
  return n - Math.floor(n);
}

/** Lignes d'un rectangle où se trouvent des tuiles traversables, en segments (col0, col1, ligne). */
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

/** Produits alignés sur une étagère (boîtes, bouteilles, paquets de couleurs). */
function products(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number): void {
  for (let x = x0 + 2; x < x1 - 3; x += 5) {
    const k = Math.floor(hash(x, y) * PRODUCTS.length);
    const h = 4 + Math.floor(hash(y, x) * 5);
    ctx.fillStyle = PRODUCTS[k] ?? '#e2574c';
    ctx.fillRect(x, y - h, 4, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y - h, 4, 1);
  }
}

export function shopSiteDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
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
    // ——— La supérette ———
    shopwindow(a, r) {
      const { ctx } = a;
      // La vitrine, vue de l'intérieur : la rue claire derrière, des lettres à l'envers effacées.
      ctx.fillStyle = '#e6e0d0';
      ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
      ctx.fillStyle = '#bcdcee';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#f1e3c8';
      ctx.fillRect(r.x, r.y + r.h * 0.45, r.w, r.h * 0.55);
      ctx.fillStyle = '#9a958d';
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(r.x + 4, r.y + 3, 2, r.h - 8);
      ctx.fillRect(r.x + 9, r.y + 3, 1, r.h - 12);
    },
    stockroom(a, r) {
      const { ctx } = a;
      // La réserve : un mur plus sombre, une ampoule nue, des cartons dans l'ombre (fond).
      ctx.fillStyle = 'rgba(70,60,50,0.18)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(120,96,64,0.25)';
      for (let k = 0; k < 6; k++) {
        const x = r.x + 6 + hash(k, r.x) * (r.w - 30);
        const h = 18 + hash(r.x, k) * 22;
        ctx.fillRect(x, r.y + r.h - h, 22, h);
      }
      // L'ampoule nue d'avant est remplacée par un tube fluorescent sous le faux plafond (D-78).
    },
    checkout(a, r) {
      const { ctx } = a;
      // La caisse : comptoir, tapis roulant, petite caisse enregistreuse.
      tileShape(a, r, '#6d86c2', '#98ade0');
      ctx.fillStyle = '#3b3440';
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 18, 3);
      ctx.fillStyle = '#e6e0d0';
      ctx.fillRect(r.x + r.w - 13, r.y - 9, 10, 9);
      ctx.fillStyle = '#3b3440';
      ctx.fillRect(r.x + r.w - 11, r.y - 7, 6, 3);
    },
    shelfunit(a, r) {
      const { ctx } = a;
      // Rayonnage : deux montants jusqu'au sol, un fond, les étagères (on s'y pose) et les produits.
      ctx.fillStyle = 'rgba(80,70,60,0.18)';
      ctx.fillRect(r.x + T / 2, r.y, r.w - T, r.h);
      ctx.fillStyle = METAL;
      ctx.fillRect(r.x + T / 2 - 1, r.y, 2, r.h);
      ctx.fillRect(r.x + r.w - T / 2 - 1, r.y, 2, r.h);
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        products(ctx, c0 * T, (c1 + 1) * T, row * T);
        plank(a, c0, c1, row, METAL, METAL_LIGHT);
      }
    },
    cooler(a, r) {
      const { ctx } = a;
      // Frigos à portes vitrées : on grimpe dessus (plein).
      tileShape(a, r, '#e6e0d0', '#ffffff');
      ctx.fillStyle = '#bcdcee';
      for (let x = r.x + 3; x < r.x + r.w - 3; x += r.w / 2) {
        ctx.fillRect(x, r.y + 6, r.w / 2 - 6, r.h - 12);
        for (let y = r.y + 14; y < r.y + r.h - 8; y += 14) {
          products(ctx, x, x + r.w / 2 - 6, y);
        }
      }
    },
    cartonrack(a, r) {
      const { ctx, level } = a;
      // Pile de cartons sur un rayonnage métallique : on passe dessous ; les pieds vont au sol.
      let top = -1;
      let bottom = -1;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        if (tileAt(level, r.x / T, row) === Tile.Solid) {
          top = top < 0 ? row : top;
          bottom = row;
        }
      }
      if (top < 0) {
        return;
      }
      const floor = (r.y + r.h) / T;
      ctx.fillStyle = METAL;
      ctx.fillRect(r.x + 1, (bottom + 1) * T, 2, (floor - bottom - 1) * T);
      ctx.fillRect(r.x + r.w - 3, (bottom + 1) * T, 2, (floor - bottom - 1) * T);
      ctx.fillRect(r.x, (bottom + 1) * T - 1, r.w, 3);
      const block = { x: r.x, y: top * T, w: r.w, h: (bottom - top + 1) * T };
      tileShape(a, block, CARDBOARD, CARDBOARD_LIGHT);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let y = block.y + T; y < block.y + block.h; y += T) {
        ctx.beginPath();
        ctx.moveTo(block.x + 1, y);
        ctx.lineTo(block.x + block.w - 1, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#d9c99e';
      ctx.fillRect(block.x + block.w / 2 - 1.5, block.y, 3, block.h);
    },
    stockshelf(a, r) {
      const { ctx } = a;
      // Mezzanine métallique devant la porte de la réserve, sur pilotis jusqu'au sol (D-78 :
      // avant, une étagère murale) ; on passe entre les pilotis.
      let floor = r.y / T + 1;
      while (floor < a.level.height && tileAt(a.level, r.x / T, floor) !== Tile.Solid) {
        floor++;
      }
      ctx.fillStyle = METAL;
      for (const x of [r.x + 3, r.x + r.w - 5]) {
        ctx.fillRect(x, r.y + 3, 2, floor * T - r.y - 3);
      }
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 4, r.y + 3 * T);
      ctx.lineTo(r.x + r.w - 4, r.y + 6 * T);
      ctx.moveTo(r.x + r.w - 4, r.y + 3 * T);
      ctx.lineTo(r.x + 4, r.y + 6 * T);
      ctx.stroke();
      tileShape(a, r, METAL, METAL_LIGHT);
    },

    antenna(a, r) {
      const { ctx } = a;
      // Antenne sur le toit de la supérette : un mât et une barre où l'on se pose (D-63, revisite
      // avec le parapluie).
      const cx = r.x + r.w / 2;
      ctx.fillStyle = METAL;
      ctx.fillRect(cx - 1, r.y + 2, 2, r.h - 2);
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const dy of [6, 10]) {
        ctx.moveTo(cx - 6, r.y + dy);
        ctx.lineTo(cx + 6, r.y + dy);
      }
      ctx.stroke();
      plank(a, r.x / T, (r.x + r.w) / T - 1, r.y / T, '#4d5a63', METAL_LIGHT);
    },

    // ——— Le chantier ———
    crane(a, r) {
      const { ctx, level } = a;
      // Grue : mât en treillis (plein, au bord droit du rectangle), flèche (on y marche), cabine,
      // contre-flèche et son contrepoids. La cabine reste hors d'atteinte (§25.3).
      // Le mât : les colonnes pleines les plus à droite du rectangle (un mur voisin peut y entrer).
      const solidIn = (col: number) => {
        for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
          if (tileAt(level, col, row) === Tile.Solid) {
            return true;
          }
        }
        return false;
      };
      let mast1 = (r.x + r.w) / T - 1;
      while (mast1 >= r.x / T && !solidIn(mast1)) {
        mast1--;
      }
      let mast0 = mast1;
      while (mast0 - 1 >= r.x / T && solidIn(mast0 - 1)) {
        mast0--;
      }
      let jibRow = -1;
      for (let row = r.y / T; row < (r.y + r.h) / T && jibRow < 0; row++) {
        for (let col = r.x / T; col < mast0; col++) {
          if (tileAt(level, col, row) === Tile.OneWay) {
            jibRow = row;
            break;
          }
        }
      }
      if (mast0 < 0 || jibRow < 0) {
        return;
      }
      const mx = mast0 * T;
      const mw = (mast1 - mast0 + 1) * T;
      let mastTop = r.y / T;
      while (tileAt(level, mast0, mastTop) !== Tile.Solid) {
        mastTop++;
      }
      // Mât.
      ctx.fillStyle = YELLOW;
      ctx.fillRect(mx, mastTop * T, 3, r.y + r.h - mastTop * T);
      ctx.fillRect(mx + mw - 3, mastTop * T, 3, r.y + r.h - mastTop * T);
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let y = mastTop * T; y < r.y + r.h - T; y += T) {
        ctx.moveTo(mx + 2, y);
        ctx.lineTo(mx + mw - 2, y + T);
      }
      ctx.stroke();
      ctx.fillStyle = YELLOW_DARK;
      ctx.fillRect(mx, mastTop * T, mw, 3);
      // Cabine et contre-flèche à droite du mât (fond, hors d'atteinte).
      ctx.fillStyle = '#e6e0d0';
      ctx.fillRect(mx + mw, (mastTop + 1) * T, 2.5 * T, 2 * T);
      ctx.fillStyle = '#bcdcee';
      ctx.fillRect(mx + mw + 4, (mastTop + 1) * T + 4, 2.5 * T - 8, T - 2);
      ctx.fillStyle = '#7a7066';
      ctx.fillRect(mx + mw + 2.5 * T, (jibRow - 1) * T, 1.5 * T, 2 * T);
      // Flèche : treillis sous les planches où l'on marche, et le haut de la flèche (fond).
      // Seulement la rangée de la flèche : les planches de l'échafaudage ont leur propre dessin.
      const runs = oneWayRuns(a, r).filter(([, , row]) => row === jibRow);
      for (const [c0, c1, row] of runs) {
        const x0 = c0 * T;
        const x1 = (c1 + 1) * T;
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, row * T - 2 * T);
        ctx.lineTo(x1, row * T - 2 * T);
        for (let x = x0; x < x1; x += T) {
          ctx.moveTo(x, row * T);
          ctx.lineTo(x + T / 2, row * T - 2 * T);
          ctx.lineTo(x + T, row * T);
        }
        ctx.moveTo(x1, row * T - 2 * T);
        ctx.lineTo(mx + mw, (mastTop - 1) * T);
        ctx.stroke();
        plank(a, c0, c1, row, YELLOW, '#f6d77a');
      }
    },
    banche(a, r) {
      const { ctx } = a;
      // Banche (panneau de coffrage) pendue à la grue par deux élingues ; ouverte dessous.
      const hookX = r.x + r.w + 5 * T;
      ctx.strokeStyle = '#4d5a63';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 3, r.y);
      ctx.lineTo(hookX, r.y - 4 * T);
      ctx.moveTo(r.x + r.w - 3, r.y);
      ctx.lineTo(hookX, r.y - 4 * T);
      ctx.moveTo(hookX, r.y - 4 * T);
      ctx.lineTo(hookX, 4 * T);
      ctx.stroke();
      ctx.fillStyle = '#4d5a63';
      ctx.fillRect(hookX - 3, r.y - 4 * T - 4, 6, 5);
      tileShape(a, r, '#c96f4f', '#e2957a');
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = r.y + T; y < r.y + r.h; y += 2 * T) {
        ctx.fillRect(r.x + 2, y, r.w - 4, 2);
      }
    },
    concretewall(a, r) {
      const { ctx } = a;
      // Mur de béton frais, traces de coffrage et fers qui dépassent en haut.
      tileShape(a, r, CONCRETE, CONCRETE_LIGHT);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = r.y + 2 * T; y < r.y + r.h; y += 3 * T) {
        ctx.fillRect(r.x + 1, y, r.w - 2, 1.5);
      }
      ctx.strokeStyle = '#7a5a40';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const dx of [5, 13, 21, 29, 37, 45].filter((d) => d < r.w - 2)) {
        ctx.moveTo(r.x + dx, r.y);
        ctx.lineTo(r.x + dx, r.y - 5);
      }
      ctx.stroke();
    },
    ceilingpanels(a, r) {
      // Faux plafond : dalles claires, joints métalliques, une bordure sous le bord (D-78).
      const { ctx, level } = a;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (tileAt(level, col, row) !== Tile.Solid) {
            continue;
          }
          ctx.fillStyle = '#d9d4c6';
          ctx.fillRect(col * T, row * T, T, T);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          if (col % 2 === 0) {
            ctx.fillRect(col * T, row * T, 1, T);
          }
          if (row % 2 === 0) {
            ctx.fillRect(col * T, row * T, T, 1);
          }
          if (tileAt(level, col, row + 1) !== Tile.Solid) {
            ctx.fillStyle = METAL;
            ctx.fillRect(col * T, (row + 1) * T - 3, T, 3);
          }
        }
      }
    },
    tube(a, r) {
      // Tube fluorescent sous le faux plafond, dans sa réglette.
      const { ctx } = a;
      ctx.fillStyle = METAL;
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#f8fbff';
      ctx.fillRect(r.x + 2, r.y + 3, r.w - 4, 3);
    },
    tubeflicker(a, r) {
      // Même tube ; son clignotement est animé (WorldLifeView).
      const { ctx } = a;
      ctx.fillStyle = METAL;
      ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#e8eef4';
      ctx.fillRect(r.x + 2, r.y + 3, r.w - 4, 3);
    },
    fan(a, r) {
      // Ventilateur de plafond : la tige et le moyeu ; les pales tournent (animées).
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#5b5f66';
      ctx.fillRect(cx - 1, r.y, 2, r.h - 6);
      ctx.beginPath();
      ctx.ellipse(cx, r.y + r.h - 5, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    promo(a, r) {
      // Affiche de la supérette, dessinée : une pomme, une étoile, une flèche (pas de texte).
      const { ctx } = a;
      ctx.fillStyle = '#f6e04a';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#e2574c';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      ctx.fillStyle = '#e2574c';
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.35, r.y + r.h * 0.55, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d9152';
      ctx.fillRect(r.x + r.w * 0.35 - 0.5, r.y + r.h * 0.55 - 10, 1.5, 5);
      ctx.fillStyle = '#e2574c';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const t = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? 8 : 3.5;
        ctx.lineTo(
          r.x + r.w * 0.72 + Math.cos(t) * radius,
          r.y + r.h * 0.38 + Math.sin(t) * radius,
        );
      }
      ctx.fill();
    },
    opensky(a, r) {
      // La rangée pleine du haut, dessinée comme du ciel (D-78) : on la découpe, le ciel des plans
      // lointains se voit. Elle reste pleine (le bord de la salle l'est aussi).
      const { ctx } = a;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    },
    backfacade(a, r) {
      // L'arrière de la supérette, côté chantier : un mur crépi, une fenêtre, la porte de la
      // réserve à mi-hauteur, au palier de l'escalier de secours (D-134) ; le rebord de pierre en
      // haut en est le parapet.
      const { ctx } = a;
      ctx.fillStyle = '#e4e0d4';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = r.y + 6; y < r.y + r.h; y += 9) {
        ctx.fillRect(r.x, y, r.w, 1);
      }
      ctx.fillStyle = '#9a958d';
      ctx.fillRect(r.x + T - 1, r.y + 4 * T - 1, 2.6 * T + 2, 2.2 * T + 2);
      ctx.fillStyle = '#bcdcee';
      ctx.fillRect(r.x + T, r.y + 4 * T, 2.6 * T, 2.2 * T);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(r.x + 2.3 * T, r.y + 4 * T, 1, 2.2 * T);
    },
    tarp() {
      // Animée (WorldLifeView) : la bâche claque au vent.
    },
    fireescape(a, r) {
      const { ctx, level } = a;
      // Escalier de secours (D-134), du palier de la porte de la réserve jusqu'au sol : des
      // paliers en caillebotis (les planches de la salle), une volée en biais de l'un à l'autre,
      // un garde-corps, des poteaux jusqu'au sol.
      const runs = oneWayRuns(a, r).sort((p, q) => p[2] - q[2]);
      let ground = (r.y + r.h) / T;
      while (ground < level.height && tileAt(level, r.x / T + 1, ground) === Tile.Empty) {
        ground++;
      }
      ctx.strokeStyle = '#4d5a63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [c0, c1, row] of runs) {
        for (const x of [c0 * T + 2, (c1 + 1) * T - 2]) {
          ctx.moveTo(x, row * T + 4);
          ctx.lineTo(x, ground * T);
        }
      }
      ctx.stroke();
      // Volées : du bout d'un palier au début du suivant, avec leurs marches.
      for (let i = 0; i + 1 < runs.length; i++) {
        const upper = runs[i];
        const lower = runs[i + 1];
        if (!upper || !lower) {
          continue;
        }
        const towardRight = lower[0] >= upper[0];
        const x0 = towardRight ? (upper[1] + 1) * T - 4 : upper[0] * T + 4;
        const x1 = towardRight ? lower[0] * T + 2 * T : (lower[1] + 1) * T - 2 * T;
        const y0 = upper[2] * T + 2;
        const y1 = lower[2] * T;
        ctx.strokeStyle = '#4d5a63';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.strokeStyle = METAL_LIGHT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 1; k < 6; k++) {
          const x = x0 + ((x1 - x0) * k) / 6;
          const y = y0 + ((y1 - y0) * k) / 6;
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const [c0, c1, row] of runs) {
        const top = row * T - 1.1 * T;
        ctx.moveTo(c0 * T, top);
        ctx.lineTo((c1 + 1) * T, top);
        for (let x = c0 * T + 3; x < (c1 + 1) * T; x += 8) {
          ctx.moveTo(x, top);
          ctx.lineTo(x, row * T);
        }
      }
      ctx.stroke();
      for (const [c0, c1, row] of runs) {
        plank(a, c0, c1, row, '#4d5a63', METAL_LIGHT);
      }
    },
    floodlight(a, r) {
      const { ctx } = a;
      // Lampe de chantier sur un poteau : son chapeau est un perchoir (la trouvaille s'y pose).
      const cx = r.x + r.w / 2;
      // La lampe est juste sous le chapeau (D-78 : avant, le chapeau flottait au-dessus).
      ctx.fillStyle = '#4d5a63';
      ctx.fillRect(cx - 1.5, r.y + 11, 3, r.h - 11);
      ctx.fillRect(cx - 5, r.y + r.h - 3, 10, 3);
      ctx.fillStyle = '#fff1b8';
      ctx.beginPath();
      ctx.moveTo(cx - 7, r.y + 4);
      ctx.lineTo(cx + 7, r.y + 4);
      ctx.lineTo(cx + 4, r.y + 11);
      ctx.lineTo(cx - 4, r.y + 11);
      ctx.fill();
      plank(a, r.x / T, (r.x + r.w) / T - 1, r.y / T, '#4d5a63', '#8a9aa5');
    },
  };
}

/**
 * Gravats du chantier (danger qui pique, D-56, `; @hazard: rubble`) : morceaux de briques et fers
 * tordus, gris et ocre ; on les distingue des orties du jardin et des briques de jeu de la maison.
 */
export function drawRubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  inFloor: boolean,
): void {
  const base = inFloor ? y + 4 : y + T - 2;
  for (let i = 0; i < 3; i++) {
    const bx = x + 1 + i * 5;
    const h = 3 + ((col * 7 + i * 5) % 4);
    ctx.fillStyle = i % 2 === 0 ? '#9c8b72' : '#b5634f';
    ctx.beginPath();
    ctx.moveTo(bx, base);
    ctx.lineTo(bx + 1.5, base - h);
    ctx.lineTo(bx + 4.5, base - h + 1);
    ctx.lineTo(bx + 5, base);
    ctx.fill();
  }
  ctx.strokeStyle = '#5b4a44';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 3 + (col % 3) * 3, base);
  ctx.lineTo(x + 6 + (col % 3) * 3, base - 7);
  ctx.lineTo(x + 8 + (col % 3) * 3, base - 6);
  ctx.stroke();
}
