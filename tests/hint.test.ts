import { describe, expect, it } from 'vitest';
import { HINT } from '../src/config/hint';
import { StoryFlag as F } from '../src/config/story';
import {
  HintClock,
  HintStage,
  currentGoal,
  hintPoint,
  milestoneName,
  portalRoom,
  route,
  type HintWorld,
} from '../src/core/hint/hint';
import { checkCondition } from '../src/core/story/story';
import { ZONES } from '../src/levels';
import { HOUSE_STORY } from '../src/levels/house/story';
import { MILESTONES } from '../src/levels/milestones';
import type { Zone } from '../src/core/world/zone';

const firstZone = ZONES[0];
if (!firstZone) {
  throw new Error('zone absente');
}
const zone: Zone = firstZone;

function world(flags: Set<string>, abilities: Set<string>): HintWorld {
  return {
    zone,
    triggers: HOUSE_STORY.triggers,
    flags,
    abilities,
    locked: (room, exit) =>
      HOUSE_STORY.lockedRooms.some(
        (lock) =>
          lock.room === room &&
          (lock.exit === undefined || lock.exit === exit) &&
          checkCondition(flags, lock.when),
      ),
  };
}

/** Suit le chemin principal jalon après jalon, jusqu'à `until` (fait) ou la fin. */
function walk(until?: string): {
  flags: Set<string>;
  abilities: Set<string>;
  room: string;
  done: string[];
} {
  const flags = new Set<string>();
  const abilities = new Set<string>();
  let room = zone.start;
  const done: string[] = [];
  for (let guard = 0; guard < MILESTONES.length + 5; guard++) {
    const w = world(flags, abilities);
    const current = currentGoal(MILESTONES, w, room);
    if (!current) {
      break;
    }
    const { milestone, goal } = current;
    const name = milestoneName(milestone);
    // Le but est accessible d'où l'on est, et le fil sait quoi montrer dans cette salle.
    expect(route(w, room, goal.room).distance, `${name} depuis ${room}`).toBeGreaterThanOrEqual(0);
    const level = zone.rooms.get(room);
    if (level) {
      expect(hintPoint(goal, w, room, level), `${name} depuis ${room}`).not.toBeNull();
    }
    if ('trigger' in milestone) {
      const trigger = HOUSE_STORY.triggers.find((t) => t.id === milestone.trigger);
      for (const step of trigger?.steps ?? []) {
        if (step.do === 'flag') {
          flags.add(step.id);
        } else if (step.do === 'toggle') {
          if (flags.has(step.id)) {
            flags.delete(step.id);
          } else {
            flags.add(step.id);
          }
        } else if (step.do === 'ability') {
          abilities.add(step.id);
        }
      }
      room = (trigger && portalRoom(trigger)) ?? goal.room;
    } else {
      abilities.add(milestone.ability);
      room = goal.room;
    }
    done.push(name);
    if (name === until) {
      break;
    }
  }
  return { flags, abilities, room, done };
}

describe('le fil discret : les jalons (D-129)', () => {
  it('chaque jalon nomme un déclencheur ou une capacité qui existe', () => {
    for (const milestone of MILESTONES) {
      if ('trigger' in milestone) {
        expect(
          HOUSE_STORY.triggers.some((t) => t.id === milestone.trigger),
          milestone.trigger,
        ).toBe(true);
      } else {
        expect(
          [...zone.rooms.values()].some((level) => level.meta.ability === milestone.ability),
          milestone.ability,
        ).toBe(true);
      }
    }
  });

  it('le chemin principal se suit jalon après jalon jusqu’à la fin, toujours accessible', () => {
    const { flags, done } = walk();
    expect(done.length).toBe(MILESTONES.length);
    expect(new Set(done).size).toBe(MILESTONES.length);
    expect(flags.has(F.NannyEden)).toBe(true);
    // Le soir du dernier niveau (D-139), jusqu'à la nuit.
    expect(flags.has(F.FinaleNight)).toBe(true);
  });

  it('les îlots du niveau 7 : le plus proche d’abord', () => {
    const { flags, abilities } = walk('nanny-house');
    const w = world(flags, abilities);
    expect(currentGoal(MILESTONES, w, 'nanny-garden')?.goal.room).toBe('nanny-garden');
    expect(currentGoal(MILESTONES, w, 'nanny-carousel')?.goal.room).toBe('nanny-carousel');
  });
});

describe('le fil discret : l’horloge', () => {
  it('ne se montre qu’après un long moment sans progrès, en deux paliers', () => {
    const clock = new HintClock();
    const step = 100;
    const run = (ms: number, active = true, progress = 1) => {
      for (let t = 0; t < ms; t += step) {
        clock.step(step, active, progress);
      }
    };
    run(HINT.glimpseMs - step);
    expect(clock.stage).toBe(HintStage.None);
    run(2 * step);
    expect(clock.stage).toBe(HintStage.Glimpse);
    run(HINT.leadMs - HINT.glimpseMs);
    expect(clock.stage).toBe(HintStage.Lead);
    // Un progrès remet tout à zéro.
    run(step, true, 2);
    expect(clock.stage).toBe(HintStage.None);
    expect(clock.idleMs).toBeLessThanOrEqual(step);
  });

  it('ne compte pas quand le fil est inactif (scène, poursuite)', () => {
    const clock = new HintClock();
    for (let t = 0; t < HINT.leadMs * 2; t += 100) {
      clock.step(100, false, 1);
    }
    expect(clock.idleMs).toBe(0);
    expect(clock.stage).toBe(HintStage.None);
    clock.skip();
    clock.step(100, true, 1);
    expect(clock.stage).toBe(HintStage.Lead);
  });
});
