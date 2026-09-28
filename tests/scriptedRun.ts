import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { spawnPosition } from '../src/core/level/LevelData';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import testRoom from '../src/levels/test-room.txt?raw';

/** Joueur dans la salle de test, piloté par des entrées scriptées (courses, demi-tours, sauts variés). */
export function createScriptedRun(): (steps: number) => PlayerPhysics {
  const level = parseAsciiLevel('test-room', testRoom);
  const { x, y } = spawnPosition(level, PLAYER_HITBOX.width, PLAYER_HITBOX.height);
  const player = new PlayerPhysics(level, DEFAULT_MOVEMENT, x, y);
  const input: PlayerInput = { moveX: 0, jumpPressed: false, jumpHeld: false };
  let step = 0;
  return (steps: number) => {
    for (let i = 0; i < steps; i++) {
      const t = step % 960;
      input.moveX = t < 300 ? 1 : t < 360 ? 0 : t < 700 ? -1 : t < 760 ? 0 : 1;
      const phase = step % 90;
      input.jumpPressed = phase === 0;
      input.jumpHeld = phase < (step % 270 < 90 ? 4 : step % 270 < 180 ? 20 : 60);
      player.step(input);
      step++;
    }
    return player;
  };
}
