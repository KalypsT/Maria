import type { CombatParams } from '../../config/combat';
import { TILE_SIZE as T } from '../../config/display';
import { msToSteps } from '../../config/movement';
import type { LevelChase } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';

/** Événements du dernier pas de la poursuite (masque de bits). */
/** `Wake` : la fin de l'attente du départ (ou d'une réapparition) : il se met en marche. */
export const ChaseEvent = { None: 0, Contact: 1, Trip: 2, End: 4, Wake: 8 } as const;

/** Le dos de Céleste (ses pieds, vers le haut) doit passer derrière le front de cette profondeur pour le toucher (px). */
const CONTACT_DEPTH_PX = 3;
/** Une fois la poursuite finie, il recule à cette vitesse (px/s). */
const SINK_SPEED = 90;

/**
 * Poursuite (boss, D-67, D-70, D-87), pure et indépendante de Phaser : un « front » (le bord d'une
 * masse sans visage) avance derrière Céleste à vitesse constante (la phase où elle se trouve, une
 * seule en général) : vers le haut sous ses pieds, ou vers la droite ou la gauche dans son dos.
 * S'il prend trop de retard, il accélère peu à peu (rattrapage doux, jamais de saut) : il reste
 * présent sans devenir injuste. Le toucher fait monter la peur (l'appelant pousse Céleste) ; il
 * recule alors un peu et s'arrête un instant. Passer par un croc-en-jambe le fait reculer et
 * s'arrêter. La poursuite s'arrête quand Céleste atteint la ligne d'arrivée ; il recule alors.
 *
 * La vague (D-103, `; @chase-look: wave`) a un rythme : elle déferle à la vitesse de la salle
 * pendant `surgeMs`, puis se retire pendant `backwashMs` en reculant de `backwashSpeed` tuiles/s.
 *
 * Toutes les distances se comptent sur un axe orienté dans le sens de la course (`sign` × la
 * coordonnée du monde) : le même code sert aux trois sens. Aucune allocation dans `step`.
 */
export class Chase {
  /** Front sur l'axe de la course (px, croissant dans le sens de la course). */
  private axis = 0;
  /** Fini : Céleste a atteint la ligne d'arrivée. */
  done = false;
  /** Événements du dernier pas (`ChaseEvent`). */
  events = 0;
  /** Phase en cours (indice dans `data.phases`). */
  phase = 0;
  /** Nombre de secousses (contact ou croc-en-jambe) depuis la création : l'affichage le fait trembler. */
  jolts = 0;
  /** Poursuite horizontale (vers la droite ou la gauche). */
  readonly horizontal: boolean;
  /** La vague (D-103) : elle déferle, puis se retire un instant ; et ainsi de suite. */
  readonly wave: boolean;
  /** Temps dans le cycle de la vague (ms) : il ne court qu'en mouvement (ni attente ni pause). */
  private cycleMs = 0;
  /** Sens de la course dans la coordonnée du monde : +1 vers la droite, -1 vers le haut ou la gauche. */
  readonly sign: number;
  private pauseSteps = 0;
  private needsRestart = true;
  /** Attente du départ en cours (et non d'un contact ou d'un croc-en-jambe). */
  private waking = false;
  private readonly tripsUsed: Uint8Array;
  private readonly dt: number;
  /** Ligne d'arrivée et limites des phases sur l'axe de la course (px). */
  private readonly endAxis: number;
  private readonly phaseAxis: Float64Array;

  constructor(
    readonly data: LevelChase,
    private params: Readonly<CombatParams>,
    private readonly stepHz: number,
  ) {
    this.tripsUsed = new Uint8Array(data.trips.length);
    this.dt = 1 / stepHz;
    this.horizontal = data.dir !== 'up';
    this.wave = data.look === 'wave';
    this.sign = data.dir === 'right' ? 1 : -1;
    this.endAxis = this.lineAxis(data.end);
    this.phaseAxis = Float64Array.from(data.phases, (p) => this.lineAxis(p.until));
  }

  /**
   * Une ligne (vers le haut) ou une colonne de tuiles, sur l'axe : le dos de Céleste la franchit en
   * dépassant le bas de la ligne, le bord gauche (vers la droite) ou droit (vers la gauche) de la
   * colonne.
   */
  private lineAxis(index: number): number {
    return this.sign * (this.data.dir === 'right' ? index : index + 1) * T;
  }

  setParams(params: Readonly<CombatParams>): void {
    this.params = params;
  }

  /** Front dans la coordonnée du monde (px) : y du haut de la masse, ou x de son bord avant. */
  get front(): number {
    return this.sign * this.axis;
  }

  set front(value: number) {
    this.axis = this.sign * value;
  }

  /** Dos de Céleste dans la coordonnée du monde : ses pieds, son bord gauche ou droit. */
  rear(box: Box): number {
    switch (this.data.dir) {
      case 'up':
        return box.y + box.height;
      case 'right':
        return box.x;
      case 'left':
        return box.x + box.width;
    }
  }

  /** Avance de Céleste sur le front (tuiles) ; négative quand il l'a dépassée. */
  lead(box: Box): number {
    return (this.sign * this.rear(box) - this.axis) / T;
  }

  /** Il repartira au prochain pas, derrière Céleste (départ, réapparition). */
  restart(): void {
    this.needsRestart = true;
    this.done = false;
    this.events = 0;
  }

  /** La vague se retire (le reflux, D-103) ; toujours faux hors de la vague. */
  get backwash(): boolean {
    return this.wave && this.cycleMs >= this.params.surgeMs;
  }

  /**
   * Où en est la vague dans son mouvement (D-103), pour l'affichage : de 0 à 1 pendant qu'elle
   * déferle, puis de 1 à 0 pendant qu'elle se retire. Hors de la vague, 1.
   */
  get swell(): number {
    const p = this.params;
    if (!this.wave) {
      return 1;
    }
    return this.cycleMs < p.surgeMs
      ? this.cycleMs / p.surgeMs
      : 1 - (this.cycleMs - p.surgeMs) / Math.max(1, p.backwashMs);
  }

  /** Le front est placé (il ne repart pas au prochain pas) : sa position a un sens. */
  get placed(): boolean {
    return !this.needsRestart;
  }

  /** Vrai s'il s'est arrêté un instant (départ, contact, croc-en-jambe). */
  get paused(): boolean {
    return this.pauseSteps > 0;
  }

  /**
   * Un pas. Retourne vrai si Céleste vient de le toucher : l'appelant la pousse et fait monter la
   * peur (CombatWorld).
   */
  step(box: Box, invulnerable: boolean): boolean {
    this.events = 0;
    const p = this.params;
    const rear = this.sign * this.rear(box);
    if (this.needsRestart) {
      this.needsRestart = false;
      const side = this.horizontal;
      this.axis = rear - (side ? p.chaseSideRestartGapTiles : p.chaseRestartGapTiles) * T;
      this.pauseSteps = msToSteps(
        side ? p.chaseSideStartDelayMs : p.chaseStartDelayMs,
        this.stepHz,
      );
      this.tripsUsed.fill(0);
      this.cycleMs = 0;
      this.waking = this.pauseSteps > 0;
      if (!this.waking) {
        this.events |= ChaseEvent.Wake;
      }
    }
    if (this.done) {
      this.axis -= SINK_SPEED * this.dt;
      return false;
    }
    const data = this.data;
    if (rear >= this.endAxis) {
      this.done = true;
      this.events |= ChaseEvent.End;
      return false;
    }
    // Phase : la première dont la limite est encore devant Céleste.
    const limits = this.phaseAxis;
    let phase = limits.length - 1;
    for (let i = 0; i < limits.length; i++) {
      if (rear < (limits[i] ?? 0)) {
        phase = i;
        break;
      }
    }
    this.phase = phase;
    if (this.pauseSteps > 0) {
      this.pauseSteps--;
      if (this.pauseSteps === 0 && this.waking) {
        this.waking = false;
        this.events |= ChaseEvent.Wake;
      }
    } else if (this.wave && this.stepCycle()) {
      // Le reflux : elle recule un instant, sans rattrapage.
      this.axis -= p.backwashSpeed * T * this.dt;
    } else {
      let speed = (data.phases[phase]?.speed ?? 0) * p.chaseSpeedScale;
      const behind = (rear - this.axis) / T - p.chaseCatchUpGapTiles;
      if (behind > 0) {
        speed = Math.max(
          speed,
          Math.min(p.chaseCatchUpMaxSpeed, speed + behind * p.chaseCatchUpRate),
        );
      }
      this.axis += speed * T * this.dt;
    }
    const feet = box.y + box.height;
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
      this.axis -= trip.recoil * T;
      this.pauseSteps = msToSteps(p.chaseTripPauseMs, this.stepHz);
      this.waking = false;
      this.events |= ChaseEvent.Trip;
      this.jolts++;
    }
    if (!invulnerable && !this.backwash && this.axis > rear + CONTACT_DEPTH_PX) {
      this.axis = Math.min(this.axis, rear) - p.chaseContactRecoilTiles * T;
      this.pauseSteps = msToSteps(p.chaseContactPauseMs, this.stepHz);
      this.waking = false;
      this.events |= ChaseEvent.Contact;
      this.jolts++;
      return true;
    }
    return false;
  }

  /** Avance le cycle de la vague d'un pas ; vrai pendant le reflux. */
  private stepCycle(): boolean {
    const p = this.params;
    this.cycleMs += this.dt * 1000;
    if (this.cycleMs >= p.surgeMs + p.backwashMs) {
      this.cycleMs -= p.surgeMs + p.backwashMs;
    }
    return this.cycleMs >= p.surgeMs;
  }
}
