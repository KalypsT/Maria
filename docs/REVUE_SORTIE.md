# MARIA — Revue avant la sortie privée (14 octobre 2026)

Revue demandée par l'utilisateur : tout ce qui manque et tout ce qui peut être amélioré pour la
première version complète (diffusion privée, pour sa compagne, puis sa fille). Faite après lecture
de toute la documentation (spec, histoire, `DECISIONS.md` jusqu'à D-181, `PROGRESS.md`, bulles,
coquilles, lanternes, bruitages) et du code, avec un essai du jeu dans Chromium (844 × 390, tactile
émulé) : l'écran titre, le premier soir, le sac, puis chaque niveau par le build de debug.

## Le bilan en bref

Le jeu est **complet et cohérent** : les huit niveaux se jouent du premier soir à l'écran de fin,
l'histoire suit fidèlement le document d'histoire (le monde des choses qu'on laisse derrière soi,
Eden, Maria retrouvée puis rangée, le dernier signe). Typecheck, lint, format et build passent ; la
suite de tests est très large (faisabilité de chaque salle, « jamais coincée », sauvegarde figée).
Le monde réel est joli (papier découpé, personnages illustrés, la chambre, la rue, la promenade).

Ce qui manque pour une sortie sereine tient en six points :

1. **Personne n'a encore joué le jeu d'une traite**, depuis une nouvelle partie, sur le build
   principal : 463 cases « à vérifier sur téléphone » restent ouvertes dans `PROGRESS.md`.
2. **Les premières minutes** n'accueillent pas une joueuse qui découvre : le joystick est invisible,
   Maria est minuscule et rien ne la désigne, papa est caché sous les boutons.
3. **Les mondes étranges sont trop sombres** : les meubles y ont presque la couleur des murs, sous un
   voile et un vignettage forts. Le niveau 7 (chez la nounou, 13 salles, le cœur émotionnel avec
   Eden) se lit comme une boîte noire vide.
4. **Le son** : 17 bruitages et 5 voix manquent ; le niveau 6 entier joue la musique de la rue, le
   niveau 7 entier celle des mondes étranges, et les deux souvenirs jouables sont muets
   (`memory-play`).
5. **La difficulté n'a pas de filet** pour une joueuse qui n'a pas l'habitude des plateformes au
   tactile (plusieurs sauts « difficiles » de 67 à 92 ms sur le chemin principal, quatre poursuites).
6. **Quelques risques techniques** faciles à éviter : aucun filet en cas d'erreur (écran figé), le
   bouton « Passer en mode debug » visible dans le jeu, le dépôt et le site publics avec des images
   tirées de photos de vraies personnes.

## 1. À faire avant de donner le jeu (bloquant)

### 1.1 Une partie complète, d'une traite

- Sur le téléphone de la joueuse (ou le même modèle), le build principal
  (https://kalypst.github.io/Maria/), « Nouvelle partie », **sans debug**, du premier soir à l'écran
  de fin. C'est le seul vrai test de la boucle complète : les essais précédents partaient des
  histoires du debug (le bug de l'écran noir du réveil, D-171, n'apparaissait qu'en jouant le
  passage de la nuit au matin).
- Noter le temps total (la page « Mon voyage » le donne), les endroits où l'on bloque et où l'on
  meurt souvent : le code de sauvegarde contient les stats par salle (temps, évanouissements, fil
  discret, D-153).
- Remplacer les 463 cases ouvertes par une seule liste courte « vu en jouant » : la plupart ont sans
  doute été vues pendant les retours d'essai, sans être cochées.

### 1.2 Les premières minutes (l'accueil)

- **Le joystick est invisible** tant qu'on ne touche pas l'écran (`TouchSource` : la base n'apparaît
  que sous le pouce). On voit « Saut » et « Action », rien pour se déplacer. Proposition : un
  joystick fantôme (pâle) à sa place habituelle à gauche, jusqu'au premier déplacement, et peut-être
  un pouce qui glisse, sans texte.
- **Maria est minuscule** (environ 10 px à l'écran) sur le tapis, dans un coin sombre, et l'étincelle
  n'apparaît qu'à côté d'elle (zone de 4 × 3 tuiles). Rien n'attire l'œil vers elle au tout début,
  alors que tout le jeu repose sur l'attachement à ce premier soir. Proposition : à l'ouverture de la
  partie, le regard de la caméra vers Maria (l'étape `look`, avec le `zoom` de D-171), une bulle
  cœur, puis le retour sur Céleste.
- **Papa est caché sous les boutons** dès la première image (la chambre fait la largeur de l'écran ;
  la porte est sous « Saut » et « Action »).

### 1.3 Un filet en cas d'erreur

- Aucun écouteur `error` / `unhandledrejection` : une erreur de rendu fige le jeu (musique et boutons
  continuent, image noire), comme au réveil de la fin avant D-171. Proposition : un petit écran sans
  jargon, « Oups » et un bouton pour reprendre à la dernière lanterne (rechargement, comme « Retour à
  l'accueil » ; la partie est déjà sauvegardée).

### 1.4 Le bouton « Passer en mode debug »

- Il est dans les réglages du build principal (`SettingsPanel`, D-59). Un toucher par erreur
  emmène la joueuse sur `/debug/` (bouton DEBUG, infos, pas de hors ligne). Proposition : le retirer
  du build principal, ou le cacher (par exemple cinq touchers sur la version de l'écran titre).

### 1.5 L'installation sur son téléphone

- Android : « Installer le jeu » depuis l'écran titre, puis ouvrir une fois en Wi-Fi le temps que les
  **45 Mo** du précache se téléchargent (musique 23 Mo, images 22 Mo) avant de jouer hors ligne.
- iPhone (si c'est son téléphone) : Partager, « Sur l'écran d'accueil » ; sans installation, Safari
  efface le stockage après 7 jours sans visite (D-22). Pas de vibrations sur iPhone.
- Lui montrer le code de sauvegarde (Réglages → Code de sauvegarde) : une copie de temps en temps
  dans une note.

## 2. Le son

### 2.1 Les bruitages manquants, pour le week-end

Tous sont déjà branchés (un emplacement vide reste silencieux) : il suffit de déposer les fichiers
et de lancer `npm run audio:prepare -- --sfx`. Par ordre d'utilité (liste de `docs/BRUITAGES.md`) :

1. `thought` (chaque bulle de pensée), `door`, `map-open` / `map-close` (le sac) ;
2. `ledge-grab`, `wall-jump`, `wall-slide` (boucle), `land-big`, `step-fabric` ;
3. `slide`, `step-metal`, `hint` ;
4. `chase-wake`, `chase-rumble` (boucle) : les quatre poursuites sont aujourd'hui sans menace sonore ;
5. `lullaby` (4 à 6 notes de boîte à musique) et `eden-giggle` : deux moments forts de la fin ;
6. `attack`, `hit`, `enemy-scatter`, `erase`, `wave-warn`, `tunnel`.

Sources libres (CC0) : Kenney (« Interface Sounds », « Impact Sounds », « RPG Audio » : pas, tissu,
pages, portes), freesound.org filtré « Creative Commons 0 ». Les notes de `lullaby` peuvent être
synthétisées (timbre de boîte à musique) si le temps manque.

### 2.2 La musique

- `memory-play` : **les deux souvenirs jouables (la cuisine rose, Eden) sont muets**. C'est le plus
  important des morceaux manquants : le souvenir d'Eden est le point de bascule de l'histoire.
- **Un thème de la mer** : le niveau 6 (le plus long, « très travaillé ») joue la musique de la rue
  (D-98, faute de morceau). Il faudrait un emplacement `sea` (une ligne dans `MUSIC_TRACKS`, un
  `@music` ou une règle de monde).
- **Un thème de chez la nounou** (autrefois, une berceuse un peu passée) : les 13 salles du niveau 7
  jouent le thème générique des mondes étranges.
- La console joue le thème de l'accueil et des bips synthétisés (acceptable).
- Le budget le permet : 23 Mo sur 32.

## 3. L'esthétique

### 3.1 Les mondes étranges, trop sombres (le plus visible)

- Dans `STRANGE_PALETTE`, les meubles (`wood`, `fabric`, `toy`, `leaf` : `#231c3f`), la structure et
  le sol (`#1c1632`) et les murs (`#2c2344`) ont presque la même valeur, sous `darkness: 0.42` et
  `vignette: 0.5`. Chez la nounou (`nanny`), c'est pire : `#2b2236` sur `#342a40`. Seuls les liserés
  turquoise se lisent : les salles paraissent vides.
- **Essai fait (non commité)** : des silhouettes plus claires (`#3b2f60`, nounou `#4a3c5e`),
  `darkness` 0,26, `vignette` 0,3. Les masses (canapé, table, gros cube de la salle de jeux)
  apparaissent, les liserés restent nets. Capture avant/après envoyée avec la revue. Une à deux
  heures avec le test de contraste (`strangeThemes.test.ts`) et des captures de chaque monde.
- Plus long, si l'on veut aller plus loin : un liseré intérieur ou quelques détails par meuble en
  silhouette (le canapé, la bibliothèque, la table de la nounou), pour qu'on reconnaisse « la maison
  vue à hauteur de tout-petit ».

### 3.2 Céleste cachée sous les boutons

- La caméra est bornée à la salle : au bord droit, Céleste passe sous « Saut » / « Action ». C'est le
  cas **à l'arrivée du niveau 8** (le berceau immense, colonne 88 sur 96), au début du passage
  d'ombres, et à la porte de la chambre. Propositions : déplacer les arrivées concernées, ou laisser
  la caméra dépasser la salle d'une largeur de boutons à droite quand les commandes tactiles sont
  affichées (la couleur d'ambiance au-delà du mur, comme aujourd'hui pour les petites salles).

### 3.3 Les moments-clés vus de près

- Céleste fait environ 7 % de la hauteur de l'écran, Maria encore moins (choix validé, D-124). Pour
  quelques moments seulement, le zoom de `look` (D-171) pourrait rapprocher la vue : Maria sur le
  tapis au premier soir, Maria en haut de la bibliothèque, Eden dans la salle de jeux.

### 3.4 Le poids des images

- `public/art` pèse 22 Mo en PNG (les personnages, environ 250 Ko chacun). En WebP, comme les
  trésors (D-170), le premier téléchargement maigrirait de 15 Mo environ. Facultatif.

### 3.5 Les saccades

- Dans Chromium (sans GPU), le dessin d'un bloc de décor prend jusqu'à 560 ms sur le fil principal.
  Sur téléphone, le compteur de saccades (D-124, INFOS du build de debug) n'a jamais été relevé : à
  faire pendant la partie complète, dans la rue, la promenade et la gare.

## 4. L'histoire : la rendre bien compréhensible

- **« Quelques mois plus tard »** (trois fois) n'est montré que par un long noir et Céleste qui a
  changé de tenue. Sans texte (pilier 6), un plan pendant le noir : la toise dont le nouveau trait se
  dessine, ou la fenêtre qui passe d'une saison à l'autre.
- **La nounou et Eden arrivent sans avoir été annoncés** : rien avant le niveau 7 ne dit que Céleste
  allait chez une nounou. Pour ta compagne, qui les reconnaîtra, ça marche ; pour ta fille plus tard,
  une graine plantée tôt aiderait : une photo ou un dessin de Céleste et Eden sur le frigo de la
  cuisine, ou un souvenir de la maison.
- **Les quatre cubes du niveau 7** ont remplacé Roger, l'Educaville, la cuisine rose et le livre
  (D-122, pour la clarté du système). Le niveau dit moins « tout ce que j'ai laissé derrière moi » ;
  ces objets pourraient rester visibles, pâlis, dans le décor de la salle de jeux (sans mécanique).
- **Le câlin final (Agir maintenu)** est une mécanique nouvelle qui n'apparaît qu'à la toute fin. Le
  cœur qui se remplit est un bon signe ; à vérifier qu'une joueuse qui tapote comprend qu'il faut
  garder le doigt appuyé.
- **Les indices des capacités** : un texte technique à la 3e personne (« Céleste glisse… »), affiché
  5 s pendant qu'on joue (`ABILITY_HINT_MS`). Les garder affichés jusqu'au premier essai réussi, ou
  au moins 8 à 10 s ; ils restent relisibles dans « Mes capacités ».
- **L'écran de fin** est sans texte. Pour un cadeau, une dédicace (« Pour … ») après l'écran de fin
  ou sur l'accueil après la fin serait un beau geste (hors fiction, donc hors pilier 6) : à décider.

## 5. La difficulté et le confort

- Sur le chemin principal : la flèche de la grue (le parapluie, difficile), l'école étrange après sa
  veilleuse (difficile), le saut long de la fête engloutie (67 ms), les trois sauts de la chambre de
  la sieste (67 ms chacun), plus les poursuites (la tour, le train de la vaisselle, la vague, la cage
  d'escalier). Les fenêtres sont mesurées au timing parfait d'un clavier ; au pouce, c'est plus dur.
- Si la joueuse n'est pas habituée : un **« mode doux »** dans les réglages, sans toucher au mode
  normal : coyote time et jump buffer de 100 à 160 ms, poursuites 15 % plus lentes, jauge de peur de
  3 à 5. Tout devient plus facile, rien ne devient impossible (l'analyse de faisabilité le garantit
  par construction). C'est un changement de mouvement : à valider.
- Le fil discret (3 puis 5 min) est une bonne aide ; le garder activé par défaut.

## 6. Technique et diffusion

- **Dépôt et site publics** : le dépôt GitHub `KalypsT/Maria` est public, comme
  https://kalypst.github.io/Maria/. Il contient des images générées d'après des photos de vraies
  personnes (la nounou, Eden, un enfant). À décider : l'accord des familles, ou un hébergement privé.
- Le paquet JavaScript fait 2,6 Mo (685 Ko compressé) : correct.
- La version affichée sur l'accueil est utile pour les retours ; elle peut rester.
- Après la sortie, la liste figée des identifiants (`saveIds.test.ts`) protège les parties en cours :
  ne plus retirer de lanterne, de coquille ni d'étape sans migration.

## 7. Plan proposé pour le week-end

1. **Jeudi–vendredi** (code, une branche) : le joystick fantôme et le regard vers Maria au début ;
   l'écran « Oups » ; le bouton de debug retiré du build principal ; la palette des mondes étranges ;
   les arrivées sous les boutons ; l'indice des capacités plus long.
2. **En parallèle** (toi) : les bruitages de la liste 2.1 et `memory-play` (puis la mer et la nounou
   si possible) ; je les prépare et les branche.
3. **Samedi** : la partie complète d'une traite sur le téléphone, la liste des blocages, les
   corrections.
4. **Dimanche** : le dernier déploiement, l'installation sur son téléphone, un code de sauvegarde de
   départ.
