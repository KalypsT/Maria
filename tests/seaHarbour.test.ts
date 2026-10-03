import { describe, expect, it } from 'vitest';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, type LevelData } from '../src/core/level/LevelData';
import { atTide, highTide } from '../src/core/level/tide';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  lanternNodes,
  reachableNodes,
  seaAnalysis,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** La station balnéaire, PR 4 (D-100) : le phare, le port, la boucle de la baie. */
const BAY = [
  'sea-station',
  'sea-promenade',
  'sea-centre',
  'sea-beach',
  'sea-rocks',
  'sea-lighthouse',
  'sea-port',
];
const noop = () => undefined;
const host: StoryHost = {
  flagSet: noop,
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
function director(flags: readonly string[]): StoryDirector {
  const d = new StoryDirector(HOUSE_STORY, host);
  d.setFlags(flags);
  return d;
}

/** Surfaces atteintes dans une variante de salle (fenêtres quelconques). */
function reach(room: LevelData, from: number): Set<number> {
  const a = seaAnalysis(room);
  const seen = new Set([from]);
  const queue = [from];
  for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
    for (const m of a.moves) {
      if (m.from === s && !seen.has(m.to)) {
        seen.add(m.to);
        queue.push(m.to);
      }
    }
  }
  return seen;
}

describe('le phare et le port : la boucle de la baie (D-100)', () => {
  it('la boucle : promenade, plage, rochers, phare, port, promenade ; la page « La mer »', () => {
    expect(zone.destination('sea-rocks', 2)).toEqual({ room: 'sea-lighthouse', exit: 1 });
    expect(zone.destination('sea-lighthouse', 2)).toEqual({ room: 'sea-port', exit: 2 });
    expect(zone.destination('sea-port', 1)).toEqual({ room: 'sea-promenade', exit: 4 });
    expect(level('sea-port').tide).not.toBeNull();
    expect(level('sea-lighthouse').tide).toBeNull();
    expect(level('sea-port').meta.enemies).toBe('crab gull');
    expect(level('sea-port').entities.some((e) => e.type === EntityType.Spider)).toBe(true);
  });

  it('la grille du port s’ouvre après la première marée', () => {
    const before = [F.TrainArrived, F.SeaArrived];
    expect(director(before).exitsLocked('sea-promenade', 4)).toBe(true);
    expect(director([...before, F.SeaFirstTide]).exitsLocked('sea-promenade', 4)).toBe(false);
  });

  it(
    'la passerelle : à marée haute dans les deux sens ; à marée basse, on se laisse seulement tomber',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const walk = { col: 3, row: 13 };
      const quay = { col: 160, row: 17 };
      for (const high of [false, true]) {
        const port = atTide(level('sea-port'), high);
        expect(
          reach(port, standOn(port, walk)).has(standOn(port, quay)),
          `vers le quai ${String(high)}`,
        ).toBe(true);
        expect(
          reach(port, standOn(port, quay)).has(standOn(port, walk)),
          `vers le phare ${String(high)}`,
        ).toBe(high);
      }
    },
  );

  it('la buse du port : sa trouvaille seulement à marée basse ; les crabes de la vase aussi', () => {
    const port = level('sea-port');
    const pipe = port.entities.find((e) => e.type === EntityType.Secret && e.row === 27);
    expect(pipe).toBeDefined();
    const crabs = (l: LevelData) => l.entities.filter((e) => e.type === EntityType.Patroller);
    expect(crabs(port).length).toBeGreaterThan(0);
    expect(crabs(highTide(port))).toEqual([]);
  });

  it('du haut du phare, on voit le carrousel : une fois, après la première marée', () => {
    const t = HOUSE_STORY.triggers.find((c) => c.id === 'sea-carousel-seen');
    expect(t?.room).toBe('sea-lighthouse');
    expect(t?.when).toEqual({ all: [F.SeaFirstTide], none: [F.SeaSawCarousel] });
    expect(t?.steps.some((s) => s.do === 'flag' && s.id === F.SeaSawCarousel)).toBe(true);
  });

  it(
    'toute la baie, aux deux marées, avec les deux bancs : jamais coincée ; le phare et le port atteints',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const graph = tideGraph(zone, HOUSE_STORY, BAY);
      const start = tideNode(
        'sea-station',
        false,
        standOn(level('sea-station'), { col: 24, row: 17 }),
      );
      const reached = reachableNodes(graph, start);
      for (const high of [false, true]) {
        const lamp = (room: string, col: number, row: number) =>
          tideNode(room, high, standOn(atTide(level(room), high), { col, row }));
        expect(reached.has(lamp('sea-lighthouse', 6, 43)), `phare ${String(high)}`).toBe(true);
        expect(reached.has(lamp('sea-port', 146, 17)), `port ${String(high)}`).toBe(true);
      }
      expect(stuckNodes(graph, reached, lanternNodes(zone, BAY))).toEqual([]);
    },
  );
});
