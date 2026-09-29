import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { ABILITY_HINTS, Ability, isAbility } from '../src/config/abilities';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { SaveManager } from '../src/core/save/SaveManager';
import { SaveSession } from '../src/core/save/SaveSession';
import { MemorySaveStorage } from '../src/core/save/SaveStorage';
import { createNewSave } from '../src/core/save/saveData';
import { Pickups } from '../src/core/world/Pickups';

const ROOM = ['; @ability: climb', '########', '#P...A.#', '########'].join('\n');

describe('objets de capacité (D-26)', () => {
  it('ramassé au contact, une seule fois', () => {
    const pickups = new Pickups();
    pickups.load(parseAsciiLevel('r', ROOM), []);
    expect(pickups.items).toHaveLength(1);
    const box = { x: T, y: T + 4, width: 12, height: 22 };
    expect(pickups.step(box)).toBe(-1);
    box.x = 5 * T;
    expect(pickups.step(box)).toBe(0);
    expect(pickups.items[0]?.ability).toBe('climb');
    expect(pickups.step(box)).toBe(-1);
  });

  it('absent si la capacité est déjà acquise', () => {
    const pickups = new Pickups();
    pickups.load(parseAsciiLevel('r', ROOM), ['climb']);
    expect(pickups.items[0]?.taken).toBe(true);
    expect(pickups.step({ x: 5 * T, y: T, width: 12, height: 22 })).toBe(-1);
  });

  it('la capacité est sauvegardée une seule fois', async () => {
    const storage = new MemorySaveStorage();
    let clock = 0;
    const session = new SaveSession(
      new SaveManager(storage),
      createNewSave('bedroom', 0),
      () => ++clock,
    );
    await session.unlockAbility('climb');
    await session.unlockAbility('climb');
    expect(clock).toBe(1);
    expect((await new SaveManager(storage).load()).data?.progression.abilities).toEqual(['climb']);
  });

  it('chaque capacité a un indice', () => {
    for (const ability of Object.values(Ability)) {
      expect(ABILITY_HINTS[ability].length).toBeGreaterThan(0);
    }
    expect(isAbility('climb')).toBe(true);
    expect(isAbility('fly')).toBe(false);
  });
});
