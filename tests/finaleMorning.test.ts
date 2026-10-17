import { describe, expect, it } from 'vitest';
import { STORY_ZOOM, StoryFlag as F } from '../src/config/story';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { checkCondition, holdsMaria, type StoryStep } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { AFTER_END_ROOM, MARIA_SHELF } from '../src/levels/finale/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { MILESTONES } from '../src/levels/milestones';
import { SKY } from './finaleFlags';
import { level } from './zoneGraph';

/**
 * Le dernier niveau, PR 6 (D-144) : le matin (le réveil, Maria dans les bras ; le tapis, le livre
 * qui s'efface ; ranger Maria sur l'étagère du surmeuble, le dernier câlin) et le dernier plan (la
 * porte, la vue qui reste sur Maria, un très léger signe, le noir).
 */
const TOGETHER = [...SKY, F.FinaleBig, F.FinaleHome, F.FinaleFound, F.FinaleTogether];
const MORNING = [...TOGETHER, F.FinaleMorning];
const AWAKE = [...MORNING, F.FinaleAwake];
const PLAYED = [...AWAKE, F.FinalePlayed];
const SHELVED = [...PLAYED, F.FinaleShelved];
const GONE = [...SHELVED, F.FinaleGone];
const bedroom = level('bedroom');

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}
const trigger = (id: string) =>
  need(
    HOUSE_STORY.triggers.find((t) => t.id === id),
    id,
  );
const prop = (id: string) =>
  need(
    HOUSE_STORY.props.find((p) => p.id === id),
    id,
  );
const flagsOf = (steps: readonly StoryStep[]) =>
  steps.flatMap((s) => (s.do === 'flag' ? [s.id] : []));
const index = (steps: readonly StoryStep[], pred: (s: StoryStep) => boolean) =>
  steps.findIndex(pred);

function director(flags: readonly string[]): StoryDirector {
  const story = new StoryDirector(HOUSE_STORY, { play: () => undefined } as never);
  story.setFlags(flags);
  return story;
}

/** Les Maria de la chambre à ce moment (objets de mise en scène), avec leur place. */
function marias(flags: readonly string[]): string[] {
  const set = new Set(flags);
  return HOUSE_STORY.props
    .filter((p) => p.room === 'bedroom' && p.kind.includes('maria') && checkCondition(set, p.when))
    .map((p) => `${p.kind}@${String(p.col)},${String(p.row)}`);
}

/** Ce qu'on peut faire avec Agir dans la chambre (sans les objets à regarder). */
function actions(flags: readonly string[]): string[] {
  const set = new Set(flags);
  return HOUSE_STORY.triggers
    .filter(
      (t) =>
        t.room === 'bedroom' && t.on === 'interact' && !t.repeat && checkCondition(set, t.when),
    )
    .map((t) => t.id);
}

describe('le matin (D-144)', () => {
  it('dans l’ordre : le lit, le tapis, l’étagère ; puis plus rien à faire, la porte', () => {
    expect(actions(TOGETHER)).toEqual(['finale-morning']);
    expect(actions(AWAKE)).toEqual(['finale-play']);
    expect(actions(PLAYED)).toEqual(['finale-shelf']);
    expect(actions(SHELVED)).toEqual([]);
    expect(actions(GONE)).toEqual([]);
    expect(flagsOf(trigger('finale-morning').steps)).toEqual([F.FinaleMorning, F.FinaleAwake]);
    // Le tapis mène d'une traite à l'étagère (D-190) ; une partie reprise entre les deux range
    // Maria depuis le tapis.
    expect(flagsOf(trigger('finale-play').steps)).toEqual([F.FinalePlayed, F.FinaleShelved]);
    expect(flagsOf(trigger('finale-shelf').steps)).toEqual([F.FinaleShelved]);
    expect(MILESTONES.map((m) => ('trigger' in m ? m.trigger : ''))).toEqual(
      expect.arrayContaining(['finale-play', 'finale-leave']),
    );
  });

  it('le jour se lève : plus la nuit, les lumières reviennent', () => {
    expect(director(TOGETHER).timeOfDay()).toBe('evening');
    expect(director(TOGETHER).dim('bedroom')).toBe(true);
    for (const flags of [MORNING, AWAKE, SHELVED, GONE]) {
      expect(director(flags).timeOfDay()).toBe('morning');
      expect(director(flags).dim('bedroom')).toBe(false);
    }
  });

  it('une seule Maria à la fois, qui ne change de place que dans le noir', () => {
    expect(marias(TOGETHER)).toEqual(['maria-sit@10,15']);
    // Au réveil, dans les bras de Céleste (le temps du câlin) : aucune autre.
    expect(marias(MORNING)).toEqual([]);
    expect(marias(AWAKE)).toEqual(['maria-sit@10,15']);
    // Sur le tapis, à sa place du premier soir (D-31).
    const first = prop('maria-rug');
    expect(marias(PLAYED)).toEqual([`maria-sit@${String(first.col)},${String(first.row)}`]);
    expect(marias(SHELVED)).toEqual([
      `maria-sit@${String(MARIA_SHELF.col)},${String(MARIA_SHELF.row)}`,
    ]);
    expect(marias(GONE)).toEqual(marias(SHELVED));
    expect(HOUSE_STORY.props.filter((p) => p.kind.includes('maria') && p.instant)).toEqual([]);
  });

  it('le réveil : Maria dans les bras, assise ; le cœur ; puis à côté d’elle, et l’étincelle sur le tapis', () => {
    const steps = trigger('finale-morning').steps;
    const hold = index(steps, (s) => s.do === 'pose' && s.pose === 'hold-sit');
    expect(hold).toBeGreaterThan(index(steps, (s) => s.do === 'fadeOut'));
    expect(holdsMaria('hold-sit')).toBe(true);
    const heart = index(steps, (s) => s.do === 'thought' && s.icon === 'heart');
    expect(heart).toBeGreaterThan(hold);
    const awake = index(steps, (s) => s.do === 'flag' && s.id === F.FinaleAwake);
    expect(awake).toBeGreaterThan(heart);
    const rug = need(trigger('finale-play').area, 'tapis');
    expect(steps).toContainEqual(expect.objectContaining({ do: 'sparkle', area: rug }));
    // La toute première action du jeu, au même endroit (D-31).
    expect(rug).toEqual(trigger('evening-play').area);
  });

  it('le tapis, comme le premier soir : le cœur ; Agir, l’histoire ; sa pensée part ; elle la regarde', () => {
    const steps = trigger('finale-play').steps;
    const first = trigger('evening-play').steps;
    const seat = (list: readonly StoryStep[]) => list.find((s) => s.do === 'place');
    expect(seat(steps)).toEqual(seat(first));
    const icons = steps.flatMap((s) => (s.do === 'thought' ? [s.icon] : []));
    expect(icons).toEqual(['heart', 'book', 'friends']);
    // Le réflexe (D-190) : c'est le joueur qui ouvre l'histoire, l'étincelle sur la place de Maria.
    const press = index(steps, (s) => s.do === 'await');
    expect(steps[press]).toEqual({ do: 'await', mode: 'press', mark: trigger('finale-play').mark });
    expect(press).toBeGreaterThan(index(steps, (s) => s.do === 'thought' && s.icon === 'heart'));
    expect(press).toBeLessThan(index(steps, (s) => s.do === 'thought' && s.icon === 'book'));
    // L'histoire aussi longue que la première fois ; puis la pensée s'en va.
    const book = need(
      steps.find((s) => s.do === 'thought' && s.icon === 'book'),
      'livre',
    );
    const firstBook = need(
      first.find((s) => s.do === 'thought' && s.icon === 'book'),
      'livre du premier soir',
    );
    expect(book.do === 'thought' && firstBook.do === 'thought' && book.ms === firstBook.ms).toBe(
      true,
    );
    // La vue se rapproche d'elles deux, comme au premier soir, puis revient.
    const look = index(steps, (s) => s.do === 'look' && s.zoom !== undefined);
    expect(look).toBeGreaterThan(index(steps, (s) => s.do === 'thought' && s.icon === 'friends'));
    expect(steps[look]).toMatchObject({ zoom: STORY_ZOOM.evening });
    expect(steps.slice(look + 1)).toContainEqual({ do: 'look' });
  });

  it('ranger Maria sur l’étagère, là où était la couverture : tenir, le cœur ; lâcher, la poser', () => {
    // L'étagère traversable du surmeuble, sous Maria ; la couverture y était le premier soir.
    expect(tileAt(bedroom, MARIA_SHELF.col, MARIA_SHELF.row + 1)).toBe(Tile.OneWay);
    const blanket = need(trigger('evening-blanket').area, 'couverture');
    expect(MARIA_SHELF.col).toBeGreaterThanOrEqual(blanket.col);
    expect(MARIA_SHELF.col).toBeLessThan(blanket.col + blanket.w);
    const steps = trigger('finale-shelf').steps;
    // Les mêmes gestes à la fin du tapis (D-190).
    expect(trigger('finale-play').steps.slice(-steps.length)).toEqual(steps);
    // Dans le noir, Maria dans les bras, devant l'étagère.
    const hold = index(steps, (s) => s.do === 'pose' && s.pose === 'hold');
    expect(hold).toBeGreaterThan(index(steps, (s) => s.do === 'fadeOut'));
    // Le dernier câlin : Agir maintenu, sous les yeux du joueur ; plus de bulle « étagère » ni
    // de cœur après.
    const wait = index(steps, (s) => s.do === 'await');
    expect(steps[wait]).toMatchObject({ do: 'await', mode: 'hold' });
    expect(wait).toBeGreaterThan(index(steps, (s) => s.do === 'fadeIn'));
    expect(steps.filter((s) => s.do === 'thought')).toEqual([]);
    // Lâcher : le noir, Maria sur l'étagère, les bras vides.
    const after = steps.slice(wait + 1);
    expect(after[0]?.do).toBe('fadeOut');
    const shelved = index(after, (s) => s.do === 'flag' && s.id === F.FinaleShelved);
    const empty = index(after, (s) => s.do === 'pose' && s.pose === 'stand');
    expect(shelved).toBeLessThan(index(after, (s) => s.do === 'fadeIn'));
    expect(empty).toBeLessThan(index(after, (s) => s.do === 'fadeIn'));
    // Elle la regarde de près, puis se tourne vers la porte (à droite).
    expect(after).toContainEqual(expect.objectContaining({ do: 'look', zoom: STORY_ZOOM.evening }));
    const door = need(
      bedroom.exits.find((e) => e.id === 1),
      'porte',
    );
    expect(door.col).toBeGreaterThan(MARIA_SHELF.col);
    expect(after.filter((s) => s.do === 'face')).toEqual([{ do: 'face', facing: 1 }]);
  });

  it('la chambre reste fermée jusqu’à ce que Maria soit rangée ; ensuite, la porte', () => {
    expect(director(AWAKE).lockIcon('bedroom', 1)).toBe('maria');
    expect(director(PLAYED).lockIcon('bedroom', 1)).toBe('maria-shelf');
    expect(director(SHELVED).exitsLocked('bedroom', 1)).toBe(false);
    expect(director(GONE).exitsLocked('bedroom', 1)).toBe(false);
  });
});

describe('le dernier plan (D-144, §12)', () => {
  const leave = trigger('finale-leave');
  const steps = leave.steps;

  it('en sortant par la porte : on ne peut pas l’atteindre sans passer devant', () => {
    expect(leave.on).toBe('touch');
    expect(checkCondition(new Set(SHELVED), leave.when)).toBe(true);
    expect(checkCondition(new Set(PLAYED), leave.when)).toBe(false);
    expect(checkCondition(new Set(GONE), leave.when)).toBe(false);
    const area = need(leave.area, 'zone');
    const door = need(
      bedroom.exits.find((e) => e.id === 1),
      'porte',
    );
    // La zone va du mur de la porte jusqu'à l'étagère haute, pleine au-dessus d'elle.
    expect(area.col + area.w).toBe(door.col);
    expect(area.row + area.h - 1).toBeGreaterThanOrEqual(door.rowMax);
    for (let col = area.col; col < area.col + area.w; col++) {
      expect(tileAt(bedroom, col, area.row - 1), String(col)).toBe(Tile.Solid);
    }
  });

  it('Céleste sort ; la vue reste sur Maria ; un très léger signe ; tout redevient normal ; le noir', () => {
    expect(flagsOf(steps)).toEqual([F.FinaleGone]);
    const gone = index(steps, (s) => s.do === 'gone');
    expect(gone).toBeGreaterThan(index(steps, (s) => s.do === 'fadeOut'));
    expect(steps).toContainEqual({ do: 'look', ...MARIA_SHELF });
    const back = index(steps, (s) => s.do === 'fadeIn');
    const glimmer = index(steps, (s) => s.do === 'glimmer');
    expect(glimmer).toBeGreaterThan(back);
    expect(steps).toContainEqual(expect.objectContaining({ do: 'sparkle' }));
    expect(steps).toContainEqual(expect.objectContaining({ do: 'hush' }));
    // Maria ne bouge pas : rien ne la déplace pendant le plan.
    expect(steps.filter((s) => s.do === 'flag' || s.do === 'toggle')).toHaveLength(1);
    // Le noir, puis l'écran de fin et l'accueil (D-145) : la dernière étape. « Continuer »
    // reprendra dans le couloir ; elle ne revient pas la chercher.
    expect(index(steps.slice(glimmer), (s) => s.do === 'fadeOut')).toBeGreaterThan(0);
    expect(steps.at(-1)).toEqual({ do: 'end', room: AFTER_END_ROOM });
    expect(
      HOUSE_STORY.triggers
        .filter(
          (t) => t.room === 'bedroom' && t.on !== 'leave' && checkCondition(new Set(GONE), t.when),
        )
        .filter((t) => !t.repeat),
    ).toEqual([]);
  });
});

describe('après la fin (D-145)', () => {
  it('« Continuer » reprend dans le couloir, juste derrière la porte de la chambre', () => {
    const hall = level(AFTER_END_ROOM);
    const door = need(
      hall.exits.find((e) => e.id === 1),
      'porte de la chambre',
    );
    // Le départ du couloir : à deux pas de la porte de la chambre, du même côté.
    expect(door.side).toBe('left');
    expect(Math.abs(hall.spawn.col - door.col)).toBeLessThanOrEqual(4);
    expect(hall.spawn.row).toBeGreaterThanOrEqual(door.rowMin);
    expect(hall.spawn.row).toBeLessThanOrEqual(door.rowMax);
  });

  it('chez elle, le matin : rien de fermé, Maria sur son étagère sans étincelle, le fil discret se tait', () => {
    const story = director(GONE);
    expect(story.timeOfDay()).toBe('morning');
    for (const room of ['bedroom', 'hall']) {
      for (const exit of level(room).exits) {
        expect(story.exitsLocked(room, exit.id), `${room}:${String(exit.id)}`).toBe(false);
      }
    }
    expect(marias(GONE)).toEqual([
      `maria-sit@${String(MARIA_SHELF.col)},${String(MARIA_SHELF.row)}`,
    ]);
    // Aucune étincelle sur Maria : rien à faire là où elle est.
    const set = new Set(GONE);
    const near = HOUSE_STORY.triggers.filter(
      (t) =>
        t.room === 'bedroom' &&
        t.mark !== undefined &&
        checkCondition(set, t.when) &&
        Math.abs(t.mark.col - MARIA_SHELF.col) <= 2 &&
        Math.abs(t.mark.row - MARIA_SHELF.row) <= 2,
    );
    expect(near).toEqual([]);
    // Le dernier jalon du chemin principal est le dernier plan : après lui, plus de but.
    const last = MILESTONES.at(-1);
    expect(last && 'trigger' in last ? last.trigger : '').toBe('finale-leave');
    expect(checkCondition(set, trigger('finale-leave').when)).toBe(false);
  });
});
