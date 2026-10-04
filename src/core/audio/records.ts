import { RECORDS, recordSlot, type RecordId, type RecordSlot } from '../../config/records';

/** Une pochette du tourne-disque (D-121). */
export interface RecordSleeve {
  readonly id: RecordId;
  readonly sleeve: number;
  /** Trouvé (jouable) ; sinon, une pochette vide en pointillés. */
  readonly found: boolean;
}

/**
 * Les pochettes du tourne-disque, dans l'ordre de `RECORDS` : seulement les disques qui ont un
 * fichier (`hasFile`), trouvés d'après les souvenirs de la sauvegarde.
 */
export function recordShelf(
  memories: readonly string[],
  hasFile: (slot: RecordSlot) => boolean,
): RecordSleeve[] {
  const shelf: RecordSleeve[] = [];
  for (const { id, sleeve } of RECORDS) {
    const slot = recordSlot(id);
    if (hasFile(slot)) {
      shelf.push({ id, sleeve, found: memories.includes(slot) });
    }
  }
  return shelf;
}

/** Au moins un disque à jouer : sinon, le tourne-disque reste vide (un petit signe). */
export function canPlayRecords(shelf: readonly RecordSleeve[]): boolean {
  return shelf.some((s) => s.found);
}
