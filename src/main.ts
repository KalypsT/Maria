import Phaser from 'phaser';
import { PLACEHOLDER_COLORS, type DisplaySettings } from './config/display';
import { computeGameWidth, computeRenderScale, renderSize } from './core/gameSize';
import { SAVE_SLOTS, SaveLibrary } from './core/save/SaveLibrary';
import type { SaveManager } from './core/save/SaveManager';
import type { SlotSummary } from './core/save/slots';
import { SaveSession, SettingsSession } from './core/save/SaveSession';
import { createNewSave, type SaveData } from './core/save/saveData';
import { migrateLegacySettings, type GameSettings } from './core/save/settingsData';
import { startRoom } from './levels';
import { openBrowserSaveStorage, requestPersistentStorage } from './platform/browserSaveStorage';
import {
  AUDIO_KEY,
  DISPLAY_SETTINGS_EVENT,
  GameScene,
  LIBRARY_KEY,
  SESSION_KEY,
} from './scenes/GameScene';
import { AudioPlayer } from './platform/audioPlayer';
import { installHint } from './core/platform/install';
import { installEnvironment, Pwa } from './platform/pwa';
import { showTitleScreen } from './ui/TitleScreen';
import { playIntro } from './ui/IntroScreen';
import { showErrorScreen } from './ui/ErrorScreen';
import { CRASH_GUARD } from './config/perf';
import { errorDetail, looksFrozen } from './core/platform/crashGuard';
import { consumeQuietRelaunch, markQuietRelaunch } from './core/platform/quietRelaunch';
import { sessionMarks } from './platform/sessionMarks';

function getParent(): HTMLElement {
  const element = document.getElementById('game');
  if (!element) {
    throw new Error('Élément #game introuvable');
  }
  return element;
}

/** Réglages stockés avant la sauvegarde (D-13, D-18), repris s'il n'y a pas encore de réglages. */
function legacySettings(): GameSettings {
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
  return createNewSave(startRoom().level.id, Date.now());
}

function startGame(
  parent: HTMLElement,
  session: SaveSession,
  audio: AudioPlayer,
  library: SaveLibrary,
): Phaser.Game {
  let display: DisplaySettings = session.settings.data.display;
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
  game.registry.set(LIBRARY_KEY, library);
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
  session: null as SaveSession | null,
  lastFrameAt: 0,
  errorAt: -1,
  detail: null as string | null,
  timer: 0,
};

function resumeAfterCrash(): void {
  // Au retour, l'accueil directement, sans l'intro (D-186).
  markQuietRelaunch(sessionMarks());
  const writes = crash.session?.flush() ?? Promise.resolve();
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
  // Les parties de l'appareil (D-184) : l'ancienne sauvegarde unique est reprise dans la partie 1.
  const library = new SaveLibrary(await openBrowserSaveStorage());
  const opened = await library.open(legacySettings);
  const settings = new SettingsSession(library.settingsManager, opened.settings);
  // Toutes les parties chargées, pour l'accueil et sa page des parties (D-184), pendant l'intro.
  const managers = new Map(SAVE_SLOTS.map((slot) => [slot, library.slotManager(slot)]));
  const loading: Promise<SlotSummary[]> = Promise.all(
    [...managers].map(async ([slot, manager]) => ({ slot, report: await manager.load() })),
  );
  const managerOf = (slot: number): SaveManager => managers.get(slot) ?? library.slotManager(slot);
  const audio = new AudioPlayer(settings.data.audio);
  // L'intro (D-185), à chaque lancement, sauf après « Oups ! » ou « Mettre à jour » (D-186) ;
  // `?nointro` la saute en dev et dans le build de debug.
  const quiet = consumeQuietRelaunch(sessionMarks());
  const intro =
    quiet || (__DEBUG_TOOLS__ && new URLSearchParams(location.search).has('nointro'))
      ? { close: () => undefined, completed: false }
      : await playIntro(audio, settings.data.introSeen);
  if (intro.completed) {
    // Vue en entier une fois : « Passer » d'emblée aux lancements suivants (D-186).
    void settings.markIntroSeen();
  }
  const summaries = await loading;
  // Musique (D-57) : thème de l'accueil (il démarre au premier toucher si l'intro n'en a pas eu).
  audio.setMusic('title');
  const shown = showTitleScreen(
    {
      summaries,
      lastSlot: opened.lastSlot,
      erase: (slot) =>
        managerOf(slot)
          .clear()
          .then(
            () => true,
            () => false,
          ),
    },
    pwa,
    installHint(installEnvironment()),
    // Le plan 8 de l'intro : le titre s'écrit, seulement après l'intro vue en entier.
    { entrance: intro.completed },
  );
  // L'écran titre est posé sous l'intro (le même papier) : on peut la retirer sans éclair.
  intro.close();
  const choice = await shown;
  // Demandé après un geste de l'utilisateur : certains navigateurs l'exigent.
  void requestPersistentStorage();
  const saved = summaries.find((s) => s.slot === choice.slot)?.report.data ?? null;
  const data =
    choice.kind === 'play' && saved ? saved : choice.kind === 'import' ? choice.data : newGame();
  const session = new SaveSession(managerOf(choice.slot), data, Date.now, settings, choice.slot);
  if (choice.kind !== 'play') {
    // Nouvelle partie ou import : écrite tout de suite (l'ancienne devient l'état précédent).
    await session.persist();
  }
  void library.setLastSlot(choice.slot);
  const game = startGame(parent, session, audio, library);
  crash.session = session;
  crash.game = game;
  game.events.on(Phaser.Core.Events.POST_RENDER, () => {
    crash.lastFrameAt = performance.now();
  });
}

boot().catch((reason: unknown) => {
  // Le démarrage lui-même a échoué : rien ne s'affichera sans cet écran.
  showErrorScreen(errorDetail(reason), resumeAfterCrash);
});
