# Les coquilles (les trouvailles) : audit et questions

Demande de l'utilisateur (après le niveau 8) : revoir toutes les trouvailles, niveau par niveau ; certaines au premier passage, d'autres en revenant avec une capacité (sauf les derniers niveaux) ; revoir le système technique si besoin ; les représenter par des **coquilles d'escargot** (image fournie). Ce document est l'état des lieux ; les choix viendront avec les réponses de l'utilisateur.

## Comment l'audit a été fait

Pour chaque trouvaille, l'analyse de faisabilité (D-16, la vraie simulation de Céleste) a été rejouée salle par salle, à chaque étape des capacités (rien, escalade, saut mural, parapluie, crochet, glissade, bascule) et à la phase de croissance correspondante, aux deux marées pour les salles de la mer. Le résultat est la difficulté du passage le plus dur pour l'atteindre depuis une entrée de la salle : **F** facile (fenêtre ≥ 200 ms), **M** moyen (≥ 100), **D** difficile (≥ 50). Les trouvailles dans un passage bas (glissade) ou enfermées dans une couche (bascule) sont reprises des tests existants.

Types : **1P** premier passage ; **R** revisite (la capacité qui l'ouvre) ; **U** lieu sans retour (perdue si on la rate).

## Niveau par niveau (57 trouvailles)

### 1. La maison (7)

| Où                                     | Type                   | Difficulté   | Avis                                       |
| -------------------------------------- | ---------------------- | ------------ | ------------------------------------------ |
| Grenier, recoin sous le faîte          | 1P escalade            | M (150)      | bien : le premier secret                   |
| Salon, chapeau de l'horloge comtoise   | 1P escalade            | F            | bien : vue dès le début                    |
| Cuisine, dessus des placards hauts     | 1P escalade            | F            | un peu facile                              |
| Couloir, fronton du miroir             | R croissance (phase 2) | M (143)      | très bien : la croissance ouvre un passage |
| Buanderie, dessus de l'armoire à linge | R saut mural           | F            | bien : vue en partant au jardin            |
| Salon, sous le canapé                  | R glissade             | F (glissade) | bien                                       |
| Passage d'ombres (monde étrange)       | **U**                  | D (67)       | perdue pour toujours si ratée              |

### 2. Le jardin (5)

| Où                                          | Type          | Difficulté   | Avis                                                    |
| ------------------------------------------- | ------------- | ------------ | ------------------------------------------------------- |
| Cabane, dessus du coffre suspendu           | 1P saut mural | F            | bien : récompense la capacité tout de suite             |
| Potager, haut des tuteurs                   | 1P            | M (125)      | bien (la note de la salle dit « difficile » : obsolète) |
| Potager, nichoir du fond                    | R parapluie   | M (133)      | bien                                                    |
| Terrasse, jardinière au bout du fil à linge | R crochet     | F            | bien                                                    |
| Terrasse, sous la table de jardin           | R glissade    | F (glissade) | bien                                                    |

Le grand arbre et l'allée n'en ont aucune, alors que le jardin est le lieu des escargots.

### 3. Le quartier (8)

| Où                                   | Type         | Difficulté                        | Avis                                                              |
| ------------------------------------ | ------------ | --------------------------------- | ----------------------------------------------------------------- |
| Rue, toit de l'école                 | 1P           | M (108)                           | bien                                                              |
| Rue, haut de l'échafaudage           | 1P           | M                                 | bien (facile depuis la sortie haute du chantier)                  |
| Rue, antenne de la supérette         | 1P parapluie | M (125)                           | bien                                                              |
| Rue, nid du platane (fil tendu)      | R crochet    | M (125)                           | bien                                                              |
| Rue, cachette sous la palissade      | R glissade   | F (glissade)                      | bien                                                              |
| Aire de jeux, nichoir en haut du mât | 1P           | D (67) sans parapluie, **F avec** | le « difficile » disparaît dès qu'on a le parapluie (même niveau) |
| Cour de l'école, panier de basket    | 1P parapluie | M (133)                           | bien                                                              |
| Chantier, lampe de chantier          | 1P parapluie | D (92)                            | bien                                                              |

Cinq sur huit sont dans la seule rue ; rien dans la supérette ni l'école.

### 4. La gare (6, plus le disque des objets trouvés)

| Où                                | Type       | Difficulté           | Avis |
| --------------------------------- | ---------- | -------------------- | ---- |
| Voies, portique de signalisation  | 1P         | M (133)              | bien |
| Voies, toit du poste d'aiguillage | 1P crochet | M (133)              | bien |
| Hall, rebord sous la verrière     | 1P crochet | F                    | bien |
| Hall, sous le kiosque             | R glissade | F (glissade)         | bien |
| Quais, cheminée du pilier         | 1P         | D (67), M en phase 3 | bien |
| Dépôt, crochets du pont roulant   | 1P         | M (125)              | bien |

Une seule revisite.

### 5. Le train (5)

Une par voiture, toutes au premier passage : filet des couchettes (M 150, glissade), compartiments, fourgon, toit, wagon-restaurant (F). Trop faciles une fois sur place (déjà noté en D-86), rythme prévisible, aucune revisite.

### 6. La station balnéaire (9)

Toutes au premier passage (toutes les capacités sont là). Cinq jouent avec la marée (la balise à marée haute ; la grotte de la plage, la buse du port, le dessous de la jetée, la grotte des rochers à marée basse) : bonne idée. Cinq faciles, trois moyennes (phare 183, promenade 167, centre 125), une difficile à **50 ms** (la grotte des rochers : la limite basse du « difficile », trois images ; très dur au tactile). Aucune revisite.

### 7. La maison de la nounou (17)

Toutes **U** (on n'y revient jamais). Le même motif quatre fois : par îlot, une trouvaille « ouverte dans le souvenir » (F) et un défi « deux rideaux à une tuile d'écart » (D, 67 ms, identique dans les quatre îlots) ; plus l'entrée (les patères, F), la maison (le mobile, M 175 ; sous le canapé du souvenir, F en glissant). 30 % de toutes les trouvailles dans un lieu sans retour, et répétitif.

### 8. Le monde de Maria (0)

Aucune, par décision (D-138).

## Bilan

- **57 trouvailles** : 30 au premier passage, 9 revisites (croissance 1, saut mural 1, parapluie 1, crochet 2, glissade 4), **18 perdues pour toujours si on les rate** (le passage d'ombres et toute la maison de la nounou).
- Les revisites sont toutes aux niveaux 1 à 4 ; la glissade en porte quatre, toutes du même type (glisser sous un meuble).
- Peu de variété : environ 80 % « monter sur un perchoir ». Presque rien d'« observation » ou de « passage caché » (§27).
- **Rien ne récompense la collecte** : un jingle, un rire, une étoile rose sur la carte. Aucun compteur, aucune collection. C'est la raison principale pour laquelle elles ne donnent pas envie.
- La croissance et la glissade rendent faciles beaucoup de trouvailles moyennes (saut long depuis la glissade) : normal pour des revisites, mais un « difficile » du premier passage ne l'est plus au retour.

## Le système technique aujourd'hui

- `S` dans l'ASCII ; identifiant par position (`salle:s<col>-<row>`) : **déplacer une trouvaille la fait redevenir à trouver** dans une partie en cours (étape 4 de D-71 écartée, « à reprendre avant de diffuser le jeu »).
- Dessin : une lueur étoilée rose de 10 px qui flotte de haut en bas (contraire à la règle « rien ne flotte »).
- Ramassage : jingle `found` et rire, sauvegardé aussitôt dans `progression.collectibles`.
- Carte : une étoile rose par trouvaille ramassée ; les autres ne sont jamais montrées. Aucun compteur.
- Tests : une quinzaine de tests dispersés par salle (« moyenne exactement », « seulement avec le crochet »…).

## L'image fournie

Détourage essayé avec `scripts/art-cutout.py` : propre du premier coup. La spirale se lit encore à 30 px (une coquille de 10 à 12 px logiques sur téléphone). Ton chaud qui ressort bien sur les murs bleus de la nuit. Limites : peu de contraste sur le sable, le bois clair et le papier ; un style plus détaillé que le décor dessiné par le code (acceptable à cette taille, cohérent avec les personnages illustrés). Trois rendus essayés : brute, halo rose discret, liseré sombre.

## Les choix de l'utilisateur

Les recommandations, sauf trois points : aucune coquille dans un lieu sans retour (pour pouvoir tout récupérer après la fin), pas de voyage rapide pour l'instant, des noms fixes sans migration (aucune vraie partie n'existe). Le détail et le plan en 6 PR : **D-148**.

## Après la PR 4

Les intentions sont dans les salles (`; @shell:`) et vérifiées par les tests. Page « Ma maison » : 15 coquilles (maison 8, jardin 7), 6 revisites ; les lieux sans retour n'en ont plus. Le quartier, la gare, le train et la mer : PR 5 et 6.
