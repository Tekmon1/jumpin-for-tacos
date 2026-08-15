# Olivia and Vehicle Scale Standardization

## Scope

This focused polish pass standardizes Olivia's recurring presentation against a
66-pixel Taco Hero render reference and removes the remaining detached
taco-throw arm animations. It does not change colliders, physics, camera math,
taco quantities, delivery timers, vehicle paths, level progression, or audio.

The shared render-only contract is `JFT_HERO_CORE.visualScale`, version
`jft-visual-scale-v1`.

## Shared visual contract

| Class | Standard |
| --- | --- |
| Taco Hero | 66 px rendered height |
| Olivia, standing | 112 px target; 104-120 px acceptable range |
| Olivia, mounted crop | 62-112 px visible range |
| Small ordinary enemy | 0.68-0.95 hero-height ratio |
| Standard ordinary enemy | 0.90-1.45 hero-height ratio |
| Large ordinary enemy | 1.35-2.15 hero-height ratio |
| Boss | 2.0-5.5 hero-height ratio; intentional exception |
| Compact ground vehicle | 170-310 px width |
| Propeller aircraft | 245-310 px width |
| Watercraft | 270-330 px width |
| Fantasy delivery vehicle | 188-330 px width |

The delivery rule is `rear-mounted-vehicle-launcher`: Olivia remains in a calm
piloting pose; the taco leaves a rear or rear-side vehicle port; a 0.16-second
gold/cyan pulse communicates the launch; no external arm sprite or procedural
limb is drawn.

## Root cause and World 2-1 correction

World 2-1 had no shared sizing fault in CSS or the camera. Four independent
canvas render paths used unrelated destination rectangles:

- Checkpoint Olivia art alternated between 112 and 120 pixels high.
- The catamaran was drawn at 390 pixels wide in normal flight and 430 pixels
  while escaping.
- Olivia's surf composite was drawn at 285 by 190 pixels.
- Fiesta Olivia was drawn at 130 by 195 pixels.

The catamaran also loaded a separate four-frame arm sheet and drew it 142 pixels
wide above the hull. The base catamaran artwork already contains Olivia at the
wheel, so the detached arm doubled her anatomy and made her appear much larger
than Taco Hero.

The corrected World 2-1 values are:

| Appearance | Before | After |
| --- | --- | --- |
| Checkpoint Olivia | 112 or 120 px high | 112 px high |
| Active catamaran | 390 px wide | 304 px wide |
| Escaping catamaran | 430 px wide | 330 px wide |
| Surf introduction | 285 x 190 px | 210 x 140 px |
| Fiesta Olivia | 130 x 195 px | proportional 112 px height |

The catamaran's embedded driving pose is retained. Its taco origin now comes
from a small rear hull launcher at the vehicle's back-left side. Taco count,
drop cadence, launch velocities, catamaran motion, catch scoring, and semantic
audio events are unchanged. There is no Jeep or ground delivery vehicle in the
current World 2-1 runtime; its checkpoint set pieces are island craft, its live
delivery vehicle is the catamaran, and its later set piece is the surfboard.

## Full-game Olivia and throwing-arm audit

| Level | Appearance audit | Result |
| --- | --- | --- |
| World 1-1 | Taco Trekker driving/drop and fiesta presentation | Already used the calm driving pose and rear launcher; unchanged reference |
| World 1-2 | Opening plane, banner flybys, taco-drop flyby, guacamole hit, damaged rescue/chase, crash | Removed the taco-drop-only arm sheet; retained every plane size, path, propeller loop, and approved audio cue; rear under-fuselage launcher added |
| World 1-3 | Radio/checkpoint/victory support; no piloted taco-drop vehicle | No detached arm found; unchanged |
| World 2-1 | Four checkpoints, active/escaping catamaran, surf introduction, fiesta | Scale normalized and catamaran arm sheet removed from loading/rendering |
| World 2-2 | Taco Trekker geyser and lava-chase drops | Already used one static driving pose and rear launcher for both drops; unchanged |
| World 2-3 | Opening roadster, lagoon catamaran, concert appearances | Already used static Olivia poses and vehicle-mounted deployment; unchanged |
| World 3-1 | Balloon delivery and cloudtop finale | Removed full-frame balloon throwing sequence; calm piloting cell and rear basket launcher retained |
| World 3-2 | Coaster courier and midnight finale | Removed alternating throwing cell; calm driving cell and rear car launcher retained |
| World 3-3 | Zeppelin parade and cosmic finale | Removed procedural arm; calm piloting cell and rear hull launcher retained |

The three superseded arm/throw image files remain as unreferenced historical art
assets, but no level loads or renders them. Automated coverage rejects any
future runtime reference to those assets or the removed arm functions.

## Cross-level vehicle comparison

| Vehicle | Render size | Classification and decision |
| --- | --- | --- |
| World 1-1 Taco Trekker | approximately 269 x 179 px | Compact ground reference; retained |
| World 1-2 propeller plane | 245-310 px wide by authored phase | Approved aircraft scale; retained |
| World 2-1 catamaran | 304 px active; 330 px escape | Normalized watercraft scale |
| World 2-2 Taco Trekker | 306 px primary delivery view | Compact ground reference; retained |
| World 2-3 roadster | 172 px wide | Intentionally compact opening vehicle; retained |
| World 2-3 catamaran | 270 px wide | Watercraft reference; retained |
| World 3-1 balloon | 188 x 250 px | Tall fantasy silhouette; retained |
| World 3-2 coaster | 310 x 207 px | Large rail vehicle; retained |
| World 3-3 zeppelin | 330 x 220 px | Large fantasy aircraft; retained |

Vehicle scale is based on a plausible Olivia cockpit/cabin fit, not a universal
vehicle width. Aircraft, watercraft, rail vehicles, and fantasy vehicles remain
intentionally different from one another.

## NPC, enemy, and boss scale audit

All nine levels were checked for hero, ordinary-enemy, NPC, vehicle, and boss
scale relationships.

- World 1 ordinary cast sizes remain within the small/standard bands. World
  1-3's Guac Pack and El Guacodillo retain their deliberate large/boss classes.
- World 2-1 ordinary enemy opaque art remains approximately 53-66 pixels high,
  with draw boxes sized for transparent crop padding. World 2-2's 88-94 pixel
  enemy art remains within the upper standard band. World 2-3 already supplied
  the stable cross-world reference used by the previous visual polish batch.
- World 3 ordinary carnival enemies remain in their authored small, standard,
  and large families. Sir Cornelius Pop, the Midnight boss, and Ringmaster
  Radish remain intentional boss-scale exceptions.
- Crowd members, concert performers, checkpoint cameos, parade figures, and
  background silhouettes were not forced to gameplay-character scale because
  depth and staging intentionally affect their presentation.

No ordinary enemy, NPC, or boss produced a second clearly broken scale outlier
after the World 2-1 corrections. No enemy render or collision value changed in
this task.

## Preserved gameplay and audio invariants

- All Taco Hero colliders, ordinary stomp classification, bounce velocity, and
  one-way-platform behavior are unchanged.
- Olivia vehicle paths, state transitions, drop counts, drop intervals, taco
  velocities, catch scoring, and completion gates are unchanged except for the
  documented visual spawn-origin offsets needed to align tacos with rear ports.
- World 1-2's approved propeller approach, pass, guacamole-hit, damaged chase,
  and crash audio remain untouched.
- Music files, audio assets, semantic event IDs, bus calibration, and ducking
  logic are untouched.
- The superseded arm art is no longer requested, reducing avoidable image work
  on mobile.

## Verification matrix

- JavaScript syntax: shared catalog plus the three changed runtimes.
- Rendered HTML regression suite: all nine pages, shared scale contract, cache
  versions, removed arm references, vehicle helpers, music hashes, and audio
  integration.
- Production build and lint.
- iPhone landscape canvas review at the World 2-1 checkpoint, catamaran, surf,
  and fiesta positions; representative World 1-2 and World 3 delivery views.
- Browser console and failed-request review.

Final branch validation completed on 2026-08-14:

- The production build and all 36 rendered-HTML regressions passed, including
  the music-integrity hash check and shared-audio integration checks.
- ESLint completed with zero errors. Its 28 warnings are existing unused-code
  and image-optimization warnings outside this focused visual behavior change.
- An 844-pixel-wide landscape browser review covered the World 2-1 checkpoint,
  catamaran, surf, and fiesta presentations; the World 1-2 plane taco drop; and
  the World 3-1 balloon, World 3-2 coaster, and World 3-3 zeppelin deliveries.
  All reviewed pages produced an empty browser-console log.
- World 3 QA start-position query parameters are accepted only on
  `terminal.local`, `127.0.0.1`, or `localhost`; this makes the local review
  route deterministic without enabling the controls on staging or production.
- Physical iPhone approval remains an owner review gate on the private staging
  deployment; the simulated landscape review is not represented as a physical
  device test.
