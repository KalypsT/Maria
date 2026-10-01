/**
 * Grain de papier (D-70) : motif de bruit répétable, gris autour du gris moyen (sans effet en
 * lumière douce), calculé une fois par échelle de rendu. Déterministe : les blocs d'une salle se
 * raccordent, et la salle est identique d'un dessin à l'autre.
 */

/** Période du motif (px logiques). */
const PERIOD = 96;
/** Cellules du bruit lent (taches du papier) sur une période. */
const BLOTCH_CELLS = 6;
/** Fibres claires et sombres sur une période. */
const FIBERS = 28;

const canvases = new Map<number, HTMLCanvasElement>();

/** Générateur pseudo-aléatoire (mulberry32) : même graine, même papier. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function grainCanvas(scale: number): HTMLCanvasElement | null {
  const key = Math.round(scale * 100);
  const cached = canvases.get(key);
  if (cached) {
    return cached;
  }
  const size = Math.max(16, Math.round(PERIOD * scale));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  const rand = random(0x6d617269);
  const cells = Array.from({ length: BLOTCH_CELLS * BLOTCH_CELLS }, rand);
  const cell = (i: number, j: number) =>
    cells[
      (((j % BLOTCH_CELLS) + BLOTCH_CELLS) % BLOTCH_CELLS) * BLOTCH_CELLS +
        (((i % BLOTCH_CELLS) + BLOTCH_CELLS) % BLOTCH_CELLS)
    ] ?? 0.5;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  // À l'échelle 1, un point de bruit fin deviendrait un gros carré à l'écran : on l'atténue.
  const fine = 60 * Math.min(1, scale / 2);
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let y = 0; y < size; y++) {
    const v = (y / size) * BLOTCH_CELLS;
    const j = Math.floor(v);
    const ty = smooth(v - j);
    for (let x = 0; x < size; x++) {
      const u = (x / size) * BLOTCH_CELLS;
      const i = Math.floor(u);
      const tx = smooth(u - i);
      const top = cell(i, j) + (cell(i + 1, j) - cell(i, j)) * tx;
      const bottom = cell(i, j + 1) + (cell(i + 1, j + 1) - cell(i, j + 1)) * tx;
      const blotch = top + (bottom - top) * ty;
      const value = 128 + (blotch - 0.5) * 70 + (rand() - 0.5) * fine;
      const k = (y * size + x) * 4;
      data[k] = data[k + 1] = data[k + 2] = Math.max(0, Math.min(255, value));
      data[k + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  // Fibres : petits traits courbes, répétés aux bords pour que le motif se raccorde.
  ctx.lineWidth = Math.max(0.6, 0.5 * scale);
  for (let n = 0; n < FIBERS; n++) {
    const x = rand() * size;
    const y = rand() * size;
    const length = (4 + rand() * 8) * scale;
    const angle = rand() * Math.PI;
    const bend = (rand() - 0.5) * length;
    ctx.strokeStyle = n % 2 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const x0 = x + ox;
        const y0 = y + oy;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(
          x0 + (Math.cos(angle) * length) / 2 - Math.sin(angle) * bend,
          y0 + (Math.sin(angle) * length) / 2 + Math.cos(angle) * bend,
          x0 + Math.cos(angle) * length,
          y0 + Math.sin(angle) * length,
        );
        ctx.stroke();
      }
    }
  }
  canvases.set(key, canvas);
  return canvas;
}

/**
 * Motif du grain pour une toile dessinée à l'échelle `scale` (coordonnées logiques) : un point du
 * motif par pixel de la toile, ancré à l'origine de la salle.
 */
export function paperGrainPattern(
  ctx: CanvasRenderingContext2D,
  scale: number,
): CanvasPattern | null {
  const canvas = grainCanvas(scale);
  const pattern = canvas ? ctx.createPattern(canvas, 'repeat') : null;
  pattern?.setTransform(new DOMMatrix([1 / scale, 0, 0, 1 / scale, 0, 0]));
  return pattern;
}
