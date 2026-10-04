import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, LayerMask, type Layer, type LevelData } from '../src/core/level/LevelData';
import {
  bandsGone,
  eraseDissolved,
  eraseFactor,
  erasedLevel,
  wavePatterns,
} from '../src/core/level/erase';
import { checkCondition } from '../src/core/story/story';
import { storyProblems } from '../src/core/story/storyProblems';
import { isMappedRoom } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { PLAY_OBJECTS, STAIRS_BOTTOM } from '../src/levels/nanny/story';
import { chaseRun, fastest } from './pace';
import { SEA_PHASE, seaAnalysis, standOn, standOnAny } from './tideGraph';
import { level, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** L'avant-dernier niveau, PR 10 (D-117) : le boss, l'effacement (la fuite, la salle de jeux). */
const STAIRS = 'nanny-stairs';
const PLAY = 'nanny-playroom';
const TOP = { col: 27, row: 16 };
const SEUIL = { col: 4, row: 14 };

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}

/** Surfaces atteintes depuis `from` dans une analyse. */
function reach(l: LevelData, from: number): Set<number> {
  const a = seaAnalysis(l);
  const seen = new Set([from]);
  const queue = [from];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const m of a.moves) {
      if (m.from === n && !seen.has(m.to)) {
        seen.add(m.to);
        queue.push(m.to);
      }
    }
  }
  return seen;
}

function layerOfSurface(l: LevelData, id: number): Layer {
  return id >= (seaAnalysis(l).presentCount ?? Infinity) ? 'memory' : 'present';
}

describe('le boss, l’effacement (D-117)', () => {
  it('après le torchon, en bas de la cage d’escalier ; les deux salles hors carte', () => {
    const stairs = level(STAIRS);
    expect(standOn(stairs, STAIRS_BOTTOM)).toBeGreaterThanOrEqual(0);
    expect(isMappedRoom(stairs)).toBe(false);
    expect(isMappedRoom(level(PLAY))).toBe(false);
    expect(zone.destination(STAIRS, 1)).toEqual({ room: PLAY, exit: 1 });
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
    // Une veilleuse avant chaque phase : en bas et au milieu de la fuite, en haut, au seuil.
    const lamps = (room: string) =>
      level(room).entities.filter((e) => e.type === EntityType.Checkpoint);
    expect(lamps(STAIRS).length).toBe(3);
    expect(lamps(PLAY).some((l) => l.col === 6 && l.row === 14)).toBe(true);
  });

  it(
    'la fuite : on monte en basculant ; le joueur parfait n’est jamais touché, 50 % plus lent il l’est',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const stairs = level(STAIRS);
      const erase = need(stairs.erase, 'effacement');
      const gone = erasedLevel(stairs, bandsGone(erase));
      const top = standOnAny(gone, TOP);
      expect([...reach(gone, standOn(gone, STAIRS_BOTTOM))].some((s) => top.includes(s))).toBe(
        true,
      );
      const without = seaAnalysis(stairs, 'shift');
      const from = standOn(stairs, STAIRS_BOTTOM, 'shift');
      const seen = new Set([from]);
      const queue = [from];
      for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
        for (const m of without.moves) {
          if (m.from === n && !seen.has(m.to)) {
            seen.add(m.to);
            queue.push(m.to);
          }
        }
      }
      expect(seen.has(standOn(stairs, TOP, 'shift'))).toBe(false);
      const a = seaAnalysis(gone);
      const min = DIFFICULTY_MIN_WINDOW_MS.easy;
      const starts = [
        STAIRS_BOTTOM,
        ...stairs.entities.filter((e) => e.type === EntityType.Checkpoint && e.row > TOP.row),
      ];
      for (const start of starts) {
        const run = chaseRun(gone, a, start, TOP, min, 1, DEFAULT_COMBAT, SEA_PHASE.hitbox);
        expect(run.contacts, `depuis la ligne ${String(start.row)}`).toBe(0);
        expect(run.margin).toBeGreaterThan(2);
      }
      const slow = chaseRun(
        gone,
        a,
        STAIRS_BOTTOM,
        TOP,
        min,
        1.5,
        DEFAULT_COMBAT,
        SEA_PHASE.hitbox,
      );
      expect(slow.contacts).toBeGreaterThan(0);
    },
  );

  it(
    'la salle de jeux : dans chaque motif des vagues, chaque objet est atteint et on n’est jamais coincée',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const room = level(PLAY);
      const erase = need(room.erase, 'effacement');
      const patterns = wavePatterns(erase);
      expect(patterns.length).toBe(4);
      for (const masks of patterns) {
        const l = erasedLevel(room, masks);
        const what = Array.from(masks).join('');
        const lamps = room.entities
          .filter((e) => e.type === EntityType.Checkpoint)
          .flatMap((e) => standOnAny(l, e));
        const reached = reach(l, standOn(l, SEUIL));
        for (const o of PLAY_OBJECTS) {
          expect(
            standOnAny(l, o.at).some((s) => reached.has(s)),
            `${what} : ${o.kind}`,
          ).toBe(true);
        }
        for (const s of reached) {
          expect(
            lamps.some((t) => reach(l, s).has(t)),
            `${what} : surface ${String(s)}`,
          ).toBe(true);
        }
      }
    },
  );

  it(
    'chaque vague est annoncée assez tôt, même à la vitesse la plus grande',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const room = level(PLAY);
      const erase = need(room.erase, 'effacement');
      const patterns = wavePatterns(erase);
      patterns.forEach((masks, k) => {
        const next = patterns[(k + 1) % patterns.length];
        if (!next) {
          return;
        }
        const l = erasedLevel(room, masks);
        const after = erasedLevel(room, next);
        const a = seaAnalysis(l);
        const stays = (id: number) => {
          const s = a.map.surfaces[id];
          if (!s) {
            return false;
          }
          for (let col = s.colStart; col <= s.colEnd; col++) {
            if (standOn(after, { col, row: s.row - 1 }, null, layerOfSurface(l, id)) < 0) {
              return false;
            }
          }
          return true;
        };
        const reached = reach(l, standOn(l, SEUIL));
        const safe = [...reached].filter(stays);
        for (const s of reached) {
          if (!stays(s)) {
            const best = Math.min(...safe.map((t) => fastest(a, s, t, 0)));
            // L'annonce ne dépend pas de la vitesse des vagues (seule la période raccourcit).
            expect(best, `${Array.from(masks).join('')} : ${String(s)}`).toBeLessThanOrEqual(
              DEFAULT_COMBAT.eraseWarnMs,
            );
          }
        }
      });
    },
  );

  it('les cubes se rallument l’un après l’autre et montent la tour d’Eden ; l’effacement recule, accélère, puis se dissout', () => {
    const erase = need(level(PLAY).erase, 'effacement');
    const flags = new Set<string>([F.NannyErasure]);
    let factor = eraseFactor(erase, flags);
    expect(factor).toBe(1);
    const lit = (kind: string) =>
      HOUSE_STORY.props.some(
        (p) => p.room === PLAY && p.kind === kind && checkCondition(flags, p.when),
      );
    PLAY_OBJECTS.forEach((o, k) => {
      // Celui-ci est rallumé (en couleur) ; les suivants sont pâlis.
      expect(lit(o.kind), o.kind).toBe(true);
      for (const later of PLAY_OBJECTS.slice(k + 1)) {
        expect(lit(later.pale), later.pale).toBe(true);
      }
      const t = need(
        HOUSE_STORY.triggers.find((c) => c.id === `nanny-play-${String(k + 1)}`),
        o.kind,
      );
      expect(checkCondition(flags, t.when)).toBe(true);
      expect(t.on).toBe('interact');
      expect(t.steps).toContainEqual({ do: 'flag', id: o.flag });
      flags.add(o.flag);
      // Le cube rejoint la tour d'Eden (D-122) : il quitte sa place, la tour a un cube de plus.
      expect(lit(o.kind), o.kind).toBe(false);
      const towers = HOUSE_STORY.props.filter(
        (p) => p.room === PLAY && p.kind.startsWith('cube-tower') && checkCondition(flags, p.when),
      );
      expect(towers.map((p) => p.kind)).toEqual([`cube-tower-${String(k + 1)}`]);
      if (k < PLAY_OBJECTS.length - 1) {
        const next = eraseFactor(erase, flags);
        expect(next).toBeGreaterThan(factor);
        factor = next;
      }
    });
    expect(eraseDissolved(erase, flags)).toBe(true);
    expect(lit('erasure-figure')).toBe(false);
    // La porte de la salle de jeux s'ouvre.
    const locked = (fs: ReadonlySet<string>) =>
      HOUSE_STORY.lockedRooms.some(
        (l) => l.room === PLAY && l.exit === 2 && checkCondition(fs, l.when),
      );
    expect(locked(new Set([F.NannyErasure]))).toBe(true);
    expect(locked(flags)).toBe(false);
    expect(zone.destination(PLAY, 2)).toEqual({ room: 'nanny-house', exit: 11 });
  });

  it('les bandes de la fuite sont dans les deux couches au départ ; les vagues dans une seule', () => {
    for (const room of [STAIRS, PLAY]) {
      const erase = need(level(room).erase, room);
      for (const g of erase.groups) {
        expect(g.initial === LayerMask.Both, `${room} ${g.id}`).toBe(g.id.startsWith('band'));
      }
    }
  });
});
