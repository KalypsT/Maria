import Phaser from 'phaser';
import {
  LUGGAGE_BOX,
  LuggagePhase,
  TUNNEL_CLEAR_PX,
  TUNNEL_VIEW,
  TrainPhase,
  cycleWarnProgress,
  luggageState,
} from '../config/combat';
import { TILE_SIZE as T } from '../config/display';
import type { CombatWorld } from '../core/combat/CombatWorld';
import type { TunnelShelter } from '../core/combat/tunnelShelters';

const CASE_KEY = 'train-falling-case';
const ARCH_KEY = 'train-tunnel-arch';
const GLOW_KEY = 'train-shelter-glow';
/** Au-dessus de Céleste (10) et des bulles (12) : le tunnel couvre tout, sauf l'interface. */
const TUNNEL_DEPTH = 14;
/** Valises : derrière Céleste, devant le décor. */
const CASE_DEPTH = 6;
/** Tremblement d'une valise sur son filet (px) et sa vitesse. */
const SHAKE_PX = 1.4;
/** Obscurité dans le tunnel, et pendant l'annonce au plus fort. */
const TUNNEL_DARK = 0.5;
const ARCH_SPACING = 120;

/**
 * Le train en route (D-86), PLACEHOLDER dessiné par le code : les valises qui tremblent sur leur
 * filet puis tombent dans les virages, et les tunnels du toit (l'image s'assombrit à l'approche,
 * puis des arches défilent dans le noir). Purement visuel : les dangers sont dans `CombatWorld`.
 */
export class TrainRideView {
  private cases: Phaser.GameObjects.Image[] = [];
  private readonly veil: Phaser.GameObjects.Rectangle;
  private readonly arches: Phaser.GameObjects.Image[] = [];
  /**
   * La bouche du tunnel pendant l'annonce (D-164) : la paroi au-dessus de la ligne du toit, son
   * front de pierre, et le noir dedans, sous la voûte ; elle arrive de l'avant jusqu'à Céleste.
   */
  private readonly mouthWall: Phaser.GameObjects.Rectangle;
  private readonly mouthInside: Phaser.GameObjects.Rectangle;
  private readonly mouthFace: Phaser.GameObjects.Image;
  /** Les abris du toit (D-164), éclairés pendant l'annonce et dans le tunnel. */
  private glows: Phaser.GameObjects.Image[] = [];
  private shelters: readonly TunnelShelter[] = [];
  private artScale = 1;
  private readonly state = { phase: LuggagePhase.Rack as LuggagePhase, fallen: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly combat: CombatWorld,
  ) {
    this.veil = scene.add
      .rectangle(0, 0, 10, 10, 0x05060f, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(TUNNEL_DEPTH)
      .setVisible(false);
    this.mouthWall = scene.add
      .rectangle(0, 0, 10, 10, TUNNEL_VIEW.wallColor, 1)
      .setOrigin(0, 0)
      .setDepth(TUNNEL_DEPTH)
      .setVisible(false);
    this.mouthInside = scene.add
      .rectangle(0, 0, 10, 10, 0x05060f, TUNNEL_VIEW.insideDark)
      .setOrigin(0, 0)
      .setDepth(TUNNEL_DEPTH)
      .setVisible(false);
    this.createTextures();
    this.mouthFace = scene.add
      .image(0, 0, ARCH_KEY)
      .setOrigin(1, 0)
      .setDepth(TUNNEL_DEPTH + 0.05)
      .setVisible(false);
  }

  /** Les abris du toit de la salle (D-164), après `rebuild`. */
  setShelters(shelters: readonly TunnelShelter[]): void {
    for (const glow of this.glows) {
      glow.destroy();
    }
    this.shelters = shelters;
    this.glows = shelters.map((shelter) =>
      this.scene.add
        .image(shelter.col0 * T, shelter.row * T, GLOW_KEY)
        .setOrigin(0, 1)
        .setDisplaySize((shelter.col1 - shelter.col0 + 1) * T, TUNNEL_VIEW.glowTiles * T)
        .setDepth(TUNNEL_DEPTH + 0.2)
        .setVisible(false),
    );
  }

  setArt(scale: number): void {
    if (scale === this.artScale) {
      return;
    }
    this.artScale = scale;
    this.createTextures();
    // Les textures sont recréées : la bouche les reprend, les lueurs sont recréées.
    this.mouthFace.setTexture(ARCH_KEY);
    this.setShelters(this.shelters);
    this.rebuild();
  }

  /** Recrée les valises de la salle (changement de salle). */
  rebuild(): void {
    for (const image of this.cases) {
      image.destroy();
    }
    for (const arch of this.arches) {
      arch.destroy();
    }
    this.arches.length = 0;
    const inverse = 1 / this.artScale;
    this.cases = this.combat.luggage.map((drop) =>
      this.scene.add
        .image(drop.x + LUGGAGE_BOX.width / 2, drop.y, CASE_KEY)
        .setOrigin(0.5, 1)
        .setScale(inverse)
        .setDepth(CASE_DEPTH),
    );
    if (this.combat.tunnelRow >= 0) {
      for (let i = 0; i < 9; i++) {
        this.arches.push(
          this.scene.add
            .image(0, 0, ARCH_KEY)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setScale(inverse)
            .setDepth(TUNNEL_DEPTH + 0.1)
            .setVisible(false),
        );
      }
    }
    this.veil.setVisible(false);
  }

  /**
   * `viewW`, `viewH` : taille de la vue (px logiques), pour le voile du tunnel ; `left`, `top` : son
   * coin dans le monde ; `celesteX` : où la bouche du tunnel arrive à la fin de l'annonce.
   */
  render(
    nowMs: number,
    viewW: number,
    viewH: number,
    zoom: number,
    left: number,
    top: number,
    celesteX: number,
  ): void {
    const combat = this.combat;
    const ms = combat.hazardMs;
    const p = combat.settings;
    for (let i = 0; i < this.cases.length; i++) {
      const image = this.cases[i];
      const drop = combat.luggage[i];
      if (!image || !drop) {
        continue;
      }
      const state = this.state;
      luggageState(ms, i, combat.luggage.length, drop.dropPx, p, state);
      if (combat.still) {
        // Le train arrêté (D-90) : la valise reste posée sur son filet.
        image
          .setPosition(drop.x + LUGGAGE_BOX.width / 2, drop.y)
          .setAlpha(1)
          .setAngle(0);
        continue;
      }
      let dx = 0;
      if (state.phase === LuggagePhase.Shake) {
        dx = Math.sin(nowMs / 35) * SHAKE_PX;
      }
      image
        .setPosition(drop.x + LUGGAGE_BOX.width / 2 + dx, drop.y + state.fallen)
        .setAlpha(state.phase === LuggagePhase.Lie ? 0.75 : 1)
        .setAngle(state.phase === LuggagePhase.Lie ? 8 : 0);
    }
    if (combat.tunnelRow < 0 || combat.still) {
      this.veil.setVisible(false);
      for (const arch of this.arches) {
        arch.setVisible(false);
      }
      this.showMouth(false);
      this.showGlows(0);
      return;
    }
    // Le voile couvre l'écran (coordonnées de l'écran : zoom compris).
    const w = viewW * zoom;
    const h = viewH * zoom;
    this.veil.setSize(w, h);
    const phase = combat.tunnelPhase;
    const warn = cycleWarnProgress(ms, p.tunnelPeriodMs, p.tunnelWarnMs, p.tunnelPassMs);
    if (phase === TrainPhase.Passing) {
      this.showMouth(false);
      // Dans le noir, les abris restent éclairés.
      this.showGlows(TUNNEL_VIEW.glowPassAlpha);
      this.veil.setVisible(true).setFillStyle(0x05060f, TUNNEL_DARK);
      // Les arches de la voûte défilent vite, d'avant en arrière.
      const shift = ((nowMs * 0.9) % ARCH_SPACING) / ARCH_SPACING;
      this.arches.forEach((arch, k) => {
        arch
          .setVisible(true)
          .setPosition((k - shift) * ARCH_SPACING * zoom, 0)
          .setDisplaySize(26 * zoom, h);
      });
      return;
    }
    for (const arch of this.arches) {
      arch.setVisible(false);
    }
    if (warn >= 0) {
      // À l'approche (D-164) : la bouche du tunnel arrive de l'avant, sa voûte au ras du toit, jusqu'à
      // Céleste à la fin de l'annonce ; les abris s'éclairent en battant ; l'image s'assombrit un peu.
      const ceiling = combat.tunnelRow * T - TUNNEL_CLEAR_PX;
      const far = left + viewW + TUNNEL_VIEW.startBeyondPx;
      const edge = celesteX + (far - celesteX) * (1 - warn);
      const right = left + viewW + T;
      const bottom = top + viewH + T;
      this.mouthWall
        .setVisible(edge < right)
        .setPosition(edge, top - T)
        .setSize(Math.max(0, right - edge), Math.max(0, ceiling - top + T));
      this.mouthInside
        .setVisible(edge < right)
        .setPosition(edge, ceiling)
        .setSize(Math.max(0, right - edge), Math.max(0, bottom - ceiling));
      this.mouthFace
        .setVisible(edge < right)
        .setPosition(edge + TUNNEL_VIEW.faceOverlapPx, top - T)
        .setDisplaySize(TUNNEL_VIEW.faceWidthPx, Math.max(1, ceiling - top + T));
      const beat = 0.5 + 0.5 * Math.sin(nowMs / TUNNEL_VIEW.glowBeatMs);
      this.showGlows(Math.min(1, warn * 3) * (TUNNEL_VIEW.glowMin + TUNNEL_VIEW.glowSwing * beat));
      this.veil.setVisible(true).setFillStyle(0x05060f, TUNNEL_VIEW.warnDark * warn * warn);
    } else {
      this.veil.setVisible(false);
      this.showMouth(false);
      this.showGlows(0);
    }
  }

  private showMouth(visible: boolean): void {
    this.mouthWall.setVisible(visible);
    this.mouthInside.setVisible(visible);
    this.mouthFace.setVisible(visible);
  }

  /** Les abris éclairés (alpha), ou éteints (0). */
  private showGlows(alpha: number): void {
    for (const glow of this.glows) {
      glow.setVisible(alpha > 0).setAlpha(alpha);
    }
  }

  private createTextures(): void {
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
      const textures = this.scene.textures;
      if (textures.exists(key)) {
        textures.remove(key);
      }
      textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    };
    make(CASE_KEY, LUGGAGE_BOX.width, LUGGAGE_BOX.height + 3, (ctx) => {
      // Une petite valise rouge, sa poignée et ses coins.
      ctx.fillStyle = '#5a3a2a';
      ctx.fillRect(5, 0, 4, 3);
      ctx.fillStyle = '#c8574a';
      ctx.beginPath();
      ctx.roundRect(0, 3, LUGGAGE_BOX.width, LUGGAGE_BOX.height, 2);
      ctx.fill();
      ctx.fillStyle = '#e07a6c';
      ctx.fillRect(1, 4, LUGGAGE_BOX.width - 2, 1.5);
      ctx.fillStyle = '#f1e7c4';
      ctx.fillRect(3, 3, 1.5, LUGGAGE_BOX.height);
      ctx.fillRect(LUGGAGE_BOX.width - 4.5, 3, 1.5, LUGGAGE_BOX.height);
    });
    make(GLOW_KEY, 16, 32, (ctx) => {
      // La lumière d'un abri (D-164) : chaude au fond du creux, qui s'efface vers le haut.
      const g = ctx.createLinearGradient(0, 32, 0, 0);
      g.addColorStop(0, 'rgba(255, 214, 128, 0.95)');
      g.addColorStop(0.55, 'rgba(255, 214, 128, 0.45)');
      g.addColorStop(1, 'rgba(255, 214, 128, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 16, 32);
    });
    make(ARCH_KEY, 26, 64, (ctx) => {
      // Un anneau de la voûte, vu de côté : une bande de pierres sombres.
      ctx.fillStyle = 'rgba(30,26,34,0.85)';
      ctx.fillRect(0, 0, 26, 64);
      ctx.fillStyle = 'rgba(70,62,72,0.6)';
      for (let y = 2; y < 64; y += 8) {
        ctx.fillRect(2, y, 22, 5);
      }
    });
  }
}
