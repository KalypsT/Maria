import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { StoryFlag } from '../src/config/story';
import { EntityType, Tile, tileAt, type LevelData } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { atTide, highTide } from '../src/core/level/tide';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import type { StoryData } from '../src/core/story/story';
import { storyProblems } from '../src/core/story/storyProblems';
import { buildZone } from '../src/core/world/zone';
import { LEVELS } from '../src/levels';
import tideRoom from './fixtures/tide-room.txt?raw';
import {
  lanternNodes,
  legProblems,
  reachableNodes,
  seaAnalysis,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const ROOM = 'tide-room';
const low = parseAsciiLevel(ROOM, tideRoom);
const high = highTide(low);

/** Une petite salle de marée écrite à la main (lignes de 12 tuiles). */
function room(lines: string[], directives: string[]): string {
  return [...directives.map((d) => `; @${d}`), ...lines].join('\n');
}
const BASIN = [
  '############',
  '#..........#',
  '#..........#',
  '#..........#',
  '#.P........#',
  '####.....###',
  '####.....###',
  '############',
];

describe('la marée : deux variantes statiques d’une salle (D-95)', () => {
  it('marée basse : la salle telle que dessinée, l’eau sous sa ligne basse ; marée haute : plus haut', () => {
    expect(low.tide?.high).toBe(false);
    expect(high.tide?.high).toBe(true);
    // Le sable (ligne 14) n'est jamais sous l'eau ; à marée haute, l'eau monte des lignes 10 à 13.
    expect(tileAt(low, 13, 12)).toBe(Tile.Empty);
    for (let row = 10; row <= 13; row++) {
      expect(tileAt(high, 13, row), `ligne ${String(row)}`).toBe(Tile.Water);
    }
    expect(tileAt(high, 13, 9)).toBe(Tile.Empty);
    // Hors de la mer (la berge, la falaise), rien ne change.
    expect(tileAt(high, 5, 10)).toBe(Tile.Empty);
    expect(tileAt(high, 30, 3)).toBe(Tile.Empty);
    const basin = parseAsciiLevel('b', room(BASIN, ['tide: 6 5', 'sea: 4 1 5 6']));
    expect(tileAt(basin, 5, 6)).toBe(Tile.Water);
    expect(tileAt(basin, 5, 5)).toBe(Tile.Empty);
    expect(tileAt(highTide(basin), 5, 5)).toBe(Tile.Water);
    expect(tileAt(highTide(basin), 5, 4)).toBe(Tile.Empty);
  });

  it('ce qui flotte monte de toute la marée (le ponton) ; décor et câbles avec lui', () => {
    for (let col = 18; col <= 21; col++) {
      expect(tileAt(low, col, 13)).toBe(Tile.OneWay);
      expect(tileAt(high, col, 13)).toBe(Tile.Water);
      expect(tileAt(high, col, 9)).toBe(Tile.OneWay);
    }
    const boat = parseAsciiLevel(
      'boat',
      room(
        [
          '############',
          '#..........#',
          '#..........#',
          '#..........#',
          '#.P........#',
          '####.==..###',
          '####.....###',
          '############',
        ],
        [
          'tide: 7 5',
          'sea: 4 1 5 6',
          'rise: 5 3 2 3',
          'decor: boat 5 3 2 3',
          'decor: lamp 2 1 1 3',
          'cable: 5 3 6 4',
        ],
      ),
    );
    const up = highTide(boat);
    expect(tileAt(up, 5, 3)).toBe(Tile.OneWay);
    expect(tileAt(up, 5, 5)).toBe(Tile.Water);
    expect(up.decor.find((d) => d.kind === 'boat')?.row).toBe(1);
    expect(up.decor.find((d) => d.kind === 'lamp')?.row).toBe(1);
    expect(up.cables[0]?.y1).toBe((boat.cables[0]?.y1 ?? 0) - 2 * T);
  });

  it('mêmes identifiants aux deux marées ; la trouvaille noyée n’est qu’à marée basse', () => {
    expect(high.id).toBe(low.id);
    const secrets = (level: LevelData) =>
      level.entities.filter((e) => e.type === EntityType.Shell).map((e) => [e.col, e.row]);
    expect(secrets(low)).toEqual([
      [32, 3],
      [13, 13],
    ]);
    expect(secrets(high)).toEqual([[32, 3]]);
    expect(high.entities.filter((e) => e.type === EntityType.Checkpoint)).toEqual(
      low.entities.filter((e) => e.type === EntityType.Checkpoint),
    );
  });

  it('atTide passe d’une variante à l’autre ; une salle sans marée ne change pas', () => {
    expect(atTide(low, true)).toBe(high);
    expect(atTide(high, false)).toBe(low);
    expect(atTide(high, true)).toBe(high);
    expect(atTide(low, false)).toBe(low);
    const dry = parseAsciiLevel('dry', room(BASIN, []));
    expect(dry.tide).toBeNull();
    expect(atTide(dry, true)).toBe(dry);
  });

  it('erreurs explicites : lanterne, départ ou sortie sous l’eau, entité sur ce qui flotte, ce qui flotte heurte', () => {
    const lines = (row4: string, row5 = '####.....###') => [
      '############',
      '#..........#',
      '#..........#',
      '#..........#',
      row4,
      row5,
      '####.....###',
      '############',
    ];
    expect(() =>
      parseAsciiLevel('x', room(lines('#.P........#'), ['tide: 4 2', 'sea: 1 1 10 6'])),
    ).toThrow(/départ sous l'eau/);
    expect(() =>
      parseAsciiLevel(
        'x',
        room(lines('#.P........#', '####.C...###'), ['tide: 7 5', 'sea: 4 1 5 6']),
      ),
    ).toThrow(/checkpoint sous l'eau à marée haute/);
    expect(() =>
      parseAsciiLevel(
        'x',
        room(lines('#.P........#', '####.S...###'), ['tide: 5 5', 'sea: 4 1 5 6']),
      ),
    ).toThrow(/coquille sous l'eau à marée basse/);
    expect(() =>
      parseAsciiLevel(
        'x',
        room(lines('#.P..S.....#'), ['tide: 7 5', 'sea: 4 1 5 6', 'rise: 5 4 1 1']),
      ),
    ).toThrow(/sur ce qui flotte/);
    expect(() =>
      parseAsciiLevel(
        'x',
        room(lines('#.P..=.....#', '####.#...###'), ['tide: 6 5', 'sea: 4 1 5 6', 'rise: 5 5 1 1']),
      ),
    ).toThrow(/heurte/);
    expect(() => parseAsciiLevel('x', room(BASIN, ['tide: 4 6', 'sea: 4 1 5 6']))).toThrow(/@tide/);
    expect(() => parseAsciiLevel('x', room(BASIN, ['sea: 4 1 5 6']))).toThrow(/@tide/);
    expect(() =>
      parseAsciiLevel('x', room(BASIN, ['tide: 7 5', 'sea: 4 1 5 6', 'rise: 1 1 2 2'])),
    ).toThrow(/hors de la mer/);
  });

  it('l’eau n’est jamais un sol : pas de surface sous elle, l’analyse l’évite', () => {
    const a = standOn(high, { col: 13, row: 13 });
    expect(a).toBe(-1);
    expect(standOn(low, { col: 13, row: 13 })).toBeGreaterThanOrEqual(0);
  });
});

describe('les tronçons (`; @leg:`, D-96)', () => {
  it('se lisent : départ, arrivée, difficulté, capacités, marée', () => {
    expect(low.legs).toEqual([
      {
        from: { col: 6, row: 10 },
        to: { col: 13, row: 13 },
        difficulty: 'easy',
        needs: [],
        tide: 'low',
        layer: 'present',
      },
      {
        from: { col: 6, row: 10 },
        to: { col: 32, row: 3 },
        difficulty: 'easy',
        needs: ['climb'],
        tide: 'high',
        layer: 'present',
      },
    ]);
    expect(() => parseAsciiLevel('x', room(BASIN, ['leg: 1,1 2,2 tricky']))).toThrow(/@leg/);
    expect(() => parseAsciiLevel('x', room(BASIN, ['leg: 1,1 2,2 easy fly']))).toThrow(/@leg/);
    expect(() => parseAsciiLevel('x', room(BASIN, ['leg: 1,1 99,2 easy']))).toThrow(
      /hors de la salle/,
    );
  });

  it(
    'sont vérifiés : difficulté exacte, capacités exigées, à leur marée',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      for (const leg of low.legs) {
        expect(legProblems(low, leg)).toEqual([]);
      }
      const [sand, cliff] = low.legs;
      if (!sand || !cliff) {
        throw new Error('tronçons absents');
      }
      // La falaise à marée basse : impossible ; une difficulté fausse, une capacité inutile : signalées.
      expect(legProblems(low, { ...cliff, tide: 'low' }).join()).toMatch(/plus dur que easy/);
      expect(legProblems(low, { ...cliff, difficulty: 'medium' }).join()).toMatch(
        /aussi faisable en easy/,
      );
      expect(legProblems(low, { ...sand, needs: ['hook'] }).join()).toMatch(/faisable sans hook/);
    },
  );
});

describe('le graphe de la marée et le banc (D-95)', () => {
  const zone = buildZone({
    id: 'tide',
    start: ROOM,
    rooms: [{ id: ROOM, text: tideRoom }],
    links: [],
  });
  const bench = {
    id: 'bench',
    room: ROOM,
    on: 'interact' as const,
    area: { col: 3, row: 9, w: 3, h: 2 },
    mark: { col: 4, row: 8 },
    when: {},
    lock: true,
    repeat: true,
    steps: [
      { do: 'fadeOut' as const, ms: 100 },
      { do: 'toggle' as const, id: StoryFlag.TideHigh },
      { do: 'place' as const, col: 4, row: 10, facing: 1 as const },
      { do: 'fadeIn' as const, ms: 100 },
    ],
  };
  const story: StoryData = { triggers: [bench], props: [], times: [], lockedRooms: [], omens: [] };

  it('le banc se rejoue, retourne la marée dans le noir, et la sauvegarde la retire', () => {
    expect(storyProblems(story, zone)).toEqual([]);
    const shown: StoryData = {
      ...story,
      triggers: [{ ...bench, steps: [{ do: 'toggle', id: StoryFlag.TideHigh }] }],
    };
    expect(storyProblems(shown, zone).join()).toMatch(/sous les yeux du joueur/);
    const log: string[] = [];
    const noop = () => undefined;
    const host: StoryHost = {
      flagSet: (id) => log.push(`+${id}`),
      flagCleared: (id) => log.push(`-${id}`),
      place: noop,
      room: noop,
      pose: noop,
      think: noop,
      sparkle: noop,
      shake: noop,
      memory: noop,
      hush: noop,
      ability: noop,
      play: noop,
    };
    const d = new StoryDirector(story, host, 100);
    const box = { x: 4 * T, y: 11 * T - 28, width: 12, height: 28 };
    for (let k = 0; k < 2; k++) {
      d.step(ROOM, box, true);
      for (let i = 0; i < 40 && d.busy; i++) {
        d.step(ROOM, box, false);
      }
    }
    expect(log).toEqual([`+${StoryFlag.TideHigh}`, `-${StoryFlag.TideHigh}`]);
    expect(d.flags.has(StoryFlag.TideHigh)).toBe(false);
  });

  it(
    'la falaise ne s’atteint qu’en passant par le banc ; jamais coincée, à aucune marée',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const graph = tideGraph(zone, story, [ROOM]);
      const start = tideNode(ROOM, false, standOn(low, low.spawn));
      const cliff = (h: boolean) => tideNode(ROOM, h, standOn(atTide(low, h), { col: 32, row: 3 }));
      const reached = reachableNodes(graph, start);
      expect(reached.has(cliff(true))).toBe(true);
      expect(reached.has(cliff(false))).toBe(false);
      const noBench = tideGraph(zone, { ...story, triggers: [] }, [ROOM]);
      expect(reachableNodes(noBench, start).has(cliff(true))).toBe(false);
      expect(stuckNodes(graph, reached, lanternNodes(zone, [ROOM]))).toEqual([]);
    },
  );
});

describe('le parcours d’essai 13 « Marée » (D-97)', () => {
  const source = LEVELS.find((l) => l.id === 'maree');
  if (!source) {
    throw new Error('parcours maree absent');
  }
  const course = parseAsciiLevel('maree', source.text);

  it('a ce qui flotte et une trouvaille noyée à marée haute', () => {
    expect(course.tide?.rises).toHaveLength(2);
    const secrets = (level: LevelData) => level.entities.filter((e) => e.type === EntityType.Shell);
    expect(secrets(course)).toHaveLength(1);
    expect(secrets(highTide(course))).toHaveLength(0);
  });

  it(
    'à marée haute (phase 3, toutes les capacités) : l’arrivée atteinte, jamais coincée',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const high = highTide(course);
      const a = seaAnalysis(high);
      const next = new Map<number, number[]>();
      const back = new Map<number, number[]>();
      for (const m of a.moves) {
        next.set(m.from, [...(next.get(m.from) ?? []), m.to]);
        back.set(m.to, [...(back.get(m.to) ?? []), m.from]);
      }
      const walk = (from: number, edges: Map<number, number[]>) => {
        const seen = new Set([from]);
        const queue = [from];
        for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
          for (const t of edges.get(s) ?? []) {
            if (!seen.has(t)) {
              seen.add(t);
              queue.push(t);
            }
          }
        }
        return seen;
      };
      const start = standOn(high, high.spawn);
      const goal = standOn(high, high.goal ?? high.spawn);
      const reached = walk(start, next);
      expect(reached.has(goal)).toBe(true);
      const back2goal = walk(goal, back);
      const back2start = walk(start, back);
      const stuck = [...reached].filter((s) => !back2goal.has(s) && !back2start.has(s));
      expect(stuck).toEqual([]);
    },
  );
});
