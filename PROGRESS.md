# Avancement

## Phase en cours

**Phase 2 — Prototype plateforme** (spec §42.2, §37, §43.0.3) : implémentée sur la branche `claude/phase-2-platforming`, **en attente de validation puis d'essai sur téléphone**.

Phase 1 (mouvement) : mergée, FPS validés sur téléphone, mouvement jugé « pas mal », pas encore formellement validé (§43.0.1). Phase 3 (contrôles mobiles) : mergée. Une passe de **fluidité** est prévue après la caméra (voir « Idées mises de côté »).

Prochaine : à confirmer (passe de fluidité, ou Phase 4 — combat minimal).

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
- Le bouton Action n'a pas d'effet avant la phase combat.

## Idées mises de côté (à reprendre en passe de fluidité)

- **Affichage** : option d'affichage au sous-pixel pour Céleste (actuellement arrondi au pixel logique, ~3 px physiques), à comparer sur téléphone ; la physique ne change pas.
- **Ressenti sans toucher à la physique** : écrasement/étirement au décollage et à la réception, inclinaison en courant, poussière (réception, demi-tour).
- **Caméra** : option sous-pixel pour le défilement si un tremblement d'un pixel est visible sur téléphone.
- **Courbe du saut** (à valider) : gravité accrue au relâchement au lieu de la coupure nette ; léger flottement au sommet. Chaque option avec un interrupteur dans l'overlay, désactivée par défaut.

## Prochaines étapes

1. Validation de la Phase 2, PR et merge, puis essai sur téléphone (liste « Phase 2 » ci-dessus) ; reporter les réglages exportés dans `src/config/camera.ts` et, si besoin, les seuils de `src/config/levelDesign.ts`.
2. Essai sur téléphone des commandes (liste « Phase 3 »).
3. Passe de fluidité, puis Phase 4 (combat minimal).
