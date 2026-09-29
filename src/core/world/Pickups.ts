import { TILE_SIZE as T } from '../../config/display';
import { EntityType, type LevelData } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';

export const PickupKind = { Ability: 0, Secret: 1 } as const;
export type PickupKind = (typeof PickupKind)[keyof typeof PickupKind];

export interface PickupState {
  readonly kind: PickupKind;
  /**
   * Capacité donnée (`; @ability:` de la salle, D-26), ou identifiant de la trouvaille
   * (`salle:s<col>-<row>`, enregistré dans `progression.collectibles`).
   */
  readonly id: string;
  readonly col: number;
  readonly row: number;
  /** Zone de contact : la tuile de l'objet et celle du dessus. */
  readonly box: Box;
  taken: boolean;
}

/** Identifiant stable d'une trouvaille (secret) dans la sauvegarde. */
export function secretId(levelId: string, col: number, row: number): string {
  return `${levelId}:s${col}-${row}`;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * Objets à ramasser d'une salle, purs : objets de capacité (D-26) et trouvailles (secrets, D-27).
 * Un objet déjà obtenu n'apparaît plus.
 */
export class Pickups {
  items: PickupState[] = [];

  load(level: LevelData, abilities: readonly string[], collectibles: readonly string[]): void {
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
        });
      } else if (entity.type === EntityType.Secret) {
        const id = secretId(level.id, col, row);
        items.push({
          kind: PickupKind.Secret,
          id,
          col,
          row,
          box,
          taken: collectibles.includes(id),
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
