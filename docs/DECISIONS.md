# Décisions techniques

Décisions validées. Elles priment sur `MARIA_Specifications.md` en cas d'écart.
Chaque entrée : décision, raison, conséquences. Une décision ne se modifie qu'avec validation explicite.

## D-01 — Résolution logique

- **Décision** : hauteur logique fixe de **360 px** ; largeur calculée selon le ratio de l'écran, bornée entre **640** (16:9) et **800** (20:9). Au-delà, bandes noires (mode `FIT`).
- **Raison** : 360 × 3 = 1080 px physiques, hauteur courante des téléphones en paysage. Les écrans larges voient un peu plus de décor au lieu d'avoir des bandes noires.
- **Conséquences** : champ de vision horizontal légèrement variable selon l'appareil ; aucun secret ni saut ne doit dépendre de ce surplus. Calcul dans `src/core/gameSize.ts` (fonction pure testée).
- **Note** : le mode `EXPAND` de Phaser a été écarté car ses bornes `min`/`max` limitent aussi la taille d'affichage CSS (le canvas n'est plus agrandi à l'écran).
- À réajuster après essais sur téléphone si besoin.

## D-02 — Tuiles de 16 px

- **Décision** : tuiles de **16 × 16 px** logiques (≈ 22 tuiles de haut à l'écran).
- **Conséquences** : la taille apparente du personnage se règle par le **zoom caméra**, pas par la taille des tuiles, pour ne pas refaire les niveaux.

## D-03 — Mise à l'échelle, encoche, orientation

- `Phaser.Scale.FIT` + `CENTER_BOTH`, `pixelArt: true` tant que la direction artistique n'est pas validée.
- `viewport-fit=cover` : le canvas passe sous l'encoche ; l'interface future respectera `env(safe-area-inset-*)` (variables CSS `--safe-*` dans `src/style.css`).
- Message « Tourne ton téléphone » en **HTML/CSS** (media query `orientation: portrait`), indépendant de Phaser.
- Gestes navigateur neutralisés (`touch-action`, `overscroll-behavior`, `user-select`). Le balayage retour depuis le bord sur iOS ne peut pas l'être : zone tactile gauche décalée du bord (Phase 3).
- Verrouillage d'orientation : manifeste PWA `landscape` (Android installé) ; `screen.orientation.lock()` n'est pas fiable (iOS : jamais).

## D-04 — Phaser 4

- **Décision** : **Phaser 4.2.x** au lieu de Phaser 3 (spec §29.1).
- **Raison** : Phaser 4 est la branche maintenue ; la 3.90 (mai 2025) est figée. Avec une physique maison, on utilise surtout le rendu, les scènes et l'input : risque faible.
- **Conséquences** : moins d'exemples en ligne que pour Phaser 3 ; import `import Phaser from 'phaser'`.

## D-05 — Physique : contrôleur maison à pas de temps fixe

- **Décision** : pas d'Arcade Physics pour le joueur. Module TypeScript pur, **pas de temps fixe 1/120 s** (accumulateur, nombre de pas par image plafonné), collisions AABB contre grille de tuiles par axes séparés, plateformes traversables par le haut. Phaser ne fait que l'affichage, avec interpolation.
- **Raison** : pilier « précision avant réalisme » ; comportement déterministe et identique à 60/90/120/144 Hz ; testable avec Vitest sans Phaser.
- **Condition de validation (utilisateur)** : le contrôleur doit être **au moins aussi efficace qu'Arcade** — mesuré en Phase 1 (temps CPU par pas, 60 FPS stables sur téléphone réel, aucune allocation par frame, ressenti).
- **Conséquences** : ~300 lignes de collision à écrire et tester ; pas de pentes au départ ; overlay de debug maison.

## D-06 — Format des niveaux

- **Phases 1–2** : cartes **ASCII** (`.txt`) générées par l'agent, lisibles et éditables depuis GitHub sur téléphone, converties par un parseur pur en format interne neutre `LevelData`.
- **Plus tard** : **LDtk** si un ordinateur est disponible, via un second importeur vers le même `LevelData`.

## D-07 — Graphismes

- Prototype : formes géométriques converties en textures au démarrage (`generateTexture`), donc remplaçables par des sprites sans toucher au gameplay.
- Suite : sprites en atlas. Pixel art ou style lisse : **non tranché** (spec §45).

## D-08 — Commandes tactiles (Phase 3)

- Gauche : joystick **flottant à sortie numérique** (seuil → gauche/droite pleine vitesse ; haut/bas pour regarder, traverser, grimper). Mode analogique paramétrable.
- Droite : **Saut** (le plus gros) + **Attaque/Action** ; **Capacité** ajouté quand obtenue ; Interaction contextuelle ; Pause et Carte en petites icônes.
- Tout passe par l'abstraction `InputAction`.

## D-09 — PWA / hors ligne

- `vite-plugin-pwa` (Workbox), précache complet, mise à jour appliquée au lancement suivant.
- **Ajout en Phase 3**, pas avant (éviter les versions en cache pendant les itérations rapides).
- Sur iOS : l'installation sur l'écran d'accueil est le seul vrai plein écran et limite l'effacement du stockage.

## D-10 — Outillage

- Vite 8, **TypeScript `~6.0`** (TypeScript 7 n'est pas encore supporté par `typescript-eslint`), `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.
- Vitest 5 (environnement Node, tests dans `tests/`), ESLint 10 flat config + `typescript-eslint` `strictTypeChecked`, Prettier 3.
- Node ≥ 22.12 (`.nvmrc`).
- `base: '/Maria/'` pour GitHub Pages, aussi en dev.

## D-11 — Déploiement

- GitHub Actions (`.github/workflows/deploy.yml`) : typecheck, lint, format, tests, build sur chaque PR et push ; déploiement Pages uniquement depuis `main`.
- URL : https://kalypst.github.io/Maria/
- Les tests sur téléphone se font sur la version déployée depuis `main` (le serveur de dev de l'agent, dans un conteneur cloud, n'est pas joignable depuis le réseau local).

## D-12 — Build de debug publié à part

- **Décision** : en plus du build principal (https://kalypst.github.io/Maria/), un **build de debug** est publié sur **`/Maria/debug/`** (https://kalypst.github.io/Maria/debug/). Le build principal reste **sans aucun outil de debug**.
- **Raison** : les essais sur téléphone se font sur le déploiement de `main` ; sans build de debug, l'overlay de réglage en direct serait inaccessible sur téléphone.
- **Mise en œuvre** : `npm run build:debug` (mode Vite `debug`, `base: '/Maria/debug/'`, sortie `dist/debug/`). Les outils sont chargés par `import()` dynamique derrière la constante `DEBUG_TOOLS` (`import.meta.env.DEV || import.meta.env.MODE === 'debug'`), remplacée statiquement par Vite : le code de debug est éliminé du build principal. La CI échoue si un marqueur de l'overlay apparaît dans le build principal.
- **Conséquences** : deux builds par déploiement (temps de CI un peu plus long) ; les réglages de l'overlay sont conservés en `localStorage` (build de debug uniquement) et exportables en JSON pour être reportés dans `src/config/`.

## D-13 — Réglages des commandes dans localStorage (provisoire)

- **Décision** : les réglages des commandes tactiles (taille, opacité, mode du joystick) sont conservés dans `localStorage` (clé `maria.settings.controls`, versionnée, validée à la lecture) jusqu'à la Phase 5 (sauvegarde).
- **Raison** : IndexedDB, checksum et écriture atomique arrivent avec la sauvegarde ; un réglage d'interface n'a pas besoin de cette robustesse.
- **Conséquences** : à migrer vers le module de sauvegarde en Phase 5 (les réglages ne doivent pas être perdus avec la progression, mais ne doivent pas non plus la corrompre). Un stockage indisponible n'empêche pas de jouer : les réglages valent pour la session.

## D-14 — Traversée d'une plateforme par le bas + saut

- **Décision** (validée) : Bas maintenu + Saut, en étant posé uniquement sur une plateforme traversable, fait descendre à travers elle au lieu de sauter. Le seuil d'axe (`dropInputThreshold`) et la durée pendant laquelle les plateformes sont ignorées (`dropThroughMs`) sont des paramètres de `src/config/movement.ts`.
- **Conséquences** : sur un sol plein, Bas + Saut saute normalement ; aucun double saut (le saut mémorisé est consommé) ; le clavier utilise Bas + Espace, le tactile le bas du joystick + Saut.

## D-15 — Caméra maison à pas fixe

- **Décision** : contrôleur de caméra pur (`src/core/camera`), indépendant de Phaser, avancé **au même pas fixe que le joueur** (1/120 s) et affiché avec la même interpolation. Phaser ne reçoit que la position de défilement.
- **Comportement** : zone morte horizontale, anticipation dans le sens de la course (après un court délai, pour ignorer les petits tapotements), lissage exponentiel sans dépassement ; en vertical, **pas de suivi de l'arc du saut** : recadrage sur la hauteur du sol à l'atterrissage, suivi (serré) seulement hors d'une bande haute/basse, anticipation vers le bas pendant une grande chute (déclenchée par la distance sous le dernier sol : un saut ordinaire retombe déjà à la vitesse maximale), absorbée à l'atterrissage pour que la vue remonte sans rebond ; marge garantie entre Céleste et les bords de la vue ; bornée à la salle, centrée si la salle est plus petite que la vue. Regard haut/bas au joystick (immobile) : prévu, désactivé par défaut.
- **Raison** : même comportement à 60/90/120/144 Hz, testable avec Vitest ; joueur et caméra interpolés de la même façon (pas de décalage relatif entre images).
- **Conséquences** : distances en px logiques absolus : le cadrage autour de Céleste est identique en 640 et en 800 de large (D-01) ; le zoom (D-02) réduit la surface visible. Paramètres dans `src/config/camera.ts`, réglables dans l'overlay.

## D-16 — Faisabilité des parcours par simulation

- **Décision** : ce que Céleste peut franchir se calcule en **rejouant la vraie simulation** (`PlayerPhysics`, pure) avec des entrées scriptées, pas par des formules. `computeJumpProfile` donne hauteur et distances de saut ; `analyzeLevel` construit le graphe des surfaces praticables (marche, chute, saut, traversée par Bas + Saut) dans la vraie géométrie, puis le chemin du départ `P` à l'arrivée `G`.
- **Marge** : pour chaque saut, **fenêtre de timing** (durée pendant laquelle la pression sur Saut réussit en arrivant en courant). Le chemin retenu maximise la fenêtre de son passage le plus dur. Seuils par difficulté dans `src/config/levelDesign.ts` (provisoires, à calibrer sur téléphone).
- **Raison** : reste exact quels que soient les paramètres (pas discrets, coupure du saut, coyote, correction de coin) ; un changement de paramètres qui casse un parcours fait échouer les tests en nommant le saut fautif.
- **Limite** : une fenêtre de timing n'est qu'un indicateur ; elle ne remplace pas l'essai au pouce.

## D-17 — Rendu des grandes salles par blocs

- **Décision** : la salle est pré-dessinée en **blocs de 32 × 32 tuiles** (512 px), une image par bloc, au lieu d'une texture unique.
- **Raison** : de nombreux téléphones limitent les textures à 4096 px de côté ; les blocs hors écran ne sont pas dessinés.
- **Conséquences** : toute la salle reste en mémoire vidéo (≈ 4 Mo pour 150 × 30 tuiles) ; le chargement par zone viendra avec la première zone réelle (Phase 6).

## D-18 — Résolution de rendu réglable

- **Décision** : le canvas peut être rendu à la **résolution logique** (640–800 × 360, agrandi par le CSS ; **par défaut**) ou à la **résolution de l'écran** (taille logique × échelle, plafonnée à 3×), avec un zoom de caméra égal à l'échelle. Réglage dans l'overlay de debug et le menu pause, conservé en `localStorage`.
- **Raison** : à la résolution logique, un déplacement se fait par pixel logique (≈ 3 pixels physiques), même sans arrondi ; seul un canvas plus grand permet des positions au pixel physique, tout en gardant le pixel art net (filtrage au plus proche).
- **Conséquences** : environ 9 fois plus de pixels à dessiner en mode écran, à mesurer sur téléphone (FPS de l'overlay) ; la taille logique (D-01), les tuiles (D-02), la physique et les commandes en DOM ne changent pas. À revoir avec la direction artistique (un compromis à 2× reste possible).

## D-19 — Forme du saut : options désactivées par défaut

- **Décision** : deux options de saut, **désactivées par défaut** (le saut reste celui de la Phase 1) : relâchement progressif (gravité multipliée au relâchement au lieu de la coupure de vitesse) et flottement au sommet (gravité réduite près de l'apex tant que Saut est maintenu). Paramètres dans `src/config/movement.ts`, réglables dans l'overlay.
- **Raison** : ce sont des modifications du mouvement (pilier n° 1) : elles doivent être comparées sur téléphone avant d'être adoptées.
- **Conséquences** : l'analyse de faisabilité (D-16) rejoue la vraie physique : si une option est adoptée, les tests des parcours signalent tout parcours rendu impossible ou changé de difficulté.

## D-20 — Combat minimal sans vie ni mort avant la Phase 5

- **Décision** (validée) : en Phase 4, être touchée par un ennemi actif provoque seulement un **recul** (impulsion opposée à l'ennemi), une courte perte de contrôle (état `Hurt`) et une **invulnérabilité** temporaire ; ni jauge, ni mort, ni retour en arrière. La mort douce et le retour au checkpoint (spec §20) arrivent avec les checkpoints en Phase 5.
- **Attaque** : un coup de bâton vers l'avant, au sol comme en l'air, sans immobilisation ni perte de vitesse (le combat ne domine pas le mouvement, spec §50.4). Pas de frappe vers le bas avec rebond : ce serait une capacité de mouvement (pilier n° 3), à valider séparément.
- **Ennemi** : un type, le patrouilleur (placeholder géométrique, design ouvert §45). **Deux coups** : le premier le repousse et l'étourdit (inoffensif un moment), le second le disperse de façon abstraite (pas de gore, §17.4).
- **Conséquences** : l'état `Hurt` et l'impulsion de recul s'ajoutent à `PlayerPhysics` (le reste du mouvement est inchangé, vérifié par les tests de la Phase 1). L'analyse de faisabilité (D-16) ne tient pas compte des ennemis : les parcours doivent rester faisables sans attaquer.

## D-21 — Échec, jauge de peur et retour au checkpoint

- **Décision** (validée) : deux causes d'échec. **Tuile de danger** (`^`) : évanouissement immédiat. **Jauge de peur** : chaque contact avec un ennemi actif la remplit d'un cran (en plus du recul et de l'invulnérabilité de D-20) ; pleine (3 crans, réglable), Céleste s'évanouit. L'évanouissement est doux (Céleste s'estompe, fondu au noir bref), sans représentation graphique de la mort (§20.1), puis retour au **dernier checkpoint activé** (départ de la salle à défaut).
- **Au retour** : état local du monde restauré (ennemis remis à leur départ), jauge vidée, progression permanente conservée (§20.2). Activer un checkpoint vide aussi la jauge (§20.3). Pas de diminution naturelle par défaut (paramètre).
- **Checkpoints** : marqueur `C`, placeholder neutre (design ouvert, §45) ; activé au contact, il devient le point de retour et déclenche une sauvegarde automatique.
- **Affichage** : jauge discrète en haut de l'écran (HUD minimal, §38), placeholder neutre, sans cœurs.
- **Conséquences** : l'analyse de faisabilité (D-16) traite un passage touchant un danger comme raté et exclut les surfaces posées sur un danger. D-20 est complétée (plus de « ni jauge ni mort »).

## D-22 — Sauvegarde : format et robustesse

- **Décision** : cœur pur (`src/core/save/`) : schéma versionné, validation stricte, somme de contrôle (FNV-1a 32 bits) sur le contenu sérialisé, migrations (les réglages D-13 et D-18 en `localStorage` sont repris dans la sauvegarde). Deux emplacements, **principal** et **précédent**, écrits dans une **seule transaction** IndexedDB (le principal valide devient le précédent). Au chargement : principal valide, sinon précédent, sinon partie neuve ; jamais d'échec bloquant.
- **Stockage** : IndexedDB en priorité, repli sur `localStorage` (navigation privée), demande de stockage persistant (`navigator.storage.persist()`). Accès derrière une interface ; les tests utilisent un stockage en mémoire qui simule écritures interrompues et corruptions. Aucune dépendance ajoutée.
- **Code de sauvegarde** : export / import depuis le menu pause (texte base64url avec somme de contrôle) ; un code modifié ou tronqué est refusé. Indispensable sur iOS (effacement après 7 jours sans visite hors installation).
- **Reprise** : écran de départ minimal (« Continuer » / « Nouvelle partie »), qui laisse aussi charger la sauvegarde avant de lancer le jeu.
- **Sauvegarde automatique** : à l'activation d'un checkpoint, au changement de réglage et de salle ; pas seulement à la fermeture (écriture asynchrone non garantie).
- **Conséquences** : les réglages de debug (overlay) restent en `localStorage`, hors sauvegarde. Capacités, carte, collectibles : champs prévus, vides pour l'instant.

## D-23 — PWA : périmètre, mises à jour, build de debug

- **Décision** (mise en œuvre de D-09) : `vite-plugin-pwa` (Workbox) **dans le build principal seulement**. Le service worker (portée `/Maria/`) précache tout le jeu et **ignore `/Maria/debug/`** (jamais servi ni mis en cache par lui). Le **build de debug n'a pas de service worker** : toujours à jour, sans cache.
- **Mises à jour** : pas de mise à jour automatique avec rechargement (elle interromprait une partie). La nouvelle version s'installe en arrière-plan et s'applique au lancement suivant ; l'écran de départ affiche « Nouvelle version disponible » avec un bouton « Mettre à jour » (sans risque : aucune partie en cours).
- **Manifeste** : « MARIA », démarrage `/Maria/`, orientation paysage (D-03), `fullscreen` (repli `standalone` sur iOS), couleurs du jeu ; icônes placeholders (lunettes rondes roses de Céleste, §2), générées depuis un SVG.
- **Installation** : bouton « Installer » sur Android (`beforeinstallprompt`), aide « Partager → Sur l'écran d'accueil » sur iOS Safari hors installation ; rien si le jeu est déjà installé.
- **Conséquences** : sur iOS, l'application installée a son propre stockage (une partie commencée dans Safari se transfère par le code de sauvegarde, D-22). La CI vérifie la présence du service worker et du manifeste dans le build principal, l'exclusion de `/debug/` et l'absence de service worker dans le build de debug (`check:pwa`).

## D-24 — Thème provisoire : le cahier de Céleste et la maison la nuit

- **Décision** (validée, choix « C ») : l'interface (écran de départ, menus, dialogues, plus tard la carte) ressemble au **cahier de Céleste** (papier crème, lignes, encre brun-gris, crayons de couleur, bords dessinés irréguliers) ; le jeu montre **la maison la nuit**, douce et mate. **Aucun néon ni halo.** Le rose est réservé à Céleste (lunettes, §2) ; commandes tactiles « craie » avec une couleur de lampe à l'appui.
- **Raison** : le premier placeholder (violet nuit, rose vif lumineux) ne correspondait pas au ton de la spec (§10 : quotidien, conte, mystère, douceur) ; le cahier annonce la carte dessinée par l'enfant (§24).
- **Mise en œuvre** : interface = variables CSS de `:root` dans `src/style.css`, **aucune couleur en dehors** ; jeu = `PLACEHOLDER_COLORS` (`src/config/display.ts`). Polices système arrondies (aucune police téléchargée : le jeu reste hors ligne). Icône, manifeste et barre d'état passent au papier crème.
- **Conséquences** : reste un placeholder ; la direction artistique finale reste ouverte (§45) et ne demandera de changer que ces deux endroits.

## D-25 — Monde en salles reliées par des sorties

- **Décision** (validée) : une zone est un ensemble de **salles** (cartes ASCII, D-06) reliées par des **sorties** ; les liaisons sont des **données** (`src/levels/house/zone.ts`, §32), pas du code. Dans l'ASCII, les chiffres `1` à `9` marquent l'ouverture d'une sortie dans un mur latéral (au moins 2 tuiles de haut) ; la zone relie `salle:sortie` ↔ `salle:sortie` (dans les deux sens). **Sorties latérales uniquement** pour l'instant : la verticalité se fait à l'intérieur des salles (escalier).
- **Passage** : toucher une sortie déclenche un court fondu (simulation suspendue), charge la salle liée et place Céleste juste à l'intérieur de la sortie correspondante, pieds au bas de l'ouverture, vitesse horizontale conservée ; caméra recadrée. Durée réglable.
- **Checkpoints et reprise** : le point de retour est un checkpoint **de la zone** (`salle:checkpoint`) ; un évanouissement ramène au dernier checkpoint, **même dans une autre salle**. Changer de salle ne déplace pas le point de retour. Les salles visitées sont sauvegardées (`progression.mapRevealed`, pour la carte, Phase 8).
- **Salles** : matériaux (`b` bois, `t` tissu, `-` étagère traversable) pour des meubles reconnaissables à l'échelle d'une enfant (§10) ; ambiance de couleur par salle (`; @ambient:`).
- **Vérification** (D-16 étendue) : graphe de zone (sorties reliées + passages simulés dans chaque salle) : toutes les salles atteignables depuis le départ, retour possible de partout vers le départ, aucune surface sans issue.
- **Conséquences** : « Nouvelle partie » commence dans la chambre ; les parcours d'essai restent accessibles (menu pause, prototype) comme des salles isolées.
- **Précisions de mise en œuvre** :
  - Les parcours d'essai sont **hors partie** : y jouer ne modifie pas la sauvegarde (ni point de retour ni checkpoints). « La maison (partie) » dans le menu pause ramène au point de retour. Une sauvegarde plus ancienne qui pointe vers un parcours reprend au départ de la maison.
  - La **jauge de peur suit Céleste** d'une salle à l'autre : changer de salle ne la vide pas.
  - L'ambiance de salle modifie la **couleur d'effacement du rendu**. Un fond de caméra coûtait ~350 octets par pas (rectangle redessiné à chaque image).
  - Les identifiants de salle sont uniques entre zones et parcours ; ce sont les clés de sauvegarde (testé).

## D-26 — Première capacité : grimper aux rebords

- **Décision** (validée) : la première capacité de mouvement est **grimper aux rebords** (s'accrocher au bord d'un meuble et se hisser ; spec §15 : « escalade ou interaction verticale »). Elle a été préparée dans la zone de la Phase 6 (signposting §25.3), puis implémentée dans une petite phase dédiée.
- **Geste (option B validée)** :
  - **Accroche** : en descente, en poussant vers un mur, Céleste attrape le bord d'une **tuile pleine** dont le dessus est à hauteur des mains. Les étagères traversables ne s'attrapent pas.
  - **Suspension** : Saut hisse aussitôt ; pousser vers le bord ou vers le haut hisse après un court instant ; pousser vers le bas ou à l'opposé lâche, avec un délai avant de pouvoir se raccrocher.
  - **Aucun nouveau bouton** (pilier 3).
- **Garde-fous** :
  - on n'attrape que si on pousse vers le bord, et seulement en descente ;
  - les pieds doivent être nettement sous le bord : un saut qui suffisait pour s'y poser n'est jamais interrompu ;
  - le trajet du hissage est vérifié à l'accroche : place pour se tenir debout, pas de danger, pas de coincement.
- **Règle unique** : tous les bords pleins s'attrapent, pas une liste de meubles marqués.
- **Réglages** dans `src/config/movement.ts` (`ledge*`), dans l'overlay et l'export JSON. Sans la capacité, le mouvement est **inchangé** : parcours d'essai et difficultés identiques, ce que les tests vérifient.
- **Obtention (validée)** : un objet placeholder dans la buanderie (`A` dans l'ASCII, capacité nommée par `; @ability:`). La capacité est enregistrée dans `progression.abilities` (champ déjà prévu, sans migration). Un indice de prototype s'affiche à l'obtention, à revoir avec la narration (pilier 6).
- **Vérification** : l'analyse de faisabilité (D-16) prend l'escalade en option. Les tests de la maison couvrent les deux états (sans et avec escalade) :
  - aucun endroit sans retour facile, dans les deux cas ;
  - l'objet est atteignable sans grimper ;
  - l'armoire, la bibliothèque, les placards hauts et la trappe à linge ne sont atteignables **qu'en grimpant**, et alors facilement ;
  - on remonte de la buanderie à la trappe : la boucle de la maison est fermée.

## D-27 — Ordre de travail après l'escalade

- **Décision** (validée) : deux étapes s'ajoutent à l'ordre de la spec (§42), avant de juger le vertical slice :
  1. une **passe de level design** sur la maison, avec l'escalade : vraie boucle, embranchements, verticalité, un premier secret (§25.2). Elle pourra passer par un éditeur visuel (par exemple Tiled) à la place du script de génération ;
  2. une courte **phase de direction artistique** : 2 ou 3 écrans de test dans des styles différents sur la même salle, choix par l'utilisateur, et décision sur qui produit les images (dessin par le code, packs d'assets, illustrations, images générées puis retravaillées).
- **Raison** : la spec ne prévoit aucune phase de production graphique, alors que le vertical slice (§53) doit montrer le contraste monde réel / monde étrange. Le level design est la priorité n°2 (§52) et ne doit pas attendre la fin.
- **Passe de level design, mise en œuvre (validée)** :
  - **Outil** : salles en texte ASCII, pas d'éditeur visuel (l'utilisateur n'a pas d'ordinateur pour l'instant). Des images de chaque salle en entier et un plan de la zone servent à valider.
  - **Grimper ouvre deux branches** : l'escalier mène au **grenier**, dont on ressort **derrière l'armoire** de la chambre (raccourci vers le départ). La maison a deux boucles : la trappe à linge, et chambre → couloir → escalier → grenier.
  - **Premier secret** (§27.0.2, plateforme) : poutres du grenier jusqu'au recoin sous le toit. `S` dans l'ASCII, trouvaille enregistrée dans `progression.collectibles` sous l'identifiant `salle:s<col>-<row>`, **sans compteur affiché** avant la carte (§23). Difficulté **moyenne** vérifiée : ni atteignable par des passages faciles seulement, ni au-delà de « moyen ».
  - **Signposting d'une capacité future** : lucarne du grenier, hors de portée même en grimpant.
  - **Rez-de-chaussée gardé tel quel pour l'instant** (salon, cuisine, couloir, buanderie). Il sera retravaillé plus tard : verticalité, placement des jouets, récompenses en haut de la bibliothèque et des placards (pilier 2).

## D-28 — Direction artistique : style D, dessin par le code, images fournies en option

- **Décision** (validée) : la maison réelle est dessinée en **livre illustré** (aplats doux, formes arrondies, objets du quotidien reconnaissables, nuit bleutée), avec la **lumière** du style « ombres et lumière » : pièce dans la pénombre, veilleuses, lune, halos, liseré clair sur les surfaces praticables. Le **monde étrange** reprend les mêmes formes en **silhouettes** avec une lumière turquoise (§6.2 : pas de décor produit deux fois). Maquettes A, B, C, D comparées ; A écarté, B jugé trop sombre pour la maison réelle mais retenu pour le monde étrange.
- **Production** :
  - tout est **dessiné par le code** (API Canvas, à l'échelle de l'écran) ;
  - **n'importe quel élément** peut être remplacé par une image fournie sous son nom d'élément (`ART_IMAGES`, fichiers dans `public/art/`) ; candidats : Maria (jamais animée, une image fixe suffit), les pièces de Céleste (animation « papier découpé »), quelques éléments clés ;
  - **images IA** acceptées pour des images fixes, déconseillées pour des animations image par image ;
  - guide pour l'utilisateur : document « MARIA — Créer des images pour le jeu » (https://claude.ai/code/artifact/2123c112-080b-45e4-b564-cca8f480fd45).
- **Mise en œuvre** :
  - chaque salle déclare son habillage par `; @decor: nom colonne ligne largeur hauteur`, et un test vérifie que chaque tuile de meuble est couverte ; le level design reste en ASCII ;
  - fond et lumière sont dessinés **une fois par salle**, en blocs de textures à l'échelle de l'écran (plafonnée à 3) ; la lumière passe **sous les personnages**, qui restent lisibles ;
  - la palette est dans `src/config/art.ts` ; overlay : « Monde étrange (aperçu) ».
- **Conséquences** :
  - mémoire des textures : environ 19 Mo pour la chambre à l'échelle 3 (deux calques), à surveiller sur téléphone ;
  - le style illustré gagne nettement en mode « résolution de l'écran » (D-18). Passer ce mode par défaut est à décider après l'essai sur téléphone (performance) ;
  - les salles non habillées gardent le rendu par tuiles jusqu'à leur habillage.
- **Toute la maison habillée** :
  - les meubles sont dessinés **d'après leurs tuiles** (forme exacte de la collision, coins adoucis), avec des détails propres à chaque type : un meuble nouveau ne demande que sa déclaration ;
  - chaque salle choisit son revêtement de mur (`; @wall:` pois, rayures, planches, carrelage) ;
  - les lampes de décor éclairent comme les veilleuses ;
  - jouets mécaniques en souris à remonter ;
  - les parcours d'essai restent en rendu par tuiles.
- **Coût mesuré** (Chromium sur ordinateur, échelle 3) : 160 à 300 ms pour dessiner une salle, pendant le fondu de changement de salle. Sur téléphone ce sera plus long : à mesurer, et au besoin dessiner à l'échelle 2 ou garder en cache les salles voisines.

## D-29 — Céleste en « papier découpé »

- **Décision** (validée) : Céleste est une marionnette de pièces fixes : tête avec lunettes rondes roses, deux couettes, torse, bras, jambes à chaussons. Enfant de **5-6 ans** (tête ronde assez grosse), pyjama rose à pois. Allure **sobre avec un peu de vie** : gestes nets, souplesse portée par les couettes, qui **sautent** (demande de l'utilisateur) : élan à chaque foulée, envolée au saut, retombée qui oscille à la réception, butée souple. Même principe plus tard pour la queue de cheval (phases de croissance).
- **Mise en œuvre** :
  - poses calculées par une fonction pure testée (`CelestePoser`) : respiration, course, saut, chute, suspension (bras tendus vers le rebord), hissage, coup reçu, bras qui accompagne le bâton ;
  - le pas suit la distance parcourue, et les couettes sont un ressort amorti ;
  - rendu par un conteneur de pièces, sans allocation par image ; écrasement et inclinaison (`PlayerFeel`) conservés ;
  - réglages dans `src/config/puppet.ts` et l'overlay.
- **Images** : chaque pièce peut être remplacée par une image `celeste-head`, `celeste-pigtail`, `celeste-torso`, `celeste-arm`, `celeste-leg` (D-28). Le bras et la jambe servent des deux côtés ; le côté caché est assombri.
- **Conséquences** : purement visuel, la hitbox et la physique ne changent pas. Le dessin dépasse la hitbox de quelques pixels vers le haut (la tête).

## D-30 — Carte dessinée par Céleste, et ordre du vertical slice

- **Ordre (validé)** : le vertical slice (§53) passe avant la croissance (§42 plaçait la croissance en phase 7) : carte rudimentaire, puis manifestation de Maria, courte séquence narrative et premier passage vers le monde étrange ; la croissance ensuite. Raison : la croissance ne fait pas partie du slice, qui doit dire au plus tôt si le jeu donne envie de continuer.
- **Carte (validée)** :
  - **une page du cahier** à consulter, pas de mini-carte (§38 : écran mobile épuré) ;
  - ouverture par le bouton tactile Carte, M ou Tab, ou le menu pause ; jeu en pause pendant la consultation ;
  - salles visitées dessinées au crayon (nom, petit dessin), **salles devinées** (voisines d'une salle visitée) en pointillés avec « ? » ;
  - veilleuses allumées et point de retour, **trouvailles ramassées** en étoiles (les autres ne sont jamais révélées) ;
  - Céleste à sa place ; tracé animé des salles nouvelles.
- **Données** :
  - la disposition est **dessinée à la main** dans les données de la zone (`map` : une boîte par salle), avec une icône par salle (`@icon`) ;
  - carte « imparfaite » (§24.1) : les passages lointains (trappe à linge, grenier) sont dessinés en amorces de même couleur ;
  - lecture de la sauvegarde existante (`mapRevealed`, checkpoints, trouvailles), sans migration.
- **Vérifié** : modèle pur testé ; test de disposition (un mur droit mène à la salle de droite).

## D-31 — Histoire pilotée par des données, prologue du soir, sauvegarde v2

- **Système d'événements (§33)**, pur et testé (`src/core/story/`) :
  - **déclencheurs** Agir ou contact, dans une zone de la salle, sous condition d'étapes vécues (drapeaux) ;
  - **scripts courts** : fondus, attente, bulle de pensée, étape notée (sauvegardée aussitôt), Céleste placée, pose assise ;
  - **objets de mise en scène** qui dépendent des étapes ; **moment de la journée** (soir, matin) ; **portes fermées**.

  L'histoire d'une zone tient dans un fichier de données (`src/levels/house/story.ts`). Un test vérifie sa cohérence : chaque déclencheur se désactive lui-même, Céleste n'est déplacée que dans le noir, les objets reposent sur une surface.

- **Pilier 5, garanti par le code** : un objet de mise en scène (Maria comprise) n'apparaît ou ne disparaît que **hors de la vue ou dans le noir complet** d'un fondu (`canChangeProp`, testé). Maria ne change de place que pendant un fondu : Céleste la « porte » hors de l'écran.
- **Prologue (validé)**, PLACEHOLDER :
  1. le soir, Maria est assise sur le tapis ; Agir : Céleste joue avec elle (assise, bulle cœur) ;
  2. Agir de nouveau : Céleste la couche dans le berceau (sur le coffre à jouets) ;
  3. Agir sur le lit : la nuit passe ; au matin, le berceau est vide et défait, bulle « Maria ? » ;
  4. des traces (chausson dans le couloir, biberon dans l'escalier) donnent une bulle avec le visage de Maria.

  Le soir, les portes de la chambre sont fermées (bulle « au lit » à la porte). Écart assumé avec le plan : on couche Maria en agissant **sur Maria**, pas sur le berceau, sinon elle semblerait s'y téléporter.

- **Commandes** : pas de nouveau bouton. Près de ce qu'on peut faire, une étincelle apparaît et le bouton Action devient **« Agir »** (clavier : E, ou la touche d'Action).
- **Aucun texte** : bulles de pensée à pictogrammes seulement (cœur, berceau, lit, visage de Maria, « ? »).
- **Palette du matin** (première version de la palette jour) : murs clairs, ciel d'aube, obscurité presque levée, halos atténués. Le soir garde la palette de nuit.
- **Maria** : image fournie par l'utilisateur, détourée (`public/art/maria.png`, clé `maria`) ; la tête sert aussi dans le berceau et les bulles. Repli : un poupon dessiné par le code. À juger sur téléphone (décalage de style possible avec le papier découpé) ; si besoin, version simplifiée dessinée d'après l'image.
- **Sauvegarde v2 (signalée, pilier 10)** : nouveau champ `story.flags`. Migration v1 → v2 à la lecture (sauvegarde et code) : une partie commencée avant l'histoire reçoit le **prologue comme vécu** (pas de retour au coucher). Testé : ancienne sauvegarde, ancien code, schéma.

## D-32 — Maria dans la bibliothèque, premier passage vers le monde étrange

- **Séquence (plan validé, PLACEHOLDER)** :
  1. au matin, Maria est assise **en haut de la bibliothèque du salon**, visible depuis le sol, atteignable seulement en grimpant ; en l'apercevant, bulle avec son visage ;
  2. quand Céleste arrive en haut : **un clignement** (fondu très court), Maria n'y est plus, **le salon a basculé** dans le monde étrange (silhouettes, lumière turquoise, jouets en ombres aux yeux lumineux, même comportement), bulle « Maria ? » ;
  3. dès que Céleste **quitte le salon** (sortie, réapparition), tout redevient normal, pour de bon ;
  4. **conséquence dans le monde réel** (§6.3) : le **bandeau de Maria** est posé sur le lit de Céleste ; en s'en approchant, bulle avec le visage de Maria. Aucune explication.
- **Pilier 5** : Maria disparaît sous les yeux de Céleste, mais **dans le noir complet** du clignement (testé : le changement n'a lieu qu'avec un voile à 1).
- **Événements** : nouveau déclencheur « en quittant la salle » (étapes instantanées seulement), salles basculées dans le monde étrange selon les étapes (`strangeRooms`).
- **Céleste garde ses couleurs dans le monde étrange** : en silhouette, elle était presque invisible (pilier 1 : lisibilité). Elle est la seule chose « réelle » au milieu des ombres.
- **Sauvegarde** : aucune migration (nouvelles étapes dans `story.flags`).

## D-33 — Ralentir l'histoire (retours de l'utilisateur)

- **Constat** (essai de l'utilisateur) : bulles trop petites et trop brèves, soirée trop courte pour s'attacher à Maria, nuit et bascule trop rapides.
- **Décisions** :
  - **Bulles 1,6 fois plus grandes** (pictogrammes compris), affichées 3 s au lieu de 1,8 s.
  - **Soirée rallongée** :
    - jouer se fait en deux temps, un câlin (cœur) puis une histoire du soir (livre) ;
    - **petite quête** : la couverture de Maria est sur l'étagère au-dessus du bureau, à aller chercher en sautant ; on ne peut coucher Maria qu'avec elle ;
    - une fois Maria couchée, Céleste la regarde (cœur) ;
    - au lit, Céleste s'assoit et a un dernier regard (cœur) avant la nuit.
  - **Transitions plus lentes** :
    - la nuit : 1,9 s de fondu, 2 s de noir, 2,6 s de retour ;
    - la bascule vers le monde étrange : 0,3 s de clignement, 0,7 s de noir, 1,5 s de retour.
  - **Céleste s'arrête pour regarder** (environ 1,4 s, commandes suspendues) : devant les traces, en apercevant Maria, devant le bandeau.
  - **Ennemis du monde étrange** : toujours en ombre, mais gris-bleu avec un liseré turquoise (au lieu de presque noir).
  - Un objet peut être **ramassé** : il disparaît aussitôt, même à l'écran (la couverture). **Jamais Maria** : la validation des données le refuse.
- **Sauvegarde** : nouvelle étape `evening.blanket`, ajoutée aussi aux étapes données à une ancienne partie migrée. Une partie en cours de soirée reprend simplement à la couverture.

## D-34 — Monde étrange jouable (salon étrange, passage d'ombres)

- **Décision** (plan validé) : le clignement en haut de la bibliothèque ne fait plus basculer le salon réel ; il fait passer Céleste, **dans le noir**, dans des **salles distinctes** du monde étrange. Remplace les points 2 à 4 de D-32 (bascule du salon réel, retour en quittant le salon, bandeau posé à ce moment-là).
- **Salles** (PLACEHOLDER) :
  - **salon étrange** : mêmes silhouettes que le salon, réagencées ; portes murées ; meubles qui flottent ; une ouverture en haut du mur gauche. Difficulté facile (salle de découverte) ;
  - **passage d'ombres** : montée d'étagères flottantes autour d'un vide, jouets-ombres, **veilleuse turquoise** (point de retour). Difficulté **moyenne** (D-16) : deux sauts moyens, chacun avec une étagère en dessous pour rattraper une chute. **Trouvaille optionnelle difficile**.
- **Maria** (pilier 5) : assise sur une étagère flottante de l'autre côté du vide, **inaccessible** (testé, même en grimpant) ; elle est là dès l'entrée et ne bouge jamais.
- **Fin** : un **berceau vide** qui flotte tout en haut. Agir, long fondu, Céleste assise sur son lit, le **bandeau** de Maria à côté d'elle, une bulle. Aucune explication (pilier 6).
- **Règles de jeu (validées)** :
  - **pas de sortie volontaire** du monde étrange : on en sort par la fin, ou par un évanouissement ;
  - évanouissement avant la veilleuse turquoise : retour au point de retour réel ; le haut de la bibliothèque ramène alors au monde étrange (clignement bref, sans bulle), tant que la fin n'est pas vécue ;
  - après la veilleuse : retour à la veilleuse ;
  - **carte** : les salles étranges n'y figurent jamais ; ouverte dans le monde étrange, elle ne dessine pas Céleste (« elle n'est nulle part »).
- **Mise en œuvre** :
  - étape de script **`room`** : changement de salle, seulement dans le noir complet (validé par `storyProblems`), debout sur un sol ; `returnPoint` fait de la veilleuse de la salle le point de retour (fin : chambre) ;
  - directive de salle **`; @world: strange`** : palette étrange permanente, salle absente de la carte et de `mapRevealed`. Le mécanisme `strangeRooms` (bascule par étapes) est retiré ;
  - un déclencheur qui emmène Céleste dans une autre salle peut rester disponible (ré-entrée) : il ne peut pas se rejouer sur place ;
  - rendu : **lueur turquoise immobile** sous les meubles qui flottent (aucun balancement : le dessin reste sur la collision, pilier 1) ; veilleuse turquoise ;
  - le graphe de faisabilité des tests (`tests/zoneGraph.ts`) suit les passages de l'histoire et la difficulté déclarée de chaque salle. « Jamais coincée » : faciles dans la maison réelle, moyens au plus dans le monde étrange.
- **Sauvegarde** : aucune migration (nouvelle étape `strange.done`). Les étapes retirées `living.left` et `headband.found` restent sans effet dans une ancienne sauvegarde. Une partie qui avait vécu l'ancienne fin retrouve le monde étrange ouvert, et le bandeau réapparaît à la nouvelle fin.
- **Limites** :
  - l'analyse de difficulté ignore les ennemis : aucun jouet-ombre n'est placé sur une réception d'un saut moyen, à confirmer sur téléphone ;
  - la durée (3 à 5 min) est une estimation sur plan, à chronométrer.

## D-35 — Ambiance du monde étrange : maison déformée, vie étrange, passage réel → étrange

- **Retour de l'utilisateur** (après D-34) : la difficulté du passage d'ombres convient (plus exigeant que la maison, largement accessible) ; **les zones suivantes devront monter d'un cran**. L'ambiance, elle, manquait de « maison déformée » et de vie ; le passage vers l'étrange était trop sec.
- **Passage réel → étrange (validé)** :
  - **présage** en grimpant vers Maria (données `omens` de l'histoire) : les couleurs se refroidissent avec la hauteur, la lumière vacille, puis un léger tremblement (1,2 px au sommet) ;
  - au sommet : **scintillements turquoise autour de Maria, jamais sur elle** (pilier 5), tremblement, puis le clignement ;
  - arrivée : le monde étrange se révèle **en cercle autour de Céleste** (fondu `iris`) ;
  - fin en miroir : le berceau scintille, le cercle se referme sur Céleste ;
  - ré-entrée après un échec : version courte.
- **Maison déformée** (décor de fond, jamais de collision) : cadres penchés, horloge sans aiguilles, porte accrochée au plafond à l'envers, porte murée, escalier qui entre dans le mur (pâle, sans liseré : jamais pris pour une surface), papier peint qui pèle, chaise et crayon géants, fenêtre trop haute qui donne sur la chambre de Céleste, ombre géante d'un ours en peluche, murs du passage qui se resserrent en planches courbées. Écarté : un lit miniature, lu comme une plateforme.
- **Vie étrange** (salles étranges seulement) : poussière turquoise qui monte, **objets de la maison à la dérive** (livre, cube, chausson, tasse, crayon, biberon), seulement dans des zones vides (jamais pris pour une plateforme), horloge dont l'aiguille recule par à-coups, rideaux qui ondulent sans vent, lampes qui vacillent, lueur sous les meubles flottants qui respire, **yeux dans l'ombre** (validés) : ils clignent, se ferment quand Céleste approche, se rouvrent quand elle est loin depuis un moment.
- **Règles** : rien de ce qui bouge ne touche à la collision ni au mouvement (pilier 1) ; Maria n'est jamais animée (pilier 5) ; inquiétant, jamais horreur (pilier 8).
- **Mise en œuvre** :
  - étapes de script `sparkle` et `shake`, forme de fondu `iris` (voile DOM en dégradé radial centré sur Céleste) ;
  - `StrangeFxView` : stock d'images par salle, aucune allocation par image ; réglages dans `src/config/strangeFx.ts` ;
  - logique pure testée (`src/core/fx/strangeLife.ts`) : yeux, zones vides ;
  - yeux placés par les données (`; @decor: eyes col ligne 1 1`).
- **Accessibilité** : pas encore d'option « réduire les effets » (reportée, validé) : elle demandera un champ de réglage dans la sauvegarde, avec migration (pilier 10). Tremblements volontairement faibles.
- **Coût mesuré** (Chromium sur ordinateur) : environ 50 objets de plus dans le passage d'ombres, 60 images/s. À mesurer sur téléphone.

## D-36 — Difficulté croissante, palette « crépuscule », frissons et nouvelles animations

- **Difficulté (décision de l'utilisateur)** : le jeu doit rester intéressant pour un adulte. Le **chemin principal** devient plus difficile zone après zone, jusqu'à du **difficile à la fin** ; les trouvailles optionnelles peuvent aller au-delà. Le monde étrange de la maison (moyen) est le point de départ. Remplace l'idée de garder la difficulté dans les seules trouvailles.
- **Joueuses visées** : la compagne de l'utilisateur, puis sa fille plus tard. La difficulté n'est pas réglée pour un enfant.
- **Palette du monde étrange : B, « crépuscule »** (choisie parmi 3 maquettes : turquoise retouché, crépuscule, encre et ambre) :
  - fonds violets et bleu nuit, halos roses ;
  - bords des surfaces praticables en turquoise (lisibilité) ;
  - voile du présage violet.
    Les lueurs des effets prennent la couleur des lampes de la palette. Les yeux, la poussière et les scintillements restent turquoise, pour trancher sur le violet.
- **Frissons** : un court frisson (0,4 à 0,8 s) toutes les 25 à 50 s, avec de la poussière qui tombe du plafond et des lueurs qui vacillent. **Jamais pendant un saut** : il attend que Céleste ait les pieds au sol (pilier 1). Logique pure testée (`stepTremor`).
- **Animations choisies** :
  - **scintillements qui tombent** lentement, qui s'effacent près de Céleste (jamais devant elle) ;
  - **fenêtre sur la chambre** : la lampe s'y allume et s'éteint lentement ;
  - **ombre de l'ours** qui glisse le long du mur, puis disparaît un moment.
- Non retenu : les papillons de papier, la lueur qui parcourt les bords, et les cadres qui basculent pendant les frissons (ils demanderaient de sortir les cadres du décor fixe).
- **Parents** (rappel de l'utilisateur, spec §8) : très présents au début de l'histoire, absents du slice actuel. **À intégrer dans l'étape « maison vivante »**, avec les choix réservés à l'utilisateur (§45 : composition de la famille, apparence, rôle le soir et le matin, bulles pictogrammes).

## D-37 — La famille : maman, papa et le chat gris (maison vivante, PR 1)

- **Décisions de l'utilisateur** : maman, papa et un chat gris ; parents **à hauteur d'enfant** (à essayer) ; scènes validées ; souvenirs à revoir dans le cahier de Céleste (PR suivante).
- **Principes** :
  - les parents rassurent, n'expliquent rien, ne sont jamais des antagonistes (spec §8, pilier 6) ;
  - ils communiquent par des **bulles pictogrammes** au-dessus de leur tête (étape `thought` avec `by`), jamais de texte ;
  - **ils ne marchent pas à l'écran** : une pose par activité, un petit mouvement en boucle (deux images), et ils changent d'activité hors de la vue ou dans le noir (règle des objets de mise en scène) ;
  - **ils ne voient jamais l'étrange** : au matin, maman lit sous la bibliothèque où Maria est assise.
- **Scènes** (PLACEHOLDER) :
  - le soir, papa est à la porte de la chambre et rappelle l'heure du lit (bulle) si Céleste veut sortir (`lockedRooms.speaker`) ; le chat dort sur le tabouret ;
  - au coucher, maman vient au bord du lit (cœur), puis la nuit ;
  - au matin, papa boit son café à la cuisine, maman lit au salon, le chat regarde le haut de la bibliothèque. Agir près d'un parent : Céleste pense à Maria, le parent répond « ? » puis un cœur (une fois) ;
  - après le monde étrange, papa passe la tête par la porte (« ? »), puis repart dans un court fondu.
- **Dessin** : dessinés par le code dans le style « papier découpé », visages simples vus de loin. **Taille (choisie sur maquettes)** : ×2 (`PARENT_SCALE`), soit environ 4,5 fois Céleste, à l'échelle des meubles de la maison géante (spec §7.1, §10.3). Une première version à environ 2,4 fois Céleste paraissait trop petite à côté des meubles. Placeholders : l'apparence (cheveux, vêtements, peau) reste à préciser par l'utilisateur, ou à remplacer par des images fournies.
- **Données** : nouvelles étapes `evening.goodnight`, `morning.dad`, `morning.mom`, `cat.petted`, `end.dad`. `evening.goodnight` est ajoutée aux étapes données à une ancienne partie migrée. Pas de migration.
- **Limite connue** : les jouets mécaniques (ennemis de la maison) patrouillent près des parents sans réaction ; à revoir (par exemple, ils ne s'animent que la nuit ou hors de la présence d'un adulte).

## D-38 — Maison vivante (PR 2) : mouvements, objets à regarder, souvenirs dans le cahier

- **Décisions de l'utilisateur** : liste des souvenirs validée ; souvenirs pas encore trouvés en **cases vides en pointillés** ; tout **dessiné par le code** pour l'instant.
- **Mouvements de la maison réelle** (doux, jamais inquiétants) : poussière dans la lumière des fenêtres, trotteuse des horloges, rideaux qui se balancent à peine, veilleuses qui respirent, machine à laver qui tourne le matin, plante dont les feuilles frémissent, danseuse de la boîte à musique. Même système que le monde étrange (`StrangeFxView`), réglages `HOUSE_LIFE`.
- **Objets à regarder (Agir)** : photo de famille (salon, nouvel élément de décor `photo`), dessin de Céleste (chambre), boîte à musique (étagère au-dessus du lit), plante (plan de travail de la cuisine). Une bulle pictogramme (famille, dessin, notes, fleur). **Rejouables** (`repeat`) : seulement avec Agir, et sans effet sur l'histoire (bulles, attentes, souvenir), ce que la validation vérifie.
- **Souvenirs** (spec §22.1) :
  - la première fois qu'on regarde un objet, il devient un souvenir (étape `memory`, sauvegardé dans `progression.memories`, champ déjà prévu : **aucune migration**) ;
  - le bandeau de Maria devient un souvenir à la fin du monde étrange ;
  - la case « en haut de la bibliothèque » attend le rez-de-chaussée retravaillé (PR 3).
- **Cahier de Céleste** : deux onglets manuscrits, « Ma maison » (la carte) et « Mes souvenirs » ; une case par souvenir, dessiné s'il est trouvé, en pointillés sinon (complétion explicite, §23) ; toucher un souvenir l'affiche en grand. Pas d'autre texte que les titres (pilier 6).

## D-39 — Rez-de-chaussée retravaillé (maison vivante, PR 3)

- **Plan validé** : salon et cuisine en profondeur, buanderie légère ; règle « pas de jouet mécanique près d'un adulte » ; souvenir en haut de la bibliothèque : **une photo de Céleste bébé avec Maria dans les bras**.
- **Salon** :
  - **vrai canapé** : accoudoirs pleins, assise plus basse, dossier dessiné derrière (`sofaback`) ; maman est assise _dans_ le canapé ;
  - **route haute par la gauche** : meuble mural (en grimpant, facile), étagères, **tringle du rideau**, étagère, jusqu'en haut de la bibliothèque ;
  - **trouvaille** dans un recoin à droite du haut de la bibliothèque (saut moyen, le sol rattrape un raté) ;
  - **souvenir** en haut de la bibliothèque, là où Maria était assise, **seulement après le monde étrange** (raison de revenir, pilier 2) ;
  - la bibliothèque ne bouge pas : le monde étrange s'appuie sur sa position.
- **Cuisine** :
  - le **frigo prévu est écarté** : au sol, il coupait le chemin vers le plan de travail (et la buanderie) ; nulle part ailleurs il ne laissait les sorties libres ;
  - à la place, une **chaîne d'étagères à bocaux** de la table vers les placards hauts, la dernière marche en grimpant ;
  - **trouvaille** sur les placards hauts ;
  - le jouet mécanique patrouille sur la table, loin de papa.
- **Buanderie** : un fil à linge (décor).
- **Vérifié par les tests** : la maison reste facile, jamais coincée ; les endroits prévus demandent toujours l'escalade ; route haute du salon en grimpant (facile) ; trouvailles du salon et de la cuisine en grimpant, au plus moyennes ; photo de Céleste bébé seulement après le monde étrange.

## D-40 — Retours du téléphone : présage et mains des parents

- **Présage corrigé** (remplace la bande de hauteur de D-35) : il dépend de la **distance à la case de Maria** (en haut de la bibliothèque), avec un rayon de 13 tuiles, et non plus de la hauteur dans la pièce. Avant, on le déclenchait à l'autre bout du salon, sur la tringle du rideau. Maintenant rien sur la tringle ni sur le canapé ; il commence au pied de la bibliothèque et devient fort tout près de Maria.
- **Mains des parents** : la main tendue sortait du cadre du dessin et était coupée. Le cadre a maintenant une **marge symétrique** de chaque côté du corps (papa à la porte 8, à la cuisine 6, maman 4, en px de dessin). Le corps reste centré sur sa tuile, retourné ou non, et les bulles ne bougent pas.
- **Image de Céleste fournie par l'utilisateur** : usage décidé en D-41.

## D-41 — Céleste d'après l'illustration de l'utilisateur

- L'illustration (vue de côté : couettes basses à nœuds roses, lunettes rondes roses, pyjama bleu à myrtilles avec liserés roses, chaussons lapin roses) **ne remplace pas la marionnette** : à environ 26 px de haut, ses détails ne se lisent pas, et une image fixe ne court ni ne saute. Aucune autre orientation n'est nécessaire, le jeu retourne l'image.
- **Écran de départ** : l'illustration détourée (`public/art/celeste.png`, fond blanc retiré, 900 px de haut) à gauche du menu, masquée en portrait. **Pas dans le cahier**, qui reste sans Céleste (choix antérieur de l'utilisateur).
- **Marionnette redessinée** d'après elle (D-29 conservé) : pyjama bleu clair, myrtilles, col et patte boutonnée à liseré rose, poignets et chevilles roses, nœuds roses, taches de rousseur, chaussons lapin roses (une oreille, le museau clair). Un **liseré sombre** détache le pyjama des murs bleus de la maison (lisibilité, pilier 1). À vérifier sur téléphone, surtout sur le mur clair du salon le matin.
- **Le pyjama est la tenue de la maison seulement** (décision de l'utilisateur) : les tenues des autres zones restent ouvertes (§45) ; elles viendront avec ces zones.

## D-42 — Chat agrandi

- Retour du téléphone : le chat était trop petit à côté des parents agrandis (D-37). Il est agrandi par `CAT_SCALE = 2` (même principe que `PARENT_SCALE`) : endormi, il occupe les deux tiers du tabouret de la chambre ; assis, sa tête arrive à celle de Céleste. PROVISOIRE, à régler sur téléphone.

## D-43 — Croissance : première phase (§7, §16, §42 phase 7)

- **Réponses de l'utilisateur** : même coiffure un peu plus longue ; nouvelle tenue d'après son illustration (robe rose à fleurs, sabots roses) ; « quelques mois » seulement ; pas d'iPhone prévu (la passe « sauvegarde iOS » n'est plus prioritaire).
- **Phase déduite des drapeaux de l'histoire** (`growth.2`) : déjà sauvegardés, donc **aucune migration**. `src/config/growth.ts` décrit chaque phase :
  - la hitbox ;
  - des **facteurs** sur les paramètres de mouvement (les réglages en direct du debug restent valables) ;
  - l'allongement du corps et des couettes ;
  - la tenue.
- **Phase 2 (PROVISOIRE)** :
  - hitbox 12×26 au lieu de 12×22, toujours sous 2 tuiles : tous les couloirs restent praticables sans rien redessiner ;
  - saut ×1,2 (4,2 tuiles) ;
  - vitesse ×1,03 ;
  - corps ×1,25 (la tête ne grandit pas) ;
  - couettes ×1,3.
  - Honnêtement, c'est un peu plus que « quelques mois » dans la réalité, mais c'est le minimum pour un vrai effet de jeu : se hisser sur un rebord de 6 tuiles, hors de portée en phase 1.
- **Passage du temps** : après la visite de papa, Céleste se recouche.
  - Le noir le plus long du jeu (4,2 s), puis un retour lent. Elle a grandi, et sa première pensée reste Maria (introuvable).
  - Aucun texte (pilier 6). Le changement de taille a lieu dans le noir complet (vérifié par un test).
- **Signes des mois passés** : une **toise** au mur de la chambre, avec un nouveau trait rose plus haut. En la regardant, elle devient le souvenir « la toise ». Les traits correspondent aux tailles de Céleste en phase 1 et 2.
- **Raison de revenir** (pilier 2) : une **trouvaille sur une étagère haute du couloir**, au-dessus de la console, visible dès le début.
  - Vérifié par les tests : hors d'atteinte en phase 1, même en grimpant et en difficile ; atteignable en phase 2, au plus moyenne.
  - Rien de ce qui était atteignable en phase 1 ne se ferme en phase 2.
- **Marionnette** : pièce « jupe » ajoutée (vide en pyjama) ; robe rose à fleurs avec col blanc, manches ballon, jambes nues et sabots roses.
- **Écran de départ** : l'illustration correspond à la tenue de la partie sauvegardée (pyjama ou robe).
- **Porte du jardin écartée pour l'instant** : sans le jardin, ce serait une porte qui ne mène nulle part. Elle viendra avec la zone suivante.
- **Debug** : une étape d'histoire « quelques mois plus tard » et une case « Croissance : Céleste a grandi ».

## D-44 — Deuxième capacité : le saut mural (§15)

- **Plan validé** : le saut mural d'abord, testé seul dans un parcours d'essai, puis le jardin (où il s'obtiendra) sur ses valeurs réglées. Un seul mur ne se remonte pas. Tous les murs pleins comptent (règle unique, pilier 3).
- **Geste** (aucun nouveau bouton) :
  - **glissade** : en l'air, en descente, contre une tuile pleine touchée à hauteur des mains, en poussant vers elle au-delà de `wallInputThreshold` (0,5, plus haut que l'escalade : une diagonale molle ne fait pas glisser). La chute est aussitôt ramenée à `wallSlideSpeed` (60 px/s). Céleste est dos au mur. En montée, le mur ne retient jamais.
  - **saut mural** : Saut contre le mur (ou jusqu'à `wallCoyoteMs`, 80 ms, après l'avoir quitté ; le jump buffer compte aussi) : impulsion à l'opposé du mur (`wallJumpSpeedX`, 150 px/s) et vers le haut (`wallJumpHeightTiles`, 2,5 tuiles, hauteur variable comme un saut normal).
  - **verrou** : pendant `wallJumpLockMs` (130 ms), la direction est ignorée et l'élan conservé.
  - **un seul mur ne se remonte pas** : le mur quitté par un saut mural ne retient plus Céleste (ni glissade ni appui) tant qu'elle n'a pas touché le sol, un rebord ou un autre mur. Règle structurelle, indépendante des réglages (avec des réglages plausibles, revenir sur le même mur faisait gagner de la hauteur).
  - **priorités** : au sol (ou pendant le coyote time), Saut reste un saut normal ; un rebord attrapable (escalade) passe avant la glissade. Les étagères traversables, les dangers et les sorties ne retiennent pas.
- **Réglages** dans `src/config/movement.ts` (`wall*`), dans l'overlay et l'export JSON. PROVISOIRES, à régler sur téléphone. Sans la capacité, le mouvement est **inchangé** (testé).
- **État** `WallSlide` dans la machine à états ; pose de la marionnette dos au mur, une main et un pied contre lui.
- **Capacité** `wall-jump`, enregistrée dans `progression.abilities` : **aucune migration**. Indice de prototype écrit (comme l'escalade), pour le jardin.
- **Parcours d'essai 7 « Saut mural »** (menu pause, hors partie) : une cheminée de 4 tuiles (facile), puis une de 5 tuiles au-dessus de briques de jeu (moyen). Nouvelle directive `; @abilities:` : les capacités sont **prêtées** par un parcours d'essai, jamais par une salle de zone. Overlay : case « Capacité : saut mural ».
- **Écart avec le plan annoncé : la lucarne du grenier**. Le plan en faisait la revisite du saut mural. L'analyse montre que le dessus de la lucarne est **déjà atteignable en phase 2** (saut plus haut et escalade, difficulté moyenne) : D-27 le disait hors de portée, ce qui n'est vrai qu'en phase 1. La revisite de la maison par le saut mural est **reportée à la PR du jardin**, où la capacité s'obtient (en PR 1, elle ne s'obtient que par le debug : une revisite ne serait pas testable en jeu).
- **Maison vérifiée** (phase 2, escalade) : le saut mural n'ouvre **rien** de la maison réelle, ni en facile ni en moyen (testé). Seule la trouvaille difficile du passage d'ombres devient atteignable en difficile.

## D-45 — Analyse de faisabilité avec le saut mural (D-16 étendue)

- **Appuis sur les murs** : quand la simulation entre en glissade, l'état est gardé comme un **appui** (même mur, même hauteur à 8 px près, même mur quitté). Depuis chaque appui : un rebond essayé tous les 2 pas pendant 0,6 s de glissade (direction ensuite vers le large, relâchée ou vers le mur quitté ; saut maintenu ou court), et lâcher le mur (glisser jusqu'en bas, se laisser tomber, s'écarter).
- **Fenêtre d'un rebond** : pendant une glissade, rebondir un peu plus tôt ou plus tard mène à des appuis voisins, souvent tous bons. La fenêtre est donc la durée pendant laquelle le rebond mène à un appui d'où l'on peut encore finir le passage avec une marge au moins égale (calcul par point fixe). Un premier essai qui exigeait le même appui exact donnait des fenêtres absurdes (67 ms pour une cheminée facile).
- **Résultat** : des passages de surface à surface « par les murs » (`MoveKind.WallJump`), comparés aux passages directs. Les tests et le graphe de zone n'ont pas changé d'interface.
- **Limites** :
  - la fenêtre mesure la tolérance du timing, pas le rythme d'une cheminée (alterner la direction à chaque rebond) : à juger sur téléphone ;
  - un rebond pendant la montée (possible en jeu) n'est pas essayé : l'analyse est prudente ;
  - coût : 1 à 2 s par salle de la maison avec le saut mural (au lieu de moins d'une seconde).

## D-46 — Le jardin (§7.2), PR 2a

- **Plan validé** : le jardin réel d'abord, le monde étrange du jardin (« derrière la haie ») dans une PR suivante. Réponses de l'utilisateur : Céleste veut jouer dehors parce qu'il fait beau, et y chercher Maria ; les parents sont au jardin ; pas d'image clé pour l'instant.
- **Accès par la croissance** (§16) : la porte de derrière de la buanderie (sortie 3) a une poignée trop haute en phase 1 ; elle s'ouvre en phase 2. Mise en œuvre : `lockedRooms` accepte une sortie précise (`exit`) et une bulle (`icon`, ici « poignée »). Aucune migration.
- **Dans la zone de la maison** : les liaisons ne relient que des salles d'une même zone. Les liaisons entre zones viendront avec le quartier. La carte « Ma maison » s'étend à droite.
- **Salles** (PLACEHOLDER, formes simples) :
  - **terrasse** (facile), **potager** (moyen), **grand arbre** (moyen), **cabane** (saut mural), **allée des toits** (moyen, saut mural) ;
  - boucle : terrasse → potager → arbre → (saut mural) vieux mur → allée → toit de la pergola → terrasse ;
  - difficulté (D-36) : le chemin jusqu'au saut mural est moyen exactement (testé : impossible par des passages faciles seulement).
- **Dehors** : directive `; @world: garden` et palette du jardin (ciel, nuages, collines, herbe, pierres, feuillage, orties). Nouveau matériau plein `v` (feuillage : haies, frondaisons, buissons), dessiné comme les meubles, exactement sur ses tuiles. Directive `; @walls:` pour la couleur de mur d'une salle (la cabane).
- **Histoire** : bulle soleil au réveil « quelques mois plus tard » ; à la première sortie, soleil puis Maria. Parents au jardin (maman étend le linge, papa arrose) avec leurs bulles « ? » puis cœur ; ils quittent la cuisine et le salon après la croissance. Nouvelles étapes : `garden.arrived`, `garden.mom`, `garden.dad`, `garden.hedge`. Aucune migration.
- **Signposting** (§25.3) : un trou sombre dans la haie du fond, qui scintille une fois : la PR 2b.
- **Tests** : le graphe de zone ferme les sorties verrouillées selon la phase, et ignore les passages de l'histoire (monde étrange) après la croissance.

## D-47 — L'araignée au bout de son fil (§18)

- Deuxième ennemi, conçu autour du mouvement : elle monte et descend sous son point d'attache (`a` dans l'ASCII), sur le trajet des sauts de l'arbre et dans la cheminée de l'allée. Elle impose un timing.
- Un coup l'effraie : elle remonte, inoffensive, puis reprend ; deux coups la dispersent. Pas de gore (pilier 8) : petit corps rond, deux yeux clairs.
- Réglages `spiderDropTiles` (4) et `spiderPeriodMs` (3,2 s) dans `src/config/combat.ts` et l'overlay. PROVISOIRES.
- Même classe que le jouet mécanique (`Patroller`, sorte `Spider`) : aucune allocation par pas. Le fil est une image étirée jusqu'à la première surface au-dessus.
- **Limite** : l'analyse de faisabilité ignore les ennemis. Aucune araignée dans les salles des parents (testé).

## D-48 — Revisite de la maison par le saut mural

- Remplace la lucarne du grenier (D-44 : déjà atteignable en phase 2). Une **armoire à linge sur pieds** dans la buanderie, près de la porte de derrière. La cheminée entre elle et le mur mène à une trouvaille sur son dessus. On la voit dès qu'on passe vers le jardin.
- Testé : dans la maison, le saut mural n'ouvre **que** cet endroit, facilement. Hors d'atteinte sans lui.
- L'étagère basse de la buanderie est déplacée un peu à gauche.

## D-49 — Derrière la haie (§6.1, §7.2), PR 2b

- **Plan validé** (« vas-y ») : sur la même branche que le jardin (2a pas encore en PR). Un ou deux passages difficiles sur le chemin principal, juste après une veilleuse ; le bonnet de Maria ; l'escargot.
- **Entrée par l'histoire** (comme D-34) : le trou de la haie, au pied du grand arbre, trop serré pour passer. Agir, une fois le saut mural trouvé (étape `garden.treehouse`, posée en le ramassant dans la cabane). Présage en approchant (rayon de 12 tuiles), puis clignement dans le noir et révélation en cercle. Ré-entrée courte après un évanouissement.
- **Deux salles étranges**, dehors : `; @world: strange` et `; @outdoor: yes` (palette « crépuscule » avec le ciel au lieu du mur). Absentes de la carte.
  - **jardin renversé** (moyen) : bacs géants au-dessus des ronces, décors démesurés (fleur, arrosoir), une cheminée de 4 tuiles entre deux tuteurs géants ;
  - **la ronce** (difficile) : cheminée moyenne avec un escargot, veilleuse turquoise, puis cheminée de 5 tuiles (difficile, testé : moyen jusqu'à la veilleuse, difficile après).
- **Maria** : assise sur un rebord hors d'atteinte (testé, même en grimpant et avec le saut mural) ; elle est là dès l'arrivée et ne bouge jamais ; elle disparaît dans le noir de la fin (pilier 5).
- **Fin et trace (§6.3)** : le bonnet de Maria (PLACEHOLDER, choix de l'utilisateur possible). Le cercle se referme ; Céleste est au pied du grand arbre, le bonnet accroché à une branche. Nouveau souvenir « le bonnet ». Une lanterne est ajoutée au pied de l'arbre (point de retour de la fin).
- **Escargot** (§18, « patrouille sur un mur ») : `o` dans l'ASCII, collé au mur plein voisin ; monte et descend, demi-tour aux bouts ; un coup le fait rentrer dans sa coquille, deux le dispersent. Réglage `snailSpeed` (20 px/s).
- **Sauvegarde** : aucune migration (étapes `garden.treehouse`, `hedge.entered`, `hedge.done`).
- **Tests** : le graphe de zone suit les passages de l'histoire selon la phase (maison en phase 1, jardin en phase 2) et n'ouvre la haie qu'avec le saut mural.
- **Limite** : l'analyse ignore l'escargot, qui se trouve justement sur une paroi de cheminée.

## D-50 — Retours du téléphone : bulles, parents du jardin, graphisme du jardin

- **Bulles** : `THOUGHT_SCALE` 1,9 (au lieu de 1,6), nuage ×1,2, pictogramme ×1,3 dans le nuage. Même taille pour Céleste et les parents.
- **Parents au jardin** (retour de l'utilisateur : varier le « ? ») : maman répond par une **loupe** (« cherche bien »), papa par la **cabane dans l'arbre**, un indice sans texte (pilier 6) ; puis un cœur. Les parents de la maison gardent « ? » puis cœur.
- **Cohérence** (rien ne flotte dans le monde réel) :
  - grand arbre : le vieux mur descend jusqu'à un portail de 3 tuiles (linteau, passage dans l'ombre) ; l'analyse est inchangée (vieux mur toujours réservé au saut mural, testé) ;
  - potager : chaque planche tient sur deux perches croisées plantées dans le sol ou dans un bac ;
  - allée : la haie continue derrière le passage, en tunnel ;
  - plancher de la cabane : jambes de force.
    Le monde étrange garde ses éléments suspendus (lueur dessous, D-34).
- **Dessins plus riches**, toujours par le code et exactement sur la collision : feuillage en volumes, écorce ombrée, bacs de légumes, glycine, nappe, clôture, pierres irrégulières, façade ; ciel à deux plans de collines et arbres lointains.

## D-51 — Jardin adouci : orties qui piquent, ronces fatales, araignées moins bien placées

Retour du téléphone : le jardin était trop dur (araignées touchées à chaque saut, orties qui renvoient aussitôt à la lanterne). Ce niveau de difficulté reste celui visé pour les zones suivantes (D-36).

- **Deux dangers de sol** :
  - `^` **pique** (`Tile.Hazard`) : orties du jardin, briques de jeu de la maison. Céleste rebondit vers le haut et en arrière (`stingBounceY` 360 px/s, recul de l'ennemi), perd un instant le contrôle et la peur monte d'un cran ; trois piqûres rapprochées la font s'évanouir comme trois coups d'ennemi. Délai propre `stingCooldownMs` (500 ms), plus court que l'invulnérabilité : rester dans une fosse pique de nouveau, on ne la traverse pas en marchant.
  - `!` **fatal** (`Tile.Deadly`) : ronces de derrière la haie (upside, thorns) et des zones suivantes. Évanouissement immédiat, retour à la lanterne (comportement d'avant).
  - L'analyse de faisabilité traite les deux comme des sols interdits (inchangée).
- **Araignées** : une seule dans le grand arbre (au-dessus du dernier saut vers la cabane), une dans l'allée (au-dessus du toit de la remise), aucune ailleurs. Descente de 3 tuiles (au lieu de 4), période de 4,5 s (au lieu de 3,2 s). Tests géométriques : en haut de sa course, l'araignée laisse passer (saut ou tête de Céleste), en bas elle barre : il faut choisir son moment, il existe toujours un moment sûr.
- **Potager** : une lanterne sur un bac au milieu (la salle était longue et sans point de retour).
- **Derrière la haie** : inchangé (difficile, voulu).
- **Sauvegarde** : aucune migration.

## D-52 — Retour à l'accueil depuis la pause

- Bouton « Retour à l'accueil » dans le menu pause, à côté de « Carte », confirmé par un second appui (« Quitter ? Tu reprendras à la dernière lanterne »), comme « Nouvelle partie » sur l'accueil.
- **Aucun changement du modèle de sauvegarde** : la progression est déjà écrite à chaque lanterne, salle découverte, capacité, trouvaille, souvenir, étape d'histoire et réglage. On attend la fin des écritures en cours (`SaveManager.flush`), puis la page est rechargée : le démarrage affiche l'accueil, et « Continuer » reprend à la dernière lanterne, comme après une fermeture de l'appli.
- Recharger plutôt que détruire et recréer le jeu Phaser : plus simple et sans fuite (écouteurs, DOM) ; hors ligne, le service worker sert la page (D-23).
- Écarté pour l'instant : sauvegarder la position exacte au moment de quitter (changerait le sens du point de retour, pilier 10 ; à proposer séparément si besoin).

## D-53 — Les parents d'après les illustrations de l'utilisateur

- Deux illustrations fournies (vues de profil, debout). Comme pour Céleste (D-41), elles **ne sont pas collées dans le jeu** : les parents y sont assis, tendent la main, tiennent une tasse, un arrosoir, étendent le linge, et une image fixe ne fait aucune de ces poses ; à ~125 px de haut sur téléphone, seules la silhouette de la coiffure et les couleurs se lisent ; le rendu aquarelle jurerait avec les aplats. Les illustrations ne sont pas ajoutées au dépôt.
- **Parents redessinés par le code** (`familyArt.ts`), poses et animations inchangées :
  - maman : longs cheveux bruns bouclés jusqu'au milieu du dos (boucles en disques, quelques boucles sombres), petite boucle d'oreille, tee-shirt rose col en V rentré dans un jean bleu clair droit ;
  - papa : cheveux châtains ondulés en volume, rejetés en arrière, barbe courte, tee-shirt bleu marine col en V, jean foncé retroussé ;
  - tous deux : manches courtes (bras nus), nez de profil, baskets claires à bande bleue et semelle blanche ; peau un peu plus hâlée.
- **Lunettes de soleil au jardin seulement** (choix de l'utilisateur) : dans la maison, de jour comme la nuit, on voit leurs yeux.
- La **photo de famille** (souvenir, D-38) prend les mêmes couleurs.

## D-54 — Araignées du jardin : juste milieu

- Retour du téléphone après D-51 : devenu un peu trop simple. Une araignée de plus dans le grand arbre (au-dessus du buisson où l'on atterrit depuis la branche du bas) et une dans l'allée (au-dessus du chemin, côté terrasse) : deux par salle. Aller-retour en 3,8 s (entre les 3,2 s d'origine et les 4,5 s de D-51) ; descente toujours de 3 tuiles.
- Toujours un moment sûr : test générique, pour chaque araignée au-dessus d'un sol, remontée elle laisse passer Céleste debout, descendue elle barre le passage.

## D-55 — Papa montre la suite : la haie

- Retour du téléphone : après le saut mural, on ne savait pas quoi faire. Le seul signal (le trou de la haie qui scintille, au pied du grand arbre) est à un endroit où l'on ne repasse pas forcément.
- **Choix de l'utilisateur (B)** : une fois le saut mural trouvé, papa au potager a une nouvelle réponse. Il pense d'abord à Maria disparue, puis sa bulle montre **la haie et son trou qui scintille** (nouveau pictogramme `hedge`), puis un cœur. L'indicateur d'interaction réapparaît au-dessus de lui. Toujours sans texte (pilier 6), et papa ne sait rien de Maria.
- Si Céleste trouve la cabane avant d'avoir parlé à papa, il montre directement la haie (plus la cabane, déjà trouvée). Après être passée derrière la haie, plus d'indice.
- Nouvelle étape `garden.dad-hedge` ; aucune migration.

## D-56 — Tous les dangers du sol piquent ; élan gardé ; ennemis vaincus

Retours du téléphone.

- **Tous les dangers du sol piquent** (remplace le « fatal » de D-51) : orties et briques de jeu (`^`), ronces de derrière la haie (`!`, dessin inchangé, tuile renommée `Tile.Thorns`). Plus aucun évanouissement immédiat au contact ; seules trois piqûres ou coups rapprochés (jauge de peur) font s'évanouir. Une fosse fermée dont on ne sort pas finit donc par un évanouissement, pas par un blocage.
- **Élan gardé** : sur un danger du sol, Céleste rebondit vers le haut **dans le sens où elle allait** (vers l'avant ; immobile, du côté où elle regarde). Le recul à l'opposé ne reste que pour le contact d'un ennemi.
- **Ennemis vaincus** : dispersés, ils le restent tant que Céleste est dans la salle. Ils reviennent après un **évanouissement** (même si la lanterne est dans la même salle, précision de l'utilisateur) et quand on revient dans la salle plus tard.
- L'analyse de faisabilité évite toujours les deux dangers (difficultés inchangées).

## D-57 — Musique : lecteur, emplacements, silence de Maria (§39, §40)

- **Plan validé** (« A ») : le lecteur est prêt avant les morceaux (Suno, préparés par l'utilisateur). Un emplacement sans fichier reste silencieux.
- **Emplacements** (`src/config/audio.ts`) : 6 thèmes et 3 jingles. Thèmes : `title` (accueil), `house-night` (maison le soir), `house-day` (maison le matin et après la croissance), `garden`, `strange` (monde étrange de la maison), `hedge` (derrière la haie). Jingles : `found` (capacité, trouvaille), `memory` (nouveau souvenir), `maria` (optionnel). La maison de nuit et de jour sont séparées (demande de l'utilisateur).
- **Fichiers dans `src/assets/audio/`** et non `public/audio/` : Vite leur donne un nom avec empreinte (un morceau remplacé est bien retéléchargé, pas d'ancien morceau servi par le cache) et ne publie que les fichiers présents. Nom = emplacement (`garden.ogg`). Formats : Opus/Ogg de préférence, M4A ou MP3 acceptés.
- **Choix du thème** : fonction pure (`chooseMusic`) selon le monde de la salle et le moment de la journée ; il change dans le noir des fondus, comme la palette.
- **Mixage pur et testé** (`AudioMix`) : fondus enchaînés à puissance constante (2,5 s) ; boucle en fondu enchaîné avec la fin du morceau (4 s, au plus un quart du morceau), car les morceaux de Suno ne sont pas composés pour boucler ; musique baissée pendant un jingle (30 %) et la pause (45 %).
- **Lecteur** : `HTMLAudioElement` plutôt que des tampons Web Audio. Un morceau de 3 min décodé pèse environ 60 Mo en mémoire, contre 3 Mo compressé. Le fichier est lu une fois en mémoire (blob) : le service worker n'a pas de requêtes partielles à servir, et les deux lecteurs d'une même boucle partagent cette copie. Le son démarre au premier toucher (règle des navigateurs : le thème de l'accueil commence donc au premier toucher). Il s'arrête quand l'appli passe en arrière-plan.
- **Silence de Maria** (§39, choix de l'utilisateur : « à tester, ou un jingle étrange ») : nouvelle étape de script `hush` (non bloquante). La musique s'éteint en 1,2 s, reste tue, puis revient en 3,5 s. Le jingle `maria` est joué s'il existe ; sinon, c'est le silence. Les autres jingles ne sont pas joués pendant ce silence (le souvenir du bandeau, du bonnet). Placée : réveil devant le berceau vide, Maria aperçue sur la bibliothèque, sa disparition, entrée derrière la haie, berceau vide du passage d'ombres, bonnet. Jamais dans un script rejouable (testé).
- **Réglages** : volume et « Couper le son » dans le menu pause. Enregistrés dans la sauvegarde (`settings.audio`), sans migration : une sauvegarde plus ancienne prend les valeurs par défaut (70 %, son actif).
- **Hors ligne et poids** : les morceaux sont précachés (jouables hors ligne dès l'installation). Budget total de 12 Mo (`AUDIO_BUDGET_BYTES`), vérifié par les tests ; `check:pwa` vérifie que chaque morceau publié est précaché (plafond de 6 Mo par fichier). Recommandation : Opus ou MP3 à 96 kbit/s, soit environ 2 Mo par thème de 3 min. Un MP3 brut de Suno (192 kbit/s et plus) ferait dépasser le budget avec 5 thèmes.
- **Debug** : ligne « musique » dans l'overlay (thème voulu, fichier présent ou non, lecture, volume, silence).
- Vérifié dans Chromium avec des sons d'essai (non commités) : démarrage au premier geste, fondu nuit → matin, monde étrange, silence puis retour, boucle en fondu, pause, coupure sauvegardée, jingle, précache.

## D-58 — Du monde étrange à la croissance ; les affaires de Maria ; réveil dans l'herbe

Retours du téléphone. L'utilisateur valide le mouvement et la difficulté pour l'instant ; les réglages du DEBUG restent en place pour une passe plus poussée plus tard.

- **Du monde étrange à la croissance** (choix de l'utilisateur : le câlin de maman, puis la nuit). Avant, il fallait se recoucher en plein matin, sans raison.
  - Fin du monde étrange inchangée jusqu'à papa à la porte : « ? », puis sa bulle montre **maman** (nouveau pictogramme `mom` : boucles brunes, tee-shirt rose).
  - Au salon, Agir près de maman : bulle Maria disparue, cœur de maman, cœur de Céleste. Long fondu : **la nuit tombe** (palette et musique de nuit), les parents ne sont plus en bas, Céleste pense à son **lit**.
  - Se coucher déclenche « quelques mois plus tard » (inchangé).
  - Nouvelle étape `end.mom-hug` ; le moment de la journée vaut « soir » entre le câlin et la croissance. Les réponses du matin de maman et de papa ne se déclenchent plus après la visite de papa (le câlin les remplace) ni la nuit.
  - Une partie arrêtée après la visite de papa passe simplement par le câlin (aucune migration).
- **Les affaires de Maria** : chausson (couloir), biberon (escalier), bandeau (lit, fin du monde étrange), bonnet (dans l'herbe, fin de derrière la haie).
  - On les **ramasse avec Agir** (étincelle, bulle Maria) ; elles disparaissent aussitôt du jeu (`instant`, un geste de Céleste et non un déplacement de Maria : pilier 5 respecté).
  - Le chausson et le biberon remplacent les traces qu'on voyait au passage (déclencheurs `touch`).
  - **Nouvel onglet du cahier**, « Les affaires de Maria », à côté de « Ma maison » et « Mes souvenirs ». Le bandeau et le bonnet quittent « Mes souvenirs ».
  - Le bonnet n'est plus accroché à la branche, et on ne revient plus le regarder.
  - Sauvegarde : les affaires sont enregistrées avec les souvenirs (`progression.memories`), leur liste est dans `MARIA_THINGS`. Nouvelles étapes `maria.slipper`, `maria.bottle`, `maria.headband`, `maria.bonnet` ; aucune migration. Une partie qui avait déjà le bandeau ou le bonnet les revoit une fois dans le jeu jusqu'à les ramasser (sans effet dans le cahier).
- **Sortie de derrière la haie** : Céleste est **assise dans l'herbe** au pied du grand arbre et se relève dès qu'on la bouge, comme au réveil dans la maison (pose assise existante ; une pose allongée reste possible plus tard).

## D-59 — Menu pause allégé ; passage au mode debug depuis le menu

- **Demande de l'utilisateur** : trop d'options dans le menu ; pouvoir passer en mode debug sans taper `/debug`, avec une option visible.
- **Menu du jeu** : Reprendre · Carte · Retour à l'accueil ; Son (volume, couper) ; Commandes tactiles (taille, opacité, réinitialiser) ; Sauvegarde (code, importer) ; Mode debug.
- **Seulement dans le build de debug** : mode du joystick (numérique ou analogique), résolution (logique ou écran, D-18) et parcours d'essai. Les réglages déjà enregistrés s'appliquent toujours.
- **Mode debug = l'autre adresse** : « Passer en mode debug » ouvre `/Maria/debug/`, « Quitter le mode debug » ramène à `/Maria/`. Les écritures de sauvegarde en cours sont terminées d'abord. Même site, donc **même sauvegarde** (IndexedDB par origine) : on reprend à la dernière lanterne. D-12 est inchangée : le jeu ne contient toujours aucun outil de debug. Limite : le mode debug demande du réseau (il n'est pas précaché, D-23). En dev, « quitter » recharge simplement la page.
- **Overlay de debug** : bouton **INFOS** à côté de DEBUG, qui masque ou affiche le cadre d'infos (FPS, état, position, caméra, combat, musique). Le choix est retenu (`localStorage`, build de debug).

## D-60 — La sortie du jardin : le portillon et la rue

- **Plan validé** : le portillon au bout de l'allée, ouvert après le bonnet par une chevillette qu'on atteint en saut mural ; la rue, un grand niveau en long, sur deux étages ; quatre lieux (aire de jeux, école, supérette, chantier, ce dernier choisi par l'utilisateur), fermés pour l'instant ; pas de croissance dans cette phase.
- **Le portillon** : au fond de la cheminée de l'allée (entre la remise et le vieux mur), un passage sous le vieux mur mène au portillon (allée:3 ↔ rue:1). Une ficelle rouge court du portillon, sous le linteau, puis le long du mur jusqu'à une **chevillette** pendue haut dans la cheminée (« tire la chevillette… »). On ne l'atteint qu'en saut mural (testé : même au plus haut d'un saut depuis le sol, la tête n'y arrive pas), et seulement après le bonnet. Agir la tire : le portillon s'ouvre et reste ouvert (étape `garden.gate`). Fermé, il bloque la sortie avec une bulle « portillon ».
  - Le fond de la cheminée n'a plus que deux cases d'orties sur quatre (on y marche pour entrer dans le passage) ; la cheminée elle-même ne change pas.
  - Papa, au potager, montre le portillon une fois le bonnet trouvé (étape `garden.dad-gate`, nouveau pictogramme `gate`).
- **La rue** (`; @world: street`, 200 × 30 tuiles, PLACEHOLDER, de jour) :
  - **trottoir facile** (testé) : poubelles, voitures garées, banc, abribus, cagettes ; deux lanternes (près du portillon, sous l'abribus) ;
  - **au-dessus, plus difficile** : rebords des fenêtres et corniche de l'école, lampadaires, store, enseigne et toit de la supérette, échafaudage du chantier ; deux trouvailles (toit de l'école, haut de l'échafaudage), **moyennes exactement** (testé : impossibles par des passages faciles) ;
  - **quatre portes fermées** (Agir : bulle « ? », rejouable) ; chaque lieu aura sa propre salle. Les portes de façade (sorties au milieu d'une salle) ne sont pas encore nécessaires : elles viendront avec le premier lieu ;
  - pas d'ennemi pour l'instant ; ni orties ni ronces (une rue) ;
  - palette `STREET_PALETTE` (le ciel du jardin, un trottoir de dalles grises) ; nouvel emplacement de musique `street`.
- **Une zone, deux pages de carte** : la rue est dans la même zone que la maison et le jardin (une seule histoire, une seule analyse de faisabilité, aucune liaison entre zones à écrire) ; `MapBox.page` range chaque salle sur une page du cahier : « Ma maison » ou **« Mon quartier »**. Les liaisons entre zones séparées restent possibles plus tard si le monde grandit beaucoup.
- **Habillage par blocs proches de la vue** (moteur) : seuls les blocs (512 px) proches de la caméra sont dessinés, un par image, tout d'un coup dans le noir ; les blocs lointains sont libérés, et chaque bloc ne dessine que les éléments de décor qui le touchent. Une salle très longue ne coûte donc pas plus de mémoire qu'une salle de la maison (au plus 10 blocs mesurés dans la rue). Nombre de blocs affiché dans l'overlay de debug.
- **Sauvegarde** : aucune migration (étapes `garden.gate`, `garden.dad-gate`).
- **Debug** : étapes « le bonnet trouvé (portillon à ouvrir) » et « portillon ouvert (la rue) ».

## D-61 — Le quartier : plan du niveau, portes de façade, l'aire de jeux (PR 1)

- **Plan validé** (le quartier, d'après `MARIA_Histoire_Monde_Etrange.md`) :
  - **un seul niveau**, des lieux **connectés** derrière les façades plutôt qu'une étoile de culs-de-sac (changement de structure signalé et accepté) : aire de jeux → cour de l'école → école (sa porte de façade s'ouvre de l'intérieur : raccourci) ; supérette → réserve → chantier → haut de l'échafaudage de la rue (boucle) ;
  - **ordre de jeu** : l'aire de jeux (maman), où l'on voit la cour de l'école hors d'atteinte ; la supérette (papa) et le chantier, où l'on trouve le **parapluie** ; retour à l'aire de jeux, et en planant la cour, puis l'école ;
  - **le monde étrange est dans l'école** (choix de l'utilisateur) : l'école déformée ; la **boîte à formes** (objet d'enfance, seulement dans le monde étrange) ; **Maria n'y est pas montrée**, seulement suggérée par un trou en forme de Maria dans la boîte (option B, si lisible ; sinon rien, option C). On ne ramasse pas la boîte : on la regarde, elle devient un souvenir d'une nouvelle rubrique du cahier, « Monde étrange » ;
  - **parapluie** (nouvelle capacité, choix de l'utilisateur) : planer en appuyant une **deuxième fois** sur Saut en l'air (le garder appuyé ne change aucun saut actuel). Testé seul d'abord (parcours d'essai), avec une **bulle d'aide** et une **page du cahier** qui liste les capacités acquises et comment s'en servir (demande de l'utilisateur) ;
  - **parents** : maman à l'aire de jeux, papa à la supérette ;
  - **fin du niveau** : cour de l'école au crépuscule, maman vient chercher Céleste, la nuit dans sa chambre avec une lueur turquoise au loin par la fenêtre ; au matin, la palissade du chantier s'ouvre vers le niveau suivant, **avec des indices pour y retourner** (demande de l'utilisateur) ;
  - pas de croissance dans ce niveau ; le portique de bébé (jardin renversé) reste de côté ;
  - découpage : PR 1 portes de façade et aire de jeux ; PR 2 le parapluie seul ; PR 3 supérette et chantier ; PR 4 l'école et son monde étrange, fin du niveau.
- **Portes de façade** (moteur) :
  - directive `; @door: <n> <col> <ligne>` : une sortie au milieu d'une salle, numérotée comme les sorties latérales ; la tuile est celle où Céleste se tient devant la porte ;
  - reliée dans `zone.ts` comme une sortie (`street:2` ↔ `playground:1`), à une sortie latérale ou à une autre porte ; validée (reliée une fois, on tient debout devant) ;
  - on la franchit avec **Agir**, au sol, à 2 tuiles près (`DOOR_REACH_TILES`) : étincelle au-dessus de la porte, bouton « Agir » ; jamais en la touchant. Un déclencheur de l'histoire à portée passe avant ;
  - `lockedRooms` s'applique aux portes (bulle, sans passage) ;
  - on arrive devant la porte arrêtée ; même fondu qu'une sortie ;
  - carte : trait direct de la porte (bord haut de la rue) au lieu, dessiné au-dessus ; analyse de faisabilité : une porte est un passage comme une sortie.
- **L'aire de jeux** (`playground`, PLACEHOLDER, `; @world: street`, sol souple par `; @floor:`) : banc de maman et lanterne, bac à sable, tourniquet, cage à écureuil, portique, tour du toboggan (**moyenne** exactement : saut de 6 tuiles du portique à la plateforme), toit de la tour, nichoir en haut de son mât (trouvaille **difficile** exactement, depuis le toit) ; au fond, le grillage de l'école et son trou, **hors d'atteinte** (testé : même en difficile), pour le parapluie.
- **Histoire** : une fois le portillon ouvert, maman quitte le linge (terrasse) pour un banc de l'aire de jeux (hors de la vue) ; Agir : Maria disparue, maman « cherche bien », cœur (étape `street.mom`). Le déclencheur « ? » de la porte de l'aire de jeux est remplacé par la porte.
- **Sauvegarde** : aucune migration (étape `street.mom`).

## D-62 — Troisième capacité : le parapluie (le quartier, PR 2)

- **Plan validé** (D-61) : le parapluie seul d'abord, dans un parcours d'essai, comme le saut mural (D-44). Il s'obtiendra au chantier (PR 3). **Changement de mouvement** signalé et accepté.
- **Geste** (aucun nouveau bouton) :
  - en l'air, une **nouvelle pression de Saut** qui n'est ni un saut (coyote, jump buffering) ni un saut mural **ouvre le parapluie** ; tant que Saut est tenu et que Céleste descend, la chute est freinée (`glideBrake`, 1 600 px/s²) jusqu'à `glideFallSpeed` (50 px/s, contre 380) ; le contrôle aérien est inchangé ;
  - **lâcher Saut le referme** ; il se referme aussi au sol, contre un mur (la glissade passe avant), suspendue à un rebord ou touchée ;
  - **les sauts actuels ne changent pas** : garder Saut appuyé pendant un saut ordinaire n'ouvre rien (testé : trajectoire identique avec et sans la capacité) ;
  - la pression reste mémorisée : juste avant d'atterrir, elle fait toujours sauter (jump buffering, testé).
- **Réglages** `glideFallSpeed` et `glideBrake` dans `src/config/movement.ts`, l'overlay et l'export JSON. PROVISOIRES, à régler sur téléphone. Case « Capacité : parapluie » dans l'overlay.
- **État** `Glide` ; marionnette : le bras avant tient le parapluie bien haut (pièce `umbrella`, jaune à pois, PLACEHOLDER, remplaçable par une image `celeste-umbrella`), il s'ouvre et se ferme vite.
- **Capacité** `umbrella` dans `progression.abilities` : **aucune migration**.
- **Aide** (demandes de l'utilisateur) :
  - à l'obtention, en plus de l'indice écrit (comme les autres capacités), une **bulle d'aide** pictogramme au-dessus de Céleste : deux flèches de saut, puis le parapluie ouvert ;
  - **nouvel onglet du cahier, « Mes capacités »** : une ligne par capacité, dans l'ordre où on les trouve ; acquise, son pictogramme et comment s'en servir ; sinon une case vide en pointillés, sans rien dévoiler. Un texte court dans le cahier (interface), comme les titres des onglets.
- **Analyse de faisabilité** (D-16 étendue) : avec l'option `glide`, chaque saut (en courant ou sans élan) est aussi essayé avec une nouvelle pression au sommet, tenue jusqu'au sol, et chaque chute par le bord avec le parapluie ouvert aussitôt ; portée et durée simulées allongées d'autant. Sans l'option, l'analyse est inchangée (difficultés de toutes les salles identiques). Limite : l'ouverture n'est essayée qu'au sommet (la plus longue), pas plus tard ; pas de parapluie après un saut mural dans l'analyse (prudente).
- **Parcours d'essai 8 « Parapluie »** (menu pause, hors partie, prête escalade, saut mural et parapluie) : du haut d'une tour, planer au-dessus des briques de jeu jusqu'à un îlot (facile avec le parapluie, impossible sans), puis une longue traversée sous un plafond bas (moyen, 108 ms).
- **Limite connue** : quatre onglets tiennent sur un téléphone en paysage ; un cinquième (« Monde étrange », PR 4) demandera des onglets plus petits.

## D-63 — Le quartier, PR 3 : la supérette et le chantier

- **Plan validé** (D-61) : supérette → réserve → chantier, où le parapluie s'obtient ; boucle par le haut de l'échafaudage de la rue ; papa à la supérette ; revisites avec le parapluie.
- **La supérette** (`shop`, porte de façade 4 de la rue, dedans : `; @indoor: yes`, palette de jour et murs carrelés, musique de la rue) : vitrine, caisse, deux rayonnages, frigos ; au fond la réserve, une pile de cartons sur un rayonnage ouvert dessous (on passe dessous : aucun piège), puis un saut de 6 tuiles jusqu'à l'étagère devant la porte de la réserve (**moyen** exactement).
- **Le chantier** (`shop:2` ↔ `site:1`, dehors, `; @difficulty: hard`, le lieu réel le plus exigeant) :
  - une banche pendue à la grue (ouverte dessous) et un mur de béton font une cheminée de 4 (saut mural) ; l'échafaudage et sa lanterne (**moyen** exactement depuis l'entrée) ;
  - puis des planches au-dessus des gravats jusqu'à la flèche de la grue (**difficile** exactement), avec deux araignées pendues à la flèche ; le **parapluie** est coincé au bout de la flèche ;
  - avec lui, on plane jusqu'à la **sortie haute** (`site:2` ↔ `street:3`, le haut de l'échafaudage de la rue : **une boucle**) et jusqu'à la lampe de chantier (trouvaille **difficile**) ; sans lui, ni l'une ni l'autre (testé) ;
  - **gravats** (`^` avec `; @hazard: rubble`) : dessin propre, mêmes règles que les orties (ils piquent) ;
  - la cabine de la grue reste hors d'atteinte (signposting d'une capacité future).
- **La rue** : porte de façade de la supérette ; sortie haute à droite (au bout de l'échafaudage, qui va jusqu'au mur) ; la porte du chantier reste fermée (bulle « ? »), elle s'ouvrira avec la fin du niveau (D-61). Le quartier est donc relié : rue ↔ supérette ↔ chantier ↔ rue.
- **Histoire** : une fois le portillon ouvert, papa quitte le potager pour la supérette (hors de la vue). Maman, à l'aire de jeux, montre maintenant **papa** (nouveau pictogramme) ; papa montre **la grue** (nouveau pictogramme), sans rien savoir, puis un cœur (étape `street.dad`).
- **Revisites avec le parapluie** (§15, pilier 2) : une trouvaille sur l'antenne du toit de la supérette, depuis la corniche de l'école (**moyenne**) ; une trouvaille sur un nichoir au fond du potager, depuis le haut des tuteurs (**moyenne**). Toutes deux impossibles sans le parapluie (testé).
- **Faisabilité** : le graphe de zone des tests prend le parapluie en option ; « jamais coincée » est vérifié avec et sans lui.
- **Coût des tests** : l'analyse de toute la zone avec le parapluie prend environ 2 à 3 minutes (fichier `site.test.ts`).
- **Sauvegarde** : aucune migration (étape `street.dad`, capacité `umbrella`).

## D-64 — Le quartier, PR 4 : l'école, son monde étrange et la fin du niveau

- **Plan validé** (D-61) : la cour par le trou du grillage de l'aire de jeux (avec le parapluie), l'école, son monde étrange et la boîte à formes ; la fin au crépuscule dans la cour ; des indices qui renvoient au chantier pour la suite.
- **La cour de l'école** (`playground:2` ↔ `schoolyard:1`, facile) : on y arrive en planant par le trou du grillage (**facile avec le parapluie, impossible sans**, testé), sur le toit du local à vélos ; préau, platane, banc, lanterne ; trouvaille sur le panier de basket (**moyenne**, en planant). Pas de retour par le grillage : on sort par l'école.
- **L'école** (`schoolyard:2` ↔ `school:2`, dedans, facile) : portemanteaux, tableau (soleil, maison), petites tables, étagères qui montent jusqu'à l'oculus. La porte côté rue (`school:1` ↔ porte de façade 5 de la rue) **ne s'ouvre que de l'intérieur** (Agir sur la poignée, étape `school.open`) : un raccourci, jamais un piège. Depuis la rue, la porte de l'école reste fermée (bulle « ? ») tant qu'on ne l'a pas ouverte de l'intérieur.
- **Le monde étrange de l'école** (`school-strange`, hors carte, `; @difficulty: hard`, musique `street-strange`) : on y entre par l'oculus (présage, puis étincelle, secousse, cercle), comme pour la bibliothèque (D-34). Un sol de **crayons** (`; @hazard: pencils`, mêmes règles que les orties), des tables géantes (**moyen** jusqu'à la première lanterne), des piles de livres et des chaises qui flottent (**difficile** ensuite), jusqu'au couvercle géant de la trieuse de formes. **Impossible sans le parapluie** (testé). Le tableau y montre un cercle, un carré, un triangle.
- **La boîte à formes** : on la regarde (Agir), on ne la prend pas, elle reste dans le monde étrange (choix de l'utilisateur). Un de ses trous a **la forme de Maria** (option B : lisible au téléphone émulé), une lueur turquoise en sort ; Maria n'est pas montrée (pilier 5). Elle devient un souvenir de la nouvelle rubrique du cahier **« Monde étrange »** (`STRANGE_THINGS`, sans migration : même liste de souvenirs dans la sauvegarde).
- **Fin du niveau** (silence de Maria pendant la boîte, D-57) : le cercle se referme ; Céleste est assise dans la cour au **crépuscule** (nouvelle palette de la rue `STREET_DUSK_PALETTE`), maman vient la chercher (cœurs) ; la nuit, dans sa chambre, **la grue du chantier au loin par la fenêtre, une lueur turquoise au bout de la flèche** (objet « vu par une fenêtre », sans surface sous lui). La chambre reste fermée (bulle « lit ») jusqu'à ce qu'elle se couche ; au réveil (étape `street.morning`), c'est le matin.
- **Indices vers le chantier** (demande de l'utilisateur) : la grue vue la nuit ; Céleste y pense au réveil (bulle grue) ; à l'aire de jeux, maman montre la grue (`street.mom-crane`) ; **la porte de la palissade est ouverte**, une lueur turquoise dedans, avec un présage en approchant. Pour l'instant, Agir devant donne une bulle « ? » : le niveau suivant n'existe pas encore.
- **Moteur** : `; @music:` choisit la musique d'une salle (`MusicContext.room`) ; objets « fenêtre » (`WINDOW_PROP_KINDS`) ; icône de carte « école » ; onglets du cahier plus petits sur téléphone (cinq onglets).
- **Debug** : deux histoires de plus (« l'école ouverte », « le lendemain de l'école ») ; cocher aussi « Capacité : parapluie ».
- **Tests** : `school.test.ts` (accès, difficultés exactes, porte qui s'ouvre de l'intérieur, la boîte, le soir puis le lendemain, jamais coincée avec et sans parapluie). Les passages de l'histoire de l'école comptent après la croissance, comme ceux du jardin.
- **Sauvegarde** : aucune migration (étapes `school.*`, `street.morning`, `street.mom-crane` ; souvenir `shape-box`).

## D-65 — La gare, PR 1 : le parapluie s'ouvre au sommet ; le crochet et les câbles

- **Plan du niveau validé** (la gare, après le quartier) : 5 PR. PR 1 le crochet seul ; PR 2 la gare réelle (voies, quais et passerelle, hall, dépôt, bureau des objets trouvés ; porte de façade 6 à la palissade ; trains en danger simple : un souffle qui repousse, annoncé par un feu) ; PR 3 le système de boss (poursuite verticale) dans un parcours d'essai ; PR 4 le monde étrange de la gare, la tour des objets perdus (un tas de valises coiffé d'une casquette de contrôleur, sans visage ; contacts qui font monter la peur), Roger et le premier court souvenir (rejouable depuis le cahier) ; PR 5 la fin (papa seul sous l'horloge du hall), la phase 3 de croissance, un train à quai comme indice vers la suite. La poignée-crochet se trouve au bureau des objets trouvés et **s'ajoute au parapluie**.
- **Parapluie : ouverture au sommet** (changement de mouvement demandé par l'utilisateur, remplace le geste de D-62) : un saut (au sol, mural ou depuis un câble) **tenu jusqu'au sommet** ouvre le parapluie `glideAutoDelayMs` (40 ms, choix de l'utilisateur) après le sommet. Relâcher Saut avant renonce ; relâcher après le referme. **Gardé aussi** (choix de l'utilisateur) : une nouvelle pression de Saut en l'air l'ouvre aussitôt (chute d'un bord, saut court).
  - Conséquence : avec le parapluie, un saut complet tenu jusqu'au sol plane ; pour un saut complet sans plané, lâcher Saut au sommet. Sans le parapluie, rien ne change (testé). Avec lui, la trajectoire est identique **jusqu'au sommet** (testé).
- **Le crochet** (capacité `hook`, extension du parapluie, ne sert qu'en planant) :
  - **câbles** : directive `; @cable: col1 ligne1 col2 ligne2` (bouts au centre des tuiles), un segment, pas une tuile ; dessinés droits sur leur collision (fil sombre, liseré clair ; turquoise dans le monde étrange) ;
  - **accroche** : parapluie ouvert, en descente, le crochet (`cableHookAbovePx`, 6 px au-dessus de la tête) croise le câble par le dessus. Jamais en montant. Il faut la place pour pendre dessous ;
  - **glissade** tant que Saut est tenu : câble en pente, toujours vers le bas, accélération `cableAccel` × pente ; câble plat (pente < `cableFlatSlope`), dans le sens d'arrivée ; vitesse entre `cableMinSpeed` (110) et `cableMaxSpeed` (240 px/s). Le joystick ne change rien ;
  - **lâcher Saut lâche le câble**, avec l'élan, parapluie fermé. Au bout, Céleste est lâchée avec l'élan, parapluie ouvert si Saut est tenu. Un obstacle sur le trajet la fait lâcher sans élan. Touchée, elle lâche ;
  - **saut depuis le câble** (demande de l'utilisateur, « relâcher-clic rapide ») : une pression de Saut dans les `cableJumpWindowMs` (120 ms) après avoir lâché le câble (ou au bout) fait sauter de `cableJumpHeightTiles` (2 tuiles), avec l'élan ; tenu, le parapluie se rouvre au sommet : on enchaîne les câbles ;
  - pas d'attaque pendant la glissade ; état `Cable` ; pose : le bras tendu, le parapluie replié pendu par son crochet (pièce `hook`, remplaçable par une image `celeste-hook`).
- **Réglages** `glideAutoDelayMs` et `cable*` dans `src/config/movement.ts`, l'overlay et l'export JSON. PROVISOIRES. Case « Capacité : crochet du parapluie » dans l'overlay.
- **Aide** : bulle du parapluie redessinée (une longue flèche tenue, puis le parapluie) ; bulle du crochet (le parapluie pendu à un câble, une flèche le long) ; page « Mes capacités » : une ligne de plus, et le texte du parapluie mis à jour.
- **Analyse de faisabilité** (D-16 étendue) : avec le parapluie, un saut « sans plané » est relâché au sommet ; le saut « plané » est tenu jusqu'au sol (ouverture au sommet). Avec l'option `hook`, les câbles sont suivis par la vraie simulation, avec trois sorties essayées : Saut tenu, lâché à la sortie du premier câble, ou saut depuis ce câble. Limites (prudentes) : on ne lâche jamais un câble en route ; la fenêtre du saut depuis le câble (120 ms) n'est pas mesurée ; pas de plané après un saut mural.
- **Parcours d'essai 9 « Crochet »** (facile, prête escalade, saut mural, parapluie et crochet) : de la tour, un long câble en pente jusqu'à l'îlot ; un câble plat, puis un saut depuis son bout pour attraper le câble suivant, plus haut, jusqu'à l'arrivée. Impossible sans le crochet (testé).
- **Sauvegarde** : aucune migration (capacité `hook` dans `progression.abilities`).

## D-66 — La gare, PR 2 : la gare réelle, les trains, le crochet trouvé, les revisites

- **Plan validé** (D-65) : la gare réelle derrière la palissade du chantier ; la poignée-crochet au bureau des objets trouvés ; les trains en danger simple ; papa et maman en retrait (aucun parent dans la gare).
- **Accès** : la palissade du chantier devient la **porte de façade 6** de la rue (`street:6` ↔ `station-tracks:1`), fermée tant que ce n'est pas le lendemain de l'école étrange (`lockedRooms`, bulle « ? »). Les déclencheurs `street-site` et `street-site-open` sont retirés. Le présage de la palissade s'arrête une fois Céleste arrivée à la gare.
- **Cinq salles** (PLACEHOLDER, `; @world: street`, musique `station`), nouvelle page du cahier **« La gare »** :
  - **les voies** (moyen) : quais, deux voies en contrebas, abris, cagettes ; le **portique de signalisation** (trouvaille **moyenne** exactement) ; le **poste d'aiguillage sur pilotis**, au bout d'une caténaire (trouvaille, **seulement avec le crochet**) ;
  - **les quais et la passerelle** (difficile) : la passerelle monte par un escalier, enjambe la voie et file jusqu'à la galerie du hall (une **boucle** : quai ↔ hall par le sol, passerelle ↔ galerie) ; le pilier de la marquise et le mur font une cheminée de 5 (trouvaille **difficile** exactement) ;
  - **le hall** (facile) : verrière, grande horloge, tableau des départs (sans texte), kiosque, galerie, marches scellées au mur ; la porte du bureau des objets trouvés (porte de façade 4) ; un câble sous la verrière jusqu'à un rebord (trouvaille, **seulement avec le crochet**) ;
  - **le bureau des objets trouvés** (moyen) : guichet, étagères de choses perdues par des inconnus (rien à Céleste dans le monde réel), haute armoire, casiers. La **poignée-crochet** en haut de l'armoire : **moyenne** exactement depuis la palissade (c'est le chemin du niveau). Tout en haut des casiers, une porte entrouverte et une lueur turquoise, avec un présage ; Agir : bulle « ? » (PLACEHOLDER, le monde étrange vient avec la PR 4) ;
  - **le dépôt** (moyen, à ciel ouvert) : wagons garés au-dessus des fosses de gravats, puis les crochets du pont roulant (trouvaille **moyenne** exactement).
- **Trains (danger simple, choix de l'utilisateur)** : directive `; @train: <ligne des rails> left|right`. Un train passe toutes les `trainPeriodMs` (9 s) : calme, puis le **feu** clignote (`trainWarnMs`, 2 s), puis le train traverse la salle (`trainPassMs`, 1,6 s). Son **souffle** accompagne le train : là où il passe, sur les 3 lignes au-dessus des rails, Céleste est repoussée dans le sens du train et vers le haut, perd un instant le contrôle, et la peur monte d'un cran ; **une fois par passage**. Jamais de contact avec le train lui-même. Les quais font au moins la hauteur du souffle (testé). Le cycle repart au chargement de la salle et après un évanouissement. Réglages dans `src/config/combat.ts` et l'overlay (DEBUG → Combat). Le train et les feux sont dessinés par `TrainView` (une image par train et par feu). L'analyse de faisabilité ignore les trains (comme les ennemis).
- **Revisites avec le crochet** (pilier 3, §15) :
  - la **terrasse** du jardin : le fil à linge à poulie, du toit de la pergola (par l'allée) à la fenêtre de la chambre ; au bout, la jardinière (trouvaille) ;
  - la **rue** : un fil tendu de la corniche de l'école au platane ; au bout, un nid (trouvaille).
    Toutes deux impossibles sans le crochet, faciles avec (testé). Le hauban de la grue du chantier, envisagé, est écarté : la cabine est un décor collé au mât, déjà au bord de la flèche ; il n'y avait pas de place pour un vrai trajet.
- **Histoire** : en arrivant sur les voies, Céleste pense à Maria (étape `station.arrived`). L'histoire de la gare est dans son propre fichier (`src/levels/station/story.ts`), réunie à celle de la maison.
- **Debug** : histoire « la gare (le crochet à trouver) ».
- **Corrigé** : les câbles de la salle de départ (au lancement d'une partie) n'étaient pas dessinés.
- **Tests** : `station.test.ts` analyse seulement les salles de la gare (coût) : accès, trains, difficultés exactes, trouvailles au crochet, jamais coincée avec et sans le crochet, revisites. `zoneGraph` prend le crochet en option.
- **Sauvegarde** : aucune migration (étape `station.arrived`, capacité `hook`, trouvailles).

## D-67 — La gare, PR 3 : le système de boss (poursuite verticale), dans un parcours d'essai

- **Plan validé** (D-65) : le premier boss est un **examen de mouvement** (§19), pas un combat. Quelque chose de grand et sans visage monte derrière Céleste. Le système est d'abord essayé seul dans un parcours d'essai ; la tour des objets perdus (PR 4) l'utilisera.
- **Données** (directives de salle) :
  - `; @chase: <ligne>` : la ligne d'arrivée ; pieds au-dessus, la poursuite s'arrête et il redescend ;
  - `; @chase-phase: <ligne> <tuiles/s>` (répétable, de bas en haut) : la vitesse de montée tant que Céleste est sous cette ligne ;
  - `; @chase-trip: col ligne l h <recul>` (répétable) : un croc-en-jambe ; quand Céleste passe dedans (par exemple pendue à un câble), il recule de `recul` tuiles et s'arrête un moment (`chaseTripPauseMs`). Une fois par essai ;
  - `; @camera: up` : la vue monte de `CHASE_CAMERA_UP_PX` (30 px) au-dessus de Céleste, pour voir où aller et garder le poursuivant en bas de l'écran.
- **Règles** (cœur pur et testé, `src/core/boss/Chase.ts`, mené par `CombatWorld`) :
  - au départ et après une réapparition, il repart `chaseRestartGapTiles` (7) sous les pieds de Céleste et attend `chaseStartDelayMs` (1,5 s) ;
  - il monte à la vitesse de la phase (× `chaseSpeedScale`) ; s'il a plus de `chaseMaxGapTiles` (7) de retard, il remonte hors de la vue (présent sans être injuste) ; pas pendant un arrêt ;
  - **le toucher** : Céleste rebondit vers le haut (`chaseContactBounceY`), perd un instant le contrôle, **la peur monte d'un cran** (choix de l'utilisateur, comme les dangers depuis D-56) ; il recule (`chaseContactRecoilTiles`) et s'arrête (`chaseContactPauseMs`). Trois contacts : évanouissement doux, retour à la lanterne de la phase (D-20, D-21), il repart sous elle ;
  - réglages dans `src/config/combat.ts` et l'overlay (DEBUG → Combat). PROVISOIRES.
- **Le poursuivant** (PLACEHOLDER, `ChaseView`) : un tas de valises, de manteaux et de parapluies perdus, violet sombre, un liseré turquoise sur le dessus, coiffé d'une **casquette de contrôleur**, **sans visage** ; il respire lentement. Trois images par salle. Inquiétant, jamais horreur (pilier 8).
- **Durée des passages** (analyse de faisabilité, D-16 étendue) : chaque passage porte `durationMs`, de l'élan (course depuis le bord de la surface, placement, glissade contre un mur) jusqu'à l'atterrissage, au pire sur sa fenêtre. Pour les passages par les appuis sur les murs, c'est le plus rapide des enchaînements qui gardent la fenêtre (plus courts chemins entre appuis).
- **Test de rythme** : pour chaque phase, le chemin le plus rapide (fenêtres de la difficulté de la salle) de la lanterne de la phase à la suivante doit prendre **entre 40 % et 80 %** du temps qu'il faut au poursuivant pour monter jusque-là (départ sous Céleste, attente, vitesse de la phase ; les crocs-en-jambe ne sont pas comptés). Il presse vraiment, sans être impossible. Limite : le chemin le plus rapide est celui d'un joueur parfait ; un vrai joueur est plus lent (d'où la marge), à juger sur téléphone.
- **Parcours d'essai 10 « Poursuite »** (facile en statique, la pression vient du poursuivant ; prête escalade, saut mural, parapluie et crochet) : une cheminée de valises (saut mural), des valises qui flottent puis un câble au-dessus d'une pile de valises qui le fait trébucher, une dernière cheminée et des valises jusqu'en haut. Une lanterne au début de chaque phase. Vitesses : 5,1, 1,1 et 2,3 tuiles/s (le chemin le plus rapide prend environ la moitié du temps du poursuivant).
- **Sauvegarde** : aucun changement (parcours d'essai hors partie).

## D-68 — La gare, PR 4 : le monde étrange de la gare, la tour, Roger et le premier court souvenir

- **Plan validé** (D-65) : le monde étrange derrière les casiers du bureau des objets trouvés ; la tour des objets perdus avec le premier boss (D-67) ; Roger, la peluche singe, tout en haut ; on le regarde sans le prendre ; il déclenche le premier court souvenir du jeu, rejouable depuis le cahier (choix de l'utilisateur).
- **Entrée** (comme l'oculus de l'école, D-64) : en haut des casiers, la porte entrouverte et sa lueur ; Agir : scintillement, secousse, clignement dans le noir, le monde étrange se révèle en cercle. Après un évanouissement avant la première veilleuse turquoise, les casiers y ramènent (version courte). Pas de sortie volontaire. La bulle « ? » provisoire (D-66) est retirée ; le présage s'arrête une fois Roger trouvé.
- **Deux salles** (`; @world: strange`, hors carte, musique `station-strange`, PLACEHOLDER) :
  - **les objets perdus** (moyen) : le hall à l'envers (verrière en bas, bancs au plafond, horloge renversée qui flotte), des valises qui flottent au-dessus des **pointes de parapluies** (`; @hazard: umbrellas`, mêmes règles que les orties), la montagne des choses perdues et sa veilleuse turquoise (**moyenne** exactement) ; puis un câble jusqu'à un rebord et une cheminée de valises jusqu'à la tour (**moyenne** exactement, **impossible sans le crochet**, testé) ;
  - **la tour des objets perdus** (le boss, D-67) : la géométrie du parcours d'essai 10 (cheminée de valises, valises qui flottent, câble et croc-en-jambe, dernière cheminée), une veilleuse au bas de la tour et au début de chaque phase. Le rythme est vérifié avec Céleste grandie (phase 2) : le chemin le plus rapide prend 40 à 80 % du temps du poursuivant.
  - Écart avec le plan : « moyen puis difficile » est devenu **moyen** pour les deux salles en statique. Une cheminée plus large que 5 devenait impossible en phase 2 ; la difficulté de la fin vient du poursuivant.
- **Roger** : objet de mise en scène (`roger`, dessiné par le code : corps brun, visage et ventre beiges, grandes oreilles, longs bras, queue enroulée), assis en haut de la tour. Agir : il devient un souvenir de la rubrique « Monde étrange » (`STRANGE_THINGS`), une bulle cœur, puis **le court souvenir**. Maria n'est ni dans ce monde ni dans le souvenir (pilier 5).
- **Courts souvenirs** (nouveau système, `FLASHBACKS`) : étape de script `flashback` (bloquante, 7 s) ; une vignette plein écran en DOM au-dessus du jeu, qui apparaît et disparaît lentement et respire un peu (animation CSS), sans texte. Dessinée par le code (`flashbackArt.ts`), couleurs chaudes et passées : **Céleste toute petite, ses lunettes rondes roses (pour la reconnaître ; à valider), assise sur un tapis, serre Roger, les yeux fermés**, un lit à barreaux et une lampe derrière. Dans le cahier, toucher Roger rejoue la vignette en grand.
- **Fin** (PLACEHOLDER) : le cercle se referme ; Céleste est assise sur un banc du hall (point de retour : la veilleuse du hall), elle pense à Maria. La suite (papa, la nuit, la phase 3) vient avec la PR 5.
- **Debug** : histoires « la gare étrange (les objets perdus, la tour) » et « Roger trouvé (fin de la gare étrange) ».
- **Tests** : `stationStrange.test.ts` (entrée, difficultés exactes, crochet nécessaire, Roger, rythme de la poursuite en phase 2, jamais coincée). Le calcul du rythme est partagé (`tests/pace.ts`).
- **Sauvegarde** : aucune migration (étapes `station.strange`, `station.done`, souvenir `roger`).

## D-69 — La gare, PR 5 : la fin du niveau, papa sous l'horloge, la phase 3, le train à quai

- **Plan validé** (D-65) : papa seul vient chercher Céleste ; la nuit ; des mois passent ; **phase de croissance 3** (queue de cheval, nouvelle tenue) ; la toise a un nouveau trait ; rien d'atteignable avant ne se ferme ; un indice de la suite sans figer le niveau suivant : **un train à quai, porte ouverte, lueur turquoise, une bulle « ? »**.
- **La fin** (étapes du script `station-roger`, après le court souvenir) : le cercle se referme ; Céleste est assise par terre **sous la grande horloge du hall**, la nuit (point de retour : la lanterne du hall). Elle pense à Maria. **Papa** (`dad-hall`, debout, la main tendue, à hauteur d'enfant) : une bulle cœur, Céleste répond d'un cœur. Fondu ; la nuit dans sa chambre : elle pense à Maria, puis à son lit. La chambre est fermée (bulle « lit ») jusqu'au coucher.
  - **La nuit dans le hall** : un lieu fermé du quartier était toujours de jour (D-63). Nouvelle directive `; @nightwalls: haut bas` : le soir, la salle prend la nuit de la maison avec ces murs. La grande horloge est descendue (lignes 20 à 27) pour être dans le cadre quand Céleste est au sol ; le tableau des départs se décale à gauche (fond seulement, aucune collision changée).
- **Quelques mois plus tard** (`station-months`, comme D-43) : Agir au lit ; le noir le plus long ; drapeau `growth.3` ; au réveil, une bulle « Maria ? », puis une bulle **train** (nouveau pictogramme : une voiture bleue, sa porte ouverte et la lueur turquoise). Le matin revient.
- **Phase 3** (`GROWTH_PHASES`, déduite de `growth.3`, aucune migration) : hitbox **12 × 28** (< 2 tuiles), course **× 1,06**, saut **× 1,2 (inchangé depuis la phase 2)**, corps × 1,4, cheveux × 1,5. Nouveau champ `hair` : `pigtails` puis **`ponytail`**.
  - **Écart avec la proposition** (saut × 1,27) : un saut plus haut **rendait plus difficiles** deux trouvailles existantes (la cheminée du pilier des quais, saut mural : fenêtre de 66 à 33 ms, sous le seuil « difficile » ; le nichoir de l'aire de jeux : 214 à 97 ms, sous le seuil « moyen »). Le test « rien ne se ferme » l'a détecté. Le saut reste donc celui de la phase 2 ; la croissance se voit dans la taille et la vitesse. PROVISOIRE, à régler sur téléphone (le résultat de la cheminée est très sensible à la hauteur de saut).
- **La marionnette en phase 3** d'après l'illustration de l'utilisateur : **queue de cheval** (nouvelle pièce, haut derrière la tête, chouchou rose, elle se balance avec la pose), **veste en jean** ouverte (manches retroussées, boutons dorés) sur un t-shirt blanc à fleurs roses, **short rose** à revers, chaussettes blanches, baskets roses et blanches. Lunettes rondes roses inchangées.
- **Images fournies** (détourées avec ImageMagick : remplissage du fond depuis les bords, mèches fines et blancs enfermés dans la queue de cheval retirés, bord adouci) : `public/art/celeste-jacket.png` (écran titre en phase 3, `TITLE_IMAGES.jacket`) et `public/art/roger.png` (**Roger** en jeu, `ART_IMAGES.roger`, dans la tour). Le dessin par code de Roger (cahier, court souvenir) est refait d'après l'image : pelage roux, masque crème, oreilles crème dedans, longs bras et jambes, bouts des mains crème, longue queue, nombril. Remarque : les baskets de l'illustration portent un logo de marque, visible en grand sur l'écran titre.
- **La toise** : un troisième trait rose (`height-chart-older`), le petit cœur au plus haut. Une seule toise affichée à la fois (testé).
- **Le train à quai** (`quay-train`, quais, seulement en phase 3) : une voiture arrêtée le long du quai de droite, sur la voie du fond (son plancher au niveau du quai), le bout des voitures voisines ; au milieu, **la porte grande ouverte**, l'ombre dedans et une **lueur turquoise** qui déborde sur le quai. Le train qui passe (le danger) reste devant, sur sa voie. En passant devant la porte (`station-train`, une fois) : scintillement, **bulle « ? »** de Céleste. Un présage près de la porte (la lumière vacille). **On n'y monte pas** : le niveau suivant reste ouvert (§45).
- **Debug** : histoires « Roger trouvé, la nuit après la gare (au lit) » et « quelques mois après la gare (phase 3, le train à quai) » ; case « Croissance : phase 3 (après la gare) ».
- **Tests** (`stationEnd.test.ts`) : la fin (hall sous l'horloge puis chambre, papa), la nuit (soir, chambre fermée, un seul déclencheur au lit), la toise, la phase 3 (< 2 tuiles, influence modérée, jamais moins que la phase 2), le train (après les mois seulement, pas de changement de salle) et, sur le graphe de toute la zone (portes ouvertes, toutes les capacités, difficulté de chaque salle) : **rien d'atteignable en phase 2 ne se ferme en phase 3**, et la porte du train est atteignable. Ce test prend environ 4 minutes.
- **Sauvegarde** : aucune migration (étapes `growth.3`, `station.train`).

## D-70 — Retours du téléphone : parapluie, poursuite, plateformes basses, école étrange, bulles Maria

- **Parapluie** (changement de mouvement demandé par l'utilisateur, revient sur D-65) : retour au geste de D-62. En l'air, **une nouvelle pression de Saut** l'ouvre ; tenu, Céleste plane ; lâché, il se referme. Un saut tenu jusqu'au sol ne l'ouvre plus. **Exception gardée** (choix de l'utilisateur) : après un **saut depuis un câble**, Saut tenu le rouvre seul au sommet (`glideAutoDelayMs`), pour enchaîner les câbles. Aide (bulle à deux flèches, texte de « Mes capacités ») remise à jour.
  - Analyse de faisabilité : le saut « plané » relâche Saut au sommet puis le presse de nouveau ; les sauts ordinaires sont tenus jusqu'au sol (comme le joueur). Difficultés de toutes les salles inchangées (tests).
- **Poursuite** (tour des objets perdus, parcours d'essai 10) : les trois vitesses selon la hauteur de Céleste (5,1 / 1,1 / 2,3 tuiles/s) et le saut du poursuivant quand il avait plus de 7 tuiles de retard donnaient un comportement bizarre. Maintenant :
  - **une seule vitesse constante, 2,8 tuiles/s** (`; @chase-phase: 7 2.8`) ;
  - **rattrapage doux** : au-delà de `chaseCatchUpGapTiles` (12) tuiles de retard, il accélère de `chaseCatchUpRate` (0,4 tuile/s par tuile en plus), sans dépasser `chaseCatchUpMaxSpeed` (6 tuiles/s) ; jamais de saut ;
  - au départ et à la réapparition : 9 tuiles sous les pieds, 2,5 s d'attente (la section des valises flottantes, lente, reste passable après une réapparition).
  - **Test de rythme refait** : le vrai `Chase` est rejoué le long du chemin le plus rapide (les pieds vont d'une surface à l'autre pendant chaque passage). Depuis le départ et chaque veilleuse, le joueur parfait n'est **jamais touché** (plus de 3 tuiles d'avance dans la tour) ; **50 % plus lent, il est touché** (un peu difficile). À 2,8 tuiles/s, 25 % plus lent passe de justesse. PROVISOIRE, réglable en direct (DEBUG → Combat).
- **Plateformes basses** au-dessus des longues fosses de dangers (plus de 6 cases) : des planches de 3 cases, 3 cases au-dessus du fond, espacées de 3, pour qu'une chute ne fasse pas retomber plusieurs fois dans les orties, les ronces, les gravats, les crayons ou les parapluies. Salles : jardin renversé et ronces (branches), chantier, dépôt (planches d'échafaudage), école étrange (tables), monde étrange de la gare (valises flottantes, avec trois marches pour remonter sur le tas des objets perdus). Au chantier, **un passage bas sous le mur de béton** ramène à la lanterne du départ (une échelle de planches créait un raccourci, détecté par les tests).
  - Test (`lowPlatforms.test.ts`) : chaque case du fond d'une longue fosse a une plateforme sûre à 3 tuiles de haut et 4 colonnes au plus, d'où l'on rejoint le départ ou une lanterne (escalade et saut mural, sans parapluie, fenêtres de la difficulté de la salle). Toutes les difficultés « exactement » des salles sont inchangées.
- **École étrange allongée** (+25 colonnes, choix de l'utilisateur : une section avec le parapluie) : on arrive maintenant en bas à droite ; des tables en escalier, puis **un long plané** au-dessus des crayons jusqu'à une règle et sa veilleuse (facile avec le parapluie, impossible sans) ; une ouverture dans le mur ramène dans la classe ; des tables basses mènent à l'ancien départ (une lanterne y est ajoutée), puis le parcours d'avant (moyen jusqu'à la lanterne des tables, difficile jusqu'à la boîte). Arrivée de l'histoire déplacée.
- **Bulles « Maria »** (32 → 15) : gardées au prologue de la maison, au début de chaque niveau (réveil au jardin, première question à maman au jardin et à l'aire de jeux, arrivée à la gare, réveil après la gare) et à la fin de chaque monde étrange (le bonnet, le trou en forme de Maria de la boîte, Roger sous l'horloge). Ailleurs : un cœur pour les affaires de Maria ramassées, un « ? » pour les questions suivantes aux parents et l'entrée derrière la haie, ou rien (avant de dormir, la cabane, quand papa ou maman montrent la suite).
- **Sauvegarde** : aucune migration.

## D-71 — Passe graphique, étape 1 : finition « papier découpé »

- **Contexte** (retour de l'utilisateur après analyse de l'existant) : le jeu manque de beauté, de lisibilité, et un peu d'intérêt à parcourir. Plan validé en 5 étapes, tout en dessin par le code (images IA éventuellement plus tard) : (1) fondations du rendu, (2) profondeur (parallaxe, avant-plan), (3) vie du monde réel, (4) ~~identifiants fixes des trouvailles~~, (5) une salle témoin refaite, **le salon**, puis propagation.
- **Étape 4 abandonnée (décision de l'utilisateur)** : les trouvailles et les lanternes restent identifiées par leur position (`secretId`, `checkpointId`). Le jeu est encore en essai : refaire une partie après une modification de salle est accepté. **À revoir avant la sortie** (pilier 10).
- **Décision (étape 1)** : le décor adopte le langage de Céleste (papier découpé, D-29). Chaque plan est une feuille posée sur la précédente, avec son ombre douce :
  - **fond lointain** (`far` dans `DECOR_KINDS` : cadres, dessins, horloge murale, platane, verrières, façade de la gare…), voilé par le dégradé du mur ou du ciel (**perspective atmosphérique**, `veil` de la palette ; 0 dans le monde étrange, déjà en silhouettes). Jamais une porte ni un repère de jeu ; les façades de la rue restent nettes (voilées, elles devenaient ternes) ;
  - **fond proche** (fenêtres, dossier du canapé, façades) : une ombre légère sur le mur ;
  - **couche jouable** (murs, sol, meubles, dangers) : une ombre nette, décalée vers le bas à droite (lumière d'en haut à gauche). C'est ce qui la détache du fond (lisibilité) ;
  - **ombres de contact** sous chaque meuble posé sur une surface ;
  - **grain de papier** (bruit déterministe, en lumière douce) sur tout le décor ;
  - **ombre de Céleste au sol**, d'autant plus petite et pâle qu'elle est haut (on voit où elle va retomber), fonction pure testée (`groundBelow`) ;
  - **vignettage** léger, selon la palette (plus présent la nuit et dans le monde étrange).
- **Mise en œuvre** :
  - réglages dans `src/config/art.ts` (`DEFAULT_ART_FINISH`, PROVISOIRES), réglables dans l'overlay (« Habillage (finition) ») ; case **« Comparer : sans finition »** pour l'avant/après ; les réglages sont dans l'export JSON ;
  - les feuilles sont dessinées sur une toile de travail avec une **marge de 24 px** autour du bloc : sans elle, l'ombre était coupée net entre deux blocs ;
  - `FinishView` : deux images (ombre, vignettage), aucune allocation par image.
- **Rien ne touche à la collision ni au mouvement** (pilier 1) : purement visuel.
- **Coût mesuré** (Chromium sans GPU, échelle 3, salon entier) : environ 225 ms sans finition, 400 ms avec. En jeu, un bloc est dessiné par image en approchant : la saccade possible est plus longue qu'avant. **À mesurer sur téléphone** ; leviers : moins de flou, pas d'ombre du fond proche, dessin à l'échelle 2.
- **Résolution** : le mode « Écran » (D-18) rend nettement mieux le dessin par le code ; le passer par défaut attend la mesure des images/s sur le téléphone de l'utilisateur.
- **Sauvegarde** : aucune migration.

## D-72 — Passe graphique, étape 2 : la profondeur

- **Plans lointains** (`BackdropView`, `src/scenes/art/backdropArt.ts`) : textures dessinées une fois par salle, qui défilent moins vite que la salle (parallaxe : à l'écran, `x − vue × facteur`). Positionnées à chaque image d'après la vue réelle (zoom compris), recadrées sur la salle (au-delà de ses murs, la couleur d'ambiance comme avant), sous le fond de la salle.
  - **Dehors** : le ciel (nuages, soleil : `sky` dans `DECOR_KINDS`) ne bouge presque pas ; collines lointaines ; puis, au jardin, deux rangées de collines arborées, et dans le quartier et à la gare, deux rangées de **toits de la ville** (fenêtres allumées le soir). Le fond de la salle devient transparent là où était le ciel.
  - **Dedans** : les **vitres sont transparentes** (fenêtres, lucarnes, monde réel seulement) ; derrière, un plan juste au-delà de la vitre : le ciel de la palette, les étoiles, la lune (placée dans la plus grande fenêtre quand la vue est centrée sur elle) et les toits de la ville, fenêtres allumées la nuit. En marchant, la lune et les toits glissent un peu dans la fenêtre. Le monde étrange garde ses fenêtres peintes.
  - Facteurs dans `PARALLAX` (`src/config/art.ts`), PROVISOIRES. Textures plafonnées à l'échelle 1,5 (plans lointains, flous) et à 4096 px.
- **Avant-plan** (`ForegroundView`, logique pure testée `src/core/fx/foreground.ts`) : silhouettes sombres et floues au bas de l'écran (herbes, fleurs au jardin ; herbes folles dans la rue et à la gare), qui défilent plus vite (× 1,35). Elles dépassent du sol de 8 à 22 px au plus et **s'effacent** près de Céleste, des ennemis au sol, des dangers du sol, des objets de jeu et des sorties (pilier 1).
  - **Écart avec le plan** : pas d'avant-plan dans la maison. Les jouets et livres flous essayés se lisaient comme des taches, pas comme des objets. Les pavés flous de la rue aussi, retirés.
- **Corrections au passage** (étape 1) : la découpe d'une vitre prenait l'opacité du dernier remplissage (vitre à moitié découpée) ; les ombres de contact suivent maintenant les colonnes où le meuble touche vraiment une surface (la passerelle de la gare faisait une ombre de toute la largeur de la salle) ; le voile et le grain ne touchent plus le transparent.
- **Rien ne touche à la collision ni au mouvement.**
- **Coût mesuré** (Chromium sans GPU, échelle 3) : construction des plans 30 à 45 ms dans le salon, 100 à 200 ms dehors, pendant le fondu du changement de salle ; avant-plan < 20 ms. **Mémoire graphique** : jusqu'à environ 25 Mo de plus dans la rue (quatre plans). À surveiller sur téléphone ; levier : `PARALLAX.maxScale` à 1.
- **Sauvegarde** : aucune migration.

## D-73 — Passe graphique, étape 3 : la vie du monde réel

- **Un vent commun** (`wind`, logique pure testée, `src/core/fx/worldLife.ts`) : calmes et rafales lentes ; le linge, les feuilles et les nuages le suivent ensemble.
- **Nuages qui dérivent** : sortis du ciel peint, ils deviennent des images accrochées aux plans lointains (`BackdropView`), qui avancent au vent et reviennent de l'autre côté. Dehors, dans le ciel ; **dedans, devant la lune**, dans la vue par les fenêtres (sombres la nuit, blancs le matin). Recadrés sur la salle.
- **Oiseaux** : de temps en temps (12 à 28 s), un petit vol de 2 à 4 traverse l'écran haut dans le ciel, en battant des ailes, sur le plan des collines lointaines. Jamais dans le monde étrange.
- **Feuilles** (`WorldLifeView`) : là où il y a des arbres ou des haies, quelques feuilles (7 au plus) tombent en voletant, poussées par le vent ; vertes au jardin, ocres sous les platanes de la rue. Derrière les personnages, jamais devant Céleste.
- **Linge** : dehors, les chaussettes et le pyjama du fil de la terrasse se balancent, en une vague qui court le long du fil (dedans, à la buanderie, ils restent immobiles : pas de vent).
- **Inclinaisons dessinées d'avance** : tourner à l'affichage de très petits sprites les déformait dans Chromium (morceaux manquants), même sans arrondi des sommets. Le linge (9 angles) et les feuilles (8 angles) choisissent l'image de l'angle le plus proche. **Remarque** : la trotteuse existante des horloges (D-38) montre le même défaut dans Chromium sans GPU (aiguille en pointillés). À vérifier sur téléphone ; même remède au besoin.
- **Avant-plan** : la forme « feuillage » retirée (une tache sombre) ; restent herbes et fleurs.
- Réglages : `WORLD_LIFE` (`src/config/art.ts`), PROVISOIRES.
- **Rien ne touche à la collision ni au mouvement** ; aucune allocation par image.
- **Sauvegarde** : aucune migration.

## D-74 — Passe graphique, étape 5 : le salon, salle témoin

- **Plan validé** par l'utilisateur, choix « petit feu allumé ». Les repères de l'histoire restent en place : la bibliothèque et Maria (le salon étrange s'y appuie), le canapé de maman, la place du chat, les deux portes ; le salon reste facile, son sommet réservé à l'escalade.
- **Une pièce, pas une boîte** : le dessous de l'escalier qui monte à l'étage descend dans le coin haut gauche (bois, en marches) ; une poutre au plafond à droite.
- **Rien ne flotte** : les étagères murales de la route haute deviennent **deux plantes en pot suspendues** (cordes en macramé) et **un lustre** pendu à son fil ; l'étagère de la trouvaille devient **une horloge comtoise** posée au sol (la trouvaille sur son chapeau) ; la tringle du rideau est allongée vers la gauche. Les écarts de saut de la route haute sont ceux d'avant (déjà validés).
- **Repères** : la **cheminée** au centre, contre le mur (on passe devant), son **petit feu** animé qui éclaire la pièce (source de lumière), un miroir au-dessus ; son **manteau** est une planche, atteignable sans grimper par les étagères de la bibliothèque. **Table basse retirée** (retour du téléphone) : posée au-dessus des briques de jeu, elle empêchait de les sauter. L'horloge comtoise et son **balancier**. Le lustre éclaire aussi.
- **Parcours** : en bas, sans escalade, on traverse (les briques se sautent) et on peut monter étagères, manteau, d'où l'on voit Maria et la trouvaille, hors d'atteinte. En haut, avec l'escalade : placard mural, deux plantes, tringle (au-dessus de la fenêtre), on se laisse tomber sur le lustre, saut jusqu'au sommet de la bibliothèque, puis saut vers l'horloge pour la trouvaille (l'étagère rattrape un raté).
- **Ailleurs** : la photo de famille passe au-dessus du canapé (zone d'interaction déplacée) ; l'applique de gauche passe sous l'escalier ; l'horloge murale et l'applique de droite sont retirées (l'horloge comtoise et le lustre les remplacent). Le salon étrange n'est pas touché.
- **Rendu** : `src/scenes/art/livingArt.ts` (dessins), animations dans `WorldLifeView` (feu : 6 images qui alternent et une lueur qui palpite ; balancier : 9 inclinaisons dessinées d'avance), réglages `WORLD_LIFE.fire` et `WORLD_LIFE.pendulum`.
- **Vérifié par les tests** : la maison reste facile et ne coince jamais (un premier placement de la table laissait un trou d'une tuile entre le pouf et un pied : corrigé) ; route haute en grimpant ; sommet et trouvaille seulement en grimpant, trouvaille au plus moyenne ; monde étrange inchangé.
- **Sauvegarde** : la trouvaille du salon a changé de place ; si elle était ramassée, elle redevient à trouver (identifiants par position, étape 4 écartée, D-71). Aucune migration.
- **Grille pour les autres salles** (à appliquer aux futurs niveaux, et aux salles existantes après tri) : une silhouette de salle, pas une boîte ; rien ne flotte (chaque appui pend ou tient au sol, ou fait partie d'un meuble) ; un repère fort qui guide le regard ; des sauts au rythme varié ; ce qu'on ne peut pas encore atteindre se voit ; une source de lumière qui compose la pièce ; un peu de vie.

## D-75 — La maison refaite d'après la grille du salon (passe graphique)

- **Plan validé** par l'utilisateur (« vas-y »), avec les choix par défaut proposés : la maison en **deux parties** (A : l'étage, chambre, couloir, escalier ; B : cuisine, buanderie, grenier, et la lisibilité du salon étrange et du passage d'ombres), finalement réunies dans la même PR (la partie B a suivi avant la fusion de la A, à la demande de l'utilisateur) ; **pas de nouvelle trouvaille** dans la chambre ; **pas de porte de décor** (une porte qu'on ne franchit pas se lirait comme une sortie) ; la trotteuse des horloges attend le retour du téléphone.
- **Ce qui ne bouge pas** : sorties, trouvailles, veilleuses, objet de capacité, zones de l'histoire et objets de mise en scène (soir de la chambre, chausson, biberon, toise, papa, maman) ; les écarts de saut déjà validés (les appuis restent, on change ce qu'ils sont, comme au salon). **Aucune trouvaille ni lanterne déplacée : aucune sauvegarde touchée.**
- **PR A, l'étage** (dessins `src/scenes/art/houseArt.ts`, animations dans `WorldLifeView`, réglages `WORLD_LIFE.mobile`, `nightStars`, `dust`, `moth`) :
  - **Chambre** : la **mansarde** à droite (toit en pente, lambris, poutre ; la pente dessinée passe par les coins des marches de la collision, hors de portée d'un saut). L'étagère au-dessus du lit devient la traverse d'un **lit cabane** (montants posés sur le lit, toit en fil de bois, guirlande) ; l'étagère de la couverture, le **surmeuble du bureau**. Un **mobile** (lune, étoiles) tourne au-dessus du berceau ; la **veilleuse projette des étoiles** qui tournent lentement sur les murs (à peine le matin). Géométrie jouable inchangée.
  - **Couloir** : un **plafond bas** à gauche (soupente, solives), la trouvaille sur le **fronton d'un grand miroir posé sur la console** (même tuile) ; un **œil-de-bœuf** au milieu, sous la lune, et la poussière dans son rayon ; le rebord en L devient un **placard plein au-dessus de la porte de l'escalier** ; l'étagère murale, une **commode** basse posée au sol ; un **papillon de nuit** autour d'une applique, le soir. Un premier essai de commode haute (4 tuiles) coupait le couloir en deux (le test « ne coince jamais » l'a attrapé) : elle fait 2 tuiles, et le placard se gagne en grimpant depuis elle.
  - **Escalier** : la volée devient un vrai escalier (dessous en biais au lieu d'un triangle plein qui flottait), avec sa **rampe** à balustres et ses poteaux, et le garde-corps du palier de l'étage. Les trois planches de droite sont les étagères d'une **bibliothèque en escalier** posée au sol, qui porte le palier. Une **grande fenêtre en plein cintre** (vitrail dans le cintre) éclaire la cage ; son rebord est l'ancienne étagère haute. Le rebord du grenier devient un **petit palier sur son poteau**, posé sur le buffet. En bas, une **suspension** pendue sous la volée, un portemanteau et une plante.
  - **Rendu** : vitres rondes et en plein cintre découpées avec le mur (`windowPanes` donne la forme de chaque vitre) ; la suspension est une source de lumière (`drawRoomLight`). Le mobile, les étoiles, la poussière et le papillon sont de petites images déplacées à chaque image, sans rotation à l'affichage ni allocation.
- **Partie B, le rez-de-chaussée et le grenier** :
  - **Cuisine** : une **retombée de plafond** au-dessus du coin cuisine (la salle à manger reste haute) ; les quatre étagères à bocaux deviennent une **suspension basse au-dessus de la table** (son abat-jour), une **barre à casseroles pendue à deux chaînes**, le **rebord de la fenêtre** (déplacée juste au-dessus) et le **dessus du frigo**, posé au sol (on passe devant, comme devant la cheminée du salon). La hotte reçoit son **conduit** jusqu'à la retombée ; une **cafetière** fume sur la cuisinière. Mêmes tuiles, mêmes sauts ; l'applique est retirée (la suspension éclaire la table).
  - **Buanderie** : un **plafond bas** à gauche ; le rebord sous la trappe devient une **soupente sur son poteau** (posé sur l'étagère), avec le panier de linge sale ; l'étagère murale, une **étagère de rangement sur pieds** ; la planche, une **planche à repasser** (pieds en X, le fer) ; une **suspension** au-dessus de la machine remplace l'applique ; le **linge tourne** dans le hublot. Dedans, le linge du fil reste immobile.
  - **Grenier** : un **toit à deux pans**, le faîte à droite (le plafond en marches suit la pente ; la pente dessinée passe sous toutes les tuiles pleines). Chaque planche est une **poutre de la charpente sur son poteau**, avec deux liens ; la poutre de la trouvaille est un **entrait** tenu au faîte. La **lucarne** devient une **fenêtre de toit** dans le pan, hors d'atteinte comme avant (D-27) ; de la poussière dans sa lumière ; un **mannequin de couture** en ombre.
  - **Salon** : vérifié, rien à changer.
  - **Mondes étranges, lisibilité seulement** : le grand fauteuil, l'escalier peint au mur et le grand crayon sont nettement plus pâles, sans contour (ils se lisaient comme des appuis) ; dans le monde étrange, le portemanteau n'a plus que ses patères (sa barre se lisait comme un rebord sans liseré). Le liseré turquoise reste réservé à ce qui porte. Aucune géométrie changée.
- **Vérifié par les tests** : la maison reste facile et ne coince jamais (avec et sans escalade), les endroits d'escalade restent hors d'atteinte sans grimper, la trouvaille du couloir attend la phase 2 (moyenne), le soir de la chambre se joue sans grimper ; la trouvaille du grenier reste moyenne (ni facile, ni hors d'atteinte), celles de la cuisine et de la buanderie restent au même niveau.
- **Sauvegarde** : aucune migration.

## D-76 — Le jardin refait d'après la grille du salon (passe graphique)

- **Plan validé** par l'utilisateur, sur la même branche que la maison (D-75), avec les choix par défaut proposés : la balançoire et l'épouvantail sont du **décor sans collision** (en faire des appuis changerait la difficulté du chemin jusqu'au saut mural, qui doit rester « moyen exactement ») ; **pas de nouvelle trouvaille**.
- **Diagnostic** : le jardin tenait déjà au sol (D-50) ; ses défauts étaient des salles en boîte (un bandeau de feuillage plein, comme un plafond vert, en haut de chaque salle dehors), peu de repères hors du grand arbre, une lumière plate et peu de vie propre à chaque salle.
- **Ce qui ne bouge pas** : sorties, trouvailles (jardinière, haut des tuteurs, nichoir, coffre de la cabane), lanternes, araignées (toujours pendues sous un feuillage), câble de la terrasse, zones et objets de l'histoire. **Aucune sauvegarde touchée.**
- **Terrasse** : ciel ouvert entre l'**avant-toit de la maison** (tuiles, gouttière) et la **couronne de l'arbre du voisin** ; une **guirlande de guinguette** sous la pergola, dont les ampoules se balancent au vent ; des papillons.
- **Potager** : ciel ouvert, deux couronnes dans les coins ; un **épouvantail** planté dans le dernier bac (repère, un peu inquiétant) ; une brouette et un tonneau au fond ; des papillons autour des haricots.
- **Grand arbre** : une **trouée dans la couronne**, d'où descend un **rayon de soleil** plein de poussière dorée ; une **balançoire** pendue à la branche du bas, qui oscille au vent (9 inclinaisons dessinées d'avance).
- **Cabane** : un **toit en appentis** (en planches), une lanterne pendue, les **dessins de Céleste** punaisés au mur (soleil, maison, fleur), la poussière dans le rayon de la fenêtre.
- **Allée** : feuillage du haut irrégulier, du ciel au-dessus de la clôture et de la haie ; une **girouette** sur la remise, qui tourne au vent.
- **Derrière la haie** (lisibilité seulement) : les épines des ronces sont plus grandes (elles se lisaient comme de l'herbe). Rien d'autre.
- **Rendu** : dessins dans `gardenArt.ts` ; animations dans `WorldLifeView` (réglages `WORLD_LIFE.swing`, `butterfly`, `garland`). La mansarde de D-75 sert aussi au toit de la cabane (en bois dans une salle aux murs de bois).
- **Vérifié par les tests** : la porte de derrière reste fermée avant la croissance ; le chemin jusqu'au saut mural reste moyen exactement ; le vieux mur et l'allée seulement avec le saut mural ; la boucle de l'allée ; ne coince jamais ; trouvailles du potager, de la cabane, de la terrasse (crochet) et du nichoir (parapluie) au même niveau ; le trou de la haie et la fin du monde étrange inchangés.
- **Sauvegarde** : aucune migration.

## D-77 — La rue refaite d'après la grille du salon (le quartier, phase 1)

- **Plan validé** : le quartier en **trois phases**, une PR chacune : (1) la rue ; (2) l'aire de jeux, la supérette, le chantier ; (3) la cour, l'école, puis l'école étrange (lisibilité seulement). Choix de l'utilisateur : un chat roux sur un rebord ; au crépuscule, quelques fenêtres allumées.
- **Diagnostic** : un bandeau de feuillage plein courait en haut de toute la rue (un plafond vert) ; plusieurs appuis flottaient (le nid devant une façade, le platane étant dessiné derrière les immeubles ; le chapeau des lampadaires une tuile au-dessus de la lanterne ; l'enseigne posée sur le mur ; la corniche de l'école trois tuiles sous le haut de la façade ; les planches de l'échafaudage). Ce qui marchait : la ligne des toits, l'école, la grue, le crépuscule.
- **Géométrie** : seule la ligne du haut change (le feuillage seulement en haut du platane, colonnes 14 à 26). Hors de la salle, tout compte comme plein : rien ne s'ouvre par le haut. Difficultés inchangées (testé).
- **Rien ne flotte** :
  - le **platane passe devant les façades** (il n'est plus dans le fond lointain), avec une couronne pleine et deux branches ; sa branche porte le nid ;
  - le **chapeau des lampadaires** se pose sur la lanterne ;
  - l'**enseigne** est un panneau fixé à la façade (la planche en est le haut) ;
  - la **façade de l'école s'arrête à la corniche**, le toit de tuiles au-dessus, une lucarne et son horloge : on marche au pied du toit ;
  - les **planches de l'échafaudage** reposent sur des lisses.
- **Vie** : de la **fumée** sort des cheminées (une maison sur deux environ, dessinées avec la rangée de maisons) et part avec le vent ; du **linge tendu entre deux fenêtres** au début de la rue ; le **drapeau** de l'école flotte ; un **chat roux** du voisinage (pas celui de la famille) sur un rebord, sa queue balance.
- **Lumière** : au crépuscule, les **lampadaires s'allument** et environ un quart des **fenêtres** (pseudo-hasard stable) ; elles percent la pénombre (`drawRoomLight`).
- **Rendu** : `houseLayout` (fenêtres, fenêtres allumées, cheminées) est partagé par le dessin, la lumière et la fumée. Réglages `WORLD_LIFE.smoke`, `flag`, `catTail`. Le platane, aussi utilisé à l'aire de jeux, y passe également devant.
- **Ce qui ne bouge pas** : portes de façade, sortie haute vers le chantier, câble, les quatre trouvailles, lanternes, palissade et son présage. **Aucune sauvegarde touchée.**

## D-78 — L'aire de jeux, la supérette et le chantier refaits (le quartier, phase 2)

- **Plan validé** ; choix de l'utilisateur : le tube de la réserve qui clignote (une touche un peu inquiétante) ; la rangée du haut du chantier dessinée comme du ciel.
- **Aire de jeux** : le bandeau de feuillage du haut retiré (seulement la couronne du platane, comme dans la rue) ; les deux **balançoires oscillent au vent** (images dessinées d'avance, comme celle du grand arbre) ; des papillons. Le reste tenait déjà au sol.
- **Supérette** : un **faux plafond** (3 rangées, magasin et réserve) et ses **tubes fluorescents**, sources de lumière ; celui de la réserve **clignote** de temps en temps ; un **ventilateur** de plafond ; une affiche dessinée (sans texte). L'étagère devant la porte de la réserve devient une **mezzanine métallique sur pilotis**. Un premier essai de plafond plus bas dans la réserve coupait l'arc du saut moyen vers la porte (testé) : le faux plafond a la même hauteur partout.
- **Chantier** : ouvrir la rangée du haut rendait la sortie haute atteignable **sans le parapluie** (testé) ; elle reste pleine et se **dessine comme du ciel** (`opensky` : découpée, le ciel des plans lointains se voit), comme le bord de la salle juste au-dessus. L'**arrière de la supérette** (crépi, fenêtre) fait du rebord de gauche un parapet ; la **lampe de chantier** est sous son chapeau (il flottait, comme les lampadaires de la rue) ; une **bâche** claque au vent sur l'échafaudage.
- **Ce qui ne bouge pas** : portes, sorties, trouvailles (nichoir, lampe de chantier), lanternes, araignées, le parapluie sur la flèche, le trou du grillage, maman et papa. **Aucune sauvegarde touchée.**
- Réglages `WORLD_LIFE.fan`, `tubeFlicker`, `tarp`.

## D-79 — La cour, l'école et l'école étrange refaites (le quartier, phase 3)

- **Plan validé** ; choix de l'utilisateur : un pigeon qui s'envole quand Céleste approche ; un poisson rouge sous l'oculus.
- **Cour** : le bandeau de feuillage du haut retiré (seulement la couronne du platane, colonnes 23 à 34) ; une **marelle** à la craie (sans chiffres) et un **ballon** oublié ; un **pigeon** qui picore et **s'envole quand Céleste approche** (à 3 tuiles), puis revient une fois qu'elle s'est éloignée (purement visuel ; `WorldLifeView` reçoit maintenant la position de Céleste). Au **crépuscule**, quand maman vient la chercher, environ un quart des **fenêtres de l'école s'allument** (`schoolFacadeWindows`, partagé par le dessin et la lumière).
- **École** : les trois étagères murales qui flottaient vers l'oculus deviennent des **casiers de classe posés au sol** (en escalier : un bas, un moyen, une haute armoire) ; on passe devant, leurs dessus sont les mêmes planches (mêmes sauts). Des **poutres** au plafond, deux **suspensions** (sources de lumière), une **frise de formes** (rond, carré, triangle : l'écho de la boîte à formes du monde étrange), les dessins des enfants, de la poussière dans le rayon de la fenêtre, un **poisson rouge** dans son bocal sur l'armoire, sous l'oculus.
- **École étrange** (lisibilité seulement) : le cadre et la craie des tableaux en **violet pâle** au lieu du turquoise (le haut du cadre se lisait comme une plateforme) ; le turquoise reste réservé à ce qui porte. Géométrie inchangée.
- **Ce qui ne bouge pas** : la porte de façade de la cour, l'arrivée en planant sur le local à vélos, le panier (trouvaille), la lanterne, maman, les deux portes de l'école, l'oculus et son présage. **Aucune sauvegarde touchée.**
- Réglages `WORLD_LIFE.pigeon`, `fish`.
- **Le quartier est refait** (D-77, D-78, D-79).

## D-80 — Les voies, les quais et le hall refaits (la gare, phase 1)

- **Plan validé** en deux phases (1 : voies, quais, hall ; 2 : objets trouvés, dépôt, gare étrange et tour, lisibilité seulement). Choix de l'utilisateur : la voûte et l'escalier en colimaçon du hall, des pigeons sur le portique, les volets du tableau des départs qui basculent.
- **Voies** : au fond, une vraie **gare** (deux ailes sous un toit d'ardoise, de hautes fenêtres cintrées dont quelques-unes s'allument au crépuscule, la **tour de l'horloge** au milieu : le repère). Le mât de caténaire de gauche passe **sur le bord du quai** (colonne 46) et tient le bout du câble par un **bras en console** ; celui de droite est **posé sur le toit du poste d'aiguillage**, au bout du câble (avant, l'un flottait au-dessus de la voie et le câble commençait dans le vide). Les poteaux des abris descendent jusqu'au quai. Les cagettes deviennent un **chariot à bagages** chargé de valises (même bloc plein). Deux **lampadaires de quai** et la vitre du poste s'allument au crépuscule ; deux **pigeons** sur le portique.
- **Quais** : la **marquise** (des fermes en arc, plus au lointain) repose sur le pilier et deux **colonnes de fonte** ; le pilier garde sa partie pleine et une **colonne fine** (fond) descend jusqu'au quai : on passe toujours dessous. La passerelle : le tablier est bordé d'une **poutre en treillis** et posé sur **deux piles** au bord des quais ; ses escaliers sont des **tours de paliers**, chaque palier sur ses montants jusqu'au quai. Deux **lampes-globes**.
- **Hall** : une **voûte** (cases pleines dans les deux coins du haut, lignes 1 à 5, hors d'atteinte) bordée d'une moulure, la **verrière** dessous. Les marches de la cheminée deviennent un **escalier en colimaçon** de fonte (fût central du sol à la galerie, rampe en spirale ; mêmes marches). Le rebord de droite devient un **balcon de pierre sur consoles**, devant la porte close du chef de gare, avec un **réverbère** où le câble est attaché. Des consoles sous la galerie. Le kiosque a un **auvent rayé** qui retombe sur le comptoir éclairé ; le bureau des objets trouvés, une **devanture** (vitrines, imposte allumée le soir). De la poussière sous la verrière ; quelques **volets du tableau des départs basculent** de temps en temps (`WORLD_LIFE.flaps`).
- **Ce qui ne bouge pas** : les trains et leurs feux, le portique, les câbles, la porte du bureau, la grande horloge (la fin se joue dessous), le train à quai de la phase 3 (55, 26), toutes les trouvailles et lanternes. **Aucune sauvegarde touchée.** Difficultés inchangées (tests de la gare).

## D-81 — Les objets trouvés, le dépôt et la lisibilité de la gare étrange (la gare, phase 2)

- **Objets trouvés** : un **plafond bas** au-dessus du guichet (lignes 1 à 3, colonnes 1 à 17, hors d'atteinte) et une **suspension** ; une **lampe de bureau** verte sur le guichet, de la poussière dans la lumière. Les montants des étagères deviennent deux **rails muraux du sol au plafond** (les planches y sont accrochées sur des équerres, des parapluies pendent aux rails). La haute armoire qui flottait devient un **placard mural sur deux équerres** (on passe toujours dessous), avec un **porte-parapluies** posé au sol dessous. La lueur turquoise en haut des casiers reste la chose visible pas encore atteignable.
- **Dépôt** : le pont roulant devient un **portique** jaune sur deux pieds en A posés au sol (avant, la poutre flottait ; elle n'est plus au lointain, ses chaînes tombent juste). L'atelier du fond, abaissé, a un **toit en sheds**, des **verrières allumées** au crépuscule et une **cheminée qui fume**. Les wagons ont leurs roues sur un bout de rail ; les planches au-dessus des gravats sont posées sur des **chevalets** (`trestle`, mêmes tuiles). Les crochets restent immobiles (ils sont praticables).
- **Gare étrange et tour** (lisibilité seulement, géométrie inchangée) : une règle simple pour les valises. **Ce qui est plein est rempli et bordé** : les piles de valises et la montagne des choses perdues prennent la couleur la plus sombre (plus sombre que le mur) et un **liseré turquoise sur tous leurs côtés libres** ; les piles sont découpées en valises (bords, poignées). **Ce qu'on traverse d'en dessous** (les valises qui flottent) : la planche du dessus bien marquée, le corps réduit à un contour léger. Le fond reste en contours fins, sans remplissage.
- **Ce qui ne bouge pas** : le crochet, le passage des casiers, les crochets du dépôt, toutes les trouvailles et lanternes, la poursuite de la tour. **Aucune sauvegarde touchée.** Difficultés inchangées.
- **La gare est refaite** (D-80, D-81) : tout le monde réel est passé à la grille du salon.

## D-82 — Structure de la fin du jeu : 8 niveaux, capacités et objets

- **Décision de l'utilisateur** : **8 niveaux** (le coût n'est pas un critère) : 1 maison, 2 jardin, 3 quartier, 4 gare (faits), **5 le train**, **6 la station balnéaire**, **7 l'avant-dernier** (presque entièrement étrange), **8 le monde de Maria**.
- **Objets du monde étrange** (document d'histoire, §5 à §8) : **5 : la cuisine rose**, avec le **premier souvenir jouable** (court) ; **6 : le livre musical** (court souvenir) ; **7 : le torchon blanc**, le retour des objets déjà vus, puis **Eden** (souvenir jouable plus long) ; **8 : aucun objet**. Le portique de bébé reste de côté (D-61).
- **Capacités** (spec §15) : **5 : la glissade** (le « dash » de la spec, au sol) ; **6 : aucune** (la mécanique propre du niveau, la marée, et la maîtrise des cinq capacités) ; **7 : la capacité finale, liée au monde étrange**, utilisable ensuite dans le niveau 8.
- **Niveau 6** (piste retenue, détails décidés le moment venu) : la station balnéaire de la classe de mer : plage, port, phare, fête foraine sur la jetée ; la marée ; le livre musical au carrousel. La question de l'eau (nage ou non) est remise à ce moment.
- **Niveau 7** : piste « chez la nounou », mêlé à des morceaux des lieux précédents, à confirmer.
- **Croissance** : la phase 4 viendra plus tard (pas dans le train).

## D-83 — Le train : plan du niveau validé (6 PR)

- **Cadre** : une **classe de mer** par un **train de nuit**. Pas de parents dans le train ; ils disent au revoir sur le quai et restent dehors quand le train part. La maîtresse, des camarades ; **une camarade** (une fille, pour qu'Eden reste le seul garçon important) apprend la glissade à Céleste. La nuit, tout le monde dort ; une lueur turquoise passe dans le couloir, Céleste la suit. Au matin, la mer à la fenêtre.
- **Salles** (5 réelles, 2 étranges, grille du salon dès le départ, D-74) :
  - le **quai** (existant), le soir : la classe attend ; Agir à la porte du train à quai ;
  - **la voiture-couchettes** (facile) : couchettes sur trois étages, filets, couloir ; la camarade glisse sous une barrière, Céleste l'imite (**la glissade s'apprend**, elle ne se ramasse pas) ; le chariot du vendeur, le soir ; la veilleuse du compartiment est la lanterne ;
  - **les voitures à compartiments** (moyen) : passagers endormis, filets traversables par dessous, portes qui se referment (on glisse dessous), valises qui tombent dans les virages (annoncées par les lampes qui se balancent) ; la maman qui berce son bébé et son poupon ; le contrôleur, bienveillant ;
  - **le fourgon à bagages** (moyen) : malles, vélos pendus, colis qui glissent dans les virages, un chien dans sa caisse, un rail pour le crochet ; une trappe vers le toit ;
  - **le toit** (difficile) : la nuit, le paysage qui défile ; les **tunnels**, annoncés, obligent à se coucher en glissade ou à s'abriter entre deux voitures (touchée : repoussée, la peur monte d'un cran, comme le souffle des trains de la gare) ; il redescend au wagon-restaurant (boucle avec l'intérieur). On n'y monte qu'en suivant la lueur (un peu irréel) ;
  - **le wagon-restaurant fermé** (facile) : la lueur sous la porte de la cuisine, entrée du monde étrange ;
  - **la cuisine étrange** (moyen) et **le train de la vaisselle** (la poursuite, horizontale) : un chariot de service géant chargé d'une tour de vaisselle, sans visage ; au bout, **la cuisine rose**.
- **Règle** : le train ne modifie jamais la physique de Céleste (pas d'inertie dans les virages ni au freinage) ; les secousses font bouger les objets, jamais elle (pilier 1).
- **Le souvenir jouable court** (nouveau système, réutilisé pour Eden) : Céleste toute petite dans un coin de cuisine ; elle remue la casserole, verse le thé et l'apporte à **Roger et ses peluches** ; un cœur ; fondu, la petite cuisine reste seule. Sans texte, couleurs chaudes, rejouable depuis le cahier. Maria n'y est pas.
- **Fin** : au matin, la maîtresse réveille Céleste dans sa couchette ; la mer à la fenêtre ; une petite salle « la gare de la mer » (PLACEHOLDER jusqu'au niveau 6). Le train relie la gare de la mer et la gare de la ville ; à quai, de jour, il est immobile, sans pièges ni passagers, et se revisite. Revisites avec la glissade dans les anciennes zones (3 ou 4, choisies à la conception).
- **Découpage** : PR 1 la glissade (parcours d'essai 11, analyse), **essai sur téléphone avant de continuer** ; PR 2 le départ et la voiture-couchettes (salles « en route » et « à quai », paysage qui défile, secousses) ; PR 3 le reste du train réel ; PR 4 la poursuite horizontale (parcours d'essai 12) ; PR 5 le monde étrange, la cuisine rose et le souvenir jouable ; PR 6 la fin, la gare de la mer, la revisite du train et les revisites avec la glissade.

## D-84 — Le train, PR 1 : la glissade (cinquième capacité)

- **Choix de l'utilisateur** (D-83) : bouton **Capacité** (« Glisser »), qui n'apparaît qu'une fois la glissade obtenue (à gauche de Saut, sous le même pouce) ; clavier **L** ou **Maj gauche**. Glissade **au sol seulement**, avec un **saut long** ; pas de dash en l'air.
- **Geste** : au sol, debout, une pression lance Céleste **couchée**, dans le sens où l'on pousse (sinon où elle regarde), à `slideSpeed` (230 px/s) pendant `slideDurationMs` (240 ms) : environ 3,5 tuiles. La direction est ignorée pendant la poussée. Une pression juste avant d'atterrir (`slideBufferMs`, 100 ms) glisse à l'atterrissage. Délai `slideCooldownMs` (250 ms) entre deux glissades.
- **Couchée** : la hitbox fait `slideHeightPx` (12 px, moins d'une tuile), pieds en place : elle passe sous un obstacle à une tuile du sol. Après la poussée, elle se relève **seulement si la place le permet** ; sinon elle **avance couchée** (`slideCrawlSpeed`, 70 px/s, vers où l'on pousse, sinon tout droit) et repart dans l'autre sens contre un mur : **jamais coincée** (testé, cul-de-sac compris).
- **Saut long** : sauter pendant la glissade (place pour se relever exigée) donne une vitesse horizontale `slideJumpSpeedX` (190 px/s, contre 136 en course), **gardée jusqu'au sol** tant qu'on ne pousse pas à l'opposé (pousser à l'opposé rend le contrôle aérien normal). Une glissade qui quitte un bord garde son élan, borné au saut long (le coyote time permet encore le saut). L'élan se perd au sol, contre un mur, suspendue, au crochet ou touchée.
- **Interdit couchée** : l'attaque, l'escalade, le parapluie, Bas + Saut. Touchée : la poussée s'arrête.
- **État** `Slide` ; **pose** : les pieds devant, le buste couché en arrière, la tête tournée vers l'avant, un bras le long du corps, l'autre vers les pieds ; la hanche descend au tiers de la longueur des jambes quelle que soit la phase (champ `lie` de la pose). PLACEHOLDER.
- **Aide** : pictogramme et ligne « glissade » dans « Mes capacités » (cinq lignes). L'acquisition dans le jeu (la camarade, D-83) vient avec la PR 2 ; d'ici là : case « Capacité : glissade » du DEBUG et parcours d'essai 11.
- **Réglages** `slide*` dans `src/config/movement.ts`, l'overlay et l'export JSON. PROVISOIRES.
- **Analyse de faisabilité** (D-16 étendue, option `slide`) : depuis chaque instant de la course, une glissade seule, ou suivie d'un saut long après 2, 8, 14, 20 ou 26 pas (Saut tenu jusqu'au sol, ou 8 pas) ; et, contre un obstacle bas, s'arrêter puis glisser dessous (sans timing). Limites (prudentes) : pas de parapluie après un saut long ; pas de glissade lancée depuis l'arrêt ailleurs que contre un obstacle. Sans l'option, rien ne change ; avec, un parcours existant n'est jamais plus dur (testé).
- **Parcours d'essai 11 « Glissade »** (facile, prête escalade, saut mural et glissade) : une barrière basse, un long passage bas (couchée), une fosse de briques trop large pour un saut en courant (saut long), une dernière barrière. Impossible sans la glissade (testé).
- **Vérifié dans Chromium** : glissade sous la barrière, reptation dans le passage bas, saut long au-dessus de la fosse, bouton « Glisser » affiché.
- **Sauvegarde** : aucune migration (capacité `slide` dans `progression.abilities`).

## D-85 — Le train, PR 2 : le départ, la voiture-couchettes, la glissade apprise, la nuit

- **Plan validé** (D-83). Écarts et précisions ci-dessous.
- **Le départ** (quai, phase 3) : Agir à la porte du train à quai (déclencheur `train-board`, après les mois de D-69). Dans le noir, le soir tombe sur les quais : la **maîtresse** (gilet vert, chignon, un classeur), **trois enfants et leurs sacs à dos**, **maman et papa** qui font au revoir. Un cœur de maman, Céleste répond ; la maîtresse montre le train ; fondu, Céleste est dans la voiture-couchettes (point de retour : sa veilleuse). Après un instant, **le train s'ébranle** (drapeau `train.departed`) : le départ se voit au paysage. Bulle « Maria » (début de niveau, D-70). Le train à quai disparaît du quai (il part avec la classe) ; son présage s'arrête au départ. **Aucun parent dans le train** (choix de l'utilisateur).
- **La voiture-couchettes** (`train-couchettes`, 86 × 22, facile, page « Le train » du cahier, musique `train`, `; @vehicle: train`) : la plateforme d'arrivée (porte fermée) ; le compartiment de la classe (deux piles de couchettes sur trois étages, la tablette sous la fenêtre, la veilleuse) ; **une grille en accordéon à moitié fermée** qui ne laisse qu'une tuile au sol (on ne passe qu'en glissant) ; le compartiment suivant (couchettes, le **chariot du vendeur** garé, sous lequel on glisse aussi, une étagère à bagages au-dessus des couchettes de droite, **le filet à bagages et sa trouvaille**) ; au bout, la porte de la voiture suivante.
  - **La trouvaille du filet** est **moyenne exactement** (150 ms) et demande un **saut long depuis la glissade** : une revisite dans le train même (sans la glissade, hors d'atteinte ; testé).
  - Échelle d'enfant (comme la maison) ; chaque appui tient au mur ou au plancher (grille du salon, D-74).
- **La glissade s'apprend** (nouvelle étape d'histoire `ability`, sauvegardée avec l'indice et la bulle d'aide, comme un objet ramassé) : près de la grille, la camarade invite Céleste (un cœur) ; **dans le noir d'un court fondu**, elle est passée de l'autre côté (un personnage ne bouge jamais à l'écran) ; elle montre la glissade (bulle « glisser », nouveau pictogramme) ; Céleste apprend la glissade. La maîtresse rappelle l'heure du coucher (bulle « lit »).
- **La nuit** : Agir sur sa couchette (celle du milieu, à gauche ; atteignable sans grimper). Fondu ; **tout le monde dort** (la camarade et les deux enfants sous leur couverture), **les lumières s'éteignent** (nouvelle règle `dim` : la salle plus sombre, les liseuses éteintes, seules les veilleuses et la lune), Céleste assise sur sa couchette. **Une lueur passe dans le couloir** (des scintillements de la fenêtre jusqu'à la grille, puis plus loin) ; bulle « ? ». Au bout de la voiture, un présage (la lumière vacille) ; Agir à la porte : « ? » (PLACEHOLDER, la voiture suivante vient avec la PR 3).
- **Le train roule** (nouvelle règle `moving` de l'histoire) : derrière les vitres, **le paysage de nuit défile** (`BackdropView`, plans `scroll`, motifs périodiques sans couture) : le ciel, les étoiles et la lune immobiles ; des collines et leurs villages aux fenêtres allumées, lentement ; le talus, les arbres, des maisonnettes et **les poteaux de la caténaire** et leur fil, vite. L'allure monte et descend doucement (`TRAIN_RIDE.accelPerS`) ; arrivée dans une salle qui roule déjà : à pleine vitesse. **Secousses** de temps en temps (6 à 11 s, un tremblement léger de l'image), jamais pendant un script. **Rien ne touche à Céleste ni à la collision** (pilier 1). Réglages `TRAIN_RIDE` (`src/config/art.ts`), PROVISOIRES.
- **Personnages** (PLACEHOLDERS, dessinés par le code) : la maîtresse et les parents « au revoir » (familyArt, à hauteur d'enfant) ; les enfants (`classArt.ts`) à peu près de la taille de Céleste : **la camarade** (cheveux noirs en deux macarons, pull jaune, salopette, baskets rouges), un garçon à casquette rouge, une fille au carré.
- **Debug** : histoires « le train, en route (la glissade à apprendre) » et « le train, la nuit (la lueur) » ; la case « Capacité : glissade » (la glissade est une capacité, pas un drapeau).
- **Tests** : `train.test.ts` (le départ, les parents restent sur le quai, le train roule, la nuit éteint les lumières, la camarade change de place dans le noir et la glissade s'apprend, la grille ferme le compartiment suivant sans la glissade, la couchette facile, la trouvaille moyenne par un saut long, jamais coincée). Dans le graphe de toute la zone, le train ne compte qu'à partir de la phase 3 (on n'en revient qu'à l'arrivée, PR 6).
- **Limite assumée** : jusqu'à la PR 3, la voiture-couchettes est un cul-de-sac (on ne revient pas au quai : le train est parti). Comme dans les mondes étranges, la suite du niveau ramène ensuite à la maison.
- **Sauvegarde** : aucune migration (étapes `train.*`, capacité `slide`).

## D-86 — Le train, PR 3 : les compartiments, le fourgon, le toit et ses tunnels, le wagon-restaurant

- **Plan validé** (D-83). Écarts et précisions ci-dessous.
- **L'ordre des voitures** : voiture-couchettes → compartiments → fourgon → wagon-restaurant. **Le wagon-restaurant est fermé la nuit** : sa porte, côté fourgon, ne s'ouvre que de l'intérieur (comme la porte de l'école, D-64). On y arrive **par le toit** : l'échelle au bout du fourgon (porte 3) monte au toit, la trappe au bout du toit (porte 2) descend dans le restaurant. Une fois la porte poussée de l'intérieur, **une boucle** fourgon ↔ restaurant. Le passage de la voiture-couchettes vers les compartiments (sa sortie 1, l'ancienne porte du bout) n'est ouvert qu'à la nuit (bulle « lit » avant) ; la bulle « ? » provisoire de la PR 2 est retirée.
- **Les compartiments** (`train-compartments`, moyen) : trois compartiments (banquettes : l'assise est pleine, le dossier est dessiné, on passe devant ; tablettes ; filets). La **maman qui berce son bébé**, et le bébé serre son propre poupon (écho silencieux à Maria ; Agir : un cœur, rejouable) ; **le contrôleur**, bienveillant, qui voit passer Céleste (un cœur, une fois) et la laisse aller ; deux voyageurs endormis. **Valises qui tombent** des filets dans les virages (nouveau danger : elles tremblent d'abord, puis tombent ; touchée en tombant, recul et la peur monte). Au bout, une **grille en accordéon** à moitié fermée : on ne passe vers le fourgon qu'en glissant (testé). Une pile de valises, une étagère à chapeaux, le filet et sa trouvaille.
- **Le fourgon** (`train-baggage`, moyen) : malles, une haute pile de caisses (on grimpe), des vélos pendus à leurs crochets (on s'y pose), le rail des crochets sous le plafond, puis **un câble** (le crochet du parapluie) jusqu'à une étagère haute et sa trouvaille ; **un chien qui dort** dans sa caisse (Agir : un cœur, rejouable) ; l'échelle du toit.
- **Le toit** (`train-roof`, dehors, la nuit, `TRAIN_NIGHT_PALETTE`) : le toit du fourgon, le soufflet entre les deux voitures, le toit du wagon-restaurant (des creux entre ses lanterneaux), deux aérateurs, la cheminée de la cuisine et sa trouvaille. Derrière, le paysage de nuit défile (le ciel entier). **Les tunnels** (nouveau danger, `; @tunnel: ligne du toit`) : toutes les `tunnelPeriodMs` (10 s), annoncés pendant `tunnelWarnMs` (2,6 s : l'image s'assombrit), puis le train est dedans pendant `tunnelPassMs` (2,4 s : le noir, des arches qui défilent). **Debout sur le toit**, Céleste est repoussée vers l'arrière et la peur monte (une fois par tunnel) ; **couchée (glissade)** ou **dans un creux, entre deux voitures**, rien. Testé : de chaque point du toit, un abri est à portée pendant l'annonce, en courant (sans compter la glissade, plus rapide).
- **Le wagon-restaurant** (`train-restaurant`, facile) : les chaises retournées sur les tables, le comptoir et ses tabourets, le porte-verres, l'étagère des bouteilles et sa trouvaille ; **la porte de la cuisine**, une lueur turquoise passe dessous (Agir : « ? », PLACEHOLDER jusqu'à la PR 5).
- **La lueur guide** : la nuit, un présage (la lumière vacille) en approchant du passage suivant de chaque voiture : le bout de la voiture-couchettes, la grille, l'échelle, la trappe, la porte de la cuisine.
- **Écarts avec le plan** :
  - **Les portes qui se referment** et **les colis qui glissent dans les virages** sont écartés : il faudrait des collisions mobiles (le moteur n'a que des tuiles fixes ; la faisabilité des sauts deviendrait dépendante du temps). Remplacés par la grille (la glissade) et les valises qui tombent (danger à cycle, sans collision, comme les trains de la gare).
  - **Le toit est déclaré « moyen »** en statique (ses passages les plus durs sont moyens) : sa difficulté vient des tunnels.
  - Les trouvailles du train sont plutôt faciles à atteindre une fois sur place (planer, saut long) : à resserrer si le téléphone le confirme.
- **Moteur** : `CombatWorld` (tunnels, valises : pures, sans allocation par pas, un compteur `hazardSteps` remis à zéro au chargement et à la réapparition) ; `TrainRideView` (valises, voile et arches du tunnel) ; réglages `tunnel*` et `luggage*` dans `src/config/combat.ts` et DEBUG → Combat (PROVISOIRES). Plus d'herbes d'avant-plan dans le train (dedans ni sur le toit).
- **Personnages** (PLACEHOLDERS) : la maman et son bébé (et le poupon du bébé), le contrôleur (casquette, veste bleu nuit, sa pince), des voyageurs endormis, le chien.
- **Tests** : `trainHazards.test.ts` (cycle du tunnel, repoussée debout une fois, rien à l'abri ni couchée ; valises : phases, décalées, touchent seulement dessous) ; `trainCars.test.ts` (liaisons et portes, les voitures roulent, chaque voiture se traverse et ne coince jamais, trouvailles atteignables, la grille demande la glissade, les abris du toit, les valises au-dessus d'un plancher).
- **Sauvegarde** : aucune migration (étapes `train.conductor`, `train.restaurant-open`).

## Risques identifiés à suivre

- **Croissance vs collisions** : hitbox par paliers alignés sur la grille, changement de phase uniquement en lieu sûr, hauteur de saut mesurée en tuiles, chemin critique praticable à toutes les phases suivantes, test automatique d'accessibilité par phase.
- **Coût graphique de la croissance** (animations × phases) : envisager moins de silhouettes que de phases.
- **Sauvegarde iOS** (effacement après 7 jours sans visite hors installation) : export/import de code indispensable.
- **Carte imparfaite** vs utilité de navigation.
- **Volume de 15 h** en production solo : vertical slice d'abord.
