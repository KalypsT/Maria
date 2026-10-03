# Avancement

## Phase en cours

**La station balnéaire** (niveau 6, D-82, D-95) : plan validé en 10 PR (la marée à deux états, pas de nage, la baie en boucle, la fête foraine, la fête engloutie et la vague, le livre musical, le couloir de la fin). **PR 1 faite : la marée et l'eau** (D-96, D-97, fusionnée). **PR 2 faite : l'arrivée, la promenade, le centre** (D-98) **PR 3 faite : la plage, les rochers, la première marée, le banc, les vagues** (D-99) **PR 4 faite : le phare, le port, la boucle de la baie** (D-100) **PR 5 faite : la jetée, la fête foraine, le soir, les chaises volantes** (D-101, fusionnées) et **PR 6 faite : la fête engloutie** (D-102) **PR 7 faite : le rythme de la vague, parcours d'essai 14** (D-103) **PR 8 faite : la vague dans le niveau, le livre musical** (D-104) et **PR 9 faite : le court souvenir, la nuit, le couloir en boucle, la fin** (D-105), sur `ccr-014503d9-cj0c7a`. **Le niveau 6 est complet** (sa fin reste un PLACEHOLDER jusqu'au niveau 7). Suite : essais sur téléphone, puis le niveau 7. Le parcours d'essai 13 « Marée » n'a pas encore été essayé sur téléphone.

**Le train** (niveau 5, D-83 à D-91) : complet et fusionné. La glissade n'a pas encore été essayée sur téléphone (l'utilisateur a demandé de continuer).

**Structure de la fin du jeu** (D-82) : 8 niveaux (maison, jardin, quartier, gare, train, station balnéaire, avant-dernier, monde de Maria). Niveau 6 : plan validé (D-95). Niveau 7 : piste retenue (presque entièrement étrange), détails décidés le moment venu ; la phase 4 de croissance viendra avec lui.

**Passe graphique** (D-71 à D-81) : terminée, tout le monde réel est refait d'après la grille du salon. L'étape 4 (identifiants fixes des trouvailles et lanternes) est écartée jusqu'à la sortie (**à reprendre avant de diffuser le jeu**, pilier 10).

**En attente** :

- essais sur téléphone de l'utilisateur (gare, passe graphique, glissade) ; les listes « À vérifier sur téléphone » ci-dessous restent ouvertes ;
- **musique** (D-57, D-92) : 7 premiers fichiers intégrés ; les autres morceaux arrivent (à préparer avec `npm run audio:prepare`, budget 25 Mo, 7,2 Mo pris ; 8 thèmes depuis D-94) ;
- mouvement et difficulté validés pour l'instant ; valeurs du saut mural jamais réglées au téléphone.

## Fait

### La station balnéaire, PR 9 : le court souvenir, la nuit, le couloir en boucle, la fin (D-105)

- **Le court souvenir** du livre musical : Céleste toute petite, seule, appuie sur un bouton, des notes s'en échappent (rejouable dans le cahier).
- **La nuit au dortoir** : les enfants dorment ; la mélodie du livre ; une lueur sous la porte du dortoir.
- **Le couloir en boucle** : cinq couloirs pareils en anneau, le décor change à chaque tour (ordinaire, le sable, la chambre et la toise, l'horloge et les valises, la mer en bas et le ciel à l'envers) ; au dernier, une porte qui n'était pas là ; le noir, la fin du niveau 6 (la suite : « ? », PLACEHOLDER).
- DEBUG → Histoire : « le livre musical trouvé, la nuit au dortoir », « la fin de la station balnéaire ».
- Tests : 712. Vérifié dans Chromium : le court souvenir, le dortoir la nuit (enfants endormis, la porte), les cinq couloirs, la porte et la fin.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le livre musical trouvé, la nuit au dortoir », puis la porte du dortoir) : comprend-on qu'il faut ouvrir la porte ? La mélodie (bulle) suffit-elle ?
- [ ] Le couloir : remarque-t-on qu'il revient sur lui-même et qu'il change ? Cinq tours, trop long ou juste ? Inquiétant sans faire peur ?
- [ ] Le court souvenir du livre : se reconnaît-on Céleste toute petite ? Le livre ?
- [ ] La fin (le noir, puis « ? ») : acceptable comme attente du niveau 7 ?

### La station balnéaire, PR 8 : la vague dans le niveau, le livre musical (D-104)

- **La vague** : au sortir de la fête engloutie, une vague immense poursuit Céleste sur le platelage englouti ; quatre tronçons, une veilleuse au début de chacun (le comptoir, la cheminée des chevaux, le grand bassin et la poutre basse, la cheminée au-dessus de l'eau, les chevaux dans l'eau) ; elle se brise contre la digue.
- **Le livre musical**, sur le toit du carrousel étrange : un souvenir du monde étrange ; le cercle se referme, Céleste est assise sur sa couchette au dortoir ; Maria, puis le lit (fin provisoire : le court souvenir et la nuit avec la PR 9).
- DEBUG → Histoire : « le livre musical trouvé (fin de la mer étrange) ».
- Tests : 706. Vérifié dans Chromium : la vague au départ, la cheminée, la digue, le livre sur le toit du carrousel, la fin sur la couchette.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « la fête engloutie (le carrousel) », puis traverser la fête engloutie) : la poursuite est-elle difficile mais juste ? Les veilleuses sont-elles assez proches ?
- [ ] Le reflux se voit-il assez pour qu'on pense à monter les cheminées à ce moment-là ?
- [ ] La digue et la vague qui s'y brise : se comprend-il qu'on est sauvée ?
- [ ] Le livre musical : se reconnaît-il comme un livre d'enfant ? Le dessin dans le cahier ?

### La station balnéaire, PR 7 : le rythme de la vague (D-103)

- **La vague** : une poursuite horizontale qui déferle (plus vite que Céleste), puis se retire un instant ; on monte les cheminées pendant le reflux. Dessin PLACEHOLDER : une masse d'eau de toute la hauteur, un front d'écume turquoise, des chevaux de bois et des ballons dans l'eau, la crête qui s'avance et se replie.
- **Parcours d'essai 14 « La vague »** : une barrière basse et une cheminée à pied sec ; un bassin et une cheminée au-dessus de l'eau ; un dernier bassin, une barrière, la digue où la vague se brise.
- Réglages `surgeMs`, `backwashMs`, `backwashSpeed` dans DEBUG → Combat.
- Tests : 701. Vérifié dans Chromium : la vague dans le parcours 14 (le front, la crête, le contact).
- [ ] À vérifier sur téléphone (menu pause → Parcours d'essai → « 14. La vague ») : le rythme se lit-il (la crête qui s'avance, puis se replie) ? Comprend-on qu'il faut attendre le reflux pour monter ?
- [ ] La vague plus rapide que Céleste quand elle déferle : stimulant, ou injuste ? Les durées (`surgeMs`, `backwashMs`) et le recul (`backwashSpeed`) sont-ils justes ?
- [ ] La cheminée au-dessus de l'eau pendant la poursuite : trop punitive (l'eau ramène au dernier appui, la vague continue) ?

### La station balnéaire, PR 6 : la fête engloutie (D-102)

- **Le monde étrange** : le soir, Agir devant le carrousel ; la lueur, le tremblement, le cercle : la fête de la jetée sous une eau immobile (difficile). Le carrousel y ramène ensuite.
- **La salle** : le toit du carrousel englouti, la cheminée des chevaux (saut mural), la première veilleuse ; deux guirlandes au-dessus de l'eau (le crochet), la grande roue noyée ; le toit d'un stand, la toile tombée (glisser dessous), la seconde veilleuse ; le saut long sous l'auvent bas jusqu'au flanc d'un cheval (difficile), le toit du dernier stand.
- **Fin provisoire** : la mer gronde, « ? », retour devant le carrousel (la vague viendra avec les PR 7 et 8).
- DEBUG → Histoire : « la fête engloutie (le carrousel) ».
- Tests : 690. Vérifié dans Chromium : l'entrée par le carrousel (le cercle, la bulle), l'arrivée, la traverse, le toit du stand, l'auvent, le toit du dernier stand, la fin provisoire et le retour sur la jetée.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le soir de la fête, la jetée », puis le carrousel) : l'entrée se comprend-elle ? La fête engloutie inquiète-t-elle sans faire peur ?
- [ ] La cheminée des chevaux : voit-on qu'on passe sous la barre qui flotte ? Les guirlandes au-dessus de l'eau : le saut de l'une à l'autre est-il lisible ?
- [ ] Le saut long sous l'auvent (difficile, 67 ms) puis le saut mural le long du cheval : juste, ou frustrant ? La seconde veilleuse est-elle assez proche ?
- [ ] Tomber dans l'eau (retour au dernier appui, la peur) : trop punitif dans une salle difficile ?
- [ ] Le dessin en silhouettes : les chevaux, les toiles, les stands se lisent-ils sur un petit écran ?

### La station balnéaire, PR 5 : la jetée, la fête, le soir (D-101)

- **Le soir** : après le carrousel vu du phare, la maîtresse emmène la classe à la fête ; toute la baie passe au soir.
- **La jetée** (salle de marée) : les stands où l'on glisse sous le comptoir, **les chaises volantes** (elles balaient à hauteur de tête : on se couche ou on attend), le saut long sous le toit bas de la pêche aux canards, les guirlandes (le crochet), la grande roue, le carrousel. Sous la jetée, à marée basse, les pilotis et une trouvaille.
- Le carrousel : la lumière vacille ; Agir : « ? » (le monde étrange viendra).
- DEBUG → Histoire : « le soir de la fête, la jetée ».
- Tests : 684. Vérifié dans Chromium : la jetée le soir (stands, chaises volantes qui descendent, guirlandes allumées, grande roue, carrousel), la promenade le soir, la jetée à marée haute.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le soir de la fête, la jetée ») : les chaises volantes se lisent-elles ? L'annonce (`sweepWarnMs`) suffit-elle ? Pense-t-on à se coucher ?
- [ ] Le saut long sous le toit bas (moyen) : juste ? Les guirlandes : les voit-on comme un chemin ?
- [ ] Le soir sur la baie (palette du crépuscule) : agréable ? Les ampoules de la fête suffisent-elles ?
- [ ] Le carrousel et ses chevaux tournés à l'envers : inquiétant sans faire peur ?

### La station balnéaire, PR 4 : le phare, le port (D-100)

- **La boucle de la baie** : rochers → porte du phare → galerie → passerelle → port → grille du port → promenade.
- **Le phare** : l'escalier en colimaçon cassé, la chambre du gardien, une cage étroite (saut mural), la salle de la lanterne ; du haut, Céleste voit la lueur sous le carrousel (la fête viendra). Défi moyen : la lentille.
- **Le port** (salle de marée) : la passerelle finit au-dessus des bateaux (deux sens à marée haute, sens unique à marée basse), les bateaux et leurs drisses qui montent, le ponton, la vase et ses crabes, le quai, **le banc du port**, la grue, des mouettes. Défis faciles : la buse sous le quai (marée basse), la cabine de la grue.
- Étrangetés : une mouette immobile en plein vol, l'horloge à treize repères, le cœur turquoise de la lentille.
- Tests : 678. Vérifié dans Chromium : le phare de bas en haut, la passerelle, les bateaux échoués puis à flot, le quai, la capitainerie, la grue, la grille du port ouverte.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « la première marée, le banc ») : trouve-t-on la porte du phare, puis la galerie et la passerelle ? Comprend-on qu'à marée basse on ne remonte pas à la passerelle ?
- [ ] Le phare : l'escalier cassé (tous les 3 rangs) est-il agréable, ou trop long ? La cage le long du mur (saut mural) ?
- [ ] Le port : les bateaux à flot se lisent-ils comme des appuis ? Les drisses donnent-elles envie ? Les mouettes piquent-elles de façon lisible ?
- [ ] Les étrangetés se remarquent-elles sans être expliquées (la mouette immobile, l'horloge) ?

### La station balnéaire, PR 3 : la plage, les rochers, la première marée (D-99)

- **La plage** (salle de marée) : marée basse, le sable, les flaques, les crabes, l'arche du gros rocher, une grotte où l'on entre couchée ; marée haute, des cabines à la chaise du maître-nageur, la drisse (crochet), le haut des pieux, les bouées qui ont monté. La balise au large et sa trouvaille, à marée haute seulement.
- **Les rochers** (salle de marée) jusqu'au pied du phare : la cheminée (saut mural), le rocher de la lanterne, le câble du pêcheur ; à marée haute, **les vagues** et un saut bas difficile sous l'arche ; à marée basse, la grotte et sa trouvaille (difficile).
- **La première marée** : la pêche à pied avec la classe ; la maîtresse montre la mer qui monte ; Céleste sur le banc de la promenade. **Le banc des marées** sert ensuite (rejouable).
- DEBUG → Histoire : « la première marée, le banc ».
- Tests : 670. Vérifié dans Chromium : la pêche à pied, la plage aux deux marées (pieux, bouées, balise, cabines, chaise), les rochers aux deux marées (la vague, la lanterne, la grotte, le pied du phare), le banc.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « la classe de mer, au centre », puis la plage) : la pêche à pied et la mer qui monte se comprennent-elles ? Le banc se trouve-t-il, et comprend-on qu'il change la marée ?
- [ ] La plage à marée haute : les planés entre les pieux et les bouées (moyen) sont-ils justes ? La drisse se voit-elle ? La balise donne-t-elle envie ?
- [ ] Les vagues : l'annonce (la crête qui monte, `waveWarnMs`) laisse-t-elle le temps de s'abriter ? Trop souvent (`wavePeriodMs`) ? La poussée (`wavePushX`, `wavePushY`) jette-t-elle trop souvent à l'eau ?
- [ ] Le saut sous l'arche à marée haute (difficile) : juste, ou frustrant ? Prend-on le réflexe de revenir au banc pour passer à marée basse ?
- [ ] La grotte des rochers (difficile, la flaque sous le plafond bas) : juste ?
- [ ] Les crabes se lisent-ils comme des crabes ? Les rochers, comme des rochers ?

### La station balnéaire, PR 2 : l'arrivée, la promenade, le centre (D-98)

- **L'arrivée** : Agir près de la maîtresse sur le quai ; la classe part au centre (le dortoir, les sacs, la camarade) ; Céleste pense à Maria. La sortie de la gare de la mer est fermée jusque-là.
- **La promenade** : l'ancre, la grille du port et l'escalier de la plage (fermés pour l'instant, « ? »), la lanterne et le banc, le kiosque à glaces, les lampadaires, le centre et son enseigne. Défi moyen jusqu'au toit du centre (une trouvaille).
- **Le centre** : le réfectoire, l'escalier, le dortoir. Défi moyen par la suspension jusqu'à la poutre (une trouvaille).
- **Le cahier** : une page « La mer ».
- DEBUG → Histoire : « la classe de mer, au centre ».
- Tests : 660. Vérifié dans Chromium : le quai et la classe, la promenade de bout en bout (le kiosque, les lampadaires, la façade, le toit), le réfectoire, l'escalier, le dortoir, la poutre.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le train arrivé, la gare de la mer », puis la maîtresse) : l'arrivée se comprend-elle ? Trouve-t-on la sortie de la gare, puis la porte du centre ?
- [ ] La promenade : agréable à parcourir ? Le défi des lampadaires et des balcons se voit-il depuis le kiosque ? Juste (moyen) ?
- [ ] Le centre : l'escalier (une marche toutes les deux colonnes) est-il pénible ? La suspension se remarque-t-elle comme un appui ?
- [ ] Le dessin : la façade, le kiosque, l'ancre, l'enseigne se lisent-ils sur un petit écran ? Les herbes d'avant-plan sur la digue gênent-elles ?

### La station balnéaire, PR 1b : l'eau, le parcours 13 (D-97)

- **L'eau ramène au bord** : une chute dans l'eau éclabousse, la peur monte d'un cran, Céleste reprend pied sur son dernier appui sec (les deux pieds au sol). Au dernier cran, elle s'évanouit (retour à la lanterne). L'eau ne pique plus comme les orties.
- **Le dessin de l'eau** (PLACEHOLDER) : plus sombre en profondeur, une ligne de surface, des vaguelettes qui défilent.
- **DEBUG** : case « Marée haute ».
- **Parcours d'essai 13 « Marée »** : à marée basse, la flaque, la glissade sous la digue (une trouvaille noyée à marée haute), la cheminée en saut mural ; à marée haute, le ponton et le bateau montés, par le haut.
- Tests : 653. Vérifié dans Chromium : la chute dans la flaque et le retour sur la berge ; le parcours aux deux marées.
- [ ] À vérifier sur téléphone (menu pause → Parcours d'essai → « 13. Marée », puis DEBUG → « Marée haute ») : comprend-on la marée, ce qui flotte et ce qui est noyé ? Changer de marée dans le noir trouble-t-il ?
- [ ] La chute dans l'eau : l'éclaboussement se lit-il ? Le retour au bord est-il assez rapide (`splashMs`, `reappearMs`) ? Juste, ou trop punitif avec la peur qui monte ?
- [ ] L'eau elle-même : se lit-elle comme de l'eau (couleur, vaguelettes, `WATER_LIFE`) ? Les vaguelettes gênent-elles ?
- [ ] La glissade sous la digue et la cheminée : faciles, comme annoncé ?

### La station balnéaire, PR 1a : le moteur de la marée (D-96)

- **La marée** : une salle de marée existe en deux variantes statiques (basse, haute), réglées par le drapeau `sea.tide-high`. Données : `; @tide:`, `; @sea:`, `; @rise:` (ce qui flotte monte avec la marée, son décor et ses câbles aussi).
- **L'eau** : nouvelle tuile (`~`), jamais un sol, évitée par l'analyse. Provisoire : elle pique comme les orties jusqu'à la PR 1b (retour au dernier appui sec). Dessin PLACEHOLDER.
- **L'histoire** : étape réversible `toggle` (le banc des marées), seulement dans le noir ; la sauvegarde sait retirer ce drapeau, sans migration. La salle change sous Céleste dans le noir, elle garde sa place.
- **Outils de test** : les tronçons `; @leg:` (difficulté exacte et capacités exigées d'un trajet, vérifiés pour toutes les salles) ; le graphe de la marée (un nœud par surface et par marée, les bancs passent de l'une à l'autre ; « jamais coincée »).
- Aucune salle du jeu ne change : tout est essayé sur une salle d'essai des tests.
- Tests : 643. Vérifié dans Chromium : la salle d'essai à marée basse puis haute (l'eau monte, le ponton flotte, la trouvaille du sable n'y est plus), Céleste à la même place.
- [ ] Rien à essayer sur téléphone de plus que le parcours d'essai 13 (PR 1b).

### Musique : retours d'écoute (D-94)

- Un seul thème pour la maison (`house`, jour et nuit) et un seul pour tous les mondes étranges (`strange`). Restent 8 thèmes : `title`, `house`, `garden`, `street`, `station`, `train`, `strange`, `memory-play`.
- Jingle `memory` raccourci à 5 s (fondu de sortie), option `--max` de `audio:prepare`.
- Pendant un jingle, la musique ne baisse plus qu'à 80 % (30 % avant). À l'apparition de Maria, avec son jingle, le thème reste audible (plus de silence) ; sans fichier `maria`, le silence reste.
- [ ] À vérifier sur téléphone : le thème s'entend-il assez sous les jingles, et les jingles se distinguent-ils encore (`jingleDuck`) ?
- [ ] L'apparition de Maria avec le thème qui continue : garde-t-elle son étrangeté, ou faut-il revenir au silence (`hushWithJingle` à 0) ?

### Musique : premiers morceaux (D-92)

- Intégrés : thèmes `house-night`, `garden`, `strange`, `station` ; jingles `found`, `memory`, `maria`.
- Retravaillés par `npm run audio:prepare` : silences coupés, même sonie pour tous (−18 LUFS, crête ≤ −1,5 dBTP ; les bruts allaient de −14,5 à −23 LUFS et touchaient 0 dBFS), AAC 96 kbit/s `.m4a`, pochettes retirées. 15,5 Mo bruts → 7,2 Mo.
- Corrigé : le thème des souvenirs jouables portait le même nom que le jingle `memory` ; il devient `memory-play` (test ajouté).
- Tests : 629. Build et précache vérifiés (`check:pwa`). Le Chromium de l'environnement ne lit pas l'AAC (codec absent des versions libres) : l'écoute dans le jeu reste à faire sur téléphone.
- [ ] À vérifier sur téléphone : les morceaux jouent-ils (iPhone et Android) ? Volumes équilibrés entre thèmes et jingles ? Le jingle `maria` assez étrange ?
- [ ] Les boucles (fondu de 4 s sur la fin) : se remarquent-elles ?
- Le jingle `memory` : raccourci à 5 s (D-94).
- **Rendu en mode écran par défaut** (D-93) : nouvelle partie en mode écran ; une sauvegarde existante garde son mode (le changer une fois dans le menu pause).
- [ ] À vérifier sur téléphone : fluidité en mode écran (FPS de l'overlay).

### Le train, PR 6b : les revisites avec la glissade (D-91)

- **Quatre trouvailles** qu'on n'atteint qu'en glissant : sous le canapé du salon, sous la table de jardin de la terrasse, sous la palissade dans la rue (une cachette derrière les planches), sous le kiosque du hall de la gare.
- Ajustements de la liste de départ (acceptés) : pas de planches sur la terrasse, pas de raccourci propre vers le chantier, et le souffle des trains sous le quai (voir D-91).
- Aucune trouvaille ni lanterne existante déplacée : les parties en cours ne sont pas touchées.
- Tests : 628. Vérifié dans Chromium : les quatre trouvailles ramassées en glissant (la terrasse jusqu'au potager).
- [ ] À vérifier sur téléphone : voit-on qu'on peut passer sous le canapé, la table, la palissade, le kiosque ? Faut-il un indice (une étincelle, la trouvaille visible) ?
- [ ] Le canapé et la table creusés en dessous : se lisent-ils toujours comme des meubles ?

### Le train, PR 6a : le matin, la gare de la mer, le train à quai (D-90)

- **Au matin** : après la cuisine rose, Agir sur sa couchette ; la maîtresse réveille Céleste, les lumières reviennent, **la mer à la fenêtre** ; le train s'arrête ; Céleste pense à Maria.
- **La gare de la mer** (PLACEHOLDER) : un quai, la mer derrière, le train à quai, la classe et la maîtresse qui attendent ; pas de sortie (le niveau 6 viendra).
- **Le train à quai, de jour** : immobile, sans passagers, sans tunnel ni valise qui tombe ; il se revisite.
- **Le voyage** : la porte de la voiture-couchettes donne sur la gare de la mer, une porte du fourgon sur les quais de la gare de la ville. Avant l'arrivée, ces portes n'existent pas.
- DEBUG → Histoire : « le train arrivé, la gare de la mer ».
- Tests : 620. Vérifié dans Chromium : le matin (la mer, la maîtresse, l'arrêt), la gare de la mer, de la gare de la mer à la voiture-couchettes puis du fourgon aux quais de la ville ; le toit et les compartiments de jour, sans danger.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « la cuisine rose trouvée », puis la couchette) : le matin est-il assez doux ? La mer à la fenêtre se voit-elle ? L'arrêt du train se sent-il (`trainStopMs`, `TRAIN_RIDE.accelPerS`) ?
- [ ] La gare de la mer : comprend-on qu'on ne va pas plus loin pour l'instant (la maîtresse) ?
- [ ] Le voyage par les deux bouts du train : se comprend-il, ou trouble-t-il ? Trouve-t-on la porte du fourgon ?
- [ ] Le train vide de jour : trop vide ? Le toit de jour se lit-il ?

### Le train, PR 5b : le souvenir jouable de la cuisine (D-89)

- **Nouveau système** (réutilisable pour Eden) : une petite salle et une liste d'actions à faire dans l'ordre avec Agir ; hors de la partie (rien n'est sauvegardé), puis retour exact où était Céleste.
- **Le souvenir de la cuisine** : Céleste toute petite, sa dînette rose ; elle remue la casserole, verse le thé, l'apporte à Roger, au panda roux et au lapin ; un cœur ; la petite cuisine reste seule. Sans texte, couleurs chaudes, la caméra plus près. Maria n'y est pas.
- Il se joue **après la cuisine rose** (avant la couchette) et se **rejoue depuis le cahier** (toucher la cuisine rose, puis encore).
- DEBUG : bouton « Jouer le souvenir de la cuisine ».
- Tests : 613. Vérifié dans Chromium : de la cuisine rose au souvenir, puis la couchette ; depuis le debug, retour dans la salle de départ.
- [ ] À vérifier sur téléphone (DEBUG → « Jouer le souvenir de la cuisine », ou la cuisine rose) : trouve-t-on quoi faire sans texte (l'étincelle, le bouton Agir) ?
- [ ] Céleste toute petite : son pas (`TODDLER_LOOK`, × 0,55) trop lent ? Sa taille (corps × 0,78) se lit-elle comme « toute petite » ?
- [ ] Les gestes (remuer, verser, poser) et la tasse tenue se comprennent-ils ? Durées (`PLAYABLE_MEMORY_TIMING`) : trop longues, trop courtes ?
- [ ] La fin (le cœur, la petite cuisine seule, `aloneMs`) : assez douce, assez longue ?
- [ ] La caméra rapprochée (`MEMORY_CAMERA_ZOOM`) : agréable ?
- [ ] Le cahier : rejouer en touchant deux fois la cuisine rose, est-ce naturel ?

### Le train, PR 5a : le monde étrange du train, la cuisine rose (D-88)

- **L'entrée** : la nuit, Agir à la porte de la cuisine du wagon-restaurant ; la lueur scintille dessous, un clignement, la cuisine étrange se révèle. Après un évanouissement, la porte y ramène.
- **La cuisine étrange** (moyenne) : plaques chaudes sous une hotte basse, une étagère basse (glisser), une cheminée d'étagères (saut mural), la veilleuse ; le rail des louches (crochet) jusqu'à la sortie. La glissade et le crochet sont exigés.
- **Le train de la vaisselle** : la poursuite horizontale dans le niveau (6,8 tuiles/s), une veilleuse à chaque tronçon ; au bout, **la cuisine rose**, la dînette d'enfance de Céleste.
- **La fin** (provisoire) : sur sa couchette, la nuit ; une bulle Maria, puis lit. Le souvenir jouable vient avec la PR 5b, le matin avec la PR 6.
- DEBUG → Histoire : « le train étrange (la cuisine, la vaisselle) », « la cuisine rose trouvée ».
- Tests : 605. Vérifié dans Chromium : la porte de la cuisine, la cuisine étrange (hotte, plaques, cheminée, rail), le train de la vaisselle (chariot, filets), la cuisine rose.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le train, la nuit (la lueur) », puis la porte de la cuisine) : l'entrée se comprend-elle ?
- [ ] La cuisine étrange : les plaques chaudes se voient-elles ? La hotte basse rend-elle les sauts justes, sans frustration (moyen) ? Le rail des louches se remarque-t-il ?
- [ ] Le train de la vaisselle : le chariot (`; @chase-phase` 6,8, `chaseSpeedScale`) presse-t-il sans être injuste ? La poutre basse le fait-elle trébucher de façon lisible ?
- [ ] La cuisine rose : se reconnaît-elle comme un jouet d'enfance ? Est-elle assez visible au bout du train ?
- [ ] La fin sur la couchette : trop brusque en attendant le souvenir jouable et le matin ?
- [ ] Fluidité dans les deux salles (le chariot, la cuisine immense).

### Le train, PR 4 : la poursuite horizontale, parcours d'essai 12 (D-87)

- **La poursuite va aussi de côté** : `; @chase: right 117` (ou `left`) ; mêmes règles que la tour (départ en retard, vitesse constante, rattrapage doux, croc-en-jambe, la peur monte au contact, trois contacts : retour à la lanterne). Au contact, Céleste est poussée en avant, dans le sens de la fuite. La tour et le parcours 10 ne changent pas.
- **Le poursuivant du train** (PLACEHOLDER) : un chariot de service géant, une tour de vaisselle jusqu'au plafond (assiettes, tasses, théières, cloches), sans visage, le liseré turquoise sur le bord avant ; elle oscille et tremble quand il trébuche ou touche Céleste.
- **Parcours d'essai 12 « Poursuite horizontale »** (menu pause, mode debug) : barrière basse, caisses et filets ; poutre basse et passage couché (le chariot s'y cogne et s'arrête) ; fosse de vaisselle cassée (saut long), pile de valises, dernière barrière. 6,5 tuiles/s. Impossible sans la glissade.
- **Rythme** (phase 3) : chaque tronçon prend 45 à 68 % du temps du chariot ; parfait, jamais touché ; 50 % plus lent, touché. Le rejeu suit maintenant Céleste le long des planchers (point d'atterrissage des passages).
- Nouveaux réglages (DEBUG → Combat) : `chaseContactPushX`, `chaseContactHopY`, `chaseSideStartDelayMs`, `chaseSideRestartGapTiles`. PROVISOIRES.
- Tests : 599. Vérifié dans Chromium : le chariot derrière Céleste, la glissade sous la barrière, le contact (la peur monte).
- [ ] À vérifier sur téléphone (menu pause → Parcours d'essai → « 12. Poursuite horizontale ») : le chariot presse-t-il sans être injuste ? Vitesse (`; @chase-phase`, `chaseSpeedScale`), attente et écart au départ (`chaseSideStartDelayMs`, `chaseSideRestartGapTiles`).
- [ ] Le contact : la poussée en avant (`chaseContactPushX`, `chaseContactHopY`) se comprend-elle ? Ne relance-t-elle pas Céleste dans un obstacle ?
- [ ] La poutre basse : voit-on que le chariot s'y cogne et s'arrête (`chaseTripPauseMs`) ?
- [ ] Voit-on assez loin devant ? Le chariot reste-t-il dans l'écran sans le manger (caméra inchangée) ?
- [ ] Le chariot et sa tour : inquiétants sans faire peur ? Se lisent-ils sur un petit écran ?
- [ ] Fluidité avec le chariot à l'écran.

### Le train, PR 3 : les compartiments, le fourgon, le toit, le wagon-restaurant (D-86)

- **L'ordre des voitures** : couchettes → compartiments → fourgon → (toit) → wagon-restaurant. La nuit tombée, la porte du bout de la voiture-couchettes s'ouvre ; la lueur guide de voiture en voiture.
- **Les compartiments** : des voyageurs qui dorment, une maman et son bébé (qui serre son propre poupon ; Agir), le contrôleur (une bulle quand on passe près de lui), un chien couché (Agir). Des valises tremblent sur les filets puis tombent dans les virages (cycles décalés ; recul et peur si elles touchent Céleste). Au bout, une grille à passer en glissade. Une trouvaille en haut d’un filet, une lanterne.
- **Le fourgon** : malles, caisses, vélo, cage du chien, colis, un câble pour le crochet ; une trappe mène au toit. Le passage direct vers le restaurant est fermé (« ? »).
- **Le toit** : dehors, la nuit étoilée ; des tunnels passent régulièrement. L'image s'assombrit à l'approche, puis des arches défilent : debout sur le toit, Céleste est repoussée vers l'arrière (une peur) ; à l'abri dans un creux entre deux voitures, ou couchée en glissade, rien. Trouvaille sur la cheminée de la cuisine. Au bout, une trappe redescend dans le restaurant.
- **Le wagon-restaurant** : tables, comptoir, verres ; arrivée par le haut, il s'ouvre de l'intérieur (la porte vers le fourgon devient un raccourci). La porte de la cuisine : « ? » (PLACEHOLDER, la suite avec la PR 5).
- Écartés : portes qui se referment, colis qui glissent (collisions mobiles, coût) ; voir D-86.
- Tests : 586. Vérifié dans Chromium : les quatre voitures, le tunnel qui repousse Céleste debout.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le train, la nuit (la lueur) ») : les valises qui tremblent se remarquent-elles assez tôt ? Les chutes sont-elles justes ?
- [ ] Le toit : l'annonce du tunnel (assombrissement, `tunnelWarnMs`) laisse-t-elle le temps de rejoindre un creux ou de glisser ? Trop souvent, pas assez (`tunnelPeriodMs`) ?
- [ ] Le recul du tunnel (`tunnelPushX`, `tunnelPushY`) : lisible sans être injuste ?
- [ ] La grille des compartiments et la trappe du fourgon : trouve-t-on le chemin ? La lueur guide-t-elle bien ?
- [ ] Le restaurant fermé depuis le fourgon puis ouvert de l'intérieur : comprend-on la boucle ?
- [ ] Les personnages (maman et bébé, contrôleur, chien) : se reconnaissent-ils ?
- [ ] Fluidité sur le toit (plans qui défilent, voile du tunnel).

### Le train, PR 2 : le départ, la voiture-couchettes, la nuit (D-85)

- **Le départ** : en phase 3, Agir à la porte du train à quai. Le soir sur le quai : la maîtresse, trois enfants et leurs sacs, maman et papa qui font au revoir (un cœur). Puis la voiture-couchettes ; le train s'ébranle, le paysage se met à défiler. Pas de parents dans le train.
- **La voiture-couchettes** : le compartiment de la classe, une grille en accordéon à moitié fermée (on glisse dessous), le compartiment suivant (le chariot du vendeur, le filet à bagages et sa trouvaille, moyenne, par un saut long depuis la glissade), la porte du bout.
- **La glissade s'apprend** : la camarade invite Céleste, passe sous la grille (dans le noir d'un court fondu), montre comment ; Céleste apprend la glissade (bulle « glisser »). La maîtresse rappelle l'heure du coucher.
- **La nuit** : Agir sur sa couchette ; tout le monde dort, les lumières s'éteignent ; une lueur passe dans le couloir. Au bout, la porte : « ? » (la suite avec la PR 3).
- **Le train roule** : derrière les vitres, collines, villages allumés, arbres et poteaux de caténaire qui défilent ; petites secousses de l'image de temps en temps. Rien ne touche à Céleste. Réglages `TRAIN_RIDE`.
- DEBUG → Histoire : « le train, en route (la glissade à apprendre) », « le train, la nuit (la lueur) ».
- Tests : 571. Vérifié dans Chromium : le quai (maîtresse, enfants, parents), la montée, le départ, la camarade et la glissade apprise, la grille, la nuit (lumières éteintes), la porte du bout.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « quelques mois après la gare », puis aller sur les quais) : la porte du train se remarque-t-elle ? La scène du quai (au revoir) est-elle assez lente et tendre ?
- [ ] Le paysage qui défile : agréable, ou donne-t-il le tournis ? Les secousses : se sentent-elles sans gêner les sauts ? (`TRAIN_RIDE`)
- [ ] La camarade : se reconnaît-elle ? Comprend-on qu'elle est passée sous la grille et qu'il faut faire pareil ?
- [ ] La grille et le chariot : lit-on qu'on passe dessous ?
- [ ] La trouvaille du filet (saut long depuis l'étagère) : juste (moyenne) ?
- [ ] La nuit : assez sombre, assez douce ? La lueur dans le couloir se voit-elle et donne-t-elle envie de la suivre ?
- [ ] Mémoire et fluidité dans la voiture (trois plans qui défilent).

### Le train, PR 1 : la glissade (D-84)

- **Geste** : au sol, le bouton **Glisser** (clavier : L ou Maj gauche) lance Céleste couchée, environ 3,5 tuiles, dans le sens où l'on pousse. Elle passe sous ce qui est à une tuile du sol.
- **Sous un plafond bas**, elle avance couchée jusqu'à pouvoir se relever ; contre un mur, elle repart dans l'autre sens (jamais coincée).
- **Saut long** : sauter en glissant va plus loin (190 px/s au lieu de 136), l'élan est gardé jusqu'au sol (pousser à l'opposé le casse).
- **Bouton** : n'apparaît qu'avec la glissade, à gauche de Saut. **Pose** couchée, pieds devant. Ligne et pictogramme dans « Mes capacités ».
- **Parcours d'essai 11 « Glissade »** (menu pause, mode debug) : barrière basse, long passage bas, fosse de briques à franchir en saut long, dernière barrière. Case « Capacité : glissade » dans DEBUG ; réglages `slide*`.
- Analyse de faisabilité étendue à la glissade (option) ; rien ne change sans elle.
- Tests : 563. Vérifié dans Chromium : la barrière, le passage bas, le saut long, le bouton.
- [ ] À vérifier sur téléphone (menu pause → Parcours d'essai → « 11. Glissade ») : le bouton Glisser se trouve-t-il sous le pouce sans gêner Saut ? Un troisième bouton, est-ce trop ?
- [ ] La glissade : distance (`slideDurationMs`), vitesse (`slideSpeed`) : trop courte, trop longue ? Part-elle quand on le veut ?
- [ ] Le saut long (`slideJumpSpeedX`) : se sent-il nettement plus long, sans être incontrôlable ? Glisser puis sauter vient-il naturellement au pouce ?
- [ ] Couchée sous le plafond (`slideCrawlSpeed`) : trop lent ?
- [ ] La pose couchée se lit-elle ?

### La gare, phase 2 : les objets trouvés, le dépôt, la gare étrange (D-81)

- **Objets trouvés** : un plafond bas et une suspension au-dessus du guichet, une lampe de bureau ; les étagères sur des rails muraux du sol au plafond ; le placard sur équerres, un porte-parapluies dessous.
- **Dépôt** : le portique roulant posé au sol ; l'atelier en sheds, ses verrières allumées, sa cheminée qui fume ; les planches sur des chevalets.
- **Gare étrange et tour** : les valises pleines remplies et bordées de turquoise sur tous leurs côtés ; les valises qui flottent, une planche et un contour léger.
- Aucune trouvaille ni lanterne déplacée ; difficultés inchangées.
- Tests : 545. Vérifié dans Chromium : les quatre salles.
- [ ] À vérifier sur téléphone : dans la tour, distingue-t-on maintenant les valises pleines du fond ? Et les valises qui flottent (on monte par dessous) ?
- [ ] Le placard sur équerres : on comprend qu'on passe dessous ?

### La gare, phase 1 : les voies, les quais, le hall (D-80)

- **Voies** : la gare au fond, avec sa tour de l'horloge ; les mâts de caténaire posés (quai, toit du poste) tiennent le câble ; un chariot à bagages ; lampadaires et vitres allumés au crépuscule ; deux pigeons sur le portique.
- **Quais** : la marquise sur ses colonnes ; le pilier descend jusqu'au quai (on passe dessous) ; la passerelle sur deux piles, ses escaliers en tours de paliers ; deux lampes-globes.
- **Hall** : une voûte ; un escalier en colimaçon à la place des marches qui flottaient (mêmes marches) ; le balcon sur consoles et son réverbère au bout du câble ; l'auvent du kiosque, la devanture des objets trouvés ; les volets du tableau des départs qui basculent.
- Aucune trouvaille ni lanterne déplacée ; difficultés inchangées.
- Tests : 545. Vérifié dans Chromium : les trois salles, au crépuscule.
- [ ] À vérifier sur téléphone : l'escalier en colimaçon se lit-il comme des marches (et pas comme une échelle de tablettes) ?
- [ ] Les tours de paliers de la passerelle : on comprend qu'on monte par sauts ?
- [ ] Les volets du tableau des départs : assez discrets ?

### Le quartier, phase 3 : la cour, l'école, l'école étrange (D-79)

- **Cour** : du ciel au-dessus ; une marelle, un ballon, un pigeon qui s'envole quand Céleste approche ; au crépuscule, quelques fenêtres de l'école allumées.
- **École** : des casiers posés au sol à la place des étagères qui flottaient (mêmes sauts) ; poutres, suspensions, frise de formes, dessins ; un poisson rouge sous l'oculus.
- **École étrange** : les tableaux tracés en violet pâle (leur cadre se lisait comme une plateforme).
- Aucune trouvaille ni lanterne déplacée ; difficultés inchangées.
- Tests : 545. Vérifié dans Chromium : les trois salles, et la cour au crépuscule.
- [ ] À vérifier sur téléphone : les casiers de la classe, dont on passe devant, trompent-ils (on croit qu'ils bloquent) ?
- [ ] Le pigeon : s'envole-t-il au bon moment ? Revient-il trop vite ?
- [ ] L'école étrange : les tableaux ne se lisent-ils plus comme des appuis ?

### Le quartier, phase 2 : aire de jeux, supérette, chantier (D-78)

- **Aire de jeux** : du ciel au-dessus ; les balançoires oscillent au vent ; des papillons.
- **Supérette** : un faux plafond et ses tubes (celui de la réserve clignote parfois), un ventilateur, une affiche ; la mezzanine de la réserve sur pilotis.
- **Chantier** : le haut dessiné comme du ciel ; l'arrière de la supérette (le rebord en est le parapet) ; la lampe de chantier sous son chapeau ; une bâche qui claque au vent.
- Aucune trouvaille ni lanterne déplacée ; difficultés inchangées.
- Tests : 545. Vérifié dans Chromium : les trois salles.
- [ ] À vérifier sur téléphone : les balançoires, le ventilateur, la bâche : assez discrets ?
- [ ] Le tube qui clignote : inquiétant juste ce qu'il faut ? Pas fatigant ?
- [ ] Le haut du chantier en ciel : trompe-t-il (on s'y cogne la tête comme avant) ?

### Le quartier, phase 1 : la rue refaite (D-77)

- Du ciel au-dessus des toits (le bandeau de feuillage du haut retiré, sauf la couronne du platane).
- Rien ne flotte : le platane devant les façades et son nid sur une branche, les lampadaires, l'enseigne, le toit de l'école (on marche au pied du toit), les planches de l'échafaudage.
- Vie : fumée des cheminées, linge entre deux fenêtres, drapeau de l'école, chat roux sur un rebord.
- Au crépuscule : lampadaires et quelques fenêtres allumés.
- Aucune trouvaille ni lanterne déplacée ; difficultés inchangées.
- Tests : 545. Vérifié dans Chromium : la rue de jour et au crépuscule, sur toute sa longueur et en haut.
- [ ] À vérifier sur téléphone : la rue est-elle plus belle ? Le platane et son nid se lisent-ils ?
- [ ] La fumée, le drapeau, le linge, le chat : assez discrets ? Fluides en marchant (la rue se dessine par blocs) ?
- [ ] Le crépuscule : les fenêtres allumées et les lampadaires, chaleureux sans être trop ?
- [ ] Le toit de l'école : se lit-il comme un endroit où l'on marche ?

### Le jardin refait (D-76)

- **Terrasse** : ciel ouvert entre l'avant-toit de la maison et l'arbre du voisin ; une guirlande de guinguette sous la pergola ; des papillons.
- **Potager** : ciel ouvert ; un épouvantail dans le dernier bac ; une brouette, un tonneau ; des papillons.
- **Grand arbre** : une trouée dans la couronne et son rayon de soleil ; une balançoire qui oscille au vent.
- **Cabane** : un toit en pente, une lanterne, les dessins de Céleste au mur.
- **Allée** : du ciel au-dessus de la clôture ; une girouette sur la remise.
- **Derrière la haie** : épines des ronces plus grandes (lisibilité).
- Aucune trouvaille, lanterne ni araignée déplacée ; difficultés inchangées.
- Tests : 545. Vérifié dans Chromium : les cinq salles et la ronce.
- [ ] À vérifier sur téléphone : le jardin est-il plus ouvert, plus beau ? Le haut des salles (ciel au lieu du feuillage) gêne-t-il la lecture des limites ?
- [ ] La balançoire et l'épouvantail, sans collision : trompent-ils ?
- [ ] Les animations (guirlande, balançoire, girouette, papillons) : assez discrètes ? Fluides ?
- [ ] Derrière la haie : les ronces se lisent-elles mieux ?

### La maison refaite, partie B : rez-de-chaussée, grenier, mondes étranges (D-75)

- **Cuisine** : une retombée de plafond au-dessus du coin cuisine ; une suspension basse au-dessus de la table, une barre à casseroles pendue, le rebord de la fenêtre, le dessus du frigo (les mêmes appuis qu'avant) ; le conduit de la hotte ; une cafetière qui fume.
- **Buanderie** : un plafond bas ; la soupente sous la trappe sur son poteau ; une étagère sur pieds ; une planche à repasser ; une ampoule au-dessus de la machine ; le linge tourne dans le hublot.
- **Grenier** : un toit à deux pans ; chaque poutre sur son poteau ; la trouvaille sur un entrait sous le faîte ; une fenêtre de toit dans le pan (hors d'atteinte) ; de la poussière dans sa lumière ; un mannequin de couture.
- **Salon** : vérifié, inchangé.
- **Mondes étranges** (lisibilité seulement) : fauteuil, escalier peint et grand crayon plus pâles ; le portemanteau du passage d'ombres sans sa barre.
- Aucune trouvaille ni lanterne déplacée ; difficultés inchangées.
- Tests : 545. Vérifié dans Chromium : les trois salles le soir et le matin, et les deux mondes étranges.
- [ ] À vérifier sur téléphone : la cuisine (suspension, barre, frigo) se lit-elle comme un chemin ? Le frigo, dont on passe devant, trompe-t-il ?
- [ ] Le grenier : le toit en pente est-il plus beau ? Les poteaux gênent-ils la lecture des poutres ?
- [ ] La buanderie : la soupente et l'étagère sur pieds se comprennent-elles comme le chemin de la trappe ?
- [ ] Le linge dans le hublot, la vapeur, la poussière : assez discrets ?
- [ ] Monde étrange : le fauteuil, l'escalier peint, le crayon ne trompent-ils plus ?

### La maison refaite, PR A : l'étage (D-75)

- **Chambre** : la mansarde en pente à droite ; le lit cabane (la boîte à musique sur sa traverse) ; le surmeuble du bureau (la couverture) ; un mobile qui tourne au-dessus du berceau ; la veilleuse projette des étoiles sur les murs.
- **Couloir** : un plafond bas à gauche ; la trouvaille sur le fronton d'un grand miroir posé sur la console ; un œil-de-bœuf sous la lune, de la poussière dans son rayon ; un placard au-dessus de la porte de l'escalier (la trappe à linge, en grimpant depuis la commode) ; un papillon de nuit autour d'une applique.
- **Escalier** : un vrai escalier avec sa rampe ; la grande fenêtre du palier ; le palier porté par une bibliothèque en escalier ; le palier du grenier sur son poteau ; une suspension, un portemanteau, une plante.
- Rien d'atteignable ne change de difficulté ; aucune trouvaille ni lanterne déplacée (sauvegardes intactes).
- Tests : 545. Vérifié dans Chromium : les trois salles, le soir et le matin, en entier et à hauteur de jeu.
- [ ] À vérifier sur téléphone : les trois salles sont-elles plus belles, plus lisibles ? Rien ne semble-t-il flotter ?
- [ ] La mansarde : se lit-elle comme un toit (et pas comme un escalier) ?
- [ ] Le mobile, les étoiles de la veilleuse, la poussière, le papillon : assez discrets, assez vivants ? (`WORLD_LIFE`)
- [ ] Le couloir : le placard au-dessus de la porte et la commode se comprennent-ils comme le chemin de la trappe ?
- [ ] L'escalier : la rampe gêne-t-elle la lecture des marches ? La bibliothèque sous le palier se lit-elle comme un meuble à escalader ?
- [ ] La trotteuse des horloges (couloir) : en pointillés ?

### Passe graphique, étape 5 : le salon, salle témoin (D-74)

- L'escalier descend de l'étage dans le coin ; une poutre au plafond.
- Rien ne flotte : deux plantes suspendues, un lustre, une horloge comtoise (la trouvaille sur son chapeau), la tringle allongée.
- La cheminée et son petit feu animé, qui éclaire la pièce ; un miroir au-dessus ; son manteau est une plateforme (par les étagères de la bibliothèque).
- Retour du téléphone : rendu « beaucoup mieux » ; la table basse retirée (au-dessus des briques, elle empêchait de les sauter).
- Le balancier de l'horloge bat.
- La photo de famille passe au-dessus du canapé.
- Les repères de l'histoire n'ont pas bougé (bibliothèque et Maria, canapé, chat, portes) ; le salon étrange est inchangé.
- Tests : 537. Vérifié dans Chromium : le salon de nuit, en marchant, et son aperçu en monde étrange.
- [ ] À vérifier sur téléphone : le salon est-il plus beau, plus lisible, plus agréable à traverser ? La route haute (plantes, tringle, lustre) se lit-elle ?
- [ ] Le feu : assez vivant, pas trop vif ? Le balancier se remarque-t-il ?
- [ ] La trouvaille sur l'horloge : le saut depuis la bibliothèque est-il juste (moyen) ?

### Passe graphique, étape 3 : la vie du monde réel (D-73)

- Un vent commun, par rafales douces.
- Les nuages dérivent dans le ciel, et la nuit devant la lune, dans les fenêtres.
- Un petit vol d'oiseaux de temps en temps.
- Des feuilles tombent au vent là où il y a des arbres (vertes au jardin, ocres dans la rue).
- Le linge de la terrasse se balance.
- Tests : 537. Vérifié dans Chromium : terrasse, grand arbre, rue, salon, cuisine.
- [ ] À vérifier sur téléphone : le vent et les feuilles, assez doux ? Les oiseaux, trop fréquents ?
- [ ] La trotteuse des horloges s'affiche-t-elle en pointillés ? (défaut vu dans Chromium sans GPU)

### Passe graphique, étape 2 : la profondeur (D-72)

- Dehors : ciel, collines et toits de la ville en plans qui défilent moins vite que la salle (parallaxe).
- Dedans : les vitres laissent voir la nuit (ou le matin), la lune et les toits de la ville, fenêtres allumées ; ils glissent un peu en marchant.
- Avant-plan dehors : herbes et fleurs floues au bas de l'écran, qui s'effacent près de Céleste, des ennemis, des dangers et des objets. Pas d'avant-plan dans la maison (des taches plutôt que des objets).
- Corrigé : vitres à moitié découpées, ombre de contact géante sous la passerelle de la gare.
- Tests : 534. Vérifié dans Chromium : salon, chambre, grenier, école, hall et quais de la gare, potager, grand arbre, cabane, derrière la haie, rue.
- [ ] À vérifier sur téléphone : la parallaxe est-elle agréable ou donne-t-elle le tournis ? (facteurs dans `PARALLAX`)
- [ ] La mémoire : la rue et la gare se chargent-elles sans ralentir ? Le changement de salle dehors est-il plus long ?
- [ ] L'avant-plan : gêne-t-il la lecture du sol ou des ennemis ?

### Passe graphique, étape 1 : finition « papier découpé » (D-71)

- Le décor en feuilles superposées, chacune avec son ombre douce : fond lointain voilé, fond proche, couche jouable (murs, sol, meubles) nettement détachée du fond.
- Ombres de contact sous les meubles, grain de papier, vignettage selon la palette.
- Ombre de Céleste au sol, plus petite et pâle quand elle est haut.
- DEBUG : « Habillage (finition) » (curseurs), case « Comparer : sans finition », valeurs dans l'export JSON.
- Tests : 531. Vérifié dans Chromium : salon, chambre, cuisine, passage d'ombres, grand arbre, rue, aire de jeux, hall de la gare.
- [ ] À vérifier sur téléphone : le mode « Écran » (menu pause → Affichage) tient-il 55–60 images/s ? Si oui, il passera par défaut.
- [ ] Les changements de bloc en marchant (la rue, la gare) saccadent-ils plus qu'avant ?
- [ ] Les ombres et le grain : trop, pas assez ? (DEBUG → « Comparer : sans finition », curseurs « Habillage (finition) », puis Exporter JSON.)

### Retours du téléphone (D-70)

- **Parapluie** : de nouveau une nouvelle pression de Saut en l'air (tenir pour planer) ; il ne s'ouvre plus tout seul au sommet, sauf après un saut depuis un câble.
- **Poursuite de la tour** : une seule vitesse (2,8 tuiles/s), et s'il est loin, il accélère doucement au lieu de sauter. Le chemin parfait ne se fait jamais toucher ; 50 % plus lent, on se fait toucher.
- **Plateformes basses** au-dessus des longues fosses (jardin renversé, ronces, chantier, dépôt, école étrange, gare étrange) ; au chantier, un passage sous le mur de béton ramène au départ.
- **École étrange allongée** : nouvelle arrivée en bas à droite, une section avec un long plané au parapluie, une veilleuse de plus, puis la classe d'avant.
- **Moins de bulles Maria** (32 → 15) : prologue, début de chaque niveau, fin de chaque monde étrange.
- Tests : 535. Vérifié dans Chromium : les salles modifiées.
- [ ] À vérifier sur téléphone : le parapluie (nouvelle pression) et l'enchaînement des câbles.
- [ ] La poursuite : assez pressante, assez régulière ?
- [ ] Les plateformes basses : se remarquent-elles, gâchent-elles le danger ?
- [ ] La nouvelle section de l'école étrange : trop facile ? Le retour par la classe se comprend-il ?
- [ ] Les bulles Maria : le bon dosage ?

### La gare, PR 5 : la fin du niveau, la phase 3, le train à quai (D-69)

- **La fin** : après Roger, Céleste est assise sous la grande horloge du hall, la nuit. Papa vient la chercher (un cœur). Puis la nuit dans sa chambre ; au lit, des mois passent.
- **Phase 3** : Céleste un peu plus grande (hitbox 12 × 28), un peu plus rapide (× 1,06). **Queue de cheval, veste en jean, short rose, baskets**, d'après ton illustration (écran titre aussi). Le saut reste celui de la phase 2 : plus haut, il rendait deux trouvailles plus difficiles (la cheminée du pilier des quais, le nichoir de l'aire de jeux).
- **La toise** : un troisième trait.
- **Le train à quai** : sur les quais, une voiture arrêtée, porte grande ouverte, lueur turquoise ; en passant devant, une bulle « ? ». On n'y monte pas encore.
- **Roger** : ton image en jeu (dans la tour) ; le dessin du cahier et du court souvenir refait d'après elle.
- Le hall a maintenant une version de nuit ; l'horloge est descendue pour être visible.
- DEBUG → Histoire : « Roger trouvé, la nuit après la gare (au lit) », « quelques mois après la gare (phase 3, le train à quai) » ; case « Croissance : phase 3 ».
- Tests : 527. Rien d'atteignable en phase 2 ne se ferme en phase 3 (toute la zone). Vérifié dans Chromium : la fin, papa, la chambre, le coucher, la phase 3, la toise, le train à quai.
- [ ] À vérifier sur téléphone : la scène sous l'horloge (papa, la nuit) est-elle assez lente et tendre ?
- [ ] Céleste en phase 3 se reconnaît-elle (queue de cheval, veste) ? La taille et la vitesse : une différence sensible mais douce ? Faut-il un saut plus haut (en surveillant la cheminée des quais) ?
- [ ] Le train à quai : la porte et sa lueur se remarquent-elles ? La bulle « ? » donne-t-elle envie de revenir ?
- [ ] Les baskets de l'illustration (écran titre) portent un logo de marque : à garder ?

### La gare, PR 4 : le monde étrange de la gare, la tour, Roger (D-68)

- **Entrée** : en haut des casiers du bureau des objets trouvés, Agir près de la lueur : le monde étrange se révèle autour de Céleste. Après un évanouissement, les casiers y ramènent.
- **Les objets perdus** : le hall à l'envers, des valises qui flottent au-dessus des pointes de parapluies, la montagne des choses perdues et sa veilleuse (moyen) ; un câble puis une cheminée de valises jusqu'à la tour (moyen, seulement avec le crochet).
- **La tour des objets perdus** : le premier boss (la poursuite), jusqu'à Roger tout en haut.
- **Roger** : on le regarde, on ne le prend pas ; il entre dans « Monde étrange » du cahier. **Le premier court souvenir** : Céleste toute petite serre Roger contre elle (une vignette, quelques secondes, sans texte). Dans le cahier, toucher Roger le rejoue.
- **Fin provisoire** : Céleste assise sur un banc du hall (la suite avec la PR 5).
- DEBUG → Histoire : « la gare étrange (les objets perdus, la tour) », « Roger trouvé (fin de la gare étrange) ».
- Tests : 520. Vérifié dans Chromium : l'entrée par les casiers, le monde étrange, la tour et le poursuivant, Roger, la vignette, le retour au hall, le rejeu dans le cahier.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « la gare étrange ») : l'entrée par les casiers se comprend-elle ? Le monde étrange (hall à l'envers, valises, parapluies) : lisible, assez étrange, jamais effrayant ?
- [ ] La tour et le poursuivant : la pression est-elle juste avec Céleste grandie ? Les veilleuses sont-elles bien placées ?
- [ ] Roger se reconnaît-il (une peluche singe) ? Le court souvenir : assez lent, assez tendre ? Les lunettes roses sur Céleste toute petite : à garder ?
- [ ] Le rejeu dans le cahier (toucher Roger).

### La gare, PR 3 : le système de boss, la poursuite verticale (D-67)

- **Le poursuivant** : un tas de valises et de manteaux perdus, coiffé d'une casquette de contrôleur, sans visage, qui monte derrière Céleste. Il attend un peu, puis monte à la vitesse de la phase ; s'il est trop loin, il remonte hors de la vue.
- **Le toucher** : Céleste rebondit vers le haut, la peur monte d'un cran ; il recule et s'arrête un instant. Trois fois : évanouissement, retour à la lanterne de la phase.
- **Croc-en-jambe** : passer par certains endroits (une pile de valises sous un câble) le fait reculer et s'arrêter.
- **Caméra** : la vue montre un peu plus le haut pendant une poursuite.
- **Parcours d'essai 10 « Poursuite »** (menu pause, mode debug) : cheminée de valises, valises qui flottent et câble (croc-en-jambe), dernière cheminée jusqu'en haut.
- **Analyse** : les passages ont une durée ; un test vérifie que chaque phase laisse le temps de passer, sans être trop lâche.
- DEBUG → Combat : `chaseStartDelayMs`, `chaseSpeedScale`, `chaseMaxGapTiles`, `chaseRestartGapTiles`, `chaseContactBounceY`, `chaseContactRecoilTiles`, `chaseContactPauseMs`, `chaseTripPauseMs`.
- Tests : 514. Vérifié dans Chromium : le poursuivant monte, se voit en bas de l'écran, le contact fait monter la peur.
- [ ] À vérifier sur téléphone (menu pause → Parcours d'essai → « 10. Poursuite ») : la pression est-elle juste (`chaseSpeedScale`) ? Trop lent, trop rapide, selon les phases ?
- [ ] Le poursuivant se lit-il comme menaçant mais pas effrayant (pas d'horreur) ? Le liseré turquoise montre-t-il bien où il commence ?
- [ ] Le croc-en-jambe sous le câble se comprend-il ? Le recul se voit-il ?
- [ ] La caméra (un peu plus haut) : voit-on assez le chemin au-dessus, et le poursuivant en dessous ?

### La gare, PR 2 : la gare réelle (D-66)

- **Accès** : au matin d'après l'école, la porte de la palissade du chantier (rue) mène aux voies. Céleste pense à Maria en arrivant.
- **Les voies** : quais, voies en contrebas, abris ; le portique de signalisation (trouvaille moyenne) ; le poste d'aiguillage au bout de la caténaire (trouvaille, avec le crochet).
- **Les trains** : le feu clignote, puis le train passe. Son souffle repousse Céleste si elle est sur la voie, là où passe le train, et la peur monte d'un cran. Sur les quais, rien.
- **Les quais et la passerelle** : l'escalier, la passerelle au-dessus des voies jusqu'à la galerie du hall (boucle) ; la cheminée du pilier de la marquise (trouvaille difficile).
- **Le hall** : verrière, grande horloge, tableau des départs, kiosque, galerie ; un câble sous la verrière (trouvaille, avec le crochet).
- **Le bureau des objets trouvés** (porte du hall) : étagères de choses perdues, armoire ; **la poignée-crochet** tout en haut (moyen). En haut des casiers, une lueur turquoise et un présage ; Agir : « ? » pour l'instant (le monde étrange viendra avec la PR 4).
- **Le dépôt** : wagons au-dessus des gravats, crochets du pont roulant (trouvaille moyenne).
- **Revisites avec le crochet** : la jardinière de la terrasse (fil à linge à poulie, depuis le toit de la pergola) ; le nid du platane de la rue (fil tendu depuis la corniche de l'école).
- **Cahier** : nouvelle page « La gare ». Musique : nouvel emplacement `station`.
- DEBUG → Histoire : « la gare (le crochet à trouver) » ; DEBUG → Combat : réglages des trains (`trainPeriodMs`, `trainWarnMs`, `trainPassMs`, `trainGustX`, `trainGustY`).
- Tests : 503. Vérifié dans Chromium : la porte de la palissade, les cinq salles, le feu qui clignote, le souffle (peur 1/3), le crochet ramassé (bulle d'aide), les fils de la terrasse et de la rue, la page « La gare » du cahier.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le lendemain de l'école (palissade ouverte) », ou « la gare ») : la porte de la palissade se remarque-t-elle ?
- [ ] Les trains : le feu se voit-il assez tôt ? Le souffle se comprend-il (et n'est-il pas trop punitif) ? Le train passe-t-il trop vite (1,6 s) ?
- [ ] Le bureau des objets trouvés : la montée vers le crochet (moyenne) est-elle juste ? La lueur des casiers attire-t-elle ?
- [ ] Les trouvailles au crochet (poste d'aiguillage, hall) et les revisites (terrasse, rue) : se remarquent-elles ? Donnent-elles envie de revenir ?
- [ ] Les décors de la gare : lisibles, pas trop chargés (marquise, passerelle, tableau des départs) ?

### La gare, PR 1 : le parapluie s'ouvre au sommet ; le crochet et les câbles (D-65)

- **Parapluie** : garder Saut appuyé ; en haut du saut, le parapluie s'ouvre (40 ms après le sommet). Appuyer de nouveau sur Saut en l'air l'ouvre aussi (chute d'un bord, saut court). Lâcher : il se referme. Pour un grand saut sans planer : lâcher Saut en haut du saut.
- **Le crochet** (s'ajoute au parapluie) : en planant, passer sur un câble : le crochet s'y accroche, Céleste glisse (vers le bas sur un câble en pente, dans son sens sur un câble plat). Lâcher Saut : elle lâche, avec l'élan. Lâcher et vite rappuyer (120 ms) : elle saute depuis le câble ; Saut tenu, le parapluie se rouvre en haut, on peut attraper le câble suivant.
- **Câbles** : directive `; @cable:` dans les salles ; dessinés droits (fil sombre, liseré clair).
- **Aide** : bulle du parapluie redessinée (Saut tenu), bulle du crochet, ligne « crochet » dans « Mes capacités » ; texte du parapluie mis à jour.
- **Parcours d'essai 9 « Crochet »** (menu pause, mode debug) : un long câble en pente, un câble plat, puis un saut depuis son bout vers le câble suivant. Impossible sans le crochet.
- DEBUG : case « Capacité : crochet du parapluie » ; réglages `glideAutoDelayMs`, `cableHookAbovePx`, `cableMinSpeed`, `cableMaxSpeed`, `cableAccel`, `cableFlatSlope`, `cableJumpWindowMs`, `cableJumpHeightTiles`.
- Analyse de faisabilité : suit les câbles (Saut tenu, lâché à la sortie, saut depuis le câble). Les difficultés de toutes les salles avec parapluie sont inchangées (testé).
- Tests : 491. Vérifié dans Chromium : parcours 9, accroche au câble, pose pendue, glissade jusqu'à l'îlot.
- [ ] À vérifier sur téléphone (menu pause → Parcours d'essai → « 9. Crochet », puis « 8. Parapluie ») : le parapluie qui s'ouvre au sommet en gardant Saut est-il naturel ? S'ouvre-t-il parfois sans le vouloir (grands sauts tenus) ? Le délai de 40 ms ?
- [ ] Le crochet : s'accroche-t-on quand on le veut ? Vitesses (110 à 240 px/s) : trop lent, trop rapide ?
- [ ] Lâcher Saut pour lâcher le câble, puis le saut depuis le câble (relâcher et vite rappuyer, 120 ms) : facile à faire au pouce ? Fenêtre trop courte ?
- [ ] Le fil des câbles se voit-il bien ? La pose pendue (parapluie replié, crochet en haut) se lit-elle ?
- [ ] Les bulles d'aide (parapluie, crochet) et la page « Mes capacités » (quatre lignes).

### Le quartier, PR 4 : l'école, son monde étrange et la fin du niveau (D-64)

- **La cour de l'école** : on y entre en planant par le trou du grillage de l'aire de jeux (seulement avec le parapluie). Préau, platane, banc, lanterne ; trouvaille sur le panier de basket (moyenne, en planant).
- **L'école** : portemanteaux, tableau, petites tables, étagères jusqu'à l'oculus. La porte de la rue s'ouvre de l'intérieur (Agir sur la poignée) : un raccourci.
- **Le monde étrange de l'école** (par l'oculus) : sol de crayons, tables géantes (moyen jusqu'à la lanterne), piles de livres et chaises qui flottent (difficile), jusqu'au couvercle de la trieuse de formes. Impossible sans le parapluie.
- **La boîte à formes** : on la regarde, on ne la prend pas ; un trou a la forme de Maria. Nouvel onglet du cahier **« Monde étrange »**.
- **Fin du niveau** : la cour au crépuscule, maman vient chercher Céleste ; la nuit, la grue au loin par la fenêtre, une lueur au bout de la flèche ; se coucher ; au matin, la porte de la palissade du chantier est ouverte (lueur, présage). Maman montre aussi la grue.
- DEBUG → Histoire : « l'école ouverte (monde étrange à faire) » et « le lendemain de l'école (palissade ouverte) » ; cocher « Capacité : parapluie ».
- Tests : 473. Vérifié dans Chromium : la cour, le panier, la porte de l'école, la classe, les étagères, le monde étrange, la boîte, le crépuscule et maman, la chambre la nuit (grue et lueur), le matin, la palissade ouverte, l'onglet « Monde étrange », les cinq onglets à 740 px de large.
- [ ] À vérifier sur téléphone : le trou du grillage se comprend-il comme le chemin, une fois le parapluie trouvé ? Planer jusqu'à la cour : facile ?
- [ ] La porte de l'école qu'on ouvre de l'intérieur : se remarque-t-elle (étincelle) ?
- [ ] Le monde étrange : moyen puis difficile, juste ? Les crayons se lisent-ils comme un danger ?
- [ ] La boîte : le trou à la forme de Maria se reconnaît-il ? Sinon, on l'enlève (option C).
- [ ] La fin : le crépuscule, maman, la grue par la fenêtre, le matin : assez lent, compréhensible ? Donne-t-elle envie de retourner au chantier ?
- [ ] Le cahier : les cinq onglets se lisent-ils et se touchent-ils bien ?

### Le quartier, PR 3 : la supérette et le chantier (D-63)

- **La supérette** (porte de la rue) : papa fait les courses ; caisse, rayonnages, frigos ; au fond la réserve, une pile de cartons puis un saut (moyen) jusqu'à la porte qui donne sur le chantier.
- **Le chantier** : cheminée entre une banche pendue à la grue et un mur de béton (saut mural), l'échafaudage et sa lanterne (moyen), puis des planches au-dessus des gravats jusqu'à la flèche de la grue (difficile), avec deux araignées. **Le parapluie** est au bout de la flèche (bulle d'aide, page « Mes capacités »).
- **Boucle** : avec le parapluie, on plane jusqu'à la sortie haute du chantier, qui ramène en haut de l'échafaudage de la rue. Trouvaille sur la lampe de chantier (difficile, en planant).
- **Histoire** : maman montre papa ; papa montre la grue. Papa a quitté le potager.
- **Revisites avec le parapluie** : l'antenne du toit de la supérette (rue) et un nichoir au fond du potager, toutes deux moyennes.
- Tests : 464. Vérifié dans Chromium : porte de la supérette, papa et sa bulle (grue), réserve, chantier en entier (banche, mur, échafaudage, flèche, araignées), antenne, nichoir, carte « Mon quartier ».
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « portillon ouvert (la rue) ») : la porte de la supérette se remarque-t-elle ? Les bulles de maman (papa) et de papa (la grue) se comprennent-elles ?
- [ ] La réserve : le saut vers la porte est-il moyen ? On voit où aller ?
- [ ] Le chantier : la cheminée, puis les planches après la lanterne (difficile) : juste ? Les araignées gênent-elles trop ? Les gravats se lisent-ils comme un danger ?
- [ ] Le parapluie : le trouve-t-on, et la bulle d'aide suffit-elle pour planer jusqu'à la sortie haute ?
- [ ] Les revisites (antenne, nichoir) : se remarquent-elles, donnent-elles envie ?

### Le quartier, PR 2 : le parapluie (D-62)

- **Geste** : en l'air, appuyer encore sur Saut et le garder : le parapluie s'ouvre, Céleste plane (chute lente). Lâcher : il se referme. Les sauts ordinaires ne changent pas ; le jump buffering marche toujours.
- **Marionnette** : Céleste tient le parapluie (jaune à pois) bien haut.
- **Aide** : bulle pictogramme à l'obtention (deux sauts, le parapluie) ; nouvel onglet du cahier **« Mes capacités »** (pictogramme et comment s'en servir, cases vides pour les autres).
- **Parcours d'essai 8 « Parapluie »** (menu pause) ; case « Capacité : parapluie » dans DEBUG ; réglages `glideFallSpeed` et `glideBrake`.
- **Analyse de faisabilité** avec le parapluie (option) : sans elle, rien ne change.
- Tests : 455. Vérifié dans Chromium : plané dans le parcours 8 (50 px/s), parapluie dessiné, bulle d'aide, page « Mes capacités ».
- [ ] À vérifier sur téléphone (menu pause → Parcours d'essai → « 8. Parapluie ») : la deuxième pression vient-elle naturellement au pouce ? Le parapluie s'ouvre-t-il quand on le veut, et jamais sans le vouloir ?
- [ ] La vitesse du plané (`glideFallSpeed`, 50) et le freinage (`glideBrake`) : trop lent, trop « flotteur » ? Exporter le JSON du debug.
- [ ] La bulle d'aide se comprend-elle ? La page « Mes capacités » : lisible, les quatre onglets se touchent-ils bien ?

### Le quartier, PR 1 : portes de façade et aire de jeux (D-61)

- **Plan du niveau validé** (D-61) : lieux connectés, monde étrange dans l'école (boîte à formes), parapluie au chantier, maman à l'aire de jeux et papa à la supérette, fin au crépuscule et palissade du chantier ouverte au matin.
- **Portes de façade** : Agir devant une porte au milieu d'une salle (étincelle, bouton « Agir ») pour entrer dans un lieu ; on en ressort par sa sortie et on se retrouve devant la porte. Carte : trait de la porte au lieu, dessiné au-dessus de la rue.
- **L'aire de jeux** (derrière le portillon de la rue) : maman sur un banc (bulles), lanterne, bac à sable, tourniquet, cage à écureuil, portique, tour du toboggan (moyenne), nichoir (trouvaille difficile, depuis le toit de la tour). Au fond, le grillage de l'école et son trou, hors d'atteinte pour l'instant (le parapluie).
- Tests : 444. Vérifié dans Chromium : la porte (étincelle, Agir), l'arrivée, maman et ses bulles, la tour, le toit, le nichoir, le retour dans la rue devant la porte, la page « Mon quartier ».
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « portillon ouvert (la rue) ») : la porte de l'aire de jeux se remarque-t-elle (portillon ouvert, étincelle) ? Agir y fait-il entrer sans hésiter ?
- [ ] L'aire de jeux : agréable, lisible (sol souple, barreaux, poutre du portique) ? Le saut vers la tour : moyen ? Le nichoir : difficile mais juste ?
- [ ] Le grillage de l'école et son trou donnent-ils envie de revenir ? Maman sur le banc : bien placée, pas trop grande ?

### La sortie du jardin : le portillon et la rue (D-60)

- **Le portillon**, au bout d'un passage sous le vieux mur de l'allée (au fond de la cheminée). Il s'ouvre en tirant la **chevillette**, pendue haut dans la cheminée (saut mural), après le bonnet. Papa, au potager, montre le portillon.
- **La rue** : un grand niveau en long (200 tuiles, de jour). Trottoir facile, étage du dessus plus difficile (rebords, corniche, store, lampadaires, échafaudage), deux trouvailles moyennes, deux lanternes. Quatre portes fermées pour l'instant (bulle « ? ») : aire de jeux, école, supérette, chantier.
- **Carte** : nouvelle page « Mon quartier » dans le cahier.
- **Moteur** : les salles ne dessinent plus que les morceaux proches de la caméra (mémoire et temps de chargement maîtrisés, même pour la rue).
- Tests : 435. Vérifié dans Chromium : portillon fermé (on bute), chevillette et ficelle, passage vers la rue et retour, la rue d'un bout à l'autre, toits, page du cahier, salon inchangé.
- [ ] À vérifier sur téléphone (DEBUG → Histoire → « le bonnet trouvé ») : la chevillette se voit-elle, et comprend-on qu'il faut la tirer ? L'atteindre en saut mural : juste assez difficile ?
- [ ] La rue : agréable à parcourir, pas trop longue ? L'étage du dessus donne-t-il envie ? Les deux trouvailles (école, échafaudage) : moyennes ?
- [ ] Changement de salle vers la rue : le noir ne dure pas trop ; pas d'accroc en courant (blocs dessinés à la volée) ; nombre de « blocs » dans les INFOS.
- [ ] Les façades (maisons, école, supérette, chantier) : lisibles, pas trop chargées ?

### Menu pause allégé, mode debug depuis le menu (D-59)

- Menu du jeu : Carte, Retour à l'accueil, Son, Commandes tactiles (taille, opacité), Sauvegarde, **Mode debug**.
- Joystick numérique/analogique, résolution et parcours d'essai : dans le mode debug seulement.
- « Passer en mode debug » / « Quitter le mode debug » : même partie, reprise à la dernière lanterne (réseau nécessaire pour le mode debug).
- Overlay de debug : bouton **INFOS** pour masquer ou afficher le cadre d'infos (choix retenu).
- Vérifié sur les deux builds servis ensemble (`vite preview`) : aller-retour entre les deux, partie retrouvée, menus sur téléphone émulé.
- [ ] À vérifier sur téléphone : le passage en mode debug et retour, aussi depuis l'application installée.

### Retours du téléphone : croissance, affaires de Maria, réveil dans l'herbe (D-58)

- **Après le monde étrange** : papa à la porte montre maman ; au salon, câlin de maman ; la nuit tombe ; se coucher fait passer « quelques mois plus tard ».
- **Les affaires de Maria** : chausson, biberon, bandeau et bonnet se ramassent avec Agir, disparaissent du jeu et vont dans un nouvel onglet du cahier, « Les affaires de Maria ».
- **Sortie de derrière la haie** : Céleste assise dans l'herbe, le bonnet à côté d'elle.
- Tests : 425. Vérifié dans Chromium : bandeau ramassé, bulle de papa (maman), câlin puis nuit et bulle « lit », les deux pages du cahier, réveil dans l'herbe.
- [ ] À vérifier sur téléphone : la bulle de papa se comprend-elle (aller voir maman) ? La nuit qui tombe après le câlin : assez lente ? On pense à aller se coucher ?
- [ ] Les affaires de Maria : les étincelles se voient ; l'onglet se touche facilement (trois onglets sur la largeur).
- [ ] Le réveil dans l'herbe se lit-il (assise, puis debout) ? Le bonnet dans l'herbe se voit-il ?

### Musique : le lecteur est prêt (D-57)

- **Déposer les morceaux** dans `src/assets/audio/` (voir `LISEZMOI.md`), nommés : `title`, `house-night`, `house-day`, `garden`, `strange`, `hedge` ; jingles courts `found`, `memory`, `maria`. Formats : `.ogg`/`.opus` (préféré), `.m4a`, `.mp3`. Un emplacement vide reste silencieux.
- **Poids** : 12 Mo au total au maximum (tests). Environ 96 kbit/s par morceau.
- Fondus enchaînés entre thèmes, boucle en fondu enchaîné avec la fin du morceau, musique baissée pendant la pause et les jingles.
- **Silence de Maria** : la musique se tait au réveil devant le berceau vide, quand on aperçoit Maria, à sa disparition, à l'entrée derrière la haie, devant le berceau vide et le bonnet. Jingle `maria` s'il existe.
- Menu pause : **Son** (volume, couper le son), sauvegardé.
- [ ] À vérifier sur téléphone, une fois les morceaux déposés : volume par défaut (70 %), fondus (2,5 s), la boucle s'entend-elle ? Le silence de Maria : silence ou jingle étrange ? Le son se coupe-t-il bien quand on quitte l'appli (et reprend au retour) ? La musique démarre au premier toucher sur l'accueil.
- [ ] Taille du téléchargement à l'installation.

### Dangers du sol et ennemis vaincus (D-56)

- Tous les dangers du sol piquent (orties, briques de jeu, ronces de derrière la haie) : rebond vers l'avant, la peur monte ; plus d'évanouissement immédiat.
- Contact d'un ennemi : recul inchangé.
- Un ennemi vaincu reste absent tant que Céleste est dans la salle ; il revient après un évanouissement ou quand on revient dans la salle.
- [ ] À vérifier sur téléphone : le rebond vers l'avant sur les orties et les ronces ; derrière la haie, encore assez tendu ?

### Papa montre la suite (D-55)

- Une fois le saut mural trouvé, papa au potager montre la haie et son trou qui scintille (retourner le voir : l'indicateur réapparaît au-dessus de lui). Suite : au pied du grand arbre, devant le trou de la haie, Action.
- [ ] À vérifier sur téléphone : l'indice se comprend-il ?

### Araignées : juste milieu (D-54)

- Deux araignées dans le grand arbre et deux dans l'allée (une de plus dans chaque), un peu plus rapides (3,8 s au lieu de 4,5 s). Il existe toujours un moment pour passer (testé).
- [ ] À vérifier sur téléphone : le bon niveau de difficulté cette fois ?

### Les parents d'après tes illustrations (D-53)

- Maman : longs cheveux bouclés, tee-shirt rose, jean clair. Papa : cheveux ondulés, barbe courte, tee-shirt marine, jean foncé retroussé. Mêmes baskets claires à bande bleue. Poses inchangées.
- Lunettes de soleil au jardin seulement. La photo de famille du salon suit les nouvelles couleurs.
- [ ] À vérifier sur téléphone : reconnaissables ? Papa en marine se détache-t-il assez des murs bleus la nuit (porte de la chambre) ?

### Retour à l'accueil depuis la pause (D-52)

- Bouton « Retour à l'accueil » dans le menu pause, à côté de « Carte », avec confirmation. La partie est déjà sauvegardée à chaque lanterne et événement ; les écritures en cours sont terminées avant de revenir à l'accueil, et « Continuer » reprend à la dernière lanterne.
- [ ] À vérifier sur téléphone : le bouton, la confirmation, puis « Continuer » (application installée et hors ligne aussi).

### Jardin adouci (D-51)

- **Orties qui piquent** (`^`) : Céleste rebondit en arrière, la peur monte d'un cran ; plus de retour immédiat à la lanterne. Trois piqûres rapprochées la font s'évanouir. Les briques de jeu de la maison piquent aussi.
- **Ronces fatales** (`!`, nouvelles, épines rouges) : derrière la haie seulement, et pour les zones suivantes.
- **Araignées** : une dans le grand arbre, une dans l'allée, aucune ailleurs ; plus lentes (4,5 s) et descendant moins bas (3 tuiles) ; testé qu'il existe toujours un moment pour passer.
- **Lanterne** au milieu du potager.

### À vérifier sur téléphone (D-51)

- [ ] Orties : le rebond est-il lisible et juste assez punitif ? (réglages **DEBUG → Combat** : `stingBounceY`, `stingCooldownMs`)
- [ ] Araignées : on voit quand passer ? Encore trop gênantes ou devenues trop faciles ? (`spiderDropTiles`, `spiderPeriodMs`)
- [ ] Derrière la haie : les ronces se reconnaissent-elles comme plus dangereuses que les orties ?

### Retours du téléphone : bulles, parents, graphisme du jardin (D-50)

- **Bulles plus grandes** : ×1,9 au lieu de ×1,6, nuage un peu plus large, pictogrammes agrandis de 30 % dans la bulle (environ +55 % à l'écran).
- **Parents au jardin** : maman répond par une loupe (« cherche bien »), papa par la cabane dans l'arbre (un indice), puis un cœur.
- **Jardin retravaillé** :
  - plus rien ne flotte : le vieux mur du grand arbre descend jusqu'à un portail en pierre avec linteau ; les planches du potager tiennent sur des perches croisées plantées dans le sol ou les bacs ; la haie de l'allée continue en tunnel derrière le passage ; le plancher de la cabane a des jambes de force ;
  - dessins plus riches : feuillage en volumes et festons, buissons fleuris, tronc ombré avec nœuds et mousse, branches qui s'amincissent, bacs de légumes (choux, carottes, salades), pergola et glycine, nappe à carreaux, pots fleuris, remise (porte, fenêtre, jardinière), clôture à lattes et lierre, vieux mur en pierres irrégulières, façade de la maison (volets, jardinière) ;
  - ciel : nuages en coussins, deux plans de collines, arbres lointains ; herbe en touffes avec quelques fleurs ;
  - fil à linge tenu par deux piquets plantés dans le sol (terrasse et buanderie).

### À vérifier sur téléphone (retours D-50)

- [ ] Les bulles : assez grandes maintenant, pas trop ?
- [ ] Le jardin : plus joli, cohérent ? Quelque chose flotte-t-il encore ?

### Retour du téléphone (jardin)

- Le fil à linge de la terrasse était trop haut pour la main de maman : descendu de 3 tuiles, la chaussette qu'elle tient est maintenant sur le fil.

### Derrière la haie (D-49)

- **Entrée** : le trou de la haie, au pied du grand arbre. Une fois le saut mural trouvé dans la cabane, un présage monte en s'en approchant ; Agir : scintillement, tremblement, clignement dans le noir, le jardin renversé se révèle en cercle.
- **Jardin renversé** (moyen) : bacs géants au-dessus des ronces, fleur et arrosoir démesurés en silhouettes, une cheminée entre deux tuteurs géants (saut mural).
- **La ronce** (difficile) : une première cheminée (moyenne) le long d'une haie, avec un **escargot** qui monte et descend sur elle ; une veilleuse turquoise ; puis la cheminée difficile, jusqu'au **bonnet de Maria**. Maria est assise de l'autre côté du vide, hors d'atteinte.
- **Fin** : le cercle se referme ; Céleste est au pied du grand arbre (nouvelle lanterne, point de retour), le bonnet accroché à une branche. Souvenir « le bonnet » dans le cahier ; on peut revenir le regarder.
- **Règles** (comme D-34) : pas de sortie volontaire ; un évanouissement avant la veilleuse ramène au jardin, et le trou de la haie y ramène (version courte).
- **Escargot** (`o`) : collé à son mur, monte et descend, demi-tour aux bouts ; un coup le fait rentrer dans sa coquille (inoffensif), deux le dispersent.
- Tests : 399. Salles étranges hors carte, entrée par la haie seulement et après la cabane, chemin difficile exactement, moyen jusqu'à la dernière veilleuse, Maria hors d'atteinte, fin au grand arbre avec souvenir, escargot.
- Vérifié dans Chromium : Agir au trou → jardin renversé ; la ronce ; Agir sur le bonnet → retour au grand arbre, bulle Maria, bonnet sur la branche.

### À vérifier sur téléphone (derrière la haie)

- [ ] Le présage et le passage par la haie : assez lents, assez étranges, jamais effrayants ?
- [ ] La lisibilité des ronces (danger) et des bords en turquoise sur le fond violet.
- [ ] L'escargot : se voit-il sur la haie ? Gêne-t-il la glissade juste ce qu'il faut ?
- [ ] La cheminée difficile (5 tuiles) : difficile mais juste ? Trop tôt dans le jeu ?
- [ ] Le bonnet se lit-il comme un bonnet, sur le rebord puis sur la branche ?

### Le jardin (D-46 à D-48)

- **Accès** : porte de derrière de la buanderie. En phase 1, la poignée est trop haute (bulle « poignée ») ; ouverte une fois Céleste grandie. Nouveau : une sortie peut être fermée seule (`lockedRooms` avec `exit` et `icon`).
- **Cinq salles** (dans la zone de la maison, sur la carte à droite de la buanderie) :
  - **terrasse** (facile) : lanterne (point de retour), maman étend le linge, pergola ;
  - **potager** (moyen) : bacs surélevés au-dessus des orties, papa arrose ; trouvaille en haut des tuteurs (moyenne, planches d'une tuile) ;
  - **grand arbre** (moyen) : branches et buissons de la haie, en grimpant ; deux araignées ; trou sombre dans la haie, au fond (pour la PR 2b) ;
  - **cabane dans l'arbre** : le saut mural ; une petite cheminée pour l'essayer, trouvaille au-dessus du coffre suspendu ;
  - **allée des toits** (moyen, saut mural) : du haut du vieux mur à la pergola de la terrasse, par une cheminée au-dessus des orties : **boucle** du jardin.
- **Histoire** : au réveil, « quelques mois plus tard », une bulle soleil (il fait beau) ; en sortant, soleil puis Maria (la chercher dehors). Parents au jardin (bulles « ? » puis cœur) ; ils ne sont plus dans la maison après la croissance. Le trou de la haie scintille une fois.
- **Palette du jardin** : ciel, nuages, collines, herbe, pierres, feuillage (`v`, nouveau matériau plein), orties (danger). Tout dessiné par le code (PLACEHOLDER).
- **Araignée** (`a`) : monte et descend au bout de son fil ; un coup l'effraie (elle remonte, inoffensive), deux la dispersent.
- **Revisite de la maison** : armoire à linge sur pieds dans la buanderie ; la cheminée entre elle et le mur mène à une trouvaille, seulement avec le saut mural.
- Tests : 391. Jardin fermé en phase 1 ; chemin jusqu'au saut mural moyen exactement ; vieux mur et allée seulement avec le saut mural ; boucle ; jamais coincée (avec et sans saut mural) ; trouvailles ; pas d'ennemi près des parents ; araignée ; le saut mural n'ouvre que l'armoire dans la maison.
- Vérifié dans Chromium : bulle « poignée » en phase 1, sortie en phase 2, bulles d'arrivée, maman, papa, araignées, saut mural ramassé (sauvegardé, indice affiché).

### À vérifier sur téléphone (jardin)

Après merge, sur https://kalypst.github.io/Maria/debug/ (debug : étape « quelques mois plus tard », ou case « Céleste a grandi », puis téléportation) :

- [ ] Lisibilité du dehors : herbe, orties, feuillage où l'on grimpe, bords praticables.
- [ ] Difficulté : le potager et l'arbre sont-ils bien un cran au-dessus de la maison, sans être pénibles ?
- [ ] Les araignées : lisibles, pas effrayantes, gênantes juste ce qu'il faut.
- [ ] La cheminée de l'allée au-dessus des orties : moyenne ou trop punitive ?
- [ ] Les bulles (soleil, Maria), les parents au jardin.
- [ ] L'armoire à linge : donne-t-elle envie de revenir une fois le saut mural trouvé ?

### Saut mural (D-44, D-45)

- Glissade contre un mur en descente, en poussant vers lui (seuil 0,5) ; saut mural à l'opposé (2,5 tuiles, 150 px/s), direction ignorée 130 ms ; 80 ms de tolérance après avoir quitté le mur.
- Un seul mur ne se remonte pas : le mur quitté ne retient plus Céleste avant le sol, un rebord ou un autre mur.
- Priorités : au sol, Saut reste un saut normal ; un rebord attrapable passe avant la glissade.
- État `WallSlide`, pose dos au mur. Réglages `wall*` dans l'overlay. Case « Capacité : saut mural » dans l'overlay.
- Parcours d'essai 7 « Saut mural » (menu pause), qui prête l'escalade et le saut mural (`; @abilities:`) : cheminée facile, puis cheminée moyenne au-dessus de briques.
- Analyse de faisabilité : appuis sur les murs comme étapes, fenêtre d'un rebond sur toute la glissade.
- Maison : le saut mural n'y ouvre rien (testé, phase 2). **La lucarne du grenier était déjà atteignable en phase 2** : la revisite par le saut mural est reportée au jardin.
- Tests : 377 (glissade, seuil, montée, rebond, verrou, sol, tolérance, cheminée, un seul mur, sol qui rend le mur, `copyFrom`, analyse inchangée sans capacité, cheminée, un seul mur, parcours 7, maison).
- Vérifié dans Chromium : glissade à 60 px/s, première cheminée remontée en 7 rebonds au clavier.

### À vérifier sur téléphone (saut mural)

Sur https://kalypst.github.io/Maria/debug/ (après merge), menu pause → Parcours d'essai → « 7. Saut mural » :

- [ ] La glissade arrive quand on pousse vers le mur, **et pas quand on ne le veut pas** (retombée le long d'un meuble, diagonale du pouce). Régler `wallInputThreshold`.
- [ ] Le rythme de la cheminée : attendre le haut du saut, rebondir, changer de direction. Pénible ou agréable ?
- [ ] L'élan du rebond (`wallJumpSpeedX`, `wallJumpHeightTiles`) et le verrou (`wallJumpLockMs`) : trop raide, trop mou ?
- [ ] La vitesse de glissade (`wallSlideSpeed`).
- [ ] La deuxième cheminée (moyenne) : juste assez exigeante ?
- [ ] La pose dos au mur se lit-elle ?
- Exporter le JSON du debug et me transmettre les valeurs.

### Croissance : quelques mois plus tard (D-43)

- La phase de croissance se déduit du drapeau `growth.2` (déjà sauvegardé, aucune migration). La configuration est dans `src/config/growth.ts` : hitbox, facteurs de mouvement, proportions, tenue.
- La hitbox est paramétrable dans la physique (`setHitbox`) et dans l'analyse de faisabilité (`hitbox` en option). `tests/zoneGraph.ts` analyse chaque phase.
- Passage du temps : après la visite de papa, se recoucher donne le noir le plus long, puis Céleste grandie, en robe.
- Toise de la chambre avec un nouveau trait, qui devient un souvenir.
- Trouvaille sur l'étagère haute du couloir, atteignable seulement en phase 2.
- Marionnette : robe rose à fleurs, sabots, couettes plus longues, corps allongé.
- Écran de départ : illustration en robe pour une partie en phase 2.
- Debug : étape « quelques mois plus tard » et case « Céleste a grandi ».

### À vérifier sur téléphone (croissance)

- Le passage du temps : durée du noir, retour, bulle « Maria ? ».
- Céleste grandie : se lit-elle bien, la robe est-elle reconnaissable, les proportions sont-elles justes ?
- Le saut plus haut : la sensation reste-t-elle la même, en un peu plus ample ?
- La trouvaille du couloir : visible avant, atteignable après en grimpant depuis la console, pas trop facile.
- La toise : le nouveau trait se remarque-t-il ?

### Chat agrandi (D-42)

- Le chat gris est deux fois plus grand (`CAT_SCALE`), endormi sur le tabouret comme assis dans le salon. À vérifier sur téléphone.

### Retours du téléphone (D-40)

- Le présage du salon dépend de la distance à Maria (rayon 13 tuiles), plus de la hauteur : rien sur la tringle ni sur le canapé.
- Les mains des parents ne sont plus coupées : le cadre du dessin a une marge de chaque côté.
- Céleste d'après l'illustration de l'utilisateur (D-41) : l'illustration sur l'écran de départ, la marionnette redessinée (pyjama bleu à myrtilles, liserés et nœuds roses, taches de rousseur, chaussons lapin). Le pyjama est la tenue de la maison seulement.

### À vérifier sur téléphone (retours)

- Le salon : l'effet étrange ne vient qu'en s'approchant de la bibliothèque, et monte bien près de Maria.
- Les mains : papa à la porte, sa tasse, maman au lit et son livre.
- Céleste en pyjama bleu : bien visible sur les murs de la maison, la nuit comme le matin (salon surtout).
- L'écran de départ : l'illustration à gauche du menu, nette, sans bord blanc.

### Rez-de-chaussée retravaillé (D-39)

- Salon : vrai canapé (maman assise dedans), route haute par la gauche jusqu'à la bibliothèque (meuble mural en grimpant, étagères, tringle du rideau), trouvaille à droite du haut de la bibliothèque, photo de Céleste bébé avec Maria en haut de la bibliothèque après le monde étrange (souvenir).
- Cuisine : étagères à bocaux de la table vers les placards hauts (la dernière marche en grimpant), trouvaille sur les placards, jouet mécanique sur la table, loin de papa. Le frigo prévu est écarté (il coupait le chemin vers la buanderie).
- Buanderie : fil à linge.
- Tests : 348 (route haute, trouvailles au plus moyennes, photo après le monde étrange ; la maison reste facile).
- **Vérifié dans Chromium** : salon, cuisine et buanderie en entier.

### À vérifier sur téléphone (rez-de-chaussée)

- [ ] La route haute du salon donne envie d'être explorée ; le meuble mural s'escalade sans peine.
- [ ] La trouvaille du salon (à droite de la bibliothèque) et celle de la cuisine se remarquent.
- [ ] Revenir au salon après le monde étrange pour la photo de Céleste bébé a du sens (on y pense ?).

### Maison vivante : mouvements, objets à regarder, souvenirs (§22.1, D-38)

- Mouvements doux : poussière dans la lumière, trotteuse, rideaux, veilleuses qui respirent, machine à laver le matin, plante, boîte à musique.
- Objets à regarder avec Agir : photo de famille (salon), dessin (chambre), boîte à musique (étagère du lit), plante (cuisine). Rejouables.
- Souvenirs dans le cahier : onglets « Ma maison » et « Mes souvenirs », cases en pointillés, souvenir en grand au toucher ; le bandeau de Maria à la fin du monde étrange.
- Tests : 344 (souvenirs obtenables, objets rejouables, validation, sauvegarde des souvenirs).
- **Vérifié dans Chromium** : les objets et leurs bulles, la machine, la photo de famille, les deux pages du cahier.

### À vérifier sur téléphone (maison vivante)

- [ ] Les étincelles des objets se voient ; les objets se trouvent sans aide.
- [ ] Les onglets du cahier se touchent facilement ; toucher hors d'une case referme le cahier.
- [ ] Les mouvements rendent la maison vivante sans distraire.

### La famille : maman, papa et le chat gris (§8, D-37)

- Le soir : papa à la porte (il rappelle l'heure du lit), maman au bord du lit pour la bonne nuit, le chat qui dort sur le tabouret.
- Le matin : papa à la cuisine avec son café, maman qui lit au salon sous Maria sans la voir, le chat qui regarde le haut de la bibliothèque. Agir près d'un parent : « ? » puis un cœur.
- Après le monde étrange : papa passe la tête par la porte, inquiet.
- Parents à l'échelle de la maison (×2, environ 4,5 fois Céleste), bulles centrées sur leur tête.
- Bulles au-dessus des personnages, petit mouvement en boucle (deux images), nouvelle bulle « ? ».
- Tests : 340 (papa à la porte, bonne nuit, ancienne partie, bulles des parents, personnage absent détecté).
- **Vérifié dans Chromium** : les quatre scènes et leurs bulles.

### À vérifier sur téléphone (la famille)

- [ ] Les parents « à hauteur d'enfant » fonctionnent : présents, rassurants, pas raides.
- [ ] Le moment de maman sous Maria (elle ne la voit pas) se remarque.
- [ ] Le soir ne devient pas trop long avec la bonne nuit.
- [ ] Les jouets mécaniques près de papa ne choquent pas trop (limite connue).

### Monde étrange : palette crépuscule et nouvelles animations (D-36)

- Palette B « crépuscule » : violet et bleu nuit, halos roses, bords turquoise. Les lueurs des effets suivent la palette.
- Frissons de temps en temps (poussière qui tombe, lueurs qui vacillent), jamais pendant un saut.
- Scintillements qui tombent, lampe de la chambre qui s'allume et s'éteint dans la fenêtre, ombre de l'ours qui glisse.
- Décision : la difficulté du chemin principal montera zone après zone, jusqu'à difficile à la fin.
- Tests : 337 (frissons : jamais en l'air, durée, intervalle).
- **Vérifié dans Chromium** : les deux salles en palette B, frisson, scintillements, fenêtre, ours.

### À vérifier sur téléphone (palette et animations)

- [ ] La palette crépuscule plaît et les bords des plateformes restent bien lisibles.
- [ ] Les frissons se remarquent sans gêner, et n'arrivent jamais pendant un saut.
- [ ] Les scintillements qui tombent ne sont jamais pris pour des objets à ramasser.
- [ ] L'ombre de l'ours et la lampe de la chambre se remarquent.

### Ambiance du monde étrange (D-35, retours de l'utilisateur)

- **Passage réel → étrange** :
  - en grimpant vers Maria, les couleurs se refroidissent, la lumière vacille, puis un léger tremblement ;
  - au sommet, des scintillements autour de Maria (jamais sur elle) et un tremblement avant le clignement ;
  - le monde étrange se révèle en cercle autour de Céleste ;
  - à la fin, le cercle se referme sur elle près du berceau.
- **Maison déformée** : cadres penchés, portes au plafond et murée, escalier dans le mur, papier peint qui pèle, chaise et crayon géants, fenêtre sur la chambre de Céleste, ombre d'ours géante, murs qui se resserrent.
- **Vie étrange** : poussière qui monte, objets de la maison à la dérive, horloge qui recule, rideaux sans vent, lampes qui vacillent, lueurs qui respirent, yeux qui se ferment quand Céleste approche.
- Tests : 336 (yeux, zones vides des objets à la dérive, meubles flottants, présage, fondu en cercle, nouvelles étapes).
- **Vérifié dans Chromium** : présage pendant l'escalade, scintillements, ouverture et fermeture en cercle, habillage des deux salles, 60 images/s.

### À vérifier sur téléphone (ambiance)

- [ ] Le présage se sent pendant l'escalade sans gêner les sauts.
- [ ] Le tremblement ne met pas mal à l'aise (sinon, réduire `STRANGE_FX.omenShakePx` et `shakePx`).
- [ ] Les objets à la dérive et l'escalier dans le mur ne sont jamais pris pour des plateformes.
- [ ] Les yeux inquiètent un peu, jamais trop.
- [ ] Fluidité dans le passage d'ombres (environ 50 objets animés de plus).

### Monde étrange jouable (§6.2, D-34)

- **Entrée** : en haut de la bibliothèque, le clignement fait passer Céleste, dans le noir, dans le **salon étrange** (même place, bulle « Maria ? »). Après un évanouissement avant la veilleuse turquoise (retour au point de retour réel), le haut de la bibliothèque y ramène par un clignement bref, tant que la fin n'est pas vécue.
- **Salon étrange** (66 × 24, facile) : même taille que le vrai salon, portes murées, bibliothèque à la même place ; canapé, table et poufs flottent ; on redescend, on traverse le sol (deux jouets-ombres, briques), on remonte les meubles flottants jusqu'à l'ouverture en haut du mur gauche.
- **Passage d'ombres** (46 × 44, moyen) : montée d'étagères flottantes ; veilleuse turquoise au tiers ; **deux sauts moyens** (écart de 6 tuiles, fenêtre 133 ms), une étagère rattrape chaque chute ; **Maria** assise sur une étagère de l'autre côté du vide, hors d'atteinte ; **trouvaille difficile** (67 ms) en haut à droite ; un **berceau vide** tout en haut.
- **Fin** : Agir au berceau, long fondu (comme la nuit), Céleste assise sur son lit, le **bandeau** à côté d'elle, bulle avec le visage de Maria. Le point de retour repasse à la veilleuse de la chambre.
- **Carte** : les salles étranges n'y figurent pas ; ouverte dans le monde étrange, elle ne dessine pas Céleste.
- **Rendu** : lueur turquoise immobile sous les meubles qui flottent ; veilleuse turquoise.
- **Moteur** : étape de script `room` (changement de salle dans le noir, point de retour optionnel), directive de salle `; @world: strange`. Supprimés : le basculement du salon réel par étapes (`strangeRooms`), le déclencheur « en quittant le salon » et les étapes `living.left` et `headband.found`.
- **Debug** : liste « Histoire » (monde étrange ouvert, fin du monde étrange) ; les deux salles sont dans la téléportation.
- Tests : 329. Faisabilité du monde étrange : jamais coincée, chemin principal exactement moyen, Maria jamais atteignable (même en grimpant), trouvaille difficile, entrée seulement par l'histoire. Validation des scripts : changement de salle seulement dans le noir, sur un sol, point de retour avec une veilleuse.
- **Vérifié dans Chromium** : clignement puis salon étrange, habillage des deux salles, veilleuse turquoise sauvegardée puis reprise après rechargement dans le passage, fin dans la chambre (bandeau, bulle, point de retour).

### À vérifier sur téléphone (monde étrange jouable)

- [ ] **Chronomètre** : temps passé dans le monde étrange (visé : 3 à 5 min), et temps du slice complet.
- [ ] Les deux sauts moyens du passage sont exigeants sans être frustrants ; les chutes ne font perdre qu'un palier.
- [ ] Les jouets-ombres ne gênent pas les réceptions (l'analyse de difficulté ne voit pas les ennemis).
- [ ] Maria se remarque de l'autre côté du vide, et on comprend qu'on ne peut pas l'atteindre.
- [ ] Le noir du clignement ne dure pas trop longtemps (dessin de la salle pendant le noir).
- [ ] La fin (berceau vide, chambre, bandeau) serre un peu le cœur sans rien expliquer.
- [ ] Un évanouissement avant la veilleuse ramène à la maison, et le haut de la bibliothèque ramène au monde étrange.
- [ ] Partie existante : si l'ancienne fin avait déjà été vécue, le bandeau disparaît du lit jusqu'à la nouvelle fin (voulu).

### Histoire ralentie (D-33, retours de l'utilisateur)

- Bulles plus grandes (×1,6) et plus longues (3 s).
- Soirée rallongée : câlin, puis histoire du soir (livre). La **couverture de Maria** est à aller chercher sur l'étagère du bureau avant de la coucher. Céleste regarde Maria dormir, puis s'assoit sur son lit pour un dernier regard.
- Nuit plus lente (environ 6,5 s en tout), bascule vers le monde étrange plus lente (2,5 s).
- Céleste s'arrête un instant devant les traces, Maria sur la bibliothèque et le bandeau.
- Ennemis du monde étrange un peu plus visibles (ombre gris-bleu, liseré turquoise).
- Tests : 319 (couverture atteignable sans grimper, coucher impossible sans elle, objet ramassé, jamais Maria).
- **Vérifié dans Chromium** : bulles cœur, livre et couverture, couverture sur l'étagère puis ramassée, ennemi du salon étrange.

### Maria dans la bibliothèque, monde étrange, bandeau (§6, D-32)

- **Salon, au matin** : Maria assise en haut de la bibliothèque, visible du sol ; en l'apercevant, bulle avec son visage.
- **En haut** (en grimpant) : clignement, Maria n'y est plus, le salon bascule dans le **monde étrange** (bulle « Maria ? »). En quittant le salon, tout redevient normal.
- **Chambre** : le **bandeau de Maria** est sur le lit ; bulle avec son visage en s'approchant.
- **Céleste en couleurs** dans le monde étrange (lisibilité).
- **Debug** : liste « Histoire » complétée (Maria disparue, retour au réel).
- Tests : 318 (disparition seulement dans le noir, bascule et retour, bandeau, déclencheur en quittant la salle).
- **Vérifié dans Chromium** : Maria vue du sol, escalade de la bibliothèque, clignement et salon étrange, retour par la cuisine, bandeau sur le lit.

### À vérifier sur téléphone (monde étrange)

- [ ] Maria se remarque en haut de la bibliothèque et donne envie d'y monter.
- [ ] Le clignement surprend sans faire peur ; le salon étrange inquiète un peu, jamais horreur.
- [ ] Le bandeau sur le lit se remarque ; le moment serre un peu le cœur.
- [ ] Céleste reste lisible dans le monde étrange.

### Prologue : le soir, le réveil, les traces (§5.2, §33, D-31)

- **Le soir** (nouvelle partie, palette de nuit, portes de la chambre fermées) :
  1. Maria est assise sur le tapis ; Agir : fondu, Céleste assise joue avec elle (bulle cœur), puis bulle « berceau » ;
  2. Agir de nouveau : fondu, Maria est couchée dans son berceau (sur le coffre à jouets), bulle « lit » ;
  3. Agir sur le lit : la nuit passe (long fondu).
- **Le matin** (palette jour) : Céleste assise dans son lit, berceau vide et défait, bulle « Maria ? ». Elle se relève dès qu'on la fait bouger.
- **Traces** : un chausson de poupée dans le couloir, un biberon sur le palier de l'escalier ; en passant, bulle avec le visage de Maria.
- **Maria ne bouge jamais à l'écran** : ses changements de place ont lieu dans le noir ; règle garantie par une fonction testée.
- **Commandes** : étincelle au-dessus de ce qu'on peut faire, et le bouton Action devient « Agir » (clavier : E ou J).
- **Image de Maria** fournie par l'utilisateur, détourée ; aussi dans le berceau et les bulles.
- **Sauvegarde v2** : étapes de l'histoire enregistrées aussitôt ; une ancienne partie est migrée avec le prologue considéré comme vécu.
- **Debug** : liste « Histoire » (soir, a joué, Maria couchée, matin, traces vues), sans sauvegarde.
- Tests : 316 (conditions, scripts et fondus, objets hors de la vue, cohérence des données, prologue complet, faisabilité du soir sans grimper, migration v1 → v2, pose assise).
- **Vérifié dans Chromium** : tout le prologue (jouer, coucher, porte fermée, nuit, réveil), les deux traces, sauvegarde des étapes.
- **Corrigé en cours de route** : le berceau était d'abord au sol près de la porte, **caché sous le bouton Action** ; il est maintenant sur le coffre à jouets.

### À vérifier sur téléphone (prologue)

- [ ] On comprend sans texte qu'il faut jouer, coucher Maria, puis se coucher (étincelle, bulles, bouton « Agir »).
- [ ] Les fondus ne sont ni trop longs ni trop secs ; la nuit se sent.
- [ ] **L'image de Maria** : se reconnaît-elle à cette taille ? Le décalage avec le style « papier découpé » gêne-t-il ?
- [ ] Le matin : la palette jour plaît-elle ? Le réveil (berceau vide, bulle) serre-t-il un peu le cœur, sans inquiéter trop ?
- [ ] Les traces se remarquent et donnent envie de descendre.

### Carte dessinée par Céleste (§24, D-30)

- **Page du cahier** en plein écran, jeu en pause : bouton tactile **Carte** (à côté de la pause), touche M ou Tab, entrée « Carte » du menu pause. Se referme au toucher, par Carte ou par Pause.
- **Contenu** :
  - salles visitées au crayon tremblé, avec hachures, nom et petit dessin (lit, porte, marches, toit, canapé, casserole, machine) ;
  - salles devinées en pointillés avec « ? » ;
  - passages entre salles voisines, avec un coude si les portes sont décalées ; passages lointains (trappe à linge, grenier ↔ chambre) en amorces de même couleur ;
  - veilleuses allumées, avec le point de retour entouré ;
  - trouvailles ramassées en étoiles roses ;
  - Céleste à sa place dans la salle.
- **Tracé animé** des salles découvertes depuis la dernière ouverture.
- **Données** : disposition dessinée à la main dans `src/levels/house/zone.ts` (`map`) et `@icon` par salle. Aucune migration de sauvegarde.
- Tests : 299 (modèle : visitées, devinées, cachées, passages, Céleste, veilleuses, trouvailles, salles nouvelles ; disposition cohérente avec les portes).
- **Vérifié dans Chromium** : ouverture (M), fermeture (M, toucher), carte en début de partie (chambre et deux « ? »), carte complète avec veilleuses, trouvaille et Céleste.
- **Corrigé en cours de route** : la première disposition du rez-de-chaussée était inversée par rapport aux portes. Un test l'empêche désormais.

### Retours de l'utilisateur à reprendre

- **Maison plus vivante** : plus de petits objets, éléments animés (rideaux, poussière dans la lumière, horloge, lampe qui vacille).
- **Affichage de jour** selon les besoins de l'histoire : une palette « jour », comme le monde étrange.
- **Difficulté croissante** dans les zones suivantes : cible de difficulté par zone (moyen, puis difficile), secrets plus exigeants ; la maison reste la zone d'apprentissage.

### À vérifier sur téléphone (carte)

- [ ] Le bouton Carte se trouve facilement et ne gêne pas.
- [ ] La carte aide à savoir où l'on est et où aller ; les « ? » donnent envie d'explorer.
- [ ] Les amorces de couleur (trappe, grenier) se comprennent.

### Habillage de toute la maison (D-28)

- **Couloir** : console avec plante, panier à linge, banc, étagère murale, rebord de la trappe, patère, deux lampes murales, cadre, horloge, tapis de couloir. Murs à rayures.
- **Escalier** : marches et palier du haut en bois, palier intermédiaire, buffet, étagère, corniche, planches de la rampe, fenêtre, lampe, cadre. Murs en planches.
- **Grenier** : malle, cartons, tapis roulé, poutres, recoin sous le toit, lucarne, ampoule. Murs en planches, sans lambris.
- **Salon** : canapé et coussin, poufs, table basse, bibliothèque garnie de livres, étagère haute, briques de jeu sur le sol, grande fenêtre, lampes, cadre, horloge.
- **Cuisine** : chaises, table, marchepied, plan de travail et placards, placards hauts, hotte, fenêtre, suspension, horloge. Murs carrelés.
- **Buanderie** : rebord de la trappe, placard mural, machine à laver, bassine et tas de linge, étendoir, fenêtre, lampe. Murs carrelés.
- **Jouets mécaniques** : souris à remonter (clé dans le dos), silhouette à l'œil lumineux dans le monde étrange.
- **Méthode** : meubles dessinés d'après leurs tuiles. Le test vérifie que chaque tuile de meuble de chaque salle est habillée.
- **Vérifié dans Chromium** : les six salles en entier (réel et étrange), passages de salle, escalade et trappe, reprise.
- **Mesure** : 160 à 300 ms pour dessiner une salle à l'échelle 3 sur ordinateur, pendant le fondu (à mesurer sur téléphone).

### À vérifier sur téléphone (maison habillée)

- [ ] Chaque salle se reconnaît au premier coup d'œil (couloir, escalier, grenier, salon, cuisine, buanderie).
- [ ] Les surfaces praticables restent lisibles partout, même dans les coins sombres.
- [ ] Changement de salle : le noir entre deux salles ne dure pas trop (dessin de la salle). Sinon, dessiner à l'échelle 2 ou garder les salles voisines en cache.
- [ ] Jouets mécaniques bien visibles (danger lisible).

### Céleste en « papier découpé » (D-29)

- **Pièces** dessinées par le code : tête (lunettes rondes roses, frange), deux couettes à rubans, torse (pyjama à pois), bras, jambes à chaussons. Le côté caché est assombri. Chaque pièce est remplaçable par une image.
- **Poses** (fonctions pures testées) :
  - attente : respiration ;
  - course : jambes et bras en opposition, léger rebond ; le pas suit la distance parcourue ;
  - saut : jambes repliées ; chute : bras écartés ;
  - suspension : bras tendus vers le rebord, jambes qui se balancent ;
  - hissage : traction, jambe qui monte ;
  - coup reçu : recul ;
  - attaque : le bras suit le bâton.

  Les couettes **sautent** : ressort peu amorti, élan à chaque foulée, envolée au saut, retombée qui oscille à la réception (`pigtail*` dans l'overlay). Les passages d'une pose à l'autre sont adoucis.

- **Réglages** dans `src/config/puppet.ts` et dans l'overlay (« Céleste (papier découpé) »).
- Tests : 294 (pas lié à la distance, opposition bras et jambes, retour au repos, bras levés suspendue, continuité des mouvements, couettes qui sautent et se reposent, attaque).
- **Vérifié dans Chromium** : attente, course, saut, chute, suspension, monde étrange ; passages de salle et reprise inchangés.

### À vérifier sur téléphone (Céleste)

- [ ] Céleste se lit bien à la taille du jeu : lunettes, couettes, sens de la course.
- [ ] La course semble « posée » au sol (pas de glissement des pieds) ; sinon régler `strideLengthPx`.
- [ ] L'allure est sobre et vivante, ni raide ni agitée ; les couettes sautent juste assez (`pigtailBounceDegPerS`, `pigtailDamping`).
- [ ] La suspension et le hissage se comprennent.

### Direction artistique : la chambre (D-28)

- **Choix du style** : maquettes A (cahier, crayons), B (ombres et lumière), C (livre illustré), puis D (C enrichi avec la lumière de B ; monde étrange en silhouettes de B). **D validé.**
- **Guide pour créer des images** (IA ou autre) : document « MARIA — Créer des images pour le jeu ».
- **Habillage des salles** : `; @decor:` dans l'ASCII (nom d'élément et rectangle en tuiles). Un test vérifie que chaque tuile de meuble est couverte par un meuble déclaré.
- **La chambre**, dessinée par le code à l'échelle de l'écran :
  - fond : mur à motif, lambris, parquet, fenêtre à rideaux avec la lune, cadre, dessin punaisé, tapis ;
  - meubles : armoire, tête de lit, lit à couette, étagères, coffre à jouets, tabouret, bureau, pile de livres ;
  - encadrement des sorties.
- **Lumière** : obscurité percée par la veilleuse, la lune (et son rai jusqu'au sol) et le passage derrière l'armoire ; halos ; liseré clair sur les surfaces praticables. Les personnages restent au-dessus, lisibles.
- **Céleste** dessinée par le code : pyjama rose à pois, couettes et rubans, lunettes rondes roses, chaussons. Veilleuses (petite lampe champignon), objets et trouvailles redessinés nets.
- **Monde étrange** (overlay « Monde étrange (aperçu) ») : mêmes formes, silhouettes et lumière turquoise.
- **Images fournies** : `ART_IMAGES` dans `src/config/art.ts` (fichiers sous `public/art/`) ; une image remplace le dessin de l'élément du même nom, Céleste comprise.
- Tests : 286 (format `@decor`, cohérence habillage et collision).
- **Vérifié dans Chromium** (paysage 844 × 390, écran ×3) : chambre en résolution logique et en résolution de l'écran, monde étrange ; passages de salle et reprise inchangés.

### À vérifier sur téléphone (chambre habillée)

- [ ] Menu pause → résolution : comparer **logique** et **écran**. Le style est-il nettement plus beau en mode écran, et le jeu reste-t-il fluide (FPS) ?
- [ ] L'ambiance : assez sombre pour être nocturne, pas trop pour jouer ?
- [ ] Les surfaces où l'on marche se repèrent au premier coup d'œil (liserés).
- [ ] Céleste se voit bien sur le lit et devant les meubles.
- [ ] Monde étrange (DEBUG) : inquiétant sans être effrayant ?

### Passe de level design sur la maison (D-27)

- **Méthode** : plan de la zone et image de chaque salle en entier, **validés par l'utilisateur** avant de finaliser. Salles en texte ASCII (pas d'éditeur visuel pour l'instant).
- **Grenier** (nouvelle salle), accessible seulement en grimpant :
  - charpente en pente, malle, cartons, tapis roulé, veilleuse à l'entrée, jouet mécanique ;
  - **premier secret** : quatre poutres jusqu'au recoin sous le toit, où se trouve une **trouvaille** (lueur rose, placeholder) ; difficulté moyenne, saut le plus serré à 150 ms ;
  - **lucarne** hors de portée même en grimpant (capacité future).
- **Escalier** : embranchement vers le grenier (buffet sur le palier, étagère, corniche, en grimpant) ; jouet mécanique en bas.
- **Chambre** : sortie derrière l'armoire vers le grenier. Du grenier, on redescend près du lit : raccourci vers le départ.
- **Deux boucles** : trappe à linge (buanderie → couloir), et chambre → couloir → escalier → grenier → chambre.
- **Trouvailles** (`S`) : enregistrées dans `progression.collectibles`, sans compteur affiché (§23). Pas de texte à la découverte.
- **Tests** (vraie physique, sans et avec escalade) :
  - le grenier ne s'ouvre qu'en grimpant ;
  - le secret est de difficulté moyenne (ni facile, ni au-delà) ;
  - on revient du grenier à la chambre par l'armoire ;
  - aucun endroit sans retour facile.

  283 tests au total.

- **Vérifié dans Chromium** : trouvaille ramassée et sauvegardée ; sortie du grenier sur le dessus de l'armoire, puis descente dans la chambre.
- **Gardé pour plus tard (décision de l'utilisateur)** : le rez-de-chaussée (salon, cuisine, couloir, buanderie) reste presque identique ; les dessus de la bibliothèque et des placards n'ont pas encore de récompense.

### À vérifier sur téléphone (level design)

- [ ] L'embranchement de l'escalier vers le grenier se remarque (on a envie d'y monter).
- [ ] Les poutres du grenier : défi agréable, pas frustrant. La chute ramène au sol du grenier, sans pénalité.
- [ ] La trouvaille se voit et donne envie d'y aller.
- [ ] Le retour par l'armoire donne l'impression d'un vrai raccourci.
- [ ] La lucarne donne l'idée de revenir plus tard.

### Grimper aux rebords (D-26)

- **Geste** (option B validée) :
  - **Accroche** : en descente, en poussant vers un mur, Céleste attrape le bord d'une tuile pleine à hauteur des mains.
  - **Suspension** : Saut hisse aussitôt ; pousser vers le bord ou vers le haut hisse après 120 ms ; pousser vers le bas ou à l'opposé lâche, avec 250 ms avant de pouvoir se raccrocher.
  - **Hissage** : 240 ms, montée puis avance sur le rebord.
  - Pas de nouveau bouton. Pas d'attaque suspendue ; touchée, elle lâche.
- **Garde-fous** :
  - on n'attrape qu'en descente et en poussant vers le bord ;
  - les pieds doivent être nettement sous le bord : un saut qui suffisait pour s'y poser n'est jamais interrompu ;
  - le trajet du hissage est vérifié à l'accroche ;
  - pas d'accroche sans place pour se tenir debout au-dessus.
- **Portée** : rebords jusqu'à environ 4 tuiles et demie au-dessus des pieds (au lieu de 3 en sautant). Tous les réglages `ledge*` sont dans `src/config/movement.ts` et l'overlay.
- **Sans la capacité, le mouvement est inchangé** : parcours d'essai et difficultés identiques.
- **Obtention** : objet placeholder (lueur qui flotte) sur la machine à laver de la buanderie. Il est sauvegardé aussitôt, et un indice de prototype s'affiche 5 s en bas de l'écran. Overlay : « Capacité : grimper aux rebords » (sans sauvegarde).
- **Maison retouchée au minimum** pour que les endroits prévus s'atteignent en grimpant :
  - tête de lit puis armoire (chambre) ;
  - étagère murale puis rebord de la trappe à linge (couloir) ;
  - étagère haute débordante puis dessus de la bibliothèque (salon) ;
  - hotte puis placards hauts (cuisine) ;
  - machine, placard mural puis rebord de la trappe (buanderie).

  La buanderie n'est plus un cul-de-sac : on en ressort par la trappe, ce qui ferme la **boucle** couloir → escalier → salon → cuisine → buanderie → couloir.

- **Analyse de faisabilité** (D-16) avec l'escalade en option. Tests de la maison sans et avec escalade :
  - aucun endroit sans retour facile, dans les deux cas ;
  - objet atteignable sans grimper ;
  - endroits prévus inatteignables sans grimper, faciles en grimpant ;
  - montée de la buanderie à la trappe.
- Tests : 280.
  - Physique : accroche, suspension, hissage, Saut, lâcher, sans pousser, saut suffisant non interrompu, sans place, touchée, `copyFrom`.
  - Analyse, objet, `unlockAbility`, format `A`/`@ability`, maison.
- **Vérifié dans Chromium** : sans capacité, pas d'accroche. Objet ramassé : capacité sauvegardée, indice affiché. Élan sur l'étagère murale, saut : accroche, suspension tenue sans entrée, hissage en poussant, puis trappe et arrivée sur le rebord de la buanderie.
- **Mesure** (tas, 1,4 million de pas, plus de 2 300 hissages) : 0,1 octet par pas, soit le bruit de mesure habituel.

### À vérifier sur téléphone (escalade)

Sur https://kalypst.github.io/Maria/debug/ (après merge) :

- [ ] L'accroche arrive quand on la veut, et **jamais sans la vouloir** : près d'une table, d'un banc, d'un bord qu'on voulait sauter.
- [ ] Pousser en diagonale sur le joystick accroche et hisse (seuil `ledgeInputThreshold`).
- [ ] Hissage ni trop lent ni trop sec (`ledgeClimbMs`). Suspension compréhensible sans animation.
- [ ] Lâcher (bas ou l'opposé) facile. Se raccrocher tout de suite n'est pas frustrant (`ledgeRegrabMs`).
- [ ] L'objet de la buanderie se voit, et l'indice se lit sans gêner.
- [ ] La boucle par la trappe à linge donne une impression de raccourci.

### Phase 6 — La maison (première zone)

- **Thème (D-24)** : l'interface est le cahier de Céleste (papier, crayon, rose des lunettes). Le jeu montre la maison la nuit, adoucie. Le néon a disparu. Couleurs de l'interface uniquement dans les variables CSS `:root`, couleurs du jeu uniquement dans `PLACEHOLDER_COLORS`. Icônes et couleur de lancement (PWA) refaites.
- **Format des salles (D-25)** :
  - matériaux `b` bois et `t` tissu (pleins), `-` étagère (traversable) ;
  - sorties `1`–`9` dans un mur latéral (au moins 2 tuiles, continues : sinon erreur explicite) ;
  - métadonnées `@ambient` (couleur de la salle) et `@note` (repères de level design).
- **Zone (pure, `src/core/world/zone.ts`)** : liaisons `salle:sortie` ↔ `salle:sortie` décrites en données (`src/levels/house/zone.ts`). Validation au chargement :
  - salle inconnue, sortie absente ou reliée deux fois, sortie reliée à rien ;
  - deux murs du même côté ;
  - pas de sol à l'arrivée.

  Détection des sorties sans allocation.

- **La maison** (placeholders à l'échelle d'une enfant), six salles : chambre (départ dans le lit), couloir, escalier, salon, cuisine, buanderie.
  - Les pieds des meubles bloquent le sol : on passe par-dessus (tabouret, chaises, poufs, marchepied).
  - Dangers : briques de jeu sur le tapis. Veilleuses (checkpoints) : chambre, palier de l'escalier, cuisine.
  - Quatre jouets mécaniques (patrouilleurs) : couloir, salon, cuisine, buanderie.
  - **Signposting D-26** : armoire, bibliothèque et placards hauts trop hauts ; la trappe à linge du couloir est sur un rebord inaccessible.
  - La trappe est un raccourci vers la buanderie. Il fermera la boucle couloir → escalier → salon → cuisine → buanderie → couloir une fois l'escalade acquise.
- **Vérification automatique** (analyse D-16, vraie physique) :
  - toutes les salles sont atteignables depuis le lit par des passages **faciles** (fenêtre ≥ 200 ms) ;
  - **tout** endroit atteignable, même par un saut raté, ramène à la chambre par des passages faciles (aucune fosse d'une tuile) ;
  - la trappe à linge est **inaccessible sans grimper**.
- **Changement de salle** :
  - fondu au noir de 150 ms (jeu suspendu) ;
  - arrivée juste à l'intérieur de la sortie liée, **élan horizontal conservé** ;
  - retour à l'image en 200 ms, jeu en marche.

  Durées dans `src/config/world.ts`, réglables dans l'overlay.

- **Point de retour de zone** :
  - un évanouissement ramène au dernier checkpoint, **même dans une autre salle** ;
  - changer de salle ne le déplace pas ;
  - la jauge de peur suit Céleste d'une salle à l'autre ;
  - salles visitées enregistrées dans `progression.mapRevealed` (pour la carte, Phase 8).
- **Parcours d'essai hors partie** : jouables depuis le menu pause, ils **ne modifient plus la sauvegarde**. « La maison (partie) » ramène au point de retour. Une ancienne sauvegarde pointant vers un parcours reprend dans la chambre.
- **Rendu** : bois, tissu et murs distincts ; sorties marquées d'une ouverture à peine éclairée ; ambiance par salle.
- **Overlay** : téléportation dans les salles de la maison ; durées de transition.
- Tests : 260.
  - Format : matériaux, sorties.
  - Zone : validation, arrivée, détection.
  - Maison : atteignabilité, pas d'endroit sans retour, trappe fermée.
  - Transition, `revealRoom`, registre des salles.
- **Vérifié dans Chromium** : nouvelle partie dans le lit → course vers la droite → couloir (élan conservé, carte révélée) → retour à la chambre ; checkpoint de la cuisine → évanouissement au salon → retour à la cuisine ; parcours d'essai sans effet sur la sauvegarde → « La maison » → rechargement → Continuer (« Cuisine ») dans la cuisine.
- **Mesure** (build de debug minifié, même parcours que `main`) : allocations identiques à `main` après correction du fond de caméra (+~350 octets/pas avant). Détection des sorties et transition : aucune allocation attribuée (build de dev).

### À vérifier sur téléphone (Phase 6)

Sur https://kalypst.github.io/Maria/ ou /debug/ (après merge) :

- [ ] **Thème** : écran de départ, menu pause, dialogues et commandes tactiles lisibles et doux (cahier, crayon) ; rien ne rappelle le néon.
- [ ] **Maison** : les meubles sont-ils lisibles comme des meubles géants vus par une enfant ? Le départ dans le lit est-il clair ?
- [ ] **Passages** : sauts sur chaises, tabourets, poufs, marchepied agréables, ni trop faciles ni pénibles ; escalier (marches d'une tuile, sautées une à une) pas fastidieux.
- [ ] **Changement de salle** : fondu assez court, pas désorientant ; l'élan conservé est agréable ; pas de retour involontaire par la sortie.
- [ ] **Évanouissement** dans une autre salle que la veilleuse : retour compréhensible.
- [ ] **Signposting** : les endroits trop hauts (armoire, bibliothèque, placards, trappe à linge) donnent-ils envie de revenir ?
- [ ] Ambiance (couleur de chaque salle) : perceptible sans être criarde.

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
- Le choix « Parcours d'essai » du menu pause reste un outil de prototype, hors partie (D-25) : à retirer ou déplacer (overlay seulement) quand le level design sera validé.
- La téléportation de l'overlay révèle la salle sur la carte (outil de debug, sauvegarde de test).

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

1. Essai de la glissade (parcours 11) et du départ du train sur téléphone, réglages exportés du DEBUG.
2. Le train, PR 3 à 6 (D-83).
3. Avant d'offrir le jeu : identifiants fixes des trouvailles et lanternes (D-71), installation facile (PWA), sauvegarde sûre sur iPhone, option « réduire les effets ».
