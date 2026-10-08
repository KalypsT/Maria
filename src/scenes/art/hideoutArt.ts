/**
 * Les cachettes (D-148), dessinées par le code (PLACEHOLDER) dans un cadre de `w` × `h` px : au
 * premier plan, devant Céleste ; elles s'effacent quand elle passe derrière.
 */
export function drawHideout(
  ctx: CanvasRenderingContext2D,
  kind: string,
  w: number,
  h: number,
  night: boolean,
): void {
  switch (kind) {
    case 'sheet':
      drawSheet(ctx, w, h, night);
      break;
    case 'wisteria':
      drawWisteria(ctx, w, h);
      break;
    default:
      // Inconnue : un voile, pour qu'elle se voie et se corrige.
      ctx.fillStyle = 'rgba(120, 110, 140, 0.8)';
      ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Un drap jeté sur une planche (le grenier) : il tombe en plis jusqu'au sol, le bas un peu effrangé.
 */
function drawSheet(ctx: CanvasRenderingContext2D, w: number, h: number, night: boolean): void {
  const cloth = night ? '#c9ccd6' : '#ece6da';
  const fold = night ? 'rgba(70, 76, 100, 0.35)' : 'rgba(120, 104, 86, 0.3)';
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(1, 3);
  ctx.quadraticCurveTo(w / 2, -2, w - 1, 3);
  // Le bas, un peu effrangé, qui touche le sol.
  ctx.lineTo(w, h);
  const teeth = Math.max(3, Math.round(w / 5));
  for (let i = teeth; i >= 0; i--) {
    ctx.lineTo((i / teeth) * w, h - (i % 2 === 0 ? 0 : 2.2));
  }
  ctx.closePath();
  ctx.fill();
  // Les plis : des traits plus sombres qui partent du haut et s'évasent.
  ctx.strokeStyle = fold;
  ctx.lineWidth = 1.4;
  const folds = Math.max(2, Math.round(w / 9));
  for (let i = 1; i <= folds; i++) {
    const x = (i / (folds + 1)) * w;
    ctx.beginPath();
    ctx.moveTo(w / 2 + (x - w / 2) * 0.3, 4);
    ctx.quadraticCurveTo(x, h * 0.5, x + (x - w / 2) * 0.15, h - 1);
    ctx.stroke();
  }
  // Une ombre douce sur le bord gauche.
  const shade = ctx.createLinearGradient(0, 0, w * 0.35, 0);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 2, w * 0.35, h - 2);
}

/**
 * Une glycine qui pend d'une poutre : un feuillage dense le long du haut, et des grappes mauves
 * serrées qui tombent et cachent ce qu'il y a derrière.
 */
function drawWisteria(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Un fond de feuillage sombre derrière les grappes : rien ne se voit au travers.
  ctx.fillStyle = 'rgba(78, 112, 70, 0.92)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h * 0.82);
  for (let x = w; x >= 0; x -= 3) {
    ctx.lineTo(x, h * (0.78 + (((x * 13) % 7) / 7) * 0.2));
  }
  ctx.closePath();
  ctx.fill();
  // Les grappes, serrées, de longueurs différentes.
  const clusters = Math.max(4, Math.round(w / 2.6));
  for (let i = 0; i < clusters; i++) {
    const x = ((i + 0.5) / clusters) * w + (((i * 37) % 7) - 3) * 0.3;
    const len = h * (0.82 + (((i * 53) % 10) / 10) * 0.18);
    for (let y = 4; y < len; y += 2) {
      const k = 1 - y / len;
      ctx.fillStyle = (i + Math.floor(y / 2)) % 3 === 0 ? '#9d7fc4' : '#b79bd6';
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(y * 0.6 + i) * 0.7, y, 1.5 + 1.6 * k, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Le feuillage le long du haut, par-dessus.
  ctx.fillStyle = '#5f8a4e';
  for (let x = 0; x < w; x += 3.5) {
    const r = 3.2 + ((x * 7) % 5) * 0.3;
    ctx.beginPath();
    ctx.ellipse(x + 2, 3 + ((x * 3) % 4), r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
