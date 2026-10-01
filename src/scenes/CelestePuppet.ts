import Phaser from 'phaser';
import type { ArtPalette } from '../config/art';
import type { GrowthPhase } from '../config/growth';
import type { CelestePose } from '../core/player/celestePose';
import { CELESTE_PARTS, drawCelestePart, type CelestePart } from './art/celesteArt';

/** Squelette (px logiques, pieds en (0, 0), tournée vers la droite). */
const HIP = { x: 0, y: -8 };
/** Épaules et cou, par rapport à la hanche (suivent l'inclinaison du buste). */
const SHOULDER_BACK = { x: -2, y: -6.5 };
const SHOULDER_FRONT = { x: 2, y: -6.5 };
const NECK = { x: 0.5, y: -7.2 };
const LEG_BACK = { x: -1.5, y: 0 };
const LEG_FRONT = { x: 1.5, y: 0 };
/** Couettes, par rapport au cou (suivent la tête). */
const PIGTAIL_BACK = { x: -6.2, y: -6.5 };
const PIGTAIL_FRONT = { x: 5.8, y: -7 };
/** Queue de cheval (D-69), haut derrière la tête, par rapport au cou. */
const PONYTAIL = { x: -5.6, y: -10.2 };
/** Longueur du bras (px, de l'épaule à la main) et prise du manche du parapluie (D-62). */
const ARM_LENGTH = 7.2;
const UMBRELLA_GRIP = 2;
/** Teinte des membres du côté caché (lecture de la profondeur). */
const BACK_TINT = 0xb9aebf;

type PartImage = Phaser.GameObjects.Image;

/**
 * Céleste en « papier découpé » (D-29) : pièces fixes (une image fournie `celeste-<pièce>` remplace
 * le dessin), placées et tournées à chaque image selon la pose calculée par `CelestePoser`.
 * Aucune allocation par image.
 */
export class CelestePuppet {
  readonly container: Phaser.GameObjects.Container;
  private readonly armBack: PartImage;
  private readonly legBack: PartImage;
  private readonly pigtailBack: PartImage;
  private readonly pigtailFront: PartImage;
  /** Queue de cheval (D-69) : remplace les couettes à partir de la phase 3. */
  private readonly ponytail: PartImage;
  private readonly torso: PartImage;
  private readonly legFront: PartImage;
  private readonly skirt: PartImage;
  private readonly head: PartImage;
  private readonly armFront: PartImage;
  /** Parapluie (D-62), dans la main avant ; visible seulement ouvert. */
  private readonly umbrella: PartImage;
  /** Parapluie replié, pendu à un câble par son crochet (D-65). */
  private readonly hook: PartImage;
  /** Repère courant de `place` et échelle des textures (champs : aucune allocation par image). */
  private hipX = 0;
  private hipY = 0;
  private cos = 1;
  private sin = 0;
  private scale = 1;
  /** Croissance (D-43) : allongement du corps et des couettes ; la tête ne grandit pas. */
  private body = 1;

  constructor(private readonly scene: Phaser.Scene) {
    const part = (name: CelestePart) => {
      const { originX, originY } = CELESTE_PARTS[name];
      return scene.add.image(0, 0, '__DEFAULT').setOrigin(originX, originY);
    };
    this.armBack = part('arm').setTint(BACK_TINT);
    this.legBack = part('leg').setTint(BACK_TINT);
    this.pigtailBack = part('pigtail').setTint(BACK_TINT);
    this.ponytail = part('ponytail').setVisible(false);
    this.torso = part('torso');
    this.legFront = part('leg');
    this.skirt = part('skirt');
    this.pigtailFront = part('pigtail');
    this.head = part('head');
    this.armFront = part('arm');
    this.umbrella = part('umbrella').setVisible(false);
    this.hook = part('hook').setVisible(false);
    this.container = scene.add
      .container(0, 0, [
        this.umbrella,
        this.hook,
        this.armBack,
        this.legBack,
        this.pigtailBack,
        this.ponytail,
        this.torso,
        this.legFront,
        this.skirt,
        this.pigtailFront,
        this.head,
        this.armFront,
      ])
      .setDepth(10);
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  setAlpha(alpha: number): this {
    this.container.setAlpha(alpha);
    return this;
  }

  /**
   * Redessine les pièces à l'échelle de l'écran (ou reprend les images fournies), à la phase de
   * croissance donnée (tenue, proportions).
   */
  redraw(
    scale: number,
    palette: Readonly<ArtPalette>,
    images: ReadonlyMap<string, CanvasImageSource>,
    growth: GrowthPhase,
  ): void {
    this.scale = scale;
    this.body = growth.bodyScale;
    const textures = this.scene.textures;
    for (const name of Object.keys(CELESTE_PARTS) as CelestePart[]) {
      const { width, height } = CELESTE_PARTS[name];
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        continue;
      }
      const key = `celeste-${name}`;
      const image = images.get(key);
      if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.scale(scale, scale);
        drawCelestePart(ctx, name, palette, growth.outfit);
      }
      if (textures.exists(key)) {
        textures.remove(key);
      }
      textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    const inverse = 1 / scale;
    const assign = (image: PartImage, name: CelestePart, stretch = 1) =>
      image.setTexture(`celeste-${name}`).setScale(inverse, inverse * stretch);
    assign(this.armBack, 'arm');
    assign(this.armFront, 'arm');
    assign(this.legBack, 'leg', growth.bodyScale);
    assign(this.legFront, 'leg', growth.bodyScale);
    assign(this.pigtailBack, 'pigtail', growth.hairScale);
    assign(this.pigtailFront, 'pigtail', growth.hairScale);
    assign(this.ponytail, 'ponytail', growth.hairScale);
    const ponytail = growth.hair === 'ponytail';
    this.ponytail.setVisible(ponytail);
    this.pigtailBack.setVisible(!ponytail);
    this.pigtailFront.setVisible(!ponytail);
    assign(this.torso, 'torso', growth.bodyScale);
    assign(this.skirt, 'skirt', growth.bodyScale);
    assign(this.head, 'head');
    assign(this.umbrella, 'umbrella');
    assign(this.hook, 'hook');
    this.skirt.setVisible(growth.outfit === 'dress');
  }

  /**
   * Place la marionnette : pieds en (x, y), tournée selon `facing`, écrasement et inclinaison de
   * `PlayerFeel`, pièces selon la pose. Les angles de la pose sont « vers l'avant » positifs.
   */
  render(
    x: number,
    y: number,
    facing: number,
    scaleX: number,
    scaleY: number,
    lean: number,
    pose: Readonly<CelestePose>,
  ): void {
    this.container
      .setPosition(x, y)
      .setScale(facing < 0 ? -scaleX : scaleX, scaleY)
      .setRotation(facing < 0 ? -lean : lean);
    const tilt = pose.bodyTilt;
    this.cos = Math.cos(tilt);
    this.sin = Math.sin(tilt);
    const body = this.body;
    this.hipX = HIP.x;
    this.hipY = HIP.y * body + pose.bodyY;
    const reach = (pose.armReach * body) / this.scale;
    this.torso.setPosition(this.hipX, this.hipY).setRotation(tilt);
    this.skirt.setPosition(this.hipX, this.hipY).setRotation(tilt);
    this.place(this.armBack, SHOULDER_BACK.x, SHOULDER_BACK.y * body, tilt - pose.armBack);
    this.place(this.armFront, SHOULDER_FRONT.x, SHOULDER_FRONT.y * body, tilt - pose.armFront);
    this.armBack.scaleY = reach;
    this.armFront.scaleY = reach;
    this.place(this.head, NECK.x, NECK.y * body, tilt + pose.headTilt);
    // Parapluie (D-62) : le manche dans la main avant (au bout du bras), le dôme droit au-dessus.
    const open = pose.umbrella;
    this.umbrella.setVisible(open > 0.05);
    if (open > 0.05) {
      const arm = ARM_LENGTH * pose.armReach * body;
      this.place(
        this.umbrella,
        SHOULDER_FRONT.x + arm * Math.sin(pose.armFront),
        SHOULDER_FRONT.y * body + arm * Math.cos(pose.armFront) + UMBRELLA_GRIP,
        tilt * 0.5,
      );
      this.umbrella.setScale(open / this.scale, (0.4 + 0.6 * open) / this.scale);
    }
    // Crochet (D-65) : le parapluie replié dans la main avant, tout droit, crochet en haut.
    this.hook.setVisible(pose.hook > 0.5);
    if (pose.hook > 0.5) {
      const arm = ARM_LENGTH * pose.armReach * body;
      this.place(
        this.hook,
        SHOULDER_FRONT.x + arm * Math.sin(pose.armFront),
        SHOULDER_FRONT.y * body + arm * Math.cos(pose.armFront) + UMBRELLA_GRIP,
        0,
      );
    }
    this.legBack
      .setPosition(this.hipX + LEG_BACK.x, this.hipY + LEG_BACK.y)
      .setRotation(-pose.legBack);
    this.legFront
      .setPosition(this.hipX + LEG_FRONT.x, this.hipY + LEG_FRONT.y)
      .setRotation(-pose.legFront);
    // Couettes (ou queue de cheval) : attachées à la tête, tirées vers l'arrière par la pose.
    const headRotation = tilt + pose.headTilt;
    this.cos = Math.cos(headRotation);
    this.sin = Math.sin(headRotation);
    this.hipX = this.head.x;
    this.hipY = this.head.y;
    this.place(this.pigtailBack, PIGTAIL_BACK.x, PIGTAIL_BACK.y, headRotation + pose.pigtails);
    this.place(
      this.pigtailFront,
      PIGTAIL_FRONT.x,
      PIGTAIL_FRONT.y,
      headRotation + pose.pigtails * 0.8,
    );
    this.place(this.ponytail, PONYTAIL.x, PONYTAIL.y, headRotation + pose.pigtails);
  }

  /** Place une pièce à un point (dx, dy) du repère courant (origine, rotation), sans allocation. */
  private place(image: PartImage, dx: number, dy: number, rotation: number): void {
    image
      .setPosition(
        this.hipX + dx * this.cos - dy * this.sin,
        this.hipY + dx * this.sin + dy * this.cos,
      )
      .setRotation(rotation);
  }
}
