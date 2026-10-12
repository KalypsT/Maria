import { ARCADE_ENDLESS, ARCADE_GAMES, ArcadeMode, type ArcadeGame } from '../../config/arcade';
import { arcadeReached, arcadeRecord, type ArcadeSave } from '../save/arcade';
import { ARCADE_READY, ENDLESS_READY, unlockedArcadeGames } from './arcade';

/** Une case du menu de la console (D-166). */
export interface ConsoleCard {
  readonly game: ArcadeGame;
  /** Débloqué (sa capacité acquise, ou son étape vécue). */
  readonly unlocked: boolean;
  /** Son générateur existe (sinon : « bientôt »). */
  readonly ready: boolean;
  /** Record du mode Niveaux (m ; 0 : jamais joué). */
  readonly record: number;
  /** Jouable et pas encore vu dans le menu : « nouveau » (et l'étincelle de la télé). */
  readonly isNew: boolean;
  /** Le mode Sans fin (D-167) : ses morceaux existent (sinon : « bientôt »). */
  readonly endlessReady: boolean;
  /** Ouvert : le niveau `ARCADE_ENDLESS.unlockLevel` atteint en mode Niveaux. */
  readonly endlessOpen: boolean;
  /** Record du mode Sans fin (m). */
  readonly endlessRecord: number;
}

/** Les huit cases du menu, dans l'ordre, d'après la partie. */
export function consoleCards(
  abilities: ReadonlySet<string>,
  flags: ReadonlySet<string>,
  arcade: Readonly<ArcadeSave>,
): ConsoleCard[] {
  const unlocked = new Set(unlockedArcadeGames(abilities, flags).map((game) => game.id));
  return ARCADE_GAMES.map((game) => {
    const card = {
      game,
      unlocked: unlocked.has(game.id),
      ready: ARCADE_READY.includes(game.id),
      record: arcadeRecord(arcade, game.id, ArcadeMode.Levels),
      endlessReady: ENDLESS_READY.includes(game.id),
      endlessOpen: arcadeReached(arcade, game.id) >= ARCADE_ENDLESS.unlockLevel,
      endlessRecord: arcadeRecord(arcade, game.id, ArcadeMode.Endless),
    };
    return { ...card, isNew: card.unlocked && card.ready && !arcade.seen.includes(game.id) };
  });
}

/** Une case qu'on peut lancer : débloquée et prête. */
export function playable(card: ConsoleCard): boolean {
  return card.unlocked && card.ready;
}

/** Son mode Sans fin se lance : le jeu jouable, ses morceaux prêts, le niveau voulu atteint. */
export function endlessPlayable(card: ConsoleCard): boolean {
  return playable(card) && card.endlessReady && card.endlessOpen;
}
