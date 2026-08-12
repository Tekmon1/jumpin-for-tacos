(() => {
  const SOURCE_VERSION = 'w1-2-v27';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  const heroCore = window.JFT_HERO_CORE;
  const heroPhysics = heroCore.physics;

  const ui = {
    startOverlay: document.getElementById('startOverlay'), winOverlay: document.getElementById('winOverlay'), settingsOverlay: document.getElementById('settingsOverlay'),
    startBtn: document.getElementById('startBtn'), restartBtn: document.getElementById('restartBtn'), playAgainBtn: document.getElementById('playAgainBtn'),
    muteBtn: document.getElementById('muteBtn'), settingsBtn: document.getElementById('settingsBtn'), closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    musicVolume: document.getElementById('musicVolume'), musicVolumeValue: document.getElementById('musicVolumeValue'),
    effectsVolume: document.getElementById('effectsVolume'), effectsVolumeValue: document.getElementById('effectsVolumeValue'), reducedShake: document.getElementById('reducedShake'),
    personalBestText: document.getElementById('personalBestText'), medalBadge: document.getElementById('medalBadge'),
    resultScore: document.getElementById('resultScore'), resultTime: document.getElementById('resultTime'), resultTacos: document.getElementById('resultTacos'),
    resultSplats: document.getElementById('resultSplats'), resultAirMail: document.getElementById('resultAirMail'), resultRescue: document.getElementById('resultRescue'), resultPlane: document.getElementById('resultPlane'),
    winText: document.getElementById('winText'), newBestText: document.getElementById('newBestText'),
  };

  const WORLD_WIDTH = 33600;
  const GROUND_Y = 460;
  const CRASH_SITE_X = 33020;
  const OPENING_TIMING = Object.freeze({
    waveEnd: 3.25, boardEnd: 4.45, followStart: 6.2, followFull: 7.8,
    taxiEnd: 10.55, yahooAt: 11.6, climbEnd: 13.4, returnStart: 13.75, planeExit: 14.75, complete: 16.2,
  });
  const FIRST_FLYBY_CORRIDOR = Object.freeze({ start: 8900, end: 11650 });
  const sections = [
    { id: 'airfield', name: 'Olivia’s Questionable Airfield', start: 0, end: 4600, music: 'departure', accent: '#ffd65a' },
    { id: 'cruise', name: 'Easy-Peasy Desert Cruise', start: 4600, end: 10400, music: 'cruise', accent: '#65d8ff' },
    { id: 'banner', name: 'The Banner Flyby', start: 10400, end: 16400, music: 'banner', accent: '#ff6fae' },
    { id: 'high-desert', name: 'High Desert Taco Trail', start: 16400, end: 22400, music: 'cruise', accent: '#ffd65a' },
    { id: 'ambush', name: 'Flying Guacamole Ambush', start: 22400, end: 27000, music: 'ambush', accent: '#9bef70' },
    { id: 'rescue', name: 'Turbo Rescue Run', start: 27000, end: 32200, music: 'rescue', accent: '#ff8d57' },
    { id: 'fiesta', name: 'Emergency Landing Fiesta', start: 32200, end: WORLD_WIDTH, music: 'fiesta', accent: '#b78cff' },
  ];
  const checkpointDefs = [
    { x: 5200, name: 'Windsock Kiosk', sign: 'PILOT STATUS: EXTREMELY OLIVIA.', radio: 'Altitude good. Snackitude excellent. El Guacodillo remains dramatically earthbound.', look: 0, accent: '#65d8ff' },
    { x: 11200, name: 'Banner Control', sign: 'AIRSPACE MAY CONTAIN SASS.', radio: 'The banner is tasteful. El Guacodillo will pretend not to read it.', look: 1, accent: '#ff6fae' },
    { x: 18700, name: 'Radio Tower', sign: 'WATCH FOR LOW-FLYING TACOS.', radio: 'Everything is under control, assuming the controls work and no one weaponizes guacamole.', look: 2, accent: '#ffd65a' },
    { x: 25100, name: 'Baggage & Guac Alert', sign: 'FLYING GUACAMOLE: SUSPICIOUSLY LIKELY.', radio: 'El Guacodillo is off radar. That is somehow more concerning.', look: 3, accent: '#9bef70' },
    { x: 28400, name: 'Emergency Taco Fuel', sign: 'RUNWAY AHEAD. PROBABLY.', radio: 'I can see the landing spot! It is getting larger very quickly.', look: 4, accent: '#ff8d57' },
  ];
  const checkpointArtFrames = Object.freeze([
    Object.freeze({ sx: 49, sy: 56, sw: 317, sh: 561 }),
    Object.freeze({ sx: 465, sy: 119, sw: 371, sh: 494 }),
    Object.freeze({ sx: 836, sy: 51, sw: 322, sh: 568 }),
    Object.freeze({ sx: 44, sy: 698, sw: 302, sh: 462 }),
    Object.freeze({ sx: 478, sy: 731, sw: 358, sh: 429 }),
    Object.freeze({ sx: 836, sy: 785, sw: 380, sh: 377 }),
  ]);
  const checkpointPadLooks = Object.freeze([
    Object.freeze({ surface: '#2f5360', edge: '#65d8ff', stripe: '#ffd65a', lights: '#65d8ff' }),
    Object.freeze({ surface: '#7d3f55', edge: '#ff6fae', stripe: '#fff1a6', lights: '#ff6fae' }),
    Object.freeze({ surface: '#615038', edge: '#ffd65a', stripe: '#2d8795', lights: '#ffd65a' }),
    Object.freeze({ surface: '#263d3c', edge: '#9bef70', stripe: '#ff8d57', lights: '#9bef70' }),
    Object.freeze({ surface: '#31374e', edge: '#ff8d57', stripe: '#65d8ff', lights: '#ff8d57' }),
  ]);
  const planeThrowArmFrames = Object.freeze([
    Object.freeze({ sx: 48, sy: 405, sw: 170, sh: 150 }),
    Object.freeze({ sx: 560, sy: 416, sw: 303, sh: 128 }),
    Object.freeze({ sx: 1072, sy: 406, sw: 362, sh: 148 }),
    Object.freeze({ sx: 1584, sy: 418, sw: 353, sh: 124 }),
  ]);
  const enemySpriteArt = Object.freeze({
    tomato: 'world1_2_tomato_trouble_aviator_sheet_v1',
    onion: 'world1_2_onion_drama_aviator_sheet_v1',
    jalapeno: 'world1_2_jalapeno_popper_aviator_sheet_v1',
    chili: 'world1_2_chili_bandit_aviator_sheet_v1',
    lime: 'world1_2_lime_aviator_sheet_v1',
    queso: 'world1_2_queso_cadet_sheet_v1',
  });
  const crashCrew = Object.freeze([
    Object.freeze({ frame: 0, role: 'firefighter', offset: -415, scale: .95, phase: .3 }),
    Object.freeze({ frame: 1, role: 'mechanic', offset: -330, scale: .9, phase: 1.4 }),
    Object.freeze({ frame: 2, role: 'radio', offset: -248, scale: .86, phase: 2.2 }),
    Object.freeze({ frame: 3, role: 'medic', offset: 250, scale: .88, phase: 3.1 }),
    Object.freeze({ frame: 4, role: 'spectator', offset: 338, scale: .9, phase: 4.2, sign: 'GUAC ATTACK 0|TACOS 1', accent: '#ff8d57' }),
    Object.freeze({ frame: 5, role: 'official', offset: 424, scale: .94, phase: 5.1, sign: 'OLIVIA|NAILED-ISH IT', accent: '#65d8ff' }),
  ]);
  const bannerJokes = [
    ['PROBABLY A LICENSED', 'PILOT'],
    ['ASK ME ABOUT', 'AIRBORNE TACOS'],
    ['THIS SEEMED EASIER', 'ON YOUTUBE'],
    ['OLIVIA AIRWAYS', 'SNACKS GUARANTEED'],
    ['EL GUACODILLO', 'CAN’T EVEN FLY!'],
  ];
  const flybyDefs = [
    { id: 'banner-one', trigger: 9400, direction: -1, inverted: false, intro: 'OLIVIA BANNER FLYBY INCOMING!', text: null },
    {
      id: 'banner-two', trigger: 13300, direction: 1, inverted: false, tacoDrop: true,
      dropStart: 2.25, dropEnd: 5.55, dropInterval: .3,
      intro: 'OLIVIA AIRWAYS TACO DROP INCOMING!', text: ['AIR MAIL? NOPE.', 'TACO DROP!'],
    },
    { id: 'inverted', trigger: 17700, direction: -1, inverted: true, intro: 'WAIT... IS THE PLANE UPSIDE DOWN?!', text: ['INVERTED. TOTALLY NORMAL.', 'TACOS STILL UPRIGHT.'] },
  ];
  const SKY_COMBAT_END = 22400;
  const skyPilotGroundPlan = Object.freeze([
    { id: 'sky-airfield-chili-pack', anchorX: 920, type: 'chili', count: 2, section: 'airfield', purpose: 'Teach a calm two-stomp runway rhythm after the opening flight.' },
    { id: 'sky-airfield-tomato-pack', anchorX: 1900, type: 'tomato', count: 2, section: 'airfield', purpose: 'Introduce rolling tomatoes with room to jump over the pack.' },
    { id: 'sky-airfield-onion-pack', anchorX: 2860, type: 'onion', count: 2, section: 'airfield', purpose: 'Turn the long runway into a readable hop-and-bounce lesson.' },
    { id: 'sky-airfield-jalapeno-pack', anchorX: 3600, type: 'jalapeno', count: 2, section: 'airfield', purpose: 'Close the airfield with a forgiving leap pattern.' },
    { id: 'sky-cruise-tomato-pack', anchorX: 6000, type: 'tomato', count: 2, section: 'cruise', purpose: 'Keep the easy desert cruise active without crowding the checkpoint.' },
    { id: 'sky-cruise-chili-pack', anchorX: 7200, type: 'chili', count: 2, section: 'cruise', purpose: 'Make the first open-sky stretch reward a clean jump or stomp.' },
    { id: 'sky-cruise-onion-pack', anchorX: 8200, type: 'onion', count: 2, section: 'cruise', purpose: 'Prepare the player for the quiet flyby corridor ahead.' },
    { id: 'sky-banner-tomato-pack', anchorX: 11750, type: 'tomato', count: 2, section: 'banner', purpose: 'Reintroduce ground pressure after the first flyby.' },
    { id: 'sky-banner-onion-pack', anchorX: 12650, type: 'onion', count: 2, section: 'banner', purpose: 'Make the banner route readable beneath Olivia’s return pass.' },
    { id: 'sky-banner-jalapeno-pack', anchorX: 13550, type: 'jalapeno', count: 2, section: 'banner', purpose: 'Add a compact leap challenge without blocking the runway.' },
    { id: 'sky-banner-lime-pack', anchorX: 14550, type: 'lime', count: 2, section: 'banner', purpose: 'Showcase the aviation lime family in a same-type formation.' },
    { id: 'sky-banner-chili-pack', anchorX: 15550, type: 'chili', count: 2, section: 'banner', purpose: 'Finish the banner act with a clean charge-and-stomp beat.' },
    { id: 'sky-highdesert-chili-pack', anchorX: 16900, type: 'chili', count: 2, section: 'high-desert', purpose: 'Open the high-desert route with a confident readable pair.' },
    { id: 'sky-highdesert-onion-pack', anchorX: 17800, type: 'onion', count: 2, section: 'high-desert', purpose: 'Create a gentle hop chain before the radio tower.' },
    { id: 'sky-highdesert-jalapeno-pack', anchorX: 19500, type: 'jalapeno', count: 2, section: 'high-desert', purpose: 'Make the long mesa stretch feel authored rather than empty.' },
    { id: 'sky-highdesert-queso-pack', anchorX: 20350, type: 'queso', count: 2, section: 'high-desert', purpose: 'Introduce the queso cadet family before the piñata landmark.' },
    { id: 'sky-highdesert-chili-finale-pack', anchorX: 21850, type: 'chili', count: 2, section: 'high-desert', purpose: 'End combat cleanly before the guacamole ambush set piece.' },
  ]);
  const skyPilotUpperPlan = Object.freeze([
    { id: 'sky-cruise-wing-sentry', anchorX: 4990, type: 'tomato', count: 2, role: 'platform-sentry', section: 'cruise', purpose: 'Make the first high wing a discoverable risk-reward landing.' },
    { id: 'sky-cruise-moving-guard', anchorX: 5920, type: 'onion', count: 2, role: 'moving-guard', section: 'cruise', purpose: 'Turn the first vertical-moving ledge into a timing test.' },
    { id: 'sky-cruise-jalapeno-champion', anchorX: 6850, type: 'jalapeno', count: 1, role: 'champion', section: 'cruise', purpose: 'Place a premium target above the open desert road.' },
    { id: 'sky-cruise-chili-helper', anchorX: 7780, type: 'chili', count: 2, role: 'route-helper', section: 'cruise', purpose: 'Give the player a forgiving bounce route toward the flyby.' },
    { id: 'sky-cruise-tomato-champion', anchorX: 8245, type: 'tomato', count: 1, role: 'champion', section: 'cruise', purpose: 'Reward the final upper landing before the quiet corridor.' },
    { id: 'sky-banner-onion-sentry', anchorX: 11720, type: 'onion', count: 2, role: 'platform-sentry', section: 'banner', purpose: 'Make the post-flyby upper route visible through enemy grouping.' },
    { id: 'sky-banner-chili-champion', anchorX: 12650, type: 'chili', count: 1, role: 'champion', section: 'banner', purpose: 'Offer a premium stomp after the return pass begins.' },
    { id: 'sky-banner-jalapeno-moving-guard', anchorX: 13580, type: 'jalapeno', count: 2, role: 'moving-guard', section: 'banner', purpose: 'Make a moving wing platform worth waiting for.' },
    { id: 'sky-banner-lime-sentry', anchorX: 14510, type: 'lime', count: 2, role: 'platform-sentry', section: 'banner', purpose: 'Give the upper route its own aviation enemy identity.' },
    { id: 'sky-banner-onion-champion', anchorX: 15440, type: 'onion', count: 1, role: 'champion', section: 'banner', purpose: 'Cap the banner act with a high-value stomp target.' },
    { id: 'sky-mesa-onion-sentry', anchorX: 16790, type: 'onion', count: 2, role: 'platform-sentry', section: 'high-desert', purpose: 'Start the mesa route with a readable elevated pair.' },
    { id: 'sky-mesa-chili-moving-guard', anchorX: 17720, type: 'chili', count: 1, role: 'moving-guard', section: 'high-desert', purpose: 'Turn the moving mesa ledge into a deliberate pause point.' },
    { id: 'sky-mesa-queso-helper', anchorX: 19115, type: 'queso', count: 2, role: 'route-helper', section: 'high-desert', purpose: 'Make the high desert bounce route feel playful and forgiving.' },
    { id: 'sky-mesa-jalapeno-champion', anchorX: 20510, type: 'jalapeno', count: 1, role: 'champion', section: 'high-desert', purpose: 'Place the final premium upper target before the piñata.' },
    { id: 'sky-mesa-tomato-moving-guard', anchorX: 21440, type: 'tomato', count: 2, role: 'moving-guard', section: 'high-desert', purpose: 'Close the optional sky route before the guacamole warning.' },
  ]);
  const landingQuips = [
    'OLIVIA: “THE LANDING WAS FINE. THE GROUND WAS RUDE.”',
    'OLIVIA: “FIVE-STAR FLIGHT. ONE-STAR GUACAMOLE.”',
    'OLIVIA: “GOOD NEWS: THE TACOS HAD THEIR SEATBELTS ON.”',
    'OLIVIA: “FLYING GUACAMOLE. NOT IN THE FORECAST.”',
  ];
  const tracks = {
    departure: document.getElementById('musicDeparture'), cruise: document.getElementById('musicCruise'), banner: document.getElementById('musicBanner'),
    ambush: document.getElementById('musicAmbush'), rescue: document.getElementById('musicRescue'), fiesta: document.getElementById('musicFiesta'),
  };
  const allTracks = Object.values(tracks);
  // Per-arrangement trims compensate for the mastered loudness difference
  // between files so a crossfade does not create a perceived volume jump.
  const musicMixLevels = Object.freeze({ departure: 1.1, cruise: .9, banner: 1, ambush: .87, rescue: .87, fiesta: .96 });
  const musicCrossfadeDurations = Object.freeze({
    'departure>cruise': 2.8, 'cruise>banner': 2.35, 'banner>cruise': 2.5,
    'cruise>ambush': 2.15, 'ambush>rescue': 2.35, 'rescue>fiesta': 2.9,
  });
  const sharedAbilities = window.JFT_SHARED_ABILITIES;
  const images = {};
  const keys = { left: false, right: false, jump: false, lastDir: 1 };
  const inputSources = {
    keyboard: { left: false, right: false, jump: false },
    controller: { left: false, right: false, jump: false },
    touch: { left: new Set(), right: new Set(), jump: new Set() },
  };
  const world = { platforms: [], collectibles: [], enemies: [], checkpoints: [], pinata: null, goal: { x: 33170, y: 300, w: 120, h: 160 } };
  const player = { x: 140, y: 370, previousY: 370, w: 34, h: 42, vx: 0, vy: 0, dir: 1, grounded: false, platform: null, anim: 0, coyote: 0, jumpBuffer: 0, invulnerable: 0, rotation: 0, scale: 1 };
  const game = {
    state: 'title', score: 0, collected: 0, totalTacos: 0, defeated: 0, totalEnemies: 0, hearts: 3,
    sectionIndex: 0, cameraX: 0, levelTime: 0, startTime: 0, finishTime: 0, latestCheckpoint: null,
    message: '', messageTimer: 0, radioQueue: '', radioDelay: 0, abilities: sharedAbilities.createState(),
    openingTimer: 0, openingComplete: false, flybys: [],
    ambush: { stage: 0, timer: 0, projectile: 0, hitFlash: 0, musicDrop: 0 }, rescueActive: false, rescuePhase: -1, crashLanded: false, crashTimer: 0,
    skyStreak: { count: 0, best: 0, timer: 0, decayTimer: 0 }, airMail: 0, airMailTotal: 5, airMailComplete: false, landingQuip: '',
    particles: [], confetti: [], fireworks: [], impactTexts: [], pinataBurst: null, cameraShake: 0, hitStop: 0, celebrationTime: 0, partyBeat: -1,
    splatCombo: 0, splatTimer: 0, bestSplat: 0, respawn: heroCore.createRespawnState(),
    muted: false, musicVolume: .7, effectsVolume: .8, reducedShake: false, settingsOpen: false,
    activeMusic: null, musicTransition: null, musicTransitionCount: 0, musicRetargets: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
    personalBest: { score: 0, time: 0, runs: 0, medal: '' },
    routeMaxGap: 0, platformOverlapCount: 0, elevatedMaxGap: 0, unreachablePlatforms: 0,
    inputResetCount: 0, lastInputResetReason: 'none', landingRecoveries: 0, controlStallTimer: 0, controllerStateSyncs: 0, controllerStateSequence: 0, controllerQaResetDone: false, tacoOverlapCount: 0, tacoDuplicatesRemoved: 0,
    flybyCorridorMaxGap: 0, flybyCorridorEnemies: 0, effectsTrimmed: 0, lastCollectSfxAt: -1,
    checkpointsGrounded: 0, airDrop: { spawned: 0, caught: 0 },
    respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null,
  };
  const world1Background = window.JFT_WORLD1_BACKGROUNDS.create({
    levelId: '1-2', canvas, ctx, worldWidth: WORLD_WIDTH, groundY: GROUND_Y,
  });
  let audioContext = null;
  let lastFrame = 0;
  let seed = 0x51A2BEEF;
  const params = new URLSearchParams(location.search);
  const qa = location.hostname === 'terminal.local';
  const previewStart = qa ? Number(params.get('startX') || 0) : 0;
  const previewAutoRun = qa && params.get('autoRun') === '1';
  const previewEvent = qa ? params.get('event') || '' : '';
  const previewOpeningAt = qa ? Number(params.get('openingAt') || 0) : 0;
  const previewSkipOpening = qa && (params.get('skipOpening') === '1' || previewStart > 500 || previewEvent);
  const previewControllerQa = qa && params.get('controllerQa') === '1';
  const previewRespawn = qa && params.get('respawn') === '1';
  const previewRespawnCheckpoint = qa ? Number(params.get('respawnCheckpoint') || -1) : -1;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const currentSection = (x = player.x) => sections.find((section) => x >= section.start && x < section.end) || sections[sections.length - 1];
  const formatTime = (seconds) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.round(Math.max(0, seconds)) % 60).padStart(2, '0')}`;
  const firstFlybyActive = () => Boolean(game.flybys?.[0]?.started && !game.flybys[0].finished);

  function syncInputs() {
    keys.left = inputSources.keyboard.left || inputSources.controller.left || inputSources.touch.left.size > 0;
    keys.right = inputSources.keyboard.right || inputSources.controller.right || inputSources.touch.right.size > 0;
    keys.jump = inputSources.keyboard.jump || inputSources.controller.jump || inputSources.touch.jump.size > 0;
  }

  function setDigitalInput(source, input, down, pointerId = null) {
    if (!['left', 'right', 'jump'].includes(input) || !inputSources[source]) return;
    if (source === 'touch') {
      const pointers = inputSources.touch[input];
      if (down) pointers.add(pointerId); else pointers.delete(pointerId);
    } else inputSources[source][input] = down;
    if (down && (input === 'left' || input === 'right')) keys.lastDir = input === 'right' ? 1 : -1;
    if (down && input === 'jump') player.jumpBuffer = heroPhysics.jumpBufferTime;
    syncInputs();
  }

  function clearInputs(reason = 'reset') {
    ['left', 'right', 'jump'].forEach((input) => { inputSources.keyboard[input] = false; inputSources.controller[input] = false; });
    Object.values(inputSources.touch).forEach((pointers) => pointers.clear());
    keys.left = false; keys.right = false; keys.jump = false; keys.lastDir = 1; player.jumpBuffer = 0;
    game.inputResetCount += 1; game.lastInputResetReason = reason;
  }

  function addPlatform(data) {
    const platform = { id: data.id || `sky-platform-${world.platforms.length + 1}`, dx: 0, dy: 0, ...data };
    if (platform.moving) { platform.baseX = platform.x; platform.baseY = platform.y; }
    world.platforms.push(platform); return platform;
  }

  function addItem(x, y, type = 'taco', extra = {}) {
    const large = type === 'magnet' || type === 'airmail';
    world.collectibles.push({ x, y, w: large ? 30 : 24, h: large ? 34 : 24, type, bob: random() * Math.PI * 2, collected: false, ...extra });
  }

  function addLine(x, y, count, gap = 48, extra = {}) { for (let i = 0; i < count; i += 1) addItem(x + i * gap, y, 'taco', { bob: i * .4, ...extra }); }
  function addArc(x, y, count, gap = 42, height = 72, extra = {}) {
    for (let i = 0; i < count; i += 1) { const t = i / Math.max(1, count - 1); addItem(x + i * gap, y - Math.sin(t * Math.PI) * height, 'taco', { bob: t * 2.4, ...extra }); }
  }

  function cleanTacoLayout() {
    const buckets = new Map(); const cleaned = []; let removed = 0;
    const nearby = (item) => {
      const bx = Math.floor(item.x / 24); const by = Math.floor(item.y / 24);
      for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
        const matches = buckets.get(`${bx + dx}:${by + dy}`) || [];
        if (matches.some((other) => Math.hypot(item.x - other.x, item.y - other.y) < 22)) return true;
      }
      const key = `${bx}:${by}`; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(item); return false;
    };
    world.collectibles.forEach((item) => {
      if (item.type !== 'taco' || item.bonusReward || item.dynamic) { cleaned.push(item); return; }
      if (nearby(item)) removed += 1; else cleaned.push(item);
    });
    world.collectibles = cleaned; game.tacoDuplicatesRemoved = removed; game.tacoOverlapCount = 0;
  }

  function buildGround(start, end, style, lengths, gaps) {
    let x = start; let index = 0;
    while (x < end - 20) {
      const w = Math.min(lengths[index % lengths.length], end - x);
      addPlatform({ x, y: GROUND_Y, w, h: 100, ground: true, mainRoute: true, style });
      const gap = x + w >= end ? 0 : gaps[index % gaps.length];
      x += w + gap; index += 1;
    }
  }

  function buildWorld() {
    seed = 0x51A2BEEF;
    world.platforms = []; world.collectibles = []; world.enemies = []; world.pinata = null;
    world.checkpoints = heroCore.createCheckpointSet(checkpointDefs, {
      defaults: { y: GROUND_Y - 142, w: 176, h: 142 },
    });

    addPlatform({ x: 0, y: GROUND_Y, w: 4600, h: 100, ground: true, mainRoute: true, style: 'runway' });
    buildGround(4600, 10400, 'sunny-soil', [860, 740, 920, 680], [72, 94, 82, 104]);
    buildGround(10400, 16400, 'banner-soil', [760, 940, 700, 880], [86, 76, 102, 92]);
    buildGround(16400, 22400, 'mesa-soil', [820, 720, 960, 680], [98, 82, 106, 74]);
    addPlatform({ x: 22400, y: GROUND_Y, w: 4600, h: 100, ground: true, mainRoute: true, style: 'guac-road' });
    addPlatform({ x: 27000, y: GROUND_Y, w: WORLD_WIDTH - 27000, h: 100, ground: true, mainRoute: true, style: 'rescue-runway', rescueRoad: true });

    const upperSections = sections.slice(1, 5);
    upperSections.forEach((section, sectionIndex) => {
      let index = 0;
      for (let x = section.start + 390; x < section.end - 250; x += 465, index += 1) {
        // Every ledge is inside the normal jump rise. The slightly taller
        // ledges also receive a clearly marked bounce-helper enemy below.
        const y = [360, 344, 330, 352, 320, 338][(index + sectionIndex) % 6];
        addPlatform({
          x, y, w: 220 + (index % 3) * 18, h: 25, style: section.id === 'banner' ? 'wing' : section.id === 'ambush' ? 'guac-sign' : 'adobe-ledge',
          moving: index % 4 === 2, axis: 'y', range: index % 4 === 2 ? 10 : 0,
          speed: 1 + index % 3 * .12, phase: index * .71, accessible: true,
        });
      }
    });

    // Six optional step-up ledges give the easy route more height and visual
    // rhythm. Each sits directly above an already proven platform, so the
    // lower route remains untouched and the extra taco rows never demand a
    // precision jump or an enemy bounce.
    const scenicTargets = [6100, 8200, 12500, 15000, 17300, 19900];
    const scenicBases = new Set();
    scenicTargets.forEach((target, index) => {
      const base = world.platforms
        .filter((platform) => !platform.ground && platform.accessible && !scenicBases.has(platform))
        .sort((a, b) => Math.abs(a.x + a.w / 2 - target) - Math.abs(b.x + b.w / 2 - target))[0];
      if (!base || Math.abs(base.x + base.w / 2 - target) > 360) return;
      scenicBases.add(base);
      const width = 166 + index % 2 * 14;
      addPlatform({
        x: base.x + (base.w - width) / 2 + (index % 2 ? 12 : -10), y: base.y - 74, w: width, h: 23,
        style: base.style, accessible: true, scenicStep: true, accessBase: base,
      });
    });

    // A checkpoint only counts as supported when its entire illustrated
    // footprint rests on one ground segment. Any partial support is replaced
    // by a wide foundation so no checkpoint can straddle a terrain seam.
    world.checkpoints.forEach((checkpoint) => {
      const left = checkpoint.x - 102; const right = checkpoint.x + 102;
      let support = world.platforms.find((platform) => platform.ground && left >= platform.x && right <= platform.x + platform.w);
      if (!support) {
        const section = currentSection(checkpoint.x); const style = section.id === 'rescue' ? 'rescue-runway' : section.id === 'ambush' ? 'guac-road' : section.id === 'banner' ? 'banner-soil' : section.id === 'high-desert' ? 'mesa-soil' : 'sunny-soil';
        support = addPlatform({ x: checkpoint.x - 190, y: GROUND_Y, w: 380, h: 100, ground: true, mainRoute: true, checkpointPad: true, checkpointFoundation: true, style });
      }
      checkpoint.support = support; checkpoint.grounded = true;
    });

    // A dedicated, harmless three-stomp piñata sits on guaranteed ground just
    // before the guacamole ambush. It never blocks the easy lower route.
    const pinataX = 21280;
    let pinataSupport = world.platforms.find((platform) => platform.ground && pinataX > platform.x + 120 && pinataX < platform.x + platform.w - 120);
    if (!pinataSupport) pinataSupport = addPlatform({ x: pinataX - 250, y: GROUND_Y, w: 500, h: 100, ground: true, mainRoute: true, checkpointPad: true, style: 'mesa-soil' });
    world.pinata = { x: pinataX, y: GROUND_Y - 88, w: 70, h: 88, hits: 0, targetHits: 3, broken: false, wobble: 0, hitCooldown: 0 };

    // Olivia's first flyby is a sightseeing beat, so its entire on-foot
    // corridor gets continuous ground. These small seamless joins remove the
    // two ordinary desert gaps that previously sat directly under the flyby.
    const flybyGround = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    for (let index = 0; index < flybyGround.length - 1; index += 1) {
      const from = flybyGround[index]; const to = flybyGround[index + 1]; const gapStart = from.x + from.w; const gap = to.x - gapStart;
      if (gap <= 0 || gapStart < FIRST_FLYBY_CORRIDOR.start || to.x > FIRST_FLYBY_CORRIDOR.end) continue;
      addPlatform({ x: gapStart - 10, y: GROUND_Y, w: gap + 20, h: 100, ground: true, mainRoute: true, checkpointPad: true, flybySafety: true, style: 'banner-soil' });
    }

    for (const platform of world.platforms) {
      if (platform.checkpointPad) continue;
      const gap = platform.ground ? 56 : 46; const count = Math.max(3, Math.floor((platform.w - 52) / gap) + 1);
      addLine(platform.x + 26, platform.y - (platform.ground ? 42 : 40), count, gap, { lane: platform.ground ? 'ground-row' : 'platform-row' });
      if (platform.moving) {
        world.collectibles.slice(-count).forEach((item) => { item.ridePlatform = platform; item.rideOffsetX = item.x - platform.x; item.rideOffsetY = item.y - platform.y; });
      }
    }
    world.platforms.filter((platform) => platform.scenicStep && platform.accessBase).forEach((platform) => {
      addArc(platform.x - 26, platform.accessBase.y - 43, 7, 34, 70, { lane: 'scenic-step-arc' });
    });
    const ground = world.platforms.filter((p) => p.ground).sort((a, b) => a.x - b.x);
    for (let i = 0; i < ground.length - 1; i += 1) {
      const from = ground[i]; const to = ground[i + 1]; const gap = to.x - (from.x + from.w);
      if (gap > 15 && gap < 140) addArc(from.x + from.w - 28, GROUND_Y - 46, 6, (gap + 58) / 5, 64, { lane: 'jump-arc' });
    }
    // Magnet cascades stay outside the first two flyby entrances so the plane,
    // music transition, taco pull, Frenzy, and confetti cannot all begin on the
    // same mobile frame.
    [3800, 6800, 16450, 21100, 27800].forEach((x) => addItem(x, 385, 'magnet'));

    // Five optional Air Mail detours are placed on proven platforms (or the
    // obstacle-free rescue road), so every envelope is reachable without a
    // precision jump.
    [7150, 13150, 19150, 24500].forEach((target, index) => {
      const platform = world.platforms.filter((item) => !item.ground && item.accessible).sort((a, b) => Math.abs(a.x + a.w / 2 - target) - Math.abs(b.x + b.w / 2 - target))[0];
      if (!platform) return; const x = platform.x + platform.w / 2 - 15; addItem(x, platform.y - 72, 'airmail', { mailIndex: index + 1 }); addArc(x - 104, platform.y - 46, 7, 34, 58, { lane: 'air-mail-arc' });
    });
    addItem(30120, 365, 'airmail', { mailIndex: 5 }); addArc(29970, 402, 10, 34, 82, { lane: 'air-mail-arc' });

    // A small cast keeps the level easy; every enemy is now a whimsical taco
    // ingredient and inherits one of World 1-1's readable behavior archetypes.
    const enemyTypes = ['tomato', 'onion', 'jalapeno', 'chili', 'lime', 'queso'];
    let enemyIndex = 0;
    for (const platform of ground) {
      if (platform.x >= 22400 || platform.w < 520) continue;
      for (let x = platform.x + 330; x < platform.x + platform.w - 160; x += 760) {
        if (checkpointDefs.some((checkpoint) => Math.abs(checkpoint.x - x) < 260)) continue;
        if (world.pinata && Math.abs(world.pinata.x - x) < 300) continue;
        addEnemy(x, platform.y - 46, enemyTypes[enemyIndex % enemyTypes.length], platform); enemyIndex += 1;
      }
    }
    // Optional bounce friends beneath the highest ledges.
    world.platforms.filter((p) => !p.ground && p.y <= 330).forEach((platform, index) => {
      const targetX = platform.x + 70;
      const support = ground.find((p) => targetX > p.x && targetX < p.x + p.w)
        || ground.slice().sort((a, b) => Math.abs(a.x + a.w / 2 - targetX) - Math.abs(b.x + b.w / 2 - targetX))[0];
      if (!support) return;
      const helperX = clamp(targetX, support.x + 24, support.x + support.w - 72);
      const existing = world.enemies.find((enemy) => Math.abs(enemy.x - helperX) < 90);
      if (existing) { existing.bounceHelper = true; existing.targetPlatform = platform; }
      else addEnemy(helperX, support.y - 46, enemyTypes[(index + 2) % enemyTypes.length], support, { bounceHelper: true, targetPlatform: platform });
    });
    // Easy three-enemy trampoline spectacles. The ordinary ground remains open
    // below and helper enemies are forgiving even if contacted off-center.
    [7350, 14850, 20450].forEach((center, groupIndex) => {
      const support = ground.find((p) => center > p.x + 170 && center + 220 < p.x + p.w - 120); if (!support) return;
      for (let step = 0; step < 3; step += 1) addEnemy(center + step * 92, support.y - 46, enemyTypes[(groupIndex + step + 1) % enemyTypes.length], support, { bounceHelper: true, trampolineGroup: groupIndex });
      addArc(center - 10, 365, 9, 36, 122, { lane: 'enemy-bounce-arc' });
    });
    // A guaranteed five-ingredient runway chain teaches both new payoff tiers:
    // the second stomp pops confetti and the fifth lands the mega celebration.
    const megaChainStart = 3300;
    const megaChainSpacing = 230;
    const megaChainEnd = megaChainStart + 4 * megaChainSpacing + 48;
    const megaSupport = ground.find((platform) => megaChainStart >= platform.x + 80 && megaChainEnd <= platform.x + platform.w - 80);
    if (megaSupport) {
      world.enemies = world.enemies.filter((enemy) => enemy.x < megaChainStart - 100 || enemy.x > megaChainEnd + 100);
      for (let step = 0; step < 5; step += 1) {
        const enemyX = megaChainStart + step * megaChainSpacing;
        addEnemy(enemyX, megaSupport.y - 46, enemyTypes[step], megaSupport, {
          bounceHelper: true, trampolineGroup: 'mega-runway', minX: enemyX - 18, maxX: enemyX + 18,
        });
      }
      addArc(megaChainStart - 24, 365, 21, megaChainSpacing / 2, 126, { lane: 'mega-enemy-bounce-arc' });
    }
    world.enemies = world.enemies.filter((enemy) => enemy.x < sections[4].start && (enemy.x < FIRST_FLYBY_CORRIDOR.start || enemy.x > FIRST_FLYBY_CORRIDOR.end));
    // The sightseeing flyby and late guac/rescue corridors intentionally have
    // no enemies. Any tall ledge that lost its bounce helper is lowered just
    // enough to remain reachable with the shared normal jump.
    world.platforms.filter((platform) => !platform.ground && !platform.scenicStep).forEach((platform) => {
      const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
      const requiredRise = GROUND_Y - (platform.y - verticalRange);
      const bounceEnemy = world.enemies.find((enemy) => enemy.targetPlatform === platform || Math.abs(enemy.x - (platform.x + 70)) < 110);
      if (requiredRise <= heroPhysics.normalJumpRise + 1 || bounceEnemy) return;
      const oldY = platform.y;
      const reachableY = GROUND_Y - heroPhysics.normalJumpRise + verticalRange + 1;
      if (reachableY <= oldY) return;
      platform.y = reachableY;
      if (platform.moving) platform.baseY = reachableY;
      const deltaY = reachableY - oldY;
      world.collectibles.forEach((item) => {
        if (item.ridePlatform || item.x + item.w < platform.x || item.x > platform.x + platform.w) return;
        if (item.y >= oldY - 125 && item.y <= oldY + 24) item.y += deltaY;
      });
    });
    world.collectibles = world.collectibles.filter((item) => item.type !== 'tacoCoin');
    // The original seed above keeps the established Sky-High geometry and
    // cinematic landmarks intact. The authored pilot below replaces its
    // broad singleton enemy pass with deliberate, platform-bound encounters.
    applySkyPilotRemaster();
    cleanTacoLayout();

    world.platforms.sort((a, b) => a.x - b.x);
    let coveredTo = 0; let maxGap = 0;
    world.platforms.filter((p) => p.mainRoute).forEach((p) => { maxGap = Math.max(maxGap, p.x - coveredTo); coveredTo = Math.max(coveredTo, p.x + p.w); });
    game.routeMaxGap = Math.round(maxGap);
    let flybyCoveredTo = FIRST_FLYBY_CORRIDOR.start; let flybyMaxGap = 0;
    world.platforms.filter((platform) => platform.ground && platform.x + platform.w > FIRST_FLYBY_CORRIDOR.start && platform.x < FIRST_FLYBY_CORRIDOR.end).sort((a, b) => a.x - b.x).forEach((platform) => {
      flybyMaxGap = Math.max(flybyMaxGap, platform.x - flybyCoveredTo); flybyCoveredTo = Math.max(flybyCoveredTo, platform.x + platform.w);
    });
    game.flybyCorridorMaxGap = Math.round(flybyMaxGap); game.flybyCorridorEnemies = world.enemies.filter((enemy) => enemy.x >= FIRST_FLYBY_CORRIDOR.start && enemy.x <= FIRST_FLYBY_CORRIDOR.end).length;
    game.checkpointsGrounded = world.checkpoints.filter((checkpoint) => checkpoint.grounded && checkpoint.support && checkpoint.support.y === GROUND_Y).length;
    game.totalTacos = world.collectibles.filter((item) => item.type === 'taco' && !item.bonusReward).length;
    game.totalEnemies = world.enemies.length;
    const elevated = world.platforms.filter((p) => !p.ground);
    let overlap = 0;
    elevated.forEach((a, index) => elevated.slice(index + 1).forEach((b) => {
      const ax = a.moving && a.axis === 'x' ? a.range : 0; const bx = b.moving && b.axis === 'x' ? b.range : 0;
      const ay = a.moving && a.axis === 'y' ? a.range : 0; const by = b.moving && b.axis === 'y' ? b.range : 0;
      if (a.x - ax < b.x + b.w + bx && a.x + a.w + ax > b.x - bx && Math.abs(a.y - b.y) < 40 + ay + by) overlap += 1;
    }));
    game.platformOverlapCount = overlap;
    const normalJumpRise = heroPhysics.normalJumpRise;
    const unreachablePlatforms = elevated.filter((platform) => {
      const highestY = platform.y - (platform.moving && platform.axis === 'y' ? platform.range : 0);
      if (platform.scenicStep && platform.accessBase) return platform.accessBase.y - highestY > normalJumpRise + 1;
      const requiredRise = GROUND_Y - highestY;
      if (requiredRise <= normalJumpRise + 1) return false;
      const bounceEnemy = world.enemies.find((enemy) => enemy.targetPlatform === platform || Math.abs(enemy.x - (platform.x + 70)) < 110);
      return !bounceEnemy || requiredRise > heroPhysics.enemyBounceRise + bounceEnemy.h + 1;
    });
    game.unreachablePlatforms = unreachablePlatforms.length;
    game.unreachablePlatformDetails = unreachablePlatforms.map((platform) => ({
      x: Math.round(platform.x), y: Math.round(platform.y), moving: Boolean(platform.moving), scenicStep: Boolean(platform.scenicStep),
    }));
    const elevatedBySection = sections.slice(1, 5).map((section) => elevated.filter((platform) => platform.x >= section.start && platform.x < section.end).sort((a, b) => a.x - b.x));
    game.elevatedMaxGap = Math.round(Math.max(0, ...elevatedBySection.flatMap((platforms) => platforms.slice(1).map((platform, index) => platform.x - (platforms[index].x + platforms[index].w)))));
  }

  function addEnemy(x, y, type, platform, extra = {}) {
    const w = 48; const h = 46;
    const behaviorType = ({ lime: 'tomato', queso: 'onion' })[type] || type;
    const enemy = { x, y, baseY: y, w, h, type, behaviorType, platform, minX: platform ? Math.max(platform.x + 20, x - 130) : x, maxX: platform ? Math.min(platform.x + platform.w - w - 20, x + 130) : x, dir: random() > .5 ? 1 : -1, speed: 34 + random() * 24, alive: true, defeated: false, defeatTimer: 0, clock: random() * 5, hitCooldown: 0, ...extra };
    heroCore.prepareEnemyBehavior(enemy, world.enemies.length, behaviorType);
    world.enemies.push(enemy);
  }

  function skyPlatformInForbiddenCorridor(platform) {
    if (!platform) return true;
    const overlapsFlyby = platform.x < FIRST_FLYBY_CORRIDOR.end
      && platform.x + platform.w > FIRST_FLYBY_CORRIDOR.start;
    return overlapsFlyby || platform.x + platform.w / 2 >= SKY_COMBAT_END;
  }

  function findSkyGroundSupport(anchorX) {
    const candidates = world.platforms
      .filter((platform) => platform.ground && platform.mainRoute && !platform.checkpointPad && !platform.flybySafety)
      .filter((platform) => platform.x + platform.w > 0 && platform.x < SKY_COMBAT_END)
      .filter((platform) => !skyPlatformInForbiddenCorridor(platform));
    const containing = candidates.find((platform) => anchorX >= platform.x + 68 && anchorX <= platform.x + platform.w - 68);
    return containing || candidates
      .slice()
      .sort((a, b) => Math.abs(a.x + a.w / 2 - anchorX) - Math.abs(b.x + b.w / 2 - anchorX))[0] || null;
  }

  function findSkyUpperSupport(anchorX) {
    return world.platforms
      .filter((platform) => !platform.ground && !platform.scenicStep && platform.enemySupport !== false)
      .filter((platform) => platform.x < SKY_COMBAT_END && platform.x + platform.w > 4600)
      .filter((platform) => !skyPlatformInForbiddenCorridor(platform))
      .sort((a, b) => Math.abs(a.x + a.w / 2 - anchorX) - Math.abs(b.x + b.w / 2 - anchorX))[0] || null;
  }

  function createSkyPatrolZone(platform, encounter, occurrence, totalOccurrences) {
    const zoneWidth = Math.min(420, Math.max(260, Math.floor((platform.w - 32) / Math.max(1, totalOccurrences) - 24)));
    const minX = platform.x + 16;
    const maxX = platform.x + platform.w - zoneWidth - 16;
    const desiredX = encounter.anchorX - zoneWidth / 2;
    return {
      ...platform,
      id: `${platform.id}-patrol-zone-${occurrence + 1}`,
      x: clamp(desiredX, minX, Math.max(minX, maxX)),
      w: zoneWidth,
      virtualPatrolZone: true,
      patrolZoneOccurrence: occurrence + 1,
      patrolZoneTotal: totalOccurrences,
      physicalSupportPlatformId: platform.id,
    };
  }

  function addSkyFormation(definition, platform) {
    if (!platform) return [];
    const enemyWidth = 48;
    const enemyHeight = 46;
    const requestedCount = Math.max(1, Math.floor(Number(definition.count) || 1));
    // A formation is only readable on the ground or on a genuinely wide ledge.
    // Narrow aviation platforms receive one guard, never a crowd.
    const groupingAllowed = Boolean(platform.ground) || platform.w >= 220;
    const count = groupingAllowed ? requestedCount : 1;
    const spacing = count > 1
      ? Math.max(enemyWidth + 12, Number(definition.spacing) || enemyWidth + 18)
      : enemyWidth + 14;
    const formationWidth = enemyWidth + (count - 1) * spacing;
    const leftEdge = platform.x + 18;
    const rightEdge = platform.x + platform.w - formationWidth - 18;
    const requestedOffset = Number.isFinite(definition.offset)
      ? definition.offset
      : Math.max(0, (platform.w - formationWidth) / 2);
    const startX = clamp(platform.x + requestedOffset, leftEdge, Math.max(leftEdge, rightEdge));
    const role = definition.role || (platform.ground ? 'ground-patrol' : 'platform-sentry');
    const behaviorType = ({ lime: 'tomato', queso: 'onion' })[definition.type] || definition.type;
    const enemies = heroCore.createEnemyFormation({
      id: definition.id,
      type: definition.type,
      startX,
      y: platform.y - enemyHeight,
      w: enemyWidth,
      h: enemyHeight,
      count,
      spacing,
      vx: role === 'moving-guard' ? 46 : role === 'champion' ? 40 : 38,
      patrolPadding: definition.localPatrol ? 0 : 16,
      patrolStartOffset: definition.localPatrol ? 18 : undefined,
      role,
      roleExplicit: true,
      platform,
      platformId: platform.id,
      supportPlatformId: platform.id,
      skyEncounter: definition.id,
      skySection: definition.section,
      skyPurpose: definition.purpose,
      bounceHelper: role === 'route-helper',
      routeHelper: role === 'route-helper',
      champion: role === 'champion',
      localPatrol: Boolean(definition.localPatrol),
      targetPlatform: definition.targetPlatform || null,
      targetPlatformId: definition.targetPlatform?.id || null,
      formationRule: groupingAllowed ? 'ground-or-large-platform' : 'single-narrow-platform',
      formationPurpose: definition.purpose,
      ...(Number.isFinite(definition.minX) ? { minX: definition.minX } : {}),
      ...(Number.isFinite(definition.maxX) ? { maxX: definition.maxX } : {}),
    });

    enemies.forEach((enemy, index) => {
      enemy.behaviorType = behaviorType;
      enemy.clock = ((world.enemies.length + index) * .17) % 3.2;
      enemy.anim = (index * .18) % 1;
      enemy.dir = definition.direction || (index % 2 === 0 ? 1 : -1);
      enemy.previousY = enemy.y;
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length + index, behaviorType);
      world.enemies.push(enemy);
    });
    return enemies;
  }

  function lowerSkyPlatformToNormalJump(platform) {
    if (!platform || platform.ground || platform.scenicStep) return false;
    const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
    const requiredRise = GROUND_Y - (platform.y - verticalRange);
    if (requiredRise <= heroPhysics.normalJumpRise + 1) return false;
    const reachableY = GROUND_Y - heroPhysics.normalJumpRise + verticalRange + 1;
    if (reachableY <= platform.y) return false;
    const oldY = platform.y;
    platform.y = reachableY;
    if (platform.moving) platform.baseY = reachableY;
    const deltaY = reachableY - oldY;
    world.collectibles.forEach((item) => {
      if (item.ridePlatform === platform) { item.y = platform.y + item.rideOffsetY; return; }
      if (item.x + item.w < platform.x || item.x > platform.x + platform.w) return;
      if (item.y >= oldY - 125 && item.y <= oldY + 24) item.y += deltaY;
    });
    world.enemies.forEach((enemy) => {
      if (enemy.platform !== platform) return;
      enemy.y += deltaY;
      enemy.baseY = (enemy.baseY ?? oldY - enemy.h) + deltaY;
      enemy.platformLastY = platform.y;
      enemy.groundY = platform.y;
    });
    platform.normalJumpAccessible = true;
    return true;
  }

  function addSkyRouteHelper(platform, index, groupedGroundSupports) {
    if (!platform || skyPlatformInForbiddenCorridor(platform)) return null;
    const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
    const requiredRise = GROUND_Y - (platform.y - verticalRange);
    if (requiredRise <= heroPhysics.normalJumpRise + 1) return null;
    const support = findSkyGroundSupport(platform.x + platform.w / 2);
    if (!support || groupedGroundSupports.has(support.id)) {
      lowerSkyPlatformToNormalJump(platform);
      return null;
    }
    const helperX = clamp(platform.x + platform.w / 2, support.x + 52, support.x + support.w - 100);
    const helper = addSkyFormation({
      id: `sky-route-helper-${index}`,
      type: index % 2 ? 'onion' : 'jalapeno',
      count: 1,
      offset: helperX - support.x,
      role: 'route-helper',
      section: 'bounce-route',
      purpose: 'Provide a forgiving launch under the elevated aviation route.',
      localPatrol: true,
      minX: helperX - 58,
      maxX: helperX + 58,
      targetPlatform: platform,
    }, support)[0];
    return helper || null;
  }

  function auditSkyPilotFormations() {
    const grouped = new Map();
    world.enemies.forEach((enemy) => {
      if (!enemy.groupId || enemy.groupSize <= 1) return;
      if (!grouped.has(enemy.groupId)) grouped.set(enemy.groupId, []);
      grouped.get(enemy.groupId).push(enemy);
    });
    const overlapPairs = [];
    const mixedTypeGroups = [];
    const narrowPlatformGroups = [];
    grouped.forEach((members, groupId) => {
      const ordered = [...members].sort((a, b) => a.groupIndex - b.groupIndex || a.x - b.x);
      const support = ordered[0]?.platform;
      if (support && !support.ground && support.w < 220) narrowPlatformGroups.push(groupId);
      if (new Set(ordered.map((enemy) => enemy.type)).size > 1) mixedTypeGroups.push(groupId);
      for (let index = 0; index < ordered.length - 1; index += 1) {
        const left = ordered[index]; const right = ordered[index + 1];
        if (left.x + left.w > right.x + .5 || left.maxX + left.w > right.minX + .5) {
          overlapPairs.push(`${groupId}:${left.groupIndex}-${right.groupIndex}`);
        }
      }
    });
    const firstFlybyEnemies = world.enemies.filter((enemy) => enemy.x >= FIRST_FLYBY_CORRIDOR.start && enemy.x <= FIRST_FLYBY_CORRIDOR.end).length;
    const lateSetPieceEnemies = world.enemies.filter((enemy) => enemy.x >= SKY_COMBAT_END).length;
    game.skyFormationOverlapCount = overlapPairs.length;
    game.skyFormationOverlapPairs = overlapPairs;
    game.skyMixedTypeGroups = mixedTypeGroups;
    game.skyNarrowPlatformGroups = narrowPlatformGroups;
    game.skyForbiddenEnemyCounts = { firstFlyby: firstFlybyEnemies, ambushAndRescue: lateSetPieceEnemies };
    game.skyFormationRules = {
      groupedGroundOrLargeOnly: narrowPlatformGroups.length === 0,
      sameTypeGroups: mixedTypeGroups.length === 0,
      minimumGap: 12,
      noOverlap: overlapPairs.length === 0,
    };
  }

  function applySkyPilotRemaster() {
    // Replace the former alternating singleton pass with a route authored for
    // the full playable portion of the rescue. The airfield, post-flyby banner
    // act, and high desert get combat; the sightseeing flyby, guacamole ambush,
    // turbo rescue, and crash fiesta remain clean cinematic corridors.
    world.enemies = [];
    const groupedGroundSupports = new Set();
    const groundSupportCounts = new Map();
    const usedUpperSupports = new Set();
    const authored = { ground: [], upper: [], routeHelpers: [], skipped: [] };

    const groundAssignments = skyPilotGroundPlan.map((encounter) => ({ encounter, platform: findSkyGroundSupport(encounter.anchorX) }));
    groundAssignments.forEach(({ platform }) => {
      if (platform) groundSupportCounts.set(platform.id, (groundSupportCounts.get(platform.id) || 0) + 1);
    });
    const groundSupportOccurrences = new Map();
    skyPilotGroundPlan.forEach((encounter) => {
      const platform = findSkyGroundSupport(encounter.anchorX);
      if (!platform) { authored.skipped.push(encounter.id); return; }
      groupedGroundSupports.add(platform.id);
      const totalOccurrences = groundSupportCounts.get(platform.id) || 1;
      const occurrence = groundSupportOccurrences.get(platform.id) || 0;
      groundSupportOccurrences.set(platform.id, occurrence + 1);
      const sharedPlatformZone = totalOccurrences > 1;
      const patrolPlatform = sharedPlatformZone
        ? createSkyPatrolZone(platform, encounter, occurrence, totalOccurrences)
        : platform;
      const formationSpacing = sharedPlatformZone ? 110 : undefined;
      const requestedCount = Math.max(1, Math.floor(Number(encounter.count) || 1));
      const patrolOffset = sharedPlatformZone
        ? Math.max(18, (patrolPlatform.w - 48 - (requestedCount - 1) * formationSpacing) / 2)
        : Math.max(70, Math.min(platform.w - 170, encounter.anchorX - platform.x - 80));
      const enemies = addSkyFormation({
        ...encounter,
        offset: patrolOffset,
        role: 'ground-patrol',
        spacing: formationSpacing,
        physicalSupportPlatformId: platform.id,
      }, patrolPlatform);
      enemies.forEach((enemy) => { enemy.physicalSupportPlatformId = platform.id; });
      if (enemies.length) authored.ground.push(encounter.id);
    });

    skyPilotUpperPlan.forEach((encounter) => {
      const platform = findSkyUpperSupport(encounter.anchorX);
      if (!platform || usedUpperSupports.has(platform.id)) { authored.skipped.push(encounter.id); return; }
      usedUpperSupports.add(platform.id);
      const enemies = addSkyFormation(encounter, platform);
      if (enemies.length) authored.upper.push(encounter.id);
      const helper = addSkyRouteHelper(platform, authored.routeHelpers.length + 1, groupedGroundSupports);
      if (helper) authored.routeHelpers.push(helper.skyEncounter);
    });

    // Any tall ledge not selected for the authored route is lowered into the
    // normal jump envelope rather than silently relying on a deleted seed
    // enemy. This keeps every optional platform readable and reachable.
    world.platforms
      .filter((platform) => !platform.ground && !platform.scenicStep && platform.x < SKY_COMBAT_END)
      .forEach((platform) => {
        const hasHelper = world.enemies.some((enemy) => enemy.targetPlatform === platform);
        if (!hasHelper) lowerSkyPlatformToNormalJump(platform);
      });

    world.enemies = world.enemies.filter((enemy) => (
      enemy.x < SKY_COMBAT_END
      && !(enemy.x >= FIRST_FLYBY_CORRIDOR.start && enemy.x <= FIRST_FLYBY_CORRIDOR.end)
    ));
    game.platformEnemyStats = heroCore.attachEnemiesToPlatforms(world.enemies, world.platforms, { surfaceTolerance: 34, edgePadding: 14 });
    const patrolTargets = world.enemies.filter((enemy) => !enemy.localPatrol);
    game.enemyPatrolAudit = heroCore.retuneEnemyFormationPatrols(patrolTargets, { fullPlatformCoverage: true, minimumGap: 12, edgePadding: 16 });
    world.enemies.filter((enemy) => enemy.localPatrol && enemy.platform).forEach((enemy) => {
      const platform = enemy.platform;
      const platformMin = platform.x + 16;
      const platformMax = platform.x + platform.w - enemy.w - 16;
      enemy.minX = clamp(enemy.minX, platformMin, Math.max(platformMin, platformMax));
      enemy.maxX = clamp(enemy.maxX, enemy.minX, Math.max(enemy.minX, platformMax));
      enemy.patrolCoverage ||= 'local-route-helper';
      enemy.patrolSpan = enemy.maxX - enemy.minX;
    });
    auditSkyPilotFormations();
    game.skyPilotRemaster = {
      version: 'world-1-2-pilot-v1',
      combatEnd: SKY_COMBAT_END,
      authoredGroundEncounters: authored.ground.length,
      authoredUpperEncounters: authored.upper.length,
      authoredRouteHelpers: authored.routeHelpers.length,
      skippedEncounterIds: authored.skipped,
      groupedEnemies: world.enemies.filter((enemy) => enemy.groupSize > 1).length,
      enemyGroups: [...new Set(world.enemies.filter((enemy) => enemy.groupSize > 1).map((enemy) => enemy.groupId))],
      enemyFreeFirstFlyby: game.skyForbiddenEnemyCounts.firstFlyby === 0,
      enemyFreeAmbushAndRescue: game.skyForbiddenEnemyCounts.ambushAndRescue === 0,
      routeDiscoveryOnly: true,
      groupingRule: 'ground-or-large-platform',
      patrolCoverage: 'full-usable-platform-with-separated-pack-lanes',
      logicalGroundPatrolZones: [...new Set(world.enemies.filter((enemy) => enemy.platform?.virtualPatrolZone).map((enemy) => enemy.platform.id))].length,
      upperRoutePlatforms: [...usedUpperSupports],
    };
  }

  function loadProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      const sky = JSON.parse(localStorage.getItem('jumpinForTacosLevel12SkyProgressV1') || '{}');
      if (shared.settings) {
        game.musicVolume = clamp(Number(shared.settings.musicVolume ?? .7), 0, 1); game.effectsVolume = clamp(Number(shared.settings.effectsVolume ?? .8), 0, 1);
        game.reducedShake = Boolean(shared.settings.reducedShake); game.muted = Boolean(shared.settings.muted);
      }
      if (sky.personalBest) game.personalBest = { ...game.personalBest, ...sky.personalBest };
    } catch { /* storage optional */ }
  }

  function saveProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      shared.settings = { musicVolume: game.musicVolume, effectsVolume: game.effectsVolume, reducedShake: game.reducedShake, muted: game.muted };
      localStorage.setItem('jumpinForTacosProgressV2', JSON.stringify(shared));
      localStorage.setItem('jumpinForTacosLevel12SkyProgressV1', JSON.stringify({ personalBest: game.personalBest }));
    } catch { /* storage optional */ }
  }

  function syncSettings() {
    ui.musicVolume.value = String(Math.round(game.musicVolume * 100)); ui.effectsVolume.value = String(Math.round(game.effectsVolume * 100));
    ui.musicVolumeValue.textContent = `${ui.musicVolume.value}%`; ui.effectsVolumeValue.textContent = `${ui.effectsVolume.value}%`; ui.reducedShake.checked = game.reducedShake;
    ui.muteBtn.textContent = game.muted ? '🔇 Sound Off' : '🔊 Sound On'; allTracks.forEach((track) => { track.muted = game.muted; });
  }

  function freshFlybys() {
    const eventIndex = previewEvent === 'banner' ? 0 : previewEvent === 'banner2' ? 1 : previewEvent === 'inverted' ? 2 : -1;
    return flybyDefs.map((definition, index) => {
      const passed = previewStart >= definition.trigger + 3000;
      const activePreview = eventIndex === index;
      const earlierThanPreview = eventIndex >= 0 && index < eventIndex;
      return {
        ...definition,
        text: definition.text || bannerJokes[Math.floor(random() * bannerJokes.length)],
        started: activePreview || passed || earlierThanPreview,
        timer: activePreview ? 3.35 : passed || earlierThanPreview ? 7.4 : 0,
        finished: !activePreview && (passed || earlierThanPreview),
        nextDropAt: definition.dropStart || Infinity, dropsReleased: 0, dropCompleteAnnounced: false,
      };
    });
  }

  function resetGame() {
    buildWorld();
    Object.assign(game, {
      state: 'title', score: 0, collected: 0, defeated: 0, hearts: 3, sectionIndex: 0, cameraX: 0, levelTime: 0, startTime: 0, finishTime: 0,
      latestCheckpoint: null, message: '', messageTimer: 0, radioQueue: '', radioDelay: 0, abilities: sharedAbilities.createState(),
      openingTimer: previewOpeningAt || (previewSkipOpening ? 12.6 : 0), openingComplete: previewSkipOpening && !previewOpeningAt, flybys: freshFlybys(),
      ambush: { stage: previewEvent === 'guac' ? 2 : previewEvent === 'fire' || previewStart >= 27000 ? 3 : 0, timer: previewEvent === 'fire' ? .65 : 0, projectile: previewEvent === 'guac' ? .58 : 0, hitFlash: 0, musicDrop: 0 }, rescueActive: previewEvent === 'rescue' || previewStart >= 27000, rescuePhase: previewStart >= 30300 ? 2 : previewStart >= 28700 ? 1 : previewStart >= 27000 ? 0 : -1, crashLanded: previewEvent === 'crash' || previewStart >= 32200, crashTimer: previewEvent === 'crash' || previewStart >= 32200 ? 1.5 : 0,
      skyStreak: { count: 0, best: 0, timer: 0, decayTimer: 0 }, airMail: 0, airMailTotal: 5, airMailComplete: false, landingQuip: landingQuips[Math.floor(random() * landingQuips.length)],
      particles: [], confetti: [], fireworks: [], impactTexts: [], pinataBurst: null, cameraShake: 0, hitStop: 0, celebrationTime: 0, partyBeat: -1, settingsOpen: false,
      splatCombo: 0, splatTimer: 0, bestSplat: 0, respawn: heroCore.createRespawnState(),
      activeMusic: null, musicTransition: null, musicTransitionCount: 0, musicRetargets: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
      inputResetCount: 0, lastInputResetReason: 'none', landingRecoveries: 0, controlStallTimer: 0, controllerStateSyncs: 0, controllerStateSequence: 0, controllerQaResetDone: false, effectsTrimmed: 0, lastCollectSfxAt: -1,
      airDrop: { spawned: 0, caught: 0 },
      respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null,
    });
    const startX = clamp(previewStart || 140, 0, WORLD_WIDTH - 250);
    Object.assign(player, { x: startX, y: 360, previousY: 360, vx: 0, vy: 0, dir: 1, grounded: false, platform: null, anim: 0, coyote: 0, jumpBuffer: 0, invulnerable: 0, rotation: 0, scale: 1 });
    clearInputs('level-reset');
    if (['pinata', 'pinataKaboom', 'pinataAftershock'].includes(previewEvent) && world.pinata) {
      world.pinata.hits = 2; player.x = world.pinata.x + 16; player.y = world.pinata.y - player.h - 16;
      game.flybys.forEach((flyby) => { flyby.started = true; flyby.finished = true; flyby.timer = 7.5; });
    }
    game.sectionIndex = Math.max(0, sections.findIndex((section) => player.x >= section.start && player.x < section.end));
    game.cameraX = clamp(player.x - canvas.width * .42, 0, WORLD_WIDTH - canvas.width);
    if ((previewEvent === 'pinataKaboom' || previewEvent === 'pinataAftershock') && world.pinata) {
      world.pinata.hitCooldown = 0; hitPinata();
      if (previewEvent === 'pinataAftershock' && game.pinataBurst) { game.pinataBurst.timer = 2.56; game.hitStop = 0; }
    }
    stopMusic(); ui.startOverlay.classList.remove('hidden'); ui.startOverlay.classList.add('visible'); ui.winOverlay.classList.add('hidden'); ui.winOverlay.classList.remove('visible');
  }

  function unlockAudio() { if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume(); }
  function sfx(freq, duration = .1, type = 'triangle', volume = .04, slide = 0) {
    if (game.muted) return; unlockAudio(); const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, audioContext.currentTime); oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), audioContext.currentTime + duration);
    gain.gain.setValueAtTime(volume * game.effectsVolume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  }

  function silence(track) { if (!track) return; track.pause(); track.currentTime = 0; track.volume = 0; }
  function musicTargetVolume(name) { return clamp(game.musicVolume * (musicMixLevels[name] || 1), 0, 1); }
  function musicCrossfadeDuration(fromName, toName) { return musicCrossfadeDurations[`${fromName}>${toName}`] || 2.45; }
  function prepareTrack(name, volume = 0, restart = true) {
    const track = tracks[name]; if (!track) return null;
    track.muted = game.muted; track.volume = clamp(volume, 0, 1); if (restart) try { track.currentTime = 0; } catch { /* metadata may still be loading */ }
    track.play().catch(() => {}); return track;
  }
  function startTrack(name, volume = musicTargetVolume(name)) {
    const track = tracks[name]; if (!track) return; allTracks.forEach((item) => { if (item !== track) silence(item); });
    prepareTrack(name, volume); game.activeMusic = name;
  }
  function beginMusicCrossfade(fromName, toName, options = {}) {
    if (!tracks[toName] || fromName === toName) return;
    const from = tracks[fromName];
    if (!from || from.paused) { startTrack(toName); game.musicTransition = null; return; }
    const to = tracks[toName];
    Object.entries(tracks).forEach(([name, track]) => { if (name !== fromName && name !== toName && !track.paused) { silence(track); game.musicOverlapRecoveries += 1; } });
    prepareTrack(toName, options.startToVolume || 0, options.restartTo !== false);
    game.musicTransition = {
      fromName, toName, from, to, elapsed: 0, duration: options.duration || musicCrossfadeDuration(fromName, toName),
      startFromVolume: options.startFromVolume ?? Math.max(.001, from.volume), startToVolume: options.startToVolume || 0,
      queuedTarget: null, reversed: Boolean(options.reversed),
    };
    game.activeMusic = toName; game.musicTransitionCount += 1;
  }
  function setMusic(name, immediate = false) {
    if (!tracks[name]) return;
    if (immediate || !game.activeMusic) { startTrack(name); game.musicTransition = null; return; }
    const transition = game.musicTransition;
    if (transition) {
      if (transition.toName === name) { transition.queuedTarget = null; return; }
      if (transition.fromName === name) {
        const startFromVolume = transition.to.volume; const startToVolume = transition.from.volume;
        game.musicRetargets += 1;
        beginMusicCrossfade(transition.toName, transition.fromName, {
          duration: Math.max(1.15, transition.duration * .72), startFromVolume, startToVolume, restartTo: false, reversed: true,
        });
        return;
      }
      transition.queuedTarget = name; game.musicRetargets += 1; return;
    }
    if (game.activeMusic === name) return;
    beginMusicCrossfade(game.activeMusic, name);
  }
  function updateMusic(dt) {
    const transition = game.musicTransition;
    if (!transition) {
      Object.entries(tracks).forEach(([name, track]) => {
        if (name === game.activeMusic) track.volume = musicTargetVolume(name);
        else if (!track.paused) { silence(track); game.musicOverlapRecoveries += 1; }
      });
      game.maxMusicPlaying = Math.max(game.maxMusicPlaying, allTracks.filter((track) => !track.paused).length); return;
    }
    Object.entries(tracks).forEach(([name, track]) => { if (name !== transition.fromName && name !== transition.toName && !track.paused) { silence(track); game.musicOverlapRecoveries += 1; } });
    transition.elapsed += dt; const t = clamp(transition.elapsed / transition.duration, 0, 1); const angle = t * Math.PI * .5;
    transition.from.volume = clamp(Math.min(transition.startFromVolume, musicTargetVolume(transition.fromName)) * Math.cos(angle), 0, 1);
    const targetVolume = musicTargetVolume(transition.toName);
    transition.to.volume = clamp(transition.startToVolume + (targetVolume - transition.startToVolume) * Math.sin(angle), 0, 1);
    game.maxMusicPlaying = Math.max(game.maxMusicPlaying, allTracks.filter((track) => !track.paused).length);
    if (t < 1) return;
    const queuedTarget = transition.queuedTarget; silence(transition.from); transition.to.volume = targetVolume; game.activeMusic = transition.toName; game.musicTransition = null;
    if (queuedTarget && queuedTarget !== game.activeMusic) beginMusicCrossfade(game.activeMusic, queuedTarget);
  }
  function stopMusic() { allTracks.forEach(silence); game.activeMusic = null; game.musicTransition = null; }

  function showMessage(text, duration = 2.2) { game.message = text; game.messageTimer = duration; }
  function startGame() {
    unlockAudio(); ui.startOverlay.classList.add('hidden'); ui.startOverlay.classList.remove('visible'); game.state = 'playing'; game.startTime = performance.now();
    setMusic(sections[game.sectionIndex].music, true);
    showMessage(previewSkipOpening ? sections[game.sectionIndex].name.toUpperCase() : 'OLIVIA AIRWAYS — BOARDING NOW!', 2.4);
    if (previewRespawn) {
      if (previewRespawnCheckpoint >= 0 && world.checkpoints[previewRespawnCheckpoint]) {
        game.latestCheckpoint = world.checkpoints[previewRespawnCheckpoint];
      }
      beginRespawn();
    }
  }

  function setupInputs() {
    const inputForKey = (key) => ['ArrowLeft', 'a', 'A'].includes(key) ? 'left' : ['ArrowRight', 'd', 'D'].includes(key) ? 'right' : ['ArrowUp', 'w', 'W', ' '].includes(key) ? 'jump' : null;
    addEventListener('keydown', (event) => {
      const input = inputForKey(event.key); if (!input) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(event.key)) event.preventDefault();
      // The shared controller also emits a dedicated event. Ignoring its
      // synthetic KeyboardEvent prevents one controller action being counted
      // twice and leaving a direction stranded after a reconnect.
      if (!event.isTrusted && window.JFT_CONTROLLER) return;
      setDigitalInput('keyboard', input, true);
    });
    addEventListener('keyup', (event) => {
      const input = inputForKey(event.key); if (!input || (!event.isTrusted && window.JFT_CONTROLLER)) return; setDigitalInput('keyboard', input, false);
    });
    addEventListener('jft:controlleraction', (event) => {
      const { action, pressed } = event.detail || {}; if (!['left', 'right', 'jump'].includes(action)) return; setDigitalInput('controller', action, Boolean(pressed));
    });
    // Controller button edges remain ideal for jumping, but held stick/D-pad
    // directions also need a continuous snapshot. This restores movement on
    // the very next frame when a respawn or cinematic reset clears local input
    // while the player is still holding a direction.
    addEventListener('jft:controllerstate', (event) => {
      const detail = event.detail || {};
      game.controllerStateSequence = Number(detail.sequence) || game.controllerStateSequence;
      if (detail.connected === false) return;
      ['left', 'right'].forEach((input) => {
        const pressed = Boolean(detail[input]);
        if (inputSources.controller[input] === pressed) return;
        setDigitalInput('controller', input, pressed);
        game.controllerStateSyncs += 1;
      });
    });
    document.querySelectorAll('[data-input]').forEach((button) => {
      const input = button.dataset.input;
      const down = (event) => { event.preventDefault(); try { button.setPointerCapture(event.pointerId); } catch { /* optional */ } setDigitalInput('touch', input, true, event.pointerId); };
      const up = (event) => { event.preventDefault(); setDigitalInput('touch', input, false, event.pointerId); };
      button.addEventListener('pointerdown', down); button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('lostpointercapture', up);
    });
    const releasePointer = (event) => { ['left', 'right', 'jump'].forEach((input) => setDigitalInput('touch', input, false, event.pointerId)); };
    addEventListener('pointerup', releasePointer); addEventListener('pointercancel', releasePointer);
    addEventListener('blur', () => clearInputs('window-blur'));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInputs('page-hidden');
      lastFrame = 0;
    });
    addEventListener('jft:gamepaddisconnected', () => { ['left', 'right', 'jump'].forEach((input) => { inputSources.controller[input] = false; }); syncInputs(); });
    window.JFT_LEVEL_START.bind(startGame);
    ui.restartBtn.addEventListener('click', () => { resetGame(); startGame(); });
    ui.playAgainBtn.addEventListener('click', () => { resetGame(); startGame(); });
    ui.muteBtn.addEventListener('click', () => { game.muted = !game.muted; syncSettings(); saveProgress(); });
    ui.settingsBtn.addEventListener('click', () => { game.settingsOpen = true; ui.settingsOverlay.classList.remove('hidden'); ui.settingsOverlay.classList.add('visible'); });
    ui.closeSettingsBtn.addEventListener('click', () => { game.settingsOpen = false; ui.settingsOverlay.classList.add('hidden'); ui.settingsOverlay.classList.remove('visible'); });
    ui.musicVolume.addEventListener('input', () => { game.musicVolume = Number(ui.musicVolume.value) / 100; syncSettings(); saveProgress(); });
    ui.effectsVolume.addEventListener('input', () => { game.effectsVolume = Number(ui.effectsVolume.value) / 100; syncSettings(); saveProgress(); });
    ui.reducedShake.addEventListener('change', () => { game.reducedShake = ui.reducedShake.checked; saveProgress(); });
  }

  function updateOpening(dt) {
    if (game.openingComplete) return;
    game.openingTimer += dt; player.vx = 0; player.x = 140; player.y = GROUND_Y - player.h; player.jumpBuffer = 0;
    game.cameraX = openingCameraPosition(game.openingTimer);
    if (game.openingTimer > .45 && game.openingTimer - dt <= .45) { showMessage('OLIVIA: “I PACKED THE ESSENTIAL FLIGHT TACOS!”', 2.5); sfx(620, .14, 'triangle', .035, 220); }
    if (game.openingTimer > 2.65 && game.openingTimer - dt <= 2.65) { showMessage('OLIVIA: “TIME TO CLIMB ABOARD. PROBABLY.”', 2.25); sfx(260, .22, 'triangle', .04, 260); }
    if (game.openingTimer > 4.65 && game.openingTimer - dt <= 4.65) { showMessage('PROPELLER: BRRRRRT. TACOS: SECURED.', 2.2); sfx(105, .6, 'sawtooth', .045, 130); }
    if (game.openingTimer > 7.15 && game.openingTimer - dt <= 7.15) { showMessage('OLIVIA: “FASTER... FASTER... TACO LIFTOFF!”', 2.55); sfx(180, .42, 'triangle', .04, 330); }
    if (game.openingTimer > 8.4 && game.openingTimer < OPENING_TIMING.taxiEnd) game.cameraShake = Math.max(game.cameraShake, (game.openingTimer - 8.4) / (OPENING_TIMING.taxiEnd - 8.4) * (game.reducedShake ? 1.2 : 3.5));
    if (game.openingTimer > OPENING_TIMING.taxiEnd && game.openingTimer - dt <= OPENING_TIMING.taxiEnd) { showMessage('OLIVIA AIRWAYS — ROTATE FOR TACO!', 1.3); sfx(320, .35, 'triangle', .05, 520); }
    if (game.openingTimer > OPENING_TIMING.yahooAt && game.openingTimer - dt <= OPENING_TIMING.yahooAt) {
      const pose = openingPlanePose(game.openingTimer); const screenX = pose.x - game.cameraX;
      game.messageTimer = 0; game.cameraShake = game.reducedShake ? 3 : 10;
      spawnConfetti(screenX, pose.y + 24, game.reducedShake ? 70 : 125); spawnBurst(screenX, pose.y + 12, '#ffd65a', game.reducedShake ? 34 : 68);
      sfx(250, .58, 'triangle', .07, 760); setTimeout(() => sfx(560, .34, 'sine', .05, 520), 90); setTimeout(() => sfx(880, .22, 'triangle', .045, 360), 190);
    }
    if (game.openingTimer > 13.55 && game.openingTimer - dt <= 13.55) { showMessage('OLIVIA: “I’LL CIRCLE BACK! YOU RUN!”', 2.25); sfx(520, .2, 'triangle', .04, 330); }
    if (game.openingTimer >= OPENING_TIMING.complete) {
      game.openingComplete = true; game.cameraX = 0; showMessage('CAMERA ON TACO HERO — GO!', 2.2);
      spawnConfetti(player.x + player.w / 2, player.y - 12, 80); sfx(440, .2, 'triangle', .05, 520);
    }
  }

  function updateMovingPlatforms(dt) {
    world.platforms.forEach((platform) => {
      if (!platform.moving) { platform.dx = 0; platform.dy = 0; return; }
      const oldX = platform.x; const oldY = platform.y; platform.phase += dt * platform.speed;
      if (platform.axis === 'x') platform.x = platform.baseX + Math.sin(platform.phase) * platform.range;
      else platform.y = platform.baseY + Math.sin(platform.phase) * platform.range;
      platform.dx = platform.x - oldX; platform.dy = platform.y - oldY;
      if (player.platform === platform && player.grounded) { player.x += platform.dx; player.y += platform.dy; }
      world.collectibles.forEach((item) => { if (item.ridePlatform === platform) { item.x = platform.x + item.rideOffsetX; item.y = platform.y + item.rideOffsetY; } });
    });
  }

  function updatePlayer(dt) {
    if (!game.openingComplete) return;
    const wasGrounded = player.grounded;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt); player.coyote = player.grounded ? heroPhysics.coyoteTime : Math.max(0, player.coyote - dt); player.invulnerable = Math.max(0, player.invulnerable - dt);
    const autoRun = previewAutoRun || game.rescueActive;
    const manualInput = keys.left && keys.right ? keys.lastDir : keys.right ? 1 : keys.left ? -1 : 0;
    const input = manualInput || (autoRun ? 1 : 0);
    const maxSpeed = game.rescueActive ? 480 : 300; const acceleration = player.grounded ? 1800 : 1100;
    if (input) { player.vx += input * acceleration * dt; player.dir = input > 0 ? 1 : -1; } else player.vx *= Math.pow(.0015, dt);
    if (game.rescueActive && !keys.left) player.vx = Math.max(player.vx, 365);
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
    if (player.jumpBuffer > 0 && player.coyote > 0) { player.vy = -heroPhysics.jumpVelocity; player.grounded = false; player.platform = null; player.coyote = 0; player.jumpBuffer = 0; sfx(330, .1, 'triangle', .035, 180); }
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    const oldY = player.y; player.previousY = oldY; player.x += player.vx * dt; player.y += player.vy * dt; player.x = clamp(player.x, 0, WORLD_WIDTH - player.w);
    player.grounded = false; player.platform = null;
    const previousBottom = oldY + player.h; const currentBottom = player.y + player.h;
    let landedThisFrame = false;
    if (player.vy >= 0) {
      for (const platform of world.platforms) {
        if (player.x + player.w <= platform.x + 5 || player.x >= platform.x + platform.w - 5) continue;
        if (previousBottom <= platform.y + 8 && currentBottom >= platform.y) { player.y = platform.y - player.h; player.vy = 0; player.grounded = true; player.platform = platform; landedThisFrame = !wasGrounded; break; }
      }
    }
    if (landedThisFrame && input && Math.abs(player.vx) < 72) { player.vx = input * 72; game.landingRecoveries += 1; }
    const canMoveInDirection = manualInput > 0 ? player.x < WORLD_WIDTH - player.w - 8 : manualInput < 0 ? player.x > 8 : false;
    if (player.grounded && manualInput && canMoveInDirection && Math.abs(player.vx) < 9) game.controlStallTimer += dt; else game.controlStallTimer = 0;
    if (game.controlStallTimer > .3) { player.vx = manualInput * 96; game.controlStallTimer = 0; game.landingRecoveries += 1; }
    if (player.y > canvas.height + 100) {
      game.hearts -= 1;
      if (game.hearts <= 0) game.hearts = 3;
      beginRespawn();
    }
    player.anim += dt * Math.max(2, Math.abs(player.vx) / 34);
  }

  function findRespawnPoint(sourceX) {
    const checkpoint = game.latestCheckpoint; const desiredX = checkpoint ? checkpoint.x + 20 : Math.max(100, sourceX - 400);
    const ground = world.platforms.filter((platform) => platform.ground); let support = ground.find((platform) => desiredX > platform.x + 36 && desiredX < platform.x + platform.w - player.w - 36);
    if (!support) support = ground.sort((a, b) => Math.abs(a.x + a.w / 2 - desiredX) - Math.abs(b.x + b.w / 2 - desiredX))[0];
    const targetX = support ? clamp(desiredX, support.x + 42, support.x + support.w - player.w - 42) : desiredX;
    const targetY = support ? support.y - player.h : 372;
    return { targetX, targetY, airY: Math.max(24, targetY - 250) };
  }

  function beginRespawn() {
    if (game.state !== 'playing' || game.respawn.active) return;
    const sourceX = player.x; const sourceY = Math.min(player.y, canvas.height - player.h - 8); const point = findRespawnPoint(sourceX);
    clearInputs('respawn'); game.state = 'respawning';
    heroCore.beginRespawn(game.respawn, { fromX: sourceX, fromY: sourceY, ...point });
    game.respawnCount += 1;
    player.x = sourceX; player.y = sourceY; player.vx = 0; player.vy = 0; player.grounded = false; player.platform = null; player.coyote = 0; player.jumpBuffer = 0; player.invulnerable = 0; player.rotation = 0; player.scale = 1;
    game.score = Math.max(0, game.score - 120); showMessage('SOFT LANDING! TRY AGAIN.', 1.7); spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#ffd65a', 20); sfx(150, .25, 'sine', .05, -55);
  }

  function updateRespawn(dt) {
    const respawnStep = heroCore.advanceRespawn(game.respawn, player, dt);
    game.cameraX = lerp(game.cameraX, clamp(game.respawn.targetX - canvas.width * .42, 0, WORLD_WIDTH - canvas.width), Math.min(1, dt * 4));
    if (respawnStep.phase === 'vanish') {
      if (game.respawn.sparkTimer >= .08) { game.respawn.sparkTimer = 0; spawnConfetti(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, 4); }
      return;
    }
    if (respawnStep.shouldPlace) { heroCore.placeRespawn(game.respawn, player); spawnConfetti(player.x - game.cameraX + player.w / 2, 84, 18); sfx(620, .12, 'triangle', .04, 220); }
    if (!game.respawn.spawnPlaced) return;
    const previousY = player.y; player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt); player.y += player.vy * dt; player.grounded = false; player.platform = null;
    const previousBottom = previousY + player.h; const currentBottom = player.y + player.h;
    for (const platform of world.platforms) {
      if (player.x + player.w <= platform.x + 5 || player.x >= platform.x + platform.w - 5) continue;
      if (previousBottom <= platform.y + 8 && currentBottom >= platform.y) { player.y = platform.y - player.h; player.vy = 0; player.grounded = true; player.platform = platform; break; }
    }
    if (!player.grounded && game.respawn.timer > 3) {
      player.x = game.respawn.targetX; player.y = game.respawn.targetY; player.vx = 0; player.vy = 0; player.grounded = true;
      player.platform = world.platforms.find((platform) => player.x + player.w > platform.x + 5 && player.x < platform.x + platform.w - 5 && Math.abs(platform.y - (player.y + player.h)) <= 12) || null;
      game.respawnFallbacks += 1;
    }
    if (player.grounded && game.respawn.timer > .8) {
      game.lastRespawnLanding = { x: Math.round(player.x), y: Math.round(player.y), grounded: true, fallback: game.respawn.timer > 3 };
      heroCore.finishRespawn(game.respawn, player); game.state = 'playing'; clearInputs('respawn-landed');
    }
  }

  function updateEnemies(dt) {
    let stompResolvedThisFrame = false;
    const previousPlayerBottom = Number.isFinite(player.previousY) ? player.previousY + player.h : player.y + player.h;
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      if (enemy.defeated) {
        enemy.defeatTimer -= dt;
        if (enemy.defeatTimer <= 0) enemy.alive = false;
        continue;
      }
      const previousEnemyTop = Number.isFinite(enemy.previousY) ? enemy.previousY : enemy.y;
      enemy.clock += dt; enemy.anim += dt * heroPhysics.enemyVisualAnimationRate; enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
      const speedScale = heroCore.updateEnemyBehavior(enemy, dt, {
        onTear: (cryingEnemy) => {
          if (Math.abs(cryingEnemy.x - player.x) > canvas.width) return;
          spawnBurst(cryingEnemy.x - game.cameraX + cryingEnemy.w / 2, cryingEnemy.y + 14, '#65d8ff', 3);
        },
      });
      enemy.previousY = enemy.y;
      enemy.x += enemy.dir * enemy.baseSpeed * speedScale * dt; if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) { enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX); enemy.dir *= -1; }
      if (!intersects(player, enemy)) continue;
      if (stompResolvedThisFrame) continue;
      const stomp = heroCore.isStomp(player, enemy, {
        topInset: 6,
        topTolerance: enemy.bounceHelper || enemy.behaviorType === 'onion' ? Math.max(38, 54) : heroPhysics.stompTopTolerance,
        previousBottom: previousPlayerBottom,
        previousTargetTop: previousEnemyTop,
      });
      if (stomp) { stompResolvedThisFrame = true; defeatEnemy(enemy, true); }
      else if (sharedAbilities.isFrenzy(game.abilities)) defeatEnemy(enemy, false);
      else if (enemy.bounceHelper) continue;
      else if (player.invulnerable <= 0) { player.invulnerable = 1.2; player.vx = player.x < enemy.x ? -260 : 260; player.vy = -390; game.hearts -= 1; game.cameraShake = 8; sfx(120, .22, 'sawtooth', .05, -40); if (game.hearts <= 0) { game.hearts = 3; beginRespawn(); } }
    }
  }

  function defeatEnemy(enemy, stomped = true) {
    if (!enemy.alive || enemy.defeated) return;
    enemy.defeated = true; enemy.defeatTimer = .34; game.defeated += 1;
    const authoredReward = enemy.rewardProfile || heroCore.getEnemyRewardProfile(enemy);
    game.score += (enemy.bounceHelper ? 300 : 180) + Math.round(Math.max(0, Number(authoredReward?.score) || 0) * .12);
    if (stomped) {
      game.splatCombo = game.splatTimer > 0 ? game.splatCombo + 1 : 1; game.splatTimer = 2.1; game.bestSplat = Math.max(game.bestSplat, game.splatCombo);
      player.y = Math.min(player.y, enemy.y - player.h - 1);
      player.vy = -heroPhysics.enemyBounceVelocity;
    }
    const feedback = heroCore.splatFeedback(Math.max(1, game.splatCombo), stomped);
    sharedAbilities.splatEnemy(game.abilities); spawnBurst(enemy.x - game.cameraX + enemy.w / 2, enemy.y + 12, ['#65d8ff', '#ffd65a', '#ff6fae'][game.defeated % 3], 24);
    impactText(enemy.x + enemy.w / 2, enemy.y - 8, feedback.text, feedback.color, feedback.size);
    if (stomped) {
      heroCore.celebrateSplatCombo(game.splatCombo, {
        reduced: game.reducedShake,
        onCelebrate: (reward) => {
          const screenX = enemy.x - game.cameraX + enemy.w / 2;
          spawnConfetti(screenX, enemy.y + enemy.h / 2, reward.confetti);
          reward.burstColors.forEach((color, index) => spawnBurst(screenX, enemy.y + 12 - index * 5, color, reward.tier === 'supremacy' ? 34 : 18));
          showMessage(reward.label, reward.duration);
          game.hitStop = Math.max(game.hitStop, reward.hitStop);
          game.cameraShake = Math.max(game.cameraShake, reward.shake);
          sfx(reward.tier === 'supremacy' ? 510 : 690, reward.tier === 'supremacy' ? .26 : .14, 'triangle', reward.tier === 'supremacy' ? .065 : .045, reward.tier === 'supremacy' ? 650 : 270);
        },
      });
    }
    const rewardCount = Math.max(2, Math.min(6, Number(authoredReward?.tacoCount) || (enemy.bounceHelper ? 3 : 2)));
    for (let i = 0; i < rewardCount; i += 1) addItem(enemy.x + i * 24, enemy.y - 24, 'taco', { bonusReward: true, dynamic: true, vx: (i - (rewardCount - 1) / 2) * 120, vy: -260 - i * 42, angle: i });
    sfx(180 + game.defeated % 5 * 60, .14, 'triangle', .05, 180);
  }

  function launchPinataRewardWave(pinata, count, wave = 0) {
    for (let index = 0; index < count; index += 1) {
      const spread = count === 1 ? .5 : index / (count - 1);
      const direction = spread * 2 - 1;
      const speed = 185 + (index % 5) * 36 + wave * 24;
      const rainbowReward = wave === 0 ? [3, 10, 17].includes(index) : [2, 7].includes(index);
      addItem(pinata.x + pinata.w / 2 - 12, pinata.y + 18, 'taco', {
        bonusReward: true, pinataReward: true, rainbowReward, pinataWave: wave + 1,
        dynamic: true, bounces: 0, vx: direction * speed,
        vy: -335 - Math.sin(spread * Math.PI) * (150 + wave * 35) - (index % 3) * 18,
        angle: index * .68 + wave * .35,
      });
    }
  }

  function hitPinata() {
    const pinata = world.pinata; if (!pinata || pinata.broken || pinata.hitCooldown > 0) return;
    pinata.hits += 1; pinata.wobble = .7; pinata.hitCooldown = .36; player.y = pinata.y - player.h - 2; player.vy = -740;
    game.score += 450 * pinata.hits; game.cameraShake = 5 + pinata.hits * 2;
    spawnBurst(pinata.x - game.cameraX + pinata.w / 2, pinata.y + 30, ['#65d8ff', '#ff6fae', '#ffd65a'][pinata.hits - 1], 22 + pinata.hits * 8);
    sfx(170 + pinata.hits * 70, .17, 'triangle', .055, 210);
    if (pinata.hits < pinata.targetHits) {
      showMessage(`PIÑATA STOMP ${pinata.hits}/3 — ${3 - pinata.hits} MORE FOR KABOOM!`, 2.1);
      return;
    }
    pinata.broken = true; game.hitStop = .24; game.cameraShake = game.reducedShake ? 7 : 22;
    game.pinataBurst = {
      x: pinata.x + pinata.w / 2, y: pinata.y + 34, timer: 3.4, maxTimer: 3.4,
      aftershockTriggered: false, finaleTriggered: false, rewardWaves: 1,
    };
    const screenX = pinata.x - game.cameraX + pinata.w / 2;
    showMessage('KABOOM! RAINBOW TACO JACKPOT!', 3.7);
    spawnConfetti(screenX, pinata.y + 26, game.reducedShake ? 95 : 205);
    ['#fff5a8', '#ff6fae', '#65d8ff'].forEach((color, index) => spawnBurst(screenX, pinata.y + 24, color, game.reducedShake ? 22 + index * 4 : 48 + index * 16));
    launchPinataRewardWave(pinata, 22, 0);
    sfx(76, .58, 'sine', .09, -18); setTimeout(() => sfx(185, .27, 'square', .065, 330), 65);
    [440, 554, 659, 880, 1047].forEach((note, index) => setTimeout(() => sfx(note, .14, 'triangle', .04, 180), 145 + index * 62));
  }

  function updatePinata(dt) {
    const pinata = world.pinata; if (!pinata) return;
    pinata.hitCooldown = Math.max(0, pinata.hitCooldown - dt); pinata.wobble = Math.max(0, pinata.wobble - dt);
    if (game.pinataBurst) {
      const burst = game.pinataBurst; burst.timer -= dt; const elapsed = burst.maxTimer - burst.timer;
      if (!burst.aftershockTriggered && elapsed >= .82) {
        burst.aftershockTriggered = true; burst.rewardWaves = 2;
        const screenX = burst.x - game.cameraX;
        game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 14);
        spawnConfetti(screenX, burst.y - 8, game.reducedShake ? 65 : 135);
        ['#9bef70', '#65d8ff', '#b78cff', '#ff6fae'].forEach((color, index) => spawnBurst(screenX, burst.y, color, game.reducedShake ? 12 + index * 2 : 25 + index * 7));
        launchPinataRewardWave(pinata, 10, 1);
        spawnFireworkAt(screenX - 105, burst.y - 95, .8); spawnFireworkAt(screenX + 105, burst.y - 110, .8);
        sfx(118, .42, 'sine', .07, 65); setTimeout(() => sfx(620, .18, 'triangle', .05, 410), 85);
      }
      if (!burst.finaleTriggered && elapsed >= 1.62) {
        burst.finaleTriggered = true;
        spawnFireworkAt(burst.x - game.cameraX - 165, burst.y - 130, 1); spawnFireworkAt(burst.x - game.cameraX, burst.y - 175, 1.15); spawnFireworkAt(burst.x - game.cameraX + 165, burst.y - 130, 1);
        [784, 988, 1175, 1568].forEach((note, index) => setTimeout(() => sfx(note, .18, 'triangle', .035, 90), index * 74));
      }
      if (burst.timer <= 0) game.pinataBurst = null;
    }
    if (pinata.broken || pinata.hitCooldown > 0 || !intersects(player, pinata)) return;
    const stomp = player.vy > 65 && player.y + player.h - pinata.y < 34;
    if (stomp) hitPinata();
  }

  function collectItem(item) {
    item.collected = true;
    if (item.type === 'airmail') {
      game.airMail += 1; game.airMailComplete = game.airMail >= game.airMailTotal; game.score += 900 + game.airMail * 180;
      showMessage(game.airMailComplete ? 'AIR MAIL 5/5! SPECIAL DELIVERY FIESTA UNLOCKED!' : `AIR MAIL ${game.airMail}/5 — SPECIAL DELIVERY!`, game.airMailComplete ? 3 : 2.1);
      spawnConfetti(item.x - game.cameraX, item.y, game.airMailComplete ? 110 : 52); spawnBurst(item.x - game.cameraX, item.y, '#65d8ff', 28); sfx(520, .18, 'triangle', .055, 420); setTimeout(() => sfx(780, .14, 'sine', .04, 300), 90); return;
    }
    if (item.type === 'magnet') { sharedAbilities.activateMagnet(game.abilities); game.score += 450; showMessage('TACO MAGNET! CLEAR THE SKY!', 1.8); spawnConfetti(item.x - game.cameraX, item.y, 42); sfx(330, .2, 'sine', .05, 620); return; }
    if (item.rainbowReward) { sharedAbilities.activateMagnet(game.abilities); game.score += 550; showMessage('RAINBOW TACO! JACKPOT MAGNET!', 1.9); spawnConfetti(item.x - game.cameraX, item.y, 34); sfx(760, .16, 'triangle', .045, 360); }
    if (item.planeDrop) {
      game.airDrop.caught += 1; game.score += 90;
      if (game.airDrop.caught === 4 || game.airDrop.caught === 8) {
        showMessage(game.airDrop.caught === 4 ? 'AIRBORNE TACO COMBO!' : 'OLIVIA DROP STREAK!', 1.55);
        spawnConfetti(item.x - game.cameraX, item.y, 28 + game.airDrop.caught * 2); sfx(720 + game.airDrop.caught * 18, .14, 'triangle', .04, 310);
      }
    }
    game.skyStreak.count += 1; game.skyStreak.best = Math.max(game.skyStreak.best, game.skyStreak.count); game.skyStreak.timer = 2.35; game.skyStreak.decayTimer = .62;
    if ([8, 18, 32].includes(game.skyStreak.count)) { const call = game.skyStreak.count === 8 ? 'TACO TRAIL!' : game.skyStreak.count === 18 ? 'SKY STREAK!' : 'SUPERSONIC SALSA!'; showMessage(call, 1.55); spawnConfetti(item.x - game.cameraX, item.y, 24 + game.skyStreak.count); sfx(680 + game.skyStreak.count * 8, .16, 'triangle', .045, 260); }
    if (!item.bonusReward) game.collected += 1; const streakMultiplier = 1 + Math.min(4, Math.floor(game.skyStreak.count / 8)); const multiplier = (sharedAbilities.isFrenzy(game.abilities) ? 3 : 1) * streakMultiplier; game.score += (item.bonusReward ? 35 : 10) * multiplier;
    const frenzy = sharedAbilities.collectTaco(game.abilities, item.bonusReward); if (frenzy) { showMessage('TACO FRENZY! MAXIMUM CRUNCH!', 2.1); spawnConfetti(canvas.width / 2, 190, 90); game.cameraShake = 9; sfx(390, .3, 'triangle', .06, 720); }
    const magnetCascade = sharedAbilities.hasMagnet(game.abilities);
    spawnBurst(item.x - game.cameraX, item.y, '#ffd65a', magnetCascade ? 3 : 7);
    if (!magnetCascade || game.levelTime - game.lastCollectSfxAt >= .09) { sfx(610 + game.collected % 6 * 35, .055, 'triangle', .025, 90); game.lastCollectSfxAt = game.levelTime; }
  }

  function updateItems(dt) {
    for (const item of world.collectibles) {
      if (item.dynamic && !item.collected) {
        item.x += item.vx * dt; item.y += item.vy * dt; item.vy += 760 * dt; item.angle += dt * 7;
        if ((item.pinataReward || item.planeDrop) && item.y >= GROUND_Y - item.h - 2 && item.vy > 0) {
          item.y = GROUND_Y - item.h - 2; item.bounces = (item.bounces || 0) + 1;
          const maxBounces = item.planeDrop ? 2 : 3;
          if (item.bounces >= maxBounces) { item.dynamic = false; item.vx = 0; item.vy = 0; item.angle = 0; }
          else { item.vy = -Math.max(135, item.vy * .52); item.vx *= .78; }
        } else if (item.y > 525) item.collected = true;
      }
    }
    if (sharedAbilities.hasMagnet(game.abilities)) {
      const radius = sharedAbilities.definitions.tacoMagnet.radius;
      for (const item of world.collectibles) {
        if (item.collected || item.type !== 'taco') continue; const dx = player.x + 17 - (item.x + 12); const dy = player.y + 21 - (item.y + 12); const distance = Math.hypot(dx, dy);
        if (distance > radius || distance < 1) continue; const pull = 7 + (1 - distance / radius) * 17; item.x += dx * dt * pull; item.y += dy * dt * pull;
      }
    }
  }

  function updateSkyStreak(dt) {
    if (game.skyStreak.count <= 0) return;
    if (game.skyStreak.timer > 0) { game.skyStreak.timer = Math.max(0, game.skyStreak.timer - dt); return; }
    game.skyStreak.decayTimer -= dt; if (game.skyStreak.decayTimer <= 0) { game.skyStreak.count = Math.max(0, game.skyStreak.count - 1); game.skyStreak.decayTimer = .62; }
  }

  function updateCheckpoints() {
    world.checkpoints.forEach((checkpoint) => {
      if (checkpoint.activated || Math.abs(player.x - checkpoint.x) > 100) return; checkpoint.activated = true; game.latestCheckpoint = checkpoint;
      showMessage(`⚠ ${checkpoint.sign}`, 2.5); game.radioQueue = checkpoint.radio; game.radioDelay = 2.15; spawnConfetti(checkpoint.x - game.cameraX + 60, 250, 55); sfx(520, .18, 'triangle', .045, 430);
    });
  }

  function flybyPlanePosition(flyby) {
    const t = flyby.timer; const direction = flyby.direction;
    return {
      x: direction < 0 ? canvas.width + 250 - t * 205 : -250 + t * 205,
      y: (direction > 0 ? 112 : flyby.inverted ? 150 : 118) + Math.sin(t * 1.8) * 8,
    };
  }

  function releasePlaneDropTaco(flyby) {
    const plane = flybyPlanePosition(flyby); const dropIndex = flyby.dropsReleased;
    addItem(game.cameraX + plane.x - 12 - flyby.direction * 28, plane.y + 27 + (dropIndex % 3 - 1) * 5, 'taco', {
      bonusReward: true, planeDrop: true, dynamic: true, bounces: 0,
      vx: flyby.direction * (58 + dropIndex % 4 * 8), vy: 28 + dropIndex % 3 * 16, angle: dropIndex * .72,
    });
    flyby.dropsReleased += 1; game.airDrop.spawned += 1;
    spawnBurst(plane.x - flyby.direction * 25, plane.y + 30, dropIndex % 2 ? '#ffd65a' : '#65d8ff', 5);
    if (dropIndex % 3 === 0) sfx(510 + dropIndex * 14, .08, 'triangle', .024, 150);
  }

  function updatePlaneEvents(dt) {
    if (!game.openingComplete) return;
    let activeFlyby = game.flybys.find((flyby) => flyby.started && !flyby.finished);
    if (!activeFlyby) {
      const nextFlyby = game.flybys.find((flyby) => !flyby.started);
      if (nextFlyby && player.x > nextFlyby.trigger) {
        nextFlyby.started = true; nextFlyby.timer = 0; activeFlyby = nextFlyby;
        showMessage(nextFlyby.intro, 2.1); setMusic('banner');
        sfx(nextFlyby.inverted ? 430 : 330, .22, 'triangle', .045, nextFlyby.inverted ? 440 : 260);
      }
    }
    if (activeFlyby) {
      activeFlyby.timer += dt;
      if (activeFlyby.timer > 1.75 && activeFlyby.timer - dt <= 1.75) showMessage(activeFlyby.text.join(' — '), 3.1);
      if (activeFlyby.tacoDrop) {
        while (activeFlyby.timer >= activeFlyby.nextDropAt && activeFlyby.nextDropAt <= activeFlyby.dropEnd) {
          releasePlaneDropTaco(activeFlyby); activeFlyby.nextDropAt += activeFlyby.dropInterval;
        }
        if (!activeFlyby.dropCompleteAnnounced && activeFlyby.timer > activeFlyby.dropEnd) {
          activeFlyby.dropCompleteAnnounced = true; showMessage('OLIVIA: “SPECIAL DELIVERY! CATCH RESPONSIBLY!”', 2.65);
          spawnConfetti(canvas.width * .72, 148, 34); sfx(680, .17, 'triangle', .04, 350);
        }
      }
      if (activeFlyby.timer > 7.4) {
        activeFlyby.finished = true;
        if (activeFlyby.inverted) { showMessage('OLIVIA: “THE CLOUDS LOOK GREAT FROM DOWN HERE!”', 2.6); spawnConfetti(160, 120, 34); }
        setMusic(currentSection(player.x).music);
      }
    }

    if (game.ambush.stage === 0 && player.x > 22900 && game.flybys.every((flyby) => flyby.finished)) { game.ambush.stage = 1; game.ambush.timer = 0; showMessage('UNIDENTIFIED GUAC ACTIVITY AHEAD!', 2.4); setMusic('ambush'); }
    if (game.ambush.stage === 1) {
      game.ambush.timer += dt;
      if (game.ambush.timer > 3.45) { game.ambush.stage = 2; game.ambush.projectile = 0; showMessage('INCOMING GUACAMOLE!', 2.3); sfx(120, .35, 'sawtooth', .06, 180); }
    } else if (game.ambush.stage === 2) {
      game.ambush.projectile += dt / 1.25;
      if (game.ambush.projectile >= 1) {
        game.ambush.stage = 3; game.ambush.timer = 0; game.ambush.hitFlash = .85; game.ambush.musicDrop = .62; game.hitStop = .17; game.cameraShake = 16; spawnBurst(500, 122, '#9bef70', game.reducedShake ? 28 : 72); stopMusic();
        showMessage('GUAC-KRAK! DIRECT HIT!', 2.8); sfx(82, .52, 'sawtooth', .085, -20); setTimeout(() => sfx(380, .3, 'square', .045, -250), 100); setTimeout(() => sfx(125, .48, 'sawtooth', .04, 70), 230);
      }
    } else if (game.ambush.stage === 3 && !game.rescueActive) {
      game.ambush.timer += dt; if (game.ambush.musicDrop > 0) { game.ambush.musicDrop = Math.max(0, game.ambush.musicDrop - dt); if (game.ambush.musicDrop === 0) setMusic('ambush', true); }
    }
    game.ambush.hitFlash = Math.max(0, game.ambush.hitFlash - dt);
    if (!game.rescueActive && player.x >= 27000 && game.ambush.stage >= 3) { game.rescueActive = true; game.rescuePhase = 0; showMessage('PHASE 1 — CATCH THE SMOKE TRAIL!', 3); setMusic('rescue'); spawnConfetti(canvas.width * .55, 180, 90); sfx(250, .25, 'triangle', .055, 650); }
    if (game.rescueActive && !game.crashLanded) {
      const progress = clamp((player.x - 27000) / 5200, 0, 1); const phase = progress >= .68 ? 2 : progress >= .34 ? 1 : 0;
      if (phase > game.rescuePhase) { game.rescuePhase = phase; showMessage(phase === 1 ? 'PHASE 2 — KEEP UP WITH OLIVIA!' : 'PHASE 3 — EMERGENCY LANDING AHEAD!', 2.8); spawnConfetti(canvas.width * .58, 175, 55 + phase * 20); sfx(360 + phase * 120, .22, 'triangle', .055, 440); }
    }
    if (game.rescueActive && !game.crashLanded && player.x > 32020) {
      game.crashLanded = true; game.crashTimer = 0; game.cameraShake = 20; showMessage('EMERGENCY TACO LANDING!', 2.8); spawnBurst(820, 360, '#ff8d57', game.reducedShake ? 45 : 100); sfx(78, .7, 'sine', .1, -20); setTimeout(() => sfx(170, .35, 'sawtooth', .055, -90), 80);
    }
    if (game.crashLanded) { game.crashTimer += dt; if (player.x > 32620 && game.sectionIndex < 6) { game.sectionIndex = 6; setMusic('fiesta'); showMessage(game.landingQuip, 3.7); } }
  }

  function maybeFinish() {
    if (game.state !== 'playing' || !game.crashLanded || !intersects(player, world.goal)) return;
    game.state = 'celebrating'; game.finishTime = performance.now(); game.celebrationTime = 0; game.partyBeat = -1; player.vx = 0; setMusic('fiesta');
    const seconds = (game.finishTime - game.startTime) / 1000; const completion = game.totalTacos ? game.collected / game.totalTacos : 0;
    game.score += Math.round(2500 + completion * 3000 + game.defeated * 90 + game.airMail * 500 + (game.airMailComplete ? 2500 : 0));
    const medal = completion >= .88 ? 'TACO ACE' : completion >= .62 ? 'SKY RESCUER' : 'RUNWAY ROOKIE';
    const isBest = !game.personalBest.runs || game.score > game.personalBest.score;
    game.personalBest.runs += 1; if (isBest) game.personalBest = { score: game.score, time: seconds, runs: game.personalBest.runs, medal };
    ui.medalBadge.textContent = medal; ui.resultScore.textContent = game.score.toLocaleString(); ui.resultTime.textContent = formatTime(seconds); ui.resultTacos.textContent = `${game.collected}/${game.totalTacos}`;
    ui.resultSplats.textContent = String(game.defeated); ui.resultAirMail.textContent = `${game.airMail}/${game.airMailTotal}`; ui.resultRescue.textContent = 'Olivia safe!'; ui.resultPlane.textContent = 'Extra crispy';
    ui.winText.textContent = game.airMailComplete ? 'SPECIAL DELIVERY: ONE SLIGHTLY TOASTED PILOT. Olivia and every envelope arrived taco-side up.' : 'Olivia is completely fine. The plane is toast. The tacos are excellent.'; ui.newBestText.classList.toggle('hidden', !isBest); saveProgress(); updatePersonalBest();
  }

  function updateCelebration(dt) {
    game.celebrationTime += dt; player.anim += dt * 8; player.x = lerp(player.x, world.goal.x + 20, Math.min(1, dt * 2));
    game.cameraX = clamp(world.goal.x - canvas.width * .58, 0, WORLD_WIDTH - canvas.width); const beat = Math.floor(game.celebrationTime * 2.4);
    if (beat !== game.partyBeat) { game.partyBeat = beat; spawnConfetti(beat % 2 ? 120 : 840, 220, game.reducedShake ? 18 : 42); if (random() > .55) spawnFirework(); sfx([523, 659, 784, 1047][beat % 4], .1, 'triangle', .03, 90); }
    if (game.celebrationTime > 7) {
      game.state = 'won'; ui.winOverlay.classList.remove('hidden'); ui.winOverlay.classList.add('visible');
      requestAnimationFrame(() => ui.winOverlay.querySelector('[data-next-level]')?.focus());
    }
  }

  function impactText(worldX, y, text, color, size = 27) {
    game.impactTexts.push({ x: worldX, y, text, color, size, life: 1.05, vy: -58 });
  }

  function updateParticles(dt) {
    game.particles = game.particles.filter((particle) => { particle.life -= dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += particle.gravity * dt; return particle.life > 0; });
    game.confetti = game.confetti.filter((particle) => { particle.life -= dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 240 * dt; particle.angle += particle.spin * dt; return particle.life > 0; });
    game.fireworks = game.fireworks.filter((particle) => { particle.life -= dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 80 * dt; return particle.life > 0; });
    game.impactTexts = game.impactTexts.filter((text) => { text.life -= dt; text.y += text.vy * dt; text.vy *= .93; return text.life > 0; });
  }

  function spawnBurst(x, y, color, count = 18) {
    const limit = firstFlybyActive() ? 160 : 480; const safeCount = Math.max(0, Math.min(count, limit - game.particles.length)); game.effectsTrimmed += count - safeCount;
    for (let i = 0; i < safeCount; i += 1) game.particles.push({ x, y, vx: (random() - .5) * 320, vy: -80 - random() * 280, gravity: 620, life: .45 + random() * .65, maxLife: 1, color, size: 2 + random() * 6 });
  }
  function spawnConfetti(x, y, count = 40) {
    const colors = ['#65d8ff', '#ff6fae', '#ffd65a', '#8dff9c', '#b78cff', '#ff8d57']; const limit = firstFlybyActive() ? 120 : 420; const safeCount = Math.max(0, Math.min(count, limit - game.confetti.length)); game.effectsTrimmed += count - safeCount;
    for (let i = 0; i < safeCount; i += 1) game.confetti.push({ x, y, vx: (random() - .5) * 520, vy: -120 - random() * 420, life: 1.2 + random() * 1.5, color: colors[i % colors.length], size: 4 + random() * 6, angle: random() * 6, spin: (random() - .5) * 10 });
  }
  function spawnFireworkAt(x, y, scale = 1) {
    const colors = ['#65d8ff', '#ff6fae', '#ffd65a', '#9bef70', '#b78cff', '#ff8d57']; const count = game.reducedShake ? 18 : 32;
    for (let i = 0; i < count; i += 1) { const angle = i / count * Math.PI * 2; const speed = (75 + random() * 145) * scale; game.fireworks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .85 + random() * .75, color: colors[i % colors.length], size: 2.4 + random() * 2.4 }); }
  }
  function spawnFirework() { spawnFireworkAt(160 + random() * 640, 80 + random() * 170, 1); }

  function update(dt) {
    updateMusic(dt); if (game.settingsOpen) { updateParticles(dt * .1); return; } if (game.hitStop > 0) { game.hitStop -= dt; return; }
    if (previewControllerQa && game.state === 'playing' && !game.controllerQaResetDone && inputSources.controller.right && player.x > previewStart + 40) {
      game.controllerQaResetDone = true;
      clearInputs('controller-qa-reset');
    }
    game.messageTimer = Math.max(0, game.messageTimer - dt); game.cameraShake = Math.max(0, game.cameraShake - dt * 36); game.splatTimer = Math.max(0, game.splatTimer - dt); if (game.splatTimer <= 0) game.splatCombo = 0; sharedAbilities.update(game.abilities, dt);
    if (game.radioQueue) { game.radioDelay = Math.max(0, game.radioDelay - dt); if (game.radioDelay === 0) { showMessage(`📻 OLIVIA: ${game.radioQueue}`, 3.2); game.radioQueue = ''; } }
    if (game.state === 'playing' || game.state === 'respawning') { game.levelTime += dt; updateMovingPlatforms(dt); }
    if (game.state === 'respawning') updateRespawn(dt);
    if (game.state === 'playing') {
      updateOpening(dt); updatePlayer(dt); updateEnemies(dt); updatePinata(dt); updateItems(dt); updateSkyStreak(dt); updateCheckpoints(); updatePlaneEvents(dt);
      world.collectibles.forEach((item) => { if (!item.collected && intersects(player, item)) collectItem(item); });
      const nextSection = Math.max(0, sections.findIndex((section) => player.x >= section.start && player.x < section.end));
      if (nextSection !== game.sectionIndex && !(nextSection === 6 && !game.crashLanded)) {
        game.sectionIndex = nextSection; const section = sections[nextSection]; setMusic(section.music);
        const calls = ['BOARDING NOW!', 'OPEN SKY, EASY TACOS!', 'READ THE BANNER!', 'CRUISE THE HIGH DESERT!', 'GUAC ALERT!', 'CATCH OLIVIA!', 'TACOS SAVED!'];
        showMessage(`${section.name.toUpperCase()} — ${calls[nextSection]}`, 2.5); spawnConfetti(690, 180, nextSection === 5 ? 90 : 45);
      }
      if (game.openingComplete) {
        const offset = game.rescueActive ? .4 : .42; game.cameraX = lerp(game.cameraX, clamp(player.x - canvas.width * offset, 0, WORLD_WIDTH - canvas.width), Math.min(1, dt * 8.5));
      }
      maybeFinish();
    } else if (game.state === 'celebrating') updateCelebration(dt);
    updateParticles(dt);
  }

  function drawBackground(time) {
    world1Background.draw({
      cameraX: game.cameraX,
      playerX: player.x,
      time: game.levelTime,
      reducedMotion: game.reducedShake,
      rescueActive: game.rescueActive,
      crashLanded: game.crashLanded,
    });
  }

  function drawRescueSpeedFX(time) {
    if (!game.rescueActive || game.crashLanded) return;
    const phase = Math.max(0, game.rescuePhase); const intensity = 1 + phase * .32; ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 28 + phase * 8; i += 1) {
      const laneY = 74 + ((i * 61) % 340); const x = canvas.width - ((time * .7 + i * 83) % (canvas.width + 180)); const length = 34 + (i % 6) * 17;
      ctx.strokeStyle = i % 3 === 0 ? `rgba(255,241,166,${.55 + phase * .1})` : `rgba(101,216,255,${.34 + phase * .08})`; ctx.lineWidth = i % 4 === 0 ? 4 : 2; ctx.beginPath(); ctx.moveTo(x, laneY); ctx.lineTo(x - length * intensity, laneY); ctx.stroke();
    }
    const edge = ctx.createLinearGradient(0, 0, canvas.width, 0); edge.addColorStop(0, 'rgba(255,95,145,.16)'); edge.addColorStop(.18, 'rgba(255,95,145,0)'); edge.addColorStop(.82, 'rgba(101,216,255,0)'); edge.addColorStop(1, 'rgba(101,216,255,.16)'); ctx.fillStyle = edge; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const phaseLabels = ['CATCH THE SMOKE TRAIL', 'KEEP UP WITH OLIVIA', 'EMERGENCY LANDING AHEAD']; ctx.fillStyle = 'rgba(32,29,61,.38)'; ctx.strokeStyle = ['#65d8ff', '#ffd65a', '#ff8d57'][phase]; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(canvas.width / 2 - 205, 150, 410, 40, 20); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff1a6'; ctx.textAlign = 'center'; ctx.font = '900 16px Arial'; ctx.fillText(`TURBO RESCUE ${phase + 1}/3  •  ${phaseLabels[phase]}`, canvas.width / 2, 176); ctx.restore();
  }

  function drawPaintedTerrainSlice(imageAsset, screenX, y, width, height, sourceCap) {
    const sourceWidth = imageAsset.naturalWidth || imageAsset.width;
    const sourceHeight = imageAsset.naturalHeight || imageAsset.height;
    const scale = height / sourceHeight;
    const naturalCap = sourceCap * scale;
    const destinationCap = Math.min(naturalCap, width * .32);
    const centerSourceWidth = Math.max(1, sourceWidth - sourceCap * 2);
    const centerDestinationWidth = Math.max(0, width - destinationCap * 2);

    ctx.drawImage(imageAsset, 0, 0, sourceCap, sourceHeight, screenX, y, destinationCap, height);
    if (centerDestinationWidth > .5) {
      ctx.drawImage(
        imageAsset,
        sourceCap, 0, centerSourceWidth, sourceHeight,
        screenX + destinationCap, y, centerDestinationWidth + .5, height,
      );
    }
    ctx.drawImage(
      imageAsset,
      sourceWidth - sourceCap, 0, sourceCap, sourceHeight,
      screenX + width - destinationCap, y, destinationCap, height,
    );
  }

  function drawPlatform(platform, time) {
    if (platform.x + platform.w < game.cameraX - 80 || platform.x > game.cameraX + canvas.width + 80) return;
    const x = platform.x - game.cameraX;
    const y = platform.y;
    let art = null;
    if (platform.ground) {
      if (platform.style === 'runway') art = images.world1_2_ground_airfield_v1;
      else if (platform.style === 'sunny-soil') art = images.world1_2_ground_sunny_v1;
      else if (platform.style === 'banner-soil') art = images.world1_2_ground_banner_v1;
      else if (platform.style === 'mesa-soil') art = images.world1_2_ground_mesa_v1;
      else if (platform.style === 'guac-road') art = images.world1_2_ground_guac_v1;
      else if (platform.style === 'rescue-runway') art = images.world1_2_ground_rescue_v1;
    } else if (platform.style === 'wing') art = images.world1_2_platform_wing_v1;
    else if (platform.style === 'adobe-ledge') art = images.world1_2_platform_adobe_v1;
    else if (platform.style === 'guac-sign') art = images.world1_2_platform_guac_v1;
    const artHeight = platform.ground ? Math.max(108, platform.h + 18) : Math.max(42, platform.h + 18);
    const artY = y - (platform.ground ? 6 : 5);
    const smoothing = ctx.imageSmoothingEnabled;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 1, artY - 2, platform.w + 2, artHeight + 4);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    if (art) {
      drawPaintedTerrainSlice(art, x, artY, platform.w, artHeight, platform.ground ? 112 : 170);
    } else {
      ctx.fillStyle = platform.ground ? '#70433e' : '#b76b51';
      ctx.fillRect(x, y, platform.w, platform.h);
    }
    ctx.imageSmoothingEnabled = smoothing;
    ctx.restore();

    // A two-pixel contact highlight preserves the playable silhouette without
    // flattening the hand-painted top surface.
    ctx.save();
    ctx.globalAlpha = platform.ground ? .72 : .58;
    ctx.fillStyle = platform.style === 'guac-road' || platform.style === 'guac-sign'
      ? '#baff62'
      : platform.style === 'rescue-runway'
        ? '#65d8ff'
        : '#fff1a6';
    ctx.fillRect(Math.floor(x + 7), Math.floor(y), Math.max(0, platform.w - 14), 2);
    if (platform.moving) {
      const pulse = (Math.sin(time * .01) + 1) * .5;
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#65d8ff';
      ctx.shadowBlur = 10 + pulse * 6;
      ctx.fillStyle = '#fff5c8';
      ctx.beginPath();
      ctx.arc(x + 12, y + platform.h * .58, 3 + pulse * 1.2, 0, Math.PI * 2);
      ctx.arc(x + platform.w - 12, y + platform.h * .58, 3 + (1 - pulse) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCollectible(item, time) {
    if (item.collected || item.x < game.cameraX - 60 || item.x > game.cameraX + canvas.width + 60) return; const x = item.x - game.cameraX; const y = item.y + Math.sin(time * .005 + item.bob) * 4;
    ctx.save(); ctx.translate(x + item.w / 2, y + item.h / 2);
    if (item.planeDrop) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(101,216,255,${.62 + Math.sin(time * .012 + item.bob) * .18})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 18 + Math.sin(time * .01 + item.bob) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,214,90,.52)'; ctx.lineWidth = 3; for (let trail = 0; trail < 3; trail += 1) { ctx.beginPath(); ctx.moveTo(-7 + trail * 7, -18); ctx.lineTo(-7 + trail * 7, -34 - trail * 5); ctx.stroke(); } ctx.restore();
    }
    if (item.dynamic) ctx.rotate(item.angle || 0);
    if (item.type === 'taco') {
      if (item.bonusReward) { ctx.shadowColor = item.rainbowReward ? ['#ff6fae', '#65d8ff', '#ffd65a'][Math.floor(time / 110) % 3] : '#ffd65a'; ctx.shadowBlur = item.rainbowReward ? 25 : 15; }
      ctx.drawImage(images.items, 0, 0, 16, 16, -item.w / 2, -item.h / 2, item.w, item.h);
      if (item.rainbowReward) { ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = ctx.shadowColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 17 + Math.sin(time * .01) * 3, 0, Math.PI * 2); ctx.stroke(); }
    }
    else if (item.type === 'airmail') {
      ctx.rotate(Math.sin(time * .004 + item.bob) * .08); ctx.shadowColor = '#65d8ff'; ctx.shadowBlur = 24; const gradient = ctx.createLinearGradient(-15, -12, 15, 15); gradient.addColorStop(0, '#fffbe0'); gradient.addColorStop(1, '#ffd77b'); ctx.fillStyle = gradient; ctx.strokeStyle = '#3b3157'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-17, -12, 34, 24, 5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#ff6fae'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, -9); ctx.lineTo(0, 3); ctx.lineTo(15, -9); ctx.stroke(); ctx.fillStyle = '#65d8ff'; ctx.fillRect(8, 5, 6, 5); ctx.fillStyle = '#312b4f'; ctx.font = '900 8px Arial'; ctx.textAlign = 'center'; ctx.fillText(String(item.mailIndex), 0, 10);
      ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 23 + Math.sin(time * .008) * 3, 0, Math.PI * 2); ctx.stroke();
    } else { ctx.shadowColor = '#65d8ff'; ctx.shadowBlur = 20; ctx.strokeStyle = '#fff5c8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, -2, 10, 0, Math.PI); ctx.stroke(); ctx.strokeStyle = '#ff6fae'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-10, 11); ctx.moveTo(10, -2); ctx.lineTo(10, 11); ctx.stroke(); ctx.fillStyle = '#65d8ff'; ctx.fillRect(-14, 8, 8, 6); ctx.fillRect(6, 8, 8, 6); }
    ctx.restore();
  }

  function remasteredEnemyFrame(enemy) {
    if (enemy.defeated) return enemy.defeatTimer > .22 ? 6 : 7;
    if (enemy.telegraph) return 4;
    const airborneSpecial = (enemy.behaviorType === 'onion' || enemy.behaviorType === 'jalapeno') && enemy.y < enemy.baseY - 2;
    if (enemy.charging || enemy.rolling || airborneSpecial) return 5;
    return Math.floor(enemy.anim || 0) % 4;
  }

  function drawEnemy(enemy) {
    if (!enemy.alive || enemy.x < game.cameraX - 90 || enemy.x > game.cameraX + canvas.width + 90) return;
    const x = enemy.x - game.cameraX;
    const groundY = enemy.baseY + enemy.h;
    const anchorY = enemy.defeated ? groundY : enemy.y + enemy.h;
    const sprite = images[enemySpriteArt[enemy.type]];

    ctx.save();
    ctx.globalAlpha = .16;
    ctx.fillStyle = '#231a31';
    ctx.beginPath();
    ctx.ellipse(x + enemy.w / 2, groundY + 2, enemy.defeated ? 22 : 15, enemy.defeated ? 5 : 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (enemy.bounceHelper && !enemy.defeated) {
      const pulse = 1 + Math.sin(enemy.clock * 8) * .08;
      ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.ellipse(x + enemy.w / 2, groundY + 2, 25 * pulse, 7 * pulse, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (!enemy.defeated) heroCore.drawEnemyBehaviorSignals(ctx, enemy, x);

    ctx.translate(x + enemy.w / 2, anchorY);
    ctx.scale(enemy.dir < 0 ? -1 : 1, 1);
    if (enemy.rolling && enemy.type === 'tomato') ctx.rotate(Math.sin(enemy.rollAngle) * .1);
    if (enemy.defeated) ctx.globalAlpha = clamp(enemy.defeatTimer / .15, 0, 1);
    if (sprite) {
      const sourceW = sprite.naturalWidth / 4;
      const sourceH = sprite.naturalHeight / 2;
      const frame = remasteredEnemyFrame(enemy);
      const artSize = enemy.type === 'onion' || enemy.type === 'queso' ? 70 : 72;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(sprite, (frame % 4) * sourceW, Math.floor(frame / 4) * sourceH, sourceW, sourceH, -artSize / 2, -artSize, artSize, artSize);
    }
    ctx.restore();
  }

  function drawPinata(time) {
    const pinata = world.pinata; if (!pinata) return; const x = pinata.x - game.cameraX; if (x < -180 || x > canvas.width + 180) return;
    const centerX = x + pinata.w / 2; const centerY = pinata.y + pinata.h / 2; ctx.save();
    // A tiny illuminated air-show gantry keeps the piñata grounded and makes
    // its three-stomp interaction readable without blocking the lower route.
    ctx.strokeStyle = '#3a2a4c'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 32, GROUND_Y); ctx.lineTo(x - 32, pinata.y - 35); ctx.lineTo(x + pinata.w + 32, pinata.y - 35); ctx.lineTo(x + pinata.w + 32, GROUND_Y); ctx.stroke();
    ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 32, GROUND_Y); ctx.lineTo(x - 32, pinata.y - 35); ctx.lineTo(x + pinata.w + 32, pinata.y - 35); ctx.lineTo(x + pinata.w + 32, GROUND_Y); ctx.stroke();
    for (let bulb = 0; bulb < 7; bulb += 1) { ctx.shadowColor = ['#65d8ff', '#ff6fae', '#ffd65a'][bulb % 3]; ctx.shadowBlur = 11; ctx.fillStyle = ctx.shadowColor; ctx.beginPath(); ctx.arc(x - 20 + bulb * 20, pinata.y - 35, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(37,28,60,.94)'; ctx.strokeStyle = '#65d8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 42, pinata.y - 76, 154, 34, 13); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff5c8'; ctx.font = '900 13px Arial'; ctx.textAlign = 'center'; ctx.fillText(pinata.broken ? 'TACO JACKPOT!' : `STOMP 3×  •  ${pinata.hits}/3`, centerX, pinata.y - 54);
    if (pinata.broken) {
      ctx.strokeStyle = '#fff2c5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(centerX, pinata.y - 35); ctx.lineTo(centerX - 10, pinata.y + 4); ctx.stroke();
      ['#65d8ff', '#ff6fae', '#ffd65a', '#9bef70'].forEach((color, index) => { ctx.fillStyle = color; ctx.save(); ctx.translate(centerX - 38 + index * 25, GROUND_Y - 12 - index % 2 * 8); ctx.rotate(index * .55); ctx.fillRect(-9, -5, 18, 10); ctx.restore(); });
      ctx.restore(); return;
    }
    ctx.strokeStyle = '#fff2c5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(centerX, pinata.y - 35); ctx.lineTo(centerX, pinata.y + 2); ctx.stroke();
    const wobble = pinata.wobble > 0 ? Math.sin((.7 - pinata.wobble) * 38) * pinata.wobble * .32 : Math.sin(time * .0024) * .025;
    ctx.translate(centerX, centerY); ctx.rotate(wobble); ctx.shadowColor = '#ff6fae'; ctx.shadowBlur = 18;
    const body = ctx.createLinearGradient(-34, -42, 34, 42); body.addColorStop(0, '#65d8ff'); body.addColorStop(.28, '#8d7cff'); body.addColorStop(.53, '#ff6fae'); body.addColorStop(.76, '#ffd65a'); body.addColorStop(1, '#9bef70');
    ctx.fillStyle = body; ctx.strokeStyle = '#372747'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-31, -31); ctx.quadraticCurveTo(0, -51, 31, -31); ctx.lineTo(35, 22); ctx.quadraticCurveTo(0, 43, -35, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; for (let fringe = -22; fringe <= 20; fringe += 14) { ctx.strokeStyle = fringe % 28 ? '#fff2a8' : '#fff7e0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-29, fringe); ctx.quadraticCurveTo(0, fringe + 7, 29, fringe); ctx.stroke(); }
    // Taco-shell crown, expressive face, paper legs, and an oversized tail.
    ctx.fillStyle = '#ffd65a'; ctx.strokeStyle = '#372747'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -31, 23, Math.PI, 0); ctx.lineTo(23, -29); ctx.lineTo(-23, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9bef70'; for (let topping = -14; topping <= 14; topping += 14) { ctx.beginPath(); ctx.arc(topping, -32, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-12, -4, 8, 0, Math.PI * 2); ctx.arc(12, -4, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b2340'; ctx.beginPath(); ctx.arc(-10, -3, 3, 0, Math.PI * 2); ctx.arc(10, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b2340'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 7, 13, .12, Math.PI - .12); ctx.stroke();
    ctx.fillStyle = '#ff6fae'; ctx.fillRect(-25, 34, 12, 22); ctx.fillStyle = '#65d8ff'; ctx.fillRect(13, 34, 12, 22); ctx.fillStyle = '#ffd65a'; ctx.beginPath(); ctx.moveTo(34, -12); ctx.quadraticCurveTo(57, -24, 61, -3); ctx.quadraticCurveTo(52, 8, 35, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawPinataBurst(time) {
    const burst = game.pinataBurst; if (!burst) return; const x = burst.x - game.cameraX; const y = burst.y; const progress = clamp(1 - burst.timer / burst.maxTimer, 0, 1); const elapsed = burst.maxTimer - burst.timer;
    const colors = ['#ff6fae', '#ff8d57', '#ffd65a', '#9bef70', '#65d8ff', '#b78cff']; ctx.save(); ctx.globalCompositeOperation = 'screen';

    // A quick warm flash makes stomp three feel immediate without obscuring
    // the route for the full celebration.
    if (elapsed < .18) { ctx.globalAlpha = (1 - elapsed / .18) * (game.reducedShake ? .28 : .48); ctx.fillStyle = '#fff4c4'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    // Rotating candy-colored sunburst behind the physical taco shower.
    ctx.save(); ctx.translate(x, y); ctx.rotate(time * .00045); const rayLength = 115 + smoothstep(progress * 2.2) * 185;
    for (let ray = 0; ray < 24; ray += 1) { const angle = ray / 24 * Math.PI * 2; const width = ray % 2 ? .055 : .09; ctx.fillStyle = colors[ray % colors.length]; ctx.globalAlpha = clamp((1 - progress) * .42, 0, .34); ctx.beginPath(); ctx.moveTo(Math.cos(angle - width) * 24, Math.sin(angle - width) * 24); ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength); ctx.lineTo(Math.cos(angle + width) * 24, Math.sin(angle + width) * 24); ctx.closePath(); ctx.fill(); }
    ctx.restore();

    // The first shockwave uses six rings; the aftershock gets its own larger
    // rainbow so the payoff visibly has a second beat.
    colors.forEach((color, index) => {
      const radius = Math.max(2, smoothstep(progress * 2.1) * 255 - index * 14); ctx.globalAlpha = clamp((1 - progress * 1.2) * (.94 - index * .075), 0, 1); ctx.strokeStyle = color; ctx.lineWidth = 10 - index * .8; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
    });
    const aftershockProgress = clamp((elapsed - .82) / 1.25, 0, 1);
    if (aftershockProgress > 0) colors.slice().reverse().forEach((color, index) => {
      const radius = Math.max(2, smoothstep(aftershockProgress) * 330 - index * 16); ctx.globalAlpha = clamp((1 - aftershockProgress) * (.86 - index * .07), 0, 1); ctx.strokeStyle = color; ctx.lineWidth = 8 - index * .55; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
    });

    // Twelve orbiting taco icons turn the burst into an unmistakable jackpot.
    const orbitAlpha = clamp(1 - Math.abs(progress - .34) * 2.5, 0, .9); const orbitRadius = 72 + smoothstep(progress) * 125;
    ctx.globalAlpha = orbitAlpha; for (let taco = 0; taco < 12; taco += 1) { const angle = taco / 12 * Math.PI * 2 + time * .002 * (taco % 2 ? 1 : -1); const tacoX = x + Math.cos(angle) * orbitRadius; const tacoY = y + Math.sin(angle) * orbitRadius * .62; ctx.save(); ctx.translate(tacoX, tacoY); ctx.rotate(angle + Math.PI / 2); ctx.drawImage(images.items, 0, 0, 16, 16, -13, -13, 26, 26); ctx.restore(); }

    // Paper streamers stay readable as curves instead of another dense cloud.
    ctx.globalAlpha = clamp(1 - progress * 1.05, 0, .72); ctx.lineWidth = 4;
    for (let streamer = 0; streamer < 8; streamer += 1) { const direction = streamer % 2 ? 1 : -1; const lift = 70 + (streamer % 4) * 28; ctx.strokeStyle = colors[streamer % colors.length]; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.bezierCurveTo(x + direction * (65 + streamer * 8), y - lift, x - direction * 45, y - lift * 1.35, x + direction * (155 + streamer * 13), y - 100 + streamer * 16); ctx.stroke(); }

    ctx.globalCompositeOperation = 'source-over';
    const titleProgress = clamp(elapsed / .48, 0, 1); const titleFade = clamp(1 - Math.max(0, elapsed - .72) / .38, 0, 1); ctx.globalAlpha = titleFade; ctx.textAlign = 'center'; ctx.font = `900 ${44 + smoothstep(titleProgress) * 25}px Arial`; ctx.strokeStyle = '#34203e'; ctx.lineWidth = 12; ctx.strokeText('KABOOM!', x, y - 92 - smoothstep(titleProgress) * 48); ctx.fillStyle = '#fff5a8'; ctx.fillText('KABOOM!', x, y - 92 - smoothstep(titleProgress) * 48);
    if (elapsed > .88) { const secondAlpha = clamp((elapsed - .88) * 4, 0, 1) * clamp((3.35 - elapsed) * 1.8, 0, 1); ctx.globalAlpha = secondAlpha; ctx.font = '900 25px Arial'; ctx.strokeStyle = '#34203e'; ctx.lineWidth = 9; ctx.strokeText('DOUBLE-CRUNCH RAINBOW JACKPOT!', x, y - 132); const gradient = ctx.createLinearGradient(x - 220, 0, x + 220, 0); colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color)); ctx.fillStyle = gradient; ctx.fillText('DOUBLE-CRUNCH RAINBOW JACKPOT!', x, y - 132); }
    ctx.restore();
  }

  function drawCheckpoint(checkpoint, time) {
    if (checkpoint.x < game.cameraX - 240 || checkpoint.x > game.cameraX + canvas.width + 240) return;
    const x = checkpoint.x - game.cameraX;
    const index = checkpoint.look % checkpointArtFrames.length;
    const frame = checkpointArtFrames[index];
    const pad = checkpointPadLooks[index] || checkpointPadLooks[0];
    const pulse = (Math.sin(time * .008 + checkpoint.x * .002) + 1) * .5;
    const nearby = Math.abs((player.x + player.w * .5) - checkpoint.x) < 300;
    const padWidth = 222;
    const padTop = GROUND_Y - 11;
    const artHeights = [151, 143, 154, 132, 137, 132];
    const artHeight = artHeights[index] || 145;
    const artWidth = artHeight * (frame.sw / frame.sh);
    const artX = x - artWidth * .5;
    const artY = padTop - artHeight + 2;

    ctx.save();
    if (nearby || checkpoint.activated) {
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(x, padTop - 48, 12, x, padTop - 48, 135);
      glow.addColorStop(0, checkpoint.activated ? `${pad.lights}72` : `${pad.lights}42`);
      glow.addColorStop(1, `${pad.lights}00`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - 145, padTop - 188, 290, 190);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Every station receives a location-specific paved pull-off. The artwork's
    // measured structural baseline is anchored to the pull-off, while its small
    // independent shadow remains behind the feet or wheels.
    const base = ctx.createLinearGradient(0, padTop, 0, GROUND_Y + 2);
    base.addColorStop(0, pad.edge);
    base.addColorStop(.24, pad.surface);
    base.addColorStop(1, '#242438');
    ctx.fillStyle = base;
    ctx.strokeStyle = '#2b243b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - padWidth * .5, padTop, padWidth, 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x - padWidth * .5 + 4, padTop + 3, padWidth - 8, 7, 3);
    ctx.clip();
    ctx.strokeStyle = pad.stripe;
    ctx.lineWidth = 4;
    ctx.globalAlpha = .72;
    for (let stripe = -padWidth; stripe < padWidth; stripe += 28) {
      ctx.beginPath();
      ctx.moveTo(x + stripe, padTop + 12);
      ctx.lineTo(x + stripe + 16, padTop + 1);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(20, 18, 28, .22)';
    ctx.beginPath();
    ctx.ellipse(x, padTop + 1, Math.max(30, artWidth * .42), 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = checkpoint.activated ? 1 : .94;
    ctx.shadowColor = checkpoint.activated ? pad.lights : nearby ? pad.edge : 'rgba(255,255,255,.16)';
    ctx.shadowBlur = checkpoint.activated ? 24 + pulse * 8 : nearby ? 12 + pulse * 4 : 4;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      images.checkpoints,
      frame.sx, frame.sy, frame.sw, frame.sh,
      artX, artY, artWidth, artHeight,
    );
    ctx.shadowBlur = 0;

    for (const side of [-1, 1]) {
      const lightX = x + side * (padWidth * .42);
      ctx.fillStyle = checkpoint.activated ? pad.lights : pad.edge;
      ctx.globalAlpha = checkpoint.activated ? .72 + pulse * .28 : .42 + pulse * .18;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = checkpoint.activated ? 14 : 6;
      ctx.beginPath();
      ctx.arc(lightX, padTop + 7, 2.5 + (checkpoint.activated ? pulse : 0), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    const words = checkpoint.sign.split(' ');
    const split = Math.ceil(words.length / 2);
    const lines = checkpoint.sign.length > 28
      ? [words.slice(0, split).join(' '), words.slice(split).join(' ')]
      : [checkpoint.sign];
    const w = 210;
    const h = lines.length > 1 ? 48 : 34;
    const signY = 245;
    ctx.fillStyle = 'rgba(35,28,60,.94)';
    ctx.strokeStyle = checkpoint.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, signY, w, h, 11);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff6d5';
    ctx.font = '900 10px Arial';
    ctx.textAlign = 'center';
    lines.forEach((line, lineIndex) => ctx.fillText(line, x, signY + 20 + lineIndex * 14));
    const nameWidth = Math.min(184, Math.max(112, checkpoint.name.length * 7.2));
    const nameY = signY + h + 4;
    ctx.fillStyle = 'rgba(28, 24, 47, .9)';
    ctx.strokeStyle = checkpoint.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - nameWidth * .5, nameY, nameWidth, 19, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = checkpoint.accent;
    ctx.font = '900 10px Arial';
    ctx.fillText(checkpoint.activated ? `✓ ${checkpoint.name.toUpperCase()}` : checkpoint.name.toUpperCase(), x, nameY + 13);
    ctx.restore();
  }

  function drawPlaneCell(index, x, y, width, rotation = 0, alpha = 1, direction = 1, flipY = false) {
    const cellW = images.plane.width / 3; const cellH = images.plane.height / 2; const height = width * cellH / cellW;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(direction, flipY ? -1 : 1);
    ctx.globalAlpha = alpha;
    ctx.drawImage(images.plane, (index % 3) * cellW, Math.floor(index / 3) * cellH, cellW, cellH, -width / 2, -height / 2, width, height);

    // The source plane stays perfectly stable while a separate animated hub
    // supplies real propeller motion at every display size.
    const propellerX = width * .475;
    const propellerRadius = height * .205;
    ctx.save();
    ctx.translate(propellerX, 0);
    ctx.rotate(game.levelTime * 24 + index * .73);
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = index >= 3 ? 'rgba(255,118,69,.62)' : 'rgba(101,216,255,.52)';
    ctx.lineWidth = Math.max(2, width * .011);
    for (let blade = 0; blade < 3; blade += 1) {
      ctx.rotate(Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -propellerRadius);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#e6a53f';
    ctx.strokeStyle = '#4b2e2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3.5, width * .018), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawPlaneWheelOverlay(x, width, progress = 0) {
    const scale = width / 292;
    const spin = game.levelTime * (8 + progress * 42);
    const wheels = [
      { offset: -80, radius: 7.5 },
      { offset: 48, radius: 13.5 },
    ];
    ctx.save();
    for (const wheel of wheels) {
      const wheelX = x + wheel.offset * scale;
      const radius = wheel.radius * scale;
      ctx.save();
      ctx.translate(wheelX, GROUND_Y - radius);
      ctx.rotate(spin);
      ctx.fillStyle = '#222033';
      ctx.strokeStyle = '#17131f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffd65a';
      ctx.lineWidth = Math.max(1.5, radius * .18);
      ctx.beginPath();
      ctx.arc(0, 0, radius * .52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#65d8ff';
      ctx.beginPath();
      ctx.arc(0, 0, radius * .18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawOliviaPlaneThrowArm(planeX, planeY, planeWidth, frameIndex, rotation = 0, direction = 1, flipY = false) {
    const frame = planeThrowArmFrames[frameIndex];
    if (!frame || !images.world1_2_olivia_plane_throw_arm_v1) return;
    const scale = planeWidth / 245 * .2;
    const shoulderX = -14;
    const shoulderY = -18;
    const width = frame.sw * scale;
    const height = frame.sh * scale;
    ctx.save();
    ctx.translate(planeX, planeY);
    ctx.rotate(rotation);
    ctx.scale(direction, flipY ? -1 : 1);
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = '#ff6fae';
    ctx.shadowBlur = 5;
    ctx.drawImage(
      images.world1_2_olivia_plane_throw_arm_v1,
      frame.sx, frame.sy, frame.sw, frame.sh,
      shoulderX, shoulderY - height * .48, width, height,
    );
    ctx.restore();
  }

  function drawPlaneGroundContact(x, strength = .38) {
    ctx.save(); ctx.globalAlpha = strength; ctx.fillStyle = '#211e32'; ctx.beginPath(); ctx.ellipse(x + 4, GROUND_Y - 4, 104, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = Math.min(1, strength + .18); ctx.fillStyle = '#161523'; ctx.beginPath(); ctx.ellipse(x - 43, GROUND_Y - 2, 15, 4, 0, 0, Math.PI * 2); ctx.ellipse(x + 73, GROUND_Y - 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function openingPlanePose(time) {
    if (time < OPENING_TIMING.waveEnd) return { phase: 'olivia-waving-with-tacos', x: 620, y: 343, cell: 0, width: 310, rotation: 0, grounded: true };
    if (time < OPENING_TIMING.boardEnd) return { phase: 'boarding', x: 620, y: 350, cell: 1, width: 292, rotation: 0, grounded: true };
    if (time < OPENING_TIMING.taxiEnd) {
      const taxi = clamp((time - OPENING_TIMING.boardEnd) / (OPENING_TIMING.taxiEnd - OPENING_TIMING.boardEnd), 0, 1); const acceleration = Math.pow(taxi, 2.2);
      return { phase: 'ground-taxi', x: lerp(620, 1120, acceleration), y: 350, cell: 1, width: 292, rotation: 0, grounded: true, progress: taxi, acceleration };
    }
    if (time < OPENING_TIMING.climbEnd) {
      const climb = clamp((time - OPENING_TIMING.taxiEnd) / (OPENING_TIMING.climbEnd - OPENING_TIMING.taxiEnd), 0, 1);
      const lift = Math.pow(climb, 1.7);
      return { phase: 'takeoff-climb', x: lerp(1120, 1660, climb), y: lerp(350, 62, lift), cell: 2, width: 292, rotation: -.16 * smoothstep(climb), grounded: false, groundContact: clamp(1 - climb / .22, 0, 1), progress: climb };
    }
    const exit = clamp((time - OPENING_TIMING.climbEnd) / (OPENING_TIMING.planeExit - OPENING_TIMING.climbEnd), 0, 1);
    return { phase: time < OPENING_TIMING.planeExit ? 'airborne-exit' : 'returning-to-hero', x: lerp(1660, 2100, smoothstep(exit)), y: lerp(62, -105, exit * exit), cell: 2, width: 292, rotation: lerp(-.16, -.24, exit), grounded: false, progress: exit };
  }

  function openingCameraPhase(time) {
    if (game.openingComplete || time >= OPENING_TIMING.complete) return 'hero-control';
    if (time < OPENING_TIMING.followStart) return 'hero-wide';
    if (time < OPENING_TIMING.returnStart) return 'tracking-olivia';
    return 'returning-to-taco-hero';
  }

  function openingCameraPosition(time) {
    if (time < OPENING_TIMING.followStart || time >= OPENING_TIMING.complete) return 0;
    const pose = openingPlanePose(time); const focusX = clamp(pose.x - canvas.width * .6, 0, WORLD_WIDTH - canvas.width);
    if (time < OPENING_TIMING.returnStart) {
      const acquire = smoothstep((time - OPENING_TIMING.followStart) / (OPENING_TIMING.followFull - OPENING_TIMING.followStart));
      return lerp(0, focusX, acquire);
    }
    const returnPose = openingPlanePose(OPENING_TIMING.returnStart); const returnFrom = clamp(returnPose.x - canvas.width * .6, 0, WORLD_WIDTH - canvas.width);
    const returnProgress = smoothstep((time - OPENING_TIMING.returnStart) / (OPENING_TIMING.complete - OPENING_TIMING.returnStart));
    return lerp(returnFrom, 0, returnProgress);
  }

  function drawOpeningPlane() {
    if (game.openingComplete) return; const t = game.openingTimer; const pose = openingPlanePose(t); const x = pose.x - game.cameraX;
    if (t < OPENING_TIMING.waveEnd) {
      drawPlaneGroundContact(x, .42); drawPlaneCell(0, x, pose.y, pose.width, 0); drawPlaneWheelOverlay(x, pose.width, 0);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let sparkle = 0; sparkle < 6; sparkle += 1) { const angle = t * 2.1 + sparkle * Math.PI / 3; ctx.fillStyle = sparkle % 2 ? '#ffd65a' : '#65d8ff'; ctx.globalAlpha = .35 + Math.sin(t * 5 + sparkle) * .2; ctx.beginPath(); ctx.arc(x - 110 + Math.cos(angle) * 34, 246 + Math.sin(angle) * 24, 3 + sparkle % 2, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    } else if (t < OPENING_TIMING.boardEnd) {
      const board = clamp((t - OPENING_TIMING.waveEnd) / (OPENING_TIMING.boardEnd - OPENING_TIMING.waveEnd), 0, 1); drawPlaneGroundContact(x, .42); drawPlaneCell(0, x, 343, 310, 0, 1 - board); drawPlaneCell(1, x, pose.y, pose.width, 0, board); drawPlaneWheelOverlay(x, pose.width, board * .1);
    } else if (t < OPENING_TIMING.planeExit) {
      if (pose.grounded) drawPlaneGroundContact(x, .24 + (pose.progress || 0) * .3);
      else if (pose.groundContact > 0) drawPlaneGroundContact(x, .48 * pose.groundContact);
      drawPlaneCell(pose.cell, x, pose.y, pose.width, pose.rotation);
      if (pose.grounded) drawPlaneWheelOverlay(x, pose.width, pose.progress || 0);
      if (pose.phase === 'ground-taxi') {
        const taxi = pose.progress;
        ctx.save(); const streakCount = 3 + Math.floor(taxi * 10); const streakLength = 35 + taxi * 175;
        ctx.globalAlpha = .24 + taxi * .66; ctx.strokeStyle = '#fff1a6'; ctx.lineWidth = 2 + taxi * 2;
        for (let streak = 0; streak < streakCount; streak += 1) { const endX = x - 78 - streak * (13 + taxi * 5); ctx.beginPath(); ctx.moveTo(endX - streakLength - streak * 4, 408 + streak * 4); ctx.lineTo(endX, 408 + streak * 4); ctx.stroke(); }
        const dustCount = 4 + Math.floor(taxi * 10); ctx.fillStyle = `rgba(255,225,132,${.25 + taxi * .45})`; for (let dust = 0; dust < dustCount; dust += 1) { ctx.beginPath(); ctx.arc(x - 105 - dust * (18 + taxi * 8), 450 - dust % 3 * (4 + taxi * 3), 2 + taxi * 3 + dust * .35, 0, Math.PI * 2); ctx.fill(); }
        if (taxi > .72) { ctx.fillStyle = '#ffd65a'; for (let spark = 0; spark < 5; spark += 1) { ctx.save(); ctx.translate(x - 62 - spark * 25, 447 - spark % 2 * 6); ctx.rotate(-.35); ctx.fillRect(-5, -1, 10 + taxi * 8, 3); ctx.restore(); } }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(101,216,255,${.35 + taxi * .55})`; ctx.lineWidth = 3 + taxi * 2; ctx.beginPath(); ctx.arc(x + 116, 349, 23 + Math.sin(t * (18 + taxi * 40)) * (1 + taxi * 2), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      } else {
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(101,216,255,.5)'; ctx.lineWidth = 4; for (let trail = 0; trail < 4; trail += 1) { ctx.globalAlpha = .5 - trail * .09; ctx.beginPath(); ctx.moveTo(x - 128 - trail * 34, pose.y + 18 + trail * 5); ctx.lineTo(x - 72 - trail * 22, pose.y + 13 + trail * 3); ctx.stroke(); } ctx.restore();
      }
    }
    if (t >= OPENING_TIMING.yahooAt && t < OPENING_TIMING.yahooAt + 1.65) {
      const progress = clamp((t - OPENING_TIMING.yahooAt) / 1.65, 0, 1); const pop = Math.sin(Math.min(1, progress * 2.1) * Math.PI * .5); const alpha = clamp(1 - Math.max(0, progress - .58) / .42, 0, 1);
      ctx.save(); ctx.translate(x - 12, pose.y - 88 - progress * 35); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'screen';
      ['#ff6fae', '#ff8d57', '#ffd65a', '#9bef70', '#65d8ff', '#b78cff'].forEach((color, index) => { ctx.strokeStyle = color; ctx.lineWidth = 6 - index * .55; ctx.beginPath(); ctx.arc(0, 45, 45 + progress * 105 - index * 5, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
      ctx.globalCompositeOperation = 'source-over'; ctx.scale(.68 + pop * .48, .68 + pop * .48); ctx.font = '900 54px Arial'; ctx.textAlign = 'center'; ctx.strokeStyle = '#332342'; ctx.lineWidth = 11; ctx.strokeText('YAHOO!', 0, 0); ctx.fillStyle = '#fff4a8'; ctx.fillText('YAHOO!', 0, 0);
      ctx.fillStyle = '#fff'; for (let star = 0; star < 7; star += 1) { const angle = star / 7 * Math.PI * 2 + progress * 2; const radius = 72 + star % 2 * 22 + progress * 40; ctx.save(); ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius * .55); ctx.rotate(angle); ctx.fillRect(-7, -2, 14, 4); ctx.fillRect(-2, -7, 4, 14); ctx.restore(); } ctx.restore();
    }
  }

  function planeThrowFrameForFlyby(flyby) {
    if (!flyby?.tacoDrop || flyby.timer < flyby.dropStart || flyby.timer > flyby.dropEnd) return -1;
    const throwCycle = ((flyby.timer - flyby.dropStart) % flyby.dropInterval) / flyby.dropInterval;
    return Math.min(3, Math.floor(throwCycle * 4));
  }

  function drawBannerFlyby(time) {
    const flyby = game.flybys.find((item) => item.started && !item.finished); if (!flyby) return; const t = flyby.timer; const direction = flyby.direction;
    const plane = flybyPlanePosition(flyby); const planeX = plane.x; const planeY = plane.y;
    const bannerX = direction < 0 ? planeX + 138 : planeX - 453; const bannerY = direction > 0 ? 224 + Math.sin(t * 1.8) * 5 : planeY + (flyby.inverted ? 34 : 22); const ropeStartX = planeX + (direction < 0 ? 92 : -92); const ropeEndX = bannerX + (direction < 0 ? 28 : 287);
    ctx.save(); ctx.strokeStyle = '#fff2c5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ropeStartX, planeY + 4); ctx.quadraticCurveTo(ropeStartX + direction * -28, bannerY - 15, ropeEndX, bannerY); ctx.stroke();
    const gradient = ctx.createLinearGradient(bannerX, bannerY, bannerX + 315, bannerY + 76); gradient.addColorStop(0, '#fff0b7'); gradient.addColorStop(.5, '#fff9df'); gradient.addColorStop(1, '#ffd982'); ctx.fillStyle = gradient; ctx.strokeStyle = '#ff5f96'; ctx.lineWidth = 5; ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(bannerX, bannerY); ctx.quadraticCurveTo(bannerX + 155, bannerY + Math.sin(time * .008) * 4, bannerX + 315, bannerY); ctx.lineTo(bannerX + 305, bannerY + 74); ctx.quadraticCurveTo(bannerX + 150, bannerY + 66 + Math.sin(time * .008) * 4, bannerX, bannerY + 72); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    const joke = flyby.text; ctx.fillStyle = '#34203e'; ctx.font = `900 ${joke[0].length > 23 ? 14 : 16}px Arial`; ctx.textAlign = 'center'; ctx.fillText(joke[0], bannerX + 155, bannerY + 31); ctx.fillStyle = flyby.inverted ? '#6a46c9' : '#c43d64'; ctx.font = `900 ${joke[1].length > 22 ? 16 : 19}px Arial`; ctx.fillText(joke[1], bannerX + 155, bannerY + 55);
    for (let bulb = 0; bulb < 11; bulb += 1) { ctx.fillStyle = ['#65d8ff', '#ff6fae', '#ffd65a'][bulb % 3]; ctx.beginPath(); ctx.arc(bannerX + 18 + bulb * 28, bannerY + 9, 3, 0, Math.PI * 2); ctx.fill(); }
    if (flyby.inverted) { ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(101,216,255,.64)'; ctx.lineWidth = 4; ctx.setLineDash([11, 9]); ctx.beginPath(); ctx.moveTo(planeX - direction * 105, planeY); ctx.quadraticCurveTo(planeX - direction * 165, planeY + 42, planeX - direction * 245, planeY + 8); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    const planeRotation = -.03 * direction;
    drawPlaneCell(2, planeX, planeY, 245, planeRotation, 1, direction, flyby.inverted);
    const throwFrame = planeThrowFrameForFlyby(flyby);
    if (throwFrame >= 0) {
      drawOliviaPlaneThrowArm(planeX, planeY, 245, throwFrame, planeRotation, direction, flyby.inverted);
    }
  }

  function planeDuringAmbush() {
    if (game.ambush.stage === 0 || game.rescueActive) return null;
    let screenX;
    if (game.ambush.stage === 1) screenX = lerp(-220, 510, clamp(game.ambush.timer / 3.45, 0, 1));
    else if (game.ambush.stage === 2) screenX = 510 + clamp(game.ambush.projectile, 0, 1) * 34;
    else screenX = 544 + game.ambush.timer * 155;
    if (screenX > canvas.width + 220) return null;
    return { x: game.cameraX + screenX, screenX, y: 116 + Math.sin(game.levelTime * 2) * 6 };
  }

  function drawAmbush(time) {
    const plane = planeDuringAmbush(); if (plane) {
      const x = plane.screenX; drawPlaneCell(game.ambush.stage >= 3 ? 3 : 2, x, plane.y, 245, game.ambush.stage >= 3 ? .08 : 0);
      if (game.ambush.stage >= 3) drawPlaneDamageTrail(x - 98, plane.y + 8, time, clamp(game.ambush.timer / 1.15, .18, 1.15));
      if (game.ambush.stage === 2) {
        const p = clamp(game.ambush.projectile, 0, 1); const eased = p * p * (3 - 2 * p); const startX = canvas.width + 110; const startY = 350; const targetX = x - 88; const targetY = plane.y + 8;
        const blobX = lerp(startX, targetX, eased); const blobY = lerp(startY, targetY, eased) + Math.sin(p * Math.PI) * 112;
        ctx.save(); ctx.lineCap = 'round'; for (let drop = 5; drop > 0; drop -= 1) { const trailT = Math.max(0, p - drop * .035); const trailEased = trailT * trailT * (3 - 2 * trailT); const tx = lerp(startX, targetX, trailEased); const ty = lerp(startY, targetY, trailEased) + Math.sin(trailT * Math.PI) * 112; ctx.globalAlpha = .12 + drop * .08; ctx.fillStyle = drop % 2 ? '#9bef70' : '#5cbf55'; ctx.beginPath(); ctx.arc(tx, ty, 5 + (5 - drop) * 1.7, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1; ctx.translate(blobX, blobY); ctx.rotate(p * 11); ctx.shadowColor = '#9bef70'; ctx.shadowBlur = 24; ctx.fillStyle = '#8fe55b'; ctx.strokeStyle = '#274a36'; ctx.lineWidth = 4; ctx.beginPath(); for (let point = 0; point < 16; point += 1) { const angle = point / 16 * Math.PI * 2; const radius = point % 2 ? 17 : 22; const px = Math.cos(angle) * radius; const py = Math.sin(angle) * radius; if (!point) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e5ff9a'; ctx.beginPath(); ctx.arc(-5, -6, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      if (game.ambush.hitFlash > 0) { const pop = clamp(1 - game.ambush.hitFlash / .85, 0, 1); ctx.save(); ctx.translate(x - 72, plane.y + 8); ctx.rotate(-.08); ctx.globalAlpha = clamp(game.ambush.hitFlash * 2.2, 0, 1); ctx.font = `900 ${34 + pop * 18}px Arial`; ctx.textAlign = 'center'; ctx.strokeStyle = '#34203e'; ctx.lineWidth = 9; ctx.strokeText('GUAC-KRAK!', 0, -48); ctx.fillStyle = '#c9ff67'; ctx.fillText('GUAC-KRAK!', 0, -48); ctx.strokeStyle = '#fff5c8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 28 + pop * 62, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    }
  }

  function rescuePlanePosition() {
    const progress = clamp((player.x - 27000) / 5200, 0, 1); return { progress, x: lerp(27480, CRASH_SITE_X, progress), y: lerp(105, 386, Math.pow(progress, 1.3)) };
  }

  function drawSmokeTrail(x, y, amount, time, intensity) {
    for (let i = 0; i < amount; i += 1) { const age = i / amount; const px = x - i * (18 + intensity * 4); const py = y - 5 - Math.sin(time * .004 + i) * 9 - i * 2; ctx.globalAlpha = .45 - age * .22; ctx.fillStyle = i % 3 ? '#4d4659' : '#6a5360'; ctx.beginPath(); ctx.arc(px, py, 8 + i * 1.6 * intensity, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
  }

  function drawPlaneDamageTrail(x, y, time, intensity = 1) {
    ctx.save();
    drawSmokeTrail(x, y, game.reducedShake ? 12 : 26, time, 1.05 + intensity);
    const flicker = (Math.sin(time * .028) + 1) * .5;
    ctx.globalCompositeOperation = 'screen'; ctx.shadowColor = '#ff5d32'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#ff5d32'; ctx.beginPath(); ctx.moveTo(x + 12, y - 13); ctx.quadraticCurveTo(x - 28 - flicker * 18, y, x + 12, y + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd65a'; ctx.beginPath(); ctx.moveTo(x + 8, y - 8); ctx.quadraticCurveTo(x - 15 - flicker * 11, y, x + 8, y + 8); ctx.closePath(); ctx.fill();
    for (let spark = 0; spark < 5; spark += 1) { const sx = x - 24 - ((time * .22 + spark * 31) % 80); const sy = y + Math.sin(time * .012 + spark) * 17; ctx.fillStyle = spark % 2 ? '#ffd65a' : '#ff7b42'; ctx.fillRect(sx, sy, 5, 3); }
    ctx.restore();
  }

  function drawRescuePlane(time) {
    if (!game.rescueActive || game.crashLanded) return; const plane = rescuePlanePosition(); const x = plane.x - game.cameraX; const cell = plane.progress > .72 ? 4 : 3; drawPlaneDamageTrail(x - 100, plane.y + 4, time, 1 + plane.progress); drawPlaneCell(cell, x, plane.y, 255, .04 + plane.progress * .11);
    // Bright rescue tracker stays behind the plane and never obscures Taco Hero.
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,214,90,${.25 + plane.progress * .35})`; ctx.lineWidth = 4; ctx.setLineDash([12, 9]); ctx.beginPath(); ctx.ellipse(x, plane.y + 8, 132, 55, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  function drawCrewMember(member, x, baseline, time, alpha = 1) {
    const sprite = images.world1_2_airfield_crash_crew_v1;
    if (!sprite) return;
    const sourceW = sprite.naturalWidth / 3;
    const sourceH = sprite.naturalHeight / 2;
    const beat = time * .006 + member.phase;
    const celebrating = game.state === 'celebrating' || game.state === 'won';
    const bounce = Math.abs(Math.sin(beat * (celebrating ? 1.6 : .82))) * (celebrating ? 7 : 2.5);
    const sway = Math.sin(beat * .72) * (celebrating ? .055 : .025);
    const size = 112 * member.scale;

    ctx.save();
    ctx.globalAlpha = alpha * .16;
    ctx.fillStyle = '#211e32';
    ctx.beginPath(); ctx.ellipse(x, baseline + 1, size * .22, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, baseline - bounce);
    ctx.rotate(sway);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sprite, (member.frame % 3) * sourceW, Math.floor(member.frame / 3) * sourceH, sourceW, sourceH, -size / 2, -size, size, size);
    if (member.role === 'radio') {
      const blink = .45 + Math.sin(beat * 5.2) * .3;
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(101,216,255,${blink})`;
      ctx.beginPath(); ctx.arc(size * .22, -size * .61, 4 + blink * 4, 0, Math.PI * 2); ctx.fill();
    } else if (member.role === 'medic') {
      ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(155,239,112,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(size * .18, -size * .45, 9 + Math.sin(beat * 3) * 2, 0, Math.PI * 2); ctx.stroke();
    } else if (member.role === 'firefighter') {
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,107,78,${.3 + Math.sin(beat * 6) * .18})`;
      ctx.beginPath(); ctx.arc(0, -size * .88, 8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    if (member.sign) {
      const signLift = celebrating ? Math.abs(Math.sin(beat * 1.6)) * 8 : 0;
      const lines = member.sign.split('|'); const signW = 150; const signY = baseline - size - 54 - signLift;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = 'rgba(33,29,59,.94)'; ctx.strokeStyle = member.accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(x - signW / 2, signY, signW, 48, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6d5'; ctx.textAlign = 'center'; ctx.font = '900 11px Arial';
      lines.forEach((line, lineIndex) => ctx.fillText(line, x, signY + 19 + lineIndex * 16)); ctx.restore();
    }
  }

  function drawAirfieldCrew(time) {
    if (game.cameraX > 1350) return;
    const alpha = game.openingComplete ? clamp(1 - game.cameraX / 1350, 0, 1) : 1;
    drawCrewMember({ ...crashCrew[1], sign: null }, 352 - game.cameraX, GROUND_Y + 22, time, alpha * .9);
    drawCrewMember({ ...crashCrew[2], sign: null }, 1005 - game.cameraX, GROUND_Y + 22, time, alpha * .9);
  }

  function drawCrashSite(time) {
    if (!game.crashLanded) return; const x = CRASH_SITE_X - game.cameraX; const y = 228; if (x < -520 || x > canvas.width + 520) return;
    const settle = clamp(game.crashTimer / 1.1, 0, 1);
    crashCrew.forEach((member) => drawCrewMember(member, x + member.offset, GROUND_Y, time, settle));
    ctx.save(); ctx.globalAlpha = settle; ctx.shadowColor = '#ff8d57'; ctx.shadowBlur = 14; ctx.drawImage(images.crash, x - 280, y, 560, 280); ctx.shadowBlur = 0;
    if (!game.reducedShake) drawSmokeTrail(x - 90, y + 45, 7, time, .8);
    // A propeller-powered confetti fan turns the wreck into the party stage.
    for (let ribbon = 0; ribbon < 12; ribbon += 1) { const angle = time * .004 + ribbon * Math.PI / 6; ctx.globalAlpha = .45 + Math.sin(angle * 2) * .18; ctx.strokeStyle = ['#65d8ff', '#ff6fae', '#ffd65a'][ribbon % 3]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 205, y + 126); ctx.quadraticCurveTo(x + 238 + Math.cos(angle) * 30, y + 80 + Math.sin(angle) * 25, x + 260 + Math.cos(angle) * 52, y + 58 + Math.sin(angle) * 42); ctx.stroke(); }
    ctx.restore();
  }

  function drawGoal(time) {
    const x = world.goal.x - game.cameraX; if (x < -400 || x > canvas.width + 400) return; const approach = clamp(1 - (world.goal.x - player.x) / 1300, 0, 1); const w = 255 + approach * 55; const h = w * .5; const y = 118 - approach * 30 + Math.sin(time * .007) * 3;
    const title = game.airMailComplete ? 'SPECIAL DELIVERY: SLIGHTLY TOASTED PILOT' : 'EMERGENCY TACO FIESTA'; ctx.save(); ctx.shadowColor = game.airMailComplete ? '#65d8ff' : '#ffd65a'; ctx.shadowBlur = 18 + approach * 22; ctx.drawImage(images.fiestaBanner, x + 55 - w / 2, y, w, h); ctx.shadowBlur = 0; ctx.fillStyle = '#fff5d2'; ctx.strokeStyle = '#34203e'; ctx.lineWidth = 4; ctx.textAlign = 'center'; ctx.font = `900 ${game.airMailComplete ? 11 : 15}px Arial`; ctx.strokeText(title, x + 55, y + h * .54); ctx.fillText(title, x + 55, y + h * .54); ctx.restore();
  }

  function drawPlayer(time) {
    if (heroCore.hidePlayerDuringRespawn(game.respawn)) return;
    const lookingUp = game.ambush.hitFlash > 0; const frame = game.state === 'celebrating' || game.state === 'won' ? 7 : lookingUp ? 4 : player.invulnerable > 0 ? 6 : !player.grounded ? (player.vy < 0 ? 4 : 5) : Math.abs(player.vx) > 24 ? 1 + Math.floor(player.anim) % 3 : 0;
    const x = player.x - game.cameraX + player.w / 2; const y = player.y + player.h / 2; ctx.save(); if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) ctx.globalAlpha = .42;
    if (game.rescueActive && !game.crashLanded) { const sourceW = images.hero.width / 8; for (let ghost = 3; ghost > 0; ghost -= 1) { ctx.globalAlpha = .08 + ghost * .045; ctx.drawImage(images.hero, frame * sourceW, 0, sourceW, images.hero.height, x - 33 - ghost * 18, y - 33, 66, 66); } ctx.globalAlpha = 1; }
    ctx.translate(x, y); ctx.rotate((player.rotation || 0) + (lookingUp ? -.13 : 0)); ctx.scale(player.dir * (player.scale || 1), player.scale || 1);
    if (game.rescueActive || sharedAbilities.isFrenzy(game.abilities)) { ctx.shadowColor = game.rescueActive ? '#ffd65a' : '#65d8ff'; ctx.shadowBlur = 24; ctx.strokeStyle = game.rescueActive ? '#ffd65a' : '#65d8ff'; ctx.globalAlpha = .65; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 27, 27 + Math.sin(time * .012) * 2, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    const sourceW = images.hero.width / 8; ctx.drawImage(images.hero, frame * sourceW, 0, sourceW, images.hero.height, -33, -33, 66, 66); ctx.restore();
  }

  function drawParticles() {
    game.particles.forEach((p) => { ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
    game.confetti.forEach((p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -2, p.size, 4); ctx.restore(); });
    game.fireworks.forEach((p) => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
    game.impactTexts.forEach((text) => { const x = text.x - game.cameraX; ctx.globalAlpha = clamp(text.life, 0, 1); ctx.textAlign = 'center'; ctx.font = `900 ${text.size || 27}px Arial`; ctx.strokeStyle = '#30203e'; ctx.lineWidth = 6; ctx.strokeText(text.text, x, text.y); ctx.fillStyle = text.color; ctx.fillText(text.text, x, text.y); }); ctx.globalAlpha = 1;
  }

  function drawHUD(time) {
    ctx.save(); ctx.fillStyle = 'rgba(32,29,61,.36)'; ctx.strokeStyle = 'rgba(255,226,126,.62)'; ctx.lineWidth = 3; ctx.fillRect(14, 14, 330, 174); ctx.strokeRect(14, 14, 330, 174);
    ctx.fillStyle = '#fff5d2'; ctx.font = '900 22px Arial'; ctx.textAlign = 'left'; ctx.fillText('World 1-2 • Sky-High Rescue', 26, 41); ctx.font = '17px Arial'; ctx.fillText(`Score: ${game.score.toLocaleString()}`, 26, 68); ctx.fillText(`Tacos: ${game.collected}/${game.totalTacos}`, 26, 94); ctx.fillStyle = '#65d8ff'; ctx.font = '900 14px Arial'; ctx.fillText(`✉ AIR MAIL ${game.airMail}/5  •  SKY STREAK ${game.skyStreak.count}`, 26, 118); ctx.fillStyle = '#ffd65a'; ctx.font = '900 14px Arial'; ctx.fillText(`Splats ${game.defeated}  •  Plane ${game.crashLanded ? 'Landed-ish' : game.ambush.stage >= 3 ? 'Guac’d' : 'Airborne'}`, 26, 140);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(26, 159, 280, 10); ctx.fillStyle = sharedAbilities.isFrenzy(game.abilities) ? '#65d8ff' : '#ffd65a'; ctx.fillRect(26, 159, 280 * (sharedAbilities.isFrenzy(game.abilities) ? 1 : game.abilities.tacoMeter / 100), 10); ctx.font = '900 10px Arial'; ctx.fillStyle = '#fff5d2'; ctx.fillText('TACO METER', 26, 156);
    const section = sections[game.sectionIndex]; ctx.fillStyle = 'rgba(32,29,61,.34)'; ctx.beginPath(); ctx.roundRect(370, 14, 410, 75, 24); ctx.fill(); ctx.strokeStyle = 'rgba(255,226,126,.42)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = section.accent; ctx.fillRect(395, 42, 360 * (player.x / WORLD_WIDTH), 8); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(395 + 360 * (player.x / WORLD_WIDTH), 42, 360 * (1 - player.x / WORLD_WIDTH), 8); ctx.textAlign = 'center'; ctx.fillStyle = '#fff5d2'; ctx.font = '900 15px Arial'; ctx.fillText(section.name, 575, 73);
    ctx.textAlign = 'right'; ctx.font = '900 15px Arial'; if (sharedAbilities.isFrenzy(game.abilities)) { ctx.fillStyle = '#65d8ff'; ctx.fillText(`TACO FRENZY ${Math.ceil(game.abilities.frenzyTimer)}s`, 938, 52); } if (sharedAbilities.hasMagnet(game.abilities)) { ctx.fillStyle = '#ffd65a'; ctx.fillText(`MAGNET ${Math.ceil(game.abilities.magnetTimer)}s`, 938, 75); }
    ctx.fillStyle = '#ff6fae'; ctx.font = '24px Arial'; ctx.fillText('♥'.repeat(game.hearts), 938, 108);
    if (game.messageTimer > 0 && game.state !== 'celebrating') { const size = game.message.length > 58 ? 16 : game.message.length > 46 ? 19 : game.message.length > 36 ? 22 : 29; ctx.textAlign = 'center'; ctx.font = `900 ${size}px Arial`; ctx.strokeStyle = '#30203e'; ctx.lineWidth = 8; ctx.strokeText(game.message, 480, 207); ctx.fillStyle = section.accent; ctx.fillText(game.message, 480, 207); }
    if (game.state === 'celebrating') { const celebration = game.airMailComplete ? 'SPECIAL DELIVERY! OLIVIA SAFE! ALL MAIL DELIVERED!' : 'OLIVIA SAFE! TACOS SAFE! PLANE... MOSTLY!'; ctx.textAlign = 'center'; ctx.font = `900 ${game.airMailComplete ? 25 : 30}px Arial`; ctx.strokeStyle = '#30203e'; ctx.lineWidth = 8; ctx.strokeText(celebration, 480, 202); ctx.fillStyle = '#ffd65a'; ctx.fillText(celebration, 480, 202); }
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); if (game.cameraShake > 0) { const amount = game.reducedShake ? game.cameraShake * .2 : game.cameraShake; ctx.translate((random() - .5) * amount, (random() - .5) * amount * .6); }
    drawBackground(time); drawAirfieldCrew(time); drawRescueSpeedFX(time); world.platforms.forEach((p) => drawPlatform(p, time)); world.collectibles.forEach((item) => drawCollectible(item, time)); world.checkpoints.forEach((checkpoint) => drawCheckpoint(checkpoint, time));
    world.enemies.forEach((enemy) => drawEnemy(enemy, time)); drawPinata(time); drawOpeningPlane(); drawBannerFlyby(time); drawAmbush(time); drawRescuePlane(time); drawCrashSite(time); drawGoal(time); heroCore.drawRespawnFX(ctx, game.respawn, player, game.cameraX, time); drawPlayer(time); drawParticles(); drawPinataBurst(time); ctx.restore(); drawHUD(time);
    if (qa) canvas.dataset.qaState = JSON.stringify({
      sourceVersion: SOURCE_VERSION,
      state: game.state, player: { x: Math.round(player.x), y: Math.round(player.y), vx: Math.round(player.vx), vy: Math.round(player.vy), grounded: player.grounded },
      heroPhysics, respawn: {
        active: game.respawn.active,
        phase: game.respawn.active ? (game.respawn.spawnPlaced ? 'drop' : game.respawn.timer < .38 ? 'vanish' : 'beam') : 'inactive',
        count: game.respawnCount, fallbacks: game.respawnFallbacks, lastLanding: game.lastRespawnLanding,
      }, lastImpactText: game.impactTexts[game.impactTexts.length - 1]?.text || null,
      section: sections[game.sectionIndex].id, cameraX: Math.round(game.cameraX), worldWidth: WORLD_WIDTH, platforms: world.platforms.length, movingPlatforms: world.platforms.filter((p) => p.moving).length,
      platformOverlapCount: game.platformOverlapCount, routeMaxGap: game.routeMaxGap, elevatedMaxGap: game.elevatedMaxGap, unreachablePlatforms: game.unreachablePlatforms, unreachablePlatformDetails: game.unreachablePlatformDetails, jumpModel: { normalVelocity: heroPhysics.jumpVelocity, helperBounceVelocity: heroPhysics.enemyBounceVelocity, normalRise: heroPhysics.normalJumpRise, helperRise: heroPhysics.enemyBounceRise },
      collectibleLayout: {
        tacos: game.totalTacos, tacoCoins: world.collectibles.filter((item) => item.type === 'tacoCoin').length, overlaps: game.tacoOverlapCount, duplicatesRemoved: game.tacoDuplicatesRemoved,
        lanes: world.collectibles.filter((item) => item.type === 'taco' && !item.bonusReward).reduce((counts, item) => { const lane = item.lane || 'untagged'; counts[lane] = (counts[lane] || 0) + 1; return counts; }, {}),
      },
      checkpoints: { total: world.checkpoints.length, grounded: game.checkpointsGrounded, allGrounded: game.checkpointsGrounded === world.checkpoints.length },
      controls: {
        left: keys.left, right: keys.right, jump: keys.jump, lastDirection: keys.lastDir, resets: game.inputResetCount, lastResetReason: game.lastInputResetReason,
        landingRecoveries: game.landingRecoveries, stallTimer: Number(game.controlStallTimer.toFixed(3)), controllerDirections: { left: inputSources.controller.left, right: inputSources.controller.right },
        controllerStateSyncs: game.controllerStateSyncs, controllerStateSequence: game.controllerStateSequence, controllerQaResetDone: game.controllerQaResetDone,
      },
      firstFlybySafety: { corridor: { ...FIRST_FLYBY_CORRIDOR }, active: firstFlybyActive(), maxGroundGap: game.flybyCorridorMaxGap, enemies: game.flybyCorridorEnemies, magnets: world.collectibles.filter((item) => item.type === 'magnet').map((item) => item.x), particles: game.particles.length, confetti: game.confetti.length, effectsTrimmed: game.effectsTrimmed },
      tacos: game.totalTacos, tacoCoins: world.collectibles.filter((item) => item.type === 'tacoCoin').length, airMail: { collected: game.airMail, total: game.airMailTotal, complete: game.airMailComplete, placed: world.collectibles.filter((item) => item.type === 'airmail').length }, skyStreak: { ...game.skyStreak },
      enemies: { total: game.totalEnemies, alive: world.enemies.filter((enemy) => enemy.alive).length, rescue: world.enemies.filter((enemy) => enemy.x >= 27000).length },
      skyPilotRemaster: {
        ...(game.skyPilotRemaster || {}),
        formationAudit: {
          overlapCount: game.skyFormationOverlapCount,
          overlapPairs: game.skyFormationOverlapPairs,
          mixedTypeGroups: game.skyMixedTypeGroups,
          narrowPlatformGroups: game.skyNarrowPlatformGroups,
          forbiddenEnemyCounts: game.skyForbiddenEnemyCounts,
          rules: game.skyFormationRules,
        },
        patrol: game.enemyPatrolAudit,
        platformBinding: game.platformEnemyStats,
        enemySpans: world.enemies.map((enemy) => ({
          id: enemy.id,
          type: enemy.type,
          groupId: enemy.groupId,
          groupIndex: enemy.groupIndex,
          supportPlatformId: enemy.platform?.id || null,
          minX: Math.round(enemy.minX),
          maxX: Math.round(enemy.maxX),
          span: Math.round(enemy.patrolSpan || (enemy.maxX - enemy.minX)),
          coverage: enemy.patrolCoverage || null,
          localPatrol: Boolean(enemy.localPatrol),
        })),
      },
      pinata: world.pinata ? {
        hits: world.pinata.hits, targetHits: world.pinata.targetHits, broken: world.pinata.broken, x: world.pinata.x,
        rewardTacos: world.collectibles.filter((item) => item.pinataReward).length,
        jackpotTacos: world.collectibles.filter((item) => item.pinataReward && !item.collected).length,
        rainbowRewards: world.collectibles.filter((item) => item.pinataReward && item.rainbowReward).length,
        rainbowTacos: world.collectibles.filter((item) => item.pinataReward && item.rainbowReward && !item.collected).length,
        burst: game.pinataBurst ? { remaining: Number(game.pinataBurst.timer.toFixed(2)), aftershock: game.pinataBurst.aftershockTriggered, finale: game.pinataBurst.finaleTriggered, rewardWaves: game.pinataBurst.rewardWaves } : null,
      } : null,
      plane: { openingComplete: game.openingComplete, openingTimer: Number(game.openingTimer.toFixed(2)), openingStage: game.openingComplete ? 'complete' : openingPlanePose(game.openingTimer).phase, wheelsGroundedDuringTaxi: game.openingTimer >= OPENING_TIMING.boardEnd && game.openingTimer < OPENING_TIMING.taxiEnd, openingCamera: { phase: openingCameraPhase(game.openingTimer), cameraX: Math.round(game.cameraX), planeScreenX: game.openingComplete ? null : Math.round(openingPlanePose(game.openingTimer).x - game.cameraX), heroScreenX: Math.round(player.x - game.cameraX), controlsLocked: !game.openingComplete }, flybys: game.flybys.map((flyby) => ({ id: flyby.id, started: flyby.started, finished: flyby.finished, timer: Number(flyby.timer.toFixed(2)), direction: flyby.direction < 0 ? 'right-to-left' : 'left-to-right', inverted: flyby.inverted, text: flyby.text, tacoDrop: Boolean(flyby.tacoDrop), dropsReleased: flyby.dropsReleased })), airDrop: { ...game.airDrop, activeTacos: world.collectibles.filter((item) => item.planeDrop && !item.collected).length }, ambushStage: game.ambush.stage, returnDirection: 'left-to-right', attackerVisible: false, projectileVisible: game.ambush.stage === 2, rescueActive: game.rescueActive, rescuePhase: game.rescuePhase, turboFx: game.rescueActive && !game.crashLanded, crashLanded: game.crashLanded, crashTimer: Number(game.crashTimer.toFixed(2)), crashSiteX: CRASH_SITE_X, aheadBy: game.rescueActive && !game.crashLanded ? Math.round(rescuePlanePosition().x - player.x) : null },
      music: {
        active: game.activeMusic,
        transition: game.musicTransition ? {
          from: game.musicTransition.fromName, target: game.musicTransition.toName,
          progress: Number(clamp(game.musicTransition.elapsed / game.musicTransition.duration, 0, 1).toFixed(3)),
          duration: game.musicTransition.duration, queuedTarget: game.musicTransition.queuedTarget, reversed: game.musicTransition.reversed,
        } : null,
        playing: Object.entries(tracks).filter(([, track]) => !track.paused).map(([name, track]) => ({ name, volume: Number(track.volume.toFixed(3)), time: Number(track.currentTime.toFixed(2)) })),
        overlapSafe: Object.values(tracks).filter((track) => !track.paused).length <= 2,
        transitions: game.musicTransitionCount, retargets: game.musicRetargets, overlapRecoveries: game.musicOverlapRecoveries, maxPlaying: game.maxMusicPlaying,
      },
      abilities: { ...game.abilities }, fullscreenReady: Boolean(document.fullscreenEnabled || navigator.standalone),
      foregroundRemaster: {
        version: 1,
        groundFamilies: 6,
        elevatedPlatformFamilies: 3,
        checkpointPullOffs: checkpointPadLooks.length,
        checkpointArtGroundedByVisibleBaseline: true,
        independentCheckpointShadows: true,
        plane: {
          independentPropeller: true,
          independentTaxiWheels: true,
          armOnlyThrowFrame: planeThrowFrameForFlyby(game.flybys.find((flyby) => flyby.started && !flyby.finished)),
        },
      },
      characterRemaster: {
        version: 1,
        enemyTypes: Object.keys(enemySpriteArt),
        enemyAnimationFrames: 8,
        behaviorLinked: true,
        trueBodyGrounding: true,
        separateContactShadows: true,
        crashCrewCharacters: crashCrew.length,
        airfieldCrewCharacters: 2,
        crewAnimated: true,
        oliviaHair: 'pink-and-blue',
        openingPlaneArt: 'olivia_plane_sheet_v3',
      },
      background: world1Background.qaState(),
    });
  }

  function frame(now) { if (!lastFrame) lastFrame = now; const dt = Math.min(.033, (now - lastFrame) / 1000); lastFrame = now; update(dt); draw(now); requestAnimationFrame(frame); }
  function loadImage(path) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = path; }); }
  function updatePersonalBest() { const best = game.personalBest; ui.personalBestText.textContent = best.runs ? `Sky rescue best: ${best.score.toLocaleString()} points • ${formatTime(best.time)} • ${best.medal}` : 'Your first rescue sets the record!'; }

  Promise.all([
    world1Background.ready, loadImage('assets/taco_hero_sheet.png'), loadImage('assets/items_sheet.png'), loadImage('assets/olivia_plane_sheet_v3.png?v=2'),
    loadImage('assets/sky_checkpoints_v1.png'), loadImage('assets/crash_fiesta_v1.png'), loadImage('assets/fiesta_finish_banner.png'),
    loadImage('assets/world1_2_tomato_trouble_aviator_sheet_v1.webp'), loadImage('assets/world1_2_onion_drama_aviator_sheet_v1.webp'),
    loadImage('assets/world1_2_jalapeno_popper_aviator_sheet_v1.webp'), loadImage('assets/world1_2_chili_bandit_aviator_sheet_v1.webp'),
    loadImage('assets/world1_2_lime_aviator_sheet_v1.webp'), loadImage('assets/world1_2_queso_cadet_sheet_v1.webp'),
    loadImage('assets/world1_2_airfield_crash_crew_v1.webp'),
    loadImage('assets/world1_2_ground_airfield_v1.webp'), loadImage('assets/world1_2_ground_sunny_v1.webp'),
    loadImage('assets/world1_2_ground_banner_v1.webp'), loadImage('assets/world1_2_ground_mesa_v1.webp'),
    loadImage('assets/world1_2_ground_guac_v1.webp'), loadImage('assets/world1_2_ground_rescue_v1.webp'),
    loadImage('assets/world1_2_platform_wing_v1.webp'), loadImage('assets/world1_2_platform_adobe_v1.webp'),
    loadImage('assets/world1_2_platform_guac_v1.webp'), loadImage('assets/world1_2_olivia_plane_throw_arm_v1.webp'),
  ]).then(([
    , hero, items, plane, checkpoints, crash, fiestaBanner,
    world1_2_tomato_trouble_aviator_sheet_v1, world1_2_onion_drama_aviator_sheet_v1,
    world1_2_jalapeno_popper_aviator_sheet_v1, world1_2_chili_bandit_aviator_sheet_v1,
    world1_2_lime_aviator_sheet_v1, world1_2_queso_cadet_sheet_v1,
    world1_2_airfield_crash_crew_v1,
    world1_2_ground_airfield_v1, world1_2_ground_sunny_v1,
    world1_2_ground_banner_v1, world1_2_ground_mesa_v1,
    world1_2_ground_guac_v1, world1_2_ground_rescue_v1,
    world1_2_platform_wing_v1, world1_2_platform_adobe_v1,
    world1_2_platform_guac_v1, world1_2_olivia_plane_throw_arm_v1,
  ]) => {
    Object.assign(images, {
      hero, items, plane, checkpoints, crash, fiestaBanner,
      world1_2_tomato_trouble_aviator_sheet_v1, world1_2_onion_drama_aviator_sheet_v1,
      world1_2_jalapeno_popper_aviator_sheet_v1, world1_2_chili_bandit_aviator_sheet_v1,
      world1_2_lime_aviator_sheet_v1, world1_2_queso_cadet_sheet_v1,
      world1_2_airfield_crash_crew_v1,
      world1_2_ground_airfield_v1, world1_2_ground_sunny_v1,
      world1_2_ground_banner_v1, world1_2_ground_mesa_v1,
      world1_2_ground_guac_v1, world1_2_ground_rescue_v1,
      world1_2_platform_wing_v1, world1_2_platform_adobe_v1,
      world1_2_platform_guac_v1, world1_2_olivia_plane_throw_arm_v1,
    });
    loadProgress(); setupInputs(); resetGame(); syncSettings(); updatePersonalBest(); requestAnimationFrame(frame);
  }).catch((error) => { console.error('Could not load Sky-High Salsa Rescue assets:', error); ctx.fillStyle = '#fff5d2'; ctx.font = '24px Arial'; ctx.fillText('The sky-rescue artwork could not be loaded.', 40, 70); });
})();
