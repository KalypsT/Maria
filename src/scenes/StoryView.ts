import Phaser from 'phaser';
import { TILE_SIZE as T } from '../config/display';
import {
  CHARACTER_LOOP_MS,
  PROP_SIZE,
  STORY_TIMING,
  THOUGHT_SCALE,
  towerCubesMask,
} from '../config/story';
import type { PropStage } from '../core/story/PropStage';
import type { StoryDirector } from '../core/story/StoryDirector';
import {
  CHARACTER_KINDS,
  LOOP_OBJECT_KINDS,
  PROP_KINDS,
  isPasserbyKind,
  type PropKind,
  type ThoughtIcon,
} from '../core/story/story';
import { drawLoopObject } from './art/memoryArt';
import { characterHeadroom, characterOverhang, drawCharacter } from './art/familyArt';
import {
  BUBBLE_SIZE,
  SPARKLE_SIZE,
  drawBubble,
  drawProp,
  drawSparkle,
  drawToyTown,
} from './art/storyArt';
import { bubbleKey, bubbleSide, type BubbleKind, type BubbleSide } from '../core/story/bubble';

/** Objets et personnages animés en boucle (deux images). */
function isLooping(kind: PropKind): boolean {
  return CHARACTER_KINDS.has(kind) || LOOP_OBJECT_KINDS.has(kind);
}

/** Au-dessus de la lumière (4), sous Céleste (10) : objets et étincelle ; la bulle au-dessus. */
const PROP_DEPTH = 5;
const THOUGHT_DEPTH = 12;
const SPARKLE_KEY = 'story-sparkle';
/** Pulsation de l'étincelle (ms). */
const SPARKLE_MS = 1300;

/** Largeur d'une bulle dans le monde (px), pour choisir son côté. */
const BUBBLE_WORLD_W = BUBBLE_SIZE.w * THOUGHT_SCALE;
/** Décalage de la traîne (ou de la pointe) par rapport à la tête (px du monde). */
const BUBBLE_NUDGE = { thought: 2, speech: 4 } as const;

/** Ce que montre une bulle affichée, pour la redessiner à une nouvelle échelle. */
interface BubbleSpec {
  readonly icon: ThoughtIcon;
  readonly cubes: number;
  readonly side: BubbleSide;
}

/**
 * Affichage de l'histoire (D-31) : objets de mise en scène de la salle, bulle de pensée au-dessus
 * de Céleste, étincelle sur ce qu'on peut faire. Textures dessinées à l'échelle de l'écran ; aucune
 * allocation par image.
 */
export class StoryView {
  private propImages: Phaser.GameObjects.Image[] = [];
  /** Textures des deux images de chaque personnage (null : objet immobile), sans allocation par image. */
  private loopKeys: (readonly [string, string, number] | null)[] = [];
  private readonly thought: Phaser.GameObjects.Image;
  private readonly sparkle: Phaser.GameObjects.Image;
  /**
   * Étincelle d'une porte de façade à portée (D-61), tuile au-dessus de la porte ; posée par la
   * scène (null : aucune).
   */
  doorMark: { col: number; row: number } | null = null;
  private artScale = 0;
  private images: ReadonlyMap<string, CanvasImageSource> = new Map();
  /**
   * Textures des bulles déjà dessinées (D-165) : chacune la première fois qu'elle sert, puis gardée
   * jusqu'au prochain changement d'échelle (une par forme, pictogramme et côté : trop pour toutes
   * les dessiner d'avance).
   */
  private readonly bubbleKeys = new Set<string>();
  private readonly roomBounds = new Phaser.Geom.Rectangle();
  /** Pied de Céleste (x), à la dernière image : le côté de sa bulle. */
  private celesteX = 0;
  private thoughtSpec: BubbleSpec | null = null;
  private thoughtStart = -1;
  private thoughtEnd = -1;
  /** Bulle de parole d'un personnage : au-dessus de sa tête. */
  private readonly speech: Phaser.GameObjects.Image;
  private speechSpec: BubbleSpec | null = null;
  private speechProp = -1;
  private speechStart = -1;
  private speechEnd = -1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: PropStage,
    private readonly director: StoryDirector,
  ) {
    this.thought = scene.add.image(0, 0, '__DEFAULT').setOrigin(0, 1).setDepth(THOUGHT_DEPTH);
    this.thought.setVisible(false);
    this.speech = scene.add
      .image(0, 0, '__DEFAULT')
      .setOrigin(0, 1)
      .setDepth(THOUGHT_DEPTH)
      .setVisible(false);
    this.sparkle = scene.add
      .image(0, 0, '__DEFAULT')
      .setDepth(PROP_DEPTH + 1)
      .setVisible(false);
  }

  /** Échelle de l'écran ou images fournies changées : textures redessinées. */
  setArt(scale: number, images: ReadonlyMap<string, CanvasImageSource>): void {
    this.artScale = scale;
    for (const kind of PROP_KINDS) {
      if (isPasserbyKind(kind)) {
        continue; // Les passants (D-155) : leur propre vue.
      }
      const { w, h } = PROP_SIZE[kind];
      if (isLooping(kind)) {
        // Deux images pour le petit mouvement en boucle (D-37, D-38).
        const below = characterOverhang(kind);
        const above = characterHeadroom(kind);
        for (const frame of [0, 1]) {
          this.texture(`prop-${kind}-${String(frame)}`, w, above + h + below, (ctx) => {
            ctx.translate(0, above);
            if (kind === 'toy-town') {
              // Le téléphone de l'Educaville sonne (D-155) : le combiné tremble.
              drawToyTown(ctx, w, h, frame === 0 ? 'ring0' : 'ring1', images);
            } else if (kind === 'music-box' || kind === 'plant') {
              drawLoopObject(ctx, kind, w, h, frame);
            } else {
              drawCharacter(ctx, kind, frame, images);
            }
          });
        }
        continue;
      }
      this.texture(`prop-${kind}`, w, h, (ctx) => {
        drawProp(ctx, kind, images);
      });
    }
    // Les bulles se redessinent à la demande, à la nouvelle échelle.
    this.images = images;
    for (const key of this.bubbleKeys) {
      this.scene.textures.remove(key);
    }
    this.bubbleKeys.clear();
    this.texture(SPARKLE_KEY, SPARKLE_SIZE, SPARKLE_SIZE, drawSparkle);
    this.thought.setScale(1 / scale);
    this.speech.setScale(1 / scale);
    this.showBubble(this.thought, this.thoughtSpec);
    this.showBubble(this.speech, this.speechSpec);
    this.sparkle.setTexture(SPARKLE_KEY).setScale(1 / scale);
    this.rebuild();
  }

  /** Objets de la salle recréés (changement de salle ou de textures). */
  rebuild(): void {
    for (const image of this.propImages) {
      image.destroy();
    }
    this.speechEnd = -1;
    this.speech.setVisible(false);
    this.loopKeys = this.stage.props.map((prop) =>
      isLooping(prop.kind)
        ? ([
            `prop-${prop.kind}-0`,
            `prop-${prop.kind}-1`,
            prop.kind === 'toy-town'
              ? CHARACTER_LOOP_MS.ring
              : prop.kind.startsWith('cat')
                ? CHARACTER_LOOP_MS.cat
                : CHARACTER_LOOP_MS.parent,
          ] as const)
        : null,
    );
    this.propImages = this.stage.props.map((prop, i) => {
      const box = this.stage.boxes[i];
      const key = isLooping(prop.kind) ? `prop-${prop.kind}-0` : `prop-${prop.kind}`;
      return this.scene.add
        .image(box ? box.x : 0, (box ? box.y : 0) - characterHeadroom(prop.kind), key)
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

  /**
   * Bulle de Céleste (elle pense : un nuage), ou du personnage `by` s'il est dans la salle et
   * visible (il parle : une bulle de parole, D-165).
   */
  think(icon: ThoughtIcon, ms: number, by?: string): void {
    // Les cubes (D-122) : ceux déjà trouvés, d'après les étapes vécues.
    const cubes = icon === 'cubes' ? towerCubesMask(this.director.flags) : 0;
    if (by !== undefined) {
      const index = this.stage.props.findIndex((p) => p.id === by);
      const box = this.stage.boxes[index];
      if (index >= 0 && box && this.stage.shown[index]) {
        this.speechProp = index;
        this.speechSpec = { icon, cubes, side: this.side(box.x + box.width * 0.5) };
        this.showBubble(this.speech, this.speechSpec);
        this.speechStart = this.scene.time.now;
        this.speechEnd = this.speechStart + ms;
      }
      return;
    }
    this.thoughtSpec = { icon, cubes, side: this.side(this.celesteX) };
    this.showBubble(this.thought, this.thoughtSpec);
    this.thoughtStart = this.scene.time.now;
    this.thoughtEnd = this.thoughtStart + ms;
  }

  /**
   * La texture d'une bulle (D-165), dessinée la première fois qu'elle sert. Aussi pour les bulles
   * des passants (`PasserbyView`).
   */
  bubbleTexture(kind: BubbleKind, icon: ThoughtIcon, side: BubbleSide, cubes = 0): string {
    const key = bubbleKey(kind, icon, side, cubes);
    if (!this.bubbleKeys.has(key)) {
      const k = THOUGHT_SCALE;
      this.texture(key, BUBBLE_SIZE.w * k, BUBBLE_SIZE.h * k, (ctx) => {
        ctx.scale(k, k);
        drawBubble(ctx, kind, icon, this.images, side, cubes);
      });
      this.bubbleKeys.add(key);
    }
    return key;
  }

  /** Le côté d'une bulle attachée en `x` (px du monde) : vers l'intérieur de la salle. */
  side(x: number): BubbleSide {
    const bounds = this.scene.cameras.main.getBounds(this.roomBounds);
    return bubbleSide(x, BUBBLE_WORLD_W, bounds.right);
  }

  private showBubble(image: Phaser.GameObjects.Image, spec: BubbleSpec | null): void {
    if (!spec || this.artScale <= 0) {
      return;
    }
    const kind = image === this.thought ? 'thought' : 'speech';
    image
      .setTexture(this.bubbleTexture(kind, spec.icon, spec.side, spec.cubes))
      .setOrigin(spec.side > 0 ? 0 : 1, 1);
  }

  /** Une bulle est affichée. */
  get thinking(): boolean {
    return this.scene.time.now < this.thoughtEnd;
  }

  clearThought(): void {
    this.thoughtEnd = -1;
    this.thoughtSpec = null;
  }

  /** Une image : bulle au-dessus de la tête de Céleste (pieds en x, y), étincelle. */
  render(x: number, y: number, headHeight: number): void {
    const now = this.scene.time.now;
    const thought = this.thought;
    this.celesteX = x;
    if (now < this.thoughtEnd) {
      const fade = STORY_TIMING.thoughtFadeMs;
      const alpha = Math.min(1, (now - this.thoughtStart) / fade, (this.thoughtEnd - now) / fade);
      const nudge = BUBBLE_NUDGE.thought * (this.thoughtSpec?.side ?? 1);
      thought
        .setVisible(true)
        .setAlpha(Math.max(0, alpha))
        .setPosition(x - nudge, y - headHeight + 2 - (1 - Math.min(1, alpha)) * 2);
    } else if (thought.visible) {
      thought.setVisible(false);
    }
    const speechBox = this.stage.boxes[this.speechProp];
    // Une tête qui dépasse du cadre (pose assise illustrée) : la bulle part de plus haut.
    const speechKind = this.stage.props[this.speechProp]?.kind;
    const speechLift = speechKind ? characterHeadroom(speechKind) : 0;
    if (now < this.speechEnd && speechBox) {
      const fade = STORY_TIMING.thoughtFadeMs;
      const alpha = Math.min(1, (now - this.speechStart) / fade, (this.speechEnd - now) / fade);
      this.speech
        .setVisible(true)
        .setAlpha(Math.max(0, alpha))
        // La pointe de la bulle part du milieu du personnage : sa tête.
        .setPosition(
          speechBox.x + speechBox.width * 0.5 - BUBBLE_NUDGE.speech * (this.speechSpec?.side ?? 1),
          speechBox.y + 4 - speechLift,
        );
    } else if (this.speech.visible) {
      this.speech.setVisible(false);
    }
    // Petit mouvement en boucle des personnages, chacun à son rythme.
    for (let i = 0; i < this.propImages.length; i++) {
      const loop = this.loopKeys[i];
      const image = this.propImages[i];
      if (!loop || !image) {
        continue;
      }
      const key = Math.floor((now + i * 377) / loop[2]) % 2 === 0 ? loop[0] : loop[1];
      if (image.texture.key !== key) {
        image.setTexture(key);
      }
    }
    const trigger = this.director.data.triggers[this.director.interactable];
    const mark = trigger?.mark ?? this.doorMark;
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
