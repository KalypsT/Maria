import { describe, expect, it } from 'vitest';
import { ARCADE, ARCADE_CABLES, ARCADE_CORRIDOR, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadePhase, endlessChunk } from '../src/core/arcade/arcade';
import { crossCables } from '../src/core/arcade/cables';
import {
  stitch,
  stitchedCables,
  stitchedPlan,
  stitchedPosts,
  type EndlessChunk,
} from '../src/core/arcade/endless';
import { replayRun } from '../src/core/arcade/runner';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const SEED = 4242;
/** Morceaux traversés d'affilée par le témoin : au-delà du plafond de la difficulté. */
const RUN_CHUNKS = 25;
const HEADER = ['; @world: console'];
const SEAMS = Array.from({ length: ARCADE.verifiedLevels - 1 }, (_, i) => i);

/** Les morceaux d'une partie : chacun part de la hauteur où a fini le précédent. */
function run(game: ArcadeGameId, count: number, seed = SEED): EndlessChunk[] {
  const chunks: EndlessChunk[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = endlessChunk(game, i, seed, chunks.at(-1)?.exitTop ?? null);
    if (!chunk) {
      throw new Error(`${game} : pas de morceau ${String(i)}`);
    }
    chunks.push(chunk);
  }
  return chunks;
}

/** Les morceaux de chaque partie ont des lignes de la même largeur, sans départ ni fanion. */
function wellFormed(chunks: readonly EndlessChunk[], rows: number): void {
  for (const chunk of chunks) {
    expect(chunk.lines).toHaveLength(rows);
    for (const line of chunk.lines) {
      expect(line).toHaveLength(chunk.width);
      expect(line).not.toMatch(/[PG]/);
    }
    expect(chunk.posts[0]?.col).toBe(0);
  }
  // Chaque morceau part de la hauteur où a fini le précédent.
  for (let i = 1; i < chunks.length; i++) {
    expect(chunks[i]?.posts[0]?.top).toBe(chunks[i - 1]?.exitTop);
  }
}

/** Le mode Sans fin, PR 3 : le couloir et les tyroliennes (D-167). */
describe('le mode Sans fin : le couloir', () => {
  const game = arcadeGame(ArcadeGameId.Corridor);
  if (!game) {
    throw new Error('Le couloir absent');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const chunks = run(ArcadeGameId.Corridor, RUN_CHUNKS);

  it('des morceaux bien formés, la jointure : du sol plat, toujours à la même hauteur', () => {
    wellFormed(chunks, ARCADE_CORRIDOR.rows);
    for (const chunk of chunks) {
      expect(chunk.exitTop).toBe(ARCADE_CORRIDOR.floorRow);
      // Pas d'obstacle sur la jointure : le sol, et rien dessus.
      const floor = chunk.lines[ARCADE_CORRIDOR.floorRow] ?? '';
      expect(floor.slice(0, ARCADE_CORRIDOR.startCols)).toBe('b'.repeat(ARCADE_CORRIDOR.startCols));
      expect(chunk.lines[ARCADE_CORRIDOR.floorRow - 2]?.slice(0, ARCADE_CORRIDOR.startCols)).toBe(
        '.'.repeat(ARCADE_CORRIDOR.startCols),
      );
    }
    expect(run(ArcadeGameId.Corridor, 2, SEED + 1)[1]?.lines).not.toEqual(chunks[1]?.lines);
  });

  it(`le témoin traverse ${String(RUN_CHUNKS)} morceaux d’affilée`, () => {
    const level = parseAsciiLevel('endless-corridor', stitch(chunks, HEADER, true));
    const end = replayRun(level, stitchedPlan(chunks), params, phase.hitbox, true);
    expect(end).toBeGreaterThanOrEqual((level.width - 3) * 16);
  });

  it.each(SEAMS)(
    'jointures du morceau %i : faisables par l’analyse, le passage le plus dur reste juste',
    (index) => {
      const level = parseAsciiLevel(
        'endless-corridor-seams',
        stitch(chunks.slice(index, index + 3), HEADER, true),
      );
      const analysis = analyzeLevel(level, params, { slide: true, hitbox: phase.hitbox });
      expect(analysis.path, `morceau ${String(index)} : aucun chemin`).not.toBeNull();
      const critical = analysis.critical;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      expect(critical?.windowMs ?? Number.POSITIVE_INFINITY, detail).toBeGreaterThanOrEqual(
        ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});

describe('le mode Sans fin : les tyroliennes', () => {
  const game = arcadeGame(ArcadeGameId.Cables);
  if (!game) {
    throw new Error('Les tyroliennes absentes');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const chunks = run(ArcadeGameId.Cables, RUN_CHUNKS);

  it('des morceaux bien formés ; chacun part de la hauteur où a fini le précédent', () => {
    wellFormed(chunks, ARCADE_CABLES.rows);
    expect(chunks[0]?.posts[0]?.top).toBe(ARCADE_CABLES.start.top);
    for (const chunk of chunks) {
      expect(chunk.posts[0]?.width).toBe(ARCADE_CABLES.start.width);
      expect(chunk.exitTop).toBeGreaterThanOrEqual(ARCADE_CABLES.postRows.min);
      expect(chunk.exitTop).toBeLessThanOrEqual(ARCADE_CABLES.postRows.max);
      expect(chunk.cables?.length ?? 0).toBeGreaterThan(0);
      for (const cable of chunk.cables ?? []) {
        expect(cable.c1).toBeGreaterThanOrEqual(0);
        expect(cable.c2).toBeLessThan(chunk.width);
      }
    }
    // Les câbles collés : dans la salle, avec leurs colonnes.
    const level = parseAsciiLevel('endless-cables', stitch(chunks.slice(0, 3), HEADER));
    expect(level.cables).toHaveLength(stitchedCables(chunks.slice(0, 3)).length);
  });

  it(`le témoin traverse ${String(RUN_CHUNKS)} morceaux d’affilée`, () => {
    const level = parseAsciiLevel('endless-cables', stitch(chunks, HEADER, true));
    const posts = stitchedPosts(chunks);
    const lastPosts = chunks.at(-1)?.posts.length ?? 1;
    // Jusqu'à la jointure qui ouvre le dernier morceau.
    const target = posts.slice(0, posts.length - lastPosts + 1);
    expect(crossCables(level, target, stitchedCables(chunks), params, phase.hitbox)).toBe(true);
  });

  it.each(SEAMS)(
    'jointures du morceau %i : faisables par l’analyse, le passage le plus dur reste juste',
    (index) => {
      const level = parseAsciiLevel(
        'endless-cables-seams',
        stitch(chunks.slice(index, index + 3), HEADER, true),
      );
      const analysis = analyzeLevel(level, params, {
        glide: true,
        hook: true,
        hitbox: phase.hitbox,
      });
      expect(analysis.path, `morceau ${String(index)} : aucun chemin`).not.toBeNull();
      const critical = analysis.critical;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      expect(critical?.windowMs ?? Number.POSITIVE_INFINITY, detail).toBeGreaterThanOrEqual(
        ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
