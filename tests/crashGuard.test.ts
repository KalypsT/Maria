import { describe, expect, it } from 'vitest';
import { errorDetail, looksFrozen } from '../src/core/platform/crashGuard';

describe('le filet en cas d’erreur (D-182)', () => {
  it('figé : appli visible, aucune image depuis l’erreur, assez longtemps', () => {
    expect(looksFrozen(10_000, 7_000, 6_990, false, 2500)).toBe(true);
    // Une image rendue après l’erreur : la boucle continue, l’erreur était sans conséquence.
    expect(looksFrozen(10_000, 7_000, 7_016, false, 2500)).toBe(false);
    // Pas encore assez longtemps (un chargement de salle peut bloquer un moment).
    expect(looksFrozen(9_000, 7_000, 6_990, false, 2500)).toBe(false);
    // Appli en arrière-plan : aucune image n’est rendue, ce n’est pas une panne.
    expect(looksFrozen(10_000, 7_000, 6_990, true, 2500)).toBe(false);
  });

  it('le détail tient sur une ligne courte', () => {
    expect(errorDetail(new TypeError('x is null'))).toBe('TypeError: x is null');
    expect(errorDetail('oups\n  quelque chose')).toBe('oups quelque chose');
    expect(errorDetail({ code: 3 })).toBe('{"code":3}');
    expect(errorDetail(undefined)).toBe('undefined');
    const long = errorDetail('a'.repeat(500), 20);
    expect(long).toHaveLength(20);
    expect(long.endsWith('…')).toBe(true);
  });
});
