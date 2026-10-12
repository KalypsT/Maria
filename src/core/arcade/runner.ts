import type { MovementParams } from '../../config/movement';
import { spawnPosition, type LevelData } from '../level/LevelData';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import type { Hitbox } from './course';

/**
 * Le témoin qui court (D-166, le couloir et le monstre) : il pousse toujours vers la droite, Saut
 * tenu, et fait les gestes d'un plan, chacun quand le bord droit de sa boîte atteint sa place.
 */

/**
 * Un geste, quand le bord droit de la boîte atteint `atX` (px) : glisser, sauter, ou glisser puis
 * sauter (le saut long) quand le bord droit atteint `jumpX`.
 */
export interface RunAction {
  readonly kind: 'slide' | 'jump' | 'slide-jump';
  readonly atX: number;
  readonly jumpX?: number;
}

/** Pas de simulation au plus pour passer un obstacle (et par obstacle, pour tout un niveau). */
export const RUN_MAX_STEPS = 900;
/** Départs du geste essayés avant l'obstacle (px), et après son bord (le temps de grâce). */
const SCAN_BEFORE_PX = 110;
const SCAN_AFTER_PX = 6;

/** Le témoin qui suit un plan : le geste suivant, et le saut long en attente. */
export interface Driver {
  readonly phys: PlayerPhysics;
  next: number;
  jumpX: number;
}

const input: PlayerInput = {
  moveX: 1,
  moveY: 0,
  jumpPressed: false,
  jumpHeld: true,
  abilityPressed: false,
};

/** Un pas : il court vers la droite, Saut tenu ; le geste du plan quand il arrive à sa place. */
export function drive(driver: Driver, plan: readonly RunAction[]): void {
  const box = driver.phys.box;
  const right = box.x + box.width;
  input.jumpPressed = false;
  input.abilityPressed = false;
  const action = plan[driver.next];
  if (action && right >= action.atX) {
    driver.next++;
    if (action.kind === 'jump') {
      input.jumpPressed = true;
    } else {
      input.abilityPressed = true;
      driver.jumpX = action.jumpX ?? Number.POSITIVE_INFINITY;
    }
  } else if (right >= driver.jumpX) {
    input.jumpPressed = true;
    driver.jumpX = Number.POSITIVE_INFINITY;
  }
  driver.phys.step(input);
}

function copyPhys(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
): PlayerPhysics {
  const phys = new PlayerPhysics(level, params, from.box.x, from.box.y, from.box);
  phys.copyFrom(from);
  phys.shiftTo(level, 0);
  return phys;
}

/**
 * Depuis `from`, le témoin passe-t-il l'obstacle avec ce geste : posé au sol au-delà de `clearX`
 * (px), le geste fait, sans toucher de danger ? Retourne son état d'alors.
 */
function pass(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
  action: RunAction,
  clearX: number,
): PlayerPhysics | null {
  const driver: Driver = {
    phys: copyPhys(from, level, params),
    next: 0,
    jumpX: Number.POSITIVE_INFINITY,
  };
  const plan = [action];
  for (let i = 0; i < RUN_MAX_STEPS; i++) {
    drive(driver, plan);
    const phys = driver.phys;
    if (touchesHazard(level, phys.box)) {
      return null;
    }
    if (
      driver.next === 1 &&
      driver.jumpX === Number.POSITIVE_INFINITY &&
      phys.grounded &&
      phys.box.x >= clearX
    ) {
      return phys;
    }
  }
  return null;
}

/** Le meilleur geste pour un obstacle : la plus longue plage de départs qui passent, et son milieu. */
export interface RunBest {
  readonly action: RunAction;
  readonly window: number;
  readonly phys: PlayerPhysics;
}

/**
 * Essaie le geste à chaque px avant l'obstacle, dont le bord est à `edgeX` (jamais avant la place
 * du témoin : le geste se décide après l'obstacle précédent) ; `make` donne le geste d'un départ.
 * Garde la plus longue plage, et le geste en son milieu.
 */
export function scanAction(
  from: PlayerPhysics,
  level: LevelData,
  params: Readonly<MovementParams>,
  edgeX: number,
  clearX: number,
  make: (x: number) => RunAction,
): RunBest | null {
  const first = Math.max(edgeX - SCAN_BEFORE_PX, Math.ceil(from.box.x + from.box.width) + 1);
  let best: RunBest | null = null;
  let runStart = -1;
  const close = (end: number) => {
    const window = end - runStart;
    if (runStart >= 0 && window > (best?.window ?? 0)) {
      const action = make(runStart + Math.floor(window / 2));
      const phys = pass(from, level, params, action, clearX);
      if (phys) {
        best = { action, window, phys };
      }
    }
    runStart = -1;
  };
  for (let x = first; x <= edgeX + SCAN_AFTER_PX; x++) {
    if (pass(from, level, params, make(x), clearX)) {
      if (runStart < 0) {
        runStart = x;
      }
    } else {
      close(x);
    }
  }
  close(edgeX + SCAN_AFTER_PX + 1);
  return best;
}

/** Le témoin au départ d'un niveau (la glissade prêtée ou non). */
export function startDriver(
  level: LevelData,
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  canSlide: boolean,
): Driver {
  const spawn = spawnPosition(level, hitbox.width, hitbox.height);
  const phys = new PlayerPhysics(level, params, spawn.x, spawn.y, hitbox);
  phys.canSlide = canSlide;
  return { phys, next: 0, jumpX: Number.POSITIVE_INFINITY };
}

/**
 * Rejoue un plan depuis le départ (la vraie physique) : retourne l'abscisse (px) où le témoin
 * s'arrête contre le mur du fond, tous les gestes faits ; -1 s'il touche un danger, ou s'il n'y
 * arrive pas.
 */
export function replayRun(
  level: LevelData,
  plan: readonly RunAction[],
  params: Readonly<MovementParams>,
  hitbox: Hitbox,
  canSlide: boolean,
): number {
  const driver = startDriver(level, params, hitbox, canSlide);
  const phys = driver.phys;
  let lastX = Number.NaN;
  for (let i = 0; i < RUN_MAX_STEPS * (plan.length + 2); i++) {
    drive(driver, plan);
    if (touchesHazard(level, phys.box)) {
      return -1;
    }
    if (driver.next === plan.length && phys.grounded && !phys.low && phys.box.x === lastX) {
      return phys.box.x;
    }
    lastX = phys.box.x;
  }
  return -1;
}
