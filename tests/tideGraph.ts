import { Ability } from '../src/config/abilities';
import { GROWTH_PHASES, phaseMovement, type GrowthPhase } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS, type Difficulty } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import {
  analyzeLevel,
  layerSurfaceUnder,
  type LevelAnalysis,
} from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import {
  EntityType,
  type Layer,
  type LevelData,
  type LevelLeg,
  type TilePos,
} from '../src/core/level/LevelData';
import { atLayer } from '../src/core/level/layers';
import { atTide } from '../src/core/level/tide';
import type { StoryData } from '../src/core/story/story';
import type { Zone } from '../src/core/world/zone';

/**
 * Faisabilité de la station balnéaire (D-95, D-96) : Céleste en phase 3, ses cinq capacités, la
 * glissade analysée (D-84) ; la marée comme un état de plus du graphe (une salle par marée, les
 * bancs passent d'un état à l'autre) ; les tronçons `; @leg:` d'une salle. Avec la bascule (D-107),
 * une salle à deux couches est analysée en une fois : ses surfaces du souvenir sont numérotées après
 * celles du présent.
 */

function phase3(): GrowthPhase {
  const p = GROWTH_PHASES.find((g) => g.id === 3);
  if (!p) {
    throw new Error('phase 3 absente');
  }
  return p;
}
const P3 = phase3();
export const SEA_PHASE = P3;

/** Capacités qu'un tronçon peut exiger (`; @leg:`), et ce qui se retire sans elles. */
const WITHOUT: Readonly<Record<string, Readonly<Record<string, boolean>>>> = {
  [Ability.Climb]: { climb: false },
  [Ability.WallJump]: { wallJump: false },
  // Le crochet ne sert qu'en planant (D-65).
  [Ability.Umbrella]: { glide: false, hook: false },
  [Ability.Hook]: { hook: false },
  [Ability.Slide]: { slide: false },
  [Ability.Shift]: { shift: false },
};

const cache = new WeakMap<LevelData, Map<string, LevelAnalysis>>();

/** Analyse d'une salle (une variante de marée) en phase 3, toutes capacités sauf `without`. */
export function seaAnalysis(level: LevelData, without: string | null = null): LevelAnalysis {
  let byKey = cache.get(level);
  if (!byKey) {
    byKey = new Map();
    cache.set(level, byKey);
  }
  const key = without ?? 'all';
  let result = byKey.get(key);
  if (!result) {
    result = analyzeLevel(level, phaseMovement(DEFAULT_MOVEMENT, P3), {
      climb: true,
      wallJump: true,
      glide: true,
      hook: true,
      slide: true,
      shift: true,
      hitbox: P3.hitbox,
      ...(without ? WITHOUT[without] : {}),
    });
    byKey.set(key, result);
  }
  return result;
}

/**
 * Surface où l'on se tient debout sur la tuile (col, row) (-1 : aucune), dans une couche (D-107 ;
 * le présent par défaut, sans effet dans une salle à une couche).
 */
export function standOn(
  level: LevelData,
  at: TilePos,
  without: string | null = null,
  layer: Layer = 'present',
): number {
  const a = seaAnalysis(level, without);
  return a.presentCount === undefined
    ? surfaceUnder(level, a.map, at.col, at.row)
    : layerSurfaceUnder(level, a, layer, at.col, at.row);
}

/** Surfaces où l'on se tient sur la tuile, dans chaque couche (une seule sans couches). */
export function standOnAny(level: LevelData, at: TilePos, without: string | null = null): number[] {
  const found = new Set([
    standOn(level, at, without, 'present'),
    standOn(level, at, without, 'memory'),
  ]);
  found.delete(-1);
  return [...found];
}

function reach(a: LevelAnalysis, from: number, minWindow: number): Set<number> {
  const next = new Map<number, number[]>();
  for (const m of a.moves) {
    if (m.windowMs >= minWindow) {
      next.set(m.from, [...(next.get(m.from) ?? []), m.to]);
    }
  }
  const seen = new Set([from]);
  const queue = [from];
  for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
    for (const t of next.get(s) ?? []) {
      if (!seen.has(t)) {
        seen.add(t);
        queue.push(t);
      }
    }
  }
  return seen;
}

const EASIER: Readonly<Record<Difficulty, Difficulty | null>> = {
  easy: null,
  medium: 'easy',
  hard: 'medium',
};

/**
 * Problèmes d'un tronçon (D-96) : difficulté exacte (faisable aux fenêtres de sa difficulté, pas à
 * celles de la difficulté plus facile), impossible sans chacune des capacités exigées.
 */
export function legProblems(level: LevelData, leg: LevelLeg): string[] {
  const variant = atTide(level, leg.tide === 'high');
  const what = `${level.id} ${String(leg.from.col)},${String(leg.from.row)} → ${String(leg.to.col)},${String(leg.to.row)} (${leg.tide})`;
  const problems: string[] = [];
  const a = seaAnalysis(variant);
  const from = standOn(variant, leg.from, null, leg.layer);
  const to = standOnAny(variant, leg.to);
  if (from < 0 || to.length === 0) {
    return [`${what} : on ne s'y tient pas debout`];
  }
  const reaches = (set: Set<number>, targets: readonly number[]) => targets.some((t) => set.has(t));
  if (!reaches(reach(a, from, DIFFICULTY_MIN_WINDOW_MS[leg.difficulty]), to)) {
    problems.push(`${what} : plus dur que ${leg.difficulty}`);
  }
  const easier = EASIER[leg.difficulty];
  if (easier && reaches(reach(a, from, DIFFICULTY_MIN_WINDOW_MS[easier]), to)) {
    problems.push(`${what} : aussi faisable en ${easier}`);
  }
  for (const ability of leg.needs) {
    // Sans la bascule, Céleste reste dans la couche de départ du tronçon.
    const alone = ability === Ability.Shift ? atLayer(variant, leg.layer) : variant;
    const without = seaAnalysis(alone, ability);
    const start = standOn(alone, leg.from, ability, leg.layer);
    if (start >= 0 && reaches(reach(without, start, 0), standOnAny(alone, leg.to, ability))) {
      problems.push(`${what} : faisable sans ${ability}`);
    }
  }
  return problems;
}

export type TideNode = string;
export const tideNode = (room: string, high: boolean, surface: number): TideNode =>
  `${room}@${high ? 'high' : 'low'}#${String(surface)}`;

/** Surface d'arrivée d'une sortie ou d'une porte (et d'où on la franchit). */
function endSurface(level: LevelData, id: number): number {
  const door = level.doors.find((d) => d.id === id);
  if (door) {
    return standOn(level, door);
  }
  const exit = level.exits.find((e) => e.id === id);
  if (!exit) {
    throw new Error(`sortie ${level.id}:${String(id)} absente`);
  }
  return standOn(level, {
    col: exit.side === 'left' ? exit.col + 1 : exit.col - 1,
    row: exit.rowMax,
  });
}

/**
 * Graphe des salles `rooms` d'une zone, la marée comme un état (D-95) : chaque nœud est une
 * surface d'une salle à une marée. Passages des analyses (fenêtre au moins `minWindow`), sorties et
 * portes (même marée), et les bancs : un déclencheur dont le script retourne la marée et replace
 * Céleste (`place`) mène de sa zone à cet endroit, à l'autre marée.
 */
export function tideGraph(
  zone: Zone,
  story: StoryData,
  rooms: readonly string[],
  minWindow = 0,
): Map<TideNode, Set<TideNode>> {
  const graph = new Map<TideNode, Set<TideNode>>();
  const edge = (from: TideNode, to: TideNode) => {
    const set = graph.get(from) ?? new Set<TideNode>();
    set.add(to);
    graph.set(from, set);
  };
  const levelOf = (room: string) => {
    const level = zone.rooms.get(room);
    if (!level) {
      throw new Error(`salle ${room} absente`);
    }
    return level;
  };
  const inGraph = new Set(rooms);
  for (const room of rooms) {
    for (const high of [false, true]) {
      const level = atTide(levelOf(room), high);
      for (const m of seaAnalysis(level).moves) {
        if (m.windowMs >= minWindow) {
          edge(tideNode(room, high, m.from), tideNode(room, high, m.to));
        }
      }
      for (const end of [...level.exits, ...level.doors]) {
        const to = zone.destination(room, end.id);
        if (to && inGraph.has(to.room)) {
          const other = atTide(levelOf(to.room), high);
          edge(
            tideNode(room, high, endSurface(level, end.id)),
            tideNode(to.room, high, endSurface(other, to.exit)),
          );
        }
      }
    }
  }
  for (const bench of benches(story).filter((b) => inGraph.has(b.room))) {
    for (const high of [false, true]) {
      const level = atTide(levelOf(bench.room), high);
      const target = atTide(levelOf(bench.room), !high);
      const to = tideNode(bench.room, !high, standOn(target, bench.place));
      for (const s of areaSurfaces(level, bench.area)) {
        edge(tideNode(bench.room, high, s), to);
      }
    }
  }
  return graph;
}

/** Bancs des marées : déclencheurs dont le script retourne la marée, et où ils replacent Céleste. */
export function benches(story: StoryData): {
  readonly id: string;
  readonly room: string;
  readonly area: { col: number; row: number; w: number; h: number };
  readonly place: TilePos;
}[] {
  return story.triggers.flatMap((t) => {
    const toggles = t.steps.some((s) => s.do === 'toggle' && s.id === StoryFlag.TideHigh);
    const place = t.steps.find((s) => s.do === 'place');
    if (!toggles || !t.area || place?.do !== 'place') {
      return [];
    }
    return [{ id: t.id, room: t.room, area: t.area, place: { col: place.col, row: place.row } }];
  });
}

/** Surfaces d'où l'on touche une zone (ses tuiles et la ligne du dessous). */
function areaSurfaces(
  level: LevelData,
  area: { col: number; row: number; w: number; h: number },
): Set<number> {
  const found = new Set<number>();
  for (let row = area.row; row <= area.row + area.h; row++) {
    for (let col = area.col; col < area.col + area.w; col++) {
      const s = standOn(level, { col, row });
      if (s >= 0) {
        found.add(s);
      }
    }
  }
  return found;
}

export function reachableNodes(graph: Map<TideNode, Set<TideNode>>, from: TideNode): Set<TideNode> {
  const seen = new Set([from]);
  const queue = [from];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const next of graph.get(n) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/** Nœuds des lanternes des salles, aux deux marées (une lanterne est au sec aux deux, D-95). */
export function lanternNodes(zone: Zone, rooms: readonly string[]): Set<TideNode> {
  const nodes = new Set<TideNode>();
  for (const room of rooms) {
    const base = zone.rooms.get(room);
    for (const high of [false, true]) {
      const level = base && atTide(base, high);
      for (const e of level?.entities ?? []) {
        if (level && e.type === EntityType.Checkpoint) {
          // Le sol d'une lanterne est commun aux deux couches (D-107).
          for (const s of standOnAny(level, e)) {
            nodes.add(tideNode(room, high, s));
          }
        }
      }
    }
  }
  return nodes;
}

/**
 * Nœuds atteints d'où l'on ne peut plus rejoindre un nœud sûr (lanterne, banc) : Céleste coincée.
 * La recherche part des nœuds sûrs, à rebours.
 */
export function stuckNodes(
  graph: Map<TideNode, Set<TideNode>>,
  reached: Iterable<TideNode>,
  safe: Iterable<TideNode>,
): TideNode[] {
  const back = new Map<TideNode, TideNode[]>();
  for (const [from, tos] of graph) {
    for (const to of tos) {
      back.set(to, [...(back.get(to) ?? []), from]);
    }
  }
  const ok = new Set(safe);
  const queue = [...ok];
  for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
    for (const prev of back.get(n) ?? []) {
      if (!ok.has(prev)) {
        ok.add(prev);
        queue.push(prev);
      }
    }
  }
  return [...reached].filter((n) => !ok.has(n));
}
