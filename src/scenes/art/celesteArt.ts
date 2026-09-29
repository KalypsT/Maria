import type { ArtPalette } from '../../config/art';

/**
 * Pièces de Céleste en « papier découpé » (D-29), dessinées par le code dans le style D-28 :
 * enfant de 5-6 ans (tête ronde assez grosse), pyjama rose à pois, couettes et rubans, lunettes
 * rondes roses, chaussons. Monde étrange : silhouettes, seules les lunettes restent roses.
 * Chaque pièce a sa taille (px logiques) et son point d'attache (origine, en fraction).
 */
export const CELESTE_PARTS = {
  head: { width: 16, height: 14, originX: 7.5 / 16, originY: 13.5 / 14 },
  pigtail: { width: 5, height: 7, originX: 0.5, originY: 0.5 / 7 },
  torso: { width: 11, height: 9, originX: 0.5, originY: 1 },
  arm: { width: 4, height: 8, originX: 0.5, originY: 0.1 },
  leg: { width: 6, height: 9, originX: 2.5 / 6, originY: 0.05 },
} as const;
export type CelestePart = keyof typeof CELESTE_PARTS;

const PYJAMA = '#f1a9bd';
const SKIN = '#e7b995';
const HAIR = '#5a3a2a';
const RIBBON = '#d9788f';
const GLASSES = '#ff6fa3';
const SILHOUETTE = '#07080d';

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCelestePart(
  ctx: CanvasRenderingContext2D,
  part: CelestePart,
  palette: Readonly<ArtPalette>,
): void {
  const dark = palette.silhouettes;
  switch (part) {
    case 'head': {
      const cx = 8;
      const cy = 7.2;
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      circle(ctx, cx, cy, 6);
      ctx.fillRect(cx - 1.5, cy + 4, 3, 3);
      if (dark) {
        ctx.strokeStyle = palette.rim;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        ctx.fillStyle = HAIR;
        ctx.beginPath();
        ctx.arc(cx, cy - 0.6, 6.3, Math.PI * 1.0, Math.PI * 2.0);
        ctx.lineTo(cx + 6.3, cy + 0.5);
        ctx.quadraticCurveTo(cx + 1, cy - 2.5, cx - 6.3, cy + 0.5);
        ctx.fill();
        ctx.fillStyle = 'rgba(217,120,143,0.35)';
        circle(ctx, cx + 3.8, cy + 2.8, 1.1);
      }
      // Lunettes rondes roses (identité de Céleste, spec §2), de trois quarts.
      ctx.strokeStyle = GLASSES;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(cx + 0.2, cy + 0.6, 1.9, 0, Math.PI * 2);
      ctx.moveTo(cx + 6.2, cy + 0.6);
      ctx.arc(cx + 4.4, cy + 0.6, 1.8, 0, Math.PI * 2);
      ctx.stroke();
      if (!dark) {
        ctx.fillStyle = '#2b2530';
        ctx.fillRect(cx - 0.2, cy + 0.2, 0.9, 0.9);
        ctx.fillRect(cx + 4, cy + 0.2, 0.9, 0.9);
      }
      break;
    }
    case 'pigtail':
      ctx.fillStyle = dark ? SILHOUETTE : HAIR;
      ctx.beginPath();
      ctx.ellipse(2.5, 4, 2.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dark ? SILHOUETTE : RIBBON;
      circle(ctx, 2.5, 1.2, 1.2);
      break;
    case 'torso':
      ctx.fillStyle = dark ? SILHOUETTE : PYJAMA;
      ctx.beginPath();
      ctx.roundRect(0.5, 0, 10, 9, [3.5, 3.5, 2, 2]);
      ctx.fill();
      if (!dark) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (const [x, y] of [
          [3, 3],
          [7.5, 2.5],
          [5, 6],
          [8.5, 7],
        ] as const) {
          circle(ctx, x, y, 0.65);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0.5, 7.5, 10, 1.5);
      }
      break;
    case 'arm':
      ctx.fillStyle = dark ? SILHOUETTE : PYJAMA;
      ctx.beginPath();
      ctx.roundRect(0.5, 0, 3, 5.8, 1.4);
      ctx.fill();
      ctx.fillStyle = dark ? SILHOUETTE : SKIN;
      circle(ctx, 2, 6.6, 1.3);
      break;
    case 'leg':
      ctx.fillStyle = dark ? SILHOUETTE : PYJAMA;
      ctx.beginPath();
      ctx.roundRect(1, 0, 3, 7.4, 1.2);
      ctx.fill();
      ctx.fillStyle = dark ? SILHOUETTE : palette.linen;
      ctx.beginPath();
      ctx.roundRect(0.6, 6.8, 5, 2.2, 1.1);
      ctx.fill();
      break;
  }
}
