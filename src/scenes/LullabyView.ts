import Phaser from 'phaser';
import { LULLABY_VIEW } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import { LayerMask, type LevelErase, type TileRect } from '../core/level/LevelData';
import type { EraseShown } from './ShiftLayerView';

/** Au-dessus des couches de la bascule, sous les personnages. */
const DEPTH = -3.95;

/** Une étoile : son halo et son dessin allumé, son contour éteint (créés au chargement). */
interface Star {
  readonly halo: Phaser.GameObjects.Graphics;
  readonly lit: Phaser.GameObjects.Graphics;
  readonly dark: Phaser.GameObjects.Graphics;
}

/** Les sommets d'une étoile à cinq branches, centrée en (x, y). */
function starPoints(x: number, y: number, r: number): Phaser.Math.Vector2[] {
  const points: Phaser.Math.Vector2[] = [];
  for (let k = 0; k < 10; k++) {
    const angle = -Math.PI / 2 + (k * Math.PI) / 5;
    const radius = k % 2 === 0 ? r : r * 0.45;
    points.push(
      new Phaser.Math.Vector2(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius),
    );
  }
  return points;
}

/**
 * Les étoiles de la berceuse (D-140), PLACEHOLDER : chaque groupe de l'effacement d'une salle
 * `; @erase-look: stars` est une planche de lumière avec une étoile au milieu. Allumée, chaude et
 * nette ; éteinte, un contour en pointillés, pour prévoir. Une étoile qui va s'allumer s'éclaire peu
 * à peu ; une qui va s'éteindre vacille. Tout est créé au chargement ; chaque image ne change que des
 * opacités et des visibilités.
 */
export class LullabyView {
  private readonly stars: Star[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  /** Nouvelle salle : ses étoiles, s'il y en a (rien sans la berceuse). */
  load(erase: LevelErase | null): void {
    for (const star of this.stars) {
      star.halo.destroy();
      star.lit.destroy();
      star.dark.destroy();
    }
    this.stars.length = 0;
    if (erase?.look !== 'stars') {
      return;
    }
    for (const group of erase.groups) {
      // Le halo s'ajoute à la lumière de la salle (une lueur, pas un disque).
      const halo = this.scene.add.graphics().setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);
      const lit = this.scene.add.graphics().setDepth(DEPTH);
      const dark = this.scene.add.graphics().setDepth(DEPTH);
      for (const r of group.rects) {
        this.drawHalo(halo, r);
        this.drawLit(lit, r);
        this.drawDark(dark, r);
      }
      const on = group.initial !== LayerMask.None;
      halo.setVisible(on);
      lit.setVisible(on);
      dark.setVisible(!on);
      this.stars.push({ halo, lit, dark });
    }
  }

  /** Une image : chaque étoile selon ses couches du moment et son annonce. */
  render(now: number, erase: EraseShown | null): void {
    if (!erase || this.stars.length === 0) {
      return;
    }
    const v = LULLABY_VIEW;
    const beat = 0.5 + 0.5 * Math.sin(now / v.flickerMs);
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (!star) {
        continue;
      }
      const on = (erase.masks[i] ?? 0) !== LayerMask.None;
      const target = erase.target[i] ?? -1;
      const a = erase.announce(i);
      if (on && target === LayerMask.None) {
        // Elle va s'éteindre : elle vacille, de plus en plus ; son contour éteint apparaît.
        const alpha = 1 - a * (0.35 + 0.5 * beat);
        star.halo.setVisible(true).setAlpha(alpha);
        star.lit.setVisible(true).setAlpha(alpha);
        star.dark.setVisible(true).setAlpha(a);
      } else if (on) {
        star.halo.setVisible(true).setAlpha(1);
        star.lit.setVisible(true).setAlpha(1);
        star.dark.setVisible(false);
      } else if (target === LayerMask.Both) {
        // Elle va s'allumer : elle s'éclaire peu à peu, en respirant.
        const alpha = 0.12 + 0.55 * a * (0.7 + 0.3 * beat);
        star.dark.setVisible(true).setAlpha(1);
        star.halo.setVisible(true).setAlpha(alpha);
        star.lit.setVisible(true).setAlpha(alpha);
      } else {
        star.halo.setVisible(false);
        star.lit.setVisible(false);
        star.dark.setVisible(true).setAlpha(1);
      }
    }
  }

  /** Le halo : des anneaux de lumière, de plus en plus petits, autour de la planche. */
  private drawHalo(g: Phaser.GameObjects.Graphics, r: TileRect): void {
    const v = LULLABY_VIEW;
    const w = r.width * T;
    const cx = r.col * T + w / 2;
    const cy = r.row * T + v.plankPx / 2;
    const rings: number = v.haloRings;
    for (let k = rings; k >= 1; k--) {
      g.fillStyle(v.halo, v.haloAlpha);
      g.fillEllipse(
        cx,
        cy,
        (w + 2 * v.haloRadiusPx) * (k / rings),
        2 * v.haloRadiusPx * (k / rings),
      );
    }
  }

  /** Allumée : la planche de lumière, l'étoile au milieu. */
  private drawLit(g: Phaser.GameObjects.Graphics, r: TileRect): void {
    const v = LULLABY_VIEW;
    const x = r.col * T;
    const y = r.row * T;
    const w = r.width * T;
    const cx = x + w / 2;
    const cy = y + v.plankPx / 2;
    g.fillStyle(v.light, 1);
    g.fillRoundedRect(x, y, w, v.plankPx, v.plankPx / 2);
    g.fillStyle(v.core, 1);
    g.fillRect(x + 2, y + 1, w - 4, 1);
    g.fillStyle(v.light, 1);
    g.fillPoints(starPoints(cx, cy, v.starRadiusPx), true);
    g.fillStyle(v.core, 1);
    g.fillPoints(starPoints(cx, cy, v.starRadiusPx * 0.5), true);
  }

  /** Éteinte : la planche en pointillés et le contour de l'étoile. */
  private drawDark(g: Phaser.GameObjects.Graphics, r: TileRect): void {
    const v = LULLABY_VIEW;
    const x = r.col * T;
    const y = r.row * T;
    const w = r.width * T;
    g.lineStyle(1, v.dark, v.darkAlpha);
    for (let dx = 0; dx < w; dx += 2 * v.dashPx) {
      g.lineBetween(x + dx, y + 0.5, x + Math.min(w, dx + v.dashPx), y + 0.5);
      g.lineBetween(
        x + dx,
        y + v.plankPx - 0.5,
        x + Math.min(w, dx + v.dashPx),
        y + v.plankPx - 0.5,
      );
    }
    g.strokePoints(starPoints(x + w / 2, y + v.plankPx / 2, v.starRadiusPx), true);
  }
}
