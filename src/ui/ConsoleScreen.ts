import { ARCADE_TITLE, ArcadeMode, type ArcadeGameId } from '../config/arcade';
import { playable, type ConsoleCard } from '../core/arcade/consoleMenu';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

/** Pictogrammes des jeux (PLACEHOLDER, comme la maquette) : des traits simples, 24 × 24. */
const GAME_ICONS: Readonly<Record<ArcadeGameId, string>> = {
  jumps:
    '<rect x="1" y="16" width="7" height="4"/><rect x="16" y="10" width="7" height="4"/><path d="M6 13 Q11 2 17 8" fill="none" stroke-dasharray="2 2"/>',
  climb:
    '<rect x="4" y="2" width="4" height="20"/><rect x="8" y="8" width="10" height="3"/><rect x="8" y="16" width="14" height="3"/>',
  chimney:
    '<rect x="2" y="0" width="3" height="24"/><rect x="19" y="0" width="3" height="24"/><path d="M7 21 L17 14 L7 7 L15 2" fill="none"/>',
  wind: '<path d="M2 10 A10 7 0 0 1 22 10 Z"/><rect x="11" y="10" width="2" height="10"/><path d="M2 21 Q8 17 14 21 T22 18" fill="none"/>',
  cables:
    '<path d="M0 3 L24 13" fill="none"/><path d="M5 13 A7 4 0 0 1 19 13 Z"/><rect x="11" y="8" width="2" height="13"/>',
  corridor:
    '<rect x="0" y="5" width="24" height="3"/><rect x="0" y="21" width="24" height="3"/><rect x="5" y="16" width="12" height="4"/><circle cx="18" cy="17" r="2.5"/>',
  worlds:
    '<rect x="2" y="7" width="12" height="12" fill="none"/><rect x="10" y="3" width="12" height="12" fill="none" stroke-dasharray="2 2"/>',
  monster:
    '<path d="M3 22 L3 14 A9 9 0 0 1 21 14 L21 22 Z"/><rect x="8" y="11" width="3" height="3" class="eye"/><rect x="14" y="11" width="3" height="3" class="eye"/>',
};

const LOCK_ICON =
  '<rect x="6" y="11" width="12" height="9" rx="1"/><path d="M8.5 11 V8 A3.5 3.5 0 0 1 15.5 8 V11" fill="none"/>';

function icon(svg: string): SVGSVGElement {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${svg}</svg>`;
  return wrap.firstElementChild as SVGSVGElement;
}

function button(text: string, className: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = text;
  return b;
}

export interface ConsoleHandlers {
  /** Un jeu et un mode choisis : la partie commence. */
  readonly play: (game: ArcadeGameId, mode: ArcadeMode) => void;
  /** Rejouer la même partie depuis le niveau 1. */
  readonly replay: () => void;
  /** Le menu de la console (après une partie). */
  readonly menu: () => void;
  /** Éteindre : retour dans la chambre. */
  readonly off: () => void;
  /** Un bip de navigation (le choix bouge, un choix validé). */
  readonly beep: (kind: 'move' | 'select') => void;
}

type View = 'closed' | 'menu' | 'mode' | 'result' | 'play';

/**
 * L'écran de la console (D-166), en DOM par-dessus le jeu, dans le style pastel choisi sur la
 * maquette : le menu des jeux (débloqués avec leurs capacités, leur record), le choix du mode (le
 * mode Sans fin viendra plus tard), l'écran de fin (« Oups ! », le score, le record), et pendant la
 * partie, seulement le compteur et l'annonce du niveau. Au doigt, ou au clavier et à la manette :
 * gauche et droite, Saut ou Agir pour choisir, Pause ou Carte pour revenir.
 */
export class ConsoleScreen {
  private readonly root: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly hudLevel: HTMLElement;
  private readonly hudMeters: HTMLElement;
  private readonly hudRecord: HTMLElement;
  private readonly banner: HTMLElement;
  private view: View = 'closed';
  private focus: HTMLButtonElement[] = [];
  private index = 0;
  private cards: readonly ConsoleCard[] = [];
  private shownHud = '';
  private shownBanner: string | null = null;

  constructor(
    private readonly handlers: ConsoleHandlers,
    parent: HTMLElement = document.body,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'console-screen';
    this.root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.root.hidden = true;
    this.panel = document.createElement('div');
    this.panel.className = 'console-panel';
    this.root.append(this.panel);

    this.hud = document.createElement('div');
    this.hud.id = 'console-hud';
    this.hud.setAttribute('role', 'status');
    this.hud.hidden = true;
    this.hudLevel = document.createElement('span');
    this.hudMeters = document.createElement('strong');
    this.hudRecord = document.createElement('span');
    this.hud.append(this.hudLevel, this.hudMeters, this.hudRecord);
    this.banner = document.createElement('div');
    this.banner.id = 'console-banner';
    this.banner.hidden = true;
    parent.append(this.root, this.hud, this.banner);
  }

  /** Un écran de la console est ouvert (menu, mode, fin) : le jeu attend. */
  isOpen(): boolean {
    return this.view === 'menu' || this.view === 'mode' || this.view === 'result';
  }

  /** La console est allumée (un écran, ou une partie en cours). */
  get on(): boolean {
    return this.view !== 'closed';
  }

  /** Le menu des jeux ; `cards` : d'après la partie (déblocage, records). */
  showMenu(cards: readonly ConsoleCard[]): void {
    this.cards = cards;
    const title = document.createElement('h2');
    title.className = 'console-title';
    title.textContent = ARCADE_TITLE;
    const grid = document.createElement('div');
    grid.className = 'console-grid';
    const focus: HTMLButtonElement[] = [];
    /** Le premier jeu jouable reçoit la surbrillance. */
    let first = -1;
    for (const card of cards) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'console-card';
      if (!card.unlocked) {
        cell.classList.add('locked');
        cell.disabled = true;
        cell.setAttribute('aria-label', 'Jeu à débloquer');
        cell.append(icon(LOCK_ICON));
      } else {
        cell.append(icon(GAME_ICONS[card.game.id]));
        const name = document.createElement('span');
        name.className = 'console-name';
        name.textContent = card.game.name;
        const note = document.createElement('span');
        note.className = 'console-note';
        note.textContent = !card.ready
          ? 'bientôt'
          : card.record > 0
            ? `★ ${String(card.record)} m`
            : '—';
        cell.append(name, note);
        if (!card.ready) {
          cell.classList.add('soon');
        }
        cell.addEventListener('click', () => {
          this.choose(card);
        });
        if (first < 0 && playable(card)) {
          first = focus.length;
        }
        focus.push(cell);
      }
      grid.append(cell);
    }
    const off = button('Éteindre', 'console-button console-off');
    off.addEventListener('click', () => {
      this.handlers.off();
    });
    focus.push(off);
    this.panel.replaceChildren(title, grid, off);
    this.open('menu', focus, Math.max(0, first));
  }

  /** Le choix du mode d'un jeu. */
  private showModes(card: ConsoleCard): void {
    const title = document.createElement('h2');
    title.className = 'console-title';
    title.append(icon(GAME_ICONS[card.game.id]), card.game.name);
    const row = document.createElement('div');
    row.className = 'console-modes';
    const levels = button('', 'console-mode');
    levels.append(
      Object.assign(document.createElement('strong'), { textContent: 'Niveaux' }),
      Object.assign(document.createElement('span'), { textContent: 'Niveau 1, 2, 3…' }),
      Object.assign(document.createElement('span'), {
        className: 'console-note',
        textContent: card.record > 0 ? `Record ★ ${String(card.record)} m` : 'Record —',
      }),
    );
    levels.addEventListener('click', () => {
      this.handlers.beep('select');
      this.handlers.play(card.game.id, ArcadeMode.Levels);
    });
    const endless = button('', 'console-mode');
    endless.disabled = true;
    endless.append(
      Object.assign(document.createElement('strong'), { textContent: 'Sans fin' }),
      Object.assign(document.createElement('span'), { textContent: 'Le plus loin possible' }),
      Object.assign(document.createElement('span'), {
        className: 'console-note',
        textContent: 'bientôt',
      }),
    );
    row.append(levels, endless);
    const back = button('Retour', 'console-button');
    back.addEventListener('click', () => {
      this.back();
    });
    this.panel.replaceChildren(title, row, back);
    this.open('mode', [levels, back], 0);
  }

  /** L'écran de fin : le score, le record (ou « Nouveau record ! »). */
  showResult(score: number, record: number, isNew: boolean): void {
    const title = document.createElement('h2');
    title.className = 'console-title';
    title.textContent = 'Oups !';
    const scoreLine = document.createElement('p');
    scoreLine.className = 'console-score';
    scoreLine.textContent = `${String(score)} m`;
    const recordLine = document.createElement('p');
    recordLine.className = isNew ? 'console-record new' : 'console-record';
    recordLine.textContent = isNew ? 'Nouveau record !' : `Record ★ ${String(record)} m`;
    const row = document.createElement('div');
    row.className = 'console-actions';
    const replay = button('Rejouer', 'console-button primary');
    replay.addEventListener('click', () => {
      this.handlers.beep('select');
      this.handlers.replay();
    });
    const menu = button('Menu', 'console-button');
    menu.addEventListener('click', () => {
      this.handlers.beep('select');
      this.handlers.menu();
    });
    row.append(replay, menu);
    this.panel.replaceChildren(title, scoreLine, recordLine, row);
    this.open('result', [replay, menu], 0);
  }

  /** Pendant la partie : seulement le compteur et l'annonce. */
  showPlay(): void {
    this.view = 'play';
    this.root.hidden = true;
    this.hud.hidden = false;
  }

  /** Le compteur : le niveau, les mètres, le record ; le DOM n'est écrit que s'il change. */
  setHud(level: number, meters: number, record: number): void {
    const key = `${String(level)}|${String(meters)}|${String(record)}`;
    if (key === this.shownHud) {
      return;
    }
    this.shownHud = key;
    this.hudLevel.textContent = `Niveau ${String(level)}`;
    this.hudMeters.textContent = `${String(meters)} m`;
    this.hudRecord.textContent = record > 0 ? `★ ${String(record)} m` : '★ —';
  }

  /** L'annonce au milieu de l'écran (« Niveau 2 », « Niveau 2 réussi ! ») ; null : aucune. */
  setBanner(text: string | null): void {
    if (text === this.shownBanner) {
      return;
    }
    this.shownBanner = text;
    this.banner.hidden = text === null;
    this.banner.textContent = text ?? '';
  }

  /** La console s'éteint. */
  close(): void {
    this.view = 'closed';
    this.root.hidden = true;
    this.hud.hidden = true;
    this.setBanner(null);
    this.shownHud = '';
  }

  /** Clavier ou manette : le choix suivant ou précédent. */
  move(dir: -1 | 1): void {
    if (!this.isOpen() || this.focus.length === 0) {
      return;
    }
    this.index = (this.index + dir + this.focus.length) % this.focus.length;
    this.highlight();
    this.handlers.beep('move');
  }

  /** Clavier ou manette : valide le choix en surbrillance. */
  confirm(): void {
    if (this.isOpen()) {
      this.focus[this.index]?.click();
    }
  }

  /** Pause ou Carte : revenir (du mode au menu, de la fin au menu, du menu : éteindre). */
  back(): void {
    if (this.view === 'mode') {
      this.showMenu(this.cards);
    } else if (this.view === 'result') {
      this.handlers.menu();
    } else if (this.view === 'menu') {
      this.handlers.off();
    }
  }

  destroy(): void {
    this.root.remove();
    this.hud.remove();
    this.banner.remove();
  }

  private choose(card: ConsoleCard): void {
    if (!playable(card)) {
      return;
    }
    this.handlers.beep('select');
    this.showModes(card);
  }

  private open(view: View, focus: HTMLButtonElement[], index: number): void {
    this.view = view;
    this.focus = focus;
    this.index = index;
    this.root.hidden = false;
    this.hud.hidden = true;
    this.setBanner(null);
    this.highlight();
  }

  private highlight(): void {
    this.focus.forEach((b, i) => {
      b.classList.toggle('selected', i === this.index);
    });
  }
}
