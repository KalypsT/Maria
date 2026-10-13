"""Fabrique les icônes du jeu à partir de l'image des lunettes (D-175).

Usage : python3 scripts/make-icons.py lunettes-de-face.jpg public/icons

L'image source (carrée, lunettes de face centrées sur le papier à carreaux) n'est pas dans le dépôt.
Les grandes icônes portent « MARIA » sous les lunettes, écrit comme le titre (Gaegu, une couleur de
crayon par lettre, `style.css`) ; les lunettes remontent pour lui faire de la place.
Sorties : icon-512 et icon-192 (image entière), icon-maskable-512 (réduite et prolongée en miroir :
Android découpe un rond, tout reste dans la zone sûre), apple-touch-icon 180 (recadrée serrée) et
favicon 64 (lunettes seules, recadrées serrées : à petite taille, le nom ne se lit plus).

Dépendances (hors du jeu, outil ponctuel) : pip install pillow numpy
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Part de l'image gardée pour les petites icônes (centrée) : les lunettes en touchent presque les bords.
TIGHT_CROP = 0.84
# Échelle de l'image dans l'icône maskable ; le reste est prolongé en miroir.
MASKABLE_SCALE = 0.86

TITLE_FONT = Path(__file__).resolve().parent.parent / "src/assets/fonts/gaegu-bold-caps.woff2"
TITLE = "MARIA"
# Les crayons du titre (--crayon-* de style.css), l'inclinaison et le décalage de chaque lettre.
CRAYONS = [(217, 120, 143), (79, 111, 143), (226, 180, 74), (111, 154, 91), (154, 111, 176)]
TILTS = [-6, 4, -3, 5, -4]
OFFSETS = [-0.012, 0.012, -0.008, 0.012, -0.008]
# En part de la largeur : remontée des lunettes, taille, espacement et hauteur du nom.
LIFT = 0.10
LETTER_SIZE = 0.25
LETTER_GAP = 0.012
TITLE_Y = 0.73


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


def with_title(img: Image.Image) -> Image.Image:
    width = img.width
    lift = round(width * LIFT)
    pixels = np.asarray(img)
    lifted = np.pad(pixels[lift:], ((0, lift), (0, 0), (0, 0)), mode="reflect")
    out = Image.fromarray(lifted).convert("RGBA")
    size = round(width * LETTER_SIZE)
    font = ImageFont.truetype(str(TITLE_FONT), size)
    widths = [font.getbbox(c)[2] - font.getbbox(c)[0] for c in TITLE]
    gap = round(width * LETTER_GAP)
    x = (width - sum(widths) - gap * (len(TITLE) - 1)) / 2
    rng = np.random.default_rng(3)
    for i, letter in enumerate(TITLE):
        tile = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
        box = font.getbbox(letter)
        position = (size - (box[0] + box[2]) / 2, size - (box[1] + box[3]) / 2)
        ImageDraw.Draw(tile).text(position, letter, font=font, fill=CRAYONS[i] + (255,))
        # Le grain du crayon : le trait un peu troué, puis adouci.
        rgba = np.asarray(tile).copy()
        grain = np.clip(0.55 + rng.random(rgba.shape[:2]) * 0.6, 0, 1)
        rgba[..., 3] = (rgba[..., 3] * grain).astype(np.uint8)
        tile = Image.fromarray(rgba).filter(ImageFilter.GaussianBlur(0.6))
        tile = tile.rotate(TILTS[i], resample=Image.BICUBIC)
        center_x = x + widths[i] / 2
        center_y = width * (TITLE_Y + OFFSETS[i])
        out.alpha_composite(tile, (round(center_x - size), round(center_y - size)))
        x += widths[i] + gap
    return out.convert("RGB")


def main() -> None:
    source, out = Path(sys.argv[1]), Path(sys.argv[2])
    img = square(Image.open(source).convert("RGB"))
    titled = with_title(img)
    outputs = {
        "icon-512.png": titled.resize((512, 512), Image.LANCZOS),
        "icon-192.png": titled.resize((192, 192), Image.LANCZOS),
        "icon-maskable-512.png": maskable(titled, 512),
        "apple-touch-icon.png": tight(titled).resize((180, 180), Image.LANCZOS),
        "favicon.png": tight(img).resize((64, 64), Image.LANCZOS),
    }
    for name, icon in outputs.items():
        icon.save(out / name, optimize=True)
        print(name, icon.size)


if __name__ == "__main__":
    main()
