import { TILE_SIZE as T } from '../../config/display';
import { EntityType, type LevelData } from '../level/LevelData';
import type { Box } from '../physics/gridCollision';

export interface PickupState {
  /** Capacité donnée (`; @ability:` de la salle). */
  readonly ability: string;
  readonly col: number;
  readonly row: number;
  /** Zone de contact : la tuile de l'objet et celle du dessus. */
  readonly box: Box;
  taken: boolean;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Objets de capacité d'une salle (D-26), purs. Un objet déjà obtenu n'apparaît plus. */
export class Pickups {
  items: PickupState[] = [];

  load(level: LevelData, owned: readonly string[]): void {
    const ability = level.meta.ability;
    this.items =
      ability === undefined
        ? []
        : level.entities
            .filter((entity) => entity.type === EntityType.Ability)
            .map((entity) => ({
              ability,
              col: entity.col,
              row: entity.row,
              box: { x: entity.col * T, y: (entity.row - 1) * T, width: T, height: 2 * T },
              taken: owned.includes(ability),
            }));
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
