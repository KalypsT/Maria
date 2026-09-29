import { registerSW } from 'virtual:pwa-register';
import type { InstallEnvironment } from '../core/platform/install';

/** Événement `beforeinstallprompt` (Chrome, Android), absent des types du DOM. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/**
 * Service worker et installation (D-23). Le build de debug et le serveur de dev n'ont pas de service
 * worker : l'enregistrement y est sans effet (option `disable` du plugin).
 */
export class Pwa {
  /** Une nouvelle version attend : elle s'appliquera au prochain lancement ou via `applyUpdate`. */
  updateReady = false;
  private installPrompt: InstallPromptEvent | null = null;
  private readonly listeners = new Set<() => void>();
  private updateServiceWorker: (reloadPage?: boolean) => Promise<void> = () => Promise.resolve();

  start(): void {
    this.updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh: () => {
        this.updateReady = true;
        this.notify();
      },
    });
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as InstallPromptEvent;
      this.notify();
    });
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.notify();
    });
  }

  /** Vrai si le navigateur propose l'installation (Android). */
  get canInstall(): boolean {
    return this.installPrompt !== null;
  }

  async promptInstall(): Promise<void> {
    const prompt = this.installPrompt;
    this.installPrompt = null;
    this.notify();
    await prompt?.prompt();
  }

  /** Active la nouvelle version et recharge (à n'appeler qu'en dehors d'une partie). */
  applyUpdate(): Promise<void> {
    return this.updateServiceWorker(true);
  }

  /** S'abonne aux changements (mise à jour prête, installation possible) ; retourne le désabonnement. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export function installEnvironment(): InstallEnvironment {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints,
    displayModeInstalled:
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches,
    iosStandalone: nav.standalone,
  };
}
