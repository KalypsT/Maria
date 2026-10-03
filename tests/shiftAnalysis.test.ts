import { describe, expect, it } from 'vitest';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import {
  analyzeLevel,
  layerSurfaceUnder,
  MoveKind,
  type LevelAnalysis,
} from '../src/core/analysis/analyzeLevel';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { LEVELS } from '../src/levels';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

function course(id: string) {
  const source = LEVELS.find((l) => l.id === id);
  if (!source) {
    throw new Error(`parcours ${id} absent`);
  }
  return parseAsciiLevel(id, source.text);
}

const level = course('bascule');
const lent = { climb: true, wallJump: true };
let withShift: LevelAnalysis | undefined;
const analysis = () =>
  (withShift ??= analyzeLevel(level, DEFAULT_MOVEMENT, { ...lent, shift: true }));

describe('l’analyse de faisabilité sait basculer (D-107)', () => {
  it('les surfaces des deux couches, le présent d’abord', { timeout: ANALYSIS_TIMEOUT_MS }, () => {
    const a = analysis();
    expect(a.presentCount).toBeGreaterThan(0);
    expect(a.map.surfaces.length).toBeGreaterThan(a.presentCount ?? 0);
    // La planche du souvenir (colonnes 37-41, ligne 15) n'est que dans le souvenir.
    expect(layerSurfaceUnder(level, a, 'present', 39, 14)).toBe(-1);
    expect(layerSurfaceUnder(level, a, 'memory', 39, 14)).toBeGreaterThanOrEqual(
      a.presentCount ?? 0,
    );
  });

  it(
    'le parcours 15 : faisable avec la bascule, impossible sans',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      expect(analysis().path).not.toBeNull();
      expect(analyzeLevel(level, DEFAULT_MOVEMENT, lent).path).toBeNull();
    },
  );

  it('au sol : on bascule sur place, et retour', { timeout: ANALYSIS_TIMEOUT_MS }, () => {
    const a = analysis();
    const here = layerSurfaceUnder(level, a, 'present', 3, 16);
    const there = layerSurfaceUnder(level, a, 'memory', 3, 16);
    const go = a.moves.find((m) => m.from === here && m.to === there);
    const back = a.moves.find((m) => m.from === there && m.to === here);
    expect(go?.kind).toBe(MoveKind.Shift);
    expect(back?.kind).toBe(MoveKind.Shift);
  });

  it(
    'en plein saut : du rebord du présent à la planche du souvenir',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const a = analysis();
      const ledge = layerSurfaceUnder(level, a, 'present', 31, 16);
      const plank = layerSurfaceUnder(level, a, 'memory', 39, 14);
      const move = a.moves.find((m) => m.from === ledge && m.to === plank);
      expect(move?.shift).toBe(true);
      expect(move?.windowMs).toBeGreaterThanOrEqual(200);
      // Sans bascule, la planche n'existe pas.
      expect(
        a.moves.some(
          (m) => m.from === ledge && m.to === plank && !m.shift && m.kind !== MoveKind.Shift,
        ),
      ).toBe(false);
    },
  );

  it('sans couches, la bascule ne change rien', { timeout: ANALYSIS_TIMEOUT_MS }, () => {
    const plain = course('saut-mural');
    const a = analyzeLevel(plain, DEFAULT_MOVEMENT, lent);
    const b = analyzeLevel(plain, DEFAULT_MOVEMENT, { ...lent, shift: true });
    expect(b.moves).toEqual(a.moves);
    expect(b.presentCount).toBeUndefined();
  });
});
