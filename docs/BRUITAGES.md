# MARIA — Les bruitages à fournir (D-126)

Chaque son a un **emplacement** (son nom). Un emplacement sans fichier reste silencieux : on peut
fournir les sons un par un, dans n'importe quel ordre. Dans le build de debug, **DEBUG → « Sons de
test »** remplace chaque son manquant par un petit bip, pour vérifier au téléphone qu'il tombe au
bon moment.

## Comment les envoyer

- **Format** : n'importe lequel (`.wav` de préférence, sinon `.mp3`, `.m4a`, `.ogg`, `.flac`).
  Je les prépare avec `npm run audio:prepare -- --sfx <fichiers>` : silences coupés, mono, même
  volume de crête, `.m4a` de quelques Ko.
- **Nom** : l'emplacement, suivi d'un numéro par **variante** : `step-wood-1.wav`,
  `step-wood-2.wav`… Une variante est tirée au hasard à chaque fois, jamais deux fois de suite la
  même, et la hauteur varie un peu : **3 ou 4 variantes** pour les pas, **2** pour les sons
  fréquents, **1** suffit pour les sons rares.
- **Un son par fichier**, sans musique ni bruit de fond, le plus court possible (un pas : 0,1 à
  0,3 s).
- **Licence** : de préférence CC0 (domaine public), par exemple Kenney (kenney.nl, « Audio ») ou
  freesound.org (filtre « Creative Commons 0 »). Pour une licence CC-BY, me donner l'auteur et le
  lien : il faudra le créditer.
- Les pas en **chaussons** sur un vrai parquet, un tapis, de l'herbe, enregistrés au téléphone,
  peuvent avoir beaucoup de charme.

Dans le monde étrange, les mêmes sons passent automatiquement par un filtre et un écho : pas de
fichier en plus. **Pas d'ambiances pour l'instant** (décision de l'utilisateur).

## La liste (tous branchés, chantier B, PR 1 et 2)

✅ : fourni (D-131, avec le nombre de variantes). Les autres sont encore à fournir.

### Le mouvement

| Emplacement         | Quand                                                       | Variantes |
| ------------------- | ----------------------------------------------------------- | --------- |
| `step-wood`         | un pas sur du bois (parquet, meuble, planche)               | 3–4       |
| `step-fabric`       | un pas sur du tissu (lit, canapé, couchette, valise)        | 3–4       |
| `step-grass` ✅ ×4  | un pas dans l'herbe, la terre                               | 3–4       |
| `step-stone` ✅ ×4  | un pas sur la pierre, les pavés, le carrelage               | 3–4       |
| `step-sand` ✅ ×4   | un pas dans le sable                                        | 3–4       |
| `step-metal`        | un pas sur du métal (toit du train, échafaudage, voiture)   | 3–4       |
| `step-leaves` ✅ ×3 | un pas sur une haie, un buisson, un nid                     | 2–3       |
| `jump` ✅           | le décollage d'un saut : un froissement, un petit souffle   | 2         |
| `land` ✅           | une réception ordinaire (par-dessus le pas)                 | 2         |
| `land-big`          | la réception d'une grande chute                             | 1–2       |
| `hurt` ✅           | Céleste touchée (piqûre, coup, poursuivant) : jamais un cri | 2         |
| `splash` ✅         | une chute dans l'eau                                        | 1–2       |

### Les capacités

| Emplacement         | Quand                                                    | Variantes |
| ------------------- | -------------------------------------------------------- | --------- |
| `ledge-grab`        | les mains attrapent un rebord                            | 2         |
| `ledge-climb` ✅    | Céleste se hisse                                         | 1–2       |
| `wall-slide`        | glisse contre un mur (**boucle**, 1 à 3 s, sans coupure) | 1         |
| `wall-jump`         | le saut mural                                            | 2         |
| `umbrella-open` ✅  | le parapluie s'ouvre                                     | 1–2       |
| `umbrella-close` ✅ | le parapluie se referme                                  | 1–2       |
| `hook-catch` ✅     | le crochet attrape un câble (métallique)                 | 1–2       |
| `cable-slide` ✅    | glisse le long d'un câble (**boucle**)                   | 1         |
| `slide`             | la glissade au sol (un frottement)                       | 2         |
| `shift` ✅          | la bascule entre les deux couches (étrange, doux)        | 1–2       |

### Le combat, les dangers, les poursuites

| Emplacement     | Quand                                          | Variantes |
| --------------- | ---------------------------------------------- | --------- |
| `attack`        | le coup de bâton qui fend l'air                | 2–3       |
| `hit`           | le bâton touche un ennemi (sourd, pas violent) | 2         |
| `enemy-scatter` | un ennemi se disperse                          | 1–2       |
| `chase-wake`    | un poursuivant s'éveille                       | 1         |
| `chase-rumble`  | le grondement du poursuivant (**boucle**)      | 1         |
| `train-warn` ✅ | un train s'annonce en gare                     | 1         |
| `train-pass` ✅ | un train passe en gare                         | 1         |
| `tunnel`        | le train entre dans un tunnel (sur le toit)    | 1         |
| `wave-warn`     | la vague s'annonce                             | 1         |
| `erase`         | l'effacement s'annonce (niveau 7)              | 1         |
| `lullaby`       | une étoile de la berceuse s'annonce (niveau 8) | 4–6       |

`lullaby` : une seule note de boîte à musique par fichier, chaque variante une note différente de la
même gamme douce (tirées au hasard, elles font une petite mélodie).

### Le monde

| Emplacement  | Quand                                    | Variantes |
| ------------ | ---------------------------------------- | --------- |
| `checkpoint` | une veilleuse s'allume                   | 1         |
| `door`       | une porte de façade s'ouvre              | 1–2       |
| `thought`    | une bulle de pensée apparaît (très doux) | 1         |
| `hint`       | le fil discret se montre (un tintement)  | 1         |
| `map-open`   | la page du cahier s'ouvre (la carte)     | 1         |
| `map-close`  | la page du cahier se referme             | 1         |

### La voix de Céleste

Facultative, jamais de mots, jouée rarement pour ne pas lasser.

| Emplacement    | Quand                                             |
| -------------- | ------------------------------------------------- |
| `voice-hop`    | un petit « hop », un saut sur quatre              |
| `voice-effort` | se hisser, le saut mural (une fois sur deux)      |
| `voice-ouch`   | touchée : un petit souffle surpris, jamais un cri |
| `voice-oh`     | surprise : un poursuivant qui s'éveille           |
| `voice-laugh`  | joie : une trouvaille, une capacité trouvée       |

Une **boucle** peut être envoyée telle quelle : je la prépare avec `--sfx --loop`, qui mêle sa fin à
son début en fondu enchaîné (D-131). Il suffit qu'elle dure au moins 1 s, sans attaque ni fin
marquée.
