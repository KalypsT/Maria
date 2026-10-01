import Phaser from 'phaser';
import { WORLD_LIFE, type ArtPalette } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { wind } from '../core/fx/worldLife';
import type { LevelData } from '../core/level/LevelData';
import { clotheslineItems, drawLaundryItem } from './art/roomArt';
import { drawFlames, hearth, pendulum } from './art/livingArt';

/** Linge : avec le fond proche, sous les meubles (dessinés avec le fond, -5) on passe devant. */
const LAUNDRY_DEPTH = -4.6;
/** Feuilles : au-dessus des liserés, derrière les personnages (jamais devant Céleste). */
const LEAF_DEPTH = 4.55;
const LEAF_TEXTURE = 'life-leaf';
/**
 * Inclinaisons dessinées d'avance (une image par angle) : tourner à l'affichage de très petits
 * sprites les déformait. Le linge, de -balancement à +balancement ; les feuilles, un demi-tour.
 */
const LAUNDRY_FRAMES = 9;
const LEAF_FRAMES = 8;
/** Images du feu (D-73), qui alternent ; inclinaisons du balancier. */
const FIRE_FRAMES = 6;
const PENDULUM_FRAMES = 9;
/** Feu : au-dessus de la pénombre (il éclaire), derrière les personnages. */
const FIRE_DEPTH = 4.52;
/** Balancier : derrière la vitre de l'horloge, dans la pénombre de la pièce. */
const PENDULUM_DEPTH = -4.6;
const GLOW_TEXTURE = 'life-fire-glow';
const FRAME_NAMES = Array.from({ length: Math.max(LAUNDRY_FRAMES, LEAF_FRAMES) }, (_, i) =>
  String(i),
);
/** Taille d'une feuille (px logiques). */
const LEAF_W = 6;
const LEAF_H = 3.2;
/** Éléments de décor qui portent des feuilles : seulement là, il en tombe. */
const LEAFY = new Set(['hedge', 'canopy', 'bush', 'treetrunk', 'branch', 'planetree', 'nest']);

interface Leaf {
  readonly image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vy: number;
  windK: number;
  phase: number;
  spin: number;
  active: boolean;
}

/** Bande d'images (une par angle) sur une toile : `draw` dessine autour de l'origine. */
function framedTexture(
  scene: Phaser.Scene,
  key: string,
  frames: number,
  w: number,
  h: number,
  originX: number,
  originY: number,
  scale: number,
  angle: (i: number) => number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): boolean {
  const fw = Math.ceil(w * scale);
  const fh = Math.ceil(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = fw * frames;
  canvas.height = fh;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return false;
  }
  for (let i = 0; i < frames; i++) {
    ctx.save();
    ctx.translate(i * fw, 0);
    ctx.scale(scale, scale);
    ctx.translate(originX, originY);
    ctx.rotate(angle(i));
    draw(ctx);
    ctx.restore();
  }
  const textures = scene.textures;
  if (textures.exists(key)) {
    textures.remove(key);
  }
  const texture = textures.addCanvas(key, canvas);
  if (!texture) {
    return false;
  }
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  for (let i = 0; i < frames; i++) {
    texture.add(FRAME_NAMES[i] ?? String(i), 0, i * fw, 0, fw, fh);
  }
  return true;
}

interface Laundry {
  readonly image: Phaser.GameObjects.Image;
  readonly phase: number;
}

interface Fire {
  readonly flames: Phaser.GameObjects.Image;
  readonly glow: Phaser.GameObjects.Image;
  frame: number;
  nextMs: number;
}

/**
 * Vie du monde réel (D-72) : dehors, feuilles qui tombent au vent (là où il y a des arbres ou des
 * haies), linge qui se balance sur le fil ; dedans, le feu de la cheminée et le balancier de
 * l'horloge comtoise (D-73). Le vent est commun (`wind`) : rafales et calmes
 * ensemble. Purement visuel, aucune allocation par image.
 */
export class WorldLifeView {
  private readonly leaves: Leaf[] = [];
  private readonly laundry: Laundry[] = [];
  private readonly fires: Fire[] = [];
  private readonly pendulums: Phaser.GameObjects.Image[] = [];
  /** Textures propres à la salle, retirées avec elle. */
  private readonly roomTextures: string[] = [];
  private readonly rand = Math.random;
  private fireSeed = 1;

  constructor(private readonly scene: Phaser.Scene) {}

  clear(): void {
    for (const leaf of this.leaves) {
      leaf.image.destroy();
    }
    this.leaves.length = 0;
    for (const item of this.laundry) {
      const key = item.image.texture.key;
      item.image.destroy();
      this.scene.textures.remove(key);
    }
    this.laundry.length = 0;
    for (const fire of this.fires) {
      fire.flames.destroy();
      fire.glow.destroy();
    }
    this.fires.length = 0;
    for (const image of this.pendulums) {
      image.destroy();
    }
    this.pendulums.length = 0;
    for (const key of this.roomTextures) {
      this.scene.textures.remove(key);
    }
    this.roomTextures.length = 0;
  }

  load(level: LevelData, palette: Readonly<ArtPalette>, artScale: number): void {
    this.clear();
    if (palette.silhouettes || level.decor.length === 0) {
      return;
    }
    if (palette.outdoor && level.decor.some((d) => LEAFY.has(d.kind))) {
      this.makeLeaves(level.meta.world === 'street');
    }
    level.decor.forEach((d, i) => {
      const r = { x: d.col * T, y: d.row * T, w: d.width * T, h: d.height * T };
      if (d.kind === 'clothesline' && palette.outdoor) {
        this.makeLaundry(level.id, r, palette, artScale);
      } else if (d.kind === 'fireplace') {
        this.makeFire(`${level.id}-${String(i)}`, r, artScale);
      } else if (d.kind === 'grandclock') {
        this.makePendulum(`${level.id}-${String(i)}`, r, artScale);
      }
    });
  }

  /** Le petit feu de la cheminée (D-73) : des flammes qui changent, une lueur qui palpite. */
  private makeFire(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    artScale: number,
  ): void {
    const open = hearth(r);
    const w = open.w - 34;
    const h = Math.min(30, open.h - 16);
    const key = `life-fire-${id}`;
    const made = framedTexture(
      this.scene,
      key,
      FIRE_FRAMES,
      w,
      h,
      0,
      0,
      artScale,
      () => 0,
      // Chaque image a sa forme : chaque appel dessine avec la graine suivante.
      (ctx) => {
        drawFlames(ctx, w, h, this.fireSeed++);
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    if (!this.scene.textures.exists(GLOW_TEXTURE)) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,190,110,0.9)');
        g.addColorStop(0.5, 'rgba(255,150,70,0.35)');
        g.addColorStop(1, 'rgba(255,140,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        this.scene.textures
          .addCanvas(GLOW_TEXTURE, canvas)
          ?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
    const base = r.y + r.h - 9;
    const flames = this.scene.add
      .image(open.x + 17, base, key, FRAME_NAMES[0])
      .setOrigin(0, 1)
      .setScale(1 / artScale)
      .setDepth(FIRE_DEPTH);
    const glow = this.scene.add
      .image(open.x + open.w / 2, base - h * 0.4, GLOW_TEXTURE)
      .setDisplaySize(open.w * 1.5, open.h * 1.3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(FIRE_DEPTH);
    this.fires.push({ flames, glow, frame: 0, nextMs: 0 });
  }

  /** Le balancier de l'horloge comtoise (D-73) : une tige, un disque de laiton. */
  private makePendulum(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    artScale: number,
  ): void {
    const pivot = pendulum(r);
    const swing = WORLD_LIFE.pendulum.swingRad;
    const w = 2 * (pivot.length * Math.sin(swing) + 8);
    const h = pivot.length + 8;
    const key = `life-pendulum-${id}`;
    const made = framedTexture(
      this.scene,
      key,
      PENDULUM_FRAMES,
      w,
      h,
      w / 2,
      1,
      artScale,
      (k) => -swing + (2 * swing * k) / (PENDULUM_FRAMES - 1),
      (ctx) => {
        ctx.fillStyle = '#b8955a';
        ctx.fillRect(-0.8, 0, 1.6, pivot.length);
        ctx.fillStyle = '#d9b46a';
        ctx.beginPath();
        ctx.arc(0, pivot.length, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(-1.6, pivot.length - 1.6, 1.8, 0, Math.PI * 2);
        ctx.fill();
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    this.pendulums.push(
      this.scene.add
        .image(pivot.x, pivot.y, key, FRAME_NAMES[(PENDULUM_FRAMES - 1) / 2])
        .setOrigin(0.5, 1 / h)
        .setScale(1 / artScale)
        .setDepth(PENDULUM_DEPTH),
    );
  }

  private makeLeaves(street: boolean): void {
    if (!this.scene.textures.exists(LEAF_TEXTURE)) {
      // Blanche : chaque feuille prend sa teinte. Assez grande pour rester nette.
      const size = LEAF_W + 1;
      framedTexture(
        this.scene,
        LEAF_TEXTURE,
        LEAF_FRAMES,
        size,
        size,
        size / 2,
        size / 2,
        6,
        (i) => (i / LEAF_FRAMES) * Math.PI,
        (ctx) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, 0, LEAF_W / 2 - 0.3, LEAF_H / 2 - 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(-LEAF_W / 2 + 0.8, -0.25, LEAF_W - 1.6, 0.5);
        },
      );
    }
    // Jardin : verts et blé ; la rue (platanes) : ocres.
    const colors = street ? [0xc9a04e, 0xb5793e, 0xd8b866] : [0x7fb85e, 0xa8c860, 0xd9c25a];
    for (let i = 0; i < WORLD_LIFE.leaves.count; i++) {
      const image = this.scene.add
        .image(0, 0, LEAF_TEXTURE, FRAME_NAMES[0])
        .setDisplaySize(LEAF_W + 1, LEAF_W + 1)
        .setTint(colors[i % colors.length] ?? 0x7fb85e)
        .setDepth(LEAF_DEPTH)
        .setVisible(false);
      this.leaves.push({
        image,
        x: 0,
        y: 0,
        vy: 0,
        windK: 1,
        phase: 0,
        spin: 0,
        active: false,
      });
    }
  }

  private makeLaundry(
    levelId: string,
    r: { x: number; y: number; w: number; h: number },
    palette: Readonly<ArtPalette>,
    artScale: number,
  ): void {
    // Cadre d'une pièce : pince en haut au milieu.
    const w = 22;
    const h = 18;
    const sway = WORLD_LIFE.laundry.swayRad;
    clotheslineItems(r).forEach((item, i) => {
      const key = `life-laundry-${levelId}-${String(i)}`;
      const made = framedTexture(
        this.scene,
        key,
        LAUNDRY_FRAMES,
        w,
        h,
        w / 2,
        3,
        artScale,
        (k) => -sway + (2 * sway * k) / (LAUNDRY_FRAMES - 1),
        (ctx) => {
          // Petite ombre sur ce qui est derrière (papier découpé, D-70).
          ctx.save();
          ctx.translate(1, 1.5);
          ctx.globalAlpha = 0.22;
          drawLaundryItem(ctx, { ...item, color: '#2a1e28' }, palette);
          ctx.restore();
          drawLaundryItem(ctx, item, palette);
        },
      );
      if (!made) {
        return;
      }
      const image = this.scene.add
        .image(item.x, item.y, key, FRAME_NAMES[(LAUNDRY_FRAMES - 1) / 2])
        .setOrigin(0.5, 3 / h)
        .setScale(1 / artScale)
        .setDepth(LAUNDRY_DEPTH);
      // Une vague qui court le long du fil.
      this.laundry.push({ image, phase: item.x * 0.045 });
    });
  }

  /** Vue de la caméra (px du monde). */
  update(
    nowMs: number,
    dtMs: number,
    view: Readonly<{ x: number; y: number; w: number; h: number }>,
  ): void {
    const gust = wind(nowMs);
    const cfg = WORLD_LIFE;
    const swing = (nowMs / cfg.laundry.periodMs) * Math.PI * 2;
    for (const item of this.laundry) {
      // De -1 à 1, puis l'image de l'angle le plus proche.
      const k = gust * Math.sin(swing - item.phase);
      const frame = Math.round(((k + 1) / 2) * (LAUNDRY_FRAMES - 1));
      item.image.setFrame(FRAME_NAMES[frame] ?? '0', false, false);
    }
    for (const fire of this.fires) {
      if (nowMs >= fire.nextMs) {
        // Jamais deux fois la même image de suite.
        fire.frame = (fire.frame + 1 + Math.floor(this.rand() * (FIRE_FRAMES - 1))) % FIRE_FRAMES;
        fire.flames.setFrame(FRAME_NAMES[fire.frame] ?? '0', false, false);
        fire.nextMs = nowMs + cfg.fire.frameMs * (0.7 + this.rand() * 0.6);
      }
      const flicker = 0.5 + 0.5 * Math.sin(nowMs / 170) * Math.sin(nowMs / 530 + 1.7);
      fire.glow.setAlpha(cfg.fire.glowMin + (cfg.fire.glowMax - cfg.fire.glowMin) * flicker);
    }
    const tick = Math.sin((nowMs / cfg.pendulum.periodMs) * Math.PI * 2);
    const tickFrame = FRAME_NAMES[Math.round(((tick + 1) / 2) * (PENDULUM_FRAMES - 1))] ?? '0';
    for (const image of this.pendulums) {
      image.setFrame(tickFrame, false, false);
    }
    const dt = Math.min(dtMs, 100) / 1000;
    const [slow, fast] = cfg.leaves.fallPxPerS;
    for (const leaf of this.leaves) {
      const out =
        leaf.y > view.y + view.h + 10 || leaf.x > view.x + view.w + 60 || leaf.x < view.x - 120;
      if (!leaf.active || out) {
        // Une nouvelle feuille, au-dessus de l'écran (ou dedans au premier affichage), un peu
        // à gauche : le vent la pousse vers la droite.
        leaf.active = true;
        leaf.x = view.x - 60 + this.rand() * (view.w + 40);
        leaf.y = out ? view.y - 10 - this.rand() * 80 : view.y + this.rand() * view.h;
        leaf.vy = slow + this.rand() * (fast - slow);
        leaf.windK = 0.6 + this.rand() * 0.6;
        leaf.phase = this.rand() * Math.PI * 2;
        leaf.spin = (this.rand() - 0.5) * 3;
      }
      leaf.x += cfg.leaves.windPxPerS * gust * leaf.windK * dt;
      leaf.y += leaf.vy * dt;
      const flutter = Math.sin((nowMs / cfg.leaves.flutterMs) * Math.PI * 2 + leaf.phase);
      leaf.image
        .setVisible(true)
        .setPosition(leaf.x + flutter * cfg.leaves.flutterPx, leaf.y)
        .setFrame(leafFrame(flutter * 0.8 + (leaf.spin * nowMs) / 1000), false, false)
        .setAlpha(cfg.leaves.alpha);
    }
  }
}

/** Image d'une feuille pour un angle (une ellipse : un demi-tour suffit). */
function leafFrame(angle: number): string {
  const turn = (((angle / Math.PI) % 1) + 1) % 1;
  return FRAME_NAMES[Math.floor(turn * LEAF_FRAMES) % LEAF_FRAMES] ?? '0';
}
