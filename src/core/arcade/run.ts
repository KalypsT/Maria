import { ARCADE_ENDLESS, ARCADE_TIMING, ArcadeMode, type ArcadeGameId } from '../../config/arcade';
import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import { metersOf } from './arcade';

/** Où en est une partie de la console. */
export const ArcadePhase = {
  /** « Niveau n » affiché, Céleste immobile. */
  Intro: 'intro',
  Play: 'play',
  /** Le fanion atteint : « Niveau n réussi », puis le niveau suivant. */
  Cleared: 'cleared',
  /** Une chute : un instant, puis « Oups ! ». */
  Fallen: 'fallen',
  /** Finie (une chute, ou quitter) : le score est figé. */
  Over: 'over',
} as const;
export type ArcadePhase = (typeof ArcadePhase)[keyof typeof ArcadePhase];

/**
 * Événements du dernier pas (masque de bits). `Milestone` : le mode Sans fin passe un repère (tous
 * les `ARCADE_ENDLESS.milestoneMeters`, D-167).
 */
export const ArcadeEvent = { None: 0, Started: 1, NextLevel: 2, Over: 4, Milestone: 8 } as const;

/**
 * Une partie de la console (D-166), pure et indépendante de Phaser : le niveau en cours, la
 * distance parcourue (les niveaux finis, plus la plus grande avancée dans celui-ci) et le rythme.
 * Mode Niveaux : une erreur, et la partie s'arrête ; on recommence au niveau 1. Mode Sans fin
 * (D-167) : un seul « niveau » sans fanion, la distance sans limite, un repère tous les 100 m.
 * Quitter compte comme une chute : le score atteint compte. Aucune allocation par pas.
 */
export class ArcadeRun {
  level = 1;
  phase: ArcadePhase = ArcadePhase.Intro;
  /** Événements du dernier `step`. */
  events = 0;
  /** Score final (m), figé à la fin de la partie. */
  final = 0;
  private doneTiles = 0;
  private progressTiles = 0;
  private lengthTiles = 0;
  private steps = 0;
  /** Repères passés (Sans fin), et un nouveau à annoncer au prochain pas. */
  private milestones = 0;
  private milestonePending = false;

  constructor(
    readonly game: ArcadeGameId,
    readonly mode: ArcadeMode,
    private readonly stepHz: number = PHYSICS_STEP_HZ,
  ) {}

  /**
   * Le niveau `level` commence ; `lengthTiles` : du départ au fanion. En mode Sans fin, la course
   * commence : pas de fanion.
   */
  startLevel(lengthTiles: number): void {
    this.lengthTiles =
      this.mode === ArcadeMode.Endless ? Number.POSITIVE_INFINITY : Math.max(0, lengthTiles);
    this.progressTiles = 0;
    this.phase = ArcadePhase.Intro;
    this.steps = msToSteps(ARCADE_TIMING.introMs, this.stepHz);
  }

  /** Céleste est à `tiles` du départ : la plus grande avancée compte, jusqu'au fanion. */
  advance(tiles: number): void {
    if (this.phase === ArcadePhase.Play && tiles > this.progressTiles) {
      this.progressTiles = Math.min(tiles, this.lengthTiles);
      if (this.mode === ArcadeMode.Endless) {
        const passed = Math.floor(this.meters / ARCADE_ENDLESS.milestoneMeters);
        if (passed > this.milestones) {
          this.milestones = passed;
          this.milestonePending = true;
        }
      }
    }
  }

  /** Le fanion atteint (jamais en mode Sans fin). */
  reachGoal(): void {
    if (this.phase !== ArcadePhase.Play || this.mode === ArcadeMode.Endless) {
      return;
    }
    this.progressTiles = this.lengthTiles;
    this.phase = ArcadePhase.Cleared;
    this.steps = msToSteps(ARCADE_TIMING.clearedMs, this.stepHz);
  }

  /** Une erreur (les briques de jeu) : la partie s'arrête. */
  fall(): void {
    if (this.phase !== ArcadePhase.Play) {
      return;
    }
    this.final = this.meters;
    this.phase = ArcadePhase.Fallen;
    this.steps = msToSteps(ARCADE_TIMING.fallMs, this.stepHz);
  }

  /** Quitter (le bouton Menu) : comme une chute, sans attendre. */
  quit(): void {
    if (this.phase === ArcadePhase.Over) {
      return;
    }
    this.final = this.meters;
    this.phase = ArcadePhase.Over;
  }

  /** Un pas : la fin de l'annonce, du fanion ou de la chute. Retourne les événements. */
  step(): number {
    this.events = ArcadeEvent.None;
    if (this.milestonePending) {
      this.milestonePending = false;
      this.events |= ArcadeEvent.Milestone;
    }
    if (this.phase === ArcadePhase.Play || this.phase === ArcadePhase.Over || --this.steps > 0) {
      return this.events;
    }
    if (this.phase === ArcadePhase.Intro) {
      this.phase = ArcadePhase.Play;
      this.events |= ArcadeEvent.Started;
    } else if (this.phase === ArcadePhase.Cleared) {
      // Le niveau suivant : l'appelant le charge, puis appelle `startLevel`.
      this.doneTiles += this.lengthTiles;
      this.progressTiles = 0;
      this.level++;
      this.events |= ArcadeEvent.NextLevel;
    } else {
      this.phase = ArcadePhase.Over;
      this.events |= ArcadeEvent.Over;
    }
    return this.events;
  }

  /** Céleste peut bouger. */
  get playing(): boolean {
    return this.phase === ArcadePhase.Play;
  }

  /** Le compteur (m) : les niveaux finis, plus l'avancée dans celui-ci. */
  get meters(): number {
    return metersOf(this.doneTiles + this.progressTiles);
  }
}
