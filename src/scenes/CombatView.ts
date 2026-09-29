import Phaser from 'phaser';
import type { CombatParams } from '../config/combat';
import type { ArtPalette } from '../config/art';
import { PATROLLER_HITBOX, SPIDER_HITBOX } from '../config/combat';
import { PLACEHOLDER_COLORS, TILE_SIZE } from '../config/display';
import { msToSteps } from '../config/movement';
import { AttackPhase } from '../core/combat/PlayerAttack';
import { CombatEvent, type CombatWorld } from '../core/combat/CombatWorld';
import { EnemyKind, PatrollerState } from '../core/combat/Patroller';
import { Tile, tileAt } from '../core/level/LevelData';
import type { PlayerPhysics } from '../core/player/PlayerPhysics';
import type { DustPool } from './DustPool';

const PATROLLER_TEXTURE = 'patroller-placeholder';
const SPIDER_TEXTURE = 'spider-placeholder';
const THREAD_TEXTURE = 'spider-thread';
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
  /** Fil de chaque araignée (null pour un jouet), et hauteur où il s'attache (px). */
  private threads: (Phaser.GameObjects.Image | null)[] = [];
  private threadTops: number[] = [];
  private readonly stick: Phaser.GameObjects.Image;
  /** Arc de frappe : rend le coup lisible (le bâton seul est fin et bref). */
  private readonly slash: Phaser.GameObjects.Image;

  private artScale = 1;

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
    for (const thread of this.threads) {
      thread?.destroy();
    }
    const level = this.world.room;
    this.enemySprites = this.world.enemies.map((enemy) =>
      this.scene.add
        .image(0, 0, enemy.kind === EnemyKind.Spider ? SPIDER_TEXTURE : PATROLLER_TEXTURE)
        .setOrigin(0.5, 1)
        .setScale(1 / this.artScale)
        .setDepth(8),
    );
    // Le fil monte jusqu'à la première surface au-dessus (branche, frondaison, plafond).
    this.threadTops = this.world.enemies.map((enemy) => {
      let row = enemy.spawnRow - 1;
      while (row > 0) {
        const tile = tileAt(level, enemy.spawnCol, row);
        if (tile === Tile.Solid || tile === Tile.OneWay) {
          break;
        }
        row--;
      }
      return (row + 1) * TILE_SIZE;
    });
    this.threads = this.world.enemies.map((enemy) =>
      enemy.kind === EnemyKind.Spider
        ? this.scene.add
            .image((enemy.spawnCol + 0.5) * TILE_SIZE, 0, THREAD_TEXTURE)
            .setOrigin(0.5, 0)
            .setAlpha(0.75)
            .setDepth(7)
        : null,
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
  render(
    alpha: number,
    player: PlayerPhysics,
    playerSprite: { readonly x: number; readonly y: number; setAlpha: (alpha: number) => unknown },
  ): void {
    const enemies = this.world.enemies;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const sprite = this.enemySprites[i];
      if (!enemy || !sprite) {
        continue;
      }
      const thread = this.threads[i];
      if (enemy.state === PatrollerState.Dispersed) {
        sprite.setVisible(false);
        thread?.setVisible(false);
        continue;
      }
      const box = enemy.box;
      if (thread) {
        const top = this.threadTops[i] ?? 0;
        const y = enemy.prevY + (box.y - enemy.prevY) * alpha;
        thread
          .setVisible(true)
          .setPosition(thread.x, top)
          .setDisplaySize(1, Math.max(1, y - top + 2));
      }
      sprite
        .setVisible(true)
        .setPosition(
          enemy.prevX + (box.x - enemy.prevX) * alpha + box.width / 2,
          enemy.prevY + (box.y - enemy.prevY) * alpha + box.height,
        )
        .setFlipX(enemy.kind === EnemyKind.Walker && enemy.dir < 0)
        // Étourdi : penché et terni (lisible sans violence).
        .setRotation(
          enemy.state === PatrollerState.Stunned && enemy.kind === EnemyKind.Walker
            ? 0.35 * enemy.dir
            : 0,
        )
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

  /**
   * Jouet mécanique (D-28, placeholder du style) : souris à remonter, clé dans le dos, dessinée
   * à l'échelle de l'écran ; silhouette à l'œil lumineux dans le monde étrange.
   */
  setArt(scale: number, palette: Readonly<ArtPalette>): void {
    this.artScale = scale;
    const { width: w, height: h } = PATROLLER_HITBOX;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(scale, scale);
    const dark = palette.silhouettes;
    // Monde étrange : ombre sombre mais lisible sur les fonds sombres (retour de l'utilisateur).
    const SHADOW = '#2a3140';
    // Corps (tourné vers la droite), oreille, museau, roues, queue, clé.
    ctx.fillStyle = dark ? SHADOW : '#c9823f';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.58, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.25, h * 0.2, 0, Math.PI * 2);
    ctx.fill();
    if (dark) {
      // Contour lumineux discret : la silhouette se détache du fond.
      ctx.strokeStyle = palette.rim;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.58, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
      ctx.moveTo(w * 0.72 + h * 0.2, h * 0.25);
      ctx.arc(w * 0.72, h * 0.25, h * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = dark ? SHADOW : '#e0a56a';
    ctx.beginPath();
    ctx.ellipse(w * 0.95, h * 0.62, 1.6, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark ? SHADOW : '#6e625a';
    ctx.beginPath();
    ctx.arc(w * 0.3, h - 1.2, 1.2, 0, Math.PI * 2);
    ctx.arc(w * 0.7, h - 1.2, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark ? palette.rim : '#8a5a2a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.6);
    ctx.quadraticCurveTo(-1, h * 0.3, w * 0.05, h * 0.15);
    ctx.stroke();
    ctx.fillStyle = dark ? palette.rim : '#c9a46b';
    ctx.fillRect(w * 0.42, 0.5, 1.2, h * 0.28);
    ctx.fillRect(w * 0.32, 0.5, w * 0.24, 1.2);
    ctx.fillStyle = dark ? '#ffb36a' : '#2b2530';
    ctx.beginPath();
    ctx.arc(w * 0.84, h * 0.46, 0.9, 0, Math.PI * 2);
    ctx.fill();
    const textures = this.scene.textures;
    if (textures.exists(PATROLLER_TEXTURE)) {
      textures.remove(PATROLLER_TEXTURE);
    }
    textures.addCanvas(PATROLLER_TEXTURE, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.drawSpider(scale, dark, palette);
    this.rebuild();
  }

  /**
   * Araignée du jardin (D-46), placeholder : petit corps rond et doux, huit pattes fines, deux
   * yeux clairs. Plutôt drôle qu'effrayante (pilier 8).
   */
  private drawSpider(scale: number, dark: boolean, palette: Readonly<ArtPalette>): void {
    const { width: w, height: h } = SPIDER_HITBOX;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(scale, scale);
    const body = dark ? '#2a3140' : '#3b3440';
    ctx.strokeStyle = body;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const y = h * 0.35 + i * 1.3;
      ctx.moveTo(w / 2 - 2, y);
      ctx.quadraticCurveTo(w / 2 - 5, y - 2.5 + i, 0.6, y + 1.5 + i * 0.6);
      ctx.moveTo(w / 2 + 2, y);
      ctx.quadraticCurveTo(w / 2 + 5, y - 2.5 + i, w - 0.6, y + 1.5 + i * 0.6);
    }
    ctx.stroke();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.45, 3.4, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (dark) {
      ctx.strokeStyle = palette.rim;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#f3ead7';
    ctx.beginPath();
    ctx.arc(w / 2 - 1.2, h * 0.55, 0.9, 0, Math.PI * 2);
    ctx.arc(w / 2 + 1.2, h * 0.55, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2530';
    ctx.fillRect(w / 2 - 1.2, h * 0.58, 0.5, 0.5);
    ctx.fillRect(w / 2 + 1, h * 0.58, 0.5, 0.5);
    const textures = this.scene.textures;
    if (textures.exists(SPIDER_TEXTURE)) {
      textures.remove(SPIDER_TEXTURE);
    }
    textures.addCanvas(SPIDER_TEXTURE, canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
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
    if (!textures.exists(SPIDER_TEXTURE)) {
      const { width, height } = SPIDER_HITBOX;
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(PLACEHOLDER_COLORS.enemy);
      g.fillCircle(width / 2, height / 2, height / 2);
      g.generateTexture(SPIDER_TEXTURE, width, height);
      g.destroy();
    }
    if (!textures.exists(THREAD_TEXTURE)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xf3ead7);
      g.fillRect(0, 0, 1, 1);
      g.generateTexture(THREAD_TEXTURE, 1, 1);
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
