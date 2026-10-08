import { TILE_SIZE } from '../../config/display';
import {
  EntityType,
  Tile,
  type Layer,
  type LevelData,
  type LevelLayers,
  type TileRect,
} from './LevelData';

/**
 * La bascule (D-107), pure : une salle à deux couches existe en variantes statiques, chacune
 * analysable comme une salle ordinaire (comme la marée, D-96). Le présent : la salle sans ce qui
 * n'est que dans le souvenir ; le souvenir : la salle sans ce qui n'est que dans le présent ; le
 * commun (pour le dessin) : sans l'un ni l'autre. Ni temps réel ni collision mobile (D-86).
 */

export const LAYERS: readonly Layer[] = ['present', 'memory'];

/** L'autre couche. */
export function otherLayer(layer: Layer): Layer {
  return layer === 'present' ? 'memory' : 'present';
}

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

/** Vide les zones `rects` (tuiles et matériaux). */
function erase(
  tiles: Uint8Array,
  materials: Uint8Array,
  width: number,
  rects: readonly TileRect[],
): void {
  for (const r of rects) {
    for (let row = r.row; row < r.row + r.height; row++) {
      for (let col = r.col; col < r.col + r.width; col++) {
        tiles[row * width + col] = Tile.Empty;
        materials[row * width + col] = 0;
      }
    }
  }
}

/** Ce que le parseur lit d'une salle à deux couches. */
export interface LayersSpec {
  readonly present: readonly TileRect[];
  readonly memory: readonly TileRect[];
}

/**
 * Couches d'une salle qui vient d'être lue : vérifie les zones et renvoie les couches et les tuiles
 * du présent (la salle telle qu'elle se charge). Les vérifications des entités se font une fois la
 * salle construite (`checkLayers`).
 */
export function buildLayers(
  id: string,
  width: number,
  height: number,
  tiles: Uint8Array,
  materials: Uint8Array,
  spec: LayersSpec,
): { layers: LevelLayers; tiles: Uint8Array; materials: Uint8Array } {
  const room: TileRect = { col: 0, row: 0, width, height };
  const all = [...spec.present, ...spec.memory];
  for (const r of all) {
    if (r.width < 1 || r.height < 1 || !rectInside(r, room)) {
      throw new Error(`Niveau ${id} : @shift ${String(r.col)} ${String(r.row)} hors de la salle`);
    }
  }
  for (const p of spec.present) {
    for (const m of spec.memory) {
      const overlap =
        p.col < m.col + m.width &&
        m.col < p.col + p.width &&
        p.row < m.row + m.height &&
        m.row < p.row + p.height;
      if (overlap) {
        throw new Error(
          `Niveau ${id} : @shift present ${String(p.col)} ${String(p.row)} et memory ${String(m.col)} ${String(m.row)} se chevauchent`,
        );
      }
    }
  }
  const present = tiles.slice();
  const presentMaterials = materials.slice();
  erase(present, presentMaterials, width, spec.memory);
  return {
    layers: {
      present: spec.present,
      memory: spec.memory,
      rawTiles: tiles,
      rawMaterials: materials,
      active: 'present',
    },
    tiles: present,
    materials: presentMaterials,
  };
}

/** Variantes d'une salle (toutes partagent la même entrée, celle du présent). */
const siblings = new WeakMap<LevelData, Map<Layer | 'common', LevelData>>();

function variant(level: LevelData, which: Layer | 'common'): LevelData {
  const layers = level.layers;
  if (!layers) {
    return level;
  }
  if (layers.active === which) {
    return level;
  }
  let family = siblings.get(level);
  if (!family) {
    family = new Map([[layers.active, level]]);
    siblings.set(level, family);
  }
  const known = family.get(which);
  if (known) {
    return known;
  }
  const { width } = level;
  const tiles = layers.rawTiles.slice();
  const materials = layers.rawMaterials.slice();
  const gone: readonly TileRect[] =
    which === 'present'
      ? layers.memory
      : which === 'memory'
        ? layers.present
        : [...layers.present, ...layers.memory];
  erase(tiles, materials, width, gone);
  const keep = (r: TileRect) => !gone.some((g) => rectInside(r, g));
  const tileOf = (x: number, y: number) => ({
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE),
    width: 1,
    height: 1,
  });
  // Une variante ne garde que les éléments de sa couche ; on repart du dessin d'origine.
  const base = family.get('present') ?? level;
  const result: LevelData = {
    ...base,
    tiles,
    materials,
    decor: allDecor.get(base)?.filter(keep) ?? base.decor,
    cables: (allCables.get(base) ?? base.cables).filter(
      (c) => keep(tileOf(c.x1, c.y1)) || keep(tileOf(c.x2, c.y2)),
    ),
    layers: { ...layers, active: which },
  };
  family.set(which, result);
  siblings.set(result, family);
  return result;
}

/** Décor et câbles tels que déclarés (les deux couches), par salle du présent. */
const allDecor = new WeakMap<LevelData, LevelData['decor']>();
const allCables = new WeakMap<LevelData, LevelData['cables']>();

/**
 * Termine une salle à deux couches lue par le parseur (le présent) : garde le décor et les câbles
 * déclarés, et ne laisse au présent que les siens. Retourne la salle du présent.
 */
export function presentOf(level: LevelData): LevelData {
  const layers = level.layers;
  if (!layers) {
    return level;
  }
  const inMemory = (r: TileRect) => layers.memory.some((g) => rectInside(r, g));
  const cell = (x: number, y: number) => ({
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE),
    width: 1,
    height: 1,
  });
  const result: LevelData = {
    ...level,
    decor: level.decor.filter((d) => !inMemory(d)),
    cables: level.cables.filter((c) => !(inMemory(cell(c.x1, c.y1)) && inMemory(cell(c.x2, c.y2)))),
  };
  allDecor.set(result, level.decor);
  allCables.set(result, level.cables);
  siblings.set(result, new Map([['present', result]]));
  return result;
}

/**
 * La même salle avec d'autres zones de couches (l'effacement, D-111) : `present` et `memory` sont
 * les nouvelles zones, `rawTiles` et `rawMaterials` les tuiles des deux couches ensemble. Le décor
 * et les câbles déclarés suivent leurs zones. Retourne la salle du présent (ses variantes par
 * `atLayer`), qui garde l'identifiant, les entités et le reste.
 */
export function rezoned(
  level: LevelData,
  zones: {
    readonly present: readonly TileRect[];
    readonly memory: readonly TileRect[];
    readonly rawTiles: Uint8Array;
    readonly rawMaterials: Uint8Array;
  },
): LevelData {
  const base = siblings.get(level)?.get('present') ?? level;
  const tiles = zones.rawTiles.slice();
  const materials = zones.rawMaterials.slice();
  erase(tiles, materials, level.width, zones.memory);
  return presentOf({
    ...base,
    tiles,
    materials,
    decor: allDecor.get(base) ?? base.decor,
    cables: allCables.get(base) ?? base.cables,
    layers: {
      present: zones.present,
      memory: zones.memory,
      rawTiles: zones.rawTiles,
      rawMaterials: zones.rawMaterials,
      active: 'present',
    },
  });
}

/** Tuiles et matériaux des deux couches ensemble (une salle sans couches : les siens). */
export function rawOf(level: LevelData): { tiles: Uint8Array; materials: Uint8Array } {
  return level.layers
    ? { tiles: level.layers.rawTiles, materials: level.layers.rawMaterials }
    : { tiles: level.tiles, materials: level.materials };
}

/** La variante d'une salle dans une couche (une salle sans couches est la même dans les deux). */
export function atLayer(level: LevelData, layer: Layer): LevelData {
  return variant(level, layer);
}

/** Ce qui est commun aux deux couches (le dessin de la salle, sous les couches). */
export function commonLayer(level: LevelData): LevelData {
  return variant(level, 'common');
}

/** Couche d'une variante (le présent pour une salle sans couches). */
export function layerOf(level: LevelData): Layer {
  const active = level.layers?.active;
  return active === 'memory' ? 'memory' : 'present';
}

/** Vrai si la tuile est dans une zone propre à une couche. */
export function inLayerZone(level: LevelData, col: number, row: number): boolean {
  const layers = level.layers;
  return (
    !!layers &&
    (layers.present.some((r) => inRect(r, col, row)) ||
      layers.memory.some((r) => inRect(r, col, row)))
  );
}

/**
 * Vérifie une salle à deux couches (D-107) : lanternes, objets de capacité, ennemis, départ,
 * arrivée, portes et sorties hors des zones propres à une couche, et leur sol aussi (on se tient
 * au même endroit dans les deux couches : la couche active n'est jamais sauvegardée) ; un câble a
 * ses deux bouts dans la même couche. Lève une erreur explicite sinon.
 */
export function checkLayers(level: LevelData): void {
  const layers = level.layers;
  if (!layers) {
    return;
  }
  if (level.tide) {
    throw new Error(`Niveau ${level.id} : @shift et @tide ne vont pas ensemble`);
  }
  const both = (what: string, col: number, row: number, ground: boolean) => {
    if (inLayerZone(level, col, row) || (ground && inLayerZone(level, col, row + 1))) {
      throw new Error(
        `Niveau ${level.id} : ${what} dans une zone d'une seule couche (${String(col)} ${String(row)})`,
      );
    }
  };
  for (const e of level.entities) {
    if (e.type !== EntityType.Shell) {
      both(e.type, e.col, e.row, e.type === EntityType.Checkpoint || e.type === EntityType.Ability);
    }
  }
  both('le départ', level.spawn.col, level.spawn.row, true);
  if (level.goal) {
    both("l'arrivée", level.goal.col, level.goal.row, false);
  }
  for (const d of level.doors) {
    both(`la porte ${String(d.id)}`, d.col, d.row, true);
  }
  for (const exit of level.exits) {
    for (let row = exit.rowMin; row <= exit.rowMax + 1; row++) {
      const inner = exit.side === 'left' ? exit.col + 1 : exit.col - 1;
      both(`la sortie ${String(exit.id)}`, inner, row, false);
    }
  }
  const zoneOf = (x: number, y: number) => {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (layers.present.some((r) => inRect(r, col, row))) {
      return 'present';
    }
    return layers.memory.some((r) => inRect(r, col, row)) ? 'memory' : 'common';
  };
  for (const c of allCables.get(level) ?? level.cables) {
    if (zoneOf(c.x1, c.y1) !== zoneOf(c.x2, c.y2)) {
      throw new Error(
        `Niveau ${level.id} : un câble a ses deux bouts dans des couches différentes`,
      );
    }
  }
}
