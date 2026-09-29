# Avancement

## Phase en cours

**PWA / hors ligne** (D-09, D-23) : implémentée sur la branche `claude/pwa`, **en attente de validation puis d'essai sur téléphone**.

Phase 5 (checkpoints, sauvegarde) : mergée, en attente d'essai sur téléphone. Mouvement, commandes et combat : validation provisoire par l'utilisateur, à confirmer en jeu réel.

Prochaine : Phase 6 — première zone réelle (vertical slice, spec §53).

## Fait

### Phase 0 — Mise en place

- Analyse de la spec et décisions techniques → `docs/DECISIONS.md`.
- Projet Vite 8 + TypeScript 6 strict + Phaser 4.2, ESLint, Prettier, Vitest.
- Écran minimal paysage 640–800 × 360 (FIT), message « Tourne ton téléphone » en portrait.
- Workflow GitHub Actions : vérifications + déploiement Pages depuis `main`.

### Phase 1 — Prototype de mouvement

- **D-12** : build de debug publié sur `/Maria/debug/` ; le build principal reste sans outils de debug (vérifié en CI par `npm run check:no-debug`).
- `src/config/movement.ts` : tous les paramètres (valeurs **provisoires**), bornes de réglage, valeurs dérivées par pas (`deriveMovement`). Le saut est défini par sa hauteur en tuiles et son temps de montée.
- Entrées : `InputAction` (masque de bits, sans allocation), `InputController` (fronts de pression mémorisés jusqu'à leur consommation par un pas), `KeyboardSource` (codes physiques : flèches, ZQSD/WASD, Espace/K), `TouchSource` **provisoire** (gauche/droite/saut en DOM, multi-touch, affiché sur appareil tactile seulement).
- `FixedStepClock` : pas fixe 1/120 s, 8 pas max par image, interpolation d'affichage (`alpha`). La scène utilise le delta **brut** de Phaser (non lissé).
- `gridCollision` : AABB par axes, balayage de toutes les tuiles traversées (aucune traversée), bords semi-ouverts (pas d'accrochage aux jointures), plateformes traversables par le dessous.
- `PlayerPhysics` : accélération/décélération sol et air, demi-tour plus vif, saut à hauteur variable (coupure au relâchement), coyote time et jump buffering en pas entiers, intégration exacte à gravité constante, correction de coin de plafond (4 px). Machine à états Idle/Run/Jump/Fall/Land (Land visuel uniquement).
- Salle de test ASCII `src/levels/test-room.txt` (40 × 22) + parseur `parseAsciiLevel` → `LevelData`.
- `GameScene` : simulation + affichage interpolé ; placeholder de Céleste avec lunettes rondes roses ; salle dessinée une fois dans une texture.
- Overlay de debug (dev et build de debug seulement) : bouton **DEBUG** en haut à droite ; curseurs pour chaque paramètre (valeurs modifiées en rose, conservées en `localStorage`), hitbox, état, vitesses, position, FPS, temps de simulation, pas abandonnés ; **Exporter JSON** (presse-papiers + fichier), valeurs par défaut, replacer Céleste. Le panneau laisse libres les commandes tactiles.
- Mesure physique maison vs Arcade : `bench/arcade.html`, publiée sur `/Maria/debug/bench/arcade.html`.

### Phase 3 — Contrôles mobiles

- **Joystick flottant** (`FloatingJoystick`, pur) : la base apparaît sous le pouce dans la zone gauche (hors bande de sécurité iOS de 28 px), suit le pouce au-delà du rayon. Numérique par défaut (seuils avec **hystérésis**, haut/bas détectés) ; analogique en option.
- **Boutons** : Action (**sans effet avant la phase combat**) dans le coin bas droit, Saut (le plus gros) juste au-dessus, Pause (haut gauche). Marge droite de 56 px (essai sur téléphone : trop près du bord, appuis sur Action par erreur), écart de 16 px, et un doigt garde son bouton tant qu'il reste dans sa zone d'appui. Capacité, Carte et Interaction sont prévus dans la disposition mais masqués (`TOUCH_BUTTONS_ENABLED`). Hit areas généreuses (marge 14 px) ; un pouce glisse d'un bouton à l'autre.
- `computeTouchLayout` (pur) : disposition selon la taille de l'écran, les zones sûres (mesurées via `env()`) et l'échelle réglable. `TouchController` (pur) : attribution des doigts (10 suivis), combinaisons de la spec §12.3, `releaseAll`.
- `TouchSource` : rendu DOM (mises à jour seulement en cas de changement), relâchement de tout à la perte de focus, rotation, onglet masqué et `pointercancel`, menu contextuel Android neutralisé.
- **Menu pause** (bouton, Échap/P, ou onglet masqué) : simulation arrêtée, taille des boutons (70–150 %), opacité, mode du joystick, réinitialisation ; aperçu en direct. Réglages validés et conservés en `localStorage` (**D-13**, à migrer avec la sauvegarde en Phase 5).
- **Traversée de plateforme** (**D-14**, validée) : Bas + Saut sur une plateforme traversable. Paramètres `dropInputThreshold` et `dropThroughMs`, réglables dans l'overlay.
- Debug : doigts actifs, valeurs du joystick, masque des boutons ; `?touch` force les commandes tactiles sur ordinateur (dev / build de debug seulement).
- Tests : 134 (dont joystick, disposition sur 4 écrans × 3 échelles × avec/sans encoche, combinaisons multi-touch, annulations, réglages, traversée). Vérifié en émulation Chromium avec de vrais événements tactiles : joystick + saut simultanés, pause, réglage, persistance après rechargement, build principal sans debug.

### PWA / hors ligne

- **D-23** (mise en œuvre de D-09) : `vite-plugin-pwa` dans le **build principal seulement** ; le build de debug et le serveur de dev n'ont **pas de service worker** (option `disable`). Précache complet (10 fichiers, 1,5 Mo), `/Maria/debug/` exclu du précache et des navigations.
- **Mises à jour** : mode « prompt », jamais de rechargement en pleine partie ; la nouvelle version s'applique au lancement suivant, ou par **« Mettre à jour »** sur l'écran de départ (« Nouvelle version disponible »).
- **Manifeste** : MARIA, `/Maria/`, **paysage**, plein écran, couleurs du jeu ; **icônes placeholders** (lunettes rondes roses de Céleste, SVG source `public/icons/icon.svg`, PNG 192 / 512 / maskable / apple-touch-icon 180 générés avec Chromium).
- **Installation** : bouton « Installer le jeu » (Android), **aide iOS** « Partager, puis Sur l'écran d'accueil » hors installation, qui rappelle le transfert par code de sauvegarde (fonction pure testée) ; rien une fois installé.
- **CI** : `check:pwa` (service worker et manifeste présents, précache sans doublon ni debug, exclusion de `/Maria/debug/`, aucun service worker ni manifeste en debug) ; vérifié qu'il échoue sur un service worker en debug.
- **Vérifié dans Chromium** (build principal servi localement) : service worker actif ; **hors ligne**, le jeu démarre et une partie se lance ; `/debug/` jamais servi depuis le cache (échec hors ligne, réseau en ligne) ; nouvelle version déployée → « Nouvelle version disponible » → Mettre à jour → nouvelle version chargée ; aide iOS affichée avec un agent Safari iPhone.
- Tests : 244.

### À vérifier sur téléphone (PWA)

Sur https://kalypst.github.io/Maria/ (build **principal**, après merge et déploiement) :

- [ ] **iPhone** : l'aide s'affiche dans Safari ; Partager → Sur l'écran d'accueil ; l'icône apparaît ; l'application s'ouvre **en plein écran, en paysage**, sans barre Safari.
- [ ] **Android** : bouton « Installer le jeu » (ou menu du navigateur) ; l'application s'ouvre en plein écran.
- [ ] **Hors ligne** : mode avion, ouvrir l'application installée : le jeu démarre, Continuer fonctionne.
- [ ] **Transfert iOS** : dans Safari, copier le code de sauvegarde ; dans l'application installée, Importer un code.
- [ ] **Mise à jour** : après un prochain déploiement, « Nouvelle version disponible » apparaît sur l'écran de départ (parfois après deux ouvertures) ; Mettre à jour charge la nouvelle version.
- [ ] Le build de debug (https://kalypst.github.io/Maria/debug/) reste toujours à jour (pas d'ancienne version en cache).

### Phase 5 — Checkpoint / sauvegarde

- **D-21** (validée) : **jauge de peur** (3 crans, réglable) remplie par les contacts ennemis ; pleine, ou au contact d'un **danger** `^`, Céleste **s'évanouit** (elle s'estompe, voile noir de 450 ms, aucune représentation de la mort) puis revient au **dernier checkpoint** (départ de la salle à défaut) ; ennemis remis à leur départ, jauge vidée, progression conservée. Checkpoints `C` : activés au contact, vident la jauge, déclenchent une sauvegarde. Diminution naturelle de la jauge : paramètre, désactivée. Contact de danger tolérant (2 px).
- **D-22** : sauvegarde robuste. Cœur pur (`src/core/save`) : schéma v1 (checkpoint, checkpoints activés, réglages, progression prévue et vide), validation stricte, somme de contrôle FNV-1a, refus motivé (illisible, format, somme, version future, schéma), migration des réglages `localStorage` (D-13, D-18 : anciens modules supprimés). **Deux emplacements** (principal / précédent) écrits dans **une transaction IndexedDB** ; le dernier principal valide devient le précédent ; au chargement : principal, sinon précédent, sinon partie neuve, sans jamais échouer ; écritures en file. Repli `localStorage` puis mémoire. Stockage persistant demandé (après un geste).
- **Code de sauvegarde** (`MARIA1.…`) : copier depuis le menu pause, importer depuis le menu pause ou l'écran de départ ; un code abîmé est refusé avec la raison.
- **Écran de départ** minimal (placeholder) : Continuer (avec la salle ; avis si la sauvegarde précédente a été récupérée), Nouvelle partie (confirmée si elle remplace une partie ; l'ancienne reste l'état précédent), Importer un code.
- **Sauvegarde automatique** : checkpoint, changement de réglage, changement de salle (pas seulement à la fermeture).
- **Analyse de faisabilité** : un passage qui touche un danger est raté, une surface sous un danger n'est pas praticable.
- **Parcours 6. Checkpoints** (facile, 317 ms) : bassins de dangers, plateformes au-dessus d'un sol de dangers, patrouilleur entre deux dangers, plafond de dangers, trois checkpoints.
- **Overlay** : sections « Échec et peur » et « Sauvegarde » (emplacements, stockage, erreur, checkpoints, contenu ; Sauvegarder maintenant, Corrompre le principal, Effacer), bouton Évanouissement ; peur et point de retour dans les stats.
- **Correctifs trouvés en essai** : une touche pressée et relâchée entre deux images était perdue (Échap n'ouvrait pas toujours la pause) ; les touches tapées dans un champ de saisie pilotaient le jeu et étaient bloquées (`preventDefault`).
- Tests : 241 (format, corruption, validation, migration, code ; deux emplacements, écriture interrompue, principal abîmé, stockage illisible, file ; SaveSession ; RunState : danger, durée de l'évanouissement, checkpoint, jauge, diminution, reprise ; dangers et analyse ; touche brève).
- **Vérifié de bout en bout dans Chromium** (IndexedDB réel) : écran de départ neuf → nouvelle partie → danger → retour au départ → checkpoint (sauvegarde écrite) → évanouissement → retour au checkpoint → **rechargement** → Continuer au checkpoint → **principal corrompu** → rechargement → avis et reprise sur le précédent → jauge 1 → 2 → évanouie → export du code → **navigateur vierge** → code abîmé refusé → code importé.
- Mesure (profileur de tas, boucle chaude, parcours 6) : 0,09 octet/pas pour combat + physique + `RunState` (bruit).

### À vérifier sur téléphone (Phase 5)

Sur https://kalypst.github.io/Maria/debug/ (après merge), parcours « 6. Checkpoints » :

- [ ] Écran de départ lisible ; Continuer reprend bien après **fermeture complète** du navigateur (et après une nuit).
- [ ] Évanouissement doux, compréhensible, pas frustrant (durée `faintMs`) ; retour au bon checkpoint.
- [ ] Checkpoints visibles, activation perceptible.
- [ ] Jauge de peur : lisible sans gêner (en haut au centre) ; 3 crans, trop ou pas assez ?
- [ ] Contact des dangers juste (ni injuste, ni trop tolérant).
- [ ] Code de sauvegarde : copier, le coller dans une note, puis l'importer (idéalement sur un autre navigateur ou appareil).
- [ ] iOS : après installation sur l'écran d'accueil (quand la PWA existera) ; en attendant, garder un code.

### Phase 4 — Combat minimal

- **D-20** (validée) : être touchée = recul + courte perte de contrôle + invulnérabilité ; ni jauge ni mort avant la Phase 5. Patrouilleur dispersé en **2 coups** (le premier le repousse et l'étourdit).
- **Coup de bâton** (`PlayerAttack`, pur) : préparation 40 ms, frappe 100 ms, récupération 120 ms, recharge 60 ms, pression mémorisée 100 ms ; zone de frappe devant Céleste (18 × 16 px), orientation figée pendant le coup, un impact par coup et par ennemi. Même coup au sol et en l'air ; **pas de frappe vers le bas avec rebond** (ce serait une capacité, pilier n° 3). **Aucune immobilisation ni perte de vitesse** : un test vérifie que la trajectoire de Céleste est identique avec ou sans attaque.
- **Patrouilleur** (`Patroller`, pur, même collision que Céleste) : marche sur sa plateforme, demi-tour au bord et au mur ; étourdi = penché, terni, inoffensif ; dispersé = éclat de particules (pas de gore). Placeholder ocre neutre (design ouvert). Marqueur `e` dans les cartes ASCII.
- **Touchée** : état `Hurt` et `startHurt` dans `PlayerPhysics` (direction et saut ignorés pendant la perte de contrôle, aucun saut mémorisé) ; le reste du mouvement est inchangé (tests de la Phase 1 verts). Clignotement pendant l'invulnérabilité.
- **Feedback** : arrêt sur image de 50 ms (simulation suspendue, pressions conservées, interpolation figée), clignotement blanc de l'ennemi touché, arc de frappe, geste du bâton, éclat de dispersion (stock de particules réutilisé). Tremblement de caméra **désactivé** par défaut (§37).
- **Parcours 5. Combat** (facile, 342 ms) : sol dégagé entre deux murets, plateforme étroite au-dessus d'une fosse, zone d'atterrissage gardée, couloir bas (impossible de sauter par-dessus : frapper ou passer pendant le demi-tour), plateforme traversable occupée. Faisable sans attaquer et sans surface sans retour (D-16).
- **Overlay** : section Combat (22 réglages, conservés, exportés), zone de frappe (rouge) et hurtboxes (orange) avec la hitbox, phase du coup, invulnérabilité et états des ennemis, bouton « Réinitialiser les ennemis ».
- Tests : 209 (phases exactes du coup, mémoire de pression à la borne, recharge, côté de la zone de frappe, patrouille sans chute et demi-tour au mur, étourdi puis dispersé, un impact par coup + arrêt sur image, recul à l'opposé et invulnérabilité, ennemi étourdi inoffensif, trajectoire inchangée en attaquant, réinitialisation, validation des réglages).
- Vérifié dans Chromium avec de vrais événements tactiles (bouton Action) : coup, étourdissement, dispersion au second coup, contact et recul. Deux défauts corrigés après essai : patrouilleur sombre invisible sur le fond (→ ocre) et bâton seul illisible (→ arc de frappe).
- Mesure (profileur de tas, boucle chaude de 120 000 pas, parcours 5 avec attaques) : 0,07 octet/pas pour le combat et la physique (bruit : un nombre de 12 octets tous les ~170 pas, 5 patrouilleurs).

### À vérifier sur téléphone (Phase 4)

Sur https://kalypst.github.io/Maria/debug/ (après merge), parcours « 5. Combat » (menu pause) ; bouton **Action** (J au clavier) :

- [ ] **Attaque fiable** : chaque appui donne un coup ; un appui juste avant la fin du coup précédent n'est pas perdu ; pas de coup « fantôme ».
- [ ] **Hitbox correcte** : la portée paraît juste (ni trop courte, ni « à distance ») ; on touche en l'air comme au sol.
- [ ] **Ennemi identifiable** : patrouilleur visible, étourdi reconnaissable, dispersion lisible et non violente.
- [ ] **Combat secondaire** : l'attaque ne ralentit pas ; passer par-dessus ou éviter reste plus naturel que combattre, sauf dans le couloir bas.
- [ ] **Touchée** : recul compréhensible, pas frustrant ; clignotement visible ; pas de double contact.
- [ ] **Arrêt sur image** (50 ms) : donne de l'impact sans gêner la précision ? (régler `hitstopMs`, 0 = aucun).
- [ ] Action + saut + déplacement simultanés au pouce sans perte d'entrée.
- [ ] Réglages retenus : **Exporter JSON** (section `combat`).

### Passe de fluidité

- **Résolution de rendu** (**D-18**) : menu pause → Affichage → Résolution « Logique » (par défaut) ou « Écran » (canvas à la hauteur physique, échelle ≤ 3, zoom de caméra = échelle), conservée (`maria.settings.display`, versionné). Vérifié dans Chromium : en « Écran », Céleste avance d'un pixel physique par tiers de pixel logique (au lieu de sauts de 3 px). Coût : ≈ 9 fois plus de pixels (Chromium sans GPU du conteneur : 14 FPS contre 57, non représentatif d'un téléphone). Échelle affichée dans l'overlay (« rendu ×3 »).
- **Forme du saut** (**D-19**, désactivée par défaut, section Mouvement de l'overlay) : `jumpReleaseMode` 1 = gravité × `releaseGravityMultiplier` au relâchement au lieu de la coupure (même hauteur complète, sans cassure de vitesse) ; `apexHangSpeed` > 0 = gravité × `apexGravityMultiplier` près du sommet, Saut maintenu. Effet mesuré par l'analyse (D-16) : le relâchement progressif ne change ni le profil ni les parcours ; le flottement (60 px/s) donne +117 ms en l'air, +2 px de hauteur et **+1 tuile de portée** : « Précision » passerait de 67 ms (difficile) à 192 ms (moyen), « Chaîne » de 133 à 250 ms (facile). S'il est adopté, les tests des parcours échoueront volontairement : il faudra recalibrer les parcours.
- **Sensations visuelles** (désactivées par défaut, section « Fluidité (visuel) » de l'overlay, `src/config/feel.ts`) : `PlayerFeel` (pur, au pas fixe) — étirement au décollage, écrasement à la réception selon l'impact, petit écrasement au demi-tour, ressort amorti, inclinaison en course ; sprite ancré aux pieds. Poussière (décollage, réception, demi-tour) : 8 images réutilisées, aucun objet créé en jeu (vérifié). En résolution logique, l'écrasement du placeholder (12 × 22 px) perd des rangées de pixels ; plus propre en résolution écran.
- **Mesures** (profileur de tas, boucle chaude de 120 000 pas) : joueur avec les options de saut et `PlayerFeel` activés : aucune allocation au-delà du bruit de fond de Phaser (0,78 octet/pas contre 0,7).
- Tests : 189 (échelle de rendu et réglages d'affichage, options de saut dont trajectoire identique à 60/90/120/144 Hz avec les options, sensations : désactivées = identité, étirement/écrasement, retour au repos, inclinaison, ressort borné).

### À vérifier sur téléphone (passe de fluidité)

Sur https://kalypst.github.io/Maria/debug/ (après merge) :

- [ ] **Résolution** (menu pause → Affichage) : « Écran » est-il visiblement plus fluide que « Logique » en course et en saut ? **FPS** de l'overlay en « Écran » : stable à 60 (ou à la fréquence de l'écran) ? Le téléphone chauffe-t-il ?
- [ ] **Relâchement progressif** (DEBUG → Mouvement → `jumpReleaseMode` = 1) : petits sauts plus agréables qu'avec la coupure ? Régler `releaseGravityMultiplier`.
- [ ] **Flottement au sommet** (`apexHangSpeed` 40–80) : plus facile de viser, ou saut « lunaire » ? (Attention : il change la difficulté des parcours.)
- [ ] **Sensations** (DEBUG → Fluidité : `squashEnabled` = 1, `dustEnabled` = 1) : écrasement, inclinaison, poussière agréables ou distrayants ? À comparer en « Logique » et « Écran ».
- [ ] Ce qui est retenu : **Exporter JSON** et me transmettre les valeurs (mouvement, caméra, sensations).

### Phase 2 — Prototype plateforme

- **Caméra** (**D-15**) : `CameraController` pur (`src/core/camera`), avancé au pas fixe avec le joueur et interpolé. Zone morte horizontale, anticipation dans le sens de la course (après 250 ms de course : les tapotements ne bougent pas la vue ; reste en place à l'arrêt), cadrage vertical sur le dernier sol (**un saut ne bouge pas la vue**), bande haute/basse, suivi serré et anticipation vers le bas pendant une grande chute, atterrissage sans rebond, marge garantie aux bords de la vue, bornes de la salle, zoom (pas de 0,25), regard haut/bas au joystick (désactivé par défaut). Largeur 640–800 : même cadrage autour de Céleste (distances en px absolus). 20 paramètres dans `src/config/camera.ts`.
- **Grandes salles** (**D-17**) : rendu par blocs de 32 × 32 tuiles ; arrivée `G` et métadonnées `; @name:` / `; @difficulty:` dans le format ASCII ; registre `src/levels/index.ts`.
- **Faisabilité** (**D-16**, `src/core/analysis`, pur) : `computeJumpProfile` (hauteur, durée, distance, plus grand trou par dénivelé avec sa fenêtre) et `analyzeLevel` (surfaces praticables, passages simulés avec la vraie physique : sauts en courant à chaque instant de pression, maintiens courts, air control relâché, sauts sans élan, chutes, Bas + Saut ; chemin dont le passage le plus dur est le plus facile). `PlayerPhysics.copyFrom` (copie d'état, sans effet sur le mouvement) permet d'essayer chaque instant sans tout rejouer.
- **Seuils de difficulté** (provisoires, `src/config/levelDesign.ts`) : fenêtre du passage le plus dur ≥ 200 ms (facile), 100–200 ms (moyen), 50–100 ms (difficile).
- **Parcours d'essai** (`src/levels/courses/`, sans danger : une chute ramène plus bas, jamais bloquée) :

  | Parcours        | Taille (tuiles) | Difficulté | Passage le plus dur (paramètres actuels)        |
  | --------------- | --------------- | ---------- | ----------------------------------------------- |
  | 1. Premiers pas | 128 × 30        | facile     | marche de +3 sur 3 tuiles, 317 ms               |
  | 2. Chaîne       | 150 × 32        | moyen      | trou de 6 tuiles à plat depuis 3 tuiles, 133 ms |
  | 3. Tour         | 60 × 80         | facile     | zigzag +3, 417 ms ; longue chute dans le puits  |
  | 4. Précision    | 120 × 32        | difficile  | +3 sur 5 tuiles, 67 ms                          |

- **Tests** (174) : caméra (immobile à l'arrêt, aucun mouvement vertical pendant un saut, tapotement ignoré, anticipation sans oscillation, recadrage sans dépassement, Céleste visible et ≥ 150 px visibles sous ses pieds en chute rapide, atterrissage sans rebond, bornes, petite salle centrée, même cadrage en 640 et 800, zoom, regard) ; profil de saut (hauteur configurée, monotonie, **suit les paramètres** : saut plus haut, course plus rapide, sans coyote) ; analyse (surfaces, trou franchissable ou non, Bas + Saut, chemin le plus sûr) ; **chaque parcours** : faisable, difficulté déclarée exacte, et **aucune surface sans retour** (ce test a trouvé deux pièges dans le parcours 1, corrigés).
- **Profil de saut actuel** : 56 px (3,5 tuiles, corniche max 3 tuiles), 650 ms en l'air, 88 px en courant ; trou max 6 tuiles à plat (133 ms), 5 tuiles pour +3 (67 ms), 7 tuiles pour −2 (100 ms). Tableau complet dans la sortie de `npm run test`.
- **Choix du parcours** : liste dans l'overlay de debug et entrée **provisoire** « Parcours d'essai » dans le menu pause (les deux builds) ; le dernier choix est conservé (`localStorage`).
- **Overlay** : sections repliables Mouvement / Caméra, repères de caméra (zone morte, bande, cible d'anticipation, centre), position et avance de la caméra ; l'export JSON contient mouvement et caméra.
- Vérifié dans Chromium (émulation téléphone 844 × 390, vrais événements tactiles par CDP) : course, sauts, arrêt et saut sur place sans aucune inversion de la caméra ; chute dans la tour (pieds à 249 px sur 360 au pire, 292 avant correction) ; joystick + Saut simultanés (6 sauts sur 6) ; choix d'un parcours dans le menu pause.

### À vérifier sur téléphone (Phase 2)

Sur https://kalypst.github.io/Maria/debug/ (après merge) ; parcours à choisir dans le menu pause (faire défiler jusqu'à « Parcours d'essai ») :

- [ ] **Caméra, course** : la vue anticipe dans le sens de la course sans à-coups ; de petits tapotements gauche/droite ne la font pas bouger ; pas de va-et-vient à l'arrêt.
- [ ] **Caméra, sauts** : la vue ne monte pas et ne descend pas pendant un saut ordinaire ; recadrage doux après une montée (parcours 1, escalier ; parcours 3, tour).
- [ ] **Caméra, chute** (parcours 3, puits) : on voit assez loin sous Céleste ; à l'arrivée, la vue se pose sans rebondir.
- [ ] **Tremblement** : Céleste ne « vibre » pas d'un pixel par rapport au décor pendant la course (arrondi au pixel logique, `pixelArt`).
- [ ] **Boutons** : le terrain utile n'est pas caché sous Saut / Action (en bas à droite) ; sinon, augmenter `verticalOffsetPx` ou `lookAheadPx` dans l'overlay.
- [ ] **Difficulté ressentie** : 1 facile, 2 moyen, 3 facile, 4 difficile ? Noter les sauts ratés souvent : ils servent à calibrer les seuils (200 / 100 / 50 ms).
- [ ] **Wall jump** : un passage semble-t-il vraiment le demander ? (aucun n'en a besoin, D-16 le vérifie).
- [ ] **FPS** stable dans les grandes salles (overlay), « pas perdus » qui n'augmente pas.
- [ ] Réglages caméra : ajuster dans **DEBUG → Caméra**, puis **Exporter JSON** et me transmettre les valeurs.

### À vérifier sur téléphone (Phase 3)

- [ ] Joystick : apparition sous le pouce, seuils confortables (ni trop sensible ni trop mou), demi-tour rapide, pas de mouvement parasite en lâchant.
- [ ] Saut + déplacement + Action simultanés, sans perte d'entrée ; glisser d'un bouton à l'autre.
- [ ] Bas du joystick + Saut sur une plateforme traversable (échelle à droite de la salle).
- [ ] Tailles : boutons atteignables au pouce sans repositionner la main (essayer 100 % et 130 %) ; position de Saut/Action.
- [ ] Encoche / barre d'accueil : commandes hors des zones grises ; iOS : pas de balayage retour au bord gauche, pas de zoom, pas de menu d'appui long.
- [ ] Rotation en jeu : aucune commande « collée ». Mise en veille / changement d'onglet : pause automatique.
- [ ] Menu pause lisible et utilisable au pouce ; réglages conservés après rechargement.
- Plusieurs téléphones si possible (spec §42.3).

### Mesures (Chromium headless sur ordinateur, build minifié)

|                                    | µs / pas  | µs / image à 60 Hz |
| ---------------------------------- | --------- | ------------------ |
| Physique maison                    | 0,15–0,24 | 0,3–0,5            |
| Arcade (même salle, mêmes entrées) | 0,76–0,79 | ~1,6               |

- Maison **3 à 5× plus rapide** qu'Arcade sur ordinateur. À confirmer sur téléphone avec la page de mesure.
- **Allocations** (profileur de tas de Chromium, objets collectés inclus, 120 000 pas) : ~0 octet/pas dans la simulation. Deux pièges corrigés : un flottant passé en argument à une fonction non inlinée est alloué (déplacements transmis par `box.dx`/`box.dy`) ; un champ de classe d'abord `undefined` fait allouer chaque écriture de flottant (champs toujours initialisés à un nombre).
- Le temps de simulation affiché par l'overlay est grossier (précision de `performance.now()` réduite par les navigateurs) ; la page de mesure donne des valeurs précises.

### Critères d'acceptation Phase 1

- [x] Tests (64) : accélération/décélération, demi-tour, contrôle aérien ; saut court/moyen/complet et hauteur configurée ; coyote et buffer aux bornes exactes ; sol et murs de tuiles sans accrochage ; coins de plafond ; pas de traversée à vitesse max ni ×10 ; plateforme traversable ; **trajectoire identique à 60/90/120/144 Hz** ; budget de performance.
- [x] Aucune valeur de gameplay hors `src/config/` ; aucune allocation par pas dans la simulation (mesuré).
- [ ] Performance au moins équivalente à Arcade (D-05) : **remplie sur ordinateur** ; reste à vérifier 60 FPS stables sur téléphone réel (page de mesure + FPS de l'overlay).
- [x] Jouable au clavier et au tactile provisoire (multi-touch vérifié en émulation Chromium) ; réglages modifiables en direct.
- [ ] Validation par l'utilisateur après essai réel (spec §43.0.1).

## À vérifier par l'utilisateur

- [ ] Merge sur `main`, workflow vert.
- [ ] Sur téléphone, https://kalypst.github.io/Maria/debug/ : ressenti du mouvement (§43.0.1 : déplacement compréhensible, accélération perceptible, arrêt contrôlable, saut précis, hauteur variable, coyote, buffer, contrôle aérien). Régler avec **DEBUG**, puis **Exporter JSON** et me transmettre les valeurs à reporter dans `src/config/movement.ts`.
- [ ] Sur téléphone, https://kalypst.github.io/Maria/debug/bench/arcade.html : noter les µs/pas maison et Arcade.
- [ ] FPS stable à 60 (ou à la fréquence de l'écran) dans l'overlay, « pas perdus » qui n'augmente pas en jeu.
- [ ] https://kalypst.github.io/Maria/ (build principal) : pas de bouton DEBUG.

## Points connus / limites

- **Allocation de la caméra** (profileur de tas de Chromium, boucle chaude de 120 000 pas, méthode de la Phase 1) : ~3 octets par pas au sol (un nombre de 12 octets tous les ~4 pas), le joueur restant à 0. Dichotomie : lié aux écritures des hauteurs de référence dans la branche « au sol », pas à la représentation des champs (un `Float64Array` ne change rien) ; cause V8 non identifiée. En jeu réel (Chromium, 20 s après 40 s de jeu), aucune allocation attribuée à la caméra, et Phaser alloue ~4,5 Ko par pas équivalent : impact négligeable. À revoir si des pauses de GC apparaissent sur téléphone.
- Les fenêtres de timing supposent une arrivée en courant depuis l'arrêt, au bout de la plateforme de départ, et des entrées tenues parfaitement : elles mesurent la tolérance du saut, pas la difficulté au pouce.
- Le choix « Parcours d'essai » du menu pause est provisoire (prototype) : à retirer quand le monde sera structuré (Phase 6).

- Entrées lues une fois par image : une pression peut tomber sur des pas différents selon la fréquence d'affichage (au plus une image d'écart). La physique elle-même est identique à toutes les fréquences (testé).
- Pas de descente à travers une plateforme (bas + saut) ni d'apex hang : prévus plus tard si besoin.
- `pixelArt: true` arrondit l'affichage au pixel logique : mouvement par pas de 1 px logique (3 px physiques). À réévaluer avec la direction artistique.
- Pas de repositionnement des boutons par glisser-déposer ni de manette (Gamepad API) : reportés à plus tard.

## Idées mises de côté (à reprendre en passe de fluidité)

- **Affichage** : option d'affichage au sous-pixel pour Céleste (actuellement arrondi au pixel logique, ~3 px physiques), à comparer sur téléphone ; la physique ne change pas.
- **Ressenti sans toucher à la physique** : écrasement/étirement au décollage et à la réception, inclinaison en courant, poussière (réception, demi-tour).
- **Caméra** : option sous-pixel pour le défilement si un tremblement d'un pixel est visible sur téléphone.
- **Courbe du saut** (à valider) : gravité accrue au relâchement au lieu de la coupure nette ; léger flottement au sommet. Chaque option avec un interrupteur dans l'overlay, désactivée par défaut.

## Prochaines étapes

1. Validation de la PWA, PR et merge, puis essai sur téléphone (listes « PWA » et « Phase 5 »).
2. Phase 6 — première zone réelle (vertical slice, spec §53) : boucle, secret, capacité permettant une revisite (§43.0.5).
