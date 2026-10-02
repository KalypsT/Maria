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
  /** Armoire à linge sur pieds, près de la porte de derrière (buanderie, D-46). */
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
  /** Suspension : un fil, un abat-jour, de la lumière dessous (fond). */
  pendant: { furniture: false },
  /** Portemanteau sur pied, manteaux et écharpe (fond). */
  coatstand: { furniture: false },
  /** Grande plante en pot posée au sol (fond). */
  floorplant: { furniture: false },
  /** Poussière qui danse dans un rayon de lumière (animée). */
  dust: { furniture: false },
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
  /** Local à vélos (plein) : on arrive sur son toit. */
  bikeshed: { furniture: true },
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
  /** Couvercle géant d'une boîte à formes (plein, avec son trou). */
  sorterlid: { furniture: true },
  cushions: { furniture: false },
  // Revisites avec le crochet (D-66).
  /** Jardinière sous la fenêtre de la chambre (planche traversable), au bout du fil à linge. */
  windowbox: { furniture: true },
  /** Nid dans le platane de la rue (perchoir traversable), au bout du fil tendu depuis l'école. */
  nest: { furniture: true },
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
  /** Pilier de fonte de la marquise (plein). */
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
  /** Haute armoire de rangement (pleine). */
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
};

/** Revêtement du mur d'une salle (`; @wall:`), dessiné par le code. */
export const WALL_STYLES = ['dots', 'stripes', 'planks', 'tiles'] as const;
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
  /** Drapeau de l'école (D-77) : une vague (ms). Queue du chat : un aller-retour (ms). */
  flag: { periodMs: 900 },
  catTail: { periodMs: 2600, swingRad: 0.35 },
  /** Supérette (D-78) : tour du ventilateur (ms) ; clignotement du tube de la réserve. */
  fan: { periodMs: 700 },
  tubeFlicker: { everyMs: [4000, 9000] as [number, number], blinkMs: 90, blinks: 3 },
  /** Volets du tableau des départs du hall (D-80) : combien, et l'écart entre deux bascules (ms). */
  flaps: { count: 7, everyMs: [1200, 5000] as [number, number] },
  /** Bâche du chantier (D-78) : une vague (ms). */
  tarp: { periodMs: 1100 },
  /** Pigeon de la cour (D-79) : distance d'envol (px), vol (px/s), retour (ms, Céleste loin). */
  pigeon: { scareDistancePx: 48, flyPxPerS: 90, returnMs: 15000, returnDistancePx: 160 },
  /** Poisson rouge (D-79) : un aller-retour dans le bocal (ms). */
  fish: { periodMs: 5200 },
} as const;

/** Rayon du halo d'une veilleuse (px logiques). */
export const LAMP_LIGHT_RADIUS = 110;
/** Rayon de la lumière de la lune autour d'une fenêtre (px logiques). */
export const MOON_LIGHT_RADIUS = 90;
/** Échelle maximale des textures d'habillage (au-delà, mémoire excessive sur téléphone). */
export const MAX_ART_SCALE = 3;
