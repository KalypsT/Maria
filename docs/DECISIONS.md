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

## Risques identifiés à suivre

- **Croissance vs collisions** : hitbox par paliers alignés sur la grille, changement de phase uniquement en lieu sûr, hauteur de saut mesurée en tuiles, chemin critique praticable à toutes les phases suivantes, test automatique d'accessibilité par phase.
- **Coût graphique de la croissance** (animations × phases) : envisager moins de silhouettes que de phases.
- **Sauvegarde iOS** (effacement après 7 jours sans visite hors installation) : export/import de code indispensable.
- **Carte imparfaite** vs utilité de navigation.
- **Volume de 15 h** en production solo : vertical slice d'abord.
