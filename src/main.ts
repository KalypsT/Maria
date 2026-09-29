import Phaser from 'phaser';
import { PLACEHOLDER_COLORS, type DisplaySettings } from './config/display';
import { computeGameWidth, computeRenderScale, renderSize } from './core/gameSize';
import { SaveManager } from './core/save/SaveManager';
import { SaveSession } from './core/save/SaveSession';
import { createNewSave, migrateLegacySettings, type SaveData } from './core/save/saveData';
import { LEVELS, levelName } from './levels';
import { openBrowserSaveStorage, requestPersistentStorage } from './platform/browserSaveStorage';
import { DISPLAY_SETTINGS_EVENT, GameScene, SESSION_KEY } from './scenes/GameScene';
import { installHint } from './core/platform/install';
import { installEnvironment, Pwa } from './platform/pwa';
import { showTitleScreen } from './ui/TitleScreen';

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
  // Service worker (build principal seulement, D-23) : enregistré au plus tôt.
  const pwa = new Pwa();
  pwa.start();
  const manager = new SaveManager(await openBrowserSaveStorage());
  const report = await manager.load();
  const saved = report.data;
  const source = saved ? LEVELS.find((level) => level.id === saved.checkpoint.levelId) : undefined;
  const choice = await showTitleScreen(
    report,
    source ? levelName(source) : null,
    pwa,
    installHint(installEnvironment()),
  );
  // Demandé après un geste de l'utilisateur : certains navigateurs l'exigent.
  void requestPersistentStorage();
  const data =
    choice.kind === 'continue' && saved
      ? saved
      : choice.kind === 'import'
        ? choice.data
        : newGame();
  const session = new SaveSession(manager, data);
  if (choice.kind !== 'continue') {
    // Nouvelle partie ou import : écrite tout de suite (l'ancienne devient l'état précédent).
    await session.persist();
  }
  startGame(parent, session);
}

void boot();
