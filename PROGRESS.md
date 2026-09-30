# Avancement

## Phase en cours

**Le jardin (2a) et derrière la haie (2b)** (§7.2, §6, D-46 à D-49) : fusionnés (PR #29), **essai sur téléphone en cours** (début du jardin testé ; jardin adouci (D-51) sur `ccr-53d22df4-9euiqo`). Le saut mural (D-44, D-45) est fusionné ; ses valeurs n'ont pas encore été réglées au téléphone.

**Mouvement et difficulté validés** par l'utilisateur pour l'instant (réglages du DEBUG conservés pour une passe plus poussée plus tard).

**Musique** (D-57) : lecteur en place, en attente des morceaux.

**Le quartier** (D-60) : le portillon et la rue en place ; les quatre lieux (aire de jeux, école, supérette, chantier) attendent l'histoire.

Prochaine : le premier lieu du quartier (quand l'histoire est prête) ; intégrer les morceaux de musique.

## Fait

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

1. PR du jardin (2a + 2b), merge, essai sur téléphone ; réglage des valeurs du saut mural.
2. Zone suivante (le quartier, §26), avec les liaisons entre zones.
3. Avant d'offrir le jeu : installation facile (PWA), sauvegarde sûre sur iPhone, option « réduire les effets ».
