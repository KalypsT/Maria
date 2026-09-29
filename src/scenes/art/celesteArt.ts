import type { ArtPalette } from '../../config/art';

/** Taille du dessin de Céleste (px logiques) : un peu plus large que sa hitbox, pieds en bas. */
export const CELESTE_ART = { width: 18, height: 26 } as const;

/**
 * Céleste dessinée par le code (D-28, placeholder du style validé) : pyjama rose à pois, couettes
 * et rubans, lunettes rondes roses, chaussons. Monde étrange : silhouette, seules les lunettes
 * restent roses. Coordonnées logiques, pieds au bas du dessin.
 */
export function drawCeleste(ctx: CanvasRenderingContext2D, palette: Readonly<ArtPalette>): void {
  const { width: w, height: h } = CELESTE_ART;
  const cx = w / 2;
  const headY = 7;
  const circle = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  if (palette.silhouettes) {
    ctx.fillStyle = '#07080d';
    ctx.beginPath();
    ctx.roundRect(cx - 5, 12, 10, h - 12, 4);
    ctx.fill();
    circle(cx, headY, 6);
    circle(cx - 6.5, headY + 1, 2.6);
    circle(cx + 6.5, headY + 1, 2.6);
    ctx.strokeStyle = palette.rim;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, headY, 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    // Pyjama à pois et chaussons.
    ctx.fillStyle = '#f1a9bd';
    ctx.beginPath();
    ctx.roundRect(cx - 5, 12, 10, h - 14, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const [dx, dy] of [
      [-2, 15],
      [2.5, 17.5],
      [-1.5, 20.5],
      [2, 22],
    ] as const) {
      circle(cx + dx, dy, 0.7);
    }
    ctx.fillStyle = palette.linen;
    ctx.beginPath();
    ctx.roundRect(cx - 5, h - 2.5, 4.5, 2.5, 1);
    ctx.roundRect(cx + 0.5, h - 2.5, 4.5, 2.5, 1);
    ctx.fill();
    // Tête, cheveux, couettes et rubans.
    ctx.fillStyle = '#e7b995';
    circle(cx, headY, 6);
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath();
    ctx.arc(cx, headY - 1, 6.3, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 7, headY + 1.5, 2.4, 3.4, 0.3, 0, Math.PI * 2);
    ctx.ellipse(cx + 7, headY + 1.5, 2.4, 3.4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9788f';
    circle(cx - 6, headY - 2.5, 1.3);
    circle(cx + 6, headY - 2.5, 1.3);
    ctx.fillStyle = 'rgba(217,120,143,0.35)';
    circle(cx - 3.5, headY + 3, 1.1);
    circle(cx + 3.5, headY + 3, 1.1);
  }
  // Lunettes rondes roses (identité de Céleste, spec §2).
  ctx.strokeStyle = '#ff6fa3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx - 2.4, headY + 0.5, 2, 0, Math.PI * 2);
  ctx.moveTo(cx + 4.4, headY + 0.5);
  ctx.arc(cx + 2.4, headY + 0.5, 2, 0, Math.PI * 2);
  ctx.stroke();
  if (!palette.silhouettes) {
    ctx.fillStyle = '#2b2530';
    ctx.fillRect(cx - 2.9, headY, 1, 1);
    ctx.fillRect(cx + 1.9, headY, 1, 1);
  }
}
