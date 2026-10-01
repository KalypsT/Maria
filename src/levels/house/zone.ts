import type { ZoneSource } from '../../core/world/zone';
import gardenAlley from '../garden/alley.txt?raw';
import gardenTerrace from '../garden/terrace.txt?raw';
import gardenTree from '../garden/tree.txt?raw';
import gardenThorns from '../garden/thorns.txt?raw';
import gardenTreehouse from '../garden/treehouse.txt?raw';
import gardenUpside from '../garden/upside.txt?raw';
import gardenVegetables from '../garden/vegetables.txt?raw';
import attic from './attic.txt?raw';
import bedroom from './bedroom.txt?raw';
import hall from './hall.txt?raw';
import kitchen from './kitchen.txt?raw';
import laundry from './laundry.txt?raw';
import living from './living.txt?raw';
import livingStrange from './living-strange.txt?raw';
import shadows from './shadows.txt?raw';
import staircase from './staircase.txt?raw';
import street from '../street/street.txt?raw';
import playground from '../street/playground.txt?raw';
import shop from '../street/shop.txt?raw';
import site from '../street/site.txt?raw';
import schoolyard from '../street/schoolyard.txt?raw';
import school from '../street/school.txt?raw';
import schoolStrange from '../street/school-strange.txt?raw';

/**
 * Première zone : la maison la nuit (PLACEHOLDER, D-25, D-27). En grimpant aux rebords (D-26) :
 * la trappe à linge (couloir:3 ↔ buanderie:1) ferme la boucle, l'escalier mène au grenier
 * (escalier:3 ↔ grenier:1), d'où l'on ressort derrière l'armoire de la chambre (grenier:2 ↔
 * chambre:2). Le monde étrange (salon étrange, passage d'ombres) n'est relié à la maison que par
 * l'histoire (D-34).
 *
 * Le jardin (D-46), derrière la porte de la buanderie (buanderie:3, fermée tant que Céleste n'a
 * pas grandi) : terrasse, potager, grand arbre et sa cabane, puis l'allée des toits, qui ramène du
 * haut du vieux mur à la terrasse (saut mural).
 *
 * Le quartier (D-60) : par le portillon au bout de l'allée (allée:3, fermé tant que la chevillette
 * n'est pas tirée), la rue, un grand niveau en long. Même zone (une seule histoire, une seule
 * analyse), mais une autre page du cahier (« Mon quartier »). Les lieux du quartier sont derrière
 * des portes de façade (D-61), au milieu de la rue : l'aire de jeux, la supérette ; sa réserve
 * donne sur le chantier, d'où l'on revient en haut de l'échafaudage de la rue (D-63).
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
    // Le jardin (D-46).
    { id: 'garden-terrace', text: gardenTerrace },
    { id: 'garden-vegetables', text: gardenVegetables },
    { id: 'garden-tree', text: gardenTree },
    { id: 'garden-treehouse', text: gardenTreehouse },
    { id: 'garden-alley', text: gardenAlley },
    // Derrière la haie (D-49) : le monde étrange du jardin, par l'histoire (le trou de la haie).
    { id: 'garden-upside', text: gardenUpside },
    { id: 'garden-thorns', text: gardenThorns },
    // Le quartier (D-60).
    { id: 'street', text: street },
    // Les lieux du quartier, derrière leurs portes de façade (D-61).
    { id: 'playground', text: playground },
    { id: 'shop', text: shop },
    { id: 'site', text: site },
    { id: 'schoolyard', text: schoolyard },
    { id: 'school', text: school },
    // Le monde étrange du quartier (D-64) : par l'histoire (l'oculus de l'école).
    { id: 'school-strange', text: schoolStrange },
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
    ['laundry:3', 'garden-terrace:1'],
    ['garden-terrace:2', 'garden-vegetables:1'],
    ['garden-vegetables:2', 'garden-tree:1'],
    ['garden-tree:2', 'garden-treehouse:1'],
    ['garden-alley:2', 'garden-tree:3'],
    ['garden-terrace:3', 'garden-alley:1'],
    ['garden-upside:1', 'garden-thorns:1'],
    ['garden-alley:3', 'street:1'],
    // Porte de façade (D-61) : le portillon de l'aire de jeux, au milieu de la rue.
    ['street:2', 'playground:1'],
    // La supérette (porte de façade), sa réserve qui donne sur le chantier, et le haut du chantier
    // qui ramène au haut de l'échafaudage de la rue (D-63) : une boucle.
    ['street:3', 'site:2'],
    ['street:4', 'shop:1'],
    ['shop:2', 'site:1'],
    // L'école (D-64) : le trou du grillage de l'aire de jeux (en planant) mène à la cour ; la porte
    // de la cour, à l'école ; la porte de l'école, qui s'ouvre de l'intérieur, à la rue.
    ['playground:2', 'schoolyard:1'],
    ['schoolyard:2', 'school:2'],
    ['street:5', 'school:1'],
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
    // Le jardin, dehors, à droite de la buanderie ; l'allée passe au-dessus de la terrasse et du
    // potager, la cabane est perchée dans l'arbre.
    'garden-terrace': { x: 18.4, y: 4.9, w: 2.6, h: 1.8 },
    'garden-vegetables': { x: 21.4, y: 4.9, w: 3.2, h: 1.8 },
    'garden-tree': { x: 25.0, y: 2.1, w: 2.4, h: 4.6 },
    'garden-treehouse': { x: 27.8, y: 2.1, w: 1.6, h: 0.9 },
    'garden-alley': { x: 18.9, y: 2.9, w: 5.8, h: 1.4 },
    // Mon quartier : la rue en long (D-60), et les lieux derrière leurs façades (D-61), au-dessus
    // de leur porte.
    street: { x: 0, y: 3, w: 16, h: 2.4, page: 'street' },
    playground: { x: 3.6, y: 0.4, w: 3.8, h: 2.2, page: 'street' },
    schoolyard: { x: 7.6, y: 0.1, w: 2.8, h: 1.4, page: 'street' },
    school: { x: 7.84, y: 1.7, w: 2.8, h: 1.0, page: 'street' },
    shop: { x: 10.9, y: 0.6, w: 2.8, h: 1.8, page: 'street' },
    site: { x: 14.2, y: -0.6, w: 2.8, h: 3, page: 'street' },
  },
};
