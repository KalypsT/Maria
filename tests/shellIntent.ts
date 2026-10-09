import { describe, expect, it } from 'vitest';
import { Ability } from '../src/config/abilities';
import { GROWTH_PHASES, phaseMovement } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS, type Difficulty } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import {
  analyzeLevel,
  layerSurfaceUnder,
  type AnalysisAbilities,
  type LevelAnalysis,
} from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { EntityType, type LevelData, type ShellIntent } from '../src/core/level/LevelData';
import { atTide } from '../src/core/level/tide';
import { buildZone } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { HOUSE } from '../src/levels/house/zone';
import { ANALYSIS_TIMEOUT_MS as TIMEOUT } from './timeouts';

/**
 * Vérification de l'intention de chaque coquille (D-148, `; @shell:`) : depuis les entrées de sa
 * salle (ou le départ donné par `from`), atteignable à la difficulté voulue, exactement, avec les
 * capacités de ce moment du jeu ; impossible sans chacune des capacités nommées ; impossible avant
 * la croissance (`growth`). La vraie simulation (D-16), salle par salle.
 */
export const zone = buildZone(HOUSE);

/** Les capacités dans l'ordre où on les trouve. */
const ORDER = [Ability.Climb, Ability.WallJump, Ability.Umbrella, Ability.Hook, Ability.Slide];
const ANALYSIS_KEY: Readonly<Record<string, keyof AnalysisAbilities>> = {
  [Ability.Climb]: 'climb',
  [Ability.WallJump]: 'wallJump',
  [Ability.Umbrella]: 'glide',
  [Ability.Hook]: 'hook',
  [Ability.Slide]: 'slide',
};
/** Phase de croissance où l'on trouve chaque capacité. */
const ABILITY_PHASE: Readonly<Record<string, number>> = {
  [Ability.Climb]: 1,
  [Ability.WallJump]: 2,
  [Ability.Umbrella]: 2,
  [Ability.Hook]: 2,
  [Ability.Slide]: 3,
};

/**
 * Un lieu, au premier passage : sa phase de croissance et la dernière capacité qu'on a déjà en y
 * arrivant (-1 : aucune). La maison : aucune (l'escalade s'y trouve) ; le jardin : l'escalade…
 */
export function placeStart(room: string): { phase: number; ability: number } {
  if (room.startsWith('garden-')) {
    return { phase: 2, ability: 0 };
  }
  if (['street', 'playground', 'shop', 'site', 'schoolyard', 'school'].includes(room)) {
    return { phase: 2, ability: 1 };
  }
  if (room.startsWith('station-')) {
    return { phase: 2, ability: 2 };
  }
  if (room.startsWith('train-')) {
    return { phase: 3, ability: 3 };
  }
  if (room.startsWith('sea-')) {
    return { phase: 3, ability: 4 };
  }
  return { phase: 1, ability: -1 };
}

export interface Stage {
  readonly phase: number;
  /** Capacités possédées (indices de `ORDER`). */
  readonly abilities: readonly number[];
}

/** Le moment du jeu d'une coquille : ses capacités et sa phase. */
export function shellStage(room: string, intent: ShellIntent): Stage {
  const start = placeStart(room);
  const needed = intent.needs.map((a) => ORDER.indexOf(a as (typeof ORDER)[number]));
  const last = Math.max(start.ability, ...needed);
  const abilities = ORDER.map((_, i) => i).filter((i) => i <= last);
  const phase =
    Math.max(start.phase, ...abilities.map((i) => ABILITY_PHASE[ORDER[i] ?? ''] ?? 1)) +
    (intent.growth ? 1 : 0);
  return { phase: Math.min(phase, 4), abilities };
}

const cache = new Map<string, LevelAnalysis>();
function analysis(level: LevelData, high: boolean, stage: Stage): LevelAnalysis {
  const key = `${level.id}:${String(high)}:${String(stage.phase)}:${stage.abilities.join(',')}`;
  let result = cache.get(key);
  if (!result) {
    const phase = GROWTH_PHASES.find((p) => p.id === stage.phase);
    if (!phase) {
      throw new Error(`phase ${String(stage.phase)} absente`);
    }
    const abilities: Record<string, unknown> = { hitbox: phase.hitbox };
    for (const i of stage.abilities) {
      const k = ANALYSIS_KEY[ORDER[i] ?? ''];
      if (k) {
        abilities[k] = true;
      }
    }
    result = analyzeLevel(atTide(level, high), phaseMovement(DEFAULT_MOVEMENT, phase), abilities);
    cache.set(key, result);
  }
  return result;
}

function under(level: LevelData, a: LevelAnalysis, col: number, row: number): number[] {
  if (a.presentCount !== undefined) {
    return (['present', 'memory'] as const)
      .map((layer) => layerSurfaceUnder(level, a, layer, col, row))
      .filter((s) => s >= 0);
  }
  const s = surfaceUnder(level, a.map, col, row);
  return s >= 0 ? [s] : [];
}

/** Entrées d'une salle : sorties, portes, départ, lanternes, arrivées de l'histoire. */
function entrances(room: string, level: LevelData): [number, number][] {
  const tiles: [number, number][] = [];
  for (const e of level.exits) {
    tiles.push([e.side === 'left' ? e.col + 1 : e.col - 1, e.rowMax]);
  }
  for (const d of level.doors) {
    tiles.push([d.col, d.row]);
  }
  tiles.push([level.spawn.col, level.spawn.row]);
  for (const e of level.entities) {
    if (e.type === EntityType.Checkpoint) {
      tiles.push([e.col, e.row]);
    }
  }
  for (const t of HOUSE_STORY.triggers) {
    for (const s of t.steps) {
      if (s.do === 'room' && s.room === room) {
        tiles.push([s.col, s.row]);
      }
    }
  }
  return tiles;
}

/**
 * Fenêtre du chemin le plus large des entrées jusqu'à la coquille (ms ; Infinity : sans saut ;
 * -1 : impossible). `minWindow` : seuls les passages au moins aussi larges comptent (0 : tous).
 */
export function shellWindow(
  room: string,
  shell: { col: number; row: number; intent: ShellIntent },
  stage: Stage,
): number {
  const base = zone.rooms.get(room);
  if (!base) {
    throw new Error(`salle ${room} absente`);
  }
  const level = atTide(base, shell.intent.high);
  const a = analysis(base, shell.intent.high, stage);
  const n = a.map.surfaces.length;
  const sources = new Set<number>();
  const from = shell.intent.from ? [[shell.intent.from.col, shell.intent.from.row]] : null;
  for (const [c, r] of from ?? entrances(room, level)) {
    for (const s of under(level, a, c ?? 0, r ?? 0)) {
      sources.add(s);
    }
  }
  const best = new Float64Array(n).fill(-1);
  const out = new Map<number, { to: number; w: number }[]>();
  for (const m of a.moves) {
    const list = out.get(m.from) ?? [];
    list.push({ to: m.to, w: m.windowMs });
    out.set(m.from, list);
  }
  const done = new Uint8Array(n);
  for (const s of sources) {
    best[s] = Number.POSITIVE_INFINITY;
  }
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!done[i] && (best[i] ?? -1) > -1 && (u < 0 || (best[i] ?? -1) > (best[u] ?? -1))) {
        u = i;
      }
    }
    if (u < 0) {
      break;
    }
    done[u] = 1;
    for (const e of out.get(u) ?? []) {
      const w = Math.min(best[u] ?? -1, e.w);
      if (w > (best[e.to] ?? -1)) {
        best[e.to] = w;
      }
    }
  }
  let targets: number[] = [];
  for (let k = 0; k <= 3 && targets.length === 0; k++) {
    targets = under(level, a, shell.col, shell.row + k);
  }
  return targets.reduce((w, t) => Math.max(w, best[t] ?? -1), -1);
}

/** Difficulté d'une fenêtre (null : impossible, ou plus dur que « difficile »). */
export function difficultyOf(windowMs: number): Difficulty | null {
  for (const d of ['easy', 'medium', 'hard'] as const) {
    if (windowMs >= DIFFICULTY_MIN_WINDOW_MS[d]) {
      return d;
    }
  }
  return null;
}

/** Les coquilles d'une liste de salles, avec leur intention. */
export function shellsOf(rooms: readonly string[]) {
  return rooms.flatMap((room) =>
    (zone.rooms.get(room)?.entities ?? [])
      .filter((e) => e.type === EntityType.Shell)
      .map((e) => ({ room, name: e.name ?? '?', col: e.col, row: e.row, intent: e.intent })),
  );
}

/** Le moment juste avant une capacité (sans elle ni les suivantes), à la même phase. */
export function withoutAbility(stage: Stage, ability: string): Stage {
  const i = ORDER.indexOf(ability as (typeof ORDER)[number]);
  return { phase: stage.phase, abilities: stage.abilities.filter((k) => k < i) };
}

/**
 * Les tests d'un lieu (D-148) : chaque coquille de ses salles a son intention, et la tient :
 * exactement à sa difficulté, impossible sans chaque capacité nommée et avant la croissance.
 */
export function describeShells(title: string, rooms: readonly string[]): void {
  describe(title, () => {
    const shells = shellsOf(rooms);

    it('chacune a son intention', () => {
      expect(shells.filter((s) => !s.intent).map((s) => s.name)).toEqual([]);
    });

    it.each(shells.filter((s) => s.intent && !s.intent.crawl))(
      '$name ($room)',
      { timeout: TIMEOUT },
      (shell) => {
        const intent = shell.intent;
        if (!intent) {
          return;
        }
        const stage = shellStage(shell.room, intent);
        const at = { ...shell, intent };
        const w = shellWindow(shell.room, at, stage);
        // Exactement à sa difficulté : faisable, et pas plus facile.
        expect(difficultyOf(w), `fenêtre ${String(Math.round(w))} ms`).toBe(intent.difficulty);
        for (const ability of intent.needs) {
          const without = shellWindow(shell.room, at, withoutAbility(stage, ability));
          expect(without, `sans ${ability}`).toBeLessThan(DIFFICULTY_MIN_WINDOW_MS.hard);
        }
        if (intent.growth) {
          const before = shellWindow(shell.room, at, { ...stage, phase: stage.phase - 1 });
          expect(before, 'avant la croissance').toBeLessThan(DIFFICULTY_MIN_WINDOW_MS.hard);
        }
      },
    );
  });
}
