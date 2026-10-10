import type { PlaceIcon } from '../config/places';

/**
 * Les dessins du sac à dos (D-159), en SVG, PLACEHOLDER : le sac (le bouton en haut à gauche, en
 * attendant l'image de l'utilisateur), et les trois objets de sa poche : le cahier, la boîte à
 * trésors, la trousse. Peu de détails : ils se lisent petits, sur la nuit.
 */

const INK = '#3b3330';

export const BAG_ICON = `<svg viewBox="0 0 40 40" aria-hidden="true">
<path d="M13 12c0-5 3-8 7-8s7 3 7 8" fill="none" stroke="#f3ead7" stroke-width="2.4" stroke-linecap="round"/>
<rect x="7" y="11" width="26" height="25" rx="7" fill="#d9788f" stroke="${INK}" stroke-width="1.8"/>
<path d="M7 20h26" stroke="${INK}" stroke-width="1.5"/>
<rect x="14" y="24" width="12" height="8" rx="2.5" fill="#f1ccd3" stroke="${INK}" stroke-width="1.5"/>
<circle cx="20" cy="20" r="1.8" fill="#f2c879"/></svg>`;

export const NOTEBOOK_ICON = `<svg viewBox="0 0 60 48" aria-hidden="true">
<rect x="12" y="4" width="36" height="40" rx="3" fill="#4f6f8f" stroke="${INK}" stroke-width="2"/>
<rect x="12" y="4" width="7" height="40" fill="#d9788f" stroke="${INK}" stroke-width="2"/>
<rect x="24" y="14" width="18" height="10" rx="2" fill="#f3ead7"/>
<path d="M27 18h12M27 21h8" stroke="#8a7b6c" stroke-width="1.4"/></svg>`;

export const TREASURE_BOX_ICON = `<svg viewBox="0 0 60 48" aria-hidden="true">
<rect x="9" y="18" width="42" height="24" rx="4" fill="#f2c879" stroke="${INK}" stroke-width="2"/>
<path d="M7 18c0-6 4-9 9-9h28c5 0 9 3 9 9z" fill="#e8b45f" stroke="${INK}" stroke-width="2"/>
<circle cx="30" cy="27" r="4" fill="#d9788f" stroke="${INK}" stroke-width="1.6"/>
<path d="M16 34h28" stroke="${INK}" stroke-width="1.2" stroke-dasharray="2 2.5"/></svg>`;

export const POUCH_ICON = `<svg viewBox="0 0 60 48" aria-hidden="true">
<path d="M8 18c0-4 3-7 7-7h30c4 0 7 3 7 7v14c0 4-3 7-7 7H15c-4 0-7-3-7-7z" fill="#9cc7a4" stroke="${INK}" stroke-width="2"/>
<path d="M10 19h40" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 2"/>
<circle cx="46" cy="19" r="2.6" fill="#f3ead7" stroke="${INK}" stroke-width="1.4"/>
<path d="M18 8l14 14" stroke="#f2c879" stroke-width="4" stroke-linecap="round"/></svg>`;

/**
 * Les pictogrammes des lieux (D-160), dans la rangée à gauche de la carte : un dessin d'enfant par
 * page du cahier (`MAP_PLACES`).
 */
export const PLACE_ICONS: Readonly<Record<PlaceIcon, string>> = {
  house: `<svg viewBox="0 0 40 40" aria-hidden="true">
<path d="M7 19 20 8l13 11v14H7z" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
<rect x="16" y="24" width="8" height="9" fill="#d9788f"/></svg>`,
  swing: `<svg viewBox="0 0 40 40" aria-hidden="true">
<path d="M8 34 13 8h14l5 26M15 8v16M25 8v16" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M13 25h14" stroke="#d9788f" stroke-width="3.2" stroke-linecap="round"/></svg>`,
  clock: `<svg viewBox="0 0 40 40" aria-hidden="true">
<circle cx="20" cy="17" r="10" fill="none" stroke="${INK}" stroke-width="2.2"/>
<path d="M20 11v6l4 3" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M10 34h20" stroke="#4f6f8f" stroke-width="3"/></svg>`,
  train: `<svg viewBox="0 0 40 40" aria-hidden="true">
<rect x="8" y="9" width="24" height="20" rx="5" fill="none" stroke="${INK}" stroke-width="2.2"/>
<rect x="12" y="13" width="16" height="7" fill="#c9dcef" stroke="${INK}" stroke-width="1.4"/>
<circle cx="14" cy="33" r="2.5" fill="${INK}"/><circle cx="26" cy="33" r="2.5" fill="${INK}"/></svg>`,
  sea: `<svg viewBox="0 0 40 40" aria-hidden="true">
<circle cx="27" cy="12" r="5" fill="#f2c879" stroke="${INK}" stroke-width="1.6"/>
<path d="M5 24q4-4 8 0t8 0 8 0 8 0M5 31q4-4 8 0t8 0 8 0 8 0" fill="none" stroke="#4f6f8f" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  armchair: `<svg viewBox="0 0 40 40" aria-hidden="true">
<path d="M11 21v-8c0-3 2-5 5-5h8c3 0 5 2 5 5v8" fill="#ddd0ee" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M7 20c0-2 1-3 3-3s3 1 3 3v3h14v-3c0-2 1-3 3-3s3 1 3 3v9H7z" fill="#ddd0ee" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M10 29v4M30 29v4" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};
