import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, deriveMovement } from '../src/config/movement';
import { analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { cableYAt, spawnPosition, type LevelCable } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState } from '../src/core/player/playerState';

const D = deriveMovement(DEFAULT_MOVEMENT);
const P = DEFAULT_MOVEMENT;

/**
 * Un perchoir à gauche (départ), beaucoup d'air, un sol de briques ; `extra` : lignes de la carte
 * à remplacer (index de ligne → contenu intérieur), `cables` : directives `@cable`.
 */
function field(cables: string[], extra: Record<number, string> = {}): string {
  const rows = ['#'.repeat(60)];
  for (let row = 1; row < 29; row++) {
    const inside =
      extra[row] ??
      (row === 8 ? '.P' + '.'.repeat(56) : row === 9 ? '###' + '.'.repeat(55) : '.'.repeat(58));
    rows.push(`#${inside}#`);
  }
  rows.push('#' + '^'.repeat(58) + '#');
  rows.push('#'.repeat(60));
  return [...cables.map((c) => `; @cable: ${c}`), ...rows].join('\n');
}

function firstCable(text: string): LevelCable {
  const cable = parseAsciiLevel('c', text).cables[0];
  if (!cable) {
    throw new Error('aucun câble');
  }
  return cable;
}

function makePlayer(text: string, hook = true): PlayerPhysics {
  const level = parseAsciiLevel('cable', text);
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  player.canGlide = true;
  player.canHook = hook;
  return player;
}

const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
function step(player: PlayerPhysics, moveX: number, jumpPressed = false, jumpHeld = false): void {
  input.moveX = moveX;
  input.moveY = 0;
  input.jumpPressed = jumpPressed;
  input.jumpHeld = jumpHeld;
  player.step(input);
}

/**
 * Saute du perchoir vers la droite ; au sommet, Saut relâché puis pressé de nouveau (le parapluie
 * s'ouvre, D-70) et tenu, jusqu'à s'accrocher (ou au sol) ; nombre de pas.
 */
function jumpToCable(player: PlayerPhysics, dir = 1): number {
  step(player, dir, true, true);
  let apex = -1;
  let s = 1;
  for (; s < 3000 && !player.grounded && player.cable < 0; s++) {
    if (apex < 0 && player.vy >= 0) {
      apex = s;
    }
    step(player, dir, s === apex + 1, apex < 0 || s > apex);
  }
  return s;
}

const SLOPE_DOWN = '8 12 56 18';

describe('le crochet du parapluie et les câbles (D-65)', () => {
  it('@cable : bouts au centre des tuiles, toujours de gauche à droite', () => {
    const level = parseAsciiLevel('c', field(['50 20 8 12']));
    expect(level.cables).toEqual([{ x1: 8.5 * T, y1: 12.5 * T, x2: 50.5 * T, y2: 20.5 * T }]);
    expect(cableYAt(firstCable(field(['50 20 8 12'])), 29.5 * T)).toBeCloseTo(16.5 * T);
    expect(() => parseAsciiLevel('c', field(['8 12 8 20']))).toThrow(/vertical/);
    expect(() => parseAsciiLevel('c', field(['8 12 80 20']))).toThrow(/hors de la salle/);
    expect(() => parseAsciiLevel('c', field(['8 12 50']))).toThrow(/@cable attend/);
  });

  it('sans le crochet, on plane à travers le câble', () => {
    const player = makePlayer(field([SLOPE_DOWN]), false);
    jumpToCable(player);
    expect(player.grounded).toBe(true);
  });

  it('en planant, le crochet s’accroche ; Céleste pend sous le câble et le descend en accélérant', () => {
    const player = makePlayer(field([SLOPE_DOWN]));
    jumpToCable(player);
    expect(player.state).toBe(PlayerState.Cable);
    expect(player.cableDir).toBe(1);
    const cable = firstCable(field([SLOPE_DOWN]));
    let previous = player.cableSpeed;
    let fastest = 0;
    for (let s = 0; s < 2000 && player.cable >= 0; s++) {
      const hookX = player.box.x + player.box.width / 2;
      expect(player.box.y - P.cableHookAbovePx).toBeCloseTo(cableYAt(cable, hookX), 6);
      expect(player.cableSpeed).toBeGreaterThanOrEqual(previous);
      previous = player.cableSpeed;
      fastest = Math.max(fastest, player.cableSpeed);
      step(player, 0, false, true);
    }
    expect(fastest).toBe(P.cableMaxSpeed);
    // Au bout : lâchée avec l'élan, le parapluie toujours ouvert (Saut tenu).
    expect(player.cable).toBe(-1);
    expect(player.vx).toBeGreaterThan(P.maxRunSpeed);
    expect(player.glideOpen).toBe(true);
  });

  it('on ne s’accroche jamais en montant', () => {
    // Un câble plat juste au-dessus du perchoir, sur le trajet de la montée.
    const player = makePlayer(field(['1 6 20 6']));
    step(player, 1, true, true);
    for (let s = 1; s < 3000 && !player.grounded; s++) {
      if (player.vy < 0 || player.box.y < 6 * T) {
        expect(player.cable).toBe(-1);
      }
      if (player.cable >= 0) {
        break;
      }
      step(player, 1, false, true);
    }
  });

  it('câble en pente : toujours vers le bas, même en arrivant à contresens', () => {
    const player = makePlayer(field(['8 20 50 12']));
    jumpToCable(player);
    expect(player.state).toBe(PlayerState.Cable);
    expect(player.cableDir).toBe(-1);
  });

  it('câble plat : dans le sens d’arrivée, jamais sous la vitesse minimale', () => {
    const player = makePlayer(field(['8 14 56 14']));
    jumpToCable(player);
    expect(player.state).toBe(PlayerState.Cable);
    expect(player.cableDir).toBe(1);
    const speed = player.cableSpeed;
    expect(speed).toBeGreaterThanOrEqual(P.cableMinSpeed);
    for (let s = 0; s < 30; s++) {
      step(player, -1, false, true);
    }
    expect(player.cableSpeed).toBe(speed);
    expect(player.cableDir).toBe(1);
  });

  it('lâcher Saut lâche le câble, avec l’élan, parapluie fermé', () => {
    const player = makePlayer(field([SLOPE_DOWN]));
    jumpToCable(player);
    for (let s = 0; s < 40; s++) {
      step(player, 0, false, true);
    }
    const vx = player.vx;
    step(player, 0, false, false);
    expect(player.cable).toBe(-1);
    expect(player.glideOpen).toBe(false);
    expect(player.vx).toBeGreaterThan(0);
    expect(player.vx).toBeLessThanOrEqual(vx);
    expect(player.state).not.toBe(PlayerState.Cable);
  });

  it('relâcher puis presser aussitôt fait sauter depuis le câble ; trop tard, le parapluie s’ouvre', () => {
    for (const late of [false, true]) {
      const player = makePlayer(field([SLOPE_DOWN]));
      jumpToCable(player);
      for (let s = 0; s < 40; s++) {
        step(player, 0, false, true);
      }
      step(player, 0, false, false);
      const wait = late ? D.cableJumpSteps + 2 : 4;
      for (let s = 1; s < wait; s++) {
        step(player, 0, false, false);
      }
      step(player, 0, true, true);
      if (late) {
        expect(player.vy).toBeGreaterThan(0);
        expect(player.glideOpen).toBe(true);
      } else {
        expect(player.vy).toBeLessThan(-0.9 * D.cableJumpVelocity);
        expect(player.vx).toBeGreaterThan(0);
        expect(player.state).toBe(PlayerState.Jump);
      }
    }
    // Relâché et repressé dans la même image : le saut part aussitôt.
    const quick = makePlayer(field([SLOPE_DOWN]));
    jumpToCable(quick);
    step(quick, 0, false, true);
    step(quick, 0, true, true);
    expect(quick.cable).toBe(-1);
    expect(quick.vy).toBeLessThan(-0.9 * D.cableJumpVelocity);
  });

  it('après un saut depuis le câble, Saut tenu rouvre le parapluie au sommet', () => {
    const player = makePlayer(field([SLOPE_DOWN]));
    jumpToCable(player);
    step(player, 0, false, false);
    step(player, 0, true, true);
    let opened = false;
    for (let s = 0; s < 400 && !player.grounded && player.cable < 0; s++) {
      step(player, 0, false, true);
      opened ||= player.glideOpen;
    }
    expect(opened || player.cable >= 0).toBe(true);
  });

  it('un obstacle sur le câble : elle lâche avant, sans élan', () => {
    // Un pilier qui traverse le câble.
    const pillar: Record<number, string> = {};
    for (let row = 10; row < 29; row++) {
      pillar[row] = '.'.repeat(36) + '##' + '.'.repeat(20);
    }
    pillar[9] = '###' + '.'.repeat(55);
    const player = makePlayer(field([SLOPE_DOWN], pillar));
    jumpToCable(player);
    expect(player.state).toBe(PlayerState.Cable);
    for (let s = 0; s < 2000 && player.cable >= 0; s++) {
      step(player, 0, false, true);
    }
    expect(player.box.x + player.box.width).toBeLessThanOrEqual(37 * T);
    expect(player.glideOpen).toBe(false);
  });

  it('touchée, elle lâche le câble', () => {
    const player = makePlayer(field([SLOPE_DOWN]));
    jumpToCable(player);
    player.startHurt(10);
    expect(player.cable).toBe(-1);
  });

  it('l’analyse de faisabilité suit les câbles, seulement avec le crochet', () => {
    // Une plateforme haute à droite : trop haute pour le plané seul, atteinte par le câble.
    const shelf: Record<number, string> = { 18: '.'.repeat(51) + '#######' };
    const level = parseAsciiLevel('c', field(['6 10 54 15'], shelf));
    const glideOnly = analyzeLevel(level, P, { glide: true });
    const withHook = analyzeLevel(level, P, { glide: true, hook: true });
    const target = surfaceUnder(level, withHook.map, 55, 17);
    expect(target).toBeGreaterThanOrEqual(0);
    const move = (a: typeof glideOnly) =>
      a.moves.find((m) => m.from === a.start && m.to === target);
    expect(move(glideOnly)).toBeUndefined();
    expect(move(withHook)?.glide).toBe(true);
  });
});
