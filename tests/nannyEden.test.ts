import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { STRANGE_THINGS } from '../src/config/memories';
import {
  EDEN_MEMORY_STEP as E,
  PLAYABLE_MEMORIES,
  PLAYABLE_MEMORY_TIMING,
  TODDLER_LOOK,
  playableOf,
} from '../src/config/playableMemories';
import { StoryFlag as F } from '../src/config/story';
import { tileAt, Tile } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { MemoryEvent, PlayableMemory } from '../src/core/memory/PlayableMemory';
import { checkCondition, type TileArea } from '../src/core/story/story';
import { storyProblems } from '../src/core/story/storyProblems';
import { HOUSE_STORY } from '../src/levels/house/story';
import { MEMORY_ROOMS } from '../src/levels';
import { EDEN_SEAT } from '../src/levels/nanny/story';
import { level, zone } from './zoneGraph';

/** L'avant-dernier niveau, PR 11 (D-118) : Eden et son souvenir jouable. */
const HZ = 120;
const DATA = PLAYABLE_MEMORIES.eden;
const ms = (value: number) => Math.ceil((value / 1000) * HZ);
const EDEN_KINDS = new Set(['eden-small', 'eden-peek', 'eden-laugh']);

function inside(area: TileArea) {
  const { width, height } = TODDLER_LOOK.hitbox;
  return {
    x: (area.col + area.w / 2) * T - width / 2,
    y: (area.row + area.h) * T - height,
    width,
    height,
  };
}
const away = { x: 40 * T, y: 0, width: 12, height: 18 };

/** Les objets d'Eden montrés pour ces étapes du souvenir. */
const edens = (flags: ReadonlySet<string>) =>
  DATA.props.filter((p) => EDEN_KINDS.has(p.kind) && checkCondition(flags, p.when));

describe('Eden et son souvenir jouable (D-118)', () => {
  it('la salle du souvenir : chez la nounou, hors de la partie, chaque action à portée', () => {
    const source = MEMORY_ROOMS.find((r) => r.id === DATA.room);
    if (!source) {
      throw new Error('salle du souvenir absente');
    }
    const room = parseAsciiLevel(source.id, source.text);
    expect(room.meta.world).toBe('memory');
    for (const action of DATA.actions) {
      // On se tient debout dans la zone de chaque action.
      const box = inside(action.area);
      const col = Math.floor((box.x + box.width / 2) / T);
      const row = Math.floor((box.y + box.height) / T);
      expect(tileAt(room, col, row), `${String(col)},${String(row)}`).toBe(Tile.Solid);
      expect(tileAt(room, col, row - 1)).toBe(Tile.Empty);
    }
  });

  it('la tour à deux, puis le cache-cache ; Eden ne bouge jamais à l’écran', () => {
    expect(DATA.actions.length).toBeGreaterThan(PLAYABLE_MEMORIES.kitchen.actions.length);
    // Avant chaque action, un seul Eden ; il ne change de place que dans le noir d'un clignement.
    const flags = new Set<string>();
    let before = edens(flags);
    expect(before.length).toBe(1);
    for (const action of DATA.actions) {
      if (action.sets) {
        flags.add(action.sets);
      }
      const after = edens(flags);
      expect(after.length).toBeLessThanOrEqual(1);
      const moved =
        after[0]?.col !== before[0]?.col ||
        after[0]?.row !== before[0]?.row ||
        after[0]?.kind !== before[0]?.kind;
      if (moved) {
        expect(action.blink, String(action.sets)).toBe(true);
      }
      before = after;
    }
    // La tour : un cube, deux (Céleste), puis quatre (Eden pose le sien, dans le noir).
    const tower = (fs: Set<string>) =>
      DATA.props.filter((p) => p.kind.startsWith('cube-tower') && checkCondition(fs, p.when));
    expect(tower(new Set()).map((p) => p.kind)).toEqual(['cube-tower-1']);
    expect(tower(new Set([E.tower2])).map((p) => p.kind)).toEqual(['cube-tower-2']);
    expect(tower(new Set([E.tower2, E.tower4])).map((p) => p.kind)).toEqual(['cube-tower-4']);
    // La nounou regarde, toujours là, sans texte ; Maria n'y est pas.
    expect(DATA.props.some((p) => p.kind === 'nanny-shadow' && checkCondition(flags, p.when))).toBe(
      true,
    );
    expect(DATA.props.some((p) => p.kind.startsWith('maria'))).toBe(false);
  });

  it('joué en entier : les étapes au noir des clignements, puis Céleste reste seule, Eden n’est plus là', () => {
    const memory = new PlayableMemory(DATA, HZ);
    for (let i = 0; i < ms(PLAYABLE_MEMORY_TIMING.introMs) + 1; i++) {
      memory.step(away, false);
    }
    let events = 0;
    for (const action of DATA.actions) {
      const box = inside(action.area);
      events |= memory.step(box, true);
      if (action.blink && action.sets) {
        // Pas encore : l'étape vient au noir.
        expect(memory.flags.has(action.sets)).toBe(false);
      }
      const wait =
        ms(PLAYABLE_MEMORY_TIMING.gestureMs) +
        (action.blink ? ms(PLAYABLE_MEMORY_TIMING.blinkMs) : 0) +
        2;
      for (let i = 0; i < wait; i++) {
        events |= memory.step(box, false);
      }
      if (action.sets) {
        expect(memory.flags.has(action.sets)).toBe(true);
      }
      expect(memory.veil).toBeLessThan(0.05);
    }
    expect(events & MemoryEvent.Heart).toBeTruthy();
    let sawAlone = false;
    for (let i = 0; i < 20000 && !memory.done; i++) {
      if (memory.step(away, false) & MemoryEvent.Alone) {
        sawAlone = true;
        // Céleste reste ; Eden n'est plus là.
        expect(memory.celesteVisible).toBe(true);
        expect(edens(memory.flags)).toEqual([]);
      }
    }
    expect(sawAlone).toBe(true);
    expect(memory.done).toBe(true);
  });

  it('dans la salle de jeux rendue à ses couleurs : Eden, un cœur, le souvenir, puis il n’est plus là', () => {
    const t = HOUSE_STORY.triggers.find((c) => c.id === 'nanny-eden');
    if (!t) {
      throw new Error('Eden absent');
    }
    expect(t.room).toBe('nanny-playroom');
    expect(t.when).toEqual({ all: [F.NannyErasureGone], none: [F.NannyEden] });
    const order = t.steps.map((s) => s.do);
    expect(order.indexOf('thought')).toBeLessThan(order.indexOf('play'));
    expect(order.indexOf('fadeOut')).toBeLessThan(order.indexOf('play'));
    expect(t.steps).toContainEqual({ do: 'play', id: 'eden' });
    expect(order.indexOf('flag')).toBeLessThan(order.indexOf('fadeIn'));
    const shown = (flags: string[]) =>
      HOUSE_STORY.props
        .filter((p) => p.room === 'nanny-playroom' && checkCondition(new Set(flags), p.when))
        .map((p) => p.kind);
    expect(shown([F.NannyErasure])).not.toContain('eden-small');
    expect(shown([F.NannyErasureGone])).toContain('eden-small');
    expect(shown([F.NannyErasureGone, F.NannyEden])).not.toContain('eden-small');
    // Debout sur le gros cube, près de sa tour.
    expect(tileAt(level('nanny-playroom'), EDEN_SEAT.col, EDEN_SEAT.row + 1)).toBe(Tile.Solid);
    // Rejouable depuis le cahier : la tour de cubes, à la fin de la rubrique « Monde étrange ».
    expect(STRANGE_THINGS.at(-1)).toBe('eden-tower');
    expect(playableOf('eden-tower')).toBe('eden');
    expect(t.steps[0]).toEqual({ do: 'memory', id: 'eden-tower' });
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
  });
});
