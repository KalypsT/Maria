import Phaser from 'phaser';
import { TILE_SIZE as T } from '../config/display';
import {
  PASSERBY_DEPTH,
  PASSERBY_REACTIONS,
  PASSERBY_TUNING,
  PASSERSBY,
} from '../config/passersby';
import { STORY_TIMING } from '../config/story';
import {
  newPasserbyState,
  passerbyDistance,
  passerbyGone,
  passersbyIn,
  stepPasserby,
  type PasserbyReaction,
  type PasserbySpot,
  type PasserbyState,
} from '../core/world/passersby';
import { PASSERBY_KINDS, type PasserbyKind, type TimeOfDay } from '../core/story/story';
import { drawPasserby, passerbyIllustrated, passerbySize } from './art/passerbyArt';

/** Les bulles au-dessus des personnages (celles de l'histoire, `StoryView`). */
const BUBBLE_DEPTH = 12;
const NO_REACTION: PasserbyReaction = {};

interface Passerby {
  readonly spot: PasserbySpot;
  readonly reaction: PasserbyReaction;
  /** Cadre (px du monde), sans ce qui pend dessous. */
  readonly box: { x: number; y: number; width: number; height: number };
  readonly base: Phaser.GameObjects.Image;
  /** La seconde pose (null : aucune, ou pas dessinée comme la première). */
  readonly alt: Phaser.GameObjects.Image | null;
  readonly state: PasserbyState;
  /** Côté du bond du chat (1 : vers la droite). */
  fleeDir: number;
}

/**
 * Les passants et les animaux (D-155) : posés dans la salle d'après `PASSERSBY`, ils réagissent
 * quand Céleste passe tout près (`stepPasserby`). Textures dessinées une fois par échelle et par
 * moment de la journée ; aucune allocation par image.
 */
export class PasserbyView {
  private passersby: Passerby[] = [];
  private readonly bubble: Phaser.GameObjects.Image;
  private bubbleOf: Passerby | null = null;
  private bubbleStart = -1;
  private bubbleEnd = -1;
  private artScale = 1;
  private illustrated = new Set<PasserbyKind>();

  constructor(private readonly scene: Phaser.Scene) {
    this.bubble = scene.add
      .image(0, 0, '__DEFAULT')
      .setOrigin(0, 1)
      .setDepth(BUBBLE_DEPTH)
      .setVisible(false);
  }

  /**
   * Textures redessinées (échelle, images, moment de la journée) et passants de la salle replacés.
   * Après `StoryView.setArt` : les bulles sont ses textures.
   */
  load(
    room: string,
    time: TimeOfDay,
    strange: boolean,
    scale: number,
    images: ReadonlyMap<string, CanvasImageSource>,
  ): void {
    this.clear();
    this.artScale = scale;
    const spots = passersbyIn(PASSERSBY, room, time, strange);
    if (spots.length === 0) {
      return;
    }
    const kinds = new Set<PasserbyKind>();
    for (const spot of spots) {
      kinds.add(spot.kind);
      const pose = PASSERBY_REACTIONS[spot.kind]?.pose;
      if (pose) {
        kinds.add(pose);
      }
    }
    this.illustrated = new Set(PASSERBY_KINDS.filter((k) => passerbyIllustrated(k, images)));
    for (const kind of kinds) {
      this.texture(kind, images, time === 'evening');
    }
    this.bubble.setScale(1 / scale);
    this.passersby = spots.map((spot) => this.place(spot));
  }

  clear(): void {
    for (const passerby of this.passersby) {
      passerby.base.destroy();
      passerby.alt?.destroy();
    }
    this.passersby = [];
    this.bubbleOf = null;
    this.bubbleEnd = -1;
    this.bubble.setVisible(false);
  }

  /** Une image : Céleste au point (x, y) (son centre). */
  update(nowMs: number, dtMs: number, x: number, y: number): void {
    const tuning = PASSERBY_TUNING;
    for (const passerby of this.passersby) {
      const { state, reaction, box } = passerby;
      if (passerbyGone(state, tuning)) {
        continue;
      }
      const fleeing = state.fleeMs >= 0;
      const distance = passerbyDistance(x, y, box, reaction.column);
      if (stepPasserby(state, distance, dtMs, reaction, tuning) && reaction.bubble) {
        this.bubbleOf = passerby;
        this.bubble.setTexture(`thought-${reaction.bubble}`);
        this.bubbleStart = nowMs;
        this.bubbleEnd = nowMs + tuning.bubbleMs;
      }
      if (reaction.flee) {
        if (!fleeing && state.fleeMs >= 0) {
          passerby.fleeDir = box.x + box.width / 2 >= x ? 1 : -1;
        }
        this.renderFlee(passerby);
      } else if (passerby.alt) {
        passerby.alt.setAlpha(state.blend).setVisible(state.blend > 0);
        passerby.base.setAlpha(1 - state.blend).setVisible(state.blend < 1);
      }
    }
    this.renderBubble(nowMs);
  }

  private place(spot: PasserbySpot): Passerby {
    const { w, h } = passerbySize(spot.kind);
    const box = {
      x: (spot.col + 0.5) * T - w / 2,
      y: (spot.row + 1) * T + (spot.dy ?? 0) - h,
      width: w,
      height: h,
    };
    const image = (kind: PasserbyKind): Phaser.GameObjects.Image =>
      this.scene.add
        .image(box.x, box.y, `passerby-${kind}`)
        .setOrigin(0, 0)
        .setScale(1 / this.artScale)
        .setFlipX(spot.flip ?? false)
        .setDepth(PASSERBY_DEPTH);
    const reaction = PASSERBY_REACTIONS[spot.kind] ?? NO_REACTION;
    // Une seconde pose seulement si elle est dessinée comme la première (deux images, ou deux
    // silhouettes) : une silhouette provisoire ne remplace jamais une illustration.
    const pose = reaction.pose;
    const paired =
      pose !== undefined && this.illustrated.has(pose) === this.illustrated.has(spot.kind);
    const alt = pose && paired ? image(pose).setVisible(false).setAlpha(0) : null;
    const state = newPasserbyState();
    return {
      spot,
      reaction,
      box,
      base: image(spot.kind),
      alt,
      state,
      fleeDir: 1,
    };
  }

  /** Le bond du chat (D-155) : la pose du bond, en arc vers le côté opposé à Céleste, effacée. */
  private renderFlee(passerby: Passerby): void {
    const { state, base, alt, box } = passerby;
    if (state.fleeMs < 0) {
      return;
    }
    const t = Math.min(1, state.fleeMs / PASSERBY_TUNING.fleeMs);
    const { dxPx, hopPx } = PASSERBY_TUNING.flee;
    base.setVisible(false);
    const leap = alt ?? base;
    const { w } = passerbySize(passerby.spot.kind);
    const leapW = alt ? alt.width / this.artScale : w;
    leap
      .setVisible(t < 1)
      .setFlipX(passerby.fleeDir < 0)
      .setAlpha(1 - t * t)
      .setPosition(
        box.x + (w - leapW) / 2 + passerby.fleeDir * dxPx * t,
        box.y + (alt ? box.height - alt.height / this.artScale : 0) - Math.sin(Math.PI * t) * hopPx,
      );
  }

  private renderBubble(nowMs: number): void {
    const owner = this.bubbleOf;
    if (!owner || nowMs >= this.bubbleEnd) {
      if (this.bubble.visible) {
        this.bubble.setVisible(false);
      }
      return;
    }
    const fade = STORY_TIMING.thoughtFadeMs;
    const alpha = Math.min(1, (nowMs - this.bubbleStart) / fade, (this.bubbleEnd - nowMs) / fade);
    const { box } = owner;
    // La traîne de la bulle (en bas à gauche) part du haut du personnage, au-dessus de sa tête.
    this.bubble
      .setVisible(true)
      .setAlpha(Math.max(0, alpha))
      .setPosition(box.x + box.width * 0.5 - 4, box.y + 4);
  }

  private texture(
    kind: PasserbyKind,
    images: ReadonlyMap<string, CanvasImageSource>,
    evening: boolean,
  ): void {
    const { w, h, below } = passerbySize(kind);
    const key = `passerby-${kind}`;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * this.artScale);
    canvas.height = Math.ceil((h + below) * this.artScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(this.artScale, this.artScale);
    drawPasserby(ctx, kind, images, evening);
    const textures = this.scene.textures;
    if (textures.exists(key)) {
      textures.remove(key);
    }
    textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
