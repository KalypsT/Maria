import { TITLE_IMAGE } from '../config/art';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import type { InstallHint } from '../core/platform/install';
import type { LoadReport } from '../core/save/SaveManager';
import type { SaveData } from '../core/save/saveData';
import { showImportDialog } from './SaveCodeDialog';

/** Ce que l'écran de départ sait de la PWA (D-23) : mise à jour prête, installation possible. */
export interface TitlePwa {
  readonly updateReady: boolean;
  readonly canInstall: boolean;
  applyUpdate: () => Promise<void>;
  promptInstall: () => Promise<void>;
  subscribe: (listener: () => void) => () => void;
}

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
  pwa: TitlePwa | null = null,
  hint: InstallHint = 'none',
): Promise<TitleChoice> {
  return new Promise((resolve) => {
    const root = element('div', document.body);
    root.id = 'title-screen';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    const portrait = element('img', root, 'title-celeste');
    portrait.src = TITLE_IMAGE;
    portrait.alt = '';
    portrait.draggable = false;
    const panel = element('div', root, 'title-panel');
    element('h1', panel, undefined, 'MARIA');
    let unsubscribe = () => {
      // Remplacé ci-dessous si la PWA est active.
    };
    const done = (choice: TitleChoice) => {
      unsubscribe();
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

    // Mise à jour et installation (D-23), recalculées quand l'état de la PWA change.
    const extra = element('div', panel, 'title-pwa');
    const renderPwa = () => {
      extra.replaceChildren();
      if (pwa?.updateReady) {
        element('p', extra, 'save-hint', 'Nouvelle version disponible.');
        element('button', extra, 'title-small', 'Mettre à jour').addEventListener('click', () => {
          void pwa.applyUpdate();
        });
      }
      if (pwa?.canInstall) {
        element('button', extra, 'title-small', 'Installer le jeu').addEventListener(
          'click',
          () => {
            void pwa.promptInstall();
          },
        );
      }
      if (hint === 'ios-share') {
        element(
          'p',
          extra,
          'save-hint title-install-hint',
          'Plein écran et sauvegarde protégée : Partager, puis « Sur l’écran d’accueil ». ' +
            'Une partie commencée ici se reprend là-bas avec le code de sauvegarde.',
        );
      }
    };
    renderPwa();
    if (pwa) {
      unsubscribe = pwa.subscribe(renderPwa);
    }
  });
}
