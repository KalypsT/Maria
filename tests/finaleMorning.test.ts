import { describe, expect, it } from 'vitest';
import { STORY_TIMING as S, StoryFlag as F } from '../src/config/story';
import { Tile, tileAt } from '../src/core/level/LevelData';
import { checkCondition, holdsMaria, type StoryStep } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { MARIA_SHELF } from '../src/levels/finale/story';
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
    expect(flagsOf(trigger('finale-play').steps)).toEqual([F.FinalePlayed]);
    expect(flagsOf(trigger('finale-shelf').steps)).toEqual([F.FinaleShelved]);
    expect(MILESTONES.map((m) => ('trigger' in m ? m.trigger : ''))).toEqual(
      expect.arrayContaining(['finale-morning', 'finale-play', 'finale-shelf', 'finale-leave']),
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

  it('le tapis, comme le premier soir : le cœur, le livre commence… et s’efface ; elle la regarde', () => {
    const steps = trigger('finale-play').steps;
    const first = trigger('evening-play').steps;
    const seat = (list: readonly StoryStep[]) => list.find((s) => s.do === 'place');
    expect(seat(steps)).toEqual(seat(first));
    const icons = steps.flatMap((s) => (s.do === 'thought' ? [s.icon] : []));
    expect(icons).toEqual(['heart', 'book', 'maria-shelf']);
    const book = need(
      steps.find((s) => s.do === 'thought' && s.icon === 'book'),
      'livre',
    );
    const firstBook = need(
      first.find((s) => s.do === 'thought' && s.icon === 'book'),
      'livre du premier soir',
    );
    expect(book.do === 'thought' && firstBook.do === 'thought' && book.ms < firstBook.ms).toBe(
      true,
    );
    expect(S.fadingBookMs).toBeLessThan(S.holdMs);
  });

  it('ranger Maria sur l’étagère du surmeuble, là où était la couverture ; le dernier câlin', () => {
    // L'étagère traversable du surmeuble, sous Maria ; la couverture y était le premier soir.
    expect(tileAt(bedroom, MARIA_SHELF.col, MARIA_SHELF.row + 1)).toBe(Tile.OneWay);
    const blanket = need(trigger('evening-blanket').area, 'couverture');
    expect(MARIA_SHELF.col).toBeGreaterThanOrEqual(blanket.col);
    expect(MARIA_SHELF.col).toBeLessThan(blanket.col + blanket.w);
    const steps = trigger('finale-shelf').steps;
    const shelved = index(steps, (s) => s.do === 'flag' && s.id === F.FinaleShelved);
    expect(shelved).toBeGreaterThan(index(steps, (s) => s.do === 'fadeOut'));
    expect(index(steps, (s) => s.do === 'thought' && s.icon === 'heart')).toBeGreaterThan(
      index(steps, (s) => s.do === 'fadeIn'),
    );
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
      expect(tileAt(bedroom, col, area.row - 1), `${String(col)}`).toBe(Tile.Solid);
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
    // Le noir, puis Céleste s'en va par le couloir ; elle ne revient pas la chercher.
    const room = index(steps, (s) => s.do === 'room');
    expect(steps[room]).toMatchObject({ do: 'room', room: 'hall' });
    expect(index(steps.slice(glimmer), (s) => s.do === 'fadeOut')).toBeGreaterThan(0);
    expect(room).toBeGreaterThan(glimmer);
    expect(
      HOUSE_STORY.triggers
        .filter(
          (t) => t.room === 'bedroom' && t.on !== 'leave' && checkCondition(new Set(GONE), t.when),
        )
        .filter((t) => !t.repeat),
    ).toEqual([]);
  });
});
