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
}

# Par tenue et par pièce : fichier source, point d'articulation (px source), longueur de référence
# (px source) et sa longueur voulue (px logiques), point du cadre où tombe l'articulation.
#  - tête : le bas du cou, 0,4 px au-dessus de l'origine (il s'enfonce sous le col) ; hauteur 12,1 ;
#  - couette : le nœud ; du nœud à la pointe, 5 ;
#  - torse : le milieu de l'ourlet, sur l'origine ; hauteur 9 ;
#  - bras : le haut de l'épaule ; jusqu'au bout de la main, 7,2 (ARM_LENGTH) ;
#  - jambe : le haut de la cuisse ; jusqu'à la semelle, 8,4.
PIECES = {
    "pyjama": {
        "head": ("pj-head-cut.png", (328, 597), 597, 12.1, (7.5, 13.1)),
        "pigtail": ("pyjama-p1.png", (100, 35), 256, 5.0, (2.5, 0.5)),
        "torso": ("pj-torso.png", (172, 600), 600, 9.0, (5.5, 9.0)),
        "arm": ("pyjama-p3.png", (58, 25), 501, 7.2, (2.0, 0.8)),
        "leg": ("pj-leg.png", (95, 25), 575, 8.4, (2.5, 0.45)),
    },
}


def main() -> None:
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    for outfit, parts in PIECES.items():
        for part, (file, (px, py), ref, length, (fx, fy)) in parts.items():
            (w, h), _ = FRAMES[part]
            image = Image.open(f"{src_dir}/{file}").convert("RGBA")
            scale = length * UNIT / ref
            image = image.resize(
                (round(image.width * scale), round(image.height * scale)), Image.LANCZOS
            )
            canvas = Image.new("RGBA", (w * UNIT, h * UNIT))
            # Ce qui dépasse du cadre est coupé (les décalages négatifs sont permis).
            canvas.paste(
                image, (round(fx * UNIT - px * scale), round(fy * UNIT - py * scale)), image
            )
            canvas.save(f"{out_dir}/{outfit}-{part}.png", optimize=True)


if __name__ == "__main__":
    main()
