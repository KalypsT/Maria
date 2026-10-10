import type { PasserbyReaction, PasserbySpot, PasserbyTuning } from '../core/world/passersby';
import type { PasserbyKind } from '../core/story/story';
import { StoryFlag as F } from './story';

/**
 * Les passants et les animaux (D-155), salle par salle. Règles : jamais près d'un passage où
 * Céleste grimpe dangereusement (le chantier reste vide), ni sur une coquille, une lanterne ou une
 * porte (vérifié par `tests/passersby.test.ts`) ; personne dans les mondes étranges. Dans la rue,
 * `evening` est le crépuscule puis la nuit : seuls la voisine (sa fenêtre allumée) et le chat y
 * restent.
 */
export const PASSERSBY: readonly PasserbySpot[] = [
  // La rue (D-60) : la voisine au-dessus de la voiture garée, le monsieur sous l'abribus (la
  // lanterne à côté de lui), le chat roux sur son rebord au-dessus de l'abribus, la dame au petit
  // chien devant l'école.
  // Sa fenêtre ouverte recouvre une fenêtre dessinée de la façade (maison jaune, en bas à droite).
  { id: 'street-neighbor', room: 'street', kind: 'neighbor-window', col: 29, row: 23, dy: 5 },
  {
    id: 'street-busstop',
    room: 'street',
    kind: 'busstop-man',
    col: 70,
    row: 27,
    times: ['morning'],
  },
  { id: 'street-cat', room: 'street', kind: 'ginger-cat-sit', col: 69, row: 14, dy: -3 },
  {
    id: 'street-dog-walker',
    room: 'street',
    kind: 'dog-walker',
    col: 107,
    row: 27,
    flip: true,
    times: ['morning'],
  },
  // La supérette (D-63) : la caissière sur son tabouret, au bout du comptoir, tournée vers l'entrée.
  {
    id: 'shop-cashier',
    room: 'shop',
    kind: 'cashier',
    col: 15,
    row: 18,
    flip: true,
    times: ['morning'],
  },
  // La rue d'autrefois (D-113), dans la maison de la nounou : la voisine pâlie, à une fenêtre allumée
  // sous le toit d'où part Céleste ; un écho de la rue.
  {
    id: 'nanny-street-neighbor',
    room: 'nanny-street',
    kind: 'neighbor-window',
    col: 6,
    row: 12,
    alpha: 0.55,
    memory: true,
  },
  // Le hall de la gare (D-66), le jour : le voyageur sous le tableau des départs, la voyageuse sur
  // sa valise, après le banc de droite.
  {
    id: 'hall-board',
    room: 'station-hall',
    kind: 'traveler-board',
    col: 24,
    row: 37,
    times: ['morning'],
  },
  {
    id: 'hall-suitcase',
    room: 'station-hall',
    kind: 'traveler-suitcase',
    col: 65,
    row: 37,
    times: ['morning'],
  },
  // La promenade (D-98), le jour : le vieux couple sur son banc, entre deux bacs à fleurs.
  {
    id: 'promenade-couple',
    room: 'sea-promenade',
    kind: 'old-couple',
    col: 144,
    row: 23,
    // L'assise du banc, 23 px au-dessus de la promenade (leurs jambes jusqu'au sol).
    dy: -7,
    times: ['morning'],
  },
  // Le port (D-100) : le pêcheur au bord du quai, au-dessus de l'échelle ; à marée haute seulement
  // (à marée basse, la vase).
  {
    id: 'port-fisherman',
    room: 'sea-port',
    kind: 'fisherman',
    col: 130,
    row: 17,
    times: ['morning'],
    when: { all: [F.TideHigh] },
  },
  // La jetée (D-101), le soir de la fête : le forain derrière son chariot, entre les deux stands.
  {
    id: 'jetty-candyfloss',
    room: 'sea-jetty',
    kind: 'candyfloss-vendor',
    col: 181,
    row: 15,
    when: { all: [F.SeaEvening], none: [F.SeaStrangeDone] },
  },
];

/** Comment chacun réagit quand Céleste passe tout près (rien : il ne réagit pas). */
export const PASSERBY_REACTIONS: Readonly<Partial<Record<PasserbyKind, PasserbyReaction>>> = {
  'busstop-man': { pose: 'busstop-man-look', bubble: 'heart' },
  'dog-walker': { bubble: 'heart' },
  'neighbor-window': { pose: 'neighbor-wave', bubble: 'heart', column: true },
  cashier: { bubble: 'heart' },
  'traveler-suitcase': { pose: 'traveler-wave', bubble: 'heart' },
  'old-couple': { bubble: 'heart' },
  fisherman: { pose: 'fisherman-nod', bubble: 'heart' },
  'candyfloss-vendor': { bubble: 'heart' },
  // Le chat, haut sur son rebord : il file dès que Céleste monte sur le toit de l'abribus, pas
  // quand elle passe sur le trottoir.
  'ginger-cat-sit': { pose: 'ginger-cat-leap', flee: true, nearPx: 128 },
};

/**
 * Réglages (D-155), PROVISOIRES, à régler sur téléphone. Distances depuis le centre de Céleste
 * jusqu'au passant (px logiques).
 */
export const PASSERBY_TUNING: PasserbyTuning & {
  readonly bubbleMs: number;
  readonly flee: { readonly dxPx: number; readonly hopPx: number };
} = {
  nearPx: 30,
  farPx: 60,
  fadeMs: 220,
  fleeMs: 650,
  bubbleMs: 1800,
  /** Le bond du chat : vers le côté opposé à Céleste, en arc, en s'effaçant. */
  flee: { dxPx: 56, hopPx: 18 },
};

/**
 * Passants dessinés dans un cadre plus grand que leur taille (`PROP_SIZE`), avec ce qui les entoure :
 * la voisine dans sa fenêtre ouverte (l'embrasure, le rebord fleuri) ; le forain derrière son
 * chariot (l'auvent rayé, le comptoir). `inner` : où est posé le buste dans le cadre.
 */
export const PASSERBY_FRAMES: Readonly<
  Partial<
    Record<
      PasserbyKind,
      {
        readonly style: 'window' | 'cart';
        readonly w: number;
        readonly h: number;
        readonly inner: { x: number; y: number };
      }
    >
  >
> = {
  'neighbor-window': { style: 'window', w: 40, h: 44, inner: { x: 5, y: 6 } },
  'neighbor-wave': { style: 'window', w: 40, h: 44, inner: { x: 5, y: 6 } },
  'candyfloss-vendor': { style: 'cart', w: 64, h: 88, inner: { x: 8, y: 12 } },
};

/**
 * Le fil de pêche (D-155) : il pend du bout de la canne (`tip`, fraction de l'image) jusqu'à
 * `below` px sous l'assise (la mer à marée haute, sous le bord du quai).
 */
export const PASSERBY_LINES: Readonly<
  Partial<Record<PasserbyKind, { readonly tip: { x: number; y: number }; readonly below: number }>>
> = {
  fisherman: { tip: { x: 0.007, y: 0.001 }, below: 66 },
  'fisherman-nod': { tip: { x: 0.007, y: 0.001 }, below: 66 },
};

/**
 * Passants assis sur un siège dessiné sous eux, jusqu'au sol : la caissière sur son tabouret, le
 * vieux couple sur son banc (le leur, à part du banc des marées).
 */
export const PASSERBY_SEATS: Readonly<Partial<Record<PasserbyKind, 'stool' | 'bench'>>> = {
  cashier: 'stool',
  'old-couple': 'bench',
};

/** Devant le décor et la lumière, derrière les personnages de l'histoire (5) et Céleste. */
export const PASSERBY_DEPTH = 4.9;
