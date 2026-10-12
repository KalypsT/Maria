import type { FlashbackId } from '../config/memories';
import { drawFlashback } from '../scenes/art/flashbackArt';
import { FLASHBACKS } from '../config/memories';
import { flashbackImage } from './flashbackImages';

/** Part du souvenir consacrée à son apparition, puis à sa disparition (lentes). */
const FADE_SHARE = 0.22;

/**
 * Court souvenir (D-68) en DOM, au-dessus du jeu : une vignette dessinée une fois par souvenir,
 * qui apparaît, respire doucement (animation CSS), puis s'efface. Le DOM n'est modifié que si une
 * valeur change.
 */
export class FlashbackView {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private drawn: FlashbackId | null = null;
  private shownOpacity = -1;

  constructor(parent: HTMLElement = document.body) {
    this.root = document.createElement('div');
    this.root.id = 'flashback';
    this.canvas = document.createElement('canvas');
    this.root.append(this.canvas);
    parent.append(this.root);
    // Les illustrations (D-170) se chargent dès le début de la partie.
    for (const id of FLASHBACKS) {
      flashbackImage(id);
    }
  }

  /** Souvenir affiché (`id` null : aucun) et son avancement (0 → 1). */
  update(id: FlashbackId | null, progress: number): void {
    if (id !== null && id !== this.drawn) {
      this.draw(id);
    }
    let opacity = 0;
    if (id !== null) {
      opacity = Math.min(1, progress / FADE_SHARE, (1 - progress) / FADE_SHARE);
    }
    const value = Math.round(Math.max(0, opacity) * 50) / 50;
    if (value === this.shownOpacity) {
      return;
    }
    this.shownOpacity = value;
    this.root.style.opacity = String(value);
    this.root.style.visibility = value > 0 ? 'visible' : 'hidden';
  }

  private draw(id: FlashbackId): void {
    const ratio = Math.min(3, window.devicePixelRatio || 1);
    const width = Math.round(window.innerWidth * 0.78);
    const height = Math.round(window.innerHeight * 0.78);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.canvas.style.width = `${String(width)}px`;
    this.canvas.style.height = `${String(height)}px`;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const image = flashbackImage(id, () => {
      // Chargée pendant qu'elle se joue : redessinée avec son illustration.
      if (this.drawn === id) {
        this.draw(id);
      }
    });
    drawFlashback(ctx, id, width / 2, height / 2, width, height, image);
    this.drawn = id;
  }

  destroy(): void {
    this.root.remove();
  }
}
