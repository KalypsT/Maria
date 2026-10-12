import { ARCADE_WIND as C } from '../../config/arcade';
import { TILE_SIZE as T } from '../../config/display';
import type { MovementParams } from '../../config/movement';
import { spawnPosition, type LevelData } from '../level/LevelData';
import { parseAsciiLevel } from '../level/parseAsciiLevel';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import type { Hitbox } from './course';
import { mulberry32, ramp, seedOf } from './random';
import { chunkLines, type EndlessChunk } from './endless';
import { ARCADE_ROOM_META } from './roomMeta';

/**
 * L'allure du témoin entre deux portes : planer à pleine vitesse, planer en freinant (la descente
 * plus raide), ou fermer le parapluie un instant (`steps` pas) pour tomber plus vite, puis le
 * rouvrir.
 */
export type WindAction =
  | { readonly kind: 'fast' }
  | { readonly kind: 'slow' }
  | { readonly kind: 'drop'; readonly steps: number };

/** Le plan du témoin : une allure jusqu'à l'abscisse `untilX` (px), puis la suivante. */
export interface WindLeg {
  readonly untilX: number;
  readonly action: WindAction;
}

/** Un niveau du grand vent : son texte, le plan du témoin (les tests le rejouent) et ses portes. */
export interface WindLevel {
  readonly text: string;
  readonly plan: readonly WindLeg[];
  /** Du départ au fanion (tuiles) : ce que vaut le niveau au compteur. */
  readonly lengthTiles: number;
  readonly gates: number;
  readonly difficulty: number;
}

/** Hauteur de la salle pendant le premier vol, sans portes (tuiles). */
const SKY_ROWS = 200;
/** Pas de simulation au plus. */
const MAX_STEPS = 12000;
/** En freinant, le témoin repousse vers la droite sous cette vitesse (px/s). */
const SLOW_VX = 70;
/** Marge ajoutée aux ouvertures si la dernière vérification échoue (px), et essais au plus. */
const WIDEN_PX = 4;
const WIDEN_TRIES = 6;

/** Difficulté du niveau n (1, 2, 3…). */
export function windDifficulty(n: number): number {
  return 1 - Math.pow(C.difficultyRate, n - 1);
}

/** Nombre de portes du niveau n. */
export function windGates(n: number): number {
  return Math.min(C.gates.max, C.gates.first + Math.floor((n - 1) / C.gates.every));
}

/** Ce qu'a parcouru le témoin après le départ : le haut et le bas de sa boîte, par x. */
interface Flight {
  readonly left: number[];
  readonly top: number[];
  readonly bottom: number[];
  /** Posé à la fin du vol (sur le poteau du fanion), et où. */
  readonly landed: boolean;
  readonly feet: number;
}

const input: PlayerInput = { moveX: 1, moveY: 0, jumpPressed: false, jumpHeld: false };

/**
 * Le vol du témoin (la vraie physique) : il court sur le poteau de départ, saute au bord, ouvre le
 * parapluie au sommet (Saut lâché un pas, puis rappuyé, D-62), puis suit son plan. Le vol s'arrête
 * quand il se pose, ou touche un danger.
 */
export function fly(
  level: LevelData,
  plan: readonly WindLeg[],
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): Flight {
  const spawn = spawnPosition(level, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(level, params, spawn.x, spawn.y, hitbox);
  phys.canGlide = true;
  const edge = (1 + C.start.width) * T;
  const flight = { left: [] as number[], top: [] as number[], bottom: [] as number[] };
  let airborne = false;
  let opened = false;
  let pressNext = false;
  let leg = -1;
  let dropLeft = 0;
  for (let i = 0; i < MAX_STEPS; i++) {
    const box = phys.box;
    input.moveX = 1;
    input.jumpPressed = false;
    input.jumpHeld = true;
    if (!airborne) {
      const jump = box.x + box.width >= edge - 2;
      input.jumpPressed = jump;
      input.jumpHeld = jump;
    } else if (pressNext) {
      pressNext = false;
      input.jumpPressed = true;
    } else if (!opened) {
      if (phys.vy >= 0) {
        input.jumpHeld = false;
        pressNext = true;
        opened = true;
      }
    } else {
      const cx = box.x + box.width / 2;
      let k = plan.findIndex((l) => cx < l.untilX);
      if (k < 0) {
        k = plan.length;
      }
      const action = plan[k]?.action;
      if (k !== leg) {
        leg = k;
        dropLeft = action?.kind === 'drop' ? action.steps : 0;
      }
      if (dropLeft > 0) {
        dropLeft--;
        input.jumpHeld = false;
        pressNext = dropLeft === 0;
      } else if (action?.kind === 'slow') {
        input.moveX = phys.vx < SLOW_VX ? 1 : 0;
      }
    }
    phys.step(input);
    airborne ||= !phys.grounded;
    if (!airborne) {
      continue;
    }
    flight.left.push(phys.box.x);
    flight.top.push(phys.box.y);
    flight.bottom.push(phys.box.y + phys.box.height);
    if (touchesHazard(level, phys.box)) {
      return { ...flight, landed: false, feet: 0 };
    }
    if (phys.grounded) {
      return { ...flight, landed: true, feet: phys.box.y + phys.box.height };
    }
  }
  return { ...flight, landed: false, feet: 0 };
}

/** Une porte : ses colonnes, et les lignes de son ouverture. */
interface Gate {
  readonly col: number;
  readonly width: number;
  readonly open0: number;
  readonly open1: number;
}

/** Le poteau du fanion. */
interface Goal {
  readonly col: number;
  readonly top: number;
}

function levelText(
  gates: readonly Gate[],
  goal: Goal,
  header: readonly string[],
  goalWidth: number = C.goalWidth,
): string {
  const floor = goal.top + C.below;
  const rows = floor + 2;
  const cols = goal.col + goalWidth + 1;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const line = new Array<string>(cols).fill(r === 0 || r === rows - 1 ? '#' : '.');
    line[0] = '#';
    line[cols - 1] = '#';
    if (r === floor) {
      line.fill('^', 1, cols - 1);
    }
    grid.push(line);
  }
  const post = (col: number, width: number, top: number) => {
    for (let r = top; r <= floor; r++) {
      const line = grid[r];
      for (let c = col; c < col + width && line; c++) {
        line[c] = 'b';
      }
    }
  };
  post(1, C.start.width, C.start.top);
  post(goal.col, goalWidth, goal.top);
  for (const gate of gates) {
    for (let r = 1; r < floor; r++) {
      if (r >= gate.open0 && r <= gate.open1) {
        continue;
      }
      const line = grid[r];
      for (let c = gate.col; c < gate.col + gate.width && line; c++) {
        line[c] = '^';
      }
    }
  }
  const spawnLine = grid[C.start.top - 1];
  if (spawnLine) {
    spawnLine[2] = 'P';
  }
  const goalLine = grid[goal.top - 1];
  if (goalLine) {
    goalLine[goal.col + Math.floor(goalWidth / 2)] = 'G';
  }
  return [...header, ...grid.map((line) => line.join(''))].join('\n');
}

/** Ce que pose le témoin : les portes, le poteau d'arrivée, son plan, le texte de la salle. */
interface Placement {
  readonly gates: Gate[];
  readonly goal: Goal;
  readonly plan: WindLeg[];
  readonly text: string;
  readonly count: number;
}

/**
 * Les portes du niveau `n` (sa difficulté, leur nombre), avec la graine `seed`, et le poteau
 * d'arrivée, de largeur `goalWidth`, là où se pose le témoin.
 */
function placeWind(
  n: number,
  seed: string,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  header: readonly string[],
  goalWidth: number,
): Placement {
  const random = mulberry32(seedOf(seed));
  const d = windDifficulty(n);
  const id = `arcade-wind-${String(n)}`;
  const count = windGates(n);

  // Les portes (leurs colonnes) et le plan : une allure par passage, jusqu'à la porte suivante.
  const columns: { col: number; width: number }[] = [];
  const plan: WindLeg[] = [];
  let col = 1 + C.start.width;
  for (let k = 0; k < count; k++) {
    col += Math.max(3, Math.round(ramp(C.spacing, d) + random() * C.spacingSpread));
    const width = Math.round(ramp(C.thickness, d));
    columns.push({ col, width });
    let action: WindAction = { kind: 'fast' };
    if (k > 0 && random() < ramp(C.change, d)) {
      action =
        random() < 0.5
          ? { kind: 'slow' }
          : { kind: 'drop', steps: Math.round(ramp(C.dropSteps, d) * (0.6 + random() * 0.4)) };
    }
    // L'allure s'applique dans le passage qui mène à cette porte (avant elle).
    plan.push({ untilX: col * T, action });
    col += width;
  }
  const goalCol = col + 4;

  // Le vol dans le ciel vide (un départ, un fond très bas).
  const sky = parseAsciiLevel(
    id,
    levelText([], { col: goalCol + 40, top: SKY_ROWS - C.below - 2 }, header),
  );
  const free = fly(sky, plan, params, hitbox);

  // Le poteau du fanion : là où les pieds du témoin passent, quand il arrive au-dessus.
  const at = free.left.findIndex((x) => x + hitbox.width >= goalCol * T + 4);
  const feet = at >= 0 ? (free.bottom[at] ?? 0) : 0;
  const goal = { col: goalCol, top: Math.ceil((feet + 2) / T) };

  let margin = ramp(C.margin, d);
  for (let tries = 0; tries <= WIDEN_TRIES; tries++) {
    const gates = columns.map(({ col: c, width }) => {
      let top = Number.POSITIVE_INFINITY;
      let bottom = 0;
      free.left.forEach((x, i) => {
        if (x < (c + width) * T && x + hitbox.width > c * T) {
          top = Math.min(top, free.top[i] ?? top);
          bottom = Math.max(bottom, free.bottom[i] ?? bottom);
        }
      });
      return {
        col: c,
        width,
        open0: Math.max(1, Math.floor((top - margin) / T)),
        open1: Math.ceil((bottom + margin) / T) - 1,
      };
    });
    const text = levelText(gates, goal, header, goalWidth);
    const replay = fly(parseAsciiLevel(id, text), plan, params, hitbox);
    if (replay.landed && replay.feet === goal.top * T) {
      return { gates, goal, plan, text, count };
    }
    margin += WIDEN_PX;
  }
  throw new Error(`Le grand vent, niveau ${String(n)} : le témoin ne passe pas les portes`);
}

/**
 * Le niveau n du grand vent (D-166), toujours le même : une graine fixe, un plan pour le témoin (une
 * allure par passage entre deux portes, de plus en plus variée), son vol avec la vraie physique dans
 * le ciel vide ; puis les portes de briques de jeu, ouvertes autour de son chemin (une marge qui se
 * resserre), et le poteau du fanion là où il se pose. Une dernière vérification rejoue le vol avec
 * les portes (sinon, les ouvertures s'élargissent). L'analyse de faisabilité ne sait pas changer
 * d'allure en plein vol : les tests rejouent le plan du témoin.
 */
export function generateWindLevel(
  n: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  abilities: readonly string[],
): WindLevel {
  const header = [
    `; Console (D-166) : le grand vent, niveau ${String(n)}. Généré (graine fixe) : ne pas modifier à la main.`,
    `; @name: Le grand vent · niveau ${String(n)}`,
    `; @abilities: ${abilities.join(' ')}`,
    ...ARCADE_ROOM_META,
  ];
  const { goal, plan, text, count } = placeWind(
    n,
    `wind:${String(n)}`,
    params,
    hitbox,
    header,
    C.goalWidth,
  );
  return {
    text,
    plan,
    lengthTiles: goal.col + Math.floor(C.goalWidth / 2) - 2,
    gates: count,
    difficulty: windDifficulty(n),
  };
}

/**
 * Un morceau du grand vent pour le mode Sans fin (D-167) : de son poteau de départ (la jointure) au
 * poteau où se pose le témoin, non compris : de la largeur du départ, il ouvre le morceau d'après,
 * plus bas et plus loin (en escalier). Les portes sont posées comme celles du niveau `level`.
 */
export function generateWindChunk(
  index: number,
  level: number,
  runSeed: number,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
): EndlessChunk {
  const { goal, plan, text } = placeWind(
    level,
    `endless:wind:${String(runSeed)}:${String(index)}`,
    params,
    hitbox,
    ARCADE_ROOM_META,
    C.start.width,
  );
  const lines = chunkLines(text, 1, goal.col);
  return {
    index,
    level,
    lines,
    width: goal.col - 1,
    difficulty: windDifficulty(level),
    posts: [{ kind: 'post', col: 0, width: C.start.width, top: C.start.top, goal: false }],
    exit: { top: goal.top, layer: 'present' },
    anchorIn: { col: 0, row: C.start.top - 1 },
    anchorOut: { col: goal.col - 1, row: goal.top - 1 },
    windPlan: plan.map((leg) => ({ ...leg, untilX: leg.untilX - T })),
  };
}
