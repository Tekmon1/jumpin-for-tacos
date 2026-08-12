#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44_100;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SFX_ROOT = path.join(ROOT, "public", "game", "assets", "sfx");

function seedFromName(name) {
  const digest = createHash("sha256").update(name).digest();
  return digest.readUInt32LE(0) || 1;
}

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function dbToGain(db) {
  return 10 ** (db / 20);
}

function gainToDb(gain) {
  return 20 * Math.log10(Math.max(1e-9, gain));
}

function createSound(duration, seed) {
  return {
    samples: new Float64Array(Math.ceil(duration * SAMPLE_RATE)),
    random: makeRandom(seed),
  };
}

function envelope(time, duration, attack = 0.006, releasePower = 2) {
  if (time < 0 || time >= duration) return 0;
  const attackGain = Math.min(1, time / Math.max(0.0001, attack));
  const decay = 1 - time / duration;
  return attackGain * decay ** releasePower;
}

function waveAt(phase, wave = "sine") {
  const turn = phase / (Math.PI * 2);
  const wrapped = turn - Math.floor(turn);
  if (wave === "triangle") return 1 - 4 * Math.abs(wrapped - 0.5);
  if (wave === "square") return wrapped < 0.5 ? 1 : -1;
  if (wave === "saw") return wrapped * 2 - 1;
  return Math.sin(phase);
}

function addTone(sound, {
  start = 0,
  duration,
  frequency = 440,
  endFrequency = frequency,
  gain = 0.4,
  wave = "sine",
  attack = 0.005,
  releasePower = 2,
  phase = 0,
  vibratoHz = 0,
  vibratoDepth = 0,
}) {
  const startSample = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endSample = Math.min(sound.samples.length, Math.ceil((start + duration) * SAMPLE_RATE));
  let oscillatorPhase = phase;
  for (let index = startSample; index < endSample; index += 1) {
    const localTime = index / SAMPLE_RATE - start;
    const progress = clamp(localTime / duration, 0, 1);
    const pitchRatio = endFrequency > 0 && frequency > 0
      ? (endFrequency / frequency) ** progress
      : 1;
    const vibrato = vibratoDepth
      ? 1 + Math.sin(localTime * vibratoHz * Math.PI * 2) * vibratoDepth
      : 1;
    const currentFrequency = frequency * pitchRatio * vibrato;
    oscillatorPhase += (Math.PI * 2 * currentFrequency) / SAMPLE_RATE;
    sound.samples[index] += waveAt(oscillatorPhase, wave)
      * gain
      * envelope(localTime, duration, attack, releasePower);
  }
}

function addNoise(sound, {
  start = 0,
  duration,
  gain = 0.35,
  attack = 0.001,
  releasePower = 2.5,
  lowpassHz = 8_000,
  highpassHz = 0,
  crackle = 0,
}) {
  const startSample = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endSample = Math.min(sound.samples.length, Math.ceil((start + duration) * SAMPLE_RATE));
  const lowAlpha = 1 - Math.exp((-Math.PI * 2 * lowpassHz) / SAMPLE_RATE);
  const highAlpha = highpassHz > 0
    ? Math.exp((-Math.PI * 2 * highpassHz) / SAMPLE_RATE)
    : 0;
  let low = 0;
  let previousLow = 0;
  let high = 0;
  for (let index = startSample; index < endSample; index += 1) {
    const localTime = index / SAMPLE_RATE - start;
    let white = sound.random() * 2 - 1;
    if (crackle > 0 && sound.random() < crackle) white *= 2.8;
    low += (white - low) * lowAlpha;
    if (highpassHz > 0) {
      high = highAlpha * (high + low - previousLow);
      previousLow = low;
    } else {
      high = low;
    }
    sound.samples[index] += high
      * gain
      * envelope(localTime, duration, attack, releasePower);
  }
}

function addClick(sound, start, gain = 0.8, brightness = 1) {
  addNoise(sound, {
    start,
    duration: 0.012 + brightness * 0.008,
    gain,
    attack: 0.0002,
    releasePower: 4,
    lowpassHz: 7_000 + brightness * 8_000,
    highpassHz: 1_400,
    crackle: 0.12,
  });
}

function addChord(sound, notes, {
  start = 0,
  duration = 0.3,
  gain = 0.18,
  spacing = 0.025,
  wave = "triangle",
  rise = 1.03,
} = {}) {
  notes.forEach((frequency, index) => {
    addTone(sound, {
      start: start + index * spacing,
      duration,
      frequency,
      endFrequency: frequency * rise,
      gain,
      wave,
      attack: 0.004,
      releasePower: 2.2,
    });
  });
}

function addShellCrunch(sound, { start = 0, gain = 0.7, brightness = 1 } = {}) {
  addClick(sound, start, gain, brightness);
  addClick(sound, start + 0.013, gain * 0.72, brightness * 0.84);
  addClick(sound, start + 0.028, gain * 0.48, brightness * 0.68);
  addNoise(sound, {
    start,
    duration: 0.082,
    gain: gain * 0.34,
    attack: 0.0005,
    releasePower: 3.6,
    lowpassHz: 5_200 + brightness * 2_800,
    highpassHz: 850,
    crackle: 0.06,
  });
}

function addSplat(sound, { start = 0.025, gain = 0.55, tone = 360 } = {}) {
  addNoise(sound, {
    start,
    duration: 0.12,
    gain,
    attack: 0.001,
    releasePower: 2.8,
    lowpassHz: tone,
    crackle: 0.035,
  });
  addTone(sound, {
    start,
    duration: 0.14,
    frequency: tone * 0.74,
    endFrequency: 62,
    gain: gain * 0.55,
    wave: "sine",
    attack: 0.001,
    releasePower: 2.7,
  });
}

function addBoing(sound, { start = 0.07, gain = 0.55, frequency = 250, rise = 1.8 } = {}) {
  addTone(sound, {
    start,
    duration: 0.24,
    frequency,
    endFrequency: frequency * rise,
    gain,
    wave: "sine",
    attack: 0.004,
    releasePower: 2.1,
    vibratoHz: 24,
    vibratoDepth: 0.055,
  });
  addTone(sound, {
    start: start + 0.015,
    duration: 0.2,
    frequency: frequency * 2.02,
    endFrequency: frequency * rise * 2.02,
    gain: gain * 0.2,
    wave: "triangle",
    attack: 0.003,
    releasePower: 2.5,
  });
}

function softClipAndNormalize(samples, targetPeakDb) {
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.tanh(samples[index] * 1.12) / Math.tanh(1.12);
    peak = Math.max(peak, Math.abs(samples[index]));
  }
  const scale = peak > 0 ? dbToGain(targetPeakDb) / peak : 1;
  for (let index = 0; index < samples.length; index += 1) samples[index] *= scale;
}

function encodeMonoWav(samples) {
  const bytesPerSample = 2;
  const buffer = Buffer.alloc(44 + samples.length * bytesPerSample);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * bytesPerSample, 40);
  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[index]) * 32_767), 44 + index * 2);
  }
  return buffer;
}

function measure(samples) {
  let peak = 0;
  let sumSquares = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, samples.length));
  return {
    peakDbfs: Number(gainToDb(peak).toFixed(2)),
    rmsDbfs: Number(gainToDb(rms).toFixed(2)),
  };
}

const recipes = {
  uiStart(sound) {
    addClick(sound, 0, 0.34, 1.1);
    addChord(sound, [392, 523.25, 659.25], { start: 0.018, duration: 0.22, gain: 0.22, spacing: 0.038 });
  },
  uiConfirm(sound) {
    addClick(sound, 0, 0.34, 1.25);
    addTone(sound, { start: 0.008, duration: 0.12, frequency: 660, endFrequency: 920, gain: 0.38, wave: "triangle" });
  },
  uiRadio(sound) {
    addNoise(sound, { start: 0, duration: 0.038, gain: 0.22, lowpassHz: 3_800, highpassHz: 900, releasePower: 3.5 });
    addTone(sound, { start: 0.006, duration: 0.055, frequency: 880, endFrequency: 1_020, gain: 0.3, wave: "square" });
    addTone(sound, { start: 0.07, duration: 0.05, frequency: 1_120, endFrequency: 1_030, gain: 0.24, wave: "square" });
  },
  jump(sound, variant = 0) {
    addNoise(sound, { start: 0, duration: 0.055, gain: 0.16, lowpassHz: 2_200, highpassHz: 450, releasePower: 3 });
    addTone(sound, { start: 0, duration: 0.18, frequency: 250 + variant * 26, endFrequency: 610 + variant * 35, gain: 0.52, wave: "triangle", releasePower: 2.25 });
  },
  landSoft(sound, variant = 0) {
    addNoise(sound, { start: 0, duration: 0.09, gain: 0.44, lowpassHz: 520 + variant * 70, releasePower: 3.2 });
    addTone(sound, { start: 0, duration: 0.08, frequency: 118 + variant * 8, endFrequency: 74, gain: 0.34, wave: "sine", releasePower: 3 });
  },
  landHard(sound, variant = 0) {
    addShellCrunch(sound, { gain: 0.34, brightness: 0.45 + variant * 0.08 });
    addNoise(sound, { start: 0, duration: 0.16, gain: 0.55, lowpassHz: 420 + variant * 40, releasePower: 2.8 });
    addTone(sound, { start: 0, duration: 0.18, frequency: 145 + variant * 8, endFrequency: 48, gain: 0.62, wave: "sine", releasePower: 2.7 });
  },
  hurt(sound, variant = 0) {
    addClick(sound, 0, 0.38, 0.75);
    addNoise(sound, { start: 0, duration: 0.18, gain: 0.34, lowpassHz: 1_450, highpassHz: 180, releasePower: 2.4 });
    addTone(sound, { start: 0, duration: 0.28, frequency: 330 + variant * 25, endFrequency: 92, gain: 0.64, wave: "saw", releasePower: 2.2 });
  },
  fall(sound) {
    addTone(sound, { start: 0, duration: 0.44, frequency: 520, endFrequency: 82, gain: 0.56, wave: "triangle", releasePower: 1.7, vibratoHz: 7, vibratoDepth: 0.025 });
    addNoise(sound, { start: 0.06, duration: 0.36, gain: 0.12, lowpassHz: 1_600, releasePower: 1.8 });
  },
  respawnBeam(sound) {
    addNoise(sound, { start: 0, duration: 0.38, gain: 0.15, lowpassHz: 4_800, highpassHz: 1_000, releasePower: 1.8 });
    addTone(sound, { start: 0, duration: 0.4, frequency: 150, endFrequency: 920, gain: 0.44, wave: "sine", attack: 0.025, releasePower: 1.65, vibratoHz: 15, vibratoDepth: 0.018 });
    addChord(sound, [523.25, 659.25, 783.99], { start: 0.22, duration: 0.28, gain: 0.15, spacing: 0.03, rise: 1.12 });
  },
  respawnLand(sound) {
    addNoise(sound, { start: 0, duration: 0.13, gain: 0.48, lowpassHz: 640, releasePower: 3 });
    addChord(sound, [261.63, 329.63, 392], { start: 0.015, duration: 0.3, gain: 0.24, spacing: 0.02, rise: 1.02 });
  },
  taco(sound, variant = 0) {
    const base = [783.99, 880, 987.77, 1_046.5][variant % 4];
    addShellCrunch(sound, { gain: 0.25, brightness: 1.15 + variant * 0.05 });
    addTone(sound, { start: 0.008, duration: 0.13, frequency: base, endFrequency: base * 1.18, gain: 0.46, wave: "triangle", releasePower: 2.4 });
    addTone(sound, { start: 0.025, duration: 0.1, frequency: base * 2.01, endFrequency: base * 2.12, gain: 0.13, wave: "sine", releasePower: 2.7 });
  },
  tacoCluster(sound, variant = 0) {
    [0, 0.036, 0.076].forEach((start, index) => {
      addClick(sound, start, 0.22 - index * 0.035, 1.2);
      addTone(sound, { start, duration: 0.14, frequency: 740 + index * 170 + variant * 38, endFrequency: 920 + index * 205 + variant * 46, gain: 0.31, wave: "triangle", releasePower: 2.5 });
    });
  },
  goldenTaco(sound) {
    addShellCrunch(sound, { gain: 0.26, brightness: 1.35 });
    addChord(sound, [659.25, 830.61, 987.77, 1_318.51], { start: 0.012, duration: 0.32, gain: 0.23, spacing: 0.042, rise: 1.06 });
  },
  rainbowTaco(sound) {
    addShellCrunch(sound, { gain: 0.3, brightness: 1.4 });
    addChord(sound, [523.25, 659.25, 783.99, 1_046.5, 1_318.51], { start: 0.012, duration: 0.4, gain: 0.25, spacing: 0.045, rise: 1.11 });
    addNoise(sound, { start: 0.08, duration: 0.42, gain: 0.1, lowpassHz: 8_500, highpassHz: 2_800, releasePower: 1.8 });
  },
  enemyStomp(sound, type = "tomato") {
    const traits = {
      tomato: { crunch: 1.12, splat: 350, boing: 238, rise: 1.86 },
      onion: { crunch: 1.34, splat: 470, boing: 278, rise: 1.72 },
      chili: { crunch: 1.5, splat: 420, boing: 318, rise: 1.94 },
      jalapeno: { crunch: 1.42, splat: 390, boing: 350, rise: 2.02 },
    }[type];
    addShellCrunch(sound, { start: 0, gain: 0.82, brightness: traits.crunch });
    addSplat(sound, { start: 0.02, gain: 0.68, tone: traits.splat });
    addBoing(sound, { start: 0.065, gain: 0.64, frequency: traits.boing, rise: traits.rise });
  },
  enemySplat(sound, variant = 0) {
    addShellCrunch(sound, { gain: 0.52, brightness: 0.9 + variant * 0.18 });
    addSplat(sound, { start: 0.014, gain: 0.72, tone: 330 + variant * 90 });
  },
  combo(sound, variant = 0) {
    const notes = variant ? [523.25, 659.25, 783.99, 1_046.5] : [440, 554.37, 659.25];
    addClick(sound, 0, 0.35, 1.3);
    addChord(sound, notes, { start: 0.01, duration: 0.32 + variant * 0.08, gain: 0.24, spacing: 0.04, rise: 1.1 });
  },
  magnet(sound) {
    addTone(sound, { start: 0, duration: 0.42, frequency: 135, endFrequency: 760, gain: 0.48, wave: "sine", attack: 0.018, releasePower: 1.8, vibratoHz: 18, vibratoDepth: 0.04 });
    addNoise(sound, { start: 0.08, duration: 0.34, gain: 0.12, lowpassHz: 6_500, highpassHz: 1_200, releasePower: 1.8 });
  },
  frenzy(sound) {
    addShellCrunch(sound, { gain: 0.3, brightness: 1.35 });
    addTone(sound, { start: 0, duration: 0.5, frequency: 180, endFrequency: 820, gain: 0.44, wave: "saw", attack: 0.012, releasePower: 1.65 });
    addChord(sound, [523.25, 659.25, 783.99, 1_046.5], { start: 0.12, duration: 0.42, gain: 0.2, spacing: 0.05, rise: 1.12 });
  },
  checkpoint(sound) {
    addClick(sound, 0, 0.32, 1.2);
    addTone(sound, { start: 0, duration: 0.3, frequency: 180, endFrequency: 520, gain: 0.3, wave: "sine", releasePower: 1.9 });
    addChord(sound, [392, 523.25, 659.25, 783.99], { start: 0.05, duration: 0.4, gain: 0.23, spacing: 0.055, rise: 1.04 });
  },
  pinataHit(sound, variant = 0) {
    addShellCrunch(sound, { gain: 0.68, brightness: 1.05 + variant * 0.2 });
    addTone(sound, { start: 0.01, duration: 0.17, frequency: 310 + variant * 55, endFrequency: 520 + variant * 80, gain: 0.42, wave: "triangle", releasePower: 2.4 });
  },
  pinataBreak(sound) {
    addShellCrunch(sound, { gain: 1, brightness: 1.55 });
    addNoise(sound, { start: 0, duration: 0.38, gain: 0.7, lowpassHz: 1_600, highpassHz: 90, crackle: 0.08, releasePower: 2.1 });
    addTone(sound, { start: 0, duration: 0.44, frequency: 180, endFrequency: 47, gain: 0.8, wave: "sine", releasePower: 2.2 });
    addChord(sound, [523.25, 659.25, 783.99, 1_046.5], { start: 0.08, duration: 0.48, gain: 0.25, spacing: 0.05, rise: 1.08 });
  },
  goalEnter(sound) {
    addNoise(sound, { start: 0, duration: 0.32, gain: 0.12, lowpassHz: 8_000, highpassHz: 2_200, releasePower: 1.7 });
    addChord(sound, [392, 493.88, 587.33, 783.99], { start: 0, duration: 0.5, gain: 0.27, spacing: 0.06, rise: 1.08 });
  },
  levelComplete(sound) {
    addShellCrunch(sound, { gain: 0.28, brightness: 1.3 });
    addChord(sound, [261.63, 329.63, 392, 523.25, 659.25, 783.99], { start: 0.015, duration: 0.72, gain: 0.25, spacing: 0.07, rise: 1.04 });
    addNoise(sound, { start: 0.16, duration: 0.62, gain: 0.09, lowpassHz: 9_500, highpassHz: 3_200, releasePower: 1.4 });
  },
  powerup(sound) {
    addClick(sound, 0, 0.26, 1.1);
    addTone(sound, { start: 0, duration: 0.24, frequency: 360, endFrequency: 780, gain: 0.4, wave: "triangle", releasePower: 2 });
  },
  showdown(sound) {
    addShellCrunch(sound, { gain: 0.36, brightness: 1.2 });
    addTone(sound, { start: 0, duration: 0.34, frequency: 150, endFrequency: 560, gain: 0.52, wave: "saw", releasePower: 1.9 });
    addChord(sound, [392, 466.16, 587.33], { start: 0.12, duration: 0.3, gain: 0.18, spacing: 0.04, rise: 1.08 });
  },
  vehicle(sound, phase = "arrive") {
    const leaving = phase === "depart";
    addTone(sound, { start: 0, duration: 0.4, frequency: leaving ? 180 : 92, endFrequency: leaving ? 720 : 430, gain: 0.4, wave: "saw", attack: 0.018, releasePower: 1.7 });
    addNoise(sound, { start: 0, duration: 0.34, gain: 0.14, lowpassHz: 1_100, highpassHz: 130, releasePower: 1.8 });
    if (phase === "ready") addChord(sound, [523.25, 659.25], { start: 0.1, duration: 0.22, gain: 0.18, spacing: 0.05, rise: 1.06 });
  },
  vehicleDrop(sound) {
    addClick(sound, 0, 0.25, 1.15);
    addTone(sound, { start: 0, duration: 0.1, frequency: 490, endFrequency: 680, gain: 0.28, wave: "triangle", releasePower: 2.7 });
  },
  chaseComplete(sound) {
    addChord(sound, [440, 554.37, 659.25, 880], { start: 0, duration: 0.38, gain: 0.23, spacing: 0.045, rise: 1.08 });
  },
  goalWarning(sound) {
    addTone(sound, { start: 0, duration: 0.18, frequency: 520, endFrequency: 740, gain: 0.35, wave: "triangle", releasePower: 2.2 });
    addTone(sound, { start: 0.11, duration: 0.2, frequency: 660, endFrequency: 980, gain: 0.32, wave: "triangle", releasePower: 2.2 });
  },
  celebrationPulse(sound, variant = 0) {
    const notes = [523.25, 659.25, 783.99, 1_046.5];
    addClick(sound, 0, 0.18, 0.9);
    addTone(sound, { start: 0, duration: 0.16, frequency: notes[variant % notes.length], endFrequency: notes[variant % notes.length] * 1.08, gain: 0.32, wave: variant % 2 ? "triangle" : "sine", releasePower: 2.5 });
  },
  ambience(sound) {
    addNoise(sound, { start: 0, duration: 1.8, gain: 0.16, attack: 0.3, lowpassHz: 1_250, highpassHz: 110, releasePower: 0.65 });
    addTone(sound, { start: 0.12, duration: 1.45, frequency: 108, endFrequency: 112, gain: 0.08, wave: "sine", attack: 0.35, releasePower: 0.7, vibratoHz: 0.35, vibratoDepth: 0.018 });
  },
};

const assets = [
  ["global/ui-start-01.wav", 0.32, -9, (s) => recipes.uiStart(s)],
  ["global/ui-confirm-01.wav", 0.16, -12, (s) => recipes.uiConfirm(s)],
  ["global/ui-radio-01.wav", 0.15, -13, (s) => recipes.uiRadio(s)],
  ["global/hero-jump-01.wav", 0.2, -9.5, (s) => recipes.jump(s, 0)],
  ["global/hero-jump-02.wav", 0.2, -9.5, (s) => recipes.jump(s, 1)],
  ["global/hero-land-soft-01.wav", 0.13, -12, (s) => recipes.landSoft(s, 0)],
  ["global/hero-land-soft-02.wav", 0.13, -12, (s) => recipes.landSoft(s, 1)],
  ["global/hero-land-hard-01.wav", 0.2, -7, (s) => recipes.landHard(s, 0)],
  ["global/hero-land-hard-02.wav", 0.2, -7, (s) => recipes.landHard(s, 1)],
  ["global/hero-hurt-01.wav", 0.3, -4.5, (s) => recipes.hurt(s, 0)],
  ["global/hero-hurt-02.wav", 0.3, -4.5, (s) => recipes.hurt(s, 1)],
  ["global/hero-fall-01.wav", 0.46, -7, (s) => recipes.fall(s)],
  ["global/hero-respawn-beam-01.wav", 0.58, -5.5, (s) => recipes.respawnBeam(s)],
  ["global/hero-respawn-land-01.wav", 0.38, -5.5, (s) => recipes.respawnLand(s)],
  ...[0, 1, 2, 3].map((variant) => [`global/collect-taco-0${variant + 1}.wav`, 0.16, -11.5, (s) => recipes.taco(s, variant)]),
  ...[0, 1].map((variant) => [`global/collect-taco-cluster-0${variant + 1}.wav`, 0.26, -8.5, (s) => recipes.tacoCluster(s, variant)]),
  ["global/collect-golden-taco-01.wav", 0.46, -5.5, (s) => recipes.goldenTaco(s)],
  ["global/collect-rainbow-taco-01.wav", 0.62, -3.5, (s) => recipes.rainbowTaco(s)],
  ["global/combat-combo-milestone-01.wav", 0.44, -6, (s) => recipes.combo(s, 0)],
  ["global/combat-combo-milestone-02.wav", 0.56, -4.5, (s) => recipes.combo(s, 1)],
  ["global/ability-magnet-start-01.wav", 0.5, -5, (s) => recipes.magnet(s)],
  ["global/ability-frenzy-start-01.wav", 0.64, -3.5, (s) => recipes.frenzy(s)],
  ["global/checkpoint-activate-01.wav", 0.58, -4.5, (s) => recipes.checkpoint(s)],
  ["global/goal-enter-01.wav", 0.62, -4, (s) => recipes.goalEnter(s)],
  ["global/level-complete-01.wav", 0.92, -3, (s) => recipes.levelComplete(s)],
  ["global/collect-powerup-01.wav", 0.28, -8, (s) => recipes.powerup(s)],
  ["global/ambience-desert-breeze-01.wav", 1.8, -20, (s) => recipes.ambience(s)],
  ...["tomato", "onion", "chili", "jalapeno"].map((type) => [`world1/enemy-stomp-${type}-01.wav`, 0.36, -3.5, (s) => recipes.enemyStomp(s, type)]),
  ...[0, 1].map((variant) => [`world1/enemy-splat-0${variant + 1}.wav`, 0.22, -5.5, (s) => recipes.enemySplat(s, variant)]),
  ...[0, 1].map((variant) => [`world1/pinata-hit-0${variant + 1}.wav`, 0.22, -6, (s) => recipes.pinataHit(s, variant)]),
  ["world1/pinata-break-01.wav", 0.72, -2.5, (s) => recipes.pinataBreak(s)],
  ["world1/showdown-enter-01.wav", 0.52, -5, (s) => recipes.showdown(s)],
  ["world1/vehicle-arrive-01.wav", 0.48, -8, (s) => recipes.vehicle(s, "arrive")],
  ["world1/vehicle-ready-01.wav", 0.48, -8, (s) => recipes.vehicle(s, "ready")],
  ["world1/vehicle-depart-01.wav", 0.48, -7, (s) => recipes.vehicle(s, "depart")],
  ["world1/vehicle-drop-01.wav", 0.14, -13, (s) => recipes.vehicleDrop(s)],
  ["world1/chase-complete-01.wav", 0.5, -5, (s) => recipes.chaseComplete(s)],
  ["world1/goal-warning-01.wav", 0.38, -7, (s) => recipes.goalWarning(s)],
  ...[0, 1, 2, 3].map((variant) => [`world1/celebration-pulse-0${variant + 1}.wav`, 0.2, -12, (s) => recipes.celebrationPulse(s, variant)]),
];

async function main() {
  const report = [];
  for (const [relativePath, duration, targetPeakDb, render] of assets) {
    const seed = seedFromName(relativePath);
    const sound = createSound(duration, seed);
    render(sound);
    softClipAndNormalize(sound.samples, targetPeakDb);
    const wav = encodeMonoWav(sound.samples);
    const absolutePath = path.join(SFX_ROOT, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, wav);
    report.push({
      path: `assets/sfx/${relativePath.replaceAll("\\", "/")}`,
      bytes: wav.length,
      durationSeconds: Number((sound.samples.length / SAMPLE_RATE).toFixed(3)),
      sampleRate: SAMPLE_RATE,
      channels: 1,
      ...measure(sound.samples),
      sha256: createHash("sha256").update(wav).digest("hex"),
      seed,
    });
  }

  const manifest = {
    generatorVersion: "jft-sfx-phase1-v1",
    generatedAt: "deterministic-build-no-timestamp",
    source: "Original procedural synthesis; no third-party samples.",
    sampleRate: SAMPLE_RATE,
    assetCount: report.length,
    totalBytes: report.reduce((total, asset) => total + asset.bytes, 0),
    assets: report,
  };
  await writeFile(
    path.join(SFX_ROOT, "sfx-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Rendered ${report.length} deterministic SFX (${manifest.totalBytes} bytes).`);
}

await main();
