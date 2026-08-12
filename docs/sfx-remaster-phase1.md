# Sound-Effects Remaster Phase 1

Phase 1 adds a shared audio foundation and migrates only World 1-1, Sunset
Salsa Run. It deliberately leaves level mechanics, animation, collision,
difficulty, progression, music files, music cue timing, and crossfade timing
unchanged.

## Current-main audit

The audit was performed from `main` at `4fd4e9296966da2ec1ef3d0b3bdeb52276fd0b8f`
before the feature branch was created.

- The reported prototype pattern was confirmed. World 1-1, 1-2, 1-3, 2-1,
  2-2, and 2-3 each carried a local oscillator-based `sfx()` implementation.
- World 3 uses a separate oscillator-based `playTone()` implementation shared
  by its three level variants.
- World 1-1 had event-triggered music ducking. World 3 has authored cinematic
  duck states. The other five World 1 and World 2 runtimes did not have
  event-triggered ducking.
- World 1-1 effects commonly used oscillator gains around 0.025 to 0.065 while
  music played at the saved user setting, which defaults to 0.70. This supports
  the reported masking problem.

The only difference from the initial issue statement is therefore that
ducking was not absent everywhere: it existed in World 1-1 and for specific
World 3 cinematic states, but was not centralized.

## Architecture

`public/game/audio-catalog.js` defines named events and their assets, bus,
priority, cooldown, per-event polyphony, gain, pitch/gain variation, panning,
aggregation, ducking, and centralized fallback recipe. The required Phase 1
events are exposed alongside a small number of World 1-1 support events.

`public/game/audio-engine.js` exposes:

- `JFT_AUDIO.init(...)`
- `JFT_AUDIO.preload(...)`
- `JFT_AUDIO.registerMusicTracks(...)`
- `JFT_AUDIO.play(eventId, options)`
- `JFT_AUDIO.startLoop(eventId, options)`
- `JFT_AUDIO.stopLoop(handle)`
- `JFT_AUDIO.setMusicVolume(value)`
- `JFT_AUDIO.setEffectsVolume(value)`
- `JFT_AUDIO.setMuted(value)`
- `JFT_AUDIO.getTelemetry()`

The Web Audio graph is:

```text
HTML music elements -> Music -> central duck envelope --+
buffer voices ------> Gameplay SFX ---------------------+-> Master -> compressor -> -1 dB ceiling -> output
buffer voices ------> UI -------------------------------+
loop voices --------> Ambience -------------------------+
```

There is one 18-voice global effect budget. Priority-aware admission and voice
stealing protect major feedback. Events additionally carry cooldowns and
per-event polyphony limits. Variants rotate before repeating, with bounded
pitch, gain, and optional stereo variation.

Regular taco events use a 92 ms aggregation window. The first taco remains
immediate; a dense burst becomes one short cluster response rather than one
full voice per pickup. Stomps select enemy-specific shell/crunch, splat, and
elastic rebound renders. Combo excitement comes from bounded pitch lift and
punctuation at milestones, not additional uncontrolled gain.

The existing `jumpinForTacosProgressV2` record and its Music, Effects, and Mute
fields are preserved. Existing defaults remain Music 70 and Effects 80, and
saved custom settings are never replaced. Internal calibration applies 0.75 to
Music, 0.95 to Gameplay SFX, 0.82 to UI, and 0.42 to Ambience before the master
stage.

## Original sound library

`scripts/generate-sfx.mjs` renders 44.1 kHz mono PCM WAV assets using seeded
procedural synthesis. It consumes no samples. The committed manifest records
the seed, duration, byte count, sample rate, channel count, peak, RMS, and
SHA-256 for every output.

- Asset count: 51
- Total size: 1,687,752 bytes (1.61 MiB)
- Largest individual asset: below 200 KiB
- Determinism check: regenerating the full library leaves the manifest SHA-256
  unchanged

Run `npm run generate:sfx` to reproduce the library.

## Mix calibration

These figures are deterministic render measurements plus fixed gain staging;
they are not claims of a hardware true-peak measurement inside a browser.

- The existing Neon Neckties final concert master is documented by its source
  cue data at -13.4 LUFS integrated and -1.3 dBFS true peak. At the preserved
  70 Music setting, the calibrated music bus is 0.525 (-5.60 dB), yielding an
  estimated playback loudness of about -19.0 LUFS without changing the file.
- The master ceiling is fixed at -1 dB after a DynamicsCompressor stage.
- A regular taco is staged around -13.7 dBFS peak at 70/80 before simultaneous
  mix summing and compression.
- The signature stomp is staged around -6.9 dBFS peak at 70/80.
- Hurt is staged around -7.9 dBFS peak; piñata break around -5.9 dBFS; level
  complete around -6.4 dBFS.
- Ducking is event-owned but envelope-centralized: regular taco 1 dB, taco
  cluster 1.8 dB, stomp 5 dB, hurt 6.5 dB, rainbow taco 7.5 dB, and major
  piñata/complete moments 8 dB. Attack is normally 18 ms with smooth releases
  selected per event.
- The browser lab analyser observed a maximum sample peak of -4.45 dBFS during
  the Neon-backed rapid-stomp and core-demo runs. This is safely below the
  configured ceiling but is not a true-peak meter reading.

## Validation evidence

Automated:

- `npm test`: build, artifact validation, and 32 rendered-HTML/regression tests
  passed.
- Direct ESLint run: 0 errors; 27 pre-existing warnings remain.
- All new JavaScript files pass `node --check`.
- The generated library reproduced byte-for-byte.
- Regression checks lock every pre-existing music asset by SHA-256, require all
  catalog assets, enforce the World 1-1 load order, confirm the public volume
  and mute APIs, reject raw World 1-1 oscillator code, cap SFX asset size, and
  confirm the private lab is absent from landing-page navigation.

In-app browser review:

- AudioContext reached `running`; 51 assets loaded and 0 failed.
- Neon Neckties final concert master played as the loudest stress source.
- Forty-source magnet cascade: 40 suppressed source events, 8 cluster voices,
  peak 5 simultaneous voices, 0 priority drops, and 0 fallback plays.
- Ten rapid stomps: peak 6 simultaneous voices, 0 priority drops, 0 fallback
  plays, and no sample-peak clipping observed.
- Core Gameplay Demo completed with peak 6 simultaneous voices, 0 failed
  assets, 0 drops, and 0 fallback plays.
- Ambience loop start/stop, Music/Effects changes, and mute/unmute all updated
  telemetry as expected.
- The audio lab was checked at a 932 x 430 iPhone-landscape viewport with no
  horizontal overflow and all 23 required effect buttons present.
- Pointer/tap activation of the World 1-1 Start button hid the overlay and
  started exploration playback. Keyboard automation reached the playing state,
  but the background automation tab retained an autoplay block on its HTML
  media element; this is not treated as a physical-keyboard audio pass.

## Known limitations and risks

- This implementation has technical mix measurements and stress tests, but an
  AI-run review cannot substitute for a creative listening sign-off by the
  project owner on headphones, phone speakers, and desktop speakers.
- Physical iPhone Safari and a physical controller were not available in this
  environment. Their start flows remain release-gate manual tests.
- The lab analyser reports sample peak, not inter-sample true peak or a full
  post-Web-Audio LUFS measurement.
- Only World 1-1 uses the shared engine in Phase 1. The remaining World 1/2
  runtimes and World 3 oscillator code are intentionally untouched.

## Recommended rollout after Phase 1 approval

1. Get creative sign-off on taco, repeated jump/land, signature stomp, hurt,
   respawn, and major-reward tone using the lab's Neon stress track.
2. Validate unlock and mix behavior on physical iPhone Safari, desktop Chrome,
   keyboard, touch, and a standard controller before broad migration.
3. Migrate World 1-2 and 1-3 next, reusing global events and adding only their
   level-specific events. Keep their gameplay and music cue behavior frozen.
4. Migrate World 2 level-by-level, tuning ambience and boss priorities without
   changing the accepted master/bus calibration unless measured evidence calls
   for it.
5. Adapt World 3's authored cinematic duck states into requests on the shared
   duck controller, preserving its existing cue choreography.
6. At every level gate, extend event/asset/hash/load-order coverage and rerun
   the same cascade, stomp, loud-music, and physical-device acceptance matrix.
