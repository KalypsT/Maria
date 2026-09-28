import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT, type CombatParams } from '../src/config/combat';
import { msToSteps } from '../src/config/movement';
import { AttackPhase, PlayerAttack } from '../src/core/combat/PlayerAttack';
import type { Box } from '../src/core/physics/gridCollision';

const c = DEFAULT_COMBAT;
const startup = msToSteps(c.attackStartupMs);
const active = msToSteps(c.attackActiveMs);
const recovery = msToSteps(c.attackRecoveryMs);
const cooldown = msToSteps(c.attackCooldownMs);
const buffer = msToSteps(c.attackBufferMs);

function make(overrides: Partial<CombatParams> = {}) {
  return new PlayerAttack({ ...DEFAULT_COMBAT, ...overrides });
}

/** Phases successives sur `steps` pas, pression au premier pas seulement. */
function phases(attack: PlayerAttack, steps: number, pressAt: readonly number[] = [0]): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    attack.step(pressAt.includes(i), 1);
    out.push(attack.phase);
  }
  return out;
}

describe('PlayerAttack', () => {
  it('enchaîne préparation, frappe et récupération aux durées exactes', () => {
    const attack = make();
    const seq = phases(attack, startup + active + recovery + 2);
    expect(seq.filter((p) => p === AttackPhase.Startup)).toHaveLength(startup);
    expect(seq.filter((p) => p === AttackPhase.Active)).toHaveLength(active);
    expect(seq.filter((p) => p === AttackPhase.Recovery)).toHaveLength(recovery);
    expect(seq.indexOf(AttackPhase.Active)).toBe(startup);
    expect(seq[seq.length - 1]).toBe(AttackPhase.Idle);
    expect(attack.swing).toBe(1);
  });

  it('ne frappe pas sans pression, et une pression maintenue ne relance pas', () => {
    const attack = make();
    expect(phases(attack, 60, [])).toEqual(new Array<number>(60).fill(AttackPhase.Idle));
    // Un seul front : un seul coup, même sur une longue durée.
    phases(attack, 200);
    expect(attack.swing).toBe(1);
  });

  it('mémorise une pression faite pendant la récupération (jusqu’à la borne exacte)', () => {
    const total = startup + active + recovery + cooldown;
    // Pression au dernier pas où elle reste valable : le coup suivant part dès la fin de la recharge.
    const early = make();
    phases(early, total + 5, [0, total - buffer]);
    expect(early.swing).toBe(2);
    const tooEarly = make();
    phases(tooEarly, total + 5, [0, total - buffer - 1]);
    expect(tooEarly.swing).toBe(1);
  });

  it('respecte la recharge entre deux coups', () => {
    const attack = make({ attackBufferMs: 0 });
    const end = startup + active + recovery;
    phases(attack, end + cooldown + 3, [0, end + cooldown - 1]);
    expect(attack.swing).toBe(1);
    const later = make({ attackBufferMs: 0 });
    phases(later, end + cooldown + 3, [0, end + cooldown]);
    expect(later.swing).toBe(2);
  });

  it('place la zone de frappe devant Céleste, selon l’orientation figée au départ du coup', () => {
    const body: Box = { x: 100, y: 50, width: 12, height: 22 };
    const out: Box = { x: 0, y: 0, width: 0, height: 0 };
    const attack = make();
    attack.step(true, -1);
    expect(attack.hitbox(body, out)).toBe(false);
    expect(out.x + out.width).toBe(body.x);
    expect(out.y).toBe(body.y + c.attackOffsetYPx);
    // Se retourner pendant le coup ne change pas son côté.
    for (let i = 0; i < startup; i++) {
      attack.step(false, 1);
    }
    expect(attack.hitbox(body, out)).toBe(true);
    expect(out.x + out.width).toBe(body.x);
    expect(out.width).toBe(c.attackReachPx);

    const right = make();
    right.step(true, 1);
    right.hitbox(body, out);
    expect(out.x).toBe(body.x + body.width);
  });

  it('frappe immédiatement sans préparation si elle vaut 0', () => {
    const attack = make({ attackStartupMs: 0 });
    attack.step(true, 1);
    expect(attack.active).toBe(true);
  });
});
