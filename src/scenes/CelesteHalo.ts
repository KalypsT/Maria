import type Phaser from 'phaser';

const TEXTURE = 'celeste-halo';
/** Rayon du halo (px logiques) et échelle de dessin. */
const RADIUS = 28;
const S = 2;
/** Sous Céleste (10), au-dessus du décor et de sa lumière. */
const DEPTH = 9;

/**
 * Halo doux autour de Céleste (D-130), dans le monde étrange : elle porte un peu de lumière, et ce
 * qui l'entoure se lit mieux. Une seule image, teintée selon la palette ; rien quand l'opacité de la
 * palette est nulle (le monde réel).
 */
export class CelesteHalo {
  private readonly image: Phaser.GameObjects.Image;
  private alpha = 0;

  constructor(scene: Phaser.Scene) {
    if (!scene.textures.exists(TEXTURE)) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = RADIUS * 2 * S;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const c = RADIUS * S;
        const g = ctx.createRadialGradient(c, c, 0, c, c, c);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.35)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, c * 2, c * 2);
      }
      scene.textures.addCanvas(TEXTURE, canvas);
    }
    this.image = scene.add
      .image(0, 0, TEXTURE)
      .setDepth(DEPTH)
      .setScale(1 / S)
      .setVisible(false);
  }

  /** Opacité et couleur (« r,g,b ») de la palette de la salle. */
  setLook(alpha: number, color: string): void {
    this.alpha = alpha;
    const [r = 255, g = 255, b = 255] = color.split(',').map(Number);
    this.image
      .setTint((r << 16) | (g << 8) | b)
      .setAlpha(alpha)
      .setVisible(alpha > 0);
  }

  /** Centre de Céleste (px du monde) et sa transparence (évanouissement). */
  render(x: number, y: number, celesteAlpha: number): void {
    if (this.alpha > 0) {
      this.image.setPosition(x, y).setAlpha(this.alpha * celesteAlpha);
    }
  }
}
