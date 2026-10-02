import type Phaser from 'phaser';
import { DUST_POOL_SIZE, type FeelParams } from '../config/feel';
import type { Box } from '../core/physics/gridCollision';
import { FeelEvent } from '../core/player/playerFeel';

const DUST_TEXTURE = 'dust-placeholder';
const DUST_COLOR = 0xcfc8e0;
/** Gouttes d'un éclaboussement (D-97), PLACEHOLDER. */
const SPLASH_COLOR = 0xbfe6ec;
const SPLASH_DROPS = 8;
const SPLASH_SPEED = 90;

interface Particle {
  image: Phaser.GameObjects.Image;
  bornMs: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Éclat d'ennemi : affiché même si la poussière de Céleste est désactivée. */
  forced: boolean;
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
      this.particles.push({ image, bornMs: -1, x: 0, y: 0, vx: 0, vy: 0, forced: false });
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

  /**
   * Éclat en étoile au centre d'une hitbox (ennemi dispersé, D-20) : indépendant du réglage de la
   * poussière, qui ne concerne que Céleste.
   */
  burst(box: Box): void {
    const speed = 70;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = this.take();
      particle.bornMs = this.scene.time.now;
      particle.x = cx;
      particle.y = cy;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.forced = true;
      particle.image.setVisible(true).setPosition(cx, cy).setAlpha(1).setScale(1).clearTint();
    }
  }

  /** Éclaboussement (D-97) : des gouttes en gerbe, aux pieds de la hitbox, toujours affichées. */
  splash(box: Box): void {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height;
    for (let i = 0; i < SPLASH_DROPS; i++) {
      // Une gerbe vers le haut, de -70° à +70° autour de la verticale.
      const angle = -Math.PI / 2 + ((i / (SPLASH_DROPS - 1)) * 2 - 1) * 1.2;
      const speed = SPLASH_SPEED * (0.6 + 0.4 * ((i * 7) % 5) * 0.25);
      const particle = this.take();
      particle.bornMs = this.scene.time.now;
      particle.x = cx;
      particle.y = cy;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.forced = true;
      particle.image
        .setVisible(true)
        .setPosition(cx, cy)
        .setAlpha(1)
        .setScale(1)
        .setTint(SPLASH_COLOR);
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
      if (age >= life || (this.params.dustEnabled < 1 && !particle.forced)) {
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

  /** Particule suivante du stock (la plus ancienne est recyclée). */
  private take(): Particle {
    const particle = this.particles[this.next];
    this.next = (this.next + 1) % this.particles.length;
    if (!particle) {
      throw new Error('Stock de particules vide');
    }
    return particle;
  }

  private spawn(box: Box, vx: number, lift: number): void {
    const particle = this.take();
    particle.forced = false;
    particle.bornMs = this.scene.time.now;
    particle.x = box.x + box.width / 2 + (vx > 0 ? 3 : vx < 0 ? -3 : 0);
    particle.y = box.y + box.height - 1;
    particle.vx = vx;
    particle.vy = -this.params.dustSpeed * lift;
    particle.image
      .setVisible(true)
      .setPosition(particle.x, particle.y)
      .setAlpha(1)
      .setScale(1)
      .clearTint();
  }
}
