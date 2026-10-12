import { describe, expect, it } from 'vitest';
import {
  ARCADE,
  ARCADE_CHIMNEY,
  ARCADE_CLIMB,
  ARCADE_ENDLESS,
  ARCADE_WIND,
  ArcadeGameId,
} from '../src/config/arcade';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { arcadeGame, arcadePhase, endlessChunk } from '../src/core/arcade/arcade';
import { climbToLedge } from '../src/core/arcade/chimney';
import {
  EndlessBand,
  frameRects,
  layoutOf,
  stitch,
  stitchedPosts,
  type EndlessChunk,
} from '../src/core/arcade/endless';
import { crossSteps } from '../src/core/arcade/steps';
import { fly } from '../src/core/arcade/wind';
import { analyzeLevel, describeMove } from '../src/core/analysis/analyzeLevel';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const SEED = 777;
const COUNT = 14;
const HEADER = ['; @world: console'];

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

/** Les lignes d'un morceau : toutes de sa largeur, sans départ ni fanion. */
function wellFormed(chunks: readonly EndlessChunk[]): void {
  for (const chunk of chunks) {
    expect(chunk.lines.length).toBeGreaterThan(0);
    for (const line of chunk.lines) {
      expect(line).toHaveLength(chunk.width);
      expect(line).not.toMatch(/[PG]/);
    }
  }
}

/** Le mode Sans fin, PR 5 : les morceaux en deux dimensions, les jeux verticaux (D-167). */
describe('le mode Sans fin : la bande en deux dimensions', () => {
  it('le cadre couvre exactement ce qu’aucun morceau ne couvre', () => {
    const chunks = run(ArcadeGameId.Wind, 3);
    const layout = layoutOf(chunks);
    const level = parseAsciiLevel('w', stitch(chunks, HEADER));
    expect(level.width).toBe(layout.width);
    expect(level.height).toBe(layout.height);
    const inFrame = new Set<string>();
    for (const r of frameRects(layout)) {
      for (let row = r.row; row < r.row + r.height; row++) {
        for (let col = r.col; col < r.col + r.width; col++) {
          const key = `${String(col)},${String(row)}`;
          expect(inFrame.has(key)).toBe(false);
          inFrame.add(key);
        }
      }
    }
    let uncovered = 0;
    for (let row = 0; row < layout.height; row++) {
      for (let col = 0; col < layout.width; col++) {
        const covered = layout.placed.some(
          (p) =>
            col >= p.col &&
            col < p.col + p.chunk.width &&
            row >= 1 + p.row &&
            row < 1 + p.row + p.chunk.lines.length,
        );
        if (!covered) {
          uncovered++;
          expect(inFrame.has(`${String(col)},${String(row)}`)).toBe(true);
          expect(tileAt(level, col, row)).toBe(Tile.Solid);
        }
      }
    }
    expect(inFrame.size).toBe(uncovered);
  });

  it('vers le haut : la bande recule vers le bas quand Céleste monte dans le dernier morceau', () => {
    const chunks = run(ArcadeGameId.Chimney, 4);
    const band = new EndlessBand(chunks.slice(0, 3), 'up');
    const placed = band.layout.placed;
    // Empilés, à la même colonne, de bas en haut.
    expect(new Set(placed.map((p) => p.col)).size).toBe(1);
    expect(placed[1]?.row ?? 0).toBeLessThan(placed[0]?.row ?? 0);
    const last = placed[2];
    if (!last) {
      throw new Error('pas de troisième morceau');
    }
    const bottom = 1 + last.row + last.chunk.lines.length;
    expect(band.shouldShift(5, bottom)).toBe(false);
    expect(band.shouldShift(5, bottom - 1)).toBe(true);
    const next = chunks[3];
    if (!next) {
      throw new Error('pas de quatrième morceau');
    }
    const at = band.placeOf(next);
    expect(band.shift(next)).toEqual({ dx: 0, dy: next.lines.length });
    // Le nouveau morceau est là où on l'avait dessiné, une fois tout reculé.
    expect(band.layout.placed[2]?.row).toBe(at.row + next.lines.length);
  });
});

describe('le mode Sans fin : la grimpette', () => {
  const game = arcadeGame(ArcadeGameId.Climb);
  if (!game) {
    throw new Error('La grimpette absente');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const chunks = run(ArcadeGameId.Climb, ARCADE.verifiedLevels + 1);

  it('des morceaux en escalier, de plus en plus haut vers la droite', () => {
    wellFormed(chunks);
    const placed = layoutOf(chunks).placed;
    for (let i = 1; i < placed.length; i++) {
      expect(placed[i]?.col ?? 0).toBeGreaterThan(placed[i - 1]?.col ?? 0);
      expect(placed[i]?.row ?? 0).toBeLessThan(placed[i - 1]?.row ?? 0);
    }
    expect(chunks[0]?.posts[0]?.width).toBe(ARCADE_CLIMB.start.width);
  });

  it(`le témoin grimpe ${String(COUNT)} morceaux d’affilée`, () => {
    const some = chunks.slice(0, COUNT);
    const level = parseAsciiLevel('endless-climb', stitch(some, HEADER, true));
    const posts = stitchedPosts(some);
    const target = posts.slice(0, posts.length - (some.at(-1)?.posts.length ?? 1) + 1);
    expect(crossSteps(level, target, params, phase.hitbox, true)).toBe(true);
  });

  it.each(Array.from({ length: ARCADE.verifiedLevels - 1 }, (_, i) => i))(
    'jointures du morceau %i : faisables par l’analyse, le passage le plus dur reste juste',
    (index) => {
      const level = parseAsciiLevel(
        'endless-climb-seams',
        stitch(chunks.slice(index, index + 3), HEADER, true),
      );
      const analysis = analyzeLevel(level, params, { climb: true, hitbox: phase.hitbox });
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

describe('le mode Sans fin : la cheminée', () => {
  const game = arcadeGame(ArcadeGameId.Chimney);
  if (!game) {
    throw new Error('La cheminée absente');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const chunks = run(ArcadeGameId.Chimney, COUNT);

  it('des morceaux empilés : la largeur de la salle, un rebord en bas, la section d’avant', () => {
    wellFormed(chunks);
    for (const chunk of chunks) {
      expect(chunk.width).toBe(ARCADE_CHIMNEY.cols - 2);
      expect(chunk.lines.length % ARCADE_CHIMNEY.sectionRows).toBe(0);
      expect(chunk.posts[0]?.width).toBe(1);
      expect(chunk.posts[0]?.top).toBe(chunk.lines.length);
    }
    for (let i = 1; i < chunks.length; i++) {
      // La section de départ continue la dernière du morceau d'avant.
      const exit = chunks[i - 1]?.exit;
      expect(chunks[i]?.posts[0]?.col).toBe((exit?.col ?? 0) - 1);
    }
    expect(ARCADE_ENDLESS.fallRows).toBeGreaterThanOrEqual(ARCADE_CHIMNEY.sectionRows);
  });

  it.each(Array.from({ length: COUNT - 1 }, (_, i) => i))(
    'morceau %i : le témoin grimpe de son rebord à celui du morceau suivant',
    (index) => {
      const pair = chunks.slice(index, index + 2);
      const level = parseAsciiLevel('endless-chimney', stitch(pair, HEADER));
      const next = layoutOf(pair).placed[1];
      const ledge = pair[1]?.posts[0];
      if (!next || !ledge) {
        throw new Error('pas de morceau suivant');
      }
      const target = { col: next.col + ledge.col, row: ledge.top + next.row };
      expect(climbToLedge(level, target, params, phase.hitbox)).not.toBeNull();
    },
  );
});

describe('le mode Sans fin : le grand vent', () => {
  const game = arcadeGame(ArcadeGameId.Wind);
  if (!game) {
    throw new Error('Le grand vent absent');
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const chunks = run(ArcadeGameId.Wind, COUNT);

  it('des morceaux en escalier, de plus en plus bas vers la droite, plein au-dessus', () => {
    wellFormed(chunks);
    const placed = layoutOf(chunks.slice(0, 3)).placed;
    for (let i = 1; i < placed.length; i++) {
      expect(placed[i]?.col ?? 0).toBeGreaterThan(placed[i - 1]?.col ?? 0);
      expect(placed[i]?.row ?? 0).toBeGreaterThan(placed[i - 1]?.row ?? 0);
    }
    // Au-dessus du morceau suivant, le cadre : pas de vol par-dessus ses portes.
    const level = parseAsciiLevel('endless-wind', stitch(chunks.slice(0, 3), HEADER));
    const second = placed[1];
    if (second) {
      expect(tileAt(level, second.col + 10, second.row)).toBe(Tile.Solid);
    }
    expect(chunks[0]?.posts[0]?.width).toBe(ARCADE_WIND.start.width);
  });

  it.each(Array.from({ length: COUNT - 1 }, (_, i) => i))(
    'morceau %i : le témoin plane jusqu’à la jointure du morceau suivant',
    (index) => {
      const pair = chunks.slice(index, index + 2);
      const level = parseAsciiLevel('endless-wind', stitch(pair, HEADER, true));
      const [first, next] = layoutOf(pair).placed;
      const seam = pair[1]?.posts[0];
      if (!first || !next || !seam) {
        throw new Error('pas de morceau suivant');
      }
      const plan = (pair[0]?.windPlan ?? []).map((leg) => ({
        ...leg,
        untilX: leg.untilX + first.col * 16,
      }));
      const flight = fly(level, plan, params, phase.hitbox);
      expect(flight.landed).toBe(true);
      expect(flight.feet).toBe((seam.top + next.row) * 16);
    },
  );
});
