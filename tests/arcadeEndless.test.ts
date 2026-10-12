import { describe, expect, it } from 'vitest';
import { ARCADE, ARCADE_ENDLESS, ARCADE_JUMPS, ArcadeGameId } from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { ENDLESS_READY, arcadeGame, arcadePhase, endlessChunk } from '../src/core/arcade/arcade';
import { EndlessChunks } from '../src/platform/endlessChunks';
import {
  EndlessBand,
  endlessLevel,
  newRunSeed,
  stitch,
  stitchedPosts,
  type EndlessChunk,
} from '../src/core/arcade/endless';
import { crossSteps, generateStepsChunk, stepsDifficulty } from '../src/core/arcade/steps';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const SEED = 12345;
/** Morceaux traversés d'affilée par le témoin : au-delà du plafond de la difficulté. */
const RUN_CHUNKS = 30;
/** Une demi-vue (tuiles, 780 px de large) : un morceau entier devant Céleste la couvre toujours. */
const HALF_VIEW_TILES = 25;

/** Le mode Sans fin, PR 1 : les morceaux des sauts, les jointures, la bande (D-167). */
describe('le mode Sans fin : les morceaux des sauts', () => {
  const game = arcadeGame(ArcadeGameId.Jumps);
  if (!game) {
    throw new Error('Les sauts absents');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const cache = new Map<string, EndlessChunk>();
  const chunk = (index: number, seed = SEED) => {
    const key = `${String(seed)}:${String(index)}`;
    let found = cache.get(key);
    if (!found) {
      found = generateStepsChunk(
        game.id,
        game.name,
        index,
        endlessLevel(index),
        seed,
        ARCADE_JUMPS,
        params,
        phase.hitbox,
        game.abilities,
      );
      cache.set(key, found);
    }
    return found;
  };
  const chunks = Array.from({ length: RUN_CHUNKS }, (_, i) => chunk(i));
  const header = ['; @abilities:'];

  it('la difficulté du niveau n au morceau n, jusqu’au plafond', () => {
    expect(endlessLevel(0)).toBe(1);
    expect(endlessLevel(4)).toBe(5);
    expect(endlessLevel(ARCADE_ENDLESS.capLevel - 1)).toBe(ARCADE_ENDLESS.capLevel);
    expect(endlessLevel(500)).toBe(ARCADE_ENDLESS.capLevel);
    expect(ARCADE_ENDLESS.capLevel).toBe(ARCADE.verifiedLevels);
    expect(chunk(0).difficulty).toBe(stepsDifficulty(ARCADE_JUMPS, 1));
    expect(chunk(RUN_CHUNKS - 1).difficulty).toBe(
      stepsDifficulty(ARCADE_JUMPS, ARCADE_ENDLESS.capLevel),
    );
  });

  it('un nouveau parcours à chaque partie ; le même pour une même graine', () => {
    expect(chunk(3, 777).lines).toEqual(chunk(3, 777).lines);
    expect(chunk(3, 777).lines).not.toEqual(chunk(3, 778).lines);
    const seeds = new Set(Array.from({ length: 20 }, () => newRunSeed()));
    expect(seeds.size).toBeGreaterThan(15);
    expect(newRunSeed(() => 0.5)).toBe(Math.floor(0.5 * 0x7fffffff));
  });

  it.each(chunks.map((c) => [c.index, c] as const))(
    'morceau %i : une jointure au départ, à la hauteur de celle du suivant',
    (_, c) => {
      // Sans le plafond ni le fond du cadre : la bande les ajoute.
      expect(c.lines).toHaveLength(ARCADE_JUMPS.rows - 2);
      for (const line of c.lines) {
        expect(line).toHaveLength(c.width);
        expect(line).not.toMatch(/[PG]/);
      }
      const seam = c.posts[0];
      expect(seam).toMatchObject({
        col: 0,
        width: ARCADE_JUMPS.start.width,
        top: ARCADE_JUMPS.start.top,
        goal: false,
      });
      // Le haut de la jointure, et rien au-dessus.
      expect(c.lines[ARCADE_JUMPS.start.top - 1]?.slice(0, ARCADE_JUMPS.start.width)).toBe(
        'bbbbbb',
      );
      expect(c.lines[ARCADE_JUMPS.start.top - 2]?.slice(0, ARCADE_JUMPS.start.width)).toBe(
        '......',
      );
      expect(c.width).toBeGreaterThanOrEqual(HALF_VIEW_TILES);
    },
  );

  it(`le témoin traverse ${String(RUN_CHUNKS)} morceaux d’affilée`, () => {
    const all = [...chunks, chunk(RUN_CHUNKS)];
    const level = parseAsciiLevel('endless-run', stitch(all, header, true));
    // Jusqu'à la jointure qui ouvre le dernier morceau (son premier poteau).
    const allPosts = stitchedPosts(all);
    const posts = allPosts.slice(0, allPosts.length - chunk(RUN_CHUNKS).posts.length + 1);
    expect(crossSteps(level, posts, params, phase.hitbox)).toBe(true);
  });

  it.each(chunks.slice(0, ARCADE.verifiedLevels - 1).map((c) => c.index))(
    'jointures du morceau %i : faisables par l’analyse, le passage le plus dur reste juste',
    (index) => {
      // Le morceau, le suivant, et la jointure qui ouvre le troisième (le fanion).
      const level = parseAsciiLevel(
        'endless-seams',
        stitch([chunk(index), chunk(index + 1), chunk(index + 2)], header, true),
      );
      const analysis = analyzeLevel(level, params, { hitbox: phase.hitbox });
      expect(analysis.path, `morceau ${String(index)} : aucun chemin`).not.toBeNull();
      const critical = analysis.critical;
      const detail = critical ? describeMove(critical, analysis.map) : 'aucun saut';
      console.info(`sans fin, jointures ${String(index)} : ${detail}`);
      expect(critical?.windowMs ?? Number.POSITIVE_INFINITY, detail).toBeGreaterThanOrEqual(
        ARCADE.minWindowMs,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );

  it('la bande : trois morceaux ; en entrant dans le dernier, le plus ancien part', () => {
    const band = new EndlessBand([chunk(0), chunk(1), chunk(2)]);
    expect(band.nextIndex).toBe(3);
    const start = band.lastStartCol;
    expect(start).toBe(1 + chunk(0).width + chunk(1).width);
    expect(band.shouldShift(start - 1)).toBe(false);
    expect(band.shouldShift(start)).toBe(true);
    expect(() => band.shift(chunk(4))).toThrow(/3/);
    expect(band.shift(chunk(3))).toEqual({ dx: -chunk(0).width, dy: 0 });
    expect(band.originCols).toBe(chunk(0).width);
    expect(band.loaded.map((c) => c.index)).toEqual([1, 2, 3]);
    // Céleste, reculée de la largeur retirée, est au début du morceau du milieu.
    expect(band.shouldShift(start - chunk(0).width)).toBe(false);
    band.shift(chunk(4));
    expect(band.originCols).toBe(chunk(0).width + chunk(1).width);

    // La salle de la bande : des murs aux deux bouts, Céleste sur la première jointure.
    const level = parseAsciiLevel('endless-band', band.text(header));
    expect(level.width).toBe(2 + chunk(2).width + chunk(3).width + chunk(4).width);
    expect(level.height).toBe(ARCADE_JUMPS.rows);
    expect(level.spawn).toMatchObject({ col: 2, row: ARCADE_JUMPS.start.top - 1 });
    expect(tileAt(level, 0, 5)).toBe(Tile.Solid);
    expect(tileAt(level, level.width - 1, 5)).toBe(Tile.Solid);
    expect(level.goal).toBeNull();
  });
});

/** Les morceaux de la partie (D-167, PR 2) : sans worker (ici), générés sur place. */
describe('le mode Sans fin : les morceaux d’une partie', () => {
  it('sans worker, chaque morceau se génère quand on le demande ; un rang invalide : null', () => {
    const source = new EndlessChunks();
    source.start(SEED);
    source.prepare(ArcadeGameId.Jumps, 0, SEED, null);
    expect(source.take(ArcadeGameId.Jumps, 0, SEED)).toBeNull();
    const chunk = source.now(ArcadeGameId.Jumps, 0, SEED, null);
    expect(chunk?.lines).toEqual(endlessChunk(ArcadeGameId.Jumps, 0, SEED)?.lines);
    expect(source.now(ArcadeGameId.Chimney, -1, SEED, null)).toBeNull();
    expect(endlessChunk(ArcadeGameId.Jumps, -1, SEED)).toBeNull();
    // Les huit jeux, depuis la PR 5 (D-167).
    expect(ENDLESS_READY).toEqual(Object.values(ArcadeGameId));
    source.destroy();
  });
});
