# MARIA — Document de spécifications
## Jeu d'action-platformer 2D / Metroidvania compact pour navigateur mobile

**Version :** 0.1 — base de production  
**Statut :** cahier des charges de référence pour un agent de développement  
**Technologie cible :** Phaser 3 + TypeScript  
**Plateforme cible :** navigateur mobile, orientation paysage  
**Durée cible :** ~15 h, avec une fourchette indicative de 10–20 h selon exploration  
**Mode :** solo, hors ligne après chargement des ressources  
**Sauvegarde :** navigateur uniquement, avec mécanisme de protection contre la perte de données

---

# 1. Résumé exécutif

**MARIA** est un jeu d'action-platformer 2D à exploration de type Metroidvania compact.

Le joueur incarne **Céleste**, une petite fille qui perd son poupon préféré, Maria. Elle part à sa recherche dans sa maison, puis dans le jardin, le quartier et des lieux de plus en plus éloignés. Au fil de l'aventure, le monde réel se mélange à une couche étrange et ambiguë : des objets ordinaires peuvent devenir gigantesques, menaçants ou fantastiques à travers la perception de l'enfant, tandis que certains phénomènes semblent réellement dépasser l'imagination.

La fillette grandit réellement au cours de l'aventure. Sa croissance modifie légèrement ses possibilités physiques, tandis que ses apprentissages débloquent les principales capacités de déplacement.

Le cœur du jeu est la **maîtrise du platforming** :

- déplacement précis mais avec une inertie perceptible ;
- sauts à hauteur variable ;
- coyote time ;
- jump buffering ;
- contrôle aérien ;
- wall jump ;
- dash et autres capacités de mobilité ;
- parcours verticaux et horizontaux ;
- chemins alternatifs ;
- boucles et raccourcis ;
- revisite des zones avec de nouvelles possibilités.

Le combat est secondaire. La fillette utilise un bâton/objet-jouet dont les fonctionnalités évoluent avec son âge et son ingéniosité. Les ennemis doivent autant que possible être intégrés aux problèmes de déplacement plutôt que créer des arènes de combat séparées.

Le ton est **mystérieux, doux-amer, poétique et parfois légèrement inquiétant**, sans devenir un jeu d'horreur.

Maria ne parle jamais et ne doit jamais être montrée en train de se déplacer. Le joueur découvre son existence et son parcours par des traces, des apparitions indirectes et des indices.

La fin doit être émotionnelle et ouverte : Maria est retrouvée, mais la fillette comprend qu'elle ne peut pas retrouver exactement l'enfance qu'elle avait avant sa disparition.

---

# 2. Identité des personnages

## 2.1. Céleste

La protagoniste s'appelle **Céleste**.

Éléments visuels identitaires à conserver dans toutes les phases de croissance :

- Céleste porte des **lunettes rondes roses** ;
- ses cheveux sont portés en **couettes ou en queue de cheval**, selon la phase de croissance, la scène ou les contraintes d'animation ;
- son apparence doit rester immédiatement reconnaissable malgré l'évolution de son âge, de ses vêtements et de sa silhouette.

Les lunettes roses et la coiffure font partie de sa silhouette visuelle de référence et doivent être prises en compte dans les sprites, animations, cinématiques, illustrations et éléments d'interface représentant le personnage.

## 2.2. Maria

**Maria est le poupon métisse de Céleste.**

Maria est le jouet préféré de Céleste et celle-ci la considère comme son bébé.

Son apparence doit rester cohérente tout au long du jeu et constituer un repère visuel important.

Les règles narratives déjà définies restent inchangées :

- Maria ne parle jamais ;
- Maria n'est jamais montrée en train de se déplacer devant le joueur ;
- sa présence peut être suggérée par des traces, des apparitions indirectes, des placements impossibles ou des indices ;
- Maria doit rester visuellement identifiable même lorsqu'elle apparaît brièvement ou dans des situations ambiguës.

# 3. Piliers de conception

Le développement doit constamment respecter les piliers suivants.

## 3.1. Maîtrise du mouvement

Le joueur doit progressivement devenir meilleur en déplacement.

La satisfaction principale doit venir de :

- réussir un saut difficile ;
- trouver la bonne trajectoire ;
- enchaîner plusieurs mouvements ;
- comprendre l'espace ;
- utiliser une capacité de mobilité de manière créative ;
- revenir dans une ancienne zone et découvrir une nouvelle route.

Le jeu ne doit pas devenir principalement un jeu de combat.

## 3.2. Exploration et découverte

Le monde doit être interconnecté.

Une zone doit pouvoir contenir :

- plusieurs chemins ;
- des embranchements ;
- des passages verticaux ;
- des raccourcis ;
- des boucles ;
- des zones visibles mais initialement inaccessibles ;
- des secrets ;
- des connexions avec d'autres zones.

Le joueur doit régulièrement se dire :

> « Je sais maintenant comment atteindre cet endroit que j'avais vu auparavant. »

## 3.3. Croissance

La croissance de l'enfant doit être visible et avoir une influence réelle sur le gameplay.

La croissance ne doit toutefois pas remplacer les capacités de plateforme. Elle complète les capacités acquises.

## 3.4. Mystère

Le jeu doit laisser une part d'interprétation.

Il faut éviter :

- l'explication systématique du fantastique ;
- les longs dialogues explicatifs ;
- les monologues qui expliquent le thème ;
- un lore complexe qui exige de lire beaucoup de texte.

## 3.5. Émotion

La recherche de Maria doit progressivement dépasser la simple recherche d'un objet.

Le joueur doit pouvoir ressentir simultanément :

- l'envie de retrouver Maria ;
- la curiosité sur ce qui lui est arrivé ;
- la nostalgie d'une enfance en train de disparaître.

---

# 4. Fiche de référence rapide

| Élément | Décision |
|---|---|
| Genre | Action-platformer 2D / Metroidvania compact |
| Perspective | 2D |
| Mode | Solo |
| Plateforme | Navigateur mobile |
| Orientation | Paysage |
| Technologie | Phaser 3 + TypeScript |
| Durée cible | ~15 h |
| Difficulté | Exigeante, progressive |
| Motivation principale | Maîtrise du platforming |
| Motivation secondaire | Exploration / secrets |
| Combat | Secondaire |
| Héroïne | Céleste, petite fille qui grandit |
| Apparence de Céleste | Lunettes rondes roses ; couettes ou queue de cheval |
| Poupon | Maria, poupon métisse de Céleste |
| Objet central | Poupon Maria |
| Défense | Bâton / objet-jouet évolutif |
| Ton | Mystère doux-amer |
| Monde | Réel + couche étrange |
| Maria parle | Non |
| Maria se déplace à l'écran | Jamais montré |
| Parents | Très présents au début, progressivement moins présents |
| Sauvegarde | Navigateur uniquement, robuste |
| Carte | Dessinée par l'enfant |
| Secrets | Complétion explicite |
| Inventaire | Souvenirs + upgrades permanents + objets équipables |
| Mort | Chute / peur / évanouissement / retour au checkpoint |

---

# 5. Direction narrative

## 5.1. Situation initiale

L'héroïne est **Céleste**, une petite fille.

Elle porte des lunettes rondes roses et ses cheveux sont coiffés en couettes ou en queue de cheval.

Elle possède un poupon qu'elle considère comme son bébé et son jouet préféré.

Le poupon s'appelle **Maria**.

Au début du jeu, Maria fait partie de son quotidien.

La fillette :

- joue avec elle ;
- la nourrit ;
- la couche ;
- lui parle ;
- l'emmène avec elle ;
- la protège ;
- dort parfois avec elle.

Maria est à la fois :

- son jouet préféré ;
- son « bébé » ;
- une présence affective ;
- un compagnon imaginaire potentiel.

## 5.2. Disparition

Maria disparaît au début de l'aventure.

Le jeu peut utiliser l'une des deux mises en scène suivantes sans changer la structure globale :

- Maria est présente avant une période de jeu puis disparaît ;
- la fillette se réveille et constate que Maria n'est plus là.

Le choix précis pourra être arrêté au prototypage narratif.

Le joueur doit comprendre immédiatement :

> Maria manque.

Mais il ne doit pas comprendre immédiatement :

> pourquoi Maria a disparu.

## 5.3. Objectif initial

L'objectif de la fillette est concret :

> retrouver son bébé.

Cette motivation doit suffire à justifier les premières explorations.

## 5.4. Maria

Maria ne parle jamais.

Maria ne doit jamais être montrée en train de se déplacer.

Elle peut être :

- retrouvée posée dans un lieu ;
- aperçue au loin ;
- visible derrière un obstacle ;
- associée à une trace ;
- présente dans un souvenir ;
- présente dans un lieu impossible ;
- retrouvée dans un endroit où elle ne devrait pas être.

La règle « Maria ne bouge jamais sous les yeux du joueur » est une règle narrative forte et doit être conservée sauf décision explicite ultérieure.

## 5.5. Ambiguïté

Le jeu doit permettre deux interprétations simultanées :

### 5.5.1. Interprétation réaliste

La fillette transforme mentalement son environnement.

Une machine devient un monstre.

Un meuble devient une montagne.

Une araignée devient une créature terrifiante.

### 5.5.2. Interprétation fantastique

Certains événements semblent réellement impossibles.

Des traces de Maria apparaissent dans des endroits inexplicables.

Des lieux existent sous une forme impossible.

Certains événements du monde étrange ont des conséquences dans le monde réel.

Le jeu ne doit jamais fournir une explication totale.

---

# 6. Monde réel et monde étrange

## 6.1. Principe

Il n'existe pas nécessairement deux mondes totalement séparés.

Le monde étrange doit plutôt être une **couche** qui peut apparaître à l'intérieur du monde réel.

Exemples :

- sous le lit ;
- derrière une armoire ;
- sous un meuble ;
- dans un placard ;
- au fond d'un jardin ;
- derrière une haie ;
- dans une cave ;
- dans un passage apparemment trop petit ;
- dans des lieux abandonnés.

## 6.2. Règle de production

Le monde étrange ne doit pas obliger l'équipe à produire deux fois chaque environnement.

Réutiliser :

- géométrie ;
- objets ;
- silhouettes ;
- textures ;
- architectures ;
- animations ;
- éléments interactifs.

Le changement peut venir de :

- l'échelle ;
- l'éclairage ;
- la palette ;
- les particules ;
- les arrière-plans ;
- les proportions ;
- la présence d'ennemis ;
- des éléments impossibles ;
- des transformations locales.

## 6.3. Effets réels

Le monde étrange peut laisser des traces dans le monde réel.

Exemples :

- objet déplacé ;
- porte impossible retrouvée dans un mur ;
- marque ;
- objet retrouvé à un autre endroit ;
- élément visible dans une photographie ;
- dessin correspondant à un lieu réel ;
- bruit sans source identifiable.

Ces phénomènes doivent rester relativement rares pour conserver leur impact.

---

# 7. Progression narrative par phases de croissance

Les âges exacts ne sont pas verrouillés.

Le jeu utilise des **phases de croissance**.

## 7.1. Phase 1 — Petite enfance

La maison paraît gigantesque.

Le joueur apprend les bases.

Les parents sont très présents.

Maria est au centre de la vie quotidienne.

## 7.2. Phase 2 — Première autonomie

La fillette peut aller plus loin.

Le jardin et les environs deviennent accessibles.

Elle commence à explorer seule.

Ses capacités physiques évoluent légèrement.

## 7.3. Phase 3 — Exploration extérieure

Elle visite des lieux éloignés de la maison.

Les parents sont moins présents.

Le monde devient plus complexe.

Les dangers sont moins uniquement liés à la taille des objets.

## 7.4. Phase 4 — Monde étrange

La frontière entre perception et réalité devient moins claire.

La fillette comprend mieux comment traverser le monde.

Elle est plus autonome.

## 7.5. Phase 5 — Retour / résolution

Elle retrouve Maria.

Elle comprend progressivement que retrouver Maria ne signifie pas retrouver exactement son enfance.

---

# 8. Les parents

## 8.1. Début

Les parents sont présents dans la maison et participent à la vie de la fillette.

Ils peuvent :

- parler brièvement ;
- donner des indications contextuelles ;
- réagir à Maria ;
- occuper des pièces ;
- effectuer des activités domestiques ;
- servir de présence rassurante.

Ils ne doivent pas devenir des personnages qui expliquent toute l'intrigue.

## 8.2. Évolution

Au fil de la croissance :

- ils apparaissent moins ;
- ils laissent davantage d'autonomie ;
- ils peuvent être occupés ;
- ils restent cependant présents dans son existence.

Ils peuvent réapparaître à des moments narratifs importants.

Ils ne doivent pas être présentés comme des antagonistes.

---

# 9. Fin

La direction validée est :

> Maria est retrouvée, mais la fillette doit accepter qu'elle ne sera plus jamais exactement la même.

La résolution doit être principalement visuelle et émotionnelle.

Éviter un monologue expliquant explicitement :

> « Maria représentait mon enfance. »

Le joueur doit comprendre le thème par les actions, les objets et la mise en scène.

La fin peut laisser subsister une petite anomalie liée au monde étrange.

La dernière image peut notamment suggérer que le mystère n'est pas totalement résolu.

La forme précise de la scène finale reste à écrire.

---

# 10. Direction artistique

## 10.1. Principes

Le style doit combiner :

- monde quotidien reconnaissable ;
- proportions enfantines ;
- atmosphère de conte ;
- mystère ;
- douceur ;
- étrangeté ponctuelle.

## 10.2. Objets du quotidien

Les objets ordinaires doivent être identifiables.

Exemples :

- lit ;
- chaise ;
- canapé ;
- table ;
- aspirateur ;
- machine à laver ;
- jouets ;
- escalier ;
- plantes ;
- vêtements ;
- ustensiles.

Ils peuvent être transformés par la perception de l'enfant sans perdre complètement leur identité.

## 10.3. Échelle

L'échelle est un outil narratif majeur.

Un même objet peut :

- être gigantesque au début ;
- paraître plus normal plus tard ;
- être réinterprété lors d'une revisite.

---

# 11. Gameplay général

Boucle principale :

```text
Explorer
  ↓
Observer
  ↓
Trouver un chemin
  ↓
Maîtriser un mouvement
  ↓
Surmonter un obstacle
  ↓
Découvrir un secret / objet / raccourci
  ↓
Obtenir une capacité ou un indice
  ↓
Revenir dans une ancienne zone
  ↓
Accéder à une nouvelle route
```

Le jeu doit favoriser cette boucle plutôt qu'une boucle :

```text
Explorer → Combat → Récompense → Combat
```

---

# 12. Contrôles mobiles

## 12.1. Orientation

Paysage uniquement pour la version principale.

Le jeu doit gérer correctement :

- différentes tailles d'écran ;
- différents ratios ;
- encoche ;
- zones sûres ;
- densités de pixels ;
- changement de taille de viewport.

## 12.2. Contrôles

Disposition configurable.

Côté gauche :

- joystick virtuel.

Côté droit :

- bouton saut ;
- bouton attaque/action ;
- bouton capacité, lorsque nécessaire.

Le joueur doit pouvoir éventuellement déplacer/redimensionner les commandes dans les paramètres si cela améliore l'accessibilité.

## 12.3. Multi-touch

Le système doit supporter simultanément plusieurs entrées :

- déplacement + saut ;
- déplacement + attaque ;
- déplacement + capacité ;
- saut + attaque.

Le tactile ne doit pas empêcher les combinaisons de commandes nécessaires au platforming.

## 12.4. Manette / clavier

Même si la cible principale est mobile, prévoir une couche d'input abstraite permettant ultérieurement :

- clavier ;
- manette.

Ne pas coupler la logique du personnage directement au tactile.

---

# 13. Philosophie de physique

Le mouvement doit avoir une inertie perceptible mais rester immédiatement contrôlable.

Principe obligatoire :

> **Précision avant réalisme physique.**

Le personnage doit :

- répondre rapidement à l'entrée ;
- accélérer de manière perceptible ;
- conserver une petite inertie ;
- pouvoir corriger sa trajectoire ;
- ne jamais sembler glisser de façon incontrôlable.

Les valeurs numériques devront être déterminées par prototypage et non imposées arbitrairement.

---

# 14. Mouvement du personnage

Le contrôleur doit prévoir au minimum :

- déplacement horizontal ;
- accélération ;
- décélération ;
- vitesse maximale ;
- saut ;
- hauteur de saut variable ;
- gravité ;
- contrôle aérien ;
- coyote time ;
- jump buffering ;
- chute ;
- collision avec plateformes ;
- plateformes traversables par le haut si nécessaire.

## 14.1. Coyote time

Le joueur doit pouvoir déclencher un saut quelques frames après avoir quitté une plateforme.

Valeur initiale recommandée pour le prototype :

**~80–120 ms**, à ajuster pendant les tests.

## 14.2. Jump buffering

Une pression de saut légèrement avant l'atterrissage doit être mémorisée pendant une courte fenêtre.

Valeur initiale :

**~80–120 ms**, à ajuster.

## 14.3. Hauteur variable

La durée de maintien du bouton de saut doit influencer la hauteur.

Le joueur doit pouvoir effectuer :

- petits sauts ;
- sauts moyens ;
- sauts complets.

---

# 15. Capacités de mouvement

Les capacités exactes doivent être validées par prototypage.

Base envisagée :

1. déplacement / saut ;
2. escalade ou interaction verticale ;
3. wall jump ;
4. capacité de déplacement à distance ;
5. dash ;
6. capacité finale liée au monde étrange.

Les capacités ne doivent pas être de simples clés ouvrant des portes.

Chaque capacité doit :

- modifier les possibilités de mouvement ;
- ouvrir plusieurs types de chemins ;
- être utile dans les anciennes zones ;
- créer des raccourcis ;
- permettre de découvrir des secrets.

---

# 16. Croissance physique

La croissance réelle doit avoir une influence modérée.

Elle peut modifier :

- taille du personnage ;
- hauteur d'accès ;
- capacité à franchir certains obstacles ;
- taille de certaines collisions ;
- possibilités de passer sous certains éléments ;
- animations ;
- vitesse ou inertie légèrement.

Elle ne doit pas casser la cohérence des anciennes zones.

Le level design doit être conçu en sachant qu'une même zone peut être visitée à plusieurs phases de croissance.

---

# 17. Combat

## 17.1. Philosophie

Le combat est secondaire.

Il sert principalement à :

- traverser certaines zones ;
- gérer des menaces ;
- créer des situations de déplacement ;
- mettre à l'épreuve le timing.

## 17.2. Arme

La fillette utilise un objet-jouet / bâton dont les fonctionnalités évoluent avec elle.

Le système doit permettre plusieurs comportements sans imposer une arme réaliste ou létale.

## 17.3. Attaque

Contrôle dédié.

Prévoir au minimum :

- attaque au sol ;
- attaque aérienne si elle s'avère utile ;
- hitbox séparée du sprite ;
- temps de récupération ;
- interaction avec les ennemis ;
- recul éventuel.

Les valeurs doivent être testées pour éviter que l'attaque ne domine le mouvement.

## 17.4. Pas de gore

Les ennemis peuvent être :

- repoussés ;
- étourdis ;
- effrayés ;
- dispersés ;
- vaincus de manière abstraite.

Éviter une violence réaliste envers une enfant.

---

# 18. Ennemis

Les ennemis doivent être liés à l'environnement.

Exemples :

- araignée ;
- insecte ;
- jouet mécanique ;
- aspirateur fantastique ;
- objet domestique animé ;
- animal perçu comme monstrueux ;
- créature issue du monde étrange.

Chaque ennemi doit être conçu avec au moins une interaction avec le mouvement.

Exemples :

- bloque une plateforme ;
- patrouille sur un mur ;
- force un saut ;
- projette une zone dangereuse ;
- change la trajectoire optimale ;
- poursuit le personnage verticalement.

---

# 19. Boss

Les boss sont principalement des **examens de maîtrise du mouvement**.

Un boss peut tester :

- saut ;
- wall jump ;
- dash ;
- déplacement vertical ;
- anticipation ;
- utilisation du décor ;
- attaque limitée.

Les boss doivent éviter les arènes statiques.

Idéalement :

```text
Boss
 ↓
Déplacement
 ↓
Observation
 ↓
Évitement
 ↓
Fenêtre d'action
 ↓
Nouvelle phase de déplacement
```

Chaque boss doit être lié au thème ou à la peur de la phase narrative concernée.

---

# 20. Mort et checkpoints

## 20.1. Mort

La mort doit rester douce visuellement.

Elle peut prendre la forme de :

- chute ;
- peur ;
- retour en arrière ;
- évanouissement ;
- submersion non réaliste ;
- disparition temporaire dans le monde étrange.

Éviter une représentation graphique de la mort.

## 20.2. Respawn

Après échec :

- retour au dernier checkpoint ;
- restauration de l'état du monde local ;
- conservation de la progression permanente.

## 20.3. Checkpoints

Les checkpoints sont diégétiques.

Exemples :

- coin sécurisé ;
- couverture ;
- banc ;
- fleur ;
- petite cabane ;
- objet familier ;
- lieu protecteur ;
- élément étrange.

Fonctions :

- sauvegarde ;
- restauration ;
- éventuellement soin/restauration ;
- éventuellement voyage rapide après déblocage.

---

# 21. Sauvegarde

La sauvegarde doit fonctionner entièrement côté navigateur.

Technologies candidates :

- IndexedDB en priorité ;
- LocalStorage comme mécanisme secondaire pour certains métadonnées/fallbacks.

## 21.1. Sauvegarde automatique

Sauvegarder notamment :

- progression narrative ;
- capacités ;
- état des checkpoints ;
- carte ;
- collectibles ;
- souvenirs ;
- progression des zones ;
- configuration utilisateur.

## 21.2. Robustesse

Le système doit éviter les corruptions et pertes simples.

Prévoir :

- versionnement des données ;
- validation du schéma ;
- checksum ou mécanisme équivalent si pertinent ;
- écriture atomique autant que possible ;
- conservation d'un état précédent valide ;
- migration des anciennes versions ;
- récupération d'une sauvegarde précédente en cas d'écriture invalide.

## 21.3. Reprise

Au lancement :

> « Continuer »

doit permettre de reprendre directement à partir de l'état sauvegardé.

Si plusieurs emplacements de sauvegarde sont jugés utiles par l'agent de développement, ils peuvent être proposés, mais un seul emplacement principal est suffisant pour le MVP.

---

# 22. Inventaire

Trois catégories.

## 22.1. Souvenirs / objets narratifs

Exemples :

- dessin ;
- photo ;
- jouet ;
- morceau de tissu ;
- objet de famille ;
- lettre ;
- petit souvenir.

Ils peuvent être consultables.

Ils servent à enrichir le récit.

## 22.2. Améliorations permanentes

Exemples :

- amélioration de mouvement ;
- augmentation de certaines ressources ;
- nouvelles capacités ;
- amélioration d'une capacité.

## 22.3. Objets équipables

Petits objets modifiant légèrement le gameplay.

Ils doivent rester limités.

Éviter un système complexe de statistiques.

---

# 23. Secrets et complétion

Le jeu doit avoir un système explicite de complétion.

Exemples :

- souvenirs trouvés ;
- objets ;
- secrets ;
- zones découvertes ;
- éléments narratifs facultatifs.

L'interface peut afficher :

> Souvenirs : 12/30  
> Secrets : 8/20

Les compteurs doivent être utilisés avec modération afin de ne pas transformer chaque découverte en simple checklist.

---

# 24. Carte

La carte est **dessinée par l'enfant**.

Concept :

La fillette dessine progressivement les endroits qu'elle découvre.

La carte peut avoir :

- apparence enfantine ;
- annotations ;
- dessins ;
- symboles ;
- raccourcis ;
- zones mystérieuses.

La carte ne doit pas nécessairement révéler tous les secrets.

Elle doit principalement aider à comprendre :

- où l'on se trouve ;
- quelles zones ont été découvertes ;
- les grandes connexions ;
- certains checkpoints ;
- éventuellement certains passages importants.

## 24.1. Carte imparfaite

La carte peut volontairement être moins précise que les cartes traditionnelles.

Elle doit conserver une dimension narrative.

---

# 25. Level design

## 25.1. Principe fondamental

Le monde est un espace interconnecté, pas une succession de niveaux linéaires.

## 25.2. Structure

Chaque grande zone doit idéalement contenir :

- boucle principale ;
- raccourcis ;
- embranchements ;
- verticalité ;
- zone secrète ;
- point de repos ;
- connexion vers une autre zone ;
- au moins un élément à revisiter plus tard.

## 25.3. Signposting

Le jeu doit montrer au joueur des possibilités futures.

Exemples :

- corniche trop haute ;
- passage visible ;
- porte inaccessible ;
- branche lointaine ;
- tunnel trop petit ;
- objet inaccessible ;
- mur intéressant.

Le joueur doit pouvoir se souvenir :

> « Je reviendrai ici. »

## 25.4. Backtracking

Le backtracking doit être motivé.

Lors d'un retour :

- nouvelle route ;
- nouveau raccourci ;
- secret ;
- changement de perception ;
- changement lié à la croissance ;
- événement narratif.

Éviter les allers-retours artificiels uniquement destinés à rallonger la durée.

---

# 26. Zones envisagées

La structure exacte reste à concevoir.

Base de travail :

1. chambre ;
2. maison ;
3. jardin ;
4. quartier ;
5. lieux extérieurs ;
6. lieux oubliés / étranges ;
7. zone finale liée à Maria.

Ces catégories ne sont pas nécessairement des niveaux séparés.

La maison, par exemple, doit fonctionner comme une zone réutilisable.

---

# 27. Direction des secrets

Les secrets doivent être variés.

Types :

### 27.0.1. Observation

Le joueur remarque un détail inhabituel.

### 27.0.2. Plateforme

Zone exigeante récompensant la maîtrise.

### 27.0.3. Exploration

Passage caché.

### 27.0.4. Revisite

Zone accessible avec une capacité acquise plus tard.

### 27.0.5. Narratif

Souvenir ou indice.

### 27.0.6. Monde étrange

Lieu difficile à interpréter.

Éviter de créer uniquement des objets cachés derrière des murs.

---

# 28. Système de progression global

Le joueur progresse sur plusieurs axes :

```text
Compétence du joueur
       +
Capacités du personnage
       +
Croissance de l'enfant
       +
Connaissance du monde
       +
Compréhension de Maria
```

La progression ne doit donc pas être uniquement numérique.

---

# 29. Architecture technique proposée

## 29.1. Technologie

Choix de base :

- Phaser 3 ;
- TypeScript ;
- bundler moderne, par exemple Vite ;
- architecture modulaire ;
- assets séparés du code ;
- données de niveau externes autant que possible.

L'agent de développement peut proposer une alternative si elle apporte un bénéfice clair, mais doit documenter la raison.

## 29.2. Architecture indicative

```text
src/
  main.ts
  config/
  core/
    Game.ts
    GameState.ts
    EventBus.ts
    SaveManager.ts
    InputManager.ts
  player/
    Player.ts
    PlayerController.ts
    PlayerPhysics.ts
    PlayerStateMachine.ts
    abilities/
  combat/
    CombatSystem.ts
    Hitbox.ts
    Hurtbox.ts
  enemies/
    Enemy.ts
    enemy-types/
  world/
    WorldManager.ts
    Zone.ts
    Checkpoint.ts
    Interactable.ts
  map/
    MapSystem.ts
  inventory/
    Inventory.ts
    Item.ts
  narrative/
    NarrativeManager.ts
    StoryEvent.ts
  ui/
    HUD.ts
    TouchControls.ts
    Menus.ts
  audio/
  scenes/
  data/
assets/
  characters/
  environments/
  enemies/
  ui/
  audio/
  maps/
tests/
```

Cette architecture est indicative.

L'agent de codage doit pouvoir la modifier si une meilleure architecture est justifiée.

---

# 30. Machine à états du joueur

Une machine à états est recommandée.

États potentiels :

```text
Idle
Run
Jump
Fall
Land
WallSlide
WallJump
Dash
Attack
AirAttack
Hurt
Interact
Dead/Respawn
Cutscene
```

Éviter les dépendances circulaires entre états.

Les systèmes de contrôle, animation et physique doivent rester suffisamment séparés pour faciliter les tests.

---

# 31. Système d'input

Créer une abstraction unique :

```text
InputAction
```

Actions principales :

```text
Move
Jump
Attack
Ability
Interact
Pause
Map
```

Les sources d'entrée :

```text
Touch
Keyboard
Gamepad
```

doivent alimenter le même système.

Cela permet d'éviter que le gameplay dépende directement de Phaser.Input.Touch.

---

# 32. Données de zones

Les zones devraient être pilotées autant que possible par des données.

Exemple conceptuel :

```json
{
  "id": "house_bedroom",
  "connections": [
    "house_hall",
    "strange_under_bed"
  ],
  "checkpoints": [],
  "requiredAbilities": [],
  "secrets": [],
  "narrativeEvents": []
}
```

Le format final est à déterminer par l'agent.

L'objectif est de ne pas coder chaque élément de niveau en dur.

---

# 33. Système d'événements narratifs

Prévoir un système d'événements permettant :

- apparition d'un objet ;
- disparition d'un objet ;
- dialogue court ;
- changement d'ambiance ;
- changement de musique ;
- apparition de Maria ;
- modification d'une zone ;
- déclenchement d'une cinématique ;
- progression narrative.

Les événements doivent pouvoir être conditionnés par :

- progression ;
- capacité ;
- zone visitée ;
- âge/phase de croissance ;
- objet possédé ;
- secret découvert.

---

# 34. Système de checkpoints

Chaque checkpoint doit posséder un identifiant unique.

Exemple :

```text
checkpoint_house_hall_01
```

Le système de sauvegarde doit conserver :

```text
currentCheckpointId
```

ainsi que l'état permanent associé.

---

# 35. Système de sauvegarde — structure indicative

```json
{
  "version": 1,
  "timestamp": 0,
  "player": {
    "growthPhase": 0,
    "abilities": []
  },
  "world": {
    "currentZone": "",
    "checkpoint": "",
    "unlockedCheckpoints": [],
    "visitedZones": []
  },
  "inventory": {
    "memories": [],
    "upgrades": [],
    "equippedItems": []
  },
  "story": {
    "flags": {}
  },
  "map": {},
  "settings": {}
}
```

La structure finale peut être modifiée.

---

# 36. Performances

Objectif :

- fonctionnement fluide sur téléphones mobiles raisonnablement récents ;
- limiter les allocations par frame ;
- éviter les milliers de GameObjects actifs simultanément ;
- utiliser pooling pour projectiles/effets lorsque nécessaire ;
- charger les assets par zone si pertinent ;
- éviter de garder inutilement toutes les zones actives.

L'agent doit mesurer les performances sur un appareil réel.

---

# 37. Caméra

La caméra doit accompagner le platforming avec précision.

Éviter :

- retard excessif ;
- mouvements brusques ;
- zooms automatiques fréquents ;
- changements de cadrage qui rendent les sauts difficiles.

Fonctions possibles :

- look-ahead horizontal ;
- look-ahead vertical ;
- zones mortes contrôlées ;
- transitions douces ;
- verrouillage temporaire pendant certaines séquences.

Les réglages doivent être conçus autour du platforming, pas autour d'effets cinématiques.

---

# 38. Interface utilisateur

L'interface doit rester discrète.

HUD minimal :

- éventuellement état de santé/peur ;
- objet équipé ;
- indicateur de capacité ;
- informations contextuelles.

Éviter de remplir l'écran mobile.

Menus :

- continuer ;
- nouvelle partie ;
- carte ;
- inventaire ;
- souvenirs ;
- paramètres ;
- retour au jeu.

---

# 39. Audio

La bande-son doit soutenir le contraste entre :

- maison rassurante ;
- exploration ;
- étrangeté ;
- découverte ;
- nostalgie.

Le son peut également servir à l'ambiguïté.

Exemples :

- bruit d'une machine qui devient inquiétant ;
- musique enfantine légèrement transformée ;
- bruits provenant d'endroits impossibles ;
- silence lors de certaines apparitions de Maria.

Maria peut avoir un motif musical, mais il ne faut pas nécessairement l'expliquer.

---

# 40. Accessibilité

Prévoir au minimum :

- taille configurable des boutons ;
- repositionnement éventuel des commandes ;
- réglage du volume ;
- réglage des effets sonores ;
- option vibration ;
- texte lisible ;
- contraste suffisant ;
- possibilité de réduire certains effets visuels.

La difficulté doit rester cohérente avec le cœur du jeu.

---

# 41. MVP recommandé

L'agent ne doit pas commencer par construire 15 heures de jeu.

Le premier objectif doit être un **vertical slice jouable**.

## 41.1. MVP / Vertical Slice

Une petite zone représentant une partie de la maison.

Elle doit contenir :

- déplacement ;
- saut ;
- coyote time ;
- jump buffering ;
- accélération ;
- contrôle aérien ;
- caméra ;
- joystick tactile ;
- attaque au bâton ;
- un ennemi ;
- un checkpoint ;
- mort/respawn ;
- sauvegarde ;
- carte rudimentaire ;
- une capacité de mouvement ;
- un petit secret ;
- une manifestation ambiguë de Maria ;
- une courte séquence narrative.

Le vertical slice doit permettre de juger :

> « Est-ce que ce jeu est agréable à contrôler ? »

avant de produire le contenu.

---

# 42. Ordre de développement recommandé

## 42.1. Phase 1 — Prototype mouvement

Développer :

- personnage ;
- accélération ;
- saut ;
- hauteur variable ;
- coyote time ;
- jump buffering ;
- contrôle aérien ;
- collisions.

Critère :

> Le déplacement doit être agréable sans aucun contenu artistique.

## 42.2. Phase 2 — Prototype plateforme

Ajouter :

- plateformes ;
- verticalité ;
- caméra ;
- petits parcours ;
- wall jump si nécessaire.

Tester le niveau de difficulté.

## 42.3. Phase 3 — Contrôles mobiles

Ajouter :

- joystick ;
- boutons ;
- multi-touch ;
- adaptation écran.

Tester sur plusieurs téléphones.

## 42.4. Phase 4 — Combat minimal

Ajouter :

- bâton ;
- attaque ;
- ennemi ;
- hitbox/hurtbox ;
- feedback.

## 42.5. Phase 5 — Checkpoint / sauvegarde

Implémenter :

- checkpoint ;
- respawn ;
- sauvegarde ;
- récupération ;
- versionnement.

## 42.6. Phase 6 — Première zone réelle

Construire une petite portion de la maison.

## 42.7. Phase 7 — Croissance

Ajouter le premier changement de phase.

Tester :

- modification visuelle ;
- modification physique ;
- revisite d'une zone.

## 42.8. Phase 8 — Exploration / carte

Ajouter :

- carte dessinée ;
- secrets ;
- raccourcis ;
- revisites.

## 42.9. Phase 9 — Narration

Ajouter :

- Maria ;
- événements ;
- parents ;
- monde étrange.

## 42.10. Phase 10 — Contenu

Construire progressivement les grandes zones.

---

# 43. Critères d'acceptation du prototype

Le prototype doit satisfaire au minimum :

### 43.0.1. Mouvement

- [ ] déplacement immédiatement compréhensible ;
- [ ] accélération perceptible ;
- [ ] arrêt contrôlable ;
- [ ] saut précis ;
- [ ] hauteur variable ;
- [ ] coyote time ;
- [ ] jump buffering ;
- [ ] contrôle aérien.

### 43.0.2. Mobile

- [ ] orientation paysage ;
- [ ] joystick fonctionnel ;
- [ ] boutons fonctionnels ;
- [ ] multi-touch ;
- [ ] aucune perte d'input lors de mouvements simultanés.

### 43.0.3. Caméra

- [ ] visibilité suffisante des trajectoires ;
- [ ] pas de mouvements parasites ;
- [ ] cadrage adapté aux sauts.

### 43.0.4. Combat

- [ ] attaque fiable ;
- [ ] hitbox correcte ;
- [ ] ennemi identifiable ;
- [ ] combat secondaire.

### 43.0.5. Monde

- [ ] checkpoint ;
- [ ] mort/respawn ;
- [ ] au moins une boucle ;
- [ ] au moins un secret ;
- [ ] une capacité permettant une revisite.

### 43.0.6. Narration

- [ ] Maria est introduite ;
- [ ] Maria ne parle pas ;
- [ ] Maria n'est jamais montrée en mouvement ;
- [ ] au moins une manifestation ambiguë existe.

### 43.0.7. Sauvegarde

- [ ] sauvegarde automatique ;
- [ ] reprise après fermeture du navigateur ;
- [ ] validation des données ;
- [ ] récupération d'un état précédent en cas d'écriture invalide.

---

# 44. Principes à ne pas violer sans validation

1. **Le platforming est le cœur du jeu.**
2. Le mouvement doit privilégier la précision plutôt que le réalisme.
3. Le monde doit être interconnecté.
4. Les revisites doivent avoir une raison.
5. Les capacités doivent transformer le déplacement, pas seulement ouvrir des portes.
6. Le combat reste secondaire.
7. Maria ne parle jamais.
8. Maria n'est jamais montrée en train de se déplacer.
9. Le fantastique ne doit jamais être entièrement expliqué.
10. La croissance doit avoir une influence réelle.
11. Les parents diminuent progressivement en présence mais ne disparaissent pas arbitrairement.
12. Le ton reste doux-amer, mystérieux et parfois inquiétant, sans basculer dans l'horreur.
13. Le joueur doit pouvoir comprendre l'histoire sans lire une quantité importante de texte.
14. Les secrets doivent récompenser l'observation et la maîtrise.
15. Le jeu doit être conçu d'abord pour mobile paysage.
16. Les données de sauvegarde ne doivent pas être facilement perdues.
17. Le jeu doit être agréable avant d'être volumineux.
18. Le prototype de mouvement doit être validé avant la production massive de contenu.

---

# 45. Ce qui reste volontairement ouvert

Les éléments suivants ne doivent pas être inventés comme des décisions définitives par l'agent de codage :

- design visuel définitif ;
- coiffure exacte de Céleste selon chaque phase ;
- détails vestimentaires et accessoires exacts de Maria ;
- histoire détaillée de la famille ;
- événement exact de disparition ;
- explication finale du monde étrange ;
- liste définitive des zones ;
- liste définitive des capacités ;
- nombre exact de boss ;
- nombre exact de souvenirs ;
- durée de chaque chapitre ;
- valeurs finales de physique ;
- système exact d'équipement ;
- musique ;
- effets sonores.

Ces éléments doivent être traités comme des paramètres de conception à définir.

---

# 46. Rôle attendu de l'agent de codage

L'agent doit considérer ce document comme une **spécification fonctionnelle et de conception**, pas comme une prescription absolue de chaque détail technique.

Lorsqu'une décision technique peut être améliorée, l'agent doit :

1. identifier le problème ;
2. proposer une alternative ;
3. expliquer brièvement les conséquences ;
4. privilégier la simplicité et la maintenabilité ;
5. préserver les intentions de gameplay ;
6. éviter d'ajouter une architecture complexe sans nécessité.

L'agent doit notamment signaler lorsqu'une idée narrative ou de gameplay semble :

- trop coûteuse ;
- contradictoire ;
- difficile à maintenir ;
- mauvaise pour les performances mobiles ;
- incompatible avec la physique du platforming ;
- susceptible de créer de la dette technique.

---

# 47. Principes de qualité du code

Le projet doit viser :

- TypeScript strict autant que possible ;
- modules cohérents ;
- faible couplage ;
- interfaces claires ;
- données séparées de la logique ;
- fonctions testables ;
- constantes centralisées ;
- pas de valeurs magiques dispersées ;
- commentaires uniquement lorsque la logique n'est pas évidente ;
- gestion explicite des états ;
- logs de développement désactivables ;
- outils de debug activables en développement.

---

# 48. Outils de debug recommandés

Prévoir un mode développement permettant éventuellement :

- afficher hitboxes ;
- afficher hurtboxes ;
- afficher collision shapes ;
- afficher vitesse ;
- afficher état du joueur ;
- téléporter à une zone ;
- débloquer les capacités ;
- changer de phase de croissance ;
- déclencher un événement narratif ;
- afficher les IDs des checkpoints ;
- inspecter l'état de sauvegarde.

Ces outils ne doivent pas être accessibles dans la version normale du jeu.

---

# 49. Stratégie de tests

Tester séparément :

## 49.1. Tests unitaires

- calcul du mouvement ;
- fenêtres coyote/jump buffer ;
- sauvegarde ;
- chargement ;
- migration de sauvegarde ;
- inventaire ;
- progression ;
- événements.

## 49.2. Tests d'intégration

- checkpoint → mort → respawn ;
- capacité → nouvelle zone ;
- capacité → revisite ;
- événement → modification du monde ;
- sauvegarde → fermeture → reprise.

## 49.3. Tests manuels

- tactile ;
- écrans différents ;
- perte de focus ;
- rotation accidentelle ;
- fermeture du navigateur ;
- retour arrière du navigateur ;
- reprise après interruption.

---

# 50. Risques principaux

## 50.1. Risque 1 — Le platforming n'est pas assez bon

C'est le risque numéro un.

**Solution :** prototype extrêmement tôt et nombreuses itérations sur la physique.

## 50.2. Risque 2 — Trop de contenu

15 heures de contenu de qualité peuvent devenir coûteuses.

**Solution :** construire un monde compact, réutilisé intelligemment.

## 50.3. Risque 3 — Le mystère devient incompréhensible

L'ambiguïté ne doit pas devenir confusion.

**Solution :** chaque séquence doit être compréhensible localement même si son interprétation globale reste ouverte.

## 50.4. Risque 4 — Combat trop important

**Solution :** concevoir les ennemis autour du mouvement.

## 50.5. Risque 5 — Croissance difficile à gérer

**Solution :** conserver une physique commune autant que possible et faire évoluer principalement des paramètres contrôlés.

## 50.6. Risque 6 — Sauvegarde navigateur fragile

**Solution :** IndexedDB, versionnement, validation, sauvegarde précédente et tests de récupération.

## 50.7. Risque 7 — Commandes tactiles imprécises

**Solution :** hit areas généreuses, multi-touch, tests sur appareil réel et réglages personnalisables.

---

# 51. Vision finale

Le résultat recherché n'est pas simplement :

> « un Metroidvania avec une petite fille ».

Le jeu doit donner au joueur la sensation suivante :

> **J'explore un endroit que je connais, mais que je n'avais jamais vraiment regardé.**

Au début, le joueur voit une maison.

Puis il découvre une aventure.

Puis un monde.

Puis des souvenirs.

Et finalement, il comprend que la maison, Maria et le monde étrange ont accompagné la fillette pendant qu'elle grandissait.

Le joueur doit sortir du jeu avec l'impression d'avoir **vécu une petite aventure personnelle**, plutôt que d'avoir simplement terminé une succession de niveaux.

---

# 52. Priorités absolues pour la première implémentation

Si les ressources sont limitées, respecter cet ordre :

1. **Qualité du mouvement**
2. **Qualité du level design**
3. **Contrôles tactiles**
4. **Exploration / carte**
5. **Progression par capacités**
6. **Croissance**
7. **Maria et narration**
8. **Combat**
9. **Secrets avancés**
10. **Polish audiovisuel**

Un contenu important mais médiocre ne doit jamais être privilégié à un petit contenu extrêmement bien conçu.

---

# 53. Décision de production recommandée

La première livraison ne doit pas chercher à produire le jeu complet.

Elle doit produire un **vertical slice de 15–30 minutes** démontrant :

- le feeling du déplacement ;
- une petite portion de maison ;
- l'exploration interconnectée ;
- un premier ennemi ;
- le bâton ;
- un checkpoint ;
- une première capacité ;
- un secret ;
- une manifestation de Maria ;
- la sauvegarde ;
- les contrôles tactiles ;
- une première manifestation du contraste réel / monde étrange.

Après validation de ce vertical slice, le reste du jeu pourra être produit à partir de ses systèmes validés.

---

# 54. Note finale à l'agent

Ce document décrit l'intention du projet et ses contraintes actuelles.

Il est attendu de l'agent qu'il **challenge les choix techniques lorsque cela améliore objectivement la qualité du résultat**, mais qu'il ne modifie pas silencieusement les piliers du jeu.

Toute modification substantielle concernant :

- le mouvement ;
- le système de progression ;
- Maria ;
- la structure du monde ;
- la croissance ;
- la sauvegarde ;
- la boucle de gameplay

doit être explicitement signalée avant d'être considérée comme définitive.

Le succès du projet doit être évalué d'abord sur une question simple :

> **Est-ce que contrôler cette petite fille et explorer son monde est suffisamment agréable pour donner envie de continuer à jouer ?**

