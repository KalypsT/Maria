import { DECOR_KINDS } from '../../config/art';
import { Material, Tile, tileAt, type LevelData, type LevelDecor } from './LevelData';

/**
 * Cohérence de l'habillage (D-28) avec la collision : noms connus, et chaque tuile de meuble (bois,
 * tissu, étagère) couverte par un meuble déclaré. Liste vide si la salle n'est pas habillée ou si
 * tout va bien.
 */
export function decorProblems(level: LevelData): string[] {
  if (level.decor.length === 0) {
    return [];
  }
  const problems: string[] = [];
  const covered = new Uint8Array(level.width * level.height);
  for (const d of level.decor) {
    const kind = DECOR_KINDS[d.kind];
    if (!kind) {
      problems.push(`élément inconnu « ${d.kind} »`);
      continue;
    }
    if (!kind.furniture) {
      continue;
    }
    for (let row = d.row; row < d.row + d.height; row++) {
      for (let col = d.col; col < d.col + d.width; col++) {
        covered[row * level.width + col] = 1;
      }
    }
  }
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const index = row * level.width + col;
      const tile = level.tiles[index];
      const furniture =
        level.materials[index] !== Material.Default &&
        (tile === Tile.Solid || tile === Tile.OneWay);
      if (furniture && !covered[index]) {
        problems.push(`tuile de meuble (colonne ${col + 1}, ligne ${row + 1}) sans habillage`);
      }
    }
  }
  return problems;
}

/**
 * Meubles qui flottent (rien sous eux) : une lueur turquoise les souligne dans le monde étrange
 * (D-34), et respire (D-35).
 */
export function floatingDecor(level: LevelData): LevelDecor[] {
  return level.decor.filter((d) => {
    if (!(DECOR_KINDS[d.kind]?.furniture ?? false)) {
      return false;
    }
    const below = d.row + d.height;
    if (below >= level.height) {
      return false;
    }
    for (let col = d.col; col < d.col + d.width; col++) {
      if (tileAt(level, col, below) !== Tile.Empty) {
        return false;
      }
    }
    return true;
  });
}
