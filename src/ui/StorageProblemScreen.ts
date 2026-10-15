import type { StorageWaitReason } from '../core/save/openStorage';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

const MESSAGES: Readonly<Record<StorageWaitReason, string>> = {
  blocked:
    'Le jeu est déjà ouvert dans une autre fenêtre ou un autre onglet. Ferme-le, puis réessaie.',
  timeout:
    'Le jeu n’arrive pas à ouvrir tes parties. S’il est ouvert ailleurs, ferme-le, puis réessaie.',
};

/**
 * Les parties ne s'ouvrent pas (D-186) : IndexedDB ne répond pas, sans doute parce que le jeu est
 * ouvert ailleurs. Sur la page du cahier, comme « Oups ! » ; « Réessayer » rend la main au
 * démarrage, qui retente. On ne joue jamais dans un autre stockage sans le dire.
 */
export function showStorageProblem(reason: StorageWaitReason): Promise<void> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.id = 'storage-problem';
    root.className = 'save-dialog';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    const panel = document.createElement('div');
    panel.className = 'pause-panel error-panel';
    const title = document.createElement('h2');
    title.textContent = 'Un petit souci';
    const text = document.createElement('p');
    text.className = 'error-text';
    text.textContent = MESSAGES[reason];
    const hint = document.createElement('p');
    hint.className = 'save-hint';
    hint.textContent = 'Tes parties ne sont pas perdues.';
    const retry = document.createElement('button');
    retry.className = 'pause-primary';
    retry.type = 'button';
    retry.textContent = 'Réessayer';
    retry.addEventListener('click', () => {
      root.remove();
      resolve();
    });
    panel.append(title, text, hint, retry);
    root.append(panel);
    document.body.append(root);
  });
}
