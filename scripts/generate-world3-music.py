#!/usr/bin/env python3
"""Generate the original adaptive music suite for World 3.

The renderer intentionally uses only deterministic synthesis so every loop can
be rebuilt without external samples. It writes temporary WAV files, converts
them to browser-friendly Ogg/Vorbis, then removes the WAV intermediates.
"""

from __future__ import annotations

import math
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np


SAMPLE_RATE = 32_000
CHANNELS = 2
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "game" / "assets" / "world3_music"
RNG = np.random.default_rng(0xCA7A1A1)


@dataclass(frozen=True)
class TrackSpec:
    filename: str
    bpm: int
    root: int
    progression: tuple[tuple[int, ...], ...]
    melody: tuple[int, ...]
    palette: str
    energy: float
    bars: int = 16


TRACKS = (
    TrackSpec(
        "music_cloudtop_kickoff.ogg", 112, 60,
        ((0, 4, 7), (5, 9, 12), (7, 11, 14), (0, 4, 7)),
        (0, 4, 7, 9, 7, 4, 2, 0), "carnival", .72,
    ),
    TrackSpec(
        "music_cloudtop_balloon.ogg", 118, 65,
        ((0, 4, 7), (7, 11, 14), (9, 12, 16), (5, 9, 12)),
        (0, 2, 4, 7, 9, 7, 4, 2), "air", .68,
    ),
    TrackSpec(
        "music_cloudtop_midway.ogg", 124, 67,
        ((0, 4, 7), (9, 12, 16), (5, 9, 12), (7, 11, 14)),
        (0, 7, 4, 9, 7, 11, 9, 4), "carnival", .84,
    ),
    TrackSpec(
        "music_cloudtop_parade.ogg", 132, 60,
        ((0, 4, 7), (5, 9, 12), (9, 12, 16), (7, 11, 14)),
        (0, 4, 7, 12, 11, 9, 7, 4), "parade", .98,
    ),
    TrackSpec(
        "music_midnight_neon.ogg", 116, 57,
        ((0, 3, 7), (5, 8, 12), (8, 12, 15), (7, 10, 14)),
        (0, 3, 7, 10, 7, 5, 3, 0), "neon", .76,
    ),
    TrackSpec(
        "music_midnight_coaster.ogg", 132, 62,
        ((0, 3, 7), (8, 12, 15), (5, 9, 12), (7, 10, 14)),
        (0, 7, 10, 12, 10, 7, 5, 3), "coaster", .94,
    ),
    TrackSpec(
        "music_midnight_boss.ogg", 138, 64,
        ((0, 3, 7), (1, 5, 8), (8, 12, 15), (10, 14, 17)),
        (0, 3, 1, 7, 5, 8, 7, 3), "boss", 1.0,
    ),
    TrackSpec(
        "music_midnight_victory.ogg", 128, 67,
        ((0, 4, 7), (5, 9, 12), (9, 12, 16), (7, 11, 14)),
        (0, 4, 7, 11, 12, 11, 9, 7), "parade", .96,
    ),
    TrackSpec(
        "music_taconova_starlight.ogg", 104, 62,
        ((0, 4, 7), (9, 12, 16), (5, 9, 12), (7, 11, 14)),
        (0, 2, 4, 7, 11, 9, 7, 4), "cosmic", .7,
    ),
    TrackSpec(
        "music_taconova_rings.ogg", 126, 69,
        ((0, 4, 7), (7, 11, 14), (9, 12, 16), (5, 9, 12)),
        (0, 4, 7, 9, 12, 11, 9, 7), "heroic", .9,
    ),
    TrackSpec(
        "music_taconova_ringmaster.ogg", 140, 64,
        ((0, 3, 7), (8, 12, 15), (10, 14, 17), (7, 11, 14)),
        (0, 7, 3, 10, 8, 12, 11, 7), "boss", 1.0,
    ),
    TrackSpec(
        "music_taconova_fiesta.ogg", 134, 60,
        ((0, 4, 7), (5, 9, 12), (9, 12, 16), (7, 11, 14)),
        (0, 4, 7, 12, 14, 12, 11, 7), "finale", 1.0,
    ),
)


def midi_to_hz(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


def envelope(length: int, attack: float, release: float) -> np.ndarray:
    env = np.ones(length, dtype=np.float32)
    attack_samples = min(length, max(1, int(attack * SAMPLE_RATE)))
    release_samples = min(length, max(1, int(release * SAMPLE_RATE)))
    env[:attack_samples] = np.linspace(0, 1, attack_samples, dtype=np.float32)
    env[-release_samples:] *= np.linspace(1, 0, release_samples, dtype=np.float32)
    return env


def oscillator(kind: str, frequency: float, length: int, vibrato: float = 0) -> np.ndarray:
    time = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    phase = 2 * np.pi * frequency * time
    if vibrato:
        phase += np.sin(2 * np.pi * 5.2 * time) * vibrato
    if kind == "sine":
        return np.sin(phase)
    if kind == "triangle":
        return (2 / np.pi) * np.arcsin(np.sin(phase))
    if kind == "square":
        return np.tanh(np.sin(phase) * 4)
    if kind == "bell":
        return (
            np.sin(phase) * .62
            + np.sin(phase * 2.01) * .24
            + np.sin(phase * 3.98) * .1
            + np.sin(phase * 6.05) * .04
        )
    if kind == "brass":
        return (
            np.sin(phase) * .54
            + np.sin(phase * 2) * .23
            + np.sin(phase * 3) * .13
            + np.sin(phase * 4) * .07
            + np.sin(phase * 5) * .03
        )
    if kind == "pluck":
        return np.sin(phase) * .64 + np.sin(phase * 2) * .23 + np.sin(phase * 3) * .13
    return np.sin(phase)


def add_note(
    mix: np.ndarray,
    start: float,
    duration: float,
    note: float,
    amplitude: float,
    kind: str,
    pan: float = 0,
    attack: float = .008,
    release: float = .08,
    vibrato: float = 0,
) -> None:
    first = int(start * SAMPLE_RATE)
    if first >= len(mix):
        return
    length = min(int(duration * SAMPLE_RATE), len(mix) - first)
    if length <= 8:
        return
    tone = oscillator(kind, midi_to_hz(note), length, vibrato)
    tone *= envelope(length, attack, release) * amplitude
    if kind in {"pluck", "bell"}:
        tone *= np.exp(-np.linspace(0, 5.2 if kind == "pluck" else 3.2, length, dtype=np.float32))
    left = math.sqrt((1 - pan) * .5)
    right = math.sqrt((1 + pan) * .5)
    mix[first:first + length, 0] += tone * left
    mix[first:first + length, 1] += tone * right


def add_kick(mix: np.ndarray, start: float, amplitude: float) -> None:
    length = int(.28 * SAMPLE_RATE)
    first = int(start * SAMPLE_RATE)
    if first + length > len(mix):
        length = len(mix) - first
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    phase = 2 * np.pi * (72 * time - 42 * time * time)
    sound = np.sin(phase) * np.exp(-time * 16) * amplitude
    mix[first:first + length] += sound[:, None] * .78


def add_snare(mix: np.ndarray, start: float, amplitude: float) -> None:
    length = int(.22 * SAMPLE_RATE)
    first = int(start * SAMPLE_RATE)
    if first + length > len(mix):
        length = len(mix) - first
    if length <= 0:
        return
    time = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = RNG.normal(0, 1, length).astype(np.float32)
    body = np.sin(2 * np.pi * 185 * time)
    sound = (noise * .66 + body * .34) * np.exp(-time * 21) * amplitude
    mix[first:first + length, 0] += sound * .58
    mix[first:first + length, 1] += sound * .62


def add_hat(mix: np.ndarray, start: float, amplitude: float, pan: float) -> None:
    length = int(.075 * SAMPLE_RATE)
    first = int(start * SAMPLE_RATE)
    if first + length > len(mix):
        length = len(mix) - first
    if length <= 0:
        return
    noise = RNG.normal(0, 1, length).astype(np.float32)
    noise[1:] -= noise[:-1] * .82
    sound = noise * np.exp(-np.linspace(0, 7, length, dtype=np.float32)) * amplitude
    mix[first:first + length, 0] += sound * math.sqrt((1 - pan) * .5)
    mix[first:first + length, 1] += sound * math.sqrt((1 + pan) * .5)


def render_track(spec: TrackSpec) -> np.ndarray:
    beat = 60.0 / spec.bpm
    beats_per_bar = 4
    duration = spec.bars * beats_per_bar * beat
    mix = np.zeros((int(duration * SAMPLE_RATE), CHANNELS), dtype=np.float32)
    lead_kind = {
        "carnival": "bell",
        "air": "triangle",
        "parade": "brass",
        "neon": "square",
        "coaster": "pluck",
        "boss": "brass",
        "cosmic": "sine",
        "heroic": "brass",
        "finale": "brass",
    }[spec.palette]
    arp_kind = "bell" if spec.palette in {"carnival", "air"} else "pluck"

    for bar in range(spec.bars):
        bar_start = bar * beats_per_bar * beat
        chord = spec.progression[bar % len(spec.progression)]
        root = spec.root + chord[0]
        full = bar >= 4

        # Warm pad, written in full bars to keep the harmony continuous.
        for tone_index, interval in enumerate(chord):
            add_note(
                mix, bar_start, beat * 4.08, spec.root + interval,
                .052 + spec.energy * .018, "sine" if spec.palette == "cosmic" else "triangle",
                pan=(tone_index - 1) * .28, attack=.16, release=.34, vibrato=.018,
            )

        # Rhythmic bass with an octave lift at the end of alternating bars.
        bass_notes = (root - 24, root - 24, root - 17, root - (12 if bar % 2 else 24))
        for step, bass_note in enumerate(bass_notes):
            add_note(mix, bar_start + step * beat, beat * .72, bass_note, .15 * spec.energy, "triangle", pan=-.08, attack=.006, release=.11)

        # Bright arpeggio supplies motion without copying the lead melody.
        subdivisions = 8
        for step in range(subdivisions):
            interval = chord[(step + bar) % len(chord)] + (12 if step >= 4 else 0)
            add_note(
                mix, bar_start + step * beat / 2, beat * .34,
                spec.root + interval + 12, .046 * spec.energy, arp_kind,
                pan=-.62 + (step / (subdivisions - 1)) * 1.24,
                attack=.003, release=.055,
            )

        # Eight-note hero motif, varied every fourth bar.
        for step, interval in enumerate(spec.melody):
            if not full and step % 2:
                continue
            octave = 12 if bar % 4 == 3 and step >= 4 else 0
            add_note(
                mix, bar_start + step * beat / 2, beat * (.39 if spec.palette != "cosmic" else .68),
                spec.root + interval + 12 + octave,
                (.074 if full else .055) * spec.energy,
                lead_kind, pan=math.sin((step + bar) * .9) * .34,
                attack=.012 if lead_kind == "brass" else .004,
                release=.12, vibrato=.026 if lead_kind == "brass" else .008,
            )

        # Punchy drums. Boss/coaster tracks add four-on-the-floor.
        for beat_index in range(4):
            pulse = bar_start + beat_index * beat
            if beat_index in (0, 2) or spec.palette in {"coaster", "boss", "finale"}:
                add_kick(mix, pulse, .34 * spec.energy)
            if beat_index in (1, 3):
                add_snare(mix, pulse, .23 * spec.energy)
            add_hat(mix, pulse, .065 * spec.energy, -.36 if beat_index % 2 else .36)
            add_hat(mix, pulse + beat / 2, .046 * spec.energy, .42 if beat_index % 2 else -.42)

        # Parade/finale brass stabs widen the reward arrangements.
        if spec.palette in {"parade", "finale", "heroic"} and full:
            for stab in (0, 1.5, 3):
                for tone_index, interval in enumerate(chord):
                    add_note(
                        mix, bar_start + stab * beat, beat * .25,
                        spec.root + interval + 12, .055 * spec.energy, "brass",
                        pan=(tone_index - 1) * .24, attack=.008, release=.06,
                    )

    # Short stereo echoes and a gentle room tail.
    for delay_seconds, gain, swap in ((.19, .18, True), (.37, .1, False), (.61, .055, True)):
        offset = int(delay_seconds * SAMPLE_RATE)
        delayed = mix[:-offset].copy()
        if swap:
            delayed = delayed[:, ::-1]
        mix[offset:] += delayed * gain

    # Loop-safe micro fade and soft saturation.
    fade = min(int(.025 * SAMPLE_RATE), len(mix) // 8)
    mix[:fade] *= np.linspace(.72, 1, fade, dtype=np.float32)[:, None]
    mix[-fade:] *= np.linspace(1, .72, fade, dtype=np.float32)[:, None]
    mix = np.tanh(mix * 1.35)
    peak = float(np.max(np.abs(mix))) or 1.0
    return mix * (.89 / peak)


def write_wav(path: Path, samples: np.ndarray) -> None:
    pcm = np.clip(samples * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(CHANNELS)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for spec in TRACKS:
        destination = OUTPUT_DIR / spec.filename
        wav_path = destination.with_suffix(".wav")
        print(f"Rendering {spec.filename} ({spec.bpm} BPM, {spec.palette})")
        write_wav(wav_path, render_track(spec))
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(wav_path), "-c:a", "libvorbis", "-q:a", "5",
                str(destination),
            ],
            check=True,
        )
        wav_path.unlink()


if __name__ == "__main__":
    main()
