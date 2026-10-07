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

- **Décision** : le canvas peut être rendu à la **résolution logique** (640–800 × 360, agrandi par le CSS ; par défaut jusqu'à D-93) ou à la **résolution de l'écran** (taille logique × échelle, plafonnée à 3×), avec un zoom de caméra égal à l'échelle. Réglage dans l'overlay de debug et le menu pause, conservé en `localStorage`.
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
  - Papa, au potager, montre le portillon une fois le bonnet trouvé (étape `garden.dad-gate`, nouveau pictogramme `gate`). Retour de test : la bulle seule ne disait pas quoi faire ; papa montre d'abord la **ficelle rouge et sa chevillette** (pictogramme `cord`, avec une petite flèche vers le haut), puis le portillon.
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

## D-87 — Le train, PR 4 : la poursuite horizontale (parcours d'essai 12)

- **Plan validé** (D-83) : le système de poursuite de D-67 et D-70 s'étend à l'horizontale ; le poursuivant du train est un chariot de service géant chargé d'une tour de vaisselle, sans visage ; essayé seul dans le parcours d'essai 12, branché dans le niveau avec la PR 5.
- **Données** (compatibles : `; @chase: 7` reste la poursuite vers le haut) :
  - `; @chase: right 117` (ou `left`, ou `up`) : le sens et la colonne d'arrivée (le dos de Céleste la dépasse : la poursuite s'arrête, il recule) ;
  - `; @chase-phase: <colonne> <tuiles/s>` : rangées dans le sens de la course (vérifié au chargement) ;
  - `; @chase-trip` inchangé (une zone de la salle). Pas de poursuite vers le bas.
- **Mêmes règles** (cœur pur `Chase`, un seul code pour les trois sens : un axe orienté dans le sens de la course) : départ en retard dans le dos de Céleste, vitesse constante de la salle × `chaseSpeedScale`, rattrapage doux, croc-en-jambe une fois par essai, contact → la peur monte d'un cran, trois contacts → retour à la lanterne, il repart derrière elle.
  - **Le contact** : quand le front passe le dos de Céleste. Elle est **poussée en avant**, dans le sens de la fuite (`chaseContactPushX`, 220 px/s), et un peu vers le haut (`chaseContactHopY`, 240 px/s) ; il recule et s'arrête (réglages communs). Couchée, la glissade s'arrête (comme tout coup, D-84).
  - **Départ** propre à l'horizontale : `chaseSideStartDelayMs` (1,2 s) et `chaseSideRestartGapTiles` (6). **Écart avec le plan** (« mêmes valeurs ») : avec l'attente et l'écart de la tour (2,5 s, 9 tuiles), le chariot ne rattrapait même pas un joueur 50 % plus lent (Céleste court vite, les tronçons entre lanternes sont courts). Les règles restent les mêmes, seules ces deux valeurs diffèrent.
  - Le rattrapage doux (au plus 6 tuiles/s) ne sert pas dans le parcours 12 : le chariot y avance déjà plus vite.
- **Le chariot** (PLACEHOLDER, `ChaseView`) : roues, deux plateaux de métal sombre, la poignée à l'arrière, une nappe festonnée ; dessus, une **tour de vaisselle jusqu'en haut de la salle** (piles d'assiettes, tasses retournées, théières, cloches de service), qui penche un peu d'étage en étage ; porcelaine pâle dans l'ombre, violet sombre, **liseré turquoise** le long du bord avant. Sans visage. Le front occupe **toute la hauteur** : on ne saute jamais par-dessus (comme toute la largeur à la verticale). La tour oscille doucement et **tremble** au croc-en-jambe et au contact (compteur `jolts`) ; derrière, l'ombre. Le chariot roule sur le sol le plus fréquent de la salle. Trois images par salle ; aucune allocation par image.
- **Analyse de faisabilité** : chaque passage note, quand elle est connue, sa **position d'atterrissage** (`toX`, de l'essai qui donne sa durée). Le rejeu de la poursuite (`tests/pace.ts`) suit Céleste le long des planchers ; un passage lancé en courant compte la course depuis le bord arrière de la surface (D-67) : à l'horizontale, le bout déjà couru depuis l'atterrissage est retiré. Rien ne change pour la poursuite verticale.
  - **Limite** : l'analyse ne connaît pas les glissades enchaînées sur du plat (un peu plus rapides que la course) ; un joueur expert va un peu plus vite que le « chemin le plus rapide » (erreur dans le sens facile).
- **Parcours d'essai 12 « Poursuite horizontale »** (122 × 15, facile en statique ; prête escalade, saut mural et glissade ; le parapluie est retiré : il franchissait la fosse sans la glissade). De gauche à droite, une lanterne au début de chaque tronçon : une barrière basse (glisser dessous), des caisses et des filets à bagages ; **une poutre basse et un passage couché** (le croc-en-jambe : la tour s'y cogne, il recule de 6 tuiles et s'arrête), une pile de caisses ; une **fosse de vaisselle cassée** (saut long depuis la glissade), une pile de valises, une dernière barrière. Vitesse : **6,5 tuiles/s**.
- **Test de rythme** (phase 3, celle du train) : chaque tronçon prend **45 %, 68 % et 68 %** du temps du poursuivant (40 à 80 % exigés) ; le joueur parfait n'est **jamais touché** (au moins 2 tuiles d'avance) ; **50 % plus lent, il est touché** ; 25 % plus lent passe de justesse (dernier tronçon). En phase 1 (parcours lancé sans avoir grandi) : faisable, le joueur parfait n'est jamais touché. Impossible sans la glissade.
- **Sauvegarde** : aucun changement (parcours d'essai hors partie).

## D-88 — Le train, PR 5a : le monde étrange du train, le train de la vaisselle, la cuisine rose

- **Plan validé** (D-83), avec les choix de l'utilisateur : la PR 5 est **découpée en deux** (5a : le monde étrange et la cuisine rose ; 5b : le souvenir jouable) ; **la cuisine rose est la dînette d'enfance de Céleste** ; elle est **au bout du train de la vaisselle** (le souvenir est lié au fait de retrouver le jouet d'enfance, comme Roger en haut de la tour), pas dans une salle à part.
- **Entrée** (comme les casiers de la gare, D-68) : la nuit, Agir à la porte de la cuisine du wagon-restaurant (le déclencheur provisoire `train-kitchen` est remplacé) : la lueur scintille sous la porte, l'image tremble, un clignement dans le noir, la cuisine étrange se révèle en cercle. Après un évanouissement avant la première veilleuse, la porte y ramène (version courte). Pas de sortie volontaire. La lueur qui guide d'une voiture à l'autre s'arrête une fois la cuisine rose trouvée.
- **Deux salles** (`; @world: strange`, hors carte, musique `train-strange` PLACEHOLDER, palette en silhouettes comme la gare étrange) :
  - **la cuisine étrange** (`train-strange-kitchen`, 112 × 26, **moyenne**) : des **plaques chaudes** (nouveau danger dessiné, `; @hazard: hotplates`, mêmes règles que les orties : une lueur rose chaude, jamais de feu) entre de grands fourneaux, sous une **hotte basse** qui aplatit les sauts (et une casserole qui pend) ; une **étagère basse** (glisser dessous) ; une **cheminée d'étagères** (saut mural) jusqu'à la veilleuse turquoise ; puis **le rail des louches** (un câble, le crochet) au-dessus d'autres plaques jusqu'à l'étagère haute et la sortie. **Moyenne exactement** jusqu'à la veilleuse (190 ms), **impossible sans la glissade**, la sortie **impossible sans le crochet** (le parapluie seul ne suffit plus : l'étagère est à 39 tuiles) (testé). Fosses de plaques de 6 cases au plus (D-70).
  - **le train de la vaisselle** (`train-strange-dishes`, 126 × 15, facile en statique) : la poursuite horizontale (D-87) dans le niveau. Un wagon-restaurant sans fin, de travers (tables et chaises au plafond) ; la géométrie du parcours 12, habillée (barrières en étagères de vaisselle, piles d'assiettes, filets) ; **une fosse de vaisselle cassée** (`; @hazard: brokendishes`) ramenée à 6 cases (D-70). Une veilleuse au début de chaque tronçon. Vitesse **6,8 tuiles/s** : chaque tronçon prend **45, 65 et 66 %** du temps du chariot (phase 3, toutes les capacités) ; le joueur parfait n'est jamais touché ; 50 % plus lent, il l'est. Impossible sans la glissade.
- **La cuisine rose** (`pink-kitchen`, dessinée par le code, PLACEHOLDER) : un meuble-jouet rose, deux plaques, une petite casserole, une théière, le dosseret et ses boutons, la porte du four et son hublot ; la lueur turquoise autour. Au bout du train, après la ligne d'arrivée du chariot. On la regarde sans la prendre : un souvenir de la rubrique « Monde étrange » du cahier (dessin dans le cahier), une bulle cœur. **Maria n'y est pas** (pilier 5).
- **Fin provisoire** (à reconfirmer, le matin vient avec la PR 6) : le cercle se referme ; Céleste est assise sur **sa couchette**, la nuit (point de retour) ; une bulle « Maria » (fin d'un monde étrange, D-70), puis une bulle « lit ». **Le souvenir jouable** viendra s'insérer avant cette fin avec la PR 5b.
- **Debug** : histoires « le train étrange (la cuisine, la vaisselle) » et « la cuisine rose trouvée (fin du train étrange) ».
- **Tests** (`trainStrange.test.ts`) : entrée et réentrée, hors carte, liaisons ; difficultés exactes, glissade et crochet exigés ; la poursuite jusqu'à la cuisine rose et son rythme ; la cuisine rose (souvenir, objet, pas de Maria, fin sur la couchette) ; jamais coincée.
- **Sauvegarde** : aucune migration (étapes `train.strange`, `train.strange-done` ; souvenir `pink-kitchen` ajouté à la fin de `STRANGE_THINGS`).

## D-89 — Le train, PR 5b : le souvenir jouable (la cuisine rose)

- **Plan validé** (D-83, D-88), choix de l'utilisateur : Céleste toute petite **marche seulement** (pas de saut) ; le souvenir se **rejoue en entier depuis le cahier** ; les peluches de Roger sont **un panda roux et un lapin**.
- **Nouveau système, réutilisable** (Eden, niveau 7) : un souvenir jouable est **une petite salle** (`src/levels/memories/`, `; @world: memory`, hors de la zone) et **une liste d'actions** dans l'ordre (`src/config/playableMemories.ts`) : une zone où faire Agir, un geste, une étape du souvenir (les objets qui changent), la tasse portée ou non, un scintillement. Cœur pur et testé (`PlayableMemory`) : apparition depuis le noir, actions dans l'ordre (pas d'action sautée), Céleste immobile pendant un geste, puis **un cœur, un fondu, la salle seule un instant, le noir**, la fin. Ses étapes (`memory.*`) ne sont **jamais sauvegardées** : on le rejoue autant qu'on veut. Un autre souvenir n'est qu'une autre salle et une autre liste.
- **Dans le jeu** (`GameScene`) : le jeu est mis de côté (salle, place exacte de Céleste), le souvenir se joue **hors de la partie** (rien n'est sauvegardé, ni carte, ni lanterne, ni peur), puis Céleste revient exactement où elle était. Pendant le souvenir : ni pause, ni carte, ni saut, ni capacité ; Agir seulement. Interrompu (menu, debug) : Céleste reprend sa taille, le script s'arrête.
  - **Nouvelle étape de script `play`** (bloquante) : lancée dans le noir (après un fondu), elle attend la fin du souvenir ; le script reprend, toujours dans le noir.
  - **Le cahier** : toucher la cuisine rose (« Monde étrange ») la montre en grand, avec un petit triangle « lecture » (sans texte) ; la toucher encore rejoue le souvenir ; à la fin, l'image revient doucement où l'on était.
- **Le souvenir de la cuisine** (D-83) : Céleste toute petite dans un coin de la cuisine de la maison (le frigo et le plan de travail très hauts pour elle, la fenêtre, l'horloge), devant **sa dînette rose** ; elle **remue la casserole** (un peu de vapeur), **verse le thé** (elle porte la tasse, les deux mains devant), **l'apporte à Roger, au panda roux et au lapin** assis autour d'une petite table ; la tasse posée, **un cœur** ; fondu, **la petite cuisine reste seule**. Sans texte. **Maria n'y est pas, ni aucun parent** (pilier 5 ; l'histoire de la famille reste ouverte, §45).
- **Céleste toute petite** (`TODDLER_LOOK`, PLACEHOLDER) : la marionnette de la phase 1 en plus petit (corps × 0,78, hitbox 12 × 18), couettes courtes, lunettes rondes roses, pyjama ; pas × 0,55. **Signalé** (pilier 7) : la physique commune ne change pas, seuls ces paramètres, et seulement dans un souvenir.
- **Nouvelle pose** « les mains devant » (`CelestePoser.gesture`, `carrying`) : remuer (un petit cercle), verser, poser ; tenir la tasse.
- **Rendu** : couleurs chaudes et passées (`MEMORY_PALETTE`), la caméra se rapproche (`MEMORY_CAMERA_ZOOM`, × 1,7) ; musique `memory` (PLACEHOLDER). Objets dessinés par le code : la dînette (sans la lueur), la petite table et les trois peluches (Roger : l'image fournie), la tasse.
- **La cuisine rose** (D-88) : le souvenir se joue juste après le cercle qui se referme, avant la couchette (fin provisoire inchangée).
- **Debug** : bouton « Jouer le souvenir de la cuisine ».
- **Tests** : `playableMemory.test.ts` (ordre, zones, geste, tasse, fin, rejouable, étape `play` du script), pose (`celestePose.test.ts`), la cuisine rose (`trainStrange.test.ts` : le souvenir dans le noir, avant la fin). Vérifié dans Chromium : depuis la cuisine rose, le souvenir joué en entier, puis la couchette ; depuis le debug (comme le cahier), retour dans la salle de départ.
- **Sauvegarde** : aucun changement (rien n'est sauvegardé pendant un souvenir).

## D-90 — Le train, PR 6a : le matin, la gare de la mer, le train à quai qui relie les deux gares

- **Plan validé** (D-83), choix de l'utilisateur : la PR 6 est **découpée** (6a : le matin, la gare de la mer, le train à quai ; 6b : les revisites avec la glissade) ; **chaque bout du train donne sur une gare** (option A : traverser le train, c'est voyager, sans état à sauvegarder, un peu irréel, jamais expliqué) ; la gare de la mer **n'a pas de sortie** : la maîtresse et la classe attendent ; **le matin remplace la fin provisoire** de D-88.
- **Au matin** (`train-morning`) : après la cuisine rose, Agir sur sa couchette. Le noir le plus long ; **le matin** (`train.morning`) : les lumières reviennent (fin de la règle `dim`), **la maîtresse réveille Céleste** (une bulle soleil), les enfants sont assis, la camarade debout ; **la mer à la fenêtre** (nouveaux plans de fond : la mer immobile, une voile, la plage, ses piquets et ses oyats qui défilent) ; un cœur ; **le train ralentit et s'arrête** (`train.arrived` : fin de la règle `moving`, l'allure retombe doucement, `trainStopMs`) ; Céleste pense à Maria (l'arrivée, D-70) ; fondu, le quai de la gare de la mer (point de retour : sa lanterne).
- **La gare de la mer** (`sea-station`, PLACEHOLDER jusqu'au niveau 6, sur la page « Le train » du cahier) : un quai sous une marquise, **la mer et la plage derrière** (nouvelle option de fond `; @backdrop: sea`), le train arrêté le long du quai, sa porte ouverte (porte 1), une lanterne. À gauche, la maîtresse et la classe avec leurs sacs ; Agir près d'elles : Céleste demande (« ? »), la maîtresse sourit (soleil). Aucune sortie : rien n'est inventé de la station balnéaire (§45).
- **Le train à quai, de jour** : immobile, **sans passagers** (tous les personnages de la nuit disparaissent ; la classe est sur le quai de la mer), **sans danger** (nouvel état `CombatWorld.still` : ni tunnel sur le toit, ni valise qui tombe ; les valises restent sur leurs filets), de jour (palette du jour ; le toit : `TRAIN_DAY_PALETTE`, la mer derrière). Le restaurant reste ouvert ; la porte de la cuisine ne mène plus nulle part.
- **Le voyage** : la porte de la voiture-couchettes (porte 2) ↔ la gare de la mer ; une porte côté quai dans le fourgon (porte 4) ↔ **les quais de la gare de la ville** (porte 4, la porte du train à quai de D-69, de jour : `quay-train-day`, sans lueur). Pour aller de l'une à l'autre, on traverse la voiture-couchettes (la grille, en glissant) et les compartiments (testé, dans les deux sens).
- **Portes cachées** (nouvelle option `hidden` des portes fermées) : avant l'arrivée, ces trois portes n'existent pas pour le joueur (ni étincelle, ni Agir), en particulier sur le quai vide de la gare de la ville en phase 1 et 2.
- **Debug** : histoire « le train arrivé, la gare de la mer ».
- **Tests** (`trainArrival.test.ts`) : le script du matin (ordre : le matin dans le noir, la maîtresse, l'arrêt, Maria, la gare de la mer), le jour et l'arrêt, sans passagers, la gare de la mer (pas de sortie, ses liaisons), les portes cachées avant l'arrivée, le train arrêté sans danger, le voyage d'une gare à l'autre (glissade comprise) et rien avant l'arrivée.
- **Sauvegarde** : aucune migration (étapes `train.morning`, `train.arrived`).

## D-91 — Le train, PR 6b : les revisites avec la glissade

- **Plan validé** (D-83), avec des **ajustements acceptés par l'utilisateur** : la liste de départ (le salon sous le canapé, la terrasse sous les planches, un raccourci sous la palissade du chantier, un long passage sous le quai de la gare) ne tenait pas partout :
  - **la terrasse** n'a pas de planches ; un plancher surélevé aurait recouvert la lanterne et la porte de la maison (une lanterne ne bouge jamais : son identifiant dépend de sa position, pilier 10) → **sous la table de jardin** ;
  - **un raccourci rue ↔ chantier** ne tombait nulle part de propre (le bas droit du chantier est en gravats, le bas gauche porte déjà la sortie vers la supérette) → **une cachette sous la palissade**, dans la rue ;
  - **sous le quai** de la gare : le souffle du train qui passe couvre exactement l'épaisseur du quai sur toute la longueur ; dans un passage, Céleste serait poussée et effrayée sans abri (injuste, pilier 1) → **sous le kiosque** du hall.
- **Quatre trouvailles**, chacune dans un passage bas d'une tuile (ou juste derrière), qu'on n'atteint qu'en glissant :
  1. **le salon** : sous l'assise du canapé (vidée sur une rangée, entrée par la gauche), la trouvaille au fond ;
  2. **la terrasse du jardin** : sous la table de jardin (le plateau reste à la même hauteur, on monte toujours dessus) ;
  3. **la rue** : sous les planches vertes de la palissade (nouveau décor `sitehoarding`), une petite cachette entre l'échafaudage et le mur du fond ;
  4. **le hall de la gare** : sous le kiosque à journaux (7 cases couché).
- **Conséquence dans la rue** : les dix dernières cases du trottoir (colonnes 189 à 198) deviennent la cachette ; on n'y entre plus qu'en glissant (rien n'y était). Le bout du trottoir testé est maintenant la colonne 185, devant la palissade.
- Aucune nouvelle route : seulement des tuiles retirées ou ajoutées et quatre nouvelles trouvailles. **Aucune trouvaille ni lanterne existante n'a bougé** (leurs identifiants restent valables : une partie existante n'est pas touchée).
- **Tests** (`slideRevisits.test.ts`) : la vraie Céleste (phase 3) simulée devant chaque passage ramasse la trouvaille en glissant, jamais sans (en marchant et en sautant) ; puis elle ressort toujours, debout (jamais coincée). Les tests des salles (maison, jardin, rue, gare, « rien ne se ferme » en grandissant) restent verts.
- **Sauvegarde** : aucune migration (quatre nouvelles trouvailles, identifiants neufs).

## D-92 — Musique : premiers morceaux, préparation des fichiers

- **Premiers morceaux** (Suno, fournis par l'utilisateur) : thèmes `house-night`, `garden`, `strange`, `station` ; jingles `found`, `memory`, `maria`. Les autres emplacements restent silencieux.
- **Préparation** (`npm run audio:prepare -- <fichiers ou dossier>`, ffmpeg requis) : silences du début et de la fin coupés (la boucle en fondu enchaîné de 4 s porte sur la musique, pas sur un silence) ; **même sonie pour tous**, −18 LUFS intégrés, crête vraie ≤ −1,5 dBTP, normalisation linéaire (sans compression ; les fichiers bruts allaient de −14,5 à −23 LUFS et touchaient 0 dBFS) ; pochette et métadonnées retirées. Les fichiers bruts ne sont pas commités.
- **Format : AAC 96 kbit/s en `.m4a`** plutôt qu'Opus/Ogg (D-57) : lu par tous les navigateurs, y compris Safari sur les iPhone plus anciens, qui ne lisent pas toujours l'Ogg ; à débit égal, meilleur que le MP3. Environ 1,2 Mo par minute.
- **Conflit de nom corrigé** : le thème des souvenirs jouables s'appelait `memory`, comme le jingle ; un fichier `memory.*` aurait servi aux deux (le jingle de 9 s en boucle dans la cuisine du souvenir). Le thème devient `memory-play` ; un test interdit qu'un thème et un jingle partagent un nom.
- **Poids** : 7,2 Mo pour ces 7 fichiers. **Budget porté de 12 à 25 Mo** (`AUDIO_BUDGET_BYTES`, choix de l'utilisateur) pour les 9 thèmes restants, tous précachés (téléchargés une fois, à l'installation).
- **Le jingle `memory`** (9 s) reste entier pour l'instant (choix de l'utilisateur), à raccourcir si besoin.

## D-93 — Rendu à la résolution de l'écran par défaut

- **Décision** (demande de l'utilisateur) : le mode « écran » de D-18 devient le réglage par défaut, à la place du mode « logique ». Toujours réglable dans le menu pause.
- **Conséquences** : une nouvelle partie démarre en mode écran ; une sauvegarde existante garde le mode qu'elle a enregistré (le défaut et un choix ne se distinguent pas), il suffit de le changer une fois dans le menu pause. Coût GPU plus élevé (≈ 9 fois plus de pixels), à surveiller au FPS de l'overlay.

## D-94 — Musique : moins de thèmes, jingles par-dessus le thème

Retours d'écoute de l'utilisateur sur téléphone.

- **Un seul thème pour la maison** (`house`, ancien `house-night`), de jour comme de nuit : `house-day` et `house-night` disparaissent ; le moment de la journée ne choisit plus la musique (la palette, si).
- **Un seul thème pour tous les mondes étranges** (`strange`) : la maison, derrière la haie, l'école, la gare et sa tour, la cuisine et le train de la vaisselle. `hedge`, `street-strange`, `station-strange`, `train-strange` disparaissent ; les salles qui les imposaient (`; @music:`) imposent `strange`. Testé pour toutes les salles étranges.
- Restent 8 thèmes : `title`, `house`, `garden`, `street`, `station`, `train`, `strange`, `memory-play`.
- **Le jingle `memory` raccourci** à 5 s (fondu de sortie de 1,5 s), par la nouvelle option `--max` de `audio:prepare`.
- **Les jingles laissent entendre le thème** : pendant `found`, `memory` et `maria`, la musique ne descend plus qu'à 80 % (`jingleDuck`, 30 % avant).
- **Apparition de Maria** : quand le jingle `maria` existe, le thème n'est plus coupé, seulement baissé comme pour les autres jingles (`hushWithJingle`) ; les autres jingles restent bloqués pendant ce moment. Sans fichier `maria`, le silence de D-57 est inchangé.
- **Sauvegarde** : rien (les thèmes ne sont pas enregistrés).

## D-95 — La station balnéaire : plan du niveau 6 validé (10 PR)

- **Choix de l'utilisateur** : un niveau **très travaillé**, au level design poussé et cohérent, à la difficulté plus évoluée ; la marée à deux états ; pas de nage ; **un boss horizontal** (la vague) ; **pas de parents** ; **la fin par une salle étrange presque incohérente**, le niveau 7 étant presque entièrement étrange. Aucune nouvelle capacité (D-82). Eden n'apparaît pas.
- **La marée** : deux états par salle (basse, haute), réglés par un drapeau (`sea.tide-high`), jamais en temps réel (collisions mobiles écartées, D-86). Une seule carte par salle, dessinée à marée basse ; `; @tide:`, `; @sea:`, `; @rise:` (ce qui flotte monte de toute la marée). La première marée haute vient de l'histoire (la pêche à pied), ensuite **deux bancs des marées** (la promenade, le port), au sec aux deux marées : Agir, Céleste s'assoit, le noir, la marée a tourné. Aucun banc au phare ni aux rochers : il faut **prévoir** sa marée.
- **L'eau** (option A2) : Céleste n'y entre jamais ; une chute ramène **au dernier appui sec** (un éclaboussement, la peur monte d'un cran). Nouvelle règle de la boucle de jeu, signalée et acceptée (PR 1b).
- **La baie** (une grande boucle) : la gare de la mer → **la promenade** (salle centrale, un banc) → **la plage** (marée basse : le sable, les flaques, les épis, la grotte ; marée haute : les cabines, la chaise du maître-nageur, les bouées) → **les rochers** (basse : la chaussée vers le phare ; haute : les vagues à cycle et la route haute, difficile) → **le phare** (vertical, l'escalier cassé ; en haut, la vue sur le carrousel) → la passerelle du brise-lames (à marée haute dans les deux sens ; à marée basse, à sens unique) → **le port** (bateaux et pontons qui montent, drisses pour le crochet, la grue, un banc) → **la jetée et la fête foraine** (le soir : stands, guirlandes, chaises volantes, la grande roue, le carrousel ; dessous, à marée basse, les pilotis). **Le centre** de la classe de mer (dortoir, réfectoire), derrière une porte de la promenade.
- **Les jours** : jour 1, l'arrivée, le centre, la pêche à pied, la première marée ; jour 2, le temps libre (port, rochers, phare : du haut du phare, la lueur sous le carrousel bâché) ; le soir, la fête ; la nuit, la fin. Des étrangetés de plus en plus nombreuses, jamais expliquées (une mouette immobile en vol, l'heure impossible du panneau des marées, la lumière turquoise du phare, une cabine de la grande roue, les chevaux tournés à l'envers).
- **Nouveaux éléments** (moteur existant) : les crabes (patrouilleurs, ils s'enfouissent), les mouettes (comme les araignées, elles piquent), les vagues sur les rochers et les chaises volantes (dangers à cycle, comme les tunnels du toit).
- **Le monde étrange** : **la fête engloutie** (difficile : cheminées de chevaux de bois, guirlandes au-dessus de l'eau) puis **la vague** : une poursuite horizontale, une vague immense de toute la hauteur, sans visage, des chevaux de bois et des ballons dans son écume turquoise ; son **rythme** (elle déferle, puis se retire un instant) donne les fenêtres du §19 (on monte une cheminée pendant le reflux). Quatre tronçons, une digue où elle se brise. Au bout, sur le toit du carrousel étrange, **le livre musical** ; son court souvenir : Céleste toute petite appuie sur un bouton du livre, des notes dessinées s'en échappent (elle est seule).
- **La fin : le couloir** : la nuit au dortoir, la mélodie du livre ; la porte donne sur un couloir qui revient sur lui-même ; à chaque tour il change (du sable ; le papier peint de sa chambre et la toise ; l'horloge de la gare et les valises ; la mer en bas, le ciel à l'envers) ; au quatrième, une porte qui n'était pas là, la lueur ; le noir, fin du niveau 6 (la suite reste un PLACEHOLDER). Ni parents ni Maria à l'écran.
- **Difficulté** : « difficile » sur le chemin pour la jetée le soir et la fête engloutie, une poursuite difficile ; **un défi optionnel** dans presque chaque salle, plus dur que son chemin ; environ 12 trouvailles, presque toutes liées à une marée. Une lanterne avant chaque passage difficile du chemin.
- **Croissance** : pas de phase 4 dans ce niveau (la fin passe dans l'étrange) ; elle viendra avec le niveau 7. Aucune revisite des anciennes zones (aucune nouvelle capacité) : les revisites sont celles des marées.
- **Outils** : la difficulté **par tronçon** (`; @leg:`), un graphe de faisabilité propre au niveau 6 (la marée et la glissade) ; le plané après un saut long n'est pas analysé (D-84) : réservé aux défis, vérifié par une Céleste simulée.
- **Découpage** : 1a le moteur de la marée et l'analyse ; 1b l'eau, son dessin et le parcours d'essai 13 (**essai sur téléphone**) ; 2 l'arrivée (gare ouverte, promenade, centre, page « La mer ») ; 3 la plage et les rochers ; 4 le port et le phare ; 5 la jetée et la fête ; 6 la fête engloutie ; 7 le rythme de la vague (parcours d'essai 14) ; 8 la vague dans le niveau et le livre musical ; 9 le court souvenir, la nuit, le couloir et la fin.

## D-96 — La station balnéaire, PR 1a : le moteur de la marée et l'analyse

- **Plan validé** (D-95). Aucune salle du jeu n'utilise encore la marée : tout est essayé sur une salle d'essai des tests (`tests/fixtures/tide-room.txt`).
- **L'eau** : nouvelle tuile `Water` (`~` dans les cartes, une flaque ou la mer qui ne se retire jamais). Non solide ; aucune surface dessous ; l'analyse de faisabilité, l'escalade et les rebords l'évitent comme un danger (`touchesHazard`). **Provisoire** jusqu'à la PR 1b : dans le jeu, elle pique comme les orties (le retour au dernier appui sec vient avec la PR 1b). Dessin PLACEHOLDER (`WATER_COLORS`).
- **Données** :
  - `; @tide: <basse> <haute>` : première ligne d'eau à marée basse, puis à marée haute ;
  - `; @sea: col ligne l h` (répétable) : là où monte la mer (l'eau remplit les tuiles vides) ;
  - `; @rise: col ligne l h` (répétable, dans la mer) : ce qui flotte ; à marée haute, tout son contenu (tuiles, décor entièrement dedans, câbles aux deux bouts dedans) monte de `basse − haute` lignes.
- **Deux variantes statiques** (`src/core/level/tide.ts`, pur) : la salle lue est la marée basse ; `highTide` construit la marée haute (en cache), `atTide` passe de l'une à l'autre. Même identifiant de salle : **lanternes et trouvailles gardent leurs identifiants** (pilier 10). À marée haute, une trouvaille ou un patrouilleur sous l'eau n'y est pas (la trouvaille s'atteint à marée basse).
- **Vérifié à la lecture** (erreurs explicites) : lanternes, objets de capacité, départ, arrivée, portes et sorties au sec aux deux marées ; trouvailles au sec à marée basse ; rien d'autre que des tuiles et du décor sur ce qui flotte ; ce qui flotte ne heurte rien en montant. La zone vérifie aussi qu'on arrive debout par chaque sortie aux deux marées.
- **L'histoire** : nouvelle étape `toggle` (une étape réversible, posée si absente, retirée sinon), **seulement dans le noir** (vérifié par `storyProblems`) ; un déclencheur rejouable peut la contenir avec fondus, pose et placement (le banc). Le drapeau `sea.tide-high` est **la seule étape réversible** ; la sauvegarde sait la retirer (`removeStoryFlag`), **sans migration** ni changement de schéma.
- **Dans le jeu** (`GameScene`) : la salle prend sa variante au chargement, à l'arrivée et à la réapparition ; quand la marée tourne, la salle change **dans le noir** (ou tout de suite, hors script, par l'outil de debug) et Céleste garde sa place, sa peur et son point de retour.
- **Les tronçons** (`; @leg: col,ligne col,ligne difficulté [capacités] [high]`, répétable) : la difficulté **exacte** d'un trajet dans une salle (faisable aux fenêtres de sa difficulté, pas à celles de la plus facile), impossible sans chacune des capacités nommées (`climb`, `wall-jump`, `umbrella`, `hook`, `slide`), à une marée. Vérifiés pour toutes les salles et tous les parcours par `tests/legs.test.ts` (Céleste en phase 3, ses cinq capacités, la glissade analysée).
- **Le graphe de la marée** (`tests/tideGraph.ts`) : un nœud est une surface d'une salle **à une marée** ; les sorties gardent la marée ; un banc (un déclencheur qui retourne la marée et replace Céleste) passe d'une marée à l'autre. Avec lui : « jamais coincée » (tout nœud atteint rejoint une lanterne), et ce qui ne s'atteint qu'à une marée.
- **Vérifié dans Chromium** : la salle d'essai à marée basse (le sable, le ponton posé, la trouvaille), puis haute (l'eau, le ponton monté, la trouvaille noyée absente), Céleste à la même place ; et retour.
- **Sauvegarde** : aucune migration (une étape d'histoire, retirable).

## D-97 — La station balnéaire, PR 1b : l'eau ramène au bord, son dessin, le parcours d'essai 13

- **Plan validé** (D-95, option A2, nouvelle règle de la boucle de jeu signalée et acceptée).
- **L'eau ramène au dernier appui sec** (`RunState`, pur) : dès que la hitbox (réduite de `HAZARD_INSET_PX`) touche l'eau, un éclaboussement (des gouttes en gerbe), **la peur monte d'un cran**, Céleste s'efface pendant `splashMs` (320 ms), puis reprend pied, arrêtée, sur son **dernier appui sec** ; l'image revient (`reappearMs`). Au dernier cran de peur, elle s'évanouit comme d'ordinaire (retour à la lanterne).
  - **Le dernier appui** : la dernière position où Céleste se tenait au sol, **les deux pieds sur un sol** (jamais au ras d'un bord), sans toucher ni danger ni eau, et sans coup ce pas-là. Oublié en changeant de salle, à la réapparition et quand la marée tourne ; sans appui retenu, retour au point de retour de la salle.
  - **L'eau ne pique plus** comme les orties (la règle provisoire de D-96 est retirée) : le combat ne la voit pas (`touchesSting`) ; l'analyse, l'escalade et les rebords l'évitent toujours (`touchesHazard`). Une chute dans l'eau ramène au nœud de départ : aucune route nouvelle à vérifier.
  - Réglage `splashMs` dans DEBUG → Monde. PROVISOIRE.
- **Le dessin de l'eau** (PLACEHOLDER) : dans une salle habillée, l'eau fonce avec la profondeur (`WATER_COLORS`, 5 lignes jusqu'au plus sombre) ; une ligne de surface claire ; **des vaguelettes qui bougent** (`WaterView` : par nappe, deux bandes qui défilent lentement en sens contraires, créées au chargement de la salle, aucune création en jeu ; `WATER_LIFE`). En silhouettes, l'eau est sombre et l'écume turquoise.
- **DEBUG** : case « Marée haute (la station balnéaire) » (la salle change aussitôt, Céleste reste où elle est).
- **Parcours d'essai 13 « Marée »** (90 × 20, facile ; prête escalade, saut mural et glissade ; la marée se change dans DEBUG, il n'y a pas de banc hors de la partie) :
  - **marée basse** : une flaque (toujours de l'eau) à sauter, le sable, la digue où l'on **glisse** dessous (une petite chambre et sa **trouvaille, noyée à marée haute**), le bateau échoué, une glissade sous le rocher, puis la **cheminée** entre le rocher et le quai (**saut mural**) ; impossible sans la glissade ni sans le saut mural (testé) ;
  - **marée haute** : le sable et le dessous de la digue sous l'eau ; **le ponton et sa caisse ont monté**, on passe sur la digue, sur le **pont du bateau à flot**, sur le rocher, puis le quai. Jamais coincée (testé).
  - Trois tronçons `; @leg:` vérifiés (D-96) : l'arrivée à marée basse (facile, glissade et saut mural exigés), la trouvaille (facile, glissade), l'arrivée à marée haute (facile).
  - Essais pendant la conception : le parapluie franchissait la digue depuis un pieu fixe (planer va très loin) ; le pieu est retiré (ce qui aide à marée haute doit flotter), et l'escalade franchissait un quai trop bas (relevé). **À retenir pour les vraies salles** : une marée ne ferme une route que si rien de fixe, plané compris, ne la contourne.
- **Vérifié dans Chromium** : la chute dans la flaque (l'éclaboussement, la peur à 1, le retour sur la berge, les deux pieds au sol) ; le parcours à marée basse puis haute (l'eau, le ponton et le bateau montés, les vaguelettes).
- **Sauvegarde** : aucune migration (rien de sauvegardé de plus ; le parcours est hors partie).

## D-98 — La station balnéaire, PR 2 : l'arrivée, la promenade, le centre, la page « La mer »

- **Plan validé** (D-95). Écarts et précisions ci-dessous.
- **L'arrivée** (`sea-arrival`, remplace la bulle provisoire `sea-teacher` de D-90) : sur le quai de la gare de la mer, Agir près de la maîtresse ; Céleste demande (« ? »), la maîtresse sourit (soleil). Dans le noir, **la classe part au centre** (`sea.arrived`) : Céleste au dortoir, près de sa couchette (point de retour : la veilleuse du dortoir) ; la camarade (un cœur), deux enfants assis sur les couchettes, les sacs au pied des lits ; Céleste pense à Maria (le début d'un niveau, D-70). La maîtresse est ensuite au réfectoire (Agir : « ? », puis le soleil, rejouable). **Aucun parent**, pas d'Eden.
- **La gare de la mer** s'ouvre à gauche (sortie 2) sur la promenade, **fermée tant que la classe n'est pas partie** (la maîtresse le rappelle). Le train reste ouvert vers la gare de la ville. **La lanterne n'a pas bougé** (24, 17).
- **La promenade** (`sea-promenade`, 160 × 28, dehors, la mer et la plage en fond, **moyenne** à cause de son défi) : la grille du port (fermée, Agir : « ? », la suite avec la PR 4) et **l'ancre** sur son socle ; un lampadaire ; **l'escalier de la plage**, fermé par une chaîne (Agir : « ? », la PR 3) ; la longue-vue, **la lanterne et le banc** (le banc des marées viendra avec la PR 3) ; **le kiosque à glaces** (coffre, auvents rayés, toit, un grand cornet) ; trois lampadaires de plus en plus hauts ; **le centre** (porte 2), ses balcons fleuris, son toit et son **enseigne** (un soleil, une vague, une mouette, sans texte) ; le parvis de la gare et ses jardinières.
  - **Le chemin** de la gare au centre et à la lanterne : facile, à plat (tronçons `; @leg:` vérifiés).
  - **Le défi** (moyen exactement, 150 ms) : du toit du kiosque, les trois lampadaires, quatre balcons, puis le toit du centre et sa trouvaille, à côté de l'enseigne. Un premier placement derrière l'enseigne était inatteignable (on ne passe pas par-dessus : le haut de la salle) ; la trouvaille est passée de l'autre côté.
- **Le centre** (`sea-centre`, 72 × 26, intérieur, **moyen** à cause de son défi) : en bas, le réfectoire (la porte 1, le portemanteau, deux longues tables, le comptoir du passe-plat et son volet) ; un escalier d'une marche toutes les deux colonnes monte au **dortoir**, à droite (trois couchettes à deux étages, la veilleuse, l'armoire, les sacs). Au-dessus de la cage de l'escalier, **une poutre scellée dans le mur** et sa trouvaille.
  - **Le défi** (moyen exactement, 120 ms) : du haut d'une couchette, la **suspension** pendue au plafond (on s'y pose), puis un saut vers la poutre. Sans la suspension, le parapluie rendait la poutre facile ; plus loin, elle devenait impossible.
- **Le cahier** : nouvelle page **« La mer »** (la gare de la mer y passe, de la page du train) ; pictogramme `sea` (deux vagues et le soleil).
- **Rendu** (`src/scenes/art/seaArt.ts`, PLACEHOLDER, grille du salon D-74) : 18 éléments (`seabalustrade`, `portgate`, `anchor`, `plinth`, `beachstairs`, `telescope`, `seabench`, `freezer`, `icekiosk`, `kioskawning`, `colonie`, `colonybalcony`, `colonyroof`, `roofsign`, `colonyfloor`, `servinghatch`, `colonybunk`, `schoolbags`) ; lampadaires, jardinières, tables, comptoir, armoire, escalier, fenêtres, suspension et portemanteau repris des niveaux précédents. Rien ne flotte (balcons sur la façade, crosses des lampadaires, suspension à son fil, poutre dans le mur).
- **Musique** : le thème du quartier (`street`) faute de thème de la mer (8 thèmes, D-94) ; un emplacement `sea` pourra s'ajouter quand le morceau existera.
- **Debug** : histoire « la classe de mer, au centre ».
- **Tests** (`seaArrival.test.ts`) : le script de l'arrivée (dans le noir, le point de retour, Maria à la fin, aucun parent), la sortie fermée puis ouverte, la classe sur le quai puis au centre, la page du cahier, les liaisons, les lanternes, les difficultés ; jamais coincée de la gare au centre (graphe de la marée, D-96). Les tronçons des deux salles sont vérifiés par `legs.test.ts`.
- **Sauvegarde** : aucune migration (étape `sea.arrived`, deux trouvailles neuves). La lanterne de la gare de la mer est inchangée.

## D-99 — La station balnéaire, PR 3 : la plage, les rochers, la première marée, le banc, les vagues

- **Plan validé** (D-95). Écarts et précisions ci-dessous.
- **La plage** (`sea-beach`, 190 × 28, salle de marée : `; @tide: 24 18`) : par l'escalier de la promenade (porte 3, la chaîne provisoire de D-98 est retirée) sur **le haut de plage**, au sec aux deux marées (la lanterne, trois cabines, la chaise du maître-nageur).
  - **Marée basse** : le sable mouillé, deux flaques, des crabes, les pieux des épis (on passe entre eux, on se pose sur leur planche), les bouées posées sur le sable, **l'arche du gros rocher** (on glisse dessous), les marches de rochers et l'avancée vers les rochers (sortie 2). **Facile** (tronçon). Sous le haut de plage, **une grotte** où l'on entre couchée, et sa trouvaille (facile, la glissade exigée ; noyée à marée haute).
  - **Marée haute** : le sable sous l'eau ; des cabines à la chaise, **la drisse du drapeau** (le crochet) jusqu'aux épis, le haut des pieux qui dépassent, **les bouées qui ont monté**, le gros rocher, l'avancée. **Moyen.**
  - **Défi** : **la balise** au large, sa cage et sa trouvaille, **à marée haute seulement** (moyen ; inatteignable à marée basse, testé). Un premier placement du gros rocher, plus haut, menait à la balise à marée basse (corrigé).
- **Les rochers** (`sea-rocks`, 150 × 32, salle de marée : `; @tide: 28 22`), jusqu'au **pied du phare** (sa porte : « ? », la suite avec la PR 4) :
  - de droite à gauche : l'avancée, des pierres basses, deux rochers où s'abriter, une faille (on glisse dessous à marée basse), **l'arche de la grande aiguille** et la pierre de la cheminée ; **la cheminée** (saut mural, exigé aux deux marées) monte au **rocher de la lanterne** ; l'aiguille du pêcheur et **son câble** (le crochet) jusqu'au pied du phare ; le bloc de la grotte, une grande pierre percée, les marches, le pied du phare.
  - **Marée basse** : facile (le fond, ses flaques et ses crabes en plus). **Marée haute** : **difficile** (le saut bas sous l'arche, 80 ms), et **les vagues**.
  - **Défi** (difficile, 50 ms, marée basse) : la grotte, où l'on entre couchée par la gauche, et sa trouvaille au-delà d'une flaque, sous un plafond bas.
  - **Le retour** du pied du phare (sans quoi il serait un cul-de-sac jusqu'à la PR 4) : la pierre percée, le dessus du bloc, l'aiguille du pêcheur, un rebord contre le rocher de la lanterne ; à marée basse, une étroite cheminée entre l'aiguille et le rebord remonte du fond. Une marche sort aussi du fond, à droite (un puits sans sortie, détecté par le test).
  - **Écart avec le plan** : la route haute existe aussi à marée basse (les rochers ne flottent pas) ; ce qui change, c'est le fond et la grotte (basse) et les vagues (haute). La marée ferme vraiment des routes à la plage (l'arche, la grotte, la balise) et au phare (PR 4).
- **Les vagues** (nouveau danger à cycle, `; @waves: ligne sens`, **à marée haute seulement**) : toutes les `wavePeriodMs` (7 s), annoncées pendant `waveWarnMs` (2,2 s : la crête d'écume monte de l'eau), puis elles balaient pendant `wavePassMs` (1,1 s : une bande d'écume) **tout ce qui a les pieds sous leur ligne** : Céleste est repoussée vers la terre et un peu soulevée (`wavePushX`, `wavePushY`), la peur monte, une fois par vague. Plus haut, rien. Testé : de chaque pierre dans les vagues, un abri à portée pendant l'annonce, en courant. Réglages DEBUG → Combat, PROVISOIRES.
- **Les crabes** (`; @enemies: crab`) : les patrouilleurs dessinés en crabes (carapace orangée, pinces, yeux sur leurs tiges). Sous l'eau à marée haute, ils ne sont pas là.
- **La première marée** (`sea-tide-rises`, `sea.first-tide`) : la classe fait **la pêche à pied** sur le sable (la maîtresse, la camarade, des enfants). Agir près de la maîtresse : Céleste demande ; la maîtresse montre la mer qui monte (nouvelle bulle **« marée »** : deux vagues, une flèche). Dans le noir, **la marée monte**, la classe remonte sur la promenade ; Céleste est **assise sur le banc** (point de retour : la lanterne de la promenade), elle regarde la mer ; un cœur de la maîtresse.
- **Le banc des marées de la promenade** (`sea-bench-promenade`, rejouable, après la première marée) : Agir ; le noir, Céleste s'assoit et regarde la mer ; l'image revient un instant ; le noir plus long, **la marée a tourné** ; bulle « marée ». Au sec aux deux marées (testé). Le banc du port viendra avec la PR 4.
- **Dessin** (`seaArt.ts`, PLACEHOLDER) : sable mouillé (rides, coquillages), haut de plage et oyats, grotte, cabines rayées, bas de l'escalier de la digue, chaise du maître-nageur et son drapeau, pieux des épis, bouées, balise, **rochers** (dégradé, crêtes irrégulières, fissures, bernaches, algues à la ligne de la mer), pied du phare. **L'eau n'a de vaguelettes que sous de l'air** (pas sous une planche ni un rocher).
- **Debug** : histoire « la première marée, le banc ».
- **Tests** (`seaShore.test.ts`) : liaisons, crabes absents à marée haute ; la grotte seulement à marée basse, la balise seulement à marée haute ; les vagues seulement à marée haute ; les abris ; une vague repousse une fois, rien au-dessus de sa ligne ; la première marée (dans le noir, la promenade) ; le banc (rejouable, au sec aux deux marées) ; **jamais coincée dans la baie aux deux marées** (graphe de la marée avec le banc), le pied du phare atteint aux deux marées. Les tronçons (`legs.test.ts`) : sept pour les deux salles.
- **Sauvegarde** : aucune migration (étape `sea.first-tide`, quatre trouvailles neuves).

## D-100 — La station balnéaire, PR 4 : le phare, le port, la boucle de la baie

- **Plan validé** (D-95). Écarts et précisions ci-dessous.
- **La boucle de la baie** est fermée : promenade → plage → rochers → **porte du phare** (porte 2 des rochers, la bulle « ? » provisoire est retirée) → **galerie du phare** → **passerelle du port** → **grille du port** (sortie 4 de la promenade, ouverte après la première marée ; la bulle « ? » est retirée).
- **Le phare** (`sea-lighthouse`, 34 × 72, vertical, **moyen** à cause de son défi) : l'escalier en colimaçon autour de son noyau (dessiné, on passe devant) : des volées de part et d'autre, tous les 3 rangs, des marches qui manquent ; **la chambre du gardien** (la lanterne, la table, la carte marine) et sa trappe ouverte ; puis une **cage étroite le long du mur** (saut mural, exigé) jusqu'à **la salle de la lanterne** ; la galerie (sortie 2). Chemin facile.
  - **Défi** (moyen, 150 ms, le saut mural exigé) : la trouvaille sur **la grande lentille** (posée sur son socle, on passe dessous), par un saut mural entre la lentille et le mur.
  - **Écart avec le plan** : le défi devait demander le crochet (le câble du paratonnerre). Le parapluie rattrapait la lentille depuis tous les appuis essayés (planer va très loin) ; le câble et les barreaux sont retirés plutôt que d'être inutiles. Un noyau plein coupait l'escalier (en 2D on ne passe pas derrière) : il est dessiné.
  - **Du haut du phare** (`sea-carousel-seen`, une fois, après la première marée) : des scintillements dehors, Céleste regarde (« ? ») ; **`sea.saw-carousel`** : la fête du soir viendra (PR 5).
- **Le port** (`sea-port`, 180 × 32, salle de marée : `; @tide: 28 22`, **facile**, une respiration entre les rochers et la fête) : la passerelle du phare sur ses pilotis finit sur **une tête de pierre au-dessus des bateaux** : à marée haute, ils sont à flot, on passe **dans les deux sens** ; à marée basse, ils sont échoués, on se laisse seulement tomber (**sens unique**, testé). Trois **bateaux** (deux voiliers, un bateau de pêche et sa cabine) qui montent avec la marée, leurs mâts et **leurs drisses** (le crochet, elles montent aussi) ; **un ponton** ; la vase, ses crabes ; **le quai**, son échelle ; **la capitainerie** et **le banc des marées**, la lanterne ; la grue.
  - **Défis** : la trouvaille au fond de **la buse sous le quai** (on y glisse, à marée basse seulement) ; la trouvaille sur la cabine de **la grue**, un portique qui enjambe le quai : on monte entre ses deux pieds en saut mural, puis par sa flèche (faciles, la glissade et le saut mural exigés).
  - **Écart avec le plan** : la grue devait se rejoindre par trois drisses de suite ; les drisses descendent (on y glisse vers le bas), la cabine est haute : le portique la remplace. Le brise-lames, d'abord trop haut, laissait regrimper à la passerelle à marée basse : abaissé (sous l'eau à marée haute).
- **Les mouettes** (`; @enemies: crab gull`) : les araignées dessinées en mouettes, sans fil ; elles piquent depuis un lampadaire et la flèche de la grue.
- **Les étrangetés** (jamais expliquées) : **une mouette immobile en plein vol** au-dessus du port ; **l'horloge de la capitainerie** a treize repères ; **la lentille du phare** a un cœur turquoise.
- **Dessin** (`seaArt.ts`, PLACEHOLDER) : noyau, volées, planchers, maçonnerie de la tour, salle de la lanterne, lentille et son socle, carte marine ; passerelle et pilotis, vase, **bateaux** (coque à l'étrave relevée, liseré, hublots, cabine, mât et haubans), ponton, quai et ses bittes, échelle, buse, capitainerie, grue, la mouette immobile ; **la grille du port dessinée ouverte** quand la sortie existe. Deux noms existants (`spiralstair`, `quay` de la gare) auraient été écrasés : renommés (`lighthousestair`, `harbourquay`).
- **Tests** (`seaHarbour.test.ts`) : la boucle et les liaisons, la grille ouverte après la première marée, **la passerelle** (deux sens à marée haute, sens unique à marée basse), la buse et les crabes à marée basse, le carrousel vu une fois, **toute la baie aux deux marées avec les deux bancs : jamais coincée**, le phare et le port atteints. Les tronçons (`legs.test.ts`) : huit pour les deux salles.
- **Sauvegarde** : aucune migration (étape `sea.saw-carousel`, trois trouvailles neuves).

## D-101 — La station balnéaire, PR 5 : la jetée, la fête foraine, le soir, les chaises volantes

- **Plan validé** (D-95). Écarts et précisions ci-dessous.
- **Le soir** (`sea-evening`, `sea.evening`) : une fois que Céleste a vu le carrousel du haut du phare, Agir près de la maîtresse sur la promenade : elle montre la fête (nouvelle bulle **« carrousel »**) ; dans le noir, **le soir tombe sur toute la baie** (moment `evening`, avant le matin du train dans les règles), la classe est sur la jetée, Céleste à l'entrée (point de retour : la lanterne de l'entrée) ; un cœur de la camarade. Avant, la maîtresse montre le soleil (rejouable). La nuit et la suite viendront avec le monde étrange.
- **L'arche de la jetée** (porte 3 du quai du port) : fermée le jour (la fête s'installe, « ? »), ouverte le soir.
- **La jetée** (`sea-jetty`, 220 × 28, salle de marée : `; @tide: 26 20`, **moyenne**) : de droite à gauche, la lanterne de l'entrée, **la trappe et son échelle** vers le dessous ; **le chamboule-tout** et **la barbe à papa**, fermés devant (on ne passe qu'**en glissant sous le comptoir**) ; **les chaises volantes** ; la seconde lanterne ; **la pêche aux canards**, son long toit bas au-dessus d'**un trou du platelage** (le saut long sous un plafond : 125 ms, le passage le plus dur) ; **le stand de berlingots** au bord du **grand trou**, puis **les guirlandes** (deux, le crochet exigé : le parapluie seul ne traverse pas 42 tuiles) ; la grande roue au fond, **sa guérite** ; **le carrousel** au bout. Le chemin exige la glissade et le crochet, aux deux marées (testé).
  - **Le retour** (sans quoi le bout de la jetée était un cul-de-sac à marée haute, détecté par le test) : une caisse de chaque côté de la guérite, son toit, et **une guirlande qui redescend** jusqu'au toit de la pêche aux canards.
  - **Sous la jetée, à marée basse** : les pilotis, deux pieux en cheminée (saut mural) et une trouvaille (défi, facile) ; on remonte par l'échelle. À marée haute, le dessous est sous l'eau.
  - **Écart avec le plan** (« difficile ») : la difficulté statique s'arrête à moyen (le toit bas sur 13 colonnes donne 125 ms ; sur 15, 33 ms, trop dur ; un rang plus haut, facile) ; la pression vient des chaises volantes. Les chiffres du plan restent indicatifs.
- **Les chaises volantes** (nouveau danger à cycle, `; @sweep: col ligne l h`, répétable) : elles tournent haut, descendent pendant `sweepWarnMs` (1 s), puis **balaient leur zone** pendant `sweepPassMs` (1,5 s), toutes les `sweepPeriodMs` (4,2 s). Céleste dans la zone est **renversée en arrière** (à l'opposé de sa course) et un peu soulevée, la peur monte, une fois par passage. **Couchée, elle passe dessous** (testé : la hitbox de la glissade est sous la zone). Dessin : `RideView` (six chaises, au calme haut, puis à hauteur de tête). Réglages DEBUG → Combat, PROVISOIRES.
- **Le carrousel**, le soir : la lumière vacille en approchant (présage) ; Agir : « ? » (PLACEHOLDER jusqu'au monde étrange, PR 6).
- **Les étrangetés** : une nacelle de la grande roue éclairée en turquoise ; les chevaux du carrousel tournés dans le mauvais sens ; une lueur turquoise sous eux.
- **Dessin** (`seaArt.ts`, PLACEHOLDER) : platelage, pilotis, échelle, arche du quai, stands rayés (leurs pieds, leur auvent festonné, leurs ampoules), berlingots, pêche aux canards (lampions), chaises volantes (mât, chapeau rayé), mâts et ampoules des guirlandes (allumées le soir), grande roue, guérite, carrousel (bâché le jour, illuminé le soir).
- **Debug** : histoire « le soir de la fête, la jetée ».
- **Tests** (`seaFair.test.ts`) : l'arche ouverte le soir, le soir sur la baie, le script du soir, **les chaises volantes** (une fois par passage, couchée en dessous), le carrousel et son présage, **toute la baie avec la jetée, aux deux marées : jamais coincée**, le carrousel atteint. Les tronçons (`legs.test.ts`) : trois.
- **Sauvegarde** : aucune migration (étape `sea.evening`, une trouvaille neuve).

## D-102 — La station balnéaire, PR 6 : le monde étrange, la fête engloutie

- **Plan validé** (D-95). Écarts et précisions ci-dessous.
- **Entrée** (comme la cuisine du train, D-88) : le soir, Agir devant le carrousel de la jetée (le « ? » provisoire de D-101 est remplacé) ; la lueur scintille sous les chevaux, l'image tremble ; un clignement dans le noir (`sea.strange`), la fête engloutie se révèle en cercle. Ensuite, le carrousel y ramène (version courte), après un évanouissement ou la fin provisoire. Pas de sortie volontaire. La lumière vacille toujours près du carrousel, le soir.
- **La fête engloutie** (`sea-strange-fair`, 180 × 30, `; @world: strange`, dehors sous le ciel violet, hors carte, musique `strange` PLACEHOLDER, **difficile**) : la fête de la jetée sous une eau immobile, démesurée. **L'eau partout dessous** : une chute ramène au dernier appui (D-97), la peur monte. De gauche à droite :
  - **le toit du carrousel englouti** (l'arrivée), son mât penché ;
  - **la cheminée des chevaux** : la barre du carrousel flotte au-dessus du toit, une autre sort de l'eau ; on passe sous la première, puis **saut mural** jusqu'à la traverse et **la première veilleuse** (facile exactement, 200 ms ; impossible sans le saut mural) ;
  - **deux guirlandes** au-dessus de l'eau (**le crochet**, on saute de l'une à l'autre), la grande roue à demi noyée au fond, ses ballons ; sans le crochet, le toit du stand d'en face est hors de portée du plané (plus de 60 tuiles) ;
  - **le toit d'un stand englouti** et une toile tombée jusqu'au toit (**on glisse dessous**), **la seconde veilleuse** (ce tronçon : facile, le crochet et la glissade exigés) ;
  - **sous l'auvent bas, le saut long** jusqu'au flanc d'un cheval de bois géant, et le **saut mural** pour s'y hisser (16 tuiles, **difficile**, 67 ms ; à 15 tuiles, il devient moyen) ; puis une cheminée entre une barre pendue et le dernier stand, jusqu'à son toit.
  - Trois tronçons `; @leg:` vérifiés (D-96). Jamais coincée (testé : de chaque surface, une veilleuse ou le bout) ; toutes les surfaces servent.
  - **Écart avec le plan** : la difficulté vient d'un seul passage difficile (le saut long) ; les cheminées et les guirlandes restent faciles, avec l'eau dessous. Les cheminées de chevaux de la poursuite viendront avec la vague (PR 7, 8).
- **Fin provisoire** (PLACEHOLDER jusqu'à la vague, PR 7 et 8) : sur le toit du dernier stand, l'image tremble (la mer gronde au loin) ; Céleste regarde (« ? ») ; le cercle se referme ; elle est sur la jetée, devant le carrousel. Aucune étape n'est posée : le carrousel y ramène. Ni parents ni Maria (pilier 5, D-95).
- **Étrangetés** : les chevaux tournés dans tous les sens, des têtes de chevaux qui dépassent de l'eau, une nacelle turquoise, des ballons immobiles, des yeux.
- **Dessin** (`seaStrangeArt.ts`, PLACEHOLDER, en silhouettes bordées de turquoise, D-81) : `drownedcarousel`, `horsepole`, `carouselbeam`, `fairawning`, `drownedstall`, `bigtop`, `balloons`, `sunkenhorses`, `drownedwheel`. Rayures des toiles et ampoules passées.
- **Debug** : histoire « la fête engloutie (le carrousel) ».
- **Tests** (`seaStrangeFair.test.ts`) : entrée et réentrée, hors carte, sa musique, le script (dans le noir, le cercle), la fin provisoire (retour devant le carrousel, aucun personnage), difficile, les veilleuses, les tronçons, jamais coincée.
- **Sauvegarde** : aucune migration (étape `sea.strange`).

## D-103 — La station balnéaire, PR 7 : le rythme de la vague (parcours d'essai 14)

- **Plan validé** (D-95) : le boss du niveau 6 est une poursuite horizontale, **la vague** ; son rythme est essayé seul dans le parcours 14, branché dans le niveau avec la PR 8.
- **Données** : `; @chase-look: wave` (seulement pour une poursuite horizontale, vérifié à la lecture) donne au poursuivant l'allure de la vague **et son rythme** ; le reste ne change pas (`; @chase`, `; @chase-phase`, `; @chase-trip`). Les autres poursuites gardent leur allure (testé).
- **Le rythme** (cœur pur `Chase`) : la vague **déferle** pendant `surgeMs` (2 s), à la vitesse de la salle, puis **se retire** pendant `backwashMs` (1,5 s), en reculant de `backwashSpeed` (3 tuiles/s) ; et ainsi de suite. Le cycle ne court que quand elle bouge (ni pendant l'attente du départ, ni pendant les pauses) et repart à chaque essai. **Pendant le reflux**, ni contact ni rattrapage. Réglages dans DEBUG → Combat, PROVISOIRES.
  - **Conséquence voulue** : quand elle déferle, elle va plus vite que Céleste (13 tuiles/s contre environ 9,5) ; le reflux rend l'avance. C'est **pendant le reflux qu'on monte une cheminée** (les fenêtres du §19). En moyenne, elle avance d'environ 6 tuiles/s, comme le chariot du train (6,5).
- **La vague** (PLACEHOLDER, `ChaseView`) : une masse d'eau sombre de toute la hauteur, sans visage ; un front strié d'écume, bordé de **turquoise** (là où il ne faut pas être) ; dans l'eau, des chevaux de bois et des ballons pâles ; en haut, **la crête** qui s'avance quand elle déferle, se replie et pâlit quand elle se retire ; elle se soulève lentement et tremble au contact. Trois images par salle, aucune allocation par image.
- **Parcours d'essai 14 « La vague »** (130 × 18, facile en statique ; prête escalade, saut mural et glissade ; le parapluie n'est pas prêté). Trois tronçons, une lanterne au début de chacun :
  - une barrière basse (glisser dessous), puis **une cheminée à pied sec** (on passe sous une barre pendue, saut mural jusqu'au haut d'un bloc) ;
  - un bassin à sauter, puis **une cheminée au-dessus de l'eau** (tomber ramène au dernier appui) ;
  - un dernier bassin, une barrière basse, une caisse, et **la digue où la vague se brise** (la ligne d'arrivée de la poursuite, colonne 117).
  - Impossible sans le saut mural, ni sans la glissade (testé).
- **Test de rythme** (phase 3, rejeu du vrai `Chase` le long du chemin le plus rapide, D-70, D-87) : le joueur parfait n'est **jamais touché** (au moins 2,4 tuiles d'avance) ; **sans le reflux** (une vague qui ne se retire jamais), il est touché à chaque tronçon : le rythme compte ; **50 % plus lent**, il est touché à chaque tronçon. 25 % plus lent passe les deux premiers tronçons, pas le troisième. En phase 1 : le joueur parfait n'est jamais touché.
- **Sauvegarde** : aucun changement (parcours d'essai hors partie).

## D-104 — La station balnéaire, PR 8 : la vague dans le niveau, le livre musical

- **Plan validé** (D-95) ; même schéma que le train (D-88) : le monde étrange finit sur un objet d'enfance, un souvenir de la rubrique « Monde étrange », puis une fin provisoire sur la couchette.
- **La fête engloutie** (D-102) s'ouvre à droite (sortie 1, au bout du toit du dernier stand) sur **la vague** ; sa fin provisoire est retirée. Ses veilleuses n'ont pas bougé.
- **La vague** (`sea-strange-wave`, 190 × 22, `; @world: strange`, dehors, hors carte, musique `strange` PLACEHOLDER) : la poursuite horizontale à l'allure de vague (D-103, `; @chase-look: wave`, 13 tuiles/s quand elle déferle), sur le platelage englouti de la fête. **Quatre tronçons, une veilleuse au début de chacun** :
  - le comptoir d'un stand (glisser dessous), un bassin, **la cheminée des chevaux** à pied sec (saut mural, pendant le reflux) ;
  - du haut du stand, **le grand bassin** et sa guirlande, la grande roue noyée au fond, une poutre basse (glisser dessous) ;
  - **la cheminée au-dessus de l'eau** ;
  - les chevaux dans l'eau, une caisse, **la digue où la vague se brise** (la ligne d'arrivée, colonne 160) ; après la digue, **le toit du carrousel étrange** et le livre.
  - Difficulté statique : facile (tronçons `; @leg:` vérifiés : glissade et saut mural exigés au premier, glissade au deuxième, saut mural au troisième). La difficulté est celle de la poursuite.
  - **Test de rythme** (phase 3, toutes les capacités) : le joueur parfait n'est **jamais touché** (plus de 2 tuiles d'avance) ; **sans le reflux**, ou **50 % plus lent**, il est touché à chaque tronçon. Pendant la conception, 25 % plus lent, il l'était à trois tronçons sur quatre (plus dur que le parcours 14 : la « poursuite difficile » du plan).
  - Jamais coincée de la fête engloutie au livre (testé). Une bande de platelage d'une colonne au pied du stand du deuxième tronçon était un cul-de-sac (détecté par le test) : le stand est élargi.
  - **Écart avec le plan** : les guirlandes et les chevaux dans l'eau servent peu à la poursuite (le plané passe au-dessus du grand bassin et des chevaux) ; ils restent pour l'image et comme appuis.
- **Le livre musical** (`music-book`, PLACEHOLDER) : un livre cartonné d'enfant, une note sur la couverture, quatre gros boutons ronds de couleur ; la lueur turquoise autour. Agir : un souvenir de la rubrique « Monde étrange » (ajouté **à la fin** de `STRANGE_THINGS`), une lueur, un cœur ; le cercle se referme (`sea.strange-done`) ; Céleste est assise sur sa couchette, au dortoir (point de retour) ; une bulle Maria (la fin d'un monde étrange, D-70), puis une bulle lit. **Fin provisoire** : le court souvenir (Céleste toute petite et le livre) et la nuit viennent avec la PR 9 ; en attendant, le dortoir garde la lumière du jour.
- Le carrousel ne ramène plus dans le monde étrange et la lumière ne vacille plus une fois le livre trouvé.
- **Dessin** (`seaStrangeArt.ts`) : `drowneddeck` (le platelage), `strangeseawall` (la digue), et les éléments de la fête engloutie.
- **Debug** : histoire « le livre musical trouvé (fin de la mer étrange) ».
- **Tests** (`seaStrangeWave.test.ts`) : la liaison, hors carte, la poursuite et sa digue, le rythme des quatre tronçons, jamais coincée, le livre et sa fin ; `seaStrangeFair.test.ts` mis à jour (la sortie vers la vague).
- **Sauvegarde** : aucune migration (étape `sea.strange-done`, souvenir `music-book` ajouté en dernier).

## D-105 — La station balnéaire, PR 9 : le court souvenir, la nuit, le couloir en boucle, la fin

- **Plan validé** (D-95). Le niveau 6 est complet ; sa fin reste un PLACEHOLDER jusqu'au niveau 7.
- **Le court souvenir du livre** (deuxième court souvenir, D-68 ; rejouable dans le cahier en touchant le livre) : Céleste toute petite, **seule**, assise sur un tapis, le livre ouvert devant elle ; elle appuie sur un bouton, la bouche ronde ; des notes de couleur s'en échappent et montent. Une fenêtre pâle derrière. Il se place après le cœur, avant que le cercle se referme. Maria n'y est pas (pilier 5).
- **La nuit au dortoir** : le centre a des murs de nuit (`; @nightwalls`), le soir (la fête et la nuit ne font qu'un). Après le livre, la camarade et deux enfants dorment sur leurs couchettes ; la maîtresse n'est plus au réfectoire. Sur sa couchette, Céleste pense à Maria, puis à son lit ; puis **la mélodie du livre** (bulle « musique »), d'on ne sait où, et une lueur sous **la porte du dortoir** (entre deux couchettes, du décor ; des sacs du décor y laissent la place) ; la lumière vacille près d'elle.
- **Le couloir en boucle** : Agir à la porte, la mélodie ; dans le noir, un couloir (le couloir du centre, la nuit : des portes fermées, des veilleuses). **Cinq couloirs aux tuiles identiques, reliés en anneau** (la sortie droite de l'un mène à la gauche du suivant, le dernier au premier) : le couloir « revient sur lui-même », et **change à chaque tour** :
  1. le couloir ordinaire ;
  2. du sable, en dunes basses le long des murs ;
  3. le papier peint de la chambre de Céleste (des pois roses) et sa toise (trois traits) ;
  4. l'horloge de la gare et des valises le long du mur ;
  5. le sol devenu une vitre sur la mer, le plafond un ciel à l'envers, et **une porte qui n'était pas là**, bordée de lueur turquoise ; la lumière vacille près d'elle.
  - Hors carte, en silhouettes comme les mondes étranges (`; @world: strange`), musique `strange` ; ce qui vient d'un autre lieu garde un peu de sa couleur, passée. **Écart avec le plan** (quatre tours) : un premier tour ordinaire avant les quatre changements, pour qu'on voie le couloir changer.
  - Sans danger ni lanterne : on rejoint toujours la porte en faisant le tour (testé). Le couloir est un point de non-retour : on n'en sort que par la porte.
- **La fin** : Agir à la porte ; la lueur, l'image tremble ; le noir, longtemps (`sea.end`). **PLACEHOLDER** : Céleste se retrouve devant la porte ouverte sur la lueur ; Agir : « ? » (la suite, le niveau 7, viendra). Ni parents ni Maria à l'écran.
- **Dessin** (`seaCorridorArt.ts`, `flashbackArt.ts`, PLACEHOLDER) : `corridordoors`, `sanddrift`, `bedroomwallpaper`, `heightmark`, `corridorsuitcases`, `seabelow`, `skyreversed`, `strangedoor` ; l'horloge de quai et la porte reprises.
- **Debug** : histoires « le livre musical trouvé, la nuit au dortoir » et « la fin de la station balnéaire (la porte du couloir) ».
- **Tests** (`seaNight.test.ts`) : le court souvenir et sa place, la nuit au dortoir, la porte du dortoir (seul passage vers le couloir), l'anneau des cinq couloirs (tuiles identiques, décors tous différents), la porte du dernier tour et la fin, on rejoint toujours la porte.
- **Sauvegarde** : aucune migration (étape `sea.end`) ; aucune lanterne ni trouvaille déplacée.

## D-106 — Retours de partie : le boss de la tour visible, des paliers dans trois cheminées

- **Le boss de la tour ne se voyait jamais** (retour de l'utilisateur : « jamais vu le boss ») : la poursuite marchait (testé en simulation et dans le jeu), mais la vue montre environ 7 tuiles sous Céleste (`; @camera: up`), il part 9 tuiles sous ses pieds (sous le sol à l'arrivée) et ne rattrape qu'au-delà de 12 tuiles : un joueur correct le garde toujours sous le bas de l'écran. Choix de l'utilisateur, **visuel seulement, difficulté inchangée** :
  - **il dépasse au bas de l'écran** quand il est dessous : sa crête, son liseré turquoise et la casquette, à `CHASE_VIEW.peekPx` (10 px) du bas, plus pâle quand il est loin (jusqu'à `peekMinAlpha` à `peekFadeTiles` tuiles) ; la collision reste celle du vrai front ;
  - **il se met en marche avec une secousse** (nouvel événement `ChaseEvent.Wake`, à la fin de l'attente du départ ou d'une réapparition ; poursuite vers le haut seulement, le chariot du train ne change pas).
  - Réglages `CHASE_VIEW` dans `src/config/art.ts`, PROVISOIRES.
- **Cheminées à saut mural trop exigeantes** (retour : « timing trop serré, précision quasi parfaite ; j'aime la difficulté mais c'est frustrant ») : les plus larges, au seuil « moyen ». Choix de l'utilisateur : **des paliers de repos**, sans toucher à la largeur ni à la physique. Une planche traversable de 2 cases contre le mur de gauche, à mi-hauteur : une erreur ne fait plus tout recommencer, chaque moitié demande toujours le saut mural.
  - Jardin renversé (cheminée de 4, entre les tuteurs) : une branche, ligne 13 ;
  - Objets perdus (monde étrange de la gare, cheminée de 5) : une valise qui flotte, ligne 15 ;
  - Objets trouvés (gare, cheminée de 5 entre l'armoire et les casiers) : une étagère à chapeau (`hatshelf`, un chapeau oublié), ligne 19.
  - Si ce n'est pas assez, l'étape suivante proposée : resserrer ces cheminées d'une case.
- **Tests** : `chase.test.ts` (le réveil, une fois au départ, une fois à la réapparition) ; les difficultés exactes des trois salles et les tests de ces salles sont inchangés.
- **Sauvegarde** : aucune migration.

## D-107 — L'avant-dernier niveau : plan du niveau 7 validé (12 PR)

- **Choix de l'utilisateur** (prompt du niveau 7, plan accepté tel quel) : « la maison de la nounou », presque entièrement étrange, très travaillée ; la sixième et dernière capacité, **la bascule** ; le boss **l'effacement** ; le **torchon blanc** ; **Eden** et son souvenir jouable ; le réveil, le train du retour et **la phase 4**. Ni Maria (sauf en pensée) ni parents à l'écran. La décision du plan devait être D-106 : ce numéro était pris par les retours de partie (PR #70), le plan est donc D-107.
- **Continuité** : le niveau commence derrière la porte du couloir en boucle (D-105), la même nuit ; le déclencheur provisoire `sea-end-later` sera remplacé.
- **Le lieu** : l'entrée et **le miroir** (le reflet de Céleste toute petite passe de l'autre côté dans le noir, Céleste l'imite : la bascule s'apprend, sans objet), puis **la maison**, salle centrale à hauteur de tout-petit, et **quatre îlots de mémoire**, dans un ordre libre, deux salles chacun :
  1. la chambre et le jardin renversé (Roger) : des cheminées dont un mur n'existe que dans une couche, des ronces d'une seule couche (escalade, saut mural) ;
  2. l'école et la rue (la boîte à formes) : de longs planés, des barrières d'une seule couche franchies en basculant en plein vol (parapluie) ;
  3. la gare et le train (la cuisine rose) : des câbles d'une seule couche, des plafonds bas du présent (crochet, glissade) ;
  4. la plage et le carrousel (le livre musical) : le présent est la marée haute, le souvenir la marée basse (toutes les capacités).
  - Chemin moyen, un défi optionnel difficile et environ deux trouvailles liées à la bascule par îlot ; au bout, l'objet et un passage du souvenir qui ramène à la maison et à l'îlot voisin (raccourcis). Signposting : une silhouette de l'îlot autour de chaque passage, une veilleuse de sa couleur au-dessus de la porte de la sieste une fois l'îlot fait.
  - **Les éléments réels** : des fentes vers la nuit du dortoir (la camarade endormie, la lampe de la maîtresse, la mer) ; deux servent de veilleuse.
  - **La carte** : une page « Chez la nounou » dans le cahier (la maison et les îlots ; la cage d'escalier et la salle de jeux hors carte). Assouplit la règle « une salle étrange n'est pas sur la carte ».
  - **Les objets revus** : Roger et le livre musical rejouent leur court souvenir ; la cuisine rose et la boîte à formes donnent un cœur (le souvenir jouable de la cuisine est trop long au milieu d'un îlot). Aucun ne redevient un collectible.
- **Le torchon blanc** : dans le petit lit de la sieste, une fois les quatre îlots faits ; le chemin le plus dur du niveau (difficile, veilleuses) ; un souvenir ajouté à la fin de `STRANGE_THINGS` et un court souvenir (Céleste toute petite serre son torchon).
- **La bascule** : deux couches statiques par salle (le présent en silhouettes violet et turquoise, le souvenir aux couleurs chaudes), la couche inactive en contour fantôme ; instantanée, au sol comme en l'air ; refusée avec un petit signe si la place manque ; rien ne bouge (D-86). **Bouton « Basculer »** à part (touche **I** : K est déjà Saut), à gauche d'Action, sur la rangée du bas, affiché une fois la bascule obtenue, pâli dans une salle sans couches (le refus). La couche active n'est jamais sauvegardée : on revient au présent en changeant de salle et à la réapparition ; lanternes, portes, sorties et départ tiennent dans les deux couches. **Changement des contrôles, signalé et accepté.**
- **Le boss, l'effacement** (gris pâle, sans visage) : la fuite verticale dans la cage d'escalier (il pâlit des bandes du présent devant Céleste, qui existent toujours dans le souvenir), puis la salle de jeux (vagues annoncées, les quatre objets pâlis à rallumer avec Agir, il recule et accélère, il se dissout au quatrième). Tomber dans l'effacement fait comme l'eau (D-97). **Changement de collision en temps réel**, signalé : une plateforme s'annonce, puis disparaît ; rien ne bouge ; rien n'apparaît là où se trouve Céleste ; chaque état est une variante statique analysée.
- **Eden** : assis près d'une tour de cubes dans la salle de jeux rendue à ses couleurs ; le souvenir jouable (la tour de cubes à deux, puis un cache-cache simple, la nounou en silhouette qui regarde, sans texte ; Eden change de place dans le noir) ; à la fin, Céleste seule ; dans le jeu, Eden n'est plus là.
- **La fin** : le réveil au dortoir à l'aube, une courte scène du train, « quelques mois plus tard », **la phase 4** (proposition : hitbox 12 × 30, course × 1,08, saut × 1,2 inchangé, corps × 1,5, cheveux × 1,6 ; look PLACEHOLDER faute d'illustration), puis un PLACEHOLDER du niveau 8.
- **Écart assumé** : la spec §15 veut chaque capacité utile dans les anciennes zones ; les anciens mondes étranges sont refermés, la bascule ne servira qu'aux niveaux 7 et 8.
- **Difficulté** (retour D-106) : cheminées de 4 au plus avec un palier ; « difficile » seulement sur le chemin du torchon et dans les défis optionnels, sur des passages courts, une veilleuse juste avant.
- **Découpage** : 1 la bascule (moteur, analyse, parcours d'essai 15, case DEBUG) ; 2 le dessin des deux couches, le bouton et l'aide (**essai sur téléphone**) ; 3 la porte, l'entrée, le miroir, la maison, la page de carte ; 4 l'effacement seul et le parcours d'essai 16 (**avancé** avant les îlots, **essai sur téléphone**) ; 5 à 8 les îlots ; 9 le torchon ; 10 le boss dans le niveau ; 11 Eden ; 12 le réveil, le train, la phase 4.

## D-108 — L'avant-dernier niveau, PR 1 : la bascule (moteur, analyse, parcours d'essai 15)

- **Plan validé** (D-107). Aucune salle du jeu n'a encore de couches : tout est essayé dans le parcours 15 et des salles d'essai des tests.
- **Données** : `; @shift: present|memory col ligne l h` (répétable) : ce qui est dans la zone (tuiles, décor entièrement dedans, câbles aux deux bouts dedans) n'existe que dans cette couche. La salle lue est le présent ; `atLayer` construit le souvenir (en cache), `commonLayer` ce qui est commun (le dessin de la salle). Même identifiant de salle : **lanternes et trouvailles gardent leurs identifiants** (pilier 10). Vérifié à la lecture (erreurs explicites) : zones dans la salle, sans chevauchement ; lanternes, objets de capacité, ennemis, départ, arrivée, portes et sorties hors des zones, et leur sol aussi ; un câble a ses deux bouts dans la même couche ; pas de couches et de marée dans la même salle.
- **La physique** (`PlayerPhysics.shiftTo`, pur, sans allocation) : même état, même élan, autre collision. Si la place manque, Céleste est décalée d'au plus `shiftNudgePx` (3 px : vers le haut, les côtés, puis le bas) ; au-delà, **refusée**. Refusée aussi suspendue à un rebord, ou accrochée à un câble absent de l'autre couche. Au sol, un sol qui disparaît laisse le coyote time ; la tolérance du saut mural contre un mur disparu est oubliée.
- **Le geste** (`LayerShift`, pur) : une pression de Basculer est gardée `shiftBufferMs` (100 ms) tant que la place manque (la bascule se fait dès qu'elle suffit) ; puis le petit signe du refus. Délai `shiftCooldownMs` (150 ms) entre deux bascules ; une pression pendant le délai attend sa fin. Réglages dans DEBUG → Mouvement et l'export JSON. PROVISOIRES.
- **La couche n'est jamais sauvegardée** : présent en entrant dans une salle, à la réapparition, au chargement d'un parcours. **Le dernier appui retient sa couche** (`RunState.footing.level`) : après une chute dans l'eau, Céleste revient dans la couche de l'appui. Les dangers, l'eau et les ennemis suivent la couche active (`RunState.setLayer`, `CombatWorld.setLayer`).
- **Les commandes** : nouvelle action `Shift` dans `InputAction` (le gameplay ne lit que l'action) ; **clavier I**. Le bouton tactile « Basculer » est déclaré (libellé) mais pas encore affiché : il vient avec la PR 2.
- **Le dessin** (PLACEHOLDER jusqu'à la PR 2, `ShiftLayerView`) : la salle est dessinée sans ce qui est propre à une couche ; par-dessus, quatre dessins créés au chargement (chaque couche pleine, et en contour fantôme) dont seule la visibilité change ; le présent violet bordé de turquoise, le souvenir aux couleurs chaudes. Le refus : un petit cercle de la couleur de l'autre couche qui s'ouvre et s'efface autour de Céleste ; la bascule : un éclair bref. Aucune création en jeu.
- **L'analyse de faisabilité** (D-16 étendue, option `shift`) : les surfaces des deux couches sont analysées ensemble (celles du souvenir numérotées après celles du présent, `presentCount`) :
  - **au sol** : basculer sur place (la fenêtre est la zone de départ utile, en temps de course) ou en courant (puis tomber dans l'élan) ;
  - **en plein saut** : pour les sauts en courant, sans élan, depuis la glissade, les chutes par un bord, les rebonds et la glissade contre un mur. Les deux couches ne diffèrent que dans leurs zones : **loin d'elles, basculer plus tôt ou plus tard revient au même** ; près d'elles, un essai tous les 4 pas (33 ms). Chaque saut journalisé devient un nœud d'instants de bascule, traité comme les appuis du saut mural (D-44) : la fenêtre d'un passage est la plus grande valeur v telle que des instants de saut consécutifs, chacun avec au moins v d'instants de bascule réussis, durent au moins v (approximation du « minimum des deux fenêtres », honnêtement une approximation) ;
  - **contre un mur** : basculer en glissant, rebondir vers le large puis basculer : une cheminée dont les murs alternent de couche se monte (testé) ;
  - **limites prudentes** (l'analyse peut juger plus dur, jamais plus facile) : une seule bascule par vol ; seulement les sauts tenus jusqu'au sol sans relâcher la direction, et le saut depuis la glissade 8 pas après ; ni bascule accrochée à un câble ni pendant Bas + Saut. Sans couches, rien ne change (testé : mêmes passages).
  - **Coût** : le parcours 15 s'analyse en environ 4,5 s (1,5 s sans la bascule) ; les reprises d'un essai à l'instant de la bascule partent d'un instantané (`AirSnap`), sans rejouer le début.
- **Les tronçons** : `; @leg: … shift [memory]` (`shift` : capacité exigée ; `memory` : couche de départ, le présent par défaut) ; l'arrivée compte dans les deux couches ; « sans la bascule », Céleste reste dans la couche de départ. Les graphes à deux états (`tests/tideGraph.ts`) savent les deux couches : le sol d'une lanterne compte dans les deux.
- **Parcours d'essai 15 « Bascule »** (100 × 20, facile ; prête escalade, saut mural et bascule ; une lanterne au début de chaque partie) :
  1. un mur du présent (on bascule pour passer), puis un sol qui n'existe que dans le présent au-dessus d'une fosse (on revient avant d'y marcher) ;
  2. une fosse : on saute du rebord du présent, **on bascule en plein saut** pour atterrir sur la planche du souvenir, puis l'autre bord, fermé dans le présent par un mur. Un premier essai avec un plafond bas laissait passer le parapluie (en phase 3, toutes capacités) : remplacé par ce mur ;
  3. **une cheminée** dont le mur gauche n'est que dans le présent, le mur droit que dans le souvenir : saut mural et bascule à chaque mur.
  - Trois tronçons faciles vérifiés (bascule exigée à chacun, saut mural au troisième) ; impossible sans la bascule (testé) ; jamais coincée (test des parcours).
- **Debug et cahier** : case « Capacité : bascule » ; une sixième ligne dans « Mes capacités » (pictogramme : une planche pleine, une en pointillés, la flèche entre les deux ; texte PLACEHOLDER).
- **Vérifié dans Chromium** : le parcours 15, le présent puis le souvenir (contours fantômes, planche du souvenir), le refus dans le mur (le cercle, la couche ne change pas), le retour au présent, le sol du présent au-dessus de la fosse.
- **Sauvegarde** : aucun changement (la capacité `shift` ira dans `progression.abilities`, sans migration).

## D-109 — L'avant-dernier niveau, PR 2 : le dessin des deux couches, le bouton « Basculer », l'aide

- **Plan validé** (D-107). Toujours aucune salle du jeu à deux couches : le parcours 15 (tuiles) et une salle habillée d'essai (hors dépôt) ont servi à vérifier le dessin.
- **Le dessin des couches** (`ShiftLayerView`, PLACEHOLDER pour les couleurs) :
  - la salle est dessinée sans ce qui est propre à une couche (D-108) ; chaque **zone** `; @shift:` est dessinée à part, **avec l'habillage** dans une salle habillée (nouvelle fonction `drawRoomLayer` : le fond proche, la structure, les ombres de contact et les meubles de la zone), en tuiles dans une salle de tuiles (les parcours) ;
  - **le présent** prend la palette de la salle (les silhouettes violet et turquoise du monde étrange) ; **le souvenir**, les couleurs chaudes et passées des courts souvenirs (`MEMORY_PALETTE`) ;
  - la couche inactive en **contour fantôme** : la silhouette de chaque zone, épaissie d'un px puis évidée (un liseré de la couleur de sa couche), un voile très léger dedans ; calculée sur un dessin sans ombre, pour suivre les formes ;
  - dans le souvenir, **un voile chaud** très léger recouvre la vue (`memoryVeil`) ;
  - deux textures par zone (pleine, fantôme), créées au chargement de la salle ; **basculer ne fait que changer des visibilités** (aucune création en jeu). Une salle à beaucoup de zones coûte donc de la mémoire graphique en proportion : à surveiller au téléphone avec les vraies salles.
  - Réglages `SHIFT_LAYER_VIEW` dans `src/config/art.ts`.
- **Le bouton « Basculer »** (changement des contrôles accepté, D-107) : **à gauche d'Action, sur la rangée du bas**, sous Glisser (`shiftRadius` 32, `shiftAngleDeg` 180) ; il n'apparaît qu'une fois la bascule obtenue ; **pâli** dans une salle sans couches (une pression y donne le petit signe du refus). Le pouce y glisse depuis Saut sans le toucher. Testé : dans l'écran et ses zones sûres, sans chevauchement, hors de la zone du joystick.
  - Remarque (antérieure à cette PR) : à l'échelle 1,5 sur un écran de 640 px, le bouton Glisser déborde déjà un peu dans la zone du joystick ; Basculer, non.
- **L'aide** : à l'obtention, l'indice (texte PLACEHOLDER) et **une bulle « bascule »** (nouveau pictogramme : une planche pleine, une en pointillés, la flèche entre les deux), comme le parapluie et la glissade ; la ligne de « Mes capacités » (D-108). L'obtention dans le jeu (le miroir) vient avec la PR 3.
- **Vérifié dans Chromium** : la salle habillée d'essai dans le présent (les zones du souvenir en contour fantôme) et dans le souvenir (ses meubles en couleurs chaudes, celles du présent en fantôme turquoise, le voile) ; le bouton tactile (`?touch`) qui bascule ; le bouton pâli dans la chambre (sans couches).
- **Sauvegarde** : aucun changement.

## D-110 — L'avant-dernier niveau, PR 3 : la porte du couloir, l'entrée et le miroir, la maison, la carte

- **Plan validé** (D-107). Écarts et précisions ci-dessous.
- **La porte du couloir** (`sea-end-door`, D-105) : après le noir (`sea.end`), Céleste est **dans l'entrée de la maison de la nounou**, la même nuit (point de retour : la veilleuse de l'entrée) ; le cercle s'ouvre, elle pense à Maria (le début d'un niveau, D-70). Le « ? » provisoire (`sea-end-later`) devient le même passage, pour une partie sauvegardée juste après la fin du niveau 6. Nouvelles étapes `nanny.arrived`, `nanny.mirror`, `nanny.house`, ajoutées en fin de liste.
- **L'entrée** (`nanny-entry`, 84 × 26, facile, `; @world: strange`, musique `strange`) : la porte par où l'on est venu (elle ne mène plus nulle part) ; **une fente sur la nuit du dortoir** (la camarade endormie, la mer et la lune, la lampe de poche de la maîtresse ; le seul élément réel, en couleur), qui sert de veilleuse ; le banc à chaussures ; **le grand miroir** qui barre l'entrée : sa vitre n'existe que dans le présent (`; @shift: present`), dans le souvenir le cadre est vide ; puis la sortie vers la maison.
  - **Le miroir** (`nanny-mirror`, en s'approchant) : dans la vitre, Céleste toute petite (nouvel objet `reflection` : couettes courtes, lunettes rondes roses, pyjama) ; elle envoie un cœur ; dans le noir d'un clignement, elle est **passée de l'autre côté** (`reflection-through`) et montre la bascule (bulle « bascule ») ; Céleste l'imite : **la bascule s'apprend** (étape `ability`, comme la glissade, D-85). Le reflet n'est plus là une fois dans la maison.
  - **Défi** : les patères du souvenir (on les voit en contour fantôme dès l'arrivée, avant d'avoir la bascule : signposting) jusqu'à l'étagère à chapeaux et sa trouvaille.
  - Tronçons : la sortie (facile, la bascule exigée) ; la trouvaille (facile, la bascule exigée).
- **La maison** (`nanny-house`, 132 × 40, **moyenne** à cause de son défi), à hauteur de tout-petit :
  - la veilleuse de l'arrivée et sa fente ; **un pouf** (une marche) et **le canapé** ; **dessous, dans le souvenir**, un passage d'une tuile (dans le présent, la jupe du canapé descend jusqu'au sol) et **une trouvaille** qu'on n'atteint qu'en glissant, dans le souvenir (testé par une Céleste simulée : ni sans glisser, ni dans le présent) ;
  - la table basse géante (on passe dessous, devant ses pieds : nouveau dessin `giantable`) ; **la petite porte de la sieste** et ses quatre veilleuses éteintes, une seconde fente-veilleuse ;
  - **la grande bibliothèque** : ses étagères d'aujourd'hui (présent, à droite) et d'autrefois (souvenir, à gauche) alternent, 4 rangs d'écart ; on monte en basculant (facile ; impossible sans la bascule, testé) jusqu'au dessus, où s'ouvrira le passage de l'îlot de l'école ;
  - **le défi** (moyen, 175 ms) : du haut de la bibliothèque, le mobile du souvenir, puis la lampe du présent, jusqu'à l'étagère haute et sa trouvaille ;
  - **les passages des îlots** (signposting, dessinés seulement : ils s'ouvriront avec les PR 5 à 8) : l'étagère de gauche (la chambre et le jardin : une tête de lit, des feuilles de haie ; on y monte par l'accoudoir et la barrière de lit du souvenir), le haut de la bibliothèque (l'école : l'horloge, un crayon), le mur de droite (la gare : l'horloge de quai, un rail), une trappe dans le plancher (la plage : une vague, du sable).
  - Tronçons : le haut de la bibliothèque (facile, bascule), l'étagère de gauche (facile, bascule), le défi (moyen, bascule).
- **Écarts avec le plan** :
  - la maison est un premier état : la cage d'escalier (le boss, PR 10) et les passages réels viendront avec leurs PR ; aucune lanterne ni trouvaille posée ici ne bougera ;
  - la table basse avait d'abord des pieds pleins qui barraient le sol, et le canapé ne se franchissait qu'en glissant dessous : un pouf et des pieds dessinés derrière (détecté par la sonde de faisabilité) ;
  - le banc à chaussures, d'abord trop haut pour un saut tenu bref, est abaissé d'une tuile.
- **La carte** : nouvelle page **« Chez la nounou »** (l'entrée, la maison) ; une salle du monde étrange peut y figurer avec `; @mapped: yes` (`isMappedRoom`) ; les autres restent hors carte (D-34).
- **Dessin** (`nannyArt.ts`, PLACEHOLDER) : `nannymirror`, `mirrorglass`, `nightslit`, `napdoor`, `toyblocks`, `giantable`, `passagebed`, `passageschool`, `passagestation`, `passagesea` ; le reste repris de la maison (canapé, pouf, étagères, bibliothèque, porte-manteau, tapis, la porte étrange du couloir).
- **Debug** : histoires « la maison de la nounou, l'entrée et le miroir » et « la bascule apprise, la maison de la nounou ».
- **Tests** (`nannyHouse.test.ts`) : la porte (dans le noir, point de retour, Maria en pensée), les salles et la carte, aucun personnage réel, la vitre du présent, le reflet et la bascule apprise, les veilleuses-fentes, jamais coincée (graphe à deux couches), le miroir infranchissable sans la bascule, la trouvaille sous le canapé ; `seaNight.test.ts` mis à jour (la fin mène au niveau 7) ; les tronçons par `legs.test.ts`.
- **Vérifié dans Chromium** : de la porte du couloir à l'entrée (le cercle, la fente), le miroir (le reflet dans la vitre, le cœur, puis de l'autre côté), la bascule apprise, le passage du miroir dans le souvenir, l'arrivée dans la maison ; la bibliothèque dans les deux couches.
- **Sauvegarde** : aucune migration (trois étapes en fin de liste, la capacité `shift`, trois trouvailles neuves).

## D-111 — L'avant-dernier niveau, PR 4 : l'effacement (le système) et le parcours d'essai 16

- **Plan validé** (D-107), PR avancée avant les îlots (essai sur téléphone). Aucune salle du jeu ne l'utilise encore : le boss viendra avec la PR 10.
- **Données** :
  - `; @erase: <groupe> present|memory|both col ligne l h` (répétable ; plusieurs zones par groupe) : des tuiles qui pourront changer de couche, avec leurs couches de départ ;
  - `; @erase-step: a,b` (répétable, dans l'ordre, en boucle) : à chaque étape, les groupes cités passent d'une couche à l'autre. Un groupe cité est une **vague** ; les autres sont des **bandes** (avec une poursuite vers le haut) ;
  - `; @chase-look: erasure` (vers le haut seulement) : la poursuite prend l'allure de l'effacement ;
  - `; @void: erasure` : les tuiles d'eau de la salle sont **l'effacement** (gris pâle, sans vaguelettes) ; y tomber fait **comme l'eau** (D-97 : retour au dernier appui, la peur monte d'un cran).
  - Vérifié à la lecture : zones dans la salle, sans chevauchement entre elles ni avec les zones `; @shift:` ; lanternes, objets, départ, arrivée, portes (et leur sol) hors des groupes ; une vague est dans une seule couche au départ ; pas d'effacement et de marée dans la même salle.
- **Des variantes statiques** (`src/core/level/erase.ts`, pur) : un état de l'effacement (les couches de chaque groupe, un « motif ») est une variante de la salle, construite et mise en cache (`erasedLevel`), analysable comme une autre ; ses couches par `atLayer`. Même identifiant : lanternes et trouvailles gardent les leurs (pilier 10). La salle se lit à son motif de départ.
- **Le moteur** (`EraseState`, pur, sans allocation par pas) :
  - **les bandes** : quand le front de l'effacement qui monte arrive à `eraseLeadTiles` (5) sous une bande, elle **blanchit** pendant `eraseWarnMs` (1,2 s), puis **quitte le présent** ; elle reste dans le souvenir ;
  - **les vagues** : toutes les `eraseWaveMs / eraseSpeedScale` (4 s), l'étape suivante est annoncée (`eraseWarnMs`), puis ses groupes changent de couche. `eraseSpeedScale` servira au boss quand il accélère ;
  - **rien n'apparaît sur Céleste** : une apparition dans sa couche, là où elle se tient, attend qu'elle soit partie. Rien ne bouge (D-86) ;
  - retour au départ au chargement de la salle et à la réapparition. Réglages dans DEBUG → Combat, PROVISOIRES.
- **Changement de la boucle de jeu, signalé et accepté** (D-107) : pour la première fois, la collision change pendant le jeu, hors du noir. Le jeu passe à la variante du nouveau motif dans la couche de Céleste (`PlayerPhysics.shiftTo`, sans marge : la place est toujours libre).
- **Le dessin** : la salle est dessinée sans aucun groupe ; chaque groupe est dessiné à part dans chaque couche (comme les zones de la bascule, D-109 : plein ou en contour fantôme, avec l'habillage dans une salle habillée), et montré selon ses couches du moment. **Annonce** : un voile gris pâle qui bat et monte sur la plateforme qui va partir ; une lueur pâle là où une plateforme va apparaître dans la couche active. **La poursuite** à l'allure de l'effacement : une décoloration grise et pâle qui monte, son bord en brume, des formes de jouets sans couleur, sans visage (grise plutôt que blanche, pour le torchon). PLACEHOLDERS.
- **Parcours d'essai 16 « Effacement »** (64 × 60, facile en statique ; prête escalade et bascule) :
  - **la fuite** : un puits de planches qui alternent (présent, souvenir, et des bandes dans les deux couches), l'effacement monte (3,5 tuiles/s) ; une lanterne en bas et au milieu ; on monte en basculant ;
  - **les vagues** : en haut, au-dessus du bassin de l'effacement, sous un plafond bas, quatre planches qui changent de couche deux par deux ; une lanterne avant.
  - Tronçons : la fuite et les vagues, faciles, la bascule exigée (en statique).
- **Tests** (`erase.test.ts`, `eraseCourse.test.ts`) : les données, les motifs (variantes et cache), les vagues annoncées puis appliquées, l'apparition qui attend, les bandes devant l'effacement ; dans le parcours 16 :
  - la fuite faisable une fois toutes les bandes parties du présent, impossible sans la bascule ;
  - **le rythme** (rejeu du vrai `Chase` le long du chemin le plus rapide, D-70, prudemment avec toutes les bandes parties) : le joueur parfait n'est **jamais touché** (au moins 2 tuiles d'avance, depuis le départ et la lanterne du milieu) ; **50 % plus lent, il l'est**. Pendant la conception : 25 % plus lent, il l'était aussi (difficile mais juste, à juger au téléphone) ;
  - **chaque motif des vagues** (quatre, en boucle) laisse un chemin jusqu'à l'arrivée, et on n'y est jamais coincée ;
  - **chaque vague est annoncée assez tôt** : de toute plateforme qui va disparaître, un appui qui reste est à portée pendant l'annonce (chemin le plus rapide).
- **Écarts et limites** :
  - les vagues sont dessinées en blocs de tuiles dans le parcours (un dessin habillé viendra avec la salle du boss) ;
  - le test de rythme suppose toutes les bandes déjà parties (prudent : en vrai, elles partent une à une) ;
  - premiers essais du parcours (détectés par les sondes) : le palier du haut fermait le puits par-dessus ; le plané traversait le bassin (un plafond bas l'empêche) ; une marche au bord du bassin rend le premier saut faisable en phase 1.
- **Sauvegarde** : aucun changement (parcours hors partie ; l'effacement n'est jamais sauvegardé).

## Risques identifiés à suivre

- **Croissance vs collisions** : hitbox par paliers alignés sur la grille, changement de phase uniquement en lieu sûr, hauteur de saut mesurée en tuiles, chemin critique praticable à toutes les phases suivantes, test automatique d'accessibilité par phase.
- **Coût graphique de la croissance** (animations × phases) : envisager moins de silhouettes que de phases.
- **Sauvegarde iOS** (effacement après 7 jours sans visite hors installation) : export/import de code indispensable.
- **Carte imparfaite** vs utilité de navigation.
- **Volume de 15 h** en production solo : vertical slice d'abord.

## D-112 — L'avant-dernier niveau, PR 5 : l'îlot de mémoire 1, la chambre d'autrefois et le jardin renversé (Roger)

- **Plan validé** (D-107). Premier des quatre îlots, ouvert depuis la maison sans condition (ordre libre).
- **L'accès** : l'étagère de gauche de la maison (son passage `passagebed`, dessiné en PR 3) devient la sortie 2 de la maison, vers **la chambre d'autrefois** (`nanny-bed`) ; sa sortie de gauche mène au **jardin renversé** (`nanny-garden`). Les deux salles sont `; @world: strange`, sur la page « Chez la nounou » (`; @mapped: yes`), musique `strange`, **moyennes**.
- **La chambre d'autrefois** (76 × 40), la chambre de Céleste démesurée, où la haie du jardin renversé a poussé :
  - l'arrivée en bas à droite (une lanterne), le coffre à jouets, **le lit** ;
  - **la cheminée de l'armoire** : entre l'armoire et la tête de lit, qui n'existe que dans le souvenir. On y descend dans le présent (par le lit), on la monte en basculant (un palier à mi-hauteur), jusqu'au dessus de l'armoire (une lanterne) ;
  - **la traversée des ronces**, sous le plafond bas de la haie : des rideaux de ronces d'une seule couche, des branches de l'autre ; à chaque saut, on bascule en plein vol entre le rideau et la branche (moyen, 167 ms) ; une dernière branche du présent mène au rebord de la sortie ;
  - **dans l'armoire**, ouverte dans le souvenir, une trouvaille (facile) ;
  - **le défi** (difficile, 67 ms) : la cheminée du pilier, aux ronces en bandes alternées sur les murs, puis en haut deux rideaux de couches opposées à une tuile d'écart, jusqu'à l'étagère de la trouvaille. Une lanterne à son pied (l'arrivée).
- **Le jardin renversé** (72 × 32), le jardin renversé (D-49) revenu :
  - la haie de l'arrivée (une lanterne), puis **trois pots géants** en escalier, dont les touffes de ronces n'existent que dans une couche (on atterrit dans l'autre ; facile, faisable aussi sans basculer en planant) ;
  - **l'arrosoir géant**, debout cette fois (nouveau dessin `cantower`) : on passe dessous ; on grimpe ses prises d'une tuile, qui alternent de couche (moyen, 133 ms, la bascule exigée), une lanterne au pied ;
  - **tout en haut, Roger** et une lanterne ; **dans le deuxième pot**, ouvert dans le souvenir, une trouvaille (facile) ;
  - **le défi** (difficile, 67 ms) : vers la fleur géante, un rideau du présent puis un rideau du souvenir à une tuile d'écart, jusqu'au rebord de sa trouvaille.
- **Roger** (`nanny-roger`, Agir) : on le regarde, il n'est pas pris (il ne redevient pas un souvenir à trouver) ; un cœur, **son court souvenir** (D-68) ; l'étape `nanny.bed-done` (en fin de liste) ; le passage près de lui scintille. Il reste en haut de l'arrosoir.
- **Le raccourci** : une porte près de Roger et une porte dans la maison (entre le canapé et la table basse, nouvelle arche `bedgate`), **cachées tant que Roger n'est pas retrouvé** (`hidden`, D-90) : on ne coupe pas l'îlot. Le plan prévoyait aussi un passage vers l'îlot voisin : il viendra avec cet îlot (PR 6), qui n'existe pas encore.
- **Signposting** : une **veilleuse rose** s'allume au-dessus de la porte de la sieste (nouvel objet `nap-light-bed`, à la place de la première veilleuse éteinte, D-110). Les trois autres viendront avec leurs îlots.
- **Difficulté prouvée** (tronçons `; @leg:`, D-96, D-108) : chambre — l'arrivée au-dessus de l'armoire (facile, bascule), la traversée (moyen, bascule), le défi (difficile, bascule), l'armoire (facile, bascule) ; jardin — la descente des pots (facile), l'arrosoir (moyen, bascule), le défi (difficile, bascule), le pot (facile, bascule). Impossible sans la bascule : monter la chambre, monter l'arrosoir (testé). **Jamais coincée** (graphe à deux couches de l'entrée, la maison et l'îlot). Les touffes de ronces des pots sont coupées en segments de 5 au plus (D-70, `lowPlatforms`).
- **Pendant la conception** (sonde de faisabilité temporaire, supprimée) : le défi du pilier rejoignait d'abord le dessus de l'armoire (une cloison l'en sépare) ; la traversée sautait sa première branche (un plafond bas) ; la cheminée du pilier passait de trop facile (un mur seul se grimpe) à impossible selon les ronces : la difficulté du défi est donc dans les deux rideaux du haut, la cheminée restant moyenne.
- **Debug** : histoire « l'îlot de la chambre fait, Roger retrouvé ».
- **Coût** : l'analyse de la chambre prend environ 25 s, celle du jardin 9 s (beaucoup de zones de couche) : à surveiller pour la durée de la suite de tests.
- **Sauvegarde** : aucune migration (une étape en fin de liste, quatre trouvailles neuves ; aucune lanterne ni trouvaille existante n'a bougé).

## D-113 — L'avant-dernier niveau, PR 6 : l'îlot de mémoire 2, l'école et la rue d'autrefois (la boîte à formes)

- **Plan validé** (D-107). Deuxième îlot, ouvert depuis la maison sans condition (ordre libre).
- **L'accès** : en haut de la grande bibliothèque de la maison, son passage (`passageschool`, dessiné en PR 3) est **une porte** (Agir) : le haut de la bibliothèque est au milieu de la salle, une sortie ne peut être que sur un mur. Elle mène à **l'école d'autrefois** (`nanny-school`), puis à **la rue d'autrefois** (`nanny-street`). Deux salles `; @world: strange`, sur la page « Chez la nounou », musique `strange`, **moyennes**.
- **L'idée de l'îlot** (le parapluie et la bascule) : de longs planés coupés par **des rideaux de ronces d'une seule couche, deux à deux** (l'un du présent, l'autre du souvenir, à trois tuiles d'écart) : on bascule en plein vol entre les deux. Les rideaux pendent du plafond : passer dessous fait arriver trop bas.
  - **Écart avec le plan** : le plan parlait de « barrières ». Des barrières pleines servaient de murs au saut mural (la sonde de faisabilité trouvait des chemins sans le parapluie) : ce sont des ronces, non solides.
- **L'école d'autrefois** (96 × 34) : on monte les casiers (facile) jusqu'à l'envol (une lanterne) ; premier vol jusqu'à la table du milieu (moyen, 167 ms, parapluie et bascule exigés ; une lanterne) ; second vol jusqu'à l'estrade du tableau (facile, 200 ms : à trois tuiles d'écart, la fenêtre tombe juste sur la limite ; à deux, 67 ms, trop dur pour le chemin) ; une lanterne, la sortie vers la rue. **Défi** (difficile, 67 ms) : la cheminée des deux montants au-dessus de l'estrade, puis deux rideaux à une tuile d'écart, jusqu'à l'étagère de la trouvaille (le motif du défi de la chambre, D-112). **Dans un casier**, ouvert dans le souvenir, une trouvaille (facile).
- **La rue d'autrefois** (92 × 30) : du toit de la première maison (une lanterne), on plane d'auvent en auvent ; **chaque auvent n'existe que dans une couche** (le premier dans le souvenir, le second dans le présent) : premier vol (moyen, 167 ms), second (facile, la bascule seule : faisable sans parapluie), troisième jusqu'à l'abribus (moyen, 167 ms). Tombée dans la rue : l'échafaudage ramène au toit. **Défi** (difficile, 67 ms) : derrière deux rideaux, le rebord du lampadaire et sa trouvaille.
- **La boîte à formes** (`nanny-shape-box`, Agir), sur l'abribus : on la regarde (elle reste là), **un cœur** (pas de court souvenir, D-107) ; l'étape `nanny.school-done` (en fin de liste).
- **Les raccourcis**, cachés tant que la boîte à formes n'est pas retrouvée : une porte vers la maison (une arche à l'horloge de l'école, `schoolgate`, au pied de la bibliothèque) et **une porte vers l'îlot voisin**, la chambre d'autrefois (près de son arrivée). C'est le passage vers l'îlot voisin que le plan prévoyait (D-112 l'avait reporté).
- **Signposting** : la deuxième veilleuse de la porte de la sieste s'allume, **jaune** (`nap-light-school`).
- **Dessin** : les meubles repris de l'école et de la rue (la petite table, l'abribus, les auvents, le lampadaire, l'échafaudage) gardaient leurs couleurs réelles dans un monde étrange : ils ont maintenant une version en silhouette (spec §6.2) ; aucune autre salle étrange ne les utilisait (rien ne change ailleurs).
- **Difficulté prouvée** (tronçons) : école — la montée (facile), le premier vol (moyen, parapluie et bascule), le second (facile, parapluie et bascule), le défi (difficile, bascule), le casier (facile, bascule) ; rue — premier vol (moyen, parapluie et bascule), second (facile, bascule, depuis le souvenir), troisième (moyen, parapluie et bascule), le défi (difficile, bascule). **Jamais coincée** (graphe à deux couches de l'entrée, la maison et les deux îlots).
- **Coût** : l'analyse de l'école prend environ 14 s, celle de la rue 11 s (une première école à barrières pleines prenait 46 s).
- **Debug** : histoire « les îlots de la chambre et de l'école faits ».
- **Sauvegarde** : aucune migration (une étape en fin de liste, trois trouvailles neuves ; rien d'existant n'a bougé).

## D-114 — L'avant-dernier niveau, PR 7 : l'îlot de mémoire 3, la gare et le train d'autrefois (la cuisine rose)

- **Plan validé** (D-107). Troisième îlot, ouvert depuis la maison sans condition (ordre libre).
- **L'accès** : le mur de droite de la maison (son passage `passagestation`, dessiné en PR 3) devient la sortie 6, vers **la gare d'autrefois** (`nanny-station`), puis **le train d'autrefois** (`nanny-train`). Deux salles `; @world: strange`, sur la page « Chez la nounou », musique `strange`, **moyennes**.
- **L'idée de l'îlot** (le crochet, la glissade et la bascule) : **des plafonds bas du présent**, sous lesquels on ne passe qu'en glissant, et **des caténaires d'une seule couche** (`; @cable:` aux deux bouts dans une zone, D-108).
- **La gare d'autrefois** (90 × 30) : sous la façade de la gare (présent), une fente d'une tuile qu'on ne passe qu'en glissant ; derrière, un mur du souvenir puis un mur du présent : on bascule entre les deux. La montée jusqu'au quai haut (une lanterne) est **facile** (glissade et bascule exigées). Du quai haut, on plane et le crochet attrape les caténaires, l'une du souvenir, l'autre du présent, jusqu'au quai d'arrivée (**moyen**, 100 ms, crochet et bascule exigés). Sur la voie, **le kiosque** n'existe que dans le présent : dans le souvenir, sa trouvaille est au sol (facile).
  - Pendant la conception, la façade ne descendait que de six tuiles : on la contournait par le dessus, sans glisser (la sonde l'a trouvé) ; elle monte maintenant jusqu'au plafond.
- **Le train d'autrefois** (90 × 26) : on court sur le toit des voitures, à l'arrêt.
  - **Le soufflet** : dans le présent, une fente d'une tuile (on glisse) ; dans le souvenir, un mur. Facile, la glissade exigée.
  - **Entre la deuxième et la troisième voiture**, plus haute : un rideau de ronces du souvenir, puis une caténaire du souvenir. On bascule en plein vol, puis le crochet. Facile (367 ms), crochet et bascule exigés : resserrer le rideau ne changeait pas la fenêtre ; la difficulté moyenne de l'îlot est dans la gare.
  - **Dans la première voiture**, ouverte dans le souvenir (le toit aussi), une trouvaille (facile). **Défi** (difficile, 67 ms) : derrière deux rideaux, le rebord du signal et sa trouvaille.
  - Tombée sur la voie : l'échelle du bout ramène au toit.
- **La cuisine rose** (`nanny-pink-kitchen`, Agir), sur le toit de la dernière voiture. On la regarde (elle reste là) : **un cœur**, sans souvenir jouable, trop long au milieu d'un îlot (D-107). L'étape `nanny.station-done` est ajoutée en fin de liste.
- **Les raccourcis**, cachés tant que la cuisine rose n'est pas retrouvée : une porte vers la maison (une arche à l'horloge de quai, `stationgate`, près du mur de droite) et **une porte vers l'îlot voisin**, la rue d'autrefois (sous l'abribus). **Signposting** : la troisième veilleuse de la porte de la sieste s'allume, **turquoise**.
- **Correction d'un défaut de la PR 1** : les câbles ne suivaient pas la couche à l'écran. Seuls ceux du présent étaient dessinés, même dans le souvenir. La collision, elle, était juste. Maintenant, les câbles de la couche active sont dessinés pleins, ceux de l'autre couche en fil fantôme (`ghostCableAlpha`), et ils changent à chaque bascule (et à chaque vague de l'effacement).
- **Jamais coincée** (graphe à deux couches de l'entrée, la maison et les trois îlots). Toutes les difficultés sont prouvées par les tronçons.
- **Coût** : l'analyse de la gare prend environ 30 s (la façade est une grande zone), celle du train 16 s.
- **Debug** : l'histoire « les îlots de la chambre, de l'école et de la gare faits ».
- **Sauvegarde** : aucune migration. Une étape en fin de liste, trois trouvailles neuves ; rien d'existant n'a bougé.

## D-115 — L'avant-dernier niveau, PR 8 : l'îlot de mémoire 4, la plage et le carrousel d'autrefois (le livre musical)

- **Plan validé** (D-107). Quatrième et dernier îlot, ouvert depuis la maison sans condition (ordre libre).
- **L'accès** : la trappe du plancher de la maison (son dessin `passagesea`, PR 3) est une porte (Agir). Elle mène à **la plage d'autrefois** (`nanny-beach`), puis au **carrousel d'autrefois** (`nanny-carousel`). Deux salles `; @world: strange`, sur la page « Chez la nounou », musique `strange`, **moyennes**.
- **L'idée de l'îlot** : **le présent est la marée haute, le souvenir la marée basse**. L'eau (`~`, D-97 : y tomber ramène au dernier appui) n'existe que dans le présent, par des zones `; @shift: present` ; à marée basse, on marche au fond de la baie. Ce n'est pas la marée de D-95 (pas de `; @tide:`) : ce sont les deux couches de la bascule, rien ne bouge.
- **La plage d'autrefois** (96 × 30) :
  - la dune (une lanterne), puis le ponton cassé ;
  - **l'arche de rocher** : à marée haute, son pied ferme le passage ; à marée basse, on passe dessous ;
  - derrière, **la cheminée des rochers** (saut mural) remonte au second ponton (une lanterne). Ce passage est **moyen** (133 ms, bascule et saut mural exigés) ;
  - pour rejoindre le quai, à marée haute **une flèche de rocher coupe le chemin**. On le rejoint à marée basse, en planant, ou par le fond et les rochers (facile, la bascule exigée) ;
  - **dans le corail**, ouvert à marée basse, une trouvaille ;
  - **défi** (difficile, 67 ms) : au-dessus de la dune, deux rideaux de ronces, l'étagère de la trouvaille ;
  - jamais coincée au fond : des rochers ramènent aux pontons et au quai. Sous l'eau à marée haute, ils ne servent pas.
  - **Écart avec le plan** : une caténaire devait mener au quai. Le plané suffisait sans elle (la sonde l'a trouvé), elle est retirée. Le crochet n'est pas exigé dans cet îlot ; le saut mural, le plané et la glissade restent utiles.
- **Le carrousel d'autrefois** (64 × 34) :
  - au milieu de la baie (l'eau du présent autour). On grimpe ses chevaux, qui alternent de couche, jusqu'au toit : moyen, 167 ms, la bascule exigée. Le mât central, d'abord plein, barrait le plancher ; il s'arrête maintenant au-dessus de la tête ;
  - **sous le plancher**, ouvert à marée basse, une trouvaille ;
  - **défi** (difficile, 67 ms) : deux rideaux, le rebord de la trouvaille.
- **Le livre musical** (`nanny-music-book`, Agir), sur le toit du carrousel : on le regarde (il reste là), un cœur, **son court souvenir** (D-105) ; l'étape `nanny.sea-done` (en fin de liste).
- **Les raccourcis**, cachés tant que le livre n'est pas retrouvé : une porte vers la maison (arche à la vague, `seagate`) et une **vers l'îlot voisin**, le train d'autrefois. Les quatre îlots forment ainsi une boucle de raccourcis : chambre ← rue ← train ← carrousel. **La quatrième veilleuse** s'allume, **bleue** : les quatre sont allumées une fois les îlots faits (la suite, le torchon blanc, PR 9).
- **Dessin** :
  - l'eau d'une seule couche est dessinée dans sa couche : remplissage dans le dessin des zones en tuiles (`ShiftLayerView`), habillage sinon ;
  - les vaguelettes de chaque couche (`WaterView.loadLayers`, `showLayer`) changent à la bascule ;
  - à marée basse, la limite de la marée haute se voit en contour fantôme ;
  - repris du monde étrange de la mer : la grande roue noyée, les ballons, le carrousel. PLACEHOLDER.
- **Jamais coincée** (graphe à deux couches de l'entrée, la maison et les quatre îlots). Les quatre îlots sont faisables dans n'importe quel ordre.
- **Coût** : environ 11 s d'analyse par salle.
- **Debug** : histoire « les quatre îlots faits ».
- **Sauvegarde** : aucune migration (une étape en fin de liste, quatre trouvailles neuves ; rien d'existant n'a bougé).

## D-116 — L'avant-dernier niveau, PR 9 : la chambre de la sieste et le torchon blanc

- **Plan validé** (D-107) : le torchon blanc dans le petit lit de la sieste, une fois les îlots faits ; le chemin le plus dur du niveau ; un souvenir à la fin de `STRANGE_THINGS` et un court souvenir.
- **La petite porte de la sieste** (dans la maison, sa porte 10) ouvre sur **la chambre de la sieste** (`nanny-nap`). Elle reste fermée, avec une bulle « ? », tant qu'une des quatre veilleuses est éteinte : il faut avoir fait les quatre îlots, dans n'importe quel ordre. Une fois les quatre allumées, la lumière vacille près de la porte (un présage, D-70).
  - Les numéros de porte de façade vont maintenant jusqu'à 99 : la maison avait déjà pris les numéros 1 à 9. Les sorties restent un chiffre dans la carte. Aucun effet sur la sauvegarde.
- **La chambre de la sieste** (80 × 40), **difficile** : le chemin le plus dur du niveau.
  - Trois sauts entre **deux rideaux de ronces de couches opposées**, chacun **difficile** (67 ms). Le deuxième se fait en planant. Une lanterne est posée juste avant chaque saut (testé).
  - Puis **la cheminée du montant du lit**, aux ronces en bandes de chaque couche (**moyen**, 183 ms), jusqu'au petit lit.
  - En bas, **une mare d'ombre** (de l'eau, D-97) : y tomber ramène au dernier appui, avec la peur d'un cran.
  - **Écart avec la conception initiale** : il y avait d'abord des échelles de retour dans les fosses. La sonde a montré qu'elles ouvraient des chemins sous les rideaux, sans basculer ; la mare les remplace, et la règle de D-97 évite de tout refaire à chaque chute.
- **Le torchon blanc** (Agir), dans le petit lit (nouveaux dessins `napcot` et `white-cloth`) :
  - c'est un objet de réconfort, pas un jouet : on le regarde et il reste là ;
  - il donne un souvenir du monde étrange, ajouté **à la fin** de `STRANGE_THINGS` ;
  - **son court souvenir** (`white-cloth`, à la fin de `FLASHBACKS`) : la sieste chez la nounou, Céleste toute petite couchée sur le côté dans le petit lit à barreaux, les yeux fermés, serre son torchon contre sa joue. Personne d'autre. Il est rejouable depuis le cahier ;
  - l'étape `nanny.cloth-done` est ajoutée en fin de liste.
- **La suite** : après le court souvenir, Céleste pense à Maria. **PLACEHOLDER** : l'effacement (le boss) commencera ici avec la PR 10.
- **Dessin** : la tête endormie de Céleste toute petite est maintenant commune à deux courts souvenirs (Roger et le torchon). PLACEHOLDER.
- **Debug** : histoire « le torchon blanc retrouvé ».
- **Sauvegarde** : aucune migration. Une étape, un souvenir et un court souvenir sont ajoutés en fin de liste ; rien d'existant n'a bougé ; pas de trouvaille dans cette salle.

## D-117 — L'avant-dernier niveau, PR 10 : le boss, l'effacement (la fuite, la salle de jeux)

- **Plan validé** (D-107) ; le système est celui de D-111.
- **L'entrée** : après le court souvenir du torchon blanc, la lumière vacille et tout pâlit autour du petit lit. Dans le noir, Céleste est **en bas de la cage d'escalier** (point de retour), une bulle « ? ». Nouvelle étape `nanny.erasure`. Le PLACEHOLDER de D-116 est retiré.
- **Phase 1, la fuite** (`nanny-stairs`, 34 × 60, hors carte) :
  - c'est **la géométrie du parcours d'essai 16** (D-111), prouvée par son test de rythme : la poursuite à l'allure de l'effacement (3,5 tuiles/s), les marches qui alternent (présent, souvenir, bandes) ;
  - quand l'effacement arrive sous une bande, elle blanchit, puis quitte le présent ;
  - une veilleuse en bas, au milieu et en haut ; en haut, la sortie vers la salle de jeux ;
  - **testé** : on monte en basculant (impossible sans) ; le joueur parfait n'est jamais touché (au moins 2 tuiles d'avance, du bas et du milieu) ; 50 % plus lent, il l'est.
- **Phase 2, la salle de jeux** (`nanny-playroom`, 70 × 28, hors carte, moyenne) :
  - **l'effacement est au centre** : en bas, son bassin (y tomber fait comme l'eau, D-97), et sa forme grise et pâle, sans visage (objet `erasure-figure`, PLACEHOLDER) ;
  - sous un plafond bas, quatre plateformes changent de couche par vagues annoncées (`; @erase-step:`), entre le seuil (une veilleuse), le gros cube du milieu (une veilleuse) et le coffre à jouets ;
  - **les quatre objets déjà vus sont pâlis** (un voile gris sur le vrai dessin, `*-pale`). Ils se rallument l'un après l'autre, en couleur : la boîte à formes sur le coffre, la cuisine rose sur le perchoir de gauche, Roger au-dessus du cube, le livre musical sur le perchoir de droite. **Céleste l'atteint et fait Agir** : c'est la fenêtre d'action, sans attaque (pilier 4) ;
  - chaque objet rallumé fait revenir la couleur à une partie de la salle (`color-bloom`, PLACEHOLDER). **L'effacement recule** : les annonces s'éteignent, la vague suivante attend une période entière. **Puis il accélère** : vagues × 1,25, × 1,5, × 1,75 ;
  - **au quatrième, il se dissout** : plus aucune vague, la forme grise disparaît, **la porte de la salle de jeux s'ouvre** (vers une nouvelle porte au pied de la bibliothèque de la maison, cachée avant). Nouvelles étapes `nanny.play-1` à `-3` et `nanny.erasure-gone`.
- **Données** (nouvelles directives) :
  - `; @erase-speed: <étape> <facteur>` (la plus grande qui s'applique) et `; @erase-until: <étape>` ;
  - le moteur reste pur (`EraseState.recoil`, `eraseFactor`, `eraseDissolved`). Le recul ne change aucune couche : rien n'apparaît sur Céleste.
- **Écarts avec le plan** :
  - les perchoirs des objets servaient d'abord de marchepieds qui rendaient les vagues inutiles (la sonde l'a montré). Ils sont plus hauts, au-dessus des plateformes à vagues ;
  - dans le motif de départ, les tronçons de la salle de jeux se font sans basculer (aucun n'exige la bascule). La difficulté vient du temps : les vagues obligent à basculer au bon moment. C'est prouvé par motif, pas par les tronçons ;
  - « rendre sa couleur à une partie de la salle » est une lueur chaude PLACEHOLDER ; la salle elle-même reste en silhouettes ;
  - la salle de jeux « rendue à ses couleurs » et Eden viendront avec la PR 11.
- **Tests** (`nannyBoss.test.ts`) :
  - la fuite : on y monte en basculant ; son rythme ;
  - **dans chacun des quatre motifs des vagues**, chaque objet est atteint depuis le seuil, et on n'est jamais coincée ;
  - **chaque vague est annoncée assez tôt** : l'annonce ne raccourcit pas quand les vagues accélèrent, seule leur période raccourcit ;
  - l'ordre des objets, le recul et l'accélération, la dissolution, la porte.
- **Debug** : les histoires « l'effacement, la cage d'escalier » et « l'effacement dissous ».
- **Sauvegarde** : aucune migration. Cinq étapes sont ajoutées en fin de liste. La couche et l'état de l'effacement ne sont jamais sauvegardés : à la réapparition, il repart du départ ; les objets déjà rallumés restent rallumés (étapes).

## D-118 — L'avant-dernier niveau, PR 11 : Eden et son souvenir jouable

- **Plan validé** (D-107). Le système des souvenirs jouables est celui de D-89.
- **Eden dans le jeu** : dans la salle de jeux, une fois l'effacement dissous (« rendue à ses couleurs » : les lueurs chaudes de D-117, PLACEHOLDER), un petit garçon est assis sur le gros cube, près d'une tour de quatre cubes. C'est un vrai petit garçon, tout petit comme dans le souvenir : ni objet, ni fantôme, ni créature. Il ne bouge pas à l'écran. Agir :
  - le souvenir de la tour de cubes est ajouté au cahier, à la fin de « Monde étrange » (`eden-tower`) : on y rejoue le souvenir ;
  - Céleste le reconnaît (un cœur), puis le noir et **le souvenir jouable**. Quand la lumière revient, Eden n'est plus là ; sa tour reste. L'étape `nanny.eden` est ajoutée en fin de liste.
- **Le souvenir d'Eden** (`memory-eden`, `; @world: memory`), chez la nounou, quand ils étaient tout petits. Il est plus long que celui de la cuisine (7 actions contre 3), sans texte :
  - **la tour de cubes à deux** : Céleste prend un cube dans le tas, le pose sur la tour, en prend un autre, le pose ; dans le noir d'un clignement, Eden a posé le sien (la tour passe de un à quatre cubes) ;
  - **un cache-cache simple** : Céleste touche Eden. Dans le noir, il se cache derrière le pouf, et sa tête dépasse ; Céleste le trouve. Dans le noir, il passe derrière le coffre à jouets ; trouvé, il rit ;
  - **la nounou** est présente : une silhouette bienveillante dans son fauteuil, qui regarde, sans visage net ni texte (PLACEHOLDER) ;
  - **à la fin**, un cœur ; dans le noir, **Eden n'est plus là ; Céleste reste seule** ;
  - Maria n'y est pas (pilier 5), ni aucun parent.
- **Le moteur des souvenirs jouables** a deux ajouts, tous deux optionnels (la cuisine est inchangée, testé) :
  - `blink` : après le geste, un clignement dans le noir ; l'étape de l'action ne vient qu'au noir. C'est ainsi que les personnages changent de place, jamais à l'écran (testé : Eden ne change de place ou de pose que pendant un clignement) ;
  - `alone` : la fin peut garder Céleste, seule, et poser une étape dans le noir (« Eden n'est plus là »).
  - L'objet porté peut être un cube (`carried`).
- **Dessins** (PLACEHOLDER) : Eden tout petit (cheveux courts et bruns, pull jaune, salopette bleue), assis, caché, riant ; la nounou en silhouette ; les cubes (le tas, la tour) ; la tour de cubes du cahier.
- **La suite** : après Eden, Céleste pense à Maria. **PLACEHOLDER** : le réveil viendra avec la PR 12.
- **Debug** : le bouton « Jouer le souvenir d'Eden » et l'histoire « Eden, le souvenir joué ».
- **Sauvegarde** : aucune migration. Une étape et un souvenir sont ajoutés en fin de liste ; les étapes du souvenir (`memory.eden-*`) ne sont jamais sauvegardées (D-89).

## D-119 — L'avant-dernier niveau, PR 12 : le réveil, le train du retour, la phase 4 (fin du niveau 7)

- **Plan validé** (D-107). **Le niveau 7 est complet.**
- **Après Eden**, dans le même script et toujours dans le noir :
  - le cercle se referme sur la salle de jeux, Céleste pense à Maria ;
  - **le réveil au dortoir de la classe de mer, à l'aube** (point de retour) : assise sur sa couchette, un cœur, puis Maria ;
  - **le train du retour**, une courte scène sans commande : la voiture-couchettes roule, la mer défile à la fenêtre. Céleste est assise, seule dans la voiture : la classe n'est pas montrée, ce qui est un écart, PLACEHOLDER. Une bulle « train » ;
  - **quelques mois plus tard** (comme D-43 et D-69) : le noir le plus long, puis Céleste chez elle, dans sa chambre (point de retour). Elle a encore grandi (**phase 4**), la toise a un quatrième trait, et une bulle « Maria qui manque ».
- **La suite, le niveau 8 (le monde de Maria)**, reste un **PLACEHOLDER** : une bulle « ? », et rien d'autre n'est inventé (§45). Ni Maria ni parents à l'écran (testé).
- Nouvelles étapes, en fin de liste : `nanny.wake` (le jour revient, `morning`, à partir de là) et `growth.4`. Le train roule le temps de la scène (`moving`).
- **La phase 4** :
  - **écart avec la proposition** (hitbox 12 × 30) : un seul px de plus (29) fait passer deux sauts de la chaîne de planches sous le toit du grenier sous la fenêtre du facile (217 → 192 ms), ce qui fermait la trouvaille du grenier. La **hitbox reste donc celle de la phase 3 (12 × 28)** ;
  - Céleste grandit **à l'écran** : corps × 1,5, cheveux × 1,6 ;
  - **course × 1,08** (phase 3 : × 1,06), saut × 1,2 inchangé ;
  - allure PLACEHOLDER : une queue de cheval plus longue, la même veste. **Signalé** (pilier 7) : l'influence de la croissance est cette fois surtout visuelle ;
  - **testé** : rien d'atteignable en phase 3 ne se ferme en phase 4, sur le graphe de toute la zone (salles réelles, escalade, saut mural, parapluie, crochet, aux fenêtres de difficulté de chaque salle).
- **Debug** : histoire « quelques mois plus tard, phase 4 ».
- **Vérifié dans Chromium** : d'Eden au dortoir de jour, le train qui roule devant la mer, la chambre et la bulle « ? ».
- **Sauvegarde** : aucune migration (deux étapes en fin de liste ; la phase se déduit des étapes, D-43).

## D-120 — Les boss ne reculent jamais (poursuites)

- **Demande de l'utilisateur** (après essai du boss de la tour et de la vague) : « parfois ils reviennent en arrière » ; les boss sont des épreuves, ils doivent avancer sans retour en arrière jusqu'à la fin et s'y arrêter, la difficulté venant seulement de leur vitesse.
- **Le front ne recule plus jamais en jeu** (`src/core/boss/Chase.ts`) ; seule une réapparition à une veilleuse le replace derrière Céleste (comme avant). Quatre reculs supprimés :
  - **le toucher** : il s'arrête un instant (`chaseContactPauseMs`) sans reculer ; avant, il reculait de 3 tuiles, et **redescendait jusqu'à Céleste si elle était tombée plus bas** (la cause la plus visible du « retour en arrière »). Tombée dans la masse, elle est repoussée vers le haut (ou en avant) et la peur monte : au bout de trois contacts, la veilleuse. `chaseContactRecoilTiles` est retiré ;
  - **le croc-en-jambe** : il trébuche et s'arrête (`chaseTripPauseMs`), sans reculer. `; @chase-trip: col ligne l h` perd son cinquième nombre (le recul) ;
  - **le reflux de la vague** (D-103) : elle reste sur place pendant `backwashMs` au lieu de reculer (la crête se retire toujours à l'image). `backwashSpeed` est retiré ;
  - **la fin** : la ligne d'arrivée franchie, il ne redescend plus ; il finit sa course jusqu'à la ligne d'arrivée (à la vitesse de la dernière phase), au plus près à une tuile derrière Céleste, et s'immobilise. Ni contact ni rattrapage après la fin. Pour la tour, il s'arrête sous la dernière plateforme ; pour la vague, contre la digue.
- **Vitesses** : la tour (2,8 tuiles/s) et le train de la vaisselle (7) passent tels quels leurs tests de rythme (le joueur parfait devance le boss de plus de 2 tuiles depuis chaque veilleuse ; un joueur 50 % plus lent est rattrapé). **La vague de la station balnéaire passe de 13 à 12,5 tuiles/s** : à 13, sans le recul du reflux, la marge du dernier tronçon tombait à 1,2 tuile ; à 12,5 elle est de 2,8 à 3,6 tuiles par tronçon, et un joueur 50 % plus lent est rattrapé sur chaque tronçon. Le parcours d'essai 14 garde 13.
- **Non concerné** : l'effacement de la salle de jeux (D-117) qui « recule » après chaque objet rallumé (une récompense, pas une poursuite) ; la cage d'escalier (une poursuite) suit la nouvelle règle.
- **Sauvegarde** : aucune migration.

## D-121 — Les disques et le tourne-disque du grenier (easter egg), PR 1 : le système et le premier morceau

- **Demande de l'utilisateur** : un tourne-disque au grenier, vide au départ ; des disques trouvés au fil de l'aventure ; de retour au grenier, on choisit un disque à écouter. Plan validé en 3 PR (1 : le système et le morceau ; 2 : le tourne-disque ; 3 : le disque aux objets trouvés).
- **Choix validés** :
  - **trois disques, inédits et secrets** (ni onglet dans le cahier ni compteur) : le premier au jardin ou au quartier (choisi quand sa musique existera), **« Les Aventures de Céleste »** au bureau des objets trouvés de la gare (niveau 4 : un disque perdu parmi les choses perdues, Roger juste au-dessus dans la tour), le troisième chez la nounou (niveau 7), dans le souvenir, près de son tourne-disque d'autrefois, idéalement une berceuse. **Un disque sans fichier est caché** (ni pochette ni objet) ;
  - le tourne-disque est au grenier dès le début ; sans disque, Agir montre un petit signe sans texte ; avec des disques, des pochettes (une vide en pointillés par disque qui a une musique mais n'est pas trouvé) et une pochette « arrêter » ;
  - **un disque joue une fois en entier, où que soit Céleste**, à la place des thèmes ; à sa fin (ou arrêté), le thème de la salle revient en fondu. Recharger la page ou revenir à l'accueil l'arrête (la lecture n'est pas sauvegardée).
- **Les jingles par-dessus la musique** (demande de l'utilisateur, pour les disques comme pour les thèmes) : `found` et `memory` ne baissent plus la musique (`jingleDuck` retiré, 0,8 avant, D-94). **Seule l'apparition de Maria la baisse** : `hushWithJingle` passe de 1 à 0,8 (avant, la baisse venait de `jingleDuck`, Maria étant un jingle comme les autres), le temps du silence de l'histoire, puis la musique revient. Sans fichier `maria`, le silence de D-57 est inchangé. La pause baisse toujours la musique.
- **Mise en œuvre** :
  - `src/config/records.ts` : `RECORDS` (identifiant, couleur de pochette PLACEHOLDER), dans l'ordre des pochettes ; `early` et `lullaby` sont des PLACEHOLDERS sans musique (leur identifiant peut changer tant qu'ils ne sont pas placés) ;
  - le fichier d'un disque est `record-<id>` dans `src/assets/audio/` ; le même nom sert d'identifiant dans les **souvenirs de la sauvegarde** (comme les affaires de Maria, D-58) : **aucune migration** ;
  - `AudioMix` : un disque (`playRecord`, `stopRecord`, `recordEnded`) passe avant le thème ; il arrive et s'éteint en `recordFadeMs` (600 ms, on l'entend presque dès le début), le thème part et revient en `crossfadeMs`. Un disque en remplace un autre ; la fin du premier ne coupe pas le second ;
  - le lecteur : un seul lecteur par disque, sans boucle ; à la fin, ou si le fichier est illisible ou la lecture refusée, le thème revient. Rejouer le disque en cours le relance du début ;
  - `src/core/audio/records.ts` : les pochettes (`recordShelf`) et « au moins un disque à jouer » (`canPlayRecords`), pures, pour la PR 2.
- **Le morceau** : `record-adventures.m4a`, préparé par `audio:prepare` (Suno, 3 min 17 → 3 min 15 sans le silence de la fin, −14,3 → −18 LUFS, 2,3 Mo). Morceau gardé tel quel.
- **Poids de la musique** : la limite passe de 25 à **32 Mo** (9,4 Mo pris) pour trois disques et les quatre thèmes encore attendus ; seul le premier chargement s'allonge.
- **Vérifié dans Chromium** (copie Opus du morceau, ce Chromium ne lit pas l'AAC) : le disque à la place du thème, la salle qui change pendant le disque, la fin et le retour du thème, la relance, l'arrêt ; un fichier illisible laisse le thème.
- **Rien dans le jeu pour l'instant** : le tourne-disque vient avec la PR 2, le disque avec la PR 3.

### D-121, PR 2 : le tourne-disque au grenier

- **Le tourne-disque** (`record-player`, objet de mise en scène dessiné par le code, PLACEHOLDER) : une valise rose ancien, le couvercle ouvert, le plateau vide, le bras levé, **posé sur la malle du grenier** (colonne 11). Toujours là, dès le début. La géométrie du grenier ne change pas (la phase 4 passe toujours).
- **Agir** (déclencheur rejouable `record-player`, nouvelle étape `records`) depuis la malle ou le plancher de part et d'autre (colonnes 7 à 15) :
  - **sans disque trouvé**, une bulle sans texte : le tourne-disque au plateau vide et un petit « ? » (`record`) ;
  - **avec un disque**, le choix (`RecordPicker`, en DOM) : une rangée de pochettes sans texte, une par disque qui a une musique ; trouvée, elle porte son disque (qui tourne s'il joue) ; pas encore trouvée, elle est vide, en pointillés ; un carré « arrêter » seulement si un disque joue. Toucher une pochette joue son disque et referme ; toucher à côté, Pause ou Carte referment.
  - **Clavier et manette** : gauche et droite (un pas par poussée, en faisant le tour), Agir, Action ou Saut pour choisir. Le choix s'ouvre sur le disque qui joue.
- **Écart avec le plan** (« Céleste reste libre ») : **le jeu s'arrête pendant le choix**, comme la carte ; sinon les flèches déplaceraient Céleste en même temps que la sélection. Elle repart dès le disque choisi, et le disque continue où qu'elle aille.
- **Debug** (Histoire) : « Débloquer les disques » (sauvegardé), « Jouer le disque … », « Arrêter le disque ».
- **Tests** (`records.test.ts`) : les choix, le tour au clavier, le tourne-disque posé sur la malle, Agir depuis la malle et les deux côtés du plancher, rien plus loin ; `storyProblems` accepte l'étape `records` dans un déclencheur rejouable.
- **Vérifié dans Chromium** : la bulle sans disque, les pochettes, le choix au clavier, au toucher (`?touch`), la pochette qui tourne, l'arrêt.
- **Sauvegarde** : rien de nouveau (les disques trouvés sont dans les souvenirs depuis la PR 1).

### D-121, PR 3 : le disque aux objets trouvés de la gare

- **« Les Aventures de Céleste »** (`record-adventures`, objet de mise en scène : un disque dans sa pochette rose, debout), **sur une étagère à chapeaux tout en haut du mur de gauche** du bureau des objets trouvés (`station-lost`, une planche traversable de deux tuiles, colonnes 1 et 2, ligne 12, `hatshelf`). Un disque perdu parmi les choses perdues ; Roger est juste au-dessus, dans la tour du monde étrange.
- **Le chemin** : depuis le haut de l'armoire (là où l'on trouve le crochet), ou l'étagère la plus haute, **un long plané au-dessus de la salle** jusqu'au mur de gauche. **Moyen exactement** (passage le plus dur : 128 ms depuis l'étagère haute), jamais facile ; on en redescend sans peine. Testé. On l'aperçoit depuis le sol, au-dessus du comptoir.
- **Agir** (`take-record-adventures`) : l'étape `record.adventures` (nouvelle, en fin de liste), le disque rangé dans les souvenirs de la sauvegarde (`record-adventures`), le jingle `found` (une trouvaille), une bulle « musique ». Le disque quitte la salle.
- `storyProblems` accepte un disque comme souvenir.
- **Écarts avec le plan** : pas d'entrée nouvelle dans DEBUG → Histoire (« Débloquer les disques », PR 2, suffit pour essayer le tourne-disque) ; difficulté choisie : moyenne (une étagère plus haute, ligne 10, aurait été difficile exactement).
- **Tests** : `records.test.ts` (l'objet, Agir, la difficulté exacte, le retour au sol) ; les tests de la gare (crochet moyen exactement, trouvailles, jamais coincée) restent verts.
- **Vérifié dans Chromium** : l'étagère et le disque au mur de gauche.
- **Sauvegarde** : aucune migration (une étape en fin de liste ; le disque dans les souvenirs).

## D-122 — Le niveau 7 plus lisible : les quatre cubes de la tour d'Eden, le souvenir d'Eden retravaillé

- **Retour d'essai de l'utilisateur** : le niveau 7 fonctionne, mais se comprend mal. Le système des quatre souvenirs à retrouver doit être plus clair ; il ne faut pas réactiver les anciens souvenirs (Roger, la boîte à formes) ; le souvenir jouable (la tour, le cache-cache) se comprend mal ; Eden est blond, avec une coupe au bol.
- **Choix validés** : des **cubes de couleur sans lettres** à la place des **quatre** objets déjà vus (la cuisine rose et le livre musical aussi, pour que le système soit le même partout). Pour le reste (la tour qui tombe, le compte du cache-cache, la tenue d'Eden), les propositions ont été appliquées telles quelles, faute de réponse contraire. **Changement de progression, signalé et accepté.**
- **Les quatre cubes de la tour d'Eden** (`TOWER_CUBES` dans `src/config/story.ts`, `ISLET_CUBES` dans `src/levels/nanny/story.ts`) : un par îlot, dans l'ordre des îlots, **rose** (rond), **jaune** (triangle), **turquoise** (losange), **bleu** (étoile). Ce sont les mêmes cubes partout : dans l'îlot, sur la porte de la sieste, sur la carte, dans la salle de jeux, dans le souvenir. PLACEHOLDER pour les couleurs et les formes.
  - **Dans l'îlot**, à la place de l'objet, au même endroit et avec la même étape (`nanny.bed-done`…) : un cube plus gros que ceux de la tour, avec la lueur turquoise du monde étrange. Agir : un cœur, **le cube est pris** (il quitte l'îlot), puis **une bulle montre les quatre cubes** : ceux déjà trouvés pleins, les autres en creux pointillés (`cubes`, une texture par combinaison). Les passages vers la maison et l'îlot voisin s'ouvrent comme avant. **Plus aucun court souvenir rejoué** (Roger, le livre musical).
  - **La porte de la sieste** : les quatre veilleuses éteintes deviennent **quatre creux en forme de cube** ; chaque cube trouvé y prend sa place (`nap-cube-*`).
  - **À la première arrivée dans la maison** : après le « ? », **la vue glisse jusqu'à la porte de la sieste** et ses quatre creux, qui scintillent, puis revient sur Céleste ; la bulle des cubes (tous en creux) montre le but. C'est une nouvelle étape d'histoire, **`look`** (la vue va vers une tuile, puis revient sans tuile ; `CameraController.focus`/`release`, glissement `STORY_LOOK_TIME_MS` de 420 ms, PROVISOIRE). La vue revient toujours à la fin d'un script ou en changeant de salle.
  - **La carte** « Chez la nounou » : un petit carré de la couleur du cube, là où il a été trouvé.
- **La salle de jeux** : les quatre objets pâlis deviennent **les quatre cubes pâlis**, aux mêmes places et dans le même ordre (mêmes étapes `nanny.play-*`). Touché, un cube rallumé **rejoint la tour d'Eden** sur le gros cube (un scintillement), qui monte de un à quatre cubes ; au quatrième, l'effacement se dissout et Eden est assis à côté de sa tour complète.
- **Le souvenir d'Eden** (`memory-eden`), sans texte, en deux jeux :
  - **la tour, chacun son tour** : Céleste prend un cube dans le tas et le pose (on voit la tour à un cube) ; dans le noir d'un clignement, Eden a posé le sien (deux cubes, il lève les bras) ; elle pose le troisième ; dans le noir, Eden a posé le quatrième, **la tour est tombée et il rit**. Les cubes sont ceux des îlots ;
  - **le cache-cache** : Céleste **se cache les yeux et compte** (nouveau geste `count` ; le noir tient trois battements qui respirent, `beats`, `beatMs` 650 ms) ; Eden n'est plus là, sa tête dépasse du pouf ; trouvé, il rit, debout à côté. Elle compte encore : il est derrière le coffre à jouets, et **la nounou tourne la tête et tend la main vers lui** (`nanny-look`) ; trouvé, il rit. **L'étincelle d'aide n'apparaît qu'après 4 s** (`markDelayMs`) : on cherche d'abord seule ;
  - la fin ne change pas : un cœur, puis Eden n'est plus là, Céleste reste seule. 8 actions au lieu de 7.
  - Le moteur des souvenirs jouables reçoit trois ajouts optionnels (la cuisine est inchangée) : `shows` (une étape posée au geste, à l'écran, avant celle du clignement), `beats` et `markDelayMs`. Eden ne change toujours de place ou de pose que dans le noir (testé).
- **Eden** : **blond, coupe au bol** (nouvelle coiffure `bowl`), peau claire ; le pull jaune et la salopette bleue restent. PLACEHOLDER.
- **Sauvegarde** : aucune migration. Les étapes ne changent pas ; le court souvenir de Roger et celui du livre musical restent dans le cahier (trouvés aux niveaux 4 et 6). Les étapes du souvenir d'Eden ne sont jamais sauvegardées.
- **Tests** : les îlots (le cube pris, la bulle après l'étape, aucun court souvenir, le cube dans son creux), la maison (le regard vers la porte, la bulle après le retour de la vue, `towerCubesMask`), la salle de jeux (la tour qui monte), le souvenir (la tour chacun son tour, le compte, l'étincelle qui attend, la nounou qui regarde), la caméra (le regard et son retour), la carte (les cubes).
- **Vérifié dans Chromium** : les creux et les cubes sur la porte, les cubes dans les îlots, les cubes pâlis de la salle de jeux, Eden blond près de sa tour, les états du souvenir (la tour, la tour tombée, les cachettes, Eden qui lève les bras, le geste du compte).

## D-123 — Les personnages illustrés : papa d'abord

- **Demande de l'utilisateur** : les personnages en jeu (formes géométriques) ne sont pas jolis à côté de l'illustration du menu. **Choix validés** : les illustrations sont générées par l'utilisateur avec ChatGPT, d'après des prompts fournis (`docs/PROMPTS_PERSONNAGES.md`) ; Céleste reste en papier découpé (pièces illustrées, à venir) ; Maria inchangée ; vue de la caméra inchangée ; papa et maman d'abord, Céleste ensuite.
- **Ce qui change par rapport à D-53** : l'argument « à ~125 px seuls la coiffure et les couleurs se lisent » ne tient plus depuis le rendu à la résolution de l'écran par défaut (D-93) : un parent fait environ 400 pixels réels sur téléphone.
- **Mise en œuvre** : `CHARACTER_IMAGES` (`src/config/art.ts`) associe une pose à une image de `public/art/` et à l'axe de ses pieds ; l'image remplit la hauteur du personnage (`PROP_SIZE`, inchangée), les pieds au milieu du cadre comme le corps dessiné. Une image peut servir à plusieurs poses. Les poses sans image restent dessinées par le code. Le petit mouvement en boucle se réduit à la vapeur de la tasse (dessinée par le code, plus fine).
- **Papa** : `dad-door` (la main tendue, aussi pour `dad-hall`), `dad-kitchen` (la tasse), `dad-shop` (le panier). Restent dessinés par le code : `dad-garden`, `dad-quay` (images à venir).
- **Détourage** : `scripts/art-cutout.py` (Python, outil ponctuel hors du jeu) : fond blanc relié aux bords, blancs enfermés désignés (`--seed`, entre les jambes), liseré clair autour des cheveux grignoté, poches claires entre les mèches retirées sauf celles à garder (`--keep`, des dents contre le profil) ; recadré, 900 px de haut (~250 Ko).
- À juger sur téléphone : papa illustré la nuit dans la chambre (plus clair que la pièce : faut-il l'assombrir selon la lumière de la salle ?) ; le décalage de style avec Céleste encore dessinée par le code.

## D-124 — Sensations, son, aide et mondes étranges : plan validé ; chantier A, PR 1 : le compteur de saccades

- **Contexte** : analyse du jeu demandée par l'utilisateur (hors dernier niveau, personnages et trouvailles, chantiers en cours). Constats : aucun bruitage ; écrasement, inclinaison, poussière et saut adouci codés mais éteints, jamais essayés sur téléphone ; dessin d'un bloc de décor en pleine course d'environ 160 ms (fond) et 50 ms (lumière) sur le fil principal (Chromium du conteneur, processeur d'ordinateur, sans GPU) ; mondes étranges tous semblables (même violet, même papier peint, bords d'un pixel).
- **Plan validé, quatre chantiers dans cet ordre** (une branche chacun) :
  - **A, fluidité et sensations** : A1 le compteur de saccades ; A2 les sensations existantes (interrupteur « actuelles / proposées », poussière en papier selon la matière du sol, saut adouci) ; A3, seulement si A1 montre des saccades sur téléphone, le dessin des blocs dans un Web Worker (OffscreenCanvas).
  - **B, bruitages et vibrations** : Web Audio, un emplacement par son (silencieux sans fichier), variantes, volume séparé, pas selon la matière du sol, écho et filtre dans le monde étrange, sons de test dans le build de debug ; voix de Céleste en emplacements facultatifs ; vibrations Android avec réglage. **Pas d'ambiances pour l'instant.** Les sons sont fournis par l'utilisateur.
  - **C, le fil discret** : après un temps sans progrès, une lueur mène vers la suite (jamais vers une trouvaille, un disque ou Maria). **Activé par défaut**, désactivable dans le menu. Lueur du monde étrange **mêlée d'une autre couleur ou d'une forme à elle**, pour ne la confondre ni avec les scintillements du monde étrange, ni avec l'étincelle d'Agir, ni avec les trouvailles (maquette avant de choisir).
  - **D, mondes étranges** : chaque lieu reconnaissable (couleur et motif tirés du lieu réel, dessus de plateformes plus lisibles, halo autour de Céleste) ; maquettes sur la gare étrange, puis propagation, le niveau 7 en dernier.
- **Écartés par l'utilisateur** : la taille de Céleste à l'écran ne change pas (pas de zoom). Les allers-retours (voyage rapide) feront l'objet d'un chantier à part, à penser avec l'histoire et les trouvailles.
- **Cohabitation avec le chantier des personnages** (D-123, en cours) : pas de modification de la marionnette, de `familyArt`, de `StoryView` ni de `CHARACTER_IMAGES` ; code nouveau dans des fichiers nouveaux, accroches courtes dans `GameScene` ; `main` fusionné avant chaque PR ; numéros de décision repris au moment de la fusion si besoin. L'éclairage des personnages selon la salle attendra la fin de ce chantier.
- **A1, le compteur de saccades** (build de debug seulement) :
  - `HitchMonitor` (`src/core/perf/hitchMonitor.ts`, pur, testé) : chaque écart entre deux images d'au moins `HITCH.hitchMs` (25 ms ; grosse saccade dès 50 ms) est attribué au travail de l'image précédente : **décor** (dessin des blocs d'habillage), **salle** (chargement), **jeu** (reste de la mise à jour) ou **rendu** (rien de mesuré : rendu, ramasse-miettes, navigateur) ;
  - ignorés : l'écart qui suit une pause, la carte ou le choix d'un disque, et ceux de plus d'une seconde (onglet masqué) ; comptés à part : ceux qui suivent un écran noir (fondu), invisibles ;
  - `GameScene` mesure le dessin des blocs et `setRoom` (`frameStats`), l'overlay mesure la mise à jour entière (entre `PRE_UPDATE` et `POST_UPDATE`) ; le `Hud` dit si l'écran est noir ;
  - affichage : une ligne dans INFOS (nombre, grosses, dans le noir, la pire avec sa cause et sa salle), une section « Saccades » dans DEBUG (les 8 dernières, la position de Céleste, « Remettre à zéro »), et les saccades dans l'export JSON ;
  - réglages dans `src/config/perf.ts`, PROVISOIRES.
- **Sauvegarde** : aucun changement.

## D-125 — Chantier A, PR 2 : les sensations proposées, la poussière en papier, la matière du sol

- **Interrupteur « Sensations proposées »** (DEBUG, build de debug) : active d'un coup l'écrasement et l'étirement, l'inclinaison en course (`squashEnabled`), la poussière (`dustEnabled`) et le **saut adouci** (`jumpReleaseMode` = 1 : gravité × `releaseGravityMultiplier` au relâchement au lieu de la coupure, D-19). Conservé comme les autres réglages de l'overlay ; « Valeurs par défaut » l'éteint. **Les valeurs par défaut du jeu ne changent pas** : elles ne passeront à la version proposée qu'après l'essai sur téléphone (le saut adouci modifie le mouvement, pilier 1 ; D-19 montre qu'il ne change aucun parcours, à revérifier par les tests le jour où il devient le défaut).
- **Matière du sol** (`src/core/level/surface.ts`, pur, testé ; données `src/config/surfaces.ts`) : bois, tissu, herbe, pierre, sable, métal, feuillage. Lue sous les pieds (le milieu, sinon l'un des bords) : d'abord le dernier meuble déclaré qui couvre la tuile et dont la matière est connue (`DECOR_SURFACE` : les meubles qui ne sont pas en bois), puis le matériau de la tuile (`b` bois, `t` tissu, `v` feuillage, planche traversable en bois), puis **le sol de la salle** (`ROOM_GROUND`, une entrée par salle de zone, d'après le dessin : herbe au jardin, pavés en ville, parquet dans les maisons, sable à la plage…). Un test exige une entrée pour chaque salle de zone (le niveau 8 devra déclarer les siennes). Servira aussi aux bruits de pas (chantier B).
- **Poussière en papier** (`DustPool`) : grains dessinés une fois en blanc puis teintés, sans rotation à l'affichage (D-73) : copeaux (bois), petits nuages (tissu, pierre, métal), brins (herbe), grains (sable), petites feuilles (feuillage) ; dans le monde étrange, les couleurs du monde étrange (turquoise, violet). Les grains retombent et se posent au sol, les nuages montent un peu en grossissant ; ils partent du bord des pieds. Plus de grains à une réception après une grande chute (`PlayerFeel.landingSpeed`). 16 images réutilisées (au lieu de 8), aucune création en jeu. L'éclat d'un ennemi dispersé devient des bouts de papier, les gouttes d'un éclaboussement retombent. Réglages : `DUST_LOOK`, `STRANGE_DUST_COLORS`, `DUST_LAND_COUNT` (`src/config/feel.ts`), PROVISOIRES.
- **Rien ne touche à la collision** ; la marionnette (chantier des personnages) n'est pas modifiée : l'écrasement et l'inclinaison s'appliquent à Céleste entière et vaudront aussi pour ses pièces illustrées.
- **Sauvegarde** : aucun changement.

## D-126 — Chantier B, PR 1 : les bruitages (le système, les premiers sons)

- **Décisions de l'utilisateur** : les sons sont fournis par l'utilisateur ; la voix de Céleste est prévue en emplacements facultatifs ; **pas d'ambiances pour l'instant** ; les bruitages restent des PLACEHOLDERS tant qu'ils ne sont pas fournis (§45).
- **Lecteur** (`src/platform/sfxPlayer.ts`, tenu par `AudioPlayer`) : **Web Audio** (latence faible, plusieurs sons à la fois ; la musique garde ses lecteurs `<audio>`). Contexte créé au premier geste, sons décodés une fois, suspendu quand l'appli passe en arrière-plan. Chaque lecture tire une **variante** (jamais deux fois de suite la même, `pickVariant`) et varie la hauteur de ± 6 % ; un même emplacement ne se rejoue pas avant 60 ms ; 8 voix au plus. **Monde étrange** : les mêmes sons passent par un passe-bas et un écho (aucun fichier en plus).
- **Fichiers** : `src/assets/sfx/<emplacement>[-N].{ogg,opus,m4a,mp3}` (`sfxFileMap`, testé) ; un emplacement sans fichier reste silencieux. Préparation : `npm run audio:prepare -- --sfx` (silences coupés, mono, même crête −4 dBFS, AAC 80 kbit/s). Budget : `SFX_BUDGET_BYTES` (4 Mo), testé. Liste des sons à fournir : `docs/BRUITAGES.md`.
- **Sons de test** (build de debug, DEBUG → « Sons de test ») : un emplacement sans fichier joue un court glissando synthétisé, différent pour chacun, pour vérifier au téléphone que chaque son tombe au bon moment avant d'avoir les fichiers.
- **Volume des bruitages** : nouveau réglage `sfxVolume` (menu pause → Son → Bruitages), sous le volume général et la coupure ; complété par défaut à la lecture d'une sauvegarde plus ancienne, **sans migration**.
- **Premiers branchements** (`SfxDirector`, pur, testé) :
  - **les pas** suivent la foulée de la marionnette (un pied posé à chaque demi-foulée, `CelestePoser.runPhase`), selon la **matière du sol** (D-125), plus doux en marchant lentement ;
  - **le saut** au décollage ; **la réception** : le pas de la matière, plus `land` (chute d'une tuile ou plus) ou `land-big` (6 tuiles ou plus). La hauteur de chute (`PlayerFeel.fallHeight`) remplace la vitesse de réception de D-125 : un saut ordinaire retombe déjà à la vitesse maximale ;
  - **touchée** (piqûre, coup, poursuivant), **chute dans l'eau**, **veilleuse allumée**, **carte** ouverte et refermée ;
  - aussi pendant les souvenirs jouables.
- **Correction de D-125** : la matière du sol de la première salle d'une partie (reprise sans changement de salle) n'était pas lue.
- **Rien ne touche à la physique** (pilier 1). **Sauvegarde** : un réglage de plus, sans migration.
- **Vérifié dans Chromium** : les sons demandés au bon moment (pas sur l'herbe, saut, réception, veilleuse, carte), la lecture et l'écho. Le Chromium du conteneur ne décode pas l'AAC (`.m4a`) ; Chrome sur Android, si (comme pour la musique).

## D-127 — Chantier B, PR 2 : les sons des capacités, du combat, des dangers, la voix

- **Capacités** (`SfxDirector`, pur, testé) : le rebord attrapé, le hissage, le saut mural, le parapluie ouvert et refermé (pas de fermeture quand le crochet attrape un câble : son propre son), le crochet, la glissade ; **deux boucles** : contre un mur, le long d'un câble (fondu d'entrée et de sortie, `SfxPlayer.loop`).
- **Les sauts** sont lus dans `PlayerPhysics.jumpKind` (nouveau, ne pilote rien : depuis le sol, mural, depuis un câble), à la place du décollage de `PlayerFeel` : **un saut en coyote time**, qui part après avoir quitté le sol, a maintenant son son (il n'en avait pas en D-126) ; une traversée par Bas + Saut n'en a pas.
- **Combat** : le début du coup de bâton, le bâton qui touche, l'ennemi dispersé, Céleste touchée.
- **Dangers et poursuites** : le réveil du poursuivant, son grondement en boucle tant qu'il avance ; l'annonce et le passage des trains en gare, le tunnel sur le toit du train, l'annonce de la vague (`PhaseWatch`, pur, testé : aucun son au premier moment observé en entrant dans une salle) ; l'annonce de l'effacement.
- **Monde** : la porte de façade, la bulle de pensée.
- **La voix de Céleste** (facultative, jamais de mots) : un « hop » un saut sur quatre, un effort une fois sur deux (hissage, saut mural), un souffle surpris quand elle est touchée, une surprise au réveil d'un poursuivant, une joie avec la trouvaille ou la capacité trouvée (`VOICE_EVERY`).
- Les boucles s'arrêtent à la pause, sur la carte, devant le tourne-disque et au changement de salle.
- **Écartés pour l'instant** : la marée (elle change dans le noir), le balayage du train de la vaisselle et les valises, les boutons du menu.
- **Rien ne touche à la physique** : `jumpKind` est écrit, jamais lu par la simulation. **Sauvegarde** : aucun changement.

## D-128 — Chantier B, PR 3 : les vibrations (Android)

- **Vibrations** (`src/platform/haptics.ts`, `navigator.vibrate` : Chrome sur Android ; l'iPhone n'a pas d'API fiable, rien n'y vibre) : un court motif à quelques **moments forts** seulement : la réception d'une grande chute, Céleste touchée, le crochet qui attrape un câble, la bascule, le réveil d'un poursuivant, une veilleuse qui s'allume. Jamais deux à moins de 80 ms d'écart. Motifs dans `src/config/haptics.ts`, PROVISOIRES.
- **Réglage** : menu pause → Commandes tactiles → **Vibrations : Oui / Non** (spec §40), proposé seulement si le navigateur sait vibrer ; **activées par défaut**. Rangé avec les réglages des commandes de la sauvegarde, complété par défaut à la lecture d'une sauvegarde plus ancienne, **sans migration**.
- **Rien ne touche à la physique.**

## D-129 — Chantier C : le fil discret

- **Décisions de l'utilisateur** : **activé par défaut**, désactivable dans les réglages ; il ne se montre qu'après un long moment sans trouver la suite ; une lueur du monde étrange **mêlée d'une autre couleur**, pour ne la confondre avec rien.
- **Le chemin principal** (`src/levels/milestones.ts`) : les jalons dans l'ordre de l'histoire, chacun un déclencheur de l'histoire (disponible quand sa condition est vraie : il se désactive une fois vécu) ou un objet de capacité. Jamais une trouvaille, un disque, une affaire de Maria ni un objet à regarder ; les parents qui montrent la suite en font partie. Les quatre îlots du niveau 7 forment un groupe : le plus proche est montré. **Un nouveau niveau ajoute ses jalons** (le niveau 8).
- **Le but et l'itinéraire** (`src/core/hint/hint.ts`, pur, testé) : le premier jalon disponible ; de salle en salle par les sorties et les portes ouvertes (les sorties fermées par l'histoire sont évitées) et par les passages de l'histoire disponibles (l'entrée d'un monde étrange). Dans la salle : la sortie, la porte ou le passage à prendre, ou le but s'il est là. **Il montre où aller, jamais comment** ; l'itinéraire ne tient pas compte des capacités (le chemin principal est accessible avec celles qu'on a).
- **Quand** (`HintClock`, pur, testé) : le temps de jeu sans progrès (étape de l'histoire, capacité, salle découverte, veilleuse), compté seulement hors des scènes, des poursuites, des souvenirs, des évanouissements et des changements de salle. **Après 3 min** : la lueur part de Céleste et fait un petit bout de chemin dans la bonne direction, toutes les 15 s. **Après 5 min** : elle mène jusqu'à la sortie à prendre ou au but, y attend en battant doucement, puis repart de Céleste. Tout progrès l'éteint. Un tintement très doux (`hint`, à fournir) à chaque palier. Réglages : `src/config/hint.ts`, PROVISOIRES.
- **La lueur** (`HintView`) : un cœur doré et une croix de lumière dans un halo turquoise, une petite traînée, une légère oscillation de luciole : ni l'étincelle crème d'Agir, ni les scintillements turquoise du monde étrange, ni les trouvailles. Jamais Maria (pilier 5).
- **Réglage** : menu pause → **Aide → Aide discrète : Oui / Non**, rangé avec les réglages des commandes de la sauvegarde, complété par défaut (oui) à la lecture d'une sauvegarde plus ancienne, **sans migration**.
- **Debug** : INFOS montre le palier, le temps sans progrès et le jalon visé ; DEBUG → « Fil discret : maintenant » saute l'attente.
- **Vérifié par les tests** : chaque jalon existe ; **le chemin principal se suit jalon après jalon jusqu'à la fin du niveau 7**, chaque but accessible depuis le précédent, et le fil sait toujours quoi montrer dans la salle où l'on est ; les îlots, le plus proche d'abord ; l'horloge (paliers, remise à zéro, inactif).
- **Boucle de jeu** : une aide facultative ; **rien ne touche à la physique**. **Sauvegarde** : un réglage de plus, sans migration.

## D-130 — Chantier D, PR 1 : trois maquettes de la gare étrange

- **But** (plan D-124, chantier D) : que chaque monde étrange se reconnaisse (aujourd'hui, tous partagent le même violet et même le papier peint de la maison) et se lise mieux, sans quitter les silhouettes de D-28. Le document d'histoire (§4) le demande : chaque monde étrange déforme son lieu réel (proportions, lumière, couleurs). **Salle témoin : la gare étrange**, comme le salon pour le monde réel (D-74).
- **Trois maquettes**, à choisir (DEBUG → « Maquette du monde étrange ») ; aucune n'est appliquée au jeu :
  - **A, le crépuscule, mieux lu** : la palette de D-36 gardée, le papier peint de la maison remplacé par **les carreaux du hall de la gare**, des masses violettes plutôt que noires, liserés turquoise ;
  - **B, l'heure arrêtée** : la nuit de la gare réelle, **bleu nuit et lumière ambrée**, de petites **horloges arrêtées** chacune à une autre heure, liserés ambrés ;
  - **C, les objets perdus, dans la brume** : une **brume vert d'eau**, des **étiquettes de bagage**, liserés dorés pâles.
  - B et C reviennent sur le liseré turquoise de D-36 (choisi pour la lisibilité) : un liseré clair et chaud se lit aussi bien sur un fond froid.
- **Commun aux trois** (nouveaux champs de la palette, sans effet sur le monde réel ni sur le monde étrange actuel) : **liseré de 2 px** au lieu de 1 et **une lueur au-dessus** (`rimWidth`, `rimGlow`) ; **motif du mur imposé** par la palette (`wallMotif`, deux motifs nouveaux : `clocks`, `tags`) ; **halo doux autour de Céleste** (`halo`, `haloColor`, `CelesteHalo`), sous elle, au-dessus du décor : elle porte un peu de lumière.
- **Suite** : la maquette choisie (ou un mélange) devient la gare étrange (D2), puis chaque monde étrange reçoit la sienne (sa couleur et son motif tirés de son lieu), le niveau 7 en dernier (les deux couches de la bascule doivent rester lisibles).
- **Rien ne touche à la collision ni au mouvement.** **Sauvegarde** : aucun changement.

## D-131 — Bruitages : les premiers fichiers

- **Fournis par l'utilisateur** (16 fichiers, préparés par `audio:prepare -- --sfx`, 27 fichiers une fois les pas découpés en variantes, 200 Ko) : `jump`, `land`, `hurt`, `splash`, `ledge-climb` (envoyé sous le nom `climb`), `umbrella-open`, `umbrella-close`, `hook-catch`, `cable-slide`, `shift`, `train-warn`, `train-pass`, et les pas `step-stone`, `step-grass`, `step-leaves`, `step-sand`.
- **Les pas** arrivaient en enregistrements de marche (6 à 11 s) : chaque fichier est découpé en **pas isolés** (300 ms au plus, détectés par l'enveloppe, les plus nets gardés, fondu de sortie de 80 ms) : 4 variantes pour la pierre, l'herbe et le sable, 3 pour les feuilles. Le sable, très faible à l'origine (crête −24 dBFS), est remonté de plus de 20 dB : son souffle de fond aussi.
- **Les trains** : `train-pass` (10,5 s, deux passages) réduit à **3 s** (le second passage, attaque nette, fondu de sortie de 1 s) pour tenir dans le passage du jeu (1,6 s) et ne pas déborder sur l'annonce suivante (un train toutes les 9 s) ; `train-warn` garde sa décroissance naturelle, coupée à 2,5 s par la préparation (l'annonce dure 2 s).
- **Les boucles sans coupure** (`audio:prepare -- --sfx --loop`) : la fin du son rejoint son début en fondu enchaîné (puissance constante, 0,25 s environ), et le motif obtenu est **répété dans une marge de 100 ms de chaque côté**, que le lecteur saute (`SFX_LOOP_MARGIN_S`, `loopStart` / `loopEnd`) : un silence de décodage AAC au début ne s'entend pas à chaque tour. La longueur totale est un nombre entier de trames AAC (1024 échantillons), pour qu'aucun remplissage ne s'ajoute à la fin et que `durée − marge` tombe juste. Vérifié par le décodeur de ffmpeg (durée exacte, jonction continue) ; le Chromium du conteneur ne décode pas l'AAC. Un test vérifie que la marge du script et celle du lecteur sont égales. `cable-slide` : boucle de 0,96 s.
- **Rien ne touche à la physique** ni à la sauvegarde.

## D-132 — La maison cohérente (niveau 1)

- **Demande de l'utilisateur** : revoir la cohérence des niveaux, en commençant par la maison (« l'escalier s'arrête à la moitié de la pièce et donne l'impression de voler »). Analyse faite sur des captures de chaque salle entière et de la carte du cahier ; **propositions validées** (« ok pour tes propositions »), les trouvailles peuvent bouger (le jeu n'est pas encore diffusé : aucune migration).
- **Disposition des pièces** : l'étage (chambre, couloir) est à gauche de la cage de l'escalier, le rez-de-chaussée (salon, cuisine, buanderie) à droite. Le **grenier passe au-dessus du couloir** : avant, la boucle chambre → couloir → escalier → grenier → chambre allait toujours dans le même sens (impossible, la carte laissait deux liaisons en l'air) et le grenier était à la fois au niveau de l'étage et un étage plus haut.
  - Le grenier est **retourné en miroir** (on y entre à droite depuis le haut de la cage, on en ressort à gauche) : mêmes sauts, même difficulté ; la trouvaille, la veilleuse et le tourne-disque changent de colonne (`attic:s6-5`, `attic:c51-19`).
  - Dans la chambre, la porte du grenier passe **en haut du mur de droite**, au-dessus d'une étagère haute : on en redescend par le surmeuble et le bureau, on n'y monte qu'en grimpant. Le moteur refuse une liaison entre deux murs du même côté (`buildZone`) : la porte derrière l'armoire, à gauche, ne pouvait pas rester. Le dessus de l'armoire reste un endroit d'escalade.
  - La chambre perd sa mansarde (un toit en pente du côté du couloir, alors que le grenier est au-dessus) : plafond plat.
  - Les portes du grenier sont à la même hauteur des deux côtés (12 tuiles au-dessus de l'étage, dans la cage comme dans la chambre).
- **L'escalier** (option 1) : **une seule volée de 21 marches**, du palier de l'étage jusqu'au sol, devant la porte du salon (la salle passe de 44 × 30 à 66 × 42 tuiles). Le dessous est **fermé par une cloison** (lambris, limon, porte de placard sous le palier), sans recoin inatteignable. Au-dessus du palier, la cage monte au grenier **en grimpant** : placard au-dessus de la porte du couloir, étagère murale, palier du grenier (bord de son plancher, avec garde-corps). Disparaissent : la bibliothèque en escalier, le buffet posé sur le palier, le palier du grenier sur son poteau, le jouet mécanique. Le biberon est posé sur une marche, la veilleuse au pied de l'escalier.
- **Cuisine** : la porte de la buanderie s'ouvrait au-dessus du plan de travail (5 tuiles plus haut que de l'autre côté). Elle descend au ras du sol, au bout du plan de travail raccourci de 4 tuiles ; un **tabouret** de Céleste (2 tuiles) y remonte sans grimper (un marchepied d'une tuile de large ou à deux marches se franchissait mal : fenêtre trop courte). Hotte, conduit, bouilloire et placards hauts décalés de 3 tuiles (mêmes sauts), la plante aussi.
- **Salon** : la bibliothèque descend jusqu'au sol (un meuble bas à portes sous la dernière étagère, du fond : on passe devant) ; la poutre seule est **scellée dans le mur** de droite ; le dessous d'un escalier qui n'existait pas devient une **retombée de plafond** ; les briques de jeu ne sont plus dans un trou du parquet mais **posées dessus**, deux au lieu de quatre (posées, trois ou quatre briques se sautaient difficilement : fenêtre sous le seuil « facile »).
- **Buanderie** : l'armoire perchée sur de grands pieds devient une **haute étagère à linge** sur ses montants, avec les paniers rangés dessous (même collision : on passe toujours dessous).
- **Ce qui reste** : la trappe à linge (couloir, à l'étage à gauche → buanderie, au rez-de-chaussée à droite) reste une **petite liberté** (le conduit traverse la maison) ; la corriger demanderait de réordonner les pièces. Le monde étrange n'est pas touché (rien n'y tient debout exprès).
- **Vérifié par les tests** : la maison reste facile et ne coince jamais (avec et sans escalade, phases 1 et 2), le grenier n'est atteignable qu'en grimpant, sa trouvaille reste moyenne ; nouveaux tests : l'escalier se descend et se remonte facilement sans grimper, les portes d'un même étage s'ouvrent au ras du sol, et les nouveaux endroits d'escalade (cage, chambre).
- **Sauvegarde** : aucune migration (pas encore de joueurs) ; une ancienne partie peut perdre la trouvaille ou la veilleuse du grenier, et une partie enregistrée dans l'escalier reprend au repère de départ de la salle.

## D-133 — Le jardin cohérent (niveau 2)

- **Même méthode que la maison** (D-132) : captures de chaque salle entière et de la carte, relevé des incohérences, propositions **validées** (« vas-y »), avec les choix par défaut : l'allée montrée au fond, les racines en arche gardées, les arches de verdure faites.
- **Rien ne touche à la collision** : mêmes cases, mêmes sauts, mêmes difficultés ; seuls le dessin et des textes changent.
- **Le vieux mur** (grand arbre, allée) flottait au-dessus du passage qu'on prend dessous : il descend maintenant jusqu'au sol à l'image, **percé d'une arche** (passage dans l'ombre, piédroits, arc clair), sans piédroit contre le bord de la salle (le mur continue au-delà). Fait par le dessin `oldwall`, pour tout passage sous un mur ; l'ancien linteau de bois disparaît.
- **La cabane** : le plancher tenait à la haie, une jambe de force dans le vide. Une **grosse branche** du tronc (`limb`, du fond) court sous la couronne jusqu'au bord de la salle (vers la cabane) ; deux cordes y pendent le plancher, qui n'a plus de jambes de force.
- **L'allée** passe forcément **derrière le potager** (elle a son propre sol au niveau de la terrasse, mais occupe la même largeur) : un jeu de profil ne peut pas le montrer. Elle se voit maintenant **de loin, au fond du potager** (`alleybehind`, plan lointain) : la haie du fond, la clôture, la remise et sa girouette, le vieux mur et son arche, dans le même ordre que dans l'allée. La carte la garde au-dessus.
- **Les trouées dans les haies** (sorties dehors) restent claires (on voit qu'on peut passer) mais deviennent des **arches de verdure** : le feuillage arrondit les coins du haut et repousse en touffes au pied.
- **La façade de la terrasse** : la fenêtre au bout du fil à poulie est celle de la **buanderie** (textes seulement ; la chambre est à l'étage, à l'autre bout de la maison).
- **Gardé tel quel** : le tronc sur ses racines en arche (voulu, un arbre de conte) ; le monde étrange derrière la haie.
- **Sauvegarde** : aucun changement.

## D-134 — Le quartier cohérent (niveau 3)

- **Même méthode** (D-132, D-133) : captures de chaque salle entière (la rue en quatre morceaux), relevé, propositions **validées** (« vas-y »), avec le choix recommandé pour la réserve (l'escalier de secours).
- **Un défaut de D-133 corrigé** : les arches de verdure se dessinaient à toutes les sorties dehors, y compris dans un mur (l'arrière de la supérette au chantier, le haut de la cour, le bout de l'échafaudage de la rue). Le feuillage n'est plus dessiné que si la sortie traverse une haie (matière feuillage au-dessus ou au-dessous) ; dans un mur, une simple ouverture sous son linteau.
- **La porte de la réserve** s'ouvrait à 10 tuiles du sol dans la supérette (au-dessus de l'étagère, le saut moyen de la salle) mais au ras du sol dans le chantier. Elle monte à la même hauteur sur l'arrière de la supérette, dans le chantier (sortie 1, lignes 30 à 32), et un **escalier de secours** en zigzag y descend : trois paliers traversables (3 tuiles de l'un à l'autre), dessinés en caillebotis, avec garde-corps, volées et poteaux (`fireescape`). La supérette ne change pas (son saut moyen reste). Les tests du chantier passent tels quels : la lanterne de l'échafaudage reste moyenne, le parapluie difficile, la sortie haute et la trouvaille seulement en planant, rien ne coince.
- **La cour** : le « local à vélos » de 14 tuiles de haut devient le **pignon du gymnase** de l'école (`gymgable` : briques, une fenêtre, un toit plat bordé de zinc où l'on arrive en planant), un petit abri à vélos à son pied. Même collision.
- **La rue** : les panneaux verts au bout de la rue (la forme en L au-dessus de la trouvaille) flottaient ; ils sont **posés sur deux tréteaux**. Même collision.
- **Gardé tel quel** : les lieux derrière les façades (portes en profondeur, même convention que l'allée du jardin) ; l'école vue de l'intérieur (ses deux portes mènent en profondeur) ; le grillage de l'école qui monte jusqu'en haut de l'aire de jeux (parti pris de jeu, il se lit bien).
- **Sauvegarde** : aucun changement.

## D-135 — La gare cohérente (niveau 4)

- **Même méthode** (D-132 à D-134) : captures des cinq salles réelles (la gare étrange et la tour à part), relevé, propositions **validées** (« vas-y »), avec le choix recommandé pour le hall.
- **La passerelle et la galerie du hall** : la passerelle des quais est à 14 tuiles au-dessus du quai, mais débouchait sur une galerie à 25 tuiles au-dessus du sol du hall (quai et hall de plain-pied). La **galerie descend à 14 tuiles** (sortie 3, lignes 22-23) ; le colimaçon garde ses trois marches du bas ; le **câble** du crochet (15,21 → 62,23) et le **balcon** (et sa trouvaille) descendent. Le balcon descend de 8 tuiles et non de 11 : à 11, il s'atteignait sans le crochet, d'un saut plané depuis l'auvent du kiosque (le test « avec le crochet seulement » l'a attrapé). L'horloge et le tableau des départs remontent au-dessus du câble.
- **Le pilier des quais** (plein, au-dessus du passage) flottait sur une tige fine : il devient un **grand panneau d'affichage** (une affiche de la mer) sur deux pieds jusqu'au quai. Même collision : la cheminée du saut mural et sa trouvaille ne bougent pas.
- **La haute armoire des objets trouvés** flottait sur deux petites équerres : elle est posée sur un **haut piètement ouvert** (deux montants, une traverse), le porte-parapluies dessous. Même collision.
- **Gardé tel quel** : les voies (quais surélevés, poste d'aiguillage sur pilotis), le dépôt (wagons au-dessus des fosses, crochets du pont roulant), le reste du hall et des objets trouvés.
- **Vérifié par les tests** : la gare (portes, difficultés, crochet seulement pour le rebord du hall et le toit du poste), les revisites en glissade, la fin de la gare, la gare étrange, le fil discret, l'histoire, l'habillage.
- **Sauvegarde** : la trouvaille du balcon du hall change de ligne (`station-hall:s67-25`) ; pas de migration (pas encore de joueurs).

## D-136 — Le train cohérent (niveau 5)

- **Même méthode** (D-132 à D-135) : captures des cinq voitures réelles (le monde étrange de la cuisine à part), relevé, propositions **validées** (« vas-y »), avec le choix recommandé pour l'échelle du fourgon (la garder).
- **Rien ne touche à la collision** : mêmes cases, mêmes sauts, mêmes difficultés ; seuls des dessins changent. Les portes entre voitures étaient déjà à la même hauteur des deux côtés.
- **Les cloisons des compartiments** (couchettes, compartiments) descendaient du plafond et s'arrêtaient dans le vide, au-dessus du passage. Sous chacune, jusqu'au plancher, **l'encadrement de la porte du compartiment** (deux montants) et la porte coulissante ouverte, poussée contre le montant : on passe par la porte. Pas d'encadrement sous une cloison qui a sa grille en accordéon dessous.
- **Les creux du toit** laissaient voir le ciel à travers la voiture : ce sont maintenant des **logements creusés dans la caisse** (fond de tôle sombre, grille d'aération, rebords). Ils protègent toujours des tunnels.
- **Les vélos du fourgon** pendaient sans attache visible : un support vissé à la paroi, un crochet, deux sangles.
- **Gardé tel quel** : l'échelle du fourgon est au bout de la voiture (à droite) alors qu'on arrive au début de son toit (à gauche). La déplacer viderait le fourgon de sa traversée, ou ferait sauter la moitié du parcours des tunnels ; on passe d'une salle à l'autre en fondu, l'écart se voit à peine.
- **Vérifié par les tests** : le train, ses voitures (chacune moyenne au plus, sans coincer), ses dangers, l'arrivée, l'habillage.
- **Sauvegarde** : aucun changement.

## D-137 — La station balnéaire cohérente (niveau 6)

- **Même méthode** (D-132 à D-136) : captures des huit salles réelles (la fête engloutie, la vague et le couloir de la fin à part), relevé, propositions **validées** (« vas-y »). Les portes entre salles étaient déjà cohérentes.
- **Rien ne touche à la collision** ni aux marées : seuls des dessins changent.
- **Deux erreurs de dessin corrigées** :
  - la promenade : l'**aile basse du centre** de la classe de mer avait une largeur nulle (le cadre du décor faisait juste la largeur du corps principal) ; ses deux fenêtres et le balcon de son toit flottaient dans le ciel. Le cadre s'élargit (30 tuiles), l'aile existe ;
  - le port : les **pieds de la grue** ne descendaient pas jusqu'au quai (le sol était cherché depuis l'intérieur du pied). Ils y descendent.
- **La pêche aux canards** (jetée) : son long toit flottait au-dessus du trou du platelage ; deux poteaux le portent jusqu'au platelage, et le **bassin aux canards** est dessiné dans le trou, comme prévu à D-101.
- **Les rochers percés** (plage, rochers) : là où l'on passe sous la pierre (12 tuiles au plus), la pierre descend jusqu'au sable à l'image, **percée d'une arche sombre** (comme le vieux mur, D-133) ; contre une autre pierre, sans piédroit. L'arche du gros rocher, la faille, le bloc de la grotte, la pierre de la cheminée (« aiguille ») se lisent comme des passages.
- **Le câble de la plage** s'accrochait 3 tuiles au-dessus du pieu de l'épi : un mince **mât d'amarrage** planté sur le pieu le rejoint (dessiné pour tout câble qui s'attache au-dessus d'un pieu).
- **Gardé tel quel** : le phare (l'escalier en colimaçon cassé, des volées de part et d'autre du noyau, voulu), la gare de la mer, le centre.
- **Vérifié par les tests** : l'habillage, l'arrivée, le rivage, le port, la fête foraine.
- **Sauvegarde** : aucun changement.

## D-138 — Le dernier niveau : plan du niveau 8 validé (« la chambre qui rapetisse »)

- **Choix de l'utilisateur** (après lecture du document d'histoire, §8 à §12) : le monde de Maria naît de **la chambre du premier soir** ; **la chambre qui rapetisse** ; l'entrée par **le berceau vide** ; un vrai parcours, surtout dans la chambre immense ; difficulté **facile à moyenne, sans boss** ; on peut **continuer à jouer après la fin** pour les trouvailles. Le plan est accepté tel quel pour le reste (le soir rejoué, le matin, le dernier plan, après la fin).
- **Le soir** (réel) : quelques mois après la classe de mer, **un soir**. Le premier soir rejoué **sans Maria** : papa à la porte (l'heure du lit), le tapis vide où elles jouaient, le berceau défait que Céleste refait, maman qui vient dire bonne nuit, le chat sur le tabouret. Les parents reviennent à un moment important (§8.2). La nuit, les lumières éteintes, le berceau vide s'éclaire.
- **L'entrée** : Agir sur le berceau vide ; le cercle s'ouvre ; Céleste est **dans le berceau devenu immense** et en sort par-dessus les barreaux.
- **Le monde de Maria** : toujours la même chambre, celle du premier soir (le berceau, la couverture, le mobile, les étoiles de la veilleuse, la boîte à musique), **de plus en plus petite**. Céleste ne change pas de taille : c'est le monde qui revient à la sienne (elle a grandi, sans un mot ; physique commune, pilier 7).
  1. **la chambre immense** (moyen), un vrai parcours en deux salles :
     - **le bas** : le berceau, le coffre à jouets, le tapis, le tabouret, le dessous du lit, le pied du bureau ;
     - **le haut** : le surmeuble, le lit cabane et sa boîte à musique, **le mobile** (ses fils pour le crochet, ses figures pour appuis), **les étoiles de la veilleuse**. **La berceuse** : les étoiles s'allument par vagues lentes, au rythme de la boîte à musique (le moteur des vagues de l'effacement, D-111 : annoncées, jamais sous Céleste, chaque état une variante statique analysée), sans menace. Les deux couches : le présent en silhouettes, le souvenir aux couleurs du premier soir. Les six capacités ;
  2. **la chambre grande** (facile) : presque plus de couches, moins d'étrangeté ;
  3. **la vraie chambre, la nuit** (aucune difficulté) : plus de couches (le bouton Basculer pâlit). **Maria dort dans son berceau sous sa couverture**, comme Céleste l'avait couchée le premier soir. Agir : Céleste la prend dans ses bras, le cœur du prologue ; le cercle se referme. On ne sait plus si l'on est encore dans le monde étrange (§12).
  - **L'étrange s'efface** à mesure qu'on approche de Maria : moins de violet, moins d'effets, des couleurs de plus en plus vraies ; la musique se réduit à la boîte à musique.
  - Ni boss, ni ennemi, ni trouvaille, ni disque (§9 : pas de nouveau collectible). Une chute ramène au dernier appui ; **sans peur** (proposé, décidé avec la salle). Pas de Maria vue au loin : on voit le berceau sous le mobile, pas Maria.
  - Méthode D-27 : le parcours de chaque salle est proposé (plan, image) avant d'être finalisé.
- **Le matin** (réel, jouable) : Céleste se réveille sur son lit, Maria dans les bras. Une étincelle sur le tapis, là où était la toute première action du jeu : Agir, elle s'assoit avec Maria, un cœur, la bulle du livre du soir commence… et s'efface ; elle la regarde. Elle la range avec soin (proposé : **sur le surmeuble du bureau**, là où était la couverture ; à confirmer), le dernier câlin. **C'est le joueur qui fait sortir Céleste par la porte.**
- **Le dernier plan** : la caméra reste sur Maria ; la veilleuse vacille en turquoise, quelques scintillements, le mobile tourne seul un instant ; Maria ne bouge pas ; tout redevient normal ; le noir.
- **Après la fin** : un écran de fin sans texte, puis l'accueil. « Continuer » reprend chez elle, en phase 4, pour finir les trouvailles ; Maria reste sur son étagère, sans étincelle (elle ne revient pas la chercher).
- **Pilier 5, signalé** : Maria ne se déplace jamais à l'écran. Céleste peut la tenir dans ses bras, **immobile** (assise ou debout) ; chaque changement de place se fait dans le noir, comme depuis le prologue ; jamais Céleste qui marche en la portant.
- **À fournir par l'utilisateur, idéalement** : un thème de fin (une variation de la boîte à musique ou du jingle `maria`), Céleste en phase 4 illustrée, peut-être l'image « Céleste tenant Maria ».
- **Découpage** : 1 le soir de la phase 4 et l'entrée par le berceau (la suite en « ? » provisoire) ; 2 la berceuse, le moteur et le parcours d'essai 17 (**essai sur téléphone**) ; 3 la chambre immense, le bas (l'arrivée dans le berceau, le dessin du monde de Maria) ; 4 la chambre immense, le haut (le mobile, les étoiles) ; 5 la chambre grande, la vraie chambre la nuit, Maria retrouvée (la pose « dans les bras ») ; 6 le matin et le dernier plan ; 7 après la fin (l'écran de fin, l'accueil, « Continuer », le fil discret).

## D-139 — Le dernier niveau, PR 1 : le premier soir rejoué sans Maria, la nuit, le berceau vide

- **Plan validé** (D-138). Nouveau fichier d'histoire `src/levels/finale/story.ts` (`FINALE_STORY`), réuni à celui de la maison comme les autres niveaux ; nouvelles étapes `finale.rug`, `finale.cradle`, `finale.goodnight`, `finale.night`, ajoutées en fin de liste.
- **La fin du niveau 7 change** (D-119) : « quelques mois plus tard », c'est **un soir** (nouvelle règle de moment de la journée, avant celle du réveil au dortoir). Le « ? » provisoire est retiré : la dernière bulle reste « Maria qui manque », Céleste est assise sur son lit, et le soir commence.
- **Le soir** (la chambre, phase 4), comme le premier soir (D-31, D-33, D-37), sans Maria :
  - **papa à la porte** (son illustration, D-123) ; la chambre est fermée, il rappelle l'heure du lit ;
  - **le chat** dort sur le tabouret (au salon, ni le chat ni sa caresse pendant ce temps) ;
  - **le tapis vide** : une étincelle là où était la toute première action du jeu. Agir : Céleste s'assoit à sa place du premier soir, tournée vers la place vide de Maria ; une bulle Maria ; puis la bulle du berceau ;
  - **le berceau**, défait depuis le premier matin : Agir (du sol ou du dessus du coffre) ; dans le noir d'un fondu, il est refait, la couverture bordée, vide ; une bulle Maria, puis le lit ;
  - **le lit** : maman vient dire bonne nuit (son cœur, puis celui de Céleste) ; papa est parti.
- **La nuit** : le noir de la nuit ; **les lumières éteintes** (la règle `dim` du train, D-85, appliquée à la chambre : seule la veilleuse reste) ; maman est partie ; Céleste, assise sur son lit, ne dort pas ; **le berceau vide scintille**, une bulle « berceau ». En s'en approchant, la lumière vacille (un présage, D-35). La chambre reste fermée (la bulle du berceau).
- **PLACEHOLDER** : Agir sur le berceau, la nuit : « ? » (rejouable, sans effet). L'entrée du monde de Maria (la chambre immense) viendra avec la suite du niveau.
- **Écart avec le premier soir** : ni câlin ni histoire du soir (sans Maria) ; ni couverture à aller chercher (elle est dans le berceau défait).
- **Fil discret** (D-129) : trois jalons de plus (le tapis, le berceau, le lit) ; le berceau de la nuit attendra son entrée.
- **Debug** : l'histoire « quelques mois plus tard, le soir (phase 4, niveau 8) » (renommée) et « la dernière nuit, le berceau vide ».
- **Tests** (`finaleEvening.test.ts`) : le soir après la fin du niveau 7, plus de « ? » ; le rituel dans l'ordre ; Maria jamais là, le berceau défait puis refait ; les parents du premier soir ; la chambre fermée (papa, puis le berceau) ; la nuit (lumières éteintes, présage, « ? » sans effet). `nannyEnd.test.ts` et `hint.test.ts` mis à jour.
- **Vérifié dans Chromium** : le soir (papa illustré à la porte, le chat, le berceau défait), le tapis, le berceau refait, maman au bord du lit, la nuit et la bulle du berceau, le « ? ».
- **Sauvegarde** : aucune migration (quatre étapes en fin de liste).

## D-140 — Le dernier niveau, PR 2 : la berceuse (le moteur, le parcours d'essai 17)

- **Plan validé** (D-138) ; le parcours de la chambre immense validé par l'utilisateur (le lit et le coffre ; le ciel de la chambre, jusqu'à la petite porte du grenier ; puis la chambre grande et la vraie porte). Aucune salle du jeu n'utilise encore la berceuse : tout est essayé dans le parcours 17.
- **La berceuse** : des étoiles qui s'allument et s'éteignent par vagues lentes, au rythme de la boîte à musique. C'est **le moteur des vagues de l'effacement** (D-111, D-117), avec une autre allure :
  - `; @erase-look: stars` : chaque groupe est une **étoile**, **allumée** (`both` : dans les deux couches, la bascule n'y change rien) ou **éteinte** (`none` : nulle part) ; chaque étape l'allume ou l'éteint (`toggledMask`, au lieu de présent ↔ souvenir). Toutes les étoiles sont des vagues (pas de bandes) ; vérifié à la lecture (erreurs explicites) ;
  - **son propre rythme** : une étape toutes les `lullabyBeatMs` (2 s), annoncée `lullabyWarnMs` (1,2 s) avant (DEBUG → Combat), indépendant de l'effacement et de son accélération ;
  - comme l'effacement : chaque motif est une variante statique analysée ; **rien ne s'allume sur Céleste** (l'étoile attend qu'elle soit partie) ; rien ne bouge (D-86).
- **Le dessin** (`LullabyView`, PLACEHOLDER, `LULLABY_VIEW`) : une planche de lumière chaude, une étoile au milieu, un halo en anneaux ajoutés à la lumière ; éteinte, la planche en pointillés et le contour de l'étoile (pour prévoir). **Une étoile qui va s'allumer s'éclaire peu à peu ; une qui va s'éteindre vacille.** Tout est créé au chargement ; chaque image ne change que des opacités. La vue des couches (`ShiftLayerView`) laisse les étoiles à `LullabyView`.
- **Le son** : à chaque étoile qui s'annonce, **une note de boîte à musique** (nouvel emplacement `lullaby`, 4 à 6 variantes d'une même gamme, `docs/BRUITAGES.md` ; un bip en attendant le fichier).
- **Parcours d'essai 17 « Berceuse »** (70 × 26, facile, sans capacité) : au-dessus d'un sol sans danger (une chute y ramène ; on revient au départ en marchant), **l'escalier** (quatre étoiles qui montent, la lumière monte avec elles) jusqu'au palier de la lanterne, puis **la traversée** (quatre étoiles au-dessus du vide, la lumière avance) jusqu'à l'arrivée. Chaque étoile reste allumée trois temps : un avec la précédente, un seul, un avec la suivante ; le cycle fait huit temps.
- **Tests** :
  - `erase.test.ts` : la lecture, les motifs (la lumière passe d'une étoile à l'autre), le rythme propre, l'étoile qui attend Céleste, les erreurs ;
  - `lullabyCourse.test.ts` : **le temps comme un graphe** (motif, surface) : dans un motif, les passages faciles ; d'un motif au suivant, on reste sur ce qui reste. **En suivant la lumière, on arrive ; dans un seul motif, jamais** ; une étoile qui va s'éteindre laisse toujours un appui qui reste (pas le sol) à portée pendant l'annonce ; jamais coincée ;
  - `courses.test.ts` : un parcours de berceuse est analysé toutes étoiles allumées (faisabilité, difficulté) ; son rythme, à part.
- **Écart avec la conception initiale** : l'annonce était de 1,1 s ; la sonde a mesuré 1,02 s pour quitter la dernière étoile vers le palier (phase 1) : 1,2 s.
- **Vérifié dans Chromium** : la lumière qui monte, les étoiles allumées, éteintes, qui s'éclairent.
- **Limites** : le halo paraît terne sous l'obscurité de la salle (à revoir dans la chambre immense : les étoiles pourraient éclairer la salle) ; dans la vraie salle, Céleste aura la bascule : les étoiles, allumées dans les deux couches, n'en dépendent pas.
- **Sauvegarde** : aucun changement (l'état des étoiles n'est jamais sauvegardé, comme l'effacement).
