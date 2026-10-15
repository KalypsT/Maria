import { describe, expect, it } from 'vitest';
import { BackButtonSource, type HistoryLike } from '../src/core/input/BackButtonSource';
import { InputController } from '../src/core/input/InputController';

function fakeHistory(): HistoryLike & { entries: unknown[]; back: () => void } {
  const entries: unknown[] = [null];
  return {
    entries,
    get state() {
      return entries[entries.length - 1];
    },
    pushState(data: unknown) {
      entries.push(data);
    },
    back() {
      entries.pop();
    },
  };
}

describe('le retour d’Android ouvre la pause (D-186)', () => {
  it('une entrée est posée devant la page, une seule fois', () => {
    const history = fakeHistory();
    const source = new BackButtonSource(history);
    source.arm();
    source.arm();
    expect(history.entries).toHaveLength(2);
  });

  it('une partie relancée sur l’entrée du jeu ne l’empile pas une seconde fois', () => {
    const history = fakeHistory();
    new BackButtonSource(history).arm();
    new BackButtonSource(history).arm();
    expect(history.entries).toHaveLength(2);
  });

  it('le retour presse Pause une fois, et l’entrée est remise', () => {
    const history = fakeHistory();
    const source = new BackButtonSource(history);
    const controls = new InputController();
    controls.sources.push(source);
    source.arm();
    history.back();
    source.onPopState();
    expect(history.entries).toHaveLength(2);
    controls.update();
    expect(controls.consumePressed('Pause')).toBe(true);
    controls.update();
    expect(controls.consumePressed('Pause')).toBe(false);
    // Un second retour presse Pause à nouveau (le sac se referme).
    history.back();
    source.onPopState();
    controls.update();
    expect(controls.consumePressed('Pause')).toBe(true);
  });
});
