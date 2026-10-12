import { describe, expect, it } from 'vitest';
import {
  ARCADE,
  ARCADE_CABLES,
  ARCADE_CORRIDOR,
  ARCADE_MONSTER,
  ARCADE_WORLDS,
  ArcadeGameId,
} from '../src/config/arcade';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT, PHYSICS_STEP_HZ } from '../src/config/movement';
import { arcadeGame, arcadePhase, endlessChunk } from '../src/core/arcade/arcade';
import { crossCables } from '../src/core/arcade/cables';
import {
  stitch,
  stitchedCables,
  stitchedPlan,
  stitchedPosts,
  stitchedShifts,
  type EndlessChunk,
} from '../src/core/arcade/endless';
import { chaseLead, monsterEndlessParams } from '../src/core/arcade/monster';
import { replayWorlds, type WorldsPost } from '../src/core/arcade/worlds';
import { Chase } from '../src/core/boss/Chase';
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
    const chunk = endlessChunk(game, i, seed, chunks.at(-1)?.exit ?? null);
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
    expect(chunk.lines).toHaveLength(rows - 2);
    for (const line of chunk.lines) {
      expect(line).toHaveLength(chunk.width);
      expect(line).not.toMatch(/[PG]/);
    }
    expect(chunk.posts[0]?.col).toBe(0);
  }
  // Chaque morceau part de la hauteur où a fini le précédent.
  for (let i = 1; i < chunks.length; i++) {
    expect(chunks[i]?.posts[0]?.top).toBe(chunks[i - 1]?.exit.top);
  }
}

/** Les jointures d'une partie, faisables par l'analyse avec la marge minimale. */
function seamsFeasible(
  chunks: readonly EndlessChunk[],
  index: number,
  params: Readonly<Parameters<typeof analyzeLevel>[1]>,
  abilities: Parameters<typeof analyzeLevel>[2],
): void {
  const level = parseAsciiLevel(
    'endless-seams',
    stitch(chunks.slice(index, index + 3), HEADER, true),
  );
  const analysis = analyzeLevel(level, params, abilities);
  expect(analysis.path, `morceau ${String(index)} : aucun chemin`).not.toBeNull();
  const critical = analysis.critical;
  const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
  expect(critical?.windowMs ?? Number.POSITIVE_INFINITY, detail).toBeGreaterThanOrEqual(
    ARCADE.minWindowMs,
  );
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
      expect(chunk.exit).toEqual({ top: ARCADE_CORRIDOR.floorRow, layer: 'present' });
      // Pas d'obstacle sur la jointure : le sol, et rien dessus.
      const floor = chunk.lines[ARCADE_CORRIDOR.floorRow - 1] ?? '';
      expect(floor.slice(0, ARCADE_CORRIDOR.startCols)).toBe('b'.repeat(ARCADE_CORRIDOR.startCols));
      expect(chunk.lines[ARCADE_CORRIDOR.floorRow - 3]?.slice(0, ARCADE_CORRIDOR.startCols)).toBe(
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
      expect(chunk.exit.top).toBeGreaterThanOrEqual(ARCADE_CABLES.postRows.min);
      expect(chunk.exit.top).toBeLessThanOrEqual(ARCADE_CABLES.postRows.max);
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

/** Le mode Sans fin, PR 4 : les deux mondes et le monstre (D-167). */
describe('le mode Sans fin : les deux mondes', () => {
  const game = arcadeGame(ArcadeGameId.Worlds);
  if (!game) {
    throw new Error('Les deux mondes absents');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const chunks = run(ArcadeGameId.Worlds, RUN_CHUNKS);

  it('des morceaux bien formés : la jointure commune aux deux couches, les zones dans le morceau', () => {
    wellFormed(chunks, ARCADE_WORLDS.rows);
    for (const chunk of chunks) {
      expect((chunk.posts[0] as WorldsPost | undefined)?.layer).toBe('both');
      for (const zone of chunk.zones ?? []) {
        expect(zone.col).toBeGreaterThan(0);
        expect(zone.col + zone.width).toBeLessThanOrEqual(chunk.width);
      }
    }
    // Le témoin arrive parfois dans le souvenir : le morceau suivant part de là.
    expect(chunks.some((c) => c.exit.layer === 'memory')).toBe(true);
    const level = parseAsciiLevel('endless-worlds', stitch(chunks.slice(0, 3), HEADER));
    expect(level.layers?.present.length ?? 0).toBeGreaterThan(0);
  });

  it(`le témoin traverse ${String(RUN_CHUNKS)} morceaux d’affilée, en basculant`, () => {
    const level = parseAsciiLevel('endless-worlds', stitch(chunks, HEADER, true));
    const posts = stitchedPosts(chunks) as WorldsPost[];
    const lastPosts = chunks.at(-1)?.posts.length ?? 1;
    const target = posts.slice(0, posts.length - lastPosts + 1);
    const shifts = stitchedShifts(chunks.slice(0, -1));
    expect(replayWorlds(level, target, shifts, params, phase.hitbox)).toBe(true);
  });

  it.each(SEAMS)(
    'jointures du morceau %i : faisables par l’analyse, le passage le plus dur reste juste',
    (index) => {
      seamsFeasible(chunks, index, params, { shift: true, hitbox: phase.hitbox });
    },
    ANALYSIS_TIMEOUT_MS,
  );
});

describe('le mode Sans fin : le monstre', () => {
  const game = arcadeGame(ArcadeGameId.Monster);
  if (!game) {
    throw new Error('Le monstre absent');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const chunks = run(ArcadeGameId.Monster, RUN_CHUNKS);
  const runTiles = params.maxRunSpeed / 16;

  it('des morceaux bien formés ; le monstre de plus en plus rapide, toujours moins que Céleste', () => {
    wellFormed(chunks, ARCADE_MONSTER.rows);
    const speeds = chunks.map((c) => c.speed ?? 0);
    for (const speed of speeds) {
      expect(speed).toBeGreaterThan(0.5 * runTiles);
      expect(speed).toBeLessThan(runTiles);
    }
    // Une part de l'allure du témoin dans chaque morceau, qui monte avec la difficulté.
    const mean = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length;
    expect(mean(speeds.slice(-5))).toBeGreaterThan(mean(speeds.slice(0, 5)) + 1);
    // La poursuite collée : une phase par morceau, vers la droite, l'allure du monstre.
    const level = parseAsciiLevel('endless-monster', stitch(chunks.slice(0, 3), HEADER));
    expect(level.chase?.dir).toBe('right');
    expect(level.chase?.look).toBe('monster');
    expect(level.chase?.phases.map((p) => p.speed)).toEqual(
      chunks.slice(0, 3).map((c) => Number((c.speed ?? 0).toFixed(2))),
    );
  });

  it(`le témoin, poursuivi, traverse ${String(RUN_CHUNKS)} morceaux : le monstre le tient en laisse`, () => {
    const level = parseAsciiLevel('endless-monster', stitch(chunks, HEADER));
    const lead = chaseLead(
      level,
      stitchedPlan(chunks),
      params,
      phase.hitbox,
      monsterEndlessParams(DEFAULT_COMBAT),
    );
    // Jamais attrapé, ni même approché de trop près ; tenu à la laisse, jamais bien plus loin.
    expect(lead).toBeGreaterThan(ARCADE_MONSTER.endless.leashTiles / 2);
    expect(lead).toBeLessThan(ARCADE_MONSTER.endless.leashTiles + 2);
  });

  it('la poursuite recule avec la bande : même front à l’écran, nouvelles phases', () => {
    const first = parseAsciiLevel('m', stitch(chunks.slice(0, 3), HEADER));
    const next = parseAsciiLevel('m', stitch(chunks.slice(1, 4), HEADER));
    const chase = new Chase(
      first.chase ?? { dir: 'right', end: 1, phases: [], trips: [], look: 'monster' },
      monsterEndlessParams(DEFAULT_COMBAT),
      PHYSICS_STEP_HZ,
    );
    chase.front = 700;
    const dx = (chunks[0]?.width ?? 0) * 16;
    if (next.chase) {
      chase.reframe(next.chase, dx);
    }
    expect(chase.front).toBe(700 - dx);
    expect(chase.data).toBe(next.chase);
  });
});
