import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import {
  SAVE_PROBLEM_LABEL,
  decodeSaveCode,
  encodeSaveCode,
  type SaveData,
} from '../core/save/saveData';

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

function dialog(title: string): { root: HTMLElement; panel: HTMLElement; close: () => void } {
  const root = element('div', document.body, 'save-dialog');
  root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
  const panel = element('div', root, 'pause-panel');
  element('h2', panel, undefined, title);
  return {
    root,
    panel,
    close: () => {
      root.remove();
    },
  };
}

/** Affiche le code de sauvegarde à copier (D-22). */
export function showExportDialog(data: Readonly<SaveData>): void {
  const { panel, close } = dialog('Code de sauvegarde');
  element(
    'p',
    panel,
    'save-hint',
    'Garde ce code en lieu sûr (note, message) : il permet de retrouver ta partie sur un autre appareil ou si le navigateur efface ses données.',
  );
  const area = element('textarea', panel, 'save-code');
  area.readOnly = true;
  area.value = encodeSaveCode(data);
  const actions = element('div', panel, 'pause-choice');
  const copy = element('button', actions, 'pause-primary', 'Copier');
  copy.addEventListener('click', () => {
    area.select();
    void navigator.clipboard.writeText(area.value).then(
      () => {
        copy.textContent = 'Copié !';
      },
      () => {
        copy.textContent = 'Sélectionné : copie manuelle';
      },
    );
  });
  element('button', actions, undefined, 'Fermer').addEventListener('click', close);
}

/**
 * Demande un code de sauvegarde à importer. Résout avec les données valides, ou null si annulé.
 * Un code abîmé est refusé avec la raison, sans rien remplacer.
 */
export function showImportDialog(): Promise<SaveData | null> {
  return new Promise((resolve) => {
    const { panel, close } = dialog('Importer une sauvegarde');
    element('p', panel, 'save-hint', 'Colle ici un code de sauvegarde (il commence par MARIA1).');
    const area = element('textarea', panel, 'save-code');
    area.placeholder = 'MARIA1.…';
    const error = element('p', panel, 'save-error');
    const actions = element('div', panel, 'pause-choice');
    element('button', actions, 'pause-primary', 'Importer').addEventListener('click', () => {
      const result = decodeSaveCode(area.value);
      if (!result.ok) {
        error.textContent = `Code refusé : sauvegarde ${SAVE_PROBLEM_LABEL[result.problem]}.`;
        return;
      }
      close();
      resolve(result.data);
    });
    element('button', actions, undefined, 'Annuler').addEventListener('click', () => {
      close();
      resolve(null);
    });
  });
}
