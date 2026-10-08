"""Compose les pièces illustrées de Céleste (papier découpé, D-29, D-147).

Usage : python3 scripts/celeste-parts.py dossier-des-pièces public/art/celeste

Chaque pièce détourée (`scripts/art-cutout.py`) est posée dans le cadre que la marionnette attend
(`CELESTE_PARTS`, px logiques), son point d'articulation sur l'origine du cadre, à 40 px par px
logique. La marionnette étire l'image sur le cadre : le rapport largeur / hauteur est donc celui du
cadre. Les points d'articulation des images sources sont relevés à la main (PIÈCES ci-dessous).

Dépendances (hors du jeu, outil ponctuel) : pip install pillow
"""

import sys

from PIL import Image

UNIT = 40

# Cadre (largeur, hauteur) et origine, en px logiques : CELESTE_PARTS (src/scenes/art/celesteArt.ts).
FRAMES = {
    "head": ((16, 14), (7.5, 13.5)),
    "pigtail": ((5, 7), (2.5, 0.5)),
    "torso": ((11, 9), (5.5, 9)),
    "arm": ((4, 8), (2, 0.8)),
    "leg": ((6, 9), (2.5, 0.45)),
    "skirt": ((14, 7), (7, 1.5)),
    "ponytail": ((7, 11), (3.5, 1)),
}

# Par tenue et par pièce : fichier source, point d'articulation (px source), longueur de référence
# (px source) et sa longueur voulue (px logiques), point du cadre où tombe l'articulation ; en
# option, un recadrage de la source et un tassement horizontal.
#  - tête : le bas du cou, 0,4 px au-dessus de l'origine (il s'enfonce sous le col) ; hauteur 12,1 ;
#  - couette : le nœud ; du nœud à la pointe, 5 ;
#  - torse : le milieu de l'ourlet, sur l'origine ; hauteur 9 ;
#  - bras : le haut de l'épaule ; jusqu'au bout de la main, 7,2 (ARM_LENGTH) ;
#  - jambe : le haut de la cuisse ; jusqu'à la semelle, 8,4 ;
#  - jupe ou short : le haut de la ceinture, en haut du cadre (la taille, 1,5 au-dessus de la hanche).
PIECES = {
    "pyjama": {
        "head": ("pj-head-cut.png", (328, 597), 597, 12.1, (7.5, 13.1)),
        "pigtail": ("pyjama-p1.png", (100, 35), 256, 5.0, (2.5, 0.5)),
        "torso": ("pj-torso.png", (172, 600), 600, 9.0, (5.5, 9.0)),
        "arm": ("pyjama-p3.png", (58, 25), 501, 7.2, (2.0, 0.8)),
        "leg": ("pj-leg.png", (95, 25), 575, 8.4, (2.5, 0.45)),
    },
    # Robe : le haut (presque de face, tassé de 35 %) s'arrête à la taille, 1,5 px au-dessus de la
    # hanche, où commence la jupe ;
    # l'emmanchure là où sont les épaules du pyjama (longueur de référence : de l'emmanchure à la
    # taille, 5,3).
    "dress": {
        "head": ("dhead-c.png", (282, 496), 496, 12.1, (7.5, 13.1)),
        "pigtail": ("dress-pig.png", (127, 47), 353, 5.0, (2.5, 0.5)),
        "torso": ("dress-p2.png", (110, 293), 116, 5.3, (5.5, 9.0), (0, 70, 313, 272), 0.65),
        "arm": ("dress-p3.png", (68, 21), 454, 7.2, (2.0, 0.8)),
        "leg": ("dress-leg.png", (85, 20), 577, 8.4, (2.5, 0.45)),
        "skirt": ("dress-p5.png", (230, 15), 431, 5.0, (7.0, 0.2)),
    },
    # Veste (phases 3 et 4) : dessinée de trois quarts, tassée de 20 % en largeur ; le short sert de
    # pièce de hanche (comme la jupe), de la taille au revers.
    "jacket": {
        "head": ("jhead-c.png", (241, 496), 496, 12.1, (7.5, 13.1)),
        "ponytail": ("jacket-pony.png", (150, 30), 420, 6.0, (3.5, 1.0)),
        "torso": ("jacket-p2.png", (86, 470), 355, 6.8, (5.5, 9.0), (0, 50, 343, 484), 0.8),
        "arm": ("jacket-p3.png", (69, 23), 527, 7.2, (2.0, 0.8)),
        "leg": ("jacket-leg.png", (84, 20), 577, 8.4, (2.5, 0.45)),
        "skirt": ("jacket-p4.png", (122, 10), 216, 3.2, (7.0, 0.15), (0, 0, 246, 226)),
    },
    # Phase 4, la tenue de la fin (D-149) : t-shirt (le trou de l'emmanchure rebouché), de l'épaule
    # à l'ourlet 6,4 ; le jean jusqu'à la basket, une seule jambe.
    "tee": {
        "head": ("tee-head.png", (316, 597), 597, 12.1, (7.5, 13.1)),
        "ponytail": ("tee-pony.png", (165, 40), 460, 6.0, (3.5, 1.0)),
        "torso": ("tee-torso.png", (132, 597), 398, 6.4, (5.5, 9.0)),
        "arm": ("tee-arm.png", (74, 20), 578, 7.2, (2.0, 0.8)),
        "leg": ("tee-leg.png", (75, 20), 578, 8.4, (2.5, 0.45)),
    },
}


def main() -> None:
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    for outfit, parts in PIECES.items():
        for part, spec in parts.items():
            file, (px, py), ref, length, (fx, fy) = spec[:5]
            crop = spec[5] if len(spec) > 5 else None
            squash = spec[6] if len(spec) > 6 else 1.0
            (w, h), _ = FRAMES[part]
            image = Image.open(f"{src_dir}/{file}").convert("RGBA")
            if crop:
                # Recadrage (x0, y0, x1, y1) : les points d'articulation restent ceux de l'image entière.
                image = image.crop(crop)
                px, py = px - crop[0], py - crop[1]
            scale = length * UNIT / ref
            image = image.resize(
                (round(image.width * scale * squash), round(image.height * scale)), Image.LANCZOS
            )
            canvas = Image.new("RGBA", (w * UNIT, h * UNIT))
            # Ce qui dépasse du cadre est coupé (les décalages négatifs sont permis).
            canvas.paste(
                image,
                (round(fx * UNIT - px * scale * squash), round(fy * UNIT - py * scale)),
                image,
            )
            canvas.save(f"{out_dir}/{outfit}-{part}.png", optimize=True)


if __name__ == "__main__":
    main()
