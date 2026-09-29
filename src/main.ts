import Phaser from 'phaser';
import { PLACEHOLDER_COLORS, type DisplaySettings } from './config/display';
import { computeGameWidth, computeRenderScale, renderSize } from './core/gameSize';
import { SaveManager } from './core/save/SaveManager';
import { SaveSession } from './core/save/SaveSession';
import { createNewSave, migrateLegacySettings, type SaveData } from './core/save/saveData';
import { LEVELS } from './levels';
import { openBrowserSaveStorage, requestPersistentStorage } from './platform/browserSaveStorage';
import { DISPLAY_SETTINGS_EVENT, GameScene, SESSION_KEY } from './scenes/GameScene';

function getParent(): HTMLElement {
  const element = document.getElementById('game');
  if (!element) {
    throw new Error('Élément #game introuvable');
  }
  return element;
}

/** Réglages stockés avant la sauvegarde (D-13, D-18), repris dans une nouvelle partie. */
function legacySettings(): SaveData['settings'] {
  try {
    return migrateLegacySettings(
      localStorage.getItem('maria.settings.controls'),
      localStorage.getItem('maria.settings.display'),
    );
  } catch {
    return migrateLegacySettings(null, null);
  }
}

function newGame(): SaveData {
  return createNewSave(LEVELS[0]?.id ?? 'test-room', Date.now(), legacySettings());
}

function startGame(parent: HTMLElement, session: SaveSession): Phaser.Game {
  let display: DisplaySettings = session.data.settings.display;
  /** Taille du canvas : largeur logique (D-01) × échelle de rendu (D-18). */
  const canvasSize = () => {
    const scale = computeRenderScale(
      display.renderMode,
      parent.clientHeight,
      window.devicePixelRatio,
    );
    return renderSize(computeGameWidth(parent.clientWidth, parent.clientHeight), scale);
  };
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
  game.registry.set(SESSION_KEY, session);
  const fitGameSize = () => {
    const { width, height } = canvasSize();
    if (width !== game.scale.gameSize.width || height !== game.scale.gameSize.height) {
      game.scale.setGameSize(width, height);
    }
  };
  window.addEventListener('resize', fitGameSize);
  game.events.on(DISPLAY_SETTINGS_EVENT, (settings: DisplaySettings) => {
    display = settings;
    fitGameSize();
  });
  return game;
}

async function boot(): Promise<void> {
  const parent = getParent();
  const manager = new SaveManager(await openBrowserSaveStorage());
  const report = await manager.load();
  void requestPersistentStorage();
  const session = new SaveSession(manager, report.data ?? newGame());
  startGame(parent, session);
}

void boot();
