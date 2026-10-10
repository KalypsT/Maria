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
