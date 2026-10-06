import type Phaser from 'phaser';
import {
  DUST_LAND_COUNT,
  DUST_LOOK,
  DUST_POOL_SIZE,
  STRANGE_DUST_COLORS,
  type DustLook,
  type DustShape,
  type FeelParams,
} from '../config/feel';
import type { Surface } from '../config/surfaces';
import type { Box } from '../core/physics/gridCollision';
import { FeelEvent } from '../core/player/playerFeel';

/** Échelle de dessin des grains (celle de l'écran au plus, D-18). */
const S = 3;
/** Formes orientées dessinées d'avance sous trois angles : pas de rotation à l'affichage (D-73). */
const VARIANTS = 3;
const PUFF = 'dust-puff';
const GRAIN = 'dust-grain';
/** Le nuage dessiné fait 8 px ; affiché plus petit, il grossit en s'effaçant. */
const PUFF_SCALE = 0.7;
/** Un nuage est plus léger qu'un grain. */
const PUFF_ALPHA = 0.6;
/** Freinage horizontal des grains (1/s) : ils s'arrêtent au lieu de glisser. */
const DRAG = 2.5;
/** Les grains partent du bord des pieds (px du milieu), pas de derrière Céleste. */
const FEET_HALF = 5;
/** Opacité de départ d'un grain. */
const ALPHA = 0.9;
/** Éclat d'un ennemi dispersé (D-20) et gouttes d'un éclaboussement (D-97), PLACEHOLDERS. */
const BURST_COLOR = 0xcfc8e0;
const SPLASH_COLOR = 0xbfe6ec;
const SPLASH_DROPS = 8;
const SPLASH_SPEED = 90;
const SPLASH_GRAVITY = 260;

interface Particle {
  image: Phaser.GameObjects.Image;
  bornMs: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Pesanteur (px/s²), et sol sur lequel un grain qui retombe se pose (px). */
  gravity: number;
  floorY: number;
  /** Échelle de départ ; un nuage grossit en s'effaçant, un grain rapetisse. */
  scale: number;
  grows: boolean;
  /** Opacité de départ. */
  alpha: number;
  /** Éclat d'ennemi ou goutte : affiché même si la poussière de Céleste est désactivée. */
  forced: boolean;
}

/**
 * Poussière de Céleste (visuel seulement, D-125) : des grains en papier selon la matière du sol
 * (copeaux, peluches, brins d'herbe, grains de sable, feuilles), aux couleurs du monde étrange
 * dans le monde étrange. Un petit stock d'images créées une fois et réutilisées, aucune création
 * d'objet en jeu ; les plus anciennes sont recyclées en premier.
 */
export class DustPool {
  private readonly particles: Particle[] = [];
  private next = 0;
  /** Hasard déterministe (aucune allocation) pour varier les grains. */
  private seed = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly params: Readonly<FeelParams>,
  ) {
    createTextures(scene);
    for (let i = 0; i < DUST_POOL_SIZE; i++) {
      const image = scene.add.image(0, 0, PUFF).setVisible(false).setDepth(9);
      this.particles.push({
        image,
        bornMs: -1,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        gravity: 0,
        floorY: 0,
        scale: 1,
        grows: false,
        alpha: ALPHA,
        forced: false,
      });
    }
  }

  /**
   * Émet la poussière d'un événement (`FeelEvent`) aux pieds de la hitbox, selon la matière du sol ;
   * `facing` : 1 ou -1 ; `impact` : vitesse de chute à la réception, en part de la vitesse maximale.
   */
  emit(
    events: number,
    box: Box,
    facing: number,
    surface: Surface,
    strange: boolean,
    impact: number,
  ): void {
    if (this.params.dustEnabled < 1 || events === FeelEvent.None) {
      return;
    }
    const look = DUST_LOOK[surface];
    const colors = strange ? STRANGE_DUST_COLORS : look.colors;
    const speed = this.params.dustSpeed;
    if ((events & FeelEvent.Land) !== 0) {
      const strength = 1 + Math.min(1, Math.max(0, impact));
      const count = Math.max(2, Math.round(DUST_LAND_COUNT * look.amount * strength));
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        this.spawn(box, side * speed * (0.7 + 0.6 * this.random()), look, colors[i % 2] ?? 0);
      }
    } else if ((events & FeelEvent.Takeoff) !== 0) {
      const count = Math.max(1, Math.round(2 * look.amount));
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        this.spawn(box, side * speed * (0.5 + 0.4 * this.random()), look, colors[i % 2] ?? 0);
      }
    }
    if ((events & FeelEvent.Turn) !== 0) {
      // Vers l'arrière du nouveau sens de course.
      const count = Math.max(1, Math.round(2 * look.amount));
      for (let i = 0; i < count; i++) {
        this.spawn(box, -facing * speed * (0.6 + 0.4 * this.random()), look, colors[i % 2] ?? 0);
      }
    }
  }

  /**
   * Éclat en étoile au centre d'une hitbox (ennemi dispersé, D-20) : des bouts de papier, quel que
   * soit le réglage de la poussière, qui ne concerne que Céleste.
   */
  burst(box: Box): void {
    const speed = 70;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const vx = Math.cos(angle) * speed;
      this.forced(cx, cy, vx, Math.sin(angle) * speed, 0, chipKey(i), 1 / S, BURST_COLOR);
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
      this.forced(
        cx,
        cy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        SPLASH_GRAVITY,
        GRAIN,
        1.5 / S,
        SPLASH_COLOR,
      );
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
      let y = particle.y + particle.vy * t + 0.5 * particle.gravity * t * t;
      if (particle.gravity > 0 && y > particle.floorY) {
        y = particle.floorY;
      }
      particle.image
        .setPosition(particle.x + (particle.vx * (1 - Math.exp(-DRAG * t))) / DRAG, y)
        .setAlpha(particle.alpha * (1 - k))
        .setScale(particle.scale * (particle.grows ? 1 + 0.9 * k : 1 - 0.4 * k));
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

  private random(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  private spawn(box: Box, vx: number, look: DustLook, color: number): void {
    const particle = this.take();
    const puff = look.shape === 'puff';
    const feetY = box.y + box.height;
    particle.forced = false;
    particle.bornMs = this.scene.time.now;
    particle.x = box.x + box.width / 2 + (vx > 0 ? FEET_HALF : vx < 0 ? -FEET_HALF : 0);
    particle.y = feetY - 1;
    particle.vx = vx;
    // Un nuage monte à peine ; un grain saute un peu avant de retomber.
    particle.vy = -this.params.dustSpeed * (puff ? 0.25 : 0.7 + 0.5 * this.random());
    particle.gravity = look.gravity;
    particle.floorY = feetY - 0.5;
    particle.scale = (puff ? PUFF_SCALE : 1) / S;
    particle.grows = puff;
    particle.alpha = puff ? PUFF_ALPHA : ALPHA;
    particle.image
      .setTexture(textureKey(look.shape, Math.floor(this.random() * VARIANTS)))
      .setVisible(true)
      .setPosition(particle.x, particle.y)
      .setAlpha(particle.alpha)
      .setScale(particle.scale)
      .setTint(color);
  }

  private forced(
    x: number,
    y: number,
    vx: number,
    vy: number,
    gravity: number,
    key: string,
    scale: number,
    color: number,
  ): void {
    const particle = this.take();
    particle.forced = true;
    particle.bornMs = this.scene.time.now;
    particle.x = x;
    particle.y = y;
    particle.vx = vx;
    particle.vy = vy;
    particle.gravity = gravity;
    particle.floorY = y + 4;
    particle.scale = scale;
    particle.grows = false;
    particle.alpha = ALPHA;
    particle.image
      .setTexture(key)
      .setVisible(true)
      .setPosition(x, y)
      .setAlpha(ALPHA)
      .setScale(scale)
      .setTint(color);
  }
}

function chipKey(variant: number): string {
  return `dust-chip-${String(variant % VARIANTS)}`;
}

function textureKey(shape: DustShape, variant: number): string {
  switch (shape) {
    case 'puff':
      return PUFF;
    case 'grain':
      return GRAIN;
    default:
      return `dust-${shape}-${String(variant % VARIANTS)}`;
  }
}

/** Grains dessinés une fois, en blanc (teintés à l'émission), à l'échelle `S`. */
function createTextures(scene: Phaser.Scene): void {
  const make = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) {
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
    scene.textures.addCanvas(key, canvas);
  };
  // Nuage : un rond doux.
  make(PUFF, 8, 8, (ctx) => {
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
  });
  // Grain de sable, goutte.
  make(GRAIN, 2, 2, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(1, 1, 0.8, 0, Math.PI * 2);
    ctx.fill();
  });
  for (let v = 0; v < VARIANTS; v++) {
    const angle = (v - 1) * 0.5;
    // Copeau : un bout de papier irrégulier, son bord bas un peu plus sombre.
    make(`dust-chip-${String(v)}`, 4, 4, (ctx) => {
      ctx.translate(2, 2);
      ctx.rotate(angle);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-1.4, -0.9);
      ctx.lineTo(1.3, -1.1);
      ctx.lineTo(1.1, 0.9);
      ctx.lineTo(-1.2, 1.0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(-1.2, 0.5, 2.3, 0.5);
    });
    // Brin d'herbe : une lame fine et pointue.
    make(`dust-blade-${String(v)}`, 4, 6, (ctx) => {
      ctx.translate(2, 3);
      ctx.rotate(angle);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-0.6, 2.4);
      ctx.lineTo(0, -2.6);
      ctx.lineTo(0.6, 2.4);
      ctx.closePath();
      ctx.fill();
    });
    // Petite feuille : une amande et sa nervure.
    make(`dust-leaf-${String(v)}`, 5, 5, (ctx) => {
      ctx.translate(2.5, 2.5);
      ctx.rotate(angle * 1.6);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.quadraticCurveTo(0, -1.4, 2, 0);
      ctx.quadraticCurveTo(0, 1.4, -2, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-1.6, 0);
      ctx.lineTo(1.6, 0);
      ctx.stroke();
    });
  }
}
