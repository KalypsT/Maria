import { describe, expect, it } from 'vitest';
import { ArcadeGameId, CONSOLE_TV } from '../src/config/arcade';
import { Ability } from '../src/config/abilities';
import { StoryFlag as F } from '../src/config/story';
import { consoleCards } from '../src/core/arcade/consoleMenu';
import { createArcade } from '../src/core/save/arcade';
import { SaveManager } from '../src/core/save/SaveManager';
import { SaveSession } from '../src/core/save/SaveSession';
import { MemorySaveStorage } from '../src/core/save/SaveStorage';
import { createNewSave } from '../src/core/save/saveData';
import { checkCondition, type StoryTrigger } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { HOUSE_STORY } from '../src/levels/house/story';
import { zoneRoom } from '../src/levels';

function trigger(id: string): StoryTrigger {
  const t = HOUSE_STORY.triggers.find((x) => x.id === id);
  if (!t) {
    throw new Error(id);
  }
  return t;
}

const has = (when: Parameters<typeof checkCondition>[1], flags: string[]) =>
  checkCondition(new Set(flags), when);

/** Le cadeau de papa et la console de la chambre (D-166, PR 3). */
describe('le cadeau de papa', () => {
  const gift = trigger('garden-console');

  it('au premier passage au potager, là où est papa ; une seule fois', () => {
    expect(gift.room).toBe('garden-vegetables');
    expect(gift.on).toBe('touch');
    expect(gift.lock).toBe(true);
    expect(has(gift.when, [F.Grown])).toBe(true);
    expect(has(gift.when, [F.Grown, F.ConsoleGift])).toBe(false);
    // Papa n'est plus au potager une fois le portillon ouvert.
    expect(has(gift.when, [F.Grown, F.GateOpen])).toBe(false);
    const dad = HOUSE_STORY.props.find((p) => p.id === 'dad-garden');
    expect(dad && has(dad.when, [F.Grown])).toBe(true);
    // Toute la largeur du potager : on ne peut pas y entrer sans passer devant lui.
    const room = zoneRoom('garden-vegetables')?.level;
    expect(gift.area?.w).toBe((room?.width ?? 0) - 3);
  });

  it('sans texte : papa appelle, un cadeau, l’émerveillement, la manette, sa chambre (D-189)', () => {
    expect(gift.steps[0]).toEqual({ do: 'flag', id: F.ConsoleGift });
    expect(
      gift.steps.flatMap((s) => (s.do === 'thought' ? [`${s.by ?? 'C'}:${s.icon}`] : [])),
    ).toEqual([
      'dad-garden:call',
      'dad-garden:gift',
      'C:wonder',
      'dad-garden:gamepad',
      'dad-garden:tv-bedroom',
    ]);
  });

  it('une partie déjà passée par le portillon reçoit la console en arrivant dans la chambre', () => {
    const late = trigger('console-late');
    expect(late.room).toBe('bedroom');
    expect(late.steps).toEqual([{ do: 'flag', id: F.ConsoleGift }]);
    expect(has(late.when, [F.GateOpen])).toBe(true);
    expect(has(late.when, [F.GateOpen, F.ConsoleGift])).toBe(false);
    expect(has(late.when, [F.Grown])).toBe(false);
    // Rien de nouveau dans la chambre pendant le dernier niveau ni après la fin (D-144, D-145).
    expect(has(late.when, [F.GateOpen, F.GrownFourth])).toBe(false);
  });
});

describe('la console dans la chambre', () => {
  const tvs = HOUSE_STORY.props.filter((p) => p.kind === 'console-tv');
  const switches = HOUSE_STORY.triggers.filter((t) => t.steps.some((s) => s.do === 'console'));
  const shown = (flags: string[]) => tvs.some((p) => has(p.when, flags));
  const usable = (flags: string[]) => switches.some((t) => has(t.when, flags));

  it('sur le bureau ; on l’allume avec Agir, autant qu’on veut', () => {
    expect(tvs.length).toBeGreaterThan(0);
    for (const tv of tvs) {
      expect(tv).toMatchObject({ room: CONSOLE_TV.room, col: CONSOLE_TV.col, row: CONSOLE_TV.row });
    }
    for (const t of switches) {
      expect(t).toMatchObject({ room: CONSOLE_TV.room, on: 'interact', repeat: true });
      expect(t.steps).toEqual([{ do: 'console' }]);
    }
    // Posée sur le bureau : la tuile sous la télé est pleine, la sienne vide.
    const room = zoneRoom(CONSOLE_TV.room)?.level;
    const tile = (col: number, row: number) => room?.tiles[row * room.width + col];
    expect(tile(CONSOLE_TV.col, CONSOLE_TV.row + 1)).not.toBe(0);
    expect(tile(CONSOLE_TV.col, CONSOLE_TV.row)).toBe(0);
  });

  it('seulement une fois offerte ; pas pendant le dernier niveau ; après la fin, toujours', () => {
    for (const check of [shown, usable]) {
      expect(check([F.Grown])).toBe(false);
      expect(check([F.Grown, F.ConsoleGift])).toBe(true);
      expect(check([F.ConsoleGift, F.GrownFourth])).toBe(false);
      expect(check([F.ConsoleGift, F.GrownFourth, F.FinaleGone])).toBe(true);
      // Une partie finie avant la console : elle est là après la fin.
      expect(check([F.GrownFourth, F.FinaleGone])).toBe(true);
    }
  });

  it('l’étape « console » allume la console, sans rien changer à l’histoire', () => {
    let opened = 0;
    const noop = () => undefined;
    const d = new StoryDirector(
      HOUSE_STORY,
      {
        flagSet: noop,
        place: noop,
        room: noop,
        pose: noop,
        think: noop,
        sparkle: noop,
        shake: noop,
        memory: noop,
        hush: noop,
        ability: noop,
        play: noop,
        console: () => {
          opened++;
        },
      },
      100,
    );
    d.setFlags([F.Grown, F.ConsoleGift]);
    const desk = {
      x: (CONSOLE_TV.area.col + 1) * 16,
      y: (CONSOLE_TV.area.row + CONSOLE_TV.area.h) * 16 - 26,
      width: 12,
      height: 26,
    };
    d.step(CONSOLE_TV.room, desk, true);
    for (let i = 0; i < 100 && d.busy; i++) {
      d.step(CONSOLE_TV.room, desk, false);
    }
    expect(opened).toBe(1);
    expect([...d.flags].sort()).toEqual([F.ConsoleGift, F.Grown].sort());
  });
});

describe('les jeux nouveaux', () => {
  it('« nouveau » tant qu’un jeu jouable n’a pas été vu dans le menu', async () => {
    const arcade = createArcade();
    const news = () =>
      consoleCards(new Set([Ability.Hook]), new Set(), arcade)
        .filter((card) => card.isNew)
        .map((card) => card.game.id);
    // Les sauts (dès le cadeau) et les tyroliennes (le crochet) ; pas la grimpette (sans grimper).
    expect(news()).toEqual([ArcadeGameId.Jumps, ArcadeGameId.Cables]);
    const session = new SaveSession(
      new SaveManager(new MemorySaveStorage()),
      createNewSave('bedroom', 0),
    );
    await session.markArcadeSeen([ArcadeGameId.Cables]);
    await session.markArcadeSeen([ArcadeGameId.Cables]);
    expect(session.data.arcade.seen).toEqual([ArcadeGameId.Cables]);
    arcade.seen.push(ArcadeGameId.Cables);
    expect(news()).toEqual([ArcadeGameId.Jumps]);
  });
});
