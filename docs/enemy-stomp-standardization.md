# Enemy Stomp and Bounce Consistency Audit

This audit covers the nine playable levels and the cumulative private-review
branch. It documents the behavior before the shared ordinary-enemy classifier
was introduced and the standard now used by every ordinary enemy runtime.

## Previous inconsistencies

| Level | Player collider | Ordinary enemy collider | Previous classification behavior |
| --- | --- | --- | --- |
| World 1-1 | 34 x 42 | Usually 36 x 38 | Required an exact body intersection before the shared swept-top check. Remastered enemies are drawn at roughly 70-72 px wide, so the visible character was about twice the width of its collider. A fixed 5 px inset reduced the effective top target further. Frenzy contact was evaluated before a valid stomp. |
| World 1-2 | 34 x 42 | 48 x 46 | Used previous-frame player and enemy positions, a 6 px top inset, a 42 px default top tolerance, and 54 px for helpers/onion behavior. Stomp was evaluated before Frenzy, and only one stomp could resolve per frame. This was the most forgiving reference implementation. |
| World 1-3 | 34 x 42 | 34-44 px wide and 32-48 px high | Used swept positions and extra route-helper tolerance. Ordinary and boss collision shared one local decision block. A genuine but off-center stomp bounced physically while only a centered `perfectStomp` selected the boing semantic event. |
| World 2-1 | 34 x 42 | Usually 40 x 38; puffer size varies | Required exact intersection, did not record/pass the previous player foot or enemy top, and evaluated Pepper/Frenzy body destruction before stomp. |
| World 2-2 | 34 x 42 | Usually 40 x 38; puffer size varies | Matched World 2-1. Geyser-window guards are a deliberate encounter rule and remain in place. |
| World 2-3 | 36 x 44 | 48 x 54 | Required exact intersection and lacked swept positions. Frenzy body destruction and a real stomp both applied the full upward bounce impulse even though only the stomp used the boing event. |
| World 3-1 | 42 x 48 | 46 x 46 | Shared the World 3 runtime: swept positions were available, but exact intersection was required first and route helpers used a local 90%-height tolerance. Frenzy body destruction also applied the full bounce impulse. |
| World 3-2 | 42 x 48 | 46 x 46 | Same shared World 3 behavior as World 3-1. |
| World 3-3 | 42 x 48 | 46 x 46 | Same shared World 3 behavior as World 3-1. |

The main World 1-1 feel discrepancy was therefore not bounce height. It was the
large visual-to-collision-width mismatch: World 1-1 and World 1-2 both draw
ordinary enemies near 70-72 px wide, while their legacy colliders were 36 px and
48 px wide respectively. The exact-intersection gate made visually plausible
edge landings substantially less reliable in World 1-1.

## Shared ordinary-enemy standard

`JFT_HERO_CORE.classifyEnemyContact()` now owns the ordinary-enemy decision.
It returns `stomp`, `body`, or `null` and uses these shared rules:

- Taco Hero must be descending, or the swept foot position must have moved
  downward between frames. Rising contact cannot earn a stomp.
- The enemy top inset scales at 12% of collider height and is clamped to 4-6 px.
- The ordinary upper stomp region scales at 60% of collider height and is
  clamped to 22-34 px.
- Authored traversal helpers use the same rule with an 86% upper region capped
  at 54 px; this is an explicit route-accessibility exception.
- Horizontal grace scales at 20% of enemy width and is clamped to 8-12 px.
- Taco Hero's outer 10% on each side is excluded from the foot footprint.
- A meaningful overlap is required: 18% of the smaller usable footprint,
  clamped to 6-10 px.
- An 8 px surface grace and previous-frame foot/enemy-top positions cover
  normal frame-to-frame tunneling without turning the whole body into a stomp.
- If the generous top test does not pass, only the original body rectangles can
  produce a normal body contact. A clear miss remains no contact.
- Every runtime limits resolution to one rewarded ordinary-enemy bounce per
  frame, while defeated/alive guards prevent repeat impulses from one enemy.

All ordinary successful stomps use the existing shared bounce velocity of
720 px/s. Bounce height was already consistent and was not increased.

## Outcomes and audio mapping

- `stomp`: enemy is defeated, Taco Hero receives the existing upward bounce,
  combo logic advances, and `combat.enemyStomp` plays the approved
  squish/splat-plus-boing sound.
- `body`: normal damage applies unless an active ability is allowed to destroy
  the enemy; ability destruction uses `combat.enemySplat` and does not receive
  the ordinary stomp bounce.
- `null`: no collision result.

World 1-3 retains its centered `perfectStomp` score, text, shockwave, and combo
punctuation. Centering is now a bonus within an already valid stomp rather than
the switch that decides whether a genuine bounce is audible.

## Deliberate exceptions

The ordinary classifier is not applied blindly to these mechanics:

- El Guacodillo keeps its state-, armor-, and vulnerability-aware boss stomp
  path in World 1-3.
- World 3 bosses keep their vulnerability gates and authored boss tolerances.
- Piñatas keep their hit locks, required hit counts, and dedicated top-contact
  tolerances.
- World 3 boss projectiles keep their return-to-sender rule.
- World 2-2 geyser guards keep the authored airborne-window requirement.
- Hazards, surf obstacles, projectiles, and intentionally non-stompable objects
  are unchanged.

## World 1-1 confetti root cause found during the same review

The earlier pickup fix removed the direct burst on every ordinary taco, but
three other repeatable paths still made ordinary collection runs look like
constant confetti:

1. taco streak thresholds at 5, 10, and 20 could retrigger after the short
   2.4-second streak reset;
2. airborne ordinary tacos fed the shared air-chain burst every five pickups;
3. all three Taco Trekker sequences emitted randomized confetti continuously
   while entering or escaping, independent of any special reward.

Ordinary taco streaks now keep their text, scoring, pickup animation, and audio
without confetti. Ordinary airborne tacos suppress only the chain confetti, and
the continuous randomized vehicle confetti emitters are removed. Authored
special events such as power-ups, premium tacos, piñatas, checkpoints, stomp
milestones, vehicle state reveals, and level celebrations retain confetti.
