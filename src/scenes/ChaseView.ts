import Phaser from 'phaser';
import { TILE_SIZE as T } from '../config/display';
import type { CombatWorld } from '../core/combat/CombatWorld';

const TOP = 'chase-top-placeholder';
const BODY = 'chase-body-placeholder';
const CAP = 'chase-cap-placeholder';
/** Hauteur du bord haut dessiné (valises, manteaux), px logiques. */
const TOP_H = 4 * T;
/** Respiration lente de la masse (px, ms). */
const BREATH_PX = 1.5;
const BREATH_MS = 2600;

const MASS = '#3a2f57';
const MASS_LIGHT = '#54477a';
const RIM = '#5ee6d2';

/** Pseudo-hasard stable. */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 91.3 + y * 47.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Le poursuivant (boss, D-67), PLACEHOLDER dessiné par le code : un tas de valises, de manteaux et
 * de parapluies perdus, coiffé d'une casquette de contrôleur, sans visage. Sombre, un liseré
 * turquoise sur le dessus (lisible, pilier 1) ; il respire lentement. Inquiétant, jamais horreur
 * (pilier 8). Trois images, créées une fois par salle : le bord haut, le corps (étiré jusqu'en bas
 * de la salle), la casquette.
 */
export class ChaseView {
  private top: Phaser.GameObjects.Image | null = null;
  private body: Phaser.GameObjects.Image | null = null;
  private cap: Phaser.GameObjects.Image | null = null;
  private artScale = 1;
  private width = 0;

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
    this.top?.destroy();
    this.body?.destroy();
    this.cap?.destroy();
    this.top = this.body = this.cap = null;
    const room = this.combat.room;
    if (!room.chase) {
      return;
    }
    this.width = room.width * T;
    this.createTextures();
    const inverse = 1 / this.artScale;
    this.body = this.scene.add.image(0, 0, BODY).setOrigin(0, 0).setDepth(9);
    this.body.setDisplaySize(this.width, room.height * T);
    this.top = this.scene.add.image(0, 0, TOP).setOrigin(0, 0).setScale(inverse).setDepth(9);
    this.cap = this.scene.add.image(0, 0, CAP).setOrigin(0.5, 1).setScale(inverse).setDepth(9);
  }

  render(): void {
    const chase = this.combat.chase;
    if (!chase || !this.top || !this.body || !this.cap) {
      return;
    }
    const breath = Math.sin((this.scene.time.now / BREATH_MS) * Math.PI * 2) * BREATH_PX;
    const y = chase.frontY + breath;
    // Le bord haut dépasse un peu au-dessus du front (les valises empilées) : le contact se fait au
    // niveau du front lui-même, sous le liseré.
    this.top.setPosition(0, y - T);
    this.body.setPosition(0, y - T + TOP_H - 1);
    this.cap.setPosition(this.width / 2, y - T + 4 + breath);
  }

  private createTextures(): void {
    const textures = this.scene.textures;
    const scale = this.artScale;
    const make = (
      key: string,
      w: number,
      h: number,
      draw: (ctx: CanvasRenderingContext2D) => void,
    ) => {
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
    };
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
