import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX, deriveMovement } from '../src/config/movement';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState } from '../src/core/player/playerState';
import { MoveKind, analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { LEVELS } from '../src/levels';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const P = DEFAULT_MOVEMENT;
const D = deriveMovement(P);
const W = 60;

/**
 * Une salle de 60 colonnes : sol à la ligne 14, départ en colonne 2. `low` : colonnes où un
 * plafond descend à une tuile du sol (ligne 12 pleine) ; `pit` : colonnes sans sol.
 */
function room(low: readonly number[] = [], pit: readonly number[] = []): PlayerPhysics {
  const rows = ['#'.repeat(W)];
  for (let row = 1; row < 16; row++) {
    let line = '';
    for (let col = 0; col < W; col++) {
      const wall = col === 0 || col === W - 1;
      const floor = row >= 14 && !pit.includes(col);
      const ceiling = row <= 12 && row >= 11 && low.includes(col);
      line += wall || floor || ceiling ? '#' : row === 13 && col === 2 ? 'P' : '.';
    }
    rows.push(line);
  }
  rows.push('#'.repeat(W));
  const level = parseAsciiLevel('slide', rows.join('\n'));
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  return new PlayerPhysics(level, P, x, y);
}

const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
function step(
  player: PlayerPhysics,
  moveX: number,
  { slide = false, jump = false, held = false } = {},
): void {
  input.moveX = moveX;
  input.moveY = 0;
  input.jumpPressed = jump;
  input.jumpHeld = held || jump;
  input.abilityPressed = slide;
  player.step(input);
}

function settle(player: PlayerPhysics): void {
  for (let s = 0; s < 240; s++) {
    step(player, 0);
  }
}

const feet = (player: PlayerPhysics) => player.box.y + player.box.height;

describe('glissade (D-84)', () => {
  it('sans la capacité, le bouton Capacité ne change rien', () => {
    const a = room();
    const b = room();
    for (let s = 0; s < 120; s++) {
      step(a, 1);
      step(b, 1, { slide: s % 7 === 0 });
    }
    expect(b.box.x).toBe(a.box.x);
    expect(b.state).not.toBe(PlayerState.Slide);
  });

  it('au sol : couchée, pieds en place, puis debout après la poussée', () => {
    const player = room();
    player.canSlide = true;
    settle(player);
    const y = feet(player);
    const x = player.box.x;
    step(player, 0, { slide: true });
    expect(player.state).toBe(PlayerState.Slide);
    expect(player.low).toBe(true);
    expect(player.box.height).toBe(P.slideHeightPx);
    expect(feet(player)).toBeCloseTo(y, 6);
    for (let s = 1; s < D.slideSteps; s++) {
      step(player, 0);
    }
    expect(player.low).toBe(false);
    expect(player.box.height).toBe(PLAYER_HITBOX.height);
    expect(feet(player)).toBeCloseTo(y, 6);
    // Distance de la poussée : vitesse × durée (le sens : là où elle regarde).
    expect(player.box.x - x).toBeCloseTo(P.slideSpeed * D.slideSteps * D.dt, 0);
  });

  it('passe sous un obstacle bas qu’on ne franchit pas debout', () => {
    const blocked = room([10, 11]);
    for (let s = 0; s < 240; s++) {
      step(blocked, 1);
    }
    expect(blocked.box.x + blocked.box.width).toBeLessThanOrEqual(10 * T);

    const player = room([10, 11]);
    player.canSlide = true;
    settle(player);
    let slid = false;
    for (let s = 0; s < 240; s++) {
      const near: boolean = !slid && player.box.x + player.box.width > 7 * T;
      step(player, 1, { slide: near });
      slid ||= near;
    }
    expect(player.box.x).toBeGreaterThan(12 * T);
  });

  it('sous un long plafond bas, elle avance couchée et se relève à la sortie', () => {
    const low = Array.from({ length: 12 }, (_, i) => 8 + i);
    const player = room(low);
    player.canSlide = true;
    settle(player);
    // Lancée juste avant l'entrée : la poussée finit sous le plafond.
    for (let s = 0; s < 240 && player.box.x + player.box.width < 7.5 * T; s++) {
      step(player, 1);
    }
    step(player, 1, { slide: true });
    let stoodUp = -1;
    for (let s = 0; s < 1200; s++) {
      step(player, 0);
      if (!player.low && stoodUp < 0) {
        stoodUp = s;
      }
    }
    expect(stoodUp).toBeGreaterThan(0);
    expect(player.box.x).toBeGreaterThanOrEqual(20 * T);
    expect(player.box.height).toBe(PLAYER_HITBOX.height);
  });

  it('dans un cul-de-sac bas, elle repart dans l’autre sens (jamais coincée)', () => {
    const low = Array.from({ length: W - 9 }, (_, i) => 8 + i);
    const player = room(low);
    player.canSlide = true;
    settle(player);
    for (let s = 0; s < 240 && player.box.x + player.box.width < 7.5 * T; s++) {
      step(player, 1);
    }
    step(player, 1, { slide: true });
    for (let s = 0; s < 6000 && player.low; s++) {
      step(player, 0);
    }
    expect(player.low).toBe(false);
    expect(player.box.x).toBeLessThan(8 * T);
  });

  it('pas de saut tant qu’un plafond empêche de se relever', () => {
    const low = Array.from({ length: 20 }, (_, i) => 8 + i);
    const player = room(low);
    player.canSlide = true;
    settle(player);
    for (let s = 0; s < 240 && player.box.x + player.box.width < 7.5 * T; s++) {
      step(player, 1);
    }
    step(player, 1, { slide: true });
    while (player.box.x < 9 * T) {
      step(player, 0);
    }
    for (let s = 0; s < 60; s++) {
      step(player, 0, { jump: s % 10 === 0 });
      expect(player.grounded).toBe(true);
    }
  });

  it('le saut depuis la glissade va plus loin qu’un saut en courant', () => {
    function jumpLength(slide: boolean): number {
      const player = room();
      player.canSlide = true;
      settle(player);
      for (let s = 0; s < 60; s++) {
        step(player, 1);
      }
      if (slide) {
        step(player, 1, { slide: true });
        for (let s = 0; s < 5; s++) {
          step(player, 1);
        }
      }
      const x = player.box.x;
      step(player, 1, { jump: true });
      for (let s = 0; s < 600 && !player.grounded; s++) {
        step(player, 1, { held: true });
      }
      return player.box.x - x;
    }
    const plain = jumpLength(false);
    const long = jumpLength(true);
    expect(long).toBeGreaterThan(plain * (P.slideJumpSpeedX / P.maxRunSpeed) * 0.95);
  });

  it('pousser à l’opposé pendant le saut long reprend le contrôle normal', () => {
    const player = room();
    player.canSlide = true;
    settle(player);
    step(player, 1, { slide: true });
    step(player, 1, { jump: true });
    const vx = player.vx;
    expect(vx).toBeCloseTo(P.slideJumpSpeedX, 6);
    step(player, -1, { held: true });
    expect(player.vx).toBeLessThan(vx);
  });

  it('jamais en l’air ; une pression juste avant d’atterrir glisse à l’atterrissage', () => {
    const player = room();
    player.canSlide = true;
    settle(player);
    step(player, 0, { jump: true });
    for (let s = 0; s < 10; s++) {
      step(player, 0, { held: true });
    }
    step(player, 0, { slide: true, held: true });
    expect(player.low).toBe(false);
    let slid = false;
    for (let s = 0; s < 300 && !slid; s++) {
      // Pression répétée en descente, à quelques pas du sol.
      const nearGround = player.vy > 0 && feet(player) > 14 * T - 4;
      step(player, 0, { slide: nearGround });
      slid = player.state === PlayerState.Slide;
    }
    expect(slid).toBe(true);
  });

  it('quitter un bord en glissant garde l’élan, borné à celui du saut long', () => {
    const pit = Array.from({ length: 20 }, (_, i) => 10 + i);
    const player = room([], pit);
    player.canSlide = true;
    settle(player);
    for (let s = 0; s < 240 && player.box.x + player.box.width < 8.5 * T; s++) {
      step(player, 1);
    }
    step(player, 1, { slide: true });
    for (let s = 0; s < 60 && player.grounded; s++) {
      step(player, 1);
    }
    expect(player.grounded).toBe(false);
    expect(player.low).toBe(false);
    expect(Math.abs(player.vx)).toBeLessThanOrEqual(P.slideJumpSpeedX);
    expect(Math.abs(player.vx)).toBeGreaterThan(P.maxRunSpeed);
  });

  it('attendre la fin du délai avant la glissade suivante', () => {
    const player = room();
    player.canSlide = true;
    settle(player);
    step(player, 0, { slide: true });
    for (let s = 1; s < D.slideSteps; s++) {
      step(player, 0);
    }
    expect(player.low).toBe(false);
    step(player, 0, { slide: true });
    expect(player.low).toBe(false);
    for (let s = 0; s < D.slideCooldownSteps + D.slideBufferSteps + 2 && !player.low; s++) {
      step(player, 0, { slide: s === D.slideCooldownSteps });
    }
    expect(player.low).toBe(true);
  });

  it('copyFrom reprend la glissade en cours (analyse de faisabilité)', () => {
    const a = room();
    a.canSlide = true;
    settle(a);
    step(a, 1, { slide: true });
    const b = room();
    b.copyFrom(a);
    expect(b.low).toBe(true);
    expect(b.box.height).toBe(a.box.height);
    for (let s = 0; s < 40; s++) {
      step(a, 1);
      step(b, 1);
    }
    expect(b.box.x).toBe(a.box.x);
    expect(b.box.y).toBe(a.box.y);
  });
});

describe('parcours 11 « Glissade » (D-84)', () => {
  const source = LEVELS.find((level) => level.id === 'glissade');
  if (!source) {
    throw new Error('Parcours glissade absent');
  }
  const level = parseAsciiLevel('glissade', source.text);
  const abilities = { climb: true, wallJump: true };

  it(
    'impossible sans la glissade, faisable avec, par les barrières basses et un saut long',
    () => {
      expect(analyzeLevel(level, P, abilities).path).toBeNull();
      const result = analyzeLevel(level, P, { ...abilities, slide: true });
      const kinds = result.path?.map((move) => move.kind) ?? [];
      expect(kinds).toContain(MoveKind.Slide);
      expect(kinds).toContain(MoveKind.SlideJump);
    },
    ANALYSIS_TIMEOUT_MS,
  );

  it(
    'la glissade ne fait qu’ajouter des passages : un parcours existant n’est jamais plus dur',
    () => {
      const other = LEVELS.find((l) => l.id === 'saut-mural');
      if (!other) {
        throw new Error('Parcours saut-mural absent');
      }
      const wall = parseAsciiLevel('saut-mural', other.text);
      const plain = analyzeLevel(wall, P, abilities);
      const withSlide = analyzeLevel(wall, P, { ...abilities, slide: true });
      expect(withSlide.path).not.toBeNull();
      expect(withSlide.critical?.windowMs ?? Infinity).toBeGreaterThanOrEqual(
        plain.critical?.windowMs ?? Infinity,
      );
    },
    ANALYSIS_TIMEOUT_MS,
  );
});
