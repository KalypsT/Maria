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

## Déjà branchés (chantier B, PR 1)

| Emplacement   | Quand                                                       | Variantes |
| ------------- | ----------------------------------------------------------- | --------- |
| `step-wood`   | un pas sur du bois (parquet, meuble, planche)               | 3–4       |
| `step-fabric` | un pas sur du tissu (lit, canapé, couchette, valise)        | 3–4       |
| `step-grass`  | un pas dans l'herbe, la terre                               | 3–4       |
| `step-stone`  | un pas sur la pierre, les pavés, le carrelage               | 3–4       |
| `step-sand`   | un pas dans le sable                                        | 3–4       |
| `step-metal`  | un pas sur du métal (toit du train, échafaudage, voiture)   | 3–4       |
| `step-leaves` | un pas sur une haie, un buisson, un nid                     | 2–3       |
| `jump`        | le décollage d'un saut : un froissement, un petit souffle   | 2         |
| `land`        | une réception ordinaire (par-dessus le pas)                 | 2         |
| `land-big`    | la réception d'une grande chute                             | 1–2       |
| `hurt`        | Céleste touchée (piqûre, coup, poursuivant) : jamais un cri | 2         |
| `splash`      | une chute dans l'eau                                        | 1–2       |
| `checkpoint`  | une veilleuse s'allume                                      | 1         |
| `map-open`    | la page du cahier s'ouvre (la carte)                        | 1         |
| `map-close`   | la page du cahier se referme                                | 1         |

## À venir (chantier B, PR 2)

| Emplacement      | Quand                                                    |
| ---------------- | -------------------------------------------------------- |
| `ledge-grab`     | les mains attrapent un rebord                            |
| `ledge-climb`    | Céleste se hisse                                         |
| `wall-slide`     | glisse contre un mur (boucle, quelques secondes)         |
| `wall-jump`      | saut mural                                               |
| `umbrella-open`  | le parapluie s'ouvre                                     |
| `umbrella-close` | le parapluie se referme                                  |
| `hook-catch`     | le crochet du parapluie attrape un câble (métallique)    |
| `cable-slide`    | glisse le long d'un câble (boucle)                       |
| `slide`          | la glissade au sol (un frottement)                       |
| `shift`          | la bascule entre les deux couches (un son étrange, doux) |
| `attack`         | le coup de bâton qui fend l'air                          |
| `hit`            | le bâton touche un ennemi (sourd, pas violent)           |
| `enemy-scatter`  | un ennemi se disperse                                    |
| `chase-wake`     | un poursuivant s'éveille                                 |
| `chase-rumble`   | grondement du poursuivant (boucle)                       |
| `wave-warn`      | la vague s'annonce                                       |
| `train-warn`     | un train s'annonce en gare                               |
| `train-pass`     | un train passe                                           |
| `tide`           | la marée monte ou descend                                |
| `erase`          | l'effacement avance (niveau 7)                           |
| `door`           | une porte de façade s'ouvre                              |
| `thought`        | une bulle de pensée apparaît (très doux)                 |
| `ui-tap`         | un bouton du menu                                        |

**La voix de Céleste** (facultative, jamais de mots ; jouée rarement pour ne pas lasser) :

| Emplacement    | Quand                                               |
| -------------- | --------------------------------------------------- |
| `voice-hop`    | un petit « hop » à certains sauts                   |
| `voice-effort` | se hisser, saut mural                               |
| `voice-ouch`   | touchée : un petit souffle surpris, jamais un cri   |
| `voice-oh`     | surprise : un présage, un poursuivant qui s'éveille |
| `voice-laugh`  | joie : une affaire de Maria, un souvenir            |
| `voice-yawn`   | s'endormir                                          |
