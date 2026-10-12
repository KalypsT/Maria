import { describe, expect, it } from 'vitest';
import { ARCADE, ARCADE_WIND, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadeLevel, arcadePhase } from '../src/core/arcade/arcade';
import { fly, generateWindLevel, windDifficulty, windGates } from '../src/core/arcade/wind';
import { Tile } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { checksum } from '../src/core/save/saveData';

/**
 * Empreinte des dix premiers niveaux : toujours les mêmes (D-166). Si le générateur, ses réglages
 * ou les valeurs de mouvement par défaut changent, vérifier les nouveaux niveaux (DEBUG →
 * « Console »), puis mettre à jour l'empreinte.
 */
const FINGERPRINT = '1597ebd5';

const NUMBERS = Array.from({ length: ARCADE.verifiedLevels }, (_, i) => i + 1);

/**
 * Le grand vent (D-166, PR 6). L'analyse de faisabilité ne sait pas changer d'allure en plein vol
 * (freiner, fermer le parapluie puis le rouvrir) : chaque niveau est vérifié en rejouant le plan du
 * témoin, avec la vraie physique.
 */
describe('le grand vent', () => {
  const game = arcadeGame(ArcadeGameId.Wind);
  if (!game) {
    throw new Error('Le grand vent absent');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const generated = (n: number) => generateWindLevel(n, params, phase.hitbox, game.abilities);

  it('prête seulement le parapluie', () => {
    expect(game.abilities).toEqual(['umbrella']);
  });

  it('toujours les mêmes niveaux, ceux de la console', () => {
    const texts = NUMBERS.slice(0, 10).map((n) => arcadeLevel(ArcadeGameId.Wind, n)?.text ?? '');
    expect(NUMBERS.slice(0, 10).map((n) => generated(n).text)).toEqual(texts);
    expect(checksum(texts.join('\n'))).toBe(FINGERPRINT);
  });

  it.each(NUMBERS)('niveau %i : le plan du témoin le traverse jusqu’au fanion', (n) => {
    const level = generated(n);
    const parsed = parseAsciiLevel(`arcade-wind-${String(n)}`, level.text);
    const flight = fly(parsed, level.plan, params, phase.hitbox);
    expect(flight.landed, `niveau ${String(n)}`).toBe(true);
    expect(flight.feet).toBe(((parsed.goal?.row ?? 0) + 1) * 16);
    // Toutes les portes sont là, des briques de jeu du plafond au fond, sauf leur ouverture.
    let gateCols = 0;
    for (let col = 1; col < parsed.width - 1; col++) {
      if (parsed.tiles[parsed.width + col] === Tile.Hazard) {
        gateCols++;
      }
    }
    expect(gateCols).toBeGreaterThanOrEqual(level.gates);
  });

  it('de plus en plus dur : plus de portes, des allures qui changent, des ouvertures plus étroites', () => {
    for (const n of NUMBERS.slice(1)) {
      expect(windDifficulty(n)).toBeGreaterThan(windDifficulty(n - 1));
      expect(windGates(n)).toBeGreaterThanOrEqual(windGates(n - 1));
    }
    expect(generated(1).plan.every((leg) => leg.action.kind === 'fast')).toBe(true);
    const late = NUMBERS.slice(-5).flatMap((n) => generated(n).plan);
    expect(late.some((leg) => leg.action.kind === 'drop')).toBe(true);
    expect(late.some((leg) => leg.action.kind === 'slow')).toBe(true);
    expect(ARCADE_WIND.margin.to).toBeLessThan(ARCADE_WIND.margin.from);
  });
});
