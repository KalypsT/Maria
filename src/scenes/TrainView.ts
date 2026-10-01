import Phaser from 'phaser';
import {
  TRAIN_GUST_TILES,
  TRAIN_LENGTH_PX,
  TrainPhase,
  trainLeft,
  trainPhase,
  trainProgress,
} from '../config/combat';
import { TILE_SIZE as T } from '../config/display';
import type { CombatWorld } from '../core/combat/CombatWorld';

const TRAIN = 'train-placeholder';
const SIGNAL_ON = 'train-signal-on';
/** Trois voitures (px logiques). */
const CARS = 3;
const TRAIN_W = TRAIN_LENGTH_PX;
const CAR_W = TRAIN_W / CARS;
const TRAIN_H = TRAIN_GUST_TILES * T;
/** Clignotement du feu pendant l'annonce (ms). */
const BLINK_MS = 400;

/**
 * Trains de la gare (D-66), PLACEHOLDER dessiné par le code : un train de voyageurs qui traverse la
 * salle sur sa voie, et les feux (`; @decor: signal …`) qui clignotent pour l'annoncer, puis
 * restent allumés pendant son passage. Le train passe derrière Céleste ; seul son souffle compte
 * (CombatWorld). Une image par train et par feu, créées au chargement de la salle.
 */
export class TrainView {
  private trains: Phaser.GameObjects.Image[] = [];
  private signals: Phaser.GameObjects.Image[] = [];
  private artScale = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly combat: CombatWorld,
  ) {
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

  /** Recrée les trains et les feux de la salle (changement de salle). */
  rebuild(): void {
    for (const image of [...this.trains, ...this.signals]) {
      image.destroy();
    }
    const level = this.combat.room;
    const inverse = 1 / this.artScale;
    this.trains = level.trains.map((train) =>
      this.scene.add
        .image(0, train.row * T, TRAIN)
        .setOrigin(0, 1)
        .setScale(inverse)
        .setFlipX(train.dir < 0)
        .setDepth(3)
        .setVisible(false),
    );
    this.signals = level.decor
      .filter((d) => d.kind === 'signal')
      .map((d) =>
        this.scene.add
          .image((d.col + 0.5) * T, d.row * T + 5, SIGNAL_ON)
          .setScale(inverse)
          .setDepth(3)
          .setVisible(false),
      );
  }

  render(): void {
    const combat = this.combat;
    const trains = combat.room.trains;
    if (trains.length === 0) {
      return;
    }
    const ms = combat.trainMs;
    let warning = false;
    let passing = false;
    for (let i = 0; i < trains.length; i++) {
      const train = trains[i];
      const image = this.trains[i];
      if (!train || !image) {
        continue;
      }
      const offset = combat.trainOffsetMs(i);
      const phase = trainPhase(ms, offset, combat.settings);
      warning ||= phase === TrainPhase.Warning;
      passing ||= phase === TrainPhase.Passing;
      const progress = trainProgress(ms, offset, combat.settings);
      image.setVisible(progress >= 0);
      if (progress >= 0) {
        image.setX(trainLeft(progress, combat.room.width * T, train.dir));
      }
    }
    const lit = passing || (warning && Math.floor(ms / BLINK_MS) % 2 === 0);
    for (const signal of this.signals) {
      signal.setVisible(lit);
    }
  }

  private createTextures(): void {
    const textures = this.scene.textures;
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
      if (textures.exists(key)) {
        textures.remove(key);
      }
      textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    };
    make(TRAIN, TRAIN_W, TRAIN_H, (ctx) => {
      // Trois voitures bleu et crème, fenêtres éclairées, roues ; la première arrondie (vers la
      // droite : le train va vers la droite, retourné sinon).
      for (let k = 0; k < CARS; k++) {
        const x = k * CAR_W + 1;
        const w = CAR_W - 2;
        const front = k === CARS - 1;
        ctx.fillStyle = '#3d5f8f';
        ctx.beginPath();
        ctx.roundRect(x, 4, w, TRAIN_H - 10, front ? [3, 14, 6, 3] : 3);
        ctx.fill();
        ctx.fillStyle = '#efe6d2';
        ctx.fillRect(x, TRAIN_H - 16, w - (front ? 4 : 0), 4);
        ctx.fillStyle = '#ffe6a8';
        for (let wx = x + 6; wx < x + w - 14; wx += 12) {
          ctx.fillRect(wx, 10, 8, 9);
        }
        if (front) {
          ctx.fillStyle = '#bcdcee';
          ctx.fillRect(x + w - 12, 9, 9, 10);
        }
        ctx.fillStyle = '#2a2436';
        for (const wx of [x + 12, x + 24, x + w - 24, x + w - 12]) {
          ctx.beginPath();
          ctx.arc(wx, TRAIN_H - 5, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    make(SIGNAL_ON, 8, 8, (ctx) => {
      const halo = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
      halo.addColorStop(0, 'rgba(255,90,70,1)');
      halo.addColorStop(0.5, 'rgba(255,90,70,0.8)');
      halo.addColorStop(1, 'rgba(255,90,70,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 8, 8);
    });
  }
}
