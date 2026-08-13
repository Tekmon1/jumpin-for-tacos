#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import decodeAudio from "audio-decode";

const SAMPLE_RATE = 44_100;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SFX_ROOT = path.join(ROOT, "public", "game", "assets", "sfx");
const EXTERNAL_SOURCE_ROOT = path.join(ROOT, "scripts", "sfx-sources");

const externalSourceManifest = Object.freeze([
  Object.freeze({
    id: "freesound-445118",
    selected: true,
    role: "enemy-squish-body",
    sourceUrl: "https://freesound.org/people/Breviceps/sounds/445118/",
    sourcePlatform: "Freesound",
    originalFilename: "445118__breviceps__cartoon-splat.wav",
    creator: "Breviceps",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    acquisitionDate: "2026-08-13",
    attributionRequirement: "None required",
    committedSourcePath: "scripts/sfx-sources/445118__breviceps__cartoon-splat-hq-preview.mp3",
    committedPreviewSha256: "78800cb4fa3030457f7888041c2c11a89d7fab608952870e334d36a00a74c742",
    modifications: "Public HQ preview decoded to mono, short splats isolated, high/low-pass filtered, subtly repitched by enemy family, layered with restrained generated contact and release, peak-normalized.",
    disposition: "Selected; purpose-built cartoon character and multiple usable short variants.",
  }),
  Object.freeze({
    id: "freesound-382637",
    selected: false,
    role: "enemy-squish-candidate",
    sourceUrl: "https://freesound.org/people/kaydinhamby/sounds/382637/",
    sourcePlatform: "Freesound",
    originalFilename: "382637__kaydinhamby__tomato-squish.wav",
    creator: "kaydinhamby",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    acquisitionDate: "2026-08-13",
    attributionRequirement: "None required",
    modifications: "Auditioned from the public HQ preview only; not included in final assets.",
    disposition: "Not selected; realistic tomato texture and very low source level were less repeatable and playful.",
  }),
  Object.freeze({
    id: "freesound-495118",
    selected: false,
    role: "enemy-squish-candidate",
    sourceUrl: "https://freesound.org/people/nebulasnails/sounds/495118/",
    sourcePlatform: "Freesound",
    originalFilename: "495118__nebulasnails__wet-splat-1.mp3",
    creator: "nebulasnails",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    acquisitionDate: "2026-08-13",
    attributionRequirement: "None required",
    modifications: "Auditioned from the public HQ preview only; not included in final assets.",
    disposition: "Not selected; useful wet transient but read primarily as a single slap rather than a soft cartoon squash.",
  }),
  Object.freeze({
    id: "freesound-789390",
    selected: true,
    role: "aircraft-propeller-loop",
    sourceUrl: "https://freesound.org/people/modusmogulus/sounds/789390/",
    sourcePlatform: "Freesound",
    originalFilename: "789390__modusmogulus__airplane-propeller-loop.wav",
    creator: "modusmogulus",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    acquisitionDate: "2026-08-13",
    attributionRequirement: "None required",
    committedSourcePath: "scripts/sfx-sources/789390__modusmogulus__airplane-propeller-loop-hq-preview.mp3",
    committedPreviewSha256: "17876345d851cf3c939f2fd26834cd327181e59a01c1a89aaab88bdbc624a797",
    modifications: "Public HQ preview decoded and downmixed, rumble/hiss filtered, wrap-crossfaded into a stable loop, peak-normalized, then spatialized and gain/pitch-ramped at runtime.",
    disposition: "Selected; real field-recorded Cessna identity and the most stable repeatable propeller bed.",
  }),
  Object.freeze({
    id: "freesound-251971",
    selected: true,
    role: "aircraft-approach-departure",
    sourceUrl: "https://freesound.org/people/clif_creates/sounds/251971/",
    sourcePlatform: "Freesound",
    originalFilename: "251971__clif_creates__propeller-plane.wav",
    creator: "clif_creates",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    acquisitionDate: "2026-08-13",
    attributionRequirement: "None required",
    committedSourcePath: "scripts/sfx-sources/251971__clif_creates__propeller-plane-hq-preview.mp3",
    committedPreviewSha256: "2be11106d51275bd7d26cfad21946c1f19596076893c945367fd6fa7ccafdeca",
    modifications: "Public HQ preview decoded to mono; distant approach and receding tail isolated, time-compressed, phone-focused, layered with restrained generated air punctuation, peak-normalized.",
    disposition: "Selected; natural distance arc complements the close propeller loop.",
  }),
  Object.freeze({
    id: "freesound-814318",
    selected: false,
    role: "aircraft-propeller-candidate",
    sourceUrl: "https://freesound.org/people/gis_sweden/sounds/814318/",
    sourcePlatform: "Freesound",
    originalFilename: "814318__gis_sweden__distant-airplane-loop.wav",
    creator: "gis_sweden",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    acquisitionDate: "2026-08-13",
    attributionRequirement: "None required",
    modifications: "Auditioned from the public HQ preview only; not included in final assets.",
    disposition: "Not selected; useful distance but a pronounced whole-file swell was less controllable than runtime-authored distance gain.",
  }),
]);

const externalAudio = new Map();
const filteredExternalAudio = new Map();

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

function sampleLinear(samples, position) {
  const index = Math.floor(position);
  const fraction = position - index;
  if (index < 0 || index >= samples.length) return 0;
  const next = samples[Math.min(samples.length - 1, index + 1)];
  return samples[index] + (next - samples[index]) * fraction;
}

function resample(samples, sourceRate) {
  if (sourceRate === SAMPLE_RATE) return Float64Array.from(samples);
  const outputLength = Math.max(1, Math.round(samples.length * SAMPLE_RATE / sourceRate));
  const output = new Float64Array(outputLength);
  const ratio = sourceRate / SAMPLE_RATE;
  for (let index = 0; index < output.length; index += 1) {
    output[index] = sampleLinear(samples, index * ratio);
  }
  return output;
}

async function loadExternalAudio() {
  for (const source of externalSourceManifest.filter(({ selected }) => selected)) {
    const absolutePath = path.join(EXTERNAL_SOURCE_ROOT, path.basename(source.committedSourcePath));
    const encoded = await readFile(absolutePath);
    const actualHash = createHash("sha256").update(encoded).digest("hex");
    if (actualHash !== source.committedPreviewSha256) {
      throw new Error(`External source hash mismatch for ${source.id}: ${actualHash}`);
    }
    const decoded = await decodeAudio(encoded);
    const channels = decoded.channelData || [];
    if (!channels.length) throw new Error(`External source did not decode: ${source.id}`);
    const mono = new Float64Array(channels[0].length);
    for (const channel of channels) {
      for (let index = 0; index < mono.length; index += 1) mono[index] += channel[index] / channels.length;
    }
    const samples = resample(mono, decoded.sampleRate);
    externalAudio.set(source.id, Object.freeze({
      samples,
      sampleRate: SAMPLE_RATE,
      durationSeconds: samples.length / SAMPLE_RATE,
      originalSampleRate: decoded.sampleRate,
      originalChannels: channels.length,
    }));
  }
}

function filteredExternal(sourceId, highpassHz = 0, lowpassHz = SAMPLE_RATE / 2) {
  const cacheKey = `${sourceId}:${highpassHz}:${lowpassHz}`;
  if (filteredExternalAudio.has(cacheKey)) return filteredExternalAudio.get(cacheKey);
  const source = externalAudio.get(sourceId);
  if (!source) throw new Error(`External source not loaded: ${sourceId}`);
  const filtered = new Float64Array(source.samples.length);
  const lowAlpha = 1 - Math.exp((-Math.PI * 2 * Math.min(lowpassHz, SAMPLE_RATE * 0.48)) / SAMPLE_RATE);
  const highAlpha = highpassHz > 0 ? Math.exp((-Math.PI * 2 * highpassHz) / SAMPLE_RATE) : 0;
  let low = 0;
  let previousLow = 0;
  let high = 0;
  for (let index = 0; index < source.samples.length; index += 1) {
    low += (source.samples[index] - low) * lowAlpha;
    if (highpassHz > 0) {
      high = highAlpha * (high + low - previousLow);
      previousLow = low;
      filtered[index] = high;
    } else {
      filtered[index] = low;
    }
  }
  filteredExternalAudio.set(cacheKey, filtered);
  return filtered;
}

function addExternalClip(sound, {
  sourceId,
  sourceStart = 0,
  start = 0,
  duration,
  gain = 1,
  rate = 1,
  fadeIn = 0.006,
  fadeOut = 0.035,
  highpassHz = 0,
  lowpassHz = SAMPLE_RATE / 2,
} = {}) {
  const source = filteredExternal(sourceId, highpassHz, lowpassHz);
  const startSample = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endSample = Math.min(sound.samples.length, Math.ceil((start + duration) * SAMPLE_RATE));
  for (let index = startSample; index < endSample; index += 1) {
    const localTime = index / SAMPLE_RATE - start;
    const sourcePosition = (sourceStart + localTime * rate) * SAMPLE_RATE;
    if (sourcePosition < 0 || sourcePosition >= source.length - 1) break;
    const attack = fadeIn > 0 ? Math.min(1, localTime / fadeIn) : 1;
    const release = fadeOut > 0 ? Math.min(1, (duration - localTime) / fadeOut) : 1;
    sound.samples[index] += sampleLinear(source, sourcePosition) * gain * Math.max(0, Math.min(attack, release));
  }
}

function addExternalLoop(sound, {
  sourceId,
  sourceStart,
  sourceEnd,
  crossfade = 0.28,
  gain = 1,
  highpassHz = 0,
  lowpassHz = SAMPLE_RATE / 2,
} = {}) {
  const source = filteredExternal(sourceId, highpassHz, lowpassHz);
  const sourceLength = sourceEnd - sourceStart;
  const expectedDuration = sourceLength - crossfade;
  if (Math.abs(sound.samples.length / SAMPLE_RATE - expectedDuration) > 1 / SAMPLE_RATE) {
    throw new Error(`External loop duration mismatch for ${sourceId}`);
  }
  for (let index = 0; index < sound.samples.length; index += 1) {
    const localTime = index / SAMPLE_RATE;
    let value;
    if (localTime < crossfade) {
      const progress = localTime / crossfade;
      const tail = sampleLinear(source, (sourceEnd - crossfade + localTime) * SAMPLE_RATE);
      const head = sampleLinear(source, (sourceStart + localTime) * SAMPLE_RATE);
      value = tail * Math.cos(progress * Math.PI * 0.5) + head * Math.sin(progress * Math.PI * 0.5);
    } else {
      value = sampleLinear(source, (sourceStart + localTime) * SAMPLE_RATE);
    }
    sound.samples[index] += value * gain;
  }
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

const cartoonSquishTraits = Object.freeze({
  tomato: Object.freeze({ body: 330, smear: 920, pop: 560, brightness: 0.94 }),
  onion: Object.freeze({ body: 390, smear: 1_080, pop: 640, brightness: 1.08 }),
  chili: Object.freeze({ body: 365, smear: 1_220, pop: 720, brightness: 1.2 }),
  jalapeno: Object.freeze({ body: 410, smear: 1_340, pop: 790, brightness: 1.3 }),
  lime: Object.freeze({ body: 430, smear: 1_480, pop: 840, brightness: 1.38 }),
  queso: Object.freeze({ body: 285, smear: 780, pop: 510, brightness: 0.78 }),
  slime: Object.freeze({ body: 250, smear: 690, pop: 450, brightness: 0.68 }),
  knight: Object.freeze({ body: 470, smear: 1_280, pop: 720, brightness: 1.48 }),
  guac: Object.freeze({ body: 265, smear: 740, pop: 500, brightness: 0.72 }),
  churro: Object.freeze({ body: 440, smear: 1_150, pop: 690, brightness: 1.42 }),
  mole: Object.freeze({ body: 300, smear: 860, pop: 540, brightness: 0.82 }),
  crab: Object.freeze({ body: 430, smear: 1_250, pop: 710, brightness: 1.5 }),
  coconut: Object.freeze({ body: 310, smear: 940, pop: 560, brightness: 1.2 }),
  seagull: Object.freeze({ body: 460, smear: 1_420, pop: 850, brightness: 1.4 }),
  puffer: Object.freeze({ body: 260, smear: 780, pop: 590, brightness: 0.86 }),
  tiki: Object.freeze({ body: 360, smear: 1_020, pop: 630, brightness: 1.38 }),
  marshmallow: Object.freeze({ body: 220, smear: 620, pop: 430, brightness: 0.58 }),
  pineapple: Object.freeze({ body: 420, smear: 1_210, pop: 720, brightness: 1.46 }),
  nacho: Object.freeze({ body: 450, smear: 1_330, pop: 760, brightness: 1.56 }),
  ash: Object.freeze({ body: 240, smear: 720, pop: 470, brightness: 0.64 }),
  berry: Object.freeze({ body: 310, smear: 900, pop: 570, brightness: 0.88 }),
  mango: Object.freeze({ body: 340, smear: 980, pop: 610, brightness: 0.96 }),
  spaghetti: Object.freeze({ body: 270, smear: 820, pop: 520, brightness: 0.76 }),
  pepper: Object.freeze({ body: 410, smear: 1_360, pop: 810, brightness: 1.34 }),
  popcorn: Object.freeze({ body: 500, smear: 1_520, pop: 930, brightness: 1.62 }),
  cotton: Object.freeze({ body: 210, smear: 650, pop: 450, brightness: 0.62 }),
  pretzel: Object.freeze({ body: 460, smear: 1_260, pop: 760, brightness: 1.54 }),
  lemon: Object.freeze({ body: 440, smear: 1_490, pop: 900, brightness: 1.5 }),
  bumper: Object.freeze({ body: 290, smear: 920, pop: 610, brightness: 1.16 }),
  corndog: Object.freeze({ body: 370, smear: 1_050, pop: 650, brightness: 1.16 }),
});

function addProceduralEnemySquish(sound, {
  start = 0,
  gain = 0.8,
  type = "tomato",
  variant = 0,
} = {}) {
  const traits = cartoonSquishTraits[type] || cartoonSquishTraits.tomato;
  const alternate = variant % 2;
  const body = traits.body * (alternate ? 0.94 : 1);
  const smear = traits.smear * (alternate ? 0.9 : 1);
  const pop = traits.pop * (alternate ? 0.92 : 1);
  const coreDuration = 0.148 + alternate * 0.018;

  // A padded compression transient gives the contact a physical beginning
  // without the dry shell-crack that made ordinary contacts read as impacts.
  addNoise(sound, {
    start,
    duration: 0.038,
    gain: gain * (alternate ? 0.13 : 0.15),
    attack: 0.0008,
    releasePower: 2.7,
    lowpassHz: 1_900 + traits.brightness * 360,
    highpassHz: 150,
    crackle: 0.004,
  });
  addTone(sound, {
    start,
    duration: 0.052,
    frequency: body * 1.32,
    endFrequency: body * 0.68,
    gain: gain * 0.12,
    wave: "sine",
    attack: 0.0015,
    releasePower: 2.25,
  });

  // The broad wet smear is deliberately louder and longer than the transient.
  // Its midrange stays readable on a phone while the descending body supplies
  // the playful SQUISH / SQUASH / SCHLUP gesture without a synthetic chirp.
  addNoise(sound, {
    start: start + 0.012,
    duration: coreDuration,
    gain: gain * (alternate ? 1 : 0.96),
    attack: 0.006,
    releasePower: alternate ? 1.32 : 1.42,
    lowpassHz: 1_450 + traits.brightness * 190,
    highpassHz: 125,
    crackle: 0.006,
  });
  addNoise(sound, {
    start: start + 0.02,
    duration: coreDuration - 0.018,
    gain: gain * 0.46,
    attack: 0.005,
    releasePower: alternate ? 1.55 : 1.68,
    lowpassHz: smear * 1.62,
    highpassHz: Math.max(190, smear * 0.28),
    crackle: 0.004,
  });
  addTone(sound, {
    start: start + 0.01,
    duration: coreDuration,
    frequency: body * (alternate ? 1.02 : 1.1),
    endFrequency: body * (alternate ? 0.3 : 0.36),
    gain: gain * 0.44,
    wave: "sine",
    attack: 0.006,
    releasePower: alternate ? 1.4 : 1.52,
    vibratoHz: 21 + alternate * 3,
    vibratoDepth: 0.022,
  });
  addTone(sound, {
    start: start + 0.022,
    duration: coreDuration - 0.028,
    frequency: smear * 0.72,
    endFrequency: smear * (alternate ? 0.25 : 0.3),
    gain: gain * 0.09,
    wave: "sine",
    attack: 0.005,
    releasePower: 1.82,
    vibratoHz: 19,
    vibratoDepth: 0.018,
  });

  // A tiny wet release completes the squash. It falls downward and never
  // rises, reserving the unmistakable upward BOING for a perfect bounce.
  addNoise(sound, {
    start: start + 0.118 + alternate * 0.012,
    duration: 0.062,
    gain: gain * 0.28,
    attack: 0.0018,
    releasePower: 2.15,
    lowpassHz: 1_650,
    highpassHz: 230,
    crackle: 0.006,
  });
  addTone(sound, {
    start: start + 0.126 + alternate * 0.014,
    duration: 0.054,
    frequency: pop * 0.66,
    endFrequency: pop * 0.38,
    gain: gain * 0.14,
    wave: "sine",
    attack: 0.002,
    releasePower: 2.8,
  });
}

function addCartoonEnemySquish(sound, {
  start = 0,
  gain = 0.8,
  type = "tomato",
  variant = 0,
} = {}) {
  const traits = cartoonSquishTraits[type] || cartoonSquishTraits.tomato;
  const alternate = variant % 2;
  const sourceStart = alternate ? 0.188 : 0.008;
  const sourceRate = 0.94 + traits.brightness * 0.045 + alternate * 0.035;

  // The CC0 cartoon recording is the unmistakable physical body. A quieter
  // deterministic contact/release layer retains enemy-family variation and
  // phone-speaker definition without turning the result back into a synth cue.
  addExternalClip(sound, {
    sourceId: "freesound-445118",
    sourceStart,
    start,
    duration: alternate ? 0.205 : 0.19,
    gain: gain * (alternate ? 0.94 : 0.9),
    rate: sourceRate,
    fadeIn: 0.002,
    fadeOut: 0.026,
    highpassHz: 135,
    lowpassHz: 5_400,
  });
  addProceduralEnemySquish(sound, {
    start,
    gain: gain * 0.31,
    type,
    variant,
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
      tomato: { boing: 320, rise: 1.78 },
      onion: { boing: 352, rise: 1.72 },
      chili: { boing: 392, rise: 1.84 },
      jalapeno: { boing: 430, rise: 1.9 },
    }[type];
    addCartoonEnemySquish(sound, { start: 0, gain: 0.88, type, variant: 0 });
    addNoise(sound, {
      start: 0.07,
      duration: 0.045,
      gain: 0.2,
      attack: 0.0005,
      releasePower: 3.8,
      lowpassHz: 4_800,
      highpassHz: 720,
    });
    addBoing(sound, { start: 0.094, gain: 0.68, frequency: traits.boing, rise: traits.rise });
  },
  enemySplat(sound, type = "tomato", variant = 0) {
    // Keep this recipe name for the frozen semantic event and asset paths.
    addCartoonEnemySquish(sound, { start: 0, gain: 0.94, type, variant });
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
    recipes.loopTexture(sound, "air", 0);
  },
  identity(sound, style = "spark", variant = 0) {
    const profiles = {
      citrus: { base: 520, end: 1_320, bright: 1.55, body: 0.24 },
      gold: { base: 610, end: 1_480, bright: 1.35, body: 0.2 },
      spice: { base: 310, end: 1_020, bright: 1.65, body: 0.28 },
      coconut: { base: 190, end: 620, bright: 0.82, body: 0.44 },
      air: { base: 220, end: 980, bright: 1.15, body: 0.22 },
      water: { base: 170, end: 540, bright: 0.78, body: 0.36 },
      lava: { base: 120, end: 380, bright: 0.65, body: 0.5 },
      machine: { base: 105, end: 430, bright: 0.92, body: 0.42 },
      carnival: { base: 410, end: 1_170, bright: 1.45, body: 0.25 },
      cosmic: { base: 260, end: 1_440, bright: 1.32, body: 0.2 },
      boss: { base: 95, end: 520, bright: 0.88, body: 0.58 },
      guac: { base: 145, end: 580, bright: 0.72, body: 0.5 },
      crowd: { base: 280, end: 680, bright: 1.08, body: 0.3 },
      spark: { base: 440, end: 1_100, bright: 1.25, body: 0.22 },
    };
    const p = profiles[style] || profiles.spark;
    addShellCrunch(sound, { gain: 0.28 + p.body * 0.38, brightness: p.bright });
    addNoise(sound, {
      start: 0,
      duration: 0.16 + p.body * 0.18,
      gain: 0.2 + p.body * 0.48,
      lowpassHz: 700 + p.end * 1.7,
      highpassHz: style === "water" ? 110 : 220,
      crackle: style === "lava" || style === "machine" ? 0.05 : 0.012,
      releasePower: 2.3,
    });
    addTone(sound, {
      start: 0.008,
      duration: 0.28 + p.body * 0.22,
      frequency: p.base * (1 + variant * 0.035),
      endFrequency: p.end * (1 + variant * 0.025),
      gain: 0.32 + p.body * 0.3,
      wave: style === "machine" || style === "spice" ? "saw" : "triangle",
      attack: 0.004,
      releasePower: 2,
      vibratoHz: style === "cosmic" ? 15 : style === "carnival" ? 9 : 0,
      vibratoDepth: style === "cosmic" ? 0.04 : style === "carnival" ? 0.025 : 0,
    });
    if (["gold", "citrus", "carnival", "cosmic", "crowd"].includes(style)) {
      addChord(sound, [p.end * 0.5, p.end * 0.63, p.end * 0.75], {
        start: 0.07,
        duration: 0.3,
        gain: 0.12,
        spacing: 0.035,
        rise: 1.06,
      });
    }
  },
  loopTexture(sound, style = "machine", variant = 0) {
    const base = { air: 115, water: 90, lava: 62, machine: 102, carnival: 145, cosmic: 78, crowd: 240 }[style] || 100;
    // Render past both ends, then wrap with the same steady-state envelopes so
    // the looping buffer has no periodic 1.8-second attack/release swell.
    addNoise(sound, {
      start: -0.12,
      duration: 2.04,
      gain: style === "crowd" ? 0.18 : 0.13,
      attack: 0.004,
      lowpassHz: style === "air" ? 1_500 : style === "crowd" ? 2_600 : 850,
      highpassHz: style === "crowd" ? 170 : 45,
      crackle: style === "lava" ? 0.025 : 0,
      releasePower: 0.02,
    });
    addTone(sound, {
      start: -0.12,
      duration: 2.04,
      frequency: base + variant * 9,
      endFrequency: base + variant * 9 + 4,
      gain: 0.09,
      wave: style === "machine" ? "saw" : "sine",
      attack: 0.004,
      releasePower: 0.02,
      vibratoHz: style === "cosmic" ? 0.42 : 2.8,
      vibratoDepth: style === "cosmic" ? 0.035 : 0.012,
    });
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
  ...["tomato", "onion", "chili", "jalapeno"].map((type) => [`world1/enemy-stomp-${type}-01.wav`, 0.38, -3.8, (s) => recipes.enemyStomp(s, type)]),
  ...["tomato", "onion", "chili", "jalapeno"].flatMap((type) => (
    [0, 1].map((variant) => [
      `world1/enemy-splat-${type}-0${variant + 1}.wav`,
      0.22,
      -4.8,
      (s) => recipes.enemySplat(s, type, variant),
    ])
  )),
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

const addIdentityAsset = (relativePath, style, targetPeakDb = -7, duration = 0.55, variant = 0) => {
  assets.push([relativePath, duration, targetPeakDb, (sound) => recipes.identity(sound, style, variant)]);
};

const addLoopAsset = (relativePath, style, targetPeakDb = -18, variant = 0) => {
  assets.push([relativePath, 1.8, targetPeakDb, (sound) => recipes.loopTexture(sound, style, variant)]);
};

// Shared Phase 2 power-up identities and endings.
[
  ["global/ability-lime-start-01.wav", "citrus", -5],
  ["global/ability-lime-break-01.wav", "citrus", -6],
  ["global/ability-pepper-start-01.wav", "spice", -5],
  ["global/ability-pepper-end-01.wav", "spice", -11],
  ["global/ability-coconut-start-01.wav", "coconut", -7],
  ["global/ability-coconut-bounce-01.wav", "coconut", -5],
  ["global/ability-magnet-end-01.wav", "cosmic", -11],
  ["global/ability-frenzy-end-01.wav", "spice", -9],
  ["global/ability-taco-nova-milestone-01.wav", "cosmic", -7],
  ["global/ability-taco-nova-start-01.wav", "cosmic", -3.5],
  ["global/ability-low-gravity-start-01.wav", "cosmic", -6],
  ["global/collect-air-mail-01.wav", "air", -7],
  ["global/collect-air-mail-complete-01.wav", "gold", -4],
  ["global/collect-golden-sombrero-01.wav", "gold", -4],
  ["global/collect-golden-hot-sauce-01.wav", "spice", -6],
  ["global/collect-backstage-pass-01.wav", "gold", -5],
  ["global/collect-hot-sauce-01.wav", "spice", -7],
  ["global/collect-jalapeno-01.wav", "citrus", -7],
  ["global/collect-guac-bowl-01.wav", "water", -7],
  ["global/collect-cosmic-golden-taco-01.wav", "cosmic", -3.5],
  ["global/ability-low-gravity-end-01.wav", "air", -9],
].forEach(([pathName, style, peak], index) => addIdentityAsset(pathName, style, peak, 0.58, index % 2));

// World 1 enemy extensions and authored aircraft, hazard, boss, and payoff cues.
const worldOneEnemyTypes = ["lime", "queso", "slime", "knight", "guac", "churro", "mole"];
worldOneEnemyTypes.forEach((type) => {
  assets.push([`world1/enemy-stomp-${type}-01.wav`, 0.38, -3.8, (s) => {
    recipes.enemySplat(s, type, 0);
    addBoing(s, { start: 0.094, gain: 0.68, frequency: cartoonSquishTraits[type].body, rise: 1.82 });
  }]);
  [0, 1].forEach((variant) => assets.push([
    `world1/enemy-splat-${type}-0${variant + 1}.wav`, 0.22, -4.8, (s) => recipes.enemySplat(s, type, variant),
  ]));
});

[
  ["aircraft-approach", "air", -8], ["aircraft-ready", "machine", -9],
  ["aircraft-taxi", "machine", -8], ["aircraft-takeoff", "air", -6],
  ["aircraft-boost", "air", -5], ["aircraft-depart", "air", -8],
  ["aircraft-drop-complete", "gold", -7], ["aircraft-damage", "machine", -4],
  ["aircraft-rescue-start", "air", -5], ["aircraft-crash", "boss", -3],
  ["aircraft-settled", "machine", -8], ["guac-warning", "spice", -7],
  ["guac-throw", "water", -7], ["guac-krak", "boss", -2.5],
  ["pinata-aftershock", "carnival", -5], ["pinata-jackpot", "gold", -3],
  ["stampede-start", "machine", -5], ["stampede-near-miss", "air", -7],
  ["stampede-escape", "gold", -5], ["salsa-slide", "water", -8],
  ["churro-spring", "carnival", -8], ["boss-guac-enter", "boss", -3],
  ["boss-guac-phase", "spice", -3], ["boss-guac-windup", "boss", -5],
  ["boss-guac-charge", "machine", -4], ["boss-guac-crash", "boss", -2.5],
  ["boss-guac-airstrike", "air", -4], ["boss-guac-shot", "guac", -9],
  ["boss-guac-land", "water", -7], ["boss-guac-spring", "carnival", -7],
  ["boss-guac-vulnerable", "gold", -5], ["boss-guac-clonk", "machine", -6],
  ["boss-guac-damage", "boss", -2], ["boss-guac-dodge", "air", -8],
  ["boss-guac-defeat", "carnival", -1.8], ["victory-dash-start", "gold", -4],
].forEach(([name, style, peak], index) => {
  if (["aircraft-approach", "aircraft-depart"].includes(name)) return;
  addIdentityAsset(`world1/${name}-01.wav`, style, peak, name.includes("defeat") ? 0.9 : 0.58, index % 2);
});

// Private Audio Lab baseline renders retain the prior all-procedural character
// for an honest before/final comparison without shipping rejected candidates.
assets.push(["review/enemy-squish-procedural-01.wav", 0.22, -4.8, (sound) => {
  addProceduralEnemySquish(sound, { gain: 0.94, type: "tomato", variant: 0 });
}]);
addLoopAsset("review/aircraft-propeller-procedural-01.wav", "machine", -6.5);

// The final aircraft identity combines a real stable propeller bed with a
// natural flyover's approach/receding perspectives. Runtime motion supplies
// the continuously changing distance, pan, and restrained Doppler envelope.
assets.push(["world1/aircraft-approach-01.wav", 2.35, -8, (sound) => {
  addExternalClip(sound, {
    sourceId: "freesound-251971",
    sourceStart: 2.8,
    duration: 2.3,
    rate: 1.82,
    gain: 1.35,
    fadeIn: 0.035,
    fadeOut: 0.12,
    highpassHz: 105,
    lowpassHz: 6_500,
  });
  addNoise(sound, { start: 0.72, duration: 1.55, gain: 0.055, attack: 0.18, releasePower: 1.15, lowpassHz: 2_900, highpassHz: 430 });
}]);
assets.push(["world1/aircraft-depart-01.wav", 2.55, -8.5, (sound) => {
  addExternalClip(sound, {
    sourceId: "freesound-251971",
    sourceStart: 20.75,
    duration: 2.5,
    rate: 2.08,
    gain: 1.4,
    fadeIn: 0.025,
    fadeOut: 0.18,
    highpassHz: 105,
    lowpassHz: 6_300,
  });
  addNoise(sound, { start: 0.08, duration: 2.25, gain: 0.045, attack: 0.1, releasePower: 1.55, lowpassHz: 2_600, highpassHz: 380 });
}]);
assets.push(["world1/aircraft-propeller-idle-01.wav", 4.45, -6.5, (sound) => {
  addExternalLoop(sound, {
    sourceId: "freesound-789390",
    sourceStart: 0.55,
    sourceEnd: 5.35,
    crossfade: 0.35,
    gain: 2.55,
    highpassHz: 90,
    lowpassHz: 6_800,
  });
}]);
addLoopAsset("world1/aircraft-damaged-loop-01.wav", "air", -19, 1);
addLoopAsset("world1/stampede-loop-01.wav", "machine", -19, 1);

// World 2 enemy families, vehicles, surf, caldera, stage, and concert cues.
const worldTwoEnemyTypes = ["crab", "coconut", "seagull", "puffer", "tiki", "marshmallow", "pineapple", "pepper", "nacho", "ash", "berry", "mango", "spaghetti"];
worldTwoEnemyTypes.forEach((type) => {
  assets.push([`world2/enemy-stomp-${type}-01.wav`, 0.38, -3.8, (s) => {
    recipes.enemySplat(s, type, 0);
    addBoing(s, { start: 0.094, gain: 0.68, frequency: cartoonSquishTraits[type].body, rise: 1.8 });
  }]);
  [0, 1].forEach((variant) => assets.push([
    `world2/enemy-splat-${type}-0${variant + 1}.wav`, 0.22, -4.8, (s) => recipes.enemySplat(s, type, variant),
  ]));
});

const worldTwoVehicleTypes = { catamaran: "water", trekker: "machine", roadster: "spice" };
Object.entries(worldTwoVehicleTypes).forEach(([vehicle, style]) => {
  ["approach", "accelerate", "depart", "taco-drop"].forEach((phase, index) => (
    addIdentityAsset(`world2/vehicle-${vehicle}-${phase}-01.wav`, style, phase === "taco-drop" ? -11 : -7, 0.55, index)
  ));
  addLoopAsset(`world2/vehicle-${vehicle}-idle-01.wav`, style, -19);
});
[
  ["surf-olivia-pass", "water", -8], ["surf-mount", "water", -6],
  ["surf-obstacle-clear", "gold", -9], ["surf-obstacle-hit", "coconut", -5],
  ["surf-wave-hit", "water", -4], ["surf-wave-crash-launch", "water", -3],
  ["surf-land", "water", -6], ["hazard-coconut-cannon-fire", "coconut", -7],
  ["hazard-coconut-deflect", "coconut", -6], ["hazard-geyser-warn", "water", -9],
  ["hazard-geyser-launch", "water", -5], ["volcano-warmup", "lava", -6],
  ["volcano-erupt", "lava", -2], ["stage-generator-activate", "machine", -4],
  ["concert-start", "crowd", -3], ["concert-chorus-cannon", "carnival", -6],
  ["concert-crowd-cheer", "crowd", -5], ["concert-crowd-surf-start", "water", -7],
  ["concert-crowd-surf-land", "crowd", -6], ["concert-tambourine-accent", "carnival", -9],
  ["concert-finale-lift", "crowd", -2.5], ["concert-bow", "gold", -3],
].forEach(([name, style, peak], index) => addIdentityAsset(`world2/${name}-01.wav`, style, peak, name.includes("finale") ? 0.86 : 0.58, index % 2));
addLoopAsset("world2/volcano-active-01.wav", "lava", -20);

// World 3 carnival/cosmic enemy families, rides, vehicles, bosses, and finale.
const worldThreeEnemyTypes = ["popcorn", "cotton", "pretzel", "lemon", "bumper", "corndog"];
worldThreeEnemyTypes.forEach((type) => {
  assets.push([`world3/enemy-stomp-${type}-01.wav`, 0.38, -3.8, (s) => {
    recipes.enemySplat(s, type, 0);
    addBoing(s, { start: 0.094, gain: 0.68, frequency: cartoonSquishTraits[type].body, rise: 1.88 });
  }]);
  [0, 1].forEach((variant) => assets.push([
    `world3/enemy-splat-${type}-0${variant + 1}.wav`, 0.22, -4.8, (s) => recipes.enemySplat(s, type, variant),
  ]));
});
const worldThreeVehicleTypes = { balloon: "air", coaster: "carnival", zeppelin: "cosmic" };
Object.entries(worldThreeVehicleTypes).forEach(([vehicle, style]) => {
  ["approach", "accelerate", "boost", "depart", "taco-drop"].forEach((phase, index) => (
    addIdentityAsset(`world3/vehicle-${vehicle}-${phase}-01.wav`, style, phase === "taco-drop" ? -11 : -7, 0.58, index)
  ));
  addLoopAsset(`world3/vehicle-${vehicle}-idle-01.wav`, style, -19);
});
[
  ["ride-machine-start", "machine", -7], ["ride-coaster-clack", "machine", -10],
  ["ride-coaster-drop", "air", -5], ["hazard-comet-pass", "cosmic", -7],
  ["cosmic-star-relight", "cosmic", -3], ["cosmic-finale", "cosmic", -1.8],
  ["cosmic-landing", "gold", -4], ["carnival-machine", "carnival", -8],
].forEach(([name, style, peak], index) => addIdentityAsset(`world3/${name}-01.wav`, style, peak, name.includes("defeat") || name === "cosmic-finale" ? 0.9 : 0.58, index % 2));
["enter", "move", "windup", "attack", "damage", "phase", "special", "vulnerable", "defeat", "celebrate"].forEach((phase, index) => {
  addIdentityAsset(`world3/boss-cornelius-${phase}-01.wav`, phase === "move" ? "machine" : phase === "damage" || phase === "defeat" ? "carnival" : "crowd", phase === "defeat" ? -1.8 : phase === "damage" ? -2 : -5, phase === "defeat" ? 0.9 : 0.58, index);
  addIdentityAsset(`world3/boss-ringmaster-${phase}-01.wav`, phase === "move" ? "air" : phase === "damage" || phase === "defeat" ? "cosmic" : "spice", phase === "defeat" ? -1.8 : phase === "damage" ? -2 : -5, phase === "defeat" ? 0.9 : 0.58, index + 1);
});
addLoopAsset("world3/ambience-cosmic-carnival-01.wav", "cosmic", -21);

function sourceMetadataForAsset(relativePath) {
  if (/\/enemy-(?:splat|stomp)-/.test(relativePath) && !relativePath.includes("review-")) {
    return { sourceType: "hybrid", sourceIds: ["freesound-445118"] };
  }
  if (relativePath === "world1/aircraft-propeller-idle-01.wav") {
    return { sourceType: "sourced-recording", sourceIds: ["freesound-789390"] };
  }
  if (["world1/aircraft-approach-01.wav", "world1/aircraft-depart-01.wav"].includes(relativePath)) {
    return { sourceType: "hybrid", sourceIds: ["freesound-251971"] };
  }
  return { sourceType: "procedural", sourceIds: [] };
}

async function main() {
  await loadExternalAudio();
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
      ...sourceMetadataForAsset(relativePath.replaceAll("\\", "/")),
    });
  }

  const manifest = {
    generatorVersion: "jft-sfx-phase3-v2-external-source-amendment",
    generatedAt: "deterministic-build-no-timestamp",
    source: "Deterministic hybrid library: original procedural layers plus the explicitly documented CC0 recordings below.",
    sampleRate: SAMPLE_RATE,
    assetCount: report.length,
    totalBytes: report.reduce((total, asset) => total + asset.bytes, 0),
    externalSources: externalSourceManifest,
    assets: report,
  };
  await writeFile(
    path.join(SFX_ROOT, "sfx-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Rendered ${report.length} deterministic SFX (${manifest.totalBytes} bytes).`);
}

await main();
