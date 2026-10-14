import { MARIA_THINGS, MEMORIES, STRANGE_THINGS, type MemoryId } from './memories';
import { RECORD_SLOTS, type RecordSlot } from './records';
import { StoryFlag as F } from './story';

/**
 * L'avancement du voyage (D-180, choix de l'utilisateur) : un pourcentage dans le cahier, pour tout
 * le jeu sauf la console. Moitié l'histoire, moitié les trouvailles ; 100 % seulement quand
 * l'histoire est finie et que tout est trouvé.
 */
export const JOURNEY = {
  /** Part de l'histoire (le reste : les trouvailles, chacune autant). */
  storyShare: 0.5,
} as const;

/**
 * Les étapes de l'histoire qui comptent (des drapeaux déjà écrits dans la sauvegarde), dans l'ordre
 * du voyage. La dernière est la fin du jeu.
 */
export const JOURNEY_STEPS: readonly string[] = [
  // La maison et le jardin.
  F.StrangeDone,
  F.Grown,
  F.HedgeDone,
  F.GateOpen,
  // Le quartier, la gare, le train, la mer.
  F.SchoolDone,
  F.StationDone,
  F.TrainStrangeDone,
  F.TrainArrived,
  F.SeaStrangeDone,
  F.SeaEnd,
  // Chez la nounou.
  F.NannyBedDone,
  F.NannySchoolDone,
  F.NannyStationDone,
  F.NannySeaDone,
  F.NannyClothDone,
  F.NannyErasureGone,
  F.NannyEden,
  F.NannyWake,
  // Le monde de Maria.
  F.FinaleFound,
  F.FinaleGone,
];

/**
 * Les jalons (D-180) : les trésors sans lesquels on n'avance pas (ceux qui terminent un monde
 * étrange). Ils comptent dans l'histoire, pas dans les trouvailles ; dans le sac, leur case vide
 * n'a pas d'indice de lieu.
 */
export const TREASURE_MILESTONES: readonly MemoryId[] = STRANGE_THINGS;

/** Les trésors qu'on peut manquer (D-180) : les souvenirs, les affaires de Maria, les disques. */
export const TREASURE_FINDS: readonly (MemoryId | RecordSlot)[] = [
  ...MEMORIES,
  ...MARIA_THINGS,
  ...RECORD_SLOTS,
];

/** Un jalon (sans indice de lieu dans le sac). */
export function isTreasureMilestone(id: string): boolean {
  return (TREASURE_MILESTONES as readonly string[]).includes(id);
}
