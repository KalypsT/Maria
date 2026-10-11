/**
 * Le sac à dos de Céleste (D-159) : le menu du jeu, qui réunit le cahier (la carte, Mon voyage,
 * Mes capacités), les trésors et les réglages (l'ancienne pause). Pur : les onglets, leurs pages,
 * et la page sur laquelle il s'ouvre.
 */

/** Les trois objets de la poche du sac. */
export type BackpackTab = 'notebook' | 'treasures' | 'settings';

/** Une page du sac. */
export type BackpackPage = 'map' | 'journey' | 'abilities' | 'treasures' | 'settings';

export const BACKPACK_TABS: readonly BackpackTab[] = ['notebook', 'treasures', 'settings'];

/** Les pages de chaque onglet, dans l'ordre des sous-onglets ; la première s'ouvre d'abord. */
export const BACKPACK_PAGES: Readonly<Record<BackpackTab, readonly BackpackPage[]>> = {
  notebook: ['map', 'journey', 'abilities'],
  treasures: ['treasures'],
  settings: ['settings'],
};

/**
 * Ce qui ouvre le sac : son bouton (l'action Carte, au toucher, au clavier ou à la manette), la
 * touche Pause (Échap), ou l'appli passée en arrière-plan.
 */
export type BackpackTrigger = 'bag' | 'pause' | 'hidden';

/**
 * La page ouverte (choix de l'utilisateur, D-159) : toujours la carte ; la touche Pause ouvre les
 * réglages. Sans carte (un parcours d'essai), les réglages.
 */
export function openingPage(trigger: BackpackTrigger, hasMap: boolean): BackpackPage {
  return trigger === 'pause' || !hasMap ? 'settings' : 'map';
}

/** L'onglet d'une page. */
export function tabOf(page: BackpackPage): BackpackTab {
  return BACKPACK_TABS.find((tab) => BACKPACK_PAGES[tab].includes(page)) ?? 'settings';
}

/** Un lieu de la rangée, à gauche de la carte (D-160). */
export interface NotebookPlace {
  readonly id: string;
  /** Visité (on feuillette sa page) ; ou le prochain, encore inconnu (un « ? »). */
  readonly state: 'visited' | 'next';
  /** Céleste y est (un point rose). */
  readonly here: boolean;
}

/**
 * Les lieux de la rangée (choix de l'utilisateur, D-160) : ceux où Céleste est déjà allée, dans
 * l'ordre du voyage, puis un seul « ? » pour le premier lieu qu'elle ne connaît pas encore (le
 * nombre de lieux reste secret).
 */
export function notebookPlaces(
  order: readonly string[],
  visited: ReadonlySet<string>,
  here: string | null,
): NotebookPlace[] {
  const places: NotebookPlace[] = order
    .filter((id) => visited.has(id))
    .map((id) => ({ id, state: 'visited', here: id === here }));
  const next = order.find((id) => !visited.has(id));
  if (next !== undefined) {
    places.push({ id: next, state: 'next', here: false });
  }
  return places;
}
