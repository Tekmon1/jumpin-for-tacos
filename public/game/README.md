# Jumpin For Tacos

A small original side-scrolling platformer built in plain HTML5, CSS, and JavaScript so it can run locally on a computer now and be adapted for iPhone later.

## How to run it locally

### Easiest
Open `index.html` in Chrome, Edge, Safari, or Firefox.

### Slightly cleaner option
Run a tiny local web server in the folder:

```bash
cd jumpin_for_tacos
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Controls

- Move: `A` / `D` or Left / Right arrows
- Jump: `W`, `Space`, or Up arrow
- Mobile: use the on-screen buttons
- Xbox/standard controller: left stick or D-pad to move, `A` to jump/confirm, `B` to close dialogs, `Y` for fullscreen where supported, and Menu for settings/pause

## Shared audio foundation

Every level page loads `audio-catalog.js` and `audio-engine.js` before its
runtime and uses semantic calls such as
`JFT_AUDIO.play('combat.enemyStomp', options)`.
The engine owns the Music, Gameplay SFX, UI, Ambience, and Master buses,
centralized ducking, limiting, voice priority, cooldown, polyphony, variation,
and telemetry. Raw oscillator synthesis is reserved for its emergency fallback.

Review the full-game Phase 3 mix locally at `/game/audio-lab.html`. The page is private
in the sense that no public game or landing-page navigation links to it. Its
representative music playback uses the existing music files unchanged.

Regenerate the committed original WAV library from the repository root with
`npm run generate:sfx`. The deterministic asset hashes and measurements are in
`assets/sfx/sfx-manifest.json`. The non-perfect enemy contact is intentionally
a soft, juicy squish; the perfect outcome layers the shared squish body with a
pronounced rebound.

Controller support lives in `controller.js` and is loaded automatically by
`levels.js`. New levels inherit controller support when they load the shared
level catalog. The `X` button emits the shared `jft:controlleraction` special
ability event so later powers can use it without changing the controller layer.
The controller also emits `jft:controllerstate` every animation frame. Levels
with source-aware input should reconcile held stick/D-pad directions from this
event so movement recovers immediately after respawns, cinematics, and focus
changes instead of relying only on button-edge events.

## Required start screen for every level

Every level must load `levels.js` before its own runtime and include:

- `#startOverlay` around the level introduction
- a `.card` inside that overlay
- a `#startBtn` button
- `window.JFT_LEVEL_START.bind(startGame)` in the level input setup

The shared start system adds the mobile-safe layout automatically and creates a
fallback **Start the Adventure** button when a future level omits one. Give each
level its own whimsical phrase when possible. On short iPhone screens the whole
introduction card scrolls naturally, with the start action placed immediately
after the level description just like World 1-2.

## What's in this version

- Original taco-themed platformer art
- Original simple retro music loops
- Level 1 called **Sunset Salsa Run**
- Collectible tacos, hot sauce, jalapeños, and guac
- Chili pepper enemies
- End-of-level fiesta celebration with confetti, fireworks, and taco rain
- Mobile-friendly touch controls

## iPhone path later

This project is already structured like a lightweight web game, so the clean next step would be one of these:

1. Wrap it with Capacitor for iPhone deployment
2. Turn it into a PWA with an icon and manifest
3. Rebuild it in Phaser if you want more levels and richer game systems

## Notes

This is inspired by classic side-scrolling platformers, but all art, music, and code here are original for this prototype.

## Tweaks in this build

- Renamed the game to **Jumpin For Tacos**
- Added a taco-beam respawn: when all hearts are gone, the hero pops into a salsa burst, gets zapped upward, and drops back nearby with full health
- Falling into a gap now respawns you near where you messed up instead of sending you on a sad little walk of shame
- Reworked the final third of Level 1 so the platform chain is actually jumpable by a human and not just by caffeinated ghosts
