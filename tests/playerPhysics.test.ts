import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import {
  DEFAULT_MOVEMENT,
  MAX_STEPS_PER_FRAME,
  PHYSICS_STEP_HZ,
  PLAYER_HITBOX,
  type MovementParams,
} from '../src/config/movement';
import { FixedStepClock } from '../src/core/FixedStepClock';
import { BUTTON_BIT, type InputSource, type RawInput } from '../src/core/input/InputAction';
import { InputController } from '../src/core/input/InputController';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState, nextPlayerState } from '../src/core/player/playerState';
import testRoom from '../src/levels/test-room.txt?raw';

const FLOOR = [
  '############################################################',
  '#..........................................................#',
  '#..........................................................#',
  '#..........................................................#',
  '#..........................................................#',
  '#..........................................................#',
  '#..........................................................#',
  '#..........................................................#',
  '#P.........................................................#',
  '############################################################',
];
const LEDGE = [
  '##############################',
  '#............................#',
  '#P...........................#',
  '#######......................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '#............................#',
  '##############################',
];
const AIR = [
  '##########',
  '#........#',
  '#...P....#',
  '#........#',
  '#........#',
  '#........#',
  '#........#',
  '#........#',
  '##########',
];
const ONE_WAY = [
  '##########',
  '#........#',
  '#........#',
  '#........#',
  '#........#',
  '#..====..#',
  '#........#',
  '#...P....#',
  '##########',
];
const HANGING_BLOCK = [
  '##########',
  '#........#',
  '#........#',
  '#...#....#',
  '#........#',
  '#........#',
  '#........#',
  '#P.......#',
  '##########',
];

function makePlayer(map: string[] | string, overrides: Partial<MovementParams> = {}) {
  const level = parseAsciiLevel('test', Array.isArray(map) ? map.join('\n') : map);
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  return new PlayerPhysics(level, { ...DEFAULT_MOVEMENT, ...overrides }, x, y);
}

const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
function step(
  player: PlayerPhysics,
  moveX = 0,
  jumpHeld = false,
  jumpPressed = false,
  moveY = 0,
): void {
  input.moveX = moveX;
  input.moveY = moveY;
  input.jumpHeld = jumpHeld;
  input.jumpPressed = jumpPressed;
  player.step(input);
}

const dt = 1 / PHYSICS_STEP_HZ;
const p = DEFAULT_MOVEMENT;

/** Hauteur maximale (px) d'un saut dont le bouton est maintenu `holdSteps` pas. */
function jumpHeight(holdSteps: number, overrides: Partial<MovementParams> = {}): number {
  const player = makePlayer(FLOOR, overrides);
  const startY = player.box.y;
  let minY = startY;
  for (let i = 0; i < 240; i++) {
    step(player, 0, i < holdSteps, i === 0);
    minY = Math.min(minY, player.box.y);
  }
  expect(player.grounded).toBe(true);
  return startY - minY;
}

describe('déplacement horizontal', () => {
  it('accélère de façon perceptible jusqu’à la vitesse max sans la dépasser', () => {
    const player = makePlayer(FLOOR);
    step(player, 1);
    expect(player.vx).toBeCloseTo(p.groundAcceleration * dt, 9);
    const stepsToMax = Math.ceil(p.maxRunSpeed / (p.groundAcceleration * dt));
    expect(stepsToMax).toBeGreaterThan(1);
    for (let i = 1; i < stepsToMax - 1; i++) {
      step(player, 1);
    }
    expect(player.vx).toBeLessThan(p.maxRunSpeed);
    step(player, 1);
    expect(player.vx).toBe(p.maxRunSpeed);
    step(player, 1);
    expect(player.vx).toBe(p.maxRunSpeed);
    expect(player.state).toBe(PlayerState.Run);
  });

  it('s’arrête en un nombre de pas contrôlé', () => {
    const player = makePlayer(FLOOR);
    for (let i = 0; i < 60; i++) {
      step(player, 1);
    }
    const stopSteps = Math.ceil(p.maxRunSpeed / (p.groundDeceleration * dt));
    for (let i = 0; i < stopSteps - 1; i++) {
      step(player);
    }
    expect(player.vx).toBeGreaterThan(0);
    step(player);
    expect(player.vx).toBe(0);
    step(player);
    expect(player.vx).toBe(0);
    expect(player.state).toBe(PlayerState.Idle);
  });

  it('fait demi-tour avec l’accélération de demi-tour', () => {
    const player = makePlayer(FLOOR);
    for (let i = 0; i < 60; i++) {
      step(player, 1);
    }
    step(player, -1);
    expect(player.vx).toBeCloseTo(p.maxRunSpeed - p.groundTurnAcceleration * dt, 9);
    expect(player.facing).toBe(-1);
  });

  it('garde un contrôle aérien', () => {
    const player = makePlayer(FLOOR);
    step(player, 0, true, true);
    step(player, 1, true);
    expect(player.grounded).toBe(false);
    expect(player.vx).toBeCloseTo(p.airAcceleration * dt, 9);
    for (let i = 0; i < 20; i++) {
      step(player, 1, true);
    }
    step(player, -1, true);
    const before = Math.min(21 * p.airAcceleration * dt, p.maxRunSpeed);
    expect(player.vx).toBeCloseTo(before - p.airTurnAcceleration * dt, 9);
  });
});

describe('saut', () => {
  it('atteint la hauteur configurée en maintenant le bouton', () => {
    expect(jumpHeight(1000)).toBeCloseTo(p.jumpHeightTiles * T, 1);
  });

  it('permet des sauts courts, moyens et complets', () => {
    const short = jumpHeight(1);
    const medium = jumpHeight(20);
    const full = jumpHeight(1000);
    expect(short).toBeGreaterThan(0.5 * T);
    expect(medium).toBeGreaterThan(short + T / 2);
    expect(full).toBeGreaterThan(medium + T / 2);
  });

  it('enchaîne Jump, Fall, Land puis Idle', () => {
    const player = makePlayer(FLOOR);
    const states = new Set<string>();
    const sequence: string[] = [];
    for (let i = 0; i < 240; i++) {
      step(player, 0, true, i === 0);
      if (!states.has(player.state)) {
        states.add(player.state);
        sequence.push(player.state);
      }
    }
    expect(sequence).toEqual([
      PlayerState.Jump,
      PlayerState.Fall,
      PlayerState.Land,
      PlayerState.Idle,
    ]);
  });

  it('ne resaute pas en maintenant le bouton', () => {
    const player = makePlayer(FLOOR);
    let jumps = 0;
    let wasGrounded = true;
    for (let i = 0; i < 480; i++) {
      step(player, 0, true, i === 0);
      if (wasGrounded && !player.grounded) {
        jumps++;
      }
      wasGrounded = player.grounded;
    }
    expect(jumps).toBe(1);
  });
});

/** Options de forme du saut (D-19), activées. */
const SHAPE_OPTIONS: Partial<MovementParams> = { jumpReleaseMode: 1, apexHangSpeed: 60 };

describe('forme du saut (D-19, options désactivées par défaut)', () => {
  it('sont désactivées par défaut', () => {
    expect(p.jumpReleaseMode).toBe(0);
    expect(p.apexHangSpeed).toBe(0);
  });

  it('relâchement progressif : hauteur variable conservée, sans cassure de vitesse', () => {
    const release = { jumpReleaseMode: 1 };
    const short = jumpHeight(1, release);
    const medium = jumpHeight(20, release);
    const full = jumpHeight(1000, release);
    expect(medium).toBeGreaterThan(short + T / 2);
    expect(full).toBeGreaterThan(medium + T / 2);
    expect(full).toBeCloseTo(p.jumpHeightTiles * T, 1);

    // Plus grand changement de vitesse verticale d'un pas à l'autre, relâché après 10 pas.
    const maxDelta = (overrides: Partial<MovementParams>) => {
      const player = makePlayer(FLOOR, overrides);
      let previous = 0;
      let max = 0;
      for (let i = 0; i < 120; i++) {
        step(player, 0, i < 10, i === 0);
        if (player.grounded) {
          break;
        }
        if (i > 0) {
          max = Math.max(max, Math.abs(player.vy - previous));
        }
        previous = player.vy;
      }
      return max;
    };
    const derived = new PlayerPhysics(parseAsciiLevel('t', 'P'), p, 0, 0).derived;
    expect(maxDelta(release)).toBeLessThanOrEqual(
      derived.riseGravity * p.releaseGravityMultiplier * dt + 1e-9,
    );
    // Avec la coupure (Phase 1), la vitesse est divisée d'un coup.
    expect(maxDelta({})).toBeGreaterThan(derived.jumpVelocity * 0.2);
  });

  it('flottement au sommet : plus long en l’air, un peu plus haut, seulement Saut maintenu', () => {
    const airtime = (holdSteps: number, overrides: Partial<MovementParams>) => {
      const player = makePlayer(FLOOR, overrides);
      let steps = 0;
      step(player, 0, holdSteps > 0, true);
      while (!player.grounded && steps < 500) {
        step(player, 0, steps < holdSteps);
        steps++;
      }
      return steps;
    };
    const hang = { apexHangSpeed: 60 };
    expect(airtime(1000, hang)).toBeGreaterThan(airtime(1000, {}) + 6);
    const full = jumpHeight(1000, hang);
    expect(full).toBeGreaterThan(p.jumpHeightTiles * T);
    expect(full).toBeLessThan(p.jumpHeightTiles * T * 1.25);
    // Bouton relâché tôt : pas de flottement.
    expect(airtime(4, hang)).toBe(airtime(4, {}));
  });
});

describe('touchée (D-20)', () => {
  it('recule, ignore direction et saut pendant la perte de contrôle, puis rend la main', () => {
    const player = makePlayer(FLOOR);
    player.vx = 150;
    player.vy = -200;
    player.startHurt(24);
    expect(player.grounded).toBe(false);
    for (let i = 0; i < 23; i++) {
      step(player, -1, true, true);
      expect(player.state).toBe(PlayerState.Hurt);
      expect(player.facing).toBe(1);
    }
    // Pendant le recul, la direction tenue à gauche n'a pas freiné le recul vers la droite.
    expect(player.vx).toBeGreaterThan(0);
    step(player, 1);
    expect(player.state).not.toBe(PlayerState.Hurt);
    // Le saut pressé pendant le recul n'a pas été mémorisé.
    for (let i = 0; i < 120; i++) {
      step(player, 0);
    }
    expect(player.grounded).toBe(true);
    expect(player.vy).toBe(0);
    // Contrôle rendu : on court et on saute normalement.
    step(player, 1, true, true);
    expect(player.vy).toBeLessThan(0);
  });
});

describe('coyote time', () => {
  /** Saute alors que `airSteps` pas se sont écoulés depuis le dernier contact avec le sol. */
  function jumpAfterLeaving(airSteps: number): boolean {
    const player = makePlayer(LEDGE);
    for (let guard = 0; player.grounded; guard++) {
      expect(guard).toBeLessThan(500);
      step(player, 1);
    }
    for (let k = 1; k < airSteps; k++) {
      step(player, 1);
    }
    expect(player.stepsSinceGrounded).toBe(airSteps);
    step(player, 1, true, true);
    return player.vy < 0;
  }

  it('autorise le saut jusqu’à la borne exacte', () => {
    const coyoteSteps = Math.round((p.coyoteTimeMs / 1000) * PHYSICS_STEP_HZ);
    expect(jumpAfterLeaving(1)).toBe(true);
    expect(jumpAfterLeaving(coyoteSteps)).toBe(true);
    expect(jumpAfterLeaving(coyoteSteps + 1)).toBe(false);
  });

  it('ne donne pas de second saut après un saut', () => {
    const player = makePlayer(FLOOR);
    step(player, 0, true, true);
    step(player, 0, false);
    step(player, 0, true, true);
    expect(player.vy).toBeGreaterThan(-player.derived.jumpVelocity * 0.9);
  });
});

describe('jump buffering', () => {
  function landingStep(): number {
    const player = makePlayer(AIR);
    for (let i = 1; i < 500; i++) {
      step(player);
      if (player.grounded) {
        return i;
      }
    }
    throw new Error('pas d’atterrissage');
  }

  /** Presse le saut `stepsBefore` pas avant le pas où le saut peut partir (celui qui suit l'atterrissage). */
  function bufferedJump(stepsBefore: number): boolean {
    const jumpStep = landingStep() + 1;
    const pressStep = jumpStep - stepsBefore;
    const player = makePlayer(AIR);
    let jumped = false;
    for (let i = 1; i <= jumpStep + 30; i++) {
      step(player, 0, i >= pressStep, i === pressStep);
      if (i >= jumpStep && player.vy < 0) {
        jumped = true;
      }
    }
    return jumped;
  }

  it('mémorise la pression jusqu’à la borne exacte', () => {
    const bufferSteps = Math.round((p.jumpBufferMs / 1000) * PHYSICS_STEP_HZ);
    expect(bufferedJump(0)).toBe(true);
    expect(bufferedJump(bufferSteps)).toBe(true);
    expect(bufferedJump(bufferSteps + 1)).toBe(false);
  });

  it('fait un petit saut si le bouton a été relâché avant l’atterrissage', () => {
    const player = makePlayer(AIR);
    let landed = false;
    let pressed = false;
    let minY = Infinity;
    let startY = 0;
    for (let i = 0; i < 300; i++) {
      const press: boolean = !pressed && player.box.y + player.box.height > 8 * T - 12;
      pressed ||= press;
      step(player, 0, press, press);
      if (!landed && player.vy < 0) {
        landed = true;
        startY = player.prevY;
      }
      if (landed) {
        minY = Math.min(minY, player.box.y);
      }
    }
    expect(landed).toBe(true);
    expect(startY - minY).toBeLessThan(jumpHeight(1) + 1);
  });
});

describe('collisions du joueur', () => {
  it('traverse une plateforme par le dessous et s’y pose', () => {
    const player = makePlayer(ONE_WAY);
    for (let i = 0; i < 200; i++) {
      step(player, 0, true, i === 0);
    }
    expect(player.grounded).toBe(true);
    expect(player.box.y + player.box.height).toBe(5 * T);
  });

  it('ne traverse pas le sol ni les murs à vitesse extrême', () => {
    const player = makePlayer(AIR, {
      maxFallSpeed: 100_000,
      fallGravityMultiplier: 4,
      maxRunSpeed: 100_000,
      airAcceleration: 1e9,
    });
    for (let i = 0; i < 60; i++) {
      step(player, 1);
    }
    expect(player.box.y + player.box.height).toBe(8 * T);
    expect(player.box.x + player.box.width).toBe(9 * T);
  });

  it('ne traverse pas le sol à la vitesse de chute max par défaut', () => {
    const player = makePlayer(AIR);
    for (let i = 0; i < 200; i++) {
      step(player);
      expect(player.vy).toBeLessThanOrEqual(p.maxFallSpeed);
    }
    expect(player.box.y + player.box.height).toBe(8 * T);
  });

  it('contourne un coin de plafond frôlé', () => {
    const player = makePlayer(HANGING_BLOCK);
    const y = 8 * T - PLAYER_HITBOX.height;
    const overlap = p.cornerCorrectionPx - 1;
    player.reset(4 * T - PLAYER_HITBOX.width + overlap, y);
    let minY = y;
    for (let i = 0; i < 120; i++) {
      step(player, 0, true, i === 0);
      minY = Math.min(minY, player.box.y);
    }
    expect(player.box.x).toBe(4 * T - PLAYER_HITBOX.width);
    expect(y - minY).toBeCloseTo(p.jumpHeightTiles * T, 1);
  });

  it('bute contre un plafond franchement chevauché', () => {
    const player = makePlayer(HANGING_BLOCK);
    const y = 8 * T - PLAYER_HITBOX.height;
    const x = 4 * T - PLAYER_HITBOX.width + p.cornerCorrectionPx + 1;
    player.reset(x, y);
    let minY = y;
    for (let i = 0; i < 120; i++) {
      step(player, 0, true, i === 0);
      minY = Math.min(minY, player.box.y);
    }
    expect(player.box.x).toBe(x);
    expect(minY).toBe(4 * T);
  });
});

describe('traversée d’une plateforme (Bas + Saut)', () => {
  // Plateforme traversable en ligne 5 (dessus à 5 * T), sol plein en ligne 8, plateforme basse en ligne 7.
  const STACK = [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#..====..#',
    '#........#',
    '#..====..#',
    '#P.......#',
    '##########',
  ];
  const LOWER_PLATFORM = 7;

  function standOnUpperPlatform(map: string[] = STACK): PlayerPhysics {
    const player = makePlayer(map);
    player.reset(4 * T, 5 * T - PLAYER_HITBOX.height);
    step(player); // se pose
    expect(player.grounded).toBe(true);
    return player;
  }

  it('descend à travers la plateforme au lieu de sauter', () => {
    const player = standOnUpperPlatform(
      STACK.map((row, i) => (i === LOWER_PLATFORM ? '#........#' : row)),
    );
    step(player, 0, true, true, 1);
    expect(player.vy).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 200; i++) {
      step(player, 0, false, false, 1);
    }
    expect(player.grounded).toBe(true);
    expect(player.box.y + player.box.height).toBe(9 * T);
  });

  it('se pose ensuite sur la plateforme suivante', () => {
    const player = standOnUpperPlatform();
    step(player, 0, true, true, 1);
    for (let i = 0; i < 200; i++) {
      step(player, 0, false, false, 0);
    }
    expect(player.grounded).toBe(true);
    expect(player.box.y + player.box.height).toBe(7 * T);
  });

  it('ne donne pas de saut supplémentaire (le saut mémorisé est consommé)', () => {
    const player = standOnUpperPlatform();
    step(player, 0, true, true, 1);
    let minVy = 0;
    for (let i = 0; i < 100; i++) {
      step(player, 0, true, false, 1);
      minVy = Math.min(minVy, player.vy);
    }
    expect(minVy).toBe(0);
  });

  it('saute normalement sur un sol plein, même en tenant Bas', () => {
    const player = makePlayer(FLOOR);
    step(player);
    step(player, 0, true, true, 1);
    expect(player.vy).toBeLessThan(0);
  });

  it('respecte le seuil de l’axe vertical', () => {
    const player = standOnUpperPlatform();
    step(player, 0, true, true, DEFAULT_MOVEMENT.dropInputThreshold);
    expect(player.vy).toBeLessThan(0);
  });

  it('reste posé sur une plateforme si le saut n’est pas demandé', () => {
    const player = standOnUpperPlatform();
    for (let i = 0; i < 100; i++) {
      step(player, 0, false, false, 1);
    }
    expect(player.grounded).toBe(true);
    expect(player.box.y + player.box.height).toBe(5 * T);
  });
});

describe('déterminisme selon la fréquence d’affichage', () => {
  /** Entrées scriptées en fonction du temps, changées juste après des multiples de 1/6 s. */
  class ScriptedSource implements InputSource {
    time = 0;
    read(into: RawInput): void {
      const t = this.time - 1e-4;
      const s = t * 6; // en sixièmes de seconde
      if (s > 1 && s <= 9) into.moveX += 1;
      if (s > 11 && s <= 17) into.moveX -= 1;
      if (s > 20 && s <= 26) into.moveX += 1;
      if ((s > 2 && s <= 5) || (s > 8 && s <= 9) || (s > 13 && s <= 18) || (s > 22 && s <= 23)) {
        into.held |= BUTTON_BIT.Jump;
      }
    }
  }

  function simulate(
    hz: number,
    seconds: number,
    params: MovementParams = DEFAULT_MOVEMENT,
  ): number[] {
    const level = parseAsciiLevel('test-room', testRoom);
    const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
    const player = new PlayerPhysics(level, params, x, y);
    const clock = new FixedStepClock(1 / PHYSICS_STEP_HZ, MAX_STEPS_PER_FRAME);
    const controller = new InputController();
    const source = new ScriptedSource();
    controller.sources.push(source);
    const trajectory: number[] = [];
    const frames = Math.round(seconds * hz);
    for (let i = 1; i <= frames; i++) {
      source.time = i / hz;
      controller.update();
      const steps = clock.advance(i / hz - (i - 1) / hz);
      for (let s = 0; s < steps; s++) {
        input.moveX = controller.moveX;
        input.jumpPressed = controller.consumePressed('Jump');
        input.jumpHeld = controller.isHeld('Jump');
        player.step(input);
        trajectory.push(player.box.x, player.box.y);
      }
    }
    return trajectory;
  }

  it('produit exactement la même trajectoire à 60, 90, 120 et 144 Hz', () => {
    const reference = simulate(120, 5);
    expect(reference.length).toBe(5 * PHYSICS_STEP_HZ * 2);
    // La trajectoire doit réellement bouger (sauts et déplacements).
    expect(new Set(reference.filter((_, i) => i % 2 === 1)).size).toBeGreaterThan(20);
    for (const hz of [60, 90, 144]) {
      expect(simulate(hz, 5), `${hz} Hz`).toEqual(reference);
    }
  });

  it('reste identique à toutes les fréquences avec les options de saut (D-19)', () => {
    const params = { ...DEFAULT_MOVEMENT, ...SHAPE_OPTIONS };
    const reference = simulate(120, 5, params);
    expect(reference).not.toEqual(simulate(120, 5));
    for (const hz of [60, 90, 144]) {
      expect(simulate(hz, 5, params), `${hz} Hz`).toEqual(reference);
    }
  });
});

describe('nextPlayerState', () => {
  it('décrit l’air selon le sens de la vitesse verticale', () => {
    expect(nextPlayerState(PlayerState.Idle, false, true, false, 0)).toBe(PlayerState.Jump);
    expect(nextPlayerState(PlayerState.Jump, false, false, false, 0)).toBe(PlayerState.Fall);
  });

  it('passe par Land à la réception, sauf en courant', () => {
    expect(nextPlayerState(PlayerState.Fall, true, false, false, 3)).toBe(PlayerState.Land);
    expect(nextPlayerState(PlayerState.Fall, true, false, true, 3)).toBe(PlayerState.Run);
    expect(nextPlayerState(PlayerState.Land, true, false, false, 0)).toBe(PlayerState.Idle);
    expect(nextPlayerState(PlayerState.Idle, true, false, false, 3)).toBe(PlayerState.Idle);
  });
});
