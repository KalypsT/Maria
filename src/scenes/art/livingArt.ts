import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * Le salon refait en salle témoin (D-73), dessiné par le code. Ce qu'on foule (pots des
 * suspensions, abat-jour du lustre, manteau de la cheminée, dessus de l'horloge) suit exactement
 * ses tuiles ; cordes, corps de la cheminée et de l'horloge sont du fond, devant lequel on passe.
 * Le feu et le balancier bougent à part (`WorldLifeView`).
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const TERRACOTTA = '#c46f4a';
const TERRACOTTA_LIGHT = '#dd8f69';
const ROPE = '#d9c7a3';
const SHADE = '#f1d9a6';
const SHADE_DARK = '#d8b77c';
const STONE = '#cbbda6';
const STONE_DARK = '#a8987f';
const SOOT = '#1b1311';
const GOLD = '#c9a45c';
const GLASS = '#9fb4c9';

/** Ligne (tuiles) des tuiles traversables du bas d'un élément suspendu : là où l'on se tient. */
function standRow(a: ArtContext, r: Rect): number {
  for (let row = (r.y + r.h) / T - 1; row >= r.y / T; row--) {
    if (tileAt(a.level, r.x / T, row) === Tile.OneWay) {
      return row;
    }
  }
  return (r.y + r.h) / T - 1;
}

export function livingDrawers({ tileShape, rounded }: ShapeTools): Record<string, Drawer> {
  return {
    understairs(a, r) {
      // Le dessous de l'escalier qui monte à l'étage : bois sombre, une planche par marche.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.woodDark, p.woodDark, 'rgba(0,0,0,0.28)');
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = 'rgba(255,230,190,0.12)';
      for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
        let bottom = -1;
        for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
          if (tileAt(a.level, col, row) === Tile.Solid) {
            bottom = row;
          }
        }
        if (bottom >= 0) {
          // Le bord de chaque marche, et ses planches.
          ctx.fillRect(col * T, (bottom + 1) * T - 3, T, 1.5);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          for (let y = r.y + 5; y < (bottom + 1) * T - 4; y += 6) {
            ctx.fillRect(col * T, y, T, 1);
          }
          ctx.fillStyle = 'rgba(255,230,190,0.12)';
        }
      }
    },
    hangingplant(a, r) {
      // Une plante en pot, pendue par des cordes en macramé ; le bord du pot est la plateforme.
      const { ctx, palette: p } = a;
      const rim = standRow(a, r) * T;
      const cx = r.x + r.w / 2;
      ctx.strokeStyle = p.silhouettes ? p.structure : ROPE;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (const x of [r.x + 3, cx, r.x + r.w - 3]) {
        ctx.moveTo(cx, r.y);
        ctx.lineTo(x, rim);
      }
      ctx.stroke();
      ctx.fillStyle = p.silhouettes ? p.wood : TERRACOTTA;
      ctx.beginPath();
      ctx.moveTo(r.x + 1, rim + 3);
      ctx.lineTo(r.x + r.w - 1, rim + 3);
      ctx.lineTo(r.x + r.w - 7, rim + 15);
      ctx.lineTo(r.x + 7, rim + 15);
      ctx.fill();
      ctx.fillStyle = p.silhouettes ? p.wood : TERRACOTTA_LIGHT;
      rounded(ctx, { x: r.x, y: rim, w: r.w, h: 4 }, 1.5);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      // Feuillage qui retombe sur les côtés, jamais sur le bord où l'on se tient.
      ctx.fillStyle = p.leafDark;
      for (const [dx, len] of [
        [2, 22],
        [r.w - 3, 28],
        [r.w / 2 + 6, 14],
      ] as const) {
        ctx.fillRect(r.x + dx - 0.6, rim + 4, 1.2, len);
        for (let y = rim + 8; y < rim + 4 + len; y += 5) {
          ctx.beginPath();
          ctx.ellipse(r.x + dx + (y % 10 < 5 ? 2 : -2), y, 2.6, 1.6, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = p.leaf;
      for (const dx of [-3, r.w + 3]) {
        ctx.beginPath();
        ctx.ellipse(r.x + dx, rim + 5, 4, 2.4, dx < 0 ? -0.5 : 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    ceilinglamp(a, r) {
      // Lustre : un fil, un abat-jour en tambour (son dessus est la plateforme), l'ampoule dessous.
      const { ctx, palette: p } = a;
      const top = standRow(a, r) * T;
      const cx = r.x + r.w / 2;
      ctx.fillStyle = p.silhouettes ? p.structure : '#3a3330';
      ctx.fillRect(cx - 0.6, r.y, 1.2, top - r.y);
      rounded(ctx, { x: cx - 3, y: r.y, w: 6, h: 3 }, 1);
      ctx.fill();
      ctx.fillStyle = p.silhouettes ? p.fabric : SHADE;
      ctx.beginPath();
      ctx.moveTo(r.x + 2, top);
      ctx.lineTo(r.x + r.w - 2, top);
      ctx.lineTo(r.x + r.w + 2, top + 13);
      ctx.lineTo(r.x - 2, top + 13);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = SHADE_DARK;
      ctx.fillRect(r.x - 2, top + 11, r.w + 4, 2);
      ctx.fillStyle = '#fff3c9';
      ctx.beginPath();
      ctx.ellipse(cx, top + 14, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    fireplace(a, r) {
      // Cheminée contre le mur : un miroir au-dessus du manteau, l'âtre en pierre, les bûches.
      // Le manteau est un meuble à part ; le feu est animé (WorldLifeView).
      const { ctx, palette: p } = a;
      const mantel = r.y + 6 * T;
      const floor = r.y + r.h;
      // Miroir.
      ctx.fillStyle = p.silhouettes ? p.structure : GOLD;
      rounded(ctx, { x: r.x + 3 * T - 3, y: r.y + 4, w: 6 * T + 6, h: 5 * T - 4 }, [40, 40, 3, 3]);
      ctx.fill();
      if (!p.silhouettes) {
        const glass = ctx.createLinearGradient(r.x + 3 * T, r.y, r.x + 9 * T, mantel);
        glass.addColorStop(0, '#c9d6e3');
        glass.addColorStop(1, GLASS);
        ctx.fillStyle = glass;
        rounded(ctx, { x: r.x + 3 * T, y: r.y + 7, w: 6 * T, h: 5 * T - 10 }, [37, 37, 2, 2]);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.x + 4 * T, r.y + 4 * T);
        ctx.lineTo(r.x + 5.5 * T, r.y + 2 * T);
        ctx.moveTo(r.x + 4.6 * T, r.y + 4.4 * T);
        ctx.lineTo(r.x + 5.4 * T, r.y + 3.3 * T);
        ctx.stroke();
      }
      // Âtre : jambages de pierre, foyer noir de suie en arc, sole devant.
      const body = { x: r.x + 6, y: mantel + 5, w: r.w - 12, h: floor - mantel - 5 };
      ctx.fillStyle = p.silhouettes ? p.wood : STONE;
      ctx.fillRect(body.x, body.y, body.w, body.h);
      const open = {
        x: r.x + 2.5 * T,
        y: mantel + 1.6 * T,
        w: r.w - 5 * T,
        h: floor - mantel - 1.6 * T,
      };
      ctx.fillStyle = p.silhouettes ? p.structure : SOOT;
      rounded(ctx, open, [open.w / 2, open.w / 2, 0, 0]);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = STONE_DARK;
      for (let y = body.y + 8; y < floor - 4; y += 9) {
        ctx.fillRect(body.x, y, open.x - body.x - 2, 1);
        ctx.fillRect(open.x + open.w + 2, y, body.x + body.w - open.x - open.w - 2, 1);
      }
      // Bûches.
      ctx.fillStyle = '#5a3a28';
      rounded(ctx, { x: open.x + 8, y: floor - 7, w: open.w - 16, h: 5 }, 2.5);
      ctx.fill();
      ctx.fillStyle = '#6e4630';
      rounded(ctx, { x: open.x + 14, y: floor - 11, w: open.w - 30, h: 5 }, 2.5);
      ctx.fill();
      // Sole de pierre devant l'âtre.
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(r.x, floor - 3, r.w, 3);
    },
    mantel(a, r) {
      // Manteau de la cheminée : une tablette de bois et ses consoles.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.wood;
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 6 }, 2);
      ctx.fill();
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x + 8, r.y + 6, 5, 6);
      ctx.fillRect(r.x + r.w - 13, r.y + 6, 5, 6);
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = p.woodLight;
      ctx.fillRect(r.x + 1, r.y, r.w - 2, 1.5);
    },
    grandclock(a, r) {
      // Le corps de l'horloge comtoise (fond) : cadran, fenêtre du balancier, socle.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.wood;
      rounded(ctx, { x: r.x + 3, y: r.y, w: r.w - 6, h: r.h - 6 }, [0, 0, 2, 2]);
      ctx.fill();
      ctx.fillStyle = p.woodDark;
      rounded(ctx, { x: r.x, y: r.y + r.h - 8, w: r.w, h: 8 }, 2);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      const cx = r.x + r.w / 2;
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(cx, r.y + 15, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6efdc';
      ctx.beginPath();
      ctx.arc(cx, r.y + 15, 12.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3330';
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        ctx.fillRect(
          cx + Math.cos(angle) * 10 - 0.6,
          r.y + 15 + Math.sin(angle) * 10 - 0.6,
          1.2,
          1.2,
        );
      }
      ctx.strokeStyle = '#3a3330';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + 15);
      ctx.lineTo(cx - 5, r.y + 10);
      ctx.moveTo(cx, r.y + 15);
      ctx.lineTo(cx + 2, r.y + 6);
      ctx.stroke();
      // Fenêtre du balancier (le balancier bat, animé à part).
      ctx.fillStyle = '#2a1e1a';
      rounded(ctx, { x: cx - 14, y: r.y + 36, w: 28, h: r.h - 56 }, [14, 14, 2, 2]);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(cx - 11, r.y + 42, 3, r.h - 66);
    },
    clocktop(a, r) {
      // Le chapeau de l'horloge comtoise (plein) : on y pose le pied.
      const p = a.palette;
      tileShape(a, r, p.woodDark, p.woodLight);
    },
  };
}

/** Âtre d'une cheminée (px logiques) : là où brûle le feu. */
export function hearth(r: Rect): Rect {
  const mantel = r.y + 6 * T;
  const top = mantel + 1.6 * T;
  return { x: r.x + 2.5 * T, y: top, w: r.w - 5 * T, h: r.y + r.h - top };
}

/** Pivot du balancier d'une horloge comtoise (px logiques) et longueur jusqu'au centre du disque. */
export function pendulum(r: Rect): { x: number; y: number; length: number } {
  return { x: r.x + r.w / 2, y: r.y + 38, length: r.h - 70 };
}

/**
 * Une image du feu (D-73), dans un cadre `w` × `h` dont le bas est posé sur les bûches : des
 * langues de flamme orangées, un cœur jaune. `seed` change la forme d'une image à l'autre.
 */
export function drawFlames(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
): void {
  const tongues = 5;
  const layers = [
    ['#e9772f', 1],
    ['#f6a641', 0.72],
    ['#ffe3a0', 0.42],
  ] as const;
  for (const [color, k] of layers) {
    ctx.fillStyle = color;
    for (let i = 0; i < tongues; i++) {
      const t = (i + 0.5) / tongues;
      const x = w * (0.12 + 0.76 * t);
      const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      const jitter = n - Math.floor(n);
      // Plus hautes au milieu.
      const height = h * k * (0.45 + 0.55 * Math.sin(t * Math.PI)) * (0.75 + 0.35 * jitter);
      const half = (w / tongues) * 0.75 * k;
      const lean = (jitter - 0.5) * 6;
      ctx.beginPath();
      ctx.moveTo(x - half, h);
      ctx.quadraticCurveTo(x - half, h - height * 0.55, x + lean, h - height);
      ctx.quadraticCurveTo(x + half, h - height * 0.55, x + half, h);
      ctx.fill();
    }
  }
}
