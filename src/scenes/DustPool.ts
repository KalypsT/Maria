import type Phaser from 'phaser';
import { DUST_POOL_SIZE, type FeelParams } from '../config/feel';
import type { Box } from '../core/physics/gridCollision';
import { FeelEvent } from '../core/player/playerFeel';

const DUST_TEXTURE = 'dust-placeholder';
const DUST_COLOR = 0xcfc8e0;

interface Particle {
  image: Phaser.GameObjects.Image;
  bornMs: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Poussière de Céleste (visuel seulement) : un petit stock d'images créées une fois et réutilisées,
 * aucune création d'objet en jeu. Les particules les plus anciennes sont recyclées en premier.
 */
export class DustPool {
  private readonly particles: Particle[] = [];
  private next = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly params: Readonly<FeelParams>,
  ) {
    if (!scene.textures.exists(DUST_TEXTURE)) {
      const g = scene.make.graphics({}, false);
      g.fillStyle(DUST_COLOR);
      g.fillRect(0, 0, 3, 3);
      g.generateTexture(DUST_TEXTURE, 3, 3);
      g.destroy();
    }
    for (let i = 0; i < DUST_POOL_SIZE; i++) {
      const image = scene.add.image(0, 0, DUST_TEXTURE).setVisible(false).setDepth(9);
      this.particles.push({ image, bornMs: -1, x: 0, y: 0, vx: 0, vy: 0 });
    }
  }

  /** Émet la poussière d'un événement (`FeelEvent`) aux pieds de la hitbox ; `facing` : 1 ou -1. */
  emit(events: number, box: Box, facing: number): void {
    if (this.params.dustEnabled < 1 || events === FeelEvent.None) {
      return;
    }
    const speed = this.params.dustSpeed;
    if ((events & FeelEvent.Land) !== 0) {
      this.spawn(box, -speed, 0.3);
      this.spawn(box, speed, 0.3);
      this.spawn(box, -speed * 0.5, 0.6);
      this.spawn(box, speed * 0.5, 0.6);
    } else if ((events & FeelEvent.Takeoff) !== 0) {
      this.spawn(box, -speed * 0.6, 0.4);
      this.spawn(box, speed * 0.6, 0.4);
    }
    if ((events & FeelEvent.Turn) !== 0) {
      // Vers l'arrière du nouveau sens de course.
      this.spawn(box, -facing * speed, 0.5);
      this.spawn(box, -facing * speed * 0.6, 0.8);
    }
  }

  /** Met à jour l'affichage (une fois par image). */
  update(): void {
    const now = this.scene.time.now;
    const life = this.params.dustLifeMs;
    for (const particle of this.particles) {
      if (particle.bornMs < 0) {
        continue;
      }
      const age = now - particle.bornMs;
      if (age >= life || this.params.dustEnabled < 1) {
        particle.bornMs = -1;
        particle.image.setVisible(false);
        continue;
      }
      const t = age / 1000;
      const k = age / life;
      particle.image
        .setPosition(particle.x + particle.vx * t, particle.y + particle.vy * t)
        .setAlpha(1 - k)
        .setScale(1 - 0.5 * k);
    }
  }

  private spawn(box: Box, vx: number, lift: number): void {
    const particle = this.particles[this.next];
    this.next = (this.next + 1) % this.particles.length;
    if (!particle) {
      return;
    }
    particle.bornMs = this.scene.time.now;
    particle.x = box.x + box.width / 2 + (vx > 0 ? 3 : vx < 0 ? -3 : 0);
    particle.y = box.y + box.height - 1;
    particle.vx = vx;
    particle.vy = -this.params.dustSpeed * lift;
    particle.image.setVisible(true).setPosition(particle.x, particle.y).setAlpha(1).setScale(1);
  }
}
