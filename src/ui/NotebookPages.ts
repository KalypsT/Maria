import type { MapModel, MapPoint, MapRoom } from '../core/world/mapModel';
import type { MapBox } from '../core/world/zone';
import { ABILITY_HINTS, Ability } from '../config/abilities';
import { drawAbility } from '../scenes/art/abilityArt';
import { drawSticker } from '../scenes/art/stickerArt';
import { drawShellFallback, drawShellOutline } from '../scenes/art/shellArt';
import { ART_IMAGES } from '../config/art';
import type { NotebookPlace } from '../core/world/backpack';
import type { TreasureBook } from '../core/world/treasureBook';
import type { TreasureNames } from './TreasuresPage';
import type { NotebookFigures } from '../core/world/notebookFigures';
import { formatPlayTime } from '../core/save/stats';
import { drawFigureIcon, type FigureIcon } from '../scenes/art/figureArt';
import { TRAVEL } from '../config/travel';

/** Taille d'une coquille sur la carte (px CSS, D-148). */
const MAP_SHELL_PX = 14;
/** Le rose des lunettes de Céleste sur la carte (D-178, celui de son dessin). */
const MAP_GLASSES = '#ff6fa3';
/** Rayon (px CSS) dans lequel un toucher choisit une veilleuse du voyage (D-163). */
const TRAVEL_HIT_PX = 22;
/**
 * La page d'un lieu dont toutes les coquilles sont trouvées se colorie (D-148) : un lavis par salle,
 * dans les couleurs des crayons de Céleste.
 */
const MAP_WASHES = ['#f3c7d2', '#c9dcef', '#f6e3a6', '#cfe5c4', '#ddd0ee'] as const;

/**
 * Ce que dit une ligne de « Mon voyage » quand on touche son pictogramme (D-177, PLACEHOLDER : à
 * valider par l'utilisateur), et combien de temps (ms).
 */
const JOURNEY_TIPS: Readonly<Record<FigureIcon | 'shell' | 'journey', string>> = {
  journey: 'Mon voyage accompli',
  time: 'Le temps de mon voyage',
  shell: 'Les coquilles trouvées',
  memories: 'Mes souvenirs retrouvés',
  places: 'Les lieux découverts',
  faints: 'Les fois où je suis tombée dans les pommes',
};
const JOURNEY_TIP_MS = 3500;

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

/** Les pages dessinées du sac (D-159) : celles de l'ancien cahier, sur un canvas. */
export type NotebookPage = 'map' | 'abilities' | 'journey';

/** La carte d'un lieu (une page du cahier, D-60). */
export interface NotebookMap {
  readonly model: MapModel;
  /** Boîte englobant toutes les salles de la page (disposition stable). */
  readonly bounds: MapBox;
  readonly title: string;
}

/**
 * Ce que montrent les pages : les cartes des lieux visités (D-160), les souvenirs, les capacités,
 * les chiffres.
 */
export interface NotebookContent {
  /** Les lieux visités et leur carte (aucun dans un parcours d'essai). */
  readonly maps: ReadonlyMap<string, NotebookMap>;
  /** La rangée des lieux : les visités, puis le prochain (« ? »). */
  readonly places: readonly NotebookPlace[];
  /** Le lieu ouvert d'abord : celui de Céleste (null sans carte). */
  readonly startPlace: string | null;
  /** La page des trésors (D-162 ; null dans un parcours d'essai). */
  readonly treasures: TreasureBook | null;
  /** Les noms des lieux et des salles, pour les trésors. */
  readonly names: TreasureNames;
  /** Capacités acquises (D-62), pour la page « Mes capacités ». */
  readonly abilities: readonly string[];
  /** Les chiffres de la page « Mon voyage » (D-153). */
  readonly figures: NotebookFigures | null;
}

/**
 * Les pages du cahier dessinées par Céleste (§24, D-38, D-62, D-153), sur un canvas que le sac
 * place dans sa page (D-159). Dessinées au crayon : la carte (salles visitées, salles devinées
 * « ? », passages, veilleuses allumées, trouvailles, Céleste), les souvenirs, les capacités, les
 * chiffres du voyage.
 */
export class NotebookPages {
  readonly canvas: HTMLCanvasElement;
  /** Les chiffres de la page « Mon voyage » (D-153). */
  private figures: NotebookFigures | null = null;
  /** Capacités acquises (D-62), pour la page « Mes capacités ». */
  private abilities: ReadonlySet<string> = new Set();
  private page: NotebookPage = 'map';
  private frame = 0;
  private openedAt = 0;
  private model: MapModel | null = null;
  /** La coquille fournie (D-148), pour la carte ; dessinée par le code tant qu'elle manque. */
  private readonly shellImage = new Image();
  private bounds: MapBox = { x: 0, y: 0, w: 1, h: 1 };
  /** Le voyage rapide (D-163) : une veilleuse touchée deux fois y emmène Céleste ; null sinon. */
  private travel: ((lantern: string) => void) | null = null;
  /** La veilleuse touchée une première fois (null : aucune). */
  private travelPick: string | null = null;
  /** Les veilleuses où l'on peut aller, à leur place sur la page dessinée (px CSS). */
  private travelSpots: { x: number; y: number; lantern: string }[] = [];
  /** Les pictogrammes de « Mon voyage » à leur place (px CSS), pour les toucher (D-177). */
  private readonly journeySpots = Array.from({ length: 6 }, () => ({ x: 0, y: 0, size: 0 }));
  /** La ligne dont le nom est montré (-1 : aucune), et depuis quand (`performance.now`). */
  private journeyTip = -1;
  private journeyTipAt = 0;

  constructor() {
    this.shellImage.src = `art/${ART_IMAGES['shell'] ?? 'shell.png'}`;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'notebook-canvas';
    this.canvas.addEventListener('click', (event) => {
      this.pickTravel(event);
      this.pickJourney(event);
    });
  }

  /**
   * Le voyage rapide (D-163) : la carte s'ouvre depuis une lanterne, les veilleuses où l'on peut
   * aller palpitent ; un premier toucher en choisit une, un second y emmène Céleste. null : la
   * carte ordinaire.
   */
  setTravel(onTravel: ((lantern: string) => void) | null): void {
    this.travel = onTravel;
    this.travelPick = null;
  }

  private pickTravel(event: MouseEvent): void {
    if (!this.travel || this.page !== 'map') {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best: string | null = null;
    let distance = TRAVEL_HIT_PX;
    for (const spot of this.travelSpots) {
      const d = Math.hypot(spot.x - x, spot.y - y);
      if (d <= distance) {
        best = spot.lantern;
        distance = d;
      }
    }
    if (best !== null && best === this.travelPick) {
      this.travel(best);
      return;
    }
    this.travelPick = best;
  }

  /** « Mon voyage » (D-177) : toucher un pictogramme montre ce qu'il compte ; le retoucher le cache. */
  private pickJourney(event: MouseEvent): void {
    if (this.page !== 'journey') {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = this.journeySpots.findIndex(
      (spot) => x >= spot.x && x <= spot.x + spot.size && Math.abs(y - spot.y) <= spot.size / 2,
    );
    this.journeyTip = hit === this.journeyTip ? -1 : hit;
    this.journeyTipAt = performance.now();
  }

  /** Le contenu de cette ouverture du sac (les souvenirs, les capacités, les chiffres). */
  setContent(content: NotebookContent): void {
    this.abilities = new Set(content.abilities);
    this.figures = content.figures;
  }

  /** La carte d'un lieu ; ses salles découvertes depuis la dernière ouverture se tracent. */
  setMap(map: NotebookMap | null): void {
    this.model = map?.model ?? null;
    this.bounds = map?.bounds ?? { x: 0, y: 0, w: 1, h: 1 };
    this.openedAt = performance.now();
  }

  /** Affiche une page et (re)lance le dessin, une image par rafraîchissement de l'écran. */
  show(page: NotebookPage): void {
    this.page = page;
    this.journeyTip = -1;
    const tick = () => {
      this.draw(performance.now() - this.openedAt);
      this.frame = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(tick);
  }

  /** Arrête le dessin (le sac est fermé, ou une page sans canvas est affichée). */
  stop(): void {
    cancelAnimationFrame(this.frame);
  }

  /**
   * Page « Mon voyage » (D-153, choix de l'utilisateur) : peu de texte, un pictogramme et un chiffre
   * par ligne : l'avancement du voyage (D-180), le temps de jeu, les coquilles, les souvenirs, les lieux découverts, les
   * évanouissements (une petite lune). Deux colonnes en paysage.
   */
  private drawJourney(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const f = this.figures;
    if (!f) {
      return;
    }
    const ink = themeColor('--ink');
    const pencil = themeColor('--pencil');
    const rose = themeColor('--crayon-rose');
    const blue = themeColor('--crayon-blue');
    const lamp = themeColor('--lamp');
    const paper = themeColor('--paper');
    const font = getComputedStyle(document.body).fontFamily;
    const tally = (t: { found: number; total: number }) =>
      `${String(t.found)} / ${String(t.total)}`;
    const rows: {
      icon: FigureIcon | 'shell' | 'journey';
      text: string;
      accent: string;
      full: boolean;
    }[] = [
      // L'avancement du voyage (D-180), en tête.
      { icon: 'journey', text: `${String(f.percent)} %`, accent: rose, full: f.percent >= 100 },
      { icon: 'time', text: formatPlayTime(f.playMs), accent: lamp, full: false },
      {
        icon: 'shell',
        text: tally(f.shells),
        accent: rose,
        full: f.shells.total > 0 && f.shells.found === f.shells.total,
      },
      {
        icon: 'memories',
        text: tally(f.memories),
        accent: rose,
        full: f.memories.total > 0 && f.memories.found === f.memories.total,
      },
      {
        icon: 'places',
        text: tally(f.places),
        accent: blue,
        full: f.places.total > 0 && f.places.found === f.places.total,
      },
      { icon: 'faints', text: String(f.faints), accent: lamp, full: false },
    ];
    const cols = width >= 520 ? 2 : 1;
    const perCol = Math.ceil(rows.length / cols);
    const colW = width / cols;
    const rowH = Math.min(92, (height - 16) / perCol);
    const box = rowH * 0.74;
    const tipOn =
      this.journeyTip >= 0 && performance.now() - this.journeyTipAt < JOURNEY_TIP_MS
        ? this.journeyTip
        : -1;
    ctx.lineCap = 'round';
    rows.forEach((row, i) => {
      const col = Math.floor(i / perCol);
      const left = col * colW + Math.max(20, colW * 0.12);
      const cy = 8 + rowH * ((i % perCol) + 0.5);
      ctx.strokeStyle = pencil;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(left, cy - box / 2, box, box, 10);
      ctx.stroke();
      if (row.icon === 'shell') {
        this.drawShell(ctx, left + box / 2, cy, box * 0.56);
      } else if (row.icon === 'journey') {
        drawJourneyRing(ctx, left + box / 2, cy, box * 0.32, f.percent, pencil, rose);
      } else {
        drawFigureIcon(ctx, row.icon, left + box / 2, cy, box * 0.78, ink, row.accent);
      }
      // Tout trouvé : le chiffre en rose, comme le compte des coquilles d'un lieu (D-148).
      ctx.fillStyle = row.full ? rose : ink;
      ctx.font = `italic 600 ${String(Math.round(Math.min(30, rowH * 0.36)))}px ${font}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(row.text, left + box + 18, cy);
      const spot = this.journeySpots[i];
      if (spot) {
        spot.x = left;
        spot.y = cy;
        spot.size = box;
      }
      // Le nom de la ligne touchée (D-177), sous son chiffre, cerné de papier.
      if (i === tipOn) {
        const tipSize = Math.round(Math.max(12, Math.min(16, rowH * 0.18)));
        ctx.font = `600 ${String(tipSize)}px ${font}`;
        ctx.textBaseline = 'top';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = paper;
        ctx.fillStyle = pencil;
        const tx = left + box + 18;
        let ty = cy + Math.min(30, rowH * 0.36) / 2 + 4;
        for (const line of wrapText(ctx, JOURNEY_TIPS[row.icon], (col + 1) * colW - tx - 12)) {
          ctx.strokeText(line, tx, ty);
          ctx.fillText(line, tx, ty);
          ty += tipSize * 1.2;
        }
      }
    });
  }

  /**
   * Page « Mes capacités » (D-62, demande de l'utilisateur) : une ligne par capacité, dans l'ordre
   * où on les trouve. Acquise : son pictogramme, sa gommette étoile (D-169) et comment s'en
   * servir ; sinon une case vide en pointillés, sans rien dévoiler (complétion explicite, §23).
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
      // Sa gommette étoile (D-169), collée sur le coin de la case.
      drawSticker(ctx, left + box - 3, cy - box / 2 + 3, Math.min(14, box * 0.2));
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

  private draw(elapsedMs: number): void {
    const canvas = this.canvas;
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
    if (this.page === 'journey') {
      this.drawJourney(ctx, width, height);
      return;
    }
    const model = this.model;
    if (!model) {
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
    const paper = themeColor('--paper');
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

    // Salles ; toutes les coquilles du lieu trouvées : la page se colorie (D-148).
    const complete = model.shells.total > 0 && model.shells.found === model.shells.total;
    for (const room of model.rooms) {
      const progress = room.fresh ? drawIn : 1;
      this.drawRoom(ctx, room, px, unit, progress, {
        ink,
        pencil,
        roseSoft,
        paperDeep,
        font,
        complete,
      });
    }

    // Veilleuses, coquilles, Céleste.
    this.travelSpots.length = 0;
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
      // La veilleuse principale débloquée (D-163), bleu lune (D-179) ; depuis une lanterne,
      // celles où l'on peut aller palpitent, et la veilleuse choisie est cerclée.
      if (room.travel) {
        const p = px(room.travel);
        const open = this.travel !== null && room.travel.open;
        const beat = open ? 0.5 + 0.5 * Math.sin(elapsedMs / 260) : 0;
        const r = 9 + 5 * beat;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        glow.addColorStop(0, `${TRAVEL.mapColor}cc`);
        glow.addColorStop(1, `${TRAVEL.mapColor}00`);
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
        ctx.fillStyle = TRAVEL.mapColor;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (open) {
          this.travelSpots.push({ x: p.x, y: p.y, lantern: room.travel.lantern });
        }
        if (open && this.travelPick === room.travel.lantern) {
          ctx.strokeStyle = TRAVEL.mapColor;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 3]);
          ctx.lineDashOffset = -elapsedMs / 60;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        }
      }
      // Quelque chose de nouveau (D-189 : la console, un jeu pas encore vu) : une étincelle dorée
      // qui respire et « nouveau » au crayon rose, comme sur la console.
      if (room.news) {
        const p = px(room.news);
        const beat = 0.5 + 0.5 * Math.sin(elapsedMs / 300);
        const r = 4 + 1.5 * beat;
        ctx.fillStyle = lamp;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const d = i % 2 === 0 ? r : r * 0.35;
          ctx.lineTo(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = rose;
        ctx.font = `italic 700 13px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('nouveau !', p.x, p.y - 7);
      }
      // Les coquilles (D-148) : trouvées, dessinées ; vues mais pas prises, en pointillés.
      for (const s of room.shells) {
        const p = px(s);
        this.drawShell(ctx, p.x, p.y, MAP_SHELL_PX);
      }
      for (const s of room.seenShells) {
        const p = px(s);
        drawShellOutline(ctx, p.x, p.y, MAP_SHELL_PX * 0.9, pencil);
      }
      // Les trésors vus mais pas pris (D-160) : une étoile en pointillés, au crayon rose.
      for (const t of room.seenTreasures) {
        const p = px(t);
        drawTreasureOutline(ctx, p.x, p.y, MAP_SHELL_PX * 0.75, rose, paper);
      }
      // Les cubes de la tour d'Eden trouvés (D-122) : un petit carré de leur couleur, cerné d'encre.
      for (const cube of room.cubes) {
        const p = px(cube);
        ctx.fillStyle = cube.color;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(p.x - 5, p.y - 5, 10, 10, 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    // Les noms des salles par-dessus les coquilles et les veilleuses, cernés de papier (D-148).
    ctx.font = `italic 600 ${String(Math.max(11, Math.round(unit * 0.28)))}px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = paper;
    ctx.fillStyle = ink;
    for (const room of model.rooms) {
      if (!room.visited || (room.fresh && drawIn < 1)) {
        continue;
      }
      const tl = px({ x: room.box.x, y: room.box.y });
      ctx.strokeText(room.name, tl.x + 6, tl.y + 5);
      ctx.fillText(room.name, tl.x + 6, tl.y + 5);
    }
    if (model.celeste) {
      const p = px(model.celeste);
      const bob = Math.sin(elapsedMs / 300) * 1.5;
      this.drawCeleste(ctx, p.x, p.y - 8 + bob, paper, ink);
    }
    // Le compte des coquilles du lieu (D-148), en haut à droite de la page ; rose quand tout y est.
    if (model.shells.total > 0) {
      const text = `${String(model.shells.found)}/${String(model.shells.total)}`;
      ctx.font = `600 16px ${font}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = complete ? rose : ink;
      const x = width - 14;
      const y = 18;
      ctx.fillText(text, x, y);
      this.drawShell(ctx, x - ctx.measureText(text).width - 12, y, MAP_SHELL_PX + 2);
    }
  }

  /** Une coquille trouvée sur la carte (D-148) : l'image fournie, ou son dessin par le code. */
  private drawShell(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const image = this.shellImage;
    if (image.complete && image.naturalHeight > 0) {
      const w = (size * image.naturalWidth) / image.naturalHeight;
      ctx.drawImage(image, cx - w / 2, cy - size / 2, w, size);
    } else {
      drawShellFallback(ctx, cx - size * 0.6, cy - size / 2, size * 1.2, size);
    }
  }

  private drawRoom(
    ctx: CanvasRenderingContext2D,
    room: MapRoom,
    px: (p: MapPoint) => { x: number; y: number },
    unit: number,
    progress: number,
    c: {
      ink: string;
      pencil: string;
      roseSoft: string;
      paperDeep: string;
      font: string;
      /** Toutes les coquilles du lieu trouvées (D-148) : un lavis de couleur. */
      complete: boolean;
    },
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
    if (room.visited && c.complete) {
      // Un lavis d'aquarelle : deux passes un peu décalées, plus foncé sur les bords.
      ctx.globalAlpha = progress;
      ctx.fillStyle = MAP_WASHES[Math.floor(random() * MAP_WASHES.length)] ?? c.paperDeep;
      ctx.fillRect(tl.x + 2, tl.y + 2, w - 4, h - 4);
      ctx.globalAlpha = progress * 0.45;
      ctx.fillRect(tl.x + 1 + random() * 2, tl.y + 1 + random() * 2, w - 4, h - 4);
      ctx.globalAlpha = 1;
    } else if (room.visited) {
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
    if (room.icon) {
      drawIcon(ctx, room.icon, tl.x + w / 2, tl.y + h * 0.62, Math.min(w, h) * 0.32, c.pencil);
    }
  }

  /**
   * Céleste sur la carte (D-178, choix de l'utilisateur) : ses lunettes rondes roses, comme le logo
   * (D-175), sur un halo de papier pour se lire par-dessus le dessin des salles.
   */
  private drawCeleste(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    paper: string,
    ink: string,
  ): void {
    const r = 6.5;
    const gap = 8;
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.ellipse(x, y, gap + r + 4, r + 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Les verres, pâles, un reflet blanc.
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(x - gap, y, r, 0, Math.PI * 2);
    ctx.arc(x + gap, y, r, 0, Math.PI * 2);
    ctx.fill();
    // La monture : un trait d'encre fin, le rose par-dessus.
    glassesFrame(ctx, x, y, gap, r, ink, 3.6);
    glassesFrame(ctx, x, y, gap, r, MAP_GLASSES, 2.4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x - gap - 1.2, y - 1.2, r * 0.5, Math.PI * 1.05, Math.PI * 1.45);
    ctx.moveTo(
      x + gap - 1.2 + r * 0.5 * Math.cos(Math.PI * 1.05),
      y - 1.2 + r * 0.5 * Math.sin(Math.PI * 1.05),
    );
    ctx.arc(x + gap - 1.2, y - 1.2, r * 0.5, Math.PI * 1.05, Math.PI * 1.45);
    ctx.stroke();
  }
}

/** La monture des lunettes de la carte (D-178) : deux ronds et le pont. */
function glassesFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gap: number,
  r: number,
  color: string,
  width: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x - gap, y, r, 0, Math.PI * 2);
  ctx.moveTo(x + gap + r, y);
  ctx.arc(x + gap, y, r, 0, Math.PI * 2);
  ctx.moveTo(x - gap + r * 0.9, y - r * 0.35);
  ctx.quadraticCurveTo(x, y - r * 0.95, x + gap - r * 0.9, y - r * 0.35);
  ctx.stroke();
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
    case 'sea':
      // Deux vagues et le soleil (la station balnéaire, D-98).
      ctx.moveTo(x - s, y + s * 0.2);
      ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.2, x, y + s * 0.2);
      ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.6, x + s, y + s * 0.2);
      ctx.moveTo(x - s, y + s * 0.6);
      ctx.quadraticCurveTo(x - s * 0.5, y + s * 0.2, x, y + s * 0.6);
      ctx.quadraticCurveTo(x + s * 0.5, y + s, x + s, y + s * 0.6);
      ctx.moveTo(x + s * 0.7, y - s * 0.45);
      ctx.arc(x + s * 0.45, y - s * 0.45, s * 0.25, 0, Math.PI * 2);
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

/** Un trésor aperçu (D-160) : une étoile à quatre branches, en pointillés. */
function drawTreasureOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  paper: string,
): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const d = i % 2 === 0 ? r : r * 0.42;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  // Le papier dessous : l'étoile se lit par-dessus le dessin de la pièce.
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 2]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * L'avancement du voyage (D-180) : un cercle au crayon, la part faite repassée en rose depuis le
 * haut, une petite étoile au milieu.
 */
function drawJourneyRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  percent: number,
  pencil: string,
  rose: string,
): void {
  ctx.lineCap = 'round';
  ctx.strokeStyle = pencil;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  if (percent > 0) {
    ctx.strokeStyle = rose;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * percent) / 100);
    ctx.stroke();
  }
  ctx.fillStyle = rose;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 === 0 ? r * 0.45 : r * 0.2;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
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
