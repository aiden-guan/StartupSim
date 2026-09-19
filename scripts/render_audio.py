"""Render original Compounding audio drafts. Requires numpy.

All notes and textures here are original; no samples or commercial recordings are used.
Run: python3 scripts/render_audio.py
"""
from __future__ import annotations

import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1] / "public/assets/audio"
SR = 22050
RNG = np.random.default_rng(2411)


def tone(freq: float, length: float, *, shape: str = "sine", decay: float = 1.0) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    phase = 2 * np.pi * freq * t
    if shape == "triangle":
        wave = 2 / np.pi * np.arcsin(np.sin(phase))
    elif shape == "warm":
        wave = np.sin(phase) + 0.20 * np.sin(2 * phase) + 0.08 * np.sin(3 * phase)
    else:
        wave = np.sin(phase)
    return wave * np.exp(-t * decay)


def soften_noise(n: int, cutoff: int = 9) -> np.ndarray:
    raw = RNG.standard_normal(n)
    return np.convolve(raw, np.ones(cutoff) / cutoff, mode="same")


def place(track: np.ndarray, sound: np.ndarray, at: float, volume: float = 1.0) -> None:
    start = int(at * SR)
    end = min(len(track), start + len(sound))
    if end > start:
        track[start:end] += sound[: end - start] * volume


def envelope(sound: np.ndarray, attack: float = 0.005, release: float = 0.08) -> np.ndarray:
    sound = sound.copy()
    a = min(len(sound) // 2, int(attack * SR))
    r = min(len(sound) // 2, int(release * SR))
    if a:
        sound[:a] *= np.linspace(0, 1, a)
    if r:
        sound[-r:] *= np.linspace(1, 0, r)
    return sound


def encode(path: Path, sound: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sound = np.tanh(sound * 1.3) * 0.72
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes((sound * 32767).astype("<i2").tobytes())


def sfx() -> None:
    def out(name: str, sound: np.ndarray) -> None:
        encode(ROOT / "sfx" / f"{name}.wav", envelope(sound))

    # Deliberately quiet physical and pitched cues. Variants are supplied at playback.
    n = int(0.16 * SR)
    click = np.zeros(n)
    place(click, soften_noise(int(0.025 * SR), 3) * np.exp(-np.arange(int(0.025 * SR)) / (SR * 0.006)), 0, 0.45)
    place(click, tone(640, 0.055, decay=42), 0.002, 0.12)
    out("ui-click", click)

    select = np.zeros(int(0.19 * SR))
    place(select, tone(520, 0.11, shape="triangle", decay=22), 0, 0.24)
    place(select, tone(780, 0.09, decay=30), 0.032, 0.12)
    out("ui-select", select)

    stamp = np.zeros(int(0.38 * SR))
    thud = soften_noise(int(0.1 * SR), 17) * np.exp(-np.arange(int(0.1 * SR)) / (SR * 0.025))
    place(stamp, thud, 0.025, 1.5)
    place(stamp, tone(132, 0.18, decay=18), 0.025, 0.28)
    place(stamp, soften_noise(int(0.07 * SR), 3) * np.exp(-np.arange(int(0.07 * SR)) / (SR * 0.025)), 0.12, 0.22)
    out("paper-stamp", stamp)

    money = np.zeros(int(0.37 * SR))
    for f, at, v in [(740, 0.0, 0.20), (990, 0.065, 0.16), (1480, 0.145, 0.10)]:
        place(money, tone(f, 0.17, shape="triangle", decay=25), at, v)
    out("money-gain", money)
    spend = np.zeros(int(0.30 * SR))
    place(spend, soften_noise(int(0.1 * SR), 6) * np.exp(-np.arange(int(0.1 * SR)) / (SR * 0.03)), 0, 0.38)
    place(spend, tone(320, 0.23, decay=16), 0.015, 0.22)
    out("money-spend", spend)

    digital = np.zeros(int(0.36 * SR))
    for f, at in [(370, 0.0), (554, 0.07), (740, 0.15)]:
        place(digital, tone(f, 0.16, shape="warm", decay=16), at, 0.16)
    out("research", digital)

    ready = np.zeros(int(0.85 * SR))
    for f, at, v in [(392, 0.0, .19), (523, .14, .18), (659, .28, .18), (784, .42, .16)]:
        place(ready, tone(f, .40, shape="warm", decay=5), at, v)
    place(ready, soften_noise(int(.4 * SR), 23) * np.exp(-np.arange(int(.4 * SR)) / (SR * .15)), .06, .17)
    out("product-ready", ready)

    launch = np.zeros(int(1.15 * SR))
    for f, at, v in [(196, .0, .13), (294, .14, .14), (392, .27, .19), (587, .44, .18), (784, .62, .17)]:
        place(launch, tone(f, .5, shape="warm", decay=3.5), at, v)
    place(launch, soften_noise(int(.35 * SR), 9) * np.linspace(0, 1, int(.35 * SR)), 0, .12)
    out("launch", launch)

    capture = np.zeros(int(.50 * SR))
    for f, at in [(330, 0), (440, .09), (660, .17)]:
        place(capture, tone(f, .22, shape="triangle", decay=13), at, .19)
    out("market-capture", capture)

    rival = np.zeros(int(.38 * SR))
    place(rival, tone(180, .27, shape="warm", decay=9), 0, .20)
    place(rival, tone(155, .22, decay=13), .09, .16)
    out("market-rival", rival)

    notify = np.zeros(int(.39 * SR))
    place(notify, tone(554, .24, decay=11), 0, .20)
    place(notify, tone(659, .22, decay=12), .1, .13)
    out("notify", notify)

    warn = np.zeros(int(.63 * SR))
    place(warn, tone(196, .47, shape="warm", decay=6), 0, .20)
    place(warn, tone(185, .33, decay=10), .15, .12)
    out("crisis", warn)

    major = np.zeros(int(1.2 * SR))
    place(major, stamp, .03, .55)
    for f in (261.63, 329.63, 392.0):
        place(major, tone(f, .92, shape="warm", decay=2.6), .14, .15)
    place(major, tone(523.25, .56, decay=4), .4, .13)
    out("major", major)


def music() -> None:
    seconds = 16.0  # Eight bars at 120 BPM; all stems share the same timeline.
    size = int(seconds * SR)
    tracks = {name: np.zeros(size) for name in ("pad", "pulse", "bass", "lead", "market", "tension")}
    chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (261.63, 329.63, 392.0), (196.0, 246.94, 293.66),
              (220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66), (164.81, 196.0, 246.94)]
    roots = [110, 87.31, 130.81, 98, 110, 87.31, 98, 82.41]
    for bar, notes in enumerate(chords):
        at = bar * 2
        for f in notes:
            pad = tone(f, 2.0, shape="warm", decay=.28) + .28 * tone(f * .5, 2.0, decay=.25)
            place(tracks["pad"], envelope(pad, .22, .25), at, .055)
        for beat in range(4):
            b = at + beat * .5
            kick_t = np.arange(int(.17 * SR)) / SR
            kick = np.sin(2 * np.pi * (65 - 30 * kick_t) * kick_t) * np.exp(-kick_t * 26)
            if beat in (0, 2): place(tracks["pulse"], kick, b, .15)
            hat = soften_noise(int(.07 * SR), 2) * np.exp(-np.arange(int(.07 * SR)) / (SR * .014))
            place(tracks["pulse"], hat, b + .25, .045)
            if beat in (1, 3): place(tracks["pulse"], hat, b, .032)
            if beat in (0, 2):
                place(tracks["bass"], envelope(tone(roots[bar], .43, shape="warm", decay=3.8), .014, .10), b, .19)
        phrase = [notes[1] * 2, notes[2] * 2, notes[1] * 2, notes[0] * 2]
        for beat, f in enumerate(phrase):
            if bar % 2 or beat in (0, 2):
                place(tracks["lead"], envelope(tone(f, .32, shape="triangle", decay=5), .012, .09), at + beat * .5, .075)
        # Tactical ostinato stays in the same key and tempo, so market transitions remain musical.
        for step in range(8):
            f = notes[[0, 1, 2, 1][step % 4]] * (1 if step % 2 else 2)
            place(tracks["market"], envelope(tone(f, .20, shape="triangle", decay=11), .005, .06), at + step * .25, .085)
        tension = tone(roots[bar] * .5, 2.0, shape="warm", decay=.16)
        place(tracks["tension"], envelope(tension, .2, .25), at, .07)
    for name, track in tracks.items():
        # Tiny boundary fade prevents a click when AudioBufferSource loops.
        track[:int(.015 * SR)] *= np.linspace(0, 1, int(.015 * SR))
        track[-int(.015 * SR):] *= np.linspace(1, 0, int(.015 * SR))
        encode(ROOT / "music" / f"{name}.wav", track)


if __name__ == "__main__":
    sfx()
    music()
    print("Rendered original Compounding audio to", ROOT)
