import { TILE_SIZE as T } from '../../config/display';
import { TRAVEL, TRAVEL_BLOCKED, type TravelLantern } from '../../config/travel';
import { EntityType, Tile, tileAt, type LevelData, type LevelEntity } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';
import { checkCondition, type StoryTrigger } from '../story/story';
import { isStrangeRoom, type Zone } from './zone';

/**
 * Le voyage rapide (D-163), pur : les veilleuses principales, leur déblocage, la règle « on ne va
 * que là où l'on pourrait aller à pied maintenant », et le départ depuis une lanterne allumée.
 */

/** Une veilleuse principale, trouvée dans sa salle. */
export interface TravelPoint extends TravelLantern {
  readonly room: string;
  readonly col: number;
  readonly row: number;
}

/** Les veilleuses principales de la zone, dans l'ordre du voyage ; une lanterne absente : erreur. */
export function travelPoints(zone: Zone, lanterns: readonly TravelLantern[]): TravelPoint[] {
  return lanterns.map((lantern) => {
    for (const [room, level] of zone.rooms) {
      const e = level.entities.find(
        (entity) => entity.type === EntityType.Checkpoint && entity.name === lantern.lantern,
      );
      if (e) {
        return { ...lantern, room, col: e.col, row: e.row };
      }
    }
    throw new Error(`Voyage : lanterne « ${lantern.lantern} » absente de la zone ${zone.id}`);
  });
}

/** Veilleuse débloquée : l'une de ses étapes est vécue. */
export function travelUnlocked(point: TravelLantern, flags: ReadonlySet<string>): boolean {
  return point.unlockedBy.some((flag) => flags.has(flag));
}

/** Moment de l'histoire sans voyage (`TRAVEL_BLOCKED`). */
export function travelBlocked(flags: ReadonlySet<string>): boolean {
  return TRAVEL_BLOCKED.some((when) => checkCondition(flags, when));
}

/**
 * Salles où l'on peut aller à pied depuis `from`, par les liaisons de la zone, sans passer une
 * sortie fermée par l'histoire (`locked`, du côté où on la prend : la porte de l'école ne s'ouvre
 * que de l'intérieur). À l'échelle des salles : on suppose qu'on traverse une salle déjà parcourue
 * (les capacités ne se perdent pas, la croissance ne ferme rien, D-69, D-119).
 */
export function reachableRooms(
  zone: Zone,
  from: string,
  locked: (room: string, exit: number) => boolean,
): Set<string> {
  const seen = new Set<string>([from]);
  const queue = [from];
  for (let room = queue.shift(); room !== undefined; room = queue.shift()) {
    for (const [a, b] of zone.links) {
      for (const [here, there] of [
        [a, b],
        [b, a],
      ] as const) {
        if (here.room === room && !seen.has(there.room) && !locked(here.room, here.exit)) {
          seen.add(there.room);
          queue.push(there.room);
        }
      }
    }
  }
  return seen;
}

/**
 * État d'une veilleuse vue d'où se tient Céleste : pas encore débloquée, dans la salle même, pas
 * atteignable à pied en ce moment, ou ouverte au voyage.
 */
export type TravelState = 'locked' | 'here' | 'far' | 'open';

export interface TravelOption {
  readonly point: TravelPoint;
  readonly state: TravelState;
}

/** Chaque veilleuse principale et son état, depuis la salle `from`. */
export function travelOptions(
  zone: Zone,
  points: readonly TravelPoint[],
  from: string,
  flags: ReadonlySet<string>,
  locked: (room: string, exit: number) => boolean,
): TravelOption[] {
  const reachable = reachableRooms(zone, from, locked);
  return points.map((point) => {
    let state: TravelState = 'open';
    if (!travelUnlocked(point, flags)) {
      state = 'locked';
    } else if (point.room === from) {
      state = 'here';
    } else if (!reachable.has(point.room)) {
      state = 'far';
    }
    return { point, state };
  });
}

/**
 * Pourquoi on ne peut pas partir d'ici (null : on peut) : hors de la partie (un parcours d'essai),
 * dans le monde étrange (et ses poursuites), Céleste occupée (une scène, un fondu, un
 * évanouissement, un souvenir), un moment de l'histoire sans voyage, ou pas de lanterne allumée
 * à portée.
 */
export type DepartureProblem = 'zone' | 'strange' | 'busy' | 'story' | 'lantern';

export function departureProblem(input: {
  readonly level: LevelData | null;
  readonly busy: boolean;
  readonly flags: ReadonlySet<string>;
  readonly lantern: LevelEntity | null;
}): DepartureProblem | null {
  if (!input.level) {
    return 'zone';
  }
  if (isStrangeRoom(input.level)) {
    return 'strange';
  }
  if (input.busy) {
    return 'busy';
  }
  if (travelBlocked(input.flags)) {
    return 'story';
  }
  return input.lantern ? null : 'lantern';
}

/**
 * Céleste à `reachTiles` tuiles au plus de la lanterne (col, row) : de sa tuile et de celle du
 * dessus jusqu'à la hitbox. Sans allocation : appelée à chaque pas.
 */
export function nearLantern(
  col: number,
  row: number,
  box: Box,
  reachTiles: number = TRAVEL.reachTiles,
): boolean {
  const dx = Math.max(col * T - (box.x + box.width), box.x - (col + 1) * T, 0);
  const dy = Math.max((row - 1) * T - (box.y + box.height), box.y - (row + 1) * T, 0);
  return dx * dx + dy * dy <= reachTiles * T * reachTiles * T;
}

/**
 * La lanterne allumée la plus proche de Céleste, à `TRAVEL.reachTiles` tuiles au plus de sa
 * hitbox (null : aucune). `lit` : la lanterne `salle:nom` est allumée (sauvegarde).
 */
export function litLanternNear(
  level: LevelData,
  box: Box,
  lit: (key: string) => boolean,
  reachTiles: number = TRAVEL.reachTiles,
): LevelEntity | null {
  const cx = box.x + box.width / 2;
  let best: LevelEntity | null = null;
  let distance = Infinity;
  for (const e of level.entities) {
    if (e.type !== EntityType.Checkpoint || e.name === undefined) {
      continue;
    }
    const d = Math.abs((e.col + 0.5) * T - cx);
    if (
      d < distance &&
      nearLantern(e.col, e.row, box, reachTiles) &&
      lit(`${level.id}:${e.name}`)
    ) {
      best = e;
      distance = d;
    }
  }
  return best;
}

/**
 * Le voyage est proposé (l'étincelle d'Agir à une lanterne) : au moins `TRAVEL.minUnlocked`
 * veilleuses débloquées, et au moins une où aller.
 */
export function travelOffered(options: readonly TravelOption[]): boolean {
  const unlocked = options.filter((o) => o.state !== 'locked').length;
  return unlocked >= TRAVEL.minUnlocked && options.some((o) => o.state === 'open');
}

/**
 * Où Céleste arrive : debout à côté de la veilleuse (deux tuiles, sinon une, du côté du centre de
 * la salle d'abord : jamais dans une sortie), tournée vers elle ; sinon sur sa tuile.
 */
export function travelArrival(
  level: LevelData,
  point: { readonly col: number; readonly row: number },
): { col: number; row: number; facing: 1 | -1 } {
  const free = (col: number, row: number) => tileAt(level, col, row) === Tile.Empty;
  const ground = (col: number, row: number) => {
    const tile = tileAt(level, col, row);
    return tile === Tile.Solid || tile === Tile.OneWay;
  };
  const side = point.col < level.width / 2 ? 1 : -1;
  for (const dx of [2 * side, side, -2 * side, -side]) {
    const col = point.col + dx;
    // Le chemin jusqu'à la veilleuse, au sol, sans mur entre les deux.
    const steps = Array.from(
      { length: Math.abs(dx) },
      (_, k) => point.col + Math.sign(dx) * (k + 1),
    );
    if (
      steps.every((c) => free(c, point.row) && free(c, point.row - 1) && ground(c, point.row + 1))
    ) {
      return { col, row: point.row, facing: dx > 0 ? -1 : 1 };
    }
  }
  return { col: point.col, row: point.row, facing: side };
}

/**
 * Le script du voyage (D-163) : Céleste s'assoit, le noir ; elle passe dans la salle de la
 * veilleuse, à côté d'elle (qui devient le point de retour) ; assise, l'image revient. Elle se
 * relève dès qu'on la fait bouger.
 */
export function travelScript(
  point: TravelPoint,
  arrival: { readonly col: number; readonly row: number; readonly facing: 1 | -1 },
): StoryTrigger {
  return {
    id: `travel:${point.lantern}`,
    room: point.room,
    on: 'interact',
    when: {},
    lock: true,
    steps: [
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: TRAVEL.sitMs },
      { do: 'fadeOut', ms: TRAVEL.fadeOutMs },
      { do: 'room', room: point.room, ...arrival, returnPoint: true },
      { do: 'pose', pose: 'sit' },
      { do: 'wait', ms: TRAVEL.darkMs },
      { do: 'fadeIn', ms: TRAVEL.fadeInMs },
    ],
  };
}
