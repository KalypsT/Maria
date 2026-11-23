import { connectDomoThib, type DomoThib } from '../domothib/domothib-games';

/**
 * Le pont de DomoThib Games (D-193, `docs/domothib.md`) : dans le build de DomoThib seulement.
 * Ailleurs (GitHub Pages, dev, debug), ou sans réponse de DomoThib, `null` : le jeu tourne seul.
 */
export function connectHost(): Promise<DomoThib | null> {
  if (!__DOMOTHIB__) {
    return Promise.resolve(null);
  }
  return connectDomoThib().catch(() => null);
}
