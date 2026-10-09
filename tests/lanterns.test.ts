import { describe, expect, it } from 'vitest';
import { EntityType } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

const GRID = ['######', '#P.C.#', '######'];

describe('les lanternes (D-152)', () => {
  it('@lantern : un nom fixe par « C », sinon une erreur explicite', () => {
    const level = parseAsciiLevel('r', ['; @lantern: hall-clock 3 1', ...GRID].join('\n'));
    expect(level.entities).toEqual([
      { type: EntityType.Checkpoint, col: 3, row: 1, name: 'hall-clock' },
    ]);
    expect(() => parseAsciiLevel('r', ['; @lantern: a 2 1', ...GRID].join('\n'))).toThrow(
      /sans « C »/,
    );
    expect(() =>
      parseAsciiLevel('r', ['; @lantern: a 3 1', '; @lantern: b 3 1', ...GRID].join('\n')),
    ).toThrow(/en double/);
    expect(() => parseAsciiLevel('r', ['; @lantern: Hall 3 1', ...GRID].join('\n'))).toThrow(
      /@lantern attend/,
    );
  });

  it('chaque lanterne du jeu a un nom, unique dans toute la zone', () => {
    const names = [...buildZone(HOUSE).rooms.values()].flatMap((level) =>
      level.entities.filter((e) => e.type === EntityType.Checkpoint).map((e) => e.name),
    );
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => typeof n === 'string')).toBe(true);
    expect(new Set(names).size).toBe(names.length);
    expect(() =>
      buildZone({
        id: 'z',
        start: 'r',
        rooms: [{ id: 'r', text: ['; @name: r', ...GRID].join('\n') }],
        links: [],
      }),
    ).toThrow(/lanterne sans nom/);
    const twice = (id: string) => ({ id, text: ['; @lantern: same 3 1', ...GRID].join('\n') });
    expect(() =>
      buildZone({ id: 'z', start: 'a', rooms: [twice('a'), twice('b')], links: [] }),
    ).toThrow(/lanterne « same » en double/);
  });

  it('la plage (D-152) : une lanterne à l’escalier, une à l’avancée, rien entre les deux', () => {
    // L'avancée sert la plage et le début des rochers ; la traversée garde sa difficulté.
    const beach = buildZone(HOUSE).rooms.get('sea-beach');
    expect(
      beach?.entities.filter((e) => e.type === EntityType.Checkpoint).map((e) => [e.name, e.col]),
    ).toEqual([
      ['sea-beach-point', 6],
      ['sea-beach-upper', 176],
    ]);
  });
});
