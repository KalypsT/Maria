/**
 * La coquille d'escargot (D-148), dessinée par le code quand l'image `shell` manque : PLACEHOLDER.
 * Elle remplit le cadre (x, y, w, h), l'ouverture à droite, posée sur le bas du cadre.
 */
export function drawShellFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const r = h * 0.48;
  const cx = x + r + w * 0.02;
  const cy = y + h * 0.5;
  ctx.save();
  ctx.lineJoin = 'round';
  // L'ouverture, un bourrelet clair sous la spire, vers la droite.
  ctx.fillStyle = '#ead5b3';
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = Math.max(0.6, h / 14);
  ctx.beginPath();
  ctx.ellipse(x + w * 0.74, y + h * 0.84, w * 0.25, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // La spire.
  ctx.fillStyle = '#d6b483';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // La spirale, du bord vers le centre (trois tours).
  ctx.beginPath();
  const steps = 54;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const angle = t * Math.PI * 6;
    const radius = r * 0.86 * (1 - t);
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    if (k === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** Scintillement (D-148) : une petite étoile à quatre branches, centrée, de côté `size`. */
export function drawShellGlint(ctx: CanvasRenderingContext2D, size: number): void {
  const c = size / 2;
  const thin = size * 0.09;
  ctx.save();
  ctx.fillStyle = '#fff7ec';
  ctx.shadowColor = 'rgba(255,214,228,0.9)';
  ctx.shadowBlur = size * 0.25;
  ctx.beginPath();
  ctx.moveTo(c, 0);
  ctx.quadraticCurveTo(c + thin, c - thin, size, c);
  ctx.quadraticCurveTo(c + thin, c + thin, c, size);
  ctx.quadraticCurveTo(c - thin, c + thin, 0, c);
  ctx.quadraticCurveTo(c - thin, c - thin, c, 0);
  ctx.fill();
  ctx.restore();
}

/**
 * Nombre de 0 à 1 tiré d'un nom (toujours le même pour le même nom) : le côté de l'ouverture et le
 * moment du scintillement d'une coquille, pour qu'elles ne scintillent pas toutes ensemble.
 */
export function shellSeed(name: string): number {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i++) {
    hash = Math.imul(hash ^ name.charCodeAt(i), 16777619);
  }
  return (hash >>> 0) / 4294967296;
}
