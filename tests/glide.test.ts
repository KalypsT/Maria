import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, deriveMovement } from '../src/config/movement';
import { analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState } from '../src/core/player/playerState';

const D = deriveMovement(DEFAULT_MOVEMENT);
const P = DEFAULT_MOVEMENT;

/** Un haut perchoir à gauche, beaucoup d'air, un sol lointain ; un mur tout à droite. */
function field(): string[] {
  const rows = ['#'.repeat(60)];
  for (let row = 1; row < 29; row++) {
    const inside = row === 8 ? '.P' + '.'.repeat(56) : '.'.repeat(58);
    const perch = row === 9 ? '###' + '.'.repeat(55) : inside;
    rows.push(`#${perch}#`);
  }
  rows.push('#'.repeat(60));
  return rows;
}

function makePlayer(canGlide: boolean): PlayerPhysics {
  const level = parseAsciiLevel('glide', field().join('\n'));
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  player.canGlide = canGlide;
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
 * Saut depuis le perchoir vers la droite. `hold` : Saut tenu jusqu'au sol ; `apex` : tenu jusqu'au
 * sommet, puis relâché (un saut complet sans parapluie) ; `repress` : relâché au sommet, puis une
 * nouvelle pression tenue. `releaseAfterSteps` : Saut relâché ce nombre de pas après le sommet.
 * Retourne la trajectoire (x, y par pas) jusqu'au sol.
 */
function flight(
  player: PlayerPhysics,
  mode: 'hold' | 'apex' | 'repress',
  releaseAfterSteps = Infinity,
): number[] {
  const path: number[] = [];
  step(player, 1, true, true);
  let apex = -1;
  for (let s = 1; s < 3000 && !player.grounded; s++) {
    if (apex < 0 && player.vy >= 0) {
      apex = s;
    }
    const after = apex < 0 ? -1 : s - apex;
    const pressed = mode === 'repress' && after === 1;
    const held =
      after < 0 ||
      (mode === 'hold' && after < releaseAfterSteps) ||
      (mode === 'repress' && after >= 1);
    step(player, 1, pressed, held);
    path.push(player.box.x, player.box.y);
  }
  return path;
}

describe('parapluie (D-62, D-65)', () => {
  it('sans la capacité, tenir Saut ou presser de nouveau en l’air ne change rien', () => {
    const plain = flight(makePlayer(false), 'apex');
    expect(flight(makePlayer(false), 'hold')).toEqual(plain);
    expect(flight(makePlayer(false), 'repress')).toEqual(plain);
  });

  it('avec la capacité, un saut relâché au sommet est inchangé', () => {
    expect(flight(makePlayer(true), 'apex')).toEqual(flight(makePlayer(false), 'apex'));
  });

  it('un saut court (relâché en montée) n’ouvre jamais le parapluie', () => {
    const player = makePlayer(true);
    step(player, 1, true, true);
    for (let s = 1; s < 10; s++) {
      step(player, 1, false, true);
    }
    for (let s = 0; s < 3000 && !player.grounded; s++) {
      step(player, 1);
      expect(player.glideOpen).toBe(false);
    }
  });

  it('Saut tenu : le parapluie s’ouvre peu après le sommet, chute lente, bien plus loin', () => {
    const plain = flight(makePlayer(true), 'apex');
    const glide = flight(makePlayer(true), 'hold');
    // Identique jusqu'au sommet et pendant le court délai (D-65 : 40 ms).
    let same = 0;
    while (same < plain.length && plain[same] === glide[same]) {
      same++;
    }
    const apexStep = Math.round(D.jumpVelocity / D.riseGravity / D.dt);
    expect(same / 2).toBeGreaterThanOrEqual(apexStep + D.glideAutoDelaySteps - 2);
    expect(same / 2).toBeLessThanOrEqual(apexStep + D.glideAutoDelaySteps + 2);
    expect(D.glideAutoDelaySteps).toBe(Math.round((P.glideAutoDelayMs / 1000) * 120));
    expect(glide.length).toBeGreaterThan(plain.length * 2);
    const far = (path: number[]) => path[path.length - 2] ?? 0;
    expect(far(glide) - far(plain)).toBeGreaterThan(20 * T);
    // Pendant le plané, la chute ne dépasse jamais la vitesse du parapluie (après le freinage).
    const p2 = makePlayer(true);
    step(p2, 1, true, true);
    let opened = -1;
    let fastest = 0;
    for (let s = 1; s < 3000 && !p2.grounded; s++) {
      step(p2, 1, false, true);
      if (opened < 0 && p2.glideOpen) {
        opened = s;
      }
      const landed = [PlayerState.Run, PlayerState.Idle, PlayerState.Land].some(
        (state) => state === p2.state,
      );
      if (opened > 0 && s - opened > 60 && !landed) {
        fastest = Math.max(fastest, p2.vy);
        expect(p2.state).toBe(PlayerState.Glide);
      }
    }
    expect(opened).toBeGreaterThan(0);
    expect(fastest).toBeLessThanOrEqual(P.glideFallSpeed + 1e-9);
  });

  it('une nouvelle pression en l’air ouvre aussi le parapluie (chute d’un bord, saut court)', () => {
    const repressed = flight(makePlayer(true), 'repress');
    expect(repressed.length).toBeGreaterThan(flight(makePlayer(true), 'apex').length * 2);
    // Tomber du perchoir sans sauter, puis presser Saut : il s'ouvre aussitôt.
    const player = makePlayer(true);
    for (let s = 0; s < 400 && player.grounded; s++) {
      step(player, 1);
    }
    for (let s = 0; s < 20; s++) {
      step(player, 1);
    }
    step(player, 1, true, true);
    expect(player.glideOpen).toBe(true);
  });

  it('lâcher Saut referme le parapluie : la chute reprend', () => {
    const player = makePlayer(true);
    const held = flight(makePlayer(true), 'hold');
    const released = flight(player, 'hold', 30);
    expect(released.length).toBeLessThan(held.length / 2);
    expect(player.glideOpen).toBe(false);
  });

  it('le jump buffering marche toujours : une pression juste avant le sol fait sauter', () => {
    const player = makePlayer(true);
    // Sauter du perchoir sans rien tenir, puis presser Saut à 6 pas (50 ms) de l'atterrissage.
    step(player, 1, true, false);
    const probe = makePlayer(true);
    let landingStep = 0;
    step(probe, 1, true, false);
    for (let s = 1; s < 3000 && !probe.grounded; s++) {
      step(probe, 1);
      landingStep = s;
    }
    for (let s = 1; s < landingStep - 6; s++) {
      step(player, 1);
    }
    step(player, 1, true, true);
    let jumped = false;
    for (let s = 0; s < 60; s++) {
      step(player, 1, false, true);
      if (player.state === PlayerState.Jump && player.vy < 0) {
        jumped = true;
        break;
      }
    }
    expect(jumped, 'saut mémorisé').toBe(true);
    expect(D.jumpBufferSteps).toBeGreaterThanOrEqual(6);
  });

  it('au sol, contre un mur ou touchée, le parapluie est refermé', () => {
    const player = makePlayer(true);
    flight(player, 'hold');
    expect(player.grounded).toBe(true);
    expect(player.glideOpen).toBe(false);
    const hurt = makePlayer(true);
    step(hurt, 1, true, true);
    for (let s = 0; s < 60 && hurt.vy < 0; s++) {
      step(hurt, 1, false, true);
    }
    step(hurt, 1, true, true);
    expect(hurt.glideOpen).toBe(true);
    hurt.startHurt(10);
    expect(hurt.glideOpen).toBe(false);
  });

  it('l’analyse de faisabilité ne plane qu’avec la capacité', () => {
    // Sol à droite, seulement la bande du bout : le reste est un fossé de briques.
    const rows = field();
    rows[29] = '#' + '^'.repeat(44) + '#'.repeat(15);
    rows[28] = '#' + '.'.repeat(58) + '#';
    const pit = parseAsciiLevel('pit', [...rows, '#'.repeat(60)].join('\n'));
    const without = analyzeLevel(pit, P);
    const withGlide = analyzeLevel(pit, P, { glide: true });
    const target = surfaceUnder(pit, withGlide.map, 52, 28);
    expect(target).toBeGreaterThanOrEqual(0);
    const reached = (a: typeof without) =>
      a.moves.some((m) => m.from === a.start && m.to === target);
    expect(reached(without)).toBe(false);
    expect(reached(withGlide)).toBe(true);
    expect(withGlide.moves.find((m) => m.from === withGlide.start && m.to === target)?.glide).toBe(
      true,
    );
  });
});
