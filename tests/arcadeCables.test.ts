import { describe, expect, it } from 'vitest';
import { Ability } from '../src/config/abilities';
import { ARCADE, ARCADE_CABLES, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadeLevel, arcadePhase, type ArcadeLevel } from '../src/core/arcade/arcade';
import { cablesCount, cablesDifficulty } from '../src/core/arcade/cables';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { checksum } from '../src/core/save/saveData';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Empreinte des dix premiers niveaux : ils sont toujours les mêmes (D-166). Si le générateur, ses
 * réglages ou les valeurs de mouvement par défaut changent, les niveaux changent aussi : vérifier
 * les nouveaux (DEBUG → « Console »), puis mettre à jour l'empreinte.
 */
const FINGERPRINT = '10461ef6';

const NUMBERS = Array.from({ length: ARCADE.verifiedLevels }, (_, i) => i + 1);

function level(n: number): ArcadeLevel {
  const generated = arcadeLevel(ArcadeGameId.Cables, n);
  if (!generated) {
    throw new Error(`Tyroliennes : pas de niveau ${String(n)}`);
  }
  return generated;
}

describe('les tyroliennes (D-166)', () => {
  it('toujours les mêmes niveaux', () => {
    const texts = NUMBERS.slice(0, 10).map((n) => level(n).text);
    expect(NUMBERS.slice(0, 10).map((n) => level(n).text)).toEqual(texts);
    expect(checksum(texts.join('\n'))).toBe(FINGERPRINT);
  });

  it('un départ, un fanion, toute la hauteur de l’écran, les briques de jeu en bas', () => {
    for (const n of NUMBERS) {
      const parsed = parseAsciiLevel(`n${String(n)}`, level(n).text);
      expect(parsed.height, `niveau ${String(n)}`).toBe(ARCADE_CABLES.rows);
      expect(parsed.goal, `niveau ${String(n)}`).not.toBeNull();
      expect(parsed.cables.length, `niveau ${String(n)}`).toBeGreaterThanOrEqual(cablesCount(n));
      expect(parsed.meta.abilities).toBe('umbrella hook');
    }
  });

  it('de plus en plus dur : la difficulté monte, les câbles se multiplient', () => {
    for (const n of NUMBERS.slice(1)) {
      expect(cablesDifficulty(n)).toBeGreaterThan(cablesDifficulty(n - 1));
      expect(cablesCount(n)).toBeGreaterThanOrEqual(cablesCount(n - 1));
    }
    expect(cablesDifficulty(1)).toBe(0);
    expect(cablesCount(ARCADE.verifiedLevels)).toBe(ARCADE_CABLES.cables.max);
  });

  const game = arcadeGame(ArcadeGameId.Cables);
  if (!game) {
    throw new Error('Tyroliennes absentes');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);

  it.each(NUMBERS)(
    'niveau %i : faisable par l’analyse, son passage le plus dur reste juste',
    (n) => {
      const parsed = parseAsciiLevel(`arcade-cables-${String(n)}`, level(n).text);
      const analysis = analyzeLevel(parsed, params, {
        glide: game.abilities.includes(Ability.Umbrella),
        hook: game.abilities.includes(Ability.Hook),
        hitbox: phase.hitbox,
      });
      expect(analysis.path, `niveau ${String(n)} : aucun chemin jusqu’au fanion`).not.toBeNull();
      const critical = analysis.critical;
      const window = critical?.windowMs ?? Number.POSITIVE_INFINITY;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      console.info(`tyroliennes ${String(n)} : ${detail}`);
      expect(window, detail).toBeGreaterThanOrEqual(
        n === 1 ? ARCADE.firstLevelWindowMs : ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
