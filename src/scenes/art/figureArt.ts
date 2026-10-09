/**
 * Les pictogrammes de la page « Mon voyage » du cahier (D-153), au crayon, dans un cadre de `size`
 * px centré sur (cx, cy). PLACEHOLDER (dessinés par le code), comme les autres dessins du cahier.
 */
export type FigureIcon = 'time' | 'memories' | 'places' | 'faints';

export function drawFigureIcon(
  ctx: CanvasRenderingContext2D,
  icon: FigureIcon,
  cx: number,
  cy: number,
  size: number,
  ink: string,
  accent: string,
): void {
  const s = size / 2;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1.4, size / 22);
  switch (icon) {
    case 'time': {
      // Un réveil : le cadran, deux aiguilles, deux cloches.
      const r = s * 0.62;
      ctx.beginPath();
      ctx.arc(cx, cy + s * 0.06, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.06);
      ctx.lineTo(cx, cy - r * 0.6);
      ctx.moveTo(cx, cy + s * 0.06);
      ctx.lineTo(cx + r * 0.45, cy + s * 0.2);
      ctx.stroke();
      ctx.fillStyle = accent;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + side * r * 0.72, cy - r * 0.78, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'memories': {
      // Une photo un peu de travers, un cœur dessus.
      ctx.translate(cx, cy);
      ctx.rotate(-0.12);
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      ctx.rect(-s * 0.6, -s * 0.66, s * 1.2, s * 1.32);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(-s * 0.46, -s * 0.52, s * 0.92, s * 0.84);
      ctx.stroke();
      ctx.fillStyle = accent;
      const h = s * 0.26;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.02 + h * 0.9);
      ctx.bezierCurveTo(-h * 1.4, -s * 0.1, -h * 0.7, -s * 0.1 - h * 1.3, 0, -s * 0.1 - h * 0.45);
      ctx.bezierCurveTo(h * 0.7, -s * 0.1 - h * 1.3, h * 1.4, -s * 0.1, 0, -s * 0.02 + h * 0.9);
      ctx.fill();
      break;
    }
    case 'places': {
      // Une petite maison, sa porte et sa fenêtre.
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.62, cy - s * 0.02);
      ctx.lineTo(cx, cy - s * 0.62);
      ctx.lineTo(cx + s * 0.62, cy - s * 0.02);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(cx - s * 0.48, cy - s * 0.1, s * 0.96, s * 0.72);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.rect(cx - s * 0.12, cy + s * 0.22, s * 0.24, s * 0.4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(cx + s * 0.18, cy + s * 0.02, s * 0.2, s * 0.18);
      ctx.stroke();
      break;
    }
    case 'faints': {
      // Une petite lune et une étoile (choix de l'utilisateur : jamais « mort » ni « échec »).
      const r = s * 0.56;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx - s * 0.08, cy + s * 0.04, r, Math.PI * 0.25, Math.PI * 1.75, false);
      ctx.arc(cx + s * 0.16, cy - s * 0.06, r * 0.82, Math.PI * 1.62, Math.PI * 0.38, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Une petite étoile scintillante (quatre pointes), pleine.
      const sx = cx + s * 0.52;
      const sy = cy - s * 0.48;
      const k = s * 0.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy - k);
      ctx.quadraticCurveTo(sx, sy, sx + k, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy + k);
      ctx.quadraticCurveTo(sx, sy, sx - k, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy - k);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}
