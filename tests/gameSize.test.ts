import { describe, expect, it } from 'vitest';
import { GAME_BASE_WIDTH, GAME_MAX_WIDTH } from '../src/config/display';
import { computeGameWidth } from '../src/core/gameSize';

describe('computeGameWidth', () => {
  it('donne la largeur de base en 16:9', () => {
    expect(computeGameWidth(1920, 1080)).toBe(GAME_BASE_WIDTH);
  });

  it('élargit la vue sur un écran 19,5:9', () => {
    expect(computeGameWidth(844, 390)).toBe(779);
  });

  it('plafonne au-delà de 20:9', () => {
    expect(computeGameWidth(3000, 1000)).toBe(GAME_MAX_WIDTH);
  });

  it('ne descend pas sous 16:9 (portrait, 4:3)', () => {
    expect(computeGameWidth(390, 844)).toBe(GAME_BASE_WIDTH);
    expect(computeGameWidth(1024, 768)).toBe(GAME_BASE_WIDTH);
  });

  it('résiste à un conteneur de taille nulle', () => {
    expect(computeGameWidth(0, 0)).toBe(GAME_BASE_WIDTH);
  });
});
