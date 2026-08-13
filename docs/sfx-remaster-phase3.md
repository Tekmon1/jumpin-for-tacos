# Jumpin' For Tacos Sound-Effects Remaster

## Phase 3 Final Polish and External-Source Amendment

Phase 3 is implemented on `feature/sfx-remaster-final-polish`. This amendment
addresses the two remaining creative-review items: the ordinary enemy squish
and Olivia's propeller aircraft. It keeps the semantic audio architecture,
music, gameplay, and global mix calibration intact.

Status at handoff:

- branch: `feature/sfx-remaster-final-polish`
- draft PR: <https://github.com/Tekmon1/jumpin-for-tacos/pull/5>
- merge: not performed
- production deployment: not performed
- remote preview deployment: not updated by this amendment
- final physical-iPhone and owner creative approval: pending

## Source-of-truth correction: aircraft level

The amendment request refers to Olivia's propeller aircraft as World 2-2. The
current branch establishes that World 2-2, `level2-2.html`, contains the ground
vehicle Taco Trekker. Olivia's propeller aircraft, runway takeoff, flybys, taco
drop, and receding departure are authored in World 1-2,
`level1-2.html` / `level1-2.js`.

The aircraft work was therefore integrated into the actual World 1-2 runtime.
No aircraft was fabricated in World 2-2, and no World 2-2 vehicle behavior was
changed. Both routes remain available for review so the correction can be
verified directly.

## Licensing and source policy

Every external recording considered for this amendment is CC0 1.0. No
NonCommercial, editorial-only, ripped, or unclear-license material was used.
CC0 requires no attribution, but creator and source credit are retained in the
repository for provenance.

The exact selected public HQ preview files used by the deterministic generator
are committed under `scripts/sfx-sources/`. They are source inputs, not runtime
assets and not original Jumpin For Tacos recordings. The source pages' original
download filenames are recorded separately from the committed preview names.

The machine-readable source and asset record is
`public/game/assets/sfx/sfx-manifest.json`. For every considered source it
records the URL, original filename, creator, platform, exact license, license
URL, acquisition date, attribution requirement, modifications, selection
status, and disposition. Selected source-input SHA-256 hashes are also frozen.

Acquisition date for all candidates: `2026-08-13`.

### Enemy-squish candidates

| Status | Recording | Creator / platform | Original filename | License | Decision |
| --- | --- | --- | --- | --- | --- |
| Selected | [Cartoon - Splat!](https://freesound.org/people/Breviceps/sounds/445118/) | Breviceps / Freesound | `445118__breviceps__cartoon-splat.wav` | CC0 1.0; no attribution required | Purpose-built cartoon character, several short usable splats, and strong phone-readable midrange. |
| Considered | [Tomato Squish.wav](https://freesound.org/people/kaydinhamby/sounds/382637/) | kaydinhamby / Freesound | `382637__kaydinhamby__tomato-squish.wav` | CC0 1.0; no attribution required | Not selected; more realistic texture and very low source level were less playful and repeatable. |
| Considered | [Wet Splat 1.mp3](https://freesound.org/people/nebulasnails/sounds/495118/) | nebulasnails / Freesound | `495118__nebulasnails__wet-splat-1.mp3` | CC0 1.0; no attribution required | Not selected; read mainly as one wet slap rather than a soft cartoon squash. |

Selected source input:
`scripts/sfx-sources/445118__breviceps__cartoon-splat-hq-preview.mp3`.

Processing: decoded and downmixed to mono, two short body regions isolated,
135 Hz high-pass and 5.4 kHz low-pass filtering, subtle deterministic
enemy-family repitching, short fades, restrained generated contact and residual
release layers, soft clipping, and peak normalization.

### Propeller-aircraft candidates

| Status | Recording | Creator / platform | Original filename | License | Decision |
| --- | --- | --- | --- | --- | --- |
| Selected | [Airplane Propeller Loop](https://freesound.org/people/modusmogulus/sounds/789390/) | modusmogulus / Freesound | `789390__modusmogulus__airplane-propeller-loop.wav` | CC0 1.0; no attribution required | Most stable real propeller bed and best input for runtime-authored distance motion. |
| Selected | [Propeller Plane](https://freesound.org/people/clif_creates/sounds/251971/) | clif_creates / Freesound | `251971__clif_creates__propeller-plane.wav` | CC0 1.0; no attribution required | Natural distant approach and receding tail complement the close loop. |
| Considered | [Distant Airplane - Loop](https://freesound.org/people/gis_sweden/sounds/814318/) | gis_sweden / Freesound | `814318__gis_sweden__distant-airplane-loop.wav` | CC0 1.0; no attribution required | Not selected; pronounced whole-file swell was less controllable than runtime distance gain. |

Selected source inputs:

- `scripts/sfx-sources/789390__modusmogulus__airplane-propeller-loop-hq-preview.mp3`
- `scripts/sfx-sources/251971__clif_creates__propeller-plane-hq-preview.mp3`

Loop processing: decoded/downmixed, 90 Hz high-pass and 6.8 kHz low-pass,
stable 0.55–5.35 second region isolated, 350 ms equal-power wrap crossfade,
controlled saturation, and peak normalization. Approach/departure processing:
natural early and late flyover regions isolated, time-compressed, phone-focused
with approximately 105 Hz high-pass and 6.3–6.5 kHz low-pass, short fades,
restrained generated air punctuation, and peak normalization.

## Final ordinary enemy squish

The frozen semantic ID remains `combat.enemySplat`. Its result is now:

**soft impact -> recorded juicy SQUISH / SPLAT -> tiny cartoon release**

The selected Breviceps recording supplies the dominant physical body. The
deterministic procedural layer is deliberately quieter and supplies family
identity, a padded contact, and a short downward release. It does not add the
full upward rebound. Two source-region variants plus the existing enemy-family
filter/pitch traits keep repeated defeats varied across all 30 enemy families.

All 60 non-perfect assets remain mono 44.1 kHz, 16-bit PCM, 0.22 seconds, and
-4.8 dBFS sample peak. Representative results:

| Asset | Peak | whole-file RMS |
| --- | ---: | ---: |
| Tomato squish 01 | -4.8 dBFS | -17.42 dBFS |
| Tomato squish 02 | -4.8 dBFS | -20.81 dBFS |

For tomato variant 01, the first 20 ms measure -20.11 dBFS RMS and the 20–120
ms body measures -14.49 dBFS RMS. The squish body is therefore about 5.62 dB
stronger than the onset instead of depending on a dry click.

Runtime policy is unchanged: priority 5, maximum polyphony 4, 35 ms cooldown,
4.5 dB centralized music duck, and 0.42 second release.

## Perfect squish plus bounce

The perfect semantic ID remains `combat.enemyStomp`. It begins with the same
hybrid squish family, then adds the existing pronounced upward rebound at 94 ms:

**recorded SQUISH / SPLAT -> BOING -> optional bounded combo punctuation**

Perfect assets remain 0.38 seconds and -3.8 dBFS sample peak. In the
representative tomato comparison, 120–220 ms measures -26.35 dBFS in the
ordinary squish and -13.36 dBFS in the perfect bounce: about 12.99 dB more late
rebound energy. The distinction comes from sequence and pitch motion, not an
excessive global gain increase.

Runtime policy remains priority 5, maximum polyphony 4, 32 ms cooldown, 5 dB
duck, and 0.48 second release. Combo pitch and milestone limits are unchanged.

## Propeller approach, pass, and departure

The shared engine now exposes `JFT_AUDIO.updateLoop(handle, options)`. It
smoothly updates a live loop's gain, pan, and playback rate without restarting
the buffer. Pending handles keep the newest options, mute/effects-zero resume
behavior remains intact, and loop telemetry reports current gain, position,
and pitch.

World 1-2 uses that API for both authored aircraft sequences:

- opening runway: quiet propeller start, increasing taxi presence and pitch,
  strongest takeoff presence, then a smooth receding climb;
- each flyby: gain follows actual screen distance, stereo position follows the
  rendered plane, pitch moves from +115 cents on approach to -135 cents after
  the pass, taco-drop proximity adds only a small bounded lift, and the loop is
  stopped on exit/reset;
- natural recorded approach and departure one-shots bookend the continuous bed.

The flyby loop's event gain is 0.70 on the Ambience bus. Runtime event-relative
gain ranges from 0.12 at distance to at most 1.14 near the closest pass. Stereo
pan range is 0.90. The approach/departure cues use the Gameplay bus, pan range
0.78, and a restrained 2.5 dB centralized duck. No global bus, compressor, or
master-ceiling setting was changed.

Rendered aircraft measurements:

| Asset | Duration | Peak | RMS | Bytes |
| --- | ---: | ---: | ---: | ---: |
| `aircraft-propeller-idle-01.wav` | 4.45 s | -6.5 dBFS | -16.73 dBFS | 392,534 |
| `aircraft-approach-01.wav` | 2.35 s | -8.0 dBFS | -21.00 dBFS | 207,314 |
| `aircraft-depart-01.wav` | 2.55 s | -8.5 dBFS | -22.34 dBFS | 224,954 |

The loop's beginning, middle, and end review windows measure -16.47, -17.81,
and -16.45 dBFS RMS, a 1.36 dB range. Its final-to-first sample discontinuity
is 0.0143 full scale. Automated regressions bound both stability and wrap seam.

## Assets created or revised

Runtime assets revised:

- 60 `enemy-splat-{type}-01/02.wav` files across World 1, World 2, and World 3;
- 30 `enemy-stomp-{type}-01.wav` files using the same squish plus BOING;
- `public/game/assets/sfx/world1/aircraft-propeller-idle-01.wav`;
- `public/game/assets/sfx/world1/aircraft-approach-01.wav`;
- `public/game/assets/sfx/world1/aircraft-depart-01.wav`.

Private Audio Lab baselines created:

- `public/game/assets/sfx/review/enemy-squish-procedural-01.wav`;
- `public/game/assets/sfx/review/aircraft-propeller-procedural-01.wav`.

Source inputs created:

- `scripts/sfx-sources/445118__breviceps__cartoon-splat-hq-preview.mp3`;
- `scripts/sfx-sources/789390__modusmogulus__airplane-propeller-loop-hq-preview.mp3`;
- `scripts/sfx-sources/251971__clif_creates__propeller-plane-hq-preview.mp3`;
- `scripts/sfx-sources/README.md`.

The complete runtime/review catalog is now 282 WAVs and 13,150,710 bytes
(12.54 MiB). Every manifest asset declares `procedural`, `hybrid`, or
`sourced-recording` provenance and its applicable source IDs. The two private
baseline WAVs are not requested by per-world gameplay preload groups.

`scripts/generate-sfx.mjs` remains deterministic and verifies each selected
source-input hash before decoding. `audio-decode` 3.11.4 is a pinned
development dependency used only by the generator.

## Audio Lab A/B review

Private path: `/game/audio-lab.html`

The page remains `noindex,nofollow` and unlinked from the public landing page.
It now exposes:

- Prior Procedural Squish
- Final Hybrid Enemy Squish
- Final Perfect Squish + BOING
- Squish Candidate/Final A/B
- Prior Procedural Propeller
- Final Recorded Propeller
- Approach / Pass / Depart Demo

The flyby demo uses the same shared `updateLoop` behavior as World 1-2 and adds
three bounded taco-drop taps around the closest pass. Telemetry makes the live
loop gain, position, pitch, voice/drop counts, duck amount, and bus levels
visible during review. Rejected external recordings are documented in the
manifest but are not shipped as runtime or Audio Lab assets.

## Mix decisions

Unchanged global settings:

- Music calibration 0.75
- Gameplay SFX calibration 0.95
- UI calibration 0.82
- Ambience calibration 0.42
- maximum voices 18
- compressor threshold -8 dB, ratio 10:1
- master ceiling -1 dB
- existing Music 70 / Effects 80 defaults and saved custom settings

Only the aircraft event-local gain/pan and source assets changed. Enemy duck,
priority, cooldown, polyphony, combo limits, and all other game events retain
their approved settings. There is no global rebalance.

## Preview paths

No preview was deployed or updated for this amendment. With the local Vite
preview running at `http://127.0.0.1:5173`:

- Audio Lab A/B: `http://127.0.0.1:5173/game/audio-lab.html`
- actual Olivia aircraft, World 1-2: `http://127.0.0.1:5173/game/level1-2.html`
- requested World 2-2 verification, Taco Trekker: `http://127.0.0.1:5173/game/level2-2.html`

Useful existing World 1-2 QA routes include `?openingAt=4.5` for the runway
propeller sequence and `?event=banner2&startX=13200` for the taco-drop flyby
when served through the project's QA host behavior.

## Automated and manual validation

- JavaScript syntax: PASS for generator, catalog, engine, Audio Lab, and World
  1-2 runtime.
- `npm test`: PASS, including the verified build and 33/33 rendered integration
  tests.
- deterministic second render: PASS; all 283 generated files (282 WAVs plus
  manifest) reproduced with zero SHA-256 mismatches.
- `npm run lint`: PASS with 0 errors and 27 existing/style warnings. The lint
  command now excludes the ignored generated `.sites-runtime` workspace.
- music SHA-256 integrity: PASS for every tracked pre-Phase-1 music file.
- catalog/manifest: PASS; 155 total IDs (153 gameplay plus two review-only),
  282 referenced assets, zero missing files, byte/hash parity for every asset,
  and all three selected source-input hashes verified.
- waveform regression: PASS; dominant squish body, greater than 10 dB perfect
  late-rebound separation, bounded propeller wrap seam, and less than 7 dB loop
  window variation.
- local desktop Audio Lab: PASS; all 282 assets loaded, squish A/B completed,
  both propeller comparisons completed, dynamic flyby reached gain 1.14 at
  centered position and then stopped, with zero failed assets, fallbacks,
  unknown events, effect drops, leaked loops, or console warnings/errors.
- browser-observed amendment-demo output sample peak: -8.64 dBFS after the
  configured ceiling. This is analyser sample peak, not integrated LUFS or
  inter-sample true peak.
- local World 1-2 start flow: PASS; start overlay dismissed, touch controls
  remained available, and no console warnings/errors were captured.
- local World 2-2 source-of-truth check: PASS; page and start copy identify the
  Taco Trekker, with no aircraft event introduced.
- physical iPhone Safari speaker review: pending owner review.
- physical controller unlock: pending owner review.

## Music and gameplay integrity

No `.ogg`, `.mp3`, or `.m4a` music asset is modified by this amendment. The
three newly committed MP3s are clearly separated source inputs under
`scripts/sfx-sources/`, not music and not runtime playback files.

No music composition, encoding, duration, cue, normalized playhead, crossfade,
concert clock, or choreography changed. No collision, movement, animation,
difficulty, reward, item, enemy, vehicle path, level progression, or timing
logic changed. The World 1-2 changes are audio-loop lifecycle and parameter
automation only.

## Non-asset changed files

- `package.json`
- `package-lock.json`
- `docs/sfx-remaster-phase3.md`
- `scripts/generate-sfx.mjs`
- `scripts/sfx-sources/README.md`
- `tests/rendered-html.test.mjs`
- `public/game/assets/sfx/sfx-manifest.json`
- `public/game/audio-catalog.js`
- `public/game/audio-engine.js`
- `public/game/audio-lab.html`
- `public/game/audio-lab.js`
- `public/game/level1-2.js`
- all ten audio-enabled game HTML pages, for the shared catalog/engine cache key
- `public/game/level1-2.html`, additionally for its runtime cache key

The manifest is the complete per-file binary asset list and provenance record.

## Remaining limitations and review gate

This environment cannot reproduce a physical iPhone speaker, iPhone Safari's
hardware output path, or a real controller. Automated waveform and browser
checks can bound clipping, loop seams, event routing, and lifecycle behavior,
but they cannot make the final creative judgment.

Before merge, review in this order:

1. In Audio Lab, compare prior procedural squish, final hybrid squish, and final
   perfect squish + BOING under Exploration and the Neon concert stress track.
2. Compare prior and final propeller, then run Approach / Pass / Depart Demo.
3. Play the actual World 1-2 runway opening and banner-two taco-drop flyby.
4. Verify World 2-2 still presents the Taco Trekker rather than an aircraft.
5. Repeat the decisive comparisons on a physical iPhone speaker.

Stop at this owner creative-review gate. Do not merge or deploy until explicit
approval.
