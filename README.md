# Jumpin’ For Tacos

Jumpin’ For Tacos is a colorful browser platform adventure created by Travis King with his daughter Olivia woven into the game’s story. Taco Hero runs, jumps, stomps enemies, collects tacos, follows Olivia’s vehicle-powered taco drops, battles bosses, and celebrates across nine handcrafted levels.

Play the current release at [jumpinfortacos.com](https://jumpinfortacos.com).

## The adventure

### World 1: Sunset Salsa

- 1-1: Sunset Salsa Run
- 1-2: Sky-High Salsa Rescue
- 1-3: Sunset Salsa Showdown

### World 2: Coconut Crunch Cove

- 2-1: Coconut Crunch Cove
- 2-2: Campfire Caldera Caper
- 2-3: Neon Neckties: Turn the Sunset Up

### World 3: Starlight Taco Carnival

- 3-1: Cloudtop Carnival Kickoff
- 3-2: Midnight Midway Mayhem
- 3-3: Taco Nova Firework Finale

## Highlights

- Nine complete browser-playable levels
- Keyboard, touch, and gamepad controls
- Authored ground and elevated combat routes
- Taco Frenzy, Taco Magnet, checkpoints, bosses, and celebrations
- Olivia vehicle sequences and taco drops
- Original pixel-art environments, character sheets, music, and sound
- Responsive landing page with direct access to every level

## Run locally

The project requires Node.js 22.13 or newer. The included development scripts are designed for Linux or Windows Subsystem for Linux.

```bash
npm ci
npm run dev
```

Then open the local address printed by Vite.

## Validate the project

```bash
npm test
npm run lint
```

`npm test` builds the production artifact, validates it, and runs the complete rendered game regression suite.

## Project layout

- `app/`: landing page, metadata, sitemap, and global styling
- `public/game/`: all nine playable level pages and game runtimes
- `public/game/assets/`: character art, environments, music, and sound
- `public/assets/`: landing-page and social artwork
- `tests/`: rendered integration and regression tests
- `docs/`: gameplay and remaster QA notes
- `scripts/`: build validation and music-generation utilities

## GitHub setup

This source package intentionally excludes generated dependencies, local caches, build output, and prior Git metadata. Extract it into a new repository, commit the contents, and push the repository normally.

The game assets are already bundled. No Git LFS setup is currently required because every individual file is below GitHub’s 100 MB file limit.

## Creator

Created by [Travis King](https://x.com/TravisKingX), with Olivia as the heart of the adventure.
