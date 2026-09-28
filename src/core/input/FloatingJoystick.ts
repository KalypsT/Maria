import { JOYSTICK } from '../../config/controls';
import type { JoystickMode } from '../../config/controls';

/**
 * Joystick virtuel flottant, indépendant du DOM : la base apparaît là où le pouce se pose. En mode
 * numérique, chaque direction est 0 ou ±1 (avec hystérésis) ; en mode analogique, l'axe est
 * continu après la zone morte. Axes en convention écran : x vers la droite, y vers le bas.
 */
export class FloatingJoystick {
  active = false;
  baseX = 0;
  baseY = 0;
  /** Position du pouce, ramenée au rayon maximal (pour l'affichage). */
  knobX = 0;
  knobY = 0;
  /** Sortie, -1 à 1. */
  outX = 0;
  outY = 0;
  mode: JoystickMode = 'digital';

  constructor(public radius: number) {}

  begin(x: number, y: number): void {
    this.active = true;
    this.baseX = x;
    this.baseY = y;
    this.knobX = x;
    this.knobY = y;
    this.outX = 0;
    this.outY = 0;
  }

  move(x: number, y: number): void {
    if (!this.active) {
      return;
    }
    let dx = x - this.baseX;
    let dy = y - this.baseY;
    const distance = Math.hypot(dx, dy);
    if (distance > this.radius) {
      const scale = this.radius / distance;
      if (JOYSTICK.baseFollowsThumb) {
        // La base est tirée par le pouce : elle reste à `radius` derrière lui.
        this.baseX = x - dx * scale;
        this.baseY = y - dy * scale;
      }
      dx *= scale;
      dy *= scale;
    }
    this.knobX = this.baseX + dx;
    this.knobY = this.baseY + dy;
    const nx = dx / this.radius;
    const ny = dy / this.radius;
    if (this.mode === 'analog') {
      const magnitude = Math.min(1, Math.hypot(nx, ny));
      if (magnitude <= JOYSTICK.analogDeadZone) {
        this.outX = 0;
        this.outY = 0;
      } else {
        const scaled = (magnitude - JOYSTICK.analogDeadZone) / (1 - JOYSTICK.analogDeadZone);
        this.outX = (nx / magnitude) * scaled;
        this.outY = (ny / magnitude) * scaled;
      }
    } else {
      this.outX = digitalAxis(nx, this.outX);
      this.outY = digitalAxis(ny, this.outY);
    }
  }

  end(): void {
    this.active = false;
    this.outX = 0;
    this.outY = 0;
  }

  /** Change de mode en repartant de zéro (évite un état numérique hérité de l'analogique). */
  setMode(mode: JoystickMode): void {
    if (mode !== this.mode) {
      this.mode = mode;
      this.outX = 0;
      this.outY = 0;
    }
  }
}

/** Axe numérique avec hystérésis : active au-delà de `digitalEnter`, relâche sous `digitalExit`. */
function digitalAxis(value: number, previous: number): number {
  const magnitude = Math.abs(value);
  // L'hystérésis ne vaut que dans le même sens : un demi-tour repasse par le seuil d'activation.
  const sameDirection = previous !== 0 && previous < 0 === value < 0;
  const threshold = sameDirection ? JOYSTICK.digitalExit : JOYSTICK.digitalEnter;
  if (magnitude <= threshold) {
    return 0;
  }
  return value < 0 ? -1 : 1;
}
