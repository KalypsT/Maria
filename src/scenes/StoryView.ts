import Phaser from 'phaser';
import { TILE_SIZE as T } from '../config/display';
import { PROP_SIZE, STORY_TIMING, THOUGHT_SCALE } from '../config/story';
import type { PropStage } from '../core/story/PropStage';
import type { StoryDirector } from '../core/story/StoryDirector';
import { PROP_KINDS, THOUGHT_ICONS, type ThoughtIcon } from '../core/story/story';
import { SPARKLE_SIZE, THOUGHT_SIZE, drawProp, drawSparkle, drawThought } from './art/storyArt';

/** Au-dessus de la lumière (4), sous Céleste (10) : objets et étincelle ; la bulle au-dessus. */
const PROP_DEPTH = 5;
const THOUGHT_DEPTH = 12;
const SPARKLE_KEY = 'story-sparkle';
/** Pulsation de l'étincelle (ms). */
const SPARKLE_MS = 1300;

/**
 * Affichage de l'histoire (D-31) : objets de mise en scène de la salle, bulle de pensée au-dessus
 * de Céleste, étincelle sur ce qu'on peut faire. Textures dessinées à l'échelle de l'écran ; aucune
 * allocation par image.
 */
export class StoryView {
  private propImages: Phaser.GameObjects.Image[] = [];
  private readonly thought: Phaser.GameObjects.Image;
  private readonly sparkle: Phaser.GameObjects.Image;
  private artScale = 0;
  private thoughtKey = '';
  private thoughtStart = -1;
  private thoughtEnd = -1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: PropStage,
    private readonly director: StoryDirector,
  ) {
    this.thought = scene.add.image(0, 0, '__DEFAULT').setOrigin(0, 1).setDepth(THOUGHT_DEPTH);
    this.thought.setVisible(false);
    this.sparkle = scene.add
      .image(0, 0, '__DEFAULT')
      .setDepth(PROP_DEPTH + 1)
      .setVisible(false);
  }

  /** Échelle de l'écran ou images fournies changées : textures redessinées. */
  setArt(scale: number, images: ReadonlyMap<string, CanvasImageSource>): void {
    this.artScale = scale;
    for (const kind of PROP_KINDS) {
      const { w, h } = PROP_SIZE[kind];
      this.texture(`prop-${kind}`, w, h, (ctx) => {
        drawProp(ctx, kind, images);
      });
    }
    for (const icon of THOUGHT_ICONS) {
      const k = THOUGHT_SCALE;
      this.texture(`thought-${icon}`, THOUGHT_SIZE.w * k, THOUGHT_SIZE.h * k, (ctx) => {
        ctx.scale(k, k);
        drawThought(ctx, icon, images);
      });
    }
    this.texture(SPARKLE_KEY, SPARKLE_SIZE, SPARKLE_SIZE, drawSparkle);
    this.thought.setScale(1 / scale);
    if (this.thoughtKey) {
      this.thought.setTexture(this.thoughtKey);
    }
    this.sparkle.setTexture(SPARKLE_KEY).setScale(1 / scale);
    this.rebuild();
  }

  /** Objets de la salle recréés (changement de salle ou de textures). */
  rebuild(): void {
    for (const image of this.propImages) {
      image.destroy();
    }
    this.propImages = this.stage.props.map((prop, i) => {
      const box = this.stage.boxes[i];
      return this.scene.add
        .image(box ? box.x : 0, box ? box.y : 0, `prop-${prop.kind}`)
        .setOrigin(0, 0)
        .setScale(1 / this.artScale)
        .setFlipX(prop.flip ?? false)
        .setDepth(PROP_DEPTH)
        .setVisible(this.stage.shown[i] ?? false);
    });
  }

  /** Visibilité des objets après un changement permis (`PropStage.update`). */
  refresh(): void {
    const shown = this.stage.shown;
    for (let i = 0; i < this.propImages.length; i++) {
      this.propImages[i]?.setVisible(shown[i] ?? false);
    }
  }

  think(icon: ThoughtIcon, ms: number): void {
    this.thoughtKey = `thought-${icon}`;
    this.thought.setTexture(this.thoughtKey);
    this.thoughtStart = this.scene.time.now;
    this.thoughtEnd = this.thoughtStart + ms;
  }

  /** Une bulle est affichée. */
  get thinking(): boolean {
    return this.scene.time.now < this.thoughtEnd;
  }

  clearThought(): void {
    this.thoughtEnd = -1;
  }

  /** Une image : bulle au-dessus de la tête de Céleste (pieds en x, y), étincelle. */
  render(x: number, y: number, headHeight: number): void {
    const now = this.scene.time.now;
    const thought = this.thought;
    if (now < this.thoughtEnd) {
      const fade = STORY_TIMING.thoughtFadeMs;
      const alpha = Math.min(1, (now - this.thoughtStart) / fade, (this.thoughtEnd - now) / fade);
      thought
        .setVisible(true)
        .setAlpha(Math.max(0, alpha))
        .setPosition(x - 2, y - headHeight + 2 - (1 - Math.min(1, alpha)) * 2);
    } else if (thought.visible) {
      thought.setVisible(false);
    }
    const trigger = this.director.data.triggers[this.director.interactable];
    const mark = trigger?.mark;
    if (mark && !this.director.busy) {
      const pulse = 0.75 + 0.25 * Math.sin((now / SPARKLE_MS) * Math.PI * 2);
      this.sparkle
        .setVisible(true)
        .setPosition((mark.col + 0.5) * T, (mark.row + 0.5) * T - pulse * 2)
        .setAlpha(pulse);
    } else if (this.sparkle.visible) {
      this.sparkle.setVisible(false);
    }
  }

  private texture(
    key: string,
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ): void {
    const textures = this.scene.textures;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * this.artScale);
    canvas.height = Math.ceil(h * this.artScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(this.artScale, this.artScale);
    draw(ctx);
    if (textures.exists(key)) {
      textures.remove(key);
    }
    textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
