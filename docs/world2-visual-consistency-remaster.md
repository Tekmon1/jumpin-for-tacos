# World 2 Enemy and Midground Visual Consistency Audit

Date: 2026-08-14
Branch: `codex/world2-visual-remaster`
Production baseline: `de1c5a9767116f3df274f97aa5f432c40c1c72e8`

## Scope and invariants

This pass is presentation-only. It preserves the existing World 2 level geometry, enemy definitions, collision boxes, shared stomp classification, patrol and attack behavior, spawn positions, rewards, power-ups, checkpoints, vehicles, music, sound effects, and progression.

## Enemy inventory

### World 2-1 — remastered

The live runtime drew all five ordinary enemy families with small procedural canvas shapes. Their behavior identities were already distinct, but their art did not match the painted environments, terrain atlases, checkpoints, or premium character sheets.

| Family | Previous live presentation | Classification | Result |
| --- | --- | --- | --- |
| Crab | Procedural shell, legs, claws, and eye stalks | Needs remaster | New polished idle/walk and raised-claw action poses |
| Coconut | Procedural rotating nut and face patch | Needs remaster | New fibrous coconut idle and rolling/charge poses |
| Seagull | Procedural body, wing, beak, and feet | Needs remaster | New gliding and wing-pass poses |
| Puffer | Procedural circle, spikes, and bubbles | Needs remaster | New compact and puffed action poses |
| Tiki guardian | Procedural rounded panel and painted bands | Needs remaster | New shimmy and determined action poses |

All five families now use `world2_1_enemy_cast_v1.png`. The runtime still uses each existing `40 x 38` collision body and the same shared behavior state. The atlas supplies two visual poses; canvas translation, mirroring, bob, and telegraph treatment remain presentation-only.

The separate surf-finale tiki obstacle remains an obstacle rather than an ordinary enemy and was intentionally left unchanged in this focused enemy pass.

### World 2-2 — current with one corrected mapping

The marshmallow, pineapple, queso, pepper, crab, and nacho families already use the premium `caldera_enemy_checkpoint_sheet_v1.png` art and need no redesign.

The ash sentry was the one direct inconsistency: the live premium renderer did not map `ash`, so it fell through to the marshmallow frames even though dead fallback code contained an ash concept. The new `world2_2_ash_enemy_v1.png` provides dedicated idle and action poses while retaining the existing ash type, collision body, behavior, placement, and audio identity.

### World 2-3 — already current

Berry, mango, spaghetti, pepper, and pineapple already use animated premium frames from `neon_neckties_world_enemies_v1.png`, including action and defeated states. No replacement was warranted.

## Midground and parallax inventory

### World 2-1 — obsolete overlay removed

The approved painted environment plates already contain the island skyline, palms, temples, clouds, sun or moon, and section-specific depth. The live renderer then layered simplified procedural clouds, paired ridge silhouettes, repeated palms, and temple shapes over those plates. That duplicate midground reduced cohesion and partially obscured the painted composition.

When the painted plates load, the background renderer now returns before drawing that obsolete procedural layer. The procedural environment remains only as a defensive fallback if the approved plate assets fail. Terrain, water, platforms, gameplay foregrounds, and effects render in their original order.

### World 2-2 — already isolated correctly

`drawCalderaBackground` already returns after drawing its painted environment and authored atmosphere. Its procedural palms and ridges are fallback-only and do not layer over the approved plates. No cleanup change was needed.

### World 2-3 — already isolated correctly

The painted environment path already returns before the fallback far-sky, midground, and near-scenery composition. Its active art layers are dedicated remastered assets rather than the simplified World 2-1 overlay. No cleanup change was needed.

## Art provenance

Both new atlases are original generated game art created with the built-in ImageGen workflow. Existing repository sheets were used only as visual-quality references. The generated images used a flat chroma background, which was removed locally with the ImageGen skill's soft-matte and despill helper. No third-party art or copyrighted sample asset was introduced.

## Review focus

- Confirm all five W2-1 families remain readable on shore, canopy, tides, surge, and fiesta plates.
- Confirm the W2-1 painted backgrounds read cleanly without duplicate palm/ridge silhouettes.
- Confirm the W2-2 ash sentries now read as volcanic ash rather than marshmallows.
- Confirm top-down stomps, side contacts, combo bounces, and enemy audio are unchanged.
- Confirm W2-2 and W2-3 retain their existing premium enemy and scenery presentation.
