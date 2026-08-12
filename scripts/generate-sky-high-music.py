#!/usr/bin/env python3
"""Compose the original cinematic-electronic score for World 1-2.

The departure cue spends 24 seconds building from an 86 BPM-feeling analog
soundscape into a 132 BPM action theme. The remaining cues are independent
variations for cruising, flybys, the guacamole ambush, rescue, and fiesta.
Every melody and arrangement is original to Jumpin' For Tacos.
"""

from __future__ import annotations

import math
import subprocess
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np


SAMPLE_RATE = 32000
TAU = math.tau
RNG = np.random.default_rng(15072026)


@dataclass(frozen=True)
class Track:
    filename: str
    title: str
    bpm: int
    bars: int
    style: str


TRACKS = (
    Track("music_sky_departure.ogg", "Skyline Ignition", 86, 0, "departure"),
    Track("music_sky_cruise.ogg", "Afterburner Adventure", 132, 24, "cruise"),
    Track("music_sky_banner.ogg", "Banner Squadron", 132, 24, "flyby"),
    Track("music_sky_ambush.ogg", "Guac Lock-On", 130, 24, "ambush"),
    Track("music_sky_rescue.ogg", "Taco Hero Intercept", 134, 32, "rescue"),
    Track("music_sky_fiesta.ogg", "Runway Victory Lights", 132, 24, "fiesta"),
)


def frequency(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0)


def pan(pan_value: float) -> tuple[float, float]:
    angle = (max(-1.0, min(1.0, pan_value)) + 1.0) * math.pi / 4.0
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


def add_note(
    mix: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    instrument: str,
    pan_value: float = 0.0,
) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(duration * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    base = frequency(note)
    phase = TAU * base * time

    if instrument == "lead":
        vibrato = 0.12 * np.sin(TAU * 5.2 * time) * np.minimum(1.0, time * 3.4)
        signal = np.tanh(1.18 * (
            np.sin(phase + vibrato)
            + 0.34 * np.sin(2.0 * phase + 0.18)
            + 0.14 * np.sin(3.0 * phase + 0.41)
        ))
        shape = envelope(length, 0.014, min(0.28, duration * 0.32), 0.28)
    elif instrument == "brass":
        signal = np.tanh(1.28 * (
            np.sin(phase) + 0.48 * np.sin(2.0 * phase) + 0.19 * np.sin(3.0 * phase)
        ))
        shape = envelope(length, 0.012, min(0.16, duration * 0.4), 0.9)
    elif instrument == "pulse":
        signal = 0.58 * np.sign(np.sin(phase)) + 0.42 * np.sin(phase) + 0.08 * np.sin(2.0 * phase)
        shape = envelope(length, 0.004, min(0.09, duration * 0.42), 1.9)
    elif instrument == "pluck":
        signal = np.sin(phase) + 0.31 * np.sin(2.01 * phase) + 0.15 * np.sin(4.0 * phase + 0.2)
        shape = envelope(length, 0.002, min(0.08, duration * 0.36), 4.8)
    elif instrument == "bell":
        signal = np.sin(phase) + 0.3 * np.sin(2.71 * phase) + 0.14 * np.sin(5.39 * phase)
        shape = envelope(length, 0.002, min(0.2, duration * 0.45), 4.0)
    elif instrument == "bass":
        signal = np.sin(phase) + 0.23 * np.sin(2.0 * phase) + 0.08 * np.sin(3.0 * phase)
        shape = envelope(length, 0.006, min(0.11, duration * 0.35), 0.72)
    elif instrument == "pad":
        detune = 0.0034
        signal = (
            0.58 * np.sin(phase * (1.0 - detune))
            + 0.58 * np.sin(phase * (1.0 + detune) + 0.45)
            + 0.18 * np.sin(2.0 * phase + 0.8)
            + 0.08 * np.sin(0.5 * phase)
        )
        shape = envelope(length, min(0.42, duration * 0.2), min(0.7, duration * 0.28), 0.08)
    else:
        raise ValueError(instrument)

    signal *= shape * amplitude / 1.62
    left, right = pan(pan_value)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_kick(mix: np.ndarray, start: float, amplitude: float) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(0.28 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = 122.0 * np.exp(-time * 13.0) + 39.0
    phase = TAU * np.cumsum(hz) / SAMPLE_RATE
    click = RNG.standard_normal(length) * np.exp(-time * 90.0) * 0.07
    signal = (np.sin(phase) * np.exp(-time * 14.5) + click) * amplitude
    mix[start_index : start_index + length] += signal[:, None]


def add_snare(mix: np.ndarray, start: float, amplitude: float) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(0.24 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    bright = noise - np.roll(noise, 2)
    body = np.sin(TAU * 188 * time) * np.exp(-time * 18)
    gated = bright * np.exp(-time * 21) * (0.76 + 0.24 * np.sin(TAU * 31 * time) ** 2)
    signal = (gated * 0.58 + body * 0.42) * amplitude
    mix[start_index : start_index + length] += signal[:, None]


def add_hat(mix: np.ndarray, start: float, amplitude: float, pan_value: float) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(0.065 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    signal = (noise - np.roll(noise, 1)) * np.exp(-time * 58) * amplitude
    left, right = pan(pan_value)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_tom(mix: np.ndarray, start: float, note: float, amplitude: float, pan_value: float) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(0.27 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    hz = frequency(note) * (1.0 + 0.24 * np.exp(-time * 19))
    phase = TAU * np.cumsum(hz) / SAMPLE_RATE
    signal = (np.sin(phase) + 0.19 * np.sin(2.0 * phase)) * np.exp(-time * 11.5) * amplitude
    left, right = pan(pan_value)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_crash(mix: np.ndarray, start: float, amplitude: float) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(1.4 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    shimmer = noise - np.roll(noise, 3)
    signal = shimmer * np.exp(-time * 2.7) * amplitude
    mix[start_index : start_index + length, 0] += signal * 0.62
    mix[start_index : start_index + length, 1] += np.roll(signal, 9) * 0.62


def add_riser(mix: np.ndarray, start: float, duration: float, amplitude: float) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(duration * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    progress = np.linspace(0.0, 1.0, length)
    noise = RNG.standard_normal(length)
    airy = noise - np.roll(noise, max(1, int(SAMPLE_RATE / 9000)))
    sweep_hz = 82 + 760 * progress ** 2
    sweep = np.sin(TAU * np.cumsum(sweep_hz) / SAMPLE_RATE)
    shape = progress ** 2.2 * np.minimum(1.0, (1.0 - progress) * 18)
    signal = (airy * 0.26 + sweep * 0.74) * shape * amplitude
    mix[start_index : start_index + length, 0] += signal * (0.65 + 0.2 * np.sin(TAU * 0.21 * time))
    mix[start_index : start_index + length, 1] += signal * (0.65 + 0.2 * np.cos(TAU * 0.19 * time))


PROGRESSIONS = {
    "cruise": (
        (50, (62, 66, 69)), (47, (59, 62, 66)), (43, (55, 59, 62)), (45, (57, 61, 64)),
        (50, (62, 66, 69)), (52, (64, 67, 71)), (43, (55, 59, 62)), (45, (57, 61, 64)),
    ),
    "flyby": (
        (43, (55, 59, 62)), (50, (62, 66, 69)), (45, (57, 61, 64)), (47, (59, 62, 66)),
        (43, (55, 59, 62)), (52, (64, 67, 71)), (45, (57, 61, 64)), (50, (62, 66, 69)),
    ),
    "ambush": (
        (47, (59, 62, 66)), (43, (55, 59, 62)), (50, (62, 66, 69)), (45, (57, 61, 64)),
        (47, (59, 62, 66)), (52, (64, 67, 71)), (43, (55, 59, 62)), (45, (57, 61, 64)),
    ),
    "rescue": (
        (50, (62, 66, 69)), (45, (57, 61, 64)), (47, (59, 62, 66)), (43, (55, 59, 62)),
        (50, (62, 66, 69)), (43, (55, 59, 62)), (45, (57, 61, 64)), (45, (57, 61, 64)),
    ),
    "fiesta": (
        (50, (62, 66, 69)), (43, (55, 59, 62)), (47, (59, 62, 66)), (45, (57, 61, 64)),
        (52, (64, 67, 71)), (43, (55, 59, 62)), (45, (57, 61, 64)), (50, (62, 66, 69)),
    ),
}


MELODIES = {
    "cruise": (
        (0, 74, 1.5), (2, 78, 0.5), (3, 81, 1.0), (4.5, 83, 1.5), (7, 81, 0.75),
        (8, 78, 1.25), (10, 76, 0.75), (12, 74, 2.0), (16, 81, 1.0), (17.5, 83, 0.75),
        (19, 86, 1.5), (22, 83, 0.75), (24, 81, 1.0), (26, 78, 0.75), (28, 76, 2.5),
    ),
    "flyby": (
        (0, 79, 0.75), (1, 81, 0.75), (2, 83, 1.5), (4.5, 86, 0.75), (6, 83, 1.5),
        (8, 81, 0.5), (9, 83, 0.5), (10, 86, 1.75), (13, 88, 0.75), (14.5, 86, 1.0),
        (16, 83, 0.75), (17, 81, 0.75), (18.5, 79, 1.5), (22, 86, 1.0), (24, 88, 0.75),
        (25, 86, 0.75), (26, 83, 1.0), (28, 81, 2.5),
    ),
    "ambush": (
        (0, 71, 0.5), (1.5, 74, 0.5), (3, 78, 1.25), (6, 76, 0.75), (8, 71, 0.5),
        (9, 72, 0.5), (10, 74, 1.5), (13, 78, 0.5), (14, 81, 1.0), (16, 83, 0.75),
        (18, 78, 0.75), (20, 76, 1.5), (24, 74, 0.5), (25, 78, 0.5), (26, 81, 0.75),
        (28, 83, 2.0),
    ),
    "rescue": (
        (0, 74, 0.5), (0.75, 78, 0.5), (1.5, 81, 1.5), (4, 83, 0.75), (5, 86, 0.75),
        (6, 90, 1.5), (8.5, 86, 0.5), (9.25, 83, 0.5), (10, 81, 1.5), (13, 78, 0.75),
        (14, 81, 1.5), (16, 86, 0.5), (16.75, 90, 0.5), (17.5, 93, 1.75), (21, 90, 0.75),
        (22, 86, 1.0), (24, 83, 0.5), (25, 86, 0.5), (26, 90, 0.75), (28, 93, 2.5),
    ),
    "fiesta": (
        (0, 78, 0.5), (0.75, 81, 0.5), (1.5, 86, 1.5), (4, 83, 0.5), (5, 86, 0.5),
        (6, 90, 1.5), (8, 88, 0.75), (9, 86, 0.75), (10.5, 83, 1.25), (13, 81, 0.75),
        (14, 86, 1.5), (16, 90, 0.5), (16.75, 88, 0.5), (17.5, 86, 1.0), (20, 83, 0.5),
        (21, 86, 0.5), (22, 90, 1.5), (25, 93, 0.75), (26, 90, 0.75), (28, 86, 2.5),
    ),
}


STYLE = {
    "cruise": dict(lead="lead", arp="pulse", lead_level=0.092, arp_level=0.028, bass=0.086, drums=0.083, brass=0.052, hats=8),
    "flyby": dict(lead="bell", arp="pulse", lead_level=0.087, arp_level=0.032, bass=0.084, drums=0.087, brass=0.066, hats=16),
    "ambush": dict(lead="brass", arp="pulse", lead_level=0.084, arp_level=0.036, bass=0.1, drums=0.1, brass=0.058, hats=16),
    "rescue": dict(lead="lead", arp="pulse", lead_level=0.108, arp_level=0.038, bass=0.105, drums=0.112, brass=0.075, hats=16),
    "fiesta": dict(lead="lead", arp="pluck", lead_level=0.1, arp_level=0.036, bass=0.094, drums=0.101, brass=0.074, hats=16),
}


def arrange_action(mix: np.ndarray, start: float, bpm: int, bars: int, style: str) -> None:
    beat = 60.0 / bpm
    bar = beat * 4.0
    progression = PROGRESSIONS[style]
    settings = STYLE[style]
    melody = MELODIES[style]

    for bar_index in range(bars):
        bar_start = start + bar_index * bar
        root, chord = progression[bar_index % len(progression)]
        section = (bar_index // 8) % 3
        lift = 12 if style == "rescue" and bar_index >= 24 else 0
        pad_level = 0.027 + (0.004 if style in {"rescue", "fiesta"} else 0.0)

        for note_index, note in enumerate(chord):
            add_note(mix, bar_start, bar * 0.99, note + lift, pad_level, "pad", (note_index - 1) * 0.55)

        # Driving eighth-note synth bass: root/fifth motion keeps the chase moving.
        for step in range(8):
            bass_note = root - 12 + (7 if step in {3, 6} else 0) + lift
            accent = 1.12 if step in {0, 4} else 0.82
            add_note(mix, bar_start + step * beat / 2, beat * 0.39, bass_note, settings["bass"] * accent, "bass", -0.08)

        # Fast stereo arpeggios become denser in the most urgent arrangements.
        arp_steps = settings["hats"]
        for step in range(arp_steps):
            arp_note = chord[(step + bar_index) % len(chord)] + 12 + (12 if step % 4 == 3 else 0) + lift
            add_note(
                mix,
                bar_start + step * bar / arp_steps,
                bar / arp_steps * 0.62,
                arp_note,
                settings["arp_level"] * (1.15 if step % 4 == 0 else 0.88),
                settings["arp"],
                -0.76 + (step % 8) * 0.22,
            )

        # Heroic brass stabs leave deliberate gaps for the lead melody.
        stab_positions = (0.0, 2.5) if style in {"cruise", "ambush"} else (0.0, 1.5, 3.0)
        for position in stab_positions:
            for note_index, note in enumerate(chord):
                add_note(mix, bar_start + position * beat + note_index * 0.009, beat * 0.28, note + 12 + lift, settings["brass"], "brass", (note_index - 1) * 0.34)

        kicks = (0.0, 2.0) if style == "cruise" else (0.0, 1.5, 2.0, 3.5) if style in {"rescue", "ambush"} else (0.0, 2.0, 3.5)
        for hit_index, position in enumerate(kicks):
            add_kick(mix, bar_start + position * beat, settings["drums"] * (1.08 if hit_index == 0 else 0.76))
        add_snare(mix, bar_start + beat, settings["drums"] * 0.92)
        add_snare(mix, bar_start + beat * 3, settings["drums"])
        for step in range(settings["hats"]):
            add_hat(mix, bar_start + step * bar / settings["hats"], settings["drums"] * (0.26 if step % 2 else 0.34), (-1) ** step * 0.7)

        if bar_index % 8 == 0:
            add_crash(mix, bar_start, 0.035 + settings["drums"] * 0.24)
        if bar_index % 8 == 7:
            for fill_index, position in enumerate((3.0, 3.25, 3.5, 3.75)):
                add_tom(mix, bar_start + position * beat, 45 + fill_index * 2, settings["drums"] * (0.55 + fill_index * 0.11), -0.65 + fill_index * 0.43)

        # Each eight-bar block gets a distinct melodic contour. Later blocks
        # lift or answer the phrase instead of merely replaying it.
        if bar_index % 8 == 0:
            phrase_shift = 0 if section == 0 else 2 if section == 1 else 5
            if style == "ambush" and section == 1:
                phrase_shift = -2
            for event_index, (position, note, duration) in enumerate(melody):
                if position >= 32 or position * beat >= (bars - bar_index) * bar:
                    continue
                lead_start = bar_start + position * beat
                add_note(mix, lead_start, duration * beat, note + phrase_shift + lift, settings["lead_level"], settings["lead"], -0.5 + (event_index % 7) * 0.16)
                if style in {"rescue", "fiesta"} and event_index % 4 == 0:
                    add_note(mix, lead_start, duration * beat * 1.08, note - 12 + phrase_shift + lift, settings["lead_level"] * 0.34, "brass", 0.42)


def compose_departure() -> np.ndarray:
    duration = 64.0
    intro_end = 24.0
    mix = np.zeros((int(duration * SAMPLE_RATE), 2), dtype=np.float64)
    intro_chords = (
        (50, (62, 66, 69, 76)),
        (47, (59, 62, 66, 69)),
        (43, (55, 59, 62, 66)),
        (45, (57, 61, 64, 69)),
        (47, (59, 62, 66, 71)),
        (45, (57, 62, 64, 69)),
    )

    # Six evolving four-second scenes imply an 86 BPM pulse while leaving
    # enough sky and silence for Olivia's runway cinematic.
    for scene, (root, chord) in enumerate(intro_chords):
        scene_start = scene * 4.0
        intensity = scene / (len(intro_chords) - 1)
        for note_index, note in enumerate(chord):
            add_note(mix, scene_start, 4.12, note, 0.025 + intensity * 0.011, "pad", -0.72 + note_index * 0.48)
        add_note(mix, scene_start, 3.9, root - 24, 0.055 + intensity * 0.025, "bass", -0.12)
        pulse_interval = 2.0 - intensity * 1.18
        pulse = scene_start
        while pulse < scene_start + 4.0:
            add_note(mix, pulse, 0.34 + intensity * 0.12, root - 12, 0.026 + intensity * 0.035, "bass", -0.2)
            pulse += pulse_interval

        if scene >= 1:
            arp_interval = 0.72 - intensity * 0.38
            arp_time = scene_start + (0.4 if scene % 2 else 0.1)
            arp_index = 0
            while arp_time < scene_start + 3.9:
                note = chord[arp_index % len(chord)] + 12 + (12 if scene >= 4 and arp_index % 4 == 3 else 0)
                add_note(mix, arp_time, 0.18 + intensity * 0.08, note, 0.014 + intensity * 0.027, "pulse", -0.7 + (arp_index % 7) * 0.22)
                arp_time += arp_interval
                arp_index += 1

    # A mysterious original five-note signal gradually reveals the heroic theme.
    intro_melody = (
        (7.8, 74, 1.3), (10.5, 81, 0.65), (12.2, 78, 1.4),
        (15.0, 76, 0.8), (16.3, 81, 1.2), (18.4, 83, 0.8),
        (19.6, 86, 1.6), (22.0, 81, 0.6), (22.8, 86, 0.8),
    )
    for index, (start, note, duration_note) in enumerate(intro_melody):
        level = 0.047 + start / intro_end * 0.035
        add_note(mix, start, duration_note, note, level, "lead", -0.44 + index % 5 * 0.22)
        add_note(mix, start + 0.39, duration_note * 0.72, note - 12, level * 0.28, "bell", 0.48)

    # The pulse accelerates from roughly 86 toward 132 BPM before ignition.
    heartbeat = 13.5
    while heartbeat < intro_end - 0.18:
        progress = (heartbeat - 13.5) / (intro_end - 13.5)
        add_kick(mix, heartbeat, 0.025 + progress * 0.067)
        if progress > 0.58:
            add_snare(mix, heartbeat + 0.34 - progress * 0.1, 0.018 + progress * 0.046)
        heartbeat += 1.39 - progress * 0.93
    add_riser(mix, 19.0, 5.0, 0.11)
    for roll in np.arange(22.0, 23.95, 0.24):
        add_snare(mix, float(roll), 0.022 + (roll - 22.0) * 0.026)

    # At exactly 24 seconds the sky opens into the full 132 BPM action theme.
    add_crash(mix, intro_end, 0.095)
    arrange_action(mix, intro_end, 132, 22, "rescue")
    intro_samples = int(intro_end * SAMPLE_RATE)
    intro_progress = np.linspace(0.0, 1.0, intro_samples, dtype=np.float64)
    mix[:intro_samples] *= (0.27 + 0.39 * intro_progress ** 0.82)[:, None]
    mix[intro_samples:] *= 1.12
    return master(mix, loopable=False)


def master(mix: np.ndarray, loopable: bool) -> np.ndarray:
    # Two cross-channel analog delays create width and motion without copying
    # either channel. Looping cues wrap their delay tails for seamless repeats.
    wet = mix.copy()
    for seconds, amount in ((0.17, 0.13), (0.37, 0.065)):
        delay = int(seconds * SAMPLE_RATE)
        if loopable:
            wet[:, 0] += np.roll(mix[:, 1], delay) * amount
            wet[:, 1] += np.roll(mix[:, 0], delay) * amount
        else:
            wet[delay:, 0] += mix[:-delay, 1] * amount
            wet[delay:, 1] += mix[:-delay, 0] * amount

    # Gentle stereo movement and analog saturation keep the score wide but centered.
    time = np.arange(wet.shape[0], dtype=np.float64) / SAMPLE_RATE
    wet[:, 0] *= 0.96 + 0.04 * np.sin(TAU * 0.071 * time)
    wet[:, 1] *= 0.96 + 0.04 * np.cos(TAU * 0.067 * time)
    wet -= np.mean(wet, axis=0, keepdims=True)
    wet = np.tanh(wet * 1.22)
    peak = float(np.max(np.abs(wet))) or 1.0
    wet *= 0.9 / peak
    fade = min(int((0.055 if loopable else 0.085) * SAMPLE_RATE), wet.shape[0] // 2)
    wet[:fade] *= np.linspace(0.0, 1.0, fade)[:, None]
    wet[-fade:] *= np.linspace(1.0, 0.0, fade)[:, None]
    return wet


def compose(track: Track) -> np.ndarray:
    if track.style == "departure":
        return compose_departure()
    beat = 60.0 / track.bpm
    duration = track.bars * beat * 4.0
    mix = np.zeros((int(duration * SAMPLE_RATE), 2), dtype=np.float64)
    arrange_action(mix, 0.0, track.bpm, track.bars, track.style)
    return master(mix, loopable=True)


def write_wave(path: Path, audio: np.ndarray) -> None:
    pcm = np.clip(audio * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    # Use a versioned directory whenever the score itself changes. The Sites
    # media CDN may retain an older binary at an existing pathname even after
    # a new deployment, while a new pathname is immediately unambiguous.
    output = root / "public" / "game" / "assets" / "level1_2_sky_music" / "cinematic80s_v1"
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="jft-sky-music-") as temp_dir:
        for track in TRACKS:
            audio = compose(track)
            wav_path = Path(temp_dir) / f"{Path(track.filename).stem}.wav"
            ogg_path = output / track.filename
            write_wave(wav_path, audio)
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path),
                    # Preserve the dramatic intro-to-main dynamics; a fixed
                    # safety trim avoids the gain-riding a loudness normalizer
                    # would apply to the deliberately quiet opening.
                    "-af", "volume=-1.2dB",
                    "-metadata", f"title={track.title}",
                    "-metadata", "artist=Jumpin' For Tacos",
                    "-metadata", "album=Sky-High Salsa Rescue",
                    "-metadata", f"BPM={132 if track.style == 'departure' else track.bpm}",
                    "-ar", str(SAMPLE_RATE), "-ac", "2",
                    "-c:a", "libvorbis", "-q:a", "5", str(ogg_path),
                ],
                check=True,
            )
            print(f"generated {ogg_path.relative_to(root)} ({audio.shape[0] / SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()
