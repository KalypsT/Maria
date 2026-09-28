/** Tolérance d'arrondi : une image de 1/60 s doit donner exactement 2 pas de 1/120 s. */
const EPSILON = 1e-9;

/**
 * Accumulateur de pas de temps fixe (décision D-05). `advance` indique combien de pas simuler pour
 * une image ; `alpha` (0–1) sert à interpoler l'affichage entre les deux derniers états.
 */
export class FixedStepClock {
  private accumulator = 0;
  /** Pas abandonnés depuis la création (image trop longue ou appareil trop lent). */
  droppedSteps = 0;

  constructor(
    readonly stepSeconds: number,
    readonly maxStepsPerFrame: number,
  ) {}

  advance(frameSeconds: number): number {
    if (!(frameSeconds > 0)) {
      return 0;
    }
    this.accumulator += frameSeconds;
    let steps = 0;
    while (this.accumulator + EPSILON >= this.stepSeconds) {
      if (steps === this.maxStepsPerFrame) {
        // Retard trop important : on ralentit plutôt que d'accumuler une dette de pas.
        this.droppedSteps += Math.floor((this.accumulator + EPSILON) / this.stepSeconds);
        this.accumulator = 0;
        break;
      }
      this.accumulator -= this.stepSeconds;
      steps++;
    }
    if (this.accumulator < 0) {
      this.accumulator = 0;
    }
    return steps;
  }

  get alpha(): number {
    return this.accumulator / this.stepSeconds;
  }

  reset(): void {
    this.accumulator = 0;
  }
}
