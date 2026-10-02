import { describe, expect, it } from 'vitest';
import { StoryFlag } from '../src/config/story';
import { STRANGE_THINGS } from '../src/config/memories';
import { EntityType } from '../src/core/level/LevelData';
import { checkCondition } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { isStrangeRoom, isStreetRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  analysis,
  byDifficulty,
  exitSurface,
  level,
  node,
  nodeAt,
  reachable,
  roomDifficulty,
  roomOf,
  storyPassages,
  where,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
const F = StoryFlag;
/** Le portillon du jardin ; la porte de l'école, qui s'ouvre de l'intérieur. */
const OPEN = [F.GateOpen, F.SchoolOpen];
const easy = byDifficulty('easy');
const medium = byDifficulty('medium');
const hard = byDifficulty('hard');
const home = () => node(zone.start, analysis(zone.start, false).start);
const at = (room: string, exit: number) => node(room, exitSurface(room, exit));
const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((candidate) => candidate.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};
const prop = (id: string) => HOUSE_STORY.props.find((p) => p.id === id);

/** Graphe restreint à quelques salles (avec ou sans le parapluie). */
function within(
  rooms: readonly string[],
  rule: Parameters<typeof zoneGraph>[1],
  glide = false,
  flags: readonly string[] = OPEN,
): Map<Node, Set<Node>> {
  const inside = (n: Node) => rooms.includes(roomOf(n));
  const result = new Map<Node, Set<Node>>();
  for (const [from, next] of zoneGraph(true, rule, 2, true, flags, glide)) {
    if (inside(from)) {
      result.set(from, new Set([...next].filter(inside)));
    }
  }
  return result;
}
/** Surfaces de la zone d'un déclencheur (et la ligne du dessous). */
function areaNodes(id: string): Node[] {
  const t = trigger(id);
  const area = t.area;
  if (!area) {
    throw new Error(`${id} sans zone`);
  }
  const nodes = new Set<Node>();
  for (let row = area.row; row <= area.row + area.h; row++) {
    for (let col = area.col; col < area.col + area.w; col++) {
      const n = nodeAt(t.room, col, row);
      if (!n.endsWith('#-1')) {
        nodes.add(n);
      }
    }
  }
  return [...nodes];
}

describe('l’école et son monde étrange (D-64)', () => {
  it('la cour derrière le grillage de l’aire de jeux ; l’école entre la cour et la rue', () => {
    expect(zone.destination('playground', 2)).toEqual({ room: 'schoolyard', exit: 1 });
    expect(zone.destination('schoolyard', 2)).toEqual({ room: 'school', exit: 2 });
    expect(zone.destination('street', 5)).toEqual({ room: 'school', exit: 1 });
    for (const room of ['schoolyard', 'school']) {
      expect(isStreetRoom(level(room)), room).toBe(true);
      expect(mapPage(zone, room), room).toBe('street');
    }
    expect(level('school').meta.indoor).toBe('yes');
    expect(isStrangeRoom(level('school-strange'))).toBe(true);
    expect(zone.map['school-strange']).toBeUndefined();
    expect(level('school-strange').meta.music).toBe('street-strange');
  });

  it(
    'la cour : seulement avec le parapluie, en planant depuis l’aire de jeux',
    { timeout: TIMEOUT },
    () => {
      const from = at('playground', 1);
      const yard = at('schoolyard', 1);
      expect(reachable(within(['playground', 'schoolyard'], null), from).has(yard)).toBe(false);
      expect(reachable(within(['playground', 'schoolyard'], easy, true), from).has(yard)).toBe(
        true,
      );
    },
  );

  it('le panier de basket : moyen exactement, avec le parapluie', { timeout: TIMEOUT }, () => {
    const secret = level('schoolyard').entities.find((e) => e.type === EntityType.Secret);
    if (!secret) {
      throw new Error('trouvaille absente');
    }
    const target = nodeAt('schoolyard', secret.col, secret.row);
    const from = at('schoolyard', 1);
    expect(reachable(within(['schoolyard'], medium, true), from).has(target)).toBe(true);
    expect(reachable(within(['schoolyard'], easy, true), from).has(target), 'facile').toBe(false);
  });

  it(
    'la porte de l’école ne s’ouvre que de l’intérieur, facilement depuis la cour',
    { timeout: TIMEOUT },
    () => {
      for (const [room, exit] of [
        ['street', 5],
        ['school', 1],
      ] as const) {
        const lock = HOUSE_STORY.lockedRooms.find((l) => l.room === room && l.exit === exit);
        expect(lock && checkCondition(new Set(), lock.when), `${room}:${String(exit)}`).toBe(true);
        expect(lock && checkCondition(new Set([F.SchoolOpen]), lock.when)).toBe(false);
      }
      const door = trigger('school-door');
      expect(door.steps.some((s) => s.do === 'flag' && s.id === F.SchoolOpen)).toBe(true);
      const closed = within(['schoolyard', 'school', 'street'], easy, true, [F.GateOpen]);
      const seen = reachable(closed, at('schoolyard', 1));
      expect(
        areaNodes('school-door').some((n) => seen.has(n)),
        'poignée',
      ).toBe(true);
      expect(seen.has(at('street', 5)), 'fermée').toBe(false);
      const open = within(['schoolyard', 'school', 'street'], easy, true);
      expect(reachable(open, at('schoolyard', 1)).has(at('street', 5)), 'ouverte').toBe(true);
    },
  );

  it(
    'dans l’école, les étagères jusqu’à l’oculus : faciles ; il ouvre le monde étrange',
    { timeout: TIMEOUT },
    () => {
      const seen = reachable(within(['school'], easy), at('school', 2));
      expect(areaNodes('school-enter').some((n) => seen.has(n))).toBe(true);
      const arrival = storyPassages().filter(([from]) => roomOf(from) === 'school');
      expect(arrival.length).toBeGreaterThan(0);
      expect(arrival.every(([, to]) => roomOf(to) === 'school-strange')).toBe(true);
      expect(HOUSE_STORY.omens.some((o) => o.room === 'school')).toBe(true);
    },
  );

  it(
    'le monde étrange de l’école : un plané jusqu’à la règle, moyen jusqu’à la lanterne des tables, difficile ensuite jusqu’à la boîte',
    { timeout: TIMEOUT },
    () => {
      const [start] = storyPassages()
        .filter(([from]) => roomOf(from) === 'school')
        .map(([, to]) => to);
      if (!start) {
        throw new Error('arrivée absente');
      }
      const lamps = level('school-strange').entities.filter(
        (e) => e.type === EntityType.Checkpoint,
      );
      // La lanterne au bout des tables (D-64), au pied de la cheminée des piles de livres.
      const first = lamps.find((l) => l.col > 30 && l.col < 45 && l.row > 20);
      if (!first) {
        throw new Error('lanterne des tables absente');
      }
      const lamp = nodeAt('school-strange', first.col, first.row);
      const box = areaNodes('school-box');
      const reaches = (rule: Parameters<typeof zoneGraph>[1], glide: boolean, from: Node) =>
        reachable(within(['school-strange'], rule, glide), from);
      expect(reaches(medium, true, start).has(lamp)).toBe(true);
      expect(reaches(easy, true, start).has(lamp), 'lanterne trop facile').toBe(false);
      expect(box.some((n) => reaches(hard, true, lamp).has(n))).toBe(true);
      expect(
        box.some((n) => reaches(medium, true, lamp).has(n)),
        'trop facile',
      ).toBe(false);
      expect(
        box.some((n) => reaches(null, false, start).has(n)),
        'sans parapluie',
      ).toBe(false);
      // La section ajoutée (D-70) : de l'arrivée, un long plané jusqu'à la règle et sa veilleuse.
      const ruler = lamps.find((l) => l.col > 45);
      if (!ruler) {
        throw new Error('veilleuse de la règle absente');
      }
      const rulerLamp = nodeAt('school-strange', ruler.col, ruler.row);
      expect(reaches(easy, true, start).has(rulerLamp)).toBe(true);
      expect(reaches(null, false, start).has(rulerLamp), 'règle sans parapluie').toBe(false);
    },
  );

  it('la boîte à formes : un souvenir du monde étrange, qui y reste ; Maria n’y est pas', () => {
    expect(STRANGE_THINGS).toContain('shape-box');
    const box = trigger('school-box');
    expect(box.steps.some((s) => s.do === 'memory' && s.id === 'shape-box')).toBe(true);
    expect(prop('shape-box')?.when).toEqual({});
    expect(prop('shape-box')?.room).toBe('school-strange');
    const shown = HOUSE_STORY.props.filter((p) => p.room === 'school-strange');
    expect(shown.some((p) => p.kind.startsWith('maria'))).toBe(false);
    const rooms = box.steps.flatMap((s) => (s.do === 'room' ? [s] : []));
    expect(rooms.map((s) => s.room)).toEqual(['schoolyard', 'bedroom']);
    expect(rooms.every((s) => s.returnPoint)).toBe(true);
    expect(box.steps.some((s) => s.do === 'flag' && s.id === F.SchoolDone)).toBe(true);
  });

  it('le soir : crépuscule, maman dans la cour, la grue par la fenêtre ; puis le lendemain', () => {
    const noop = () => undefined;
    const d = new StoryDirector(
      HOUSE_STORY,
      {
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
      },
      100,
    );
    const before = [F.Grown, F.Slept, F.GateOpen, F.SchoolOpen, F.SchoolStrange];
    d.setFlags(before);
    expect(d.timeOfDay()).toBe('morning');
    d.setFlags([...before, F.SchoolDone]);
    expect(d.timeOfDay()).toBe('evening');
    const evening = new Set<string>([...before, F.SchoolDone]);
    const visible = (id: string, flags: ReadonlySet<string>) => {
      const p = prop(id);
      return p ? checkCondition(flags, p.when) : false;
    };
    expect(visible('mom-yard', evening)).toBe(true);
    expect(visible('far-crane', evening)).toBe(true);
    expect(visible('site-gap', evening)).toBe(false);
    const bedroom = HOUSE_STORY.lockedRooms.find((l) => l.room === 'bedroom' && l.icon === 'bed');
    expect(bedroom && checkCondition(evening, bedroom.when), 'au lit').toBe(true);
    const night = trigger('street-night');
    expect(night.room).toBe('bedroom');
    expect(night.steps.some((s) => s.do === 'flag' && s.id === F.StreetMorning)).toBe(true);
    const morning = new Set<string>([...evening, F.StreetMorning]);
    d.setFlags([...morning]);
    expect(d.timeOfDay()).toBe('morning');
    expect(visible('mom-yard', morning)).toBe(false);
    expect(visible('far-crane', morning)).toBe(false);
    expect(visible('site-gap', morning)).toBe(true);
    expect(bedroom && checkCondition(morning, bedroom.when)).toBe(false);
    // Des signes ramènent au chantier : la grue montrée par maman, la palissade ouverte.
    // La palissade (porte de façade 6) s'ouvre ce matin-là : la gare (D-66).
    const palisade = HOUSE_STORY.lockedRooms.find((l) => l.room === 'street' && l.exit === 6);
    expect(palisade?.when.none).toEqual([F.StreetMorning]);
    expect(
      HOUSE_STORY.omens.some((o) => o.room === 'street' && o.when.all?.includes(F.StreetMorning)),
    ).toBe(true);
    expect(
      trigger('street-mom-crane').steps.some((s) => s.do === 'thought' && s.icon === 'crane'),
    ).toBe(true);
  });

  it(
    'ne coince jamais Céleste, avec ou sans le parapluie : la maison reste atteignable',
    { timeout: TIMEOUT },
    () => {
      for (const glide of [false, true]) {
        // La porte de l'école ne s'ouvre que de l'intérieur, où l'on n'entre qu'en planant.
        const flags = glide ? OPEN : [F.GateOpen];
        const safe = zoneGraph(true, roomDifficulty, 2, true, flags, glide);
        const all = reachable(zoneGraph(true, null, 2, true, flags, glide), at('playground', 1));
        const stuck = [...all].filter((n) => !reachable(safe, n).has(home()));
        expect(where(stuck, true), `sans retour (parapluie : ${String(glide)})`).toEqual([]);
      }
    },
  );
});
