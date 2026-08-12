#!/usr/bin/env python3
"""Generate the seven-song Sunset Salsa Showdown adaptive soundtrack."""

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
RNG = np.random.default_rng(121212)


@dataclass(frozen=True)
class Track:
    filename: str
    title: str
    bpm: int
    bars: int
    style: str


TRACKS = (
    Track("music_showdown_gauntlet.ogg", "Golden Hour Kickoff", 112, 24, "gauntlet"),
    Track("music_showdown_stampede.ogg", "Guac Pack Gallop", 132, 24, "stampede"),
    Track("music_showdown_mercado.ogg", "Mercado Rooftop Bounce", 116, 24, "mercado"),
    Track("music_showdown_parade.ogg", "Parade Float Fireworks", 124, 24, "parade"),
    Track("music_showdown_boss.ogg", "El Guacodillo Rumble", 128, 24, "boss"),
    Track("music_showdown_victory.ogg", "Village Hero Victory Dash", 128, 24, "victory"),
    Track("music_showdown_fiesta.ogg", "Neon Salsa Victory", 126, 24, "fiesta"),
)


def frequency(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0)


def pan(pan_value: float) -> tuple[float, float]:
    angle = (max(-1.0, min(1.0, pan_value)) + 1.0) * math.pi / 4.0
    return math.cos(angle), math.sin(angle)


def env(length: int, attack: float, release: float, decay: float = 0.0) -> np.ndarray:
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

    if instrument == "guitar":
        signal = np.sin(phase) + 0.44 * np.sin(2.01 * phase) + 0.18 * np.sin(3.0 * phase + 0.4)
        envelope = env(length, 0.003, 0.065, 4.4)
    elif instrument == "marimba":
        signal = np.sin(phase) + 0.38 * np.sin(3.98 * phase) + 0.14 * np.sin(8.9 * phase)
        envelope = env(length, 0.002, 0.055, 6.0)
    elif instrument == "accordion":
        vibrato = 0.008 * np.sin(TAU * 5.3 * time)
        signal = np.sin(phase + vibrato) + 0.34 * np.sin(2.0 * phase + 0.6) + 0.13 * np.sin(3.0 * phase)
        envelope = env(length, 0.035, 0.11, 0.35)
    elif instrument == "brass":
        signal = np.tanh(1.25 * (np.sin(phase) + 0.42 * np.sin(2.0 * phase) + 0.16 * np.sin(3.0 * phase)))
        envelope = env(length, 0.018, 0.095, 0.75)
    elif instrument == "bell":
        signal = np.sin(phase) + 0.34 * np.sin(2.72 * phase) + 0.17 * np.sin(5.41 * phase)
        envelope = env(length, 0.002, 0.14, 4.8)
    elif instrument == "bass":
        signal = np.sin(phase) + 0.19 * np.sin(2.0 * phase)
        envelope = env(length, 0.008, 0.1, 0.65)
    elif instrument == "pad":
        signal = np.sin(phase) + 0.18 * np.sin(2.0 * phase + 0.7) + 0.09 * np.sin(0.5 * phase)
        envelope = env(length, min(0.22, duration * 0.18), min(0.4, duration * 0.22))
    else:
        raise ValueError(instrument)

    signal *= envelope * amplitude / 1.55
    left, right = pan(pan_value)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_kick(mix: np.ndarray, start: float, amplitude: float) -> None:
    start_index = int(start * SAMPLE_RATE)
    length = min(int(0.24 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    hz = 118 * np.exp(-time * 10.0) + 40
    signal = np.sin(TAU * np.cumsum(hz) / SAMPLE_RATE) * np.exp(-time * 15) * amplitude
    mix[start_index : start_index + length] += signal[:, None]


def add_conga(mix: np.ndarray, start: float, high: bool, pan_value: float, amplitude: float) -> None:
    start_index = int(start * SAMPLE_RATE)
    length = min(int(0.2 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    hz = 242 if high else 166
    signal = (np.sin(TAU * hz * time) + RNG.standard_normal(length) * np.exp(-time * 42) * 0.12)
    signal *= np.exp(-time * 13) * amplitude
    left, right = pan(pan_value)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_shaker(mix: np.ndarray, start: float, pan_value: float, amplitude: float) -> None:
    start_index = int(start * SAMPLE_RATE)
    length = min(int(0.075 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    signal = (noise - np.roll(noise, 1)) * np.exp(-time * 45) * amplitude
    left, right = pan(pan_value)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def add_clap(mix: np.ndarray, start: float, amplitude: float) -> None:
    start_index = int(start * SAMPLE_RATE)
    length = min(int(0.13 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    noise = RNG.standard_normal(length)
    bursts = np.exp(-time * 25) * (0.65 + 0.35 * np.sin(TAU * 33 * time) ** 2)
    signal = (noise - np.roll(noise, 2)) * bursts * amplitude
    mix[start_index : start_index + length] += signal[:, None]


def add_cowbell(mix: np.ndarray, start: float, pan_value: float, amplitude: float) -> None:
    start_index = int(start * SAMPLE_RATE)
    length = min(int(0.105 * SAMPLE_RATE), mix.shape[0] - start_index)
    if length <= 0:
        return
    time = np.arange(length) / SAMPLE_RATE
    signal = (np.sin(TAU * 560 * time) + 0.58 * np.sin(TAU * 845 * time)) * np.exp(-time * 25) * amplitude
    left, right = pan(pan_value)
    mix[start_index : start_index + length, 0] += signal * left
    mix[start_index : start_index + length, 1] += signal * right


def compose(track: Track) -> np.ndarray:
    beat = 60.0 / track.bpm
    bar = beat * 4
    mix = np.zeros((int(track.bars * bar * SAMPLE_RATE), 2), dtype=np.float64)

    # These are seven separate songs, not one eight-note hook with new clothes.
    # Each gets its own tonal center, eight-bar harmony, phrase length, rests,
    # percussion grid, lead voice, and B-section contour.
    progressions = {
        "gauntlet": ((55, (55, 59, 62)), (62, (62, 66, 69)), (64, (64, 67, 71)), (60, (60, 64, 67)), (55, (55, 59, 62)), (59, (59, 62, 66)), (60, (60, 64, 67)), (62, (62, 66, 69))),
        "stampede": ((50, (50, 53, 57)), (53, (53, 57, 60)), (48, (48, 52, 55)), (50, (50, 53, 57)), (55, (55, 58, 62)), (53, (53, 57, 60)), (50, (50, 53, 57)), (57, (57, 60, 64))),
        "mercado": ((60, (60, 64, 67)), (66, (66, 69, 72)), (65, (65, 69, 72)), (67, (67, 71, 74)), (57, (57, 60, 64)), (62, (62, 65, 69)), (67, (67, 71, 74)), (60, (60, 64, 67))),
        "parade": ((57, (57, 61, 64)), (62, (62, 66, 69)), (66, (66, 69, 73)), (64, (64, 68, 71)), (59, (59, 62, 66)), (64, (64, 68, 71)), (62, (62, 66, 69)), (57, (57, 61, 64))),
        "boss": ((52, (52, 53, 59)), (53, (53, 56, 60)), (50, (50, 53, 58)), (52, (52, 55, 59)), (48, (48, 52, 55)), (49, (49, 53, 56)), (50, (50, 53, 58)), (52, (52, 53, 59))),
        "victory": ((53, (53, 57, 60)), (60, (60, 64, 67)), (62, (62, 65, 69)), (57, (57, 60, 64)), (53, (53, 57, 60)), (65, (65, 69, 72)), (60, (60, 64, 67)), (67, (67, 71, 74))),
        "fiesta": ((62, (62, 66, 69)), (57, (57, 61, 64)), (59, (59, 62, 66)), (64, (64, 68, 71)), (62, (62, 66, 69)), (66, (66, 69, 73)), (57, (57, 61, 64)), (62, (62, 66, 69))),
    }
    melody_phrases = {
        "gauntlet": ((0.0, 74, 0.75), (1.0, 79, 0.5), (2.0, 78, 0.5), (3.25, 74, 0.75), (5.0, 71, 1.25), (7.0, 74, 0.5), (8.5, 76, 0.75), (10.0, 79, 1.5), (12.5, 81, 0.5), (13.25, 79, 0.5), (14.0, 76, 1.5)),
        "stampede": ((0.0, 74, 0.3), (0.75, 69, 0.3), (1.5, 72, 0.3), (2.25, 65, 0.55), (3.5, 67, 0.3), (4.0, 74, 0.3), (4.75, 77, 0.3), (5.5, 76, 0.3), (7.0, 72, 0.55), (8.25, 69, 0.3), (9.0, 72, 0.3), (10.5, 77, 0.55), (12.0, 76, 0.3), (13.5, 72, 0.3), (15.0, 69, 0.7)),
        "mercado": ((0.0, 76, 1.35), (1.75, 79, 0.65), (3.0, 78, 1.5), (5.25, 74, 0.75), (6.5, 71, 1.0), (8.0, 72, 1.75), (10.25, 76, 0.75), (11.5, 81, 1.65), (14.0, 79, 0.5), (14.75, 76, 1.0)),
        "parade": ((0.0, 81, 0.35), (0.5, 81, 0.35), (1.0, 85, 0.8), (3.0, 83, 0.45), (3.75, 81, 0.45), (5.0, 88, 1.0), (7.0, 85, 0.35), (7.5, 83, 0.35), (8.0, 81, 0.8), (10.0, 78, 0.35), (10.5, 81, 0.35), (11.0, 85, 0.8), (13.0, 88, 0.5), (14.0, 85, 1.5)),
        "boss": ((0.0, 64, 1.5), (2.5, 65, 0.5), (4.0, 59, 1.75), (7.0, 58, 0.45), (8.0, 64, 0.65), (9.0, 63, 0.65), (10.0, 59, 1.5), (12.75, 56, 0.5), (14.0, 52, 1.6)),
        "victory": ((0.0, 72, 0.45), (0.5, 77, 0.45), (1.0, 81, 0.45), (1.5, 84, 1.0), (3.5, 81, 0.45), (4.0, 79, 0.45), (4.5, 84, 0.45), (5.0, 89, 1.5), (8.0, 77, 0.45), (8.5, 81, 0.45), (9.0, 84, 0.45), (9.5, 89, 1.0), (11.5, 91, 0.45), (12.0, 89, 0.45), (13.0, 84, 2.0)),
        "fiesta": ((0.0, 78, 0.45), (0.75, 81, 0.45), (1.5, 85, 0.7), (3.0, 83, 0.45), (4.0, 78, 0.45), (4.75, 81, 0.45), (5.5, 88, 1.0), (8.0, 90, 0.35), (8.5, 88, 0.35), (9.0, 85, 0.6), (10.5, 81, 0.45), (11.25, 83, 0.45), (12.0, 85, 0.45), (13.0, 88, 0.45), (14.0, 90, 1.4)),
    }
    rhythm_patterns = {
        "gauntlet": (0.5, 1.5, 2.5, 3.5), "stampede": (0.0, 0.75, 1.5, 2.25, 3.5),
        "mercado": (0.0, 1.5, 2.75), "parade": (0.0, 0.5, 2.0, 2.5),
        "boss": (0.0, 0.5, 1.75, 3.25), "victory": (0.0, 1.0, 2.0, 3.0),
        "fiesta": (0.0, 0.75, 1.5, 2.5, 3.25),
    }
    bass_patterns = {
        "gauntlet": (0.0, 2.0), "stampede": (0.0, 1.5, 2.25, 3.5), "mercado": (0.0, 2.75),
        "parade": (0.0, 1.0, 2.0, 3.0), "boss": (0.0, 0.5, 2.0, 3.5),
        "victory": (0.0, 1.0, 2.0, 3.0), "fiesta": (0.0, 1.5, 2.0, 3.5),
    }
    rhythm_instrument, lead_instrument, rhythm_level, lead_level, drum_level = {
        "gauntlet": ("guitar", "accordion", 0.066, 0.082, 0.043),
        "stampede": ("marimba", "brass", 0.078, 0.086, 0.069),
        "mercado": ("guitar", "accordion", 0.058, 0.088, 0.042),
        "parade": ("brass", "bell", 0.074, 0.084, 0.064),
        "boss": ("marimba", "brass", 0.076, 0.092, 0.073),
        "victory": ("guitar", "bell", 0.072, 0.102, 0.060),
        "fiesta": ("guitar", "brass", 0.078, 0.096, 0.068),
    }[track.style]
    progression = progressions[track.style]

    for bar_index in range(track.bars):
        start = bar_index * bar
        root, chord = progression[bar_index % len(progression)]
        lift = 12 if track.style == "victory" and bar_index >= 16 else 0
        pad_level = 0.014 if track.style in {"gauntlet", "mercado"} else 0.023
        for note_index, note in enumerate(chord):
            add_note(mix, start, bar * 0.98, note + lift, pad_level, "pad", (note_index - 1) * 0.42)
        for bass_index, position in enumerate(bass_patterns[track.style]):
            bass_note = root - 24 + (7 if bass_index == len(bass_patterns[track.style]) - 1 and track.style in {"stampede", "fiesta"} else 0)
            add_note(mix, start + position * beat, beat * 0.72, bass_note + lift, 0.074 if track.style != "boss" else 0.095, "bass", -0.1)
        for hit_index, position in enumerate(rhythm_patterns[track.style]):
            notes = chord if track.style in {"gauntlet", "parade", "victory", "fiesta"} else (chord[hit_index % 3],)
            for note_index, note in enumerate(notes):
                add_note(mix, start + position * beat + note_index * 0.012, beat * (0.5 if track.style == "parade" else 0.32), note + 12 + lift, rhythm_level, rhythm_instrument, (note_index - 1) * 0.32)

        if bar_index % 4 == 0:
            phrase_number = bar_index // 4
            phrase = melody_phrases[track.style]
            phrase_shift = 0
            if phrase_number % 3 == 1:
                phrase_shift = {"gauntlet": 2, "stampede": -2, "mercado": 0, "parade": -3, "boss": -1, "victory": 0, "fiesta": 2}[track.style]
            elif phrase_number % 3 == 2:
                phrase_shift = {"gauntlet": -3, "stampede": 3, "mercado": 5, "parade": 0, "boss": -5, "victory": 5, "fiesta": -2}[track.style]
            for event_index, (position, note, duration) in enumerate(phrase):
                add_note(mix, start + position * beat, duration * beat, note + phrase_shift + lift, lead_level, lead_instrument, -0.48 + (event_index % 8) * 0.13)
                if track.style == "victory" and event_index % 3 == 0:
                    add_note(mix, start + position * beat, duration * beat * 1.15, note - 12 + phrase_shift + lift, 0.04, "brass", 0.42)
                if track.style == "fiesta" and event_index % 4 == 2:
                    add_note(mix, start + (position + 0.25) * beat, duration * beat * 0.8, note - 12 + phrase_shift, 0.035, "marimba", 0.5)

        kick_positions = {
            "gauntlet": (0, 2.5), "stampede": (0, 1.5, 2.25, 3.5), "mercado": (0, 2.75),
            "parade": (0, 2), "boss": (0, 1.75, 3.25), "victory": (0, 2), "fiesta": (0, 1.5, 2, 3.5),
        }[track.style]
        for kick_index, position in enumerate(kick_positions):
            add_kick(mix, start + beat * position, drum_level * (1 if kick_index == 0 else 0.76))
        conga_positions = {
            "gauntlet": (1, 2.5, 3.5), "stampede": (0.75, 1.5, 2.25, 3.5), "mercado": (0.75, 2.0, 3.25),
            "parade": (1, 2.5, 3), "boss": (0.5, 1.75, 3.25), "victory": (0.5, 1.5, 2.5, 3.5),
            "fiesta": (0.5, 1.0, 2.5, 3.25),
        }[track.style]
        for conga_index, position in enumerate(conga_positions):
            add_conga(mix, start + beat * position, conga_index % 2 == 0, -0.42 + conga_index * 0.26, drum_level * (0.76 + conga_index % 2 * 0.13))
        shaker_steps = 12 if track.style == "stampede" else 8 if track.style not in {"mercado", "boss"} else 4
        for step in range(shaker_steps):
            add_shaker(mix, start + step * bar / shaker_steps, (-1) ** step * 0.62, drum_level * 0.3)
        if track.style not in {"mercado", "boss"}:
            add_clap(mix, start + beat, drum_level * 0.5)
            add_clap(mix, start + beat * 3, drum_level * 0.5)
        if track.style in {"parade", "victory", "fiesta"}:
            add_cowbell(mix, start + beat * 1.5, -0.35, drum_level * 0.42)
            add_cowbell(mix, start + beat * 3.5, 0.35, drum_level * 0.42)

    mix = np.tanh(mix * 1.24)
    peak = float(np.max(np.abs(mix))) or 1.0
    mix *= 0.88 / peak
    fade = min(int(0.03 * SAMPLE_RATE), mix.shape[0] // 2)
    mix[:fade] *= np.linspace(0, 1, fade)[:, None]
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return mix


def write_wave(path: Path, audio: np.ndarray) -> None:
    pcm = np.clip(audio * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output = root / "public" / "game" / "assets" / "level1_2_music"
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="jft-showdown-music-") as temp_dir:
        for track in TRACKS:
            audio = compose(track)
            wav_path = Path(temp_dir) / f"{Path(track.filename).stem}.wav"
            ogg_path = output / track.filename
            write_wave(wav_path, audio)
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path),
                 "-metadata", f"title={track.title}", "-metadata", "artist=Jumpin' For Tacos",
                 "-c:a", "libvorbis", "-q:a", "5", str(ogg_path)],
                check=True,
            )
            print(f"generated {ogg_path.relative_to(root)} ({audio.shape[0] / SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()
