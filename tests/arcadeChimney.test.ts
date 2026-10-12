import { describe, expect, it } from 'vitest';
import { ARCADE, ARCADE_CHIMNEY, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadeLevel, arcadePhase, type ArcadeLevel } from '../src/core/arcade/arcade';
import { chimneyDifficulty, chimneySections } from '../src/core/arcade/chimney';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { Tile } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { checksum } from '../src/core/save/saveData';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Empreinte des dix premiers niveaux : toujours les mêmes (D-166). Si le générateur, ses réglages
 * ou les valeurs de mouvement par défaut changent, vérifier les nouveaux niveaux (DEBUG →
 * « Console »), puis mettre à jour l'empreinte.
 */
const FINGERPRINT = 'c0e1a5b1';

const NUMBERS = Array.from({ length: ARCADE_CHIMNEY.verifiedLevels }, (_, i) => i + 1);

function level(n: number): ArcadeLevel {
  const generated = arcadeLevel(ArcadeGameId.Chimney, n);
  if (!generated) {
    throw new Error(`La cheminée : pas de niveau ${String(n)}`);
  }
  return generated;
}

/** La cheminée (D-166, PR 5). */
describe('la cheminée', () => {
  const game = arcadeGame(ArcadeGameId.Chimney);
  if (!game) {
    throw new Error('La cheminée absente');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);

  it('compte la hauteur ; prête seulement le saut mural', () => {
    expect(game.axis).toBe('up');
    expect(game.abilities).toEqual(['wall-jump']);
  });

  it('toujours les mêmes niveaux', () => {
    const texts = NUMBERS.slice(0, 10).map((n) => level(n).text);
    expect(NUMBERS.slice(0, 10).map((n) => level(n).text)).toEqual(texts);
    expect(checksum(texts.join('\n'))).toBe(FINGERPRINT);
  });

  it('un départ en bas, le fanion en haut, le fond en briques de jeu, plus haute à chaque niveau', () => {
    let previous = 0;
    for (const n of NUMBERS) {
      const l = level(n);
      const parsed = parseAsciiLevel(l.id, l.text);
      const { spawn, goal } = parsed;
      expect(goal, `niveau ${String(n)}`).not.toBeNull();
      expect((goal?.row ?? 0) < spawn.row - 10).toBe(true);
      // Sous le rebord de départ, à côté : le fond de la cheminée pique.
      const floor = spawn.row + 2;
      expect(parsed.tiles[floor * parsed.width + spawn.col + 1]).toBe(Tile.Hazard);
      expect(l.lengthTiles).toBeGreaterThanOrEqual(previous);
      previous = l.lengthTiles;
      if (n > 1) {
        expect(chimneyDifficulty(n)).toBeGreaterThan(chimneyDifficulty(n - 1));
        expect(chimneySections(n)).toBeGreaterThanOrEqual(chimneySections(n - 1));
      }
    }
  });

  it.each(NUMBERS)(
    'niveau %i : faisable par l’analyse, son passage le plus dur reste juste',
    (n) => {
      const l = level(n);
      const analysis = analyzeLevel(parseAsciiLevel(l.id, l.text), params, {
        wallJump: true,
        hitbox: phase.hitbox,
      });
      expect(analysis.path, `niveau ${String(n)} : aucun chemin jusqu’au fanion`).not.toBeNull();
      const critical = analysis.critical;
      const window = critical?.windowMs ?? Number.POSITIVE_INFINITY;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      console.info(`cheminée ${String(n)} : ${detail}`);
      expect(window, detail).toBeGreaterThanOrEqual(
        n === 1 ? ARCADE.firstLevelWindowMs : ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
