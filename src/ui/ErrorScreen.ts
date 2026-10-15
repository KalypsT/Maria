import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

let shown = false;

/**
 * L'écran « Oups » (D-182) : le jeu s'est arrêté sur une erreur. Sans jargon, sur la page du
 * cahier ; « Reprendre » recharge la page (la partie est sauvegardée à la dernière lanterne,
 * « Continuer » y ramène). Le détail technique, en petit, aide aux retours d'essai. Une seule fois.
 */
export function showErrorScreen(detail: string | null, onResume: () => void): void {
  if (shown) {
    return;
  }
  shown = true;
  const root = document.createElement('div');
  root.id = 'error-screen';
  root.className = 'save-dialog';
  root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
  const panel = document.createElement('div');
  panel.className = 'pause-panel error-panel';
  const title = document.createElement('h2');
  title.textContent = 'Oups !';
  const text = document.createElement('p');
  text.className = 'error-text';
  text.textContent = 'Le jeu s’est emmêlé les crayons.';
  const hint = document.createElement('p');
  hint.className = 'save-hint';
  hint.textContent = 'Ta partie est gardée : tu reprendras à la dernière lanterne.';
  const resume = document.createElement('button');
  resume.className = 'pause-primary';
  resume.type = 'button';
  resume.textContent = 'Reprendre';
  resume.addEventListener('click', () => {
    resume.disabled = true;
    onResume();
  });
  panel.append(title, text, hint, resume);
  if (detail) {
    const small = document.createElement('p');
    small.className = 'error-detail';
    small.textContent = detail;
    panel.append(small);
  }
  root.append(panel);
  document.body.append(root);
}
