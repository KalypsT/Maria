import { describe, expect, it } from 'vitest';
import { buildZone } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { HOUSE } from '../src/levels/house/zone';

/**
 * Les portes se voient (D-164, retour d'essai et revue des portes) : chaque porte où l'on agit a son
 * dessin à sa place. Le test général ne voit pas un grand décor qui couvre une porte sans la dessiner
 * (l'escalier du phare couvrait la sienne) : d'où les vérifications précises de la mer.
 */

const zone = buildZone(HOUSE);

function drawnAt(roomId: string, kind: string, door: { col: number; row: number }): boolean {
  const level = zone.rooms.get(roomId);
  return (
    level?.decor.some(
      (d) =>
        d.kind === kind &&
        d.col <= door.col &&
        door.col < d.col + d.width &&
        d.row <= door.row &&
        door.row < d.row + d.height,
    ) ?? false
  );
}

function door(roomId: string, id: number): { col: number; row: number } {
  const found = zone.rooms.get(roomId)?.doors.find((d) => d.id === id);
  if (!found) {
    throw new Error(`porte ${roomId}:${String(id)} absente`);
  }
  return found;
}

describe('les portes de la mer', () => {
  it('le pied du phare : la porte d’entrée, vue de l’intérieur', () => {
    expect(drawnAt('sea-lighthouse', 'lighthousedoor', door('sea-lighthouse', 1))).toBe(true);
  });

  it('l’escalier de la plage : en haut sur la promenade, en bas sur la plage', () => {
    expect(drawnAt('sea-promenade', 'beachstairs', door('sea-promenade', 3))).toBe(true);
    expect(drawnAt('sea-beach', 'beachstairsfoot', door('sea-beach', 1))).toBe(true);
  });

  it('le dortoir : une porte claire, plus la porte de bois sombre', () => {
    const centre = zone.rooms.get('sea-centre');
    expect(centre?.decor.some((d) => d.kind === 'dormdoor')).toBe(true);
    expect(centre?.decor.some((d) => d.kind === 'door')).toBe(false);
  });
});

describe('toutes les portes de façade (la revue des portes, D-164)', () => {
  it('chaque porte a un dessin qui recouvre sa case, ou un objet posé devant elle', () => {
    const missing: string[] = [];
    for (const [roomId, level] of zone.rooms) {
      for (const d of level.doors) {
        const drawn = level.decor.some(
          (decor) =>
            decor.col <= d.col &&
            d.col < decor.col + decor.width &&
            decor.row <= d.row &&
            d.row < decor.row + decor.height,
        );
        // Ou un objet de mise en scène posé devant elle (le train à quai, D-90 : la porte n'existe
        // qu'avec lui).
        const prop = HOUSE_STORY.props.some(
          (p) => p.room === roomId && p.col === d.col && p.row === d.row,
        );
        if (!drawn && !prop) {
          missing.push(`${roomId}:${String(d.id)}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
