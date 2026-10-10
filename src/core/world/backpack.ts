/**
 * Le sac à dos de Céleste (D-159) : le menu du jeu, qui réunit le cahier (la carte, Mon voyage,
 * Mes capacités), les trésors et les réglages (l'ancienne pause). Pur : les onglets, leurs pages,
 * et la page sur laquelle il s'ouvre.
 */

/** Les trois objets de la poche du sac. */
export type BackpackTab = 'notebook' | 'treasures' | 'settings';

/** Une page du sac. Les trésors gardent pour l'instant les trois pages de l'ancien cahier. */
export type BackpackPage =
  'map' | 'journey' | 'abilities' | 'memories' | 'maria' | 'strange' | 'settings';

export const BACKPACK_TABS: readonly BackpackTab[] = ['notebook', 'treasures', 'settings'];

/** Les pages de chaque onglet, dans l'ordre des sous-onglets ; la première s'ouvre d'abord. */
export const BACKPACK_PAGES: Readonly<Record<BackpackTab, readonly BackpackPage[]>> = {
  notebook: ['map', 'journey', 'abilities'],
  treasures: ['memories', 'maria', 'strange'],
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
