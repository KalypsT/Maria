import { Tile, type LevelData, type TilePos } from './LevelData';

const LEGEND: Readonly<Record<string, number>> = {
  '.': Tile.Empty,
  '#': Tile.Solid,
  '=': Tile.OneWay,
  P: Tile.Empty,
  G: Tile.Empty,
};
const SPAWN = 'P';
const GOAL = 'G';
const COMMENT = ';';
/** Métadonnée dans un commentaire : `; @difficulty: medium`. */
const META = /^;\s*@([\w-]+)\s*:\s*(.*)$/;

/**
 * Convertit une carte ASCII (décision D-06) en `LevelData`.
 * Lignes vides en début et fin ignorées, lignes commençant par `;` ignorées (commentaires).
 * Légende : `#` plein, `=` traversable par le dessous, `.` vide, `P` départ (une seule fois),
 * `G` arrivée d'un parcours (au plus une fois). Les commentaires `; @clé: valeur` sont des métadonnées.
 */
export function parseAsciiLevel(id: string, text: string): LevelData {
  const rows: { text: string; line: number }[] = [];
  const meta: Record<string, string> = {};
  text.split('\n').forEach((raw, index) => {
    const line = raw.replace(/\r$/, '').trimEnd();
    if (!line.startsWith(COMMENT)) {
      rows.push({ text: line, line: index + 1 });
      return;
    }
    const match = META.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
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
  let spawn: TilePos | undefined;
  let goal: TilePos | null = null;

  rows.forEach(({ text: rowText, line }, row) => {
    if (rowText.length !== width) {
      throw new Error(
        `Niveau ${id}, ligne ${line} : largeur ${rowText.length} au lieu de ${width}`,
      );
    }
    for (let col = 0; col < width; col++) {
      const char = rowText.charAt(col);
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
      tiles[row * width + col] = tile;
    }
  });

  if (!spawn) {
    throw new Error(`Niveau ${id} : point de départ « ${SPAWN} » manquant`);
  }
  return { id, width, height, tiles, spawn, goal, meta };
}
