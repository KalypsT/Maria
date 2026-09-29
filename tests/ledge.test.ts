import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState } from '../src/core/player/playerState';

/** Meuble de 4 tuiles (trop haut pour un saut, 3,5 tuiles) contre lequel on saute vers la droite. */
function room(blockTop: number, ceiling = false): string[] {
  const rows: string[] = [];
  for (let row = 0; row < 12; row++) {
    if (row === 0 || row === 11) {
      rows.push('##############');
    } else if (ceiling && row === blockTop - 2) {
      rows.push('#........#####');
    } else if (row >= blockTop) {
      rows.push(row === 10 ? '#P.......#####' : '#........#####');
    } else {
      rows.push('#............#');
    }
  }
  return rows;
}

function makePlayer(map: string[], canClimb = true): PlayerPhysics {
  const level = parseAsciiLevel('ledge', map.join('\n'));
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  player.canClimb = canClimb;
  return player;
}

const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
function step(player: PlayerPhysics, moveX: number, jumpPressed = false, moveY = 0): void {
  input.moveX = moveX;
  input.moveY = moveY;
  input.jumpPressed = jumpPressed;
  input.jumpHeld = true;
  player.step(input);
}

/** Court jusqu'au meuble, saute contre lui en poussant ; s'arrête à l'accroche (ou après 2 s). */
function jumpAtBlock(player: PlayerPhysics): void {
  for (let i = 0; i < 240 && player.box.x + player.box.width < 9 * T; i++) {
    step(player, 1);
  }
  step(player, 1, true);
  for (let i = 0; i < 240 && player.state !== PlayerState.Hang; i++) {
    step(player, 1);
  }
}

const floorY = (row: number) => row * T - PLAYER_HITBOX.height;

describe('grimper aux rebords (D-26)', () => {
  it('sans la capacité, le mouvement est inchangé : le meuble reste hors de portée', () => {
    const player = makePlayer(room(7), false);
    jumpAtBlock(player);
    for (let i = 0; i < 240; i++) {
      step(player, 1);
    }
    expect(player.onLedge).toBe(false);
    expect(player.grounded).toBe(true);
    expect(player.box.y).toBe(floorY(11));
  });

  it('s’accroche au bord, reste suspendue un instant, puis se hisse en poussant', () => {
    const player = makePlayer(room(7));
    jumpAtBlock(player);
    expect(player.state).toBe(PlayerState.Hang);
    expect(player.box.x + player.box.width).toBe(9 * T);
    expect(player.box.y).toBe(7 * T - DEFAULT_MOVEMENT.ledgeHangOffsetPx);
    // Suspendue : immobile, sans gravité, sans pouvoir attaquer.
    const y = player.box.y;
    step(player, 0);
    expect(player.box.y).toBe(y);
    expect(player.onLedge).toBe(true);
    let steps = 0;
    while (player.onLedge && steps < 240) {
      step(player, 1);
      steps++;
    }
    expect(player.grounded).toBe(true);
    expect(player.box.y).toBe(floorY(7));
    expect(player.box.x).toBeGreaterThanOrEqual(9 * T);
    // Suspension minimale + hissage.
    const minSteps = Math.round(
      ((DEFAULT_MOVEMENT.ledgeHangMinMs + DEFAULT_MOVEMENT.ledgeClimbMs) * 120) / 1000,
    );
    expect(steps).toBeGreaterThanOrEqual(minSteps - 1);
    expect(steps).toBeLessThanOrEqual(minSteps + 2);
  });

  it('Saut hisse tout de suite ; la pression ne part pas en saut à l’arrivée', () => {
    const player = makePlayer(room(7));
    jumpAtBlock(player);
    step(player, 0, true);
    expect(player.state).toBe(PlayerState.Climb);
    for (let i = 0; i < 200 && player.onLedge; i++) {
      step(player, 0);
    }
    step(player, 0);
    expect(player.grounded).toBe(true);
    expect(player.box.y).toBe(floorY(7));
  });

  it('Bas ou l’opposé lâche le bord, sans s’y raccrocher aussitôt', () => {
    for (const [moveX, moveY] of [
      [0, 1],
      [-1, 0],
    ] as const) {
      const player = makePlayer(room(7));
      jumpAtBlock(player);
      step(player, moveX, false, moveY);
      expect(player.state).toBe(PlayerState.Fall);
      step(player, 1);
      expect(player.onLedge).toBe(false);
      for (let i = 0; i < 240; i++) {
        step(player, 0);
      }
      expect(player.box.y).toBe(floorY(11));
    }
  });

  it('sans pousser vers le mur, pas d’accroche', () => {
    const player = makePlayer(room(7));
    for (let i = 0; i < 40; i++) {
      step(player, 1);
    }
    step(player, 1, true);
    for (let i = 0; i < 240; i++) {
      step(player, 0);
      expect(player.onLedge).toBe(false);
    }
  });

  it('un saut qui suffit pour se poser n’est jamais interrompu', () => {
    const player = makePlayer(room(8));
    jumpAtBlock(player);
    for (let i = 0; i < 240; i++) {
      step(player, 1);
      expect(player.onLedge).toBe(false);
    }
    expect(player.box.y).toBe(floorY(8));
  });

  it('pas d’accroche sans place pour se tenir debout au-dessus', () => {
    const player = makePlayer(room(7, true));
    jumpAtBlock(player);
    expect(player.onLedge).toBe(false);
  });

  it('touchée, elle lâche le bord', () => {
    const player = makePlayer(room(7));
    jumpAtBlock(player);
    player.vx = -100;
    player.vy = -100;
    player.startHurt(10);
    expect(player.onLedge).toBe(false);
    step(player, 1);
    expect(player.state).toBe(PlayerState.Hurt);
  });

  it('copyFrom reprend la suspension (analyse de faisabilité)', () => {
    const player = makePlayer(room(7));
    jumpAtBlock(player);
    const copy = makePlayer(room(7));
    copy.copyFrom(player);
    for (let i = 0; i < 200 && copy.onLedge; i++) {
      step(copy, 1);
    }
    expect(copy.box.y).toBe(floorY(7));
  });

  it('l’analyse de faisabilité trouve le hissage seulement avec la capacité', () => {
    const level = parseAsciiLevel('ledge', room(7).join('\n'));
    const reaches = (climb: boolean) => {
      const analysis = analyzeLevel(level, DEFAULT_MOVEMENT, { climb });
      const top = surfaceUnder(level, analysis.map, 10, 6);
      return analysis.moves.find((move) => move.from === analysis.start && move.to === top);
    };
    expect(reaches(false)).toBeUndefined();
    expect(reaches(true)?.windowMs).toBeGreaterThan(0);
  });
});
