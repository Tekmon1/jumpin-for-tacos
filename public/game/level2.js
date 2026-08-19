(() => {
  const SOURCE_VERSION = 'w2-1-v32-phase2-exploration';
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

  const WORLD_WIDTH = 36000;
  const GROUND_Y = 460;
  const ENVIRONMENT_TRANSITION_WIDTH = 1600;
  const ENVIRONMENT_PANORAMA_CROP = 0.9;
  const visualScale = heroCore.visualScale;
  const CATAMARAN_VISUAL = Object.freeze({
    activeWidth: 304,
    escapeWidth: 330,
    leftOffset: -43,
    launcherXOffset: -14,
    launcherYOffset: -122,
  });
  const SURF_OLIVIA_VISUAL = Object.freeze({ width: 210, height: 140, leftOffset: -3, baselineOffset: -33 });
  const sections = [
    { id: 'shore', name: 'Shimmering Shores', start: 0, end: 7000, music: 'shore', accent: '#ffe17f' },
    { id: 'canopy', name: 'Palm Canopy', start: 7000, end: 14500, music: 'canopy', accent: '#55e6a5' },
    { id: 'tides', name: 'Tidal Temple', start: 14500, end: 24500, music: 'tides', accent: '#63e7ff' },
    { id: 'surge', name: 'Moonlit Surf Rescue', start: 24500, end: 34200, music: 'surge', accent: '#84f3ff' },
    { id: 'fiesta', name: 'Moonlit Island Fiesta', start: 34200, end: WORLD_WIDTH, music: 'fiesta', accent: '#c69cff' },
  ];
  const checkpoints = [
    { x: 6100, name: 'Shell Station', look: 'shell', sign: 'SURF’S UP. FALLING IS OPTIONAL!', accent: '#ffe17f' },
    { x: 13200, name: 'Canopy Dock', look: 'canopy', sign: 'BRANCH MANAGER APPROVED!', accent: '#55e6a5' },
    { x: 23600, name: 'Lighthouse Landing', look: 'lighthouse', sign: 'BIG WAVE AHEAD. ACT NATURAL!', accent: '#63e7ff' },
    { x: 34650, name: 'Moonlight Mooring', look: 'moon', sign: 'THE VIBES HAVE PEAKED!', accent: '#c69cff' },
  ];
  const COVE_EXPLORATION_VERSION = 'world-2-1-phase2-v1';
  const ROBERT_WAVEWATCH_DIALOGUE = 'Ready for an endless summer of tasty waves and tacos?';
  const CATAMARAN_DROP_CORRIDOR = Object.freeze({ start: 17180, end: 21240 });
  const SURF_SCRIPT_START = 24820;
  const coveExplorationPlan = Object.freeze([
    Object.freeze({
      id: 'coconut-crown-canopy', name: 'Coconut Crown Canopy', presentation: 'organic-spectacle',
      arrivalTitle: 'COCONUT CROWN CANOPY REACHED', completionTitle: 'COCONUT CASCADE!',
      rewardLabel: '+1,500 SCORE  •  9-TACO CANOPY BURST', score: 1500, bonusTacos: 9,
      trigger: Object.freeze({ x: 8285, y: -24, w: 190, h: 92 }),
      routeRange: Object.freeze([7900, 8830]), rewardX: 8360, rewardY: 70,
      rewardPlatformId: 'phase2-canopy-upper', waypointCount: 4,
      worldPercent: Object.freeze([21.9, 24.5]),
    }),
    Object.freeze({
      id: 'waterfall-wall', name: 'Waterfall Wall', presentation: 'natural-ascent',
      arrivalTitle: 'WATERFALL WALL ROUTE FOUND', completionTitle: 'WATERFALL CRESTED',
      rewardLabel: '+1,800 SCORE  •  10-TACO SPRAY', score: 1800, bonusTacos: 10,
      trigger: Object.freeze({ x: 15022, y: -106, w: 188, h: 104 }),
      routeRange: Object.freeze([14720, 15590]), rewardX: 15055, rewardY: 58,
      rewardPlatformId: 'phase2-waterfall-mid', waypointCount: 3,
      worldPercent: Object.freeze([40.9, 43.3]),
    }),
    Object.freeze({
      id: 'shipwreck-mast-run', name: 'Shipwreck Mast Run', presentation: 'rigging-spectacle',
      arrivalTitle: 'SHIPWRECK RIGGING REACHED', completionTitle: 'MAST RUN SECURED!',
      rewardLabel: '+2,200 SCORE  •  12-TACO TREASURE ARC', score: 2200, bonusTacos: 12,
      trigger: Object.freeze({ x: 22382, y: -26, w: 158, h: 102 }),
      routeRange: Object.freeze([21790, 22650]), rewardX: 22302, rewardY: 52,
      rewardPlatformId: 'phase2-shipwreck-upper', waypointCount: 4,
      worldPercent: Object.freeze([60.5, 62.9]),
    }),
    Object.freeze({
      id: 'wavewatch-lookout', name: 'Wavewatch Lookout', presentation: 'tribute-character',
      arrivalTitle: 'WAVEWATCH LOOKOUT REACHED', completionTitle: 'ENDLESS SUMMER LOOKOUT',
      rewardLabel: '+2,600 SCORE  •  11-TACO SUNSET SET', score: 2600, bonusTacos: 11,
      trigger: Object.freeze({ x: 24108, y: 166, w: 300, h: 116 }),
      routeRange: Object.freeze([23650, 24660]), rewardX: 24225, rewardY: 222,
      rewardPlatformId: 'phase2-wavewatch-deck', waypointCount: 2,
      worldPercent: Object.freeze([65.7, 68.5]),
    }),
  ]);
  const secretGrottoPlan = Object.freeze({
    id: 'secret-grotto', name: 'Secret Grotto', presentation: 'true-secret',
    completionTitle: 'SECRET GROTTO DISCOVERED!',
    rewardLabel: '+4,800 SCORE  •  18-TACO JACKPOT  •  2 RAINBOW TACOS',
    score: 4800, bonusTacos: 18,
    trigger: Object.freeze({ x: 15238, y: 74, w: 198, h: 148 }),
    routeRange: Object.freeze([14720, 15590]), rewardX: 15332, rewardY: 126,
    rewardPlatformId: 'phase2-secret-grotto', waypointCount: 1,
    worldPercent: Object.freeze([42.3, 43.2]), requiredParentProgress: 3,
  });
  const coveExplorationArt = Object.freeze({
    canopy: Object.freeze({ x: 7900, y: -190, w: 930, h: 620, image: 'phase2Canopy' }),
    waterfall: Object.freeze({ x: 14730, y: -160, w: 827, h: 620, image: 'phase2Waterfall' }),
    shipwreck: Object.freeze({ x: 21800, y: -100, w: 840, h: 560, image: 'phase2Shipwreck' }),
    wavewatch: Object.freeze({ x: 23580, y: -260, w: 1080, h: 720, image: 'phase2Wavewatch' }),
  });

  const tracks = {
    shore: document.getElementById('musicIslandShore'),
    canopy: document.getElementById('musicIslandCanopy'),
    tides: document.getElementById('musicIslandTides'),
    surge: document.getElementById('musicIslandSurge'),
    fiesta: document.getElementById('musicIslandFiesta'),
  };
  const sharedAbilities = window.JFT_SHARED_ABILITIES;
  const audio = window.JFT_AUDIO;
  const allTracks = Object.values(tracks);
  const images = {};
  const environmentImageKeys = {
    shore: 'environmentShore',
    canopy: 'environmentCanopy',
    tides: 'environmentTides',
    surge: 'environmentSurge',
    fiesta: 'environmentFiesta',
  };
  const terrainRows = { shore: 0, canopy: 1, tides: 2, surge: 3, fiesta: 4 };
  const islandEnemyRows = { crab: 0, coconut: 1, seagull: 2, puffer: 3, tiki: 4 };
  const islandEnemySourceRows = {
    crab: [36, 307], coconut: [339, 313], seagull: [643, 278], puffer: [908, 287], tiki: [1162, 354],
  };
  const islandEnemyDrawSizes = {
    crab: [84, 66], coconut: [94, 68], seagull: [104, 68], puffer: [94, 68], tiki: [104, 70],
  };
  const islandPlatformVisualProfile = Object.freeze({
    groundMinimumHeight: 84,
    elevatedMinimumHeight: 44,
    elevatedExtraDepth: 20,
  });
  const checkpointArtKeys = {
    shell: 'checkpointShell',
    canopy: 'checkpointCanopy',
    lighthouse: 'checkpointLighthouse',
    moon: 'checkpointMoon',
  };
  const checkpointOliviaKeys = {
    shell: 'checkpointOliviaShell',
    canopy: 'checkpointOliviaCanopy',
    lighthouse: 'checkpointOliviaLighthouse',
    moon: 'checkpointOliviaMoon',
  };
  const terrainSourceRows = {
    ground: [
      [0, 15, 1536, 215], [0, 250, 1536, 183], [0, 458, 1536, 175],
      [0, 652, 1536, 154], [0, 830, 1536, 176],
    ],
    platform: [
      [0, 19, 1536, 187], [0, 238, 1536, 163], [0, 457, 1536, 170],
      [0, 662, 1536, 151], [0, 847, 1536, 161],
    ],
  };
  const checkpointPadSourceRows = {
    shell: [0, 0, 1536, 244],
    canopy: [0, 260, 1536, 244],
    lighthouse: [0, 520, 1536, 244],
    moon: [0, 780, 1536, 244],
  };
  const keys = { left: false, right: false, jump: false };
  const world = {
    platforms: [], collectibles: [], enemies: [], checkpoints: [], cannons: [],
    surfObstacles: [], goal: { x: 35420, y: 320, w: 120, h: 140 }, encounterAudit: null,
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
    boat: { state: 'idle', x: 0, speed: 0, dropTimer: 0, catches: 0 },
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
    decorativeMidgroundRemoved: false,
    world2EncounterAudit: null,
    coveExploration: null,
    coveExplorationGeometryAudit: null,
  };

  let vehicleLoopHandle = null;
  let lastFrame = 0;
  let randomSeed = 0xC0C0A;
  const params = new URLSearchParams(location.search);
  const previewHost = ['terminal.local', 'localhost', '127.0.0.1'].includes(location.hostname);
  const previewStart = previewHost ? Number(params.get('startX') || 0) : 0;
  const previewStartY = previewHost && params.has('startY') ? Number(params.get('startY')) : 330;
  const previewAutoRun = previewHost && params.get('autoRun') === '1';
  const previewAutoJump = previewHost && params.get('autoJump') === '1';
  const previewFastCelebrate = previewHost && params.get('fastCelebrate') === '1';
  const previewSuper = previewHost && params.get('super') === '1';
  const previewRespawn = previewHost && params.get('respawn') === '1';
  const previewRespawnCheckpoint = previewHost ? Number(params.get('respawnCheckpoint') || -1) : -1;
  const previewPhase2Ready = previewHost ? params.get('phase2Ready') || '' : '';
  const previewPhase2Complete = previewHost ? params.get('phase2Complete') || '' : '';
  const previewPhase2Secret = previewHost && params.get('phase2Secret') === '1';
  const previewPowerDown = previewHost && params.get('powerDown') === '1';
  const previewNormalOnly = previewHost && params.get('normalOnly') === '1';
  const previewNoDamage = previewHost && params.get('noDamage') === '1';

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

  function startVehicleLoop(vehicleType, position = 0) {
    if (vehicleLoopHandle) return;
    vehicleLoopHandle = audio?.startLoop('vehicle.idle', { vehicleType, position }) || null;
  }

  function stopVehicleLoop() {
    if (!vehicleLoopHandle) return;
    audio?.stopLoop(vehicleLoopHandle);
    vehicleLoopHandle = null;
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

  function createCoveExplorationState() {
    return {
      version: COVE_EXPLORATION_VERSION,
      scope: 'world-2-1-only',
      normalRouteUnaffected: true,
      noRequiredSuperTraversal: true,
      phase1BalanceFrozen: true,
      completionBanner: null,
      dialogue: null,
      cameraLift: 0,
      cameraTargetLift: 0,
      previewPowerDownTriggered: false,
      destinations: Object.fromEntries(coveExplorationPlan.map((entry) => [entry.id, {
        revealed: false,
        completed: false,
        completedAt: null,
        progress: 0,
        arrivalAcknowledged: false,
        completionCount: 0,
        rewardSpawned: false,
        rewardSpawnCount: 0,
        rewardSurfaceId: null,
        environmentEnergized: false,
        spectacleTimer: 0,
        spectacleMaxTimer: 0,
      }])),
      secret: {
        revealed: false,
        completed: false,
        completedAt: null,
        progress: 0,
        arrivalAcknowledged: false,
        completionCount: 0,
        rewardSpawned: false,
        rewardSpawnCount: 0,
        rewardSurfaceId: null,
        environmentEnergized: false,
        spectacleTimer: 0,
        spectacleMaxTimer: 0,
        reveal: 0,
      },
    };
  }

  function coveExplorationStateForEntry(entry) {
    if (!game.coveExploration || !entry) return null;
    return entry.id === secretGrottoPlan.id
      ? game.coveExploration.secret
      : game.coveExploration.destinations[entry.id];
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

  function platformAt(x, minWidth = 210) {
    return world.platforms.find((platform) => platform.ground && platform.w >= minWidth && x > platform.x + 55 && x < platform.x + platform.w - 55);
  }

  function surfacePlatformAt(x, styles = [], options = {}) {
    const allowedStyles = Array.isArray(styles) ? styles : [styles];
    const edgePadding = options.edgePadding ?? 18;
    const elevatedOnly = options.elevatedOnly ?? false;
    const candidates = world.platforms
      .filter((platform) => !platform.secret && (!elevatedOnly || !platform.ground))
      .filter((platform) => !allowedStyles.length || allowedStyles.includes(platform.style))
      .filter((platform) => platform.w >= (options.minWidth ?? 100))
      .filter((platform) => x > platform.x + edgePadding && x < platform.x + platform.w - edgePadding)
      .sort((a, b) => (a.ground ? 1 : 0) - (b.ground ? 1 : 0));
    return candidates[0] || null;
  }

  function addIslandFormation(definition) {
    const platform = definition.platform || surfacePlatformAt(definition.x, definition.styles, {
      elevatedOnly: definition.elevatedOnly,
      minWidth: definition.minWidth,
    });
    if (!platform) return [];
    const count = definition.count ?? 2;
    const width = definition.w ?? 40;
    const height = definition.h ?? 38;
    const spacing = definition.spacing ?? 52;
    const verticalOffset = definition.verticalOffset ?? 0;
    const startX = definition.startX ?? definition.x - ((count - 1) * spacing) / 2;
    const enemies = heroCore.createEnemyFormation({
      id: definition.id,
      type: definition.type,
      startX,
      y: platform.y - height + verticalOffset,
      w: width,
      h: height,
      count,
      spacing,
      vx: definition.speed ?? 48,
      role: definition.role || 'platform-sentry',
      platform,
      platformOffsetY: verticalOffset,
      formationPurpose: definition.purpose || 'World 2 surface encounter',
    });
    enemies.forEach((enemy, index) => {
      enemy.platform = platform;
      enemy.platformOffsetY = verticalOffset;
      enemy.surfaceKind = definition.surfaceKind;
      enemy.encounterId = definition.id;
      enemy.encounterRole = definition.role || 'platform-sentry';
      enemy.behaviorType = definition.behaviorType || ({ seagull: 'onion', coconut: 'tomato', crab: 'chili', puffer: 'jalapeno' }[definition.type] || 'tomato');
      enemy.dir = index % 2 ? -1 : 1;
      enemy.speed = definition.speed ?? 48;
      enemy.clock = index * .37;
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length + index, enemy.behaviorType);
    });
    heroCore.attachEnemiesToPlatforms(enemies, [platform], { edgePadding: 18, surfaceTolerance: 48 });
    heroCore.retuneEnemyFormationPatrols(enemies, { fullPlatformCoverage: true, minimumGap: 8, edgePadding: 18 });
    world.enemies.push(...enemies);
    return enemies;
  }

  function retuneIslandGroundPatrols(enemies, groupPrefix) {
    const sourceEnemies = enemies.filter((enemy) => enemy?.platform);
    const previousSpans = sourceEnemies.map((enemy) => Math.max(0, enemy.maxX - enemy.minX));
    const byPlatform = new Map();
    sourceEnemies.forEach((enemy) => {
      if (!byPlatform.has(enemy.platform)) byPlatform.set(enemy.platform, []);
      byPlatform.get(enemy.platform).push(enemy);
    });
    for (const [platform, members] of byPlatform) {
      const ordered = [...members].sort((a, b) => a.x - b.x);
      ordered.forEach((enemy, index) => {
        enemy.groupId = `${groupPrefix}-${Math.round(platform.x)}-${Math.round(platform.y)}`;
        enemy.groupIndex = index;
        enemy.groupSize = ordered.length;
        enemy.formationSpacing = enemy.w + 12;
      });
    }
    const audit = heroCore.retuneEnemyFormationPatrols(sourceEnemies, {
      fullPlatformCoverage: true,
      minimumGap: 12,
      edgePadding: 20,
    });
    return Object.freeze({
      ...audit,
      previousMinSpan: previousSpans.length ? Math.min(...previousSpans) : 0,
      previousMaxSpan: previousSpans.length ? Math.max(...previousSpans) : 0,
      patrolCoverage: 'full-safe-platform-with-separated-lanes',
    });
  }

  function addCoveExplorationPlatform(data) {
    return addPlatform({
      h: 24,
      optional: true,
      mainRoute: false,
      phase2ArtSurface: true,
      phase2Escape: 'drop-to-main-route',
      ...data,
    });
  }

  function buildCoveExplorationGeometry() {
    const phase2Platforms = [
      addCoveExplorationPlatform({ id: 'phase2-canopy-entry', x: 8110, y: 282, w: 392, style: 'leaf', phase2Discovery: 'coconut-crown-canopy', phase2Waypoint: 1, superEntry: true }),
      addCoveExplorationPlatform({ id: 'phase2-canopy-mid', x: 8150, y: 182, w: 465, style: 'leaf', phase2Discovery: 'coconut-crown-canopy', phase2Waypoint: 2 }),
      addCoveExplorationPlatform({ id: 'phase2-canopy-upper', x: 8154, y: 100, w: 440, style: 'leaf', phase2Discovery: 'coconut-crown-canopy', phase2Waypoint: 3 }),
      addCoveExplorationPlatform({ id: 'phase2-canopy-crown', x: 8290, y: 18, w: 190, style: 'leaf', phase2Discovery: 'coconut-crown-canopy', phase2Waypoint: 4 }),

      addCoveExplorationPlatform({ id: 'phase2-waterfall-entry', x: 14882, y: 245, w: 208, style: 'temple', phase2Discovery: 'waterfall-wall', phase2Waypoint: 1, superEntry: true }),
      addCoveExplorationPlatform({ id: 'phase2-waterfall-mid', x: 14965, y: 92, w: 190, style: 'temple', phase2Discovery: 'waterfall-wall', phase2Waypoint: 2 }),
      addCoveExplorationPlatform({ id: 'phase2-waterfall-crest', x: 15028, y: -35, w: 178, style: 'temple', phase2Discovery: 'waterfall-wall', phase2Waypoint: 3 }),
      addCoveExplorationPlatform({ id: 'phase2-secret-grotto', x: 15245, y: 138, w: 188, style: 'temple', phase2Discovery: 'secret-grotto', phase2Waypoint: 1, hiddenSecretSurface: true }),

      addCoveExplorationPlatform({ id: 'phase2-shipwreck-entry', x: 22040, y: 258, w: 220, style: 'temple', phase2Discovery: 'shipwreck-mast-run', phase2Waypoint: 1, superEntry: true }),
      addCoveExplorationPlatform({ id: 'phase2-shipwreck-mid', x: 22120, y: 165, w: 210, style: 'temple', phase2Discovery: 'shipwreck-mast-run', phase2Waypoint: 2 }),
      addCoveExplorationPlatform({ id: 'phase2-shipwreck-upper', x: 22198, y: 57, w: 190, style: 'temple', phase2Discovery: 'shipwreck-mast-run', phase2Waypoint: 3 }),
      addCoveExplorationPlatform({ id: 'phase2-shipwreck-crows-nest', x: 22388, y: 10, w: 150, style: 'temple', phase2Discovery: 'shipwreck-mast-run', phase2Waypoint: 4 }),

      addCoveExplorationPlatform({ id: 'phase2-wavewatch-entry', x: 23770, y: 286, w: 180, style: 'temple', phase2Discovery: 'wavewatch-lookout', phase2Waypoint: 1, superEntry: true }),
      addCoveExplorationPlatform({ id: 'phase2-wavewatch-deck', x: 23950, y: 235, w: 540, style: 'temple', phase2Discovery: 'wavewatch-lookout', phase2Waypoint: 2 }),
    ];

    const guideLayout = [
      ['coconut-crown-canopy', ['phase2-canopy-entry', 'phase2-canopy-mid', 'phase2-canopy-upper', 'phase2-canopy-crown']],
      ['waterfall-wall', ['phase2-waterfall-entry', 'phase2-waterfall-mid', 'phase2-waterfall-crest']],
      ['shipwreck-mast-run', ['phase2-shipwreck-entry', 'phase2-shipwreck-mid', 'phase2-shipwreck-upper', 'phase2-shipwreck-crows-nest']],
      ['wavewatch-lookout', ['phase2-wavewatch-entry', 'phase2-wavewatch-deck']],
    ];
    guideLayout.forEach(([discovery, ids]) => ids.forEach((id, platformIndex) => {
      const platform = phase2Platforms.find((candidate) => candidate.id === id);
      if (!platform) return;
      const count = platform.w >= 300 ? 4 : 2;
      const gap = Math.min(48, (platform.w - 44) / Math.max(1, count - 1));
      const startX = platform.x + (platform.w - (count - 1) * gap - 24) * 0.5;
      for (let index = 0; index < count; index += 1) {
        addItem(startX + index * gap, platform.y - 43, 'taco', {
          bonusReward: true,
          phase2Guide: true,
          phase2Discovery: discovery,
          bob: platformIndex * .7 + index * .32,
        });
      }
    }));
    addItem(15215, 117, 'taco', { bonusReward: true, phase2Guide: true, phase2SecretClue: true, bob: 2.8 });

    const entryRises = Object.fromEntries(coveExplorationPlan.map((entry) => {
      const entryPlatform = phase2Platforms.find((platform) => platform.phase2Discovery === entry.id && platform.superEntry);
      return [entry.id, entryPlatform ? GROUND_Y - entryPlatform.y : null];
    }));
    const centers = coveExplorationPlan.map((entry) => entry.trigger.x + entry.trigger.w * .5).sort((a, b) => a - b);
    game.coveExplorationGeometryAudit = {
      version: COVE_EXPLORATION_VERSION,
      phase2PlatformCount: phase2Platforms.length,
      phase2PlatformIds: phase2Platforms.map((platform) => platform.id),
      entryRises,
      allEntriesRequireSuper: Object.values(entryRises).every((rise) => Number.isFinite(rise) && rise > heroPhysics.normalJumpRise + 1),
      minimumDestinationSpacing: centers.slice(1).reduce((minimum, center, index) => Math.min(minimum, center - centers[index]), Infinity),
      standardViewportSeparated: centers.slice(1).every((center, index) => center - centers[index] > canvas.width),
      allOptional: phase2Platforms.every((platform) => platform.optional && !platform.mainRoute),
      allDropRecoverable: phase2Platforms.every((platform) => platform.phase2Escape === 'drop-to-main-route'),
      catamaranCorridorUntouched: coveExplorationPlan.every((entry) => entry.routeRange[1] < CATAMARAN_DROP_CORRIDOR.start || entry.routeRange[0] > CATAMARAN_DROP_CORRIDOR.end),
      surfTriggerUntouched: coveExplorationPlan.find((entry) => entry.id === 'wavewatch-lookout').routeRange[1] < SURF_SCRIPT_START,
      cameraMaximumLift: 182,
      backgroundSeamsExposed: false,
    };
  }

  function buildWorld() {
    randomSeed = 0xC0C0A;
    world.platforms = [];
    world.collectibles = [];
    world.enemies = [];
    world.cannons = [];
    world.surfObstacles = [];
    game.world2EncounterAudit = null;
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
    addUpperRoute(sections[1], 'leaf', 360, 420, 7900, 8830);
    // World 2-1 Phase 2 replaces the old generic Tidal Temple upper strips
    // with authored waterfall, shipwreck, and lookout landmarks. The lower
    // route and Olivia's protected catamaran corridor remain unchanged.
    addUpperRoute(sections[2], 'temple', 330, 460, 14450, 24700);
    buildCoveExplorationGeometry();

    const secretRewards = [
      [1070, 166], [5100, 154], [8750, 142], [12150, 160],
      [15380, 154], [18780, 150], [22620, 145], [34880, 138],
    ];
    secretRewards.forEach(([x, y], index) => {
      addPlatform({ x: x - 70, y: y + 50, w: 176, h: 22, style: index < 2 ? 'surfboard' : index < 4 ? 'leaf' : index < 7 ? 'temple' : 'glowboard', secret: true });
      addItem(x, y, 'golden');
    });

    const rainbowRewards = [3150, 6700, 10580, 13820, 16080, 20180, 23920, 35080];
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
    const groundPatrolEnemies = [];
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
      groundPatrolEnemies.push(enemy);
    });
    const groundPatrolAudit = retuneIslandGroundPatrols(groundPatrolEnemies, 'w2-1-ground');

    // A safe shoreline bounce line makes both global combo milestones
    // reachable in the island world without changing its main difficulty.
    const islandComboPositions = [240, 460, 680, 910, 1130];
    const comboPatrolEnemies = [];
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
        comboPatrolEnemies.push(enemy);
      });
    }
    const comboPatrolAudit = retuneIslandGroundPatrols(comboPatrolEnemies, 'w2-1-combo');

    // World 2 is intentionally a surface-driven island route. These packs
    // make the palm canopy, surfboards, leaf bridges, tidal temple, and the
    // edges of Olivia's catamaran run active without putting enemies in her
    // central taco-drop lane.
    const surfaceEncounterSpecs = [
      { id: 'shore-palm-pack-a', x: 500, styles: ['surfboard'], type: 'coconut', surfaceKind: 'palm-canopy', purpose: 'Palm-canopy platform guard' },
      { id: 'shore-palm-pack-b', x: 930, styles: ['surfboard'], type: 'crab', surfaceKind: 'palm-canopy', purpose: 'Surfboard canopy guard' },
      { id: 'shore-palm-pack-c', x: 1380, styles: ['surfboard'], type: 'coconut', surfaceKind: 'palm-canopy', purpose: 'Palm-canopy stomp pair' },
      { id: 'shore-surf-pack-a', x: 2220, styles: ['surfboard'], type: 'puffer', surfaceKind: 'surfboard', purpose: 'Surfboard route guard' },
      { id: 'shore-surf-pack-b', x: 3100, styles: ['surfboard'], type: 'crab', surfaceKind: 'surfboard', purpose: 'Surfboard route guard' },
      { id: 'shore-surf-pack-c', x: 3980, styles: ['surfboard'], type: 'coconut', surfaceKind: 'surfboard', purpose: 'Surfboard route guard' },
      { id: 'shore-surf-pack-d', x: 4860, styles: ['surfboard'], type: 'puffer', surfaceKind: 'surfboard', purpose: 'Surfboard route guard' },
      { id: 'shore-surf-pack-e', x: 5740, styles: ['surfboard'], type: 'crab', surfaceKind: 'surfboard', purpose: 'Final shore board guard' },
      { id: 'canopy-leaf-pack-a', x: 7420, styles: ['leaf'], type: 'coconut', surfaceKind: 'leaf-platform', purpose: 'Hanging-leaf platform guard' },
      { id: 'canopy-leaf-pack-b', x: 8260, styles: ['leaf'], type: 'seagull', surfaceKind: 'leaf-platform', verticalOffset: -72, purpose: 'Leaf-platform aerial guard' },
      { id: 'canopy-leaf-pack-c', x: 9100, styles: ['leaf'], type: 'crab', surfaceKind: 'leaf-platform', purpose: 'Leaf-platform stomp pair' },
      { id: 'canopy-leaf-pack-d', x: 9940, styles: ['leaf'], type: 'coconut', surfaceKind: 'leaf-platform', purpose: 'Palm canopy route guard' },
      { id: 'canopy-leaf-pack-e', x: 10780, styles: ['leaf'], type: 'seagull', surfaceKind: 'leaf-platform', verticalOffset: -72, purpose: 'Leaf-platform aerial guard' },
      { id: 'canopy-leaf-pack-f', x: 11620, styles: ['leaf'], type: 'crab', surfaceKind: 'leaf-platform', purpose: 'Leaf-platform route guard' },
      { id: 'canopy-leaf-pack-g', x: 12460, styles: ['leaf'], type: 'coconut', surfaceKind: 'leaf-platform', purpose: 'Canopy descent guard' },
      { id: 'canopy-leaf-pack-h', x: 13300, styles: ['leaf'], type: 'seagull', surfaceKind: 'leaf-platform', verticalOffset: -72, purpose: 'Canopy dock approach guard' },
      { id: 'temple-ledge-pack-a', x: 14900, styles: ['temple'], type: 'puffer', surfaceKind: 'tidal-temple-ledge', purpose: 'Tidal temple ledge guard' },
      { id: 'temple-ledge-pack-b', x: 15400, styles: ['temple'], type: 'crab', surfaceKind: 'tidal-temple-ledge', purpose: 'Tidal temple ledge guard' },
      { id: 'temple-ledge-pack-c', x: 15780, styles: ['temple'], type: 'puffer', surfaceKind: 'tidal-temple-ledge', purpose: 'Temple tide-lift guard' },
      { id: 'temple-ledge-pack-d', x: 22240, styles: ['temple'], type: 'crab', surfaceKind: 'tidal-temple-ledge', purpose: 'Temple exit ledge guard' },
      { id: 'temple-ledge-pack-e', x: 23000, styles: ['temple'], type: 'puffer', surfaceKind: 'tidal-temple-ledge', purpose: 'Temple exit ledge guard' },
      { id: 'temple-ledge-pack-f', x: 23700, styles: ['temple'], type: 'crab', surfaceKind: 'tidal-temple-ledge', purpose: 'Lighthouse approach guard' },
      { id: 'catamaran-edge-entry', x: 16680, styles: ['dock'], type: 'seagull', surfaceKind: 'catamaran-edge', count: 1, verticalOffset: -72, purpose: 'Catamaran route edge guard' },
      { id: 'catamaran-edge-exit', x: 21680, styles: ['dock'], type: 'coconut', surfaceKind: 'catamaran-edge', count: 1, purpose: 'Catamaran route edge guard' },
    ];
    surfaceEncounterSpecs.forEach((spec) => addIslandFormation(spec));

    const catamaranDropCorridor = { start: 17180, end: 21240 };
    const surfaceEnemies = world.enemies.filter((enemy) => enemy.surfaceKind);
    game.world2EncounterAudit = {
      sourceVersion: SOURCE_VERSION,
      level: '2-1',
      surfaceEnemies: surfaceEnemies.length,
      surfaceKinds: [...new Set(surfaceEnemies.map((enemy) => enemy.surfaceKind))],
      platformBound: surfaceEnemies.filter((enemy) => enemy.platform === world.platforms.find((platform) => platform === enemy.platform)).length,
      catamaranDropCorridor,
      enemiesInCatamaranDropCorridor: surfaceEnemies.filter((enemy) => enemy.x >= catamaranDropCorridor.start && enemy.x <= catamaranDropCorridor.end).length,
      groundPatrolAudit,
      comboPatrolAudit,
    };

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

  function loadProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      const island = JSON.parse(localStorage.getItem('jumpinForTacosLevel2ProgressV1') || '{}');
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
      localStorage.setItem('jumpinForTacosLevel2ProgressV1', JSON.stringify({ personalBest: game.personalBest }));
    } catch {
      // Storage is optional.
    }
  }

  function updatePersonalBest() {
    const best = game.personalBest;
    ui.personalBestText.textContent = best.runs
      ? `Island best: ${best.score.toLocaleString()} points • ${formatTime(best.time)} • ${best.medal}`
      : 'Your first island run sets the record!';
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
    buildWorld();
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
      boat: { state: 'idle', x: 0, speed: 0, dropTimer: 0, launcherPulse: 0, catches: 0 },
      cannonballs: [],
      tideY: 474, confetti: [], particles: [], impactTexts: [], fireworks: [],
      cameraShake: 0, hitStop: 0, celebrationTime: 0, partyBeat: -1,
      settingsOpen: false, respawn: heroCore.createRespawnState(),
      respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null,
      activeMusic: null, musicTransition: null,
      musicTransitionCount: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
      coveExploration: createCoveExplorationState(),
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
      game.musicTransition = { fromName, toName: name, from, to: next, elapsed: 0, duration: 3, fromGain: from.volume / Math.max(0.001, base) };
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
      player.y = previewStartY;
      game.cameraX = clamp(player.x - canvas.width * 0.42, 0, WORLD_WIDTH - canvas.width);
    }
    if (previewPhase2Ready) {
      const entry = coveExplorationPlan.find((candidate) => candidate.id === previewPhase2Ready)
        || (previewPhase2Ready === secretGrottoPlan.id ? secretGrottoPlan : null);
      if (entry) {
        const routePlatforms = world.platforms
          .filter((platform) => platform.phase2Discovery === entry.id)
          .sort((a, b) => (a.phase2Waypoint || 0) - (b.phase2Waypoint || 0));
        const platform = routePlatforms.at(-1);
        if (platform) {
          player.x = platform.x + Math.min(28, platform.w * .25);
          player.y = platform.y - player.h;
          player.grounded = true;
          player.platform = platform;
          const state = coveExplorationStateForEntry(entry);
          if (state) state.progress = Math.max(0, (platform.phase2Waypoint || 1) - 1);
          game.cameraX = clamp(player.x - canvas.width * .42, 0, WORLD_WIDTH - canvas.width);
        }
      }
    }
    if (previewAutoRun) keys.right = true;
    unlockAudio();
    playAudio('ui.start');
    setMusic(currentSection().music, true);
    showMessage('SHIMMERING SHORES — SURF THE TACO TRAIL!', 2.4);
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
    window.addEventListener('jft:controlleraction', (event) => {
      const { action, pressed } = event.detail || {};
      if (action === 'left') keys.left = Boolean(pressed);
      if (action === 'right') keys.right = Boolean(pressed);
      if (action === 'jump') {
        if (pressed) queueJump();
        else keys.jump = false;
      }
    });
    window.addEventListener('jft:controllerstate', (event) => {
      const detail = event.detail || {};
      if (detail.connected === false) return;
      keys.left = Boolean(detail.left);
      keys.right = Boolean(detail.right);
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
    if (previewNoDamage) return;
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
      const superStarted = previewNormalOnly ? false : sharedAbilities.collectTaco(game.abilities, item.type, { position: audioPosition(item.x + item.w / 2) });
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
      if (game.boat.catches % 6 === 0) showMessage(`CATAMARAN CATCH ×${game.boat.catches}!`, 1);
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
    const superStarted = previewNormalOnly ? false : sharedAbilities.splatEnemy(game.abilities, { position: audioPosition(enemy.x + enemy.w / 2) });
    if (superStarted) announceSuper(enemy.x);
    if (stomped) player.vy = -heroPhysics.enemyBounceVelocity;
    game.hitStop = 0.045;
    game.cameraShake = Math.max(game.cameraShake, 7 + game.splatCombo);
    playAudio(stomped ? 'combat.enemyStomp' : 'combat.enemySplat', {
      enemyType: enemy.type,
      combo: Math.max(1, game.splatCombo),
      position: audioPosition(enemy.x + enemy.w / 2),
    });
    spawnBurst(enemy.x - game.cameraX + enemy.w / 2, enemy.y + enemy.h / 2, enemy.type === 'puffer' ? '#63e7ff' : '#ff8a75', 28);
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

  function catamaranRearLauncherOrigin(boat = game.boat) {
    return {
      x: boat.x + CATAMARAN_VISUAL.launcherXOffset,
      y: game.tideY + CATAMARAN_VISUAL.launcherYOffset,
    };
  }

  function spawnBoatTaco() {
    const origin = catamaranRearLauncherOrigin();
    addItem(origin.x, origin.y, 'taco', {
      bonusReward: true, dynamic: true, boatDrop: true,
      vx: -150 - seeded() * 90, vy: -270 - seeded() * 140, angle: 0,
    });
    game.boat.launcherPulse = visualScale.tacoLauncher.pulseSeconds;
    playAudio('vehicle.tacoDrop', {
      vehicleType: 'catamaran',
      position: audioPosition(origin.x),
    });
  }

  function updateBoat(dt) {
    const inZone = player.x > 16850 && player.x < 21550;
    const boat = game.boat;
    boat.launcherPulse = Math.max(0, boat.launcherPulse - dt);
    if (inZone && boat.state === 'idle') {
      boat.state = 'entering'; boat.x = game.cameraX - 380; boat.speed = 520;
      showMessage('OLIVIA’S TACO CATAMARAN INCOMING!', 2.2);
      playAudio('vehicle.approach', { vehicleType: 'catamaran', position: -0.8 });
    }
    if (boat.state === 'entering') {
      const target = player.x + 300;
      boat.speed = Math.min(1150, boat.speed + 900 * dt);
      boat.x = Math.min(target, boat.x + boat.speed * dt);
      if (boat.x >= target - 2) {
        boat.state = 'active'; boat.dropTimer = 0.08;
        startVehicleLoop('catamaran', audioPosition(boat.x));
        showMessage('TIDAL TACO DROP! CATCH THE CRUNCH!', 2);
      }
    } else if (boat.state === 'active') {
      boat.x = lerp(boat.x, Math.min(21720, player.x + 300 + Math.sin(game.levelTime * 3.4) * 36), Math.min(1, dt * 4.4));
      boat.dropTimer -= dt;
      if (boat.dropTimer <= 0) {
        boat.dropTimer = 0.22 + seeded() * 0.08;
        spawnBoatTaco();
        if (seeded() > 0.62) spawnBoatTaco();
      }
      if (!inZone || player.x >= 21500) {
        boat.state = 'escaping'; boat.speed = 800;
        stopVehicleLoop();
        showMessage('OLIVIA: SEA YOU AT THE FIESTA!', 1.8);
        playAudio('vehicle.depart', { vehicleType: 'catamaran', position: audioPosition(boat.x) });
      }
    } else if (boat.state === 'escaping') {
      boat.speed = Math.min(1900, boat.speed + 1800 * dt);
      boat.x += boat.speed * dt;
      if (boat.x - game.cameraX > canvas.width + 420) boat.state = 'done';
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
    for (const cannon of world.cannons) {
      if (Math.abs(player.x - cannon.x) > 760) continue;
      cannon.timer -= dt;
      if (cannon.timer <= 0) {
        cannon.timer = 2.25 + seeded() * 0.55;
        const direction = player.x < cannon.x ? -1 : 1;
        game.cannonballs.push({
          x: cannon.x + direction * 24, y: cannon.y - 12, w: 30, h: 30,
          vx: direction * (180 + seeded() * 70), vy: -410 - seeded() * 100,
          rotation: 0, life: 4,
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

  function coveExplorationRewardSurface(entry) {
    const platform = world.platforms.find((candidate) => candidate.id === entry.rewardPlatformId);
    if (!platform) return null;
    const itemSize = 24;
    const padding = 14;
    return {
      platform,
      platformId: platform.id,
      top: platform.y,
      center: platform.x + platform.w * .5,
      safeLeft: platform.x + padding,
      safeRight: platform.x + platform.w - padding - itemSize,
    };
  }

  function spawnCoveExplorationRewards(entry, state) {
    if (!state || state.rewardSpawned) return false;
    const surface = coveExplorationRewardSurface(entry);
    if (!surface) return false;
    const secret = entry.id === secretGrottoPlan.id;
    const rainbowCount = secret ? 2 : 0;
    const columns = Math.max(1, Math.min(8, entry.bonusTacos));
    const slotSpacing = columns >= 8 ? 24 : 28;
    const launchX = entry.rewardX - 12;
    const launchY = entry.rewardY;
    for (let index = 0; index < entry.bonusTacos; index += 1) {
      const row = Math.floor(index / columns);
      const rowStart = row * columns;
      const rowLength = Math.min(columns, entry.bonusTacos - rowStart);
      const column = index - rowStart;
      const targetX = clamp(surface.center - ((rowLength - 1) * slotSpacing + 24) * .5 + column * slotSpacing, surface.safeLeft, surface.safeRight);
      const targetY = surface.top - 31 - row * 27;
      addItem(launchX, launchY, 'taco', {
        bonusReward: true,
        dynamic: true,
        explorationReward: true,
        phase2Discovery: entry.id,
        rewardFlight: {
          elapsed: -index * .024,
          duration: .58 + column * .035 + row * .08,
          startX: launchX,
          startY: launchY,
          targetX,
          targetY,
          arc: secret ? 52 + row * 8 : 82 + row * 13,
          platformId: surface.platformId,
        },
        rewardLanding: {
          platformId: surface.platformId,
          surfaceY: surface.top,
          targetX,
          targetY,
          safeLeft: surface.safeLeft,
          safeRight: surface.safeRight,
          settled: false,
        },
        vx: 0,
        vy: 0,
        angle: index * .58,
      });
    }
    for (let index = 0; index < rainbowCount; index += 1) {
      const targetX = clamp(surface.center - 16 + (index - .5) * 56, surface.safeLeft, surface.safeRight);
      const targetY = surface.top - 36;
      addItem(launchX, launchY, 'rainbow', {
        bonusReward: true,
        dynamic: true,
        rainbowReward: true,
        explorationReward: true,
        phase2Discovery: entry.id,
        rewardFlight: {
          elapsed: -(entry.bonusTacos + index) * .024,
          duration: .82 + index * .1,
          startX: launchX,
          startY: launchY,
          targetX,
          targetY,
          arc: 116 + index * 14,
          platformId: surface.platformId,
        },
        rewardLanding: {
          platformId: surface.platformId,
          surfaceY: surface.top,
          targetX,
          targetY,
          safeLeft: surface.safeLeft,
          safeRight: surface.safeRight,
          settled: false,
        },
        vx: 0,
        vy: 0,
        angle: index * .8,
      });
    }
    state.rewardSurfaceId = surface.platformId;
    state.rewardSpawned = true;
    state.rewardSpawnCount += 1;
    return true;
  }

  function setCoveExplorationBanner(entry) {
    const secret = entry.id === secretGrottoPlan.id;
    const duration = secret ? 3.45 : 2.25;
    game.coveExploration.completionBanner = {
      eyebrow: secret ? 'TRUE COVE SECRET' : entry.id === 'coconut-crown-canopy' ? 'OPTIONAL CANOPY SPECTACLE' : entry.id === 'shipwreck-mast-run' ? 'OPTIONAL RIGGING RUN' : 'OPTIONAL ISLAND ROUTE',
      title: entry.completionTitle,
      reward: entry.rewardLabel,
      mode: secret ? 'secret' : entry.presentation,
      timer: duration,
      maxTimer: duration,
    };
  }

  function completeCoveExplorationEntry(entry) {
    const state = coveExplorationStateForEntry(entry);
    if (!state || state.completed) return false;
    state.revealed = true;
    state.completed = true;
    state.completedAt = game.levelTime;
    state.completionCount += 1;
    state.environmentEnergized = true;
    state.spectacleTimer = state.spectacleMaxTimer = entry.id === secretGrottoPlan.id ? 3.6 : 2.9;
    game.score += entry.score;
    spawnCoveExplorationRewards(entry, state);
    if (entry.id !== 'wavewatch-lookout') setCoveExplorationBanner(entry);

    const secret = entry.id === secretGrottoPlan.id;
    const screenX = entry.trigger.x + entry.trigger.w * .5 - game.cameraX;
    const centerY = entry.trigger.y + entry.trigger.h * .5;
    const label = secret ? 'GROTTO JACKPOT!' : entry.id === 'wavewatch-lookout' ? 'ROBERT & CORKY • WAVEWATCH' : entry.completionTitle.replace(/!+$/, '');
    impactText(entry.rewardX, Math.max(-10, entry.rewardY - 16), label, secret ? '#ffe17f' : entry.id === 'wavewatch-lookout' ? '#63e7ff' : '#fff4bd', secret ? 30 : 22);
    spawnConfetti(screenX, Math.max(30, centerY), game.reducedShake ? (secret ? 50 : 26) : (secret ? 118 : entry.id === 'coconut-crown-canopy' ? 78 : 58));
    ['#63e7ff', '#ff718f', '#ffe17f'].forEach((color, index) => spawnBurst(screenX, Math.max(28, centerY - index * 8), color, game.reducedShake ? 10 : secret ? 34 + index * 7 : 18 + index * 3));
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : secret ? 9 : 4);

    if (entry.id === 'coconut-crown-canopy') {
      playAudio('ability.coconutBounce', { position: audioPosition(entry.rewardX), pitchCents: -110, gain: .82 });
      playAudio('level.celebrationPulse', { position: audioPosition(entry.rewardX), pitchCents: 45 });
    } else if (entry.id === 'waterfall-wall') {
      playAudio('surf.obstacleClear', { position: audioPosition(entry.rewardX), pitchCents: 30 });
      playAudio('checkpoint.activate', { position: audioPosition(entry.rewardX), pitchCents: 85, gain: .84 });
    } else if (entry.id === 'shipwreck-mast-run') {
      playAudio('vehicle.drop', { vehicleType: 'catamaran', position: audioPosition(entry.rewardX), pitchCents: -35 });
      playAudio('level.celebrationPulse', { position: audioPosition(entry.rewardX), pitchCents: 90 });
    } else if (entry.id === 'wavewatch-lookout') {
      game.coveExploration.dialogue = {
        speaker: 'ROBERT',
        companion: 'CORKY',
        message: ROBERT_WAVEWATCH_DIALOGUE,
        reward: entry.rewardLabel,
        timer: 5.2,
        maxTimer: 5.2,
      };
      playAudio('surf.oliviaPass', { position: audioPosition(entry.rewardX), pitchCents: -80, gain: .72 });
      playAudio('level.celebrationPulse', { position: audioPosition(entry.rewardX), pitchCents: 20, gain: .8 });
    } else {
      state.reveal = .01;
      spawnFirework();
      spawnFirework();
      playAudio('pinata.break', { position: audioPosition(entry.rewardX), combo: 5 });
      playAudio('pinata.jackpotSparkle', { position: audioPosition(entry.rewardX), pitchCents: 130 });
      playAudio('collect.rainbowTaco', { position: audioPosition(entry.rewardX), pitchCents: 90 });
    }
    return true;
  }

  function updateCoveExploration(dt) {
    const exploration = game.coveExploration;
    if (!exploration) return;
    if (exploration.completionBanner) {
      exploration.completionBanner.timer = Math.max(0, exploration.completionBanner.timer - dt);
      if (exploration.completionBanner.timer <= 0) exploration.completionBanner = null;
    }
    if (exploration.dialogue) {
      exploration.dialogue.timer = Math.max(0, exploration.dialogue.timer - dt);
      if (exploration.dialogue.timer <= 0) exploration.dialogue = null;
    }
    for (const entry of coveExplorationPlan) {
      const state = coveExplorationStateForEntry(entry);
      if (!state) continue;
      state.spectacleTimer = Math.max(0, state.spectacleTimer - dt);
      if (player.platform?.phase2Discovery === entry.id) {
        state.revealed = true;
        if (!state.arrivalAcknowledged) {
          state.arrivalAcknowledged = true;
          showMessage(entry.arrivalTitle, 1.05);
        }
        const waypoint = Number(player.platform.phase2Waypoint) || 0;
        if (waypoint > state.progress) {
          state.progress = waypoint;
          if (waypoint < entry.waypointCount) {
            const prefix = entry.id === 'coconut-crown-canopy' ? 'CANOPY' : entry.id === 'waterfall-wall' ? 'WATERFALL' : entry.id === 'shipwreck-mast-run' ? 'RIGGING' : 'LOOKOUT';
            impactText(player.x + player.w * .5, Math.max(-12, player.y - 7), `${prefix} ${waypoint}/${entry.waypointCount}`, entry.id === 'shipwreck-mast-run' ? '#ff718f' : '#63e7ff', 17);
            playAudio('checkpoint.activate', { position: audioPosition(player.x), pitchCents: -80 + waypoint * 48, gain: .66 });
          }
        }
      }
      if (!state.completed && state.progress >= entry.waypointCount && intersects(player, entry.trigger)) completeCoveExplorationEntry(entry);
    }

    const secret = exploration.secret;
    secret.spectacleTimer = Math.max(0, secret.spectacleTimer - dt);
    if (secret.completed) secret.reveal = Math.min(1, secret.reveal + dt * 2.1);
    if (player.platform?.phase2Discovery === secretGrottoPlan.id) {
      const parent = exploration.destinations['waterfall-wall'];
      secret.revealed = true;
      secret.progress = Math.max(secret.progress, Number(player.platform.phase2Waypoint) || 0);
      if (!secret.arrivalAcknowledged) {
        secret.arrivalAcknowledged = true;
        impactText(player.x + player.w * .5, Math.max(22, player.y - 8), '...BEHIND THE WATER?', '#fff4bd', 18);
        playAudio('pinata.jackpotSparkle', { position: audioPosition(player.x), pitchCents: -90, gain: .58 });
      }
      if (!secret.completed && parent.progress >= secretGrottoPlan.requiredParentProgress && secret.progress >= secretGrottoPlan.waypointCount && intersects(player, secretGrottoPlan.trigger)) completeCoveExplorationEntry(secretGrottoPlan);
    }

    if (previewHost && previewPhase2Complete) {
      const entry = coveExplorationPlan.find((candidate) => candidate.id === previewPhase2Complete);
      const state = coveExplorationStateForEntry(entry);
      if (entry && state && !state.completed) completeCoveExplorationEntry(entry);
    }
    if (previewHost && previewPhase2Secret && !secret.completed) {
      exploration.destinations['waterfall-wall'].progress = secretGrottoPlan.requiredParentProgress;
      completeCoveExplorationEntry(secretGrottoPlan);
    }
    if (previewHost && previewPowerDown && previewSuper && !exploration.previewPowerDownTriggered && game.levelTime > .25) {
      exploration.previewPowerDownTriggered = true;
      hurtPlayer(player.x + 120);
    }
  }

  function updateCoveExplorationCamera(dt) {
    const exploration = game.coveExploration;
    if (!exploration) return;
    const entries = [...coveExplorationPlan, secretGrottoPlan];
    const inExplorationRange = entries.some((entry) => player.x >= entry.routeRange[0] - 160 && player.x <= entry.routeRange[1] + 160);
    const scriptedSurf = game.surf.phase === 'riding' || game.surf.phase === 'landing';
    const cameraAllowed = game.state !== 'celebrating' && !scriptedSurf && game.boat.state !== 'active';
    exploration.cameraTargetLift = cameraAllowed && inExplorationRange ? clamp((286 - player.y) * .62, 0, 182) : 0;
    if (exploration.dialogue) exploration.cameraTargetLift = Math.max(exploration.cameraTargetLift, 118);
    exploration.cameraLift = lerp(exploration.cameraLift, exploration.cameraTargetLift, Math.min(1, dt * (exploration.cameraTargetLift > exploration.cameraLift ? 5.8 : 4.2)));
  }

  function updateDynamicItems(dt) {
    for (const item of world.collectibles) {
      if (!item.dynamic || item.collected) continue;
      if (item.rewardFlight) {
        const flight = item.rewardFlight;
        flight.elapsed += dt;
        if (flight.elapsed < 0) continue;
        const progress = clamp(flight.elapsed / flight.duration, 0, 1);
        const eased = smoothstep(progress);
        item.x = lerp(flight.startX, flight.targetX, eased);
        item.y = lerp(flight.startY, flight.targetY, eased) - Math.sin(progress * Math.PI) * flight.arc;
        item.angle = (item.angle || 0) + dt * 8;
        if (progress >= 1) {
          item.x = flight.targetX;
          item.y = flight.targetY;
          item.angle = 0;
          item.rewardFlight = null;
          item.dynamic = false;
          if (item.rewardLanding) item.rewardLanding.settled = true;
        }
        continue;
      }
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

    const surfing = game.surf.phase === 'riding';
    const surfLanding = game.surf.phase === 'landing';
    if (previewAutoRun) keys.right = true;
    const acceleration = player.grounded ? 1250 : 780;
    const maxSpeed = surfing || surfLanding ? 430 : game.pepperTimer > 0 ? 385 : 255;
    if (keys.left && !surfing && !surfLanding) { player.vx -= acceleration * dt; player.dir = -1; }
    if (keys.right) { player.vx += acceleration * dt; player.dir = 1; }
    if (!keys.left && !keys.right && !surfing && !surfLanding) player.vx *= player.grounded ? 0.79 : 0.94;
    if (surfing) { player.vx = Math.max(player.vx, 352); player.dir = 1; }
    if (surfLanding) { player.vx = Math.max(player.vx, 300); player.dir = 1; }
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

    if (previewAutoJump && player.grounded) {
      queueJump();
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
    setMusic('fiesta');
    const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
    const bonus = Math.round(2500 + completion * 3000 + game.goldenCollected * 600 + game.boat.catches * 35 + (game.wave.done ? 1800 : 0));
    game.score += bonus;
    showMessage('MOONLIT ISLAND FIESTA — MAXIMUM CRUNCH!', 4);
    spawnConfetti(canvas.width / 2, 150, game.reducedShake ? 90 : 240);
    for (let i = 0; i < (game.reducedShake ? 5 : 14); i += 1) spawnFirework();
    playAudio('goal.enter');
  }

  function presentResults() {
    const seconds = (game.finishTime - game.startTime) / 1000;
    const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
    const medal = game.goldenCollected === game.totalGolden && game.wave.done && completion > 0.75 ? 'ISLAND LEGEND'
      : game.wave.done && game.boat.catches >= 18 ? 'TIDAL TACO STAR'
      : completion > 0.45 ? 'COVE CRUISER' : 'BEACH BEGINNER';
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
    ui.resultWave.textContent = game.wave.done ? 'Surfed + landed!' : 'Reached the beach';
    ui.winText.textContent = `You crossed five island acts, surfed the final moonlit wave, cleared ${game.surf.clearedObstacles}/5 obstacles, found ${game.rainbowCollected}/${game.totalRainbow} Rainbow Shells, and finished Coconut Crunch Cove in ${formatTime(seconds)}.`;
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
      updateCoveExploration(dt);
      updateWaveChase(dt);
      updateBoat(dt);
      updateCoconutCannons(dt);

      for (const item of world.collectibles) {
        if (item.collected) continue;
        if (item.rewardFlight) continue;
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
        showMessage(`${section.name.toUpperCase()} — ${['SURF THE SUNSHINE!', 'BOUNCE ABOVE THE PALMS!', 'RIDE THE TACO TIDE!', 'WATCH OLIVIA—THEN RIDE THE BIG ONE!', 'FOLLOW THE GLOW TO THE FIESTA!'][sectionIndex]}`, 2.5);
        spawnConfetti(canvas.width * 0.6, 180, 55);
      }

      const followOffset = game.wave.active ? 0.3 : game.boat.state === 'active' || game.pepperTimer > 0 ? 0.34 : 0.42;
      const targetCamera = clamp(player.x - canvas.width * followOffset, 0, WORLD_WIDTH - canvas.width);
      game.cameraX = lerp(game.cameraX, targetCamera, Math.min(1, dt * 9));
      maybeFinish();
    }
    if (game.state === 'celebrating') updateCelebration(dt);
    updateCoveExplorationCamera(dt);
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
    const sourceY = (image.height - sourceHeight) * (section.id === 'canopy' ? 0.32 : 0.48);
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
    grade.addColorStop(0, blend.to.id === 'fiesta' ? 'rgba(29,13,76,.08)' : 'rgba(16,81,111,.015)');
    grade.addColorStop(0.62, 'rgba(6,37,60,0)');
    grade.addColorStop(1, 'rgba(4,28,46,.14)');
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (blend.to.id === 'canopy') {
      ctx.globalAlpha = 0.11 + Math.sin(time * 0.0013) * 0.025;
      for (let shaft = 0; shaft < 4; shaft += 1) {
        const x = 80 + shaft * 270 - (game.cameraX * 0.025) % 180;
        const light = ctx.createLinearGradient(x, 0, x + 160, 420);
        light.addColorStop(0, 'rgba(255,246,172,.5)'); light.addColorStop(1, 'rgba(255,246,172,0)');
        ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 88, 0); ctx.lineTo(x + 248, 430); ctx.lineTo(x + 128, 430); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
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

  function drawBackground(time) {
    const section = currentSection(player.x);
    const paletteMap = {
      shore: ['#38bde5', '#80e3dc', '#ffd394', '#fff1bd'],
      canopy: ['#159a8a', '#43cfa4', '#a9e8b4', '#ffe09a'],
      tides: ['#145b91', '#3caec1', '#91e2db', '#d9f3c4'],
      surge: ['#061b42', '#185783', '#397fa0', '#8d6d9f'],
      fiesta: ['#071b46', '#273b87', '#78488f', '#ff70a3'],
    };
    const paletteBlend = blendedPalette(paletteMap, player.x);
    const palettes = paletteBlend.colors;
    game.backgroundBlend = { from: paletteBlend.from, to: paletteBlend.to, amount: Number(paletteBlend.amount.toFixed(3)), distance: 720 };
    const isNight = section.id === 'surge' || section.id === 'fiesta';
    const paintedEnvironment = drawPaintedEnvironment(time);
    if (paintedEnvironment) {
      // The approved environment plates already contain the island skyline,
      // palms, temples, clouds, sun/moon, and depth treatment. Returning here
      // keeps the obsolete procedural ridges and palms from sitting on top of
      // that painted composition while preserving the complete fallback below.
      game.decorativeMidgroundRemoved = true;
      return;
    }
    game.decorativeMidgroundRemoved = false;
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
      shore: ['#fff0a8', '#ef9a52', '#7b3f35'],
      canopy: ['#b9f28b', '#48b966', '#24533f'],
      tides: ['#b7ead0', '#53c9bd', '#264f59'],
      surge: ['#bfffee', '#55c9d4', '#27355e'],
      fiesta: ['#ffe681', '#c95f98', '#35245f'],
    }[sectionId] || ['#fff0a8', '#ef9a52', '#7b3f35'];
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
      ? Math.max(platform.h, islandPlatformVisualProfile.groundMinimumHeight)
      : Math.max(platform.h + islandPlatformVisualProfile.elevatedExtraDepth, islandPlatformVisualProfile.elevatedMinimumHeight);
    const visualTop = screenY - 3;
    const radius = ground ? 10 : Math.min(18, visualHeight * 0.34);
    const tileWidth = ground ? 304 : 224;
    const sourceTileWidth = ground ? 600 : 520;
    const maxSourceX = row[0] + row[2] - sourceTileWidth;
    const colors = paintedTerrainColors(sectionId);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath();
    ctx.roundRect(screenX, visualTop, platform.w, visualHeight, radius);
    ctx.clip();
    for (let offset = 0, tile = 0; offset < platform.w; offset += tileWidth, tile += 1) {
      const drawWidth = Math.min(tileWidth + 1, platform.w - offset);
      const seededOffset = Math.abs(Math.floor(platform.x * 0.37 + tile * 419 + rowIndex * 173));
      const sourceX = row[0] + (seededOffset % Math.max(1, maxSourceX - row[0]));
      ctx.drawImage(atlas, sourceX, row[1], sourceTileWidth, row[3], screenX + offset, visualTop, drawWidth, visualHeight);
    }
    const shade = ctx.createLinearGradient(0, visualTop, 0, visualTop + visualHeight);
    shade.addColorStop(0, 'rgba(255,255,255,.08)');
    shade.addColorStop(0.3, 'rgba(255,255,255,0)');
    shade.addColorStop(1, ground ? 'rgba(8,24,37,.18)' : 'rgba(8,24,37,.28)');
    ctx.fillStyle = shade; ctx.fillRect(screenX, visualTop, platform.w, visualHeight);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;

    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(screenX, visualTop, platform.w, visualHeight, radius); ctx.stroke();
    ctx.strokeStyle = colors[0];
    ctx.globalAlpha = 0.74;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(screenX + radius, screenY); ctx.lineTo(screenX + platform.w - radius, screenY); ctx.stroke();
    ctx.globalAlpha = 1;

    if (!ground) {
      ctx.fillStyle = 'rgba(5,29,45,.24)';
      ctx.beginPath(); ctx.ellipse(screenX + platform.w / 2, visualTop + visualHeight + 9, Math.max(28, platform.w * .38), 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = sectionId === 'tides' || sectionId === 'surge' ? 'rgba(190,255,244,.54)' : 'rgba(255,225,127,.4)';
      ctx.lineWidth = 2;
      for (const endX of [screenX + 8, screenX + platform.w - 8]) {
        ctx.beginPath(); ctx.moveTo(endX, visualTop + 8); ctx.lineTo(endX, visualTop + visualHeight - 8); ctx.stroke();
      }
    }

    if (platform.moving) {
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      const pulse = 3 + Math.sin(time * 0.008 + platform.phase) * 1.5;
      for (const markerX of [screenX + 12, screenX + platform.w - 12]) {
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(markerX, screenY + platform.h / 2, pulse, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    game.foregroundRemasterReady = true;
    return true;
  }

  function drawPlatform(platform, time) {
    if (!visibleWorldX(platform.x, platform.w, 80)) return;
    // Phase 2 collisions sit exactly on painted landmark shelves. Keeping
    // their collision rectangles invisible avoids duplicate/false platforms.
    if (platform.phase2ArtSurface) return;
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

  function drawCoveExplorationBackdrop() {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    Object.values(coveExplorationArt).forEach((placement) => {
      if (!visibleWorldX(placement.x, placement.w, 180)) return;
      const image = images[placement.image];
      if (!image) return;
      ctx.drawImage(image, placement.x - game.cameraX, placement.y, placement.w, placement.h);
    });
    ctx.restore();
  }

  function drawCoveExplorationNameplate(worldX, y, title, subtitle, accent, active) {
    if (!visibleWorldX(worldX - 150, 300, 80)) return;
    const x = worldX - game.cameraX;
    const width = 286;
    const panel = ctx.createLinearGradient(x - width * .5, y, x + width * .5, y + 52);
    panel.addColorStop(0, 'rgba(6,35,50,.88)');
    panel.addColorStop(1, active ? 'rgba(24,91,85,.93)' : 'rgba(20,58,72,.84)');
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = active ? 17 : 8;
    roundedPanel(x - width * .5, y, width, 52, 15, panel, accent, active ? 3 : 2);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff8dc';
    ctx.font = '900 14px Arial';
    ctx.fillText(title, x, y + 21);
    ctx.fillStyle = accent;
    ctx.font = '900 10px Arial';
    ctx.fillText(subtitle, x, y + 39);
    ctx.restore();
  }

  function drawCoveExplorationAccents(time) {
    const exploration = game.coveExploration;
    if (!exploration) return;
    const canopy = exploration.destinations['coconut-crown-canopy'];
    const waterfall = exploration.destinations['waterfall-wall'];
    const shipwreck = exploration.destinations['shipwreck-mast-run'];
    const wavewatch = exploration.destinations['wavewatch-lookout'];
    const secret = exploration.secret;

    drawCoveExplorationNameplate(8386, 54, 'COCONUT CROWN CANOPY', canopy.completed ? 'COCONUT CASCADE • FLOWING' : 'FOLLOW THE CROWN', canopy.completed ? '#ffe17f' : '#55e6a5', canopy.completed);
    drawCoveExplorationNameplate(15095, 28, 'WATERFALL WALL', waterfall.completed ? 'CREST ROUTE • CLEARED' : 'CLIMB THE SPRAY', waterfall.completed ? '#ffe17f' : '#63e7ff', waterfall.completed);
    drawCoveExplorationNameplate(22445, 72, 'SHIPWRECK MAST RUN', shipwreck.completed ? 'RIGGING • SECURED' : 'CLIMB THE RIGGING', shipwreck.completed ? '#ffe17f' : '#ff718f', shipwreck.completed);
    drawCoveExplorationNameplate(24205, 166, 'WAVEWATCH LOOKOUT', wavewatch.completed ? 'ENDLESS SUMMER • ALWAYS' : 'THE SWELL LOOKS GOOD', wavewatch.completed ? '#ffe17f' : '#63e7ff', wavewatch.completed);

    if (visibleWorldX(7900, 930, 120) && canopy.environmentEnergized) {
      const intensity = canopy.spectacleMaxTimer ? clamp(canopy.spectacleTimer / canopy.spectacleMaxTimer, 0, 1) : 0;
      ctx.save();
      for (let index = 0; index < 8; index += 1) {
        const cycle = (time * .00042 + index * .137) % 1;
        const x = 8360 - game.cameraX + Math.sin(cycle * Math.PI * 3 + index) * (54 + index * 4);
        const y = 34 + cycle * 330;
        ctx.globalAlpha = .34 + intensity * .58;
        ctx.fillStyle = '#9b633e';
        ctx.strokeStyle = '#ffe17f';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 7 + (index % 2), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.globalAlpha = .35 + intensity * .4;
      ctx.strokeStyle = '#b8fff5';
      ctx.lineWidth = 2;
      for (let line = 0; line < 4; line += 1) {
        ctx.beginPath();
        ctx.moveTo(8040 - game.cameraX, 82 + line * 65);
        ctx.bezierCurveTo(8210 - game.cameraX, 48 + line * 60, 8510 - game.cameraX, 110 + line * 64, 8730 - game.cameraX, 70 + line * 66);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (visibleWorldX(14730, 827, 120)) {
      const veilAlpha = secret.completed ? .1 : .25;
      const curtain = ctx.createLinearGradient(15145 - game.cameraX, 0, 15375 - game.cameraX, 0);
      curtain.addColorStop(0, 'rgba(184,255,245,0)');
      curtain.addColorStop(.45, `rgba(99,231,255,${veilAlpha})`);
      curtain.addColorStop(.75, `rgba(216,255,247,${veilAlpha * .9})`);
      curtain.addColorStop(1, 'rgba(99,231,255,0)');
      ctx.save();
      ctx.fillStyle = curtain;
      ctx.fillRect(15140 - game.cameraX, 16, 250, 220);
      ctx.strokeStyle = `rgba(221,255,250,${.28 + Math.sin(time * .01) * .06})`;
      ctx.lineWidth = 2;
      for (let line = 0; line < 5; line += 1) {
        const x = 15172 - game.cameraX + line * 40;
        ctx.beginPath();
        ctx.moveTo(x, 28);
        ctx.bezierCurveTo(x - 10, 86, x + 12, 142, x - 4, 220);
        ctx.stroke();
      }
      const glint = .35 + Math.max(0, Math.sin(time * .008)) * .65;
      ctx.globalAlpha = secret.completed ? 1 : glint * .72;
      drawStar(15320 - game.cameraX, 125, secret.completed ? 8 : 4.5, secret.completed ? '#ffe17f' : '#fff4bd');
      ctx.restore();
    }

    if (visibleWorldX(21800, 840, 120) && shipwreck.environmentEnergized) {
      const spin = time * .0024;
      ctx.save();
      ctx.translate(22440 - game.cameraX, 206);
      ctx.rotate(spin);
      ctx.strokeStyle = '#ffe17f';
      ctx.shadowColor = '#ff718f';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.stroke();
      for (let spoke = 0; spoke < 6; spoke += 1) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(15, 0); ctx.stroke(); }
      ctx.restore();
    }

    if (visibleWorldX(23580, 1080, 120) && wavewatch.environmentEnergized) {
      ctx.save();
      for (let index = 0; index < 7; index += 1) {
        const angle = time * .0012 + index * Math.PI * 2 / 7;
        drawStar(24210 - game.cameraX + Math.cos(angle) * (150 + index * 5), 215 + Math.sin(angle * 1.4) * 58, 2.5 + index % 3, index % 2 ? '#ffe17f' : '#63e7ff');
      }
      ctx.restore();
    }
  }

  function drawCoveExplorationForeground(time) {
    if (!visibleWorldX(15120, 300, 80) || player.x < 15110 || player.x > 15480) return;
    const secret = game.coveExploration?.secret;
    const alpha = secret?.completed ? .08 : .16;
    ctx.save();
    ctx.strokeStyle = `rgba(206,255,250,${alpha})`;
    ctx.lineWidth = 6;
    for (let line = 0; line < 4; line += 1) {
      const x = 15168 - game.cameraX + line * 48 + Math.sin(time * .008 + line) * 4;
      ctx.beginPath(); ctx.moveTo(x, 18); ctx.bezierCurveTo(x + 7, 88, x - 8, 160, x + 3, 232); ctx.stroke();
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

  function drawEnemy(enemy, time) {
    if (!enemy.alive || !visibleWorldX(enemy.x, enemy.w, 80)) return;
    if (drawRemasteredIslandEnemy(enemy, time)) return;
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

  function drawRemasteredIslandEnemy(enemy, time) {
    if (!images.enemyCast || islandEnemyRows[enemy.type] === undefined) return false;
    const cellWidth = images.enemyCast.width / 2;
    const [sourceY, sourceHeight] = islandEnemySourceRows[enemy.type];
    const stateAction = Boolean(enemy.telegraph || enemy.charging || enemy.rolling);
    const travelFrame = Math.floor(enemy.clock * (enemy.type === 'seagull' ? 7 : 5)) % 2;
    const frame = enemy.type === 'coconut' || enemy.type === 'puffer'
      ? (stateAction ? 1 : 0)
      : (stateAction ? 1 : travelFrame);
    const [drawWidth, drawHeight] = islandEnemyDrawSizes[enemy.type];
    const screenX = enemy.x - game.cameraX + enemy.w / 2;
    const contactY = enemy.y + enemy.h + 5;
    const bob = enemy.type === 'seagull'
      ? Math.sin(enemy.clock * 6.5) * 3
      : enemy.type === 'puffer'
        ? Math.sin(enemy.clock * 2.5) * 2
        : Math.abs(Math.sin(enemy.clock * 5)) * 2;
    const lean = enemy.charging ? (enemy.dir || 1) * .07
      : enemy.type === 'coconut' ? Math.sin(enemy.clock * 2.8) * .035 : 0;

    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = 'rgba(9,31,49,.72)';
    const shadowRadius = Math.min(24, Math.max(18, drawWidth * .23));
    ctx.beginPath();
    ctx.ellipse(screenX, contactY + 1, shadowRadius, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(screenX, contactY - bob);
    ctx.scale(enemy.dir < 0 ? -1 : 1, 1);
    ctx.rotate(lean);
    ctx.shadowColor = enemy.telegraph ? '#ffe17f' : 'rgba(8,27,45,.34)';
    ctx.shadowBlur = enemy.telegraph ? 17 : 5;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      images.enemyCast,
      frame * cellWidth, sourceY, cellWidth, sourceHeight,
      -drawWidth / 2, -drawHeight, drawWidth, drawHeight,
    );
    ctx.imageSmoothingEnabled = false;
    ctx.restore();
    heroCore.drawEnemyBehaviorSignals(ctx, enemy, enemy.x - game.cameraX, {
      groundOffset: 4, warningColor: '#ffe17f', chargeColor: '#ff718f', rollColor: '#63e7ff',
    });
    return true;
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

  function drawCheckpointPullOff(checkpoint, time) {
    const pad = {
      x: checkpoint.x - 44, y: GROUND_Y - 14, w: 278, h: 30,
      style: 'checkpoint-pad', ground: false, moving: false, phase: checkpoint.x * .001,
    };
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = '#061f32';
    ctx.beginPath(); ctx.ellipse(checkpoint.x - game.cameraX + 95, GROUND_Y + 10, 142, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (images.checkpointPadAtlas) {
      const source = checkpointPadSourceRows[checkpoint.look] || checkpointPadSourceRows.shell;
      const sourceWidth = 680;
      const sourceX = (Math.floor(checkpoint.x * .19) % (source[2] - sourceWidth));
      const screenX = pad.x - game.cameraX;
      const visualTop = pad.y - 4;
      const visualHeight = 58;
      ctx.imageSmoothingEnabled = true;
      ctx.beginPath(); ctx.roundRect(screenX, visualTop, pad.w, visualHeight, 14); ctx.clip();
      ctx.drawImage(images.checkpointPadAtlas, sourceX, source[1], sourceWidth, source[3], screenX, visualTop, pad.w, visualHeight);
      const shine = ctx.createLinearGradient(0, visualTop, 0, visualTop + visualHeight);
      shine.addColorStop(0, 'rgba(255,255,255,.13)'); shine.addColorStop(1, 'rgba(3,24,42,.18)');
      ctx.fillStyle = shine; ctx.fillRect(screenX, visualTop, pad.w, visualHeight);
      ctx.imageSmoothingEnabled = false;
      ctx.strokeStyle = checkpoint.accent; ctx.globalAlpha = .64; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(screenX, visualTop, pad.w, visualHeight, 14); ctx.stroke();
      ctx.globalAlpha = 1;
      if (checkpoint.look === 'lighthouse' || checkpoint.look === 'moon') {
        ctx.strokeStyle = 'rgba(190,255,244,.72)'; ctx.lineWidth = 2;
        for (let wake = 0; wake < 2; wake += 1) {
          ctx.beginPath(); ctx.ellipse(screenX + pad.w / 2, GROUND_Y + 5 + wake * 5, 120 + wake * 12, 5 + wake * 2, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
    } else {
      drawPaintedTerrainSlice(pad, time);
    }
    ctx.restore();
  }

  function drawCheckpoint(checkpoint, time) {
    if (!visibleWorldX(checkpoint.x, checkpoint.w, 260)) return;
    const x = checkpoint.x - game.cameraX;
    const y = checkpoint.y;
    const pulse = (Math.sin(time * 0.008 + checkpoint.x) + 1) * 0.5;
    drawCheckpointPullOff(checkpoint, time);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalAlpha = checkpoint.activated ? 1 : 0.88;
    ctx.fillStyle = 'rgba(7,31,48,.3)'; ctx.beginPath(); ctx.ellipse(x + 96, y + 132, 92, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = checkpoint.accent; ctx.shadowBlur = checkpoint.activated ? 22 + pulse * 8 : 7;
    const checkpointImage = images[checkpointArtKeys[checkpoint.look]];
    if (checkpointImage) {
      const floating = ['lighthouse', 'moon'].includes(checkpoint.look);
      const vehicleBob = floating ? Math.sin(time * .006 + checkpoint.x * .001) * 2.25 : 0;
      const activatedScale = checkpoint.activated ? 1 + Math.sin(time * .011) * .014 : 1;
      const drawWidth = checkpoint.look === 'canopy' ? 214 : checkpoint.look === 'lighthouse' ? 196 : 208;
      const drawHeight = drawWidth * (checkpointImage.height / checkpointImage.width);
      ctx.save();
      ctx.translate(x + 95, GROUND_Y + vehicleBob);
      ctx.scale(activatedScale, activatedScale);
      ctx.drawImage(checkpointImage, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
      ctx.restore();
      ctx.shadowBlur = 0;

      if (floating) {
        ctx.strokeStyle = 'rgba(183,255,241,.72)'; ctx.lineWidth = 3;
        for (let wake = 0; wake < 3; wake += 1) {
          ctx.globalAlpha = .72 - wake * .18; ctx.beginPath();
          ctx.ellipse(x + 95, GROUND_Y + wake * 4, 72 + wake * 13 + pulse * 5, 5 + wake * 2, 0, 0, Math.PI * 2); ctx.stroke();
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
    } else if (images.islandCheckpoints) {
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
    const checkpointOliviaImage = images[checkpointOliviaKeys[checkpoint.look]];
    if (checkpointOliviaImage) {
      const oliviaHeight = visualScale.olivia.standingHeight;
      const oliviaWidth = oliviaHeight * (checkpointOliviaImage.width / checkpointOliviaImage.height);
      const cheerFlex = 1 + Math.sin(time * .0065 + checkpoint.x * .001) * .012;
      ctx.save(); ctx.translate(x + 140, GROUND_Y); ctx.scale(1, cheerFlex);
      ctx.globalAlpha = .28; ctx.fillStyle = '#09243a'; ctx.beginPath(); ctx.ellipse(0, 2, 25, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = checkpoint.activated ? 1 : .94;
      ctx.shadowColor = checkpoint.accent; ctx.shadowBlur = checkpoint.activated ? 20 : 9;
      ctx.drawImage(checkpointOliviaImage, -oliviaWidth / 2, -oliviaHeight, oliviaWidth, oliviaHeight);
      ctx.restore();
    } else if (images.islandOlivia) {
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

  function drawCatamaranRearLauncherPulse() {
    if (game.boat.state !== 'active') return;
    const origin = catamaranRearLauncherOrigin();
    const x = origin.x - game.cameraX;
    const pulse = game.boat.launcherPulse;
    ctx.save();
    ctx.translate(x, origin.y);
    ctx.shadowColor = '#ffe17f';
    ctx.shadowBlur = pulse > 0 ? 13 : 5;
    ctx.fillStyle = '#d85a69';
    ctx.strokeStyle = '#ffe17f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -5, 17, 10, 5);
    ctx.fill();
    ctx.stroke();
    if (pulse > 0) {
      const progress = clamp(1 - pulse / visualScale.tacoLauncher.pulseSeconds, 0, 1);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = '#63e7ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-3, 0, 8 + progress * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffe17f';
      ctx.beginPath();
      ctx.arc(-3, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCatamaran(time) {
    const boat = game.boat;
    if (boat.state === 'idle' || boat.state === 'done' || !visibleWorldX(boat.x, 300, 420)) return;
    const x = boat.x - game.cameraX;
    const bob = Math.sin(time * 0.006) * 4;
    const speedStretch = boat.state === 'escaping' ? 1.25 : 1;
    const y = game.tideY - 151 + bob;
    if (images.catamaranBase) {
      const activeBase = images.catamaranLayerBase || images.catamaranBase;
      const boatImage = boat.state === 'escaping' ? images.catamaranEscape : boat.state === 'active' ? activeBase : images.catamaranBase;
      const drawW = boat.state === 'escaping' ? CATAMARAN_VISUAL.escapeWidth : CATAMARAN_VISUAL.activeWidth;
      const drawH = drawW * (boatImage.height / boatImage.width);
      ctx.save();
      ctx.globalAlpha = .25;
      ctx.fillStyle = '#062b46';
      ctx.beginPath();
      ctx.ellipse(x + drawW * .42, game.tideY + 3, drawW * .42, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = boat.state === 'escaping' ? '#ffe17f' : '#63e7ff';
      ctx.shadowBlur = boat.state === 'escaping' ? 20 : 12;
      ctx.drawImage(boatImage, x + CATAMARAN_VISUAL.leftOffset, game.tideY - drawH + 35 + bob, drawW, drawH);
      ctx.restore();
      drawCatamaranRearLauncherPulse();
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
      const y = game.tideY - SURF_OLIVIA_VISUAL.height + SURF_OLIVIA_VISUAL.baselineOffset + Math.sin(time * .008) * 4;
      ctx.save();
      ctx.shadowColor = '#63e7ff'; ctx.shadowBlur = 18;
      drawSurfCell(0, x + SURF_OLIVIA_VISUAL.leftOffset, y, SURF_OLIVIA_VISUAL.width, SURF_OLIVIA_VISUAL.height);
      ctx.restore();
      roundedPanel(x + 13, y - 4, 178, 35, 13, 'rgba(5,31,52,.92)', '#ffe17f', 3);
      ctx.fillStyle = '#fff8dc'; ctx.font = '900 12px Arial'; ctx.textAlign = 'center';
      ctx.fillText('OLIVIA: WAVE DELIVERY!', x + 102, y + 18);
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
      const oliviaHeight = visualScale.olivia.standingHeight;
      const oliviaWidth = oliviaHeight * (images.islandFiestaOlivia.width / images.islandFiestaOlivia.height);
      ctx.drawImage(images.islandFiestaOlivia, x + 153 - oliviaWidth / 2, GROUND_Y - oliviaHeight - oliviaBounce, oliviaWidth, oliviaHeight);
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
    ctx.fillStyle = '#fff8dc'; ctx.textAlign = 'center'; ctx.font = '900 12px Arial'; ctx.fillText(sections[game.sectionIndex]?.name || 'Coconut Crunch Cove', x + width / 2, y + 48);
    ctx.fillStyle = 'rgba(255,255,255,.68)'; ctx.font = '900 9px Arial'; ctx.fillText(`${Math.round(player.x).toLocaleString()} / ${WORLD_WIDTH.toLocaleString()}`, x + width / 2, y + 63);
  }

  function drawHUD(time) {
    ctx.save();
    const panel = ctx.createLinearGradient(14, 14, 342, 136); panel.addColorStop(0, 'rgba(4,31,52,.4)'); panel.addColorStop(0.6, 'rgba(7,71,86,.32)'); panel.addColorStop(1, 'rgba(34,43,88,.38)');
    roundedPanel(14, 14, 328, 126, 18, panel, 'rgba(85,230,193,.46)', 2);
    ctx.fillStyle = '#fff8dc'; ctx.font = '900 23px Arial'; ctx.fillText('Coconut Crunch Cove', 26, 42);
    ctx.font = '18px Arial'; ctx.fillText(`Score: ${game.score.toLocaleString()}`, 26, 70); ctx.fillText(`Tacos: ${game.collected}/${game.totalCollectibles}`, 26, 96);
    ctx.fillStyle = game.streak ? '#ffe17f' : 'rgba(255,255,255,.65)'; ctx.fillText(`Streak: ${game.streak}`, 208, 70);
    ctx.fillStyle = '#ffd85e'; ctx.font = '900 13px Arial'; ctx.fillText(`Golden ${game.goldenCollected}/${game.totalGolden}  •  Shells ${game.rainbowCollected}/${game.totalRainbow}`, 26, 120);
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
    if (game.splatCombo > 1) { ctx.fillStyle = '#ff718f'; ctx.fillText(`ISLAND SPLAT ×${game.splatCombo}`, 936, 100); }
    if (game.boat.state === 'active') { ctx.fillStyle = '#63e7ff'; ctx.fillText(`CATAMARAN CATCHES ${game.boat.catches}`, 936, 124); }

    if (game.messageTimer > 0 && game.state !== 'celebrating') {
      const pulse = 1 + Math.sin(time * 0.014) * 0.035;
      ctx.save(); ctx.translate(canvas.width / 2, 165); ctx.scale(pulse, pulse); ctx.textAlign = 'center';
      const size = game.message.length > 46 ? 22 : game.message.length > 34 ? 27 : 34;
      ctx.font = `900 ${size}px Arial`; ctx.strokeStyle = '#082a43'; ctx.lineWidth = 8; ctx.strokeText(game.message, 0, 0); ctx.fillStyle = sections[game.sectionIndex]?.accent || '#ffe17f'; ctx.fillText(game.message, 0, 0); ctx.restore();
    }
    if (game.state === 'celebrating') {
      ctx.textAlign = 'center'; ctx.font = '900 34px Arial'; ctx.strokeStyle = '#082a43'; ctx.lineWidth = 8; ctx.strokeText('MAXIMUM ISLAND CRUNCH!', canvas.width / 2, 170); ctx.fillStyle = '#ffe17f'; ctx.fillText('MAXIMUM ISLAND CRUNCH!', canvas.width / 2, 170);
    }
    ctx.restore();
  }

  function drawCoveExplorationCompletionBanner(time) {
    const banner = game.coveExploration?.completionBanner;
    if (!banner) return;
    const enter = clamp((banner.maxTimer - banner.timer) / .22, 0, 1);
    const exit = clamp(banner.timer / .34, 0, 1);
    const visibility = Math.min(enter, exit);
    const secret = banner.mode === 'secret';
    const compact = canvas.getBoundingClientRect().width < 520;
    const width = Math.min(secret ? (compact ? 850 : 700) : (compact ? 720 : 560), canvas.width - (compact ? 42 : 110));
    const height = secret ? (compact ? 158 : 138) : (compact ? 116 : 98);
    const x = (canvas.width - width) * .5;
    const y = canvas.height - height - 24;
    const accent = secret ? '#ffe17f' : banner.mode === 'rigging-spectacle' ? '#ff718f' : banner.mode === 'organic-spectacle' ? '#55e6a5' : '#63e7ff';
    ctx.save();
    ctx.globalAlpha = visibility;
    ctx.translate(canvas.width * .5, y + height * .5);
    if (!game.reducedShake) {
      const pop = (secret ? .9 : .96) + enter * (secret ? .1 : .04) + Math.sin(time * .014) * (secret ? .01 : .003);
      ctx.scale(pop, pop);
    }
    ctx.translate(-canvas.width * .5, -(y + height * .5));
    const panel = ctx.createLinearGradient(x, y, x + width, y + height);
    panel.addColorStop(0, secret ? 'rgba(29,67,72,.98)' : 'rgba(6,43,56,.94)');
    panel.addColorStop(.5, secret ? 'rgba(117,56,73,.99)' : 'rgba(29,83,84,.96)');
    panel.addColorStop(1, secret ? 'rgba(57,36,84,.98)' : 'rgba(43,52,90,.94)');
    ctx.shadowColor = accent;
    ctx.shadowBlur = secret ? 28 : 14;
    roundedPanel(x, y, width, height, secret ? 23 : 17, panel, accent, secret ? 5 : 3);
    ctx.shadowBlur = 0;
    if (secret) {
      for (let index = 0; index < 12; index += 1) {
        const sx = x + 34 + index * (width - 68) / 11;
        const sy = y + 18 + Math.sin(time * .013 + index) * 5;
        drawStar(sx, sy, 2.4 + index % 2, ['#ffe17f', '#ff718f', '#63e7ff'][index % 3]);
      }
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff4bd';
    ctx.font = `900 ${compact ? secret ? 17 : 15 : secret ? 13 : 11}px Arial`;
    ctx.fillText(banner.eyebrow, canvas.width * .5, y + (secret ? 29 : 22));
    ctx.fillStyle = '#fff8dc';
    ctx.font = `900 ${compact ? secret ? 38 : 31 : secret ? 33 : 27}px Arial`;
    ctx.fillText(banner.title, canvas.width * .5, y + (secret ? (compact ? 81 : 72) : (compact ? 64 : 55)));
    ctx.fillStyle = accent;
    ctx.font = `900 ${compact ? secret ? 18 : 16 : secret ? 15 : 13}px Arial`;
    ctx.fillText(banner.reward, canvas.width * .5, y + (secret ? (compact ? 126 : 111) : (compact ? 98 : 82)));
    ctx.restore();
  }

  function drawRobertWavewatchDialogue(time) {
    const dialogue = game.coveExploration?.dialogue;
    if (!dialogue) return;
    const elapsed = dialogue.maxTimer - dialogue.timer;
    const visibility = clamp(Math.min(elapsed / .2, dialogue.timer / .34), 0, 1);
    const compact = canvas.getBoundingClientRect().width < 520;
    const width = Math.min(compact ? 820 : 610, canvas.width - 42);
    const height = compact ? 146 : 126;
    const worldAnchorX = 24210 - game.cameraX;
    const x = clamp(worldAnchorX - width * .52, 21, canvas.width - width - 21);
    const y = compact ? 174 : 158;
    const tailX = clamp(worldAnchorX, x + 54, x + width - 54);
    ctx.save();
    ctx.globalAlpha = visibility;
    if (!game.reducedShake) ctx.translate(0, (1 - smoothstep(clamp(elapsed / .34, 0, 1))) * 14);
    const panel = ctx.createLinearGradient(x, y, x + width, y + height);
    panel.addColorStop(0, 'rgba(5,48,62,.97)');
    panel.addColorStop(.56, 'rgba(25,87,89,.98)');
    panel.addColorStop(1, 'rgba(70,48,87,.97)');
    ctx.fillStyle = panel;
    ctx.strokeStyle = '#63e7ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#63e7ff';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.roundRect(x, y, width, height, 22); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = panel;
    ctx.strokeStyle = '#63e7ff';
    ctx.beginPath(); ctx.moveTo(tailX - 18, y + height - 2); ctx.lineTo(tailX + 10, y + height + 24); ctx.lineTo(tailX + 24, y + height - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe17f';
    ctx.textAlign = 'left';
    ctx.font = `900 ${compact ? 17 : 14}px Arial`;
    ctx.fillText(`${dialogue.speaker} • WAVEWATCH  /  ${dialogue.companion} • GOOD DOG`, x + 26, y + 29);
    ctx.fillStyle = '#fff8dc';
    ctx.font = `900 ${compact ? 25 : 23}px Arial`;
    ctx.fillText('“Ready for an endless summer', x + 26, y + (compact ? 69 : 64));
    ctx.fillText('of tasty waves and tacos?”', x + 26, y + (compact ? 101 : 94));
    ctx.fillStyle = '#63e7ff';
    ctx.font = `900 ${compact ? 14 : 12}px Arial`;
    ctx.fillText(dialogue.reward, x + 26, y + (compact ? 130 : 116));
    for (let wave = 0; wave < 4; wave += 1) {
      const wx = x + width - 112 + wave * 20;
      const wy = y + 31 + Math.sin(time * .012 + wave) * 5;
      ctx.strokeStyle = wave % 2 ? '#ffe17f' : '#63e7ff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wx, wy, 9, Math.PI, Math.PI * 2); ctx.stroke();
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
    drawBackground(time);
    const cameraLift = game.coveExploration?.cameraLift || 0;
    ctx.save();
    ctx.translate(0, cameraLift);
    drawHazardSurface(time);
    drawCoveExplorationBackdrop(time);
    drawCatamaran(time);
    for (const platform of world.platforms) drawPlatform(platform, time);
    drawCoveExplorationAccents(time);
    for (const item of world.collectibles) drawCollectible(item, time);
    for (const checkpoint of world.checkpoints) drawCheckpoint(checkpoint, time);
    drawWaveChase(time);
    drawSurfObstacles(time);
    drawSurfIntro(time);
    drawCoconutCannons();
    drawGoal(time);
    for (const enemy of world.enemies) drawEnemy(enemy, time);
    heroCore.drawRespawnFX(ctx, game.respawn, player, game.cameraX, time, {
      vanish: '#63e7ff', vanishRing: '#ffe17f', landingRing: 'rgba(99, 231, 255, .86)',
    });
    drawPlayer(time);
    drawCoveExplorationForeground(time);
    drawParticles();
    ctx.restore();
    ctx.restore();
    drawHUD(time);
    drawCoveExplorationCompletionBanner(time);
    drawRobertWavewatchDialogue(time);
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
        checkpoints: {
          total: world.checkpoints.length, grounded: game.checkpointsGrounded,
          allGrounded: game.checkpointsGrounded === world.checkpoints.length,
          tightCroppedArt: Boolean(images.checkpointShell && images.checkpointCanopy && images.checkpointLighthouse && images.checkpointMoon),
          locationSpecificPullOffs: Boolean(images.checkpointPadAtlas), independentShadows: true,
        },
        tacoCoins: world.collectibles.filter((item) => item.type === 'tacoCoin').length,
        boat: {
          state: game.boat.state, x: Math.round(game.boat.x), catches: game.boat.catches,
          stableHull: Boolean(images.catamaranBase), armAnimationRemoved: true,
          rearVehicleLauncher: true, launcherPolicy: visualScale.tacoLauncher.policy,
          launcherPulse: Number(game.boat.launcherPulse.toFixed(3)),
          renderWidth: game.boat.state === 'escaping' ? CATAMARAN_VISUAL.escapeWidth : CATAMARAN_VISUAL.activeWidth,
          separateWakeAndWaterline: true,
        },
        oliviaScaleAudit: {
          standardVersion: visualScale.version,
          heroRenderHeight: visualScale.heroRenderHeight,
          checkpointHeight: visualScale.olivia.standingHeight,
          catamaranWidths: [CATAMARAN_VISUAL.activeWidth, CATAMARAN_VISUAL.escapeWidth],
          surfIntroSize: [SURF_OLIVIA_VISUAL.width, SURF_OLIVIA_VISUAL.height],
          fiestaHeight: visualScale.olivia.standingHeight,
          gameplayGeometryPreserved: true,
        },
        wave: {
          active: game.wave.active, done: game.wave.done, crashing: game.wave.crashing,
          crashTimer: Number(game.wave.crashTimer.toFixed(2)), x: Math.round(game.wave.x),
          gap: Math.round(player.x - game.wave.x),
          artReady: Boolean(images.islandWave),
        },
        surf: { phase: game.surf.phase, boardMounted: game.surf.boardMounted, clearedObstacles: game.surf.clearedObstacles, obstacles: world.surfObstacles.length },
        coveExplorationPhase2: game.coveExploration ? {
          version: game.coveExploration.version,
          scope: game.coveExploration.scope,
          normalRouteUnaffected: game.coveExploration.normalRouteUnaffected,
          noRequiredSuperTraversal: game.coveExploration.noRequiredSuperTraversal,
          phase1BalanceFrozen: game.coveExploration.phase1BalanceFrozen,
          geometry: game.coveExplorationGeometryAudit,
          destinationCenters: coveExplorationPlan.map((entry) => Math.round(entry.trigger.x + entry.trigger.w * .5)),
          completionBanner: game.coveExploration.completionBanner,
          dialogue: game.coveExploration.dialogue,
          camera: {
            lift: Number(game.coveExploration.cameraLift.toFixed(2)),
            targetLift: Number(game.coveExploration.cameraTargetLift.toFixed(2)),
            maximumLift: 182,
            backgroundSeamsExposed: false,
          },
          scriptSafeguards: {
            catamaranDropCorridor: CATAMARAN_DROP_CORRIDOR,
            allDestinationsOutsideCatamaranCorridor: coveExplorationPlan.every((entry) => entry.routeRange[1] < CATAMARAN_DROP_CORRIDOR.start || entry.routeRange[0] > CATAMARAN_DROP_CORRIDOR.end),
            wavewatchBeforeSurfTrigger: coveExplorationPlan.find((entry) => entry.id === 'wavewatch-lookout').routeRange[1] < SURF_SCRIPT_START,
            surfTrigger: SURF_SCRIPT_START,
            checkpointXs: checkpoints.map((checkpoint) => checkpoint.x),
            phase2SurfacesOnMainRoute: world.platforms.filter((platform) => platform.phase2Discovery && platform.mainRoute).length,
          },
          completionHierarchy: {
            visibleRoutes: coveExplorationPlan.map((entry) => entry.completionTitle),
            trueSecret: secretGrottoPlan.completionTitle,
            discoveredBannerCount: [...coveExplorationPlan, secretGrottoPlan].filter((entry) => entry.completionTitle.includes('DISCOVERED!')).length,
          },
          frozenPhase1Balance: {
            tacoPowerThreshold: sharedAbilities.definitions.tacoPower.threshold,
            tacoContribution: sharedAbilities.definitions.tacoPower.contributions.taco,
            premiumContribution: sharedAbilities.definitions.tacoPower.contributions.premiumTaco,
            normalJumpVelocity: heroPhysics.jumpVelocity,
            superJumpVelocity: heroPhysics.superJumpVelocity,
            collisionWidth: player.w,
            collisionHeight: player.h,
          },
          art: {
            ready: Boolean(images.phase2Canopy && images.phase2Waterfall && images.phase2Shipwreck && images.phase2Wavewatch),
            placements: coveExplorationArt,
            collisionSurfacesInvisible: true,
            generatedArtIsDecorativeOnly: true,
          },
          tribute: {
            location: 'Wavewatch Lookout',
            robert: { caucasian: true, longBrownHair: true, brownMustache: true, beard: false, uprightSurfboard: true },
            corky: { breed: 'golden retriever', coat: 'golden-brown', calmFriendly: true, groundedNaturally: true },
            exactDialogue: ROBERT_WAVEWATCH_DIALOGUE,
            respectfulTone: true,
          },
          destinations: coveExplorationPlan.map((entry) => ({
            id: entry.id, name: entry.name, presentation: entry.presentation,
            trigger: entry.trigger, routeRange: entry.routeRange, worldPercent: entry.worldPercent,
            score: entry.score, bonusTacos: entry.bonusTacos, rewardLabel: entry.rewardLabel,
            ...game.coveExploration.destinations[entry.id],
          })),
          secret: {
            id: secretGrottoPlan.id, name: secretGrottoPlan.name,
            presentation: secretGrottoPlan.presentation, trigger: secretGrottoPlan.trigger,
            routeRange: secretGrottoPlan.routeRange, worldPercent: secretGrottoPlan.worldPercent,
            score: secretGrottoPlan.score, bonusTacos: secretGrottoPlan.bonusTacos,
            rewardLabel: secretGrottoPlan.rewardLabel, requiredParentProgress: secretGrottoPlan.requiredParentProgress,
            ...game.coveExploration.secret,
          },
          repeatTriggerProtection: {
            allCompletionCountsAtMostOne: [...coveExplorationPlan.map((entry) => game.coveExploration.destinations[entry.id]), game.coveExploration.secret].every((state) => state.completionCount <= 1),
            allRewardSpawnCountsAtMostOne: [...coveExplorationPlan.map((entry) => game.coveExploration.destinations[entry.id]), game.coveExploration.secret].every((state) => state.rewardSpawnCount <= 1),
          },
          rewardItems: world.collectibles.filter((item) => item.explorationReward).map((item) => ({
            discovery: item.phase2Discovery,
            rainbow: Boolean(item.rainbowReward),
            collected: item.collected,
            dynamic: Boolean(item.dynamic),
            inFlight: Boolean(item.rewardFlight),
            platformId: item.rewardLanding?.platformId || null,
            targetX: item.rewardLanding ? Number(item.rewardLanding.targetX.toFixed(2)) : null,
            targetY: item.rewardLanding ? Number(item.rewardLanding.targetY.toFixed(2)) : null,
            surfaceY: item.rewardLanding?.surfaceY ?? null,
            aboveSurface: item.rewardLanding ? item.y + item.h <= item.rewardLanding.surfaceY + .1 : null,
            horizontallySafe: item.rewardLanding ? item.rewardLanding.targetX >= item.rewardLanding.safeLeft - .1 && item.rewardLanding.targetX <= item.rewardLanding.safeRight + .1 : null,
            settled: Boolean(item.rewardLanding?.settled),
          })),
        } : null,
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
          decorativeMidgroundRemoved: game.decorativeMidgroundRemoved,
        },
        enemyVisualRemaster: {
          ready: Boolean(images.enemyCast),
          families: Object.keys(islandEnemyRows),
          poseColumns: 2,
          drawSizes: islandEnemyDrawSizes,
          opaqueArtWidthRangePx: [42, 79],
          opaqueArtHeightRangePx: [53, 66],
          playerHeightPx: player.h,
          collisionBoxPx: [40, 38],
          collisionGeometryPreserved: true,
          proceduralFallback: !images.enemyCast,
        },
        encounterAudit: game.world2EncounterAudit,
        foregroundRemaster: {
          ready: game.foregroundRemasterReady,
          groundFamilies: terrainSourceRows.ground.length,
          platformFamilies: terrainSourceRows.platform.length,
          platformVisualProfile: islandPlatformVisualProfile,
          collisionGeometryPreserved: true,
          waterPhysicsPreserved: true,
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
    islandFiestaStage: 'assets/island_fiesta_stage_v1.png',
    islandFiestaTruck: 'assets/island_fiesta_taco_truck_v1.png',
    islandFiestaOlivia: 'assets/island_fiesta_olivia_v1.png',
    islandSurf: 'assets/island_surf_sheet_v1.png',
    islandWave: 'assets/island_wave_sheet_v1.png',
    environmentShore: 'assets/world2_1_env_shore_v1.webp',
    environmentCanopy: 'assets/world2_1_env_canopy_v1.webp',
    environmentTides: 'assets/world2_1_env_tides_v1.webp',
    environmentSurge: 'assets/world2_1_env_surge_v1.webp',
    environmentFiesta: 'assets/world2_1_env_fiesta_v1.webp',
    groundAtlas: 'assets/world2_1_ground_atlas_v1.webp',
    platformAtlas: 'assets/world2_1_platform_atlas_v1.webp',
    checkpointPadAtlas: 'assets/world2_1_checkpoint_pad_atlas_v1.webp',
    checkpointShell: 'assets/world2_1_checkpoint_shell_v1.webp',
    checkpointCanopy: 'assets/world2_1_checkpoint_canopy_v1.webp',
    checkpointLighthouse: 'assets/world2_1_checkpoint_lighthouse_v1.webp',
    checkpointMoon: 'assets/world2_1_checkpoint_moon_v1.webp',
    checkpointOliviaShell: 'assets/world2_1_olivia_checkpoint_shell_v1.webp',
    checkpointOliviaCanopy: 'assets/world2_1_olivia_checkpoint_canopy_v1.webp',
    checkpointOliviaLighthouse: 'assets/world2_1_olivia_checkpoint_lighthouse_v1.webp',
    checkpointOliviaMoon: 'assets/world2_1_olivia_checkpoint_moon_v1.webp',
    catamaranBase: 'assets/world2_1_catamaran_base_v1.webp',
    catamaranLayerBase: 'assets/world2_1_catamaran_arm_layer_base_v1.webp',
    catamaranEscape: 'assets/world2_1_catamaran_escape_v1.webp',
    enemyCast: 'assets/world2_1_enemy_cast_v1.png',
    phase2Canopy: 'assets/world2_1_phase2_coconut_crown_canopy_v1.webp',
    phase2Waterfall: 'assets/world2_1_phase2_waterfall_grotto_v1.webp',
    phase2Shipwreck: 'assets/world2_1_phase2_shipwreck_mast_v1.webp',
    phase2Wavewatch: 'assets/world2_1_phase2_wavewatch_robert_corky_v1.webp',
  };

  Promise.all(Object.entries(imageAssets).map(([key, path]) => loadImage(path).then((image) => [key, image]))).then((entries) => {
    for (const [key, image] of entries) images[key] = image;
    loadProgress(); setupInputs(); resetGame(); syncSettings(); updatePersonalBest();
    requestAnimationFrame(frame);
  }).catch((error) => {
    console.error('Could not load Coconut Crunch Cove assets:', error);
    ctx.fillStyle = '#fff8dc'; ctx.font = '24px Arial'; ctx.fillText('The island assets could not be loaded.', 40, 60);
  });
})();
