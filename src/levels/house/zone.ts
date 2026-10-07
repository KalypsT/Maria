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
import stationTracks from '../station/tracks.txt?raw';
import stationPlatforms from '../station/platforms.txt?raw';
import stationHall from '../station/hall.txt?raw';
import stationLost from '../station/lost.txt?raw';
import stationDepot from '../station/depot.txt?raw';
import stationStrange from '../station/strange.txt?raw';
import stationTower from '../station/tower.txt?raw';
import trainCouchettes from '../train/couchettes.txt?raw';
import trainCompartments from '../train/compartments.txt?raw';
import trainBaggage from '../train/baggage.txt?raw';
import trainRoof from '../train/roof.txt?raw';
import trainRestaurant from '../train/restaurant.txt?raw';
import trainStrangeKitchen from '../train/strange-kitchen.txt?raw';
import trainStrangeDishes from '../train/strange-dishes.txt?raw';
import seaStation from '../sea/station.txt?raw';
import seaPromenade from '../sea/promenade.txt?raw';
import seaCentre from '../sea/centre.txt?raw';
import seaBeach from '../sea/beach.txt?raw';
import seaRocks from '../sea/rocks.txt?raw';
import seaLighthouse from '../sea/lighthouse.txt?raw';
import seaPort from '../sea/port.txt?raw';
import seaJetty from '../sea/jetty.txt?raw';
import seaStrangeFair from '../sea/strange-fair.txt?raw';
import seaStrangeWave from '../sea/strange-wave.txt?raw';
import seaCorridor from '../sea/corridor.txt?raw';
import seaCorridorSand from '../sea/corridor-sand.txt?raw';
import seaCorridorRoom from '../sea/corridor-room.txt?raw';
import seaCorridorStation from '../sea/corridor-station.txt?raw';
import seaCorridorSea from '../sea/corridor-sea.txt?raw';
import nannyEntry from '../nanny/entry.txt?raw';
import nannyHouse from '../nanny/house.txt?raw';
import nannyBed from '../nanny/bed.txt?raw';
import nannyGarden from '../nanny/garden.txt?raw';
import nannySchool from '../nanny/school.txt?raw';
import nannyStreet from '../nanny/street.txt?raw';
import nannyStation from '../nanny/station.txt?raw';
import nannyTrain from '../nanny/train.txt?raw';
import nannyBeach from '../nanny/beach.txt?raw';
import nannyCarousel from '../nanny/carousel.txt?raw';
import nannyNap from '../nanny/nap.txt?raw';
import nannyStairs from '../nanny/stairs.txt?raw';
import nannyPlayroom from '../nanny/playroom.txt?raw';
import finaleBed from '../finale/bed.txt?raw';
import finaleSky from '../finale/sky.txt?raw';

/**
 * Première zone : la maison la nuit (PLACEHOLDER, D-25, D-27). L'étage (chambre, couloir) est à
 * gauche de la cage de l'escalier, le rez-de-chaussée (salon, cuisine, buanderie) à droite, le
 * grenier au-dessus du couloir (D-132). En grimpant aux rebords (D-26) : la trappe à linge
 * (couloir:3 ↔ buanderie:1) ferme la boucle, le haut de la cage mène au grenier (escalier:3 ↔
 * grenier:1), d'où l'on redescend dans la chambre par sa petite porte haute (grenier:2 ↔
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
 *
 * La gare (D-66), par la porte de la palissade du chantier (porte de façade 6 de la rue, ouverte
 * au matin d'après l'école) : les voies, les quais et leur passerelle, le hall, le bureau des objets
 * trouvés (porte de façade du hall) et le dépôt. Une page de plus dans le cahier (« La gare »).
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
    // La gare (D-66).
    { id: 'station-tracks', text: stationTracks },
    { id: 'station-platforms', text: stationPlatforms },
    { id: 'station-hall', text: stationHall },
    { id: 'station-lost', text: stationLost },
    { id: 'station-depot', text: stationDepot },
    // Le monde étrange de la gare (D-68) : par l'histoire (le haut des casiers).
    { id: 'station-strange', text: stationStrange },
    { id: 'station-tower', text: stationTower },
    // Le train (D-83, D-85) : on y monte par l'histoire (la porte du train à quai), en route.
    { id: 'train-couchettes', text: trainCouchettes },
    // Le reste du train (D-86) : les compartiments, le fourgon, le toit, le wagon-restaurant.
    { id: 'train-compartments', text: trainCompartments },
    { id: 'train-baggage', text: trainBaggage },
    { id: 'train-roof', text: trainRoof },
    { id: 'train-restaurant', text: trainRestaurant },
    // Le monde étrange du train (D-88) : par l'histoire (la porte de la cuisine du wagon-restaurant).
    { id: 'train-strange-kitchen', text: trainStrangeKitchen },
    { id: 'train-strange-dishes', text: trainStrangeDishes },
    // La gare de la mer (D-90) : au bout du voyage, le train y reste à quai.
    { id: 'sea-station', text: seaStation },
    // La station balnéaire (D-95, D-98) : la promenade, salle centrale de la baie, et le centre de
    // la classe de mer, derrière sa porte.
    { id: 'sea-promenade', text: seaPromenade },
    { id: 'sea-centre', text: seaCentre },
    // La plage (D-99), par l'escalier de la promenade : une salle de marée.
    { id: 'sea-beach', text: seaBeach },
    // Les rochers (D-99), jusqu'au pied du phare : une salle de marée, les vagues à marée haute.
    { id: 'sea-rocks', text: seaRocks },
    // Le phare (D-100), par sa porte au pied des rochers ; la galerie mène au port.
    { id: 'sea-lighthouse', text: seaLighthouse },
    // Le port (D-100), une salle de marée : la passerelle du phare, les bateaux, le quai.
    { id: 'sea-port', text: seaPort },
    // La jetée et la fête foraine (D-101), par l'arche du quai du port : une salle de marée.
    { id: 'sea-jetty', text: seaJetty },
    { id: 'sea-strange-fair', text: seaStrangeFair },
    { id: 'sea-strange-wave', text: seaStrangeWave },
    { id: 'sea-corridor', text: seaCorridor },
    { id: 'sea-corridor-sand', text: seaCorridorSand },
    { id: 'sea-corridor-room', text: seaCorridorRoom },
    { id: 'sea-corridor-station', text: seaCorridorStation },
    { id: 'sea-corridor-sea', text: seaCorridorSea },
    // L'avant-dernier niveau (D-107, D-110) : la maison de la nounou, derrière la porte du couloir,
    // par l'histoire ; l'entrée et son miroir, puis la maison (salle centrale).
    { id: 'nanny-entry', text: nannyEntry },
    { id: 'nanny-house', text: nannyHouse },
    // L'îlot de mémoire 1 (D-112) : la chambre d'autrefois, puis le jardin renversé et Roger.
    { id: 'nanny-bed', text: nannyBed },
    { id: 'nanny-garden', text: nannyGarden },
    // L'îlot de mémoire 2 (D-113) : l'école d'autrefois, puis la rue et la boîte à formes.
    { id: 'nanny-school', text: nannySchool },
    { id: 'nanny-street', text: nannyStreet },
    // L'îlot de mémoire 3 (D-114) : la gare d'autrefois, puis le train et la cuisine rose.
    { id: 'nanny-station', text: nannyStation },
    { id: 'nanny-train', text: nannyTrain },
    // L'îlot de mémoire 4 (D-115) : la plage d'autrefois, puis le carrousel et le livre musical.
    { id: 'nanny-beach', text: nannyBeach },
    { id: 'nanny-carousel', text: nannyCarousel },
    // La chambre de la sieste (D-116), derrière la petite porte : le torchon blanc.
    { id: 'nanny-nap', text: nannyNap },
    // Le boss, l'effacement (D-117) : la cage d'escalier (la fuite), puis la salle de jeux. Hors carte.
    { id: 'nanny-stairs', text: nannyStairs },
    { id: 'nanny-playroom', text: nannyPlayroom },
    // Le dernier niveau (D-138, D-141) : la chambre immense, le lit et le coffre ; on y entre par
    // le berceau vide de la chambre, la nuit (l'histoire). Hors carte.
    { id: 'finale-bed', text: finaleBed },
    { id: 'finale-sky', text: finaleSky },
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
    // La gare (D-66) : la porte de la palissade mène aux voies, puis aux quais ; des quais au hall
    // par le sol ou par la passerelle (une boucle) ; le bureau des objets trouvés derrière sa porte
    // dans le hall ; le dépôt à droite du hall.
    ['street:6', 'station-tracks:1'],
    ['station-tracks:2', 'station-platforms:1'],
    ['station-platforms:2', 'station-hall:1'],
    ['station-platforms:3', 'station-hall:3'],
    ['station-hall:4', 'station-lost:1'],
    ['station-hall:2', 'station-depot:1'],
    // Le monde étrange de la gare (D-68) : les objets perdus, puis la tour.
    ['station-strange:1', 'station-tower:1'],
    // Le train (D-86) : de la voiture-couchettes aux compartiments, puis au fourgon ; du fourgon,
    // l'échelle du toit (porte 3), et la trappe du toit (porte 2) descend dans le wagon-restaurant,
    // dont la porte (sortie 1) s'ouvre de l'intérieur vers le fourgon (une boucle).
    ['train-couchettes:1', 'train-compartments:1'],
    ['train-compartments:2', 'train-baggage:1'],
    ['train-baggage:3', 'train-roof:1'],
    ['train-roof:2', 'train-restaurant:2'],
    ['train-baggage:2', 'train-restaurant:1'],
    // Le monde étrange du train (D-88) : la cuisine étrange, puis le train de la vaisselle.
    ['train-strange-kitchen:1', 'train-strange-dishes:1'],
    // Le train à quai relie les deux gares (D-90) : la porte de la voiture-couchettes donne sur la
    // gare de la mer, celle du fourgon sur les quais de la gare de la ville.
    ['train-couchettes:2', 'sea-station:1'],
    ['train-baggage:4', 'station-platforms:4'],
    // La station balnéaire (D-98) : la gare de la mer s'ouvre sur la promenade, la porte du centre.
    ['sea-station:2', 'sea-promenade:1'],
    ['sea-promenade:2', 'sea-centre:1'],
    ['sea-promenade:3', 'sea-beach:1'],
    ['sea-beach:2', 'sea-rocks:1'],
    // La boucle de la baie (D-100) : la porte du phare, sa galerie et la passerelle du port, puis
    // la grille du port sur la promenade.
    ['sea-rocks:2', 'sea-lighthouse:1'],
    ['sea-lighthouse:2', 'sea-port:2'],
    ['sea-port:1', 'sea-promenade:4'],
    ['sea-port:3', 'sea-jetty:1'],
    ['sea-strange-fair:1', 'sea-strange-wave:1'],
    // Le couloir en boucle (D-105) : cinq couloirs pareils en anneau, le décor change à chaque tour.
    ['sea-corridor:2', 'sea-corridor-sand:1'],
    ['sea-corridor-sand:2', 'sea-corridor-room:1'],
    ['sea-corridor-room:2', 'sea-corridor-station:1'],
    ['sea-corridor-station:2', 'sea-corridor-sea:1'],
    ['sea-corridor-sea:2', 'sea-corridor:1'],
    // La maison de la nounou (D-110).
    ['nanny-entry:1', 'nanny-house:1'],
    // L'îlot 1 (D-112) : l'étagère de gauche de la maison mène à la chambre d'autrefois, puis au
    // jardin renversé ; la porte près de Roger ramène à la maison (le raccourci, ouvert après lui).
    ['nanny-house:2', 'nanny-bed:1'],
    ['nanny-bed:2', 'nanny-garden:1'],
    ['nanny-garden:2', 'nanny-house:3'],
    // L'îlot 2 (D-113) : le haut de la bibliothèque mène à l'école, puis à la rue ; près de la boîte
    // à formes, une porte vers la maison et une vers la chambre d'autrefois (l'îlot voisin).
    ['nanny-house:5', 'nanny-school:1'],
    ['nanny-school:2', 'nanny-street:1'],
    ['nanny-street:2', 'nanny-house:4'],
    ['nanny-street:3', 'nanny-bed:3'],
    // L'îlot 3 (D-114) : le mur de droite de la maison mène à la gare d'autrefois, puis au train.
    ['nanny-house:6', 'nanny-station:1'],
    ['nanny-station:2', 'nanny-train:1'],
    // Près de la cuisine rose, une porte vers la maison et une vers la rue d'autrefois (l'îlot voisin).
    ['nanny-train:2', 'nanny-house:7'],
    ['nanny-train:3', 'nanny-street:4'],
    // L'îlot 4 (D-115) : la trappe du plancher de la maison mène à la plage, puis au carrousel ; près
    // du livre musical, une porte vers la maison et une vers le train d'autrefois (l'îlot voisin).
    ['nanny-house:8', 'nanny-beach:1'],
    ['nanny-beach:2', 'nanny-carousel:1'],
    ['nanny-carousel:2', 'nanny-house:9'],
    ['nanny-carousel:3', 'nanny-train:4'],
    // La petite porte de la sieste (D-116), une fois les quatre veilleuses allumées.
    ['nanny-house:10', 'nanny-nap:1'],
    // Le boss (D-117) : on arrive en bas de la cage d'escalier par l'histoire ; en haut, la salle de
    // jeux ; sa porte ramène à la maison une fois l'effacement dissous.
    ['nanny-stairs:1', 'nanny-playroom:1'],
    ['nanny-playroom:2', 'nanny-house:11'],
  ],
  // Coupe de la maison dessinée par Céleste : l'étage à gauche, l'escalier, puis le
  // rez-de-chaussée et le grenier à droite (dans l'ordre des portes : un mur droit mène à un mur
  // gauche). Carte imparfaite (§24.1) : le grenier et la trappe relient des salles éloignées.
  map: {
    bedroom: { x: 0, y: 2.2, w: 3, h: 1.9 },
    hall: { x: 3.4, y: 2.5, w: 3.8, h: 1.6 },
    // La cage de l'escalier monte du rez-de-chaussée au grenier, qui est au-dessus de l'étage.
    staircase: { x: 7.6, y: 0.3, w: 2.2, h: 6.4 },
    attic: { x: 3.4, y: 0.4, w: 3.8, h: 1.6 },
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
    // La gare (D-66) : les voies, les quais, le hall et le dépôt en long ; le bureau des objets
    // trouvés au-dessus de sa porte, dans le hall.
    'station-tracks': { x: 0, y: 2, w: 4.6, h: 1.6, page: 'station' },
    'station-platforms': { x: 5, y: 1.6, w: 4, h: 2, page: 'station' },
    'station-hall': { x: 9.4, y: 1.2, w: 3.6, h: 2.4, page: 'station' },
    'station-lost': { x: 11.3, y: -0.6, w: 1.8, h: 1.4, page: 'station' },
    'station-depot': { x: 13.4, y: 2, w: 4.6, h: 1.6, page: 'station' },
    // Le train (D-85) : les voitures en long, sur leur propre page du cahier.
    'train-couchettes': { x: 0, y: 1, w: 6, h: 1.4, page: 'train' },
    'train-compartments': { x: 6.4, y: 1, w: 6.4, h: 1.4, page: 'train' },
    'train-baggage': { x: 13.2, y: 1, w: 5, h: 1.4, page: 'train' },
    'train-restaurant': { x: 18.6, y: 1, w: 5, h: 1.4, page: 'train' },
    // Le toit, au-dessus du fourgon et du wagon-restaurant.
    'train-roof': { x: 13.2, y: -0.4, w: 10.4, h: 1, page: 'train' },
    // La gare de la mer (D-90), au bout du train, du côté de la voiture-couchettes.
    // La mer (D-98) : la baie dessinée par Céleste, la gare à droite, la promenade au bord de l'eau,
    // le centre au-dessus de sa porte.
    'sea-station': { x: 16.4, y: 2.4, w: 3.6, h: 1.6, page: 'sea' },
    'sea-promenade': { x: 0, y: 2.6, w: 16, h: 1.4, page: 'sea' },
    'sea-centre': { x: 10.4, y: 0.2, w: 4.6, h: 2.0, page: 'sea' },
    'sea-beach': { x: 2.2, y: 4.3, w: 13.4, h: 1.6, page: 'sea' },
    'sea-rocks': { x: -9.4, y: 4.0, w: 11.2, h: 2.2, page: 'sea' },
    'sea-lighthouse': { x: -11.6, y: -2.6, w: 2.0, h: 6.4, page: 'sea' },
    'sea-port': { x: -9.4, y: 1.0, w: 9.0, h: 1.6, page: 'sea' },
    'sea-jetty': { x: -9.4, y: -0.8, w: 9.0, h: 1.2, page: 'sea' },
    // Chez la nounou (D-107) : l'entrée, puis la maison, plus grande ; les îlots viendront autour.
    'nanny-entry': { x: 0, y: 2.6, w: 4.2, h: 1.3, page: 'nanny' },
    'nanny-house': { x: 4.6, y: 0.4, w: 6.6, h: 3.5, page: 'nanny' },
    // L'îlot 1, au-dessus de l'entrée : la chambre, puis le jardin renversé à sa gauche.
    'nanny-bed': { x: 0.2, y: -1.8, w: 4.0, h: 2.0, page: 'nanny' },
    'nanny-garden': { x: -3.8, y: -1.7, w: 3.6, h: 1.6, page: 'nanny' },
    // L'îlot 2, au-dessus de la maison (on y monte par la bibliothèque) : l'école, puis la rue.
    'nanny-school': { x: 4.6, y: -2.0, w: 4.4, h: 1.6, page: 'nanny' },
    'nanny-street': { x: 9.4, y: -2.0, w: 4.2, h: 1.4, page: 'nanny' },
    // L'îlot 3, à droite de la maison (son mur de droite) : la gare, puis le train.
    'nanny-station': { x: 11.6, y: 1.6, w: 4.2, h: 1.4, page: 'nanny' },
    'nanny-train': { x: 16.2, y: 1.8, w: 4.2, h: 1.2, page: 'nanny' },
    // L'îlot 4, sous la maison (on y descend par la trappe) : la plage, puis le carrousel.
    'nanny-beach': { x: 6.6, y: 4.3, w: 4.4, h: 1.4, page: 'nanny' },
    'nanny-carousel': { x: 11.4, y: 4.1, w: 3.0, h: 1.6, page: 'nanny' },
    // La chambre de la sieste, derrière sa porte, au milieu de la maison.
    'nanny-nap': { x: 7.0, y: 6.0, w: 4.0, h: 2.0, page: 'nanny' },
  },
};
