import type { ButtonAction } from '../core/input/InputAction';

/**
 * Touches clavier, par `KeyboardEvent.code` (position physique) : ZQSD sur AZERTY et WASD sur
 * QWERTY tombent sur les mêmes codes.
 */
export const KEY_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  buttons: {
    Jump: ['Space', 'KeyK'],
    Attack: ['KeyJ'],
    Ability: ['KeyL'],
    Interact: ['KeyE'],
    Pause: ['Escape', 'KeyP'],
    Map: ['KeyM', 'Tab'],
  } satisfies Record<ButtonAction, string[]>,
} as const;
