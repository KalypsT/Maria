"""Prépare les images de l'intro (D-185) dans public/art/intro/.

Usage : python3 scripts/make-intro-art.py (tout) ; python3 scripts/make-intro-art.py morning (le
décor du contrechamp de la fin seulement, D-190) ; python3 scripts/make-intro-art.py film (les décors
du film des années, D-190)

Sources :
- `scripts/intro/room-evening.webp` : la chambre du premier soir, capturée dans le jeu (build de
  production, navigateur 1600 × 900 à l'échelle 2, donc 3200 × 1800 ; « Nouvelle partie », la vue
  large de la chambre). Si la chambre change, refaire la capture et relancer ce script ;
- `scripts/intro/room-morning.webp` (D-190, le contrechamp du film de la fin) : la même chambre, le
  même cadre, le matin de la fin (debug « Rejouer la fin : le matin », dev, 1600 × 900 à l'échelle
  2, les outils de debug et l'étincelle masqués) ; Céleste et Maria sur le lit, hors du cadrage ;
- `scripts/film/room-<âge>.webp` (D-190, le film des années) : la chambre à chaque âge, capturée par
  `scripts/film/capture-room.js` (les PNG qu'il écrit sont convertis ici en WebP, puis effacés) ;
- les illustrations de `public/art/` (Céleste, la ville-jouet, les objets d'enfance).

Tout ce qui coûte (flou, silhouettes, halos) est calculé ici, une fois : l'intro ne fait que
dessiner des images, sans filtre, pour rester fluide sur téléphone. Les tailles de sortie sont
juste suffisantes : les décors flous ou sombres n'ont pas besoin de la pleine définition.

Dépendances (hors du jeu, outil ponctuel) : pip install pillow numpy
"""

import math
import os
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "public", "art")
OUT = os.path.join(ART, "intro")
ROOM = os.path.join(ROOT, "scripts", "intro", "room-evening.webp")
ROOM_MORNING = os.path.join(ROOT, "scripts", "intro", "room-morning.webp")

TEAL = (80, 225, 210)
# Marge des halos autour des silhouettes, en px de l'image source : `INTRO_RIM_PAD` (src/config/intro.ts).
RIM_PAD = 40


def save(img, name, quality=82):
    img.save(os.path.join(OUT, name), quality=quality, method=6)
    print(f"{name} {img.size[0]}×{img.size[1]} {os.path.getsize(os.path.join(OUT, name)) // 1024} Ko")


def art(name):
    return Image.open(os.path.join(ART, name)).convert("RGBA")


def clean_room():
    """La chambre sans les petites Céleste et Maria du jeu (l'intro pose les grandes)."""
    room = Image.open(ROOM).convert("RGB")
    # Céleste debout sur le lit : recouverte par le mur juste à sa gauche.
    room.paste(room.crop((880, 1150, 950, 1302)), (960, 1150))
    # Maria assise sur le tapis : idem, à la même hauteur.
    room.paste(room.crop((1455, 1550, 1525, 1621)), (1525, 1550))
    return room


def evening(room):
    """Plans 3 et 4 : le coin du tapis, flou (profondeur de champ), un peu assombri."""
    crop = room.crop((1150, 1060, 2350, 1735)).resize((1280, 720), Image.LANCZOS)
    crop = crop.filter(ImageFilter.GaussianBlur(2.6))
    save(ImageEnhance.Brightness(crop).enhance(0.82).convert("RGB"), "evening.webp")


def morning():
    """Le contrechamp de la fin (D-190) : le coin du tapis du plan 3, le matin, flou de même."""
    room = Image.open(ROOM_MORNING).convert("RGB")
    crop = room.crop((1150, 1060, 2350, 1735)).resize((1280, 720), Image.LANCZOS)
    crop = crop.filter(ImageFilter.GaussianBlur(2.6))
    save(ImageEnhance.Brightness(crop).enhance(0.96).convert("RGB"), "morning.webp")


FILM_SRC = os.path.join(ROOT, "scripts", "film")
FILM_OUT = os.path.join(ART, "film")
FILM_AGES = [
    "age7-day",
    "age7-night",
    "age9",
    "age12",
    "age13-night",
    "age15",
    "age18",
    "age18-night",
]


def film_sources():
    """Les captures PNG de `capture-room.js` deviennent des sources WebP (plus légères)."""
    for name in FILM_AGES:
        png = os.path.join(FILM_SRC, f"room-{name}.png")
        if os.path.exists(png):
            Image.open(png).convert("RGB").save(
                os.path.join(FILM_SRC, f"room-{name}.webp"), quality=90, method=6
            )
            os.remove(png)


def film_save(img, name, quality=84):
    img.save(os.path.join(FILM_OUT, name), quality=quality, method=6)
    print(f"film/{name} {img.size[0]}×{img.size[1]} {os.path.getsize(os.path.join(FILM_OUT, name)) // 1024} Ko")


def film():
    """Le film des années (D-190) : la chambre à chaque âge, Maria de près, le mur de la toise."""
    os.makedirs(FILM_OUT, exist_ok=True)
    film_sources()
    rooms = {}
    for name in FILM_AGES:
        room = Image.open(os.path.join(FILM_SRC, f"room-{name}.webp")).convert("RGB")
        rooms[name] = room
        film_save(room.resize((1920, 1080), Image.LANCZOS), f"room-{name}.webp")
    # Maria de près, sur son étagère : le surmeuble flou (profondeur de champ) ; l'illustration de
    # Maria est posée dessus par le film, sur la planche.
    close = rooms["age18"].crop((1900, 760, 2500, 1098)).resize((1920, 1080), Image.LANCZOS)
    film_save(close.filter(ImageFilter.GaussianBlur(7)), "maria-close.webp")
    # Le mur derrière la toise, très flou : la toise est dessinée par le film.
    wall = rooms["age7-day"].crop((2250, 180, 2850, 518)).resize((1920, 1080), Image.LANCZOS)
    film_save(wall.filter(ImageFilter.GaussianBlur(30)), "toise-wall.webp")
    phone()
    silhouettes()


def silhouettes():
    """Céleste à 9, 12, 15 et 18 ans (D-190, PR 7), en attendant les illustrations : une silhouette
    pleine, tirée de celle de la phase 4 (sans visage : on ne fixe pas son allure). Jamais
    par-dessus une illustration fournie."""
    src = art("celeste-tee.png")
    color = (64, 54, 82, 255)
    shade = Image.new("RGBA", src.size, color)
    shade.putalpha(src.getchannel("A"))

    def save_once(img, name):
        path = os.path.join(FILM_OUT, name)
        if os.path.exists(path):
            print(f"film/{name} : déjà là, gardée")
            return
        img.save(path)
        print(f"film/{name} (silhouette provisoire)")

    save_once(shade, "celeste-9.png")
    save_once(shade, "celeste-15.png")
    save_once(shade.transpose(Image.FLIP_LEFT_RIGHT), "celeste-18.png")
    # Assise (12 ans, sur son lit) : le haut du corps, et les jambes repliées devant elle.
    top = shade.crop((0, 0, shade.width, int(shade.height * 0.6)))
    seated = Image.new("RGBA", (int(shade.width * 1.5), top.height + 60), (0, 0, 0, 0))
    seated.alpha_composite(top, (0, 0))
    ImageDraw.Draw(seated).rounded_rectangle(
        (shade.width * 0.2, top.height - 40, seated.width - 4, top.height + 56),
        radius=40,
        fill=color,
    )
    save_once(seated, "celeste-12.png")


def phone():
    """Un téléphone posé sur le bureau, à 15 ans (PLACEHOLDER) : coque rose, écran sombre."""
    w, h = 120, 220
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((4, 4, w - 4, h - 4), radius=22, fill=(232, 150, 178, 255))
    d.rounded_rectangle((14, 16, w - 14, h - 16), radius=12, fill=(44, 46, 66, 255))
    d.polygon([(22, 28), (58, 28), (22, 92)], fill=(90, 96, 128, 255))
    img.save(os.path.join(FILM_OUT, "phone.png"))


def cradle(room):
    """Plan 5 : le berceau sur le coffre, lumières éteintes."""
    crop = room.crop((1690, 1290, 2290, 1627)).resize((1600, 898), Image.LANCZOS)
    dark = ImageEnhance.Brightness(crop).enhance(0.42)
    night = Image.blend(dark, Image.new("RGB", dark.size, (18, 26, 64)), 0.25)
    save(night, "cradle.webp")


def strange(room):
    """Plans 6 et 7 : la chambre basculée, sombre et turquoise (comme les mondes étranges).

    L'éclairage de la capture (le faisceau de la lampe-tempête) est retiré en divisant par la
    luminosité locale très floue : il ne reste que les formes de la chambre.
    """
    size = (2048, 1152)
    grey = room.convert("L").resize(size, Image.LANCZOS)
    lum = np.asarray(grey).astype(float)
    local = np.asarray(grey.filter(ImageFilter.GaussianBlur(80))).astype(float)
    flat = np.clip(lum / (local + 1) * 0.5, 0, 1)
    v = np.clip((flat - 0.22) / 0.6, 0, 1) ** 1.5
    lo, hi = np.array((6, 14, 24)), np.array((50, 140, 146))
    rgb = (lo + (hi - lo) * v[..., None]).astype("uint8")
    save(Image.fromarray(rgb).filter(ImageFilter.GaussianBlur(1.2)), "strange.webp")


def rim_glow(alpha, pad, blur, gain):
    """Halo turquoise autour d'une silhouette (canal alpha), marge `pad` de chaque côté."""
    big = Image.new("L", (alpha.width + 2 * pad, alpha.height + 2 * pad), 0)
    big.paste(alpha, (pad, pad))
    glow = big.filter(ImageFilter.GaussianBlur(blur)).point(lambda p: min(255, int(p * gain)))
    layer = Image.new("RGBA", big.size, TEAL + (0,))
    layer.putalpha(glow)
    return layer


def waver(img, amplitude, period):
    """Déforme légèrement une image (ondulation horizontale) : l'objet se devine sans se lire."""
    a = np.asarray(img)
    out = np.zeros_like(a)
    h = a.shape[0]
    for y in range(h):
        shift = int(round(amplitude * math.sin(2 * math.pi * y / period)))
        out[y] = np.roll(a[y], shift, axis=0)
    return Image.fromarray(out)


def shadow(name, height, out_name):
    """Une ombre d'objet perdu (plan 6) : silhouette ondulée et floue, halo turquoise."""
    src = art(name)
    src = src.resize((round(src.width * height / src.height), height), Image.LANCZOS)
    pad = 24
    alpha = Image.new("L", (src.width + 2 * pad, src.height + 2 * pad), 0)
    alpha.paste(src.getchannel("A"), (pad, pad))
    alpha = waver(alpha, 3, 46).filter(ImageFilter.GaussianBlur(3))
    body = Image.new("RGBA", alpha.size, (12, 26, 36, 0))
    body.putalpha(alpha.point(lambda p: int(p * 0.92)))
    glow = rim_glow(alpha, 0, 10, 1.4)
    glow.alpha_composite(body)
    save(glow, out_name)


def toy_town():
    """La ville-jouet en ombre (plan 6) ; ses yeux sont dessinés par l'intro."""
    src = art("toy-town.png")
    a = src.getchannel("A")
    body = Image.new("RGBA", src.size, (6, 14, 22, 0))
    body.putalpha(a)
    glow = rim_glow(a, RIM_PAD, 9, 1.6)
    glow.alpha_composite(body, (RIM_PAD, RIM_PAD))
    save(glow, "toy-town.webp")


def celeste_rim():
    """Le halo derrière Céleste au bord du monde étrange (plan 7)."""
    src = art("celeste.png")
    save(rim_glow(src.getchannel("A"), RIM_PAD, 10, 1.7), "celeste-rim.webp")


def main():
    os.makedirs(OUT, exist_ok=True)
    if sys.argv[1:] == ["morning"]:
        # Seulement le décor du contrechamp (D-190), sans refaire ceux de l'intro.
        morning()
        return
    if sys.argv[1:] == ["film"]:
        # Seulement les décors du film des années (D-190).
        film()
        return
    room = clean_room()
    evening(room)
    cradle(room)
    strange(room)
    for name, height, out_name in [
        ("memory-slipper.webp", 150, "lost-slipper.webp"),
        ("memory-spoon.webp", 150, "lost-spoon.webp"),
        ("memory-rattle.webp", 190, "lost-rattle.webp"),
        ("memory-bottle.webp", 200, "lost-bottle.webp"),
        ("memory-bonnet.webp", 150, "lost-bonnet.webp"),
        ("memory-music-book.webp", 170, "lost-book.webp"),
    ]:
        shadow(name, height, out_name)
    toy_town()
    celeste_rim()
    morning()
    film()


if __name__ == "__main__":
    main()
