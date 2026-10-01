import type { CombatParams } from '../../config/combat';
import { TILE_SIZE as T } from '../../config/display';
import { msToSteps } from '../../config/movement';
import type { LevelChase } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';

/** Événements du dernier pas de la poursuite (masque de bits). */
export const ChaseEvent = { None: 0, Contact: 1, Trip: 2, End: 4 } as const;

/** Les pieds de Céleste doivent dépasser le haut du front de cette profondeur pour le toucher (px). */
const CONTACT_DEPTH_PX = 3;
/** Une fois la poursuite finie, il redescend à cette vitesse (px/s). */
const SINK_SPEED = 90;

/**
 * Poursuite verticale (boss, D-67, D-70), pure et indépendante de Phaser : un « front » (le haut
 * d'une masse sans visage) monte sous Céleste à vitesse constante (la phase où elle se trouve, une
 * seule en général). S'il prend trop de retard, il accélère peu à peu (rattrapage doux, jamais de
 * saut) : il reste présent sans devenir injuste. Le toucher
 * fait rebondir Céleste et monter la peur ; il recule alors un peu et s'arrête un instant. Passer
 * par un croc-en-jambe le fait reculer et s'arrêter. La poursuite s'arrête quand Céleste atteint la
 * ligne d'arrivée ; il redescend alors. Aucune allocation dans `step`.
 */
export class Chase {
  /** Haut du front (px). */
  frontY = 0;
  /** Fini : Céleste a atteint la ligne d'arrivée. */
  done = false;
  /** Événements du dernier pas (`ChaseEvent`). */
  events = 0;
  /** Phase en cours (indice dans `data.phases`). */
  phase = 0;
  private pauseSteps = 0;
  private needsRestart = true;
  private readonly tripsUsed: Uint8Array;
  private readonly dt: number;

  constructor(
    readonly data: LevelChase,
    private params: Readonly<CombatParams>,
    private readonly stepHz: number,
  ) {
    this.tripsUsed = new Uint8Array(data.trips.length);
    this.dt = 1 / stepHz;
  }

  setParams(params: Readonly<CombatParams>): void {
    this.params = params;
  }

  /** Il repartira au prochain pas, sous les pieds de Céleste (départ, réapparition). */
  restart(): void {
    this.needsRestart = true;
    this.done = false;
    this.events = 0;
  }

  /** Vrai s'il s'est arrêté un instant (départ, contact, croc-en-jambe). */
  get paused(): boolean {
    return this.pauseSteps > 0;
  }

  /**
   * Un pas. Retourne vrai si Céleste vient de le toucher : l'appelant la fait rebondir et monter
   * la peur (CombatWorld).
   */
  step(box: Box, invulnerable: boolean): boolean {
    this.events = 0;
    const p = this.params;
    const feet = box.y + box.height;
    if (this.needsRestart) {
      this.needsRestart = false;
      this.frontY = feet + p.chaseRestartGapTiles * T;
      this.pauseSteps = msToSteps(p.chaseStartDelayMs, this.stepHz);
      this.tripsUsed.fill(0);
    }
    if (this.done) {
      this.frontY += SINK_SPEED * this.dt;
      return false;
    }
    const data = this.data;
    if (feet <= (data.endRow + 1) * T) {
      this.done = true;
      this.events |= ChaseEvent.End;
      return false;
    }
    // Phase : la première dont la limite est encore au-dessus des pieds de Céleste.
    let phase = data.phases.length - 1;
    for (let i = 0; i < data.phases.length; i++) {
      const limit = data.phases[i]?.untilRow ?? 0;
      if (feet > (limit + 1) * T) {
        phase = i;
        break;
      }
    }
    this.phase = phase;
    if (this.pauseSteps > 0) {
      this.pauseSteps--;
    } else {
      let speed = (data.phases[phase]?.speed ?? 0) * p.chaseSpeedScale;
      const behind = (this.frontY - feet) / T - p.chaseCatchUpGapTiles;
      if (behind > 0) {
        speed = Math.max(
          speed,
          Math.min(p.chaseCatchUpMaxSpeed, speed + behind * p.chaseCatchUpRate),
        );
      }
      this.frontY -= speed * T * this.dt;
    }
    for (let i = 0; i < data.trips.length; i++) {
      const trip = data.trips[i];
      if (
        !trip ||
        this.tripsUsed[i] ||
        box.x >= (trip.col + trip.width) * T ||
        box.x + box.width <= trip.col * T ||
        box.y >= (trip.row + trip.height) * T ||
        feet <= trip.row * T
      ) {
        continue;
      }
      this.tripsUsed[i] = 1;
      this.frontY += trip.recoil * T;
      this.pauseSteps = msToSteps(p.chaseTripPauseMs, this.stepHz);
      this.events |= ChaseEvent.Trip;
    }
    if (!invulnerable && feet > this.frontY + CONTACT_DEPTH_PX) {
      this.frontY = Math.max(this.frontY, feet) + p.chaseContactRecoilTiles * T;
      this.pauseSteps = msToSteps(p.chaseContactPauseMs, this.stepHz);
      this.events |= ChaseEvent.Contact;
      return true;
    }
    return false;
  }
}
