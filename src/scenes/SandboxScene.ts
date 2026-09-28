import Phaser from 'phaser';
import { CELESTE_PLACEHOLDER_SIZE, PLACEHOLDER_COLORS } from '../config/display';

/** Scène minimale de mise en place : un rectangle placeholder centré. */
export class SandboxScene extends Phaser.Scene {
  private placeholder?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Sandbox');
  }

  create(): void {
    this.placeholder = this.add.rectangle(
      0,
      0,
      CELESTE_PLACEHOLDER_SIZE.width,
      CELESTE_PLACEHOLDER_SIZE.height,
      PLACEHOLDER_COLORS.celeste,
    );
    this.layout(this.scale.gameSize);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout);
    });
  }

  private readonly layout = (gameSize: Phaser.Structs.Size): void => {
    this.placeholder?.setPosition(gameSize.width / 2, gameSize.height / 2);
  };
}
