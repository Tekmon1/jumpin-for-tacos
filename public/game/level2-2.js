(() => {
  const SOURCE_VERSION = 'w2-2-v12-alternating-super-run';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const heroCore = window.JFT_HERO_CORE;
  const heroPhysics = heroCore.physics;

  const ui = {
    startOverlay: document.getElementById('startOverlay'),
    winOverlay: document.getElementById('winOverlay'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    muteBtn: document.getElementById('muteBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    musicVolume: document.getElementById('musicVolume'),
    musicVolumeValue: document.getElementById('musicVolumeValue'),
    effectsVolume: document.getElementById('effectsVolume'),
    effectsVolumeValue: document.getElementById('effectsVolumeValue'),
    reducedShake: document.getElementById('reducedShake'),
    personalBestText: document.getElementById('personalBestText'),
    medalBadge: document.getElementById('medalBadge'),
    resultScore: document.getElementById('resultScore'),
    resultTime: document.getElementById('resultTime'),
    resultTacos: document.getElementById('resultTacos'),
    resultGolden: document.getElementById('resultGolden'),
    resultBoat: document.getElementById('resultBoat'),
    resultWave: document.getElementById('resultWave'),
    winText: document.getElementById('winText'),
    newBestText: document.getElementById('newBestText'),
  };

  const WORLD_WIDTH = 35000;
  const GROUND_Y = 460;
  const ENVIRONMENT_TRANSITION_WIDTH = 1600;
  const ENVIRONMENT_PANORAMA_CROP = 0.9;
  const sections = [
    { id: 'camp', name: 'Coconut Campgrounds', start: 0, end: 6500, music: 'camp', accent: '#ffd65a' },
    { id: 'geyser', name: 'Geyser Gardens', start: 6500, end: 12500, music: 'geyser', accent: '#65e7ff' },
    { id: 'caves', name: 'Lava Tube Laughs', start: 12500, end: 19000, music: 'caves', accent: '#bb8cff' },
    { id: 'eruption', name: 'Caldera KABOOM', start: 19000, end: 27000, music: 'eruption', accent: '#ff704d' },
    { id: 'luau', name: 'Rainbow Lava Luau', start: 27000, end: WORLD_WIDTH, music: 'luau', accent: '#ff75bd' },
  ];
  const checkpoints = [
    { x: 5400, name: 'Taco Tent Basecamp', look: 'camp', sign: 'OLIVIA RADIO: VOLCANO STATUS — EMOTIONALLY AVAILABLE.', accent: '#ffd65a' },
    { x: 11600, name: 'Geyser Picnic Stop', look: 'geyser', sign: 'OLIVIA RADIO: DO NOT FEED THE GEYSERS. THEY GET CLINGY.', accent: '#65e7ff' },
    { x: 18100, name: 'Lava-Tube Lantern Camp', look: 'caves', sign: 'OLIVIA RADIO: CAVE ECHO RATED 10/10 FOR TACO CRUNCH.', accent: '#bb8cff' },
    { x: 25900, name: 'Ashfall Ranger Station', look: 'eruption', sign: 'OLIVIA RADIO: ASH IS JUST SPICY WEATHER!', accent: '#ff8b5f' },
    { x: 33050, name: 'Caldera Camper Fiesta', look: 'luau', sign: 'OLIVIA RADIO: FIVE-STAR CAMPSITE. SLIGHTLY MOLTEN.', accent: '#ff75bd' },
  ];

  const tracks = {
    camp: document.getElementById('musicCamp'),
    geyser: document.getElementById('musicGeyser'),
    caves: document.getElementById('musicCaves'),
    eruption: document.getElementById('musicEruption'),
    luau: document.getElementById('musicLuau'),
  };
  const sharedAbilities = window.JFT_SHARED_ABILITIES;
  const audio = window.JFT_AUDIO;
  const allTracks = Object.values(tracks);
  const images = {};
  const environmentImageKeys = {
    camp: 'environmentCamp',
    geyser: 'environmentGeyser',
    caves: 'environmentCaves',
    eruption: 'environmentEruption',
    luau: 'environmentLuau',
  };
  const terrainRows = { camp: 0, geyser: 1, caves: 2, eruption: 3, luau: 4 };
  const checkpointArtKeys = {
    camp: 'checkpointCamp',
    geyser: 'checkpointGeyser',
    caves: 'checkpointCaves',
    eruption: 'checkpointEruption',
    luau: 'checkpointLuau',
  };
  const checkpointPadRows = {
    camp: [0, 10, 1536, 190],
    geyser: [0, 214, 1536, 190],
    caves: [0, 418, 1536, 190],
    eruption: [0, 622, 1536, 190],
    luau: [0, 826, 1536, 190],
  };
  const terrainSourceRows = {
    ground: [
      [0, 10, 1536, 190], [0, 214, 1536, 190], [0, 418, 1536, 190],
      [0, 622, 1536, 190], [0, 826, 1536, 190],
    ],
    platform: [
      [0, 10, 1536, 190], [0, 214, 1536, 190], [0, 418, 1536, 190],
      [0, 622, 1536, 190], [0, 826, 1536, 190],
    ],
  };
  const calderaEnemyDrawProfiles = Object.freeze({
    marshmallow: Object.freeze({ width: 78, height: 94 }),
    pineapple: Object.freeze({ width: 76, height: 90 }),
    queso: Object.freeze({ width: 76, height: 94 }),
    pepper: Object.freeze({ width: 70, height: 88 }),
    crab: Object.freeze({ width: 76, height: 96 }),
    nacho: Object.freeze({ width: 76, height: 90 }),
    ash: Object.freeze({ width: 76, height: 66 }),
  });
  const calderaPlatformVisualProfile = Object.freeze({
    groundMinimumHeight: 86,
    elevatedMinimumHeight: 46,
    elevatedExtraDepth: 22,
  });
  const calderaTrekkerRearLauncher = Object.freeze({
    xOffset: -104,
    yOffset: -119,
    pulseDuration: .16,
  });
  const keys = { left: false, right: false, jump: false };
  const world = {
    platforms: [], collectibles: [], enemies: [], checkpoints: [], cannons: [],
    surfObstacles: [], geysers: [], goal: { x: 34440, y: 320, w: 120, h: 140 },
  };
  const player = {
    x: 140, y: 380, w: 34, h: 42, vx: 0, vy: 0, dir: 1,
    grounded: false, platform: null, anim: 0, invulnerable: 0,
    coyote: 0, jumpBuffer: 0, rotation: 0, scale: 1,
  };
  const game = {
    state: 'title', score: 0, collected: 0, totalCollectibles: 0,
    goldenCollected: 0, totalGolden: 8, rainbowCollected: 0, totalRainbow: 8,
    hearts: 3, cameraX: 0, levelTime: 0, startTime: 0, finishTime: 0,
    sectionIndex: 0, announcedSections: new Set(), latestCheckpoint: null,
    message: '', messageTimer: 0, streak: 0, streakTimer: 0, bestStreak: 0,
    splatCombo: 0, splatTimer: 0, bestSplat: 0,
    abilities: sharedAbilities.createState(),
    activePower: null, limeShield: false, pepperTimer: 0, coconutLaunchTimer: 0,
    wave: { active: false, done: false, x: 0, speed: 0, crashing: false, crashTimer: 0 },
    surf: {
      phase: 'idle', oliviaX: 0, oliviaY: 330, oliviaTimer: 0,
      boardMounted: false, mountX: 25900, landingLaunched: false, clearedObstacles: 0,
    },
    boat: { state: 'basecamp', x: 720, speed: 0, dropTimer: 0, dropPulse: 0, catches: 0, pass: 0 },
    eruption: { state: 'dormant', timer: 0, flash: 0, tremor: 0, rainbowBurst: 0 },
    cannonballs: [],
    tideY: 474, confetti: [], particles: [], impactTexts: [], fireworks: [],
    cameraShake: 0, hitStop: 0, celebrationTime: 0, partyBeat: -1,
    muted: false, musicVolume: 0.7, effectsVolume: 0.8, reducedShake: false,
    settingsOpen: false, respawn: heroCore.createRespawnState(),
    activeMusic: null, musicTransition: null,
    musicTransitionCount: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
    personalBest: { score: 0, time: 0, runs: 0, medal: '' },
    respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null,
    platformOverlapCount: 0, checkpointsGrounded: 0,
    environmentRemasterReady: false, foregroundRemasterReady: false,
    world2EncounterAudit: null, geyserLaunchTimer: 0,
  };

  let vehicleLoopHandle = null;
  let volcanoLoopHandle = null;
  let lastFrame = 0;
  let randomSeed = 0xC0C0A;
  const params = new URLSearchParams(location.search);
  const previewHost = ['terminal.local', 'localhost', '127.0.0.1'].includes(location.hostname);
  const previewStart = previewHost ? Number(params.get('startX') || 0) : 0;
  const previewAutoRun = previewHost && params.get('autoRun') === '1';
  const previewAutoJump = previewHost && params.get('autoJump') === '1';
  const previewFastCelebrate = previewHost && params.get('fastCelebrate') === '1';
  const previewSuper = previewHost && params.get('super') === '1';
  const previewRespawn = previewHost && params.get('respawn') === '1';
  const previewRespawnCheckpoint = previewHost ? Number(params.get('respawnCheckpoint') || -1) : -1;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (value) => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };

  audio?.registerMusicTracks(tracks);
  audio?.preloadGroups(['global', 'world2']).catch(() => {
    // Missing assets use the engine's centralized emergency fallback.
  });

  function playAudio(eventId, options = {}) {
    return audio?.play(eventId, options) || null;
  }

  function audioPosition(worldX) {
    return clamp(((worldX - game.cameraX) / canvas.width) * 2 - 1, -1, 1);
  }

  function startVehicleLoop(position = 0) {
    if (vehicleLoopHandle) return;
    vehicleLoopHandle = audio?.startLoop('vehicle.idle', { vehicleType: 'trekker', position }) || null;
  }

  function stopVehicleLoop() {
    if (!vehicleLoopHandle) return;
    audio?.stopLoop(vehicleLoopHandle);
    vehicleLoopHandle = null;
  }

  function startVolcanoLoop() {
    if (volcanoLoopHandle) return;
    volcanoLoopHandle = audio?.startLoop('volcano.active') || null;
  }

  function stopVolcanoLoop() {
    if (!volcanoLoopHandle) return;
    audio?.stopLoop(volcanoLoopHandle);
    volcanoLoopHandle = null;
  }
  function blendHex(from, to, amount) {
    const read = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    const a = read(from); const b = read(to);
    return `rgb(${a.map((channel, index) => Math.round(lerp(channel, b[index], amount))).join(',')})`;
  }
  function blendedPalette(paletteMap, x, distance = 720) {
    const sectionIndex = Math.max(0, sections.findIndex((section) => x >= section.start && x < section.end));
    const section = sections[sectionIndex] || sections.at(-1);
    const previous = sections[Math.max(0, sectionIndex - 1)];
    const next = sections[Math.min(sections.length - 1, sectionIndex + 1)];
    let from = paletteMap[section.id]; let to = from; let amount = 0;
    if (sectionIndex > 0 && x < section.start + distance) {
      from = paletteMap[previous.id]; to = paletteMap[section.id];
      amount = smoothstep((x - section.start) / distance);
    } else if (sectionIndex < sections.length - 1 && x > section.end - distance) {
      from = paletteMap[section.id]; to = paletteMap[next.id];
      amount = smoothstep((x - (section.end - distance)) / distance);
    }
    return { colors: from.map((color, index) => blendHex(color, to[index], amount)), from: from === paletteMap[section.id] ? section.id : previous.id, to: to === paletteMap[section.id] ? section.id : next.id, amount };
  }
  const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const seeded = () => {
    randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };

  function currentSection(x = player.x) {
    return sections.find((section) => x >= section.start && x < section.end) || sections[sections.length - 1];
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function addPlatform(data) {
    const platform = { dx: 0, dy: 0, ...data };
    if (platform.moving) {
      platform.baseX = platform.x;
      platform.baseY = platform.y;
    }
    world.platforms.push(platform);
    return platform;
  }

  function addItem(x, y, type = 'taco', extra = {}) {
    const large = ['golden', 'rainbow', 'lime', 'pepper', 'shell', 'coconut'].includes(type);
    const item = { x, y, w: large ? 32 : 24, h: large ? 32 : 24, type, bob: seeded() * Math.PI * 2, collected: false, ...extra };
    world.collectibles.push(item);
    return item;
  }

  function addLine(x, y, count, gap = 52, type = 'taco', extra = {}) {
    for (let i = 0; i < count; i += 1) addItem(x + i * gap, y, type, { ...extra, bob: i * 0.35 });
  }

  function addArc(x, y, count, gap, height = 78, type = 'taco') {
    for (let i = 0; i < count; i += 1) {
      const t = count <= 1 ? 0 : i / (count - 1);
      addItem(x + i * gap, y - Math.sin(t * Math.PI) * height, type, { bob: t * 2 });
    }
  }

  function addGroundRoute(section, config) {
    let x = section.start;
    let index = 0;
    while (x < section.end - 80) {
      const length = config.lengths[index % config.lengths.length];
      const gap = config.gaps[index % config.gaps.length];
      const width = Math.min(length, section.end - x);
      addPlatform({ x, y: GROUND_Y, w: width, h: 100, style: config.style, ground: true });
      const gapStart = x + width;
      if (gap > 135 && gapStart + gap < section.end) {
        addPlatform({
          x: gapStart + gap * 0.5 - 72, y: 382 - (index % 2) * 24, w: 144, h: 24,
          style: config.moverStyle, moving: true, axis: index % 3 === 0 ? 'y' : 'x',
          range: index % 3 === 0 ? 38 : 46, speed: 1.25 + (index % 4) * 0.12, phase: index * 0.8,
          mainRoute: true,
        });
      }
      x += width + gap;
      index += 1;
    }
  }

  function addUpperRoute(section, style, startOffset, step, skipStart = -1, skipEnd = -1) {
    const heights = [352, 296, 238, 312, 268, 338];
    let index = 0;
    for (let x = section.start + startOffset; x < section.end - 260; x += step) {
      if (x > skipStart && x < skipEnd) continue;
      const moving = index % 4 === 1;
      const platform = addPlatform({
        x, y: heights[index % heights.length], w: 150 + (index % 3) * 24, h: 24,
        style, moving, axis: style === 'leaf' && index % 2 ? 'swing' : index % 2 ? 'y' : 'x',
        range: moving ? 38 + (index % 3) * 10 : 0, speed: 1.15 + (index % 5) * 0.14, phase: index * 0.73,
      });
      if (moving && style === 'raft') platform.tideRide = true;
      index += 1;
    }
  }

  function addReachableDetours(section, style, startOffset = 420, interval = 1550) {
    let group = 0;
    for (let baseX = section.start + startOffset; baseX < section.end - 760; baseX += interval) {
      const offsets = [0, -220, 220, -360, 360];
      const canPlaceGroup = (candidateBase) => {
        if (candidateBase < section.start + 80 || candidateBase + 672 > section.end - 80) return false;
        const candidates = [
          { x: candidateBase, y: 350 },
          { x: candidateBase + 174, y: 294 },
          { x: candidateBase + 348, y: 238 },
          { x: candidateBase + 522, y: 306 },
        ];
        return candidates.every((candidate) => !world.platforms.some((platform) => (
          !platform.ground
          && candidate.x < platform.x + platform.w
          && candidate.x + 150 > platform.x
          && Math.abs(candidate.y - platform.y) < 42
        )));
      };
      const resolvedBase = offsets
        .map((offset) => baseX + offset)
        .find((candidateBase) => canPlaceGroup(candidateBase));
      if (resolvedBase == null) {
        group += 1;
        continue;
      }
      const steps = [
        { x: resolvedBase, y: 350 },
        { x: resolvedBase + 174, y: 294 },
        { x: resolvedBase + 348, y: 238 },
        { x: resolvedBase + 522, y: 306 },
      ];
      steps.forEach((step, index) => {
        const moving = index === 1 && group % 2 === 1;
        addPlatform({
          x: step.x,
          y: step.y,
          w: 150,
          h: 24,
          style,
          moving,
          axis: 'y',
          range: moving ? 18 : 0,
          speed: 1.05,
          phase: group * .7,
          reachableDetour: true,
        });
      });
      group += 1;
    }
  }

  function platformAt(x, minWidth = 210) {
    return world.platforms.find((platform) => platform.ground && platform.w >= minWidth && x > platform.x + 55 && x < platform.x + platform.w - 55);
  }

  function surfacePlatformAt(x, styles = [], options = {}) {
    const allowedStyles = Array.isArray(styles) ? styles : [styles];
    const edgePadding = options.edgePadding ?? 18;
    return world.platforms
      .filter((platform) => !platform.ground && !platform.secret)
      .filter((platform) => !allowedStyles.length || allowedStyles.includes(platform.style))
      .filter((platform) => platform.w >= (options.minWidth ?? 100))
      .filter((platform) => x > platform.x + edgePadding && x < platform.x + platform.w - edgePadding)
      .sort((a, b) => Math.abs((a.x + a.w / 2) - x) - Math.abs((b.x + b.w / 2) - x))[0] || null;
  }

  function ensureCalderaSurface(x, style, y, width = 164) {
    const existing = surfacePlatformAt(x, [style], { minWidth: 100 });
    if (existing) return existing;
    const candidateX = x - width / 2;
    const overlap = world.platforms.some((platform) => (
      !platform.ground
      && candidateX < platform.x + platform.w
      && candidateX + width > platform.x
      && Math.abs(y - platform.y) < 42
    ));
    if (overlap) return surfacePlatformAt(x, [], { minWidth: 100 });
    return addPlatform({ x: candidateX, y, w: width, h: 24, style, encounterSurface: true });
  }

  function addCalderaFormation(definition) {
    const platform = definition.platform || ensureCalderaSurface(definition.x, definition.style, definition.y ?? 320, definition.width ?? 164);
    if (!platform) return [];
    const count = definition.count ?? 2;
    const width = definition.w ?? 44;
    const height = definition.h ?? 44;
    const spacing = definition.spacing ?? 56;
    const verticalOffset = definition.verticalOffset ?? 0;
    const enemies = heroCore.createEnemyFormation({
      id: definition.id,
      type: definition.type,
      startX: definition.x - ((count - 1) * spacing) / 2,
      y: platform.y - height + verticalOffset,
      w: width,
      h: height,
      count,
      spacing,
      vx: definition.speed ?? 44,
      role: definition.role || 'platform-sentry',
      platform,
      platformOffsetY: verticalOffset,
      formationPurpose: definition.purpose || 'World 2 caldera surface encounter',
    });
    enemies.forEach((enemy, index) => {
      enemy.platform = platform;
      enemy.platformOffsetY = verticalOffset;
      enemy.surfaceKind = definition.surfaceKind;
      enemy.encounterId = definition.id;
      enemy.requiresGeyserAirborne = Boolean(definition.requiresGeyserAirborne);
      enemy.geyserX = definition.geyserX;
      enemy.dir = index % 2 ? -1 : 1;
      enemy.speed = definition.speed ?? 44;
      enemy.clock = index * .41;
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length + index, definition.behaviorType || ({ ash: 'tomato', pepper: 'jalapeno', crab: 'chili', pineapple: 'chili' }[definition.type] || 'tomato'));
    });
    heroCore.attachEnemiesToPlatforms(enemies, [platform], { edgePadding: 18, surfaceTolerance: 48 });
    heroCore.retuneEnemyFormationPatrols(enemies, { fullPlatformCoverage: true, minimumGap: 8, edgePadding: 18 });
    world.enemies.push(...enemies);
    return enemies;
  }

  function placeSecretPlatform(x, y, width, style) {
    const offsets = [0, -220, 220, -340, 340];
    const resolvedX = offsets
      .map((offset) => x + offset)
      .find((candidateX) => (
        candidateX > 120
        && candidateX + width < WORLD_WIDTH - 120
        && !world.platforms.some((platform) => (
          !platform.ground
          && candidateX < platform.x + platform.w
          && candidateX + width > platform.x
          && Math.abs(y - platform.y) < 42
        ))
      ));
    if (resolvedX == null) return null;
    return addPlatform({ x: resolvedX, y, w: width, h: 22, style, secret: true });
  }

  function buildWorld() {
    randomSeed = 0xC0C0A;
    world.platforms = [];
    world.collectibles = [];
    world.enemies = [];
    world.cannons = [];
    world.surfObstacles = [];
    world.checkpoints = heroCore.createCheckpointSet(checkpoints, {
      defaults: { y: 326, w: 188, h: 134 },
    });

    addGroundRoute(sections[0], { lengths: [760, 620, 840, 700], gaps: [82, 104, 168, 92], style: 'sand', moverStyle: 'surfboard' });
    addGroundRoute(sections[1], { lengths: [620, 780, 680, 860], gaps: [96, 126, 178, 88], style: 'canopy-ground', moverStyle: 'leaf' });
    addGroundRoute({ start: 14500, end: 16600 }, { lengths: [580, 720, 640], gaps: [110, 176, 94], style: 'temple-ground', moverStyle: 'raft' });

    // Olivia's taco-catamaran gets a long, open water corridor with forgiving docks.
    addPlatform({ x: 16540, y: 438, w: 620, h: 102, style: 'dock', ground: true });
    for (let x = 17200, index = 0; x < 21200; x += 500, index += 1) {
      addPlatform({
        x, y: 420, w: 420, h: 24, style: index % 2 ? 'surfboard' : 'raft', moving: true,
        axis: 'tide', range: 12 + (index % 3) * 4, speed: 0.85 + index * 0.035, phase: index * 0.65, tideRide: true,
        mainRoute: true,
      });
    }
    addPlatform({ x: 21200, y: 438, w: 900, h: 102, style: 'dock', ground: true });
    addGroundRoute({ start: 22100, end: 24500 }, { lengths: [620, 760, 560], gaps: [100, 170, 86], style: 'temple-ground', moverStyle: 'raft' });

    // The final act is a readable, enemy-free surf set piece. An invisible
    // collision lane keeps the board glued to the water while the beach bookends
    // make the mount and dismount unmistakable.
    addPlatform({ x: 24500, y: GROUND_Y, w: 1120, h: 100, style: 'moon-sand', ground: true, finalRunway: true, surfLaunchBeach: true });
    addPlatform({ x: 25620, y: GROUND_Y, w: 7660, h: 20, style: 'surf-lane', ground: true, finalRunway: true, surfLane: true });
    addPlatform({ x: 33280, y: GROUND_Y, w: WORLD_WIDTH - 33280, h: 100, style: 'moon-sand', ground: true, finalRunway: true, surfLandingBeach: true });

    world.surfObstacles = [
      { x: 27040, y: 410, w: 74, h: 50, type: 'driftwood', hit: false },
      { x: 28180, y: 396, w: 78, h: 64, type: 'coral', hit: false },
      { x: 29360, y: 406, w: 82, h: 54, type: 'buoy', hit: false },
      { x: 30620, y: 392, w: 86, h: 68, type: 'tiki', hit: false },
      { x: 31920, y: 402, w: 84, h: 58, type: 'coconuts', hit: false },
    ];

    addUpperRoute(sections[0], 'surfboard', 420, 430);
    addUpperRoute(sections[1], 'leaf', 360, 420);
    addUpperRoute(sections[2], 'temple', 330, 460, 16300, 22100);

    const secretRewards = [
      [1220, 166], [5100, 154], [8750, 142], [12150, 160],
      [15380, 154], [18780, 150], [22620, 145], [34880, 138],
    ];
    secretRewards.forEach(([x, y], index) => {
      addPlatform({ x: x - 70, y: y + 50, w: 176, h: 22, style: index < 2 ? 'surfboard' : index < 4 ? 'leaf' : index < 7 ? 'temple' : 'glowboard', secret: true });
      addItem(x, y, 'golden');
    });

    const rainbowRewards = [3150, 6700, 10380, 13820, 16080, 20180, 23920, 35080];
    rainbowRewards.forEach((x, index) => {
      const y = 190 + (index % 3) * 28;
      const sectionId = currentSection(x).id;
      addPlatform({ x: x - 62, y: y + 52, w: 154, h: 22, style: sectionId === 'fiesta' ? 'glowboard' : sectionId === 'canopy' ? 'leaf' : sectionId === 'tides' ? 'temple' : 'surfboard', secret: true });
      addItem(x, y, 'rainbow');
    });

    // Add a safe island only when a checkpoint is not already over solid ground.
    world.checkpoints.forEach((checkpoint) => {
      if (platformAt(checkpoint.x, 160)) return;
      const sectionId = currentSection(checkpoint.x).id;
      addPlatform({ x: checkpoint.x - 70, y: GROUND_Y, w: 360, h: 100, style: sectionId === 'fiesta' || sectionId === 'surge' ? 'moon-sand' : sectionId === 'tides' ? 'dock' : sectionId === 'canopy' ? 'canopy-ground' : 'sand', ground: true, checkpointPad: true });
    });

    // Collectible trails are generated from actual platform geometry.
    for (const platform of world.platforms) {
      if (platform.checkpointPad) continue;
      if (platform.ground) {
        const start = platform.x + 70;
        const end = platform.x + platform.w - 50;
        if ((start > 16800 && start < 22000) || platform.surfLane) continue;
        const count = Math.max(2, Math.floor((end - start) / 38));
        addLine(start, platform.y - 48, count, 38);
      } else {
        const count = Math.max(2, Math.floor((platform.w - 30) / 36));
        const items = [];
        for (let i = 0; i < count; i += 1) items.push(addItem(platform.x + 18 + i * 36, platform.y - 46, 'taco', { bob: i * 0.4 }));
        if (platform.moving) {
          items.forEach((item) => {
            item.ridePlatform = platform;
            item.rideOffsetX = item.x - platform.x;
            item.rideOffsetY = item.y - platform.y;
          });
        }
      }
    }

    const ground = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    for (let i = 0; i < ground.length - 1; i += 1) {
      const from = ground[i];
      const to = ground[i + 1];
      const gap = to.x - (from.x + from.w);
      if (gap > 20 && gap <= 230 && !(from.x > 16300 && from.x < 22100)) {
        addArc(from.x + from.w - 36, GROUND_Y - 48, 6, (gap + 72) / 5, 72);
      }
    }

    // Tacos telegraph every surf jump. Each obstacle sits beneath the center of
    // a generous arc, with calmer rows before mounting and after landing.
    addLine(24720, 402, 16, 42);
    world.surfObstacles.forEach((obstacle, index) => {
      addArc(obstacle.x - 152, 402, 11, 34, 92 + (index % 2) * 12);
    });
    for (let x = 26300, index = 0; x < 32900; x += 520, index += 1) {
      if (world.surfObstacles.some((obstacle) => Math.abs(obstacle.x - x) < 250)) continue;
      addArc(x, 402, 8, 36, 46 + (index % 3) * 14);
    }
    addLine(33420, 402, 38, 46);

    // Each checkpoint opens with a compact reward fan that never obscures Olivia's sign.
    world.checkpoints.forEach((checkpoint) => addArc(checkpoint.x - 118, 406, 9, 30, 54));

    [
      [3900, 'lime'], [9040, 'shell'], [13900, 'coconut'], [15820, 'lime'],
      [22320, 'shell'], [24840, 'pepper'], [28920, 'coconut'], [33720, 'lime'],
    ].forEach(([x, type]) => addItem(x, 402, type));

    const enemySlots = [
      1850, 2850, 4650, 5950, 7200,
      8350, 9620, 10800, 12100, 13800,
      15150, 16000, 22250, 23200,
    ];
    const typesBySection = {
      shore: ['crab', 'seagull', 'puffer'], canopy: ['coconut', 'seagull', 'crab'],
      tides: ['puffer', 'crab', 'seagull'], surge: [], fiesta: [],
    };
    const islandBehaviors = { crab: 'chili', seagull: 'onion', puffer: 'jalapeno', coconut: 'tomato', tiki: 'jalapeno' };
    enemySlots.forEach((desiredX, index) => {
      const platform = platformAt(desiredX);
      if (!platform) return;
      const choices = typesBySection[currentSection(desiredX).id];
      const type = choices[index % choices.length];
      const y = type === 'seagull' ? platform.y - 118 : platform.y - 38;
      const enemy = {
        x: desiredX, y, baseY: y, w: 40, h: 38, type, alive: true, defeated: false,
        behaviorType: islandBehaviors[type],
        dir: index % 2 ? -1 : 1, speed: 48 + (index % 4) * 9,
        minX: Math.max(platform.x + 20, desiredX - 115), maxX: Math.min(platform.x + platform.w - 60, desiredX + 115),
        clock: index * 0.47, platform,
      };
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length, enemy.behaviorType);
      world.enemies.push(enemy);
    });

    // A safe shoreline bounce line makes both global combo milestones
    // reachable in the island world without changing its main difficulty.
    const islandComboPositions = [240, 460, 680, 910, 1130];
    if (islandComboPositions.every((x) => platformAt(x))) {
      ['crab', 'coconut', 'puffer', 'tiki', 'crab'].forEach((type, index) => {
        const x = islandComboPositions[index];
        const islandComboPlatform = platformAt(x);
        const enemy = {
          x, y: islandComboPlatform.y - 38, baseY: islandComboPlatform.y - 38,
          w: 40, h: 38, type, alive: true, defeated: false,
          behaviorType: islandBehaviors[type], comboHelper: true,
          dir: index % 2 ? -1 : 1, speed: 40,
          minX: x - 12, maxX: x + 12, clock: index * .31, platform: islandComboPlatform,
        };
        heroCore.prepareEnemyBehavior(enemy, world.enemies.length, enemy.behaviorType);
        world.enemies.push(enemy);
      });
    }

    world.platforms.sort((a, b) => a.x - b.x);
    const mainRoute = world.platforms.filter((platform) => platform.ground || platform.mainRoute).sort((a, b) => a.x - b.x);
    let coveredTo = 0;
    let maximumGap = 0;
    for (const platform of mainRoute) {
      maximumGap = Math.max(maximumGap, platform.x - coveredTo);
      coveredTo = Math.max(coveredTo, platform.x + platform.w);
    }
    game.routeMaxGap = Math.round(maximumGap);
    game.totalCollectibles = world.collectibles.filter((item) => !item.bonusReward).length;
    game.totalGolden = world.collectibles.filter((item) => item.type === 'golden').length;
    game.totalRainbow = world.collectibles.filter((item) => item.type === 'rainbow').length;
    const elevated = world.platforms.filter((platform) => !platform.ground);
    game.platformOverlapPairs = [];
    game.platformSweepCrossings = 0;
    elevated.forEach((platform, index) => elevated.slice(index + 1).forEach((other) => {
      const xRange = (value) => value.moving && value.axis === 'x' ? value.range || 0 : 0;
      const yRange = (value) => value.moving && value.axis === 'y' ? value.range || 0 : 0;
      const sweepsCross = platform.x - xRange(platform) < other.x + other.w + xRange(other)
        && platform.x + platform.w + xRange(platform) > other.x - xRange(other)
        && Math.abs(platform.y - other.y) < 42 + yRange(platform) + yRange(other);
      if (sweepsCross) game.platformSweepCrossings += 1;
      if (
        platform.x < other.x + other.w
        && platform.x + platform.w > other.x
        && Math.abs(platform.y - other.y) < 42
      ) {
        game.platformOverlapPairs.push(
          `${platform.style || 'platform'}@${Math.round(platform.x)}:${Math.round(platform.y)}|`
          + `${other.style || 'platform'}@${Math.round(other.x)}:${Math.round(other.y)}`,
        );
      }
    }));
    game.platformOverlapCount = game.platformOverlapPairs.length;
    game.checkpointsGrounded = world.checkpoints.filter((checkpoint) => checkpoint.grounded !== false && Math.abs(checkpoint.y + checkpoint.h - GROUND_Y) <= 4).length;
  }

  function buildCalderaWorld() {
    randomSeed = 0xCA1DE2A;
    world.platforms = [];
    world.collectibles = [];
    world.enemies = [];
    world.cannons = [];
    world.surfObstacles = [];
    world.geysers = [];
    game.world2EncounterAudit = null;
    world.checkpoints = heroCore.createCheckpointSet(checkpoints, {
      defaults: { y: GROUND_Y, w: 210, h: 150 },
    });

    // The lower route is intentionally forgiving. Long visual gaps receive a
    // moving bridge, while upper routes remain optional taco-rich detours.
    addGroundRoute(sections[0], {
      lengths: [820, 680, 760, 900], gaps: [82, 106, 158, 94],
      style: 'sand', moverStyle: 'surfboard',
    });
    addGroundRoute(sections[1], {
      lengths: [720, 840, 680, 780], gaps: [94, 164, 112, 86],
      style: 'canopy-ground', moverStyle: 'leaf',
    });
    addGroundRoute(sections[2], {
      lengths: [760, 620, 880, 700], gaps: [108, 168, 92, 126],
      style: 'temple-ground', moverStyle: 'temple',
    });
    addGroundRoute(sections[3], {
      lengths: [740, 860, 660, 820], gaps: [96, 174, 110, 88],
      style: 'obsidian', moverStyle: 'obsidian-high',
    });
    addGroundRoute({ start: 27000, end: 33000 }, {
      lengths: [900, 760, 860, 720], gaps: [88, 142, 96, 104],
      style: 'moon-sand', moverStyle: 'glowboard',
    });
    addPlatform({
      x: 33000, y: GROUND_Y, w: WORLD_WIDTH - 33000, h: 100,
      style: 'moon-sand', ground: true, finalRunway: true, checkpointPad: false,
    });

    addReachableDetours(sections[0], 'surfboard', 520, 1580);
    addReachableDetours(sections[1], 'leaf', 430, 1520);
    addReachableDetours(sections[2], 'temple', 420, 1580);
    addReachableDetours(sections[3], 'obsidian-high', 460, 1620);
    addReachableDetours({ start: 27000, end: 32800 }, 'glowboard', 430, 1640);

    const goldenRewards = [
      [1450, 154], [5050, 164], [8260, 148], [11820, 160],
      [15100, 150], [18720, 158], [24120, 152], [31480, 154],
    ];
    goldenRewards.forEach(([x], index) => {
      const y = 286 + (index % 2) * 8;
      const section = currentSection(x);
      const style = section.id === 'camp' ? 'surfboard'
        : section.id === 'geyser' ? 'leaf'
          : section.id === 'caves' ? 'temple'
            : section.id === 'eruption' ? 'obsidian-high' : 'glowboard';
      const platform = placeSecretPlatform(x - 76, 338, 184, style);
      if (platform) addItem(platform.x + platform.w / 2, y, 'golden');
    });

    const rainbowRewards = [3300, 6350, 9700, 13800, 17200, 22100, 27800, 32600];
    rainbowRewards.forEach((x, index) => {
      const y = 288 + (index % 3) * 5;
      const section = currentSection(x);
      const style = section.id === 'camp' ? 'surfboard'
        : section.id === 'geyser' ? 'leaf'
          : section.id === 'caves' ? 'temple'
            : section.id === 'eruption' ? 'obsidian-high' : 'glowboard';
      const platform = placeSecretPlatform(x - 66, 338, 160, style);
      if (platform) addItem(platform.x + platform.w / 2, y, 'rainbow');
    });

    world.checkpoints.forEach((checkpoint) => {
      if (platformAt(checkpoint.x, 180)) return;
      const section = currentSection(checkpoint.x);
      const style = section.id === 'camp' ? 'sand'
        : section.id === 'geyser' ? 'canopy-ground'
          : section.id === 'caves' ? 'temple-ground'
            : section.id === 'eruption' ? 'obsidian' : 'moon-sand';
      addPlatform({
        x: checkpoint.x - 90, y: GROUND_Y, w: 420, h: 100,
        style, ground: true, checkpointPad: true,
      });
    });

    // One clean taco line per physical surface keeps the route legible.
    for (const platform of world.platforms) {
      if (platform.checkpointPad || platform.secret) continue;
      if (platform.ground) {
        const start = platform.x + 64;
        const end = platform.x + platform.w - 54;
        const count = Math.max(2, Math.floor((end - start) / 42));
        addLine(start, platform.y - 48, count, 42);
      } else {
        const count = Math.max(2, Math.floor((platform.w - 30) / 38));
        const items = [];
        for (let index = 0; index < count; index += 1) {
          items.push(addItem(platform.x + 18 + index * 38, platform.y - 46, 'taco', { bob: index * 0.42 }));
        }
        if (platform.moving) {
          items.forEach((item) => {
            item.ridePlatform = platform;
            item.rideOffsetX = item.x - platform.x;
            item.rideOffsetY = item.y - platform.y;
          });
        }
      }
    }

    const ground = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    for (let index = 0; index < ground.length - 1; index += 1) {
      const from = ground[index];
      const to = ground[index + 1];
      const gap = to.x - (from.x + from.w);
      if (gap > 20 && gap <= 235) {
        addArc(from.x + from.w - 32, GROUND_Y - 50, 7, (gap + 70) / 6, 74);
      }
    }

    world.checkpoints.forEach((checkpoint) => {
      addArc(checkpoint.x - 104, GROUND_Y - 48, 8, 30, 58);
    });

    [
      [3900, 'lime'], [7800, 'shell'], [11300, 'pepper'], [14600, 'coconut'],
      [17800, 'lime'], [21400, 'pepper'], [25800, 'shell'], [30600, 'coconut'],
    ].forEach(([x, type]) => addItem(x, 402, type));

    // Animated geysers are readable launch opportunities, not surprise damage.
    [7150, 8620, 10150, 11900].forEach((x, index) => {
      world.geysers.push({ x, y: GROUND_Y, phase: index * 0.78, cycle: 2.9 + index * 0.12 });
      addArc(x - 118, 400, 8, 34, 96);
    });

    world.cannons = [
      { id: 'caldera-cannon-a', x: 20700, y: 430, timer: .9, section: 'caldera' },
      { id: 'caldera-cannon-b', x: 23550, y: 430, timer: 1.6, section: 'caldera' },
      { id: 'caldera-cannon-c', x: 26300, y: 430, timer: 2.1, section: 'caldera' },
    ];

    const enemySlots = [
      1560, 1800, 2040, 2280, 2520,
      2200, 3450, 4700, 5900,
      7050, 8150, 9400, 10800, 12100,
      13200, 14450, 15800, 17150, 18400,
      19900, 21100, 22600, 24100, 25500, 26700,
      27900, 29400, 30900, 32200,
    ];
    const typesBySection = {
      camp: ['marshmallow', 'pineapple', 'queso'],
      geyser: ['pepper', 'crab', 'pineapple'],
      caves: ['nacho', 'queso', 'crab'],
      eruption: ['pepper', 'nacho', 'pineapple'],
      luau: ['marshmallow', 'queso', 'crab'],
    };
    const behaviors = {
      marshmallow: 'onion', pineapple: 'chili', queso: 'tomato',
      pepper: 'jalapeno', crab: 'chili', nacho: 'tomato', ash: 'tomato',
    };
    enemySlots.forEach((desiredX, index) => {
      if (desiredX >= 33000) return;
      const platform = platformAt(desiredX);
      if (!platform) return;
      const section = currentSection(desiredX);
      const choices = typesBySection[section.id];
      const type = choices[index % choices.length];
      const enemy = {
        x: desiredX,
        y: platform.y - 44,
        baseY: platform.y - 44,
        w: 44,
        h: 44,
        type,
        alive: true,
        defeated: false,
        behaviorType: behaviors[type],
        comboHelper: index < 5,
        dir: index % 2 ? -1 : 1,
        speed: 42 + (index % 4) * 8,
        minX: Math.max(platform.x + 22, desiredX - 108),
        maxX: Math.min(platform.x + platform.w - 64, desiredX + 108),
        clock: index * .43,
        platform,
      };
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length, enemy.behaviorType);
      world.enemies.push(enemy);
    });

    // Geyser Gardens turns vertical launch timing into the encounter. Guards
    // live above the vents but are harmless on the ground route; they become
    // dangerous only during the player's upward geyser launch window.
    const geyserGuardSpecs = [
      { id: 'geyser-guard-a', x: 7150, type: 'pepper', geyserX: 7150, style: 'leaf', surfaceKind: 'geyser-overlook', purpose: 'Guard above the first geyser launch' },
      { id: 'geyser-guard-b', x: 8620, type: 'crab', geyserX: 8620, style: 'leaf', surfaceKind: 'geyser-overlook', purpose: 'Guard above the second geyser launch' },
      { id: 'geyser-guard-c', x: 10150, type: 'pineapple', geyserX: 10150, style: 'leaf', surfaceKind: 'geyser-overlook', purpose: 'Guard above the third geyser launch' },
      { id: 'geyser-guard-d', x: 11900, type: 'pepper', geyserX: 11900, style: 'leaf', surfaceKind: 'geyser-overlook', purpose: 'Guard above the final geyser launch' },
    ];
    const geyserEnemies = [];
    geyserGuardSpecs.forEach((spec, index) => {
      const platform = ensureCalderaSurface(spec.x, spec.style, 320 - (index % 2) * 34, 164);
      geyserEnemies.push(...addCalderaFormation({
        ...spec, platform, count: 2, requiresGeyserAirborne: true,
      }));
    });

    // The eruption act uses unmistakable ash sentries on the elevated
    // obsidian route. Their platforms are optional, reachable bounce targets,
    // so the caldera remains readable from the lower route as well.
    const ashSpecs = [
      { id: 'ash-sentry-a', x: 19880, type: 'ash', style: 'obsidian-high', surfaceKind: 'obsidian-ash', purpose: 'Elevated obsidian ash sentry' },
      { id: 'ash-sentry-b', x: 21080, type: 'ash', style: 'obsidian-high', surfaceKind: 'obsidian-ash', purpose: 'Elevated obsidian ash sentry' },
      { id: 'ash-sentry-c', x: 22650, type: 'ash', style: 'obsidian-high', surfaceKind: 'obsidian-ash', purpose: 'Elevated obsidian ash sentry' },
      { id: 'ash-sentry-d', x: 24120, type: 'ash', style: 'obsidian-high', surfaceKind: 'obsidian-ash', purpose: 'Elevated obsidian ash sentry' },
      { id: 'ash-sentry-e', x: 25580, type: 'ash', style: 'obsidian-high', surfaceKind: 'obsidian-ash', purpose: 'Elevated obsidian ash sentry' },
    ];
    const ashEnemies = [];
    ashSpecs.forEach((spec) => ashEnemies.push(...addCalderaFormation({ ...spec, count: 2 })));

    const calderaSurfaceEnemies = [...geyserEnemies, ...ashEnemies];
    game.world2EncounterAudit = {
      sourceVersion: SOURCE_VERSION,
      level: '2-2',
      geyserGuardCount: geyserEnemies.length,
      geyserGuardPlatforms: new Set(geyserEnemies.map((enemy) => enemy.platform)).size,
      geyserGuardsRequireLaunch: geyserEnemies.filter((enemy) => enemy.requiresGeyserAirborne).length,
      ashEnemyCount: ashEnemies.length,
      ashPlatforms: new Set(ashEnemies.map((enemy) => enemy.platform)).size,
      calderaCannonCount: world.cannons.length,
      projectileMode: 'single-cannon-single-projectile',
      surfaceEnemies: calderaSurfaceEnemies.length,
    };

    world.platforms.sort((a, b) => a.x - b.x);
    const mainRoute = world.platforms
      .filter((platform) => platform.ground || platform.mainRoute)
      .sort((a, b) => a.x - b.x);
    let coveredTo = 0;
    let maximumGap = 0;
    for (const platform of mainRoute) {
      maximumGap = Math.max(maximumGap, platform.x - coveredTo);
      coveredTo = Math.max(coveredTo, platform.x + platform.w);
    }
    game.routeMaxGap = Math.round(maximumGap);
    game.totalCollectibles = world.collectibles.filter((item) => !item.bonusReward).length;
    game.totalGolden = world.collectibles.filter((item) => item.type === 'golden').length;
    game.totalRainbow = world.collectibles.filter((item) => item.type === 'rainbow').length;
    const elevated = world.platforms.filter((platform) => !platform.ground);
    game.platformOverlapPairs = [];
    game.platformSweepCrossings = 0;
    elevated.forEach((platform, index) => elevated.slice(index + 1).forEach((other) => {
      const xRange = (value) => value.moving && value.axis === 'x' ? value.range || 0 : 0;
      const yRange = (value) => value.moving && value.axis === 'y' ? value.range || 0 : 0;
      const sweepsCross = platform.x - xRange(platform) < other.x + other.w + xRange(other)
        && platform.x + platform.w + xRange(platform) > other.x - xRange(other)
        && Math.abs(platform.y - other.y) < 42 + yRange(platform) + yRange(other);
      if (sweepsCross) game.platformSweepCrossings += 1;
      if (
        platform.x < other.x + other.w
        && platform.x + platform.w > other.x
        && Math.abs(platform.y - other.y) < 42
      ) {
        game.platformOverlapPairs.push(
          `${platform.style || 'platform'}@${Math.round(platform.x)}:${Math.round(platform.y)}|`
          + `${other.style || 'platform'}@${Math.round(other.x)}:${Math.round(other.y)}`,
        );
      }
    }));
    game.platformOverlapCount = game.platformOverlapPairs.length;
    game.checkpointsGrounded = world.checkpoints.filter((checkpoint) => (
      Math.abs(checkpoint.y - GROUND_Y) <= 4
      || Math.abs(checkpoint.y + checkpoint.h - GROUND_Y) <= 4
    )).length;
  }

  function loadProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      const island = JSON.parse(localStorage.getItem('jumpinForTacosLevel22ProgressV1') || '{}');
      if (shared.settings) {
        game.musicVolume = clamp(Number(shared.settings.musicVolume ?? 0.7), 0, 1);
        game.effectsVolume = clamp(Number(shared.settings.effectsVolume ?? 0.8), 0, 1);
        game.reducedShake = Boolean(shared.settings.reducedShake);
        game.muted = Boolean(shared.settings.muted);
      }
      if (island.personalBest) game.personalBest = { ...game.personalBest, ...island.personalBest };
    } catch {
      // Storage is optional.
    }
  }

  function saveProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      shared.settings = { musicVolume: game.musicVolume, effectsVolume: game.effectsVolume, reducedShake: game.reducedShake, muted: game.muted };
      localStorage.setItem('jumpinForTacosProgressV2', JSON.stringify(shared));
      localStorage.setItem('jumpinForTacosLevel22ProgressV1', JSON.stringify({ personalBest: game.personalBest }));
    } catch {
      // Storage is optional.
    }
  }

  function updatePersonalBest() {
    const best = game.personalBest;
    ui.personalBestText.textContent = best.runs
      ? `Caldera best: ${best.score.toLocaleString()} points • ${formatTime(best.time)} • ${best.medal}`
      : 'Your first caldera run sets the record!';
  }

  function syncSettings() {
    ui.musicVolume.value = String(Math.round(game.musicVolume * 100));
    ui.effectsVolume.value = String(Math.round(game.effectsVolume * 100));
    ui.musicVolumeValue.textContent = `${ui.musicVolume.value}%`;
    ui.effectsVolumeValue.textContent = `${ui.effectsVolume.value}%`;
    ui.reducedShake.checked = game.reducedShake;
    ui.muteBtn.textContent = game.muted ? '🔇 Sound Off' : '🔊 Sound On';
    allTracks.forEach((track) => { track.muted = game.muted; });
    audio?.setMusicVolume(game.musicVolume);
    audio?.setEffectsVolume(game.effectsVolume);
    audio?.setMuted(game.muted);
  }

  function resetGame() {
    stopVehicleLoop();
    stopVolcanoLoop();
    buildCalderaWorld();
    Object.assign(game, {
      state: 'title', score: 0, collected: 0, goldenCollected: 0, rainbowCollected: 0,
      hearts: 3, cameraX: 0, levelTime: 0, startTime: 0, finishTime: 0,
      sectionIndex: 0, announcedSections: new Set(), latestCheckpoint: null,
      message: '', messageTimer: 0, streak: 0, streakTimer: 0, bestStreak: 0,
      splatCombo: 0, splatTimer: 0, bestSplat: 0,
      abilities: sharedAbilities.createState(),
      activePower: null, limeShield: false, pepperTimer: 0, coconutLaunchTimer: 0,
      wave: { active: false, done: false, x: 0, speed: 0, crashing: false, crashTimer: 0 },
      surf: {
        phase: 'idle', oliviaX: 0, oliviaY: 330, oliviaTimer: 0,
        boardMounted: false, mountX: 25900, landingLaunched: false, clearedObstacles: 0,
      },
      boat: { state: 'basecamp', x: 720, speed: 0, dropTimer: 0, dropPulse: 0, catches: 0, pass: 0 },
      eruption: { state: 'dormant', timer: 0, flash: 0, tremor: 0, rainbowBurst: 0 },
      cannonballs: [],
      geyserLaunchTimer: 0,
      tideY: 474, confetti: [], particles: [], impactTexts: [], fireworks: [],
      cameraShake: 0, hitStop: 0, celebrationTime: 0, partyBeat: -1,
      settingsOpen: false, respawn: heroCore.createRespawnState(),
      respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null,
      activeMusic: null, musicTransition: null,
      musicTransitionCount: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
    });
    Object.assign(player, { x: 140, y: 380, vx: 0, vy: 0, dir: 1, grounded: false, platform: null, anim: 0, invulnerable: 0, coyote: 0, jumpBuffer: 0, rotation: 0, scale: 1 });
    if (previewSuper) {
      sharedAbilities.activateSuper(game.abilities, 'qa-preview', { silent: true });
      game.abilities.transformTimer = 0;
    }
    world.checkpoints.forEach((checkpoint) => { checkpoint.activated = false; });
    stopMusic();
    ui.startOverlay.classList.remove('hidden');
    ui.startOverlay.classList.add('visible');
    ui.winOverlay.classList.add('hidden');
    ui.winOverlay.classList.remove('visible');
  }

  function unlockAudio() {
    audio?.init({
      musicVolume: game.musicVolume,
      effectsVolume: game.effectsVolume,
      muted: game.muted,
    });
  }

  function setMusic(name, immediate = false) {
    if (game.muted || !tracks[name]) return;
    const next = tracks[name];
    if (game.activeMusic === name) {
      next.play().catch(() => {});
      return;
    }
    if (game.musicTransition) {
      const current = game.activeMusic ? tracks[game.activeMusic] : null;
      allTracks.forEach((track) => {
        if (track !== current && !track.paused) { track.pause(); track.volume = 0; game.musicOverlapRecoveries += 1; }
      });
      game.musicTransition = null;
    }
    const fromName = game.activeMusic;
    const from = fromName ? tracks[fromName] : null;
    allTracks.forEach((track) => {
      if (track !== from && track !== next) { track.pause(); track.volume = 0; }
    });
    if (from && Number.isFinite(from.duration) && Number.isFinite(next.duration) && from.duration > 0 && next.duration > 0) {
      next.currentTime = ((from.currentTime % from.duration) / from.duration) * next.duration;
    } else next.currentTime = 0;
    next.playbackRate = 1;
    const base = game.settingsOpen ? 0.45 : 1;
    next.volume = immediate || !from ? base : 0;
    next.play().catch(() => {});
    game.activeMusic = name;
    if (immediate || !from) {
      allTracks.forEach((track) => {
        if (track !== next) { track.pause(); track.volume = 0; }
      });
    } else {
      game.musicTransition = { fromName, toName: name, from, to: next, elapsed: 0, duration: 3.2, fromGain: from.volume / Math.max(0.001, base) };
      game.musicTransitionCount += 1;
    }
  }

  function updateMusic(dt) {
    const base = game.settingsOpen ? 0.45 : 1;
    const transition = game.musicTransition;
    game.maxMusicPlaying = Math.max(game.maxMusicPlaying, allTracks.filter((track) => !track.paused).length);
    if (transition) {
      transition.elapsed += dt;
      const t = clamp(transition.elapsed / transition.duration, 0, 1);
      transition.from.volume = base * transition.fromGain * Math.cos(t * Math.PI * 0.5);
      transition.to.volume = base * Math.sin(t * Math.PI * 0.5);
      if (t >= 1) {
        transition.from.pause();
        transition.from.volume = 0;
        transition.to.volume = base;
        game.musicTransition = null;
      }
    } else if (game.activeMusic && tracks[game.activeMusic]) {
      tracks[game.activeMusic].volume = base;
    }
  }

  function stopMusic() {
    allTracks.forEach((track) => { track.pause(); track.currentTime = 0; track.volume = 0; track.playbackRate = 1; });
    game.activeMusic = null;
    game.musicTransition = null;
  }

  function showMessage(text, duration = 2) {
    game.message = text;
    game.messageTimer = duration;
  }

  function startGame() {
    ui.startOverlay.classList.add('hidden');
    ui.startOverlay.classList.remove('visible');
    ui.winOverlay.classList.add('hidden');
    game.state = 'playing';
    game.startTime = performance.now();
    if (previewStart > 0) {
      player.x = clamp(previewStart, 0, WORLD_WIDTH - player.w);
      player.y = 330;
      game.cameraX = clamp(player.x - canvas.width * 0.42, 0, WORLD_WIDTH - canvas.width);
    }
    if (previewAutoRun) keys.right = true;
    unlockAudio();
    playAudio('ui.start');
    setMusic(currentSection().music, true);
    showMessage('COCONUT CAMPGROUNDS — OLIVIA PACKED 47 “ESSENTIAL” TACOS!', 2.8);
    if (previewRespawn) {
      if (previewRespawnCheckpoint >= 0 && world.checkpoints[previewRespawnCheckpoint]) {
        game.latestCheckpoint = world.checkpoints[previewRespawnCheckpoint];
      }
      beginRespawn();
    }
  }

  function queueJump() {
    if (keys.jump) return;
    player.jumpBuffer = heroPhysics.jumpBufferTime;
    keys.jump = true;
  }

  function setupInputs() {
    const releaseInputs = () => {
      keys.left = false; keys.right = false; keys.jump = false; player.jumpBuffer = 0;
    };
    window.addEventListener('blur', releaseInputs);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseInputs();
      lastFrame = 0;
    });
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && game.settingsOpen) closeSettings();
      if (game.settingsOpen) return;
      if (['ArrowLeft', 'KeyA'].includes(event.code)) keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(event.code)) keys.right = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(event.code) && !event.repeat) queueJump();
      if (event.code === 'Enter' && game.state === 'title') startGame();
    });
    window.addEventListener('keyup', (event) => {
      if (['ArrowLeft', 'KeyA'].includes(event.code)) keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(event.code)) keys.right = false;
      if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) keys.jump = false;
    });
    document.querySelectorAll('.touch-btn').forEach((button) => {
      const kind = button.dataset.input;
      const press = (event) => {
        event.preventDefault();
        unlockAudio();
        if (game.state === 'title') startGame();
        if (kind === 'left') keys.left = true;
        if (kind === 'right') keys.right = true;
        if (kind === 'jump') queueJump();
      };
      const release = (event) => {
        event.preventDefault();
        if (kind === 'left') keys.left = false;
        if (kind === 'right') keys.right = false;
        if (kind === 'jump') keys.jump = false;
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    });
    window.JFT_LEVEL_START.bind(startGame);
    ui.restartBtn.addEventListener('click', () => { playAudio('ui.confirm'); resetGame(); startGame(); });
    ui.playAgainBtn.addEventListener('click', () => { playAudio('ui.confirm'); resetGame(); startGame(); });
    ui.muteBtn.addEventListener('click', () => {
      game.muted = !game.muted;
      if (game.muted) stopMusic(); else { unlockAudio(); setMusic(currentSection().music, true); }
      syncSettings(); saveProgress();
    });
    ui.settingsBtn.addEventListener('click', openSettings);
    ui.closeSettingsBtn.addEventListener('click', closeSettings);
    ui.musicVolume.addEventListener('input', () => {
      game.musicVolume = Number(ui.musicVolume.value) / 100;
      ui.musicVolumeValue.textContent = `${ui.musicVolume.value}%`;
      audio?.setMusicVolume(game.musicVolume);
      updateMusic(0); saveProgress();
    });
    ui.effectsVolume.addEventListener('input', () => {
      game.effectsVolume = Number(ui.effectsVolume.value) / 100;
      ui.effectsVolumeValue.textContent = `${ui.effectsVolume.value}%`;
      audio?.setEffectsVolume(game.effectsVolume);
      saveProgress();
    });
    ui.reducedShake.addEventListener('change', () => { game.reducedShake = ui.reducedShake.checked; saveProgress(); });
  }

  function openSettings() {
    game.settingsOpen = true;
    ui.settingsOverlay.classList.remove('hidden');
    ui.settingsOverlay.classList.add('visible');
  }

  function closeSettings() {
    game.settingsOpen = false;
    ui.settingsOverlay.classList.add('hidden');
    ui.settingsOverlay.classList.remove('visible');
  }

  function updateMovingPlatforms(dt) {
    for (const platform of world.platforms) {
      platform.dx = 0; platform.dy = 0;
      if (!platform.moving) continue;
      const oldX = platform.x;
      const oldY = platform.y;
      const wave = Math.sin(game.levelTime * platform.speed + platform.phase);
      if (platform.axis === 'x') platform.x = platform.baseX + wave * platform.range;
      if (platform.axis === 'y') platform.y = platform.baseY + wave * platform.range;
      if (platform.axis === 'swing') {
        platform.x = platform.baseX + wave * platform.range;
        platform.y = platform.baseY + Math.cos(game.levelTime * platform.speed + platform.phase) * platform.range * 0.34;
      }
      if (platform.axis === 'tide') platform.y = platform.baseY + wave * platform.range + Math.sin(game.levelTime * 0.62) * 10;
      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;
    }
    for (const item of world.collectibles) {
      if (!item.collected && item.ridePlatform) {
        item.x = item.ridePlatform.x + item.rideOffsetX;
        item.y = item.ridePlatform.y + item.rideOffsetY;
      }
    }
  }

  function resolvePlatforms(previousY) {
    player.grounded = false;
    player.platform = null;
    const previousBottom = previousY + player.h;
    const currentBottom = player.y + player.h;
    for (const platform of world.platforms) {
      if (player.x + player.w <= platform.x || player.x >= platform.x + platform.w) continue;
      if (player.vy >= 0 && previousBottom <= platform.y + 11 && currentBottom >= platform.y && player.y < platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
        player.platform = platform;
        break;
      }
    }
  }

  function findRespawn(x) {
    if (game.latestCheckpoint && x > game.latestCheckpoint.x - 180) {
      const targetY = GROUND_Y - player.h;
      return { targetX: game.latestCheckpoint.x + 56, targetY, airY: Math.max(24, targetY - 250) };
    }
    let best = null;
    let distance = Infinity;
    for (const platform of world.platforms) {
      if (!platform.ground) continue;
      const landX = clamp(x - 80, platform.x + 25, platform.x + platform.w - player.w - 25);
      const score = Math.abs(landX - x) + (landX > x ? 140 : 0);
      if (score < distance) { const targetY = platform.y - player.h; distance = score; best = { targetX: landX, targetY, airY: Math.max(24, targetY - 250) }; }
    }
    return best || { targetX: 140, targetY: 380, airY: 130 };
  }

  function beginRespawn() {
    if (game.state !== 'playing' || game.respawn.active) return;
    const sourceX = player.x; const sourceY = Math.min(player.y, canvas.height - player.h - 8); const point = findRespawn(sourceX);
    game.state = 'respawning';
    sharedAbilities.clearForRespawn(game.abilities);
    keys.left = false; keys.right = false; keys.jump = false;
    heroCore.beginRespawn(game.respawn, { fromX: sourceX, fromY: sourceY, ...point });
    game.respawnCount += 1;
    player.x = sourceX; player.y = sourceY; player.vx = 0; player.vy = 0; player.grounded = false; player.platform = null; player.coyote = 0; player.jumpBuffer = 0; player.invulnerable = 0; player.rotation = 0; player.scale = 1;
    spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#63e7ff', 20);
    playAudio('hero.respawnBeam', { position: audioPosition(player.x + player.w / 2) });
  }

  function updateRespawn(dt) {
    const respawnStep = heroCore.advanceRespawn(game.respawn, player, dt);
    game.cameraX = lerp(game.cameraX, clamp(game.respawn.targetX - canvas.width * .42, 0, WORLD_WIDTH - canvas.width), Math.min(1, dt * 4));
    if (respawnStep.phase === 'vanish') {
      if (game.respawn.sparkTimer >= .08) { game.respawn.sparkTimer = 0; spawnConfetti(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, 4); }
      return;
    }
    if (respawnStep.shouldPlace) { heroCore.placeRespawn(game.respawn, player); spawnBurst(player.x - game.cameraX + player.w / 2, 100, '#ffe17f', 24); }
    if (!game.respawn.spawnPlaced) return;
    const previousY = player.y; player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt); player.y += player.vy * dt; resolvePlatforms(previousY); player.anim += dt * 8;
    if (!player.grounded && game.respawn.timer > 3) {
      player.x = game.respawn.targetX; player.y = game.respawn.targetY; player.vx = 0; player.vy = 0; player.grounded = true;
      player.platform = world.platforms.find((platform) => player.x + player.w > platform.x + 5 && player.x < platform.x + platform.w - 5 && Math.abs(platform.y - (player.y + player.h)) <= 12) || null;
      game.respawnFallbacks += 1;
    }
    if (player.grounded && game.respawn.timer > .8) {
      game.lastRespawnLanding = { x: Math.round(player.x), y: Math.round(player.y), grounded: true, fallback: game.respawn.timer > 3 };
      playAudio('hero.respawnLand', { position: audioPosition(player.x + player.w / 2) });
      heroCore.finishRespawn(game.respawn, player, 1.6); game.state = 'playing';
      keys.left = false; keys.right = false; keys.jump = false;
    }
  }

  function hurtPlayer(fromX) {
    if (player.invulnerable > 0 || sharedAbilities.isFrenzy(game.abilities) || game.state !== 'playing') return;
    if (game.limeShield) {
      game.limeShield = false;
      game.activePower = null;
      player.invulnerable = 1.1;
      showMessage('LIME SHIELD POP! STILL ZESTY!', 1.5);
      spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#7cff68', 34);
      playAudio('ability.limeBreak', { position: audioPosition(player.x + player.w / 2) });
      return;
    }
    const knockbackX = fromX < player.x ? 270 : -270;
    if (sharedAbilities.absorbDamage(game.abilities, { position: audioPosition(player.x + player.w / 2) })) {
      player.invulnerable = sharedAbilities.definitions.superHero.damageInvulnerabilityDuration;
      player.vx = knockbackX; player.vy = -270;
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 5 : 10);
      showMessage('SUPER POWER DOWN! NORMAL TACO HERO!', 1.45);
      spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#ff68b4', 42);
      return;
    }
    game.hearts -= 1;
    player.invulnerable = 1.3;
    player.vx = knockbackX;
    player.vy = -270;
    game.cameraShake = 10;
    playAudio('hero.hurt', { position: audioPosition(player.x + player.w / 2) });
    if (game.hearts <= 0) {
      game.hearts = 3;
      game.score = Math.max(0, game.score - 100);
      beginRespawn();
    }
  }

  function activatePower(type) {
    game.activePower = type;
    game.limeShield = false; game.pepperTimer = 0; game.coconutLaunchTimer = 0; sharedAbilities.removeMagnet(game.abilities);
    if (type === 'lime') { game.limeShield = true; showMessage('LIME SHIELD! ONE HIT GETS ZESTED!', 2); }
    if (type === 'pepper') { game.pepperTimer = 8; showMessage('PEPPER DASH! SPICY SPEED ONLINE!', 2); }
    if (type === 'shell') { sharedAbilities.activateMagnet(game.abilities, 10); showMessage('GOLDEN SHELL MAGNET! TACO TIDE INCOMING!', 2); }
    if (type === 'coconut') {
      game.coconutLaunchTimer = 1.1;
      player.vy = -820; player.grounded = false; player.platform = null; player.coyote = 0; player.jumpBuffer = 0;
      showMessage('COCONUT LAUNCH! AUTOMATIC SKY BOUNCE!', 1.6);
    }
    spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#fff08a', 60);
    const eventId = {
      lime: 'ability.limeStart', pepper: 'ability.pepperStart',
      shell: 'ability.magnetStart', coconut: 'ability.coconutBounce',
    }[type];
    if (eventId) playAudio(eventId, { position: audioPosition(player.x + player.w / 2) });
  }

  function announceSuper(sourceX = player.x) {
    showMessage('SUPER TACO HERO!', 2.1);
    spawnConfetti(sourceX - game.cameraX + player.w / 2, player.y + player.h / 2, game.reducedShake ? 46 : 104);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 10);
  }

  function collectItem(item) {
    item.collected = true;
    const collectionEventId = item.type === 'taco' ? 'collect.taco'
      : item.type === 'golden' ? 'collect.goldenTaco'
        : item.type === 'rainbow' ? 'collect.rainbowTaco' : 'collect.powerup';
    if (!item.bonusReward) game.collected += 1;
    game.streak += 1;
    game.streakTimer = 2.5;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    const multiplier = 1 + Math.min(4, Math.floor(game.streak / 8));
    const points = { taco: 10, golden: 350, rainbow: 600, lime: 120, pepper: 120, shell: 120, coconut: 120 }[item.type] || 10;
    game.score += points * multiplier;
    if (['taco', 'golden', 'rainbow'].includes(item.type)) {
      const superStarted = sharedAbilities.collectTaco(game.abilities, item.type, { position: audioPosition(item.x + item.w / 2) });
      if (superStarted) announceSuper(item.x);
    }
    if (item.type === 'golden') {
      if (!item.bonusReward) game.goldenCollected += 1;
      showMessage(item.bonusReward ? 'VOLCANO GOLDEN TACO!' : `GOLDEN COCONUT ${game.goldenCollected}/${game.totalGolden}!`, 1.8);
      spawnFirework();
    }
    if (item.type === 'rainbow') {
      if (!item.bonusReward) game.rainbowCollected += 1;
      showMessage(item.bonusReward ? 'VOLCANO RAINBOW TACO!' : `RAINBOW SHELL ${game.rainbowCollected}/${game.totalRainbow}!`, 1.8);
      spawnFirework(); spawnFirework();
    }
    if (['lime', 'pepper', 'shell', 'coconut'].includes(item.type)) activatePower(item.type);
    if (item.boatDrop) {
      game.boat.catches += 1;
      game.score += 40;
      if (game.boat.catches % 6 === 0) showMessage(`TACO TREKKER CATCH ×${game.boat.catches}!`, 1);
    }
    spawnBurst(item.x - game.cameraX + item.w / 2, item.y + item.h / 2, item.type === 'rainbow' ? '#c69cff' : '#ffe17f', item.type === 'taco' ? 10 : 40);
    playAudio(collectionEventId, {
      streak: game.streak,
      position: audioPosition(item.x + item.w / 2),
      premiumType: item.type === 'golden' ? 'goldenCoconut' : item.type === 'rainbow' ? 'rainbowShell' : undefined,
    });
  }

  function defeatEnemy(enemy, stomped = true) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.defeated = true;
    if (stomped) {
      game.splatCombo = game.splatTimer > 0 ? game.splatCombo + 1 : 1;
      game.splatTimer = 2.1;
      game.bestSplat = Math.max(game.bestSplat, game.splatCombo);
    }
    game.score += 180 * Math.max(1, game.splatCombo);
    const superStarted = sharedAbilities.splatEnemy(game.abilities, { position: audioPosition(enemy.x + enemy.w / 2) });
    if (superStarted) announceSuper(enemy.x);
    if (stomped) player.vy = -heroPhysics.enemyBounceVelocity;
    game.hitStop = 0.045;
    game.cameraShake = Math.max(game.cameraShake, 7 + game.splatCombo);
    playAudio(stomped ? 'combat.enemyStomp' : 'combat.enemySplat', {
      enemyType: enemy.type,
      combo: Math.max(1, game.splatCombo),
      position: audioPosition(enemy.x + enemy.w / 2),
    });
    const enemyBurst = {
      marshmallow: '#fff0c9', pineapple: '#ffd65a', queso: '#ffbe32',
      pepper: '#ff5c5c', crab: '#ff7b4f', nacho: '#ff8b42', ash: '#dce7ee',
    }[enemy.type] || '#ff8a75';
    spawnBurst(enemy.x - game.cameraX + enemy.w / 2, enemy.y + enemy.h / 2, enemyBurst, 28);
    const feedback = heroCore.splatFeedback(Math.max(1, game.splatCombo), stomped);
    impactText(enemy.x + enemy.w / 2, enemy.y - 8, feedback.text, feedback.color, feedback.size);
    if (stomped) {
      heroCore.celebrateSplatCombo(game.splatCombo, {
        reduced: game.reducedShake,
        onCelebrate: (reward) => {
          const screenX = enemy.x - game.cameraX + enemy.w / 2;
          spawnConfetti(screenX, enemy.y + enemy.h / 2, reward.confetti);
          reward.burstColors.forEach((color, index) => spawnBurst(screenX, enemy.y + 10 - index * 5, color, reward.tier === 'supremacy' ? 40 : 20));
          showMessage(reward.label, reward.duration);
          game.hitStop = Math.max(game.hitStop, reward.hitStop);
          game.cameraShake = Math.max(game.cameraShake, reward.shake);
          playAudio('combat.comboMilestone', {
            combo: game.splatCombo,
            gain: reward.tier === 'supremacy' ? 1.08 : 1,
          });
        },
      });
    }
  }

  function trekkerRearLauncherOrigin(boat, groundY = GROUND_Y) {
    return {
      x: boat.x + calderaTrekkerRearLauncher.xOffset,
      y: groundY + calderaTrekkerRearLauncher.yOffset,
    };
  }

  function spawnBoatTaco() {
    const origin = trekkerRearLauncherOrigin(game.boat);
    addItem(origin.x, origin.y, 'taco', {
      bonusReward: true, dynamic: true, boatDrop: true,
      vx: -150 - seeded() * 90, vy: -270 - seeded() * 140, angle: 0,
    });
    game.boat.dropPulse = calderaTrekkerRearLauncher.pulseDuration;
    playAudio('vehicle.tacoDrop', {
      vehicleType: 'trekker',
      position: audioPosition(game.boat.x),
    });
  }

  function updateBoat(dt) {
    const boat = game.boat;
    boat.dropPulse = Math.max(0, boat.dropPulse - dt);
    const geyserDrop = player.x > 7000 && player.x < 11900;
    const lavaChase = player.x > 19400 && player.x < 27400;

    if (geyserDrop && boat.state === 'basecamp') {
      boat.state = 'entering-geyser';
      boat.pass = 1;
      boat.x = game.cameraX - 420;
      boat.speed = 460;
      showMessage('OLIVIA’S TACO TREKKER: PICNIC DROP INCOMING!', 2.3);
      playAudio('vehicle.approach', { vehicleType: 'trekker', position: -0.8 });
      startVehicleLoop(-0.8);
    }

    if (boat.state === 'entering-geyser') {
      const target = player.x + 275;
      boat.speed = Math.min(980, boat.speed + 760 * dt);
      boat.x = Math.min(target, boat.x + boat.speed * dt);
      if (boat.x >= target - 2) {
        boat.state = 'geyser-drop';
        boat.dropTimer = 0.08;
        showMessage('GEYSER PICNIC DROP! CATCH THE AIRBORNE CRUNCH!', 2.1);
      }
    } else if (boat.state === 'geyser-drop') {
      boat.x = lerp(boat.x, Math.min(12140, player.x + 280 + Math.sin(game.levelTime * 3.1) * 32), Math.min(1, dt * 4.2));
      boat.dropTimer -= dt;
      if (boat.dropTimer <= 0) {
        boat.dropTimer = 0.25 + seeded() * 0.09;
        spawnBoatTaco();
        if (seeded() > 0.7) spawnBoatTaco();
      }
      if (!geyserDrop || player.x >= 11800) {
        boat.state = 'escaping-geyser';
        boat.speed = 720;
        stopVehicleLoop();
        showMessage('OLIVIA: SAVING THE REST FOR A COMPLETELY SAFE CAMPFIRE!', 2.1);
        playAudio('vehicle.depart', { vehicleType: 'trekker', position: audioPosition(boat.x) });
      }
    } else if (boat.state === 'escaping-geyser') {
      boat.speed = Math.min(1650, boat.speed + 1450 * dt);
      boat.x += boat.speed * dt;
      if (boat.x - game.cameraX > canvas.width + 430) boat.state = 'ready-lava';
    }

    if (lavaChase && ['basecamp', 'ready-lava'].includes(boat.state) && game.eruption.state !== 'dormant') {
      boat.state = 'entering-lava';
      boat.pass = 2;
      boat.x = game.cameraX - 450;
      boat.speed = 520;
      showMessage('LAVA SAFARI MODE! OLIVIA HAS ABSOLUTELY READ THE MANUAL!', 2.6);
      playAudio('vehicle.approach', { vehicleType: 'trekker', position: -0.8 });
      playAudio('vehicle.accelerate', { vehicleType: 'trekker', position: -0.65 });
      startVehicleLoop(-0.8);
    }
    if (boat.state === 'entering-lava') {
      const target = player.x + 250;
      boat.speed = Math.min(1160, boat.speed + 920 * dt);
      boat.x = Math.min(target, boat.x + boat.speed * dt);
      if (boat.x >= target - 2) {
        boat.state = 'lava-chase';
        boat.dropTimer = .12;
      }
    } else if (boat.state === 'lava-chase') {
      boat.x = lerp(boat.x, Math.min(27600, player.x + 260 + Math.sin(game.levelTime * 4.1) * 24), Math.min(1, dt * 5));
      boat.dropTimer -= dt;
      if (boat.dropTimer <= 0) {
        boat.dropTimer = .38 + seeded() * .12;
        spawnBoatTaco();
      }
      if (!lavaChase || player.x >= 27100) {
        boat.state = 'fiesta-bound';
        boat.speed = 820;
        showMessage('OLIVIA: CAMPSITE RULE #1 — OUTRUN THE CAMPSITE!', 2.4);
        stopVehicleLoop();
        playAudio('vehicle.depart', { vehicleType: 'trekker', position: audioPosition(boat.x) });
      }
    } else if (boat.state === 'fiesta-bound') {
      boat.speed = Math.min(1800, boat.speed + 1600 * dt);
      boat.x += boat.speed * dt;
      if (boat.x - game.cameraX > canvas.width + 450) boat.state = 'waiting-fiesta';
    }
    if (player.x >= 32900 && boat.state === 'waiting-fiesta') {
      boat.state = 'parked';
      boat.x = world.goal.x - 160;
    }
  }

  function updateCalderaEvent(dt) {
    const eruption = game.eruption;
    eruption.flash = Math.max(0, eruption.flash - dt);
    eruption.rainbowBurst = Math.max(0, eruption.rainbowBurst - dt);

    if (eruption.state === 'dormant' && player.x > 18450) {
      eruption.state = 'warming';
      eruption.timer = 0;
      showMessage('OLIVIA RADIO: REHEATING ONE TACO. WHAT COULD GO WRONG?', 3);
      playAudio('volcano.warmup');
    }
    if (eruption.state === 'warming') {
      eruption.timer += dt;
      eruption.tremor = Math.min(7, eruption.timer * 2.8);
      game.cameraShake = Math.max(game.cameraShake, eruption.tremor);
      if (eruption.timer > 2.35 || player.x > 19120) {
        eruption.state = 'kaboom';
        eruption.timer = 0;
        eruption.flash = .45;
        eruption.rainbowBurst = 3.6;
        eruption.tremor = 18;
        game.wave.done = true;
        game.hitStop = game.reducedShake ? .06 : .14;
        game.cameraShake = game.reducedShake ? 7 : 22;
        showMessage('KABOOM! THE VOLCANO ORDERED EXTRA RAINBOW!', 3.4);
        spawnConfetti(canvas.width * .52, 145, game.reducedShake ? 90 : 260);
        for (let index = 0; index < (game.reducedShake ? 5 : 13); index += 1) spawnFirework();
        for (let index = 0; index < 24; index += 1) {
          const type = index < 18 ? 'taco' : index < 21 ? 'golden' : 'rainbow';
          addItem(player.x + 230 + (index % 8) * 48, 250 - Math.floor(index / 8) * 34, type, {
            bonusReward: true,
            dynamic: true,
            vx: -95 + (index % 8) * 28,
            vy: -330 - Math.floor(index / 8) * 48,
            angle: index * .4,
          });
        }
        playAudio('volcano.erupt');
      }
    } else if (eruption.state === 'kaboom') {
      eruption.timer += dt;
      eruption.tremor = Math.max(8, 18 - eruption.timer * 3);
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : eruption.tremor);
      if (eruption.timer > 3.8) {
        eruption.state = 'active';
        eruption.timer = 0;
        eruption.tremor = 3;
        startVolcanoLoop();
      }
    } else if (eruption.state === 'active') {
      eruption.timer += dt;
      eruption.tremor = 2 + Math.sin(game.levelTime * 5.2) * 1.5;
    }
  }

  function updateGeysers(dt) {
    game.geyserLaunchTimer = Math.max(0, game.geyserLaunchTimer - dt);
    for (const geyser of world.geysers) {
      geyser.cooldown = Math.max(0, (geyser.cooldown || 0) - dt);
      const phase = (game.levelTime + geyser.phase) % geyser.cycle;
      const wasActive = Boolean(geyser.active);
      geyser.active = phase > geyser.cycle * .56 && phase < geyser.cycle * .9;
      if (geyser.active && !wasActive) {
        playAudio('hazard.geyserWarn', { position: audioPosition(geyser.x) });
      }
      if (!geyser.active || geyser.cooldown > 0) continue;
      const overVent = player.x + player.w > geyser.x - 34 && player.x < geyser.x + 34;
      const closeToGround = player.y + player.h > GROUND_Y - 72;
      if (!overVent || !closeToGround || player.vy < -120) continue;
      geyser.cooldown = 1.1;
      player.vy = -790;
      player.grounded = false;
      player.coyote = 0;
      game.geyserLaunchTimer = 1.15;
      showMessage('GEYSER EXPRESS! FIRST CLASS: SLIGHTLY DAMP!', 1.25);
      spawnBurst(geyser.x - game.cameraX, GROUND_Y - 20, '#65e7ff', 36);
      playAudio('hazard.geyserLaunch', { position: audioPosition(geyser.x) });
    }
  }

  function updateWaveChase(dt) {
    const wave = game.wave;
    const surf = game.surf;

    if (surf.phase === 'idle' && player.x > 24820) {
      // Preview/test teleports enter the playable chase directly; an ordinary
      // run always receives Olivia's complete surf-by introduction.
      if (player.x >= surf.mountX + 220) {
        surf.phase = 'riding';
        surf.boardMounted = true;
        wave.active = true;
        wave.x = player.x - 330;
        wave.speed = 318;
      } else {
        surf.phase = 'olivia-intro';
        surf.oliviaX = player.x - 280;
        surf.oliviaY = 345;
        surf.oliviaTimer = 0;
        showMessage('OLIVIA: CATCH THE BIG ONE, TACO HERO!', 2.6);
        playAudio('surf.oliviaPass', { position: -0.65 });
      }
    }

    if (surf.phase === 'olivia-intro') {
      surf.oliviaTimer += dt;
      surf.oliviaX += (920 + surf.oliviaTimer * 80) * dt;
      surf.oliviaY = 342 + Math.sin(surf.oliviaTimer * 5.2) * 6;
      if (surf.oliviaX > player.x + 820 || surf.oliviaTimer > 2.8) {
        surf.phase = 'ready';
        showMessage('YOUR BOARD IS READY — JUMP ON AND SURF!', 2.5);
        spawnBurst(surf.mountX - game.cameraX, GROUND_Y - 12, '#63e7ff', 36);
      }
    }

    const jumpedOntoBoard = player.x >= surf.mountX - 64 && player.y + player.h < GROUND_Y - 4;
    const forgivingAutoMount = player.x >= surf.mountX + 130;
    if (surf.phase === 'ready' && (jumpedOntoBoard || forgivingAutoMount)) {
      surf.phase = 'riding';
      surf.boardMounted = true;
      player.x = Math.max(player.x, surf.mountX);
      player.vx = Math.max(player.vx, 338);
      wave.active = true;
      wave.x = player.x - 330;
      wave.speed = 318;
      showMessage('BIG WAVE SURF! JUMP THE OBSTACLES!', 2.5);
      spawnConfetti(canvas.width * 0.4, 250, game.reducedShake ? 24 : 66);
      playAudio('surf.mount', { position: audioPosition(surf.mountX) });
    }

    if (wave.crashing) {
      wave.crashTimer = Math.max(0, wave.crashTimer - dt);
      if (wave.crashTimer <= 0) wave.crashing = false;
    }
    if (surf.phase === 'landing' && player.x > 33380 && player.grounded) {
      surf.phase = 'complete';
      surf.boardMounted = false;
      player.vx = Math.max(player.vx, 280);
      showMessage(`PERFECT BEACH LANDING! ${surf.clearedObstacles}/5 SURF CLEARS!`, 2.4);
      spawnBurst(player.x - game.cameraX, GROUND_Y - 8, '#ffe17f', 72);
      playAudio('surf.land', { position: audioPosition(player.x + player.w / 2) });
    }
    if (!wave.active) return;

    player.vx = Math.max(player.vx, 342);
    player.dir = 1;

    // Match the breaker to the board instead of giving it a lower fixed speed.
    // The soft catch-up keeps the curl continuously beneath/behind Taco Hero
    // without snapping forward when the player accelerates after a jump.
    const ridingGap = 250;
    const desiredWaveX = player.x - ridingGap;
    const matchingSpeed = clamp(player.vx - 2, 356, 450);
    wave.speed = lerp(wave.speed, matchingSpeed, Math.min(1, dt * 3.8));
    wave.x += wave.speed * dt;
    if (wave.x < desiredWaveX) {
      wave.x = lerp(wave.x, desiredWaveX, 1 - Math.exp(-dt * 7.5));
    }
    if (player.x - wave.x < 178) {
      if (game.limeShield) {
        hurtPlayer(wave.x);
        wave.x = player.x - 250;
      }
      else {
        game.hearts = Math.max(1, game.hearts - 1);
        player.vx = 390;
        player.vy = -330;
        player.invulnerable = 1.4;
        wave.x = player.x - 250;
        showMessage('WAVE BOOP! BOARD STILL TACO-UGH!', 1.4);
        game.cameraShake = 12;
        playAudio('surf.waveHit', { position: audioPosition(player.x + player.w / 2) });
        playAudio('hero.hurt', { position: audioPosition(player.x + player.w / 2) });
      }
    }

    for (const obstacle of world.surfObstacles) {
      if (obstacle.hit) continue;
      if (player.x > obstacle.x + obstacle.w) {
        obstacle.hit = true;
        surf.clearedObstacles += 1;
        game.score += 250;
        impactText(obstacle.x + obstacle.w / 2, obstacle.y - 18, 'SURF CLEAR! +250', '#ffe17f', 21);
        playAudio('surf.obstacleClear', { position: audioPosition(obstacle.x + obstacle.w / 2) });
        continue;
      }
      if (player.x + player.w < obstacle.x || !intersects(player, obstacle)) continue;
      obstacle.hit = true;
      game.hearts = Math.max(1, game.hearts - 1);
      player.vx = 390;
      player.vy = -330;
      player.invulnerable = 1.3;
      showMessage('BOARD BONK! KEEP THE WAVE!', 1.2);
      spawnBurst(obstacle.x - game.cameraX + obstacle.w / 2, obstacle.y, '#ff718f', 30);
      playAudio('surf.obstacleHit', { position: audioPosition(obstacle.x + obstacle.w / 2) });
      playAudio('hero.hurt', { position: audioPosition(player.x + player.w / 2) });
    }

    if (player.x > 33120 && !surf.landingLaunched) {
      surf.landingLaunched = true;
      surf.phase = 'landing';
      player.vx = 430;
      player.vy = -520;
      player.grounded = false;
      player.coyote = 0;
      wave.active = false;
      wave.done = true;
      wave.crashing = true;
      wave.crashTimer = 2.6;
      // Begin the crash from the wave's riding position so the breaker visibly
      // carries Taco Hero to the beach rather than teleporting into the finale.
      wave.x = player.x - 220;
      game.score += 1800 + surf.clearedObstacles * 250;
      showMessage('BEACH LAUNCH! THE BIG ONE CRASHES BEHIND YOU!', 2.6);
      spawnConfetti(canvas.width * 0.34, 210, game.reducedShake ? 55 : 150);
      game.cameraShake = 15;
      playAudio('surf.waveCrashLaunch', { position: audioPosition(player.x + player.w / 2) });
    }
  }

  function updateCoconutCannons(dt) {
    const activeCannon = world.cannons
      .filter((cannon) => Math.abs(player.x - cannon.x) <= 760)
      .sort((a, b) => Math.abs(player.x - a.x) - Math.abs(player.x - b.x))[0];
    for (const cannon of world.cannons) {
      if (cannon !== activeCannon) {
        cannon.timer = Math.max(cannon.timer, .25);
        continue;
      }
      cannon.timer -= dt;
      if (cannon.timer <= 0 && game.cannonballs.length === 0) {
        cannon.timer = 2.25 + seeded() * 0.55;
        const direction = player.x < cannon.x ? -1 : 1;
        game.cannonballs.push({
          x: cannon.x + direction * 24, y: cannon.y - 12, w: 30, h: 30,
          vx: direction * (180 + seeded() * 70), vy: -410 - seeded() * 100,
          rotation: 0, life: 4, sourceCannon: cannon.id,
        });
        playAudio('hazard.coconutCannonFire', { position: audioPosition(cannon.x) });
        spawnBurst(cannon.x - game.cameraX, cannon.y - 5, '#fff08a', 14);
      }
    }
    game.cannonballs = game.cannonballs.filter((ball) => {
      ball.life -= dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vy += 760 * dt;
      ball.rotation += dt * 5.5;
      if (intersects(player, ball)) {
        if (game.pepperTimer > 0) {
          game.score += 180;
          spawnBurst(ball.x - game.cameraX, ball.y, '#ff674d', 24);
          playAudio('hazard.coconutDeflect', { position: audioPosition(ball.x) });
          return false;
        }
        hurtPlayer(ball.x);
        return false;
      }
      return ball.life > 0 && ball.y < 540;
    });
  }

  function updateEnemies(dt) {
    let stompResolvedThisFrame = false;
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const previousEnemyTop = enemy.y;
      enemy.clock += dt;
      let speedScale = heroCore.updateEnemyBehavior(enemy, dt, { jumpScale: enemy.comboHelper ? .62 : 1 });
      if (enemy.type === 'coconut') speedScale *= 1.2;
      if (enemy.type === 'puffer') {
        enemy.w = 40 + (Math.sin(enemy.clock * 2.5) + 1) * 5;
        enemy.h = 38 + (Math.sin(enemy.clock * 2.5) + 1) * 4;
      }
      if (enemy.type === 'tiki') speedScale *= .82;
      enemy.x += enemy.dir * enemy.baseSpeed * speedScale * dt;
      if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
        enemy.dir *= -1;
        enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX);
      }
      if (enemy.requiresGeyserAirborne && !(game.geyserLaunchTimer > 0 && player.vy < -180)) continue;
      const contact = heroCore.classifyEnemyContact(player, enemy, {
        routeHelper: enemy.comboHelper,
        previousBottom: player.previousBottom,
        previousTargetTop: previousEnemyTop,
      });
      if (!contact || stompResolvedThisFrame) continue;
      if (contact === 'stomp') { stompResolvedThisFrame = true; defeatEnemy(enemy, true); }
      else if (game.pepperTimer > 0 || sharedAbilities.isFrenzy(game.abilities)) defeatEnemy(enemy, false);
      else hurtPlayer(enemy.x);
    }
  }

  function updateCheckpoints() {
    for (const checkpoint of world.checkpoints) {
      if (checkpoint.activated || Math.abs(player.x - checkpoint.x) > 92) continue;
      checkpoint.activated = true;
      game.latestCheckpoint = checkpoint;
      game.score += 500;
      game.hearts = 3;
      showMessage(`${checkpoint.name.toUpperCase()} — ${checkpoint.sign}`, 2.4);
      spawnConfetti(checkpoint.x - game.cameraX + 90, 250, 80);
      playAudio('checkpoint.activate', { position: audioPosition(checkpoint.x + checkpoint.w / 2) });
    }
  }

  function updateDynamicItems(dt) {
    for (const item of world.collectibles) {
      if (!item.dynamic || item.collected) continue;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vy += 720 * dt;
      item.angle += dt * 6;
      if (item.y > 520) item.collected = true;
    }
  }

  function updatePlayer(dt) {
    const scriptedSurf = game.surf.phase === 'riding' || game.surf.phase === 'landing';
    if (sharedAbilities.suspendForTransformation(game.abilities, player, { disabled: scriptedSurf })) return;
    const wasGrounded = player.grounded;
    if (player.grounded) sharedAbilities.land(game.abilities);
    if (player.grounded && player.platform) {
      player.x += player.platform.dx || 0;
      player.y += player.platform.dy || 0;
    }
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? heroPhysics.coyoteTime : Math.max(0, player.coyote - dt);

    const surfing = false;
    const surfLanding = false;
    const calderaChase = game.eruption.state !== 'dormant' && player.x >= 19400 && player.x < 27400;
    const acceleration = player.grounded ? 1250 : 780;
    const maxSpeed = calderaChase ? 330 : game.pepperTimer > 0 ? 385 : 255;
    if (keys.left && !surfing && !surfLanding) { player.vx -= acceleration * dt; player.dir = -1; }
    if (keys.right) { player.vx += acceleration * dt; player.dir = 1; }
    if (!keys.left && !keys.right && !surfing && !surfLanding) player.vx *= player.grounded ? 0.79 : 0.94;
    if (calderaChase && keys.right) player.vx = Math.max(player.vx, 285);
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

    if (previewAutoJump && player.grounded) {
      const lookAhead = player.x + player.w + 82;
      const supportedAhead = world.platforms.some((platform) => (
        platform.y >= player.y + player.h - 24
        && platform.y <= player.y + player.h + 96
        && lookAhead >= platform.x
        && lookAhead <= platform.x + platform.w
      ));
      if (!supportedAhead) queueJump();
    }

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -heroPhysics.jumpVelocity;
      player.grounded = false; player.coyote = 0; player.jumpBuffer = 0;
      playAudio('hero.jump', { position: audioPosition(player.x + player.w / 2) });
    } else if (player.jumpBuffer > 0 && !player.grounded) {
      const superJumpVelocity = sharedAbilities.trySuperJump(game.abilities, { suspended: scriptedSurf, position: audioPosition(player.x + player.w / 2) });
      if (superJumpVelocity) { player.vy = -superJumpVelocity; player.platform = null; player.jumpBuffer = 0; game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : 5); }
      else if (scriptedSurf) player.jumpBuffer = 0;
    }

    const previousY = player.y;
    player.previousY = previousY;
    player.previousBottom = previousY + player.h;
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const landingVelocity = player.vy;
    player.x = clamp(player.x, 0, WORLD_WIDTH - player.w);
    resolvePlatforms(previousY);
    if (player.grounded) sharedAbilities.land(game.abilities);
    if (!wasGrounded && player.grounded && landingVelocity > 90) {
      playAudio(landingVelocity >= 830 ? 'hero.landHard' : 'hero.landSoft', {
        position: audioPosition(player.x + player.w / 2),
      });
    }
    player.anim += dt * (Math.abs(player.vx) > 20 ? 11 : 4);

    if (player.y > canvas.height + 70) {
      playAudio('hero.fall', { position: audioPosition(player.x + player.w / 2) });
      game.hearts -= 1;
      if (game.hearts <= 0) game.hearts = 3;
      beginRespawn();
    }
  }

  function maybeFinish() {
    if (game.state !== 'playing' || !intersects(player, world.goal)) return;
    game.state = 'celebrating';
    game.finishTime = performance.now();
    game.celebrationTime = 0;
    player.vx = 0; player.vy = 0;
    setMusic('luau');
    const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
    const bonus = Math.round(2500 + completion * 3000 + game.goldenCollected * 600 + game.boat.catches * 35 + (game.wave.done ? 1800 : 0));
    game.score += bonus;
    showMessage('RAINBOW LAVA LUAU — MAXIMUM CAMPFIRE CRUNCH!', 4);
    spawnConfetti(canvas.width / 2, 150, game.reducedShake ? 90 : 240);
    for (let i = 0; i < (game.reducedShake ? 5 : 14); i += 1) spawnFirework();
    playAudio('goal.enter');
  }

  function presentResults() {
    const seconds = (game.finishTime - game.startTime) / 1000;
    const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
    const medal = game.goldenCollected === game.totalGolden && game.wave.done && completion > 0.75 ? 'CALDERA LEGEND'
      : game.wave.done && game.boat.catches >= 18 ? 'LAVA SAFARI STAR'
      : completion > 0.45 ? 'CAMPFIRE CRUISER' : 'TENT TRAINEE';
    const previous = game.personalBest;
    const newBest = previous.runs === 0 || game.score > previous.score || seconds < previous.time;
    game.personalBest = {
      score: Math.max(previous.score || 0, game.score),
      time: previous.time <= 0 || seconds < previous.time ? seconds : previous.time,
      runs: (previous.runs || 0) + 1,
      medal: game.score >= (previous.score || 0) ? medal : previous.medal,
    };
    saveProgress(); updatePersonalBest();
    ui.medalBadge.textContent = medal;
    ui.resultScore.textContent = game.score.toLocaleString();
    ui.resultTime.textContent = formatTime(seconds);
    ui.resultTacos.textContent = `${game.collected}/${game.totalCollectibles}`;
    ui.resultGolden.textContent = `${game.goldenCollected}/${game.totalGolden}`;
    ui.resultBoat.textContent = String(game.boat.catches);
    ui.resultWave.textContent = game.wave.done ? 'Rainbow KABOOM!' : 'Still simmering';
    ui.winText.textContent = `You crossed five volcanic island acts, caught ${game.boat.catches} Taco Trekker drops, found ${game.rainbowCollected}/${game.totalRainbow} Rainbow Tacos, and finished Campfire Caldera Caper in ${formatTime(seconds)}. Olivia rates the campsite five stars; the ground is only a little molten.`;
    ui.newBestText.classList.toggle('hidden', !newBest);
    ui.winOverlay.classList.remove('hidden');
    ui.winOverlay.classList.add('visible');
    requestAnimationFrame(() => ui.winOverlay.querySelector('[data-next-level]')?.focus());
    game.state = 'won';
  }

  function updateCelebration(dt) {
    game.celebrationTime += dt;
    player.anim += dt * 8;
    player.x = lerp(player.x, world.goal.x + 40, Math.min(1, dt * 2));
    game.cameraX = clamp(world.goal.x - canvas.width * 0.53, 0, WORLD_WIDTH - canvas.width);
    const beat = Math.floor(game.celebrationTime * 2.2);
    if (beat !== game.partyBeat) {
      game.partyBeat = beat;
      spawnConfetti(beat % 2 ? 120 : canvas.width - 120, 230, game.reducedShake ? 12 : 34);
      if (!game.reducedShake || beat % 2 === 0) spawnFirework();
      playAudio('level.celebrationPulse', {
        pitchCents: (beat % 4) * 18,
        position: beat % 2 ? -0.35 : 0.35,
      });
    }
    if (game.celebrationTime > (previewFastCelebrate ? 0.7 : 7.4)) {
      playAudio('level.complete');
      presentResults();
    }
  }

  function update(dt) {
    updateMusic(dt);
    if (game.settingsOpen) { updateParticles(dt * 0.15); return; }
    if (game.hitStop > 0) { game.hitStop = Math.max(0, game.hitStop - dt); updateParticles(dt * 0.2); return; }
    game.cameraShake = Math.max(0, game.cameraShake - dt * 40);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    game.streakTimer = Math.max(0, game.streakTimer - dt);
    game.splatTimer = Math.max(0, game.splatTimer - dt);
    if (game.streakTimer <= 0) game.streak = 0;
    if (game.splatTimer <= 0) game.splatCombo = 0;
    const frenzyWasActive = sharedAbilities.isFrenzy(game.abilities);
    const magnetWasActive = sharedAbilities.hasMagnet(game.abilities);
    const pepperWasActive = game.pepperTimer > 0;
    sharedAbilities.update(game.abilities, dt);
    if (game.pepperTimer > 0) { game.pepperTimer = Math.max(0, game.pepperTimer - dt); if (!game.pepperTimer) game.activePower = null; }
    if (game.activePower === 'shell' && !sharedAbilities.hasMagnet(game.abilities)) game.activePower = null;
    if (game.coconutLaunchTimer > 0) { game.coconutLaunchTimer = Math.max(0, game.coconutLaunchTimer - dt); if (!game.coconutLaunchTimer && game.activePower === 'coconut') game.activePower = null; }
    if (frenzyWasActive && !sharedAbilities.isFrenzy(game.abilities)) playAudio('ability.frenzyEnd');
    if (magnetWasActive && !sharedAbilities.hasMagnet(game.abilities)) playAudio('ability.magnetEnd');
    if (pepperWasActive && game.pepperTimer <= 0) playAudio('ability.pepperEnd');
    if (game.state === 'playing' || game.state === 'respawning') {
      game.levelTime += dt;
      game.tideY = 470 + Math.sin(game.levelTime * 0.62) * 20;
      updateMovingPlatforms(dt);
    }
    if (game.state === 'respawning') updateRespawn(dt);
    if (game.state === 'playing') {
      updatePlayer(dt);
      updateDynamicItems(dt);
      updateEnemies(dt);
      updateCheckpoints();
      updateCalderaEvent(dt);
      updateGeysers(dt);
      updateBoat(dt);
      updateCoconutCannons(dt);

      for (const item of world.collectibles) {
        if (item.collected) continue;
        if (sharedAbilities.hasMagnet(game.abilities) && !['lime', 'pepper', 'shell', 'coconut'].includes(item.type)) {
          const dx = player.x + player.w / 2 - (item.x + item.w / 2);
          const dy = player.y + player.h / 2 - (item.y + item.h / 2);
          const distance = Math.hypot(dx, dy);
          if (distance < 290) { item.x += dx * dt * 9; item.y += dy * dt * 9; }
        }
        if (intersects(player, item)) collectItem(item);
      }

      const sectionIndex = sections.findIndex((section) => player.x >= section.start && player.x < section.end);
      if (sectionIndex !== game.sectionIndex) {
        game.sectionIndex = sectionIndex;
        const section = sections[sectionIndex];
        setMusic(section.music);
        showMessage(`${section.name.toUpperCase()} — ${[
          'SET UP CAMP. SECURE THE TACOS!',
          'DO NOT FEED THE GEYSERS!',
          'FOLLOW THE LANTERNS. IGNORE THE SUSPICIOUS GLOW!',
          'KABOOM PROTOCOL: RUN WITH STYLE!',
          'THE LAST 2,000 UNITS ARE ENEMY-FREE FIESTA GLORY!',
        ][sectionIndex]}`, 2.7);
        spawnConfetti(canvas.width * 0.6, 180, 55);
      }

      const chaseActive = game.eruption.state !== 'dormant' && player.x >= 19400 && player.x < 27400;
      const trekkerActive = ['geyser-drop', 'lava-chase'].includes(game.boat.state);
      const followOffset = chaseActive || trekkerActive || game.pepperTimer > 0 ? 0.34 : 0.42;
      const targetCamera = clamp(player.x - canvas.width * followOffset, 0, WORLD_WIDTH - canvas.width);
      game.cameraX = lerp(game.cameraX, targetCamera, Math.min(1, dt * 9));
      maybeFinish();
    }
    if (game.state === 'celebrating') updateCelebration(dt);
    updateParticles(dt);
  }

  // Drawing helpers are defined below to keep gameplay and presentation separate.

  function spawnBurst(x, y, color, amount = 18) {
    for (let i = 0; i < amount; i += 1) {
      game.particles.push({
        x, y, vx: (seeded() - 0.5) * 260, vy: -50 - seeded() * 260,
        gravity: 560, life: 0.55 + seeded() * 0.8, size: 3 + seeded() * 6,
        color, shape: i % 3 === 0 ? 'star' : 'circle', angle: seeded() * Math.PI * 2,
      });
    }
  }

  function spawnConfetti(x, y, amount = 40) {
    const colors = ['#ffe17f', '#55e6a5', '#63e7ff', '#ff718f', '#c69cff', '#fff8dc'];
    for (let i = 0; i < amount; i += 1) {
      game.confetti.push({
        x, y, vx: (seeded() - 0.5) * 420, vy: -100 - seeded() * 430,
        gravity: 720 + seeded() * 260, life: 1 + seeded() * 1.5,
        size: 4 + seeded() * 8, color: colors[i % colors.length], angle: seeded() * Math.PI * 2,
        spin: (seeded() - 0.5) * 12,
      });
    }
  }

  function spawnFirework() {
    const x = 120 + seeded() * 720;
    const y = 80 + seeded() * 180;
    const colors = ['#ffe17f', '#55e6a5', '#63e7ff', '#ff718f', '#c69cff'];
    const color = colors[Math.floor(seeded() * colors.length)];
    for (let i = 0; i < 26; i += 1) {
      const angle = (i / 26) * Math.PI * 2;
      const speed = 80 + seeded() * 190;
      game.fireworks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.7 + seeded() * 0.7, color, size: 2 + seeded() * 3 });
    }
  }

  function impactText(worldX, y, text, color, size = 27) {
    game.impactTexts.push({ x: worldX, y, text, color, size, life: 1.05, vy: -58 });
  }

  function updateParticles(dt) {
    game.particles = game.particles.filter((particle) => {
      particle.life -= dt; particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      particle.angle += dt * 7;
      return particle.life > 0 && particle.y < canvas.height + 80;
    });
    game.confetti = game.confetti.filter((particle) => {
      particle.life -= dt; particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      particle.angle += particle.spin * dt;
      return particle.life > 0 && particle.y < canvas.height + 100;
    });
    game.fireworks = game.fireworks.filter((particle) => {
      particle.life -= dt; particle.vy += 130 * dt;
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      return particle.life > 0;
    });
    game.impactTexts = game.impactTexts.filter((text) => {
      text.life -= dt; text.y += text.vy * dt; text.vy *= 0.93;
      return text.life > 0;
    });
  }

  function visibleWorldX(x, width = 0, padding = 180) {
    const screenX = x - game.cameraX;
    return screenX + width > -padding && screenX < canvas.width + padding;
  }

  function drawStar(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? radius * 0.42 : radius;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }

  function roundedPanel(x, y, width, height, radius, fill, stroke = null, lineWidth = 2) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function drawIslandCloud(x, y, scale = 1, color = 'rgba(255,250,218,.7)') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-35, 4, 22, 0, Math.PI * 2);
    ctx.arc(-10, -8, 31, 0, Math.PI * 2);
    ctx.arc(23, 0, 25, 0, Math.PI * 2);
    ctx.arc(46, 7, 17, 0, Math.PI * 2);
    ctx.roundRect(-55, 1, 116, 27, 13);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.24)';
    ctx.beginPath(); ctx.ellipse(-10, -14, 19, 8, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPalm(x, groundY, scale, color, time, flip = 1) {
    const sway = Math.sin(time * 0.0015 + x * 0.017) * 0.08;
    ctx.save(); ctx.translate(x, groundY); ctx.scale(scale * flip, scale);
    ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(4, -35, -6, -76, sway * 48, -112); ctx.stroke();
    ctx.translate(sway * 48, -112);
    for (let leaf = 0; leaf < 7; leaf += 1) {
      const angle = -2.85 + leaf * 0.86 + sway;
      ctx.save(); ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(28, -11, 58, 2); ctx.quadraticCurveTo(29, 12, 0, 0); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#9a633d';
    for (const [cx, cy] of [[-7, 8], [2, 9], [8, 3]]) { ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function drawDistantTemple(x, y, scale, color, glow = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-62, 0); ctx.lineTo(-48, -62); ctx.lineTo(-24, -62); ctx.lineTo(-18, -96); ctx.lineTo(18, -96); ctx.lineTo(24, -62); ctx.lineTo(48, -62); ctx.lineTo(62, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = glow ? 'rgba(99,231,255,.42)' : 'rgba(8,42,67,.28)';
    ctx.beginPath(); ctx.roundRect(-12, -50, 24, 50, 10); ctx.fill();
    ctx.strokeStyle = glow ? 'rgba(184,255,245,.5)' : 'rgba(219,255,226,.2)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-40, -62); ctx.lineTo(40, -62); ctx.stroke();
    ctx.restore();
  }

  function environmentBlendState(worldX) {
    const halfTransition = ENVIRONMENT_TRANSITION_WIDTH / 2;
    for (let index = 1; index < sections.length; index += 1) {
      const boundary = sections[index].start;
      if (worldX < boundary - halfTransition || worldX > boundary + halfTransition) continue;
      return {
        from: sections[index - 1],
        to: sections[index],
        amount: smoothstep((worldX - (boundary - halfTransition)) / ENVIRONMENT_TRANSITION_WIDTH),
      };
    }
    const section = currentSection(worldX);
    return { from: section, to: section, amount: 0 };
  }

  function sectionProgress(section, worldX) {
    return clamp((worldX - section.start) / Math.max(1, section.end - section.start), 0, 1);
  }

  function drawEnvironmentPlate(image, section, worldX, alpha) {
    if (!image || alpha <= 0) return false;
    const canvasAspect = canvas.width / canvas.height;
    let sourceWidth = image.width * ENVIRONMENT_PANORAMA_CROP;
    let sourceHeight = sourceWidth / canvasAspect;
    if (sourceHeight > image.height * 0.94) {
      sourceHeight = image.height * 0.94;
      sourceWidth = sourceHeight * canvasAspect;
    }
    const progress = sectionProgress(section, worldX);
    const sourceX = (image.width - sourceWidth) * progress;
    const sourceY = (image.height - sourceHeight) * (section.id === 'caves' ? 0.42 : 0.48);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
    return true;
  }

  function drawPaintedEnvironment(time) {
    const blend = environmentBlendState(player.x);
    const fromImage = images[environmentImageKeys[blend.from.id]];
    const toImage = images[environmentImageKeys[blend.to.id]];
    if (!fromImage || !toImage) return false;
    drawEnvironmentPlate(fromImage, blend.from, player.x, blend.from === blend.to ? 1 : 1 - blend.amount);
    if (blend.from !== blend.to) drawEnvironmentPlate(toImage, blend.to, player.x, blend.amount);

    const grade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grade.addColorStop(0, blend.to.id === 'luau' ? 'rgba(29,13,76,.08)' : 'rgba(16,64,96,.02)');
    grade.addColorStop(.62, 'rgba(7,27,46,0)');
    grade.addColorStop(1, blend.to.id === 'eruption' ? 'rgba(47,13,31,.19)' : 'rgba(5,23,39,.14)');
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (blend.to.id === 'geyser') {
      ctx.save();
      ctx.globalAlpha = .08 + Math.sin(time * .0014) * .018;
      for (let shaft = 0; shaft < 4; shaft += 1) {
        const x = 70 + shaft * 275 - (game.cameraX * .022) % 190;
        const light = ctx.createLinearGradient(x, 0, x + 180, 430);
        light.addColorStop(0, 'rgba(255,247,185,.55)');
        light.addColorStop(1, 'rgba(255,247,185,0)');
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + 92, 0); ctx.lineTo(x + 262, 438); ctx.lineTo(x + 132, 438); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    game.backgroundBlend = {
      from: blend.from.id,
      to: blend.to.id,
      amount: Number(blend.amount.toFixed(3)),
      distance: ENVIRONMENT_TRANSITION_WIDTH,
      painted: true,
      noTiling: true,
      subpixelMotion: true,
    };
    game.environmentRemasterReady = true;
    return true;
  }

  function drawPaintedCalderaAtmosphere(section, time) {
    if (section.id === 'geyser') {
      for (let index = 0; index < 13; index += 1) {
        const cycle = (time * (.000045 + index % 3 * .000012) + index * .17) % 1;
        const x = ((index * 181 - game.cameraX * .12) % 1120 + 1120) % 1120 - 80;
        const y = 445 - cycle * 250;
        ctx.globalAlpha = .04 + (1 - cycle) * .11;
        ctx.fillStyle = '#e8fffa';
        ctx.beginPath(); ctx.arc(x, y, 11 + index % 4 * 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (section.id === 'eruption' || (section.id === 'luau' && game.eruption.state !== 'dormant')) {
      for (let index = 0; index < (game.reducedShake ? 18 : 34); index += 1) {
        const cycle = (time * (.000075 + index % 4 * .000018) + index * .113) % 1;
        const x = ((index * 109 - game.cameraX * .075) % 1080 + 1080) % 1080 - 40;
        const y = 450 - cycle * 400;
        ctx.globalAlpha = .12 + (1 - cycle) * .42;
        ctx.fillStyle = index % 6 === 0 ? '#ffd65a' : '#ff704d';
        ctx.beginPath(); ctx.arc(x, y, 1.4 + index % 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (section.id === 'luau') {
      ctx.strokeStyle = 'rgba(255,225,127,.34)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 322); ctx.quadraticCurveTo(240, 288, 480, 322); ctx.quadraticCurveTo(720, 356, 960, 322); ctx.stroke();
      for (let index = 0; index < 17; index += 1) {
        const x = index * 60;
        const y = 322 + Math.sin((x / 960) * Math.PI * 4) * 16;
        ctx.fillStyle = ['#ff718f', '#ffe17f', '#55e6a5', '#63e7ff'][index % 4];
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x, y, 3.4 + Math.sin(time * .008 + index), 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    if (game.eruption.rainbowBurst > 0) {
      const progress = 1 - game.eruption.rainbowBurst / 3.6;
      const colors = ['#ff5c8a', '#ffb24d', '#ffe86a', '#55e6a5', '#65e7ff', '#bb8cff'];
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress) * .54;
      colors.forEach((color, index) => {
        ctx.strokeStyle = color; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(canvas.width * .64, 212, 52 + progress * 420 + index * 11, Math.PI * .9, Math.PI * 2.12); ctx.stroke();
      });
      ctx.restore();
    }

    const chaseActive = game.eruption.state !== 'dormant' && player.x >= 19400 && player.x < 27400;
    if (chaseActive) {
      for (let index = 0; index < 14; index += 1) {
        const travel = (time * (.22 + index * .006) + index * 93) % 1100;
        const y = 72 + index % 8 * 48;
        ctx.strokeStyle = `rgba(255,238,175,${.08 + index % 3 * .05})`;
        ctx.lineWidth = 2 + index % 3;
        ctx.beginPath(); ctx.moveTo(travel - 170, y); ctx.lineTo(travel, y - 4); ctx.stroke();
      }
    }

    if (game.eruption.flash > 0) {
      ctx.globalAlpha = game.eruption.flash * 1.2;
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }

  function drawCalderaBackground(time) {
    const section = currentSection(player.x);
    const paintedEnvironment = drawPaintedEnvironment(time);
    if (paintedEnvironment) {
      drawPaintedCalderaAtmosphere(section, time);
      return;
    }
    const paletteMap = {
      camp: ['#3fbfda', '#79dfcf', '#ffd48b', '#ffe9a8'],
      geyser: ['#2c9fc4', '#5ac9b5', '#d0dda0', '#ffc872'],
      caves: ['#251b55', '#43306f', '#8f477d', '#ff8b5d'],
      eruption: ['#281439', '#6c2848', '#d84c48', '#ff9a4d'],
      luau: ['#09163d', '#25306f', '#733c88', '#ff6f9f'],
    };
    const paletteBlend = blendedPalette(paletteMap, player.x);
    const palettes = paletteBlend.colors;
    game.backgroundBlend = { from: paletteBlend.from, to: paletteBlend.to, amount: Number(paletteBlend.amount.toFixed(3)), distance: 720 };
    const night = section.id === 'caves' || section.id === 'eruption' || section.id === 'luau';
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, palettes[0]);
    sky.addColorStop(.43, palettes[1]);
    sky.addColorStop(.76, palettes[2]);
    sky.addColorStop(1, palettes[3]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (night) {
      for (let index = 0; index < 60; index += 1) {
        const x = ((index * 157 - game.cameraX * .035) % 1080 + 1080) % 1080 - 50;
        const y = 25 + (index * 71) % 270;
        ctx.globalAlpha = .36 + Math.sin(time * .003 + index) * .28;
        drawStar(x, y, 1.6 + index % 3, index % 5 ? '#e8f7ff' : '#ffd65a');
      }
      ctx.globalAlpha = 1;
      const moonX = 820 - game.cameraX * .012;
      ctx.fillStyle = '#fff1bd';
      ctx.shadowColor = '#ff8fc4';
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.arc(moonX, 105, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const sunX = 790 - game.cameraX * .016;
      ctx.fillStyle = '#fff5bd';
      ctx.shadowColor = '#ffd65a';
      ctx.shadowBlur = 34;
      ctx.beginPath();
      ctx.arc(sunX, 105, 49, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const cloudColor = night ? 'rgba(178,166,221,.15)' : 'rgba(255,250,220,.54)';
    for (let index = 0; index < 7; index += 1) {
      const x = ((index * 345 - game.cameraX * .09) % 1380 + 1380) % 1380 - 190;
      const y = 70 + index % 4 * 54;
      drawIslandCloud(x, y, .68 + index % 3 * .16, cloudColor);
    }

    // Layered silhouettes move at different rates, so scenery naturally enters
    // and exits instead of popping when the section changes.
    const horizon = 390;
    ctx.fillStyle = night ? 'rgba(28,20,62,.52)' : 'rgba(29,103,93,.28)';
    for (let index = -2; index < 9; index += 1) {
      const x = index * 255 - (game.cameraX * .14) % 255;
      ctx.beginPath();
      ctx.moveTo(x - 150, horizon);
      ctx.quadraticCurveTo(x - 22, horizon - 110 - index % 3 * 16, x + 40, horizon - 74);
      ctx.quadraticCurveTo(x + 100, horizon - 38, x + 150, horizon);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = night ? 'rgba(25,16,49,.76)' : 'rgba(22,93,71,.45)';
    for (let index = -2; index < 8; index += 1) {
      const x = index * 320 - (game.cameraX * .24) % 320;
      ctx.beginPath();
      ctx.moveTo(x - 180, horizon + 32);
      ctx.quadraticCurveTo(x - 58, horizon - 82 - index % 2 * 18, x + 20, horizon - 54);
      ctx.quadraticCurveTo(x + 116, horizon - 18, x + 180, horizon + 32);
      ctx.closePath();
      ctx.fill();
    }

    const volcanoX = 760 - (game.cameraX / WORLD_WIDTH) * 430;
    const volcanoY = 116;
    const volcanoFrame = game.eruption.state === 'kaboom' || game.eruption.state === 'active' ? 2
      : game.eruption.state === 'warming' || section.id === 'caves' ? 1 : 0;
    if (images.environment) {
      const sourceX = volcanoFrame * 512;
      const sourceY = 0;
      const pulse = volcanoFrame === 2 ? 1 + Math.sin(time * .006) * .018 : 1;
      ctx.save();
      ctx.translate(volcanoX + 190, volcanoY + 135);
      ctx.scale(pulse, pulse);
      ctx.translate(-(volcanoX + 190), -(volcanoY + 135));
      ctx.shadowColor = volcanoFrame === 2 ? '#ff5d54' : volcanoFrame === 1 ? '#ff8a55' : 'transparent';
      ctx.shadowBlur = volcanoFrame === 2 ? 26 : 12;
      ctx.drawImage(images.environment, sourceX, sourceY, 512, 360, volcanoX, volcanoY, 380, 267);
      ctx.restore();
    }
    if (game.eruption.rainbowBurst > 0) {
      const progress = 1 - game.eruption.rainbowBurst / 3.6;
      const colors = ['#ff5c8a', '#ffb24d', '#ffe86a', '#55e6a5', '#65e7ff', '#bb8cff'];
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress) * .72;
      colors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(volcanoX + 190, volcanoY + 145, 48 + progress * 420 + index * 11, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    if (section.id === 'camp' || section.id === 'geyser') {
      for (let index = -1; index < 7; index += 1) {
        const x = index * 290 - (game.cameraX * .34) % 290;
        drawPalm(x + 60, horizon + 58, .72 + index % 2 * .12, 'rgba(17,73,61,.78)', time, index % 2 ? -1 : 1);
      }
    } else if (section.id === 'caves') {
      for (let index = 0; index < 9; index += 1) {
        const x = ((index * 143 - game.cameraX * .3) % 1120 + 1120) % 1120 - 80;
        const height = 44 + index % 4 * 19;
        ctx.fillStyle = index % 2 ? 'rgba(187,140,255,.24)' : 'rgba(255,111,160,.19)';
        ctx.beginPath();
        ctx.moveTo(x - 16, 438);
        ctx.lineTo(x, 438 - height);
        ctx.lineTo(x + 16, 438);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (section.id === 'eruption' || section.id === 'luau') {
      for (let index = 0; index < 36; index += 1) {
        const cycle = ((time * (.00008 + index % 4 * .000018) + index * .11) % 1);
        const x = ((index * 109 - game.cameraX * .07) % 1080 + 1080) % 1080 - 40;
        const y = 440 - cycle * 390;
        ctx.globalAlpha = .18 + (1 - cycle) * .46;
        ctx.fillStyle = index % 5 === 0 ? '#ffd65a' : '#ff704d';
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + index % 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const chaseActive = game.eruption.state !== 'dormant' && player.x >= 19400 && player.x < 27400;
    if (chaseActive) {
      for (let index = 0; index < 14; index += 1) {
        const travel = (time * (.22 + index * .006) + index * 93) % 1100;
        const y = 72 + index % 8 * 48;
        ctx.strokeStyle = `rgba(255,238,175,${.08 + index % 3 * .05})`;
        ctx.lineWidth = 2 + index % 3;
        ctx.beginPath();
        ctx.moveTo(travel - 170, y);
        ctx.lineTo(travel, y - 4);
        ctx.stroke();
      }
    }

    if (game.eruption.flash > 0) {
      ctx.globalAlpha = game.eruption.flash * 1.45;
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }

  function drawCalderaHazards(time) {
    const section = currentSection(player.x);
    if (section.id === 'caves' || section.id === 'eruption' || section.id === 'luau') {
      const lava = ctx.createLinearGradient(0, 454, 0, 540);
      lava.addColorStop(0, section.id === 'luau' ? '#ff55a6' : '#ffb03f');
      lava.addColorStop(.34, section.id === 'luau' ? '#8d44c3' : '#ff5c36');
      lava.addColorStop(1, '#43173e');
      ctx.fillStyle = lava;
      ctx.fillRect(0, 458, canvas.width, 82);
      for (let x = -80; x < canvas.width + 100; x += 82) {
        const y = 474 + Math.sin(time * .004 + x * .035) * 7;
        ctx.strokeStyle = section.id === 'luau' ? 'rgba(255,214,90,.65)' : 'rgba(255,238,139,.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 21, y - 9, x + 42, y);
        ctx.quadraticCurveTo(x + 63, y + 9, x + 82, y);
        ctx.stroke();
      }
    }

    for (const geyser of world.geysers) {
      if (!visibleWorldX(geyser.x, 90, 100)) continue;
      const x = geyser.x - game.cameraX;
      const phase = (game.levelTime + geyser.phase) % geyser.cycle;
      const active = phase > geyser.cycle * .56 && phase < geyser.cycle * .9;
      ctx.fillStyle = '#3e3151';
      ctx.strokeStyle = '#1d1930';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 1, 35, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (active) {
        const height = 74 + Math.sin(time * .012 + geyser.phase) * 15;
        const plume = ctx.createLinearGradient(x, GROUND_Y, x, GROUND_Y - height);
        plume.addColorStop(0, 'rgba(76,220,238,.82)');
        plume.addColorStop(.7, 'rgba(218,255,250,.7)');
        plume.addColorStop(1, 'rgba(218,255,250,0)');
        ctx.fillStyle = plume;
        ctx.beginPath();
        ctx.moveTo(x - 13, GROUND_Y);
        ctx.quadraticCurveTo(x - 30, GROUND_Y - height * .55, x - 6, GROUND_Y - height);
        ctx.quadraticCurveTo(x + 28, GROUND_Y - height * .52, x + 13, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.globalAlpha = .38;
        ctx.fillStyle = '#dffefa';
        for (let puff = 0; puff < 3; puff += 1) {
          ctx.beginPath();
          ctx.arc(x + (puff - 1) * 8, GROUND_Y - 15 - puff * 7, 5 + puff, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawCalderaScenery(time) {
    if (game.environmentRemasterReady) return;
    if (!images.environment) return;
    const scenery = [
      { x: 2500, frame: 3, w: 300, h: 200 },
      { x: 5200, frame: 3, w: 270, h: 180 },
      { x: 7600, frame: 4, w: 310, h: 207 },
      { x: 10450, frame: 4, w: 285, h: 190 },
      { x: 13600, frame: 5, w: 310, h: 207 },
      { x: 17200, frame: 5, w: 280, h: 187 },
      { x: 20300, frame: 6, w: 285, h: 190 },
      { x: 24900, frame: 6, w: 300, h: 200 },
      { x: 28800, frame: 7, w: 300, h: 200 },
    ];
    for (const prop of scenery) {
      if (!visibleWorldX(prop.x - prop.w / 2, prop.w, 140)) continue;
      const sourceX = prop.frame % 3 * 512;
      const sourceY = Math.floor(prop.frame / 3) * (images.environment.height / 3);
      const sourceH = images.environment.height / 3;
      const screenX = prop.x - game.cameraX;
      const bob = prop.frame === 4 ? Math.sin(time * .006 + prop.x) * 2 : 0;
      ctx.save();
      ctx.globalAlpha = .94;
      ctx.drawImage(
        images.environment,
        sourceX,
        sourceY,
        512,
        sourceH,
        screenX - prop.w / 2,
        GROUND_Y - prop.h + bob + 8,
        prop.w,
        prop.h,
      );
      ctx.restore();
    }
  }

  function drawBackground(time) {
    const section = currentSection(player.x);
    const palettes = {
      shore: ['#38bde5', '#80e3dc', '#ffd394', '#fff1bd'],
      canopy: ['#159a8a', '#43cfa4', '#a9e8b4', '#ffe09a'],
      tides: ['#145b91', '#3caec1', '#91e2db', '#d9f3c4'],
      surge: ['#061b42', '#185783', '#397fa0', '#8d6d9f'],
      fiesta: ['#071b46', '#273b87', '#78488f', '#ff70a3'],
    }[section.id];
    const isNight = section.id === 'surge' || section.id === 'fiesta';
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, palettes[0]); sky.addColorStop(0.42, palettes[1]); sky.addColorStop(0.74, palettes[2]); sky.addColorStop(1, palettes[3]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isNight) {
      for (let i = 0; i < 54; i += 1) {
        const x = ((i * 149 - game.cameraX * 0.035) % 1080 + 1080) % 1080 - 50;
        const y = 26 + (i * 73) % 282;
        ctx.globalAlpha = 0.42 + Math.sin(time * 0.003 + i) * 0.28;
        drawStar(x, y, 1.8 + (i % 3), i % 5 === 0 ? '#ffe17f' : '#d8f9ff');
      }
      ctx.globalAlpha = 1;
      const moonX = 780 - game.cameraX * 0.012;
      const moon = ctx.createRadialGradient(moonX - 12, 94, 5, moonX, 112, 62);
      moon.addColorStop(0, '#fffef0'); moon.addColorStop(0.7, '#fff2bd'); moon.addColorStop(1, '#d7e6dd');
      ctx.fillStyle = moon; ctx.shadowColor = '#b8fff5'; ctx.shadowBlur = 34;
      ctx.beginPath(); ctx.arc(moonX, 112, 58, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(134,147,170,.16)';
      ctx.beginPath(); ctx.arc(moonX - 18, 94, 9, 0, Math.PI * 2); ctx.arc(moonX + 19, 125, 12, 0, Math.PI * 2); ctx.fill();
    } else {
      const sunX = 760 - game.cameraX * 0.018;
      const sunY = 108;
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = '#fff4b8'; ctx.lineWidth = 5;
      for (let ray = 0; ray < 12; ray += 1) {
        const angle = ray * Math.PI / 6 + time * 0.00008;
        ctx.beginPath(); ctx.moveTo(sunX + Math.cos(angle) * 65, sunY + Math.sin(angle) * 65); ctx.lineTo(sunX + Math.cos(angle) * 84, sunY + Math.sin(angle) * 84); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const sun = ctx.createRadialGradient(sunX - 14, sunY - 15, 5, sunX, sunY, 54);
      sun.addColorStop(0, '#fffef0'); sun.addColorStop(0.68, '#fff0a2'); sun.addColorStop(1, '#ffc966');
      ctx.fillStyle = sun; ctx.shadowColor = '#fff0a2'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(sunX, sunY, 51, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }

    const cloudColor = isNight ? 'rgba(151,190,237,.16)' : 'rgba(255,250,218,.55)';
    for (let i = 0; i < 7; i += 1) {
      const x = ((i * 340 - game.cameraX * 0.1) % 1370 + 1370) % 1370 - 180;
      const y = 74 + (i % 4) * 57;
      drawIslandCloud(x, y, 0.72 + (i % 3) * 0.16, cloudColor);
    }

    const horizon = isNight ? 365 : 382;
    const farColor = isNight ? 'rgba(10,39,76,.64)' : 'rgba(27,118,105,.28)';
    const nearColor = isNight ? 'rgba(7,48,66,.8)' : 'rgba(19,102,78,.48)';
    ctx.fillStyle = farColor;
    for (let i = -2; i < 9; i += 1) {
      const x = i * 245 - (game.cameraX * 0.16) % 245;
      ctx.beginPath(); ctx.moveTo(x - 142, horizon); ctx.quadraticCurveTo(x - 30, horizon - 95 - (i % 3) * 16, x + 22, horizon - 78); ctx.quadraticCurveTo(x + 92, horizon - 44, x + 142, horizon); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = nearColor;
    for (let i = -2; i < 8; i += 1) {
      const x = i * 310 - (game.cameraX * 0.28) % 310;
      ctx.beginPath(); ctx.moveTo(x - 175, horizon + 26); ctx.quadraticCurveTo(x - 50, horizon - 74 - (i % 2) * 18, x + 14, horizon - 60); ctx.quadraticCurveTo(x + 108, horizon - 24, x + 175, horizon + 26); ctx.closePath(); ctx.fill();
    }

    if (section.id === 'tides') {
      for (let i = -1; i < 6; i += 1) {
        const x = i * 330 - (game.cameraX * 0.34) % 330;
        drawDistantTemple(x + 110, horizon + 8, 0.65 + (i % 2) * 0.1, 'rgba(25,91,91,.58)', true);
      }
    } else if (section.id === 'canopy' || section.id === 'shore' || isNight) {
      const palmColor = isNight ? 'rgba(7,56,66,.86)' : section.id === 'canopy' ? 'rgba(18,91,58,.72)' : 'rgba(30,111,70,.58)';
      for (let i = -1; i < 7; i += 1) {
        const x = i * 205 - (game.cameraX * 0.39) % 205;
        drawPalm(x + 80, horizon + 38, 0.72 + (i % 3) * 0.08, palmColor, time, i % 2 ? -1 : 1);
      }
    }

    if (section.id === 'fiesta') {
      ctx.strokeStyle = 'rgba(255,225,127,.38)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 326); ctx.quadraticCurveTo(240, 292, 480, 326); ctx.quadraticCurveTo(720, 360, 960, 326); ctx.stroke();
      for (let i = 0; i < 17; i += 1) {
        const x = i * 60; const y = 326 + Math.sin((x / 960) * Math.PI * 4) * 16;
        ctx.fillStyle = ['#ff718f', '#ffe17f', '#55e6a5', '#63e7ff'][i % 4];
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x, y, 3.5 + Math.sin(time * 0.008 + i), 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }

  function drawHazardSurface(time) {
    const section = currentSection(player.x);
    const isNight = section.id === 'surge' || section.id === 'fiesta';
    const waterY = section.id === 'tides' ? game.tideY : 468;
    const ocean = ctx.createLinearGradient(0, waterY, 0, canvas.height);
    ocean.addColorStop(0, isNight ? '#45d4d0' : '#50e3dc');
    ocean.addColorStop(0.28, isNight ? '#176ca2' : '#1e9fc0');
    ocean.addColorStop(1, '#0b4a78');
    ctx.fillStyle = ocean; ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);
    const shine = ctx.createLinearGradient(0, waterY, canvas.width, waterY + 80);
    shine.addColorStop(0, 'rgba(255,255,255,0)'); shine.addColorStop(0.48, 'rgba(198,255,244,.14)'); shine.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.fillRect(0, waterY, canvas.width, 86);
    ctx.strokeStyle = isNight ? '#b8fff5' : '#ecfff2'; ctx.lineWidth = 4;
    for (let row = 0; row < 3; row += 1) {
      ctx.globalAlpha = 0.6 - row * 0.15; ctx.beginPath();
      for (let x = -20; x <= canvas.width + 20; x += 20) ctx.lineTo(x, waterY + row * 17 + Math.sin(x * 0.04 + time * 0.006 + row) * 4);
      ctx.stroke();
    }
    for (let i = 0; i < 9; i += 1) {
      const sparkleX = ((i * 137 - game.cameraX * 0.08) % 1080 + 1080) % 1080;
      const sparkleY = waterY + 15 + (i % 3) * 20;
      ctx.globalAlpha = 0.2 + Math.max(0, Math.sin(time * 0.004 + i)) * 0.5;
      drawStar(sparkleX, sparkleY, 2.5 + i % 2, '#d9fff5');
    }
    ctx.globalAlpha = 1;
  }

  function paintedTerrainColors(sectionId) {
    return {
      camp: ['#d9f19a', '#7c8b52', '#30283d'],
      geyser: ['#e8f4bd', '#5bcfc3', '#315661'],
      caves: ['#c89bff', '#694b91', '#241b3b'],
      eruption: ['#ffb15c', '#b54d46', '#241827'],
      luau: ['#ffe681', '#ba69b6', '#292051'],
    }[sectionId] || ['#d9f19a', '#7c8b52', '#30283d'];
  }

  function drawPaintedTerrainSlice(platform, time) {
    if (platform.style === 'surf-lane') return false;
    const ground = Boolean(platform.ground);
    const atlas = ground ? images.groundAtlas : images.platformAtlas;
    if (!atlas) return false;
    const sectionId = currentSection(platform.x + platform.w / 2).id;
    const rowIndex = terrainRows[sectionId] ?? 0;
    const row = terrainSourceRows[ground ? 'ground' : 'platform'][rowIndex];
    const screenX = Math.floor(platform.x - game.cameraX);
    const screenY = Math.floor(platform.y);
    const visualHeight = ground
      ? Math.max(platform.h, calderaPlatformVisualProfile.groundMinimumHeight)
      : Math.max(platform.h + calderaPlatformVisualProfile.elevatedExtraDepth, calderaPlatformVisualProfile.elevatedMinimumHeight);
    const visualTop = screenY - 3;
    const radius = ground ? 9 : Math.min(17, visualHeight * .34);
    const tileWidth = ground ? 304 : 226;
    const sourceTileWidth = ground ? 610 : 520;
    const maxSourceX = row[0] + row[2] - sourceTileWidth;
    const colors = paintedTerrainColors(sectionId);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath(); ctx.roundRect(screenX, visualTop, platform.w, visualHeight, radius); ctx.clip();
    for (let offset = 0, tile = 0; offset < platform.w; offset += tileWidth, tile += 1) {
      const drawWidth = Math.min(tileWidth + 1, platform.w - offset);
      const seededOffset = Math.abs(Math.floor(platform.x * .37 + tile * 419 + rowIndex * 173));
      const sourceX = row[0] + (seededOffset % Math.max(1, maxSourceX - row[0]));
      ctx.drawImage(atlas, sourceX, row[1], sourceTileWidth, row[3], screenX + offset, visualTop, drawWidth, visualHeight);
    }
    const shade = ctx.createLinearGradient(0, visualTop, 0, visualTop + visualHeight);
    shade.addColorStop(0, 'rgba(255,255,255,.08)');
    shade.addColorStop(.3, 'rgba(255,255,255,0)');
    shade.addColorStop(1, ground ? 'rgba(8,18,29,.17)' : 'rgba(8,18,29,.29)');
    ctx.fillStyle = shade; ctx.fillRect(screenX, visualTop, platform.w, visualHeight);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;

    ctx.strokeStyle = colors[2]; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(screenX, visualTop, platform.w, visualHeight, radius); ctx.stroke();
    ctx.strokeStyle = colors[0]; ctx.globalAlpha = .75; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(screenX + radius, screenY); ctx.lineTo(screenX + platform.w - radius, screenY); ctx.stroke();
    ctx.globalAlpha = 1;

    if (!ground) {
      ctx.fillStyle = 'rgba(5,20,34,.25)';
      ctx.beginPath(); ctx.ellipse(screenX + platform.w / 2, visualTop + visualHeight + 9, Math.max(28, platform.w * .38), 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = sectionId === 'geyser' ? 'rgba(196,255,242,.62)'
        : sectionId === 'eruption' ? 'rgba(255,153,82,.58)'
          : sectionId === 'luau' ? 'rgba(255,225,127,.55)' : 'rgba(202,166,255,.42)';
      ctx.lineWidth = 2;
      for (const endX of [screenX + 8, screenX + platform.w - 8]) {
        ctx.beginPath(); ctx.moveTo(endX, visualTop + 8); ctx.lineTo(endX, visualTop + visualHeight - 8); ctx.stroke();
      }
    }

    if (platform.moving) {
      ctx.fillStyle = 'rgba(255,255,255,.84)';
      const pulse = 3 + Math.sin(time * .008 + platform.phase) * 1.5;
      for (const markerX of [screenX + 12, screenX + platform.w - 12]) {
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(markerX, screenY + platform.h / 2, pulse, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    game.foregroundRemasterReady = true;
    return true;
  }

  function drawPlatform(platform, time) {
    if (!visibleWorldX(platform.x, platform.w, 80)) return;
    const x = Math.floor(platform.x - game.cameraX);
    const y = Math.floor(platform.y);
    const width = platform.w;
    const height = platform.h;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (platform.secret) { ctx.shadowColor = '#fff08a'; ctx.shadowBlur = 16 + Math.sin(time * 0.006 + platform.x) * 4; }
    if (!platform.ground) {
      ctx.fillStyle = 'rgba(4,31,48,.2)'; ctx.beginPath(); ctx.ellipse(x + width / 2, y + height + 10, Math.max(28, width * 0.4), 7, 0, 0, Math.PI * 2); ctx.fill();
    }

    if (drawPaintedTerrainSlice(platform, time)) {
      ctx.restore();
      return;
    }

    if (platform.style === 'surf-lane') {
      const left = Math.max(-20, x);
      const right = Math.min(canvas.width + 20, x + width);
      ctx.strokeStyle = 'rgba(225,255,249,.78)';
      ctx.lineWidth = 3;
      for (let row = 0; row < 2; row += 1) {
        ctx.beginPath();
        for (let px = left; px <= right; px += 18) {
          const py = y + 5 + row * 7 + Math.sin(px * .045 + time * .009 + row) * (3 + row);
          if (px === left) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
      return;
    } else if (platform.style === 'sand' || platform.style === 'moon-sand') {
      const moon = platform.style === 'moon-sand';
      const soil = ctx.createLinearGradient(0, y, 0, y + height);
      soil.addColorStop(0, moon ? '#596d9c' : '#d99052'); soil.addColorStop(0.25, moon ? '#3e527c' : '#b86a42'); soil.addColorStop(1, moon ? '#26385d' : '#71422f');
      roundedPanel(x, y, width, height, 10, soil, moon ? '#2c315d' : '#7a4632', 3);
      const top = ctx.createLinearGradient(0, y - 5, 0, y + 17);
      top.addColorStop(0, moon ? '#c7fff0' : '#fff4ad'); top.addColorStop(0.45, moon ? '#78e6d5' : '#ffd56f'); top.addColorStop(1, moon ? '#468dae' : '#ef9e51');
      ctx.fillStyle = top; ctx.beginPath(); ctx.roundRect(x - 1, y - 3, width + 2, 18, 9); ctx.fill();
      ctx.strokeStyle = moon ? 'rgba(198,156,255,.45)' : 'rgba(92,49,37,.38)'; ctx.lineWidth = 3;
      for (let px = 26; px < width; px += 68) { const py = y + 34 + ((px / 17) % 3) * 14; ctx.beginPath(); ctx.moveTo(x + px - 10, py); ctx.quadraticCurveTo(x + px, py - 6, x + px + 10, py); ctx.stroke(); }
      for (let px = 18; px < width; px += 52) { ctx.fillStyle = moon ? '#c69cff' : px % 3 ? '#fff0a1' : '#ff9a78'; ctx.beginPath(); ctx.arc(x + px, y + 7, 3, Math.PI, Math.PI * 2); ctx.fill(); }
    } else if (platform.style === 'canopy-ground') {
      const bark = ctx.createLinearGradient(0, y, 0, y + height); bark.addColorStop(0, '#86573a'); bark.addColorStop(0.55, '#5f3e31'); bark.addColorStop(1, '#342a2a');
      roundedPanel(x, y, width, height, 9, bark, '#47302d', 3);
      ctx.strokeStyle = 'rgba(204,139,78,.35)'; ctx.lineWidth = 3;
      for (let px = 20; px < width; px += 58) { ctx.beginPath(); ctx.moveTo(x + px, y + 16); ctx.bezierCurveTo(x + px - 12, y + 43, x + px + 16, y + 68, x + px + 3, y + height); ctx.stroke(); }
      const moss = ctx.createLinearGradient(0, y - 8, 0, y + 17); moss.addColorStop(0, '#9af08a'); moss.addColorStop(0.55, '#42bd68'); moss.addColorStop(1, '#268654');
      ctx.fillStyle = moss; ctx.beginPath(); ctx.roundRect(x - 2, y - 5, width + 4, 18, 8); ctx.fill();
      for (let px = 10; px < width; px += 25) { ctx.fillStyle = px % 4 ? '#72e786' : '#ffe17f'; ctx.beginPath(); ctx.moveTo(x + px, y); ctx.quadraticCurveTo(x + px + 5, y - 13 - px % 5, x + px + 11, y); ctx.fill(); }
    } else if (platform.style === 'temple-ground' || platform.style === 'temple') {
      const stone = ctx.createLinearGradient(0, y, 0, y + height); stone.addColorStop(0, '#91c3a5'); stone.addColorStop(0.2, '#688e82'); stone.addColorStop(1, '#3e5c63');
      roundedPanel(x, y, width, height, 7, stone, '#31505a', 3);
      ctx.fillStyle = '#b5e2b7'; ctx.beginPath(); ctx.roundRect(x, y - 3, width, 12, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(25,68,72,.48)'; ctx.lineWidth = 2;
      for (let px = 0; px < width; px += 48) { ctx.strokeRect(x + px, y + 10, Math.min(47, width - px), Math.max(8, Math.min(30, height - 10))); if (height > 20) { ctx.beginPath(); ctx.arc(x + px + 24, y + 24, 6, 0, Math.PI * 2); ctx.stroke(); } }
    } else if (platform.style === 'dock' || platform.style === 'raft') {
      const wood = ctx.createLinearGradient(0, y, 0, y + height); wood.addColorStop(0, '#d29155'); wood.addColorStop(0.55, '#9b5f3e'); wood.addColorStop(1, '#633c35');
      roundedPanel(x, y, width, height, platform.style === 'raft' ? 10 : 5, wood, '#503143', 3);
      ctx.strokeStyle = '#704333'; ctx.lineWidth = 3; for (let px = 9; px < width; px += 34) { ctx.beginPath(); ctx.moveTo(x + px, y + 2); ctx.lineTo(x + px + 3, y + height - 2); ctx.stroke(); }
      ctx.strokeStyle = '#ffe1a1'; for (const ropeX of [18, width - 18]) { ctx.beginPath(); ctx.moveTo(x + ropeX, y + 1); ctx.lineTo(x + ropeX, y + height - 1); ctx.stroke(); }
      ctx.fillStyle = '#55e6c1'; ctx.beginPath(); ctx.roundRect(x + 3, y - 2, width - 6, 7, 3); ctx.fill();
      if (platform.style === 'raft') { ctx.fillStyle = '#ff718f'; for (let px = 20; px < width; px += 76) { ctx.beginPath(); ctx.ellipse(x + px, y + height + 4, 12, 6, 0, 0, Math.PI * 2); ctx.fill(); } }
    } else if (platform.style === 'surfboard') {
      const board = ctx.createLinearGradient(x, y, x + width, y + height); board.addColorStop(0, '#ff577f'); board.addColorStop(0.5, '#ff9d6d'); board.addColorStop(1, '#da3f7c');
      ctx.fillStyle = board; ctx.beginPath(); ctx.roundRect(x, y, width, height, height / 2); ctx.fill(); ctx.strokeStyle = '#6a2d5b'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffe17f'; ctx.beginPath(); ctx.roundRect(x + width * 0.16, y + 4, width * 0.68, height - 8, 8); ctx.fill();
      ctx.fillStyle = '#20c8d8'; ctx.beginPath(); ctx.roundRect(x + width * 0.43, y + 4, width * 0.14, height - 8, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.beginPath(); ctx.ellipse(x + width * 0.3, y + 5, width * 0.15, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    } else if (platform.style === 'leaf') {
      const leaf = ctx.createLinearGradient(x, y, x + width, y + height); leaf.addColorStop(0, '#78df72'); leaf.addColorStop(0.48, '#31a960'); leaf.addColorStop(1, '#177850');
      ctx.fillStyle = leaf; ctx.beginPath(); ctx.moveTo(x, y + height * 0.6); ctx.quadraticCurveTo(x + width * 0.42, y - height * 0.55, x + width, y + height * 0.48); ctx.quadraticCurveTo(x + width * 0.5, y + height * 1.45, x, y + height * 0.6); ctx.fill(); ctx.strokeStyle = '#195f48'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#b7f28b'; ctx.beginPath(); ctx.moveTo(x + 10, y + height * 0.62); ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.25, x + width - 10, y + height * 0.5); ctx.stroke();
    } else if (['obsidian', 'obsidian-high', 'luau-stage'].includes(platform.style)) {
      const stage = platform.style === 'luau-stage'; const rock = ctx.createLinearGradient(0, y, 0, y + height);
      rock.addColorStop(0, stage ? '#9d6044' : '#4d3153'); rock.addColorStop(0.45, stage ? '#6b3b3d' : '#34223d'); rock.addColorStop(1, '#21182e');
      roundedPanel(x, y, width, height, 7, rock, '#25172d', 3);
      ctx.fillStyle = stage ? '#ffe17f' : '#ff7658'; ctx.beginPath(); ctx.roundRect(x, y - 2, width, 10, 5); ctx.fill();
      for (let px = 18; px < width; px += 52) { ctx.strokeStyle = px % 3 ? '#7b3d59' : '#ff6a53'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + px, y + 11); ctx.lineTo(x + px + 13, y + Math.min(height - 5, 25)); ctx.lineTo(x + px + 28, y + 12); ctx.stroke(); }
      if (stage) for (let px = 30; px < width; px += 88) drawStar(x + px, y + height / 2, 5, '#55e6c1');
    } else if (platform.style === 'drum-lift') {
      const drum = ctx.createLinearGradient(0, y, 0, y + height); drum.addColorStop(0, '#f28755'); drum.addColorStop(0.5, '#c94e4f'); drum.addColorStop(1, '#75304a');
      roundedPanel(x, y, width, height, 9, drum, '#4b2644', 3); ctx.strokeStyle = '#ffe17f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, width - 6, height - 6, 7); ctx.stroke();
      ctx.strokeStyle = '#63e7ff'; ctx.lineWidth = 2; for (let px = 18; px < width; px += 34) { ctx.beginPath(); ctx.moveTo(x + px, y + 5); ctx.lineTo(x + px + 13, y + height - 5); ctx.stroke(); }
    } else if (platform.style === 'glowboard') {
      ctx.shadowColor = '#63e7ff'; ctx.shadowBlur = 18 + Math.sin(time * 0.007 + platform.phase) * 4;
      const glow = ctx.createLinearGradient(x, y, x + width, y); glow.addColorStop(0, '#5049a1'); glow.addColorStop(0.5, '#7356b1'); glow.addColorStop(1, '#285f9d');
      roundedPanel(x, y, width, height, 12, glow, '#b6fff3', 2); ctx.fillStyle = '#8effdb'; ctx.beginPath(); ctx.roundRect(x + 8, y + 4, width - 16, 5, 3); ctx.fill();
      for (let px = 26; px < width - 8; px += 46) drawStar(x + px, y + height / 2 + 4, 4, px % 2 ? '#ffe17f' : '#ff8fba');
    } else roundedPanel(x, y, width, height, 6, '#7f694e', '#46374d', 3);

    if (platform.moving) {
      ctx.fillStyle = 'rgba(255,255,255,.78)'; const pulse = 3 + Math.sin(time * 0.008 + platform.phase) * 1.5;
      for (const markerX of [x + 12, x + width - 12]) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(markerX, y + height / 2, pulse, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }

  function drawCollectible(item, time) {
    if (item.collected || !visibleWorldX(item.x, item.w, 60)) return;
    const x = item.x - game.cameraX;
    const y = item.y + Math.sin(time * 0.005 + item.bob) * 4;
    const size = item.w;
    const pulse = (Math.sin(time * 0.008 + item.bob) + 1) * 0.5;
    ctx.save(); ctx.translate(x + size / 2, y + size / 2);
    if (item.dynamic) ctx.rotate(item.angle || 0);
    if (item.type === 'taco') {
      ctx.shadowColor = item.boatDrop ? '#63e7ff' : '#ffe17f'; ctx.shadowBlur = item.boatDrop ? 18 : 5 + pulse * 5;
      if (item.boatDrop) {
        ctx.strokeStyle = `rgba(99,231,255,${0.55 + pulse * 0.35})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 18 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        for (let ray = 0; ray < 4; ray += 1) { const angle = ray * Math.PI / 2 + time * 0.003; ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 22, Math.sin(angle) * 22); ctx.lineTo(Math.cos(angle) * 28, Math.sin(angle) * 28); ctx.stroke(); }
      }
      ctx.drawImage(images.items, 0, 0, 16, 16, -size / 2, -size / 2, size, size);
      ctx.globalAlpha = 0.35 + pulse * 0.35; drawStar(size * 0.24, -size * 0.26, 2.5 + pulse, '#fffbe1'); ctx.globalAlpha = 1;
    } else if (item.type === 'golden') {
      ctx.rotate(Math.sin(time * 0.002 + item.bob) * 0.08); ctx.shadowColor = '#fff08a'; ctx.shadowBlur = 20 + pulse * 10;
      const gold = ctx.createRadialGradient(-6, -8, 2, 0, 0, 18); gold.addColorStop(0, '#fff7b0'); gold.addColorStop(0.45, '#ffd85e'); gold.addColorStop(1, '#d68727');
      ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8d552d'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9b633e'; ctx.beginPath(); ctx.arc(0, 2, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c3b31'; ctx.beginPath(); ctx.arc(-4, -2, 2, 0, Math.PI * 2); ctx.arc(4, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, 5, 0.1, Math.PI - 0.1); ctx.stroke();
      drawStar(12, -12, 4 + pulse * 2, '#fff9d4');
    } else if (item.type === 'rainbow') {
      const colors = ['#ff718f', '#ffae5c', '#ffe17f', '#55e6a5', '#63e7ff', '#c69cff'];
      ctx.shadowColor = colors[Math.floor(time * 0.01) % colors.length]; ctx.shadowBlur = 20 + pulse * 8; ctx.rotate(Math.sin(time * 0.003 + item.bob) * 0.06);
      colors.forEach((color, index) => { ctx.strokeStyle = color; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(0, 5, 17 - index * 2.2, Math.PI, Math.PI * 2); ctx.stroke(); });
      ctx.fillStyle = '#fff5d6'; ctx.beginPath(); ctx.roundRect(-18, 4, 36, 8, 4); ctx.fill();
      drawStar(-14, -12, 3 + pulse, '#fff'); drawStar(15, -7, 2.5 + (1 - pulse), '#fff');
    } else if (item.type === 'lime') {
      ctx.shadowColor = '#7cff68'; ctx.shadowBlur = 18 + pulse * 7;
      const lime = ctx.createRadialGradient(-5, -6, 2, 0, 0, 16); lime.addColorStop(0, '#eaff94'); lime.addColorStop(0.3, '#8ce85a'); lime.addColorStop(1, '#299f43');
      ctx.fillStyle = lime; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e6ff9c'; ctx.lineWidth = 2.4; for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.stroke(); }
      ctx.strokeStyle = '#2a7c3d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
    } else if (item.type === 'pepper') {
      ctx.shadowColor = '#ff674d'; ctx.shadowBlur = 18 + pulse * 7;
      const pepper = ctx.createLinearGradient(-10, -12, 10, 18); pepper.addColorStop(0, '#ffad62'); pepper.addColorStop(0.45, '#f14e43'); pepper.addColorStop(1, '#a72145');
      ctx.fillStyle = pepper; ctx.beginPath(); ctx.ellipse(0, 3, 9, 17, 0.45, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7d2340'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#6cdf62'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-4, -12); ctx.quadraticCurveTo(2, -20, 8, -14); ctx.stroke();
    } else if (item.type === 'shell') {
      ctx.shadowColor = '#ffe17f'; ctx.shadowBlur = 18 + pulse * 7;
      const shell = ctx.createLinearGradient(-12, -10, 12, 12); shell.addColorStop(0, '#fff8bd'); shell.addColorStop(0.5, '#ffd85e'); shell.addColorStop(1, '#ee8d55');
      ctx.fillStyle = shell; ctx.beginPath(); ctx.arc(0, 2, 16, Math.PI, Math.PI * 2); ctx.lineTo(16, 11); ctx.lineTo(-16, 11); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#a35d4c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#fff7ce'; ctx.lineWidth = 2; for (let i = -10; i <= 10; i += 5) { ctx.beginPath(); ctx.moveTo(i, 8); ctx.lineTo(i * 0.45, -8); ctx.stroke(); }
    } else if (item.type === 'coconut') {
      ctx.shadowColor = '#ffcf83'; ctx.shadowBlur = 14 + pulse * 6;
      const nut = ctx.createRadialGradient(-5, -6, 2, 0, 0, 16); nut.addColorStop(0, '#d8a368'); nut.addColorStop(0.45, '#9b633e'); nut.addColorStop(1, '#5c382f');
      ctx.fillStyle = nut; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#4d312b'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#4d312b'; ctx.beginPath(); ctx.arc(-5, -4, 2, 0, Math.PI * 2); ctx.arc(5, -4, 2, 0, Math.PI * 2); ctx.arc(0, 4, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawAtlasCell(image, columns, rows, frame, x, y, width, height, options = {}) {
    if (!image) return false;
    const cellW = image.width / columns;
    const cellH = image.height / rows;
    const sourceX = (frame % columns) * cellW;
    const sourceY = Math.floor(frame / columns) * cellH;
    ctx.save();
    ctx.translate(x, y);
    if (options.flip) ctx.scale(-1, 1);
    if (options.rotation) ctx.rotate(options.rotation);
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.drawImage(image, sourceX, sourceY, cellW, cellH, -width / 2, -height, width, height);
    ctx.restore();
    return true;
  }

  function drawCalderaEnemy(enemy, time) {
    if (!enemy.alive || !visibleWorldX(enemy.x, enemy.w, 120)) return;
    const frames = {
      marshmallow: [0, 1], pineapple: [2, 3], queso: [4, 5],
      pepper: [6, 7], crab: [8, 9], nacho: [10, 11],
    }[enemy.type] || [0, 1];
    const active = enemy.telegraph || enemy.charging || enemy.rolling || Math.floor(time / 260 + enemy.clock) % 2;
    const frame = active ? frames[1] : frames[0];
    const drawProfile = calderaEnemyDrawProfiles[enemy.type] || calderaEnemyDrawProfiles.marshmallow;
    const screenX = enemy.x - game.cameraX + enemy.w / 2;
    const groundY = enemy.baseY + enemy.h + 5;
    const bob = enemy.telegraph ? Math.sin(time * .024 + enemy.clock) * 3
      : enemy.behaviorType === 'jalapeno' ? Math.sin(time * .012 + enemy.clock) * 4 : Math.abs(Math.sin(time * .008 + enemy.clock)) * 2;
    const lean = enemy.charging ? (enemy.dir || 1) * .1 : enemy.rolling ? (enemy.rollAngle || 0) * .18 : 0;
    ctx.save();
    ctx.globalAlpha = .22;
    ctx.fillStyle = '#1d1730';
    const shadowRadius = Math.min(23, Math.max(18, drawProfile.width * .27));
    ctx.beginPath();
    ctx.ellipse(screenX, groundY + 2, shadowRadius, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = enemy.telegraph ? '#ffd65a' : 'rgba(0,0,0,.28)';
    ctx.shadowBlur = enemy.telegraph ? 17 : 5;
    if (enemy.type === 'ash' && images.ashEnemy) {
      const cellWidth = images.ashEnemy.width / 2;
      ctx.save();
      ctx.translate(screenX, groundY - bob);
      if (enemy.dir < 0) ctx.scale(-1, 1);
      ctx.rotate(lean);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        images.ashEnemy,
        (active ? 1 : 0) * cellWidth, 230, cellWidth, 550,
        -drawProfile.width / 2, -drawProfile.height, drawProfile.width, drawProfile.height,
      );
      ctx.imageSmoothingEnabled = false;
      ctx.restore();
    } else {
      drawAtlasCell(images.enemies, 6, 3, frame, screenX, groundY - bob, drawProfile.width, drawProfile.height, {
        flip: enemy.dir < 0,
        rotation: lean,
      });
    }
    ctx.restore();
    heroCore.drawEnemyBehaviorSignals(ctx, enemy, enemy.x - game.cameraX, {
      groundOffset: 4,
      warningColor: '#ffd65a',
      chargeColor: '#ff704d',
      rollColor: '#bb8cff',
    });
  }

  function drawCalderaCheckpointPullOff(checkpoint, time) {
    const padWidth = 310;
    const screenX = checkpoint.x - game.cameraX - 58;
    const visualTop = GROUND_Y - 9;
    const visualHeight = 64;
    const row = checkpointPadRows[checkpoint.look] || checkpointPadRows.camp;
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = '#120d25';
    ctx.beginPath(); ctx.ellipse(screenX + padWidth / 2, GROUND_Y + 12, padWidth * .48, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (images.checkpointPadAtlas) {
      const sourceWidth = 690;
      const sourceX = Math.abs(Math.floor(checkpoint.x * .19)) % Math.max(1, row[2] - sourceWidth);
      ctx.imageSmoothingEnabled = true;
      ctx.beginPath(); ctx.roundRect(screenX, visualTop, padWidth, visualHeight, 14); ctx.clip();
      ctx.drawImage(images.checkpointPadAtlas, sourceX, row[1], sourceWidth, row[3], screenX, visualTop, padWidth, visualHeight);
      const shine = ctx.createLinearGradient(0, visualTop, 0, visualTop + visualHeight);
      shine.addColorStop(0, 'rgba(255,255,255,.12)'); shine.addColorStop(1, 'rgba(7,18,32,.2)');
      ctx.fillStyle = shine; ctx.fillRect(screenX, visualTop, padWidth, visualHeight);
      ctx.imageSmoothingEnabled = false;
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = .68;
    ctx.strokeStyle = checkpoint.accent; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(screenX, visualTop, padWidth, visualHeight, 14); ctx.stroke();
    const markerPulse = 2.8 + Math.sin(time * .008 + checkpoint.x) * 1.2;
    for (const markerX of [screenX + 14, screenX + padWidth - 14]) {
      ctx.fillStyle = checkpoint.accent; ctx.shadowColor = checkpoint.accent; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(markerX, visualTop + 10, markerPulse, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawCalderaCheckpoint(checkpoint, time) {
    if (!visibleWorldX(checkpoint.x, checkpoint.w, 300)) return;
    const screenX = checkpoint.x - game.cameraX + 96;
    const pulse = (Math.sin(time * .007 + checkpoint.x) + 1) * .5;
    const art = images[checkpointArtKeys[checkpoint.look]];
    drawCalderaCheckpointPullOff(checkpoint, time);

    ctx.save();
    ctx.globalAlpha = .26;
    ctx.fillStyle = '#160f2d';
    ctx.beginPath(); ctx.ellipse(screenX, GROUND_Y + 7, 92, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (art) {
      const widths = { camp: 220, geyser: 206, caves: 216, eruption: 212, luau: 225 };
      const drawWidth = widths[checkpoint.look] || 216;
      const drawHeight = drawWidth * (art.height / art.width);
      const activationLift = checkpoint.activated ? Math.sin(time * .011) * 1.3 : 0;
      ctx.save();
      ctx.shadowColor = checkpoint.accent;
      ctx.shadowBlur = checkpoint.activated ? 23 + pulse * 9 : 8;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(art, screenX - drawWidth / 2, GROUND_Y - drawHeight - activationLift, drawWidth, drawHeight);
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
    }

    const artHeight = checkpoint.look === 'geyser' ? 210 : checkpoint.look === 'eruption' ? 196 : 184;
    const panelY = GROUND_Y - artHeight - 42;
    roundedPanel(screenX - 106, panelY, 212, 35, 13, 'rgba(35,18,57,.92)', checkpoint.accent, 3);
    ctx.fillStyle = '#fff7d3'; ctx.font = '900 12px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`${checkpoint.activated ? '✓ ' : ''}${checkpoint.name.toUpperCase()}`, screenX, panelY + 22);
    if (!checkpoint.activated) {
      ctx.globalAlpha = .65 + pulse * .3;
      drawStar(screenX, panelY - 12, 6 + pulse * 2, checkpoint.accent);
      ctx.globalAlpha = 1;
    }
  }

  function drawTrekkerWheel(x, y, radius, rotation, heat = false) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    ctx.globalAlpha = .78;
    ctx.strokeStyle = heat ? '#ff9b4f' : '#ffd65a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, radius * .58, 0, Math.PI * 2); ctx.stroke();
    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = spoke * Math.PI / 3;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4); ctx.lineTo(Math.cos(angle) * radius * .55, Math.sin(angle) * radius * .55); ctx.stroke();
    }
    ctx.fillStyle = '#34243a'; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawTrekkerRearLauncherPulse(screenX, groundY, remaining, time) {
    if (remaining <= 0) return;
    const strength = clamp(remaining / calderaTrekkerRearLauncher.pulseDuration, 0, 1);
    const originX = screenX + calderaTrekkerRearLauncher.xOffset;
    const originY = groundY + calderaTrekkerRearLauncher.yOffset;
    const expansion = 1 - strength;
    ctx.save();
    ctx.globalAlpha = strength;
    ctx.strokeStyle = '#ffe17f';
    ctx.fillStyle = '#fff4bd';
    ctx.shadowColor = '#ffb84d';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(originX, originY, 5 + expansion * 12, 0, Math.PI * 2);
    ctx.stroke();
    for (let spark = 0; spark < 3; spark += 1) {
      const wobble = Math.sin(time * .02 + spark * 2.1) * 3;
      ctx.beginPath();
      ctx.moveTo(originX - 5, originY + (spark - 1) * 6);
      ctx.lineTo(originX - 16 - expansion * 16, originY + (spark - 1) * 8 + wobble);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(originX, originY, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawCalderaTrekkerVehicle(screenX, time, options = {}) {
    const image = images.calderaTrekkerBase;
    if (!image) return false;
    const drawWidth = options.width || 300;
    const drawHeight = drawWidth * (image.height / image.width);
    const suspension = options.suspension || 0;
    const groundY = options.groundY || GROUND_Y;
    const drawTop = groundY - drawHeight - suspension;
    const heat = Boolean(options.heat);
    ctx.save();
    ctx.globalAlpha = .22;
    ctx.fillStyle = '#140f24';
    ctx.beginPath(); ctx.ellipse(screenX, groundY + 6, drawWidth * .4, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(screenX, 0); ctx.scale(-1, 1);
    ctx.shadowColor = heat ? '#ff704d' : '#65e7ff'; ctx.shadowBlur = heat ? 20 : 11;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, -drawWidth / 2, drawTop, drawWidth, drawHeight);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
    const wheelY = groundY - 25 - suspension;
    const rotation = game.levelTime * (heat ? 11 : 8);
    drawTrekkerWheel(screenX - drawWidth * .28, wheelY, 21, rotation, heat);
    drawTrekkerWheel(screenX + drawWidth * .27, wheelY, 21, rotation, heat);
    drawTrekkerRearLauncherPulse(screenX, groundY, options.launcherPulse || 0, time);
    return true;
  }

  function drawCalderaTrekker(time) {
    const boat = game.boat;
    if (boat.state === 'basecamp' && player.x < 1900) {
      drawCalderaTrekkerVehicle(760 - game.cameraX, time, { width: 306, groundY: GROUND_Y });
      roundedPanel(360 - game.cameraX, 188, 320, 42, 15, 'rgba(37,19,62,.92)', '#ffd65a', 3);
      ctx.fillStyle = '#fff5c7'; ctx.font = '900 13px Arial'; ctx.textAlign = 'center';
      ctx.fillText('OLIVIA: I PACKED LIGHT. JUST 47 TACOS!', 520 - game.cameraX, 214);
      return;
    }
    if (['ready-lava', 'waiting-fiesta', 'parked'].includes(boat.state)) return;
    if (!visibleWorldX(boat.x - 190, 410, 280)) return;
    const screenX = boat.x - game.cameraX;
    const entering = boat.state.startsWith('entering');
    const escaping = boat.state.startsWith('escaping') || boat.state === 'fiesta-bound';
    const heat = boat.state === 'lava-chase' || boat.state === 'entering-lava' || boat.state === 'fiesta-bound';
    const suspension = Math.abs(Math.sin(time * .009 + boat.x * .01)) * 2.2;
    if (entering || escaping || heat) {
      for (let streak = 0; streak < 5; streak += 1) {
        ctx.strokeStyle = streak % 2 ? 'rgba(255,214,90,.66)' : 'rgba(101,231,255,.56)';
        ctx.lineWidth = 3 + streak % 2;
        ctx.beginPath();
        ctx.moveTo(screenX - 142 - streak * 16, GROUND_Y - 42 + streak * 9);
        ctx.lineTo(screenX - 208 - streak * 26, GROUND_Y - 42 + streak * 9);
        ctx.stroke();
      }
    }
    drawCalderaTrekkerVehicle(screenX, time, {
      width: 304,
      groundY: GROUND_Y,
      suspension,
      heat,
      launcherPulse: boat.dropPulse,
    });
  }

  function drawCalderaGoal(time) {
    const x = world.goal.x - game.cameraX;
    if (x < -560 || x > canvas.width + 560 || !images.environment) return;
    const pulse = (Math.sin(time * .009) + 1) * .5;
    ctx.save();
    for (let beam = 0; beam < 7; beam += 1) {
      ctx.save();
      ctx.translate(x, 446);
      ctx.rotate(-1.08 + beam * .36 + Math.sin(time * .0015 + beam) * .08);
      const light = ctx.createLinearGradient(0, 0, 0, -430);
      light.addColorStop(0, beam % 2 ? 'rgba(101,231,255,.28)' : 'rgba(255,214,90,.28)');
      light.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-74, -430);
      ctx.lineTo(74, -430);
      ctx.lineTo(18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(images.environment, 512, 682, 512, 342, x - 305, 128, 420, 281);
    ctx.drawImage(images.environment, 1024, 682, 512, 342, x + 40, 242, 330, 220);
    drawCalderaTrekkerVehicle(x + 150, time, { width: 262, groundY: GROUND_Y });
    drawAtlasCell(images.oliviaTrekker, 4, 2, 4, x - 105, GROUND_Y + 4, 150, 200);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffca55';
    ctx.shadowBlur = 14 + pulse * 10;
    ctx.font = '900 17px Arial';
    ctx.strokeStyle = '#30163f';
    ctx.lineWidth = 6;
    ctx.strokeText('RAINBOW LAVA', x, 105);
    ctx.fillStyle = '#fff2ae';
    ctx.fillText('RAINBOW LAVA', x, 105);
    ctx.font = '900 38px Arial';
    ctx.lineWidth = 9;
    ctx.strokeText('LUAU!', x, 145);
    ctx.fillStyle = '#ff70b2';
    ctx.fillText('LUAU!', x, 145);
    ctx.font = '900 12px Arial';
    ctx.lineWidth = 5;
    ctx.strokeText('THE GROUND IS ONLY A LITTLE MOLTEN', x, 172);
    ctx.fillStyle = '#65e7ff';
    ctx.fillText('THE GROUND IS ONLY A LITTLE MOLTEN', x, 172);
    ctx.shadowBlur = 0;
    for (let sparkle = 0; sparkle < 18; sparkle += 1) {
      const angle = time * .0017 + sparkle * Math.PI * 2 / 18;
      drawStar(
        x + Math.cos(angle) * (250 + sparkle % 3 * 25),
        230 + Math.sin(angle * 1.6) * (100 + sparkle % 2 * 30),
        3 + sparkle % 3,
        sparkle % 2 ? '#ffd65a' : '#e8faff',
      );
    }
    ctx.restore();
  }

  function drawEnemy(enemy, time) {
    if (!enemy.alive || !visibleWorldX(enemy.x, enemy.w, 80)) return;
    const x = enemy.x - game.cameraX;
    const y = enemy.y;
    const bounce = Math.sin(enemy.clock * 5) * 2.5;
    const blink = Math.sin(enemy.clock * 1.7) > 0.965;
    const eyeTarget = clamp((player.x - enemy.x) / 260, -1, 1);
    heroCore.drawEnemyBehaviorSignals(ctx, enemy, x, { warningColor: '#ffe17f', chargeColor: '#ff718f', rollColor: '#63e7ff' });
    ctx.save(); ctx.translate(x + enemy.w / 2, y + enemy.h + 5); ctx.scale(enemy.dir, 1);
    ctx.fillStyle = 'rgba(9,31,49,.24)'; ctx.beginPath(); ctx.ellipse(0, 1, 23, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, -enemy.h / 2 - 5 + bounce);
    ctx.strokeStyle = '#33243d'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (enemy.type === 'crab') {
      const pinch = Math.sin(enemy.clock * 8) * 0.18;
      ctx.strokeStyle = '#b63d54'; ctx.lineWidth = 4;
      for (const leg of [-14, -7, 7, 14]) { const step = Math.sin(enemy.clock * 9 + leg) * 3; ctx.beginPath(); ctx.moveTo(leg, 10); ctx.lineTo(leg * 1.34, 17 + step); ctx.lineTo(leg * 1.56, 18); ctx.stroke(); }
      for (const side of [-1, 1]) {
        ctx.save(); ctx.translate(side * 19, -2); ctx.rotate(side * (0.16 + pinch));
        ctx.fillStyle = side < 0 ? '#ff7862' : '#f45a5f'; ctx.beginPath(); ctx.ellipse(side * 6, -3, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd08b'; ctx.beginPath(); ctx.moveTo(side * 6, -4); ctx.lineTo(side * 17, -10); ctx.lineTo(side * 14, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      const shell = ctx.createRadialGradient(-7, -7, 2, 0, 2, 22); shell.addColorStop(0, '#ffac76'); shell.addColorStop(0.45, '#f36d5e'); shell.addColorStop(1, '#a83d55');
      ctx.fillStyle = shell; ctx.beginPath(); ctx.ellipse(0, 5, 20, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,218,151,.36)'; ctx.beginPath(); ctx.ellipse(-7, 0, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#78344b'; ctx.lineWidth = 3; for (const stalk of [-7, 7]) { ctx.beginPath(); ctx.moveTo(stalk, -4); ctx.lineTo(stalk, -12); ctx.stroke(); }
      for (const eye of [-7, 7]) { ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(eye, -13, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#33243d'; ctx.lineWidth = 2; ctx.stroke(); if (!blink) { ctx.fillStyle = '#2b2534'; ctx.beginPath(); ctx.arc(eye + eyeTarget * 1.5, -12.5, 2.1, 0, Math.PI * 2); ctx.fill(); } }
      ctx.strokeStyle = '#5e2943'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 7, 6, 0.15, Math.PI - 0.15); ctx.stroke();
    } else if (enemy.type === 'coconut') {
      ctx.save(); ctx.rotate(enemy.clock * enemy.dir * 2.8);
      const nut = ctx.createRadialGradient(-7, -8, 2, 0, 2, 21); nut.addColorStop(0, '#d8a368'); nut.addColorStop(0.45, '#9a623e'); nut.addColorStop(1, '#53342f');
      ctx.fillStyle = nut; ctx.beginPath(); ctx.arc(0, 2, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,205,131,.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 10; i += 1) { const angle = i * Math.PI / 5; ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 9, Math.sin(angle) * 9 + 2); ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16 + 2); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#f4dfbd'; ctx.beginPath(); ctx.roundRect(-13, -8, 26, 18, 8); ctx.fill(); ctx.strokeStyle = '#4c2f31'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#2d2430'; if (blink) { ctx.fillRect(-8, -2, 5, 1.5); ctx.fillRect(3, -2, 5, 1.5); } else { ctx.beginPath(); ctx.arc(-5 + eyeTarget, -2, 2, 0, Math.PI * 2); ctx.arc(5 + eyeTarget, -2, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#8c3544'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, 6, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.fillStyle = '#42bd68'; ctx.beginPath(); ctx.moveTo(-6, -17); ctx.quadraticCurveTo(-1, -27, 2, -16); ctx.quadraticCurveTo(11, -25, 9, -13); ctx.fill(); ctx.strokeStyle = '#235f43'; ctx.stroke();
    } else if (enemy.type === 'seagull') {
      const flap = Math.sin(enemy.clock * 9);
      ctx.fillStyle = '#c9dce5'; ctx.beginPath(); ctx.moveTo(-12, 5); ctx.lineTo(-28, 15); ctx.lineTo(-22, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff8e9'; ctx.beginPath(); ctx.ellipse(1, 5, 18, 12, -0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(-0.12 - flap * 0.18); ctx.fillStyle = '#e8f1f2'; ctx.beginPath(); ctx.moveTo(-5, 1); ctx.quadraticCurveTo(-25, -17 - flap * 7, -35, -1); ctx.quadraticCurveTo(-24, -6, -5, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#fff8e9'; ctx.beginPath(); ctx.arc(13, -3, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffb84f'; ctx.beginPath(); ctx.moveTo(21, -4); ctx.lineTo(35, 1); ctx.lineTo(21, 5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#9a4c37'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#f49a4b'; ctx.lineWidth = 2; for (const foot of [-3, 7]) { ctx.beginPath(); ctx.moveTo(foot, 14); ctx.lineTo(foot + 1, 19); ctx.lineTo(foot + 6, 20); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(14, -5, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#33243d'; ctx.stroke();
      if (!blink) { ctx.fillStyle = '#2c2635'; ctx.beginPath(); ctx.arc(15 + eyeTarget, -5, 1.8, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ff718f'; ctx.beginPath(); ctx.moveTo(4, -11); ctx.lineTo(21, -12); ctx.lineTo(13, -7); ctx.closePath(); ctx.fill();
    } else if (enemy.type === 'puffer') {
      const puff = 1 + Math.sin(enemy.clock * 2.5) * 0.08; ctx.scale(puff, puff);
      ctx.fillStyle = '#a4fff0'; for (let i = 0; i < 12; i += 1) { const angle = i * Math.PI * 2 / 12; ctx.save(); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(27, -4); ctx.lineTo(27, 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#247694'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      const fish = ctx.createRadialGradient(-7, -8, 2, 0, 2, 22); fish.addColorStop(0, '#d9fff5'); fish.addColorStop(0.42, '#63e7ff'); fish.addColorStop(1, '#277da6');
      ctx.fillStyle = fish; ctx.beginPath(); ctx.arc(0, 2, 19, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#244c73'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#35b6b1'; for (let i = 0; i < 7; i += 1) { const angle = i * 0.8; ctx.beginPath(); ctx.arc(Math.cos(angle) * 10, 3 + Math.sin(angle) * 9, 2.2, 0, Math.PI * 2); ctx.fill(); }
      for (const eye of [-6, 6]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(eye, -4, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#244c73'; ctx.lineWidth = 2; ctx.stroke(); if (!blink) { ctx.fillStyle = '#25263a'; ctx.beginPath(); ctx.arc(eye + eyeTarget, -3, 2, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = '#ff8fa3'; ctx.beginPath(); ctx.ellipse(0, 8, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#63e7ff'; ctx.globalAlpha = 0.5 + Math.sin(time * 0.006 + enemy.clock) * 0.25;
      ctx.beginPath(); ctx.arc(23, -14, 3, 0, Math.PI * 2); ctx.arc(30, -23, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    } else if (enemy.type === 'ash') {
      const drift = Math.sin(enemy.clock * 3.2) * 2;
      ctx.save(); ctx.rotate(enemy.rolling ? enemy.rollAngle : drift * .018);
      ctx.shadowColor = enemy.telegraph ? '#ff704d' : '#9fe8ff'; ctx.shadowBlur = enemy.telegraph ? 18 : 8;
      const ash = ctx.createLinearGradient(-20, -24, 18, 22); ash.addColorStop(0, '#edf5f4'); ash.addColorStop(.42, '#9daeb9'); ash.addColorStop(1, '#4f5c72');
      ctx.fillStyle = ash; ctx.beginPath(); ctx.moveTo(-22, 14); ctx.quadraticCurveTo(-27, -14, -9, -23); ctx.quadraticCurveTo(4, -31, 20, -18); ctx.lineTo(23, 14); ctx.quadraticCurveTo(0, 28, -22, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#ff704d'; ctx.lineWidth = 3;
      for (const crack of [-10, 2, 13]) { ctx.beginPath(); ctx.moveTo(crack, -14); ctx.lineTo(crack - 4, -2); ctx.lineTo(crack + 2, 6); ctx.lineTo(crack - 1, 16); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-8, -5, 6, 0, Math.PI * 2); ctx.arc(9, -5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#30283d'; ctx.beginPath(); ctx.arc(-7 + eyeTarget, -4, 2.2, 0, Math.PI * 2); ctx.arc(10 + eyeTarget, -4, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#30283d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1, 9, 8, .1, Math.PI - .1); ctx.stroke();
      ctx.restore();
    } else {
      const shimmy = Math.sin(enemy.clock * 6) * 2;
      ctx.strokeStyle = '#5d2d47'; ctx.lineWidth = 4; for (const arm of [-1, 1]) { ctx.beginPath(); ctx.moveTo(arm * 17, 2); ctx.lineTo(arm * (25 + shimmy), -4); ctx.stroke(); }
      const tiki = ctx.createLinearGradient(-18, -20, 18, 20); tiki.addColorStop(0, '#ff9a5c'); tiki.addColorStop(0.48, '#d45a4c'); tiki.addColorStop(1, '#77334b');
      roundedPanel(-18, -20, 36, 40, 6, tiki, '#44243e', 3);
      ctx.fillStyle = '#ffe17f'; ctx.beginPath(); ctx.roundRect(-13, -14, 26, 9, 4); ctx.fill();
      ctx.fillStyle = '#55e6a5'; ctx.beginPath(); ctx.roundRect(-13, 3, 26, 9, 4); ctx.fill();
      ctx.fillStyle = '#38243d'; ctx.beginPath(); ctx.moveTo(-11, -10); ctx.lineTo(-3, -6); ctx.lineTo(-11, -4); ctx.closePath(); ctx.moveTo(11, -10); ctx.lineTo(3, -6); ctx.lineTo(11, -4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(-7, -7, 3.5, 0, Math.PI * 2); ctx.arc(7, -7, 3.5, 0, Math.PI * 2); ctx.fill();
      if (!blink) { ctx.fillStyle = '#30223a'; ctx.beginPath(); ctx.arc(-6 + eyeTarget, -7, 1.5, 0, Math.PI * 2); ctx.arc(8 + eyeTarget, -7, 1.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#39253b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-3, 5); ctx.lineTo(2, 9); ctx.lineTo(8, 5); ctx.stroke();
      ctx.fillStyle = '#55e6a5'; for (const leaf of [-12, 0, 12]) { ctx.beginPath(); ctx.ellipse(leaf, -23, 9, 4, leaf * 0.03, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }

  function drawOlivia(x, y, scale = 1, time = performance.now()) {
    const wave = Math.sin(time * 0.008) * 0.35;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(6,30,48,.24)'; ctx.beginPath(); ctx.ellipse(0, 25, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#34263f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-6, 9); ctx.lineTo(-7, 22); ctx.moveTo(6, 9); ctx.lineTo(8, 22); ctx.stroke();
    ctx.fillStyle = '#fff4d0'; ctx.beginPath(); ctx.ellipse(-8, 23, 7, 3.5, -0.12, 0, Math.PI * 2); ctx.ellipse(10, 23, 7, 3.5, 0.12, 0, Math.PI * 2); ctx.fill();
    const shirt = ctx.createLinearGradient(-14, -12, 14, 12); shirt.addColorStop(0, '#ff5d9e'); shirt.addColorStop(0.55, '#ff8e82'); shirt.addColorStop(1, '#54c9ff');
    ctx.fillStyle = shirt; ctx.beginPath(); ctx.roundRect(-13, -10, 26, 23, 9); ctx.fill(); ctx.strokeStyle = '#5a3150'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffe17f'; for (const [fx, fy] of [[-7, -4], [5, 1], [-1, 7]]) drawStar(fx, fy, 2.5, '#ffe17f');
    ctx.strokeStyle = '#f2b07e'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-11, -4); ctx.lineTo(-18, 8); ctx.stroke();
    ctx.save(); ctx.translate(11, -5); ctx.rotate(-0.9 + wave); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -17); ctx.stroke(); ctx.fillStyle = '#f2b07e'; ctx.beginPath(); ctx.arc(0, -20, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#f2b07e'; ctx.strokeStyle = '#60344a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -24, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a342f'; ctx.beginPath(); ctx.arc(0, -27, 13, Math.PI, Math.PI * 2); ctx.lineTo(12, -23); ctx.quadraticCurveTo(4, -37, -12, -22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5d9e'; ctx.beginPath(); ctx.moveTo(-11, -31); ctx.quadraticCurveTo(-4, -42, 0, -31); ctx.lineTo(-1, -22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#54c9ff'; ctx.beginPath(); ctx.moveTo(0, -31); ctx.quadraticCurveTo(8, -42, 12, -30); ctx.lineTo(2, -22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-4.5, -25, 3, 3.5, 0, 0, Math.PI * 2); ctx.ellipse(4.5, -25, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f2440'; ctx.beginPath(); ctx.arc(-4, -24.5, 1.4, 0, Math.PI * 2); ctx.arc(5, -24.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7b3151'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, -20, 5, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-3, -19, 6, 2, 1); ctx.fill();
    ctx.restore();
  }

  function drawCheckpoint(checkpoint, time) {
    if (!visibleWorldX(checkpoint.x, checkpoint.w, 260)) return;
    const x = checkpoint.x - game.cameraX;
    const y = checkpoint.y;
    const pulse = (Math.sin(time * 0.008 + checkpoint.x) + 1) * 0.5;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalAlpha = checkpoint.activated ? 1 : 0.88;
    ctx.fillStyle = 'rgba(7,31,48,.3)'; ctx.beginPath(); ctx.ellipse(x + 96, y + 132, 92, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = checkpoint.accent; ctx.shadowBlur = checkpoint.activated ? 22 + pulse * 8 : 7;
    if (images.islandCheckpoints) {
      const checkpointFrames = { shell: 0, canopy: 1, lighthouse: 2, lava: 3, moon: 4 };
      const frame = checkpointFrames[checkpoint.look] ?? 0;
      const cellW = images.islandCheckpoints.width / 3;
      const cellH = images.islandCheckpoints.height / 2;
      const sourceX = (frame % 3) * cellW;
      const sourceY = Math.floor(frame / 3) * cellH;
      const floating = ['lighthouse', 'lava', 'moon'].includes(checkpoint.look);
      const vehicleBob = floating ? Math.sin(time * .006 + frame) * 2.5 : 0;
      const activatedScale = checkpoint.activated ? 1 + Math.sin(time * .011) * .014 : 1;
      const artShiftY = 24;
      ctx.save(); ctx.translate(x + 94, y + 132 + artShiftY + vehicleBob); ctx.scale(activatedScale, activatedScale);
      ctx.drawImage(images.islandCheckpoints, sourceX, sourceY, cellW, cellH, -108, -210, 216, 216);
      ctx.restore();
      ctx.shadowBlur = 0;

      if (floating) {
        ctx.strokeStyle = checkpoint.look === 'lava' ? 'rgba(255,118,88,.65)' : 'rgba(183,255,241,.72)';
        ctx.lineWidth = 3;
        for (let wake = 0; wake < 3; wake += 1) {
          ctx.globalAlpha = .72 - wake * .18; ctx.beginPath();
          ctx.ellipse(x + 95, y + 132 + wake * 4, 72 + wake * 13 + pulse * 5, 5 + wake * 2, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = checkpoint.activated ? 1 : .88;
      }
      if (checkpoint.look === 'shell') {
        ctx.strokeStyle = '#ffe17f'; ctx.lineWidth = 4; ctx.globalAlpha = .28 + pulse * .38;
        for (let ray = 0; ray < 7; ray += 1) {
          const angle = Math.PI + ray * Math.PI / 6;
          ctx.beginPath(); ctx.moveTo(x + 94 + Math.cos(angle) * 58, y + 78 + Math.sin(angle) * 40); ctx.lineTo(x + 94 + Math.cos(angle) * 78, y + 78 + Math.sin(angle) * 57); ctx.stroke();
        }
        ctx.globalAlpha = checkpoint.activated ? 1 : .88;
      } else if (checkpoint.look === 'canopy') {
        ctx.fillStyle = '#ff8fb1';
        for (let petal = 0; petal < 5; petal += 1) {
          const px = x + 32 + petal * 31 + Math.sin(time * .002 + petal) * 8;
          const py = y + 56 + ((time * .018 + petal * 23) % 82);
          ctx.save(); ctx.translate(px, py); ctx.rotate(time * .002 + petal); ctx.fillRect(-3, -1, 6, 3); ctx.restore();
        }
      } else if (checkpoint.look === 'lighthouse') {
        ctx.globalAlpha = .18 + pulse * .26; ctx.fillStyle = checkpoint.accent;
        const sweep = Math.sin(time * .004) * 52;
        ctx.beginPath(); ctx.moveTo(x + 95, y + 37); ctx.lineTo(x - 45 + sweep, y + 8); ctx.lineTo(x - 37 + sweep, y + 54); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = checkpoint.activated ? 1 : .88;
      } else if (checkpoint.look === 'lava') {
        for (let streak = 0; streak < 4; streak += 1) {
          const trailLength = 22 + streak * 9 + pulse * 14;
          ctx.strokeStyle = streak % 2 ? '#ffe17f' : '#ff7658'; ctx.globalAlpha = .72 - streak * .12;
          ctx.lineWidth = 5 - streak * .7; ctx.beginPath();
          ctx.moveTo(x + 15, y + 113 + streak * 8); ctx.lineTo(x + 15 - trailLength, y + 113 + streak * 8 + Math.sin(time * .012 + streak) * 5); ctx.stroke();
        }
        ctx.globalAlpha = checkpoint.activated ? 1 : .88;
      } else if (checkpoint.look === 'moon') {
        for (let light = 0; light < 8; light += 1) {
          const angle = time * .003 + light * Math.PI / 4;
          const px = x + 94 + Math.cos(angle) * (58 + pulse * 5);
          const py = y + 89 + Math.sin(angle) * 28;
          ctx.fillStyle = ['#63e7ff', '#c69cff', '#ffe17f', '#ff718f'][light % 4]; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 9;
          ctx.beginPath(); ctx.arc(px, py, 3 + pulse, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
    } else if (checkpoint.look === 'shell') {
      const base = ctx.createLinearGradient(x, y + 52, x + 188, y + 122); base.addColorStop(0, '#ff567f'); base.addColorStop(0.55, '#ff8f76'); base.addColorStop(1, '#c93f75');
      roundedPanel(x + 12, y + 54, 164, 72, 24, base, '#72304f', 4);
      const shell = ctx.createRadialGradient(x + 76, y + 20, 4, x + 96, y + 48, 60); shell.addColorStop(0, '#fff7b5'); shell.addColorStop(0.45, '#ffd95e'); shell.addColorStop(1, '#f38b6c');
      ctx.fillStyle = shell; ctx.beginPath(); ctx.arc(x + 96, y + 53, 58, Math.PI, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#9b4e59'; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = '#fff8d3'; ctx.lineWidth = 4; for (let i = -42; i <= 42; i += 16) { ctx.beginPath(); ctx.moveTo(x + 96 + i, y + 54); ctx.lineTo(x + 96 + i * 0.38, y + 3); ctx.stroke(); }
      ctx.fillStyle = '#63e7ff'; ctx.beginPath(); ctx.roundRect(x + 20, y + 99, 148, 9, 5); ctx.fill();
      ctx.fillStyle = '#ffe17f'; ctx.beginPath(); ctx.ellipse(x + 35, y + 126, 18, 8, 0, 0, Math.PI * 2); ctx.ellipse(x + 155, y + 126, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (checkpoint.look === 'canopy') {
      const hut = ctx.createLinearGradient(0, y + 55, 0, y + 128); hut.addColorStop(0, '#c98b50'); hut.addColorStop(1, '#6e4134');
      roundedPanel(x + 8, y + 64, 172, 64, 10, hut, '#4b3432', 4);
      ctx.strokeStyle = '#ffe5a0'; ctx.lineWidth = 4; for (let px = 26; px < 174; px += 25) { ctx.beginPath(); ctx.moveTo(x + px, y + 68); ctx.lineTo(x + px + 2, y + 124); ctx.stroke(); }
      const canopy = ctx.createLinearGradient(x, y + 4, x + 188, y + 64); canopy.addColorStop(0, '#87ed78'); canopy.addColorStop(0.5, '#35b66f'); canopy.addColorStop(1, '#16805f');
      ctx.fillStyle = canopy; ctx.beginPath(); ctx.moveTo(x - 2, y + 58); ctx.quadraticCurveTo(x + 27, y + 5, x + 60, y + 37); ctx.quadraticCurveTo(x + 92, y - 6, x + 123, y + 37); ctx.quadraticCurveTo(x + 163, y + 5, x + 190, y + 58); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#24684d'; ctx.stroke();
      ctx.fillStyle = '#ff8fb1'; for (let px = 25; px < 180; px += 38) { ctx.beginPath(); ctx.arc(x + px, y + 52 + Math.sin(px) * 3, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#55e6c1'; ctx.beginPath(); ctx.roundRect(x + 17, y + 119, 154, 9, 4); ctx.fill();
    } else if (checkpoint.look === 'lighthouse') {
      ctx.fillStyle = '#4c807e'; ctx.beginPath(); ctx.ellipse(x + 94, y + 128, 78, 13, 0, 0, Math.PI * 2); ctx.fill();
      const tower = ctx.createLinearGradient(x + 55, y, x + 140, y + 120); tower.addColorStop(0, '#fff8dd'); tower.addColorStop(0.55, '#e1efcf'); tower.addColorStop(1, '#9bc7ae');
      ctx.fillStyle = tower; ctx.beginPath(); ctx.moveTo(x + 55, y + 120); ctx.lineTo(x + 70, y + 25); ctx.lineTo(x + 120, y + 25); ctx.lineTo(x + 137, y + 120); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#315d67'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#ff718f'; for (let py = 43; py < 105; py += 27) { ctx.beginPath(); ctx.roundRect(x + 65, y + py, 63, 12, 4); ctx.fill(); }
      ctx.fillStyle = '#243c5c'; ctx.beginPath(); ctx.roundRect(x + 84, y + 83, 23, 37, 10, 10); ctx.fill();
      ctx.fillStyle = checkpoint.accent; ctx.shadowColor = checkpoint.accent; ctx.shadowBlur = 20 + pulse * 12; ctx.beginPath(); ctx.arc(x + 95, y + 20, 15 + pulse * 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.24 + pulse * 0.2; ctx.fillStyle = checkpoint.accent; ctx.beginPath(); ctx.moveTo(x + 95, y + 20); ctx.lineTo(x - 25, y - 3); ctx.lineTo(x - 25, y + 38); ctx.closePath(); ctx.fill(); ctx.globalAlpha = checkpoint.activated ? 1 : 0.88;
    } else if (checkpoint.look === 'lava') {
      const skiff = ctx.createLinearGradient(x, y + 66, x + 188, y + 126); skiff.addColorStop(0, '#251b31'); skiff.addColorStop(0.55, '#51304e'); skiff.addColorStop(1, '#171727');
      ctx.fillStyle = skiff; ctx.beginPath(); ctx.moveTo(x + 5, y + 83); ctx.quadraticCurveTo(x + 82, y + 65, x + 183, y + 74); ctx.lineTo(x + 157, y + 125); ctx.lineTo(x + 31, y + 125); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ff7658'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#ff7658'; ctx.beginPath(); ctx.roundRect(x + 38, y + 59, 108, 18, 8); ctx.fill();
      ctx.fillStyle = '#ffe17f'; for (let px = 50; px < 139; px += 18) drawStar(x + px, y + 68, 4, '#ffe17f');
      ctx.fillStyle = '#63e7ff'; ctx.beginPath(); ctx.roundRect(x + 15, y + 119, 158, 8, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,118,88,.5)'; for (const px of [30, 158]) { ctx.beginPath(); ctx.moveTo(x + px, y + 126); ctx.lineTo(x + px - 7, y + 138 + pulse * 6); ctx.lineTo(x + px + 7, y + 126); ctx.fill(); }
    } else {
      const barge = ctx.createLinearGradient(x, y + 65, x + 188, y + 128); barge.addColorStop(0, '#31327f'); barge.addColorStop(0.55, '#6950a6'); barge.addColorStop(1, '#225e8e');
      roundedPanel(x + 5, y + 70, 178, 58, 12, barge, '#b7fff1', 3);
      ctx.fillStyle = '#63e7ff'; ctx.beginPath(); ctx.roundRect(x + 8, y + 116, 172, 10, 5); ctx.fill();
      ctx.fillStyle = '#c69cff'; for (let px = 18; px < 178; px += 22) { ctx.shadowColor = px % 2 ? '#c69cff' : '#ffe17f'; ctx.shadowBlur = 9; ctx.beginPath(); ctx.arc(x + px, y + 69, 4 + Math.sin(time * 0.008 + px) * 1.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.shadowBlur = 0; ctx.fillStyle = '#ff718f'; ctx.beginPath(); ctx.roundRect(x + 39, y + 50, 112, 24, 9); ctx.fill();
      ctx.fillStyle = '#ffe17f'; ctx.font = '900 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('PARTY BARGE', x + 95, y + 66);
    }
    if (images.islandOlivia) {
      const oliviaFrames = { shell: 0, canopy: 1, lighthouse: 2, lava: 3, moon: 4 };
      const frame = oliviaFrames[checkpoint.look] ?? 0;
      const cellW = images.islandOlivia.width / 3;
      const cellH = images.islandOlivia.height / 2;
      const sourceX = (frame % 3) * cellW;
      const sourceY = Math.floor(frame / 3) * cellH;
      const oliviaX = x + 140;
      const oliviaBaseline = y + 134;
      const cheerFlex = 1 + Math.sin(time * .0065 + frame * .9) * .012;
      const sourceHeight = frame === 1 ? 460 : cellH;
      const drawHeight = frame === 1 ? 115 : 128;
      const drawTop = frame === 1 ? -110 : -118;
      ctx.save(); ctx.translate(oliviaX, oliviaBaseline); ctx.scale(1, cheerFlex);
      ctx.globalAlpha = .28; ctx.fillStyle = '#09243a'; ctx.beginPath(); ctx.ellipse(0, -1, 25, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = checkpoint.activated ? 1 : .94;
      ctx.shadowColor = checkpoint.accent; ctx.shadowBlur = checkpoint.activated ? 20 : 9;
      // Every generated pose shares a 38px source foot inset, mapped to
      // roughly 10px at game scale so Olivia stands firmly on the checkpoint.
      ctx.drawImage(images.islandOlivia, sourceX, sourceY, cellW, sourceHeight, -64, drawTop, 128, drawHeight);
      ctx.restore();
    } else {
      drawOlivia(x + 132, y + 111, 0.92, time);
    }
    ctx.shadowBlur = 0;
    const signY = y - 70;
    roundedPanel(x - 25, signY, 240, 48, 14, 'rgba(5,31,52,.94)', checkpoint.accent, 3);
    ctx.fillStyle = '#fff8dc'; ctx.textAlign = 'center'; ctx.font = '900 10px Arial'; ctx.fillText(checkpoint.sign, x + 95, signY + 21, 222);
    ctx.fillStyle = checkpoint.accent; ctx.font = '900 9px Arial'; ctx.fillText(checkpoint.name.toUpperCase(), x + 95, signY + 35);
    ctx.fillStyle = checkpoint.accent; ctx.beginPath(); ctx.moveTo(x + 128, signY + 48); ctx.lineTo(x + 138, signY + 61); ctx.lineTo(x + 145, signY + 47); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawCatamaran(time) {
    const boat = game.boat;
    if (boat.state === 'idle' || boat.state === 'done' || !visibleWorldX(boat.x, 300, 420)) return;
    const x = boat.x - game.cameraX;
    const bob = Math.sin(time * 0.006) * 4;
    const speedStretch = boat.state === 'escaping' ? 1.25 : 1;
    const y = game.tideY - 151 + bob;
    if (images.islandCatamaran) {
      const frame = boat.state === 'entering' ? 0 : boat.state === 'escaping' ? 2 : 1;
      const cellW = images.islandCatamaran.width / 3;
      const cellH = images.islandCatamaran.height / 2;
      const sourceX = (frame % 3) * cellW;
      const sourceY = Math.floor(frame / 3) * cellH;
      const drawW = boat.state === 'escaping' ? 430 : 390;
      const drawH = drawW * (cellH / cellW);
      ctx.save();
      ctx.globalAlpha = .25;
      ctx.fillStyle = '#062b46';
      ctx.beginPath();
      ctx.ellipse(x + drawW * .42, game.tideY + 3, drawW * .42, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = boat.state === 'escaping' ? '#ffe17f' : '#63e7ff';
      ctx.shadowBlur = boat.state === 'escaping' ? 20 : 12;
      ctx.drawImage(images.islandCatamaran, sourceX, sourceY, cellW, cellH, x - 55, game.tideY - drawH + 35 + bob, drawW, drawH);
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(speedStretch, 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let wake = 0; wake < 5; wake += 1) {
      ctx.strokeStyle = `rgba(220,255,247,${0.56 - wake * 0.09})`; ctx.lineWidth = 4 - wake * 0.5;
      ctx.beginPath(); ctx.moveTo(-18 - wake * 18, 129 + wake * 3); ctx.quadraticCurveTo(-62 - wake * 25, 117 + Math.sin(time * 0.01 + wake) * 5, -112 - wake * 30, 131); ctx.stroke();
    }
    ctx.shadowColor = '#63e7ff'; ctx.shadowBlur = 18;
    const deck = ctx.createLinearGradient(0, 86, 0, 132); deck.addColorStop(0, '#fff0a1'); deck.addColorStop(0.5, '#f6c05f'); deck.addColorStop(1, '#c87543');
    ctx.fillStyle = deck; ctx.beginPath(); ctx.moveTo(-8, 94); ctx.quadraticCurveTo(112, 84, 244, 96); ctx.lineTo(211, 129); ctx.lineTo(25, 129); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#6f3b4d'; ctx.lineWidth = 4; ctx.stroke();
    const leftHull = ctx.createLinearGradient(18, 102, 88, 144); leftHull.addColorStop(0, '#ff8f77'); leftHull.addColorStop(1, '#c73772');
    ctx.fillStyle = leftHull; ctx.beginPath(); ctx.moveTo(16, 101); ctx.lineTo(91, 102); ctx.lineTo(74, 143); ctx.lineTo(31, 143); ctx.closePath(); ctx.fill(); ctx.stroke();
    const rightHull = ctx.createLinearGradient(148, 102, 232, 144); rightHull.addColorStop(0, '#63e7ff'); rightHull.addColorStop(1, '#197ba8');
    ctx.fillStyle = rightHull; ctx.beginPath(); ctx.moveTo(148, 102); ctx.lineTo(232, 103); ctx.lineTo(211, 143); ctx.lineTo(163, 143); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff8dc'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(116, 97); ctx.lineTo(116, 0); ctx.stroke();
    ctx.fillStyle = '#ffe17f'; ctx.beginPath(); ctx.moveTo(121, 7); ctx.lineTo(121, 86); ctx.lineTo(206, 76); ctx.quadraticCurveTo(171, 24, 121, 7); ctx.fill(); ctx.strokeStyle = '#8e4d54'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ff718f'; ctx.beginPath(); ctx.moveTo(129, 22); ctx.quadraticCurveTo(160, 9, 195, 35); ctx.quadraticCurveTo(161, 26, 129, 47); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7fdc62'; ctx.beginPath(); ctx.roundRect(134, 44, 57, 9, 4); ctx.fill();
    ctx.save(); ctx.translate(164, 58); ctx.rotate(-0.08); ctx.fillStyle = '#fff7c8'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8e4d54'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#f3a33e'; ctx.beginPath(); ctx.arc(0, 4, 13, Math.PI, Math.PI * 2); ctx.lineTo(13, 9); ctx.lineTo(-13, 9); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.shadowBlur = 0;
    drawOlivia(76, 79, 1.05, time);
    ctx.fillStyle = '#082a43'; ctx.beginPath(); ctx.roundRect(13, 45, 91, 26, 9); ctx.fill(); ctx.strokeStyle = '#63e7ff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff8dc'; ctx.font = '900 10px Arial'; ctx.textAlign = 'center'; ctx.fillText(boat.state === 'escaping' ? 'SEA YA!' : 'TACO TIDE!', 58, 62);
    ctx.fillStyle = '#ff718f'; ctx.beginPath(); ctx.roundRect(76, 88, 34, 18, 5); ctx.fill(); ctx.fillStyle = '#ffe17f'; ctx.font = '900 8px Arial'; ctx.fillText('TACOS', 93, 100);
    if (boat.state === 'escaping') {
      ctx.fillStyle = '#ffe17f'; ctx.shadowColor = '#ff795c'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(235, 116); ctx.lineTo(265 + Math.sin(time * 0.02) * 8, 107); ctx.lineTo(252, 122); ctx.lineTo(270, 131); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawSurfCell(frame, x, y, width, height, alpha = 1) {
    if (!images.islandSurf) return false;
    const cellW = images.islandSurf.width / 3;
    const cellH = images.islandSurf.height / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      images.islandSurf,
      (frame % 3) * cellW, Math.floor(frame / 3) * cellH, cellW, cellH,
      x, y, width, height,
    );
    ctx.restore();
    return true;
  }

  function drawWaveCell(frame, x, y, width, height, alpha = 1) {
    if (!images.islandWave) return false;
    const cellW = images.islandWave.width / 3;
    const cellH = images.islandWave.height / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      images.islandWave,
      (frame % 3) * cellW, Math.floor(frame / 3) * cellH, cellW, cellH,
      x, y, width, height,
    );
    ctx.restore();
    return true;
  }

  function drawSurfObstacles(time) {
    for (const obstacle of world.surfObstacles) {
      if (!visibleWorldX(obstacle.x, obstacle.w, 100)) continue;
      const x = obstacle.x - game.cameraX;
      const y = obstacle.y;
      const pulse = 1 + Math.sin(time * .009 + obstacle.x) * .025;
      ctx.save();
      ctx.translate(x + obstacle.w / 2, y + obstacle.h);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(3,29,49,.25)';
      ctx.beginPath(); ctx.ellipse(0, 6, obstacle.w * .56, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 3;
      if (obstacle.type === 'driftwood') {
        const wood = ctx.createLinearGradient(-38, -32, 34, 0);
        wood.addColorStop(0, '#6e3d36'); wood.addColorStop(.45, '#c77a4e'); wood.addColorStop(1, '#59333b');
        ctx.strokeStyle = '#3b2940'; ctx.fillStyle = wood;
        ctx.beginPath(); ctx.roundRect(-39, -30, 78, 29, 13); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#f0b46b'; ctx.lineWidth = 3;
        for (let px = -24; px < 30; px += 18) { ctx.beginPath(); ctx.arc(px, -15, 8, -1.2, 1.2); ctx.stroke(); }
        ctx.strokeStyle = '#6e3d36'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(-25, -25); ctx.lineTo(-37, -43); ctx.moveTo(24, -25); ctx.lineTo(36, -40); ctx.stroke();
      } else if (obstacle.type === 'coral') {
        ctx.strokeStyle = '#73365b'; ctx.lineWidth = 8;
        const branches = [[-24,-4,-30,-47],[-11,-3,-8,-60],[4,-4,12,-48],[20,-3,31,-54]];
        for (const [x1,y1,x2,y2] of branches) { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo((x1+x2)/2-4,y2+18,x2,y2); ctx.stroke(); }
        ctx.strokeStyle = '#ff7993'; ctx.lineWidth = 5;
        for (const [x1,y1,x2,y2] of branches) { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo((x1+x2)/2-4,y2+18,x2,y2); ctx.stroke(); }
        ctx.fillStyle = '#ffe17f';
        for (const [sx,sy] of [[-30,-48],[-8,-61],[12,-49],[31,-55]]) drawStar(sx, sy, 4, '#ffe17f');
      } else if (obstacle.type === 'buoy') {
        ctx.strokeStyle = '#382c4d'; ctx.fillStyle = '#ff718f';
        ctx.beginPath(); ctx.ellipse(0, -22, 28, 27, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff3c6'; ctx.fillRect(-27, -27, 54, 12);
        ctx.fillStyle = '#63e7ff'; ctx.beginPath(); ctx.arc(0, -22, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffe17f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -64); ctx.stroke();
        drawStar(0, -70, 6, '#ffe17f');
      } else if (obstacle.type === 'tiki') {
        const tiki = ctx.createLinearGradient(-34, -68, 34, 0);
        tiki.addColorStop(0, '#f3a35c'); tiki.addColorStop(.5, '#b9504f'); tiki.addColorStop(1, '#65304b');
        roundedPanel(-34, -68, 68, 68, 12, tiki, '#3c2742', 4);
        ctx.fillStyle = '#63e7ff'; ctx.beginPath(); ctx.roundRect(-25, -53, 50, 13, 6); ctx.fill();
        ctx.fillStyle = '#ffe17f'; ctx.beginPath(); ctx.roundRect(-25, -25, 50, 12, 6); ctx.fill();
        ctx.fillStyle = '#31233c';
        ctx.beginPath(); ctx.moveTo(-21,-49); ctx.lineTo(-5,-43); ctx.lineTo(-21,-40); ctx.closePath();
        ctx.moveTo(21,-49); ctx.lineTo(5,-43); ctx.lineTo(21,-40); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#31233c'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-20,-18); ctx.lineTo(-8,-28); ctx.lineTo(6,-17); ctx.lineTo(20,-28); ctx.stroke();
        for (const lx of [-24,0,24]) { ctx.fillStyle = '#55e6a5'; ctx.beginPath(); ctx.ellipse(lx, -75, 18, 7, lx * .02, 0, Math.PI * 2); ctx.fill(); }
      } else {
        for (let i = 0; i < 3; i += 1) {
          const cx = (i - 1) * 24;
          const cy = i === 1 ? -43 : -24;
          const nut = ctx.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, 20);
          nut.addColorStop(0, '#ddb173'); nut.addColorStop(.48, '#94603f'); nut.addColorStop(1, '#4c3032');
          ctx.fillStyle = nut; ctx.strokeStyle = '#35283b';
          ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#332631'; ctx.beginPath(); ctx.arc(cx - 5, cy - 4, 2, 0, Math.PI * 2); ctx.arc(cx + 5, cy - 4, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (game.surf.phase === 'riding' && obstacle.x > player.x && obstacle.x - player.x < 620) {
        ctx.globalAlpha = .7 + Math.sin(time * .014) * .25;
        ctx.fillStyle = '#ffe17f'; ctx.beginPath(); ctx.moveTo(0, -92); ctx.lineTo(-10, -76); ctx.lineTo(10, -76); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawSurfIntro(time) {
    const surf = game.surf;
    if (surf.phase === 'olivia-intro') {
      const x = surf.oliviaX - game.cameraX;
      const y = game.tideY - 223 + Math.sin(time * .008) * 4;
      ctx.save();
      ctx.shadowColor = '#63e7ff'; ctx.shadowBlur = 18;
      drawSurfCell(0, x - 40, y, 285, 190);
      ctx.restore();
      roundedPanel(x + 72, y - 4, 178, 35, 13, 'rgba(5,31,52,.92)', '#ffe17f', 3);
      ctx.fillStyle = '#fff8dc'; ctx.font = '900 12px Arial'; ctx.textAlign = 'center';
      ctx.fillText('OLIVIA: WAVE DELIVERY!', x + 161, y + 18);
    } else if (surf.phase === 'ready' && visibleWorldX(surf.mountX, 190, 120)) {
      const x = surf.mountX - game.cameraX;
      const bob = Math.sin(time * .008) * 4;
      ctx.save(); ctx.shadowColor = '#ffe17f'; ctx.shadowBlur = 22 + bob;
      drawSurfCell(1, x - 82, GROUND_Y - 118 + bob, 190, 127);
      ctx.restore();
      ctx.fillStyle = '#ffe17f'; ctx.font = '900 14px Arial'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#082a43'; ctx.lineWidth = 5;
      ctx.strokeText('JUMP ON!', x + 10, GROUND_Y - 94 + bob);
      ctx.fillText('JUMP ON!', x + 10, GROUND_Y - 94 + bob);
    }
  }

  function drawWaveChase(time) {
    if (!game.wave.active && !game.wave.crashing) return;
    const x = game.wave.x - game.cameraX;
    if (x < -660 || x > canvas.width + 320) return;
    const crashing = game.wave.crashing;
    const crashElapsed = crashing ? 2.6 - game.wave.crashTimer : 0;
    const activeFrames = [0, 1, 2, 1];
    const frame = crashing ? (crashElapsed < 1.38 ? 3 : 4) : activeFrames[Math.floor(time / 145) % activeFrames.length];
    const pulse = crashing ? 1 + Math.min(.16, crashElapsed * .09) : 1 + Math.sin(time * .005) * .012;
    const crestX = x + 230;
    const crestY = crashing ? 208 : 218 + Math.sin(time * .006) * 5;
    const spriteW = crashing ? 620 : 566;
    const spriteH = crashing ? 620 : 566;
    const spriteX = crestX - spriteW * .82;
    const spriteY = crestY - spriteH * .39;

    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // A deep animated water wall fills behind the illustrated breaker so the
    // chase still reads as a physical hazard at every camera position.
    const wall = ctx.createLinearGradient(Math.min(-80, x - 360), 250, crestX + 96, 520);
    wall.addColorStop(0, 'rgba(5,43,105,.74)');
    wall.addColorStop(.48, 'rgba(12,103,163,.78)');
    wall.addColorStop(.82, 'rgba(29,181,201,.76)');
    wall.addColorStop(1, 'rgba(118,247,235,.34)');
    ctx.fillStyle = wall;
    ctx.beginPath();
    ctx.moveTo(Math.min(-100, x - 390), 540);
    ctx.lineTo(Math.min(-100, x - 390), 345 + Math.sin(time * .004) * 8);
    ctx.bezierCurveTo(x - 250, 282, x - 94, 326, crestX + 88, 475);
    ctx.lineTo(crestX + 138, 540);
    ctx.closePath();
    ctx.fill();

    // Moonlight ribbons travel across the wave face independently of the
    // sprite frames, adding movement without obscuring the hero or obstacles.
    for (let ribbon = 0; ribbon < 4; ribbon += 1) {
      const ribbonY = 350 + ribbon * 37;
      const ribbonOffset = ((time * (.055 + ribbon * .008)) % 110) - 55;
      ctx.strokeStyle = `rgba(190,255,247,${.28 - ribbon * .035})`;
      ctx.lineWidth = 6 - ribbon * .7;
      ctx.beginPath();
      for (let px = Math.min(-100, x - 390); px <= crestX + 92; px += 20) {
        const py = ribbonY + Math.sin((px + ribbonOffset) * .035 + ribbon) * (7 + ribbon);
        if (px === Math.min(-100, x - 390)) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Speed streaks make the moving wall feel fast while staying behind the
    // illustrated crest and the playable foreground.
    if (!crashing) {
      for (let streak = 0; streak < 10; streak += 1) {
        const travel = (time * (.18 + streak * .012) + streak * 91) % 360;
        const sx = crestX - 470 + travel;
        const sy = 250 + (streak % 6) * 39;
        ctx.strokeStyle = `rgba(218,255,249,${.12 + (streak % 3) * .07})`;
        ctx.lineWidth = 2 + streak % 3;
        ctx.beginPath(); ctx.moveTo(sx - 58, sy); ctx.lineTo(sx, sy - 4); ctx.stroke();
      }
    }

    ctx.save();
    ctx.translate(crestX, crestY);
    ctx.scale(pulse, pulse);
    ctx.translate(-crestX, -crestY);
    ctx.shadowColor = crashing ? '#d6fff8' : '#63e7ff';
    ctx.shadowBlur = crashing ? 32 : 18;
    drawWaveCell(frame, spriteX, spriteY, spriteW, spriteH);
    ctx.restore();

    // Animated spray lives above the sprite and changes cadence during the
    // beach crash, giving every frame sparkle and directional motion.
    const sprayCount = crashing ? 40 : 25;
    for (let drop = 0; drop < sprayCount; drop += 1) {
      const cycle = ((time * (.00055 + (drop % 4) * .00008) + drop * .127) % 1);
      const direction = drop % 2 ? 1 : -1;
      const sprayX = crestX + 35 + direction * cycle * (70 + (drop % 5) * 12);
      const sprayY = crestY - 126 - Math.sin(cycle * Math.PI) * (42 + (drop % 6) * 8) + cycle * 72;
      ctx.globalAlpha = .25 + (1 - cycle) * .7;
      ctx.fillStyle = drop % 5 === 0 ? '#c69cff' : '#f4fff7';
      ctx.beginPath();
      ctx.ellipse(sprayX, sprayY, 2 + drop % 4, 5 + drop % 5, direction * .5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (crashing) {
      const wash = clamp(crashElapsed / 1.25, 0, 1);
      ctx.globalAlpha = .72 * (1 - clamp((crashElapsed - 1.8) / .8, 0, 1));
      const washGradient = ctx.createLinearGradient(crestX - 120, 452, crestX + 520, 475);
      washGradient.addColorStop(0, 'rgba(99,231,255,.18)');
      washGradient.addColorStop(.5, 'rgba(239,255,248,.92)');
      washGradient.addColorStop(1, 'rgba(198,156,255,0)');
      ctx.fillStyle = washGradient;
      ctx.beginPath();
      ctx.ellipse(crestX + wash * 220, 486, 170 + wash * 250, 31 + wash * 12, -.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = clamp(game.wave.crashTimer / .8, 0, 1);
      ctx.fillStyle = '#fff8dc'; ctx.font = '900 38px Arial'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#174e7a'; ctx.lineWidth = 9;
      ctx.strokeText('KERSPLASH!', crestX + 62, 248);
      ctx.fillText('KERSPLASH!', crestX + 62, 248);
    }
    ctx.restore();
  }

  function drawCoconutCannons() {
    for (const cannon of world.cannons) {
      if (!visibleWorldX(cannon.x, 90, 120)) continue;
      const x = cannon.x - game.cameraX;
      const y = cannon.y;
      const aim = player.x < cannon.x ? -1 : 1;
      const bob = Math.sin(game.levelTime * 4 + cannon.x) * 2;
      ctx.save(); ctx.translate(x, y + bob); ctx.scale(aim, 1); ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(7,25,40,.28)'; ctx.beginPath(); ctx.ellipse(0, 15, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff718f'; ctx.strokeStyle = '#38283c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe17f'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6ecf68'; for (let leaf = 0; leaf < 4; leaf += 1) { ctx.save(); ctx.rotate(leaf * Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -23, 7, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.rotate(-0.31); const barrel = ctx.createLinearGradient(-8, -42, 58, -14); barrel.addColorStop(0, '#d5985e'); barrel.addColorStop(0.5, '#8d593b'); barrel.addColorStop(1, '#4f3432');
      roundedPanel(-9, -43, 67, 31, 10, barrel, '#38283c', 4); ctx.strokeStyle = '#e3b06c'; ctx.lineWidth = 2; for (let px = 5; px < 52; px += 13) { ctx.beginPath(); ctx.moveTo(px, -40); ctx.lineTo(px + 2, -16); ctx.stroke(); }
      ctx.fillStyle = '#2c2230'; ctx.beginPath(); ctx.ellipse(56, -27, 8, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6, -2, 4, 0, Math.PI * 2); ctx.arc(6, -2, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2d2430'; ctx.beginPath(); ctx.arc(-5, -1, 1.5, 0, Math.PI * 2); ctx.arc(7, -1, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7a3050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 6, 6, Math.PI + 0.1, Math.PI * 2 - 0.1); ctx.stroke();
      ctx.restore();
    }
    for (const ball of game.cannonballs) {
      if (!visibleWorldX(ball.x, ball.w, 80)) continue;
      const x = ball.x - game.cameraX + ball.w / 2;
      const y = ball.y + ball.h / 2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ball.rotation);
      ctx.shadowColor = '#ffcf83'; ctx.shadowBlur = 8; const nut = ctx.createRadialGradient(-5, -6, 2, 0, 0, 16); nut.addColorStop(0, '#d9aa6e'); nut.addColorStop(0.48, '#8e5a3d'); nut.addColorStop(1, '#4c302f');
      ctx.fillStyle = nut; ctx.strokeStyle = '#38283c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#30262d'; ctx.beginPath(); ctx.arc(-5, -4, 2, 0, Math.PI * 2); ctx.arc(4, -5, 2, 0, Math.PI * 2); ctx.arc(1, 4, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,221,152,.42)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 10, -1.4, 0.5); ctx.stroke();
      ctx.restore();
    }
  }

  function drawGoal(time) {
    const x = world.goal.x - game.cameraX;
    if (x < -500 || x > canvas.width + 500) return;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const pulse = (Math.sin(time * 0.009) + 1) * 0.5;
    ctx.globalAlpha = 0.1 + pulse * 0.12;
    for (let beam = 0; beam < 7; beam += 1) {
      ctx.save(); ctx.translate(x, 438); ctx.rotate(-1.12 + beam * 0.37 + Math.sin(time * 0.0012 + beam) * 0.09);
      const light = ctx.createLinearGradient(0, 0, 0, -420); light.addColorStop(0, beam % 2 ? '#63e7ff' : '#ffe17f'); light.addColorStop(1, 'rgba(255,225,127,0)');
      ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-68, -420); ctx.lineTo(68, -420); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (images.islandFiestaStage) ctx.drawImage(images.islandFiestaStage, x - 430, 38, 860, 430);

    ctx.textAlign = 'center'; ctx.shadowColor = '#ffdc63'; ctx.shadowBlur = 12 + pulse * 10;
    ctx.font = '900 17px Arial'; ctx.strokeStyle = '#32153e'; ctx.lineWidth = 5; ctx.strokeText('MOONLIGHT ISLAND', x, 124); ctx.fillStyle = '#fff4bd'; ctx.fillText('MOONLIGHT ISLAND', x, 124);
    ctx.font = '900 38px Arial'; ctx.lineWidth = 8; ctx.strokeText('FIESTA!', x, 164); ctx.fillStyle = '#ff75ac'; ctx.fillText('FIESTA!', x, 164);
    ctx.font = '900 11px Arial'; ctx.lineWidth = 4; ctx.strokeText('WAVE ESCAPED • TACOS SECURED', x, 188); ctx.fillStyle = '#84f3ff'; ctx.fillText('WAVE ESCAPED • TACOS SECURED', x, 188);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(5,27,48,.34)'; ctx.beginPath(); ctx.ellipse(x + 48, 454, 228, 16, 0, 0, Math.PI * 2); ctx.fill();
    if (images.islandFiestaTruck) ctx.drawImage(images.islandFiestaTruck, x - 125, 246, 330, 220);
    if (images.islandFiestaOlivia) {
      const oliviaBounce = game.state === 'celebrating' || game.state === 'won' ? Math.abs(Math.sin(time * 0.009)) * 5 : 0;
      ctx.drawImage(images.islandFiestaOlivia, x + 88, 264 - oliviaBounce, 130, 195);
    }

    for (let i = 0; i < 15; i += 1) {
      const angle = time * 0.0015 + i * Math.PI * 2 / 15;
      const sparkleX = x + Math.cos(angle) * (240 + (i % 3) * 32);
      const sparkleY = 234 + Math.sin(angle * 1.7) * (105 + (i % 2) * 30);
      drawStar(sparkleX, sparkleY, 3 + i % 3, i % 2 ? '#ffe17f' : '#d8f9ff');
    }
    ctx.restore();
  }

  function drawPlayer(time) {
    if (heroCore.hidePlayerDuringRespawn(game.respawn)) return;
    const frame = game.state === 'celebrating' || game.state === 'won' ? 7
      : player.invulnerable > 0 ? 6
      : !player.grounded ? (player.vy < 0 ? 4 : 5)
      : Math.abs(player.vx) > 24 ? 1 + (Math.floor(player.anim) % 3) : 0;
    const running = frame >= 1 && frame <= 3 && !game.surf.boardMounted;
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    const x = player.x - game.cameraX + player.w / 2;
    const y = player.y + player.h / 2;
    sharedAbilities.drawHeroEffects(ctx, game.abilities, player, game.cameraX, time, { reducedMotion: game.reducedShake });
    ctx.save(); ctx.globalAlpha = player.grounded ? 0.24 : 0.12; ctx.fillStyle = '#07243a'; ctx.beginPath(); ctx.ellipse(x, player.y + player.h + 7, player.grounded ? 26 : 18, player.grounded ? 6 : 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(player.rotation || 0); if (game.surf.boardMounted) ctx.scale(player.dir * (player.scale || 1), player.scale || 1); else sharedAbilities.applyHeroVisualTransform(ctx, game.abilities, { direction: player.dir, baseScale: player.scale || 1, anchorY: 33, time });
    if (game.surf.boardMounted) {
      const surfFrame = game.surf.phase === 'landing' ? 3 : !player.grounded ? 2 : 1;
      ctx.save();
      ctx.rotate(clamp(player.vy / 1700, -.24, .24));
      ctx.shadowColor = '#63e7ff'; ctx.shadowBlur = 14;
      drawSurfCell(surfFrame, -76, -22, 152, 101);
      ctx.restore();
    }
    if (game.activePower || sharedAbilities.isFrenzy(game.abilities)) {
      const powerColors = { lime: '#7cff68', pepper: '#ff674d', shell: '#ffe17f', coconut: '#c98b54' };
      const auraColor = sharedAbilities.isFrenzy(game.abilities) ? '#63e7ff' : powerColors[game.activePower];
      ctx.shadowColor = auraColor; ctx.shadowBlur = sharedAbilities.isFrenzy(game.abilities) ? 30 : 22;
      ctx.strokeStyle = auraColor; ctx.lineWidth = 3; ctx.globalAlpha *= 0.7;
      ctx.beginPath(); ctx.ellipse(0, 27, 28 + Math.sin(time * 0.012) * 3, 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    sharedAbilities.applyHeroStyle(ctx, game.abilities);
    sharedAbilities.drawHeroSpriteFrame(ctx, game.abilities, images.hero, frame, { x: -33, y: -33, width: 66, height: 66, running, animation: player.anim });
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const particle of game.particles) {
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      if (particle.shape === 'star') drawStar(particle.x, particle.y, particle.size, particle.color);
      else { ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill(); }
    }
    for (const particle of game.confetti) {
      ctx.globalAlpha = clamp(particle.life, 0, 1); ctx.fillStyle = particle.color;
      ctx.save(); ctx.translate(particle.x, particle.y); ctx.rotate(particle.angle); ctx.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.66); ctx.restore();
    }
    for (const particle of game.fireworks) {
      ctx.globalAlpha = clamp(particle.life, 0, 1); ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const text of game.impactTexts) {
      const x = text.x - game.cameraX;
      ctx.globalAlpha = clamp(text.life, 0, 1); ctx.textAlign = 'center'; ctx.font = `900 ${text.size || 27}px Arial`;
      ctx.strokeStyle = '#082a43'; ctx.lineWidth = 5; ctx.strokeText(text.text, x, text.y); ctx.fillStyle = text.color; ctx.fillText(text.text, x, text.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawProgress() {
    const x = 372, y = 22, width = 370;
    const panel = ctx.createLinearGradient(x, y, x + width, y + 69); panel.addColorStop(0, 'rgba(5,32,58,.4)'); panel.addColorStop(0.55, 'rgba(11,75,94,.32)'); panel.addColorStop(1, 'rgba(35,46,96,.38)');
    roundedPanel(x, y, width, 69, 20, panel, 'rgba(184,255,245,.42)', 2);
    ctx.fillStyle = 'rgba(255,255,255,.17)'; ctx.fillRect(x + 18, y + 16, width - 36, 8);
    ctx.fillStyle = sections[game.sectionIndex]?.accent || '#ffe17f'; ctx.fillRect(x + 18, y + 16, (width - 36) * clamp(player.x / WORLD_WIDTH, 0, 1), 8);
    sections.forEach((section, index) => {
      const dotX = x + 18 + (width - 36) * (section.start / WORLD_WIDTH);
      ctx.fillStyle = index <= game.sectionIndex ? section.accent : '#5f7185'; ctx.beginPath(); ctx.arc(dotX, y + 20, 7, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#fff8dc'; ctx.textAlign = 'center'; ctx.font = '900 12px Arial'; ctx.fillText(sections[game.sectionIndex]?.name || 'Campfire Caldera Caper', x + width / 2, y + 48);
    ctx.fillStyle = 'rgba(255,255,255,.68)'; ctx.font = '900 9px Arial'; ctx.fillText(`${Math.round(player.x).toLocaleString()} / ${WORLD_WIDTH.toLocaleString()}`, x + width / 2, y + 63);
  }

  function drawHUD(time) {
    ctx.save();
    const panel = ctx.createLinearGradient(14, 14, 342, 136); panel.addColorStop(0, 'rgba(4,31,52,.4)'); panel.addColorStop(0.6, 'rgba(7,71,86,.32)'); panel.addColorStop(1, 'rgba(34,43,88,.38)');
    roundedPanel(14, 14, 328, 126, 18, panel, 'rgba(85,230,193,.46)', 2);
    ctx.fillStyle = '#fff8dc'; ctx.font = '900 23px Arial'; ctx.fillText('Campfire Caldera Caper', 26, 42);
    ctx.font = '18px Arial'; ctx.fillText(`Score: ${game.score.toLocaleString()}`, 26, 70); ctx.fillText(`Tacos: ${game.collected}/${game.totalCollectibles}`, 26, 96);
    ctx.fillStyle = game.streak ? '#ffe17f' : 'rgba(255,255,255,.65)'; ctx.fillText(`Streak: ${game.streak}`, 208, 70);
    ctx.fillStyle = '#ffd85e'; ctx.font = '900 13px Arial'; ctx.fillText(`Golden ${game.goldenCollected}/${game.totalGolden}  •  Rainbows ${game.rainbowCollected}/${game.totalRainbow}`, 26, 120);
    sharedAbilities.drawTacoPowerHUD(ctx, game.abilities, { x: 120, y: 127, width: 214, height: 8, labelX: 26, labelY: 135, textColor: '#fff8dc', font: '900 9px Arial' });
    drawProgress();
    for (let i = 0; i < 3; i += 1) {
      const x = 920 - i * 33;
      ctx.fillStyle = i < game.hearts ? '#ff718f' : 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(x, 34, 9, 0, Math.PI * 2); ctx.arc(x - 8, 27, 7, 0, Math.PI * 2); ctx.arc(x + 8, 27, 7, 0, Math.PI * 2); ctx.lineTo(x, 49); ctx.fill();
    }
    ctx.textAlign = 'right'; ctx.font = '900 14px Arial';
    if (sharedAbilities.isFrenzy(game.abilities)) { ctx.fillStyle = '#63e7ff'; ctx.fillText(`TACO FRENZY ${Math.ceil(game.abilities.frenzyTimer)}s`, 936, 56); }
    if (game.activePower) {
      const labels = { lime: game.limeShield ? '🍋 LIME SHIELD' : '', pepper: `🌶 PEPPER DASH ${Math.ceil(game.pepperTimer)}s`, shell: `🐚 SHELL MAGNET ${Math.ceil(game.abilities.magnetTimer)}s`, coconut: `🥥 COCONUT LAUNCH ${game.coconutLaunchTimer.toFixed(1)}s` };
      ctx.fillStyle = { lime: '#7cff68', pepper: '#ff8b70', shell: '#ffe17f', coconut: '#f0bd7b' }[game.activePower]; ctx.fillText(labels[game.activePower], 936, 76);
    }
    if (game.splatCombo > 1) { ctx.fillStyle = '#ff718f'; ctx.fillText(`CALDERA SPLAT ×${game.splatCombo}`, 936, 100); }
    if (['geyser-drop', 'lava-chase'].includes(game.boat.state)) {
      ctx.fillStyle = '#63e7ff';
      ctx.fillText(`TACO TREKKER CATCHES ${game.boat.catches}`, 936, 124);
    }

    if (game.messageTimer > 0 && game.state !== 'celebrating') {
      const pulse = 1 + Math.sin(time * 0.014) * 0.035;
      ctx.save(); ctx.translate(canvas.width / 2, 165); ctx.scale(pulse, pulse); ctx.textAlign = 'center';
      const size = game.message.length > 46 ? 22 : game.message.length > 34 ? 27 : 34;
      ctx.font = `900 ${size}px Arial`; ctx.strokeStyle = '#082a43'; ctx.lineWidth = 8; ctx.strokeText(game.message, 0, 0); ctx.fillStyle = sections[game.sectionIndex]?.accent || '#ffe17f'; ctx.fillText(game.message, 0, 0); ctx.restore();
    }
    if (game.state === 'celebrating') {
      ctx.textAlign = 'center'; ctx.font = '900 34px Arial'; ctx.strokeStyle = '#321542'; ctx.lineWidth = 8; ctx.strokeText('MAXIMUM CALDERA CRUNCH!', canvas.width / 2, 170); ctx.fillStyle = '#ffe17f'; ctx.fillText('MAXIMUM CALDERA CRUNCH!', canvas.width / 2, 170);
    }
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (game.cameraShake > 0) {
      const shake = game.reducedShake ? game.cameraShake * 0.2 : game.cameraShake;
      ctx.translate((seeded() - 0.5) * shake, (seeded() - 0.5) * shake * 0.55);
    }
    drawCalderaBackground(time);
    drawCalderaHazards(time);
    drawCalderaScenery(time);
    for (const platform of world.platforms) drawPlatform(platform, time);
    drawCalderaTrekker(time);
    for (const item of world.collectibles) drawCollectible(item, time);
    for (const checkpoint of world.checkpoints) drawCalderaCheckpoint(checkpoint, time);
    drawCoconutCannons();
    drawCalderaGoal(time);
    for (const enemy of world.enemies) drawCalderaEnemy(enemy, time);
    heroCore.drawRespawnFX(ctx, game.respawn, player, game.cameraX, time, {
      vanish: '#63e7ff', vanishRing: '#ffe17f', landingRing: 'rgba(99, 231, 255, .86)',
    });
    drawPlayer(time);
    drawParticles();
    ctx.restore();
    drawHUD(time);
    if (previewHost) {
      canvas.dataset.qaState = JSON.stringify({
        sourceVersion: SOURCE_VERSION,
        state: game.state, player: { x: Math.round(player.x), y: Math.round(player.y), vx: Math.round(player.vx), vy: Math.round(player.vy), grounded: player.grounded },
        superHero: { ...sharedAbilities.snapshot(game.abilities), collisionWidth: player.w, collisionHeight: player.h },
        heroPhysics, respawn: {
          active: game.respawn.active,
          phase: game.respawn.active ? (game.respawn.spawnPlaced ? 'drop' : game.respawn.timer < .38 ? 'vanish' : 'beam') : 'inactive',
          count: game.respawnCount, fallbacks: game.respawnFallbacks, lastLanding: game.lastRespawnLanding,
        }, lastImpactText: game.impactTexts[game.impactTexts.length - 1]?.text || null,
        celebrationTime: Number(game.celebrationTime.toFixed(2)),
        section: sections[game.sectionIndex]?.id, platforms: world.platforms.length,
        movingPlatforms: world.platforms.filter((platform) => platform.moving).length,
        collectibles: game.totalCollectibles, enemies: world.enemies.length, routeMaxGap: game.routeMaxGap,
        platformOverlapCount: game.platformOverlapCount,
        platformOverlapPairs: game.platformOverlapPairs || [],
        platformSweepCrossings: game.platformSweepCrossings || 0,
        checkpoints: { total: world.checkpoints.length, grounded: game.checkpointsGrounded, allGrounded: game.checkpointsGrounded === world.checkpoints.length },
        tacoCoins: world.collectibles.filter((item) => item.type === 'tacoCoin').length,
        boat: {
          state: game.boat.state,
          x: Math.round(game.boat.x),
          catches: game.boat.catches,
          launcherPulse: Number(game.boat.dropPulse.toFixed(3)),
        },
        eruption: { state: game.eruption.state, timer: Number(game.eruption.timer.toFixed(2)), done: game.wave.done },
        wave: {
          active: game.wave.active, done: game.wave.done, crashing: game.wave.crashing,
          crashTimer: Number(game.wave.crashTimer.toFixed(2)), x: Math.round(game.wave.x),
          gap: Math.round(player.x - game.wave.x),
          artReady: Boolean(images.environment),
        },
        surf: { phase: game.surf.phase, boardMounted: game.surf.boardMounted, clearedObstacles: game.surf.clearedObstacles, obstacles: world.surfObstacles.length },
        cannonballs: game.cannonballs.length,
        worldWidth: WORLD_WIDTH,
        backgroundBlend: game.backgroundBlend,
        environmentRemaster: {
          ready: game.environmentRemasterReady,
          acts: Object.keys(environmentImageKeys).length,
          transitionWidth: ENVIRONMENT_TRANSITION_WIDTH,
          panoramaCrop: ENVIRONMENT_PANORAMA_CROP,
          backgroundRepeats: 0,
          subpixelParallax: true,
          eruptionLinked: true,
        },
        foregroundRemaster: {
          ready: game.foregroundRemasterReady,
          groundFamilies: terrainSourceRows.ground.length,
          platformFamilies: terrainSourceRows.platform.length,
          checkpointFamilies: Object.keys(checkpointArtKeys).length,
          platformVisualProfile: calderaPlatformVisualProfile,
          collisionGeometryPreserved: true,
          geyserPhysicsPreserved: true,
          lavaHazardsPreserved: true,
        },
        trekkerRemaster: {
          stableBody: Boolean(images.calderaTrekkerBase),
          independentWheelMotion: true,
          armAnimationRemoved: true,
          rearVehicleLauncher: calderaTrekkerRearLauncher,
          dropStates: ['geyser-drop', 'lava-chase'],
          pinkBlueBangs: true,
        },
        enemyScaleAudit: {
          drawProfiles: calderaEnemyDrawProfiles,
          opaqueArtWidthRangePx: [50, 76],
          opaqueArtHeightRangePx: [49, 67],
          playerHeightPx: player.h,
          collisionBoxPx: [44, 44],
          collisionGeometryPreserved: true,
        },
        music: {
          active: game.activeMusic,
          transition: game.musicTransition ? {
            from: game.musicTransition.fromName, target: game.musicTransition.toName,
            progress: Number(clamp(game.musicTransition.elapsed / game.musicTransition.duration, 0, 1).toFixed(3)),
          } : null,
          playing: Object.entries(tracks).filter(([, track]) => !track.paused)
            .map(([name, track]) => ({ name, volume: Number(track.volume.toFixed(3)) })),
          overlapSafe: allTracks.filter((track) => !track.paused).length <= 2,
          transitions: game.musicTransitionCount, overlapRecoveries: game.musicOverlapRecoveries, maxPlaying: game.maxMusicPlaying,
        },
        abilities: { ...game.abilities },
        fullscreenReady: Boolean(document.fullscreenEnabled || navigator.standalone),
      });
    }
  }

  function frame(now) {
    if (!lastFrame) lastFrame = now;
    const dt = Math.min(0.033, (now - lastFrame) / 1000);
    lastFrame = now;
    update(dt);
    draw(now);
    requestAnimationFrame(frame);
  }

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = path;
    });
  }

  const imageAssets = {
    hero: 'assets/taco_hero_sheet.png',
    items: 'assets/items_sheet.png',
    oliviaTrekker: 'assets/olivia_taco_trekker_sheet_v1.png',
    enemies: 'assets/caldera_enemy_checkpoint_sheet_v1.png',
    ashEnemy: 'assets/world2_2_ash_enemy_v1.png',
    environment: 'assets/caldera_environment_sheet_v1.png',
    environmentCamp: 'assets/world2_2_env_camp_v1.webp',
    environmentGeyser: 'assets/world2_2_env_geyser_v1.webp',
    environmentCaves: 'assets/world2_2_env_caves_v1.webp',
    environmentEruption: 'assets/world2_2_env_eruption_v1.webp',
    environmentLuau: 'assets/world2_2_env_luau_v1.webp',
    groundAtlas: 'assets/world2_2_ground_atlas_v1.webp',
    platformAtlas: 'assets/world2_2_platform_atlas_v1.webp',
    checkpointPadAtlas: 'assets/world2_2_checkpoint_pad_atlas_v1.webp',
    checkpointCamp: 'assets/world2_2_checkpoint_camp_v1.webp',
    checkpointGeyser: 'assets/world2_2_checkpoint_geyser_v1.webp',
    checkpointCaves: 'assets/world2_2_checkpoint_caves_v1.webp',
    checkpointEruption: 'assets/world2_2_checkpoint_eruption_v1.webp',
    checkpointLuau: 'assets/world2_2_checkpoint_luau_v1.webp',
    calderaTrekkerBase: 'assets/world2_2_caldera_trekker_base_v1.webp',
  };

  Promise.all(Object.entries(imageAssets).map(([key, path]) => loadImage(path).then((image) => [key, image]))).then((entries) => {
    for (const [key, image] of entries) images[key] = image;
    loadProgress(); setupInputs(); resetGame(); syncSettings(); updatePersonalBest();
    requestAnimationFrame(frame);
  }).catch((error) => {
    console.error('Could not load Campfire Caldera Caper assets:', error);
    ctx.fillStyle = '#fff8dc'; ctx.font = '24px Arial'; ctx.fillText('The island assets could not be loaded.', 40, 60);
  });
})();
