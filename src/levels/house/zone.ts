import type { ZoneSource } from '../../core/world/zone';
import attic from './attic.txt?raw';
import bedroom from './bedroom.txt?raw';
import hall from './hall.txt?raw';
import kitchen from './kitchen.txt?raw';
import laundry from './laundry.txt?raw';
import living from './living.txt?raw';
import livingStrange from './living-strange.txt?raw';
import shadows from './shadows.txt?raw';
import staircase from './staircase.txt?raw';

/**
 * Première zone : la maison la nuit (PLACEHOLDER, D-25, D-27). En grimpant aux rebords (D-26) :
 * la trappe à linge (couloir:3 ↔ buanderie:1) ferme la boucle, l'escalier mène au grenier
 * (escalier:3 ↔ grenier:1), d'où l'on ressort derrière l'armoire de la chambre (grenier:2 ↔
 * chambre:2). Le monde étrange (salon étrange, passage d'ombres) n'est relié à la maison que par
 * l'histoire (D-34).
 */
export const HOUSE: ZoneSource = {
  id: 'house',
  start: 'bedroom',
  rooms: [
    { id: 'bedroom', text: bedroom },
    { id: 'hall', text: hall },
    { id: 'staircase', text: staircase },
    { id: 'living', text: living },
    { id: 'kitchen', text: kitchen },
    { id: 'laundry', text: laundry },
    { id: 'attic', text: attic },
    // Monde étrange (D-34) : on y entre par l'histoire (haut de la bibliothèque), jamais par une porte.
    { id: 'living-strange', text: livingStrange },
    { id: 'shadows', text: shadows },
  ],
  links: [
    ['bedroom:1', 'hall:1'],
    ['hall:2', 'staircase:1'],
    ['hall:3', 'laundry:1'],
    ['staircase:2', 'living:1'],
    ['living:2', 'kitchen:1'],
    ['kitchen:2', 'laundry:2'],
    ['staircase:3', 'attic:1'],
    ['attic:2', 'bedroom:2'],
    ['living-strange:1', 'shadows:1'],
  ],
  // Coupe de la maison dessinée par Céleste : l'étage à gauche, l'escalier, puis le
  // rez-de-chaussée et le grenier à droite (dans l'ordre des portes : un mur droit mène à un mur
  // gauche). Carte imparfaite (§24.1) : le grenier et la trappe relient des salles éloignées.
  map: {
    bedroom: { x: 0, y: 2.2, w: 3, h: 1.9 },
    hall: { x: 3.4, y: 2.5, w: 3.8, h: 1.6 },
    staircase: { x: 7.6, y: 2.2, w: 2.2, h: 4.5 },
    attic: { x: 10.2, y: 0.3, w: 6.8, h: 1.6 },
    living: { x: 10.2, y: 4.9, w: 2.2, h: 1.8 },
    kitchen: { x: 12.8, y: 4.9, w: 2.4, h: 1.8 },
    laundry: { x: 15.6, y: 4.4, w: 2.4, h: 2.3 },
  },
};
