import { describe, expect, it } from 'vitest';
import { DEFAULT_WORLD } from '../src/config/world';
import { RoomTransition } from '../src/core/world/RoomTransition';

const HZ = 100;
const params = { ...DEFAULT_WORLD, roomFadeOutMs: 50, roomFadeInMs: 100 };

describe('RoomTransition (D-25)', () => {
  it('fondu au noir, changement de salle, puis retour à l’image', () => {
    const t = new RoomTransition(params, HZ);
    expect(t.leaving).toBe(false);
    expect(t.veil).toBe(0);
    t.start({ room: 'hall', exit: 1 }, 42);
    // Une seconde sortie pendant le fondu est ignorée.
    t.start({ room: 'kitchen', exit: 2 }, -5);
    expect(t.target).toEqual({ room: 'hall', exit: 1 });
    expect(t.vx).toBe(42);
    const outSteps = [];
    for (let done = false; !done;) {
      done = t.stepOut();
      outSteps.push(t.veil);
    }
    expect(outSteps).toEqual([0.2, 0.4, 0.6, 0.8, 1]);
    t.arrive();
    expect(t.leaving).toBe(false);
    expect(t.veil).toBe(1);
    for (let i = 0; i < 10; i++) {
      t.stepIn();
    }
    expect(t.veil).toBe(0);
    t.stepIn();
    expect(t.veil).toBe(0);
  });

  it('sans fondu : changement au premier pas, image rendue aussitôt', () => {
    const t = new RoomTransition({ ...params, roomFadeOutMs: 0, roomFadeInMs: 0 }, HZ);
    t.start({ room: 'hall', exit: 1 }, 0);
    expect(t.stepOut()).toBe(true);
    t.arrive();
    expect(t.veil).toBe(0);
  });

  it('une réapparition annule le fondu', () => {
    const t = new RoomTransition(params, HZ);
    t.start({ room: 'hall', exit: 1 }, 0);
    t.stepOut();
    t.cancel();
    expect(t.leaving).toBe(false);
    expect(t.veil).toBe(0);
  });
});
