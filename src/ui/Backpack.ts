import type { PlayableMemoryId } from '../config/playableMemories';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import {
  BACKPACK_PAGES,
  BACKPACK_TABS,
  tabOf,
  type BackpackPage,
  type BackpackTab,
} from '../core/world/backpack';
import { NOTEBOOK_ICON, POUCH_ICON, TREASURE_BOX_ICON } from './bagIcons';
import { NotebookPages, type NotebookContent } from './NotebookPages';
import { SettingsPanel, type SettingsPanelOptions } from './SettingsPanel';

const TABS: Readonly<Record<BackpackTab, { label: string; icon: string }>> = {
  notebook: { label: 'Le cahier', icon: NOTEBOOK_ICON },
  treasures: { label: 'Mes trésors', icon: TREASURE_BOX_ICON },
  settings: { label: 'Réglages', icon: POUCH_ICON },
};

const PAGE_LABELS: Readonly<Record<BackpackPage, string>> = {
  map: 'La carte',
  journey: 'Mon voyage',
  abilities: 'Mes capacités',
  memories: 'Mes souvenirs',
  maria: 'Les affaires de Maria',
  strange: 'Monde étrange',
  settings: 'Réglages',
};

export interface BackpackOptions {
  readonly settings: Omit<SettingsPanelOptions, 'onPreview' | 'onResume'>;
  /** Le sac est refermé par le joueur (la croix, le fond) : le jeu reprend. */
  readonly onClose: () => void;
  /** Un souvenir jouable touché (D-89) : le sac se ferme, il se rejoue. */
  readonly onPlayMemory: (id: PlayableMemoryId) => void;
}

/**
 * Le sac à dos de Céleste (D-159), par-dessus le jeu en pause : à gauche, la poche et ses trois
 * objets (le cahier, les trésors, la trousse des réglages) ; à droite, la page de l'objet choisi,
 * ses sous-onglets écrits à la main, une croix pour refermer.
 */
export class Backpack {
  private readonly root: HTMLElement;
  private readonly tabButtons = new Map<BackpackTab, HTMLButtonElement>();
  private readonly head: HTMLElement;
  private readonly body: HTMLElement;
  private readonly place: HTMLElement;
  private readonly notebook: NotebookPages;
  private readonly settings: SettingsPanel;
  private page: BackpackPage = 'map';
  private hasMap = false;

  constructor(options: BackpackOptions) {
    this.root = document.createElement('div');
    this.root.id = 'backpack';
    this.root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.root.hidden = true;
    const bag = document.createElement('div');
    bag.className = 'bag';
    const pocket = document.createElement('nav');
    pocket.className = 'bag-pocket';
    for (const tab of BACKPACK_TABS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bag-object';
      button.innerHTML = `${TABS[tab].icon}<span>${TABS[tab].label}</span>`;
      button.addEventListener('click', () => {
        if (tabOf(this.page) !== tab) {
          this.show(this.firstPage(tab));
        }
      });
      pocket.append(button);
      this.tabButtons.set(tab, button);
    }
    const page = document.createElement('section');
    page.className = 'bag-page';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'bag-close';
    close.setAttribute('aria-label', 'Fermer le sac');
    close.textContent = '×';
    close.addEventListener('click', () => {
      options.onClose();
    });
    this.head = document.createElement('div');
    this.head.className = 'bag-head';
    this.body = document.createElement('div');
    this.body.className = 'bag-body';
    this.place = document.createElement('h2');
    this.place.className = 'bag-place';
    page.append(close, this.head, this.body);
    bag.append(pocket, page);
    this.root.append(bag);
    // Toucher le fond, autour du sac, le referme.
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) {
        options.onClose();
      }
    });
    this.notebook = new NotebookPages(options.onPlayMemory);
    this.settings = new SettingsPanel({
      ...options.settings,
      onResume: options.onClose,
      onPreview: (active) => {
        this.root.classList.toggle('previewing', active);
      },
    });
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /**
   * Ouvre le sac sur une page. `content` : la carte du lieu (null sans carte, dans un parcours
   * d'essai), les souvenirs, les capacités, les chiffres ; `placeTitle` : le nom du lieu.
   */
  open(page: BackpackPage, content: NotebookContent, placeTitle: string): void {
    this.hasMap = content.model !== null;
    this.place.textContent = placeTitle;
    this.notebook.setContent(content);
    this.settings.refresh();
    this.root.classList.remove('previewing');
    this.root.hidden = false;
    this.show(page === 'map' && !this.hasMap ? 'settings' : page);
  }

  close(): void {
    this.root.hidden = true;
    this.notebook.stop();
  }

  destroy(): void {
    this.close();
    this.root.remove();
  }

  /** La première page d'un onglet (le cahier sans carte commence à Mon voyage). */
  private firstPage(tab: BackpackTab): BackpackPage {
    const pages = this.pagesOf(tab);
    return pages[0] ?? 'settings';
  }

  private pagesOf(tab: BackpackTab): readonly BackpackPage[] {
    return BACKPACK_PAGES[tab].filter((page) => page !== 'map' || this.hasMap);
  }

  private show(page: BackpackPage): void {
    this.page = page;
    const tab = tabOf(page);
    for (const [key, button] of this.tabButtons) {
      button.classList.toggle('active', key === tab);
    }
    const pages = this.pagesOf(tab);
    this.head.replaceChildren(
      ...pages.map((candidate) => {
        const sub = document.createElement('button');
        sub.type = 'button';
        sub.className = 'bag-sub';
        sub.textContent = PAGE_LABELS[candidate];
        sub.classList.toggle('active', candidate === page);
        sub.addEventListener('click', () => {
          if (candidate !== this.page) {
            this.show(candidate);
          }
        });
        return sub;
      }),
    );
    if (page === 'settings') {
      this.notebook.stop();
      this.body.replaceChildren(this.settings.element);
      return;
    }
    this.body.replaceChildren(...(page === 'map' ? [this.place] : []), this.notebook.canvas);
    this.notebook.show(page);
  }
}
