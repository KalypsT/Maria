# Avancement

## Phase en cours

**Phase 0 — Mise en place** : terminée (en attente de merge sur `main` et de test sur téléphone).

Prochaine : **Phase 1 — Prototype de mouvement** (spec §42.1).

## Fait

- Analyse de la spec et décisions techniques → `docs/DECISIONS.md`.
- Projet Vite 8 + TypeScript 6 strict + Phaser 4.2, ESLint, Prettier, Vitest.
- Écran minimal : canvas paysage 640–800 × 360 mis à l'échelle (FIT), rectangle placeholder, message « Tourne ton téléphone » en portrait. Vérifié par captures Chromium (16:9, 19,5:9, > 20:9, portrait, rotation).
- Test Vitest sur le calcul de la largeur logique.
- Workflow GitHub Actions : vérifications + déploiement Pages depuis `main`.

## À vérifier par l'utilisateur

- [ ] Merge sur `main`, workflow vert, page ouverte sur https://kalypst.github.io/Maria/
- [ ] Sur téléphone : paysage plein écran sans barres parasites, message en portrait, pas de zoom au double-tap.

## Point ouvert à trancher avant la Phase 1

`CLAUDE.md` interdit les outils de debug dans le build de production, mais les tests sur téléphone se font sur le déploiement de `main` (build de production). Sans solution, l'overlay de réglage en direct serait inaccessible sur téléphone. Proposition : publier en plus un build de debug sur un sous-chemin (ex. `/Maria/debug/`), le build principal restant sans outils de debug.

## Prochaines étapes — Phase 1 (prototype de mouvement)

- `src/config/movement.ts` : tous les paramètres (accélération/décélération sol et air, vitesse max, saut défini par hauteur en tuiles + temps jusqu'au sommet, gravité de chute, coupure de saut, coyote ~100 ms, buffer ~100 ms, vitesse de chute max).
- `InputAction` + source clavier + **tactile provisoire minimal** (gauche/droite/saut) pour tester sur téléphone.
- Boucle à pas de temps fixe 1/120 s (fonction pure) + interpolation d'affichage.
- Collisions AABB contre grille, plateformes traversables par le haut.
- `PlayerPhysics` + machine à états Idle/Run/Jump/Fall/Land.
- Salle de test ASCII + parseur.
- Overlay de debug : réglages en direct, hitbox, vitesse, état, export JSON des valeurs.

### Critères d'acceptation Phase 1

- [ ] Tests : accélération/décélération ; saut court/moyen/complet ; coyote et buffer aux bornes ; coins de tuiles sans accrochage ; pas de traversée à vitesse max ; plateforme traversable ; trajectoire identique à 60/90/120/144 Hz.
- [ ] Aucune valeur de gameplay hors `src/config/` ; aucune allocation par frame dans la simulation.
- [ ] Performance au moins équivalente à Arcade (condition D-05) : 60 FPS stables sur téléphone réel.
- [ ] Jouable au clavier et au tactile provisoire ; réglages modifiables en direct sur téléphone.
- [ ] Validation par l'utilisateur après essai réel (spec §43.0.1).
