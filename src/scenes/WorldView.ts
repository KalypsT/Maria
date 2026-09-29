import Phaser from 'phaser';
import { PLACEHOLDER_COLORS, TILE_SIZE as T } from '../config/display';
import { PickupKind, type Pickups } from '../core/world/Pickups';
import type { RunState } from '../core/world/RunState';

const CHECKPOINT_OFF = 'checkpoint-off-placeholder';
const CHECKPOINT_ON = 'checkpoint-on-placeholder';
const PICKUP = 'ability-pickup-placeholder';
const SECRET = 'secret-pickup-placeholder';
const WIDTH = 10;
const HEIGHT = 14;
const PICKUP_SIZE = 10;
/** Flottement de l'objet de capacité : amplitude (px) et période (ms). */
const PICKUP_BOB_PX = 2;
const PICKUP_BOB_MS = 1600;

/** Couleurs de la veilleuse : maison réelle, et monde étrange (turquoise, D-34). */
const REAL_LAMP = {
  foot: '#9a7352',
  stem: '#9aa0b3',
  stemLit: '#f7e3b0',
  cap: '#6e7590',
  capLit: '#ffcf7a',
  dots: '#b9bfd0',
  dotsLit: '#fff4d0',
};
const STRANGE_LAMP: typeof REAL_LAMP = {
  foot: '#1a2a33',
  stem: '#2c3e48',
  stemLit: '#c8fff4',
  cap: '#23343e',
  capLit: '#5ee6d2',
  dots: '#3a525c',
  dotsLit: '#effffb',
};

/**
 * Affichage des checkpoints (placeholder neutre, design ouvert §45) : un petit repère qui s'allume
 * quand il est activé, plus vif s'il est le point de retour courant. Objets de capacité (D-26) :
 * une petite lueur qui flotte ; trouvailles (D-27) : la même, rose (placeholders, nature ouverte).
 */
export class WorldView {
  private sprites: Phaser.GameObjects.Image[] = [];
  private pickupSprites: Phaser.GameObjects.Image[] = [];
  private artScale = 1;
  /** Monde étrange (D-34) : veilleuse turquoise. */
  private strange = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly pickups: Pickups,
  ) {
    this.createTextures();
    this.rebuild();
  }

  /** Recrée les repères (changement de salle). */
  rebuild(): void {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.sprites = this.run.checkpoints.map((checkpoint) =>
      this.scene.add
        .image((checkpoint.col + 0.5) * T, (checkpoint.row + 1) * T, CHECKPOINT_OFF)
        .setOrigin(0.5, 1)
        .setScale(1 / this.artScale)
        .setDepth(5),
    );
    for (const sprite of this.pickupSprites) {
      sprite.destroy();
    }
    this.pickupSprites = this.pickups.items.map((item) =>
      this.scene.add
        .image(
          (item.col + 0.5) * T,
          (item.row + 0.5) * T,
          item.kind === PickupKind.Secret ? SECRET : PICKUP,
        )
        .setScale(1 / this.artScale)
        .setDepth(6)
        .setVisible(!item.taken),
    );
  }

  render(): void {
    const items = this.pickups.items;
    const bob = Math.sin((this.scene.time.now / PICKUP_BOB_MS) * Math.PI * 2) * PICKUP_BOB_PX;
    for (let i = 0; i < items.length; i++) {
      const sprite = this.pickupSprites[i];
      const item = items[i];
      if (sprite && item) {
        sprite.setVisible(!item.taken).setY((item.row + 0.5) * T + bob);
      }
    }
    const checkpoints = this.run.checkpoints;
    for (let i = 0; i < checkpoints.length; i++) {
      const sprite = this.sprites[i];
      const checkpoint = checkpoints[i];
      if (!sprite || !checkpoint) {
        continue;
      }
      const key = checkpoint.activated ? CHECKPOINT_ON : CHECKPOINT_OFF;
      if (sprite.texture.key !== key) {
        sprite.setTexture(key);
      }
      sprite.setAlpha(checkpoint.activated && i !== this.run.current ? 0.65 : 1);
    }
  }

  /**
   * Échelle de l'écran (D-28) et monde étrange (veilleuse turquoise, D-34) : textures redessinées
   * nettes, repères recréés.
   */
  setArt(scale: number, strange: boolean): void {
    if (scale === this.artScale && strange === this.strange) {
      return;
    }
    this.artScale = scale;
    this.strange = strange;
    this.createTextures();
    this.rebuild();
  }

  /**
   * Veilleuse (checkpoint, placeholder du style D-28 : petite lampe champignon, allumée ou non),
   * objets de capacité et trouvailles (lueur étoilée), dessinés à l'échelle de l'écran.
   */
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
      canvas.width = Math.ceil(w * scale);
      canvas.height = Math.ceil(h * scale);
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
    for (const [key, color] of [
      [PICKUP, PLACEHOLDER_COLORS.checkpointLit],
      [SECRET, PLACEHOLDER_COLORS.secret],
    ] as const) {
      const css = `#${color.toString(16).padStart(6, '0')}`;
      make(key, PICKUP_SIZE, PICKUP_SIZE, (ctx) => {
        const c = PICKUP_SIZE / 2;
        const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
        halo.addColorStop(0, `${css}99`);
        halo.addColorStop(1, `${css}00`);
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, PICKUP_SIZE, PICKUP_SIZE);
        ctx.fillStyle = css;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? c - 0.5 : 1.4;
          ctx.lineTo(c + Math.cos(angle) * r, c + Math.sin(angle) * r);
        }
        ctx.fill();
      });
    }
    for (const [key, lit] of [
      [CHECKPOINT_OFF, false],
      [CHECKPOINT_ON, true],
    ] as const) {
      const c = this.strange ? STRANGE_LAMP : REAL_LAMP;
      make(key, WIDTH, HEIGHT, (ctx) => {
        // Pied en bois, chapeau de champignon, petite fenêtre ronde.
        ctx.fillStyle = c.foot;
        ctx.beginPath();
        ctx.roundRect(1, HEIGHT - 3, WIDTH - 2, 3, 1);
        ctx.fill();
        ctx.fillStyle = lit ? c.stemLit : c.stem;
        ctx.fillRect(WIDTH / 2 - 1.5, HEIGHT - 10, 3, 7);
        ctx.fillStyle = lit ? c.capLit : c.cap;
        ctx.beginPath();
        ctx.ellipse(WIDTH / 2, HEIGHT - 10, WIDTH / 2, 5, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = lit ? c.dotsLit : c.dots;
        ctx.beginPath();
        ctx.arc(WIDTH / 2 - 1.5, HEIGHT - 12, 1, 0, Math.PI * 2);
        ctx.arc(WIDTH / 2 + 2, HEIGHT - 13, 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }
}
