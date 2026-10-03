import type Phaser from 'phaser';
import { RIDE_LOOK } from '../config/art';
import { TILE_SIZE as T } from '../config/display';
import type { Box } from '../core/physics/gridCollision';

const CHAIR_TEXTURE = 'ride-chair';
/** Devant le décor, derrière Céleste. */
const CHAIR_DEPTH = 4.5;

/**
 * Les chaises volantes (D-101), visuel seulement : elles tournent haut au calme, descendent pendant
 * l'annonce et balaient leur zone (`; @sweep:`) quand elles passent. Créées au chargement de la
 * salle, aucune création en jeu.
 */
export class RideView {
  private chairs: Phaser.GameObjects.Image[] = [];
  private zones: readonly Box[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    if (!scene.textures.exists(CHAIR_TEXTURE)) {
      const g = scene.make.graphics({}, false);
      g.lineStyle(1, 0x3b3b3b, 1);
      g.lineBetween(5, 0, 5, 10);
      g.fillStyle(0xd9534f, 1);
      g.fillRoundedRect(0, 10, 10, 6, 2);
      g.fillStyle(0xf2c14e, 1);
      g.fillRect(1, 15, 8, 2);
      g.generateTexture(CHAIR_TEXTURE, 10, 17);
      g.destroy();
    }
  }

  load(zones: readonly Box[]): void {
    for (const chair of this.chairs) {
      chair.destroy();
    }
    this.zones = zones;
    this.chairs = zones.flatMap(() =>
      Array.from({ length: RIDE_LOOK.chairs }, () =>
        this.scene.add.image(0, 0, CHAIR_TEXTURE).setOrigin(0.5, 1).setDepth(CHAIR_DEPTH),
      ),
    );
  }

  /** Une fois par image : `warn` (0 → 1, -1 hors de l'annonce), `passing` : elles balaient. */
  update(nowMs: number, warn: number, passing: boolean): void {
    const low = passing ? 1 : Math.max(0, warn);
    const t = (nowMs / 1000) * RIDE_LOOK.turnsPerS * Math.PI * 2;
    for (let z = 0; z < this.zones.length; z++) {
      const zone = this.zones[z];
      if (!zone) {
        continue;
      }
      const high = zone.y - RIDE_LOOK.raisedTiles * T;
      const bottom = high + (zone.y + zone.height - high) * low;
      for (let i = 0; i < RIDE_LOOK.chairs; i++) {
        const chair = this.chairs[z * RIDE_LOOK.chairs + i];
        if (!chair) {
          continue;
        }
        const a = t + (i / RIDE_LOOK.chairs) * Math.PI * 2;
        chair.x = zone.x + zone.width / 2 + Math.cos(a) * (zone.width / 2);
        chair.y = bottom + Math.sin(a) * 2;
        // L'arrière du manège : les chaises passent derrière son mât (plus pâles).
        chair.setAlpha(Math.sin(a) < 0 ? 0.55 : 1);
      }
    }
  }
}
