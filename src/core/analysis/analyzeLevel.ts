import { TILE_SIZE as T } from '../../config/display';
import { MOVE_SEARCH, SHIFT_SEARCH, SLIDE_SEARCH, WALL_SEARCH } from '../../config/levelDesign';
import { PLAYER_HITBOX, deriveMovement, type MovementParams } from '../../config/movement';
import { Tile, tileAt, type Layer, type LevelData } from '../level/LevelData';
import { atLayer } from '../level/layers';
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
  /**
   * Glissade au sol (D-84), lancée en courant : la fenêtre est la durée pendant laquelle la
   * pression réussit. Depuis l'arrêt, contre l'obstacle bas : aucun timing.
   */
  Slide: 'slide',
  /** Saut depuis la glissade (saut long, D-84), `slideJumpAfter` pas après la pression. */
  SlideJump: 'slide-jump',
  /**
   * Bascule (D-107) sans sauter : debout (la fenêtre est la zone de départ utile, en temps de
   * course), en courant (la durée pendant laquelle la pression réussit), ou en glissant contre un
   * mur. Une bascule en plein saut garde le type du saut, avec `shift`.
   */
  Shift: 'shift',
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
  /** Parapluie ouvert en l'air (D-62, D-65) : Saut tenu jusqu'au sol, ouvert au sommet. */
  readonly glide?: boolean;
  /**
   * Sortie d'un câble (D-65) : Saut relâché en quittant le câble (`drop`), ou relâché puis pressé
   * de nouveau aussitôt (`jump`, saut depuis le câble, tenu ensuite). Absent : Saut tenu.
   */
  readonly cableExit?: CableExit;
  /** Saut depuis la glissade (D-84) : pas entre la pression de Capacité et celle de Saut. */
  readonly slideJumpAfter?: number;
  /** Bascule en plein saut (D-107) : la fenêtre tient compte de l'instant de la bascule. */
  readonly shift?: boolean;
  /**
   * Durée du passage (ms, D-67) : de l'élan (course ou placement depuis le bord de la surface, ou
   * glissade contre un mur) jusqu'à l'atterrissage, au pire sur sa fenêtre. Sert à vérifier qu'une
   * poursuite laisse le temps de passer. `Infinity` si inconnue.
   */
  readonly durationMs: number;
  /**
   * Position d'atterrissage (px, bord gauche de la hitbox) de l'essai qui donne `durationMs`, quand
   * elle est connue : le rejeu d'une poursuite horizontale suit Céleste le long des surfaces (D-87).
   */
  readonly toX?: number;
}

export type CableExit = 'drop' | 'jump';

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
  /** Durée de chaque essai (ms) : élan (`i × msPerTry`) puis vol jusqu'à la surface ou l'appui. */
  readonly times: readonly number[];
  /** Essais qui mènent à des instants de bascule en plein saut (D-107). */
  readonly shift?: boolean;
}

/**
 * État d'un essai juste avant un pas (D-107) : de quoi le reprendre à ce pas avec une bascule, sans
 * rejouer le début (la simulation et les variables de la boucle du saut).
 */
interface AirSnap {
  readonly phys: PlayerPhysics;
  airborne: boolean;
  apex: boolean;
  opened: number;
  sinceCable: number;
  /** Pris dans la boucle d'un saut ou d'un rebond (sinon : l'essai se rejoue en entier). */
  resumable: boolean;
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
  /**
   * Salle à deux couches analysée avec la bascule (D-107) : les surfaces du présent sont numérotées
   * de 0 à `presentCount - 1`, celles du souvenir ensuite (`map.idByTile` a deux plans, présent
   * puis souvenir) ; absent sinon (une seule couche).
   */
  readonly presentCount?: number;
}

interface Family {
  readonly kind: MoveKind;
  readonly dir: number;
  readonly holdSteps: number;
  readonly airRelease: boolean;
  /** Parapluie ouvert au sommet (D-62, D-65). */
  readonly glide: boolean;
  /** Sortie d'un câble (D-65) ; null : Saut tenu. */
  readonly cableExit: CableExit | null;
  /**
   * Glissade (D-84) : -2 aucune ; -1 glissade seule ; sinon, saut ce nombre de pas après la
   * pression de Capacité.
   */
  readonly slideJumpAfter: number;
  /** Surface atteinte pour chaque essai successif (-1 : aucune autre surface). */
  readonly targets: number[];
  /** Pas en l'air de chaque essai (jusqu'à l'atterrissage ou l'appui). */
  readonly steps: number[];
  /** Position d'atterrissage de chaque essai (px, NaN : inconnue). */
  readonly lands: number[];
  /** Essais de bascule en plein saut (D-107) : chaque cible est un nœud d'instants de bascule. */
  readonly shift?: boolean;
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
  private readonly input: PlayerInput = {
    moveX: 0,
    moveY: 0,
    jumpPressed: false,
    jumpHeld: false,
    abilityPressed: false,
  };
  private readonly stepMs: number;
  private readonly coyoteSteps: number;
  /** Portée horizontale prudente d'un saut (px) : au-delà, un saut au-dessus d'un sol plat y retombe. */
  private readonly reachPx: number;
  /** Hauteur prudente au-dessus des pieds balayée par un saut (tuiles). */
  private readonly reachUpTiles: number;
  /** Durée maximale simulée en l'air (pas) : plus longue sous le parapluie (D-62). */
  private readonly maxAirSteps: number;
  /** Appuis sur les murs découverts (D-44), numérotés après les surfaces. */
  readonly wallNodes: WallNode[] = [];
  private readonly wallIds = new Map<string, number>();
  /** Appuis pas encore explorés. */
  private readonly wallQueue: WallNode[] = [];
  /** Essais bruts, gardés seulement avec le saut mural (fenêtres à travers les appuis). */
  readonly records: TryRecord[] = [];
  /** Pas en l'air du dernier essai (`tryJump`, `tryKick`, `finish`), pour sa durée (D-67). */
  airSteps = 0;
  /** Position d'atterrissage du dernier essai (px, bord gauche de la hitbox ; NaN : aucune). */
  private landX = Number.NaN;
  /**
   * Couches analysées (D-107) : la salle seule, ou le présent puis le souvenir. Les surfaces du
   * souvenir sont numérotées après celles du présent (`presentCount`).
   */
  private readonly levels: readonly LevelData[];
  private readonly presentCount: number;
  /** Nœuds (appuis sur les murs et instants de bascule), numérotés après les surfaces. */
  nodeTotal = 0;
  /** Bascule en plein saut : avant le pas numéro `shiftAt` de l'essai (-1 : jamais). */
  private shiftAt = -1;
  /** Journal de l'essai joué : à chaque pas, Céleste est-elle près d'une zone d'une seule couche ? */
  private nearLog: boolean[] | null = null;
  /** Tuiles qui diffèrent d'une couche à l'autre. */
  private readonly diff: Uint8Array | null;
  /** États de l'essai journalisé, pas par pas (réutilisés d'un essai à l'autre). */
  private readonly snaps: AirSnap[] = [];
  /** Essais bruts gardés (saut mural ou bascule : fenêtres à travers les nœuds). */
  private readonly keepRecords: boolean;

  constructor(
    level: LevelData,
    private readonly params: Readonly<MovementParams>,
    private readonly map: SurfaceMap,
    canClimb: boolean,
    private readonly hitbox: Readonly<{ width: number; height: number }>,
    private readonly canWallJump = false,
    private readonly canGlide = false,
    private readonly canHook = false,
    private readonly canSlide = false,
    /** Couches (D-107) : [présent, souvenir] et le nombre de surfaces du présent. */
    layered: { readonly levels: readonly LevelData[]; readonly presentCount: number } | null = null,
  ) {
    this.levels = layered?.levels ?? [level];
    this.presentCount = layered?.presentCount ?? map.surfaces.length;
    this.keepRecords = canWallJump || layered !== null;
    const [first, second] = this.levels;
    if (first && second) {
      const diff = new Uint8Array(first.width * first.height);
      for (let i = 0; i < diff.length; i++) {
        diff[i] = first.tiles[i] === second.tiles[i] ? 0 : 1;
      }
      this.diff = diff;
    } else {
      this.diff = null;
    }
    this.main = new PlayerPhysics(level, params, 0, 0, hitbox);
    this.probe = new PlayerPhysics(level, params, 0, 0, hitbox);
    this.main.canClimb = canClimb;
    this.probe.canClimb = canClimb;
    this.main.canWallJump = canWallJump;
    this.probe.canWallJump = canWallJump;
    this.main.canGlide = canGlide;
    this.probe.canGlide = canGlide;
    this.main.canHook = canHook;
    this.probe.canHook = canHook;
    this.main.canSlide = canSlide;
    this.probe.canSlide = canSlide;
    const derived = deriveMovement(params);
    this.stepMs = derived.dt * 1000;
    this.coyoteSteps = derived.coyoteSteps;
    const apexPx = (derived.jumpVelocity * derived.jumpVelocity) / (2 * derived.riseGravity);
    const airtime =
      derived.jumpVelocity / derived.riseGravity + Math.sqrt((2 * apexPx) / derived.fallGravity);
    // Sous le parapluie (D-62), on va aussi loin que la hauteur de la salle le permet.
    const glideTime = canGlide ? (level.height * T) / params.glideFallSpeed : 0;
    // Le long des câbles (D-65) : au plus leur longueur à la vitesse minimale, en plus du plané.
    let cableTime = 0;
    let cableSpan = 0;
    if (canGlide && canHook) {
      for (const c of this.levels.flatMap((l) => l.cables)) {
        cableTime += Math.hypot(c.x2 - c.x1, c.y2 - c.y1) / params.cableMinSpeed;
        cableSpan += c.x2 - c.x1;
      }
    }
    // Le saut long de la glissade (D-84) va plus vite que la course.
    const speed = canSlide
      ? Math.max(params.maxRunSpeed, params.slideJumpSpeedX)
      : params.maxRunSpeed;
    const slidePx = canSlide ? params.slideSpeed * (params.slideDurationMs / 1000) : 0;
    this.reachPx = 1.5 * speed * (airtime + glideTime) + cableSpan + slidePx + 3 * T;
    this.maxAirSteps = canGlide
      ? MOVE_SEARCH.maxSteps + Math.ceil((glideTime + cableTime) / derived.dt)
      : MOVE_SEARCH.maxSteps;
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
          families.push({
            kind,
            dir,
            holdSteps,
            airRelease,
            glide: false,
            cableExit: null,
            slideJumpAfter: -2,
            targets: [],
            steps: [],
            lands: [],
          });
        }
      }
      if (this.canGlide) {
        const exits: (CableExit | null)[] =
          this.canHook && this.levels.some((l) => l.cables.length > 0)
            ? [null, 'drop', 'jump']
            : [null];
        for (const cableExit of exits) {
          families.push({
            kind,
            dir,
            holdSteps: 0,
            airRelease: false,
            glide: true,
            cableExit,
            slideJumpAfter: -2,
            targets: [],
            steps: [],
            lands: [],
          });
        }
      }
    }
    return families;
  }

  /**
   * Passage sans timing suivi d'instants de bascule (D-107) : un essai brut vers leur nœud (aucun
   * si `node` < 0). `startMs` : durée de l'élan avant le vol.
   */
  private recordShifted(
    from: number,
    kind: MoveKind,
    dir: number,
    node: number,
    startMs: number,
  ): void {
    if (node < 0) {
      return;
    }
    this.records.push({
      from,
      kind,
      dir,
      holdSteps: 0,
      airRelease: false,
      targets: [node],
      msPerTry: Number.POSITIVE_INFINITY,
      times: [startMs],
      shift: true,
    });
  }

  /** Famille d'essais simple (sans saut ni glissade) : la bascule sur place ou en courant. */
  private plainFamily(kind: MoveKind, dir: number): Family {
    return {
      kind,
      dir,
      holdSteps: 0,
      airRelease: false,
      glide: false,
      cableExit: null,
      slideJumpAfter: -2,
      targets: [],
      steps: [],
      lands: [],
    };
  }

  /**
   * La même famille, avec une bascule en plein vol (D-107) : ses cibles sont des nœuds. Seulement
   * pour certains sauts (`SHIFT_SEARCH`) ; undefined sinon.
   */
  private shiftFamily(family: Family): Family | undefined {
    const tried =
      SHIFT_SEARCH.jumpHoldSteps.includes(family.holdSteps) &&
      !family.airRelease &&
      (family.slideJumpAfter < 0 ||
        SHIFT_SEARCH.slideJumpAfterSteps.includes(family.slideJumpAfter));
    return tried ? { ...family, targets: [], steps: [], lands: [], shift: true } : undefined;
  }

  /**
   * Depuis l'état de `from`, bascule maintenant (D-107), puis garde la direction `dir` jusqu'au sol :
   * la surface atteinte dans l'autre couche, -1 si la bascule est refusée ou mène au danger.
   */
  private tryShiftThen(from: PlayerPhysics, dir: number): number {
    const probe = this.probe;
    probe.copyFrom(from);
    this.airSteps = 0;
    this.landX = Number.NaN;
    if (!this.shiftNow(probe) || touchesHazard(probe.collisionLevel, probe.box)) {
      return -1;
    }
    return this.finish(dir);
  }

  /** Glissades lancées en courant dans le sens `dir` (D-84) : seule, ou suivie d'un saut long. */
  private slideFamilies(dir: number): Family[] {
    if (!this.canSlide) {
      return [];
    }
    const base = { dir, airRelease: false, glide: false, cableExit: null };
    const families: Family[] = [
      {
        ...base,
        kind: MoveKind.Slide,
        holdSteps: 0,
        slideJumpAfter: -1,
        targets: [],
        steps: [],
        lands: [],
      },
    ];
    for (const slideJumpAfter of SLIDE_SEARCH.jumpAfterSteps) {
      for (const holdSteps of SLIDE_SEARCH.jumpHoldSteps) {
        families.push({
          ...base,
          kind: MoveKind.SlideJump,
          holdSteps,
          slideJumpAfter,
          targets: [],
          steps: [],
          lands: [],
        });
      }
    }
    return families;
  }

  /** Garde un passage sans timing comme un essai brut (saut mural ou bascule). */
  private recordSingle(move: Move): void {
    if (this.keepRecords && !Number.isFinite(move.windowMs)) {
      this.records.push({
        ...move,
        targets: [move.to],
        msPerTry: move.windowMs,
        times: [move.durationMs],
      });
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
      const times = family.steps.map((steps, i) => i * msPerTry + steps * this.stepMs);
      if (this.keepRecords) {
        this.records.push({ ...family, from, msPerTry, times });
      }
      if (family.shift) {
        continue; // Ses cibles sont des nœuds : passages calculés à travers eux (`wallWindows`).
      }
      const bestRun = new Map<number, { count: number; end: number }>();
      let runTarget = -2;
      let run = 0;
      family.targets.forEach((target, i) => {
        run = target === runTarget ? run + 1 : 1;
        runTarget = target;
        if (run > (bestRun.get(target)?.count ?? 0)) {
          bestRun.set(target, { count: run, end: i });
        }
      });
      for (const [to, { count, end }] of bestRun) {
        let durationMs = 0;
        let toX = Number.NaN;
        for (let i = end - count + 1; i <= end; i++) {
          const time = times[i] ?? Number.POSITIVE_INFINITY;
          if (time >= durationMs) {
            durationMs = time;
            toX = family.lands[i] ?? Number.NaN;
          }
        }
        offer({
          from,
          to,
          kind: family.kind,
          dir: family.dir,
          holdSteps: family.holdSteps,
          airRelease: family.airRelease,
          windowMs: count * msPerTry,
          durationMs,
          ...(family.glide ? { glide: true } : {}),
          ...(family.cableExit ? { cableExit: family.cableExit } : {}),
          ...(family.slideJumpAfter >= 0 ? { slideJumpAfter: family.slideJumpAfter } : {}),
          ...(Number.isFinite(toX) ? { toX } : {}),
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
        if (row >= 0 && this.levels.some((l) => tileAt(l, col, row) !== Tile.Empty)) {
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
    main.reset(x0, surface.row * T - hitbox.height, this.levelOf(surface.id));
    const families = [
      ...this.families(MoveKind.RunningJump, [dir], true),
      ...this.slideFamilies(dir),
    ];
    // La bascule (D-107) : les mêmes sauts avec une bascule en plein vol, et la bascule en courant.
    const shiftFamilies = this.diff ? families.map((f) => this.shiftFamily(f)) : [];
    const runShift = this.diff ? this.plainFamily(MoveKind.Shift, dir) : null;
    const shifted = { node: -1 };
    const input = this.input;
    const dirs = [dir];
    let lastX = Number.NaN;
    let stuck = 0;
    /** Pas de course depuis le bord de la surface (durée d'une chute par le bord, D-67). */
    let ran = 0;
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
      const sampled = k % SHIFT_SEARCH.launchSteps === 0;
      families.forEach((family, f) => {
        let target = surface.id;
        const attempt = (resume?: AirSnap) =>
          family.slideJumpAfter === -2
            ? this.tryJump(
                main,
                dir,
                family.holdSteps,
                family.airRelease,
                family.glide,
                family.cableExit,
                resume,
              )
            : this.trySlide(main, dir, family.slideJumpAfter, family.holdSteps);
        shifted.node = -1;
        if (worth) {
          target = sampled && shiftFamilies[f] ? this.withShift(attempt, shifted) : attempt();
        }
        family.targets.push(target);
        family.steps.push(worth ? this.airSteps : 0);
        family.lands.push(worth ? this.landX : Number.NaN);
        if (sampled) {
          shiftFamilies[f]?.targets.push(shifted.node);
          shiftFamilies[f]?.steps.push(0);
          shiftFamilies[f]?.lands.push(Number.NaN);
        }
      });
      if (runShift && sampled) {
        const target = this.tryShiftThen(main, dir);
        runShift.targets.push(target);
        runShift.steps.push(this.airSteps);
        runShift.lands.push(this.landX);
      }
      ran++;
      input.moveX = dir;
      input.moveY = 0;
      input.jumpPressed = false;
      input.jumpHeld = false;
      main.step(input);
      if (touchesHazard(main.collisionLevel, main.box)) {
        // La course elle-même mène au danger : rien au-delà n'est atteignable ainsi.
        stuck = 5;
        break;
      }
    }
    this.offerWindows(surface.id, families, this.stepMs, offer);
    if (runShift) {
      const launchMs = SHIFT_SEARCH.launchSteps * this.stepMs;
      this.offerWindows(surface.id, [...defined(shiftFamilies), runShift], launchMs, offer);
    }

    // Contre un obstacle bas : s'arrêter devant, puis glisser dessous (D-84), sans timing.
    if (this.canSlide && stuck > 4 && !touchesHazard(main.collisionLevel, main.box)) {
      const to = this.trySlide(main, dir, -1, 0);
      offer({
        from: surface.id,
        to,
        kind: MoveKind.Slide,
        dir,
        holdSteps: 0,
        airRelease: false,
        windowMs: Number.POSITIVE_INFINITY,
        durationMs: (ran + this.airSteps) * this.stepMs,
        ...this.landing(),
      });
    }

    // Sans sauter : courir au-delà du bord et tomber.
    if (stuck <= 4) {
      const to = this.withShift(() => {
        this.probe.copyFrom(main);
        input.moveX = dir;
        this.airSteps = 0;
        return this.finish(dir);
      }, shifted);
      this.recordShifted(surface.id, MoveKind.WalkOff, dir, shifted.node, ran * this.stepMs);
      offer({
        from: surface.id,
        to,
        kind: MoveKind.WalkOff,
        dir,
        holdSteps: 0,
        airRelease: false,
        windowMs: Number.POSITIVE_INFINITY,
        durationMs: (ran + this.airSteps) * this.stepMs,
        ...this.landing(),
      });
      if (this.canGlide) {
        // Tomber du bord, puis ouvrir le parapluie (D-62).
        const glideTo = this.withShift(() => {
          this.probe.copyFrom(main);
          this.airSteps = 0;
          return this.finish(dir, true);
        }, shifted);
        this.recordShifted(surface.id, MoveKind.WalkOff, dir, shifted.node, ran * this.stepMs);
        offer({
          from: surface.id,
          to: glideTo,
          kind: MoveKind.WalkOff,
          dir,
          holdSteps: 0,
          airRelease: false,
          windowMs: Number.POSITIVE_INFINITY,
          durationMs: (ran + this.airSteps) * this.stepMs,
          glide: true,
          ...this.landing(),
        });
      }
    }
  }

  private standingJumps(surface: Surface, offer: (move: Move) => void): void {
    const hitbox = this.hitbox;
    const step = MOVE_SEARCH.standingSampleStepPx;
    const airDirs = [-1, 0, 1];
    const families = this.families(MoveKind.StandingJump, airDirs, false);
    // La bascule (D-107) : les mêmes sauts avec une bascule en plein vol, et la bascule sur place.
    const shiftFamilies = this.diff ? families.map((f) => this.shiftFamily(f)) : [];
    const standShift = this.diff ? this.plainFamily(MoveKind.Shift, 0) : null;
    const shifted = { node: -1 };
    const y = surface.row * T - hitbox.height;
    const xMax = (surface.colEnd + 1) * T - hitbox.width;
    const level = this.levelOf(surface.id);
    let i = 0;
    for (let x = surface.colStart * T; x <= xMax; x += step, i++) {
      const worth = this.worthTrying(surface, x, airDirs);
      const sampled = i % SHIFT_SEARCH.launchSteps === 0;
      families.forEach((family, f) => {
        let target = surface.id;
        this.airSteps = 0;
        shifted.node = -1;
        if (worth) {
          this.main.reset(x, y, level);
          const attempt = (resume?: AirSnap) =>
            this.tryJump(
              this.main,
              family.dir,
              family.holdSteps,
              false,
              family.glide,
              family.cableExit,
              resume,
            );
          target = sampled && shiftFamilies[f] ? this.withShift(attempt, shifted) : attempt();
        }
        family.targets.push(target);
        family.steps.push(this.airSteps);
        family.lands.push(worth ? this.landX : Number.NaN);
        if (sampled) {
          shiftFamilies[f]?.targets.push(shifted.node);
          shiftFamilies[f]?.steps.push(0);
          shiftFamilies[f]?.lands.push(Number.NaN);
        }
      });
      if (standShift) {
        this.main.reset(x, y, level);
        standShift.targets.push(this.tryShiftThen(this.main, 0));
        standShift.steps.push(this.airSteps);
        standShift.lands.push(this.landX);
      }
    }
    // Précision de placement demandée, exprimée en temps de course.
    const placeMs = (step / this.params.maxRunSpeed) * 1000;
    this.offerWindows(surface.id, families, placeMs, offer);
    if (standShift) {
      const launchMs = placeMs * SHIFT_SEARCH.launchSteps;
      this.offerWindows(surface.id, defined(shiftFamilies), launchMs, offer);
      this.offerWindows(surface.id, [standShift], placeMs, offer);
    }
  }

  private drops(surface: Surface, offer: (move: Move) => void): void {
    const hitbox = this.hitbox;
    const input = this.input;
    for (let col = surface.colStart; col <= surface.colEnd; col++) {
      const level = this.levelOf(surface.id);
      if (tileAt(level, col, surface.row) !== Tile.OneWay) {
        continue;
      }
      const probe = this.probe;
      probe.reset(col * T + (T - hitbox.width) / 2, surface.row * T - hitbox.height, level);
      input.moveX = 0;
      input.moveY = 1;
      input.jumpPressed = true;
      input.jumpHeld = true;
      probe.step(input);
      input.moveY = 0;
      input.jumpPressed = false;
      input.jumpHeld = false;
      this.airSteps = 1;
      const to = this.finish(0);
      offer({
        from: surface.id,
        to,
        kind: MoveKind.Drop,
        dir: 0,
        holdSteps: 0,
        airRelease: false,
        windowMs: Number.POSITIVE_INFINITY,
        durationMs: this.airSteps * this.stepMs,
        ...this.landing(),
      });
    }
  }

  /**
   * Depuis l'état de `from`, saute maintenant et retourne la surface où Céleste s'arrête. `glide` :
   * au sommet, une nouvelle pression de Saut ouvre le parapluie, tenu jusqu'au sol (D-62, D-70).
   * `cableExit` : comment quitter un câble (D-65).
   */
  private tryJump(
    from: PlayerPhysics,
    dir: number,
    holdSteps: number,
    airRelease: boolean,
    glide = false,
    cableExit: CableExit | null = null,
    /** Reprise d'un essai journalisé à un pas donné (bascule, D-107). */
    resume?: AirSnap,
  ): number {
    const probe = this.probe;
    probe.copyFrom(resume?.phys ?? from);
    const input = this.input;
    input.moveY = 0;
    let airborne = resume?.airborne ?? false;
    let apex = resume?.apex ?? false;
    const start = resume ? this.shiftAt : 0;
    this.airSteps = start;
    this.landX = Number.NaN;
    /** Pas depuis la sortie d'un câble (-1 : pas encore quitté). */
    let sinceCable = resume?.sinceCable ?? -1;
    /** Ouverture du parapluie au sommet : 0 pas encore, 1 Saut relâché, 2 pressé de nouveau. */
    let opened = resume?.opened ?? 0;
    for (let s = start; s < this.maxAirSteps; s++) {
      if (airborne && probe.grounded) {
        break;
      }
      // Variables au début du pas : une reprise à ce pas (D-107) refait la suite à l'identique.
      const apexTop = apex;
      const openedTop = opened;
      const sinceCableTop = sinceCable;
      apex ||= airborne && probe.vy >= 0;
      input.jumpPressed = s === 0;
      if (glide) {
        input.jumpHeld = true;
        if (apex && opened < 2) {
          // Parapluie (D-62, D-70) : au sommet, Saut relâché un pas puis pressé de nouveau.
          input.jumpHeld = opened === 1;
          input.jumpPressed = opened === 1;
          opened++;
        }
        if (cableExit && sinceCable >= 0) {
          // Câble quitté : relâcher (drop), ou relâcher puis presser aussitôt (jump).
          input.jumpHeld = cableExit === 'jump' && sinceCable >= 1;
          input.jumpPressed = cableExit === 'jump' && sinceCable === 1;
          sinceCable++;
        }
      } else {
        input.jumpHeld = holdSteps === 0 || s < holdSteps;
      }
      input.moveX = airRelease && s > 0 ? 0 : dir;
      const onCable = probe.cable >= 0;
      if (!this.beforeStep(probe, true, airborne, apexTop, openedTop, sinceCableTop)) {
        return -1;
      }
      const before = probe.state;
      probe.step(input);
      this.airSteps++;
      if (touchesHazard(probe.collisionLevel, probe.box)) {
        return -1;
      }
      if (this.enteredWall(before)) {
        return this.wallNodeOf(probe);
      }
      airborne ||= !probe.grounded;
      if (onCable && probe.cable < 0 && sinceCable < 0) {
        sinceCable = 0;
      }
    }
    return this.finish(0, glide && cableExit === null);
  }

  /**
   * Depuis l'état de `from`, glisse maintenant dans le sens `dir` (D-84), en poussant toujours vers
   * lui ; `jumpAfter` ≥ 0 : saut long ce nombre de pas après, tenu `holdSteps` pas (0 : jusqu'au
   * sol). Retourne la surface où Céleste s'arrête, debout.
   */
  private trySlide(from: PlayerPhysics, dir: number, jumpAfter: number, holdSteps: number): number {
    const probe = this.probe;
    probe.copyFrom(from);
    const input = this.input;
    input.moveY = 0;
    input.moveX = dir;
    let airborne = false;
    this.airSteps = 0;
    this.landX = Number.NaN;
    for (let s = 0; s < this.maxAirSteps; s++) {
      if (airborne && probe.grounded) {
        break;
      }
      if (
        s > jumpAfter &&
        s > 0 &&
        !airborne &&
        probe.grounded &&
        !probe.low &&
        probe.slideSteps === 0
      ) {
        break; // Debout après la glissade.
      }
      const sinceJump = jumpAfter >= 0 ? s - jumpAfter : -1;
      input.abilityPressed = s === 0;
      input.jumpPressed = sinceJump === 0;
      input.jumpHeld = sinceJump >= 0 && (holdSteps === 0 || sinceJump < holdSteps);
      if (!this.beforeStep(probe)) {
        input.abilityPressed = false;
        return -1;
      }
      const before = probe.state;
      probe.step(input);
      this.airSteps++;
      if (touchesHazard(probe.collisionLevel, probe.box)) {
        input.abilityPressed = false;
        return -1;
      }
      if (this.enteredWall(before)) {
        input.abilityPressed = false;
        return this.wallNodeOf(probe);
      }
      airborne ||= !probe.grounded;
    }
    input.abilityPressed = false;
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
    )}:${String(player.releasedWall)}:${player.collisionLevel === this.levels[0] ? 'p' : 'm'}`;
    const known = this.wallIds.get(key);
    if (known !== undefined) {
      return known;
    }
    if (this.wallNodes.length >= WALL_SEARCH.maxNodes) {
      throw new Error(`Analyse : plus de ${String(WALL_SEARCH.maxNodes)} appuis sur les murs`);
    }
    const id = this.newNode();
    const snapshot = new PlayerPhysics(player.collisionLevel, this.params, 0, 0, this.hitbox);
    snapshot.copyFrom(player);
    const node: WallNode = {
      id,
      dir: player.wallDir,
      snapshot,
    };
    this.wallNodes.push(node);
    this.wallQueue.push(node);
    this.wallIds.set(key, node.id);
    return node.id;
  }

  /** Nouveau nœud (appui ou instants de bascule), numéroté après les surfaces. */
  private newNode(): number {
    return this.map.surfaces.length + this.nodeTotal++;
  }

  /** Salle de la couche d'une surface (D-107). */
  private levelOf(surfaceId: number): LevelData {
    return (
      (surfaceId >= this.presentCount ? this.levels[1] : this.levels[0]) ?? this.main.collisionLevel
    );
  }

  /** Bascule de `player` dans l'autre couche (D-107), avec la marge des réglages. */
  private shiftNow(player: PlayerPhysics): boolean {
    const [present, memory] = this.levels;
    if (!present || !memory) {
      return false;
    }
    const to = player.collisionLevel === present ? memory : present;
    return player.shiftTo(to, this.params.shiftNudgePx);
  }

  /** Vrai si la boîte est près d'une tuile qui diffère d'une couche à l'autre (D-107). */
  private isNear(player: PlayerPhysics): boolean {
    const diff = this.diff;
    if (!diff) {
      return false;
    }
    const box = player.box;
    const level = player.collisionLevel;
    const width = level.width;
    const colFrom = Math.max(0, Math.floor(box.x / T) - SHIFT_SEARCH.nearTiles);
    const colTo = Math.min(width - 1, Math.floor((box.x + box.width) / T) + SHIFT_SEARCH.nearTiles);
    const rowFrom = Math.max(0, Math.floor(box.y / T) - SHIFT_SEARCH.nearTilesAbove);
    const rowTo = Math.min(
      level.height - 1,
      Math.floor((box.y + box.height) / T) + SHIFT_SEARCH.nearTiles,
    );
    for (let row = rowFrom; row <= rowTo; row++) {
      for (let col = colFrom; col <= colTo; col++) {
        if (diff[row * width + col]) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Avant chaque pas d'un essai (D-107) : note si Céleste est près d'une zone, et bascule au pas
   * `shiftAt`. Retourne false si la bascule est refusée (l'essai échoue).
   */
  private beforeStep(
    player: PlayerPhysics,
    resumable = false,
    airborne = false,
    apex = false,
    opened = 0,
    sinceCable = -1,
  ): boolean {
    const log = this.nearLog;
    const k = this.airSteps;
    if (log) {
      const near = this.isNear(player);
      log.push(near);
      if (!isShiftCandidate(log, k)) {
        return k !== this.shiftAt || this.shiftNow(player);
      }
      let snap = this.snaps[k];
      if (!snap) {
        snap = {
          phys: new PlayerPhysics(player.collisionLevel, this.params, 0, 0, this.hitbox),
          airborne,
          apex,
          opened,
          sinceCable,
          resumable,
        };
        this.snaps[k] = snap;
      }
      snap.phys.copyFrom(player);
      snap.airborne = airborne;
      snap.apex = apex;
      snap.opened = opened;
      snap.sinceCable = sinceCable;
      snap.resumable = resumable;
    }
    return this.airSteps !== this.shiftAt || this.shiftNow(player);
  }

  /**
   * Instants de bascule d'un essai qui vient d'être joué (D-107), d'après son journal : le début de
   * chaque moment loin des zones (basculer plus tard dans ce moment revient au même), et tous les
   * `sampleSteps` pas près d'elles. Rejoue l'essai (`attempt`) en basculant à chacun ; retourne le
   * nœud de ces instants (ses essais sont espacés de `sampleSteps` pas), -1 si aucun.
   */
  private shiftNode(log: readonly boolean[], attempt: (resume?: AirSnap) => number): number {
    const sample = SHIFT_SEARCH.sampleSteps;
    const farCap = Math.max(1, Math.round(SHIFT_SEARCH.farCapMs / (sample * this.stepMs)));
    if (!log.some((near) => near)) {
      return -1;
    }
    const targets: number[] = [];
    const times: number[] = [];
    let k = 0;
    while (k < log.length) {
      let next = k + 1;
      while (next < log.length && !isShiftCandidate(log, next)) {
        next++;
      }
      const span = next - k;
      this.shiftAt = k;
      const snap = this.snaps[k];
      const target = snap?.resumable ? attempt(snap) : attempt();
      this.shiftAt = -1;
      const time = this.airSteps * this.stepMs;
      // Un moment loin des zones compte pour sa durée (bornée), en essais de `sample` pas.
      const repeat = log[k] ? 1 : Math.min(farCap, Math.max(1, Math.round(span / sample)));
      for (let r = 0; r < repeat; r++) {
        targets.push(target);
        times.push(time);
      }
      k = next;
    }
    if (targets.every((t) => t < 0)) {
      return -1;
    }
    const id = this.newNode();
    this.records.push({
      from: id,
      kind: MoveKind.Shift,
      dir: 0,
      holdSteps: 0,
      airRelease: false,
      targets,
      msPerTry: sample * this.stepMs,
      times,
      shift: true,
    });
    return id;
  }

  /**
   * Joue un essai (`attempt`) ; avec la bascule, joue aussi ses instants de bascule et retourne le
   * nœud correspondant dans `shifted` (-1 sans bascule ou loin de toute zone).
   */
  private withShift(attempt: (resume?: AirSnap) => number, shifted: { node: number }): number {
    shifted.node = -1;
    if (!this.diff) {
      return attempt();
    }
    const log: boolean[] = [];
    this.nearLog = log;
    const target = attempt();
    this.nearLog = null;
    const steps = this.airSteps;
    const land = this.landX;
    shifted.node = this.shiftNode(log, attempt);
    this.airSteps = steps;
    this.landX = land;
    return target;
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
    const families = this.families(MoveKind.WallJump, [-w, 0, w], false).filter(
      (family) => !family.glide && WALL_SEARCH.jumpHoldSteps.includes(family.holdSteps),
    );
    // La bascule (D-107) : les mêmes rebonds avec une bascule en plein vol, et la bascule en
    // glissant contre le mur (on continue de pousser vers lui).
    // Rebonds avec bascule : vers le large seulement (vers l'autre mur d'une cheminée).
    const shiftFamilies = this.diff
      ? families.map((f) => (f.dir === -w ? this.shiftFamily(f) : undefined))
      : [];
    const wallShift = this.diff ? this.plainFamily(MoveKind.Shift, w) : null;
    const shifted = { node: -1 };
    const main = this.main;
    main.copyFrom(node.snapshot);
    const input = this.input;
    for (let k = 0; k < WALL_SEARCH.maxSlideSteps; k++) {
      if (main.grounded || main.onLedge || main.wallDir === 0) {
        break;
      }
      if (k % WALL_SEARCH.sampleSteps === 0) {
        const sampled = k % SHIFT_SEARCH.kickSteps === 0;
        families.forEach((family, f) => {
          const kick = (resume?: AirSnap) =>
            this.tryKick(main, family.dir, family.holdSteps, resume);
          shifted.node = -1;
          const withShift = sampled && shiftFamilies[f];
          family.targets.push(withShift ? this.withShift(kick, shifted) : kick());
          family.steps.push(this.airSteps);
          family.lands.push(this.landX);
          if (sampled) {
            shiftFamilies[f]?.targets.push(shifted.node);
            shiftFamilies[f]?.steps.push(0);
            shiftFamilies[f]?.lands.push(Number.NaN);
          }
        });
        if (wallShift && sampled) {
          wallShift.targets.push(this.tryShiftThen(main, w));
          wallShift.steps.push(this.airSteps);
          wallShift.lands.push(this.landX);
        }
      }
      input.moveX = w;
      input.moveY = 0;
      input.jumpPressed = false;
      input.jumpHeld = false;
      main.step(input);
      if (touchesHazard(main.collisionLevel, main.box)) {
        break;
      }
    }
    const kickMs = WALL_SEARCH.sampleSteps * this.stepMs;
    this.offerWindows(node.id, families, kickMs, offer);
    if (wallShift) {
      const shiftKickMs = SHIFT_SEARCH.kickSteps * this.stepMs;
      this.offerWindows(node.id, [...defined(shiftFamilies), wallShift], shiftKickMs, offer);
    }
    for (const dir of [w, 0, -w]) {
      const to = this.withShift(() => {
        this.probe.copyFrom(node.snapshot);
        this.airSteps = 0;
        return this.finish(dir);
      }, shifted);
      this.recordShifted(node.id, MoveKind.WallLetGo, dir, shifted.node, 0);
      offer({
        from: node.id,
        to,
        kind: MoveKind.WallLetGo,
        dir,
        holdSteps: 0,
        airRelease: false,
        windowMs: Number.POSITIVE_INFINITY,
        durationMs: this.airSteps * this.stepMs,
      });
    }
    return [...best.values()];
  }

  /** Depuis la glissade de `from`, rebondit maintenant ; retourne la surface ou l'appui atteint. */
  private tryKick(
    from: PlayerPhysics,
    dir: number,
    holdSteps: number,
    /** Reprise d'un essai journalisé à un pas donné (bascule, D-107). */
    resume?: AirSnap,
  ): number {
    const probe = this.probe;
    probe.copyFrom(resume?.phys ?? from);
    const input = this.input;
    input.moveY = 0;
    const start = resume ? this.shiftAt : 0;
    this.airSteps = start;
    this.landX = Number.NaN;
    for (let s = start; s < MOVE_SEARCH.maxSteps && !probe.grounded; s++) {
      // Pas de plané après un saut mural dans l'analyse (prudente).
      input.jumpPressed = s === 0;
      input.jumpHeld = holdSteps === 0 || s < holdSteps;
      input.moveX = dir;
      if (!this.beforeStep(probe, true)) {
        return -1;
      }
      const before = probe.state;
      probe.step(input);
      this.airSteps++;
      if (touchesHazard(probe.collisionLevel, probe.box)) {
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
   * puis lâche tout jusqu'à l'arrêt. Retourne la surface d'arrivée, -1 si aucune. `glide` : Saut
   * tenu jusqu'au sol, pressé au premier pas si le parapluie n'est pas encore ouvert (D-62).
   */
  private finish(dir: number, glide = false): number {
    this.landX = Number.NaN;
    const probe = this.probe;
    const input = this.input;
    input.moveX = dir;
    input.moveY = 0;
    input.jumpHeld = glide;
    let s = 0;
    while (!probe.grounded && s < this.maxAirSteps) {
      input.jumpPressed = glide && s === 0 && !probe.glideOpen;
      if (!this.beforeStep(probe)) {
        return -1;
      }
      const before = probe.state;
      probe.step(input);
      this.airSteps++;
      if (touchesHazard(probe.collisionLevel, probe.box)) {
        return -1;
      }
      if (this.enteredWall(before)) {
        return this.wallNodeOf(probe);
      }
      s++;
    }
    input.moveX = 0;
    input.jumpPressed = false;
    input.jumpHeld = false;
    for (let settle = 0; settle < MOVE_SEARCH.settleSteps; settle++) {
      if (probe.grounded && probe.vx === 0) {
        break;
      }
      probe.step(input);
      if (touchesHazard(probe.collisionLevel, probe.box)) {
        return -1;
      }
    }
    if (!probe.grounded) {
      return -1;
    }
    this.landX = probe.box.x;
    return this.surfaceOf(probe);
  }

  /** Position d'atterrissage du dernier essai, pour un passage (`toX`, D-87). */
  private landing(): { toX?: number } {
    return Number.isFinite(this.landX) ? { toX: this.landX } : {};
  }

  private surfaceOf(player: PlayerPhysics): number {
    const box = player.box;
    const row = Math.round((box.y + box.height) / T);
    const level = player.collisionLevel;
    const width = level.width;
    const plane = level === this.levels[0] ? 0 : level.width * level.height;
    const center = Math.floor((box.x + box.width / 2) / T);
    for (const col of [center, Math.floor(box.x / T), Math.floor((box.x + box.width - 1e-6) / T)]) {
      if (col < 0 || col >= width) {
        continue;
      }
      const id = this.map.idByTile[plane + row * width + col];
      if (id !== undefined && id >= 0) {
        return id;
      }
    }
    return -1;
  }
}

/**
 * Instant de bascule essayé (D-107) d'un essai journalisé (`log` : près d'une zone, pas par pas,
 * connu jusqu'au pas `k`) : le premier pas, chaque changement entre près et loin, et tous les
 * `sampleSteps` pas près des zones. Loin des zones, basculer plus tard revient au même.
 */
function isShiftCandidate(log: readonly boolean[], k: number): boolean {
  const near = log[k] ?? false;
  return k === 0 || near !== log[k - 1] || (near && k % SHIFT_SEARCH.sampleSteps === 0);
}

function defined<T>(items: readonly (T | undefined)[]): T[] {
  return items.filter((item): item is T => item !== undefined);
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
  /** Parapluie (D-62, D-65) : ouvert au sommet d'un saut ou après une chute, tenu jusqu'au sol. */
  readonly glide?: boolean;
  /** Crochet du parapluie (D-65) : en planant, accroché aux câbles, avec ses sorties. */
  readonly hook?: boolean;
  /** Glissade (D-84) : sous les obstacles bas, et sauts longs depuis la glissade. */
  readonly slide?: boolean;
  /**
   * La bascule (D-107), dans une salle à deux couches : au sol, en courant, en plein saut, contre un
   * mur. Les surfaces des deux couches sont analysées ensemble (`presentCount`).
   */
  readonly shift?: boolean;
  /** Hitbox de Céleste (croissance, D-43) ; par défaut, celle de la première phase. */
  readonly hitbox?: Readonly<{ width: number; height: number }>;
}

/**
 * Surfaces des deux couches d'une salle (D-107) : celles du présent, puis celles du souvenir ;
 * `idByTile` a deux plans (présent, souvenir).
 */
function layeredSurfaces(
  present: LevelData,
  memory: LevelData,
  playerHeight: number,
): SurfaceMap & { readonly presentCount: number } {
  const p = findSurfaces(present, playerHeight);
  const m = findSurfaces(memory, playerHeight);
  const offset = p.surfaces.length;
  const plane = present.width * present.height;
  const idByTile = new Int32Array(plane * 2);
  idByTile.set(p.idByTile, 0);
  for (let i = 0; i < plane; i++) {
    const id = m.idByTile[i] ?? -1;
    idByTile[plane + i] = id >= 0 ? id + offset : -1;
  }
  return {
    surfaces: [
      ...p.surfaces,
      ...m.surfaces.map((surface) => ({ ...surface, id: surface.id + offset })),
    ],
    idByTile,
    presentCount: offset,
  };
}

/** Surface sous une tuile de marqueur dans une couche (D-107) d'une analyse à deux couches. */
export function layerSurfaceUnder(
  level: LevelData,
  analysis: LevelAnalysis,
  layer: Layer,
  col: number,
  row: number,
): number {
  if (row + 1 >= level.height) {
    return -1;
  }
  const plane =
    analysis.presentCount !== undefined && layer === 'memory' ? level.width * level.height : 0;
  return analysis.map.idByTile[plane + (row + 1) * level.width + col] ?? -1;
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
  const layered = abilities.shift === true && level.layers !== null;
  const present = atLayer(level, 'present');
  const memory = atLayer(level, 'memory');
  const two = layered ? layeredSurfaces(present, memory, hitbox.height) : null;
  const map: SurfaceMap = two ?? findSurfaces(level, hitbox.height);
  const presentCount = two?.presentCount;
  const explorer = new MoveExplorer(
    layered ? present : level,
    params,
    map,
    abilities.climb ?? false,
    hitbox,
    abilities.wallJump ?? false,
    abilities.glide ?? false,
    abilities.hook ?? false,
    abilities.slide ?? false,
    layered && presentCount !== undefined ? { levels: [present, memory], presentCount } : null,
  );
  const moves = exploreAll(explorer, map);
  const base = { map, ...(presentCount !== undefined ? { presentCount } : {}) };
  const startLayer: Layer = level.layers?.active === 'memory' ? 'memory' : 'present';
  const start = layered
    ? layerSurfaceUnder(level, base as LevelAnalysis, startLayer, level.spawn.col, level.spawn.row)
    : surfaceUnder(level, map, level.spawn.col, level.spawn.row);
  const goals = level.goal
    ? layered
      ? (['present', 'memory'] as const).map((layer) =>
          layerSurfaceUnder(
            level,
            base as LevelAnalysis,
            layer,
            level.goal?.col ?? 0,
            level.goal?.row ?? 0,
          ),
        )
      : [surfaceUnder(level, map, level.goal.col, level.goal.row)]
    : [];
  let goal = -1;
  let path: Move[] | null = null;
  for (const candidate of goals) {
    if (start < 0 || candidate < 0) {
      continue;
    }
    const found = widestPath(map.surfaces.length, moves, start, candidate);
    if (found && (!path || pathWidth(found) > pathWidth(path))) {
      path = found;
      goal = candidate;
    } else if (goal < 0) {
      goal = candidate;
    }
  }
  let critical: Move | null = null;
  for (const move of path ?? []) {
    if (Number.isFinite(move.windowMs) && (!critical || move.windowMs < critical.windowMs)) {
      critical = move;
    }
  }
  return {
    map,
    moves,
    start,
    goal,
    path,
    critical,
    wallNodeCount: explorer.wallNodes.length,
    ...(presentCount !== undefined ? { presentCount } : {}),
  };
}

/** Fenêtre du passage le plus dur d'un chemin. */
function pathWidth(path: readonly Move[]): number {
  return path.reduce((w, move) => Math.min(w, move.windowMs), Number.POSITIVE_INFINITY);
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
    abilities.glide ?? false,
    abilities.hook ?? false,
    abilities.slide ?? false,
  );
  const moves = explorer.explore(surface);
  if (explorer.nodeTotal === 0) {
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
  if (explorer.nodeTotal === 0) {
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
  for (const move of wallWindows(explorer.records, surfaceCount, explorer.nodeTotal)) {
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
  const nodeTime = new Float64Array(nodeCount);
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
    // Durée (D-67) : depuis chaque appui, le plus rapide des essais qui gardent au moins la
    // fenêtre de l'appui, jusqu'à la surface visée (plus courts chemins, relaxation bornée).
    nodeTime.fill(Number.POSITIVE_INFINITY);
    const timeOf = (target: number) =>
      target === goal
        ? 0
        : target >= surfaceCount
          ? (nodeTime[target - surfaceCount] ?? Number.POSITIVE_INFINITY)
          : Number.POSITIVE_INFINITY;
    const fastest = (record: TryRecord, min: number) => {
      let best = Number.POSITIVE_INFINITY;
      record.targets.forEach((target, i) => {
        if (value(target) >= min) {
          best = Math.min(best, (record.times[i] ?? Number.POSITIVE_INFINITY) + timeOf(target));
        }
      });
      return best;
    };
    for (let pass = 0; pass < nodeCount; pass++) {
      let changed = false;
      for (let n = 0; n < nodeCount; n++) {
        const v = nodeValue[n] ?? 0;
        if (v <= 0) {
          continue;
        }
        let best = nodeTime[n] ?? Number.POSITIVE_INFINITY;
        for (const record of byNode[n] ?? []) {
          best = Math.min(best, fastest(record, v));
        }
        if (best < (nodeTime[n] ?? Number.POSITIVE_INFINITY)) {
          nodeTime[n] = best;
          changed = true;
        }
      }
      if (!changed) {
        break;
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
          durationMs: fastest(record, windowMs),
          start: record.kind,
          ...(record.shift ? { shift: true } : {}),
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
  'wall-let-go': 'glissade contre le mur',
  slide: 'glissade au sol',
  'slide-jump': 'saut depuis la glissade',
  shift: 'bascule',
};

/** Description lisible d'un passage (rapports de test, debug). Colonnes et lignes comptées depuis 1. */
export function describeMove(move: Move, map: SurfaceMap): string {
  const where = (id: number) => {
    const s = map.surfaces[id];
    return s ? `[ligne ${s.row + 1}, col. ${s.colStart + 1}–${s.colEnd + 1}]` : '[?]';
  };
  const arrow = move.dir > 0 ? '→' : move.dir < 0 ? '←' : '↑';
  const hold = move.holdSteps === 0 ? 'maintenu' : `maintien ${move.holdSteps} pas`;
  const air =
    (move.airRelease ? ', direction relâchée' : '') +
    (move.glide ? ', parapluie' : '') +
    (move.cableExit === 'drop' ? ', lâche le câble' : '') +
    (move.cableExit === 'jump' ? ', saute du câble' : '') +
    (move.slideJumpAfter !== undefined ? `, saut ${String(move.slideJumpAfter)} pas après` : '') +
    (move.shift ? ', bascule en plein vol' : '');
  if (move.start) {
    const timing = Number.isFinite(move.windowMs) ? `, fenêtre ${move.windowMs.toFixed(0)} ms` : '';
    const via = move.shift
      ? 'puis appuis sur les murs ou bascule en plein vol'
      : 'puis appuis sur les murs';
    return `${where(move.from)} → ${where(move.to)} : ${KIND_LABEL[move.start]} ${arrow} ${via}${timing}`;
  }
  const timing =
    move.kind === MoveKind.WalkOff || move.kind === MoveKind.Drop || !Number.isFinite(move.windowMs)
      ? ''
      : ` ${arrow} (${hold}${air}), fenêtre ${move.windowMs.toFixed(0)} ms`;
  return `${where(move.from)} → ${where(move.to)} : ${KIND_LABEL[move.kind]}${timing}`;
}
