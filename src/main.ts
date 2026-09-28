import Phaser from 'phaser';
import { GAME_HEIGHT, PLACEHOLDER_COLORS } from './config/display';
import { computeGameWidth } from './core/gameSize';
import { GameScene } from './scenes/GameScene';

function getParent(): HTMLElement {
  const element = document.getElementById('game');
  if (!element) {
    throw new Error('Élément #game introuvable');
  }
  return element;
}

const parent = getParent();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: PLACEHOLDER_COLORS.background,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: computeGameWidth(parent.clientWidth, parent.clientHeight),
    height: GAME_HEIGHT,
  },
  scene: [GameScene],
});

function fitGameWidth(): void {
  const width = computeGameWidth(parent.clientWidth, parent.clientHeight);
  if (width !== game.scale.gameSize.width) {
    game.scale.setGameSize(width, GAME_HEIGHT);
  }
}

window.addEventListener('resize', fitGameWidth);
