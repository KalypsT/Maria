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
/** Le livre musical (D-115), sur le toit du carrousel d'autrefois (îlot 4). */
export const ISLET_MUSIC_BOOK = { col: 34, row: 7 };
/** Le torchon blanc (D-116), dans le petit lit, tout en haut de la chambre de la sieste. */
export const WHITE_CLOTH = { col: 66, row: 4 };
/** La petite porte de la sieste, dans la maison (sa porte 10). */
export const NAP_DOOR = { col: 63, row: 36 };
/** Les quatre îlots faits : les quatre veilleuses allumées, la porte de la sieste s'ouvre. */
export const ISLETS_DONE = [
  F.NannyBedDone,
  F.NannySchoolDone,
  F.NannyStationDone,
  F.NannySeaDone,
] as const;
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
    // L'îlot 4 (D-115) : sur le toit du carrousel d'autrefois, le livre musical (D-104). On le
    // regarde (il reste là) ; son court souvenir revient. Les deux passages près de lui s'ouvrent,
    // vers la maison et vers le train d'autrefois ; une veilleuse s'allume sur la porte de la
    // sieste.
    id: 'nanny-music-book',
    room: 'nanny-carousel',
    on: 'interact',
    area: { col: ISLET_MUSIC_BOOK.col - 2, row: ISLET_MUSIC_BOOK.row - 2, w: 5, h: 3 },
    mark: { col: ISLET_MUSIC_BOOK.col, row: ISLET_MUSIC_BOOK.row - 3 },
    when: { all: [F.NannyHouse], none: [F.NannySeaDone] },
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: ISLET_MUSIC_BOOK.col - 1, row: ISLET_MUSIC_BOOK.row - 2, w: 3, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'flashback', id: 'music-book', ms: S.flashbackMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'flag', id: F.NannySeaDone },
      { do: 'sparkle', area: { col: 26, row: 3, w: 15, h: 5 }, ms: S.lookMs },
      { do: 'wait', ms: S.lookMs },
    ],
  },
  {
    // Le torchon blanc (D-116) : au bout du chemin le plus dur, dans le petit lit de la sieste. Ce
    // n'est pas un jouet, c'est le réconfort : Céleste le regarde, il reste là (un souvenir du
    // monde étrange, ajouté à la fin de la rubrique) ; son court souvenir : Céleste toute petite le
    // serre contre sa joue, à la sieste. Le monde étrange garde ce qui a compté pour elle.
    id: 'nanny-cloth',
    room: 'nanny-nap',
    on: 'interact',
    area: { col: WHITE_CLOTH.col - 3, row: WHITE_CLOTH.row - 2, w: 7, h: 3 },
    mark: { col: WHITE_CLOTH.col, row: WHITE_CLOTH.row - 3 },
    when: { all: [...ISLETS_DONE], none: [F.NannyClothDone] },
    lock: true,
    steps: [
      { do: 'memory', id: 'white-cloth' },
      {
        do: 'sparkle',
        area: { col: WHITE_CLOTH.col - 1, row: WHITE_CLOTH.row - 2, w: 3, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'flashback', id: 'white-cloth', ms: S.flashbackMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'flag', id: F.NannyClothDone },
      // La suite (le boss, l'effacement) viendra avec la PR 10 : PLACEHOLDER, Céleste pense à Maria.
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
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
  // Le livre musical (D-115), sur le toit du carrousel : il y reste.
  {
    id: 'nanny-music-book',
    room: 'nanny-carousel',
    kind: 'music-book',
    ...ISLET_MUSIC_BOOK,
    when: {},
  },
  // Le torchon blanc (D-116), plié dans le petit lit : il y reste.
  {
    id: 'nanny-white-cloth',
    room: 'nanny-nap',
    kind: 'white-cloth',
    ...WHITE_CLOTH,
    when: {},
  },
  // La veilleuse de l'îlot 4, bleue, une fois le livre musical retrouvé.
  {
    id: 'nap-light-sea',
    room: 'nanny-house',
    kind: 'nap-light-sea',
    ...NAP_LIGHTS[3],
    when: { all: [F.NannySeaDone] },
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

/**
 * Le miroir, avant la bascule : la lumière vacille en approchant ; la porte de la sieste, une fois
 * les quatre veilleuses allumées (D-116).
 */
const OMENS: StoryData['omens'] = [
  {
    room: 'nanny-house',
    when: { all: [...ISLETS_DONE], none: [F.NannyClothDone] },
    col: NAP_DOOR.col,
    row: NAP_DOOR.row - 4,
    radius: 10,
  },
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
  // Ceux de l'îlot 4 (D-115), près du livre musical : vers la maison et vers l'îlot 3.
  { room: 'nanny-carousel', exit: 2, when: { none: [F.NannySeaDone] }, hidden: true },
  { room: 'nanny-house', exit: 9, when: { none: [F.NannySeaDone] }, hidden: true },
  { room: 'nanny-carousel', exit: 3, when: { none: [F.NannySeaDone] }, hidden: true },
  { room: 'nanny-train', exit: 4, when: { none: [F.NannySeaDone] }, hidden: true },
  // La petite porte de la sieste (D-116) : fermée tant qu'une veilleuse est éteinte (un îlot reste).
  ...ISLETS_DONE.map((flag) => ({
    room: 'nanny-house',
    exit: 10,
    when: { none: [flag] },
    icon: 'question' as const,
  })),
];

/** Morceaux de l'histoire de la maison de la nounou, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const NANNY_STORY: Pick<StoryData, 'triggers' | 'props' | 'omens' | 'lockedRooms'> = {
  triggers: TRIGGERS,
  props: PROPS,
  omens: OMENS,
  lockedRooms: LOCKED,
};
