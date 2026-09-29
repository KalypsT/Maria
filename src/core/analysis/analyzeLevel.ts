import { TILE_SIZE as T } from '../../config/display';
import { MOVE_SEARCH, WALL_SEARCH } from '../../config/levelDesign';
import { PLAYER_HITBOX, deriveMovement, type MovementParams } from '../../config/movement';
import { Tile, tileAt, type LevelData } from '../level/LevelData';
import { touchesHazard } from '../physics/gridCollision';
import { PlayerPhysics, type PlayerInput } from '../player/PlayerPhysics';
import { PlayerState } from '../player/playerState';
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
  /**
   * Saut mural (D-44) : un rebond depuis une glissade contre un mur ; la fenêtre est la durée de
   * glissade pendant laquelle la pression réussit. Un passage d'une surface à une autre qui
   * enchaîne des appuis sur les murs est de ce type, avec le détail dans `chain`.
   */
  WallJump: 'wall-jump',
  /** Lâcher un mur pendant la glissade (ou glisser jusqu'en bas) : aucun timing. */
  WallLetGo: 'wall-let-go',
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
  /** Passage par les appuis sur les murs (D-44) : type du premier élan. */
  readonly start?: MoveKind;
}

/**
 * Essais bruts d'une famille de passages (saut mural, D-44) : la surface ou l'appui atteint par
 * chaque essai successif, espacés de `msPerTry` (`Infinity` pour un passage sans timing).
 */
interface TryRecord {
  readonly from: number;
  readonly kind: MoveKind;
  readonly dir: number;
  readonly holdSteps: number;
  readonly airRelease: boolean;
  readonly targets: readonly number[];
  readonly msPerTry: number;
}

/** Appui sur un mur (D-44) : Céleste vient d'entrer en glissade ; état complet de la simulation. */
interface WallNode {
  readonly id: number;
  readonly dir: number;
  readonly snapshot: PlayerPhysics;
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
  /** Appuis sur les murs explorés (saut mural, D-44). */
  readonly wallNodeCount: number;
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
  /** Appuis sur les murs découverts (D-44), numérotés après les surfaces. */
  readonly wallNodes: WallNode[] = [];
  private readonly wallIds = new Map<string, number>();
  /** Appuis pas encore explorés. */
  private readonly wallQueue: WallNode[] = [];
  /** Essais bruts, gardés seulement avec le saut mural (fenêtres à travers les appuis). */
  readonly records: TryRecord[] = [];

  constructor(
    private readonly level: LevelData,
    private readonly params: Readonly<MovementParams>,
    private readonly map: SurfaceMap,
    canClimb: boolean,
    private readonly hitbox: Readonly<{ width: number; height: number }>,
    private readonly canWallJump = false,
  ) {
    this.main = new PlayerPhysics(level, params, 0, 0, hitbox);
    this.probe = new PlayerPhysics(level, params, 0, 0, hitbox);
    this.main.canClimb = canClimb;
    this.probe.canClimb = canClimb;
    this.main.canWallJump = canWallJump;
    this.probe.canWallJump = canWallJump;
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
      this.recordSingle(move);
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

  /** Garde un passage sans timing comme un essai brut (saut mural seulement). */
  private recordSingle(move: Move): void {
    if (this.canWallJump && !Number.isFinite(move.windowMs)) {
      this.records.push({ ...move, targets: [move.to], msPerTry: move.windowMs });
    }
  }

  /** Plus longue suite d'essais consécutifs menant à chaque surface, convertie en fenêtre. */
  private offerWindows(
    from: number,
    families: readonly Family[],
    msPerTry: number,
    offer: (move: Move) => void,
  ): void {
    for (const family of families) {
      if (this.canWallJump) {
        this.records.push({ ...family, from, msPerTry });
      }
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
      const before = probe.state;
      probe.step(input);
      if (touchesHazard(this.level, probe.box)) {
        return -1;
      }
      if (this.enteredWall(before)) {
        return this.wallNodeOf(probe);
      }
      airborne ||= !probe.grounded;
    }
    return this.finish(0);
  }

  /** Vrai si `probe` vient d'entrer en glissade contre un mur (appui du saut mural, D-44). */
  private enteredWall(before: PlayerState): boolean {
    return (
      this.canWallJump &&
      this.probe.state === PlayerState.WallSlide &&
      before !== PlayerState.WallSlide
    );
  }

  /**
   * Nœud de l'appui où se trouve `probe` : même mur, même hauteur à 4 px près, même mur quitté.
   * Le premier état rencontré sert de point de départ à tous (la glissade ramène la chute à la
   * même vitesse : les états se rejoignent).
   */
  private wallNodeOf(player: PlayerPhysics): number {
    const key = `${String(player.wallDir)}:${String(player.wallCol)}:${String(
      Math.round(player.box.y / WALL_SEARCH.heightStepPx),
    )}:${String(player.releasedWall)}`;
    const known = this.wallIds.get(key);
    if (known !== undefined) {
      return known;
    }
    if (this.wallNodes.length >= WALL_SEARCH.maxNodes) {
      throw new Error(`Analyse : plus de ${String(WALL_SEARCH.maxNodes)} appuis sur les murs`);
    }
    const snapshot = new PlayerPhysics(this.level, this.params, 0, 0, this.hitbox);
    snapshot.copyFrom(player);
    const node: WallNode = {
      id: this.map.surfaces.length + this.wallNodes.length,
      dir: player.wallDir,
      snapshot,
    };
    this.wallNodes.push(node);
    this.wallQueue.push(node);
    this.wallIds.set(key, node.id);
    return node.id;
  }

  /** Prochain appui à explorer (null : tous explorés). */
  nextWallNode(): WallNode | null {
    return this.wallQueue.shift() ?? null;
  }

  /**
   * Passages depuis un appui (D-44) : rebondir à chaque instant de la glissade (plusieurs
   * durées de maintien, direction ensuite vers le large, relâchée ou vers le mur quitté), ou
   * lâcher le mur (glisser jusqu'en bas, se laisser tomber, s'en écarter).
   */
  exploreWall(node: WallNode): Move[] {
    const best = new Map<number, Move>();
    const offer = (move: Move) => {
      this.recordSingle(move);
      if (move.to < 0 || move.to === move.from) {
        return;
      }
      const current = best.get(move.to);
      if (!current || move.windowMs > current.windowMs) {
        best.set(move.to, move);
      }
    };
    const w = node.dir;
    const families = this.families(MoveKind.WallJump, [-w, 0, w], false).filter((family) =>
      WALL_SEARCH.jumpHoldSteps.includes(family.holdSteps),
    );
    const main = this.main;
    main.copyFrom(node.snapshot);
    const input = this.input;
    for (let k = 0; k < WALL_SEARCH.maxSlideSteps; k++) {
      if (main.grounded || main.onLedge || main.wallDir === 0) {
        break;
      }
      if (k % WALL_SEARCH.sampleSteps === 0) {
        for (const family of families) {
          family.targets.push(this.tryKick(main, family.dir, family.holdSteps));
        }
      }
      input.moveX = w;
      input.moveY = 0;
      input.jumpPressed = false;
      input.jumpHeld = false;
      main.step(input);
      if (touchesHazard(this.level, main.box)) {
        break;
      }
    }
    this.offerWindows(node.id, families, WALL_SEARCH.sampleSteps * this.stepMs, offer);
    for (const dir of [w, 0, -w]) {
      this.probe.copyFrom(node.snapshot);
      offer({
        from: node.id,
        to: this.finish(dir),
        kind: MoveKind.WallLetGo,
        dir,
        holdSteps: 0,
        airRelease: false,
        windowMs: Number.POSITIVE_INFINITY,
      });
    }
    return [...best.values()];
  }

  /** Depuis la glissade de `from`, rebondit maintenant ; retourne la surface ou l'appui atteint. */
  private tryKick(from: PlayerPhysics, dir: number, holdSteps: number): number {
    const probe = this.probe;
    probe.copyFrom(from);
    const input = this.input;
    input.moveY = 0;
    for (let s = 0; s < MOVE_SEARCH.maxSteps && !probe.grounded; s++) {
      input.jumpPressed = s === 0;
      input.jumpHeld = holdSteps === 0 || s < holdSteps;
      input.moveX = dir;
      const before = probe.state;
      probe.step(input);
      if (touchesHazard(this.level, probe.box)) {
        return -1;
      }
      if (this.enteredWall(before)) {
        return this.wallNodeOf(probe);
      }
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
      const before = probe.state;
      probe.step(input);
      if (touchesHazard(this.level, probe.box)) {
        return -1;
      }
      if (this.enteredWall(before)) {
        return this.wallNodeOf(probe);
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
  /** Saut mural (D-44) : glissade contre les murs et rebonds, enchaînés d'un mur à l'autre. */
  readonly wallJump?: boolean;
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
  const explorer = new MoveExplorer(
    level,
    params,
    map,
    abilities.climb ?? false,
    hitbox,
    abilities.wallJump ?? false,
  );
  const moves = exploreAll(explorer, map);
  const start = surfaceUnder(level, map, level.spawn.col, level.spawn.row);
  const goal = level.goal ? surfaceUnder(level, map, level.goal.col, level.goal.row) : -1;
  const path = start >= 0 && goal >= 0 ? widestPath(map.surfaces.length, moves, start, goal) : null;
  let critical: Move | null = null;
  for (const move of path ?? []) {
    if (Number.isFinite(move.windowMs) && (!critical || move.windowMs < critical.windowMs)) {
      critical = move;
    }
  }
  return { map, moves, start, goal, path, critical, wallNodeCount: explorer.wallNodes.length };
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
  if (!surface) {
    return [];
  }
  const explorer = new MoveExplorer(
    level,
    params,
    map,
    abilities.climb ?? false,
    abilities.hitbox ?? PLAYER_HITBOX,
    abilities.wallJump ?? false,
  );
  const moves = explorer.explore(surface);
  if (explorer.wallNodes.length === 0) {
    return moves;
  }
  return exploreAll(explorer, map).filter((move) => move.from === surfaceId);
}

/**
 * Tous les passages entre surfaces. Avec le saut mural (D-44), les appuis sur les murs sont des
 * étapes intermédiaires : voir `wallWindows`. Un passage par les appuis n'est retenu que s'il fait
 * mieux qu'un passage direct.
 */
function exploreAll(explorer: MoveExplorer, map: SurfaceMap): Move[] {
  const surfaceCount = map.surfaces.length;
  const direct: Move[] = [];
  for (const surface of map.surfaces) {
    direct.push(...explorer.explore(surface));
  }
  if (explorer.wallNodes.length === 0) {
    return direct;
  }
  for (let node = explorer.nextWallNode(); node; node = explorer.nextWallNode()) {
    explorer.exploreWall(node);
  }
  const best = new Map<string, Move>();
  for (const move of direct) {
    if (move.to < surfaceCount) {
      best.set(`${String(move.from)}:${String(move.to)}`, move);
    }
  }
  for (const move of wallWindows(explorer.records, surfaceCount, explorer.wallNodes.length)) {
    const key = `${String(move.from)}:${String(move.to)}`;
    const current = best.get(key);
    if (!current || move.windowMs > current.windowMs) {
      best.set(key, move);
    }
  }
  return [...best.values()];
}

/**
 * Fenêtre d'une famille d'essais quand chaque résultat vaut `value(cible)` : la plus grande valeur
 * v telle qu'une suite d'essais consécutifs, tous de valeur ≥ v, dure au moins v. Généralise la
 * fenêtre d'un passage direct (valeur infinie pour la surface visée, nulle ailleurs).
 */
function recordWindow(record: TryRecord, value: (target: number) => number): number {
  const values = record.targets.map(value);
  let best = 0;
  for (const threshold of new Set(values)) {
    if (threshold <= best) {
      continue;
    }
    let run = 0;
    let longest = 0;
    for (const v of values) {
      run = v >= threshold ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    best = Math.max(best, Math.min(threshold, longest * record.msPerTry));
  }
  return best;
}

/**
 * Passages de surface à surface à travers les appuis sur les murs (D-44). Pendant une glissade,
 * rebondir un peu plus tôt ou un peu plus tard mène à des appuis voisins, souvent tous bons : la
 * fenêtre d'un rebond est donc la durée pendant laquelle il mène à un appui d'où l'on peut encore
 * finir le passage avec une marge au moins égale. Calcul par point fixe (les valeurs ne font que
 * croître), pour chaque surface visée.
 */
function wallWindows(
  records: readonly TryRecord[],
  surfaceCount: number,
  nodeCount: number,
): Move[] {
  const byNode: TryRecord[][] = Array.from({ length: nodeCount }, () => []);
  const fromSurfaces: TryRecord[] = [];
  /** Appuis dont un essai mène à l'appui (ou à la surface) donné. */
  const dependents = new Map<number, Set<number>>();
  const goals = new Set<number>();
  for (const record of records) {
    if (record.from >= surfaceCount) {
      byNode[record.from - surfaceCount]?.push(record);
      for (const target of record.targets) {
        if (target < 0) {
          continue;
        }
        if (target < surfaceCount) {
          goals.add(target);
        }
        let set = dependents.get(target);
        if (!set) {
          set = new Set();
          dependents.set(target, set);
        }
        set.add(record.from);
      }
    } else if (record.targets.some((target) => target >= surfaceCount)) {
      fromSurfaces.push(record);
    }
  }
  const moves: Move[] = [];
  const nodeValue = new Float64Array(nodeCount);
  for (const goal of goals) {
    nodeValue.fill(0);
    const value = (target: number) =>
      target === goal
        ? Number.POSITIVE_INFINITY
        : target >= surfaceCount
          ? (nodeValue[target - surfaceCount] ?? 0)
          : 0;
    const queue = [...(dependents.get(goal) ?? [])];
    const queued = new Set(queue);
    for (let node = queue.pop(); node !== undefined; node = queue.pop()) {
      queued.delete(node);
      let v = 0;
      for (const record of byNode[node - surfaceCount] ?? []) {
        v = Math.max(v, recordWindow(record, value));
      }
      if (v <= (nodeValue[node - surfaceCount] ?? 0)) {
        continue;
      }
      nodeValue[node - surfaceCount] = v;
      for (const dependent of dependents.get(node) ?? []) {
        if (!queued.has(dependent)) {
          queued.add(dependent);
          queue.push(dependent);
        }
      }
    }
    const bestFrom = new Map<number, Move>();
    for (const record of fromSurfaces) {
      if (record.from === goal) {
        continue;
      }
      const windowMs = recordWindow(record, value);
      const current = bestFrom.get(record.from);
      if (windowMs > 0 && (!current || windowMs > current.windowMs)) {
        bestFrom.set(record.from, {
          from: record.from,
          to: goal,
          kind: MoveKind.WallJump,
          dir: record.dir,
          holdSteps: record.holdSteps,
          airRelease: record.airRelease,
          windowMs,
          start: record.kind,
        });
      }
    }
    moves.push(...bestFrom.values());
  }
  return moves;
}

const KIND_LABEL: Readonly<Record<MoveKind, string>> = {
  'running-jump': 'saut en courant',
  'standing-jump': 'saut sans élan',
  'walk-off': 'chute',
  drop: 'descente Bas + Saut',
  'wall-jump': 'saut mural',
  'wall-let-go': 'glissade',
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
  if (move.start) {
    const timing = Number.isFinite(move.windowMs) ? `, fenêtre ${move.windowMs.toFixed(0)} ms` : '';
    return `${where(move.from)} → ${where(move.to)} : ${KIND_LABEL[move.start]} ${arrow} puis appuis sur les murs${timing}`;
  }
  const timing =
    move.kind === MoveKind.WalkOff || move.kind === MoveKind.Drop
      ? ''
      : ` ${arrow} (${hold}${air}), fenêtre ${move.windowMs.toFixed(0)} ms`;
  return `${where(move.from)} → ${where(move.to)} : ${KIND_LABEL[move.kind]}${timing}`;
}
