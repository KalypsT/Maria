import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT, type CombatParams } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, msToSteps } from '../src/config/movement';
import { CombatEvent, CombatWorld } from '../src/core/combat/CombatWorld';
import { PatrollerState } from '../src/core/combat/Patroller';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState } from '../src/core/player/playerState';
import testRoom from '../src/levels/test-room.txt?raw';
import { createScriptedRun } from './scriptedRun';

function rig(map: string[], combat: Partial<CombatParams> = {}) {
  const level = parseAsciiLevel('combat', map.join('\n'));
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  const world = new CombatWorld(level, { ...DEFAULT_COMBAT, ...combat });
  const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
  let events = 0;
  let attackPressed = false;
  return {
    level,
    player,
    world,
    input,
    press: () => {
      attackPressed = true;
    },
    run(steps: number, each?: () => void) {
      for (let i = 0; i < steps; i++) {
        if (world.hitstopSteps > 0) {
          world.hitstopSteps--;
          continue;
        }
        player.step(input);
        world.step(player, attackPressed);
        attackPressed = false;
        input.jumpPressed = false;
        events |= world.events;
        each?.();
      }
    },
    takeEvents() {
      const e = events;
      events = 0;
      return e;
    },
  };
}

const PLATFORM = [
  '##############',
  '#............#',
  '#............#',
  '#....e.......#',
  '#...######...#',
  '#............#',
  '#P...........#',
  '##############',
];
const NEXT_TO = [
  '################',
  '#..............#',
  '#..............#',
  '#Pe............#',
  '################',
];
const WALKS_IN = [
  '################',
  '#..............#',
  '#..............#',
  '#e....P........#',
  '################',
];

describe('Patroller', () => {
  it('patrouille sur sa plateforme sans en tomber, dans les deux sens', () => {
    const r = rig(PLATFORM);
    const enemy = r.world.enemies[0];
    if (!enemy) {
      throw new Error('patrouilleur absent');
    }
    const y = enemy.box.y;
    const dirs = new Set<number>();
    r.run(3000, () => {
      dirs.add(enemy.dir);
      expect(enemy.box.y).toBe(y);
      expect(enemy.box.x).toBeGreaterThanOrEqual(4 * T - 1);
      expect(enemy.box.x + enemy.box.width).toBeLessThanOrEqual(10 * T + 1);
    });
    expect(dirs).toEqual(new Set([1, -1]));
  });

  it('fait demi-tour contre un mur', () => {
    const r = rig(['#########', '#.......#', '#P......#', '#.e.....#', '#########']);
    const enemy = r.world.enemies[0];
    let turns = 0;
    let last = enemy?.dir ?? 0;
    r.run(2400, () => {
      if (enemy && enemy.dir !== last) {
        turns++;
        last = enemy.dir;
      }
    });
    expect(turns).toBeGreaterThanOrEqual(2);
  });
});

describe('CombatWorld', () => {
  const c = DEFAULT_COMBAT;

  it('premier coup : repoussé et étourdi, inoffensif ; second coup : dispersé', () => {
    const r = rig(NEXT_TO);
    const enemy = r.world.enemies[0];
    if (!enemy) {
      throw new Error('patrouilleur absent');
    }
    r.press();
    r.run(40);
    expect(r.takeEvents() & CombatEvent.Hit).not.toBe(0);
    expect(enemy.state).toBe(PatrollerState.Stunned);
    expect(enemy.hitsTaken).toBe(1);
    expect(enemy.dangerous).toBe(false);
    expect(enemy.box.x).toBeGreaterThan(2 * T);

    // Rattraper l'ennemi et frapper à nouveau pendant l'étourdissement.
    r.input.moveX = 1;
    r.run(10);
    r.input.moveX = 0;
    r.press();
    r.run(40);
    expect(r.takeEvents() & CombatEvent.Disperse).not.toBe(0);
    expect(enemy.dispersed).toBe(true);
    expect(r.player.state).not.toBe(PlayerState.Hurt);
  });

  it('un même coup ne touche qu’une fois, et l’impact déclenche l’arrêt sur image', () => {
    const r = rig(NEXT_TO);
    const enemy = r.world.enemies[0];
    r.press();
    let hitstops = 0;
    r.run(60, () => {
      if (r.world.hitstopSteps > 0) {
        hitstops++;
      }
    });
    expect(enemy?.hitsTaken).toBe(1);
    expect(hitstops).toBe(1);
  });

  it('au contact, Céleste recule à l’opposé, perd le contrôle, puis est invulnérable', () => {
    const r = rig(WALKS_IN);
    let hurtCount = 0;
    let hurtVx = 0;
    r.run(900, () => {
      if ((r.world.events & CombatEvent.Hurt) !== 0) {
        hurtCount++;
        if (hurtCount === 1) {
          hurtVx = r.player.vx;
        }
        expect(r.player.state).toBe(PlayerState.Hurt);
        expect(r.world.invulnerableSteps).toBe(msToSteps(c.invulnerabilityMs));
      }
    });
    // Premier contact : recul vers la droite (l'ennemi arrive par la gauche).
    expect(hurtVx).toBeGreaterThan(0);
    expect(hurtCount).toBeGreaterThanOrEqual(1);
    // Au plus un contact par période d'invulnérabilité.
    expect(hurtCount).toBeLessThanOrEqual(Math.ceil(900 / msToSteps(c.invulnerabilityMs)));
  });

  it('un ennemi étourdi est inoffensif au contact', () => {
    const r = rig(NEXT_TO, { patrollerKnockback: 0, patrollerStunMs: 2000 });
    r.press();
    r.run(30);
    expect(r.world.enemies[0]?.state).toBe(PatrollerState.Stunned);
    r.input.moveX = 1;
    r.run(60);
    expect(r.takeEvents() & CombatEvent.Hurt).toBe(0);
  });

  it('attaquer ne change jamais la trajectoire de Céleste (le combat ne domine pas le mouvement)', () => {
    const plain = createScriptedRun();
    const attacking = createScriptedRun();
    const world = new CombatWorld(parseAsciiLevel('test-room', testRoom), DEFAULT_COMBAT);
    for (let i = 0; i < 3000; i++) {
      const a = plain(1);
      const b = attacking(1);
      world.step(b, i % 7 === 0);
      expect(b.box.x).toBe(a.box.x);
      expect(b.box.y).toBe(a.box.y);
    }
    expect(world.attack.swing).toBeGreaterThan(50);
  });

  it('remet les ennemis à leur départ', () => {
    const r = rig(NEXT_TO);
    r.press();
    r.run(40);
    r.world.reset();
    const enemy = r.world.enemies[0];
    expect(enemy?.state).toBe(PatrollerState.Patrol);
    expect(enemy?.hitsTaken).toBe(0);
  });
});

describe('araignée au bout de son fil (D-46)', () => {
  const SPIDER_ROOM = [
    '##############',
    '#.....a......#',
    '#............#',
    '#............#',
    '#............#',
    '#............#',
    '#............#',
    '#P...........#',
    '##############',
  ];
  const period = msToSteps(DEFAULT_COMBAT.spiderPeriodMs);

  it('monte et descend sous son point d’attache, sans en sortir', () => {
    const r = rig(SPIDER_ROOM);
    const spider = r.world.enemies[0];
    if (!spider) {
      throw new Error('araignée absente');
    }
    let top = Infinity;
    let bottom = -Infinity;
    r.run(period + 2, () => {
      top = Math.min(top, spider.box.y);
      bottom = Math.max(bottom, spider.box.y);
      expect(spider.box.x).toBe((6 + 0.5) * T - spider.box.width / 2);
    });
    expect(top).toBeGreaterThanOrEqual(1 * T - 1e-9);
    expect(top).toBeLessThan(1 * T + 2);
    expect(bottom).toBeGreaterThan(1 * T + DEFAULT_COMBAT.spiderDropTiles * T - 2);
    expect(bottom).toBeLessThanOrEqual(1 * T + DEFAULT_COMBAT.spiderDropTiles * T + 1e-9);
  });

  it('effrayée par un coup, elle remonte, inoffensive, puis reprend ; deux coups la dispersent', () => {
    const r = rig(SPIDER_ROOM);
    const spider = r.world.enemies[0];
    if (!spider) {
      throw new Error('araignée absente');
    }
    r.run(Math.round(period / 2));
    const low = spider.box.y;
    expect(spider.hit(1, 1, r.world.tuning)).toBe(true);
    expect(spider.dangerous).toBe(false);
    r.run(msToSteps(DEFAULT_COMBAT.patrollerStunMs) - 2);
    expect(spider.box.y).toBeLessThan(low);
    r.run(4);
    expect(spider.dangerous).toBe(true);
    spider.hit(2, 1, r.world.tuning);
    expect(spider.dispersed).toBe(true);
  });

  it('touche Céleste au contact, pendant sa descente', () => {
    const r = rig(SPIDER_ROOM, { spiderDropTiles: 6 });
    const spider = r.world.enemies[0];
    if (!spider) {
      throw new Error('araignée absente');
    }
    // Céleste attend sous l'araignée.
    r.player.reset(6 * T + 2, 8 * T - PLAYER_HITBOX.height);
    r.run(period);
    expect(r.takeEvents() & CombatEvent.Hurt).not.toBe(0);
  });
});

describe('escargot sur son mur (D-49)', () => {
  // Mur de gauche plein ; un pilier (colonne 5, lignes 2 à 6) le long duquel l'escargot monte.
  const SNAIL_ROOM = [
    '##############',
    '#............#',
    '#....#.......#',
    '#....#.......#',
    '#....#o......#',
    '#....#.......#',
    '#....#.......#',
    '#P...........#',
    '##############',
  ];

  it('reste collé à son mur et fait demi-tour à ses deux bouts', () => {
    const r = rig(SNAIL_ROOM);
    const snail = r.world.enemies[0];
    if (!snail) {
      throw new Error('escargot absent');
    }
    expect(snail.wallSide).toBe(-1);
    let top = Infinity;
    let bottom = -Infinity;
    r.run(msToSteps(20_000), () => {
      expect(snail.box.x).toBe(6 * T);
      top = Math.min(top, snail.box.y);
      bottom = Math.max(bottom, snail.box.y + snail.box.height);
    });
    expect(top).toBeGreaterThanOrEqual(2 * T);
    expect(top).toBeLessThan(2 * T + 2);
    expect(bottom).toBeLessThanOrEqual(7 * T + 1e-6);
    expect(bottom).toBeGreaterThan(7 * T - 2);
  });

  it('touché, il rentre dans sa coquille (immobile, inoffensif), puis repart', () => {
    const r = rig(SNAIL_ROOM);
    const snail = r.world.enemies[0];
    if (!snail) {
      throw new Error('escargot absent');
    }
    r.run(30);
    snail.hit(1, 1, r.world.tuning);
    const y = snail.box.y;
    expect(snail.dangerous).toBe(false);
    r.run(msToSteps(DEFAULT_COMBAT.patrollerStunMs) - 2);
    expect(snail.box.y).toBe(y);
    r.run(4);
    expect(snail.dangerous).toBe(true);
  });
});
