import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COMBAT,
  TRAIN_GUST_TILES,
  TrainPhase,
  trainLeft,
  trainPhase,
} from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { EntityType } from '../src/core/level/LevelData';
import { PlayerPhysics } from '../src/core/player/PlayerPhysics';
import { checkCondition } from '../src/core/story/story';
import { isStreetRoom, mapPage } from '../src/core/world/zone';
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
  where,
  zone,
  type Node,
  type WindowRule,
} from './zoneGraph';

const TIMEOUT = 600_000;
const F = StoryFlag;
const ROOMS = [
  'station-tracks',
  'station-platforms',
  'station-hall',
  'station-lost',
  'station-depot',
] as const;
const easy = byDifficulty('easy');
const medium = byDifficulty('medium');
const hard = byDifficulty('hard');
const at = (room: string, exit: number) => node(room, exitSurface(room, exit));
const entrance = () => at('station-tracks', 1);

/**
 * Graphe de la gare seule (D-66), Céleste grandie, avec l'escalade, le saut mural et le
 * parapluie (tout ce qu'elle a en arrivant), et le crochet en option. Seules les salles de la
 * gare sont analysées (coût des tests).
 */
function station(rule: WindowRule, hook = false): Map<Node, Set<Node>> {
  const graph = new Map<Node, Set<Node>>();
  const edge = (from: Node, to: Node) => {
    const set = graph.get(from) ?? new Set<Node>();
    set.add(to);
    graph.set(from, set);
  };
  for (const room of ROOMS) {
    const min = rule ? rule(room) : 0;
    for (const move of analysis(room, true, 2, true, true, hook).moves) {
      if (move.windowMs >= min) {
        edge(node(room, move.from), node(room, move.to));
      }
    }
    const data = level(room);
    for (const exit of [...data.exits, ...data.doors]) {
      const to = zone.destination(room, exit.id);
      if (to && (ROOMS as readonly string[]).includes(to.room)) {
        edge(node(room, exitSurface(room, exit.id)), node(to.room, exitSurface(to.room, to.exit)));
      }
    }
  }
  return graph;
}

function entity(room: string, type: EntityType, col?: number): Node {
  const e = level(room).entities.find(
    (c) => c.type === type && (col === undefined || c.col === col),
  );
  if (!e) {
    throw new Error(`aucun ${type} dans ${room}`);
  }
  return nodeAt(room, e.col, e.row);
}
const hookItem = () => entity('station-lost', EntityType.Ability);

describe('la gare (D-66)', () => {
  it('la porte de la palissade mène aux voies ; la gare a sa page du cahier et sa musique', () => {
    expect(zone.destination('street', 6)).toEqual({ room: 'station-tracks', exit: 1 });
    expect(zone.destination('station-tracks', 2)).toEqual({ room: 'station-platforms', exit: 1 });
    expect(zone.destination('station-platforms', 2)).toEqual({ room: 'station-hall', exit: 1 });
    expect(zone.destination('station-platforms', 3)).toEqual({ room: 'station-hall', exit: 3 });
    expect(zone.destination('station-hall', 4)).toEqual({ room: 'station-lost', exit: 1 });
    expect(zone.destination('station-hall', 2)).toEqual({ room: 'station-depot', exit: 1 });
    for (const room of ROOMS) {
      expect(isStreetRoom(level(room)), room).toBe(true);
      expect(mapPage(zone, room), room).toBe('station');
      expect(level(room).meta.music, room).toBe('station');
    }
    expect(level('station-lost').meta.ability).toBe('hook');
  });

  it('la palissade est fermée jusqu’au lendemain de l’école, ouverte ensuite', () => {
    const lock = HOUSE_STORY.lockedRooms.find((l) => l.room === 'street' && l.exit === 6);
    if (!lock) {
      throw new Error('palissade sans verrou');
    }
    expect(checkCondition(new Set([F.SchoolDone]), lock.when)).toBe(true);
    expect(checkCondition(new Set([F.SchoolDone, F.StreetMorning]), lock.when)).toBe(false);
    expect(HOUSE_STORY.triggers.some((t) => t.id.startsWith('street-site'))).toBe(false);
    const arrived = HOUSE_STORY.triggers.find((t) => t.id === 'station-arrived');
    expect(arrived?.steps.some((s) => s.do === 'thought' && s.icon === 'maria')).toBe(true);
  });

  describe('les trains : un danger simple (souffle)', () => {
    const P = DEFAULT_COMBAT;

    it('calme, puis le feu, puis le passage, en boucle', () => {
      const calm = P.trainPeriodMs - P.trainWarnMs - P.trainPassMs;
      expect(trainPhase(0, 0, P)).toBe(TrainPhase.Calm);
      expect(trainPhase(calm - 1, 0, P)).toBe(TrainPhase.Calm);
      expect(trainPhase(calm + 1, 0, P)).toBe(TrainPhase.Warning);
      expect(trainPhase(calm + P.trainWarnMs + 1, 0, P)).toBe(TrainPhase.Passing);
      expect(trainPhase(P.trainPeriodMs + 1, 0, P)).toBe(TrainPhase.Calm);
      // Assez de calme pour traverser une voie, et le feu prévient assez tôt.
      expect(calm).toBeGreaterThanOrEqual(4000);
      expect(P.trainWarnMs).toBeGreaterThanOrEqual(1500);
    });

    it('le train traverse toute la salle, d’un bord à l’autre', () => {
      const width = 90 * T;
      expect(trainLeft(0, width, 1)).toBeLessThan(-T);
      expect(trainLeft(1, width, 1)).toBeGreaterThanOrEqual(width);
      expect(trainLeft(0, width, -1)).toBeGreaterThanOrEqual(width);
      expect(trainLeft(1, width, -1) + 27 * T).toBeLessThanOrEqual(0);
    });

    it('chaque voie a un feu, et les quais sont hors du souffle', () => {
      for (const room of ['station-tracks', 'station-platforms']) {
        const data = level(room);
        expect(data.trains.length, room).toBe(1);
        expect(
          data.decor.some((d) => d.kind === 'signal'),
          room,
        ).toBe(true);
        const rails = data.trains[0]?.row ?? 0;
        // Un quai fait au moins la hauteur du souffle : debout dessus, on n'est pas sur la voie.
        const surfaces = analysis(room, false, 2).map.surfaces;
        const onTrack = surfaces.filter((s) => s.row > rails - TRAIN_GUST_TILES && s.row <= rails);
        expect(
          onTrack.every((s) => s.row === rails),
          `${room} : rien entre le quai et la voie`,
        ).toBe(true);
      }
    });

    it('sur la voie, le train qui passe repousse Céleste une fois, et la peur monte ; sur le quai, rien', () => {
      const room = level('station-tracks');
      const rails = room.trains[0]?.row ?? 0;
      const run = (col: number, row: number) => {
        const player = new PlayerPhysics(room, DEFAULT_MOVEMENT, col * T, row * T - 22);
        const combat = new CombatWorld(room, P);
        let hurt = 0;
        for (let s = 0; s < (P.trainPeriodMs / 1000) * 120; s++) {
          player.step({ moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false });
          combat.step(player, false);
          if (combat.events & CombatEvent.Hurt) {
            hurt++;
            expect(player.vx * (room.trains[0]?.dir ?? 0)).toBeGreaterThan(0);
          }
        }
        return hurt;
      };
      expect(run(22, rails), 'sur la voie').toBe(1);
      expect(run(8, 25), 'sur le quai').toBe(0);
    });
  });

  it(
    'le crochet : moyen exactement depuis la palissade (le chemin du niveau)',
    { timeout: TIMEOUT },
    () => {
      expect(reachable(station(medium), entrance()).has(hookItem())).toBe(true);
      expect(reachable(station(easy), entrance()).has(hookItem()), 'trop facile').toBe(false);
    },
  );

  it('le haut des casiers (la lueur) s’atteint depuis le crochet', { timeout: TIMEOUT }, () => {
    const lockers = HOUSE_STORY.triggers.find((t) => t.id === 'station-lockers')?.area;
    if (!lockers) {
      throw new Error('casiers sans zone');
    }
    const top = nodeAt('station-lost', lockers.col + 1, lockers.row + lockers.h - 1);
    expect(reachable(station(medium), hookItem()).has(top)).toBe(true);
  });

  it(
    'les trouvailles : le portique (moyen), le pilier (difficile), les crochets du dépôt (moyen)',
    { timeout: TIMEOUT },
    () => {
      const cases = [
        { room: 'station-tracks', col: 58, rule: medium, easier: easy },
        { room: 'station-platforms', col: 6, rule: hard, easier: medium },
        { room: 'station-depot', col: 73, rule: medium, easier: easy },
      ];
      for (const { room, col, rule, easier } of cases) {
        const target = entity(room, EntityType.Secret, col);
        expect(reachable(station(rule), entrance()).has(target), room).toBe(true);
        expect(reachable(station(easier), entrance()).has(target), `${room} trop facile`).toBe(
          false,
        );
      }
    },
  );

  it(
    'avec le crochet seulement : le toit du poste d’aiguillage et le rebord du hall',
    { timeout: TIMEOUT },
    () => {
      const cases = [
        { room: 'station-tracks', col: 84 },
        { room: 'station-hall', col: 67 },
      ];
      for (const { room, col } of cases) {
        const target = entity(room, EntityType.Secret, col);
        expect(reachable(station(null), entrance()).has(target), `${room} sans crochet`).toBe(
          false,
        );
        expect(reachable(station(medium, true), hookItem()).has(target), room).toBe(true);
      }
    },
  );

  it(
    'ne coince jamais Céleste, avec ou sans le crochet : la palissade reste atteignable',
    { timeout: TIMEOUT },
    () => {
      for (const hook of [false, true]) {
        const safe = station(roomDifficulty, hook);
        const all = reachable(station(null, hook), entrance());
        const stuck = [...all].filter((n) => !reachable(safe, n).has(entrance()));
        expect(where(stuck, true), `sans retour (crochet : ${String(hook)})`).toEqual([]);
      }
    },
  );

  it(
    'revisites avec le crochet : la jardinière de la terrasse, le nid du platane de la rue',
    { timeout: TIMEOUT },
    () => {
      const cases = [
        // Du toit de la pergola (par l'allée), le fil à linge à poulie jusqu'à la fenêtre.
        { room: 'garden-terrace', col: 2, from: nodeAt('garden-terrace', 40, 8) },
        // De la corniche de l'école, le fil tendu jusqu'au platane.
        { room: 'street', col: 20, from: nodeAt('street', 100, 7) },
      ];
      for (const { room, col, from } of cases) {
        const target = entity(room, EntityType.Secret, col);
        const graph = (rule: WindowRule, hook: boolean) => {
          const g = new Map<Node, Set<Node>>();
          const min = rule ? rule(room) : 0;
          for (const move of analysis(room, true, 2, true, true, hook).moves) {
            if (move.windowMs >= min) {
              const set = g.get(node(room, move.from)) ?? new Set<Node>();
              set.add(node(room, move.to));
              g.set(node(room, move.from), set);
            }
          }
          return g;
        };
        expect(reachable(graph(null, false), from).has(target), `${room} sans crochet`).toBe(false);
        expect(reachable(graph(easy, true), from).has(target), room).toBe(true);
      }
    },
  );
});
