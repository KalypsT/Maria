import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryProp, StoryStep, StoryTrigger } from '../../core/story/story';

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
/** La porte près du cube rose, et celle de la maison où elle mène (le raccourci de l'îlot 1). */
const BED_DOOR = { col: 24, row: 6 };
/**
 * Les quatre cubes de la tour d'Eden (D-122), un au bout de chaque îlot, dans l'ordre de
 * `TOWER_CUBES` : la salle, la tuile où il est posé, le cube (dans l'îlot, puis dans son creux sur
 * la porte de la sieste), et les passages qui s'ouvrent (où ils scintillent). Ils remplacent les
 * objets déjà vus (Roger, la boîte à formes, la cuisine rose, le livre musical) : chaque îlot donne
 * une chose neuve, et le but se voit (la tour d'Eden). Mêmes places, mêmes étapes.
 */
export const ISLET_CUBES = [
  {
    flag: F.NannyBedDone,
    room: 'nanny-garden',
    // En haut de l'arrosoir géant du jardin renversé (D-112).
    at: { col: 20, row: 6 },
    kind: 'islet-cube-bed',
    nap: 'nap-cube-bed',
    slot: { col: 62, row: 29 },
    opens: { col: BED_DOOR.col - 1, row: BED_DOOR.row - 3, w: 3, h: 4 },
  },
  {
    flag: F.NannySchoolDone,
    room: 'nanny-street',
    // Sur l'abribus de la rue d'autrefois (D-113).
    at: { col: 76, row: 19 },
    kind: 'islet-cube-school',
    nap: 'nap-cube-school',
    slot: { col: 63, row: 29 },
    opens: { col: 71, row: 15, w: 10, h: 5 },
  },
  {
    flag: F.NannyStationDone,
    room: 'nanny-train',
    // Sur le toit de la dernière voiture du train d'autrefois (D-114).
    at: { col: 74, row: 8 },
    kind: 'islet-cube-station',
    nap: 'nap-cube-station',
    slot: { col: 64, row: 29 },
    opens: { col: 70, row: 4, w: 9, h: 5 },
  },
  {
    flag: F.NannySeaDone,
    room: 'nanny-carousel',
    // Sur le toit du carrousel d'autrefois (D-115).
    at: { col: 34, row: 7 },
    kind: 'islet-cube-sea',
    nap: 'nap-cube-sea',
    slot: { col: 65, row: 29 },
    opens: { col: 26, row: 3, w: 15, h: 5 },
  },
] as const;
/** Le torchon blanc (D-116), dans le petit lit, tout en haut de la chambre de la sieste. */
export const WHITE_CLOTH = { col: 66, row: 4 };
/** En bas de la cage d'escalier (D-117) : là où Céleste se retrouve après le torchon. */
export const STAIRS_BOTTOM = { col: 4, row: 55 };
/**
 * Les quatre cubes de la salle de jeux (D-117, D-122), pâlis par l'effacement, dans l'ordre où ils
 * se rallument (celui des îlots) : sur le coffre à jouets, sur le perchoir de gauche, au-dessus du
 * gros cube, sur le perchoir de droite. Chacun : son étape, le cube et son reflet pâli, l'endroit
 * où la couleur revient. Touché, il rejoint la tour d'Eden, sur le gros cube.
 */
export const PLAY_OBJECTS = [
  {
    flag: F.NannyPlay1,
    kind: 'islet-cube-bed',
    pale: 'islet-cube-bed-pale',
    at: { col: 62, row: 14 },
    bloom: { col: 63, row: 14 },
  },
  {
    flag: F.NannyPlay2,
    kind: 'islet-cube-school',
    pale: 'islet-cube-school-pale',
    at: { col: 22, row: 9 },
    bloom: { col: 22, row: 14 },
  },
  {
    flag: F.NannyPlay3,
    kind: 'islet-cube-station',
    pale: 'islet-cube-station-pale',
    at: { col: 35, row: 10 },
    bloom: { col: 35, row: 10 },
  },
  {
    flag: F.NannyErasureGone,
    kind: 'islet-cube-sea',
    pale: 'islet-cube-sea-pale',
    at: { col: 47, row: 9 },
    bloom: { col: 47, row: 14 },
  },
] as const;
/** La tour d'Eden dans la salle de jeux : un cube de plus à chaque cube rallumé (D-122). */
const PLAY_TOWER = ['cube-tower-1', 'cube-tower-2', 'cube-tower-3', 'cube-tower-4'] as const;
/** La tour de `k + 1` cubes jusqu'au cube suivant. */
const nextPlay = (k: number): string[] => {
  const next = PLAY_OBJECTS[k + 1];
  return next ? [next.flag] : [];
};
/** L'étape qui rallume chaque objet : le début de la salle de jeux, puis l'objet d'avant. */
const litBy = (k: number): string => (k === 0 ? F.NannyErasure : (PLAY_OBJECTS[k - 1]?.flag ?? ''));

/** Eden (D-118), assis sur le gros cube de la salle de jeux, près de sa tour de cubes. */
export const EDEN_SEAT = { col: 32, row: 14 };
/** La tour d'Eden, sur le gros cube : elle monte à chaque cube rallumé (D-122). */
export const EDEN_TOWER = { col: 37, row: 14 };

/** Au dortoir de la classe de mer, assise sur sa couchette (D-105, D-119). */
const DORM_BUNK = { col: 45, row: 9 };
/** Dans le train du retour, assise près de la fenêtre de la voiture-couchettes (D-85, D-119). */
const TRAIN_SEAT = { col: 13, row: 12 };
/** Chez elle, dans sa chambre (la toise, D-43, D-69). */
const BEDROOM_SEAT = { col: 12, row: 15 };

/**
 * Le réveil, le retour, la phase 4 (D-119), dans le noir après Eden. Au dortoir, à l'aube :
 * Céleste se réveille sur sa couchette, la camarade dort encore, la mer à la fenêtre ; elle serre
 * quelque chose qu'elle n'a pas (un cœur, puis Maria). Le train du retour, une courte scène : la mer
 * qui défile, assise près de la fenêtre. Puis le noir le plus long : quelques mois plus tard, chez
 * elle, elle a encore grandi (phase 4), la toise a un quatrième trait. La suite, le niveau 8 (le
 * monde de Maria), reste un PLACEHOLDER : une bulle « ? ».
 */
const WAKE_AND_RETURN: readonly StoryStep[] = [
  { do: 'flag', id: F.NannyWake },
  { do: 'room', room: 'sea-centre', ...DORM_BUNK, facing: 1, returnPoint: true },
  { do: 'pose', pose: 'sit' },
  { do: 'wait', ms: S.nightBlackMs },
  { do: 'fadeIn', ms: S.nightFadeInMs },
  { do: 'wait', ms: S.lookMs },
  { do: 'thought', icon: 'heart', ms: S.thoughtMs },
  { do: 'wait', ms: S.thoughtMs },
  { do: 'thought', icon: 'maria', ms: S.thoughtMs },
  { do: 'wait', ms: S.thoughtMs + S.lookMs },
  // Le train du retour.
  { do: 'fadeOut', ms: S.nightFadeOutMs },
  { do: 'room', room: 'train-couchettes', ...TRAIN_SEAT, facing: 1 },
  { do: 'pose', pose: 'sit' },
  { do: 'wait', ms: S.blinkBlackMs },
  { do: 'fadeIn', ms: S.nightFadeInMs },
  { do: 'wait', ms: S.holdMs },
  { do: 'thought', icon: 'train', ms: S.thoughtMs },
  { do: 'wait', ms: S.thoughtMs + S.lookMs },
  // Quelques mois plus tard (comme D-43 et D-69) : le noir le plus long ; elle a encore grandi.
  { do: 'fadeOut', ms: S.nightFadeOutMs },
  { do: 'flag', id: F.GrownFourth },
  { do: 'room', room: 'bedroom', ...BEDROOM_SEAT, facing: 1, returnPoint: true },
  { do: 'pose', pose: 'sit' },
  { do: 'wait', ms: S.monthsBlackMs },
  { do: 'fadeIn', ms: S.monthsFadeInMs },
  { do: 'wait', ms: 1400 },
  { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 800 },
  { do: 'wait', ms: S.lookMs },
  // PLACEHOLDER : le niveau 8, le monde de Maria, commencera ici.
  { do: 'thought', icon: 'question', ms: S.thoughtMs + 800 },
  { do: 'wait', ms: S.lookMs },
];

/** La petite porte de la sieste, dans la maison (sa porte 10). */
export const NAP_DOOR = { col: 63, row: 36 };
/** Le temps que la vue glisse jusqu'à la porte de la sieste, ou en revienne (D-122). */
const NAP_LOOK_MS = 2200;
/** Les quatre îlots faits : les quatre cubes trouvés, la porte de la sieste s'ouvre. */
export const ISLETS_DONE = ISLET_CUBES.map((c) => c.flag);
/**
 * Les creux de la porte de la sieste (D-110, D-122), un par îlot, dans l'ordre des îlots : la tuile
 * où chacun est posé (dessiné vide par `napdoor`, rempli par le cube de l'îlot).
 */
export const NAP_SLOTS = ISLET_CUBES.map((c) => c.slot);

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
  ...ISLET_CUBES.map((c): StoryTrigger => ({
    // Au bout de chaque îlot (D-112 à D-115, D-122) : un cube de la tour d'Eden. Céleste le
    // reconnaît (un cœur) et le prend : il rejoint son creux sur la porte de la sieste, et la
    // bulle montre les cubes déjà trouvés (ceux qui restent, en creux). Les passages près de lui
    // s'ouvrent, vers la maison et vers l'îlot voisin.
    id: `nanny-${c.kind}`,
    room: c.room,
    on: 'interact',
    area: { col: c.at.col - 3, row: c.at.row - 2, w: 6, h: 3 },
    mark: { col: c.at.col, row: c.at.row - 3 },
    when: { all: [F.NannyHouse], none: [c.flag] },
    lock: true,
    steps: [
      {
        do: 'sparkle',
        area: { col: c.at.col - 1, row: c.at.row - 2, w: 3, h: 3 },
        ms: S.cradleSparkleMs + 600,
      },
      { do: 'wait', ms: S.cradleSparkleMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'flag', id: c.flag },
      { do: 'thought', icon: 'cubes', ms: S.thoughtMs + 1200 },
      { do: 'wait', ms: S.thoughtMs + 1200 },
      { do: 'sparkle', area: c.opens, ms: S.lookMs },
      { do: 'wait', ms: S.lookMs },
    ],
  })),
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
      // L'effacement (D-117) : la lumière vacille, tout pâlit autour du petit lit ; dans le noir,
      // Céleste est en bas de la cage d'escalier, et quelque chose de gris monte derrière elle.
      { do: 'shake', ms: S.omenPeakMs, strength: 0.8 },
      { do: 'sparkle', area: { col: WHITE_CLOTH.col - 6, row: 1, w: 12, h: 5 }, ms: S.lookMs },
      { do: 'wait', ms: S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs },
      { do: 'flag', id: F.NannyErasure },
      { do: 'room', room: 'nanny-stairs', ...STAIRS_BOTTOM, facing: 1, returnPoint: true },
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.blinkInMs },
      { do: 'thought', icon: 'question', ms: S.thoughtMs },
    ],
  },
  ...PLAY_OBJECTS.map((o, k): StoryTrigger => ({
    // La salle de jeux (D-117, D-122) : le cube rallumé ; Céleste l'atteint et fait Agir, il
    // rejoint la tour d'Eden. La couleur revient à une partie de la salle ; l'effacement recule (ses vagues repartent), puis
    // accélère (`; @erase-speed:`). Au quatrième, il se dissout (`; @erase-until:`).
    id: `nanny-play-${String(k + 1)}`,
    room: 'nanny-playroom',
    on: 'interact',
    area: { col: o.at.col - 2, row: o.at.row - 2, w: 5, h: 3 },
    mark: { col: o.at.col, row: o.at.row - 3 },
    when: { all: [F.NannyErasure, litBy(k)], none: [o.flag] },
    lock: true,
    steps: [
      { do: 'sparkle', area: { col: o.at.col - 1, row: o.at.row - 2, w: 3, h: 3 }, ms: S.lookMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'flag', id: o.flag },
      // Le cube rejoint la tour d'Eden, sur le gros cube (D-122).
      {
        do: 'sparkle',
        area: { col: EDEN_TOWER.col - 1, row: EDEN_TOWER.row - 3, w: 3, h: 4 },
        ms: S.lookMs,
      },
      ...(k === PLAY_OBJECTS.length - 1
        ? ([
            { do: 'shake', ms: S.omenPeakMs, strength: 0.6 },
            { do: 'sparkle', area: { col: 12, row: 7, w: 46, h: 16 }, ms: S.cradleSparkleMs },
            { do: 'wait', ms: S.cradleSparkleMs },
          ] as const)
        : ([{ do: 'wait', ms: S.thoughtMs }] as const)),
    ],
  })),
  {
    // Eden (D-118) : dans la salle de jeux rendue à ses couleurs, un petit garçon assis près d'une
    // tour de cubes. Céleste le reconnaît (un cœur). Dans le noir, le souvenir jouable : la tour à
    // deux, le cache-cache, la nounou qui regarde ; à la fin, Céleste seule. Quand la lumière
    // revient, Eden n'est plus là (il ne bouge jamais à l'écran). Le monde étrange garde aussi les
    // relations, pas seulement les objets.
    id: 'nanny-eden',
    room: 'nanny-playroom',
    on: 'interact',
    area: { col: EDEN_SEAT.col - 2, row: EDEN_SEAT.row - 2, w: 6, h: 3 },
    mark: { col: EDEN_SEAT.col, row: EDEN_SEAT.row - 3 },
    when: { all: [F.NannyErasureGone], none: [F.NannyEden] },
    lock: true,
    steps: [
      { do: 'memory', id: 'eden-tower' },
      { do: 'wait', ms: S.lookMs },
      { do: 'thought', icon: 'heart', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs + S.lookMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
      { do: 'play', id: 'eden' },
      { do: 'flag', id: F.NannyEden },
      { do: 'wait', ms: S.blinkBlackMs },
      { do: 'fadeIn', ms: S.nightFadeInMs, shape: 'iris' },
      { do: 'wait', ms: S.lookMs },
      // La fin du niveau (D-119) : le cercle se referme sur la salle de jeux, Eden n'est plus là.
      { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      { do: 'wait', ms: S.thoughtMs },
      { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
      ...WAKE_AND_RETURN,
    ],
  },
  {
    // Dans la maison (D-110) : tout est immense. Céleste regarde ; le reflet n'est plus là. La vue
    // glisse jusqu'à la petite porte de la sieste et ses quatre creux en forme de cube, qui
    // scintillent, puis revient : la bulle montre les quatre cubes à trouver (D-122).
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
      { do: 'look', col: NAP_DOOR.col, row: NAP_DOOR.row - 5 },
      { do: 'wait', ms: NAP_LOOK_MS },
      {
        do: 'sparkle',
        area: { col: NAP_DOOR.col - 1, row: NAP_DOOR.row - 8, w: 4, h: 2 },
        ms: 1800,
      },
      { do: 'wait', ms: 2000 },
      { do: 'look' },
      { do: 'wait', ms: NAP_LOOK_MS },
      { do: 'thought', icon: 'cubes', ms: S.thoughtMs + 1200 },
      { do: 'wait', ms: S.thoughtMs + 1200 },
    ],
  },
];

const PROPS: StoryData['props'] = [
  // Les cubes de la tour d'Eden (D-122) : au bout de l'îlot tant qu'il n'est pas pris, puis dans
  // son creux, sur la porte de la sieste.
  ...ISLET_CUBES.flatMap((c): StoryProp[] => [
    {
      id: `nanny-${c.kind}`,
      room: c.room,
      kind: c.kind,
      ...c.at,
      when: { none: [c.flag] },
      instant: true,
    },
    {
      id: c.nap,
      room: 'nanny-house',
      kind: c.nap,
      ...c.slot,
      when: { all: [c.flag] },
    },
  ]),
  // Le torchon blanc (D-116), plié dans le petit lit : il y reste.
  {
    id: 'nanny-white-cloth',
    room: 'nanny-nap',
    kind: 'white-cloth',
    ...WHITE_CLOTH,
    when: {},
  },
  // La salle de jeux (D-117, D-122) : chaque cube pâli tant qu'il n'est pas rallumé, en couleur
  // ensuite ; touché, il rejoint la tour d'Eden sur le gros cube, qui monte d'un cube. La couleur
  // revient à une partie de la salle ; l'effacement au centre, jusqu'à sa dissolution.
  ...PLAY_OBJECTS.flatMap((o, k): StoryProp[] => [
    {
      id: `play-${o.kind}-pale`,
      room: 'nanny-playroom',
      kind: o.pale,
      ...o.at,
      when: { none: [litBy(k)] },
    },
    {
      id: `play-${o.kind}`,
      room: 'nanny-playroom',
      kind: o.kind,
      ...o.at,
      when: { all: [litBy(k)], none: [o.flag] },
      instant: true,
    },
    {
      id: `play-tower-${String(k + 1)}`,
      room: 'nanny-playroom',
      kind: PLAY_TOWER[k] ?? 'cube-tower-4',
      ...EDEN_TOWER,
      when: { all: [o.flag], none: nextPlay(k) },
      instant: true,
    },
    {
      id: `play-bloom-${String(k + 1)}`,
      room: 'nanny-playroom',
      kind: 'color-bloom',
      ...o.bloom,
      when: { all: [o.flag] },
    },
  ]),
  {
    id: 'play-erasure',
    room: 'nanny-playroom',
    kind: 'erasure-figure',
    col: 49,
    row: 20,
    when: { none: [F.NannyErasureGone] },
  },
  // Eden (D-118), dans la salle de jeux rendue à ses couleurs, près de sa tour de cubes (la tour
  // reste après lui).
  {
    id: 'nanny-eden',
    room: 'nanny-playroom',
    kind: 'eden-small',
    ...EDEN_SEAT,
    when: { all: [F.NannyErasureGone], none: [F.NannyEden] },
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
  // La porte de la salle de jeux (D-117) : fermée tant que l'effacement n'est pas dissous ; celle de
  // la maison où elle mène n'existe pas encore.
  { room: 'nanny-playroom', exit: 2, when: { none: [F.NannyErasureGone] }, icon: 'question' },
  { room: 'nanny-house', exit: 11, when: { none: [F.NannyErasureGone] }, hidden: true },
  // La petite porte de la sieste (D-116) : fermée tant qu'une veilleuse est éteinte (un îlot reste).
  ...ISLETS_DONE.map((flag) => ({
    room: 'nanny-house',
    exit: 10,
    when: { none: [flag] },
    icon: 'question' as const,
  })),
];

/** Le réveil (D-119) : le jour revient, de l'aube au niveau 8. */
const TIMES: StoryData['times'] = [{ when: { all: [F.NannyWake] }, time: 'morning' }];

/** Le train du retour (D-119) : il roule, le temps de la scène. */
const MOVING: NonNullable<StoryData['moving']> = [
  { room: 'train-couchettes', when: { all: [F.NannyWake], none: [F.GrownFourth] } },
];

/** Morceaux de l'histoire de la maison de la nounou, ajoutés à ceux de la maison (`HOUSE_STORY`). */
export const NANNY_STORY: Pick<
  StoryData,
  'triggers' | 'props' | 'omens' | 'lockedRooms' | 'times'
> & {
  readonly moving: NonNullable<StoryData['moving']>;
} = {
  triggers: TRIGGERS,
  props: PROPS,
  omens: OMENS,
  lockedRooms: LOCKED,
  times: TIMES,
  moving: MOVING,
};
