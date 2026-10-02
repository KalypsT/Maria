import Phaser from 'phaser';
import { TILE_SIZE as T } from '../config/display';
import type { CombatWorld } from '../core/combat/CombatWorld';
import { Tile, tileAt, type LevelData } from '../core/level/LevelData';

const TOP = 'chase-top-placeholder';
const BODY = 'chase-body-placeholder';
const CAP = 'chase-cap-placeholder';
const CART = 'chase-cart-placeholder';
const TOWER = 'chase-tower-placeholder';
/** Chariot de vaisselle (D-87) : largeur (px logiques) et hauteur du chariot sous la tour. */
const CART_W = 6 * T;
const CART_H = 3 * T;
/** Oscillation de la tour de vaisselle (px, ms) ; tremblement au croc-en-jambe et au contact (px, ms). */
const SWAY_PX = 1.2;
const SWAY_MS = 1900;
const JOLT_PX = 3;
const JOLT_MS = 700;
/** Hauteur du bord haut dessiné (valises, manteaux), px logiques. */
const TOP_H = 4 * T;
/** Respiration lente de la masse (px, ms). */
const BREATH_PX = 1.5;
const BREATH_MS = 2600;

const MASS = '#3a2f57';
const MASS_LIGHT = '#54477a';
const RIM = '#5ee6d2';
/** Porcelaine dans l'ombre, sa face éclairée, son ombre ; le métal du chariot. */
const CHINA = '#a99fbd';
const CHINA_LIGHT = '#cfc8dc';
const CHINA_DARK = '#6f6690';
const METAL = '#2a2540';
const METAL_LIGHT = '#4a4268';

/** Pseudo-hasard stable. */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 91.3 + y * 47.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Ligne du sol le plus fréquent de la salle (haut des tuiles où l'on se tient), en px. */
function commonFloorY(level: LevelData): number {
  const counts = new Map<number, number>();
  for (let col = 0; col < level.width; col++) {
    for (let row = level.height - 1; row > 0; row--) {
      if (tileAt(level, col, row) === Tile.Solid && tileAt(level, col, row - 1) !== Tile.Solid) {
        counts.set(row, (counts.get(row) ?? 0) + 1);
        break;
      }
    }
  }
  let best = level.height;
  let bestCount = 0;
  for (const [row, count] of counts) {
    if (count > bestCount || (count === bestCount && row > best)) {
      best = row;
      bestCount = count;
    }
  }
  return best * T;
}

/**
 * Le poursuivant (boss, D-67), PLACEHOLDER dessiné par le code : un tas de valises, de manteaux et
 * de parapluies perdus, coiffé d'une casquette de contrôleur, sans visage. Sombre, un liseré
 * turquoise sur le dessus (lisible, pilier 1) ; il respire lentement. Inquiétant, jamais horreur
 * (pilier 8). Trois images, créées une fois par salle : le bord haut, le corps (étiré jusqu'en bas
 * de la salle), la casquette.
 *
 * Poursuite horizontale (D-87, le train) : un chariot de service géant chargé d'une tour de
 * vaisselle qui monte jusqu'en haut de la salle (assiettes, tasses, théières, une cloche de
 * service), sans visage ; derrière lui, l'ombre. La tour oscille un peu et tremble au croc-en-jambe
 * et au contact. Trois images : l'ombre (étirée), le chariot, la tour.
 */
export class ChaseView {
  private top: Phaser.GameObjects.Image | null = null;
  private body: Phaser.GameObjects.Image | null = null;
  private cap: Phaser.GameObjects.Image | null = null;
  private cart: Phaser.GameObjects.Image | null = null;
  private tower: Phaser.GameObjects.Image | null = null;
  private artScale = 1;
  private width = 0;
  private height = 0;
  /** Haut du chariot (px) : le sol le plus fréquent de la salle moins sa hauteur. */
  private cartY = 0;
  private seenJolts = 0;
  private joltAt = -Infinity;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly combat: CombatWorld,
  ) {}

  setArt(scale: number): void {
    if (scale === this.artScale && this.top) {
      return;
    }
    this.artScale = scale;
    this.rebuild();
  }

  /** Recrée le poursuivant de la salle (changement de salle, échelle). */
  rebuild(): void {
    for (const image of [this.top, this.body, this.cap, this.cart, this.tower]) {
      image?.destroy();
    }
    this.top = this.body = this.cap = this.cart = this.tower = null;
    const room = this.combat.room;
    if (!room.chase) {
      return;
    }
    this.width = room.width * T;
    this.height = room.height * T;
    this.seenJolts = 0;
    this.joltAt = -Infinity;
    const inverse = 1 / this.artScale;
    if (room.chase.dir === 'up') {
      this.createTextures();
      this.body = this.scene.add.image(0, 0, BODY).setOrigin(0, 0).setDepth(9);
      this.body.setDisplaySize(this.width, this.height);
      this.top = this.scene.add.image(0, 0, TOP).setOrigin(0, 0).setScale(inverse).setDepth(9);
      this.cap = this.scene.add.image(0, 0, CAP).setOrigin(0.5, 1).setScale(inverse).setDepth(9);
      return;
    }
    // Vers la droite, la masse est à gauche du front ; vers la gauche, à droite (image retournée).
    const right = room.chase.dir === 'right';
    this.cartY = commonFloorY(room) - CART_H;
    this.createCartTextures();
    this.body = this.scene.add
      .image(0, 0, BODY)
      .setOrigin(right ? 1 : 0, 0)
      .setDepth(9)
      .setAlpha(0.92);
    this.body.setDisplaySize(this.width, this.height);
    this.tower = this.scene.add
      .image(0, 0, TOWER)
      .setOrigin(right ? 1 : 0, 1)
      .setScale(inverse)
      .setFlipX(!right)
      .setDepth(9);
    this.cart = this.scene.add
      .image(0, this.cartY, CART)
      .setOrigin(right ? 1 : 0, 0)
      .setScale(inverse)
      .setFlipX(!right)
      .setDepth(9);
  }

  render(): void {
    const chase = this.combat.chase;
    if (!chase) {
      return;
    }
    const now = this.scene.time.now;
    if (chase.horizontal) {
      if (!this.body || !this.cart || !this.tower) {
        return;
      }
      if (chase.jolts !== this.seenJolts) {
        this.seenJolts = chase.jolts;
        this.joltAt = now;
      }
      const jolt = Math.max(0, 1 - (now - this.joltAt) / JOLT_MS);
      const sway =
        Math.sin((now / SWAY_MS) * Math.PI * 2) * SWAY_PX +
        Math.sin(now * 0.06) * JOLT_PX * jolt * jolt;
      // Le front est le bord avant du chariot ; la tour dépasse un peu en oscillant, l'ombre suit
      // derrière.
      const x = chase.front;
      const back = x - chase.sign * CART_W;
      this.cart.setPosition(x, this.cartY);
      this.tower.setPosition(x + sway * 0.6, this.cartY + 1);
      this.body.setPosition(back + chase.sign * 2, 0);
      return;
    }
    if (!this.top || !this.body || !this.cap) {
      return;
    }
    const breath = Math.sin((now / BREATH_MS) * Math.PI * 2) * BREATH_PX;
    const y = chase.front + breath;
    // Le bord haut dépasse un peu au-dessus du front (les valises empilées) : le contact se fait au
    // niveau du front lui-même, sous le liseré.
    this.top.setPosition(0, y - T);
    this.body.setPosition(0, y - T + TOP_H - 1);
    this.cap.setPosition(this.width / 2, y - T + 4 + breath);
  }

  /** Une texture de canevas à l'échelle du dessin (remplace la précédente du même nom). */
  private make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const textures = this.scene.textures;
    const scale = this.artScale;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(w * scale));
    canvas.height = Math.max(1, Math.ceil(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(scale, scale);
    draw(ctx);
    if (textures.exists(key)) {
      textures.remove(key);
    }
    textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  /**
   * Le chariot et sa tour de vaisselle (D-87), dessinés le bord avant à droite (retournés vers la
   * gauche). Sans visage ; le liseré turquoise suit le bord avant, là où il ne faut pas être.
   */
  private createCartTextures(): void {
    const w = CART_W;
    this.make(BODY, 4, 4, (ctx) => {
      ctx.fillStyle = MASS;
      ctx.fillRect(0, 0, 4, 4);
    });
    this.make(CART, w, CART_H, (ctx) => {
      // Deux plateaux de métal sombre, des montants, la poignée à l'arrière, des roues ; une nappe
      // pâle pend du plateau du haut, festonnée.
      ctx.fillStyle = METAL;
      ctx.fillRect(4, 3, w - 6, 4);
      ctx.fillRect(4, CART_H - 16, w - 6, 3);
      ctx.fillRect(6, 3, 3, CART_H - 14);
      ctx.fillRect(w - 6, 3, 3, CART_H - 14);
      ctx.strokeStyle = METAL_LIGHT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(5, 6);
      ctx.lineTo(0, 2);
      ctx.lineTo(0, -4);
      ctx.stroke();
      ctx.fillStyle = CHINA_DARK;
      ctx.beginPath();
      ctx.moveTo(10, 7);
      ctx.lineTo(w - 8, 7);
      ctx.lineTo(w - 8, 22);
      for (let x = w - 8; x > 10; x -= 8) {
        ctx.quadraticCurveTo(x - 4, 26, x - 8, 22);
      }
      ctx.closePath();
      ctx.fill();
      for (const cx of [16, w - 16]) {
        ctx.fillStyle = '#16131f';
        ctx.beginPath();
        ctx.arc(cx, CART_H - 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = METAL_LIGHT;
        ctx.beginPath();
        ctx.arc(cx, CART_H - 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = RIM;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w - 1, 0);
      ctx.lineTo(w - 1, CART_H - 12);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    const towerH = Math.max(T, this.cartY + T);
    this.make(TOWER, w, towerH, (ctx) => {
      // De bas en haut : des piles d'assiettes, des tasses empilées, des théières, des soupières ;
      // le tout serré, irrégulier, jusqu'en haut de la salle. Une cloche de service à chaque étage.
      ctx.fillStyle = MASS;
      ctx.fillRect(4, 0, w - 10, towerH);
      let y = towerH - 4;
      let k = 0;
      while (y > -8) {
        const kind = hash(k, 7);
        // Chaque étage penche un peu d'un côté ou de l'autre : la tour tient mal.
        const lean = (hash(k, 11) - 0.5) * 4;
        const inset = 5 + hash(k, 8) * 8 + lean;
        const left = inset;
        const right = Math.min(w - 2, w - 3 - hash(k, 9) * 6 + lean);
        const cw = right - left;
        if (kind < 0.4) {
          // Une pile d'assiettes : quelques bords clairs, l'ombre entre eux.
          const n = 2 + Math.floor(hash(k, 10) * 3);
          for (let i = 0; i < n; i++) {
            const shift = (hash(k + i, 12) - 0.5) * 3;
            ctx.fillStyle = CHINA_DARK;
            ctx.beginPath();
            ctx.ellipse(left + cw / 2 + shift, y - i * 3.2 + 1, cw / 2, 2.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = i === n - 1 ? CHINA_LIGHT : CHINA;
            ctx.beginPath();
            ctx.ellipse(left + cw / 2 + shift, y - i * 3.2, cw / 2 - 1, 1.6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          y -= n * 3.2 + 3;
        } else if (kind < 0.7) {
          // Des tasses retournées, côte à côte, leurs anses vers l'arrière.
          for (let x = left; x + 9 <= right; x += 11) {
            ctx.fillStyle = CHINA;
            ctx.beginPath();
            ctx.roundRect(x, y - 8, 9, 8, [3, 3, 1, 1]);
            ctx.fill();
            ctx.strokeStyle = CHINA_DARK;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(x, y - 4, 2, Math.PI / 2, (3 * Math.PI) / 2);
            ctx.stroke();
          }
          ctx.fillStyle = CHINA_LIGHT;
          ctx.fillRect(left, y - 1, cw, 1.5);
          y -= 10;
        } else {
          // Une théière ventrue ou une cloche de service (bombée), sur son plateau.
          ctx.fillStyle = CHINA_DARK;
          ctx.fillRect(left, y - 2, cw, 2);
          ctx.fillStyle = kind < 0.9 ? CHINA : CHINA_LIGHT;
          ctx.beginPath();
          ctx.ellipse(left + cw / 2, y - 2, cw / 2 - 4, 9, 0, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = CHINA_DARK;
          ctx.beginPath();
          ctx.arc(left + cw / 2, y - 12, 2, 0, Math.PI * 2);
          ctx.fill();
          if (kind < 0.9) {
            // Le bec de la théière, vers l'avant.
            ctx.strokeStyle = CHINA;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(right - 8, y - 5);
            ctx.lineTo(right - 2, y - 10);
            ctx.stroke();
          }
          y -= 14;
        }
        k++;
      }
      // Le liseré turquoise le long du bord avant, ondulé comme la pile.
      ctx.strokeStyle = RIM;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w - 1, towerH);
      for (let yy = towerH; yy >= 0; yy -= 6) {
        ctx.lineTo(w - 1 - Math.abs(Math.sin(yy * 0.13)) * 1.5, yy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  private createTextures(): void {
    const make = this.make.bind(this);
    const width = this.width;
    make(TOP, width, TOP_H, (ctx) => {
      // Valises, manteaux et parapluies empilés au hasard : un bord irrégulier, tout en sombre.
      ctx.fillStyle = MASS;
      ctx.fillRect(0, T, width, TOP_H - T);
      for (let x = -4; x < width; x += 10 + hash(x, 1) * 12) {
        const w = 12 + hash(x, 2) * 16;
        const h = 6 + hash(x, 3) * 14;
        const y = T + 4 - h;
        ctx.fillStyle = hash(x, 4) > 0.5 ? MASS : MASS_LIGHT;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h + 6, 2);
        ctx.fill();
        if (hash(x, 5) > 0.6) {
          // Poignée de valise.
          ctx.strokeStyle = MASS_LIGHT;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x + w / 2 - 3, y - 3, 6, 3);
        } else if (hash(x, 6) > 0.7) {
          // Manche de parapluie recourbé.
          ctx.strokeStyle = MASS_LIGHT;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + 4, y);
          ctx.lineTo(x + 4, y - 7);
          ctx.arc(x + 6, y - 7, 2, Math.PI, 0);
          ctx.stroke();
        }
      }
      // Liseré turquoise le long du dessus (là où il ne faut pas être).
      ctx.strokeStyle = RIM;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, T + 1);
      for (let x = 0; x <= width; x += 8) {
        ctx.lineTo(x, T + 1 + Math.sin(x * 0.21) * 1.5);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    make(BODY, 4, 4, (ctx) => {
      ctx.fillStyle = MASS;
      ctx.fillRect(0, 0, 4, 4);
    });
    make(CAP, 34, 16, (ctx) => {
      // La casquette de contrôleur, posée sur le tas : visière, bandeau, insigne. Pas de visage.
      ctx.fillStyle = '#10101e';
      ctx.beginPath();
      ctx.roundRect(5, 2, 24, 10, [6, 6, 1, 1]);
      ctx.fill();
      ctx.fillStyle = '#26263c';
      ctx.fillRect(5, 9, 24, 3);
      ctx.fillStyle = '#10101e';
      ctx.beginPath();
      ctx.ellipse(22, 13, 11, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = RIM;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(17, 6, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
}
