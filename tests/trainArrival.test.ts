import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { phaseMovement } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { CombatWorld } from '../src/core/combat/CombatWorld';
import { EntityType } from '../src/core/level/LevelData';
import { PlayerPhysics } from '../src/core/player/PlayerPhysics';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import { checkCondition } from '../src/core/story/story';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { exitSurface, level, node, phase, reachable, zone, type Node } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const F = StoryFlag;
const P3 = phase(3);
const SEA = 'sea-station';
const TRAIN_CARS = [
  'train-couchettes',
  'train-compartments',
  'train-baggage',
  'train-roof',
  'train-restaurant',
];

/** Étapes vécues jusqu'à un moment du train. */
const BEFORE = [
  F.GrownOlder,
  F.TrainBoarding,
  F.TrainDeparted,
  F.TrainSlide,
  F.TrainNight,
  F.TrainStrange,
  F.TrainStrangeDone,
];
const MORNING = [...BEFORE, F.TrainMorning];
const ARRIVED = [...MORNING, F.TrainArrived];

function director(flags: readonly string[]): StoryDirector {
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
  const story = new StoryDirector(HOUSE_STORY, host);
  story.setFlags(flags);
  return story;
}

const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((c) => c.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};

/** Analyse en phase 3, toutes les capacités (glissade comprise). */
const cache = new Map<string, LevelAnalysis>();
function analysis(room: string): LevelAnalysis {
  let a = cache.get(room);
  if (!a) {
    a = analyzeLevel(level(room), phaseMovement(DEFAULT_MOVEMENT, P3), {
      climb: true,
      wallJump: true,
      glide: true,
      hook: true,
      slide: true,
      hitbox: P3.hitbox,
    });
    cache.set(room, a);
  }
  return a;
}

/** Graphe du voyage : la gare de la mer, les voitures, les quais de la gare de la ville. */
function journey(flags: readonly string[]): Map<Node, Set<Node>> {
  const rooms = [
    SEA,
    'train-couchettes',
    'train-compartments',
    'train-baggage',
    'station-platforms',
  ];
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  const story = director(flags);
  for (const room of rooms) {
    const min = DIFFICULTY_MIN_WINDOW_MS[(level(room).meta.difficulty ?? 'easy') as 'easy'];
    for (const move of analysis(room).moves) {
      if (move.windowMs >= min) {
        edge(node(room, move.from), node(room, move.to));
      }
    }
    for (const exit of [...level(room).exits, ...level(room).doors]) {
      const to = zone.destination(room, exit.id);
      if (to && rooms.includes(to.room) && !story.exitsLocked(room, exit.id)) {
        edge(node(room, exitSurface(room, exit.id)), node(to.room, exitSurface(to.room, to.exit)));
      }
    }
  }
  return graph;
}

describe('le train, PR 6a : le matin, la gare de la mer, le train à quai (D-90)', () => {
  it('au matin : Agir sur sa couchette après la cuisine rose ; la maîtresse, la mer, l’arrêt, Maria, la gare de la mer', () => {
    const t = trigger('train-morning');
    expect(t.room).toBe('train-couchettes');
    expect(t.when).toEqual({ all: [F.TrainStrangeDone], none: [F.TrainMorning] });
    const steps = t.steps;
    const morning = steps.findIndex((s) => s.do === 'flag' && s.id === F.TrainMorning);
    const arrived = steps.findIndex((s) => s.do === 'flag' && s.id === F.TrainArrived);
    const teacher = steps.findIndex((s) => s.do === 'thought' && s.by === 'teacher-morning');
    const maria = steps.findIndex((s) => s.do === 'thought' && s.icon === 'maria' && !s.by);
    const room = steps.findIndex((s) => s.do === 'room');
    expect(morning).toBeGreaterThan(-1);
    expect(steps[morning - 1]).toMatchObject({ do: 'fadeOut' });
    expect(teacher).toBeGreaterThan(morning);
    expect(arrived).toBeGreaterThan(teacher);
    expect(maria).toBeGreaterThan(arrived);
    expect(steps[room]).toMatchObject({ room: SEA, returnPoint: true });
    expect(room).toBeGreaterThan(maria);
  });

  it('le matin rallume les lumières ; à l’arrivée, le train ne roule plus ; de jour', () => {
    const night = director(BEFORE);
    const morning = director(MORNING);
    const arrived = director(ARRIVED);
    expect(night.timeOfDay()).toBe('evening');
    expect(morning.timeOfDay()).toBe('morning');
    expect(arrived.timeOfDay()).toBe('morning');
    for (const room of TRAIN_CARS) {
      expect(night.moving(room), room).toBe(true);
      expect(morning.moving(room), room).toBe(true);
      expect(arrived.moving(room), room).toBe(false);
      expect(morning.dim(room), room).toBe(false);
    }
    expect(night.dim('train-couchettes')).toBe(true);
  });

  it('à quai, sans passagers : personne dans les voitures ; la classe est sur le quai de la gare de la mer', () => {
    const flags = new Set<string>(ARRIVED);
    const shown = HOUSE_STORY.props.filter((p) => checkCondition(flags, p.when));
    expect(shown.filter((p) => TRAIN_CARS.includes(p.room))).toEqual([]);
    const sea = shown.filter((p) => p.room === SEA).map((p) => p.kind);
    expect(sea).toEqual(expect.arrayContaining(['teacher', 'kids-quay', 'quay-train-day']));
    // Le même train, à quai à la gare de la ville.
    expect(shown.some((p) => p.room === 'station-platforms' && p.kind === 'quay-train-day')).toBe(
      true,
    );
    // Le présage du monde étrange ne guide plus.
    expect(director(ARRIVED).omen('train-restaurant', 59 * T, 17 * T)).toBe(0);
  });

  it('la gare de la mer : sur la page de la mer, un quai, une lanterne ; elle s’ouvre sur la promenade (D-98)', () => {
    const sea = level(SEA);
    expect(isStrangeRoom(sea)).toBe(false);
    expect(mapPage(zone, SEA)).toBe('sea');
    expect(sea.exits.map((e) => e.id)).toEqual([2]);
    expect(sea.doors.map((d) => d.id)).toEqual([1]);
    expect(zone.destination(SEA, 1)).toEqual({ room: 'train-couchettes', exit: 2 });
    expect(zone.destination(SEA, 2)).toEqual({ room: 'sea-promenade', exit: 1 });
    expect(zone.destination('train-baggage', 4)).toEqual({ room: 'station-platforms', exit: 4 });
    // La lanterne de la gare de la mer n'a pas bougé (son identifiant dépend de sa position).
    expect(sea.entities.filter((e) => e.type === EntityType.Checkpoint)).toEqual([
      { type: EntityType.Checkpoint, col: 24, row: 17 },
    ]);
  });

  it('les portes du train à quai : cachées et fermées avant l’arrivée, ouvertes ensuite', () => {
    const before = director(BEFORE);
    const after = director(ARRIVED);
    const doors: [string, number][] = [
      ['train-couchettes', 2],
      ['train-baggage', 4],
      ['station-platforms', 4],
    ];
    for (const [room, door] of doors) {
      expect(before.exitsLocked(room, door), `${room}:${String(door)}`).toBe(true);
      expect(before.doorHidden(room, door), `${room}:${String(door)}`).toBe(true);
      expect(after.exitsLocked(room, door), `${room}:${String(door)}`).toBe(false);
    }
    // Avant le train (phase 1 ou 2), le quai de la ville ne montre aucune porte.
    expect(director([]).doorHidden('station-platforms', 4)).toBe(true);
  });

  it('le train arrêté : ni tunnel ni valise qui tombe', () => {
    for (const room of ['train-roof', 'train-compartments']) {
      const data = level(room);
      const combat = new CombatWorld(data, DEFAULT_COMBAT);
      combat.still = true;
      const player = new PlayerPhysics(
        data,
        DEFAULT_MOVEMENT,
        data.spawn.col * T,
        data.spawn.row * T,
      );
      for (let s = 0; s < 120 * 30; s++) {
        combat.step(player, false);
        expect(combat.events, room).toBe(0);
      }
      expect(combat.hazardMs).toBe(0);
    }
  });

  it(
    'le train relie les deux gares : de la gare de la mer aux quais de la ville, et retour',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const sea = node(SEA, exitSurface(SEA, 1));
      const city = node('station-platforms', exitSurface('station-platforms', 4));
      const open = journey(ARRIVED);
      expect(reachable(open, sea).has(city)).toBe(true);
      expect(reachable(open, city).has(sea)).toBe(true);
      // Avant l'arrivée, les portes n'existent pas.
      const closed = journey(MORNING);
      expect(reachable(closed, sea).has(city)).toBe(false);
    },
  );
});
