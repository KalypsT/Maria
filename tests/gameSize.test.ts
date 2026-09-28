import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DISPLAY_SETTINGS,
  GAME_BASE_WIDTH,
  GAME_MAX_WIDTH,
  MAX_RENDER_SCALE,
} from '../src/config/display';
import { computeGameWidth, computeRenderScale, renderSize } from '../src/core/gameSize';
import {
  parseDisplaySettings,
  sanitizeDisplaySettings,
  serializeDisplaySettings,
} from '../src/core/settings/displaySettings';

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

describe('computeRenderScale', () => {
  it('vaut 1 à la résolution logique', () => {
    expect(computeRenderScale('logical', 390, 3)).toBe(1);
  });

  it('suit la hauteur physique de l’écran, plafonnée', () => {
    expect(computeRenderScale('screen', 360, 2)).toBe(2);
    expect(computeRenderScale('screen', 390, 3)).toBe(MAX_RENDER_SCALE);
    expect(computeRenderScale('screen', 300, 1)).toBe(1);
  });

  it('résiste à des mesures invalides', () => {
    expect(computeRenderScale('screen', 0, 3)).toBe(1);
    expect(computeRenderScale('screen', 390, Number.NaN)).toBe(1);
  });

  it('donne la taille du canvas', () => {
    expect(renderSize(779, 3)).toEqual({ width: 2337, height: 1080 });
    expect(renderSize(640, 1)).toEqual({ width: 640, height: 360 });
  });
});

describe('displaySettings', () => {
  it('relit un réglage enregistré et rejette le reste', () => {
    expect(parseDisplaySettings(serializeDisplaySettings({ renderMode: 'screen' }))).toEqual({
      renderMode: 'screen',
    });
    expect(parseDisplaySettings(null)).toEqual(DEFAULT_DISPLAY_SETTINGS);
    expect(parseDisplaySettings('{')).toEqual(DEFAULT_DISPLAY_SETTINGS);
    expect(parseDisplaySettings('{"version":99,"renderMode":"screen"}')).toEqual(
      DEFAULT_DISPLAY_SETTINGS,
    );
    expect(sanitizeDisplaySettings({ renderMode: '4k' })).toEqual(DEFAULT_DISPLAY_SETTINGS);
  });
});
