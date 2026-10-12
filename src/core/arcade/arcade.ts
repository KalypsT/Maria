import {
  ARCADE,
  ARCADE_CLIMB,
  ARCADE_GAMES,
  ARCADE_JUMPS,
  ArcadeGameId,
  type ArcadeGame,
} from '../../config/arcade';
import { GROWTH_PHASES, phaseMovement, type GrowthPhase } from '../../config/growth';
import { DEFAULT_MOVEMENT } from '../../config/movement';
import { generateCablesLevel } from './cables';
import { generateChimneyLevel } from './chimney';
import { generateStepsLevel } from './steps';

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

/** Jeux qui ont déjà leur générateur de niveaux. */
export const ARCADE_READY: readonly ArcadeGameId[] = [
  ArcadeGameId.Jumps,
  ArcadeGameId.Climb,
  ArcadeGameId.Chimney,
  ArcadeGameId.Cables,
];

/**
 * Le niveau n (1, 2, 3…) d'un jeu, toujours le même (D-166) : généré d'après les valeurs de
 * mouvement par défaut de la phase du jeu, jamais d'après les réglages en direct du debug. Null
 * pour un jeu sans générateur (encore) ou un numéro invalide.
 */
export function arcadeLevel(id: ArcadeGameId, n: number): ArcadeLevel | null {
  const game = arcadeGame(id);
  if (!game || !Number.isInteger(n) || n < 1) {
    return null;
  }
  const phase = arcadePhase(game);
  const params = phaseMovement(DEFAULT_MOVEMENT, phase);
  if (id === ArcadeGameId.Jumps || id === ArcadeGameId.Climb) {
    const tuning = id === ArcadeGameId.Jumps ? ARCADE_JUMPS : ARCADE_CLIMB;
    const level = generateStepsLevel(
      id,
      game.name,
      n,
      tuning,
      params,
      phase.hitbox,
      game.abilities,
    );
    return {
      id: `arcade-${id}-${String(n)}`,
      text: level.text,
      game: id,
      number: n,
      lengthTiles: level.lengthTiles,
      difficulty: level.difficulty,
    };
  }
  if (id === ArcadeGameId.Chimney) {
    const level = generateChimneyLevel(n, params, phase.hitbox, game.abilities);
    return {
      id: `arcade-${id}-${String(n)}`,
      text: level.text,
      game: id,
      number: n,
      lengthTiles: level.lengthTiles,
      difficulty: level.difficulty,
    };
  }
  if (id === ArcadeGameId.Cables) {
    const level = generateCablesLevel(n, params, phase.hitbox, game.abilities);
    return {
      id: `arcade-${id}-${String(n)}`,
      text: level.text,
      game: id,
      number: n,
      lengthTiles: level.lengthTiles,
      difficulty: level.difficulty,
    };
  }
  return null;
}

/** Mètres du compteur pour une distance parcourue (tuiles). */
export function metersOf(tiles: number): number {
  return Math.max(0, Math.floor(tiles * ARCADE.metersPerTile));
}
