#!/usr/bin/env python3
"""Generate the five original Coconut Crunch Cove adaptive-music loops."""

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
RNG = np.random.default_rng(6767)


@dataclass(frozen=True)
class Track:
    filename: str
    title: str
    bpm: int
    bars: int
    style: str


TRACKS = (
    Track("music_island_shore.ogg", "Shoreline Sunrise", 104, 24, "shore"),
    Track("music_island_canopy.ogg", "Canopy Bounce", 110, 24, "canopy"),
    Track("music_island_tides.ogg", "Tidal Temple Drift", 92, 20, "tides"),
    Track("music_island_lava.ogg", "Lava Luau Rush", 132, 24, "lava"),
    Track("music_island_fiesta.ogg", "Moonlit Island Fiesta", 122, 24, "fiesta"),
)


def midi_frequency(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


def pan_gains(pan: float) -> tuple[float, float]:
    angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    return math.cos(angle), math.sin(angle)


def envelope(length: int, attack: float, release: float, decay: float = 0.0) -> np.ndarray:
    env = np.ones(length, dtype=np.float64)
    attack_samples = min(length, max(1, int(attack * SAMPLE_RATE)))
    release_samples = min(length, max(1, int(release * SAMPLE_RATE)))
    env[:attack_samples] *= np.linspace(0.0, 1.0, attack_samples, endpoint=False)
    env[-release_samples:] *= np.linspace(1.0, 0.0, release_samples)
    if decay > 0:
        env *= np.exp(-np.linspace(0.0, decay, length))
    return env


def add_instrument(
    mix: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    instrument: str,
    pan: float = 0.0,
) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    length = min(int(duration * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float64) / SAMPLE_RATE
    frequency = midi_frequency(note)
    phase = TAU * frequency * time

    if instrument == "ukulele":
        signal = (
            np.sin(phase)
            + 0.52 * np.sin(2.01 * phase + 0.18)
            + 0.24 * np.sin(3.02 * phase + 0.45)
            + 0.09 * np.sin(4.98 * phase)
        )
        env = envelope(length, 0.004, 0.06, 4.8)
    elif instrument == "marimba":
        signal = np.sin(phase) + 0.42 * np.sin(3.97 * phase) + 0.18 * np.sin(9.1 * phase)
        env = envelope(length, 0.003, 0.05, 6.2)
    elif instrument == "steelpan":
        vibrato = 1.0 + 0.0025 * np.sin(TAU * 5.2 * time)
        signal = (
            np.sin(phase * vibrato)
            + 0.38 * np.sin(2.02 * phase + 0.7)
            + 0.19 * np.sin(3.98 * phase + 1.3)
            + 0.08 * np.sin(6.05 * phase)
        )
        env = envelope(length, 0.006, 0.1, 2.8)
    elif instrument == "kalimba":
        signal = np.sin(phase) + 0.48 * np.sin(2.0 * phase) + 0.22 * np.sin(5.03 * phase)
        env = envelope(length, 0.002, 0.12, 5.2)
    elif instrument == "pad":
        signal = (
            np.sin(phase)
            + 0.22 * np.sin(2.0 * phase + 0.8)
            + 0.12 * np.sin(0.5 * phase + 0.2)
        )
        env = envelope(length, min(0.45, duration * 0.18), min(0.7, duration * 0.25))
    elif instrument == "bass":
        signal = np.sin(phase) + 0.22 * np.sin(2.0 * phase)
        env = envelope(length, 0.012, 0.12, 0.8)
    elif instrument == "flute":
        vibrato = 0.013 * np.sin(TAU * 4.8 * time)
        signal = np.sin(phase + vibrato) + 0.12 * np.sin(2.0 * phase)
        env = envelope(length, 0.08, 0.18, 0.35)
    else:
        raise ValueError(f"Unknown instrument: {instrument}")

    signal *= amplitude * env / 1.65
    left, right = pan_gains(pan)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_kick(mix: np.ndarray, start: float, amplitude: float = 0.12) -> None:
    length = int(0.26 * SAMPLE_RATE)
    start_index = int(start * SAMPLE_RATE)
    length = min(length, mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    frequency = 112.0 * np.exp(-time * 8.5) + 42.0
    phase = TAU * np.cumsum(frequency) / SAMPLE_RATE
    signal = np.sin(phase) * np.exp(-time * 14.0) * amplitude
    mix[start_index : start_index + length, :] += signal[:, None]


def add_conga(mix: np.ndarray, start: float, high: bool, pan: float, amplitude: float = 0.075) -> None:
    length = int(0.2 * SAMPLE_RATE)
    start_index = int(start * SAMPLE_RATE)
    length = min(length, mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    base = 238.0 if high else 164.0
    phase = TAU * np.cumsum(base * np.exp(-time * 2.2)) / SAMPLE_RATE
    noise = RNG.standard_normal(length) * np.exp(-time * 35.0) * 0.16
    signal = (np.sin(phase) + noise) * np.exp(-time * 13.0) * amplitude
    left, right = pan_gains(pan)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_shaker(mix: np.ndarray, start: float, pan: float, amplitude: float = 0.025) -> None:
    length = int(0.085 * SAMPLE_RATE)
    start_index = int(start * SAMPLE_RATE)
    length = min(length, mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    noise = noise - np.roll(noise, 1)
    signal = noise * np.exp(-time * 38.0) * amplitude
    left, right = pan_gains(pan)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_clave(mix: np.ndarray, start: float, pan: float, amplitude: float = 0.035) -> None:
    length = int(0.055 * SAMPLE_RATE)
    start_index = int(start * SAMPLE_RATE)
    length = min(length, mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    signal = (
        np.sin(TAU * 1550.0 * time) + 0.35 * np.sin(TAU * 2325.0 * time)
    ) * np.exp(-time * 66.0) * amplitude
    left, right = pan_gains(pan)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_water_bed(mix: np.ndarray, amplitude: float) -> None:
    length = mix.shape[0]
    time = np.arange(length) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    swell = 0.26 + 0.22 * np.sin(TAU * 0.075 * time) ** 2 + 0.12 * np.sin(TAU * 0.19 * time + 0.7)
    left = noise * swell * amplitude
    right = np.roll(noise, 173) * swell * amplitude
    mix[:, 0] += left
    mix[:, 1] += right


def compose(track: Track) -> np.ndarray:
    beat = 60.0 / track.bpm
    bar = beat * 4.0
    duration = track.bars * bar
    mix = np.zeros((int(duration * SAMPLE_RATE), 2), dtype=np.float64)

    progression = (
        (62, (62, 66, 69)),  # D
        (59, (59, 62, 66)),  # Bm
        (55, (55, 59, 62)),  # G
        (57, (57, 61, 64)),  # A
    )
    motif = (62, 64, 66, 69, 66, 64, 61, 62)

    if track.style in {"shore", "tides", "fiesta"}:
        add_water_bed(mix, 0.0018 if track.style == "tides" else 0.00105)

    for bar_index in range(track.bars):
        start = bar_index * bar
        root, chord = progression[bar_index % len(progression)]

        pad_level = {"shore": 0.024, "canopy": 0.012, "tides": 0.045, "lava": 0.009, "fiesta": 0.028}[track.style]
        for note_index, note in enumerate(chord):
            add_instrument(mix, start, bar * 0.98, note, pad_level, "pad", (note_index - 1) * 0.42)

        bass_level = {"shore": 0.075, "canopy": 0.08, "tides": 0.052, "lava": 0.105, "fiesta": 0.095}[track.style]
        for beat_index in range(4):
            bass_note = root - 24 if beat_index != 3 else progression[(bar_index + 1) % 4][0] - 24
            add_instrument(mix, start + beat_index * beat, beat * 0.86, bass_note, bass_level, "bass", -0.08)

        if track.style in {"shore", "canopy", "fiesta"}:
            chord_instrument = "ukulele" if track.style != "canopy" else "marimba"
            chord_level = 0.082 if track.style == "fiesta" else 0.066
            for beat_index in range(4):
                for note_index, note in enumerate(chord):
                    add_instrument(
                        mix,
                        start + (beat_index + 0.5) * beat + note_index * 0.012,
                        beat * 0.46,
                        note + 12,
                        chord_level,
                        chord_instrument,
                        (note_index - 1) * 0.34,
                    )

        if track.style == "lava":
            for beat_index in range(8):
                note = chord[beat_index % 3] + 12
                add_instrument(mix, start + beat_index * beat * 0.5, beat * 0.34, note, 0.066, "steelpan", (-1) ** beat_index * 0.28)

        if bar_index % 2 == 0:
            melody_instrument = {
                "shore": "steelpan",
                "canopy": "marimba",
                "tides": "kalimba",
                "lava": "steelpan",
                "fiesta": "steelpan",
            }[track.style]
            melody_level = {"shore": 0.105, "canopy": 0.095, "tides": 0.082, "lava": 0.09, "fiesta": 0.115}[track.style]
            for note_index, note in enumerate(motif):
                variation = 12 if (bar_index // 2) % 3 == 2 and note_index in {3, 4} else 0
                note_start = start + note_index * beat
                add_instrument(
                    mix,
                    note_start,
                    beat * (0.72 if track.style != "tides" else 1.25),
                    note + variation,
                    melody_level,
                    melody_instrument,
                    -0.35 + (note_index / 7.0) * 0.7,
                )
                if track.style == "fiesta" and note_index % 2 == 0:
                    add_instrument(mix, note_start + beat * 0.25, beat * 0.5, note - 12, 0.045, "marimba", 0.45)

        if track.style == "tides" and bar_index % 4 == 3:
            for note_index, note in enumerate((74, 73, 69, 66)):
                add_instrument(mix, start + note_index * beat, beat * 1.55, note, 0.05, "flute", 0.34)

        if track.style in {"lava", "fiesta"}:
            add_kick(mix, start, 0.105 if track.style == "lava" else 0.09)
            add_kick(mix, start + beat * 2, 0.085)

        shaker_steps = 8 if track.style in {"shore", "canopy", "lava", "fiesta"} else 4
        shaker_level = {"shore": 0.018, "canopy": 0.024, "tides": 0.01, "lava": 0.029, "fiesta": 0.027}[track.style]
        for step in range(shaker_steps):
            add_shaker(mix, start + step * bar / shaker_steps, (-1) ** step * 0.62, shaker_level)

        conga_level = {"shore": 0.045, "canopy": 0.056, "tides": 0.022, "lava": 0.073, "fiesta": 0.068}[track.style]
        add_conga(mix, start + beat, True, -0.38, conga_level)
        add_conga(mix, start + beat * 2.5, False, 0.38, conga_level)
        if track.style in {"canopy", "lava", "fiesta"}:
            add_conga(mix, start + beat * 3.5, True, 0.2, conga_level * 0.8)

        add_clave(mix, start + beat * 1.5, -0.48, 0.026 if track.style == "tides" else 0.035)
        add_clave(mix, start + beat * 3.5, 0.48, 0.026 if track.style == "tides" else 0.035)

    # Gentle saturation keeps dense fiesta passages warm instead of sharp.
    mix = np.tanh(mix * 1.28)
    peak = float(np.max(np.abs(mix))) or 1.0
    mix *= 0.88 / peak
    fade = min(int(0.035 * SAMPLE_RATE), mix.shape[0] // 2)
    mix[:fade] *= np.linspace(0.0, 1.0, fade)[:, None]
    mix[-fade:] *= np.linspace(1.0, 0.0, fade)[:, None]
    return mix


def write_wave(path: Path, audio: np.ndarray) -> None:
    pcm = np.clip(audio * 32767.0, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "public" / "game" / "assets" / "level2_music"
    output_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="jft-level2-music-") as temp_dir:
        temp_root = Path(temp_dir)
        for track in TRACKS:
            audio = compose(track)
            wave_path = temp_root / f"{Path(track.filename).stem}.wav"
            output_path = output_dir / track.filename
            write_wave(wave_path, audio)
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-loglevel",
                    "error",
                    "-i",
                    str(wave_path),
                    "-metadata",
                    f"title={track.title}",
                    "-metadata",
                    "artist=Jumpin' For Tacos",
                    "-c:a",
                    "libvorbis",
                    "-q:a",
                    "5",
                    str(output_path),
                ],
                check=True,
            )
            print(f"generated {output_path.relative_to(root)} ({audio.shape[0] / SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()
