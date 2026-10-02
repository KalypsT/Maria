import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { EntityType } from '../src/core/level/LevelData';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { PlayerState } from '../src/core/player/playerState';
import { Pickups, secretId } from '../src/core/world/Pickups';
import { level, phase } from './zoneGraph';

const P3 = phase(3);

/**
 * Les revisites avec la glissade (D-91) : dans quatre salles déjà vues, une trouvaille cachée dans
 * un passage bas d'une tuile (ou derrière). `from` : la tuile où Céleste se tient devant le passage ;
 * `dir` : le sens où elle glisse.
 */
const CASES = [
  { name: 'le salon, sous le canapé', room: 'living', from: { col: 6, row: 21 }, dir: 1 },
  {
    name: 'la terrasse, sous la table de jardin',
    room: 'garden-terrace',
    from: { col: 32, row: 21 },
    dir: 1,
  },
  { name: 'la rue, sous la palissade', room: 'street', from: { col: 182, row: 27 }, dir: 1 },
  {
    name: 'le hall de la gare, sous le kiosque',
    room: 'station-hall',
    from: { col: 49, row: 37 },
    dir: -1,
  },
] as const;

/** La nouvelle trouvaille de la salle (dans le passage bas, ou derrière). */
function secretOf(room: string, from: { col: number; row: number }, dir: number) {
  const data = level(room);
  const found = data.entities
    .filter(
      (e) => e.type === EntityType.Secret && e.row === from.row && (e.col - from.col) * dir > 0,
    )
    .sort((a, b) => (a.col - from.col) * dir - (b.col - from.col) * dir)[0];
  if (!found) {
    throw new Error(`${room} : pas de trouvaille`);
  }
  return found;
}

const input: PlayerInput = { moveX: 0, moveY: 0, jumpPressed: false, jumpHeld: false };

/**
 * Céleste (phase 3) devant le passage pousse vers lui pendant `steps` pas, en glissant toutes les
 * 30 pas si `slide` ; retourne la trouvaille ramassée et la Céleste simulée.
 */
function attempt(room: string, from: { col: number; row: number }, dir: number, slide: boolean) {
  const data = level(room);
  const { width, height } = P3.hitbox;
  const player = new PlayerPhysics(
    data,
    phaseMovement(DEFAULT_MOVEMENT, P3),
    (from.col + 0.5) * T - width / 2,
    (from.row + 1) * T - height,
    P3.hitbox,
  );
  player.canClimb = player.canWallJump = player.canGlide = player.canHook = true;
  player.canSlide = slide;
  const pickups = new Pickups();
  pickups.load(data, [], []);
  let picked: string | null = null;
  for (let s = 0; s < 900 && picked === null; s++) {
    input.moveX = dir;
    input.jumpPressed = !slide && s % 40 === 0;
    input.jumpHeld = input.jumpPressed;
    input.abilityPressed = slide && s % 30 === 0;
    player.step(input);
    const index = pickups.step(player.box);
    if (index >= 0) {
      picked = pickups.items[index]?.id ?? null;
    }
  }
  return { picked, player };
}

describe('les revisites avec la glissade (D-91)', () => {
  it.each(CASES)('$name : la trouvaille seulement en glissant', ({ room, from, dir }) => {
    const secret = secretOf(room, from, dir);
    const id = secretId(room, secret.col, secret.row);
    expect(attempt(room, from, dir, true).picked).toBe(id);
    expect(attempt(room, from, dir, false).picked, 'sans la glissade').not.toBe(id);
  });

  it.each(CASES)('$name : jamais coincée, on ressort du passage debout', ({ room, from, dir }) => {
    const { player } = attempt(room, from, dir, true);
    for (let s = 0; s < 1200; s++) {
      input.moveX = -dir;
      input.jumpPressed = false;
      input.jumpHeld = false;
      input.abilityPressed = s % 30 === 0;
      player.step(input);
    }
    for (let s = 0; s < 240; s++) {
      input.moveX = 0;
      input.abilityPressed = false;
      player.step(input);
    }
    expect(player.state).not.toBe(PlayerState.Slide);
    expect(player.box.height).toBe(P3.hitbox.height);
    expect(player.grounded).toBe(true);
  });
});
