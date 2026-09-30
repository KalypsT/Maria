import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * L'aire de jeux du quartier (D-61), dessinée par le code en aplats doux, comme la rue.
 * PLACEHOLDER : formes simples. Ce qu'on foule (bac, tourniquet, barreaux, portique, plateforme,
 * toit, nichoir, grillage) suit exactement ses tuiles ; montants, chaînes et toboggan sont du fond.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const RED = '#d0674f';
const YELLOW = '#e8c86a';
const BLUE = '#6d86c2';
const GREEN = '#5f8a5a';
const METAL = '#6f7f8a';
const WOOD = '#b58a5f';
const WOOD_LIGHT = '#d8b183';
const SAND = '#ecd9a0';

/** Tuiles traversables d'une ligne d'un rectangle, en segments continus (col de début, fin). */
function oneWayRuns(a: ArtContext, r: Rect, row: number): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  const col0 = r.x / T;
  const col1 = (r.x + r.w) / T;
  for (let col = col0; col <= col1; col++) {
    const on = col < col1 && tileAt(a.level, col, row) === Tile.OneWay;
    if (on && start < 0) {
      start = col;
    } else if (!on && start >= 0) {
      runs.push([start, col - 1]);
      start = -1;
    }
  }
  return runs;
}

/** Ligne du sol sous un rectangle (première tuile pleine sous lui, dans sa colonne centrale). */
function groundBelow(a: ArtContext, r: Rect): number {
  const col = Math.floor((r.x + r.w / 2) / T);
  let row = Math.floor((r.y + r.h) / T);
  while (row < a.level.height && tileAt(a.level, col, row) !== Tile.Solid) {
    row++;
  }
  return row * T;
}

export function playgroundDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
  /** Barre traversable (barreau, poutre, plancher) : aplat et rehaut, exactement sur ses tuiles. */
  const bar = (
    a: ArtContext,
    col0: number,
    col1: number,
    row: number,
    fill: string,
    light: string,
  ) => {
    tileShape(a, { x: col0 * T, y: row * T, w: (col1 - col0 + 1) * T, h: T }, fill, light);
  };

  return {
    sandbox(a, r) {
      const { ctx } = a;
      // Bac à sable : cadre en bois, sable clair, une petite pelle et un seau.
      tileShape(a, r, WOOD, WOOD_LIGHT);
      ctx.fillStyle = SAND;
      ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let x = r.x + 6; x < r.x + r.w - 6; x += 9) {
        ctx.fillRect(x, r.y + 6, 3, 1);
      }
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w - 20, r.y - 7);
      ctx.lineTo(r.x + r.w - 12, r.y - 7);
      ctx.lineTo(r.x + r.w - 13.5, r.y);
      ctx.lineTo(r.x + r.w - 18.5, r.y);
      ctx.fill();
      ctx.fillStyle = BLUE;
      ctx.fillRect(r.x + 10, r.y - 5, 1.5, 5);
      ctx.fillRect(r.x + 8.5, r.y - 7, 4.5, 2.5);
    },
    roundabout(a, r) {
      const { ctx } = a;
      // Tourniquet : plateau à secteurs colorés, mât central et barres en arceau.
      const cx = r.x + r.w / 2;
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, r.y);
      ctx.lineTo(cx, r.y - 1.4 * T);
      ctx.moveTo(r.x + 5, r.y);
      ctx.quadraticCurveTo(cx, r.y - 1.8 * T, r.x + r.w - 5, r.y);
      ctx.stroke();
      tileShape(a, r, BLUE, '#98ade0');
      const colors = [RED, YELLOW, GREEN];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = colors[i % colors.length] ?? RED;
        ctx.fillRect(r.x + 2 + (i * (r.w - 4)) / 6, r.y + 2.5, (r.w - 4) / 6 - 1, 2);
      }
    },
    climbingdome(a, r) {
      const { ctx } = a;
      // Cage à écureuil : arceaux jusqu'au sol, puis les barreaux où l'on se pose.
      const ground = groundBelow(a, r);
      const cx = r.x + r.w / 2;
      ctx.lineWidth = 2;
      const arcs = [
        [RED, r.w / 2],
        [YELLOW, r.w / 2 - T],
        [BLUE, r.w / 2 - 2 * T],
      ] as const;
      for (const [color, rx] of arcs) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, ground, rx, ground - r.y, 0, Math.PI, 0);
        ctx.stroke();
      }
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (const [c0, c1] of oneWayRuns(a, r, row)) {
          bar(a, c0, c1, row, METAL, '#b8c4cc');
        }
      }
    },
    swingset(a, r) {
      const { ctx } = a;
      // Portique : pieds en A jusqu'au sol, deux balançoires, la poutre en haut (on s'y pose).
      const ground = groundBelow(a, r);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (const x of [r.x + 4, r.x + r.w - 4]) {
        ctx.moveTo(x - 1.5 * T, ground);
        ctx.lineTo(x, r.y + 3);
        ctx.lineTo(x + 1.5 * T, ground);
      }
      ctx.stroke();
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1;
      for (const sx of [r.x + 3 * T, r.x + r.w - 3 * T]) {
        ctx.beginPath();
        ctx.moveTo(sx - 5, r.y + 4);
        ctx.lineTo(sx - 5, ground - 2.5 * T);
        ctx.moveTo(sx + 5, r.y + 4);
        ctx.lineTo(sx + 5, ground - 2.5 * T);
        ctx.stroke();
        ctx.fillStyle = BLUE;
        ctx.fillRect(sx - 7, ground - 2.5 * T, 14, 3);
      }
      for (const [c0, c1] of oneWayRuns(a, r, r.y / T)) {
        bar(a, c0, c1, r.y / T, '#a8503d', '#e08a74');
      }
    },
    birdhouse(a, r) {
      const { ctx } = a;
      // Nichoir en haut d'un mât : son toit plat est le perchoir (la trouvaille s'y pose).
      const cx = r.x + r.w / 2;
      const ground = groundBelow(a, r);
      ctx.fillStyle = METAL;
      ctx.fillRect(cx - 1.5, r.y + T, 3, ground - r.y - T);
      ctx.fillStyle = WOOD;
      ctx.fillRect(r.x + 4, r.y + 3, r.w - 8, T + 4);
      ctx.fillStyle = '#3a2f2a';
      ctx.beginPath();
      ctx.arc(cx, r.y + 11, 3, 0, Math.PI * 2);
      ctx.fill();
      bar(a, r.x / T, (r.x + r.w) / T - 1, r.y / T, '#8f4a3c', '#c26b57');
    },
    slidetower(a, r) {
      const { ctx, level } = a;
      // Tour du toboggan : poteaux jusqu'au sol, plancher, petit toit pointu (on peut y monter),
      // et le toboggan qui redescend vers la droite (fond, on ne glisse pas dessus).
      const ground = groundBelow(a, { x: r.x, y: r.y, w: 6 * T, h: r.h });
      let deckRow = -1;
      let roofRow = -1;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          const tile = tileAt(level, col, row);
          if (tile === Tile.OneWay && deckRow < 0) {
            deckRow = row;
          } else if (tile === Tile.Solid && roofRow < 0) {
            roofRow = row;
          }
        }
      }
      const deck = oneWayRuns(a, r, deckRow)[0] ?? [r.x / T, r.x / T + 5];
      const deckY = deckRow * T;
      ctx.fillStyle = '#b8c4cc';
      for (const col of [deck[0], deck[1]]) {
        ctx.fillRect(col * T + T / 2 - 2, deckY, 4, ground - deckY);
      }
      // Toboggan.
      const top = { x: (deck[1] + 1) * T, y: deckY + 2 };
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.bezierCurveTo(
        top.x + 3 * T,
        top.y + 2 * T,
        top.x + 4 * T,
        ground - 2 * T,
        top.x + 7 * T,
        ground - 4,
      );
      ctx.stroke();
      ctx.lineCap = 'butt';
      if (roofRow >= 0) {
        // Poteaux du toit, puis le toit exactement sur ses tuiles, et un fanion.
        const roof = [...Array(r.w / T).keys()]
          .map((k) => r.x / T + k)
          .filter((col) => tileAt(level, col, roofRow) === Tile.Solid);
        const c0 = roof[0] ?? deck[0];
        const c1 = roof[roof.length - 1] ?? deck[1];
        ctx.fillStyle = '#b8c4cc';
        ctx.fillRect(c0 * T + 2, roofRow * T + T, 3, deckY - roofRow * T - T);
        ctx.fillRect(c1 * T + T - 5, roofRow * T + T, 3, deckY - roofRow * T - T);
        tileShape(a, { x: c0 * T, y: roofRow * T, w: (c1 - c0 + 1) * T, h: T }, RED, '#ec9a86');
        ctx.fillStyle = METAL;
        ctx.fillRect(((c0 + c1 + 1) / 2) * T - 0.5, roofRow * T - 12, 1, 12);
        ctx.fillStyle = YELLOW;
        ctx.beginPath();
        ctx.moveTo(((c0 + c1 + 1) / 2) * T + 0.5, roofRow * T - 12);
        ctx.lineTo(((c0 + c1 + 1) / 2) * T + 8, roofRow * T - 9);
        ctx.lineTo(((c0 + c1 + 1) / 2) * T + 0.5, roofRow * T - 6);
        ctx.fill();
      }
      // Garde-corps, puis le plancher.
      ctx.fillStyle = BLUE;
      ctx.fillRect(deck[0] * T, deckY - 8, 2, 8);
      ctx.fillRect(deck[0] * T, deckY - 8, (deck[1] - deck[0] + 1) * T, 1.5);
      bar(a, deck[0], deck[1], deckRow, WOOD, WOOD_LIGHT);
    },
    springrider(a, r) {
      const { ctx } = a;
      // Jeu à ressort : un petit cheval sur son ressort (fond).
      const cx = r.x + r.w / 2;
      const base = r.y + r.h;
      ctx.strokeStyle = METAL;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        ctx.ellipse(cx, base - 2 - k * 2.5, 3, 1, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.ellipse(cx, base - 16, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 8, base - 23, 4, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = YELLOW;
      ctx.fillRect(cx + 6, base - 29, 2, 4);
    },
    schoolfence(a, r) {
      const { ctx, level } = a;
      // Le grillage de l'école : derrière, la cour et le bâtiment ; les pointes en haut. Le trou
      // du grillage (tuiles vides) est bordé de fils tordus.
      ctx.fillStyle = '#efe4cc';
      ctx.fillRect(r.x, r.y + 2 * T, r.w, r.h - 2 * T);
      ctx.fillStyle = '#bcdcee';
      for (let y = r.y + 4 * T; y < r.y + r.h - 6 * T; y += 4 * T) {
        ctx.fillRect(r.x + T, y, 1.6 * T, 2 * T);
      }
      ctx.fillStyle = '#d9ccb4';
      ctx.fillRect(r.x, r.y + r.h - 3 * T, r.w, 3 * T);
      ctx.fillStyle = '#b5634f';
      ctx.fillRect(r.x, r.y + T, r.w, T);
      // Maille en losanges, sauf dans le trou.
      ctx.save();
      ctx.beginPath();
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (tileAt(level, col, row) === Tile.Solid) {
            ctx.rect(col * T, row * T, T, T);
          }
        }
      }
      ctx.clip();
      ctx.strokeStyle = 'rgba(63,107,61,0.55)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = r.x - r.h; x < r.x + r.w; x += 11) {
        ctx.moveTo(x, r.y);
        ctx.lineTo(x + r.h, r.y + r.h);
        ctx.moveTo(x + r.h, r.y);
        ctx.lineTo(x, r.y + r.h);
      }
      ctx.stroke();
      ctx.restore();
      // Poteaux, pointes du haut, et fils tordus autour du trou.
      ctx.fillStyle = '#3f6b3d';
      ctx.fillRect(r.x, r.y, 3, r.h);
      ctx.fillRect(r.x + r.w - 3, r.y, 3, r.h);
      for (let x = r.x; x < r.x + r.w; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, r.y + 3);
        ctx.lineTo(x + 3, r.y - 2);
        ctx.lineTo(x + 6, r.y + 3);
        ctx.fill();
      }
      ctx.strokeStyle = '#3f6b3d';
      ctx.lineWidth = 1.2;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        const col = r.x / T;
        if (tileAt(level, col, row) === Tile.Empty) {
          ctx.beginPath();
          ctx.moveTo(col * T, row * T + 2);
          ctx.lineTo(col * T + 4, row * T + 6);
          ctx.moveTo(col * T, row * T + T - 3);
          ctx.lineTo(col * T + 5, row * T + T - 7);
          ctx.stroke();
        }
      }
    },
  };
}
