/** Ce que la pause de DomoThib arrête : le son au démarrage (intro, accueil), puis la partie. */
export interface PauseTarget {
  pause(): void;
  resume(): void;
}

/** Les événements de pause de DomoThib (la bibliothèque du pont, `docs/domothib.md` §4.4). */
export interface PauseSource {
  onPause(listener: () => void): () => void;
  onResume(listener: () => void): () => void;
}

/**
 * La pause demandée par DomoThib (D-193) : son menu ouvert, l'appli en arrière-plan, l'écran dans
 * le mauvais sens… Une seule pause à la fois, quel que soit le nombre de messages ; la reprise
 * rend la main exactement là où elle était. Pendant le démarrage, seul le son s'arrête ; une fois
 * la partie lancée, elle prend le relais (`setTarget`), y compris au milieu d'une pause.
 */
export class HostPause {
  private paused = false;

  constructor(
    source: PauseSource,
    private target: PauseTarget,
  ) {
    source.onPause(() => {
      if (!this.paused) {
        this.paused = true;
        this.target.pause();
      }
    });
    source.onResume(() => {
      if (this.paused) {
        this.paused = false;
        this.target.resume();
      }
    });
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** Change ce qui est arrêté : une pause en cours est rendue à l'ancien et passe au nouveau. */
  setTarget(target: PauseTarget): void {
    if (target === this.target) {
      return;
    }
    if (this.paused) {
      this.target.resume();
      target.pause();
    }
    this.target = target;
  }
}
