import testRoomText from './test-room.txt?raw';

/** Salle disponible : identifiant et carte ASCII (D-06). Le nom est lu dans `; @name:`. */
export interface LevelSource {
  readonly id: string;
  readonly text: string;
}

/** Salles jouables, dans l'ordre de la liste de choix. La première est chargée au démarrage. */
export const LEVELS: readonly LevelSource[] = [{ id: 'test-room', text: testRoomText }];
