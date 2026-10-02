import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT, TUNNEL_CLEAR_PX } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { phaseMovement } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import { checkCondition } from '../src/core/story/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { level, phase, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
const F = StoryFlag;
const P3 = phase(3);
const easy = DIFFICULTY_MIN_WINDOW_MS.easy;
const medium = DIFFICULTY_MIN_WINDOW_MS.medium;

const cache = new Map<string, LevelAnalysis>();
function analysis(room: string, slide = true): LevelAnalysis {
  const key = `${room}:${String(slide)}`;
  let result = cache.get(key);
  if (!result) {
    result = analyzeLevel(level(room), phaseMovement(DEFAULT_MOVEMENT, P3), {
      climb: true,
      wallJump: true,
      glide: true,
      hook: true,
      slide,
      hitbox: P3.hitbox,
    });
    cache.set(key, result);
  }
  return result;
}

function reach(a: LevelAnalysis, from: number, minMs = 0): Set<number> {
  const seen = new Set([from]);
  const queue = [from];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const move of a.moves) {
      if (move.from === n && move.windowMs >= minMs && !seen.has(move.to)) {
        seen.add(move.to);
        queue.push(move.to);
      }
    }
  }
  return seen;
}

/** Surface où l'on arrive par une sortie ou une porte de façade. */
function endSurface(room: string, id: number, a: LevelAnalysis): number {
  const l = level(room);
  const door = l.doors.find((d) => d.id === id);
  if (door) {
    return surfaceUnder(l, a.map, door.col, door.row);
  }
  const exit = l.exits.find((e) => e.id === id);
  if (!exit) {
    throw new Error(`sortie ${room}:${String(id)} absente`);
  }
  return surfaceUnder(l, a.map, exit.side === 'left' ? exit.col + 1 : exit.col - 1, exit.rowMax);
}

/** Chaque voiture : son entrée, les fins à atteindre, et sa difficulté. */
const CARS: { room: string; from: number; to: number[]; min: number }[] = [
  { room: 'train-compartments', from: 1, to: [2], min: medium },
  { room: 'train-baggage', from: 1, to: [3, 2], min: medium },
  { room: 'train-roof', from: 1, to: [2], min: medium },
  { room: 'train-restaurant', from: 2, to: [1], min: easy },
];

describe('le train, PR 3 : les compartiments, le fourgon, le toit, le wagon-restaurant (D-86)', () => {
  it('les voitures se suivent ; le toit relie le fourgon au wagon-restaurant (une boucle)', () => {
    expect(zone.destination('train-couchettes', 1)).toEqual({
      room: 'train-compartments',
      exit: 1,
    });
    expect(zone.destination('train-compartments', 2)).toEqual({ room: 'train-baggage', exit: 1 });
    expect(zone.destination('train-baggage', 3)).toEqual({ room: 'train-roof', exit: 1 });
    expect(zone.destination('train-roof', 2)).toEqual({ room: 'train-restaurant', exit: 2 });
    expect(zone.destination('train-baggage', 2)).toEqual({ room: 'train-restaurant', exit: 1 });
    const lock = (room: string, exit: number) =>
      HOUSE_STORY.lockedRooms.find((l) => l.room === room && l.exit === exit);
    // Avant la nuit, on ne quitte pas la voiture-couchettes.
    const night = lock('train-couchettes', 1);
    expect(night && checkCondition(new Set([F.TrainSlide]), night.when)).toBe(true);
    expect(night && checkCondition(new Set([F.TrainNight]), night.when)).toBe(false);
    // La porte fourgon ↔ restaurant s'ouvre de l'intérieur du restaurant, des deux côtés.
    for (const [room, exit] of [
      ['train-baggage', 2],
      ['train-restaurant', 1],
    ] as const) {
      const l = lock(room, exit);
      expect(l && checkCondition(new Set([F.TrainNight]), l.when), room).toBe(true);
      expect(l && checkCondition(new Set([F.TrainRestaurantOpen]), l.when), room).toBe(false);
    }
    const open = HOUSE_STORY.triggers.find((t) => t.id === 'train-restaurant-door');
    expect(open?.room).toBe('train-restaurant');
    expect(open?.steps.some((s) => s.do === 'flag' && s.id === F.TrainRestaurantOpen)).toBe(true);
  });

  it('toutes les voitures roulent ; dedans, la nuit, les lumières sont éteintes', () => {
    const night = new Set([F.TrainDeparted, F.TrainNight]);
    for (const room of [...zone.rooms.keys()].filter((r) => r.startsWith('train-'))) {
      const moving = HOUSE_STORY.moving?.find((m) => m.room === room);
      expect(moving && checkCondition(night, moving.when), room).toBe(true);
      const dim = HOUSE_STORY.dim?.find((d) => d.room === room);
      expect(dim !== undefined, room).toBe(room !== 'train-roof');
    }
  });

  it.each(CARS)(
    '$room : on la traverse, et de partout on revient à son entrée',
    ({ room, from, to, min }) => {
      const a = analysis(room);
      const start = endSurface(room, from, a);
      const all = reach(a, start);
      for (const id of to) {
        expect(reach(a, start, min).has(endSurface(room, id, a)), `${room} → ${String(id)}`).toBe(
          true,
        );
      }
      const stuck = [...all].filter((s) => !reach(a, s, min).has(start));
      expect(
        stuck.map((s) => a.map.surfaces[s]?.row),
        room,
      ).toEqual([]);
      // Ses trouvailles s'atteignent.
      for (const secret of level(room).entities.filter((e) => e.type === EntityType.Secret)) {
        const target = surfaceUnder(level(room), a.map, secret.col, secret.row);
        expect(all.has(target), `${room} : trouvaille (${String(secret.col)})`).toBe(true);
      }
    },
    TIMEOUT,
  );

  it('la grille vers le fourgon ne se passe qu’en glissant', { timeout: TIMEOUT }, () => {
    const a = analysis('train-compartments', false);
    const start = endSurface('train-compartments', 1, a);
    expect(reach(a, start).has(endSurface('train-compartments', 2, a))).toBe(false);
  });

  it('le toit : un abri à portée pendant l’annonce de chaque tunnel', () => {
    const roof = level('train-roof');
    const row = Number(roof.meta.tunnel);
    expect(Number.isFinite(row)).toBe(true);
    // Colonnes où, debout, la tête reste sous la voûte : un creux ou le soufflet.
    const safe: number[] = [];
    for (let col = 1; col < roof.width - 1; col++) {
      let floor = -1;
      for (let r = row; r < roof.height; r++) {
        if (tileAt(roof, col, r) !== Tile.Empty) {
          floor = r;
          break;
        }
      }
      if (floor >= 0 && floor * T - P3.hitbox.height >= row * T - TUNNEL_CLEAR_PX) {
        safe.push(col);
      }
    }
    const hatch = roof.doors[0];
    if (!hatch) {
      throw new Error('trappe absente');
    }
    // Ce qu'on parcourt en courant pendant l'annonce (prudent : sans la glissade, plus rapide).
    const reachTiles = ((DEFAULT_COMBAT.tunnelWarnMs / 1000) * DEFAULT_MOVEMENT.maxRunSpeed) / T;
    const stops = [1, ...safe, hatch.col];
    for (let col = 1; col < hatch.col; col++) {
      const nearest = Math.min(...stops.map((s) => Math.abs(s - col)));
      expect(nearest, `colonne ${String(col + 1)}`).toBeLessThanOrEqual(reachTiles);
    }
  });

  it('les valises tombent au-dessus d’un plancher où l’on passe', () => {
    const room = level('train-compartments');
    const drops = room.decor.filter((d) => d.kind === 'fallingcase');
    expect(drops.length).toBeGreaterThanOrEqual(3);
    for (const d of drops) {
      expect(tileAt(room, d.col, d.row + 1), `filet sous la valise ${String(d.col)}`).toBe(
        Tile.OneWay,
      );
    }
  });
});
