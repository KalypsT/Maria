import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { phaseMovement } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { STRANGE_THINGS, flashbackOf } from '../src/config/memories';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { EntityType, type TilePos } from '../src/core/level/LevelData';
import { checkCondition } from '../src/core/story/story';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { chaseRun } from './pace';
import {
  exitSurface,
  level,
  node,
  nodeAt,
  phase,
  reachable,
  storyPassages,
  zone,
  type Node,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
const F = StoryFlag;
const KITCHEN = 'train-strange-kitchen';
const DISHES = 'train-strange-dishes';
const P3 = phase(3);
const easy = DIFFICULTY_MIN_WINDOW_MS.easy;
const medium = DIFFICULTY_MIN_WINDOW_MS.medium;

/** Analyse en phase 3 (le train), avec toutes les capacités, la glissade ou le crochet en option. */
const cache = new Map<string, LevelAnalysis>();
function analysis(room: string, slide = true, hook = true): LevelAnalysis {
  const key = `${room}:${String(slide)}:${String(hook)}`;
  let a = cache.get(key);
  if (!a) {
    a = analyzeLevel(level(room), phaseMovement(DEFAULT_MOVEMENT, P3), {
      climb: true,
      wallJump: true,
      glide: true,
      hook,
      slide,
      hitbox: P3.hitbox,
    });
    cache.set(key, a);
  }
  return a;
}

/** Graphe des deux salles étranges du train ; `rule` : fenêtre minimale par salle (null : toutes). */
function strange(
  rule: ((room: string) => number) | null,
  slide = true,
  hook = true,
): Map<Node, Set<Node>> {
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  for (const room of [KITCHEN, DISHES]) {
    const min = rule ? rule(room) : 0;
    for (const move of analysis(room, slide, hook).moves) {
      if (move.windowMs >= min) {
        edge(node(room, move.from), node(room, move.to));
      }
    }
  }
  edge(node(KITCHEN, exitSurface(KITCHEN, 1)), node(DISHES, exitSurface(DISHES, 1)));
  edge(node(DISHES, exitSurface(DISHES, 1)), node(KITCHEN, exitSurface(KITCHEN, 1)));
  return graph;
}
const fixed = (ms: number) => () => ms;
const declared = (room: string) =>
  DIFFICULTY_MIN_WINDOW_MS[(level(room).meta.difficulty ?? 'easy') as 'easy'];

const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((c) => c.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};
const arrival = () => nodeAt(KITCHEN, 3, 23);
const kitchenLamp = () => {
  const e = level(KITCHEN).entities.find((c) => c.type === EntityType.Checkpoint);
  if (!e) {
    throw new Error('veilleuse absente');
  }
  return nodeAt(KITCHEN, e.col, e.row);
};
const PINK = { col: 120, row: 11 };
const pinkNode = () => nodeAt(DISHES, PINK.col, PINK.row);

describe('le monde étrange du train (D-88)', () => {
  it('on y entre par la porte de la cuisine du wagon-restaurant ; hors de la carte ; sa musique', () => {
    for (const room of [KITCHEN, DISHES]) {
      expect(isStrangeRoom(level(room)), room).toBe(true);
      expect(level(room).meta.music, room).toBe('train-strange');
      expect(mapPage(zone, room), room).toBeNull();
    }
    expect(zone.destination(KITCHEN, 1)).toEqual({ room: DISHES, exit: 1 });
    const passages = storyPassages().filter(([, to]) => to.startsWith(`${KITCHEN}#`));
    expect(passages.length).toBeGreaterThan(0);
    expect(passages.every(([from]) => from.startsWith('train-restaurant#'))).toBe(true);
    // Le déclencheur provisoire de la PR 3 est remplacé.
    expect(HOUSE_STORY.triggers.some((t) => t.id === 'train-kitchen')).toBe(false);
    expect(trigger('train-strange-enter').when).toEqual({
      all: [F.TrainNight],
      none: [F.TrainStrange],
    });
    expect(trigger('train-strange-reenter').when).toEqual({
      all: [F.TrainStrange],
      none: [F.TrainStrangeDone],
    });
    // La lueur guide jusqu'à la cuisine, puis s'arrête une fois la cuisine rose trouvée.
    const door = HOUSE_STORY.omens.find((o) => o.room === 'train-restaurant');
    const night = new Set<string>([F.TrainNight]);
    expect(door && checkCondition(night, door.when)).toBe(true);
    expect(door && checkCondition(new Set([...night, F.TrainStrangeDone]), door.when)).toBe(false);
  });

  it(
    'la cuisine étrange : moyenne jusqu’à la veilleuse, la glissade exigée ; la sortie seulement avec le crochet',
    { timeout: TIMEOUT },
    () => {
      expect(level(KITCHEN).meta.difficulty).toBe('medium');
      expect(reachable(strange(fixed(medium)), arrival()).has(kitchenLamp())).toBe(true);
      expect(reachable(strange(fixed(easy)), arrival()).has(kitchenLamp()), 'trop facile').toBe(
        false,
      );
      expect(reachable(strange(null, false), arrival()).has(kitchenLamp()), 'sans glissade').toBe(
        false,
      );
      const exit = node(KITCHEN, exitSurface(KITCHEN, 1));
      expect(reachable(strange(fixed(medium)), kitchenLamp()).has(exit)).toBe(true);
      expect(reachable(strange(null, true, false), kitchenLamp()).has(exit), 'sans crochet').toBe(
        false,
      );
    },
  );

  it(
    'le train de la vaisselle : la poursuite horizontale (D-87) jusqu’à la cuisine rose ; facile en statique, la glissade exigée',
    { timeout: TIMEOUT },
    () => {
      const chase = level(DISHES).chase;
      expect(chase?.dir).toBe('right');
      expect(chase?.end).toBeLessThan(PINK.col);
      const entrance = node(DISHES, exitSurface(DISHES, 1));
      expect(reachable(strange(fixed(easy)), entrance).has(pinkNode())).toBe(true);
      expect(reachable(strange(null, false), entrance).has(pinkNode()), 'sans glissade').toBe(
        false,
      );
    },
  );

  it(
    'le rythme (phase 3) : chaque tronçon prend 40 à 80 % du temps du chariot ; parfait, jamais touché ; 50 % plus lent, touché',
    { timeout: TIMEOUT },
    () => {
      const room = level(DISHES);
      const a = analysis(DISHES);
      const run = phaseMovement(DEFAULT_MOVEMENT, P3).maxRunSpeed;
      const speed = room.chase?.phases[0]?.speed ?? 0;
      const entry: TilePos = { col: 2, row: 11 };
      const goal: TilePos = { col: 118, row: 11 };
      const lamps = room.entities.filter((e) => e.type === EntityType.Checkpoint && e.col > 10);
      const stops: TilePos[] = [entry, ...lamps, goal];
      for (let i = 0; i + 1 < stops.length; i++) {
        const from = stops[i] ?? entry;
        const to = stops[i + 1] ?? goal;
        const label = `colonnes ${String(from.col)} à ${String(to.col)}`;
        const perfect = chaseRun(room, a, from, to, easy, 1, DEFAULT_COMBAT, P3.hitbox, run);
        const chaserMs =
          DEFAULT_COMBAT.chaseSideStartDelayMs +
          ((DEFAULT_COMBAT.chaseSideRestartGapTiles + to.col - from.col) / speed) * 1000;
        const ratio = perfect.timeMs / chaserMs;
        expect(ratio, label).toBeGreaterThanOrEqual(0.4);
        expect(ratio, label).toBeLessThanOrEqual(0.8);
        expect(perfect.contacts, label).toBe(0);
        expect(perfect.margin, label).toBeGreaterThan(2);
      }
      const slow = chaseRun(room, a, entry, goal, easy, 1.5, DEFAULT_COMBAT, P3.hitbox, run);
      expect(slow.contacts).toBeGreaterThan(0);
    },
  );

  it('la cuisine rose : on la regarde sans la prendre ; un souvenir du « Monde étrange » ; la fin sur la couchette', () => {
    const t = trigger('train-pink-kitchen');
    expect(t.room).toBe(DISHES);
    expect(t.when).toEqual({ all: [F.TrainStrange], none: [F.TrainStrangeDone] });
    expect(t.steps.some((s) => s.do === 'memory' && s.id === 'pink-kitchen')).toBe(true);
    expect(STRANGE_THINGS).toContain('pink-kitchen');
    // Pas de court souvenir : le souvenir jouable (D-89), joué dans le noir, avant la fin.
    expect(flashbackOf('pink-kitchen')).toBeNull();
    const play = t.steps.findIndex((s) => s.do === 'play');
    expect(play).toBeGreaterThan(-1);
    expect(t.steps[play - 1]).toMatchObject({ do: 'fadeOut' });
    const prop = HOUSE_STORY.props.find((p) => p.id === 'pink-kitchen');
    expect(prop).toMatchObject({ room: DISHES, kind: 'pink-kitchen', ...PINK });
    // Maria n'est pas dans ce monde étrange (pilier 5).
    expect(
      HOUSE_STORY.props.filter(
        (p) => p.room.startsWith('train-strange') && p.kind.startsWith('maria'),
      ),
    ).toEqual([]);
    // La fin : sur sa couchette, la nuit, avec un point de retour ; Céleste pense à Maria (D-70).
    const room = t.steps.find((s) => s.do === 'room');
    expect(room).toMatchObject({ room: 'train-couchettes', returnPoint: true });
    expect(t.steps.some((s) => s.do === 'thought' && s.icon === 'maria' && !s.by)).toBe(true);
    const done = t.steps.findIndex((s) => s.do === 'flag' && s.id === F.TrainStrangeDone);
    const moved = t.steps.findIndex((s) => s.do === 'room');
    expect(done).toBeGreaterThan(play);
    expect(done).toBeLessThan(moved);
  });

  it(
    'ne coince jamais Céleste : de partout, la cuisine rose reste atteignable (pas de sortie volontaire)',
    { timeout: TIMEOUT },
    () => {
      const safe = strange(declared);
      const all = reachable(strange(null), arrival());
      expect(all.has(pinkNode())).toBe(true);
      const stuck = [...all].filter((n) => !reachable(safe, n).has(pinkNode()));
      expect(stuck).toEqual([]);
    },
  );
});
