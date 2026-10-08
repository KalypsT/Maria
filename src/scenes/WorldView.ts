import Phaser from 'phaser';
import { SHELL_ART, SHIFT_LAYER_VIEW } from '../config/art';
import { PLACEHOLDER_COLORS, TILE_SIZE as T } from '../config/display';
import type { LevelCable } from '../core/level/LevelData';
import { PickupKind, type Pickups } from '../core/world/Pickups';
import type { RunState } from '../core/world/RunState';
import { drawShellFallback, drawShellGlint, shellSeed } from './art/shellArt';

const CHECKPOINT_OFF = 'checkpoint-off-placeholder';
const CHECKPOINT_ON = 'checkpoint-on-placeholder';
const PICKUP = 'ability-pickup-placeholder';
const SHELL = 'shell-pickup';
const SHELL_GLINT = 'shell-glint';
/** Image fournie de la coquille (D-148), chargée par la scène (`ART_IMAGES`). */
const SHELL_IMAGE = 'art:shell';
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
 * Câbles (D-65), PLACEHOLDER : un fil sombre bordé d'un liseré clair (lisible sur un ciel de jour
 * comme sur un mur de nuit), droit comme sa collision (pilier 1), avec un petit isolateur à chaque
 * bout ; turquoise dans le monde étrange.
 */
const CABLE_REAL = { line: 0x3b3640, halo: 0xe8e0cc, end: 0x8e8a92 };
const CABLE_STRANGE = { line: 0x5ee6d2, halo: 0x12303a, end: 0x2c3e48 };

/** Ouverture de la coquille à gauche plutôt qu'à droite (l'image l'a à droite), selon son nom. */
function shellFlipped(id: string): boolean {
  return shellSeed(`${id}:side`) < 0.5;
}

/**
 * Affichage des checkpoints (placeholder neutre, design ouvert §45) : un petit repère qui s'allume
 * quand il est activé, plus vif s'il est le point de retour courant. Objets de capacité (D-26) :
 * une petite lueur qui flotte ; coquilles (D-148) : posées sur leur appui, un halo rose, un
 * scintillement de temps en temps.
 */
export class WorldView {
  private sprites: Phaser.GameObjects.Image[] = [];
  private pickupSprites: Phaser.GameObjects.Image[] = [];
  /** Scintillement de chaque coquille (null : un objet de capacité). */
  private glintSprites: (Phaser.GameObjects.Image | null)[] = [];
  /** Décalage du scintillement de chaque coquille (ms), d'après son nom. */
  private glintOffsets: number[] = [];
  /** Coquille : taille dessinée (px logiques), d'après l'image. */
  private shellSize: { w: number; h: number } = { w: SHELL_ART.heightPx, h: SHELL_ART.heightPx };
  /** Câbles de la salle (D-65), dessinés une fois par salle. */
  private readonly cables: Phaser.GameObjects.Graphics;
  private cableData: readonly LevelCable[] = [];
  /** Câbles de l'autre couche (D-107) : en contour fantôme, pour prévoir. */
  private ghostCables: readonly LevelCable[] = [];
  private artScale = 1;
  /** Monde étrange (D-34) : veilleuse turquoise. */
  private strange = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly pickups: Pickups,
  ) {
    this.cables = scene.add.graphics().setDepth(4);
    this.createTextures();
    this.rebuild();
  }

  /**
   * Câbles de la salle (D-65), redessinés aussitôt : ceux de la couche active, et ceux de l'autre
   * couche (D-107, `ghost`), à peine visibles.
   */
  setCables(cables: readonly LevelCable[], ghost: readonly LevelCable[] = []): void {
    this.cableData = cables;
    this.ghostCables = ghost;
    this.drawCables();
  }

  private drawCables(): void {
    const g = this.cables.clear();
    const c = this.strange ? CABLE_STRANGE : CABLE_REAL;
    for (const cable of this.ghostCables) {
      g.lineStyle(1, c.line, SHIFT_LAYER_VIEW.ghostCableAlpha);
      g.lineBetween(cable.x1, cable.y1, cable.x2, cable.y2);
    }
    for (const cable of this.cableData) {
      g.lineStyle(2.5, c.halo, 0.55);
      g.lineBetween(cable.x1, cable.y1, cable.x2, cable.y2);
      g.lineStyle(1.25, c.line, 1);
      g.lineBetween(cable.x1, cable.y1, cable.x2, cable.y2);
      g.fillStyle(c.end, 1);
      g.fillRect(cable.x1 - 1.5, cable.y1 - 2, 3, 4);
      g.fillRect(cable.x2 - 1.5, cable.y2 - 2, 3, 4);
    }
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
    for (const sprite of [...this.pickupSprites, ...this.glintSprites]) {
      sprite?.destroy();
    }
    const items = this.pickups.items;
    const { w, h } = this.shellSize;
    const pad = SHELL_ART.haloPx;
    this.glintOffsets = items.map((item) => shellSeed(item.id) * SHELL_ART.glintPeriodMs);
    this.pickupSprites = items.map((item) => {
      if (item.kind !== PickupKind.Shell) {
        return this.scene.add
          .image((item.col + 0.5) * T, (item.row + 0.5) * T, PICKUP)
          .setScale(1 / this.artScale)
          .setDepth(6)
          .setVisible(!item.taken);
      }
      // Posée sur son appui (rien ne flotte), l'ouverture d'un côté ou de l'autre selon son nom.
      return this.scene.add
        .image((item.col + 0.5) * T, (item.row + 1) * T, SHELL)
        .setOrigin(0.5, (pad + h - SHELL_ART.sinkPx) / (h + 2 * pad))
        .setFlipX(shellFlipped(item.id))
        .setScale(1 / this.artScale)
        .setDepth(6)
        .setVisible(!item.taken);
    });
    this.glintSprites = items.map((item) =>
      item.kind === PickupKind.Shell
        ? this.scene.add
            .image(
              (item.col + 0.5) * T + (shellFlipped(item.id) ? 0.15 : -0.15) * w,
              (item.row + 1) * T - h * 0.8,
              SHELL_GLINT,
            )
            .setScale(1 / this.artScale)
            .setDepth(6)
            .setVisible(false)
        : null,
    );
  }

  render(): void {
    const items = this.pickups.items;
    const now = this.scene.time.now;
    const bob = Math.sin((now / PICKUP_BOB_MS) * Math.PI * 2) * PICKUP_BOB_PX;
    for (let i = 0; i < items.length; i++) {
      const sprite = this.pickupSprites[i];
      const item = items[i];
      if (!sprite || !item) {
        continue;
      }
      sprite.setVisible(!item.taken);
      if (item.kind !== PickupKind.Shell) {
        sprite.setY((item.row + 0.5) * T + bob);
        continue;
      }
      // Le scintillement : une étoile qui s'ouvre et se referme, de temps en temps.
      const glint = this.glintSprites[i];
      const t = (now + (this.glintOffsets[i] ?? 0)) % SHELL_ART.glintPeriodMs;
      const on = !item.taken && t < SHELL_ART.glintMs;
      const k = on ? Math.sin((t / SHELL_ART.glintMs) * Math.PI) : 0;
      glint
        ?.setVisible(on)
        .setAlpha(k)
        .setScale((0.4 + 0.6 * k) / this.artScale);
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
    this.drawCables();
  }

  /**
   * Veilleuse (checkpoint, placeholder du style D-28 : petite lampe champignon, allumée ou non),
   * objets de capacité (lueur étoilée) et coquilles (D-148), dessinés à l'échelle de l'écran.
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
    const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;
    make(PICKUP, PICKUP_SIZE, PICKUP_SIZE, (ctx) => {
      const c = PICKUP_SIZE / 2;
      const color = css(PLACEHOLDER_COLORS.checkpointLit);
      const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
      halo.addColorStop(0, `${color}99`);
      halo.addColorStop(1, `${color}00`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, PICKUP_SIZE, PICKUP_SIZE);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? c - 0.5 : 1.4;
        ctx.lineTo(c + Math.cos(angle) * r, c + Math.sin(angle) * r);
      }
      ctx.fill();
    });
    // La coquille (D-148) : l'image fournie, ou son dessin par le code, sur un halo rose.
    const image = textures.exists(SHELL_IMAGE)
      ? (textures.get(SHELL_IMAGE).getSourceImage() as HTMLImageElement)
      : null;
    const h = SHELL_ART.heightPx;
    const w = image && image.height > 0 ? (h * image.width) / image.height : h * 1.2;
    this.shellSize = { w, h };
    const pad = SHELL_ART.haloPx;
    make(SHELL, w + 2 * pad, h + 2 * pad, (ctx) => {
      const cx = pad + w / 2;
      const cy = pad + h / 2;
      const r = Math.max(w, h) / 2 + pad;
      const rose = css(PLACEHOLDER_COLORS.shell);
      const alpha = Math.round(SHELL_ART.haloAlpha * 255)
        .toString(16)
        .padStart(2, '0');
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      halo.addColorStop(0, `${rose}${alpha}`);
      halo.addColorStop(1, `${rose}00`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w + 2 * pad, h + 2 * pad);
      if (image) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, pad, pad, w, h);
      } else {
        drawShellFallback(ctx, pad, pad, w, h);
      }
    });
    make(SHELL_GLINT, SHELL_ART.glintPx, SHELL_ART.glintPx, (ctx) => {
      drawShellGlint(ctx, SHELL_ART.glintPx);
    });
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
