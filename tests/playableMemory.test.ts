import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { GROWTH_PHASES } from '../src/config/growth';
import { MEMORIES, STRANGE_THINGS } from '../src/config/memories';
import {
  KITCHEN_MEMORY_STEP,
  PLAYABLE_MEMORIES,
  PLAYABLE_MEMORY_TIMING,
  TODDLER_LOOK,
  playableOf,
} from '../src/config/playableMemories';
import { MemoryEvent, PlayableMemory } from '../src/core/memory/PlayableMemory';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import type { StoryData, TileArea } from '../src/core/story/story';

const HZ = 120;
const DATA = PLAYABLE_MEMORIES.kitchen;
const ms = (value: number) => Math.ceil((value / 1000) * HZ);

/** Céleste debout au milieu d'une zone (hitbox de Céleste toute petite). */
function inside(area: TileArea) {
  const { width, height } = TODDLER_LOOK.hitbox;
  return {
    x: (area.col + area.w / 2) * T - width / 2,
    y: (area.row + area.h) * T - height,
    width,
    height,
  };
}
const away = { x: 1 * T, y: 0, width: 12, height: 18 };

function run(memory: PlayableMemory, steps: number, box = away, interact = false): number {
  let events = 0;
  for (let i = 0; i < steps; i++) {
    events |= memory.step(box, interact && i === 0);
  }
  return events;
}

/** Joue tout le souvenir et retourne les événements vus, dans l'ordre. */
function playAll(memory: PlayableMemory): number[] {
  const seen: number[] = [];
  run(memory, ms(PLAYABLE_MEMORY_TIMING.introMs) + 1);
  for (const action of DATA.actions) {
    seen.push(run(memory, 1, inside(action.area), true));
    seen.push(run(memory, ms(PLAYABLE_MEMORY_TIMING.gestureMs) + 1, inside(action.area)));
  }
  for (let i = 0; i < 20000 && !memory.done; i++) {
    const e = memory.step(away, false);
    if (e) {
      seen.push(e);
    }
  }
  return seen;
}

describe('souvenir jouable (D-89)', () => {
  it('le souvenir de la cuisine : remuer, verser (la tasse en main), servir Roger et ses peluches', () => {
    expect(DATA.actions.map((a) => a.gesture)).toEqual(['stir', 'pour', 'serve']);
    expect(DATA.actions.map((a) => a.carry)).toEqual([false, true, false]);
    expect(playableOf('pink-kitchen')).toBe('kitchen');
    expect(playableOf('roger')).toBeNull();
    expect(STRANGE_THINGS).toContain('pink-kitchen');
    expect(MEMORIES).not.toContain('pink-kitchen');
    // Maria n'y est pas (pilier 5) ; aucun parent.
    expect(DATA.props.some((p) => p.kind.startsWith('maria'))).toBe(false);
    expect(DATA.props.some((p) => /mom|dad/.test(p.kind))).toBe(false);
    expect(DATA.props.every((p) => p.room === DATA.room)).toBe(true);
  });

  it('Céleste toute petite : plus petite que la phase 1, elle marche plus lentement', () => {
    const first = GROWTH_PHASES[0];
    expect(first).toBeDefined();
    expect(TODDLER_LOOK.hitbox.height).toBeLessThan(first?.hitbox.height ?? 0);
    expect(TODDLER_LOOK.bodyScale).toBeLessThan(1);
    expect(TODDLER_LOOK.movementScale.maxRunSpeed).toBeLessThan(1);
  });

  it('il apparaît depuis le noir ; Céleste attend la fin du fondu', () => {
    const memory = new PlayableMemory(DATA, HZ);
    expect(memory.veil).toBe(1);
    expect(memory.locked).toBe(true);
    const first = DATA.actions[0];
    expect(first).toBeDefined();
    run(memory, 1, first ? inside(first.area) : away, true);
    expect(memory.next).toBe(0);
    run(memory, ms(PLAYABLE_MEMORY_TIMING.introMs));
    expect(memory.veil).toBe(0);
    expect(memory.locked).toBe(false);
  });

  it('les actions se font dans l’ordre, dans leur zone, avec Agir ; pas d’action sautée', () => {
    const memory = new PlayableMemory(DATA, HZ);
    run(memory, ms(PLAYABLE_MEMORY_TIMING.introMs) + 1);
    const [stir, pour, serve] = DATA.actions;
    if (!stir || !pour || !serve) {
      throw new Error('actions absentes');
    }
    // Agir loin de la dînette, ou devant la table avant d'avoir versé le thé : rien.
    expect(run(memory, 1, away, true)).toBe(0);
    expect(run(memory, 1, inside(serve.area), true)).toBe(0);
    expect(memory.interactable).toBe(-1);
    // Sans Agir : l'action est seulement à portée.
    run(memory, 1, inside(stir.area));
    expect(memory.interactable).toBe(0);
    expect(run(memory, 1, inside(stir.area), true) & MemoryEvent.Gesture).toBeTruthy();
    expect(memory.flags.has(KITCHEN_MEMORY_STEP.stirred)).toBe(true);
    // Pendant le geste, Céleste ne bouge pas et rien d'autre ne se fait.
    expect(memory.locked).toBe(true);
    expect(run(memory, 1, inside(pour.area), true)).toBe(0);
    run(memory, ms(PLAYABLE_MEMORY_TIMING.gestureMs) + 1, inside(pour.area));
    expect(run(memory, 1, inside(pour.area), true) & MemoryEvent.Gesture).toBeTruthy();
    expect(memory.carrying).toBe(true);
    expect(memory.flags.has(KITCHEN_MEMORY_STEP.poured)).toBe(true);
    run(memory, ms(PLAYABLE_MEMORY_TIMING.gestureMs) + 1, away);
    expect(run(memory, 1, inside(serve.area), true) & MemoryEvent.Gesture).toBeTruthy();
    expect(memory.carrying).toBe(false);
    expect(memory.flags.has(KITCHEN_MEMORY_STEP.served)).toBe(true);
    expect(memory.current).toBeNull();
  });

  it('la fin : un cœur, le noir, la petite cuisine seule, puis le noir et la fin', () => {
    const memory = new PlayableMemory(DATA, HZ);
    const events = playAll(memory);
    const order = events.filter(
      (e) => e & (MemoryEvent.Heart | MemoryEvent.Alone | MemoryEvent.Done),
    );
    expect(order).toEqual([MemoryEvent.Heart, MemoryEvent.Alone, MemoryEvent.Done]);
    expect(memory.done).toBe(true);
    expect(memory.celesteVisible).toBe(false);
    expect(memory.veil).toBe(1);
  });

  it('rejouable : chaque partie repart de zéro ; rien n’est sauvegardé (étapes à part)', () => {
    const first = new PlayableMemory(DATA, HZ);
    playAll(first);
    const again = new PlayableMemory(DATA, HZ);
    expect(again.flags.size).toBe(0);
    expect(again.next).toBe(0);
    expect(again.celesteVisible).toBe(true);
    // Les étapes du souvenir ne sont pas des étapes de l'histoire.
    for (const step of Object.values(KITCHEN_MEMORY_STEP)) {
      expect(step.startsWith('memory.')).toBe(true);
    }
  });

  it('étape « play » du script : bloquante jusqu’à la fin du souvenir, puis le script reprend', () => {
    const log: string[] = [];
    const noop = () => undefined;
    const host: StoryHost = {
      flagSet: (id) => log.push(`flag ${id}`),
      place: noop,
      room: noop,
      pose: noop,
      think: noop,
      sparkle: noop,
      shake: noop,
      memory: noop,
      hush: noop,
      ability: noop,
      play: (id) => log.push(`play ${id}`),
    };
    const data: StoryData = {
      triggers: [
        {
          id: 't',
          room: 'r',
          on: 'interact',
          area: { col: 0, row: 0, w: 4, h: 4 },
          when: {},
          lock: true,
          steps: [
            { do: 'play', id: 'kitchen' },
            { do: 'flag', id: 'after' },
          ],
        },
      ],
      omens: [],
      props: [],
      times: [],
      lockedRooms: [],
    };
    const director = new StoryDirector(data, host, HZ);
    const box = { x: 8, y: 8, width: 12, height: 18 };
    director.step('r', box, true);
    expect(log).toEqual(['play kitchen']);
    expect(director.playing).toBe(true);
    for (let i = 0; i < 1000; i++) {
      director.step('r', box, false);
    }
    expect(log).toEqual(['play kitchen']);
    expect(director.busy).toBe(true);
    director.endPlay();
    director.step('r', box, false);
    expect(log).toEqual(['play kitchen', 'flag after']);
    expect(director.busy).toBe(false);
  });
});
