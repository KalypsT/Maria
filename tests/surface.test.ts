import { describe, expect, it } from 'vitest';
import { DECOR_KINDS } from '../src/config/art';
import { DEFAULT_GROUND, DECOR_SURFACE, ROOM_GROUND, Surface } from '../src/config/surfaces';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { roomGround, surfaceAt, surfaceUnder } from '../src/core/level/surface';
import { ZONES } from '../src/levels';

const T = 16;

/**
 * Salle d'essai : un lit (tissu, `t`) à gauche, une planche traversable, une étagère en bois (`b`),
 * une voiture (métal) sur des tuiles `b`, un vide, puis le sol de la salle.
 */
const ROOM = parseAsciiLevel(
  'surface-test',
  [
    '; @decor: bed 1 3 2 1',
    '; @decor: car 8 3 2 1',
    '##############',
    '#............#',
    '#............#',
    '#tt.==.bb.bb.#',
    '#P...........#',
    '###....#######',
  ].join('\n'),
);

describe('matière du sol (D-125)', () => {
  it('lit le meuble, puis le matériau de la tuile, puis le sol de la salle', () => {
    expect(surfaceAt(ROOM, 1, 3, Surface.Grass)).toBe(Surface.Fabric);
    expect(surfaceAt(ROOM, 4, 3, Surface.Grass)).toBe(Surface.Wood);
    expect(surfaceAt(ROOM, 7, 3, Surface.Grass)).toBe(Surface.Wood);
    expect(surfaceAt(ROOM, 8, 3, Surface.Grass)).toBe(Surface.Metal);
    expect(surfaceAt(ROOM, 1, 5, Surface.Grass)).toBe(Surface.Grass);
  });

  it('lit sous les pieds, au décollage comme posée, et au bord d’un vide', () => {
    const feet = (col: number, row: number, dy = 0) => ({
      x: col * T + 2,
      y: row * T - 22 - dy,
      width: 12,
      height: 22,
    });
    expect(surfaceUnder(ROOM, feet(1, 3), Surface.Stone)).toBe(Surface.Fabric);
    // Décollage : les pieds ont déjà quitté le lit de 3 px.
    expect(surfaceUnder(ROOM, feet(1, 3, 3), Surface.Stone)).toBe(Surface.Fabric);
    expect(surfaceUnder(ROOM, feet(8, 3), Surface.Stone)).toBe(Surface.Metal);
    // Au bord : le milieu au-dessus du vide (colonne 3), un pied sur le lit (colonne 2).
    expect(
      surfaceUnder(ROOM, { x: 2 * T + 10, y: 3 * T - 22, width: 12, height: 22 }, Surface.Stone),
    ).toBe(Surface.Fabric);
    // En l'air, loin de tout : le sol de la salle.
    expect(surfaceUnder(ROOM, feet(5, 2), Surface.Stone)).toBe(Surface.Stone);
  });

  it('chaque salle de zone a son sol, et le sol vise des salles qui existent', () => {
    const rooms = new Set(ZONES.flatMap((zone) => [...zone.rooms.keys()]));
    expect([...rooms].filter((id) => !(id in ROOM_GROUND))).toEqual([]);
    expect(Object.keys(ROOM_GROUND).filter((id) => !rooms.has(id))).toEqual([]);
    expect(roomGround('garden-tree')).toBe(Surface.Grass);
    expect(roomGround('premiers-pas')).toBe(DEFAULT_GROUND);
  });

  it('les matières des meubles nomment des meubles connus', () => {
    expect(Object.keys(DECOR_SURFACE).filter((kind) => !DECOR_KINDS[kind]?.furniture)).toEqual([]);
  });
});
