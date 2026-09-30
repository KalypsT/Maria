import {
  EntityType,
  type LevelDecor,
  Material,
  Tile,
  type LevelData,
  type LevelEntity,
  type LevelExit,
  type TilePos,
} from './LevelData';

const LEGEND: Readonly<Record<string, number>> = {
  '.': Tile.Empty,
  '#': Tile.Solid,
  b: Tile.Solid,
  t: Tile.Solid,
  v: Tile.Solid,
  '=': Tile.OneWay,
  '-': Tile.OneWay,
  P: Tile.Empty,
  G: Tile.Empty,
  e: Tile.Empty,
  a: Tile.Empty,
  o: Tile.Empty,
  C: Tile.Empty,
  A: Tile.Empty,
  S: Tile.Empty,
  '^': Tile.Hazard,
  '!': Tile.Thorns,
};
/** Marqueurs d'entités (la tuile elle-même est vide). */
const ENTITIES: Readonly<Record<string, EntityType>> = {
  e: EntityType.Patroller,
  a: EntityType.Spider,
  o: EntityType.Snail,
  C: EntityType.Checkpoint,
  A: EntityType.Ability,
  S: EntityType.Secret,
};
/** Matériaux d'affichage (D-25). */
const MATERIALS: Readonly<Record<string, Material>> = {
  b: Material.Wood,
  t: Material.Fabric,
  v: Material.Leaf,
  '-': Material.Wood,
};
/** Chiffres de sortie (D-25). */
const EXIT = /^[1-9]$/;
const SPAWN = 'P';
const GOAL = 'G';
const COMMENT = ';';
/** Métadonnée dans un commentaire : `; @difficulty: medium`. */
const META = /^;\s*@([\w-]+)\s*:\s*(.*)$/;
/** Élément d'habillage (D-28), répétable : `; @decor: bed 7 16 11 4` (nom, colonne, ligne, largeur, hauteur). */
const DECOR = /^([a-z][\w-]*)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;

/**
 * Convertit une carte ASCII (décision D-06) en `LevelData`.
 * Lignes vides en début et fin ignorées, lignes commençant par `;` ignorées (commentaires).
 * Légende : `#` plein, `=` traversable par le dessous, `.` vide, `P` départ (une seule fois),
 * `G` arrivée d'un parcours (au plus une fois), `e` patrouilleur, `a` araignée (D-46), `o` escargot (D-49), `C` checkpoint, `^` danger qui pique, `!` ronces, qui piquent aussi (D-51, D-56),
 * `b` bois, `t` tissu et `v` feuillage (pleins, D-46), `-` étagère (traversable), `1`-`9` sortie dans un mur latéral,
 * `A` objet de capacité (au plus un, capacité nommée par `; @ability:`), `S` trouvaille (secret).
 * Les commentaires `; @clé: valeur` sont des métadonnées ; `; @decor:` (répétable) déclare
 * l'habillage (D-28).
 */
export function parseAsciiLevel(id: string, text: string): LevelData {
  const rows: { text: string; line: number }[] = [];
  const meta: Record<string, string> = {};
  const decor: LevelDecor[] = [];
  text.split('\n').forEach((raw, index) => {
    const line = raw.replace(/\r$/, '').trimEnd();
    if (!line.startsWith(COMMENT)) {
      rows.push({ text: line, line: index + 1 });
      return;
    }
    const match = META.exec(line);
    if (match?.[1] === 'decor' && match[2] !== undefined) {
      const d = DECOR.exec(match[2].trim());
      if (!d?.[1]) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @decor attend « nom col ligne largeur hauteur »`,
        );
      }
      const [col, row, width, height] = d.slice(2, 6).map(Number);
      decor.push({
        kind: d[1],
        col: col ?? 0,
        row: row ?? 0,
        width: width ?? 0,
        height: height ?? 0,
      });
    } else if (match?.[1] !== undefined && match[2] !== undefined) {
      meta[match[1]] = match[2];
    }
  });
  while (rows.length > 0 && rows[0]?.text === '') {
    rows.shift();
  }
  while (rows.length > 0 && rows[rows.length - 1]?.text === '') {
    rows.pop();
  }
  const first = rows[0];
  if (!first) {
    throw new Error(`Niveau ${id} : carte vide`);
  }
  const width = first.text.length;
  const height = rows.length;
  const tiles = new Uint8Array(width * height);
  const materials = new Uint8Array(width * height);
  let spawn: TilePos | undefined;
  let goal: TilePos | null = null;
  const entities: LevelEntity[] = [];
  const exitTiles = new Map<number, TilePos[]>();

  rows.forEach(({ text: rowText, line }, row) => {
    if (rowText.length !== width) {
      throw new Error(
        `Niveau ${id}, ligne ${line} : largeur ${rowText.length} au lieu de ${width}`,
      );
    }
    for (let col = 0; col < width; col++) {
      const char = rowText.charAt(col);
      if (EXIT.test(char)) {
        const id = Number(char);
        exitTiles.set(id, [...(exitTiles.get(id) ?? []), { col, row }]);
        tiles[row * width + col] = Tile.Empty;
        continue;
      }
      const tile = LEGEND[char];
      if (tile === undefined) {
        throw new Error(
          `Niveau ${id}, ligne ${line}, colonne ${col + 1} : caractère « ${char} » inconnu`,
        );
      }
      if (char === SPAWN) {
        if (spawn) {
          throw new Error(`Niveau ${id}, ligne ${line} : plusieurs points de départ`);
        }
        spawn = { col, row };
      } else if (char === GOAL) {
        if (goal) {
          throw new Error(`Niveau ${id}, ligne ${line} : plusieurs arrivées`);
        }
        goal = { col, row };
      }
      const entity = ENTITIES[char];
      if (entity) {
        entities.push({ type: entity, col, row });
      }
      tiles[row * width + col] = tile;
      materials[row * width + col] = MATERIALS[char] ?? Material.Default;
    }
  });

  if (!spawn) {
    throw new Error(`Niveau ${id} : point de départ « ${SPAWN} » manquant`);
  }
  const abilities = entities.filter((entity) => entity.type === EntityType.Ability).length;
  if (abilities > 1 || (abilities === 1) !== (meta.ability !== undefined)) {
    throw new Error(`Niveau ${id} : un objet « A » va de pair avec « ; @ability: » (un seul)`);
  }
  const exits = [...exitTiles.entries()]
    .sort(([a], [b]) => a - b)
    .map(([exitId, cells]) => exitFromTiles(id, exitId, cells, width));
  for (const d of decor) {
    if (d.width < 1 || d.height < 1 || d.col + d.width > width || d.row + d.height > height) {
      throw new Error(`Niveau ${id} : @decor ${d.kind} hors de la salle`);
    }
  }
  return { id, width, height, tiles, spawn, goal, meta, entities, materials, exits, decor };
}

/** Une sortie : tuiles d'une même colonne de mur latéral, contiguës, au moins 2 de haut. */
function exitFromTiles(
  levelId: string,
  exitId: number,
  cells: TilePos[],
  width: number,
): LevelExit {
  const cols = new Set(cells.map((c) => c.col));
  const rows = cells.map((c) => c.row);
  const col = cells[0]?.col ?? -1;
  const rowMin = Math.min(...rows);
  const rowMax = Math.max(...rows);
  if (cols.size !== 1 || (col !== 0 && col !== width - 1)) {
    throw new Error(
      `Niveau ${levelId} : la sortie ${exitId} doit être dans le mur gauche ou droit`,
    );
  }
  if (rowMax - rowMin + 1 !== cells.length || cells.length < 2) {
    throw new Error(
      `Niveau ${levelId} : la sortie ${exitId} doit être une ouverture continue d'au moins 2 tuiles`,
    );
  }
  return { id: exitId, side: col === 0 ? 'left' : 'right', col, rowMin, rowMax };
}
