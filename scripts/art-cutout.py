"""Détoure une illustration fournie sur fond blanc (personnages, D-123).

Usage : python3 scripts/art-cutout.py entrée.png sortie.png [--height 900] [--seed x,y ...]
        [--keep x,y ...] [--halo 0.3]

- Le fond : le blanc relié aux bords de l'image.
- --seed : un point d'un blanc enfermé à retirer aussi (entre les jambes, sous un bras), en px de
  l'image d'entrée.
- --keep : un point clair à garder malgré tout (des dents tout contre le profil), en px de l'entrée.
- --halo : fraction du haut de la silhouette (les cheveux) où le liseré clair laissé par le
  générateur est rongé ; le bas (semelles blanches) est épargné.
- Bord adouci, image recadrée sur le personnage puis ramenée à --height px de haut.

Dépendances (hors du jeu, outil ponctuel) : pip install pillow numpy scipy
"""

import argparse

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("src")
    parser.add_argument("dst")
    parser.add_argument("--height", type=int, default=900)
    parser.add_argument("--seed", action="append", default=[])
    parser.add_argument("--halo", type=float, default=0.3)
    parser.add_argument("--keep", action="append", default=[])
    args = parser.parse_args()

    rgb = np.asarray(Image.open(args.src).convert("RGB")).astype(np.int16)
    lo = rgb.min(axis=2)
    spread = rgb.max(axis=2) - lo
    near_white = (lo > 222) & (spread < 30)
    light = (lo > 190) & (spread < 45)

    labels, _ = ndimage.label(near_white)
    border = np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    keep = set(int(v) for v in border if v)
    for seed in args.seed:
        x, y = (int(v) for v in seed.split(","))
        if labels[y, x]:
            keep.add(int(labels[y, x]))
    background = np.isin(labels, list(keep))

    # Liseré clair autour des cheveux : grignoté depuis le fond, dans le haut seulement.
    figure_rows = np.where(~background.all(axis=1))[0]
    top = figure_rows[0]
    limit = top + int((figure_rows[-1] - top) * args.halo)
    zone = np.zeros_like(background)
    zone[:limit] = True
    for _ in range(8):
        grown = ndimage.binary_dilation(background) & light & zone
        if not (grown & ~background).any():
            break
        background |= grown
    # Poches claires enfermées par des mèches fines, tout contre le bord et entourées de cheveux
    # (sombres) : pas le blanc des yeux ni les dents, bordés de peau.
    distance = ndimage.distance_transform_edt(~background)
    pockets, _ = ndimage.label(light & zone & ~background)
    kept = [tuple(int(v) for v in point.split(",")) for point in args.keep]
    for index, box in enumerate(ndimage.find_objects(pockets), start=1):
        pocket = pockets[box] == index
        if distance[box][pocket].min() > 4:
            continue
        y0, x0 = max(box[0].start - 3, 0), max(box[1].start - 3, 0)
        area = (slice(y0, box[0].stop + 3), slice(x0, box[1].stop + 3))
        inside = pockets[area] == index
        ring = ndimage.binary_dilation(inside, iterations=2) & ~inside & ~background[area]
        if ring.any() and lo[area][ring].mean() < 120:
            if not any((pockets[y - 4 : y + 5, x - 4 : x + 5] == index).any() for x, y in kept):
                background[area] |= inside

    alpha = Image.fromarray(np.where(background, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    image = Image.open(args.src).convert("RGB")
    image.putalpha(alpha)
    image = image.crop(image.getbbox())
    w, h = image.size
    image = image.resize((round(w * args.height / h), args.height), Image.LANCZOS)
    image.save(args.dst, optimize=True)


if __name__ == "__main__":
    main()
