import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, deriveMovement } from '../src/config/movement';
import { MoveKind, analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { LEVELS } from '../src/levels';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState } from '../src/core/player/playerState';

const D = deriveMovement(DEFAULT_MOVEMENT);

/** Cheminée de 4 tuiles de large et 26 de haut (mur gauche et mur droit pleins). */
function chimney(): string[] {
  const rows = ['############'];
  for (let row = 1; row < 29; row++) {
    rows.push(row === 28 ? '#P...#######' : '#....#######');
  }
  rows.push('############');
  return rows;
}

/** Un seul grand mur à droite (colonne 9), beaucoup d'air à gauche. */
function singleWall(): string[] {
  const rows = ['############'];
  for (let row = 1; row < 29; row++) {
    rows.push(row === 28 ? '#......P.###' : '#........###');
  }
  rows.push('############');
  return rows;
}

function makePlayer(map: string[], canWallJump = true): PlayerPhysics {
  const level = parseAsciiLevel('wall', map.join('\n'));
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  player.canWallJump = canWallJump;
  return player;
}

const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
function step(player: PlayerPhysics, moveX: number, jumpPressed = false, jumpHeld = true): void {
  input.moveX = moveX;
  input.moveY = 0;
  input.jumpPressed = jumpPressed;
  input.jumpHeld = jumpHeld;
  player.step(input);
}

/** Saut contre le mur de droite en poussant, jusqu'à la descente (sommet passé). */
function jumpToRightWall(player: PlayerPhysics, moveX = 1): void {
  step(player, 1, true);
  for (let i = 0; i < 120 && (player.vy < 0 || player.box.x + player.box.width < 9 * T); i++) {
    step(player, moveX);
  }
}

describe('saut mural (D-44)', () => {
  it('sans la capacité, le mouvement est inchangé : ni glissade ni saut contre le mur', () => {
    const player = makePlayer(singleWall(), false);
    jumpToRightWall(player);
    for (let i = 0; i < 20; i++) {
      step(player, 1);
    }
    expect(player.state).toBe(PlayerState.Fall);
    expect(player.vy).toBeGreaterThan(DEFAULT_MOVEMENT.wallSlideSpeed);
    const vy = player.vy;
    step(player, 1, true);
    expect(player.vy).toBeGreaterThan(vy - 1);
    expect(player.wallDir).toBe(0);
  });

  it('glisse contre le mur en descente, en poussant vers lui, dos au mur', () => {
    const player = makePlayer(singleWall());
    // Chute de haut, contre le mur.
    player.reset(9 * T - PLAYER_HITBOX.width, 4 * T);
    step(player, 1);
    step(player, 1);
    expect(player.state).toBe(PlayerState.WallSlide);
    expect(player.vy).toBeLessThanOrEqual(DEFAULT_MOVEMENT.wallSlideSpeed);
    expect(player.facing).toBe(-1);
    for (let i = 0; i < 30; i++) {
      step(player, 1);
      expect(player.vy).toBeLessThanOrEqual(DEFAULT_MOVEMENT.wallSlideSpeed);
    }
    // Lâcher le joystick : la chute normale reprend.
    for (let i = 0; i < 20; i++) {
      step(player, 0);
    }
    expect(player.state).toBe(PlayerState.Fall);
    expect(player.vy).toBeGreaterThan(DEFAULT_MOVEMENT.wallSlideSpeed);
  });

  it('une diagonale molle (sous le seuil) ne fait pas glisser', () => {
    const player = makePlayer(singleWall());
    jumpToRightWall(player);
    const soft = DEFAULT_MOVEMENT.wallInputThreshold - 0.1;
    for (let i = 0; i < 30; i++) {
      step(player, soft);
    }
    expect(player.state).toBe(PlayerState.Fall);
    expect(player.vy).toBeGreaterThan(DEFAULT_MOVEMENT.wallSlideSpeed);
  });

  it('ne retient pas en montée : un saut le long du mur monte aussi haut', () => {
    const free = makePlayer(singleWall());
    const along = makePlayer(singleWall());
    let freeTop = free.box.y;
    let alongTop = along.box.y;
    step(free, 0, true);
    step(along, 1, true);
    for (let i = 0; i < 90; i++) {
      step(free, 0);
      step(along, 1);
      freeTop = Math.min(freeTop, free.box.y);
      alongTop = Math.min(alongTop, along.box.y);
    }
    expect(alongTop).toBeCloseTo(freeTop, 6);
  });

  it('saute à l’opposé du mur, direction ignorée pendant le verrou', () => {
    const player = makePlayer(singleWall());
    jumpToRightWall(player);
    step(player, 1);
    step(player, 1, true);
    expect(player.vx).toBe(-DEFAULT_MOVEMENT.wallJumpSpeedX);
    expect(player.vy).toBeLessThan(0);
    expect(player.facing).toBe(-1);
    // Pousser vers le mur pendant le verrou ne change rien à l'élan.
    for (let i = 1; i < D.wallJumpLockSteps; i++) {
      step(player, 1);
      expect(player.vx).toBe(-DEFAULT_MOVEMENT.wallJumpSpeedX);
    }
    step(player, 1);
    step(player, 1);
    expect(player.vx).toBeGreaterThan(-DEFAULT_MOVEMENT.wallJumpSpeedX);
  });

  it('au sol contre un mur, Saut reste un saut normal', () => {
    const player = makePlayer(singleWall());
    for (let i = 0; i < 60; i++) {
      step(player, 1);
    }
    step(player, 1, true);
    expect(player.vy).toBeCloseTo(-D.jumpVelocity + D.riseGravity * D.dt, 6);
    expect(player.vx).toBe(0);
  });

  it('tolère un saut juste après avoir quitté le mur, pas au-delà', () => {
    const late = (steps: number) => {
      const player = makePlayer(singleWall());
      jumpToRightWall(player);
      step(player, 1);
      for (let i = 0; i < steps; i++) {
        step(player, 0);
      }
      step(player, 0, true);
      return player.vx;
    };
    expect(late(D.wallCoyoteSteps - 1)).toBe(-DEFAULT_MOVEMENT.wallJumpSpeedX);
    expect(late(D.wallCoyoteSteps + 2)).toBe(0);
  });

  it('remonte une cheminée en rebondissant d’un mur à l’autre', () => {
    const player = makePlayer(chimney());
    const startY = player.box.y;
    let dir = -1;
    step(player, dir, true);
    for (let i = 0; i < 1200; i++) {
      if (player.wallDir === dir) {
        dir = -dir;
        step(player, dir, true);
      } else {
        step(player, dir);
      }
    }
    // Plus de 20 tuiles gagnées : jusqu'au plafond.
    expect(startY - player.box.y).toBeGreaterThan(20 * T);
  });

  it('ne remonte pas un seul mur : il ne retient plus Céleste après un saut mural', () => {
    const player = makePlayer(singleWall());
    jumpToRightWall(player);
    step(player, 1);
    const kickY = player.box.y;
    let highest = kickY;
    for (let kick = 0; kick < 6; kick++) {
      step(player, 1, true);
      for (let i = 0; i < 240 && !player.grounded; i++) {
        // Revient vers le mur dès que possible et saute dès qu'il le touche.
        step(player, 1, player.wallDir === 1);
        highest = Math.min(highest, player.box.y);
      }
    }
    expect(player.grounded).toBe(true);
    // Le premier saut mural monte au-dessus du point d'appui ; aucun autre ne s'y ajoute.
    expect(kickY - highest).toBeLessThanOrEqual(DEFAULT_MOVEMENT.wallJumpHeightTiles * T + 1);
  });

  it('le sol rend le mur à nouveau utilisable', () => {
    const player = makePlayer(singleWall());
    jumpToRightWall(player);
    step(player, 1);
    step(player, 1, true);
    for (let i = 0; i < 400 && !player.grounded; i++) {
      step(player, 0);
    }
    expect(player.grounded).toBe(true);
    for (let i = 0; i < 120; i++) {
      step(player, 1);
    }
    jumpToRightWall(player);
    step(player, 1);
    expect(player.state).toBe(PlayerState.WallSlide);
  });

  it('copyFrom reproduit la glissade et le saut mural', () => {
    const a = makePlayer(singleWall());
    jumpToRightWall(a);
    step(a, 1);
    const b = makePlayer(singleWall());
    b.copyFrom(a);
    for (let i = 0; i < 40; i++) {
      const jump = i === 5;
      step(a, i < 20 ? 1 : -1, jump);
      step(b, i < 20 ? 1 : -1, jump);
    }
    expect(b.box.x).toBe(a.box.x);
    expect(b.box.y).toBe(a.box.y);
    expect(b.state).toBe(a.state);
  });
});

describe('analyse de faisabilité avec le saut mural (D-44)', () => {
  const level = (map: string[]) => parseAsciiLevel('wall', map.join('\n'));
  /** Cheminée qui débouche sur une arrivée, en haut à droite. */
  function chimneyCourse(width: number): string[] {
    const rows = ['##############'];
    for (let row = 1; row < 24; row++) {
      const gap = '.'.repeat(width);
      const rest = '#'.repeat(12 - width);
      if (row < 7) {
        rows.push(row === 6 ? `#${'.'.repeat(10)}G.#` : `#${'.'.repeat(12)}#`);
      } else {
        rows.push(row === 23 ? `#P${gap.slice(1)}${rest}#` : `#${gap}${rest}#`);
      }
    }
    rows.push('##############');
    return rows;
  }

  it('sans la capacité, l’analyse est inchangée (mêmes passages)', { timeout: 60_000 }, () => {
    const source = LEVELS.find((l) => l.id === 'tour');
    if (!source) {
      throw new Error('parcours tour absent');
    }
    const tour = parseAsciiLevel('tour', source.text);
    const plain = analyzeLevel(tour, DEFAULT_MOVEMENT);
    const flagged = analyzeLevel(tour, DEFAULT_MOVEMENT, { wallJump: false });
    expect(flagged.moves).toEqual(plain.moves);
    expect(flagged.wallNodeCount).toBe(0);
  });

  it('une cheminée de 4 tuiles se remonte, facilement ; sans la capacité, non', () => {
    const map = level(chimneyCourse(4));
    expect(analyzeLevel(map, DEFAULT_MOVEMENT).path).toBeNull();
    const result = analyzeLevel(map, DEFAULT_MOVEMENT, { wallJump: true });
    expect(result.path).not.toBeNull();
    expect(result.critical?.kind).toBe(MoveKind.WallJump);
    expect(result.critical?.windowMs).toBeGreaterThanOrEqual(200);
  });

  it('un seul mur ne se remonte pas', () => {
    // Grand meuble à droite (20 tuiles), l'arrivée dessus ; le mur de gauche est trop loin.
    const rows = ['##########################'];
    for (let row = 1; row < 24; row++) {
      if (row === 2) {
        rows.push('#...................G....#');
      } else if (row < 3) {
        rows.push('#........................#');
      } else {
        rows.push(row === 23 ? '#............P....########' : '#.................########');
      }
    }
    rows.push('##########################');
    const result = analyzeLevel(level(rows), DEFAULT_MOVEMENT, { wallJump: true });
    expect(result.path).toBeNull();
    expect(result.wallNodeCount).toBeGreaterThan(0);
  });

  it('le parcours 7 demande le saut mural', { timeout: 60_000 }, () => {
    const source = LEVELS.find((l) => l.id === 'saut-mural');
    if (!source) {
      throw new Error('parcours saut-mural absent');
    }
    const course = parseAsciiLevel('saut-mural', source.text);
    expect(analyzeLevel(course, DEFAULT_MOVEMENT, { climb: true }).path).toBeNull();
  });
});
