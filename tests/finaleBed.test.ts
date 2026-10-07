import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, LayerMask, Tile } from '../src/core/level/LevelData';
import { erasedLevel } from '../src/core/level/erase';
import { checkCondition } from '../src/core/story/story';
import { isMappedRoom, isStrangeRoom, returnLantern } from '../src/core/world/zone';
import { IMMENSE_START } from '../src/levels/finale/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { MILESTONES } from '../src/levels/milestones';
import { lullabyGraph, nodeKey } from './lullabyGraph';
import { fastest } from './pace';
import { seaAnalysis, standOn } from './tideGraph';
import { level } from './zoneGraph';

/**
 * Le dernier niveau, PR 3 (D-141) : la chambre immense, le lit et le coffre. Céleste en phase 3
 * (même hitbox que la phase 4, un peu plus lente : prudent), toutes ses capacités.
 */
const ROOM = 'finale-bed';
const room = level(ROOM);
const EASY = DIFFICULTY_MIN_WINDOW_MS.easy;
/** La veilleuse champignon, la tête de lit, la traverse de la cabane (les trois veilleuses). */
const CAP = { col: 70, row: 37 };
const HEAD = { col: 22, row: 17 };
const TRAVERSE = { col: 36, row: 12 };
/** Le dessus de l'armoire, au bout des étoiles : de là, le ciel de la chambre (D-142). */
const TOP = { col: 8, row: 3 };

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}
const trigger = (id: string) =>
  need(
    HOUSE_STORY.triggers.find((t) => t.id === id),
    id,
  );
const graph = lullabyGraph(room, (v) => seaAnalysis(v), EASY);

describe('la chambre immense : le lit et le coffre (D-141)', () => {
  it('un monde étrange hors carte, à la lumière de la veilleuse ; facile ; ni danger, ni ennemi, ni trouvaille', () => {
    expect(isStrangeRoom(room)).toBe(true);
    expect(isMappedRoom(room)).toBe(false);
    expect(room.meta.palette).toBe('nightlight');
    expect(room.meta.difficulty).toBe('easy');
    expect(room.entities.every((e) => e.type === EntityType.Checkpoint)).toBe(true);
    expect(room.entities).toHaveLength(3);
    const dangers = [Tile.Hazard, Tile.Thorns, Tile.Water] as number[];
    expect(Array.from(room.tiles).some((t) => dangers.includes(t))).toBe(false);
    // Pas de sortie : le dessus de l'armoire mène au ciel de la chambre (D-142), par l'histoire.
    expect(room.exits).toHaveLength(0);
  });

  it('on y arrive par le berceau vide, la nuit : dans le berceau immense ; le point de retour, la veilleuse champignon', () => {
    const enter = trigger('finale-enter');
    expect(enter.steps).toContainEqual(
      expect.objectContaining({ do: 'room', room: ROOM, ...IMMENSE_START, returnPoint: true }),
    );
    // Le point de retour est la veilleuse la plus proche de l'arrivée (D-141), pas la première lue
    // (la traverse, tout en haut).
    const lamp = need(returnLantern(room, IMMENSE_START.col, IMMENSE_START.row), 'veilleuse');
    expect({ col: lamp.col, row: lamp.row }).toEqual(CAP);
    expect(room.entities.find((e) => e.type === EntityType.Checkpoint)).toMatchObject(TRAVERSE);
    // De retour dans la chambre après l'entrée, le berceau y ramène.
    const reenter = trigger('finale-reenter');
    expect(checkCondition(new Set([F.FinaleNight, F.FinaleEntered]), reenter.when)).toBe(true);
    expect(checkCondition(new Set([F.FinaleNight]), reenter.when)).toBe(false);
  });

  it('le parcours : sortir du berceau, glisser sous le lit, la cheminée, la cabane en basculant (tronçons)', () => {
    expect(room.legs.map((l) => [l.difficulty, [...l.needs].sort()])).toEqual([
      ['easy', []],
      ['easy', ['slide', 'wall-jump']],
      ['easy', ['shift']],
    ]);
  });

  it('la boîte à musique se met à jouer en arrivant sur la traverse ; un jalon du fil discret', () => {
    const box = trigger('finale-music-box');
    expect(box.on).toBe('touch');
    expect(box.room).toBe(ROOM);
    const area = need(box.area, 'zone');
    expect(TRAVERSE.col).toBeGreaterThanOrEqual(area.col);
    expect(TRAVERSE.col).toBeLessThan(area.col + area.w);
    expect(MILESTONES.map((m) => ('trigger' in m ? m.trigger : ''))).toEqual(
      expect.arrayContaining(['finale-enter', 'finale-music-box']),
    );
  });

  it('les premières étoiles : en suivant la lumière, le dessus de l’armoire ; sans elles, jamais', () => {
    expect(graph.patterns.map((m) => Array.from(m))).toEqual([
      [LayerMask.Both, LayerMask.None],
      [LayerMask.Both, LayerMask.Both],
      [LayerMask.None, LayerMask.Both],
    ]);
    const seen = graph.timeReach(TRAVERSE);
    expect(graph.patterns.some((_, k) => seen.has(nodeKey(k, graph.under(k, TOP))))).toBe(true);
    // Avec la première étoile seule, ou sans étoile, le dessus de l'armoire reste hors d'atteinte.
    const dark = erasedLevel(room, room.erase?.groups.map(() => LayerMask.None) ?? []);
    for (const variant of [graph.variant(0), dark]) {
      const a = seaAnalysis(variant);
      const from = standOn(variant, TRAVERSE);
      const seenStatic = new Set([from]);
      const queue = [from];
      for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
        for (const m of a.moves) {
          if (
            m.from === s &&
            m.windowMs >= DIFFICULTY_MIN_WINDOW_MS.hard &&
            !seenStatic.has(m.to)
          ) {
            seenStatic.add(m.to);
            queue.push(m.to);
          }
        }
      }
      expect(seenStatic.has(standOn(variant, TOP))).toBe(false);
    }
  });

  it('une étoile qui va s’éteindre laisse un appui à portée, aussi haut ou plus haut, pendant l’annonce', () => {
    for (const key of graph.timeReach(TRAVERSE)) {
      const [k = 0, s = 0] = key.split(':').map(Number);
      const surface = graph.analysis(k).map.surfaces[s];
      if (!surface || graph.after(k, s) >= 0) {
        continue;
      }
      const safe = [...graph.reach(k, s)].filter(
        (t) =>
          graph.after(k, t) >= 0 && (graph.analysis(k).map.surfaces[t]?.row ?? 99) <= surface.row,
      );
      const best = Math.min(...safe.map((t) => fastest(graph.analysis(k), s, t, EASY)));
      expect(best, `motif ${String(k)}, surface ${String(s)}`).toBeLessThanOrEqual(
        DEFAULT_COMBAT.lullabyWarnMs,
      );
    }
  });

  it('jamais coincée : de partout, avec le temps, le dessus de l’armoire reste atteignable', () => {
    const top = (k: number) => nodeKey(k, graph.under(k, TOP));
    const from = graph.timeReach(IMMENSE_START);
    for (const lamp of [CAP, HEAD, TRAVERSE]) {
      expect(
        graph.patterns.some((_, k) => from.has(nodeKey(k, graph.under(k, lamp)))),
        `${String(lamp.col)},${String(lamp.row)}`,
      ).toBe(true);
    }
    for (const key of from) {
      const later = graph.timeReachFrom(key);
      expect(
        graph.patterns.some((_, k) => later.has(top(k))),
        key,
      ).toBe(true);
    }
  });
});
