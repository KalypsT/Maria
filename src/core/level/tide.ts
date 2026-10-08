import { TILE_SIZE } from '../../config/display';
import {
  EntityType,
  Tile,
  type LevelData,
  type LevelEntity,
  type LevelTide,
  type TileRect,
} from './LevelData';

/**
 * La marée (D-95), pure : une salle de marée existe en deux variantes statiques, chacune analysable
 * comme une salle ordinaire. Marée basse : la salle telle que dessinée, l'eau sous `lowRow`. Marée
 * haute : ce qui flotte (zones `rises`) monte de `lowRow - highRow` lignes, puis l'eau remplit les
 * tuiles vides des zones de mer sous `highRow`. Ni temps réel ni collision mobile (D-86).
 */

/** Tuile (col, row) dans le rectangle. */
function inRect(r: TileRect, col: number, row: number): boolean {
  return col >= r.col && col < r.col + r.width && row >= r.row && row < r.row + r.height;
}

function rectInside(inner: TileRect, outer: TileRect): boolean {
  return (
    inner.col >= outer.col &&
    inner.row >= outer.row &&
    inner.col + inner.width <= outer.col + outer.width &&
    inner.row + inner.height <= outer.row + outer.height
  );
}

/** Remplit d'eau les tuiles vides des zones de mer, à partir de la ligne `waterRow`. */
function flood(
  tiles: Uint8Array,
  width: number,
  height: number,
  seas: readonly TileRect[],
  waterRow: number,
): void {
  for (const sea of seas) {
    for (
      let row = Math.max(waterRow, sea.row);
      row < Math.min(height, sea.row + sea.height);
      row++
    ) {
      for (let col = sea.col; col < sea.col + sea.width; col++) {
        const index = row * width + col;
        if (tiles[index] === Tile.Empty) {
          tiles[index] = Tile.Water;
        }
      }
    }
  }
}

/** Ce que le parseur lit d'une salle de marée. */
export interface TideSpec {
  readonly lowRow: number;
  readonly highRow: number;
  readonly seas: readonly TileRect[];
  readonly rises: readonly TileRect[];
}

/**
 * Marée d'une salle qui vient d'être lue : vérifie les zones, et renvoie la marée et les tuiles à
 * marée basse (les tuiles dessinées, avec l'eau). Les vérifications de ce qui est sous l'eau se
 * font sur les deux variantes (`checkTide`), une fois la salle construite.
 */
export function buildTide(
  id: string,
  width: number,
  height: number,
  tiles: Uint8Array,
  materials: Uint8Array,
  spec: TideSpec,
): { tide: LevelTide; tiles: Uint8Array } {
  const { lowRow, highRow, seas, rises } = spec;
  if (highRow > lowRow || lowRow > height || highRow < 1) {
    throw new Error(`Niveau ${id} : @tide attend « basse haute », 1 ≤ haute ≤ basse ≤ hauteur`);
  }
  if (seas.length === 0) {
    throw new Error(`Niveau ${id} : @tide va de pair avec au moins une @sea`);
  }
  const room: TileRect = { col: 0, row: 0, width, height };
  for (const r of [...seas, ...rises]) {
    if (r.width < 1 || r.height < 1 || !rectInside(r, room)) {
      throw new Error(
        `Niveau ${id} : zone de marée ${String(r.col)} ${String(r.row)} hors de la salle`,
      );
    }
  }
  const rise = lowRow - highRow;
  for (const r of rises) {
    if (!seas.some((sea) => rectInside(r, sea))) {
      throw new Error(`Niveau ${id} : @rise ${String(r.col)} ${String(r.row)} hors de la mer`);
    }
    if (r.row - rise < 0) {
      throw new Error(
        `Niveau ${id} : @rise ${String(r.col)} ${String(r.row)} monterait hors de la salle`,
      );
    }
  }
  const low = tiles.slice();
  flood(low, width, height, seas, lowRow);
  return {
    tide: {
      lowRow,
      highRow,
      seas,
      rises,
      rawTiles: tiles,
      rawMaterials: materials,
      high: false,
    },
    tiles: low,
  };
}

function tileOf(level: LevelData, col: number, row: number): number {
  return level.tiles[row * level.width + col] ?? Tile.Solid;
}

const highCache = new WeakMap<LevelData, LevelData>();
/** Variante haute → salle à marée basse. */
const lowOf = new WeakMap<LevelData, LevelData>();

/**
 * Variante à marée haute d'une salle (la même salle sans marée, ou déjà haute). Même identifiant :
 * lanternes et trouvailles gardent leurs identifiants (leur position ne change pas, pilier 10).
 * Une trouvaille ou un ennemi sous l'eau n'y est pas (la trouvaille s'atteint à marée basse).
 */
export function highTide(level: LevelData): LevelData {
  const tide = level.tide;
  if (!tide || tide.high) {
    return level;
  }
  const cached = highCache.get(level);
  if (cached) {
    return cached;
  }
  const { width, height } = level;
  const rise = tide.lowRow - tide.highRow;
  const tiles = tide.rawTiles.slice();
  const materials = tide.rawMaterials.slice();
  // Ce qui flotte : on vide toutes les zones, puis on repose chaque tuile `rise` lignes plus haut.
  const moved: { index: number; tile: number; material: number }[] = [];
  for (const r of tide.rises) {
    for (let row = r.row; row < r.row + r.height; row++) {
      for (let col = r.col; col < r.col + r.width; col++) {
        const index = row * width + col;
        const tile = tiles[index] ?? Tile.Empty;
        if (tile !== Tile.Empty) {
          moved.push({ index: index - rise * width, tile, material: materials[index] ?? 0 });
          tiles[index] = Tile.Empty;
          materials[index] = 0;
        }
      }
    }
  }
  for (const m of moved) {
    if (tiles[m.index] !== Tile.Empty) {
      const col = m.index % width;
      const row = Math.floor(m.index / width);
      throw new Error(
        `Niveau ${level.id} : à marée haute, ce qui flotte heurte la tuile ${String(col)} ${String(row)}`,
      );
    }
    tiles[m.index] = m.tile;
    materials[m.index] = m.material;
  }
  flood(tiles, width, height, tide.seas, tide.highRow);
  const dy = rise * TILE_SIZE;
  const inRise = (col: number, row: number) => tide.rises.some((r) => inRect(r, col, row));
  const decor = level.decor.map((d) =>
    tide.rises.some((r) => rectInside({ ...d }, r)) ? { ...d, row: d.row - rise } : d,
  );
  const cables = level.cables.map((c) =>
    inRise(Math.floor(c.x1 / TILE_SIZE), Math.floor(c.y1 / TILE_SIZE)) &&
    inRise(Math.floor(c.x2 / TILE_SIZE), Math.floor(c.y2 / TILE_SIZE))
      ? { ...c, y1: c.y1 - dy, y2: c.y2 - dy }
      : c,
  );
  const wet = (e: LevelEntity) => tiles[e.row * width + e.col] === Tile.Water;
  const entities = level.entities.filter(
    (e) => !(wet(e) && (e.type === EntityType.Shell || e.type === EntityType.Patroller)),
  );
  const result: LevelData = {
    ...level,
    tiles,
    materials,
    decor,
    cables,
    entities,
    tide: { ...tide, high: true },
  };
  highCache.set(level, result);
  lowOf.set(result, level);
  return result;
}

/** La variante de la salle à cette marée (une salle sans marée est la même aux deux). */
export function atTide(level: LevelData, high: boolean): LevelData {
  return high ? highTide(level) : (lowOf.get(level) ?? level);
}

/**
 * Vérifie une salle de marée (D-95), aux deux marées : ce qui flotte ne contient ni entité, ni
 * porte, ni sortie ; lanternes, objets de capacité, départ, arrivée, portes et sorties toujours au
 * sec ; une trouvaille au sec au moins à marée basse. Lève une erreur explicite sinon.
 */
export function checkTide(level: LevelData): void {
  const tide = level.tide;
  if (!tide) {
    return;
  }
  const inRise = (col: number, row: number) => tide.rises.some((r) => inRect(r, col, row));
  for (const e of level.entities) {
    if (inRise(e.col, e.row)) {
      throw new Error(
        `Niveau ${level.id} : entité ${e.type} sur ce qui flotte (${String(e.col)} ${String(e.row)})`,
      );
    }
  }
  for (const d of level.doors) {
    if (inRise(d.col, d.row)) {
      throw new Error(`Niveau ${level.id} : porte ${String(d.id)} sur ce qui flotte`);
    }
  }
  const high = highTide(level);
  for (const variant of [level, high]) {
    const label = variant.tide?.high ? 'marée haute' : 'marée basse';
    const dry = (what: string, col: number, row: number) => {
      if (tileOf(variant, col, row) === Tile.Water) {
        throw new Error(
          `Niveau ${level.id} : ${what} sous l'eau à ${label} (${String(col)} ${String(row)})`,
        );
      }
    };
    for (const e of level.entities) {
      if (e.type === EntityType.Checkpoint || e.type === EntityType.Ability) {
        dry(e.type, e.col, e.row);
      }
    }
    dry('le départ', level.spawn.col, level.spawn.row);
    if (level.goal) {
      dry("l'arrivée", level.goal.col, level.goal.row);
    }
    for (const d of level.doors) {
      dry(`la porte ${String(d.id)}`, d.col, d.row);
    }
    for (const exit of level.exits) {
      for (let row = exit.rowMin; row <= exit.rowMax; row++) {
        dry(`la sortie ${String(exit.id)}`, exit.col, row);
      }
    }
  }
  for (const e of level.entities) {
    if (e.type === EntityType.Shell && tileOf(level, e.col, e.row) === Tile.Water) {
      throw new Error(
        `Niveau ${level.id} : coquille sous l'eau à marée basse (${String(e.col)} ${String(e.row)})`,
      );
    }
  }
}
