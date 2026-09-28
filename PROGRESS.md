# Avancement

## Phase en cours

**Phase 3 — Contrôles mobiles** (spec §12, §40, §42.3) : implémentée, **en attente d'essai sur téléphone** (spec §43.0.2).

Phase 1 (mouvement) : mergée, FPS validés sur téléphone, mouvement jugé « pas mal » ; une passe de **fluidité** est prévue plus tard (voir « Idées mises de côté »).

Prochaine : à confirmer (Phase 2 — Plateforme, ou passe de fluidité sur le mouvement).

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

- Entrées lues une fois par image : une pression peut tomber sur des pas différents selon la fréquence d'affichage (au plus une image d'écart). La physique elle-même est identique à toutes les fréquences (testé).
- Pas de descente à travers une plateforme (bas + saut) ni d'apex hang : prévus plus tard si besoin.
- Pas de caméra mobile : la salle tient sur un écran (caméra : spec §43.0.3, phase ultérieure).
- `pixelArt: true` arrondit l'affichage au pixel logique : mouvement par pas de 1 px logique (3 px physiques). À réévaluer avec la direction artistique.
- Pas de repositionnement des boutons par glisser-déposer ni de manette (Gamepad API) : reportés à plus tard.
- Le bouton Action n'a pas d'effet avant la phase combat.

## Idées mises de côté (à reprendre en passe de fluidité)

- **Affichage** : option d'affichage au sous-pixel pour Céleste (actuellement arrondi au pixel logique, ~3 px physiques), à comparer sur téléphone ; la physique ne change pas.
- **Ressenti sans toucher à la physique** : écrasement/étirement au décollage et à la réception, inclinaison en courant, poussière (réception, demi-tour), caméra douce avec anticipation.
- **Courbe du saut** (à valider) : gravité accrue au relâchement au lieu de la coupure nette ; léger flottement au sommet. Chaque option avec un interrupteur dans l'overlay, désactivée par défaut.

## Prochaines étapes

1. Essai sur téléphone des commandes (liste ci-dessus) et réglage des valeurs de `src/config/controls.ts`.
2. Phase suivante à confirmer.
