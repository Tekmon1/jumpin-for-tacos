# World 2 Visual Consistency and Scale Audit

Date: 2026-08-14

Branch: `codex/world2-visual-remaster`

Production baseline: `de1c5a9767116f3df274f97aa5f432c40c1c72e8`

## Scope and invariants

This cumulative branch contains the approved World 2-1 enemy-art remaster and obsolete-midground cleanup plus the focused consistency pass described here. The pass changes only:

- World 2-1 and World 2-2 enemy rendering scale and proportional shadows;
- the downward painted skirt of elevated World 2-1 and World 2-2 platforms;
- safe, platform-derived World 2-1 patrol lanes; and
- the World 2-2 Taco Trekker's visual taco deployment point.

Enemy collision boxes, the shared generous stomp classifier, platform collision rectangles, top surfaces, widths, gaps, jump geometry, taco counts, drop timers, checkpoints, rewards, audio events, music, vehicles, and progression remain unchanged.

## World 2-2 Taco Trekker repair

Both the Geyser Gardens picnic drop and the lava-chase drop call the same `spawnBoatTaco()` function. Both visual states were also classified by one `dropping` flag, which passed `throwing: true` into `drawCalderaTrekkerVehicle()`. That option invoked a separate procedural `drawTrekkerThrowArm()` overlay. The gameplay taco itself spawned at the unrelated fixed point `boat.x + 28, 314`, near the center/cabin rather than the vehicle's rear.

The repair removes the arm renderer and `throwing` option entirely. The common spawn helper now uses one orientation-aware rear launcher definition:

| Property | Value |
| --- | ---: |
| Horizontal offset from Trekker center | `-104 px` |
| Vertical offset from ground | `-119 px` |
| Visual launcher pulse | `0.16 s` |
| Taco velocity/timing/count | Unchanged |

The Trekker moves screen-right and its approved base art is mirrored, so negative screen-space X is the physical rear. The new point aligns with the rear cargo/taco rack. A short gold ring and three rearward streaks make the mechanical deployment readable without adding a limb or changing Olivia's driving pose. Both drop states still use the same semantic `vehicle.tacoDrop` event.

## Full-game ordinary-enemy scale audit

Measurements below use the actual alpha-occupied area of representative idle/action frames after each runtime's destination scaling, not source-file pixel dimensions. Width/height ranges include ordinary species variation. Bosses, vehicles, hazards, decorative NPCs, and the World 2-1 surf-finale tiki obstacle are excluded.

| Level | Taco Hero | Ordinary collision box | Destination art envelope | Measured opaque art | Level-wide multiplier / notes |
| --- | --- | --- | --- | --- | --- |
| World 1-1 | `34 x 42` | `36 x 38` | `70–72 px` square | `49–64 W x 55–64 H` | Per-type 70/72 px; no global multiplier |
| World 1-2 | `34 x 42` | `48 x 46` | `70–72 px` square | `50–66 W x 47–65 H` | Per-type 70/72 px; no global multiplier |
| World 1-3 | `34 x 42` | `34–44 W x 32–48 H` | `72–78 px` square | `37–68 W x 41–63 H` | Per-species size; churro intentionally narrow |
| World 2-1, before | `34 x 42` | `40 x 38` | `100–116 W x 70–80 H` | `45–88 W x 56–76 H` | Entire painted sheet used oversized destination rectangles |
| World 2-1, corrected | `34 x 42` | `40 x 38` | `84–104 W x 66–70 H` | `42–79 W x 53–66 H` | Per-species profile; seagull wing span is the intentional width exception |
| World 2-2, before | `34 x 42` | `44 x 44` | Common `84 x 112` | `60–84 W x 59–84 H` | One tall rectangle for six differently padded species |
| World 2-2, corrected | `34 x 42` | `44 x 44` | `70–78 W x 88–96 H` | `50–76 W x 49–67 H` | Per-species profile compensates for atlas padding; ash remains `76 x 66` |
| World 2-3 | `36 x 44` | `48 x 54` | `92 x 78` | `36–77 W x 64–78 H` | Current reference; spaghetti is intentionally tall |
| World 3-1 | `42 x 48` | `46 x 46` | Trimmed `78–104 W x 70–86 H` | Approximately destination size | Larger hero and per-species trimmed profiles; bumper is intentionally broad |
| World 3-2 | `42 x 48` | `46 x 46` | Trimmed `78–104 W x 70–86 H` | Approximately destination size | Shares the World 3 runtime/profile table |
| World 3-3 | `42 x 48` | `46 x 46` | Trimmed `78–104 W x 70–86 H` | Approximately destination size | Shares the World 3 runtime/profile table |

### Corrected World 2 profiles

World 2-1 destination rectangles:

| Family | Before | Corrected |
| --- | ---: | ---: |
| Crab | `100 x 70` | `84 x 66` |
| Coconut | `114 x 74` | `94 x 68` |
| Seagull | `116 x 74` | `104 x 68` |
| Puffer | `104 x 74` | `94 x 68` |
| Tiki guardian | `112 x 80` | `104 x 70` |

World 2-2 destination rectangles:

| Family | Before | Corrected |
| --- | ---: | ---: |
| Marshmallow | `84 x 112` | `78 x 94` |
| Pineapple | `84 x 112` | `76 x 90` |
| Queso | `84 x 112` | `76 x 94` |
| Pepper | `84 x 112` | `70 x 88` |
| Crab | `84 x 112` | `76 x 96` |
| Nacho | `84 x 112` | `76 x 90` |
| Ash | `76 x 66` | `76 x 66` (already consistent) |

The smaller art remains at least as large as its collision body in both axes after transparent padding is removed. Shadow centers and contact baselines remain unchanged; only the shadow radii now follow each render profile.

## Collision and bounce compatibility

No enemy hitbox changed. All ordinary enemies still use `ordinary-stomp-v1` from `levels.js`, including its proportional top region, 8–12 px horizontal grace, 8 px surface grace, cross-frame allowance, and minimum-overlap rule. World 2-1 remains `40 x 38`; World 2-2 remains `44 x 44`.

This keeps the approved feedback contract intact:

- non-rewarded contact: normal squish/splat;
- rewarded stomp: squish/splat plus boing; and
- bosses, armor, hazards, and authored exceptions retain their own rules.

## Platform scale audit and correction

The platform widths and collision surfaces were not outliers. World 2-1's common upper route is `144–198 px` wide; World 2-2's authored detours are commonly `150–184 px`; World 2-3's comparison route is `156–204 px`. Ground islands and longer vehicle-route supports are purpose-built navigation surfaces and align with the game's other long runways.

The visual inconsistency came from the opaque painted skirt extending too far below otherwise normal `22–24 px` collision rectangles.

| Level | Upper collision height | Painted height before | Painted height after | Gameplay geometry |
| --- | ---: | ---: | ---: | --- |
| World 1-1 reference | commonly `22–28` | `42–44` | unchanged | unchanged |
| World 1-2 reference | commonly `24–28` | `42–46` | unchanged | unchanged |
| World 1-3 reference | commonly `22–28` | `42–48` | unchanged | unchanged |
| World 2-1 | `22–24` | `50–52` | `44` | unchanged |
| World 2-2 | `22–24` | `56–58` | `46` | unchanged |
| World 2-3 reference | commonly `24` | `58` with neon treatment | unchanged | unchanged |

Only destination artwork depth changed. Platform Y, top-contact line, `x`, `w`, `h`, movement range, and collision resolution are byte-for-byte the same expressions as before. Ground-platform rendering remains unchanged.

## World 2 patrol audit

### World 2-1 corrected outliers

The visible rapid-turnaround problem had two sources:

1. The five opening combo helpers had hard-coded `x ± 12` patrols: only `24 px` total travel.
2. Ordinary ground enemies used at most `x ± 115`, even on `620–860 px` safe islands.

Both sets now use the existing shared `retuneEnemyFormationPatrols()` helper after their support platforms are known. Enemies on the same platform receive separate non-overlapping lanes, a `12 px` hitbox gap, and `20 px` edge margins.

| Group | Previous spans | Corrected spans |
| --- | ---: | ---: |
| Five opening combo helpers | `24 px` | `192–244 px` |
| Ordinary ground patrols | `201–230 px` | `540–780 px` |
| Existing upper/surface formations | full safe platform | unchanged |

The broader ranges fix the endpoint frequency at its source. Speed, behavior clocks, attack telegraphs, enemy count, support platforms, and fall prevention are unchanged.

### World 2-2 and World 2-3 audit

No pathing changes were needed:

- World 2-2 individual ground enemies already receive up to `216 px` local travel, and its geyser/ash formations already use full-platform separated lanes.
- World 2-3 ground, upper-route, and generator-defense groups already call the shared full-platform retuner with explicit edge padding and non-overlap gaps.

## Approved art and provenance

World 2-1 continues to use `world2_1_enemy_cast_v1.png`; World 2-2 continues to use `caldera_enemy_checkpoint_sheet_v1.png` plus `world2_2_ash_enemy_v1.png`; World 2-3 remains unchanged. No new image or third-party asset was introduced in this consistency pass.

The two existing remaster atlases are original generated game art created with the built-in ImageGen workflow. Their earlier provenance remains unchanged.

## Review focus

- Confirm both World 2-2 Taco Trekker drops show Olivia driving with no arm overlay.
- Confirm tacos visibly leave the Trekker's rear rack in both geyser and lava states.
- Compare Taco Hero against ordinary enemies in World 1, all three World 2 levels, and World 3.
- Confirm World 2-1 patrols travel before turning and never leave their support surface.
- Confirm platform tops, jump routes, taco trails, checkpoints, stomps, squish/boing audio, music, and progression remain unchanged.
