import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function fetchApp(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("omits development preview metadata from release builds", async () => {
  const response = await fetchApp();

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.doesNotMatch(await response.text(), developmentPreviewMeta);
});

test("renders canonical SEO and social metadata", async () => {
  const response = await fetchApp();
  const html = await response.text();
  assert.match(html, /<title>Jumpin’ For Tacos — Free Browser Platformer Game<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/jumpinfortacos\.com\/"/);
  assert.match(html, /property="og:image" content="https:\/\/jumpinfortacos\.com\/assets\/jumpin-for-tacos-social-v1\.jpg"/);
  assert.match(html, /type="application\/ld\+json"/);
  assert.match(html, /Start World 1-1/);
  assert.match(html, /Build Taco Power/);
  assert.doesNotMatch(html, /Build the Taco Meter/);
  assert.match(html, /Frequently asked questions/);
});

test("publishes crawl guidance and every playable level in the sitemap", async () => {
  const robots = await (await fetchApp("/robots.txt")).text();
  const sitemap = await (await fetchApp("/sitemap.xml")).text();
  assert.match(robots, /Sitemap: https:\/\/jumpinfortacos\.com\/sitemap\.xml/);
  for (const path of ["/game/", "/game/level1-2", "/game/level1-3", "/game/level2", "/game/level2-2", "/game/level2-3", "/game/level3", "/game/level3-2", "/game/level3-3"]) {
    assert.match(sitemap, new RegExp(`https://jumpinfortacos\\.com${path}`));
  }
});

test("loads the shared Google Analytics tag on the landing page and every level", async () => {
  const landingHtml = await (await fetchApp()).text();
  assert.match(landingHtml, /src="\/analytics\.js\?v=1"/);

  for (const filename of ["index.html", "level1-2.html", "level1-3.html", "level2.html", "level2-2.html", "level2-3.html", "level3.html", "level3-2.html", "level3-3.html"]) {
    const html = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(html, /src="\/analytics\.js\?v=1"/);
  }

  const loader = await readFile(new URL("../public/analytics.js", import.meta.url), "utf8");
  assert.match(loader, /G-SLB3LYZTZ7/);
  assert.match(loader, /googletagmanager\.com\/gtag\/js/);
});

test("shares enemy behavior, stomp-chain celebrations, and bounce physics across every level", async () => {
  const core = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  assert.match(core, /function updateEnemyBehavior/);
  assert.match(core, /function bindEnemyToPlatform/);
  assert.match(core, /function attachEnemiesToPlatforms/);
  assert.match(core, /const stompComboTiers = Object\.freeze/);
  assert.match(core, /SALSA SUPREMACY!/);
  assert.match(core, /stompCrossingAllowance/);
  assert.match(core, /function createEnemyFormation/);

  for (const filename of ["game.js", "level1-2.js", "level1-3.js", "level2.js", "level2-2.js", "level2-3.js"]) {
    const runtime = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(runtime, /heroCore\.updateEnemyBehavior/);
    assert.match(runtime, /heroCore\.celebrateSplatCombo/);
  }

  const skyLevel = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  assert.match(skyLevel, /\['tomato', 'onion', 'jalapeno', 'chili', 'lime', 'queso'\]/);
  assert.doesNotMatch(skyLevel, /\['scorpion', 'cactus', 'burrito', 'roadrunner', 'beetle', 'guac'\]/);

  const world3 = await readFile(new URL("../public/game/world3.js", import.meta.url), "utf8");
  assert.match(world3, /heroCore\.updateEnemyBehavior/);
  assert.match(world3, /heroCore\.celebrateSplatCombo/);
});

test("implements Taco Power and Super Taco Hero as one shared state machine", async () => {
  const coreSource = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const abilitiesSource = await readFile(new URL("../public/game/abilities.js", import.meta.url), "utf8");
  const playedEvents = [];
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: {
      location: { href: "http://localhost/game/index.html" },
      JFT_AUDIO: { playEvent(eventId) { playedEvents.push(eventId); } },
    },
    location: { href: "http://localhost/game/index.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(coreSource, context, { filename: "levels.js" });
  vm.runInNewContext(abilitiesSource, context, { filename: "abilities.js" });

  const abilities = context.window.JFT_SHARED_ABILITIES;
  assert.equal(abilities.version, "super-taco-hero-v4-alternating-run");
  assert.equal(abilities.definitions.tacoPower.threshold, 100);
  assert.equal(abilities.definitions.tacoPower.contributions.taco, 7);
  assert.equal(abilities.definitions.tacoPower.contributions.premiumTaco, 16);
  assert.equal(abilities.definitions.tacoPower.contributions.enemySplat, 14);
  assert.equal(abilities.definitions.superHero.visualScale, 1.12);
  assert.equal(abilities.definitions.superHero.transformationDuration, 0.78);
  assert.equal(abilities.definitions.superHero.powerDownDuration, 0.42);
  assert.equal(abilities.definitions.superHero.runFrameCount, 4);
  assert.equal(abilities.definitions.superHero.runPhaseScale, 4 / 3);
  assert.equal(context.window.JFT_HERO_CORE.physics.jumpVelocity, 680);
  assert.equal(context.window.JFT_HERO_CORE.physics.superJumpVelocity, 650);

  const state = abilities.createState();
  for (let taco = 0; taco < 14; taco += 1) {
    assert.equal(abilities.collectTaco(state), false);
  }
  assert.equal(state.tacoMeter, 98);
  assert.equal(abilities.collectTaco(state), true);
  assert.equal(abilities.isSuper(state), true);
  assert.equal(state.tacoMeter, 0);
  assert.equal(state.superCount, 1);
  assert.equal(abilities.collectTaco(state), false, "tacos do not bank another form while Super");
  assert.equal(state.tacoMeter, 0);
  abilities.update(state, 0.5);

  assert.equal(abilities.trySuperJump(state), 650);
  assert.equal(abilities.trySuperJump(state), 0, "only one airborne Super Jump is available");
  abilities.land(state);
  assert.equal(abilities.trySuperJump(state), 650, "landing restores the Super Jump");
  assert.equal(abilities.absorbDamage(state), true);
  assert.equal(abilities.isSuper(state), false);
  assert.equal(state.powerDownTimer, abilities.definitions.superHero.powerDownDuration);
  assert.equal(abilities.absorbDamage(state), false, "Normal Taco Hero cannot absorb a second hit");

  abilities.reset(state);
  for (let taco = 0; taco < 5; taco += 1) abilities.collectTaco(state);
  assert.equal(state.tacoMeter, 35);
  assert.equal(abilities.collectGoldenTaco(state), true);
  assert.equal(abilities.isSuper(state), true);
  assert.equal(state.tacoMeter, 0, "Golden Taco activation resets partial Taco Power");
  assert.equal(abilities.collectGoldenTaco(state), false, "Golden Tacos do not stack Super forms");

  abilities.reset(state);
  abilities.activateFrenzy(state, 3);
  for (let taco = 0; taco < 15; taco += 1) abilities.collectTaco(state);
  assert.equal(abilities.isFrenzy(state), true, "scripted Frenzy remains separate");
  assert.equal(abilities.isSuper(state), true, "scripted Frenzy can coexist with Super");
  abilities.clearForRespawn(state);
  assert.equal(abilities.isSuper(state), false);
  assert.equal(state.airJumpAvailable, false);

  assert.ok(playedEvents.includes("ability.superTransform"));
  assert.ok(playedEvents.includes("ability.superShoes"));
  assert.ok(playedEvents.includes("hero.superJump"));
  assert.ok(playedEvents.includes("ability.superPowerDown"));

  const transforms = [];
  const fakeContext = {
    translate(x, y) { transforms.push(["translate", x, y]); },
    scale(x, y) { transforms.push(["scale", x, y]); },
  };
  abilities.activateSuper(state, "render-test", { silent: true });
  abilities.applyHeroVisualTransform(fakeContext, state, { anchorY: 33, time: 0 });
  assert.deepEqual(transforms[0], ["translate", 0, 33]);
  assert.equal(transforms[1][0], "scale");
  assert.ok(transforms[1][1] > 1 && transforms[1][2] > 0.8);
  assert.deepEqual(transforms[2], ["translate", 0, -33]);

  abilities.reset(state);
  abilities.activateSuper(state, "mid-air-test", { silent: true });
  const airbornePlayer = {
    x: 180, y: 210, vx: 246, vy: -318, grounded: false, platform: null, jumpBuffer: 0.1,
  };
  assert.equal(abilities.suspendForTransformation(state, airbornePlayer), true);
  assert.deepEqual(
    { x: airbornePlayer.x, y: airbornePlayer.y, vx: airbornePlayer.vx, vy: airbornePlayer.vy },
    { x: 180, y: 210, vx: 0, vy: 0 },
    "mid-air transformation suspends in place",
  );
  abilities.update(state, abilities.definitions.superHero.transformationDuration);
  assert.equal(abilities.suspendForTransformation(state, airbornePlayer), false);
  assert.deepEqual(
    { x: airbornePlayer.x, y: airbornePlayer.y, vx: airbornePlayer.vx, vy: airbornePlayer.vy },
    { x: 180, y: 210, vx: 246, vy: -318 },
    "mid-air transformation restores the exact incoming trajectory",
  );

  abilities.reset(state);
  abilities.activateSuper(state, "moving-platform-test", { silent: true });
  const platformPlayer = {
    x: 90, y: 300, vx: 110, vy: 0, grounded: true, jumpBuffer: 0,
    platform: { dx: 4, dy: -2 },
  };
  abilities.suspendForTransformation(state, platformPlayer);
  assert.deepEqual(
    { x: platformPlayer.x, y: platformPlayer.y },
    { x: 94, y: 298 },
    "shared suspension carries a grounded hero with the platform",
  );
  platformPlayer.x += platformPlayer.platform.dx;
  platformPlayer.y += platformPlayer.platform.dy;
  abilities.suspendForTransformation(state, platformPlayer, { platformAlreadyCarried: true });
  assert.deepEqual(
    { x: platformPlayer.x, y: platformPlayer.y },
    { x: 98, y: 296 },
    "runtimes that already carried the platform do not apply its delta twice",
  );
  assert.equal(abilities.suspendForTransformation(state, platformPlayer, { disabled: true }), false);
  assert.deepEqual(
    { vx: platformPlayer.vx, vy: platformPlayer.vy },
    { vx: 110, vy: 0 },
    "scripted movement releases a previously captured trajectory instead of restoring it after the sequence",
  );

  abilities.reset(state);
  abilities.activateSuper(state, "complete-sprite-test", { silent: true });
  assert.equal(abilities.heroArtworkVisualState(state).artwork, "normal", "the anticipation beat uses only the complete Normal sprite");
  state.transformTimer = abilities.definitions.superHero.transformationDuration * 0.47;
  assert.equal(abilities.heroArtworkVisualState(state).artwork, "normal", "Normal remains exclusive before the artwork swap");
  state.transformTimer = abilities.definitions.superHero.transformationDuration * 0.45;
  assert.equal(abilities.heroArtworkVisualState(state).artwork, "super", "the complete Super sprite replaces Normal at the reveal");
  state.transformTimer = 0;
  assert.equal(abilities.heroArtworkVisualState(state).artwork, "super");
  abilities.trySuperJump(state, { silent: true });
  assert.ok(abilities.heroArtworkVisualState(state).jumpFlare > 0.9);

  const normalSprite = { complete: true, naturalWidth: 2176, naturalHeight: 272, width: 2176, height: 272 };
  const superSprite = { complete: true, naturalWidth: 2176, naturalHeight: 272, width: 2176, height: 272 };
  const superRunSprite = { complete: true, naturalWidth: 1088, naturalHeight: 272, width: 1088, height: 272 };
  const spriteDraws = [];
  const spriteContext = {
    filter: "none",
    shadowBlur: 0,
    shadowColor: "",
    save() {},
    restore() {},
    drawImage(...args) { spriteDraws.push(args); },
  };
  abilities.drawHeroSpriteFrame(spriteContext, state, normalSprite, 4, { superSprite, width: 66, height: 66 });
  assert.equal(spriteDraws.length, 1, "the renderer draws exactly one complete character state");
  assert.equal(spriteDraws[0][0], superSprite, "stable Super never draws the Normal footwear sheet underneath");

  assert.equal(abilities.superLocomotionFrame(0), 0);
  assert.equal(abilities.superLocomotionFrame(0.75), 1);
  assert.equal(abilities.superLocomotionFrame(1.5), 2);
  assert.equal(abilities.superLocomotionFrame(2.25), 3);
  assert.equal(abilities.superLocomotionFrame(3), 0, "four Super gait phases retain the existing three-unit loop cadence");
  spriteDraws.length = 0;
  const runVisual = abilities.drawHeroSpriteFrame(spriteContext, state, normalSprite, 2, {
    superSprite, superRunSprite, running: true, animation: 1.5, width: 66, height: 66,
  });
  assert.equal(spriteDraws.length, 1, "the Super run renderer draws one complete character frame");
  assert.equal(spriteDraws[0][0], superRunSprite, "ground locomotion selects the dedicated alternating gait sheet");
  assert.equal(spriteDraws[0][1], 544, "the opposite-stride phase selects the third 272-pixel cell");
  assert.equal(runVisual.locomotionFrame, 2);
  assert.equal(runVisual.runningArtwork, true);

  abilities.absorbDamage(state);
  spriteDraws.length = 0;
  abilities.drawHeroSpriteFrame(spriteContext, state, normalSprite, 6, { superSprite });
  assert.equal(spriteDraws[0][0], superSprite, "power-down begins from the complete Super state");
  state.powerDownTimer = abilities.definitions.superHero.powerDownDuration * 0.3;
  spriteDraws.length = 0;
  abilities.drawHeroSpriteFrame(spriteContext, state, normalSprite, 6, { superSprite });
  assert.equal(spriteDraws[0][0], normalSprite, "power-down completes by switching to the complete Normal state");
  state.powerDownTimer = 0;
  spriteDraws.length = 0;
  abilities.drawHeroSpriteFrame(spriteContext, state, normalSprite, 2, {
    superSprite, superRunSprite, running: true, animation: 1.5,
  });
  assert.equal(spriteDraws[0][0], normalSprite, "Normal locomotion keeps the approved original sprite sheet");
});

test("ships registered transparent complete and four-phase Super Taco Hero sprite sheets", async () => {
  const normalSheet = await readFile(new URL("../public/game/assets/taco_hero_sheet.png", import.meta.url));
  const superSheet = await readFile(new URL("../public/game/assets/taco_hero_super_sheet.png", import.meta.url));
  const superRunSheet = await readFile(new URL("../public/game/assets/taco_hero_super_run_sheet.png", import.meta.url));
  assert.equal(superSheet.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(superSheet.readUInt32BE(16), 2176);
  assert.equal(superSheet.readUInt32BE(20), 272);
  assert.equal(superSheet[25], 6, "the alternate sheet retains an RGBA transparency channel");
  assert.notEqual(createHash("sha256").update(superSheet).digest("hex"), createHash("sha256").update(normalSheet).digest("hex"));
  assert.equal(superRunSheet.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(superRunSheet.readUInt32BE(16), 1088);
  assert.equal(superRunSheet.readUInt32BE(20), 272);
  assert.equal(superRunSheet[25], 6, "the four-phase gait sheet retains an RGBA transparency channel");
  assert.notEqual(createHash("sha256").update(superRunSheet).digest("hex"), createHash("sha256").update(superSheet).digest("hex"));

  const abilitiesSource = await readFile(new URL("../public/game/abilities.js", import.meta.url), "utf8");
  assert.match(abilitiesSource, /taco_hero_super_sheet\.png\?v=1/);
  assert.match(abilitiesSource, /taco_hero_super_run_sheet\.png\?v=1/);
  assert.doesNotMatch(abilitiesSource, /function drawFiestaShoe|function drawCompactWing|function drawFiestaWingShoes/);
});

test("loads and consumes Super Taco Hero across all nine level entry points", async () => {
  const pages = [
    ["index.html", "game.js"], ["level1-2.html", "level1-2.js"],
    ["level1-3.html", "level1-3.js"], ["level2.html", "level2.js"],
    ["level2-2.html", "level2-2.js"], ["level2-3.html", "level2-3.js"],
    ["level3.html", "world3.js"], ["level3-2.html", "world3.js"],
    ["level3-3.html", "world3.js"],
  ];
  for (const [pageName, runtimeName] of pages) {
    const html = await readFile(new URL(`../public/game/${pageName}`, import.meta.url), "utf8");
    assert.match(html, /src="levels\.js\?v=34"/);
    assert.match(html, /src="abilities\.js\?v=5"/);
    assert.ok(html.indexOf('src="levels.js?v=34"') < html.indexOf('src="abilities.js?v=5"'));
    assert.ok(html.indexOf('src="abilities.js?v=5"') < html.indexOf(`src="${runtimeName}`));
  }

  const runtimeNames = ["game.js", "level1-2.js", "level1-3.js", "level2.js", "level2-2.js", "level2-3.js", "world3.js"];
  for (const runtimeName of runtimeNames) {
    const runtime = await readFile(new URL(`../public/game/${runtimeName}`, import.meta.url), "utf8");
    assert.match(runtime, /window\.JFT_SHARED_ABILITIES/);
    assert.match(runtime, /\.createState\(\)/);
    assert.match(runtime, /\.trySuperJump/);
    assert.match(runtime, /\.absorbDamage/);
    assert.match(runtime, /\.clearForRespawn/);
    assert.match(runtime, /\.drawHeroEffects/);
    assert.match(runtime, /\.drawHeroSpriteFrame/);
    assert.match(runtime, /\brunning\b/);
    assert.match(runtime, /animation: player\.anim/);
    assert.doesNotMatch(runtime, /\.drawFiestaWingShoes/);
    assert.match(runtime, /\.applyHeroVisualTransform/);
    assert.match(runtime, /\.drawTacoPowerHUD/);
    assert.match(runtime, /collisionWidth/);
    assert.match(runtime, /collisionHeight/);
  }

  const worldOne = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  assert.match(worldOne, /if \(keys\.jump\) return/);
  for (const runtimeName of ["level1-2.js", "level2-3.js", "world3.js"]) {
    const runtime = await readFile(new URL(`../public/game/${runtimeName}`, import.meta.url), "utf8");
    assert.match(runtime, /!wasPressed/);
  }

  for (const runtimeName of ["level2.js", "level2-2.js"]) {
    const runtime = await readFile(new URL(`../public/game/${runtimeName}`, import.meta.url), "utf8");
    assert.doesNotMatch(runtime, /coconutCharges|ONE MID-AIR SUPER JUMP/);
    assert.match(runtime, /COCONUT LAUNCH! AUTOMATIC SKY BOUNCE!/);
    assert.match(runtime, /player\.vy = -820/);
    const damageStart = runtime.indexOf("function hurtPlayer");
    const damageEnd = runtime.indexOf("function activatePower", damageStart);
    const damage = runtime.slice(damageStart, damageEnd);
    assert.ok(damage.indexOf("game.limeShield") < damage.indexOf("absorbDamage"), "Lime Shield resolves before Super");
  }
});

test("keeps World 1-1 enemy artwork on a separate slower visual clock", async () => {
  const coreSource = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const mainRuntime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  const mainHtml = await readFile(new URL("../public/game/index.html", import.meta.url), "utf8");

  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/index.html" } },
    location: { href: "http://localhost/game/index.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(coreSource, context, { filename: "levels.js" });

  assert.equal(context.window.JFT_HERO_CORE.physics.enemyVisualAnimationRate, 1.8);
  assert.match(mainRuntime, /enemy\.anim \+= dt \* heroPhysics\.enemyVisualAnimationRate/);
  assert.match(mainRuntime, /return Math\.floor\(enemy\.anim\) % 4/);
  assert.match(mainRuntime, /SOURCE_VERSION = 'w1-1-v58-exploration-payoff'/);
  assert.match(mainRuntime, /localPreviewAutoRun === 'left'/);
  assert.match(mainRuntime, /localPreviewAutoRunDirection < 0\) keys\.left = true/);
  assert.match(mainRuntime, /function removeOpeningLeadEnemy/);
  assert.match(mainRuntime, /removeOpeningLeadEnemy\(\)/);
  assert.match(mainRuntime, /patrolStartOffset: 420/);
  assert.match(mainHtml, /levels\.js\?v=34/);
  assert.match(mainHtml, /game\.js\?v=58/);
});

test("preserves the corrected World 1-1 Super exploration geometry with escalating rewards", async () => {
  const runtime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");

  assert.match(runtime, /world-1-1-phase2a-payoff-v3/);
  assert.match(runtime, /id: 'cactus-radio-roost'/);
  assert.match(runtime, /kind: 'scene-based-zigzag-destination'/);
  assert.match(runtime, /id: 'salsa-kite-test'/);
  assert.match(runtime, /kind: 'moving-double-jump-route'/);
  assert.match(runtime, /id: 'sunset-skyway'/);
  assert.match(runtime, /kind: 'branching-elevated-mini-route'/);
  assert.match(runtime, /bounds: \{ start: 7420, end: 24310 \}/);
  assert.match(runtime, /worldPercent: Object\.freeze\(\[22\.4, 26\.2\]\)/);
  assert.match(runtime, /worldPercent: Object\.freeze\(\[48, 51\.6\]\)/);
  assert.match(runtime, /worldPercent: Object\.freeze\(\[72, 73\.5\]\)/);
  assert.match(runtime, /normalRouteUnaffected: true/);
  assert.match(runtime, /noRequiredSuperTraversal: true/);
  assert.match(runtime, /protectedRanges\.every/);
  assert.match(runtime, /entryRise: 210/);
  assert.match(runtime, /entryRise: 200/);
  assert.match(runtime, /entryRise: 160/);
  assert.match(runtime, /waypointGroups: Object\.freeze/);
  assert.match(runtime, /phase2-skyway-low', 'phase2-skyway-high/);
  assert.match(runtime, /minimumDestinationSpacing/);
  assert.match(runtime, /bonusReward: true/);
  assert.match(runtime, /phase2PremiumReward: true/);
  assert.match(runtime, /rewardType: 'rainbow'/);
  assert.match(runtime, /rewardType: 'golden'/);
  assert.match(runtime, /rewardType: 'taco-cache'/);
  assert.match(runtime, /rewardTier: 'medium'/);
  assert.match(runtime, /rewardTier: 'medium-large'/);
  assert.match(runtime, /rewardTier: 'large'/);
  assert.match(runtime, /\+900 SCORE  •  8-TACO FIESTA/);
  assert.match(runtime, /\+1,500 SCORE  •  10-TACO FIESTA  •  BONUS GOLDEN/);
  assert.match(runtime, /\+2,400 SCORE  •  14-TACO FIESTA  •  RAINBOW  •  MAGNET/);
  assert.match(runtime, /function drawSuperExplorationCompletionBanner/);
  assert.match(runtime, /phase2Complete/);
  assert.match(runtime, /applyWorldOnePilotRemaster\(\);\s+applySuperExplorationPilot\(\);\s+groundCheckpointStations\(\);/);
  const updateStart = runtime.indexOf("function updatePlaying");
  const discoveryUpdate = runtime.indexOf("updateSuperExplorationPilot(dt);", updateStart);
  const collectibleLoop = runtime.indexOf("for (const item of level.collectibles) {", updateStart);
  assert.ok(discoveryUpdate > updateStart && discoveryUpdate < collectibleLoop, "discovery rewards activate before same-frame collection checks");

  const artAssets = [
    "world1_1_super_kite_route_v2.webp",
    "world1_1_super_skyway_v2.webp",
    "world1_1_super_radio_roost_v2.webp",
  ];
  for (const filename of artAssets) {
    assert.match(runtime, new RegExp(filename.replace(".webp", "")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }
});

test("gives visible World 1-1 destinations distinct one-shot payoffs and reserves discovery for the Sunset Stash", async () => {
  const runtime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");

  assert.doesNotMatch(runtime, /KITE ROUTE DISCOVERED!/);
  assert.doesNotMatch(runtime, /SUNSET SALSA SKYWAY DISCOVERED!/);
  assert.doesNotMatch(runtime, /CACTUS RADIO ROOST DISCOVERED!/);
  assert.doesNotMatch(runtime, /SUPER ROUTE COMPLETE/);
  assert.deepEqual(runtime.match(/DISCOVERED!/g), ["DISCOVERED!"], "only the genuine hidden secret uses DISCOVERED");
  assert.match(runtime, /completionTitle: 'WIND FINALE!'/);
  assert.match(runtime, /completionTitle: 'SKYWAY ONLINE'/);
  assert.match(runtime, /completionTitle: 'SUNSET RELAY ONLINE!'/);
  assert.match(runtime, /completionTitle: 'SUNSET STASH DISCOVERED!'/);
  assert.match(runtime, /presentation: 'spectacle'/);
  assert.match(runtime, /presentation: 'activation'/);
  assert.match(runtime, /presentation: 'character-interaction'/);
  assert.match(runtime, /presentation: 'secret'/);

  assert.match(runtime, /function startCactusRadioActivation/);
  assert.match(runtime, /function startCharacterTransmission/);
  assert.match(runtime, /SUNSET RELAY • CONNECTED/);
  assert.match(runtime, /Taco Hero! There you are\. You brought the Sunset relay back online!/);
  assert.match(runtime, /REWARD  •/);
  assert.match(runtime, /stage\.generatorActivate/);
  assert.match(runtime, /state\.radioPower = clamp/);
  assert.match(runtime, /environmentEnergized = true/);
  assert.match(runtime, /if \(!pilot \|\| state\.completed \|\| state\.activationStarted \|\| pilot\.interaction\) return false/);
  assert.match(runtime, /if \(state\.rewardSpawned\) return/);
  assert.match(runtime, /completionCount = \(state\.completionCount \|\| 0\) \+ 1/);
  assert.match(runtime, /rewardSpawnCount = \(state\.rewardSpawnCount \|\| 0\) \+ 1/);

  assert.match(runtime, /id: 'sunset-stash'/);
  assert.match(runtime, /kind: 'hidden-air-pocket'/);
  assert.match(runtime, /requiredParentProgress: 4/);
  assert.match(runtime, /trigger: Object\.freeze\(\{ x: 16992, y: 18, w: 78, h: 102 \}\)/);
  assert.match(runtime, /rewardTypes: Object\.freeze\(\['golden', 'rainbow'\]\)/);
  assert.match(runtime, /\+3,500 SCORE  •  18-TACO CACHE  •  GOLDEN \+ RAINBOW/);
  assert.match(runtime, /function drawSunsetStash/);
  assert.match(runtime, /phase2Secret/);
  assert.match(runtime, /approvedGeometryPreserved: true/);

  for (const frozenPlatform of [
    "id: 'phase2-kite-launch', x: 7420, y: 250, w: 180, h: 26",
    "id: 'phase2-kite-gold-finish', x: 8450, y: 260, w: 210, h: 26",
    "id: 'phase2-skyway-start', x: 15880, y: 260, w: 185, h: 26",
    "id: 'phase2-skyway-east', x: 16925, y: 175, w: 155, h: 26",
    "id: 'phase2-roost-approach', x: 23820, y: 300, w: 180, h: 26",
    "id: 'phase2-roost-main', x: 24092, y: 135, w: 218, h: 26",
  ]) {
    assert.ok(runtime.includes(frozenPlatform), `preserves approved platform geometry: ${frozenPlatform}`);
  }
});

test("creates same-type enemy packs and recognizes swept stomp contacts", async () => {
  const source = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/index.html" } },
    location: { href: "http://localhost/game/index.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(source, context, { filename: "levels.js" });

  const core = context.window.JFT_HERO_CORE;
  const pack = core.createEnemyFormation({
    id: "tomato-pack",
    type: "tomato",
    startX: 420,
    y: 422,
    count: 3,
    spacing: 52,
    vx: 60,
  });

  assert.equal(pack.length, 3);
  assert.equal(pack.map((enemy) => enemy.type).join(","), "tomato,tomato,tomato");
  assert.equal(pack.map((enemy) => enemy.groupIndex).join(","), "0,1,2");
  assert.equal(pack.map((enemy) => enemy.groupSize).join(","), "3,3,3");
  assert.equal(new Set(pack.map((enemy) => enemy.id)).size, 3);
  assert.equal(pack[2].x - pack[0].x, 104);
  assert.ok(pack[0].maxX + pack[0].w <= pack[1].minX, "formation members keep separate patrol lanes");
  assert.ok(pack[1].maxX + pack[1].w <= pack[2].minX, "formation members keep separate patrol lanes");

  const target = { x: 500, y: 422, w: 36, h: 38 };
  const sweptLanding = { x: 500, y: 416, w: 34, h: 42, vy: 760 };
  assert.equal(
    core.isStomp(sweptLanding, target, {
      topInset: 6,
      previousBottom: 430,
      previousTargetTop: 422,
    }),
    true,
  );

  const groundSideHit = { x: 500, y: 418, w: 34, h: 42, vy: 0 };
  assert.equal(
    core.isStomp(groundSideHit, target, {
      topInset: 6,
      previousBottom: 460,
      previousTargetTop: 422,
    }),
    false,
  );

  const hoppingGarlic = { x: 500, y: 388, w: 36, h: 38, vy: 260 };
  assert.equal(
    core.isStomp({ x: 500, y: 390, w: 34, h: 42, vy: 260 }, hoppingGarlic, {
      topInset: 6,
      topTolerance: 54,
      previousBottom: 430,
      previousTargetTop: 422,
    }),
    true,
    "a downward landing remains a stomp when the garlic hops upward between frames",
  );

  assert.equal(core.stompComboReward(1).label, "PERFECT!");
  assert.equal(core.stompComboReward(3).bonus, "golden");
  assert.equal(core.stompComboReward(5).bonus, "rainbow");
  assert.equal(core.stompComboReward(8).bonus, "taco-frenzy");
});

test("classifies forgiving ordinary-enemy stomps consistently across all nine levels", async () => {
  const source = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/index.html" } },
    location: { href: "http://localhost/game/index.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(source, context, { filename: "levels.js" });
  const core = context.window.JFT_HERO_CORE;
  const target = { x: 500, y: 422, w: 36, h: 38 };

  assert.equal(core.ordinaryStompStandard.version, "ordinary-stomp-v1");
  assert.equal(
    core.classifyEnemyContact(
      { x: 533.5, y: 390, w: 34, h: 42, vy: 260 },
      target,
      { previousBottom: 420, previousTargetTop: 422 },
    ),
    "stomp",
    "a visually clear edge landing succeeds even on World 1-1's narrow legacy collider",
  );
  assert.equal(
    core.classifyEnemyContact(
      { x: 500, y: 418, w: 34, h: 42, vy: 0 },
      target,
      { previousBottom: 460, previousTargetTop: 422 },
    ),
    "body",
    "a lateral grounded collision remains body contact",
  );
  assert.equal(
    core.classifyEnemyContact(
      { x: 500, y: 390, w: 34, h: 42, vy: -120 },
      target,
      { previousBottom: 434, previousTargetTop: 422 },
    ),
    "body",
    "rising through the top region does not earn a stomp",
  );
  assert.equal(
    core.classifyEnemyContact(
      { x: 500, y: 418, w: 34, h: 42, vy: 220 },
      target,
      { previousBottom: 450, previousTargetTop: 422, routeHelper: true },
    ),
    "stomp",
    "authored route helpers retain their larger shared upper-region allowance",
  );
  assert.equal(
    core.classifyEnemyContact(
      { x: 590, y: 390, w: 34, h: 42, vy: 260 },
      target,
      { previousBottom: 420, previousTargetTop: 422 },
    ),
    null,
    "a clearly missed enemy does not become an automatic stomp",
  );

  const runtimeFiles = [
    "game.js",
    "level1-2.js",
    "level1-3.js",
    "level2.js",
    "level2-2.js",
    "level2-3.js",
    "world3.js",
  ];
  for (const filename of runtimeFiles) {
    const runtime = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(runtime, /heroCore\.classifyEnemyContact\(player, enemy/, `${filename} uses the shared ordinary-enemy classifier`);
    assert.match(runtime, /stompResolvedThisFrame/, `${filename} limits a frame to one rewarded enemy bounce`);
  }

  const showdown = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  assert.match(showdown, /if \(enemy\.boss\)[\s\S]*heroCore\.isStomp\(player, enemy/, "El Guacodillo keeps its explicit boss-only stomp gate");
  assert.match(showdown, /playAudio\(stomped \? 'combat\.enemyStomp' : 'combat\.enemySplat'/, "every genuine ordinary-enemy bounce keeps the approved boing mapping");

  const backstage = await readFile(new URL("../public/game/level2-3.js", import.meta.url), "utf8");
  assert.match(backstage, /if \(stomped\) \{[\s\S]*player\.vy = -heroPhysics\.enemyBounceVelocity/, "World 2-3 only applies the enemy bounce impulse to a classified stomp");
  const world3 = await readFile(new URL("../public/game/world3.js", import.meta.url), "utf8");
  assert.match(world3, /if \(stomp\) \{[\s\S]*player\.vy = -heroPhysics\.enemyBounceVelocity/, "all three World 3 levels only apply the enemy bounce impulse to a classified stomp");
});

test("gives World 1-1 formations visible patrol lanes without overlap", async () => {
  const source = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/index.html" } },
    location: { href: "http://localhost/game/index.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(source, context, { filename: "levels.js" });

  const pack = context.window.JFT_HERO_CORE.createEnemyFormation({
    id: "patrol-pack",
    type: "tomato",
    startX: 760,
    y: 422,
    count: 3,
    spacing: 52,
    vx: 58,
    patrolPadding: 16,
  });
  const platform = { x: 0, y: 460, w: 920, h: 80, ground: true };
  context.window.JFT_HERO_CORE.attachEnemiesToPlatforms(pack, [platform], { edgePadding: 12 });
  const audit = context.window.JFT_HERO_CORE.retuneEnemyFormationPatrols(pack, {
    fullPlatformCoverage: true,
    minimumGap: 8,
    edgePadding: 12,
  });

  assert.equal(audit.formations, 1);
  assert.equal(audit.enemies, 3);
  assert.ok(audit.minSpan >= 30, "formation members need visible travel from spawn");
  assert.ok(pack[0].maxX + pack[0].w <= pack[1].minX, "first patrol lane keeps its gap");
  assert.ok(pack[1].maxX + pack[1].w <= pack[2].minX, "second patrol lane keeps its gap");
  assert.ok(pack[0].minX >= platform.x + 12, "the first lane stays inside the support surface");
  assert.ok(pack[2].maxX <= platform.x + platform.w - pack[2].w - 12, "the last lane stays inside the support surface");
  assert.equal(pack[0].minX, platform.x + 12, "the formation begins at the platform's usable left edge");
  assert.equal(pack[2].maxX, platform.x + platform.w - pack[2].w - 12, "the formation reaches the platform's usable right edge");

  const single = context.window.JFT_HERO_CORE.createEnemyFormation({
    id: "patrol-single",
    type: "onion",
    startX: 54,
    y: 322,
    count: 1,
    spacing: 48,
    vx: 38,
  });
  const ledge = { x: 0, y: 360, w: 140, h: 26 };
  context.window.JFT_HERO_CORE.attachEnemiesToPlatforms(single, [ledge], { edgePadding: 12 });
  context.window.JFT_HERO_CORE.retuneEnemyFormationPatrols(single, {
    fullPlatformCoverage: true,
    minimumGap: 8,
    edgePadding: 12,
  });
  assert.equal(single[0].minX, ledge.x + 12, "single guards use the platform's usable left edge");
  assert.equal(single[0].maxX, ledge.x + ledge.w - single[0].w - 12, "single guards use the platform's usable right edge");
});

test("keeps platform enemies attached while moving and preserves role rewards", async () => {
  const source = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/level1-2.html" } },
    location: { href: "http://localhost/game/level1-2.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(source, context, { filename: "levels.js" });

  const core = context.window.JFT_HERO_CORE;
  const platform = { x: 100, y: 300, w: 220, h: 24, ground: false, moving: true };
  const enemy = {
    x: 160,
    y: 260,
    w: 40,
    h: 40,
    type: "tomato",
    speed: 0,
    minX: 130,
    maxX: 260,
  };

  core.bindEnemyToPlatform(enemy, platform);
  const initialX = enemy.x;
  const initialOffsetY = enemy.platformOffsetY;
  platform.x += 38;
  platform.y += 18;
  core.updateEnemyBehavior(enemy, 0.016);

  assert.equal(enemy.x, initialX + 38);
  assert.equal(enemy.platformOffsetY, initialOffsetY);
  assert.equal(enemy.baseY, platform.y - enemy.h + initialOffsetY);
  assert.equal(enemy.y, enemy.baseY);
  assert.ok(enemy.minX >= platform.x);
  assert.ok(enemy.maxX <= platform.x + platform.w - enemy.w);
  assert.equal(core.getEnemyPlacementRole(enemy), "moving-guard");
  assert.equal(core.getEnemyRewardProfile(enemy).power, "shield-spark");

  const stats = core.attachEnemiesToPlatforms(
    [{ x: 160, y: 260, w: 40, h: 40, type: "onion", speed: 0 }],
    [platform],
    { surfaceTolerance: 28 },
  );
  assert.equal(stats.attached, 1);
  assert.equal(stats.moving, 1);
  assert.equal(stats.unbound, 0);

  const authoredPlatform = { id: "pilot-moving-ledge", x: 260, y: 280, w: 220, h: 24, moving: true };
  const authoredEnemy = {
    x: 320, y: 240, w: 40, h: 40, type: "chili", speed: 0,
    supportPlatformId: "pilot-moving-ledge",
  };
  const authoredStats = core.attachEnemiesToPlatforms([authoredEnemy], [authoredPlatform], { surfaceTolerance: 28 });
  assert.equal(authoredStats.attached, 1);
  assert.equal(authoredEnemy.platform, authoredPlatform);
});

test("resolves enemy roles, traits, telegraphs, and reward metadata", async () => {
  const source = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/level2.html" } },
    location: { href: "http://localhost/game/level2.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(source, context, { filename: "levels.js" });

  const core = context.window.JFT_HERO_CORE;
  const movingPlatform = { x: 260, y: 280, w: 240, h: 24, ground: false, moving: true };
  const movingEnemy = {
    x: 320, y: 240, w: 40, h: 40, type: "tomato", speed: 46,
    minX: 300, maxX: 430, clock: 0,
  };
  core.bindEnemyToPlatform(movingEnemy, movingPlatform);
  core.prepareEnemyBehavior(movingEnemy, 0, "tomato");
  const movingProfile = core.getEnemyProfile(movingEnemy);

  assert.equal(movingProfile.role, "moving-guard");
  assert.ok(movingProfile.traits.includes("roll"));
  assert.ok(movingProfile.traits.includes("moving-platform"));
  assert.equal(movingProfile.telegraph.kind, "roll");
  assert.equal(movingProfile.reward.tier, "moving");
  assert.equal(movingEnemy.rewardProfile.message, "MOVING-ROUTE PAYDAY");
  core.updateEnemyBehavior(movingEnemy, 0.016);
  assert.equal(movingEnemy.telegraph, true);
  assert.equal(movingEnemy.telegraphLabel, "ROLL!");
  assert.ok(movingEnemy.telegraphProgress >= 0 && movingEnemy.telegraphProgress <= 1);

  const helper = {
    x: 80, y: 320, w: 40, h: 40, type: "jalapeno", behaviorType: "jalapeno",
    bounceHelper: true, speed: 40, clock: 0,
  };
  const helperProfile = core.getEnemyProfile(helper);
  assert.equal(helperProfile.role, "route-helper");
  assert.ok(helperProfile.traits.includes("bounce-route"));
  assert.equal(helperProfile.reward.power, "bounce-boost");
  assert.equal(helperProfile.reward.bonusItem, "pepper");
});

test("materializes authored checkpoints once and keeps expansion from cloning them", async () => {
  const source = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/index.html" } },
    location: { href: "http://localhost/game/index.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {} }; },
    },
  };
  vm.runInNewContext(source, context, { filename: "levels.js" });

  const core = context.window.JFT_HERO_CORE;
  const seeds = [
    { id: "opening", x: 8800 },
    { id: "opening", x: 17600 },
    { id: "showdown", x: 17700 },
    { id: "chase", x: 24300 },
  ];
  const firstBuild = core.createCheckpointSet(seeds, { defaults: { y: 330, w: 180, h: 130 } });

  assert.deepEqual(firstBuild.map(({ id, x, order }) => ({ id, x, order })), [
    { id: "opening", x: 8800, order: 1 },
    { id: "showdown", x: 17700, order: 2 },
    { id: "chase", x: 24300, order: 3 },
  ]);
  firstBuild[0].activated = true;
  const secondBuild = core.createCheckpointSet(seeds, { defaults: { y: 330, w: 180, h: 130 } });
  assert.equal(secondBuild.length, 3);
  assert.equal(secondBuild[0].activated, false);
  assert.notEqual(secondBuild[0], firstBuild[0]);

  const run = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  assert.equal((run.match(/id: '(?:desert-dash-exit|showdown-approach|chase-approach)'/g) || []).length, 3);
  assert.match(run, /heroCore\.createCheckpointSet\(checkpointDefs\)/);
  assert.doesNotMatch(run, /checkpointCopies/);
  assert.doesNotMatch(run, /level\.checkpoints\.push\(\.\.\.checkpointCopies\)/);

  for (const filename of ["level1-2.js", "level1-3.js", "level2.js", "level2-2.js", "level2-3.js", "world3.js"]) {
    const runtime = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(runtime, /heroCore\.createCheckpointSet/);
  }
});

test("keeps World 1-1 checkpoint stations visibly grounded over expansion gaps", async () => {
  const levelsSource = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const context = {
    console,
    Math,
    Number,
    Object,
    URL,
    window: { location: { href: "http://localhost/game/index.html" } },
    location: { href: "http://localhost/game/index.html" },
    document: {
      currentScript: null,
      head: { appendChild() {} },
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return { async: false, dataset: {}, classList: { add() {} } }; },
    },
  };
  vm.runInNewContext(levelsSource, context, { filename: "levels.js" });

  const core = context.window.JFT_HERO_CORE;
  const ground = { id: "ground", x: 0, y: 460, w: 280, h: 80 };
  assert.equal(
    core.findCheckpointSupport({ x: 320, w: 180 }, [ground], { left: 286, right: 534, surfaceY: 460 }),
    null,
  );
  const pullOff = { id: "checkpoint-pad", x: 286, y: 460, w: 248, h: 80 };
  assert.equal(
    core.findCheckpointSupport({ x: 320, w: 180 }, [pullOff], { left: 286, right: 534, surfaceY: 460 }),
    pullOff,
  );

  const runtime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  assert.match(runtime, /function groundCheckpointStations/);
  assert.match(runtime, /heroCore\.findCheckpointSupport/);
  assert.match(runtime, /checkpoint-pad-\$\{checkpoint\.id\}/);
  assert.match(runtime, /visibleBottom: 875/);
  assert.match(runtime, /const truckY = surfaceY - visibleHeight/);
  assert.match(runtime, /checkpointGroundingRepairs/);

  const groundY = 460;
  const checkpointHeight = 130;
  const visibleHeight = checkpointHeight * (875 / 1024);
  const truckY = groundY - visibleHeight;
  assert.ok(Math.abs(truckY + visibleHeight - groundY) < 0.001);
  assert.ok(truckY > 330, "transparent padding is allowed above the collision rectangle, not below the visible wheels");
});

test("standardizes World 1 and World 2 controls, progression, and QA safeguards", async () => {
  const levelPages = [
    "index.html",
    "level1-2.html",
    "level1-3.html",
    "level2.html",
    "level2-2.html",
    "level2-3.html",
  ];
  for (const filename of levelPages) {
    const html = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(html, /style\.css\?v=27/);
    assert.match(html, /controller\.js\?v=9/);
    assert.match(html, /levels\.js\?v=34/);
    assert.match(html, /id="startBtn"/);
    assert.match(html, /data-next-level/);
    assert.match(html, /class="touch-controls" aria-label="Touch controls"/);
    assert.match(html, /data-input="left" aria-label="Move left"/);
    assert.match(html, /data-input="right" aria-label="Move right"/);
    assert.match(html, /data-input="jump" aria-label="Jump"/);
    assert.ok(html.indexOf("controller.js?v=9") < html.indexOf("levels.js?v=34"));
  }

  const controller = await readFile(new URL("../public/game/controller.js", import.meta.url), "utf8");
  assert.match(controller, /version: 3/);
  assert.match(controller, /const syncQaGamepad = \(\) =>/);
  assert.match(controller, /dispatchControllerState\(input, qaVirtualGamepad\)/);

  for (const filename of ["game.js", "level1-2.js", "level1-3.js", "level2.js", "level2-2.js", "level2-3.js"]) {
    const runtime = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(runtime, /SOURCE_VERSION/);
    assert.match(runtime, /respawnFallbacks/);
    assert.match(runtime, /lastRespawnLanding/);
    assert.match(runtime, /tacoCoins/);
  }

  const concertHtml = await readFile(new URL("../public/game/level2-3.html", import.meta.url), "utf8");
  assert.match(concertHtml, /href="level3\.html" data-next-level/);
});

test("shares one character scale contract and removes piloted taco-throw arm overlays", async () => {
  const catalog = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  assert.match(catalog, /version: 'jft-visual-scale-v1'/);
  assert.match(catalog, /heroRenderHeight: 66/);
  assert.match(catalog, /standingHeight: 112/);
  assert.match(catalog, /mountedVisibleRange: Object\.freeze\(\[62, 112\]\)/);
  assert.match(catalog, /policy: 'rear-mounted-vehicle-launcher'/);
  assert.match(catalog, /externalArm: false/);
  assert.match(catalog, /visualScale: visualScaleStandard/);

  for (const filename of [
    "index.html", "level1-2.html", "level1-3.html",
    "level2.html", "level2-2.html", "level2-3.html",
    "level3.html", "level3-2.html", "level3-3.html",
  ]) {
    const html = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(html, /levels\.js\?v=34/);
  }

  const forbiddenArmImplementation = /world1_1_olivia_throw_arm_v1|world1_2_olivia_plane_throw_arm_v1|world2_1_catamaran_throw_arm_v1|world3_olivia_balloon_throw_v2|draw[A-Za-z]*ThrowArm|throwPhase|truckThrowAnim/;
  for (const filename of ["game.js", "level1-2.js", "level1-3.js", "level2.js", "level2-2.js", "level2-3.js", "world3.js"]) {
    const runtime = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.doesNotMatch(runtime, forbiddenArmImplementation, `${filename} must not load or draw a detached taco-throw arm`);
  }
});

test("keeps World 1 and World 2 routes uncluttered and transitions continuous", async () => {
  const run = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  const rescue = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  const showdown = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  const island = await readFile(new URL("../public/game/level2.js", import.meta.url), "utf8");
  const caldera = await readFile(new URL("../public/game/level2-2.js", import.meta.url), "utf8");
  const concert = await readFile(new URL("../public/game/level2-3.js", import.meta.url), "utf8");

  assert.match(run, /platformOverlapPairs/);
  assert.match(run, /platform\.mainRoute/);
  assert.match(rescue, /unreachablePlatforms/);
  assert.match(showdown, /const sauceSpots = \[3860, 9450, 14520, 20780, 23520, 24320\]/);
  assert.match(showdown, /ordinaryEnemiesInArena/);
  assert.match(showdown, /Math\.cos\(angle\)/);
  assert.match(showdown, /Math\.sin\(angle\)/);

  for (const runtime of [island, caldera]) {
    assert.match(runtime, /function blendedPalette/);
    assert.match(runtime, /distance = 720/);
    assert.match(runtime, /platformOverlapPairs/);
    assert.match(runtime, /platformSweepCrossings/);
    assert.match(runtime, /Math\.cos\(t \* Math\.PI \* 0\.5\)/);
    assert.match(runtime, /Math\.sin\(t \* Math\.PI \* 0\.5\)/);
  }
  assert.match(caldera, /function placeSecretPlatform/);
  assert.match(caldera, /const resolvedBase = offsets/);
  assert.match(concert, /function buildWorld23AuthoredRoutes/);
  assert.match(concert, /maximumStepGap/);
  assert.match(concert, /safeLowerRoutePreserved: true/);
  assert.match(concert, /platformOverlapPairs/);
  assert.match(concert, /victoryEnemies/);
});

test("ships World 1 with authored seamless panorama progressions", async () => {
  const backgrounds = await readFile(new URL("../public/game/world1-backgrounds.js", import.meta.url), "utf8");
  const stageNames = [
    "Golden Cactus Flats", "Papel Picado Truckway", "Red Rock Salsa Bowl", "Neon Desert Highway", "Moonlit Piñata Plaza",
    "Sunrise Taco Airfield", "Big-Sky Desert Cruise", "Banner Cloudway", "High Mesa Thermals", "Guacamole Stormfront", "Sunset Rescue Corridor", "Emergency Landing Fiesta",
    "Golden Hour Gauntlet", "Salsa Canyon Stampede", "Mercado Rooftops", "Twilight Parade Boulevard", "Midnight Guac Arena", "Rainbow Victory Village", "World 1 Fiesta Plaza",
  ];
  const panoramaFiles = [
    "world1_1_env_golden_flats_v1.webp", "world1_1_env_truckway_v1.webp", "world1_1_env_salsa_bowl_v1.webp", "world1_1_env_neon_highway_v1.webp", "world1_1_env_pinata_plaza_v1.webp",
    "world1_2_env_airfield_v1.webp", "world1_2_env_cruise_v1.webp", "world1_2_env_banner_v1.webp", "world1_2_env_thermals_v1.webp", "world1_2_env_stormfront_v1.webp", "world1_2_env_rescue_v1.webp", "world1_2_env_landing_v1.webp",
    "world1_3_env_gauntlet_v1.webp", "world1_3_env_stampede_v1.webp", "world1_3_env_mercado_v1.webp", "world1_3_env_parade_v1.webp", "world1_3_env_guac_arena_v1.webp", "world1_3_env_victory_v1.webp", "world1_3_env_fiesta_v1.webp",
  ];

  assert.match(backgrounds, /const TRANSITION_WIDTH = 1600/);
  assert.match(backgrounds, /const PANORAMA_CROP = 0\.9/);
  assert.match(backgrounds, /world3-grade-preloaded-seamless-parallax/);
  assert.match(backgrounds, /noTiling: true/);
  assert.match(backgrounds, /subpixelMotion: true/);
  assert.match(backgrounds, /function drawStars/);
  assert.match(backgrounds, /function drawCloudWisps/);
  assert.match(backgrounds, /function drawBossSpotlights/);
  assert.match(backgrounds, /function drawLandingBeacons/);
  for (const name of stageNames) assert.match(backgrounds, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const filename of panoramaFiles) {
    assert.match(backgrounds, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  const levels = [
    ["index.html", "game.js", "1-1"],
    ["level1-2.html", "level1-2.js", "1-2"],
    ["level1-3.html", "level1-3.js", "1-3"],
  ];
  for (const [htmlName, runtimeName, levelId] of levels) {
    const html = await readFile(new URL(`../public/game/${htmlName}`, import.meta.url), "utf8");
    const runtime = await readFile(new URL(`../public/game/${runtimeName}`, import.meta.url), "utf8");
    assert.match(html, /world1-backgrounds\.js\?v=1/);
    assert.ok(html.indexOf("world1-backgrounds.js?v=1") < html.indexOf(runtimeName));
    assert.match(runtime, new RegExp(`levelId: '${levelId}'`));
    assert.match(runtime, /world1Background\.ready/);
    assert.match(runtime, /world1Background\.draw/);
    assert.match(runtime, /background: world1Background\.qaState\(\)/);
  }

  const prototype = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  const prototypeHtml = await readFile(new URL("../public/game/index.html", import.meta.url), "utf8");
  const foregroundAssets = [
    "world1_1_terrain_ground_v1.png",
    "world1_1_terrain_platform_v1.png",
    "world1_1_checkpoint_golden_cactus_v1.png",
    "world1_1_taco_trekker_body_v1.png",
    "world1_1_taco_trekker_olivia_v1.png",
    "world1_1_taco_trekker_wheel_v1.png",
    "world1_1_taco_drop_payload_v1.png",
  ];
  for (const filename of foregroundAssets) {
    assert.match(prototype, new RegExp(filename.replace(".png", "")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }
  assert.match(prototypeHtml, /game\.js\?v=58/);
  assert.match(prototype, /function drawPaintedTerrainSlice/);
  assert.match(prototype, /artStyle: 'goldenCactus'/);
  assert.match(prototype, /function drawTacoTrekkerLayers/);
  assert.match(prototype, /independentWheels: true/);
  assert.match(prototype, /rearTacoLauncher: true/);
  assert.match(prototype, /oliviaDrivingPose: true/);
  assert.match(prototype, /armThrowOverlay: false/);
  assert.match(prototype, /pinataVisualRemaster: 'burro-fringe-v1'/);
  assert.match(prototype, /function drawPinataFringeBand/);
  assert.match(prototype, /function tracePinataStar/);
  assert.doesNotMatch(prototype, /truckThrowAnim|truckThrowWorldX|tacoTrekkerThrowFrames|world1_1_olivia_throw_arm_v1/);

  const rescueForeground = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  const rescueForegroundHtml = await readFile(new URL("../public/game/level1-2.html", import.meta.url), "utf8");
  const rescueForegroundAssets = [
    "world1_2_ground_airfield_v1.webp",
    "world1_2_ground_sunny_v1.webp",
    "world1_2_ground_banner_v1.webp",
    "world1_2_ground_mesa_v1.webp",
    "world1_2_ground_guac_v1.webp",
    "world1_2_ground_rescue_v1.webp",
    "world1_2_platform_wing_v1.webp",
    "world1_2_platform_adobe_v1.webp",
    "world1_2_platform_guac_v1.webp",
  ];
  for (const filename of rescueForegroundAssets) {
    assert.match(rescueForeground, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }
  assert.match(rescueForegroundHtml, /level1-2\.js\?v=38/);
  assert.match(rescueForeground, /function drawPaintedTerrainSlice/);
  assert.match(rescueForeground, /checkpointArtGroundedByVisibleBaseline: true/);
  assert.match(rescueForeground, /independentCheckpointShadows: true/);
  assert.match(rescueForeground, /independentPropeller: true/);
  assert.match(rescueForeground, /independentTaxiWheels: true/);
  assert.match(rescueForeground, /function planeRearLauncherOrigin/);
  assert.match(rescueForeground, /function drawPlaneRearLauncherPulse/);
  assert.match(rescueForeground, /armAnimationRemoved: true/);
  assert.match(rescueForeground, /rearVehicleLauncher: true/);
  assert.doesNotMatch(rescueForeground, /world1_2_olivia_plane_throw_arm_v1|drawOliviaPlaneThrowArm|planeThrowArmFrames/);

  const showdownForeground = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  const showdownForegroundHtml = await readFile(new URL("../public/game/level1-3.html", import.meta.url), "utf8");
  const showdownForegroundAssets = [
    "world1_3_ground_gauntlet_v1.webp",
    "world1_3_ground_stampede_v1.webp",
    "world1_3_ground_mercado_v1.webp",
    "world1_3_ground_parade_v1.webp",
    "world1_3_ground_boss_v1.webp",
    "world1_3_ground_victory_v1.webp",
    "world1_3_ground_fiesta_v1.webp",
    "world1_3_platform_mesa_v1.webp",
    "world1_3_platform_canyon_v1.webp",
    "world1_3_platform_awning_v1.webp",
    "world1_3_platform_float_v1.webp",
    "world1_3_platform_neon_v1.webp",
    "world1_3_platform_lightrig_v1.webp",
    "world1_3_platform_rainbow_v1.webp",
    "world1_3_checkpoint_gauntlet_v1.webp",
    "world1_3_checkpoint_canyon_v1.webp",
    "world1_3_checkpoint_mercado_v1.webp",
    "world1_3_checkpoint_parade_v1.webp",
    "world1_3_checkpoint_showdown_v1.webp",
    "world1_3_checkpoint_fiesta_v1.webp",
  ];
  for (const filename of showdownForegroundAssets) {
    assert.match(showdownForeground, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }
  assert.match(showdownForegroundHtml, /level1-3\.js\?v=32/);
  assert.match(showdownForeground, /function drawPaintedTerrainSlice/);
  assert.match(showdownForeground, /checkpointArtGroundedByVisibleBaseline: true/);
  assert.match(showdownForeground, /independentCheckpointShadows: true/);
  assert.match(showdownForeground, /partyTruckRemastered/);
  assert.match(showdownForeground, /allCheckpointsGrounded/);
});

test("reserves World 1-1 confetti for authored celebrations and keeps elevated platforms one-way", async () => {
  const runtime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");

  const collectStart = runtime.indexOf('function collectItem(item)');
  const collectEnd = runtime.indexOf('function spawnTruckTaco', collectStart);
  const collectRuntime = runtime.slice(collectStart, collectEnd);
  assert.match(collectRuntime, /if \(item\.type !== 'taco'\)/, 'ordinary tacos skip pickup confetti');
  assert.doesNotMatch(collectRuntime, /game\.chaseCatchCount % 5 === 0[\s\S]{0,240}spawnConfetti/, 'ordinary chase tacos do not emit pickup confetti');
  const streakStart = collectRuntime.indexOf("} else if (game.streak === 5)");
  const specialPickupStart = collectRuntime.indexOf("if (item.type !== 'taco')", streakStart);
  const streakRuntime = collectRuntime.slice(streakStart, specialPickupStart);
  assert.doesNotMatch(streakRuntime, /spawnConfetti/, 'repeatable ordinary taco streak thresholds stay text-only');
  assert.doesNotMatch(collectRuntime, /item\.chaseDrop \? 24 : 16/, 'each airborne taco no longer emits a full confetti burst');
  assert.doesNotMatch(runtime, /item\.landed = true;\s*spawnConfetti/, 'ordinary truck tacos do not burst confetti when they land');
  assert.match(runtime, /increaseAirChain\('AIRBORNE APPETITE', item\.type !== 'taco'\)/, 'ordinary airborne tacos suppress the shared chain burst');
  assert.doesNotMatch(runtime, /Math\.random\(\) < dt \* \d+\) spawnConfetti\(game\.(?:dropTruckX|encoreTruckX|chaseTruckX)/, 'vehicle movement no longer sprays continuous confetti');

  const collisionStart = runtime.indexOf('function resolvePlatformCollision(prevY)');
  const collisionEnd = runtime.indexOf('function findRespawnPoint', collisionStart);
  const collisionRuntime = runtime.slice(collisionStart, collisionEnd);
  assert.match(runtime, /function isOneWayPlatform\(platform\)[\s\S]*platform\.h <= 30/);
  assert.match(runtime, /function crossesOneWayPlatformTop\(platform, prevY\)[\s\S]*if \(player\.vy < 0\) return false/);
  assert.match(collisionRuntime, /if \(isOneWayPlatform\(p\)\)[\s\S]*crossesOneWayPlatformTop\(p, prevY\)[\s\S]*continue/);
  assert.ok(collisionRuntime.indexOf('if (isOneWayPlatform(p))') < collisionRuntime.indexOf('const hits = rectsIntersect(player, p)'), 'one-way surfaces bypass four-sided collision');
  assert.match(collisionRuntime, /const hits = rectsIntersect\(player, p\)/, 'ground-height terrain keeps its solid collider');
});

test("remasters the complete World 1-1 enemy and NPC cast without changing gameplay geometry", async () => {
  const runtime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/index.html", import.meta.url), "utf8");
  const castAssets = [
    "world1_1_chili_bandit_sheet_v1.webp",
    "world1_1_tomato_trouble_sheet_v1.webp",
    "world1_1_onion_drama_sheet_v1.webp",
    "world1_1_jalapeno_popper_sheet_v1.webp",
    "world1_1_desert_locals_v1.webp",
  ];

  for (const filename of castAssets) {
    assert.match(runtime, new RegExp(filename.replace(".webp", "")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  assert.match(html, /game\.js\?v=58/);
  assert.match(runtime, /function remasteredEnemyFrame/);
  assert.match(runtime, /function drawRemasteredEnemy/);
  assert.match(runtime, /function drawDesertLocals/);
  assert.match(runtime, /enemyAnimationFrames: 8/);
  assert.match(runtime, /behaviorDrivenFrames: true/);
  assert.match(runtime, /trueBodyBaselines: true/);
  assert.match(runtime, /independentEnemyShadows: true/);
  assert.match(runtime, /decorativeLocals: desertLocals\.length/);
  assert.match(runtime, /nonCollidableLocals: true/);
  assert.match(runtime, /collisionGeometryPreserved: true/);
  assert.match(runtime, /if \(enemy\.telegraph\) return 4/);
  assert.match(runtime, /if \(enemy\.charging \|\| enemy\.rolling \|\| airborneSpecial\) return 5/);
});

test("authors the full World 1-1 pilot around purposeful upper routes and metadata rewards", async () => {
  const runtime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  const core = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/index.html", import.meta.url), "utf8");

  assert.match(runtime, /const pilotPlatformSpecs = Object\.freeze/);
  assert.match(runtime, /const pilotEncounterPlan = Object\.freeze/);
  assert.match(runtime, /const pilotEncorePlatformSpecs = Object\.freeze/);
  assert.match(runtime, /const pilotEncoreEncounterPlan = Object\.freeze/);
  assert.ok((runtime.match(/platformId: 'pilot-/g) || []).length >= 16);
  assert.match(runtime, /function ensurePilotPlatform/);
  assert.match(runtime, /function applyWorldOnePilotRemaster/);
  assert.match(runtime, /role: 'moving-guard'/);
  assert.match(runtime, /role: 'route-helper'/);
  assert.match(runtime, /role: 'champion'/);
  assert.match(runtime, /supportPlatformId: platform\.id/);
  assert.match(runtime, /platformEnemies: level\.enemies\.filter/);
  assert.doesNotMatch(runtime, /drawPilotRouteMarkers/);
  assert.doesNotMatch(runtime, /HIGH ROUTE •/);
  assert.doesNotMatch(runtime, /rewardHint/);
  assert.match(runtime, /enemyFreeChase:/);
  assert.match(runtime, /routeDiscoveryOnly: true/);
  assert.match(runtime, /routeMarkers: false/);
  assert.match(runtime, /highRouteLabels: false/);
  assert.match(runtime, /groupingAllowed = Boolean\(platform\.ground\) \|\| platform\.w >= 220/);
  assert.match(runtime, /function auditEnemyFormations/);
  assert.match(runtime, /id: 'opening-chili-pack', type: 'chili', startX: 760, y: 422,[\s\S]*?count: 2/);
  assert.doesNotMatch(runtime, /id: 'opening-chili-pack', type: 'chili', startX: 760, y: 422,\r?\n        count: 3/);
  assert.match(runtime, /openingLeadEnemyRemoved: game\.openingLeadEnemyRemoved \|\| 0/);
  assert.match(core, /const requestedStartOffset = Number\(anchor\.patrolStartOffset\)/);
  assert.match(runtime, /formationOverlapCount/);
  assert.match(runtime, /reward\?\.bonusItem/);
  assert.match(runtime, /sharedAbilities\.splatEnemy\(game\.abilities/);
  assert.match(core, /const requestedPlatformId = enemy\.supportPlatformId \|\| enemy\.platformId/);
  assert.match(core, /id === `\$\{requestedPlatformId\}-encore`/);
  assert.match(html, /game\.js\?v=58/);
  assert.match(html, /explore layered desert\r?\n\s+routes where risky jumps can lead to bonus powers/);
});

test("remasters the complete World 1-2 aviation enemy and NPC cast and restores Olivia's pink-and-blue bangs", async () => {
  const runtime = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level1-2.html", import.meta.url), "utf8");
  const castAssets = [
    "world1_2_tomato_trouble_aviator_sheet_v1.webp",
    "world1_2_onion_drama_aviator_sheet_v1.webp",
    "world1_2_jalapeno_popper_aviator_sheet_v1.webp",
    "world1_2_chili_bandit_aviator_sheet_v1.webp",
    "world1_2_lime_aviator_sheet_v1.webp",
    "world1_2_queso_cadet_sheet_v1.webp",
    "world1_2_airfield_crash_crew_v1.webp",
    "olivia_plane_sheet_v3.png",
  ];

  for (const filename of castAssets) {
    assert.match(runtime, new RegExp(filename.replace(/\./g, "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  assert.match(html, /level1-2\.js\?v=38/);
  assert.match(runtime, /SOURCE_VERSION = 'w1-2-v38-exploration-polish'/);
  assert.match(runtime, /\['terminal\.local', '127\.0\.0\.1', 'localhost'\]\.includes\(location\.hostname\)/);
  assert.match(runtime, /function remasteredEnemyFrame/);
  assert.match(runtime, /function drawCrewMember/);
  assert.match(runtime, /function drawAirfieldCrew/);
  assert.match(runtime, /enemyAnimationFrames: 8/);
  assert.match(runtime, /behaviorLinked: true/);
  assert.match(runtime, /trueBodyGrounding: true/);
  assert.match(runtime, /separateContactShadows: true/);
  assert.match(runtime, /crashCrewCharacters: crashCrew\.length/);
  assert.match(runtime, /crewAnimated: true/);
  assert.match(runtime, /oliviaHair: 'pink-and-blue'/);
  assert.match(runtime, /openingPlaneArt: 'olivia_plane_sheet_v3'/);
  assert.doesNotMatch(runtime, /sky_ingredient_enemy_sheet_v2\.png/);
  assert.doesNotMatch(runtime, /victory_villagers_v1\.png/);
});

test("authors the World 1-2 rescue pilot across combat sections without crowding flyby or rescue set pieces", async () => {
  const runtime = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level1-2.html", import.meta.url), "utf8");

  assert.match(runtime, /const skyPilotGroundPlan = Object\.freeze/);
  assert.match(runtime, /const skyPilotUpperPlan = Object\.freeze/);
  assert.match(runtime, /function addSkyFormation/);
  assert.match(runtime, /function applySkyPilotRemaster/);
  assert.match(runtime, /function auditSkyPilotFormations/);
  assert.match(runtime, /groupingRule: 'ground-or-large-platform'/);
  assert.match(runtime, /patrolCoverage: 'full-usable-platform-with-separated-pack-lanes'/);
  assert.match(runtime, /enemyFreeFirstFlyby: game\.skyForbiddenEnemyCounts\.firstFlyby === 0/);
  assert.match(runtime, /enemyFreeAmbushAndRescue: game\.skyForbiddenEnemyCounts\.ambushAndRescue === 0/);
  assert.match(runtime, /heroCore\.retuneEnemyFormationPatrols\(patrolTargets/);
  assert.match(runtime, /enemy\.anim \+= dt \* heroPhysics\.enemyVisualAnimationRate/);
  assert.match(runtime, /previousBottom: previousPlayerBottom/);
  assert.match(runtime, /previousTargetTop: previousEnemyTop/);
  assert.match(runtime, /player\.y = Math\.min\(player\.y, enemy\.y - player\.h - 1\)/);
  assert.match(html, /level1-2\.js\?v=38/);
});

test("adds four aviation-specific World 1-2 Super exploration payoffs without changing the normal route or plane sequence", async () => {
  const runtime = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level1-2.html", import.meta.url), "utf8");
  const audioCatalog = await readFile(new URL("../public/game/audio-catalog.js", import.meta.url), "utf8");
  const destinationAssets = [
    "world1_2_super_propeller_perch_v1.png",
    "world1_2_super_sky_banner_v1.png",
    "world1_2_super_flyby_relay_v1.png",
    "world1_2_super_cloud_cargo_v1.png",
  ];

  for (const filename of destinationAssets) {
    assert.match(runtime, new RegExp(filename.replace(/\./g, "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  assert.match(runtime, /SKY_EXPLORATION_VERSION = 'world-1-2-phase2-v2-polish'/);
  assert.match(runtime, /id: 'propeller-perch'[\s\S]*?routeRange: Object\.freeze\(\[6200, 7350\]\)/);
  assert.match(runtime, /id: 'sky-banner-run'[\s\S]*?routeRange: Object\.freeze\(\[11700, 13270\]\)/);
  assert.match(runtime, /id: 'olivia-flyby-relay'[\s\S]*?routeRange: Object\.freeze\(\[21400, 22400\]\)/);
  assert.match(runtime, /id: 'cloud-cargo'[\s\S]*?routeRange: Object\.freeze\(\[25450, 26850\]\)/);
  assert.match(runtime, /phase2-propeller-perch/);
  assert.match(runtime, /phase2-banner-finish/);
  assert.match(runtime, /phase2-relay-beacon/);
  assert.match(runtime, /phase2-cloud-cargo/);
  assert.match(runtime, /rewardPlatformId: 'phase2-propeller-perch'/);
  assert.match(runtime, /rewardPlatformId: 'phase2-banner-finish'/);
  assert.match(runtime, /rewardPlatformId: 'phase2-relay-beacon'/);
  assert.match(runtime, /rewardPlatformId: 'phase2-cloud-cargo'/);
  assert.match(runtime, /function skyExplorationRewardSurface/);
  assert.match(runtime, /rewardFlight: \{/);
  assert.match(runtime, /rewardLanding: \{/);
  assert.match(runtime, /if \(item\.rewardFlight && !item\.collected\)/);
  assert.match(runtime, /item\.type !== 'taco' \|\| item\.rewardFlight/);
  assert.match(runtime, /targetY = surface\.top - 31/);
  assert.match(runtime, /aboveSurface: item\.rewardLanding/);
  assert.match(runtime, /horizontallySafe: item\.rewardLanding/);
  assert.match(runtime, /function drawPropellerPerch/);
  assert.match(runtime, /function drawSkyBannerRun/);
  assert.match(runtime, /function drawOliviaRelay/);
  assert.match(runtime, /function drawCloudCargoSecret/);
  assert.match(runtime, /function beginOliviaFlybyRelay/);
  assert.match(runtime, /Taco Hero! I see your beacon—air-drop incoming!/);
  assert.match(runtime, /source: 'phase2-relay-round-trip'/);
  assert.match(runtime, /function canonicalFlybySignature/);
  assert.match(runtime, /function relayExcursionActive/);
  assert.match(runtime, /function startRelayRoundTrip/);
  assert.match(runtime, /phase: 'outbound'/);
  assert.match(runtime, /flyby\.phase = 'turnaround'/);
  assert.match(runtime, /flyby\.phase = 'return'/);
  assert.match(runtime, /flyby\.phase === 'return' \? -1 : 1/);
  assert.match(runtime, /continuity\.outboundPasses \+= 1/);
  assert.match(runtime, /continuity\.returnPasses \+= 1/);
  assert.match(runtime, /continuity\.airDrops \+= 1/);
  assert.match(runtime, /ambushReady && relayExcursionActive\(\)/);
  assert.match(runtime, /canonicalStateUnchanged:/);
  assert.match(runtime, /optionalPlaneOverlap:/);
  assert.match(runtime, /originalFlybyCount: game\.flybys\.length/);
  assert.match(runtime, /const previewAutoJump = qa && params\.get\('autoJump'\) === '1'/);
  assert.match(runtime, /const previewForceNormal = qa && params\.get\('normalOnly'\) === '1'/);
  assert.match(runtime, /const previewNoDamage = qa && params\.get\('noDamage'\) === '1'/);
  assert.match(runtime, /previewForceNormal \? false : sharedAbilities\.splatEnemy/);
  assert.match(runtime, /previewForceNormal \? false : sharedAbilities\.collectTaco/);
  assert.match(runtime, /if \(previewNoDamage\) return;/);
  assert.match(runtime, /cloudCargoRequiresAmbushStage: cloudCargoSecretPlan\.requiredAmbushStage/);
  assert.match(runtime, /if \(!state \|\| state\.completed\) return false/);
  assert.match(runtime, /if \(!state \|\| state\.rewardSpawned\) return false/);
  assert.match(runtime, /!platform\.phase2Pilot/);
  assert.match(runtime, /maximumLift: 118/);
  assert.match(runtime, /standardViewportSeparated:/);
  assert.match(runtime, /allEntriesRequireSuper: Object\.values\(entryRises\)\.every/);
  assert.match(runtime, /groundFallbackOpen: true/);
  assert.equal((runtime.match(/completionTitle: '[^']*DISCOVERED!'/g) || []).length, 1);
  assert.match(runtime, /completionTitle: 'PROP SYSTEM ONLINE'/);
  assert.match(runtime, /completionTitle: 'BANNERS AT FULL SAIL!'/);
  assert.match(runtime, /completionTitle: 'AIRBORNE LINK ESTABLISHED'/);
  assert.match(runtime, /completionTitle: 'CLOUD CARGO DISCOVERED!'/);
  assert.match(runtime, /bonusTacos: 9/);
  assert.match(runtime, /bonusTacos: 12/);
  assert.match(runtime, /bonusTacos: 14/);
  assert.match(runtime, /bonusTacos: 22/);
  assert.match(html, /Super Taco Hero reveals high-altitude flight paths/);
  assert.match(html, /level1-2\.js\?v=38/);
  assert.doesNotMatch(runtime, /world1_1_/);
  for (const eventId of ["checkpoint.activate", "ui.radio", "vehicle.aircraftApproach", "vehicle.drop", "pinata.break", "pinata.jackpotSparkle"]) {
    assert.match(audioCatalog, new RegExp(`'${eventId.replaceAll(".", "\\.")}'`));
  }
});

test("remasters the complete World 1-3 showdown enemy, boss, stampede, and NPC cast", async () => {
  const runtime = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level1-3.html", import.meta.url), "utf8");
  const castAssets = [
    "world1_3_salsa_slime_sheet_v1.webp",
    "world1_3_tortilla_knight_sheet_v1.webp",
    "world1_3_jalapeno_popper_sheet_v1.webp",
    "world1_3_guac_roller_sheet_v1.webp",
    "world1_3_churro_jumper_sheet_v1.webp",
    "world1_3_sombrero_mole_sheet_v1.webp",
    "world1_3_guac_pack_action_sheet_v1.webp",
    "world1_3_victory_cast_v1.webp",
  ];

  for (const filename of castAssets) {
    assert.match(runtime, new RegExp(filename.replace(/\./g, "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  assert.match(html, /level1-3\.js\?v=32/);
  assert.match(runtime, /SOURCE_VERSION = 'w1-3-v32-western-wanted-type'/);
  assert.match(runtime, /function remasteredEnemyFrame/);
  assert.match(runtime, /enemyAnimationFrames: 8/);
  assert.match(runtime, /behaviorLinked: true/);
  assert.match(runtime, /trueBodyGrounding: true/);
  assert.match(runtime, /perFrameVisibleBaselineMetadata: true/);
  assert.match(runtime, /separateContactShadows: true/);
  assert.match(runtime, /defeatReactionFrames: true/);
  assert.match(runtime, /guacPackRunAndPanicFrames: true/);
  assert.match(runtime, /victoryCastAnimated: true/);
  assert.match(runtime, /elGuacodilloStateLinkedActions: true/);
  assert.match(runtime, /elGuacodilloFrameCrossfades: true/);
  assert.match(runtime, /collisionGeometryPreserved: true/);
  assert.match(runtime, /if \(enemy\.telegraph\) return 4/);
  assert.match(runtime, /if \(enemy\.charging \|\| enemy\.rolling \|\| airborneSpecial\) return 5/);
});

test("authors World 1-3 combat around readable formations, full-platform patrols, and a clean set-piece flow", async () => {
  const runtime = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level1-3.html", import.meta.url), "utf8");

  assert.match(runtime, /const SHOWDOWN_GROUND_PLAN = Object\.freeze/);
  assert.match(runtime, /const SHOWDOWN_UPPER_PLAN = Object\.freeze/);
  assert.match(runtime, /function addShowdownFormation/);
  assert.match(runtime, /function applyShowdownRemaster/);
  assert.match(runtime, /function auditShowdownFormations/);
  assert.match(runtime, /speed: definition\.speed \?\?/);
  assert.match(runtime, /groupingRule: 'ground-or-large-platform'/);
  assert.match(runtime, /patrolCoverage: 'full-usable-platform-with-separated-pack-lanes'/);
  assert.match(runtime, /enemyFreeStampede: game\.showdownForbiddenEnemyCounts\.stampede === 0/);
  assert.match(runtime, /enemyFreeVictoryDash: game\.showdownForbiddenEnemyCounts\.victoryDash === 0/);
  assert.match(runtime, /enemyFreeBossArena: game\.showdownForbiddenEnemyCounts\.arena === 0/);
  assert.match(runtime, /heroCore\.retuneEnemyFormationPatrols\(patrolTargets/);
  assert.match(runtime, /enemy\.anim = \(enemy\.anim \|\| 0\) \+ dt \* heroPhysics\.enemyVisualAnimationRate/);
  assert.match(runtime, /previousBottom: player\.previousBottom/);
  assert.match(runtime, /previousTargetTop: previousEnemyTop/);
  assert.match(runtime, /player\.y = Math\.min\(player\.y, enemy\.y - player\.h - 1\)/);
  assert.match(html, /level1-3\.js\?v=32/);
});

test("adds World 1-3 Phase 2 exploration before the unchanged El Guacodillo arena", async () => {
  const runtime = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level1-3.html", import.meta.url), "utf8");
  const approvedWorld12 = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  const art = [
    "world1_3_super_pepper_mine_lift_v1.webp",
    "world1_3_super_salsa_silo_v1.webp",
    "world1_3_super_wanted_tower_v1.webp",
    "world1_3_super_guac_lookout_v1.webp",
    "world1_3_el_guacodillo_wanted_portrait_v1.webp",
    "world1_3_exploration_taco_reward_v1.webp",
    "world1_3_exploration_rainbow_taco_v1.webp",
    "world1_3_outlaw_stash_closed_v1.webp",
    "world1_3_outlaw_stash_open_v1.webp",
    "world1_3_pepper_mine_shaft_reconstruction_v2.webp",
  ];

  for (const filename of art) {
    assert.match(runtime, new RegExp(filename.replace(/\./g, "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }
  assert.match(html, /level1-3\.js\?v=32/);
  assert.match(runtime, /SHOWDOWN_EXPLORATION_VERSION = 'world-1-3-phase2-v2-polish'/);
  assert.match(runtime, /SHOWDOWN_VISUAL_POLISH_VERSION = 'world-1-3-phase2-grounding-polish-v2'/);
  assert.match(runtime, /PHASE2_GROUNDING_VERSION = 'world-1-3-grounding-v1'/);
  assert.match(runtime, /id: 'pepper-mine-lift'/);
  assert.match(runtime, /id: 'salsa-silo'/);
  assert.match(runtime, /id: 'wanted-tower'/);
  assert.match(runtime, /id: 'guac-lookout'/);
  assert.match(runtime, /id: 'outlaw-stash'/);
  assert.match(runtime, /completionTitle: 'PEPPER LIFT ONLINE'/);
  assert.match(runtime, /completionTitle: 'SALSA PRESSURE PERFECT!'/);
  assert.match(runtime, /completionTitle: 'WANTED TOWER LIT'/);
  assert.match(runtime, /completionTitle: 'GUAC LOOKOUT SECURED'/);
  assert.match(runtime, /completionTitle: 'OUTLAW STASH DISCOVERED!'/);
  assert.equal((runtime.match(/completionTitle: '[^']*DISCOVERED!/g) || []).length, 1);
  assert.match(runtime, /function buildShowdownExplorationGeometry/);
  assert.match(runtime, /allEntriesRequireSuper/);
  assert.match(runtime, /groundFallbackOpen: true/);
  assert.ok(runtime.indexOf("applyShowdownRemaster();") < runtime.indexOf("buildShowdownExplorationGeometry();"));
  assert.match(runtime, /PHASE2_BOSS_BUFFER_X = 24320/);
  assert.match(runtime, /phase2EndsBeforeBoss/);
  assert.match(runtime, /noPhase2PlatformsInArena/);
  assert.match(runtime, /interactionClearedAtBoss/);
  assert.match(runtime, /function finishExplorationInteractionForBoss/);
  assert.match(runtime, /rewardPlatformId: 'phase2-guac-lookout-deck'/);
  assert.match(runtime, /rewardLanding:/);
  assert.match(runtime, /horizontallySafe/);
  assert.match(runtime, /allCompletionCountsAtMostOne/);
  assert.match(runtime, /allRewardSpawnCountsAtMostOne/);
  assert.match(runtime, /world1_1_taco_trekker_olivia_v1\.png/);
  assert.match(runtime, /Take this—you’re gonna want some lime/);
  assert.match(runtime, /function drawElGuacadilloWantedPoster/);
  assert.match(runtime, /WANTED_POSTER_TYPOGRAPHY_VERSION = 'world-1-3-wanted-western-type-v1'/);
  assert.match(runtime, /function drawWesternPosterText/);
  assert.match(runtime, /drawWesternPosterText\('WANTED'/);
  assert.match(runtime, /drawWesternPosterText\('EL GUACADILLO'/);
  assert.match(runtime, /face: 'JFT Wanted Rye'/);
  assert.match(runtime, /face: 'JFT Wanted Stint'/);
  assert.match(runtime, /preferredSize: 19/);
  assert.match(runtime, /preferredSize: 16/);
  assert.match(runtime, /tracking: \.8/);
  assert.match(runtime, /tracking: \.55/);
  assert.match(runtime, /maxWidth: 104/);
  assert.match(runtime, /maxWidth: 108/);
  assert.match(runtime, /previousTypography: 'Georgia shrink-to-fit'/);
  assert.match(runtime, /comfortableMargins: true/);
  assert.match(runtime, /localFontsLoaded: wantedPosterFontsLoaded/);
  assert.doesNotMatch(runtime, /function setPosterFont/);
  for (const filename of [
    'fonts/wanted-poster/rye-regular-latin.woff2',
    'fonts/wanted-poster/stint-ultra-condensed-regular-latin.woff2',
    'fonts/wanted-poster/OFL-Rye.txt',
    'fonts/wanted-poster/OFL-StintUltraCondensed.txt',
  ]) {
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }
  assert.doesNotMatch(runtime, /3 STOMPS • HUGE EGO/);
  assert.match(runtime, /typographyContained: true/);
  assert.match(runtime, /portraitPreserved: true/);
  assert.match(runtime, /function groundedPhase2AssetBottom/);
  assert.match(runtime, /allHeavyStationArtMeetsSurface: true/);
  assert.match(runtime, /sourceBottomPadding: PHASE2_STATION_BOTTOM_PADDING/);
  assert.match(runtime, /platformY: 104/);
  assert.match(runtime, /closedWidth: 76/);
  assert.match(runtime, /openWidth: 84/);
  assert.match(runtime, /baseAnchor: 'reward-platform-top'/);
  assert.match(runtime, /rewardOriginsInsideChest: true/);
  assert.match(runtime, /onlyCollisionAdjustment: 'phase2-outlaw-stash:y18-to-y104'/);
  assert.doesNotMatch(runtime, /mounting the art downward beneath that/);
  assert.match(runtime, /approvedStationGeometryPreserved: true/);
  assert.match(runtime, /bossArenaUntouched: true/);
  assert.match(runtime, /rewardLogicPreserved: true/);
  assert.match(runtime, /collisionGeometryChanged: false/);
  assert.match(runtime, /PEPPER_MINE_RECONSTRUCTION_VERSION = 'world-1-3-pepper-shaft-v2'/);
  assert.match(runtime, /function drawPepperMineSurfaceReconstruction/);
  assert.match(runtime, /shaftAsset: 'world1_3_pepper_mine_shaft_reconstruction_v2\.webp'/);
  assert.match(runtime, /legacyRightShaftRemoved: true/);
  assert.match(runtime, /existingCageIsOnlyLift: true/);
  assert.match(runtime, /cageDescentAlignmentError: 1/);
  assert.match(runtime, /falsePlatformRemoved: true/);
  assert.match(runtime, /safeLedgeSide: 'left'/);
  assert.match(runtime, /shaftOpeningUnderCage: true/);
  assert.match(runtime, /structureGrounded: true/);
  assert.doesNotMatch(runtime, /world1_3_pepper_mine_shaft_v1\.webp/);
  await assert.rejects(access(new URL('../public/game/assets/world1_3_pepper_mine_shaft_v1.webp', import.meta.url)));
  assert.match(runtime, /compactDisplay \? canvas\.height - height - 205/);
  assert.match(runtime, /function activateLimeShield/);
  const hurt = runtime.slice(runtime.indexOf("function hurtPlayer"), runtime.indexOf("function announceSuper"));
  assert.ok(hurt.indexOf("if (game.limeShield)") < hurt.indexOf("sharedAbilities.absorbDamage"));
  assert.match(runtime, /damagePriority: 'lime-before-super-before-hearts'/);
  assert.match(runtime, /frozenPhase1Balance/);
  assert.match(approvedWorld12, /SOURCE_VERSION = 'w1-2-v38-exploration-polish'/);
});

test("ships the complete three-level Starlight Taco Carnival world", async () => {
  const runtime = await readFile(new URL("../public/game/world3.js", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");

  for (const filename of ["level3.html", "level3-2.html", "level3-3.html"]) {
    const html = await readFile(new URL(`../public/game/${filename}`, import.meta.url), "utf8");
    assert.match(html, /World 3/);
    assert.match(html, /35,000 units/);
    assert.match(html, /id="startBtn"/);
    assert.match(html, /world3\.js\?v=37/);
    assert.match(html, /world3\.css\?v=10/);
    assert.match(html, /controller\.js\?v=9/);
    assert.match(html, /data-next-level/);
    assert.match(html, /data-world3-music=/);
  }

  assert.match(runtime, /const WORLD_WIDTH = 35000/);
  assert.match(runtime, /Cloudtop Carnival Kickoff/);
  assert.match(runtime, /Midnight Midway Mayhem/);
  assert.match(runtime, /Taco Nova Firework Finale/);
  assert.match(runtime, /TACO NOVA! MAXIMUM STARS, MAXIMUM CRUNCH!/);
  assert.match(runtime, /KABOOM! CLOUDTOP TACO RAINBOW JACKPOT!/);
  assert.match(runtime, /SIR CORNELIUS POP/);
  assert.match(runtime, /RINGMASTER RADISH/);
  assert.match(runtime, /world3_far_sky_v1\.png/);
  assert.match(runtime, /world3_midground_v1\.png/);
  assert.match(runtime, /world3_near_scenery_v1\.png/);
  assert.match(runtime, /world3_terrain_rides_v1\.png/);
  assert.match(runtime, /world3_olivia_vehicles_v1\.png/);
  assert.match(runtime, /world3_enemies_bosses_v1\.png/);
  assert.match(runtime, /world3_checkpoints_fiesta_v1\.png/);
  assert.doesNotMatch(runtime, /world3_olivia_balloon_throw_v2\.png/);
  assert.match(runtime, /world3_1_midground_hd_v2\.png/);
  assert.match(runtime, /world3_1_near_hd_v2\.png/);
  assert.match(runtime, /world3_1_env_sunrise_v1\.webp/);
  assert.match(runtime, /world3_1_env_balloon_v1\.webp/);
  assert.match(runtime, /world3_1_env_noon_v1\.webp/);
  assert.match(runtime, /world3_1_env_sunset_v1\.webp/);
  assert.match(runtime, /world3_1_env_starlight_v1\.webp/);
  assert.match(runtime, /world3_2_env_blue_hour_v1\.webp/);
  assert.match(runtime, /world3_2_env_coaster_v1\.webp/);
  assert.match(runtime, /world3_2_env_funhouse_v1\.webp/);
  assert.match(runtime, /world3_2_env_blacklight_v1\.webp/);
  assert.match(runtime, /world3_2_env_tempest_v1\.webp/);
  assert.match(runtime, /world3_2_env_victory_v1\.webp/);
  assert.match(runtime, /world3_3_env_launch_v1\.webp/);
  assert.match(runtime, /world3_3_env_ringway_v1\.webp/);
  assert.match(runtime, /world3_3_env_nebula_v1\.webp/);
  assert.match(runtime, /world3_3_env_zeppelin_v1\.webp/);
  assert.match(runtime, /world3_3_env_eclipse_v1\.webp/);
  assert.match(runtime, /world3_3_env_nova_v1\.webp/);
  assert.match(runtime, /KICKOFF_ENVIRONMENT_TRANSITION = 1600/);
  assert.match(runtime, /MIDNIGHT_ENVIRONMENT_TRANSITION = 1600/);
  assert.match(runtime, /NOVA_ENVIRONMENT_TRANSITION = 1600/);
  assert.match(runtime, /Carnival Sunrise/);
  assert.match(runtime, /Balloon Bazaar/);
  assert.match(runtime, /High-Noon Skyway/);
  assert.match(runtime, /Cotton-Candy Sunset/);
  assert.match(runtime, /Starlight Piñata Parade/);
  assert.match(runtime, /Blue-Hour Midway Arrival/);
  assert.match(runtime, /Neon Coaster District/);
  assert.match(runtime, /Prism Funhouse/);
  assert.match(runtime, /Blacklight Backlot/);
  assert.match(runtime, /Popcorn Tempest Arena/);
  assert.match(runtime, /Golden Midnight Victory/);
  assert.match(runtime, /Golden Starlight Launch/);
  assert.match(runtime, /Celestial Ringway/);
  assert.match(runtime, /Nebula Carnival Gardens/);
  assert.match(runtime, /Zeppelin Star Parade/);
  assert.match(runtime, /Radish Eclipse Arena/);
  assert.match(runtime, /Taco Nova Ascension/);
  assert.match(runtime, /duration: 3\.2/);
  assert.match(runtime, /Math\.cos\(t \* Math\.PI \* 0\.5\)/);
  assert.match(runtime, /Math\.sin\(t \* Math\.PI \* 0\.5\)/);
  assert.match(runtime, /sourceVersion: SOURCE_VERSION/);
  assert.match(runtime, /function drawWorldPanoramaBand/);
  assert.match(runtime, /function drawCellTrimmed/);
  assert.match(runtime, /function drawVillagerBubble/);
  assert.match(runtime, /victorySigns: 0/);
  assert.match(runtime, /finaleSpriteLayers: 1/);
  assert.match(runtime, /finalePulseScale: false/);
  assert.match(runtime, /\{ top: 54, bottom: 12 \}/);
  assert.match(runtime, /\{ top: 58, bottom: 20 \}/);
  assert.match(runtime, /drawCellTrimmed\(images\.finale, 7, 4, 4, \{ bottom: 8 \}/);
  assert.doesNotMatch(runtime, /placardWords/);
  const goalRenderer = runtime.match(/function drawGoal\(\) \{[\s\S]*?\n  \}\n\n  function drawHud/)?.[0] || "";
  assert.doesNotMatch(goalRenderer, /ctx\.scale/);
  assert.doesNotMatch(runtime, /function drawParallaxBand/);
  assert.match(runtime, /five-act-preloaded-seamless-parallax/);
  assert.match(runtime, /function kickoffEnvironmentBlend/);
  assert.match(runtime, /function drawKickoffEnvironmentScene/);
  assert.match(runtime, /kickoffEnvironmentAssetsReady/);
  assert.match(runtime, /six-act-preloaded-seamless-parallax/);
  assert.match(runtime, /function midnightEnvironmentBlend/);
  assert.match(runtime, /function drawMidnightEnvironmentScene/);
  assert.match(runtime, /midnightEnvironmentAssetsReady/);
  assert.match(runtime, /six-act-cosmic-preloaded-seamless-parallax/);
  assert.match(runtime, /function novaEnvironmentBlend/);
  assert.match(runtime, /function drawNovaEnvironmentScene/);
  assert.match(runtime, /novaEnvironmentAssetsReady/);
  assert.match(runtime, /eclipseBossCracks/);
  assert.match(runtime, /function drawEclipseArenaEffects/);
  assert.match(runtime, /three-organized-ballistic-arcs/);
  assert.match(runtime, /function buildTacoNovaVictoryRun/);
  assert.match(runtime, /function drawFinaleZeppelinOrbit/);
  assert.match(runtime, /WORLD 3 HAS ACHIEVED MAXIMUM CRUNCH\./);
  assert.match(runtime, /ALL 9 LEVELS COMPLETE!/);
  assert.match(runtime, /const NINE_STAR_LEVELS = \['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2', '3-3'\]/);
  assert.match(runtime, /function startCosmicFinale/);
  assert.match(runtime, /function updateCosmicFinale/);
  assert.match(runtime, /function catchCosmicGoldenTaco/);
  assert.match(runtime, /function drawCosmicFinaleSky/);
  assert.match(runtime, /function drawCosmicFinaleCast/);
  assert.match(runtime, /LAST TACO, TACO HERO!/);
  assert.match(runtime, /LOW-GRAVITY BONUS TACO FLIGHT!/);
  assert.match(runtime, /COSMIC_BONUS_TACOS = 27/);
  assert.match(runtime, /cosmic-reprise/);
  assert.match(runtime, /const shapes = \['taco', 'star', 'ring', 'spiral'\]/);
  assert.match(runtime, /backgroundTransitionPulse: false/);
  assert.match(runtime, /parallaxSubpixel: true/);
  assert.match(runtime, /backgroundRepeats: 0/);
  assert.match(runtime, /heroRenderSize: 66/);
  assert.match(runtime, /drawHeroSpriteFrame[\s\S]*x: -33, y: -33, width: 66, height: 66/);
  assert.match(runtime, /vx: zeppelin \? -168 - arcIndex \* 22/);
  assert.match(runtime, /function vehicleRearLauncherOrigin/);
  assert.match(runtime, /function drawVehicleRearLauncherPulse/);
  assert.match(runtime, /armAnimationRemoved: true/);
  assert.match(runtime, /rearVehicleLauncher: true/);
  assert.doesNotMatch(runtime, /drawZeppelinThrowArm|throwPhase|vehicleThrowFrame/);
  assert.match(runtime, /vehicle\.x \+= \(targetX - vehicle\.x\)/);
  assert.match(runtime, /vehicleHorizontalWobble: levelId === '3-1' \? 0/);
  assert.match(runtime, /CLOUDTOP PIÑATA PARADE/);
  assert.match(runtime, /MIDNIGHT MIDWAY ENCORE/);
  assert.match(runtime, /TACO NOVA STAR LAUNCH/);
  assert.match(runtime, /function showResultsOverlay/);
  assert.match(runtime, /FINALE_RESULTS_DELAY = 5\.8/);
  assert.match(runtime, /OLIVIA: IT’S RAINING TACOS!!/);
  assert.match(runtime, /CLOUDTOP_TACO_RAIN_DURATION = 9\.2/);
  assert.match(runtime, /cloudtopTacoRainTarget = \(\) => \(constrainedDevice \? 120 : 180\)/);
  assert.match(runtime, /function startCloudtopFinale/);
  assert.match(runtime, /function updateCloudtopFinale/);
  assert.match(runtime, /function drawCloudtopFinaleCast/);
  assert.match(runtime, /CARNIVAL COMPLETE!/);
  assert.match(runtime, /BEST FIESTA EVER!/);
  assert.match(runtime, /TACO SHOWER!/);
  assert.match(runtime, /function updateFinalePinata/);
  assert.match(runtime, /function startMidnightFinale/);
  assert.match(runtime, /function updateMidnightFinale/);
  assert.match(runtime, /function drawMidnightFinalePads/);
  assert.match(runtime, /function drawMidnightFinaleCast/);
  assert.match(runtime, /MIDNIGHT MIDWAY IS LIT!/);
  assert.match(runtime, /OLIVIA: HIT THE LIGHTS!/);
  assert.match(runtime, /MIDNIGHT_PAD_LABELS = \['COASTER', 'FERRIS WHEEL', 'FUNHOUSE'\]/);
  assert.match(runtime, /MIDNIGHT_PAD_TACOS = 9/);
  assert.match(runtime, /MIDNIGHT_RESULTS_DELAY = 2\.8/);
  assert.match(runtime, /playAudio\('pinata\.break'/);
  assert.match(runtime, /cleanCheckpointCrops: true/);
  assert.match(runtime, /groundedEnemySprites: true/);
  assert.match(runtime, /visualGroundingMode: 'opaque-foot-and-base-baseline'/);
  assert.match(runtime, /enemyShadowAnchors: false/);
  assert.match(runtime, /checkpointShadowAnchors: false/);
  assert.match(runtime, /function placeFootprintOnGround/);
  assert.match(runtime, /function footprintIsGrounded/);
  assert.match(runtime, /groundedEnemies:/);
  assert.match(runtime, /groundedCheckpoints:/);
  assert.match(runtime, /groundedBoss:/);
  assert.match(runtime, /bossGroundingMode:/);
  assert.match(runtime, /playingTracks:/);
  assert.match(runtime, /particleBudget:/);
  assert.match(runtime, /victoryRouteEnemies:/);
  assert.match(runtime, /function startHitStop/);
  assert.match(runtime, /function updateHitStop/);
  assert.match(runtime, /startHitStop\(0\.14, 'pinata-jackpot'\)/);
  assert.match(runtime, /startHitStop\(0\.16, `\$\{boss\.kind\}-boss-victory`\)/);
  assert.match(runtime, /hitStopRecoveries:/);
  assert.match(runtime, /jft:controllerstate/);
  assert.match(runtime, /controllerStateSyncs:/);
  assert.match(runtime, /function releaseTouchPointer/);
  assert.doesNotMatch(runtime, /game\.settingsOpen \|\| game\.hitStop > 0/);
  assert.match(runtime, /function findRespawnLanding/);
  assert.match(runtime, /function finishRespawnLanding/);
  assert.match(runtime, /game\.respawn\.timer >= 3/);
  assert.doesNotMatch(runtime, /\bcoins?\b/i);

  assert.match(catalog, /id: 'world-3-level-1'/);
  assert.match(catalog, /id: 'world-3-level-2'/);
  assert.match(catalog, /id: 'world-3-level-3'/);
  assert.match(catalog, /transitionMode: 'equal-power'/);
});

test("authors World 3 combat around readable packs, full patrols, and safe set pieces", async () => {
  const runtime = await readFile(new URL("../public/game/world3.js", import.meta.url), "utf8");

  assert.match(runtime, /const SOURCE_VERSION = 37/);
  assert.match(runtime, /const WORLD3_REMASTER_PLANS = Object\.freeze/);
  assert.match(runtime, /function world3ForbiddenRanges/);
  assert.match(runtime, /function addWorld3Formation/);
  assert.match(runtime, /function addWorld3RouteHelper/);
  assert.match(runtime, /function auditWorld3Remaster/);
  assert.match(runtime, /groupingRule: 'ground-or-large-platform'/);
  assert.match(runtime, /patrolCoverage: 'full-usable-platform-with-separated-pack-lanes'/);
  assert.match(runtime, /heroCore\.retuneEnemyFormationPatrols\(patrolTargets/);
  assert.match(runtime, /world3FormationRules/);
  assert.match(runtime, /world3ForbiddenEnemyCounts/);
  assert.match(runtime, /previousBottom: player\.previousBottom/);
  assert.match(runtime, /previousTargetTop: previousEnemyTop/);
  assert.match(runtime, /player\.y = Math\.min\(player\.y, enemy\.y - player\.h - 1\)/);
  assert.match(runtime, /enemy\.anim = \(enemy\.anim \|\| 0\) \+ dt \* heroPhysics\.enemyVisualAnimationRate/);
  assert.match(runtime, /world3-1-combat-route-v2/);
  assert.match(runtime, /cloudtop-five-act-route-v2/);
  assert.match(runtime, /function buildCloudtopGroundRoute/);
  assert.match(runtime, /function buildCloudtopPlatformRoutes/);
  assert.match(runtime, /function buildCloudtopBalloonCorridor/);
  assert.match(runtime, /function auditCloudtopRoute/);
  assert.match(runtime, /enemy\.frame = 0/);
  assert.match(runtime, /const safeTrims = trims \|\| \{\}/);
  assert.match(runtime, /startupEnemyFramesReady/);
  assert.match(runtime, /jumpSafeLowerRoute/);
  assert.match(runtime, /carnival-sunrise-gates/);
  assert.match(runtime, /balloon-bazaar-runway/);
  assert.match(runtime, /high-noon-skyway/);
  assert.match(runtime, /cotton-candy-sunset-rides/);
  assert.match(runtime, /starlight-pinata-parade/);
  assert.match(runtime, /world3-2-combat-route-v2/);
  assert.match(runtime, /midnight-six-act-route-v2/);
  assert.match(runtime, /function buildMidnightGroundRoute/);
  assert.match(runtime, /function buildMidnightPlatformRoutes/);
  assert.match(runtime, /function buildMidnightCoasterCorridor/);
  assert.match(runtime, /function auditMidnightRoute/);
  assert.match(runtime, /blue-hour-midway-arrival/);
  assert.match(runtime, /neon-coaster-district/);
  assert.match(runtime, /prism-funhouse/);
  assert.match(runtime, /blacklight-backlot/);
  assert.match(runtime, /popcorn-tempest-arena/);
  assert.match(runtime, /golden-midnight-victory/);
  assert.match(runtime, /world3-3-combat-route-v2/);
  assert.match(runtime, /nova-six-act-route-v2/);
  assert.match(runtime, /function buildNovaGroundRoute/);
  assert.match(runtime, /function buildNovaPlatformRoutes/);
  assert.match(runtime, /function buildNovaZeppelinCorridor/);
  assert.match(runtime, /function auditNovaRoute/);
  assert.match(runtime, /rocket-parade-floats/);
  assert.match(runtime, /rotating-carnival-ringway/);
  assert.match(runtime, /nebula-garden-switchbacks/);
  assert.match(runtime, /wide-clear-zeppelin-parade/);
  assert.match(runtime, /ringmaster-eclipse-arena/);
  assert.match(runtime, /enemy-free-taco-nova-ascension/);
  assert.match(runtime, /olivia-vehicle/);
  assert.match(runtime, /boss-approach/);
  assert.match(runtime, /victory-route/);
});

test("builds El Guacodillo as a three-phase solo arena fight", async () => {
  const runtime = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level1-3.html", import.meta.url), "utf8");
  assert.match(runtime, /PHASE 1 • THE GUAC CHARGE/);
  assert.match(runtime, /PHASE 2 • GUAC AIR STRIKE/);
  assert.match(runtime, /PHASE 3 • MAXIMUM GUAC RAGE/);
  assert.match(runtime, /enemy\.boss \|\| \(enemy\.x < BOSS_ARENA_LEFT/);
  assert.match(runtime, /ordinaryEnemiesInArena/);
  assert.match(runtime, /GUAC-KRAK! THE GUAC HAS BEEN OFFICIALLY ROCKED!/);
  assert.match(runtime, /el_guacodillo_phase_sheet_v2\.png/);
  assert.match(html, /music_showdown_boss_air\.ogg/);
  assert.match(html, /music_showdown_boss_rage\.ogg/);
});

test("uses animated premium art for El Guacodillo, the Guac Pack, and island checkpoints", async () => {
  const showdown = await readFile(new URL("../public/game/level1-3.js", import.meta.url), "utf8");
  const island = await readFile(new URL("../public/game/level2.js", import.meta.url), "utf8");

  assert.match(showdown, /el_guacodillo_action_sheet_v3\.png/);
  assert.match(showdown, /guac_pack_sheet_v1\.png/);
  assert.match(showdown, /state === 'charge'/);
  assert.match(showdown, /images\.guacPack/);
  assert.match(showdown, /reactionProgress/);
  assert.match(showdown, /GUAC_PACK_FORMATION/);
  assert.match(showdown, /groundedAction/);
  assert.match(showdown, /else enemy\.y = enemy\.baseY/);
  assert.match(showdown, /world1_3_guac_pack_action_sheet_v1\.webp/);
  assert.match(showdown, /world1_3_victory_cast_v1\.webp/);

  assert.match(island, /world2_1_checkpoint_shell_v1\.webp/);
  assert.match(island, /world2_1_olivia_checkpoint_shell_v1\.webp/);
  assert.match(island, /checkpointOliviaImage/);
  assert.match(island, /const checkpointImage = images\[checkpointArtKeys\[checkpoint\.look\]\]/);
  assert.match(island, /const vehicleBob = floating/);
  assert.match(island, /checkpoint\.look === 'lighthouse'/);

  const skyRescue = await readFile(new URL("../public/game/level1-2.js", import.meta.url), "utf8");
  assert.match(skyRescue, /const groundY = enemy\.baseY \+ enemy\.h/);
  assert.match(skyRescue, /trueBodyGrounding: true/);
});

test("remasters World 2-1 art while preserving collision geometry and widening safe patrol lanes", async () => {
  const runtime = await readFile(new URL("../public/game/level2.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2.html", import.meta.url), "utf8");
  const remasterAssets = [
    "world2_1_env_shore_v1.webp", "world2_1_env_canopy_v1.webp", "world2_1_env_tides_v1.webp",
    "world2_1_env_surge_v1.webp", "world2_1_env_fiesta_v1.webp",
    "world2_1_ground_atlas_v1.webp", "world2_1_platform_atlas_v1.webp", "world2_1_checkpoint_pad_atlas_v1.webp",
    "world2_1_checkpoint_shell_v1.webp", "world2_1_checkpoint_canopy_v1.webp",
    "world2_1_checkpoint_lighthouse_v1.webp", "world2_1_checkpoint_moon_v1.webp",
    "world2_1_olivia_checkpoint_shell_v1.webp", "world2_1_olivia_checkpoint_canopy_v1.webp",
    "world2_1_olivia_checkpoint_lighthouse_v1.webp", "world2_1_olivia_checkpoint_moon_v1.webp",
    "world2_1_catamaran_base_v1.webp", "world2_1_catamaran_arm_layer_base_v1.webp",
    "world2_1_catamaran_escape_v1.webp",
    "world2_1_enemy_cast_v1.png",
  ];

  for (const filename of remasterAssets) {
    assert.match(runtime, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  assert.match(html, /level2\.js\?v=33/);
  assert.match(runtime, /SOURCE_VERSION = 'w2-1-v33-wavewatch-surf-repair'/);
  assert.match(runtime, /encounterAudit: game\.world2EncounterAudit/);
  assert.match(runtime, /const ENVIRONMENT_TRANSITION_WIDTH = 1600/);
  assert.match(runtime, /const ENVIRONMENT_PANORAMA_CROP = 0\.9/);
  assert.match(runtime, /function drawPaintedEnvironment/);
  assert.match(runtime, /function drawPaintedTerrainSlice/);
  assert.match(runtime, /function drawCheckpointPullOff/);
  assert.match(runtime, /function catamaranRearLauncherOrigin/);
  assert.match(runtime, /function drawCatamaranRearLauncherPulse/);
  assert.match(runtime, /function drawRemasteredIslandEnemy/);
  assert.match(runtime, /const islandEnemyRows = \{ crab: 0, coconut: 1, seagull: 2, puffer: 3, tiki: 4 \}/);
  assert.match(runtime, /crab: \[84, 66\], coconut: \[94, 68\], seagull: \[104, 68\], puffer: \[94, 68\], tiki: \[104, 70\]/);
  assert.match(runtime, /function retuneIslandGroundPatrols/);
  assert.match(runtime, /patrolCoverage: 'full-safe-platform-with-separated-lanes'/);
  assert.match(runtime, /groundPatrolAudit/);
  assert.match(runtime, /comboPatrolAudit/);
  assert.match(runtime, /game\.decorativeMidgroundRemoved = true;[\s\S]{0,80}return;/);
  assert.match(runtime, /enemyVisualRemaster/);
  assert.match(runtime, /noTiling: true/);
  assert.match(runtime, /backgroundRepeats: 0/);
  assert.match(runtime, /groundFamilies: terrainSourceRows\.ground\.length/);
  assert.match(runtime, /platformFamilies: terrainSourceRows\.platform\.length/);
  assert.match(runtime, /elevatedMinimumHeight: 44/);
  assert.match(runtime, /elevatedExtraDepth: 20/);
  assert.match(runtime, /collisionGeometryPreserved: true/);
  assert.match(runtime, /waterPhysicsPreserved: true/);
  assert.match(runtime, /locationSpecificPullOffs: Boolean\(images\.checkpointPadAtlas\)/);
  assert.match(runtime, /armAnimationRemoved: true/);
  assert.match(runtime, /rearVehicleLauncher: true/);
  assert.match(runtime, /activeWidth: 304/);
  assert.match(runtime, /escapeWidth: 330/);
  assert.match(runtime, /checkpointHeight: visualScale\.olivia\.standingHeight/);
  assert.match(runtime, /surfIntroSize: \[SURF_OLIVIA_VISUAL\.width, SURF_OLIVIA_VISUAL\.height\]/);
  assert.doesNotMatch(runtime, /world2_1_catamaran_throw_arm_v1|catamaranThrowArm|drawCatamaranThrowArm/);
  assert.match(runtime, /surfaceEncounterSpecs/);
  assert.match(runtime, /surfaceKind: 'palm-canopy'/);
  assert.match(runtime, /surfaceKind: 'tidal-temple-ledge'/);
  assert.match(runtime, /catamaranDropCorridor/);
  assert.match(runtime, /enemiesInCatamaranDropCorridor/);
});

test("adds four distinct World 2-1 Super exploration experiences, one true grotto secret, and the Robert and Corky tribute", async () => {
  const runtime = await readFile(new URL("../public/game/level2.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2.html", import.meta.url), "utf8");
  const phase2Assets = [
    "world2_1_phase2_coconut_crown_canopy_v1.webp",
    "world2_1_phase2_waterfall_grotto_v1.webp",
    "world2_1_phase2_shipwreck_mast_v1.webp",
    "world2_1_phase2_wavewatch_robert_corky_v1.webp",
  ];

  assert.match(html, /level2\.js\?v=33/);
  assert.match(runtime, /COVE_EXPLORATION_VERSION = 'world-2-1-phase2-v1'/);
  for (const filename of phase2Assets) {
    assert.match(runtime, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  for (const destination of [
    "id: 'coconut-crown-canopy'",
    "id: 'waterfall-wall'",
    "id: 'shipwreck-mast-run'",
    "id: 'wavewatch-lookout'",
    "id: 'secret-grotto'",
  ]) assert.ok(runtime.includes(destination), `includes ${destination}`);

  assert.match(runtime, /completionTitle: 'COCONUT CASCADE!'/);
  assert.match(runtime, /completionTitle: 'WATERFALL CRESTED'/);
  assert.match(runtime, /completionTitle: 'MAST RUN SECURED!'/);
  assert.match(runtime, /completionTitle: 'ENDLESS SUMMER LOOKOUT'/);
  assert.match(runtime, /completionTitle: 'SECRET GROTTO DISCOVERED!'/);
  assert.equal((runtime.match(/completionTitle: '[^']*DISCOVERED!'/g) || []).length, 1, "only the concealed grotto uses the major discovery language");
  assert.match(runtime, /presentation: 'organic-spectacle'/);
  assert.match(runtime, /presentation: 'natural-ascent'/);
  assert.match(runtime, /presentation: 'rigging-spectacle'/);
  assert.match(runtime, /presentation: 'tribute-character'/);
  assert.match(runtime, /presentation: 'true-secret'/);

  assert.match(runtime, /id: 'phase2-canopy-entry', x: 8110, y: 282, w: 392/);
  assert.match(runtime, /id: 'phase2-waterfall-entry', x: 14882, y: 245, w: 208/);
  assert.match(runtime, /id: 'phase2-shipwreck-entry', x: 22040, y: 258, w: 220/);
  assert.match(runtime, /id: 'phase2-wavewatch-entry', x: 23770, y: 286, w: 180/);
  assert.match(runtime, /allEntriesRequireSuper/);
  assert.match(runtime, /allDropRecoverable/);
  assert.match(runtime, /normalRouteUnaffected: true/);
  assert.match(runtime, /noRequiredSuperTraversal: true/);
  assert.match(runtime, /phase2ArtSurface: true/);
  assert.match(runtime, /if \(platform\.phase2ArtSurface\) return/);

  assert.match(runtime, /CATAMARAN_DROP_CORRIDOR = Object\.freeze\(\{ start: 17180, end: 21240 \}\)/);
  assert.match(runtime, /SURF_SCRIPT_START = 24820/);
  assert.match(runtime, /catamaranCorridorUntouched/);
  assert.match(runtime, /wavewatchBeforeSurfTrigger/);
  assert.match(runtime, /scriptedSurf = game\.surf\.phase === 'riding' \|\| game\.surf\.phase === 'landing'/);

  assert.match(runtime, /ROBERT_WAVEWATCH_DIALOGUE = 'Ready for an endless summer of tasty waves and tacos\?'/);
  assert.match(runtime, /longBrownHair: true, brownMustache: true, beard: false, uprightSurfboard: true/);
  assert.match(runtime, /breed: 'golden retriever', coat: 'golden-brown', calmFriendly: true, groundedNaturally: true/);
  assert.match(runtime, /originalCompositeScale: 1080 \/ 1536/);
  assert.match(runtime, /sourceScale: \.232/);
  assert.match(runtime, /sourceScale: \.245/);
  assert.match(runtime, /height: 126/);
  assert.match(runtime, /height: 72/);
  assert.match(runtime, /nameplateY: 260/);
  assert.match(runtime, /dialogueY: 360/);
  assert.match(runtime, /compactDialogueY: 150/);
  assert.match(runtime, /const width = Math\.min\(compact \? 620 : 610/);
  assert.match(runtime, /ctx\.lineTo\(worldAnchorX \+ 12, tailTargetY\)/);
  assert.match(runtime, /if \(!exploration\.dialogue\) drawCoveExplorationNameplate\(24205/);
  assert.match(runtime, /function drawWavewatchBackdrop/);
  assert.match(runtime, /if \(placement\.image === 'phase2Wavewatch'\) drawWavewatchBackdrop/);
  assert.match(runtime, /worldAnchorX = WAVEWATCH_CHARACTER_LAYOUT\.robert\.dialogueAnchorX/);
  assert.match(runtime, /dialoguePlacement: 'below-deck-desktop-right-side-mobile-with-robert-tail'/);
  assert.match(runtime, /function drawRobertWavewatchDialogue/);
  assert.match(runtime, /dialogue\.companion\} • GOOD DOG/);
  assert.match(runtime, /respectfulTone: true/);

  assert.match(runtime, /function spawnCoveExplorationRewards/);
  assert.match(runtime, /if \(!state \|\| state\.rewardSpawned\) return false/);
  assert.match(runtime, /if \(!state \|\| state\.completed\) return false/);
  assert.match(runtime, /allCompletionCountsAtMostOne/);
  assert.match(runtime, /allRewardSpawnCountsAtMostOne/);
  assert.match(runtime, /rewardFlight/);
  assert.match(runtime, /phase1BalanceFrozen: true/);
  assert.match(runtime, /tacoPowerThreshold: sharedAbilities\.definitions\.tacoPower\.threshold/);
  assert.match(runtime, /superJumpVelocity: heroPhysics\.superJumpVelocity/);
  assert.match(runtime, /window\.addEventListener\('jft:controlleraction'/);
  assert.match(runtime, /window\.addEventListener\('jft:controllerstate'/);
  assert.match(runtime, /if \(action === 'jump'\) \{/);
  assert.match(runtime, /const previewNormalOnly = previewHost/);
  assert.match(runtime, /const previewNoDamage = previewHost/);
});

test("restores Olivia's readable pre-big-wave support without resizing Olivia or changing the big wave", async () => {
  const runtime = await readFile(new URL("../public/game/level2.js", import.meta.url), "utf8");

  assert.match(runtime, /SURF_OLIVIA_VISUAL = Object\.freeze\(\{ width: 210, height: 140, leftOffset: -3, baselineOffset: -33 \}\)/);
  assert.match(runtime, /OLIVIA_SMALL_WAVE_VISUAL = Object\.freeze\(\{ frame: 4, width: 276, height: 92, leftOffset: -36, baselineOffset: -7 \}\)/);
  assert.match(runtime, /drawWaveCell\([\s\S]*?OLIVIA_SMALL_WAVE_VISUAL\.frame[\s\S]*?drawSurfCell\(0/);
  assert.match(runtime, /art: 'islandWave', zOrder: 'behind-olivia', timingPreserved: true/);
  assert.match(runtime, /const activeFrames = \[0, 1, 2, 1\]/);
  assert.match(runtime, /const spriteW = crashing \? 620 : 566/);
  assert.match(runtime, /const spriteH = crashing \? 620 : 566/);
  assert.match(runtime, /drawWaveCell\(frame, spriteX, spriteY, spriteW, spriteH\)/);
});

test("ships the 36,000-unit island route, premium vehicles, and playable surf finale", async () => {
  const runtime = await readFile(new URL("../public/game/level2.js", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2.html", import.meta.url), "utf8");

  assert.match(runtime, /const WORLD_WIDTH = 36000/);
  assert.match(runtime, /id: 'surge'.*start: 24500, end: 34200/);
  assert.match(runtime, /phase: 'idle'.*mountX: 25900/s);
  assert.match(runtime, /world\.surfObstacles = \[/);
  assert.match(runtime, /PERFECT BEACH LANDING!/);
  assert.match(runtime, /KERSPLASH!/);
  assert.match(runtime, /finalRunway: true/);
  assert.match(runtime, /world2_1_catamaran_base_v1\.webp/);
  assert.match(runtime, /island_surf_sheet_v1\.png/);
  assert.match(runtime, /island_wave_sheet_v1\.png/);
  assert.match(runtime, /images\.catamaranBase/);
  assert.match(runtime, /images\.catamaranLayerBase/);
  assert.match(runtime, /visualScale\.olivia\.standingHeight/);
  assert.match(runtime, /images\.islandSurf/);
  assert.match(runtime, /images\.islandWave/);
  assert.match(runtime, /const activeFrames = \[0, 1, 2, 1\]/);
  assert.match(runtime, /Moonlight ribbons travel across the wave face/);
  assert.match(runtime, /const ridingGap = 250/);
  assert.match(runtime, /const matchingSpeed = clamp\(player\.vx - 2, 356, 450\)/);
  assert.match(runtime, /wave\.x = player\.x - 220/);
  assert.doesNotMatch(runtime, /wave\.x -= 120/);
  assert.doesNotMatch(runtime, /wave\.x = 33040/);
  assert.match(runtime, /island_fiesta_stage_v1\.png/);
  assert.match(runtime, /island_fiesta_taco_truck_v1\.png/);
  assert.match(runtime, /island_fiesta_olivia_v1\.png/);
  assert.doesNotMatch(runtime, /drawVolcanoBackdrop|volcanoErupted|volcanoDrum/);

  assert.match(catalog, /worldWidth: 36000/);
  assert.match(catalog, /Moonlit Surf Rescue/);
  assert.doesNotMatch(html, /40,000-unit|volcano KABOOM|Lava Luau/);
  assert.match(html, /World 2 • Level 2-1 • 36,000 units/);
  assert.match(html, /ride your\s+own board over five obstacles/);
  assert.match(html, /id="resultWave"/);
});

test("ships the 35,000-unit caldera camping sequel with premium art and adaptive music", async () => {
  const runtime = await readFile(new URL("../public/game/level2-2.js", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../public/game/levels.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2-2.html", import.meta.url), "utf8");

  assert.match(runtime, /const WORLD_WIDTH = 35000/);
  assert.match(runtime, /name: 'Coconut Campgrounds'.*start: 0, end: 6500/);
  assert.match(runtime, /name: 'Caldera KABOOM'.*start: 19000, end: 27000/);
  assert.match(runtime, /name: 'Taco Trekker Escape'.*start: 27000, end: WORLD_WIDTH/);
  assert.match(runtime, /addReachableDetours\(sections\[0\]/);
  assert.match(runtime, /x: 27000, y: GROUND_Y, w: WORLD_WIDTH - 27000/);
  assert.match(runtime, /KABOOM! THE VOLCANO ORDERED EXTRA RAINBOW!/);
  assert.match(runtime, /duration: 3\.2/);
  assert.match(runtime, /const ENVIRONMENT_TRANSITION_WIDTH = 1600/);
  assert.match(runtime, /function drawPaintedEnvironment/);
  assert.match(runtime, /function drawPaintedTerrainSlice/);
  assert.match(runtime, /function drawCalderaCheckpointPullOff/);
  assert.match(runtime, /function drawCalderaTrekkerVehicle/);
  assert.match(runtime, /function drawTrekkerRearLauncherPulse/);
  assert.doesNotMatch(runtime, /function drawTrekkerThrowArm/);
  assert.doesNotMatch(runtime, /throwing:/);
  assert.match(runtime, /independentWheelMotion: true/);
  assert.match(runtime, /armAnimationRemoved: true/);
  assert.match(runtime, /rearVehicleLauncher: calderaTrekkerRearLauncher/);
  assert.match(runtime, /dropStates: \['compact-drop'\]/);
  assert.match(runtime, /secondLavaDropRemoved: true/);
  assert.match(runtime, /const origin = trekkerRearLauncherOrigin\(game\.boat\)/);
  assert.match(runtime, /xOffset: -104/);
  assert.match(runtime, /yOffset: -119/);
  assert.match(runtime, /const calderaEnemyDrawProfiles = Object\.freeze/);
  assert.match(runtime, /marshmallow: Object\.freeze\(\{ width: 78, height: 94 \}\)/);
  assert.match(runtime, /pepper: Object\.freeze\(\{ width: 70, height: 88 \}\)/);
  assert.match(runtime, /elevatedMinimumHeight: 46/);
  assert.match(runtime, /elevatedExtraDepth: 22/);
  for (const act of ["camp", "geyser", "caves", "eruption", "luau"]) {
    assert.match(runtime, new RegExp(`world2_2_env_${act}_v1\\.webp`));
    assert.match(runtime, new RegExp(`world2_2_checkpoint_${act}_v1\\.webp`));
  }
  assert.match(runtime, /world2_2_ground_atlas_v1\.webp/);
  assert.match(runtime, /world2_2_platform_atlas_v1\.webp/);
  assert.match(runtime, /world2_2_checkpoint_pad_atlas_v1\.webp/);
  assert.match(runtime, /world2_2_caldera_trekker_base_v1\.webp/);
  assert.match(runtime, /olivia_taco_trekker_sheet_v1\.png/);
  assert.match(runtime, /caldera_enemy_checkpoint_sheet_v1\.png/);
  assert.match(runtime, /world2_2_ash_enemy_v1\.png/);
  assert.match(runtime, /enemy\.type === 'ash' && images\.ashEnemy/);
  assert.match(runtime, /caldera_environment_sheet_v1\.png/);

  assert.match(catalog, /name: 'Campfire Caldera Caper'/);
  assert.match(catalog, /worldWidth: 35000/);
  assert.match(catalog, /name: 'Taco Trekker Escape'.*start: 27000, end: 35000/);
  assert.match(catalog, /Falling-rock on-foot escape and scripted Taco Trekker evacuation/);
  assert.match(catalog, /short brown hair with vivid pink-and-blue bangs/);
  assert.match(catalog, /crossfadeSeconds: 3\.2/);

  for (const track of ["camp", "geyser", "caves", "eruption", "luau"]) {
    assert.match(html, new RegExp(`music_caldera_${track}\\.ogg`));
  }
  assert.match(html, /World 2 • Level 2-2 • 35,000 units/);
  assert.match(html, /level2-2\.js\?v=15/);
  assert.match(runtime, /SOURCE_VERSION = 'w2-2-v15-volcano-hazard-jeep-reliability'/);
  assert.match(html, /id="startBtn"/);
  assert.match(runtime, /geyserGuardSpecs/);
  assert.match(runtime, /requiresGeyserAirborne/);
  assert.match(runtime, /geyserLaunchTimer/);
  assert.match(runtime, /regularLaunchVelocity: 840/);
  assert.match(runtime, /phase2LaunchVelocity: 920/);
  assert.match(runtime, /world2_2_geyser_vent_v2\.webp/);
  assert.match(runtime, /world2_2_geyser_plume_v2\.webp/);
  assert.match(runtime, /world2_2_volcano_fireball_v2\.webp/);
  assert.match(runtime, /world2_2_lava_pool_v1\.webp/);
  assert.match(runtime, /function updateVolcanoEscape/);
  assert.match(runtime, /function updateJeepRescue/);
  assert.match(runtime, /function drawJeepRescue/);
  assert.match(runtime, /inputMode: 'scripted-no-player-steering'/);
  assert.doesNotMatch(runtime, /updateWaveChase|drawWaveChase|world\.surfObstacles|game\.surf|game\.wave/);
  assert.doesNotMatch(runtime, /island_surf_sheet_v1|island_wave_sheet_v1/);
  assert.match(runtime, /type: 'ash'/);
  assert.match(runtime, /projectileMode: 'single-cannon-single-projectile'/);
});

test("adds four World 2-2 Super exploration destinations, one true Obsidian Stash, and one compact Olivia drop", async () => {
  const runtime = await readFile(new URL("../public/game/level2-2.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2-2.html", import.meta.url), "utf8");
  const phase2Assets = [
    "world2_2_phase2_sky_lodge_v1.webp",
    "world2_2_phase2_geyser_garden_v2.webp",
    "world2_2_phase2_lantern_shaft_v1.webp",
    "world2_2_phase2_caldera_firewatch_v1.webp",
    "world2_2_phase2_obsidian_stash_v1.webp",
  ];

  assert.match(html, /level2-2\.js\?v=15/);
  assert.match(runtime, /CALDERA_EXPLORATION_VERSION = 'world-2-2-phase2-v1'/);
  for (const filename of phase2Assets) {
    assert.match(runtime, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  for (const destination of [
    "id: 'coconut-camp-sky-lodge'",
    "id: 'geyser-garden-launch'",
    "id: 'lava-tube-lantern-shaft'",
    "id: 'caldera-firewatch'",
    "id: 'obsidian-stash'",
  ]) assert.ok(runtime.includes(destination), `includes ${destination}`);

  assert.match(runtime, /completionTitle: 'CAMP LOOKOUT LIT!'/);
  assert.match(runtime, /completionTitle: 'GEYSER ORCHESTRA!'/);
  assert.match(runtime, /completionTitle: 'LANTERN SHAFT AGLOW'/);
  assert.match(runtime, /completionTitle: 'CALDERA ALERT ONLINE'/);
  assert.match(runtime, /completionTitle: 'OBSIDIAN STASH DISCOVERED!'/);
  assert.equal((runtime.match(/completionTitle: '[^']*DISCOVERED!'/g) || []).length, 1, "only the concealed stash uses major discovery language");
  assert.match(runtime, /presentation: 'warm-camp-activation'/);
  assert.match(runtime, /presentation: 'geyser-orchestra'/);
  assert.match(runtime, /presentation: 'progressive-illumination'/);
  assert.match(runtime, /presentation: 'volcano-warning'/);
  assert.match(runtime, /presentation: 'true-secret'/);

  assert.match(runtime, /id: 'phase2-lodge-entry', x: 3985, y: 310, w: 300/);
  assert.match(runtime, /id: 'phase2-geyser-entry', x: 9285, y: 306, w: 240/);
  assert.match(runtime, /id: 'phase2-lantern-entry', x: 14242, y: 304, w: 242/);
  assert.match(runtime, /id: 'phase2-firewatch-entry', x: 16872, y: 306, w: 280/);
  assert.match(runtime, /id: 'phase2-obsidian-stash', x: 15472, y: 158, w: 330/);
  assert.match(runtime, /allEntriesRequireSuper/);
  assert.match(runtime, /allDropRecoverable/);
  assert.match(runtime, /standardViewportSeparated/);
  assert.match(runtime, /normalRouteUnaffected: true/);
  assert.match(runtime, /noRequiredSuperTraversal: true/);
  assert.match(runtime, /phase1BalanceFrozen: true/);
  assert.match(runtime, /if \(platform\.phase2ArtSurface\) return/);
  assert.match(runtime, /function drawPhase2ExplorationSurface/);
  assert.match(runtime, /CALDERA: PROBABLY FINE/);
  assert.match(runtime, /CALDERA: DEFINITELY NOT FINE/);

  assert.match(runtime, /ERUPTION_SCRIPT_START = 18450/);
  assert.match(runtime, /const VOLCANO_ESCAPE = Object\.freeze/);
  assert.match(runtime, /finalGeyserX: 26880/);
  assert.match(runtime, /rescueX: 27720/);
  assert.match(runtime, /jeepFinishX: 34120/);
  assert.match(runtime, /firewatchBeforeEruption/);
  assert.match(runtime, /allStationsBeforeEscape/);
  assert.match(runtime, /repeatedFinaleRemoved: true/);
  assert.match(runtime, /world21SequenceUntouched: true/);
  assert.match(runtime, /updateVolcanoEscape\(dt\)/);
  assert.match(runtime, /drawVolcanoEscape\(time\)/);
  assert.match(runtime, /drawJeepRescue\(time\)/);
  for (const filename of [
    "world2_2_geyser_vent_v2.webp",
    "world2_2_geyser_plume_v2.webp",
    "world2_2_volcano_fireball_v2.webp",
    "world2_2_lava_pool_v1.webp",
  ]) {
    assert.match(runtime, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  assert.match(runtime, /triggerStart: 7000/);
  assert.match(runtime, /triggerEnd: 8400/);
  assert.match(runtime, /maxDrops: 8/);
  assert.match(runtime, /boat\.state = 'compact-drop'/);
  assert.match(runtime, /dropStates: \['compact-drop'\]/);
  assert.match(runtime, /secondLavaDropRemoved: true/);
  assert.doesNotMatch(runtime, /boat\.state = 'geyser-drop'/);
  assert.doesNotMatch(runtime, /boat\.state = 'lava-chase'/);
  assert.match(runtime, /game\.boat\.catches >= 6/);
  assert.match(html, /controller\.js\?v=9/);
  assert.match(html, /class="touch-controls"/);
});

test("remasters World 2-2 volcano hazards and makes the Jeep rescue progression-safe", async () => {
  const runtime = await readFile(new URL("../public/game/level2-2.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2-2.html", import.meta.url), "utf8");
  const audio = await readFile(new URL("../public/game/audio-catalog.js", import.meta.url), "utf8");

  assert.match(html, /level2-2\.js\?v=15/);
  assert.match(runtime, /SOURCE_VERSION = 'w2-2-v15-volcano-hazard-jeep-reliability'/);
  for (const filename of ["world2_2_volcano_fireball_v2.webp", "world2_2_lava_pool_v1.webp"]) {
    assert.match(runtime, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }

  assert.match(runtime, /warningDuration: \.92/);
  assert.match(runtime, /lavaDangerDuration: 1\.55/);
  assert.match(runtime, /function drawVolcanoImpactWarning/);
  assert.match(runtime, /function drawVolcanoFireball/);
  assert.match(runtime, /function drawVolcanoLavaPool/);
  assert.match(runtime, /hazard\.state === 'impact' \|\| hazard\.state === 'lava'/);
  assert.match(runtime, /hazard\.state = 'cooling'/);
  assert.match(runtime, /decorativeLavaDistinctFromActivePools: true/);
  assert.match(runtime, /gameplayImpactPositionsPreserved/);
  assert.doesNotMatch(runtime, /ctx\.fillText\('!', screenX/);
  for (const eventId of ["hazard.volcanicDebrisWarn", "hazard.volcanicDebrisFall", "hazard.volcanicDebrisImpact"]) {
    assert.match(runtime, new RegExp(eventId.replaceAll(".", "\\.")));
    assert.match(audio, new RegExp(`'${eventId.replaceAll(".", "\\.")}'`));
  }

  assert.match(runtime, /rescueEligibilityX: 27340/);
  assert.match(runtime, /rescueFallbackX: 28120/);
  assert.match(runtime, /rescueTriggerIsYIndependent: true/);
  assert.match(runtime, /function ensureJeepRescueProgression/);
  assert.match(runtime, /progressionBased: true/);
  assert.match(runtime, /duplicateSpawnGuard/);
  assert.match(runtime, /rescue-state-self-heal/);
  assert.match(runtime, /goal-proximity-failsafe/);
  assert.match(runtime, /jeepApproachTimeout: 2\.85/);
  assert.match(runtime, /boardingRadiusX: 330/);
  assert.match(runtime, /boardingFallbackDelay: 2\.8/);
  assert.match(runtime, /jeepEscapeTimeout: 15\.5/);
  assert.match(runtime, /OLIVIA: TACO HERO! GET IN!/);

  assert.match(runtime, /regularLaunchVelocity: 840/);
  assert.match(runtime, /phase2LaunchVelocity: 920/);
  assert.match(runtime, /finalLaunchVelocity: 930/);
  assert.match(runtime, /phase2GeyserGarden/);
});

test("ships the complete 35,000-unit Neon Neckties concert level", async () => {
  const runtime = await readFile(new URL("../public/game/level2-3.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2-3.html", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../public/game/manifest-level2-3.json", import.meta.url), "utf8"));

  assert.match(runtime, /const WORLD_WIDTH = 35000/);
  assert.match(runtime, /name: 'Golden Ticket Victory Dash'.*start: 33000, end: WORLD_WIDTH/);
  assert.match(runtime, /victoryEnemies/);
  assert.match(runtime, /PLAY THE ONE ABOUT THE TACOS!/);
  assert.match(runtime, /NEON NECKTIES FOREVER!/);
  assert.match(runtime, /game\.generators === world\.generators\.length/);
  assert.match(runtime, /duration: 186\.72/);
  assert.match(runtime, /setMusic\('concert'\)/);
  assert.match(runtime, /jump_for_tacos_final_concert_cues_v1\.json/);
  assert.match(runtime, /heroPhysics\.enemyBounceVelocity/);
  assert.match(runtime, /heroCore\.celebrateSplatCombo/);
  assert.match(runtime, /neon_neckties_band_stage_v1\.png/);
  assert.match(runtime, /neon_neckties_olivia_crowd_v1\.png/);
  assert.match(runtime, /neon_neckties_world_enemies_v1\.png/);
  assert.match(runtime, /neon_neckties_hero_terrain_items_v2\.png/);
  assert.match(runtime, /neon_neckties_environment_stage_v2\.png/);
  assert.match(runtime, /neon_neckties_band_olivia_crowd_v2\.png/);
  assert.match(runtime, /neon_neckties_far_sky_v3\.png/);
  assert.match(runtime, /neon_neckties_midground_v3\.png/);
  assert.match(runtime, /neon_neckties_near_scenery_v3\.png/);
  assert.match(runtime, /neon_neckties_audience_v1\.png/);
  assert.match(runtime, /neon_neckties_nova_v2\.png/);
  assert.match(runtime, /neon_neckties_milo_arman_v1\.png/);
  assert.match(runtime, /neon_neckties_pinata_v1\.png/);
  assert.match(runtime, /neon_neckties_taco_tambourine_v1\.png/);
  assert.match(runtime, /const concertBandOrder = \[1, 2, 0, 3, 4\]/);
  assert.match(runtime, /premiumNova: Boolean\(images\.nova\)/);
  assert.match(runtime, /const nearSceneryBottomInsets = \{/);
  assert.match(runtime, /GROUND_Y - visualHeight \+ groundOffset/);
  assert.match(runtime, /\{ name: 'MILO', role: 'BASS'/);
  assert.match(runtime, /\{ name: 'ARMAN', role: 'KEYS'/);
  assert.doesNotMatch(runtime, /name: 'SUNNY'/);
  assert.match(runtime, /function drawReplacementBandSprite/);
  assert.match(runtime, /function updateOpeningScene/);
  assert.match(runtime, /function drawOpeningScene/);
  assert.match(runtime, /OLIVIA IS LOADING THE LAST TACOS!/);
  assert.match(runtime, /TACO ROADSTER: READY TO ROLL!/);
  assert.match(runtime, /SHOWTIME! OLIVIA IS TAKING THE SCENIC ROUTE!/);
  assert.match(html, /level2-3\.js\?v=26/);
  assert.match(runtime, /SOURCE_VERSION = 'w2-3-v26-welcome-booth-grounding'/);
  assert.match(runtime, /generatorDefensePlans/);
  assert.match(runtime, /function ensureGeneratorDefensePlatform/);
  assert.match(runtime, /finitePlatformGeometry: world\.platforms\.every/);
  assert.doesNotMatch(runtime, /support = addPlatform\(\{/);
  assert.match(runtime, /defenseEncounter: true/);
  assert.match(runtime, /CLEAR \$\{remaining\}/);
  assert.match(runtime, /preConcertDefenseRequired: false/);
  assert.match(runtime, /concertRouteRequirement: 'none'/);
  assert.match(runtime, /const world23GroundEncounterPlan = Object\.freeze/);
  assert.match(runtime, /const world23UpperEncounterPlan = Object\.freeze/);
  assert.match(runtime, /function buildWorld23AuthoredRoutes/);
  assert.match(runtime, /function authorWorld23CombatEncounters/);
  assert.match(runtime, /function auditWorld23CombatRemaster/);
  assert.match(runtime, /catamaranGroundEnemies/);
  assert.match(runtime, /distinctGeneratorDefenses/);
  assert.match(runtime, /function drawNpcChatBubble/);
  assert.match(runtime, /presentation: 'anchored-rounded-chat-bubbles'/);
  assert.match(runtime, /handheldSigns: false/);
  assert.doesNotMatch(runtime, /const fanSigns =/);
  assert.match(runtime, /const ENVIRONMENT_TRANSITION_WIDTH = 1600/);
  assert.match(runtime, /const ENVIRONMENT_PANORAMA_CROP = \.9/);
  assert.match(runtime, /function drawPaintedEnvironment/);
  assert.match(runtime, /function drawEnvironmentPlate/);
  assert.match(runtime, /function drawRemasteredPlatform/);
  assert.match(runtime, /function drawRemasteredCheckpointStation/);
  assert.match(runtime, /function drawRoadsterWheel/);
  assert.match(runtime, /world2_3_terrain_atlas_v1\.webp/);
  assert.match(runtime, /world2_3_checkpoint_stations_v1\.webp/);
  assert.match(runtime, /world2_1_catamaran_arm_layer_base_v1\.webp/);
  assert.doesNotMatch(runtime, /world2_1_catamaran_throw_arm_v1\.webp/);
  assert.match(runtime, /noTiling: true/);
  assert.match(runtime, /subpixelMotion: true/);
  for (const act of ["soundcheck", "beach", "rooftops", "stampede", "lagoon", "powerup", "victory"]) {
    const filename = `world2_3_env_${act}_v1.webp`;
    assert.match(runtime, new RegExp(filename.replace(".", "\\.")));
    await access(new URL(`../public/game/assets/${filename}`, import.meta.url));
  }
  await access(new URL("../public/game/assets/world2_3_terrain_atlas_v1.webp", import.meta.url));
  await access(new URL("../public/game/assets/world2_3_checkpoint_stations_v1.webp", import.meta.url));
  assert.match(runtime, /const BOAT_LEAD_DISTANCE = 400/);
  assert.match(runtime, /const BOAT_RENDER_WIDTH = 270/);
  assert.match(runtime, /const OPENING_ROADSTER_DRAW_WIDTH = 172/);
  assert.match(runtime, /game\.boat\.x = player\.x \+ BOAT_LEAD_DISTANCE/);
  assert.match(runtime, /vx: -220 - i \* 38/);
  assert.match(runtime, /island_catamaran_sheet_v1\.png/);
  assert.match(runtime, /images\.islandCatamaran/);
  assert.doesNotMatch(runtime, /images\.islandCatamaranArm/);
  assert.match(runtime, /staticOliviaPose: true/);
  assert.match(runtime, /animatedArm: false/);
  assert.match(runtime, /BOAT_LAUNCH_X_OFFSET/);
  assert.match(runtime, /full-energy-backstage-encore/);
  assert.match(runtime, /CONCERT_ENTRY_TRIGGER_X/);
  assert.doesNotMatch(runtime, /CONCERT_GATE_BLOCK_X|CONCERT GATE:/);
  const concertEntryFunction = runtime.match(
    /function resolveConcertEntry\(playerX, score, entryStatus\) \{[\s\S]*?\n  \}/,
  );
  assert.ok(concertEntryFunction, "World 2-3 exposes a deterministic concert-entry transition");
  const concertEntryContext = { CONCERT_ENTRY_TRIGGER_X: 34820 };
  vm.runInNewContext(
    `${concertEntryFunction[0]}; globalThis.resolveConcertEntryForTest = resolveConcertEntry;`,
    concertEntryContext,
    { filename: "level2-3-concert-entry.js" },
  );
  const blockedBossStatus = { reason: "main-route", routeReady: false, bossReady: false, encoreReady: false };
  assert.equal(
    concertEntryContext.resolveConcertEntryForTest(34820, 50000, blockedBossStatus).shouldStart,
    false,
    "the concert cannot begin before Feedback Fiend is defeated",
  );
  const mainRouteStatus = { reason: "main-route", routeReady: true, bossReady: true, encoreReady: false };
  const beforeBoundary = concertEntryContext.resolveConcertEntryForTest(34819, 50000, mainRouteStatus);
  assert.equal(beforeBoundary.shouldStart, false);
  for (const score of [0, 34540, 35000, 50000]) {
    const decision = concertEntryContext.resolveConcertEntryForTest(34820, score, mainRouteStatus);
    assert.equal(decision.shouldStart, true, `score ${score} must not block the main concert route`);
    assert.equal(decision.entryReason, "main-route");
    assert.equal(decision.scoreRequirement, 0);
  }
  const circuitDecision = concertEntryContext.resolveConcertEntryForTest(
    34820,
    1000,
    { reason: "stage-circuits", routeReady: true, encoreReady: true },
  );
  const encoreDecision = concertEntryContext.resolveConcertEntryForTest(
    34820,
    1000,
    { reason: "full-energy-backstage-encore", routeReady: true, encoreReady: true },
  );
  assert.equal(circuitDecision.shouldStart, true);
  assert.equal(encoreDecision.shouldStart, true);
  assert.match(runtime, /premiumPinata: Boolean\(images\.neonPinata\)/);
  assert.match(runtime, /KABOOM! MAXIMUM NEON TACO RAINBOW!/);
  assert.match(runtime, /TACO RAINBOW JACKPOT!/);
  assert.match(runtime, /i < 42/);
  assert.match(runtime, /type === 'rainbow'/);
  assert.match(runtime, /items_sheet\.png/);
  assert.match(runtime, /function findRespawnPoint/);
  assert.match(runtime, /player\.vy = Math\.min\(heroPhysics\.maxFallVelocity/);
  assert.match(runtime, /game\.respawn\.timer > 3/);
  assert.match(runtime, /checkpoint\.grounded = true/);
  assert.match(runtime, /cameo\.grounded = true/);
  assert.match(runtime, /ctx\.translate\(x, GROUND_Y\)/);
  assert.match(runtime, /const CONCERT_STAGE_FLOOR_Y = 420/);
  assert.match(runtime, /ctx\.translate\(x, CONCERT_STAGE_FLOOR_Y\)/);
  assert.match(runtime, /GROUND_Y - panel\.height/);
  assert.match(runtime, /village: 52/);
  assert.match(runtime, /function drawTimeOfDayAtmosphere/);
  assert.match(runtime, /parallaxLayers/);
  assert.match(runtime, /look === 'crowd'/);
  assert.match(runtime, /const concertAudience = \[/);
  assert.match(runtime, /const concertAudienceGrid = \{ columns: 6, rows: 2 \}/);
  assert.match(runtime, /premiumAudience: Boolean\(images\.concertAudience\)/);
  assert.match(runtime, /phase: 'surf-out'/);
  assert.match(runtime, /phase: 'surf-back'/);
  assert.match(runtime, /phase: 'taco-tambourine'/);
  assert.match(runtime, /phase: 'ground-dance'/);
  assert.match(runtime, /concertTime < 30/);
  assert.match(runtime, /concert\.timer < 60/);
  assert.match(runtime, /function skipConcert\(\)/);
  assert.match(runtime, /game\.concert\.skippedAt = game\.concert\.timer/);
  assert.match(runtime, /drawConcertAudience\(time, oliviaRoutine\)/);
  assert.match(runtime, /drawConcertOlivia\(time, oliviaRoutine\)/);
  assert.match(runtime, /const BOAT_WATERLINE_Y = 451/);
  assert.match(runtime, /function spawnChorusTacoVolley/);
  assert.match(runtime, /JUMP FOR TACOS! — CHORUS CANNONS!/);
  assert.match(runtime, /const inputSources = \{/);
  assert.match(runtime, /function recoverConcertPlayer/);
  assert.match(runtime, /premiumTambourine: Boolean\(images\.tacoTambourine\)/);
  assert.match(runtime, /jft:controllerstate/);

  assert.match(html, /World 2 • Level 2-3 • 35,000 units/);
  assert.match(html, /Get to the Show!/);
  assert.match(html, /controller\.js/);
  assert.match(html, /jump_for_tacos_final_concert_master\.mp3/);
  assert.match(html, /level2-3\.css\?v=3/);
  assert.match(html, /id="startBtn"/);
  assert.match(html, /id="skipConcertBtn"/);
  assert.match(html, /Skip Concert/);
  assert.equal(manifest.orientation, "landscape");
  assert.equal(manifest.display, "fullscreen");
});

test("remasters World 2-3 pre-show exploration and gates the crowd only behind Feedback Fiend", async () => {
  const runtime = await readFile(new URL("../public/game/level2-3.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/game/level2-3.html", import.meta.url), "utf8");
  const audio = await readFile(new URL("../public/game/audio-catalog.js", import.meta.url), "utf8");

  assert.match(runtime, /const WORLD23_PHASE2_STATIONS = Object\.freeze/);
  for (const station of [
    "Neon Neckties Welcome Arch",
    "Roadie Rooftops Soundcheck",
    "Neon Lagoon Rehearsal",
    "Golden Ticket Victory Dash",
    "Encore Stash",
  ]) {
    assert.match(runtime, new RegExp(`name: '${station}'`));
  }
  for (const completion of ["MARQUEE ONLINE", "SOUNDCHECK COMPLETE", "LAGOON REHEARSAL READY", "GOLDEN TICKET"]) {
    assert.match(runtime, new RegExp(`completion: '${completion}'`));
  }
  assert.match(runtime, /completion: 'ENCORE STASH DISCOVERED!'/);
  assert.doesNotMatch(runtime, /(?:MARQUEE|SOUNDCHECK|LAGOON|GOLDEN TICKET)[^'\n]*DISCOVERED!/);

  assert.match(runtime, /characters: Object\.freeze\(\[2, 4\]\)/);
  assert.match(runtime, /dialogue: 'ONE MORE TIME\. MAKE IT SHAKE\.'/);
  assert.match(runtime, /characters: Object\.freeze\(\[1\]\)/);
  assert.match(runtime, /dialogue: 'TRY THE PINK ONE!'/);
  assert.match(runtime, /characters: Object\.freeze\(\[3\]\)/);
  assert.match(runtime, /dialogue: 'ALMOST SHOWTIME\.'/);
  assert.match(runtime, /member: 0,[\s\S]*activity: 'carrying-microphone-case'/);
  assert.match(runtime, /uniqueCasualMembers: new Set\(\[0, 2, 4, 1, 3\]\)\.size/);

  assert.match(runtime, /const BASS_STACK_LAUNCH_VELOCITY = 600/);
  assert.match(runtime, /const BASS_STACK_BEAT_SECONDS = 1\.34/);
  assert.match(runtime, /bassPad: true/);
  assert.match(runtime, /player\.vy = -BASS_STACK_LAUNCH_VELOCITY/);
  assert.match(runtime, /automaticConcertFallback: fallbackSystems\.length > 0/);
  assert.match(runtime, /game\.phase2\.preShowHidden = true/);
  assert.match(runtime, /marquee: true,[\s\S]*sound: true,[\s\S]*lights: true,[\s\S]*backstage: true/);

  assert.match(runtime, /world2_3_neon_neckties_preshow_v1\.png/);
  assert.match(runtime, /world2_3_marquee_welcome_arch_v1\.webp/);
  assert.match(runtime, /world2_3_welcome_checkin_booth_v1\.webp/);
  assert.doesNotMatch(runtime, /world2_3_marquee_structure_v3\.webp/);
  assert.match(runtime, /world2_3_preshow_landmarks_v2\.webp/);
  assert.match(runtime, /world2_3_feedback_fiend_v1\.webp/);
  assert.match(runtime, /function preparePreShowBandSheet/);
  assert.match(runtime, /repeatedFivePlatformStaircases: 0/);
  assert.match(runtime, /grounded-check-in-roof-west-tower-service-lift-crossbeam-super-gap-east-tower-activation-perch/);
  for (const marqueeSurface of [
    "marquee-check-in-awning",
    "marquee-west-tower-ledge",
    "marquee-service-lift",
    "marquee-maintenance-catwalk",
    "marquee-east-sign-ledge",
    "marquee-east-tower-crossbeam",
    "marquee-activation-perch",
  ]) {
    assert.match(runtime, new RegExp(`kind: '${marqueeSurface}'`));
  }
  for (const removedMarqueeSurface of [
    "marquee-ticket-booth-awning",
    "marquee-lower-side-truss",
    "marquee-diagonal-catwalk",
    "marquee-suspended-light-deck",
    "marquee-opposite-tower-ledge",
    "marquee-sign-back-walkway",
    "marquee-upper-control-deck",
  ]) {
    assert.doesNotMatch(runtime, new RegExp(`kind: '${removedMarqueeSurface}'`));
  }
  assert.match(runtime, /routeShape: 'vertical-service-lift'/);
  assert.match(runtime, /routeShape: 'super-double-jump-gap'/);
  assert.match(runtime, /reward: Object\.freeze\(\{ x: 3650, y: 58, count: 10, columns: 10, rainbowEvery: 4 \}\)/);
  assert.match(runtime, /function drawWorld23MarqueeBackplate/);
  assert.match(runtime, /platform\.phase2StationId === 'marquee'/);
  assert.match(runtime, /genericPlatformBaseSuppressed: true/);
  assert.match(runtime, /unifiedWelcomeArch: true/);
  assert.match(runtime, /singleMarqueeIdentity: true/);
  assert.match(runtime, /premiumWelcomeBooth: true/);
  assert.match(runtime, /welcomeBoothRoofCollisionY: MARQUEE_WELCOME_BOOTH\.roofCollisionY/);
  assert.match(runtime, /welcomeBoothSignIntegrated: true/);
  assert.match(runtime, /continuousGroundFoundation: true/);
  assert.match(runtime, /closedGroundGapWidth: gapsBefore\.reduce/);
  assert.match(runtime, /id: 'marquee-ground-foundation'/);
  assert.match(runtime, /oldMarqueeLayersRendered: 0/);
  assert.match(runtime, /stageDecks: 0/);
  assert.match(runtime, /supportTowers: 2/);
  assert.match(runtime, /majorSuperGap: 260/);
  assert.match(runtime, /marqueeServiceLift: \(\(\) =>/);
  assert.match(runtime, /carryingPlayer: player\.platform\?\.id === lift\.id/);
  assert.match(runtime, /const marqueeHudGhost = game\.state === 'playing'/);
  assert.match(runtime, /player\.x >= 3000 && player\.x <= 4380 && player\.y < 210/);
  assert.match(runtime, /premiumGroundedMarqueeStructure: Boolean\(images\.marqueeStructure\)/);
  assert.match(runtime, /horizontal-rooftop-parkour-single-bass-launch/);
  assert.match(runtime, /waterfront-pontoons-suspended-rehearsal-structures/);
  assert.match(runtime, /fast-forward-flow-ticket-arches-and-moving-signs/);
  assert.match(runtime, /catamaranStart: 22800/);
  assert.match(runtime, /bossToCrowdBuffer/);
  assert.match(runtime, /function drawGroundedCheckpointOlivia/);
  assert.match(runtime, /checkpointArtCroppedToFoundation/);
  assert.match(runtime, /function drawFeedbackFiendArena/);
  assert.match(runtime, /const FEEDBACK_FIEND_MAX_HEALTH = 3/);
  assert.match(runtime, /attacks: \['bass-shockwave', 'feedback-drop', 'cable-sweep'\]/);
  assert.match(runtime, /damageMethod: 'three-stomps-on-open-amp-core'/);
  assert.match(runtime, /resetFeedbackFiendForRetry/);
  assert.match(runtime, /bossReady = game\.boss\.defeated/);
  assert.match(html, /audio-catalog\.js\?v=10/);
  await access(new URL("../public/game/assets/world2_3_neon_neckties_preshow_v1.png", import.meta.url));
  await access(new URL("../public/game/assets/world2_3_marquee_welcome_arch_v1.webp", import.meta.url));
  await access(new URL("../public/game/assets/world2_3_welcome_checkin_booth_v1.webp", import.meta.url));
  await access(new URL("../public/game/assets/world2_3_preshow_landmarks_v2.webp", import.meta.url));
  await access(new URL("../public/game/assets/world2_3_feedback_fiend_v1.webp", import.meta.url));
  for (const eventId of [
    "stage.generatorActivate",
    "concert.start",
    "concert.tambourineAccent",
    "checkpoint.activate",
    "boss.feedbackFiend.enter",
    "boss.feedbackFiend.shockwave",
    "boss.feedbackFiend.defeat",
  ]) {
    assert.match(runtime, new RegExp(eventId.replaceAll(".", "\\.")));
    assert.match(audio, new RegExp(`'${eventId.replaceAll(".", "\\.")}'`));
  }
});

test("ships the Neon Neckties full-song arrangement and review studio", async () => {
  const page = await readFile(new URL("../public/game/neon-neckties-studio.html", import.meta.url), "utf8");
  const runtime = await readFile(new URL("../public/game/neon-neckties-studio.js", import.meta.url), "utf8");
  const generator = await readFile(new URL("../scripts/generate-neon-neckties-song.py", import.meta.url), "utf8");
  const cues = JSON.parse(
    await readFile(new URL("../public/game/assets/neon_neckties/jump_for_tacos_final_concert_cues_v1.json", import.meta.url), "utf8"),
  );

  assert.match(page, /Jump for/);
  assert.match(page, /Final Concert Master/);
  assert.match(page, /Final concert master/);
  assert.match(page, /jump_for_tacos_final_concert_master\.mp3/);
  assert.match(page, /turn_the_sunset_up_power_trio_v1\.m4a/);
  assert.match(page, /turn_the_sunset_up_power_trio_v1\.ogg/);
  assert.match(page, /turn_the_sunset_up_instrumental_v1\.m4a/);
  assert.match(page, /turn_the_sunset_up_instrumental_v1\.ogg/);
  assert.match(page, /turn_the_sunset_up_melody_guide_v1\.m4a/);
  assert.match(runtime, /The guide is an intentionally synthetic melody reference/);
  assert.match(runtime, /selectMix/);
  assert.match(runtime, /tracksByMix/);
  assert.match(runtime, /state\.activeTrack\.currentTime/);
  assert.match(generator, /BPM = 126/);
  assert.match(generator, /BARS = 48/);
  assert.match(generator, /final original vocal pending/);

  assert.equal(cues.title, "Jump for Tacos");
  assert.equal(cues.artist, "Neon Neckties");
  assert.equal(cues.version, "final-concert-master-v1");
  assert.equal(cues.sections.length, 8);
  assert.ok(cues.durationSeconds >= 186 && cues.durationSeconds <= 187);
  assert.equal(cues.waveform.length, 192);
  assert.equal(cues.integration.world, "2-3");
  assert.equal(cues.integration.role, "finale concert master");
});

test("loads the shared Phase 3 audio foundation before World 1-1 and resolves every semantic event", async () => {
  const html = await readFile(new URL("../public/game/index.html", import.meta.url), "utf8");
  const runtime = await readFile(new URL("../public/game/game.js", import.meta.url), "utf8");
  const catalogSource = await readFile(new URL("../public/game/audio-catalog.js", import.meta.url), "utf8");
  const engineSource = await readFile(new URL("../public/game/audio-engine.js", import.meta.url), "utf8");
  const generatorSource = await readFile(new URL("../scripts/generate-sfx.mjs", import.meta.url), "utf8");
  const lab = await readFile(new URL("../public/game/audio-lab.html", import.meta.url), "utf8");
  const labRuntime = await readFile(new URL("../public/game/audio-lab.js", import.meta.url), "utf8");
  const landingPage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  const catalogPosition = html.indexOf('src="audio-catalog.js?v=9"');
  const enginePosition = html.indexOf('src="audio-engine.js?v=7"');
  const runtimePosition = html.indexOf('src="game.js?v=58"');
  assert.ok(catalogPosition >= 0, "World 1-1 loads the semantic catalog");
  assert.ok(enginePosition > catalogPosition, "the engine loads after its catalog");
  assert.ok(runtimePosition > enginePosition, "the engine loads before the World 1-1 runtime");

  const context = { console, window: {} };
  vm.runInNewContext(catalogSource, context, { filename: "audio-catalog.js" });
  vm.runInNewContext(engineSource, context, { filename: "audio-engine.js" });
  const catalog = context.window.JFT_AUDIO_CATALOG;
  const engine = context.window.JFT_AUDIO;
  assert.equal(catalog.version, "phase3-catalog-v4-fiesta-wing-shoes");
  assert.equal(catalog.assetCacheVersion, "sfx-phase3-v4-fiesta-wing-shoes");

  const required = [
    "ui.start", "ui.confirm", "hero.jump", "hero.landSoft", "hero.landHard",
    "hero.hurt", "hero.fall", "hero.respawnBeam", "hero.respawnLand", "hero.superJump",
    "collect.taco", "collect.tacoCluster", "collect.goldenTaco", "collect.rainbowTaco",
    "combat.enemyStomp", "combat.enemySplat", "combat.comboMilestone",
    "ability.magnetStart", "ability.frenzyStart", "ability.superTransform", "ability.superShoes", "ability.superPowerDown", "checkpoint.activate",
    "pinata.hit", "pinata.break", "goal.enter", "level.complete",
  ];
  for (const eventId of required) {
    assert.ok(catalog.events[eventId], `catalog contains ${eventId}`);
    assert.equal(engine.hasEvent(eventId), true, `engine resolves ${eventId}`);
  }

  const eventLiteral = /'((?:ui|hero|collect|combat|ability|checkpoint|pinata|goal|level|world1|vehicle)\.[A-Za-z][A-Za-z0-9]*)'/g;
  const referencedEvents = [...runtime.matchAll(eventLiteral)].map((match) => match[1]);
  assert.ok(referencedEvents.length >= required.length, "World 1-1 references a complete semantic event set");
  for (const eventId of new Set(referencedEvents)) {
    assert.ok(catalog.events[eventId], `World 1-1 event ${eventId} exists in the catalog`);
  }

  for (const api of [
    "init", "preload", "preloadGroups", "registerMusicTracks", "play", "startLoop", "updateLoop", "stopLoop",
    "setMusicVolume", "setMusicDuck", "clearMusicDuck", "setEffectsVolume", "setMuted", "getTelemetry",
  ]) {
    assert.equal(typeof engine[api], "function", `${api} remains available`);
  }
  engine.setMusicVolume(0.61);
  engine.setEffectsVolume(0.89);
  engine.setMuted(true);
  const telemetry = engine.getTelemetry();
  assert.equal(telemetry.engineVersion, "2.2.1-release-preload");
  assert.equal(telemetry.assetCacheVersion, "sfx-phase3-v4-fiesta-wing-shoes");
  assert.equal(telemetry.audioContextState, "not-created");
  assert.equal(telemetry.audioContextLatencySeconds.base, null);
  assert.equal(telemetry.audioContextLatencySeconds.output, null);
  assert.equal(telemetry.currentBusLevels.music.setting, 0.61);
  assert.equal(telemetry.currentBusLevels.gameplaySfx.setting, 0.89);
  assert.equal(telemetry.currentBusLevels.master.muted, true);

  const catalogAssets = new Set();
  for (const definition of Object.values(catalog.events)) {
    (definition.variants || []).forEach((asset) => catalogAssets.add(asset));
    if (definition.variantsByOption) {
      Object.values(definition.variantsByOption.variants).flat().forEach((asset) => catalogAssets.add(asset));
    }
  }
  for (const asset of catalogAssets) {
    await access(new URL(`../public/game/${asset}`, import.meta.url));
  }

  const normalSplat = catalog.events["combat.enemySplat"];
  const perfectStomp = catalog.events["combat.enemyStomp"];
  assert.equal(normalSplat.variants, undefined, "normal splats use enemy-specific variants");
  for (const enemyType of ["tomato", "onion", "chili", "jalapeno"]) {
    assert.equal(normalSplat.variantsByOption.variants[enemyType].length, 2, `${enemyType} has two normal splats`);
    assert.equal(perfectStomp.variantsByOption.variants[enemyType].length, 1, `${enemyType} has a perfect stomp`);
  }
  assert.ok(normalSplat.duckDb < perfectStomp.duckDb, "perfect bounce adds reward without excessive non-perfect squish gain");

  const splatRecipe = generatorSource.match(/enemySplat\(sound,[\s\S]*?\n  },/)?.[0] || "";
  const stompRecipe = generatorSource.match(/enemyStomp\(sound,[\s\S]*?\n  },/)?.[0] || "";
  const squishHelper = generatorSource.match(/function addCartoonEnemySquish[\s\S]*?\n}\n\nfunction addBoing/)?.[0] || "";
  assert.match(generatorSource, /function addCartoonEnemySquish/);
  assert.match(generatorSource, /sourceId: "freesound-445118"/);
  assert.match(splatRecipe, /addCartoonEnemySquish/);
  assert.doesNotMatch(splatRecipe, /addBoing/, "normal splat has no full rebound layer");
  assert.match(stompRecipe, /addCartoonEnemySquish/);
  assert.match(stompRecipe, /addBoing/, "perfect stomp adds the pronounced rebound layer");
  assert.doesNotMatch(squishHelper, /addShellCrunch/, "non-perfect squish does not lead with the former dry shell crunch");

  const sfxManifest = JSON.parse(
    await readFile(new URL("../public/game/assets/sfx/sfx-manifest.json", import.meta.url), "utf8"),
  );
  assert.match(sfxManifest.source, /procedural layers plus the explicitly documented CC0 recordings/);
  assert.equal(sfxManifest.assetCount, catalogAssets.size);
  assert.equal(sfxManifest.generatorVersion, "jft-sfx-phase3-v2-external-source-amendment");
  assert.equal(sfxManifest.assetCount, 282, "full-game library includes every deterministic Phase 3 render and two private A/B baselines");
  assert.ok(sfxManifest.totalBytes < 14 * 1024 * 1024, "full-game SFX stay below 14 MiB");
  assert.ok(sfxManifest.assets.every((asset) => asset.bytes < 450 * 1024), "each SFX stays below 450 KiB, including the 4.45-second propeller loop");
  assert.ok(sfxManifest.assets.every((asset) => ["procedural", "hybrid", "sourced-recording"].includes(asset.sourceType)), "every asset declares its provenance type");
  assert.equal(sfxManifest.externalSources.length, 6, "the manifest records every selected and rejected source candidate");
  const selectedSources = sfxManifest.externalSources.filter((source) => source.selected);
  assert.deepEqual(selectedSources.map((source) => source.id).sort(), ["freesound-251971", "freesound-445118", "freesound-789390"]);
  assert.ok(sfxManifest.externalSources.every((source) => source.license === "CC0 1.0"));
  assert.ok(sfxManifest.externalSources.every((source) => source.sourceUrl && source.originalFilename && source.creator && source.acquisitionDate && source.attributionRequirement && source.modifications));
  for (const source of selectedSources) {
    const bytes = await readFile(new URL(`../${source.committedSourcePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.committedPreviewSha256, `${source.id} source preview hash matches`);
  }
  for (const asset of sfxManifest.assets) {
    const bytes = await readFile(new URL(`../public/game/${asset.path}`, import.meta.url));
    assert.equal(bytes.length, asset.bytes, `${asset.path} byte length matches its manifest`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, `${asset.path} hash matches`);
  }

  const rmsWindowDb = (bytes, startSeconds, endSeconds) => {
    const startSample = Math.floor(startSeconds * 44_100);
    const endSample = Math.floor(endSeconds * 44_100);
    let sumSquares = 0;
    for (let sample = startSample; sample < endSample; sample += 1) {
      const value = bytes.readInt16LE(44 + sample * 2) / 32_768;
      sumSquares += value * value;
    }
    return 20 * Math.log10(Math.sqrt(sumSquares / (endSample - startSample)) + 1e-12);
  };
  const normalSquishBytes = await readFile(new URL("../public/game/assets/sfx/world1/enemy-splat-tomato-01.wav", import.meta.url));
  const perfectBounceBytes = await readFile(new URL("../public/game/assets/sfx/world1/enemy-stomp-tomato-01.wav", import.meta.url));
  const propellerLoopBytes = await readFile(new URL("../public/game/assets/sfx/world1/aircraft-propeller-idle-01.wav", import.meta.url));
  assert.ok(
    rmsWindowDb(normalSquishBytes, 0.02, 0.12) >= rmsWindowDb(normalSquishBytes, 0, 0.02) - 1,
    "the juicy squish body remains at least as present as its padded onset",
  );
  assert.ok(
    rmsWindowDb(perfectBounceBytes, 0.12, 0.22) >= rmsWindowDb(normalSquishBytes, 0.12, 0.22) + 10,
    "the perfect bounce has a pronounced late boing that the non-perfect squish does not",
  );
  const propellerLastSample = propellerLoopBytes.readInt16LE(propellerLoopBytes.length - 2) / 32_768;
  const propellerFirstSample = propellerLoopBytes.readInt16LE(44) / 32_768;
  assert.ok(Math.abs(propellerLastSample - propellerFirstSample) < 0.08, "the recorded propeller loop has a bounded wrap seam");
  const propellerWindows = [
    rmsWindowDb(propellerLoopBytes, 0.05, 0.35),
    rmsWindowDb(propellerLoopBytes, 2.05, 2.35),
    rmsWindowDb(propellerLoopBytes, 4.05, 4.35),
  ];
  assert.ok(Math.max(...propellerWindows) - Math.min(...propellerWindows) < 7, "the recorded propeller bed stays stable before runtime distance automation");

  assert.doesNotMatch(runtime, /createOscillator\s*\(/, "World 1-1 has no raw oscillator synthesis");
  assert.doesNotMatch(runtime, /function\s+sfx\s*\(/, "World 1-1 has no local sfx function");
  assert.doesNotMatch(runtime, /AudioContext|webkitAudioContext/, "World 1-1 delegates its AudioContext");
  assert.match(engineSource, /function playFallback/);
  assert.match(engineSource, /createOscillator\s*\(/, "the only Phase 1 oscillator is the centralized fallback");
  assert.match(engineSource, /createDynamicsCompressor\s*\(/);
  assert.match(engineSource, /music\.connect\(musicSceneDuck\)\.connect\(musicDuck\)\.connect\(master\)/);
  assert.match(engineSource, /maximumVoices/);
  assert.match(engineSource, /droppedEffectsByPriority/);
  assert.match(engineSource, /function resumePendingLoops/);
  assert.match(engineSource, /function updateLoop/);
  assert.match(engineSource, /const PRELOAD_CONCURRENCY = 8/);
  assert.match(engineSource, /function preloadAssetPaths/);
  assert.match(engineSource, /assetPath\.includes\(`\/sfx\/\$\{group\}\/`\)/, "group preloads do not expand mixed-world semantic variants");
  assert.match(engineSource, /Math\.max\(requestedEndsAt, duckEnvelope\.endsAt/);
  assert.match(engineSource, /fetch\(assetRequestUrl\(assetPath\)\)/, "Phase 3 assets use a cache-busted request URL");
  assert.match(runtime, /jumpinForTacosProgressV2/);
  assert.match(runtime, /savedProgress\.settings\.musicVolume \?\? 0\.7/);
  assert.match(runtime, /savedProgress\.settings\.effectsVolume \?\? 0\.8/);
  assert.match(runtime, /function defeatEnemy\(enemy, perfectBounce = true/);
  assert.match(runtime, /perfectBounce \? 'combat\.enemyStomp' : 'combat\.enemySplat'/);
  assert.match(runtime, /frenzyWasActive && !sharedAbilities\.isFrenzy\(game\.abilities\).*ability\.frenzyEnd/);
  assert.match(runtime, /magnetWasActive && !sharedAbilities\.hasMagnet\(game\.abilities\).*ability\.magnetEnd/);

  assert.match(lab, /jump_for_tacos_final_concert_master\.mp3/);
  assert.match(lab, /Magnet-cascade stress test/);
  assert.match(lab, />Prior Procedural Squish</);
  assert.match(lab, />Final Hybrid Enemy Squish</);
  assert.match(lab, />Final Perfect Squish \+ BOING</);
  assert.match(lab, />Squish Candidate\/Final A\/B</);
  assert.match(lab, />Prior Procedural Propeller</);
  assert.match(lab, />Final Recorded Propeller</);
  assert.match(lab, />Normal Olivia Propeller Flyby</);
  assert.match(lab, />Guacamole-Hit Flyby</);
  assert.match(lab, />Damaged \/ Crashing Propeller</);
  assert.match(lab, /Enemy Families and contact outcomes/);
  assert.match(lab, /SQUISH! BOING!/);
  assert.match(lab, /10 non-perfect squish variants/);
  assert.match(lab, /10 perfect-bounce stress test/);
  assert.match(lab, /12-jump repetition test/);
  assert.match(labRuntime, /playEvent\('combat\.enemySplat'\)/);
  assert.match(labRuntime, /playEvent\('combat\.enemyStomp'\)/);
  assert.match(labRuntime, /button\.dataset\.eventId = eventId/);
  assert.match(labRuntime, /scheduleSequence\('Squish Candidate\/Final A\/B'/);
  assert.match(labRuntime, /audio\.updateLoop\(handle/);
  assert.match(labRuntime, /function runAircraftGuacHitDemo/);
  assert.match(labRuntime, /function runAircraftDamagedDemo/);
  assert.match(labRuntime, /reviewLoopHandles\.has\(propellerHandle\)/);
  assert.match(labRuntime, /stopReviewLoop\(strainHandle\)/);
  assert.match(labRuntime, /scheduleSequence\('Jump repetition test'/);
  for (const category of ["Hero", "Movement", "Ordinary Taco", "Premium Tacos", "Power-Ups", "Piñatas", "Celebrations", "Finale", "UI"]) {
    assert.match(labRuntime, new RegExp(`\\['${category}'`), `Audio Lab includes the ${category} review category`);
  }
  assert.match(lab, /Core Gameplay Demo/);
  assert.doesNotMatch(landingPage, /audio-lab/i, "the private lab is not linked from the landing page");
});

test("keeps every pre-Phase-1 music file byte-identical", async () => {
  const expected = JSON.parse(
    await readFile(new URL("./music-integrity.json", import.meta.url), "utf8"),
  );
  assert.ok(Object.keys(expected).length >= 50, "integrity coverage includes every existing music master");
  for (const [relativePath, expectedHash] of Object.entries(expected)) {
    const bytes = await readFile(new URL(`../${relativePath}`, import.meta.url));
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actualHash, expectedHash, `${relativePath} was not altered or replaced`);
  }
});

test("keeps every remaining level runtime on the shared Phase 3 audio engine", async () => {
  const pages = [
    ["level1-2.html", "level1-2.js"], ["level1-3.html", "level1-3.js"],
    ["level2.html", "level2.js"], ["level2-2.html", "level2-2.js"],
    ["level2-3.html", "level2-3.js"], ["level3.html", "world3.js"],
    ["level3-2.html", "world3.js"], ["level3-3.html", "world3.js"],
  ];
  const catalogSource = await readFile(new URL("../public/game/audio-catalog.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(catalogSource, context, { filename: "audio-catalog.js" });
  const catalog = context.window.JFT_AUDIO_CATALOG;
  const runtimeCache = new Map();
  const semanticLiteral = /['"]((?:ui|hero|collect|combat|ability|checkpoint|pinata|goal|level|world1|vehicle|hazard|impact|movement|sequence|boss|surf|volcano|stage|concert|ride|cosmic|carnival|ambience|review)\.[A-Za-z][A-Za-z0-9.]*)['"]/g;

  for (const [pageName, runtimeName] of pages) {
    const html = await readFile(new URL(`../public/game/${pageName}`, import.meta.url), "utf8");
    const catalogPosition = html.indexOf('src="audio-catalog.js');
    const enginePosition = html.indexOf('src="audio-engine.js');
    const runtimePosition = html.indexOf(`src="${runtimeName}`);
    const expectedCatalogVersion = pageName === "level2-3.html" ? 10 : 9;
    assert.match(
      html,
      new RegExp(`src="audio-catalog\\.js\\?v=${expectedCatalogVersion}"`),
      `${pageName} uses the release catalog cache key`,
    );
    assert.match(html, /src="audio-engine\.js\?v=7"/, `${pageName} uses the release engine cache key`);
    assert.ok(catalogPosition >= 0, `${pageName} loads the audio catalog`);
    assert.ok(enginePosition > catalogPosition, `${pageName} loads the engine after its catalog`);
    assert.ok(runtimePosition > enginePosition, `${pageName} loads the engine before ${runtimeName}`);

    if (!runtimeCache.has(runtimeName)) {
      runtimeCache.set(runtimeName, await readFile(new URL(`../public/game/${runtimeName}`, import.meta.url), "utf8"));
    }
    const runtime = runtimeCache.get(runtimeName);
    assert.doesNotMatch(runtime, /createOscillator\s*\(/, `${runtimeName} has no raw oscillator synthesis`);
    assert.doesNotMatch(runtime, /function\s+sfx\s*\(/, `${runtimeName} has no local sfx function`);
    assert.doesNotMatch(runtime, /function\s+playTone\s*\(/, `${runtimeName} has no local playTone function`);
    assert.doesNotMatch(runtime, /new\s+(?:window\.)?(?:AudioContext|webkitAudioContext)/, `${runtimeName} delegates AudioContext creation`);
    assert.match(runtime, /window\.JFT_AUDIO/, `${runtimeName} uses the shared audio API`);
    assert.match(runtime, /preloadGroups\(\['global', 'world[123]'\]\)/, `${runtimeName} preloads only its world group`);
  }

  for (const [runtimeName, runtime] of runtimeCache) {
    for (const match of runtime.matchAll(semanticLiteral)) {
      assert.ok(catalog.events[match[1]], `${runtimeName} event ${match[1]} exists in the catalog`);
    }
  }

  const world3 = runtimeCache.get("world3.js");
  assert.match(world3, /setMusicDuck\(game\.musicDuck/);
  assert.doesNotMatch(world3, /game\.musicVolume\s*\*\s*game\.musicDuck/);
  assert.match(world3, /perfectBounce \? 'combat\.enemyStomp' : 'combat\.enemySplat'/);

  const worldOneTwo = runtimeCache.get("level1-2.js");
  assert.match(worldOneTwo, /flybyAircraftLoop/);
  assert.match(worldOneTwo, /updateLoop\?\.\(game\.flybyAircraftLoop/);
  assert.match(worldOneTwo, /const dopplerPitch = lerp\(115, -135/);
  assert.match(worldOneTwo, /function syncOliviaSetPieceAircraftAudio/);
  assert.match(worldOneTwo, /ensureTrackedLoop\('ambushAircraftLoop', 'vehicle\.aircraftPropellerIdle'/);
  assert.match(worldOneTwo, /ensureTrackedLoop\('rescuePropellerLoop', 'vehicle\.aircraftPropellerIdle'/);
  assert.match(worldOneTwo, /ensureTrackedLoop\('rescueLoop', 'vehicle\.aircraftDamagedLoop'/);
  assert.match(worldOneTwo, /playAudio\('vehicle\.aircraftApproach', \{ position: -1, variant: 'guac-ambush' \}\)/);
  assert.match(worldOneTwo, /stopTrackedLoop\('rescuePropellerLoop'\); stopTrackedLoop\('rescueLoop'\)/);
  assert.match(worldOneTwo, /guacAmbush: Boolean\(game\.ambushAircraftLoop\)/);
  assert.match(worldOneTwo, /rescuePropeller: Boolean\(game\.rescuePropellerLoop\)/);
  const worldTwoTwo = runtimeCache.get("level2-2.js");
  assert.match(worldTwoTwo, /vehicleType: 'trekker'/, "World 2-2 retains the Taco Trekker vehicle identity");
  assert.doesNotMatch(worldTwoTwo, /vehicle\.aircraftPropellerIdle/, "the Olivia aircraft correction does not fabricate an aircraft in World 2-2");

  const lab = await readFile(new URL("../public/game/audio-lab.html", import.meta.url), "utf8");
  const labRuntime = await readFile(new URL("../public/game/audio-lab.js", import.meta.url), "utf8");
  for (const label of ["Power-Up Demo", "Enemy Stomp Combo Demo", "Olivia Vehicle Taco Drop Demo", "Boss Combat Demo", "Piñata Celebration Demo", "World 3 Cosmic Finale Demo"]) {
    assert.match(lab, new RegExp(label));
  }
  assert.match(labRuntime, /audio\.listEvents\(\)/);
  assert.match(labRuntime, /vehicleType/);
  assert.match(labRuntime, /bossType/);
  const dynamicNamespaces = new Set(["boss.elGuacodillo", "vehicle.cosmic"]);
  for (const match of labRuntime.matchAll(semanticLiteral)) {
    if (dynamicNamespaces.has(match[1])) continue;
    assert.ok(catalog.events[match[1]], `Audio Lab event ${match[1]} exists in the catalog`);
  }
});
