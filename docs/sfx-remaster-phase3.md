# Jumpin' For Tacos Sound-Effects Remaster

## Phase 3 Final Polish, Mix, and QA Report

Phase 3 is implemented on `feature/sfx-remaster-final-polish`, based directly
on the approved Phase 2 checkpoint
`e6f3ea991246b9bbd0f28e369feb81c260d57ec0`.

This phase is deliberately narrow. It revises the one creative issue identified
in the Phase 2 review, completes the final review tooling and automated coverage,
and leaves the approved full-game catalog, buses, gameplay, visuals, and music
architecture intact.

No branch has been merged. No build has been published to the production
Jumpin' For Tacos project or domain.

## Final non-perfect enemy squish

The non-perfect outcome still uses the frozen semantic ID
`combat.enemySplat` and the existing asset paths for runtime compatibility, but
its rendered sound is now intentionally designed as:

**padded contact -> juicy SQUISH / SQUASH / SCHLUP -> tiny wet cartoon release**

The Phase 2 recipe led with three dry shell clicks plus bright, high-passed
crackle. That transient could dominate the following splat and make the result
read as a crunch or impact. Phase 3 removes that shell-crunch layer from the
ordinary contact recipe and replaces it with:

- a low-passed, padded compression onset;
- a longer midrange wet-noise smear;
- a descending, low-vibrato sine body that suggests compression rather than a
  chirp;
- a quieter secondary smear that retains each enemy family's texture; and
- a short downward residual pop that never rises like a bounce.

Two deterministic variants remain available for every enemy family. Variant 1
is a shorter squash; variant 2 is a slightly longer, lower `schlup`. Both retain
the same semantic meaning and the same bounded runtime gain variation.

The assets remain mono 44.1 kHz, 16-bit PCM, 0.22 seconds, and -4.8 dBFS sample
peak. Representative whole-file RMS measurements are:

| Asset | Peak | RMS |
| --- | ---: | ---: |
| Tomato squish 01 | -4.8 dBFS | -17.57 dBFS |
| Tomato squish 02 | -4.8 dBFS | -18.66 dBFS |
| Crab squish 01 | -4.8 dBFS | -18.17 dBFS |
| Cotton-candy squish 01 | -4.8 dBFS | -17.65 dBFS |

For the representative tomato render, the first 20 ms measure -15.74 dBFS RMS
and the 20-120 ms squish body measures -14.93 dBFS RMS. The sound therefore
does not depend on a louder click to communicate through a phone speaker; its
midrange compression body is the dominant gesture.

## Comparison with the perfect bounce

The perfect outcome continues to use `combat.enemyStomp`. It now begins with
the exact revised squish family and adds its pronounced upward `BOING` at 94 ms,
slightly later than Phase 2 so the two components read in sequence:

**SQUISH / SPLAT -> BOING -> bounded combo punctuation**

Perfect assets remain 0.38 seconds and -3.8 dBFS sample peak. Representative
RMS measurements range from approximately -15.1 to -14.5 dBFS. For the tomato
comparison, the 120-220 ms region is -29.91 dBFS in the non-perfect squish and
-13.03 dBFS in the perfect bounce: about 16.9 dB more late rebound energy.

The distinction is therefore based on timing, texture, and late upward motion,
not an uncontrolled loudness jump. Existing catalog policy remains:

| Outcome | Priority | Polyphony | Duck | Release |
| --- | ---: | ---: | ---: | ---: |
| Non-perfect squish | 5 | 4 | 4.5 dB | 0.42 s |
| Perfect bounce | 5 | 4 | 5.0 dB | 0.48 s |

Perfect combo escalation remains bounded to 42 cents per step and 294 cents
maximum, with the separate `combat.comboMilestone` punctuation for authored
tiers.

## Assets revised

No new audio asset paths were added. Ninety deterministic WAVs were revised:
60 two-variant non-perfect squishes and 30 one-variant perfect bounces.

For every enemy type below, the revised paths are:

- `enemy-splat-{type}-01.wav`
- `enemy-splat-{type}-02.wav`
- `enemy-stomp-{type}-01.wav`

### World 1: 33 revised WAVs

Directory: `public/game/assets/sfx/world1/`

- tomato
- onion
- chili
- jalapeno
- lime
- queso
- slime
- knight
- guac
- churro
- mole

### World 2: 39 revised WAVs

Directory: `public/game/assets/sfx/world2/`

- crab
- coconut
- seagull
- puffer
- tiki
- marshmallow
- pineapple
- pepper
- nacho
- ash
- berry
- mango
- spaghetti

### World 3: 18 revised WAVs

Directory: `public/game/assets/sfx/world3/`

- popcorn
- cotton
- pretzel
- lemon
- bumper
- corndog

The complete library remains 280 WAVs and 12,408,860 bytes (11.83 MiB). The
manifest generator version is `jft-sfx-phase3-v1-final-polish`. A fresh
in-place deterministic rerender checked all 281 generated files, including the
manifest, with zero byte mismatches.

## Gain and ducking decisions

No catalog event gain, bus calibration, compressor setting, master ceiling,
priority, cooldown, polyphony limit, or duck depth was changed in Phase 3.

That restraint is intentional. Instrumented stress tests showed adequate
headroom and bounded event behavior, and the approved Phase 2 hierarchy did
not reveal a clear technical reason for broad retuning. The creative correction
is made inside the enemy-contact envelope and spectral balance.

The existing mix remains:

- Music calibration: 0.75
- Gameplay SFX calibration: 0.95
- UI calibration: 0.82
- Ambience calibration: 0.42
- maximum effect voices: 18
- compressor threshold: -8 dB, 10:1 ratio
- master ceiling gain: -1 dB
- saved Music/Effects/Mute behavior: unchanged
- existing new-install settings: unchanged at Music 70 / Effects 80

The central duck envelope still preserves the stronger and longer active duck,
so a minor taco cue cannot shorten a boss or exceptional-event envelope.

Phase 3 adds an asset cache version to fetch URLs. This is not a mix change; it
ensures a browser cannot keep serving the approved Phase 2 WAV bytes after the
catalog and engine update.

## Power-up consistency

The approved Phase 2 identities for Lime, Pepper Dash, Coconut Bounce, Taco
Magnet, Taco Frenzy, premium tacos, Taco Nova, and Low Gravity remain unchanged.
No continuous loop was added to an ability.

One consistency gap from the Phase 2 report was closed: World 1-1 now emits the
existing restrained `ability.magnetEnd` and `ability.frenzyEnd` events on the
actual positive-to-zero timer edge. This changes no duration, state, collision,
or reward behavior. The other eight levels already emitted the appropriate
expiration events where those timed stages exist.

## Enemy-family consistency

All 30 enemy types now share the same softer compression grammar. The existing
type traits still vary body, smear, pop, and brightness, preserving crunchy,
hollow, rubbery, leafy, carnival, and cosmic personalities without changing
the registered outcome:

- non-perfect: immediate short squish, two rotating variants;
- perfect: the related squish plus a clearly later elastic rebound; and
- combo tier: separate bounded punctuation rather than raw loudness growth.

No enemy collision condition, bounce criterion, reward, animation, placement,
or difficulty value changed.

## Boss, Olivia vehicle, and celebration review

The Phase 2 boss, vehicle, hazard, piñata, celebration, concert, and finale
assets and catalog policy were retained. The instrumented Audio Lab review did
not expose clipping, runaway ducking, unknown events, failed assets, fallbacks,
or accumulating loops that justified redesigning approved cues.

- El Guacodillo, Sir Cornelius Pop, and Ringmaster Radish retain distinct
  entrance, anticipation, attack, damage, phase, vulnerable, defeat, and
  celebration families.
- Taco truck, aircraft, catamaran, Taco Trekker, roadster, balloon, coaster,
  and zeppelin identities remain option-selected and spatial where authored.
- Piñatas retain hit -> break -> aftershock -> jackpot sparkle structure.
- Neon concert and World 3 finale events retain authored timing and scene-gain
  behavior.

In the intentionally dense eight-drop Olivia demo, four low-priority
`vehicle.tacoDrop` launcher taps were bounded by that event's polyphony limit.
No routine, important, high, or critical event was dropped. This is the desired
voice-stealing behavior: taco collection and major gameplay feedback remain
available while redundant launcher taps are suppressed.

## Level-by-level Phase 3 findings

The browser pass loaded and started each level in sequence, confirmed that the
Phase 3 catalog and engine precede the runtime, confirmed the intended opening
music is playing, and captured no console errors. The semantic/runtime audit
also reconfirmed the Phase 2 mappings. Because this environment cannot replace
human ears on physical speakers, long-form creative listening remains an owner
review gate rather than being represented as completed.

| Level | Phase 3 finding and action |
| --- | --- |
| World 1-1 | New tomato/onion/chili/jalapeno squish family; added real timer-edge Magnet/Frenzy expiration cues. All other approved truck, piñata, movement, taco, and fiesta choices retained. |
| World 1-2 | New lime/queso and shared-family squish bodies flow through the existing aircraft, ambush, rescue, airdrop, and piñata mix. No additional change was justified. |
| World 1-3 | Six ordinary enemy families inherit the squish revision; perfect-center bounces retain BOING. El Guacodillo, stampede, pads, and fiesta mix remain unchanged. |
| World 2-1 | Five tropical enemy families inherit the revision. Catamaran, surf, coconut-cannon, powers, and fiesta policy remain unchanged. |
| World 2-2 | Caldera enemy families inherit the revision. Trekker, geyser, volcano, power-up, and luau policy remain unchanged. |
| World 2-3 | Concert enemies inherit the revision. Roadster/catamaran, generators, piñata, chorus, crowd, and 3:07 concert choreography remain unchanged. The final master remained the loudest lab stress source. |
| World 3-1 | Cloudtop enemy families inherit the revision. Balloon, ride, Taco Nova, taco rain, and carnival ambience remain unchanged. |
| World 3-2 | Bumper/corndog and shared carnival families inherit the revision. Coaster, machinery, relight, and Sir Cornelius Pop mix remain unchanged. |
| World 3-3 | Shared carnival families inherit the revision. Zeppelin, Low Gravity, Taco Nova, Ringmaster Radish, cosmic finale, and landing mix remain unchanged. |

## Audio Lab finalization

Private review path: `/game/audio-lab.html`

The page remains `noindex,nofollow` and is not linked from the public landing
page. It now provides explicit organized sections for:

- Hero
- Movement
- Ordinary Taco
- Premium Tacos
- Power-Ups
- Non-Perfect Enemy Squishes
- Perfect Enemy Bounces
- Enemy Families through the shared selector
- Olivia Vehicles
- Bosses
- Hazards
- Piñatas
- Celebrations
- Finale
- World 1, World 2, and World 3
- UI and Ambience

The two direct comparison buttons are labeled exactly:

- `Non-Perfect Enemy Squish`
- `Perfect Enemy Bounce`

The new `Enemy Contact A/B Demo` plays three alternating pairs with bounded
combo escalation. The lab also retains taco, magnet, power-up, Olivia, boss,
piñata, core-gameplay, concert, and cosmic-finale tests and adds a 12-jump
repetition test.

Telemetry now includes the engine, catalog, and asset-cache versions plus
AudioContext sample rate, base latency, and output latency when the browser
exposes them.

## Stress-test results

Tests used saved/default-compatible Music 70 and Effects 80 settings. The Neon
Neckties final concert master's existing 142-168 second section was used as the
loudest music stress source without editing the file.

### Enemy outcomes

- Enemy Contact A/B Demo: completed; one simultaneous voice peak; no drops.
- Ten non-perfect squishes at 105 ms spacing: three simultaneous voices peak;
  no drops.
- Ten perfect bounces at 85 ms spacing: four simultaneous voices peak; no
  drops; post-ceiling browser sample peak -4.23 dBFS.
- Waveform regression: non-perfect mid-body is no weaker than its onset by
  more than 1 dB; representative perfect late rebound exceeds the non-perfect
  late region by more than 10 dB.

### Dense collection and full-sequence review

- Forty-eight source taco pickups in the magnet test: 40 source events
  suppressed into eight cluster voices; peak five simultaneous voices; no
  machine-gun playback path.
- Repeated jump, power-up, Olivia, boss, piñata, cosmic-finale, and core-gameplay
  demos all completed while the Neon master played.
- Final combined lab run: post-ceiling browser sample peak -4.04 dBFS.
- Failed assets: 0.
- Fallback plays: 0.
- Unknown events: 0.
- Music routing failures: 0.
- Global-polyphony drops: 0.
- Unavailable drops: 0.
- Active loops after the sequence suite: 0.
- Captured Audio Lab console errors/warnings: 0.

The desktop browser exposed a 48 kHz AudioContext. Reported base latency was
0.010 seconds. Reported output latency varied between 0.040 and 0.240 seconds
across sessions; this is browser/device scheduling telemetry, not an authored
delay. User-interaction unlock and immediate semantic playback succeeded.

## Automated and browser validation

- `npm test`: PASS.
- verified Sites production build: PASS.
- rendered integration tests: 33/33 PASS.
- `npm run lint`: PASS with 0 errors and 27 pre-existing/style warnings.
- JavaScript syntax: PASS for generator, catalog, engine, Audio Lab, World 1-1,
  and the regression suite.
- deterministic generation: 281/281 generated files byte-identical on rerun.
- catalog events: 153.
- catalog assets: 280, all present.
- manifest byte and SHA-256 checks: PASS.
- total SFX size: 12,408,860 bytes, below the 14 MiB regression ceiling.
- music integrity: every tracked pre-Phase-1 music master byte-identical.
- legacy runtime synthesis: absent from all level runtimes; centralized fallback
  remains in the shared engine.
- all nine desktop start flows: PASS, intended opening music running, zero
  captured console errors.
- keyboard Space input after start: PASS.
- on-screen touch Jump control after start: PASS in desktop browser emulation.

## Music integrity and timing

No `.ogg`, `.mp3`, `.m4a`, music-generation source, concert cue file, or music
timeline is in the Phase 3 diff. The existing integrity fixture verifies the
complete tracked set by SHA-256.

No music composition, master, compression, encoding, duration, cue time,
crossfade duration, normalized-playhead behavior, concert clock, or final-song
choreography changed.

## Complete non-asset changed-file list

- `README.md`
- `public/game/README.md`
- `docs/sfx-remaster-phase3.md`
- `scripts/generate-sfx.mjs`
- `tests/rendered-html.test.mjs`
- `public/game/assets/sfx/sfx-manifest.json`
- `public/game/audio-catalog.js`
- `public/game/audio-engine.js`
- `public/game/audio-lab.html`
- `public/game/audio-lab.js`
- `public/game/game.js`
- `public/game/index.html`
- `public/game/level1-2.html`
- `public/game/level1-3.html`
- `public/game/level2.html`
- `public/game/level2-2.html`
- `public/game/level2-3.html`
- `public/game/level3.html`
- `public/game/level3-2.html`
- `public/game/level3-3.html`

The 90 revised WAV paths are fully specified in "Assets revised" above and
individually recorded by `public/game/assets/sfx/sfx-manifest.json`.

## Preview routes

Append these unchanged routes to the isolated Phase 3 preview origin:

- Audio Lab: `/game/audio-lab.html`
- World 1-1: `/game/`
- World 1-2: `/game/level1-2.html`
- World 1-3: `/game/level1-3.html`
- World 2-1: `/game/level2.html`
- World 2-2: `/game/level2-2.html`
- World 2-3: `/game/level2-3.html`
- World 3-1: `/game/level3.html`
- World 3-2: `/game/level3-2.html`
- World 3-3: `/game/level3-3.html`

## Remaining physical-device gates and limitations

The following require the project owner's real hardware and ears:

- physical iPhone Safari speaker listening at normal saved settings;
- iPhone earbuds/headphones comparison;
- desktop/laptop speaker and headphone listening;
- physical standard-controller start and AudioContext unlock;
- background/foreground suspension and resume on iPhone Safari;
- long-form sequential creative listening through all nine levels; and
- final judgment that the non-perfect cue reads as `SQUISH` and the perfect cue
  reads as `SQUISH + BOING` on the target speakers.

The in-app browser does not provide a true physical iPhone speaker, real Safari,
or a physical controller. Those gates are therefore explicitly pending rather
than inferred from desktop automation.

The browser analyser reports sample peak, not inter-sample true peak or
integrated LUFS. Phase 3 made no new LUFS claim. The configured -1 dB ceiling,
asset peak/RMS data, music integrity, and stress telemetry provide the technical
baseline for the remaining listening review.

## Review recommendation

Use the Audio Lab in this order:

1. Select several soft and hard enemy families and run the direct squish and
   perfect buttons.
2. Run Enemy Contact A/B Demo under Exploration, Fiesta, and the Neon final
   concert master.
3. Run ten squishes, ten perfect bounces, repeated jumps, the magnet cascade,
   Power-Up Demo, Olivia Demo, Boss Demo, Piñata Demo, Core Gameplay Demo, and
   World 3 Cosmic Finale Demo.
4. Play all nine levels sequentially on an iPhone speaker, then repeat key
   comparisons on earbuds.
5. Approve, request one narrowly described creative adjustment, or defer merge.

Do not merge or deploy to the production Jumpin' For Tacos project until the
remaining physical-device and owner-listening gates receive explicit approval.
