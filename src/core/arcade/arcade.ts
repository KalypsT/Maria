import {
  ARCADE,
  ARCADE_CABLES,
  ARCADE_CLIMB,
  ARCADE_GAMES,
  ARCADE_JUMPS,
  ArcadeGameId,
  type ArcadeGame,
} from '../../config/arcade';
import { GROWTH_PHASES, phaseMovement, type GrowthPhase } from '../../config/growth';
import { DEFAULT_MOVEMENT, type MovementParams } from '../../config/movement';
import { generateCablesChunk, generateCablesLevel } from './cables';
import { generateChimneyChunk, generateChimneyLevel } from './chimney';
import { generateCorridorChunk, generateCorridorLevel } from './corridor';
import { generateMonsterChunk, generateMonsterLevel } from './monster';
import { endlessLevel, type EndlessChunk, type EndlessEntry } from './endless';
import { generateStepsChunk, generateStepsLevel } from './steps';
import { generateWindChunk, generateWindLevel } from './wind';
import { generateWorldsChunk, generateWorldsLevel } from './worlds';

/** Le jeu d'un identifiant (undefined : inconnu). */
export function arcadeGame(id: string): ArcadeGame | undefined {
  return ARCADE_GAMES.find((game) => game.id === id);
}

/**
 * Jeux débloqués (D-166) : par leur capacité (déjà acquise), par leur étape (le monstre), ou dès
 * la console (les sauts). La console elle-même (le cadeau de papa) vient avec la PR 3.
 */
export function unlockedArcadeGames(
  abilities: ReadonlySet<string>,
  flags: ReadonlySet<string>,
): ArcadeGame[] {
  return ARCADE_GAMES.filter((game) =>
    game.flag !== undefined
      ? flags.has(game.flag)
      : game.ability === null || abilities.has(game.ability),
  );
}

/** Phase de croissance de Céleste dans un jeu : sa taille et son saut (D-43). */
export function arcadePhase(game: ArcadeGame): GrowthPhase {
  return (
    GROWTH_PHASES.find((phase) => phase.id === game.phase) ?? (GROWTH_PHASES[0] as GrowthPhase)
  );
}

/** Un niveau de la console : une salle comme un parcours d'essai (D-25), hors de la partie. */
export interface ArcadeLevel {
  /** Identifiant de salle (`arcade-<jeu>-<n>`) et texte au format des salles (D-06). */
  readonly id: string;
  readonly text: string;
  readonly game: ArcadeGameId;
  readonly number: number;
  /** Du départ à l'arrivée (tuiles) : ce que vaut le niveau fini au compteur. */
  readonly lengthTiles: number;
  /** Difficulté (0 au premier niveau, vers 1). */
  readonly difficulty: number;
}

/** Jeux qui ont leur générateur de niveaux (tous, depuis la PR 9). */
export const ARCADE_READY: readonly ArcadeGameId[] = [
  ArcadeGameId.Jumps,
  ArcadeGameId.Climb,
  ArcadeGameId.Chimney,
  ArcadeGameId.Wind,
  ArcadeGameId.Cables,
  ArcadeGameId.Corridor,
  ArcadeGameId.Worlds,
  ArcadeGameId.Monster,
];

/**
 * Le niveau n (1, 2, 3…) d'un jeu, toujours le même (D-166) : généré d'après les valeurs de
 * mouvement par défaut de la phase du jeu, jamais d'après les réglages en direct du debug. Null
 * pour un jeu inconnu ou un numéro invalide.
 */
export function arcadeLevel(id: ArcadeGameId, n: number): ArcadeLevel | null {
  const game = arcadeGame(id);
  if (!game || !Number.isInteger(n) || n < 1) {
    return null;
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const level = generate(game, n, params, phase.hitbox);
  return {
    id: `arcade-${id}-${String(n)}`,
    text: level.text,
    game: id,
    number: n,
    lengthTiles: level.lengthTiles,
    difficulty: level.difficulty,
  };
}

/** Ce que tous les générateurs donnent. */
interface Generated {
  readonly text: string;
  readonly lengthTiles: number;
  readonly difficulty: number;
}

/** Le générateur de chaque jeu. */
function generate(
  game: ArcadeGame,
  n: number,
  params: Readonly<MovementParams>,
  hitbox: Readonly<{ width: number; height: number }>,
): Generated {
  switch (game.id) {
    case ArcadeGameId.Jumps:
    case ArcadeGameId.Climb: {
      const tuning = game.id === ArcadeGameId.Jumps ? ARCADE_JUMPS : ARCADE_CLIMB;
      return generateStepsLevel(game.id, game.name, n, tuning, params, hitbox, game.abilities);
    }
    case ArcadeGameId.Chimney:
      return generateChimneyLevel(n, params, hitbox, game.abilities);
    case ArcadeGameId.Wind:
      return generateWindLevel(n, params, hitbox, game.abilities);
    case ArcadeGameId.Cables:
      return generateCablesLevel(n, params, hitbox, game.abilities);
    case ArcadeGameId.Corridor:
      return generateCorridorLevel(n, params, hitbox, game.abilities);
    case ArcadeGameId.Worlds:
      return generateWorldsLevel(n, params, hitbox, game.abilities);
    case ArcadeGameId.Monster:
      return generateMonsterLevel(n, params, hitbox, game.abilities);
  }
}

/** Jeux qui ont leurs morceaux pour le mode Sans fin (D-167) : tous, depuis sa PR 5. */
export const ENDLESS_READY: readonly ArcadeGameId[] = Object.values(ArcadeGameId);

/**
 * Le morceau `index` (0, 1, 2…) d'une partie Sans fin de graine `runSeed` (D-167) : généré, comme
 * les niveaux, d'après les valeurs de mouvement par défaut de la phase du jeu. `entry` : où il
 * commence (là où a fini le morceau d'avant : la hauteur de la jointure, la couche ; null : le
 * premier). Null pour un jeu sans morceaux (encore) ou un rang invalide.
 */
export function endlessChunk(
  id: ArcadeGameId,
  index: number,
  runSeed: number,
  entry: EndlessEntry | null = null,
): EndlessChunk | null {
  const game = arcadeGame(id);
  if (!game || !ENDLESS_READY.includes(id) || !Number.isInteger(index) || index < 0) {
    return null;
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  const level = endlessLevel(index);
  switch (id) {
    case ArcadeGameId.Climb:
      return generateStepsChunk(
        game.id,
        game.name,
        index,
        level,
        runSeed,
        ARCADE_CLIMB,
        params,
        phase.hitbox,
        game.abilities,
      );
    case ArcadeGameId.Chimney:
      return generateChimneyChunk(index, level, runSeed, entry, params, phase.hitbox);
    case ArcadeGameId.Wind:
      return generateWindChunk(index, level, runSeed, params, phase.hitbox);
    case ArcadeGameId.Cables:
      return generateCablesChunk(
        index,
        level,
        runSeed,
        entry?.top ?? ARCADE_CABLES.start.top,
        params,
        phase.hitbox,
      );
    case ArcadeGameId.Corridor:
      return generateCorridorChunk(index, level, runSeed, params, phase.hitbox);
    case ArcadeGameId.Worlds:
      return generateWorldsChunk(index, level, runSeed, entry, params, phase.hitbox);
    case ArcadeGameId.Monster:
      return generateMonsterChunk(index, level, runSeed, params, phase.hitbox);
    default:
      return generateStepsChunk(
        game.id,
        game.name,
        index,
        level,
        runSeed,
        ARCADE_JUMPS,
        params,
        phase.hitbox,
        game.abilities,
      );
  }
}

/** Mètres du compteur pour une distance parcourue (tuiles). */
export function metersOf(tiles: number): number {
  return Math.max(0, Math.floor(tiles * ARCADE.metersPerTile));
}
