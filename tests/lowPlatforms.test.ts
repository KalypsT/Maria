import { describe, expect, it } from 'vitest';
import { Tile, tileAt, EntityType, type LevelData } from '../src/core/level/LevelData';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { analysis, level, roomDifficulty, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
/** Une fosse de dangers plus longue que ça a besoin de plateformes basses (D-70). */
const MAX_BARE_PIT = 6;
/** Une plateforme basse : au plus 3 tuiles au-dessus du fond, à 4 colonnes au plus. */
const RISE = 3;
const REACH = 4;

const isHazard = (t: number) => t === Tile.Hazard || t === Tile.Thorns;

/** Cases du fond des fosses de dangers (danger posé sur un sol, de l'air au-dessus), par rangée. */
function pits(d: LevelData): { row: number; from: number; to: number }[] {
  const runs: { row: number; from: number; to: number }[] = [];
  for (let r = 1; r < d.height - 1; r++) {
    let c = 0;
    while (c < d.width) {
      const pit = (col: number) =>
        isHazard(tileAt(d, col, r)) &&
        tileAt(d, col, r + 1) === Tile.Solid &&
        tileAt(d, col, r - 1) === Tile.Empty;
      if (!pit(c)) {
        c++;
        continue;
      }
      const from = c;
      while (c < d.width && pit(c)) {
        c++;
      }
      runs.push({ row: r, from, to: c - 1 });
    }
  }
  return runs;
}

describe('plateformes basses au-dessus des fosses de dangers (D-70)', () => {
  const rooms = [...zone.rooms.keys()].filter((room) =>
    pits(level(room)).some((p) => p.to - p.from + 1 > MAX_BARE_PIT),
  );

  it('les salles concernées', () => {
    expect(rooms.sort()).toEqual([
      'garden-thorns',
      'garden-upside',
      'school-strange',
      'site',
      'station-depot',
      'station-strange',
    ]);
  });

  it.each(rooms)(
    '%s : tombée au fond, une plateforme basse tout près ramène au départ ou à une lanterne, sans repasser par les dangers',
    { timeout: TIMEOUT },
    (room) => {
      const d = level(room);
      // Escalade et saut mural (déjà là dans toutes ces salles) ; jamais le parapluie.
      const a = analysis(room, true, 2, true);
      const min = roomDifficulty ? roomDifficulty(room) : 0;
      const targets = new Set(
        [d.spawn, ...d.entities.filter((e) => e.type === EntityType.Checkpoint)].map((p) =>
          surfaceUnder(d, a.map, p.col, p.row),
        ),
      );
      // Surfaces d'où l'on rejoint un départ (graphe inversé).
      const back = new Map<number, number[]>();
      for (const m of a.moves) {
        if (m.windowMs >= min) {
          back.set(m.to, [...(back.get(m.to) ?? []), m.from]);
        }
      }
      const home = new Set(targets);
      const queue = [...targets];
      for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
        for (const p of back.get(n) ?? []) {
          if (!home.has(p)) {
            home.add(p);
            queue.push(p);
          }
        }
      }
      const stranded: string[] = [];
      for (const run of pits(d).filter((p) => p.to - p.from + 1 > MAX_BARE_PIT)) {
        for (let col = run.from; col <= run.to; col++) {
          const ok = a.map.surfaces.some((s, i) => {
            const rise = run.row + 1 - s.row;
            const dx = col < s.colStart ? s.colStart - col : col > s.colEnd ? col - s.colEnd : 0;
            return (
              rise >= 0 &&
              rise <= RISE &&
              dx <= REACH &&
              !isHazard(tileAt(d, s.colStart, s.row - 1)) &&
              home.has(i)
            );
          });
          if (!ok) {
            stranded.push(`col. ${String(col + 1)}`);
          }
        }
      }
      expect(stranded).toEqual([]);
    },
  );
});
