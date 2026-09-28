import { describe, expect, it } from 'vitest';
import { JOYSTICK } from '../src/config/controls';
import { FloatingJoystick } from '../src/core/input/FloatingJoystick';

const R = 50;

function started(mode: 'digital' | 'analog' = 'digital'): FloatingJoystick {
  const stick = new FloatingJoystick(R);
  stick.setMode(mode);
  stick.begin(100, 200);
  return stick;
}

describe('FloatingJoystick numérique', () => {
  it('ne bouge pas tant que le pouce reste dans la zone morte', () => {
    const stick = started();
    stick.move(100 + R * (JOYSTICK.digitalEnter - 0.02), 200);
    expect(stick.outX).toBe(0);
  });

  it('donne ±1 au-delà du seuil, à pleine vitesse quelle que soit la distance', () => {
    const stick = started();
    stick.move(100 + R * 0.5, 200);
    expect(stick.outX).toBe(1);
    stick.move(100 + R * 0.95, 200);
    expect(stick.outX).toBe(1);
    stick.move(100 - R * 0.5, 200);
    expect(stick.outX).toBe(-1);
  });

  it('applique une hystérésis autour du seuil', () => {
    const stick = started();
    stick.move(100 + R * (JOYSTICK.digitalEnter + 0.05), 200);
    expect(stick.outX).toBe(1);
    stick.move(100 + R * (JOYSTICK.digitalEnter - 0.05), 200); // sous « enter », au-dessus de « exit »
    expect(stick.outX).toBe(1);
    stick.move(100 + R * (JOYSTICK.digitalExit - 0.05), 200);
    expect(stick.outX).toBe(0);
  });

  it('n’applique pas l’hystérésis à un changement de sens', () => {
    const stick = started();
    stick.move(100 + R * 0.6, 200);
    expect(stick.outX).toBe(1);
    stick.move(100 - R * (JOYSTICK.digitalExit + 0.05), 200); // franchit « exit » mais pas « enter »
    expect(stick.outX).toBe(0);
  });

  it('détecte le bas et le haut (y vers le bas)', () => {
    const stick = started();
    stick.move(100, 200 + R * 0.6);
    expect(stick.outY).toBe(1);
    expect(stick.outX).toBe(0);
    stick.move(100, 200 - R * 0.6);
    expect(stick.outY).toBe(-1);
  });

  it('gère les diagonales', () => {
    const stick = started();
    stick.move(100 + R * 0.5, 200 + R * 0.5);
    expect(stick.outX).toBe(1);
    expect(stick.outY).toBe(1);
  });
});

describe('FloatingJoystick analogique', () => {
  it('applique la zone morte puis une réponse continue jusqu’à 1', () => {
    const stick = started('analog');
    stick.move(100 + R * (JOYSTICK.analogDeadZone - 0.02), 200);
    expect(stick.outX).toBe(0);
    stick.move(100 + R * 0.575, 200);
    expect(stick.outX).toBeCloseTo(0.5, 2);
    stick.move(100 + R, 200);
    expect(stick.outX).toBeCloseTo(1, 9);
  });

  it('reste borné à 1 en diagonale', () => {
    const stick = started('analog');
    stick.move(100 + R, 200 + R);
    expect(Math.hypot(stick.outX, stick.outY)).toBeLessThanOrEqual(1 + 1e-9);
  });
});

describe('FloatingJoystick base flottante', () => {
  it('ancre la base où le pouce se pose', () => {
    const stick = started();
    expect(stick.active).toBe(true);
    expect(stick.baseX).toBe(100);
    expect(stick.baseY).toBe(200);
  });

  it('suit le pouce quand il dépasse le rayon, sans perdre la direction', () => {
    const stick = started();
    stick.move(100 + 3 * R, 200);
    expect(stick.baseX).toBeCloseTo(100 + 2 * R, 9);
    expect(stick.knobX).toBeCloseTo(100 + 3 * R, 9);
    expect(stick.outX).toBe(1);
    // Revenir vers l'arrière relâche vite : la base est proche du pouce.
    stick.move(100 + 2 * R - R * 0.3, 200);
    expect(stick.outX).toBe(0);
  });

  it('se relâche proprement', () => {
    const stick = started();
    stick.move(300, 200);
    stick.end();
    expect(stick.active).toBe(false);
    expect(stick.outX).toBe(0);
    expect(stick.outY).toBe(0);
    stick.move(500, 500); // sans effet une fois relâché
    expect(stick.outX).toBe(0);
  });

  it('repart de zéro au changement de mode', () => {
    const stick = started();
    stick.move(300, 200);
    stick.setMode('analog');
    expect(stick.outX).toBe(0);
  });
});
