/** Le peu de `sessionStorage` dont la marque a besoin (injecté : testable sans navigateur). */
export interface MarkStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const QUIET_RELAUNCH_KEY = 'maria.quiet-relaunch';

/**
 * Rechargement voulu par le jeu (D-186) : après « Oups ! » ou « Mettre à jour », on revient sur
 * l'accueil sans rejouer l'intro. La marque vit dans `sessionStorage` (le même onglet, le temps du
 * rechargement) et ne sert qu'une fois. Sans stockage, l'intro se joue : rien de grave.
 */
export function markQuietRelaunch(storage: MarkStorage | null): void {
  try {
    storage?.setItem(QUIET_RELAUNCH_KEY, '1');
  } catch {
    // L'intro se jouera.
  }
}

/** Vrai si le lancement suit un rechargement voulu ; la marque est effacée. */
export function consumeQuietRelaunch(storage: MarkStorage | null): boolean {
  try {
    if (storage?.getItem(QUIET_RELAUNCH_KEY) !== '1') {
      return false;
    }
    storage.removeItem(QUIET_RELAUNCH_KEY);
    return true;
  } catch {
    return false;
  }
}
