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

## Maman (conversation 2)

Référence : l'illustration d'origine de l'utilisateur (lunettes de soleil rondes, regard vers le
ciel). On en tire d'abord `mom-stand` (sans lunettes, regard droit, silhouette un peu plus ronde),
qui sert ensuite de référence à toutes les poses.

### mom-stand.png (joindre l'image d'origine)

```
Using the attached image as the strict reference, draw the SAME woman: same face, same long curly
dark-brown hair, same small earring, same pink V-neck t-shirt, same light-blue straight jeans, same
illustration style, same colors, same level of detail, same scale and framing (full body, same
height in the image, feet near the bottom).

Changes:
- no sunglasses: we see her kind brown eyes;
- she looks straight ahead (not up), gentle calm smile;
- a slightly fuller, curvier figure: a bit fuller bust and slightly rounder hips, natural and
  modest, family-friendly;
- her sneakers have a simple straight blue stripe instead of the wavy one (no brand marks).

Pose: standing relaxed, arms hanging naturally. Strict side profile facing right (we see only one
eye, one ear, the nose in silhouette), nothing cropped. Plain pure white background, no ground
shadow, no text, no other element. Portrait format, high resolution.
```

### Poses suivantes (joindre `mom-stand.png`)

Début de chaque message :

```
Using the attached image as the strict reference, draw the SAME woman: same face, same long curly
dark-brown hair, same earring, same figure, same pink V-neck t-shirt, same light-blue jeans, same
sneakers with a straight blue stripe, same style, same colors, same level of detail. Full body,
strict side profile facing right, nothing cropped. Plain pure white background, no ground shadow, no
text, no other element. Portrait format, high resolution.
```

| Fichier          | Fin du message                                                                                                                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mom-bed.png`    | `No sunglasses. Pose: sitting on the edge of a bed, knees bent, feet flat on the floor, leaning forward, front arm reaching forward at shoulder height with the hand gently curved, as if stroking a small child's hair, tender smile. Do not draw the bed: she sits on nothing.` |
| `mom-sofa.png`   | `No sunglasses. Pose: sitting on a sofa, knees bent, leaning back a little, reading an open blue hardcover book held in both hands at chest height, calm, eyes on the page. Do not draw the sofa: she sits on nothing.`                                                           |
| `mom-yard.png`   | `No sunglasses. Pose: standing, leaning slightly forward, front arm reaching forward and down with an open hand toward a small child, warm smile.`                                                                                                                                |
| `mom-quay.png`   | `No sunglasses. Pose: standing, front hand raised at head height waving goodbye, soft wistful smile.`                                                                                                                                                                             |
| `mom-garden.png` | `She wears round dark sunglasses (like in her first picture). Pose: standing, front arm raised high above her head pinning a small pink sock to a clothesline with a wooden clothespin, the other arm relaxed. Do not draw the clothesline.`                                      |
| `mom-bench.png`  | `She wears round dark sunglasses (like in her first picture). Pose: sitting on a bench, knees bent, feet on the floor, hands resting on her knees, face slightly raised to the sun, peaceful smile. Do not draw the bench: she sits on nothing.`                                  |

Si un meuble est dessiné malgré tout, ce n'est pas grave : je l'efface.

## Céleste en pièces détachées (une conversation par tenue)

Le jeu anime Céleste en faisant tourner des pièces séparées (papier découpé, D-29) : il faut une
planche de pièces par tenue. Chaque pièce est ensuite ramenée à sa boîte dans le jeu (largeur ×
hauteur) : **tête 16 × 14** (avec le cou), **couette 5 × 7** (ou **queue de cheval 7 × 11**),
**torse 11 × 9**, **bras 4 × 8**, **jambe 6 × 9**, **jupe 14 × 7** (robe). La tête reste grosse
(lisibilité à 85 px de haut sur téléphone) : je la mets à l'échelle, peu importe sa taille sur la
planche. Le même bras et la même jambe servent des deux côtés (le côté caché est assombri).

Référence à joindre : l'illustration de la tenue (`celeste.png`, `celeste-dress.png`,
`celeste-jacket.png`). La phase 4 reprend la planche de la veste.

### Début commun

```
Using the attached image as the strict reference for the character AND the style, create a
cut-out paper puppet sheet of this exact little girl: same face, same round pink glasses, same
freckles, same brown hair, same clothes, same colors, same picture-book illustration style and
level of detail.

Draw her body parts SEPARATED, each one alone, laid out on one row with generous empty space
between them, no part touching or overlapping another, all at the same scale, all in strict side
profile facing right:
```

### Pyjama (`celeste-parts-pyjama.png`, joindre `celeste.png`)

```
1. HEAD: the head alone with the face, the glasses, the ear and the hair (top and back of the
   head), ending at the bottom with a short neck stump. WITHOUT the pigtails.
2. PIGTAIL: one low pigtail alone, hanging down, with its pink ribbon bow at the top.
3. TORSO: the pajama top alone, from the base of the neck to the hips, with the collar and the
   pink piping, WITHOUT arms, without head, without legs.
4. ARM: one arm alone, perfectly straight and hanging down, from a rounded shoulder (half-disc) to
   the relaxed hand, in the pajama sleeve with its pink cuff.
5. LEG: one leg alone, perfectly straight, from a rounded top of the thigh (half-disc) to the foot,
   in the pajama trousers with the pink cuff, wearing the pink bunny slipper pointing right.

Plain pure white background, no shadows, no labels, no numbers, no text, no guide lines.
Landscape format, high resolution.
```

### Robe (`celeste-parts-dress.png`, joindre `celeste-dress.png`)

```
1. HEAD: the head alone with the face, the glasses, the ear and the hair, ending with a short
   neck stump. WITHOUT the pigtails.
2. PIGTAIL: one low pigtail alone, hanging down, with its pink ribbon bow at the top.
3. TORSO: the top of the dress alone (bodice with the white collar), from the base of the neck to
   the waist, WITHOUT arms and WITHOUT the skirt.
4. ARM: one arm alone, perfectly straight and hanging down, from a rounded puffed sleeve at the
   shoulder to the relaxed hand.
5. LEG: one bare leg alone, perfectly straight, from a rounded top of the thigh to the foot,
   wearing the pink clog pointing right.
6. SKIRT: the flared floral skirt of the dress alone, from the waist down to above the knees.

Plain pure white background, no shadows, no labels, no numbers, no text, no guide lines.
Landscape format, high resolution.
```

### Veste (`celeste-parts-jacket.png`, joindre `celeste-jacket.png`)

```
1. HEAD: the head alone with the face, the glasses, the ear and the hair, ending with a short
   neck stump. WITHOUT the ponytail.
2. PONYTAIL: the ponytail alone, hanging down, with its pink scrunchie at the top.
3. TORSO: the open denim jacket over the white t-shirt with small pink flowers, from the base of
   the neck to the hips, WITHOUT arms, without head, without legs.
4. ARM: one arm alone, perfectly straight and hanging down, from a rounded shoulder to the
   relaxed hand, in the denim sleeve rolled up at the forearm.
5. LEG: one leg alone, perfectly straight, from a rounded top of the thigh to the foot: the pink
   shorts leg with its cuff, the bare knee, the white sock and the pink-and-white sneaker (no
   logo) pointing right.

Plain pure white background, no shadows, no labels, no numbers, no text, no guide lines.
Landscape format, high resolution.
```

### Si la planche ne sort pas proprement

Une pièce par message, dans la même conversation (joindre l'illustration et la première planche
réussie s'il y en a une) :

```
Same girl, same style, same colors as the reference. Draw ONLY her [HEAD / PIGTAIL / TORSO / ARM /
LEG], alone, as described: [reprendre la ligne de la pièce]. Strict side profile facing right,
plain pure white background, no shadow, no text.
```

Dernier recours : Céleste entière de profil, bras un peu écartés du corps et jambes un peu
écartées ; je découpe les pièces moi-même (en redessinant les parties cachées).

## Le chat, la nounou, Eden (d'après photos)

Méthode : une conversation par personnage. Au premier message, joindre **la photo** (référence du
personnage) **et une illustration du jeu** (référence du style). La photo ne sert qu'à
l'apparence : on demande un personnage de livre illustré, pas un portrait réaliste. Ensuite, comme
pour les parents, chaque pose est demandée avec la première image validée en référence.

### Le chat (joindre la photo du chat et `celeste.png`)

`cat-sit.png` (référence) :

```
Using the first attached photo as the reference for the cat (same fur colors, same markings, same
eye color) and the second attached image as the strict reference for the style (same children's
picture-book illustration style, soft texture, thin warm outlines, same level of detail), draw this
cat as a picture-book character, not a realistic portrait.

Pose: sitting upright, strict side profile facing right, tail curled around its front paws, calm
and attentive, eyes open. Whole cat, nothing cropped. Plain pure white background, no ground
shadow, no text, no other element. Square format, high resolution.
```

`cat-sleep.png` (joindre `cat-sit.png`) :

```
Using the attached image as the strict reference, draw the SAME cat (same fur, same markings, same
style, same colors), now asleep: curled up in a round ball lying on its side, seen from the side,
head resting on its paws, eyes closed, tail wrapped around its body. Whole cat, nothing cropped.
Plain pure white background, no shadow, no text. Landscape format, high resolution.
```

### La nounou (joindre sa photo et `dad-stand.png`)

Dans le jeu, elle n'apparaît que dans le souvenir d'Eden, assise dans son fauteuil : le code la
rendra un peu passée et douce (souvenir), l'image peut être nette.

`nanny-sit.png` (référence) :

```
Using the first attached photo as the reference for the woman (same face shape, same hair, same
skin tone, same age) and the second attached image as the strict reference for the style (same
picture-book illustration style, same rendering and level of detail), draw her as a gentle,
kind nanny, a picture-book character, not a realistic portrait. Soft, warm, cosy clothes (a knitted
cardigan).

Pose: sitting in a cosy upholstered armchair, strict side profile facing right, head slightly
tilted down toward small children playing in front of her, a tender smile, both hands resting on
her knees holding a small pink knitting. Draw the armchair too, in side view. Full figure and
armchair, nothing cropped. Plain pure white background, no ground shadow, no text. Portrait format,
high resolution.
```

`nanny-look.png` (joindre `nanny-sit.png`) :

```
Using the attached image as the strict reference, draw the SAME woman in the SAME armchair, same
clothes, same style, same colors. Pose: still sitting, she turns her head to look ahead and points
forward with her front hand, arm outstretched, as if gently showing a child where to look; the other
hand rests on her knee. Strict side profile facing right, nothing cropped, plain pure white
background, no shadow, no text. Portrait format, high resolution.
```

### Eden (joindre sa photo et `celeste.png`)

Un tout-petit (2-3 ans) : blond, coupe au bol, pull jaune, salopette bleue, petites chaussures
marron (D-122). À l'échelle de Céleste toute petite.

`eden-sit.png` (référence) :

```
Using the first attached photo as the reference for the little boy (same face, same features) and
the second attached image as the strict reference for the style (same children's picture-book
illustration style, same rendering and level of detail), draw him as a picture-book character, not
a realistic portrait. A toddler, about 2 or 3 years old: blond hair with a bowl cut, mustard-yellow
sweater, blue dungarees, small brown shoes.

Pose: sitting on the floor, legs stretched forward, strict side profile facing right, holding a
small wooden toy cube in both hands, looking at it with a calm, happy face. Whole child, nothing
cropped. Plain pure white background, no ground shadow, no text. Square format, high resolution.
```

Poses suivantes (joindre `eden-sit.png`), début de chaque message :

```
Using the attached image as the strict reference, draw the SAME little boy: same face, same blond
bowl cut, same yellow sweater, same blue dungarees, same shoes, same style, same colors. Strict
side profile facing right, whole child, nothing cropped. Plain pure white background, no ground
shadow, no text. Square format, high resolution.
```

| Fichier          | Fin du message                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eden-cheer.png` | `Pose: sitting on the floor, legs stretched forward, both arms raised high in joy, big happy open-mouthed smile.`                                                       |
| `eden-laugh.png` | `Pose: standing, a bit wobbly like a toddler, laughing out loud with his eyes squeezed shut, hands near his chest, as if he has just been found playing hide-and-seek.` |

`eden-peek` (sa tête qui dépasse d'une cachette) : je la découpe dans `eden-laugh.png`, pas d'image
à faire.

## Phase suivante : les adultes du train et de l'école, les enfants, le chien (sans photo)

Pas de photo : le personnage vient de la description. Joindre **une illustration du jeu** comme
référence de style (`dad-stand.png` pour les adultes, `celeste.png` pour les enfants et le chien).
Une conversation par personnage ; la première image validée sert de référence pour ses autres poses.

### Début commun (première image d'un personnage)

```
Using the attached image as the strict reference for the style only (same picture-book
illustration style, same rendering, same level of detail, same proportions logic), draw a NEW
character, not the one in the reference:
```

### Fin commune

```
Strict side profile facing right (we see only one eye, one ear, the nose in silhouette), full
body, nothing cropped. Plain pure white background, no ground shadow, no text, no other element.
Portrait format, high resolution.
```

### Les adultes (joindre `dad-stand.png`)

| Fichier            | Description et pose (entre le début et la fin communs)                                                                                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teacher.png`      | `A kind schoolteacher in her forties: auburn hair gathered in a loose bun, a sage-green long-sleeved top, dark plum trousers, flat brown shoes. Pose: standing, holding a pink ring binder flat against her chest with both arms, head slightly tilted with a warm smile.`                                                            |
| `conductor.png`    | `A friendly train conductor in his fifties: short grey hair, a short grey beard, a navy-blue uniform cap with a small gold badge, a navy-blue uniform jacket and trousers, black shoes. Pose: standing, holding a small silver ticket punch in his front hand at waist height, benevolent smile.`                                     |
| `mother-baby.png`  | `A young mother with dark curly hair tied back and warm brown skin, a mustard-yellow sweater, plum trousers. Pose: sitting on a train seat (do not draw the seat: she sits on nothing), knees bent, gently rocking a baby wrapped in a cream blanket in her arms; the baby holds a small doll with a pink outfit. Tender, calm face.` |
| `sleeper-seat.png` | `A tired traveller in his thirties: short brown hair, a sage-green sweater, grey trousers, brown shoes. Pose: sitting on a train seat (do not draw the seat: he sits on nothing), asleep, head tilted forward on his chest, arms crossed, mouth slightly open.`                                                                       |

### Les enfants de la classe (joindre `celeste.png`)

Trois enfants de l'âge de Céleste (5-6 ans). Pour chacun : d'abord la référence debout, puis ses
poses avec cette référence jointe et ce début de message :

```
Using the attached image as the strict reference, draw the SAME child: same face, same hair, same
clothes, same style, same colors. Strict side profile facing right, whole child, nothing cropped.
Plain pure white background, no ground shadow, no text. High resolution. New pose:
```

**La camarade** (cheveux en deux macarons) :

| Fichier                | Description ou pose                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classmate.png`        | Première image : `A little girl, 5-6 years old, dark brown skin, black hair in two puffs on top of her head, a sunny-yellow t-shirt, blue trousers, red sneakers. Pose: standing, arms relaxed, cheerful face.` |
| `classmate-slid.png`   | `sitting on the floor just after sliding, leaning back on one hand, legs forward, laughing.`                                                                                                                    |
| `classmate-asleep.png` | `asleep, lying on her side under a striped blanket pulled up to her shoulders, head on a small white pillow, eyes closed. Landscape format.`                                                                    |
| `classmate-quay.png`   | `standing, wearing a small red backpack, one hand raised waving goodbye, happy.`                                                                                                                                |

**Le garçon à la casquette** :

| Fichier            | Description ou pose                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kid-cap.png`      | Première image : `A little boy, 5-6 years old, light skin, short brown hair under a green cap worn forward, a green t-shirt, dark navy trousers, cream sneakers. Pose: standing, arms relaxed.` |
| `kid-cap-sit.png`  | `sitting on a train bench (do not draw the bench), legs dangling, hands on the edge of the seat, curious face.`                                                                                 |
| `kid-cap-quay.png` | `standing, wearing a small blue backpack, arms relaxed, a little shy.`                                                                                                                          |

**La fille au carré** :

| Fichier            | Description ou pose                                                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kid-bob.png`      | Première image : `A little girl, 5-6 years old, fair skin, light-brown hair cut in a short bob with a fringe, a lilac-purple sweater, light-blue trousers, pink shoes. Pose: standing, arms relaxed.` |
| `kid-bob-sit.png`  | `sitting on a train bench (do not draw the bench), legs dangling, hands in her lap, turning her head slightly toward the viewer with a shy smile.`                                                    |
| `kid-asleep.png`   | `asleep, lying on her side under a flowered blanket pulled up to her shoulders, head on a small white pillow, eyes closed. Landscape format.`                                                         |
| `kid-bob-quay.png` | `standing, wearing a small yellow backpack, hands holding the straps.`                                                                                                                                |

Le groupe du quai (`kids-quay`) : je l'assemble à partir des trois images « quay ».

### Le chien du fourgon (joindre `celeste.png`)

```
Using the attached image as the strict reference for the style only (same picture-book
illustration style, same rendering and level of detail), draw a sweet medium-sized dog with short
tan-brown fur and darker floppy ears, asleep, curled up in a round ball lying on its side, seen
from the side, head resting on its front paws, eyes closed. Whole dog, nothing cropped, no crate.
Plain pure white background, no shadow, no text. Landscape format, high resolution.
```

Fichier : `dog-sleep.png`.

## Retouches après la première série

### Maman au canapé et sur le banc (sièges bas)

Le canapé ne fait que 2 tuiles de haut, le banc de l'aire de jeux 1 : avec les jambes pendantes,
maman traverserait le sol. Joindre `mom-stand.png`, début de message habituel de maman, puis :

| Fichier         | Fin du message                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mom-sofa.png`  | `No sunglasses. Pose: curled up comfortably on a sofa, knees drawn up, both feet tucked up on the cushion beside her (her feet do not touch the floor), reading an open blue hardcover book resting on her knees, calm. Do not draw the sofa: she sits on nothing.`                                                                                  |
| `mom-bench.png` | `She wears round dark sunglasses. Pose: sitting on a very low bench, like the edge of a sandbox, knees bent high, both feet flat on the ground just in front of her, hands resting on her knees, face slightly raised to the sun, peaceful smile. Strict side profile facing right (not three-quarter). Do not draw the bench: she sits on nothing.` |

### Céleste : pièces à refaire

Dans la conversation de la planche, joindre la planche et demander **une seule pièce par message** :

```
Using the attached sheet as the strict reference (same girl, same style, same colors, same scale),
redraw ONLY this part, alone, strict side profile facing right, plain pure white background, no
shadow, no text:
```

| Planche | Pièce | Fin du message                                                                                                                                                                                                             |
| ------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pyjama  | tête  | `the HEAD without any bun: the hair at the back of the head is smooth and ends at the nape, because the low pigtails are attached separately behind the ear. Face, glasses, ear and short neck stump unchanged.`           |
| pyjama  | torse | `the TORSO of the pajama top WITHOUT any arm and without any sleeve drawn on it: the shoulder is a smooth rounded edge, we see the side of the top from the armpit to the hem, with the collar and the pink piping.`       |
| pyjama  | jambe | `ONE single leg, not a pair: one straight pajama trouser leg from a rounded top of the thigh to the ankle, with the pink cuff, and ONE pink bunny slipper pointing right.`                                                 |
| robe    | jambe | `ONE single bare leg, not a pair: straight, from a rounded top of the thigh to the foot, with ONE pink clog pointing right.`                                                                                               |
| veste   | jambe | `ONE single bare leg, not a pair and without the shorts: straight, from a rounded top of the thigh to the foot, with a short white sock and ONE pink-and-white sneaker pointing right, with no logo and no swoosh at all.` |

Le short de la veste et la jupe de la robe deviennent des pièces de hanche, posées devant le haut
des jambes ; le haut de la robe est coupé à la taille (je m'en charge).

## Céleste, phase 4 (la tenue de la fin)

Référence : l'illustration de l'utilisateur (`celeste-tee`) : queue de cheval au chouchou rose, t-shirt
vert, jean bleu clair droit, baskets blanches à petites fleurs roses. Une conversation, l'illustration
jointe à chaque message.

### L'illustration de l'écran de départ, sans logo

```
Same image, strictly identical (same girl, same pose, same framing, same colors, same style), except
the sneakers: plain white sneakers with small pink flower prints and white laces, without any logo
or swoosh.
```

### Les pièces (une par message)

Début de chaque message :

```
Using the attached image as the strict reference (same girl, same style, same colors), draw ONLY
this part of her, alone, as a cut-out paper puppet piece, strict side profile facing right, plain
pure white background, no shadow, no text:
```

| Fichier            | Fin du message                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tee-head.png`     | `the HEAD WITHOUT the ponytail and without the scrunchie: the hair is pulled back smoothly toward the back of the head and stops there. Face, round pink glasses, freckles, ear, and a short neck stump.` |
| `tee-ponytail.png` | `the PONYTAIL alone, hanging down, with its pink scrunchie at the top.`                                                                                                                                   |
| `tee-torso.png`    | `the green t-shirt alone, from the base of the neck to the hips, WITHOUT arms and without any sleeve drawn on it: the shoulder is a smooth rounded edge (like a sleeveless vest shape).`                  |
| `tee-arm.png`      | `ONE arm alone, perfectly straight and hanging down, from a rounded shoulder in the short green sleeve to the relaxed hand.`                                                                              |
| `tee-leg.png`      | `ONE single leg, not a pair: one straight light-blue jeans leg from a rounded top of the thigh to the ankle, with ONE white sneaker with small pink flowers pointing right, no logo.`                     |

Si ChatGPT redessine une paire de jambes : `Only ONE leg. A single leg alone, as if cut from the body
at the hip.` Si une manche reste sur le torse : `No arm, no sleeve, no hand on the torso.`
