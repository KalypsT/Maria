import { describe, expect, it } from 'vitest';
import { THOUGHT_ICONS } from '../src/core/story/story';
import { bubbleKey, bubbleSide, fitScale } from '../src/core/story/bubble';
import { HOUSE_STORY } from '../src/levels/house/story';

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
