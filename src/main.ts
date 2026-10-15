import Phaser from 'phaser';
import { PLACEHOLDER_COLORS, type DisplaySettings } from './config/display';
import { computeGameWidth, computeRenderScale, renderSize } from './core/gameSize';
import { SaveManager } from './core/save/SaveManager';
import { SaveSession } from './core/save/SaveSession';
import { createNewSave, migrateLegacySettings, type SaveData } from './core/save/saveData';
import { roomName, startRoom } from './levels';
import { openBrowserSaveStorage, requestPersistentStorage } from './platform/browserSaveStorage';
import { AUDIO_KEY, DISPLAY_SETTINGS_EVENT, GameScene, SESSION_KEY } from './scenes/GameScene';
import { AudioPlayer } from './platform/audioPlayer';
import { DEFAULT_AUDIO_SETTINGS } from './config/audio';
import { installHint } from './core/platform/install';
import { installEnvironment, Pwa } from './platform/pwa';
import { showTitleScreen } from './ui/TitleScreen';
import { showErrorScreen } from './ui/ErrorScreen';
import { CRASH_GUARD } from './config/perf';
import { errorDetail, looksFrozen } from './core/platform/crashGuard';

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
  return createNewSave(startRoom().level.id, Date.now(), legacySettings());
}

function startGame(parent: HTMLElement, session: SaveSession, audio: AudioPlayer): Phaser.Game {
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
  game.registry.set(AUDIO_KEY, audio);
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

/**
 * Le filet en cas d'erreur (D-182) : une erreur non rattrapée qui fige le jeu (plus aucune image
 * rendue, appli visible) montre l'écran « Oups ». Reprendre termine les écritures en cours de la
 * sauvegarde, puis recharge la page : « Continuer » ramène à la dernière lanterne.
 */
const crash = {
  game: null as Phaser.Game | null,
  manager: null as SaveManager | null,
  lastFrameAt: 0,
  errorAt: -1,
  detail: null as string | null,
  timer: 0,
};

function resumeAfterCrash(): void {
  const writes = crash.manager?.flush() ?? Promise.resolve();
  void writes.finally(() => {
    location.reload();
  });
}

function scheduleCrashCheck(): void {
  window.clearTimeout(crash.timer);
  crash.timer = window.setTimeout(() => {
    if (crash.errorAt < 0 || !crash.game) {
      return;
    }
    if (looksFrozen(performance.now(), crash.errorAt, crash.lastFrameAt, document.hidden)) {
      showErrorScreen(crash.detail, resumeAfterCrash);
    } else if (crash.lastFrameAt > crash.errorAt) {
      crash.errorAt = -1; // La boucle continue : l'erreur était sans conséquence.
    }
  }, CRASH_GUARD.stallMs + 100);
}

function onUncaught(reason: unknown): void {
  crash.errorAt = performance.now();
  crash.detail = errorDetail(reason);
  scheduleCrashCheck();
}

window.addEventListener('error', (event) => {
  onUncaught(event.error ?? event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  onUncaught(event.reason);
});
document.addEventListener('visibilitychange', () => {
  // De retour au premier plan : les images n'ont pas pu être rendues entre-temps, on regarde à neuf.
  if (!document.hidden && crash.errorAt >= 0) {
    crash.errorAt = performance.now();
    scheduleCrashCheck();
  }
});

async function boot(): Promise<void> {
  const parent = getParent();
  // Service worker (build principal seulement, D-23) : enregistré au plus tôt.
  const pwa = new Pwa();
  pwa.start();
  const manager = new SaveManager(await openBrowserSaveStorage());
  const report = await manager.load();
  const saved = report.data;
  // Musique (D-57) : thème de l'accueil, qui démarre au premier toucher.
  const audio = new AudioPlayer(saved?.settings.audio ?? DEFAULT_AUDIO_SETTINGS);
  audio.setMusic('title');
  const choice = await showTitleScreen(
    report,
    saved ? roomName(saved.checkpoint.levelId) : null,
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
  audio.setSettings(data.settings.audio);
  const session = new SaveSession(manager, data);
  if (choice.kind !== 'continue') {
    // Nouvelle partie ou import : écrite tout de suite (l'ancienne devient l'état précédent).
    await session.persist();
  }
  const game = startGame(parent, session, audio);
  crash.manager = manager;
  crash.game = game;
  game.events.on(Phaser.Core.Events.POST_RENDER, () => {
    crash.lastFrameAt = performance.now();
  });
}

boot().catch((reason: unknown) => {
  // Le démarrage lui-même a échoué : rien ne s'affichera sans cet écran.
  showErrorScreen(errorDetail(reason), resumeAfterCrash);
});
