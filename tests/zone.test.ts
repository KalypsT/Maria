import { describe, expect, it } from 'vitest';
import { PLAYER_HITBOX } from '../src/config/movement';
import type { Box } from '../src/core/physics/gridCollision';
import { arrivalPosition, buildZone, touchedExit, type ZoneSource } from '../src/core/world/zone';

const A = ['########', '#......#', '#......1', '#P.....1', '########'].join('\n');
const B = ['########', '#......#', '#......#', '1P.....2', '1......2', '########'].join('\n');
const C = ['########', '#......#', '1......#', '1P.....#', '########'].join('\n');

function zone(
  links: [string, string][],
  rooms: Record<string, string> = { a: A, b: B, c: C },
): ZoneSource {
  return {
    id: 'test',
    start: 'a',
    rooms: Object.entries(rooms).map(([id, text]) => ({ id, text })),
    links,
  };
}

describe('zone (D-25)', () => {
  it('relie les sorties dans les deux sens', () => {
    const z = buildZone(
      zone([
        ['a:1', 'b:1'],
        ['b:2', 'c:1'],
      ]),
    );
    expect(z.destination('a', 1)).toEqual({ room: 'b', exit: 1 });
    expect(z.destination('b', 1)).toEqual({ room: 'a', exit: 1 });
    expect(z.destination('c', 1)).toEqual({ room: 'b', exit: 2 });
    expect(z.destination('a', 9)).toBeNull();
    expect(z.rooms.size).toBe(3);
  });

  it('signale les incohérences de la zone', () => {
    expect(() => buildZone(zone([['a:1', 'b:1']]))).toThrow(/b:2 reliée à rien/);
    expect(() =>
      buildZone(
        zone([
          ['a:1', 'b:2'],
          ['b:1', 'c:1'],
        ]),
      ),
    ).toThrow(/même côté/);
    expect(() =>
      buildZone(
        zone([
          ['a:1', 'b:1'],
          ['a:1', 'c:1'],
          ['b:2', 'c:1'],
        ]),
      ),
    ).toThrow(/reliée deux fois/);
    expect(() => buildZone(zone([['a:1', 'x:1']]))).toThrow(/« x » inconnue/);
    expect(() => buildZone(zone([['a:3', 'b:1']]))).toThrow(/a:3 absente/);
    expect(() => buildZone({ ...zone([]), start: 'z' })).toThrow(/départ « z »/);
  });

  it('exige un sol à l’arrivée de chaque sortie', () => {
    const floating = [
      '########',
      '#......#',
      '1......#',
      '1......#',
      '#......#',
      '#P.....#',
      '########',
    ].join('\n');
    expect(() => buildZone(zone([['a:1', 'c:1']], { a: A, c: floating }))).toThrow(/pas de sol/);
  });

  it('fait arriver Céleste juste à l’intérieur, hors de l’ouverture, pieds au bas', () => {
    const z = buildZone(
      zone([
        ['a:1', 'b:1'],
        ['b:2', 'c:1'],
      ]),
    );
    const b = z.rooms.get('b');
    if (!b) {
      throw new Error('salle b');
    }
    const { width, height } = PLAYER_HITBOX;
    const left = arrivalPosition(b, 1, width, height);
    const box: Box = { x: left.x, y: left.y, width, height };
    expect(touchedExit(b, box)).toBe(0);
    expect(left.y + height).toBe(5 * 16);
    const right = arrivalPosition(b, 2, width, height);
    expect(right.x + width).toBeLessThan(7 * 16);
    expect(right.y + height).toBe(5 * 16);
    // En reculant d'un pixel vers l'ouverture, on la touche.
    box.x -= 2;
    expect(touchedExit(b, box)).toBe(1);
  });
});
