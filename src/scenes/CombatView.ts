import Phaser from 'phaser';
import type { CombatParams } from '../config/combat';
import { PATROLLER_HITBOX } from '../config/combat';
import { PLACEHOLDER_COLORS } from '../config/display';
import { msToSteps } from '../config/movement';
import { AttackPhase } from '../core/combat/PlayerAttack';
import { CombatEvent, type CombatWorld } from '../core/combat/CombatWorld';
import { PatrollerState } from '../core/combat/Patroller';
import type { PlayerPhysics } from '../core/player/PlayerPhysics';
import type { DustPool } from './DustPool';

const PATROLLER_TEXTURE = 'patroller-placeholder';
const STICK_TEXTURE = 'stick-placeholder';
const SLASH_TEXTURE = 'slash-placeholder';
/** Rayon de l'arc de frappe (px), environ la portée du coup. */
const SLASH_RADIUS = 16;
const STICK_LENGTH = 14;
/** Angles du bâton (degrés, vers la droite ; 0 = vertical vers le haut). */
const STICK_RAISED = -70;
const STICK_FORWARD = 80;
/** Période du clignotement d'invulnérabilité (pas de simulation). */
const BLINK_STEPS = 8;

/**
 * Affichage du combat (placeholders géométriques, D-07) : patrouilleurs, bâton, clignotements,
 * éclat de dispersion. Aucune logique de jeu : tout vient de `CombatWorld`.
 */
export class CombatView {
  private enemySprites: Phaser.GameObjects.Image[] = [];
  private readonly stick: Phaser.GameObjects.Image;
  /** Arc de frappe : rend le coup lisible (le bâton seul est fin et bref). */
  private readonly slash: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: CombatWorld,
    private readonly params: Readonly<CombatParams>,
    private readonly dust: DustPool,
  ) {
    this.createTextures();
    this.stick = scene.add
      .image(0, 0, STICK_TEXTURE)
      .setOrigin(0.5, 1)
      .setDepth(11)
      .setVisible(false);
    this.slash = scene.add
      .image(0, 0, SLASH_TEXTURE)
      .setOrigin(0, 0.5)
      .setDepth(12)
      .setVisible(false);
    this.rebuild();
  }

  /** Recrée les sprites des ennemis (changement de salle). */
  rebuild(): void {
    for (const sprite of this.enemySprites) {
      sprite.destroy();
    }
    this.enemySprites = this.world.enemies.map(() =>
      this.scene.add.image(0, 0, PATROLLER_TEXTURE).setOrigin(0.5, 1).setDepth(8),
    );
  }

  /** Réagit aux événements d'un pas (éclat, tremblement). */
  onEvents(events: number): void {
    const enemy = this.world.enemies[this.world.lastEnemy];
    if ((events & CombatEvent.Disperse) !== 0 && enemy) {
      this.dust.burst(enemy.box);
    }
    const shake = this.params.screenShakePx;
    if (shake > 0 && (events & (CombatEvent.Hit | CombatEvent.Disperse | CombatEvent.Hurt)) !== 0) {
      const camera = this.scene.cameras.main;
      camera.shake(80, shake / camera.height);
    }
  }

  /** Affichage interpolé (une fois par image). */
  render(alpha: number, player: PlayerPhysics, playerSprite: Phaser.GameObjects.Image): void {
    const enemies = this.world.enemies;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const sprite = this.enemySprites[i];
      if (!enemy || !sprite) {
        continue;
      }
      if (enemy.state === PatrollerState.Dispersed) {
        sprite.setVisible(false);
        continue;
      }
      const box = enemy.box;
      sprite
        .setVisible(true)
        .setPosition(
          enemy.prevX + (box.x - enemy.prevX) * alpha + box.width / 2,
          enemy.prevY + (box.y - enemy.prevY) * alpha + box.height,
        )
        .setFlipX(enemy.dir < 0)
        // Étourdi : penché et terni (lisible sans violence).
        .setRotation(enemy.state === PatrollerState.Stunned ? 0.35 * enemy.dir : 0)
        .setAlpha(enemy.state === PatrollerState.Stunned ? 0.6 : 1);
      if (enemy.flashSteps > 0) {
        sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      } else {
        sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      }
    }

    // Clignotement d'invulnérabilité de Céleste.
    const invulnerable = this.world.invulnerableSteps;
    playerSprite.setAlpha(
      invulnerable > 0 && Math.floor(invulnerable / BLINK_STEPS) % 2 === 0 ? 0.35 : 1,
    );

    // Bâton : levé pendant la préparation, balayage pendant la frappe, tendu pendant la récupération.
    const attack = this.world.attack;
    if (attack.phase === AttackPhase.Idle) {
      this.stick.setVisible(false);
      this.slash.setVisible(false);
      return;
    }
    let angle = STICK_FORWARD;
    if (attack.phase === AttackPhase.Startup) {
      angle = STICK_RAISED;
    } else if (attack.phase === AttackPhase.Active) {
      const total = Math.max(1, msToSteps(this.params.attackActiveMs));
      const progress = 1 - attack.phaseSteps / total;
      angle = STICK_RAISED + (STICK_FORWARD - STICK_RAISED) * Math.min(1, progress * 2);
    }
    const box = player.box;
    this.stick
      .setVisible(true)
      .setPosition(
        playerSprite.x + attack.facing * (box.width / 2 - 2),
        playerSprite.y - box.height * 0.45,
      )
      .setRotation(((attack.facing * angle) / 180) * Math.PI)
      .setAlpha(attack.phase === AttackPhase.Recovery ? 0.6 : 1);

    // Arc de frappe pendant la frappe active, qui s'estompe au fil du coup.
    if (attack.phase === AttackPhase.Active) {
      const total = Math.max(1, msToSteps(this.params.attackActiveMs));
      this.slash
        .setVisible(true)
        .setPosition(
          playerSprite.x + attack.facing * (box.width / 2 - 4),
          playerSprite.y -
            box.height +
            this.params.attackOffsetYPx +
            this.params.attackHeightPx / 2,
        )
        .setFlipX(attack.facing < 0)
        .setOrigin(attack.facing < 0 ? 1 : 0, 0.5)
        .setAlpha(0.35 + 0.55 * (attack.phaseSteps / total));
    } else {
      this.slash.setVisible(false);
    }
  }

  private createTextures(): void {
    const textures = this.scene.textures;
    if (!textures.exists(PATROLLER_TEXTURE)) {
      // Placeholder neutre (design ouvert, §45) : corps arrondi sombre, deux yeux clairs.
      const { width, height } = PATROLLER_HITBOX;
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(PLACEHOLDER_COLORS.enemy);
      g.fillRoundedRect(0, 0, width, height, 4);
      g.fillStyle(PLACEHOLDER_COLORS.enemyEyes);
      g.fillRect(width - 6, 3, 2, 3);
      g.fillRect(width - 10, 3, 2, 3);
      g.generateTexture(PATROLLER_TEXTURE, width, height);
      g.destroy();
    }
    if (!textures.exists(SLASH_TEXTURE)) {
      // Arc d'un tiers de cercle, ouvert vers l'avant (droite).
      const g = this.scene.make.graphics({}, false);
      g.lineStyle(3, PLACEHOLDER_COLORS.slash, 1);
      g.beginPath();
      g.arc(0, SLASH_RADIUS + 2, SLASH_RADIUS, -Math.PI / 3, Math.PI / 3);
      g.strokePath();
      g.generateTexture(SLASH_TEXTURE, SLASH_RADIUS + 3, 2 * SLASH_RADIUS + 4);
      g.destroy();
    }
    if (!textures.exists(STICK_TEXTURE)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(PLACEHOLDER_COLORS.stick);
      g.fillRect(0, 0, 2, STICK_LENGTH);
      g.generateTexture(STICK_TEXTURE, 2, STICK_LENGTH);
      g.destroy();
    }
  }
}
