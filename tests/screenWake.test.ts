import { describe, expect, it } from 'vitest';
import { SCREEN_WAKE } from '../src/config/wake';
import { wantsScreenAwake } from '../src/core/platform/screenWake';

describe('l’écran qui reste allumé (D-186)', () => {
  const idle = SCREEN_WAKE.idleMs;

  it('allumé pendant le jeu et les scènes sans toucher (l’intro dure moins de 5 min)', () => {
    expect(wantsScreenAwake(45_000, 0, true, idle)).toBe(true);
  });

  it('la veille reprend après l’inactivité, et jamais en arrière-plan', () => {
    expect(wantsScreenAwake(idle, 0, true, idle)).toBe(false);
    expect(wantsScreenAwake(1000, 0, false, idle)).toBe(false);
  });

  it('un toucher rallume la demande', () => {
    expect(wantsScreenAwake(idle + 10, idle, true, idle)).toBe(true);
  });

  it('la vérification est assez fréquente pour l’inactivité', () => {
    expect(SCREEN_WAKE.checkMs).toBeLessThan(SCREEN_WAKE.idleMs / 4);
  });
});
