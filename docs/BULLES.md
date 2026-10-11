# Les bulles : inventaire et propositions (D-165)

Revue de toutes les bulles du jeu, demandée par l'utilisateur une fois l'histoire terminée. **Validé par l'utilisateur** tel quel. Appliqué : le rendu (PR 1), la maison, le jardin et le quartier (PR 2) ; à venir : la gare, le train et la mer (PR 3), la nounou, le monde de Maria, les passants et les portes restantes (PR 4).

## Les règles choisies par l'utilisateur

1. **Pensée ou parole** : Céleste **pense** (un nuage et sa traîne de petites bulles) ; les autres personnages lui **parlent** (une bulle ronde et sa pointe vers leur bouche). Toujours sans texte. Les passants et les portes fermées gardées par un personnage (papa, la maîtresse) parlent aussi.
2. **Maria** :
   - **a)** la boucle « où est Maria ? » de la maison est cassée : la photo de Maria disparue et le cœur du parent seulement la première fois (papa, le premier matin) ; ensuite Céleste demande avec un simple « ? », et le parent répond directement par son indice ;
   - **b)** Maria seulement aux **moments-pivots** : la disparition, la fin de chaque monde étrange, le monde de Maria. Les bulles « Maria » du **début de chaque niveau** (D-70) sont retirées.
3. **La photo de Maria est gardée** dans les bulles.
4. **Nouveaux pictogrammes** :

   | Nom      | Dessin                                                  | Sens                                                  |
   | -------- | ------------------------------------------------------- | ----------------------------------------------------- |
   | `smile`  | un visage qui sourit, les yeux plissés, les joues roses | gentillesse (la maîtresse, la camarade, des passants) |
   | `wave`   | une main qui fait coucou                                | un salut (des passants)                               |
   | `hush`   | un visage, un doigt sur la bouche                       | « chut » (le contrôleur, la nuit)                     |
   | `wonder` | une grande étincelle dorée et deux petites              | l'émerveillement, une découverte                      |
   | `miss`   | un petit nuage gris et sa pluie                         | le manque, la tristesse douce                         |
   | `locked` | une porte et son cadenas                                | une porte fermée (à la place du « ? »)                |

   Le **lit** perd sa lune (qui trouait la bulle) : des « z » à la place.

5. **Les affaires de Maria ramassées** (chausson, biberon, bandeau, bonnet) : **pas de bulle** (l'étincelle, le son et la page du cahier suffisent), confirmé par l'utilisateur (B-008 à B-011).
6. **Le style : « papier découpé »** (sans trait, une ombre portée nette, un papier grainé), choisi par l'utilisateur sur la maquette.

## Les chiffres

|                                      | Aujourd'hui | Proposé                                                                            |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| Bulles des scripts d'histoire        | 150         | 131                                                                                |
| Maria (photo)                        | 16          | 8                                                                                  |
| Maria disparue (photo pâle et « ? ») | 10          | 2                                                                                  |
| Cœurs (scripts, passants)            | 58          | 25                                                                                 |
| « ? » des portes fermées             | 10 portes   | 1 (la maîtresse, à la gare de la mer ; les autres : la porte fermée, ou les cubes) |

Pas de changement de nombre pour les aides des capacités, le tourne-disque sans disque, le cœur de la fin des souvenirs jouables.

---

## La maison, le jardin, le quartier (`src/levels/house/story.ts`)

Légende : **C** = Céleste (nuage) ; un autre nom = il parle (bulle de parole). « — » = la bulle est retirée.

| N°    | Moment                                                                        | Qui   | Aujourd'hui                         | Proposé       | Pourquoi                                                                                   |
| ----- | ----------------------------------------------------------------------------- | ----- | ----------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| B-001 | Le premier soir, jouer avec Maria                                             | C     | cœur, livre, couverture             | inchangé      | la tendresse, puis ce qu'il faut faire                                                     |
| B-002 | La couverture trouvée                                                         | C     | berceau                             | inchangé      | où coucher Maria                                                                           |
| B-003 | Maria couchée                                                                 | C     | cœur, lit                           | cœur, lit (z) |                                                                                            |
| B-004 | Au lit, avant maman                                                           | C     | cœur                                | —             | trois cœurs de suite ; on garde ceux de maman et la réponse                                |
| B-005 | Maman dit bonne nuit                                                          | maman | cœur                                | inchangé      |                                                                                            |
| B-006 | … Céleste répond                                                              | C     | cœur                                | inchangé      |                                                                                            |
| B-007 | Le berceau vide, au matin                                                     | C     | Maria disparue                      | inchangé      | **pivot** : la disparition                                                                 |
| B-008 | Le chausson ramassé                                                           | C     | cœur                                | —             | le cœur sonnait faux (Maria a disparu) ; voir règle 5                                      |
| B-009 | Le biberon ramassé                                                            | C     | cœur                                | —             | idem                                                                                       |
| B-010 | Le bandeau ramassé                                                            | C     | cœur                                | —             | idem                                                                                       |
| B-011 | Le bonnet ramassé                                                             | C     | cœur                                | —             | idem                                                                                       |
| B-012 | Papa à la cuisine                                                             | C     | Maria disparue                      | inchangé      | la première question : on comprend ce qu'elle demande                                      |
| B-013 | … papa                                                                        | papa  | ?                                   | inchangé      | il ne sait pas                                                                             |
| B-014 | … papa                                                                        | papa  | cœur                                | inchangé      | il console : le seul cœur « consolation » gardé                                            |
| B-015 | Maman sur le canapé                                                           | C     | Maria disparue                      | ?             | règle 2a                                                                                   |
| B-016 | … maman                                                                       | maman | ?                                   | inchangé      | (Maria juste au-dessus d'elle)                                                             |
| B-017 | … maman                                                                       | maman | cœur                                | —             | règle 2a                                                                                   |
| B-018 | Le chat caressé                                                               | C     | cœur                                | inchangé      |                                                                                            |
| B-019 | Maria aperçue en haut de la bibliothèque                                      | C     | Maria                               | inchangé      | une information, et un pivot                                                               |
| B-020 | En haut : le salon a basculé                                                  | C     | Maria disparue                      | ?             | Maria vient d'être vue ; ce qui frappe, c'est le monde changé                              |
| B-021 | Fin du monde étrange, sur le lit, le bandeau                                  | C     | Maria                               | inchangé      | **pivot** : fin d'un monde étrange                                                         |
| B-022 | … papa à la porte                                                             | papa  | ?                                   | inchangé      |                                                                                            |
| B-023 | … papa montre maman                                                           | papa  | maman                               | inchangé      |                                                                                            |
| B-024 | Le câlin de maman                                                             | C     | Maria disparue                      | manque        | le chagrin, sans remontrer Maria                                                           |
| B-025 | … maman                                                                       | maman | cœur                                | inchangé      |                                                                                            |
| B-026 | … Céleste répond                                                              | C     | cœur                                | inchangé      |                                                                                            |
| B-027 | … le soir                                                                     | C     | lit                                 | lit (z)       |                                                                                            |
| B-028 | Quelques mois plus tard, au réveil                                            | C     | Maria disparue                      | manque        | le temps a passé, le manque reste ; même choix aux trois « mois plus tard » (B-072, B-133) |
| B-029 | … il fait beau                                                                | C     | soleil                              | inchangé      |                                                                                            |
| B-030 | La toise                                                                      | C     | toise                               | inchangé      |                                                                                            |
| B-031 | L'arrivée au jardin                                                           | C     | soleil                              | inchangé      |                                                                                            |
| B-032 | Maman étend le linge                                                          | C     | Maria disparue                      | ?             | règle 2a                                                                                   |
| B-033 | … maman                                                                       | maman | loupe                               | inchangé      | « cherche bien »                                                                           |
| B-034 | … maman                                                                       | maman | cœur                                | —             | règle 2a : l'échange finit sur l'indice                                                    |
| B-035 | Papa au potager                                                               | C     | ?                                   | inchangé      |                                                                                            |
| B-036 | … papa montre la cabane                                                       | papa  | cabane                              | inchangé      |                                                                                            |
| B-037 | … papa                                                                        | papa  | cœur                                | —             | un tic d'écriture ; l'indice suffit                                                        |
| B-038 | Papa montre la ficelle                                                        | papa  | ficelle                             | inchangé      |                                                                                            |
| B-039 | … puis le portillon                                                           | papa  | portillon                           | inchangé      |                                                                                            |
| B-040 | … papa                                                                        | papa  | cœur                                | —             | idem B-037                                                                                 |
| B-041 | La chevillette tirée                                                          | C     | portillon                           | inchangé      |                                                                                            |
| B-042 | Papa montre la haie                                                           | papa  | haie                                | inchangé      |                                                                                            |
| B-043 | … papa                                                                        | papa  | cœur                                | —             | idem B-037                                                                                 |
| B-044 | Le creux de la haie, trop serré                                               | C     | ?                                   | inchangé      |                                                                                            |
| B-045 | Le disque de la cabane                                                        | C     | notes                               | inchangé      |                                                                                            |
| B-046 | Entrer derrière la haie                                                       | C     | ?                                   | inchangé      | la signature des mondes étranges                                                           |
| B-047 | Fin de la ronce, le bonnet                                                    | C     | Maria                               | inchangé      | **pivot**                                                                                  |
| B-048 | Maman montre la grue                                                          | maman | grue                                | inchangé      |                                                                                            |
| B-049 | … maman                                                                       | maman | cœur                                | —             | idem B-037                                                                                 |
| B-050 | Entrer dans l'école étrange                                                   | C     | ?                                   | inchangé      |                                                                                            |
| B-051 | Le téléphone de l'Educaville                                                  | C     | ?                                   | inchangé      | **pivot** (le silence de Maria, D-61)                                                      |
| B-052 | Maman vient la chercher dans la cour                                          | maman | cœur                                | inchangé      | une vraie tendresse                                                                        |
| B-053 | … Céleste répond                                                              | C     | cœur                                | inchangé      |                                                                                            |
| B-054 | La nuit, la grue par la fenêtre                                               | C     | grue                                | inchangé      |                                                                                            |
| B-055 | …                                                                             | C     | lit                                 | lit (z)       |                                                                                            |
| B-056 | Le lendemain, au réveil                                                       | C     | grue                                | inchangé      |                                                                                            |
| B-057 | Maman à l'aire de jeux                                                        | C     | Maria disparue                      | ?             | règle 2a                                                                                   |
| B-058 | … maman montre papa                                                           | maman | papa                                | inchangé      |                                                                                            |
| B-059 | … maman                                                                       | maman | cœur                                | —             | idem B-037                                                                                 |
| B-060 | Papa à la supérette                                                           | C     | ?                                   | inchangé      |                                                                                            |
| B-061 | … papa montre la grue                                                         | papa  | grue                                | inchangé      |                                                                                            |
| B-062 | … papa                                                                        | papa  | cœur                                | —             | idem B-037                                                                                 |
| B-063 | Les objets à regarder (photo, dessin, boîte à musique, plante, photo de bébé) | C     | famille, dessin, notes, fleur, bébé | inchangé      | rejouables                                                                                 |

**Portes fermées de la maison** (`lockedRooms`)

| N°   | Porte                                    | Qui  | Aujourd'hui | Proposé           | Pourquoi |
| ---- | ---------------------------------------- | ---- | ----------- | ----------------- | -------- |
| P-01 | La chambre, le premier soir              | papa | lit         | inchangé (parole) |          |
| P-02 | La porte de derrière, poignée trop haute | C    | poignée     | inchangé          |          |
| P-03 | Le portillon fermé                       | C    | portillon   | inchangé          |          |
| P-04 | La palissade du chantier                 | C    | ?           | porte fermée      |          |
| P-05 | La porte de l'école, côté rue            | C    | ?           | porte fermée      |          |
| P-06 | La porte de l'école, côté école          | C    | ?           | porte fermée      |          |
| P-07 | La chambre, après l'école étrange        | C    | lit         | lit (z)           |          |

## La gare (`src/levels/station/story.ts`)

| N°    | Moment                            | Qui  | Aujourd'hui    | Proposé  | Pourquoi                   |
| ----- | --------------------------------- | ---- | -------------- | -------- | -------------------------- |
| B-064 | Le disque des objets trouvés      | C    | notes          | inchangé |                            |
| B-065 | L'arrivée sur les voies           | C    | Maria          | —        | règle 2b (début de niveau) |
| B-066 | Entrer dans le hall à l'envers    | C    | ?              | inchangé |                            |
| B-067 | Roger                             | C    | cœur           | inchangé | son doudou : la tendresse  |
| B-068 | Sous l'horloge, la nuit           | C    | Maria          | inchangé | **pivot**                  |
| B-069 | Papa vient la chercher            | papa | cœur           | inchangé |                            |
| B-070 | … Céleste répond                  | C    | cœur           | inchangé |                            |
| B-071 | La nuit dans sa chambre           | C    | lit            | lit (z)  |                            |
| B-072 | Quelques mois plus tard           | C    | Maria disparue | manque   | comme B-028                |
| B-073 | … le train                        | C    | train          | inchangé |                            |
| B-074 | Le train à quai                   | C    | ?              | inchangé |                            |
| P-08  | La chambre, la nuit après la gare | C    | lit            | lit (z)  |                            |

## Le train (`src/levels/train/story.ts`)

| N°    | Moment                                             | Qui        | Aujourd'hui | Proposé      | Pourquoi                                          |
| ----- | -------------------------------------------------- | ---------- | ----------- | ------------ | ------------------------------------------------- |
| B-075 | Le départ : maman sur le quai                      | maman      | cœur        | inchangé     | un au revoir                                      |
| B-076 | … Céleste répond                                   | C          | cœur        | inchangé     |                                                   |
| B-077 | … la maîtresse montre le train                     | maîtresse  | train       | inchangé     |                                                   |
| B-078 | Le train s'ébranle                                 | C          | Maria       | —            | règle 2b (début de niveau)                        |
| B-079 | La camarade l'invite                               | camarade   | cœur        | sourire      | une camarade, pas une déclaration                 |
| B-080 | … elle montre la glissade                          | camarade   | glisser     | inchangé     |                                                   |
| B-081 | … la maîtresse : le coucher                        | maîtresse  | lit         | lit (z)      |                                                   |
| B-082 | La lueur dans le couloir                           | C          | ?           | inchangé     |                                                   |
| B-083 | Le contrôleur                                      | contrôleur | cœur        | chut         | il la laisse passer la nuit, sans rien dire       |
| B-084 | La maman qui berce son bébé (et son poupon)        | C          | cœur        | manque       | elle pense à Maria sans la montrer : le doux-amer |
| B-085 | Le chien du fourgon                                | C          | cœur        | inchangé     | comme le chat                                     |
| B-086 | Entrer dans la cuisine immense                     | C          | ?           | inchangé     |                                                   |
| B-087 | La cuisine rose                                    | C          | cœur        | étincelle    | une reconnaissance, l'émerveillement              |
| B-088 | Fin du monde étrange, sur sa couchette             | C          | Maria       | inchangé     | **pivot**                                         |
| B-089 | …                                                  | C          | lit         | lit (z)      |                                                   |
| B-090 | Le matin : la maîtresse la réveille                | maîtresse  | soleil      | inchangé     |                                                   |
| B-091 | La mer à la fenêtre                                | C          | cœur        | étincelle    | l'émerveillement                                  |
| B-092 | Le train s'arrête                                  | C          | Maria       | —            | règle 2b                                          |
| P-09  | Le passage vers les compartiments, avant la nuit   | C          | lit         | lit (z)      |                                                   |
| P-10  | La grille vers le fourgon (wagon-restaurant fermé) | C          | ?           | porte fermée |                                                   |
| P-11  | La porte du wagon-restaurant                       | C          | ?           | porte fermée |                                                   |

## La station balnéaire (`src/levels/sea/story.ts`)

| N°    | Moment                                          | Qui          | Aujourd'hui | Proposé           | Pourquoi                   |
| ----- | ----------------------------------------------- | ------------ | ----------- | ----------------- | -------------------------- |
| B-093 | Le disque du dortoir                            | C            | notes       | inchangé          |                            |
| B-094 | L'arrivée : Céleste demande                     | C            | ?           | inchangé          |                            |
| B-095 | … la maîtresse                                  | maîtresse    | soleil      | inchangé          |                            |
| B-096 | Au dortoir, la camarade                         | camarade     | cœur        | sourire           |                            |
| B-097 | … Céleste                                       | C            | Maria       | —                 | règle 2b (début de niveau) |
| B-098 | Au réfectoire : Céleste demande                 | C            | ?           | inchangé          |                            |
| B-099 | … la maîtresse montre dehors                    | maîtresse    | soleil      | inchangé          |                            |
| B-100 | La pêche à pied : Céleste demande               | C            | ?           | inchangé          |                            |
| B-101 | … la maîtresse montre la marée                  | maîtresse    | marée       | inchangé          |                            |
| B-102 | Sur le banc, la marée a monté                   | C            | marée       | inchangé          |                            |
| B-103 | … la maîtresse                                  | maîtresse    | cœur        | sourire           |                            |
| B-104 | La maîtresse sur la promenade (rejouable)       | C, maîtresse | ?, soleil   | inchangé          |                            |
| B-105 | Le soir de la fête : Céleste demande            | C            | ?           | inchangé          |                            |
| B-106 | … la maîtresse montre le carrousel              | maîtresse    | carrousel   | inchangé          |                            |
| B-107 | … la camarade, sur la jetée                     | camarade     | cœur        | sourire           |                            |
| B-108 | … Céleste                                       | C            | carrousel   | inchangé          |                            |
| B-109 | Le carrousel bâché vu du phare                  | C            | ?           | inchangé          |                            |
| B-110 | Les bancs des marées (rejouables)               | C            | marée       | inchangé          |                            |
| B-111 | Entrer dans la fête engloutie                   | C            | ?           | inchangé          |                            |
| B-112 | Le livre musical                                | C            | cœur        | étincelle         | comme la cuisine rose      |
| B-113 | Fin du monde étrange, au dortoir                | C            | Maria       | inchangé          | **pivot**                  |
| B-114 | …                                               | C            | lit         | lit (z)           |                            |
| B-115 | La nuit, la mélodie                             | C            | notes       | inchangé          |                            |
| B-116 | La porte du dortoir, le couloir                 | C            | notes       | inchangé          |                            |
| P-12  | L'arche de la jetée, avant le soir              | C            | ?           | porte fermée      |                            |
| P-13  | La grille du port, avant la première marée      | C            | ?           | porte fermée      |                            |
| P-14  | La sortie de la gare de la mer, avant l'arrivée | maîtresse    | ?           | inchangé (parole) | « où vas-tu ? »            |

## La maison de la nounou (`src/levels/nanny/story.ts`)

| N°    | Moment                                               | Qui    | Aujourd'hui    | Proposé      | Pourquoi                                                                   |
| ----- | ---------------------------------------------------- | ------ | -------------- | ------------ | -------------------------------------------------------------------------- |
| B-117 | L'arrivée dans l'entrée                              | C      | Maria          | —            | règle 2b (début de niveau)                                                 |
| B-118 | Le miroir : Céleste                                  | C      | ?              | inchangé     |                                                                            |
| B-119 | … le reflet sourit                                   | reflet | cœur           | sourire      | « elle sourit » (D-110)                                                    |
| B-120 | … le reflet montre la bascule                        | reflet | bascule        | inchangé     |                                                                            |
| B-121 | Dans la maison immense                               | C      | ?              | inchangé     |                                                                            |
| B-122 | … les cubes à trouver                                | C      | cubes          | inchangé     |                                                                            |
| B-123 | Un cube au bout d'un îlot                            | C      | cœur           | étincelle    | elle le reconnaît                                                          |
| B-124 | … les cubes trouvés                                  | C      | cubes          | inchangé     |                                                                            |
| B-125 | Le torchon blanc                                     | C      | cœur           | inchangé     | le réconfort                                                               |
| B-126 | L'effacement monte                                   | C      | ?              | inchangé     |                                                                            |
| B-127 | Un cube rallumé, dans la salle de jeux               | C      | cœur           | étincelle    | comme B-123                                                                |
| B-128 | Eden                                                 | C      | cœur           | inchangé     | une relation : la tendresse                                                |
| B-129 | Après le souvenir d'Eden                             | C      | Maria          | —            | doublon : la même pensée revient dix secondes plus tard, au réveil (B-131) |
| B-130 | Le réveil au dortoir : elle serre ce qu'elle n'a pas | C      | cœur           | inchangé     |                                                                            |
| B-131 | …                                                    | C      | Maria          | inchangé     | **pivot** : la fin des mondes étranges                                     |
| B-132 | Le train du retour                                   | C      | train          | inchangé     |                                                                            |
| B-133 | Quelques mois plus tard                              | C      | Maria disparue | manque       | comme B-028                                                                |
| P-15  | La porte de la salle de jeux                         | C      | ?              | porte fermée |                                                                            |
| P-16  | La petite porte de la sieste                         | C      | ?              | cubes        | montre ceux qui manquent : plus utile qu'un « ? »                          |

## Le monde de Maria (`src/levels/finale/story.ts`)

Le dernier niveau est tout entier un moment-pivot : Maria y reste, avec deux allègements.

| N°    | Moment                              | Qui   | Aujourd'hui                      | Proposé           | Pourquoi                                             |
| ----- | ----------------------------------- | ----- | -------------------------------- | ----------------- | ---------------------------------------------------- |
| B-134 | Le tapis vide                       | C     | Maria                            | inchangé          | le premier soir sans elle                            |
| B-135 | …                                   | C     | berceau                          | inchangé          |                                                      |
| B-136 | Le berceau refait, pour personne    | C     | Maria                            | manque            | deux photos de Maria à la suite sinon                |
| B-137 | …                                   | C     | lit                              | lit (z)           |                                                      |
| B-138 | Maman dit bonne nuit                | maman | cœur                             | inchangé          |                                                      |
| B-139 | … Céleste répond                    | C     | cœur                             | inchangé          |                                                      |
| B-140 | Le berceau vide s'éclaire           | C     | berceau                          | inchangé          |                                                      |
| B-141 | Dans le berceau devenu immense      | C     | Maria                            | étincelle         | elle entre dans le monde de Maria : l'émerveillement |
| B-142 | La boîte à musique                  | C     | notes                            | inchangé          |                                                      |
| B-143 | Maria retrouvée                     | C     | cœur                             | inchangé          |                                                      |
| B-144 | Le matin                            | C     | cœur                             | inchangé          |                                                      |
| B-145 | Sur le tapis, comme le premier soir | C     | cœur, livre, Maria sur l'étagère | inchangé          |                                                      |
| B-146 | Le dernier câlin                    | C     | cœur                             | inchangé          |                                                      |
| P-17  | La chambre, le soir                 | papa  | lit                              | inchangé (parole) |                                                      |
| P-18  | Le matin, avant de jouer avec Maria | C     | Maria                            | inchangé          |                                                      |
| P-19  | Avant de la ranger                  | C     | Maria sur l'étagère              | inchangé          |                                                      |
| P-20  | Maria retrouvée, avant de dormir    | C     | lit                              | lit (z)           |                                                      |
| P-21  | La nuit                             | C     | berceau                          | inchangé          |                                                      |

## Hors des scripts

| N°    | Moment                                                          | Qui  | Aujourd'hui            | Proposé             |
| ----- | --------------------------------------------------------------- | ---- | ---------------------- | ------------------- |
| B-147 | Le monsieur de l'abribus                                        | lui  | cœur                   | sourire             |
| B-148 | La dame au chien                                                | elle | cœur                   | coucou              |
| B-149 | La voisine à sa fenêtre (elle fait coucou)                      | elle | cœur                   | coucou              |
| B-150 | La caissière                                                    | elle | cœur                   | sourire             |
| B-151 | La voyageuse à la valise (elle fait coucou)                     | elle | cœur                   | coucou              |
| B-152 | Le vieux couple                                                 | eux  | cœur                   | sourire             |
| B-153 | Le pêcheur (il hoche la tête)                                   | lui  | cœur                   | sourire             |
| B-154 | Le marchand de barbe à papa                                     | lui  | cœur                   | sourire             |
| B-155 | Les aides des capacités (parapluie, crochet, glissade, bascule) | C    | leurs pictogrammes     | inchangé (recadrés) |
| B-156 | Le tourne-disque sans disque                                    | C    | tourne-disque et « ? » | inchangé            |
| B-157 | La fin de chaque souvenir jouable                               | C    | cœur                   | inchangé            |

---

## Le rendu (indépendant du contenu)

Tout reste **dessiné par le code**, une seule fois au chargement (aucun coût pendant le jeu). Défauts constatés sur la planche actuelle, et leur correction (maquette : https://claude.ai/artifact/AgbA6JRNEMACrZzPv7Rfim, avec le code du prototype, `prototype-bulles.txt`) :

- **les pictogrammes débordent** du nuage (cabane, grue, carrousel, cubes, crochet, tourne-disque, photo de famille) : chaque pictogramme est dessiné à part, mesuré, puis **posé dans une zone sûre** du nuage ; il ne déborde plus jamais, quel que soit son dessin ;
- **la lune troue la bulle** (elle est dessinée en effaçant) : dessinée à part, elle ne touche plus le nuage ; et le lit perd sa lune (des « z ») ;
- **le contour** : un seul trait continu autour du nuage et de sa traîne (aujourd'hui, seules les petites bulles ont un trait) ; un nuage plus régulier (dix lobes au lieu de quatre) ;
- **la bulle de parole** des personnages, sa pointe vers la bouche ;
- **un style au choix** (maquette) : « net » (trait d'encre, ombre douce), « crayon » (double trait de crayon, papier grainé), « papier découpé » (sans trait, ombre portée nette, papier grainé).
