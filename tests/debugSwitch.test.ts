import { describe, expect, it } from 'vitest';
import { debugSwitchUrl } from '../src/core/platform/debugSwitch';

describe('passage au mode debug (D-59)', () => {
  it('du jeu vers le build de debug, et retour', () => {
    expect(debugSwitchUrl('/Maria/', false)).toBe('/Maria/debug/');
    expect(debugSwitchUrl('/Maria/debug/', true)).toBe('/Maria/');
  });

  it('en dev, les outils sont déjà là : on reste sur place', () => {
    expect(debugSwitchUrl('/Maria/', true)).toBe('/Maria/');
  });
});
