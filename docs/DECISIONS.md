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

## Risques identifiés à suivre

- **Croissance vs collisions** : hitbox par paliers alignés sur la grille, changement de phase uniquement en lieu sûr, hauteur de saut mesurée en tuiles, chemin critique praticable à toutes les phases suivantes, test automatique d'accessibilité par phase.
- **Coût graphique de la croissance** (animations × phases) : envisager moins de silhouettes que de phases.
- **Sauvegarde iOS** (effacement après 7 jours sans visite hors installation) : export/import de code indispensable.
- **Carte imparfaite** vs utilité de navigation.
- **Volume de 15 h** en production solo : vertical slice d'abord.
