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
    case 'washing':
      drawWashing(ctx, w, h);
      break;
    case 'coats':
      drawCoats(ctx, w, h);
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

/** Du linge qui sèche sur un fil (la rue) : un grand drap, une serviette, une chemise, des pinces. */
function drawWashing(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeStyle = '#6b625a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(w / 2, 4.5, w, 2);
  ctx.stroke();
  const pieces = [
    { x: 0.02, width: 0.42, len: 1, color: '#f2efe6', stripe: '#c9d9ea' },
    { x: 0.46, width: 0.26, len: 0.82, color: '#e9a3b4', stripe: '#f6c9d4' },
    { x: 0.74, width: 0.25, len: 0.9, color: '#9fc2df', stripe: '#c7dcee' },
  ];
  for (const piece of pieces) {
    const x = piece.x * w;
    const pw = piece.width * w;
    const ph = piece.len * h - 3;
    ctx.fillStyle = piece.color;
    ctx.beginPath();
    ctx.moveTo(x, 3);
    ctx.lineTo(x + pw, 3);
    ctx.lineTo(x + pw - 0.5, 3 + ph);
    ctx.quadraticCurveTo(x + pw / 2, 3 + ph + 1.5, x + 0.5, 3 + ph);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = piece.stripe;
    ctx.fillRect(x + 1, 3 + ph * 0.7, pw - 2, 1.4);
    // Les plis, et deux pinces en bois.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.moveTo(x + pw * 0.35, 4);
    ctx.lineTo(x + pw * 0.38, 2 + ph);
    ctx.stroke();
    ctx.fillStyle = '#b48a5c';
    ctx.fillRect(x + 1.5, 1, 1.4, 3.5);
    ctx.fillRect(x + pw - 3, 1, 1.4, 3.5);
  }
}

/** Un portant de manteaux oubliés (les objets trouvés) : des manteaux serrés qui tombent au sol. */
function drawCoats(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#7a6a58';
  ctx.fillRect(0, 1, w, 1.6);
  ctx.fillRect(1, 1, 1.6, h - 1);
  ctx.fillRect(w - 2.6, 1, 1.6, h - 1);
  const colors = ['#8a5a4a', '#4f6f8f', '#c9a04a', '#6d7b5a', '#b06a7a', '#5b5470'];
  const count = Math.max(3, Math.round(w / 6));
  for (let i = 0; i < count; i++) {
    const x = (i / count) * w - 1;
    const cw = w / count + 4;
    const len = h - ((i * 29) % 3);
    ctx.fillStyle = colors[i % colors.length] ?? '#8a5a4a';
    ctx.beginPath();
    ctx.moveTo(x + cw * 0.3, 2.5);
    ctx.lineTo(x + cw * 0.7, 2.5);
    ctx.lineTo(x + cw, 7);
    ctx.lineTo(x + cw - 0.5, len);
    ctx.lineTo(x + 0.5, len);
    ctx.lineTo(x, 7);
    ctx.closePath();
    ctx.fill();
    // Le col et une rangée de boutons.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x + cw / 2 - 0.4, 6, 0.8, len - 7);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let y = 9; y < len - 6; y += 4) {
      ctx.beginPath();
      ctx.arc(x + cw / 2 + 1.2, y, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
