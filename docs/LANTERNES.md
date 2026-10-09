# Les lanternes : revue et propositions (D-152, PR 2)

Demande de l'utilisateur (branche « avant diffusion ») : refaire un tour de tous les niveaux pour s'assurer que les lanternes sont toutes bien placées, à des endroits cohérents. Pas d'obligation d'une lanterne par salle.

**Réponses de l'utilisateur** : oui pour la plage (proposition B, faite : `sea-beach-point`), non pour le grand arbre (proposition A). La règle : **des points de sauvegarde utiles, sans trop simplifier le jeu**. Une lanterne coupe un retour vraiment long ou sert plusieurs passages ; elle ne se pose pas avant chaque difficulté, et un passage garde le coût de son échec. Questions 3 (l'aspect dehors) et 4 (les débuts des mondes étranges) : en attente ; rien n'est changé.

## Ce qu'est une lanterne dans le jeu

- **Le point de retour** : après un évanouissement (danger, peur pleine, poursuivant), Céleste revient à la dernière lanterne allumée, **parfois dans une autre salle** (D-25). Une chute dans l'eau ou dans le vide ne compte pas : elle ramène au dernier appui.
- **Le point de reprise** : « Continuer » après avoir quitté reprend à la dernière lanterne.
- **Les mondes étranges** (D-34, D-49) : pas de lanterne à l'entrée, volontairement. Un évanouissement avant la première veilleuse turquoise ramène dans le monde réel, et l'entrée (le haut de la bibliothèque, le trou de la haie…) y ramène aussitôt, en version courte.
- **Le dessin** : partout la même petite veilleuse champignon (blanche dans le monde réel, turquoise dans le monde étrange), posée sur sa tuile.

## Comment la revue a été faite

1. **Un relevé de chaque salle** : dimensions, sorties, portes, dangers (orties, ronces, crayons…), ennemis, mécaniques (poursuite, marée, vagues, tunnels, effacement), lanternes.
2. **La vraie simulation de Céleste** (l'analyse de faisabilité, D-16), salle par salle, avec les capacités et la croissance du premier passage :
   - les **passages délicats obligés** : sur le chemin le plus sûr entre deux entrées de la salle, les sauts dont la fenêtre est sous 200 ms (moyens ou difficiles), et s'il y a un danger dessous ;
   - le **temps du retour** : le chemin le plus rapide d'une lanterne (ou d'une entrée) jusqu'à chacun de ces passages ;
   - l'**accès** : le temps pour atteindre chaque lanterne depuis chaque entrée.
3. **Les points de retour de l'histoire** : pour chaque arrivée de scène qui fixe un point de retour, la lanterne choisie (la plus proche, `returnLantern`).
4. **Une photo de chaque lanterne dans le jeu** (Chromium, nouvel outil DEBUG → « Lanternes » → « Aller »).

**Bilan général** : les 97 lanternes sont **toutes posées sur un appui** (sol, meuble, étagère, planche, feuillage), aucune ne flotte, aucune n'est dans un danger ou derrière un décor qui la cache, aucune n'est collée à une autre (jamais moins de 12 tuiles). Toutes s'atteignent depuis les entrées de leur salle (sauf celles du ciel de la chambre, que la mesure ne suit pas : les étoiles de la berceuse bougent ; les tests de la salle le vérifient). Les points de retour de l'histoire tombent tous sur une lanterne de la bonne salle, près de l'arrivée.

Légende des avis : **✓** bien placée ; **±** acceptable, à voir ; **→** proposition.

## 1. La maison (5 lanternes)

| Lanterne              | Où                                  | Avis                                                            |
| --------------------- | ----------------------------------- | --------------------------------------------------------------- |
| `bedroom-toybox`      | Chambre, au pied du coffre à jouets | ✓ le point de retour du soir ; à 1,6 s du lit                   |
| `staircase-coatstand` | Escalier, au pied du portemanteau   | ✓ en bas de la cage, à la porte du salon                        |
| `kitchen-counter`     | Cuisine, sur le plan de travail     | ✓ à 1,6 s de la buanderie ; 6,8 s depuis le salon (sans danger) |
| `attic-trunk`         | Grenier, près de la malle           | ✓ à l'arrivée par l'escalier                                    |
| `shadows-shelf`       | Passage d'ombres, sur une étagère   | ✓ la veilleuse turquoise du monde étrange (D-34)                |

**Sans lanterne** : le couloir, le salon, la buanderie (un jouet mécanique chacun, courts : un évanouissement ramène à la chambre, à l'escalier ou à la cuisine, tout près) ; le salon étrange (règle des mondes étranges). Rien à changer.

## 2. Le jardin (5)

| Lanterne                    | Où                                   | Avis                                                                        |
| --------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `garden-terrace-table`      | Terrasse, sous la table de jardin    | ✓ à la porte de la maison                                                   |
| `garden-vegetables-planter` | Potager, sur le bac du milieu        | ✓ juste avant le saut moyen (167 ms) au-dessus des orties : retour immédiat |
| `garden-tree-foot`          | Grand arbre, en bas, près de l'arche | ± voir la proposition A                                                     |
| `garden-thorns-bottom`      | La ronce, en bas                     | ✓ la première veilleuse turquoise                                           |
| `garden-thorns-bush`        | La ronce, sur le buisson du milieu   | ✓ coupe la montée difficile en deux (3 s d'écart)                           |

**Proposition A — le grand arbre** (refusée : la montée garde le coût de son échec) : la montée fait une trentaine de tuiles, avec deux araignées en haut et trois sauts moyens (117 ms, sans danger dessous). Trois contacts d'araignée et Céleste revient **en bas, à 11 s de montée**, alors que la cabane, la récompense (le saut mural), est juste au-dessus. **→ ajouter une lanterne en haut, sur la grosse branche qui mène à la cabane** (près de la sortie 2). Variante plus « diégétique » : dans la cabane elle-même, où une lanterne est déjà dessinée au mur (D-76) ; mais une lanterne dans la cabane ne sert qu'après la montée.

**Sans lanterne** : l'allée (deux araignées, des orties ; entre la terrasse et l'arbre, retours courts), la cabane (petite, sans danger), le jardin renversé (règle des mondes étranges : retour au jardin, le trou de la haie y ramène). Rien à changer.

## 3. Le quartier (12)

| Lanterne                | Où                                     | Avis                                                                           |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `street-gate`           | La rue, près du portillon              | ✓ à l'arrivée du jardin                                                        |
| `street-busstop`        | La rue, sous l'abribus                 | ✓ au milieu de la rue (200 tuiles), près des portes ; la rue n'a pas de danger |
| `playground-bench`      | Aire de jeux, près du banc de maman    | ✓                                                                              |
| `shop-entry`            | Supérette, à l'entrée                  | ✓                                                                              |
| `site-entry`            | Chantier, en bas à l'entrée            | ✓                                                                              |
| `site-scaffold`         | Chantier, sur l'échafaudage            | ✓ coupe le chantier (difficile, gravats) en deux                               |
| `schoolyard-bench`      | Cour de l'école, près du banc          | ✓ le point de retour de la fin de l'école                                      |
| `school-corridor`       | École, dans le couloir                 | ✓                                                                              |
| `school-strange-entry`  | École étrange, à l'ancien départ       | ✓                                                                              |
| `school-strange-tables` | École étrange, sur une table           | ✓                                                                              |
| `school-strange-ruler`  | École étrange, sur la règle            | ✓ au bout du long plané                                                        |
| `school-strange-sorter` | École étrange, en haut, avant la boîte | ✓ juste avant le dernier tronçon difficile                                     |

Rien à changer. La rue, longue, n'a aucun danger : ses deux lanternes ne servent qu'à la reprise, et c'est assez.

## 4. La gare (10)

| Lanterne                       | Où                                  | Avis                                                                              |
| ------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------- |
| `station-tracks-shelter`       | Les voies, sous l'abri du quai      | ✓                                                                                 |
| `station-platforms-footbridge` | Les quais, au pied de la passerelle | ✓                                                                                 |
| `station-hall-clock`           | Le hall, sous la grande horloge     | ✓ le point de retour de la fin de la gare                                         |
| `station-lost-counter`         | Objets trouvés, au comptoir         | ✓                                                                                 |
| `station-depot-entry`          | Le dépôt, à l'entrée                | ✓                                                                                 |
| `station-depot-wagon`          | Le dépôt, sur un wagon              | ✓ coupe les 70 colonnes de gravats en deux                                        |
| `station-strange-pile`         | Objets perdus, sur le tas           | ✓ la première veilleuse (le début, deux sauts moyens : règle des mondes étranges) |
| `station-tower-bottom`         | La tour, en bas                     | ✓ une par phase de la poursuite (tests de rythme, D-70)                           |
| `station-tower-middle`         | La tour, au milieu                  | ✓                                                                                 |
| `station-tower-high`           | La tour, en haut                    | ✓                                                                                 |

Rien à changer.

## 5. Le train (8)

| Lanterne                      | Où                                                | Avis                                                                                     |
| ----------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `train-couchettes-nightlight` | Voiture-couchettes, la veilleuse du compartiment  | ✓ très cohérente (une vraie veilleuse) ; point de retour du départ et de la cuisine rose |
| `train-compartments-table`    | Compartiments, sous la tablette                   | ✓                                                                                        |
| `train-baggage-crate`         | Fourgon, près des caisses                         | ✓ juste avant le saut mural (167 ms) ; à 4 s de l'échelle du toit                        |
| `train-restaurant-table`      | Wagon-restaurant, sous une table                  | ✓                                                                                        |
| `train-strange-kitchen-shelf` | Cuisine étrange, sur l'étagère haute              | ✓ la seule veilleuse, au milieu ; avant elle, la règle des mondes étranges               |
| `train-strange-dishes-1/2/3`  | Train de la vaisselle, au début de chaque tronçon | ✓ une par tronçon de la poursuite (tests de rythme)                                      |

**Sans lanterne** : le toit (les tunnels font monter la peur ; un évanouissement ramène au fourgon, à 4 s de l'échelle). Rien à changer.

## 6. La station balnéaire (15)

| Lanterne                                  | Où                                        | Avis                                                                                                             |
| ----------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `sea-station-quay`                        | Gare de la mer, sur le quai               | ✓                                                                                                                |
| `sea-promenade-balustrade`                | Promenade, contre la balustrade           | ✓ près du banc de la marée ; la promenade n'a pas de danger                                                      |
| `sea-centre-dorm`                         | Le centre, dans le dortoir                | ✓ le point de retour des nuits                                                                                   |
| `sea-beach-upper`                         | La plage, en haut, au pied de l'escalier  | → voir la proposition B                                                                                          |
| `sea-rocks-top`                           | Les rochers, sur le rocher du milieu      | ✓ en haut de la cheminée                                                                                         |
| `sea-lighthouse-keeper`                   | Le phare, chez le gardien                 | ✓                                                                                                                |
| `sea-port-office`                         | Le port, devant la capitainerie           | ± à droite ; en venant du phare, la dernière lanterne est celle du gardien (à 6 s de la passerelle) : acceptable |
| `sea-jetty-end`                           | La jetée, à l'entrée                      | ✓ le point de retour du soir                                                                                     |
| `sea-jetty-swings`                        | La jetée, près des chaises volantes       | ✓                                                                                                                |
| `sea-strange-fair-carousel`               | Fête engloutie, sur la barre du carrousel | ✓                                                                                                                |
| `sea-strange-fair-stall`                  | Fête engloutie, sur un stand              | ✓ juste avant le seul saut difficile (67 ms)                                                                     |
| `sea-strange-wave-deck-1/2`, `-stall-1/2` | La vague, au début de chaque tronçon      | ✓ une par tronçon de la poursuite (tests de rythme)                                                              |

**Proposition B — la plage** (acceptée, faite : `sea-beach-point`, sur l'avancée, colonne 6, au sec aux deux marées) : la plage fait 190 tuiles ; sa seule lanterne est tout à droite, au pied de l'escalier. La sortie vers les rochers est tout à gauche : **21 s de course**, avec deux crabes et la marée au milieu. Et comme les rochers n'ont leur lanterne qu'en haut de leur cheminée, **un évanouissement au début des rochers ramène au pied de l'escalier de la plage : environ 30 s pour revenir**. **→ ajouter une lanterne à gauche de la plage, sur le gros rocher ou les marches de rochers de l'avancée**, au sec aux deux marées (la lecture des salles le vérifie). Elle sert la plage et le début des rochers. Posée **après** la traversée : un crabe au milieu de la plage ramène toujours à l'escalier, la traversée garde sa difficulté.

**Sans lanterne** : les cinq couloirs en boucle (sans danger, D-105). Rien à changer.

## 7. La maison de la nounou (32)

| Salle                | Lanternes                                       | Avis                                                                         |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| L'entrée             | `nanny-entry-door`                              | ✓ le point de retour de l'arrivée                                            |
| La maison            | `nanny-house-hall`, `nanny-house-rug`           | ✓ l'arrivée, et le tapis devant les portes des îlots (toutes à moins de 1 s) |
| Chambre d'autrefois  | `nanny-bed-rug`, `nanny-bed-wardrobe`           | ✓ l'arrivée ; le haut de l'armoire avant le défi                             |
| Jardin renversé      | `nanny-garden-hedge`, `-cans`, `-planter`       | ✓ l'arrivée, l'arrosoir (avant les prises moyennes), Roger                   |
| École d'autrefois    | `nanny-school-books`, `-table`, `-desk`         | ✓ avant chaque vol                                                           |
| Rue d'autrefois      | `nanny-street-houses`, `-busstop`               | ✓ avant le premier vol, et l'arrivée de l'autre côté                         |
| Gare d'autrefois     | `nanny-station-entry`, `-shelf`, `-end`         | ✓                                                                            |
| Train d'autrefois    | `nanny-train-rack`, `-roof`                     | ✓                                                                            |
| Plage d'autrefois    | `nanny-beach-dune`, `-middle`, `-end`           | ✓ avant chaque passage moyen                                                 |
| Carrousel            | `nanny-carousel-entry`, `-top`                  | ✓                                                                            |
| Chambre de la sieste | `nanny-nap-entry`, `-left`, `-middle`, `-right` | ✓ une juste avant chacun des trois sauts difficiles (testé, D-116)           |
| Cage d'escalier      | `nanny-stairs-bottom`, `-banister`, `-top`      | ✓ en bas, au milieu, en haut (tests de rythme du boss)                       |
| Salle de jeux        | `nanny-playroom-entry`, `-blocks`               | ✓ le seuil et le gros cube, autour des vagues                                |

Le niveau le mieux couvert : rien à changer.

## 8. Le monde de Maria (10)

| Salle                 | Lanternes                                                      | Avis                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La chambre immense    | `finale-bed-nightlamp`, `-headboard`, `-cabin`                 | ✓ la veilleuse champignon du coffre (la vraie veilleuse de la chambre : très cohérente), la tête de lit, la cabane                                                              |
| Le ciel de la chambre | `finale-sky-wardrobe`, `-picture`, `-moon`, `-window`, `-desk` | ± aucun danger (une chute ramène au dernier appui) : elles ne servent qu'à la reprise. Le rebord (`window`) et le bureau (`desk`) sont proches (19 tuiles) ; on peut les garder |
| La chambre grande     | `finale-big-shelf`, `-rug`                                     | ✓                                                                                                                                                                               |

Rien à changer.

## Les questions pour l'utilisateur

1. **Proposition B (la plage)** : ajouter une lanterne à gauche de la plage, pour la plage et le début des rochers ? (recommandé)
2. **Proposition A (le grand arbre)** : ajouter une lanterne en haut de l'arbre, sur la branche de la cabane ? Ou dans la cabane ? Ou laisser la montée telle quelle ?
3. **L'aspect des lanternes dehors** : dans la maison, le train et le monde de Maria, une veilleuse champignon est cohérente ; mais sur le sable, les rochers, les quais, le trottoir ou le toit d'un wagon, c'est moins vrai (la spec, §20.3, veut des lanternes diégétiques : banc, couverture, fleur, cabane, objet familier). Voulez-vous une **variante par lieu**, dessinée par le code et toujours reconnaissable (même lueur, même taille) ? Par exemple : le jardin, une lampe-tempête ou un bocal à lucioles ; la rue et la gare, une petite lanterne posée ; la mer, une lanterne de marin ; les mondes étranges, la veilleuse turquoise comme aujourd'hui. C'est un choix de direction artistique (§45 : ouvert) ; ce serait une PR à part, sans toucher aux positions.
4. **Les débuts des mondes étranges** sans lanterne (règle D-34) : on garde ? (recommandé : oui, c'est leur tension, et le retour est court.)

Si les réponses sont « oui » à 1 et à 2, les PR 3 à 5 du plan se réduisent : **deux lanternes ajoutées** (le grand arbre, PR 3 ; la plage, PR 5), et la PR 4 (quartier, gare, train) n'a rien à changer. Les deux pourraient tenir dans une seule PR.
