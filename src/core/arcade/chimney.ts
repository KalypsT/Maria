import { ARCADE_CHIMNEY as C } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import { spawnPosition, type LevelData } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import type { Hitbox } from './course';
import { mulberry32, ramp, seedOf } from './random';
import { ARCADE_ROOM_META } from './roomMeta';

/** Un niveau de la cheminée : son texte et ce qu'il contient. */
export interface ChimneyLevel {
  readonly text: string;
  /** Du départ au poteau du fanion (tuiles, en hauteur) : ce que vaut le niveau au compteur. */
  readonly lengthTiles: number;
  readonly sections: number;
  readonly patches: number;
  readonly difficulty: number;
}

/** Une section : la colonne intérieure la plus à gauche et la largeur (tuiles). */
interface Section {
  readonly left: number;
  readonly width: number;
}

/** Pas de simulation au plus pour monter toute la cheminée. */
const MAX_STEPS = 9000;

/** Difficulté du niveau n (1, 2, 3…). */
export function chimneyDifficulty(n: number): number {
  return 1 - Math.pow(C.difficultyRate, n - 1);
}

/** Nombre de sections du niveau n. */
export function chimneySections(n: number): number {
  return Math.min(C.sections.max, C.sections.first + Math.floor((n - 1) / C.sections.every));
}

/** La géométrie d'un tirage : où commence la cheminée, où est son fond, et ses sections. */
interface Shape {
  readonly sections: readonly Section[];
  /** Ligne du haut de la cheminée (le dessus du mur de droite, le poteau du fanion). */
  readonly top: number;
  /** Ligne du fond (les briques de jeu). */
  readonly floor: number;
  readonly rows: number;
}

function shapeOf(sections: readonly Section[]): Shape {
  const top = 1 + C.headroom;
  const floor = top + sections.length * C.sectionRows;
  return { sections, top, floor, rows: floor + 2 };
}

/** Section d'une ligne de la cheminée (la section 0 en bas). */
function sectionAt(shape: Shape, row: number): Section | undefined {
  return shape.sections[Math.floor((shape.floor - 1 - row) / C.sectionRows)];
}

/**
 * Le texte de la salle : la cheminée creusée dans le bois, le petit rebord de départ en bas à
 * gauche au-dessus des briques de jeu, le mur de gauche qui monte jusqu'au plafond, le dessus du mur
 * de droite où attend le fanion, et les briques de jeu posées sur les murs (`patches` : `col,ligne`).
 */
function levelText(shape: Shape, header: readonly string[], patches: ReadonlySet<string>): string {
  const { top, floor, rows } = shape;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array<string>(C.cols).fill(r === 0 || r === rows - 1 ? '#' : '.'));
  }
  const last = shape.sections[shape.sections.length - 1];
  for (let r = 1; r < rows - 1; r++) {
    const line = grid[r];
    if (!line) {
      continue;
    }
    line[0] = '#';
    line[C.cols - 1] = '#';
    const section = r < top ? last : r >= floor ? shape.sections[0] : sectionAt(shape, r);
    if (!section) {
      continue;
    }
    for (let c = 1; c < C.cols - 1; c++) {
      const inside = c >= section.left && c < section.left + section.width;
      if (r < top) {
        // Au-dessus : le mur de gauche continue (pour un dernier appui), la droite est ouverte.
        line[c] = c < section.left ? 'b' : '.';
      } else if (r === floor) {
        line[c] = inside ? '^' : 'b';
      } else {
        line[c] = inside ? '.' : patches.has(`${String(c)},${String(r)}`) ? '^' : 'b';
      }
    }
  }
  // Le rebord de départ, en bas à gauche de la cheminée, et le fanion sur le mur de droite.
  const first = shape.sections[0];
  const startLine = grid[floor - 1];
  const spawnLine = grid[floor - 2];
  if (first && startLine && spawnLine) {
    startLine[first.left] = 'b';
    spawnLine[first.left] = 'P';
  }
  const goalLine = grid[top - 1];
  if (last && goalLine) {
    goalLine[Math.min(C.cols - 3, last.left + last.width + 2)] = 'G';
  }
  return [...header, ...grid.map((line) => line.join(''))].join('\n');
}

/** Ce qu'a parcouru le témoin : ses boîtes, pas à pas. */
type Trace = { x: number; y: number }[];

const input: PlayerInput = { moveX: 1, moveY: 0, jumpPressed: false, jumpHeld: false };

/**
 * Le témoin : il saute du rebord vers la droite ; contre un mur, il lâche Saut un pas, le rappuie
 * (le saut mural, D-44) et repart vers l'autre mur ; au-dessus du mur de droite, il s'y pose.
 * Retourne son chemin s'il arrive sur le poteau du fanion sans toucher un danger, sinon null.
 */
function climb(
  level: LevelData,
  shape: Shape,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): Trace | null {
  const spawn = spawnPosition(level, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(level, params, spawn.x, spawn.y, hitbox);
  phys.canWallJump = true;
  const trace: Trace = [];
  let dir = 1;
  let pressNext = true;
  let started = false;
  for (let i = 0; i < MAX_STEPS; i++) {
    input.moveX = dir;
    input.jumpPressed = false;
    input.jumpHeld = true;
    if (pressNext) {
      pressNext = false;
      input.jumpPressed = true;
    } else if (phys.wallSliding) {
      // Contre un mur : un pas sans Saut, puis le saut mural, vers l'autre mur.
      input.jumpHeld = false;
      pressNext = true;
      dir = -dir;
    } else if (phys.grounded && started) {
      // Posé sur un rebord, en chemin : on repart (un pas sans Saut, puis un saut).
      input.jumpHeld = false;
      pressNext = true;
    }
    phys.step(input);
    const box = phys.box;
    trace.push({ x: box.x, y: box.y });
    started ||= !phys.grounded;
    if (touchesHazard(level, box)) {
      return null;
    }
    if (started && phys.grounded && box.y + box.height === shape.top * T) {
      return trace;
    }
  }
  return null;
}

/** Une brique de jeu sur cette tuile reste-t-elle à `margin` px du chemin du témoin ? */
function clear(trace: Trace, hitbox: Hitbox, col: number, row: number, margin: number): boolean {
  const x0 = col * T - margin;
  const x1 = (col + 1) * T + margin;
  const y0 = row * T - margin;
  const y1 = (row + 1) * T + margin;
  for (const p of trace) {
    if (p.x < x1 && p.x + hitbox.width > x0 && p.y < y1 && p.y + hitbox.height > y0) {
      return false;
    }
  }
  return true;
}

/**
 * Le niveau n de la cheminée (D-166), toujours le même : une graine fixe, des sections de largeurs
 * et de décalages tirés, gardées seulement si le témoin (la vraie physique, la phase du jeu) monte
 * jusqu'au fanion ; puis des briques de jeu sur les murs, loin de son chemin, et une dernière
 * vérification. Les tests mesurent ensuite chaque niveau avec l'analyse de faisabilité (D-16).
 */
export function generateChimneyLevel(
  n: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): ChimneyLevel {
  const random = mulberry32(seedOf(`chimney:${String(n)}`));
  const d = chimneyDifficulty(n);
  const header = [
    `; Console (D-166) : la cheminée, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: La cheminée · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
  const count = chimneySections(n);
  const id = `arcade-chimney-${String(n)}`;
  const parse = (shape: Shape, patches: ReadonlySet<string>) =>
    parseAsciiLevel(id, levelText(shape, header, patches));
  const none: ReadonlySet<string> = new Set();

  // Section par section : chacune gardée seulement si le témoin monte jusqu'en haut avec elle.
  const sections: Section[] = [];
  let trace: Trace | null = null;
  for (let s = 0; s < count; s++) {
    const wanted = ramp(C.width, d) + random() * C.widthSpread;
    const reach = Math.round(ramp(C.shift, d));
    const shiftWanted = Math.round((random() * 2 - 1) * reach);
    const previous = sections[s - 1];
    const options: { section: Section; score: number }[] = [];
    for (let width = C.minWidth; width <= C.maxWidth; width++) {
      for (let shift = -reach; shift <= reach; shift++) {
        const base = previous ? previous.left + shift : Math.floor((C.cols - width) / 2);
        // Assez de place à gauche pour le mur, à droite pour le poteau du fanion.
        const left = Math.max(3, Math.min(C.cols - 5 - width, base));
        options.push({
          section: { left, width },
          score: Math.abs(width - wanted) + Math.abs(shift - shiftWanted) * 0.6,
        });
      }
    }
    options.sort((a, b) => a.score - b.score);
    let placed: Trace | null = null;
    for (const { section } of options) {
      const shape = shapeOf([...sections, section]);
      placed = climb(parse(shape, none), shape, params, hitbox);
      if (placed) {
        sections.push(section);
        break;
      }
    }
    if (!placed) {
      throw new Error(
        `La cheminée, niveau ${String(n)} : aucune section ne se place après ${String(s)}`,
      );
    }
    trace = placed;
  }
  const shape = shapeOf(sections);
  if (!trace) {
    throw new Error(`La cheminée, niveau ${String(n)} : aucune section`);
  }

  // Les briques de jeu sur les murs, loin du chemin du témoin.
  const margin = ramp(C.patchMarginPx, d);
  const patches = new Set<string>();
  for (let s = 0; s < count; s++) {
    const section = shape.sections[s];
    if (!section) {
      continue;
    }
    const want = Math.round(ramp(C.patches, d) * (0.5 + random() * 0.5));
    const bottom = shape.floor - 1 - s * C.sectionRows;
    const candidates: string[] = [];
    for (let r = bottom - C.sectionRows + 2; r <= bottom - 1; r++) {
      for (const col of [section.left - 1, section.left + section.width]) {
        if (clear(trace, hitbox, col, r, margin)) {
          candidates.push(`${String(col)},${String(r)}`);
        }
      }
    }
    for (let k = 0; k < want && candidates.length > 0; k++) {
      const pick = candidates.splice(Math.floor(random() * candidates.length), 1)[0];
      if (pick) {
        patches.add(pick);
      }
    }
  }
  // Une dernière montée du témoin, avec les briques de jeu ; sinon, sans elles.
  const final = climb(parse(shape, patches), shape, params, hitbox) ? patches : none;
  return {
    text: levelText(shape, header, final),
    lengthTiles: shape.floor - 1 - shape.top,
    sections: count,
    patches: final.size,
    difficulty: d,
  };
}
