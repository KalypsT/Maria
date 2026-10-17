# MARIA — Présentation du jeu

Fiche de présentation d'un jeu déjà réalisé, à donner comme contexte à un autre projet.
Elle résume ce qu'est **MARIA**, comment il a été conçu et construit, et ce qui a été appris en chemin.
Les détails complets sont dans le dépôt `KalypsT/Maria` (`docs/MARIA_Specifications.md`, `docs/MARIA_Histoire_Monde_Etrange.md`, `docs/DECISIONS.md`, `PROGRESS.md`).

---

## 1. En bref

|                 |                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Titre**       | MARIA                                                                                                                                                                          |
| **Genre**       | Action-platformer 2D, Metroidvania compact                                                                                                                                     |
| **Plateforme**  | Navigateur mobile en **paysage** (tactile d'abord), aussi jouable au clavier ; installable comme application (PWA), **hors ligne** après le premier chargement |
| **Joueur**      | Solo                                                                                                                                                                           |
| **Public visé** | Diffusion **privée** (famille, proches). Joueuse principale : une maman, peu habituée aux jeux vidéo. Dédicace : « Pour Céleste et sa maman »                                  |
| **Durée**       | Une partie complète, du premier soir à la fin, sur 8 niveaux                                                                                                                   |
| **Langue**      | Français, avec **presque aucun texte** : bulles à pictogrammes, pas de dialogues écrits                                                                                        |
| **Publication** | GitHub Pages : https://kalypst.github.io/Maria/ (build de debug sur `/Maria/debug/`)                                                                                           |
| **État**        | **Le jeu se joue en entier**, des huit niveaux jusqu'à la fin et l'après-fin. Le travail actuel est du polissage d'après les essais sur téléphone                              |

**Le pitch** : Céleste, une petite fille aux lunettes rondes roses, perd son poupon préféré, Maria. Elle la cherche dans sa maison, son jardin, son quartier, puis de plus en plus loin. En chemin, le monde réel se mêle à un **monde étrange** : celui des choses que l'on perd en grandissant. Céleste **grandit réellement** au fil de l'aventure. À la fin, elle retrouve Maria, mais elle ne peut pas retrouver l'enfance qu'elle avait avec elle.

**La question qui a guidé tout le projet** :

> Est-ce que contrôler cette petite fille et explorer son monde est suffisamment agréable pour donner envie de continuer à jouer ?

---

## 2. Les piliers de conception

1. **Le platforming est le cœur du jeu** : précision avant réalisme physique.
2. **Monde interconnecté** : les revisites ont toujours une raison (nouvelle route, secret, croissance).
3. **Les capacités transforment le déplacement**, ce ne sont pas de simples clés. Aucune capacité n'ajoute de bouton sans nécessité.
4. **Le combat reste secondaire** ; les ennemis sont pensés autour du mouvement. Pas de gore.
5. **Maria ne parle jamais et n'est jamais montrée en train de se déplacer.** Elle ne change de place que dans le noir. (Seule exception, à la fin : Céleste la porte dans ses bras.)
6. **Le fantastique n'est jamais entièrement expliqué** ; peu de texte, aucun monologue explicatif.
7. **La croissance compte, mais modérément** : une physique commune, des paramètres contrôlés.
8. **Ton doux-amer**, mystérieux, parfois inquiétant, jamais d'horreur.
9. **Conçu d'abord pour le mobile en paysage**, le tactile en premier.
10. **La sauvegarde ne doit pas se perdre facilement.**

Priorités en cas de manque de temps : mouvement > level design > contrôles tactiles > exploration/carte > capacités > croissance > Maria/narration > combat > secrets > polish audiovisuel. « Un petit contenu très bien conçu vaut mieux qu'un grand contenu médiocre. »

---

## 3. L'histoire

### Le cœur

Maria est le « bébé » de Céleste. Au début, elles sont inséparables. Puis Céleste grandit, et son rapport au jeu, aux objets et aux personnes de sa petite enfance change. Maria disparaît réellement, et Céleste part à sa recherche.

### Le monde étrange : le monde des choses perdues

> **Ce qui est perdu n'est pas forcément ce qui a disparu. C'est parfois ce qui a cessé d'avoir une place dans notre vie.**

- Chaque monde étrange naît d'un **lieu réel** (sa géométrie, ses objets), déformé : proportions, lumière, couleurs, gravité.
- Les **objets d'enfance** de Céleste n'y apparaissent que là : Roger (le singe en peluche), l'Educaville (un jouet de ville-téléphone qui sonne tout seul), la cuisine rose, le livre musical, le torchon blanc. Ce ne sont pas des objets « importants » en soi, mais ce qui a compté **pour elle**.
- Des **souvenirs** se déclenchent à leur contact : d'abord de courts flashbacks illustrés, puis des **souvenirs jouables** (Céleste plus petite), sans aucun dialogue.
- **Eden**, un vrai petit garçon, ami de Céleste chez la nounou, apparaît à la fin de l'avant-dernier niveau. C'est le point de bascule : le joueur comprend que le monde étrange contient aussi **des relations** laissées derrière soi. Après son souvenir jouable, Eden n'est plus là.
- La **nature** du monde étrange reste un mystère (surnaturel ? mémoire ? regard d'enfant ?). Son **sens**, lui, doit être compris : c'est le monde de ce qui s'éloigne de nous quand nous grandissons. Rien de tout cela n'est jamais dit par un personnage.

### La fin

Le dernier monde est consacré **uniquement à Maria** : pas de collectible, pas de boss, pas de fausse piste. « La chambre qui rapetisse » : la chambre du premier soir, d'abord immense, puis de plus en plus petite. Céleste ne change pas de taille, c'est le monde qui revient à la sienne.

**Maria est réellement retrouvée.** Céleste la serre dans ses bras, rentre dans la vraie chambre, la nuit. Au matin, elle essaie de jouer avec elle par réflexe, puis s'arrête. Les jouets d'avant sont sortis de la boîte fermée qui était sur l'étagère pendant tout le jeu : ils étaient là, rangés, elle n'y faisait plus attention. Le joueur porte Maria jusqu'à sa place sur l'étagère, fait un dernier câlin (maintenir le bouton Agir ; le relâcher, c'est la poser). Céleste quitte la chambre ; la porte se ferme. Un court « film » montre quelques semaines qui passent : des jours qui se distinguent (la pluie, le matin, le soir), le cartable posé, Céleste qui ne lève plus les yeux vers l'étagère. Un dernier signe, à peine perceptible, du monde étrange autour de Maria. Fondu au noir.

> Céleste a grandi. Elle a retrouvé Maria. Elle l'aime toujours, mais son enfance est derrière elle.

L'émotion recherchée (retour de l'auteur) : « une gorge serrée, peut-être une larme », le regard mêlé de l'enfant et du parent. Grandir n'est pas présenté comme une perte purement négative.

Après la fin, on peut **continuer à jouer** (coquilles, console).

---

## 4. Les personnages

- **Céleste** : l'héroïne. Lunettes rondes roses (son signe distinctif, le rose lui est réservé dans la palette). Quatre phases de croissance, quatre tenues : pyjama rose à pois et couettes (phase 1, ~4 ans) ; robe rose à fleurs et sabots (phase 2) ; queue de cheval et veste en jean (phase 3) ; t-shirt vert, jean, baskets à fleurs, queue de cheval plus longue (phase 4, ~7 ans).
- **Maria** : poupon métisse, toujours la même, immobile, silencieuse. Elle est vue assise dans des endroits inaccessibles, on trouve ses affaires (bandeau, bonnet, hochet, petite cuillère…).
- **Maman et papa** : présents, rassurants, jamais antagonistes, ils n'expliquent rien. Ils parlent par **bulles pictogrammes**, ne marchent jamais à l'écran (ils changent d'activité hors champ) et **ne voient jamais l'étrange**. Ils apparaissent moins à mesure que Céleste grandit, puis reviennent aux moments importants. Papa offre une console de jeu à Céleste.
- **Le chat gris** de la maison, **la nounou**, **Eden**, la maîtresse et les camarades de la classe de mer (une camarade apprend la glissade à Céleste), des passants, des animaux, un contrôleur bienveillant…

Tous les personnages ont été **illustrés** d'après des dessins et des images de l'auteur (prompts conservés dans `docs/PROMPTS_PERSONNAGES.md`).

---

## 5. Le monde : 8 niveaux

Un monde en **salles reliées par des sorties**, une seule grande chaîne, avec des boucles, des raccourcis et des revisites. Chaque niveau a son monde étrange.

| #   | Niveau                     | Ce qui s'y passe                                                                                                                          | Capacité                                                | Monde étrange, objet                                                     |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | **La maison**              | Le premier soir avec Maria, la disparition ; la maison vivante (parents, chat)                                                            | Grimper aux rebords                                     | Le salon étrange, le passage d'ombres ; Maria aperçue, inaccessible      |
| 2   | **Le jardin**              | Terrasse, potager, grand arbre, cabane ; Céleste a grandi (porte de derrière enfin ouvrable)                                              | Saut mural                                              | Derrière la haie, le jardin renversé ; le bonnet de Maria                |
| 3   | **Le quartier**            | Rue, aire de jeux (maman), supérette (papa), chantier, cour et école, connectés derrière les façades                                      | Parapluie (planer)                                      | L'école étrange ; l'Educaville                                           |
| 4   | **La gare**                | Voies, quais, hall, dépôt, objets trouvés ; **premier boss** (poursuite verticale)                                                        | Crochet du parapluie (glisser le long des câbles)       | La tour des objets perdus ; Roger, premier court souvenir                |
| 5   | **Le train de nuit**       | Départ en classe de mer, couchettes, compartiments, fourgon, toit et tunnels ; **boss** horizontal (un chariot géant chargé de vaisselle) | Glissade (au sol, avec saut long)                       | La cuisine étrange ; la cuisine rose, premier souvenir jouable           |
| 6   | **La station balnéaire**   | Plage, rochers, phare, port, fête foraine ; **la marée** à deux états ; **boss** : la vague                                               | Aucune (maîtrise des cinq)                              | La fête engloutie ; le livre musical                                     |
| 7   | **La maison de la nounou** | Presque entièrement étrange : le miroir, quatre îlots de mémoire mêlant les lieux précédents ; **boss** : l'effacement                    | **La bascule** (passer entre le présent et le souvenir) | Le torchon blanc, le retour des objets, **Eden** et son souvenir jouable |
| 8   | **Le monde de Maria**      | La chambre qui rapetisse ; facile à moyen, sans boss                                                                                      | —                                                       | Maria retrouvée                                                          |

Les **boss** sont des examens de mouvement, pas des combats : quelque chose de grand et sans visage poursuit Céleste (vers le haut, puis à l'horizontale), et il faut fuir en maîtrisant ses capacités. Les boss ne reculent jamais.

---

## 6. Le gameplay

### Le mouvement (priorité n° 1)

- Contrôleur **maison**, à pas de temps fixe (1/120 s), déterministe, identique à 60, 90, 120 ou 144 Hz.
- Accélération/décélération, saut à hauteur variable, **coyote time**, **jump buffering**, contrôle aérien, traversée des plateformes par le bas.
- Six capacités, chacune un **geste** plutôt qu'une clé : grimper aux rebords, saut mural (un seul mur ne se remonte pas), parapluie (s'ouvre au sommet d'un saut tenu), crochet sur les câbles, glissade (sous les obstacles bas, saut long), bascule entre deux couches du monde. Seules la glissade et la bascule ont un bouton à elles.
- La **croissance** change un peu la taille, le saut et la vitesse : de nouveaux rebords deviennent accessibles, **rien ne se ferme jamais en grandissant** (vérifié par les tests).
- Toutes les valeurs sont dans `src/config/`, réglables en direct dans un overlay de debug, et ont été réglées par essais sur téléphone.

### Échec et combat

- Un coup de **bâton** vers l'avant, qui ne ralentit jamais le mouvement. Ennemis à hauteur d'enfant : patrouilleurs, araignées au bout de leur fil, crabes, mouettes… Deux coups : étourdi, puis dispersé de façon abstraite.
- Pas de points de vie : une **jauge de peur** (3 crans). Les dangers du décor (orties, ronces…) la font aussi monter. Pleine, Céleste **s'évanouit** doucement et revient à la dernière **lanterne** allumée. Tomber dans l'eau ramène au dernier appui sec.
- Les **lanternes** (lampe-tempête dans le monde réel, veilleuse champignon turquoise dans les mondes étranges) sont les checkpoints. Une veilleuse principale par niveau sert au **voyage rapide**.

### Exploration et secrets

- **Le sac à dos** (un seul bouton) : le **cahier** de Céleste (carte dessinée au crayon, « Mon voyage » avec statistiques et pourcentage d'avancement, « Mes capacités »), les **trésors** (souvenirs, affaires de Maria, objets du monde étrange) et les réglages.
- **Environ 50 coquilles d'escargot** à trouver (les secrets), dont un tiers en revisite ; quand toutes les coquilles d'un lieu sont trouvées, sa page du cahier se colorie ; elles remplissent un bocal dans la chambre. Des traces de bave argentée mènent à certaines.
- **Trois disques secrets** pour le tourne-disque du grenier (easter egg).
- **Le fil discret** : après un long moment sans progrès, une petite lueur montre **où** aller, jamais **comment** (désactivable).

### La console de Céleste (mode bonus)

Offerte par papa, installée dans la chambre : un mode à part, plus compétitif, avec **un jeu par capacité** (« Les sauts », « La grimpette », « La cheminée », « Le grand vent », « Les tyroliennes », « Le couloir », « Les deux mondes », « Le monstre »). Deux modes : **Niveaux** (générés, toujours les mêmes, de plus en plus durs) et **Sans fin** (un parcours continu généré à chaque partie). Compteur en mètres, un record par jeu et par mode. Chaque niveau généré est **prouvé faisable** par un joueur scripté qui utilise la vraie physique.

---

## 7. Le ton et la direction artistique

- **Livre illustré en « papier découpé »** : aplats doux, formes arrondies, objets du quotidien à l'échelle d'une enfant, nuit bleutée, veilleuses et halos.
- **Le monde étrange** reprend les mêmes formes en silhouettes, dans une lumière crépusculaire turquoise, avec une nuance propre à chaque niveau (mousse au jardin, craie au quartier, violet bleuté à la gare, prune et cuivre dans le train, bleu canard à la mer…).
- **Céleste est une marionnette** de pièces (tête, couettes, torse, bras, jambes), animée par le code : les couettes rebondissent à chaque foulée et au saut.
- **Presque tout est dessiné par le code** (Canvas) ; n'importe quel élément peut être remplacé par une image fournie. Les personnages, les souvenirs et les trésors sont des illustrations (en partie générées par IA d'après les dessins de l'auteur).
- **L'interface** ressemble au cahier de Céleste : papier crème, lignes, crayons de couleur. Le titre est écrit au crayon, comme par une enfant (police Gaegu, incluse hors ligne). Le logo : les lunettes roses.
- **Une intro** (~45 s, aucun texte sauf le titre), jouée au lancement, passable : la boîte à musique, le premier soir, Céleste qui grandit, le berceau vide, les choses perdues en ombres.
- **Le ton** : quotidien, conte, mystère, douceur. Des étrangetés jamais expliquées (une mouette immobile en vol, une heure impossible sur le panneau des marées…). Inquiétant parfois, jamais d'horreur.

### Son

- Musiques composées par l'auteur avec **Suno** : 8 thèmes (accueil, maison, jardin, rue, gare, train, monde étrange, souvenirs jouables) et un thème de fin réservé à la fin ; jingles (trouvaille, souvenir, Maria). Bouclage en fondu enchaîné, changements de thème dans le noir.
- Bruitages fournis par l'auteur, complétés par des sons de synthèse provisoires ; vibrations sur Android.
- **Maria a son propre silence** : son apparition baisse la musique.

---

## 8. Les contrôles

- **Tactile** : à gauche, un **joystick flottant** (gauche/droite, haut/bas pour regarder, traverser, grimper) ; à droite, les boutons **en éventail autour de Saut** : Attaque/Agir, puis Glisser et Basculer quand ces capacités sont obtenues. En haut à gauche, le sac. Taille et position réglables.
- **Clavier** également pris en charge (la manette est prévue par l'abstraction, pas encore branchée).
- Le gameplay ne lit jamais directement l'écran tactile ou le clavier : tout passe par une abstraction **`InputAction`** (Move, Jump, Attack, Ability, Shift, Interact, Pause, Map).
- Message « Tourne ton téléphone » en portrait ; gestes du navigateur neutralisés ; l'écran reste allumé ; le bouton retour d'Android ouvre la pause.

---

## 9. La technique

| Domaine              | Choix                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Moteur**           | **Phaser 4** (4.2.x), pour le rendu, les scènes et l'input uniquement (Phaser 4 plutôt que 3 : la branche maintenue)                                                                                                                                                                                                                                                                   |
| **Langage**          | **TypeScript strict**, aucun `any` sans justification                                                                                                                                                                                                                                                                                                                                  |
| **Outillage**        | **Vite** (build, serveur de dev accessible sur le réseau local pour tester sur téléphone), **Vitest** (tests), **ESLint** (typescript-eslint `strictTypeChecked`), **Prettier**                                                                                                                                                                                                        |
| **Physique**         | Pas d'Arcade Physics : un contrôleur maison en TypeScript pur, pas fixe de 1/120 s, collisions AABB contre une grille de tuiles de 16 px, interpolation à l'affichage                                                                                                                                                                                                                  |
| **Résolution**       | Hauteur logique fixe de 360 px, largeur de 640 à 800 px selon l'écran, rendu à la résolution de l'écran                                                                                                                                                                                                                                                                                |
| **Niveaux**          | Salles décrites en **ASCII** avec des directives (`; @decor:`, `; @lantern:`, `; @chase:`, `; @tide:`, `; @shift:`…) ; zones, liaisons et histoire en **données**                                                                                                                                                                                                                      |
| **Histoire**         | Système d'événements piloté par des données : déclencheurs (Agir ou contact), conditions sur les étapes vécues, scripts courts (fondus, bulles, poses), objets de mise en scène                                                                                                                                                                                                        |
| **Sauvegarde**       | **IndexedDB** (repli `localStorage`), schéma versionné (v4) avec migrations, validation stricte, somme de contrôle, écriture atomique, conservation de la sauvegarde précédente valide, demande de stockage persistant, **code de sauvegarde** exportable/importable, **3 emplacements** de partie, réglages communs à l'appareil. Les identifiants sauvegardés sont figés par un test |
| **Hors ligne**       | **PWA** (`vite-plugin-pwa`, Workbox), précache complet, mise à jour au lancement suivant                                                                                                                                                                                                                                                                                               |
| **Audio**            | `HTMLAudioElement` plutôt que des tampons Web Audio (mémoire), fichiers Opus/Ogg préparés par un script (`npm run audio:prepare`)                                                                                                                                                                                                                                                      |
| **Dépendances**      | Une seule dépendance d'exécution : Phaser                                                                                                                                                                                                                                                                                                                                              |
| **CI / déploiement** | GitHub Actions : typecheck, lint, format, tests, build puis publication sur GitHub Pages à chaque push sur `main` ; les PR lancent les mêmes vérifications                                                                                                                                                                                                                             |

### Architecture

```
src/
  config/    toutes les valeurs de gameplay (mouvement, croissance, caméra, combat, audio, console…)
  core/      la logique pure, sans Phaser : physique, joueur, histoire, sauvegarde, analyse,
             console, poursuites (boss), monde, aide, audio, caméra
  levels/    les salles en ASCII et les données de chaque zone (liaisons, histoire, carte)
  scenes/    les scènes Phaser (affichage)
  ui/        l'interface (cahier, sac, menus, commandes tactiles)
  platform/  le navigateur (stockage, PWA, plein écran)
  debug/     les outils de debug (absents du build principal)
```

Environ **78 000 lignes** de TypeScript, **plus de 150 fichiers de tests** (environ 1 100 tests Vitest).

### Ce qui fait la solidité du projet

- **La logique est pure et testée** : mouvement, sauvegarde, histoire, voyage rapide, générateurs de la console… sont des fonctions indépendantes de Phaser.
- **Une analyse de faisabilité automatique** : un simulateur rejoue la vraie physique pour vérifier que chaque passage de chaque salle est faisable, mesurer sa difficulté (en millisecondes de marge), prouver qu'on n'est jamais coincé, qu'une capacité est bien nécessaire là où elle doit l'être, et que la croissance ne ferme rien.
- **Des outils de debug** (en développement et sur un build de debug publié à part, jamais dans le build principal) : hitboxes, vitesse, état du joueur, réglage du mouvement en direct avec export JSON, téléportation, déblocage des capacités, phase de croissance, étapes de l'histoire, rejouer la fin, inspection de la sauvegarde, compteur de saccades, statistiques par salle.
- **Les performances mobiles** : aucune allocation par image, décor dessiné une fois par salle en blocs de textures, peu de GameObjects.

---

## 10. La méthode de travail

- Le jeu a été développé avec **Claude Code**, à partir d'une spécification détaillée (~1 900 lignes) et d'un document d'histoire, écrits en amont par l'auteur.
- **Une phase = une branche = une session**, découpée en petites PR. Ordre suivi : mouvement → plateforme d'essai → contrôles tactiles → combat minimal → checkpoints et sauvegarde → première zone → vertical slice → croissance → carte → narration → contenu.
- **Avant de coder** : un plan court, les risques signalés ; toute modification du mouvement, de la progression, de Maria, du monde, de la croissance, de la sauvegarde ou de la boucle de jeu est **signalée et validée** avant d'être appliquée.
- Les choix importants passent souvent par des **maquettes et story-boards interactifs** (Artifacts) avant l'implémentation.
- Chaque décision est notée dans `docs/DECISIONS.md` (près de 200 décisions, « D-01 » à « D-192 »), l'avancement dans `PROGRESS.md`.
- **Tout se juge sur un vrai téléphone** : un mouvement n'est jamais déclaré « bon » d'après le code seul. Les retours d'essai de l'auteur ont donné lieu à de nombreuses passes (la fin a été refaite trois fois).
- Ce qui n'est pas tranché reste un **PLACEHOLDER clairement marqué**, traité comme un paramètre.
- Identifiants de code en anglais ; textes du jeu, docs et échanges en français.

---

## 11. Ce qui reste ouvert

- Les réglages finaux d'après les essais sur téléphone (mouvement, console, nuances des mondes étranges).
- Quelques bruitages encore provisoires.
- Le contenu des trésors du sac et une éventuelle récompense par famille complète.
- Pas de version iPhone prévue ; les droits de la musique et l'écran de crédits ne sont pas bloquants pour une diffusion privée.

---

## 12. Ce qu'on peut retenir de MARIA pour un autre projet

- Commencer par **le mouvement**, le valider sur téléphone, avant tout contenu.
- Une **physique maison, pure et testable**, permet de vérifier automatiquement le level design.
- Mettre **toutes les valeurs en configuration** et les régler en direct dans un overlay.
- Piloter **niveaux et histoire par des données**, pas par du code.
- Une **sauvegarde robuste** dès le début (versions, migrations, sauvegarde précédente, export).
- **Peu de texte**, des gestes et des images : l'émotion passe par la mise en scène.
- Des **piliers écrits** et une liste de ce qui reste volontairement ouvert, pour ne rien figer trop tôt.
