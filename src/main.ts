import Phaser from 'phaser';
import { PLACEHOLDER_COLORS, type DisplaySettings } from './config/display';
import { computeGameWidth, computeRenderScale, renderSize } from './core/gameSize';
import { DISPLAY_SETTINGS_EVENT, GameScene } from './scenes/GameScene';
import { loadDisplaySettings } from './ui/displaySettingsStorage';

function getParent(): HTMLElement {
  const element = document.getElementById('game');
  if (!element) {
    throw new Error('Élément #game introuvable');
  }
  return element;
}

const parent = getParent();
let display = loadDisplaySettings();

/** Taille du canvas : largeur logique (D-01) × échelle de rendu (D-18). */
function canvasSize(): { width: number; height: number } {
  const scale = computeRenderScale(
    display.renderMode,
    parent.clientHeight,
    window.devicePixelRatio,
  );
  return renderSize(computeGameWidth(parent.clientWidth, parent.clientHeight), scale);
}

const initial = canvasSize();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: PLACEHOLDER_COLORS.background,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initial.width,
    height: initial.height,
  },
  scene: [GameScene],
});

function fitGameSize(): void {
  const { width, height } = canvasSize();
  if (width !== game.scale.gameSize.width || height !== game.scale.gameSize.height) {
    game.scale.setGameSize(width, height);
  }
}

window.addEventListener('resize', fitGameSize);
game.events.on(DISPLAY_SETTINGS_EVENT, (settings: DisplaySettings) => {
  display = settings;
  fitGameSize();
});
