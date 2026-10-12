import { describe, expect, it } from 'vitest';
import { Ability } from '../src/config/abilities';
import { ARCADE, ARCADE_GAMES, ArcadeGameId } from '../src/config/arcade';
import { StoryFlag } from '../src/config/story';
import {
  ARCADE_READY,
  arcadeGame,
  arcadeLevel,
  arcadePhase,
  metersOf,
  unlockedArcadeGames,
} from '../src/core/arcade/arcade';

/** Les jeux de la console (D-166) : un par capacité, leur déblocage, leur phase, le compteur. */
describe('les jeux de la console', () => {
  it('huit jeux, un identifiant chacun, une phase de croissance qui existe', () => {
    expect(ARCADE_GAMES.map((game) => game.id)).toEqual(Object.values(ArcadeGameId));
    for (const game of ARCADE_GAMES) {
      expect(arcadePhase(game).id, game.id).toBe(game.phase);
      expect(arcadeGame(game.id)).toBe(game);
    }
  });

  it('chaque capacité a son jeu, qui la prête', () => {
    for (const ability of Object.values(Ability)) {
      const game = ARCADE_GAMES.find((g) => g.ability === ability);
      expect(game, ability).toBeDefined();
      expect(game?.abilities, ability).toContain(ability);
    }
  });

  it('se débloquent avec leur capacité ; le monstre après la vague de la mer', () => {
    const ids = (abilities: string[], flags: string[] = []) =>
      unlockedArcadeGames(new Set(abilities), new Set(flags)).map((game) => game.id);
    expect(ids([])).toEqual([ArcadeGameId.Jumps]);
    expect(ids([Ability.Climb, Ability.Hook])).toEqual([
      ArcadeGameId.Jumps,
      ArcadeGameId.Climb,
      ArcadeGameId.Cables,
    ]);
    expect(ids(Object.values(Ability))).not.toContain(ArcadeGameId.Monster);
    expect(ids([], [StoryFlag.SeaStrangeDone])).toEqual([ArcadeGameId.Jumps, ArcadeGameId.Monster]);
  });

  it('les niveaux : seulement pour les jeux prêts, à partir de 1', () => {
    expect(ARCADE_READY).toEqual([ArcadeGameId.Jumps, ArcadeGameId.Climb, ArcadeGameId.Cables]);
    expect(arcadeLevel(ArcadeGameId.Chimney, 1)).toBeNull();
    expect(arcadeLevel(ArcadeGameId.Cables, 0)).toBeNull();
    expect(arcadeLevel(ArcadeGameId.Cables, 1.5)).toBeNull();
    expect(arcadeLevel(ArcadeGameId.Cables, 3)?.id).toBe('arcade-cables-3');
  });

  it('le compteur en mètres', () => {
    expect(metersOf(0)).toBe(0);
    expect(metersOf(-5)).toBe(0);
    expect(metersOf(7)).toBe(Math.floor(7 * ARCADE.metersPerTile));
    expect(metersOf(100)).toBe(Math.floor(100 * ARCADE.metersPerTile));
  });
});
