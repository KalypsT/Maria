import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { groundBelow } from '../src/core/level/ground';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';

function level(rows: string[]) {
  return parseAsciiLevel('sol', rows.join('\n'));
}

// Une planche en ligne 3 (colonnes 2 et 3), le sol en ligne 6.
const ROOM = level(['#######', '#P....#', '#.....#', '#.--..#', '#.....#', '#.....#', '#######']);

describe('ombre de Céleste au sol (D-71)', () => {
  it('trouve la surface juste sous des pieds posés', () => {
    expect(groundBelow(ROOM, 2 * T, 3 * T, 3 * T, 96)).toBe(3 * T);
    // Interpolation : une fraction de pixel sous le dessus compte encore.
    expect(groundBelow(ROOM, 2 * T, 3 * T, 3 * T + 0.4, 96)).toBe(3 * T);
  });

  it('trouve la surface la plus haute sous toute la largeur', () => {
    // Un pied au-dessus de la planche, l'autre dans le vide : la planche.
    expect(groundBelow(ROOM, 3.5 * T, 4.5 * T, 2 * T, 96)).toBe(3 * T);
    // Entièrement à droite de la planche : le sol.
    expect(groundBelow(ROOM, 4 * T, 5 * T, 2 * T, 96)).toBe(6 * T);
  });

  it('ignore une planche déjà dépassée (traversée par le dessous)', () => {
    expect(groundBelow(ROOM, 2 * T, 3 * T, 3 * T + 6, 96)).toBe(6 * T);
  });

  it('ne trouve rien au-delà de la distance maximale', () => {
    expect(groundBelow(ROOM, 4 * T, 5 * T, 1 * T, 4 * T)).toBeNull();
    expect(groundBelow(ROOM, 4 * T, 5 * T, 1 * T, 5 * T)).toBe(6 * T);
  });
});
