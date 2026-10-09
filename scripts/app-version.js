// Version affichée sur l'écran de départ (D-152) : la date et l'identifiant court du dernier commit,
// pour savoir sur quelle version un retour d'essai a été fait. « dev » hors d'un dépôt git.
import { execSync } from 'node:child_process';

export function appVersion() {
  try {
    const [date, hash] = execSync('git log -1 --format=%cs/%h', { encoding: 'utf8' })
      .trim()
      .split('/');
    return date && hash ? `${date} · ${hash}` : 'dev';
  } catch {
    return 'dev';
  }
}
