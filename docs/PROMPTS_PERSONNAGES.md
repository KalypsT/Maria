# Prompts pour les illustrations des personnages

Objectif : papa, maman et Céleste dans le style de l'illustration de l'écran de départ
(`public/art/celeste.png`). Les prompts sont en anglais : les générateurs d'images les suivent mieux.

## Méthode

1. **Toujours joindre `public/art/celeste.png` comme image de référence de style** (et, une fois validée,
   la première image du personnage comme référence pour toutes ses autres poses : même visage, mêmes
   vêtements, mêmes couleurs).
2. Générer d'abord **papa debout (pose neutre)** et **maman debout (pose neutre)**. Une fois validés,
   les poses suivent avec ces images en référence.
3. Format : portrait, **au moins 1500 px de haut**, PNG si possible, **fond blanc uni** (je détoure).
4. Toujours **de profil strict, tourné vers la droite** (le jeu retourne l'image si besoin), corps
   entier, rien de coupé (mains, pieds, accessoires).
5. Déposer les fichiers dans le dépôt (ou me les envoyer) avec le nom indiqué ; je fais le détourage,
   la mise à l'échelle, la version silhouette du monde étrange et l'intégration.

### Bloc de style commun (à coller au début de chaque prompt)

```
Children's picture book illustration in exactly the same style as the reference image: soft gouache
and colored pencil texture, delicate thin warm-brown outlines, gentle rounded shapes, subtle soft
shading, warm skin with rosy cheeks, tender and calm mood. Single character, full body, strict side
profile view facing right, nothing cropped, on a plain pure white background. No text, no ground
shadow, no background elements, no logo.
```

## Papa

Description fixe (D-53), à garder mot pour mot dans chaque prompt :

```
A young father in his thirties: wavy chestnut-brown hair with volume, swept back; short neat beard;
kind eyes; slightly tanned skin; navy-blue short-sleeved V-neck t-shirt (bare forearms); dark-blue
straight jeans rolled up at the ankle; light sneakers with a blue stripe and a white sole.
```

| Fichier              | Pose (à ajouter après la description)                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dad-stand.png`      | `Standing relaxed, arms hanging naturally.` (référence pour les autres)                                                                                             |
| `dad-door.png`       | `Standing, leaning slightly forward, head tilted down with a gentle smile, one arm reaching forward and down, open hand, as if offering his hand to a small child.` |
| `dad-kitchen.png`    | `Standing, holding a white mug with a thin pink stripe in front of him at chest height with one hand, relaxed, looking ahead calmly.`                               |
| `dad-garden.png`     | `Standing, watering the garden with a small green metal watering can held forward and tilted down, a few water drops falling.`                                      |
| `dad-shop.png`       | `Standing, holding a wicker shopping basket with groceries (baguette, apples) by its handle at his side.`                                                           |
| `dad-hall.png`       | `Standing at night, coat-free, leaning slightly forward, one arm reaching forward and down, open hand, soft relieved smile.`                                        |
| `dad-quay.png`       | `Standing, one hand raised waving goodbye, soft wistful smile.`                                                                                                     |
| `dad-garden-sun.png` | Comme `dad-garden`, avec `wearing simple dark sunglasses.` (au jardin seulement)                                                                                    |

## Maman

```
A young mother in her thirties: long curly brown hair down to the middle of her back with volume;
a small earring; kind eyes; slightly tanned skin; pink short-sleeved V-neck t-shirt tucked into
light-blue straight jeans (bare forearms); light sneakers with a blue stripe and a white sole.
```

| Fichier          | Pose                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mom-stand.png`  | `Standing relaxed, arms hanging naturally.` (référence pour les autres)                                                                                                                                                                         |
| `mom-bed.png`    | `Sitting on the edge of an invisible bed (seated pose, knees bent, feet on the floor), leaning forward, one hand reaching forward at shoulder height as if stroking a child's hair, tender smile.` (sans meuble : il est dessiné dans le décor) |
| `mom-sofa.png`   | `Sitting on an invisible sofa (seated pose, knees bent), reading an open hardcover book held in both hands, calm.`                                                                                                                              |
| `mom-garden.png` | `Standing, one arm raised high pinning a small pink sock to an invisible clothesline, wearing simple dark sunglasses.`                                                                                                                          |
| `mom-bench.png`  | `Sitting on an invisible bench (seated pose), hands resting on her knees, face slightly raised to the sun, eyes closed, wearing simple dark sunglasses.`                                                                                        |
| `mom-yard.png`   | `Standing at dusk, leaning slightly forward, one arm reaching forward and down, open hand, warm smile.`                                                                                                                                         |
| `mom-quay.png`   | `Standing, one hand raised waving goodbye, soft wistful smile.`                                                                                                                                                                                 |

Les poses assises : préciser « invisible bed / sofa / bench » évite que le meuble soit dessiné ; si le
générateur en dessine un quand même, ce n'est pas grave, je l'efface.

## Céleste en pièces détachées (papier découpé, D-29)

Le jeu anime Céleste en faisant tourner des pièces séparées. Il faut donc **une planche de pièces
par tenue**, toutes vues de profil, tournées vers la droite, **séparées les unes des autres** avec de
l'espace blanc entre elles. Proportions à respecter (celles de la marionnette actuelle) :

| Pièce                                                     | Taille relative (l × h) | Articulation             |
| --------------------------------------------------------- | ----------------------- | ------------------------ |
| tête (visage, lunettes, cheveux du dessus, sans couettes) | 16 × 14                 | bas du cou               |
| couette (une seule, avec son nœud)                        | 5 × 7                   | en haut (le nœud)        |
| torse (du cou aux hanches, sans les bras)                 | 11 × 9                  | bas, au centre (hanches) |
| bras (épaule → main, droit, pendant)                      | 4 × 8                   | en haut (épaule)         |
| jambe (hanche → pied avec chaussure, droite)              | 6 × 9                   | en haut (hanche)         |
| jupe (robe seulement)                                     | 14 × 7                  | en haut (taille)         |

Les **extrémités des bras et des jambes doivent être arrondies** (épaule et haut de cuisse en
demi-disque) : elles se recouvrent quand la pièce tourne.

### Prompt (pyjama, à faire en premier)

```
[bloc de style commun, sans « Single character, full body »]
Character design sheet for a 2D cut-out paper puppet, side profile facing right. The same little
girl as in the reference image (5-6 years old, round head slightly large for her body, brown hair,
round pink glasses, freckles). Draw her body parts SEPARATED from each other, laid out in a row
with generous white space between them, all at the same scale:
1. the head alone with the face, glasses and the top of the hair, ending with a short neck, no
   pigtails;
2. one low pigtail alone with its pink ribbon bow at the top;
3. the torso alone (from neck to hips) in the pajama top, without arms;
4. one arm alone, straight and hanging, from a rounded shoulder to the hand, in the pajama sleeve
   with its pink cuff;
5. one leg alone, straight, from a rounded hip to the foot, in the pajama trousers with the pink
   bunny slipper.
Pajamas: light blue with dark blueberries and small leaves, pink piping. Clean edges, no overlap
between parts.
```

Tenues suivantes (même prompt, ligne « Pajamas » remplacée) :

- **robe** (phase 2) : `Pink floral dress with a white collar and puffed sleeves, bare legs, pink clogs. Add a 6th part: the skirt of the dress alone, flared.`
- **veste** (phase 3, queue de cheval) : `Open denim jacket with rolled-up sleeves and golden buttons over a white t-shirt with pink flowers, pink shorts with cuffs, white socks, pink-and-white sneakers without any logo. Replace part 2 with: a ponytail alone with its pink scrunchie at the top.`

Si le générateur n'arrive pas à séparer les pièces proprement, deuxième méthode : demander Céleste
entière de profil, **bras légèrement écartés du corps et jambes un peu écartées**, et je découpe les
pièces moi-même (en redessinant les parties cachées).
