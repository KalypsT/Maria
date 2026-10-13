"""Fabrique les icônes du jeu à partir de l'image des lunettes (D-175).

Usage : python3 scripts/make-icons.py lunettes-de-face.jpg public/icons

L'image source (carrée, lunettes de face centrées sur le papier à carreaux) n'est pas dans le dépôt.
Sorties : icon-512 et icon-192 (image entière), icon-maskable-512 (réduite et prolongée en miroir :
Android découpe un rond, les lunettes restent dans la zone sûre), apple-touch-icon 180 et
favicon 64 (recadrées serrées : à petite taille, les lunettes doivent remplir l'icône).

Dépendances (hors du jeu, outil ponctuel) : pip install pillow numpy
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Part de l'image gardée pour les petites icônes (centrée) : les lunettes en touchent presque les bords.
TIGHT_CROP = 0.84
# Échelle de l'image dans l'icône maskable ; le reste est prolongé en miroir.
MASKABLE_SCALE = 0.86


def square(img: Image.Image) -> Image.Image:
    side = min(img.size)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    return img.crop((left, top, left + side, top + side))


def tight(img: Image.Image) -> Image.Image:
    side = round(img.width * TIGHT_CROP)
    margin = (img.width - side) // 2
    return img.crop((margin, margin, margin + side, margin + side))


def maskable(img: Image.Image, size: int) -> Image.Image:
    inner = round(size * MASKABLE_SCALE)
    small = np.asarray(img.resize((inner, inner), Image.LANCZOS))
    before = (size - inner) // 2
    after = size - inner - before
    padded = np.pad(small, ((before, after), (before, after), (0, 0)), mode="reflect")
    return Image.fromarray(padded)


def main() -> None:
    source, out = Path(sys.argv[1]), Path(sys.argv[2])
    img = square(Image.open(source).convert("RGB"))
    outputs = {
        "icon-512.png": img.resize((512, 512), Image.LANCZOS),
        "icon-192.png": img.resize((192, 192), Image.LANCZOS),
        "icon-maskable-512.png": maskable(img, 512),
        "apple-touch-icon.png": tight(img).resize((180, 180), Image.LANCZOS),
        "favicon.png": tight(img).resize((64, 64), Image.LANCZOS),
    }
    for name, icon in outputs.items():
        icon.save(out / name, optimize=True)
        print(name, icon.size)


if __name__ == "__main__":
    main()
