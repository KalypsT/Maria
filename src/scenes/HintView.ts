import type Phaser from 'phaser';
import { HINT, HINT_LOOK } from '../config/hint';
import { HintStage } from '../core/hint/hint';

/** Échelle de dessin de la lueur (celle de l'écran au plus, D-18). */
const S = 3;
const GLOW = 'hint-glow';
const DOT = 'hint-dot';
/** Au-dessus de Céleste et du décor : la lueur doit se voir. */
const DEPTH = 12;
/** La lueur part d'un peu au-dessus de la tête de Céleste (px). */
const START_ABOVE_PX = 10;
/** Petite oscillation de luciole, de part et d'autre du trajet (px, période en ms). */
const WOBBLE_PX = 3;
const WOBBLE_MS = 700;
/** Pause entre deux trajets du second palier (ms). */
const LEAD_PAUSE_MS = 1000;

/** Trajet de la lueur : éteinte, en vol, ou qui attend au but. */
const Flight = { Off: 0, Flying: 1, Waiting: 2 } as const;
type Flight = (typeof Flight)[keyof typeof Flight];

/**
 * La lueur du fil discret (D-129) : un cœur doré dans un halo turquoise, une petite traînée, qui
 * part de Céleste vers le but. Premier palier : un court trajet dans la bonne direction, de temps en
 * temps. Second palier : jusqu'au but (la sortie à prendre, ou le but dans la salle), où elle
 * attend en battant doucement, puis repart de Céleste. Aucune création d'objet en jeu.
 */
export class HintView {
  private readonly glow: Phaser.GameObjects.Image;
  private readonly dots: Phaser.GameObjects.Image[] = [];
  /** Positions passées de la lueur (anneau), pour la traînée. */
  private readonly trailX = new Float64Array(HINT_LOOK.trailDots);
  private readonly trailY = new Float64Array(HINT_LOOK.trailDots);
  private trailNext = 0;
  private trailAtMs = 0;
  private flight: Flight = Flight.Off;
  private flightStartMs = 0;
  private nextFlightMs = 0;
  private fromX = 0;
  private fromY = 0;
  private toX = 0;
  private toY = 0;
  private length = 0;
  private x = 0;
  private y = 0;
  private alpha = 0;
  private stage: HintStage = HintStage.None;

  constructor(scene: Phaser.Scene) {
    createTextures(scene);
    for (let i = 0; i < HINT_LOOK.trailDots; i++) {
      this.dots.push(scene.add.image(0, 0, DOT).setDepth(DEPTH).setVisible(false));
    }
    this.glow = scene.add.image(0, 0, GLOW).setDepth(DEPTH).setVisible(false);
  }

  /** Éteinte aussitôt (changement de salle, réapparition). */
  reset(): void {
    this.flight = Flight.Off;
    this.alpha = 0;
    this.nextFlightMs = 0;
    this.hide();
  }

  /**
   * Une image : `stage` le palier, (celesteX, celesteY) le haut de Céleste, `hasTarget` et
   * (targetX, targetY) le point à montrer (px du monde).
   */
  update(
    nowMs: number,
    stage: HintStage,
    celesteX: number,
    celesteY: number,
    hasTarget: boolean,
    targetX: number,
    targetY: number,
  ): void {
    if (stage === HintStage.None || !hasTarget) {
      if (this.flight !== Flight.Off) {
        this.flight = Flight.Off;
        this.hide();
      }
      this.stage = stage;
      return;
    }
    if (stage !== this.stage) {
      // Nouveau palier : un trajet tout de suite.
      this.stage = stage;
      this.flight = Flight.Off;
      this.nextFlightMs = nowMs;
    }
    if (this.flight === Flight.Off) {
      if (nowMs < this.nextFlightMs) {
        return;
      }
      this.start(nowMs, celesteX, celesteY - START_ABOVE_PX, targetX, targetY);
    } else if (
      this.stage === HintStage.Lead &&
      (Math.abs(targetX - this.toX) > 1 || Math.abs(targetY - this.toY) > 1)
    ) {
      // Le but a changé (une autre sortie) : la lueur y va depuis là où elle est.
      this.start(nowMs, this.x, this.y, targetX, targetY);
    }
    this.advance(nowMs);
    this.draw(nowMs);
  }

  private start(
    nowMs: number,
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
  ): void {
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const distance = Math.hypot(dx, dy);
    // Premier palier : seulement un bout du chemin, dans la bonne direction.
    const reach =
      this.stage === HintStage.Glimpse ? Math.min(distance, HINT.glimpseDistancePx) : distance;
    const k = distance > 0 ? reach / distance : 0;
    this.fromX = this.x = fromX;
    this.fromY = this.y = fromY;
    this.toX = fromX + dx * k;
    this.toY = fromY + dy * k;
    this.length = reach;
    this.flight = Flight.Flying;
    this.flightStartMs = nowMs;
    this.trailX.fill(fromX);
    this.trailY.fill(fromY);
    this.trailAtMs = nowMs;
  }

  private advance(nowMs: number): void {
    const elapsed = nowMs - this.flightStartMs;
    const flyMs = (this.length / HINT.speedPxPerS) * 1000;
    const fade = HINT_LOOK.fadeMs;
    if (this.flight === Flight.Flying) {
      const t = flyMs > 0 ? Math.min(1, elapsed / flyMs) : 1;
      const ux = this.length > 0 ? (this.toX - this.fromX) / this.length : 0;
      const uy = this.length > 0 ? (this.toY - this.fromY) / this.length : 0;
      const wobble = Math.sin((elapsed / WOBBLE_MS) * Math.PI * 2) * WOBBLE_PX * (1 - t);
      this.x = this.fromX + (this.toX - this.fromX) * t - uy * wobble;
      this.y = this.fromY + (this.toY - this.fromY) * t + ux * wobble;
      this.alpha = Math.min(1, elapsed / fade);
      if (t >= 1) {
        if (this.stage === HintStage.Lead) {
          this.flight = Flight.Waiting;
          this.flightStartMs = nowMs;
        } else {
          // Premier palier : elle s'éteint au bout de son court trajet.
          this.alpha = 0;
          this.flight = Flight.Off;
          this.nextFlightMs = nowMs + HINT.glimpseEveryMs;
        }
      } else if (this.stage === HintStage.Glimpse) {
        this.alpha = Math.min(this.alpha, Math.min(1, (flyMs - elapsed) / fade));
      }
    } else if (this.flight === Flight.Waiting) {
      const wait = HINT.leadWaitMs;
      this.x = this.toX;
      this.y = this.toY;
      this.alpha = Math.min(1, Math.max(0, (wait - elapsed) / fade));
      if (elapsed >= wait) {
        this.flight = Flight.Off;
        this.nextFlightMs = nowMs + LEAD_PAUSE_MS;
      }
    }
    if (nowMs - this.trailAtMs >= HINT_LOOK.trailSpacingMs) {
      this.trailAtMs = nowMs;
      this.trailX[this.trailNext] = this.x;
      this.trailY[this.trailNext] = this.y;
      this.trailNext = (this.trailNext + 1) % HINT_LOOK.trailDots;
    }
  }

  private draw(nowMs: number): void {
    if (this.flight === Flight.Off || this.alpha <= 0) {
      this.hide();
      return;
    }
    const pulse = 1 + HINT_LOOK.pulse * Math.sin((nowMs / HINT_LOOK.pulseMs) * Math.PI * 2);
    this.glow
      .setVisible(true)
      .setPosition(this.x, this.y)
      .setAlpha(this.alpha)
      .setScale(pulse / S);
    const count = HINT_LOOK.trailDots;
    for (let i = 0; i < count; i++) {
      // Du plus récent au plus ancien : de plus en plus petit et pâle.
      const slot = (this.trailNext - 1 - i + count * 2) % count;
      const age = (i + 1) / (count + 1);
      const dot = this.dots[i];
      dot
        ?.setVisible(this.flight === Flight.Flying)
        .setPosition(this.trailX[slot] ?? this.x, this.trailY[slot] ?? this.y)
        .setAlpha(this.alpha * (1 - age) * 0.8)
        .setScale((1 - age * 0.5) / S);
    }
  }

  private hide(): void {
    this.glow.setVisible(false);
    for (const dot of this.dots) {
      dot.setVisible(false);
    }
  }
}

/** La lueur et les points de la traînée, dessinés une fois à l'échelle `S`. */
function createTextures(scene: Phaser.Scene): void {
  const make = (key: string, size: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.ceil(size * S);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(S, S);
    draw(ctx);
    scene.textures.addCanvas(key, canvas);
  };
  const size = HINT_LOOK.sizePx;
  make(GLOW, size, (ctx) => {
    const c = size / 2;
    // Halo turquoise (le monde étrange) autour d'un cœur doré : ni l'étincelle crème d'Agir, ni
    // les scintillements turquoise, ni les trouvailles roses.
    const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
    halo.addColorStop(0, HINT_LOOK.coreColor);
    halo.addColorStop(0.35, HINT_LOOK.coreColor);
    halo.addColorStop(0.55, HINT_LOOK.haloColor);
    halo.addColorStop(1, 'rgba(127, 240, 220, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, size, size);
    // Une petite croix de lumière, plus longue à la verticale.
    ctx.fillStyle = 'rgba(255, 255, 240, 0.9)';
    ctx.beginPath();
    ctx.moveTo(c, c - c * 0.95);
    ctx.lineTo(c + 0.6, c);
    ctx.lineTo(c, c + c * 0.95);
    ctx.lineTo(c - 0.6, c);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(c - c * 0.7, c);
    ctx.lineTo(c, c - 0.6);
    ctx.lineTo(c + c * 0.7, c);
    ctx.lineTo(c, c + 0.6);
    ctx.closePath();
    ctx.fill();
  });
  make(DOT, 4, (ctx) => {
    const g = ctx.createRadialGradient(2, 2, 0, 2, 2, 2);
    g.addColorStop(0, 'rgba(255, 243, 196, 0.9)');
    g.addColorStop(0.5, 'rgba(127, 240, 220, 0.6)');
    g.addColorStop(1, 'rgba(127, 240, 220, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 4);
  });
}
