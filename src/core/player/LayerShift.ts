import { msToSteps, type MovementParams } from '../../config/movement';
import type { Layer } from '../level/LevelData';

/** Ce qui s'est passé pendant un pas : rien, la bascule, ou un refus (le petit signe). */
export const ShiftEvent = { None: 0, Shifted: 1, Refused: 2 } as const;
export type ShiftEvent = (typeof ShiftEvent)[keyof typeof ShiftEvent];

/** Ce que la bascule demande au jeu : essayer de passer dans l'autre couche (D-107). */
export interface ShiftHost {
  /** Passe Céleste dans la couche `to` si la place le permet ; false : refusée, rien ne change. */
  tryShift(to: Layer): boolean;
}

/**
 * La bascule (D-107), pure : la couche active, la pression gardée tant que la place manque
 * (`shiftBufferMs`), le délai entre deux bascules (`shiftCooldownMs`, une pression pendant le délai
 * attend sa fin). Instantanée, au sol comme en
 * l'air ; rien ne bouge. La couche n'est jamais sauvegardée : on revient au présent en changeant de
 * salle et à la réapparition. Un pas = un pas fixe de la physique.
 */
export class LayerShift {
  layer: Layer = 'present';
  private bufferSteps = 0;
  private cooldownSteps = 0;

  /** Retour au présent, sans pression en attente (changement de salle, réapparition). */
  reset(): void {
    this.layer = 'present';
    this.bufferSteps = 0;
    this.cooldownSteps = 0;
  }

  /** Un pas : `pressed` est le front de pression de Basculer. */
  step(pressed: boolean, params: Readonly<MovementParams>, host: ShiftHost): ShiftEvent {
    if (this.cooldownSteps > 0) {
      this.cooldownSteps--;
    }
    if (pressed) {
      // Au moins un pas pour essayer, même sans tampon.
      this.bufferSteps = Math.max(1, msToSteps(params.shiftBufferMs));
    }
    // Pendant le délai, une pression attend sa fin (le tampon ne compte que les essais refusés).
    if (this.bufferSteps === 0 || this.cooldownSteps > 0) {
      return ShiftEvent.None;
    }
    const to: Layer = this.layer === 'present' ? 'memory' : 'present';
    if (host.tryShift(to)) {
      this.layer = to;
      this.bufferSteps = 0;
      this.cooldownSteps = msToSteps(params.shiftCooldownMs);
      return ShiftEvent.Shifted;
    }
    this.bufferSteps--;
    return this.bufferSteps === 0 ? ShiftEvent.Refused : ShiftEvent.None;
  }
}
