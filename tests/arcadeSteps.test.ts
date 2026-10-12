import { describe, expect, it } from 'vitest';
import { Ability } from '../src/config/abilities';
import { ARCADE, ARCADE_CLIMB, ARCADE_JUMPS, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadeLevel, arcadePhase, type ArcadeLevel } from '../src/core/arcade/arcade';
import { stepsCount, stepsDifficulty } from '../src/core/arcade/steps';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { Tile } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { checksum } from '../src/core/save/saveData';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Empreinte des dix premiers niveaux de chaque jeu : toujours les mêmes (D-166). Si le générateur,
 * ses réglages ou les valeurs de mouvement par défaut changent, vérifier les nouveaux niveaux
 * (DEBUG → « Console »), puis mettre à jour l'empreinte.
 */
const FINGERPRINTS = {
  [ArcadeGameId.Jumps]: 'eb81f65b',
  [ArcadeGameId.Climb]: '1ca74347',
} as const;

const NUMBERS = Array.from({ length: ARCADE.verifiedLevels }, (_, i) => i + 1);

const GAMES = [
  { id: ArcadeGameId.Jumps, tuning: ARCADE_JUMPS },
  { id: ArcadeGameId.Climb, tuning: ARCADE_CLIMB },
] as const;

function level(id: ArcadeGameId, n: number): ArcadeLevel {
  const generated = arcadeLevel(id, n);
  if (!generated) {
    throw new Error(`${id} : pas de niveau ${String(n)}`);
  }
  return generated;
}

/** Les sauts et la grimpette (D-166, PR 4). */
describe.each(GAMES)('$id', ({ id, tuning }) => {
  const game = arcadeGame(id);
  if (!game) {
    throw new Error(`${id} absent`);
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);

  it('toujours les mêmes niveaux', () => {
    const texts = NUMBERS.slice(0, 10).map((n) => level(id, n).text);
    expect(NUMBERS.slice(0, 10).map((n) => level(id, n).text)).toEqual(texts);
    expect(checksum(texts.join('\n'))).toBe(FINGERPRINTS[id]);
  });

  it('un départ, un fanion, des poteaux de plus en plus nombreux, la difficulté qui monte', () => {
    for (const n of NUMBERS) {
      const parsed = parseAsciiLevel(`n${String(n)}`, level(id, n).text);
      expect(parsed.goal, `niveau ${String(n)}`).not.toBeNull();
      expect(parsed.meta.world).toBe('console');
      expect(parsed.cables).toEqual([]);
      if (n > 1) {
        expect(stepsDifficulty(tuning, n)).toBeGreaterThan(stepsDifficulty(tuning, n - 1));
        expect(stepsCount(tuning, n)).toBeGreaterThanOrEqual(stepsCount(tuning, n - 1));
      }
    }
  });

  it('la grimpette : pas de longue chute, des briques de jeu au fond de chaque puits', () => {
    if (!tuning.upOnly) {
      return;
    }
    const parsed = parseAsciiLevel('n10', level(id, 10).text);
    // Sous chaque colonne vide entre deux poteaux, un danger à moins de dix tuiles du haut du puits.
    let wells = 0;
    for (let col = 1; col < parsed.width - 1; col++) {
      let row = 1;
      while (row < parsed.height && parsed.tiles[row * parsed.width + col] === Tile.Empty) {
        row++;
      }
      if (parsed.tiles[row * parsed.width + col] === Tile.Hazard && row < parsed.height - 2) {
        wells++;
      }
    }
    expect(wells).toBeGreaterThan(0);
  });

  it.each(NUMBERS)(
    'niveau %i : faisable par l’analyse, son passage le plus dur reste juste',
    (n) => {
      const parsed = parseAsciiLevel(`arcade-${id}-${String(n)}`, level(id, n).text);
      const analysis = analyzeLevel(parsed, params, {
        climb: game.abilities.includes(Ability.Climb),
        hitbox: phase.hitbox,
      });
      expect(analysis.path, `niveau ${String(n)} : aucun chemin jusqu’au fanion`).not.toBeNull();
      const critical = analysis.critical;
      const window = critical?.windowMs ?? Number.POSITIVE_INFINITY;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      console.info(`${id} ${String(n)} : ${detail}`);
      expect(window, detail).toBeGreaterThanOrEqual(
        n === 1 ? ARCADE.firstLevelWindowMs : ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
