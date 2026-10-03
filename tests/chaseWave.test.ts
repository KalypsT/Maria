import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { GROWTH_PHASES, phaseMovement, type GrowthPhase } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { analyzeLevel, type LevelAnalysis } from '../src/core/analysis/analyzeLevel';
import { Chase } from '../src/core/boss/Chase';
import { EntityType, type LevelData, type TilePos } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { COURSE_IDS, LEVELS } from '../src/levels';
import { chaseRun } from './pace';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** Le rythme de la vague (D-103) et le parcours d'essai 14. */
const P = DEFAULT_COMBAT;
const HZ = 120;
const easy = DIFFICULTY_MIN_WINDOW_MS.easy;

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}

function course(): LevelData {
  const source = need(
    LEVELS.find((l) => l.id === 'vague'),
    'parcours 14',
  );
  return parseAsciiLevel('vague', source.text);
}

const P3 = need(GROWTH_PHASES[2], 'phase 3');
const P1 = need(GROWTH_PHASES[0], 'phase 1');
const analyses = new Map<string, LevelAnalysis>();
function analysis(phase: GrowthPhase, without: 'slide' | 'wallJump' | null = null): LevelAnalysis {
  const key = `${String(phase.id)}:${String(without)}`;
  let a = analyses.get(key);
  if (!a) {
    a = analyzeLevel(course(), phaseMovement(DEFAULT_MOVEMENT, phase), {
      climb: true,
      wallJump: without !== 'wallJump',
      slide: without !== 'slide',
      hitbox: phase.hitbox,
    });
    analyses.set(key, a);
  }
  return a;
}

/** Départ, lanternes (de gauche à droite), arrivée : les bornes des tronçons. */
function stops(level: LevelData): TilePos[] {
  return [
    level.spawn,
    ...level.entities.filter((e) => e.type === EntityType.Checkpoint).sort((a, b) => a.col - b.col),
    need(level.goal, 'arrivée'),
  ];
}

const box = (x: number) => ({ x, y: 12 * T - 28, width: 12, height: 28 });

describe('le rythme de la vague (D-103)', () => {
  it('@chase-look: wave, seulement à l’horizontale', () => {
    const chase = need(course().chase, 'poursuite');
    expect(chase.look).toBe('wave');
    expect(chase.dir).toBe('right');
    expect(chase.end).toBe(117);
    const bad = (extra: string) => () => parseAsciiLevel('c', `${extra}\n######\n#P...#\n######`);
    expect(bad('; @chase: 1\n; @chase-phase: 1 1\n; @chase-look: wave')).toThrow(/horizontale/);
    expect(bad('; @chase: right 4\n; @chase-phase: 4 1\n; @chase-look: lame')).toThrow(/mal formé/);
    // Les autres poursuites gardent leur allure.
    const other = need(
      LEVELS.find((l) => l.id === 'poursuite-horizontale'),
      'parcours 12',
    );
    expect(parseAsciiLevel('p', other.text).chase?.look).toBe('default');
  });

  it('elle déferle à la vitesse de la salle, puis se retire un instant, et recommence', () => {
    const level = course();
    const speed = need(level.chase?.phases[0], 'phase').speed;
    const chase = new Chase(need(level.chase, 'poursuite'), P, HZ);
    // Céleste loin devant : ni contact ni rattrapage ne jouent (rattrapage coupé).
    const params = { ...P, chaseCatchUpRate: 0 };
    chase.setParams(params);
    // Elle part derrière Céleste, puis Céleste est déjà loin devant.
    chase.step(box(10 * T), false);
    const b = box(116 * T);
    for (let s = 0; s < (P.chaseSideStartDelayMs / 1000) * HZ + 1; s++) {
      chase.step(b, false);
    }
    expect(chase.wave).toBe(true);
    // Une vague complète : on compte les pas où elle avance, puis ceux où elle recule.
    let surge = 0;
    let back = 0;
    let advanced = 0;
    let retreated = 0;
    let maxSwell = 0;
    while (back === 0 || chase.backwash) {
      const x = chase.front;
      chase.step(b, false);
      if (chase.backwash) {
        back++;
        retreated += x - chase.front;
      } else {
        surge++;
        advanced += chase.front - x;
        maxSwell = Math.max(maxSwell, chase.swell);
      }
    }
    expect(Math.abs(surge - (P.surgeMs / 1000) * HZ)).toBeLessThanOrEqual(1);
    expect(Math.abs(back - (P.backwashMs / 1000) * HZ)).toBeLessThanOrEqual(1);
    expect(advanced).toBeCloseTo((speed * T * surge) / HZ, 3);
    expect(retreated).toBeCloseTo((P.backwashSpeed * T * back) / HZ, 3);
    expect(maxSwell).toBeGreaterThan(0.99);
    // Elle recommence à déferler.
    expect(chase.backwash).toBe(false);
  });

  it('pendant le reflux, elle ne touche pas ; le cycle repart à chaque essai', () => {
    const chase = new Chase(need(course().chase, 'poursuite'), P, HZ);
    const b = box(40 * T);
    chase.step(b, false);
    for (let s = 0; s < ((P.chaseSideStartDelayMs + P.surgeMs) / 1000) * HZ + 2; s++) {
      chase.front = b.x - 6 * T;
      chase.step(b, false);
    }
    expect(chase.backwash).toBe(true);
    chase.front = b.x + 10;
    expect(chase.step(b, false)).toBe(false);
    chase.restart();
    chase.step(b, false);
    expect(chase.backwash).toBe(false);
    expect(chase.paused).toBe(true);
  });

  it('sans la vague, rien ne change (le chariot du parcours 12)', () => {
    const source = need(
      LEVELS.find((l) => l.id === 'poursuite-horizontale'),
      'parcours 12',
    );
    const chase = new Chase(need(parseAsciiLevel('p', source.text).chase, 'poursuite'), P, HZ);
    expect(chase.wave).toBe(false);
    expect(chase.backwash).toBe(false);
    expect(chase.swell).toBe(1);
  });
});

describe('parcours 14 « La vague » (D-103)', () => {
  it('dans la liste des parcours d’essai', () => {
    expect(COURSE_IDS).toContain('vague');
  });

  it(
    'facile en statique ; impossible sans le saut mural, ni sans la glissade',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      for (const phase of [P3, P1]) {
        const a = analysis(phase);
        expect(a.path, `phase ${String(phase.id)}`).not.toBeNull();
        expect(need(a.critical, 'passage critique').windowMs).toBeGreaterThanOrEqual(easy);
      }
      expect(analysis(P3, 'wallJump').path).toBeNull();
      expect(analysis(P3, 'slide').path).toBeNull();
    },
  );

  it(
    'rythme (phase 3) : le joueur parfait n’est jamais touché ; sans le reflux, il l’est à chaque tronçon ; 50 % plus lent aussi',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const level = course();
      const a = analysis(P3);
      const run = phaseMovement(DEFAULT_MOVEMENT, P3).maxRunSpeed;
      const flat = { ...P, backwashMs: 0 };
      const s = stops(level);
      expect(s).toHaveLength(4);
      for (let i = 0; i + 1 < s.length; i++) {
        const from = need(s[i], 'départ');
        const to = need(s[i + 1], 'fin');
        const label = `colonnes ${String(from.col)} à ${String(to.col)}`;
        const perfect = chaseRun(level, a, from, to, easy, 1, P, P3.hitbox, run);
        expect(perfect.contacts, label).toBe(0);
        expect(perfect.margin, label).toBeGreaterThan(2);
        // Le reflux est nécessaire : une vague qui ne se retire jamais rattrape le joueur parfait.
        expect(chaseRun(level, a, from, to, easy, 1, flat, P3.hitbox, run).contacts, label).toBe(1);
        expect(chaseRun(level, a, from, to, easy, 1.5, P, P3.hitbox, run).contacts, label).toBe(1);
      }
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
