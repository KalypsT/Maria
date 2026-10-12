import { describe, expect, it } from 'vitest';
import { ARCADE, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadeLevel, arcadePhase } from '../src/core/arcade/arcade';
import {
  generateWorldsLevel,
  replayWorlds,
  worldsCount,
  worldsDifficulty,
} from '../src/core/arcade/worlds';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { inLayerZone } from '../src/core/level/layers';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { checksum } from '../src/core/save/saveData';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Empreinte des dix premiers niveaux : toujours les mêmes (D-166). Si le générateur, ses réglages
 * ou les valeurs de mouvement par défaut changent, vérifier les nouveaux niveaux (DEBUG →
 * « Console »), puis mettre à jour l'empreinte.
 */
const FINGERPRINT = '7be8d8e1';

const NUMBERS = Array.from({ length: ARCADE.verifiedLevels }, (_, i) => i + 1);

/** Les deux mondes (D-166, PR 8). */
describe('les deux mondes', () => {
  const game = arcadeGame(ArcadeGameId.Worlds);
  if (!game) {
    throw new Error('Les deux mondes absents');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const generated = (n: number) => generateWorldsLevel(n, params, phase.hitbox, game.abilities);

  it('prête seulement la bascule, à la Céleste qui l’obtient', () => {
    expect(game.abilities).toEqual(['shift']);
    expect(phase.id).toBe(3);
  });

  it('toujours les mêmes niveaux, ceux de la console', () => {
    const texts = NUMBERS.slice(0, 10).map((n) => arcadeLevel(ArcadeGameId.Worlds, n)?.text ?? '');
    expect(NUMBERS.slice(0, 10).map((n) => generated(n).text)).toEqual(texts);
    expect(checksum(texts.join('\n'))).toBe(FINGERPRINT);
  });

  it.each(NUMBERS)('niveau %i : ses couches, et les bascules du témoin jusqu’au fanion', (n) => {
    const level = generated(n);
    const parsed = parseAsciiLevel(`arcade-worlds-${String(n)}`, level.text);
    expect(parsed.layers).not.toBeNull();
    expect(level.posts).toHaveLength(worldsCount(n) + 2);
    // Un poteau d'une seule couche est dans sa zone ; le départ et le fanion, dans les deux.
    for (const p of level.posts) {
      expect(inLayerZone(parsed, p.col, p.top), `poteau ${String(p.col)}`).toBe(p.layer !== 'both');
    }
    expect(level.posts[0]?.layer).toBe('both');
    expect(level.posts[level.posts.length - 1]?.layer).toBe('both');
    expect(replayWorlds(parsed, level.posts, level.shifts, params, phase.hitbox)).toBe(true);
  });

  it('sans la bascule, pas de chemin', () => {
    const level = generated(1);
    const analysis = analyzeLevel(parseAsciiLevel('arcade-worlds-1', level.text), params, {
      hitbox: phase.hitbox,
    });
    expect(analysis.path).toBeNull();
  });

  it('de plus en plus dur : plus de poteaux, des portes, puis des murs à franchir en courant', () => {
    for (const n of NUMBERS.slice(1)) {
      expect(worldsDifficulty(n)).toBeGreaterThan(worldsDifficulty(n - 1));
      expect(worldsCount(n)).toBeGreaterThanOrEqual(worldsCount(n - 1));
    }
    const first = generated(1);
    expect(first.gates).toHaveLength(0);
    expect(first.shifts.length).toBeGreaterThan(0);
    const late = NUMBERS.slice(-5).map(generated);
    // Une porte d'une seule couche dans un écart (jusqu'en bas), un mur sur un poteau commun.
    expect(late.some((l) => l.gates.some((g) => g.bottom === 19))).toBe(true);
    expect(late.some((l) => l.gates.some((g) => g.bottom < 19))).toBe(true);
    const width = (n: number) => {
      const posts = generated(n).posts.filter((p) => p.layer !== 'both');
      return posts.reduce((sum, p) => sum + p.width, 0) / posts.length;
    };
    expect(width(20)).toBeLessThan(width(1));
  });

  it.each(NUMBERS)(
    'niveau %i : faisable par l’analyse, son passage le plus dur reste juste',
    (n) => {
      const level = generated(n);
      const analysis = analyzeLevel(
        parseAsciiLevel(`arcade-worlds-${String(n)}`, level.text),
        params,
        { shift: true, hitbox: phase.hitbox },
      );
      expect(analysis.path, `niveau ${String(n)} : aucun chemin jusqu’au fanion`).not.toBeNull();
      const critical = analysis.critical;
      const window = critical?.windowMs ?? Number.POSITIVE_INFINITY;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      console.info(`deux mondes ${String(n)} : ${detail}`);
      expect(window, detail).toBeGreaterThanOrEqual(
        n === 1 ? ARCADE.firstLevelWindowMs : ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
