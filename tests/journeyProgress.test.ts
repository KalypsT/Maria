import { describe, expect, it } from 'vitest';
import {
  JOURNEY_STEPS,
  TREASURE_FINDS,
  TREASURE_MILESTONES,
  isTreasureMilestone,
} from '../src/config/journey';
import { MARIA_THINGS, MEMORIES, STRANGE_THINGS } from '../src/config/memories';
import { RECORD_SLOTS } from '../src/config/records';
import { StoryFlag as F } from '../src/config/story';
import { createNewSave } from '../src/core/save/saveData';
import { journeyProgress } from '../src/core/world/journeyProgress';
import { zoneShells } from '../src/core/world/shells';
import { buildZone } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { HOUSE } from '../src/levels/house/zone';

const zone = buildZone(HOUSE);
const shells = zoneShells(zone);

/** Les étapes de l'histoire d'où viennent un drapeau ou un trésor. */
const steps = HOUSE_STORY.triggers.flatMap((t) => t.steps.map((step) => ({ room: t.room, step })));

/** Les lieux sans retour (D-180 : aucune trouvaille) : chez la nounou, le monde de Maria. */
const noReturn = (room: string) => room.startsWith('nanny-') || room.startsWith('finale-');

/** L'avancement du voyage (D-180) : moitié l'histoire, moitié les trouvailles. */
describe('l’avancement du voyage', () => {
  it('une nouvelle partie : 0 %', () => {
    const p = journeyProgress(zone, createNewSave('bedroom', 0));
    expect(p).toEqual({
      story: { done: 0, total: JOURNEY_STEPS.length },
      finds: { done: 0, total: shells.length + TREASURE_FINDS.length },
      percent: 0,
    });
  });

  it('chaque étape est posée par l’histoire ; la dernière est la fin du jeu', () => {
    const set = new Set(steps.flatMap(({ step }) => (step.do === 'flag' ? [step.id] : [])));
    expect(JOURNEY_STEPS.filter((flag) => !set.has(flag))).toEqual([]);
    expect(new Set(JOURNEY_STEPS).size).toBe(JOURNEY_STEPS.length);
    expect(JOURNEY_STEPS.at(-1)).toBe(F.FinaleGone);
  });

  it('les jalons : les trésors du monde étrange ; les trouvailles : tout le reste', () => {
    expect(TREASURE_MILESTONES).toEqual(STRANGE_THINGS);
    expect(isTreasureMilestone('roger')).toBe(true);
    expect(isTreasureMilestone('photo')).toBe(false);
    expect([...TREASURE_FINDS].sort()).toEqual(
      [...MEMORIES, ...MARIA_THINGS, ...RECORD_SLOTS].sort(),
    );
  });

  it('chaque trouvaille s’obtient, jamais dans un lieu sans retour', () => {
    const given = steps.filter(({ step }) => step.do === 'memory');
    for (const id of TREASURE_FINDS) {
      const where = given.filter(({ step }) => step.do === 'memory' && step.id === id);
      expect(where.length, id).toBeGreaterThan(0);
      expect(
        where.filter(({ room }) => noReturn(room)).map(({ room }) => room),
        id,
      ).toEqual([]);
    }
    expect(shells.filter((s) => noReturn(s.room)).map((s) => s.name)).toEqual([]);
  });

  it('moitié-moitié, chaque trouvaille autant ; arrondi vers le bas', () => {
    const data = createNewSave('bedroom', 0);
    data.story.flags.push(...JOURNEY_STEPS);
    expect(journeyProgress(zone, data).percent).toBe(50);
    const total = shells.length + TREASURE_FINDS.length;
    data.progression.memories.push('photo', 'record-early', 'roger');
    data.progression.collectibles.push(shells[0]?.name ?? '', 'pas-une-coquille');
    const p = journeyProgress(zone, data);
    // Roger est un jalon : il ne compte pas parmi les trouvailles.
    expect(p.finds.done).toBe(3);
    expect(p.percent).toBe(Math.floor(50 + (50 * 3) / total));
  });

  it('100 % seulement quand l’histoire est finie et que tout est trouvé', () => {
    const data = createNewSave('bedroom', 0);
    data.progression.memories.push(...TREASURE_FINDS);
    data.progression.collectibles.push(...shells.map((s) => s.name));
    expect(journeyProgress(zone, data).percent).toBe(50);
    data.story.flags.push(...JOURNEY_STEPS.slice(0, -1));
    expect(journeyProgress(zone, data).percent).toBe(97);
    data.story.flags.push(F.FinaleGone);
    expect(journeyProgress(zone, data).percent).toBe(100);
    // Une seule coquille manquante : 99 %.
    data.progression.collectibles.pop();
    expect(journeyProgress(zone, data).percent).toBe(99);
  });
});
