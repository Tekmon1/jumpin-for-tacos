# Sound-Effects Remaster Phase 2

## Status and scope

Phase 2 extends the approved Phase 1 sound system across all nine playable
levels. The implementation is present on the feature branch for review. It has
not been merged to `main`, deployed, or published to the production Jumpin For
Tacos site.

This pass changes sound feedback and shared audio routing only. No music file
was replaced, remixed, recompressed, retimed, or otherwise edited. The working
tree contains no changed music asset. Existing gameplay, physics, collision,
difficulty, enemy placement, platform layout, progression, animation, music
cue timing, and authored music-transition timing are intended to remain
unchanged.

The Phase 2 implementation covers:

- World 1-1: Sunset Salsa Run
- World 1-2: Sky-High Salsa Rescue
- World 1-3: Sunset Salsa Showdown
- World 2-1: Coconut Crunch Cove
- World 2-2: Campfire Caldera Caper
- World 2-3: Neon Neckties: Turn the Sunset Up
- World 3-1: Cloudtop Carnival Kickoff
- World 3-2: Midnight Midway Mayhem
- World 3-3: Taco Nova Firework Finale

## Confirmed pre-migration implementation

The original Phase 1 audit inspected `main` at
`4fd4e9296966da2ec1ef3d0b3bdeb52276fd0b8f`. Its findings remain the baseline
for this rollout:

- World 1-1, World 1-2, World 1-3, World 2-1, World 2-2, and World 2-3 each
  carried a local oscillator-based `sfx()` implementation.
- The three World 3 pages shared a separate oscillator-based `playTone()`
  implementation in `world3.js`.
- World 1-1 already had limited event-triggered music ducking.
- World 3 already had authored cinematic music-gain states.
- World 1-2, World 1-3, and the three World 2 runtimes did not have
  event-triggered ducking.
- World 1-1 commonly used oscillator gains around 0.025 to 0.065 against music
  at the saved Music setting, whose existing default was 0.70. That imbalance
  confirmed the reported masking issue.

The reported prototype pattern was therefore accurate, with one qualification:
ducking was not absent everywhere. World 1-1 had a local implementation, and
World 3 had cinematic gain choreography, but neither was centralized across
the game.

Phase 1 migrated World 1-1 and established the approved normal-splat versus
perfect-bounce language. Phase 2 removes the remaining runtime-local gameplay
oscillators and keeps raw synthesis only as an emergency fallback inside the
shared engine.

## Shared audio architecture

`public/game/audio-catalog.js` is the semantic catalog. It currently exposes
153 events and describes, per event:

- Music, Gameplay SFX, UI, or Ambience routing
- priority from 1 through 5
- cooldown
- maximum polyphony
- asset variants and option-selected variants
- deterministic variant rotation
- bounded pitch and gain variation
- bounded streak and combo pitch escalation
- optional stereo position
- music-duck depth and release
- loop behavior
- centralized fallback synthesis recipe where appropriate

`public/game/audio-engine.js` exposes:

- `JFT_AUDIO.init(...)`
- `JFT_AUDIO.preload(...)`
- `JFT_AUDIO.preloadGroups(...)`
- `JFT_AUDIO.registerMusicTracks(...)`
- `JFT_AUDIO.play(eventId, options)`
- `JFT_AUDIO.startLoop(eventId, options)`
- `JFT_AUDIO.stopLoop(handle)`
- `JFT_AUDIO.setMusicVolume(value)`
- `JFT_AUDIO.setMusicDuck(value, options)`
- `JFT_AUDIO.clearMusicDuck(options)`
- `JFT_AUDIO.setEffectsVolume(value)`
- `JFT_AUDIO.setMuted(value)`
- `JFT_AUDIO.getTelemetry()`
- `JFT_AUDIO.hasEvent(eventId)`
- `JFT_AUDIO.listEvents()`

The Web Audio graph is:

```text
HTML music elements -> Music -> authored-scene gain -> event duck --+
buffer voices ------> Gameplay SFX -------------------------------+
buffer voices ------> UI -----------------------------------------+-> Master
loop voices --------> Ambience -----------------------------------+     |
                                                                      v
                                                       compressor -> -1 dB ceiling
                                                                      |
                                                                      v
                                                              analyser -> output
```

Music continues to play from the existing HTML media elements. Registering a
track routes it into the Music bus without changing the source file. Per-level
arrangement trims and crossfades remain in the level runtime; the saved user
Music setting is applied once at the shared Music bus.

The engine has an 18-voice global budget, event-specific polyphony limits,
priority-aware voice stealing, and bounded loop admission. Muted or zero-volume
loop requests remain resumable. Frequent one-shot effects use cooldowns;
important effects may replace an older same-event voice rather than disappear.

Regular taco pickups use a 92 ms aggregation window. The first taco responds
immediately, while further tacos in the window become one cluster response.
This retains an ascending streak language without turning magnets, taco rain,
or dense vehicle drops into a machine gun.

Event ducking and authored cinematic gain are separate stages. Event ducking
uses a fast attack and smooth release, and a weaker later event does not shorten
an already active stronger envelope. World 3 continues to drive its cinematic
gain through `setMusicDuck()` while equal-power media-element crossfades retain
their original normalized-playhead timing.

The existing `jumpinForTacosProgressV2` Music, Effects, and Mute fields remain
compatible. Existing saved preferences are not overwritten. The established
defaults remain Music 70 and Effects 80.

Telemetry reports engine/catalog version, AudioContext state and errors,
loaded/loading/failed assets, current and peak voices, loop handles, fallback
plays, aggregation, drops by reason/priority/event, event and authored music
duck amounts, bus levels, registered music tracks, routing failures, output
sample peak, and unknown event IDs.

## Complete semantic-event inventory

The catalog currently contains the following 153 IDs. Some catalog entries are
reusable/reserved and are not necessarily triggered in every level.

- Ability: `ability.coconutBounce`, `ability.coconutStart`,
  `ability.frenzyEnd`, `ability.frenzyStart`, `ability.limeBreak`,
  `ability.limeStart`, `ability.lowGravityEnd`, `ability.lowGravityStart`,
  `ability.magnetEnd`, `ability.magnetStart`, `ability.pepperEnd`,
  `ability.pepperStart`, `ability.tacoNovaMilestone`, `ability.tacoNovaStart`
- Ambience: `ambience.cosmicCarnival`, `ambience.desertBreeze`,
  `ambience.stampede`
- Boss: `boss.attack`, `boss.celebrate`, `boss.damage`, `boss.defeat`,
  `boss.enter`, `boss.move`, `boss.phase`, `boss.special`, `boss.vulnerable`,
  `boss.windup`, `boss.elGuacodillo.airstrikeStart`,
  `boss.elGuacodillo.armorClonk`, `boss.elGuacodillo.charge`,
  `boss.elGuacodillo.chargeWindup`, `boss.elGuacodillo.crashStun`,
  `boss.elGuacodillo.damage`, `boss.elGuacodillo.defeat`,
  `boss.elGuacodillo.dodge`, `boss.elGuacodillo.enter`,
  `boss.elGuacodillo.guacShot`, `boss.elGuacodillo.phaseTransition`,
  `boss.elGuacodillo.vulnerable`
- Collection: `collect.airMail`, `collect.airMailComplete`,
  `collect.airdropMilestone`, `collect.backstagePass`,
  `collect.cosmicGoldenTaco`, `collect.goldenHotSauce`,
  `collect.goldenSombrero`, `collect.goldenTaco`, `collect.guacBowl`,
  `collect.hotSauce`, `collect.jalapeno`, `collect.powerup`,
  `collect.rainbowTaco`, `collect.streakMilestone`, `collect.taco`,
  `collect.tacoCluster`
- Combat: `combat.comboMilestone`, `combat.enemySplat`,
  `combat.enemyStomp`
- Concert: `concert.bow`, `concert.chorusCannon`, `concert.crowdCheer`,
  `concert.crowdSurfLand`, `concert.crowdSurfStart`, `concert.finaleLift`,
  `concert.start`, `concert.tambourineAccent`
- Cosmic/carnival: `carnival.machine`, `cosmic.finale`, `cosmic.landing`,
  `cosmic.starRelight`
- Goal/level: `goal.enter`, `goal.warning`, `level.celebrationPulse`,
  `level.complete`, `level.victoryDashStart`
- Hazards: `hazard.coconutCannonFire`, `hazard.coconutDeflect`,
  `hazard.cometPass`, `hazard.geyserLaunch`, `hazard.geyserWarn`,
  `hazard.guacLand`, `hazard.guacSpring`, `hazard.guacThrow`,
  `hazard.guacWarning`, `hazard.nearMiss`, `hazard.stampedeEscape`,
  `hazard.stampedeLoop`, `hazard.stampedeStart`
- Hero: `hero.fall`, `hero.hurt`, `hero.jump`, `hero.landHard`,
  `hero.landSoft`, `hero.respawnBeam`, `hero.respawnLand`
- Movement/impact: `impact.guacKrak`, `movement.churroSpring`,
  `movement.salsaSlide`, `movement.speedPad`
- Piñata: `pinata.aftershock`, `pinata.break`, `pinata.hit`,
  `pinata.jackpotSparkle`
- Ride: `ride.coasterClack`, `ride.coasterDrop`, `ride.machineStart`
- Sequences/stage: `sequence.rescuePhase`, `stage.generatorActivate`
- Surf: `surf.land`, `surf.mount`, `surf.obstacleClear`,
  `surf.obstacleHit`, `surf.oliviaPass`, `surf.waveCrashLaunch`,
  `surf.waveHit`
- UI/checkpoint: `checkpoint.activate`, `ui.confirm`, `ui.radio`,
  `ui.resultsReveal`, `ui.start`
- Vehicle: `vehicle.accelerate`, `vehicle.aircraftApproach`,
  `vehicle.aircraftBoost`, `vehicle.aircraftCrash`, `vehicle.aircraftDamage`,
  `vehicle.aircraftDamagedLoop`, `vehicle.aircraftDepart`,
  `vehicle.aircraftDropComplete`, `vehicle.aircraftGreeting`,
  `vehicle.aircraftPropellerIdle`, `vehicle.aircraftReady`,
  `vehicle.aircraftRescueStart`, `vehicle.aircraftSettled`,
  `vehicle.aircraftTakeoff`, `vehicle.aircraftTaxi`, `vehicle.approach`,
  `vehicle.arrive`, `vehicle.chaseComplete`, `vehicle.cosmicAccelerate`,
  `vehicle.cosmicApproach`, `vehicle.cosmicBoost`, `vehicle.cosmicDepart`,
  `vehicle.cosmicIdle`, `vehicle.cosmicTacoDrop`, `vehicle.depart`,
  `vehicle.drop`, `vehicle.idle`, `vehicle.ready`, `vehicle.tacoDrop`
- Volcano: `volcano.active`, `volcano.erupt`, `volcano.warmup`
- World 1: `world1.showdown`

## Nine-level integration inventory

All nine pages load `audio-catalog.js` and `audio-engine.js` before their level
runtime. All use the shared settings/unlock path and world-scoped preloading.

### World 1-1 - Sunset Salsa Run

- Preserves the approved Phase 1 movement, soft/hard landing, hurt, fall,
  respawn, taco aggregation, checkpoint, goal, celebration, and completion
  design.
- Uses separate `combat.enemySplat` and `combat.enemyStomp` outcomes with
  combo punctuation.
- Uses tomato, onion, chili, and jalapeño enemy options.
- Names golden taco, Rainbow Taco, Taco Magnet, hot sauce, jalapeño, and guac
  bowl feedback instead of generic frequencies.
- Retains taco-truck arrive/ready/drop/depart, chase payoff, showdown, goal
  warning, and piñata hit/break cues.

### World 1-2 - Sky-High Salsa Rescue

- Adds shared movement, collection, combat, respawn, checkpoint, goal, and
  completion feedback.
- Uses tomato, onion, chili, jalapeño, lime, and queso enemy options.
- Maps normal non-bounce destruction to splat and earned bounce destruction to
  perfect stomp; combo milestones remain perfect-stomp rewards.
- Adds air-mail pickup/completion, airdrop milestones, sky-streak milestones,
  Rainbow Taco, magnet, frenzy, and expiration cues.
- Scores Olivia's opening greeting, ready, propeller idle, taxi, takeoff,
  boost, and departure; flyby approach/drop/complete/departure; guacamole
  warning/throw/GUAC-KRAK; damaged-aircraft loop, rescue phases, crash, and
  chase completion.
- Preserves the authored GUAC-KRAK hard music stop/restart and the level's
  existing music changes.
- Expands the piñata payoff through hit, break, aftershock, and jackpot cues.

### World 1-3 - Sunset Salsa Showdown

- Adds shared movement, collection, combat, respawn, checkpoint, goal,
  results, victory-dash, celebration, and completion feedback.
- Uses slime, tortilla knight, jalapeño, guac, churro, and sombrero mole enemy
  options.
- Adds salsa-slide and churro-spring movement identities.
- Adds stampede start, controlled loop, near miss, and escape cues.
- Adds premium Golden Sombrero and Golden Hot Sauce feedback plus magnet and
  frenzy start/end cues.
- Gives El Guacodillo unique entrance, phase, charge windup, charge, crash
  stun, airstrike, guac shot, projectile landing/spring, vulnerable, armor
  clonk, damage, dodge, and defeat identities.
- Preserves boss-state logic, collision, damage windows, arena transitions,
  and music changes.

### World 2-1 - Coconut Crunch Cove

- Adds shared movement, collection, combat, respawn, checkpoint, goal,
  celebration, and completion feedback.
- Uses crab, seagull, puffer, coconut, and tiki enemy options.
- Adds lime shield, pepper dash, Golden Shell Magnet, Coconut Bounce, and
  Taco Frenzy stage cues.
- Gives Olivia's catamaran its own approach, marine idle, taco drop, and
  departure identity.
- Scores the surf mount, Olivia pass, obstacle clear/hit, wave hit,
  wave-crash launch, and landing.
- Adds coconut-cannon fire and deflection cues.

### World 2-2 - Campfire Caldera Caper

- Adds shared movement, collection, combat, respawn, checkpoint, goal,
  celebration, and completion feedback.
- Uses marshmallow, pineapple, queso, pepper, crab, nacho, and authored ash
  behavior. Shared catalog variants cover the wider World 2 family.
- Reuses the deliberate lime, pepper, shell-magnet, coconut, and frenzy
  identities from World 2-1.
- Gives Olivia's Taco Trekker distinct approach, acceleration, idle, taco
  drop, and departure feedback.
- Retains the surf family and adds geyser warning/launch plus volcano warmup,
  eruption, and active ambience.
- The volcano loop intentionally continues through its authored post-eruption
  and luau state until reset.

### World 2-3 - Neon Neckties: Turn the Sunset Up

- Adds shared movement, collection, combat, respawn, checkpoint, and
  completion feedback without changing the concert clock.
- Uses berry, mango, spaghetti, pineapple, pepper, and generator-defense
  enemy groups.
- Adds Backstage Pass, magnet start/end, frenzy start/end, golden taco, and
  Rainbow Taco feedback.
- Gives the opening roadster and later lagoon catamaran their appropriate
  approach, acceleration, idle, taco-drop, and departure identities.
- Adds generator activation, piñata hit/break, concert start, chorus cannon,
  crowd cheer, crowd-surf start/land, tambourine accent, finale lift, and bow.
- All cue triggers remain attached to the unchanged 3:07 final concert master
  timeline.

### World 3-1 - Cloudtop Carnival Kickoff

- Adds shared movement, collection, combat, respawn, checkpoint, goal,
  celebration, and completion feedback through the shared World 3 runtime.
- Uses popcorn, cotton candy, pretzel, and lemon enemies where authored, with
  the full cosmic/carnival option family available.
- Adds Taco Nova charge milestones/full activation, magnet and frenzy
  start/end, golden taco, and air-mail feedback.
- Gives Olivia's balloon its own approach, idle, acceleration, boost,
  taco-drop, and departure identity.
- Scores ride machinery, piñata hit/break, taco rain, carnival ambience, and
  the cloudtop finale.

### World 3-2 - Midnight Midway Mayhem

- Reuses shared World 3 movement, collection, combat, respawn, checkpoint,
  goal, celebration, and completion feedback.
- Adds bumper and corndog enemy identities alongside popcorn, cotton,
  pretzel, and lemon.
- Gives Olivia's coaster approach, idle, acceleration, clack, drop, boost,
  taco-drop, and departure feedback.
- Gives Sir Cornelius Pop option-selected entrance, movement, windup, attack,
  vulnerable, damage, phase, special, defeat, and celebration sounds.
- Scores the midway relight and attraction-machine sequence without changing
  its music choreography.

### World 3-3 - Taco Nova Firework Finale

- Reuses the full World 3 hero, collection, combat, checkpoint, goal,
  celebration, and completion language.
- Gives Olivia's zeppelin distinct approach, idle, acceleration, boost,
  taco-drop, and departure feedback.
- Gives Ringmaster Radish his own option-selected boss asset family for
  entrance, movement, windup, attack, vulnerable, damage, phase, special,
  defeat, and celebration.
- Adds the Cosmic Golden Taco, star relight, Taco Nova, low-gravity start/end,
  cosmic finale, and landing cues.
- Routes the existing cinematic gain choreography into the authored-scene
  gain stage while preserving normalized-playhead crossfades and the existing
  cosmic reprise timing.

## Complete Power-Up Audio Inventory

`N/A` means the reward is instantaneous or persistent and has no expiration
state. An absent expiration cue is stated explicitly rather than implied.

| Level | Power-up or premium reward | Pickup/start | Action or active feedback | Expiration/break |
| --- | --- | --- | --- | --- |
| 1-1 | Golden Taco | `collect.goldenTaco` | premium reward punctuation | N/A |
| 1-1 | Rainbow Taco | `collect.rainbowTaco` | extends Taco Magnet state; taco cascades aggregate | no separate W1-1 magnet-end cue |
| 1-1 | Taco Magnet | `ability.magnetStart` | clustered/aggregated `collect.taco` language | no separate W1-1 magnet-end cue |
| 1-1 | Taco Frenzy | `ability.frenzyStart` | enemy contact uses splat and invulnerability remains gameplay-owned | no separate W1-1 frenzy-end cue |
| 1-1 | Hot Sauce | `collect.hotSauce` | immediate horizontal impulse | N/A |
| 1-1 | Jalapeño | `collect.jalapeno` | immediate upward impulse | N/A |
| 1-1 | Guac Bowl | `collect.guacBowl` | immediate heart restore | N/A |
| 1-2 | Air Mail | `collect.airMail` | escalating delivery count; `collect.airdropMilestone` | `collect.airMailComplete` on 5/5 |
| 1-2 | Rainbow Taco | `collect.rainbowTaco` plus `ability.magnetStart` when newly active | aggregated taco attraction | `ability.magnetEnd` |
| 1-2 | Taco Magnet | `ability.magnetStart` | aggregated taco attraction | `ability.magnetEnd` |
| 1-2 | Taco Frenzy | `ability.frenzyStart` | empowered enemy/taco state | `ability.frenzyEnd` |
| 1-2 | Sky streak/airdrop milestone | `collect.streakMilestone` or `collect.airdropMilestone` | bounded combo pitch | N/A |
| 1-3 | Golden Sombrero | `collect.goldenSombrero` plus magnet start when newly active | persistent medal/fiesta value and temporary attraction | `ability.magnetEnd` for the temporary state |
| 1-3 | Golden Hot Sauce | `collect.goldenHotSauce` | persistent fiesta-power contribution | N/A |
| 1-3 | Taco Magnet | `ability.magnetStart` | aggregated taco attraction | `ability.magnetEnd` |
| 1-3 | Taco Frenzy | `ability.frenzyStart` | empowered enemy/taco state | `ability.frenzyEnd` |
| 2-1 | Lime Shield | `collect.powerup` plus `ability.limeStart` | absorbs one hit | `ability.limeBreak` on shield consumption |
| 2-1 | Pepper Dash | `collect.powerup` plus `ability.pepperStart` | timed speed state | `ability.pepperEnd` |
| 2-1 | Golden Shell Magnet | `collect.powerup` plus `ability.magnetStart` | aggregated taco attraction | `ability.magnetEnd` |
| 2-1 | Coconut Bounce | `collect.powerup` plus `ability.coconutStart` | `ability.coconutBounce` on the one mid-air super jump | consumed by action; no separate end cue |
| 2-1 | Taco Frenzy | `ability.frenzyStart` | empowered enemy/taco state | `ability.frenzyEnd` |
| 2-1 | Golden Coconut / Rainbow Shell | `collect.goldenTaco` / `collect.rainbowTaco` | premium reward punctuation | N/A |
| 2-2 | Lime Shield | `collect.powerup` plus `ability.limeStart` | absorbs one hit | `ability.limeBreak` |
| 2-2 | Pepper Dash | `collect.powerup` plus `ability.pepperStart` | timed speed state | `ability.pepperEnd` |
| 2-2 | Golden Shell Magnet | `collect.powerup` plus `ability.magnetStart` | aggregated taco attraction | `ability.magnetEnd` |
| 2-2 | Coconut Bounce | `collect.powerup` plus `ability.coconutStart` | `ability.coconutBounce` | consumed by action; no separate end cue |
| 2-2 | Taco Frenzy | `ability.frenzyStart` | empowered enemy/taco state | `ability.frenzyEnd` |
| 2-2 | Golden Coconut / Rainbow Shell | `collect.goldenTaco` / `collect.rainbowTaco` | premium reward punctuation | N/A |
| 2-3 | Backstage Pass | `collect.backstagePass` plus magnet activation | aggregated attraction during the backstage reward | `ability.magnetEnd` |
| 2-3 | Taco Frenzy | `ability.frenzyStart` | empowered enemy/taco state | `ability.frenzyEnd` |
| 2-3 | Golden / Rainbow Taco | `collect.goldenTaco` / `collect.rainbowTaco` | premium reward punctuation | N/A |
| 3-1 | Taco Nova meter | `ability.tacoNovaMilestone` at 25/50/75 | pitch-selected escalating milestone language | meter decays silently between streaks |
| 3-1 | Full Taco Nova | `ability.tacoNovaStart`, then restrained frenzy/magnet layers | full temporary empowered state | inherited `ability.frenzyEnd` and `ability.magnetEnd` |
| 3-1 | Magnet / Frenzy | `ability.magnetStart` / `ability.frenzyStart` | attraction/empowered state | `ability.magnetEnd` / `ability.frenzyEnd` |
| 3-1 | Golden Taco / Air Mail | `collect.goldenTaco`, `collect.airMail` / `collect.airMailComplete` | premium/delivery reward | N/A |
| 3-2 | Taco Nova meter/full state | same 25/50/75/100 language as 3-1 | shared empowered state | inherited magnet/frenzy end cues |
| 3-2 | Magnet / Frenzy | `ability.magnetStart` / `ability.frenzyStart` | attraction/empowered state | `ability.magnetEnd` / `ability.frenzyEnd` |
| 3-2 | Golden Taco / Air Mail | shared premium and delivery cues | premium/delivery reward | N/A |
| 3-3 | Taco Nova meter/full state | shared milestone and full-start language | finale-scale Taco Nova state | inherited magnet/frenzy end cues |
| 3-3 | Cosmic Golden Taco | `collect.cosmicGoldenTaco` | major final collectible punctuation | N/A |
| 3-3 | Low Gravity | `ability.lowGravityStart` | cinematic low-gravity phase | `ability.lowGravityEnd`, followed by `cosmic.landing` |
| 3-3 | Magnet / Frenzy | `ability.magnetStart` / `ability.frenzyStart` | attraction/empowered state | `ability.magnetEnd` / `ability.frenzyEnd` |

## Enemy families and stomp language

Every listed enemy family has two normal-splat renders and one perfect-stomp
render. There are 30 option-selected families: 60 normal-splat assets and 30
perfect-stomp assets.

- World 1: tomato, onion, chili, jalapeño, lime, queso, slime, tortilla
  knight, guac, churro, sombrero mole
- World 2: crab, coconut, seagull, puffer, tiki, marshmallow, pineapple,
  pepper, nacho, ash, berry, mango, spaghetti
- World 3: popcorn, cotton candy, pretzel, lemon, bumper, corndog

`combat.enemySplat` uses impact, juicy cartoony splat, and a small residual
squish/pop. `combat.enemyStomp` retains that related splat body and adds a
pronounced rebound/boing. Combo excitement uses bounded pitch and separate
`combat.comboMilestone` punctuation, not unbounded gain.

## Olivia vehicle identities

- World 1-1 taco vehicles use cheerful truck approach/ready/drop/departure and
  chase-complete cues.
- World 1-2 aircraft uses approach, propeller idle, greeting/ready, taxi,
  takeoff, boost, flyby, drop complete, damage, rescue, damaged loop, crash,
  settled/departure, and chase payoff identities.
- World 1-3 has Olivia radio feedback but no foreground Olivia vehicle set
  piece requiring a new vehicle family.
- World 2-1 catamaran uses a marine/water identity.
- World 2-2 Taco Trekker uses a rounder ground-machine identity.
- World 2-3 roadster uses a brighter road/turbine identity; its later
  catamaran reuses the marine family.
- World 3-1 balloon uses airy carnival propulsion.
- World 3-2 coaster uses mechanical carnival acceleration, clack, and drop.
- World 3-3 zeppelin uses large, friendly cosmic propulsion.

World 2 vehicles share semantic approach/idle/accelerate/taco-drop/departure
events selected by `vehicleType`. World 3 vehicles use the equivalent cosmic
semantic family. Idle loops have explicit stop/reset lifecycles, subtle
positioning, and low ambience-bus calibration.

## Boss identities

El Guacodillo uses 14 dedicated World 1 assets: entrance, phase, windup,
charge, crash, airstrike, guac shot, guac land, guac spring, vulnerable,
armor clonk, damage, dodge, and defeat. These are not ordinary enemy effects.

Sir Cornelius Pop and Ringmaster Radish each use ten option-selected World 3
assets: entrance, movement, windup, attack, damage, phase, special, vulnerable,
defeat, and celebration. Damage and defeat are staged above routine gameplay
effects, with scale supplied by texture, punctuation, and ducking rather than
only level.

## Hazards, machinery, and celebrations

- World 1: salsa slide, churro spring, aircraft machinery, guacamole warning
  and projectile sequence, GUAC-KRAK, stampede start/loop/near-miss/escape,
  El Guacodillo machinery, victory dash, and expanded piñata aftershock/jackpot.
- World 2: surf mount/clear/hit/wave/crash/land, coconut cannon and deflection,
  geyser warning/launch, volcano warmup/eruption/active ambience, stage
  generator, crowd, concert cannon, crowd-surf, tambourine, finale lift, and
  bow.
- World 3: balloon/coaster/zeppelin motion, coaster machinery/clack/drop,
  cosmic ambience, star relight, cosmic finale, landing, boss celebrations,
  piñata feedback, and level celebration pulses. `carnival.machine` and
  `hazard.cometPass` remain catalog-ready cues and are not currently called by
  the shared World 3 runtime.

Piñata payoffs retain the approved structure: crack/hit, break, cartoony burst,
taco/candy response, and jackpot punctuation where the level supports the
extended sequence.

## Original generated library

`scripts/generate-sfx.mjs` generates the library as 44.1 kHz mono 16-bit PCM
WAV using seeded procedural synthesis. It consumes no third-party samples.
`public/game/assets/sfx/sfx-manifest.json` records path, byte count, duration,
sample rate, channel count, render peak, RMS, SHA-256, and deterministic seed.

| Folder | Assets | Bytes | MiB | Manifest peak range | Manifest RMS range |
| --- | ---: | ---: | ---: | ---: | ---: |
| `assets/sfx/global` | 52 | 2,160,546 | 2.06 | -20 to -3 dBFS | -33.29 to -14.82 dBFS |
| `assets/sfx/world1` | 86 | 3,581,178 | 3.42 | -19 to -1.8 dBFS | -30.09 to -15.38 dBFS |
| `assets/sfx/world2` | 77 | 3,310,912 | 3.16 | -20 to -2 dBFS | -28.42 to -15.56 dBFS |
| `assets/sfx/world3` | 65 | 3,356,224 | 3.20 | -21 to -1.8 dBFS | -28.59 to -15.35 dBFS |
| **Total library** | **280** | **12,408,860** | **11.83** | **-21 to -1.8 dBFS** | **-33.29 to -14.82 dBFS** |

Phase 1 contained 57 assets. Phase 2 adds 223 assets totaling 10,597,364 bytes
(10.11 MiB), while retaining the original Phase 1 renders.

The complete machine-readable asset list is the 280-entry manifest. The 223
Phase 2-created paths are completely described by these path families:

- `assets/sfx/global/ability-{coconut-bounce,coconut-start,frenzy-end,lime-break,lime-start,low-gravity-end,low-gravity-start,magnet-end,pepper-end,pepper-start,taco-nova-milestone,taco-nova-start}-01.wav`
- `assets/sfx/global/collect-{air-mail,air-mail-complete,backstage-pass,cosmic-golden-taco,golden-hot-sauce,golden-sombrero,guac-bowl,hot-sauce,jalapeno}-01.wav`
- `assets/sfx/world1/enemy-splat-{churro,guac,knight,lime,mole,queso,slime}-{01,02}.wav`
- `assets/sfx/world1/enemy-stomp-{churro,guac,knight,lime,mole,queso,slime}-01.wav`
- `assets/sfx/world1/aircraft-{approach,boost,crash,damage,damaged-loop,depart,drop-complete,propeller-idle,ready,rescue-start,settled,takeoff,taxi}-01.wav`
- `assets/sfx/world1/boss-guac-{airstrike,charge,clonk,crash,damage,defeat,dodge,enter,land,phase,shot,spring,vulnerable,windup}-01.wav`
- `assets/sfx/world1/{churro-spring,guac-krak,guac-throw,guac-warning,pinata-aftershock,pinata-jackpot,salsa-slide,stampede-escape,stampede-loop,stampede-near-miss,stampede-start,victory-dash-start}-01.wav`
- `assets/sfx/world2/enemy-splat-{ash,berry,coconut,crab,mango,marshmallow,nacho,pepper,pineapple,puffer,seagull,spaghetti,tiki}-{01,02}.wav`
- `assets/sfx/world2/enemy-stomp-{ash,berry,coconut,crab,mango,marshmallow,nacho,pepper,pineapple,puffer,seagull,spaghetti,tiki}-01.wav`
- `assets/sfx/world2/vehicle-{catamaran,roadster,trekker}-{accelerate,approach,depart,idle,taco-drop}-01.wav`
- `assets/sfx/world2/{hazard-coconut-cannon-fire,hazard-coconut-deflect,hazard-geyser-launch,hazard-geyser-warn,stage-generator-activate,surf-land,surf-mount,surf-obstacle-clear,surf-obstacle-hit,surf-olivia-pass,surf-wave-crash-launch,surf-wave-hit,volcano-active,volcano-erupt,volcano-warmup}-01.wav`
- `assets/sfx/world2/concert-{bow,chorus-cannon,crowd-cheer,crowd-surf-land,crowd-surf-start,finale-lift,start,tambourine-accent}-01.wav`
- `assets/sfx/world3/enemy-splat-{bumper,corndog,cotton,lemon,popcorn,pretzel}-{01,02}.wav`
- `assets/sfx/world3/enemy-stomp-{bumper,corndog,cotton,lemon,popcorn,pretzel}-01.wav`
- `assets/sfx/world3/vehicle-{balloon,coaster,zeppelin}-{accelerate,approach,boost,depart,idle,taco-drop}-01.wav`
- `assets/sfx/world3/boss-{cornelius,ringmaster}-{attack,celebrate,damage,defeat,enter,move,phase,special,vulnerable,windup}-01.wav`
- `assets/sfx/world3/{ambience-cosmic-carnival,carnival-machine,cosmic-finale,cosmic-landing,cosmic-star-relight,hazard-comet-pass,ride-coaster-clack,ride-coaster-drop,ride-machine-start}-01.wav`

## Mix and measurement decisions

These are deterministic file-render measurements and fixed gain-stage values.
They are not browser true-peak or new LUFS measurements.

- Saved Music 70 produces Music bus gain 0.525 (-5.60 dB) after the approved
  0.75 calibration.
- Saved Effects 80 produces Gameplay SFX gain 0.760 (-2.38 dB), UI gain 0.656
  (-3.66 dB), and Ambience gain 0.336 (-9.47 dB).
- The master ceiling gain is fixed at -1 dB after a compressor configured with
  a -8 dB threshold, 5 dB knee, 10:1 ratio, 3 ms attack, and 180 ms release.
- Jump renders peak at -9.5 dBFS; soft land at -12 dBFS; hard land at -7 dBFS;
  hurt at -4.5 dBFS.
- Regular taco variants peak at -11.5 dBFS with RMS from -26.29 to -25.58
  dBFS. Cluster variants peak at -8.5 dBFS.
- Every normal enemy splat render peaks at -4.8 dBFS. Perfect-stomp renders
  peak at -3.8 dBFS. The one-decibel render difference is deliberately small;
  the audible reward is the added rebound and combo punctuation.
- Loop renders peak from -21 to -18 dBFS before Ambience calibration.
- Major damage/eruption assets peak around -2 dBFS. Boss defeats and the
  cosmic finale peak at -1.8 dBFS before bus gain and master processing.
- Frequent tacos request 1 dB duck; clusters 1.8 dB; normal splat 4.5 dB;
  perfect stomp 5 dB; hurt 6.5 dB; Rainbow Taco and full Taco Nova 7.5 dB;
  major boss defeats reach the controlled 9 dB maximum.
- Normal event duck attack is 18 ms, with event-specific smooth release.
  Stronger/longer active envelopes cannot be shortened by a weaker later cue.

The existing Neon Neckties final concert cue metadata documents the source at
-13.4 LUFS integrated and -1.3 dBFS true peak. That is a Phase 1 reference from
the existing cue JSON, not a new Phase 2 measurement. Phase 2 makes no new LUFS
claim and does not modify the concert master or any other music file.

## Audio Lab

The private lab now renders the full catalog into organized sections and adds
enemy, vehicle, and boss selectors. It retains direct normal-splat versus
perfect-stomp comparison and includes:

- Power-Up Demo
- Enemy Stomp Combo Demo
- Olivia Taco Drop Demo
- Boss Combat Demo
- Piñata Celebration Demo
- World 3 Cosmic Finale Demo
- taco-streak simulation
- magnet-cascade stress test
- ten normal-splat variants
- ten perfect-stomp stress test
- Core Gameplay Demo
- ambience start/stop
- live telemetry

The Neon Neckties 142-168 second finale-lift segment remains the loudest music
stress selection. The lab is private and is not linked from the public landing
page.

## Review routes

No deployed or remote preview URL exists at the time of this report. When the
branch is served locally or through an approved temporary HTTPS preview, use:

- Audio Lab: `/game/audio-lab.html`
- World 1-1: `/game/` or `/game/index.html`
- World 1-2: `/game/level1-2.html`
- World 1-3: `/game/level1-3.html`
- World 2-1: `/game/level2.html`
- World 2-2: `/game/level2-2.html`
- World 2-3: `/game/level2-3.html`
- World 3-1: `/game/level3.html`
- World 3-2: `/game/level3-2.html`
- World 3-3: `/game/level3-3.html`

## Changed file paths

Shared audio, library, lab, tests, and report:

- `public/game/audio-catalog.js`
- `public/game/audio-engine.js`
- `public/game/audio-lab.css`
- `public/game/audio-lab.html`
- `public/game/audio-lab.js`
- `public/game/assets/sfx/sfx-manifest.json`
- `public/game/assets/sfx/global/ambience-desert-breeze-01.wav`, regenerated
  with the same steady-state loop treatment as the Phase 2 sustained sounds
- the 223 new Phase 2 WAV paths fully enumerated by the path families in
  "Original generated library" and individually by `sfx-manifest.json`
- `scripts/generate-sfx.mjs`
- `tests/rendered-html.test.mjs`
- `docs/sfx-remaster-phase2.md`

Level pages and runtimes:

- `public/game/index.html`
- `public/game/game.js`
- `public/game/level1-2.html`
- `public/game/level1-2.js`
- `public/game/level1-3.html`
- `public/game/level1-3.js`
- `public/game/level2.html`
- `public/game/level2.js`
- `public/game/level2-2.html`
- `public/game/level2-2.js`
- `public/game/level2-3.html`
- `public/game/level2-3.js`
- `public/game/level3.html`
- `public/game/level3-2.html`
- `public/game/level3-3.html`
- `public/game/world3.js`

No music file is in the changed-file set.

## Automated verification status

Completed while preparing this report:

- `node --check` passed for `audio-engine.js`, `audio-catalog.js`, and
  `generate-sfx.mjs`.
- Catalog-to-disk validation found 153 events, 280 unique referenced assets,
  zero missing assets, and zero manifest hash/byte mismatches.
- A non-writing in-memory deterministic rerender compared all 280 generated
  outputs with the manifest and found zero mismatches.

| Gate | Status |
| --- | --- |
| `npm test` / build and rendered-HTML regression suite | **Pass**: verified Sites build plus 33/33 tests |
| lint | **Pass**: zero errors; 27 pre-existing/style warnings |
| all migrated runtime syntax checks | **Pass** |
| raw oscillator scan outside shared fallback | **Pass**: no level-local raw synthesis remains |
| music-integrity SHA-256 regression | **Pass**: every covered pre-Phase-1 music file is byte-identical |
| asset-size regression | **Pass**: 11.83 MiB total, below 14 MiB; every effect below 200 KiB |
| semantic-ID and load-order regression | **Pass**: 153 catalog IDs, all literal runtime/lab IDs resolve, and catalog/engine precede every runtime |
| deterministic render and manifest integrity | **Pass**: 280/280 isolated rerenders match; zero missing, orphaned, size-mismatched, or hash-mismatched WAVs |

The final loop-energy audit measured the first, middle, and last 100 ms of all
12 sustained assets. Eleven Phase 2 loops vary by at most 0.47 dB; the updated
desert breeze measures -28.21/-28.35/-28.55 dBFS, a maximum 0.35 dB edge
difference.

## Manual, browser, and device status

Completed in the local Chromium review browser:

- all nine level routes loaded and their start overlays dismissed at the
  default desktop viewport with zero captured console errors or warnings
- all nine start flows repeated at an 844x390 iPhone-landscape viewport with
  zero captured console errors or warnings
- World 1-1 touch Jump and keyboard Right inputs exercised after start
- Audio Lab loaded all 280 assets with zero failures, fallbacks, unknown
  events, or music-routing failures
- normal splat/perfect stomp comparison, magnet cascade, taco streak, ten
  normal splats, and ten perfect stomps ran under the Neon stress master
- the magnet cascade aggregated 40 source pickups into eight cluster voices
  during its isolated run; peak simultaneous voices were five
- a loop requested while muted recovered after unmute with a live, non-pending
  loop handle
- the combined stress run observed -3.58 dBFS sample peak at the analyser;
  the fixed -1 dB master ceiling remains downstream of that analyser

The following physical-device/listening gates remain required:

- physical iPhone Safari speaker test
- iPhone headphones/earbuds test
- desktop speakers/headphones test
- controller unlock/start flow
- background/foreground and AudioContext resume behavior
- long-form sequential playthrough/listening of all nine levels

Phase 1 was creatively approved after physical iPhone testing, but that is not
evidence that the new Phase 2 worlds, vehicles, bosses, loops, or finales have
passed physical-device review.

## Known limitations and remaining risks

- Procedural render peak and RMS values do not replace a post-Web-Audio LUFS or
  inter-sample true-peak measurement.
- Creative listening sign-off is still required. Shared synthesis profiles
  intentionally create family resemblance, but repeated powers, vehicles,
  bosses, and finales must be checked for excessive similarity or fatigue.
- World-scoped preloading is selected at the event level. Events whose option
  variants span several worlds can still preload cross-world variants; a
  mobile network/decode profile should confirm acceptable startup cost and
  memory use.
- The full private Audio Lab intentionally preloads all 11.83 MiB so every
  catalog button is immediately reviewable after loading.
- World 1-1 retains Phase 1 behavior and does not yet emit explicit magnet-end
  or frenzy-end cues, while later levels do. Review should decide whether
  cross-level consistency warrants a small follow-up.
- `carnival.machine` and `hazard.cometPass` are rendered/cataloged but not
  currently triggered by World 3 gameplay.
- Safari suspension/resume, controller activation, and visibility-change
  behavior require real-device verification; the engine and World 3 runtime
  now include pending-loop and next-gesture resume paths.
- The intended no-gameplay-change boundary must be protected by the final
  rendered-HTML and sequential playthrough gates; sound hooks were added at
  existing state transitions, but manual play remains necessary.

## Recommended full-game QA and review sequence

1. Treat the recorded automated suite, syntax, asset, semantic, script-order,
   and music-integrity results as the review baseline; rerun after any review
   change.
2. Use the Audio Lab first: compare normal splat/perfect stomp, then run taco,
   magnet, ten-splat, ten-stomp, power-up, vehicle, boss, piñata, core, and
   cosmic-finale demos under the Neon stress segment.
3. Play all nine levels sequentially at saved 70/80 settings. Record missing
   feedback, fatigue, masking, excessive ducking, duplicate identities, and
   any timing/collision/gameplay regression.
4. Pay special attention to World 1-2 aircraft state transitions, the World
   1-3 stampede and El Guacodillo phases, World 2-2 volcano lifecycle, the
   World 2-3 unchanged 3:07 concert timeline, and World 3 cinematic crossfades.
5. Repeat the core matrix on physical iPhone Safari, earbuds/headphones, and
   desktop speakers. Check major effects for sufficient phone-readable
   transient and midrange content.
6. Verify keyboard, touch, and controller audio unlock from a fresh page load;
   then background and foreground each level to test media and AudioContext
   recovery.
7. Use telemetry during stress runs to record failed assets, fallback plays,
   peak voices, drops by priority/reason, loop state, and maximum observed
   sample peak.
8. Review the World 1-1 missing expiration cues and the two unused World 3
   catalog cues as explicit accept/defer decisions rather than silently
   expanding scope.
9. Create an HTTPS branch preview only through an approved non-production
   target. Do not merge or deploy until creative, device, and automated gates
   are explicitly approved.
