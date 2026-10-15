import { SCREEN_WAKE } from '../config/wake';
import { wantsScreenAwake } from '../core/platform/screenWake';

/**
 * Garde l'écran allumé (D-186), par l'API Screen Wake Lock (Chrome Android, Safari récent). Le
 * navigateur la retire quand l'appli passe en arrière-plan : elle est redemandée au retour. Refusée
 * ou absente (économie de batterie, vieux navigateur) : sans effet, le jeu n'en dépend pas.
 */
export function keepScreenAwake(): void {
  const wakeLock = (navigator as Partial<Navigator>).wakeLock;
  if (!wakeLock) {
    return;
  }
  let sentinel: WakeLockSentinel | null = null;
  let requesting = false;
  let lastInputAt = performance.now();

  const update = () => {
    const wanted = wantsScreenAwake(
      performance.now(),
      lastInputAt,
      document.visibilityState === 'visible',
      SCREEN_WAKE.idleMs,
    );
    if (wanted && !sentinel && !requesting) {
      requesting = true;
      wakeLock
        .request('screen')
        .then((lock) => {
          sentinel = lock;
          lock.addEventListener('release', () => {
            if (sentinel === lock) {
              sentinel = null;
            }
          });
          // Devenue inutile pendant la demande (appli masquée, inactivité) : rendue aussitôt.
          update();
        })
        .catch(() => {
          // Refusée : la veille normale s'applique.
        })
        .finally(() => {
          requesting = false;
        });
    } else if (!wanted && sentinel) {
      const lock = sentinel;
      sentinel = null;
      void lock.release().catch(() => undefined);
    }
  };

  const onInput = () => {
    lastInputAt = performance.now();
    if (!sentinel) {
      update();
    }
  };
  window.addEventListener('pointerdown', onInput, { capture: true, passive: true });
  window.addEventListener('keydown', onInput, { capture: true, passive: true });
  document.addEventListener('visibilitychange', update);
  window.setInterval(update, SCREEN_WAKE.checkMs);
  update();
}
