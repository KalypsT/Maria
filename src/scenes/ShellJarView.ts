import Phaser from 'phaser';
import { SHELL_JAR } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { drawShellFallback, shellSeed } from './art/shellArt';

const JAR = 'shell-jar';
/** Image fournie de la coquille (D-148), chargée par la scène (`ART_IMAGES`). */
const SHELL_IMAGE = 'art:shell';

/**
 * Le bocal à coquilles (D-148) : dans la chambre de Céleste, sur le bureau, sous l'étagère où Maria
 * finira rangée ; une petite coquille par coquille trouvée, en tas, de bas en haut. Vide au premier
 * soir. Dessiné par le code (PLACEHOLDER), redessiné seulement quand le compte ou l'échelle change.
 */
export class ShellJarView {
  private sprite: Phaser.GameObjects.Image | null = null;
  /** État dessiné (`compte:échelle`), pour ne pas redessiner sans raison. */
  private drawn = '';

  constructor(private readonly scene: Phaser.Scene) {}

  /**
   * La salle chargée, les coquilles trouvées et en tout (le bocal est plein quand tout y est),
   * l'échelle de l'écran (D-28).
   */
  load(roomId: string, count: { found: number; total: number }, scale: number): void {
    if (roomId !== SHELL_JAR.room) {
      this.sprite?.setVisible(false);
      return;
    }
    const state = `${String(count.found)}/${String(count.total)}:${String(scale)}`;
    if (state !== this.drawn || !this.scene.textures.exists(JAR)) {
      this.draw(count.found, count.total, scale);
      this.drawn = state;
    }
    const x = (SHELL_JAR.col + 0.5) * T;
    const y = (SHELL_JAR.row + 1) * T + SHELL_JAR.sinkPx;
    if (!this.sprite) {
      this.sprite = this.scene.add.image(x, y, JAR).setOrigin(0.5, 1).setDepth(SHELL_JAR.depth);
    }
    this.sprite
      .setTexture(JAR)
      .setPosition(x, y)
      .setScale(1 / scale)
      .setVisible(true);
  }

  private draw(found: number, total: number, scale: number): void {
    const { widthPx: w, heightPx: h } = SHELL_JAR;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(scale, scale);
    const textures = this.scene.textures;
    const image = textures.exists(SHELL_IMAGE)
      ? (textures.get(SHELL_IMAGE).getSourceImage() as HTMLImageElement)
      : null;
    const neck = 4;
    const body = { x: 1.5, y: neck + 2.5, w: w - 3, h: h - neck - 3 };
    const glass = () => {
      ctx.beginPath();
      ctx.roundRect(body.x, body.y, body.w, body.h, [5, 5, 4, 4]);
    };
    // Le verre, à peine teinté.
    glass();
    ctx.fillStyle = 'rgba(214, 236, 246, 0.16)';
    ctx.fill();
    // Les coquilles, en tas depuis le fond : une par coquille trouvée, chacune à sa place.
    ctx.save();
    glass();
    ctx.clip();
    const s = SHELL_JAR.shellPx;
    const sw = image && image.height > 0 ? (s * image.width) / image.height : s * 1.2;
    const perRow = SHELL_JAR.perRow;
    const stepX = (body.w - sw - 1) / (perRow - 1);
    // Les rangées se tassent pour que le bocal soit plein juste quand toutes sont trouvées.
    const rows = Math.max(1, Math.ceil(total / perRow));
    const stepY = Math.min(SHELL_JAR.stepYPx, (body.h - s - 4) / Math.max(1, rows - 1));
    for (let i = 0; i < found; i++) {
      const row = Math.floor(i / perRow);
      const k = i % perRow;
      const jitter = shellSeed(`jar:${String(i)}`);
      const x = body.x + 0.5 + k * stepX + (row % 2 === 1 ? stepX / 2 : 0) + (jitter - 0.5) * 1.2;
      const y = body.y + body.h - 0.5 - s - row * stepY - jitter * 0.8;
      ctx.save();
      ctx.translate(x + sw / 2, y + s / 2);
      ctx.rotate((jitter - 0.5) * 0.7);
      if (jitter < 0.5) {
        ctx.scale(-1, 1);
      }
      if (image) {
        ctx.drawImage(image, -sw / 2, -s / 2, sw, s);
      } else {
        drawShellFallback(ctx, -sw / 2, -s / 2, sw, s);
      }
      ctx.restore();
    }
    ctx.restore();
    // Le contour du verre et ses reflets, par-dessus.
    glass();
    ctx.strokeStyle = 'rgba(236, 248, 255, 0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(body.x + 2.4, body.y + 4);
    ctx.lineTo(body.x + 2.4, body.y + body.h - 4);
    ctx.stroke();
    // Le col, couvert d'un carré de tissu rose à pois, noué d'une ficelle.
    ctx.fillStyle = '#e38aa0';
    ctx.beginPath();
    ctx.roundRect(2.5, 0.5, w - 5, neck + 2.5, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 244, 236, 0.85)';
    for (const [dx, dy] of [
      [5, 2],
      [9.5, 4],
      [14, 2],
      [18.5, 4],
    ] as const) {
      if (dx < w - 4) {
        ctx.beginPath();
        ctx.arc(dx, dy, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = '#8a5a4a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(2.5, neck + 1.6);
    ctx.lineTo(w - 2.5, neck + 1.6);
    ctx.stroke();
    if (textures.exists(JAR)) {
      textures.remove(JAR);
    }
    textures.addCanvas(JAR, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
