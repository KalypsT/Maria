import type { PropKind } from '../core/story/story';

/**
 * Histoire (§33, D-31) : identifiants des étapes (drapeaux) et durées de mise en scène. Le contenu
 * narratif est un PLACEHOLDER (§45), décrit en données dans `src/levels/<zone>/story.ts`.
 */
export const StoryFlag = {
  /** Le soir : Céleste a joué avec Maria. */
  EveningPlayed: 'evening.played',
  /** Le soir : Céleste a pris la couverture de Maria sur l'étagère. */
  EveningBlanket: 'evening.blanket',
  /** Le soir : Maria est couchée dans son berceau. */
  EveningTucked: 'evening.tucked',
  /** Céleste s'est couchée : la nuit a passé, c'est le matin et Maria n'est plus là. */
  Slept: 'prologue.slept',
  /** Traces de Maria aperçues (couloir, escalier). */
  TraceHall: 'trace.hall',
  TraceStairs: 'trace.stairs',
  /** Maria aperçue en haut de la bibliothèque du salon. */
  MariaSeen: 'living.seen',
  /**
   * Céleste est arrivée en haut : Maria n'y est plus, Céleste est passée dans le salon étrange
   * (première fois ; ensuite, le haut de la bibliothèque y ramène tant que la fin n'est pas vécue).
   */
  MariaVanished: 'living.vanished',
  /**
   * Fin du monde étrange (D-34) : le berceau vide en haut du passage d'ombres ; Céleste se
   * retrouve sur son lit, à côté du bandeau de Maria.
   */
  StrangeDone: 'strange.done',
  /** Le soir : maman est venue dire bonne nuit (papa n'est plus à la porte). */
  EveningGoodnight: 'evening.goodnight',
  /** Au matin, Céleste a parlé de Maria à papa (cuisine) et à maman (salon). */
  MorningDad: 'morning.dad',
  MorningMom: 'morning.mom',
  /** Céleste a caressé le chat. */
  CatPetted: 'cat.petted',
  /** Après le monde étrange, papa est passé voir Céleste (il montre maman). */
  DadVisit: 'end.dad',
  /** Câlin de maman au salon (D-58) ; puis la nuit tombe, il faut aller se coucher. */
  MomHug: 'end.mom-hug',
  /** Les affaires de Maria ramassées (D-58) : elles quittent le jeu pour le cahier. */
  SlipperTaken: 'maria.slipper',
  BottleTaken: 'maria.bottle',
  HeadbandTaken: 'maria.headband',
  BonnetTaken: 'maria.bonnet',
  /** Papa a montré le portillon, après le bonnet (D-60). */
  GardenDadGate: 'garden.dad-gate',
  /** Le portillon au bout de l'allée est ouvert (chevillette tirée, D-60) : la rue. */
  GateOpen: 'garden.gate',
  /** À l'aire de jeux (D-61), Céleste a parlé de Maria à maman, assise sur un banc. */
  StreetMom: 'street.mom',
  /** À la supérette (D-63), Céleste a parlé de Maria à papa, qui fait les courses. */
  StreetDad: 'street.dad',
  /** La porte de l'école, poussée de l'intérieur (D-64) : un raccourci vers la rue. */
  SchoolOpen: 'school.open',
  /** L'école étrange (D-64) : Céleste y est passée par l'oculus (première fois). */
  SchoolStrange: 'school.strange',
  /**
   * Fin de l'école étrange (D-64) : la boîte à formes ; Céleste dans la cour au crépuscule, maman
   * vient la chercher ; la nuit, une lueur au loin par la fenêtre.
   */
  SchoolDone: 'school.done',
  /** Le lendemain matin (D-64) : la palissade du chantier s'est ouverte. */
  StreetMorning: 'street.morning',
  /** Le matin, maman montre le chantier (D-64). */
  StreetMomCrane: 'street.mom-crane',
  /** La gare (D-66) : Céleste est arrivée sur les voies, derrière la palissade du chantier. */
  StationArrived: 'station.arrived',
  /** Le monde étrange de la gare (D-68) : Céleste y est passée par le haut des casiers. */
  StationStrange: 'station.strange',
  /** Fin du monde étrange de la gare (D-68) : Roger, et son court souvenir. */
  StationDone: 'station.done',
  /**
   * Quelques mois plus tard, après la gare (D-69) : papa est venu chercher Céleste sous l'horloge du
   * hall, la nuit est passée, puis des mois ; elle a encore grandi (phase de croissance 3).
   */
  GrownOlder: 'growth.3',
  /** Le train à quai (D-69) : Céleste a vu sa porte ouverte et sa lueur turquoise. */
  StationTrain: 'station.train',
  /**
   * Le train (D-85) : le soir du départ de la classe de mer, sur le quai (la maîtresse, les
   * enfants, les parents qui disent au revoir).
   */
  TrainBoarding: 'train.boarding',
  /** Le train est parti : Céleste est dans la voiture-couchettes, en route (D-85). */
  TrainDeparted: 'train.departed',
  /** La camarade a glissé sous la grille ; Céleste a appris la glissade (D-84, D-85). */
  TrainSlide: 'train.slide',
  /** La nuit dans le train (D-85) : tout le monde dort ; une lueur passe dans le couloir. */
  TrainNight: 'train.night',
  /** Le contrôleur, bienveillant, a vu passer Céleste (D-86). */
  TrainConductor: 'train.conductor',
  /** La porte du wagon-restaurant, poussée de l'intérieur (D-86) : une boucle avec le fourgon. */
  TrainRestaurantOpen: 'train.restaurant-open',
  /** Le monde étrange du train (D-88) : Céleste y est passée par la porte de la cuisine. */
  TrainStrange: 'train.strange',
  /** Fin du monde étrange du train (D-88) : la cuisine rose, au bout du train de la vaisselle. */
  TrainStrangeDone: 'train.strange-done',
  /** Le matin dans le train (D-90) : la maîtresse réveille Céleste ; la mer à la fenêtre. */
  TrainMorning: 'train.morning',
  /**
   * Le train est arrivé à la gare de la mer (D-90) : à quai, de jour, immobile, sans passagers ; il
   * relie la gare de la mer et la gare de la ville.
   */
  TrainArrived: 'train.arrived',
  /**
   * La station balnéaire (D-98) : la classe a quitté la gare de la mer pour le centre ; Céleste est
   * libre sur la promenade.
   */
  SeaArrived: 'sea.arrived',
  /**
   * La première marée (D-99) : pendant la pêche à pied, la mer monte, la maîtresse rappelle la
   * classe sur la promenade ; les bancs des marées servent ensuite.
   */
  SeaFirstTide: 'sea.first-tide',
  /**
   * Du haut du phare (D-100), Céleste a vu la lueur sous le carrousel bâché, au bout de la jetée : la
   * fête du soir viendra (PR 5).
   */
  SeaSawCarousel: 'sea.saw-carousel',
  /**
   * Le soir de la fête (D-101) : la maîtresse emmène la classe sur la jetée ; toute la baie passe au
   * soir.
   */
  SeaEvening: 'sea.evening',
  /**
   * Le monde étrange de la station balnéaire (D-102) : le soir, Céleste est passée par le carrousel
   * dans la fête engloutie.
   */
  SeaStrange: 'sea.strange',
  /**
   * Fin du monde étrange de la station balnéaire (D-104) : au bout de la vague, le livre musical,
   * sur le toit du carrousel étrange.
   */
  SeaStrangeDone: 'sea.strange-done',
  /**
   * La fin de la station balnéaire (D-105) : au bout du couloir en boucle, la porte qui n'était pas
   * là ; le noir. La suite (le niveau 7) reste à venir.
   */
  SeaEnd: 'sea.end',
  /**
   * La marée est haute (D-95), à la station balnéaire : la seule étape réversible (les bancs des
   * marées la posent et la retirent). Les salles de marée prennent leur variante haute.
   */
  TideHigh: 'sea.tide-high',
  /** Quelques mois plus tard (D-43) : Céleste a grandi (phase de croissance 2). */
  Grown: 'growth.2',
  /** Le jardin (D-46) : Céleste est sortie pour la première fois (il fait beau, et Maria ?). */
  GardenArrived: 'garden.arrived',
  /** Au jardin, Céleste a parlé de Maria à maman (terrasse) et à papa (potager). */
  GardenMom: 'garden.mom',
  GardenDad: 'garden.dad',
  /** Papa a montré la haie, une fois le saut mural trouvé (D-55). */
  GardenDadHedge: 'garden.dad-hedge',
  /** Céleste a regardé dans le trou de la haie, au fond du jardin. */
  GardenHedge: 'garden.hedge',
  /** Céleste a trouvé la cabane dans l'arbre (et le saut mural). */
  GardenTreehouse: 'garden.treehouse',
  /** Derrière la haie (D-49) : Céleste est passée dans le jardin renversé (première fois). */
  HedgeEntered: 'hedge.entered',
  /** Fin de derrière la haie : le bonnet de Maria ; Céleste revient au pied du grand arbre. */
  HedgeDone: 'hedge.done',
  /**
   * L'avant-dernier niveau (D-107, D-110) : derrière la porte du couloir, la même nuit, l'entrée de
   * la maison de la nounou, démesurée.
   */
  NannyArrived: 'nanny.arrived',
  /**
   * Le miroir de l'entrée (D-110) : le reflet de Céleste toute petite est passé de l'autre côté ;
   * Céleste l'imite, elle a appris la bascule.
   */
  NannyMirror: 'nanny.mirror',
  /** La maison de la nounou (D-110) : Céleste y est entrée (le reflet n'est plus là). */
  NannyHouse: 'nanny.house',
  /**
   * L'îlot de mémoire 1 (D-112) : en haut de l'arrosoir du jardin renversé, Roger ; son court
   * souvenir ; le passage vers la maison s'ouvre, une veilleuse s'allume sur la porte de la sieste.
   */
  NannyBedDone: 'nanny.bed-done',
  /**
   * L'îlot de mémoire 2 (D-113) : sur l'abribus de la rue d'autrefois, la boîte à formes ; les
   * passages vers la maison et la chambre d'autrefois s'ouvrent, une veilleuse jaune s'allume.
   */
  NannySchoolDone: 'nanny.school-done',
  /**
   * L'îlot de mémoire 3 (D-114) : sur le toit du train d'autrefois, la cuisine rose ; les passages
   * vers la maison et la rue d'autrefois s'ouvrent, une veilleuse turquoise s'allume.
   */
  NannyStationDone: 'nanny.station-done',
  /**
   * L'îlot de mémoire 4 (D-115) : sur le toit du carrousel d'autrefois, le livre musical et son
   * court souvenir ; les passages vers la maison et le train d'autrefois s'ouvrent, une veilleuse
   * bleue s'allume.
   */
  NannySeaDone: 'nanny.sea-done',
  /**
   * Le torchon blanc (D-116) : dans le petit lit de la chambre de la sieste ; son court souvenir
   * (Céleste toute petite le serre contre elle) ; un souvenir du monde étrange.
   */
  NannyClothDone: 'nanny.cloth-done',
  /**
   * Le boss, l'effacement (D-117) : après le torchon, Céleste est en bas de la cage d'escalier, la
   * décoloration monte derrière elle ; puis la salle de jeux.
   */
  NannyErasure: 'nanny.erasure',
  /** La salle de jeux (D-117) : le premier, le deuxième, le troisième objet rallumé. */
  NannyPlay1: 'nanny.play-1',
  NannyPlay2: 'nanny.play-2',
  NannyPlay3: 'nanny.play-3',
  /** Le quatrième objet : l'effacement se dissout, la porte de la salle de jeux s'ouvre (D-117). */
  NannyErasureGone: 'nanny.erasure-gone',
  /**
   * Eden (D-118) : dans la salle de jeux rendue à ses couleurs, Céleste l'a reconnu ; le souvenir
   * jouable ; puis Eden n'est plus là.
   */
  NannyEden: 'nanny.eden',
  /**
   * La fin du niveau 7 (D-119) : après Eden, le réveil au dortoir de la classe de mer, à l'aube ;
   * puis le train du retour.
   */
  NannyWake: 'nanny.wake',
  /**
   * Quelques mois plus tard (D-119, comme D-43 et D-69) : Céleste a encore grandi (phase de
   * croissance 4). Le niveau 8, le monde de Maria, commencera ainsi.
   */
  GrownFourth: 'growth.4',
  /**
   * Le disque « Les Aventures de Céleste » ramassé (D-121), au bureau des objets trouvés de la
   * gare : il quitte la salle pour le tourne-disque du grenier.
   */
  RecordAdventures: 'record.adventures',
} as const;
export type StoryFlag = (typeof StoryFlag)[keyof typeof StoryFlag];

/**
 * Drapeaux donnés à une partie commencée avant l'histoire (migration v1 → v2 de la sauvegarde) :
 * le prologue est considéré comme vécu, on ne renvoie pas le joueur au coucher.
 */
export const LEGACY_STORY_FLAGS: readonly string[] = [
  StoryFlag.EveningPlayed,
  StoryFlag.EveningBlanket,
  StoryFlag.EveningTucked,
  StoryFlag.EveningGoodnight,
  StoryFlag.Slept,
];

/**
 * Mise en scène (ms). PROVISOIRE : à régler sur téléphone. Retour de l'utilisateur : ralentir
 * l'histoire pour que le joueur s'en imprègne (bulles plus longues, nuit et bascule plus lentes).
 */
export const STORY_TIMING = {
  /** Fondu court (jouer, coucher Maria). */
  fadeMs: 600,
  /** Fondu de la nuit (Céleste s'endort, puis se réveille). */
  nightFadeOutMs: 1900,
  nightBlackMs: 2000,
  nightFadeInMs: 2600,
  /** Durée d'affichage d'une bulle de pensée. */
  thoughtMs: 3000,
  /** Apparition et disparition d'une bulle. */
  thoughtFadeMs: 250,
  /** Plan fixe (Céleste joue avec Maria, la regarde dormir). */
  holdMs: 2600,
  /** Céleste s'arrête pour regarder (trace, Maria aperçue, retour dans la chambre). */
  lookMs: 1400,
  /** Délai minimal entre deux bulles « c'est l'heure de dormir » à une porte fermée. */
  lockedExitThoughtMs: 3500,
  /** Bascule vers le monde étrange : un clignement, un noir, puis le retour lent. */
  blinkOutMs: 300,
  blinkBlackMs: 700,
  blinkInMs: 1500,
  /** Retour dans le monde étrange après un échec : clignement plus bref, sans bulle. */
  reblinkInMs: 800,
  /** Avant le clignement (D-35) : scintillements et tremblement, Céleste immobile. */
  omenPeakMs: 1100,
  /** Retour bref après un échec : scintillements plus courts. */
  reomenPeakMs: 500,
  /** Fin : scintillements autour du berceau avant que le cercle se referme sur Céleste. */
  cradleSparkleMs: 1400,
  /** Quelques mois plus tard (D-43) : le noir le plus long du jeu, puis le retour lent. */
  monthsBlackMs: 4200,
  /** Au matin dans le train (D-90) : Céleste regarde la mer à la fenêtre. */
  seaLookMs: 2400,
  /** Le train ralentit jusqu'à l'arrêt (à `TRAIN_RIDE.accelPerS`, 0,25 par seconde : 4 s). */
  trainStopMs: 4400,
  monthsFadeInMs: 3200,
  /** Court souvenir (D-68) : la vignette, apparition et disparition comprises. */
  flashbackMs: 7000,
} as const;

/** Période du petit mouvement en boucle des personnages (ms), D-37. */
export const CHARACTER_LOOP_MS = { parent: 1600, cat: 2400 } as const;

/** Agrandissement des bulles de pensée (retour de l'utilisateur : mieux lisibles sur téléphone). */
export const THOUGHT_SCALE = 1.9;

/**
 * Agrandissement des parents (D-37) par rapport à leur dessin de référence (62 px debout, environ
 * 2,4 fois Céleste). PROVISOIRE : à choisir sur maquettes avec l'utilisateur.
 */
export const PARENT_SCALE = 2;
/**
 * Agrandissement du chat (D-42) : vu à hauteur d'enfant, comme les parents. Assis, sa tête arrive
 * à celle de Céleste. PROVISOIRE, à régler sur téléphone.
 */
export const CAT_SCALE = 2;

/**
 * Taille des objets de mise en scène (px logiques). Maria est un peu plus grande qu'un vrai poupon à
 * côté d'une enfant, pour rester lisible à la taille du jeu.
 */
export const PROP_SIZE = {
  'maria-sit': { w: 8, h: 13 },
  cradle: { w: 30, h: 16 },
  'cradle-maria': { w: 30, h: 16 },
  'cradle-undone': { w: 30, h: 16 },
  slipper: { w: 7, h: 4 },
  bottle: { w: 9, h: 5 },
  headband: { w: 10, h: 5 },
  blanket: { w: 10, h: 5 },
  // Parents (D-37) : à hauteur d'enfant, bien plus grands que Céleste (environ 26 px) ; taille
  // réglée par PARENT_SCALE (le dessin s'agrandit). Largeur avec la marge de la main tendue.
  'dad-door': { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'dad-kitchen': { w: 40 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'mom-bed': { w: 36 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  'mom-sofa': { w: 38 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  // Au jardin (D-46).
  'mom-garden': { w: 40 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  // À l'aire de jeux (D-61), sur un banc.
  'mom-bench': { w: 38 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  // À la supérette (D-63), un panier à la main.
  'dad-shop': { w: 44 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  // Dans la cour de l'école au crépuscule (D-64), maman vient chercher Céleste.
  'mom-yard': { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  // Sous l'horloge du hall de la gare, la nuit (D-69), papa vient chercher Céleste.
  'dad-hall': { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  // La boîte à formes (D-64), dans le monde étrange ; la grue au loin par la fenêtre de la chambre ;
  // la palissade du chantier ouverte, le lendemain.
  'shape-box': { w: 40, h: 32 },
  'far-crane': { w: 44, h: 34 },
  'site-gap': { w: 80, h: 64 },
  // Le train à quai (D-69), quelques mois après la gare : une voiture et le nez de la suivante.
  'quay-train': { w: 200, h: 66 },
  'quay-train-day': { w: 200, h: 66 },
  // Roger, la peluche singe (D-68), tout en haut de la tour des objets perdus.
  roger: { w: 16, h: 18 },
  // La cuisine rose (D-88), la dînette d'enfance, à peu près à hauteur de Céleste.
  'pink-kitchen': { w: 32, h: 32 },
  // Le livre musical (D-104), un gros livre cartonné posé sur le toit du carrousel.
  'music-book': { w: 24, h: 24 },
  // Le souvenir jouable de la cuisine (D-89), à l'échelle de Céleste toute petite.
  'toy-kitchen': { w: 30, h: 30 },
  'tea-table': { w: 64, h: 30 },
  'tea-cup': { w: 6, h: 5 },
  // Le reflet du miroir de la nounou (D-110) : Céleste toute petite, plus petite qu'elle.
  reflection: { w: 16, h: 26 },
  'reflection-through': { w: 16, h: 26 },
  // Une veilleuse de la porte de la sieste (D-112) : la lueur en haut, à la place de la veilleuse
  // éteinte dessinée sur la porte.
  'nap-light-bed': { w: 12, h: 24 },
  'nap-light-school': { w: 12, h: 24 },
  'nap-light-station': { w: 12, h: 24 },
  'nap-light-sea': { w: 12, h: 24 },
  // Le torchon blanc (D-116), plié dans le petit lit de la sieste.
  'white-cloth': { w: 20, h: 14 },
  // La salle de jeux (D-117) : les objets pâlis (même taille que les vrais), les couleurs qui
  // reviennent, l'effacement au centre.
  'shape-box-pale': { w: 40, h: 32 },
  'pink-kitchen-pale': { w: 32, h: 32 },
  'roger-pale': { w: 16, h: 18 },
  'music-book-pale': { w: 24, h: 24 },
  'color-bloom': { w: 112, h: 80 },
  'erasure-figure': { w: 96, h: 72 },
  // Le souvenir d'Eden (D-118), à l'échelle de Céleste toute petite ; la nounou, à hauteur d'enfant.
  'eden-small': { w: 16, h: 20 },
  'eden-peek': { w: 16, h: 20 },
  'eden-laugh': { w: 16, h: 22 },
  'nanny-shadow': { w: 40 * PARENT_SCALE, h: 46 * PARENT_SCALE },
  'cube-pile': { w: 24, h: 14 },
  'cube-tower-1': { w: 10, h: 10 },
  'cube-tower-2': { w: 10, h: 18 },
  'cube-tower-4': { w: 10, h: 32 },
  'dad-garden': { w: 44 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  // Le train (D-85) : sur le quai, la maîtresse et les parents (à hauteur d'enfant), les enfants
  // et leurs sacs ; dans la voiture-couchettes, des enfants de la taille de Céleste.
  teacher: { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'mom-quay': { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'dad-quay': { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'kids-quay': { w: 48, h: 32 },
  classmate: { w: 18, h: 32 },
  'classmate-slid': { w: 26, h: 24 },
  'classmate-asleep': { w: 30, h: 12 },
  'kid-cap-sit': { w: 22, h: 24 },
  'kid-bob-sit': { w: 22, h: 24 },
  'kid-asleep': { w: 30, h: 12 },
  // Le reste du train (D-86) : la maman qui berce son bébé, le contrôleur, des voyageurs endormis,
  // le chien du fourgon.
  'mother-baby': { w: 38 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  conductor: { w: 42 * PARENT_SCALE, h: 62 * PARENT_SCALE },
  'sleeper-seat': { w: 38 * PARENT_SCALE, h: 44 * PARENT_SCALE },
  'dog-sleep': { w: 30, h: 16 },
  // Le chat gris, agrandi par CAT_SCALE (D-42).
  'cat-sleep': { w: 16 * CAT_SCALE, h: 8 * CAT_SCALE },
  'cat-sit': { w: 12 * CAT_SCALE, h: 14 * CAT_SCALE },
  // Objets à regarder (D-38).
  'music-box': { w: 10, h: 11 },
  // Le tourne-disque du grenier (D-121), sur la malle.
  'record-player': { w: 20, h: 12 },
  // Un disque perdu dans sa pochette (D-121).
  'record-adventures': { w: 10, h: 10 },
  plant: { w: 10, h: 16 },
  'baby-photo': { w: 11, h: 10 },
  'height-chart': { w: 7, h: 40 },
  'height-chart-grown': { w: 7, h: 40 },
  'height-chart-older': { w: 7, h: 40 },
  'height-chart-fourth': { w: 7, h: 40 },
  bonnet: { w: 14, h: 12 },
  // Le portillon au bout du passage sous le vieux mur (D-60), fermé puis ouvert.
  gate: { w: 14, h: 46 },
  'gate-open': { w: 14, h: 46 },
} as const satisfies Readonly<Record<PropKind, { w: number; h: number }>>;
