import { Tile, type LevelData } from './LevelData';

const LEGEND: Readonly<Record<string, number>> = {
  '.': Tile.Empty,
  '#': Tile.Solid,
  '=': Tile.OneWay,
  P: Tile.Empty,
};
const SPAWN = 'P';
const COMMENT = ';';

/**
 * Convertit une carte ASCII (décision D-06) en `LevelData`.
 * Lignes vides en début et fin ignorées, lignes commençant par `;` ignorées (commentaires).
 * Légende : `#` plein, `=` traversable par le dessous, `.` vide, `P` départ (une seule fois).
 */
export function parseAsciiLevel(id: string, text: string): LevelData {
  const rows: { text: string; line: number }[] = [];
  text.split('\n').forEach((raw, index) => {
    const line = raw.replace(/\r$/, '').trimEnd();
    if (!line.startsWith(COMMENT)) {
      rows.push({ text: line, line: index + 1 });
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
  let spawn: { col: number; row: number } | undefined;

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
      }
      tiles[row * width + col] = tile;
    }
  });

  if (!spawn) {
    throw new Error(`Niveau ${id} : point de départ « ${SPAWN} » manquant`);
  }
  return { id, width, height, tiles, spawn };
}
