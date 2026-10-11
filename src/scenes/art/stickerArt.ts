/**
 * La gommette étoile des capacités (D-164, choix de l'utilisateur) : l'étoile dorée qu'on colle sur
 * le cahier d'un enfant quand il a appris quelque chose (et une étoile, pour Céleste). Bombée, un
 * bord blanc découpé qui la détache de tous les fonds, un reflet. PLACEHOLDER. La même partout :
 * dans le décor, dans son envol vers le sac, dans « Mes capacités ».
 */

const BORDER = '#fffdf6';
const EDGE = 'rgba(91, 74, 68, 0.6)';
const GOLD_LIGHT = '#ffe08a';
const GOLD_DARK = '#e3a332';

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const inner = r * 0.48;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : inner;
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
  }
  ctx.closePath();
}

/** La gommette, centrée en (cx, cy), de rayon `r` (bord blanc compris). */
export function drawSticker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save();
  ctx.lineJoin = 'round';
  // Le bord blanc découpé, arrondi aux pointes, et son trait.
  starPath(ctx, cx, cy, r * 0.84);
  ctx.lineWidth = r * 0.32;
  ctx.strokeStyle = EDGE;
  ctx.stroke();
  ctx.lineWidth = r * 0.24;
  ctx.strokeStyle = BORDER;
  ctx.stroke();
  ctx.fillStyle = BORDER;
  ctx.fill();
  // L'étoile dorée, bombée.
  const gold = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  gold.addColorStop(0, GOLD_LIGHT);
  gold.addColorStop(1, GOLD_DARK);
  starPath(ctx, cx, cy, r * 0.7);
  ctx.lineWidth = r * 0.1;
  ctx.strokeStyle = gold;
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.fill();
  // Le reflet.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.18, cy - r * 0.2, r * 0.14, r * 0.07, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
