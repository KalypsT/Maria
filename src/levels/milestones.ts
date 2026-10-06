import { Ability } from '../config/abilities';
import { StoryFlag as F } from '../config/story';
import type { Milestone } from '../core/hint/hint';

/**
 * Le chemin principal (D-129), pour le fil discret : les jalons dans l'ordre de l'histoire. Le fil
 * mène au premier disponible (un déclencheur se désactive lui-même une fois vécu). Seulement le
 * chemin principal : jamais une trouvaille, un disque, une affaire de Maria ni un objet à regarder.
 * Les parents qui montrent la suite (D-50, D-55, D-60, D-63) en font partie : ce sont déjà des
 * indices. Un nouveau niveau ajoute ses jalons ici (vérifié par les tests).
 */
export const MILESTONES: readonly Milestone[] = [
  // La maison, le soir (D-31).
  { trigger: 'evening-play' },
  { trigger: 'evening-blanket' },
  { trigger: 'evening-tuck' },
  { trigger: 'evening-sleep' },
  // Le matin : les traces, grimper, Maria en haut de la bibliothèque (D-31, D-32, D-34).
  { trigger: 'take-slipper', group: 'traces' },
  { trigger: 'take-bottle', group: 'traces' },
  { ability: Ability.Climb, after: { all: [F.Slept] } },
  { trigger: 'living-vanish' },
  { trigger: 'shadows-cradle' },
  { trigger: 'mom-hug' },
  { trigger: 'months-later' },
  // Le jardin (D-46 à D-60).
  { trigger: 'garden-arrive' },
  { trigger: 'garden-dad' },
  { trigger: 'treehouse-find' },
  { ability: Ability.WallJump, after: { all: [F.Grown] } },
  { trigger: 'garden-dad-hedge' },
  { trigger: 'hedge-enter' },
  { trigger: 'thorns-bonnet' },
  { trigger: 'garden-dad-gate' },
  { trigger: 'gate-cord' },
  // Le quartier (D-61 à D-64).
  { trigger: 'street-mom' },
  { trigger: 'street-dad' },
  { ability: Ability.Umbrella, after: { all: [F.GateOpen] } },
  { trigger: 'school-door' },
  { trigger: 'school-enter' },
  { trigger: 'school-box' },
  { trigger: 'street-night' },
  { trigger: 'street-mom-crane' },
  // La gare (D-65 à D-69).
  { trigger: 'station-arrived' },
  { ability: Ability.Hook, after: { all: [F.StationArrived] } },
  { trigger: 'station-enter' },
  { trigger: 'station-roger' },
  { trigger: 'station-months' },
  { trigger: 'station-train' },
  { trigger: 'train-board' },
  // Le train (D-83 à D-91).
  { trigger: 'train-classmate' },
  { trigger: 'train-bedtime' },
  { trigger: 'train-strange-enter' },
  { trigger: 'train-pink-kitchen' },
  { trigger: 'train-morning' },
  // La station balnéaire (D-95 à D-105).
  { trigger: 'sea-arrival' },
  { trigger: 'sea-tide-rises' },
  { trigger: 'sea-carousel-seen' },
  { trigger: 'sea-evening' },
  { trigger: 'sea-strange-enter' },
  { trigger: 'sea-music-book' },
  { trigger: 'sea-end-door' },
  // La maison de la nounou (D-107 à D-119) : les quatre îlots dans n'importe quel ordre.
  { trigger: 'nanny-mirror' },
  { trigger: 'nanny-house' },
  { trigger: 'nanny-islet-cube-bed', group: 'islets' },
  { trigger: 'nanny-islet-cube-school', group: 'islets' },
  { trigger: 'nanny-islet-cube-station', group: 'islets' },
  { trigger: 'nanny-islet-cube-sea', group: 'islets' },
  { trigger: 'nanny-cloth' },
  { trigger: 'nanny-play-1' },
  { trigger: 'nanny-play-2' },
  { trigger: 'nanny-play-3' },
  { trigger: 'nanny-play-4' },
  { trigger: 'nanny-eden' },
];
