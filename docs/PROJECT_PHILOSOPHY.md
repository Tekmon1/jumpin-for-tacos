# Jumpin' for Tacos Project Philosophy

## Status of This Document

This document is the living design, development, quality, and release charter for **Jumpin' for Tacos**.

It is not merely a description of the game. It is a decision filter.

When two possible changes compete, the option that better protects the principles in this document should normally win. When a requested change conflicts with these principles, the conflict should be identified before implementation rather than quietly buried inside the code.

This document applies to:

- The nine playable levels
- The shared game systems
- The landing website
- Art and animation remastering
- Music and sound-effect work
- Input and controller support
- Testing and quality assurance
- GitHub issues, branches, commits, and releases
- Work performed by Codex or another coding assistant

---

# 1. The North Star

**Jumpin' for Tacos should feel handmade, joyful, responsive, colorful, and full of personality.**

The game should invite the player into a playful adventure rather than challenge them to tolerate frustration. It can become exciting, dramatic, and demanding, but it should remain fair, readable, and welcoming.

The game’s strongest qualities are not technical novelty or architectural cleverness. Its strongest qualities are:

- Charm
- Momentum
- Humor
- Color
- Responsive movement
- Memorable locations
- Distinctive music
- Clear character
- The feeling of a personal adventure made with care

Every meaningful change should improve at least one of these qualities without unnecessarily damaging another.

---

# 2. Identity and Tone

Jumpin' for Tacos is a colorful, family-friendly browser platform game with a whimsical adventure tone.

It should feel energetic and sincere without becoming childish, cynical, cruel, or generic.

The tone should be:

- Playful
- Warm
- Adventurous
- Slightly absurd in a deliberate way
- Visually expressive
- Funny through character, movement, timing, and situation
- Suitable for a broad audience
- Emotionally positive without becoming sugary or empty

The game may contain danger, bosses, crashes, chases, dramatic weather, and escalating action. These elements should feel exciting rather than grim.

Humor should never depend on humiliating a central character or making the player feel foolish for engaging with the game.

Tacos are more than generic collectibles. They are part reward, part celebration, part visual guide, and part identity. Their use should feel purposeful.

---

# 3. The Player Experience Comes First

Technology serves the experience. The experience does not serve the technology.

A technically impressive feature is not an improvement when it makes the game:

- Less responsive
- Less readable
- Less stable
- Harder to control
- Slower to load
- More confusing
- Less charming
- More difficult to maintain without a clear benefit

The player should rarely need to wonder:

- Where am I supposed to go?
- What damaged me?
- Did the game receive my input?
- Is that object solid?
- Is this character standing on the ground?
- Did I reach a checkpoint?
- Did I finish the level?
- Why did the music restart?
- Why does this control work on one device but not another?

Clarity is not the enemy of wonder. Clarity is what allows wonder to survive contact with gameplay.

---

# 4. Preserve What Already Works

Jumpin' for Tacos has grown through many rounds of building, remastering, testing, and correction. Existing behavior should not be casually replaced merely because another implementation looks cleaner on paper.

Before changing an established system:

1. Determine what it currently does.
2. Determine which levels depend on it.
3. Determine whether the behavior is shared or level-specific.
4. Identify existing regression tests and QA hooks.
5. Preserve unrelated behavior.
6. Make the smallest coherent change that solves the actual problem.
7. Test the changed behavior and the neighboring behavior.

A visual task should not secretly change physics.

An audio task should not secretly change level progression.

A controller task should not accidentally rewrite keyboard behavior.

A landing-page task should not alter the game engine.

A bug fix should not become an unrequested architectural renovation.

Existing oddities should be understood before they are removed. Some may be intentional, some may support a specific level, and some may be part of the game’s handmade character.

---

# 5. Architectural Boundaries

The existing architecture is intentional enough to deserve respect.

## Website Layer

The `app/` directory supplies the public landing page, metadata, SEO, route discovery, visual presentation, project information, controls information, and links into the playable game.

The website is the front door. It is not the main game engine.

Changes to the website must preserve:

- All intended level links
- Canonical URLs
- Metadata and social presentation
- Sitemap and robots behavior
- Responsive presentation
- The soundtrack and project-story experience
- Accurate descriptions of the game
- Direct access to the playable routes

The landing page must never become beautifully polished while the actual game routes are broken.

## Game Layer

The game under `public/game/` is a self-contained HTML5 Canvas experience using HTML, CSS, JavaScript, art, and audio assets.

Do not migrate the game into React, TypeScript, a new engine, or a new framework unless Travis explicitly approves a dedicated architectural project.

Do not treat the existing plain-JavaScript structure as a defect merely because another structure is more fashionable.

Shared services such as controls, fullscreen behavior, abilities, level catalog behavior, and progression should remain shared when they are truly common.

Level-specific behavior may remain level-specific when forced abstraction would make the code more fragile or harder to reason about.

Do not perform a sweeping consolidation of the large runtime files during an unrelated feature or bug-fix task.

## Build and Hosting Layer

The project uses its existing Vinext, Vite, Cloudflare, Worker, and Sites hosting structure.

Do not assume it uses a conventional Next.js production server.

Do not modify hosting configuration, Worker behavior, build plugins, package configuration, or deployment assumptions unless the task specifically requires it.

The `build/` directory contains source-controlled build infrastructure. It must not be deleted merely because its name resembles a generated-output directory.

## Data and Authentication Layer

The database and authentication-related files are currently scaffolding rather than core gameplay requirements.

Do not activate, expand, or redesign database, authentication, account, cloud-save, or persistent-state systems unless a task explicitly requires them.

Do not add infrastructure simply because it is available.

---

# 6. The Canonical Source of Truth

The canonical local workspace is:

`C:\Users\sbtra\Documents\jumpin-for-tacos-github`

The GitHub repository and its tracked history are the source of truth.

Older extracted ZIP files and OneDrive copies are archives or references only. They are not active development workspaces.

Never silently edit an older copy and assume the GitHub repository received those changes.

Before every coding task, verify:

- Correct workspace
- Correct repository
- Correct branch
- Clean working tree
- Current relationship to `origin/main`

Do not create additional clones or worktrees without a clear reason and explicit approval.

Do not place machine-specific absolute Windows paths inside application code, HTML, CSS, configuration, or documentation intended for the repository.

---

# 7. Gameplay Feel

The game should feel responsive before it feels elaborate.

Player movement, jumping, landing, attacking, collecting, restarting, and interacting should provide immediate and understandable feedback.

Core expectations include:

- Inputs are recognized reliably.
- Movement does not feel delayed or muddy.
- Jumping feels intentional and controllable.
- Landing is visually and mechanically clear.
- Collision behavior matches what the player sees.
- Camera movement supports play rather than fighting the player.
- Damage is readable.
- Death and restart behavior are quick and understandable.
- Checkpoint activation is unmistakable.
- Completion is satisfying and unambiguous.

Physics values, camera values, collision boxes, and movement timing should not be changed casually.

When gameplay feel must change, record:

- The previous behavior
- The intended new behavior
- The values or logic changed
- Which levels were tested
- Which input methods were tested
- Any remaining risk

---

# 8. Level Length and Pacing

A normal level should generally aim for approximately **four to five minutes for a clean first playthrough**.

Finales, boss-heavy stages, major set pieces, or intentionally cinematic levels may run longer when the additional time feels earned.

Levels should not become longer through:

- Empty travel
- Repeated scenery with no new idea
- Excessive enemy waves
- Long punishment after a death
- Slow forced waiting
- Unclear routes
- Repetition disguised as difficulty

A strong level rhythm generally includes:

1. A clear opening
2. Introduction or reintroduction of the level’s central idea
3. Development of that idea
4. Escalation
5. A memorable set piece, encounter, or finale
6. A satisfying finish or transition

Every section should have a reason to exist.

A level should end before its best idea becomes tired.

---

# 9. Difficulty Must Be Fair

Difficulty should create attention and decision-making, not resentment.

Fair challenge includes:

- Readable hazards
- Understandable enemy behavior
- Adequate reaction time
- Clear collision boundaries
- Logical checkpoint placement
- Consistent rules
- Recoverable mistakes
- Escalation that teaches before it demands mastery

Avoid:

- Cheap hits
- Enemies attacking from outside the visible play area without warning
- Hazards hidden behind foreground art
- Blind jumps
- Sudden collision changes
- Untelegraphed boss attacks
- Requiring information the player could not reasonably possess
- Long replay sections after a difficult encounter
- Difficulty created solely by adding more health, speed, or clutter

Enemies and bosses should have readable anticipation, action, and recovery states.

Bosses should feel dramatic without becoming damage sponges.

Later difficulty should preferably emerge from combinations, timing, routes, and decision pressure rather than arbitrary numerical inflation.

---

# 10. Checkpoints, Death, and Recovery

Checkpoints are promises to the player.

When a checkpoint activates, the player should clearly see or hear that activation.

A checkpoint should restore the player to a sensible state with:

- Correct position
- Correct camera
- Correct progression state
- Correct enemies and hazards
- Correct music or scene state
- No duplicated rewards
- No missing required objects
- No soft lock

Checkpoints should normally appear before major difficulty spikes, bosses, long set pieces, or meaningful changes in the level.

Death should teach something and return the player to play quickly.

The game should never punish the player with unnecessary waiting, a broken camera, missing controls, incorrect music, or a corrupted encounter state after restart.

---

# 11. Tacos, Rewards, and Progression

Tacos should:

- Help guide the player
- Reward skill or exploration
- Reinforce the game’s personality
- Provide satisfying visual and audio feedback
- Remain readable against the environment
- Avoid baiting the player into unfair damage

Taco trails may suggest routes, jumps, secrets, timing, or movement arcs.

Tacos should not be scattered without purpose merely to make a space look busy.

When tacos are launched or dropped from a vehicle, they should originate from the vehicle or a visually coherent launcher, hatch, chute, or delivery mechanism.

Do not use a detached arm or awkward isolated throw animation when the vehicle itself is the natural source of the taco drop.

Level completion, unlocks, and progression must remain synchronized with:

- The level catalog
- Direct links
- Landing-page links
- Manifests
- Next-level behavior
- Victory sequences
- Any persistent browser state

All nine levels should remain directly reachable through their intended routes.

---

# 12. Controls Are a Non-Negotiable Feature

Keyboard, touch, and standard gamepad support are all first-class requirements.

A feature is not complete when it works only with the input method used by the developer.

Any change touching movement, menus, pause behavior, abilities, fullscreen behavior, restarting, level selection, or interaction must be checked with all relevant input methods.

## Keyboard

Keyboard controls should remain responsive and should not become trapped by unrelated page behavior.

## Touch

Touch controls should:

- Be large enough to use
- Remain visible when needed
- Avoid covering essential gameplay
- Avoid accidental browser gestures where practical
- Work in the supported orientations
- Provide clear pressed-state feedback
- Preserve simultaneous movement and action input

## Gamepad

Gamepad behavior should:

- Detect supported controllers reliably
- Avoid repeated input from a single press
- Preserve expected movement and action mappings
- Handle connection and disconnection sensibly
- Not break keyboard or touch behavior

## Fullscreen and Focus

Fullscreen transitions, browser focus changes, tab changes, and resume behavior must not leave controls stuck or music duplicated.

Never sacrifice one input method to simplify another without explicit approval.

---

# 13. Visual Direction

The visual identity should remain colorful, polished, energetic, and cohesive.

The desired look is a remastered, storybook-cartoon adventure with strong silhouettes and readable gameplay.

Visual polish must support play.

Priorities include:

- Clear separation between player, enemies, hazards, rewards, and scenery
- Consistent character scale
- Distinct world palettes
- Legible platforms and ground
- Strong silhouettes
- Layered depth
- Controlled visual density
- Cohesive lighting and color
- Meaningful animation
- Consistent quality among neighboring assets

Avoid:

- Generic placeholder art
- Stylistically unrelated replacements
- Excessive particle clutter
- Decorative effects that hide hazards
- Foreground elements that block gameplay
- Unnecessary saturation that destroys contrast
- Mixing incompatible sprite scales
- Replacing approved character art without explicit reason
- Treating more detail as automatically better

Background, midground, near scenery, gameplay terrain, characters, effects, and foreground decoration should have distinct visual jobs.

Foreground decoration must never obscure critical jumps, hazards, enemies, or the player.

---

# 14. Physical Grounding and Sprite Placement

Characters and enemies must be grounded by their **feet or intended contact point**, not by the center of their shadows.

A shadow may support depth, but it is not the authoritative collision or placement anchor.

Avoid:

- Floating characters
- Characters buried in terrain
- Feet sliding above the ground
- Incorrect sprite origins
- Scale changes between adjacent scenes
- Shadows detached from the character
- Characters standing on background art rather than gameplay terrain
- Visible collision behavior that contradicts the artwork

When replacing or remastering a sprite, verify:

- Source dimensions
- Frame dimensions
- Pivot or origin point
- Foot position
- Collision box
- Scale in the actual level
- Position at checkpoints
- Position during cinematics
- Position on slopes or moving objects when applicable

A sprite that looks correct in an image viewer is not automatically correct inside the game.

---

# 15. Character Treatment

Named characters should be treated with warmth, dignity, and consistency.

Olivia is not disposable background decoration or an awkward visual prop. She should feel intentional, capable, natural, and emotionally connected to the adventure.

Olivia’s presentation should preserve:

- Consistent scale
- Natural poses
- Physical grounding
- Clear visual purpose
- Warm characterization
- Appropriate placement in vehicles, checkpoints, celebrations, and scenes
- Cohesion with the surrounding artwork

Avoid:

- Floating or disconnected body parts
- Uncanny arm-only animations
- Accidental clipping
- Abrupt scale changes
- Poses that appear physically impossible without narrative reason
- Using Olivia as a signboard
- Dialogue that feels mechanical or out of character
- Jokes that humiliate or diminish her
- Treating her presence as an afterthought

The player character, Olivia, allies, villagers, bands, crowds, and other friendly characters should feel like inhabitants of the same world rather than assets pasted into it.

---

# 16. Animation Standards

Animation should communicate intent.

Useful animation phases include:

- Anticipation
- Action
- Contact
- Reaction
- Recovery
- Return to idle or movement

Not every action requires elaborate animation, but the player should understand what is happening.

Avoid:

- Jerky frame changes
- Unexplained snapping
- Sliding feet
- Animation loops that ignore movement speed
- Effects that occur before the action
- Damage reactions that hide continued danger
- Celebrations that interrupt required gameplay state
- Animation changes that accidentally modify collision or timing

When remastering animation, preserve gameplay timing unless changing that timing is an explicit part of the task.

Animation polish should not make hitboxes deceptive.

---

# 17. World and Level Remastering

Each world should have its own identity through:

- Palette
- Environment
- Music
- Weather or atmosphere
- Terrain language
- Enemy presentation
- Vehicles
- Set pieces
- Celebration or conclusion

The three worlds should feel connected to the same game without feeling like visual copies.

A level remaster should consider the complete scene:

1. Far background
2. Midground
3. Near scenery
4. Gameplay ground
5. Platforms
6. Characters and NPCs
7. Enemies and hazards
8. Collectibles
9. Checkpoints
10. Effects
11. Audio
12. Route readability
13. Performance
14. Victory presentation

Remastering must not accidentally:

- Alter the intended route
- Hide platforms
- Change collision assumptions
- Cover hazards
- Break checkpoints
- Increase difficulty through visual confusion
- Add assets too large for practical browser performance
- Make one level look unrelated to its neighbors

A remaster is successful when the level feels richer and more coherent while remaining at least as playable as before.

---

# 18. Dialogue, Signs, and Interface Text

Character dialogue should normally appear as dialogue.

When a character is speaking, prefer a readable speech or chat bubble over text that looks like an environmental sign.

Environmental signs remain appropriate for:

- Directions
- Place names
- Warnings
- Labels
- World-building signage
- Control instructions when necessary

Do not make every piece of text a chat bubble. The visual form should match the source of the message.

Text should be:

- Concise
- Legible
- Correctly attributed
- Properly scaled
- Visible long enough to read
- Clear on desktop and mobile
- Positioned without hiding danger or controls

Instructions should teach only what the player needs at that moment.

The interface should not explain around a design problem that could be solved more clearly through level layout, animation, or feedback.

---

# 19. Music Philosophy

Music is part of the game’s identity, not merely background filler.

Each musical cue should support:

- Location
- Mood
- Escalation
- Character
- Movement
- Boss phases
- Cinematics
- Victory
- Transitions

Music transitions should feel intentional.

Avoid:

- Abrupt unintended restarts
- Two tracks playing simultaneously
- Music continuing after the scene has changed
- Excessively loud tracks covering gameplay feedback
- Repeated transitions caused by checkpoint or focus bugs
- Replacing signature music with generic material
- Breaking cue timing in authored sequences

Signature musical experiences, including Neon Neckties material and level-specific compositions, should be treated as authored set pieces.

Browser autoplay restrictions must be respected. Audio should begin or resume through valid player interaction where required.

Pause, restart, death, checkpoint, focus loss, and level completion must leave the audio system in a coherent state.

---

# 20. Sound-Effect Philosophy

Sound effects should make actions feel clear, responsive, and satisfying.

A sound-effect remaster should aim for:

- Clear transients
- Consistent loudness
- Distinct gameplay meaning
- Appropriate duration
- Cohesive style
- Minimal listener fatigue
- Good balance with music
- No harsh clipping
- No excessive stacking

Important actions should have distinct audio identities, including where appropriate:

- Jumping
- Landing
- Damage
- Defeating an enemy
- Collecting tacos
- Activating checkpoints
- Boss attacks
- Abilities
- Vehicle actions
- Victory
- Menu or interface confirmation

Do not solve weak sound design merely by increasing volume.

Repeated actions should not become painful or exhausting.

When several sounds may occur together, manage overlap so that critical feedback remains audible.

Audio-only work should not alter gameplay logic unless the task explicitly requires synchronization changes.

---

# 21. Performance and Browser Reliability

Jumpin' for Tacos is a browser game. Loading time, memory use, frame pacing, and asset behavior are gameplay concerns.

Changes should avoid:

- Unnecessarily loading every large asset at startup
- Repeatedly decoding the same audio
- Unbounded particle creation
- Memory leaks across restart
- Duplicate event listeners
- Duplicate animation loops
- Large invisible images consuming resources
- Excessive layout work around the Canvas
- Console-error spam
- Case-sensitive path failures on deployment
- Device-specific assumptions

Asset filenames and paths must work in a case-sensitive production environment, even when they appear to work on Windows.

Direct level URLs must work after a reload.

The landing page and game should remain usable across the supported desktop and mobile browsers.

Visual quality should scale sensibly without making lower-powered devices unusable.

Performance should be measured in the actual game, not assumed from code appearance.

---

# 22. Accessibility and Readability

The game should remain approachable to players using different devices, display sizes, and input methods.

Where practical:

- Do not rely on color alone to communicate danger or success.
- Maintain readable contrast.
- Keep text large enough for mobile displays.
- Avoid excessive flashing.
- Avoid camera movement that is needlessly disorienting.
- Keep essential instructions available long enough to read.
- Make mute or volume behavior understandable.
- Preserve clear focus behavior on the landing page.
- Keep touch controls visually distinct from gameplay art.

Accessibility improvements should preserve the game’s visual identity rather than replacing it with a sterile interface.

---

# 23. Testing Philosophy

A change is not complete because the code looks reasonable.

Testing should combine:

- Existing automated regression tests
- Build validation
- Direct route checks
- Manual gameplay
- Input checks
- Visual inspection
- Console inspection
- Relevant performance checks

Use the actual commands defined by the repository. Read `package.json` and existing scripts rather than inventing command names.

Some scripts use Bash and may require WSL or another Linux-compatible environment on Windows. When a test cannot be run in the current environment, say so plainly and provide the exact command that remains to be run.

Never claim a test passed unless it was actually executed and passed.

Never claim a browser interaction was manually verified unless it was actually performed.

## Baseline Before Modification

Before modifying gameplay:

1. Identify the affected route.
2. Identify the expected current behavior.
3. Identify neighboring systems that might regress.
4. Run or inspect the most relevant existing tests.
5. Record any pre-existing failure separately.

## Minimum Gameplay Regression Checklist

For relevant gameplay changes, verify:

- Level loads directly
- Player appears correctly
- Keyboard input works
- Touch input remains intact
- Gamepad behavior remains intact
- Movement and jumping work
- Camera starts correctly
- Collisions are sensible
- Enemies initialize
- Tacos can be collected
- Damage works
- Death and restart work
- Checkpoint activation works
- Checkpoint restoration works
- Music starts correctly
- Music changes correctly
- Fullscreen behavior remains usable
- Boss or finale behavior works when affected
- Level completion works
- Progression to the next intended route works
- No new console errors appear

## Visual and Animation QA

For visual changes, verify the result inside the actual level at gameplay scale.

Check:

- Grounding
- Scale
- Clipping
- Layer order
- Collision alignment
- Readability
- Mobile presentation
- Animation timing
- Foreground obstruction
- Asset loading
- Performance

## Audio QA

For audio changes, check:

- Start
- Stop
- Pause
- Resume
- Restart
- Death
- Checkpoint
- Scene transition
- Victory
- Focus loss
- Repeated triggering
- Music and sound-effect balance

---

# 24. Definition of Done

A task is done only when all applicable conditions are met:

- The requested behavior is implemented.
- The change remains within the agreed scope.
- The correct workspace and branch were used.
- No unrelated files were changed.
- The relevant automated tests pass, or any unrun tests are clearly disclosed.
- The relevant build validation passes, or the reason it could not be run is stated.
- Manual testing covers the affected route and behavior.
- Relevant keyboard, touch, and gamepad behavior is checked.
- No new console errors are introduced.
- Asset paths work under production-style case sensitivity.
- The game remains playable through the intended direct URL.
- Checkpoint, death, restart, and completion behavior remain intact when relevant.
- Performance remains acceptable.
- Documentation is updated when behavior or workflow changes.
- Risks and limitations are reported honestly.
- The GitHub issue is updated with what was actually completed.
- The issue is not closed merely because code was written. It should be verified and merged first.

“Probably works” is not a release state.

---

# 25. Git and GitHub Workflow

The `main` branch represents the stable, releasable version of Jumpin' for Tacos.

Do not use the live production site as the primary testing environment.

The normal workflow is:

1. Create or choose a GitHub issue.
2. Pull the latest `main`.
3. Confirm a clean working tree.
4. Create one focused branch.
5. Make one coherent change.
6. Test locally or through a safe preview.
7. Review the diff.
8. Commit with a clear message.
9. Push the branch.
10. Review and merge only after verification.
11. Confirm `main` remains healthy.
12. Close the issue with a note describing the result.
13. Delete the completed feature branch when appropriate.

Recommended branch prefixes include:

- `fix/`
- `feat/`
- `art/`
- `audio/`
- `docs/`
- `test/`
- `chore/`

One issue should normally map to one focused branch.

Avoid:

- Seven overlapping branches for one problem
- Unnamed experiments
- Direct experimental work on `main`
- Huge commits containing unrelated fixes
- Force-pushing shared history
- Rewriting history without explicit approval
- Committing `node_modules`
- Committing secrets
- Committing machine-specific temporary files
- Keeping abandoned branches indefinitely
- Closing an issue before the result is verified

Commit messages should explain the completed change, not merely say “update” or “changes.”

Milestone releases may be tagged after the corresponding version is tested and accepted.

---

# 26. Codex Working Rules

Codex is a collaborator, not an unsupervised release manager.

Before editing, Codex should:

1. Confirm the canonical workspace path.
2. Confirm the current branch.
3. Confirm the Git status.
4. Read the relevant implementation and neighboring logic.
5. Search for existing helpers before creating duplicates.
6. State the intended scope.
7. Identify the files likely to change.
8. Identify the tests or manual checks that apply.

While editing, Codex should:

- Prefer the smallest coherent diff.
- Preserve existing architecture.
- Preserve unrelated behavior.
- Avoid broad formatting changes.
- Avoid mass renaming.
- Avoid dependency upgrades unless explicitly requested.
- Avoid unrelated cleanup.
- Avoid deleting assets.
- Avoid replacing approved art or music with placeholders.
- Avoid changing gameplay constants during a visual-only task.
- Avoid copying similar logic when an appropriate shared helper already exists.
- Avoid premature abstraction when level-specific logic is clearer.
- Preserve existing QA instrumentation and test hooks.
- Keep comments focused on intent rather than narrating obvious syntax.
- Remain inside the canonical repository.
- State important assumptions.
- Stop and ask when ambiguity could materially change gameplay, character treatment, project identity, saved progression, architecture, or deployment.

After editing, Codex should report:

- What changed
- Why it changed
- Every file changed
- Tests run
- Test results
- Manual checks performed
- Manual checks still needed
- Relevant routes to test
- Known risks
- Remaining questions
- Git status

Codex must not:

- Commit without explicit instruction
- Push without explicit instruction
- Merge without explicit instruction
- Deploy without explicit instruction
- Close a GitHub issue without explicit instruction
- Rewrite Git history
- Delete branches
- Discard existing user changes
- Claim testing that did not occur
- Hide an unresolved problem behind confident language

Travis retains control of commits, pushes, merges, issue closure, and production deployment unless he explicitly delegates one of those actions.

---

# 27. Scope Discipline

Each task should have a clear boundary.

When a new issue is discovered during a task:

- Record it.
- Explain whether it blocks the current task.
- Create or recommend a separate issue when appropriate.
- Do not silently expand the current task into a repo-wide repair project.

A focused change is easier to understand, test, review, reverse, and trust.

Small does not mean careless. Small means intentional.

The best patch is not necessarily the patch with the fewest lines. It is the smallest patch that fully solves the stated problem without leaving the repository in a misleading or fragile state.

---

# 28. Release Philosophy

`main` should remain deployable.

Before a production release:

- Confirm the intended commit.
- Confirm the working tree is clean.
- Run the relevant test and build commands.
- Validate the production artifact.
- Verify direct level routes.
- Verify the landing page.
- Verify at least one complete gameplay path relevant to the release.
- Confirm asset loading.
- Check the browser console.
- Confirm audio behavior.
- Confirm keyboard behavior.
- Confirm touch behavior where relevant.
- Confirm gamepad behavior where relevant.
- Record known limitations.
- Preserve a clear rollback point.

A release should use the same reviewed code that was tested. Do not introduce an unreviewed “tiny fix” during deployment.

Production should be the destination of testing, not the location where testing begins.

---

# 29. Anti-Goals

Jumpin' for Tacos is not:

- A framework showcase
- A reason to rewrite working code for fashion
- A punishing precision platformer built around cheap failure
- A generic asset collage
- A live-site experiment
- A collection of unrelated visual styles
- A landing page with nine neglected game routes behind it
- A dependency-upgrade treadmill
- A project where every feature requires a new service
- A game that works only with one input method
- A place for broad cleanup disguised as a small task
- A project where AI-generated confidence substitutes for testing

Do not sand away all handmade character in pursuit of sterile consistency.

Polish should strengthen the game’s personality, not bleach it out.

---

# 30. Decision Priority

When tradeoffs cannot be avoided, use this priority order:

1. Playability and stability
2. Responsive and reliable controls
3. Fairness
4. Visual and gameplay readability
5. Character integrity and project identity
6. Correct progression, checkpoints, and recovery
7. Cross-device and cross-input support
8. Performance
9. Maintainability through clear, focused changes
10. Visual and audio polish
11. Architectural elegance
12. Technical cleverness

A clever solution that weakens the first six priorities is usually the wrong solution.

---

# 31. Final Standard

Jumpin' for Tacos should feel like a real game with a heart, not a technical demonstration wearing taco-shaped sunglasses.

Every accepted change should leave the project:

- More fun
- More readable
- More coherent
- More stable
- More expressive
- Easier to continue developing

A change does not need to improve all six, but it should clearly improve at least one without carelessly weakening the others.

Protect the joy.

Protect the controls.

Protect the characters.

Protect the player’s trust.
