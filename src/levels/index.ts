import premiersPas from './courses/01-premiers-pas.txt?raw';
import chaine from './courses/02-chaine.txt?raw';
import tour from './courses/03-tour.txt?raw';
import precision from './courses/04-precision.txt?raw';
import combat from './courses/05-combat.txt?raw';
import checkpoints from './courses/06-checkpoints.txt?raw';
import sautMural from './courses/07-saut-mural.txt?raw';
import testRoomText from './test-room.txt?raw';
import type { LevelData } from '../core/level/LevelData';
import { buildZone, type Zone } from '../core/world/zone';
import { HOUSE } from './house/zone';

/** Salle disponible : identifiant et carte ASCII (D-06). Le nom est lu dans `; @name:`. */
export interface LevelSource {
  readonly id: string;
  readonly text: string;
}

/**
 * Parcours d'essai et salle de test : salles isolées, hors de la partie (D-25). Les jouer ne
 * modifie pas la sauvegarde.
 */
export const LEVELS: readonly LevelSource[] = [
  { id: 'premiers-pas', text: premiersPas },
  { id: 'chaine', text: chaine },
  { id: 'tour', text: tour },
  { id: 'precision', text: precision },
  { id: 'combat', text: combat },
  { id: 'checkpoints', text: checkpoints },
  { id: 'saut-mural', text: sautMural },
  { id: 'test-room', text: testRoomText },
];

/** Parcours d'essai de la Phase 2 : salles avec une arrivée et une difficulté déclarée. */
export const COURSE_IDS: readonly string[] = [
  'premiers-pas',
  'chaine',
  'tour',
  'precision',
  'combat',
  'checkpoints',
  'saut-mural',
];

const NAME = /^;\s*@name\s*:\s*(.*)$/m;

/** Nom affiché d'une salle (`; @name:`), sans l'analyser entièrement. */
export function levelName(source: LevelSource): string {
  return NAME.exec(source.text)?.[1]?.trim() ?? source.id;
}

/** Zones du monde (D-25), validées au chargement. La première accueille une nouvelle partie. */
export const ZONES: readonly Zone[] = [buildZone(HOUSE)];

export interface ZoneRoom {
  readonly level: LevelData;
  readonly zone: Zone;
}

/** Salle d'une zone (null si `id` n'en est pas une, par exemple un parcours d'essai). */
export function zoneRoom(id: string): ZoneRoom | null {
  for (const zone of ZONES) {
    const level = zone.rooms.get(id);
    if (level) {
      return { level, zone };
    }
  }
  return null;
}

function firstZone(): Zone {
  const zone = ZONES[0];
  if (!zone) {
    throw new Error('Aucune zone déclarée dans src/levels/index.ts');
  }
  return zone;
}

/** Salle de départ d'une nouvelle partie. */
export function startRoom(): ZoneRoom {
  const zone = firstZone();
  const level = zone.rooms.get(zone.start);
  if (!level) {
    throw new Error(`Zone ${zone.id} : salle de départ absente`);
  }
  return { level, zone };
}

/** Nom affiché d'une salle de zone ou d'un parcours (null si inconnue). */
export function roomName(id: string): string | null {
  const room = zoneRoom(id);
  if (room) {
    return room.level.meta.name ?? id;
  }
  const source = LEVELS.find((level) => level.id === id);
  return source ? levelName(source) : null;
}
