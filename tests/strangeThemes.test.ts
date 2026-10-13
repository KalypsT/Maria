import { describe, expect, it } from 'vitest';
import { REAL_PALETTE, WALL_STYLES } from '../src/config/art';
import {
  STRANGE_TINTS,
  STRANGE_TINT_NAMES,
  strangePalette,
  strangeTint,
} from '../src/config/strangeThemes';
import { isStrangeRoom } from '../src/core/world/zone';
import { ZONES } from '../src/levels';

/** Composantes « r,g,b » d'une couleur `#rrggbb` ou `rgba(r,g,b,a)` posée sur `under`. */
function rgb(color: string, under: readonly number[] = [0, 0, 0]): number[] {
  if (color.startsWith('#')) {
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  }
  const parts = color
    .replace(/[^\d.,]/g, '')
    .split(',')
    .map(Number);
  const alpha = parts[3] ?? 1;
  return [0, 1, 2].map((i) => (parts[i] ?? 0) * alpha + (under[i] ?? 0) * (1 - alpha));
}

/** Rapport de contraste (WCAG) entre deux couleurs. */
function contrast(a: readonly number[], b: readonly number[]): number {
  const lum = (c: readonly number[]): number => {
    const [r = 0, g = 0, bl = 0] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const strangeRooms = ZONES.flatMap((zone) => [...zone.rooms.values()]).filter(isStrangeRoom);

describe('les nuances du monde étrange (D-172)', () => {
  it('le monde réel ne change pas', () => {
    expect(REAL_PALETTE.rimWidth).toBe(1);
    expect(REAL_PALETTE.rimGlow).toBe(0);
    expect(REAL_PALETTE.wallMotif).toBeNull();
    expect(REAL_PALETTE.halo).toBe(0);
  });

  it('chaque nuance garde des appuis lisibles : liseré épais, lueur, halo, silhouettes', () => {
    for (const tint of STRANGE_TINTS) {
      const p = strangePalette(tint);
      expect(STRANGE_TINT_NAMES[tint], tint).toBeTruthy();
      expect(p.rimWidth, tint).toBeGreaterThan(1);
      expect(p.rimGlow, tint).toBeGreaterThan(0);
      expect(p.halo, tint).toBeGreaterThan(0);
      expect(p.silhouettes, tint).toBe(true);
      if (p.wallMotif) {
        expect(WALL_STYLES).toContain(p.wallMotif);
      }
    }
  });

  it('le liseré tranche sur le mur, le sol et les silhouettes de chaque nuance', () => {
    for (const tint of STRANGE_TINTS) {
      const p = strangePalette(tint);
      for (const under of [p.wallTop, p.wallBottom, p.floor, p.structure, p.wood]) {
        const back = rgb(under);
        expect(contrast(rgb(p.rim, back), back), `${tint} sur ${under}`).toBeGreaterThan(7);
      }
    }
  });

  it('la nuance d’une salle inconnue ou absente est celle de la maison', () => {
    expect(strangeTint(undefined)).toBe('house');
    expect(strangeTint('nulle-part')).toBe('house');
    expect(strangeTint('station')).toBe('station');
  });

  it('chaque salle étrange nomme une nuance connue', () => {
    expect(strangeRooms.length).toBeGreaterThan(0);
    for (const room of strangeRooms) {
      const tint = room.meta.tint;
      if (tint !== undefined) {
        expect(STRANGE_TINTS as readonly string[], room.meta.name).toContain(tint);
      }
    }
  });

  it('chaque salle étrange nomme sa nuance, sauf au niveau 8 (la veilleuse)', () => {
    const tinted = strangeRooms.filter((r) => r.meta.palette === undefined);
    expect(tinted.length).toBeGreaterThan(25);
    for (const room of tinted) {
      expect(room.meta.tint, room.meta.name).toBeDefined();
    }
  });

  it('le niveau 7 : la nuance de la nounou, les horloges arrêtées dans la gare d’autrefois', () => {
    const nanny = strangeRooms.filter((r) => r.id.startsWith('nanny-'));
    expect(nanny.length).toBe(13);
    for (const room of nanny) {
      expect(room.meta.tint, room.meta.name).toBe('nanny');
    }
    expect(nanny.find((r) => r.id === 'nanny-station')?.meta.wall).toBe('clocks');
  });

  it('les couloirs de la mer reprennent le lieu qu’ils évoquent', () => {
    const tint = (name: string) => strangeRooms.find((r) => r.meta.name === name)?.meta.tint;
    expect(tint('Le couloir')).toBe('sea');
    expect(tint('Le couloir (la chambre)')).toBe('house');
    expect(tint('Le couloir (la gare)')).toBe('station');
  });

  it('la gare étrange : le violet bleuté, les carreaux, les étiquettes dans la tour', () => {
    const room = (name: string) => strangeRooms.find((r) => r.meta.name === name);
    expect(room('Objets perdus')?.meta.tint).toBe('station');
    expect(room('Tour des objets perdus')?.meta.tint).toBe('station');
    expect(strangePalette('station').wallMotif).toBe('tiles');
    expect(room('Tour des objets perdus')?.meta.wall).toBe('tags');
  });
});
