import type { PlayableMemoryId } from '../config/playableMemories';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import {
  BACKPACK_PAGES,
  BACKPACK_TABS,
  tabOf,
  type BackpackPage,
  type BackpackTab,
} from '../core/world/backpack';
import { MAP_PLACES } from '../config/places';
import { NOTEBOOK_ICON, PLACE_ICONS, POUCH_ICON, SPARK_ICON, TREASURE_BOX_ICON } from './bagIcons';
import { NotebookPages, type NotebookContent } from './NotebookPages';
import { SettingsPanel, type SettingsPanelOptions } from './SettingsPanel';
import { TreasuresPage } from './TreasuresPage';

const TABS: Readonly<Record<BackpackTab, { label: string; icon: string }>> = {
  notebook: { label: 'Le cahier', icon: NOTEBOOK_ICON },
  treasures: { label: 'Mes trésors', icon: TREASURE_BOX_ICON },
  settings: { label: 'Réglages', icon: POUCH_ICON },
};

const PAGE_LABELS: Readonly<Record<BackpackPage, string>> = {
  map: 'La carte',
  journey: 'Mon voyage',
  abilities: 'Mes capacités',
  treasures: 'Mes trésors',
  settings: 'Réglages',
};

export interface BackpackOptions {
  readonly settings: Omit<SettingsPanelOptions, 'onPreview' | 'onResume'>;
  /** Le sac est refermé par le joueur (la croix, le fond) : le jeu reprend. */
  readonly onClose: () => void;
  /** Un souvenir jouable touché (D-89) : le sac se ferme, il se rejoue. */
  readonly onPlayMemory: (id: PlayableMemoryId) => void;
  /** La page des trésors a été regardée : ces trésors ne sont plus nouveaux (D-162). */
  readonly onTreasuresViewed: (ids: readonly string[]) => void;
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
  /** La carte (D-160) : la rangée des lieux à gauche, le nom du lieu et sa page à droite. */
  private readonly mapLayout: HTMLElement;
  private readonly places: HTMLElement;
  private readonly mapColumn: HTMLElement;
  private readonly placeName: HTMLElement;
  private readonly notebook: NotebookPages;
  private readonly treasures: TreasuresPage;
  private readonly settings: SettingsPanel;
  private readonly onTreasuresViewed: (ids: readonly string[]) => void;
  /** Un trésor nouveau, pas encore regardé : une étincelle sur la boîte à trésors. */
  private treasuresNew = false;
  private page: BackpackPage = 'map';
  private hasMap = false;
  private content: NotebookContent | null = null;
  /** Le lieu dont la carte est affichée. */
  private place: string | null = null;

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
      if (tab === 'treasures') {
        const spark = document.createElement('span');
        spark.className = 'bag-spark';
        spark.innerHTML = SPARK_ICON;
        button.append(spark);
      }
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
    this.mapLayout = document.createElement('div');
    this.mapLayout.className = 'bag-map';
    this.places = document.createElement('nav');
    this.places.className = 'bag-places';
    this.mapColumn = document.createElement('div');
    this.mapColumn.className = 'bag-map-page';
    this.placeName = document.createElement('h2');
    this.placeName.className = 'bag-place';
    this.mapLayout.append(this.places, this.mapColumn);
    page.append(close, this.head, this.body);
    bag.append(pocket, page);
    this.root.append(bag);
    // Toucher le fond, autour du sac, le referme.
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) {
        options.onClose();
      }
    });
    this.notebook = new NotebookPages();
    this.treasures = new TreasuresPage(options.onPlayMemory);
    this.onTreasuresViewed = options.onTreasuresViewed;
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
   * Ouvre le sac sur une page. `content` : les cartes des lieux visités (aucune dans un parcours
   * d'essai), la rangée des lieux, les souvenirs, les capacités, les chiffres. `onTravel` : ouvert
   * depuis une lanterne (le voyage rapide, D-163), une veilleuse touchée deux fois sur la carte.
   */
  open(
    page: BackpackPage,
    content: NotebookContent,
    onTravel: ((lantern: string) => void) | null = null,
  ): void {
    this.content = content;
    this.notebook.setTravel(onTravel);
    this.root.classList.toggle('travel', onTravel !== null);
    this.hasMap = content.startPlace !== null;
    this.treasuresNew = content.treasures?.hasNew ?? false;
    // Sans partie (un parcours d'essai), pas de trésors.
    const treasuresTab = this.tabButtons.get('treasures');
    if (treasuresTab) {
      treasuresTab.hidden = content.treasures === null;
    }
    this.notebook.setContent(content);
    this.showPlace(content.startPlace);
    this.settings.refresh();
    this.root.classList.remove('previewing');
    this.root.hidden = false;
    this.show(page === 'map' && !this.hasMap ? 'settings' : page);
  }

  close(): void {
    this.root.hidden = true;
    this.notebook.stop();
    this.notebook.setTravel(null);
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
    if (page === 'treasures') {
      this.treasuresNew = false;
    }
    for (const [key, button] of this.tabButtons) {
      button.classList.toggle('active', key === tab);
      button.classList.toggle('new', key === 'treasures' && this.treasuresNew);
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
    if (page === 'treasures') {
      this.notebook.stop();
      this.showTreasures();
      return;
    }
    if (page === 'map') {
      this.mapColumn.replaceChildren(this.placeName, this.notebook.canvas);
      this.body.replaceChildren(this.mapLayout);
    } else {
      this.body.replaceChildren(this.notebook.canvas);
    }
    this.notebook.show(page);
  }

  /**
   * La page des trésors (D-162) : leur compte en haut ; les trésors trouvés sont regardés (leurs
   * points « nouveau » restent pour cette ouverture du sac).
   */
  private showTreasures(): void {
    const book = this.content?.treasures;
    if (!book || !this.content) {
      this.body.replaceChildren();
      return;
    }
    this.treasures.render(book, this.content.names);
    const total = document.createElement('span');
    total.className = 'bag-total';
    total.textContent = this.treasures.total;
    this.head.append(total);
    this.body.replaceChildren(this.treasures.element);
    this.onTreasuresViewed(
      [...book.families.flatMap((family) => family.cells), ...book.records]
        .filter((cell) => cell.found)
        .map((cell) => cell.id),
    );
  }

  /** Feuillette le cahier jusqu'à la carte d'un lieu visité (D-160). */
  private showPlace(place: string | null): void {
    const map = place !== null ? this.content?.maps.get(place) : undefined;
    this.place = map ? place : null;
    this.placeName.textContent = map?.title ?? '';
    this.notebook.setMap(map ?? null);
    this.renderPlaces();
  }

  /**
   * La rangée des lieux, à gauche de la carte (choix de l'utilisateur, D-160) : un pictogramme par
   * lieu visité (celui de Céleste marqué d'un point rose ; tout trouvé, il se colorie), puis un « ? »
   * pour le prochain.
   */
  private renderPlaces(): void {
    const content = this.content;
    if (!content) {
      return;
    }
    this.places.replaceChildren(
      ...content.places.map((place) => {
        const info = MAP_PLACES.find((candidate) => candidate.id === place.id);
        if (place.state === 'next' || !info) {
          const unknown = document.createElement('span');
          unknown.className = 'bag-place-icon unknown';
          unknown.textContent = '?';
          return unknown;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'bag-place-icon';
        button.innerHTML = PLACE_ICONS[info.icon];
        button.setAttribute('aria-label', info.title);
        button.title = info.title;
        const shells = content.maps.get(place.id)?.model.shells;
        button.classList.toggle('active', place.id === this.place);
        button.classList.toggle(
          'complete',
          !!shells && shells.total > 0 && shells.found === shells.total,
        );
        if (place.here) {
          const dot = document.createElement('span');
          dot.className = 'bag-here';
          button.append(dot);
        }
        button.addEventListener('click', () => {
          if (place.id !== this.place) {
            this.showPlace(place.id);
          }
        });
        return button;
      }),
    );
  }
}
