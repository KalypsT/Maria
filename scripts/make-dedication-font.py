"""Fabrique la police de la dédicace de l'écran de fin (D-183) : Gaegu Bold, réduite au latin.

Usage : python3 scripts/make-dedication-font.py Gaegu-Bold.ttf src/assets/fonts/gaegu-bold-latin

Gaegu Bold (OFL, `src/assets/fonts/Gaegu-OFL.txt`) vient de github.com/google/fonts
(ofl/gaegu/Gaegu-Bold.ttf) ; elle n'a que l'ASCII. Le « é » de Céleste y est ajouté dans le même
trait : le « e » de la police, plus son apostrophe droite, tournée et réduite en accent aigu.
Sorties : <sortie>.woff2 (dans le jeu) et <sortie>.ttf (pour un aperçu, à ne pas garder).

Dépendances (hors du jeu, outil ponctuel) : pip install fonttools brotli
"""

import math
import sys

from fontTools import subset
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

src, out = sys.argv[1], sys.argv[2]
font = TTFont(src)
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()
e_name = cmap[ord("e")]
tick_name = cmap[ord("'")]

pen = TTGlyphPen(glyph_set)
glyph_set[e_name].draw(pen)

# L'accent : l'apostrophe droite (x 105–211, y 465–692), tournée de 38° dans le sens des aiguilles
# (le haut part à droite), réduite, posée au-dessus du « e » (x 55–422, haut à 366).
angle = math.radians(38)
scale = 0.62
cos, sin = math.cos(angle), math.sin(angle)
cx, cy = 158, 578
rx, ry = scale * (cos * cx + sin * cy), scale * (-sin * cx + cos * cy)
tx, ty = 262 - rx, 472 - ry
glyph_set[tick_name].draw(TransformPen(pen, (scale * cos, -scale * sin, scale * sin, scale * cos, tx, ty)))

glyph = pen.glyph()
name = "eacute"
font["glyf"][name] = glyph  # ajoute aussi le glyphe à l'ordre des glyphes (liste partagée)
if name not in font.getGlyphOrder():
    font.setGlyphOrder(font.getGlyphOrder() + [name])
font["hmtx"][name] = font["hmtx"][e_name]
for table in font["cmap"].tables:
    if table.isUnicode():
        table.cmap[0xE9] = name
glyph.recalcBounds(font["glyf"])

options = subset.Options()
options.layout_features = ["*"]
options.name_IDs = ["*"]
options.notdef_outline = True
sub = subset.Subsetter(options)
sub.populate(unicodes=list(range(0x20, 0x7F)) + [0xE9, 0x2019])
sub.subset(font)
font.save(out + ".ttf")
font.flavor = "woff2"
font.save(out + ".woff2")
