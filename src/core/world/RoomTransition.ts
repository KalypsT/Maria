import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import type { WorldParams } from '../../config/world';
import type { ExitRef } from './zone';

/**
 * Passage d'une salle à l'autre (D-25), pur : fondu au noir pendant lequel le jeu est suspendu,
 * changement de salle par la scène, puis retour à l'image pendant que le jeu reprend.
 * Aucune allocation par pas.
 */
export class RoomTransition {
  /** Sortie d'arrivée pendant le fondu au noir ; null sinon. */
  target: ExitRef | null = null;
  /** Vitesse horizontale au moment de sortir, conservée à l'arrivée. */
  vx = 0;
  private outSteps = 0;
  private outTotal = 1;
  private inSteps = 0;
  private inTotal = 1;

  constructor(
    params: Readonly<WorldParams>,
    private readonly stepHz: number = PHYSICS_STEP_HZ,
  ) {
    this.setParams(params);
  }

  setParams(params: Readonly<WorldParams>): void {
    this.outTotal = Math.max(1, msToSteps(params.roomFadeOutMs, this.stepHz));
    this.inTotal = msToSteps(params.roomFadeInMs, this.stepHz);
  }

  /** Fondu au noir en cours (la scène suspend la simulation). */
  get leaving(): boolean {
    return this.target !== null;
  }

  /** Céleste passe une sortie : début du fondu (sans effet s'il a déjà commencé). */
  start(target: ExitRef, vx: number): void {
    if (this.target) {
      return;
    }
    this.target = target;
    this.vx = vx;
    this.outSteps = 0;
    this.inSteps = 0;
  }

  /** Un pas du fondu au noir ; vrai quand l'écran est noir : la scène change alors de salle. */
  stepOut(): boolean {
    this.outSteps++;
    return this.outSteps >= this.outTotal;
  }

  /** La nouvelle salle est prête : retour à l'image. */
  arrive(): void {
    this.target = null;
    this.inSteps = this.inTotal;
  }

  /** Un pas de jeu dans la nouvelle salle. */
  stepIn(): void {
    if (this.inSteps > 0) {
      this.inSteps--;
    }
  }

  /** Abandon (réapparition, téléportation) : plus de voile. */
  cancel(): void {
    this.target = null;
    this.inSteps = 0;
  }

  /** Opacité du voile (0 → 1). */
  get veil(): number {
    if (this.target) {
      return this.outSteps / this.outTotal;
    }
    return this.inTotal > 0 ? this.inSteps / this.inTotal : 0;
  }
}
