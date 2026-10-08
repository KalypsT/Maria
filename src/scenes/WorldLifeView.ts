import Phaser from 'phaser';
import { WORLD_LIFE, type ArtPalette } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { wind } from '../core/fx/worldLife';
import type { LevelData } from '../core/level/LevelData';
import { clotheslineItems, drawLaundryItem } from './art/roomArt';
import { drawFlames, hearth, pendulum } from './art/livingArt';
import { garlandPoints, swingPivot } from './art/gardenArt';
import { houseLayout } from './art/streetArt';
import { swingsetSeats } from './art/playgroundArt';
import { depotChimney } from './art/stationArt';

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
/** Images du feu (D-74), qui alternent ; inclinaisons du balancier. */
const FIRE_FRAMES = 6;
const PENDULUM_FRAMES = 9;
/** Feu : au-dessus de la pénombre (il éclaire), derrière les personnages. */
const FIRE_DEPTH = 4.52;
/** Balancier : derrière la vitre de l'horloge, dans la pénombre de la pièce. */
const PENDULUM_DEPTH = -4.6;
const GLOW_TEXTURE = 'life-fire-glow';
/** Mobile, étoiles de la veilleuse, poussière, papillon (D-75). */
const MOBILE_DEPTH = -4.6;
const SPARK_DEPTH = 4.52;
const DOT_TEXTURE = 'life-dot';
/** Petit carré net (les volets du tableau des départs, D-80). */
const SQUARE_TEXTURE = 'life-square';
const STAR_TEXTURE = 'life-star';
const MOON_TEXTURE = 'life-mobile-moon';
const MOTH_TEXTURE = 'life-moth';
const BUTTERFLY_TEXTURE = 'life-butterfly';
/** Balançoire, girouette (D-76) : inclinaisons et orientations dessinées d'avance. */
const SWING_FRAMES = 9;
const VANE_FRAMES = 8;
/** Drapeau de l'école, queue du chat (D-77). */
const FLAG_FRAMES = 6;
const TAIL_FRAMES = 7;
/** Ventilateur, bâche (D-78). */
const FAN_FRAMES = 4;
const TARP_FRAMES = 6;
/** Pigeon de la cour (D-79) : debout, tête baissée, ailes ouvertes. */
const PIGEON_TEXTURE = 'life-pigeon';
const PIGEON_FRAMES = 3;
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

/** Une pièce du mobile : son fil et sa figure, à un angle du tour. */
interface MobilePiece {
  readonly thread: Phaser.GameObjects.Image;
  readonly figure: Phaser.GameObjects.Image;
  readonly angle: number;
  readonly drop: number;
}

interface Mobile {
  readonly thread: Phaser.GameObjects.Image;
  readonly x: number;
  readonly barY: number;
  readonly radius: number;
  readonly bars: readonly Phaser.GameObjects.Image[];
  readonly pieces: readonly MobilePiece[];
}

/** Un point qui bouge dans un rectangle (étoile projetée, grain de poussière). */
interface Spark {
  readonly image: Phaser.GameObjects.Image;
  readonly a: number;
  readonly b: number;
  readonly phase: number;
}

interface SparkField {
  readonly kind: 'stars' | 'dust' | 'steam' | 'smoke';
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly alpha: number;
  readonly sparks: readonly Spark[];
}

/** Le linge qui tourne dans le hublot d'une machine à laver. */
interface Drum {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly clothes: readonly Phaser.GameObjects.Image[];
}

/** Un objet animé par images (balançoire, girouette) : son image et sa phase. */
interface Framed {
  readonly image: Phaser.GameObjects.Image;
  readonly kind: 'swing' | 'vane' | 'flag' | 'tail' | 'fan' | 'tarp';
}

/** Une ampoule de la guirlande, à sa place sur le fil. */
interface Bulb {
  readonly image: Phaser.GameObjects.Image;
  readonly x: number;
  readonly y: number;
  readonly phase: number;
}

interface Butterfly {
  readonly image: Phaser.GameObjects.Image;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly phase: number;
}

/** Le tube fluorescent de la réserve (D-78) : sa lueur, et le tube éteint par-dessus. */
interface Flicker {
  readonly glow: Phaser.GameObjects.Image;
  readonly off: Phaser.GameObjects.Image;
  nextMs: number;
}

/** Un volet du tableau des départs du hall (D-80) : il bascule de temps en temps. */
interface Flap {
  readonly image: Phaser.GameObjects.Image;
  lit: boolean;
  nextMs: number;
}

/** Le pigeon de la cour (D-79). */
interface Pigeon {
  readonly image: Phaser.GameObjects.Image;
  readonly homeX: number;
  readonly homeY: number;
  x: number;
  y: number;
  state: 'idle' | 'flying' | 'gone';
  goneAtMs: number;
}

/** Le poisson rouge de la classe (D-79), dans son bocal. */
interface Fish {
  readonly image: Phaser.GameObjects.Image;
  readonly x: number;
  readonly y: number;
}

interface Moth {
  readonly image: Phaser.GameObjects.Image;
  readonly x: number;
  readonly y: number;
}

interface Fire {
  readonly flames: Phaser.GameObjects.Image;
  readonly glow: Phaser.GameObjects.Image;
  frame: number;
  nextMs: number;
}

/**
 * Vie du monde réel (D-73) : dehors, feuilles qui tombent au vent (là où il y a des arbres ou des
 * haies), linge qui se balance sur le fil ; dedans, le feu de la cheminée et le balancier de
 * l'horloge comtoise (D-74). Le vent est commun (`wind`) : rafales et calmes
 * ensemble. Purement visuel, aucune allocation par image.
 */
export class WorldLifeView {
  private readonly leaves: Leaf[] = [];
  private readonly laundry: Laundry[] = [];
  private readonly fires: Fire[] = [];
  private readonly pendulums: Phaser.GameObjects.Image[] = [];
  private readonly mobiles: Mobile[] = [];
  /** Tour du mobile (radians), accumulé : il peut tourner plus vite un instant (D-144). */
  private mobileTurn = 0;
  private lastLifeMs = -1;
  private spin = 0;
  private readonly fields: SparkField[] = [];
  private readonly moths: Moth[] = [];
  private readonly drums: Drum[] = [];
  private readonly framed: Framed[] = [];
  private readonly bulbs: Bulb[] = [];
  private readonly butterflies: Butterfly[] = [];
  private readonly flickers: Flicker[] = [];
  private readonly flaps: Flap[] = [];
  private readonly pigeons: Pigeon[] = [];
  private readonly fishes: Fish[] = [];
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
    for (const mobile of this.mobiles) {
      mobile.thread.destroy();
      for (const bar of mobile.bars) {
        bar.destroy();
      }
      for (const piece of mobile.pieces) {
        piece.thread.destroy();
        piece.figure.destroy();
      }
    }
    this.mobiles.length = 0;
    for (const field of this.fields) {
      for (const spark of field.sparks) {
        spark.image.destroy();
      }
    }
    this.fields.length = 0;
    for (const moth of this.moths) {
      moth.image.destroy();
    }
    this.moths.length = 0;
    for (const drum of this.drums) {
      for (const image of drum.clothes) {
        image.destroy();
      }
    }
    this.drums.length = 0;
    for (const list of [this.framed, this.bulbs, this.butterflies]) {
      for (const item of list) {
        item.image.destroy();
      }
      list.length = 0;
    }
    for (const flicker of this.flickers) {
      flicker.glow.destroy();
      flicker.off.destroy();
    }
    this.flickers.length = 0;
    for (const flap of this.flaps) {
      flap.image.destroy();
    }
    this.flaps.length = 0;
    for (const list of [this.pigeons, this.fishes]) {
      for (const item of list) {
        item.image.destroy();
      }
      list.length = 0;
    }
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
      if ((d.kind === 'clothesline' || d.kind === 'washline') && palette.outdoor) {
        this.makeLaundry(`${level.id}-${String(i)}`, r, palette, artScale);
      } else if (d.kind === 'houses' && palette.outdoor) {
        // Fumée des cheminées (D-77).
        for (const house of houseLayout(r)) {
          if (house.chimney) {
            const { x, y } = house.chimney;
            this.makeSparks('smoke', { x: x - 8, y: y - 56, w: 16, h: 56 }, WORLD_LIFE.smoke.alpha);
          }
        }
      } else if (d.kind === 'swingset') {
        swingsetSeats(level, r).forEach((seat, k) => {
          this.makeSwing(`${level.id}-${String(i)}-${String(k)}`, seat, palette, artScale);
        });
      } else if (d.kind === 'pigeon') {
        this.makePigeon(r);
      } else if (d.kind === 'fishbowl') {
        this.ensureSprites();
        const image = this.scene.add
          .image(r.x + r.w / 2, r.y + r.h - 8, DOT_TEXTURE)
          .setDisplaySize(5, 3)
          .setTint(0xf07a2a)
          .setDepth(LAUNDRY_DEPTH);
        this.fishes.push({ image, x: r.x + r.w / 2, y: r.y + r.h - 8 });
      } else if (d.kind === 'tubeflicker') {
        this.makeFlicker(r);
      } else if (d.kind === 'depotwindows' && palette.outdoor) {
        // La cheminée de l'atelier du dépôt (D-81).
        const top = depotChimney(r);
        this.makeSparks(
          'smoke',
          { x: top.x - 8, y: top.y - 56, w: 16, h: 56 },
          WORLD_LIFE.smoke.alpha,
        );
      } else if (d.kind === 'departures') {
        this.makeFlaps(r);
      } else if (d.kind === 'fan') {
        this.makeFan(`${level.id}-${String(i)}`, r, artScale);
      } else if (d.kind === 'tarp') {
        this.makeTarp(`${level.id}-${String(i)}`, r, palette, artScale);
      } else if (d.kind === 'flag') {
        this.makeFlag(`${level.id}-${String(i)}`, r, artScale);
      } else if (d.kind === 'cat') {
        this.makeCatTail(`${level.id}-${String(i)}`, r, artScale);
      } else if (d.kind === 'fireplace') {
        this.makeFire(`${level.id}-${String(i)}`, r, artScale);
      } else if (d.kind === 'grandclock') {
        this.makePendulum(`${level.id}-${String(i)}`, r, artScale);
      } else if (d.kind === 'mobile') {
        this.makeMobile(r);
      } else if (d.kind === 'nightstars') {
        // Les étoiles de la veilleuse : la nuit surtout ; le matin, à peine.
        this.makeSparks('stars', r, WORLD_LIFE.nightStars.alpha * (palette.stars ? 1 : 0.3));
      } else if (d.kind === 'dust') {
        this.makeSparks('dust', r, WORLD_LIFE.dust.alpha);
      } else if (d.kind === 'steam') {
        this.makeSparks('steam', r, WORLD_LIFE.steam.alpha);
      } else if (d.kind === 'machine' && !palette.outdoor) {
        this.makeDrum(r);
      } else if (d.kind === 'swing') {
        this.makeSwing(`${level.id}-${String(i)}`, r, palette, artScale);
      } else if (d.kind === 'weathervane') {
        this.makeVane(`${level.id}-${String(i)}`, r, artScale);
      } else if (d.kind === 'guinguette') {
        this.makeGarland(r);
      } else if (d.kind === 'butterfly') {
        this.makeButterflies(r);
      } else if (d.kind === 'moth' && palette.stars) {
        this.makeMoth(r);
      }
    });
  }

  /** Le petit feu de la cheminée (D-74) : des flammes qui changent, une lueur qui palpite. */
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

  /** Le balancier de l'horloge comtoise (D-74) : une tige, un disque de laiton. */
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

  /** Petites textures communes (point doux, étoile, croissant, papillon), créées une fois. */
  private ensureSprites(): void {
    const textures = this.scene.textures;
    const make = (key: string, size: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
      if (textures.exists(key)) {
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx);
        textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    };
    make(SQUARE_TEXTURE, 4, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 4, 4);
    });
    make(DOT_TEXTURE, 16, (ctx) => {
      const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 16, 16);
    });
    make(STAR_TEXTURE, 32, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? 15 : 6.5;
        ctx.lineTo(16 + Math.cos(angle) * radius, 16 + Math.sin(angle) * radius);
      }
      ctx.fill();
    });
    make(MOON_TEXTURE, 32, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(23, 11, 12, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!textures.exists(MOTH_TEXTURE)) {
      // Deux images : ailes ouvertes, ailes repliées.
      let open = true;
      framedTexture(
        this.scene,
        MOTH_TEXTURE,
        2,
        8,
        6,
        4,
        3,
        4,
        () => 0,
        (ctx) => {
          ctx.fillStyle = '#cbbfa8';
          const span = open ? 3.6 : 1.6;
          ctx.beginPath();
          ctx.ellipse(-span / 2 - 0.4, -0.4, span / 2 + 0.4, 2.2, -0.3, 0, Math.PI * 2);
          ctx.ellipse(span / 2 + 0.4, -0.4, span / 2 + 0.4, 2.2, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#6e6252';
          ctx.fillRect(-0.5, -1.5, 1, 3.5);
          open = !open;
        },
      );
    }
  }

  /** Le mobile de la chambre (D-75) : un fil au plafond, deux baguettes, une lune et des étoiles. */
  private makeMobile(r: { x: number; y: number; w: number; h: number }): void {
    this.ensureSprites();
    const x = r.x + r.w / 2;
    const barY = r.y + r.h * 0.5;
    const radius = r.w / 2 - 6;
    const add = (key: string) =>
      this.scene.add.image(0, 0, key).setDepth(MOBILE_DEPTH).setOrigin(0.5, 0);
    const thread = add(DOT_TEXTURE)
      .setPosition(x, r.y + 1)
      .setDisplaySize(1, barY - r.y)
      .setTint(0x3a3330);
    const bars = [
      this.scene.add.image(x, barY, DOT_TEXTURE),
      this.scene.add.image(x, barY, DOT_TEXTURE),
    ];
    for (const bar of bars) {
      bar.setDepth(MOBILE_DEPTH).setTint(0x9a7352);
    }
    const figures: readonly [string, number, number][] = [
      [MOON_TEXTURE, 0xf2d28a, 30],
      [STAR_TEXTURE, 0xf1a9bd, 20],
      [STAR_TEXTURE, 0x9fc0e8, 34],
      [STAR_TEXTURE, 0xf2d28a, 24],
    ];
    const pieces = figures.map(([key, tint, drop], i) => ({
      thread: add(DOT_TEXTURE).setTint(0x3a3330),
      figure: this.scene.add.image(0, 0, key).setDepth(MOBILE_DEPTH).setTint(tint),
      angle: (i * Math.PI) / 2,
      drop,
    }));
    this.mobiles.push({ x, barY, radius, thread, bars, pieces });
  }

  /**
   * Points qui bougent dans un rectangle : les étoiles de la veilleuse tournent lentement autour
   * de son centre (projetées sur le mur, aplaties) ; la poussière monte et dérive dans la lumière.
   */
  private makeSparks(
    kind: 'stars' | 'dust' | 'steam' | 'smoke',
    r: { x: number; y: number; w: number; h: number },
    alpha: number,
  ): void {
    this.ensureSprites();
    const count =
      kind === 'stars'
        ? WORLD_LIFE.nightStars.count
        : kind === 'steam'
          ? WORLD_LIFE.steam.count
          : kind === 'smoke'
            ? WORLD_LIFE.smoke.count
            : WORLD_LIFE.dust.count;
    const sparks: Spark[] = [];
    for (let i = 0; i < count; i++) {
      // Répartition régulière (angle d'or) : jamais deux points l'un sur l'autre.
      const t = (i + 0.5) / count;
      const phase = i * 2.39996;
      // La fumée, dehors sur le ciel : un mélange normal (en addition, elle disparaîtrait).
      const image = this.scene.add
        .image(0, 0, kind === 'stars' ? STAR_TEXTURE : DOT_TEXTURE)
        .setDepth(kind === 'smoke' ? LAUNDRY_DEPTH : SPARK_DEPTH)
        .setBlendMode(kind === 'smoke' ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD)
        .setTint(kind === 'stars' ? 0xfff0c0 : kind === 'smoke' ? 0xe9e5e1 : 0xfff3d6);
      const size =
        kind === 'stars' ? 4 + (i % 3) * 1.5 : kind === 'steam' ? 5 + (i % 3) : 1.6 + (i % 2) * 0.8;
      image.setDisplaySize(size, size);
      sparks.push({
        image,
        a: kind === 'stars' ? 0.25 + 0.75 * Math.sqrt(t) : t,
        b: (phase / 7) % 1,
        phase,
      });
    }
    this.fields.push({ kind, ...r, alpha, sparks });
  }

  /** Le linge dans le hublot de la machine (D-75) : trois pièces qui tournent avec le tambour. */
  private makeDrum(r: { x: number; y: number; w: number; h: number }): void {
    this.ensureSprites();
    // Même hublot que le dessin de la machine (roomArt).
    const radius = Math.min(r.w, r.h) * 0.22;
    const clothes = [0xf19bb5, 0xe6c27a, 0xf3ead7].map((tint) =>
      this.scene.add
        .image(0, 0, DOT_TEXTURE)
        .setDepth(MOBILE_DEPTH)
        .setTint(tint)
        .setDisplaySize(radius * 0.9, radius * 0.6),
    );
    this.drums.push({ x: r.x + r.w / 2, y: r.y + r.h / 2 + 4, radius: radius * 0.5, clothes });
  }

  /** La balançoire du grand arbre (D-76) : deux cordes et une planche, qui oscillent au vent. */
  private makeSwing(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    palette: Readonly<ArtPalette>,
    artScale: number,
  ): void {
    const pivot = swingPivot(r);
    const sway = WORLD_LIFE.swing.swayRad;
    const half = r.w / 2 - 3;
    const w = 2 * (pivot.length * Math.sin(sway) + half + 4);
    const h = pivot.length + 6;
    const key = `life-swing-${id}`;
    const made = framedTexture(
      this.scene,
      key,
      SWING_FRAMES,
      w,
      h,
      w / 2,
      1,
      artScale,
      (k) => -sway + (2 * sway * k) / (SWING_FRAMES - 1),
      (ctx) => {
        ctx.strokeStyle = '#d9c7a3';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-half + 2, 0);
        ctx.lineTo(-half + 2, pivot.length);
        ctx.moveTo(half - 2, 0);
        ctx.lineTo(half - 2, pivot.length);
        ctx.stroke();
        ctx.fillStyle = palette.wood;
        ctx.beginPath();
        ctx.roundRect(-half, pivot.length - 1, 2 * half, 4, 1.5);
        ctx.fill();
        ctx.fillStyle = palette.woodLight;
        ctx.fillRect(-half + 1, pivot.length - 1, 2 * half - 2, 1.2);
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    const image = this.scene.add
      .image(pivot.x, pivot.y, key, FRAME_NAMES[(SWING_FRAMES - 1) / 2])
      .setOrigin(0.5, 1 / h)
      .setScale(1 / artScale)
      .setDepth(LAUNDRY_DEPTH);
    this.framed.push({ image, kind: 'swing' });
  }

  /** La girouette de la remise (D-76) : un coq de profil, vu tourner (plus court de face). */
  private makeVane(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    artScale: number,
  ): void {
    const key = `life-vane-${id}`;
    let frame = 0;
    const made = framedTexture(
      this.scene,
      key,
      VANE_FRAMES,
      20,
      12,
      10,
      8,
      artScale,
      () => 0,
      (ctx) => {
        // De profil (image 0) à de face (dernière image) : le coq se raccourcit.
        const k = Math.cos((frame / (VANE_FRAMES - 1)) * (Math.PI / 2));
        frame++;
        ctx.save();
        ctx.scale(Math.max(0.15, k), 1);
        ctx.fillStyle = '#3a3330';
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(-3, -3);
        ctx.lineTo(1, -7);
        ctx.lineTo(4, -5);
        ctx.lineTo(3, -2);
        ctx.lineTo(8, -1);
        ctx.lineTo(6, 2);
        ctx.lineTo(-6, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    const image = this.scene.add
      .image(r.x + r.w / 2, r.y + 8, key, FRAME_NAMES[0])
      .setOrigin(0.5, 8 / 12)
      .setScale(1 / artScale)
      .setDepth(LAUNDRY_DEPTH);
    this.framed.push({ image, kind: 'vane' });
  }

  /** Le drapeau de l'école (D-77) : une vague qui court le long du tissu, images d'avance. */
  private makeFlag(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    artScale: number,
  ): void {
    const key = `life-flag-${id}`;
    let frame = 0;
    const w = r.w - 1;
    const made = framedTexture(
      this.scene,
      key,
      FLAG_FRAMES,
      w + 2,
      14,
      0,
      1,
      artScale,
      () => 0,
      (ctx) => {
        const phase = (frame / FLAG_FRAMES) * Math.PI * 2;
        frame++;
        const band = (color: string, y0: number, y1: number) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 2) {
            const dy = Math.sin(x / 6 - phase) * (x / w) * 2;
            ctx.lineTo(x, y0 + dy);
          }
          for (let x = w; x >= 0; x -= 2) {
            const dy = Math.sin(x / 6 - phase) * (x / w) * 2;
            ctx.lineTo(x, y1 + dy);
          }
          ctx.fill();
        };
        band('#6d86c2', 0, 4);
        band('#f3ead7', 4, 7);
        band('#e2574c', 7, 11);
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    const image = this.scene.add
      .image(r.x + 2.5, r.y + 1, key, FRAME_NAMES[0])
      .setOrigin(0, 1 / 14)
      .setScale(1 / artScale)
      .setDepth(LAUNDRY_DEPTH);
    this.framed.push({ image, kind: 'flag' });
  }

  /** La queue du chat roux (D-77) : elle pend du rebord et balance doucement. */
  private makeCatTail(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    artScale: number,
  ): void {
    const swing = WORLD_LIFE.catTail.swingRad;
    const key = `life-cat-tail-${id}`;
    const made = framedTexture(
      this.scene,
      key,
      TAIL_FRAMES,
      20,
      18,
      10,
      1,
      artScale,
      (k) => -swing + (2 * swing * k) / (TAIL_FRAMES - 1),
      (ctx) => {
        ctx.strokeStyle = '#d98a4a';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-1, 9, 3, 15);
        ctx.stroke();
        ctx.strokeStyle = '#b86a33';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(1.5, 11);
        ctx.lineTo(2.5, 13);
        ctx.stroke();
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    const image = this.scene.add
      .image(r.x + r.w / 2 + 4, r.y + r.h - 3, key, FRAME_NAMES[(TAIL_FRAMES - 1) / 2])
      .setOrigin(0.5, 1 / 18)
      .setScale(1 / artScale)
      .setDepth(LAUNDRY_DEPTH);
    this.framed.push({ image, kind: 'tail' });
  }

  /** Le pigeon de la cour (D-79) : trois images dessinées d'avance (debout, il picore, il vole). */
  private makePigeon(r: { x: number; y: number; w: number; h: number }): void {
    if (!this.scene.textures.exists(PIGEON_TEXTURE)) {
      let frame = 0;
      framedTexture(
        this.scene,
        PIGEON_TEXTURE,
        PIGEON_FRAMES,
        16,
        12,
        8,
        11,
        4,
        () => 0,
        (ctx) => {
          const pose = frame++;
          ctx.fillStyle = '#8a8f9a';
          ctx.beginPath();
          ctx.ellipse(0, -4, 5, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
          const head = pose === 1 ? { x: 5, y: -1.5 } : { x: 4.5, y: -7.5 };
          ctx.fillStyle = '#6f7480';
          ctx.beginPath();
          ctx.arc(head.x, head.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e8b23a';
          ctx.fillRect(head.x + 1.8, head.y - 0.3, 1.6, 0.9);
          ctx.fillStyle = '#5b6070';
          if (pose === 2) {
            ctx.beginPath();
            ctx.moveTo(-2, -5);
            ctx.lineTo(-6, -10.5);
            ctx.lineTo(1, -6);
            ctx.moveTo(-1, -5);
            ctx.lineTo(2, -10.5);
            ctx.lineTo(3, -5);
            ctx.fill();
          } else {
            ctx.fillRect(-5, -5, 6, 2);
            ctx.fillStyle = '#d0674f';
            ctx.fillRect(-1, -1, 0.8, 1.5);
            ctx.fillRect(1, -1, 0.8, 1.5);
          }
        },
      );
    }
    const homeX = r.x + r.w / 2;
    const homeY = r.y + r.h;
    const image = this.scene.add
      .image(homeX, homeY, PIGEON_TEXTURE, FRAME_NAMES[0])
      .setOrigin(0.5, 11 / 12)
      .setScale(1 / 4)
      .setDepth(LEAF_DEPTH);
    this.pigeons.push({ image, homeX, homeY, x: homeX, y: homeY, state: 'idle', goneAtMs: 0 });
  }

  /** Pigeon (il s'envole quand Céleste approche, revient quand elle est loin) et poisson rouge. */
  private updateCritters(
    nowMs: number,
    dtMs: number,
    view: Readonly<{ x: number; y: number; w: number; h: number }>,
    playerX: number,
    playerY: number,
  ): void {
    const cfg = WORLD_LIFE.pigeon;
    const dt = Math.min(dtMs, 100) / 1000;
    for (const pigeon of this.pigeons) {
      const near = Math.hypot(playerX - pigeon.x, playerY - pigeon.y);
      if (pigeon.state === 'idle') {
        if (near < cfg.scareDistancePx) {
          pigeon.state = 'flying';
        } else {
          // Il picore de temps en temps.
          const peck = Math.sin(nowMs / 430) + Math.sin(nowMs / 1170) > 1.2;
          pigeon.image.setFrame(FRAME_NAMES[peck ? 1 : 0] ?? '0', false, false);
        }
      }
      if (pigeon.state === 'flying') {
        pigeon.x += cfg.flyPxPerS * 0.7 * dt;
        pigeon.y -= cfg.flyPxPerS * dt;
        pigeon.image
          .setPosition(pigeon.x, pigeon.y)
          .setFrame(FRAME_NAMES[Math.floor(nowMs / 90) % 2 === 0 ? 2 : 0] ?? '0', false, false);
        if (pigeon.y < view.y - 20) {
          pigeon.state = 'gone';
          pigeon.goneAtMs = nowMs;
          pigeon.image.setVisible(false);
        }
      } else if (pigeon.state === 'gone') {
        const far = Math.hypot(playerX - pigeon.homeX, playerY - pigeon.homeY);
        if (nowMs - pigeon.goneAtMs > cfg.returnMs && !(far < cfg.returnDistancePx)) {
          pigeon.state = 'idle';
          pigeon.x = pigeon.homeX;
          pigeon.y = pigeon.homeY;
          pigeon.image.setPosition(pigeon.x, pigeon.y).setVisible(true);
        }
      }
    }
    const swim = (nowMs / WORLD_LIFE.fish.periodMs) * Math.PI * 2;
    for (const fish of this.fishes) {
      fish.image
        .setPosition(fish.x + 4 * Math.sin(swim), fish.y + 1.5 * Math.sin(2 * swim + 0.6))
        .setFlipX(Math.cos(swim) < 0);
    }
  }

  /** Le tube de la réserve (D-78) : une lueur blanche ; éteint, un tube gris par-dessus. */
  private makeFlicker(r: { x: number; y: number; w: number; h: number }): void {
    this.ensureSprites();
    const glow = this.scene.add
      .image(r.x + r.w / 2, r.y + 10, DOT_TEXTURE)
      .setDisplaySize(r.w * 2.4, 3.5 * T)
      .setTint(0xeef6ff)
      .setAlpha(0.35)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(SPARK_DEPTH);
    const off = this.scene.add
      .image(r.x + r.w / 2, r.y + 4.5, DOT_TEXTURE)
      .setDisplaySize(r.w - 2, 4)
      .setTint(0x8a9099)
      .setDepth(MOBILE_DEPTH)
      .setVisible(false);
    this.flickers.push({ glow, off, nextMs: 2500 + this.rand() * 3000 });
  }

  /** Volets du tableau des départs (D-80), posés sur des cases du dessin (stationArt). */
  private makeFlaps(r: { x: number; y: number; w: number; h: number }): void {
    this.ensureSprites();
    const cells: { x: number; y: number }[] = [];
    for (let y = r.y + 6; y < r.y + r.h - 6; y += 12) {
      for (let x = r.x + 6; x < r.x + r.w - 10; x += 8) {
        cells.push({ x, y });
      }
    }
    const [min, max] = WORLD_LIFE.flaps.everyMs;
    for (let k = 0; k < WORLD_LIFE.flaps.count && cells.length > 0; k++) {
      const [cell] = cells.splice(Math.floor(this.rand() * cells.length), 1);
      if (!cell) {
        break;
      }
      const image = this.scene.add
        .image(cell.x + 3, cell.y + 3.5, SQUARE_TEXTURE)
        .setDisplaySize(6, 7)
        .setDepth(MOBILE_DEPTH);
      const flap = { image, lit: this.rand() > 0.5, nextMs: min + this.rand() * (max - min) };
      image.setTint(flap.lit ? 0xf2b84e : 0x5a4a2a);
      this.flaps.push(flap);
    }
  }

  /** Les pales du ventilateur (D-78), vues de côté : leur longueur change en tournant. */
  private makeFan(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    artScale: number,
  ): void {
    const key = `life-fan-${id}`;
    let frame = 0;
    const w = r.w + 2 * T;
    const made = framedTexture(
      this.scene,
      key,
      FAN_FRAMES,
      w,
      6,
      w / 2,
      3,
      artScale,
      () => 0,
      (ctx) => {
        const turn = (frame / FAN_FRAMES) * Math.PI;
        frame++;
        ctx.fillStyle = '#7a6a58';
        for (const angle of [turn, turn + Math.PI / 2]) {
          const half = Math.abs(Math.cos(angle)) * (w / 2 - 1);
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(1.5, half), 1.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    const image = this.scene.add
      .image(r.x + r.w / 2, r.y + r.h - 5, key, FRAME_NAMES[0])
      .setScale(1 / artScale)
      .setDepth(MOBILE_DEPTH);
    this.framed.push({ image, kind: 'fan' });
  }

  /** La bâche du chantier (D-78) : tendue en haut, son bas ondule au vent. */
  private makeTarp(
    id: string,
    r: { x: number; y: number; w: number; h: number },
    palette: Readonly<ArtPalette>,
    artScale: number,
  ): void {
    const key = `life-tarp-${id}`;
    let frame = 0;
    const made = framedTexture(
      this.scene,
      key,
      TARP_FRAMES,
      r.w,
      r.h + 4,
      0,
      0,
      artScale,
      () => 0,
      (ctx) => {
        const phase = (frame / TARP_FRAMES) * Math.PI * 2;
        frame++;
        ctx.fillStyle = palette.silhouettes ? palette.structure : '#4f7fae';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r.w, 0);
        for (let x = r.w; x >= 0; x -= 2) {
          const k = x / r.w;
          ctx.lineTo(x, r.h - 2 + Math.sin(k * 7 + phase) * 3 * k);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        for (let x = 6; x < r.w; x += 12) {
          ctx.fillRect(x, 2, 1.2, r.h - 8);
        }
        ctx.fillStyle = '#e8eef4';
        for (let x = 3; x < r.w; x += 10) {
          ctx.beginPath();
          ctx.arc(x, 2, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    );
    if (!made) {
      return;
    }
    this.roomTextures.push(key);
    const image = this.scene.add
      .image(r.x, r.y, key, FRAME_NAMES[0])
      .setOrigin(0, 0)
      .setScale(1 / artScale)
      .setDepth(LAUNDRY_DEPTH);
    this.framed.push({ image, kind: 'tarp' });
  }

  /** Les ampoules de la guirlande de la pergola (D-76) : de petites boules qui se balancent. */
  private makeGarland(r: { x: number; y: number; w: number; h: number }): void {
    this.ensureSprites();
    const tints = [0xffd88a, 0xf6b3c4, 0xfff3c9];
    garlandPoints(r).forEach((point, i) => {
      const image = this.scene.add
        .image(point.x, point.y, DOT_TEXTURE)
        .setDisplaySize(4.5, 5.5)
        .setTint(tints[i % tints.length] ?? 0xffd88a)
        .setDepth(LAUNDRY_DEPTH);
      this.bulbs.push({ image, x: point.x, y: point.y, phase: point.x * 0.05 });
    });
  }

  /** Papillons (D-76) : une boucle lente dans leur rectangle, ailes qui battent. */
  private makeButterflies(r: { x: number; y: number; w: number; h: number }): void {
    if (!this.scene.textures.exists(BUTTERFLY_TEXTURE)) {
      let open = true;
      framedTexture(
        this.scene,
        BUTTERFLY_TEXTURE,
        2,
        10,
        8,
        5,
        4,
        4,
        () => 0,
        (ctx) => {
          ctx.fillStyle = '#ffffff';
          const span = open ? 4.2 : 1.6;
          ctx.beginPath();
          ctx.ellipse(-span / 2 - 0.3, -1, span / 2 + 0.4, 2.6, -0.4, 0, Math.PI * 2);
          ctx.ellipse(span / 2 + 0.3, -1, span / 2 + 0.4, 2.6, 0.4, 0, Math.PI * 2);
          ctx.ellipse(-span / 2, 1.6, span / 3 + 0.3, 1.6, -0.2, 0, Math.PI * 2);
          ctx.ellipse(span / 2, 1.6, span / 3 + 0.3, 1.6, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4a3b33';
          ctx.fillRect(-0.5, -2.5, 1, 5);
          open = !open;
        },
      );
    }
    const tints = [0xf6b3c4, 0xf2d28a, 0xb9d6f2];
    for (let i = 0; i < WORLD_LIFE.butterfly.count; i++) {
      const image = this.scene.add
        .image(0, 0, BUTTERFLY_TEXTURE, FRAME_NAMES[0])
        .setScale(1 / 4)
        .setTint(tints[i % tints.length] ?? 0xf6b3c4)
        .setDepth(LEAF_DEPTH);
      this.butterflies.push({ image, ...r, phase: i * 2.4 });
    }
  }

  /** Balançoire, girouette, guirlande, papillons : d'après l'heure et le vent. */
  private updateGardenLife(nowMs: number): void {
    const cfg = WORLD_LIFE;
    const gust = wind(nowMs);
    for (const item of this.framed) {
      if (item.kind === 'swing') {
        const k = gust * Math.sin((nowMs / cfg.swing.periodMs) * Math.PI * 2);
        const frame = Math.round(((k + 1) / 2) * (SWING_FRAMES - 1));
        item.image.setFrame(FRAME_NAMES[frame] ?? '0', false, false);
      } else if (item.kind === 'fan') {
        const blade = Math.floor(nowMs / (cfg.fan.periodMs / FAN_FRAMES)) % FAN_FRAMES;
        item.image.setFrame(FRAME_NAMES[blade] ?? '0', false, false);
      } else if (item.kind === 'tarp') {
        const k = Math.floor((nowMs / cfg.tarp.periodMs) * TARP_FRAMES * (0.6 + 0.4 * gust));
        item.image.setFrame(FRAME_NAMES[k % TARP_FRAMES] ?? '0', false, false);
      } else if (item.kind === 'flag') {
        const wave = Math.floor(nowMs / (cfg.flag.periodMs / FLAG_FRAMES)) % FLAG_FRAMES;
        item.image.setFrame(FRAME_NAMES[wave] ?? '0', false, false);
      } else if (item.kind === 'tail') {
        const k = Math.sin((nowMs / cfg.catTail.periodMs) * Math.PI * 2);
        const frame = Math.round(((k + 1) / 2) * (TAIL_FRAMES - 1));
        item.image.setFrame(FRAME_NAMES[frame] ?? '0', false, false);
      } else {
        // La girouette se tourne lentement, plus vite quand le vent forcit.
        const turn = Math.abs(Math.sin(nowMs / 9000 + gust * 1.5));
        const frame = Math.min(VANE_FRAMES - 1, Math.floor(turn * VANE_FRAMES));
        item.image.setFrame(FRAME_NAMES[frame] ?? '0', false, false);
      }
    }
    for (const flap of this.flaps) {
      if (nowMs >= flap.nextMs) {
        flap.lit = !flap.lit;
        flap.image.setTint(flap.lit ? 0xf2b84e : 0x5a4a2a);
        const [min, max] = cfg.flaps.everyMs;
        flap.nextMs = nowMs + min + this.rand() * (max - min);
      }
    }
    for (const flicker of this.flickers) {
      // De temps en temps, quelques clignotements rapides, puis le tube tient de nouveau.
      const t = nowMs - flicker.nextMs;
      const span = cfg.tubeFlicker.blinkMs * 2 * cfg.tubeFlicker.blinks;
      const off = t >= 0 && t < span && Math.floor(t / cfg.tubeFlicker.blinkMs) % 2 === 0;
      flicker.off.setVisible(off);
      flicker.glow.setVisible(!off);
      if (t >= span) {
        const [min, max] = cfg.tubeFlicker.everyMs;
        flicker.nextMs = nowMs + min + this.rand() * (max - min);
      }
    }
    for (const bulb of this.bulbs) {
      bulb.image.setPosition(
        bulb.x + cfg.garland.swayPx * gust * Math.sin(nowMs / 900 + bulb.phase),
        bulb.y,
      );
    }
    const wing = FRAME_NAMES[Math.floor(nowMs / cfg.butterfly.flapMs) % 2] ?? '0';
    for (const fly of this.butterflies) {
      const t = (nowMs / cfg.butterfly.periodMs) * Math.PI * 2 + fly.phase;
      fly.image
        .setPosition(
          fly.x + fly.w * (0.5 + 0.45 * Math.sin(t)),
          fly.y + fly.h * (0.5 + 0.35 * Math.sin(2 * t + 0.7)) + 3 * Math.sin(t * 7),
        )
        .setFrame(wing, false, false)
        .setFlipX(Math.cos(t) < 0);
    }
  }

  /** Le papillon de nuit autour d'une lampe (D-75), le soir. */
  private makeMoth(r: { x: number; y: number; w: number; h: number }): void {
    this.ensureSprites();
    const image = this.scene.add
      .image(0, 0, MOTH_TEXTURE, FRAME_NAMES[0])
      .setScale(1 / 4)
      .setDepth(SPARK_DEPTH);
    this.moths.push({ image, x: r.x + r.w / 2, y: r.y + r.h / 2 });
  }
  /**
   * Le mobile tourne plus vite un instant (le dernier plan, D-144) : 0 au repos, `k` fois plus vite
   * en plus.
   */
  setSpin(k: number): void {
    this.spin = k;
  }

  /** Mobile, étoiles, poussière, papillon : positions d'après l'heure, sans allocation. */
  private updateRoomLife(nowMs: number): void {
    const cfg = WORLD_LIFE;
    const dt = this.lastLifeMs < 0 ? 0 : Math.min(100, nowMs - this.lastLifeMs);
    this.lastLifeMs = nowMs;
    this.mobileTurn += (dt / cfg.mobile.periodMs) * Math.PI * 2 * (1 + this.spin);
    const turn = this.mobileTurn;
    for (const mobile of this.mobiles) {
      mobile.bars.forEach((bar, i) => {
        const c = Math.cos(turn + (i * Math.PI) / 2);
        bar.setDisplaySize(Math.max(1.5, 2 * mobile.radius * Math.abs(c)), 1.5);
      });
      for (const piece of mobile.pieces) {
        const angle = turn + piece.angle;
        const x = mobile.x + mobile.radius * Math.cos(angle);
        const z = Math.sin(angle);
        const scale = 0.85 + 0.15 * z;
        piece.thread.setPosition(x, mobile.barY).setDisplaySize(0.8, piece.drop);
        piece.figure
          .setPosition(x, mobile.barY + piece.drop + 4)
          .setDisplaySize(9 * scale, 9 * scale)
          .setAlpha(0.8 + 0.2 * z);
      }
    }
    for (const field of this.fields) {
      if (field.kind === 'stars') {
        const spin = (nowMs / cfg.nightStars.periodMs) * Math.PI * 2;
        const cx = field.x + field.w / 2;
        const cy = field.y + field.h / 2;
        for (const spark of field.sparks) {
          const angle = spin + spark.phase;
          const twinkle = 0.65 + 0.35 * Math.sin(nowMs / 1300 + spark.phase * 3);
          spark.image
            .setPosition(
              cx + (field.w / 2) * spark.a * Math.cos(angle),
              cy + (field.h / 2) * spark.a * Math.sin(angle),
            )
            .setAlpha(field.alpha * twinkle);
        }
      } else if (field.kind === 'smoke') {
        // Fumée d'une cheminée : monte, s'élargit, s'en va avec le vent, s'efface.
        const rise = (nowMs / 1000) * cfg.smoke.risePxPerS;
        const gust = wind(nowMs);
        for (const spark of field.sparks) {
          const y = (spark.b * field.h + rise) % field.h;
          const k = y / field.h;
          const x =
            field.w / 2 + cfg.smoke.windPx * gust * k * k + 2 * Math.sin(nowMs / 900 + spark.phase);
          spark.image
            .setPosition(field.x + x, field.y + field.h - y)
            .setScale((5 + 12 * k) / 16)
            .setAlpha(field.alpha * Math.sin(Math.PI * Math.min(1, k * 1.3 + 0.05)) * (1 - k));
        }
      } else if (field.kind === 'steam') {
        // Des volutes qui montent de la cafetière, s'élargissent et s'effacent en haut.
        const rise = (nowMs / 1000) * cfg.steam.risePxPerS;
        for (const spark of field.sparks) {
          const y = (spark.b * field.h + rise) % field.h;
          const k = y / field.h;
          const x = field.w / 2 + (2 + 5 * k) * Math.sin(nowMs / 700 + spark.phase);
          spark.image
            .setPosition(field.x + x, field.y + field.h - y)
            .setScale((3 + 7 * k) / 16)
            .setAlpha(field.alpha * Math.sin(Math.PI * k));
        }
      } else {
        const rise = (nowMs / 1000) * cfg.dust.driftPxPerS;
        for (const spark of field.sparks) {
          const wobble = 6 * Math.sin(nowMs / 3100 + spark.phase);
          const x = (((spark.a * field.w + wobble + rise * 0.4) % field.w) + field.w) % field.w;
          const y = (((spark.b * field.h - rise) % field.h) + field.h) % field.h;
          const twinkle = 0.5 + 0.5 * Math.sin(nowMs / 900 + spark.phase);
          // Plus pâle près des bords du rayon.
          const edge = Math.min(1, (4 * Math.min(y, field.h - y)) / field.h);
          spark.image.setPosition(field.x + x, field.y + y).setAlpha(field.alpha * twinkle * edge);
        }
      }
    }
    const spin = (nowMs / cfg.drum.periodMs) * Math.PI * 2;
    for (const drum of this.drums) {
      drum.clothes.forEach((image, i) => {
        // Le linge retombe un peu en bas du tambour : un tour pas tout à fait rond.
        const angle = spin + (i * Math.PI * 2) / 3;
        image.setPosition(
          drum.x + drum.radius * Math.cos(angle),
          drum.y + drum.radius * (0.8 * Math.sin(angle) + 0.25),
        );
      });
    }
    this.updateGardenLife(nowMs);
    const fly = (nowMs / cfg.moth.periodMs) * Math.PI * 2;
    const wing = FRAME_NAMES[Math.floor(nowMs / cfg.moth.flapMs) % 2] ?? '0';
    for (const moth of this.moths) {
      const radius = cfg.moth.radiusPx;
      moth.image
        .setPosition(
          moth.x + radius * Math.cos(fly) + 3 * Math.sin(fly * 3.7),
          moth.y + radius * 0.5 * Math.sin(2 * fly) + 2 * Math.sin(fly * 5.3),
        )
        .setFrame(wing, false, false);
    }
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
          // Petite ombre sur ce qui est derrière (papier découpé, D-71).
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
    playerX = Number.NaN,
    playerY = Number.NaN,
  ): void {
    this.updateCritters(nowMs, dtMs, view, playerX, playerY);
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
    this.updateRoomLife(nowMs);
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
