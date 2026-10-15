import type { LoadReport } from './SaveManager';
import type { SaveData } from './saveData';

/** Ce que la page des parties (D-184) sait d'un emplacement : sa partie, ou pourquoi il n'en a pas. */
export interface SlotSummary {
  readonly slot: number;
  readonly report: LoadReport;
}

/** Une partie lisible dans l'emplacement. */
export function slotData(summary: SlotSummary): Readonly<SaveData> | null {
  return summary.report.data;
}

/** L'emplacement a du contenu, mais aucun état lisible (ni principal ni précédent). */
export function slotUnreadable(summary: SlotSummary): boolean {
  const { report } = summary;
  return (
    report.data === null &&
    (report.readFailed || report.mainProblem !== null || report.previousProblem !== null)
  );
}

/**
 * La partie que « Continuer » reprend : la dernière jouée si elle existe encore, sinon la plus
 * récemment sauvegardée ; null s'il n'y a aucune partie.
 */
export function continueSlot(summaries: readonly SlotSummary[], lastSlot: number): number | null {
  const last = summaries.find((s) => s.slot === lastSlot);
  if (last && slotData(last)) {
    return lastSlot;
  }
  let best: SlotSummary | null = null;
  for (const summary of summaries) {
    const data = slotData(summary);
    const bestData = best ? slotData(best) : null;
    if (data && (!bestData || data.savedAt > bestData.savedAt)) {
      best = summary;
    }
  }
  return best?.slot ?? null;
}

/** Le premier emplacement libre (ni partie ni contenu abîmé), ou null. */
export function firstFreeSlot(summaries: readonly SlotSummary[]): number | null {
  return summaries.find((s) => !slotData(s) && !slotUnreadable(s))?.slot ?? null;
}

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Date et heure de la dernière sauvegarde, à l'heure locale : « aujourd'hui à 21 h 32 », « hier à
 * 8 h 05 », « le 3 octobre à 21 h 32 », avec l'année si ce n'est pas celle d'aujourd'hui.
 */
export function formatSavedAt(savedAt: number, now: number): string {
  const date = new Date(savedAt);
  const today = new Date(now);
  const time = `${String(date.getHours())} h ${String(date.getMinutes()).padStart(2, '0')}`;
  if (sameDay(date, today)) {
    return `aujourd’hui à ${time}`;
  }
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (sameDay(date, yesterday)) {
    return `hier à ${time}`;
  }
  const day = date.getDate() === 1 ? '1er' : String(date.getDate());
  const year = date.getFullYear() === today.getFullYear() ? '' : ` ${String(date.getFullYear())}`;
  return `le ${day} ${MONTHS[date.getMonth()] ?? ''}${year} à ${time}`;
}
