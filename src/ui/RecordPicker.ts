import type { RecordId } from '../config/records';
import {
  firstChoice,
  moveChoice,
  recordChoices,
  type RecordChoice,
  type RecordSleeve,
} from '../core/audio/records';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Le tourne-disque du grenier (D-121), en DOM par-dessus le jeu (arrêté pendant ce temps, comme la
 * carte) : une rangée de pochettes sans texte. Une pochette trouvée se touche pour jouer son
 * disque ; une pochette vide (en pointillés) attend son disque ; « arrêter » (un carré) seulement
 * si un disque joue. Au clavier ou à la manette : gauche et droite, puis Agir ou Saut. Toucher à
 * côté, Pause ou Carte referment.
 */
export class RecordPicker {
  private readonly root: HTMLElement;
  private readonly row: HTMLElement;
  private buttons: HTMLButtonElement[] = [];
  private choices: RecordChoice[] = [];
  private index = 0;

  constructor(
    private readonly onChoose: (choice: RecordChoice) => void,
    private readonly onClose: () => void,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'record-picker';
    this.root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.root.hidden = true;
    this.row = document.createElement('div');
    this.row.className = 'record-row';
    this.root.append(this.row);
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

  /** Ouvre le tourne-disque avec ses pochettes ; `playing` : le disque qui joue (il tourne). */
  open(shelf: readonly RecordSleeve[], playing: RecordId | null): void {
    this.row.replaceChildren();
    this.buttons = [];
    this.choices = recordChoices(shelf, playing);
    for (const sleeve of shelf) {
      const button = document.createElement('button');
      button.className = 'record-sleeve';
      button.style.setProperty('--sleeve', hex(sleeve.sleeve));
      if (!sleeve.found) {
        button.classList.add('empty');
        button.disabled = true;
        button.setAttribute('aria-label', 'Disque à trouver');
      } else {
        button.setAttribute('aria-label', sleeve.title);
        if (sleeve.id === playing) {
          button.classList.add('playing');
        }
        const disc = document.createElement('span');
        disc.className = 'record-disc';
        button.append(disc);
        this.bind(button, sleeve.id);
      }
      this.row.append(button);
    }
    if (playing !== null) {
      const stop = document.createElement('button');
      stop.className = 'record-stop';
      stop.setAttribute('aria-label', 'Arrêter le disque');
      this.bind(stop, 'stop');
      this.row.append(stop);
    }
    this.index = firstChoice(this.choices, playing);
    this.highlight();
    this.root.hidden = false;
  }

  close(): void {
    this.root.hidden = true;
  }

  /** Clavier ou manette : choix suivant ou précédent. */
  move(dir: -1 | 1): void {
    this.index = moveChoice(this.index, dir, this.choices.length);
    this.highlight();
  }

  /** Clavier ou manette : joue (ou arrête) le choix en surbrillance. */
  confirm(): void {
    const choice = this.choices[this.index];
    if (choice !== undefined) {
      this.onChoose(choice);
    }
  }

  destroy(): void {
    this.root.remove();
  }

  private bind(button: HTMLButtonElement, choice: RecordChoice): void {
    this.buttons.push(button);
    button.addEventListener('click', () => {
      this.onChoose(choice);
    });
  }

  private highlight(): void {
    this.buttons.forEach((button, i) => {
      button.classList.toggle('selected', i === this.index);
    });
  }
}
