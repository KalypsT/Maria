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
const EDEN_KINDS = new Set(['eden-small', 'eden-cheer', 'eden-peek', 'eden-laugh']);

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
      if (action.shows) {
        // À l'écran, au geste : Eden ne change pas.
        flags.add(action.shows);
        expect(edens(flags)).toEqual(before);
      }
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
    // La tour, chacun son tour (D-122) : rien, un cube (Céleste, à l'écran), deux (Eden, dans le
    // noir), trois (Céleste), puis tombée (Eden pose le quatrième, dans le noir).
    const tower = (fs: Set<string>) =>
      DATA.props.filter((p) => p.kind.startsWith('cube-tower') && checkCondition(fs, p.when));
    const seq = new Set<string>();
    const kinds: string[][] = [tower(seq).map((p) => p.kind)];
    for (const step of [E.tower1, E.tower2, E.tower3, E.fallen, E.hideA, E.gone]) {
      seq.add(step);
      kinds.push(tower(seq).map((p) => p.kind));
    }
    expect(kinds).toEqual([
      [],
      ['cube-tower-1'],
      ['cube-tower-2'],
      ['cube-tower-3'],
      ['cube-tower-fallen'],
      ['cube-tower-fallen'],
      ['cube-tower-fallen'],
    ]);
    const towerActions = DATA.actions.filter((a) => a.shows);
    expect(towerActions.map((a) => [a.shows, a.sets, a.blink])).toEqual([
      [E.tower1, E.tower2, true],
      [E.tower3, E.fallen, true],
    ]);
    // La nounou regarde, toujours là, sans texte ; Maria n'y est pas.
    expect(
      DATA.props.filter((p) => p.kind.startsWith('nanny') && checkCondition(flags, p.when)),
    ).toHaveLength(1);
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
        (action.beats ?? 0) * ms(PLAYABLE_MEMORY_TIMING.beatMs) +
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

  it('le cache-cache (D-122) : Céleste compte, Eden se cache ; on cherche seule avant l’étincelle', () => {
    const counts = DATA.actions.filter((a) => a.gesture === 'count');
    expect(counts).toHaveLength(2);
    for (const c of counts) {
      expect(c.blink).toBe(true);
      expect(c.beats ?? 0).toBeGreaterThanOrEqual(3);
    }
    // Chaque compte est suivi d'une recherche dont l'étincelle attend.
    DATA.actions.forEach((a, k) => {
      if (a.gesture === 'count') {
        expect(DATA.actions[k + 1]?.markDelayMs ?? 0).toBeGreaterThan(2000);
      }
    });
    // La nounou tourne la tête vers la seconde cachette, le temps de la trouver.
    const nanny = (fs: Set<string>) =>
      DATA.props.filter((p) => p.kind.startsWith('nanny') && checkCondition(fs, p.when));
    expect(nanny(new Set([E.hideA])).map((p) => p.kind)).toEqual(['nanny-shadow']);
    expect(nanny(new Set([E.hideA, E.hideB])).map((p) => p.kind)).toEqual(['nanny-look']);
    expect(nanny(new Set([E.hideA, E.hideB, E.found])).map((p) => p.kind)).toEqual([
      'nanny-shadow',
    ]);

    // Joué : le compte tient le noir plus longtemps qu'un clignement ; l'étincelle attend.
    const memory = new PlayableMemory(DATA, HZ);
    for (let i = 0; i < ms(PLAYABLE_MEMORY_TIMING.introMs) + 1; i++) {
      memory.step(away, false);
    }
    const countAt = DATA.actions.findIndex((a) => a.gesture === 'count');
    for (const action of DATA.actions.slice(0, countAt)) {
      memory.step(inside(action.area), true);
      for (
        let i = 0;
        i < ms(PLAYABLE_MEMORY_TIMING.gestureMs + PLAYABLE_MEMORY_TIMING.blinkMs) + 2;
        i++
      ) {
        memory.step(inside(action.area), false);
      }
    }
    const count = DATA.actions[countAt];
    if (!count) {
      throw new Error('compte absent');
    }
    memory.step(inside(count.area), true);
    const plain = ms(PLAYABLE_MEMORY_TIMING.gestureMs + PLAYABLE_MEMORY_TIMING.blinkMs) + 2;
    for (let i = 0; i < plain; i++) {
      memory.step(away, false);
    }
    // Encore dans le noir : on compte.
    expect(memory.veil).toBeGreaterThan(0.5);
    for (let i = 0; i < (count.beats ?? 0) * ms(PLAYABLE_MEMORY_TIMING.beatMs); i++) {
      memory.step(away, false);
    }
    expect(memory.veil).toBeLessThan(0.05);
    expect(memory.flags.has(E.hideA)).toBe(true);
    expect(memory.markShown).toBe(false);
    for (let i = 0; i < ms(DATA.actions[countAt + 1]?.markDelayMs ?? 0) + 1; i++) {
      memory.step(away, false);
    }
    expect(memory.markShown).toBe(true);
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
