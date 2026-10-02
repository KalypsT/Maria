import Phaser from 'phaser';
import {
  LUGGAGE_BOX,
  LuggagePhase,
  TrainPhase,
  cycleWarnProgress,
  luggageState,
} from '../config/combat';
import type { CombatWorld } from '../core/combat/CombatWorld';

const CASE_KEY = 'train-falling-case';
const ARCH_KEY = 'train-tunnel-arch';
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
    this.createTextures();
  }

  setArt(scale: number): void {
    if (scale === this.artScale) {
      return;
    }
    this.artScale = scale;
    this.createTextures();
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

  /** `viewW`, `viewH` : taille de la vue (px logiques), pour le voile du tunnel. */
  render(nowMs: number, viewW: number, viewH: number, zoom: number): void {
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
      let dx = 0;
      if (state.phase === LuggagePhase.Shake) {
        dx = Math.sin(nowMs / 35) * SHAKE_PX;
      }
      image
        .setPosition(drop.x + LUGGAGE_BOX.width / 2 + dx, drop.y + state.fallen)
        .setAlpha(state.phase === LuggagePhase.Lie ? 0.75 : 1)
        .setAngle(state.phase === LuggagePhase.Lie ? 8 : 0);
    }
    if (combat.tunnelRow < 0) {
      return;
    }
    // Le voile couvre l'écran (coordonnées de l'écran : zoom compris).
    const w = viewW * zoom;
    const h = viewH * zoom;
    this.veil.setSize(w, h);
    const phase = combat.tunnelPhase;
    const warn = cycleWarnProgress(ms, p.tunnelPeriodMs, p.tunnelWarnMs, p.tunnelPassMs);
    if (phase === TrainPhase.Passing) {
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
      // À l'approche : l'image s'assombrit peu à peu (la bouche du tunnel arrive).
      this.veil.setVisible(true).setFillStyle(0x05060f, TUNNEL_DARK * warn * warn);
    } else {
      this.veil.setVisible(false);
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
