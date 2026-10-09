import { describe, expect, it } from 'vitest';
import {
  PASSERBY_FRAMES,
  PASSERBY_REACTIONS,
  PASSERBY_STOOLS,
  PASSERBY_TUNING,
  PASSERSBY,
} from '../src/config/passersby';
import { PROP_SIZE } from '../src/config/story';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import {
  newPasserbyState,
  passerbyDistance,
  passerbyGone,
  passersbyIn,
  stepPasserby,
} from '../src/core/world/passersby';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

const zone = buildZone(HOUSE);
const T = 16;
const tuning = { nearPx: 30, farPx: 60, fadeMs: 200, fleeMs: 600 };

describe('les passants : réactions (D-155)', () => {
  it('une seule bulle par visite, avec une hystérésis', () => {
    const state = newPasserbyState();
    const reaction = { bubble: 'heart' as const };
    expect(stepPasserby(state, 100, 16, reaction, tuning)).toBe(false);
    expect(stepPasserby(state, 20, 16, reaction, tuning)).toBe(true);
    expect(stepPasserby(state, 20, 16, reaction, tuning)).toBe(false);
    // Entre les deux seuils : toujours tout près.
    expect(stepPasserby(state, 50, 16, reaction, tuning)).toBe(false);
    expect(state.near).toBe(true);
    stepPasserby(state, 80, 16, reaction, tuning);
    expect(state.near).toBe(false);
    // Elle revient : pas de seconde bulle pendant la même visite.
    expect(stepPasserby(state, 10, 16, reaction, tuning)).toBe(false);
  });

  it('la seconde pose en fondu, quittée quand Céleste s’éloigne', () => {
    const state = newPasserbyState();
    const reaction = { pose: 'busstop-man-look' as const };
    stepPasserby(state, 10, 100, reaction, tuning);
    expect(state.blend).toBeCloseTo(0.5);
    stepPasserby(state, 10, 200, reaction, tuning);
    expect(state.blend).toBe(1);
    stepPasserby(state, 100, 100, reaction, tuning);
    expect(state.blend).toBeCloseTo(0.5);
  });

  it('le chat bondit, puis il est parti', () => {
    const state = newPasserbyState();
    const reaction = { pose: 'ginger-cat-leap' as const, flee: true };
    stepPasserby(state, 100, 16, reaction, tuning);
    expect(state.fleeMs).toBe(-1);
    stepPasserby(state, 10, 16, reaction, tuning);
    expect(state.fleeMs).toBe(0);
    // Le bond continue même si Céleste s'éloigne.
    for (let k = 0; k < 40; k++) {
      stepPasserby(state, 500, 16, reaction, tuning);
    }
    expect(passerbyGone(state, tuning)).toBe(true);
  });

  it('distance au cadre, ou en largeur seulement (une fenêtre)', () => {
    const box = { x: 100, y: 100, width: 20, height: 20 };
    expect(passerbyDistance(110, 110, box)).toBe(0);
    expect(passerbyDistance(130, 110, box)).toBe(10);
    expect(passerbyDistance(110, 200, box)).toBe(80);
    expect(passerbyDistance(110, 200, box, true)).toBe(0);
  });

  it('personne dans un monde étrange ; chacun à son moment de la journée', () => {
    expect(passersbyIn(PASSERSBY, 'street', 'morning', true)).toEqual([]);
    const evening = passersbyIn(PASSERSBY, 'street', 'evening', false).map((s) => s.kind);
    expect(evening).toContain('neighbor-window');
    expect(evening).not.toContain('busstop-man');
  });
});

describe('les passants : emplacements (D-155)', () => {
  it('identifiants uniques, réglages cohérents', () => {
    const ids = PASSERSBY.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PASSERBY_TUNING.farPx).toBeGreaterThan(PASSERBY_TUNING.nearPx);
    for (const reaction of Object.values(PASSERBY_REACTIONS)) {
      if (reaction.flee) {
        expect(reaction.pose).toBeDefined();
      }
    }
  });

  for (const spot of PASSERSBY) {
    it(`${spot.id} : posé, sans gêner`, () => {
      const level = zone.rooms.get(spot.room);
      expect(level, `salle ${spot.room}`).toBeDefined();
      if (!level) {
        return;
      }
      const frame = PASSERBY_FRAMES[spot.kind];
      const size = frame ?? PROP_SIZE[spot.kind];
      const left = (spot.col + 0.5) * T - size.w / 2;
      const bottom = (spot.row + 1) * T + (spot.dy ?? 0);
      const box = { x: left, y: bottom - size.h, width: size.w, height: size.h };
      if (frame) {
        // À une fenêtre : sur une façade de maisons.
        const houses = level.decor.filter((d) => d.kind === 'houses');
        expect(
          houses.some(
            (d) =>
              box.x >= d.col * T &&
              box.x + box.width <= (d.col + d.width) * T &&
              box.y >= d.row * T &&
              bottom <= (d.row + d.height) * T,
          ),
        ).toBe(true);
      } else if (spot.dy !== undefined) {
        // Sur un rebord dessiné (le chat).
        expect(
          level.decor.some(
            (d) => d.kind === 'cat' && Math.abs((d.row + d.height) * T - bottom) <= T / 2,
          ),
        ).toBe(true);
      } else if (PASSERBY_STOOLS.has(spot.kind)) {
        // Sur un tabouret (la caissière) : le sol 3 tuiles sous l'assise, rien entre les deux.
        for (let row = spot.row; row <= spot.row + 3; row++) {
          expect(tileAt(level, spot.col, row)).toBe(Tile.Empty);
        }
        expect(tileAt(level, spot.col, spot.row + 4)).toBe(Tile.Solid);
      } else {
        // Debout : sur le sol, rien de solide à la place de ses pieds.
        expect([Tile.Solid, Tile.OneWay]).toContain(tileAt(level, spot.col, spot.row + 1));
        expect(tileAt(level, spot.col, spot.row)).toBe(Tile.Empty);
      }
      // Ni coquille, ni lanterne, ni objet de capacité sous lui ; ni porte juste à côté.
      for (const entity of level.entities) {
        if (
          entity.type !== EntityType.Shell &&
          entity.type !== EntityType.Checkpoint &&
          entity.type !== EntityType.Ability
        ) {
          continue;
        }
        const ex = (entity.col + 0.5) * T;
        const ey = (entity.row + 0.5) * T;
        const inside =
          ex > box.x + T / 2 && ex < box.x + box.width - T / 2 && ey > box.y && ey < bottom;
        expect(inside, `${entity.type} ${String(entity.col)},${String(entity.row)}`).toBe(false);
      }
      for (const door of level.doors) {
        if (door.row === spot.row) {
          expect(Math.abs(door.col - spot.col), `porte ${String(door.id)}`).toBeGreaterThan(2);
        }
      }
    });
  }
});
