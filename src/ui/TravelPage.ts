import type { TravelIcon } from '../config/travel';
import type { TravelState } from '../core/world/travel';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import { PLACE_ICONS } from './bagIcons';

const INK = '#3b3330';

/** Le jardin (la terrasse), qui n'a pas de page à lui dans le sac : un arbre et sa balançoire. */
const GARDEN_ICON = `<svg viewBox="0 0 40 40" aria-hidden="true">
<circle cx="20" cy="14" r="9" fill="#9cc7a4" stroke="${INK}" stroke-width="2"/>
<path d="M20 22v12M10 34h20" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="27" cy="27" r="2.6" fill="#d9788f" stroke="${INK}" stroke-width="1.4"/></svg>`;

const ICONS: Readonly<Record<TravelIcon, string>> = {
  house: PLACE_ICONS.house,
  garden: GARDEN_ICON,
  swing: PLACE_ICONS.swing,
  clock: PLACE_ICONS.clock,
  train: PLACE_ICONS.train,
  sea: PLACE_ICONS.sea,
};

/** Une veilleuse sur la page : où elle mène, et si l'on peut y aller d'ici. */
export interface TravelCard {
  readonly lantern: string;
  readonly title: string;
  readonly icon: TravelIcon;
  readonly state: TravelState;
}

/** Ce qu'on lit sous une veilleuse où l'on ne peut pas aller. */
const STATE_NOTES: Readonly<Record<Exclude<TravelState, 'open'>, string>> = {
  locked: 'Plus loin',
  here: 'Tu es ici',
  far: 'Pas d’ici',
};

/**
 * La page « Voyager » (D-189), en DOM par-dessus le jeu (arrêté pendant ce temps, comme le
 * tourne-disque) : ouverte seulement par Agir à une veilleuse bleue. Les six veilleuses du voyage,
 * chacune son lieu ; celles où l'on peut aller se touchent pour les choisir, puis « Partir ». Au
 * clavier ou à la manette : gauche et droite, puis Agir ou Saut. Toucher à côté, la croix, Pause
 * ou Carte referment.
 */
export class TravelPage {
  private readonly root: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly go: HTMLButtonElement;
  private cards: TravelCard[] = [];
  private buttons: HTMLButtonElement[] = [];
  /** Les veilleuses où l'on peut aller (indices dans `cards`). */
  private reachable: number[] = [];
  /** Le choix, dans `reachable` (-1 : aucun). */
  private index = -1;

  constructor(
    private readonly onChoose: (lantern: string) => void,
    private readonly onClose: () => void,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'travel-page';
    this.root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.root.hidden = true;
    const panel = document.createElement('div');
    panel.className = 'travel-panel';
    const title = document.createElement('h2');
    title.className = 'travel-title';
    title.textContent = 'Voyager';
    const close = document.createElement('button');
    close.className = 'travel-close';
    close.setAttribute('aria-label', 'Fermer');
    close.textContent = '×';
    close.addEventListener('click', () => {
      this.onClose();
    });
    this.grid = document.createElement('div');
    this.grid.className = 'travel-grid';
    this.go = document.createElement('button');
    this.go.className = 'travel-go';
    this.go.textContent = 'Partir';
    this.go.addEventListener('click', () => {
      this.confirm();
    });
    panel.append(title, close, this.grid, this.go);
    this.root.append(panel);
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) {
        this.onClose();
      }
    });
    document.body.append(this.root);
  }

  isOpen(): boolean {
    return !this.root.hidden;
  }

  /** Ouvre la page sur les veilleuses du voyage, sans choix. */
  open(cards: readonly TravelCard[]): void {
    this.cards = [...cards];
    this.grid.replaceChildren();
    this.buttons = [];
    this.reachable = [];
    this.cards.forEach((card, i) => {
      const button = document.createElement('button');
      button.className = `travel-card ${card.state}`;
      const icon = document.createElement('span');
      icon.className = 'travel-icon';
      // Une veilleuse pas encore débloquée : son lieu reste à découvrir.
      icon.innerHTML = card.state === 'locked' ? '?' : ICONS[card.icon];
      const name = document.createElement('span');
      name.className = 'travel-name';
      name.textContent = card.state === 'locked' ? '' : card.title;
      button.append(icon, name);
      if (card.state === 'open') {
        this.reachable.push(i);
        button.setAttribute('aria-label', `Aller : ${card.title}`);
        const slot = this.reachable.length - 1;
        button.addEventListener('click', () => {
          this.select(slot);
        });
      } else {
        button.disabled = true;
        const note = document.createElement('span');
        note.className = 'travel-note';
        note.textContent = STATE_NOTES[card.state];
        button.append(note);
        button.setAttribute(
          'aria-label',
          card.state === 'locked'
            ? STATE_NOTES.locked
            : `${card.title} : ${STATE_NOTES[card.state]}`,
        );
      }
      this.buttons.push(button);
      this.grid.append(button);
    });
    this.select(-1);
    this.root.hidden = false;
  }

  close(): void {
    this.root.hidden = true;
  }

  /** Clavier ou manette : la veilleuse suivante ou précédente où l'on peut aller. */
  move(dir: -1 | 1): void {
    const count = this.reachable.length;
    if (count === 0) {
      return;
    }
    this.select(this.index < 0 ? (dir > 0 ? 0 : count - 1) : (this.index + dir + count) % count);
  }

  /** Part vers la veilleuse choisie ; sans choix, rien. */
  confirm(): void {
    const card = this.cards[this.reachable[this.index] ?? -1];
    if (card) {
      this.onChoose(card.lantern);
    }
  }

  destroy(): void {
    this.root.remove();
  }

  private select(slot: number): void {
    this.index = slot;
    const chosen = this.reachable[slot] ?? -1;
    this.buttons.forEach((button, i) => {
      button.classList.toggle('selected', i === chosen);
    });
    this.go.disabled = chosen < 0;
  }
}
