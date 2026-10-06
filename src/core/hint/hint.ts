import type { Ability } from '../../config/abilities';
import { TILE_SIZE as T } from '../../config/display';
import { HINT } from '../../config/hint';
import { EntityType, type LevelData } from '../level/LevelData';
import { checkCondition, type FlagCondition, type StoryTrigger } from '../story/story';
import type { Zone } from '../world/zone';

/**
 * Jalon du chemin principal (D-129) : un déclencheur de l'histoire (disponible quand sa condition
 * est vraie : il se désactive lui-même une fois vécu), ou un objet de capacité à ramasser
 * (disponible tant que la capacité manque, après `after`). Des jalons d'un même `group` se font
 * dans n'importe quel ordre : le plus proche est montré.
 */
export type Milestone =
  | { readonly trigger: string; readonly group?: string }
  | { readonly ability: Ability; readonly after?: FlagCondition; readonly group?: string };

/** Ce que le fil sait de la partie. */
export interface HintWorld {
  readonly zone: Zone;
  readonly triggers: readonly StoryTrigger[];
  readonly flags: ReadonlySet<string>;
  readonly abilities: ReadonlySet<string>;
  /** Sortie fermée en ce moment (l'histoire, D-46). */
  locked(room: string, exit: number): boolean;
}

/** Un but dans une salle : la salle et le point (px). */
export interface HintGoal {
  readonly room: string;
  readonly x: number;
  readonly y: number;
}

/** Premier pas de l'itinéraire : une sortie ou une porte de la salle, ou un passage de l'histoire. */
export type RouteHop =
  | { readonly kind: 'exit'; readonly exit: number }
  | { readonly kind: 'portal'; readonly trigger: StoryTrigger };

function triggerPoint(trigger: StoryTrigger): { x: number; y: number } {
  if (trigger.mark) {
    return { x: (trigger.mark.col + 0.5) * T, y: (trigger.mark.row + 0.5) * T };
  }
  const area = trigger.area ?? { col: 0, row: 0, w: 1, h: 1 };
  return { x: (area.col + area.w / 2) * T, y: (area.row + area.h / 2) * T };
}

/** Salle d'arrivée d'un déclencheur qui change de salle (la dernière, s'il y en a plusieurs). */
export function portalRoom(trigger: StoryTrigger): string | null {
  let room: string | null = null;
  for (const step of trigger.steps) {
    if (step.do === 'room') {
      room = step.room;
    }
  }
  return room;
}

/** Le but d'un jalon, s'il est disponible maintenant ; null sinon. */
export function milestoneGoal(milestone: Milestone, world: HintWorld): HintGoal | null {
  if ('trigger' in milestone) {
    const trigger = world.triggers.find((t) => t.id === milestone.trigger);
    if (!trigger || !checkCondition(world.flags, trigger.when)) {
      return null;
    }
    return { room: trigger.room, ...triggerPoint(trigger) };
  }
  if (
    world.abilities.has(milestone.ability) ||
    (milestone.after && !checkCondition(world.flags, milestone.after))
  ) {
    return null;
  }
  for (const [room, level] of world.zone.rooms) {
    if (level.meta.ability === milestone.ability) {
      const entity = level.entities.find((e) => e.type === EntityType.Ability);
      if (entity) {
        return { room, x: (entity.col + 0.5) * T, y: (entity.row + 0.5) * T };
      }
    }
  }
  return null;
}

/**
 * Itinéraire de salle en salle (parcours en largeur) : par les sorties et les portes reliées et
 * ouvertes, et par les passages de l'histoire disponibles (un déclencheur qui emmène dans une autre
 * salle, comme l'entrée d'un monde étrange). Le premier pas, ou null (déjà dans la salle, ou pas de
 * chemin) ; `distance` : nombre de salles traversées (−1 sans chemin).
 */
export function route(
  world: HintWorld,
  from: string,
  to: string,
): { hop: RouteHop | null; distance: number } {
  if (from === to) {
    return { hop: null, distance: 0 };
  }
  const first = new Map<string, RouteHop>();
  const depth = new Map<string, number>([[from, 0]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const room = queue[i] ?? '';
    const d = depth.get(room) ?? 0;
    const visit = (next: string, hop: RouteHop) => {
      if (depth.has(next)) {
        return;
      }
      depth.set(next, d + 1);
      first.set(next, room === from ? hop : (first.get(room) ?? hop));
      queue.push(next);
    };
    for (const [a, b] of world.zone.links) {
      if (a.room === room && !world.locked(room, a.exit)) {
        visit(b.room, { kind: 'exit', exit: a.exit });
      } else if (b.room === room && !world.locked(room, b.exit)) {
        visit(a.room, { kind: 'exit', exit: b.exit });
      }
    }
    for (const trigger of world.triggers) {
      const next = trigger.room === room ? portalRoom(trigger) : null;
      if (next && checkCondition(world.flags, trigger.when)) {
        visit(next, { kind: 'portal', trigger });
      }
    }
    if (depth.has(to)) {
      return { hop: first.get(to) ?? null, distance: depth.get(to) ?? -1 };
    }
  }
  return { hop: null, distance: -1 };
}

/** Le jalon montré et son but. */
export interface CurrentGoal {
  readonly milestone: Milestone;
  readonly goal: HintGoal;
}

/**
 * Jalon à montrer : le premier disponible dans l'ordre de l'histoire ; s'il fait partie d'un
 * groupe, le plus proche des jalons disponibles de ce groupe. Null si aucun.
 */
export function currentGoal(
  milestones: readonly Milestone[],
  world: HintWorld,
  room: string,
): CurrentGoal | null {
  for (const milestone of milestones) {
    const goal = milestoneGoal(milestone, world);
    if (!goal) {
      continue;
    }
    const group = milestone.group;
    if (group === undefined) {
      return { milestone, goal };
    }
    let best: CurrentGoal = { milestone, goal };
    let bestDistance = Infinity;
    for (const other of milestones) {
      if (other.group !== group) {
        continue;
      }
      const candidate = milestoneGoal(other, world);
      const distance = candidate ? route(world, room, candidate.room).distance : -1;
      if (candidate && distance >= 0 && distance < bestDistance) {
        best = { milestone: other, goal: candidate };
        bestDistance = distance;
      }
    }
    return best;
  }
  return null;
}

/** Nom d'un jalon (debug, tests). */
export function milestoneName(milestone: Milestone): string {
  return 'trigger' in milestone ? milestone.trigger : `capacité ${milestone.ability}`;
}

/**
 * Point à montrer dans la salle `room` (px) : le but s'il est là, sinon la sortie, la porte ou le
 * passage qui y mène. Null si le but est inaccessible d'ici.
 */
export function hintPoint(
  goal: HintGoal,
  world: HintWorld,
  room: string,
  level: LevelData,
): { x: number; y: number } | null {
  if (goal.room === room) {
    return { x: goal.x, y: goal.y };
  }
  const { hop } = route(world, room, goal.room);
  if (!hop) {
    return null;
  }
  if (hop.kind === 'portal') {
    return triggerPoint(hop.trigger);
  }
  const exit = level.exits.find((e) => e.id === hop.exit);
  if (exit) {
    // Au milieu de l'ouverture, un peu en retrait du mur.
    const inward = exit.side === 'left' ? 1 : -1;
    return {
      x: (exit.col + 0.5 + inward) * T,
      y: ((exit.rowMin + exit.rowMax + 1) / 2) * T,
    };
  }
  const door = level.doors.find((d) => d.id === hop.exit);
  return door ? { x: (door.col + 0.5) * T, y: (door.row - 0.5) * T } : null;
}

/** Palier du fil : rien, un aperçu de la direction, ou la lueur qui mène. */
export const HintStage = { None: 0, Glimpse: 1, Lead: 2 } as const;
export type HintStage = (typeof HintStage)[keyof typeof HintStage];

/**
 * Horloge du fil (D-129), pure : le temps de jeu passé sans progrès. Tout progrès (`progress`
 * change : étape de l'histoire, capacité, salle découverte, veilleuse) la remet à zéro ; elle ne
 * compte que quand le fil est actif (pas pendant une scène, une poursuite, un souvenir).
 */
export class HintClock {
  stage: HintStage = HintStage.None;
  idleMs = 0;
  private progress = Number.NaN;

  step(dtMs: number, active: boolean, progress: number): void {
    if (progress !== this.progress) {
      this.progress = progress;
      this.idleMs = 0;
    } else if (active) {
      this.idleMs += dtMs;
    }
    this.stage =
      !active || this.idleMs < HINT.glimpseMs
        ? HintStage.None
        : this.idleMs < HINT.leadMs
          ? HintStage.Glimpse
          : HintStage.Lead;
  }

  /** Outil de debug : comme après un long moment sans progrès. */
  skip(): void {
    this.idleMs = HINT.leadMs;
  }
}
