import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import type { LoadReport } from '../core/save/SaveManager';
import type { SaveData } from '../core/save/saveData';
import { showImportDialog } from './SaveCodeDialog';

export type TitleChoice =
  { kind: 'continue' } | { kind: 'new' } | { kind: 'import'; data: SaveData };

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  parent: HTMLElement,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  parent.appendChild(el);
  return el;
}

/**
 * Écran de départ minimal (placeholder, D-22, spec §21.3) : « Continuer » s'il existe une
 * sauvegarde, « Nouvelle partie » (confirmée si elle efface une partie), import d'un code.
 */
export function showTitleScreen(
  report: LoadReport,
  levelName: string | null,
): Promise<TitleChoice> {
  return new Promise((resolve) => {
    const root = element('div', document.body);
    root.id = 'title-screen';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    const panel = element('div', root, 'title-panel');
    element('h1', panel, undefined, 'MARIA');
    const done = (choice: TitleChoice) => {
      root.remove();
      resolve(choice);
    };
    if (report.data) {
      const resume = element('button', panel, 'pause-primary', 'Continuer');
      resume.addEventListener('click', () => {
        done({ kind: 'continue' });
      });
      if (levelName) {
        element('p', panel, 'save-hint', levelName);
      }
      if (report.source === 'previous') {
        element(
          'p',
          panel,
          'save-hint',
          'La dernière sauvegarde était abîmée : la précédente a été récupérée.',
        );
      }
    } else if (report.mainProblem !== null || report.previousProblem !== null) {
      element('p', panel, 'save-error', 'Sauvegarde illisible : une nouvelle partie commence.');
    }
    const fresh = element(
      'button',
      panel,
      report.data ? undefined : 'pause-primary',
      'Nouvelle partie',
    );
    let confirming = false;
    fresh.addEventListener('click', () => {
      if (report.data && !confirming) {
        confirming = true;
        fresh.textContent = 'Effacer la partie en cours ?';
        return;
      }
      done({ kind: 'new' });
    });
    element('button', panel, 'title-small', 'Importer un code').addEventListener('click', () => {
      void showImportDialog().then((data) => {
        if (data) {
          done({ kind: 'import', data });
        }
      });
    });
  });
}
