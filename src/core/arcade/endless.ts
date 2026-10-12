import { ARCADE_ENDLESS } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { Layer } from '../level/LevelData';
import type { CablePiece, PostPiece } from './course';
import type { RunAction } from './runner';
import type { WindLeg } from './wind';

/**
 * Le mode Sans fin (D-167), pur : la course est faite de morceaux collés. Le dernier poteau d'un
 * morceau est le premier du suivant (la jointure). Chaque morceau a une entrée (sa jointure) et une
 * sortie (la jointure suivante) : le suivant est placé pour que son entrée tombe sur la sortie du
 * précédent, à côté (les jeux horizontaux), au-dessus (la cheminée) ou en escalier (la grimpette, le
 * grand vent). La bande ajoute le cadre tout autour, et remplit ce qu'aucun morceau ne couvre. Trois
 * morceaux sont chargés à la fois ; quand Céleste entre dans le dernier, le plus ancien est retiré
 * et tout recule d'autant (en largeur, en hauteur).
 */

/**
 * Où commence un morceau : la hauteur de sa jointure (ligne du haut) et la couche où y arrive le
 * témoin (les deux mondes ; le présent ailleurs). Le morceau d'avant la donne en finissant.
 */
export interface EndlessEntry {
  readonly top: number;
  readonly layer: Layer;
  /** La cheminée : la colonne intérieure la plus à gauche et la largeur de la section suivante. */
  readonly col?: number;
  readonly width?: number;
}

/** Une case d'un morceau : colonne et ligne de ses lignes (la première en 0). */
export interface ChunkCell {
  readonly col: number;
  readonly row: number;
}

/**
 * Un morceau : ses lignes, sans le cadre (ni murs, ni plafond, ni fond), de sa jointure de départ
 * (comprise) à la suivante. Les lignes de ses pièces (`top`, `row`, `r1`…) se comptent comme dans
 * une salle à un cadre : sa première ligne est la ligne 1.
 */
export interface EndlessChunk {
  /** Son rang dans la course (0, 1, 2…). */
  readonly index: number;
  /** Le niveau dont il a la difficulté et le nombre de poteaux (plafonné). */
  readonly level: number;
  readonly lines: readonly string[];
  /** Largeur (tuiles) : ses lignes. */
  readonly width: number;
  /** Son entrée (la case du haut de sa jointure) et sa sortie (celle de la jointure suivante). */
  readonly anchorIn: ChunkCell;
  readonly anchorOut: ChunkCell;
  readonly difficulty: number;
  /**
   * Ses poteaux (colonnes du morceau : la jointure de départ en colonne 0). Le couloir n'a pas de
   * poteaux : sa jointure est le sol de départ, décrit comme un poteau.
   */
  readonly posts: readonly PostPiece[];
  /** La jointure suivante (sa hauteur) et la couche du témoin : le morceau d'après en part. */
  readonly exit: EndlessEntry;
  /** Ses câbles (les tyroliennes), en colonnes du morceau, avec la sortie du témoin. */
  readonly cables?: readonly CablePiece[];
  /** Les gestes du témoin qui court (le couloir), en px du morceau (les tests les rejouent). */
  readonly plan?: readonly RunAction[];
  /** Ses zones d'une seule couche (les deux mondes, `; @shift:`), en colonnes du morceau. */
  readonly zones?: readonly EndlessZone[];
  /** Les bascules du témoin (les deux mondes), en px du morceau (les tests les rejouent). */
  readonly shifts?: readonly number[];
  /** La vitesse du monstre dans ce morceau (tuiles/s). */
  readonly speed?: number;
  /** Le plan du témoin du grand vent, en px du morceau (les tests le rejouent). */
  readonly windPlan?: readonly WindLeg[];
}

/** Une zone d'une seule couche (D-108), en tuiles. */
export interface EndlessZone {
  readonly layer: Layer;
  readonly col: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
}

/** Le niveau dont le morceau `index` a la difficulté : le niveau `index + 1`, jusqu'au plafond. */
export function endlessLevel(index: number): number {
  return Math.min(index + 1, ARCADE_ENDLESS.capLevel);
}

/** La graine d'une nouvelle partie : un nouveau parcours à chaque fois (D-167). */
export function newRunSeed(random: () => number = Math.random): number {
  return Math.floor(random() * 0x7fffffff);
}

/**
 * Les lignes d'un morceau, tirées du texte d'une salle de génération : sans l'en-tête, sans la
 * première et la dernière ligne (plafond et fond du cadre), des colonnes `from` à `to` (non
 * comprise), sans départ.
 */
export function chunkLines(text: string, from: number, to: number): string[] {
  return text
    .split('\n')
    .filter((line) => !line.startsWith(';'))
    .slice(1, -1)
    .map((line) => line.slice(from, to).replace('P', '.'));
}

/** Un morceau placé dans la bande : la colonne de sa colonne 0, et le décalage de ses lignes. */
export interface PlacedChunk {
  readonly chunk: EndlessChunk;
  /** Colonne de la salle de sa colonne 0. */
  readonly col: number;
  /** Ligne de la salle = ligne du morceau + `row`. */
  readonly row: number;
}

/** La disposition de morceaux collés : où est chacun, et la taille de la salle (cadre compris). */
export interface EndlessLayout {
  readonly placed: readonly PlacedChunk[];
  readonly width: number;
  readonly height: number;
}

/** Place les morceaux : l'entrée de chacun sur la sortie du précédent. */
export function layoutOf(chunks: readonly EndlessChunk[]): EndlessLayout {
  const xs: number[] = [];
  const ys: number[] = [];
  let x = 0;
  let y = 0;
  chunks.forEach((chunk, i) => {
    const previous = chunks[i - 1];
    if (previous) {
      x += previous.anchorOut.col - chunk.anchorIn.col;
      y += previous.anchorOut.row - chunk.anchorIn.row;
    }
    xs.push(x);
    ys.push(y);
  });
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...chunks.map((c, i) => (xs[i] ?? 0) + c.width));
  const maxY = Math.max(...chunks.map((c, i) => (ys[i] ?? 0) + c.lines.length));
  return {
    placed: chunks.map((chunk, i) => ({
      chunk,
      col: 1 + (xs[i] ?? 0) - minX,
      row: (ys[i] ?? 0) - minY,
    })),
    width: maxX - minX + 2,
    height: maxY - minY + 2,
  };
}

/**
 * Le texte d'une salle faite de morceaux collés (format des salles, D-06) : le cadre tout autour,
 * plein là où aucun morceau ne va, le départ sur la première jointure ; avec `goal`, le fanion sur
 * la jointure du dernier morceau.
 */
export function stitch(
  chunks: readonly EndlessChunk[],
  header: readonly string[],
  goal = false,
): string {
  const layout = layoutOf(chunks);
  const first = layout.placed[0];
  const last = layout.placed[layout.placed.length - 1];
  if (!first || !last) {
    throw new Error('Sans fin : aucun morceau à coller');
  }
  const grid = Array.from({ length: layout.height }, () =>
    new Array<string>(layout.width).fill('#'),
  );
  for (const { chunk, col, row } of layout.placed) {
    chunk.lines.forEach((line, r) => {
      const target = grid[1 + r + row];
      for (let c = 0; c < line.length && target; c++) {
        target[col + c] = line[c] ?? '#';
      }
    });
  }
  const mark = (at: PlacedChunk, post: PostPiece | undefined, dx: number, tile: string) => {
    const line = post ? grid[post.top - 1 + at.row] : undefined;
    if (post && line) {
      line[at.col + post.col + dx] = tile;
    }
  };
  // Le départ : sur la deuxième case de la jointure (sur le rebord d'une tuile de la cheminée).
  const seam = first.chunk.posts[0];
  mark(first, seam, Math.min(1, (seam?.width ?? 1) - 1), 'P');
  if (goal) {
    const lastSeam = last.chunk.posts[0];
    mark(last, lastSeam, Math.floor((lastSeam?.width ?? 1) / 2), 'G');
  }
  return [
    ...header,
    ...stitchedCableLines(layout),
    ...stitchedZoneLines(layout),
    ...stitchedChaseLines(layout),
    ...grid.map((line) => line.join('')),
  ].join('\n');
}

/**
 * Le monstre de morceaux collés (`; @chase:`) : vers la droite, une vitesse par morceau ; il ne
 * finit jamais (la ligne d'arrivée est contre le mur du fond, la bande recule avant).
 */
function stitchedChaseLines(layout: EndlessLayout): string[] {
  if (!layout.placed.some((p) => p.chunk.speed !== undefined)) {
    return [];
  }
  const end = layout.width - 2;
  const lines = [`; @chase: right ${String(end)}`, '; @chase-look: monster'];
  for (const { chunk, col } of layout.placed) {
    lines.push(
      `; @chase-phase: ${String(Math.min(col + chunk.width, end))} ${(chunk.speed ?? 0).toFixed(2)}`,
    );
  }
  return lines;
}

/** Les zones d'une seule couche de morceaux collés (`; @shift:`), en cases de la salle. */
function stitchedZoneLines(layout: EndlessLayout): string[] {
  return layout.placed.flatMap(({ chunk, col, row }) =>
    (chunk.zones ?? []).map(
      (z) =>
        `; @shift: ${z.layer} ${String(z.col + col)} ${String(z.row + row)} ${String(z.width)} ${String(z.height)}`,
    ),
  );
}

/** Les câbles de morceaux collés (format des salles, `; @cable:`), en cases de la salle. */
function stitchedCableLines(layout: EndlessLayout): string[] {
  return cablesOf(layout).map(
    (c) => `; @cable: ${String(c.c1)} ${String(c.r1)} ${String(c.c2)} ${String(c.r2)}`,
  );
}

function cablesOf(layout: EndlessLayout): CablePiece[] {
  return layout.placed.flatMap(({ chunk, col, row }) =>
    (chunk.cables ?? []).map((c) => ({
      ...c,
      c1: c.c1 + col,
      c2: c.c2 + col,
      r1: c.r1 + row,
      r2: c.r2 + row,
    })),
  );
}

/** Les câbles de morceaux collés, en cases de la salle. */
export function stitchedCables(chunks: readonly EndlessChunk[]): CablePiece[] {
  return cablesOf(layoutOf(chunks));
}

/** Les bascules du témoin de morceaux collés, en px de la salle. */
export function stitchedShifts(chunks: readonly EndlessChunk[]): number[] {
  return layoutOf(chunks).placed.flatMap(({ chunk, col }) =>
    (chunk.shifts ?? []).map((x) => x + col * T),
  );
}

/** Les gestes du témoin de morceaux collés, en px de la salle. */
export function stitchedPlan(chunks: readonly EndlessChunk[]): RunAction[] {
  return layoutOf(chunks).placed.flatMap(({ chunk, col }) =>
    (chunk.plan ?? []).map((action) => ({
      ...action,
      atX: action.atX + col * T,
      ...(action.jumpX !== undefined ? { jumpX: action.jumpX + col * T } : {}),
    })),
  );
}

/** Les poteaux de morceaux collés, en cases de la salle. */
export function stitchedPosts(chunks: readonly EndlessChunk[]): PostPiece[] {
  return layoutOf(chunks).placed.flatMap(({ chunk, col, row }) =>
    chunk.posts.map((post) => ({ ...post, col: post.col + col, top: post.top + row })),
  );
}

/**
 * Le sens de la course dans la bande : vers la droite (les jeux horizontaux, la grimpette, le grand
 * vent) ou vers le haut (la cheminée). Il dit quand Céleste est entrée dans le dernier morceau.
 */
export type EndlessAxis = 'x' | 'up';

/**
 * La bande (D-167) : les morceaux chargés. Céleste commence dans le premier ; dès qu'elle entre
 * dans le dernier, `shift` retire le plus ancien et ajoute le suivant : elle se retrouve au milieu,
 * un morceau entier devant elle.
 */
export class EndlessBand {
  private readonly chunks: EndlessChunk[];
  private current: EndlessLayout;
  /** Colonnes retirées depuis le départ de la course (vers la droite). */
  originCols = 0;

  constructor(
    first: readonly EndlessChunk[],
    readonly axis: EndlessAxis = 'x',
  ) {
    if (first.length < 2) {
      throw new Error('Sans fin : la bande demande au moins deux morceaux');
    }
    this.chunks = [...first];
    this.current = layoutOf(this.chunks);
  }

  get loaded(): readonly EndlessChunk[] {
    return this.chunks;
  }

  /** Où est chaque morceau, et la taille de la salle. */
  get layout(): EndlessLayout {
    return this.current;
  }

  /** Rang du morceau à préparer ensuite (celui que demandera `shift`). */
  get nextIndex(): number {
    return (this.chunks[this.chunks.length - 1]?.index ?? -1) + 1;
  }

  /** Où commencera le morceau suivant (la jointure qui l'ouvre, la couche du témoin). */
  get exit(): EndlessEntry | null {
    return this.chunks[this.chunks.length - 1]?.exit ?? null;
  }

  /** Où ira `next` dans la salle actuelle (avant le recul) : sa colonne 0, le décalage de ses lignes. */
  placeOf(next: EndlessChunk): { col: number; row: number } {
    const last = this.current.placed[this.current.placed.length - 1];
    if (!last) {
      return { col: 1, row: 0 };
    }
    return {
      col: last.col + last.chunk.anchorOut.col - next.anchorIn.col,
      row: last.row + last.chunk.anchorOut.row - next.anchorIn.row,
    };
  }

  /** La colonne de la salle où commence le dernier morceau (le mur de gauche en colonne 0). */
  get lastStartCol(): number {
    return this.current.placed[this.current.placed.length - 1]?.col ?? 0;
  }

  /**
   * Céleste (la case de la salle de son bord gauche et de ses pieds) est-elle entrée dans le dernier
   * morceau ? Vers la droite : passé sa colonne 0 ; vers le haut : montée jusqu'à son bas.
   */
  shouldShift(col: number, row = 0): boolean {
    const last = this.current.placed[this.current.placed.length - 1];
    if (!last) {
      return false;
    }
    return this.axis === 'up' ? row < 1 + last.row + last.chunk.lines.length : col >= last.col;
  }

  /**
   * Retire le plus ancien morceau, ajoute `next` (le morceau `nextIndex`) : retourne le déplacement
   * (tuiles) à appliquer à tout ce qui est dans la salle (négatif : vers la gauche, vers le haut).
   */
  shift(next: EndlessChunk): { dx: number; dy: number } {
    if (next.index !== this.nextIndex) {
      throw new Error(`Sans fin : le morceau ${String(this.nextIndex)} était attendu`);
    }
    const before = this.current.placed[1];
    this.chunks.shift();
    this.chunks.push(next);
    this.current = layoutOf(this.chunks);
    const after = this.current.placed[0];
    const dx = (after?.col ?? 0) - (before?.col ?? 0);
    const dy = (after?.row ?? 0) - (before?.row ?? 0);
    this.originCols -= dx;
    return { dx, dy };
  }

  /** Le texte de la salle de la bande. */
  text(header: readonly string[]): string {
    return stitch(this.chunks, header);
  }
}

/** Un rectangle plein du cadre (cases de la salle) ; `edge` : son haut borde le vide d'un morceau. */
export interface FrameRect {
  readonly col: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
  readonly edge: boolean;
}

/**
 * Le cadre de la bande, en rectangles : tout ce qu'aucun morceau ne couvre (la bordure, et en
 * escalier ce qui est au-dessus ou au-dessous des morceaux). Les lignes voisines identiques sont
 * fusionnées.
 */
export function frameRects(layout: EndlessLayout): FrameRect[] {
  const covered = (row: number, col: number) =>
    layout.placed.some(
      (p) =>
        col >= p.col &&
        col < p.col + p.chunk.width &&
        row >= 1 + p.row &&
        row < 1 + p.row + p.chunk.lines.length,
    );
  const rects: FrameRect[] = [];
  /** Les rectangles encore ouverts, par segment de colonnes (« début:fin »). */
  let open = new Map<string, { col: number; row: number; width: number; edge: boolean }>();
  const close = (rect: { col: number; row: number; width: number; edge: boolean }, end: number) => {
    rects.push({ ...rect, height: end - rect.row });
  };
  for (let row = 0; row < layout.height; row++) {
    const next = new Map<string, { col: number; row: number; width: number; edge: boolean }>();
    let col = 0;
    while (col < layout.width) {
      if (covered(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < layout.width && !covered(row, col)) {
        col++;
      }
      const key = `${String(start)}:${String(col)}`;
      next.set(
        key,
        open.get(key) ?? {
          col: start,
          row,
          width: col - start,
          edge: row > 0 && covered(row - 1, start),
        },
      );
    }
    for (const [key, rect] of open) {
      if (!next.has(key)) {
        close(rect, row);
      }
    }
    open = next;
  }
  for (const rect of open.values()) {
    close(rect, layout.height);
  }
  return rects;
}
