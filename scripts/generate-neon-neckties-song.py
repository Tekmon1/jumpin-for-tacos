#!/usr/bin/env python3
"""Compose the original Neon Neckties concert single.

The production master intentionally leaves the lead-vocal register open. This
second arrangement pass makes the Neon Neckties sound like a live five-piece:
electric bass, two rhythm guitars and a melodic lead guitar now carry the song,
while keys and synths provide supporting color. A second review mix adds a soft
guide synth that demonstrates the future sung melody without presenting it as
a finished vocal performance.

Song: Turn the Sunset Up
Key: D major
Tempo: 126 BPM
Form: intro, verse, pre-chorus, chorus, verse, bridge, final chorus, outro
"""

from __future__ import annotations

import json
import math
import subprocess
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt


SAMPLE_RATE = 48_000
BPM = 126
BEAT = 60.0 / BPM
BAR = BEAT * 4.0
BARS = 48
TAIL_SECONDS = 3.5
DURATION = BARS * BAR + TAIL_SECONDS
TAU = math.tau
RNG = np.random.default_rng(230326)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public/game/assets/neon_neckties"


@dataclass(frozen=True)
class Section:
    id: str
    name: str
    start_bar: int
    end_bar: int
    energy: int
    vocal_role: str


SECTIONS = (
    Section("intro", "Sunset Soundcheck", 0, 4, 2, "Instrumental stage reveal"),
    Section("verse-1", "Verse One", 4, 12, 4, "Lead vocal enters"),
    Section("pre-chorus", "Pre-Chorus", 12, 16, 6, "Harmony lift"),
    Section("chorus-1", "First Chorus", 16, 24, 8, "Full five-member hook"),
    Section("verse-2", "Verse Two", 24, 32, 5, "Lead vocal with response lines"),
    Section("bridge", "Crowd-Light Bridge", 32, 36, 6, "Half-time crowd response"),
    Section("final-chorus", "Final Chorus", 36, 44, 10, "Largest stacked harmonies"),
    Section("outro", "Neon Bow", 44, 48, 9, "Final hook and band bow"),
)


CHORDS = {
    "Dadd9": (38, (62, 66, 69, 76)),
    "A/C#": (37, (57, 61, 64, 71)),
    "Bm7": (35, (59, 62, 66, 69)),
    "Gmaj7": (31, (55, 59, 62, 66)),
    "F#m7": (30, (54, 57, 61, 64)),
    "Em7": (28, (52, 55, 59, 62)),
    "A": (33, (57, 61, 64, 69)),
    "G": (31, (55, 59, 62, 67)),
    "D/F#": (30, (54, 57, 62, 66)),
}


PROGRESSION = (
    # Intro
    "Dadd9", "A/C#", "Bm7", "Gmaj7",
    # Verse one
    "Dadd9", "F#m7", "Gmaj7", "A",
    "Bm7", "Gmaj7", "D/F#", "A",
    # Pre-chorus
    "Em7", "G", "Bm7", "A",
    # Chorus one
    "Dadd9", "A", "Bm7", "G",
    "Dadd9", "A", "G", "A",
    # Verse two
    "Dadd9", "F#m7", "Gmaj7", "A",
    "Bm7", "Gmaj7", "D/F#", "A",
    # Bridge
    "Bm7", "Gmaj7", "Dadd9", "A",
    # Final chorus
    "Dadd9", "A", "Bm7", "G",
    "Dadd9", "A", "G", "A",
    # Outro
    "Gmaj7", "A", "Dadd9", "Dadd9",
)

MIX_GAINS = {
    "drums": 0.92,
    "bass": 1.22,
    "guitar_left": 1.12,
    "guitar_right": 1.12,
    "guitar_lead": 1.08,
    "keys": 0.46,
    "synth": 0.42,
    "effects": 0.74,
}

TRIO_GAINS = {
    "drums": 1.00,
    "bass": 1.32,
    "guitar_left": 1.22,
    "guitar_right": 1.22,
    "guitar_lead": 1.20,
}


# (bar, beat offset, MIDI note, beat duration). This is an arrangement guide,
# not a synthetic substitute for the final vocalist.
VOCAL_MELODY = (
    # Verse one
    (4, 0.0, 66, 1.0), (4, 1.25, 69, 0.5), (4, 2.0, 71, 1.0), (4, 3.25, 69, 0.5),
    (5, 0.0, 66, 1.5), (5, 2.0, 64, 0.75), (5, 3.0, 66, 0.75),
    (6, 0.0, 67, 1.0), (6, 1.25, 69, 0.75), (6, 2.25, 71, 1.25),
    (7, 0.25, 73, 0.75), (7, 1.25, 71, 0.75), (7, 2.25, 69, 1.5),
    (8, 0.0, 71, 1.0), (8, 1.25, 74, 0.75), (8, 2.25, 73, 1.0),
    (9, 0.0, 71, 1.5), (9, 2.0, 69, 0.75), (9, 3.0, 67, 0.75),
    (10, 0.0, 66, 1.0), (10, 1.25, 69, 0.75), (10, 2.25, 74, 1.25),
    (11, 0.25, 73, 0.75), (11, 1.25, 71, 0.75), (11, 2.25, 69, 1.5),
    # Pre-chorus
    (12, 0.0, 67, 1.0), (12, 1.0, 69, 1.0), (12, 2.0, 71, 1.5),
    (13, 0.0, 71, 1.0), (13, 1.0, 74, 1.0), (13, 2.0, 76, 1.5),
    (14, 0.0, 74, 0.75), (14, 1.0, 76, 0.75), (14, 2.0, 78, 1.5),
    (15, 0.0, 76, 0.75), (15, 1.0, 78, 0.75), (15, 2.0, 81, 1.5),
    # Chorus hook
    (16, 0.0, 78, 0.75), (16, 1.0, 78, 0.5), (16, 1.75, 76, 0.75), (16, 2.75, 74, 1.0),
    (17, 0.0, 73, 0.75), (17, 1.0, 76, 0.75), (17, 2.0, 78, 1.5),
    (18, 0.0, 78, 0.75), (18, 1.0, 81, 0.75), (18, 2.0, 78, 1.5),
    (19, 0.0, 76, 0.75), (19, 1.0, 74, 0.75), (19, 2.0, 71, 1.5),
    (20, 0.0, 78, 0.75), (20, 1.0, 78, 0.5), (20, 1.75, 81, 0.75), (20, 2.75, 78, 1.0),
    (21, 0.0, 76, 0.75), (21, 1.0, 73, 0.75), (21, 2.0, 76, 1.5),
    (22, 0.0, 74, 0.75), (22, 1.0, 76, 0.75), (22, 2.0, 78, 1.5),
    (23, 0.0, 76, 0.75), (23, 1.0, 74, 0.75), (23, 2.0, 73, 1.75),
    # Verse two, slightly more animated
    (24, 0.0, 66, 0.75), (24, 1.0, 69, 0.5), (24, 1.75, 71, 0.75), (24, 2.75, 74, 1.0),
    (25, 0.0, 73, 1.0), (25, 1.25, 71, 0.75), (25, 2.25, 69, 1.25),
    (26, 0.0, 67, 0.75), (26, 1.0, 69, 0.5), (26, 1.75, 71, 0.75), (26, 2.75, 76, 1.0),
    (27, 0.0, 73, 1.0), (27, 1.25, 71, 0.75), (27, 2.25, 69, 1.25),
    (28, 0.0, 71, 0.75), (28, 1.0, 74, 0.75), (28, 2.0, 78, 1.5),
    (29, 0.0, 76, 1.0), (29, 1.25, 74, 0.75), (29, 2.25, 71, 1.25),
    (30, 0.0, 69, 0.75), (30, 1.0, 71, 0.75), (30, 2.0, 74, 1.5),
    (31, 0.0, 73, 0.75), (31, 1.0, 71, 0.75), (31, 2.0, 69, 1.5),
    # Bridge, designed for crowd response
    (32, 0.0, 71, 1.5), (32, 2.0, 74, 1.5),
    (33, 0.0, 71, 1.5), (33, 2.0, 76, 1.5),
    (34, 0.0, 74, 1.0), (34, 1.25, 76, 1.0), (34, 2.5, 78, 1.0),
    (35, 0.0, 76, 0.75), (35, 1.0, 78, 0.75), (35, 2.0, 81, 1.5),
    # Final chorus, one octave-style lift in the response phrases
    (36, 0.0, 78, 0.75), (36, 1.0, 78, 0.5), (36, 1.75, 76, 0.75), (36, 2.75, 74, 1.0),
    (37, 0.0, 73, 0.75), (37, 1.0, 76, 0.75), (37, 2.0, 78, 1.5),
    (38, 0.0, 78, 0.75), (38, 1.0, 81, 0.75), (38, 2.0, 83, 1.5),
    (39, 0.0, 81, 0.75), (39, 1.0, 78, 0.75), (39, 2.0, 76, 1.5),
    (40, 0.0, 78, 0.75), (40, 1.0, 78, 0.5), (40, 1.75, 81, 0.75), (40, 2.75, 83, 1.0),
    (41, 0.0, 81, 0.75), (41, 1.0, 78, 0.75), (41, 2.0, 76, 1.5),
    (42, 0.0, 74, 0.75), (42, 1.0, 76, 0.75), (42, 2.0, 78, 1.5),
    (43, 0.0, 76, 0.75), (43, 1.0, 74, 0.75), (43, 2.0, 73, 1.75),
    # Final sung tag
    (44, 0.0, 71, 0.75), (44, 1.0, 74, 0.75), (44, 2.0, 78, 1.5),
    (45, 0.0, 76, 0.75), (45, 1.0, 74, 0.75), (45, 2.0, 73, 1.5),
    (46, 0.0, 74, 3.25),
)


def frequency(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0)


def pan_gains(pan: float) -> tuple[float, float]:
    angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    return math.cos(angle), math.sin(angle)


def envelope(length: int, attack: float, release: float, decay: float = 0.0) -> np.ndarray:
    result = np.ones(length, dtype=np.float64)
    attack_samples = min(length, max(1, int(attack * SAMPLE_RATE)))
    release_samples = min(length, max(1, int(release * SAMPLE_RATE)))
    result[:attack_samples] *= np.linspace(0.0, 1.0, attack_samples, endpoint=False)
    result[-release_samples:] *= np.linspace(1.0, 0.0, release_samples)
    if decay:
        result *= np.exp(-np.linspace(0.0, decay, length))
    return result


def add_signal(stem: np.ndarray, start: float, signal: np.ndarray, pan: float = 0.0) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(signal.shape[0], stem.shape[0] - start_index)
    if length <= 0:
        return
    left, right = pan_gains(pan)
    stem[start_index : start_index + length, 0] += signal[:length] * left
    stem[start_index : start_index + length, 1] += signal[:length] * right


def add_electric_piano(
    stem: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    pan: float,
) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note)
    phase = TAU * hz * time
    modulation = 1.7 * np.sin(phase * 2.0) * np.exp(-time * 2.2)
    tine = np.sin(phase + modulation) + 0.24 * np.sin(phase * 3.01 + 0.35)
    body = 0.36 * np.sin(phase * 0.5 + 0.2)
    signal = (tine + body) * envelope(length, 0.006, min(0.5, duration * 0.35), 1.0)
    add_signal(stem, start, signal * amplitude / 1.5, pan)


def add_guitar(
    stem: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    pan: float,
    muted: bool = False,
) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note)
    phase = TAU * hz * time + 0.006 * np.sin(TAU * 5.1 * time)
    pick = RNG.standard_normal(length) * np.exp(-time * 54.0) * 0.21
    brightness = np.exp(-time * (7.2 if muted else 2.7))
    harmonics = sum(
        (1.0 / harmonic**1.08)
        * brightness ** (0.10 * harmonic)
        * np.sin(phase * (harmonic + harmonic * 0.0008) + harmonic * 0.17)
        for harmonic in range(1, 9)
    )
    harmonics += 0.28 * np.sin(phase * 0.5 + 0.31) + pick
    release = 0.09 if muted else min(0.42, duration * 0.3)
    decay = 7.2 if muted else 1.25
    shape = envelope(length, 0.002, release, decay)
    signal = np.tanh(harmonics * (1.75 if muted else 1.48)) * shape * amplitude / 1.18
    add_signal(stem, start, signal, pan)


def add_lead_guitar(
    stem: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    pan: float,
) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note)
    vibrato_depth = np.minimum(1.0, time * 5.0) * 0.018
    phase = TAU * hz * time + vibrato_depth * np.sin(TAU * 5.6 * time)
    pick = RNG.standard_normal(length) * np.exp(-time * 62.0) * 0.17
    pickup = (
        np.sin(phase)
        + 0.58 * np.sin(phase * 2.003 + 0.18)
        + 0.31 * np.sin(phase * 3.008 + 0.43)
        + 0.19 * np.sin(phase * 4.012 + 0.76)
        + 0.10 * np.sin(phase * 5.02 + 0.28)
        + pick
    )
    amp = np.tanh(pickup * 2.05) + 0.12 * np.tanh(pickup * 4.6)
    shape = envelope(length, 0.003, min(0.42, duration * 0.32), 0.52)
    add_signal(stem, start, amp * shape * amplitude / 1.36, pan)


def add_bass(
    stem: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    pan: float = 0.0,
) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note)
    phase = TAU * hz * time
    transient = RNG.standard_normal(length) * np.exp(-time * 62.0) * 0.085
    signal = (
        np.sin(phase)
        + 0.54 * np.sin(phase * 2.0)
        + 0.27 * np.sin(phase * 3.0)
        + 0.12 * np.sin(phase * 4.0)
        + transient
    )
    finger_pulse = 0.91 + 0.09 * np.sin(TAU * 2.1 * time)
    shape = envelope(length, 0.004, min(0.19, duration * 0.35), 0.46)
    add_signal(stem, start, np.tanh(signal * 1.38) * finger_pulse * shape * amplitude / 1.18, pan)


def add_pad(
    stem: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    pan: float,
) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note)
    phase = TAU * hz * time
    drift = 0.0031
    signal = (
        0.52 * np.sin(phase * (1.0 - drift))
        + 0.52 * np.sin(phase * (1.0 + drift) + 0.55)
        + 0.18 * np.sin(phase * 2.0 + 0.8)
        + 0.07 * np.sin(phase * 0.5 + 0.2)
    )
    tremolo = 0.88 + 0.12 * np.sin(TAU * 0.22 * time + pan)
    shape = envelope(length, min(0.55, duration * 0.2), min(0.9, duration * 0.25), 0.08)
    add_signal(stem, start, signal * tremolo * shape * amplitude / 1.42, pan)


def add_synth_stab(
    stem: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    pan: float,
) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note)
    phase = TAU * hz * time
    saw = sum(np.sin(phase * harmonic) / harmonic for harmonic in range(1, 9))
    signal = np.tanh(saw * 0.85) * envelope(length, 0.008, min(0.2, duration * 0.42), 2.5)
    add_signal(stem, start, signal * amplitude / 1.9, pan)


def add_guide_voice(
    stem: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note)
    vibrato = 0.012 * np.sin(TAU * 5.3 * time) * np.minimum(1.0, time * 3.5)
    phase = TAU * hz * time + vibrato
    # A warm, obviously synthetic guide timbre. The final release will replace
    # this with a real original vocal performance.
    signal = (
        np.sin(phase)
        + 0.28 * np.sin(phase * 2.0 + 0.25)
        + 0.11 * np.sin(phase * 3.0 + 0.7)
    )
    breath = RNG.standard_normal(length) * 0.018
    shape = envelope(length, 0.055, min(0.25, duration * 0.3), 0.18)
    add_signal(stem, start, (signal * 0.84 + breath) * shape * amplitude / 1.38, 0.0)


def add_kick(stem: np.ndarray, start: float, amplitude: float) -> None:
    length = min(int(0.34 * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = 142.0 * np.exp(-time * 18.0) + 42.0
    phase = TAU * np.cumsum(hz) / SAMPLE_RATE
    click = RNG.standard_normal(length) * np.exp(-time * 96.0) * 0.07
    signal = (np.sin(phase) * np.exp(-time * 14.0) + click) * amplitude
    add_signal(stem, start, signal, 0.0)


def add_snare(stem: np.ndarray, start: float, amplitude: float, clap: bool = False) -> None:
    length = min(int(0.42 * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    bright = noise - np.roll(noise, 2)
    body = np.sin(TAU * 188.0 * time) * np.exp(-time * 18.0)
    signal = bright * np.exp(-time * 20.0) * 0.55 + body * 0.45
    if clap:
        clap_shape = np.zeros(length)
        for offset in (0.0, 0.018, 0.039):
            start_sample = int(offset * SAMPLE_RATE)
            remaining = length - start_sample
            clap_shape[start_sample:] += bright[:remaining] * np.exp(-np.arange(remaining) / SAMPLE_RATE * 34.0)
        signal += clap_shape * 0.22
    add_signal(stem, start, signal * amplitude, 0.0)


def add_hat(stem: np.ndarray, start: float, amplitude: float, pan: float, open_hat: bool = False) -> None:
    duration = 0.34 if open_hat else 0.085
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    metallic = noise - np.roll(noise, 1) + 0.22 * np.sin(TAU * 8_340.0 * time)
    decay = 12.0 if open_hat else 64.0
    add_signal(stem, start, metallic * np.exp(-time * decay) * amplitude, pan)


def add_tom(stem: np.ndarray, start: float, note: float, amplitude: float, pan: float) -> None:
    length = min(int(0.42 * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note) * (1.0 + 0.22 * np.exp(-time * 17.0))
    phase = TAU * np.cumsum(hz) / SAMPLE_RATE
    signal = (np.sin(phase) + 0.17 * np.sin(phase * 2.0)) * np.exp(-time * 10.5) * amplitude
    add_signal(stem, start, signal, pan)


def add_crash(stem: np.ndarray, start: float, amplitude: float) -> None:
    length = min(int(2.3 * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    shimmer = noise - np.roll(noise, 3)
    signal = shimmer * np.exp(-time * 2.1) * amplitude
    add_signal(stem, start, signal, -0.18)
    add_signal(stem, start + 0.006, signal * 0.72, 0.24)


def add_riser(stem: np.ndarray, start: float, duration: float, amplitude: float) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    progress = np.linspace(0.0, 1.0, length)
    noise = RNG.standard_normal(length)
    airy = noise - np.roll(noise, 2)
    sweep_hz = 130.0 + 1_240.0 * progress**2
    sweep = np.sin(TAU * np.cumsum(sweep_hz) / SAMPLE_RATE)
    shape = progress**2.3 * np.minimum(1.0, (1.0 - progress) * 24.0)
    add_signal(stem, start, (airy * 0.21 + sweep * 0.79) * shape * amplitude, 0.0)


def add_crowd_swell(stem: np.ndarray, start: float, duration: float, amplitude: float) -> None:
    length = min(int(duration * SAMPLE_RATE), stem.shape[0] - int(start * SAMPLE_RATE))
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    noise_a = RNG.standard_normal(length)
    noise_b = RNG.standard_normal(length)
    pulse = 0.62 + 0.18 * np.sin(TAU * 2.4 * time) + 0.12 * np.sin(TAU * 3.7 * time + 0.5)
    shape = envelope(length, min(1.2, duration * 0.28), min(1.4, duration * 0.28), 0.1)
    add_signal(stem, start, noise_a * pulse * shape * amplitude, -0.55)
    add_signal(stem, start, noise_b * pulse * shape * amplitude, 0.55)


def add_stereo_delay(stem: np.ndarray, delay_seconds: float, gain: float, crossfeed: bool = False) -> None:
    delay = int(delay_seconds * SAMPLE_RATE)
    if delay <= 0 or delay >= stem.shape[0]:
        return
    dry = stem.copy()
    if crossfeed:
        stem[delay:, 0] += dry[:-delay, 1] * gain
        stem[delay:, 1] += dry[:-delay, 0] * gain
    else:
        stem[delay:] += dry[:-delay] * gain


def filter_stem(stem: np.ndarray, highpass: float | None = None, lowpass: float | None = None) -> None:
    if highpass:
        sos = butter(2, highpass, btype="highpass", fs=SAMPLE_RATE, output="sos")
        stem[:, 0] = sosfilt(sos, stem[:, 0])
        stem[:, 1] = sosfilt(sos, stem[:, 1])
    if lowpass:
        sos = butter(2, lowpass, btype="lowpass", fs=SAMPLE_RATE, output="sos")
        stem[:, 0] = sosfilt(sos, stem[:, 0])
        stem[:, 1] = sosfilt(sos, stem[:, 1])


def section_for_bar(bar_index: int) -> Section:
    return next(section for section in SECTIONS if section.start_bar <= bar_index < section.end_bar)


def chord_strum(
    stem: np.ndarray,
    start: float,
    chord: tuple[int, ...],
    amplitude: float,
    pan: float,
    muted: bool,
    reverse: bool = False,
) -> None:
    notes = tuple(reversed(chord)) if reverse else chord
    for index, note in enumerate(notes):
        add_guitar(
            stem,
            start + index * 0.014,
            BEAT * (0.56 if muted else 1.4),
            note,
            amplitude,
            pan + (index - 1.5) * 0.025,
            muted,
        )


def finish_instrumental_mix(mix: np.ndarray) -> np.ndarray:
    mix = np.tanh(mix * 1.14)
    short_rms = np.sqrt(np.mean(mix**2, axis=1) + 1e-9)
    smoothing = np.ones(int(0.045 * SAMPLE_RATE)) / int(0.045 * SAMPLE_RATE)
    envelope_rms = np.convolve(short_rms, smoothing, mode="same")
    gain_reduction = np.minimum(1.0, 0.19 / np.maximum(envelope_rms, 1e-5))
    mix *= (0.82 + gain_reduction[:, None] * 0.18)

    peak = float(np.max(np.abs(mix))) or 1.0
    mix *= 0.90 / peak

    fade_in = int(0.035 * SAMPLE_RATE)
    fade_out = int(2.8 * SAMPLE_RATE)
    mix[:fade_in] *= np.linspace(0.0, 1.0, fade_in)[:, None]
    mix[-fade_out:] *= np.linspace(1.0, 0.0, fade_out)[:, None]
    return mix


def compose() -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, np.ndarray]]:
    frames = int(DURATION * SAMPLE_RATE)
    stems = {
        "drums": np.zeros((frames, 2), dtype=np.float32),
        "bass": np.zeros((frames, 2), dtype=np.float32),
        "guitar_left": np.zeros((frames, 2), dtype=np.float32),
        "guitar_right": np.zeros((frames, 2), dtype=np.float32),
        "guitar_lead": np.zeros((frames, 2), dtype=np.float32),
        "keys": np.zeros((frames, 2), dtype=np.float32),
        "synth": np.zeros((frames, 2), dtype=np.float32),
        "effects": np.zeros((frames, 2), dtype=np.float32),
        "guide": np.zeros((frames, 2), dtype=np.float32),
    }

    for bar_index, chord_name in enumerate(PROGRESSION):
        section = section_for_bar(bar_index)
        start = bar_index * BAR
        root, chord = CHORDS[chord_name]
        next_root = CHORDS[PROGRESSION[min(BARS - 1, bar_index + 1)]][0]

        # Pads remain wide and out of the future lead-vocal register.
        pad_level = {
            "intro": 0.033, "verse-1": 0.017, "pre-chorus": 0.027,
            "chorus-1": 0.029, "verse-2": 0.018, "bridge": 0.032,
            "final-chorus": 0.034, "outro": 0.030,
        }[section.id]
        for note_index, note in enumerate(chord):
            add_pad(stems["synth"], start, BAR * 1.08, note, pad_level, (note_index - 1.5) * 0.38)

        # Electric piano establishes the harmonic personality.
        if section.id in {"intro", "verse-1", "verse-2", "bridge", "outro"}:
            pattern = (0.0, 1.5, 2.5) if section.id != "intro" else (0.0, 2.0)
            for hit_index, beat_offset in enumerate(pattern):
                for note_index, note in enumerate(chord):
                    add_electric_piano(
                        stems["keys"],
                        start + beat_offset * BEAT + note_index * 0.009,
                        BEAT * (1.35 if section.id == "intro" else 0.82),
                        note,
                        0.029 if section.id == "intro" else 0.024,
                        (note_index - 1.5) * 0.3 + (0.08 if hit_index % 2 else -0.08),
                    )
        else:
            for beat_offset in (0.0, 2.0):
                for note_index, note in enumerate(chord):
                    add_electric_piano(
                        stems["keys"],
                        start + beat_offset * BEAT + note_index * 0.008,
                        BEAT * 1.25,
                        note,
                        0.027,
                        (note_index - 1.5) * 0.34,
                    )

        # Bass changes its articulation with each section.
        if section.id == "intro" and bar_index < 2:
            bass_pattern = ((0.0, root, 3.55),)
        elif section.id == "bridge":
            bass_pattern = ((0.0, root, 1.6), (2.0, root + 12, 1.45))
        elif section.id in {"chorus-1", "final-chorus", "outro"}:
            bass_pattern = (
                (0.0, root, 0.8), (1.0, root + 12, 0.62),
                (1.75, root + 7, 0.6), (2.5, root + 12, 0.62),
                (3.25, next_root, 0.6),
            )
        else:
            bass_pattern = (
                (0.0, root, 0.88), (1.5, root + 7, 0.72),
                (2.5, root + 12, 0.72), (3.5, next_root, 0.45),
            )
        for beat_offset, note, beat_length in bass_pattern:
            add_bass(
                stems["bass"],
                start + beat_offset * BEAT,
                beat_length * BEAT,
                note,
                (
                    0.155 if section.id in {"chorus-1", "final-chorus", "outro"}
                    else 0.125 if section.id != "intro"
                    else 0.110
                ),
            )

        # Two independent guitar parts provide real band interplay.
        if section.id == "intro":
            for beat_offset in (0.0, 1.0, 2.0, 3.0):
                note = chord[int(beat_offset) % len(chord)]
                add_guitar(stems["guitar_left"], start + beat_offset * BEAT, BEAT * 0.8, note + 12, 0.070, -0.48, True)
                if bar_index >= 2:
                    add_guitar(stems["guitar_right"], start + (beat_offset + 0.5) * BEAT, BEAT * 0.72, chord[(int(beat_offset) + 2) % len(chord)] + 12, 0.055, 0.52, True)
        elif section.id in {"verse-1", "verse-2"}:
            for eighth in range(8):
                chord_strum(
                    stems["guitar_left"],
                    start + eighth * BEAT * 0.5,
                    chord,
                    0.046 if eighth % 2 == 0 else 0.039,
                    -0.58,
                    True,
                    reverse=bool(eighth % 2),
                )
            for beat_offset in (0.5, 2.5):
                chord_strum(stems["guitar_right"], start + beat_offset * BEAT, chord, 0.058, 0.58, False)
        elif section.id == "bridge":
            chord_strum(stems["guitar_left"], start, chord, 0.080, -0.56, False)
            chord_strum(stems["guitar_right"], start + BEAT * 2.0, chord, 0.074, 0.56, False, True)
        else:
            for beat_offset in (0.0, 1.5, 2.0, 3.5):
                chord_strum(
                    stems["guitar_left"],
                    start + beat_offset * BEAT,
                    chord,
                    0.074 if section.id == "final-chorus" else 0.066,
                    -0.62,
                    False,
                    reverse=beat_offset in {1.5, 3.5},
                )
                chord_strum(
                    stems["guitar_right"],
                    start + beat_offset * BEAT + 0.018,
                    tuple(note + 12 for note in chord[:3]),
                    0.056 if section.id == "final-chorus" else 0.048,
                    0.62,
                    False,
                    reverse=beat_offset in {0.0, 2.0},
                )

        # A distinct electric-guitar hook gives the band an audible identity.
        # It stays mostly in the gaps where the future vocal can breathe.
        if section.id == "intro" and bar_index >= 2:
            lead_notes = (chord[0] + 12, chord[2] + 12, chord[-1] + 12, chord[1] + 12)
            for index, note in enumerate(lead_notes):
                add_lead_guitar(
                    stems["guitar_lead"],
                    start + (0.25 + index * 0.88) * BEAT,
                    BEAT * 0.66,
                    note,
                    0.098,
                    0.16,
                )
        elif section.id in {"chorus-1", "final-chorus"}:
            lift = 2 if section.id == "final-chorus" else 0
            response_notes = (
                chord[2] + 12 + lift,
                chord[-1] + 12 + lift,
                chord[1] + 12 + lift,
            )
            for index, (beat_offset, note) in enumerate(zip((2.38, 2.94, 3.48), response_notes)):
                add_lead_guitar(
                    stems["guitar_lead"],
                    start + beat_offset * BEAT,
                    BEAT * (0.52 if index < 2 else 0.72),
                    note,
                    0.100 if section.id == "final-chorus" else 0.086,
                    0.19,
                )
            if bar_index in {16, 20, 36, 40}:
                add_lead_guitar(stems["guitar_lead"], start, BEAT * 1.25, chord[-1] + 12 + lift, 0.096, 0.19)
        elif section.id == "bridge":
            add_lead_guitar(stems["guitar_lead"], start + 2.65 * BEAT, BEAT * 1.18, chord[-1] + 12, 0.078, 0.16)
        elif section.id == "outro":
            for index, note in enumerate((chord[1] + 12, chord[2] + 12, chord[-1] + 12)):
                add_lead_guitar(stems["guitar_lead"], start + index * 1.12 * BEAT, BEAT * 0.94, note, 0.092, 0.17)

        # Drum programming has humanized micro-timing and section-specific fills.
        if section.id == "intro":
            if bar_index >= 2:
                add_kick(stems["drums"], start, 0.15)
                add_snare(stems["drums"], start + 2.0 * BEAT, 0.11)
                for eighth in range(8):
                    add_hat(stems["drums"], start + eighth * BEAT * 0.5, 0.020, (-1) ** eighth * 0.36)
        elif section.id == "bridge":
            add_kick(stems["drums"], start, 0.20)
            add_snare(stems["drums"], start + 2.0 * BEAT, 0.16, clap=True)
            for quarter in range(4):
                add_hat(stems["drums"], start + quarter * BEAT, 0.018, (-1) ** quarter * 0.36, quarter == 3)
        else:
            chorus = section.id in {"chorus-1", "final-chorus", "outro"}
            add_kick(stems["drums"], start, 0.22 if chorus else 0.18)
            add_kick(stems["drums"], start + 2.0 * BEAT, 0.19 if chorus else 0.16)
            if chorus:
                add_kick(stems["drums"], start + 2.75 * BEAT, 0.13)
            elif bar_index % 2:
                add_kick(stems["drums"], start + 2.5 * BEAT, 0.11)
            add_snare(stems["drums"], start + BEAT, 0.15 if chorus else 0.13, clap=chorus)
            add_snare(stems["drums"], start + 3.0 * BEAT, 0.17 if chorus else 0.14, clap=chorus)
            for eighth in range(8):
                swing = 0.018 if eighth % 2 else 0.0
                add_hat(
                    stems["drums"],
                    start + eighth * BEAT * 0.5 + swing,
                    0.024 if chorus else 0.019,
                    (-1) ** eighth * 0.44,
                    open_hat=chorus and eighth == 7,
                )

        # Chorus stabs fill the edges while preserving the lead-vocal center.
        if section.id in {"pre-chorus", "chorus-1", "final-chorus", "outro"}:
            stab_level = 0.050 if section.id == "final-chorus" else 0.039
            for beat_offset in ((0.5, 1.5, 2.5, 3.5) if "chorus" in section.id else (1.5, 3.5)):
                for note_index, note in enumerate(chord[:3]):
                    add_synth_stab(
                        stems["synth"],
                        start + beat_offset * BEAT + note_index * 0.008,
                        BEAT * 0.34,
                        note + 12,
                        stab_level,
                        (note_index - 1) * 0.45,
                    )

        # Musical fills answer, rather than compete with, future vocal lines.
        if bar_index in {3, 11, 15, 23, 31, 35, 43}:
            for index, note in enumerate((57, 61, 64, 69)):
                add_tom(stems["drums"], start + (3.0 + index * 0.24) * BEAT, note - 24, 0.075, -0.55 + index * 0.36)
        if bar_index in {12, 16, 24, 32, 36, 44}:
            add_crash(stems["drums"], start, 0.035 if bar_index < 36 else 0.052)

    # Transitional effects and audience energy.
    for target_bar in (12, 16, 24, 32, 36, 44):
        add_riser(stems["effects"], target_bar * BAR - BAR, BAR, 0.031 if target_bar != 36 else 0.045)
    add_crowd_swell(stems["effects"], 0, BAR * 2.1, 0.0022)
    add_crowd_swell(stems["effects"], 35 * BAR, BAR * 1.2, 0.0030)
    add_crowd_swell(stems["effects"], 43 * BAR, BAR * 4.8, 0.0040)

    # Last chord rings naturally into the tail.
    final_start = 46 * BAR
    _, final_chord = CHORDS["Dadd9"]
    for note_index, note in enumerate(final_chord):
        add_electric_piano(stems["keys"], final_start, BAR * 2 + TAIL_SECONDS, note, 0.034, (note_index - 1.5) * 0.34)
        add_pad(stems["synth"], final_start, BAR * 2 + TAIL_SECONDS, note, 0.032, (note_index - 1.5) * 0.42)
    chord_strum(stems["guitar_left"], final_start, final_chord, 0.096, -0.55, False)
    chord_strum(stems["guitar_right"], final_start + 0.018, tuple(note + 12 for note in final_chord[:3]), 0.078, 0.55, False)

    for bar_index, beat_offset, note, beat_length in VOCAL_MELODY:
        add_guide_voice(
            stems["guide"],
            bar_index * BAR + beat_offset * BEAT,
            beat_length * BEAT,
            note,
            0.070 if bar_index < 16 else 0.082,
        )

    # Production effects. These are intentionally different per instrument so
    # the stereo image remains clear rather than becoming one large wash.
    filter_stem(stems["drums"], highpass=30.0, lowpass=17_000.0)
    filter_stem(stems["bass"], highpass=32.0, lowpass=5_800.0)
    filter_stem(stems["guitar_left"], highpass=105.0, lowpass=10_500.0)
    filter_stem(stems["guitar_right"], highpass=115.0, lowpass=10_000.0)
    filter_stem(stems["guitar_lead"], highpass=145.0, lowpass=9_400.0)
    filter_stem(stems["keys"], highpass=95.0, lowpass=13_500.0)
    filter_stem(stems["synth"], highpass=80.0, lowpass=11_500.0)
    filter_stem(stems["effects"], highpass=180.0, lowpass=15_500.0)
    filter_stem(stems["guide"], highpass=150.0, lowpass=8_500.0)

    add_stereo_delay(stems["guitar_left"], 0.116, 0.13, crossfeed=True)
    add_stereo_delay(stems["guitar_right"], 0.149, 0.11, crossfeed=True)
    add_stereo_delay(stems["guitar_lead"], 0.188, 0.12, crossfeed=True)
    add_stereo_delay(stems["keys"], 0.228, 0.10, crossfeed=True)
    add_stereo_delay(stems["synth"], 0.307, 0.08, crossfeed=True)
    add_stereo_delay(stems["guide"], 0.172, 0.09, crossfeed=True)
    add_stereo_delay(stems["guide"], 0.344, 0.045, crossfeed=False)

    instrumental = np.zeros((frames, 2), dtype=np.float64)
    for stem_name, gain in MIX_GAINS.items():
        instrumental += stems[stem_name].astype(np.float64) * gain

    trio = np.zeros((frames, 2), dtype=np.float64)
    for stem_name, gain in TRIO_GAINS.items():
        trio += stems[stem_name].astype(np.float64) * gain

    # Both instrumental cuts receive the same bus treatment, so their A/B
    # comparison reflects orchestration rather than a loudness trick.
    instrumental = finish_instrumental_mix(instrumental)
    trio = finish_instrumental_mix(trio)

    # The vocal guide remains paired with the fuller band mix. It demonstrates
    # the melody only and is not part of the power-trio arrangement.
    guide_mix = instrumental + stems["guide"].astype(np.float64) * 0.92
    guide_mix = np.tanh(guide_mix * 1.05)
    guide_mix *= 0.90 / (float(np.max(np.abs(guide_mix))) or 1.0)

    fade_in = int(0.035 * SAMPLE_RATE)
    fade_out = int(2.8 * SAMPLE_RATE)
    fade_curve = np.linspace(0.0, 1.0, fade_in)[:, None]
    guide_mix[:fade_in] *= fade_curve
    guide_mix[-fade_out:] *= np.linspace(1.0, 0.0, fade_out)[:, None]

    return (
        trio.astype(np.float32),
        instrumental.astype(np.float32),
        guide_mix.astype(np.float32),
        stems,
    )


def write_float_wav(path: Path, samples: np.ndarray) -> None:
    pcm = np.clip(samples, -1.0, 1.0)
    integers = (pcm * 2_147_483_647.0).astype("<i4")
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(4)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(integers.tobytes())


def encode(input_path: Path, output_path: Path, codec: str, profile: str = "standard") -> None:
    if codec == "aac":
        args = ["-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart"]
    elif codec == "vorbis":
        args = ["-c:a", "libvorbis", "-q:a", "7"]
    else:
        raise ValueError(codec)
    if profile == "trio":
        mastering_filter = (
            "loudnorm=I=-13.2:TP=-4:LRA=9,"
            "aresample=48000,"
            "lowpass=f=15000"
        )
    else:
        mastering_filter = (
            "loudnorm=I=-12.8:TP=-1.5:LRA=9,"
            "aresample=48000,"
            "alimiter=limit=0.65:attack=5:release=80:level=false,"
            "lowpass=f=15000,"
            "volume=0.9"
        )

    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(input_path),
            "-af", mastering_filter,
            "-ar", str(SAMPLE_RATE),
            *args,
            str(output_path),
        ],
        check=True,
    )


def waveform(samples: np.ndarray, points: int = 192) -> list[float]:
    mono = np.mean(np.abs(samples), axis=1)
    windows = np.array_split(mono, points)
    peaks = [float(np.percentile(window, 94)) if len(window) else 0.0 for window in windows]
    maximum = max(peaks) or 1.0
    return [round(value / maximum, 4) for value in peaks]


def note_name(note: int) -> str:
    names = ("C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B")
    return f"{names[note % 12]}{note // 12 - 1}"


def write_cues(samples: np.ndarray, stems: dict[str, np.ndarray]) -> None:
    stem_levels = {}
    for name, gain in MIX_GAINS.items():
        mixed_stem = stems[name].astype(np.float64) * gain
        rms = float(np.sqrt(np.mean(mixed_stem**2) + 1e-12))
        stem_levels[name] = round(20.0 * math.log10(rms), 2)

    cues = {
        "title": "Turn the Sunset Up",
        "artist": "Neon Neckties",
        "version": "power-trio-arrangement-v3",
        "status": "instrumental master complete; final original vocal pending",
        "key": "D major",
        "bpm": BPM,
        "timeSignature": "4/4",
        "bars": BARS,
        "durationSeconds": round(DURATION, 3),
        "sections": [
            {
                "id": section.id,
                "name": section.name,
                "startBar": section.start_bar,
                "endBar": section.end_bar,
                "startSeconds": round(section.start_bar * BAR, 3),
                "endSeconds": round(section.end_bar * BAR, 3),
                "energy": section.energy,
                "vocalRole": section.vocal_role,
            }
            for section in SECTIONS
        ],
        "vocalGuide": [
            {
                "bar": bar,
                "beat": beat,
                "note": note_name(note),
                "midi": note,
                "durationBeats": duration,
                "startSeconds": round(bar * BAR + beat * BEAT, 3),
            }
            for bar, beat, note, duration in VOCAL_MELODY
        ],
        "waveform": waveform(samples),
        "mixStemRmsDb": stem_levels,
        "powerTrioStemRmsDb": {
            name: round(
                20.0 * math.log10(
                    float(
                        np.sqrt(
                            np.mean((stems[name].astype(np.float64) * gain) ** 2)
                            + 1e-12
                        )
                    )
                ),
                2,
            )
            for name, gain in TRIO_GAINS.items()
        },
        "productionNotes": [
            "Lead vocal intentionally absent from instrumental master",
            "Guide mix uses a clearly synthetic melody reference only",
            "Band-forward balance features electric bass, two rhythm guitars and lead guitar",
            "Power-trio cut contains only drums, electric bass and electric guitars",
            "Keyboards and synths support the band instead of carrying the mix",
            "Full-band arrangement reserves the center vocal register",
            "Final vocal will be original and will not imitate an identifiable singer",
            "Stage lighting and animation can lock to bar-accurate cue points",
        ],
    }
    (OUTPUT_DIR / "turn_the_sunset_up_cues_v1.json").write_text(
        json.dumps(cues, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    trio, instrumental, guide, stems = compose()

    with tempfile.TemporaryDirectory(prefix="neon-neckties-") as temp_dir:
        temp = Path(temp_dir)
        trio_wav = temp / "power-trio.wav"
        instrumental_wav = temp / "instrumental.wav"
        guide_wav = temp / "guide.wav"
        write_float_wav(trio_wav, trio)
        write_float_wav(instrumental_wav, instrumental)
        write_float_wav(guide_wav, guide)

        encode(
            trio_wav,
            OUTPUT_DIR / "turn_the_sunset_up_power_trio_v1.m4a",
            "aac",
            "trio",
        )
        encode(
            trio_wav,
            OUTPUT_DIR / "turn_the_sunset_up_power_trio_v1.ogg",
            "vorbis",
            "trio",
        )
        encode(
            instrumental_wav,
            OUTPUT_DIR / "turn_the_sunset_up_instrumental_v1.m4a",
            "aac",
        )
        encode(
            instrumental_wav,
            OUTPUT_DIR / "turn_the_sunset_up_instrumental_v1.ogg",
            "vorbis",
        )
        encode(
            guide_wav,
            OUTPUT_DIR / "turn_the_sunset_up_melody_guide_v1.m4a",
            "aac",
        )
        encode(
            guide_wav,
            OUTPUT_DIR / "turn_the_sunset_up_melody_guide_v1.ogg",
            "vorbis",
        )

    write_cues(trio, stems)
    print(f"Generated Turn the Sunset Up arrangement in {OUTPUT_DIR}")
    for path in sorted(OUTPUT_DIR.iterdir()):
        print(f"  {path.name}: {path.stat().st_size:,} bytes")
    print("  band stem levels:")
    for name in ("drums", "bass", "guitar_left", "guitar_right", "guitar_lead", "keys", "synth"):
        rms = float(np.sqrt(np.mean(stems[name].astype(np.float64) ** 2) + 1e-12))
        print(f"    {name}: {20.0 * math.log10(rms):.1f} dBFS RMS")


if __name__ == "__main__":
    main()
