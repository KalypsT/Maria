"""Fabrique la jaquette de Maria pour DomoThib Games (G1, D-193).

Usage : python3 scripts/make-jaquette.py domothib/jaquette.webp

La chambre la nuit (le film de la fin), Céleste dans la lumière de la porte et MARIA écrit comme le
titre (Gaegu, une couleur de crayon par lettre, `style.css`), sur un halo de papier pour rester
lisible sur le fond sombre. 640 × 360 (16:9), WebP : le contrat de DomoThib demande 300 Ko au plus.

Dépendances (hors du jeu, outil ponctuel) : pip install pillow numpy
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BACKGROUND = ROOT / "public/art/film/room-night.webp"
CELESTE = ROOT / "public/art/celeste.png"
TITLE_FONT = ROOT / "src/assets/fonts/gaegu-bold-caps.woff2"
SIZE = (640, 360)
TITLE = "MARIA"
# Les crayons du titre (--crayon-* de style.css), l'inclinaison et le décalage de chaque lettre.
CRAYONS = [(217, 120, 143), (79, 111, 143), (226, 180, 74), (111, 154, 91), (154, 111, 176)]
TILTS = [-6, 4, -3, 5, -4]
OFFSETS = [-4, 4, -3, 4, -3]
PAPER = (243, 234, 215)
LETTER_SIZE = 104
LETTER_GAP = 4
TITLE_CENTER = (452, 92)
# Céleste debout sur le plancher, dans le faisceau de lumière.
CELESTE_HEIGHT = 196
CELESTE_FOOT = (196, 338)


def title_layer() -> Image.Image:
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    font = ImageFont.truetype(str(TITLE_FONT), LETTER_SIZE)
    widths = [font.getbbox(c)[2] - font.getbbox(c)[0] for c in TITLE]
    x = TITLE_CENTER[0] - (sum(widths) + LETTER_GAP * (len(TITLE) - 1)) / 2
    size = LETTER_SIZE
    for i, letter in enumerate(TITLE):
        tile = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
        box = font.getbbox(letter)
        position = (size - (box[0] + box[2]) / 2, size - (box[1] + box[3]) / 2)
        ImageDraw.Draw(tile).text(
            position,
            letter,
            font=font,
            fill=CRAYONS[i] + (255,),
            stroke_width=5,
            stroke_fill=PAPER + (255,),
        )
        tile = tile.filter(ImageFilter.GaussianBlur(0.5)).rotate(TILTS[i], resample=Image.BICUBIC)
        center_x = x + widths[i] / 2
        center_y = TITLE_CENTER[1] + OFFSETS[i]
        layer.alpha_composite(tile, (round(center_x - size), round(center_y - size)))
        x += widths[i] + LETTER_GAP
    # Le halo : la forme du titre élargie et floutée, couleur papier.
    alpha = np.asarray(layer)[..., 3]
    halo = Image.fromarray(alpha).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(10))
    glow = Image.new("RGBA", SIZE, PAPER + (0,))
    glow.putalpha(halo.point(lambda v: round(v * 0.4)))
    glow.alpha_composite(layer)
    return glow


def main() -> None:
    out = Path(sys.argv[1])
    background = Image.open(BACKGROUND).convert("RGB").resize(SIZE, Image.LANCZOS)
    image = ImageEnhance.Brightness(background).enhance(1.15).convert("RGBA")
    celeste = Image.open(CELESTE).convert("RGBA")
    width = round(celeste.width * CELESTE_HEIGHT / celeste.height)
    celeste = celeste.resize((width, CELESTE_HEIGHT), Image.LANCZOS)
    image.alpha_composite(celeste, (CELESTE_FOOT[0] - width // 2, CELESTE_FOOT[1] - CELESTE_HEIGHT))
    image.alpha_composite(title_layer())
    out.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(out, "WEBP", quality=82, method=6)
    print(out, image.size, out.stat().st_size, "octets")


if __name__ == "__main__":
    main()
