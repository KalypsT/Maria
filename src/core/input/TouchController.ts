import { TOUCH_METRICS, type ControlSettings } from '../../config/controls';
import { FloatingJoystick } from './FloatingJoystick';
import { BUTTON_BIT, type RawInput } from './InputAction';
import type { Rect, TouchLayout } from './touchLayout';

/** Nombre maximal de doigts suivis simultanément. */
const MAX_POINTERS = 10;

const Role = { None: 0, Joystick: 1, Button: 2 } as const;

function inRect(rect: Rect, x: number, y: number): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * Attribue chaque doigt à un rôle et produit l'entrée. Indépendant du DOM (testable) :
 * - un doigt posé sur un bouton (avec marge généreuse) reste un doigt de bouton. Il garde ce
 *   bouton tant qu'il reste dans sa zone d'appui ; il ne passe à un autre que s'il en sort (un
 *   pouce qui dérive un peu ne déclenche pas le bouton voisin) ;
 * - un doigt posé dans la zone gauche fait apparaître le joystick (un seul à la fois) et le garde
 *   jusqu'au relâchement, même s'il sort de la zone ;
 * - les autres doigts sont ignorés.
 * Plusieurs doigts simultanés : déplacement + saut, saut + attaque, etc. (spec §12.3).
 */
export class TouchController {
  readonly joystick: FloatingJoystick;
  /** Boutons maintenus lors de la dernière lecture (masque de `BUTTON_BIT`). */
  heldMask = 0;
  private layout: TouchLayout;
  private readonly ids = new Int32Array(MAX_POINTERS).fill(-1);
  private readonly roles = new Uint8Array(MAX_POINTERS);
  /** Bouton tenu par chaque doigt de bouton (index dans `layout.buttons`). */
  private readonly heldButton = new Int8Array(MAX_POINTERS).fill(-1);
  private readonly xs = new Float32Array(MAX_POINTERS);
  private readonly ys = new Float32Array(MAX_POINTERS);

  constructor(layout: TouchLayout, settings: Readonly<ControlSettings>) {
    this.layout = layout;
    this.joystick = new FloatingJoystick(layout.joystickRadius);
    this.joystick.setMode(settings.joystickMode);
  }

  /** Nombre de doigts suivis (boutons et joystick). */
  get activeCount(): number {
    let count = 0;
    for (let i = 0; i < MAX_POINTERS; i++) {
      if (this.ids[i] !== -1) {
        count++;
      }
    }
    return count;
  }

  setLayout(layout: TouchLayout, settings: Readonly<ControlSettings>): void {
    this.layout = layout;
    this.joystick.radius = layout.joystickRadius;
    this.joystick.setMode(settings.joystickMode);
  }

  pointerDown(id: number, x: number, y: number): boolean {
    if (this.ids.includes(id)) {
      return false;
    }
    const slot = this.ids.indexOf(-1);
    if (slot === -1) {
      return false;
    }
    let role: number = Role.None;
    const button = this.buttonAt(x, y);
    if (button !== -1) {
      role = Role.Button;
      this.heldButton[slot] = button;
    } else if (!this.joystick.active && inRect(this.layout.joystickZone, x, y)) {
      role = Role.Joystick;
      this.joystick.begin(x, y);
    }
    if (role === Role.None) {
      return false;
    }
    this.ids[slot] = id;
    this.roles[slot] = role;
    this.xs[slot] = x;
    this.ys[slot] = y;
    return true;
  }

  pointerMove(id: number, x: number, y: number): void {
    const slot = this.ids.indexOf(id);
    if (slot === -1) {
      return;
    }
    this.xs[slot] = x;
    this.ys[slot] = y;
    if (this.roles[slot] === Role.Joystick) {
      this.joystick.move(x, y);
    }
  }

  /** Fin ou annulation d'un doigt (`pointerup` comme `pointercancel`). */
  pointerUp(id: number): void {
    const slot = this.ids.indexOf(id);
    if (slot === -1) {
      return;
    }
    if (this.roles[slot] === Role.Joystick) {
      this.joystick.end();
    }
    this.ids[slot] = -1;
    this.roles[slot] = Role.None;
    this.heldButton[slot] = -1;
  }

  /** Relâche tout (perte de focus, pause, rotation) : aucune commande ne reste « collée ». */
  releaseAll(): void {
    this.ids.fill(-1);
    this.roles.fill(Role.None);
    this.heldButton.fill(-1);
    this.joystick.end();
    this.heldMask = 0;
  }

  /** Ajoute l'état courant à `into`. */
  read(into: RawInput): void {
    let mask = 0;
    for (let i = 0; i < MAX_POINTERS; i++) {
      if (this.ids[i] !== -1 && this.roles[i] === Role.Button) {
        const x = this.xs[i] ?? 0;
        const y = this.ys[i] ?? 0;
        let button = this.heldButton[i] ?? -1;
        const current = this.layout.buttons[button];
        if (
          !current ||
          Math.hypot(x - current.x, y - current.y) - current.r > TOUCH_METRICS.hitMargin
        ) {
          button = this.buttonAt(x, y);
          this.heldButton[i] = button;
        }
        const target = this.layout.buttons[button];
        if (target) {
          mask |= BUTTON_BIT[target.action];
        }
      }
    }
    this.heldMask = mask;
    into.held |= mask;
    into.moveX += this.joystick.outX;
    into.moveY += this.joystick.outY;
  }

  /** Index du bouton visé (le plus proche dans sa marge), ou -1. */
  private buttonAt(x: number, y: number): number {
    let best = -1;
    let bestGap: number = TOUCH_METRICS.hitMargin;
    const buttons = this.layout.buttons;
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      if (b) {
        const gap = Math.hypot(x - b.x, y - b.y) - b.r;
        if (gap <= bestGap) {
          bestGap = gap;
          best = i;
        }
      }
    }
    return best;
  }
}
