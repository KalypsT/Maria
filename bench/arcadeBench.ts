/**
 * Mesure de la condition D-05 : la physique maison doit être au moins aussi efficace qu'Arcade.
 * Même salle, mêmes entrées scriptées, même pas de 1/120 s. Publiée dans le build de debug
 * (/Maria/debug/bench/arcade.html) pour être lancée sur téléphone.
 */
import Phaser from 'phaser';
import { TILE_SIZE } from '../src/config/display';
import {
  DEFAULT_MOVEMENT,
  PHYSICS_STEP_HZ,
  PLAYER_HITBOX,
  deriveMovement,
} from '../src/config/movement';
import { Tile, spawnPosition, tileAt, type LevelData } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import testRoom from '../src/levels/test-room.txt?raw';

const DT = 1 / PHYSICS_STEP_HZ;
const WARMUP_STEPS = 4000;
const MEASURED_STEPS = 24_000; // 200 s de jeu
const RUNS = 5;

/** Entrées scriptées en fonction du numéro de pas : courses, demi-tours, sauts de hauteurs variées. */
function scriptedInput(step: number, out: PlayerInput): void {
  const t = step % 960; // cycle de 8 s
  out.moveX = t < 300 ? 1 : t < 360 ? 0 : t < 700 ? -1 : t < 760 ? 0 : 1;
  const phase = step % 90;
  out.jumpPressed = phase === 0;
  out.jumpHeld = phase < (step % 270 < 90 ? 4 : step % 270 < 180 ? 20 : 60);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}

function makeOurs(level: LevelData) {
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  const input: PlayerInput = { moveX: 0, jumpPressed: false, jumpHeld: false };
  let step = 0;
  return (count: number) => {
    for (let i = 0; i < count; i++) {
      scriptedInput(step++, input);
      player.step(input);
    }
  };
}

class ArcadeBenchScene extends Phaser.Scene {
  constructor() {
    super('ArcadeBench');
  }

  create(): void {
    const level = parseAsciiLevel('test-room', testRoom);
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, TILE_SIZE * 3, TILE_SIZE);
    g.generateTexture('bench-tiles', TILE_SIZE * 3, TILE_SIZE);
    g.fillRect(0, 0, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
    g.generateTexture('bench-player', PLAYER_HITBOX.width, PLAYER_HITBOX.height);
    g.destroy();

    const data: number[][] = [];
    for (let row = 0; row < level.height; row++) {
      const line: number[] = [];
      for (let col = 0; col < level.width; col++) {
        const tile = tileAt(level, col, row);
        line.push(tile === Tile.Empty ? -1 : tile);
      }
      data.push(line);
    }
    const map = this.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage('bench-tiles');
    if (!tileset) {
      throw new Error('tileset');
    }
    const layer = map.createLayer(0, tileset, 0, 0);
    layer.setCollision(Tile.Solid);
    layer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      if (tile.index === Tile.OneWay) {
        tile.setCollision(false, false, true, false);
      }
    });

    const d = deriveMovement(DEFAULT_MOVEMENT);
    const p = DEFAULT_MOVEMENT;
    const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
    const sprite = this.physics.add.image(x, y, 'bench-player').setOrigin(0, 0);
    const body = sprite.body;
    body.setMaxVelocity(p.maxRunSpeed, p.maxFallSpeed);
    body.setDragX(p.groundDeceleration);
    body.setGravityY(d.riseGravity);
    this.physics.add.collider(sprite, layer);
    const world = this.physics.world;
    world.pause(); // pas avancés manuellement

    const input: PlayerInput = { moveX: 0, jumpPressed: false, jumpHeld: false };
    let step = 0;
    const runArcade = (count: number) => {
      for (let i = 0; i < count; i++) {
        scriptedInput(step++, input);
        const grounded = body.blocked.down;
        body.setAccelerationX(input.moveX * (grounded ? p.groundAcceleration : p.airAcceleration));
        if (input.jumpPressed && grounded) {
          body.setVelocityY(-d.jumpVelocity);
        }
        if (!input.jumpHeld && body.velocity.y < 0) {
          body.velocity.y *= p.jumpCutMultiplier;
        }
        world.step(DT);
        // Arcade synchronise le GameObject une fois par image : une image à 60 Hz = 2 pas.
        if ((i & 1) === 1) {
          world.postUpdate();
        }
      }
    };
    const runOurs = makeOurs(level);

    const measure = (run: (n: number) => void) => {
      run(WARMUP_STEPS);
      const samples: number[] = [];
      for (let r = 0; r < RUNS; r++) {
        const start = performance.now();
        run(MEASURED_STEPS);
        samples.push(((performance.now() - start) * 1000) / MEASURED_STEPS);
      }
      return median(samples);
    };

    // Ordre alterné pour ne pas favoriser l'un par l'échauffement du JIT.
    const oursFirst = measure(runOurs);
    const arcade = measure(runArcade);
    const oursSecond = measure(runOurs);
    const ours = Math.max(oursFirst, oursSecond);
    const result = {
      oursMicrosPerStep: ours,
      arcadeMicrosPerStep: arcade,
      ratio: arcade / ours,
      userAgent: navigator.userAgent,
    };
    Object.assign(window, { benchResult: result, runOurSteps: makeOurs(level) });
    const status = document.getElementById('status');
    const out = document.getElementById('result');
    if (status && out) {
      status.textContent =
        ours <= arcade ? 'Condition D-05 remplie.' : 'Condition D-05 NON remplie.';
      out.innerHTML =
        `<table><tr><th></th><th>µs / pas</th><th>µs / image à 60 Hz</th></tr>` +
        `<tr><td>Maison</td><td>${ours.toFixed(3)}</td><td>${(ours * 2).toFixed(3)}</td></tr>` +
        `<tr><td>Arcade</td><td>${arcade.toFixed(3)}</td><td>${(arcade * 2).toFixed(3)}</td></tr>` +
        `</table><p>Arcade / maison : ×${result.ratio.toFixed(1)}</p><p>${result.userAgent}</p>`;
    }
  }
}

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: 64,
  height: 64,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  scene: [ArcadeBenchScene],
});
