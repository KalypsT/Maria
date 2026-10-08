import { EntityType } from '../level/LevelData';
import { mapPage, type Zone } from './zone';

/** Une coquille de la zone (D-148) : son nom fixe, sa salle, sa tuile, son lieu. */
export interface ZoneShell {
  readonly name: string;
  readonly room: string;
  readonly col: number;
  readonly row: number;
  /** Le lieu : la page du cahier de sa salle (null : une salle hors de la carte). */
  readonly place: string | null;
}

/** Les coquilles d'une zone, dans l'ordre de ses salles (une zone les a toutes nommées). */
export function zoneShells(zone: Zone): ZoneShell[] {
  const shells: ZoneShell[] = [];
  for (const [room, level] of zone.rooms) {
    for (const e of level.entities) {
      if (e.type === EntityType.Shell && e.name !== undefined) {
        shells.push({ name: e.name, room, col: e.col, row: e.row, place: mapPage(zone, room) });
      }
    }
  }
  return shells;
}

/** Coquilles trouvées et en tout dans un lieu (une page du cahier, D-148). */
export function shellTally(
  shells: readonly ZoneShell[],
  place: string,
  collectibles: readonly string[],
): { found: number; total: number } {
  let found = 0;
  let total = 0;
  for (const shell of shells) {
    if (shell.place === place) {
      total++;
      if (collectibles.includes(shell.name)) {
        found++;
      }
    }
  }
  return { found, total };
}
