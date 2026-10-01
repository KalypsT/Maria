import type { FlashbackId } from '../../config/memories';
import { roger } from './memoryArt';

/**
 * Courts souvenirs (D-68), dessinés par le code, PLACEHOLDER : une vignette aux couleurs chaudes
 * et passées, bords adoucis, sans texte. Maria n'y est jamais (pilier 5).
 */
export function drawFlashback(
  ctx: CanvasRenderingContext2D,
  id: FlashbackId,
  cx: number,
  cy: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  // Le cadre : un souvenir un peu flou, couleur de vieille photo.
  const frame = ctx.createRadialGradient(0, 0, Math.min(w, h) * 0.2, 0, 0, Math.max(w, h) * 0.62);
  frame.addColorStop(0, '#f6e3c4');
  frame.addColorStop(0.7, '#e7c9a1');
  frame.addColorStop(1, 'rgba(214, 178, 138, 0)');
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.12);
  ctx.fill();
  FLASHBACK_DRAWERS[id](ctx, w, h);
  // Grain et voile chaud par-dessus.
  ctx.fillStyle = 'rgba(255, 214, 160, 0.12)';
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.12);
  ctx.fill();
  ctx.restore();
}

/** Dessin de chaque court souvenir, dans son cadre (centré en 0, 0). */
const FLASHBACK_DRAWERS: Readonly<
  Record<FlashbackId, (ctx: CanvasRenderingContext2D, w: number, h: number) => void>
> = {
  roger: (ctx, w, h) => {
    drawRogerMemory(ctx, w, h);
  },
};

/**
 * Céleste toute petite (un an et demi environ : grosse tête ronde, deux petites touffes, ses
 * lunettes rondes roses), assise sur un tapis, serre Roger contre elle, les yeux fermés. Derrière,
 * les barreaux d'un lit à barreaux et une petite lampe.
 */
function drawRogerMemory(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const s = Math.min(w, h);
  // Le lit à barreaux et la lampe, dans le fond, très pâles.
  ctx.strokeStyle = 'rgba(160, 120, 90, 0.35)';
  ctx.lineWidth = s * 0.012;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -h * 0.05);
  ctx.lineTo(-w * 0.05, -h * 0.05);
  for (let x = -w * 0.4; x < -w * 0.06; x += s * 0.05) {
    ctx.moveTo(x, -h * 0.05);
    ctx.lineTo(x, h * 0.2);
  }
  ctx.stroke();
  const lamp = ctx.createRadialGradient(w * 0.32, -h * 0.22, 0, w * 0.32, -h * 0.22, s * 0.22);
  lamp.addColorStop(0, 'rgba(255, 230, 170, 0.8)');
  lamp.addColorStop(1, 'rgba(255, 230, 170, 0)');
  ctx.fillStyle = lamp;
  ctx.fillRect(w * 0.1, -h * 0.45, w * 0.4, h * 0.5);
  // Le tapis.
  ctx.fillStyle = 'rgba(200, 120, 140, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.34, w * 0.36, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // Céleste toute petite, assise : jambes courtes devant, corps rond (un body rose pâle).
  const skin = '#f0c19e';
  const hair = '#6b4329';
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(-s * 0.1, s * 0.31, s * 0.07, s * 0.04, 0.1, 0, Math.PI * 2);
  ctx.ellipse(s * 0.1, s * 0.31, s * 0.07, s * 0.04, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7d3dc';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.17, s * 0.17, s * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  // Roger serré contre elle, entre ses bras.
  ctx.save();
  ctx.translate(0, s * 0.17);
  roger(ctx, s * 0.3);
  ctx.restore();
  // Les bras de Céleste autour de Roger.
  ctx.strokeStyle = skin;
  ctx.lineWidth = s * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, s * 0.08);
  ctx.quadraticCurveTo(-s * 0.12, s * 0.22, s * 0.04, s * 0.2);
  ctx.moveTo(s * 0.15, s * 0.08);
  ctx.quadraticCurveTo(s * 0.12, s * 0.24, -s * 0.03, s * 0.24);
  ctx.stroke();
  // La tête, penchée sur Roger : cheveux courts, deux petites touffes, yeux fermés, lunettes roses.
  ctx.save();
  ctx.translate(-s * 0.02, -s * 0.07);
  ctx.rotate(-0.15);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(0, -s * 0.03, s * 0.13, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.12, -s * 0.06, s * 0.035, 0, Math.PI * 2);
  ctx.arc(s * 0.12, -s * 0.06, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff6fa3';
  ctx.lineWidth = s * 0.012;
  ctx.beginPath();
  ctx.arc(-s * 0.045, s * 0.01, s * 0.035, 0, Math.PI * 2);
  ctx.moveTo(s * 0.08, s * 0.01);
  ctx.arc(s * 0.045, s * 0.01, s * 0.035, 0, Math.PI * 2);
  ctx.moveTo(-s * 0.01, s * 0.01);
  ctx.lineTo(s * 0.01, s * 0.01);
  ctx.stroke();
  ctx.strokeStyle = '#5a3a2a';
  ctx.lineWidth = s * 0.008;
  ctx.beginPath();
  ctx.arc(-s * 0.045, s * 0.012, s * 0.015, 0.2, Math.PI - 0.2);
  ctx.moveTo(s * 0.06, s * 0.012);
  ctx.arc(s * 0.045, s * 0.012, s * 0.015, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232, 112, 143, 0.35)';
  ctx.beginPath();
  ctx.arc(-s * 0.08, s * 0.05, s * 0.022, 0, Math.PI * 2);
  ctx.arc(s * 0.08, s * 0.05, s * 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
