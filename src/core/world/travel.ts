import { TILE_SIZE as T } from '../../config/display';
import { TRAVEL, TRAVEL_BLOCKED, type TravelLantern } from '../../config/travel';
import { EntityType, type LevelData, type LevelEntity } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';
import { checkCondition } from '../story/story';
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
 * La lanterne allumée la plus proche de Céleste, à `TRAVEL.reachTiles` tuiles au plus de sa
 * hitbox (null : aucune). `lit` : la lanterne `salle:nom` est allumée (sauvegarde).
 */
export function litLanternNear(
  level: LevelData,
  box: Box,
  lit: (key: string) => boolean,
  reachTiles: number = TRAVEL.reachTiles,
): LevelEntity | null {
  const reach = reachTiles * T;
  let best: LevelEntity | null = null;
  let distance = Infinity;
  for (const e of level.entities) {
    if (e.type !== EntityType.Checkpoint || e.name === undefined) {
      continue;
    }
    // Écart entre la tuile de la lanterne (et celle du dessus) et la hitbox, 0 si elles se touchent.
    const dx = Math.max(e.col * T - (box.x + box.width), box.x - (e.col + 1) * T, 0);
    const dy = Math.max((e.row - 1) * T - (box.y + box.height), box.y - (e.row + 1) * T, 0);
    const d = Math.hypot(dx, dy);
    if (d <= reach && d < distance && lit(`${level.id}:${e.name}`)) {
      best = e;
      distance = d;
    }
  }
  return best;
}
