import { HAPTICS, HAPTIC_MIN_GAP_MS, type HapticMoment } from '../config/haptics';

/** Le navigateur sait-il vibrer (Chrome sur Android) ? */
export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Vibrations (D-128) : un court motif aux moments forts, si le réglage les autorise et si le
 * navigateur sait vibrer (le premier toucher l'a déjà permis). Jamais deux trop rapprochées.
 */
export class Haptics {
  /** Réglage du joueur (menu pause → Commandes). */
  enabled = true;
  private lastMs = -Infinity;
  private readonly supported = canVibrate();

  pulse(moment: HapticMoment): void {
    if (!this.enabled || !this.supported || document.hidden) {
      return;
    }
    const now = performance.now();
    if (now - this.lastMs < HAPTIC_MIN_GAP_MS) {
      return;
    }
    this.lastMs = now;
    try {
      navigator.vibrate([...HAPTICS[moment]]);
    } catch {
      // Refusée (aucun geste encore, ou interdite) : rien.
    }
  }
}
