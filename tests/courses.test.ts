import { describe, expect, it } from 'vitest';
import { DIFFICULTY_MIN_WINDOW_MS, Difficulty } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, describeMove, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { COURSE_IDS, LEVELS } from '../src/levels';

const TIMEOUT = 30_000;
const ORDER: readonly Difficulty[] = [Difficulty.Hard, Difficulty.Medium, Difficulty.Easy];

function isDifficulty(value: string | undefined): value is Difficulty {
  return ORDER.includes(value as Difficulty);
}

/** Surfaces atteignables depuis `from` en suivant les passages trouvés. */
function reachableFrom(analysis: LevelAnalysis, from: number): Set<number> {
  const seen = new Set([from]);
  const queue = [from];
  for (let node = queue.shift(); node !== undefined; node = queue.shift()) {
    for (const move of analysis.moves) {
      if (move.from === node && !seen.has(move.to)) {
        seen.add(move.to);
        queue.push(move.to);
      }
    }
  }
  return seen;
}

/**
 * Parcours d'essai (décision D-16) avec les paramètres de mouvement courants : si un réglage de
 * `src/config/movement.ts` rend un parcours infaisable ou change sa difficulté, ces tests échouent
 * en nommant le passage en cause.
 */
describe.each(COURSE_IDS)('parcours %s', (id) => {
  const source = LEVELS.find((level) => level.id === id);
  if (!source) {
    throw new Error(`Parcours ${id} absent de src/levels/index.ts`);
  }
  const level = parseAsciiLevel(id, source.text);
  let cached: LevelAnalysis | undefined;
  // Capacités prêtées par le parcours (`; @abilities:`, D-44).
  const lent = (level.meta.abilities ?? '').split(/\s+/);
  const abilities = { climb: lent.includes('climb'), wallJump: lent.includes('wall-jump') };
  const analysis = () => (cached ??= analyzeLevel(level, DEFAULT_MOVEMENT, abilities));

  it(
    'est faisable du départ à l’arrivée',
    () => {
      const result = analysis();
      expect(result.start, 'départ P sur une surface').toBeGreaterThanOrEqual(0);
      expect(result.goal, 'arrivée G sur une surface').toBeGreaterThanOrEqual(0);
      expect(result.path, 'aucun chemin du départ à l’arrivée').not.toBeNull();
    },
    TIMEOUT,
  );

  it('a la difficulté déclarée (fenêtre du passage le plus dur)', () => {
    const declared = level.meta.difficulty;
    expect(isDifficulty(declared), `@difficulty inconnue : ${String(declared)}`).toBe(true);
    if (!isDifficulty(declared)) {
      return;
    }
    const result = analysis();
    const critical = result.critical;
    const window = critical?.windowMs ?? Number.POSITIVE_INFINITY;
    const detail = critical ? describeMove(critical, result.map) : 'aucun saut';
    console.info(`${id} (${declared}) : passage le plus dur ${detail}`);
    expect(window, `trop dur pour « ${declared} » : ${detail}`).toBeGreaterThanOrEqual(
      DIFFICULTY_MIN_WINDOW_MS[declared],
    );
    const easier = ORDER[ORDER.indexOf(declared) + 1];
    if (easier) {
      expect(window, `trop facile pour « ${declared} » : ${detail}`).toBeLessThan(
        DIFFICULTY_MIN_WINDOW_MS[easier],
      );
    }
  });

  it('ne coince jamais Céleste : l’arrivée reste atteignable après une chute', () => {
    const result = analysis();
    const stuck = [...reachableFrom(result, result.start)].filter(
      (surface) => !reachableFrom(result, surface).has(result.goal),
    );
    const where = stuck.map((surface) => {
      const s = result.map.surfaces[surface];
      return s ? `ligne ${s.row + 1}, col. ${s.colStart + 1}–${s.colEnd + 1}` : String(surface);
    });
    expect(where, 'surfaces sans retour possible').toEqual([]);
  });
});
