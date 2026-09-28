import { BUTTON_BIT, type InputSource, type RawInput } from './InputAction';

/** Nombre maximal de doigts suivis simultanément. */
const MAX_POINTERS = 10;
/** Marge de tolérance autour des boutons (px CSS), pour ne pas perdre un pouce qui déborde. */
const HIT_MARGIN_PX = 12;

const Control = { Left: 1, Right: 2, Jump: 4 } as const;

interface TouchButton {
  readonly control: number;
  readonly element: HTMLElement;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Commandes tactiles PROVISOIRES de la Phase 1 : gauche, droite, saut. Remplacées en Phase 3 par le
 * joystick flottant et les boutons définitifs (décision D-08). Multi-touch : chaque doigt est suivi
 * et testé à chaque lecture, un pouce peut glisser de gauche à droite sans relever le doigt.
 */
export class TouchSource implements InputSource {
  readonly root: HTMLElement;
  private readonly buttons: TouchButton[];
  private readonly pointerIds = new Int32Array(MAX_POINTERS).fill(-1);
  private readonly pointerX = new Float32Array(MAX_POINTERS);
  private readonly pointerY = new Float32Array(MAX_POINTERS);
  private rectsDirty = true;
  private shownMask = 0;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'touch-controls';
    this.buttons = [
      this.createButton('touch-left', Control.Left, '◀'),
      this.createButton('touch-right', Control.Right, '▶'),
      this.createButton('touch-jump', Control.Jump, 'Saut'),
    ];
    parent.appendChild(this.root);
  }

  /** Vrai sur un appareil tactile ; ailleurs les boutons restent masqués. */
  static isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  }

  attach(target: Window): () => void {
    const invalidate = () => {
      this.rectsDirty = true;
    };
    const releaseAll = () => {
      this.pointerIds.fill(-1);
    };
    target.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerup', this.onPointerUp);
    target.addEventListener('pointercancel', this.onPointerUp);
    target.addEventListener('resize', invalidate);
    target.addEventListener('orientationchange', invalidate);
    target.addEventListener('blur', releaseAll);
    return () => {
      target.removeEventListener('pointerdown', this.onPointerDown);
      target.removeEventListener('pointermove', this.onPointerMove);
      target.removeEventListener('pointerup', this.onPointerUp);
      target.removeEventListener('pointercancel', this.onPointerUp);
      target.removeEventListener('resize', invalidate);
      target.removeEventListener('orientationchange', invalidate);
      target.removeEventListener('blur', releaseAll);
      this.root.remove();
    };
  }

  read(into: RawInput): void {
    if (this.rectsDirty) {
      this.measure();
    }
    let mask = 0;
    for (let i = 0; i < MAX_POINTERS; i++) {
      if (this.pointerIds[i] !== -1) {
        mask |= this.hitTest(this.pointerX[i] ?? 0, this.pointerY[i] ?? 0);
      }
    }
    if ((mask & Control.Left) !== 0) {
      into.moveX -= 1;
    }
    if ((mask & Control.Right) !== 0) {
      into.moveX += 1;
    }
    if ((mask & Control.Jump) !== 0) {
      into.held |= BUTTON_BIT.Jump;
    }
    if (mask !== this.shownMask) {
      this.shownMask = mask;
      for (const button of this.buttons) {
        button.element.classList.toggle('active', (mask & button.control) !== 0);
      }
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.rectsDirty) {
      this.measure();
    }
    if (this.hitTest(event.clientX, event.clientY) === 0) {
      return; // Laisse passer les touches hors des boutons (overlay de debug, etc.).
    }
    event.preventDefault();
    const slot = this.pointerIds.indexOf(-1);
    if (slot !== -1) {
      this.pointerIds[slot] = event.pointerId;
      this.pointerX[slot] = event.clientX;
      this.pointerY[slot] = event.clientY;
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const slot = this.pointerIds.indexOf(event.pointerId);
    if (slot !== -1) {
      this.pointerX[slot] = event.clientX;
      this.pointerY[slot] = event.clientY;
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const slot = this.pointerIds.indexOf(event.pointerId);
    if (slot !== -1) {
      this.pointerIds[slot] = -1;
    }
  };

  private hitTest(x: number, y: number): number {
    for (const b of this.buttons) {
      if (
        x >= b.left - HIT_MARGIN_PX &&
        x <= b.right + HIT_MARGIN_PX &&
        y >= b.top - HIT_MARGIN_PX &&
        y <= b.bottom + HIT_MARGIN_PX
      ) {
        return b.control;
      }
    }
    return 0;
  }

  private measure(): void {
    for (const b of this.buttons) {
      const rect = b.element.getBoundingClientRect();
      b.left = rect.left;
      b.top = rect.top;
      b.right = rect.right;
      b.bottom = rect.bottom;
    }
    this.rectsDirty = false;
  }

  private createButton(id: string, control: number, label: string): TouchButton {
    const element = document.createElement('div');
    element.id = id;
    element.className = 'touch-button';
    element.textContent = label;
    this.root.appendChild(element);
    return { control, element, left: 0, top: 0, right: 0, bottom: 0 };
  }
}
