(() => {
  const SOURCE_VERSION = 'w1-1-v51-shared-stomp-standard';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const heroCore = window.JFT_HERO_CORE;
  const heroPhysics = heroCore.physics;
  const audio = window.JFT_AUDIO;

  const startOverlay = document.getElementById('startOverlay');
  const winOverlay = document.getElementById('winOverlay');
  const winText = document.getElementById('winText');
  const restartBtn = document.getElementById('restartBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const muteBtn = document.getElementById('muteBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const musicVolume = document.getElementById('musicVolume');
  const musicVolumeValue = document.getElementById('musicVolumeValue');
  const effectsVolume = document.getElementById('effectsVolume');
  const effectsVolumeValue = document.getElementById('effectsVolumeValue');
  const reducedShake = document.getElementById('reducedShake');
  const personalBestText = document.getElementById('personalBestText');
  const medalBadge = document.getElementById('medalBadge');
  const resultScore = document.getElementById('resultScore');
  const resultTime = document.getElementById('resultTime');
  const resultSplat = document.getElementById('resultSplat');
  const resultAir = document.getElementById('resultAir');
  const resultChase = document.getElementById('resultChase');
  const resultPinata = document.getElementById('resultPinata');
  const newBestText = document.getElementById('newBestText');
  const currentLevelTitle = document.getElementById('currentLevelTitle');
  const nextLevelName = document.getElementById('nextLevelName');
  const nextLevelMeta = document.getElementById('nextLevelMeta');

  const levelCatalog = Array.isArray(window.JUMPIN_FOR_TACOS_LEVELS) ? window.JUMPIN_FOR_TACOS_LEVELS : [];
  const currentLevelDefinition = levelCatalog.find((entry) => entry.id === 'world-1-level-1') || levelCatalog.find((entry) => entry.number === 1);
  const nextLevelDefinition = levelCatalog.find((entry) => entry.id === 'world-1-level-2');
  const islandLevelDefinition = levelCatalog.find((entry) => entry.id === 'world-2-level-1') || levelCatalog.find((entry) => entry.number === 2);
  if (currentLevelDefinition && currentLevelTitle) {
    currentLevelTitle.textContent = `World ${currentLevelDefinition.displayNumber || '1-1'}: ${currentLevelDefinition.name}`;
  }
  if (nextLevelDefinition) {
    if (nextLevelName) nextLevelName.textContent = `World ${nextLevelDefinition.displayNumber}: ${nextLevelDefinition.name}`;
    if (nextLevelMeta) {
      nextLevelMeta.textContent = nextLevelDefinition.status === 'playable'
        ? `${nextLevelDefinition.worldWidth.toLocaleString()}-unit world • Playable now`
        : `${nextLevelDefinition.worldWidth.toLocaleString()}-unit world in development`;
    }
  }

  const musicTracks = {
    exploration: document.getElementById('musicExploration'),
    showdown: document.getElementById('musicShowdown'),
    chase: document.getElementById('musicChase'),
    fiesta: document.getElementById('musicFiesta'),
  };
  const levelTwoMusicTracks = {
    shore: document.getElementById('musicIslandShore'),
    canopy: document.getElementById('musicIslandCanopy'),
    tides: document.getElementById('musicIslandTides'),
    lava: document.getElementById('musicIslandLava'),
    fiesta: document.getElementById('musicIslandFiesta'),
  };
  const musicSuites = Object.freeze({
    1: Object.freeze({ definition: currentLevelDefinition?.music ?? null, tracks: musicTracks }),
    2: Object.freeze({ definition: islandLevelDefinition?.music ?? null, tracks: levelTwoMusicTracks }),
  });
  const allMusic = Object.values(musicSuites[1].tracks);
  let activeMusicName = null;
  let musicTransition = null;

  const images = {};
  const imageNames = [
    'taco_hero_sheet',
    'player_sheet',
    'items_sheet',
    'tiles',
    'enemy_sheet',
    'goal_banner',
    'fiesta_finish_banner',
    'taco_truck_checkpoint',
    'fiesta_party_truck',
    'world1_1_terrain_ground_v1',
    'world1_1_terrain_platform_v1',
    'world1_1_checkpoint_golden_cactus_v1',
    'world1_1_taco_trekker_body_v1',
    'world1_1_taco_trekker_olivia_v1',
    'world1_1_taco_trekker_wheel_v1',
    'world1_1_taco_drop_payload_v1',
  ];
  const webpImageNames = [
    'world1_1_chili_bandit_sheet_v1',
    'world1_1_tomato_trouble_sheet_v1',
    'world1_1_onion_drama_sheet_v1',
    'world1_1_jalapeno_popper_sheet_v1',
    'world1_1_desert_locals_v1',
  ];
  const enemySpriteArt = Object.freeze({
    chili: 'world1_1_chili_bandit_sheet_v1',
    tomato: 'world1_1_tomato_trouble_sheet_v1',
    onion: 'world1_1_onion_drama_sheet_v1',
    jalapeno: 'world1_1_jalapeno_popper_sheet_v1',
  });
  const desertLocals = Object.freeze([
    { x: 140, frame: 0, role: 'vendor', phase: 0.2, scale: 0.86 },
    { x: 670, frame: 1, role: 'mechanic', phase: 1.1, scale: 0.9 },
    { goalOffset: -430, frame: 2, role: 'maracas', phase: 0.5, scale: 0.9 },
    { goalOffset: -315, frame: 3, role: 'camera', phase: 1.7, scale: 0.92 },
    { goalOffset: 340, frame: 4, role: 'flag', phase: 2.4, scale: 0.88 },
    { goalOffset: 435, frame: 5, role: 'cheer', phase: 3.1, scale: 0.82 },
  ]);

  const keys = {
    left: false,
    right: false,
    jump: false,
    jumpQueued: false,
  };

  const game = {
    state: 'title',
    muted: false,
    score: 0,
    collected: 0,
    totalCollectibles: 0,
    hearts: 3,
    startTime: 0,
    finishTime: 0,
    confetti: [],
    fireworks: [],
    tacoRain: [],
    pinataBurst: null,
    splatParticles: [],
    impactTexts: [],
    cameraX: 0,
    cameraShake: 0,
    hitStop: 0,
    levelWidth: 33080,
    levelTime: 0,
    celebrationTicker: 0,
    celebrationStartTime: 0,
    streak: 0,
    streakTimer: 0,
    bestStreak: 0,
    salsaMeter: 0,
    frenzyTimer: 0,
    magnetTimer: 0,
    goldenCollected: 0,
    stompCombo: 0,
    stompTimer: 0,
    bestStompCombo: 0,
    lastStomp: null,
    airChain: 0,
    airChainTimer: 0,
    maxAirChain: 0,
    rainbowCollected: 0,
    totalGolden: 6,
    totalRainbow: 6,
    showdownAnnounced: false,
    settingsOpen: false,
    musicVolume: 0.7,
    effectsVolume: 0.8,
    reducedShake: false,
    radioMessage: '',
    radioTimer: 0,
    radioFlags: { intro: false, showdown: false, chase: false, finale: false },
    cinematicTimer: 0,
    cinematicDuration: 0,
    cinematicTargetX: 0,
    cinematicLabel: '',
    cinematicFlags: { showdown: false, chase: false, finale: false },
    personalBest: { score: 0, time: 0, medal: '', runs: 0 },
    latestCheckpoint: null,
    message: '',
    messageTimer: 0,
    midTruckEntering: false,
    midTruckActive: false,
    midTruckEscaping: false,
    midTruckDone: false,
    truckDropTimer: 0,
    truckDropPulse: 0,
    truckLauncherWorldX: 0,
    dropTruckX: 0,
    midTruckEntrySpeed: 0,
    midTruckEscapeSpeed: 0,
    encoreTruckEntering: false,
    encoreTruckActive: false,
    encoreTruckEscaping: false,
    encoreTruckDone: false,
    encoreTruckX: 0,
    encoreTruckEntrySpeed: 0,
    encoreTruckEscapeSpeed: 0,
    encoreDropTimer: 0,
    encoreDropBurst: 0,
    chaseTruckActive: false,
    chaseTruckEscaping: false,
    chaseTruckDone: false,
    chaseTruckX: 0,
    chaseDropTimer: 0,
    chaseCatchCount: 0,
    chaseEscapeSpeed: 0,
    chaseEscapeTimer: 0,
    finalRushStarted: false,
    partyBeat: -1,
    partyBonus: 0,
    partyRank: '',
    finishHypeStage: 0,
    finishSparkTimer: 0,
    fallSoundPlayed: false,
    respawn: heroCore.createRespawnState(),
    respawnCount: 0,
    respawnFallbacks: 0,
    lastRespawnLanding: null,
    routeMaxGap: 0,
    platformOverlapCount: 0,
    checkpointsGrounded: 0,
  };

  const physics = {
    ...heroPhysics,
    moveSpeed: 235,
    frictionGround: 0.82,
    frictionAir: 0.92,
  };

  const layout = {
    dropInsertionX: 2940,
    dropInsertionLength: 1540,
    dropRunwayStart: 2860,
    dropRunwayEnd: 4480,
    adventureEnd: 8960,
    showdownEnd: 11960,
    chaseEnd: 15640,
  };

  const zones = {
    levelWidth: 33080,
    dropStart: 2960,
    dropEnd: 4380,
    dropTruckLimit: 4620,
    encoreDropStart: 11920,
    encoreDropEnd: 13340,
    encoreDropTruckLimit: 13580,
    showdownMusicStart: 17480,
    showdownAnnounceStart: 17840,
    showdownStart: 17920,
    showdownReveal: 18020,
    showdownAnnounceEnd: 18200,
    showdownEnd: 23920,
    chaseRadio: 24320,
    chaseStart: 24540,
    chaseReveal: 24900,
    chaseEnd: 31280,
    chaseTruckLimit: 31390,
    finaleRadio: 31370,
    finalRush: 31500,
    goalX: 31720,
  };

  // These are final-world checkpoint stations. They are deliberately kept
  // outside the expandable geometry seeds so a runway insertion or encore
  // section cannot create a second copy of an already-materialized station.
  const checkpointDefs = Object.freeze([
    {
      id: 'desert-dash-exit',
      x: layout.adventureEnd - 160,
      y: 330,
      w: 180,
      h: 130,
      sign: 'OPENING RUN COMPLETE!',
      accent: '#ffd166',
      artStyle: 'goldenCactus',
    },
    {
      id: 'showdown-approach',
      x: zones.showdownStart - 220,
      y: 330,
      w: 180,
      h: 130,
      sign: 'SALSA SHOWDOWN AHEAD!',
      accent: '#b78cff',
    },
    {
      id: 'chase-approach',
      x: zones.chaseStart - 240,
      y: 330,
      w: 180,
      h: 130,
      sign: 'TURBO CHASE READY!',
      accent: '#65d8ff',
    },
  ]);

  // The standard checkpoint truck PNG includes transparent pixels below its
  // visible wheels. Keep the visible alpha edge on the resolved terrain
  // surface instead of aligning the full source rectangle to the collision
  // floor. These values describe the current checked-in 1536×1024 asset.
  const checkpointTruckArtMetrics = Object.freeze({
    sourceHeight: 1024,
    visibleBottom: 875,
  });

  // World 1-1 pilot encounter authorship. These platforms deliberately sit
  // on the optional upper route or on a wide moving ledge, while the lower
  // route remains open. The plan is explicit so later expansion work cannot
  // quietly turn every enemy back into a ground-only placement. The authored
  // route now covers both exploration passes, both taco-drop passes, and the
  // approach into the Salsa Showdown. The chase and fiesta finish remain
  // intentionally enemy-free set pieces.
  const pilotPlatformSpecs = Object.freeze([
    { id: 'pilot-upper-cactus-ledge', match: { x: 420, y: 360, w: 180, h: 26 }, section: 'opening', routePurpose: 'Teach the first safe upper-route landing.' },
    { id: 'pilot-upper-banner-ledge', match: { x: 720, y: 300, w: 160, h: 26 }, section: 'opening', routePurpose: 'Make the first high shortcut worth the timing.' },
    { id: 'pilot-upper-sunrise-ledge', match: { x: 1090, y: 340, w: 160, h: 26 }, section: 'opening', routePurpose: 'Introduce a controlled bounce-chain entry.' },
    { id: 'pilot-upper-ridge-ledge', match: { x: 1380, y: 270, w: 160, h: 26 }, section: 'opening', routePurpose: 'Reward a second jump from the bounce route.' },
    { id: 'pilot-upper-salsa-ledge', match: { x: 1710, y: 320, w: 150, h: 26 }, section: 'opening', routePurpose: 'Create a readable enemy-to-enemy stomp line.' },
    { id: 'pilot-upper-golden-ledge', match: { x: 1960, y: 240, w: 140, h: 26 }, section: 'opening', routePurpose: 'Cap the opening skill test with a premium target.' },
    { id: 'pilot-upper-bowl-ledge', match: { x: 2450, y: 350, w: 180, h: 26 }, section: 'opening', routePurpose: 'Reopen the high route after the lower-route gap.' },
    { id: 'pilot-upper-salsa-crest', match: { x: 2740, y: 280, w: 160, h: 26 }, section: 'opening', routePurpose: 'Teach the final upper-route descent before Olivia.' },
    { id: 'pilot-drop-entry-ledge', match: { x: 4500, y: 350, w: 140, h: 26 }, section: 'taco-drop', routePurpose: 'Guard the elevated edge of Olivia’s taco-drop runway.' },
    { id: 'pilot-drop-moving-ledge', x: 5320, y: 365, w: 180, h: 28, moving: true, axis: 'x', baseX: 5320, baseY: 365, range: 72, speed: 1.35, phase: 0.7, style: 'pilot', section: 'taco-drop', routePurpose: 'Make platform timing matter without closing the ground route.' },
    { id: 'pilot-drop-banner-ledge', match: { x: 6020, y: 355, w: 150, h: 26 }, section: 'taco-drop', routePurpose: 'Place a sentry above the middle of the drop approach.' },
    { id: 'pilot-drop-high-ledge', match: { x: 6230, y: 285, w: 140, h: 26 }, section: 'taco-drop', routePurpose: 'Offer a high-risk jump over the drop-route rhythm.' },
    { id: 'pilot-drop-crest-ledge', match: { x: 6670, y: 250, w: 160, h: 26 }, section: 'taco-drop', routePurpose: 'Close the first drop with a visible premium target.' },
    { id: 'pilot-opening-late-ledge-a', match: { x: 6900, y: 305, w: 150, h: 26 }, section: 'opening-late', routePurpose: 'Keep the upper route active after the first delivery.' },
    { id: 'pilot-opening-late-ledge-b', match: { x: 7120, y: 235, w: 160, h: 26 }, section: 'opening-late', routePurpose: 'Make the last high ledge a deliberate timing choice.' },
    { id: 'pilot-opening-late-ledge-c', match: { x: 7350, y: 300, w: 140, h: 26 }, section: 'opening-late', routePurpose: 'Offer a controlled descent toward the moving canyon.' },
    { id: 'mover-a', existingOnly: true, preserveMainRoute: true, section: 'opening-late', routePurpose: 'Turn the first moving bridge into an optional timing test.' },
    { id: 'mover-c', existingOnly: true, preserveMainRoute: true, section: 'opening-late', routePurpose: 'Reward patience on the final moving bridge.' },
    { id: 'mover-a-encore', existingOnly: true, preserveMainRoute: true, section: 'encore', routePurpose: 'Make the encore bridge change pace.' },
    { id: 'mover-c-encore', existingOnly: true, preserveMainRoute: true, section: 'encore', routePurpose: 'Close the encore route with a moving timing test.' },
    { id: 'mover-d-encore', existingOnly: true, preserveMainRoute: true, section: 'encore', routePurpose: 'Set up the last moving landing before the showdown.' },
  ]);

  const pilotEncounterPlan = Object.freeze([
    { id: 'pilot-cactus-sentry', platformId: 'pilot-upper-cactus-ledge', offset: 12, count: 3, spacing: 48, type: 'chili', role: 'platform-sentry', section: 'opening', purpose: 'First upper-route guard pack' },
    { id: 'pilot-banner-sentry', platformId: 'pilot-upper-banner-ledge', offset: 12, count: 3, spacing: 40, type: 'tomato', role: 'platform-sentry', section: 'opening', purpose: 'High shortcut tomato pack' },
    { id: 'pilot-sunrise-helper', platformId: 'pilot-upper-sunrise-ledge', offset: 12, count: 3, spacing: 40, type: 'onion', role: 'route-helper', section: 'opening', purpose: 'Bounce-chain onion pack' },
    { id: 'pilot-ridge-sentry', platformId: 'pilot-upper-ridge-ledge', offset: 12, count: 2, spacing: 54, type: 'jalapeno', role: 'platform-sentry', section: 'opening', purpose: 'Second-jump jalapeño pair' },
    { id: 'pilot-salsa-sentry', platformId: 'pilot-upper-salsa-ledge', offset: 12, count: 3, spacing: 40, type: 'chili', role: 'platform-sentry', section: 'opening', purpose: 'Readable chili stomp line' },
    { id: 'pilot-golden-champion', platformId: 'pilot-upper-golden-ledge', offset: 50, type: 'tomato', role: 'champion', section: 'opening', purpose: 'Opening premium target' },
    { id: 'pilot-bowl-sentry', platformId: 'pilot-upper-bowl-ledge', offset: 12, count: 3, spacing: 48, type: 'onion', role: 'platform-sentry', section: 'opening', purpose: 'Upper-route onion re-entry pack' },
    { id: 'pilot-crest-helper', platformId: 'pilot-upper-salsa-crest', offset: 12, count: 2, spacing: 54, type: 'jalapeno', role: 'route-helper', section: 'opening', purpose: 'Upper-route jalapeño descent pair' },
    { id: 'pilot-drop-entry-sentry', platformId: 'pilot-drop-entry-ledge', offset: 12, count: 2, spacing: 48, type: 'tomato', role: 'platform-sentry', section: 'taco-drop', purpose: 'Drop-runway tomato pair' },
    { id: 'pilot-drop-moving-guard', platformId: 'pilot-drop-moving-ledge', offset: 66, type: 'chili', role: 'moving-guard', section: 'taco-drop', purpose: 'Moving-platform timing test' },
    { id: 'pilot-drop-banner-sentry', platformId: 'pilot-drop-banner-ledge', offset: 12, count: 2, spacing: 54, type: 'onion', role: 'platform-sentry', section: 'taco-drop', purpose: 'Drop-approach onion pair' },
    { id: 'pilot-drop-high-helper', platformId: 'pilot-drop-high-ledge', offset: 12, count: 2, spacing: 48, type: 'jalapeno', role: 'route-helper', section: 'taco-drop', purpose: 'High-risk jalapeño bounce pair' },
    { id: 'pilot-drop-crest-champion', platformId: 'pilot-drop-crest-ledge', offset: 70, type: 'chili', role: 'champion', section: 'taco-drop', purpose: 'First drop premium target' },
    { id: 'pilot-opening-late-sentry-a', platformId: 'pilot-opening-late-ledge-a', offset: 12, count: 2, spacing: 54, type: 'tomato', role: 'platform-sentry', section: 'opening-late', purpose: 'Late tomato exploration pair' },
    { id: 'pilot-opening-late-helper', platformId: 'pilot-opening-late-ledge-b', offset: 12, count: 3, spacing: 40, type: 'onion', role: 'route-helper', section: 'opening-late', purpose: 'Late onion bounce descent pack' },
    { id: 'pilot-opening-late-champion', platformId: 'pilot-opening-late-ledge-c', offset: 48, type: 'chili', role: 'champion', section: 'opening-late', purpose: 'Pre-canyon premium target' },
    { id: 'pilot-opening-moving-guard-a', platformId: 'mover-a', offset: 62, type: 'chili', role: 'moving-guard', section: 'opening-late', purpose: 'First moving bridge guard' },
    { id: 'pilot-opening-moving-guard-c', platformId: 'mover-c', offset: 64, type: 'jalapeno', role: 'moving-guard', section: 'opening-late', purpose: 'Final moving bridge guard' },
    { id: 'pilot-encore-moving-guard-a', platformId: 'mover-a-encore', offset: 62, type: 'tomato', role: 'moving-guard', section: 'encore', purpose: 'Encore bridge guard' },
    { id: 'pilot-encore-moving-guard-c', platformId: 'mover-c-encore', offset: 64, type: 'onion', role: 'moving-guard', section: 'encore', purpose: 'Encore timing guard' },
    { id: 'pilot-encore-moving-guard-d', platformId: 'mover-d-encore', offset: 56, type: 'chili', role: 'moving-guard', section: 'encore', purpose: 'Showdown approach bridge guard' },
  ]);

  const pilotEncorePlatformSpecs = Object.freeze(
    pilotPlatformSpecs
      .filter((spec) => spec.match && !spec.existingOnly)
      .map((spec) => ({
        ...spec,
        id: `${spec.id}-encore`,
        match: { ...spec.match, x: spec.match.x + layout.adventureEnd },
        section: spec.section === 'taco-drop' ? 'encore-drop' : 'encore',
        routePurpose: `${spec.routePurpose} on the encore route`,
      })),
  );

  const pilotEncoreEncounterPlan = Object.freeze(
    pilotEncounterPlan
      .filter((encounter) => pilotPlatformSpecs.some((spec) => spec.id === encounter.platformId && spec.match && !spec.existingOnly))
      .map((encounter) => ({
        ...encounter,
        id: `${encounter.id}-encore`,
        platformId: `${encounter.platformId}-encore`,
        section: encounter.section === 'taco-drop' ? 'encore-drop' : 'encore',
        purpose: `${encounter.purpose} on the encore route`,
      })),
  );

  const player = {
    x: 160,
    y: 0,
    w: 34,
    h: 42,
    vx: 0,
    vy: 0,
    dir: 1,
    grounded: false,
    invulnerable: 0,
    anim: 0,
    rotation: 0,
    scale: 1,
    platform: null,
    coyote: 0,
    jumpBuffer: 0,
  };

  const level = {
    groundY: 460,
    platforms: [],
    collectibles: [],
    enemies: [],
    pinata: null,
    goal: { x: zones.goalX, y: 336, w: 110, h: 120 },
    checkpoints: [],
  };

  const world1Background = window.JFT_WORLD1_BACKGROUNDS.create({
    levelId: '1-1', canvas, ctx, worldWidth: game.levelWidth, groundY: level.groundY,
  });

  const itemTypes = {
    taco: { frame: 0, points: 10, meter: 4, name: 'Taco' },
    sauce: { frame: 1, points: 25, meter: 12, name: 'Hot Sauce' },
    pepper: { frame: 2, points: 20, meter: 9, name: 'Jalapeño' },
    guac: { frame: 3, points: 30, meter: 15, name: 'Guac Bowl' },
    golden: { frame: 0, points: 250, meter: 30, name: 'Golden Taco' },
    magnet: { frame: 0, points: 100, meter: 20, name: 'Taco Magnet' },
    rainbow: { frame: 0, points: 500, meter: 40, name: 'Rainbow Taco' },
  };
  const tacoTrekkerRearLauncher = Object.freeze({
    x: 66,
    sourceY: 246,
    pulseDuration: 0.24,
  });

  let lastFrame = 0;
  const localPreviewStart = location.hostname === 'terminal.local'
    ? Number(new URLSearchParams(location.search).get('startX') || 0)
    : 0;
  const localPreviewY = location.hostname === 'terminal.local'
    ? Number(new URLSearchParams(location.search).get('startY') || 0)
    : 0;
  const localPreviewPinataHits = location.hostname === 'terminal.local'
    ? Number(new URLSearchParams(location.search).get('pinataHits') || 0)
    : 0;
  const localPreviewFrenzy = location.hostname === 'terminal.local'
    && new URLSearchParams(location.search).get('frenzy') === '1';
  const localPreviewAutoRun = location.hostname === 'terminal.local'
    && new URLSearchParams(location.search).get('autoRun') === '1';
  const localPreviewRespawn = location.hostname === 'terminal.local'
    && new URLSearchParams(location.search).get('respawn') === '1';
  const localPreviewRespawnCheckpoint = location.hostname === 'terminal.local'
    ? Number(new URLSearchParams(location.search).get('respawnCheckpoint') || -1)
    : -1;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rectsIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  const storageKey = 'jumpinForTacosProgressV2';

  function loadSavedProgress() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        settings: {
          musicVolume: game.musicVolume,
          effectsVolume: game.effectsVolume,
          reducedShake: game.reducedShake,
          muted: game.muted,
        },
        personalBest: game.personalBest,
      }));
    } catch {
      // The game remains fully playable when browser storage is unavailable.
    }
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function syncSettingsUI() {
    musicVolume.value = String(Math.round(game.musicVolume * 100));
    effectsVolume.value = String(Math.round(game.effectsVolume * 100));
    reducedShake.checked = game.reducedShake;
    musicVolumeValue.textContent = `${musicVolume.value}%`;
    effectsVolumeValue.textContent = `${effectsVolume.value}%`;
    muteBtn.textContent = game.muted ? '🔇 Sound Off' : '🔊 Sound On';
    for (const track of allMusic) track.muted = game.muted;
    syncAudioSettings();
  }

  function updatePersonalBestText() {
    const best = game.personalBest;
    personalBestText.textContent = best.runs > 0
      ? `Personal best: ${best.score.toLocaleString()} points • ${formatTime(best.time)} • ${best.medal}`
      : 'No personal best yet. Your first fiesta sets the record!';
  }

  function medalForRun(completion) {
    const medalScore = game.score + game.bestStompCombo * 180 + game.maxAirChain * 55
      + game.chaseCatchCount * 28 + game.rainbowCollected * 700 + (level.pinata?.broken ? 1000 : 0);
    if (completion >= 0.82 && game.goldenCollected === game.totalGolden && medalScore >= 13000) return 'TACO LEGEND';
    if (medalScore >= 8500 || game.rainbowCollected === game.totalRainbow) return 'GOLDEN CRUNCH';
    if (medalScore >= 4200 || game.bestStompCombo >= 4) return 'SALSA STAR';
    return 'TACO ROOKIE';
  }

  function presentRunResults(seconds) {
    const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
    const medal = medalForRun(completion);
    const previous = game.personalBest;
    const scoreBest = game.score > previous.score;
    const timeBest = previous.time <= 0 || seconds < previous.time;
    const isNewBest = previous.runs === 0 || scoreBest || timeBest;
    game.personalBest = {
      score: Math.max(previous.score || 0, game.score),
      time: timeBest ? seconds : previous.time,
      medal: scoreBest || previous.runs === 0 ? medal : previous.medal,
      runs: (previous.runs || 0) + 1,
    };
    saveProgress();
    updatePersonalBestText();

    medalBadge.textContent = medal;
    resultScore.textContent = game.score.toLocaleString();
    resultTime.textContent = formatTime(seconds);
    resultSplat.textContent = `×${game.bestStompCombo}`;
    resultAir.textContent = `×${game.maxAirChain}`;
    resultChase.textContent = String(game.chaseCatchCount);
    resultPinata.textContent = level.pinata?.broken ? 'JACKPOT!' : 'Missed';
    newBestText.classList.toggle('hidden', !isNewBest);
  }

  const savedProgress = loadSavedProgress();
  if (savedProgress.settings) {
    game.musicVolume = clamp(Number(savedProgress.settings.musicVolume ?? 0.7), 0, 1);
    game.effectsVolume = clamp(Number(savedProgress.settings.effectsVolume ?? 0.8), 0, 1);
    game.reducedShake = Boolean(savedProgress.settings.reducedShake);
    game.muted = Boolean(savedProgress.settings.muted);
  }
  if (savedProgress.personalBest) game.personalBest = { ...game.personalBest, ...savedProgress.personalBest };

  function syncAudioSettings() {
    if (!audio) return;
    audio.setMusicVolume(game.musicVolume);
    audio.setEffectsVolume(game.effectsVolume);
    audio.setMuted(game.muted);
  }

  audio?.registerMusicTracks(musicTracks);
  syncAudioSettings();
  audio?.preloadGroups(['global', 'world1']).catch(() => {
    // The shared engine supplies a centralized fallback when an asset cannot load.
  });

  function spawnConfetti(x, y, amount = 50) {
    for (let i = 0; i < amount; i++) {
      game.confetti.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 380,
        vy: -Math.random() * 420 - 100,
        g: 720 + Math.random() * 400,
        size: 4 + Math.random() * 8,
        life: 1.2 + Math.random() * 1.4,
        color: ['#ff6b6b', '#ffd166', '#53d18f', '#73a6ff', '#fff3b0'][Math.floor(Math.random() * 5)],
        spin: (Math.random() - 0.5) * 12,
        angle: Math.random() * Math.PI * 2,
      });
    }
  }

  function spawnFirework() {
    const x = 200 + Math.random() * 560;
    const y = 110 + Math.random() * 120;
    const color = ['#ff6b6b', '#ffd166', '#53d18f', '#73a6ff', '#fff3b0'][Math.floor(Math.random() * 5)];
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const speed = 90 + Math.random() * 180;
      game.fireworks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.8,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function spawnTacoRain() {
    const types = ['taco', 'golden', 'rainbow'];
    const type = types[Math.floor(Math.random() * types.length)];
    game.tacoRain.push({
      x: Math.random() * canvas.width,
      y: -20,
      vy: 120 + Math.random() * 180,
      spin: (Math.random() - 0.5) * 8,
      angle: 0,
      type,
    });
  }

  function expansionShifts(x) {
    if (x < layout.adventureEnd) return { base: 0, duplicate: layout.adventureEnd };
    if (x < layout.showdownEnd) return { base: layout.adventureEnd, duplicate: layout.showdownEnd };
    if (x < layout.chaseEnd) return { base: layout.showdownEnd, duplicate: layout.chaseEnd };
    return { base: layout.chaseEnd, duplicate: null };
  }

  function extendDropRunway() {
    const shift = layout.dropInsertionLength;
    const shouldShift = (x) => x >= layout.dropInsertionX;

    for (const platform of level.platforms) {
      if (!shouldShift(platform.x)) continue;
      platform.x += shift;
      if (typeof platform.baseX === 'number') platform.baseX += shift;
    }
    for (const item of level.collectibles) {
      if (shouldShift(item.x)) item.x += shift;
    }
    for (const enemy of level.enemies) {
      if (!shouldShift(enemy.x)) continue;
      enemy.x += shift;
      enemy.minX += shift;
      enemy.maxX += shift;
    }
    if (level.pinata && shouldShift(level.pinata.x)) level.pinata.x += shift;

    // A long, uninterrupted road makes Olivia's first taco toss readable. The
    // static collectible trail intentionally pauses here so the airborne drops
    // become the unmistakable focus of the sequence.
    level.platforms.push({
      id: 'olivia-drop-runway',
      x: layout.dropRunwayStart,
      y: level.groundY,
      w: layout.dropRunwayEnd - layout.dropRunwayStart,
      h: 80,
      dropRunway: true,
    });
  }

  function expandLevelSections() {
    const originalPlatforms = [...level.platforms];
    const duplicatePlatforms = new Map();
    const platformCopies = [];

    for (const platform of originalPlatforms) {
      const sourceX = platform.x;
      const sourceBaseX = typeof platform.baseX === 'number' ? platform.baseX : null;
      const shifts = expansionShifts(sourceX);
      platform.x = sourceX + shifts.base;
      if (sourceBaseX !== null) platform.baseX = sourceBaseX + shifts.base;
      if (shifts.duplicate !== null) {
        const copy = {
          ...platform,
          x: sourceX + shifts.duplicate,
          id: platform.id ? `${platform.id}-encore` : undefined,
        };
        if (sourceBaseX !== null) copy.baseX = sourceBaseX + shifts.duplicate;
        duplicatePlatforms.set(platform, copy);
        platformCopies.push(copy);
      }
    }
    level.platforms.push(...platformCopies);

    const collectibleCopies = [];
    for (const item of [...level.collectibles]) {
      const sourceX = item.x;
      const shifts = expansionShifts(sourceX);
      item.x = sourceX + shifts.base;
      if (shifts.duplicate !== null) {
        const copy = { ...item, x: sourceX + shifts.duplicate, collected: false };
        if (item.ridePlatform) copy.ridePlatform = duplicatePlatforms.get(item.ridePlatform) || null;
        collectibleCopies.push(copy);
      }
    }
    level.collectibles.push(...collectibleCopies);

    const enemyCopies = [];
    for (const enemy of [...level.enemies]) {
      const sourceX = enemy.x;
      const sourceMinX = enemy.minX;
      const sourceMaxX = enemy.maxX;
      const shifts = expansionShifts(sourceX);
      enemy.x = sourceX + shifts.base;
      enemy.minX = sourceMinX + shifts.base;
      enemy.maxX = sourceMaxX + shifts.base;
      if (shifts.duplicate !== null) {
        enemyCopies.push({
          ...enemy,
          id: enemy.id ? `${enemy.id}-encore` : undefined,
          groupId: enemy.groupId ? `${enemy.groupId}-encore` : undefined,
          x: sourceX + shifts.duplicate,
          minX: sourceMinX + shifts.duplicate,
          maxX: sourceMaxX + shifts.duplicate,
          alive: true,
          defeated: false,
          pinataArena: false,
        });
      }
    }
    level.enemies.push(...enemyCopies);

    if (level.pinata) level.pinata.x += expansionShifts(level.pinata.x).base;
    level.goal.x = zones.goalX;
    game.levelWidth = zones.levelWidth;
  }

  // The opening pack originally contained three enemies. After the pack was
  // reduced, the surviving lead member still occupied the first lane of the
  // starting platform, so the player continued to see an enemy in the exact
  // opening position that was meant to be clear. Remove that authored lead
  // from both the original run and its encore copy, then normalize the
  // remaining member's formation metadata before platform patrols are built.
  function removeOpeningLeadEnemy() {
    const isOpeningLead = (enemy) => (
      enemy
      && enemy.groupIndex === 0
      && (enemy.groupId === 'opening-chili-pack' || enemy.groupId === 'opening-chili-pack-encore')
    );
    const removed = level.enemies.filter(isOpeningLead);
    level.enemies = level.enemies.filter((enemy) => !isOpeningLead(enemy));

    const remainingByGroup = new Map();
    level.enemies
      .filter((enemy) => enemy.groupId === 'opening-chili-pack' || enemy.groupId === 'opening-chili-pack-encore')
      .forEach((enemy) => {
        if (!remainingByGroup.has(enemy.groupId)) remainingByGroup.set(enemy.groupId, []);
        remainingByGroup.get(enemy.groupId).push(enemy);
      });
    remainingByGroup.forEach((members) => {
      members
        .sort((a, b) => (Number(a.x) || 0) - (Number(b.x) || 0))
        .forEach((enemy, index) => {
          enemy.groupIndex = index;
          enemy.groupSize = members.length;
        });
    });
    game.openingLeadEnemyRemoved = removed.length;
  }

  function ensurePilotPlatform(spec) {
    const geometry = spec.match || spec;
    let platform = level.platforms.find((candidate) => candidate.id === spec.id);
    if (!platform && spec.match) {
      platform = level.platforms.find((candidate) => (
        candidate.x === geometry.x
        && candidate.y === geometry.y
        && candidate.w === geometry.w
        && candidate.h === geometry.h
      ));
    }
    if (!platform && spec.existingOnly) return null;
    if (!platform) {
      platform = {
        ...geometry,
        id: spec.id,
        mainRoute: false,
        enemySupport: true,
      };
      level.platforms.push(platform);
    }
    platform.id = spec.id;
    platform.pilotRoute = 'upper';
    platform.pilotSection = spec.section || 'opening';
    platform.routePurpose = spec.routePurpose;
    if (!spec.preserveMainRoute) platform.mainRoute = false;
    platform.enemySupport = true;
    if (platform.moving) {
      platform.baseX ??= platform.x;
      platform.baseY ??= platform.y;
      platform.dx ??= 0;
      platform.dy ??= 0;
    }
    return platform;
  }

  function applyWorldOnePilotRemaster() {
    const authoredPlatformSpecs = [...pilotPlatformSpecs, ...pilotEncorePlatformSpecs];
    const authoredEncounterPlan = [...pilotEncounterPlan, ...pilotEncoreEncounterPlan];
    const pilotPlatforms = new Map(
      authoredPlatformSpecs
        .map((spec) => [spec.id, ensurePilotPlatform(spec)])
        .filter(([, platform]) => Boolean(platform)),
    );

    // The chase and the final rush are intentionally clean set pieces. The
    // earlier expansion logic cloned the original ground enemies into those
    // stretches, which made the chase feel like another combat corridor.
    level.enemies = level.enemies.filter((enemy) => enemy.x < zones.chaseStart);

    // The existing Salsa Showdown already uses elevated arena platforms. Make
    // that intention explicit so the shared metadata and its reward language
    // agree with what the player sees.
    let showdownEncounterIndex = 0;
    level.enemies.forEach((enemy) => {
      if (!enemy.arenaId) return;
      enemy.role = enemy.pinataArena ? 'champion' : 'platform-sentry';
      enemy.roleExplicit = true;
      enemy.pilotEncounter = `showdown-${enemy.arenaId}-${showdownEncounterIndex + 1}`;
      enemy.pilotSection = 'showdown';
      enemy.pilotPurpose = enemy.pinataArena
        ? 'Protect the piñata with a premium stomp chain.'
        : 'Keep the Salsa Showdown upper route active.';
      showdownEncounterIndex += 1;
    });

    for (const encounter of authoredEncounterPlan) {
      const platform = pilotPlatforms.get(encounter.platformId);
      if (!platform) continue;
      const enemyWidth = 36;
      const enemyHeight = 38;
      const requestedCount = Math.max(1, Math.floor(Number(encounter.count) || 1));
      // Packs are for open ground and genuinely wide ledges. Narrow upper
      // platforms get one readable guard so the player never sees enemies
      // crowding or overlapping on a landing surface.
      const groupingAllowed = Boolean(platform.ground) || platform.w >= 220;
      const count = groupingAllowed ? requestedCount : 1;
      const spacing = count > 1
        ? Math.max(enemyWidth + 12, Number(encounter.spacing) || enemyWidth + 18)
        : enemyWidth + 12;
      const formationWidth = enemyWidth + (count - 1) * spacing;
      const minStartX = platform.x + 12;
      const maxStartX = platform.x + platform.w - formationWidth - 12;
      const startX = clamp(platform.x + encounter.offset, minStartX, Math.max(minStartX, maxStartX));
      const role = encounter.role;
      level.enemies.push(...heroCore.createEnemyFormation({
        id: encounter.id,
        type: encounter.type,
        startX,
        y: platform.y - enemyHeight,
        w: enemyWidth,
        h: enemyHeight,
        count,
        spacing,
        vx: role === 'moving-guard' ? 46 : 38,
        patrolPadding: role === 'moving-guard' ? 0 : 6,
        role,
        roleExplicit: true,
        supportPlatformId: platform.id,
        pilotEncounter: encounter.id,
        pilotSection: encounter.section,
        pilotPurpose: encounter.purpose,
        routeHelper: role === 'route-helper',
        champion: role === 'champion',
        formationRule: groupingAllowed ? 'ground-or-large-platform' : 'single-narrow-platform',
        formationPurpose: encounter.purpose,
      }));
    }

    game.pilotRemaster = {
      version: 'world-1-1-pilot-v3',
      authoredPlatforms: pilotPlatforms.size,
      authoredEncounters: authoredEncounterPlan.length + showdownEncounterIndex,
      upperRoutePlatforms: [...pilotPlatforms.values()].map((platform) => platform.id),
      encounterIds: [
        ...authoredEncounterPlan.map((encounter) => encounter.id),
        ...level.enemies.filter((enemy) => enemy.pilotSection === 'showdown').map((enemy) => enemy.pilotEncounter),
      ],
      sections: Object.freeze({
        opening: authoredEncounterPlan.filter((encounter) => encounter.section === 'opening' || encounter.section === 'opening-late').length,
        tacoDrop: authoredEncounterPlan.filter((encounter) => encounter.section === 'taco-drop').length,
        encore: authoredEncounterPlan.filter((encounter) => encounter.section === 'encore').length,
        encoreDrop: authoredEncounterPlan.filter((encounter) => encounter.section === 'encore-drop').length,
        showdown: showdownEncounterIndex,
        chase: 0,
        finale: 0,
      }),
      enemyFreeChase: !level.enemies.some((enemy) => enemy.x >= zones.chaseStart && enemy.x < zones.goalX),
      enemyFreeFinish: !level.enemies.some((enemy) => enemy.x >= zones.finalRush),
      routeDiscoveryOnly: true,
      groupedEnemies: level.enemies.filter((enemy) => enemy.groupSize > 1).length,
      enemyGroups: [...new Set(level.enemies.filter((enemy) => enemy.groupId).map((enemy) => enemy.groupId))],
    };
  }

  function auditEnemyFormations() {
    const formationOverlapPairs = [];
    const narrowPlatformGroups = [];
    const groupedById = new Map();
    level.enemies.forEach((enemy) => {
      if (!enemy.groupId || enemy.groupSize <= 1) return;
      if (!groupedById.has(enemy.groupId)) groupedById.set(enemy.groupId, []);
      groupedById.get(enemy.groupId).push(enemy);
    });

    for (const [groupId, members] of groupedById.entries()) {
      const ordered = [...members].sort((a, b) => a.groupIndex - b.groupIndex || a.x - b.x);
      const supportPlatform = ordered[0]?.platform;
      if (supportPlatform && !supportPlatform.ground && supportPlatform.w < 220) {
        narrowPlatformGroups.push(groupId);
      }
      for (let index = 0; index < ordered.length - 1; index += 1) {
        const left = ordered[index];
        const right = ordered[index + 1];
        const currentOverlap = left.x + left.w > right.x + 0.5;
        const patrolOverlap = Number.isFinite(left.maxX) && Number.isFinite(right.minX)
          && left.maxX + left.w > right.minX + 0.5;
        if (currentOverlap || patrolOverlap) {
          formationOverlapPairs.push(`${groupId}:${left.groupIndex}-${right.groupIndex}`);
        }
      }
    }

    game.formationOverlapPairs = formationOverlapPairs;
    game.formationOverlapCount = formationOverlapPairs.length;
    game.narrowPlatformGroups = narrowPlatformGroups;
    game.formationRules = {
      groupedGroundOrLargeOnly: true,
      minimumGap: 8,
      noOverlap: formationOverlapPairs.length === 0,
    };
  }

  function groundCheckpointStations() {
    let repairs = 0;
    for (const checkpoint of level.checkpoints) {
      const artWidth = checkpoint.artStyle === 'goldenCactus' ? 204 : checkpoint.w;
      const artLeft = checkpoint.x - (artWidth - checkpoint.w) * 0.5;
      const supportLeft = Math.floor(artLeft - 34);
      const supportRight = Math.ceil(artLeft + artWidth + 34);
      let support = heroCore.findCheckpointSupport(checkpoint, level.platforms, {
        left: supportLeft,
        right: supportRight,
        surfaceY: level.groundY,
      });

      // A checkpoint is a route station, not a decorative prop suspended over
      // a cavern. If the authored expansion leaves a gap beneath its complete
      // footprint, give it a short, visible ground pull-off.
      if (!support) {
        support = {
          id: `checkpoint-pad-${checkpoint.id}`,
          x: supportLeft,
          y: level.groundY,
          w: supportRight - supportLeft,
          h: 80,
          ground: true,
          mainRoute: true,
          checkpointPad: true,
          checkpointSupport: true,
        };
        level.platforms.push(support);
        repairs += 1;
      }

      checkpoint.support = support;
      checkpoint.surfaceY = support.y;
      checkpoint.y = support.y - checkpoint.h;
      checkpoint.grounded = true;
      checkpoint.groundRepair = Boolean(support.checkpointPad && support.id === `checkpoint-pad-${checkpoint.id}`);
    }
    game.checkpointGroundingRepairs = repairs;
  }

  function buildLevel() {
    game.levelWidth = zones.levelWidth;
    level.goal = { x: zones.goalX, y: 336, w: 110, h: 120 };
    level.checkpoints = heroCore.createCheckpointSet(checkpointDefs);
    level.platforms = [
      { x: 0, y: 460, w: 920, h: 80 },
      { x: 980, y: 460, w: 540, h: 80 },
      { x: 1580, y: 460, w: 640, h: 80 },
      { x: 2280, y: 460, w: 580, h: 80 },
      { x: 2940, y: 460, w: 700, h: 80 },
      { x: 3700, y: 460, w: 700, h: 80 },
      { x: 420, y: 360, w: 180, h: 26 },
      { x: 720, y: 300, w: 160, h: 26 },
      { x: 1090, y: 340, w: 160, h: 26 },
      { x: 1380, y: 270, w: 160, h: 26 },
      { x: 1710, y: 320, w: 150, h: 26 },
      { x: 1960, y: 240, w: 140, h: 26 },
      { x: 2450, y: 350, w: 180, h: 26 },
      { x: 2740, y: 280, w: 160, h: 26 },
      { x: 3160, y: 330, w: 170, h: 26 },
      { x: 3370, y: 292, w: 150, h: 26 },
      { x: 3570, y: 252, w: 150, h: 26 },
      { x: 3770, y: 292, w: 150, h: 26 },
      { x: 3970, y: 248, w: 180, h: 26 },
      { x: 4210, y: 300, w: 120, h: 26 },
    ];

    level.collectibles = [
      { x: 290, y: 412, w: 24, h: 24, type: 'taco', bob: 0, collected: false },
      { x: 480, y: 310, w: 24, h: 24, type: 'taco', bob: 0.4, collected: false },
      { x: 560, y: 412, w: 24, h: 24, type: 'taco', bob: 0.8, collected: false },
      { x: 760, y: 250, w: 24, h: 24, type: 'taco', bob: 0.2, collected: false },
      { x: 1120, y: 290, w: 24, h: 24, type: 'taco', bob: 0.6, collected: false },
      { x: 1440, y: 220, w: 24, h: 24, type: 'taco', bob: 0.1, collected: false },
      { x: 1760, y: 270, w: 24, h: 24, type: 'taco', bob: 0.7, collected: false },
      { x: 1990, y: 190, w: 24, h: 24, type: 'taco', bob: 0.5, collected: false },
      { x: 2320, y: 412, w: 24, h: 24, type: 'taco', bob: 0.3, collected: false },
      { x: 2500, y: 300, w: 24, h: 24, type: 'taco', bob: 0.9, collected: false },
      { x: 2790, y: 230, w: 24, h: 24, type: 'taco', bob: 0.2, collected: false },
      { x: 3190, y: 280, w: 24, h: 24, type: 'taco', bob: 0.7, collected: false },
      { x: 3405, y: 242, w: 24, h: 24, type: 'taco', bob: 0.1, collected: false },
      { x: 3808, y: 242, w: 24, h: 24, type: 'taco', bob: 0.5, collected: false },
      { x: 4240, y: 250, w: 24, h: 24, type: 'taco', bob: 0.4, collected: false },
    ];

    level.enemies = [
      // Each opening combat beat now has a readable same-type pack. The
      // spacing is wide enough for clean landings but tight enough to invite
      // a deliberate bounce chain.
      ...heroCore.createEnemyFormation({
        id: 'opening-chili-pack', type: 'chili', startX: 760, y: 422,
        count: 2, spacing: 52, vx: 58, patrolPadding: 16,
        patrolStartOffset: 420,
        formationPurpose: 'Keep the opening approachable while teaching the charge pattern.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'opening-tomato-pack', type: 'tomato', startX: 1600, y: 422,
        count: 3, spacing: 52, vx: -64, patrolPadding: 16,
        formationPurpose: 'Give the rolling tomatoes a clear stomp rhythm.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'opening-onion-pack', type: 'onion', startX: 2300, y: 422,
        count: 3, spacing: 52, vx: 70, patrolPadding: 16,
        formationPurpose: 'Make the onion hops readable before the next platform lesson.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'opening-jalapeno-pack', type: 'jalapeno', startX: 2980, y: 422,
        count: 3, spacing: 52, vx: -68, patrolPadding: 16,
        formationPurpose: 'Turn the leap pattern into a controlled bounce sequence.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'opening-chili-pack-two', type: 'chili', startX: 3750, y: 422,
        count: 3, spacing: 52, vx: 76, patrolPadding: 16,
        formationPurpose: 'Reinforce the charge pack before Olivia arrives.',
      }),
    ];

    // Expanded second half and a riskier high route loaded with rewards.
    level.platforms.push(
      { x: 4400, y: 460, w: 520, h: 80 },
      { x: 4990, y: 460, w: 520, h: 80 },
      { x: 5580, y: 460, w: 760, h: 80 },
      { x: 930, y: 330, w: 120, h: 26 },
      { x: 1270, y: 310, w: 100, h: 26 },
      { x: 1600, y: 350, w: 100, h: 26 },
      { x: 2180, y: 300, w: 140, h: 26 },
      { x: 2340, y: 355, w: 100, h: 26 },
      { x: 2960, y: 350, w: 140, h: 26 },
      { x: 4370, y: 400, w: 100, h: 26 },
      { x: 4480, y: 355, w: 150, h: 26 },
      { x: 4690, y: 285, w: 140, h: 26 },
      { x: 4900, y: 330, w: 160, h: 26 },
      { x: 5130, y: 250, w: 160, h: 26 },
      { x: 5360, y: 305, w: 150, h: 26 },
      { x: 5580, y: 235, w: 160, h: 26 },
      { x: 5810, y: 300, w: 140, h: 26 },

      // The 50% level expansion begins with a moving-platform canyon.
      { x: 6400, y: 460, w: 150, h: 80 },
      { id: 'mover-a', x: 6570, y: 372, w: 170, h: 28, moving: true, axis: 'x', baseX: 6570, baseY: 372, range: 105, speed: 1.35, phase: 0, mainRoute: true },
      { id: 'mover-b', x: 6840, y: 330, w: 155, h: 28, moving: true, axis: 'y', baseX: 6840, baseY: 330, range: 72, speed: 1.55, phase: 1.2, mainRoute: true },
      { id: 'mover-c', x: 7085, y: 360, w: 175, h: 28, moving: true, axis: 'x', baseX: 7085, baseY: 360, range: 115, speed: 1.7, phase: 2.5, mainRoute: true },
      { id: 'mover-d', x: 7300, y: 300, w: 150, h: 28, moving: true, axis: 'y', baseX: 7300, baseY: 300, range: 64, speed: 1.85, phase: 0.55, mainRoute: true },

      // A long, uninterrupted road creates room to chase Olivia's Taco Drop truck.
      { x: 7420, y: 460, w: 2120, h: 80 },
      { x: 7690, y: 350, w: 130, h: 26 },
      { x: 8460, y: 340, w: 150, h: 26 },
      { x: 8920, y: 290, w: 160, h: 26 },

      // Another 25% of level length becomes Olivia's extended turbo runway.
      { x: 9540, y: 460, w: 2460, h: 80 },
      { x: 9740, y: 350, w: 150, h: 26 },
      { x: 9970, y: 300, w: 170, h: 26 },
      { x: 10220, y: 350, w: 160, h: 26 },
      { x: 10460, y: 290, w: 180, h: 26 },
      { x: 10720, y: 340, w: 160, h: 26 },
      { x: 10950, y: 280, w: 180, h: 26 },
      { x: 11200, y: 335, w: 145, h: 26 }
    );

    // Insert a full 3,000-unit Salsa Showdown before the existing taco-truck chase.
    // Everything that used to begin at 7,420 shifts right, preserving the proven chase.
    const showdownShift = 3000;
    for (const platform of level.platforms) {
      if (platform.x >= 7420) {
        platform.x += showdownShift;
        if (typeof platform.baseX === 'number') platform.baseX += showdownShift;
      }
    }

    level.platforms.push(
      // Forgiving lower route: one uninterrupted road through the whole showdown.
      { id: 'showdown-road', x: 7420, y: 460, w: 3000, h: 80, showdown: true },

      // High-risk arena route, with large platforms built for chained stomps.
      { id: 'arena-a', x: 7520, y: 350, w: 300, h: 28, arena: true },
      { id: 'mover-e', x: 7860, y: 305, w: 170, h: 28, moving: true, axis: 'x', baseX: 7860, baseY: 305, range: 62, speed: 1.75, phase: 0.2, style: 'tray' },
      { id: 'arena-b', x: 8100, y: 278, w: 380, h: 28, arena: true },
      { id: 'mover-f', x: 8515, y: 330, w: 165, h: 28, moving: true, axis: 'y', baseX: 8515, baseY: 330, range: 55, speed: 1.9, phase: 1.25, style: 'salsa-lift' },
      { id: 'mover-g', x: 8730, y: 286, w: 165, h: 28, moving: true, axis: 'x', baseX: 8730, baseY: 286, range: 58, speed: 2.05, phase: 3.14, style: 'paired' },
      { id: 'arena-c', x: 8950, y: 330, w: 390, h: 28, arena: true },
      { id: 'mover-h', x: 9400, y: 285, w: 180, h: 28, moving: true, axis: 'y', baseX: 9400, baseY: 285, range: 52, speed: 2.15, phase: 0.65, style: 'tortilla' },
      { id: 'pinata-arena', x: 9650, y: 320, w: 470, h: 28, arena: true, pinataArena: true },
      { id: 'showdown-exit', x: 10160, y: 365, w: 210, h: 28 }
    );

    // Optional elevated detours reward players who explore beyond the safest route.
    // Each secret ledge overlaps a proven platform enough to remain jumpable.
    level.platforms.push(
      { id: 'secret-a', x: 4870, y: 190, w: 150, h: 26, secret: true },
      { id: 'secret-b', x: 9190, y: 225, w: 145, h: 26, secret: true },
      { id: 'secret-c', x: 13110, y: 220, w: 145, h: 26, secret: true }
    );

    level.pinata = { x: 9860, y: 188, w: 58, h: 68, hits: 0, targetHits: 3, broken: false, wobble: 0 };

    // Rebuild collectible placement from the two verified traversal routes.
    level.collectibles = [];

    const addItem = (x, y, type = 'taco', bob = Math.random()) => {
      const size = type === 'golden' || type === 'rainbow' ? 34 : 24;
      level.collectibles.push({ x, y, w: size, h: size, type, bob, collected: false });
    };
    const addLine = (x, y, count, gap = 42, type = 'taco') => {
      for (let i = 0; i < count; i++) addItem(x + i * gap, y, type, i * 0.14);
    };
    const addArc = (x, y, count, gap = 40, height = 78) => {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        addItem(x + i * gap, y - Math.sin(t * Math.PI) * height, 'taco', t);
      }
    };

    // Safe ground route: straight runs plus short jump arcs across every gap.
    const groundSegments = level.platforms.filter((p) => p.h > 30).sort((a, b) => a.x - b.x);
    groundSegments.forEach((p) => addLine(p.x + 80, 412, Math.max(2, Math.floor((p.w - 150) / 52)), 52));
    for (let i = 0; i < groundSegments.length - 1; i++) {
      const from = groundSegments[i];
      const to = groundSegments[i + 1];
      const gap = to.x - (from.x + from.w);
      if (gap > 8 && gap <= 100) addArc(from.x + from.w - 45, 412, 5, (gap + 90) / 4, 62);
    }

    // Upper route: tacos sit on platforms and trace only physics-safe jumps.
    const highRoute = level.platforms.filter((p) => p.h <= 30 && !p.moving).sort((a, b) => a.x - b.x);
    highRoute.forEach((p, index) => {
      const count = Math.max(1, Math.floor((p.w - 30) / 42));
      addLine(p.x + 18, p.y - 48, count, 42);
      if (index < highRoute.length - 1) {
        const next = highRoute[index + 1];
        const gap = next.x - (p.x + p.w);
        if (gap >= 0 && gap <= 130) {
          const span = gap + 76;
          addArc(p.x + p.w - 38, Math.min(p.y, next.y) - 35, 5, span / 4, 52);
        }
      }
    });

    // Rewards ride with each moving platform so timing the canyon feels worthwhile.
    level.platforms.filter((p) => p.moving).forEach((p) => {
      for (let i = 0; i < 3; i++) {
        const item = { x: p.x + 28 + i * 42, y: p.y - 48, w: 24, h: 24, type: 'taco', bob: i * 0.2, collected: false };
        item.ridePlatform = p;
        item.rideOffsetX = 28 + i * 42;
        item.rideOffsetY = -48;
        level.collectibles.push(item);
      }
    });

    addItem(1325, 250, 'golden');
    addItem(3595, 190, 'golden');
    addItem(5625, 175, 'golden');
    // Ingredient sprites are intentionally held back until each returns as a
    // distinct, readable superpower instead of another generic collectible.
    // Guaranteed magnet at the entrance makes the airborne reward route irresistible.
    addItem(7588, 292, 'magnet');
    addItem(4928, 132, 'rainbow');
    addItem(9248, 167, 'rainbow');
    addItem(13168, 162, 'rainbow');

    level.enemies.push(
      ...heroCore.createEnemyFormation({
        id: 'drop-tomato-pack', type: 'tomato', startX: 4510, y: 422,
        count: 3, spacing: 52, vx: 82, patrolPadding: 16,
        formationPurpose: 'Keep the drop runway readable with a tomato rolling pack.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'drop-onion-pack', type: 'onion', startX: 5090, y: 422,
        count: 3, spacing: 52, vx: -76, patrolPadding: 16,
        formationPurpose: 'Create an onion-hop group beneath the moving ledge.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'drop-jalapeno-pack', type: 'jalapeno', startX: 5660, y: 422,
        count: 3, spacing: 52, vx: 88, patrolPadding: 16,
        formationPurpose: 'Make the late drop approach a clean leap-and-bounce sequence.',
      }),

      // Each showdown platform now teaches one personality at a time. The
      // first arena is a generous five-tomato bounce line, followed by a
      // jalapeño leap group, an onion hop group, and a three-chili piñata guard.
      ...heroCore.createEnemyFormation({
        id: 'showdown-tomato-pack', type: 'tomato', startX: 7545, y: 312,
        count: 5, spacing: 55, vx: 48, patrolPadding: 0, arenaId: 'arena-a',
        formationPurpose: 'Teach the full stomp-chain rhythm with a forgiving tomato line.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'showdown-jalapeno-pack', type: 'jalapeno', startX: 8160, y: 240,
        count: 3, spacing: 100, vx: 58, patrolPadding: 0, arenaId: 'arena-b',
        formationPurpose: 'Make the leap timing readable as one same-type group.',
      }),
      ...heroCore.createEnemyFormation({
        id: 'showdown-onion-pack', type: 'onion', startX: 9015, y: 292,
        count: 3, spacing: 120, vx: 56, patrolPadding: 0, arenaId: 'arena-c',
        formationPurpose: 'Keep the combo alive through a spaced onion-hop group.',
      }),
      // Three stomps in the final arena smash the hanging taco piñata.
      ...heroCore.createEnemyFormation({
        id: 'pinata-chili-pack', type: 'chili', startX: 9725, y: 282,
        count: 3, spacing: 130, vx: 50, patrolPadding: 0,
        arenaId: 'pinata-arena', pinataArena: true,
        formationPurpose: 'Set up three clean chili stomps for the piñata jackpot.',
      })
    );

    extendDropRunway();
    expandLevelSections();
    removeOpeningLeadEnemy();
    // Mark every full-height route segment explicitly. The authored source
    // predates the shared platform-role contract and some ground pieces only
    // carried their height/y geometry, which made them look like elevated
    // surfaces to formation and reward audits.
    level.platforms.forEach((platform) => {
      if ((platform.h || 0) > 30 && platform.y >= level.groundY - 2) {
        platform.ground = true;
        platform.mainRoute ??= true;
      }
    });
    applyWorldOnePilotRemaster();
    groundCheckpointStations();

    level.enemies.forEach((enemy, index) => {
      enemy.baseY = enemy.y;
      enemy.baseSpeed = Math.abs(enemy.vx);
      enemy.dir = enemy.vx < 0 ? -1 : 1;
      enemy.behaviorClock = enemy.groupId
        ? (Number(enemy.groupIndex || 0) * 0.16) % 3.2
        : (index * 0.57) % 3.2;
      enemy.previousY = enemy.y;
      enemy.tearTimer = 0.15 + (index % 4) * 0.12;
      enemy.rollAngle = 0;
      enemy.telegraph = false;
      enemy.charging = false;
      enemy.rolling = false;
      enemy.defeated = false;
      enemy.defeatTimer = 0;
    });
    game.platformEnemyStats = heroCore.attachEnemiesToPlatforms(level.enemies, level.platforms, {
      surfaceTolerance: 32,
      edgePadding: 12,
    });
    game.enemyPatrolAudit = heroCore.retuneEnemyFormationPatrols(level.enemies, {
      fullPlatformCoverage: true,
      minimumGap: 8,
      edgePadding: 12,
    });
    auditEnemyFormations();
    level.checkpoints.forEach((checkpoint) => { checkpoint.activated = false; });

    game.totalCollectibles = level.collectibles.length;
    game.totalGolden = level.collectibles.filter((item) => item.type === 'golden' && !item.bonusReward).length;
    game.totalRainbow = level.collectibles.filter((item) => item.type === 'rainbow' && !item.bonusReward).length;
    const groundRoute = level.platforms
      .filter((platform) => platform.y >= level.groundY - 2 || platform.mainRoute)
      .sort((a, b) => a.x - b.x);
    let coveredTo = 0;
    game.routeMaxGap = groundRoute.reduce((maximum, platform) => {
      const gap = Math.max(0, platform.x - coveredTo);
      coveredTo = Math.max(coveredTo, platform.x + platform.w);
      return Math.max(maximum, gap);
    }, 0);
    const elevated = level.platforms.filter((platform) => platform.y < level.groundY - 20);
    game.platformOverlapPairs = [];
    elevated.forEach((platform, index) => {
      elevated.slice(index + 1).forEach((other) => {
        if (
          platform.x < other.x + other.w
          && platform.x + platform.w > other.x
          && Math.abs(platform.y - other.y) < 42
        ) {
          game.platformOverlapPairs.push(
            `${platform.id || 'platform'}@${Math.round(platform.x)}:${Math.round(platform.y)}|`
            + `${other.id || 'platform'}@${Math.round(other.x)}:${Math.round(other.y)}`,
          );
        }
      });
    });
    game.platformOverlapCount = game.platformOverlapPairs.length;
    game.checkpointsGrounded = level.checkpoints.filter((checkpoint) => (
      checkpoint.grounded
      && checkpoint.support
      && Math.abs(checkpoint.y + checkpoint.h - checkpoint.support.y) <= 2
      && Math.abs(checkpoint.support.y - level.groundY) <= 2
    )).length;
  }

  function resetGame() {
    buildLevel();
    game.state = 'title';
    game.score = 0;
    game.collected = 0;
    game.hearts = 3;
    game.startTime = 0;
    game.finishTime = 0;
    game.cameraX = 0;
    game.levelTime = 0;
    game.confetti = [];
    game.fireworks = [];
    game.tacoRain = [];
    game.pinataBurst = null;
    game.splatParticles = [];
    game.impactTexts = [];
    game.cameraShake = 0;
    game.hitStop = 0;
    game.celebrationTicker = 0;
    game.celebrationStartTime = 0;
    game.streak = 0;
    game.streakTimer = 0;
    game.bestStreak = 0;
    game.salsaMeter = 0;
    game.frenzyTimer = 0;
    game.magnetTimer = 0;
    game.goldenCollected = 0;
    game.stompCombo = 0;
    game.stompTimer = 0;
    game.bestStompCombo = 0;
    game.lastStomp = null;
    game.airChain = 0;
    game.airChainTimer = 0;
    game.maxAirChain = 0;
    game.rainbowCollected = 0;
    game.showdownAnnounced = false;
    game.radioMessage = '';
    game.radioTimer = 0;
    game.radioFlags = { intro: false, showdown: false, chase: false, finale: false };
    game.cinematicTimer = 0;
    game.cinematicDuration = 0;
    game.cinematicTargetX = 0;
    game.cinematicLabel = '';
    game.cinematicFlags = { showdown: false, chase: false, finale: false };
    game.latestCheckpoint = null;
    game.message = '';
    game.messageTimer = 0;
    game.midTruckEntering = false;
    game.midTruckActive = false;
    game.midTruckEscaping = false;
    game.midTruckDone = false;
    game.truckDropTimer = 0;
    game.truckDropPulse = 0;
    game.truckLauncherWorldX = 0;
    game.dropTruckX = 0;
    game.midTruckEntrySpeed = 0;
    game.midTruckEscapeSpeed = 0;
    game.encoreTruckEntering = false;
    game.encoreTruckActive = false;
    game.encoreTruckEscaping = false;
    game.encoreTruckDone = false;
    game.encoreTruckX = 0;
    game.encoreTruckEntrySpeed = 0;
    game.encoreTruckEscapeSpeed = 0;
    game.encoreDropTimer = 0;
    game.encoreDropBurst = 0;
    game.chaseTruckActive = false;
    game.chaseTruckEscaping = false;
    game.chaseTruckDone = false;
    game.chaseTruckX = 0;
    game.chaseDropTimer = 0;
    game.chaseCatchCount = 0;
    game.chaseEscapeSpeed = 0;
    game.chaseEscapeTimer = 0;
    game.finalRushStarted = false;
    game.partyBeat = -1;
    game.partyBonus = 0;
    game.partyRank = '';
    game.finishHypeStage = 0;
    game.finishSparkTimer = 0;
    game.fallSoundPlayed = false;
    Object.assign(game.respawn, heroCore.createRespawnState());
    game.respawnCount = 0;
    game.respawnFallbacks = 0;
    game.lastRespawnLanding = null;
    game.routeMaxGap = game.routeMaxGap || 0;
    game.platformOverlapCount = game.platformOverlapCount || 0;
    game.checkpointsGrounded = game.checkpointsGrounded || 0;
    game.settingsOpen = false;

    player.x = 160;
    player.y = 360;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.invulnerable = 0;
    player.dir = 1;
    player.anim = 0;
    player.rotation = 0;
    player.scale = 1;
    player.platform = null;
    player.coyote = 0;
    player.jumpBuffer = 0;

    stopCelebrationMusic();
    stopLevelMusic();
    hideWin();
    closeSettings();
    showStart();
  }

  function showStart() {
    startOverlay.classList.remove('hidden');
    startOverlay.classList.add('visible');
  }

  function hideStart() {
    startOverlay.classList.add('hidden');
    startOverlay.classList.remove('visible');
  }

  function showWin() {
    winOverlay.classList.remove('hidden');
    winOverlay.classList.add('visible');
    requestAnimationFrame(() => winOverlay.querySelector('[data-next-level]')?.focus());
  }

  function hideWin() {
    winOverlay.classList.add('hidden');
    winOverlay.classList.remove('visible');
  }

  function openSettings() {
    game.settingsOpen = true;
    keys.left = false;
    keys.right = false;
    keys.jump = false;
    keys.jumpQueued = false;
    syncSettingsUI();
    settingsOverlay.classList.remove('hidden');
    settingsOverlay.classList.add('visible');
    closeSettingsBtn.focus();
  }

  function closeSettings() {
    game.settingsOpen = false;
    settingsOverlay.classList.add('hidden');
    settingsOverlay.classList.remove('visible');
  }

  const radioLines = {
    intro: [
      'OLIVIA: Warm-up lap! The tacos are emotionally available.',
      'OLIVIA: Radio check. Crunch responsibly, hero.',
      'OLIVIA: I packed extra salsa and exactly zero brakes.',
    ],
    showdown: [
      'OLIVIA: Salsa Showdown ahead. Bounce first, ask questions never.',
      'OLIVIA: Those veggies look tough. Their shoes do not.',
      'OLIVIA: Combo forecast: extremely splatty with a chance of guac.',
    ],
    chase: [
      'OLIVIA: Catch me if you can. Catch the tacos if you cannot!',
      'OLIVIA: Turbo mode engaged. My insurance agent felt that.',
      'OLIVIA: Floor it, taco! Dinner is escaping!',
    ],
    finale: [
      'OLIVIA: Fiesta gate ahead. Bring the crunch home!',
      'OLIVIA: Parked the truck. Saved you the loudest confetti.',
      'OLIVIA: Final stretch! You ate this level. Zero crumbs.',
    ],
  };

  function triggerRadio(section) {
    if (game.radioFlags[section]) return;
    const choices = radioLines[section] || [];
    if (!choices.length) return;
    game.radioFlags[section] = true;
    game.radioMessage = choices[Math.floor(Math.random() * choices.length)];
    game.radioTimer = 4.2;
    playAudio('ui.radio');
  }

  function startCinematic(section, label, targetX, duration = 1.35) {
    if (game.cinematicFlags[section]) return;
    game.cinematicFlags[section] = true;
    game.cinematicLabel = label;
    game.cinematicTargetX = targetX;
    game.cinematicDuration = duration;
    game.cinematicTimer = duration;
  }

  function startGame() {
    hideStart();
    hideWin();
    game.state = 'playing';
    game.startTime = performance.now();
    unlockAudio();
    playAudio('ui.start');
    if (localPreviewStart > 0) {
      player.x = clamp(localPreviewStart, 0, game.levelWidth - player.w);
      player.y = localPreviewY > 0 ? clamp(localPreviewY, 0, canvas.height - player.h) : 360;
      game.cameraX = clamp(player.x - canvas.width * 0.42, 0, game.levelWidth - canvas.width);
      if (level.pinata && localPreviewPinataHits > 0) {
        level.pinata.hits = clamp(localPreviewPinataHits, 0, level.pinata.targetHits - 1);
      }
      if (localPreviewFrenzy) game.frenzyTimer = 5;
      if (localPreviewAutoRun) keys.right = true;
      if (localPreviewStart >= zones.chaseStart && localPreviewStart < zones.chaseEnd) {
        game.chaseTruckActive = true;
        game.chaseTruckX = player.x + 255;
      }
    }
    if (localPreviewRespawn) {
      if (localPreviewRespawnCheckpoint >= 0 && level.checkpoints[localPreviewRespawnCheckpoint]) {
        game.latestCheckpoint = level.checkpoints[localPreviewRespawnCheckpoint];
      }
      beginRespawn(false, player.x, canvas.height - player.h - 10);
    }
    playLevelMusic();
    triggerRadio('intro');
  }

  function unlockAudio() {
    audio?.init({
      musicVolume: game.musicVolume,
      effectsVolume: game.effectsVolume,
      muted: game.muted,
    });
  }

  function playAudio(eventId, options = {}) {
    return audio?.play(eventId, options) || null;
  }

  function audioPosition(worldX) {
    return clamp(((worldX - game.cameraX) / canvas.width) * 2 - 1, -1, 1);
  }

  function spawnSplatParticles(enemy, amount = 24) {
    const palettes = {
      chili: ['#ff4b45', '#8d5cff', '#60d069'],
      tomato: ['#f34f48', '#65d8ff', '#57c95b'],
      onion: ['#dba8ee', '#ff67ad', '#65d8ff'],
      jalapeno: ['#54c85a', '#ffd166', '#ff5f91'],
    };
    const colors = palettes[enemy.type] || palettes.tomato;
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 290;
      game.splatParticles.push({
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        g: 680 + Math.random() * 360,
        life: 0.55 + Math.random() * 0.55,
        size: 3 + Math.random() * 7,
        color: colors[i % colors.length],
        round: i % 3 === 0,
      });
    }
  }

  function spawnImpactText(x, y, text, color = '#ffd166', size = 28) {
    game.impactTexts.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9, vy: -64 });
  }

  function spawnBonusItem(x, y, type = 'taco', vx = 0, vy = -260) {
    const size = type === 'golden' || type === 'rainbow' ? 34 : type === 'magnet' ? 30 : 24;
    level.collectibles.push({
      x,
      y,
      w: size,
      h: size,
      type,
      bob: Math.random(),
      collected: false,
      isDrop: true,
      landed: false,
      bonusReward: true,
      vx,
      vy,
      angle: Math.random() * Math.PI * 2,
    });
  }

  function increaseAirChain(label = 'AIRBORNE APPETITE', celebrate = true) {
    game.airChain += 1;
    game.maxAirChain = Math.max(game.maxAirChain, game.airChain);
    game.airChainTimer = 1.8;
    if (game.airChain >= 5 && game.airChain % 5 === 0) {
      game.message = `${label} ×${game.airChain}!`;
      game.messageTimer = 1.15;
      game.score += game.airChain * 8;
      if (celebrate) spawnConfetti(canvas.width * 0.5, 190, 36);
      playAudio('combat.comboMilestone', { combo: game.airChain });
    }
  }

  function hitPinata() {
    const pinata = level.pinata;
    if (!pinata || pinata.broken) return;
    pinata.hits += 1;
    pinata.wobble = 0.5;
    spawnConfetti(pinata.x - game.cameraX + pinata.w / 2, pinata.y + pinata.h / 2, 28);
    playAudio('pinata.hit', {
      combo: pinata.hits,
      position: audioPosition(pinata.x + pinata.w / 2),
    });

    if (pinata.hits < pinata.targetHits) {
      spawnImpactText(pinata.x + pinata.w / 2, pinata.y - 10, `PIÑATA HIT ${pinata.hits}/${pinata.targetHits}!`, '#ff67ad', 24);
      return;
    }
    pinata.broken = true;
    game.score += 1000;
    game.message = 'KABOOM! TACO RAINBOW JACKPOT!';
    game.messageTimer = 2.6;
    game.cameraShake = 25;
    game.hitStop = Math.max(game.hitStop, 0.15);
    game.pinataBurst = {
      x: pinata.x + pinata.w / 2,
      y: pinata.y + pinata.h / 2,
      life: 2.8,
      maxLife: 2.8,
    };
    spawnImpactText(pinata.x + pinata.w / 2, pinata.y - 18, 'KABOOM!', '#fff1a6', 54);
    for (let i = 0; i < 24; i++) {
      const type = i % 11 === 0 ? 'rainbow' : i % 7 === 0 ? 'golden' : 'taco';
      const fan = i / 23;
      const vx = -440 + fan * 880 + (Math.random() - 0.5) * 55;
      const vy = -345 - Math.sin(fan * Math.PI) * 185 - Math.random() * 105;
      spawnBonusItem(pinata.x + pinata.w / 2, pinata.y + pinata.h / 2, type, vx, vy);
    }
    spawnConfetti(pinata.x - game.cameraX + pinata.w / 2, pinata.y + pinata.h / 2, 220);
    for (let i = 0; i < 5; i++) spawnFirework();
    playAudio('pinata.break', { position: audioPosition(pinata.x + pinata.w / 2) });
  }

  function defeatEnemy(enemy, perfectBounce = true, stompOptions = {}) {
    if (enemy.defeated || !enemy.alive) return;
    enemy.defeated = true;
    enemy.defeatTimer = 0.34;
    enemy.vx = 0;

    const reward = enemy.rewardProfile || heroCore.getEnemyRewardProfile(enemy);
    const authoredScore = Math.max(0, Number(reward?.score) || 0);
    const authoredMeter = Math.max(0, Number(reward?.meter) || 0);

    if (perfectBounce) {
      game.stompCombo = game.stompTimer > 0 ? game.stompCombo + 1 : 1;
      game.stompTimer = heroPhysics.stompComboWindow;
      game.bestStompCombo = Math.max(game.bestStompCombo, game.stompCombo);
      game.score += 35 + game.stompCombo * 20 + authoredScore;
      // Resolve the contact at the enemy's top before launching Taco Hero. A
      // fast fall can overlap the sprite by a few pixels between frames, and
      // snapping the landing point makes every successful stomp visibly bounce
      // instead of looking like a side hit.
      if (Number.isFinite(stompOptions.enemyTop)) {
        player.y = Math.min(player.y, stompOptions.enemyTop - player.h - 1);
      } else {
        player.y = Math.min(player.y, enemy.y - player.h - 1);
      }
      player.vy = -heroPhysics.enemyBounceVelocity;
      game.lastStomp = {
        type: enemy.type,
        role: enemy.role,
        x: Math.round(enemy.x),
        y: Math.round(enemy.y),
        bounceVelocity: -heroPhysics.enemyBounceVelocity,
        combo: game.stompCombo,
      };
      increaseAirChain('AIRBORNE APPETITE');
    } else {
      game.score += 75 + Math.round(authoredScore * 0.5);
    }
    game.salsaMeter = Math.min(100, game.salsaMeter + authoredMeter);

    const combo = Math.max(1, game.stompCombo);
    const feedback = heroCore.splatFeedback(combo, perfectBounce);
    spawnSplatParticles(enemy, perfectBounce ? 24 + combo * 3 : 20);
    spawnImpactText(enemy.x + enemy.w / 2, enemy.y - 8, feedback.text, feedback.color, feedback.size);
    // Both outcomes physically flatten the enemy. A normal success gets the
    // standalone juicy splat, while the earned downward stomp adds the shared
    // splat family's elastic rebound layer and combo pitch language.
    playAudio(perfectBounce ? 'combat.enemyStomp' : 'combat.enemySplat', {
      enemyType: enemy.type,
      combo,
      position: audioPosition(enemy.x + enemy.w / 2),
    });
    game.hitStop = perfectBounce ? 0.065 : 0.035;
    game.cameraShake = Math.max(game.cameraShake, perfectBounce ? 7 + combo * 1.7 : 5);

    if (perfectBounce) {
      heroCore.celebrateSplatCombo(combo, {
        reduced: game.reducedShake,
        onCelebrate: (reward) => {
          const screenX = enemy.x - game.cameraX + enemy.w / 2;
          spawnConfetti(screenX, enemy.y + enemy.h / 2, reward.confetti);
          spawnImpactText(
            enemy.x + enemy.w / 2,
            enemy.y - 34,
            reward.label,
            reward.burstColors[0],
            reward.tier === 'supremacy' ? 44 : reward.tier === 'rainbow' ? 40 : 30,
          );
          game.message = reward.label;
          game.messageTimer = reward.duration;
          game.hitStop = Math.max(game.hitStop, reward.hitStop);
          game.cameraShake = Math.max(game.cameraShake, reward.shake);
          reward.burstColors.forEach((color, index) => {
            game.splatParticles.push({
              x: enemy.x + enemy.w / 2,
              y: enemy.y + enemy.h / 2,
              vx: (index - (reward.burstColors.length - 1) / 2) * 85,
              vy: -250 - index * 24,
              g: 620,
              life: reward.tier === 'supremacy' ? 1.15 : 0.8,
              size: reward.tier === 'supremacy' ? 12 : 8,
              color,
              round: true,
            });
          });
          playAudio('combat.comboMilestone', {
            combo,
            gain: reward.tier === 'supremacy' ? 1.08 : 1,
          });
        },
      });
    }

    const rewardCount = perfectBounce
      ? Math.max(1, Math.min(6, Number(reward?.tacoCount) || 2))
      : 1;
    for (let i = 0; i < rewardCount; i++) {
      spawnBonusItem(
        enemy.x + enemy.w / 2,
        enemy.y,
        'taco',
        (i - (rewardCount - 1) / 2) * 78,
        -230 - Math.random() * 100,
      );
    }

    if (perfectBounce && reward?.bonusItem && reward.bonusItem !== 'taco') {
      spawnBonusItem(enemy.x + enemy.w / 2, enemy.y - 12, reward.bonusItem, 0, -350);
      if (reward.message && combo === 1) {
        game.message = reward.message;
        game.messageTimer = 1.35;
      }
    }

    if (perfectBounce && combo === 3) {
      spawnBonusItem(enemy.x + enemy.w / 2, enemy.y - 10, 'golden', 0, -370);
      game.message = 'TRIPLE SPLAT! BONUS GOLDEN TACO!';
      game.messageTimer = 1.6;
    }
    if (perfectBounce && combo === 5) {
      spawnBonusItem(enemy.x + enemy.w / 2, enemy.y - 10, 'rainbow', 0, -390);
      game.magnetTimer = Math.max(game.magnetTimer, 5);
      game.message = 'RAINBOW RAMPAGE! TACO MAGNET!';
      game.messageTimer = 2;
      playAudio('ability.magnetStart');
    }
    if (perfectBounce && combo === 8) {
      game.frenzyTimer = Math.max(game.frenzyTimer, 8);
      player.invulnerable = Math.max(player.invulnerable, 8);
      game.magnetTimer = Math.max(game.magnetTimer, 8);
      game.message = 'SALSA SUPREMACY! TACO FRENZY!';
      game.messageTimer = 2.5;
      playAudio('ability.frenzyStart');
    }
    // Every splatted enemy in the dedicated three-enemy arena counts. Taco
    // Frenzy contact defeats are normal non-bounce splats, but they should
    // never strand the piñata at "3 STOMPS" after the whole arena is cleared.
    if (enemy.pinataArena) hitPinata();
  }

  function desiredMusicName() {
    if (game.state === 'celebrating' || game.state === 'won') return 'fiesta';
    // Hold the chase arrangement through the final run-up so the goal triggers
    // one clean chase-to-fiesta handoff instead of a brief third arrangement.
    if (game.chaseTruckActive || game.chaseTruckEscaping || (player.x >= zones.chaseStart && player.x < level.goal.x)) return 'chase';
    if (player.x >= zones.showdownMusicStart && player.x < zones.chaseStart) return 'showdown';
    return 'exploration';
  }

  function setMusicTrack(name, immediate = false) {
    if (game.muted || !musicTracks[name]) return;
    const next = musicTracks[name];
    if (activeMusicName === name) {
      next.play().catch(() => {});
      return;
    }

    // A new zone can be reached before the previous crossfade finishes. Retire
    // every abandoned track first so no third arrangement can remain audible.
    if (musicTransition) {
      const current = activeMusicName ? musicTracks[activeMusicName] : null;
      for (const track of allMusic) {
        if (track !== current) {
          track.pause();
          track.volume = 0;
        }
      }
      musicTransition = null;
    }

    const from = activeMusicName ? musicTracks[activeMusicName] : null;
    for (const track of allMusic) {
      if (track !== from && track !== next) {
        track.pause();
        track.volume = 0;
      }
    }
    next.playbackRate = 1;
    next.currentTime = 0;
    next.volume = immediate || !from ? (game.settingsOpen ? 0.48 : 1) : 0;
    next.play().catch(() => {});
    activeMusicName = name;

    if (immediate || !from) {
      for (const track of allMusic) {
        if (track !== next) {
          track.pause();
          track.volume = 0;
        }
      }
      musicTransition = null;
    } else {
      const durations = { exploration: 1.8, showdown: 1.8, chase: 1.2, fiesta: 2.1 };
      const fromGain = clamp(from.volume / Math.max(0.001, game.settingsOpen ? 0.48 : 1), 0, 1);
      musicTransition = { from, to: next, fromGain, elapsed: 0, duration: durations[name] || 1.8 };
    }
  }

  function updateMusicMix(dt) {
    const base = game.settingsOpen ? 0.48 : 1;
    if (musicTransition) {
      musicTransition.elapsed += dt;
      const t = clamp(musicTransition.elapsed / musicTransition.duration, 0, 1);
      // Smoothstep has zero slope at both ends and equal-gain mixing avoids the
      // volume bump that can make two arrangements sound stacked together.
      const mix = t * t * (3 - 2 * t);
      musicTransition.from.volume = base * musicTransition.fromGain * (1 - mix);
      musicTransition.to.volume = base * mix;
      if (t >= 1) {
        musicTransition.from.pause();
        musicTransition.to.volume = base;
        musicTransition = null;
      }
    } else if (activeMusicName && musicTracks[activeMusicName]) {
      musicTracks[activeMusicName].volume = base;
    }
  }

  function playLevelMusic() {
    setMusicTrack(desiredMusicName(), !activeMusicName);
  }

  function stopLevelMusic() {
    for (const track of allMusic) {
      track.pause();
      track.currentTime = 0;
      track.playbackRate = 1;
      track.volume = 0;
    }
    activeMusicName = null;
    musicTransition = null;
  }

  function playCelebrationMusic() {
    setMusicTrack('fiesta');
  }

  function stopCelebrationMusic() {
    stopLevelMusic();
  }

  function toggleMute() {
    game.muted = !game.muted;
    audio?.setMuted(game.muted);
    for (const track of allMusic) track.muted = game.muted;
    muteBtn.textContent = game.muted ? '🔇 Sound Off' : '🔊 Sound On';
    if (!game.muted) {
      unlockAudio();
      setMusicTrack(desiredMusicName(), true);
    } else {
      stopLevelMusic();
    }
    saveProgress();
  }

  function image(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = path;
    });
  }

  async function loadAssets() {
    await Promise.all([
      world1Background.ready,
      ...imageNames.map(async (name) => {
        images[name] = await image(`assets/${name}.png`);
      }),
      ...webpImageNames.map(async (name) => {
        images[name] = await image(`assets/${name}.webp`);
      }),
    ]);
  }

  function queueJump() {
    keys.jump = true;
    keys.jumpQueued = true;
    player.jumpBuffer = heroPhysics.jumpBufferTime;
  }

  function clearJump() {
    keys.jump = false;
  }

  function handleKey(event, down) {
    const code = event.code;
    if (down && code === 'Escape' && game.settingsOpen) {
      closeSettings();
      settingsBtn.focus();
      return;
    }
    if (game.settingsOpen) return;
    if (['ArrowLeft', 'KeyA'].includes(code)) keys.left = down;
    if (['ArrowRight', 'KeyD'].includes(code)) keys.right = down;
    if (['Space', 'ArrowUp', 'KeyW'].includes(code)) {
      if (down) queueJump();
      else clearJump();
    }
    if (down && code === 'Enter' && game.state === 'title') {
      startGame();
    }
  }

  function setupInputs() {
    window.addEventListener('keydown', (event) => handleKey(event, true));
    window.addEventListener('keyup', (event) => handleKey(event, false));
    const releaseInputs = () => {
      keys.left = false; keys.right = false; keys.jump = false; keys.jumpQueued = false;
      player.jumpBuffer = 0;
    };
    window.addEventListener('blur', releaseInputs);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseInputs();
      lastFrame = 0;
    });

    document.querySelectorAll('.touch-btn').forEach((btn) => {
      const kind = btn.dataset.input;
      const onDown = (ev) => {
        ev.preventDefault();
        unlockAudio();
        if (game.state === 'title') startGame();
        if (kind === 'left') keys.left = true;
        if (kind === 'right') keys.right = true;
        if (kind === 'jump') queueJump();
      };
      const onUp = (ev) => {
        ev.preventDefault();
        if (kind === 'left') keys.left = false;
        if (kind === 'right') keys.right = false;
        if (kind === 'jump') clearJump();
      };
      btn.addEventListener('pointerdown', onDown);
      btn.addEventListener('pointerup', onUp);
      btn.addEventListener('pointercancel', onUp);
      btn.addEventListener('pointerleave', onUp);
    });

    window.JFT_LEVEL_START.bind(startGame);
    restartBtn.addEventListener('click', () => {
      resetGame();
      startGame();
    });
    playAgainBtn.addEventListener('click', () => {
      resetGame();
      startGame();
    });
    muteBtn.addEventListener('click', toggleMute);
    settingsBtn.addEventListener('click', () => {
      playAudio('ui.confirm');
      openSettings();
    });
    closeSettingsBtn.addEventListener('click', () => {
      playAudio('ui.confirm');
      closeSettings();
      settingsBtn.focus();
    });
    musicVolume.addEventListener('input', () => {
      game.musicVolume = Number(musicVolume.value) / 100;
      musicVolumeValue.textContent = `${musicVolume.value}%`;
      audio?.setMusicVolume(game.musicVolume);
      updateMusicMix(0);
      saveProgress();
    });
    effectsVolume.addEventListener('input', () => {
      game.effectsVolume = Number(effectsVolume.value) / 100;
      effectsVolumeValue.textContent = `${effectsVolume.value}%`;
      audio?.setEffectsVolume(game.effectsVolume);
      saveProgress();
    });
    reducedShake.addEventListener('change', () => {
      game.reducedShake = reducedShake.checked;
      saveProgress();
    });
  }

  function applyHorizontalInput(dt) {
    const turboChase = game.chaseTruckActive || game.chaseTruckEscaping;
    const accel = (player.grounded ? 1100 : 720) * (turboChase ? 1.55 : 1);
    if (keys.left) {
      player.vx -= accel * dt;
      player.dir = -1;
    }
    if (keys.right) {
      player.vx += accel * dt;
      player.dir = 1;
    }

    if (!keys.left && !keys.right) {
      player.vx *= player.grounded ? physics.frictionGround : physics.frictionAir;
      if (Math.abs(player.vx) < 6) player.vx = 0;
    }

    const maxSpeed = turboChase ? physics.moveSpeed * 1.62
      : game.frenzyTimer > 0 ? physics.moveSpeed * 1.32 : physics.moveSpeed;
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
  }

  function doJump() {
    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -heroPhysics.jumpVelocity;
      player.grounded = false;
      player.platform = null;
      player.coyote = 0;
      player.jumpBuffer = 0;
      playAudio('hero.jump', { position: audioPosition(player.x + player.w / 2) });
    }
    keys.jumpQueued = false;
  }

  function updateMovingPlatforms(dt) {
    game.levelTime += dt;
    for (const p of level.platforms) {
      p.dx = 0;
      p.dy = 0;
      if (!p.moving) continue;
      const previousX = p.x;
      const previousY = p.y;
      const wave = Math.sin(game.levelTime * p.speed + p.phase);
      if (p.axis === 'x') p.x = p.baseX + wave * p.range;
      if (p.axis === 'y') p.y = p.baseY + wave * p.range;
      p.dx = p.x - previousX;
      p.dy = p.y - previousY;
    }

    for (const item of level.collectibles) {
      if (!item.collected && item.ridePlatform) {
        item.x = item.ridePlatform.x + item.rideOffsetX;
        item.y = item.ridePlatform.y + item.rideOffsetY;
      }
    }
  }

  function isOneWayPlatform(platform) {
    return platform.h <= 30 && !platform.solidTerrain;
  }

  function crossesOneWayPlatformTop(platform, prevY) {
    if (player.vy < 0) return false;
    const prevBottom = prevY + player.h;
    const currBottom = player.y + player.h;
    const overlapsHorizontally = player.x + player.w > platform.x
      && player.x < platform.x + platform.w;
    return overlapsHorizontally
      && prevBottom <= platform.y + 12
      && currBottom >= platform.y
      && player.y < platform.y;
  }

  function landOnPlatform(platform) {
    player.y = platform.y - player.h;
    player.vy = 0;
    player.grounded = true;
    player.platform = platform;
  }

  function resolvePlatformCollision(prevY) {
    player.grounded = false;
    player.platform = null;
    for (const p of level.platforms) {
      // Match the later-level convention: elevated and moving platforms only
      // catch Taco Hero while descending across their top surface. Ground-height
      // terrain remains a full solid collider at its sides and underside.
      if (isOneWayPlatform(p)) {
        if (crossesOneWayPlatformTop(p, prevY)) {
          landOnPlatform(p);
          return;
        }
        continue;
      }

      const hits = rectsIntersect(player, p);
      if (!hits) continue;

      const prevBottom = prevY + player.h;
      const currBottom = player.y + player.h;
      const prevTop = prevY;
      const currTop = player.y;

      if (prevBottom <= p.y + 12 && currBottom >= p.y) {
        landOnPlatform(p);
      } else if (prevTop >= p.y + p.h - 12 && currTop <= p.y + p.h) {
        player.y = p.y + p.h;
        player.vy = 10;
      } else if (player.x + player.w * 0.5 < p.x + p.w * 0.5) {
        player.x = p.x - player.w;
        player.vx = 0;
      } else {
        player.x = p.x + p.w;
        player.vx = 0;
      }
    }
  }


  function findRespawnPoint(sourceX) {
    if (game.latestCheckpoint && sourceX >= game.latestCheckpoint.x - 180) {
      return { landX: game.latestCheckpoint.x + 52, landY: 418, airY: 170 };
    }
    let best = null;
    let bestScore = Infinity;

    for (const p of level.platforms) {
      const landX = clamp(sourceX - player.w * 0.25, p.x + 16, p.x + p.w - player.w - 16);
      const score = Math.abs((landX + player.w * 0.5) - sourceX) + Math.abs(p.y - 340) * 0.12 + (landX > sourceX ? 50 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = {
          landX,
          landY: p.y - player.h,
          airY: Math.max(24, p.y - player.h - 250),
        };
      }
    }

    return best || { landX: 160, landY: 360, airY: 110 };
  }

  function beginRespawn(fullHeal = false, sourceX = player.x, sourceY = player.y) {
    if (game.state !== 'playing' && game.state !== 'respawning') return;

    const point = findRespawnPoint(sourceX);
    game.state = 'respawning';
    heroCore.beginRespawn(game.respawn, {
      fullHeal,
      fromX: clamp(sourceX, 0, game.levelWidth - player.w),
      fromY: Math.min(sourceY, canvas.height - player.h - 8),
      targetX: point.landX,
      targetY: point.landY,
      airY: point.airY,
    });
    game.respawnCount += 1;

    player.x = game.respawn.fromX;
    player.y = game.respawn.fromY;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.rotation = 0;
    player.scale = 1;
    player.invulnerable = 0;

    if (fullHeal) {
      game.hearts = 3;
      game.score = Math.max(0, game.score - 40);
    }

    spawnConfetti(player.x - game.cameraX + player.w * 0.5, player.y + player.h * 0.5, 18);
    playAudio('hero.respawnBeam', { position: audioPosition(player.x + player.w / 2) });
  }

  function updateRespawning(dt) {
    const r = game.respawn;
    if (!r.active) return;

    const respawnStep = heroCore.advanceRespawn(r, player, dt);
    game.cameraX = clamp(lerp(game.cameraX, clamp(r.targetX - canvas.width * 0.42, 0, game.levelWidth - canvas.width), dt * 4), 0, game.levelWidth - canvas.width);

    if (respawnStep.phase === 'vanish') {
      if (r.sparkTimer >= 0.08) {
        r.sparkTimer = 0;
        spawnConfetti(player.x - game.cameraX + player.w * 0.5, player.y + player.h * 0.5, 4);
      }
      return;
    }

    if (respawnStep.shouldPlace) {
      heroCore.placeRespawn(r, player);
      spawnConfetti(player.x - game.cameraX + player.w * 0.5, 84, 18);
    }

    if (!r.spawnPlaced) return;

    const prevY = player.y;
    player.anim += dt * 8;
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    player.y += player.vy * dt;
    resolvePlatformCollision(prevY);

    if (!player.grounded && r.timer > 3) {
      player.x = r.targetX;
      player.y = r.targetY;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = level.platforms.find((platform) => (
        player.x + player.w > platform.x + 5
        && player.x < platform.x + platform.w - 5
        && Math.abs(platform.y - (player.y + player.h)) <= 12
      )) || null;
      game.respawnFallbacks += 1;
    }

    if (player.grounded && r.timer > 0.8) {
      game.lastRespawnLanding = {
        x: Math.round(player.x),
        y: Math.round(player.y),
        grounded: true,
        fallback: r.timer > 3,
      };
      playAudio('hero.respawnLand', { position: audioPosition(player.x + player.w / 2) });
      game.fallSoundPlayed = false;
      heroCore.finishRespawn(r, player);
      game.state = 'playing';
    }
  }

  function hurtPlayer(fromX) {
    if (player.invulnerable > 0 || game.frenzyTimer > 0 || game.state !== 'playing') return;
    game.stompCombo = 0;
    game.stompTimer = 0;
    game.hearts -= 1;
    player.invulnerable = 1.2;
    player.vx = fromX < player.x ? 260 : -260;
    player.vy = -240;
    playAudio('hero.hurt', { position: audioPosition(player.x + player.w / 2) });
    if (game.hearts <= 0) {
      beginRespawn(true, player.x, player.y);
    }
  }

  function collectItem(item) {
    item.collected = true;
    const collectionEventId = item.type === 'taco' ? 'collect.taco'
      : item.type === 'golden' ? 'collect.goldenTaco'
        : item.type === 'rainbow' ? 'collect.rainbowTaco'
          : item.type === 'sauce' ? 'collect.hotSauce'
            : item.type === 'pepper' ? 'collect.jalapeno'
              : item.type === 'guac' ? 'collect.guacBowl'
                : item.type === 'magnet' ? null : 'collect.powerup';
    if (!item.bonusReward) game.collected += 1;
    game.streak += 1;
    game.streakTimer = 2.4;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    const multiplier = 1 + Math.min(4, Math.floor(game.streak / 5));
    game.score += itemTypes[item.type].points * multiplier;
    if (!player.grounded || (item.isDrop && !item.landed)) increaseAirChain('AIRBORNE APPETITE', item.type !== 'taco');
    if (item.isDrop && !item.landed) {
      game.score += item.chaseDrop ? 40 : 25;
      if (item.chaseDrop) {
        game.chaseCatchCount += 1;
        if (game.chaseCatchCount % 5 === 0) {
          game.message = `AIR TACO COMBO ×${game.chaseCatchCount}!`;
          game.messageTimer = 0.9;
        }
      } else {
        game.message = 'AIR CATCH! +25';
        game.messageTimer = 0.8;
      }
    }
    game.salsaMeter = Math.min(100, game.salsaMeter + itemTypes[item.type].meter);
    if (item.type === 'golden') {
      if (!item.bonusReward) game.goldenCollected += 1;
      game.message = item.bonusReward ? 'BONUS GOLDEN TACO!' : 'GOLDEN TACO!';
      game.messageTimer = 2.2;
      spawnFirework();
    }
    if (item.type === 'magnet') {
      game.magnetTimer = 9;
      game.message = 'TACO MAGNET! EVERYTHING IS COMING TO YOU!';
      game.messageTimer = 2.1;
      spawnConfetti(item.x - game.cameraX + item.w / 2, item.y + item.h / 2, 70);
      playAudio('ability.magnetStart', { position: audioPosition(item.x + item.w / 2) });
    }
    if (item.type === 'rainbow') {
      if (!item.bonusReward) game.rainbowCollected += 1;
      game.magnetTimer = Math.max(game.magnetTimer, 5);
      game.message = item.bonusReward
        ? 'RAINBOW KABOOM TACO!'
        : `SECRET RAINBOW TACO! ${game.rainbowCollected}/${game.totalRainbow}`;
      game.messageTimer = 2.4;
      game.cameraShake = Math.max(game.cameraShake, 12);
      spawnConfetti(item.x - game.cameraX + item.w / 2, item.y + item.h / 2, 110);
      spawnFirework();
      spawnFirework();
    }
    if (item.type === 'guac') game.hearts = Math.min(3, game.hearts + 1);
    if (item.type === 'pepper') player.vy = Math.min(player.vy, -360);
    if (item.type === 'sauce') player.vx += player.dir * 110;
    if (game.salsaMeter >= 100 && game.frenzyTimer <= 0) {
      game.frenzyTimer = 8;
      game.salsaMeter = 0;
      player.invulnerable = 8;
      game.message = 'TACO FRENZY!';
      game.messageTimer = 2.3;
      spawnConfetti(canvas.width * 0.5, 170, 70);
      playAudio('ability.frenzyStart');
    } else if (game.streak === 5) {
      game.message = 'TACO STREAK!';
      game.messageTimer = 1.4;
    } else if (game.streak === 10) {
      game.message = 'SALSA FEVER!';
      game.messageTimer = 1.6;
    } else if (game.streak === 20) {
      game.message = 'TACO FRENZY READY!';
      game.messageTimer = 1.8;
    }
    if (item.type !== 'taco') {
      spawnConfetti(item.x + 12 - game.cameraX, item.y + 12, 10);
    }
    if (collectionEventId) {
      playAudio(collectionEventId, {
        streak: game.streak,
        position: audioPosition(item.x + item.w / 2),
      });
    }
  }

  function spawnTruckTaco(truckX, chaseDrop = false, trajectoryOffset = 0, dropStyle = 'standard') {
    const glitchDrop = dropStyle === 'glitch';
    const launchSpread = clamp(trajectoryOffset, -8, 52) * 0.18;
    game.truckDropPulse = tacoTrekkerRearLauncher.pulseDuration;
    game.truckLauncherWorldX = truckX;
    level.collectibles.push({
      x: truckX + tacoTrekkerRearLauncher.x + launchSpread,
      y: (chaseDrop ? 362 : glitchDrop ? 354 : 360) - Math.random() * (chaseDrop ? 18 : 24),
      w: 24,
      h: 24,
      type: 'taco',
      bob: 0,
      collected: false,
      isDrop: true,
      chaseDrop,
      glitchDrop,
      landed: false,
      vx: (glitchDrop ? -145 - Math.random() * 95 : -105 - Math.random() * (chaseDrop ? 95 : 75)) - trajectoryOffset * 0.72,
      vy: (glitchDrop ? -245 - Math.random() * 115 : (chaseDrop ? -145 : -220) - Math.random() * (chaseDrop ? 90 : 105)) - trajectoryOffset * 0.38,
      angle: 0,
    });
    game.totalCollectibles += 1;
  }

  function updateCheckpoints() {
    for (const checkpoint of level.checkpoints) {
      if (!checkpoint.activated && rectsIntersect(player, checkpoint)) {
        checkpoint.activated = true;
        game.latestCheckpoint = checkpoint;
        game.hearts = 3;
        game.score += 100;
        game.message = checkpoint.sign;
        game.messageTimer = 2.2;
        spawnConfetti(checkpoint.x - game.cameraX + checkpoint.w / 2, checkpoint.y + 30, 60);
        playAudio('checkpoint.activate', {
          position: audioPosition(checkpoint.x + checkpoint.w / 2),
        });
      }
    }
  }

  function updateEnemies(dt, previousPlayerY) {
    let stompResolvedThisFrame = false;
    const previousPlayerBottom = Number.isFinite(previousPlayerY)
      ? previousPlayerY + player.h
      : player.y + player.h;
    for (const enemy of level.enemies) {
      if (!enemy.alive) continue;

      if (enemy.defeated) {
        enemy.defeatTimer -= dt;
        if (enemy.defeatTimer <= 0) enemy.alive = false;
        continue;
      }

      const previousEnemyTop = Number.isFinite(enemy.previousY) ? enemy.previousY : enemy.y;
      enemy.anim += dt * heroPhysics.enemyVisualAnimationRate;
      const speedScale = heroCore.updateEnemyBehavior(enemy, dt, {
        onTear: (cryingEnemy) => {
          if (Math.abs(cryingEnemy.x - player.x) >= canvas.width) return;
          game.splatParticles.push({
            x: cryingEnemy.x + cryingEnemy.w * (cryingEnemy.dir > 0 ? 0.8 : 0.2),
            y: cryingEnemy.y + 15,
            vx: cryingEnemy.dir * 28 + (Math.random() - 0.5) * 22,
            vy: 35 + Math.random() * 45,
            g: 180,
            life: 0.65,
            size: 3.5,
            color: '#65d8ff',
            round: true,
          });
        },
      });
      enemy.previousY = enemy.y;

      enemy.vx = enemy.dir * enemy.baseSpeed * speedScale;
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
        enemy.dir *= -1;
        enemy.vx = enemy.dir * enemy.baseSpeed;
        enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX);
      }

      const contact = heroCore.classifyEnemyContact(player, enemy, {
        routeHelper: enemy.routeHelper,
        previousBottom: previousPlayerBottom,
        previousTargetTop: previousEnemyTop,
      });
      if (contact) {
        if (stompResolvedThisFrame) continue;
        if (contact === 'stomp') {
          stompResolvedThisFrame = true;
          defeatEnemy(enemy, true, { enemyTop: enemy.y + 6 });
        } else if (game.frenzyTimer > 0) {
          defeatEnemy(enemy, false);
        } else if (enemy.routeHelper) {
          // Bounce helpers are traversal aids, not invisible walls. Passing
          // beside or rising through one remains safe; only a landing from
          // above consumes it and launches the next bounce.
          continue;
        } else {
          hurtPlayer(enemy.x);
        }
      }
    }
  }

  function maybeWin() {
    if (game.state !== 'playing') return;
    if (rectsIntersect(player, level.goal)) {
      game.state = 'celebrating';
      game.chaseTruckActive = false;
      game.chaseTruckEscaping = false;
      game.chaseTruckDone = true;
      game.finishTime = performance.now();
      game.celebrationStartTime = performance.now();
      player.vx = 0;
      player.vy = 0;
      playCelebrationMusic();
      const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
      game.partyBonus = Math.round(game.collected * 5 + game.bestStreak * 20 + game.bestStompCombo * 100 + game.goldenCollected * 500 + completion * 1000);
      game.score += game.partyBonus;
      game.partyRank = completion >= 0.95 && game.goldenCollected === game.totalGolden ? 'LEGENDARY TACO FIESTA!'
        : completion >= 0.75 ? 'SUPER SALSA PARTY!' : 'FIESTA COMPLETE!';
      game.message = game.partyRank;
      game.messageTimer = 4;
      spawnConfetti(canvas.width * 0.5, 150, 190);
      spawnConfetti(120, 260, 70);
      spawnConfetti(canvas.width - 120, 260, 70);
      for (let i = 0; i < 10 + Math.floor(completion * 16) + game.goldenCollected * 4; i++) spawnFirework();
      for (let i = 0; i < 16; i++) spawnTacoRain();
      playAudio('goal.enter');
    }
  }

  function updatePlaying(dt) {
    player.anim += dt * (Math.abs(player.vx) > 10 ? 11 : 4);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? heroPhysics.coyoteTime : Math.max(0, player.coyote - dt);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    const frenzyWasActive = game.frenzyTimer > 0;
    const magnetWasActive = game.magnetTimer > 0;
    game.frenzyTimer = Math.max(0, game.frenzyTimer - dt);
    game.magnetTimer = Math.max(0, game.magnetTimer - dt);
    if (frenzyWasActive && game.frenzyTimer <= 0) playAudio('ability.frenzyEnd');
    if (magnetWasActive && game.magnetTimer <= 0) playAudio('ability.magnetEnd');
    game.stompTimer = Math.max(0, game.stompTimer - dt);
    game.airChainTimer = Math.max(0, game.airChainTimer - dt);
    game.truckDropPulse = Math.max(0, game.truckDropPulse - dt);
    game.radioTimer = Math.max(0, game.radioTimer - dt);
    game.cinematicTimer = Math.max(0, game.cinematicTimer - dt);
    if (game.stompTimer <= 0) game.stompCombo = 0;
    if (player.grounded && game.airChainTimer <= 0) game.airChain = 0;
    if (level.pinata) level.pinata.wobble = Math.max(0, level.pinata.wobble - dt);
    if (!game.muted) setMusicTrack(desiredMusicName());
    if (game.streakTimer > 0) {
      game.streakTimer -= dt;
      if (game.streakTimer <= 0) game.streak = 0;
    }

    if (player.grounded && player.platform) {
      player.x += player.platform.dx || 0;
      player.y += player.platform.dy || 0;
    }

    applyHorizontalInput(dt);
    doJump();

    const airborneBeforePhysics = !player.grounded;
    const prevY = player.y;
    player.previousY = prevY;
    player.previousBottom = prevY + player.h;
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const landingVelocity = player.vy;

    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }
    if (player.x + player.w > game.levelWidth) {
      player.x = game.levelWidth - player.w;
      player.vx = 0;
    }

    resolvePlatformCollision(prevY);

    if (airborneBeforePhysics && player.grounded && landingVelocity > 90) {
      playAudio(landingVelocity >= 830 ? 'hero.landHard' : 'hero.landSoft', {
        position: audioPosition(player.x + player.w / 2),
      });
      game.fallSoundPlayed = false;
    }

    if (player.y > canvas.height + 20 && !game.fallSoundPlayed) {
      game.fallSoundPlayed = true;
      playAudio('hero.fall', { position: audioPosition(player.x + player.w / 2) });
    }

    if (player.y > canvas.height + 140) {
      game.hearts -= 1;
      beginRespawn(game.hearts <= 0, player.x, canvas.height - player.h - 12);
      return;
    }

    for (const item of level.collectibles) {
      if (!item.collected && item.isDrop && !item.landed) {
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.vy += 760 * dt;
        item.angle += 5.5 * dt;
        if (item.y >= 412) {
          item.y = 412;
          item.vx = 0;
          item.vy = 0;
          item.landed = true;
        }
      }
      if (!item.collected && (game.frenzyTimer > 0 || game.magnetTimer > 0)) {
        const dx = (player.x + player.w / 2) - (item.x + item.w / 2);
        const dy = (player.y + player.h / 2) - (item.y + item.h / 2);
        const distance = Math.hypot(dx, dy);
        const radius = game.magnetTimer > 0 ? 285 : 150;
        const pull = game.magnetTimer > 0 ? 10.5 : 7;
        if (distance < radius) {
          item.x += dx * dt * pull;
          item.y += dy * dt * pull;
        }
      }
      if (!item.collected && rectsIntersect(player, item)) collectItem(item);
    }

    updateEnemies(dt, prevY);
    updateCheckpoints();

    if (player.x > zones.showdownMusicStart - 400) {
      triggerRadio('showdown');
      startCinematic('showdown', 'DOUBLE SALSA SHOWDOWN', zones.showdownReveal, 1.5);
    }
    if (player.x > zones.chaseRadio) {
      triggerRadio('chase');
      startCinematic('chase', 'TURBO TACO CHASE', Math.max(zones.chaseReveal, game.chaseTruckX || zones.chaseReveal), 1.35);
    }
    if (player.x > zones.finaleRadio) {
      triggerRadio('finale');
      startCinematic('finale', 'FIESTA FINISH', level.goal.x, 1.45);
    }

    if (player.x > zones.showdownAnnounceStart && player.x < zones.showdownAnnounceEnd && !game.showdownAnnounced) {
      game.showdownAnnounced = true;
      game.message = 'DOUBLE SALSA SHOWDOWN! STOMP, BOUNCE, REPEAT!';
      game.messageTimer = 2.5;
      spawnConfetti(canvas.width * 0.62, 190, 80);
      playAudio('world1.showdown');
    }

    const checkpointOnScreen = level.checkpoints.some((checkpoint) => Math.abs(checkpoint.x - player.x) < canvas.width * 0.64);
    if (player.x > zones.dropStart && player.x < zones.dropEnd && !game.midTruckDone && !checkpointOnScreen) {
      if (!game.dropTruckX && !game.midTruckEntering && !game.midTruckActive) {
        game.midTruckEntering = true;
        game.dropTruckX = game.cameraX - 330;
        game.midTruckEntrySpeed = 520;
        game.message = 'OLIVIA INCOMING! TACO DROP APPROACHING!';
        game.messageTimer = 2.1;
        playAudio('vehicle.arrive', { position: -0.8 });
      }
      if (game.midTruckEntering) {
        const entranceTarget = Math.min(zones.dropTruckLimit, player.x + 245);
        game.midTruckEntrySpeed = Math.min(1220, game.midTruckEntrySpeed + 920 * dt);
        game.dropTruckX = Math.min(entranceTarget, game.dropTruckX + game.midTruckEntrySpeed * dt);
        if (game.dropTruckX >= entranceTarget - 2) {
          game.dropTruckX = entranceTarget;
          game.midTruckEntering = false;
          game.midTruckActive = true;
          game.truckDropTimer = 0.08;
          game.message = 'DROP ZONE OPEN! TACOS OUT BACK!';
          game.messageTimer = 1.25;
          spawnConfetti(canvas.width * 0.72, 245, 35);
          playAudio('vehicle.ready', { position: audioPosition(game.dropTruckX) });
        }
      } else if (game.midTruckActive) {
        game.dropTruckX = Math.min(zones.dropTruckLimit, Math.max(game.dropTruckX, player.x + 245));
        game.truckDropTimer -= dt;
        if (game.truckDropTimer <= 0) {
          game.truckDropTimer = 0.25 + Math.random() * 0.08;
          spawnTruckTaco(game.dropTruckX);
        }
      }
    } else if ((player.x >= zones.dropEnd || checkpointOnScreen) && (game.midTruckActive || game.midTruckEntering)) {
      game.midTruckEntering = false;
      game.midTruckActive = false;
      game.midTruckEscaping = true;
      game.midTruckDone = true;
      game.midTruckEscapeSpeed = 430;
      game.message = 'RUNWAY CLEARED! OLIVIA: BYEEE!';
      game.messageTimer = 1.5;
      playAudio('vehicle.depart', { position: audioPosition(game.dropTruckX) });
    }

    if (game.midTruckEscaping) {
      game.midTruckEscapeSpeed = Math.min(1540, game.midTruckEscapeSpeed + 1750 * dt);
      game.dropTruckX += game.midTruckEscapeSpeed * dt;
      if (game.dropTruckX - game.cameraX > canvas.width + 280) game.midTruckEscaping = false;
    }

    // The duplicated runway becomes a different joke and rhythm: a delivery-app
    // glitch turns Olivia's "6-7 tacos" order into repeating three-taco bursts.
    if (player.x > zones.encoreDropStart && player.x < zones.encoreDropEnd && !game.encoreTruckDone && !checkpointOnScreen) {
      if (!game.encoreTruckX && !game.encoreTruckEntering && !game.encoreTruckActive) {
        game.encoreTruckEntering = true;
        game.encoreTruckX = game.cameraX - 330;
        game.encoreTruckEntrySpeed = 560;
        game.message = 'OLIVIA INCOMING! DELIVERY APP IS GLITCHING!';
        game.messageTimer = 2.2;
        playAudio('vehicle.arrive', { position: -0.8, pitchCents: 70 });
      }
      if (game.encoreTruckEntering) {
        const entranceTarget = Math.min(zones.encoreDropTruckLimit, player.x + 250);
        game.encoreTruckEntrySpeed = Math.min(1280, game.encoreTruckEntrySpeed + 980 * dt);
        game.encoreTruckX = Math.min(entranceTarget, game.encoreTruckX + game.encoreTruckEntrySpeed * dt);
        if (game.encoreTruckX >= entranceTarget - 2) {
          game.encoreTruckX = entranceTarget;
          game.encoreTruckEntering = false;
          game.encoreTruckActive = true;
          game.encoreDropTimer = 0.12;
          game.message = 'DELIVERY GLITCH! OLIVIA ORDERED 6–7. THE APP SENT 67!';
          game.messageTimer = 2.5;
          spawnConfetti(canvas.width * 0.72, 235, 48);
          playAudio('vehicle.ready', { position: audioPosition(game.encoreTruckX), pitchCents: 90 });
        }
      } else if (game.encoreTruckActive) {
        const glitchLead = player.x + 250 + Math.sin(game.levelTime * 4.5) * 24;
        game.encoreTruckX = Math.min(zones.encoreDropTruckLimit, Math.max(game.encoreTruckX, glitchLead));
        game.encoreDropTimer -= dt;
        if (game.encoreDropTimer <= 0) {
          game.encoreDropTimer = 0.46 + Math.random() * 0.08;
          game.encoreDropBurst += 1;
          spawnTruckTaco(game.encoreTruckX, false, -8, 'glitch');
          spawnTruckTaco(game.encoreTruckX, false, 22, 'glitch');
          spawnTruckTaco(game.encoreTruckX, false, 52, 'glitch');
          if (game.encoreDropBurst % 3 === 0) {
            spawnImpactText(game.encoreTruckX + 55, 305, '×3 GLITCH!', '#b78cff', 24);
            playAudio('vehicle.drop', { position: audioPosition(game.encoreTruckX), pitchCents: 80 });
          }
        }
      }
    } else if ((player.x >= zones.encoreDropEnd || checkpointOnScreen) && (game.encoreTruckActive || game.encoreTruckEntering)) {
      game.encoreTruckEntering = false;
      game.encoreTruckActive = false;
      game.encoreTruckEscaping = true;
      game.encoreTruckDone = true;
      game.encoreTruckEscapeSpeed = 470;
      game.message = 'GLITCH PATCHED. PROBABLY. OLIVIA: BYEEE!';
      game.messageTimer = 1.8;
      spawnConfetti(canvas.width * 0.65, 245, 42);
      playAudio('vehicle.depart', { position: audioPosition(game.encoreTruckX), pitchCents: 70 });
    }

    if (game.encoreTruckEscaping) {
      game.encoreTruckEscapeSpeed = Math.min(1620, game.encoreTruckEscapeSpeed + 1850 * dt);
      game.encoreTruckX += game.encoreTruckEscapeSpeed * dt;
      if (game.encoreTruckX - game.cameraX > canvas.width + 280) game.encoreTruckEscaping = false;
    }

    // Extended turbo chase: Olivia keeps a playful lead and throws dense taco bursts.
    if (player.x > zones.chaseStart && player.x < zones.chaseEnd && !game.chaseTruckDone && !game.chaseTruckEscaping && !checkpointOnScreen) {
      if (!game.chaseTruckActive) {
        game.chaseTruckActive = true;
        game.chaseTruckX = player.x + 300;
        game.chaseDropTimer = 0.1;
        game.message = 'CHASE OLIVIA! CATCH THE TACO RAIN!';
        game.messageTimer = 2.4;
        spawnConfetti(canvas.width * 0.72, 210, 60);
      }
      const chaseTarget = Math.min(zones.chaseTruckLimit, player.x + 255 + Math.sin(game.levelTime * 3.2) * 42);
      game.chaseTruckX = lerp(game.chaseTruckX, chaseTarget, Math.min(1, dt * 4.2));
      game.chaseDropTimer -= dt;
      if (game.chaseDropTimer <= 0) {
        game.chaseDropTimer = 0.15 + Math.random() * 0.09;
        spawnTruckTaco(game.chaseTruckX, true);
        if (Math.random() < 0.44) spawnTruckTaco(game.chaseTruckX, true, 24);
        playAudio('vehicle.drop', { position: audioPosition(game.chaseTruckX) });
      }
    } else if (player.x >= zones.chaseEnd && game.chaseTruckActive) {
      game.chaseTruckActive = false;
      game.chaseTruckEscaping = true;
      game.chaseEscapeSpeed = 900;
      game.chaseEscapeTimer = 0;
      game.message = 'OLIVIA HITS THE TURBO!';
      game.messageTimer = 1.5;
      spawnConfetti(game.chaseTruckX - game.cameraX + 70, 390, 75);
      playAudio('vehicle.depart', { position: audioPosition(game.chaseTruckX), pitchCents: 90 });
    }

    if (game.chaseTruckEscaping) {
      game.chaseEscapeTimer += dt;
      game.chaseEscapeSpeed += 1800 * dt;
      game.chaseTruckX += game.chaseEscapeSpeed * dt;
      if (game.chaseTruckX - player.x > 1080 || game.chaseEscapeTimer > 1) {
        game.chaseTruckEscaping = false;
        game.chaseTruckDone = true;
        game.finalRushStarted = true;
        game.score += game.chaseCatchCount * 20;
        game.message = `TACO CHASE COMPLETE! ${game.chaseCatchCount} AIR CATCHES!`;
        game.messageTimer = 2.2;
        spawnConfetti(canvas.width * 0.65, 220, 110);
        playAudio('vehicle.chaseComplete');
      }
    }

    if (player.x > zones.finalRush && game.chaseTruckDone && !game.finalRushStarted) {
      game.finalRushStarted = true;
      game.message = 'FINAL TACO RUSH!';
      game.messageTimer = 2;
      spawnConfetti(canvas.width * 0.65, 150, 40);
    }

    const finishDistance = level.goal.x - player.x;
    if (finishDistance > 0 && finishDistance < 1600) {
      const finishEnergy = clamp(1 - finishDistance / 1600, 0, 1);
      game.finishSparkTimer -= dt;
      if (game.finishSparkTimer <= 0) {
        game.finishSparkTimer = 0.42 - finishEnergy * 0.32;
        spawnConfetti(level.goal.x - game.cameraX + 48, 330 - finishEnergy * 115, 3 + Math.floor(finishEnergy * 7));
      }
      const nextStage = finishDistance < 280 ? 3 : finishDistance < 720 ? 2 : 1;
      if (nextStage > game.finishHypeStage) {
        game.finishHypeStage = nextStage;
        if (nextStage === 1) {
          game.message = 'FIESTA GATE IN SIGHT!';
          game.messageTimer = 1.5;
        } else if (nextStage === 2 && !game.chaseTruckActive && !game.chaseTruckEscaping) {
          game.message = 'THE FINISH IS LIGHTING UP!';
          game.messageTimer = 1.4;
        } else if (nextStage === 3) {
          game.message = 'SEND IT THROUGH THE FIESTA GATE!';
          game.messageTimer = 1.6;
          playAudio('goal.warning');
        }
      }
    }
    maybeWin();
    const followOffset = (game.chaseTruckActive || game.chaseTruckEscaping) ? 0.32 : 0.42;
    const followCamera = clamp(player.x - canvas.width * followOffset, 0, game.levelWidth - canvas.width);
    if (game.cinematicTimer > 0) {
      const cinematicCamera = clamp(game.cinematicTargetX - canvas.width * 0.64, 0, game.levelWidth - canvas.width);
      game.cameraX = lerp(game.cameraX, cinematicCamera, Math.min(1, dt * 3.4));
    } else {
      game.cameraX = lerp(game.cameraX, followCamera, Math.min(1, dt * 10));
    }
  }

  function updateCelebration(dt) {
    game.celebrationTicker += dt;
    const celebrationElapsed = (performance.now() - game.celebrationStartTime) / 1000;
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    player.anim += dt * 7;
    player.x = lerp(player.x, level.goal.x + 38, dt * 2.2);
    game.cameraX = clamp(level.goal.x - canvas.width * 0.52, 0, game.levelWidth - canvas.width);

    const beat = Math.floor(celebrationElapsed * 2.15);
    if (beat !== game.partyBeat) {
      game.partyBeat = beat;
      playAudio('level.celebrationPulse', {
        pitchCents: (beat % 4) * 18,
        position: beat % 2 ? -0.35 : 0.35,
      });
      spawnConfetti(beat % 2 ? 110 : canvas.width - 110, 245, 22);
      spawnFirework();
      spawnFirework();
      for (let i = 0; i < 3; i++) spawnTacoRain();
    }
    if (Math.random() < dt * 3.5) spawnTacoRain();
    if (Math.random() < dt * 1.2) spawnFirework();
    if (celebrationElapsed > 7.2) {
      game.state = 'won';
      playAudio('level.complete');
      const seconds = Math.round((game.finishTime - game.startTime) / 1000);
      const crown = game.collected === game.totalCollectibles ? ' 👑 PERFECT TACO RUN!' : '';
      const gold = game.goldenCollected === game.totalGolden ? ` All ${game.totalGolden} Golden Tacos found!` : ` Golden Tacos: ${game.goldenCollected}/${game.totalGolden}.`;
      winText.textContent = `${game.partyRank} You grabbed ${game.collected}/${game.totalCollectibles} goodies, found ${game.rainbowCollected}/${game.totalRainbow} secret Rainbow Tacos, chained ${game.bestStompCombo} enemy splats, caught ${game.chaseCatchCount} chase tacos, earned a ${game.partyBonus}-point Fiesta Bonus, and scored ${game.score} points in ${seconds} seconds.${gold}${crown}`;
      presentRunResults(seconds);
      showWin();
    }
  }

  function updateParticles(dt) {
    game.cameraShake = Math.max(0, game.cameraShake - dt * 62);
    game.confetti = game.confetti.filter((p) => {
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      return p.life > 0 && p.y < canvas.height + 80;
    });

    game.fireworks = game.fireworks.filter((p) => {
      p.life -= dt;
      p.vy += 160 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return p.life > 0;
    });

    game.tacoRain = game.tacoRain.filter((p) => {
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      return p.y < canvas.height + 30;
    });

    if (game.pinataBurst) {
      game.pinataBurst.life -= dt;
      if (game.pinataBurst.life <= 0) game.pinataBurst = null;
    }

    game.splatParticles = game.splatParticles.filter((p) => {
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return p.life > 0 && p.y < canvas.height + 90;
    });

    game.impactTexts = game.impactTexts.filter((p) => {
      p.life -= dt;
      p.y += p.vy * dt;
      p.vy *= 0.94;
      return p.life > 0;
    });
  }

  function update(dt) {
    updateMusicMix(dt);
    if (game.settingsOpen) {
      updateParticles(dt * 0.12);
      return;
    }
    if (game.hitStop > 0) {
      game.hitStop = Math.max(0, game.hitStop - dt);
      updateParticles(dt * 0.22);
      return;
    }
    if (game.state === 'playing' || game.state === 'respawning') updateMovingPlatforms(dt);
    if (game.state === 'playing') updatePlaying(dt);
    if (game.state === 'respawning') updateRespawning(dt);
    if (game.state === 'celebrating') updateCelebration(dt);
    updateParticles(dt);
  }

  function drawBackground() {
    world1Background.draw({
      cameraX: game.cameraX,
      playerX: player.x,
      time: game.levelTime,
      reducedMotion: game.reducedShake,
    });
  }

  function drawPaintedTerrainSlice(imageAsset, screenX, y, width, height, sourceCap) {
    const sourceWidth = imageAsset.naturalWidth || imageAsset.width;
    const sourceHeight = imageAsset.naturalHeight || imageAsset.height;
    const scale = height / sourceHeight;
    const naturalCap = sourceCap * scale;
    const destinationCap = Math.min(naturalCap, width * 0.32);
    const centerSourceWidth = sourceWidth - sourceCap * 2;
    const centerDestinationWidth = Math.max(0, width - destinationCap * 2);

    ctx.drawImage(
      imageAsset,
      0, 0, sourceCap, sourceHeight,
      screenX, y, destinationCap, height,
    );

    if (centerDestinationWidth > 0.5) {
      ctx.drawImage(
        imageAsset,
        sourceCap, 0, centerSourceWidth, sourceHeight,
        screenX + destinationCap, y, centerDestinationWidth + 0.5, height,
      );
    }

    ctx.drawImage(
      imageAsset,
      sourceWidth - sourceCap, 0, sourceCap, sourceHeight,
      screenX + width - destinationCap, y, destinationCap, height,
    );
  }

  function drawPaintedTerrain(platform, screenX) {
    const isGround = platform.h > 30;
    const asset = isGround
      ? images.world1_1_terrain_ground_v1
      : images.world1_1_terrain_platform_v1;
    const artHeight = isGround ? Math.max(92, platform.h + 14) : Math.max(42, platform.h + 16);
    const artY = platform.y - (isGround ? 3 : 4);
    const sourceCap = isGround ? 124 : 146;
    const smoothing = ctx.imageSmoothingEnabled;

    ctx.save();
    ctx.beginPath();
    ctx.rect(screenX - 1, artY - 2, platform.w + 2, artHeight + 4);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    drawPaintedTerrainSlice(asset, screenX, artY, platform.w, artHeight, sourceCap);
    ctx.imageSmoothingEnabled = smoothing;
    ctx.restore();
  }

  function drawGround() {
    for (const p of level.platforms) {
      const screenX = Math.floor(p.x - game.cameraX);
      if (screenX + p.w < -50 || screenX > canvas.width + 50) continue;
      if (p.moving) {
        const pulse = (Math.sin(game.levelTime * 5 + p.phase) + 1) * 0.5;
        ctx.save();
        const glow = p.style === 'tray' ? '#d9f6ff'
          : p.style === 'salsa-lift' ? '#ff5f62'
            : p.style === 'tortilla' ? '#ffd166'
              : p.axis === 'x' ? '#65d8ff' : '#ff6fae';
        ctx.shadowColor = glow;
        ctx.shadowBlur = 12 + pulse * 9;
        if (p.style === 'tray') {
          ctx.fillStyle = '#42566e';
          ctx.beginPath(); ctx.roundRect(screenX, p.y + 4, p.w, p.h - 4, 10); ctx.fill();
          ctx.fillStyle = '#d9f6ff'; ctx.fillRect(screenX + 12, p.y + 5, p.w - 24, 5);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(screenX + 10, p.y + 16, 8, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
          ctx.beginPath(); ctx.arc(screenX + p.w - 10, p.y + 16, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        } else if (p.style === 'salsa-lift') {
          ctx.fillStyle = '#a92f49'; ctx.fillRect(screenX, p.y, p.w, p.h);
          ctx.fillStyle = '#ff6b6b'; ctx.fillRect(screenX, p.y, p.w, 8);
          ctx.fillStyle = '#ffd166';
          for (let stripe = 12; stripe < p.w - 10; stripe += 30) {
            ctx.beginPath(); ctx.arc(screenX + stripe, p.y + 18, 5, 0, Math.PI * 2); ctx.fill();
          }
        } else if (p.style === 'tortilla') {
          ctx.fillStyle = '#e8a94d';
          ctx.beginPath(); ctx.roundRect(screenX, p.y, p.w, p.h, 14); ctx.fill();
          ctx.fillStyle = '#ffd982';
          for (let dot = 16; dot < p.w - 8; dot += 30) {
            ctx.beginPath(); ctx.arc(screenX + dot, p.y + 10 + (dot % 3) * 3, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.fillStyle = '#2f2548';
          ctx.fillRect(screenX, p.y, p.w, p.h);
          ctx.fillStyle = p.style === 'paired' ? '#63d878' : p.axis === 'x' ? '#65d8ff' : '#ff6fae';
          ctx.fillRect(screenX, p.y, p.w, 7);
          ctx.fillStyle = '#ffd166';
          for (let stripe = 10; stripe < p.w - 10; stripe += 28) ctx.fillRect(screenX + stripe, p.y + 13, 14, 5);
        }
        ctx.fillStyle = '#fff7e8';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.axis === 'x' ? '↔' : '↕', screenX + p.w / 2, p.y + 23);
        ctx.restore();
        continue;
      }

      const detailStart = Math.max(0, Math.floor((-screenX - 30) / 16) * 16);
      const detailEnd = Math.min(p.w, canvas.width - screenX + 30);
      drawPaintedTerrain(p, screenX);
      if (p.dropRunway) {
        ctx.save();
        ctx.fillStyle = 'rgba(101,216,255,.20)';
        ctx.fillRect(screenX, p.y + 11, p.w, 7);
        ctx.fillStyle = 'rgba(255,111,174,.58)';
        for (let offset = detailStart; offset < detailEnd; offset += 72) {
          ctx.fillRect(screenX + offset, p.y + 11, 36, 7);
        }
        ctx.fillStyle = 'rgba(255,241,166,.82)';
        for (let offset = detailStart + 30; offset < detailEnd; offset += 180) {
          const arrowX = screenX + offset;
          ctx.beginPath();
          ctx.moveTo(arrowX + 40, p.y + 31);
          ctx.lineTo(arrowX + 18, p.y + 23);
          ctx.lineTo(arrowX + 18, p.y + 29);
          ctx.lineTo(arrowX, p.y + 29);
          ctx.lineTo(arrowX, p.y + 35);
          ctx.lineTo(arrowX + 18, p.y + 35);
          ctx.lineTo(arrowX + 18, p.y + 41);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      if (p.secret) {
        const secretColors = ['#ff5f91', '#ff9d4d', '#ffd166', '#63d878', '#65d8ff', '#b78cff'];
        const stripe = p.w / secretColors.length;
        ctx.save();
        ctx.shadowColor = '#fff1a6';
        ctx.shadowBlur = 12;
        secretColors.forEach((color, index) => {
          ctx.fillStyle = color;
          ctx.fillRect(screenX + index * stripe, p.y, stripe + 1, 7);
        });
        ctx.restore();
      }
    }
  }

  function drawCollectibles(time) {
    const items = images.items_sheet;
    for (const item of level.collectibles) {
      if (item.collected) continue;
      const bounce = Math.sin(time * 0.005 + item.bob * 6) * 5;
      const info = itemTypes[item.type];
      const size = item.type === 'golden' || item.type === 'rainbow' ? 34 : item.type === 'magnet' ? 30 : 24;
      const x = Math.floor(item.x - game.cameraX);
      const y = Math.floor(item.y + bounce);
      if (item.type === 'magnet') {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        if (item.isDrop && !item.landed) ctx.rotate(item.angle || 0);
        ctx.shadowColor = '#65d8ff';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#fff1a6';
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(0, -1, 10, 0, Math.PI); ctx.stroke();
        ctx.strokeStyle = '#ff5f91';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-10, -1); ctx.lineTo(-10, 10); ctx.moveTo(10, -1); ctx.lineTo(10, 10); ctx.stroke();
        ctx.fillStyle = '#65d8ff';
        ctx.fillRect(-14, 7, 8, 6); ctx.fillRect(6, 7, 8, 6);
        ctx.restore();
        continue;
      }
      if (item.type === 'rainbow') {
        const colors = ['#ff5f91', '#ff9d4d', '#ffd166', '#63d878', '#65d8ff', '#b78cff'];
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(Math.sin(time * 0.003 + item.bob * 4) * 0.12);
        ctx.shadowColor = colors[Math.floor(time * 0.01) % colors.length];
        ctx.shadowBlur = 22;
        for (let ring = colors.length - 1; ring >= 0; ring--) {
          ctx.strokeStyle = colors[ring];
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, 18 + ring * 1.4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.drawImage(items, 0, 0, 16, 16, -17, -17, 34, 34);
        ctx.restore();
        continue;
      }
      if (item.isDrop && !item.landed) {
        const flightSize = item.glitchDrop ? 39 : item.chaseDrop ? 29 : 36;
        const premiumTaco = images.world1_1_taco_drop_payload_v1;
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.globalAlpha = item.chaseDrop ? 0.46 : 0.72;
        ctx.fillStyle = item.glitchDrop ? '#b78cff' : item.chaseDrop ? '#ff6fae' : '#65d8ff';
        for (let trail = 1; trail <= 3; trail++) {
          ctx.beginPath();
          ctx.arc(trail * 11, trail * 3, 7 - trail * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = item.glitchDrop ? '#65d8ff' : '#fff1a6';
        ctx.lineWidth = item.chaseDrop ? 3 : 5;
        ctx.beginPath();
        ctx.arc(0, 0, flightSize * 0.62 + Math.sin(time * 0.018 + item.angle) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.rotate(item.angle || 0);
        ctx.shadowColor = item.glitchDrop ? '#b78cff' : item.chaseDrop ? '#ff6fae' : '#65d8ff';
        ctx.shadowBlur = item.chaseDrop ? 15 : item.glitchDrop ? 28 : 24;
        ctx.drawImage(premiumTaco, -flightSize * 0.62, -flightSize * 0.4, flightSize * 1.24, flightSize * 0.8);
        ctx.restore();
        continue;
      }
      if (item.isDrop) {
        const premiumTaco = images.world1_1_taco_drop_payload_v1;
        ctx.drawImage(premiumTaco, x - 3, y + 2, 30, 19);
        continue;
      }
      if (item.type === 'golden') {
        ctx.save();
        ctx.shadowColor = '#fff08a';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffd83d';
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.drawImage(items, 0, 0, 16, 16, x, y, size, size);
        ctx.restore();
      } else {
        ctx.drawImage(items, info.frame * 16, 0, 16, 16, x, y, size, size);
      }
    }
  }

  function drawEnemyEyes(x, y, lookX = 0, squint = false) {
    ctx.fillStyle = '#fff8df';
    ctx.strokeStyle = '#321a17';
    ctx.lineWidth = 2.2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * 5, y, 4.6, squint ? 2.6 : 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#321a17';
      ctx.beginPath();
      ctx.arc(x + side * 5 + lookX, y + (squint ? 0 : 1), 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff8df';
    }
  }

  function drawEnemySneaker(x, y, flip = 1, color = '#ff4f6d') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#321a17';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.quadraticCurveTo(2, -7, 6, -2);
    ctx.lineTo(8, 1);
    ctx.quadraticCurveTo(1, 4, -7, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff8df';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.restore();
  }

  function drawEnemyGlove(x, y, wave = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wave);
    ctx.fillStyle = '#fff8df';
    ctx.strokeStyle = '#321a17';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, -3); ctx.lineTo(-3, -7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, -3); ctx.lineTo(1, -8); ctx.stroke();
    ctx.restore();
  }

  function drawChiliBandit(pulse, step) {
    drawEnemySneaker(-8, -1 + step, -1);
    drawEnemySneaker(8, -1 - step, 1);
    ctx.strokeStyle = '#321a17';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ff4b45';
    ctx.beginPath();
    ctx.moveTo(-15, -31);
    ctx.bezierCurveTo(-6, -43, 12, -40, 15, -26);
    ctx.bezierCurveTo(17, -14, 9, -8, 3, -10);
    ctx.bezierCurveTo(10, -5, 12, -1, 8, 0);
    ctx.bezierCurveTo(-1, -3, -5, -10, -5, -16);
    ctx.bezierCurveTo(-13, -16, -20, -23, -15, -31);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff8a55';
    ctx.beginPath(); ctx.ellipse(-6, -31, 4, 7, -0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#60d069';
    ctx.strokeStyle = '#321a17';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, -38); ctx.quadraticCurveTo(-6, -47, 1, -41); ctx.quadraticCurveTo(7, -45, 9, -38); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8d5cff';
    ctx.beginPath(); ctx.roundRect(-15, -31, 28, 9, 4); ctx.fill(); ctx.stroke();
    drawEnemyEyes(-1, -26, pulse > 0 ? 1 : -1, true);
    ctx.strokeStyle = '#321a17'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-1, -17, 6, 0.1, Math.PI - 0.1); ctx.stroke();
    drawEnemyGlove(-18, -19, -0.3 - pulse * 0.15);
    drawEnemyGlove(17, -17, 0.35 + pulse * 0.15);
  }

  function drawTomatoTrouble(pulse, step) {
    drawEnemySneaker(-9, -1 + step, -1, '#65d8ff');
    drawEnemySneaker(9, -1 - step, 1, '#65d8ff');
    ctx.fillStyle = '#f34f48';
    ctx.strokeStyle = '#321a17';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -22, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff8d66';
    ctx.beginPath(); ctx.ellipse(-6, -29, 4, 6, -0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#57c95b';
    ctx.strokeStyle = '#321a17'; ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(0, -36); ctx.lineTo(4, -31); ctx.lineTo(11, -34); ctx.lineTo(8, -28);
    ctx.lineTo(14, -25); ctx.lineTo(4, -25); ctx.lineTo(0, -20); ctx.lineTo(-3, -27);
    ctx.lineTo(-13, -26); ctx.lineTo(-7, -32); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Cyan star shades give Tomato Trouble the same big personality as the hero.
    ctx.fillStyle = '#65d8ff';
    ctx.strokeStyle = '#321a17'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-13, -27, 11, 8, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(2, -27, 11, 8, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -24); ctx.lineTo(2, -24); ctx.stroke();
    ctx.fillStyle = '#fff8df';
    ctx.beginPath(); ctx.arc(-9, -24, 1.5, 0, Math.PI * 2); ctx.arc(6, -24, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#321a17';
    ctx.beginPath(); ctx.arc(0, -15, 5.5, 0.1, Math.PI - 0.1); ctx.fill();
    ctx.fillStyle = '#fff8df'; ctx.fillRect(-3, -14, 6, 2);
    drawEnemyGlove(-18, -22, -0.5 + pulse * 0.2);
    drawEnemyGlove(18, -20, 0.5 - pulse * 0.2);
  }

  function drawOnionDrama(pulse, step) {
    // A tiny cape makes the melodramatic onion feel like a lovable cartoon rival.
    ctx.fillStyle = '#ff67ad';
    ctx.strokeStyle = '#321a17'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-13, -28); ctx.lineTo(-23, -8); ctx.lineTo(-5, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    drawEnemySneaker(-8, -1 + step, -1, '#ffd166');
    drawEnemySneaker(8, -1 - step, 1, '#ffd166');
    ctx.fillStyle = '#dba8ee';
    ctx.strokeStyle = '#321a17'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.bezierCurveTo(-4, -35, -16, -33, -16, -20);
    ctx.bezierCurveTo(-16, -8, 16, -8, 16, -20);
    ctx.bezierCurveTo(16, -33, 4, -35, 0, -42);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2d8ff';
    ctx.beginPath(); ctx.ellipse(-6, -27, 4, 8, -0.6, 0, Math.PI * 2); ctx.fill();
    drawEnemyEyes(0, -25, pulse > 0 ? -1 : 1);
    ctx.strokeStyle = '#321a17'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -14, 5, Math.PI + 0.2, Math.PI * 2 - 0.2); ctx.stroke();
    ctx.fillStyle = '#65d8ff';
    ctx.beginPath(); ctx.moveTo(11, -20); ctx.quadraticCurveTo(18, -12, 11, -7); ctx.quadraticCurveTo(4, -12, 11, -20); ctx.fill();
    drawEnemyGlove(-19, -22, -0.35 - pulse * 0.2);
    drawEnemyGlove(19, -18, 0.55 + pulse * 0.2);
  }

  function drawJalapenoPopper(pulse, step) {
    drawEnemySneaker(-8, -1 + step, -1, '#ff5f91');
    drawEnemySneaker(8, -1 - step, 1, '#ff5f91');
    ctx.save();
    ctx.rotate(-0.25);
    ctx.fillStyle = '#54c85a';
    ctx.strokeStyle = '#321a17'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -22, 13, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#95ed75';
    ctx.beginPath(); ctx.ellipse(-5, -29, 3.5, 7, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.roundRect(-14, -31, 28, 6, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5f91';
    ctx.beginPath(); ctx.moveTo(12, -29); ctx.lineTo(22, -34); ctx.lineTo(17, -25); ctx.closePath(); ctx.fill(); ctx.stroke();
    drawEnemyEyes(0, -23, pulse > 0 ? 1 : -1, true);
    ctx.fillStyle = '#321a17';
    ctx.beginPath(); ctx.arc(0, -15, 5, 0, Math.PI); ctx.fill();
    ctx.restore();
    drawEnemyGlove(-18, -20, -0.7 + pulse * 0.25);
    drawEnemyGlove(17, -23, 0.75 - pulse * 0.25);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(-23, -13); ctx.lineTo(-18, -11); ctx.lineTo(-22, -7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(22, -15); ctx.lineTo(17, -12); ctx.lineTo(22, -9); ctx.closePath(); ctx.fill();
  }

  function tracePinataBody() {
    ctx.beginPath();
    ctx.moveTo(-27, -15);
    ctx.bezierCurveTo(-31, -7, -30, 12, -21, 17);
    ctx.bezierCurveTo(-10, 22, 9, 21, 20, 15);
    ctx.bezierCurveTo(27, 7, 25, -9, 15, -17);
    ctx.bezierCurveTo(5, -22, -18, -21, -27, -15);
    ctx.closePath();
  }

  function drawPinataFringeBand(y, halfWidth, color, phase = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-halfWidth, y);
    ctx.lineTo(halfWidth, y);
    ctx.lineTo(halfWidth, y + 7);
    for (let fringeX = halfWidth; fringeX >= -halfWidth; fringeX -= 6) {
      const tooth = (Math.floor((fringeX + phase) / 6) & 1) === 0 ? 2.5 : 0;
      ctx.lineTo(fringeX - 3, y + 9 + tooth);
      ctx.lineTo(fringeX - 6, y + 7);
    }
    ctx.closePath();
    ctx.fill();
  }

  function tracePinataStar(x, y, outerRadius, innerRadius, rotation = -Math.PI / 2) {
    ctx.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? outerRadius : innerRadius;
      const angle = rotation + point * Math.PI / 5;
      const pointX = x + Math.cos(angle) * radius;
      const pointY = y + Math.sin(angle) * radius;
      if (point === 0) ctx.moveTo(pointX, pointY);
      else ctx.lineTo(pointX, pointY);
    }
    ctx.closePath();
  }

  function drawPinata(time) {
    const pinata = level.pinata;
    if (!pinata) return;
    const x = pinata.x - game.cameraX;
    if (x < -100 || x > canvas.width + 100) return;
    const centerX = x + pinata.w / 2;
    const centerY = pinata.y + pinata.h / 2;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(47, 24, 48, .72)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(centerX, -3); ctx.lineTo(centerX, pinata.y + 4); ctx.stroke();
    ctx.strokeStyle = '#f7d98b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(centerX - 0.7, -3); ctx.lineTo(centerX - 0.7, pinata.y + 4); ctx.stroke();

    if (pinata.broken) {
      const sway = Math.sin(time * 0.004) * 0.12;
      ctx.translate(centerX, pinata.y + 9);
      ctx.rotate(sway);
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 9;
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#4a213f';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      const fragments = [
        { x: -14, y: 9, rotation: -0.42, color: '#ff5f91' },
        { x: 13, y: 12, rotation: 0.5, color: '#65d8ff' },
      ];
      for (const fragment of fragments) {
        ctx.save();
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(fragment.rotation - sway * 0.5);
        ctx.fillStyle = fragment.color;
        ctx.strokeStyle = '#4a213f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -3); ctx.lineTo(8, -2); ctx.lineTo(5, 10); ctx.lineTo(0, 7); ctx.lineTo(-5, 11); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      const scrapColors = ['#ffd166', '#63d878', '#b78cff', '#ff6fae'];
      for (let scrap = 0; scrap < 6; scrap += 1) {
        const drift = time * 0.0015 + scrap * 1.7;
        ctx.save();
        ctx.globalAlpha = 0.4 + (scrap % 3) * 0.16;
        ctx.translate(Math.sin(drift) * (15 + scrap * 3), 18 + (scrap % 3) * 8 + Math.cos(drift * 1.3) * 4);
        ctx.rotate(drift * 2);
        ctx.fillStyle = scrapColors[scrap % scrapColors.length];
        ctx.fillRect(-3, -1.5, 6, 3);
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    const damage = clamp(pinata.hits / pinata.targetHits, 0, 1);
    const wobble = pinata.wobble > 0 ? Math.sin(time * 0.07) * pinata.wobble : Math.sin(time * 0.004) * 0.035;
    const bob = Math.sin(time * 0.0032) * 1.2;
    ctx.translate(centerX, centerY + bob);
    ctx.rotate(wobble);
    ctx.lineJoin = 'round';
    ctx.shadowColor = damage > 0.4 ? '#ffd166' : '#ff67ad';
    ctx.shadowBlur = 15;

    // Tail and tissue tassel sit behind the body for a clean, readable burro silhouette.
    ctx.strokeStyle = '#4a213f';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-24, -6); ctx.quadraticCurveTo(-34, -14, -35, -22); ctx.stroke();
    ctx.strokeStyle = '#65d8ff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-24, -6); ctx.quadraticCurveTo(-34, -14, -35, -22); ctx.stroke();
    ['#ff5f91', '#ffd166', '#63d878'].forEach((color, index) => {
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-35, -22); ctx.lineTo(-41 + index * 4, -29 - (index % 2) * 3); ctx.stroke();
    });

    // Three visible legs keep the silhouette lively without becoming noisy at gameplay scale.
    [-17, -2, 14].forEach((legX, index) => {
      const legGradient = ctx.createLinearGradient(legX, 9, legX, 30);
      legGradient.addColorStop(0, ['#ff5f91', '#65d8ff', '#ffd166'][index]);
      legGradient.addColorStop(1, ['#b92d70', '#258fb6', '#d77b35'][index]);
      ctx.fillStyle = legGradient;
      ctx.strokeStyle = '#4a213f';
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.roundRect(legX - 4.5, 8, 9, 22, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3b203c';
      ctx.beginPath(); ctx.roundRect(legX - 5.5, 25, 11, 6, 3); ctx.fill();
    });

    const bodyGradient = ctx.createLinearGradient(-24, -20, 24, 20);
    bodyGradient.addColorStop(0, '#52e5ed');
    bodyGradient.addColorStop(0.48, '#2bb6d6');
    bodyGradient.addColorStop(1, '#7353c8');
    tracePinataBody();
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    ctx.strokeStyle = '#4a213f';
    ctx.lineWidth = 3.4;
    ctx.stroke();

    ctx.save();
    tracePinataBody();
    ctx.clip();
    drawPinataFringeBand(-15, 30, '#ff5f91', 0);
    drawPinataFringeBand(-5, 30, '#ffd166', 3);
    drawPinataFringeBand(5, 29, '#63d878', 0);
    drawPinataFringeBand(15, 24, '#b78cff', 3);
    const shade = ctx.createLinearGradient(0, -23, 0, 23);
    shade.addColorStop(0, 'rgba(255,255,255,.28)');
    shade.addColorStop(0.45, 'rgba(255,255,255,0)');
    shade.addColorStop(1, 'rgba(39,15,53,.3)');
    ctx.fillStyle = shade;
    ctx.fillRect(-32, -24, 64, 50);
    ctx.restore();
    tracePinataBody();
    ctx.strokeStyle = '#4a213f';
    ctx.lineWidth = 3.4;
    ctx.stroke();

    // Head, ears, and expression give the piñata personality while keeping its body readable.
    ctx.fillStyle = '#ff6fae';
    ctx.strokeStyle = '#4a213f';
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(12, -18); ctx.lineTo(13, -32); ctx.lineTo(21, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -17); ctx.lineTo(29, -29); ctx.lineTo(29, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.ellipse(21, -8, 15, 14, -0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9d6c';
    ctx.beginPath(); ctx.ellipse(31, -2, 10, 7.5, 0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff8df';
    ctx.beginPath(); ctx.arc(23, -11, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a1737';
    ctx.beginPath(); ctx.arc(24, -10.5, 1.8, 0, Math.PI * 2); ctx.arc(34, -3, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a1737';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(30, 1, 5, 0.1, Math.PI * 0.75); ctx.stroke();
    ctx.fillStyle = '#65d8ff';
    ctx.beginPath(); ctx.moveTo(8, -17); ctx.lineTo(20, -20); ctx.lineTo(26, -15); ctx.lineTo(13, -11); ctx.closePath(); ctx.fill(); ctx.stroke();

    // A small papel-picado rosette acts as the interaction focal point.
    tracePinataStar(-4, -1, 9, 4.2, time * 0.00035 - Math.PI / 2);
    ctx.fillStyle = '#fff1a6';
    ctx.strokeStyle = '#b53d79';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5f91';
    ctx.beginPath(); ctx.arc(-4, -1, 2.5, 0, Math.PI * 2); ctx.fill();

    if (pinata.hits >= 1) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#4a213f';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-9, -16); ctx.lineTo(-4, -8); ctx.lineTo(-9, -1); ctx.lineTo(-3, 7); ctx.stroke();
      ctx.fillStyle = '#fff1a6';
      ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-4, -8); ctx.lineTo(-7, -2); ctx.closePath(); ctx.fill();
    }
    if (pinata.hits >= 2) {
      ctx.fillStyle = '#4a213f';
      ctx.beginPath(); ctx.moveTo(7, 6); ctx.lineTo(18, 4); ctx.lineTo(13, 13); ctx.lineTo(6, 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#65d8ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(13, 12); ctx.lineTo(17, 20); ctx.moveTo(9, 12); ctx.lineTo(7, 21); ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    const promptWidth = 112;
    const promptX = centerX - promptWidth / 2;
    const promptY = pinata.y - 40;
    const promptGradient = ctx.createLinearGradient(promptX, promptY, promptX, promptY + 28);
    promptGradient.addColorStop(0, 'rgba(65, 26, 63, .97)');
    promptGradient.addColorStop(1, 'rgba(31, 18, 45, .94)');
    ctx.shadowColor = '#ff67ad';
    ctx.shadowBlur = 9;
    ctx.fillStyle = promptGradient;
    ctx.strokeStyle = damage > 0.45 ? '#ffd166' : '#ff67ad'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(promptX, promptY, promptWidth, 28, 9); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd166';
    tracePinataStar(promptX + 13, promptY + 14, 5, 2.2); ctx.fill();
    tracePinataStar(promptX + promptWidth - 13, promptY + 14, 5, 2.2); ctx.fill();
    ctx.fillStyle = '#fff8df'; ctx.font = '900 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${pinata.targetHits - pinata.hits} STOMPS!`, centerX, promptY + 14.5);
    ctx.restore();
  }

  function drawImpactFX() {
    for (const p of game.splatParticles) {
      const x = p.x - game.cameraX;
      ctx.globalAlpha = clamp(p.life * 1.8, 0, 1);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath(); ctx.arc(x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.65);
      }
    }
    ctx.globalAlpha = 1;

    for (const p of game.impactTexts) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      const scale = 1 + (1 - alpha) * 0.18;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x - game.cameraX, p.y);
      ctx.scale(scale, scale);
      ctx.textAlign = 'center';
      ctx.font = `900 ${p.size}px Arial`;
      ctx.fillStyle = '#2b1811';
      ctx.fillText(p.text, 3, 3);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  }

  function remasteredEnemyFrame(enemy) {
    if (enemy.defeated) return enemy.defeatTimer > 0.23 ? 6 : 7;
    if (enemy.telegraph) return 4;
    const airborneSpecial = (enemy.type === 'onion' || enemy.type === 'jalapeno')
      && enemy.y < enemy.baseY - 2;
    if (enemy.charging || enemy.rolling || airborneSpecial) return 5;
    // `enemy.anim` is already measured in idle frames per second. Do not add
    // a second multiplier here: that made the four-pose cycle visibly rush
    // from left to right even after the shared clock was slowed.
    return Math.floor(enemy.anim) % 4;
  }

  function drawRemasteredEnemy(enemy) {
    const spriteName = enemySpriteArt[enemy.type] || enemySpriteArt.chili;
    const sprite = images[spriteName];
    if (!sprite) {
      const pulse = Math.sin(enemy.anim * 0.75);
      const step = Math.sin(enemy.anim * 1.25) * 1.8;
      if (enemy.type === 'tomato') drawTomatoTrouble(pulse, step);
      else if (enemy.type === 'onion') drawOnionDrama(pulse, step);
      else if (enemy.type === 'jalapeno') drawJalapenoPopper(pulse, step);
      else drawChiliBandit(pulse, step);
      return;
    }
    const columns = 4;
    const rows = 2;
    const sourceW = sprite.naturalWidth / columns;
    const sourceH = sprite.naturalHeight / rows;
    const frame = remasteredEnemyFrame(enemy);
    const sourceX = (frame % columns) * sourceW;
    const sourceY = Math.floor(frame / columns) * sourceH;
    const artSize = enemy.type === 'onion' ? 70 : 72;
    const actionLift = enemy.telegraph ? 1.5 : 0;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (enemy.defeated) ctx.globalAlpha = clamp(enemy.defeatTimer / 0.16, 0, 1);
    ctx.drawImage(
      sprite,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      -artSize * 0.5,
      -artSize - actionLift,
      artSize,
      artSize,
    );
    ctx.restore();
  }

  function drawDesertLocals(time) {
    const sprite = images.world1_1_desert_locals_v1;
    if (!sprite) return;
    const celebrating = game.state === 'celebrating' || game.state === 'won';
    const sourceW = sprite.naturalWidth / 3;
    const sourceH = sprite.naturalHeight / 2;

    for (const local of desertLocals) {
      if (local.goalOffset != null && !celebrating) continue;
      const worldX = local.goalOffset == null ? local.x : level.goal.x + local.goalOffset;
      const screenX = worldX - game.cameraX;
      if (screenX < -110 || screenX > canvas.width + 110) continue;

      const beat = time * 0.006 + local.phase;
      const lively = local.goalOffset != null;
      const bounce = lively ? Math.abs(Math.sin(beat * 1.32)) * 8 : Math.abs(Math.sin(beat)) * 2;
      const sway = Math.sin(beat * 0.72) * (lively ? 0.055 : 0.025);
      const size = 104 * local.scale;
      const groundY = level.groundY + 1;
      const sourceX = (local.frame % 3) * sourceW;
      const sourceY = Math.floor(local.frame / 3) * sourceH;

      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#321a17';
      ctx.beginPath();
      ctx.ellipse(screenX, groundY + 1, size * 0.23, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(screenX, groundY - bounce);
      ctx.rotate(sway);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        sprite,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        -size * 0.5,
        -size,
        size,
        size,
      );

      if (local.role === 'camera') {
        const flash = Math.max(0, Math.sin(beat * 2.8) - 0.9) * 10;
        if (flash > 0) {
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = `rgba(255,245,183,${Math.min(0.65, flash * 0.7)})`;
          ctx.beginPath();
          ctx.arc(5, -size * 0.56, 7 + flash * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of level.enemies) {
      if (!enemy.alive) continue;
      const ex = Math.floor(enemy.x - game.cameraX);
      if (ex < -60 || ex > canvas.width + 60) continue;
      const shadowY = enemy.baseY + enemy.h;
      const anchorY = enemy.defeated ? shadowY : enemy.y + enemy.h;

      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#3a1c17';
      ctx.beginPath(); ctx.ellipse(ex + enemy.w / 2, shadowY + 2, enemy.defeated ? 22 : 15, enemy.defeated ? 5 : 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      if (enemy.telegraph && !enemy.defeated) {
        const warningPulse = 1 + Math.sin(game.levelTime * 20) * 0.14;
        const warningColor = enemy.telegraphProfile?.color || '#ffd166';
        const roleColor = enemy.telegraphProfile?.roleColor || warningColor;
        ctx.strokeStyle = warningColor; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(ex + enemy.w / 2, shadowY + 2, 22 * warningPulse, 7 * warningPulse, 0, 0, Math.PI * 2); ctx.stroke();
        if (enemy.role && enemy.role !== 'ground-patrol') {
          ctx.strokeStyle = roleColor; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(ex + enemy.w / 2, shadowY + 2, 28 * warningPulse, 10 * warningPulse, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = warningColor; ctx.font = '900 12px Arial'; ctx.textAlign = 'center';
        ctx.fillText(enemy.telegraphLabel || 'WATCH', ex + enemy.w / 2, enemy.y - 10);
      }
      if ((enemy.charging || enemy.rolling) && !enemy.defeated) {
        ctx.strokeStyle = enemy.telegraphProfile?.accent || (enemy.charging ? '#ff5f91' : '#65d8ff');
        ctx.lineWidth = 3;
        const behind = enemy.dir > 0 ? ex - 8 : ex + enemy.w + 8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(behind - enemy.dir * (i * 7), anchorY - 11 - i * 6); ctx.lineTo(behind - enemy.dir * (18 + i * 8), anchorY - 11 - i * 6); ctx.stroke();
        }
      }
      if (enemy.y < enemy.baseY - 2 && !enemy.defeated) {
        ctx.strokeStyle = enemy.telegraphProfile?.accent || '#9bef70';
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          const arrowY = enemy.y + enemy.h + 8 + i * 8;
          ctx.beginPath(); ctx.moveTo(ex + enemy.w / 2 - 10, arrowY); ctx.lineTo(ex + enemy.w / 2, arrowY - 6); ctx.lineTo(ex + enemy.w / 2 + 10, arrowY); ctx.stroke();
        }
      }

      ctx.translate(ex + enemy.w / 2, anchorY);
      ctx.scale(enemy.dir < 0 ? -1 : 1, 1);
      drawRemasteredEnemy(enemy);
      ctx.restore();
    }
  }

  function drawGoal() {
    const x = level.goal.x - game.cameraX;
    if (x < -280 || x > canvas.width + 280) return;
    const celebrating = game.state === 'celebrating' || game.state === 'won';
    const distance = level.goal.x - player.x;
    const approach = celebrating ? 1 : clamp(1 - distance / 1600, 0, 1);
    const pulse = (Math.sin(game.levelTime * (5 + approach * 8)) + 1) * 0.5;
    const centerX = x + 48;
    const bannerW = 150 + approach * 120;
    const bannerH = 75 + approach * 60;
    const bannerY = level.goal.y - 24 - approach * 72 - pulse * approach * 4;
    const leftPole = centerX - bannerW * 0.43;
    const rightPole = centerX + bannerW * 0.43;

    ctx.save();
    if (approach > 0.02) {
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(centerX, bannerY + 48, 12, centerX, bannerY + 48, 185 + approach * 95);
      glow.addColorStop(0, `rgba(255,241,166,${0.26 + approach * 0.34})`);
      glow.addColorStop(0.45, `rgba(255,111,174,${approach * 0.18})`);
      glow.addColorStop(1, 'rgba(101,216,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(centerX - 290, bannerY - 150, 580, 450);
      for (let beam = 0; beam < 7; beam++) {
        const angle = -1.25 + beam * 0.42 + Math.sin(game.levelTime * 1.6 + beam) * 0.035;
        const length = 110 + approach * 130;
        ctx.strokeStyle = beam % 2
          ? `rgba(101,216,255,${0.08 + approach * 0.17})`
          : `rgba(255,209,102,${0.08 + approach * 0.2})`;
        ctx.lineWidth = 7 + approach * 8;
        ctx.beginPath();
        ctx.moveTo(centerX, bannerY + 45);
        ctx.lineTo(centerX + Math.cos(angle) * length, bannerY + 45 + Math.sin(angle) * length);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.fillStyle = 'rgba(37,21,17,.28)';
    ctx.beginPath();
    ctx.ellipse(centerX, level.groundY - 2, 78 + approach * 36, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    const poleGradient = ctx.createLinearGradient(0, bannerY, 0, level.groundY);
    poleGradient.addColorStop(0, '#fff1a6');
    poleGradient.addColorStop(0.25, '#ff9d4d');
    poleGradient.addColorStop(1, '#7a3430');
    ctx.fillStyle = poleGradient;
    ctx.fillRect(Math.floor(leftPole), bannerY + 24, 11, level.groundY - bannerY - 24);
    ctx.fillRect(Math.floor(rightPole - 11), bannerY + 24, 11, level.groundY - bannerY - 24);
    ctx.strokeStyle = '#4a2323';
    ctx.lineWidth = 3;
    ctx.strokeRect(Math.floor(leftPole), bannerY + 24, 11, level.groundY - bannerY - 24);
    ctx.strokeRect(Math.floor(rightPole - 11), bannerY + 24, 11, level.groundY - bannerY - 24);

    ctx.save();
    ctx.shadowColor = pulse > 0.5 ? '#fff1a6' : '#ff6fae';
    ctx.shadowBlur = 14 + approach * 34;
    ctx.drawImage(images.fiesta_finish_banner, Math.floor(centerX - bannerW / 2), Math.floor(bannerY), bannerW, bannerH);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `900 ${12 + approach * 8}px Arial`;
    ctx.fillStyle = '#2b1811';
    ctx.fillText('FIESTA FINISH', centerX + 2, bannerY + bannerH * 0.63 + 2);
    ctx.fillStyle = '#fff1a6';
    ctx.fillText('FIESTA FINISH', centerX, bannerY + bannerH * 0.63);
    ctx.restore();

    if (approach > 0.12) {
      const bulbColors = ['#fff1a6', '#ff6fae', '#65d8ff', '#63d878'];
      const bulbCount = 11;
      for (let bulb = 0; bulb < bulbCount; bulb++) {
        const t = bulb / (bulbCount - 1);
        const bulbX = centerX - bannerW * 0.42 + t * bannerW * 0.84;
        const bulbY = bannerY - 5 - Math.sin(t * Math.PI) * 8;
        ctx.fillStyle = bulbColors[(bulb + Math.floor(game.levelTime * 7)) % bulbColors.length];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8 + approach * 10;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 3 + approach * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

    }

    ctx.fillStyle = `rgba(255,241,166,${0.12 + approach * 0.26})`;
    ctx.fillRect(Math.floor(leftPole + 12), bannerY + bannerH, Math.max(22, rightPole - leftPole - 34), level.groundY - bannerY - bannerH);

    if (approach > 0.38) {
      const cannonColors = ['#ff6fae', '#65d8ff'];
      for (let side = -1; side <= 1; side += 2) {
        const cannonX = centerX + side * (74 + approach * 28);
        ctx.save();
        ctx.translate(cannonX, level.groundY - 10);
        ctx.rotate(side * -0.48);
        ctx.fillStyle = cannonColors[side > 0 ? 0 : 1];
        ctx.strokeStyle = '#fff1a6';
        ctx.lineWidth = 3;
        ctx.fillRect(-10, -24, 20, 28);
        ctx.strokeRect(-10, -24, 20, 28);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawCheckpointSign(checkpoint, x, index) {
    const signW = Math.max(118, Math.min(190, 68 + checkpoint.sign.length * 6));
    const signX = x + checkpoint.w / 2 - signW / 2;
    ctx.fillStyle = '#fff5d6';
    ctx.strokeStyle = checkpoint.accent;
    ctx.lineWidth = 5;
    ctx.fillRect(signX, checkpoint.y - 38, signW, 31);
    ctx.strokeRect(signX, checkpoint.y - 38, signW, 31);
    ctx.fillStyle = '#2b1811';
    ctx.font = `bold ${checkpoint.sign.length > 12 ? 11 : 14}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(checkpoint.activated ? `✓ ${checkpoint.sign}` : checkpoint.sign, x + checkpoint.w / 2, checkpoint.y - 17);
    ctx.fillStyle = checkpoint.accent;
    ctx.beginPath();
    ctx.arc(x + 15, checkpoint.y + 18, 7 + index * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGoldenCactusCheckpoint(checkpoint, x, index) {
    const checkpointArt = images.world1_1_checkpoint_golden_cactus_v1;
    const artWidth = 204;
    const artHeight = artWidth * (checkpointArt.naturalHeight / checkpointArt.naturalWidth);
    const artX = x - (artWidth - checkpoint.w) * 0.5;
    const surfaceY = checkpoint.surfaceY ?? level.groundY;
    const artY = surfaceY - artHeight;
    const nearby = Math.abs((player.x + player.w * 0.5) - (checkpoint.x + checkpoint.w * 0.5)) < 270;
    const pulse = (Math.sin(game.levelTime * (checkpoint.activated ? 8 : 4)) + 1) * 0.5;
    const smoothing = ctx.imageSmoothingEnabled;

    // A tiled pull-off gives the first checkpoint a deliberate parking place.
    ctx.save();
    ctx.fillStyle = 'rgba(20, 54, 56, .92)';
    ctx.strokeStyle = '#d99b3f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(artX - 10, surfaceY - 8, artWidth + 20, 12, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 214, 102, .72)';
    for (let tileX = artX; tileX < artX + artWidth; tileX += 25) {
      ctx.fillRect(tileX, level.groundY - 5, 13, 2);
    }

    // These contact shadows are independent of the art and sit behind tires
    // whose visible bottom edge is anchored exactly to groundY.
    ctx.fillStyle = 'rgba(26, 17, 13, .22)';
    for (const wheelCenter of [0.28, 0.79]) {
      ctx.beginPath();
      ctx.ellipse(artX + artWidth * wheelCenter, surfaceY, 23, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = checkpoint.activated ? checkpoint.accent : nearby ? '#fff1a6' : 'rgba(255, 209, 102, .42)';
    ctx.shadowBlur = checkpoint.activated ? 27 + pulse * 8 : nearby ? 17 + pulse * 6 : 7;
    ctx.drawImage(checkpointArt, Math.floor(artX), artY, artWidth, artHeight);

    if (nearby || checkpoint.activated) {
      const sweepX = artX + ((game.levelTime * (checkpoint.activated ? 52 : 28)) % artWidth);
      ctx.save();
      ctx.globalAlpha = checkpoint.activated ? 0.8 : 0.48;
      ctx.strokeStyle = checkpoint.activated ? '#65d8ff' : '#fff1a6';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(sweepX - 12, artY + artHeight * 0.27);
      ctx.lineTo(sweepX + 12, artY + artHeight * 0.27);
      ctx.stroke();
      ctx.restore();
    }

    const beaconX = artX + artWidth * 0.755;
    const beaconY = artY + artHeight * 0.12;
    ctx.fillStyle = checkpoint.activated ? '#65d8ff' : '#ff9d4d';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12 + pulse * 10;
    ctx.beginPath();
    ctx.arc(beaconX, beaconY, 3.5 + pulse * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = smoothing;
    ctx.restore();

    drawCheckpointSign(checkpoint, x, index);
  }

  function drawTacoTrekkerLayers(screenX, worldX, options = {}) {
    const {
      chase = false,
      departing = false,
      entering = false,
      glitch = false,
      ghost = false,
    } = options;
    const body = images.world1_1_taco_trekker_body_v1;
    const olivia = images.world1_1_taco_trekker_olivia_v1;
    const wheel = images.world1_1_taco_trekker_wheel_v1;
    const scale = 0.35;
    const width = body.naturalWidth * scale;
    const height = body.naturalHeight * scale;
    const wheelSize = wheel.naturalWidth * scale;
    const wheelAngle = worldX / Math.max(1, wheelSize * 0.5);
    const speeding = chase || departing || entering;
    const suspension = ghost ? 0 : Math.sin(game.levelTime * (speeding ? 18 : glitch ? 11 : 7)) * (speeding ? 2.2 : 0.9);
    const wheelSourceRadius = wheel.naturalHeight * 0.5;
    const wheelSourceCenterY = 395;
    const topY = level.groundY - (wheelSourceCenterY + wheelSourceRadius) * scale;
    const bodyY = topY + suspension;
    const wheelCenters = [287.5, 565];
    const smoothing = ctx.imageSmoothingEnabled;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    if (!ghost) {
      ctx.fillStyle = 'rgba(27, 17, 16, .22)';
      for (const sourceCenterX of wheelCenters) {
        ctx.beginPath();
        ctx.ellipse(screenX + sourceCenterX * scale, level.groundY, wheelSize * 0.56, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Wheels are grounded independently, then the sprung body and Olivia are
    // painted above them so the fenders mask each rotating tire cleanly.
    for (const sourceCenterX of wheelCenters) {
      const wheelCenterX = screenX + sourceCenterX * scale;
      const wheelCenterY = level.groundY - wheelSize * 0.5;
      ctx.save();
      ctx.translate(wheelCenterX, wheelCenterY);
      ctx.rotate(wheelAngle);
      ctx.drawImage(wheel, -wheelSize * 0.5, -wheelSize * 0.5, wheelSize, wheelSize);
      ctx.restore();
    }

    ctx.shadowColor = chase || departing ? '#ff6fae' : glitch ? '#b78cff' : entering ? '#65d8ff' : '#ffd166';
    ctx.shadowBlur = ghost ? 0 : speeding ? 22 : glitch ? 19 : 12;
    ctx.drawImage(body, Math.floor(screenX), bodyY, width, height);
    ctx.shadowBlur = 0;

    ctx.drawImage(
      olivia,
      Math.floor(screenX + 310 * scale),
      bodyY + 165 * scale,
      olivia.naturalWidth * scale,
      olivia.naturalHeight * scale,
    );

    const launcherIsForThisTruck = !ghost
      && game.truckDropPulse > 0
      && Math.abs(game.truckLauncherWorldX - worldX) < 150;
    if (launcherIsForThisTruck) {
      const pulseProgress = clamp(1 - game.truckDropPulse / tacoTrekkerRearLauncher.pulseDuration, 0, 1);
      const kick = Math.sin(pulseProgress * Math.PI);
      const launcherX = screenX + tacoTrekkerRearLauncher.x;
      const launcherY = bodyY + tacoTrekkerRearLauncher.sourceY * scale;
      ctx.save();
      ctx.translate(launcherX, launcherY);
      ctx.rotate(-0.1 - kick * 0.2);
      ctx.shadowColor = glitch ? '#b78cff' : '#65d8ff';
      ctx.shadowBlur = 8 + kick * 13;
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#4a213f';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.roundRect(-16, -5, 30, 9, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = glitch ? '#b78cff' : '#65d8ff';
      ctx.beginPath(); ctx.roundRect(-11, -8 - kick * 4, 20, 5, 2.5); ctx.fill();
      ctx.globalAlpha = 1 - pulseProgress;
      ctx.strokeStyle = glitch ? '#b78cff' : '#fff1a6';
      ctx.lineWidth = 2.5;
      for (let ray = 0; ray < 3; ray += 1) {
        ctx.beginPath();
        ctx.moveTo(-4 - ray * 4, -10 - kick * 5);
        ctx.lineTo(-10 - ray * 8, -21 - kick * (7 + ray * 2));
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.imageSmoothingEnabled = smoothing;
    ctx.restore();
    return { topY, bodyY, width, height };
  }

  function drawTacoTrucks() {
    const truck = images.taco_truck_checkpoint;
    for (let index = 0; index < level.checkpoints.length; index++) {
      const checkpoint = level.checkpoints[index];
      const x = checkpoint.x - game.cameraX;
      if (x < -240 || x > canvas.width + 40) continue;
      if (checkpoint.artStyle === 'goldenCactus') {
        drawGoldenCactusCheckpoint(checkpoint, x, index);
        continue;
      }
      // Align the visible alpha edge, not the full source rectangle, to the
      // checkpoint's resolved surface. The source image has transparent pixels
      // below the wheels, which previously left the first two stations visibly
      // floating over the cavern gaps.
      const surfaceY = checkpoint.surfaceY ?? level.groundY;
      const visibleHeight = checkpoint.h * (checkpointTruckArtMetrics.visibleBottom / checkpointTruckArtMetrics.sourceHeight);
      const truckY = surfaceY - visibleHeight;
      ctx.fillStyle = 'rgba(37, 21, 17, 0.26)';
      ctx.beginPath();
      ctx.ellipse(x + checkpoint.w * 0.54, surfaceY - 2, checkpoint.w * 0.41, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      if (checkpoint.activated) {
        ctx.shadowColor = checkpoint.accent;
        ctx.shadowBlur = 24;
      }
      ctx.drawImage(truck, Math.floor(x), truckY, checkpoint.w, checkpoint.h);
      ctx.restore();
      drawCheckpointSign(checkpoint, x, index);
    }
    const drawDropTruck = (worldX, label, chase = false, variant = 'standard', departing = false, entering = false) => {
      const glitch = variant === 'glitch';
      const speeding = chase || departing || entering;
      const x = worldX - game.cameraX;
      if (x < -300 || x > canvas.width + 60) return;

      if (glitch) {
        const ghostOffset = 7 + Math.sin(game.levelTime * 24) * 3;
        ctx.save();
        ctx.globalAlpha = 0.16;
        drawTacoTrekkerLayers(x - ghostOffset, worldX, { glitch, ghost: true });
        drawTacoTrekkerLayers(x + ghostOffset, worldX, { glitch, ghost: true });
        ctx.restore();
      }

      const vehicle = drawTacoTrekkerLayers(x, worldX, {
        chase,
        departing,
        entering,
        glitch,
      });
      const y = vehicle.topY;

      // One measured speech bubble replaces the old fixed title and separate
      // joke tag. The padding stays consistent even when the copy changes.
      const bubbleTitle = label;
      const bubbleSubtitle = speeding ? '' : glitch ? 'ORDERED 6–7. GOT 67.' : 'TACOS OUT BACK!';
      const titleFont = `900 ${speeding ? 16 : 17}px Arial`;
      const subtitleFont = '800 12px Arial';
      ctx.save();
      ctx.font = titleFont;
      const titleWidth = ctx.measureText(bubbleTitle).width;
      ctx.font = subtitleFont;
      const subtitleWidth = bubbleSubtitle ? ctx.measureText(bubbleSubtitle).width : 0;
      const bubbleWidth = Math.ceil(Math.max(titleWidth, subtitleWidth) + 36);
      const bubbleHeight = bubbleSubtitle ? 55 : 36;
      const bubbleCenter = x + vehicle.width * 0.5;
      const bubbleX = clamp(bubbleCenter - bubbleWidth / 2, 12, canvas.width - bubbleWidth - 12);
      const bubbleY = y - (bubbleSubtitle ? 66 : 47);
      const bubbleAccent = chase ? '#ff9aca' : departing ? '#ffd166' : entering ? '#65d8ff' : glitch ? '#b78cff' : '#65d8ff';
      const tailBaseX = clamp(x + vehicle.width * 0.64, bubbleX + 24, bubbleX + bubbleWidth - 24);

      ctx.fillStyle = 'rgba(42, 19, 31, .94)';
      ctx.strokeStyle = bubbleAccent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tailBaseX - 10, bubbleY + bubbleHeight - 2);
      ctx.lineTo(tailBaseX + 10, bubbleY + bubbleHeight - 2);
      ctx.lineTo(x + vehicle.width * 0.66, y + 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 12);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = titleFont;
      ctx.fillStyle = bubbleAccent;
      ctx.fillText(bubbleTitle, bubbleX + bubbleWidth / 2, bubbleY + (bubbleSubtitle ? 18 : 19));
      if (bubbleSubtitle) {
        ctx.font = subtitleFont;
        ctx.fillStyle = '#fff1a6';
        ctx.fillText(bubbleSubtitle, bubbleX + bubbleWidth / 2, bubbleY + 39);
      }
      ctx.restore();

      if (speeding) {
        ctx.strokeStyle = 'rgba(255, 241, 166, .72)';
        ctx.lineWidth = 5;
        for (let i = 0; i < (departing ? 5 : 3); i++) {
          const lineX = x - 18 - i * 22;
          ctx.beginPath();
          ctx.moveTo(lineX, y + 94 + i * 14);
          ctx.lineTo(lineX - (departing ? 66 : 42), y + 94 + i * 14);
          ctx.stroke();
        }
        if (departing || game.chaseTruckEscaping) {
          const flame = 32 + Math.sin(game.levelTime * 35) * 12;
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(x + 14, y + 132);
          ctx.lineTo(x - flame, y + 121);
          ctx.lineTo(x + 5, y + 146);
          ctx.fill();
          ctx.fillStyle = '#ff5f6d';
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 135);
          ctx.lineTo(x - flame * 0.58, y + 130);
          ctx.lineTo(x + 8, y + 142);
          ctx.fill();
        }
      }
    };

    if (game.midTruckEntering || game.midTruckActive || game.midTruckEscaping) {
      drawDropTruck(
        game.dropTruckX,
        game.midTruckEntering ? 'OLIVIA INCOMING!' : game.midTruckEscaping ? 'DELIVERY COMPLETE — BYEEE!' : 'OLIVIA’S TACO DROP!',
        false,
        'standard',
        game.midTruckEscaping,
        game.midTruckEntering,
      );
    }
    if (game.encoreTruckEntering || game.encoreTruckActive || game.encoreTruckEscaping) {
      drawDropTruck(
        game.encoreTruckX,
        game.encoreTruckEntering ? 'GLITCH DELIVERY INCOMING!' : game.encoreTruckEscaping ? 'GLITCH PATCHED — BYEEE!' : 'DELIVERY GLITCH!',
        false,
        'glitch',
        game.encoreTruckEscaping,
        game.encoreTruckEntering,
      );
    }
    if (game.chaseTruckActive || game.chaseTruckEscaping) {
      drawDropTruck(game.chaseTruckX, game.chaseTruckEscaping ? 'SEE YOU AT THE FIESTA!' : 'CATCH ME IF YOU CAN!', true);

      if (game.chaseTruckActive && game.messageTimer <= 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(34, 18, 24, .38)';
        ctx.strokeStyle = '#ff6fae';
        ctx.lineWidth = 3;
        ctx.fillRect(canvas.width / 2 - 235, 150, 470, 44);
        ctx.strokeRect(canvas.width / 2 - 235, 150, 470, 44);
        ctx.fillStyle = '#fff1a6';
        ctx.font = '900 17px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`OLIVIA CHASE  •  TURBO ×1.6  •  AIR CATCHES ${game.chaseCatchCount}`, canvas.width / 2, 179);
        ctx.restore();
      }
    }
  }

  function drawChaseSpeedFX(time) {
    if (!game.chaseTruckActive && !game.chaseTruckEscaping) return;
    const turbo = game.chaseTruckEscaping ? 1.45 : 1;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 28; i++) {
      const laneY = 74 + ((i * 61) % 340);
      const x = canvas.width - ((time * 0.7 * turbo + i * 83) % (canvas.width + 180));
      const length = (34 + (i % 6) * 17) * turbo;
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(255, 241, 166, .7)' : 'rgba(101, 216, 255, .42)';
      ctx.lineWidth = i % 4 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(x, laneY);
      ctx.lineTo(x - length, laneY);
      ctx.stroke();
    }
    const edge = ctx.createLinearGradient(0, 0, canvas.width, 0);
    edge.addColorStop(0, 'rgba(255,95,145,.16)');
    edge.addColorStop(0.18, 'rgba(255,95,145,0)');
    edge.addColorStop(0.82, 'rgba(101,216,255,0)');
    edge.addColorStop(1, 'rgba(101,216,255,.16)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function drawPartyBackdrop(time) {
    if (game.state !== 'celebrating' && game.state !== 'won') return;
    const pulse = (Math.sin(time * 0.012) + 1) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const beams = [
      { x: 90, color: 'rgba(255,70,160,.18)', swing: 120 },
      { x: 320, color: 'rgba(80,220,255,.18)', swing: -145 },
      { x: 620, color: 'rgba(255,214,70,.18)', swing: 155 },
      { x: 860, color: 'rgba(100,255,145,.16)', swing: -120 },
    ];
    for (let i = 0; i < beams.length; i++) {
      const beam = beams[i];
      const sway = Math.sin(time * 0.0018 + i * 1.7) * beam.swing;
      ctx.fillStyle = beam.color;
      ctx.beginPath();
      ctx.moveTo(beam.x - 18, 0);
      ctx.lineTo(beam.x + 18, 0);
      ctx.lineTo(beam.x + sway + 130, 460);
      ctx.lineTo(beam.x + sway - 130, 460);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(canvas.width / 2, 72);
    ctx.fillStyle = `rgba(235,245,255,${0.72 + pulse * 0.22})`;
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#99cfff'; ctx.lineWidth = 2;
    for (let y = -20; y <= 20; y += 10) { ctx.beginPath(); ctx.moveTo(-24, y); ctx.lineTo(24, y); ctx.stroke(); }
    for (let x = -20; x <= 20; x += 10) { ctx.beginPath(); ctx.moveTo(x, -24); ctx.lineTo(x, 24); ctx.stroke(); }
    ctx.restore();
  }

  function drawPartyForeground(time) {
    if (game.state !== 'celebrating' && game.state !== 'won') return;
    const truck = images.fiesta_party_truck;
    // Olivia's party truck is now parked beyond the finish flag as the reveal.
    const baseX = level.goal.x - game.cameraX + 125;
    const bob = Math.sin(time * 0.009) * 3;
    ctx.save();
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 24;
    ctx.drawImage(truck, baseX, 318 + bob, 300, 154);
    ctx.restore();

    // Balloon clusters and bouncing taco dancers make the finish feel alive.
    const balloonColors = ['#ff5f91', '#65d8ff', '#ffd166', '#63d878', '#b78cff'];
    for (let i = 0; i < 10; i++) {
      const side = i < 5 ? 1 : -1;
      const bx = baseX + (side > 0 ? 30 + i * 19 : 300 - (i - 5) * 19);
      const by = 286 - (i % 3) * 18 + Math.sin(time * 0.004 + i) * 5;
      ctx.fillStyle = balloonColors[i % balloonColors.length];
      ctx.beginPath(); ctx.ellipse(bx, by, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.moveTo(bx, by + 13); ctx.lineTo(bx + side * 5, 335); ctx.stroke();
    }

    // Olivia's player-facing meme sign stays above the balloons for instant readability.
    ctx.save();
    ctx.fillStyle = 'rgba(43, 24, 17, .9)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(baseX + 28, 258 + bob, 244, 44, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff1a6';
    ctx.font = '900 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU ATE. ZERO CRUMBS.', baseX + 150, 285 + bob);
    ctx.restore();

    const items = images.items_sheet;
    for (let i = 0; i < 5; i++) {
      const danceX = 160 + i * 145;
      const danceY = 410 - Math.abs(Math.sin(time * 0.009 + i * 1.3)) * (18 + i % 2 * 8);
      ctx.save();
      ctx.translate(danceX, danceY);
      ctx.rotate(Math.sin(time * 0.011 + i) * 0.22);
      ctx.drawImage(items, 0, 0, 16, 16, -22, -22, 44, 44);
      ctx.restore();
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2b1811';
    ctx.font = '900 42px Arial';
    ctx.fillText(game.partyRank, canvas.width / 2 + 3, 132 + 3);
    ctx.fillStyle = '#fff1a6';
    ctx.fillText(game.partyRank, canvas.width / 2, 132);
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#fff9ef';
    ctx.fillText(`FIESTA BONUS +${game.partyBonus}`, canvas.width / 2, 162);
    ctx.restore();
  }

  function drawPlayer() {
    const sprite = images.taco_hero_sheet;
    const frame = (game.state === 'celebrating' || game.state === 'won') ? 7
      : (player.invulnerable > 0 && game.frenzyTimer <= 0 ? 6
      : (!player.grounded ? (player.vy < 0 ? 4 : 5)
      : (Math.abs(player.vx) > 22 ? 1 + (Math.floor(player.anim) % 3) : 0)));
    const flash = player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0;
    const hiddenForRespawn = heroCore.hidePlayerDuringRespawn(game.respawn);
    if (hiddenForRespawn) return;
    const px = Math.floor(player.x - game.cameraX);
    const py = Math.floor(player.y);
    const scale = player.scale || 1;
    const chaseReadability = game.chaseTruckActive || game.chaseTruckEscaping;
    if (chaseReadability) {
      const pulse = (Math.sin(game.levelTime * 13) + 1) * 0.5;
      const heroX = px + player.w * 0.5;
      const heroY = py + player.h * 0.5;
      ctx.save();
      const aura = ctx.createRadialGradient(heroX, heroY, 10, heroX, heroY, 54 + pulse * 6);
      aura.addColorStop(0, 'rgba(43,24,17,.52)');
      aura.addColorStop(0.42, 'rgba(101,216,255,.21)');
      aura.addColorStop(1, 'rgba(101,216,255,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(heroX, heroY, 59, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#2b1811';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(heroX, py + player.h + 6, 28 + pulse * 3, 7.5 + pulse * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = pulse > 0.5 ? '#fff1a6' : '#65d8ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(heroX, py + player.h + 6, 28 + pulse * 3, 7.5 + pulse * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (flash) ctx.globalAlpha = 0.45;
    ctx.save();
    ctx.translate(px + player.w * 0.5, py + player.h * 0.5);
    ctx.rotate(player.rotation || 0);
    ctx.scale((player.dir < 0 ? -1 : 1) * scale, scale);
    if (game.frenzyTimer > 0) {
      ctx.shadowColor = '#ffd83d';
      ctx.shadowBlur = 22;
    } else if (chaseReadability) {
      ctx.shadowColor = '#fff1a6';
      ctx.shadowBlur = 18;
    }
    const sourceW = sprite.width / 8;
    const spriteSize = chaseReadability ? 70 : 62;
    ctx.drawImage(sprite, frame * sourceW, 0, sourceW, sprite.height, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawRespawnFX(time) {
    heroCore.drawRespawnFX(ctx, game.respawn, player, game.cameraX, time);
  }

  function drawConfetti() {
    for (const p of game.confetti) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * 0.5, -p.size * 0.25, p.size, p.size * 0.5);
      ctx.restore();
    }
  }

  function drawFireworks() {
    for (const p of game.fireworks) {
      ctx.globalAlpha = clamp(p.life * 1.3, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawPinataKaboom(time) {
    const burst = game.pinataBurst;
    if (!burst) return;
    const progress = 1 - burst.life / burst.maxLife;
    const fade = clamp(burst.life / 1.15, 0, 1);
    const x = burst.x - game.cameraX;
    const y = burst.y;
    const colors = ['#ff5f91', '#ff9d4d', '#ffd166', '#63d878', '#65d8ff', '#b78cff'];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = fade * (1 - progress * 0.34);
    ctx.translate(x, y);

    const flashRadius = 58 + progress * 72;
    const flash = ctx.createRadialGradient(0, 0, 0, 0, 0, flashRadius);
    flash.addColorStop(0, 'rgba(255,255,230,.95)');
    flash.addColorStop(0.28, 'rgba(255,209,102,.58)');
    flash.addColorStop(1, 'rgba(255,95,145,0)');
    ctx.fillStyle = flash;
    ctx.beginPath();
    ctx.arc(0, 0, flashRadius, 0, Math.PI * 2);
    ctx.fill();

    const shockRadius = 30 + (1 - Math.pow(1 - progress, 3)) * 170;
    colors.forEach((color, index) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 7 - index * 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, shockRadius - index * 7), 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.rotate(time * 0.0014);
    for (let ray = 0; ray < 18; ray++) {
      const angle = (Math.PI * 2 * ray) / 18;
      const near = 28 + progress * 80;
      const far = near + 36 + (ray % 3) * 14;
      ctx.strokeStyle = colors[ray % colors.length];
      ctx.lineWidth = ray % 2 ? 4 : 7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * near, Math.sin(angle) * near);
      ctx.lineTo(Math.cos(angle) * far, Math.sin(angle) * far);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTacoRain() {
    const items = images.items_sheet;
    for (const p of game.tacoRain) {
      const info = itemTypes[p.type];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.drawImage(items, info.frame * 16, 0, 16, 16, -16, -16, 32, 32);
      ctx.restore();
    }
  }

  function drawProgressMap() {
    const x = 375;
    const y = 29;
    const w = 355;
    const progress = clamp(player.x / game.levelWidth, 0, 1);
    const milestones = [
      { x: zones.showdownStart, label: 'SHOWDOWN', icon: '⚡' },
      { x: zones.chaseStart, label: 'CHASE', icon: '🚚' },
      { x: zones.goalX, label: 'FIESTA', icon: '★' },
    ];

    ctx.save();
    ctx.fillStyle = 'rgba(14, 19, 30, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x - 15, y - 13, w + 30, 57, 14);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    ctx.strokeStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * progress, y); ctx.stroke();
    ctx.fillStyle = '#fff9ef';
    ctx.beginPath(); ctx.arc(x + w * progress, y, 6.5, 0, Math.PI * 2); ctx.fill();

    milestones.forEach((milestone) => {
      const mx = x + w * (milestone.x / game.levelWidth);
      const reached = player.x >= milestone.x;
      ctx.fillStyle = reached ? '#ffd166' : '#566078';
      ctx.beginPath(); ctx.arc(mx, y, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = '900 10px Arial';
      ctx.fillStyle = reached ? '#fff3b0' : 'rgba(255,255,255,.55)';
      ctx.fillText(`${milestone.icon} ${milestone.label}`, mx, y + 27);
    });
    ctx.restore();
  }

  function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines.slice(0, 2);
  }

  function drawRadioMessage() {
    if (game.radioTimer <= 0 || !game.radioMessage) return;
    const x = 360;
    const y = 82;
    const w = 420;
    const h = 62;
    const fade = clamp(Math.min(game.radioTimer * 3, (4.2 - game.radioTimer) * 4), 0, 1);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(25, 20, 48, .62)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = '#65d8ff'; ctx.lineWidth = 2; ctx.stroke();

    // Use Olivia's checkpoint artwork so her radio portrait matches her in-game appearance.
    const oliviaPortrait = images.taco_truck_checkpoint;
    const portraitX = x + 7;
    const portraitY = y + 7;
    const portraitSize = 48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 31, y + 31, 24, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#1a1734';
    ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      oliviaPortrait,
      825, 210, 280, 280,
      portraitX, portraitY, portraitSize, portraitSize,
    );
    ctx.restore();

    const portraitRing = ctx.createLinearGradient(x + 8, y + 8, x + 54, y + 54);
    portraitRing.addColorStop(0, '#ff67ad');
    portraitRing.addColorStop(0.5, '#ffd166');
    portraitRing.addColorStop(1, '#65d8ff');
    ctx.save();
    ctx.strokeStyle = portraitRing;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#65d8ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x + 31, y + 31, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#63d878';
    ctx.beginPath();
    ctx.arc(x + 50, y + 49, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#65d8ff';
    ctx.font = '900 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('OLIVIA RADIO • LIVE', x + 63, y + 17);
    ctx.fillStyle = '#fff9ef';
    ctx.font = '800 13px Arial';
    wrapText(game.radioMessage.replace(/^OLIVIA:\s*/, ''), w - 78).forEach((line, index) => {
      ctx.fillText(line, x + 63, y + 36 + index * 16);
    });
    ctx.restore();
  }

  function drawCinematicOverlay() {
    if (game.cinematicTimer <= 0 || !game.cinematicDuration) return;
    const t = 1 - game.cinematicTimer / game.cinematicDuration;
    const alpha = clamp(Math.sin(t * Math.PI) * 1.15, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(5, 4, 15, .5)';
    ctx.fillRect(0, 0, canvas.width, 22);
    ctx.fillRect(0, canvas.height - 22, canvas.width, 22);
    ctx.textAlign = 'center';
    ctx.font = '950 38px Arial';
    ctx.strokeStyle = '#28162f';
    ctx.lineWidth = 8;
    ctx.strokeText(game.cinematicLabel, canvas.width / 2, 255);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(game.cinematicLabel, canvas.width / 2, 255);
    ctx.font = '900 12px Arial';
    ctx.fillStyle = '#65d8ff';
    ctx.fillText('GET READY', canvas.width / 2, 278);
    ctx.restore();
  }

  function drawHUD(time) {
    ctx.save();
    ctx.fillStyle = 'rgba(14, 19, 30, 0.3)';
    ctx.fillRect(16, 16, 330, 126);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeRect(16, 16, 330, 126);
    ctx.fillStyle = '#fff7ea';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('Jumpin’ For Tacos', 28, 44);
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${game.score}`, 28, 72);
    ctx.fillText(`Collected: ${game.collected}/${game.totalCollectibles}`, 28, 98);
    const multiplier = 1 + Math.min(4, Math.floor(game.streak / 5));
    ctx.fillStyle = game.streak > 0 ? '#ffd166' : 'rgba(255,255,255,.65)';
    ctx.fillText(`Streak: ${game.streak}  ×${multiplier}`, 190, 72);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(28, 114, 290, 14);
    ctx.fillStyle = game.frenzyTimer > 0 ? '#ff6b6b' : '#ffd166';
    const meter = game.frenzyTimer > 0 ? game.frenzyTimer / 8 : game.salsaMeter / 100;
    ctx.fillRect(28, 114, 290 * clamp(meter, 0, 1), 14);
    ctx.fillStyle = '#fff9ef';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(game.frenzyTimer > 0 ? 'TACO FRENZY' : 'SALSA METER', 35, 125);

    drawProgressMap();

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < game.hearts ? '#ff6b6b' : 'rgba(255,255,255,0.2)';
      const x = 860 - i * 34;
      ctx.beginPath();
      ctx.arc(x, 38, 10, 0, Math.PI * 2);
      ctx.arc(x - 10, 30, 8, 0, Math.PI * 2);
      ctx.arc(x + 10, 30, 8, 0, Math.PI * 2);
      ctx.lineTo(x, 54);
      ctx.fill();
    }

    ctx.textAlign = 'right';
    ctx.font = '900 16px Arial';
    if (game.magnetTimer > 0) {
      ctx.fillStyle = '#65d8ff';
      ctx.fillText(`🧲 TACO MAGNET ${Math.ceil(game.magnetTimer)}s`, 928, 76);
    }
    if (game.stompCombo > 0) {
      const comboTier = heroCore.stompComboReward(game.stompCombo);
      ctx.fillStyle = comboTier.tier === 'supremacy'
        ? '#fff1a6'
        : comboTier.tier === 'rainbow'
          ? '#65d8ff'
          : '#ff67ad';
      ctx.fillText(`${comboTier.shortLabel} ×${game.stompCombo}`, 928, 100);
    }
    if (game.airChain > 1) {
      ctx.fillStyle = '#ffd166';
      ctx.fillText(`AIRBORNE ×${game.airChain}`, 928, 124);
    }

    if (game.messageTimer > 0 && game.state !== 'celebrating' && game.state !== 'won') {
      const pulse = 1 + Math.sin(time * 0.018) * 0.05;
      ctx.save();
      ctx.translate(canvas.width * 0.5, 165);
      ctx.scale(pulse, pulse);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2b1811';
      const messageSize = game.message.length > 38 ? 27 : game.message.length > 27 ? 33 : 40;
      ctx.font = `900 ${messageSize}px Arial`;
      ctx.fillText(game.message, 3, 3);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(game.message, 0, 0);
      ctx.restore();
    }
    drawRadioMessage();
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (game.cameraShake > 0) {
      const shake = game.reducedShake ? game.cameraShake * 0.22 : game.cameraShake;
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.55);
    }
    if (game.cinematicTimer > 0 && game.cinematicDuration > 0) {
      const t = 1 - game.cinematicTimer / game.cinematicDuration;
      const zoom = 1 + Math.sin(t * Math.PI) * 0.025;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    drawBackground();
    drawPartyBackdrop(time);
    drawChaseSpeedFX(time);

    // Decorative distant road / horizon stripes
    ctx.fillStyle = 'rgba(255, 233, 160, 0.16)';
    ctx.fillRect(0, 426, canvas.width, 12);
    ctx.fillStyle = 'rgba(125, 74, 46, 0.18)';
    ctx.fillRect(0, 438, canvas.width, 10);

    drawGround();
    drawDesertLocals(time);
    drawCollectibles(time);
    drawTacoTrucks();
    drawGoal();
    drawPartyForeground(time);
    drawPinata(time);
    drawPinataKaboom(time);
    drawEnemies();
    drawRespawnFX(time);
    const chaseHeroPriority = game.chaseTruckActive || game.chaseTruckEscaping;
    if (chaseHeroPriority) {
      drawTacoRain();
      drawConfetti();
      drawFireworks();
    }
    drawPlayer();
    drawImpactFX();
    if (!chaseHeroPriority) {
      drawTacoRain();
      drawConfetti();
      drawFireworks();
    }
    ctx.restore();
    drawHUD(time);
    drawCinematicOverlay();
    if (location.hostname === 'terminal.local') {
      canvas.dataset.qaState = JSON.stringify({
        sourceVersion: SOURCE_VERSION,
        state: game.state,
        player: { x: Math.round(player.x), y: Math.round(player.y), vx: Math.round(player.vx), vy: Math.round(player.vy), grounded: player.grounded },
        heroPhysics,
        respawn: {
          active: game.respawn.active,
          phase: game.respawn.active ? (game.respawn.spawnPlaced ? 'drop' : game.respawn.timer < .38 ? 'vanish' : 'beam') : 'inactive',
          count: game.respawnCount,
          fallbacks: game.respawnFallbacks,
          lastLanding: game.lastRespawnLanding,
        },
        lastImpactText: game.impactTexts[game.impactTexts.length - 1]?.text || null,
        lastStomp: game.lastStomp,
        pinata: level.pinata ? { x: level.pinata.x, hits: level.pinata.hits, broken: level.pinata.broken } : null,
        layout: {
          worldWidth: game.levelWidth,
          platforms: level.platforms.length,
          movingPlatforms: level.platforms.filter((platform) => platform.moving).length,
          routeMaxGap: game.routeMaxGap,
          platformOverlapCount: game.platformOverlapCount,
          platformOverlapPairs: game.platformOverlapPairs || [],
          checkpoints: level.checkpoints.length,
          checkpointIds: level.checkpoints.map((checkpoint) => checkpoint.id),
          checkpointDefinitions: checkpointDefs.map((checkpoint) => ({ id: checkpoint.id, x: checkpoint.x })),
          checkpointsGrounded: game.checkpointsGrounded,
          allCheckpointsGrounded: game.checkpointsGrounded === level.checkpoints.length,
          checkpointGroundingRepairs: game.checkpointGroundingRepairs,
          checkpointSupports: level.checkpoints.map((checkpoint) => ({
            id: checkpoint.id,
            x: Math.round(checkpoint.x),
            y: Math.round(checkpoint.y),
            surfaceY: Math.round(checkpoint.surfaceY ?? level.groundY),
            supportId: checkpoint.support?.id || null,
            repaired: Boolean(checkpoint.groundRepair),
          })),
          tacos: level.collectibles.filter((item) => item.type === 'taco').length,
          tacoCoins: level.collectibles.filter((item) => item.type === 'tacoCoin').length,
        },
        music: {
          active: activeMusicName,
          transition: musicTransition ? {
            progress: Number(clamp(musicTransition.elapsed / musicTransition.duration, 0, 1).toFixed(3)),
          } : null,
          playing: Object.entries(musicTracks).filter(([, track]) => !track.paused)
            .map(([name, track]) => ({ name, volume: Number(track.volume.toFixed(3)) })),
          overlapSafe: Object.values(musicTracks).filter((track) => !track.paused).length <= 2,
        },
        audio: audio?.getTelemetry() || null,
        background: world1Background.qaState(),
        foregroundRemaster: {
          paintedTerrain: true,
          goldenCactusCheckpoint: level.checkpoints.some((checkpoint) => checkpoint.artStyle === 'goldenCactus'),
          layeredTacoTrekker: true,
          independentWheels: true,
          rearTacoLauncher: true,
          oliviaDrivingPose: true,
          armThrowOverlay: false,
          rearLauncherPulse: game.truckDropPulse > 0
            ? Number((1 - game.truckDropPulse / tacoTrekkerRearLauncher.pulseDuration).toFixed(2))
            : -1,
          pinataVisualRemaster: 'burro-fringe-v1',
        },
        characterRemaster: {
          enemyTypes: Object.keys(enemySpriteArt),
          enemyAnimationFrames: 8,
          enemyVisualAnimationRate: heroPhysics.enemyVisualAnimationRate,
          enemyIdleLoopSeconds: Number((4 / heroPhysics.enemyVisualAnimationRate).toFixed(2)),
          behaviorDrivenFrames: true,
          trueBodyBaselines: true,
          independentEnemyShadows: true,
          decorativeLocals: desertLocals.length,
          nonCollidableLocals: true,
          collisionGeometryPreserved: true,
        },
        pilotRemaster: {
          ...(game.pilotRemaster || {}),
          openingLeadEnemyRemoved: game.openingLeadEnemyRemoved || 0,
          routeMarkers: false,
          highRouteLabels: false,
          platformEnemies: level.enemies.filter((enemy) => Boolean(enemy.platform)).length,
          elevatedEnemies: level.enemies.filter((enemy) => enemy.platform && !enemy.platform.ground).length,
          groundEnemies: level.enemies.filter((enemy) => !enemy.platform || enemy.platform.ground).length,
          movingGuards: level.enemies.filter((enemy) => enemy.role === 'moving-guard').length,
          champions: level.enemies.filter((enemy) => enemy.role === 'champion').length,
          routeHelpers: level.enemies.filter((enemy) => enemy.role === 'route-helper').length,
          groupedEnemies: level.enemies.filter((enemy) => enemy.groupSize > 1).length,
          enemyGroups: [...new Set(level.enemies.filter((enemy) => enemy.groupId).map((enemy) => enemy.groupId))],
          formationRules: game.formationRules,
          formationOverlapCount: game.formationOverlapCount,
          formationOverlapPairs: game.formationOverlapPairs || [],
          narrowPlatformGroups: game.narrowPlatformGroups || [],
          enemyRewards: level.enemies
            .filter((enemy) => enemy.pilotEncounter)
            .map((enemy) => ({
              id: enemy.pilotEncounter,
              role: enemy.role,
              supportPlatformId: enemy.supportPlatformId,
              rewardTier: enemy.rewardProfile?.tier || null,
              bonusItem: enemy.rewardProfile?.bonusItem || null,
            })),
        },
        enemyPatrol: {
          ...(game.enemyPatrolAudit || {}),
          movingSamples: level.enemies
            .filter((enemy) => enemy.alive && enemy.groupId)
            .slice(0, 12)
            .map((enemy) => ({
              id: enemy.id,
              spawnX: Math.round(enemy.x),
              minX: Math.round(enemy.minX),
              maxX: Math.round(enemy.maxX),
              span: Math.round(enemy.patrolSpan || (enemy.maxX - enemy.minX)),
              mode: enemy.formationPatrolMode || null,
            })),
        },
        pinataEnemies: level.enemies
          .filter((enemy) => enemy.pinataArena || enemy.arenaId === 'pinata-arena')
          .map((enemy) => ({ x: Math.round(enemy.x), defeated: enemy.defeated, pinataArena: enemy.pinataArena })),
        trucks: {
          first: { x: Math.round(game.dropTruckX), entering: game.midTruckEntering, active: game.midTruckActive, escaping: game.midTruckEscaping },
          glitch: { x: Math.round(game.encoreTruckX), entering: game.encoreTruckEntering, active: game.encoreTruckActive, escaping: game.encoreTruckEscaping },
        },
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

  loadAssets().then(() => {
    setupInputs();
    resetGame();
    syncSettingsUI();
    updatePersonalBestText();
    requestAnimationFrame(frame);
  }).catch((err) => {
    console.error('Failed to load game assets:', err);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Could not load Jumpin For Tacos assets.', 40, 60);
  });
})();
