import { TILE_SIZE as T } from '../../config/display';
import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import type { WorldParams } from '../../config/world';
import { CombatEvent } from '../combat/CombatWorld';
import { EntityType, type LevelData, type TilePos } from '../level/LevelData';
import { touchesHazard, type Box } from '../physics/gridCollision';
import { checkpointId } from '../save/saveData';

export const LifePhase = { Alive: 0, Fainting: 1 } as const;
export type LifePhase = (typeof LifePhase)[keyof typeof LifePhase];

export const FaintCause = { None: 0, Hazard: 1, Fear: 2 } as const;
export type FaintCause = (typeof FaintCause)[keyof typeof FaintCause];

/** Événements du dernier pas (masque de bits). */
export const RunEvent = {
  None: 0,
  /** Un checkpoint vient de devenir le point de retour (sauvegarde automatique). */
  CheckpointActivated: 1,
  /** Début de l'évanouissement. */
  Fainted: 2,
  /** Fin de l'évanouissement : la scène replace Céleste au point de retour. */
  Respawn: 4,
  /** La jauge de peur a changé. */
  FearChanged: 8,
} as const;

export interface CheckpointState {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  /** Zone de contact : la tuile du checkpoint et celle du dessus. */
  readonly box: Box;
  activated: boolean;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * État de la partie dans une salle (D-21), pur et indépendant de Phaser : jauge de peur,
 * évanouissement (danger ou jauge pleine), checkpoints et point de retour. Aucune allocation dans
 * `step`.
 */
export class RunState {
  fear = 0;
  phase: LifePhase = LifePhase.Alive;
  phaseSteps = 0;
  faintCause: FaintCause = FaintCause.None;
  /** Index du checkpoint de retour dans `checkpoints` (-1 : départ de la salle). */
  current = -1;
  events = 0;
  checkpoints: CheckpointState[] = [];
  private decaySteps = 0;
  private decayTotal = 0;
  private faintTotal = 1;
  private readonly params: WorldParams;

  constructor(
    private level: LevelData,
    params: Readonly<WorldParams>,
    private readonly stepHz: number = PHYSICS_STEP_HZ,
  ) {
    this.params = { ...params };
    this.setParams(params);
    this.load(level, [], null);
  }

  get settings(): Readonly<WorldParams> {
    return this.params;
  }

  setParams(params: Readonly<WorldParams>): void {
    const p = Object.assign(this.params, params);
    this.decayTotal = msToSteps(p.fearDecayMs, this.stepHz);
    this.faintTotal = Math.max(1, msToSteps(p.faintMs, this.stepHz));
    if (this.fear > p.fearMax) {
      this.fear = p.fearMax;
    }
  }

  /**
   * Nouvelle salle. `activated` : identifiants `salle:checkpoint` déjà activés (sauvegarde) ;
   * `currentId` : checkpoint de retour dans cette salle (null : départ).
   */
  load(level: LevelData, activated: readonly string[], currentId: string | null): void {
    this.level = level;
    this.checkpoints = level.entities
      .filter((entity) => entity.type === EntityType.Checkpoint)
      .map((entity) => {
        const id = checkpointId(entity.col, entity.row);
        return {
          id,
          col: entity.col,
          row: entity.row,
          box: { x: entity.col * T, y: (entity.row - 1) * T, width: T, height: 2 * T },
          activated: activated.includes(`${level.id}:${id}`),
        };
      });
    this.current = currentId === null ? -1 : this.checkpoints.findIndex((c) => c.id === currentId);
    this.revive();
  }

  /** Identifiant `salle:checkpoint` du point de retour (null : départ de la salle). */
  get currentKey(): string | null {
    const checkpoint = this.checkpoints[this.current];
    return checkpoint ? `${this.level.id}:${checkpoint.id}` : null;
  }

  /** Tuile où réapparaître : le checkpoint courant, sinon le départ `P`. */
  respawnTile(): TilePos {
    const checkpoint = this.checkpoints[this.current];
    return checkpoint ? { col: checkpoint.col, row: checkpoint.row } : this.level.spawn;
  }

  /** Céleste est-elle en train de s'évanouir (la scène suspend alors la simulation) ? */
  get fainting(): boolean {
    return this.phase === LifePhase.Fainting;
  }

  /** Avancement de l'évanouissement (0 → 1), pour le fondu. */
  get faintProgress(): number {
    return this.phase === LifePhase.Fainting ? 1 - this.phaseSteps / this.faintTotal : 0;
  }

  /** Pendant l'évanouissement : un pas, sans rien d'autre (la simulation est suspendue). */
  stepFainting(): void {
    this.events = RunEvent.None;
    this.phaseSteps--;
    if (this.phaseSteps <= 0) {
      this.revive();
      this.events = RunEvent.Respawn | RunEvent.FearChanged;
    }
  }

  /** Un pas de jeu, après Céleste et le combat. */
  step(player: Box, combatEvents: number): void {
    this.events = RunEvent.None;
    const p = this.params;
    if ((combatEvents & CombatEvent.Hurt) !== 0) {
      this.fear++;
      this.decaySteps = 0;
      this.events |= RunEvent.FearChanged;
      if (this.fear >= p.fearMax) {
        this.startFaint(FaintCause.Fear);
        return;
      }
    }
    if (touchesHazard(this.level, player)) {
      this.startFaint(FaintCause.Hazard);
      return;
    }
    const checkpoints = this.checkpoints;
    for (let i = 0; i < checkpoints.length; i++) {
      const checkpoint = checkpoints[i];
      if (checkpoint && i !== this.current && overlaps(player, checkpoint.box)) {
        checkpoint.activated = true;
        this.current = i;
        this.events |= RunEvent.CheckpointActivated;
        if (this.fear > 0) {
          this.fear = 0;
          this.events |= RunEvent.FearChanged;
        }
      }
    }
    if (this.decayTotal > 0 && this.fear > 0) {
      this.decaySteps++;
      if (this.decaySteps >= this.decayTotal) {
        this.decaySteps = 0;
        this.fear--;
        this.events |= RunEvent.FearChanged;
      }
    }
  }

  /** Déclenche un évanouissement (outil de debug : déclenchement d'événements). */
  triggerFaint(): void {
    if (this.phase === LifePhase.Alive) {
      this.startFaint(FaintCause.Hazard);
    }
  }

  private startFaint(cause: FaintCause): void {
    this.phase = LifePhase.Fainting;
    this.phaseSteps = this.faintTotal;
    this.faintCause = cause;
    this.events |= RunEvent.Fainted;
  }

  private revive(): void {
    this.phase = LifePhase.Alive;
    this.phaseSteps = 0;
    this.faintCause = FaintCause.None;
    this.fear = 0;
    this.decaySteps = 0;
  }
}
