/**
 * Vibrations (D-128, Android : l'iPhone n'a pas d'API fiable) : quelques moments forts seulement,
 * brefs, pour ne pas lasser. Durées en ms ; un motif alterne vibration et silence. PROVISOIRES, à
 * régler sur téléphone.
 */
export const HAPTICS = {
  /** Réception d'une grande chute. */
  landBig: [22],
  /** Céleste touchée (piqûre, coup, poursuivant). */
  hurt: [30, 40, 30],
  /** Le crochet attrape un câble. */
  hookCatch: [12],
  /** La bascule entre les deux couches. */
  shift: [14],
  /** Un poursuivant s'éveille. */
  chaseWake: [40, 60, 60],
  /** Une veilleuse s'allume. */
  checkpoint: [10],
} as const satisfies Record<string, readonly number[]>;

export type HapticMoment = keyof typeof HAPTICS;

/** Écart minimal entre deux vibrations (ms) : deux moments rapprochés n'en font qu'une. */
export const HAPTIC_MIN_GAP_MS = 80;
