import { MEMORY_IMAGES, RECORD_IMAGES, TREASURE_SHARED_IMAGES } from '../config/art';
import type { MemoryId } from '../config/memories';
import { RECORDS, recordSlot, type RecordSlot } from '../config/records';
import { drawMemory } from '../scenes/art/memoryArt';

/** Un canvas net à la densité de l'écran, de `w` × `h` px CSS ; `draw` y dessine en px CSS. */
export function drawnCanvas(
  className: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  // Sa taille à l'écran en px CSS (sinon, sur un écran net, il s'affiche `ratio` fois trop grand) ;
  // la hauteur suit, s'il est rétréci.
  canvas.style.width = `${String(w)}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(ratio, ratio);
    draw(ctx);
  }
  return canvas;
}

/**
 * Le dessin d'un trésor : son image fournie (D-169), ou son dessin par le code, dans un carré de
 * `size` px CSS.
 */
export function treasureDrawing(className: string, id: MemoryId, size: number): HTMLElement {
  const file = MEMORY_IMAGES[id] ?? TREASURE_SHARED_IMAGES[id];
  if (file) {
    const img = document.createElement('img');
    img.className = `${className} treasure-image`;
    img.src = `art/${file}`;
    img.alt = '';
    img.draggable = false;
    img.style.width = `${String(size)}px`;
    img.style.height = `${String(size)}px`;
    return img;
  }
  return drawnCanvas(className, size, size, (ctx) => {
    drawMemory(ctx, id, size / 2, size / 2, size * 0.9);
  });
}

/**
 * La pochette d'un disque (D-121, D-170) : son image fournie, ou un carré de sa couleur. `big` : la
 * grande, sur sa fiche.
 */
export function recordDrawing(slot: RecordSlot, big = false): HTMLElement {
  const record = RECORDS.find((r) => recordSlot(r.id) === slot);
  if (record) {
    const img = document.createElement('img');
    img.className = `treasure-sleeve-image${big ? ' big' : ''}`;
    img.src = `art/${RECORD_IMAGES[record.id]}`;
    img.alt = '';
    img.draggable = false;
    return img;
  }
  const sleeve = document.createElement('span');
  sleeve.className = `treasure-sleeve${big ? ' big' : ''}`;
  return sleeve;
}
