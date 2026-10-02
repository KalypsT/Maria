import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { GROWTH_PHASES, phaseMovement, type GrowthPhase } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, MoveKind, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { Chase, ChaseEvent } from '../src/core/boss/Chase';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { EntityType, type LevelData, type TilePos } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics } from '../src/core/player/PlayerPhysics';
import { LEVELS } from '../src/levels';
import { chaseRun } from './pace';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const P = DEFAULT_COMBAT;
const HZ = 120;
const easy = DIFFICULTY_MIN_WINDOW_MS.easy;

/** Valeur présente, sinon l'échec du test (sans assertion non nulle). */
function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}

function course(): LevelData {
  const source = need(
    LEVELS.find((l) => l.id === 'poursuite-horizontale'),
    'parcours 12',
  );
  return parseAsciiLevel('poursuite-horizontale', source.text);
}

/** Couloir de 40 colonnes, poursuite vers la gauche (arrivée colonne 3, croc-en-jambe colonnes 20 à 22). */
const LEFT = parseAsciiLevel(
  'gauche',
  [
    '; @chase: left 3',
    '; @chase-phase: 3 4',
    '; @chase-trip: 20 6 3 2 5',
    '#'.repeat(40),
    ...Array.from({ length: 6 }, () => `#${'.'.repeat(38)}#`),
    `#${'.'.repeat(36)}P.#`,
    '#'.repeat(40),
  ].join('\n'),
);

const box = (x: number, feetY: number) => ({ x, y: feetY - 28, width: 12, height: 28 });
const FEET = 12 * T;

/** Pas jusqu'à la fin de l'attente du départ. */
function wait(chase: Chase, b: ReturnType<typeof box>): void {
  for (let s = 0; s < (P.chaseSideStartDelayMs / 1000) * HZ + 1; s++) {
    chase.step(b, false);
  }
}

const P3 = need(GROWTH_PHASES[2], 'phase 3');
const P1 = need(GROWTH_PHASES[0], 'phase 1');
const analyses = new Map<string, LevelAnalysis>();
function analysis(phase: GrowthPhase, slide = true): LevelAnalysis {
  const key = `${String(phase.id)}:${String(slide)}`;
  let a = analyses.get(key);
  if (!a) {
    a = analyzeLevel(course(), phaseMovement(DEFAULT_MOVEMENT, phase), {
      climb: true,
      wallJump: true,
      slide,
      hitbox: phase.hitbox,
    });
    analyses.set(key, a);
  }
  return a;
}

/** Départ, lanternes, arrivée : les bornes des tronçons. */
function stops(level: LevelData): TilePos[] {
  return [
    level.spawn,
    ...level.entities.filter((e) => e.type === EntityType.Checkpoint),
    need(level.goal, 'arrivée'),
  ];
}

describe('poursuite horizontale (boss, D-87)', () => {
  it('@chase : sens, colonne d’arrivée, phases dans le sens de la course', () => {
    const level = course();
    const chase = need(level.chase, 'poursuite');
    expect(chase.dir).toBe('right');
    expect(chase.end).toBe(117);
    expect(chase.phases).toEqual([{ until: 117, speed: 6.5 }]);
    expect(chase.trips).toEqual([{ col: 56, row: 11, width: 8, height: 1, recoil: 6 }]);
    expect(LEFT.chase?.dir).toBe('left');
    const bad = (extra: string) => () => parseAsciiLevel('c', `${extra}\n######\n#P...#\n######`);
    expect(bad('; @chase: right 4\n; @chase-phase: 3 1\n; @chase-phase: 2 1')).toThrow(
      /sens de la poursuite/,
    );
    expect(bad('; @chase: left 1\n; @chase-phase: 1 1\n; @chase-phase: 2 1')).toThrow(
      /sens de la poursuite/,
    );
    expect(bad('; @chase: right 9\n; @chase-phase: 9 1')).toThrow(/hors de la salle/);
    expect(bad('; @chase: down 1\n; @chase-phase: 1 1')).toThrow(/mal formé/);
  });

  it('il attend dans son dos, puis avance à vitesse constante (vers la droite)', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    const b = box(30 * T, FEET);
    chase.step(b, false);
    expect(chase.horizontal).toBe(true);
    expect(chase.front).toBe(b.x - P.chaseSideRestartGapTiles * T);
    expect(chase.lead(b)).toBeCloseTo(P.chaseSideRestartGapTiles, 6);
    wait(chase, b);
    const x0 = chase.front;
    // Une demi-seconde (Céleste immobile : une seconde entière, il la toucherait).
    for (let s = 0; s < HZ / 2; s++) {
      chase.step(b, false);
    }
    expect(chase.front - x0).toBeCloseTo(3.25 * T, 3);
  });

  it('vers la gauche : le même, en miroir (dos à droite, il avance vers la gauche)', () => {
    const chase = new Chase(need(LEFT.chase, 'poursuite'), P, HZ);
    const b = box(30 * T, 8 * T);
    chase.step(b, false);
    expect(chase.front).toBe(b.x + b.width + P.chaseSideRestartGapTiles * T);
    wait(chase, b);
    const x0 = chase.front;
    for (let s = 0; s < HZ; s++) {
      chase.step(b, false);
    }
    expect(x0 - chase.front).toBeCloseTo(4 * T, 3);
    // Arrivée : le dos de Céleste passe le bord droit de la colonne 3.
    chase.step(box(4 * T - 12, 8 * T), false);
    expect(chase.done).toBe(true);
    const x = chase.front;
    chase.step(box(4 * T - 12, 8 * T), false);
    expect(chase.front).toBeGreaterThan(x);
  });

  it('le toucher : quand le front passe son dos ; il recule et s’arrête ; invulnérable, rien', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    const b = box(30 * T, FEET);
    chase.step(b, false);
    chase.front = b.x + 2;
    expect(chase.step(b, false)).toBe(false);
    chase.front = b.x + 10;
    expect(chase.step(b, false)).toBe(true);
    expect(chase.events & ChaseEvent.Contact).toBeTruthy();
    expect(chase.front).toBeLessThanOrEqual(b.x - P.chaseContactRecoilTiles * T);
    expect(chase.paused).toBe(true);
    expect(chase.jolts).toBe(1);
    chase.front = b.x + 10;
    expect(chase.step(b, true)).toBe(false);
  });

  it('la poutre basse le fait trébucher, une fois par essai', () => {
    const level = course();
    const trip = need(need(level.chase, 'poursuite').trips[0], 'croc-en-jambe');
    const chase = new Chase(need(level.chase, 'poursuite'), P, HZ);
    // Couchée sous la poutre (hitbox basse), puis encore dessous : une seule fois.
    const low = { x: (trip.col + 1) * T, y: FEET - 12, width: 12, height: 12 };
    chase.step(box(40 * T, FEET), false);
    const before = chase.front;
    chase.step(low, false);
    expect(chase.events & ChaseEvent.Trip).toBeTruthy();
    expect(chase.front).toBeCloseTo(before - trip.recoil * T, 3);
    chase.step(low, false);
    expect(chase.events & ChaseEvent.Trip).toBeFalsy();
    chase.restart();
    chase.step(low, false);
    expect(chase.events & ChaseEvent.Trip).toBeTruthy();
  });

  it('dans le combat : le toucher la pousse en avant (sens de la fuite) et un peu vers le haut ; la peur monte', () => {
    const level = course();
    const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, 30 * T, FEET - 22);
    const combat = new CombatWorld(level, P);
    combat.step(player, false);
    const chase = need(combat.chase, 'poursuite');
    chase.front = player.box.x + 10;
    combat.step(player, false);
    expect(combat.events & CombatEvent.Hurt).toBeTruthy();
    expect(player.vx).toBe(P.chaseContactPushX);
    expect(player.vy).toBe(-P.chaseContactHopY);
  });

  it(
    'l’analyse donne le point d’atterrissage des passages en courant, sur la surface atteinte',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const a = analysis(P3);
      const running = a.moves.filter(
        (m) => m.kind === MoveKind.RunningJump && m.to >= 0 && m.to < a.map.surfaces.length,
      );
      expect(running.length).toBeGreaterThan(0);
      for (const m of running) {
        const to = need(a.map.surfaces[m.to], 'surface');
        const x = need(m.toX, 'atterrissage');
        expect(x + 12).toBeGreaterThan(to.colStart * T);
        expect(x).toBeLessThan((to.colEnd + 1) * T);
      }
    },
  );

  it(
    'parcours 12 : facile en statique, impossible sans la glissade',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      for (const phase of [P3, P1]) {
        const a = analysis(phase);
        expect(a.path, `phase ${String(phase.id)}`).not.toBeNull();
        expect(need(a.critical, 'passage critique').windowMs).toBeGreaterThanOrEqual(easy);
      }
      expect(analysis(P3, false).path).toBeNull();
    },
  );

  it(
    'rythme (phase 3, le train) : chaque tronçon prend 40 à 80 % du temps du poursuivant ; le joueur parfait n’est jamais touché, 50 % plus lent il l’est',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const level = course();
      const a = analysis(P3);
      const run = phaseMovement(DEFAULT_MOVEMENT, P3).maxRunSpeed;
      const speed = need(level.chase?.phases[0], 'phase').speed;
      const s = stops(level);
      for (let i = 0; i + 1 < s.length; i++) {
        const from = need(s[i], 'départ');
        const to = need(s[i + 1], 'fin');
        const label = `colonnes ${String(from.col)} à ${String(to.col)}`;
        const perfect = chaseRun(level, a, from, to, easy, 1, P, P3.hitbox, run);
        // Temps du poursuivant jusque-là : attente, écart au départ, puis sa vitesse.
        const chaserMs =
          P.chaseSideStartDelayMs +
          ((P.chaseSideRestartGapTiles + to.col - from.col) / speed) * 1000;
        const ratio = perfect.timeMs / chaserMs;
        expect(ratio, label).toBeGreaterThanOrEqual(0.4);
        expect(ratio, label).toBeLessThanOrEqual(0.8);
        expect(perfect.contacts, label).toBe(0);
        expect(perfect.margin, label).toBeGreaterThan(2);
      }
      const goal = need(level.goal, 'arrivée');
      const slow = chaseRun(level, a, level.spawn, goal, easy, 1.5, P, P3.hitbox, run);
      expect(slow.contacts).toBeGreaterThan(0);
    },
  );

  it(
    'en phase 1 (parcours lancé sans avoir grandi) : le joueur parfait n’est jamais touché',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const level = course();
      const a = analysis(P1);
      const run = phaseMovement(DEFAULT_MOVEMENT, P1).maxRunSpeed;
      const s = stops(level);
      for (let i = 0; i + 1 < s.length; i++) {
        const perfect = chaseRun(
          level,
          a,
          need(s[i], 'départ'),
          need(s[i + 1], 'fin'),
          easy,
          1,
          P,
          P1.hitbox,
          run,
        );
        expect(perfect.contacts).toBe(0);
      }
    },
  );
});
