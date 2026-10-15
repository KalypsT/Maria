import { describe, expect, it } from 'vitest';
import {
  consumeQuietRelaunch,
  markQuietRelaunch,
  type MarkStorage,
} from '../src/core/platform/quietRelaunch';

function memoryStorage(): MarkStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe('pas d’intro après un rechargement voulu (D-186)', () => {
  it('un lancement ordinaire joue l’intro', () => {
    expect(consumeQuietRelaunch(memoryStorage())).toBe(false);
  });

  it('la marque sert une seule fois', () => {
    const storage = memoryStorage();
    markQuietRelaunch(storage);
    expect(consumeQuietRelaunch(storage)).toBe(true);
    expect(consumeQuietRelaunch(storage)).toBe(false);
  });

  it('sans stockage, ou s’il refuse, l’intro se joue sans erreur', () => {
    const broken: MarkStorage = {
      getItem: () => {
        throw new Error('refusé');
      },
      setItem: () => {
        throw new Error('refusé');
      },
      removeItem: () => undefined,
    };
    expect(() => {
      markQuietRelaunch(broken);
    }).not.toThrow();
    expect(consumeQuietRelaunch(broken)).toBe(false);
    markQuietRelaunch(null);
    expect(consumeQuietRelaunch(null)).toBe(false);
  });
});
