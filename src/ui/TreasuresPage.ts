import { ART_IMAGES } from '../config/art';
import { MEMORY_NAMES, flashbackOf, isMemory } from '../config/memories';
import { playableOf, type PlayableMemoryId } from '../config/playableMemories';
import { RECORDS, recordSlot, type RecordSlot } from '../config/records';
import type {
  TreasureBook,
  TreasureCell,
  TreasureFamilyId,
  TreasureWhere,
} from '../core/world/treasureBook';
import { drawFlashback } from '../scenes/art/flashbackArt';
import { flashbackImage } from './flashbackImages';
import { drawnCanvas, recordDrawing, treasureDrawing } from './treasureDrawing';

/** Les noms des lieux et des salles, pour les indices et les fiches. */
export interface TreasureNames {
  place(id: string): string;
  room(id: string): string;
}

/** Un jalon pas encore vécu (D-180) : sous sa case, et sur sa fiche. */
const MILESTONE_SHORT = 'plus loin';
const MILESTONE_LONG = 'Plus loin dans mon voyage';

/** La famille d'un trésor ou d'un disque (sa couleur, son titre sur la fiche). */
type FamilyKey = TreasureFamilyId | 'records';

const FAMILY_TITLES: Readonly<Record<FamilyKey, string>> = {
  memories: 'Mes souvenirs',
  maria: 'Les affaires de Maria',
  strange: 'Monde étrange',
  records: 'Disques',
};

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
 * La page des trésors du sac (D-159, D-162) : à gauche, les souvenirs, les affaires de Maria et le
 * monde étrange, une couleur par famille, en pointillés tant qu'ils manquent, avec l'indice de
 * leur lieu ; à droite, les coquilles lieu par lieu, et les disques trouvés. Toucher une case ouvre
 * sa fiche : le dessin en grand, son nom, où il est, « Revoir le souvenir ».
 */
export class TreasuresPage {
  readonly element: HTMLElement;
  private readonly shellImage = new Image();
  private book: TreasureBook | null = null;
  private names: TreasureNames = { place: (id) => id, room: (id) => id };

  constructor(
    /** Un souvenir jouable (D-89) : le sac se ferme, il se rejoue. */
    private readonly onPlayMemory: (id: PlayableMemoryId) => void,
  ) {
    this.shellImage.src = `art/${ART_IMAGES['shell'] ?? 'shell.png'}`;
    this.element = document.createElement('div');
    this.element.className = 'treasures';
  }

  /** Le compte de la page : les trésors et les coquilles trouvés, et en tout. */
  get total(): string {
    const total = this.book?.total;
    return total ? `${String(total.found)} / ${String(total.total)}` : '';
  }

  /** Dessine la page (les points « nouveau » sont ceux de cette ouverture du sac). */
  render(book: TreasureBook, names: TreasureNames): void {
    this.book = book;
    this.names = names;
    this.element.replaceChildren();
    const left = element('div', this.element, 'treasure-column');
    for (const family of book.families) {
      const complete = family.tally.found === family.tally.total;
      const section = element('section', left, `treasure-family family-${family.id}`);
      section.classList.toggle('complete', complete);
      this.heading(section, family.title, family.tally);
      const cells = element('div', section, 'treasure-cells');
      for (const cell of family.cells) {
        this.cell(cells, cell, family.id);
      }
    }
    const right = element('div', this.element, 'treasure-column');
    const shells = element('section', right, 'treasure-family family-shells');
    this.heading(shells, 'Coquilles', book.shellTally);
    const rows = element('div', shells, 'shell-rows');
    for (const row of book.shells) {
      const line = element('div', rows, 'shell-row');
      line.classList.toggle('complete', row.tally.found === row.tally.total);
      element('span', line, 'shell-place', names.place(row.place));
      const glyphs = element('span', line, 'shell-glyphs');
      for (let i = 0; i < row.tally.total; i++) {
        if (i < row.tally.found) {
          const img = element('img', glyphs, 'shell-glyph');
          img.src = this.shellImage.src;
          img.alt = '';
        } else {
          element('span', glyphs, 'shell-glyph missing');
        }
      }
      element('span', line, 'shell-count', `${String(row.tally.found)}/${String(row.tally.total)}`);
    }
    // Les disques (D-121) : seulement ceux qu'on a trouvés, sans case vide ni compte.
    if (book.records.length > 0) {
      const records = element('section', right, 'treasure-family family-records');
      this.heading(records, FAMILY_TITLES.records, null);
      const sleeves = element('div', records, 'record-sleeves');
      for (const cell of book.records) {
        const record = RECORDS.find((r) => recordSlot(r.id) === cell.id);
        const button = element('button', sleeves, 'treasure-record');
        button.type = 'button';
        button.append(recordDrawing(cell.id as RecordSlot));
        element('span', button, 'treasure-record-title', record?.title ?? '');
        if (cell.isNew) {
          element('span', button, 'treasure-new');
        }
        button.addEventListener('click', () => {
          this.openSheet(cell, 'records');
        });
      }
    }
  }

  private heading(
    parent: HTMLElement,
    title: string,
    tally: { found: number; total: number } | null,
  ): void {
    const h3 = element('h3', parent);
    element('i', h3, 'treasure-swatch');
    element('span', h3, undefined, title);
    if (tally) {
      element('span', h3, 'treasure-count', `${String(tally.found)}/${String(tally.total)}`);
    }
  }

  private cell(parent: HTMLElement, cell: TreasureCell, family: TreasureFamilyId): void {
    const button = element('button', parent, 'treasure-cell');
    button.type = 'button';
    button.classList.toggle('missing', !cell.found);
    const box = element('span', button, 'treasure-box');
    if (cell.found && isMemory(cell.id)) {
      const id = cell.id;
      box.append(treasureDrawing('treasure-drawing', id, 42));
      if (flashbackOf(id) || playableOf(id)) {
        element('span', button, 'treasure-play', '▶');
      }
      button.setAttribute('aria-label', MEMORY_NAMES[id]);
    } else {
      box.textContent = '?';
    }
    // L'indice (D-160) : la salle si Céleste y est passée, sinon le lieu, sinon « ? ». Un jalon
    // (D-180) : « plus loin », il viendra avec l'histoire.
    const hint = cell.found ? '' : cell.milestone ? MILESTONE_SHORT : this.shortWhere(cell.where);
    element('span', button, 'treasure-hint', hint);
    if (cell.isNew) {
      element('span', button, 'treasure-new');
    }
    button.addEventListener('click', () => {
      this.openSheet(cell, family);
    });
  }

  private shortWhere(where: TreasureWhere): string {
    if (where.room !== null) {
      return this.names.room(where.room);
    }
    return where.place !== null ? this.names.place(where.place) : '?';
  }

  private longWhere(where: TreasureWhere): string {
    const parts = [
      where.place !== null ? this.names.place(where.place) : null,
      where.room !== null ? this.names.room(where.room) : null,
    ].filter((part): part is string => part !== null);
    return parts.length > 0 ? parts.join(' · ') : '?';
  }

  /** La fiche d'un trésor : son dessin en grand, sa famille, son nom, où il est. */
  private openSheet(cell: TreasureCell, family: FamilyKey): void {
    this.element.querySelector('.treasure-sheet')?.remove();
    const sheet = element('div', this.element, `treasure-sheet family-${family}`);
    const big = element('div', sheet, 'treasure-big');
    const id = cell.id;
    const memory = cell.found && isMemory(id) ? id : null;
    const record = family === 'records' ? RECORDS.find((r) => recordSlot(r.id) === id) : undefined;
    if (memory) {
      big.append(treasureDrawing('treasure-big-drawing', memory, 150));
    } else if (record) {
      big.append(recordDrawing(recordSlot(record.id), true));
    } else {
      big.textContent = '?';
    }
    const text = element('div', sheet, 'treasure-sheet-text');
    element('p', text, 'treasure-family-name', FAMILY_TITLES[family]);
    const name = memory ? MEMORY_NAMES[memory] : (record?.title ?? '?');
    element('h4', text, undefined, cell.found ? name : '?');
    element(
      'p',
      text,
      'treasure-where',
      cell.found
        ? `Trouvé : ${this.longWhere(cell.where)}`
        : cell.milestone
          ? MILESTONE_LONG
          : `À chercher : ${this.longWhere(cell.where)}`,
    );
    const actions = element('div', text, 'treasure-actions');
    const flashback = memory ? flashbackOf(memory) : null;
    const playable = memory ? playableOf(memory) : null;
    if (flashback || playable) {
      const replay = element('button', actions, 'treasure-replay', '▶ Revoir le souvenir');
      replay.type = 'button';
      replay.addEventListener('click', () => {
        if (playable) {
          this.onPlayMemory(playable);
          return;
        }
        if (flashback) {
          // Le court souvenir (D-68), en grand à la place du dessin.
          big.classList.add('flashback');
          const show = () => {
            const image = flashbackImage(flashback, show);
            big.replaceChildren(
              drawnCanvas('treasure-big-drawing', 260, 150, (ctx) => {
                drawFlashback(ctx, flashback, 130, 75, 250, 145, image);
              }),
            );
          };
          show();
        }
      });
    }
    const back = element('button', actions, 'treasure-back', 'Revenir');
    back.type = 'button';
    back.addEventListener('click', () => {
      sheet.remove();
    });
  }
}
