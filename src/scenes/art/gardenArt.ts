import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ArtContext, Rect } from './roomArt';

/**
 * Le jardin (D-46) dessiné par le code, en aplats doux comme la maison (D-28) : feuillage, tronc,
 * branches, bacs du potager, pergola, remise, clôture, vieux mur. PLACEHOLDER : pas d'image clé
 * pour l'instant. Les meubles suivent exactement leurs tuiles (pilier 1) ; le fond (façade, soleil,
 * tuteurs) n'a pas de collision.
 */

/** Outils de dessin partagés avec `roomArt` (passés en paramètre : pas d'import circulaire). */
export interface ShapeTools {
  readonly tileShape: (a: ArtContext, r: Rect, fill: string, light: string, shade?: string) => void;
  readonly rounded: (ctx: CanvasRenderingContext2D, r: Rect, radius: number | number[]) => void;
}

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

type Drawer = (a: ArtContext, r: Rect) => void;

export function gardenDrawers({ tileShape, rounded }: ShapeTools): Record<string, Drawer> {
  /**
   * Feuillage en volumes : aplat, touffes de trois tons, bord supérieur éclairé en festons (dans
   * la tuile : la surface praticable reste exactement le haut de la collision), bas plus sombre.
   */
  const leaves: Drawer = (a, r) => {
    const { ctx, level, palette: p } = a;
    tileShape(a, r, p.leaf, p.leaf, 'rgba(0,0,0,0.18)');
    if (p.silhouettes) {
      return;
    }
    const solid = (col: number, row: number) => tileAt(level, col, row) === Tile.Solid;
    for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
      for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
        if (!solid(col, row)) {
          continue;
        }
        const x = col * T;
        const y = row * T;
        // Touffes sombres puis claires.
        for (let i = 0; i < 5; i++) {
          const h = hash(col * 5 + i, row * 3);
          ctx.fillStyle = i < 2 ? p.leafDark : i < 4 ? p.leaf : p.leafLight;
          ctx.globalAlpha = i < 2 ? 0.5 : 0.8;
          ctx.beginPath();
          ctx.arc(x + 2 + h * 12, y + 3 + hash(row + i, col) * 10, 2.2 + h * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (!solid(col, row - 1)) {
          // Festons éclairés par le soleil.
          ctx.fillStyle = p.leafLight;
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(x + 3 + k * 5, y + 3.2, 3, Math.PI, 0);
            ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,255,220,0.35)';
          ctx.fillRect(x + 1, y + 0.5, T - 2, 1);
        }
        if (!solid(col, row + 1)) {
          ctx.fillStyle = p.leafDark;
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(x + 3 + k * 5, y + T - 2, 3, 0, Math.PI);
            ctx.fill();
          }
        }
      }
    }
  };

  /** Planches d'extérieur : aplat, joints verticaux, veinures, clous. */
  const planks = (a: ArtContext, r: Rect, step: number) => {
    const { ctx, palette: p } = a;
    tileShape(a, r, p.wood, p.woodLight);
    if (p.silhouettes) {
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let x = r.x + step; x < r.x + r.w - 1; x += step) {
      ctx.fillRect(x, r.y + 2, 1, r.h - 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let x = r.x + 2; x < r.x + r.w - 2; x += step) {
      for (let y = r.y + 6; y < r.y + r.h - 3; y += 9) {
        ctx.fillRect(x + hash(x, y) * (step - 3), y, 2.5, 0.8);
      }
    }
    ctx.fillStyle = 'rgba(60,40,30,0.45)';
    for (let x = r.x + step / 2; x < r.x + r.w; x += step) {
      ctx.fillRect(x - 0.5, r.y + 3, 1, 1);
      if (r.h > 2 * T) {
        ctx.fillRect(x - 0.5, r.y + r.h - 5, 1, 1);
      }
    }
  };

  /** Première ligne pleine (ou traversable) sous (col, row) : le sol où poser un poteau. */
  const groundBelow = (a: ArtContext, col: number, row: number): number => {
    let y = row + 1;
    while (y < a.level.height && tileAt(a.level, col, y) === Tile.Empty) {
      y++;
    }
    return y;
  };

  return {
    canopy: leaves,
    hedge: leaves,
    bush(a, r) {
      leaves(a, r);
      if (a.palette.silhouettes) {
        return;
      }
      // Petites fleurs roses et blanches : on y voit un buisson fleuri, pas un mur.
      const { ctx } = a;
      for (let x = r.x + 4; x < r.x + r.w - 3; x += 7) {
        for (let y = r.y + 6; y < r.y + r.h - 3; y += 9) {
          const h = hash(x, y);
          if (h < 0.45) {
            continue;
          }
          ctx.fillStyle = h > 0.8 ? '#fff6f0' : '#e58fa6';
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.arc(x + Math.cos(k * 1.57) * 1.2, y + Math.sin(k * 1.57) * 1.2, 1, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#f2c14e';
          ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
      }
    },
    treetrunk(a, r) {
      const { ctx, palette: p } = a;
      if (p.silhouettes) {
        tileShape(a, r, p.wood, p.wood);
        return;
      }
      // Volume : sombre sur les côtés, clair au milieu (le soleil vient d'en haut à gauche).
      const g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
      g.addColorStop(0, '#5e4330');
      g.addColorStop(0.35, '#8a6546');
      g.addColorStop(0.7, '#7b5a3e');
      g.addColorStop(1, '#4f3827');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // Écorce : longues crevasses ondulées.
      ctx.strokeStyle = 'rgba(40,26,16,0.45)';
      ctx.lineWidth = 1.2;
      for (let x = r.x + 5; x < r.x + r.w - 3; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, r.y);
        for (let y = r.y; y <= r.y + r.h; y += 10) {
          ctx.lineTo(x + Math.sin(y / 23 + x) * 2, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,230,190,0.18)';
      ctx.lineWidth = 1;
      for (let x = r.x + 9; x < r.x + r.w - 3; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, r.y);
        for (let y = r.y; y <= r.y + r.h; y += 14) {
          ctx.lineTo(x + Math.cos(y / 19 + x) * 2, y);
        }
        ctx.stroke();
      }
      // Deux nœuds.
      for (const [fx, fy] of [
        [0.62, 0.42],
        [0.3, 0.72],
      ] as const) {
        ctx.fillStyle = '#4a3423';
        ctx.beginPath();
        ctx.ellipse(r.x + r.w * fx, r.y + r.h * fy, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9a7552';
        ctx.beginPath();
        ctx.ellipse(r.x + r.w * fx, r.y + r.h * fy, 5.5, 7.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Mousse au nord (à gauche) et racines en arche jusqu'au sol.
      ctx.fillStyle = 'rgba(111,154,98,0.55)';
      for (let y = r.y + r.h * 0.5; y < r.y + r.h; y += 7) {
        ctx.beginPath();
        ctx.ellipse(r.x + 2, y, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const foot = r.y + r.h;
      ctx.fillStyle = '#6b4d35';
      ctx.beginPath();
      ctx.moveTo(r.x - 18, foot + 3 * T);
      ctx.quadraticCurveTo(r.x - 2, foot + T, r.x + 4, foot - 2);
      ctx.lineTo(r.x + r.w - 4, foot - 2);
      ctx.quadraticCurveTo(r.x + r.w + 2, foot + T, r.x + r.w + 18, foot + 3 * T);
      ctx.lineTo(r.x + r.w + 6, foot + 3 * T);
      ctx.quadraticCurveTo(r.x + r.w - 6, foot + 1.5 * T, r.x + r.w / 2, foot + 1.3 * T);
      ctx.quadraticCurveTo(r.x + 6, foot + 1.5 * T, r.x - 6, foot + 3 * T);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,26,16,0.35)';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.3, foot);
      ctx.quadraticCurveTo(r.x + r.w * 0.2, foot + T, r.x - 8, foot + 2.6 * T);
      ctx.moveTo(r.x + r.w * 0.7, foot);
      ctx.quadraticCurveTo(r.x + r.w * 0.8, foot + T, r.x + r.w + 8, foot + 2.6 * T);
      ctx.stroke();
    },
    branch(a, r) {
      const { ctx, level, palette: p } = a;
      // Branche qui s'amincit en s'éloignant du tronc (le tronc est du côté plein).
      const fromLeft = tileAt(level, r.x / T - 1, r.y / T) === Tile.Solid;
      const base = 6;
      const tip = 3;
      ctx.fillStyle = p.silhouettes ? p.wood : '#7b5a3e';
      ctx.beginPath();
      const x0 = fromLeft ? r.x : r.x + r.w;
      const x1 = fromLeft ? r.x + r.w : r.x;
      ctx.moveTo(x0, r.y);
      ctx.lineTo(x1, r.y);
      ctx.lineTo(x1, r.y + tip);
      ctx.quadraticCurveTo((x0 + x1) / 2, r.y + base + 1, x0, r.y + base + 2);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = '#a8805a';
      ctx.fillRect(r.x, r.y, r.w, 1.5);
      // Rameaux et bouquets de feuilles qui pendent, un bouquet plus gros au bout.
      for (let x = r.x + 5; x < r.x + r.w - 2; x += 8) {
        const h = hash(x, r.y);
        ctx.fillStyle = h > 0.5 ? p.leafLight : p.leaf;
        ctx.beginPath();
        ctx.ellipse(x, r.y + 8 + h * 2, 2.6, 3.8, 0.4, 0, Math.PI * 2);
        ctx.ellipse(x + 3, r.y + 7, 2.2, 3.2, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p.leaf;
      ctx.beginPath();
      ctx.arc(x1 + (fromLeft ? -3 : 3), r.y + 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.leafLight;
      ctx.beginPath();
      ctx.arc(x1 + (fromLeft ? -4 : 4), r.y + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    },
    planter(a, r) {
      const { ctx, palette: p } = a;
      if (p.silhouettes) {
        planks(a, r, 8);
        return;
      }
      // Caisse de planches horizontales, poteaux d'angle, terre et légumes.
      tileShape(a, r, p.wood, p.woodLight);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let y = r.y + 7; y < r.y + r.h - 2; y += 7) {
        ctx.fillRect(r.x + 3, y, r.w - 6, 1);
      }
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x, r.y, 3, r.h);
      ctx.fillRect(r.x + r.w - 3, r.y, 3, r.h);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(r.x + 3, r.y + 2, r.w - 6, 3);
      const kinds = ['cabbage', 'carrot', 'lettuce'] as const;
      for (let x = r.x + 6; x < r.x + r.w - 4; x += 9) {
        const kind = kinds[Math.floor(hash(x, r.y) * 3)] ?? 'cabbage';
        if (kind === 'cabbage') {
          ctx.fillStyle = '#6f9a62';
          ctx.beginPath();
          ctx.arc(x, r.y - 1, 4, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#9cc48a';
          ctx.beginPath();
          ctx.arc(x, r.y, 2.4, Math.PI, 0);
          ctx.fill();
        } else if (kind === 'carrot') {
          ctx.strokeStyle = '#7fb85e';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let k = -1; k <= 1; k++) {
            ctx.moveTo(x, r.y + 1);
            ctx.lineTo(x + k * 2.5, r.y - 5);
          }
          ctx.stroke();
          ctx.fillStyle = '#e07b4f';
          ctx.fillRect(x - 1.2, r.y + 1, 2.4, 3);
        } else {
          ctx.fillStyle = '#9cc48a';
          ctx.beginPath();
          ctx.ellipse(x - 2, r.y - 1, 2.5, 3.5, -0.5, 0, Math.PI * 2);
          ctx.ellipse(x + 2, r.y - 1, 2.5, 3.5, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    pergola(a, r) {
      const { ctx, palette: p } = a;
      // Poteaux (fond, sans collision) sur socle, jambes de force, toit de lattes, glycine.
      const posts = [r.x + 2 * T, r.x + r.w - 3 * T];
      for (const x of posts) {
        ctx.fillStyle = p.woodDark;
        ctx.fillRect(x, r.y + 4, 6, r.h - 4);
        ctx.fillStyle = 'rgba(255,230,190,0.2)';
        ctx.fillRect(x + 1, r.y + 4, 1.5, r.h - 4);
        ctx.fillStyle = '#b8ab94';
        ctx.fillRect(x - 2, r.y + r.h - 4, 10, 4);
        ctx.strokeStyle = p.woodDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 10, r.y + 5);
        ctx.lineTo(x, r.y + 18);
        ctx.moveTo(x + 16, r.y + 5);
        ctx.lineTo(x + 6, r.y + 18);
        ctx.stroke();
      }
      ctx.fillStyle = p.wood;
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 5 }, 2);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = p.woodLight;
      ctx.fillRect(r.x, r.y, r.w, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let x = r.x + 6; x < r.x + r.w; x += 8) {
        ctx.fillRect(x, r.y + 1, 1, 4);
      }
      // Glycine qui retombe en grappes mauves.
      for (let x = r.x + 4; x < r.x + r.w - 2; x += 9) {
        const h = hash(x, 3);
        ctx.fillStyle = p.leaf;
        ctx.beginPath();
        ctx.ellipse(x, r.y + 6, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        if (h > 0.4) {
          const len = 6 + h * 8;
          for (let k = 0; k < len; k += 2.2) {
            ctx.fillStyle = k % 4 < 2 ? '#b99ad6' : '#d3bdea';
            ctx.beginPath();
            ctx.arc(x + 1, r.y + 8 + k, 1.6 - k / (len * 1.4), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
    gardentable(a, r) {
      const { ctx, palette: p } = a;
      if (p.silhouettes) {
        tileShape(a, r, p.wood, p.wood);
        return;
      }
      // Nappe à carreaux qui retombe, pieds visibles dessous, citronnade et deux verres.
      tileShape(a, r, '#f3ede0', '#fffaf0');
      ctx.fillStyle = 'rgba(229,143,166,0.45)';
      for (let x = r.x + 2; x < r.x + r.w - 2; x += 6) {
        ctx.fillRect(x, r.y + 2, 3, r.h - 4);
      }
      for (let y = r.y + 4; y < r.y + r.h - 2; y += 6) {
        ctx.fillRect(r.x + 2, y, r.w - 4, 2.5);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3);
      ctx.fillStyle = 'rgba(250,236,150,0.9)';
      rounded(ctx, { x: r.x + r.w / 2 - 3, y: r.y - 9, w: 6, h: 9 }, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(r.x + r.w / 2 - 2, r.y - 8, 1, 6);
      ctx.fillStyle = 'rgba(210,235,245,0.8)';
      ctx.fillRect(r.x + r.w / 2 + 7, r.y - 5, 3, 5);
      ctx.fillRect(r.x + r.w / 2 - 11, r.y - 5, 3, 5);
    },
    flowerpot(a, r) {
      const { ctx, palette: p } = a;
      tileShape(a, r, p.silhouettes ? p.wood : '#c7704a', p.silhouettes ? p.wood : '#e08d66');
      if (p.silhouettes) {
        return;
      }
      // Rebord, tiges et fleurs de trois couleurs.
      ctx.fillStyle = '#a95a3a';
      ctx.fillRect(r.x, r.y + 2, r.w, 2);
      const colors = ['#f2c14e', '#e58fa6', '#ffffff', '#b99ad6'];
      for (let x = r.x + 4; x < r.x + r.w - 2; x += 5) {
        const h = hash(x, r.y);
        const top = r.y - 4 - h * 5;
        ctx.strokeStyle = '#6f9a62';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, r.y);
        ctx.lineTo(x, top);
        ctx.stroke();
        ctx.fillStyle = colors[Math.floor(h * 4)] ?? '#ffffff';
        for (let k = 0; k < 5; k++) {
          const ang = (k * 2 * Math.PI) / 5;
          ctx.beginPath();
          ctx.arc(x + Math.cos(ang) * 1.6, top + Math.sin(ang) * 1.6, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f2c14e';
        ctx.fillRect(x - 0.6, top - 0.6, 1.2, 1.2);
      }
    },
    shed(a, r) {
      const { ctx, palette: p } = a;
      planks(a, r, 7);
      if (p.silhouettes) {
        return;
      }
      // Toit de tuiles qui déborde, porte, fenêtre à croisillon, outils appuyés.
      ctx.fillStyle = '#9b5b4a';
      rounded(ctx, { x: r.x - 3, y: r.y, w: r.w + 6, h: 6 }, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let x = r.x; x < r.x + r.w; x += 5) {
        ctx.fillRect(x, r.y + 1, 1, 4);
      }
      ctx.fillStyle = p.woodDark;
      rounded(
        ctx,
        { x: r.x + r.w * 0.55, y: r.y + r.h - 4.5 * T, w: 2.5 * T, h: 4.5 * T },
        [4, 4, 0, 0],
      );
      ctx.fill();
      ctx.fillStyle = '#f2c879';
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.55 + 2.5 * T - 5, r.y + r.h - 2.2 * T, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfe6f2';
      rounded(ctx, { x: r.x + r.w * 0.18, y: r.y + 3 * T, w: 18, h: 14 }, 2);
      ctx.fill();
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x + r.w * 0.18 + 8.5, r.y + 3 * T, 1.5, 14);
      ctx.fillRect(r.x + r.w * 0.18, r.y + 3 * T + 6, 18, 1.5);
      ctx.fillStyle = '#6f9a62';
      rounded(ctx, { x: r.x + r.w * 0.18 - 2, y: r.y + 3 * T + 14, w: 22, h: 4 }, 2);
      ctx.fill();
    },
    fence(a, r) {
      const { ctx, palette: p } = a;
      if (p.silhouettes) {
        planks(a, r, 6);
        return;
      }
      // Lattes à pointe (dans la collision : le dessus reste droit et praticable), deux traverses.
      tileShape(a, r, p.wood, p.woodLight);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = r.x + 6; x < r.x + r.w; x += 6) {
        ctx.fillRect(x, r.y + 4, 1, r.h - 4);
      }
      ctx.fillStyle = p.woodLight;
      for (let x = r.x; x < r.x + r.w; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, r.y + 5);
        ctx.lineTo(x + 3, r.y + 1.5);
        ctx.lineTo(x + 5.5, r.y + 5);
        ctx.fill();
      }
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x, r.y + 2 * T, r.w, 3);
      ctx.fillRect(r.x, r.y + r.h - 2 * T, r.w, 3);
      // Lierre qui grimpe par endroits.
      ctx.fillStyle = p.leaf;
      for (let x = r.x + 10; x < r.x + r.w; x += 37) {
        for (let y = r.y + r.h; y > r.y + r.h * 0.4; y -= 5) {
          ctx.beginPath();
          ctx.ellipse(x + Math.sin(y / 7) * 3, y, 2.4, 1.8, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    oldwall(a, r) {
      const { ctx, level, palette: p } = a;
      if (p.silhouettes) {
        tileShape(a, r, p.structure, p.structure);
        return;
      }
      tileShape(a, r, '#a89478', '#cdbb9d');
      // Pierres de tailles variées, joints de mortier, mousse sur le dessus, lierre.
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (tileAt(level, col, row) !== Tile.Solid) {
            continue;
          }
          const x = col * T;
          const y = row * T;
          for (let half = 0; half < 2; half++) {
            const offset = (row * 2 + half) % 2 === 0 ? 0 : 7;
            for (let sx = x - offset; sx < x + T; sx += 11) {
              const h = hash(sx, y + half);
              ctx.fillStyle = h < 0.33 ? '#b9a688' : h < 0.66 ? '#9f8b70' : '#ae9a7e';
              const left = Math.max(x, sx + 0.8);
              const right = Math.min(x + T, sx + 10.2);
              if (right > left) {
                rounded(ctx, { x: left, y: y + half * 8 + 0.8, w: right - left, h: 6.4 }, 1.5);
                ctx.fill();
              }
            }
          }
          if (tileAt(level, col, row - 1) === Tile.Empty) {
            ctx.fillStyle = p.leafLight;
            ctx.fillRect(x, y, T, 2);
            ctx.fillStyle = p.leaf;
            ctx.beginPath();
            ctx.arc(x + 4 + hash(col, row) * 8, y + 2, 2.2, 0, Math.PI);
            ctx.fill();
          }
          if (
            tileAt(level, col, row + 1) === Tile.Empty &&
            tileAt(level, col, row - 1) === Tile.Solid
          ) {
            // Linteau en bois au-dessus du portail, et le passage dans l'ombre dessous.
            ctx.fillStyle = p.woodDark;
            ctx.fillRect(x, y + T - 4, T, 4);
            const depth = groundBelow(a, col, row) * T - (y + T);
            const g = ctx.createLinearGradient(0, y + T, 0, y + T + depth);
            g.addColorStop(0, 'rgba(60,50,40,0.45)');
            g.addColorStop(1, 'rgba(60,50,40,0.1)');
            ctx.fillStyle = g;
            ctx.fillRect(x, y + T, T, depth);
          }
        }
      }
      // Quelques pieds de lierre, de longueurs inégales, qui pendent du haut du mur.
      for (let x = r.x + 14 + hash(r.x, r.y) * 30; x < r.x + r.w - 6; x += 70 + hash(x, 1) * 60) {
        const length = r.h * (0.2 + hash(x, 2) * 0.4);
        for (let y = r.y + 2; y < r.y + length; y += 4) {
          ctx.fillStyle = hash(x, y) > 0.5 ? p.leafDark : p.leaf;
          ctx.beginPath();
          ctx.ellipse(x + Math.sin(y / 11 + x) * 5, y, 2.6, 2, 0.5, 0, Math.PI * 2);
          ctx.fill();
          if (hash(y, x) > 0.7) {
            ctx.beginPath();
            ctx.ellipse(x + Math.sin(y / 11 + x) * 5 + 4, y + 2, 2.2, 1.6, -0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
    deck(a, r) {
      const { ctx, level, palette: p } = a;
      // Plancher de la cabane : planches, et deux jambes de force jusqu'au tronc ou à la haie.
      const x0 = r.x + 6;
      const x1 = r.x + r.w - 6;
      if (level.meta.world !== 'strange') {
        ctx.strokeStyle = p.woodDark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x0, r.y + 4);
        ctx.lineTo(x0 + 2 * T, r.y + 3 * T);
        ctx.moveTo(x1, r.y + 4);
        ctx.lineTo(Math.min(x1 + 2 * T, level.width * T - T), r.y + 3 * T);
        ctx.stroke();
      }
      tileShape(a, r, p.wood, p.woodLight);
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = r.x + 7; x < r.x + r.w; x += 7) {
        ctx.fillRect(x, r.y + 1, 1, T - 2);
      }
    },
    crate(a, r) {
      const { ctx, palette: p } = a;
      planks(a, r, 8);
      if (p.silhouettes) {
        return;
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(r.x + 2, r.y + 2);
      ctx.lineTo(r.x + r.w - 2, r.y + r.h - 2);
      ctx.stroke();
    },
    hangingchest(a, r) {
      const { ctx, palette: p } = a;
      // Cordes jusqu'au toit, puis le coffre.
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r.x + 4, 0);
      ctx.lineTo(r.x + 4, r.y);
      ctx.moveTo(r.x + r.w - 4, 0);
      ctx.lineTo(r.x + r.w - 4, r.y);
      ctx.stroke();
      planks(a, r, 8);
      if (!p.silhouettes) {
        ctx.fillStyle = '#e6c27a';
        ctx.fillRect(r.x + r.w / 2 - 2, r.y + r.h / 2, 4, 3);
      }
    },
    beanpoles(a, r) {
      const { ctx, level, palette: p } = a;
      // Chaque planche est tenue par deux perches croisées plantées dans le sol ou dans un bac
      // (fond) : rien ne flotte. Haricots grimpants et gousses.
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 1.6;
      const planks: { x0: number; x1: number; y: number; ground: number }[] = [];
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (
            tileAt(level, col, row) !== Tile.OneWay ||
            tileAt(level, col - 1, row) === Tile.OneWay
          ) {
            continue;
          }
          let end = col;
          while (tileAt(level, end + 1, row) === Tile.OneWay) {
            end++;
          }
          planks.push({
            x0: col * T,
            x1: (end + 1) * T,
            y: row * T,
            ground: groundBelow(a, col, row) * T,
          });
        }
      }
      ctx.beginPath();
      for (const k of planks) {
        const mid = (k.x0 + k.x1) / 2;
        ctx.moveTo(mid - 10, k.ground + 2);
        ctx.lineTo(mid + 4, k.y - 6);
        ctx.moveTo(mid + 10, k.ground + 2);
        ctx.lineTo(mid - 4, k.y - 6);
      }
      ctx.stroke();
      if (p.silhouettes) {
        return;
      }
      ctx.strokeStyle = '#d8c7a0';
      ctx.lineWidth = 1;
      for (const k of planks) {
        const mid = (k.x0 + k.x1) / 2;
        ctx.beginPath();
        ctx.moveTo(mid - 3, k.y - 3);
        ctx.lineTo(mid + 3, k.y - 1);
        ctx.stroke();
        // Vrilles et feuilles le long des perches, quelques gousses.
        for (let y = k.y; y < k.ground; y += 6) {
          const t = (y - k.y) / Math.max(1, k.ground - k.y);
          for (const side of [-1, 1]) {
            const x = mid + side * (4 + t * 14) + Math.sin(y / 5) * 1.5;
            ctx.fillStyle = hash(x, y) > 0.5 ? p.leafLight : p.leaf;
            ctx.beginPath();
            ctx.ellipse(x, y, 2.4, 1.6, side * 0.7, 0, Math.PI * 2);
            ctx.fill();
            if (hash(y, x) > 0.8) {
              ctx.fillStyle = '#9cc48a';
              ctx.fillRect(x + 1, y + 1, 1.3, 5);
            }
          }
        }
      }
    },
    facade(a, r) {
      const { ctx, palette: p } = a;
      // Mur de la maison : crépi, chaînage d'angle en pierre, gouttière, fenêtre à volets.
      ctx.fillStyle = '#e8dcc6';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      for (let y = r.y; y < r.y + r.h; y += 3) {
        ctx.fillRect(r.x, y + hash(y, 1) * 2, r.w, 0.8);
      }
      ctx.fillStyle = '#cbbd9f';
      for (let y = r.y + 4; y < r.y + r.h; y += 10) {
        ctx.fillRect(r.x + r.w - (y % 20 < 10 ? 10 : 6), y, y % 20 < 10 ? 10 : 6, 8);
      }
      ctx.fillStyle = '#9b5b4a';
      ctx.fillRect(r.x, r.y, r.w + 4, 5);
      ctx.fillStyle = '#8a8f96';
      ctx.fillRect(r.x + r.w - 3, r.y + 5, 2.5, r.h - 5);
      if (p.silhouettes) {
        return;
      }
      const wx = r.x + T;
      const wy = r.y + 4 * T;
      ctx.fillStyle = '#6d86c2';
      ctx.fillRect(wx - 6, wy - 1, 5, 2 * T + 2);
      ctx.fillRect(wx + T + 5, wy - 1, 5, 2 * T + 2);
      ctx.fillStyle = p.nightLow;
      rounded(ctx, { x: wx, y: wy, w: T + 4, h: 2 * T }, 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(wx + (T + 4) / 2 - 0.5, wy, 1, 2 * T);
      ctx.fillStyle = '#c7704a';
      ctx.fillRect(wx - 2, wy + 2 * T, T + 8, 3);
      ctx.fillStyle = '#e58fa6';
      for (let x = wx; x < wx + T + 4; x += 4) {
        ctx.beginPath();
        ctx.arc(x + 1, wy + 2 * T - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    backdoor(a, r) {
      const { ctx, level, palette: p } = a;
      // Porte de derrière (D-46), battant ouvert contre le mur, côté pièce : une vitre et une
      // poignée placée haut (trop haut pour Céleste avant qu'elle grandisse).
      const inside = r.x / T < level.width / 2 ? 1 : -1;
      const w = 2 * T;
      const x = inside > 0 ? r.x + T : r.x - w;
      ctx.fillStyle = p.woodDark;
      rounded(ctx, { x, y: r.y, w, h: r.h }, [3, 3, 0, 0]);
      ctx.fill();
      ctx.fillStyle = p.wood;
      rounded(ctx, { x: x + 2, y: r.y + 2, w: w - 4, h: r.h - 2 }, [2, 2, 0, 0]);
      ctx.fill();
      ctx.fillStyle = p.outdoor ? '#e6f0d6' : '#bfe3b0';
      rounded(ctx, { x: x + 6, y: r.y + 6, w: w - 12, h: 1.6 * T }, 2);
      ctx.fill();
      ctx.fillStyle = '#f2c879';
      ctx.beginPath();
      ctx.arc(inside > 0 ? x + w - 5 : x + 5, r.y + 2.6 * T, 1.8, 0, Math.PI * 2);
      ctx.fill();
    },
    sun(a, r) {
      const { ctx, palette: p } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r.w);
      g.addColorStop(0, 'rgba(255,244,190,0.9)');
      g.addColorStop(1, 'rgba(255,244,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - r.w, cy - r.w, 2 * r.w, 2 * r.w);
      ctx.fillStyle = p.moon;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w / 3, 0, Math.PI * 2);
      ctx.fill();
    },
    gatecord(a, r) {
      const { ctx, palette: p } = a;
      // De la droite du bas (le portillon) au plafond du passage, puis en haut à gauche, le long
      // du mur, jusqu'à la chevillette (un petit bout de bois) qui pend dans la cheminée.
      const right = r.x + r.w - 10;
      // Juste sous le linteau (dessiné par-dessus le fond), pour rester visible.
      const ceiling = r.y + r.h + 3;
      const wallX = r.x + T - 1.5;
      // Ficelle rouge, bien visible sur la pierre : elle mène l'œil du portillon à la chevillette.
      ctx.strokeStyle = '#b5534a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(right, ceiling + 4);
      ctx.lineTo(right, ceiling);
      ctx.lineTo(wallX, ceiling);
      ctx.lineTo(wallX, r.y + 8);
      ctx.stroke();
      ctx.fillStyle = p.woodDark;
      rounded(ctx, { x: wallX - 3, y: r.y + 4, w: 6, h: 12 }, 3);
      ctx.fill();
      ctx.fillStyle = p.woodLight;
      ctx.fillRect(wallX - 1.5, r.y + 6, 1.5, 8);
    },
    hedgetunnel(a, r) {
      const { ctx, palette: p } = a;
      // Passage sous la haie (fond) : la haie continue derrière, dans l'ombre, et une frange de
      // feuilles pend au-dessus du passage : elle ne flotte pas.
      ctx.fillStyle = p.leafDark;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(20,30,20,0.35)';
      rounded(ctx, { x: r.x + 3, y: r.y + 3, w: r.w - 6, h: r.h - 3 }, [8, 8, 0, 0]);
      ctx.fill();
      ctx.fillStyle = p.leaf;
      for (let x = r.x + 2; x < r.x + r.w - 1; x += 4) {
        ctx.beginPath();
        ctx.ellipse(x, r.y + 2 + hash(x, r.y) * 3, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    hedgehole(a, r) {
      const { ctx } = a;
      // Un creux sombre dans la haie du fond, trop serré pour passer (pour plus tard, §25.3).
      const g = ctx.createRadialGradient(
        r.x + r.w / 2,
        r.y + r.h * 0.6,
        0,
        r.x + r.w / 2,
        r.y + r.h * 0.6,
        r.w / 2,
      );
      g.addColorStop(0, 'rgba(24,28,40,0.9)');
      g.addColorStop(0.7, 'rgba(30,40,40,0.5)');
      g.addColorStop(1, 'rgba(30,40,40,0)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    },
    // Derrière la haie (D-49) : le jardin à une échelle démesurée, en silhouettes.
    giantstake(a, r) {
      const { ctx, palette: p } = a;
      tileShape(a, r, p.woodDark, p.silhouettes ? p.woodDark : p.woodLight);
      // Ficelle nouée, comme sur les tuteurs du potager.
      ctx.strokeStyle = p.silhouettes ? p.rim : '#d8c7a0';
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      for (let y = r.y + 3 * T; y < r.y + r.h; y += 5 * T) {
        ctx.beginPath();
        ctx.moveTo(r.x, y);
        ctx.lineTo(r.x + r.w, y + 3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    giantflower(a, r) {
      const { ctx, palette: p } = a;
      // Une fleur plus haute qu'un arbre, penchée : tige, feuilles, corolle (fond, sans collision).
      ctx.fillStyle = p.silhouettes ? p.wallBottom : p.leafDark;
      ctx.globalAlpha = p.silhouettes ? 0.9 : 1;
      const cx = r.x + r.w / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 2, r.y + r.h + 3 * T);
      ctx.quadraticCurveTo(cx + r.w * 0.3, r.y + r.h * 0.5, cx + r.w * 0.2, r.y + r.w * 0.4);
      ctx.lineTo(cx + r.w * 0.2 + 4, r.y + r.w * 0.4);
      ctx.quadraticCurveTo(cx + r.w * 0.3 + 4, r.y + r.h * 0.5, cx + 2, r.y + r.h + 3 * T);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - r.w * 0.15, r.y + r.h * 0.6, r.w * 0.25, r.w * 0.08, -0.5, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 7; i++) {
        const angle = (i * 2 * Math.PI) / 7;
        ctx.beginPath();
        ctx.ellipse(
          cx + r.w * 0.2 + Math.cos(angle) * r.w * 0.22,
          r.y + r.w * 0.4 + Math.sin(angle) * r.w * 0.22,
          r.w * 0.16,
          r.w * 0.08,
          angle,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (p.silhouettes) {
        ctx.fillStyle = `rgba(${p.lamp},0.35)`;
        ctx.beginPath();
        ctx.arc(cx + r.w * 0.2, r.y + r.w * 0.4, r.w * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    giantcan(a, r) {
      const { ctx, palette: p } = a;
      // L'arrosoir de papa, géant, qui flotte de travers (fond, sans collision).
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(-0.25);
      ctx.fillStyle = p.silhouettes ? p.wallBottom : '#7fa37a';
      ctx.beginPath();
      ctx.roundRect(-r.w * 0.3, -r.h * 0.35, r.w * 0.6, r.h * 0.7, 6);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(r.w * 0.25, r.h * 0.1);
      ctx.lineTo(r.w * 0.55, -r.h * 0.3);
      ctx.moveTo(-r.w * 0.2, -r.h * 0.35);
      ctx.quadraticCurveTo(0, -r.h * 0.65, r.w * 0.2, -r.h * 0.35);
      ctx.stroke();
      ctx.restore();
    },
    cushions(a, r) {
      const { ctx } = a;
      const colors = ['#e58fa6', '#8fb8e5', '#f2c14e'];
      colors.forEach((color, i) => {
        ctx.fillStyle = color;
        rounded(ctx, { x: r.x + i * 14, y: r.y + T - 7, w: 12, h: 7 }, 3);
        ctx.fill();
      });
    },
  };
}
