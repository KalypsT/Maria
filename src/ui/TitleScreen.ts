import { TITLE_IMAGES } from '../config/art';
import { growthPhase } from '../config/growth';
import { END_SCREEN, StoryFlag } from '../config/story';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import type { InstallHint } from '../core/platform/install';
import { formatPlayTime } from '../core/save/stats';
import type { SaveData } from '../core/save/saveData';
import {
  continueSlot,
  firstFreeSlot,
  formatSavedAt,
  slotData,
  slotUnreadable,
  type SlotSummary,
} from '../core/save/slots';
import { journeyProgress } from '../core/world/journeyProgress';
import { roomName, ZONES } from '../levels';
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
  | { kind: 'play'; slot: number }
  | { kind: 'new'; slot: number }
  | { kind: 'import'; slot: number; data: SaveData };

/** Les parties de l'appareil (D-184), telles que chargées au démarrage. */
export interface TitleSlots {
  summaries: SlotSummary[];
  /** La dernière partie jouée. */
  lastSlot: number;
  /** Efface une partie (principal et précédent) ; false si le stockage a refusé. */
  erase: (slot: number) => Promise<boolean>;
}

/** Le tremblé du crayon (D-175), un filtre SVG appliqué au titre par `style.css`. */
const TITLE_WOBBLE_ID = 'title-wobble';
const TITLE_WOBBLE_SVG =
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="${TITLE_WOBBLE_ID}" x="-5%" y="-5%" width="110%" height="110%">` +
  '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="noise"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="noise" scale="4"/></filter></svg>';

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

/** Céleste telle qu'elle est dans une partie (D-43) : l'image de sa phase. */
function portraitOf(data: Readonly<SaveData> | null): string {
  return TITLE_IMAGES[growthPhase(new Set(data?.story.flags ?? [])).outfit];
}

/** Une confirmation au second toucher : le bouton change de texte, puis revient s'il est oublié. */
function confirmButton(button: HTMLButtonElement, question: string, action: () => void): void {
  const label = button.textContent;
  let timer = 0;
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    if (timer === 0) {
      button.textContent = question;
      button.classList.add('title-confirm');
      timer = window.setTimeout(() => {
        timer = 0;
        button.textContent = label;
        button.classList.remove('title-confirm');
      }, SLOT_CONFIRM_MS);
      return;
    }
    window.clearTimeout(timer);
    timer = 0;
    action();
  });
}

/** Délai pour confirmer un effacement, après quoi le bouton revient à son texte. */
const SLOT_CONFIRM_MS = 4000;

/**
 * Écran de départ (placeholder, D-22, spec §21.3) : « Continuer » reprend la dernière partie jouée,
 * « Les parties » ouvre la page des parties (D-184), qui en montre trois (en commencer une, en
 * reprendre une, en effacer une) ; import d'un code. Après la fin du jeu (D-145), Maria sur son
 * étagère dans un coin de la page.
 */
export function showTitleScreen(
  slots: TitleSlots,
  pwa: TitlePwa | null = null,
  hint: InstallHint = 'none',
): Promise<TitleChoice> {
  return new Promise((resolve) => {
    const summaries = [...slots.summaries];
    const root = element('div', document.body);
    root.id = 'title-screen';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    const portrait = element('img', root, 'title-celeste');
    portrait.alt = '';
    portrait.draggable = false;
    const panel = element('div', root, 'title-panel');
    if (!document.getElementById(TITLE_WOBBLE_ID)) {
      document.body.insertAdjacentHTML('beforeend', TITLE_WOBBLE_SVG);
    }
    const corner = element('div', root, 'title-maria');
    const maria = element('img', corner);
    maria.src = END_SCREEN.mariaImage;
    maria.alt = '';
    maria.draggable = false;
    element('div', corner, 'title-maria-shelf');
    // La version (D-152), pour les retours d'essai.
    element('p', root, 'title-version', `Version ${__APP_VERSION__}`);
    let unsubscribe = () => {
      // Remplacé ci-dessous si la PWA est active.
    };
    const done = (choice: TitleChoice) => {
      unsubscribe();
      root.remove();
      resolve(choice);
    };
    const importInto = (slot: number) => {
      void showImportDialog().then((data) => {
        if (data) {
          done({ kind: 'import', slot, data });
        }
      });
    };

    const showMain = () => {
      unsubscribe();
      root.classList.remove('title-slots-open');
      panel.replaceChildren();
      const current = continueSlot(summaries, slots.lastSlot);
      const summary = summaries.find((s) => s.slot === current);
      const data = summary ? slotData(summary) : null;
      // Céleste telle qu'elle est dans la partie à reprendre (D-43).
      portrait.src = portraitOf(data);
      // Après la fin (D-145) : Maria, seule sur son étagère, dans un coin de la page.
      corner.style.display = data?.story.flags.includes(StoryFlag.FinaleGone) ? '' : 'none';
      // Le titre au crayon (D-175) : une lettre par crayon de couleur, le trait qui tremble.
      const title = element('h1', panel, 'title-name');
      title.setAttribute('aria-label', 'Maria');
      for (const letter of 'MARIA') {
        element('span', title, undefined, letter).setAttribute('aria-hidden', 'true');
      }
      if (current !== null && summary && data) {
        element('button', panel, 'pause-primary', 'Continuer').addEventListener('click', () => {
          done({ kind: 'play', slot: current });
        });
        const room = roomName(data.checkpoint.levelId);
        if (room) {
          element('p', panel, 'save-hint', room);
        }
        if (summary.report.source === 'previous') {
          element(
            'p',
            panel,
            'save-hint',
            'La dernière sauvegarde était abîmée : la précédente a été récupérée.',
          );
        }
        element('button', panel, undefined, 'Les parties').addEventListener('click', showSlots);
      } else {
        if (summaries.some(slotUnreadable)) {
          element('p', panel, 'save-error', 'Sauvegarde illisible.');
        }
        const free = firstFreeSlot(summaries);
        element('button', panel, 'pause-primary', 'Nouvelle partie').addEventListener(
          'click',
          () => {
            if (free === null) {
              showSlots();
            } else {
              done({ kind: 'new', slot: free });
            }
          },
        );
        if (free === null) {
          element('button', panel, undefined, 'Les parties').addEventListener('click', showSlots);
        }
      }
      // L'import remplace la partie à reprendre, ou va dans une place libre.
      const target = current ?? firstFreeSlot(summaries) ?? slots.lastSlot;
      element('button', panel, 'title-small', 'Importer un code').addEventListener('click', () => {
        importInto(target);
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
    };

    /** La page des parties (D-184) : une carte par emplacement. */
    function showSlots(): void {
      unsubscribe();
      unsubscribe = () => {
        // Pas de PWA sur cette page.
      };
      root.classList.add('title-slots-open');
      panel.replaceChildren();
      element('h2', panel, 'title-slots-heading', 'Les parties');
      const row = element('div', panel, 'title-slots');
      const now = Date.now();
      const zone = ZONES[0];
      for (const summary of summaries) {
        const { slot } = summary;
        const data = slotData(summary);
        const card = element('div', row, 'title-slot');
        const open = element('button', card, 'title-slot-open');
        const label = `Partie ${String(slot)}`;
        if (data) {
          const image = element('img', open, 'title-slot-portrait');
          image.src = portraitOf(data);
          image.alt = '';
          image.draggable = false;
          element('span', open, 'title-slot-name', label);
          element('span', open, 'title-slot-room', roomName(data.checkpoint.levelId) ?? '');
          const percent = zone ? `${String(journeyProgress(zone, data).percent)} % · ` : '';
          element(
            'span',
            open,
            'title-slot-line',
            `${percent}${formatPlayTime(data.stats.playMs)}`,
          );
          element('span', open, 'title-slot-line', formatSavedAt(data.savedAt, now));
          open.addEventListener('click', () => {
            done({ kind: 'play', slot });
          });
        } else if (slotUnreadable(summary)) {
          card.classList.add('title-slot-empty');
          element('span', open, 'title-slot-name', label);
          element('span', open, 'title-slot-line save-error', 'Sauvegarde illisible');
          open.disabled = true;
        } else {
          card.classList.add('title-slot-empty');
          element('span', open, 'title-slot-name', label);
          element('span', open, 'title-slot-new', 'Nouvelle partie');
          open.addEventListener('click', () => {
            done({ kind: 'new', slot });
          });
        }
        if (data || slotUnreadable(summary)) {
          const erase = element('button', card, 'title-slot-erase', 'Effacer');
          confirmButton(erase, 'Effacer pour de bon ?', () => {
            erase.disabled = true;
            void slots.erase(slot).then((erased) => {
              if (!erased) {
                erase.textContent = 'Échec : réessayer';
                erase.disabled = false;
                return;
              }
              const index = summaries.indexOf(summary);
              summaries[index] = {
                slot,
                report: {
                  data: null,
                  source: 'none',
                  mainProblem: null,
                  previousProblem: null,
                  readFailed: false,
                },
              };
              showSlots();
            });
          });
        }
      }
      element('button', panel, 'title-small', 'Retour').addEventListener('click', showMain);
    }

    showMain();
  });
}
