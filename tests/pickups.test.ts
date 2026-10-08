import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { ABILITY_HINTS, Ability, isAbility } from '../src/config/abilities';
import { EntityType } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { SaveManager } from '../src/core/save/SaveManager';
import { SaveSession } from '../src/core/save/SaveSession';
import { MemorySaveStorage } from '../src/core/save/SaveStorage';
import { createNewSave } from '../src/core/save/saveData';
import { PickupKind, Pickups, shellId } from '../src/core/world/Pickups';
import { HOUSE } from '../src/levels/house/zone';
import { buildZone } from '../src/core/world/zone';

const ROOM = ['; @ability: climb', '########', '#P...A.#', '########'].join('\n');

describe('objets de capacité (D-26)', () => {
  it('ramassé au contact, une seule fois', () => {
    const pickups = new Pickups();
    pickups.load(parseAsciiLevel('r', ROOM), [], []);
    expect(pickups.items).toHaveLength(1);
    const box = { x: T, y: T + 4, width: 12, height: 22 };
    expect(pickups.step(box)).toBe(-1);
    box.x = 5 * T;
    expect(pickups.step(box)).toBe(0);
    expect(pickups.items[0]?.id).toBe('climb');
    expect(pickups.step(box)).toBe(-1);
  });

  it('absent si la capacité est déjà acquise', () => {
    const pickups = new Pickups();
    pickups.load(parseAsciiLevel('r', ROOM), ['climb'], []);
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

  it('coquilles (D-148) : identifiées par leur nom fixe, sauvegardées une fois', async () => {
    const text = ['; @shell: attic-ridge 3 1', '######', '#P.S.#', '######'].join('\n');
    const level = parseAsciiLevel('attic', text);
    const pickups = new Pickups();
    pickups.load(level, [], []);
    expect(pickups.items).toEqual([
      expect.objectContaining({ kind: PickupKind.Shell, id: 'attic-ridge', taken: false }),
    ]);
    expect(pickups.step({ x: 3 * T, y: T, width: 12, height: 22 })).toBe(0);
    pickups.load(level, [], ['attic-ridge']);
    expect(pickups.items[0]?.taken).toBe(true);
    // Déplacée, elle garde son nom : une partie ne l'oublie pas.
    const moved = parseAsciiLevel('attic', text.replace('3 1', '2 1').replace('#P.S.#', '#PS..#'));
    pickups.load(moved, [], ['attic-ridge']);
    expect(pickups.items[0]).toMatchObject({ col: 2, taken: true });

    let clock = 0;
    const session = new SaveSession(
      new SaveManager(new MemorySaveStorage()),
      createNewSave('bedroom', 0),
      () => ++clock,
    );
    await session.addCollectible('attic-ridge');
    await session.addCollectible('attic-ridge');
    expect(clock).toBe(1);
    expect(session.data.progression.collectibles).toEqual(['attic-ridge']);
  });

  it("une coquille sans nom (parcours d'essai) prend sa salle et sa tuile", () => {
    const level = parseAsciiLevel('course', ['######', '#P.S.#', '######'].join('\n'));
    const shell = level.entities.find((e) => e.type === EntityType.Shell);
    expect(shell && shellId(level.id, shell)).toBe('course:s3-1');
  });

  it('@shell : un nom par « S », sinon une erreur explicite', () => {
    const grid = ['######', '#P.S.#', '######'];
    expect(() => parseAsciiLevel('r', ['; @shell: a 2 1', ...grid].join('\n'))).toThrow(
      /sans « S »/,
    );
    expect(() =>
      parseAsciiLevel('r', ['; @shell: a 3 1', '; @shell: a 4 1', ...grid].join('\n')),
    ).toThrow(/en double/);
    expect(() => parseAsciiLevel('r', ['; @shell: A 3 1', ...grid].join('\n'))).toThrow(
      /@shell attend/,
    );
  });

  it('@shell : son intention (D-148), et @hide : une cachette', () => {
    const grid = ['######', '#P.S.#', '######'];
    const level = parseAsciiLevel(
      'r',
      [
        '; @shell: a 3 1 medium climb wall-jump growth from 1,1 high',
        '; @hide: sheet 2 0 2 2',
        ...grid,
      ].join('\n'),
    );
    expect(level.entities.find((e) => e.name === 'a')?.intent).toEqual({
      difficulty: 'medium',
      needs: ['climb', 'wall-jump'],
      growth: true,
      crawl: false,
      from: { col: 1, row: 1 },
      high: true,
    });
    expect(level.hides).toEqual([{ kind: 'sheet', col: 2, row: 0, width: 2, height: 2 }]);
    expect(
      parseAsciiLevel('r', ['; @shell: a 3 1', ...grid].join('\n')).entities[0],
    ).not.toHaveProperty('intent');
    expect(() => parseAsciiLevel('r', ['; @shell: a 3 1 tricky', ...grid].join('\n'))).toThrow(
      /difficulté « tricky »/,
    );
    expect(() => parseAsciiLevel('r', ['; @shell: a 3 1 easy fly', ...grid].join('\n'))).toThrow(
      /« fly » inconnu/,
    );
    expect(() => parseAsciiLevel('r', ['; @hide: sheet 5 0 2 2', ...grid].join('\n'))).toThrow(
      /@hide sheet hors de la salle/,
    );
  });

  it('chaque coquille du jeu a un nom, unique dans toute la zone', () => {
    const names = [...buildZone(HOUSE).rooms.values()].flatMap((level) =>
      level.entities.filter((e) => e.type === EntityType.Shell).map((e) => e.name),
    );
    expect(names.every((n) => typeof n === 'string')).toBe(true);
    expect(new Set(names).size).toBe(names.length);
    const unnamed = ['; @name: r', '######', '#P.S.#', '######'].join('\n');
    expect(() =>
      buildZone({ id: 'z', start: 'r', rooms: [{ id: 'r', text: unnamed }], links: [] }),
    ).toThrow(/coquille sans nom/);
    const twice = (id: string) => ({
      id,
      text: ['; @shell: same 3 1', '######', '#P.S.#', '######'].join('\n'),
    });
    expect(() =>
      buildZone({ id: 'z', start: 'a', rooms: [twice('a'), twice('b')], links: [] }),
    ).toThrow(/en double/);
  });
});
