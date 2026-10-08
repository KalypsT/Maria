import Phaser from 'phaser';
import { CELESTE_PART_IMAGES, type ArtPalette } from '../config/art';
import type { CelesteOutfit, GrowthPhase } from '../config/growth';
import type { CelestePose } from '../core/player/celestePose';
import { CELESTE_PARTS, drawCelestePart, type CelestePart } from './art/celesteArt';

/** Squelette (px logiques, pieds en (0, 0), tournée vers la droite). */
const HIP = { x: 0, y: -8 };
interface Point {
  x: number;
  y: number;
}
/**
 * Points d'attache des pièces. Épaules, cou et jambes par rapport à la hanche (suivent
 * l'inclinaison du buste) ; couettes par rapport au cou (suivent la tête).
 */
interface PuppetLayout {
  shoulderBack: Point;
  shoulderFront: Point;
  neck: Point;
  legBack: Point;
  legFront: Point;
  pigtailBack: Point;
  pigtailFront: Point;
  /** Queue de cheval (D-69), haut derrière la tête, par rapport au cou. */
  ponytail: Point;
}
/** Céleste dessinée par le code, de trois quarts : une couette de chaque côté de la tête. */
const DRAWN_LAYOUT: Readonly<PuppetLayout> = {
  shoulderBack: { x: -2, y: -6.5 },
  shoulderFront: { x: 2, y: -6.5 },
  neck: { x: 0.5, y: -7.2 },
  legBack: { x: -1.5, y: 0 },
  legFront: { x: 1.5, y: 0 },
  pigtailBack: { x: -6.2, y: -6.5 },
  pigtailFront: { x: 5.8, y: -7 },
  ponytail: { x: -5.6, y: -10.2 },
};
/**
 * Céleste illustrée, de profil (D-147, D-148) : épaules et jambes presque l'une derrière l'autre,
 * les épaules dans l'emmanchure du torse ; les couettes (ou la queue de cheval) là où la tête de la
 * tenue les attend. Relevés sur les pièces composées par `scripts/celeste-parts.py`.
 */
const PROFILE_BODY = {
  shoulderBack: { x: -0.8, y: -6.9 },
  shoulderFront: { x: -0.3, y: -6.7 },
  neck: { x: -0.2, y: -7.2 },
  legBack: { x: -0.8, y: 0 },
  legFront: { x: 0.6, y: 0 },
} as const;
const PROFILE_LAYOUTS: Readonly<Record<CelesteOutfit, Readonly<PuppetLayout>>> = {
  // Le nœud dessiné derrière l'oreille.
  pyjama: {
    ...PROFILE_BODY,
    pigtailBack: { x: -4.3, y: -7 },
    pigtailFront: { x: -3.8, y: -6.7 },
    ponytail: DRAWN_LAYOUT.ponytail,
  },
  // Les couettes basses, derrière l'oreille, sur la nuque.
  dress: {
    ...PROFILE_BODY,
    pigtailBack: { x: -3.3, y: -4.3 },
    pigtailFront: { x: -2.9, y: -4 },
    ponytail: DRAWN_LAYOUT.ponytail,
  },
  // La queue de cheval où les cheveux se rassemblent, derrière la tête.
  tee: {
    ...PROFILE_BODY,
    pigtailBack: DRAWN_LAYOUT.pigtailBack,
    pigtailFront: DRAWN_LAYOUT.pigtailFront,
    ponytail: { x: -5.2, y: -8.4 },
  },
  // La queue de cheval haut derrière la tête.
  jacket: {
    ...PROFILE_BODY,
    pigtailBack: DRAWN_LAYOUT.pigtailBack,
    pigtailFront: DRAWN_LAYOUT.pigtailFront,
    ponytail: { x: -4.9, y: -9.3 },
  },
};
/** Longueur du bras (px, de l'épaule à la main) et prise du manche du parapluie (D-62). */
const ARM_LENGTH = 7.2;
const UMBRELLA_GRIP = 2;
/** Teinte des membres du côté caché (lecture de la profondeur). */
const BACK_TINT = 0xb9aebf;

type PartImage = Phaser.GameObjects.Image;

/**
 * Céleste en « papier découpé » (D-29) : pièces fixes (les pièces illustrées d'une tenue, D-147, ou
 * une image fournie `celeste-<pièce>` remplacent le dessin), placées et tournées à chaque image selon la pose calculée par `CelestePoser`.
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
  /** Points d'attache : dessin par code ou pièces illustrées (D-147). */
  private layout: Readonly<PuppetLayout> = DRAWN_LAYOUT;

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

  get alpha(): number {
    return this.container.alpha;
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
    // Pièces illustrées de la tenue (D-147), toutes ou aucune ; le monde étrange garde la silhouette
    // dessinée par le code (seules les lunettes y restent roses).
    const illustrated = CELESTE_PART_IMAGES[growth.outfit] ?? [];
    const useImages =
      !palette.silhouettes &&
      illustrated.length > 0 &&
      illustrated.every((part) => images.has(celestePartKey(growth.outfit, part)));
    this.layout = useImages ? PROFILE_LAYOUTS[growth.outfit] : DRAWN_LAYOUT;
    // De profil, la jambe avant passe sous l'ourlet du haut et le cou sous le col (la tête, et ses
    // couettes, derrière le torse). Sinon l'ordre du dessin par code.
    const c = this.container;
    if (useImages) {
      c.moveBelow(this.legFront, this.torso);
      // La jupe passe sur la taille de la robe ; le short, sous le bas de la veste.
      if (growth.outfit === 'jacket') {
        c.moveBelow(this.skirt, this.torso);
      } else {
        c.moveAbove(this.skirt, this.torso);
      }
      c.moveBelow(this.head, this.torso);
      c.moveBelow(this.pigtailFront, this.head);
    } else {
      c.moveAbove(this.legFront, this.torso);
      c.moveAbove(this.skirt, this.legFront);
      c.moveAbove(this.pigtailFront, this.skirt);
      c.moveAbove(this.head, this.pigtailFront);
    }
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
      const image =
        useImages && illustrated.includes(name)
          ? images.get(celestePartKey(growth.outfit, name))
          : images.get(key);
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
    // La jupe de la robe ; le short illustré de la veste est aussi une pièce de hanche (D-148).
    this.skirt.setVisible(
      growth.outfit === 'dress' || (useImages && illustrated.includes('skirt')),
    );
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
    const layout = this.layout;
    const tilt = pose.bodyTilt;
    this.cos = Math.cos(tilt);
    this.sin = Math.sin(tilt);
    const body = this.body;
    this.hipX = HIP.x;
    // Couchée (D-84) : la hanche descend jusqu'au tiers de la longueur des jambes.
    this.hipY = HIP.y * body * (1 - 0.66 * pose.lie) + pose.bodyY;
    const reach = (pose.armReach * body) / this.scale;
    this.torso.setPosition(this.hipX, this.hipY).setRotation(tilt);
    this.skirt.setPosition(this.hipX, this.hipY).setRotation(tilt);
    this.place(
      this.armBack,
      layout.shoulderBack.x,
      layout.shoulderBack.y * body,
      tilt - pose.armBack,
    );
    this.place(
      this.armFront,
      layout.shoulderFront.x,
      layout.shoulderFront.y * body,
      tilt - pose.armFront,
    );
    this.armBack.scaleY = reach;
    this.armFront.scaleY = reach;
    this.place(this.head, layout.neck.x, layout.neck.y * body, tilt + pose.headTilt);
    // Parapluie (D-62) : le manche dans la main avant (au bout du bras), le dôme droit au-dessus.
    const open = pose.umbrella;
    this.umbrella.setVisible(open > 0.05);
    if (open > 0.05) {
      const arm = ARM_LENGTH * pose.armReach * body;
      this.place(
        this.umbrella,
        layout.shoulderFront.x + arm * Math.sin(pose.armFront),
        layout.shoulderFront.y * body + arm * Math.cos(pose.armFront) + UMBRELLA_GRIP,
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
        layout.shoulderFront.x + arm * Math.sin(pose.armFront),
        layout.shoulderFront.y * body + arm * Math.cos(pose.armFront) + UMBRELLA_GRIP,
        0,
      );
    }
    this.legBack
      .setPosition(this.hipX + layout.legBack.x, this.hipY + layout.legBack.y)
      .setRotation(-pose.legBack);
    this.legFront
      .setPosition(this.hipX + layout.legFront.x, this.hipY + layout.legFront.y)
      .setRotation(-pose.legFront);
    // Couettes (ou queue de cheval) : attachées à la tête, tirées vers l'arrière par la pose.
    const headRotation = tilt + pose.headTilt;
    this.cos = Math.cos(headRotation);
    this.sin = Math.sin(headRotation);
    this.hipX = this.head.x;
    this.hipY = this.head.y;
    this.place(
      this.pigtailBack,
      layout.pigtailBack.x,
      layout.pigtailBack.y,
      headRotation + pose.pigtails,
    );
    this.place(
      this.pigtailFront,
      layout.pigtailFront.x,
      layout.pigtailFront.y,
      headRotation + pose.pigtails * 0.8,
    );
    this.place(this.ponytail, layout.ponytail.x, layout.ponytail.y, headRotation + pose.pigtails);
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

/** Clé d'une pièce illustrée de Céleste dans les images fournies (D-147). */
export function celestePartKey(outfit: string, part: string): string {
  return `celeste-${outfit}-${part}`;
}
