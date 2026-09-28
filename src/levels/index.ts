import premiersPas from './courses/01-premiers-pas.txt?raw';
import chaine from './courses/02-chaine.txt?raw';
import tour from './courses/03-tour.txt?raw';
import precision from './courses/04-precision.txt?raw';
import combat from './courses/05-combat.txt?raw';
import testRoomText from './test-room.txt?raw';

/** Salle disponible : identifiant et carte ASCII (D-06). Le nom est lu dans `; @name:`. */
export interface LevelSource {
  readonly id: string;
  readonly text: string;
}

/** Salles jouables, dans l'ordre de la liste de choix. La première est chargée au démarrage. */
export const LEVELS: readonly LevelSource[] = [
  { id: 'premiers-pas', text: premiersPas },
  { id: 'chaine', text: chaine },
  { id: 'tour', text: tour },
  { id: 'precision', text: precision },
  { id: 'combat', text: combat },
  { id: 'test-room', text: testRoomText },
];

/** Parcours d'essai de la Phase 2 : salles avec une arrivée et une difficulté déclarée. */
export const COURSE_IDS: readonly string[] = [
  'premiers-pas',
  'chaine',
  'tour',
  'precision',
  'combat',
];

const NAME = /^;\s*@name\s*:\s*(.*)$/m;

/** Nom affiché d'une salle (`; @name:`), sans l'analyser entièrement. */
export function levelName(source: LevelSource): string {
  return NAME.exec(source.text)?.[1]?.trim() ?? source.id;
}
