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
  /** Feuillage : aplat, puis touffes plus claires et plus sombres, dans les tuiles seulement. */
  const leaves: Drawer = (a, r) => {
    const { ctx, level, palette: p } = a;
    tileShape(a, r, p.leaf, p.leafLight, 'rgba(0,0,0,0.15)');
    if (p.silhouettes) {
      return;
    }
    for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
      for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
        if (tileAt(level, col, row) !== Tile.Solid) {
          continue;
        }
        for (let i = 0; i < 3; i++) {
          const h = hash(col * 3 + i, row);
          ctx.fillStyle = h < 0.5 ? p.leafLight : p.leafDark;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(
            col * T + 3 + h * 10,
            row * T + 4 + hash(row, col + i) * 8,
            2 + h * 2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  /** Bois clair d'extérieur, planches verticales. */
  const planks = (a: ArtContext, r: Rect, step: number) => {
    const { ctx, palette: p } = a;
    tileShape(a, r, p.wood, p.woodLight);
    if (p.silhouettes) {
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    for (let x = r.x + step; x < r.x + r.w - 1; x += step) {
      ctx.fillRect(x, r.y + 2, 1, r.h - 2);
    }
  };

  return {
    canopy: leaves,
    hedge: leaves,
    bush(a, r) {
      leaves(a, r);
      if (a.palette.silhouettes) {
        return;
      }
      // Quelques baies roses : on y voit un buisson, pas un mur.
      const { ctx } = a;
      ctx.fillStyle = '#e58fa6';
      for (let x = r.x + 5; x < r.x + r.w - 3; x += 11) {
        ctx.beginPath();
        ctx.arc(x, r.y + 10 + hash(x, r.y) * 10, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    treetrunk(a, r) {
      const { ctx, palette: p } = a;
      tileShape(a, r, p.silhouettes ? p.wood : '#7b5a3e', p.silhouettes ? p.wood : '#9a7552');
      if (p.silhouettes) {
        return;
      }
      // Écorce : longues stries, un nœud ; racines qui s'étalent au pied.
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      for (let x = r.x + 5; x < r.x + r.w - 3; x += 9) {
        ctx.beginPath();
        ctx.moveTo(x, r.y);
        for (let y = r.y; y < r.y + r.h; y += 12) {
          ctx.lineTo(x + (hash(x, y) - 0.5) * 3, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(r.x + r.w * 0.6, r.y + r.h * 0.45, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7b5a3e';
      const foot = r.y + r.h;
      ctx.beginPath();
      ctx.moveTo(r.x - 14, foot + 3 * T);
      ctx.quadraticCurveTo(r.x, foot + T, r.x + 6, foot);
      ctx.lineTo(r.x + r.w - 6, foot);
      ctx.quadraticCurveTo(r.x + r.w, foot + T, r.x + r.w + 14, foot + 3 * T);
      ctx.lineTo(r.x + r.w + 6, foot + 3 * T);
      ctx.quadraticCurveTo(r.x + r.w - 6, foot + 1.4 * T, r.x + r.w / 2, foot + 1.2 * T);
      ctx.quadraticCurveTo(r.x + 6, foot + 1.4 * T, r.x - 6, foot + 3 * T);
      ctx.fill();
    },
    branch(a, r) {
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.silhouettes ? p.wood : '#86613f';
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 5 }, 2.5);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = '#a8805a';
      ctx.fillRect(r.x + 1, r.y, r.w - 2, 1.5);
      // Petites feuilles pendantes.
      ctx.fillStyle = p.leafLight;
      for (let x = r.x + 6; x < r.x + r.w - 2; x += 9) {
        ctx.beginPath();
        ctx.ellipse(x, r.y + 7, 2, 3.2, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    planter(a, r) {
      const { ctx, palette: p } = a;
      planks(a, r, 8);
      if (p.silhouettes) {
        return;
      }
      // Terre et légumes qui dépassent (sans collision au-dessus : juste un liseré de feuilles).
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, 3);
      for (let x = r.x + 5; x < r.x + r.w - 3; x += 8) {
        ctx.fillStyle = p.leafLight;
        ctx.beginPath();
        ctx.ellipse(x, r.y - 2, 2.5, 3.5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(x + 2.5, r.y - 2, 2.5, 3.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        if (hash(x, r.y) > 0.5) {
          ctx.fillStyle = '#e07b4f';
          ctx.fillRect(x - 1, r.y + 1, 2.5, 3);
        }
      }
    },
    pergola(a, r) {
      const { ctx, palette: p } = a;
      // Poteaux (fond, sans collision) puis lattes du toit (traversables) et vigne.
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x + 2 * T, r.y + 4, 5, r.h - 4);
      ctx.fillRect(r.x + r.w - 3 * T, r.y + 4, 5, r.h - 4);
      ctx.fillStyle = p.wood;
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 5 }, 2);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = p.woodLight;
      ctx.fillRect(r.x, r.y, r.w, 1.5);
      ctx.fillStyle = p.leaf;
      for (let x = r.x + 4; x < r.x + r.w; x += 7) {
        ctx.beginPath();
        ctx.ellipse(x, r.y + 6 + hash(x, 1) * 5, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    gardentable(a, r) {
      const { ctx, palette: p } = a;
      tileShape(a, r, p.silhouettes ? p.wood : '#e9e2d0', p.silhouettes ? p.wood : '#fbf7ec');
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = '#c9c0ab';
      ctx.fillRect(r.x + 3, r.y + 5, r.w - 6, 2);
      // Carafe de citronnade.
      ctx.fillStyle = 'rgba(250,236,150,0.85)';
      rounded(ctx, { x: r.x + r.w / 2 - 3, y: r.y - 8, w: 6, h: 8 }, 2);
      ctx.fill();
    },
    flowerpot(a, r) {
      const { ctx, palette: p } = a;
      tileShape(a, r, p.silhouettes ? p.wood : '#c7704a', p.silhouettes ? p.wood : '#e08d66');
      if (p.silhouettes) {
        return;
      }
      const colors = ['#f2c14e', '#e58fa6', '#ffffff'];
      for (let x = r.x + 4; x < r.x + r.w - 2; x += 6) {
        ctx.fillStyle = colors[Math.floor(hash(x, r.y) * 3)] ?? '#ffffff';
        ctx.beginPath();
        ctx.arc(x, r.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    shed(a, r) {
      const { ctx, palette: p } = a;
      planks(a, r, 7);
      if (p.silhouettes) {
        return;
      }
      // Toit de tuiles et petite fenêtre.
      ctx.fillStyle = '#9b5b4a';
      ctx.fillRect(r.x - 2, r.y, r.w + 4, 4);
      ctx.fillStyle = p.nightLow;
      rounded(ctx, { x: r.x + r.w / 2 - 6, y: r.y + 3 * T, w: 12, h: 10 }, 2);
      ctx.fill();
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x + r.w / 2 - 0.5, r.y + 3 * T, 1, 10);
    },
    fence(a, r) {
      planks(a, r, 6);
      if (a.palette.silhouettes) {
        return;
      }
      a.ctx.fillStyle = 'rgba(0,0,0,0.12)';
      a.ctx.fillRect(r.x, r.y + 2 * T, r.w, 2);
      a.ctx.fillRect(r.x, r.y + r.h - 2 * T, r.w, 2);
    },
    oldwall(a, r) {
      const { ctx, level, palette: p } = a;
      if (p.silhouettes) {
        tileShape(a, r, p.structure, p.structure);
        return;
      }
      tileShape(a, r, p.structure, '#cdbb9d');
      // Pierres en quinconce, un peu de mousse sur le dessus.
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (tileAt(level, col, row) !== Tile.Solid) {
            continue;
          }
          const offset = row % 2 === 0 ? 0 : T / 2;
          ctx.strokeRect(col * T + offset - T / 2 + 0.5, row * T + 0.5, T, T / 2);
          ctx.strokeRect(col * T + 0.5, row * T + T / 2 + 0.5, T, T / 2);
          if (tileAt(level, col, row - 1) === Tile.Empty) {
            ctx.fillStyle = p.leafLight;
            ctx.fillRect(col * T, row * T, T, 2);
          }
        }
      }
    },
    deck(a, r) {
      planks(a, r, 5);
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
      const { ctx, palette: p } = a;
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = r.x + 6; x < r.x + r.w; x += 24) {
        ctx.moveTo(x, r.y + r.h + 4 * T);
        ctx.lineTo(x + 3, r.y);
      }
      ctx.stroke();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = p.leafLight;
      for (let i = 0; i < r.w / 3; i++) {
        const x = r.x + hash(i, 7) * r.w;
        const y = r.y + hash(7, i) * (r.h + 4 * T);
        ctx.beginPath();
        ctx.ellipse(x, y, 2, 3, hash(i, i) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    facade(a, r) {
      const { ctx, palette: p } = a;
      // Mur de la maison (crépi clair) et une fenêtre (la buanderie) au-dessus de la porte.
      ctx.fillStyle = '#e8dcc6';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#9b5b4a';
      ctx.fillRect(r.x, r.y, 3 * T, 4);
      if (!p.silhouettes) {
        ctx.fillStyle = p.nightLow;
        rounded(ctx, { x: r.x + T + 2, y: r.y + 4 * T, w: T + 4, h: 2 * T }, 2);
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
