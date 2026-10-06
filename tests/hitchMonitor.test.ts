import { describe, expect, it } from 'vitest';
import { HITCH } from '../src/config/perf';
import {
  HitchCause,
  HitchMonitor,
  hitchCause,
  type FrameWork,
} from '../src/core/perf/hitchMonitor';

const FRAME_MS = 1000 / 60;

function work(overrides: Partial<FrameWork> = {}): FrameWork {
  return { updateMs: 2, artMs: 0, roomMs: 0, active: true, veiled: false, ...overrides };
}

/** Une image ordinaire, puis une image de `ms` après une image qui a fait `before`. */
function oneHitch(ms: number, before: Partial<FrameWork>): HitchMonitor {
  const monitor = new HitchMonitor();
  monitor.frame(FRAME_MS, work(), 'rue', 0, 0);
  monitor.frame(FRAME_MS, work(before), 'rue', 0, 0);
  monitor.frame(ms, work(), 'rue', 120, 40);
  return monitor;
}

describe('hitchCause', () => {
  it('attribue la saccade au travail qui occupe une bonne part de l’écart', () => {
    expect(hitchCause(200, 170, 160, 0)).toBe(HitchCause.Art);
    expect(hitchCause(200, 190, 20, 180)).toBe(HitchCause.Room);
    expect(hitchCause(200, 150, 10, 0)).toBe(HitchCause.Game);
    expect(hitchCause(200, 10, 5, 0)).toBe(HitchCause.Render);
  });

  it('préfère la salle au décor quand la salle a coûté autant ou plus', () => {
    expect(hitchCause(300, 290, 120, 150)).toBe(HitchCause.Room);
    expect(hitchCause(300, 290, 150, 120)).toBe(HitchCause.Art);
  });
});

describe('HitchMonitor', () => {
  it('ne compte rien à 60 Hz régulier, ni à 30 Hz', () => {
    const monitor = new HitchMonitor();
    for (let i = 0; i < 600; i++) {
      monitor.frame(FRAME_MS, work(), 'chambre', 0, 0);
    }
    for (let i = 0; i < 60; i++) {
      monitor.frame(HITCH.hitchMs - 1, work(), 'chambre', 0, 0);
    }
    expect(monitor.count).toBe(0);
    expect(monitor.worst).toBeNull();
  });

  it('retient une saccade avec sa cause, la salle et la position', () => {
    const monitor = oneHitch(180, { updateMs: 170, artMs: 160 });
    expect(monitor.count).toBe(1);
    expect(monitor.big).toBe(1);
    expect(monitor.worst).toEqual({ ms: 180, cause: HitchCause.Art, room: 'rue', x: 120, y: 40 });
    expect(monitor.recent).toHaveLength(1);
  });

  it('distingue les petites saccades des grosses', () => {
    const monitor = oneHitch(HITCH.bigHitchMs - 5, {});
    expect(monitor.count).toBe(1);
    expect(monitor.big).toBe(0);
  });

  it('compte à part une saccade dans le noir d’un fondu', () => {
    const monitor = oneHitch(400, { roomMs: 300, veiled: true });
    expect(monitor.count).toBe(0);
    expect(monitor.masked).toBe(1);
  });

  it('ignore l’écart qui suit une pause ou une interruption', () => {
    expect(oneHitch(200, { active: false }).count).toBe(0);
    expect(oneHitch(HITCH.resumeMs + 1, {}).count).toBe(0);
  });

  it('ignore la toute première image', () => {
    const monitor = new HitchMonitor();
    monitor.frame(500, work(), 'chambre', 0, 0);
    expect(monitor.count).toBe(0);
  });

  it('garde les saccades récentes, la plus récente en tête, et la pire', () => {
    const monitor = new HitchMonitor();
    monitor.frame(FRAME_MS, work(), 'rue', 0, 0);
    const total = HITCH.recentCount + 3;
    for (let i = 0; i < total; i++) {
      monitor.frame(i === 2 ? 300 : 30 + i, work(), 'rue', i, 0);
    }
    expect(monitor.count).toBe(total);
    expect(monitor.recent).toHaveLength(HITCH.recentCount);
    expect(monitor.recent[0]?.x).toBe(total - 1);
    expect(monitor.worst?.ms).toBe(300);
    monitor.reset();
    expect(monitor.count).toBe(0);
    expect(monitor.recent).toHaveLength(0);
    expect(monitor.worst).toBeNull();
    // Le travail de la dernière image reste retenu : l'image suivante est encore jugée.
    monitor.frame(60, work(), 'rue', 0, 0);
    expect(monitor.count).toBe(1);
  });
});
