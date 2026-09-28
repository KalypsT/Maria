import { TILE_SIZE } from '../../config/display';

/** Types de tuiles de collision. */
export const Tile = {
  Empty: 0,
  Solid: 1,
  /** Plateforme traversable par le dessous, solide seulement par le dessus. */
  OneWay: 2,
} as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

/** Format interne neutre d'un niveau (décision D-06), indépendant du format source. */
export interface LevelData {
  readonly id: string;
  /** Largeur en tuiles. */
  readonly width: number;
  /** Hauteur en tuiles. */
  readonly height: number;
  /** Tuiles ligne par ligne : index = row * width + col. */
  readonly tiles: Uint8Array;
  /** Tuile de départ de Céleste : ses pieds reposent sur le bas de cette tuile. */
  readonly spawn: TilePos;
  /** Tuile d'arrivée d'un parcours (atteinte quand Céleste la touche), absente d'une salle libre. */
  readonly goal: TilePos | null;
  /** Métadonnées lues dans les commentaires `; @clé: valeur` (nom, difficulté…). */
  readonly meta: Readonly<Record<string, string>>;
}

export interface TilePos {
  readonly col: number;
  readonly row: number;
}

/** Tuile à une position de grille. Hors de la grille : plein (le niveau est fermé). */
export function tileAt(level: LevelData, col: number, row: number): number {
  if (col < 0 || row < 0 || col >= level.width || row >= level.height) {
    return Tile.Solid;
  }
  return level.tiles[row * level.width + col] ?? Tile.Solid;
}

/** Position (coin haut gauche, px) d'une hitbox posée au centre bas de la tuile de départ. */
export function spawnPosition(
  level: LevelData,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (level.spawn.col + 0.5) * TILE_SIZE - width / 2,
    y: (level.spawn.row + 1) * TILE_SIZE - height,
  };
}
