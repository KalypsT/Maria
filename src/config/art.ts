import type { PropKind } from '../core/story/story';
import type { CelesteOutfit } from './growth';

/**
 * Direction artistique (D-28) : livre illustré en aplats doux, nuit bleutée, lumière de veilleuse ;
 * monde étrange en silhouettes et lumière turquoise. PROVISOIRE : couleurs et intensités à régler
 * sur téléphone.
 */

/**
 * Éléments d'habillage connus. `furniture` : meuble posé sur des tuiles pleines ou traversables
 * (vérifié) ; sinon élément de fond (fenêtre, cadre…), sans contrainte. `far` : élément de fond
 * lointain, voilé par la perspective atmosphérique (D-71) ; jamais une porte ni un repère de jeu.
 * `sky` : dessiné dans le plan du ciel, qui défile à peine (D-72).
 */
export const DECOR_KINDS: Readonly<
  Record<string, { readonly furniture: boolean; readonly far?: boolean; readonly sky?: boolean }>
> = {
  // Chambre.
  wardrobe: { furniture: true },
  headboard: { furniture: true },
  bed: { furniture: true },
  toybox: { furniture: true },
  stool: { furniture: true },
  desk: { furniture: true },
  books: { furniture: true },
  shelf: { furniture: true },
  // Meubles dessinés d'après leurs tuiles (forme exacte de la collision) + détails.
  console: { furniture: true },
  basket: { furniture: true },
  bench: { furniture: true },
  wallshelf: { furniture: true },
  ledge: { furniture: true },
  stairs: { furniture: true },
  landing: { furniture: true },
  buffet: { furniture: true },
  trunk: { furniture: true },
  boxes: { furniture: true },
  rolledrug: { furniture: true },
  beam: { furniture: true },
  skylight: { furniture: true },
  sofa: { furniture: true },
  pouf: { furniture: true },
  table: { furniture: true },
  chair: { furniture: true },
  bookcase: { furniture: true },
  counter: { furniture: true },
  cupboard: { furniture: true },
  hood: { furniture: true },
  machine: { furniture: true },
  laundry: { furniture: true },
  /** Tringle du rideau (planche traversable), D-39. */
  rod: { furniture: true },
  /** Étagère à bocaux de la cuisine (planche traversable), D-39. */
  jarshelf: { furniture: true },
  /** Frigo de la cuisine, à escalader (D-39). */
  fridge: { furniture: true },
  /** Haute étagère à linge sur ses montants, près de la porte de derrière (buanderie, D-46). */
  linencabinet: { furniture: true },
  // Fond (sans collision).
  window: { furniture: false },
  frame: { furniture: false, far: true },
  /** Photo de famille (souvenir, D-38). */
  photo: { furniture: false },
  /** Dossier du canapé, dessiné derrière l'assise (D-39). */
  sofaback: { furniture: false },
  /** Fil à linge et chaussettes qui sèchent (buanderie, D-39). */
  clothesline: { furniture: false },
  drawing: { furniture: false, far: true },
  rug: { furniture: false },
  lamp: { furniture: false },
  coatrack: { furniture: false },
  clock: { furniture: false, far: true },
  // Maison déformée (monde étrange, D-35) : fond seulement, jamais de collision.
  door: { furniture: false },
  'door-upside': { furniture: false },
  wallstairs: { furniture: false },
  peel: { furniture: false },
  'giant-chair': { furniture: false },
  'giant-pencil': { furniture: false },
  'bedroom-window': { furniture: false },
  'toy-shadow': { furniture: false },
  'narrow-left': { furniture: false },
  'narrow-right': { furniture: false },
  /** Yeux dans l'ombre : rien de dessiné dans le décor, animés par les effets (D-35). */
  eyes: { furniture: false },
  // Le salon refait en salle témoin (D-74).
  /** Dessous de l'escalier qui monte à l'étage (bois plein, en marches). */
  understairs: { furniture: true },
  /** Plante en pot suspendue : le bord du pot est une planche traversable. */
  hangingplant: { furniture: true },
  /** Lustre : le dessus de l'abat-jour est une planche traversable. */
  ceilinglamp: { furniture: true },
  /** Cheminée contre le mur (fond) : miroir, âtre, bûches ; le feu est animé. */
  fireplace: { furniture: false },
  /** Manteau de la cheminée (planche traversable). */
  mantel: { furniture: true },
  /** Corps de l'horloge comtoise (fond) ; le balancier est animé. */
  grandclock: { furniture: false },
  /** Chapeau de l'horloge comtoise (plein). */
  clocktop: { furniture: true },
  // La maison refaite (D-75), d'après la grille du salon : l'étage.
  /** Mansarde : le toit en pente vu de l'intérieur (plafond plein), lambris et chevrons. */
  mansard: { furniture: true },
  /** Plafond bas (retombée, soupente) : plein, bordé d'une poutre. */
  soffit: { furniture: true },
  /** Lit cabane : montants posés sur le lit, toit en fil de bois ; la traverse est une étagère. */
  bedhouse: { furniture: true },
  /** Surmeuble du bureau : montants posés sur le bureau ; son étagère est traversable. */
  hutch: { furniture: true },
  /** Mobile (lune, étoiles) pendu au plafond, qui tourne doucement (animé). */
  mobile: { furniture: false },
  /** Étoiles projetées par la veilleuse sur les murs (animées, rien de dessiné dans le décor). */
  nightstars: { furniture: false },
  /** Miroir posé sur la console ; son fronton est plein (on s'y pose). */
  trumeau: { furniture: true },
  /** Œil-de-bœuf : fenêtre ronde, vitre transparente (D-72). */
  roundwindow: { furniture: false },
  /** Placard plein au-dessus d'une porte (le passage reste dessous). */
  overdoor: { furniture: true },
  /** Commode basse posée au sol. */
  commode: { furniture: true },
  /** Rampe de l'escalier et garde-corps du palier de l'étage (fond, derrière les marches). */
  banister: { furniture: false },
  /** Grande fenêtre haute en plein cintre (palier), vitre transparente. */
  tallwindow: { furniture: false },
  /** Rebord de fenêtre (plein). */
  windowsill: { furniture: true },
  /** Bibliothèque en escalier : montants et livres autour des planches (fond, sous le palier). */
  stepshelf: { furniture: false },
  /** Petit palier devant la porte du grenier, sur son poteau (le dessus est plein). */
  atticstep: { furniture: true },
  /** Cloison sous la volée et le palier (tuiles du mur) : lambris, limon, porte de placard. */
  stairwall: { furniture: true },
  /** Suspension : un fil, un abat-jour, de la lumière dessous (fond). */
  pendant: { furniture: false },
  /** Portemanteau sur pied, manteaux et écharpe (fond). */
  coatstand: { furniture: false },
  /** Grande plante en pot posée au sol (fond). */
  floorplant: { furniture: false },
  /** Poussière qui danse dans un rayon de lumière (animée). */
  dust: { furniture: false },
  /** Trace de bave d'escargot (D-148), vers une coquille cachée. */
  slimetrail: { furniture: false },
  /** Papillon de nuit autour d'une lampe, le soir (animé). */
  moth: { furniture: false },
  // Le rez-de-chaussée et le grenier (D-75).
  /** Conduit de la hotte, du plafond à la hotte (fond). */
  hoodduct: { furniture: false },
  /** Corps du frigo, posé au sol (fond : on passe devant) ; son dessus est `fridgetop`. */
  fridgebody: { furniture: false },
  /** Dessus du frigo (planche traversable). */
  fridgetop: { furniture: true },
  /** Cafetière sur la cuisinière (fond) ; la vapeur est animée (`steam`). */
  kettle: { furniture: false },
  /** Vapeur qui monte (animée). */
  steam: { furniture: false },
  /** Barre à casseroles pendue à deux chaînes ; la barre est traversable. */
  potrack: { furniture: true },
  /** Planche à repasser (fond) : pieds en X sous la planche de la salle, le fer dessus. */
  ironingboard: { furniture: false },
  /** Soupente sous la trappe à linge (plein), sur son poteau. */
  loft: { furniture: true },
  /** Étagère de rangement sur pieds : le dessus est plein, on passe entre les pieds. */
  utilityshelf: { furniture: true },
  /** Fenêtre de toit dans le pan du toit (vitre transparente, hors d'atteinte). */
  roofwindow: { furniture: true },
  /** Mannequin de couture, en ombre (fond). */
  dressform: { furniture: false },
  /** Poutre de la charpente sur son poteau (la poutre est la planche de la salle). */
  atticbeam: { furniture: true },
  /** Entrait sous le faîte (plein), tenu au toit par un poinçon et une jambe de force. */
  collartie: { furniture: true },
  // Le jardin refait (D-76).
  /** Avant-toit et gouttière de la maison (plein), en haut de la terrasse. */
  eave: { furniture: true },
  /** Guirlande de guinguette sous la pergola : le fil ; les ampoules se balancent (animées). */
  guinguette: { furniture: false },
  /** Papillons (animés, rien de dessiné dans le décor). */
  butterfly: { furniture: false },
  /** Épouvantail planté dans un bac (fond : on passe devant). */
  scarecrow: { furniture: false },
  /** Brouette posée au sol (fond). */
  wheelbarrow: { furniture: false },
  /** Tonneau de pluie (fond). */
  barrel: { furniture: false },
  /** Rayon de soleil qui descend d'une trouée du feuillage (fond). */
  sunshaft: { furniture: false },
  /** Balançoire pendue à une branche (fond, animée : elle oscille au vent). */
  swing: { furniture: false },
  /** Dessins de Céleste punaisés au mur (fond). */
  drawings: { furniture: false },
  /** Girouette sur un toit (fond, animée : elle tourne au vent). */
  weathervane: { furniture: false },
  // La rue refaite (D-77).
  /** Fil à linge tendu entre deux fenêtres : le linge se balance au vent. */
  washline: { furniture: false },
  /** Drapeau sur le toit de l'école (animé : il flotte au vent). */
  flag: { furniture: false },
  /** Chat roux du voisinage, assis sur un rebord de fenêtre (fond ; la queue bouge). */
  cat: { furniture: false },
  // L'aire de jeux, la supérette, le chantier refaits (D-78).
  /** Faux plafond de la supérette (plein) : dalles et joints. */
  ceilingpanels: { furniture: true },
  /** Tube fluorescent sous le faux plafond (fond, une source de lumière). */
  tube: { furniture: false },
  /** Tube fluorescent de la réserve qui clignote de temps en temps (animé). */
  tubeflicker: { furniture: false },
  /** Ventilateur de plafond (fond ; les pales tournent, animées). */
  fan: { furniture: false },
  /** Affiche de promotion dessinée, sans texte (fond). */
  promo: { furniture: false },
  /** Rangée pleine du haut d'une salle dehors, dessinée comme du ciel (D-78, le chantier). */
  opensky: { furniture: true },
  /** Façade arrière de la supérette, côté chantier (fond) ; le rebord en est le parapet. */
  backfacade: { furniture: false },
  /** Bâche tendue sur l'échafaudage, qui claque au vent (animée). */
  tarp: { furniture: false },
  // La cour et l'école refaites (D-79).
  /** Marelle à la craie, dessinée sur le haut du sol sous son rectangle (aucune tuile). */
  hopscotch: { furniture: true },
  /** Ballon oublié (sans collision). */
  ball: { furniture: false },
  /** Pigeon qui picore, puis s'envole quand Céleste approche (animé). */
  pigeon: { furniture: false },
  /** La mouette de la promenade, le merle et le hérisson du jardin (D-155). */
  seagull: { furniture: false },
  blackbird: { furniture: false },
  hedgehog: { furniture: false },
  /** Casiers de la classe posés au sol (fond) ; leur dessus est `cubbytop`. */
  cubbybody: { furniture: false },
  /** Dessus des casiers (planche traversable). */
  cubbytop: { furniture: true },
  /** Poutres du plafond de la classe (fond). */
  ceilingbeams: { furniture: false },
  /** Frise de formes au mur (fond). */
  frieze: { furniture: false },
  /** Bocal du poisson rouge (fond ; le poisson nage, animé). */
  fishbowl: { furniture: false },
  // Le jardin (D-46), dessiné par le code (PLACEHOLDER, pas d'image clé pour l'instant).
  /** Frondaison des arbres en haut des salles (feuillage plein). */
  canopy: { furniture: true },
  /** Haie (feuillage plein). */
  hedge: { furniture: true },
  /** Buisson accroché à la haie (feuillage plein, on y grimpe). */
  bush: { furniture: true },
  /** Tronc du grand arbre. */
  treetrunk: { furniture: true },
  /** Branche (traversable). */
  branch: { furniture: true },
  /** Bac de potager surélevé, planté. */
  planter: { furniture: true },
  /** Toit de lattes de la pergola (traversable), poteaux dessinés derrière. */
  pergola: { furniture: true },
  gardentable: { furniture: true },
  flowerpot: { furniture: true },
  /** Remise de jardin. */
  shed: { furniture: true },
  /** Clôture en planches. */
  fence: { furniture: true },
  /** Vieux mur de pierres du jardin. */
  oldwall: { furniture: true },
  /** Plancher de la cabane, sur les branches. */
  deck: { furniture: true },
  /** Grosse branche du grand arbre qui porte la cabane, et les cordes du plancher (fond, D-133). */
  limb: { furniture: false },
  /** L'allée vue de loin, au fond du potager : clôture, remise, vieux mur (D-133). */
  alleybehind: { furniture: false, far: true },
  crate: { furniture: true },
  /** Coffre suspendu au toit de la cabane. */
  hangingchest: { furniture: true },
  /** Tuteurs de haricots (fond ; les planches sont des tuiles traversables). */
  beanpoles: { furniture: false },
  /** Façade de la maison, vue du jardin. */
  facade: { furniture: false },
  /** Porte de derrière (buanderie, terrasse), autour de la sortie. */
  backdoor: { furniture: false },
  sun: { furniture: false, sky: true },
  /** Trou sombre dans la haie, au fond du jardin (pour plus tard, §25.3). */
  hedgehole: { furniture: false },
  /** Passage sous une haie (fond), allée des toits. */
  hedgetunnel: { furniture: false },
  /**
   * Ficelle du portillon (D-60) : le long du plafond du passage sous le vieux mur, puis le long du
   * mur de la cheminée, jusqu'à la chevillette.
   */
  gatecord: { furniture: false },
  // La rue (D-60), dessinée par le code (PLACEHOLDER).
  /** Maisons de ville mitoyennes (fond). */
  houses: { furniture: false },
  /** Platane du trottoir (fond). */
  planetree: { furniture: false },
  /** Les quatre lieux, fermés pour l'instant (fond, avec leur porte). */
  playground: { furniture: false },
  school: { furniture: false },
  shop: { furniture: false },
  site: { furniture: false },
  bins: { furniture: true },
  car: { furniture: true },
  /** Lampadaire : son chapeau est une plateforme traversable, le mât est du fond. */
  lamppost: { furniture: true },
  /** Abribus : le toit est une plateforme traversable. */
  busstop: { furniture: true },
  crates: { furniture: true },
  /** Planches de la palissade du chantier (pleines, D-91) : on glisse dessous. */
  sitehoarding: { furniture: true },
  /** Rebord de fenêtre, corniche, store, enseigne : plateformes traversables. */
  sill: { furniture: true },
  cornice: { furniture: true },
  awning: { furniture: true },
  shopsign: { furniture: true },
  /** Échafaudage du chantier (planches traversables). */
  scaffold: { furniture: true },
  // L'aire de jeux (D-61), dessinée par le code (PLACEHOLDER).
  /** Bac à sable (bois plein, bas). */
  sandbox: { furniture: true },
  /** Tourniquet (plateau plein, bas). */
  roundabout: { furniture: true },
  /** Cage à écureuil : barreaux traversables, arceaux dessinés jusqu'au sol. */
  climbingdome: { furniture: true },
  /** Portique des balançoires : la poutre est traversable, pieds et balançoires en fond. */
  swingset: { furniture: true },
  /** Nichoir en haut d'un mât : son toit est un perchoir traversable. */
  birdhouse: { furniture: true },
  /** Tour du toboggan : plancher traversable, toit plein ; poteaux et toboggan en fond. */
  slidetower: { furniture: true },
  /** Jeu à ressort (fond). */
  springrider: { furniture: false },
  /** Grillage de l'école, plein, avec son trou ; la cour se voit à travers. */
  schoolfence: { furniture: true },
  // La supérette et le chantier (D-63), dessinés par le code (PLACEHOLDER).
  /** Vitrine vue de l'intérieur (fond). */
  shopwindow: { furniture: false },
  /** La réserve au fond de la supérette (fond). */
  stockroom: { furniture: false },
  /** Caisse (plein). */
  checkout: { furniture: true },
  /** Rayonnage : étagères traversables, montants et produits. */
  shelfunit: { furniture: true },
  /** Frigos vitrés (plein). */
  cooler: { furniture: true },
  /** Pile de cartons sur un rayonnage ouvert dessous. */
  cartonrack: { furniture: true },
  /** Étagère murale de la réserve (traversable). */
  stockshelf: { furniture: true },
  /** Grue : mât (plein), flèche (traversable), cabine et contre-flèche en fond. */
  crane: { furniture: true },
  /** Banche (panneau de coffrage) pendue à la grue, ouverte dessous. */
  banche: { furniture: true },
  /** Mur de béton frais. */
  concretewall: { furniture: true },
  /** Antenne sur le toit de la supérette : sa barre est un perchoir traversable (D-63). */
  antenna: { furniture: true },
  /** Lampe de chantier sur son poteau : le chapeau est un perchoir traversable. */
  floodlight: { furniture: true },
  // L'école et son monde étrange (D-64), dessinés par le code (PLACEHOLDER).
  /** L'arrière de l'école, vu de la cour, avec sa porte (fond). */
  schoolfacade: { furniture: false },
  /** Pignon du gymnase (plein) : on arrive sur son toit plat ; un abri à vélos à son pied (D-134). */
  gymgable: { furniture: true },
  /** Escalier de secours du chantier : paliers (planches de la salle), volées, garde-corps (D-134). */
  fireescape: { furniture: true },
  /** Préau : toit traversable, poteaux en fond. */
  preau: { furniture: true },
  /** Panier de basket : le haut du panneau est un perchoir traversable. */
  basketball: { furniture: true },
  /** Petite table de la classe des petits (pleine). */
  kidtable: { furniture: true },
  /** Tableau noir (fond) : dessins à la craie, ou des formes dans le monde étrange. */
  chalkboard: { furniture: false },
  /** Oculus où passe une lueur turquoise (fond). */
  oculus: { furniture: false },
  /** Table géante qui flotte (plateau traversable). */
  tabletop: { furniture: true },
  /** Pile de livres géants (pleine). */
  bookstack: { furniture: true },
  /** Chaise d'écolier qui flotte (assise pleine). */
  floatchair: { furniture: true },
  /**
   * Le dessus de l'Educaville géante (D-155 ; le couvercle de la boîte à formes de D-64), plein,
   * avec son trou.
   */
  sorterlid: { furniture: true },
  cushions: { furniture: false },
  // Revisites avec le crochet (D-66).
  /** Jardinière sous la fenêtre de la buanderie (planche traversable), au bout du fil à linge. */
  windowbox: { furniture: true },
  /** Nid dans le platane de la rue (perchoir traversable), au bout du fil tendu depuis l'école. */
  nest: { furniture: true },
  // Le monde étrange du train (D-88), en silhouettes.
  /** Fourneau géant ou hotte (plein). */
  strangestove: { furniture: true },
  /** Étagère de vaisselle (pleine), paroi de cheminée. */
  dishshelf: { furniture: true },
  /** Pile d'assiettes (pleine). */
  dishstack: { furniture: true },
  /** Le wagon-restaurant de travers : tables et chaises au plafond (fond). */
  upsidedining: { furniture: false },
  // Le monde étrange de la gare (D-68), en silhouettes.
  /** Le hall à l'envers (fond). */
  upsidehall: { furniture: false },
  /** La grande horloge à l'envers, qui flotte (fond). */
  upsideclock: { furniture: false },
  /** Valise qui flotte : son dessus est une planche traversable. */
  floatsuitcase: { furniture: true },
  /** Pile de valises (pleine), paroi de cheminée. */
  suitcasestack: { furniture: true },
  /** La montagne des choses perdues (pleine, en marches). */
  lostpile: { furniture: true },
  // La gare (D-66), dessinée par le code (PLACEHOLDER).
  /** La gare au fond des voies (fond). */
  stationfacade: { furniture: false, far: true },
  /** Traverses et rails sur le ballast (fond). */
  rails: { furniture: false },
  /** Quai de béton et sa bande de sécurité (plein). */
  quay: { furniture: true },
  /** Abri de quai : toit traversable, poteaux en fond. */
  shelter: { furniture: true },
  /** Portique de signalisation : poutre traversable, pieds en fond. */
  gantry: { furniture: true },
  /** Feu de voie (fond), allumé par le train qui approche. */
  signal: { furniture: false },
  /** Mât de caténaire (fond), posé au sol ; un bras tient le bout de câble voisin (D-80). */
  catenarymast: { furniture: false },
  /** Chariot à bagages chargé de valises (plein, D-80). */
  luggagecart: { furniture: true },
  /** Lampadaire de quai (fond), allumé au crépuscule (D-80). */
  quaylamp: { furniture: false },
  /** Poste d'aiguillage sur pilotis (plein). */
  signalbox: { furniture: true },
  /** Marquise de verre au-dessus des quais (fond). */
  canopyroof: { furniture: false },
  /** Colonne de fonte qui porte la marquise (fond, D-80). */
  canopycolumn: { furniture: false },
  /** Lampe-globe suspendue à sa tige (fond, D-80). */
  globelamp: { furniture: false },
  /** Grand panneau d'affichage du quai (plein), sur deux pieds (D-135). */
  pillar: { furniture: true },
  /** Passerelle au-dessus des voies : marches et tablier traversables. */
  footbridge: { furniture: true },
  /** Horloge de quai sur son mât (fond). */
  stationclock: { furniture: false },
  /** Verrière du hall (fond). */
  glassroof: { furniture: false, far: true },
  /** Grande horloge du hall (fond). */
  bigclock: { furniture: false },
  /** Tableau des départs, suspendu (fond). */
  departures: { furniture: false },
  /** Galerie du hall (traversable). */
  gallery: { furniture: true },
  /** Voûte du hall : les coins pleins du haut sous une courbe (D-80). */
  vault: { furniture: true },
  /** Escalier en colimaçon : fût central, marches traversables, rampe (D-80). */
  spiralstair: { furniture: true },
  /** Balcon de pierre sur consoles, porte close, réverbère du câble (plein, D-80). */
  balcony: { furniture: true },
  /** Kiosque à journaux : toit traversable, comptoir plein. */
  kiosk: { furniture: true },
  /** Entrée du bureau des objets trouvés, autour de sa porte de façade (fond). */
  lostoffice: { furniture: false },
  /** Guichet des objets trouvés (plein). */
  lostcounter: { furniture: true },
  /** Étagères des objets perdus (planches traversables). */
  lostshelf: { furniture: true },
  /** Haute armoire de rangement (pleine), sur un haut piètement ouvert (D-135). */
  tallcabinet: { furniture: true },
  /** Casiers de consigne (pleins), une lueur turquoise tout en haut. */
  lockers: { furniture: true },
  /** Verrières d'atelier du dépôt (fond). */
  depotwindows: { furniture: false, far: true },
  /** Wagon de marchandises garé (plein). */
  wagon: { furniture: true },
  /** Crochet du pont roulant (traversable). */
  cranehook: { furniture: true },
  /** Pont roulant (fond). */
  overheadcrane: { furniture: false },
  /** Planche sur deux chevalets plantés dans les gravats (D-81). */
  trestle: { furniture: true },
  /** Lampe de bureau à abat-jour vert, allumée (fond, D-81). */
  desklamp: { furniture: false },
  // Derrière la haie (D-49).
  /** Tuteur géant (bois plein), paroi d'une cheminée. */
  giantstake: { furniture: true },
  giantflower: { furniture: false },
  giantcan: { furniture: false },
  // Le train (D-85).
  /** Plafond de la voiture : plafonniers, aérations (fond). */
  carceiling: { furniture: false },
  /** Porte de bout de voiture ou de la plateforme, fermée (fond). */
  traindoor: { furniture: false },
  /** Grande fenêtre de voiture : le paysage défile derrière la vitre (fond). */
  trainwindow: { furniture: false },
  /** Liseuse au-dessus des couchettes, allumée (fond, source de lumière). */
  trainlamp: { furniture: false },
  /** Cloison entre deux compartiments (bois plein, du plafond au-dessus du passage). */
  partition: { furniture: true },
  /** Grille en accordéon à moitié fermée (pleine), une tuile libre dessous. */
  accordiongate: { furniture: true },
  /** Couchettes superposées (traversables) et leurs montants. */
  bunks: { furniture: true },
  /** Tablette repliable sous la fenêtre (traversable). */
  foldtable: { furniture: true },
  /** Filet à bagages accroché à la paroi (traversable). */
  rack: { furniture: true },
  /** Chariot du vendeur, garé (plein), une tuile libre sous la caisse. */
  trolley: { furniture: true },
  // Le reste du train (D-86).
  /** Banquette de compartiment : l'assise est pleine, le dossier dessiné (on passe devant). */
  carbench: { furniture: true },
  /** Étagère à chapeaux au-dessus des banquettes (traversable). */
  hatshelf: { furniture: true },
  /** Pile de valises (pleine), qu'on escalade. */
  suitcases: { furniture: true },
  /** Valise posée sur un filet, qui tombe dans les virages (dessinée à part, `TrainRideView`). */
  fallingcase: { furniture: false },
  /** Malles du fourgon (pleines). */
  trunks: { furniture: true },
  /** Haute pile de caisses du fourgon (pleine). */
  cargocrates: { furniture: true },
  /** Vélo pendu à son crochet : le cadre est une planche (traversable). */
  bike: { furniture: true },
  /** Rail des crochets sous le plafond (traversable). */
  hookrail: { furniture: true },
  /** Caisse du chien, ouverte devant (fond). */
  dogcrate: { furniture: false },
  /** Colis empilés (pleins). */
  parcels: { furniture: true },
  /** Étagère haute du fourgon (traversable). */
  highshelf: { furniture: true },
  /** Échelle vers la trappe du toit (fond). */
  roofladder: { furniture: false },
  /** Toit et caisse d'une voiture, vus de dehors (pleins). */
  carroof: { furniture: true },
  /** Soufflet entre deux voitures, plus bas que les toits (plein). */
  gangway: { furniture: true },
  /** Aérateur sur le toit (plein). */
  roofvent: { furniture: true },
  /** Cheminée de la cuisine du wagon-restaurant (pleine). */
  kitchenchimney: { furniture: true },
  /** Trappe ouverte au bout du toit (fond). */
  roofhatch: { furniture: false },
  /** Table du wagon-restaurant, chaises retournées dessus (le plateau est traversable). */
  diningtable: { furniture: true },
  /** Comptoir du bar et ses tabourets (plein). */
  barcounter: { furniture: true },
  /** Porte-verres pendu au-dessus du comptoir (traversable). */
  glassrack: { furniture: true },
  /** Étagère des bouteilles (traversable). */
  bottleshelf: { furniture: true },
  /** Porte de la cuisine, une lueur turquoise dessous (fond). */
  kitchendoor: { furniture: false },
  /** Échelle sous la trappe du toit (fond). */
  hatchladder: { furniture: false },
  // La station balnéaire (D-98) : la promenade et le centre de la classe de mer.
  seabalustrade: { furniture: false },
  portgate: { furniture: false },
  anchor: { furniture: false },
  plinth: { furniture: true },
  beachstairs: { furniture: false },
  telescope: { furniture: false },
  seabench: { furniture: true },
  freezer: { furniture: true },
  icekiosk: { furniture: true },
  kioskawning: { furniture: true },
  colonie: { furniture: false },
  colonybalcony: { furniture: true },
  colonyroof: { furniture: true },
  roofsign: { furniture: true },
  colonyfloor: { furniture: true },
  servinghatch: { furniture: false },
  colonybunk: { furniture: true },
  schoolbags: { furniture: false },
  // La plage et les rochers (D-99).
  wetsand: { furniture: true },
  upperbeach: { furniture: true },
  sandstep: { furniture: true },
  cave: { furniture: false },
  beachcabin: { furniture: true },
  beachstairsfoot: { furniture: false },
  lifeguardchair: { furniture: true },
  groynepost: { furniture: true },
  buoy: { furniture: true },
  beacon: { furniture: true },
  searock: { furniture: true },
  lighthousefoot: { furniture: false },
  // Le phare et le port (D-100).
  lighthousecore: { furniture: false },
  lighthousestair: { furniture: true },
  keeperfloor: { furniture: true },
  lampfloor: { furniture: true },
  lighthousewall: { furniture: true },
  lamproom: { furniture: false },
  lens: { furniture: true },
  seachart: { furniture: false },
  breakwaterwalk: { furniture: true },
  harbourmud: { furniture: true },
  sailboat: { furniture: true },
  fishingboat: { furniture: true },
  pontoon: { furniture: true },
  harbourquay: { furniture: true },
  quayladder: { furniture: true },
  drainpipe: { furniture: false },
  harbouroffice: { furniture: false },
  harbourcrane: { furniture: true },
  frozengull: { furniture: false, sky: true },
  // La jetée et la fête foraine (D-101).
  jettydeck: { furniture: true },
  piling: { furniture: true },
  jettyladder: { furniture: true },
  jettygate: { furniture: false },
  fairstall: { furniture: true },
  candystall: { furniture: true },
  ticketbooth: { furniture: true },
  duckstall: { furniture: true },
  swingride: { furniture: false },
  garlandpoles: { furniture: false },
  bigwheel: { furniture: false, far: true },
  carousel: { furniture: false },
  // La fête engloutie (D-102), le monde étrange de la station balnéaire.
  drownedcarousel: { furniture: true },
  horsepole: { furniture: true },
  carouselbeam: { furniture: true },
  fairawning: { furniture: true },
  drownedstall: { furniture: true },
  bigtop: { furniture: true },
  balloons: { furniture: false },
  sunkenhorses: { furniture: false },
  drownedwheel: { furniture: false, far: true },
  drowneddeck: { furniture: true },
  strangeseawall: { furniture: true },
  // Le couloir en boucle (D-105), la fin de la station balnéaire.
  corridordoors: { furniture: false },
  sanddrift: { furniture: false },
  bedroomwallpaper: { furniture: false, far: true },
  heightmark: { furniture: false },
  corridorsuitcases: { furniture: false },
  seabelow: { furniture: true },
  skyreversed: { furniture: false },
  strangedoor: { furniture: false },
  // La maison de la nounou (D-110), l'avant-dernier monde étrange.
  nannymirror: { furniture: false },
  mirrorglass: { furniture: true },
  nightslit: { furniture: false },
  napdoor: { furniture: false },
  toyblocks: { furniture: true },
  giantable: { furniture: true },
  passagebed: { furniture: false },
  passageschool: { furniture: false },
  passagestation: { furniture: false },
  passagesea: { furniture: false },
  bedgate: { furniture: false },
  schoolgate: { furniture: false },
  stationgate: { furniture: false },
  seagate: { furniture: false },
  napcot: { furniture: false },
  cantower: { furniture: true },
  // Le dernier niveau (D-141), la chambre immense : la chambre du premier soir, démesurée.
  giantcradle: { furniture: true },
  nightlamp: { furniture: true },
  bedskirt: { furniture: true },
  giantpillow: { furniture: true },
  giantcabin: { furniture: false },
  garland: { furniture: true },
  giantmusicbox: { furniture: true },
  /** Une étoile de la berceuse (D-140) : dessinée par `LullabyView`, rien ici. */
  lullabystar: { furniture: true },
  // Le ciel de la chambre (D-142).
  giantframe: { furniture: true },
  giantpicture: { furniture: false },
  mobilethread: { furniture: false },
  mobilestar: { furniture: false },
  giantmoon: { furniture: true },
  giantwindow: { furniture: false },
  curtainrod: { furniture: false },
  giantcurtain: { furniture: true },
  tiedcurtain: { furniture: true },
  casement: { furniture: true },
  gianthutch: { furniture: true },
  giantdesk: { furniture: true },
  atticdoor: { furniture: false },
  // La chambre grande (D-143) : le berceau, ses côtés trop hauts pour voir dedans.
  bigcradle: { furniture: false },
};

/** Revêtement du mur d'une salle (`; @wall:`), dessiné par le code. */
export const WALL_STYLES = ['dots', 'stripes', 'planks', 'tiles', 'clocks', 'tags'] as const;
export type WallStyle = (typeof WALL_STYLES)[number];

/**
 * Images fournies (voir le document « Créer des images pour le jeu ») : nom d'élément → fichier
 * sous `public/art/`. Un élément absent de cette liste est dessiné par le code.
 */
export const ART_IMAGES: Readonly<Record<string, string>> = {
  /** Maria (D-31) : image fournie par l'utilisateur, détourée. */
  maria: 'maria.png',
  /** Roger, la peluche singe de Céleste (D-68, D-69) : image fournie par l'utilisateur, détourée. */
  roger: 'roger.png',
  /** La coquille d'escargot (D-148) : image fournie par l'utilisateur, détourée. */
  shell: 'shell.png',
};

/**
 * Les coquilles (D-148) : posées sur leur appui (rien ne flotte), un halo rose discret (le rose des
 * trouvailles reste leur signe), un scintillement de temps en temps, décalé d'une coquille à
 * l'autre. L'image `shell`, ou un dessin par le code si elle manque. PROVISOIRE : à juger sur
 * téléphone.
 */
export const SHELL_ART = {
  /** Hauteur de la coquille (px logiques ; Céleste en fait 24 à 28). */
  heightPx: 11,
  /** Halo rose autour de la coquille (px) et son opacité au centre. */
  haloPx: 5,
  haloAlpha: 0.45,
  /** Enfoncée d'autant dans son appui (px), pour qu'elle y repose. */
  sinkPx: 1,
  /** Scintillement : période, durée (ms) et taille (px). */
  glintPeriodMs: 3800,
  glintMs: 560,
  glintPx: 7,
  /** Au ramassage : la coquille file vers le cahier (ms), puis « n/N » du lieu reste affiché (ms). */
  flyMs: 620,
  countMs: 2200,
} as const;

/**
 * Les cachettes (D-148) : un décor au premier plan (`; @hide:`) qui s'efface quand Céleste passe
 * derrière (à `marginPx` près), pour qu'on la voie toujours (pilier 1). PROVISOIRE.
 */
export const HIDEOUT = {
  fadedAlpha: 0.22,
  marginPx: 4,
  fadeTimeMs: 140,
  /** Devant Céleste (10), derrière le bâton et la vignette. */
  depth: 10.8,
} as const;

/**
 * Le bocal à coquilles (D-148) : dans la chambre, sur le bureau, sous l'étagère où Maria finira
 * rangée (tuile du bas, posé sur le plateau). Une petite coquille par coquille trouvée, en tas.
 * PLACEHOLDER (dessiné par le code), place à confirmer.
 */
export const SHELL_JAR = {
  room: 'bedroom',
  col: 31,
  row: 14,
  /** Taille du bocal (px logiques), enfoncé d'autant dans le plateau. */
  widthPx: 24,
  heightPx: 32,
  sinkPx: 1,
  /**
   * Les petites coquilles : hauteur (px), par rangée, montée d'une rangée à l'autre au plus (px) ;
   * les rangées se tassent pour que le bocal soit plein quand toutes sont trouvées.
   */
  shellPx: 5,
  perRow: 5,
  stepYPx: 2.6,
  /** Devant le décor, derrière les personnages (comme les objets de l'histoire). */
  depth: 5,
} as const;

/**
 * Personnage illustré (D-123) : image fournie sous `public/art/` (détourée, `scripts/art-cutout.py`),
 * à la place du dessin par code. Elle remplit la hauteur du personnage ; `footX` (fraction de la
 * largeur de l'image) est l'axe des pieds, posé au milieu du cadre comme le corps dessiné ; une
 * image plus large que le cadre d'un côté (une main tendue) y est ramenée si elle tient.
 * `steam` : haut de la tasse (fractions de l'image), d'où monte la vapeur dessinée par le code.
 * `seat` (D-146) : pose assise, hauteur de l'assise dans l'image (fraction) ; l'image garde l'échelle d'un
 * adulte debout, l'assise posée sur le bas du cadre (le meuble), les jambes pendent en dessous.
 */
export interface CharacterImage {
  file: string;
  footX: number;
  steam?: { x: number; y: number };
  seat?: number;
  /**
   * Pose assise (D-151) : hauteur dessinée de l'image (px logiques), à la place de celle d'un
   * adulte debout. Sur une banquette, elle pose les pieds au sol ; un enfant garde sa taille.
   */
  height?: number;
  /** Un souvenir (D-154) : l'image un peu passée (opacité, de 0 à 1). */
  alpha?: number;
  /**
   * Un groupe (D-151) : plusieurs personnages côte à côte, chacun dans une part égale du cadre, à
   * la place de `file`.
   */
  group?: readonly { file: string; footX: number }[];
}

/** Les fichiers d'un personnage illustré (une image, ou celles d'un groupe). */
export function characterFiles(character: CharacterImage): readonly string[] {
  return character.group ? character.group.map((member) => member.file) : [character.file];
}

/** Personnages illustrés (D-123) ; les autres restent dessinés par le code (`familyArt`). */
export const CHARACTER_IMAGES: Readonly<Partial<Record<PropKind, CharacterImage>>> = {
  'dad-door': { file: 'dad-door.png', footX: 0.22 },
  'dad-hall': { file: 'dad-hall.png', footX: 0.18 },
  'dad-kitchen': { file: 'dad-kitchen.png', footX: 0.32, steam: { x: 0.896, y: 0.273 } },
  'dad-shop': { file: 'dad-shop.png', footX: 0.31 },
  'dad-garden': { file: 'dad-garden.png', footX: 0.19 },
  'dad-quay': { file: 'dad-quay.png', footX: 0.24 },
  // Assise au bord du lit (4 tuiles de haut) : les pieds pendent un peu au-dessus du sol. Les pieds
  // au milieu du cadre placent les hanches là où s'asseyait le dessin.
  'mom-bed': { file: 'mom-bed.png', footX: 0.48, seat: 0.6 },
  // Jambes repliées sur le canapé (2 tuiles de haut) ; les hanches vers l'arrière du cadre.
  'mom-sofa': { file: 'mom-sofa.png', footX: 0.36, seat: 0.74 },
  // Accroupie au sol à côté du banc : à l'échelle d'un adulte debout, les pieds sur le bas du cadre.
  'mom-bench': { file: 'mom-bench.png', footX: 0.37, seat: 1 },
  'mom-garden': { file: 'mom-garden.png', footX: 0.3 },
  'mom-yard': { file: 'mom-yard.png', footX: 0.38 },
  'mom-quay': { file: 'mom-quay.png', footX: 0.33 },
  // Les adultes du train et de l'école (D-151).
  teacher: { file: 'teacher.png', footX: 0.34 },
  conductor: { file: 'conductor.png', footX: 0.3 },
  // Sur une banquette du compartiment (2 tuiles) : les pieds au sol, 32 px sous l'assise.
  'mother-baby': { file: 'mother-baby.png', footX: 0.82, seat: 0.65, height: 91 },
  'sleeper-seat': { file: 'sleeper-seat.png', footX: 0.78, seat: 0.64, height: 89 },
  // Les enfants de la classe et le chien (D-151). Assis sur une couchette ou un lit, les jambes
  // pendent ; couchés, l'image remplit la hauteur du cadre.
  classmate: { file: 'classmate.png', footX: 0.65 },
  'classmate-slid': { file: 'classmate-slid.png', footX: 0.5 },
  'classmate-asleep': { file: 'classmate-asleep.png', footX: 0.5 },
  'kid-cap-sit': { file: 'kid-cap-sit.png', footX: 0.77, seat: 0.67, height: 23 },
  'kid-bob-sit': { file: 'kid-bob-sit.png', footX: 0.76, seat: 0.64, height: 23 },
  'kid-asleep': { file: 'kid-asleep.png', footX: 0.5 },
  'kids-quay': {
    file: 'kid-bob-quay.png',
    footX: 0.64,
    group: [
      { file: 'kid-bob-quay.png', footX: 0.64 },
      { file: 'kid-cap-quay.png', footX: 0.56 },
      { file: 'classmate-quay.png', footX: 0.59 },
    ],
  },
  'dog-sleep': { file: 'dog-sleep.png', footX: 0.5 },
  // Le chat gris (D-154).
  'cat-sit': { file: 'cat-sit.png', footX: 0.5 },
  'cat-sleep': { file: 'cat-sleep.png', footX: 0.5 },
  // La nounou dans son fauteuil (D-154), dans le souvenir d'Eden : un peu passée, comme un souvenir.
  'nanny-shadow': { file: 'nanny-sit.png', footX: 0.5, alpha: 0.9 },
  'nanny-look': { file: 'nanny-look.png', footX: 0.5, alpha: 0.9 },
  // Eden tout petit (D-154). Caché, seule sa tête dépasse : petite, en bas du cadre.
  'eden-small': { file: 'eden-small.png', footX: 0.5 },
  'eden-cheer': { file: 'eden-cheer.png', footX: 0.5 },
  'eden-laugh': { file: 'eden-laugh.png', footX: 0.5 },
  'eden-peek': { file: 'eden-peek.png', footX: 0.5, seat: 1, height: 9 },
  // Les passants (D-155). La caissière sur son tabouret : les hanches au milieu du cadre (au-dessus
  // du tabouret), les jambes pendent 3 tuiles sous l'assise jusqu'au sol.
  'busstop-man': { file: 'busstop-man.png', footX: 0.39 },
  'busstop-man-look': { file: 'busstop-man-look.png', footX: 0.36 },
  'dog-walker': { file: 'dog-walker.png', footX: 0.5 },
  cashier: { file: 'cashier.png', footX: 0.3, seat: 0.6, height: 120 },
  // La voisine : son buste, dans l'embrasure de sa fenêtre (même cadrage pour les deux poses).
  'neighbor-window': { file: 'neighbor-window.png', footX: 0.45 },
  'neighbor-wave': { file: 'neighbor-wave.png', footX: 0.45 },
  // Le chat roux : les pattes sur le rebord (le bas du cadre), la queue pend dessous.
  'ginger-cat-sit': { file: 'ginger-cat-sit.png', footX: 0.5, seat: 0.83, height: 34 },
  'ginger-cat-leap': { file: 'ginger-cat-leap.png', footX: 0.5 },
  // La gare et la mer (D-155). Le pêcheur : les hanches au milieu du cadre, sur le bord du quai ;
  // les jambes pendent 44 px sous l'assise ; le haut de sa canne : `rodTip`, d'où pend le fil.
  'traveler-suitcase': { file: 'traveler-suitcase.png', footX: 0.55 },
  'traveler-wave': { file: 'traveler-wave.png', footX: 0.55 },
  'traveler-board': { file: 'traveler-board.png', footX: 0.45 },
  fisherman: { file: 'fisherman.png', footX: 0.75, seat: 0.62, height: 118 },
  'fisherman-nod': { file: 'fisherman-nod.png', footX: 0.75, seat: 0.62, height: 118 },
  'candyfloss-vendor': { file: 'candyfloss-vendor.png', footX: 0.4 },
};

/**
 * Céleste illustrée (D-147) : par tenue, les pièces de la marionnette (noms de `CELESTE_PARTS`),
 * composées par `scripts/celeste-parts.py` dans `public/art/celeste/<tenue>-<pièce>.png`. Une tenue
 * absente garde le dessin par code ; ses autres pièces (parapluie, crochet…) aussi.
 */
export const CELESTE_PART_IMAGES: Readonly<Partial<Record<CelesteOutfit, readonly string[]>>> = {
  pyjama: ['head', 'pigtail', 'torso', 'arm', 'leg'],
  dress: ['head', 'pigtail', 'torso', 'arm', 'leg', 'skirt'],
  // Phases 3 et 4 ; le short est la pièce de hanche (`skirt`), D-149.
  jacket: ['head', 'ponytail', 'torso', 'arm', 'leg', 'skirt'],
  // Phase 4, la tenue de la fin (D-150) : le jean va jusqu'aux chevilles, pas de pièce de hanche.
  tee: ['head', 'ponytail', 'torso', 'arm', 'leg'],
};

/**
 * Illustrations de Céleste fournies par l'utilisateur (D-41, D-43), détourées, une par tenue :
 * écran de départ seulement (celle de la partie sauvegardée). En jeu, Céleste reste la marionnette
 * dessinée par le code (D-29), inspirée de ces images.
 */
export const TITLE_IMAGES: Readonly<Record<CelesteOutfit, string>> = {
  pyjama: 'art/celeste.png',
  dress: 'art/celeste-dress.png',
  jacket: 'art/celeste-jacket.png',
  tee: 'art/celeste-tee.png',
};

/** Palette d'une salle habillée ; le monde étrange en est une variante (§6.2). */
export interface ArtPalette {
  wallTop: string;
  wallBottom: string;
  wallpaper: string;
  wainscot: string;
  floor: string;
  floorEdge: string;
  structure: string;
  wood: string;
  woodLight: string;
  woodDark: string;
  fabric: string;
  fabricLight: string;
  linen: string;
  toy: string;
  toyLight: string;
  curtain: string;
  night: string;
  nightLow: string;
  moon: string;
  /** Liseré des surfaces praticables (lisibilité en jeu). */
  rim: string;
  /** Halo des veilleuses. */
  lamp: string;
  /** Obscurité de la pièce (0 : aucune). */
  darkness: number;
  /** Meubles réduits à des silhouettes (monde étrange). */
  silhouettes: boolean;
  /** Étoiles dans les fenêtres (la nuit). */
  stars: boolean;
  /** Intensité des halos des lampes (1 : la nuit). */
  glow: number;
  /** Dehors (jardin, D-46) : ciel au lieu du mur, herbe, pierres, orties. */
  outdoor: boolean;
  /** Sol pavé (la rue, D-60) au lieu de l'herbe. */
  paved: boolean;
  /** Feuillage (haies, frondaisons, buissons). */
  leaf: string;
  leafLight: string;
  leafDark: string;
  /**
   * Perspective atmosphérique (D-71) : opacité du voile (couleur du mur ou du ciel) posé sur le
   * fond lointain (`far`), pour que la couche jouable ressorte.
   */
  veil: number;
  /** Vignettage (D-71) : opacité dans les coins de l'écran (0 : aucun). */
  vignette: number;
  /** Couleur du vignettage (« r,g,b »). */
  vignetteColor: string;
  /** Épaisseur du liseré des surfaces praticables (px, D-130). */
  rimWidth: number;
  /** Lueur douce au-dessus du liseré (opacité, 0 : aucune, D-130). */
  rimGlow: number;
  /** Motif du mur imposé par la palette (un monde étrange, D-130) ; null : celui de la salle. */
  wallMotif: WallStyle | null;
  /** Halo doux autour de Céleste (opacité, 0 : aucun, D-130) et sa couleur (« r,g,b »). */
  halo: number;
  haloColor: string;
}

export const REAL_PALETTE: Readonly<ArtPalette> = {
  wallTop: '#44507a',
  wallBottom: '#353f63',
  wallpaper: 'rgba(255,236,200,0.09)',
  wainscot: '#4a4f72',
  floor: '#6a5242',
  floorEdge: '#7d6250',
  structure: '#2a2436',
  wood: '#9a7352',
  woodLight: '#c79d6f',
  woodDark: '#7a5a40',
  fabric: '#6d86c2',
  fabricLight: '#98ade0',
  linen: '#f3ead7',
  toy: '#d98b4f',
  toyLight: '#f0ad74',
  curtain: '#b85f75',
  night: '#3a4f8a',
  nightLow: '#1f2a55',
  moon: '#fbefc6',
  rim: 'rgba(255,214,140,0.7)',
  lamp: '255,196,120',
  darkness: 0.42,
  silhouettes: false,
  stars: true,
  glow: 1,
  outdoor: false,
  paved: false,
  leaf: '#4f7a4a',
  leafLight: '#78a567',
  leafDark: '#3a5c3a',
  veil: 0.2,
  vignette: 0.4,
  vignetteColor: '8,10,24',
  rimWidth: 1,
  rimGlow: 0,
  wallMotif: null,
  halo: 0,
  haloColor: '255,255,255',
};

/**
 * Le matin (D-31), première version de la palette « jour » : même maison, murs plus clairs, ciel
 * d'aube dans les fenêtres, obscurité presque levée. PROVISOIRE.
 */
export const DAY_PALETTE: Readonly<ArtPalette> = {
  ...REAL_PALETTE,
  wallTop: '#9fa9cf',
  wallBottom: '#8690ba',
  wallpaper: 'rgba(255,244,220,0.16)',
  wainscot: '#7f86ad',
  floor: '#8a6a50',
  floorEdge: '#a07e62',
  structure: '#4a4258',
  night: '#8fc3ea',
  nightLow: '#f6dcb6',
  moon: '#fff4cf',
  rim: 'rgba(255,240,205,0.55)',
  darkness: 0.1,
  stars: false,
  glow: 0.35,
  vignette: 0.22,
  vignetteColor: '40,30,40',
};

/**
 * Souvenirs jouables (D-89) : couleurs chaudes et passées, comme une vieille photo ; une lumière
 * douce, un voile clair sur les bords. PLACEHOLDER.
 */
export const MEMORY_PALETTE: Readonly<ArtPalette> = {
  ...DAY_PALETTE,
  wallTop: '#e3bf9c',
  wallBottom: '#d3a985',
  wallpaper: 'rgba(255,236,214,0.22)',
  wainscot: '#c49572',
  floor: '#a87855',
  floorEdge: '#c0916b',
  structure: '#7a5646',
  rim: 'rgba(255,240,215,0.6)',
  darkness: 0,
  glow: 0.5,
  vignette: 0.45,
  vignetteColor: '120,70,40',
};

/**
 * Monde étrange (D-28, D-36 : palette « crépuscule » choisie par l'utilisateur) : fonds violets et
 * bleu nuit, halos roses, bords des surfaces praticables en turquoise (lisibilité, pilier 1).
 */
export const STRANGE_PALETTE: Readonly<ArtPalette> = {
  ...REAL_PALETTE,
  wallTop: '#2c2344',
  wallBottom: '#1d1832',
  wallpaper: 'rgba(255,175,225,0.15)',
  wainscot: '#251d38',
  floor: '#0f0c18',
  floorEdge: '#1c1530',
  structure: '#0a0812',
  wood: '#16112a',
  woodLight: '#16112a',
  woodDark: '#0f0b1e',
  fabric: '#16112a',
  fabricLight: '#16112a',
  linen: '#16112a',
  toy: '#16112a',
  toyLight: '#16112a',
  curtain: '#1d1532',
  night: '#4b3b7c',
  nightLow: '#221a46',
  moon: '#ffd8ee',
  rim: 'rgba(140,240,225,0.9)',
  lamp: '255,160,210',
  darkness: 0.42,
  silhouettes: true,
  leaf: '#16112a',
  leafLight: '#16112a',
  leafDark: '#0f0b1e',
  // Déjà en silhouettes sur un fond sombre : pas de voile, un vignettage plus présent.
  veil: 0,
  vignette: 0.5,
  vignetteColor: '6,4,16',
};

/**
 * La chambre du premier soir, démesurée, à la lumière de la veilleuse (D-141, `; @palette:
 * nightlight`) : le monde de Maria, au début du dernier niveau. Un monde étrange (hors carte), mais
 * la chambre garde ses couleurs : moins de violet qu'ailleurs, la nuit bleue, la lumière chaude de
 * la veilleuse, un liseré à peine turquoise. L'étrange s'efface à mesure qu'on approche de Maria
 * (D-138). PLACEHOLDER.
 */
export const NIGHTLIGHT_PALETTE: Readonly<ArtPalette> = {
  ...REAL_PALETTE,
  wallTop: '#2f3a66',
  wallBottom: '#232c52',
  wallpaper: 'rgba(255,224,170,0.1)',
  wainscot: '#2c3560',
  floor: '#4e3d38',
  floorEdge: '#6a5248',
  rim: 'rgba(170,236,225,0.75)',
  lamp: '255,206,140',
  darkness: 0.48,
  vignette: 0.5,
  vignetteColor: '10,12,32',
};

/**
 * La chambre grande (D-143, `; @palette: nightlight-soft`) : l'étrange s'efface encore. La nuit de
 * la vraie chambre, un peu plus sombre que la veilleuse immense, un liseré presque blanc. PLACEHOLDER.
 */
export const NIGHTLIGHT_SOFT_PALETTE: Readonly<ArtPalette> = {
  ...NIGHTLIGHT_PALETTE,
  wallTop: '#343c5e',
  wallBottom: '#272e4c',
  rim: 'rgba(214,226,222,0.4)',
  darkness: 0.6,
  vignette: 0.45,
};

/**
 * Le jardin (D-46), dehors par beau temps : ciel clair, herbe, vieux murs de pierre, feuillage.
 * PROVISOIRE, à juger sur téléphone. Pas d'obscurité ; les bords praticables gardent un liseré.
 */
export const GARDEN_PALETTE: Readonly<ArtPalette> = {
  ...DAY_PALETTE,
  wallTop: '#8ec6ec',
  wallBottom: '#e6f0d6',
  wallpaper: 'rgba(255,255,255,0.55)',
  wainscot: '#9cc48a',
  floor: '#7a5a3c',
  floorEdge: '#7fb85e',
  structure: '#a8957a',
  wood: '#a57b52',
  woodLight: '#d1a676',
  woodDark: '#7d5a3b',
  night: '#8ec6ec',
  nightLow: '#e6f0d6',
  moon: '#fff1b8',
  rim: 'rgba(255,250,225,0.75)',
  lamp: '255,214,150',
  darkness: 0,
  glow: 0.25,
  outdoor: true,
  leaf: '#5d9152',
  leafLight: '#8cc26f',
  leafDark: '#3f6b3d',
  veil: 0.15,
  vignette: 0.16,
  vignetteColor: '40,50,30',
};

/**
 * La rue (D-60), de jour : le ciel du jardin, un trottoir de dalles grises avec sa bordure.
 * PROVISOIRE, à juger sur téléphone.
 */
export const STREET_PALETTE: Readonly<ArtPalette> = {
  ...GARDEN_PALETTE,
  floor: '#9a958d',
  floorEdge: '#cfc8bb',
  structure: '#b8a98f',
  paved: true,
};

/**
 * La rue au crépuscule (D-64), quand maman vient chercher Céleste à l'école : ciel orangé qui
 * vire au violet, feuillage et murs assombris, lampes allumées. PROVISOIRE, à juger sur téléphone.
 */
export const STREET_DUSK_PALETTE: Readonly<ArtPalette> = {
  ...STREET_PALETTE,
  wallTop: '#5b4f88',
  wallBottom: '#ec9f72',
  wallpaper: 'rgba(255,214,180,0.3)',
  wainscot: '#5f6d63',
  structure: '#8a7c70',
  night: '#5b4f88',
  nightLow: '#ec9f72',
  rim: 'rgba(255,226,180,0.7)',
  darkness: 0.2,
  glow: 0.8,
  leaf: '#3e5e48',
  leafLight: '#5c7f5c',
  leafDark: '#2c4536',
  vignette: 0.3,
  vignetteColor: '30,20,40',
};

/**
 * Le toit du train la nuit (D-86) : dehors, sous les étoiles ; le ciel du crépuscule devenu nuit.
 * PROVISOIRE.
 */
export const TRAIN_NIGHT_PALETTE: Readonly<ArtPalette> = {
  ...STREET_DUSK_PALETTE,
  wallTop: '#0e1330',
  wallBottom: '#2b356a',
  wallpaper: 'rgba(200,210,255,0.18)',
  night: '#16204c',
  nightLow: '#2b356a',
  structure: '#3a4058',
  rim: 'rgba(255,226,180,0.75)',
  stars: true,
  darkness: 0.3,
  glow: 1,
  vignette: 0.4,
  vignetteColor: '8,10,24',
};

/**
 * Le toit du train de jour (D-90), à quai au bord de la mer : un ciel clair, une lumière douce.
 * PLACEHOLDER.
 */
export const TRAIN_DAY_PALETTE: Readonly<ArtPalette> = {
  ...STREET_PALETTE,
  wallTop: '#8fc3ea',
  wallBottom: '#d6ecf5',
  night: '#8fc3ea',
  nightLow: '#f6e2c0',
  stars: false,
  darkness: 0,
  glow: 0.3,
};

/**
 * Finition de l'habillage (D-71), « papier découpé » : chaque plan est une feuille posée sur la
 * précédente, avec son ombre douce ; grain de papier ; ombres de contact ; ombre de Céleste au sol.
 * PROVISOIRE : à régler sur téléphone (overlay → « Habillage (finition) »). Distances en px
 * logiques ; 0 désactive un effet.
 */
export interface ArtFinish {
  /** Opacité de l'ombre portée par la couche jouable (murs, sol, meubles) sur le fond. */
  playShadow: number;
  /** Décalage de cette ombre (lumière venant d'en haut à gauche). */
  playShadowX: number;
  playShadowY: number;
  /** Flou de cette ombre. */
  playShadowBlur: number;
  /** Opacité de l'ombre portée par le fond proche (fenêtres, cadres, façades) sur le mur. */
  backShadow: number;
  /** Opacité de l'ombre de contact sous les meubles posés. */
  contactShadow: number;
  /** Opacité du grain de papier sur le décor. */
  grain: number;
  /** Opacité de l'ombre de Céleste au sol. */
  celesteShadow: number;
  /** Distance au-delà de laquelle l'ombre de Céleste disparaît (tuiles). */
  celesteShadowTiles: number;
  /** Multiplicateur du voile atmosphérique des palettes (1 : tel que défini). */
  veil: number;
  /** Multiplicateur du vignettage des palettes. */
  vignette: number;
}

export const DEFAULT_ART_FINISH: Readonly<ArtFinish> = {
  playShadow: 0.5,
  playShadowX: 3,
  playShadowY: 4,
  playShadowBlur: 4,
  backShadow: 0.3,
  contactShadow: 0.55,
  grain: 0.3,
  celesteShadow: 0.5,
  celesteShadowTiles: 6,
  veil: 1,
  vignette: 1,
};

/** Bornes des réglages en direct de l'overlay de debug. */
export const ART_FINISH_RANGES: Readonly<
  Record<keyof ArtFinish, { min: number; max: number; step: number }>
> = {
  playShadow: { min: 0, max: 1, step: 0.02 },
  playShadowX: { min: -6, max: 6, step: 0.5 },
  playShadowY: { min: -6, max: 8, step: 0.5 },
  playShadowBlur: { min: 0, max: 10, step: 0.5 },
  backShadow: { min: 0, max: 1, step: 0.02 },
  contactShadow: { min: 0, max: 1, step: 0.02 },
  grain: { min: 0, max: 0.5, step: 0.01 },
  celesteShadow: { min: 0, max: 1, step: 0.02 },
  celesteShadowTiles: { min: 1, max: 12, step: 1 },
  veil: { min: 0, max: 3, step: 0.1 },
  vignette: { min: 0, max: 2, step: 0.1 },
};

/**
 * Profondeur (D-72) : vitesse de défilement des plans lointains par rapport à la salle (0 : fixes à
 * l'écran, 1 : avec la salle) et de l'avant-plan (> 1 : plus vite). PROVISOIRE, à juger sur
 * téléphone.
 */
export const PARALLAX = {
  sky: 0.06,
  farHills: 0.16,
  midHills: 0.3,
  nearHills: 0.48,
  farRoofs: 0.28,
  nearRoofs: 0.45,
  /** Vue par les fenêtres : juste derrière la vitre (le ciel uni ne bouge pas, les toits un peu). */
  outside: 0.75,
  /** Avant-plan : silhouettes posées au bas de l'écran. */
  foreground: 1.35,
  /** Échelle maximale des textures des plans lointains : flous, ils n'ont pas besoin de plus. */
  maxScale: 1.5,
  /** Marge autour de la vue (tremblements, arrondis), px logiques. */
  marginPx: 48,
} as const;

/**
 * Le train en route (D-85) : derrière les vitres, le paysage de nuit défile (collines lointaines,
 * puis arbres, poteaux et maisons proches) ; la voiture a des secousses de temps en temps. Rien ne
 * touche à Céleste ni à la collision (pilier 1). PROVISOIRE.
 */
export const TRAIN_RIDE = {
  /** Plans derrière la vitre : ciel (immobile), collines, bord de la voie (parallaxe). */
  parallax: { sky: 0.75, hills: 0.82, near: 0.92 },
  /** Défilement à pleine vitesse (px logiques par seconde). */
  hillsScrollPxPerS: 22,
  nearScrollPxPerS: 170,
  /** Période du motif de chaque plan (px logiques) : il se répète sans couture. */
  hillsPeriodPx: 960,
  nearPeriodPx: 720,
  /** Mise en vitesse et ralentissement (fraction de la pleine vitesse par seconde). */
  accelPerS: 0.25,
  /** Secousses : intervalle (ms), durée (ms), force (fraction de `STRANGE_FX.shakePx`). */
  joltEveryMs: [6000, 11000] as readonly [number, number],
  joltMs: 320,
  joltStrength: 0.3,
  /** Lumières éteintes la nuit (`dim`) : obscurité de la salle, halos des lampes (liseuses éteintes). */
  dimDarkness: 0.74,
  dimGlow: 0.4,
} as const;

/**
 * Poursuite vers le haut (boss de la tour) : il est souvent sous le bas de l'écran (la vue monte au-
 * dessus de Céleste). Il dépasse alors au bas de l'écran (sa crête et la casquette), plus pâle
 * quand il est loin ; il se met en marche avec une secousse. Visuel seulement : la collision reste
 * celle du vrai front. PROVISOIRE.
 */
export const CHASE_VIEW = {
  /** Hauteur du liseré au-dessus du bas de l'écran quand il est dessous (px logiques). */
  peekPx: 10,
  /** Distance sous l'écran (tuiles) à laquelle la crête est la plus pâle. */
  peekFadeTiles: 10,
  /** Opacité la plus faible de la crête (au plus loin). */
  peekMinAlpha: 0.45,
  /** Secousse quand il se met en marche (ms, force en fraction de `STRANGE_FX.shakePx`). */
  wakeShakeMs: 700,
  wakeShakeStrength: 0.6,
} as const;

/**
 * Avant-plan (D-72) : herbes et fleurs posées au bas de l'écran, dehors seulement (dedans, des
 * jouets flous se lisaient comme des taches). PROVISOIRE.
 */
export const FOREGROUND = {
  /** Écart entre deux pièces (px du plan) et largeur d'une pièce. */
  spacing: { min: 90, max: 280, width: [26, 64] as [number, number] },
  /** Hauteur au-dessus du sol (px) : basse, et effacée près de ce qui compte. */
  minRisePx: 8,
  maxRisePx: 22,
  /** Flou (px logiques) : ce qui est trop près de l'objectif. */
  blurPx: 2,
  /** Opacité normale, et effacée près de Céleste, d'un ennemi, d'un danger ou d'un objet. */
  alpha: 0.78,
  fadedAlpha: 0.12,
  /** Marge autour de Céleste où une pièce s'efface (px). */
  fadeMarginPx: 44,
  /** Marge autour des dangers et objets de jeu au sol (px). */
  protectMarginPx: 8,
  /** Constante de temps de l'effacement (ms). */
  fadeTimeMs: 120,
} as const;

/**
 * Vie du monde réel (D-73) : nuages qui dérivent, oiseaux, feuilles et linge au vent. Doux, jamais
 * devant Céleste, jamais pris pour une surface. PROVISOIRE, à juger sur téléphone.
 */
export const WORLD_LIFE = {
  clouds: {
    /** Un nuage pour tant de px de large du plan du ciel. */
    spacingPx: 170,
    /** Dans les fenêtres (la nuit, devant la lune), plus espacés. */
    windowSpacingPx: 230,
    /** Vitesse de dérive (px/s), multipliée par le vent. */
    speedPxPerS: [3, 7] as [number, number],
  },
  birds: {
    /** Délai entre deux vols (ms). */
    everyMs: [12000, 28000] as [number, number],
    /** Durée de la traversée de l'écran (ms). */
    crossMs: 9000,
    count: [2, 4] as [number, number],
    /** Battement d'ailes (ms). */
    flapMs: 320,
  },
  leaves: {
    /** Feuilles à l'écran au plus. */
    count: 7,
    /** Chute (px/s) et poussée du vent (px/s, × vent). */
    fallPxPerS: [9, 16] as [number, number],
    windPxPerS: 22,
    /** Battement de la chute (amplitude px, période ms). */
    flutterPx: 5,
    flutterMs: 1600,
    alpha: 0.85,
  },
  laundry: {
    /** Balancement du linge (angle maximal par vent fort, radians ; période ms). */
    swayRad: 0.22,
    periodMs: 1300,
  },
  /** Le petit feu de la cheminée du salon (D-74) : une image toutes les ~ms, lueur. */
  fire: { frameMs: 110, glowMin: 0.28, glowMax: 0.5 },
  /** Le balancier de l'horloge comtoise (D-74) : angle maximal, aller-retour (ms). */
  pendulum: { swingRad: 0.085, periodMs: 2000 },
  /** Le mobile de la chambre (D-75) : un tour (ms). */
  mobile: { periodMs: 16000 },
  /** Étoiles de la veilleuse (D-75) : nombre, un tour (ms), opacité la nuit (le matin × 0,3). */
  nightStars: { count: 11, periodMs: 90000, alpha: 0.5 },
  /** Poussière dans la lumière (D-75) : grains, dérive (px/s), opacité. */
  dust: { count: 12, driftPxPerS: 3, alpha: 0.55 },
  /** Papillon de nuit (D-75) : un tour de la lampe (ms), rayon (px), battement (ms). */
  moth: { periodMs: 5200, radiusPx: 14, flapMs: 90 },
  /** Vapeur de la cafetière (D-75) : volutes, montée (px/s), opacité. */
  steam: { count: 6, risePxPerS: 9, alpha: 0.32 },
  /** Linge dans le hublot de la machine (D-75) : un tour du tambour (ms). */
  drum: { periodMs: 2600 },
  /** Balançoire du grand arbre (D-76) : angle maximal par vent fort (radians), aller-retour (ms). */
  swing: { swayRad: 0.1, periodMs: 3000 },
  /** Papillons (D-76) : nombre, un tour de leur boucle (ms), battement d'ailes (ms). */
  butterfly: { count: 2, periodMs: 9000, flapMs: 140 },
  /** Ampoules de la guirlande (D-76) : balancement (px par vent fort). */
  garland: { swayPx: 2.5 },
  /** Fumée des cheminées de la rue (D-77) : volutes par cheminée, montée (px/s), dérive au vent. */
  smoke: { count: 5, risePxPerS: 7, windPx: 14, alpha: 0.6 },
  /** Drapeau de l'école (D-77) : une vague (ms). */
  flag: { periodMs: 900 },
  /** Supérette (D-78) : tour du ventilateur (ms) ; clignotement du tube de la réserve. */
  fan: { periodMs: 700 },
  tubeFlicker: { everyMs: [4000, 9000] as [number, number], blinkMs: 90, blinks: 3 },
  /** Volets du tableau des départs du hall (D-80) : combien, et l'écart entre deux bascules (ms). */
  flaps: { count: 7, everyMs: [1200, 5000] as [number, number] },
  /** Bâche du chantier (D-78) : une vague (ms). */
  tarp: { periodMs: 1100 },
  /** Pigeon de la cour (D-79) : distance d'envol (px), vol (px/s), retour (ms, Céleste loin). */
  pigeon: { scareDistancePx: 48, flyPxPerS: 90, returnMs: 15000, returnDistancePx: 160 },
  /** Le hérisson du jardin (D-155) : sa marche (px/s), roulé en boule en deçà, déroulé au-delà (px). */
  hedgehog: { walkPxPerS: 6, curlPx: 40, uncurlPx: 72 },
  /** Poisson rouge (D-79) : un aller-retour dans le bocal (ms). */
  fish: { periodMs: 5200 },
} as const;

/** Rayon du halo d'une veilleuse (px logiques). */
/**
 * L'eau (D-95, D-97), PLACEHOLDER : un bleu-vert qui fonce avec la profondeur (`deepRows` lignes
 * jusqu'au plus sombre), la ligne de surface plus claire. En silhouettes (monde étrange), plus
 * sombre, l'écume turquoise.
 */
export const WATER_COLORS = {
  body: [70, 140, 160] as const,
  deep: [28, 70, 98] as const,
  strangeBody: [26, 54, 74] as const,
  strangeDeep: [10, 22, 36] as const,
  alpha: 0.86,
  deepRows: 5,
  surface: 'rgba(190,232,236,0.9)',
  strangeSurface: 'rgba(110,230,215,0.8)',
} as const;

/**
 * L'effacement (D-111) : là où il n'y a plus rien (`; @void: erasure`), les tuiles d'eau se
 * dessinent en une décoloration grise et pâle, sans vaguelettes (grise plutôt que blanche, pour ne
 * pas se confondre avec le torchon blanc). Tomber dedans fait comme l'eau (D-97). PLACEHOLDER.
 */
export const ERASURE_COLORS = {
  body: [176, 172, 190] as const,
  deep: [128, 124, 146] as const,
  alpha: 0.9,
  surface: 'rgba(236,234,242,0.85)',
  /** Salles de tuiles (les parcours). */
  tile: 0xb4b0c4,
} as const;

/**
 * Le vide de la nuit (D-142) : tout en bas du ciel de la chambre (`; @void: night`), les tuiles d'eau
 * sont le noir de la chambre, loin dessous : un bleu de nuit qui s'assombrit, sans vaguelettes ni
 * reflet. Y tomber ramène au dernier appui, sans peur. PLACEHOLDER.
 */
export const NIGHT_VOID_COLORS = {
  body: [34, 40, 82] as const,
  deep: [12, 14, 34] as const,
  alpha: 0.82,
  surface: 'rgba(150,170,230,0.18)',
  /** Salles de tuiles (les parcours). */
  tile: 0x1c2148,
} as const;

/** La surface animée de l'eau (D-97, `WaterView`) : vaguelettes qui défilent. PROVISOIRE. */
export const WATER_LIFE = {
  /** Motif répété (px) et hauteur de la bande (px). */
  periodPx: 32,
  heightPx: 6,
  speedPxPerS: 9,
  crest: 0xe2f4f2,
  foam: 0xffffff,
  strangeCrest: 0x7fe9da,
  strangeFoam: 0xc8fff6,
  /** Les vagues des rochers (D-99) : l'opacité de la bande d'écume quand elle balaie. */
  waveBandAlpha: 0.55,
} as const;

/** Les chaises volantes (D-101, `RideView`) : leur nombre, leur vitesse, leur hauteur au calme. */
export const RIDE_LOOK = {
  chairs: 6,
  turnsPerS: 0.35,
  /** Au calme, elles tournent tant de tuiles au-dessus de leur zone. */
  raisedTiles: 5,
} as const;

export const LAMP_LIGHT_RADIUS = 110;
/** Rayon de la lumière de la lune autour d'une fenêtre (px logiques). */
export const MOON_LIGHT_RADIUS = 90;
/** Échelle maximale des textures d'habillage (au-delà, mémoire excessive sur téléphone). */
export const MAX_ART_SCALE = 3;

/**
 * La bascule (D-107) : le dessin des deux couches d'une salle. Ce qui n'existe que dans la couche
 * active est dessiné plein ; ce qui n'existe que dans l'autre reste visible en contour fantôme, pour
 * qu'on puisse prévoir. Dans une salle habillée, chaque couche prend sa palette (le présent : celle
 * de la salle, en silhouettes ; le souvenir : `MEMORY_PALETTE`) ; ces couleurs servent aux contours,
 * aux salles de tuiles (les parcours) et aux signes. PLACEHOLDER.
 */
export const SHIFT_LAYER_VIEW = {
  present: { fill: 0x4a3470, edge: 0x3fd6c8 },
  memory: { fill: 0xd3a985, edge: 0xf2c99a },
  /** Contour fantôme de la couche inactive : épaisseur (px logiques) et opacité. */
  ghostLine: 1,
  ghostAlpha: 0.55,
  /** Câbles de la couche inactive (D-114) : un fil fin, à cette opacité. */
  ghostCableAlpha: 0.35,
  /** Voile très léger à l'intérieur du contour fantôme (opacité). */
  ghostFillAlpha: 0.12,
  /** Dans le souvenir, un voile chaud recouvre la vue (couleur, opacité). */
  memoryVeil: 0xffc68a,
  memoryVeilAlpha: 0.12,
  /** Refus (place manquante) : un petit cercle qui s'ouvre autour de Céleste et s'efface (ms). */
  refuseMs: 320,
  refuseRadiusPx: 14,
  /** Bascule réussie : un éclair bref de la couleur de la nouvelle couche (ms). */
  flashMs: 160,
} as const;

/**
 * Les étoiles de la berceuse (D-140, `LullabyView`), PLACEHOLDER : une planche de lumière, une
 * étoile au milieu, un halo. Allumée : chaude et nette ; éteinte : un contour en pointillés, pour
 * prévoir. Une étoile qui va s'allumer s'éclaire peu à peu ; une qui va s'éteindre vacille.
 */
export const LULLABY_VIEW = {
  light: 0xffe6a6,
  core: 0xfff8e4,
  halo: 0xffd98a,
  /** Halo d'une étoile allumée : anneaux ajoutés à la lumière (opacité de chacun, rayon en px). */
  haloAlpha: 0.09,
  haloRadiusPx: 13,
  haloRings: 4,
  /** Hauteur de la planche de lumière (px logiques), le dessus de la tuile. */
  plankPx: 4,
  /** Rayon de l'étoile au milieu de la planche (px logiques). */
  starRadiusPx: 5,
  /** Éteinte : le contour (couleur, opacité, longueur des tirets en px). */
  dark: 0xc9b98f,
  darkAlpha: 0.45,
  dashPx: 3,
  /** Une étoile qui s'annonce : battement du vacillement (ms). */
  flickerMs: 110,
} as const;
