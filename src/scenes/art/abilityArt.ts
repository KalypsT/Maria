import type { Ability } from '../../config/abilities';

/**
 * Pictogrammes des capacités (D-62), pour la page « Mes capacités » du cahier : dessinés au crayon
 * par Céleste, dans un carré de côté `size` centré en (cx, cy). PLACEHOLDER.
 */
export function drawAbility(
  ctx: CanvasRenderingContext2D,
  ability: Ability,
  cx: number,
  cy: number,
  size: number,
  ink: string,
  rose: string,
): void {
  const u = size / 20;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(u, u);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 1.1;
  switch (ability) {
    case 'climb':
      // Un rebord, deux mains qui s'y agrippent, une flèche qui monte.
      ctx.beginPath();
      ctx.rect(-2, -2, 11, 10);
      ctx.stroke();
      ctx.fillStyle = rose;
      for (const x of [-4, -1]) {
        ctx.beginPath();
        ctx.arc(x, -2.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      arrow(ctx, -7, 7, -7, -7);
      break;
    case 'wall-jump':
      // Deux murs, et un chemin en zigzag qui monte de l'un à l'autre.
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.lineTo(-8, -8);
      ctx.moveTo(8, 8);
      ctx.lineTo(8, -8);
      ctx.stroke();
      ctx.strokeStyle = rose;
      ctx.setLineDash([1.5, 1.5]);
      ctx.beginPath();
      ctx.moveTo(-6.5, 7);
      ctx.lineTo(6.5, 2);
      ctx.lineTo(-6.5, -3);
      ctx.stroke();
      ctx.setLineDash([]);
      arrow(ctx, -6.5, -3, 5, -7.5);
      break;
    case 'umbrella':
      // Le parapluie ouvert, et la longue descente douce qu'il permet.
      ctx.beginPath();
      ctx.moveTo(-9, -3);
      ctx.quadraticCurveTo(-3, -12, 3, -3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3, -7.5);
      ctx.lineTo(-3, 3);
      ctx.arc(-2, 3, 1, Math.PI, 0, true);
      ctx.stroke();
      ctx.strokeStyle = rose;
      ctx.setLineDash([1.5, 1.5]);
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.quadraticCurveTo(6, 6, 9, 9);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case 'hook':
      // Un câble en pente, le parapluie fermé pendu par son crochet, et la glissade le long.
      ctx.beginPath();
      ctx.moveTo(-9, -8);
      ctx.lineTo(9, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-3, -5.2, 1.6, Math.PI, 0);
      ctx.moveTo(-1.4, -5.2);
      ctx.lineTo(-1.4, 1);
      ctx.lineTo(0, 7);
      ctx.lineTo(-2.8, 7);
      ctx.lineTo(-1.4, 1);
      ctx.stroke();
      ctx.strokeStyle = rose;
      ctx.setLineDash([1.5, 1.5]);
      arrow(ctx, 1.5, -2.5, 8, 0);
      ctx.setLineDash([]);
      break;
    case 'slide':
      // Une barrière basse, Céleste couchée qui passe dessous, et l'élan.
      ctx.beginPath();
      ctx.moveTo(-9, 8);
      ctx.lineTo(9, 8);
      ctx.moveTo(2, 8);
      ctx.lineTo(2, 1);
      ctx.lineTo(9, 1);
      ctx.lineTo(9, 8);
      ctx.stroke();
      ctx.fillStyle = rose;
      ctx.beginPath();
      ctx.arc(3.5, 5.6, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1.8, 6.2);
      ctx.lineTo(-4.5, 6.8);
      ctx.stroke();
      ctx.strokeStyle = rose;
      ctx.setLineDash([1.5, 1.5]);
      arrow(ctx, -9, 3.5, -3, 3.5);
      ctx.setLineDash([]);
      break;
    case 'shift':
      // La bascule (D-107) : une planche pleine (la couche où l'on est), une autre en contour
      // pointillé (l'autre couche), et la flèche qui passe de l'une à l'autre.
      ctx.beginPath();
      ctx.rect(-9, 2, 8, 4);
      ctx.stroke();
      ctx.setLineDash([1.5, 1.5]);
      ctx.beginPath();
      ctx.rect(1, -6, 8, 4);
      ctx.stroke();
      ctx.strokeStyle = rose;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.quadraticCurveTo(-4, -7, 1, -8);
      ctx.stroke();
      ctx.setLineDash([]);
      arrow(ctx, -1, -7.6, 1.5, -8);
      break;
  }
  ctx.restore();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const angle = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - 2.5 * Math.cos(angle - 0.5), y1 - 2.5 * Math.sin(angle - 0.5));
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 2.5 * Math.cos(angle + 0.5), y1 - 2.5 * Math.sin(angle + 0.5));
  ctx.stroke();
}
