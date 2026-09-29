import { KEY_BINDINGS } from '../../config/input';
import { BUTTON_BIT, type ButtonAction, type InputSource, type RawInput } from './InputAction';

const DIRECTION = { left: 1, right: 2, up: 4, down: 8 } as const;

/** Construit la table code de touche → (bit de direction, bit de bouton). */
function buildKeyMap(): Map<string, { direction: number; button: number }> {
  const map = new Map<string, { direction: number; button: number }>();
  const entry = (code: string) => {
    let value = map.get(code);
    if (!value) {
      value = { direction: 0, button: 0 };
      map.set(code, value);
    }
    return value;
  };
  for (const dir of ['left', 'right', 'up', 'down'] as const) {
    for (const code of KEY_BINDINGS[dir]) {
      entry(code).direction |= DIRECTION[dir];
    }
  }
  for (const [action, codes] of Object.entries(KEY_BINDINGS.buttons)) {
    for (const code of codes) {
      entry(code).button |= BUTTON_BIT[action as ButtonAction];
    }
  }
  return map;
}

/** Source clavier. `handleKey` est indépendant du DOM (testable) ; `attach` branche la fenêtre. */
function isEditable(target: EventTarget | null): boolean {
  return (
    typeof HTMLElement !== 'undefined' &&
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'TEXTAREA' ||
      (target.tagName === 'INPUT' &&
        (target as HTMLInputElement).type !== 'range' &&
        (target as HTMLInputElement).type !== 'checkbox'))
  );
}

export class KeyboardSource implements InputSource {
  private readonly keyMap = buildKeyMap();
  private readonly down = new Set<string>();
  private directions = 0;
  private buttons = 0;
  /**
   * Boutons pressés depuis la dernière lecture : une touche enfoncée puis relâchée entre deux
   * images compte quand même comme tenue une lecture (aucune pression perdue, spec §43.0.2).
   */
  private latched = 0;

  /** Retourne vrai si la touche est liée à une action. */
  handleKey(code: string, isDown: boolean): boolean {
    if (!this.keyMap.has(code)) {
      return false;
    }
    if (isDown) {
      this.down.add(code);
    } else {
      this.down.delete(code);
    }
    this.recompute();
    if (isDown) {
      this.latched |= this.buttons;
    }
    return true;
  }

  releaseAll(): void {
    this.down.clear();
    this.latched = 0;
    this.recompute();
  }

  read(into: RawInput): void {
    const d = this.directions;
    into.moveX += ((d & DIRECTION.right) !== 0 ? 1 : 0) - ((d & DIRECTION.left) !== 0 ? 1 : 0);
    into.moveY += ((d & DIRECTION.down) !== 0 ? 1 : 0) - ((d & DIRECTION.up) !== 0 ? 1 : 0);
    into.held |= this.buttons | this.latched;
    this.latched = 0;
  }

  attach(target: Window): () => void {
    const onKey = (event: KeyboardEvent) => {
      // Saisie dans un champ (code de sauvegarde, overlay) : les touches ne pilotent pas le jeu.
      if (isEditable(event.target)) {
        return;
      }
      if (this.handleKey(event.code, event.type === 'keydown')) {
        event.preventDefault();
      }
    };
    const onBlur = () => {
      this.releaseAll();
    };
    target.addEventListener('keydown', onKey);
    target.addEventListener('keyup', onKey);
    target.addEventListener('blur', onBlur);
    return () => {
      target.removeEventListener('keydown', onKey);
      target.removeEventListener('keyup', onKey);
      target.removeEventListener('blur', onBlur);
    };
  }

  private recompute(): void {
    this.directions = 0;
    this.buttons = 0;
    for (const code of this.down) {
      const value = this.keyMap.get(code);
      if (value) {
        this.directions |= value.direction;
        this.buttons |= value.button;
      }
    }
  }
}
