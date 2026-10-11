import { describe, expect, it } from 'vitest';
import { buildZone } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

/**
 * Retour d'essai : les portes de la mer se voient. Chaque porte où l'on agit a son dessin à sa
 * place : la porte du pied du phare (vue de l'intérieur), celle du dortoir, les deux bouts de
 * l'escalier de la plage.
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
