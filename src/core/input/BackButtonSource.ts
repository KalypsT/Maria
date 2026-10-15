import { BUTTON_BIT, type InputSource, type RawInput } from './InputAction';

/** Le peu de `history` dont le piège a besoin (injecté : testable sans navigateur). */
export interface HistoryLike {
  readonly state: unknown;
  pushState(data: unknown, unused: string): void;
}

/** Marque de l'entrée d'historique ajoutée par le jeu. */
const TRAP_STATE = { maria: 'back-trap' } as const;

function isTrapEntry(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { maria?: unknown }).maria === 'back-trap'
  );
}

/**
 * Le retour d'Android pendant une partie (D-186) : le bouton ou le geste du bord de l'écran ne
 * quitte plus le jeu, il presse Pause (le sac s'ouvre, ou se referme s'il est ouvert).
 *
 * Une entrée d'historique est ajoutée devant la page ; le retour la consomme (`popstate`) au lieu
 * de quitter, puis elle est remise aussitôt. Chrome saute une entrée ajoutée sans toucher la page
 * depuis : deux retours de suite, sans toucher l'écran entre les deux, quittent le jeu (le « retour,
 * retour » habituel d'Android).
 */
export class BackButtonSource implements InputSource {
  private pending = false;

  constructor(private readonly history: HistoryLike) {}

  /** Pose l'entrée, sauf si la page est déjà dessus (une partie relancée par rechargement). */
  arm(): void {
    if (!isTrapEntry(this.history.state)) {
      this.history.pushState(TRAP_STATE, '');
    }
  }

  /** Le retour a consommé l'entrée : Pause sera pressée à la prochaine lecture. */
  onPopState(): void {
    this.pending = true;
    this.arm();
  }

  read(into: RawInput): void {
    if (this.pending) {
      // Tenue une seule lecture : l'agrégateur y voit une pression.
      into.held |= BUTTON_BIT.Pause;
      this.pending = false;
    }
  }

  /** Branche la fenêtre ; retourne de quoi débrancher. */
  attach(target: Window): () => void {
    const onPopState = () => {
      this.onPopState();
    };
    target.addEventListener('popstate', onPopState);
    this.arm();
    return () => {
      target.removeEventListener('popstate', onPopState);
    };
  }
}
