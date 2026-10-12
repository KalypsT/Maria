import { describe, expect, it } from 'vitest';
import { ARCADE, ARCADE_CORRIDOR as C, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadeLevel, arcadePhase } from '../src/core/arcade/arcade';
import {
  corridorCount,
  corridorDifficulty,
  generateCorridorLevel,
  runPlan,
} from '../src/core/arcade/corridor';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { checksum } from '../src/core/save/saveData';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/**
 * Empreinte des dix premiers niveaux : toujours les mêmes (D-166). Si le générateur, ses réglages
 * ou les valeurs de mouvement par défaut changent, vérifier les nouveaux niveaux (DEBUG →
 * « Console »), puis mettre à jour l'empreinte.
 */
const FINGERPRINT = 'c3cb1b73';

const NUMBERS = Array.from({ length: ARCADE.verifiedLevels }, (_, i) => i + 1);

/** Le couloir (D-166, PR 7). */
describe('le couloir', () => {
  const game = arcadeGame(ArcadeGameId.Corridor);
  if (!game) {
    throw new Error('Le couloir absent');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const generated = (n: number) => generateCorridorLevel(n, params, phase.hitbox, game.abilities);

  it('prête seulement la glissade, à la Céleste qui l’obtient', () => {
    expect(game.abilities).toEqual(['slide']);
    expect(phase.id).toBe(3);
  });

  it('toujours les mêmes niveaux, ceux de la console', () => {
    const texts = NUMBERS.slice(0, 10).map(
      (n) => arcadeLevel(ArcadeGameId.Corridor, n)?.text ?? '',
    );
    expect(NUMBERS.slice(0, 10).map((n) => generated(n).text)).toEqual(texts);
    expect(checksum(texts.join('\n'))).toBe(FINGERPRINT);
  });

  it.each(NUMBERS)('niveau %i : ses obstacles, et le plan du témoin jusqu’au fanion', (n) => {
    const level = generated(n);
    const parsed = parseAsciiLevel(`arcade-corridor-${String(n)}`, level.text);
    expect(parsed.spawn.row).toBe(C.floorRow - 1);
    expect(parsed.goal?.row).toBe(C.floorRow - 1);
    expect(level.obstacles).toHaveLength(corridorCount(n));
    const low = C.floorRow - 2;
    for (const o of level.obstacles) {
      if (o.kind === 'pit') {
        expect(tileAt(parsed, o.col, C.floorRow)).toBe(Tile.Hazard);
        continue;
      }
      // Une tuile de passage : couchée seulement.
      expect(tileAt(parsed, o.col, low + 1)).toBe(Tile.Empty);
      expect(tileAt(parsed, o.col, low)).toBe(Tile.Hazard);
      if (o.kind === 'tunnel') {
        expect(tileAt(parsed, o.col + 1, low)).toBe(Tile.Solid);
      }
    }
    const end = runPlan(parsed, level.plan, params, phase.hitbox);
    expect(end, `niveau ${String(n)}`).toBeGreaterThanOrEqual(((parsed.goal?.col ?? 0) - 1) * 16);
  });

  it('sans la glissade, pas de chemin', () => {
    const level = generated(1);
    const analysis = analyzeLevel(parseAsciiLevel('arcade-corridor-1', level.text), params, {
      hitbox: phase.hitbox,
    });
    expect(analysis.path).toBeNull();
  });

  it('de plus en plus dur : plus d’obstacles, plus serrés, des barres plus larges, des sauts longs', () => {
    for (const n of NUMBERS.slice(1)) {
      expect(corridorDifficulty(n)).toBeGreaterThan(corridorDifficulty(n - 1));
      expect(corridorCount(n)).toBeGreaterThanOrEqual(corridorCount(n - 1));
    }
    const gaps = (n: number) => {
      const obstacles = generated(n).obstacles;
      const between = obstacles
        .slice(1)
        .map((o, i) => o.col - ((obstacles[i]?.col ?? 0) + (obstacles[i]?.width ?? 0)));
      return between.reduce((a, b) => a + b, 0) / between.length;
    };
    expect(gaps(20)).toBeLessThan(gaps(1));
    expect(generated(1).plan.every((action) => action.kind !== 'slide-jump')).toBe(true);
    const late = NUMBERS.slice(-5).map(generated);
    expect(late.some((l) => l.plan.some((action) => action.kind === 'slide-jump'))).toBe(true);
    expect(late.some((l) => l.obstacles.some((o) => o.kind === 'tunnel'))).toBe(true);
    expect(late.some((l) => l.obstacles.some((o) => o.kind === 'bar' && o.width > 1))).toBe(true);
  });

  it.each(NUMBERS)(
    'niveau %i : faisable par l’analyse, son passage le plus dur reste juste',
    (n) => {
      const level = generated(n);
      const analysis = analyzeLevel(
        parseAsciiLevel(`arcade-corridor-${String(n)}`, level.text),
        params,
        {
          slide: true,
          hitbox: phase.hitbox,
        },
      );
      expect(analysis.path, `niveau ${String(n)} : aucun chemin jusqu’au fanion`).not.toBeNull();
      const critical = analysis.critical;
      const window = critical?.windowMs ?? Number.POSITIVE_INFINITY;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      console.info(`couloir ${String(n)} : ${detail}`);
      expect(window, detail).toBeGreaterThanOrEqual(
        n === 1 ? ARCADE.firstLevelWindowMs : ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
