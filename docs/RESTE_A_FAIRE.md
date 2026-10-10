# MARIA — Ce qu'il reste à faire (état des lieux du 10 octobre 2026)

Fait d'après `PROGRESS.md`, `docs/DECISIONS.md` (jusqu'à D-154), `docs/BRUITAGES.md`,
`docs/LANTERNES.md`, `docs/COQUILLES.md` et le code de `main` (PR #95 fusionnée).

## 1. Où en est le jeu

**Le jeu se joue en entier, du premier soir à la fin.** Les 8 niveaux sont construits (maison,
jardin, quartier, gare, train, station balnéaire, maison de la nounou, monde de Maria). Les capacités,
la croissance (4 phases), les boss et poursuites, la carte et le cahier, les souvenirs, les
47 coquilles, les 97 lanternes nommées, la sauvegarde v3, les stats, les disques, le fil discret, les
vibrations et tous les personnages illustrés sont faits.

**Ce qui manque n'est presque plus du code : ce sont des essais, des choix et des fichiers.**

| Bloc                                   | État                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| Contenu jouable (8 niveaux)            | ✅ fait                                                 |
| Essais sur téléphone                   | ❌ **419 cases « à vérifier » ouvertes dans PROGRESS**  |
| Mouvement réglé au téléphone           | ❌ jamais validé sur appareil (§43.0.1)                 |
| Musique (9 thèmes, 3 jingles)          | 🟡 il manque `memory-play`                              |
| Disques (3)                            | 🟡 1 sur 3 (`early`, `lullaby` sans fichier)            |
| Bruitages (44 emplacements + 5 voix)   | 🟡 16 fournis, **23 manquants** (+ 5 voix facultatives) |
| Mondes étranges différenciés (D-124 D) | 🟡 maquettes faites, **en attente de ton choix**        |
| Lanternes : questions 3 et 4           | 🟡 en attente de ta réponse                             |
| Avant diffusion (D-152)                | 🟡 lanternes faites, stats faites ; reste le ménage     |

## 2. Le vrai bloquant : l'essai sur téléphone

C'est de loin le plus gros poste. Depuis la phase 1, le jeu est vérifié dans Chromium sur ordinateur ;
**aucune** liste « à vérifier sur téléphone » n'a été cochée, y compris celles du mouvement (§43.0.1),
de la performance (60 FPS) et du saut mural (« valeurs jamais réglées au téléphone »). Plusieurs fois,
PROGRESS note : « l'utilisateur a demandé de continuer ».

Proposition : **ne pas tout cocher case par case** (419, c'est irréaliste), mais faire **une vraie
partie complète** sur le téléphone, build de debug, en notant seulement ce qui gêne. Puis, par ordre
d'importance :

1. **Mouvement** : course, saut, coyote, buffer, escalade, saut mural, parapluie, crochet, glissade,
   bascule. Régler avec DEBUG, exporter le JSON, me l'envoyer.
2. **Performance** : FPS stable et « pas perdus » qui n'augmente pas, surtout dans la station
   balnéaire (la marée, l'eau) et le niveau 7 (deux couches).
3. **Contrôles tactiles** : taille et place des boutons, le bouton « Basculer ».
4. **Sauvegarde** : quitter l'appli au milieu, revenir ; lanterne gardée après rechargement ; code de
   sauvegarde exporté puis importé.
5. **Les parcours jamais essayés** : parcours 11 (glissade), 13 (marée), 15 et 16 (bascule,
   effacement), 17 (berceuse).
6. **Lisibilité** : les personnages à petite taille, le chat la nuit, les pictogrammes de « Mon
   voyage », la version sur l'écran de départ.
7. **Son** : volume relatif des morceaux, boucles de la rue et du train, la fin.

Les stats (D-153) servent à ça : après la partie, DEBUG → « Stats » dit dans quelles salles Céleste s'est évanouie et où le
fil discret s'est montré. Ce sont les salles à retravailler.

## 3. Les choix qui t'attendent

| #   | Question                                                                                                 | Où                           |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| C1  | Gare étrange : maquette **A** (crépuscule), **B** (heure arrêtée), **C** (brume) ou mélange              | DEBUG → « Maquette… », D-130 |
| C2  | Lanternes dehors : une **variante par lieu** (lampe-tempête, lanterne de marin…) ou la veilleuse partout | `LANTERNES.md`, question 3   |
| C3  | Débuts des mondes étranges sans lanterne : on garde ? (recommandé : oui)                                 | `LANTERNES.md`, question 4   |
| C4  | Diffusion : à qui, comment (lien privé, famille, public) ?                                               | voir §6                      |

## 4. Les fichiers que tu dois fournir

**Musique** (`src/assets/audio/LISEZMOI.md`) :

- `memory-play` : le thème des souvenirs jouables (la cuisine rose, le souvenir d'Eden). Aujourd'hui
  ces souvenirs sont silencieux.
- `record-early` (le premier disque, jardin ou quartier) et `record-lullaby` (chez la nounou). Sans
  fichier, le disque est caché : pas de bug, mais le tourne-disque n'en joue qu'un.

**Bruitages manquants** (`docs/BRUITAGES.md`, par ordre d'utilité) :

- le monde, entendus souvent : `checkpoint`, `door`, `map-open`, `map-close`, `thought`, `hint` ;
- les pas et réceptions : `step-wood` (toute la maison !), `step-fabric`, `step-metal`, `land-big` ;
- les capacités : `ledge-grab`, `wall-slide` (boucle), `wall-jump`, `slide` ;
- le combat et les dangers : `attack`, `hit`, `enemy-scatter`, `chase-wake`, `chase-rumble` (boucle),
  `tunnel`, `wave-warn`, `erase`, `lullaby` (4 à 6 notes) ;
- facultatif : les 5 voix de Céleste.

`step-wood` est le plus important : la maison, premier niveau, est aujourd'hui sans bruit de pas.

## 5. Le travail de code qui reste

**À faire après tes choix :**

- **Mondes étranges (chantier D)** : la gare étrange refaite d'après C1, puis chaque monde étrange avec
  sa couleur et son motif (maison, haie, école, gare, train, mer), le niveau 7 en dernier. Plusieurs
  PR.
- **Lanternes dehors** (si C2 = oui) : une PR, sans toucher aux positions.
- **Réglages du mouvement** : reporter dans `src/config/movement.ts` les valeurs exportées du téléphone.
- **Corrections d'après l'essai** : inconnues tant que l'essai n'a pas eu lieu. C'est probablement le
  plus gros morceau de code restant.

**Ménage avant diffusion (aucun choix requis) :**

- « Parcours d'essai » (D-25) : déjà réservé au build de debug (D-59), rien à retirer ; seule la
  note « à retirer » de PROGRESS est à mettre à jour.
- Commentaires périmés : `src/levels/sea/story.ts` (« viennent avec la PR 9 ») et
  `src/levels/train/story.ts` (« le matin vient avec la PR 6 ») parlent de PR faites depuis.
- `PROGRESS.md` (1900 lignes) : la section « Phase en cours » mélange l'historique et l'actuel ; la
  section « Prochaines étapes » est périmée (elle parle encore du train, PR 3 à 6). À resserrer :
  garder en haut l'état actuel, archiver le reste.

**Écarts restants avec la spec (déjà tranchés ou reportés) :**

- §40 : pas de repositionnement des boutons, pas de manette, pas d'option « réduire les effets »
  (ce dernier : ton choix, D-152). La taille, l'opacité des boutons, le volume, les sons et la
  vibration sont réglables.
- Pas d'écran de crédits (ton choix, D-152) : voir §6.
- Rien au bout des défis de la nounou (ton choix, D-148). Le train n'a pas de revisite qui ouvre un
  chemin (signalé, D-148).

## 6. Avant de diffuser : un point à ne pas négliger

- **Droits de la musique** : les morceaux viennent de Suno. Selon l'abonnement au moment de la
  création, l'usage peut être réservé au non-commercial, voire les droits rester à Suno (offre
  gratuite). Pour une diffusion à la famille, peu d'enjeu ; pour une diffusion publique, à vérifier.
- **Droits des bruitages** : l'origine et la licence des 16 sons fournis ne sont notées nulle part.
  Un son CC-BY demande un crédit, donc un écran de crédits.
- **iPhone** : non prévu (D-152). Si un proche joue sur iPhone, rien n'est garanti.

## 7. Ordre proposé

1. **Une partie complète au téléphone** (debug), avec les stats. Rien d'autre tant qu'elle n'est pas
   faite.
2. Tes réponses C1 à C4 et le `step-wood`.
3. Une branche « retours de la partie » : mouvement, salles difficiles, lisibilité.
4. Le chantier D (mondes étranges), un monde par PR.
5. Les sons et la musique au fil de l'eau (ils se branchent sans code).
6. Le ménage, puis la diffusion.
