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
/** Roger (D-112), en haut de l'arrosoir géant du jardin renversé (îlot 1). */
export const ISLET_ROGER = { col: 20, row: 6 };
/** La porte près de Roger, et celle de la maison où elle mène (le raccourci de l'îlot 1). */
const BED_DOOR = { col: 24, row: 6 };
/** La boîte à formes (D-113), sur l'abribus de la rue d'autrefois (îlot 2). */
export const ISLET_SHAPE_BOX = { col: 76, row: 19 };
/** La cuisine rose (D-114), sur le toit de la dernière voiture du train d'autrefois (îlot 3). */
export const ISLET_PINK_KITCHEN = { col: 74, row: 8 };
/**
 * Les veilleuses de la porte de la sieste (D-107, D-110), une par îlot, dans l'ordre des îlots :
 * la tuile où chacune est posée (dessinée par `napdoor`, allumée par l'objet de l'îlot).
 */
export const NAP_LIGHTS = [
  { col: 62, row: 29 },
  { col: 63, row: 29 },
  { col: 64, row: 29 },
  { col: 65, row: 29 },
] as const;

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
    // L'îlot 1 (D-112) : en haut de l'arrosoir géant du jardin renversé, Roger, qu'on avait
    // laissé dans la tour des objets perdus (D-68). On le regarde, on ne le prend pas (il n'est plus
    // un souvenir à trouver) ; son court souvenir revient. Le passage près de lui s'ouvre vers la
    // maison, et une veilleuse s'allume sur la porte de la sieste.
    id: 'nanny-roger',
    room: 'nanny-garden',
    on: 'interact',
    area: { col: ISLET_ROGER.col - 3, row: ISLET_ROGER.row - 2, w: 6, h: 3 },
    mark: { col: ISLET_ROGER.col, row: ISLET_ROGER.row - 2 },
    when: { all: [F.NannyHouse], none: [F.NannyBedDone] },
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: ISLET_ROGER.col - 1, row: ISLET_ROGER.row - 2, w: 3, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'flashback', id: 'roger', ms: S.flashbackMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'flag', id: F.NannyBedDone },
      {
        do: 'sparkle',
        area: { col: BED_DOOR.col - 1, row: BED_DOOR.row - 3, w: 3, h: 4 },
        ms: S.lookMs,
      },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // L'îlot 2 (D-113) : sur l'abribus de la rue d'autrefois, la boîte à formes (D-64). On la
    // regarde (elle n'a pas de court souvenir : un cœur). Les deux passages près d'elle s'ouvrent,
    // vers la maison et vers la chambre d'autrefois ; une veilleuse s'allume sur la porte de la
    // sieste.
    id: 'nanny-shape-box',
    room: 'nanny-street',
    on: 'interact',
    area: { col: ISLET_SHAPE_BOX.col - 2, row: ISLET_SHAPE_BOX.row - 2, w: 5, h: 3 },
    mark: { col: ISLET_SHAPE_BOX.col, row: ISLET_SHAPE_BOX.row - 3 },
    when: { all: [F.NannyHouse], none: [F.NannySchoolDone] },
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: ISLET_SHAPE_BOX.col - 1, row: ISLET_SHAPE_BOX.row - 2, w: 3, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'flag', id: F.NannySchoolDone },
      { do: 'sparkle', area: { col: 71, row: 15, w: 10, h: 5 }, ms: S.lookMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // L'îlot 3 (D-114) : sur le toit de la dernière voiture du train d'autrefois, la cuisine rose
    // (D-88). On la regarde (son souvenir jouable est trop long au milieu d'un îlot, D-107 : un
    // cœur). Les deux passages près d'elle s'ouvrent, vers la maison et vers la rue d'autrefois ;
    // une veilleuse s'allume sur la porte de la sieste.
    id: 'nanny-pink-kitchen',
    room: 'nanny-train',
    on: 'interact',
    area: { col: ISLET_PINK_KITCHEN.col - 2, row: ISLET_PINK_KITCHEN.row - 2, w: 5, h: 3 },
    mark: { col: ISLET_PINK_KITCHEN.col, row: ISLET_PINK_KITCHEN.row - 3 },
    when: { all: [F.NannyHouse], none: [F.NannyStationDone] },
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: ISLET_PINK_KITCHEN.col - 1, row: ISLET_PINK_KITCHEN.row - 2, w: 3, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'flag', id: F.NannyStationDone },
      { do: 'sparkle', area: { col: 70, row: 4, w: 9, h: 5 }, ms: S.lookMs },
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
  // Roger (D-112), en haut de l'arrosoir : il y reste, même après son souvenir.
  { id: 'nanny-roger', room: 'nanny-garden', kind: 'roger', ...ISLET_ROGER, when: {} },
  // La veilleuse de l'îlot 1 sur la porte de la sieste, rose, une fois Roger retrouvé.
  {
    id: 'nap-light-bed',
    room: 'nanny-house',
    kind: 'nap-light-bed',
    ...NAP_LIGHTS[0],
    when: { all: [F.NannyBedDone] },
  },
  // La boîte à formes (D-113), sur l'abribus : elle y reste.
  {
    id: 'nanny-shape-box',
    room: 'nanny-street',
    kind: 'shape-box',
    ...ISLET_SHAPE_BOX,
    when: {},
  },
  // La veilleuse de l'îlot 2, jaune, une fois la boîte à formes retrouvée.
  {
    id: 'nap-light-school',
    room: 'nanny-house',
    kind: 'nap-light-school',
    ...NAP_LIGHTS[1],
    when: { all: [F.NannySchoolDone] },
  },
  // La cuisine rose (D-114), sur le toit du train : elle y reste.
  {
    id: 'nanny-pink-kitchen',
    room: 'nanny-train',
    kind: 'pink-kitchen',
    ...ISLET_PINK_KITCHEN,
    when: {},
  },
  // La veilleuse de l'îlot 3, turquoise, une fois la cuisine rose retrouvée.
  {
    id: 'nap-light-station',
    room: 'nanny-house',
    kind: 'nap-light-station',
    ...NAP_LIGHTS[2],
    when: { all: [F.NannyStationDone] },
  },
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

/**
 * Les raccourcis des îlots (D-112, D-113) : les portes près de l'objet d'un îlot et celles où elles
 * mènent n'existent qu'une fois l'objet retrouvé (avant, rien ne les montre : on ne coupe pas
 * l'îlot).
 */
const LOCKED: StoryData['lockedRooms'] = [
  { room: 'nanny-garden', exit: 2, when: { none: [F.NannyBedDone] }, hidden: true },
  { room: 'nanny-house', exit: 3, when: { none: [F.NannyBedDone] }, hidden: true },
  // Ceux de l'îlot 2 (D-113), près de la boîte à formes : vers la maison et vers l'îlot 1.
  { room: 'nanny-street', exit: 2, when: { none: [F.NannySchoolDone] }, hidden: true },
  { room: 'nanny-house', exit: 4, when: { none: [F.NannySchoolDone] }, hidden: true },
  { room: 'nanny-street', exit: 3, when: { none: [F.NannySchoolDone] }, hidden: true },
  { room: 'nanny-bed', exit: 3, when: { none: [F.NannySchoolDone] }, hidden: true },
  // Ceux de l'îlot 3 (D-114), près de la cuisine rose : vers la maison et vers l'îlot 2.
  { room: 'nanny-train', exit: 2, when: { none: [F.NannyStationDone] }, hidden: true },
  { room: 'nanny-house', exit: 7, when: { none: [F.NannyStationDone] }, hidden: true },
  { room: 'nanny-train', exit: 3, when: { none: [F.NannyStationDone] }, hidden: true },
  { room: 'nanny-street', exit: 4, when: { none: [F.NannyStationDone] }, hidden: true },
];

/** Morceaux de l'histoire de la maison de la nounou, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const NANNY_STORY: Pick<StoryData, 'triggers' | 'props' | 'omens' | 'lockedRooms'> = {
  triggers: TRIGGERS,
  props: PROPS,
  omens: OMENS,
  lockedRooms: LOCKED,
};
