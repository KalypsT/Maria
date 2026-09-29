import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { STRANGE_FX } from '../src/config/strangeFx';
import { floatingDecor } from '../src/core/level/decor';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';
import {
  createEyes,
  createTremor,
  isClearSpot,
  seededRandom,
  stepEyes,
  stepTremor,
} from '../src/core/fx/strangeLife';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

const zone = buildZone(HOUSE);

describe('yeux dans l’ombre (D-35)', () => {
  const run = (eyes: ReturnType<typeof createEyes>, x: number, fromMs: number, ms: number) => {
    const rand = seededRandom(3);
    for (let t = fromMs; t < fromMs + ms; t += 10) {
      stepEyes(eyes, x, eyes.y, t, 10, STRANGE_FX, rand);
    }
  };

  it('se ferment quand Céleste approche, se rouvrent quand elle s’éloigne, après un délai', () => {
    const eyes = createEyes(100 * T, 10 * T, 0, () => 0.5);
    const far = eyes.x + 20 * T;
    const near = eyes.x + 2 * T;
    const between = eyes.x + (STRANGE_FX.eyesCloseTiles + 1) * T;
    run(eyes, near, 0, 300);
    expect(eyes.openness).toBe(0);
    // Entre les deux seuils : ils restent fermés (pas de clignotement nerveux).
    run(eyes, between, 300, 5000);
    expect(eyes.openness).toBe(0);
    // Loin, mais trop tôt : encore fermés.
    run(eyes, far, 5300, STRANGE_FX.eyesReopenMs / 2);
    expect(eyes.openness).toBe(0);
    run(eyes, far, 5300 + STRANGE_FX.eyesReopenMs / 2, STRANGE_FX.eyesReopenMs + 1500);
    expect(eyes.openness).toBeGreaterThan(0);
  });

  it('clignent de temps en temps, brièvement', () => {
    const eyes = createEyes(0, 0, 0, () => 0.5);
    const rand = seededRandom(7);
    let closed = 0;
    for (let t = 0; t < 30_000; t += 10) {
      stepEyes(eyes, 50 * T, 0, t, 10, STRANGE_FX, rand);
      if (eyes.openness < 0.5) {
        closed += 10;
      }
    }
    expect(closed).toBeGreaterThan(0);
    expect(closed).toBeLessThan(30_000 * 0.25);
  });
});

describe('objets à la dérive (D-35)', () => {
  const level = parseAsciiLevel(
    'l',
    ['##########', '#........#', '#........#', '#...--...#', '#P.......#', '##########'].join('\n'),
  );

  it('jamais près d’une surface ni d’un mur', () => {
    expect(isClearSpot(level, 4.5 * T, 3.5 * T, 1)).toBe(false);
    expect(isClearSpot(level, 1.5 * T, 1.5 * T, 1)).toBe(false);
  });

  it('le passage d’ombres a de la place pour eux (le vide)', () => {
    const shadows = zone.rooms.get('shadows');
    expect(shadows).toBeDefined();
    if (shadows) {
      let spots = 0;
      for (let row = 0; row < shadows.height; row++) {
        for (let col = 0; col < shadows.width; col++) {
          if (isClearSpot(shadows, (col + 0.5) * T, (row + 0.5) * T, STRANGE_FX.driftClearTiles)) {
            spots++;
          }
        }
      }
      expect(spots).toBeGreaterThan(50);
    }
  });
});

describe('meubles qui flottent', () => {
  it('le canapé du salon étrange flotte, le lit de la chambre non', () => {
    const kinds = (room: string) => {
      const level = zone.rooms.get(room);
      return level ? floatingDecor(level).map((d) => d.kind) : [];
    };
    expect(kinds('living-strange')).toContain('sofa');
    expect(kinds('bedroom')).not.toContain('bed');
  });
});

describe('frissons du monde étrange (D-36)', () => {
  it('de temps en temps, jamais pendant un saut, et s’apaisent', () => {
    const rand = seededRandom(11);
    const tremor = createTremor(0, STRANGE_FX, rand);
    let started = -1;
    // En l'air tout le temps : aucun frisson.
    for (let t = 0; t < 120_000; t += 10) {
      if (stepTremor(tremor, t, false, STRANGE_FX, rand) > 0) {
        started = t;
      }
    }
    expect(started).toBe(-1);
    // Posée : il part aussitôt (il attendait), puis s'apaise et s'arrête.
    const k0 = stepTremor(tremor, 120_000, true, STRANGE_FX, rand);
    expect(k0).toBe(1);
    const end = tremor.until;
    expect(end - 120_000).toBeGreaterThanOrEqual(STRANGE_FX.tremorMinMs);
    expect(end - 120_000).toBeLessThanOrEqual(STRANGE_FX.tremorMaxMs);
    expect(stepTremor(tremor, end - 1, true, STRANGE_FX, rand)).toBeLessThan(0.1);
    expect(stepTremor(tremor, end, true, STRANGE_FX, rand)).toBe(0);
    // Le suivant attend au moins l'intervalle minimal.
    expect(tremor.nextAt - end).toBeGreaterThanOrEqual(STRANGE_FX.tremorEveryMinMs);
  });
});
