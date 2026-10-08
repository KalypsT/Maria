import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { StoryFlag as F } from '../src/config/story';
import { DEFAULT_WORLD } from '../src/config/world';
import { EntityType, LayerMask, Tile } from '../src/core/level/LevelData';
import { erasedLevel } from '../src/core/level/erase';
import { checkCondition } from '../src/core/story/story';
import { RunState } from '../src/core/world/RunState';
import { isMappedRoom, isStrangeRoom, returnLantern } from '../src/core/world/zone';
import { SKY_START } from '../src/levels/finale/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { MILESTONES } from '../src/levels/milestones';
import { lullabyGraph, nodeKey } from './lullabyGraph';
import { fastest } from './pace';
import { seaAnalysis, standOn } from './tideGraph';
import { level } from './zoneGraph';

/**
 * Le dernier niveau, PR 4 (D-142) : le ciel de la chambre. Céleste en phase 3 (même hitbox que la
 * phase 4, un peu plus lente : prudent), toutes ses capacités. Les étoiles de la berceuse suivies
 * dans le temps (`lullabyGraph`) ; tout le reste de la salle est statique.
 */
const ROOM = 'finale-sky';
const room = level(ROOM);
const EASY = DIFFICULTY_MIN_WINDOW_MS.easy;
const MEDIUM = DIFFICULTY_MIN_WINDOW_MS.medium;
/** Les veilleuses : l'armoire, le cadre, la lune du mobile, le rebord, le bureau. */
const WARDROBE = { col: 11, row: 26 };
const FRAME = { col: 46, row: 9 };
const MOON = { col: 90, row: 10 };
const SILL = { col: 126, row: 25 };
const DESK = { col: 145, row: 25 };
/** L'étagère haute, devant la petite porte du grenier : derrière, la chambre grande (D-143). */
const SHELF = { col: 157, row: 19 };
/** Le vide de la nuit, tout en bas. */
const VOID_ROW = 36;

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
const graph = lullabyGraph(room, (v) => seaAnalysis(v), MEDIUM);

/** Surfaces atteintes dans une salle statique, aux fenêtres `minWindow` ou plus. */
function staticReach(variant: typeof room, from: number, minWindow: number): Set<number> {
  const a = seaAnalysis(variant);
  const seen = new Set([from]);
  const queue = [from];
  for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
    for (const m of a.moves) {
      if (m.from === s && m.windowMs >= minWindow && !seen.has(m.to)) {
        seen.add(m.to);
        queue.push(m.to);
      }
    }
  }
  return seen;
}

describe('le ciel de la chambre (D-142)', () => {
  it('un monde étrange hors carte, à la lumière de la veilleuse ; ni danger, ni ennemi, ni trouvaille ; en bas, le vide de la nuit', () => {
    expect(isStrangeRoom(room)).toBe(true);
    expect(isMappedRoom(room)).toBe(false);
    expect(room.meta.palette).toBe('nightlight');
    expect(room.meta.difficulty).toBe('medium');
    expect(room.meta.void).toBe('night');
    expect(room.entities.every((e) => e.type === EntityType.Checkpoint)).toBe(true);
    expect(room.entities.map((e) => ({ col: e.col, row: e.row }))).toEqual(
      expect.arrayContaining([WARDROBE, FRAME, MOON, SILL, DESK]),
    );
    expect(room.entities).toHaveLength(5);
    const dangers = [Tile.Hazard, Tile.Thorns] as number[];
    expect(Array.from(room.tiles).some((t) => dangers.includes(t))).toBe(false);
    // Le vide n'est que tout en bas.
    for (let i = 0; i < room.tiles.length; i++) {
      if (room.tiles[i] === Tile.Water) {
        expect(Math.floor(i / room.width)).toBeGreaterThanOrEqual(VOID_ROW);
      }
    }
    // Pas de sortie : la petite porte du grenier mène à la chambre grande (D-143), par l'histoire.
    expect(room.exits).toHaveLength(0);
  });

  it('on y arrive par le dessus de l’armoire de la chambre immense ; une partie reprise en bas y ramène', () => {
    const sky = trigger('finale-sky');
    expect(sky.room).toBe('finale-bed');
    expect(sky.on).toBe('touch');
    expect(sky.steps).toContainEqual(
      expect.objectContaining({ do: 'room', room: ROOM, ...SKY_START, returnPoint: true }),
    );
    expect(sky.steps).toContainEqual({ do: 'flag', id: F.FinaleSky });
    expect(checkCondition(new Set([F.FinaleEntered]), sky.when)).toBe(true);
    expect(checkCondition(new Set([F.FinaleEntered, F.FinaleSky]), sky.when)).toBe(false);
    const again = trigger('finale-sky-again');
    expect(checkCondition(new Set([F.FinaleEntered, F.FinaleSky]), again.when)).toBe(true);
    // Le point de retour : la veilleuse de l'armoire.
    const lamp = need(returnLantern(room, SKY_START.col, SKY_START.row), 'veilleuse');
    expect({ col: lamp.col, row: lamp.row }).toEqual(WARDROBE);
    expect(MILESTONES.map((m) => ('trigger' in m ? m.trigger : ''))).toContain('finale-sky');
    // La petite porte du grenier : la chambre grande (D-143).
    const door = trigger('finale-big');
    const area = need(door.area, 'zone');
    expect(SHELF.col).toBeGreaterThanOrEqual(area.col);
    expect(SHELF.col).toBeLessThan(area.col + area.w);
    expect(SHELF.row).toBeGreaterThanOrEqual(area.row);
    expect(SHELF.row).toBeLessThan(area.row + area.h);
  });

  it('une chute dans le vide de la nuit ramène au dernier appui, sans peur ; jamais sur une étoile', () => {
    const run = new RunState(room, DEFAULT_WORLD);
    const box = (col: number, row: number) => ({
      x: col * T + 2,
      y: (row + 1) * T - 28,
      width: 12,
      height: 28,
    });
    // Debout sur l'armoire : l'appui est retenu.
    run.step(box(WARDROBE.col - 3, WARDROBE.row), 0, true);
    expect(run.footing).not.toBeNull();
    const kept = { x: run.footing?.x, y: run.footing?.y };
    // Debout sur la première étoile (allumée au départ) : elle peut s'éteindre, l'appui reste
    // celui de l'armoire.
    run.step(box(18, 23), 0, true);
    expect({ x: run.footing?.x, y: run.footing?.y }).toEqual(kept);
    // Dans le vide : ramenée, la peur ne monte pas.
    run.step(box(60, VOID_ROW), 0, false);
    expect(run.splashing).toBe(true);
    expect(run.fear).toBe(0);
  });

  it('le parcours : le mobile au crochet, la fenêtre en basculant, sous le surmeuble, l’étagère haute (tronçons)', () => {
    expect(room.legs.map((l) => [l.difficulty, [...l.needs].sort()])).toEqual([
      ['easy', ['hook', 'umbrella']],
      ['easy', ['shift']],
      ['easy', ['slide']],
      ['medium', ['climb']],
    ]);
  });

  it('les étoiles : en suivant la lumière, le cadre ; sans elles, jamais', () => {
    expect(graph.patterns).toHaveLength(6);
    for (const masks of graph.patterns) {
      const lit = Array.from(masks).filter((m) => m === LayerMask.Both).length;
      expect(lit).toBeGreaterThanOrEqual(1);
      expect(lit).toBeLessThanOrEqual(2);
    }
    const seen = graph.timeReach(SKY_START);
    expect(graph.patterns.some((_, k) => seen.has(nodeKey(k, graph.under(k, FRAME))))).toBe(true);
    const dark = erasedLevel(room, room.erase?.groups.map(() => LayerMask.None) ?? []);
    for (const variant of [graph.variant(0), dark]) {
      const from = standOn(variant, SKY_START);
      const reached = staticReach(variant, from, DIFFICULTY_MIN_WINDOW_MS.hard);
      expect(reached.has(standOn(variant, FRAME))).toBe(false);
    }
  });

  it('une étoile qui va s’éteindre laisse un appui à portée, aussi haut ou plus haut, pendant l’annonce', () => {
    for (const key of graph.timeReach(SKY_START)) {
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

  it('tout le chemin, jusqu’à la petite porte ; jamais coincée : de partout, elle reste atteignable', () => {
    const door = (k: number) => nodeKey(k, graph.under(k, SHELF));
    const from = graph.timeReach(SKY_START);
    for (const lamp of [FRAME, MOON, SILL, DESK, SHELF]) {
      expect(
        graph.patterns.some((_, k) => from.has(nodeKey(k, graph.under(k, lamp)))),
        `${String(lamp.col)},${String(lamp.row)}`,
      ).toBe(true);
    }
    for (const key of from) {
      const later = graph.timeReachFrom(key);
      expect(
        graph.patterns.some((_, k) => later.has(door(k))),
        key,
      ).toBe(true);
    }
  });
});
