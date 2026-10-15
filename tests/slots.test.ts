import { describe, expect, it } from 'vitest';
import type { LoadReport } from '../src/core/save/SaveManager';
import { createNewSave } from '../src/core/save/saveData';
import {
  continueSlot,
  firstFreeSlot,
  formatSavedAt,
  slotUnreadable,
  type SlotSummary,
} from '../src/core/save/slots';

function empty(slot: number): SlotSummary {
  const report: LoadReport = {
    data: null,
    source: 'none',
    mainProblem: null,
    previousProblem: null,
    readFailed: false,
  };
  return { slot, report };
}

function game(slot: number, savedAt: number): SlotSummary {
  return {
    slot,
    report: { ...empty(slot).report, data: createNewSave('hall', savedAt), source: 'main' },
  };
}

function broken(slot: number): SlotSummary {
  return { slot, report: { ...empty(slot).report, mainProblem: 'checksum' } };
}

describe('les parties (D-184)', () => {
  it('« Continuer » reprend la dernière partie jouée, sinon la plus récente', () => {
    expect(continueSlot([game(1, 10), game(2, 30), game(3, 20)], 1)).toBe(1);
    expect(continueSlot([game(1, 10), empty(2), game(3, 20)], 2)).toBe(3);
    expect(continueSlot([game(1, 10), broken(2), empty(3)], 2)).toBe(1);
    expect(continueSlot([empty(1), broken(2), empty(3)], 1)).toBeNull();
  });

  it('une place libre : ni partie ni sauvegarde abîmée', () => {
    expect(firstFreeSlot([game(1, 1), broken(2), empty(3)])).toBe(3);
    expect(firstFreeSlot([game(1, 1), game(2, 1), broken(3)])).toBeNull();
    expect(slotUnreadable(broken(2))).toBe(true);
    expect(slotUnreadable(empty(2))).toBe(false);
    expect(slotUnreadable(game(2, 1))).toBe(false);
  });

  it('la date et l’heure de la dernière sauvegarde, à l’heure locale', () => {
    const now = new Date(2026, 9, 15, 10, 0).getTime();
    expect(formatSavedAt(new Date(2026, 9, 15, 8, 5).getTime(), now)).toBe('aujourd’hui à 8 h 05');
    expect(formatSavedAt(new Date(2026, 9, 14, 21, 32).getTime(), now)).toBe('hier à 21 h 32');
    expect(formatSavedAt(new Date(2026, 9, 3, 21, 32).getTime(), now)).toBe(
      'le 3 octobre à 21 h 32',
    );
    expect(formatSavedAt(new Date(2026, 7, 1, 0, 0).getTime(), now)).toBe('le 1er août à 0 h 00');
    expect(formatSavedAt(new Date(2025, 11, 31, 23, 59).getTime(), now)).toBe(
      'le 31 décembre 2025 à 23 h 59',
    );
    // Hier, à cheval sur un mois.
    const first = new Date(2026, 10, 1, 9, 0).getTime();
    expect(formatSavedAt(new Date(2026, 9, 31, 22, 10).getTime(), first)).toBe('hier à 22 h 10');
  });
});
