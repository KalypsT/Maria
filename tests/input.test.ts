import { describe, expect, it } from 'vitest';
import type { InputSource, RawInput } from '../src/core/input/InputAction';
import { InputController } from '../src/core/input/InputController';
import { KeyboardSource } from '../src/core/input/KeyboardSource';

class FakeSource implements InputSource {
  moveX = 0;
  held = 0;
  read(into: RawInput): void {
    into.moveX += this.moveX;
    into.held |= this.held;
  }
}

describe('InputController', () => {
  it('cumule les sources et borne l’axe', () => {
    const a = new FakeSource();
    const b = new FakeSource();
    const input = new InputController();
    input.sources.push(a, b);
    a.moveX = 1;
    b.moveX = 1;
    input.update();
    expect(input.moveX).toBe(1);
    b.moveX = -1;
    input.update();
    expect(input.moveX).toBe(0);
  });

  it('mémorise le front de pression jusqu’à sa consommation', () => {
    const source = new FakeSource();
    const input = new InputController();
    input.sources.push(source);
    source.held = 1; // Jump
    input.update();
    source.held = 0;
    input.update(); // relâché avant qu'un pas ne consomme la pression
    expect(input.isHeld('Jump')).toBe(false);
    expect(input.consumePressed('Jump')).toBe(true);
    expect(input.consumePressed('Jump')).toBe(false);
  });

  it('ne recrée pas de front tant que le bouton reste maintenu', () => {
    const source = new FakeSource();
    const input = new InputController();
    input.sources.push(source);
    source.held = 1;
    input.update();
    expect(input.consumePressed('Jump')).toBe(true);
    input.update();
    expect(input.consumePressed('Jump')).toBe(false);
  });
});

describe('KeyboardSource', () => {
  it('traduit les touches en actions, flèches et ZQSD/WASD', () => {
    const keyboard = new KeyboardSource();
    const input = new InputController();
    input.sources.push(keyboard);
    keyboard.handleKey('KeyA', true);
    keyboard.handleKey('Space', true);
    input.update();
    expect(input.moveX).toBe(-1);
    expect(input.isHeld('Jump')).toBe(true);
    keyboard.handleKey('ArrowRight', true);
    input.update();
    expect(input.moveX).toBe(0);
  });

  it('ignore les touches non liées et relâche tout à la perte de focus', () => {
    const keyboard = new KeyboardSource();
    expect(keyboard.handleKey('KeyX', true)).toBe(false);
    keyboard.handleKey('ArrowLeft', true);
    keyboard.releaseAll();
    const raw = { moveX: 0, moveY: 0, held: 0 };
    keyboard.read(raw);
    expect(raw.moveX).toBe(0);
  });

  it('ne perd pas une pression faite et relâchée entre deux images', () => {
    const keyboard = new KeyboardSource();
    const input = new InputController();
    input.sources.push(keyboard);
    keyboard.handleKey('Escape', true);
    keyboard.handleKey('Escape', false);
    input.update();
    expect(input.consumePressed('Pause')).toBe(true);
    // Vue une seule fois : la lecture suivante ne la voit plus tenue.
    input.update();
    expect(input.isHeld('Pause')).toBe(false);
    expect(input.consumePressed('Pause')).toBe(false);
  });

  it('garde la direction si une seconde touche de la même direction est relâchée', () => {
    const keyboard = new KeyboardSource();
    keyboard.handleKey('ArrowLeft', true);
    keyboard.handleKey('KeyA', true);
    keyboard.handleKey('KeyA', false);
    const raw = { moveX: 0, moveY: 0, held: 0 };
    keyboard.read(raw);
    expect(raw.moveX).toBe(-1);
  });
});
