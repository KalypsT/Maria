"""Bruitages PROVISOIRES fabriqués par synthèse (D-186), en attendant les vrais sons.

Écrit des .wav bruts (44,1 kHz, mono) dans le dossier donné, nommés d'après les emplacements de
`src/config/sfx.ts` (`step-fabric-1.wav`…). Ils se préparent ensuite comme les vrais :

    python3 scripts/make-placeholder-sfx.py /tmp/sfx
    npm run audio:prepare -- --sfx /tmp/sfx/one-shot
    npm run audio:prepare -- --sfx --loop /tmp/sfx/loop

Un vrai son déposé sous le même nom remplace simplement le provisoire (liste dans
`docs/BRUITAGES.md`). Tirages au hasard fixes : le script refait toujours les mêmes sons.
Nécessite numpy.
"""

import sys
import wave
from pathlib import Path

import numpy as np

RATE = 44100
rng = np.random.default_rng(186)


# ---------- Outils ----------


def seconds(n: float) -> np.ndarray:
    return np.arange(int(n * RATE)) / RATE


def noise(dur: float) -> np.ndarray:
    return rng.uniform(-1, 1, int(dur * RATE))


def lowpass(x: np.ndarray, cutoff) -> np.ndarray:
    """Passe-bas à un pôle (deux passes) ; `cutoff` en Hz, fixe ou une courbe par échantillon."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / RATE)
    for _ in range(2):
        y = np.empty_like(x)
        acc = 0.0
        for i, v in enumerate(x):
            acc += a[i] * (v - acc)
            y[i] = acc
        x = y
    return x


def highpass(x: np.ndarray, cutoff) -> np.ndarray:
    return x - lowpass(x, cutoff)


def bandpass(x: np.ndarray, low, high) -> np.ndarray:
    return lowpass(highpass(x, low), high)


def sweep(f0: float, f1: float, dur: float, curve: float = 1.0) -> np.ndarray:
    """Une sinusoïde dont la fréquence glisse de f0 à f1."""
    t = seconds(dur)
    f = f0 + (f1 - f0) * (t / dur) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / RATE)


def env(dur: float, attack: float, decay: float) -> np.ndarray:
    """Attaque linéaire, puis déclin exponentiel (`decay` : constante de temps, s)."""
    t = seconds(dur)
    up = np.clip(t / max(attack, 1e-4), 0, 1)
    down = np.exp(-np.maximum(t - attack, 0) / decay)
    return up * down


def swell(dur: float, peak: float) -> np.ndarray:
    """Monte jusqu'à `peak` (part de la durée), puis redescend en douceur."""
    t = seconds(dur) / dur
    return np.where(t < peak, np.sin(np.pi / 2 * t / peak), np.cos(np.pi / 2 * (t - peak) / (1 - peak)))


def mix(*parts: np.ndarray) -> np.ndarray:
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def at(x: np.ndarray, delay: float) -> np.ndarray:
    return np.concatenate([np.zeros(int(delay * RATE)), x])


def tail(x: np.ndarray, silence: float = 0.05) -> np.ndarray:
    return np.concatenate([x, np.zeros(int(silence * RATE))])


# ---------- Les sons ----------


def step_fabric(k: int) -> np.ndarray:
    dur = 0.09 + 0.015 * k
    body = lowpass(noise(dur), 700 + 120 * k) * env(dur, 0.006, 0.025)
    thump = sweep(150 - 8 * k, 90, dur) * env(dur, 0.003, 0.02) * 0.6
    return tail(mix(body * 2.5, thump))


def step_metal(k: int) -> np.ndarray:
    dur = 0.25
    base = 1500 + 170 * k
    ring = sum(
        np.sin(2 * np.pi * base * r * seconds(dur)) * env(dur, 0.001, d) * g
        for r, g, d in ((1.0, 1.0, 0.06), (1.73, 0.6, 0.04), (2.61, 0.4, 0.025))
    )
    click = highpass(noise(0.012), 2000) * env(0.012, 0.0005, 0.003)
    thump = lowpass(noise(0.05), 500) * env(0.05, 0.002, 0.012) * 1.5
    return tail(mix(ring * 0.35, click, thump))


def land_big(k: int) -> np.ndarray:
    dur = 0.32
    thump = sweep(120 - 10 * k, 42, dur, 0.6) * env(dur, 0.004, 0.09)
    body = lowpass(noise(0.2), 400) * env(0.2, 0.003, 0.04) * 2
    cloth = bandpass(noise(0.18), 800, 3000) * env(0.18, 0.01, 0.05) * 0.4
    return tail(mix(thump, body, at(cloth, 0.02)))


def ledge_grab(k: int) -> np.ndarray:
    slap = bandpass(noise(0.06), 900 + 200 * k, 3500) * env(0.06, 0.001, 0.012) * 1.6
    grip = lowpass(noise(0.08), 600) * env(0.08, 0.004, 0.02)
    thump = sweep(220, 140, 0.07) * env(0.07, 0.002, 0.018) * 0.5
    return tail(mix(slap, grip, thump))


def whoosh(dur: float, f0: float, f1: float, peak: float = 0.4) -> np.ndarray:
    t = seconds(dur) / dur
    centre = f0 + (f1 - f0) * t
    x = bandpass(noise(dur), centre * 0.6, centre * 1.4)
    return x * swell(dur, peak)


def wall_jump(k: int) -> np.ndarray:
    push = lowpass(noise(0.05), 900) * env(0.05, 0.001, 0.012) * 1.5
    air = whoosh(0.2, 500 + 100 * k, 2200, 0.3) * 1.8
    return tail(mix(push, at(air, 0.01)))


def wall_slide() -> np.ndarray:
    dur = 2.0
    t = seconds(dur)
    flutter = 0.75 + 0.25 * np.sin(2 * np.pi * 7.5 * t) * np.sin(2 * np.pi * 0.5 * t)
    return bandpass(noise(dur), 700, 2600) * flutter


def slide(k: int) -> np.ndarray:
    dur = 0.38
    t = seconds(dur) / dur
    x = bandpass(noise(dur), 300, 2000 - 900 * t - 150 * k)
    return tail(x * env(dur, 0.02, 0.14) * 2)


def thought() -> np.ndarray:
    dur = 0.18
    tone = sweep(780, 1180, dur, 0.5) * env(dur, 0.025, 0.05)
    octave = sweep(1560, 2360, dur, 0.5) * env(dur, 0.025, 0.03) * 0.15
    return tail(mix(tone, octave))


def bell(freq: float, dur: float, decay: float) -> np.ndarray:
    t = seconds(dur)
    partials = ((1.0, 1.0, 1.0), (2.76, 0.25, 0.4), (5.4, 0.1, 0.18))
    return sum(np.sin(2 * np.pi * freq * r * t) * g * env(dur, 0.002, decay * d) for r, g, d in partials)


def hint() -> np.ndarray:
    return tail(mix(bell(1318.5, 1.2, 0.35), at(bell(1975.5, 1.0, 0.3) * 0.6, 0.11)))


def door() -> np.ndarray:
    latch = mix(
        highpass(noise(0.015), 1500) * env(0.015, 0.0005, 0.003),
        at(bandpass(noise(0.03), 800, 3000) * env(0.03, 0.0005, 0.006), 0.05),
    )
    dur = 0.45
    t = seconds(dur)
    creak_f = 330 + 90 * np.sin(2 * np.pi * 1.3 * t)
    pulses = (np.sin(2 * np.pi * np.cumsum(creak_f) / RATE) > 0.6).astype(float)
    creak = bandpass(pulses, 300, 1600) * swell(dur, 0.5) * 0.35
    thump = lowpass(noise(0.12), 300) * env(0.12, 0.004, 0.03) * 1.5
    return tail(mix(latch, at(creak, 0.08), at(thump, 0.5)))


def page_flutter(dur: float) -> np.ndarray:
    t = seconds(dur)
    flicks = 0.6 + 0.4 * np.sin(2 * np.pi * 22 * t) ** 2
    return bandpass(noise(dur), 1200, 6000) * flicks


def map_open() -> np.ndarray:
    dur = 0.32
    return tail(page_flutter(dur) * swell(dur, 0.35) * 1.4)


def map_close() -> np.ndarray:
    dur = 0.18
    flutter = page_flutter(dur) * swell(dur, 0.3) * 1.2
    clap = lowpass(noise(0.08), 900) * env(0.08, 0.002, 0.02) * 1.6
    return tail(mix(flutter, at(clap, 0.15)))


def attack(k: int) -> np.ndarray:
    return tail(whoosh(0.16 + 0.02 * k, 700 + 150 * k, 2600, 0.45) * 2)


def hit(k: int) -> np.ndarray:
    dur = 0.12
    thud = sweep(190 - 15 * k, 95, dur) * env(dur, 0.002, 0.03)
    soft = lowpass(noise(0.04), 800) * env(0.04, 0.001, 0.008) * 0.8
    return tail(mix(thud, soft))


def enemy_scatter() -> np.ndarray:
    dur = 0.35
    puff = lowpass(noise(dur), 1200) * env(dur, 0.01, 0.08) * 1.5
    sparkle = mix(
        *(at(bell(f, 0.4, 0.12) * 0.25, d) for f, d in ((2349.3, 0.03), (1975.5, 0.09), (1568.0, 0.15)))
    )
    return tail(mix(puff, sparkle))


def rumble(dur: float, cutoff: float) -> np.ndarray:
    return lowpass(noise(dur), cutoff) * 6


def chase_wake() -> np.ndarray:
    dur = 1.4
    low = (sweep(46, 58, dur) + 0.5 * sweep(69, 87, dur)) * 0.6
    return tail(mix(low, rumble(dur, 160)) * swell(dur, 0.55))


def chase_rumble() -> np.ndarray:
    dur = 3.0
    t = seconds(dur)
    beat = 0.8 + 0.2 * np.sin(2 * np.pi * (2 / 3) * t)
    low = np.sin(2 * np.pi * 44 * t) * 0.4
    return mix(low, rumble(dur, 140)) * beat


def tunnel() -> np.ndarray:
    dur = 0.9
    t = seconds(dur) / dur
    cutoff = 300 + 1600 * np.sin(np.pi * t) ** 2
    x = lowpass(noise(dur), cutoff) * 3
    return tail(x * swell(dur, 0.3))


def wave_warn() -> np.ndarray:
    dur = 1.8
    t = seconds(dur) / dur
    surf = lowpass(noise(dur), 250 + 2800 * t**2) * 3
    low = sweep(55, 75, dur) * 0.4
    return tail(mix(surf, low) * swell(dur, 0.8))


def erase() -> np.ndarray:
    dur = 1.1
    cluster = sum(bell(f, dur, 0.45) for f in (1661.2, 1760.0, 2217.5)) * 0.35
    rising = cluster[::-1] * swell(dur, 0.85)
    breath = bandpass(noise(dur), 2000, 7000)[::-1] * env(dur, 0.002, 0.3)[::-1] * 0.5
    return tail(mix(rising, breath), 0.15)


def music_box(freq: float) -> np.ndarray:
    dur = 1.6
    t = seconds(dur)
    tine = np.sin(2 * np.pi * freq * t) * env(dur, 0.002, 0.55)
    over = np.sin(2 * np.pi * freq * 3.0 * t) * env(dur, 0.001, 0.12) * 0.18
    ping = np.sin(2 * np.pi * freq * 5.93 * t) * env(dur, 0.0005, 0.02) * 0.12
    click = highpass(noise(0.004), 4000) * 0.15
    return mix(tine, over, ping, click)


# ---------- Les emplacements ----------

ONE_SHOT = {
    **{f"step-fabric-{k + 1}": (lambda k=k: step_fabric(k)) for k in range(4)},
    **{f"step-metal-{k + 1}": (lambda k=k: step_metal(k)) for k in range(4)},
    **{f"land-big-{k + 1}": (lambda k=k: land_big(k)) for k in range(2)},
    **{f"ledge-grab-{k + 1}": (lambda k=k: ledge_grab(k)) for k in range(2)},
    **{f"wall-jump-{k + 1}": (lambda k=k: wall_jump(k)) for k in range(2)},
    **{f"slide-{k + 1}": (lambda k=k: slide(k)) for k in range(2)},
    **{f"attack-{k + 1}": (lambda k=k: attack(k)) for k in range(2)},
    **{f"hit-{k + 1}": (lambda k=k: hit(k)) for k in range(2)},
    "thought": thought,
    "hint": hint,
    "door": door,
    "map-open": map_open,
    "map-close": map_close,
    "enemy-scatter": enemy_scatter,
    "chase-wake": chase_wake,
    "tunnel": tunnel,
    "wave-warn": wave_warn,
    "erase": erase,
    # Une gamme douce (pentatonique de do), une note par variante : tirées au hasard, une mélodie.
    **{
        f"lullaby-{i + 1}": (lambda f=f: music_box(f))
        for i, f in enumerate((1046.5, 1174.7, 1318.5, 1568.0, 1760.0))
    },
}

LOOP = {
    "wall-slide": wall_slide,
    "chase-rumble": chase_rumble,
}


def write(path: Path, x: np.ndarray) -> None:
    x = x / max(1e-9, float(np.max(np.abs(x)))) * 0.8
    data = (x * 32767).astype("<i2").tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(data)


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage : python3 scripts/make-placeholder-sfx.py <dossier>")
        sys.exit(1)
    out = Path(sys.argv[1])
    for sub, sounds in (("one-shot", ONE_SHOT), ("loop", LOOP)):
        (out / sub).mkdir(parents=True, exist_ok=True)
        for name, make in sounds.items():
            write(out / sub / f"{name}.wav", make())
            print(f"{sub}/{name}.wav")


if __name__ == "__main__":
    main()
