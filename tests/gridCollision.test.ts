import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import {
  HitY,
  isBoxFree,
  isGrounded,
  moveX as moveBoxX,
  moveY as moveBoxY,
  type MovingBox,
} from '../src/core/physics/gridCollision';
import type { LevelData } from '../src/core/level/LevelData';

const box = (x: number, y: number): MovingBox => ({ x, y, width: 12, height: 22, dx: 0, dy: 0 });

function moveX(level: LevelData, b: MovingBox, dx: number): boolean {
  b.dx = dx;
  return moveBoxX(level, b);
}
function moveY(level: LevelData, b: MovingBox, dy: number): number {
  b.dy = dy;
  return moveBoxY(level, b);
}

// 10 × 6 : sol et murs faits de tuiles séparées, plateforme traversable en ligne 2.
const room = parseAsciiLevel(
  'room',
  ['##########', '#........#', '#..===...#', '#........#', '#P.......#', '##########'].join('\n'),
);

describe('moveX', () => {
  it('glisse le long d’un sol de tuiles séparées sans accrochage', () => {
    const b = box(T, 5 * T - 22);
    for (let i = 0; i < 200; i++) {
      moveX(room, b, 1.1);
    }
    expect(b.x).toBe(9 * T - 12);
    for (let i = 0; i < 200; i++) {
      moveX(room, b, -1.3);
    }
    expect(b.x).toBe(T);
  });

  it('s’arrête contre un mur exactement à son bord', () => {
    const b = box(9 * T - 12 - 3, 3 * T);
    expect(moveX(room, b, 10)).toBe(true);
    expect(b.x).toBe(9 * T - 12);
  });

  it('ne traverse pas un mur, même à très grande vitesse', () => {
    const b = box(2 * T, 3 * T);
    expect(moveX(room, b, 10_000)).toBe(true);
    expect(b.x).toBe(9 * T - 12);
    expect(moveX(room, b, -10_000)).toBe(true);
    expect(b.x).toBe(T);
  });

  it('ignore les plateformes traversables', () => {
    const b = box(T, 2 * T);
    expect(moveX(room, b, 3 * T)).toBe(false);
  });
});

describe('moveY', () => {
  it('se pose sur le sol, sans traversée à très grande vitesse', () => {
    const b = box(7 * T, T);
    expect(moveY(room, b, 10_000)).toBe(HitY.Floor);
    expect(b.y + b.height).toBe(5 * T);
    expect(isGrounded(room, b)).toBe(true);
  });

  it('bute contre le plafond', () => {
    const b = box(7 * T, 3 * T);
    expect(moveY(room, b, -10_000)).toBe(HitY.Ceiling);
    expect(b.y).toBe(T);
  });

  it('traverse une plateforme par le dessous puis s’y pose par le dessus', () => {
    // Petite boîte : la salle est trop basse pour passer entièrement au-dessus avec 22 px.
    const b: MovingBox = { x: 4 * T, y: 5 * T - 8, width: 12, height: 8, dx: 0, dy: 0 };
    expect(moveY(room, b, -2 * T - 1)).toBe(HitY.None);
    expect(b.y + b.height).toBeLessThan(3 * T);
    expect(moveY(room, b, -T)).toBe(HitY.None);
    // Bas au-dessus de la plateforme : la descente s'arrête dessus.
    expect(moveY(room, b, 3 * T)).toBe(HitY.Floor);
    expect(b.y + b.height).toBe(2 * T);
    expect(isGrounded(room, b)).toBe(true);
  });

  it('ne se pose pas sur une plateforme déjà chevauchée (montée interrompue)', () => {
    // Bas à l'intérieur de la ligne de la plateforme : on retombe au travers.
    const b = box(4 * T, 2 * T + 4 - 22);
    expect(moveY(room, b, 1)).toBe(HitY.None);
    expect(moveY(room, b, 4 * T)).toBe(HitY.Floor);
    expect(b.y + b.height).toBe(5 * T);
  });

  it('glisse le long d’un mur de tuiles séparées sans accrochage', () => {
    const b = box(T, 3 * T);
    for (let i = 0; i < 60; i++) {
      moveY(room, b, -0.7);
    }
    expect(b.y).toBe(T);
  });
});

describe('isGrounded / isBoxFree', () => {
  it('ne détecte pas de sol en l’air', () => {
    expect(isGrounded(room, box(7 * T, 3 * T))).toBe(false);
  });

  it('teste une zone contre les tuiles pleines seulement', () => {
    expect(isBoxFree(room, box(3 * T, 2 * T))).toBe(true);
    expect(isBoxFree(room, box(0, 2 * T))).toBe(false);
    expect(isBoxFree(room, { x: T, y: T, width: 14, height: 14 })).toBe(true);
  });
});
