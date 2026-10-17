import { describe, expect, it } from 'vitest';
import { BUBBLE_PORTRAITS, CHARACTER_IMAGES, characterFiles } from '../src/config/art';
import { THOUGHT_ICONS } from '../src/core/story/story';
import { bubbleKey, bubbleSide, fitScale } from '../src/core/story/bubble';
import { PASSERBY_REACTIONS } from '../src/config/passersby';
import { FINALE_STORY } from '../src/levels/finale/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { NANNY_ENTER, NANNY_STORY } from '../src/levels/nanny/story';
import { SEA_STORY } from '../src/levels/sea/story';
import { STATION_STORY } from '../src/levels/station/story';
import { TRAIN_STORY } from '../src/levels/train/story';

describe('les bulles (D-165)', () => {
  it('partent vers la droite, sauf au bord droit de la salle', () => {
    expect(bubbleSide(100, 80, 640)).toBe(1);
    expect(bubbleSide(600, 80, 640)).toBe(-1);
    // Salle inconnue, ou trop étroite pour la bulle à gauche : vers la droite.
    expect(bubbleSide(600, 80, 0)).toBe(1);
    expect(bubbleSide(60, 80, 100)).toBe(1);
  });

  it('recadrent le pictogramme dans la zone sûre, sans trop grossir les petits', () => {
    const safe = { x: 0, y: 0, w: 26, h: 18 };
    expect(fitScale(52, 18, safe, 1.5)).toBeCloseTo(0.5);
    expect(fitScale(13, 36, safe, 1.5)).toBeCloseTo(0.5);
    expect(fitScale(4, 4, safe, 1.5)).toBe(1.5);
    expect(fitScale(0, 4, safe, 1.5)).toBe(1);
  });

  it('ont une texture par forme, pictogramme, côté et cubes trouvés', () => {
    const keys = new Set<string>();
    for (const kind of ['thought', 'speech'] as const) {
      for (const icon of THOUGHT_ICONS) {
        for (const side of [1, -1] as const) {
          keys.add(bubbleKey(kind, icon, side));
        }
      }
    }
    expect(keys.size).toBe(THOUGHT_ICONS.length * 4);
    expect(bubbleKey('thought', 'cubes', 1, 3)).not.toBe(bubbleKey('thought', 'cubes', 1, 5));
  });

  it('ont les nouveaux pictogrammes', () => {
    for (const icon of ['smile', 'wave', 'hush', 'wonder', 'miss', 'locked'] as const) {
      expect(THOUGHT_ICONS).toContain(icon);
    }
  });
});

describe('les bulles de la maison, du jardin et du quartier (D-165, PR 2)', () => {
  const trigger = (id: string) => {
    const t = HOUSE_STORY.triggers.find((x) => x.id === id);
    if (!t) throw new Error(id);
    return t;
  };
  const thoughts = (id: string) =>
    trigger(id).steps.flatMap((s) => (s.do === 'thought' ? [`${s.by ?? 'C'}:${s.icon}`] : []));

  it('montrent Maria disparue au berceau vide et à la première question, à papa, seulement', () => {
    const missing = HOUSE_STORY.triggers
      .filter((t) => t.steps.some((s) => s.do === 'thought' && s.icon === 'maria-missing'))
      .map((t) => t.id);
    expect(missing).toEqual(expect.arrayContaining(['evening-sleep', 'morning-dad']));
    for (const id of [
      'morning-mom',
      'living-vanish',
      'mom-hug',
      'months-later',
      'garden-mom',
      'street-mom',
    ]) {
      expect(missing, id).not.toContain(id);
    }
    expect(thoughts('morning-dad')).toEqual([
      'C:maria-missing',
      'dad-kitchen:question',
      'dad-kitchen:heart',
    ]);
  });

  it('finissent les échanges avec les parents sur leur indice, sans cœur', () => {
    expect(thoughts('morning-mom')).toEqual(['C:question', 'mom-sofa:question']);
    expect(thoughts('garden-mom')).toEqual(['C:question', 'mom-garden:search']);
    expect(thoughts('garden-dad')).toEqual(['C:question', 'dad-garden:treehouse']);
    expect(thoughts('garden-dad-gate')).toEqual(['dad-garden:cord', 'dad-garden:gate']);
    expect(thoughts('garden-dad-hedge')).toEqual(['dad-garden:hedge']);
    expect(thoughts('street-mom-crane')).toEqual(['mom-bench:crane']);
    expect(thoughts('street-mom')).toEqual(['C:question', 'mom-bench:dad']);
    expect(thoughts('street-dad')).toEqual(['C:question', 'dad-shop:crane']);
  });

  it('gardent les cœurs de tendresse, et montrent le manque', () => {
    expect(thoughts('evening-sleep')).toEqual(['mom-bed:heart', 'C:heart', 'C:maria-missing']);
    expect(thoughts('mom-hug')).toEqual(['C:miss', 'mom-sofa:heart', 'C:heart', 'C:bed']);
    expect(thoughts('months-later')).toEqual(['C:miss', 'C:sun']);
  });

  it("n'ont pas de bulle pour les affaires de Maria ramassées", () => {
    for (const id of ['take-slipper', 'take-bottle', 'take-headband', 'take-bonnet']) {
      expect(thoughts(id), id).toEqual([]);
    }
  });

  it('montrent une porte fermée aux portes du quartier', () => {
    const icons = HOUSE_STORY.lockedRooms
      .filter((l) => l.room === 'street' || l.room === 'school')
      .map((l) => l.icon);
    expect(icons).toEqual(['locked', 'locked', 'locked']);
  });
});

describe('les bulles de la gare, du train et de la mer (D-165, PR 3)', () => {
  const all = [...STATION_STORY.triggers, ...TRAIN_STORY.triggers, ...SEA_STORY.triggers];
  const thoughts = (id: string) => {
    const t = all.find((x) => x.id === id);
    if (!t) throw new Error(id);
    return t.steps.flatMap((s) => (s.do === 'thought' ? [`${s.by ?? 'C'}:${s.icon}`] : []));
  };

  it('ne montrent plus Maria au début des niveaux, seulement à la fin des mondes étranges', () => {
    const maria = all
      .filter((t) => t.steps.some((s) => s.do === 'thought' && s.icon === 'maria'))
      .map((t) => t.id)
      .sort();
    expect(maria).toEqual(['sea-music-book', 'station-roger', 'train-pink-kitchen']);
    expect(
      all.some((t) => t.steps.some((s) => s.do === 'thought' && s.icon === 'maria-missing')),
    ).toBe(false);
  });

  it('gardent le cœur pour la tendresse ; les autres sourient, ou font « chut »', () => {
    expect(thoughts('train-board')).toEqual(['mom-quay:heart', 'C:heart', 'teacher-quay:train']);
    expect(thoughts('train-classmate')[0]).toBe('classmate-play:smile');
    expect(thoughts('train-conductor')).toEqual(['conductor:hush']);
    expect(thoughts('train-mother')).toEqual(['C:miss']);
    expect(thoughts('train-dog')).toEqual(['C:heart']);
    expect(thoughts('sea-arrival')).toEqual([
      'C:question',
      'teacher-sea:sun',
      'classmate-dorm:smile',
    ]);
    expect(thoughts('sea-tide-rises').at(-1)).toBe('teacher-promenade:smile');
    expect(thoughts('sea-evening')).toContain('classmate-jetty:smile');
  });

  it("s'émerveillent devant la cuisine rose, la mer et le livre musical", () => {
    expect(thoughts('train-pink-kitchen')[0]).toBe('C:wonder');
    expect(thoughts('train-morning')).toEqual(['teacher-morning:sun', 'C:wonder']);
    expect(thoughts('sea-music-book')[0]).toBe('C:wonder');
    expect(thoughts('station-months')).toEqual(['C:miss', 'C:train']);
  });

  it('montrent une porte fermée, sauf la maîtresse qui demande où on va', () => {
    const icons = [...TRAIN_STORY.lockedRooms, ...SEA_STORY.lockedRooms]
      .filter((l) => l.icon !== undefined && l.icon !== 'bed')
      .map((l) => `${l.speaker ?? 'C'}:${l.icon ?? ''}`);
    expect(icons.filter((i) => i === 'C:question')).toEqual([]);
    expect(icons).toContain('teacher-sea:question');
  });
});

describe('les bulles de la nounou, du monde de Maria et des passants (D-165, PR 4)', () => {
  const all = [...NANNY_STORY.triggers, ...FINALE_STORY.triggers];
  const thoughts = (id: string) => {
    const t = all.find((x) => x.id === id);
    if (!t) throw new Error(id);
    return t.steps.flatMap((s) => (s.do === 'thought' ? [`${s.by ?? 'C'}:${s.icon}`] : []));
  };

  it('montrent Maria une fois à la fin des mondes étranges, puis dans son monde', () => {
    expect(NANNY_ENTER.some((s) => s.do === 'thought')).toBe(false);
    expect(thoughts('nanny-eden')).toEqual(['C:heart', 'C:heart', 'C:maria', 'C:train', 'C:miss']);
    expect(thoughts('finale-rug')).toEqual(['C:maria', 'C:cradle']);
    expect(thoughts('finale-cradle')).toEqual(['C:miss', 'C:bed']);
    expect(thoughts('finale-enter')).toEqual(['C:wonder']);
  });

  it('le reflet sourit ; les cubes émerveillent', () => {
    expect(thoughts('nanny-mirror')).toEqual([
      'C:question',
      'nanny-reflection:smile',
      'nanny-reflection-through:shift',
    ]);
    // Les cubes au bout des îlots, puis rallumés dans la salle de jeux.
    const cubes = NANNY_STORY.triggers.filter(
      (t) => t.id.startsWith('nanny-islet') || t.id.startsWith('nanny-play-'),
    );
    expect(cubes).toHaveLength(8);
    for (const t of cubes) {
      expect(thoughts(t.id)[0], t.id).toBe('C:wonder');
    }
  });

  it('montrent une porte fermée, et les cubes qui manquent à la porte de la sieste', () => {
    const icons = NANNY_STORY.lockedRooms.flatMap((l) => (l.icon ? [l.icon] : []));
    expect(icons).not.toContain('question');
    expect(icons).toContain('locked');
    expect(icons).toContain('cubes');
  });

  it('ne donnent jamais de cœur aux passants', () => {
    const bubbles = Object.values(PASSERBY_REACTIONS).flatMap((r) => (r.bubble ? [r.bubble] : []));
    expect(bubbles.length).toBe(8);
    for (const b of bubbles) {
      expect(['smile', 'wave']).toContain(b);
    }
  });
});

describe('les portraits des bulles (D-189)', () => {
  it('papa, maman et Eden : une image de personnage existante, un cadre dans l’image', () => {
    const files = new Set(Object.values(CHARACTER_IMAGES).flatMap(characterFiles));
    for (const [who, crop] of Object.entries(BUBBLE_PORTRAITS)) {
      expect(files.has(crop.image), who).toBe(true);
      expect(crop.x, who).toBeGreaterThanOrEqual(0);
      expect(crop.y, who).toBeGreaterThanOrEqual(0);
      expect(crop.x + crop.w, who).toBeLessThanOrEqual(1);
      expect(crop.y + crop.h, who).toBeLessThanOrEqual(1);
    }
  });
});
