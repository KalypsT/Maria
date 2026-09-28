import { BUTTON_BIT, type ButtonAction, type InputSource, type RawInput } from './InputAction';

function clampAxis(value: number): number {
  return value < -1 ? -1 : value > 1 ? 1 : value;
}

/**
 * Agrège les sources d'entrée une fois par image et détecte les fronts de pression.
 *
 * Un front (`pressed`) reste mémorisé jusqu'à ce qu'un pas de simulation le consomme : à 144 Hz,
 * certaines images n'exécutent aucun pas de 1/120 s, et une pression ne doit pas s'y perdre.
 */
export class InputController {
  readonly sources: InputSource[] = [];
  moveX = 0;
  moveY = 0;
  held = 0;
  private pressed = 0;
  private readonly raw: RawInput = { moveX: 0, moveY: 0, held: 0 };

  update(): void {
    const raw = this.raw;
    raw.moveX = 0;
    raw.moveY = 0;
    raw.held = 0;
    for (const source of this.sources) {
      source.read(raw);
    }
    this.pressed |= raw.held & ~this.held;
    this.held = raw.held;
    this.moveX = clampAxis(raw.moveX);
    this.moveY = clampAxis(raw.moveY);
  }

  isHeld(action: ButtonAction): boolean {
    return (this.held & BUTTON_BIT[action]) !== 0;
  }

  /** Vrai si l'action a été pressée depuis la dernière consommation ; efface le front. */
  consumePressed(action: ButtonAction): boolean {
    const bit = BUTTON_BIT[action];
    const wasPressed = (this.pressed & bit) !== 0;
    this.pressed &= ~bit;
    return wasPressed;
  }
}
