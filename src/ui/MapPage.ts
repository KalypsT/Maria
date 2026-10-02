import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import type { MapModel, MapPoint, MapRoom } from '../core/world/mapModel';
import type { MapBox } from '../core/world/zone';
import { ABILITY_HINTS, Ability } from '../config/abilities';
import {
  MARIA_THINGS,
  MEMORIES,
  STRANGE_THINGS,
  flashbackOf,
  type MemoryId,
} from '../config/memories';
import { drawAbility } from '../scenes/art/abilityArt';
import { drawFlashback } from '../scenes/art/flashbackArt';
import { playableOf, type PlayableMemoryId } from '../config/playableMemories';
import { drawMemory } from '../scenes/art/memoryArt';

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
type NotebookPage = 'map' | 'memories' | 'maria' | 'strange' | 'abilities';

export class MapPage {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly title: HTMLButtonElement;
  private readonly memoriesTab: HTMLButtonElement;
  private readonly mariaTab: HTMLButtonElement;
  private readonly strangeTab: HTMLButtonElement;
  private readonly abilitiesTab: HTMLButtonElement;
  /** Capacités acquises (D-62), pour la page « Mes capacités ». */
  private abilities: ReadonlySet<string> = new Set();
  /** Page affichée : la carte, les souvenirs (D-38) ou les affaires de Maria (D-58). */
  private page: NotebookPage = 'map';
  private found: ReadonlySet<string> = new Set();
  /** Souvenir affiché en grand (null : la grille). */
  private selected: MemoryId | null = null;
  /** Cases de la grille des souvenirs (px CSS du canvas), pour les touchers. */
  private cells: { id: MemoryId; x: number; y: number; size: number }[] = [];
  private frame = 0;
  private openedAt = 0;
  private model: MapModel | null = null;
  private bounds: MapBox = { x: 0, y: 0, w: 1, h: 1 };

  constructor(
    private readonly onClose: () => void,
    /** Un souvenir jouable touché dans le cahier (D-89) : le cahier se ferme, il se rejoue. */
    private readonly onPlayMemory: (id: PlayableMemoryId) => void = () => undefined,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'map-page';
    this.root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.root.hidden = true;
    const panel = document.createElement('div');
    panel.className = 'map-panel';
    // Onglets manuscrits : la carte, les souvenirs (D-38), les affaires de Maria (D-58), le monde
    // étrange (D-64) et les capacités acquises (D-62).
    const tabs = document.createElement('div');
    tabs.className = 'map-tabs';
    this.title = document.createElement('button');
    this.title.className = 'map-title';
    this.memoriesTab = document.createElement('button');
    this.memoriesTab.className = 'map-title';
    this.memoriesTab.textContent = 'Mes souvenirs';
    this.mariaTab = document.createElement('button');
    this.mariaTab.className = 'map-title';
    this.mariaTab.textContent = 'Les affaires de Maria';
    this.strangeTab = document.createElement('button');
    this.strangeTab.className = 'map-title';
    this.strangeTab.textContent = 'Monde étrange';
    this.abilitiesTab = document.createElement('button');
    this.abilitiesTab.className = 'map-title';
    this.abilitiesTab.textContent = 'Mes capacités';
    tabs.append(this.title, this.memoriesTab, this.mariaTab, this.strangeTab, this.abilitiesTab);
    for (const [tab, page] of [
      [this.title, 'map'],
      [this.memoriesTab, 'memories'],
      [this.mariaTab, 'maria'],
      [this.strangeTab, 'strange'],
      [this.abilitiesTab, 'abilities'],
    ] as const) {
      tab.type = 'button';
      tab.addEventListener('pointerup', (event) => {
        event.stopPropagation();
        this.show(page);
      });
    }
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'map-canvas';
    this.canvas.addEventListener('pointerup', (event) => {
      if (this.memoryList() !== null && this.touchMemories(event)) {
        event.stopPropagation();
      }
    });
    panel.append(tabs, this.canvas);
    this.root.append(panel);
    this.root.addEventListener('pointerup', () => {
      this.onClose();
    });
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /**
   * Ouvre le cahier sur la carte. `bounds` : boîte englobant toute la zone (disposition stable) ;
   * `memories` : souvenirs trouvés ; `abilities` : capacités acquises.
   */
  open(
    model: MapModel,
    title: string,
    bounds: MapBox,
    memories: readonly string[] = [],
    abilities: readonly string[] = [],
  ): void {
    this.model = model;
    this.bounds = bounds;
    this.title.textContent = title;
    this.found = new Set(memories);
    this.abilities = new Set(abilities);
    this.show('map');
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

  private show(page: NotebookPage): void {
    this.page = page;
    this.selected = null;
    this.cells = [];
    this.title.classList.toggle('active', page === 'map');
    this.memoriesTab.classList.toggle('active', page === 'memories');
    this.mariaTab.classList.toggle('active', page === 'maria');
    this.strangeTab.classList.toggle('active', page === 'strange');
    this.abilitiesTab.classList.toggle('active', page === 'abilities');
  }

  /**
   * Page « Mes capacités » (D-62, demande de l'utilisateur) : une ligne par capacité, dans l'ordre
   * où on les trouve. Acquise : son pictogramme et comment s'en servir ; sinon une case vide en
   * pointillés, sans rien dévoiler (complétion explicite, §23).
   */
  private drawAbilities(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const ink = themeColor('--ink');
    const pencil = themeColor('--pencil');
    const rose = themeColor('--crayon-rose');
    const font = getComputedStyle(document.body).fontFamily;
    const list = Object.values(Ability);
    const rowH = Math.min(96, (height - 16) / list.length);
    const box = rowH * 0.78;
    const left = 24;
    ctx.lineCap = 'round';
    list.forEach((ability, i) => {
      const cy = 8 + rowH * (i + 0.5);
      const owned = this.abilities.has(ability);
      ctx.strokeStyle = owned ? ink : pencil;
      ctx.lineWidth = owned ? 2 : 1.6;
      ctx.setLineDash(owned ? [] : [6, 5]);
      ctx.beginPath();
      ctx.roundRect(left, cy - box / 2, box, box, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!owned) {
        return;
      }
      drawAbility(ctx, ability, left + box / 2, cy, box * 0.8, ink, rose);
      ctx.fillStyle = ink;
      ctx.font = `italic 600 ${String(Math.round(Math.min(17, rowH * 0.2)))}px ${font}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const x = left + box + 18;
      const lines = wrapText(ctx, ABILITY_HINTS[ability], width - x - 16);
      const lineH = Math.min(22, rowH * 0.26);
      lines.forEach((line, k) => {
        ctx.fillText(line, x, cy + (k - (lines.length - 1) / 2) * lineH);
      });
    });
  }

  /** Cases de la page affichée, si c'est une page de souvenirs (null : carte ou capacités). */
  private memoryList(): readonly MemoryId[] | null {
    switch (this.page) {
      case 'memories':
        return MEMORIES;
      case 'maria':
        return MARIA_THINGS;
      case 'strange':
        return STRANGE_THINGS;
      default:
        return null;
    }
  }

  /** Toucher sur la page des souvenirs : ouvre ou referme un souvenir ; vrai s'il est traité. */
  private touchMemories(event: PointerEvent): boolean {
    if (this.selected !== null) {
      // Un souvenir jouable (D-89), affiché en grand : le toucher encore le rejoue.
      const playable = playableOf(this.selected);
      this.selected = null;
      if (playable) {
        this.onPlayMemory(playable);
      }
      return true;
    }
    const bounds = this.canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    for (const cell of this.cells) {
      const half = cell.size / 2;
      if (Math.abs(x - cell.x) <= half && Math.abs(y - cell.y) <= half) {
        if (this.found.has(cell.id)) {
          this.selected = cell.id;
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Page des souvenirs (D-38) : une case par souvenir, dessiné s'il est trouvé, en pointillés
   * sinon (complétion explicite, §23) ; un souvenir touché s'affiche en grand.
   */
  private drawMemories(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    list: readonly MemoryId[],
  ): void {
    const pencil = themeColor('--pencil');
    const ink = themeColor('--ink');
    ctx.lineCap = 'round';
    if (this.selected !== null) {
      // Un souvenir qui a son court souvenir (D-68) : la vignette se rejoue en grand.
      const flashback = flashbackOf(this.selected);
      if (flashback) {
        drawFlashback(ctx, flashback, width / 2, height / 2, width * 0.86, height * 0.86);
        return;
      }
      const size = Math.min(width, height) * 0.82;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(width / 2 - size / 2, height / 2 - size / 2, size, size, 12);
      ctx.stroke();
      drawMemory(ctx, this.selected, width / 2, height / 2, size * 0.85);
      if (playableOf(this.selected)) {
        // Un souvenir jouable (D-89) : un petit triangle « lecture », sans texte.
        const r = size * 0.08;
        const cx = width / 2 + size / 2 - r * 1.8;
        const cy = height / 2 + size / 2 - r * 1.8;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.6, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx - r * 0.6, cy + r);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }
    const cols = list.length <= 4 ? list.length : 3;
    const rows = Math.ceil(list.length / cols);
    const size = Math.min((width - 24) / cols, (height - 12) / rows) * 0.84;
    const gapX = (width - cols * size) / (cols + 1);
    const gapY = (height - rows * size) / (rows + 1);
    this.cells = list.map((id, i) => ({
      id,
      x: gapX + (i % cols) * (size + gapX) + size / 2,
      y: gapY + Math.floor(i / cols) * (size + gapY) + size / 2,
      size,
    }));
    for (const cell of this.cells) {
      const found = this.found.has(cell.id);
      ctx.strokeStyle = found ? ink : pencil;
      ctx.lineWidth = found ? 2 : 1.6;
      ctx.setLineDash(found ? [] : [6, 5]);
      ctx.beginPath();
      ctx.roundRect(cell.x - size / 2, cell.y - size / 2, size, size, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      if (found) {
        drawMemory(ctx, cell.id, cell.x, cell.y, size * 0.82);
      }
    }
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
    if (this.page === 'abilities') {
      this.drawAbilities(ctx, width, height);
      return;
    }
    const list = this.memoryList();
    if (list !== null) {
      this.drawMemories(ctx, width, height, list);
      return;
    }
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
    // Le jardin (D-46).
    case 'sun':
      ctx.arc(x, y, s * 0.35, 0, Math.PI * 2);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55);
        ctx.lineTo(x + Math.cos(a) * s * 0.85, y + Math.sin(a) * s * 0.85);
      }
      break;
    case 'flower':
      ctx.moveTo(x, y + s * 0.8);
      ctx.lineTo(x, y);
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5;
        ctx.moveTo(x + Math.cos(a) * s * 0.55, y - s * 0.3 + Math.sin(a) * s * 0.55);
        ctx.arc(
          x + Math.cos(a) * s * 0.35,
          y - s * 0.3 + Math.sin(a) * s * 0.35,
          s * 0.2,
          0,
          Math.PI * 2,
        );
      }
      break;
    case 'tree':
      ctx.moveTo(x - s * 0.15, y + s * 0.8);
      ctx.lineTo(x - s * 0.15, y);
      ctx.moveTo(x + s * 0.15, y + s * 0.8);
      ctx.lineTo(x + s * 0.15, y);
      ctx.moveTo(x + s * 0.7, y - s * 0.4);
      ctx.arc(x, y - s * 0.4, s * 0.7, 0, Math.PI * 2);
      break;
    case 'house':
      ctx.rect(x - s * 0.6, y - s * 0.2, s * 1.2, s * 0.8);
      ctx.moveTo(x - s * 0.8, y - s * 0.2);
      ctx.lineTo(x, y - s * 0.8);
      ctx.lineTo(x + s * 0.8, y - s * 0.2);
      break;
    case 'fence':
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(x + i * s * 0.6, y + s * 0.6);
        ctx.lineTo(x + i * s * 0.6, y - s * 0.4);
        ctx.lineTo(x + i * s * 0.6 + s * 0.15, y - s * 0.6);
      }
      ctx.moveTo(x - s, y - s * 0.1);
      ctx.lineTo(x + s, y - s * 0.1);
      break;
    case 'swing':
      // Un portique et sa balançoire (l'aire de jeux, D-61).
      ctx.moveTo(x - s, y + s * 0.7);
      ctx.lineTo(x - s * 0.6, y - s * 0.6);
      ctx.lineTo(x + s * 0.6, y - s * 0.6);
      ctx.lineTo(x + s, y + s * 0.7);
      ctx.moveTo(x - s * 0.2, y - s * 0.6);
      ctx.lineTo(x - s * 0.2, y + s * 0.2);
      ctx.moveTo(x + s * 0.2, y - s * 0.6);
      ctx.lineTo(x + s * 0.2, y + s * 0.2);
      ctx.moveTo(x - s * 0.35, y + s * 0.2);
      ctx.lineTo(x + s * 0.35, y + s * 0.2);
      break;
    case 'basket':
      // Un panier de courses (la supérette, D-63).
      ctx.moveTo(x - s * 0.8, y - s * 0.1);
      ctx.lineTo(x + s * 0.8, y - s * 0.1);
      ctx.lineTo(x + s * 0.55, y + s * 0.7);
      ctx.lineTo(x - s * 0.55, y + s * 0.7);
      ctx.closePath();
      ctx.moveTo(x - s * 0.5, y - s * 0.1);
      ctx.quadraticCurveTo(x, y - s * 1.1, x + s * 0.5, y - s * 0.1);
      break;
    case 'crane':
      // Une grue (le chantier, D-63).
      ctx.moveTo(x - s * 0.3, y + s * 0.8);
      ctx.lineTo(x - s * 0.3, y - s * 0.8);
      ctx.moveTo(x - s * 1, y - s * 0.6);
      ctx.lineTo(x + s * 0.9, y - s * 0.6);
      ctx.moveTo(x + s * 0.6, y - s * 0.6);
      ctx.lineTo(x + s * 0.6, y);
      break;
    case 'school':
      // Une école : un fronton, une horloge ronde, la porte (D-64).
      ctx.moveTo(x - s * 0.9, y + s * 0.7);
      ctx.lineTo(x - s * 0.9, y - s * 0.2);
      ctx.lineTo(x, y - s * 0.85);
      ctx.lineTo(x + s * 0.9, y - s * 0.2);
      ctx.lineTo(x + s * 0.9, y + s * 0.7);
      ctx.closePath();
      ctx.moveTo(x + s * 0.18, y - s * 0.2);
      ctx.arc(x, y - s * 0.2, s * 0.18, 0, Math.PI * 2);
      ctx.rect(x - s * 0.25, y + s * 0.2, s * 0.5, s * 0.5);
      break;
    case 'train':
      // Une locomotive sur ses rails (la gare, D-66).
      ctx.rect(x - s * 0.8, y - s * 0.4, s * 1.4, s * 0.7);
      ctx.moveTo(x + s * 0.6, y - s * 0.4);
      ctx.lineTo(x + s * 0.9, y + s * 0.3);
      ctx.moveTo(x - s, y + s * 0.6);
      ctx.lineTo(x + s, y + s * 0.6);
      ctx.moveTo(x - s * 0.3, y + s * 0.45);
      ctx.arc(x - s * 0.45, y + s * 0.45, s * 0.15, 0, Math.PI * 2);
      ctx.moveTo(x + s * 0.45, y + s * 0.45);
      ctx.arc(x + s * 0.3, y + s * 0.45, s * 0.15, 0, Math.PI * 2);
      break;
    case 'clock':
      // La grande horloge du hall (D-66).
      ctx.moveTo(x + s * 0.7, y);
      ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - s * 0.45);
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * 0.35, y + s * 0.1);
      break;
    case 'umbrella':
      // Un parapluie (le bureau des objets trouvés, D-66).
      ctx.moveTo(x - s * 0.8, y);
      ctx.quadraticCurveTo(x, y - s * 1.1, x + s * 0.8, y);
      ctx.closePath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + s * 0.6);
      ctx.arc(x + s * 0.15, y + s * 0.6, s * 0.15, Math.PI, 0, true);
      break;
    case 'wagon':
      // Un wagon de marchandises (le dépôt, D-66).
      ctx.rect(x - s * 0.9, y - s * 0.5, s * 1.8, s * 0.9);
      ctx.moveTo(x - s * 0.3, y + s * 0.55);
      ctx.arc(x - s * 0.45, y + s * 0.55, s * 0.15, 0, Math.PI * 2);
      ctx.moveTo(x + s * 0.6, y + s * 0.55);
      ctx.arc(x + s * 0.45, y + s * 0.55, s * 0.15, 0, Math.PI * 2);
      break;
    case 'street':
      // Un lampadaire et une petite maison au bord d'une route (D-60).
      ctx.moveTo(x - s, y + s * 0.6);
      ctx.lineTo(x + s, y + s * 0.6);
      ctx.moveTo(x - s * 0.6, y + s * 0.6);
      ctx.lineTo(x - s * 0.6, y - s * 0.6);
      ctx.lineTo(x - s * 0.3, y - s * 0.6);
      ctx.rect(x, y - s * 0.1, s * 0.8, s * 0.7);
      ctx.moveTo(x - s * 0.1, y - s * 0.1);
      ctx.lineTo(x + s * 0.4, y - s * 0.5);
      ctx.lineTo(x + s * 0.9, y - s * 0.1);
      break;
    default:
      ctx.arc(x, y, s * 0.3, 0, Math.PI * 2);
  }
  ctx.stroke();
}

/** Coupe un texte en lignes qui tiennent dans `maxWidth` (px), mot par mot. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}
