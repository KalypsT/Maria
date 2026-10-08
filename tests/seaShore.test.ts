import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT, TrainPhase } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, msToSteps } from '../src/config/movement';
import { StoryFlag as F } from '../src/config/story';
import { CombatEvent, CombatWorld, wavesOf } from '../src/core/combat/CombatWorld';
import { EntityType, Tile, tileAt, type LevelData } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { atTide, highTide } from '../src/core/level/tide';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  benches,
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

/** La station balnéaire, PR 3 (D-99) : la plage, les rochers, la première marée, le banc. */
const SEA_ROOMS = ['sea-station', 'sea-promenade', 'sea-centre', 'sea-beach', 'sea-rocks'];
const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((c) => c.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};

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

describe('la plage et les rochers : deux salles de marée (D-99)', () => {
  it('liaisons : l’escalier de la promenade, la plage, les rochers ; la page « La mer »', () => {
    expect(zone.destination('sea-promenade', 3)).toEqual({ room: 'sea-beach', exit: 1 });
    expect(zone.destination('sea-beach', 2)).toEqual({ room: 'sea-rocks', exit: 1 });
    for (const room of ['sea-beach', 'sea-rocks']) {
      expect(level(room).tide, room).not.toBeNull();
      expect(level(room).meta.enemies, room).toBe('crab');
    }
    // Les crabes du sable ne sont pas là à marée haute (sous l'eau).
    const crabs = (l: LevelData) => l.entities.filter((e) => e.type === EntityType.Patroller);
    expect(crabs(level('sea-beach')).length).toBeGreaterThan(0);
    expect(crabs(highTide(level('sea-beach')))).toEqual([]);
  });

  it(
    'la plage : la grotte seulement à marée basse, la balise seulement à marée haute',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const low = level('sea-beach');
      const high = highTide(low);
      const door = { col: 184, row: 17 };
      const cave = { col: 154, row: 23 };
      const beacon = { col: 49, row: 12 };
      const secrets = (l: LevelData) =>
        l.entities.filter((e) => e.type === EntityType.Shell).map((e) => [e.col, e.row]);
      expect(secrets(low)).toEqual(
        expect.arrayContaining([
          [cave.col, cave.row],
          [beacon.col, beacon.row],
        ]),
      );
      // La trouvaille de la grotte est sous l'eau à marée haute.
      expect(secrets(high)).not.toContainEqual([cave.col, cave.row]);
      expect(reach(low, standOn(low, door)).has(standOn(low, beacon))).toBe(false);
      expect(reach(high, standOn(high, door)).has(standOn(high, beacon))).toBe(true);
    },
  );

  it('les vagues : seulement à marée haute, sur les rochers', () => {
    expect(wavesOf(level('sea-rocks'))).toBeNull();
    expect(wavesOf(highTide(level('sea-rocks')))).toEqual({ row: 20, dir: 1 });
    expect(wavesOf(highTide(level('sea-beach')))).toBeNull();
  });

  it('les rochers à marée haute : de chaque pierre dans les vagues, un abri à portée pendant l’annonce', () => {
    const high = highTide(level('sea-rocks'));
    const waves = wavesOf(high);
    if (!waves) {
      throw new Error('vagues absentes');
    }
    const line = waves.row * T;
    const surfaces = seaAnalysis(high).map.surfaces;
    const wet = surfaces.filter((s) => s.row * T > line);
    const safe = surfaces.filter((s) => s.row * T <= line);
    expect(wet.length).toBeGreaterThan(0);
    // Ce qu'on parcourt en courant pendant l'annonce (prudent : sans planer ni glisser).
    const reachTiles = ((DEFAULT_COMBAT.waveWarnMs / 1000) * DEFAULT_MOVEMENT.maxRunSpeed) / T;
    for (const s of wet) {
      const nearest = Math.min(
        ...safe.map((o) =>
          o.colEnd < s.colStart
            ? s.colStart - o.colEnd
            : o.colStart > s.colEnd
              ? o.colStart - s.colEnd
              : 0,
        ),
      );
      expect(
        nearest,
        `pierre ligne ${String(s.row)}, col. ${String(s.colStart)}`,
      ).toBeLessThanOrEqual(reachTiles);
    }
  });

  it('une vague repousse vers la terre et la peur monte, une fois ; les pieds au-dessus, rien', () => {
    const rocks = parseAsciiLevel(
      'waves',
      [
        '; @tide: 9 7',
        '; @sea: 1 1 18 8',
        '; @waves: 5 right',
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..........###.....#',
        '#..P.......###.....#',
        '#####......###.....#',
        '#####......###.....#',
        '####################',
      ].join('\n'),
    );
    const high = highTide(rocks);
    const world = new CombatWorld(high, DEFAULT_COMBAT);
    expect(world.waveRow).toBe(5);
    const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
    // Debout sur la berge (pieds à la ligne 6, sous la ligne des vagues 5) : repoussée.
    const player = new PlayerPhysics(high, DEFAULT_MOVEMENT, 3 * T, 6 * T - PLAYER_HITBOX.height);
    const toWave = msToSteps(DEFAULT_COMBAT.wavePeriodMs - DEFAULT_COMBAT.wavePassMs) + 1;
    let events = 0;
    let hits = 0;
    for (let i = 0; i < toWave + msToSteps(DEFAULT_COMBAT.wavePassMs) - 2; i++) {
      player.step(input);
      world.step(player, false);
      events |= world.events;
      if ((world.events & CombatEvent.Hurt) !== 0) {
        hits++;
      }
      if (i === toWave) {
        expect(world.wavePhase).toBe(TrainPhase.Passing);
      }
    }
    expect(events & CombatEvent.Hurt).not.toBe(0);
    expect(hits).toBe(1);
    // Sur le rocher (pieds à la ligne 4, au-dessus de la ligne 5) : rien.
    const world2 = new CombatWorld(high, DEFAULT_COMBAT);
    const safe = new PlayerPhysics(high, DEFAULT_MOVEMENT, 12 * T, 4 * T - PLAYER_HITBOX.height);
    let safeEvents = 0;
    for (let i = 0; i < toWave + 20; i++) {
      safe.step(input);
      world2.step(safe, false);
      safeEvents |= world2.events;
    }
    expect(safeEvents & CombatEvent.Hurt).toBe(0);
    // À marée basse, pas de vagues.
    expect(new CombatWorld(rocks, DEFAULT_COMBAT).waveRow).toBe(-1);
  });
});

describe('la première marée et le banc des marées (D-99)', () => {
  it('la pêche à pied : la maîtresse montre la mer ; dans le noir, la marée monte, la promenade', () => {
    const t = trigger('sea-tide-rises');
    expect(t.room).toBe('sea-beach');
    expect(t.when).toEqual({ all: [F.SeaArrived], none: [F.SeaFirstTide] });
    const order = t.steps.map((s) => s.do);
    const dark = order.indexOf('fadeOut');
    expect(order.indexOf('toggle')).toBeGreaterThan(dark);
    expect(order.indexOf('toggle')).toBeLessThan(order.indexOf('fadeIn'));
    expect(t.steps.find((s) => s.do === 'toggle')).toEqual({ do: 'toggle', id: F.TideHigh });
    expect(t.steps.find((s) => s.do === 'room')).toMatchObject({
      room: 'sea-promenade',
      returnPoint: true,
    });
  });

  it('le banc : après la première marée, rejouable, retourne la marée dans le noir, au sec aux deux marées', () => {
    const found = benches(HOUSE_STORY);
    expect(found.map((b) => b.room)).toEqual(['sea-promenade', 'sea-port']);
    const bench = trigger('sea-bench-promenade');
    expect(bench.repeat).toBe(true);
    expect(bench.when).toEqual({ all: [F.SeaFirstTide] });
    for (const b of found) {
      for (const high of [false, true]) {
        const l = atTide(level(b.room), high);
        expect(standOn(l, b.place), `${b.room} ${String(high)}`).toBeGreaterThanOrEqual(0);
        expect(tileAt(l, b.place.col, b.place.row)).toBe(Tile.Empty);
      }
    }
  });

  it(
    'jamais coincée dans la baie, aux deux marées ; le pied du phare s’atteint aux deux marées',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const graph = tideGraph(zone, HOUSE_STORY, SEA_ROOMS);
      const station = level('sea-station');
      const start = tideNode('sea-station', false, standOn(station, { col: 24, row: 17 }));
      const reached = reachableNodes(graph, start);
      const foot = (high: boolean) =>
        tideNode('sea-rocks', high, standOn(atTide(level('sea-rocks'), high), { col: 8, row: 19 }));
      expect(reached.has(foot(false))).toBe(true);
      expect(reached.has(foot(true))).toBe(true);
      expect(stuckNodes(graph, reached, lanternNodes(zone, SEA_ROOMS))).toEqual([]);
    },
  );
});
