import Phaser from 'phaser';
import type { ArtPalette } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { STRANGE_FX as FX } from '../config/strangeFx';
import {
  createEyes,
  createTremor,
  isClearSpot,
  seededRandom,
  stepEyes,
  stepTremor,
  type Eyes,
  type Tremor,
} from '../core/fx/strangeLife';
import { floatingDecor } from '../core/level/decor';
import type { LevelData } from '../core/level/LevelData';
import type { TileArea } from '../core/story/story';
import { drawToyShadow } from './art/roomArt';

/** Échelle des textures des effets (nettes jusqu'à l'échelle 3 de l'écran). */
const S = 3;
/** Plans : derrière la lumière (reculé dans l'ombre), au-dessus d'elle (lueurs), devant tout. */
const BEHIND_LIGHT = -4;
const ABOVE_LIGHT = 4.5;
const SPARKLE_DEPTH = 9.5;
const OMEN_DEPTH = 11.5;

const TURQUOISE = '#aefcf0';
/** Objets de la maison de Céleste qui dérivent dans le monde étrange (D-35). */
const DRIFT_KINDS = ['book', 'block', 'slipper', 'cup', 'pencil', 'bottle'] as const;

interface Particle {
  readonly image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornMs: number;
  lifeMs: number;
  phase: number;
  /** Objet à la dérive qui s'efface (sorti d'une zone vide). */
  leaving: number;
}

interface Swaying {
  readonly image: Phaser.GameObjects.Image;
  readonly phase: number;
  readonly base: number;
}

/**
 * Effets du monde étrange (D-35), purement visuels : présage (voile froid, lumière qui vacille,
 * tremblement), scintillements et tremblements des scripts, et la vie des salles étranges
 * (poussière qui monte, objets de la maison à la dérive, horloge qui recule, rideaux sans vent,
 * lampes qui vacillent, lueurs qui respirent, yeux dans l'ombre). Stock d'images créé une fois par
 * salle ; aucune allocation par image. Maria n'est jamais animée (pilier 5).
 */
export class StrangeFxView {
  /** Décalage de la caméra (tremblement), px logiques, à ajouter après le centrage. */
  offsetX = 0;
  offsetY = 0;
  private readonly rand = seededRandom(20260929);
  private readonly tint: Phaser.GameObjects.Rectangle;
  private readonly flicker: Phaser.GameObjects.Rectangle;
  private readonly sparkles: Particle[] = [];
  private nextSparkle = 0;
  private sparkleArea = { x: 0, y: 0, w: 0, h: 0 };
  private sparkleUntil = -1;
  private shakeUntil = -1;
  private shakeMs = 1;
  private shakeStrength = 0;
  private omen = 0;
  private flickerUntil = 0;
  private flickerDepth = 0;
  private lastMs = -1;
  // Vie de la salle étrange courante.
  private level: LevelData | null = null;
  private roomObjects: Phaser.GameObjects.Image[] = [];
  private dust: Particle[] = [];
  private drift: Particle[] = [];
  private hands: Phaser.GameObjects.Image[] = [];
  private curtains: Swaying[] = [];
  private lamps: Swaying[] = [];
  private glows: Swaying[] = [];
  private eyes: { readonly state: Eyes; readonly image: Phaser.GameObjects.Image }[] = [];
  private snow: Particle[] = [];
  private falling: Particle[] = [];
  private nextFalling = 0;
  private bedroomLamps: {
    readonly halo: Phaser.GameObjects.Image;
    readonly shade: Phaser.GameObjects.Image;
    readonly periodMs: number;
    readonly phase: number;
  }[] = [];
  private bears: {
    readonly image: Phaser.GameObjects.Image;
    readonly x0: number;
    startMs: number;
  }[] = [];
  private tremor: Tremor = createTremor(0, FX, this.rand);
  private tremorK = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.createTextures();
    this.tint = scene.add
      .rectangle(0, 0, 4000, 4000, FX.omenTintColor)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(OMEN_DEPTH)
      .setAlpha(0)
      .setVisible(false);
    this.flicker = scene.add
      .rectangle(0, 0, 4000, 4000, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(OMEN_DEPTH)
      .setAlpha(0)
      .setVisible(false);
    for (let i = 0; i < FX.sparkleCount; i++) {
      this.sparkles.push(this.particle('fx-sparkle', SPARKLE_DEPTH, true));
    }
  }

  /** Scintillements dans une zone (tuiles) pendant `ms`. */
  sparkle(area: TileArea, ms: number): void {
    this.sparkleArea = { x: area.col * T, y: area.row * T, w: area.w * T, h: area.h * T };
    this.sparkleUntil = this.scene.time.now + ms;
  }

  /** Tremblement pendant `ms` (force 1 : `STRANGE_FX.shakePx`), qui s'apaise sur la fin. */
  shake(ms: number, strength: number): void {
    this.shakeUntil = this.scene.time.now + ms;
    this.shakeMs = Math.max(1, ms);
    this.shakeStrength = strength;
  }

  /** Présage de 0 à 1 (hauteur de Céleste en grimpant vers Maria). */
  setOmen(value: number): void {
    this.omen = value;
  }

  /** Arrête scintillements et tremblements (réapparition, changement de salle hors histoire). */
  reset(): void {
    this.sparkleUntil = -1;
    this.shakeUntil = -1;
    for (const p of this.sparkles) {
      p.image.setVisible(false);
      p.bornMs = -1;
    }
  }

  /**
   * Nouvelle salle : la vie du monde étrange n'existe que dans ses salles. `palette` : couleurs
   * des rideaux et des objets.
   */
  load(level: LevelData, strange: boolean, palette: Readonly<ArtPalette>): void {
    for (const image of this.roomObjects) {
      image.destroy();
    }
    this.roomObjects = [];
    this.dust = [];
    this.drift = [];
    this.hands = [];
    this.curtains = [];
    this.lamps = [];
    this.glows = [];
    this.eyes = [];
    this.snow = [];
    this.falling = [];
    this.bedroomLamps = [];
    this.bears = [];
    this.tremorK = 0;
    this.level = strange ? level : null;
    if (!strange) {
      return;
    }
    const now = this.scene.time.now;
    const own = (image: Phaser.GameObjects.Image) => {
      this.roomObjects.push(image);
      return image;
    };
    for (let i = 0; i < FX.dustCount; i++) {
      const p = this.particle('fx-mote', ABOVE_LIGHT, true);
      own(p.image);
      this.dust.push(p);
    }
    for (let i = 0; i < FX.driftCount; i++) {
      const kind = DRIFT_KINDS[i % DRIFT_KINDS.length] ?? 'book';
      const p = this.particle(`fx-${kind}`, BEHIND_LIGHT, false);
      own(p.image);
      this.drift.push(p);
    }
    const curtain = Phaser.Display.Color.HexStringToColor(palette.curtain).color;
    const [lr = 255, lg = 255, lb = 255] = palette.lamp.split(',').map(Number);
    const lamp = Phaser.Display.Color.GetColor(lr, lg, lb);
    this.tremor = createTremor(now, FX, this.rand);
    for (let i = 0; i < FX.snowCount; i++) {
      const p = this.particle('fx-sparkle', ABOVE_LIGHT, true);
      own(p.image);
      this.snow.push(p);
    }
    for (let i = 0; i < FX.tremorDust; i++) {
      const p = this.particle('fx-mote', ABOVE_LIGHT, false);
      p.image.setTint(0xb8a8d8);
      own(p.image);
      this.falling.push(p);
    }
    for (const d of level.decor) {
      const x = d.col * T;
      const y = d.row * T;
      const w = d.width * T;
      const h = d.height * T;
      if (d.kind === 'clock') {
        this.hands.push(
          own(
            this.scene.add
              .image(x + w / 2, y + h / 2, 'fx-hand')
              .setOrigin(0.5, 1)
              .setScale(1 / S, (h / 3 / 8) * (1 / S))
              .setDepth(BEHIND_LIGHT),
          ),
        );
      } else if (d.kind === 'window') {
        // Rideaux par-dessus ceux du décor, qui ondulent sans vent.
        for (const [left, phase] of [
          [x - 5, 0],
          [x + w + 5, 1.7],
        ] as const) {
          const image = own(
            this.scene.add
              .image(left, y - 8, 'fx-curtain')
              .setOrigin(0.5, 0)
              .setScale(1 / S, (h + 18) / 64 / S)
              .setTint(curtain)
              .setDepth(BEHIND_LIGHT),
          );
          this.curtains.push({ image, phase, base: 1 / S });
        }
      } else if (d.kind === 'lamp') {
        const image = own(
          this.scene.add
            .image(x + w / 2, y + 4, 'fx-halo')
            .setScale(70 / 64 / S)
            .setTint(lamp)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(ABOVE_LIGHT),
        );
        this.lamps.push({ image, phase: this.rand() * 10, base: 1 });
      } else if (d.kind === 'eyes') {
        const state = createEyes(x + w / 2, y + h / 2, now, this.rand);
        const image = own(
          this.scene.add
            .image(state.x, state.y, 'fx-eyes')
            .setScale(1 / S)
            .setDepth(ABOVE_LIGHT),
        );
        this.eyes.push({ state, image });
      } else if (d.kind === 'bedroom-window') {
        // La lampe de la chambre, au loin, s'allume et s'éteint lentement.
        const floorY = y + h * 0.82;
        const halo = own(
          this.scene.add
            .image(x + w * 0.78, floorY - h * 0.4, 'fx-halo')
            .setScale(22 / 64 / S)
            .setTint(0xffcf7a)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(BEHIND_LIGHT),
        );
        const shade = own(
          this.scene.add
            .image(x, y, 'fx-dark')
            .setOrigin(0, 0)
            .setScale(w / 4, h / 4)
            .setDepth(BEHIND_LIGHT),
        );
        const periodMs =
          FX.bedroomLampMinMs + this.rand() * (FX.bedroomLampMaxMs - FX.bedroomLampMinMs);
        this.bedroomLamps.push({ halo, shade, periodMs, phase: this.rand() * Math.PI * 2 });
      } else if (d.kind === 'toy-shadow') {
        const key = `fx-bear-${String(d.width)}x${String(d.height)}`;
        this.make(key, w, h, (ctx) => {
          drawToyShadow(ctx, { x: 0, y: 0, w, h });
        });
        const image = own(
          this.scene.add
            .image(x, y, key)
            .setOrigin(0, 0)
            .setScale(1 / S)
            .setDepth(BEHIND_LIGHT),
        );
        this.bears.push({ image, x0: x, startMs: now - this.rand() * 20000 });
      }
    }
    for (const d of floatingDecor(level)) {
      const w = d.width * T;
      const image = own(
        this.scene.add
          .image(d.col * T + w / 2, (d.row + d.height) * T + 2, 'fx-glow')
          .setScale((w + 12) / 64 / S, 1 / S)
          .setTint(lamp)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(BEHIND_LIGHT),
      );
      this.glows.push({ image, phase: this.rand() * Math.PI * 2, base: 1 });
    }
  }

  /**
   * Une image : `view` est la zone visible (px logiques), Céleste au point (x, y), `grounded` : les
   * pieds au sol (les frissons attendent qu'elle se pose).
   */
  update(view: Phaser.Geom.Rectangle, celesteX: number, celesteY: number, grounded: boolean): void {
    const now = this.scene.time.now;
    const dt = this.lastMs < 0 ? 16 : Math.min(100, now - this.lastMs);
    this.lastMs = now;
    if (this.level) {
      const k = stepTremor(this.tremor, now, grounded, FX, this.rand);
      if (k > 0 && this.tremorK === 0) {
        this.dropDust(view);
      }
      this.tremorK = k;
    }
    this.updateOmen(now);
    this.updateShake(now);
    this.updateSparkles(now);
    if (!this.level) {
      return;
    }
    this.updateDust(now, dt, view);
    this.updateDrift(now, dt, view);
    this.updateSnow(now, dt, view, celesteX, celesteY);
    this.updateFalling(now, dt);
    for (const b of this.bedroomLamps) {
      const on = Math.min(
        1,
        Math.max(0, 0.5 + 1.4 * Math.sin((now / b.periodMs) * Math.PI * 2 + b.phase)),
      );
      b.halo.setAlpha(on * 0.9);
      b.shade.setAlpha((1 - on) * 0.45);
    }
    const glideMs = ((FX.bearGlideTiles * T) / FX.bearGlidePxPerS) * 1000;
    for (const bear of this.bears) {
      let t = now - bear.startMs;
      if (t > glideMs + FX.bearHiddenMs) {
        bear.startMs = now;
        t = 0;
      }
      const visible = t < glideMs;
      bear.image.setVisible(visible);
      if (visible) {
        // Apparition et effacement lents aux deux bouts du glissement.
        const fade = Math.min(1, t / 4000, (glideMs - t) / 4000);
        bear.image.setX(bear.x0 + (t / 1000) * FX.bearGlidePxPerS).setAlpha(fade);
      }
    }
    const tick = Math.floor(now / FX.clockTickMs);
    const within = (now % FX.clockTickMs) / 120;
    for (const hand of this.hands) {
      // L'aiguille recule par à-coups (un petit saut, puis l'immobilité).
      hand.rotation = -(tick + Math.min(1, within)) * FX.clockTickRad;
    }
    for (const c of this.curtains) {
      const k = Math.sin((now / FX.curtainMs) * Math.PI * 2 + c.phase);
      c.image.scaleX = c.base * (1 + FX.curtainSway * k);
      c.image.rotation = 0.04 * k;
    }
    for (const lamp of this.lamps) {
      // Vacillement irrégulier : deux ondes, et de brèves chutes.
      const wave =
        0.5 + 0.3 * Math.sin(now / 130 + lamp.phase) + 0.2 * Math.sin(now / 47 + lamp.phase * 3);
      const dip = Math.sin(now / 900 + lamp.phase) > 0.93 ? 0.2 : 1;
      lamp.image.setAlpha(Math.max(FX.lampFlickerMin, wave * dip) * 0.55);
    }
    for (const glow of this.glows) {
      const k = 0.5 + 0.5 * Math.sin((now / FX.glowBreathMs) * Math.PI * 2 + glow.phase);
      // Pendant un frisson, les lueurs vacillent.
      const shiver = this.tremorK > 0 ? 0.4 + this.rand() * 0.6 : 1;
      glow.image.setAlpha(FX.glowBreath * k * shiver);
    }
    for (const e of this.eyes) {
      stepEyes(e.state, celesteX, celesteY, now, dt, FX, this.rand);
      const open = e.state.openness;
      e.image.setVisible(open > 0.05);
      e.image.scaleY = (open * 1) / S;
    }
  }

  private updateOmen(now: number): void {
    const k = this.omen;
    this.tint.setVisible(k > 0).setAlpha(FX.omenTint * k);
    let dark = 0;
    if (k > FX.omenFlickerFrom) {
      if (now >= this.flickerUntil) {
        // Vacillement : de brefs creux de lumière, plus fréquents en montant.
        this.flickerUntil = now + 60 + this.rand() * (900 - 600 * k);
        this.flickerDepth = this.rand() < 0.35 + 0.4 * k ? this.rand() : 0;
      }
      dark = FX.omenFlicker * k * this.flickerDepth;
    }
    this.flicker.setVisible(dark > 0).setAlpha(dark);
  }

  private updateShake(now: number): void {
    let amp = 0;
    if (this.omen > FX.omenShakeFrom) {
      amp = (FX.omenShakePx * (this.omen - FX.omenShakeFrom)) / (1 - FX.omenShakeFrom);
    }
    if (now < this.shakeUntil) {
      const left = (this.shakeUntil - now) / this.shakeMs;
      amp = Math.max(amp, FX.shakePx * this.shakeStrength * Math.min(1, left * 2));
    }
    amp = Math.max(amp, FX.tremorPx * this.tremorK);
    this.offsetX = amp > 0 ? (this.rand() * 2 - 1) * amp : 0;
    this.offsetY = amp > 0 ? (this.rand() * 2 - 1) * amp * 0.6 : 0;
  }

  private updateSparkles(now: number): void {
    const active = now < this.sparkleUntil;
    if (active && this.rand() < 0.7) {
      const p = this.sparkles[this.nextSparkle];
      this.nextSparkle = (this.nextSparkle + 1) % this.sparkles.length;
      if (p) {
        const a = this.sparkleArea;
        p.x = a.x + this.rand() * a.w;
        p.y = a.y + this.rand() * a.h;
        p.bornMs = now;
        p.lifeMs = FX.sparkleLifeMs * (0.6 + this.rand() * 0.8);
        p.phase = this.rand() * Math.PI;
      }
    }
    for (const p of this.sparkles) {
      if (p.bornMs < 0) {
        continue;
      }
      const t = (now - p.bornMs) / p.lifeMs;
      if (t >= 1) {
        p.bornMs = -1;
        p.image.setVisible(false);
        continue;
      }
      const k = Math.sin(t * Math.PI);
      p.image
        .setVisible(true)
        .setPosition(p.x, p.y - t * 6)
        .setAlpha(k)
        .setRotation(p.phase + t * 1.5)
        .setScale(((0.4 + 0.6 * k) * FX.sparkleSize) / 8 / S);
    }
  }

  private updateDust(now: number, dt: number, view: Phaser.Geom.Rectangle): void {
    for (const p of this.dust) {
      if (p.bornMs < 0 || now - p.bornMs >= p.lifeMs) {
        p.x = view.x + this.rand() * view.width;
        p.y = view.y + this.rand() * view.height;
        p.bornMs = now - this.rand() * FX.dustLifeMs * 0.5;
        p.lifeMs = FX.dustLifeMs * (0.7 + this.rand() * 0.6);
        p.phase = this.rand() * 10;
      }
      // Elle monte au lieu de tomber, en oscillant un peu.
      p.y -= (FX.dustRisePxPerS * dt) / 1000;
      const t = (now - p.bornMs) / p.lifeMs;
      p.image
        .setVisible(true)
        .setPosition(p.x + Math.sin(now / 900 + p.phase) * 3, p.y)
        .setAlpha(Math.sin(Math.max(0, t) * Math.PI) * 0.7);
    }
  }

  private updateDrift(now: number, dt: number, view: Phaser.Geom.Rectangle): void {
    const level = this.level;
    if (!level) {
      return;
    }
    for (const p of this.drift) {
      if (p.bornMs < 0) {
        // Un endroit vide, dans la vue ou juste autour ; sinon on réessaiera à l'image suivante.
        const x = view.x - 40 + this.rand() * (view.width + 80);
        const y = view.y - 40 + this.rand() * (view.height + 80);
        if (!isClearSpot(level, x, y, FX.driftClearTiles)) {
          continue;
        }
        const angle = this.rand() * Math.PI * 2;
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * FX.driftPxPerS;
        p.vy = Math.sin(angle) * FX.driftPxPerS * 0.5;
        p.bornMs = now;
        p.lifeMs = 14000 + this.rand() * 10000;
        p.phase = (this.rand() - 0.5) * 0.4;
        p.leaving = -1;
      }
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      const age = now - p.bornMs;
      if (
        p.leaving < 0 &&
        (age > p.lifeMs || !isClearSpot(level, p.x, p.y, FX.driftClearTiles - 1))
      ) {
        p.leaving = now;
      }
      let alpha = Math.min(1, age / 1500);
      if (p.leaving >= 0) {
        alpha = Math.min(alpha, 1 - (now - p.leaving) / 1200);
        if (alpha <= 0) {
          p.bornMs = -1;
          p.image.setVisible(false);
          continue;
        }
      }
      p.image
        .setVisible(true)
        .setPosition(p.x, p.y)
        .setRotation(p.phase * (age / 1000))
        .setAlpha(alpha * FX.driftAlpha);
    }
  }

  /** Scintillements qui tombent doucement ; ils s'effacent près de Céleste (jamais devant elle). */
  private updateSnow(
    now: number,
    dt: number,
    view: Phaser.Geom.Rectangle,
    celesteX: number,
    celesteY: number,
  ): void {
    for (const p of this.snow) {
      if (p.bornMs < 0 || now - p.bornMs >= p.lifeMs || p.y > view.y + view.height + 8) {
        p.x = view.x + this.rand() * view.width;
        p.y = view.y - 8 + this.rand() * view.height * 0.6;
        p.bornMs = now - this.rand() * FX.snowLifeMs * 0.3;
        p.lifeMs = FX.snowLifeMs * (0.6 + this.rand() * 0.8);
        p.phase = this.rand() * 10;
        p.leaving = -1;
      }
      p.y += (FX.snowFallPxPerS * dt) / 1000;
      const x = p.x + Math.sin(now / 1300 + p.phase) * 4;
      if (p.leaving < 0 && Math.hypot(x - celesteX, p.y - celesteY) < FX.snowAvoidPx) {
        p.leaving = now;
      }
      const t = (now - p.bornMs) / p.lifeMs;
      let alpha = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI);
      if (p.leaving >= 0) {
        alpha *= Math.max(0, 1 - (now - p.leaving) / 250);
      }
      p.image
        .setVisible(alpha > 0)
        .setPosition(x, p.y)
        .setAlpha(alpha * 0.8)
        .setRotation(now / 900 + p.phase)
        .setScale((0.55 + 0.2 * Math.sin(now / 400 + p.phase)) / S);
    }
  }

  /** Frisson : un peu de poussière tombe du plafond, dans la vue. */
  private dropDust(view: Phaser.Geom.Rectangle): void {
    const now = this.scene.time.now;
    for (let i = 0; i < this.falling.length; i++) {
      const p = this.falling[this.nextFalling];
      this.nextFalling = (this.nextFalling + 1) % this.falling.length;
      if (!p) {
        continue;
      }
      p.x = view.x + this.rand() * view.width;
      p.y = view.y + this.rand() * 12;
      p.vx = (this.rand() - 0.5) * 6;
      p.vy = 10 + this.rand() * 20;
      p.bornMs = now + this.rand() * 300;
      p.lifeMs = 1600 + this.rand() * 900;
    }
  }

  private updateFalling(now: number, dt: number): void {
    for (const p of this.falling) {
      if (p.bornMs < 0 || now < p.bornMs) {
        p.image.setVisible(false);
        continue;
      }
      const t = (now - p.bornMs) / p.lifeMs;
      if (t >= 1) {
        p.bornMs = -1;
        p.image.setVisible(false);
        continue;
      }
      p.vy += (60 * dt) / 1000;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.image
        .setVisible(true)
        .setPosition(p.x, p.y)
        .setAlpha(0.8 * (1 - t));
    }
  }

  private particle(texture: string, depth: number, additive: boolean): Particle {
    const image = this.scene.add
      .image(0, 0, texture)
      .setScale(1 / S)
      .setDepth(depth)
      .setVisible(false);
    if (additive) {
      image.setBlendMode(Phaser.BlendModes.ADD);
    }
    return { image, x: 0, y: 0, vx: 0, vy: 0, bornMs: -1, lifeMs: 1, phase: 0, leaving: -1 };
  }

  /** Texture dessinée une fois (à l'échelle `S`), réutilisée ensuite. */
  private make(
    key: string,
    w: number,
    h: number,
    draw: (c: CanvasRenderingContext2D) => void,
  ): void {
    if (this.scene.textures.exists(key)) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * S);
    canvas.height = Math.ceil(h * S);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(S, S);
    draw(ctx);
    this.scene.textures.addCanvas(key, canvas);
  }

  /** Textures communes des effets. */
  private createTextures(): void {
    const make = this.make.bind(this);
    const radial = (ctx: CanvasRenderingContext2D, w: number, h: number, color: string) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(1, h / w);
      ctx.translate(-w / 2, -w / 2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
      ctx.restore();
    };
    make('fx-sparkle', 8, 8, (ctx) => {
      radial(ctx, 8, 8, 'rgba(120,255,230,0.5)');
      ctx.fillStyle = TURQUOISE;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 4 : 0.8;
        ctx.lineTo(4 + Math.cos(angle) * r, 4 + Math.sin(angle) * r);
      }
      ctx.fill();
    });
    make('fx-mote', 4, 4, (ctx) => {
      radial(ctx, 4, 4, 'rgba(150,255,235,0.9)');
    });
    // Lueurs blanches, teintées à la couleur des lampes de la palette.
    make('fx-glow', 64, 16, (ctx) => {
      radial(ctx, 64, 16, 'rgba(255,255,255,0.9)');
    });
    make('fx-halo', 64, 64, (ctx) => {
      radial(ctx, 64, 64, 'rgba(255,255,255,0.5)');
    });
    make('fx-dark', 4, 4, (ctx) => {
      ctx.fillStyle = '#05040a';
      ctx.fillRect(0, 0, 4, 4);
    });
    make('fx-hand', 2, 8, (ctx) => {
      ctx.fillStyle = TURQUOISE;
      ctx.fillRect(0.5, 0, 1, 8);
    });
    make('fx-curtain', 14, 64, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(0, 0, 14, 64, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(3 + i * 4, 2, 1, 60);
      }
    });
    make('fx-eyes', 12, 6, (ctx) => {
      for (const x of [3, 9]) {
        const g = ctx.createRadialGradient(x, 3, 0, x, 3, 3);
        g.addColorStop(0, 'rgba(174,252,240,1)');
        g.addColorStop(0.5, 'rgba(94,230,210,0.9)');
        g.addColorStop(1, 'rgba(94,230,210,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 3, 0, 6, 6);
      }
    });
    // Objets de la maison, en ombres au liseré turquoise.
    const shadow = '#1a2230';
    const rim = 'rgba(140,255,230,0.8)';
    const outlined = (ctx: CanvasRenderingContext2D, path: () => void) => {
      ctx.fillStyle = shadow;
      ctx.strokeStyle = rim;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      path();
      ctx.fill();
      ctx.stroke();
    };
    make('fx-book', 16, 12, (ctx) => {
      outlined(ctx, () => {
        ctx.roundRect(1, 2, 14, 9, 1);
      });
      ctx.fillStyle = rim;
      ctx.fillRect(8, 2, 0.8, 9);
    });
    make('fx-block', 12, 12, (ctx) => {
      outlined(ctx, () => {
        ctx.roundRect(1, 1, 10, 10, 2);
      });
      ctx.fillStyle = rim;
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', 6, 9);
    });
    make('fx-slipper', 16, 8, (ctx) => {
      outlined(ctx, () => {
        ctx.ellipse(8, 4.5, 7, 3, 0, 0, Math.PI * 2);
      });
    });
    make('fx-cup', 12, 12, (ctx) => {
      outlined(ctx, () => {
        ctx.roundRect(1, 2, 8, 9, [1, 1, 3, 3]);
      });
      ctx.strokeStyle = rim;
      ctx.beginPath();
      ctx.arc(9.5, 6, 2.2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    });
    make('fx-pencil', 20, 6, (ctx) => {
      outlined(ctx, () => {
        ctx.moveTo(1, 1.5);
        ctx.lineTo(15, 1.5);
        ctx.lineTo(19, 3);
        ctx.lineTo(15, 4.5);
        ctx.lineTo(1, 4.5);
        ctx.closePath();
      });
    });
    make('fx-bottle', 8, 14, (ctx) => {
      outlined(ctx, () => {
        ctx.roundRect(1, 4, 6, 9, 2);
        ctx.rect(2.5, 1, 3, 3);
      });
    });
  }
}
