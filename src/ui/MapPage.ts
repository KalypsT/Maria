import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import type { MapModel, MapPoint, MapRoom } from '../core/world/mapModel';
import type { MapBox } from '../core/world/zone';

/** Durée du tracé d'une salle découverte depuis la dernière ouverture (ms). */
const DRAW_IN_MS = 900;

/** Couleurs du thème (D-24), lues dans les variables CSS `:root`. */
function themeColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#3b3330';
}

/** Hasard reproductible (tremblé du crayon identique à chaque ouverture). */
function seeded(text: string): () => number {
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) | 0;
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Carte dessinée par Céleste (§24), page du cahier en plein écran. Le jeu est en pause tant
 * qu'elle est ouverte ; un toucher ou le bouton Carte la referme. Dessinée au crayon : salles
 * visitées, salles devinées (« ? »), passages, veilleuses allumées, trouvailles, Céleste.
 */
export class MapPage {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly title: HTMLElement;
  private frame = 0;
  private openedAt = 0;
  private model: MapModel | null = null;
  private bounds: MapBox = { x: 0, y: 0, w: 1, h: 1 };

  constructor(private readonly onClose: () => void) {
    this.root = document.createElement('div');
    this.root.id = 'map-page';
    this.root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.root.hidden = true;
    const panel = document.createElement('div');
    panel.className = 'map-panel';
    this.title = document.createElement('p');
    this.title.className = 'map-title';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'map-canvas';
    panel.append(this.title, this.canvas);
    this.root.append(panel);
    this.root.addEventListener('pointerup', () => {
      this.onClose();
    });
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /** Ouvre la carte. `bounds` : boîte englobant toute la zone (disposition stable). */
  open(model: MapModel, title: string, bounds: MapBox): void {
    this.model = model;
    this.bounds = bounds;
    this.title.textContent = title;
    this.root.hidden = false;
    this.openedAt = performance.now();
    const tick = () => {
      this.draw(performance.now() - this.openedAt);
      this.frame = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(tick);
  }

  close(): void {
    this.root.hidden = true;
    cancelAnimationFrame(this.frame);
    this.model = null;
  }

  destroy(): void {
    this.close();
    this.root.remove();
  }

  private draw(elapsedMs: number): void {
    const model = this.model;
    const canvas = this.canvas;
    if (!model) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (
      canvas.width !== Math.round(width * ratio) ||
      canvas.height !== Math.round(height * ratio)
    ) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const margin = 18;
    const b = this.bounds;
    const unit = Math.min((width - 2 * margin) / b.w, (height - 2 * margin) / b.h);
    const ox = (width - b.w * unit) / 2 - b.x * unit;
    const oy = (height - b.h * unit) / 2 - b.y * unit;
    const px = (p: MapPoint) => ({ x: ox + p.x * unit, y: oy + p.y * unit });
    const ink = themeColor('--ink');
    const pencil = themeColor('--pencil');
    const rose = themeColor('--crayon-rose');
    const roseSoft = themeColor('--crayon-rose-soft');
    const blue = themeColor('--crayon-blue');
    const lamp = themeColor('--lamp');
    const paperDeep = themeColor('--paper-deep');
    const font = getComputedStyle(document.body).fontFamily;
    const drawIn = Math.min(1, elapsedMs / DRAW_IN_MS);

    // Passages : trait entre salles voisines ; passage lointain (trappe, passage secret) : deux
    // amorces marquées de la même couleur, comme un renvoi dessiné par un enfant.
    ctx.lineCap = 'round';
    const markers = [rose, blue, lamp, pencil];
    let far = 0;
    for (const link of model.links) {
      const a = px(link.from);
      const c = px(link.to);
      if (link.direct) {
        ctx.strokeStyle = pencil;
        ctx.lineWidth = 3;
        // Coude si les portes ne sont pas à la même hauteur.
        const mid = (a.x + c.x) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mid, a.y);
        ctx.lineTo(mid, c.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        continue;
      }
      const color = markers[far % markers.length] ?? pencil;
      far++;
      for (const [p, side] of [
        [a, link.fromSide],
        [c, link.toSide],
      ] as const) {
        const end = { x: p.x + side * unit * 0.28, y: p.y };
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(end.x + side * 3, end.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.setLineDash([]);

    // Salles.
    for (const room of model.rooms) {
      const progress = room.fresh ? drawIn : 1;
      this.drawRoom(ctx, room, px, unit, progress, { ink, pencil, roseSoft, paperDeep, font });
    }

    // Veilleuses, trouvailles, Céleste.
    for (const room of model.rooms) {
      if (room.fresh && drawIn < 1) {
        continue;
      }
      for (const l of room.lamps) {
        const p = px(l);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
        glow.addColorStop(0, lamp);
        glow.addColorStop(1, 'rgba(242,200,121,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
        ctx.fillStyle = lamp;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        if (l.current) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      for (const s of room.stars) {
        const p = px(s);
        ctx.fillStyle = rose;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? 6 : 2.6;
          ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
        }
        ctx.fill();
      }
    }
    if (model.celeste) {
      const p = px(model.celeste);
      const bob = Math.sin(elapsedMs / 300) * 1.5;
      this.drawCeleste(ctx, p.x, p.y - 8 + bob, blue);
    }
  }

  private drawRoom(
    ctx: CanvasRenderingContext2D,
    room: MapRoom,
    px: (p: MapPoint) => { x: number; y: number },
    unit: number,
    progress: number,
    c: { ink: string; pencil: string; roseSoft: string; paperDeep: string; font: string },
  ): void {
    const tl = px({ x: room.box.x, y: room.box.y });
    const w = room.box.w * unit;
    const h = room.box.h * unit;
    const random = seeded(room.id);
    // Contour au crayon, légèrement tremblé, tracé en deux passes.
    const outline = () => {
      const points: { x: number; y: number }[] = [];
      const corners = [
        [tl.x, tl.y],
        [tl.x + w, tl.y],
        [tl.x + w, tl.y + h],
        [tl.x, tl.y + h],
        [tl.x, tl.y],
      ] as const;
      for (let i = 0; i < 4; i++) {
        const [x0, y0] = corners[i] ?? [0, 0];
        const [x1, y1] = corners[i + 1] ?? [0, 0];
        const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14));
        for (let s = 0; s < steps; s++) {
          const k = s / steps;
          points.push({
            x: x0 + (x1 - x0) * k + (random() - 0.5) * 1.6,
            y: y0 + (y1 - y0) * k + (random() - 0.5) * 1.6,
          });
        }
      }
      points.push(points[0] ?? { x: tl.x, y: tl.y });
      return points;
    };
    const perimeter = 2 * (w + h);
    if (room.visited) {
      ctx.globalAlpha = progress;
      ctx.fillStyle = c.paperDeep;
      ctx.fillRect(tl.x + 2, tl.y + 2, w - 4, h - 4);
      // Hachures de crayon rose pâle.
      ctx.save();
      ctx.beginPath();
      ctx.rect(tl.x + 2, tl.y + 2, w - 4, h - 4);
      ctx.clip();
      ctx.strokeStyle = c.roseSoft;
      ctx.lineWidth = 1;
      for (let x = tl.x - h; x < tl.x + w; x += 7) {
        ctx.beginPath();
        ctx.moveTo(x, tl.y + h);
        ctx.lineTo(x + h, tl.y);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = room.visited ? c.ink : c.pencil;
    ctx.lineWidth = room.visited ? 1.6 : 1.2;
    for (let pass = 0; pass < (room.visited ? 2 : 1); pass++) {
      const points = outline();
      ctx.setLineDash(room.visited ? [perimeter * progress, perimeter] : [5, 5]);
      ctx.beginPath();
      for (const p of points) {
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (!room.visited) {
      ctx.fillStyle = c.pencil;
      ctx.font = `600 ${String(Math.round(Math.min(h, w) * 0.45))}px ${c.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', tl.x + w / 2, tl.y + h / 2);
      return;
    }
    if (progress < 1) {
      return;
    }
    ctx.fillStyle = c.ink;
    ctx.font = `italic 600 ${String(Math.max(11, Math.round(unit * 0.28)))}px ${c.font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(room.name, tl.x + 6, tl.y + 5);
    if (room.icon) {
      drawIcon(ctx, room.icon, tl.x + w / 2, tl.y + h * 0.62, Math.min(w, h) * 0.32, c.pencil);
    }
  }

  private drawCeleste(ctx: CanvasRenderingContext2D, x: number, y: number, outline: string): void {
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath();
    ctx.arc(x - 7, y + 1, 3, 0, Math.PI * 2);
    ctx.arc(x + 7, y + 1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e7b995';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#e0598b';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x - 2.4, y + 0.5, 2, 0, Math.PI * 2);
    ctx.moveTo(x + 4.4, y + 0.5);
    ctx.arc(x + 2.4, y + 0.5, 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Petits dessins d'enfant des salles (`; @icon:`). */
function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: string,
  x: number,
  y: number,
  s: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (icon) {
    case 'bed':
      ctx.rect(x - s, y - s * 0.1, s * 2, s * 0.5);
      ctx.moveTo(x - s, y - s * 0.6);
      ctx.lineTo(x - s, y + s * 0.6);
      ctx.moveTo(x - s * 0.8, y - s * 0.3);
      ctx.lineTo(x - s * 0.3, y - s * 0.3);
      break;
    case 'door':
      ctx.rect(x - s * 0.4, y - s * 0.7, s * 0.8, s * 1.3);
      ctx.moveTo(x + s * 0.2, y);
      ctx.arc(x + s * 0.2, y, 1, 0, Math.PI * 2);
      break;
    case 'stairs':
      ctx.moveTo(x - s, y + s * 0.6);
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(x - s + i * s * 0.5, y + s * 0.6 - (i + 1) * s * 0.3);
        ctx.lineTo(x - s + (i + 1) * s * 0.5, y + s * 0.6 - (i + 1) * s * 0.3);
      }
      break;
    case 'roof':
      ctx.moveTo(x - s, y + s * 0.4);
      ctx.lineTo(x, y - s * 0.5);
      ctx.lineTo(x + s, y + s * 0.4);
      break;
    case 'sofa':
      ctx.rect(x - s, y - s * 0.1, s * 2, s * 0.5);
      ctx.rect(x - s * 0.8, y - s * 0.5, s * 1.6, s * 0.4);
      break;
    case 'pot':
      ctx.rect(x - s * 0.6, y - s * 0.3, s * 1.2, s * 0.8);
      ctx.moveTo(x - s * 0.9, y - s * 0.3);
      ctx.lineTo(x + s * 0.9, y - s * 0.3);
      ctx.moveTo(x - s * 0.2, y - s * 0.7);
      ctx.quadraticCurveTo(x, y - s, x + s * 0.2, y - s * 0.7);
      break;
    case 'machine':
      ctx.rect(x - s * 0.6, y - s * 0.7, s * 1.2, s * 1.3);
      ctx.moveTo(x + s * 0.3, y);
      ctx.arc(x, y, s * 0.3, 0, Math.PI * 2);
      break;
    default:
      ctx.arc(x, y, s * 0.3, 0, Math.PI * 2);
  }
  ctx.stroke();
}
