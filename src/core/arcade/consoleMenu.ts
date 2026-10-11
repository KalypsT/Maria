import { ARCADE_GAMES, ArcadeMode, type ArcadeGame } from '../../config/arcade';
import { arcadeRecord, type ArcadeSave } from '../save/arcade';
import { ARCADE_READY, unlockedArcadeGames } from './arcade';

/** Une case du menu de la console (D-166). */
export interface ConsoleCard {
  readonly game: ArcadeGame;
  /** Débloqué (sa capacité acquise, ou son étape vécue). */
  readonly unlocked: boolean;
  /** Son générateur existe (sinon : « bientôt »). */
  readonly ready: boolean;
  /** Record du mode Niveaux (m ; 0 : jamais joué). */
  readonly record: number;
}

/** Les huit cases du menu, dans l'ordre, d'après la partie. */
export function consoleCards(
  abilities: ReadonlySet<string>,
  flags: ReadonlySet<string>,
  arcade: Readonly<ArcadeSave>,
): ConsoleCard[] {
  const unlocked = new Set(unlockedArcadeGames(abilities, flags).map((game) => game.id));
  return ARCADE_GAMES.map((game) => ({
    game,
    unlocked: unlocked.has(game.id),
    ready: ARCADE_READY.includes(game.id),
    record: arcadeRecord(arcade, game.id, ArcadeMode.Levels),
  }));
}

/** Une case qu'on peut lancer : débloquée et prête. */
export function playable(card: ConsoleCard): boolean {
  return card.unlocked && card.ready;
}
