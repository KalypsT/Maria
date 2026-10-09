import type { PasserbyReaction, PasserbySpot, PasserbyTuning } from '../core/world/passersby';
import type { PasserbyKind } from '../core/story/story';

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
];

/** Comment chacun réagit quand Céleste passe tout près (rien : il ne réagit pas). */
export const PASSERBY_REACTIONS: Readonly<Partial<Record<PasserbyKind, PasserbyReaction>>> = {
  'busstop-man': { pose: 'busstop-man-look', bubble: 'heart' },
  'dog-walker': { bubble: 'heart' },
  'neighbor-window': { pose: 'neighbor-wave', bubble: 'heart', column: true },
  cashier: { bubble: 'heart' },
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
 * Passants dessinés dans un cadre plus grand que leur taille (`PROP_SIZE`) : la voisine, dans sa
 * fenêtre ouverte (l'embrasure, le rebord fleuri). `inner` : où est posé son buste dans le cadre.
 */
export const PASSERBY_FRAMES: Readonly<
  Partial<
    Record<
      PasserbyKind,
      { readonly w: number; readonly h: number; readonly inner: { x: number; y: number } }
    >
  >
> = {
  'neighbor-window': { w: 40, h: 44, inner: { x: 5, y: 6 } },
  'neighbor-wave': { w: 40, h: 44, inner: { x: 5, y: 6 } },
};

/** Passants assis sur un tabouret dessiné sous eux (la caissière). */
export const PASSERBY_STOOLS: ReadonlySet<PasserbyKind> = new Set<PasserbyKind>(['cashier']);

/** Devant le décor et la lumière, derrière les personnages de l'histoire (5) et Céleste. */
export const PASSERBY_DEPTH = 4.9;
