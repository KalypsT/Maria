import { TILE_SIZE } from '../../config/display';

/** Types de tuiles de collision. */
export const Tile = {
  Empty: 0,
  Solid: 1,
  /** Plateforme traversable par le dessous, solide seulement par le dessus. */
  OneWay: 2,
  /**
   * Danger qui pique (orties, briques de jeu, D-21 revu en D-51) : non solide ; au contact,
   * Céleste est touchée comme par un ennemi (rebond, jauge de peur).
   */
  Hazard: 3,
  /** Ronces du monde étrange (D-51) : non solides, dessinées à part ; piquent comme les orties (D-56). */
  Thorns: 4,
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
  /** Ennemis et autres entités, posés au bas de leur tuile. */
  readonly entities: readonly LevelEntity[];
  /** Matériau d'affichage par tuile (même index que `tiles`), sans effet sur la collision. */
  readonly materials: Uint8Array;
  /** Sorties vers d'autres salles (D-25), dans les murs latéraux. */
  readonly exits: readonly LevelExit[];
  /** Portes de façade (D-61) : sorties au milieu d'une salle, franchies avec Agir. */
  readonly doors: readonly LevelDoor[];
  /** Habillage (D-28) : meubles et éléments dessinés, déclarés par `; @decor:` (vide : tuiles). */
  readonly decor: readonly LevelDecor[];
}

/**
 * Élément d'habillage d'une salle (D-28), en tuiles : son nom d'élément visuel (`kind`) et le
 * rectangle qu'il occupe. Sans effet sur la collision.
 */
export interface LevelDecor {
  readonly kind: string;
  readonly col: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
}

/** Matériaux d'affichage (D-25) : des meubles reconnaissables à l'échelle d'une enfant (§10). */
export const Material = { Default: 0, Wood: 1, Fabric: 2, Leaf: 3 } as const;
export type Material = (typeof Material)[keyof typeof Material];

/** Sortie latérale d'une salle (D-25) : ouverture de tuiles vides dans le mur gauche ou droit. */
export interface LevelExit {
  /** Numéro de la sortie dans la salle (chiffre de la carte, 1 à 9). */
  readonly id: number;
  readonly side: 'left' | 'right';
  readonly col: number;
  readonly rowMin: number;
  readonly rowMax: number;
}

/**
 * Porte de façade (D-61) : une sortie au milieu d'une salle (la porte d'un lieu, dans la rue), qu'on
 * franchit avec Agir. Même numérotation que les sorties latérales (un chiffre par salle).
 */
export interface LevelDoor {
  readonly id: number;
  /** Tuile où Céleste se tient devant la porte (ses pieds au bas de cette tuile). */
  readonly col: number;
  readonly row: number;
}

export const EntityType = {
  Patroller: 'patroller',
  /** Araignée au bout de son fil (jardin, D-46) : monte et descend sous son point d'attache. */
  Spider: 'spider',
  /** Escargot qui monte et descend le long d'un mur (derrière la haie, D-49). */
  Snail: 'snail',
  Checkpoint: 'checkpoint',
  /** Objet qui donne une capacité, nommée par `; @ability:` (D-26). */
  Ability: 'ability',
  /** Trouvaille : secret à découvrir (D-27), enregistrée dans la sauvegarde. */
  Secret: 'secret',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export interface LevelEntity {
  readonly type: EntityType;
  readonly col: number;
  readonly row: number;
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
