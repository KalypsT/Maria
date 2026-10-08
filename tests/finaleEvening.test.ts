import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../src/config/display';
import { StoryFlag as F } from '../src/config/story';
import { checkCondition, type StoryStep } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { FINALE_CRADLE } from '../src/levels/finale/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { PHASE4 } from './finaleFlags';

/** Le dernier niveau, PR 1 (D-139) : le premier soir rejoué sans Maria, la nuit, le berceau vide. */
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
const flagsOf = (steps: readonly StoryStep[]) =>
  steps.flatMap((s) => (s.do === 'flag' ? [s.id] : []));

const RUG = [...PHASE4, F.FinaleRug];
const CRADLE = [...RUG, F.FinaleCradle];
const GOODNIGHT = [...CRADLE, F.FinaleGoodnight];
const NIGHT = [...GOODNIGHT, F.FinaleNight];

/** Les déclencheurs Agir de la chambre qui font avancer l'histoire (pas les objets à regarder). */
function storyActions(flags: readonly string[]): string[] {
  const set = new Set(flags);
  return HOUSE_STORY.triggers
    .filter(
      (t) =>
        t.room === 'bedroom' && t.on === 'interact' && !t.repeat && checkCondition(set, t.when),
    )
    .map((t) => t.id);
}

/** Les objets de mise en scène de la chambre, montrés à ce moment. */
function shown(flags: readonly string[]): string[] {
  const set = new Set(flags);
  return HOUSE_STORY.props
    .filter((p) => p.room === 'bedroom' && checkCondition(set, p.when))
    .map((p) => p.kind);
}

function director(flags: readonly string[]): StoryDirector {
  const story = new StoryDirector(HOUSE_STORY, { play: () => undefined } as never);
  story.setFlags(flags);
  return story;
}

describe('le dernier niveau : le premier soir, sans Maria (D-139)', () => {
  it('la fin du niveau 7 mène au soir, chez elle ; plus de « ? »', () => {
    // Au réveil au dortoir, le jour ; quelques mois plus tard, le soir.
    expect(director([F.NannyEden, F.NannyWake]).timeOfDay()).toBe('morning');
    for (const flags of [PHASE4, RUG, CRADLE, GOODNIGHT, NIGHT]) {
      expect(director(flags).timeOfDay()).toBe('evening');
    }
    const eden = trigger('nanny-eden');
    const thoughts = eden.steps.flatMap((s) => (s.do === 'thought' ? [s.icon] : []));
    expect(thoughts).not.toContain('question');
    expect(thoughts.at(-1)).toBe('maria-missing');
  });

  it('le rituel, dans l’ordre : le tapis, le berceau, le lit', () => {
    expect(storyActions(PHASE4)).toEqual(['finale-rug']);
    expect(storyActions(RUG)).toEqual(['finale-cradle']);
    expect(storyActions(CRADLE)).toEqual(['finale-sleep']);
    // La nuit, le berceau vide : l'entrée du monde de Maria (D-141).
    expect(storyActions(NIGHT)).toEqual(['finale-enter']);
    expect(flagsOf(trigger('finale-rug').steps)).toEqual([F.FinaleRug]);
    expect(flagsOf(trigger('finale-cradle').steps)).toEqual([F.FinaleCradle]);
    expect(flagsOf(trigger('finale-sleep').steps)).toEqual([F.FinaleGoodnight, F.FinaleNight]);
    // Chaque étape montre la suivante, comme le premier soir (D-31) : le berceau, puis le lit.
    const lastThought = (id: string) =>
      [...trigger(id).steps].reverse().find((s) => s.do === 'thought');
    expect(lastThought('finale-rug')).toMatchObject({ icon: 'cradle' });
    expect(lastThought('finale-cradle')).toMatchObject({ icon: 'bed' });
    expect(lastThought('finale-sleep')).toMatchObject({ icon: 'cradle' });
  });

  it('Maria n’est jamais là ; le berceau défait, puis refait, vide', () => {
    for (const flags of [PHASE4, RUG, CRADLE, GOODNIGHT, NIGHT]) {
      const kinds = shown(flags);
      expect(kinds.filter((k) => k.includes('maria'))).toEqual([]);
      expect(kinds.filter((k) => k.startsWith('cradle'))).toHaveLength(1);
    }
    expect(shown(RUG)).toContain('cradle-undone');
    expect(shown(CRADLE)).toContain('cradle');
    expect(shown(NIGHT)).toContain('cradle');
    // La toise a toujours ses quatre traits ; le chat dort sur le tabouret, comme le premier soir.
    expect(shown(PHASE4)).toEqual(expect.arrayContaining(['height-chart-fourth', 'cat-sleep']));
    // Ni le chat ni sa caresse au salon pendant ce temps.
    const living = HOUSE_STORY.props.filter(
      (p) =>
        p.room === 'living' && p.kind.startsWith('cat') && checkCondition(new Set(NIGHT), p.when),
    );
    expect(living).toEqual([]);
    expect(
      HOUSE_STORY.triggers.some(
        (t) => t.id === 'cat-pet' && checkCondition(new Set(PHASE4), t.when),
      ),
    ).toBe(false);
  });

  it('les parents du premier soir : papa à la porte, puis maman pour la bonne nuit', () => {
    const parents = (flags: readonly string[]) => shown(flags).filter((k) => /^(mom|dad)-/.test(k));
    expect(parents(PHASE4)).toEqual(['dad-door']);
    expect(parents(CRADLE)).toEqual(['dad-door']);
    expect(parents(GOODNIGHT)).toEqual(['mom-bed']);
    expect(parents(NIGHT)).toEqual([]);
    // La bulle de maman vient d'elle (D-37).
    expect(trigger('finale-sleep').steps).toContainEqual(
      expect.objectContaining({ do: 'thought', icon: 'heart', by: 'mom-bed-finale' }),
    );
  });

  it('la chambre reste fermée : papa rappelle l’heure du lit ; la nuit, le berceau', () => {
    for (const flags of [PHASE4, RUG, CRADLE]) {
      const story = director(flags);
      expect(story.exitsLocked('bedroom', 1)).toBe(true);
      expect(story.lockSpeaker('bedroom', 1)).toBe('dad-door-finale');
      expect(story.lockIcon('bedroom', 1)).toBe('bed');
    }
    const night = director(NIGHT);
    expect(night.exitsLocked('bedroom', 1)).toBe(true);
    expect(night.lockSpeaker('bedroom', 1)).toBeNull();
    expect(night.lockIcon('bedroom', 1)).toBe('cradle');
    // Avant la phase 4, rien ne change (le soir n'était pas encore venu).
    expect(director([F.Slept, F.Grown, F.GrownOlder]).exitsLocked('bedroom', 1)).toBe(false);
  });

  it('la nuit : les lumières éteintes, le berceau vide qui vacille et mène au monde de Maria', () => {
    expect(director(GOODNIGHT).dim('bedroom')).toBe(false);
    const night = director(NIGHT);
    expect(night.dim('bedroom')).toBe(true);
    const near = (story: StoryDirector) =>
      story.omen('bedroom', (FINALE_CRADLE.col + 0.5) * TILE_SIZE, FINALE_CRADLE.row * TILE_SIZE);
    expect(near(director(CRADLE))).toBe(0);
    expect(near(night)).toBeGreaterThan(0.8);
    // Le berceau, la nuit seulement (D-141) : dans le noir du cercle, la chambre immense.
    const enter = trigger('finale-enter');
    expect(checkCondition(new Set(NIGHT), enter.when)).toBe(true);
    expect(checkCondition(new Set(CRADLE), enter.when)).toBe(false);
    expect(flagsOf(enter.steps)).toEqual([F.FinaleEntered]);
    expect(enter.steps).toContainEqual(
      expect.objectContaining({ do: 'room', room: 'finale-bed', returnPoint: true }),
    );
  });
});
