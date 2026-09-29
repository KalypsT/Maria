import type { ZoneSource } from '../../core/world/zone';
import attic from './attic.txt?raw';
import bedroom from './bedroom.txt?raw';
import hall from './hall.txt?raw';
import kitchen from './kitchen.txt?raw';
import laundry from './laundry.txt?raw';
import living from './living.txt?raw';
import staircase from './staircase.txt?raw';

/**
 * Première zone : la maison la nuit (PLACEHOLDER, D-25, D-27). En grimpant aux rebords (D-26) :
 * la trappe à linge (couloir:3 ↔ buanderie:1) ferme la boucle, l'escalier mène au grenier
 * (escalier:3 ↔ grenier:1), d'où l'on ressort derrière l'armoire de la chambre (grenier:2 ↔
 * chambre:2).
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
  ],
};
