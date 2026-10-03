import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryStep, StoryTrigger } from '../../core/story/story';

/**
 * Histoire de l'avant-dernier niveau (D-107, D-110), la maison de la nounou, PLACEHOLDER, réunie à
 * celle de la maison (une seule zone). La même nuit que la fin de la station balnéaire : derrière la
 * porte du couloir en boucle, l'entrée de la maison de la nounou, démesurée. Le miroir : le reflet
 * de Céleste toute petite passe de l'autre côté ; Céleste l'imite (la bascule). Ni Maria (sauf en
 * pensée) ni parents à l'écran. Les personnages ne bougent jamais à l'écran : ils changent de place
 * dans le noir.
 */

/** Arrivée dans l'entrée, devant la porte du couloir (elle n'y mène plus). */
export const NANNY_ARRIVAL = { col: 7, row: 22 };
/** Le grand miroir de l'entrée : sa vitre (colonnes 49-50) n'existe que dans le présent. */
export const MIRROR = { col: 49, row: 22 };
/** Devant le miroir : on s'en approche, le reflet change. */
const MIRROR_FRONT = { col: 43, row: 20, w: 6, h: 3 };
/** Arrivée dans la maison, par l'entrée : on regarde autour de soi, une fois. */
const HOUSE_ARRIVAL = { col: 1, row: 34, w: 6, h: 3 };

/** La porte du couloir mène dans l'entrée de la nounou, dans le noir (D-110). */
export const NANNY_ENTER: readonly StoryStep[] = [
  { do: 'room', room: 'nanny-entry', ...NANNY_ARRIVAL, facing: 1, returnPoint: true },
  { do: 'flag', id: F.NannyArrived },
  { do: 'wait', ms: S.nightBlackMs },
  { do: 'fadeIn', ms: S.nightFadeInMs, shape: 'iris' },
  { do: 'wait', ms: S.lookMs },
  // Le début d'un niveau (D-70) : Céleste pense à Maria.
  { do: 'thought', icon: 'maria', ms: S.thoughtMs },
  { do: 'wait', ms: S.thoughtMs },
];

const TRIGGERS: StoryTrigger[] = [
  {
    // Le miroir (D-107, D-110) : dans la vitre, ce n'est pas Céleste, c'est elle toute petite. Elle
    // sourit ; dans le noir d'un clignement, elle est passée de l'autre côté du miroir (on ne la
    // voit jamais bouger) ; elle montre comment. Céleste l'imite : la bascule. Ça répond à la
    // camarade du train, qui lui a appris la glissade (D-85).
    id: 'nanny-mirror',
    room: 'nanny-entry',
    on: 'touch',
    area: MIRROR_FRONT,
    when: { all: [F.NannyArrived], none: [F.NannyMirror] },
    lock: true,
    steps: [
      { do: 'sparkle', area: { col: MIRROR.col - 1, row: MIRROR.row - 6, w: 4, h: 6 }, ms: 1600 },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'nanny-reflection' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'fadeOut', ms: S.blinkOutMs },
      { do: 'flag', id: F.NannyMirror },
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.blinkInMs },
      { do: 'wait', ms: 600 },
      { do: 'thought', icon: 'shift', ms: S.thoughtMs + 800, by: 'nanny-reflection-through' },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'ability', id: 'shift' },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Dans la maison (D-110) : tout est immense. Céleste regarde ; le reflet n'est plus là.
    id: 'nanny-house',
    room: 'nanny-house',
    on: 'touch',
    area: HOUSE_ARRIVAL,
    when: { all: [F.NannyMirror], none: [F.NannyHouse] },
    lock: true,
    steps: [
      { do: 'flag', id: F.NannyHouse },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
    ],
  },
];

const PROPS: StoryData['props'] = [
  // Le reflet (D-110) : Céleste toute petite dans la vitre du miroir, puis de l'autre côté.
  {
    id: 'nanny-reflection',
    room: 'nanny-entry',
    kind: 'reflection',
    // Contre la vitre, du côté de Céleste (la vitre elle-même est pleine dans le présent).
    col: MIRROR.col - 1,
    row: MIRROR.row,
    flip: true,
    when: { all: [F.NannyArrived], none: [F.NannyMirror] },
  },
  {
    id: 'nanny-reflection-through',
    room: 'nanny-entry',
    kind: 'reflection-through',
    col: MIRROR.col + 5,
    row: MIRROR.row,
    flip: true,
    when: { all: [F.NannyMirror], none: [F.NannyHouse] },
  },
];

/** Le miroir, avant la bascule : la lumière vacille en approchant. */
const OMENS: StoryData['omens'] = [
  {
    room: 'nanny-entry',
    when: { all: [F.NannyArrived], none: [F.NannyMirror] },
    col: MIRROR.col,
    row: MIRROR.row,
    radius: 12,
  },
];

/** Morceaux de l'histoire de la maison de la nounou, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const NANNY_STORY: Pick<StoryData, 'triggers' | 'props' | 'omens'> = {
  triggers: TRIGGERS,
  props: PROPS,
  omens: OMENS,
};
