import type { FlagCondition } from '../core/story/story';
import { StoryFlag as F } from './story';

/**
 * Le voyage rapide (D-163) : les veilleuses qui se répondent. Une veilleuse principale par niveau,
 * une lanterne qui existe déjà (son nom fixe, D-152), choisie au carrefour du niveau. Sa lumière
 * devient bleu lune (D-179) une fois le monde étrange du niveau traversé ; depuis n'importe quelle lanterne allumée
 * du monde réel, on peut alors y aller, si on pourrait y aller à pied à ce moment-là.
 */
export interface TravelLantern {
  /** Le niveau (D-82). */
  readonly level: 'house' | 'garden' | 'street' | 'station' | 'train' | 'sea';
  /** Nom fixe de la lanterne (`; @lantern:`). */
  readonly lantern: string;
  /**
   * Débloquée dès que l'une de ces étapes est vécue : la fin du monde étrange du niveau (pour le
   * train, son arrivée : avant, il roule). Les suivantes servent aux histoires du debug, qui ne
   * posent pas toutes les étapes.
   */
  readonly unlockedBy: readonly string[];
}

export const TRAVEL_LANTERNS: readonly TravelLantern[] = [
  // La chambre, au pied du coffre à jouets, à côté du bocal à coquilles.
  { level: 'house', lantern: 'bedroom-toybox', unlockedBy: [F.StrangeDone] },
  // La terrasse, sous la table de jardin, à la porte de la maison.
  { level: 'garden', lantern: 'garden-terrace-table', unlockedBy: [F.HedgeDone] },
  // La rue, sous l'abribus, au milieu des portes.
  { level: 'street', lantern: 'street-busstop', unlockedBy: [F.SchoolDone] },
  // Le hall, sous la grande horloge.
  { level: 'station', lantern: 'station-hall-clock', unlockedBy: [F.StationDone] },
  // La veilleuse du compartiment, une fois le train arrivé à quai.
  { level: 'train', lantern: 'train-couchettes-nightlight', unlockedBy: [F.TrainArrived] },
  // La promenade, d'où partent la gare, le centre, la plage et le port.
  { level: 'sea', lantern: 'sea-promenade-balustrade', unlockedBy: [F.SeaStrangeDone, F.SeaEnd] },
];

/**
 * Moments de l'histoire sans voyage, même là où l'on pourrait marcher : loin de la maison, le soir
 * et la nuit, et le dernier niveau jusqu'au dernier plan (la porte de la chambre le termine).
 */
export const TRAVEL_BLOCKED: readonly FlagCondition[] = [
  // Le soir du départ en classe de mer, jusqu'à l'arrivée du train (D-85, D-90).
  { all: [F.TrainBoarding], none: [F.TrainArrived] },
  // Le soir de la fête, la nuit au dortoir, le couloir, chez la nounou, jusqu'au réveil (D-101 à D-119).
  { all: [F.SeaEvening], none: [F.NannyWake] },
  // Le dernier niveau (D-138), jusqu'à ce que Céleste sorte de la chambre (D-144).
  { all: [F.GrownFourth], none: [F.FinaleGone] },
];

/** Réglages du voyage. PROVISOIRES, à régler sur téléphone. */
export const TRAVEL = {
  /** Distance (tuiles) entre Céleste et une lanterne allumée pour partir. */
  reachTiles: 2,
  /** Veilleuses débloquées qu'il faut au moins pour proposer le voyage (Agir à une lanterne). */
  minUnlocked: 2,
  /** La transition (D-163, PR 2) : Céleste s'assoit, le noir, elle est assise près de l'arrivée. */
  sitMs: 450,
  fadeOutMs: 500,
  darkMs: 300,
  fadeInMs: 650,
  /**
   * Lumière bleu lune de la veilleuse principale débloquée (D-179), dans le jeu et sur la carte du
   * sac (le turquoise reste au monde étrange).
   */
  mapColor: '#7fa8ec',
} as const;
