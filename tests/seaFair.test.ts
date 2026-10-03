import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT, TrainPhase } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, msToSteps } from '../src/config/movement';
import { StoryFlag as F } from '../src/config/story';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { atTide } from '../src/core/level/tide';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  lanternNodes,
  reachableNodes,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** La station balnéaire, PR 5 (D-101) : la jetée, la fête foraine, le soir, les chaises volantes. */
const BAY = [
  'sea-station',
  'sea-promenade',
  'sea-centre',
  'sea-beach',
  'sea-rocks',
  'sea-lighthouse',
  'sea-port',
  'sea-jetty',
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
const DAY = [F.TrainMorning, F.TrainArrived, F.SeaArrived, F.SeaFirstTide];

describe('la jetée et la fête foraine, le soir (D-101)', () => {
  it('l’arche de la jetée s’ouvre le soir ; la baie passe au soir', () => {
    expect(zone.destination('sea-port', 3)).toEqual({ room: 'sea-jetty', exit: 1 });
    expect(director([...DAY, F.SeaSawCarousel]).exitsLocked('sea-port', 3)).toBe(true);
    expect(director([...DAY, F.SeaSawCarousel, F.SeaEvening]).exitsLocked('sea-port', 3)).toBe(
      false,
    );
    expect(director(DAY).timeOfDay()).toBe('morning');
    expect(director([...DAY, F.SeaSawCarousel, F.SeaEvening]).timeOfDay()).toBe('evening');
  });

  it('le soir vient quand Céleste a vu le carrousel : la maîtresse, le noir, la jetée', () => {
    const t = HOUSE_STORY.triggers.find((c) => c.id === 'sea-evening');
    expect(t?.when).toEqual({ all: [F.SeaSawCarousel], none: [F.SeaEvening] });
    const order = t?.steps.map((s) => s.do) ?? [];
    expect(order.indexOf('flag')).toBeGreaterThan(order.indexOf('fadeOut'));
    expect(t?.steps.find((s) => s.do === 'room')).toMatchObject({
      room: 'sea-jetty',
      returnPoint: true,
    });
    // Avant d'avoir vu le carrousel, la maîtresse montre seulement le soleil.
    const day = HOUSE_STORY.triggers.find((c) => c.id === 'sea-teacher-promenade');
    expect(day?.when).toEqual({ all: [F.SeaFirstTide], none: [F.SeaSawCarousel] });
  });

  it('les chaises volantes : elles renversent une fois par passage ; couchée, on passe dessous', () => {
    const fair = parseAsciiLevel(
      'fair',
      [
        '; @sweep: 4 2 8 3',
        '################',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#.P............#',
        '################',
      ].join('\n'),
    );
    const world = new CombatWorld(fair, DEFAULT_COMBAT);
    expect(world.sweeps).toHaveLength(1);
    const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
    const standing = new PlayerPhysics(fair, DEFAULT_MOVEMENT, 6 * T, 6 * T - PLAYER_HITBOX.height);
    const toPass = msToSteps(DEFAULT_COMBAT.sweepPeriodMs - DEFAULT_COMBAT.sweepPassMs) + 1;
    let hits = 0;
    for (let i = 0; i < toPass + msToSteps(DEFAULT_COMBAT.sweepPassMs) - 2; i++) {
      standing.step(input);
      world.step(standing, false);
      if ((world.events & CombatEvent.Hurt) !== 0) {
        hits++;
      }
      if (i === toPass) {
        expect(world.sweepPhase).toBe(TrainPhase.Passing);
      }
    }
    expect(hits).toBe(1);
    // Couchée : la hitbox de la glissade est sous la zone (son bas est au-dessus des pieds).
    const zoneBottom = (2 + 3) * T;
    const floor = 6 * T;
    expect(floor - DEFAULT_MOVEMENT.slideHeightPx).toBeGreaterThanOrEqual(zoneBottom);
  });

  it('la jetée : le chemin passe sous le comptoir des stands, la zone des chaises, sous le toit bas', () => {
    const jetty = level('sea-jetty');
    expect(jetty.sweeps).toHaveLength(1);
    const sweep = jetty.sweeps[0];
    // Couchée sur le platelage (ligne 16), on passe sous les chaises.
    expect(16 * T - DEFAULT_MOVEMENT.slideHeightPx).toBeGreaterThanOrEqual(
      ((sweep?.row ?? 0) + (sweep?.height ?? 0)) * T,
    );
    // Le carrousel mène au monde étrange (D-102).
    const carousel = HOUSE_STORY.triggers.find((c) => c.id === 'sea-strange-enter');
    expect(carousel?.room).toBe('sea-jetty');
    expect(HOUSE_STORY.omens.some((o) => o.room === 'sea-jetty')).toBe(true);
  });

  it(
    'toute la baie avec la jetée, aux deux marées : jamais coincée ; le carrousel atteint',
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
        const carousel = tideNode(
          'sea-jetty',
          high,
          standOn(atTide(level('sea-jetty'), high), { col: 21, row: 15 }),
        );
        expect(reached.has(carousel), `carrousel ${String(high)}`).toBe(true);
      }
      expect(stuckNodes(graph, reached, lanternNodes(zone, BAY))).toEqual([]);
    },
  );
});
