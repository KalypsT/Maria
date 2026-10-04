import { describe, expect, it } from 'vitest';
import { DEFAULT_CAMERA, type CameraParams } from '../src/config/camera';
import { GAME_HEIGHT, TILE_SIZE as T } from '../src/config/display';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { CameraController } from '../src/core/camera/CameraController';
import { spawnPosition, type LevelData } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';

/** Épaisseur du sol des salles de test : la vue n'est pas bornée par le bas de la salle. */
const FLOOR_TILES = 20;

/**
 * Salle fermée de `width` × `height` tuiles, sol épais en bas (dessus à la ligne
 * `height - FLOOR_TILES`), départ au milieu ; `edit` modifie la grille.
 */
function room(
  width: number,
  height: number,
  edit?: (grid: string[][]) => void,
  floorTiles = FLOOR_TILES,
): LevelData {
  const grid: string[][] = [];
  for (let row = 0; row < height; row++) {
    const wall = row === 0 || row >= height - floorTiles;
    grid.push(
      Array.from({ length: width }, (_, col) =>
        wall || col === 0 || col === width - 1 ? '#' : '.',
      ),
    );
  }
  const spawnRow = grid[height - floorTiles - 1];
  if (spawnRow) {
    spawnRow[Math.floor(width / 2)] = 'P';
  }
  edit?.(grid);
  return parseAsciiLevel('camera', grid.map((row) => row.join('')).join('\n'));
}

interface Rig {
  level: LevelData;
  player: PlayerPhysics;
  camera: CameraController;
  input: PlayerInput;
  /** Avance de `steps` pas ; `each` est appelé après chaque pas. */
  run: (steps: number, each?: () => void) => void;
}

function rig(level: LevelData, camera: Partial<CameraParams> = {}, gameWidth = 640): Rig {
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  const cam = new CameraController({ ...DEFAULT_CAMERA, ...camera });
  cam.setView(gameWidth, GAME_HEIGHT);
  cam.setBounds(level.width * T, level.height * T);
  cam.reset(player);
  const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };
  return {
    level,
    player,
    camera: cam,
    input,
    run(steps, each) {
      for (let i = 0; i < steps; i++) {
        player.step(input);
        cam.lookInput = input.moveY;
        cam.step(player);
        input.jumpPressed = false;
        each?.();
      }
    },
  };
}

function feet(player: PlayerPhysics): number {
  return player.box.y + player.box.height;
}

function centerX(player: PlayerPhysics): number {
  return player.box.x + player.box.width / 2;
}

describe('CameraController', () => {
  it('cadre Céleste au départ : centrée horizontalement, pieds sous le centre', () => {
    const { camera, player } = rig(room(200, 60));
    expect(camera.x).toBeCloseTo(centerX(player));
    expect(camera.y).toBeCloseTo(feet(player) - DEFAULT_CAMERA.verticalOffsetPx);
  });

  it('reste immobile quand Céleste ne bouge pas', () => {
    const r = rig(room(200, 60));
    const { x, y } = r.camera;
    r.run(600, () => {
      expect(r.camera.x).toBe(x);
      expect(r.camera.y).toBe(y);
    });
  });

  it('ne bouge pas en vertical pendant un saut complet sur sol plat', () => {
    const r = rig(room(200, 60));
    const y = r.camera.y;
    r.input.jumpPressed = true;
    r.input.jumpHeld = true;
    let airborne = 0;
    r.run(240, () => {
      if (!r.player.grounded) {
        airborne++;
      }
      expect(r.camera.y).toBe(y);
    });
    expect(airborne).toBeGreaterThan(60);
  });

  it('ignore un petit tapotement : ni anticipation, ni sortie de la zone morte', () => {
    const r = rig(room(200, 60));
    const x = r.camera.x;
    r.input.moveX = 1;
    r.run(8);
    r.input.moveX = 0;
    r.run(720);
    expect(r.camera.lookAheadOffset).toBe(0);
    expect(r.camera.x).toBe(x);
  });

  it('anticipe dans le sens de la course, sans à-coups ni oscillation', () => {
    const r = rig(room(300, 60));
    r.input.moveX = 1;
    let previous = r.camera.x;
    r.run(360, () => {
      expect(r.camera.x).toBeGreaterThanOrEqual(previous);
      previous = r.camera.x;
    });
    // À vitesse constante, la vue a pris de l'avance sur Céleste.
    expect(r.camera.x - centerX(r.player)).toBeGreaterThan(DEFAULT_CAMERA.lookAheadPx * 0.5);
    // À l'arrêt, l'anticipation reste en place : la vue ne revient pas en arrière.
    r.input.moveX = 0;
    previous = r.camera.x;
    r.run(240, () => {
      expect(r.camera.x).toBeGreaterThanOrEqual(previous);
      previous = r.camera.x;
    });
  });

  it('se recadre en douceur, sans dépasser, après un atterrissage plus haut', () => {
    // Marche de 3 tuiles à droite du départ.
    const level = room(200, 60, (grid) => {
      for (let row = 37; row < 40; row++) {
        for (let col = 104; col < 130; col++) {
          const line = grid[row];
          if (line) {
            line[col] = '#';
          }
        }
      }
    });
    const r = rig(level);
    const startY = r.camera.y;
    r.input.moveX = 1;
    r.input.jumpPressed = true;
    r.input.jumpHeld = true;
    let landedAt = -1;
    let step = 0;
    r.run(80, () => {
      step++;
      if (landedAt < 0 && r.player.grounded && step > 5) {
        landedAt = step;
      }
      if (landedAt < 0) {
        expect(r.camera.y).toBe(startY);
      }
    });
    expect(landedAt).toBeGreaterThan(0);
    r.input.moveX = 0;
    const target = feet(r.player) - DEFAULT_CAMERA.verticalOffsetPx;
    let previous = r.camera.y;
    r.run(240, () => {
      expect(r.camera.y).toBeLessThanOrEqual(previous);
      expect(r.camera.y).toBeGreaterThanOrEqual(target - 1e-9);
      previous = r.camera.y;
    });
    expect(r.camera.y).toBeCloseTo(target, 1);
  });

  it('garde Céleste visible pendant une longue chute', () => {
    // Départ sur un rebord en haut d'un puits de 50 tuiles.
    const level = room(60, 90, (grid) => {
      const spawnRow = grid[69];
      if (spawnRow) {
        spawnRow[30] = '.';
      }
      const ledge = grid[10];
      if (ledge) {
        for (let col = 1; col < 20; col++) {
          ledge[col] = '#';
        }
      }
      const top = grid[9];
      if (top) {
        top[17] = 'P';
      }
    });
    const r = rig(level);
    r.input.moveX = 1;
    const margin = DEFAULT_CAMERA.screenMarginPx;
    let fell = false;
    r.run(600, () => {
      const box = r.player.box;
      if (feet(r.player) > 30 * T) {
        fell = true;
      }
      expect(box.y).toBeGreaterThanOrEqual(r.camera.y - r.camera.viewHeight / 2 + margin - 1e-6);
      expect(box.y + box.height).toBeLessThanOrEqual(
        r.camera.y + r.camera.viewHeight / 2 - margin + 1e-6,
      );
    });
    expect(fell).toBe(true);
    expect(r.player.grounded).toBe(true);
  });

  it('montre le terrain sous Céleste pendant une chute rapide, puis se pose sans rebond', () => {
    const level = room(60, 90, (grid) => {
      const spawnRow = grid[69];
      if (spawnRow) {
        spawnRow[30] = '.';
      }
      const ledge = grid[10];
      if (ledge) {
        for (let col = 1; col < 20; col++) {
          ledge[col] = '#';
        }
      }
      const top = grid[9];
      if (top) {
        top[17] = 'P';
      }
    });
    const r = rig(level);
    r.input.moveX = 1;
    r.run(80);
    r.input.moveX = 0;
    let fastSteps = 0;
    let previousY = r.camera.y;
    let direction = 0;
    let reversals = 0;
    r.run(900, () => {
      const below = r.camera.y + r.camera.viewHeight / 2 - (r.player.box.y + r.player.box.height);
      if (!r.player.grounded && r.player.vy >= DEFAULT_MOVEMENT.maxFallSpeed - 1) {
        fastSteps++;
        // Au moins 150 px (≈ 0,4 s de chute) visibles sous les pieds une fois la chute lancée.
        if (fastSteps > 90) {
          expect(below).toBeGreaterThanOrEqual(150);
        }
      }
      const d = r.camera.y - previousY;
      if (Math.abs(d) > 1e-9) {
        const sign = Math.sign(d);
        if (direction !== 0 && sign !== direction) {
          reversals++;
        }
        direction = sign;
      }
      previousY = r.camera.y;
    });
    expect(fastSteps).toBeGreaterThan(120);
    expect(r.player.grounded).toBe(true);
    // Descente pendant la chute, puis au plus un changement de sens (remontée douce à l'arrivée).
    expect(reversals).toBeLessThanOrEqual(1);
  });

  it('ne montre jamais l’extérieur de la salle', () => {
    const r = rig(room(80, 40));
    const halfW = r.camera.viewWidth / 2;
    const halfH = r.camera.viewHeight / 2;
    r.input.moveX = -1;
    r.run(900, () => {
      expect(r.camera.x - halfW).toBeGreaterThanOrEqual(0);
      expect(r.camera.x + halfW).toBeLessThanOrEqual(80 * T);
      expect(r.camera.y + halfH).toBeLessThanOrEqual(40 * T);
    });
    expect(r.camera.x).toBe(halfW);
  });

  it('centre une salle plus petite que la vue', () => {
    const r = rig(room(30, 15, undefined, 1));
    r.input.moveX = 1;
    r.run(300, () => {
      expect(r.camera.x).toBe(15 * T);
      expect(r.camera.y).toBe(7.5 * T);
    });
  });

  it('garde le même cadrage autour de Céleste en 640 et en 800 de large', () => {
    const narrow = rig(room(300, 60), {}, 640);
    const wide = rig(room(300, 60), {}, 800);
    for (const r of [narrow, wide]) {
      r.input.moveX = 1;
    }
    for (let i = 0; i < 400; i++) {
      if (i % 90 === 0) {
        narrow.input.jumpPressed = wide.input.jumpPressed = true;
      }
      narrow.input.jumpHeld = wide.input.jumpHeld = i % 90 < 30;
      narrow.run(1);
      wide.run(1);
      expect(wide.camera.x - centerX(wide.player)).toBeCloseTo(
        narrow.camera.x - centerX(narrow.player),
        9,
      );
      expect(wide.camera.y).toBeCloseTo(narrow.camera.y, 9);
    }
  });

  it('applique le zoom à la surface visible', () => {
    const r = rig(room(200, 60), { zoom: 2 }, 800);
    expect(r.camera.viewWidth).toBe(400);
    expect(r.camera.viewHeight).toBe(GAME_HEIGHT / 2);
  });

  it('regarde en bas à l’arrêt seulement si activé, après le délai', () => {
    const off = rig(room(200, 60));
    const y0 = off.camera.y;
    off.input.moveY = 1;
    off.run(240);
    expect(off.camera.y).toBe(y0);

    const on = rig(room(200, 60), { lookEnabled: 1 });
    on.input.moveY = 1;
    const delaySteps = (DEFAULT_CAMERA.lookDelayMs * 120) / 1000;
    on.run(delaySteps - 1);
    expect(on.camera.y).toBe(y0);
    on.run(360);
    expect(on.camera.y).toBeGreaterThan(y0 + DEFAULT_CAMERA.lookDistancePx * 0.9);
    on.input.moveY = 0;
    on.run(360);
    expect(on.camera.y).toBeCloseTo(y0, 2);
  });

  it('regard de l’histoire (D-122) : la vue glisse vers un point, y reste, puis revient sur Céleste', () => {
    const r = rig(room(200, 60));
    const restX = r.camera.x;
    const restY = r.camera.y;
    const target = { x: 150 * T, y: 30 * T };
    r.camera.focus(target.x, target.y);
    expect(r.camera.looking).toBe(true);
    // Pas de saut : la vue glisse.
    r.run(1);
    expect(Math.abs(r.camera.x - restX)).toBeLessThan(50 * T);
    r.run(720);
    expect(r.camera.x).toBeCloseTo(target.x, 0);
    expect(r.camera.y).toBeCloseTo(target.y, 0);
    r.camera.release();
    r.run(1);
    expect(Math.abs(r.camera.x - target.x)).toBeLessThan(50 * T);
    r.run(720);
    expect(r.camera.looking).toBe(false);
    // Revenue à moins de 2 px, puis le suivi ordinaire (sa zone morte) reprend.
    expect(Math.abs(r.camera.x - restX)).toBeLessThan(3);
    expect(Math.abs(r.camera.y - restY)).toBeLessThan(3);
  });

  it('le regard s’arrête en changeant de salle (reset)', () => {
    const r = rig(room(200, 60));
    r.camera.focus(150 * T, 30 * T);
    r.run(30);
    r.camera.reset(r.player);
    expect(r.camera.looking).toBe(false);
    expect(r.camera.x).toBeCloseTo(centerX(r.player));
  });
});
