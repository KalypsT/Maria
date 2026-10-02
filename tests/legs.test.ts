import { describe, expect, it } from 'vitest';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { LEVELS, ZONES } from '../src/levels';
import { legProblems } from './tideGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Les tronçons déclarés (`; @leg:`, D-96) de toutes les salles et de tous les parcours : difficulté
 * exacte, capacités exigées, à leur marée (Céleste en phase 3, ses cinq capacités).
 */
const levels = [
  ...ZONES.flatMap((zone) => [...zone.rooms.values()]),
  ...LEVELS.map((source) => parseAsciiLevel(source.id, source.text)),
].filter((level) => level.legs.length > 0);

describe('les tronçons des salles (D-96)', () => {
  it('chaque salle à tronçons est vérifiée', () => {
    // Rien à vérifier tant qu'aucune salle n'en déclare (la station balnéaire, D-95).
    expect(levels.every((level) => level.legs.length > 0)).toBe(true);
  });

  for (const level of levels) {
    it(
      `${level.id} : ${String(level.legs.length)} tronçon(s)`,
      { timeout: ANALYSIS_TIMEOUT_MS },
      () => {
        expect(level.legs.flatMap((leg) => legProblems(level, leg))).toEqual([]);
      },
    );
  }
});
