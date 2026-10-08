import { TILE_SIZE as T } from '../../config/display';
import { EntityType, type LevelData, type LevelEntity } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';

export const PickupKind = { Ability: 0, Shell: 1 } as const;
export type PickupKind = (typeof PickupKind)[keyof typeof PickupKind];

export interface PickupState {
  readonly kind: PickupKind;
  /**
   * Capacité donnée (`; @ability:` de la salle, D-26), ou nom de la coquille (`; @shell:`, D-148,
   * enregistré dans `progression.collectibles`).
   */
  readonly id: string;
  readonly col: number;
  readonly row: number;
  /** Zone de contact : la tuile de l'objet et celle du dessus. */
  readonly box: Box;
  taken: boolean;
  /** Coquille déjà vue (D-148) : elle est sur la carte, en pointillés, tant qu'elle n'est pas prise. */
  seen: boolean;
}

/**
 * Identifiant d'une coquille dans la sauvegarde : son nom fixe (D-148). Une coquille sans nom (un
 * parcours d'essai, qui ne sauvegarde rien) prend sa salle et sa tuile.
 */
export function shellId(levelId: string, shell: LevelEntity): string {
  return shell.name ?? `${levelId}:s${String(shell.col)}-${String(shell.row)}`;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * Objets à ramasser d'une salle, purs : objets de capacité (D-26) et coquilles (D-27, D-148).
 * Un objet déjà obtenu n'apparaît plus.
 */
export class Pickups {
  items: PickupState[] = [];

  load(
    level: LevelData,
    abilities: readonly string[],
    collectibles: readonly string[],
    seen: readonly string[] = [],
  ): void {
    const ability = level.meta.ability;
    const items: PickupState[] = [];
    for (const entity of level.entities) {
      const { col, row } = entity;
      const box = { x: col * T, y: (row - 1) * T, width: T, height: 2 * T };
      if (entity.type === EntityType.Ability && ability !== undefined) {
        items.push({
          kind: PickupKind.Ability,
          id: ability,
          col,
          row,
          box,
          taken: abilities.includes(ability),
          seen: true,
        });
      } else if (entity.type === EntityType.Shell) {
        const id = shellId(level.id, entity);
        items.push({
          kind: PickupKind.Shell,
          id,
          col,
          row,
          box,
          taken: collectibles.includes(id),
          seen: seen.includes(id),
        });
      }
    }
    this.items = items;
  }

  /** Index de l'objet ramassé à ce pas (-1 : aucun). Sans allocation. */
  step(player: Box): number {
    const items = this.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && !item.taken && overlaps(player, item.box)) {
        item.taken = true;
        return i;
      }
    }
    return -1;
  }
}
