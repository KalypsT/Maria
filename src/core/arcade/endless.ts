import { ARCADE_ENDLESS } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { CablePiece, PostPiece } from './course';
import type { RunAction } from './runner';

/**
 * Le mode Sans fin (D-167), pur : la course est faite de morceaux collés bout à bout. Le dernier
 * poteau d'un morceau est le premier du suivant (la jointure, toujours à la même hauteur). Une bande
 * de trois morceaux est chargée à la fois ; quand Céleste entre dans le dernier, le plus ancien est
 * retiré, et tout recule de sa largeur.
 */

/** Un morceau : ses lignes (sans les murs), de sa jointure de départ (comprise) à la suivante. */
export interface EndlessChunk {
  /** Son rang dans la course (0, 1, 2…). */
  readonly index: number;
  /** Le niveau dont il a la difficulté et le nombre de poteaux (plafonné). */
  readonly level: number;
  readonly lines: readonly string[];
  /** Largeur (tuiles) : de sa jointure à celle du morceau suivant. */
  readonly width: number;
  readonly difficulty: number;
  /**
   * Ses poteaux (colonnes du morceau : la jointure de départ en colonne 0). Le couloir n'a pas de
   * poteaux : sa jointure est le sol de départ, décrit comme un poteau.
   */
  readonly posts: readonly PostPiece[];
  /** Ligne du haut de la jointure suivante : le morceau d'après part de cette hauteur. */
  readonly exitTop: number;
  /** Ses câbles (les tyroliennes), en colonnes du morceau, avec la sortie du témoin. */
  readonly cables?: readonly CablePiece[];
  /** Les gestes du témoin qui court (le couloir), en px du morceau (les tests les rejouent). */
  readonly plan?: readonly RunAction[];
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
 * Le texte d'une salle faite de morceaux collés (format des salles, D-06) : un mur à chaque bout,
 * le départ sur la première jointure ; avec `goal`, le fanion sur la jointure du dernier morceau.
 */
export function stitch(
  chunks: readonly EndlessChunk[],
  header: readonly string[],
  goal = false,
): string {
  const first = chunks[0];
  const last = chunks[chunks.length - 1];
  if (!first || !last) {
    throw new Error('Sans fin : aucun morceau à coller');
  }
  const grid = first.lines.map((_, r) =>
    ['#', ...chunks.map((c) => c.lines[r] ?? ''), '#'].join('').split(''),
  );
  const mark = (row: number, col: number, tile: string) => {
    const line = grid[row];
    if (line) {
      line[col] = tile;
    }
  };
  const seam = first.posts[0];
  if (seam) {
    mark(seam.top - 1, 1 + seam.col + 1, 'P');
  }
  const lastSeam = last.posts[0];
  if (goal && lastSeam) {
    const offset = 1 + chunks.slice(0, -1).reduce((sum, c) => sum + c.width, 0);
    mark(lastSeam.top - 1, offset + lastSeam.col + Math.floor(lastSeam.width / 2), 'G');
  }
  return [...header, ...stitchedCableLines(chunks), ...grid.map((line) => line.join(''))].join(
    '\n',
  );
}

/** Les câbles de morceaux collés (format des salles, `; @cable:`), en colonnes de la salle. */
function stitchedCableLines(chunks: readonly EndlessChunk[]): string[] {
  return stitchedCables(chunks).map(
    (c) => `; @cable: ${String(c.c1)} ${String(c.r1)} ${String(c.c2)} ${String(c.r2)}`,
  );
}

/** Les câbles de morceaux collés, en colonnes de la salle (le mur de gauche en colonne 0). */
export function stitchedCables(chunks: readonly EndlessChunk[]): CablePiece[] {
  const cables: CablePiece[] = [];
  let offset = 1;
  for (const chunk of chunks) {
    for (const cable of chunk.cables ?? []) {
      cables.push({ ...cable, c1: cable.c1 + offset, c2: cable.c2 + offset });
    }
    offset += chunk.width;
  }
  return cables;
}

/** Les gestes du témoin de morceaux collés, en px de la salle. */
export function stitchedPlan(chunks: readonly EndlessChunk[]): RunAction[] {
  const plan: RunAction[] = [];
  let offset = T;
  for (const chunk of chunks) {
    for (const action of chunk.plan ?? []) {
      plan.push({
        ...action,
        atX: action.atX + offset,
        ...(action.jumpX !== undefined ? { jumpX: action.jumpX + offset } : {}),
      });
    }
    offset += chunk.width * T;
  }
  return plan;
}

/** Les poteaux de morceaux collés, en colonnes de la salle (le mur de gauche en colonne 0). */
export function stitchedPosts(chunks: readonly EndlessChunk[]): PostPiece[] {
  const posts: PostPiece[] = [];
  let offset = 1;
  for (const chunk of chunks) {
    for (const post of chunk.posts) {
      posts.push({ ...post, col: post.col + offset });
    }
    offset += chunk.width;
  }
  return posts;
}

/**
 * La bande (D-167) : les morceaux chargés, et ce qui en a été retiré depuis le départ. Céleste
 * commence dans le premier ; dès qu'elle entre dans le dernier, `shift` retire le plus ancien et
 * ajoute le suivant : elle se retrouve au milieu, un morceau entier devant elle.
 */
export class EndlessBand {
  private readonly chunks: EndlessChunk[];
  /** Colonnes retirées depuis le départ de la course. */
  originCols = 0;

  constructor(first: readonly EndlessChunk[]) {
    if (first.length < 2) {
      throw new Error('Sans fin : la bande demande au moins deux morceaux');
    }
    this.chunks = [...first];
  }

  get loaded(): readonly EndlessChunk[] {
    return this.chunks;
  }

  /** Rang du morceau à préparer ensuite (celui que demandera `shift`). */
  get nextIndex(): number {
    return (this.chunks[this.chunks.length - 1]?.index ?? -1) + 1;
  }

  /** La hauteur de la jointure qui ouvrira le morceau suivant. */
  get exitTop(): number {
    return this.chunks[this.chunks.length - 1]?.exitTop ?? 0;
  }

  /** La colonne de la salle où commence le dernier morceau (le mur de gauche en colonne 0). */
  get lastStartCol(): number {
    return 1 + this.chunks.slice(0, -1).reduce((sum, c) => sum + c.width, 0);
  }

  /** Céleste (`col`, colonne de la salle, son bord gauche) est-elle entrée dans le dernier morceau ? */
  shouldShift(col: number): boolean {
    return col >= this.lastStartCol;
  }

  /**
   * Retire le plus ancien morceau, ajoute `next` (le morceau `nextIndex`) : retourne le recul
   * (tuiles) à appliquer à tout ce qui est dans la salle.
   */
  shift(next: EndlessChunk): number {
    if (next.index !== this.nextIndex) {
      throw new Error(`Sans fin : le morceau ${String(this.nextIndex)} était attendu`);
    }
    const gone = this.chunks.shift();
    this.chunks.push(next);
    const width = gone?.width ?? 0;
    this.originCols += width;
    return width;
  }

  /** Le texte de la salle de la bande. */
  text(header: readonly string[]): string {
    return stitch(this.chunks, header);
  }
}
