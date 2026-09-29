import { TILE_SIZE as T } from '../../config/display';
import { MOVE_SEARCH } from '../../config/levelDesign';
import { PLAYER_HITBOX, deriveMovement, type MovementParams } from '../../config/movement';
import { Tile, tileAt, type LevelData } from '../level/LevelData';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import { findSurfaces, surfaceUnder, type Surface, type SurfaceMap } from './surfaces';

export const MoveKind = {
  /** Saut en arrivant en courant : la fenêtre est la durée pendant laquelle la pression réussit. */
  RunningJump: 'running-jump',
  /** Saut depuis l'arrêt : la fenêtre est la zone de départ utile, convertie en temps de course. */
  StandingJump: 'standing-jump',
  /** Courir au-delà du bord et tomber : aucun timing. */
  WalkOff: 'walk-off',
  /** Bas + Saut à travers une plateforme traversable : aucun timing. */
  Drop: 'drop',
} as const;
export type MoveKind = (typeof MoveKind)[keyof typeof MoveKind];

/** Passage d'une surface à une autre, avec la marge la plus large trouvée. */
export interface Move {
  readonly from: number;
  readonly to: number;
  readonly kind: MoveKind;
  /** Sens de la course, ou de l'air control d'un saut sans élan (-1, 0, 1). */
  readonly dir: number;
  /** Maintien du saut (pas de simulation) ; 0 = maintenu jusqu'à l'atterrissage. */
  readonly holdSteps: number;
  /** Direction relâchée juste après la pression (saut plus court horizontalement). */
  readonly airRelease: boolean;
  /** Fenêtre de réussite (ms) ; `Infinity` pour une marche ou une descente sans timing. */
  readonly windowMs: number;
}

export interface LevelAnalysis {
  readonly map: SurfaceMap;
  /** Meilleur passage trouvé pour chaque couple (départ, arrivée) de surfaces. */
  readonly moves: readonly Move[];
  readonly start: number;
  /** Surface sous l'arrivée `G`, -1 sans arrivée. */
  readonly goal: number;
  /** Chemin du départ à l'arrivée dont le passage le plus dur est le plus facile ; null si impossible. */
  readonly path: readonly Move[] | null;
  /** Passage le plus dur de ce chemin (null si chemin sans saut ou impossible). */
  readonly critical: Move | null;
}

interface Family {
  readonly kind: MoveKind;
  readonly dir: number;
  readonly holdSteps: number;
  readonly airRelease: boolean;
  /** Surface atteinte pour chaque essai successif (-1 : aucune autre surface). */
  readonly targets: number[];
}

/**
 * Explore les passages depuis chaque surface en rejouant la vraie simulation (`PlayerPhysics`)
 * avec des entrées scriptées (décision D-16) : sauts en courant (chaque instant de pression
 * possible, plusieurs durées de maintien, air control maintenu ou relâché), sauts sans élan
 * (chaque position de départ), chutes et descentes par Bas + Saut.
 */
class MoveExplorer {
  private readonly main: PlayerPhysics;
  private readonly probe: PlayerPhysics;
  private readonly input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
  private readonly stepMs: number;
  private readonly coyoteSteps: number;
  /** Portée horizontale prudente d'un saut (px) : au-delà, un saut au-dessus d'un sol plat y retombe. */
  private readonly reachPx: number;
  /** Hauteur prudente au-dessus des pieds balayée par un saut (tuiles). */
  private readonly reachUpTiles: number;

  constructor(
    private readonly level: LevelData,
    private readonly params: Readonly<MovementParams>,
    private readonly map: SurfaceMap,
    canClimb: boolean,
    private readonly hitbox: Readonly<{ width: number; height: number }>,
  ) {
    this.main = new PlayerPhysics(level, params, 0, 0, hitbox);
    this.probe = new PlayerPhysics(level, params, 0, 0, hitbox);
    this.main.canClimb = canClimb;
    this.probe.canClimb = canClimb;
    const derived = deriveMovement(params);
    this.stepMs = derived.dt * 1000;
    this.coyoteSteps = derived.coyoteSteps;
    const apexPx = (derived.jumpVelocity * derived.jumpVelocity) / (2 * derived.riseGravity);
    const airtime =
      derived.jumpVelocity / derived.riseGravity + Math.sqrt((2 * apexPx) / derived.fallGravity);
    this.reachPx = 1.5 * params.maxRunSpeed * airtime + 3 * T;
    // En grimpant, les mains atteignent un bord au-dessus de la tête (D-26).
    const grabPx = canClimb ? hitbox.height + params.ledgeGrabAbovePx : 0;
    this.reachUpTiles = Math.ceil((apexPx + hitbox.height + grabPx) / T) + 2;
  }

  explore(surface: Surface): Move[] {
    const best = new Map<number, Move>();
    const offer = (move: Move) => {
      if (move.to < 0 || move.to === move.from) {
        return;
      }
      const current = best.get(move.to);
      if (!current || move.windowMs > current.windowMs) {
        best.set(move.to, move);
      }
    };
    for (const dir of [-1, 1]) {
      this.runningJumps(surface, dir, offer);
    }
    this.standingJumps(surface, offer);
    if (surface.hasOneWay) {
      this.drops(surface, offer);
    }
    return [...best.values()];
  }

  private families(kind: MoveKind, dirs: readonly number[], withRelease: boolean): Family[] {
    const families: Family[] = [];
    for (const dir of dirs) {
      for (const holdSteps of MOVE_SEARCH.jumpHoldSteps) {
        for (const airRelease of withRelease ? [false, true] : [false]) {
          families.push({ kind, dir, holdSteps, airRelease, targets: [] });
        }
      }
    }
    return families;
  }

  /** Plus longue suite d'essais consécutifs menant à chaque surface, convertie en fenêtre. */
  private offerWindows(
    from: number,
    families: readonly Family[],
    msPerTry: number,
    offer: (move: Move) => void,
  ): void {
    for (const family of families) {
      const bestRun = new Map<number, number>();
      let runTarget = -2;
      let run = 0;
      for (const target of family.targets) {
        run = target === runTarget ? run + 1 : 1;
        runTarget = target;
        if (run > (bestRun.get(target) ?? 0)) {
          bestRun.set(target, run);
        }
      }
      for (const [to, count] of bestRun) {
        offer({
          from,
          to,
          kind: family.kind,
          dir: family.dir,
          holdSteps: family.holdSteps,
          airRelease: family.airRelease,
          windowMs: count * msPerTry,
        });
      }
    }
  }

  /** Vrai si un saut depuis `x` (px, bord gauche de la hitbox) peut rencontrer autre chose que la surface. */
  private worthTrying(surface: Surface, x: number, dirs: readonly number[]): boolean {
    const left = surface.colStart * T;
    const right = (surface.colEnd + 1) * T;
    for (const dir of dirs) {
      if (dir >= 0 && right - x <= this.reachPx) {
        return true;
      }
      if (dir <= 0 && x - left <= this.reachPx) {
        return true;
      }
    }
    // Obstacle ou plateforme au-dessus, à portée de saut.
    const colFrom = Math.floor((x - this.reachPx) / T);
    const colTo = Math.floor((x + this.hitbox.width + this.reachPx) / T);
    for (let row = surface.row - 1; row >= surface.row - this.reachUpTiles; row--) {
      for (let col = colFrom; col <= colTo; col++) {
        if (row >= 0 && tileAt(this.level, col, row) !== Tile.Empty) {
          return true;
        }
      }
    }
    return false;
  }

  private runningJumps(surface: Surface, dir: number, offer: (move: Move) => void): void {
    const hitbox = this.hitbox;
    const x0 = dir > 0 ? surface.colStart * T : (surface.colEnd + 1) * T - hitbox.width;
    const main = this.main;
    main.reset(x0, surface.row * T - hitbox.height, this.level);
    const families = this.families(MoveKind.RunningJump, [dir], true);
    const input = this.input;
    const dirs = [dir];
    let lastX = Number.NaN;
    let stuck = 0;
    for (let k = 0; k < MOVE_SEARCH.maxSteps * 4; k++) {
      if (!main.grounded && main.stepsSinceGrounded > this.coyoteSteps) {
        break;
      }
      stuck = main.box.x === lastX ? stuck + 1 : 0;
      lastX = main.box.x;
      if (stuck > 4) {
        // Contre un mur : plus rien de nouveau à essayer dans ce sens.
        break;
      }
      const worth = this.worthTrying(surface, main.box.x, dirs);
      for (const family of families) {
        family.targets.push(
          worth ? this.tryJump(main, dir, family.holdSteps, family.airRelease) : surface.id,
        );
      }
      input.moveX = dir;
      input.moveY = 0;
      input.jumpPressed = false;
      input.jumpHeld = false;
      main.step(input);
      if (touchesHazard(this.level, main.box)) {
        // La course elle-même mène au danger : rien au-delà n'est atteignable ainsi.
        stuck = 5;
        break;
      }
    }
    this.offerWindows(surface.id, families, this.stepMs, offer);

    // Sans sauter : courir au-delà du bord et tomber.
    if (stuck <= 4) {
      this.probe.copyFrom(main);
      input.moveX = dir;
      offer({
        from: surface.id,
        to: this.finish(dir),
        kind: MoveKind.WalkOff,
        dir,
        holdSteps: 0,
        airRelease: false,
        windowMs: Number.POSITIVE_INFINITY,
      });
    }
  }

  private standingJumps(surface: Surface, offer: (move: Move) => void): void {
    const hitbox = this.hitbox;
    const step = MOVE_SEARCH.standingSampleStepPx;
    const airDirs = [-1, 0, 1];
    const families = this.families(MoveKind.StandingJump, airDirs, false);
    const y = surface.row * T - hitbox.height;
    const xMax = (surface.colEnd + 1) * T - hitbox.width;
    for (let x = surface.colStart * T; x <= xMax; x += step) {
      const worth = this.worthTrying(surface, x, airDirs);
      for (const family of families) {
        let target = surface.id;
        if (worth) {
          this.main.reset(x, y, this.level);
          target = this.tryJump(this.main, family.dir, family.holdSteps, false);
        }
        family.targets.push(target);
      }
    }
    // Précision de placement demandée, exprimée en temps de course.
    this.offerWindows(surface.id, families, (step / this.params.maxRunSpeed) * 1000, offer);
  }

  private drops(surface: Surface, offer: (move: Move) => void): void {
    const hitbox = this.hitbox;
    const input = this.input;
    for (let col = surface.colStart; col <= surface.colEnd; col++) {
      if (tileAt(this.level, col, surface.row) !== Tile.OneWay) {
        continue;
      }
      const probe = this.probe;
      probe.reset(col * T + (T - hitbox.width) / 2, surface.row * T - hitbox.height, this.level);
      input.moveX = 0;
      input.moveY = 1;
      input.jumpPressed = true;
      input.jumpHeld = true;
      probe.step(input);
      input.moveY = 0;
      input.jumpPressed = false;
      input.jumpHeld = false;
      offer({
        from: surface.id,
        to: this.finish(0),
        kind: MoveKind.Drop,
        dir: 0,
        holdSteps: 0,
        airRelease: false,
        windowMs: Number.POSITIVE_INFINITY,
      });
    }
  }

  /** Depuis l'état de `from`, saute maintenant et retourne la surface où Céleste s'arrête. */
  private tryJump(
    from: PlayerPhysics,
    dir: number,
    holdSteps: number,
    airRelease: boolean,
  ): number {
    const probe = this.probe;
    probe.copyFrom(from);
    const input = this.input;
    input.moveY = 0;
    let airborne = false;
    for (let s = 0; s < MOVE_SEARCH.maxSteps; s++) {
      if (airborne && probe.grounded) {
        break;
      }
      input.jumpPressed = s === 0;
      input.jumpHeld = holdSteps === 0 || s < holdSteps;
      input.moveX = airRelease && s > 0 ? 0 : dir;
      probe.step(input);
      if (touchesHazard(this.level, probe.box)) {
        return -1;
      }
      airborne ||= !probe.grounded;
    }
    return this.finish(0);
  }

  /**
   * Termine le mouvement de `probe` : garde la direction courante (`dir`) jusqu'à l'atterrissage,
   * puis lâche tout jusqu'à l'arrêt. Retourne la surface d'arrivée, -1 si aucune.
   */
  private finish(dir: number): number {
    const probe = this.probe;
    const input = this.input;
    input.moveX = dir;
    input.moveY = 0;
    input.jumpPressed = false;
    input.jumpHeld = false;
    let s = 0;
    while (!probe.grounded && s < MOVE_SEARCH.maxSteps) {
      probe.step(input);
      if (touchesHazard(this.level, probe.box)) {
        return -1;
      }
      s++;
    }
    input.moveX = 0;
    for (let settle = 0; settle < MOVE_SEARCH.settleSteps; settle++) {
      if (probe.grounded && probe.vx === 0) {
        break;
      }
      probe.step(input);
      if (touchesHazard(this.level, probe.box)) {
        return -1;
      }
    }
    return probe.grounded ? this.surfaceOf(probe) : -1;
  }

  private surfaceOf(player: PlayerPhysics): number {
    const box = player.box;
    const row = Math.round((box.y + box.height) / T);
    const width = this.level.width;
    const center = Math.floor((box.x + box.width / 2) / T);
    for (const col of [center, Math.floor(box.x / T), Math.floor((box.x + box.width - 1e-6) / T)]) {
      if (col < 0 || col >= width) {
        continue;
      }
      const id = this.map.idByTile[row * width + col];
      if (id !== undefined && id >= 0) {
        return id;
      }
    }
    return -1;
  }
}

/** Chemin dont le passage le plus dur a la plus grande fenêtre (variante de Dijkstra). */
function widestPath(
  count: number,
  moves: readonly Move[],
  start: number,
  goal: number,
): Move[] | null {
  const outgoing: Move[][] = Array.from({ length: count }, () => []);
  for (const move of moves) {
    outgoing[move.from]?.push(move);
  }
  const best = new Float64Array(count).fill(-1);
  const via: (Move | undefined)[] = new Array<Move | undefined>(count);
  const done = new Uint8Array(count);
  best[start] = Number.POSITIVE_INFINITY;
  for (;;) {
    let u = -1;
    for (let i = 0; i < count; i++) {
      if (!done[i] && (best[i] ?? -1) >= 0 && (u < 0 || (best[i] ?? -1) > (best[u] ?? -1))) {
        u = i;
      }
    }
    if (u < 0 || u === goal) {
      break;
    }
    done[u] = 1;
    for (const move of outgoing[u] ?? []) {
      const width = Math.min(best[u] ?? -1, move.windowMs);
      if (width > (best[move.to] ?? -1)) {
        best[move.to] = width;
        via[move.to] = move;
      }
    }
  }
  if ((best[goal] ?? -1) < 0) {
    return null;
  }
  const path: Move[] = [];
  for (let node = goal; node !== start;) {
    const move = via[node];
    if (!move) {
      return null;
    }
    path.unshift(move);
    node = move.from;
  }
  return path;
}

/** Capacités prises en compte par l'analyse. */
export interface AnalysisAbilities {
  /** Grimper aux rebords (D-26) : les sauts qui poussent vers un mur s'y accrochent et s'y hissent. */
  readonly climb?: boolean;
  /** Hitbox de Céleste (croissance, D-43) ; par défaut, celle de la première phase. */
  readonly hitbox?: Readonly<{ width: number; height: number }>;
}

/**
 * Analyse de faisabilité d'une salle avec des paramètres de mouvement donnés (décision D-16).
 * Pure et indépendante de Phaser : reste valable si les paramètres changent.
 */
export function analyzeLevel(
  level: LevelData,
  params: Readonly<MovementParams>,
  abilities: AnalysisAbilities = {},
): LevelAnalysis {
  const hitbox = abilities.hitbox ?? PLAYER_HITBOX;
  const map = findSurfaces(level, hitbox.height);
  const explorer = new MoveExplorer(level, params, map, abilities.climb ?? false, hitbox);
  const moves: Move[] = [];
  for (const surface of map.surfaces) {
    moves.push(...explorer.explore(surface));
  }
  const start = surfaceUnder(level, map, level.spawn.col, level.spawn.row);
  const goal = level.goal ? surfaceUnder(level, map, level.goal.col, level.goal.row) : -1;
  const path = start >= 0 && goal >= 0 ? widestPath(map.surfaces.length, moves, start, goal) : null;
  let critical: Move | null = null;
  for (const move of path ?? []) {
    if (Number.isFinite(move.windowMs) && (!critical || move.windowMs < critical.windowMs)) {
      critical = move;
    }
  }
  return { map, moves, start, goal, path, critical };
}

/** Passages depuis une seule surface (plus rapide qu'une analyse complète). */
export function movesFrom(
  level: LevelData,
  params: Readonly<MovementParams>,
  map: SurfaceMap,
  surfaceId: number,
  abilities: AnalysisAbilities = {},
): Move[] {
  const surface = map.surfaces[surfaceId];
  return surface
    ? new MoveExplorer(
        level,
        params,
        map,
        abilities.climb ?? false,
        abilities.hitbox ?? PLAYER_HITBOX,
      ).explore(surface)
    : [];
}

const KIND_LABEL: Readonly<Record<MoveKind, string>> = {
  'running-jump': 'saut en courant',
  'standing-jump': 'saut sans élan',
  'walk-off': 'chute',
  drop: 'descente Bas + Saut',
};

/** Description lisible d'un passage (rapports de test, debug). Colonnes et lignes comptées depuis 1. */
export function describeMove(move: Move, map: SurfaceMap): string {
  const where = (id: number) => {
    const s = map.surfaces[id];
    return s ? `[ligne ${s.row + 1}, col. ${s.colStart + 1}–${s.colEnd + 1}]` : '[?]';
  };
  const arrow = move.dir > 0 ? '→' : move.dir < 0 ? '←' : '↑';
  const hold = move.holdSteps === 0 ? 'maintenu' : `maintien ${move.holdSteps} pas`;
  const air = move.airRelease ? ', direction relâchée' : '';
  const timing =
    move.kind === MoveKind.WalkOff || move.kind === MoveKind.Drop
      ? ''
      : ` ${arrow} (${hold}${air}), fenêtre ${move.windowMs.toFixed(0)} ms`;
  return `${where(move.from)} → ${where(move.to)} : ${KIND_LABEL[move.kind]}${timing}`;
}
