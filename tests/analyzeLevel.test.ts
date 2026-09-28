import { describe, expect, it } from 'vitest';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { MoveKind, analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { findSurfaces } from '../src/core/analysis/surfaces';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import testRoom from '../src/levels/test-room.txt?raw';

function level(rows: string[]) {
  return parseAsciiLevel('analyse', rows.join('\n'));
}

describe('findSurfaces', () => {
  it('trouve les suites de tuiles portantes avec assez de place au-dessus', () => {
    const map = findSurfaces(
      level([
        '##########',
        '#........#',
        '#........#',
        '#..==....#',
        '#.....#..#',
        '#P.......#',
        '##########',
      ]),
      PLAYER_HITBOX.height,
    );
    const summary = map.surfaces.map((s) => [s.row, s.colStart, s.colEnd, s.hasOneWay]);
    expect(summary).toEqual([
      [3, 3, 4, true], // plateforme traversable
      [4, 6, 6, false], // dessus du bloc
      // Sol coupé sous le bloc : une seule tuile de place au-dessus, Céleste n'y tient pas.
      [6, 1, 5, false],
      [6, 7, 8, false],
    ]);
  });
});

describe('analyzeLevel', () => {
  it('trouve un chemin sur un trou franchissable et en donne la fenêtre', () => {
    const analysis = analyzeLevel(
      level([
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#P..............G..#',
        '#######....#########',
        '#######....#########',
      ]),
      DEFAULT_MOVEMENT,
    );
    expect(analysis.path).not.toBeNull();
    expect(analysis.critical?.kind).toBe(MoveKind.RunningJump);
    expect(analysis.critical?.windowMs).toBeGreaterThan(100);
  });

  it('refuse un trou infranchissable', () => {
    const analysis = analyzeLevel(
      level([
        '########################',
        '#......................#',
        '#......................#',
        '#......................#',
        '#......................#',
        '#P...................G.#',
        '#####.............######',
        '#####.............######',
        '#####.............######',
        '#####.............######',
        '########################',
      ]),
      DEFAULT_MOVEMENT,
    );
    expect(analysis.start).toBeGreaterThanOrEqual(0);
    expect(analysis.goal).toBeGreaterThanOrEqual(0);
    expect(analysis.path).toBeNull();
  });

  it('descend par Bas + Saut à travers une plateforme traversable', () => {
    const analysis = analyzeLevel(
      level([
        '##########',
        '#........#',
        '#.P......#',
        '###====###',
        '#........#',
        '#........#',
        '#......G.#',
        '##########',
      ]),
      DEFAULT_MOVEMENT,
    );
    expect(analysis.path?.map((move) => move.kind)).toEqual([MoveKind.Drop]);
    expect(analysis.critical).toBeNull();
  });

  it('préfère le chemin dont le passage le plus dur est le plus facile', () => {
    // Direct : trou de 6 tuiles (limite). Détour : tomber dans la fosse peu profonde et remonter.
    const analysis = analyzeLevel(
      level([
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#P...........G.....#',
        '######......########',
        '######......########',
        '#########==#########',
        '#########..#########',
        '####################',
      ]),
      DEFAULT_MOVEMENT,
    );
    const path = analysis.path ?? [];
    expect(path.length).toBeGreaterThan(0);
    const direct = analysis.moves.find((m) => m.from === analysis.start && m.to === analysis.goal);
    expect(direct).toBeDefined();
    expect(path.map((move) => move.kind)).toEqual([MoveKind.WalkOff, MoveKind.RunningJump]);
    expect(analysis.critical?.windowMs).toBeGreaterThan((direct?.windowMs ?? 0) * 2);
    // Le chemin est continu du départ à l'arrivée.
    expect(path[0]?.from).toBe(analysis.start);
    expect(path[path.length - 1]?.to).toBe(analysis.goal);
    for (let i = 1; i < path.length; i++) {
      expect(path[i]?.from).toBe(path[i - 1]?.to);
    }
  });

  it('analyse la salle de test et décrit les passages', () => {
    const analysis = analyzeLevel(parseAsciiLevel('test-room', testRoom), DEFAULT_MOVEMENT);
    expect(analysis.moves.length).toBeGreaterThan(20);
    expect(analysis.goal).toBe(-1);
    const move = analysis.moves.find((m) => m.kind === MoveKind.RunningJump);
    expect(move && describeMove(move, analysis.map)).toMatch(/saut en courant .* fenêtre \d+ ms/);
  });
});
