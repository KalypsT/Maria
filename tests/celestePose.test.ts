import { describe, expect, it } from 'vitest';
import { DEFAULT_PUPPET } from '../src/config/puppet';
import { CelestePoser, PoseAttack, type PoseSubject } from '../src/core/player/celestePose';
import { PlayerState } from '../src/core/player/playerState';

const DT = 1 / 120;
const MAX_RUN = 136;

function subject(state: PlayerState, vx = 0, vy = 0): PoseSubject {
  return { state, vx, vy, facing: 1 };
}

function run(poser: CelestePoser, s: PoseSubject, steps: number): void {
  for (let i = 0; i < steps; i++) {
    poser.step(s, PoseAttack.None, 0);
  }
}

describe('Céleste en papier découpé (D-29)', () => {
  it('le pas suit la distance parcourue : un cycle tous les strideLengthPx', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    const steps = 240;
    run(poser, subject(PlayerState.Run, MAX_RUN), steps);
    const distance = MAX_RUN * DT * steps;
    expect(poser.runPhase / (2 * Math.PI)).toBeCloseTo(distance / DEFAULT_PUPPET.strideLengthPx, 6);
    // Deux fois plus vite : deux fois plus de pas pour la même durée.
    const slow = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    run(slow, subject(PlayerState.Run, MAX_RUN / 2), steps);
    expect(slow.runPhase).toBeCloseTo(poser.runPhase / 2, 6);
  });

  it('en course, bras et jambes s’opposent ; à l’arrêt, ils reviennent au repos', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    run(poser, subject(PlayerState.Run, MAX_RUN), 50);
    const pose = poser.pose;
    expect(Math.sign(pose.legFront)).toBe(-Math.sign(pose.legBack));
    expect(Math.sign(pose.armFront)).toBe(-Math.sign(pose.legFront));
    run(poser, subject(PlayerState.Idle), 240);
    expect(Math.abs(pose.legFront)).toBeLessThan(0.01);
    expect(Math.abs(pose.armFront)).toBeLessThan(0.15);
  });

  it('suspendue, les bras montent vers le rebord', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    run(poser, subject(PlayerState.Hang), 60);
    expect(poser.pose.armFront).toBeGreaterThan(2.5);
    expect(poser.pose.armBack).toBeGreaterThan(2.3);
  });

  it('les mouvements restent continus (pas de saut de pose entre deux pas)', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    const states = [
      subject(PlayerState.Run, MAX_RUN),
      subject(PlayerState.Jump, MAX_RUN, -300),
      subject(PlayerState.Fall, MAX_RUN, 300),
      subject(PlayerState.Hang),
      subject(PlayerState.Climb),
      subject(PlayerState.Idle),
      subject(PlayerState.Hurt, -80, -100),
    ];
    const keys = [
      'bodyY',
      'bodyTilt',
      'headTilt',
      'armFront',
      'armBack',
      'legFront',
      'legBack',
      'pigtails',
    ] as const;
    let previous = { ...poser.pose };
    for (const s of states) {
      for (let i = 0; i < 60; i++) {
        poser.step(s, PoseAttack.None, 0);
        for (const key of keys) {
          const value = poser.pose[key];
          expect(Number.isFinite(value), key).toBe(true);
          // Radians, sauf bodyY (px).
          expect(Math.abs(value - previous[key]), `${key} (${s.state})`).toBeLessThan(
            key === 'bodyY' ? 1 : 0.5,
          );
        }
        previous = { ...poser.pose };
      }
    }
  });

  it('les couettes partent vers l’arrière en course et se reposent à l’arrêt', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    run(poser, subject(PlayerState.Run, MAX_RUN), 120);
    expect(poser.pose.pigtails).toBeGreaterThan(0.1);
    run(poser, subject(PlayerState.Idle), 600);
    expect(Math.abs(poser.pose.pigtails)).toBeLessThan(0.02);
    expect(poser.pose.pigtails).toBeLessThanOrEqual((DEFAULT_PUPPET.pigtailMaxDeg * Math.PI) / 180);
  });

  it('le bras avant suit le bâton pendant l’attaque', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    poser.step(subject(PlayerState.Idle), PoseAttack.Startup, 0);
    expect(poser.pose.armFront).toBeCloseTo((150 * Math.PI) / 180, 6);
    poser.step(subject(PlayerState.Idle), PoseAttack.Active, 0.5);
    expect(poser.pose.armFront).toBeCloseTo((70 * Math.PI) / 180, 6);
  });

  it('les couettes sautent : envolée au saut, retombée qui oscille à la réception', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    run(poser, subject(PlayerState.Idle), 240);
    const rest = poser.pose.pigtails;
    let highest = -Infinity;
    for (let i = 0; i < 30; i++) {
      poser.step(subject(PlayerState.Jump, 0, -300), PoseAttack.None, 0);
      highest = Math.max(highest, poser.pose.pigtails);
    }
    expect(highest, 'envolée au saut').toBeGreaterThan(rest + 0.4);
    run(poser, subject(PlayerState.Land), 1);
    let crossings = 0;
    let previous = Math.sign(poser.pose.pigtails - rest);
    for (let i = 0; i < 180; i++) {
      poser.step(subject(PlayerState.Idle), PoseAttack.None, 0);
      const side = Math.sign(poser.pose.pigtails - rest);
      if (side !== 0 && side !== previous) {
        crossings++;
        previous = side;
      }
    }
    expect(crossings, 'rebond visible').toBeGreaterThanOrEqual(2);
    run(poser, subject(PlayerState.Idle), 600);
    expect(Math.abs(poser.pose.pigtails)).toBeLessThan(0.02);
  });

  it('en course, les couettes rebondissent à chaque pas', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    let min = Infinity;
    let max = -Infinity;
    run(poser, subject(PlayerState.Run, MAX_RUN), 120);
    for (let i = 0; i < 120; i++) {
      poser.step(subject(PlayerState.Run, MAX_RUN), PoseAttack.None, 0);
      min = Math.min(min, poser.pose.pigtails);
      max = Math.max(max, poser.pose.pigtails);
    }
    expect(max - min).toBeGreaterThan(0.2);
  });

  it('assise (histoire, D-31) : jambes devant, hanche basse ; reset la relève', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    poser.sitting = true;
    run(poser, subject(PlayerState.Idle), 240);
    expect(poser.pose.legFront).toBeGreaterThan(1.3);
    expect(poser.pose.legBack).toBeGreaterThan(1.2);
    expect(poser.pose.bodyY).toBeGreaterThan(5);
    poser.reset();
    expect(poser.sitting).toBe(false);
  });

  it('sous le parapluie (D-62), le bras le tient en haut ; au sol, il se referme', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    run(poser, subject(PlayerState.Glide, MAX_RUN, 50), 60);
    expect(poser.pose.umbrella).toBeGreaterThan(0.95);
    expect(poser.pose.armFront).toBeGreaterThan(Math.PI * 0.8);
    run(poser, subject(PlayerState.Idle), 60);
    expect(poser.pose.umbrella).toBeLessThan(0.05);
  });

  it('pendue à un câble (D-65), le parapluie replié au bout du bras levé ; ensuite il disparaît', () => {
    const poser = new CelestePoser(DEFAULT_PUPPET, DT, MAX_RUN);
    run(poser, subject(PlayerState.Cable, MAX_RUN, 30), 60);
    expect(poser.pose.hook).toBe(1);
    expect(poser.pose.umbrella).toBeLessThan(0.05);
    expect(poser.pose.armFront).toBeGreaterThan(Math.PI * 0.9);
    run(poser, subject(PlayerState.Glide, MAX_RUN, 50), 1);
    expect(poser.pose.hook).toBe(0);
  });
});
