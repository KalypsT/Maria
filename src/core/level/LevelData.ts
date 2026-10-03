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
  /**
   * Eau (la mer, une flaque, D-95) : non solide. Céleste n'y entre jamais : l'analyse de faisabilité
   * l'évite comme un danger, et rien ne se tient dessous.
   */
  Water: 5,
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
  /** Câbles (D-65) : le crochet du parapluie s'y accroche ; déclarés par `; @cable:`. */
  readonly cables: readonly LevelCable[];
  /** Voies ferrées (D-66) : un train y passe et son souffle repousse ; déclarées par `; @train:`. */
  readonly trains: readonly LevelTrain[];
  /** Poursuite (boss, D-67, D-87), déclarée par `; @chase:` ; null sinon. */
  readonly chase: LevelChase | null;
  /**
   * Marée (D-95), déclarée par `; @tide:` : la salle telle quelle est à marée basse ; sa variante à
   * marée haute est construite par `highTide`. Null sans marée.
   */
  readonly tide: LevelTide | null;
  /**
   * Couches de la bascule (D-107), déclarées par `; @shift:` : la salle telle quelle est le
   * « présent » ; sa variante « souvenir » est construite par `atLayer`. Null sans couches.
   */
  readonly layers: LevelLayers | null;
  /**
   * L'effacement (D-111), déclaré par `; @erase:` et `; @erase-step:` : des groupes de tuiles qui
   * changent de couche pendant le jeu (annoncés, jamais en mouvement). Null sans effacement.
   */
  readonly erase: LevelErase | null;
  /** Tronçons dont la difficulté est vérifiée par les tests (`; @leg:`, D-96). */
  readonly legs: readonly LevelLeg[];
  /**
   * Zones balayées à intervalles réguliers (`; @sweep: col ligne l h`, D-101) : les chaises volantes
   * de la fête foraine.
   */
  readonly sweeps: readonly TileRect[];
}

/** Rectangle en tuiles (coin haut gauche, largeur, hauteur). */
export interface TileRect {
  readonly col: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Marée d'une salle (D-95). L'eau remplit les tuiles vides des zones de mer à partir de la ligne
 * `lowRow` (marée basse) ou `highRow` (marée haute, plus haut). Ce qui flotte (bateaux, pontons)
 * est dans une zone `rises` : tout son contenu monte de `lowRow - highRow` lignes à marée haute.
 */
export interface LevelTide {
  /** Première ligne d'eau à marée basse (la hauteur de la salle : pas d'eau). */
  readonly lowRow: number;
  /** Première ligne d'eau à marée haute (`highRow <= lowRow`). */
  readonly highRow: number;
  readonly seas: readonly TileRect[];
  readonly rises: readonly TileRect[];
  /** Tuiles et matériaux tels que dessinés, sans eau (la variante haute en part). */
  readonly rawTiles: Uint8Array;
  readonly rawMaterials: Uint8Array;
  /** Cette salle est la variante à marée haute. */
  readonly high: boolean;
}

/** Couche d'une salle à deux couches (D-107) : le présent (silhouettes) ou le souvenir. */
export type Layer = 'present' | 'memory';

/**
 * Couches d'une salle (la bascule, D-107) : deux variantes statiques de la même salle. Ce qui est
 * dans une zone `present` n'existe que dans le présent, ce qui est dans une zone `memory` que dans
 * le souvenir ; le reste est commun. Rien ne bouge (D-86).
 */
export interface LevelLayers {
  readonly present: readonly TileRect[];
  readonly memory: readonly TileRect[];
  /** Tuiles et matériaux tels que dessinés (les deux couches ensemble). */
  readonly rawTiles: Uint8Array;
  readonly rawMaterials: Uint8Array;
  /** Couche de cette variante ; `common` : seulement ce qui est commun (dessin de la salle). */
  readonly active: Layer | 'common';
}

/** Couches où une tuile existe (D-111) : bits du présent (1) et du souvenir (2). */
export const LayerMask = { None: 0, Present: 1, Memory: 2, Both: 3 } as const;
export type LayerMask = (typeof LayerMask)[keyof typeof LayerMask];

/** Un groupe de l'effacement (D-111) : ses zones, et les couches où il existe au départ. */
export interface EraseGroup {
  readonly id: string;
  readonly rects: readonly TileRect[];
  readonly initial: LayerMask;
}

/**
 * L'effacement d'une salle (D-111). Un groupe cité par une étape (`steps`) est une **vague** : à
 * chaque étape, annoncée, il passe d'une couche à l'autre (présent ↔ souvenir). Les autres sont des
 * **bandes** (avec une poursuite vers le haut) : quand l'effacement monte assez près, elles
 * quittent le présent (elles restent dans le souvenir).
 */
export interface LevelErase {
  readonly groups: readonly EraseGroup[];
  /** Étapes des vagues, dans l'ordre (en boucle) : les groupes qui changent de couche. */
  readonly steps: readonly (readonly string[])[];
  /**
   * Accélérations des vagues (D-117, `; @erase-speed: <étape d'histoire> <facteur>`) : avec cette
   * étape vécue, les vagues vont ce facteur fois plus vite (la plus grande qui s'applique).
   */
  readonly speeds?: readonly { readonly flag: string; readonly scale: number }[];
  /** Étape d'histoire qui dissout l'effacement (D-117, `; @erase-until:`) : plus rien ne change. */
  readonly until?: string;
}

/** Marée d'un tronçon (`; @leg:`), basse par défaut (sans effet dans une salle sans marée). */
export type LegTide = 'low' | 'high';

/**
 * Tronçon d'une salle (D-96) : d'une tuile à une autre (les pieds au bas de la tuile, comme `P`),
 * de difficulté exacte, impossible sans chacune des capacités `needs`, à une marée.
 */
export interface LevelLeg {
  readonly from: TilePos;
  readonly to: TilePos;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly needs: readonly string[];
  readonly tide: LegTide;
  /** Couche de départ (D-107), le présent par défaut ; l'arrivée compte dans les deux couches. */
  readonly layer: Layer;
}

/** Sens d'une poursuite : vers le haut (D-67), vers la droite ou vers la gauche (D-87). */
export type ChaseDir = 'up' | 'right' | 'left';

/**
 * Allure du poursuivant : celle de son sens (le tas des objets perdus, le chariot de vaisselle), ou
 * la vague (D-103, horizontale seulement), qui déferle puis se retire (`surgeMs`, `backwashMs`), ou
 * l'effacement (D-111, vers le haut seulement), une décoloration grise et pâle.
 */
export type ChaseLook = 'default' | 'wave' | 'erasure';

/**
 * Poursuite (D-67, D-87) : quelque chose de grand avance derrière Céleste, dans le sens `dir`. Par
 * phases, dans le sens de la course ; des passages qui le font trébucher ; une ligne d'arrivée.
 */
export interface LevelChase {
  readonly dir: ChaseDir;
  /**
   * Ligne d'arrivée : une ligne de tuiles (vers le haut, les pieds au-dessus de son bas) ou une
   * colonne (vers la droite, le dos de Céleste au-delà de son bord gauche ; vers la gauche, de son
   * bord droit). Atteinte, la poursuite s'arrête.
   */
  readonly end: number;
  /**
   * Phases dans le sens de la course : vitesse (tuiles/s) tant que Céleste n'a pas dépassé la ligne
   * ou la colonne `until` (même convention que `end`).
   */
  readonly phases: readonly { readonly until: number; readonly speed: number }[];
  /** Passages qui le font trébucher : il s'arrête un moment, sans reculer (D-120). */
  readonly trips: readonly {
    readonly col: number;
    readonly row: number;
    readonly width: number;
    readonly height: number;
  }[];
  /** Allure (`; @chase-look: wave`) ; la vague a un rythme (D-103). */
  readonly look: ChaseLook;
}

/**
 * Voie ferrée (D-66) : la ligne des rails (Céleste s'y tient debout au-dessus), d'un mur à l'autre,
 * et le sens du train. Le souffle balaie `TRAIN_GUST_TILES` lignes au-dessus des rails.
 */
export interface LevelTrain {
  readonly row: number;
  /** 1 : le train va vers la droite. */
  readonly dir: 1 | -1;
}

/**
 * Câble tendu (D-65 : caténaire, fil à linge, hauban), en px : un segment de (x1, y1) à (x2, y2),
 * toujours avec x1 < x2. Ce n'est pas une tuile : rien ne s'y pose, seul le crochet s'y accroche.
 */
export interface LevelCable {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** Hauteur (px) d'un câble à l'abscisse x (prolongé au-delà de ses bouts). */
export function cableYAt(cable: LevelCable, x: number): number {
  return cable.y1 + ((cable.y2 - cable.y1) * (x - cable.x1)) / (cable.x2 - cable.x1);
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
