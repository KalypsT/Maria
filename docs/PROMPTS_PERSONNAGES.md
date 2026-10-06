# Prompts ChatGPT pour les illustrations des personnages

Objectif : papa, maman et Céleste dans le style de l'illustration de l'écran de départ
(`public/art/celeste.png`), générés avec ChatGPT comme cette première image. Les prompts sont en
anglais : le générateur les suit mieux.

## Méthode

- **Une conversation par personnage** (papa, maman, Céleste) : ChatGPT garde ainsi le même visage
  et les mêmes vêtements d'une image à l'autre.
- **Joindre `celeste.png` au premier message** de chaque conversation (référence de style).
- Envoyer le prompt 1 (pose de référence), le refaire jusqu'à ce qu'il plaise, puis les poses
  suivantes **dans la même conversation**, une par message.
- Si une pose dérive (visage, couleurs), rejoindre l'image de référence validée au message.
- Télécharger chaque image en PNG et la nommer comme indiqué. Je fais ensuite le détourage
  (si le fond n'est pas transparent), la mise à l'échelle, la silhouette du monde étrange et
  l'intégration.

## Papa (fait en partie)

Référence : la première image de l'utilisateur (avec lunettes de soleil), puis `dad-stand` (sans).
Faites et intégrées : `dad-stand`, `dad-door`, `dad-kitchen`, `dad-shop` (D-123).

Début de chaque message (joindre `dad-stand.png`, ou l'image d'origine pour le jardin) :

```
Using the attached image as the strict reference, draw the SAME man: same face, same wavy chestnut
hair, same short beard, same navy V-neck t-shirt, same rolled-up jeans, same style, same colors, same
level of detail, same scale and framing (full body, same height in the image, feet near the bottom).
Strict side profile facing right. His sneakers have a simple straight blue stripe instead of the
wavy one (no brand marks). Plain pure white background, no ground shadow, no text, no other element.
Portrait format, high resolution.
```

| Fichier          | Fin du message                                                                                                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dad-quay.png`   | `No sunglasses. Pose: standing, front hand raised at head height waving goodbye, soft wistful smile.`                                                                                                                                           |
| `dad-garden.png` | `He wears the same dark sunglasses as in the reference. Pose: standing, watering plants with a small green metal watering can held forward in his front hand and tilted down, a few water drops falling from the spout, the other arm relaxed.` |

`dad-hall` (la nuit, sous l'horloge de la gare) reprend `dad-door` : pas d'image à faire.

## Maman (conversation 2, joindre `celeste.png`)

### mom-stand.png

```
Using the attached image as a strict style reference (same children's picture-book style: soft
gouache and colored-pencil texture, thin warm-brown outlines, rounded shapes, soft shading, rosy
cheeks, same level of detail and same proportions logic), draw the mother of this little girl.

A young mother in her thirties: long curly brown hair with volume, falling to the middle of her
back; a small earring; kind brown eyes; slightly tanned skin; pink short-sleeved V-neck t-shirt
tucked into light-blue straight jeans (bare forearms); light sneakers with a blue stripe and a white
sole, no logo.

Pose: standing relaxed, arms hanging naturally, gentle calm expression.

Full body, strict side profile facing right (like the reference), nothing cropped. Transparent
background (or plain pure white), no ground shadow, no text, no other element. Portrait format,
high resolution.
```

### Poses suivantes

Préfixe :

```
Same mother, same style, same clothes, same colors, same scale, strict side profile facing right,
full body, transparent background, no shadow, no text. New pose:
```

| Fichier          | Fin du message                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mom-bed.png`    | `sitting on the edge of a bed (seated pose, knees bent, feet on the floor), leaning forward, one hand reaching forward at shoulder height as if gently stroking a child's hair, tender smile. Do not draw the bed: she sits on nothing.` |
| `mom-sofa.png`   | `sitting on a sofa (seated pose, knees bent), reading an open hardcover book held in both hands, calm. Do not draw the sofa: she sits on nothing.`                                                                                       |
| `mom-garden.png` | `standing, one arm raised high pinning a small pink sock to a clothesline, wearing simple dark sunglasses. Do not draw the clothesline.`                                                                                                 |
| `mom-bench.png`  | `sitting on a bench (seated pose), hands resting on her knees, face slightly raised to the sun, eyes closed, wearing simple dark sunglasses. Do not draw the bench.`                                                                     |
| `mom-yard.png`   | `leaning slightly forward, one arm reaching forward and down with an open hand, warm smile.`                                                                                                                                             |
| `mom-quay.png`   | `standing, one hand raised waving goodbye, soft wistful smile.`                                                                                                                                                                          |

Si un meuble est dessiné malgré tout, ce n'est pas grave : je l'efface.

## Céleste en pièces détachées (conversation 3, joindre `celeste.png`)

Le jeu anime Céleste en faisant tourner des pièces séparées (papier découpé, D-29) : il faut une
planche de pièces par tenue. Proportions de la marionnette (largeur × hauteur) : tête 16 × 14,
couette 5 × 7, torse 11 × 9, bras 4 × 8, jambe 6 × 9, jupe 14 × 7.

### celeste-parts-pyjama.png

```
Using the attached image as the reference for both the character and the style, create a cut-out
paper puppet sheet of this exact little girl (5-6 years old, brown hair, round pink glasses,
freckles, light-blue pajamas with dark blueberries and small leaves, pink piping, pink bunny
slippers). Same picture-book style, same colors.

Draw her body parts SEPARATED, in strict side profile facing right, all at the SAME scale, laid out
in one row with generous empty space between them, no part touching another:
1. the head alone: face, glasses, top of the hair, ending with a short neck. No pigtails.
2. one low pigtail alone, with its pink ribbon bow at the top.
3. the torso alone, from the neck to the hips, in the pajama top, WITHOUT arms.
4. one arm alone, straight and hanging, from a rounded shoulder to the hand, in the pajama sleeve
   with its pink cuff.
5. one leg alone, straight, from a rounded top of the thigh to the foot, in the pajama trousers,
   with the pink bunny slipper.
The shoulder and the top of the thigh must be rounded (half-disc) so the parts can overlap when
rotated. Relative sizes (width x height): head 16x14, pigtail 5x7, torso 11x9, arm 4x8, leg 6x9.

Transparent background (or plain pure white), no shadows, no labels, no numbers, no text.
Landscape format, high resolution.
```

### celeste-parts-dress.png (phase 2)

```
Same girl, same style, same puppet sheet layout and same scale, but now wearing a pink floral dress
with a white collar and puffed sleeves, bare legs and pink clogs. Same 5 parts (head, one pigtail,
torso without arms, one straight arm, one straight leg), plus a 6th part: the flared skirt of the
dress alone (relative size 14x7). Parts separated, transparent background, no text.
```

### celeste-parts-jacket.png (phase 3)

```
Same girl, a bit older, same style, same puppet sheet layout and same scale, now wearing an open
denim jacket with rolled-up sleeves and golden buttons over a white t-shirt with small pink flowers,
pink shorts with cuffs, white socks and pink-and-white sneakers without any logo. Her hair is now in
a ponytail: replace the pigtail part with a ponytail alone, with its pink scrunchie at the top
(relative size 7x11). The head has no ponytail attached. Parts separated, transparent background,
no text.
```

### Si les pièces ne sortent pas proprement séparées

```
Same girl, same style and pajamas, full body, strict side profile facing right, standing with her
arms held slightly away from her body and her legs slightly apart, so that the arms and legs do not
overlap the torso. Transparent background, no shadow, no text.
```

Je découpe alors les pièces moi-même en redessinant les parties cachées.
