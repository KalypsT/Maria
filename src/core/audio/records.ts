import { RECORDS, recordSlot, type RecordId, type RecordSlot } from '../../config/records';

/** Une pochette du tourne-disque (D-121). */
export interface RecordSleeve {
  readonly id: RecordId;
  readonly title: string;
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
  for (const { id, title, sleeve } of RECORDS) {
    const slot = recordSlot(id);
    if (hasFile(slot)) {
      shelf.push({ id, title, sleeve, found: memories.includes(slot) });
    }
  }
  return shelf;
}

/** Au moins un disque à jouer : sinon, le tourne-disque reste vide (un petit signe). */
export function canPlayRecords(shelf: readonly RecordSleeve[]): boolean {
  return shelf.some((s) => s.found);
}

/** Ce qu'on peut choisir au tourne-disque : un disque trouvé, ou arrêter celui qui joue. */
export type RecordChoice = RecordId | 'stop';

/**
 * Les choix du tourne-disque, dans l'ordre de l'écran : les disques trouvés (les pochettes vides ne
 * se choisissent pas), puis « arrêter » si un disque joue.
 */
export function recordChoices(
  shelf: readonly RecordSleeve[],
  playing: RecordId | null,
): RecordChoice[] {
  const choices: RecordChoice[] = shelf.filter((s) => s.found).map((s) => s.id);
  if (playing !== null) {
    choices.push('stop');
  }
  return choices;
}

/** Choix au clavier ou à la manette : le suivant (`dir` 1) ou le précédent (-1), en faisant le tour. */
export function moveChoice(index: number, dir: -1 | 1, count: number): number {
  return count > 0 ? (index + dir + count) % count : 0;
}

/** Choix proposé à l'ouverture : le disque qui joue, sinon le premier disque. */
export function firstChoice(choices: readonly RecordChoice[], playing: RecordId | null): number {
  return Math.max(0, playing === null ? 0 : choices.indexOf(playing));
}
