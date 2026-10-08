import { StoryFlag as F } from '../src/config/story';

/** L'histoire jusqu'à la fin du niveau 7 (D-119) : quelques mois plus tard, la phase 4. */
export const PHASE4: readonly string[] = [
  F.EveningPlayed,
  F.EveningBlanket,
  F.EveningTucked,
  F.EveningGoodnight,
  F.Slept,
  F.SlipperTaken,
  F.BottleTaken,
  F.MariaSeen,
  F.MariaVanished,
  F.StrangeDone,
  F.HeadbandTaken,
  F.DadVisit,
  F.MomHug,
  F.Grown,
  F.HedgeDone,
  F.BonnetTaken,
  F.GateOpen,
  F.SchoolDone,
  F.StreetMorning,
  F.StationDone,
  F.GrownOlder,
  F.TrainArrived,
  F.SeaEnd,
  F.NannyEden,
  F.NannyWake,
  F.GrownFourth,
];

/** Le dernier soir (D-139), jusqu'à la nuit : le berceau vide s'éclaire. */
export const NIGHT: readonly string[] = [
  ...PHASE4,
  F.FinaleRug,
  F.FinaleCradle,
  F.FinaleGoodnight,
  F.FinaleNight,
];

/** Le monde de Maria parcouru (D-141, D-142) : jusqu'au ciel de la chambre. */
export const SKY: readonly string[] = [...NIGHT, F.FinaleEntered, F.FinaleMusicBox, F.FinaleSky];
