import { describe, expect, it } from 'vitest';
import { ARCADE, ARCADE_MONSTER as C, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { arcadeGame, arcadeLevel, arcadePhase } from '../src/core/arcade/arcade';
import {
  chaseLead,
  generateMonsterLevel,
  monsterCount,
  monsterDifficulty,
} from '../src/core/arcade/monster';
import { ramp } from '../src/core/arcade/random';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { checksum } from '../src/core/save/saveData';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Empreinte des dix premiers niveaux : toujours les mêmes (D-166). Si le générateur, ses réglages,
 * les valeurs de mouvement ou de poursuite par défaut changent, vérifier les nouveaux niveaux
 * (DEBUG → « Console »), puis mettre à jour l'empreinte.
 */
const FINGERPRINT = '1b70227d';

const NUMBERS = Array.from({ length: ARCADE.verifiedLevels }, (_, i) => i + 1);

/** Le monstre (D-166, PR 9). */
describe('le monstre', () => {
  const game = arcadeGame(ArcadeGameId.Monster);
  if (!game) {
    throw new Error('Le monstre absent');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const generated = (n: number) => generateMonsterLevel(n, params, phase.hitbox, game.abilities);
  const runTiles = params.maxRunSpeed / 16;

  it('après la vague de la mer, sans capacité, à la Céleste de la phase 3', () => {
    expect(game.flag).toBe(StoryFlag.SeaStrangeDone);
    expect(game.abilities).toEqual([]);
    expect(phase.id).toBe(3);
  });

  it('toujours les mêmes niveaux, ceux de la console', () => {
    const texts = NUMBERS.slice(0, 10).map((n) => arcadeLevel(ArcadeGameId.Monster, n)?.text ?? '');
    expect(NUMBERS.slice(0, 10).map((n) => generated(n).text)).toEqual(texts);
    expect(checksum(texts.join('\n'))).toBe(FINGERPRINT);
  });

  it('une allure de monstre seulement pour une poursuite horizontale', () => {
    const room = (chase: string) =>
      [
        `; @chase: ${chase}`,
        '; @chase-phase: 3 1',
        '; @chase-look: monster',
        '#####',
        '#P.G#',
        '#####',
      ].join('\n');
    expect(parseAsciiLevel('m', room('right 3')).chase?.look).toBe('monster');
    expect(() => parseAsciiLevel('m', room('1'))).toThrow(/horizontale/);
  });

  it.each(NUMBERS)('niveau %i : le témoin échappe au monstre, au plus juste', (n) => {
    const level = generated(n);
    const parsed = parseAsciiLevel(`arcade-monster-${String(n)}`, level.text);
    const chase = parsed.chase;
    expect(chase?.dir).toBe('right');
    expect(chase?.look).toBe('monster');
    expect(chase?.end).toBeLessThan(parsed.goal?.col ?? 0);
    // Il accélère d'un tronçon à l'autre ; au dernier, plus vite que Céleste ne court.
    const speeds = chase?.phases.map((p) => p.speed) ?? [];
    expect(speeds).toHaveLength(C.sections);
    for (let k = 1; k < speeds.length; k++) {
      expect(speeds[k] ?? 0).toBeGreaterThan(speeds[k - 1] ?? 0);
    }
    expect(speeds[speeds.length - 1] ?? 0).toBeGreaterThan(runTiles);
    expect(level.obstacles).toHaveLength(monsterCount(n));
    // Le plan du témoin le tient à distance : juste ce qu'il faut, à une demi-tuile près.
    const lead = chaseLead(parsed, level.plan, params, phase.hitbox);
    const target = ramp(C.lead, monsterDifficulty(n));
    expect(lead).toBeGreaterThanOrEqual(target);
    expect(lead).toBeLessThan(target + 0.5);
  });

  it('de plus en plus dur : moins d’avance, plus d’obstacles, plus serrés', () => {
    for (const n of NUMBERS.slice(1)) {
      expect(monsterDifficulty(n)).toBeGreaterThan(monsterDifficulty(n - 1));
      expect(monsterCount(n)).toBeGreaterThanOrEqual(monsterCount(n - 1));
      expect(generated(n).lead).toBeLessThan(generated(n - 1).lead + 0.5);
    }
    expect(generated(20).lead).toBeLessThan(generated(1).lead - 3);
  });

  it.each(NUMBERS)(
    'niveau %i : faisable par l’analyse, sans capacité, son passage le plus dur reste juste',
    (n) => {
      const level = generated(n);
      const analysis = analyzeLevel(
        parseAsciiLevel(`arcade-monster-${String(n)}`, level.text),
        params,
        { hitbox: phase.hitbox },
      );
      expect(analysis.path, `niveau ${String(n)} : aucun chemin jusqu’au fanion`).not.toBeNull();
      const critical = analysis.critical;
      const window = critical?.windowMs ?? Number.POSITIVE_INFINITY;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      console.info(`monstre ${String(n)} : ${detail}`);
      expect(window, detail).toBeGreaterThanOrEqual(
        n === 1 ? ARCADE.firstLevelWindowMs : ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
