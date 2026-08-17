(() => {
  const SOURCE_VERSION = 'w1-3-v28-super-exploration';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const heroCore = window.JFT_HERO_CORE;
  const heroPhysics = heroCore.physics;
  const audio = window.JFT_AUDIO;

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
    resultChain: document.getElementById('resultChain'),
    resultSauce: document.getElementById('resultSauce'),
    resultBoss: document.getElementById('resultBoss'),
    winText: document.getElementById('winText'),
    newBestText: document.getElementById('newBestText'),
  };

  const WORLD_WIDTH = 35800;
  const GROUND_Y = 460;
  const BOSS_ARENA_LEFT = 24840;
  const BOSS_ARENA_RIGHT = 28680;
  const sections = [
    { id: 'gauntlet', name: 'Golden Hour Gauntlet', start: 0, end: 5600, music: 'gauntlet', accent: '#ffd65a' },
    { id: 'stampede', name: 'Salsa Canyon Stampede', start: 5600, end: 11200, music: 'stampede', accent: '#ff8d57' },
    { id: 'mercado', name: 'Mercado Rooftops', start: 11200, end: 17400, music: 'mercado', accent: '#65d8ff' },
    { id: 'parade', name: 'Parade Float Panic', start: 17400, end: 23000, music: 'parade', accent: '#ff6fae' },
    { id: 'boss', name: 'Midnight Salsa Showdown', start: 23000, end: 28800, music: 'boss', accent: '#b78cff' },
    { id: 'victory', name: 'Hero’s Victory Dash', start: 28800, end: 33800, music: 'victory', accent: '#ffd65a' },
    { id: 'party', name: 'Victory Fiesta', start: 33800, end: WORLD_WIDTH, music: 'fiesta', accent: '#8dff9c' },
  ];
  const checkpointDefs = [
    { x: 5150, name: 'Gauntlet Gate', sign: 'GUAC PRESSURE: LOW, BUT SUSPICIOUS.', radio: 'El Guacodillo has challenged three mirrors and lost twice.', accent: '#ffd65a', look: 'sun' },
    { x: 10600, name: 'Canyon Radio', sign: 'AVOCADO WITH ATTITUDE AHEAD.', radio: 'Boss update: sombrero huge, emotional stability tiny.', accent: '#ff8d57', look: 'radio' },
    { x: 16700, name: 'Mercado Stop', sign: 'CHIPS NOT PROVIDED.', radio: 'El Guacodillo says he invented guacamole. Avocados are furious.', accent: '#65d8ff', look: 'awning' },
    { x: 22400, name: 'Parade Pit', sign: 'DO NOT TAUNT THE PRODUCE.', radio: 'He practiced his evil laugh all week. Please pretend it is scary.', accent: '#ff6fae', look: 'parade' },
    { x: 24440, name: 'Showdown Gate', sign: 'GUAC PRESSURE: CRITICAL.', radio: 'Olivia here: three openings, three stomps. The hat is structural. Probably.', accent: '#b78cff', look: 'neon' },
  ];
  const SHOWDOWN_EXPLORATION_VERSION = 'world-1-3-phase2-v1';
  const BOSS_TRIGGER_X = 24920;
  const PHASE2_BOSS_BUFFER_X = 24320;
  const showdownExplorationPlan = Object.freeze([
    Object.freeze({
      id: 'pepper-mine-lift', name: 'Pepper Mine Lift', presentation: 'mechanical-activation',
      arrivalTitle: 'PEPPER MINE LIFT REACHED', completionTitle: 'PEPPER LIFT ONLINE',
      rewardLabel: '+1,300 SCORE  •  10-TACO ORE HAUL', score: 1300, bonusTacos: 10, rainbowTacos: 0,
      trigger: Object.freeze({ x: 4680, y: 0, w: 240, h: 176 }),
      routeRange: Object.freeze([3820, 5040]), rewardX: 4800, rewardY: 72,
      rewardPlatformId: 'phase2-pepper-lift-deck', waypointCount: 3, worldPercent: Object.freeze([10.7, 14.1]),
    }),
    Object.freeze({
      id: 'salsa-silo', name: 'Salsa Silo', presentation: 'pressure-spectacle',
      arrivalTitle: 'SALSA SILO CATWALK REACHED', completionTitle: 'SALSA PRESSURE PERFECT!',
      rewardLabel: '+2,200 SCORE  •  14-TACO PRESSURE BURST', score: 2200, bonusTacos: 14, rainbowTacos: 1,
      trigger: Object.freeze({ x: 13620, y: 0, w: 250, h: 176 }),
      routeRange: Object.freeze([12420, 14040]), rewardX: 13745, rewardY: 62,
      rewardPlatformId: 'phase2-salsa-silo-deck', waypointCount: 5, worldPercent: Object.freeze([34.7, 39.2]),
    }),
    Object.freeze({
      id: 'wanted-tower', name: 'El Guacadillo Wanted Tower', presentation: 'boss-foreshadowing',
      arrivalTitle: 'WANTED TOWER REACHED', completionTitle: 'WANTED TOWER LIT',
      rewardLabel: '+1,800 SCORE  •  12-TACO BOUNTY', score: 1800, bonusTacos: 12, rainbowTacos: 0,
      trigger: Object.freeze({ x: 19140, y: 0, w: 250, h: 168 }),
      routeRange: Object.freeze([18120, 19880]), rewardX: 19265, rewardY: 58,
      rewardPlatformId: 'phase2-wanted-tower-deck', waypointCount: 3, worldPercent: Object.freeze([50.6, 55.5]),
    }),
    Object.freeze({
      id: 'guac-lookout', name: 'Guac Lookout', presentation: 'character-preparation',
      arrivalTitle: 'GUAC LOOKOUT REACHED', completionTitle: 'GUAC LOOKOUT SECURED',
      rewardLabel: '+2,600 SCORE  •  9 TACOS  •  LIME SHIELD', score: 2600, bonusTacos: 9, rainbowTacos: 1,
      trigger: Object.freeze({ x: 23920, y: 0, w: 250, h: 176 }),
      routeRange: Object.freeze([23180, PHASE2_BOSS_BUFFER_X]), rewardX: 24045, rewardY: 60,
      rewardPlatformId: 'phase2-guac-lookout-deck', waypointCount: 3, worldPercent: Object.freeze([64.7, 67.9]),
    }),
  ]);
  const outlawStashPlan = Object.freeze({
    id: 'outlaw-stash', name: 'Outlaw Stash', presentation: 'true-secret',
    completionTitle: 'OUTLAW STASH DISCOVERED!',
    rewardLabel: '+4,200 SCORE  •  22-TACO JACKPOT  •  3 RAINBOW TACOS',
    score: 4200, bonusTacos: 22, rainbowTacos: 3,
    trigger: Object.freeze({ x: 19640, y: 0, w: 230, h: 142 }),
    routeRange: Object.freeze([19390, 19920]), rewardX: 19755, rewardY: 32,
    rewardPlatformId: 'phase2-outlaw-stash', waypointCount: 2,
  });
  const STAMPEDE_CORRIDOR = Object.freeze({ start: 5900, end: 10820 });
  const SHOWDOWN_COMBAT_END = sections[4].start;
  const SHOWDOWN_GROUND_PLAN = Object.freeze([
    { id: 'showdown-gauntlet-slime-pack', anchorX: 900, type: 'slime', count: 2, section: 'gauntlet', role: 'ground-patrol', purpose: 'Open the finale with a readable two-splat rhythm.' },
    { id: 'showdown-gauntlet-knight-pack', anchorX: 1970, type: 'knight', count: 2, section: 'gauntlet', role: 'ground-patrol', purpose: 'Give the tortilla knight a wide, safe lower-route patrol.' },
    { id: 'showdown-gauntlet-jalapeno-pack', anchorX: 3140, type: 'jalapeno', count: 2, section: 'gauntlet', role: 'ground-patrol', purpose: 'Teach the hot-pepper hop before the canyon landmark.' },
    { id: 'showdown-gauntlet-guac-pack', anchorX: 4380, type: 'guac', count: 2, section: 'gauntlet', role: 'ground-patrol', purpose: 'Build a final calm chain before the first checkpoint.' },
    { id: 'showdown-stampede-approach-pack', anchorX: 5740, type: 'churro', count: 2, section: 'stampede-approach', role: 'ground-patrol', purpose: 'Set up the canyon chase, then leave the stampede corridor clear.' },
    { id: 'showdown-mercado-mole-pack', anchorX: 11620, type: 'mole', count: 2, section: 'mercado', role: 'ground-patrol', purpose: 'Reintroduce pressure with a same-type pop-up pair.' },
    { id: 'showdown-mercado-slime-pack', anchorX: 12860, type: 'slime', count: 3, section: 'mercado', role: 'ground-patrol', purpose: 'Make the long mercado floor reward a sustained stomp chain.' },
    { id: 'showdown-mercado-knight-pack', anchorX: 14260, type: 'knight', count: 2, section: 'mercado', role: 'ground-patrol', purpose: 'Turn the awning exit into a readable side-step challenge.' },
    { id: 'showdown-mercado-jalapeno-pack', anchorX: 15720, type: 'jalapeno', count: 2, section: 'mercado', role: 'ground-patrol', purpose: 'Raise the heat before the mercado checkpoint.' },
    { id: 'showdown-parade-guac-pack', anchorX: 17680, type: 'guac', count: 2, section: 'parade', role: 'ground-patrol', purpose: 'Open Parade Float Panic with a bold, wide guac formation.' },
    { id: 'showdown-parade-churro-pack', anchorX: 18980, type: 'churro', count: 2, section: 'parade', role: 'ground-patrol', purpose: 'Create a springy parade-floor stomp beat.' },
    { id: 'showdown-parade-slime-pack', anchorX: 20340, type: 'slime', count: 3, section: 'parade', role: 'ground-patrol', purpose: 'Make the float route active without touching its moving platforms.' },
    { id: 'showdown-parade-knight-pack', anchorX: 21680, type: 'knight', count: 2, section: 'parade', role: 'ground-patrol', purpose: 'Close the parade with a generous final lower-route chain.' },
    { id: 'showdown-midnight-jalapeno-pack', anchorX: 23180, type: 'jalapeno', count: 2, section: 'boss-approach', role: 'ground-patrol', purpose: 'Signal that the midnight main event is close.' },
    { id: 'showdown-midnight-guac-pack', anchorX: 24020, type: 'guac', count: 2, section: 'boss-approach', role: 'ground-patrol', purpose: 'Create the last ordinary encounter before the locked arena.' },
  ]);
  const SHOWDOWN_UPPER_PLAN = Object.freeze([
    { id: 'showdown-mesa-sentry', anchorX: 760, type: 'knight', count: 1, role: 'platform-sentry', section: 'gauntlet', purpose: 'Make the first mesa landing a discoverable risk-reward.' },
    { id: 'showdown-mesa-moving-guard', anchorX: 1390, type: 'slime', count: 1, role: 'moving-guard', section: 'gauntlet', purpose: 'Turn the first moving ledge into a timing test.' },
    { id: 'showdown-mesa-champion', anchorX: 2020, type: 'jalapeno', count: 1, role: 'champion', section: 'gauntlet', purpose: 'Reward a clean bounce route with a premium target.' },
    { id: 'showdown-mesa-guac-sentry', anchorX: 2780, type: 'guac', count: 1, role: 'platform-sentry', section: 'gauntlet', purpose: 'Give the upper route a visible guac landmark.' },
    { id: 'showdown-mesa-churro-sentry', anchorX: 3800, type: 'churro', count: 1, role: 'platform-sentry', section: 'gauntlet', purpose: 'Keep the high route playful before the canyon.' },
    { id: 'showdown-mercado-mole-sentry', anchorX: 11680, type: 'mole', count: 1, role: 'platform-sentry', section: 'mercado', purpose: 'Reward curiosity above the first mercado roof.' },
    { id: 'showdown-mercado-slime-moving-guard', anchorX: 12880, type: 'slime', count: 1, role: 'moving-guard', section: 'mercado', purpose: 'Make an awning drift worth waiting for.' },
    { id: 'showdown-mercado-knight-champion', anchorX: 14080, type: 'knight', count: 1, role: 'champion', section: 'mercado', purpose: 'Place a premium stomp above the busy market floor.' },
    { id: 'showdown-mercado-jalapeno-sentry', anchorX: 15380, type: 'jalapeno', count: 1, role: 'platform-sentry', section: 'mercado', purpose: 'Finish the rooftop act with a high-value target.' },
    { id: 'showdown-parade-guac-moving-guard', anchorX: 17780, type: 'guac', count: 1, role: 'moving-guard', section: 'parade', purpose: 'Make the first parade float a deliberate pause point.' },
    { id: 'showdown-parade-churro-sentry', anchorX: 18900, type: 'churro', count: 1, role: 'platform-sentry', section: 'parade', purpose: 'Give the float route a visible bounce target.' },
    { id: 'showdown-parade-mole-champion', anchorX: 20180, type: 'mole', count: 1, role: 'champion', section: 'parade', purpose: 'Reward the highest parade landing before midnight.' },
    { id: 'showdown-parade-slime-sentry', anchorX: 21460, type: 'slime', count: 1, role: 'platform-sentry', section: 'parade', purpose: 'Close the optional float route without blocking the road.' },
    { id: 'showdown-midnight-jalapeno-sentry', anchorX: 23360, type: 'jalapeno', count: 1, role: 'platform-sentry', section: 'boss-approach', purpose: 'Foreshadow the boss arena with a final elevated guard.' },
    { id: 'showdown-midnight-guac-champion', anchorX: 24060, type: 'guac', count: 1, role: 'champion', section: 'boss-approach', purpose: 'Make the last upper landing feel like a main-event curtain call.' },
  ]);
  const SHOWDOWN_ENEMY_HITBOXES = Object.freeze({
    slime: Object.freeze({ w: 42, h: 32 }), knight: Object.freeze({ w: 42, h: 44 }),
    jalapeno: Object.freeze({ w: 34, h: 44 }), guac: Object.freeze({ w: 44, h: 40 }),
    churro: Object.freeze({ w: 34, h: 48 }), mole: Object.freeze({ w: 40, h: 38 }),
  });

  const tracks = {
    gauntlet: document.getElementById('musicGauntlet'),
    stampede: document.getElementById('musicStampede'),
    mercado: document.getElementById('musicMercado'),
    parade: document.getElementById('musicParade'),
    boss: document.getElementById('musicBoss'),
    bossAir: document.getElementById('musicBossAir'),
    bossRage: document.getElementById('musicBossRage'),
    victory: document.getElementById('musicVictory'),
    fiesta: document.getElementById('musicFiesta'),
  };
  const sharedAbilities = window.JFT_SHARED_ABILITIES;
  const allTracks = Object.values(tracks);
  audio?.registerMusicTracks(tracks);
  audio?.preloadGroups(['global', 'world1']).catch(() => {
    // Missing assets use the shared engine's centralized fallback.
  });
  const images = {};
  const keys = { left: false, right: false, jump: false };
  const world = {
    platforms: [], collectibles: [], enemies: [], checkpoints: [], villagers: [],
    goal: { x: 35410, y: 260, w: 145, h: 200 },
  };
  const player = {
    x: 140, y: 380, previousY: 380, previousBottom: 422, w: 34, h: 42, vx: 0, vy: 0, dir: 1,
    grounded: false, platform: null, anim: 0, invulnerable: 0,
    coyote: 0, jumpBuffer: 0, rotation: 0, scale: 1,
  };
  const game = {
    state: 'title', score: 0, collected: 0, totalCollectibles: 0,
    hotSauce: 0, totalHotSauce: 6, hearts: 3, cameraX: 0,
    levelTime: 0, startTime: 0, finishTime: 0, sectionIndex: 0,
    latestCheckpoint: null, message: '', messageTimer: 0,
    chainCount: 0, chainTimer: 0, bestChain: 0, defeated: 0,
    perfectStomps: 0, goldenSombrero: false, fiestaPower: 0, chainTrailTimer: 0,
    radioQueue: '', radioDelay: 0,
    abilities: sharedAbilities.createState(), limeShield: false, activePower: null,
    showdownExploration: createShowdownExplorationState(),
    stampede: { active: false, done: false, x: 0, speed: 0, nearMissArmed: false, nearMisses: 0, reactionTimer: 0, reactionIndex: -1 },
    bossActive: false, bossHits: 0, bossDefeated: false,
    bossAttackCooldown: 2.2, bossAttackIndex: 0, bossHazards: [], bossIntroTimer: 0, gateUnlockTimer: 0,
    bossState: 'dormant', bossVulnerableTimer: 0, bossStunTimer: 0,
    bossAirTimer: 0, bossShotTimer: 0, bossShotsRemaining: 0,
    bossDodges: 0, bossFinalFocus: 0, bossPhaseBanner: 0, bossPhaseTitle: '', bossKO: null,
    bossCelebrationLock: 0,
    speedPads: [], springPads: [], particles: [], confetti: [], fireworks: [], impactTexts: [], bossShockwaves: [],
    checkpointsGrounded: 0,
    platformEnemyStats: null, enemyPatrolAudit: null, platformAccess: null,
    platformOverlapPairs: [], showdownRemaster: null,
    cameraShake: 0, hitStop: 0, celebrationTime: 0, partyBeat: -1,
    muted: false, musicVolume: 0.7, effectsVolume: 0.8, reducedShake: false,
    settingsOpen: false, respawn: heroCore.createRespawnState(),
    activeMusic: null, musicTransition: null,
    musicTransitionCount: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
    respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null, fallSoundPlayed: false,
    stampedeLoop: null,
    personalBest: { score: 0, time: 0, runs: 0, medal: '' },
  };
  const world1Background = window.JFT_WORLD1_BACKGROUNDS.create({
    levelId: '1-3', canvas, ctx, worldWidth: WORLD_WIDTH, groundY: GROUND_Y,
  });
  const GUAC_PACK_FORMATION = Object.freeze([
    { dx: -112, y: GROUND_Y, scale: 0.8, accent: '#65d8ff', grounded: true },
    { dx: -55, y: GROUND_Y - 102, scale: 0.9, accent: '#ff6fae', airborne: true },
    { dx: 8, y: GROUND_Y, scale: 1.06, accent: '#ffd65a', leader: true, grounded: true },
    { dx: 76, y: GROUND_Y - 108, scale: 0.9, accent: '#b78cff', airborne: true },
    { dx: 138, y: GROUND_Y, scale: 0.82, accent: '#8dff9c', grounded: true },
  ]);
  const enemySpriteArt = Object.freeze({
    slime: 'world1_3_salsa_slime_sheet_v1',
    knight: 'world1_3_tortilla_knight_sheet_v1',
    jalapeno: 'world1_3_jalapeno_popper_sheet_v1',
    guac: 'world1_3_guac_roller_sheet_v1',
    churro: 'world1_3_churro_jumper_sheet_v1',
    mole: 'world1_3_sombrero_mole_sheet_v1',
  });
  const enemyArtSizes = Object.freeze({
    slime: 72, knight: 76, jalapeno: 74, guac: 76, churro: 78, mole: 74,
  });
  const enemyFrameBottomInsets = Object.freeze({
    slime: [16, 16, 16, 16, 16, 16, 16, 16],
    knight: [19, 18, 18, 18, 31, 38, 23, 20],
    jalapeno: [35, 35, 34, 34, 41, 37, 40, 52],
    guac: [16, 14, 14, 15, 37, 37, 34, 31],
    churro: [38, 44, 41, 41, 59, 61, 59, 55],
    mole: [11, 17, 13, 11, 40, 39, 41, 37],
  });

  let lastFrame = 0;
  let randomSeed = 0x5A15A12;
  let showdownExplorationGeometryAudit = null;
  const params = new URLSearchParams(location.search);
  const qa = ['terminal.local', '127.0.0.1', 'localhost'].includes(location.hostname);
  const previewStart = qa ? Number(params.get('startX') || 0) : 0;
  const previewStartY = qa && params.has('startY') ? Number(params.get('startY')) : 330;
  const previewAutoRun = qa && params.get('autoRun') === '1';
  const previewAutoJump = qa && params.get('autoJump') === '1';
  const previewBossHits = qa ? Number(params.get('bossHits') || 0) : 0;
  const previewBossFinale = qa && params.get('bossFinale') === '1';
  const previewBossAttack = qa ? params.get('bossAttack') : null;
  const previewFastCelebrate = qa && params.get('fastCelebrate') === '1';
  const previewFrenzy = qa && params.get('frenzy') === '1';
  const previewSuper = qa && params.get('super') === '1';
  const previewMagnet = qa && params.get('magnet') === '1';
  const previewRespawn = qa && params.get('respawn') === '1';
  const previewRespawnCheckpoint = qa ? Number(params.get('respawnCheckpoint') || -1) : -1;
  const previewPhase2Ready = qa ? params.get('phase2Ready') || '' : '';
  const previewPhase2Complete = qa ? params.get('phase2Complete') || '' : '';
  const previewPhase2Secret = qa && params.get('phase2Secret') === '1';
  const previewLimeShield = qa && params.get('limeShield') === '1';
  const previewPowerDown = qa && params.get('powerDown') === '1';
  const previewForceNormal = qa && params.get('forceNormal') === '1';
  const previewNoDamage = qa && params.get('noDamage') === '1';
  const previewCapture = qa && params.get('capture') === '1';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const seeded = () => {
    randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };

  function createShowdownExplorationState() {
    return {
      version: SHOWDOWN_EXPLORATION_VERSION,
      scope: 'world-1-3-pre-boss-only',
      normalRouteUnaffected: true,
      noRequiredSuperTraversal: true,
      bossArenaGeometryPreserved: true,
      bossScriptPreserved: true,
      bossTransitionCleanups: 0,
      completionBanner: null,
      interaction: null,
      transmission: null,
      cameraLift: 0,
      cameraTargetLift: 0,
      previewPowerDownTriggered: false,
      destinations: Object.fromEntries(showdownExplorationPlan.map((entry) => [entry.id, {
        revealed: false, completed: false, completedAt: null, progress: 0,
        arrivalAcknowledged: false, activationStarted: false, activationCount: 0,
        completionCount: 0, rewardSpawned: false, rewardSpawnCount: 0,
        rewardSurfaceId: null, environmentEnergized: false,
        spectacleTimer: 0, spectacleMaxTimer: 0, power: 0,
      }])),
      secret: {
        revealed: false, completed: false, completedAt: null, progress: 0,
        arrivalAcknowledged: false, completionCount: 0,
        rewardSpawned: false, rewardSpawnCount: 0, rewardSurfaceId: null,
        environmentEnergized: false, revealTimer: 0, revealMaxTimer: 0, crateOpen: 0,
      },
    };
  }

  function showdownExplorationEntryState(entry) {
    if (!game.showdownExploration || !entry) return null;
    return entry.id === outlawStashPlan.id
      ? game.showdownExploration.secret
      : game.showdownExploration.destinations[entry.id] || null;
  }

  function currentSection(x = player.x) {
    return sections.find((section) => x >= section.start && x < section.end) || sections[sections.length - 1];
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function addPlatform(data) {
    const platform = { id: data.id || `showdown-platform-${world.platforms.length + 1}`, dx: 0, dy: 0, ...data };
    if (platform.moving) { platform.baseX = platform.x; platform.baseY = platform.y; }
    world.platforms.push(platform);
    return platform;
  }

  function addItem(x, y, type = 'taco', extra = {}) {
    const large = type === 'hotSauce' || type === 'magnet' || type === 'sombrero';
    const item = { x, y, w: large ? 30 : 24, h: large ? 36 : 24, type, bob: seeded() * Math.PI * 2, collected: false, ...extra };
    world.collectibles.push(item);
    return item;
  }

  function addLine(x, y, count, gap = 48, type = 'taco') {
    for (let index = 0; index < count; index += 1) addItem(x + index * gap, y, type, { bob: index * 0.37 });
  }

  function addArc(x, y, count, gap, height = 72, type = 'taco') {
    for (let index = 0; index < count; index += 1) {
      const t = count <= 1 ? 0 : index / (count - 1);
      addItem(x + index * gap, y - Math.sin(t * Math.PI) * height, type, { bob: t * 2.2 });
    }
  }

  function addGroundSection(section, style, lengths, gaps) {
    let x = section.start;
    let index = 0;
    while (x < section.end - 40) {
      const width = Math.min(lengths[index % lengths.length], section.end - x);
      addPlatform({ x, y: GROUND_Y, w: width, h: 100, style, ground: true, mainRoute: true });
      const gap = gaps[index % gaps.length];
      if (gap > 116 && x + width + gap < section.end) {
        addPlatform({
          x: x + width + gap / 2 - 70, y: 392 - (index % 2) * 20, w: 140, h: 24,
          style: section.id === 'parade' ? 'float' : 'sign', moving: true,
          axis: index % 2 ? 'y' : 'x', range: 34, speed: 1.15 + index % 3 * 0.12,
          phase: index * 0.7, mainRoute: true,
        });
      }
      x += width + gap;
      index += 1;
    }
  }

  function addUpperRoute(section, style, offset = 340, step = 510) {
    // The route breathes: every landing has a clear silhouette and the two
    // lower heights are reachable with one obvious enemy bounce.
    const heights = [340, 300, 276, 328, 288, 342];
    let index = 0;
    for (let x = section.start + offset; x < section.end - 220; x += step) {
      const moving = index % 3 === 1;
      addPlatform({
        x, y: heights[index % heights.length], w: 176 + (index % 3) * 22, h: 24,
        style, moving, axis: index % 2 ? 'y' : 'x', range: moving ? 24 + (index % 3) * 6 : 0,
        speed: 1.05 + (index % 4) * 0.16, phase: index * 0.69,
      });
      index += 1;
    }
  }

  function findExplorationAccessBase(targetX) {
    return world.platforms
      .filter((platform) => !platform.ground && !platform.secret && !platform.phase2Pilot)
      .slice()
      .sort((a, b) => Math.abs(a.x + a.w / 2 - targetX) - Math.abs(b.x + b.w / 2 - targetX))[0] || null;
  }

  function markExplorationAccessBase(targetX, discoveryId) {
    const platform = findExplorationAccessBase(targetX);
    if (!platform) return null;
    platform.phase2Pilot = true;
    platform.phase2AccessBase = true;
    platform.phase2Discovery = discoveryId;
    platform.phase2Waypoint = 0;
    return platform;
  }

  function addExplorationPlatform(data) {
    return addPlatform({
      h: 24, accessible: true, phase2Pilot: true, phase2New: true,
      ...data,
    });
  }

  function buildShowdownExplorationGeometry() {
    const bases = {
      'pepper-mine-lift': markExplorationAccessBase(3920, 'pepper-mine-lift'),
      'salsa-silo': markExplorationAccessBase(12380, 'salsa-silo'),
      'wanted-tower': markExplorationAccessBase(18180, 'wanted-tower'),
      'guac-lookout': markExplorationAccessBase(23280, 'guac-lookout'),
    };
    const authored = [
      addExplorationPlatform({ id: 'phase2-pepper-mine-beam', x: 4050, y: 142, w: 178, style: 'mesa', phase2Discovery: 'pepper-mine-lift', phase2Waypoint: 1, phase2Art: 'mine-beam' }),
      addExplorationPlatform({ id: 'phase2-pepper-mine-hoist', x: 4320, y: 74, w: 170, style: 'mesa', moving: true, axis: 'y', range: 14, speed: .92, phase: .8, phase2Discovery: 'pepper-mine-lift', phase2Waypoint: 2, phase2Art: 'mine-hoist' }),
      addExplorationPlatform({ id: 'phase2-pepper-lift-deck', x: 4680, y: 56, w: 240, style: 'mesa', phase2Discovery: 'pepper-mine-lift', phase2Waypoint: 3, phase2Art: 'mine-deck' }),

      addExplorationPlatform({ id: 'phase2-salsa-pipe-rise', x: 12540, y: 132, w: 180, style: 'awning', phase2Discovery: 'salsa-silo', phase2Waypoint: 1, phase2Art: 'salsa-pipe' }),
      addExplorationPlatform({ id: 'phase2-salsa-valve', x: 12810, y: 66, w: 175, style: 'awning', moving: true, axis: 'x', range: 16, speed: 1.04, phase: 1.4, phase2Discovery: 'salsa-silo', phase2Waypoint: 2, phase2Art: 'salsa-valve' }),
      addExplorationPlatform({ id: 'phase2-salsa-catwalk-a', x: 13100, y: 116, w: 185, style: 'awning', phase2Discovery: 'salsa-silo', phase2Waypoint: 3, phase2Art: 'salsa-catwalk' }),
      addExplorationPlatform({ id: 'phase2-salsa-catwalk-b', x: 13390, y: 62, w: 170, style: 'awning', phase2Discovery: 'salsa-silo', phase2Waypoint: 4, phase2Art: 'salsa-catwalk' }),
      addExplorationPlatform({ id: 'phase2-salsa-silo-deck', x: 13620, y: 52, w: 250, style: 'awning', phase2Discovery: 'salsa-silo', phase2Waypoint: 5, phase2Art: 'salsa-deck' }),

      addExplorationPlatform({ id: 'phase2-wanted-ladder', x: 18410, y: 144, w: 178, style: 'float', phase2Discovery: 'wanted-tower', phase2Waypoint: 1, phase2Art: 'wanted-ladder' }),
      addExplorationPlatform({ id: 'phase2-wanted-balcony', x: 18730, y: 72, w: 178, style: 'float', moving: true, axis: 'x', range: 14, speed: .88, phase: 2.1, phase2Discovery: 'wanted-tower', phase2Waypoint: 2, phase2Art: 'wanted-balcony' }),
      addExplorationPlatform({ id: 'phase2-wanted-tower-deck', x: 19140, y: 52, w: 250, style: 'neon-sign', phase2Discovery: 'wanted-tower', phase2Waypoint: 3, phase2Art: 'wanted-deck' }),
      addExplorationPlatform({ id: 'phase2-outlaw-clue', x: 19470, y: 96, w: 150, style: 'neon-sign', phase2Discovery: 'outlaw-stash', phase2Waypoint: 1, phase2Art: 'stash-clue', phase2Hidden: true }),
      addExplorationPlatform({ id: 'phase2-outlaw-stash', x: 19640, y: 18, w: 230, style: 'neon-sign', phase2Discovery: 'outlaw-stash', phase2Waypoint: 2, phase2Art: 'outlaw-stash', phase2Hidden: true }),

      addExplorationPlatform({ id: 'phase2-lookout-ridge', x: 23470, y: 150, w: 178, style: 'neon-sign', phase2Discovery: 'guac-lookout', phase2Waypoint: 1, phase2Art: 'lookout-ridge' }),
      addExplorationPlatform({ id: 'phase2-lookout-signal', x: 23740, y: 78, w: 172, style: 'neon-sign', moving: true, axis: 'y', range: 12, speed: .9, phase: 2.7, phase2Discovery: 'guac-lookout', phase2Waypoint: 2, phase2Art: 'lookout-signal' }),
      addExplorationPlatform({ id: 'phase2-guac-lookout-deck', x: 23920, y: 56, w: 250, style: 'neon-sign', phase2Discovery: 'guac-lookout', phase2Waypoint: 3, phase2Art: 'lookout-deck' }),
      addExplorationPlatform({ id: 'phase2-lookout-descent', x: 24180, y: 190, w: 140, style: 'neon-sign', phase2Pilot: true, phase2Discovery: 'guac-lookout', phase2Waypoint: 3, phase2Art: 'lookout-descent' }),
    ];
    const firstWaypoints = Object.fromEntries(authored.filter((platform) => platform.phase2Waypoint === 1 && platform.phase2Discovery !== outlawStashPlan.id).map((platform) => [platform.phase2Discovery, platform]));
    const entryRises = Object.fromEntries(Object.entries(bases).map(([id, platform]) => [id, platform && firstWaypoints[id] ? Math.round(platform.y - firstWaypoints[id].y) : null]));
    showdownExplorationGeometryAudit = {
      bases: Object.fromEntries(Object.entries(bases).map(([id, platform]) => [id, platform ? { id: platform.id, x: Math.round(platform.x), y: Math.round(platform.y), w: platform.w } : null])),
      platforms: authored.map((platform) => ({ id: platform.id, x: platform.baseX ?? platform.x, y: platform.baseY ?? platform.y, w: platform.w, moving: Boolean(platform.moving), discovery: platform.phase2Discovery, waypoint: platform.phase2Waypoint })),
      highestPlatformY: Math.min(...authored.map((platform) => platform.y - (platform.moving && platform.axis === 'y' ? platform.range : 0))),
      entryRises,
      allEntriesRequireSuper: Object.values(entryRises).every((rise) => Number.isFinite(rise) && rise > heroPhysics.normalJumpRise + 1),
      groundFallbackOpen: true,
      maximumAuthoredX: Math.max(...authored.map((platform) => platform.x + platform.w)),
      bossBuffer: BOSS_ARENA_LEFT - Math.max(...authored.map((platform) => platform.x + platform.w)),
    };
  }

  function addShowdownExplorationTacoTrails() {
    const addTaggedArc = (x, y, count, gap, height, discovery, lane, concealedClue = false) => {
      for (let index = 0; index < count; index += 1) {
        const t = count <= 1 ? 0 : index / (count - 1);
        addItem(x + index * gap, y - Math.sin(t * Math.PI) * height, 'taco', {
          bob: t * 2.2, phase2Pilot: true, phase2Discovery: discovery, lane, concealedClue,
        });
      }
    };
    addTaggedArc(3940, 318, 8, 46, 112, 'pepper-mine-lift', 'phase2-pepper-mine-trail');
    addTaggedArc(4230, 170, 9, 45, 74, 'pepper-mine-lift', 'phase2-pepper-mine-trail');
    addTaggedArc(12420, 318, 10, 47, 116, 'salsa-silo', 'phase2-salsa-silo-trail');
    addTaggedArc(12830, 162, 12, 46, 74, 'salsa-silo', 'phase2-salsa-silo-trail');
    addTaggedArc(18260, 310, 9, 48, 112, 'wanted-tower', 'phase2-wanted-tower-trail');
    addTaggedArc(18610, 172, 10, 46, 72, 'wanted-tower', 'phase2-wanted-tower-trail');
    addTaggedArc(19410, 104, 7, 44, 56, 'outlaw-stash', 'phase2-outlaw-stash-clue', true);
    addTaggedArc(23280, 318, 8, 46, 112, 'guac-lookout', 'phase2-guac-lookout-trail');
    addTaggedArc(23560, 182, 8, 45, 68, 'guac-lookout', 'phase2-guac-lookout-trail');
  }

  function carveGroundRange(start, end) {
    const carved = [];
    for (const platform of world.platforms) {
      const platformEnd = platform.x + platform.w;
      if (!platform.ground || platformEnd <= start || platform.x >= end) {
        carved.push(platform);
        continue;
      }
      if (platform.x < start) carved.push({ ...platform, w: start - platform.x });
      if (platformEnd > end) carved.push({ ...platform, x: end, w: platformEnd - end });
    }
    world.platforms = carved;
  }

  function removeUpperBridgeClutter() {
    const bridges = world.platforms.filter((platform) => platform.mainRoute && !platform.ground);
    world.platforms = world.platforms.filter((platform) => {
      if (platform.ground || platform.mainRoute || platform.secret) return true;
      return !bridges.some((bridge) => {
        const platformRange = platform.moving && platform.axis === 'x' ? platform.range : 0;
        const bridgeRange = bridge.moving && bridge.axis === 'x' ? bridge.range : 0;
        const horizontalOverlap = platform.x - platformRange < bridge.x + bridge.w + bridgeRange
          && platform.x + platform.w + platformRange > bridge.x - bridgeRange;
        const verticalRange = (platform.moving && platform.axis === 'y' ? platform.range : 0)
          + (bridge.moving && bridge.axis === 'y' ? bridge.range : 0);
        return horizontalOverlap && Math.abs(platform.y - bridge.y) < 42 + verticalRange;
      });
    });
  }

  function groundPlatformAt(x, margin = 60) {
    return world.platforms.find((platform) => platform.ground && x > platform.x + margin && x < platform.x + platform.w - margin);
  }

  function addEnemy(x, y, type, platform, extra = {}) {
    const hitbox = SHOWDOWN_ENEMY_HITBOXES[type];
    const [w, h] = hitbox ? [hitbox.w, hitbox.h] : type === 'boss' ? [132, 90] : [40, 40];
    const minX = platform ? Math.max(platform.x + 18, x - 125) : x - 24;
    const maxX = platform ? Math.min(platform.x + platform.w - w - 18, x + 125) : x + 24;
    const behaviorType = ({ slime: 'onion', knight: 'chili', jalapeno: 'jalapeno', guac: 'tomato', churro: 'onion', mole: 'onion' })[type] || 'tomato';
    const enemy = {
      x, y, baseY: y, w, h, type, platform, minX, maxX,
      behaviorType,
      dir: seeded() > 0.5 ? 1 : -1, speed: 42 + seeded() * 24,
      alive: true, defeated: false, defeatTimer: 0, clock: seeded() * 6, anim: seeded() * 2, previousY: y, hitCooldown: 0,
      ...extra,
    };
    if (!enemy.boss) heroCore.prepareEnemyBehavior(enemy, world.enemies.length, behaviorType);
    world.enemies.push(enemy);
  }

  function showdownPlatformInForbiddenCorridor(platform) {
    if (!platform) return true;
    const overlapsStampede = platform.x < STAMPEDE_CORRIDOR.end
      && platform.x + platform.w > STAMPEDE_CORRIDOR.start;
    return overlapsStampede || platform.x + platform.w / 2 >= BOSS_ARENA_LEFT;
  }

  function findShowdownGroundSupport(anchorX) {
    const candidates = world.platforms
      .filter((platform) => platform.ground && platform.mainRoute && !platform.checkpointPad && !platform.arena)
      .filter((platform) => !platform.victoryRoad && !showdownPlatformInForbiddenCorridor(platform))
      .filter((platform) => platform.x < BOSS_ARENA_LEFT && platform.x + platform.w > 0);
    return candidates.find((platform) => anchorX >= platform.x + 74 && anchorX <= platform.x + platform.w - 74)
      || candidates
        .slice()
        .sort((a, b) => Math.abs(a.x + a.w / 2 - anchorX) - Math.abs(b.x + b.w / 2 - anchorX))[0]
      || null;
  }

  function findShowdownUpperSupport(anchorX) {
    return world.platforms
      .filter((platform) => !platform.ground && !platform.secret && !platform.manualAccess && platform.enemySupport !== false)
      .filter((platform) => platform.x < BOSS_ARENA_LEFT && platform.x + platform.w > 0)
      .filter((platform) => !showdownPlatformInForbiddenCorridor(platform))
      .sort((a, b) => Math.abs(a.x + a.w / 2 - anchorX) - Math.abs(b.x + b.w / 2 - anchorX))[0] || null;
  }

  function createShowdownPatrolZone(platform, encounter, occurrence, totalOccurrences) {
    const zoneWidth = Math.min(430, Math.max(280, Math.floor((platform.w - 32) / Math.max(1, totalOccurrences) - 24)));
    const minX = platform.x + 16;
    const maxX = platform.x + platform.w - zoneWidth - 16;
    return {
      ...platform,
      id: `${platform.id}-patrol-zone-${occurrence + 1}`,
      x: clamp(encounter.anchorX - zoneWidth / 2, minX, Math.max(minX, maxX)),
      w: zoneWidth,
      virtualPatrolZone: true,
      patrolZoneOccurrence: occurrence + 1,
      patrolZoneTotal: totalOccurrences,
      physicalSupportPlatformId: platform.id,
    };
  }

  function addShowdownFormation(definition, platform) {
    if (!platform) return [];
    const hitbox = SHOWDOWN_ENEMY_HITBOXES[definition.type] || { w: 42, h: 42 };
    const requestedCount = Math.max(1, Math.floor(Number(definition.count) || 1));
    // Packs belong on the ground or on a genuinely broad upper platform. A
    // narrow ledge gets one readable target so the player can land cleanly.
    const groupingAllowed = Boolean(platform.ground) || platform.w >= 220;
    const count = groupingAllowed ? requestedCount : 1;
    const spacing = count > 1
      ? Math.max(hitbox.w + 14, Number(definition.spacing) || hitbox.w + 20)
      : hitbox.w + 16;
    const formationWidth = hitbox.w + (count - 1) * spacing;
    const leftEdge = platform.x + 18;
    const rightEdge = platform.x + platform.w - formationWidth - 18;
    const requestedOffset = Number.isFinite(definition.offset)
      ? definition.offset
      : Math.max(0, (platform.w - formationWidth) / 2);
    const startX = clamp(platform.x + requestedOffset, leftEdge, Math.max(leftEdge, rightEdge));
    const behaviorType = ({ guac: 'tomato', churro: 'onion', mole: 'onion' })[definition.type] || definition.type;
    const enemies = heroCore.createEnemyFormation({
      id: definition.id,
      type: definition.type,
      startX,
      y: platform.y - hitbox.h,
      w: hitbox.w,
      h: hitbox.h,
      count,
      spacing,
      speed: definition.speed ?? (definition.role === 'moving-guard' ? 48 : definition.role === 'champion' ? 42 : 38),
      patrolPadding: definition.localPatrol ? 0 : 16,
      patrolStartOffset: definition.localPatrol ? 18 : undefined,
      role: definition.role || (platform.ground ? 'ground-patrol' : 'platform-sentry'),
      roleExplicit: true,
      platform,
      platformId: platform.id,
      supportPlatformId: definition.physicalSupportPlatformId || platform.id,
      showdownEncounter: definition.id,
      showdownSection: definition.section,
      showdownPurpose: definition.purpose,
      bounceHelper: definition.role === 'route-helper',
      routeHelper: definition.role === 'route-helper',
      champion: definition.role === 'champion',
      localPatrol: Boolean(definition.localPatrol),
      targetPlatform: definition.targetPlatform || null,
      targetPlatformId: definition.targetPlatform?.id || definition.targetPlatformId || null,
      formationRule: groupingAllowed ? 'ground-or-large-platform' : 'single-narrow-platform',
      formationPurpose: definition.purpose,
      ...(Number.isFinite(definition.minX) ? { minX: definition.minX } : {}),
      ...(Number.isFinite(definition.maxX) ? { maxX: definition.maxX } : {}),
    });
    enemies.forEach((enemy, index) => {
      enemy.behaviorType = behaviorType;
      enemy.clock = ((world.enemies.length + index) * .23) % 3.2;
      enemy.anim = (index * .21) % 1;
      enemy.dir = definition.direction || (index % 2 === 0 ? 1 : -1);
      enemy.previousY = enemy.y;
      enemy.physicalSupportPlatformId = definition.physicalSupportPlatformId || platform.id;
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length + index, behaviorType);
      world.enemies.push(enemy);
    });
    return enemies;
  }

  function lowerShowdownPlatformToNormalJump(platform) {
    if (!platform || platform.ground || platform.secret || platform.manualAccess) return false;
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
      enemy.groundY = platform.y;
    });
    platform.normalJumpAccessible = true;
    return true;
  }

  function addShowdownRouteHelper(platform, index) {
    if (!platform || showdownPlatformInForbiddenCorridor(platform)) return null;
    const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
    const requiredRise = GROUND_Y - (platform.y - verticalRange);
    if (requiredRise <= heroPhysics.normalJumpRise + 1) return null;
    if (requiredRise > heroPhysics.enemyBounceRise + 1) {
      lowerShowdownPlatformToNormalJump(platform);
      return null;
    }
    const support = findShowdownGroundSupport(platform.x + platform.w / 2);
    if (!support) {
      lowerShowdownPlatformToNormalJump(platform);
      return null;
    }
    const candidates = [
      clamp(platform.x + platform.w / 2, support.x + 62, support.x + support.w - 104),
      support.x + 84,
      support.x + support.w - 122,
    ];
    const helperX = candidates.find((candidate) => (
      !world.enemies.some((enemy) => !enemy.routeHelper && enemy.alive && Math.abs(enemy.x - candidate) < 150)
    ));
    if (!Number.isFinite(helperX)) {
      lowerShowdownPlatformToNormalJump(platform);
      return null;
    }
    const routeId = platform.id;
    const helper = addShowdownFormation({
      id: `showdown-route-helper-${index}`,
      type: index % 2 ? 'churro' : 'jalapeno',
      count: 1,
      offset: helperX - support.x,
      role: 'route-helper',
      section: 'bounce-route',
      purpose: 'Provide a forgiving launch under the elevated showdown route.',
      localPatrol: true,
      minX: helperX - 58,
      maxX: helperX + 58,
      targetPlatform: platform,
      targetPlatformId: routeId,
      physicalSupportPlatformId: support.id,
    }, support)[0];
    if (helper) {
      helper.routeHelper = true;
      helper.targetPlatform = platform;
      helper.targetPlatformId = routeId;
    }
    return helper || null;
  }

  function auditShowdownFormations() {
    const grouped = new Map();
    world.enemies.forEach((enemy) => {
      if (!enemy.groupId || enemy.groupSize <= 1 || enemy.boss) return;
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
    const stampedeEnemies = world.enemies.filter((enemy) => !enemy.boss && enemy.x >= STAMPEDE_CORRIDOR.start && enemy.x <= STAMPEDE_CORRIDOR.end).length;
    const victoryDashEnemies = world.enemies.filter((enemy) => enemy.x >= sections[5].start).length;
    const arenaEnemies = world.enemies.filter((enemy) => !enemy.boss && enemy.x >= BOSS_ARENA_LEFT && enemy.x <= BOSS_ARENA_RIGHT).length;
    game.showdownFormationOverlapCount = overlapPairs.length;
    game.showdownFormationOverlapPairs = overlapPairs;
    game.showdownMixedTypeGroups = mixedTypeGroups;
    game.showdownNarrowPlatformGroups = narrowPlatformGroups;
    game.showdownForbiddenEnemyCounts = { stampede: stampedeEnemies, victoryDash: victoryDashEnemies, arena: arenaEnemies };
    game.showdownFormationRules = {
      groupedGroundOrLargeOnly: narrowPlatformGroups.length === 0,
      sameTypeGroups: mixedTypeGroups.length === 0,
      minimumGap: 12,
      noOverlap: overlapPairs.length === 0,
    };
  }

  function applyShowdownRemaster() {
    // The authored layer owns ordinary combat up to the boss arena. The
    // stampede, locked arena, victory dash, and fiesta remain set pieces.
    world.enemies = [];
    const authored = { ground: [], upper: [], routeHelpers: [], skipped: [] };
    const groundSupportCounts = new Map();
    const groundAssignments = SHOWDOWN_GROUND_PLAN.map((encounter) => ({ encounter, platform: findShowdownGroundSupport(encounter.anchorX) }));
    groundAssignments.forEach(({ platform }) => {
      if (platform) groundSupportCounts.set(platform.id, (groundSupportCounts.get(platform.id) || 0) + 1);
    });
    const supportOccurrences = new Map();
    SHOWDOWN_GROUND_PLAN.forEach((encounter) => {
      const platform = findShowdownGroundSupport(encounter.anchorX);
      if (!platform) { authored.skipped.push(encounter.id); return; }
      const occurrence = supportOccurrences.get(platform.id) || 0;
      const totalOccurrences = groundSupportCounts.get(platform.id) || 1;
      supportOccurrences.set(platform.id, occurrence + 1);
      const patrolPlatform = totalOccurrences > 1 && !platform.moving
        ? createShowdownPatrolZone(platform, encounter, occurrence, totalOccurrences)
        : platform;
      const formation = addShowdownFormation({
        ...encounter,
        offset: totalOccurrences > 1 ? Math.max(18, (patrolPlatform.w - 48) / 2) : undefined,
        physicalSupportPlatformId: platform.id,
      }, patrolPlatform);
      if (formation.length) authored.ground.push(encounter.id);
    });

    const usedUpperSupports = new Set();
    SHOWDOWN_UPPER_PLAN.forEach((encounter) => {
      const platform = findShowdownUpperSupport(encounter.anchorX);
      if (!platform || usedUpperSupports.has(platform.id)) { authored.skipped.push(encounter.id); return; }
      usedUpperSupports.add(platform.id);
      platform.routeId = platform.id;
      const formation = addShowdownFormation(encounter, platform);
      if (formation.length) authored.upper.push(encounter.id);
      const helper = addShowdownRouteHelper(platform, authored.routeHelpers.length + 1);
      if (helper) authored.routeHelpers.push(helper.showdownEncounter);
    });

    // Any tall optional ledge that was not selected for the authored bounce
    // route is lowered into the shared normal-jump envelope. This prevents a
    // deleted fallback enemy from silently becoming the only way up.
    world.platforms
      .filter((platform) => !platform.ground && !platform.secret && platform.x < BOSS_ARENA_LEFT)
      .forEach((platform) => {
        const hasHelper = world.enemies.some((enemy) => enemy.targetPlatform === platform || enemy.targetPlatformId === platform.id);
        if (!hasHelper) lowerShowdownPlatformToNormalJump(platform);
      });

    // The golden sombrero remains an optional discovery route, but its chain
    // uses one enemy per step rather than a crowded group on a narrow ledge.
    const sombreroPlatform = world.platforms.find((platform) => platform.secretSombrero);
    if (sombreroPlatform) {
      for (let step = 0; step < 7; step += 1) {
        const x = 21010 + step * 105;
        const y = 350 - step * 32;
        addEnemy(x, y, step % 2 ? 'churro' : 'jalapeno', null, {
          chainTarget: true, goldenRoute: true, routeHelper: true, role: 'route-helper',
          targetPlatform: sombreroPlatform, targetPlatformId: sombreroPlatform.id,
          speed: 0, minX: x, maxX: x, dir: 1, clock: 4 + step * 0.45,
        });
      }
    }

    world.enemies = world.enemies.filter((enemy) => (
      enemy.x < BOSS_ARENA_LEFT
      && !(enemy.x >= STAMPEDE_CORRIDOR.start && enemy.x <= STAMPEDE_CORRIDOR.end)
      && enemy.x < sections[5].start
    ));
    game.platformEnemyStats = heroCore.attachEnemiesToPlatforms(world.enemies, world.platforms, { surfaceTolerance: 34, edgePadding: 14 });
    const patrolTargets = world.enemies.filter((enemy) => !enemy.localPatrol && !enemy.goldenRoute && enemy.platform);
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
    auditShowdownFormations();
    game.showdownRemaster = {
      version: 'world-1-3-pilot-v1',
      combatSectionsEnd: SHOWDOWN_COMBAT_END,
      combatEnd: BOSS_ARENA_LEFT,
      authoredGroundEncounters: authored.ground.length,
      authoredUpperEncounters: authored.upper.length,
      authoredRouteHelpers: authored.routeHelpers.length,
      skippedEncounterIds: authored.skipped,
      groupedEnemies: world.enemies.filter((enemy) => enemy.groupSize > 1).length,
      enemyGroups: [...new Set(world.enemies.filter((enemy) => enemy.groupSize > 1).map((enemy) => enemy.groupId))],
      enemyFreeStampede: game.showdownForbiddenEnemyCounts.stampede === 0,
      enemyFreeVictoryDash: game.showdownForbiddenEnemyCounts.victoryDash === 0,
      enemyFreeBossArena: game.showdownForbiddenEnemyCounts.arena === 0,
      routeDiscoveryOnly: true,
      groupingRule: 'ground-or-large-platform',
      patrolCoverage: 'full-usable-platform-with-separated-pack-lanes',
      logicalGroundPatrolZones: [...new Set(world.enemies.filter((enemy) => enemy.platform?.virtualPatrolZone).map((enemy) => enemy.platform.id))].length,
      upperRoutePlatforms: [...usedUpperSupports],
    };
  }

  function buildWorld() {
    randomSeed = 0x5A15A12;
    world.platforms = [];
    world.collectibles = [];
    world.enemies = [];
    world.villagers = [];
    world.checkpoints = heroCore.createCheckpointSet(checkpointDefs, {
      defaults: { y: 326, w: 210, h: 134 },
    });

    addGroundSection(sections[0], 'sunset-dirt', [760, 640, 820, 700], [82, 112, 126, 94]);
    addGroundSection(sections[1], 'canyon-dirt', [660, 780, 610, 850], [96, 128, 104, 120]);
    addGroundSection(sections[2], 'market-dirt', [620, 760, 680, 860], [90, 122, 106, 132]);
    addGroundSection(sections[3], 'parade-road', [690, 580, 820, 720], [118, 132, 104, 126]);
    addGroundSection(sections[4], 'midnight-dirt', [760, 640, 880, 690], [92, 120, 108, 128]);
    addPlatform({
      x: sections[5].start, y: GROUND_Y, w: sections[5].end - sections[5].start, h: 100,
      style: 'neon-road', ground: true, mainRoute: true, finaleRoad: true, victoryRoad: true,
    });
    addPlatform({
      x: sections[6].start, y: GROUND_Y, w: WORLD_WIDTH - sections[6].start, h: 100,
      style: 'fiesta-road', ground: true, mainRoute: true, finaleRoad: true, victoryRoad: true,
    });

    addUpperRoute(sections[0], 'mesa', 360, 520);
    addUpperRoute(sections[1], 'canyon-sign', 330, 535);
    addUpperRoute(sections[2], 'awning', 300, 500);
    addUpperRoute(sections[4], 'neon-sign', 360, 540);

    // Parade Float Panic has one deliberate route, not two overlapping sets.
    for (let x = 18120, index = 0; x < 22500; x += 540, index += 1) {
      addPlatform({
        x, y: [336, 292, 276, 326][index % 4], w: 230, h: 30, style: 'float', moving: true,
        axis: index % 2 ? 'y' : 'x', range: 28 + index % 3 * 5,
        speed: 1.2 + index * 0.035, phase: index * 0.72,
      });
    }
    removeUpperBridgeClutter();

    // Replace, rather than overlay, ordinary ground with the showdown stage.
    carveGroundRange(24800, 28800);
    addPlatform({ x: 24800, y: 412, w: 4000, h: 128, style: 'showdown-stage', ground: true, mainRoute: true, arena: true });
    // Keep the boss arena visually and mechanically singular. Upper-route
    // platforms generated for the preceding midnight section used to remain
    // over the arena after their bounce-helper enemies were intentionally
    // removed, creating three unreachable decorations.
    world.platforms = world.platforms.filter((platform) => (
      platform.ground
      || platform.x + platform.w <= BOSS_ARENA_LEFT
      || platform.x >= BOSS_ARENA_RIGHT
    ));

    world.checkpoints.forEach((checkpoint) => {
      const style = currentSection(checkpoint.x).id === 'party' ? 'neon-road' : currentSection(checkpoint.x).id === 'mercado' ? 'market-dirt' : currentSection(checkpoint.x).id === 'parade' ? 'parade-road' : currentSection(checkpoint.x).id === 'boss' ? 'midnight-dirt' : 'sunset-dirt';
      const footprintLeft = checkpoint.x - 18;
      const footprintRight = checkpoint.x + 258;
      let support = world.platforms.find((platform) => (
        platform.ground && footprintLeft >= platform.x && footprintRight <= platform.x + platform.w
      ));
      if (!support) {
        support = addPlatform({
          x: checkpoint.x - 62, y: GROUND_Y, w: 364, h: 100,
          style, ground: true, mainRoute: true, checkpointPad: true, checkpointFoundation: true,
        });
      }
      checkpoint.support = support;
      checkpoint.grounded = true;
    });

    // The final hot sauce is a pre-showdown reward rather than an unreachable
    // object suspended over the locked boss floor.
    const sauceSpots = [3860, 9450, 14520, 20780, 23520, 24320];
    sauceSpots.forEach((x, index) => {
      addPlatform({ x: x - 68, y: 176 + (index % 2) * 26, w: 168, h: 22, style: index > 3 ? 'neon-sign' : index > 1 ? 'awning' : 'mesa', secret: true });
      addItem(x, 132 + (index % 2) * 26, 'hotSauce');
    });

    addPlatform({ x: 21740, y: 150, w: 190, h: 24, style: 'neon-sign', secret: true, secretSombrero: true, manualAccess: true });
    addItem(21820, 98, 'sombrero', { rareReward: true });

    // Core abilities carry into every later stage. Magnets sit on safe,
    // readable detours while Taco Power fills naturally from play.
    [1780, 6760, 12180, 18480, 23980, 29380].forEach((x) => {
      const support = groundPlatformAt(x, 28);
      addItem(x, support ? support.y - 58 : 382, 'magnet', { coreAbility: true });
    });

    // Collectible trails are tied to actual landing surfaces.
    for (const platform of world.platforms) {
      if (platform.checkpointPad || platform.arena || platform.secret) continue;
      const count = Math.max(2, Math.floor((platform.w - 50) / (platform.ground ? 52 : 44)));
      const gap = platform.ground ? 52 : 44;
      addLine(platform.x + 28, platform.y - 45, count, gap);
      if (platform.moving) {
        const recent = world.collectibles.slice(-count);
        recent.forEach((item) => {
          item.ridePlatform = platform;
          item.rideOffsetX = item.x - platform.x;
          item.rideOffsetY = item.y - platform.y;
        });
      }
    }

    const ground = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    for (let index = 0; index < ground.length - 1; index += 1) {
      const from = ground[index];
      const to = ground[index + 1];
      const gap = to.x - (from.x + from.w);
      if (gap > 20 && gap <= 175) addArc(from.x + from.w - 30, GROUND_Y - 48, 6, (gap + 64) / 5, 68);
    }
    world.checkpoints.forEach((checkpoint) => addArc(checkpoint.x - 120, 408, 9, 30, 54));
    sections.slice(0, 5).forEach((section, sectionIndex) => {
      for (let x = section.start + 840 + sectionIndex * 45; x < section.end - 420; x += 1280) {
        addArc(x, 405, 6, 38, 48 + sectionIndex % 2 * 12);
      }
    });

    // The post-boss dash is a pressure-free reward lane: abundant taco arcs,
    // cheering villagers, funny signs, and absolutely no enemies or pits.
    for (let x = 29100, group = 0; x < 33700; x += 440, group += 1) {
      addArc(x, 392 - group % 2 * 18, 9, 38, 62 + group % 3 * 12);
    }
    const victorySigns = [
      'EL GUACODILLO GOT COOKED', 'HIS EGO NEEDS A CHECKPOINT', '3 STOMPS. ZERO EXCUSES.',
      'THANK YOU, TACO HERO!', 'SOMBRERO STATUS: CROOKED', 'LOCAL AVOCADOS FEEL SAFER',
      'WE BELIEVED IN CRUNCH', 'GUACODILLO? NEVER HEARD OF HIM', 'FIESTA THIS WAY →',
      'THAT BOSS WAS EXTRA', 'THE HAT LOST 3–0', 'CRUNCH JUSTICE SERVED',
      'NO GUAC, ALL GLORY', 'VILLAGE SAVED. TACOS READY.',
    ];
    for (let x = 29180, index = 0; x < 33680; x += 340, index += 1) {
      world.villagers.push({
        x, side: index % 2 ? 'back' : 'front', color: ['#ff6fae', '#65d8ff', '#ffd65a', '#8dff9c', '#b78cff'][index % 5],
        sign: victorySigns[index], phase: index * 0.73, sprite: index,
      });
    }

    applyShowdownRemaster();
    // Phase 2 is authored after the combat remaster so its optional Super-only
    // surfaces never become enemy supports or alter the existing normal route.
    buildShowdownExplorationGeometry();
    addShowdownExplorationTacoTrails();

    addEnemy(26520, 322, 'boss', world.platforms.find((platform) => platform.arena), {
      boss: true, speed: 82, minX: 25300, maxX: 28200, dir: -1, chargeWindup: 0, chargeTimer: 0,
      state: 'dormant', airStrikeTimer: 0, airStrikeShotTimer: 0, shotsRemaining: 0,
    });

    // Hard safety invariants: El Guacodillo is the only enemy allowed inside
    // the showdown arena, and the entire victory dash remains combat-free.
    world.enemies = world.enemies.filter((enemy) => (
      enemy.boss || (enemy.x < BOSS_ARENA_LEFT && enemy.x < sections[5].start)
    ));

    world.platforms.sort((a, b) => a.x - b.x);
    const elevatedPlatforms = world.platforms.filter((platform) => !platform.ground && !platform.secret && !platform.phase2Pilot);
    elevatedPlatforms.forEach((platform) => {
      const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
      platform.accessMode = GROUND_Y - (platform.y - verticalRange) <= heroPhysics.normalJumpRise + 1 ? 'jump' : 'enemy-bounce';
    });
    const mainRoute = world.platforms.filter((platform) => platform.mainRoute).sort((a, b) => a.x - b.x);
    let coveredTo = 0;
    let maximumGap = 0;
    for (const platform of mainRoute) {
      maximumGap = Math.max(maximumGap, platform.x - coveredTo);
      coveredTo = Math.max(coveredTo, platform.x + platform.w);
    }
    game.routeMaxGap = Math.round(maximumGap);
    game.totalCollectibles = world.collectibles.filter((item) => !item.bonusReward && item.type === 'taco').length;
    game.totalHotSauce = world.collectibles.filter((item) => item.type === 'hotSauce').length;
    game.totalEnemies = world.enemies.length;
    game.platformAccess = {
      total: elevatedPlatforms.length,
      jump: elevatedPlatforms.filter((platform) => platform.accessMode === 'jump').length,
      enemyBounce: elevatedPlatforms.filter((platform) => platform.accessMode === 'enemy-bounce').length,
      uncovered: elevatedPlatforms.filter((platform) => platform.accessMode === 'enemy-bounce'
        && !world.enemies.some((enemy) => enemy.targetPlatform === platform
          || enemy.targetPlatformId === platform.id
          || enemy.targetPlatformId === platform.routeId
          || enemy.targetPlatforms?.includes(platform.id)
          || enemy.targetPlatforms?.includes(platform.routeId))).length,
    };
    const elevated = world.platforms.filter((platform) => !platform.ground && !platform.secret && !platform.phase2Pilot);
    game.platformOverlapPairs = [];
    elevated.forEach((platform, index) => elevated.slice(index + 1).forEach((other) => {
      const horizontalRange = (value) => value.moving && value.axis === 'x' ? value.range : 0;
      const verticalRange = (value) => value.moving && value.axis === 'y' ? value.range : 0;
      const horizontalOverlap = platform.x - horizontalRange(platform) < other.x + other.w + horizontalRange(other)
        && platform.x + platform.w + horizontalRange(platform) > other.x - horizontalRange(other);
      const verticalDistance = Math.abs(platform.y - other.y);
      if (horizontalOverlap && verticalDistance < 42 + verticalRange(platform) + verticalRange(other)) {
        game.platformOverlapPairs.push(`${platform.style}@${Math.round(platform.x)}:${Math.round(platform.y)}|${other.style}@${Math.round(other.x)}:${Math.round(other.y)}`);
      }
    }));
    game.platformOverlapCount = game.platformOverlapPairs.length;
    game.checkpointsGrounded = world.checkpoints.filter((checkpoint) => (
      checkpoint.grounded && checkpoint.support && checkpoint.support.y === GROUND_Y
    )).length;
  }

  function loadProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      const showdown = JSON.parse(localStorage.getItem('jumpinForTacosLevel13ProgressV1') || localStorage.getItem('jumpinForTacosLevel12ProgressV1') || '{}');
      if (shared.settings) {
        game.musicVolume = clamp(Number(shared.settings.musicVolume ?? 0.7), 0, 1);
        game.effectsVolume = clamp(Number(shared.settings.effectsVolume ?? 0.8), 0, 1);
        game.reducedShake = Boolean(shared.settings.reducedShake);
        game.muted = Boolean(shared.settings.muted);
      }
      if (showdown.personalBest) game.personalBest = { ...game.personalBest, ...showdown.personalBest };
    } catch {
      // Browser storage is optional.
    }
  }

  function saveProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      shared.settings = { musicVolume: game.musicVolume, effectsVolume: game.effectsVolume, reducedShake: game.reducedShake, muted: game.muted };
      localStorage.setItem('jumpinForTacosProgressV2', JSON.stringify(shared));
      localStorage.setItem('jumpinForTacosLevel13ProgressV1', JSON.stringify({ personalBest: game.personalBest }));
    } catch {
      // Browser storage is optional.
    }
  }

  function syncAudioSettings() {
    audio?.setMusicVolume(game.musicVolume);
    audio?.setEffectsVolume(game.effectsVolume);
    audio?.setMuted(game.muted);
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

  function stopLevelAudioLoops() {
    if (game.stampedeLoop) audio?.stopLoop(game.stampedeLoop);
    game.stampedeLoop = null;
  }

  function updatePersonalBest() {
    const best = game.personalBest;
    ui.personalBestText.textContent = best.runs
      ? `Showdown best: ${best.score.toLocaleString()} points • ${formatTime(best.time)} • ${best.medal}`
      : 'Your first showdown sets the record!';
  }

  function syncSettings() {
    ui.musicVolume.value = String(Math.round(game.musicVolume * 100));
    ui.effectsVolume.value = String(Math.round(game.effectsVolume * 100));
    ui.musicVolumeValue.textContent = `${ui.musicVolume.value}%`;
    ui.effectsVolumeValue.textContent = `${ui.effectsVolume.value}%`;
    ui.reducedShake.checked = game.reducedShake;
    ui.muteBtn.textContent = game.muted ? '🔇 Sound Off' : '🔊 Sound On';
    allTracks.forEach((track) => { track.muted = game.muted; });
    syncAudioSettings();
  }

  function resetGame() {
    stopLevelAudioLoops();
    buildWorld();
    Object.assign(game, {
      state: 'title', score: 0, collected: 0, hotSauce: 0, hearts: 3,
      cameraX: 0, levelTime: 0, startTime: 0, finishTime: 0, sectionIndex: 0,
      latestCheckpoint: null, message: '', messageTimer: 0,
      chainCount: 0, chainTimer: 0, bestChain: 0, defeated: 0,
      perfectStomps: 0, goldenSombrero: false, fiestaPower: 0, chainTrailTimer: 0,
      radioQueue: '', radioDelay: 0,
      abilities: sharedAbilities.createState(), limeShield: false, activePower: null,
      showdownExploration: createShowdownExplorationState(),
      stampede: { active: false, done: false, x: 0, speed: 0, nearMissArmed: false, nearMisses: 0, reactionTimer: 0, reactionIndex: -1 },
      bossActive: false, bossHits: previewBossHits, bossDefeated: previewBossHits >= 3,
      bossAttackCooldown: 2.2, bossAttackIndex: 0, bossHazards: [], bossIntroTimer: 0, gateUnlockTimer: 0,
      bossState: previewBossHits >= 3 ? 'defeated' : 'dormant', bossVulnerableTimer: 0, bossStunTimer: 0,
      bossAirTimer: 0, bossShotTimer: 0, bossShotsRemaining: 0,
      bossDodges: 0, bossFinalFocus: 0, bossPhaseBanner: 0, bossPhaseTitle: '', bossKO: null,
      bossCelebrationLock: 0,
      speedPads: [], springPads: [], particles: [], confetti: [], fireworks: [], impactTexts: [], bossShockwaves: [],
      cameraShake: 0, hitStop: 0, celebrationTime: 0, partyBeat: -1,
      settingsOpen: false, respawn: heroCore.createRespawnState(),
      activeMusic: null, musicTransition: null,
      musicTransitionCount: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
      respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null, fallSoundPlayed: false,
      stampedeLoop: null,
    });
    const previewEntry = showdownExplorationPlan.find((entry) => entry.id === previewPhase2Ready);
    const phase2Start = previewPhase2Ready === outlawStashPlan.id
      ? outlawStashPlan.routeRange[0] - 80
      : previewEntry ? previewEntry.routeRange[0] - 80 : 0;
    const startX = clamp(previewStart || phase2Start || 140, 0, WORLD_WIDTH - 200);
    Object.assign(player, { x: startX, y: previewStartY, previousY: previewStartY, previousBottom: previewStartY + player.h, vx: 0, vy: 0, dir: 1, grounded: false, platform: null, anim: 0, invulnerable: 0, coyote: 0, jumpBuffer: 0, rotation: 0, scale: 1 });
    game.cameraX = clamp(startX - canvas.width * 0.42, 0, WORLD_WIDTH - canvas.width);
    if (game.bossDefeated) {
      const boss = world.enemies.find((enemy) => enemy.boss);
      if (boss) { boss.alive = false; boss.defeated = true; }
    }
    if (previewFrenzy) game.abilities.frenzyTimer = sharedAbilities.definitions.tacoFrenzy.duration;
    if ((previewSuper || previewPhase2Ready) && !previewForceNormal) {
      sharedAbilities.activateSuper(game.abilities, 'qa-preview', { silent: true });
      game.abilities.transformTimer = 0;
    }
    if (previewMagnet) sharedAbilities.activateMagnet(game.abilities);
    if (previewLimeShield) activateLimeShield('qa-preview', { silent: true });
    const readyEntry = showdownExplorationPlan.find((entry) => entry.id === previewPhase2Ready || entry.id === previewPhase2Complete);
    if (readyEntry) {
      const state = showdownExplorationEntryState(readyEntry);
      if (state) { state.revealed = true; state.progress = readyEntry.waypointCount; }
    }
    if (previewPhase2Ready === outlawStashPlan.id || previewPhase2Secret) {
      game.showdownExploration.secret.revealed = true;
      game.showdownExploration.secret.progress = outlawStashPlan.waypointCount;
    }
    stopMusic();
    ui.startOverlay.classList.remove('hidden');
    ui.startOverlay.classList.add('visible');
    ui.winOverlay.classList.add('hidden');
    ui.winOverlay.classList.remove('visible');
  }

  function silenceTrack(track, reset = true) {
    if (!track) return;
    track.pause();
    if (reset) track.currentTime = 0;
    track.volume = 0;
  }

  function alignTrackPosition(from, to) {
    if (!from || !to || !Number.isFinite(from.duration) || !Number.isFinite(to.duration) || from.duration <= 0 || to.duration <= 0) {
      to.currentTime = 0;
      return;
    }
    to.currentTime = ((from.currentTime % from.duration) / from.duration) * to.duration;
  }

  function startTrack(name, volume = 0, from = null) {
    const track = tracks[name];
    if (!track) return;
    allTracks.forEach((candidate) => { if (candidate !== track) silenceTrack(candidate); });
    track.muted = game.muted;
    track.volume = volume;
    alignTrackPosition(from, track);
    track.play().catch(() => {});
    game.activeMusic = name;
  }

  function setMusic(name, immediate = false) {
    if (!tracks[name]) return;
    if (immediate || !game.activeMusic) {
      startTrack(name, 1);
      game.musicTransition = null;
      return;
    }
    if (!game.musicTransition && game.activeMusic === name) return;
    if (game.musicTransition?.toName === name) return;

    // Retarget from the currently emerging arrangement and retire the
    // abandoned source immediately. Rapid section crossings therefore stay
    // at a strict two-track maximum with no silent gap between arrangements.
    const previousTransition = game.musicTransition;
    const fromName = previousTransition?.toName || game.activeMusic;
    const from = tracks[fromName];
    if (previousTransition?.from && previousTransition.from !== from) {
      silenceTrack(previousTransition.from);
      game.musicOverlapRecoveries += 1;
    }
    const next = tracks[name];
    allTracks.forEach((track) => {
      if (track !== from && track !== next && !track.paused) {
        silenceTrack(track);
        game.musicOverlapRecoveries += 1;
      }
    });
    next.muted = game.muted;
    next.volume = 0;
    alignTrackPosition(from, next);
    next.play().catch(() => {});
    game.musicTransition = {
      fromName, toName: name, from, to: next,
      elapsed: 0, duration: name === 'fiesta' ? 3.6 : 3.2,
      startVolume: Math.max(0.001, from?.volume || 1),
    };
    game.activeMusic = name;
    game.musicTransitionCount += 1;
  }

  function updateMusic(dt) {
    const transition = game.musicTransition;
    if (!transition) {
      Object.entries(tracks).forEach(([name, track]) => {
        if (name === game.activeMusic) track.volume = 1;
        else if (!track.paused) {
          silenceTrack(track);
          game.musicOverlapRecoveries += 1;
        }
      });
      game.maxMusicPlaying = Math.max(game.maxMusicPlaying, allTracks.filter((track) => !track.paused).length);
      return;
    }
    transition.elapsed += dt;
    const t = clamp(transition.elapsed / transition.duration, 0, 1);
    const angle = t * Math.PI * 0.5;
    transition.from.volume = Math.min(1, transition.startVolume) * Math.cos(angle);
    transition.to.volume = Math.sin(angle);
    allTracks.forEach((track) => {
      if (track !== transition.from && track !== transition.to && !track.paused) {
        silenceTrack(track);
        game.musicOverlapRecoveries += 1;
      }
    });
    game.maxMusicPlaying = Math.max(game.maxMusicPlaying, allTracks.filter((track) => !track.paused).length);
    if (t >= 1) {
      silenceTrack(transition.from);
      transition.to.volume = 1;
      game.musicTransition = null;
    }
  }

  function stopMusic() {
    allTracks.forEach((track) => { track.pause(); track.currentTime = 0; track.volume = 0; });
    game.activeMusic = null;
    game.musicTransition = null;
  }

  function showMessage(text, duration = 2) {
    game.message = text;
    game.messageTimer = duration;
  }

  function startGame() {
    unlockAudio();
    playAudio('ui.start');
    ui.startOverlay.classList.add('hidden');
    ui.startOverlay.classList.remove('visible');
    game.state = 'playing';
    game.startTime = performance.now();
    game.sectionIndex = Math.max(0, sections.findIndex((section) => player.x >= section.start && player.x < section.end));
    setMusic(sections[game.sectionIndex].music, true);
    showMessage('BUILD THE SPLAT CHAIN!', 2.2);
    if (previewAutoRun) keys.right = true;
    if (previewBossFinale && game.bossHits === 2) {
      window.setTimeout(() => {
        const boss = world.enemies.find((enemy) => enemy.boss && enemy.alive);
        if (boss) { boss.hitCooldown = 0; game.bossVulnerableTimer = 1; stompBoss(boss); }
      }, 650);
    }
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
    const setKey = (event, down) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(event.code)) event.preventDefault();
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = down;
      if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = down;
      if (event.code === 'ArrowUp' || event.code === 'Space' || event.code === 'KeyW') {
        if (down && !event.repeat) queueJump();
        keys.jump = down;
      }
    };
    window.addEventListener('keydown', (event) => setKey(event, true), { passive: false });
    window.addEventListener('keyup', (event) => setKey(event, false), { passive: false });
    document.querySelectorAll('[data-input]').forEach((button) => {
      const input = button.dataset.input;
      const down = (event) => { event.preventDefault(); if (input === 'jump') queueJump(); else keys[input] = true; };
      const up = (event) => { event.preventDefault(); keys[input] = false; };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('pointerleave', up);
    });
    window.JFT_LEVEL_START.bind(startGame);
    ui.restartBtn.addEventListener('click', () => { resetGame(); startGame(); });
    ui.playAgainBtn.addEventListener('click', () => { resetGame(); startGame(); });
    ui.muteBtn.addEventListener('click', () => {
      game.muted = !game.muted; syncSettings(); saveProgress();
    });
    ui.settingsBtn.addEventListener('click', openSettings);
    ui.closeSettingsBtn.addEventListener('click', closeSettings);
    ui.musicVolume.addEventListener('input', () => {
      game.musicVolume = Number(ui.musicVolume.value) / 100; syncSettings(); saveProgress();
    });
    ui.effectsVolume.addEventListener('input', () => {
      game.effectsVolume = Number(ui.effectsVolume.value) / 100; syncSettings(); saveProgress();
    });
    ui.reducedShake.addEventListener('change', () => {
      game.reducedShake = ui.reducedShake.checked; saveProgress();
    });
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
      if (!platform.moving) { platform.dx = 0; platform.dy = 0; continue; }
      const previousX = platform.x;
      const previousY = platform.y;
      const wave = Math.sin(game.levelTime * platform.speed + platform.phase);
      if (platform.axis === 'x') platform.x = platform.baseX + wave * platform.range;
      else platform.y = platform.baseY + wave * platform.range;
      platform.dx = platform.x - previousX;
      platform.dy = platform.y - previousY;
    }
    for (const item of world.collectibles) {
      if (!item.ridePlatform || item.collected) continue;
      item.x = item.ridePlatform.x + item.rideOffsetX;
      item.y = item.ridePlatform.y + item.rideOffsetY;
    }
  }

  function resolvePlatforms(previousY) {
    player.grounded = false;
    player.platform = null;
    if (player.vy < 0) return;
    const previousBottom = previousY + player.h;
    const currentBottom = player.y + player.h;
    for (const platform of world.platforms) {
      if (player.x + player.w < platform.x + 5 || player.x > platform.x + platform.w - 5) continue;
      if (previousBottom <= platform.y + 8 && currentBottom >= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
        player.platform = platform;
        return;
      }
    }
  }

  function findRespawn(x) {
    if (game.latestCheckpoint) return { targetX: game.latestCheckpoint.x + 30, targetY: GROUND_Y - player.h, airY: GROUND_Y - player.h - 250 };
    const candidates = world.platforms.filter((platform) => platform.ground && platform.x < x && platform.x + platform.w > 120);
    const platform = candidates[candidates.length - 1] || world.platforms[0];
    const targetX = Math.max(platform.x + 45, Math.min(x - 90, platform.x + platform.w - 90));
    const targetY = platform.y - player.h;
    return { targetX, targetY, airY: Math.max(24, targetY - 250) };
  }

  function beginRespawn() {
    if (game.state !== 'playing' || game.respawn.active) return;
    const sourceX = player.x; const sourceY = Math.min(player.y, canvas.height - player.h - 8); const point = findRespawn(sourceX);
    game.state = 'respawning';
    sharedAbilities.clearForRespawn(game.abilities);
    game.limeShield = false;
    game.activePower = null;
    keys.left = false; keys.right = false; keys.jump = false;
    heroCore.beginRespawn(game.respawn, { fromX: sourceX, fromY: sourceY, ...point });
    game.respawnCount += 1;
    player.x = sourceX; player.y = sourceY; player.vx = 0; player.vy = 0; player.grounded = false; player.platform = null; player.coyote = 0; player.jumpBuffer = 0; player.invulnerable = 0; player.rotation = 0; player.scale = 1;
    spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#65d8ff', 24);
  }

  function updateRespawn(dt) {
    const respawnStep = heroCore.advanceRespawn(game.respawn, player, dt);
    game.cameraX = lerp(game.cameraX, clamp(game.respawn.targetX - canvas.width * .42, 0, WORLD_WIDTH - canvas.width), Math.min(1, dt * 4));
    if (respawnStep.phase === 'vanish') {
      if (game.respawn.sparkTimer >= .08) { game.respawn.sparkTimer = 0; spawnConfetti(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, 4); }
      return;
    }
    if (respawnStep.shouldPlace) { heroCore.placeRespawn(game.respawn, player); spawnConfetti(player.x - game.cameraX + player.w / 2, 84, 18); playAudio('hero.respawnBeam', { position: audioPosition(player.x + player.w / 2) }); }
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
      game.fallSoundPlayed = false;
      heroCore.finishRespawn(game.respawn, player); game.state = 'playing';
      keys.left = false; keys.right = false; keys.jump = false;
    }
  }

  function activateLimeShield(source = 'guac-lookout', options = {}) {
    const alreadyActive = game.limeShield;
    game.limeShield = true;
    game.activePower = 'lime';
    if (!options.silent) {
      showMessage('LIME SHIELD! EXTRA ZEST FOR THE SHOWDOWN!', 1.8);
      spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#9bef70', game.reducedShake ? 24 : 54);
      playAudio('ability.limeStart', { position: audioPosition(player.x + player.w / 2), variant: source });
    }
    return !alreadyActive;
  }

  function hurtPlayer(fromX) {
    if (previewNoDamage || player.invulnerable > 0 || sharedAbilities.isFrenzy(game.abilities) || game.state !== 'playing') return;
    const knockbackX = fromX < player.x ? 280 : -280;
    if (game.limeShield) {
      game.limeShield = false;
      game.activePower = null;
      player.invulnerable = 1.1;
      player.vx = knockbackX; player.vy = -300;
      game.chainCount = 0; game.chainTimer = 0;
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 9);
      showMessage('LIME SHIELD POPPED! SUPER FORM PROTECTED!', 1.35);
      spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#9bef70', game.reducedShake ? 26 : 58);
      playAudio('ability.limeBreak', { position: audioPosition(player.x + player.w / 2) });
      return;
    }
    if (sharedAbilities.absorbDamage(game.abilities, { position: audioPosition(player.x + player.w / 2) })) {
      player.invulnerable = sharedAbilities.definitions.superHero.damageInvulnerabilityDuration;
      player.vx = knockbackX; player.vy = -300;
      game.chainCount = 0; game.chainTimer = 0;
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 5 : 11);
      showMessage('SUPER POWER DOWN! NORMAL TACO HERO!', 1.45);
      spawnConfetti(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, game.reducedShake ? 30 : 64);
      return;
    }
    game.hearts -= 1;
    player.invulnerable = 1.25;
    player.vx = knockbackX;
    player.vy = -300;
    game.chainCount = 0; game.chainTimer = 0;
    game.cameraShake = 11;
    playAudio('hero.hurt', { position: audioPosition(player.x + player.w / 2) });
    if (game.hearts <= 0) {
      game.hearts = 3;
      game.score = Math.max(0, game.score - 150);
      beginRespawn();
    }
  }

  function announceSuper(sourceX = player.x) {
    showMessage('SUPER TACO HERO!', 2.1);
    spawnConfetti(sourceX - game.cameraX + player.w / 2, player.y + player.h / 2, game.reducedShake ? 42 : 96);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 10);
  }

  function collectItem(item) {
    item.collected = true;
    if (!item.bonusReward && item.type === 'taco') game.collected += 1;
    if (item.type === 'sombrero') {
      const magnetWasActive = sharedAbilities.hasMagnet(game.abilities);
      game.goldenSombrero = true;
      game.score += 2500;
      sharedAbilities.activateMagnet(game.abilities);
      showMessage('GOLDEN SOMBRERO! CERTIFIED SALSA LEGEND!', 2.8);
      spawnConfetti(item.x - game.cameraX, item.y, game.reducedShake ? 70 : 170);
      game.cameraShake = Math.max(game.cameraShake, 10);
      playAudio('collect.goldenSombrero', { position: audioPosition(item.x + item.w / 2) });
      if (!magnetWasActive) playAudio('ability.magnetStart', { position: audioPosition(item.x + item.w / 2) });
    } else if (item.type === 'magnet') {
      const magnetWasActive = sharedAbilities.hasMagnet(game.abilities);
      sharedAbilities.activateMagnet(game.abilities);
      game.score += 450;
      showMessage('TACO MAGNET! LET THE CRUNCH COME TO YOU!', 2);
      spawnConfetti(item.x - game.cameraX, item.y, 48);
      if (!magnetWasActive) playAudio('ability.magnetStart', { position: audioPosition(item.x + item.w / 2) });
    } else if (item.type === 'hotSauce') {
      game.hotSauce += 1;
      game.score += 700;
      showMessage(`GOLDEN HOT SAUCE ${game.hotSauce}/${game.totalHotSauce}!`, 1.8);
      spawnConfetti(item.x - game.cameraX, item.y, 60);
      playAudio('collect.goldenHotSauce', { combo: game.hotSauce, position: audioPosition(item.x + item.w / 2) });
    } else {
      const multiplier = 1 + Math.min(5, Math.floor(game.chainCount / 2));
      game.score += (item.bonusReward ? 35 : 10) * multiplier;
      const superStarted = previewForceNormal ? false : sharedAbilities.collectTaco(game.abilities, item.bonusReward ? 'premium' : 'taco', { position: audioPosition(item.x + item.w / 2) });
      if (superStarted) {
        if (game.bossCelebrationLock <= 0) {
          announceSuper(item.x);
        }
      }
      playAudio(item.rainbowReward ? 'collect.rainbowTaco' : 'collect.taco', { streak: game.chainCount, position: audioPosition(item.x + item.w / 2) });
    }
    const color = item.type === 'hotSauce' ? '#ff6f55' : item.type === 'magnet' ? '#65d8ff' : '#ffd65a';
    const burst = item.type === 'sombrero' ? 70 : item.type === 'hotSauce' ? 38 : item.type === 'magnet' ? 32 : 9;
    spawnBurst(item.x - game.cameraX + item.w / 2, item.y + item.h / 2, color, burst);
  }

  function showdownExplorationRewardSurface(entry) {
    const platform = world.platforms.find((candidate) => candidate.id === entry.rewardPlatformId);
    if (!platform) return null;
    const itemSize = 24;
    const padding = 14;
    return {
      platform, platformId: platform.id, top: platform.y,
      center: platform.x + platform.w * .5,
      safeLeft: platform.x + padding,
      safeRight: platform.x + platform.w - padding - itemSize,
      width: platform.w,
    };
  }

  function spawnShowdownExplorationRewards(entry, state) {
    if (!state || state.rewardSpawned) return false;
    const surface = showdownExplorationRewardSurface(entry);
    if (!surface) return false;
    const secret = entry.id === outlawStashPlan.id;
    const rainbowCount = entry.rainbowTacos || 0;
    const columns = Math.max(1, Math.min(7, entry.bonusTacos));
    const slotSpacing = columns >= 7 ? 28 : 30;
    const normalBaseOffset = rainbowCount ? 61 : 31;
    const launchY = surface.top - (secret ? 46 : 84);

    for (let index = 0; index < entry.bonusTacos; index += 1) {
      const row = Math.floor(index / columns);
      const rowStart = row * columns;
      const rowLength = Math.min(columns, entry.bonusTacos - rowStart);
      const column = index - rowStart;
      const targetX = clamp(surface.center - ((rowLength - 1) * slotSpacing + 24) * .5 + column * slotSpacing, surface.safeLeft, surface.safeRight);
      const targetY = surface.top - normalBaseOffset - row * 27;
      const delay = index * .024;
      addItem(surface.center - 12, launchY, 'taco', {
        bonusReward: true, dynamic: true, explorationReward: true, phase2Pilot: true,
        phase2Discovery: entry.id,
        rewardFlight: { elapsed: -delay, duration: .58 + column * .035 + row * .08, startX: surface.center - 12, startY: launchY, targetX, targetY, arc: secret ? 34 + row * 7 : 70 + row * 13, platformId: surface.platformId },
        rewardLanding: { platformId: surface.platformId, surfaceY: surface.top, targetX, targetY, safeLeft: surface.safeLeft, safeRight: surface.safeRight, settled: false },
        vx: 0, vy: 0, angle: index * .67, bounces: 0,
      });
    }
    for (let index = 0; index < rainbowCount; index += 1) {
      const targetX = clamp(surface.center - 12 + (index - (rainbowCount - 1) * .5) * 54, surface.safeLeft, surface.safeRight);
      const targetY = surface.top - 31;
      addItem(surface.center - 12, surface.top - (secret ? 48 : 96), 'taco', {
        bonusReward: true, rainbowReward: true, dynamic: true, explorationReward: true,
        phase2Pilot: true, phase2Discovery: entry.id,
        rewardFlight: { elapsed: -(entry.bonusTacos + index) * .024, duration: .72 + index * .08, startX: surface.center - 12, startY: surface.top - (secret ? 48 : 96), targetX, targetY, arc: secret ? 48 + index * 5 : 116 + index * 8, platformId: surface.platformId },
        rewardLanding: { platformId: surface.platformId, surfaceY: surface.top, targetX, targetY, safeLeft: surface.safeLeft, safeRight: surface.safeRight, settled: false },
        vx: 0, vy: 0, angle: index * .9, bounces: 0,
      });
    }
    state.rewardSurfaceId = surface.platformId;
    state.rewardSpawned = true;
    state.rewardSpawnCount += 1;
    return true;
  }

  function setShowdownExplorationBanner(entry) {
    const secret = entry.id === outlawStashPlan.id;
    const duration = secret ? 3.35 : 2.15;
    game.showdownExploration.completionBanner = {
      eyebrow: secret ? 'TRUE OUTLAW SECRET' : entry.id === 'pepper-mine-lift' ? 'OPTIONAL MINE SYSTEM' : entry.id === 'salsa-silo' ? 'OPTIONAL SALSA MACHINERY' : entry.id === 'wanted-tower' ? 'OPTIONAL OUTLAW LANDMARK' : 'OPTIONAL SHOWDOWN PREP',
      title: entry.completionTitle,
      reward: entry.rewardLabel,
      mode: secret ? 'secret' : entry.presentation,
      timer: duration, maxTimer: duration,
    };
  }

  function beginGuacLookoutInteraction(entry, state) {
    if (!state || state.completed || state.activationStarted || game.showdownExploration.interaction) return false;
    state.activationStarted = true;
    state.activationCount += 1;
    state.power = Math.max(state.power, .08);
    game.showdownExploration.interaction = {
      id: entry.id, elapsed: 0, duration: 2.85, movementFocusDuration: .66, cameraFocusDuration: 1.7,
      focusX: entry.trigger.x + entry.trigger.w * .5,
      powerClickPlayed: false, connected: false, rewardDelivered: false,
    };
    player.jumpBuffer = 0;
    if (player.grounded) { player.vx = 0; player.vy = 0; }
    impactText(entry.rewardX, entry.rewardY + 42, 'LOOKOUT SIGNAL POWERING', '#9bef70', 19);
    playAudio('checkpoint.activate', { position: audioPosition(entry.rewardX), pitchCents: -45 });
    return true;
  }

  function completeShowdownExplorationEntry(entry, options = {}) {
    const state = showdownExplorationEntryState(entry);
    if (!state || state.completed) return false;
    if (entry.id === 'guac-lookout' && !options.fromInteraction) return beginGuacLookoutInteraction(entry, state);
    state.revealed = true;
    state.completed = true;
    state.completedAt = game.levelTime;
    state.completionCount += 1;
    state.environmentEnergized = true;
    game.score += entry.score;
    const secret = entry.id === outlawStashPlan.id;
    if (!options.suppressBanner) setShowdownExplorationBanner(entry);
    spawnShowdownExplorationRewards(entry, state);
    const screenX = entry.trigger.x + entry.trigger.w * .5 - game.cameraX;
    const centerY = entry.trigger.y + entry.trigger.h * .5;
    impactText(entry.rewardX, Math.max(27, entry.rewardY - 10), secret ? 'OUTLAW JACKPOT!' : entry.completionTitle.replace(/!+$/, ''), secret ? '#ffd65a' : '#fff1a6', secret ? 29 : 22);
    spawnConfetti(screenX, centerY, game.reducedShake ? (secret ? 48 : 24) : (secret ? 112 : entry.id === 'salsa-silo' ? 76 : 48));
    ['#65d8ff', '#ff6fae', '#ffd65a', '#9bef70'].forEach((color, index) => spawnBurst(screenX, centerY - index * 7, color, game.reducedShake ? 9 : secret ? 26 + index * 5 : 14 + index * 3));
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : secret ? 9 : entry.id === 'salsa-silo' ? 6 : 4);
    if (entry.id === 'pepper-mine-lift') {
      state.spectacleTimer = state.spectacleMaxTimer = 2.9;
      playAudio('movement.churroSpring', { position: audioPosition(entry.rewardX), pitchCents: -140, gain: .68 });
      playAudio('level.celebrationPulse', { position: audioPosition(entry.rewardX), pitchCents: -35 });
    } else if (entry.id === 'salsa-silo') {
      state.spectacleTimer = state.spectacleMaxTimer = 3.25;
      playAudio('vehicle.aircraftBoost', { position: audioPosition(entry.rewardX), pitchCents: -55, gain: .72 });
      playAudio('level.celebrationPulse', { position: audioPosition(entry.rewardX), pitchCents: 85 });
    } else if (entry.id === 'wanted-tower') {
      state.spectacleTimer = state.spectacleMaxTimer = 2.5;
      playAudio('checkpoint.activate', { position: audioPosition(entry.rewardX), pitchCents: 80 });
      playAudio('level.celebrationPulse', { position: audioPosition(entry.rewardX), pitchCents: 15, gain: .72 });
    } else if (entry.id === 'guac-lookout') {
      state.spectacleTimer = state.spectacleMaxTimer = 2.7;
      activateLimeShield('guac-lookout');
      playAudio('collect.rainbowTaco', { position: audioPosition(entry.rewardX), pitchCents: 35, gain: .72 });
    } else {
      state.revealTimer = state.revealMaxTimer = 3.35;
      state.crateOpen = .01;
      playAudio('pinata.break', { position: audioPosition(entry.rewardX), combo: 5 });
      playAudio('pinata.jackpotSparkle', { position: audioPosition(entry.rewardX), pitchCents: 145 });
      playAudio('collect.rainbowTaco', { position: audioPosition(entry.rewardX), pitchCents: 95 });
    }
    return true;
  }

  function updateGuacLookoutInteraction(dt) {
    const interaction = game.showdownExploration?.interaction;
    if (!interaction) return false;
    const entry = showdownExplorationPlan.find((candidate) => candidate.id === interaction.id);
    const state = entry ? showdownExplorationEntryState(entry) : null;
    if (!entry || !state) { game.showdownExploration.interaction = null; return false; }
    interaction.elapsed = Math.min(interaction.duration, interaction.elapsed + dt);
    state.power = clamp(interaction.elapsed / .65, .08, 1);
    if (!interaction.powerClickPlayed && interaction.elapsed >= .24) {
      interaction.powerClickPlayed = true;
      playAudio('ui.radio', { position: audioPosition(entry.rewardX), pitchCents: -25 });
    }
    if (!interaction.connected && interaction.elapsed >= .56) {
      interaction.connected = true;
      game.showdownExploration.transmission = {
        speaker: 'OLIVIA', channel: 'GUAC LOOKOUT • RIDGE LINK',
        message: 'Taco Hero, trouble is right over that ridge. Take this—you’re gonna want some lime.',
        reward: entry.rewardLabel, rewardVisible: false, timer: 3.9, maxTimer: 3.9,
      };
      impactText(entry.rewardX, entry.rewardY + 18, 'OLIVIA LINK LOCKED', '#65d8ff', 20);
      playAudio('vehicle.aircraftReady', { position: audioPosition(entry.rewardX), pitchCents: -15 });
    }
    if (!interaction.rewardDelivered && interaction.elapsed >= 1.28) {
      interaction.rewardDelivered = completeShowdownExplorationEntry(entry, { fromInteraction: true, suppressBanner: true });
      if (game.showdownExploration.transmission) game.showdownExploration.transmission.rewardVisible = true;
    }
    const focusing = interaction.elapsed < interaction.movementFocusDuration;
    if (focusing) {
      player.vx *= Math.pow(.001, dt);
      if (player.grounded) player.vy = 0;
    }
    if (interaction.elapsed < interaction.cameraFocusDuration) {
      const targetCamera = clamp(interaction.focusX - canvas.width * .58, 0, WORLD_WIDTH - canvas.width);
      game.cameraX = lerp(game.cameraX, targetCamera, Math.min(1, dt * 5.2));
    }
    if (interaction.elapsed >= interaction.duration) game.showdownExploration.interaction = null;
    return focusing;
  }

  function finishExplorationInteractionForBoss() {
    const pilot = game.showdownExploration;
    if (!pilot?.interaction && !pilot?.transmission) return;
    const lookout = showdownExplorationPlan.find((entry) => entry.id === 'guac-lookout');
    const state = showdownExplorationEntryState(lookout);
    if (pilot.interaction && state && !state.completed) completeShowdownExplorationEntry(lookout, { fromInteraction: true, suppressBanner: true });
    pilot.interaction = null;
    pilot.transmission = null;
    pilot.bossTransitionCleanups += 1;
  }

  function updateShowdownExploration(dt) {
    const pilot = game.showdownExploration;
    if (!pilot) return;
    if (pilot.completionBanner) {
      pilot.completionBanner.timer = Math.max(0, pilot.completionBanner.timer - dt);
      if (pilot.completionBanner.timer <= 0) pilot.completionBanner = null;
    }
    if (pilot.transmission) {
      pilot.transmission.timer = Math.max(0, pilot.transmission.timer - dt);
      if (pilot.transmission.timer <= 0) pilot.transmission = null;
    }
    for (const entry of showdownExplorationPlan) {
      const state = showdownExplorationEntryState(entry);
      if (!state) continue;
      state.spectacleTimer = Math.max(0, state.spectacleTimer - dt);
      if (player.platform?.phase2Discovery === entry.id) {
        state.revealed = true;
        if (!state.arrivalAcknowledged) {
          state.arrivalAcknowledged = true;
          showMessage(entry.arrivalTitle, .95);
        }
        const waypoint = Number(player.platform.phase2Waypoint) || 0;
        if (waypoint > state.progress) {
          state.progress = waypoint;
          if (waypoint < entry.waypointCount) {
            const label = entry.id === 'pepper-mine-lift' ? `HOIST LINK ${waypoint}/${entry.waypointCount}` : entry.id === 'salsa-silo' ? `PRESSURE VALVE ${waypoint}/${entry.waypointCount}` : entry.id === 'wanted-tower' ? `BOUNTY LIGHT ${waypoint}/${entry.waypointCount}` : `LOOKOUT LINK ${waypoint}/${entry.waypointCount}`;
            impactText(player.x + player.w * .5, Math.max(28, player.y - 6), label, entry.id === 'guac-lookout' ? '#9bef70' : entry.id === 'wanted-tower' ? '#ff6fae' : '#65d8ff', 16);
            playAudio('checkpoint.activate', { position: audioPosition(player.x), pitchCents: -80 + waypoint * 48, gain: .7 });
          }
        }
      }
      if (!state.completed && state.progress >= entry.waypointCount && intersects(player, entry.trigger)) completeShowdownExplorationEntry(entry);
    }
    const secret = pilot.secret;
    secret.revealTimer = Math.max(0, secret.revealTimer - dt);
    if (secret.completed) secret.crateOpen = Math.min(1, secret.crateOpen + dt * 2.35);
    if (player.platform?.phase2Discovery === outlawStashPlan.id) {
      secret.revealed = true;
      secret.progress = Math.max(secret.progress, Number(player.platform.phase2Waypoint) || 0);
      if (!secret.arrivalAcknowledged) {
        secret.arrivalAcknowledged = true;
        impactText(player.x + player.w * .5, Math.max(24, player.y - 6), '...THAT HATCH WAS NOT ON THE POSTER.', '#fff1a6', 16);
        playAudio('pinata.jackpotSparkle', { position: audioPosition(player.x), pitchCents: -75, gain: .62 });
      }
    }
    if (!secret.completed && secret.progress >= outlawStashPlan.waypointCount && intersects(player, outlawStashPlan.trigger)) completeShowdownExplorationEntry(outlawStashPlan);
    updateGuacLookoutInteraction(dt);
    if (player.x >= PHASE2_BOSS_BUFFER_X) finishExplorationInteractionForBoss();
    if (qa && previewPhase2Complete) {
      const entry = showdownExplorationPlan.find((candidate) => candidate.id === previewPhase2Complete);
      const state = entry && showdownExplorationEntryState(entry);
      if (entry && state && !state.completed && !state.activationStarted) completeShowdownExplorationEntry(entry);
    }
    if (qa && previewPhase2Secret && !secret.completed) completeShowdownExplorationEntry(outlawStashPlan);
    if (qa && previewPowerDown && !pilot.previewPowerDownTriggered && game.levelTime > .2) {
      pilot.previewPowerDownTriggered = true;
      hurtPlayer(player.x + 120);
    }
  }

  function updateShowdownExplorationCamera(dt) {
    const pilot = game.showdownExploration;
    if (!pilot) return;
    const entries = [...showdownExplorationPlan, outlawStashPlan];
    const inExplorationRange = entries.some((entry) => player.x >= entry.routeRange[0] - 160 && player.x <= entry.routeRange[1] + 160);
    const cameraAllowed = !game.bossActive && game.state === 'playing';
    pilot.cameraTargetLift = cameraAllowed && inExplorationRange ? clamp((270 - player.y) * .54, 0, 116) : 0;
    if (pilot.interaction) pilot.cameraTargetLift = Math.max(pilot.cameraTargetLift, 86);
    pilot.cameraLift = lerp(pilot.cameraLift, pilot.cameraTargetLift, Math.min(1, dt * (pilot.cameraTargetLift > pilot.cameraLift ? 5.5 : 4.4)));
  }

  function spawnChainTacos(enemy, amount = 10) {
    for (let index = 0; index < amount; index += 1) {
      addItem(enemy.x + (seeded() - 0.5) * 80, enemy.y - 20, 'taco', {
        bonusReward: true, dynamic: true,
        vx: (seeded() - 0.5) * 360, vy: -180 - seeded() * 350, angle: seeded() * 6,
      });
    }
  }

  function spawnBossShockwave(enemy, strength = 1) {
    game.bossShockwaves.push({
      x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h * 0.54,
      radius: 18, speed: 255 + strength * 80, life: 0.82 + strength * 0.16,
      maxLife: 0.82 + strength * 0.16, strength,
    });
  }

  function announceBossPhase(title, message, music) {
    game.bossPhaseTitle = title;
    // Let the warning land first, then reveal the phase title as its own clean beat.
    game.bossPhaseBanner = 4.8;
    if (message) showMessage(message, 2.35);
    if (music) setMusic(music);
    playAudio('boss.elGuacodillo.phaseTransition', { combo: game.bossHits + 1 });
  }

  function rewardBossDodge(x) {
    game.bossDodges += 1;
    game.score += 250;
    spawnChainTacos({ x, y: 350, w: 20, h: 20 }, 2);
    if (game.bossDodges % 3 === 0) {
      const magnetWasActive = sharedAbilities.hasMagnet(game.abilities);
      sharedAbilities.activateMagnet(game.abilities);
      showMessage(`OLIVIA: GUAC DODGE ×${game.bossDodges}! MAGNET BONUS!`, 1.7);
      playAudio('boss.elGuacodillo.dodge', { combo: game.bossDodges, position: audioPosition(x) });
      if (!magnetWasActive) playAudio('ability.magnetStart');
    } else {
      showMessage(`GUAC DODGE ×${game.bossDodges}! +250`, 1.15);
      playAudio('boss.elGuacodillo.dodge', { combo: game.bossDodges, position: audioPosition(x) });
    }
  }

  function startBossCharge(boss, finalRage = false) {
    boss.state = 'windup';
    boss.dir = player.x < boss.x ? -1 : 1;
    boss.chargeWindup = finalRage ? 0.48 : 0.72;
    boss.chargeWindupMax = boss.chargeWindup;
    boss.chargeTimer = 0;
    boss.intangible = false;
    showMessage(finalRage ? 'MAXIMUM GUAC! BAIT THE CRASH!' : 'GUAC CHARGE! BAIT THE BARREL!', 1.55);
    impactText(boss.x + boss.w / 2, boss.y - 34, finalRage ? 'RAGE CHARGE!' : 'GUAC CHARGE!', finalRage ? '#ff6fae' : '#ffd65a');
    playAudio('boss.elGuacodillo.chargeWindup', { variant: finalRage ? 'rage' : 'standard', position: audioPosition(boss.x + boss.w / 2) });
  }

  function startBossAirStrike(boss, finalRage = false) {
    boss.state = 'airstrike';
    boss.intangible = true;
    boss.airStrikeTimer = finalRage ? 3.25 : 2.8;
    boss.airStrikeShotTimer = 0.24;
    boss.shotsRemaining = finalRage ? 6 : 4;
    boss.chargeWindup = 0;
    boss.chargeTimer = 0;
    showMessage(finalRage ? 'RAGE MODE! WATCH THE SHADOWS!' : 'AIR STRIKE! DODGE THE GUAC!', 1.75);
    impactText(boss.x + boss.w / 2, boss.y - 42, 'AIRBORNE GUAC!', '#8dff9c');
    playAudio('boss.elGuacodillo.airstrikeStart', { variant: finalRage ? 'rage' : 'standard', position: audioPosition(boss.x + boss.w / 2) });
  }

  function stunBossAfterCrash(boss) {
    if (!boss || boss.state !== 'charge') return;
    boss.chargeTimer = 0;
    boss.state = game.bossHits >= 2 ? 'final-opening' : 'stunned';
    boss.openingElevated = false;
    boss.intangible = false;
    game.bossVulnerableTimer = game.bossHits >= 2 ? 3.4 : 2.85;
    game.bossStunTimer = game.bossVulnerableTimer;
    game.bossAttackCooldown = game.bossVulnerableTimer + 0.4;
    game.cameraShake = Math.max(game.cameraShake, game.bossHits >= 2 ? 20 : 14);
    game.hitStop = Math.max(game.hitStop, game.bossHits >= 2 ? 0.15 : 0.09);
    const edgeX = boss.dir > 0 ? boss.maxX + boss.w : boss.minX;
    spawnBurst(edgeX - game.cameraX, 378, '#ff6fae', game.reducedShake ? 28 : 58);
    spawnBurst(edgeX - game.cameraX, 390, '#ffd65a', game.reducedShake ? 22 : 46);
    showMessage(game.bossHits >= 2 ? 'FINAL OPENING! SLOW-MO STOMP THE SOMBRERO!' : 'SALSA BARREL BONK! EL GUACODILLO IS DIZZY—STOMP NOW!', 2.25);
    impactText(boss.x + boss.w / 2, boss.y - 38, game.bossHits >= 2 ? 'FINAL OPENING!' : 'BARREL BONK!', '#ffd65a', 36);
    if (game.bossHits >= 2) game.bossFinalFocus = 1.4;
    playAudio('boss.elGuacodillo.crashStun', { combo: game.bossHits + 1, position: audioPosition(boss.x + boss.w / 2) });
  }

  function stompBoss(enemy) {
    if (enemy.hitCooldown > 0) return;
    if (game.bossVulnerableTimer <= 0) {
      player.vy = -360;
      player.invulnerable = Math.max(player.invulnerable, 0.45);
      showMessage('ARMORED GUAC! WAIT FOR THE FLASHING STOMP OPENING!', 1.25);
      impactText(enemy.x + enemy.w / 2, enemy.y - 22, 'CLONK!', '#65d8ff', 28);
      playAudio('boss.elGuacodillo.armorClonk', { position: audioPosition(enemy.x + enemy.w / 2) });
      return;
    }
    game.bossHits += 1;
    game.bossVulnerableTimer = 0;
    game.bossStunTimer = 0;
    enemy.hitCooldown = 1.2;
    enemy.intangible = false;
    player.y = Math.min(player.y, enemy.y - player.h - 1);
    player.grounded = false;
    player.platform = null;
    player.vy = -heroPhysics.enemyBounceVelocity;
    enemy.dir *= -1;
    game.cameraShake = 16 + game.bossHits * 3;
    game.hitStop = game.bossHits >= 3 ? 0.2 : 0.09 + game.bossHits * 0.025;
    playAudio('boss.elGuacodillo.damage', { combo: game.bossHits, position: audioPosition(enemy.x + enemy.w / 2) });
    const bossFeedback = heroCore.splatFeedback(game.bossHits, true);
    impactText(enemy.x + enemy.w / 2, enemy.y - 28, bossFeedback.text, bossFeedback.color, bossFeedback.size);
    spawnBossShockwave(enemy, game.bossHits);
    ['#9bef70', '#ffd65a', '#ff6fae'].slice(0, game.bossHits).forEach((color, index) => {
      spawnBurst(enemy.x - game.cameraX + enemy.w / 2, enemy.y + enemy.h / 2 - index * 8, color, 42 + game.bossHits * 9);
    });
    if (game.bossHits < 3) {
      const excuses = ['“THAT WAS PROBABLY LAG.”', '“MY SOMBRERO BLOCKED THE SUN.”'];
      showMessage(`EL GUACODILLO: ${excuses[game.bossHits - 1]} ${game.bossHits}/3`, 2.2);
      if (game.bossHits === 1) {
        enemy.state = 'phase-break';
        game.bossAttackCooldown = 1.55;
        announceBossPhase('PHASE 2 • GUAC AIR STRIKE', 'OLIVIA: WARNING—GUAC IS NOW AIRBORNE. THIS IS NOT A DRILL.', 'bossAir');
      } else {
        enemy.state = 'rage';
        game.bossAttackCooldown = 1.35;
        announceBossPhase('PHASE 3 • MAXIMUM GUAC RAGE', 'OLIVIA: HIS EGO HAS ENTERED ITS FINAL FORM!', 'bossRage');
      }
      return;
    }
    game.bossKO = { x: enemy.x + enemy.w / 2, y: 412, timer: 12 };
    enemy.alive = false;
    enemy.defeated = true;
    game.bossDefeated = true;
    game.bossHazards = [];
    game.bossIntroTimer = 0;
    game.gateUnlockTimer = 12.5;
    game.defeated += 1;
    game.score += 6000;
    game.bossFinalFocus = 1.8;
    game.bossCelebrationLock = 4.2;
    showMessage('GUAC-KRAK! THE GUAC HAS BEEN OFFICIALLY ROCKED! 🌈🌮', 3.8);
    setMusic('victory');
    spawnChainTacos(enemy, 64);
    const magnetWasActive = sharedAbilities.hasMagnet(game.abilities);
    sharedAbilities.activateMagnet(game.abilities);
    if (!magnetWasActive) playAudio('ability.magnetStart');
    spawnConfetti(canvas.width * 0.55, 150, game.reducedShake ? 110 : 310);
    spawnConfetti(28720 - game.cameraX, 250, game.reducedShake ? 35 : 90);
    for (let index = 0; index < 24; index += 1) {
      addItem(28680 + seeded() * 150, 250 + seeded() * 120, 'taco', {
        bonusReward: true, dynamic: true, vx: 170 + seeded() * 260,
        vy: -90 - seeded() * 230, angle: seeded() * 6,
      });
    }
    for (let index = 0; index < (game.reducedShake ? 7 : 14); index += 1) spawnFirework();
    playAudio('boss.elGuacodillo.defeat', { position: audioPosition(enemy.x + enemy.w / 2) });
  }

  function defeatEnemy(enemy, stomped = true) {
    if (!enemy.alive || enemy.hitCooldown > 0) return;
    if (enemy.boss) { stompBoss(enemy); return; }
    enemy.defeated = true;
    enemy.defeatTimer = 0.36;
    enemy.intangible = true;
    enemy.charging = false;
    enemy.rolling = false;
    game.defeated += 1;
    if (stomped) {
      game.chainCount = game.chainTimer > 0 ? game.chainCount + 1 : 1;
      game.chainTimer = 2.45;
      game.bestChain = Math.max(game.bestChain, game.chainCount);
      player.y = Math.min(player.y, enemy.y - player.h - 1);
      player.grounded = false;
      player.platform = null;
      player.vy = -heroPhysics.enemyBounceVelocity;
    }
    const authoredReward = enemy.rewardProfile || heroCore.getEnemyRewardProfile(enemy);
    game.score += 170 * Math.max(1, game.chainCount) + Math.round(Math.max(0, Number(authoredReward?.score) || 0) * 0.12);

    const perfectStomp = Boolean(enemy.perfectStomp);
    if (perfectStomp) {
      game.perfectStomps += 1;
      game.score += 200;
      game.hitStop = Math.max(game.hitStop, 0.085);
      game.cameraShake = Math.max(game.cameraShake, 8);
      impactText(enemy.x + enemy.w / 2, enemy.y - 30, 'PERFECT!', '#ffd65a');
      spawnBossShockwave(enemy, 1);
    }
    delete enemy.perfectStomp;

    const rewardCount = Math.max(1, Math.min(4, Number(authoredReward?.tacoCount) || 1));
    for (let index = 0; index < rewardCount; index += 1) {
      addItem(enemy.x + index * 22, enemy.y - 22, 'taco', {
        bonusReward: true, dynamic: true, bounces: 0,
        vx: (index - (rewardCount - 1) / 2) * 110, vy: -230 - index * 30, angle: index,
      });
    }

    const superStarted = previewForceNormal ? false : sharedAbilities.splatEnemy(game.abilities, { position: audioPosition(enemy.x + enemy.w / 2) });
    if (superStarted) announceSuper(enemy.x);

    const nextTarget = stomped && world.enemies
      .filter((candidate) => candidate.alive && !candidate.boss && candidate.x > enemy.x && candidate.x - enemy.x < 590)
      .sort((a, b) => a.x - b.x)[0];
    if (nextTarget) { player.vx = Math.max(285, Math.abs(player.vx)); player.dir = 1; }

    game.hitStop = game.chainCount >= 5 ? 0.075 : 0.045;
    game.cameraShake = Math.max(game.cameraShake, 6 + Math.min(12, game.chainCount));
    playAudio(stomped ? 'combat.enemyStomp' : 'combat.enemySplat', {
      enemyType: enemy.type,
      combo: stomped ? game.chainCount : 1,
      position: audioPosition(enemy.x + enemy.w / 2),
    });
    const colors = { slime: '#7ee46b', knight: '#ffd65a', jalapeno: '#ff6a54', guac: '#9bef70', churro: '#eeb66e', mole: '#65d8ff' };
    const feedback = heroCore.splatFeedback(Math.max(1, game.chainCount), stomped);
    spawnBurst(enemy.x - game.cameraX + enemy.w / 2, enemy.y + enemy.h / 2, colors[enemy.type], 30);
    impactText(enemy.x + enemy.w / 2, enemy.y - 8, feedback.text, feedback.color, feedback.size);

    if (stomped) {
      heroCore.celebrateSplatCombo(game.chainCount, {
        reduced: game.reducedShake,
        onCelebrate: (reward) => {
          const screenX = enemy.x - game.cameraX + enemy.w / 2;
          spawnConfetti(screenX, enemy.y + enemy.h / 2, reward.confetti);
          reward.burstColors.forEach((color, index) => spawnBurst(screenX, enemy.y + 8 - index * 6, color, reward.tier === 'supremacy' ? 42 : 22));
          showMessage(reward.label, reward.duration);
          game.hitStop = Math.max(game.hitStop, reward.hitStop);
          game.cameraShake = Math.max(game.cameraShake, reward.shake);
          if (perfectStomp) playAudio('combat.comboMilestone', { combo: game.chainCount, position: audioPosition(enemy.x + enemy.w / 2) });
        },
      });
    }

    if (enemy.type === 'slime') game.speedPads.push({ x: enemy.x - 12, y: GROUND_Y - 8, w: 105, life: 11, used: false });
    if (enemy.type === 'churro') game.springPads.push({ x: enemy.x - 10, y: enemy.y + enemy.h - 8, w: 70, life: 10 });

    if (stomped && game.chainCount === 3) {
      showMessage('TRIPLE SPLAT! KEEP IT CRUNCHY!', 1.4);
      spawnChainTacos(enemy, 6);
    } else if (stomped && game.chainCount === 5) {
      showMessage('MEGA TACO SPLAT ×5! RAINBOW RAMPAGE! 🌈', 2.35);
      spawnChainTacos(enemy, 12);
      game.chainTrailTimer = 3.5;
    } else if (stomped && game.chainCount === 8) {
      showMessage('SALSA SUPREMACY ×8! TACO MAGNET!', 2.5);
      spawnChainTacos(enemy, 20);
      game.chainTrailTimer = 5;
      const magnetWasActive = sharedAbilities.hasMagnet(game.abilities);
      sharedAbilities.activateMagnet(game.abilities);
      if (!magnetWasActive) playAudio('ability.magnetStart');
      spawnConfetti(enemy.x - game.cameraX, enemy.y, game.reducedShake ? 60 : 135);
    } else if (stomped && game.chainCount > 8 && game.chainCount % 3 === 0) {
      showMessage(`ABSURD SPLAT CHAIN ×${game.chainCount}!`, 1.2);
      spawnChainTacos(enemy, 8);
    }
  }

  function updateEnemies(dt) {
    let stompResolvedThisFrame = false;
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const previousEnemyTop = Number.isFinite(enemy.previousY) ? enemy.previousY : enemy.y;
      enemy.clock += dt;
      enemy.anim = (enemy.anim || 0) + dt * heroPhysics.enemyVisualAnimationRate;
      enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
      if (enemy.defeated && !enemy.boss) {
        enemy.defeatTimer = Math.max(0, enemy.defeatTimer - dt);
        if (enemy.defeatTimer === 0) enemy.alive = false;
        continue;
      }
      if (enemy.type === 'mole') {
        const emergence = (Math.sin(enemy.clock * 2.8) + 1) * 0.5;
        enemy.emergeAmount = clamp((emergence - 0.12) / 0.58, 0, 1);
        enemy.visible = enemy.emergeAmount > 0.28;
      }
      else enemy.visible = true;
      let speedScale = enemy.boss ? 1 : heroCore.updateEnemyBehavior(enemy, dt, { jumpScale: enemy.chainTarget ? .38 : 1 });
      if (enemy.type === 'boss') {
        const arenaTop = enemy.platform?.y ?? GROUND_Y;
        enemy.baseY = arenaTop - enemy.h;
        if (enemy.state === 'airstrike') enemy.y = 154 + Math.sin(enemy.clock * 4.2) * 12;
        else if ((enemy.state === 'vulnerable-air' || enemy.state === 'final-opening') && enemy.openingElevated) enemy.y = 236 + Math.sin(enemy.clock * 5.1) * 5;
        else enemy.y = enemy.baseY;
      }
      if (enemy.type === 'guac') speedScale *= 1.18;
      if (enemy.type === 'knight') speedScale *= 0.9;
      if (enemy.type === 'mole' && !enemy.visible) speedScale = 0;
      if (enemy.boss && ['intro', 'phase-break', 'rage', 'stunned', 'vulnerable-air', 'final-opening', 'airstrike'].includes(enemy.state)) speedScale = 0;
      if (enemy.boss && enemy.chargeWindup > 0) speedScale = 0.12;
      if (enemy.boss && enemy.chargeTimer > 0) speedScale = 9.2 + game.bossHits * 1.2;
      enemy.x += enemy.dir * enemy.speed * speedScale * dt;
      if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) {
        enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX);
        if (enemy.boss && enemy.state === 'charge') stunBossAfterCrash(enemy);
        else enemy.dir *= -1;
      }
      enemy.previousY = enemy.y;
      if (!enemy.visible || enemy.hitCooldown > 0 || enemy.intangible) continue;
      if (enemy.boss) {
        if (!intersects(player, enemy)) continue;
        const bossStomp = heroCore.isStomp(player, enemy, {
          topTolerance: heroPhysics.stompTopTolerance,
          previousBottom: player.previousBottom,
          previousTargetTop: previousEnemyTop,
        });
        if (bossStomp) stompBoss(enemy); else hurtPlayer(enemy.x);
        continue;
      }
      const contact = heroCore.classifyEnemyContact(player, enemy, {
        routeHelper: enemy.routeHelper,
        previousBottom: player.previousBottom,
        previousTargetTop: previousEnemyTop,
      });
      if (!contact || stompResolvedThisFrame) continue;
      const stomp = contact === 'stomp';
      // Bounce-route enemies are traversal aids, not invisible walls. Passing
      // beside or rising through one is safe; descending onto it still gives
      // the full splat, boosted bounce, combo, and sound reward.
      if (enemy.routeHelper && !stomp) continue;
      if (stomp) {
        stompResolvedThisFrame = true;
        const playerCenter = player.x + player.w / 2;
        const enemyCenter = enemy.x + enemy.w / 2;
        enemy.perfectStomp = Math.abs(playerCenter - enemyCenter) <= Math.min(13, enemy.w * 0.28);
      }
      if (stomp || sharedAbilities.isFrenzy(game.abilities)) defeatEnemy(enemy, stomp); else hurtPlayer(enemy.x);
    }
  }

  function beginBossAttack(boss) {
    const attack = game.bossAttackIndex;
    game.bossAttackIndex += 1;
    if (game.bossHits === 0) startBossCharge(boss, false);
    else if (game.bossHits === 1) startBossAirStrike(boss, false);
    else if (attack % 2 === 0) startBossAirStrike(boss, true);
    else startBossCharge(boss, true);
    game.bossAttackCooldown = 4.5;
  }

  function updateBossBattle(dt) {
    game.bossPhaseBanner = Math.max(0, game.bossPhaseBanner - dt);
    game.bossFinalFocus = Math.max(0, game.bossFinalFocus - dt);
    game.bossCelebrationLock = Math.max(0, game.bossCelebrationLock - dt);
    if (game.bossKO) game.bossKO.timer = Math.max(0, game.bossKO.timer - dt);
    const boss = world.enemies.find((enemy) => enemy.boss && enemy.alive);
    if (!game.bossActive || game.bossDefeated || !boss) {
      game.bossHazards = [];
      return;
    }

    if (game.bossIntroTimer > 0) {
      boss.state = 'intro';
      boss.intangible = true;
    } else if (boss.state === 'intro') {
      boss.state = 'patrol';
      boss.intangible = false;
      game.bossAttackCooldown = Math.min(game.bossAttackCooldown, 0.65);
    }

    if (game.bossVulnerableTimer > 0) {
      game.bossVulnerableTimer = Math.max(0, game.bossVulnerableTimer - dt);
      game.bossStunTimer = Math.max(0, game.bossStunTimer - dt);
      if (game.bossVulnerableTimer === 0) {
        boss.state = game.bossHits >= 2 ? 'rage' : game.bossHits === 1 ? 'phase-break' : 'patrol';
        boss.intangible = false;
        game.bossAttackCooldown = 0.55;
        showMessage('EL GUACODILLO RECOVERED—DODGE THE NEXT ATTACK!', 1.15);
      }
    }

    if (boss.state === 'airstrike') {
      boss.airStrikeTimer = Math.max(0, boss.airStrikeTimer - dt);
      boss.airStrikeShotTimer -= dt;
      // Hover to the hero's left so the full phase artwork never fights the boss HUD.
      const hoverTarget = clamp(player.x - 180, BOSS_ARENA_LEFT + 200, BOSS_ARENA_RIGHT - 200);
      boss.x = lerp(boss.x, hoverTarget, Math.min(1, dt * 4.2));
      if (boss.shotsRemaining > 0 && boss.airStrikeShotTimer <= 0) {
        const targetX = clamp(player.x + player.vx * 0.32, BOSS_ARENA_LEFT + 90, BOSS_ARENA_RIGHT - 90);
        const flightTime = 0.94;
        const originX = boss.x + boss.w / 2;
        const originY = boss.y + 34;
        game.bossHazards.push({
          type: 'blob', x: originX, y: originY,
          vx: (targetX - originX) / flightTime, vy: -185,
          radius: game.bossHits >= 2 ? 18 : 15, life: 4, angle: boss.shotsRemaining * 0.7,
          spring: true, hitPlayer: false,
        });
        boss.shotsRemaining -= 1;
        boss.airStrikeShotTimer = game.bossHits >= 2 ? 0.34 : 0.46;
        playAudio('boss.elGuacodillo.guacShot', { combo: boss.shotsRemaining + 1, position: audioPosition(originX) });
      }
      if (boss.airStrikeTimer <= 0 && boss.shotsRemaining <= 0) {
        boss.state = game.bossHits >= 2 ? 'final-opening' : 'vulnerable-air';
        boss.openingElevated = true;
        boss.intangible = false;
        game.bossVulnerableTimer = game.bossHits >= 2 ? 3.5 : 3.25;
        game.bossStunTimer = game.bossVulnerableTimer;
        game.bossAttackCooldown = game.bossVulnerableTimer + 0.4;
        if (game.bossHits >= 2) game.bossFinalFocus = 1.25;
        showMessage(game.bossHits >= 2 ? 'FINAL OPENING! BOUNCE HIGH AND GUAC-KRAK!' : 'SPRING GUAC READY! BOUNCE UP FOR STOMP TWO!', 2.15);
        impactText(boss.x + boss.w / 2, 220, 'STOMP OPEN!', '#ffd65a', 36);
        playAudio('boss.elGuacodillo.vulnerable', { combo: game.bossHits + 1, position: audioPosition(boss.x + boss.w / 2) });
      }
    }

    if (boss.chargeWindup > 0) {
      const previous = boss.chargeWindup;
      boss.chargeWindup = Math.max(0, boss.chargeWindup - dt);
      if (previous > 0 && boss.chargeWindup === 0) {
        boss.chargeTimer = game.bossHits >= 2 ? 1.85 : 2.1;
        boss.state = 'charge';
        game.cameraShake = Math.max(game.cameraShake, 9);
        playAudio('boss.elGuacodillo.charge', { combo: game.bossHits + 1, position: audioPosition(boss.x + boss.w / 2) });
      }
    } else if (boss.state === 'charge') {
      boss.chargeTimer = Math.max(0, (boss.chargeTimer || 0) - dt);
      if (boss.chargeTimer === 0) {
        const remaining = boss.dir > 0 ? boss.maxX - boss.x : boss.x - boss.minX;
        if (remaining < 90) stunBossAfterCrash(boss);
        else boss.chargeTimer = 0.45;
      }
    }

    if (game.bossVulnerableTimer <= 0 && boss.state !== 'airstrike' && boss.state !== 'windup' && boss.state !== 'charge') {
      game.bossAttackCooldown -= dt;
      if (game.bossAttackCooldown <= 0 && boss.hitCooldown <= 0 && game.bossIntroTimer <= 0) beginBossAttack(boss);
    }

    game.bossHazards = game.bossHazards.filter((hazard) => {
      hazard.life -= dt;
      hazard.bounceCooldown = Math.max(0, (hazard.bounceCooldown || 0) - dt);
      if (hazard.type === 'blob') {
        hazard.x += hazard.vx * dt;
        hazard.y += hazard.vy * dt;
        hazard.vy += 880 * dt;
        hazard.angle += dt * 7;
        if (hazard.y + hazard.radius >= 412) {
          const closeDodge = !hazard.hitPlayer && Math.abs(hazard.x - (player.x + player.w / 2)) < 105;
          hazard.type = hazard.spring ? 'spring' : 'puddle'; hazard.y = 404; hazard.w = hazard.spring ? 104 : 86; hazard.h = 14; hazard.life = 3.6;
          spawnBurst(hazard.x - game.cameraX, hazard.y, '#8dff9c', 16);
          playAudio('hazard.guacLand', { position: audioPosition(hazard.x) });
          if (closeDodge) rewardBossDodge(hazard.x);
        }
      }
      const box = hazard.type === 'blob'
        ? { x: hazard.x - hazard.radius, y: hazard.y - hazard.radius, w: hazard.radius * 2, h: hazard.radius * 2 }
        : { x: hazard.x - hazard.w / 2, y: hazard.y - 7, w: hazard.w, h: hazard.h + 14 };
      if (hazard.life > 0 && intersects(player, box)) {
        if (hazard.type === 'spring' && hazard.bounceCooldown <= 0 && player.vy >= -40) {
          player.vy = -heroPhysics.enemyBounceVelocity * 1.12;
          player.grounded = false;
          hazard.bounceCooldown = 0.45;
          game.score += 100;
          impactText(hazard.x, hazard.y - 10, 'GUAC BOUNCE!', '#8dff9c', 24);
          playAudio('hazard.guacSpring', { position: audioPosition(hazard.x) });
        } else if (hazard.type === 'blob') {
          hazard.hitPlayer = true;
          hurtPlayer(hazard.x);
          hazard.life = 0;
        }
      }
      return hazard.life > 0 && hazard.x > 24700 && hazard.x < 28900;
    });
  }

  function updateStampede(dt) {
    const stampede = game.stampede;
    stampede.reactionTimer = Math.max(0, stampede.reactionTimer - dt);
    if (!stampede.done && !stampede.active && player.x > 5900 && player.x < 10800) {
      stampede.active = true;
      stampede.x = player.x - 430;
      stampede.speed = 176;
      showMessage('SALSA CANYON STAMPEDE! RUN OR BOUNCE!', 2.3);
      playAudio('hazard.stampedeStart', { position: -1 });
      game.stampedeLoop = audio?.startLoop('hazard.stampedeLoop', { position: -0.8 }) || null;
    }
    if (!stampede.active) return;
    stampede.speed = Math.min(232, stampede.speed + dt * 16);
    stampede.x += stampede.speed * dt;
    stampede.x = Math.max(stampede.x, player.x - 390);
    const distance = player.x - stampede.x;
    if (distance < 145 && player.invulnerable <= 0) stampede.nearMissArmed = true;
    if (stampede.nearMissArmed && distance > 225) {
      stampede.nearMissArmed = false;
      stampede.nearMisses += 1;
      stampede.reactionTimer = 1.65;
      stampede.reactionIndex = (stampede.nearMisses - 1) % 5;
      game.score += 350;
      showMessage(['TOO CLOSE! GUAC PACK PANIC!', 'NEAR MISS! HAT EMERGENCY!', 'GUAC PACK: “WAIT, COME BACK!”'][stampede.nearMisses % 3], 1.3);
      spawnChainTacos({ x: player.x, y: player.y, w: player.w, h: player.h }, 4);
      playAudio('hazard.nearMiss', { combo: stampede.nearMisses, position: -0.65 });
    }
    if (distance < 86) {
      hurtPlayer(stampede.x);
      stampede.x -= 210;
      stampede.nearMissArmed = false;
      showMessage('STAMPED-OH! KEEP MOVING!', 1.3);
    }
    if (player.x >= 10820) {
      stampede.active = false;
      stampede.done = true;
      if (game.stampedeLoop) audio?.stopLoop(game.stampedeLoop); game.stampedeLoop = null;
      game.score += 900;
      showMessage('STAMPede SERVED! +900', 1.8);
      spawnConfetti(canvas.width * 0.3, 210, 80);
      playAudio('hazard.stampedeEscape', { position: -0.5 });
    }
  }

  function updateCheckpoints() {
    for (const checkpoint of world.checkpoints) {
      if (checkpoint.activated || Math.abs(player.x - checkpoint.x) > 96) continue;
      checkpoint.activated = true;
      game.latestCheckpoint = checkpoint;
      game.score += 500;
      game.hearts = 3;
      const reaction = game.bestChain >= 8 ? 'OLIVIA: AIRBORNE MENACE CONFIRMED!'
        : game.perfectStomps >= 3 ? 'OLIVIA: NO CRUMBS!'
        : game.bestChain >= 5 ? 'OLIVIA: CRUNCH LEVELS RISING!'
        : 'OLIVIA: THE ROAD LOOKS WELL FED!';
      showMessage(`⚠ ${checkpoint.sign} ${reaction}`, 2.5);
      game.radioQueue = checkpoint.radio;
      game.radioDelay = 2.25;
      spawnConfetti(checkpoint.x - game.cameraX + 90, 245, 72);
      playAudio('checkpoint.activate', { position: audioPosition(checkpoint.x) });
    }
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
          item.vx = 0; item.vy = 0; item.dynamic = false;
          item.rewardFlight = null;
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
    if (sharedAbilities.hasMagnet(game.abilities)) {
      const radius = sharedAbilities.definitions.tacoMagnet.radius;
      for (const item of world.collectibles) {
        if (item.collected || item.type !== 'taco' || item.rewardFlight) continue;
        const dx = player.x + player.w / 2 - (item.x + item.w / 2);
        const dy = player.y + player.h / 2 - (item.y + item.h / 2);
        const distance = Math.hypot(dx, dy);
        if (distance > radius || distance < 1) continue;
        const pull = (1 - distance / radius) * 15 + 6;
        item.x += dx * dt * pull;
        item.y += dy * dt * pull;
      }
    }
    game.speedPads = game.speedPads.filter((pad) => {
      pad.life -= dt;
      if (player.grounded && player.x + player.w > pad.x && player.x < pad.x + pad.w) {
        player.vx = Math.max(player.vx, 390);
        if (!pad.used) { pad.used = true; showMessage('SALSA SLIDE! WHEEE!', 1); playAudio('movement.salsaSlide', { position: audioPosition(pad.x + pad.w / 2) }); }
      }
      return pad.life > 0;
    });
    game.springPads = game.springPads.filter((pad) => {
      pad.life -= dt;
      const feet = player.y + player.h;
      if (player.vy >= 0 && player.x + player.w > pad.x && player.x < pad.x + pad.w && feet > pad.y - 10 && feet < pad.y + 20) {
        player.vy = -760;
        player.grounded = false;
        showMessage('CHURRO SPRING!', 0.8);
        playAudio('movement.churroSpring', { position: audioPosition(pad.x + pad.w / 2) });
      }
      return pad.life > 0;
    });
  }

  function updatePlayer(dt) {
    if (sharedAbilities.suspendForTransformation(game.abilities, player)) return;
    const wasGrounded = player.grounded;
    if (player.grounded) sharedAbilities.land(game.abilities);
    if (player.grounded && player.platform) {
      player.x += player.platform.dx || 0;
      player.y += player.platform.dy || 0;
    }
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? heroPhysics.coyoteTime : Math.max(0, player.coyote - dt);

    const acceleration = player.grounded ? 1280 : 800;
    const maxSpeed = sharedAbilities.isFrenzy(game.abilities) ? 354 : 268;
    if (keys.left) { player.vx -= acceleration * dt; player.dir = -1; }
    if (keys.right) { player.vx += acceleration * dt; player.dir = 1; }
    if (!keys.left && !keys.right) player.vx *= player.grounded ? 0.79 : 0.94;
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

    if (previewAutoJump && player.grounded) {
      const lookAhead = player.x + player.w + 86;
      const supported = world.platforms.some((platform) => platform.y >= player.y + player.h - 20 && platform.y <= player.y + player.h + 90 && lookAhead >= platform.x && lookAhead <= platform.x + platform.w);
      const enemyAhead = world.enemies.some((enemy) => enemy.alive && enemy.x > player.x && enemy.x - player.x < 110);
      if (!supported || enemyAhead) queueJump();
    }

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -heroPhysics.jumpVelocity;
      player.grounded = false; player.coyote = 0; player.jumpBuffer = 0;
      playAudio('hero.jump', { position: audioPosition(player.x + player.w / 2) });
    } else if (player.jumpBuffer > 0 && !player.grounded) {
      const superJumpVelocity = sharedAbilities.trySuperJump(game.abilities, { position: audioPosition(player.x + player.w / 2) });
      if (superJumpVelocity) { player.vy = -superJumpVelocity; player.platform = null; player.jumpBuffer = 0; game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : 5); }
    }
    const previousY = player.y;
    player.previousY = previousY;
    player.previousBottom = previousY + player.h;
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const landingVelocity = player.vy;
    player.x = clamp(player.x, 0, WORLD_WIDTH - player.w);
    if (game.bossActive && !game.bossDefeated) {
      if (player.x < BOSS_ARENA_LEFT) {
        player.x = BOSS_ARENA_LEFT;
        player.vx = 120;
      }
      if (player.x > BOSS_ARENA_RIGHT) {
        player.x = BOSS_ARENA_RIGHT;
        player.vx = -150;
        showMessage(`ARENA LOCKED — CREATE THE NEXT STOMP OPENING! ${game.bossHits}/3`, 1.2);
      }
    }
    resolvePlatforms(previousY);
    if (player.grounded) sharedAbilities.land(game.abilities);
    if (!wasGrounded && player.grounded && landingVelocity > 90) {
      playAudio(landingVelocity >= 830 ? 'hero.landHard' : 'hero.landSoft', { position: audioPosition(player.x + player.w / 2) });
      game.fallSoundPlayed = false;
    }
    player.anim += dt * (Math.abs(player.vx) > 20 ? 11 : 4);
    if (player.y > canvas.height + 20 && !game.fallSoundPlayed) {
      game.fallSoundPlayed = true;
      playAudio('hero.fall', { position: audioPosition(player.x + player.w / 2) });
    }
    if (player.y > canvas.height + 70) {
      game.hearts -= 1;
      if (game.hearts <= 0) game.hearts = 3;
      beginRespawn();
    }
  }

  function maybeFinish() {
    if (game.state !== 'playing' || !game.bossDefeated || !intersects(player, world.goal)) return;
    game.state = 'celebrating';
    game.finishTime = performance.now();
    game.celebrationTime = 0;
    player.vx = 0; player.vy = 0;
    setMusic('fiesta');
    playAudio('goal.enter', { position: audioPosition(world.goal.x + world.goal.w / 2) });
    const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
    game.fiestaPower = clamp(game.hotSauce / game.totalHotSauce * 0.42 + Math.min(game.bestChain, 8) / 8 * 0.43 + (game.goldenSombrero ? 0.15 : 0), 0.2, 1);
    game.score += Math.round(3000 + completion * 2600 + game.hotSauce * 700 + game.bestChain * 160 + (game.bossDefeated ? 1800 : 0));
    showMessage(game.goldenSombrero ? 'CERTIFIED SALSA LEGEND!' : 'LOCAL TACO REFUSES TO TOUCH GRASS!', 4);
    spawnConfetti(canvas.width / 2, 150, game.reducedShake ? 80 : Math.round(120 + game.fiestaPower * 170));
    for (let index = 0; index < (game.reducedShake ? 4 : Math.round(6 + game.fiestaPower * 11)); index += 1) spawnFirework();
  }

  function presentResults() {
    playAudio('level.complete');
    const seconds = (game.finishTime - game.startTime) / 1000;
    const completion = game.totalCollectibles ? game.collected / game.totalCollectibles : 0;
    const medal = game.goldenSombrero ? 'GOLDEN SALSA LEGEND'
      : game.hotSauce === game.totalHotSauce && game.bestChain >= 8 && completion > 0.7 ? 'SALSA SUPREMACY'
      : game.bossDefeated && game.bestChain >= 5 ? 'SHOWDOWN STAR'
      : completion > 0.42 ? 'SPLAT SPECIALIST' : 'SPLAT STARTER';
    const previous = game.personalBest;
    const newBest = previous.runs === 0 || game.score > previous.score || seconds < previous.time;
    game.personalBest = {
      score: Math.max(previous.score || 0, game.score),
      time: previous.time <= 0 || seconds < previous.time ? seconds : previous.time,
      runs: (previous.runs || 0) + 1,
      medal: game.score >= (previous.score || 0) ? medal : previous.medal,
    };
    saveProgress(); updatePersonalBest();
    ui.medalBadge.textContent = 'TALLYING…';
    ui.resultScore.textContent = '0';
    ui.resultTime.textContent = formatTime(seconds);
    ui.resultTacos.textContent = `0/${game.totalCollectibles}`;
    ui.resultChain.textContent = '×0';
    ui.resultSauce.textContent = `0/${game.totalHotSauce}`;
    ui.resultBoss.textContent = '0/3';
    ui.winText.textContent = `You crossed all seven regions, splatted ${game.defeated}/${game.totalEnemies} enemies, and finished Sunset Salsa Showdown in ${formatTime(seconds)}.`;
    ui.newBestText.classList.toggle('hidden', !newBest);
    ui.winOverlay.classList.remove('hidden');
    ui.winOverlay.classList.add('visible');
    requestAnimationFrame(() => ui.winOverlay.querySelector('[data-next-level]')?.focus());
    game.state = 'won';
    const tallyStart = performance.now();
    const tally = (now) => {
      if (game.state !== 'won') return;
      const progress = clamp((now - tallyStart) / 1350, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      ui.resultScore.textContent = Math.round(game.score * eased).toLocaleString();
      ui.resultTacos.textContent = `${Math.round(game.collected * eased)}/${game.totalCollectibles}`;
      ui.resultChain.textContent = `×${Math.round(game.bestChain * eased)}`;
      ui.resultSauce.textContent = `${Math.round(game.hotSauce * eased)}/${game.totalHotSauce}`;
      ui.resultBoss.textContent = progress >= 1 && game.bossDefeated ? 'GUAC’D!' : `${Math.round(game.bossHits * eased)}/3`;
      if (progress < 1) requestAnimationFrame(tally);
      else {
        ui.medalBadge.textContent = medal;
        playAudio('ui.resultsReveal');
      }
    };
    requestAnimationFrame(tally);
  }

  function updateCelebration(dt) {
    game.celebrationTime += dt;
    player.anim += dt * 8;
    player.x = lerp(player.x, world.goal.x + 55, Math.min(1, dt * 2));
    game.cameraX = clamp(world.goal.x - canvas.width * 0.55, 0, WORLD_WIDTH - canvas.width);
    const beat = Math.floor(game.celebrationTime * 2.4);
    if (beat !== game.partyBeat) {
      game.partyBeat = beat;
      spawnConfetti(beat % 2 ? 110 : canvas.width - 110, 225, game.reducedShake ? 14 : 38);
      if ((!game.reducedShake || beat % 2 === 0) && seeded() < 0.35 + game.fiestaPower * 0.65) spawnFirework();
      playAudio('level.celebrationPulse', { combo: beat + 1, intensity: game.fiestaPower, position: beat % 2 ? -0.35 : 0.35 });
    }
    if (game.celebrationTime > (previewFastCelebrate ? 0.7 : 7.2)) presentResults();
  }

  function update(dt) {
    updateMusic(dt);
    if (game.settingsOpen) { updateParticles(dt * 0.15); return; }
    if (game.hitStop > 0) { game.hitStop = Math.max(0, game.hitStop - dt); updateParticles(dt * 0.2); return; }
    game.cameraShake = Math.max(0, game.cameraShake - dt * 42);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    game.chainTimer = Math.max(0, game.chainTimer - dt);
    game.chainTrailTimer = Math.max(0, game.chainTrailTimer - dt);
    game.bossIntroTimer = Math.max(0, game.bossIntroTimer - dt);
    game.gateUnlockTimer = Math.max(0, game.gateUnlockTimer - dt);
    if (game.radioQueue) {
      game.radioDelay = Math.max(0, game.radioDelay - dt);
      if (game.radioDelay === 0) {
        showMessage(`📻 OLIVIA: ${game.radioQueue}`, 3.2);
        game.radioQueue = '';
        playAudio('ui.radio');
      }
    }
    const magnetWasActive = sharedAbilities.hasMagnet(game.abilities);
    const frenzyWasActive = sharedAbilities.isFrenzy(game.abilities);
    sharedAbilities.update(game.abilities, dt);
    if (magnetWasActive && !sharedAbilities.hasMagnet(game.abilities)) playAudio('ability.magnetEnd');
    if (frenzyWasActive && !sharedAbilities.isFrenzy(game.abilities)) playAudio('ability.frenzyEnd');
    if (game.chainTimer <= 0) game.chainCount = 0;

    if (game.state === 'playing' || game.state === 'respawning') {
      game.levelTime += dt;
      updateMovingPlatforms(dt);
    }
    if (game.state === 'respawning') updateRespawn(dt);
    if (game.state === 'playing') {
      updatePlayer(dt);
      updateShowdownExploration(dt);
      updateDynamicItems(dt);
      updateEnemies(dt);
      updateBossBattle(dt);
      updateCheckpoints();
      updateStampede(dt);
      if (!game.bossActive && player.x > BOSS_TRIGGER_X) {
        finishExplorationInteractionForBoss();
        game.bossActive = true;
        game.bossIntroTimer = game.bossDefeated || previewBossAttack ? 0 : 2.35;
        game.bossAttackCooldown = previewBossAttack ? 0.08 : 1.45;
        const boss = world.enemies.find((enemy) => enemy.boss && enemy.alive);
        if (boss) {
          boss.state = game.bossHits >= 2 ? 'rage' : game.bossHits === 1 ? 'phase-break' : 'intro';
          boss.intangible = game.bossIntroTimer > 0;
        }
        if (previewBossAttack === 'volley') game.bossAttackIndex = 0;
        if (!game.bossDefeated) {
          game.bossPhaseTitle = game.bossHits >= 2 ? 'PHASE 3 • MAXIMUM GUAC RAGE' : game.bossHits === 1 ? 'PHASE 2 • GUAC AIR STRIKE' : 'PHASE 1 • THE GUAC CHARGE';
          game.bossPhaseBanner = 4.8;
          setMusic(game.bossHits >= 2 ? 'bossRage' : game.bossHits === 1 ? 'bossAir' : 'boss');
          showMessage('EL GUACODILLO — THREE OPENINGS. THREE STOMPS. ONE HUGE EGO.', 2.5);
          playAudio('boss.elGuacodillo.enter', { combo: game.bossHits + 1, position: audioPosition(boss?.x || BOSS_ARENA_RIGHT) });
        }
      }

      for (const item of world.collectibles) {
        if (!item.collected && !item.rewardFlight && intersects(player, item)) collectItem(item);
      }

      const nextSection = Math.max(0, sections.findIndex((section) => player.x >= section.start && player.x < section.end));
      if (nextSection !== game.sectionIndex) {
        game.sectionIndex = nextSection;
        const section = sections[nextSection];
        setMusic(section.music);
        const calls = ['CHAIN THE FIRST SPLATS!', 'OUTRUN THE GUAC PACK!', 'TAKE THE HIGH AWNINGS!', 'RIDE THE PARADE!', 'THREE STOMPS. NO NOTES.', 'THE VILLAGE CAME TO CHEER!', 'VICTORY FIESTA UNLOCKED!'];
        showMessage(`${section.name.toUpperCase()} — ${calls[nextSection]}`, 2.4);
        spawnConfetti(canvas.width * 0.6, 180, 56);
        if (section.id === 'victory') {
          playAudio('level.victoryDashStart');
        }
      }

      // Frame the chase with the hero right of center so the upgraded Guac
      // Pack remains visible instead of living just beyond the left edge.
      const followOffset = game.stampede.active ? 0.58 : 0.42;
      const boss = world.enemies.find((enemy) => enemy.boss && enemy.alive);
      const cameraTarget = game.bossIntroTimer > 0 && boss
        ? clamp(boss.x - canvas.width * 0.62, 0, WORLD_WIDTH - canvas.width)
        : clamp(player.x - canvas.width * followOffset, 0, WORLD_WIDTH - canvas.width);
      game.cameraX = lerp(game.cameraX, cameraTarget, Math.min(1, dt * (game.bossIntroTimer > 0 ? 4.5 : 9)));
      maybeFinish();
    }
    if (game.state === 'celebrating') updateCelebration(dt);
    updateShowdownExplorationCamera(dt);
    updateParticles(dt);
  }

  function spawnBurst(x, y, color, amount = 18) {
    for (let index = 0; index < amount; index += 1) {
      game.particles.push({
        x, y, vx: (seeded() - 0.5) * 270, vy: -50 - seeded() * 270,
        gravity: 570, life: 0.55 + seeded() * 0.75, size: 3 + seeded() * 6,
        color, star: index % 3 === 0,
      });
    }
  }

  function spawnConfetti(x, y, amount = 40) {
    const colors = ['#ffd65a', '#ff6fae', '#65d8ff', '#8dff9c', '#b78cff', '#fff4d0'];
    for (let index = 0; index < amount; index += 1) {
      game.confetti.push({
        x, y, vx: (seeded() - 0.5) * 430, vy: -110 - seeded() * 430,
        gravity: 720 + seeded() * 260, life: 1 + seeded() * 1.5,
        size: 4 + seeded() * 8, color: colors[index % colors.length],
        angle: seeded() * Math.PI * 2, spin: (seeded() - 0.5) * 12,
      });
    }
  }

  function spawnFirework() {
    const x = 110 + seeded() * 740;
    const y = 70 + seeded() * 180;
    const colors = ['#ffd65a', '#ff6fae', '#65d8ff', '#8dff9c', '#b78cff'];
    const color = colors[Math.floor(seeded() * colors.length)];
    for (let index = 0; index < 26; index += 1) {
      const angle = index / 26 * Math.PI * 2;
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
    game.bossShockwaves = game.bossShockwaves.filter((wave) => {
      wave.life -= dt;
      wave.radius += wave.speed * dt;
      return wave.life > 0;
    });
  }

  function visibleWorldX(x, width = 0, padding = 180) {
    const screenX = x - game.cameraX;
    return screenX + width > -padding && screenX < canvas.width + padding;
  }

  function drawStar(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let index = 0; index < 10; index += 1) {
      const angle = -Math.PI / 2 + index * Math.PI / 5;
      const r = index % 2 ? radius * 0.43 : radius;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (!index) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }

  function drawMercadoSkyline() {
    const palettes = [
      ['#b8736d', '#704159', '#d8b27d'], ['#9b6f78', '#5e4766', '#a7c9bf'],
      ['#7f8f91', '#42576a', '#d7c899'], ['#aa7667', '#6b4452', '#caa6a8'],
    ];
    ctx.save();
    const spacing = 360;
    const width = 236;
    const baseline = 418;
    ctx.globalAlpha = 0.42;
    for (let index = 0, worldX = 10800; worldX <= 18000; index += 1, worldX += spacing) {
      const x = worldX - game.cameraX;
      if (x + width < -260 || x > canvas.width + 260) continue;
      const palette = palettes[index % palettes.length];
      const h = 88 + index % 4 * 13;
      const y = baseline - h;
      const wall = ctx.createLinearGradient(x, y, x + width, baseline);
      wall.addColorStop(0, palette[0]); wall.addColorStop(1, palette[1]);
      ctx.fillStyle = wall; ctx.beginPath(); ctx.roundRect(x, y, width, h, 5); ctx.fill();
      ctx.fillStyle = palette[1]; ctx.beginPath(); ctx.moveTo(x - 8, y + 3); ctx.lineTo(x + width / 2, y - 28); ctx.lineTo(x + width + 8, y + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,225,180,.24)'; ctx.lineWidth = 1.5;
      for (let tile = 0; tile < 6; tile += 1) {
        ctx.beginPath(); ctx.arc(x + 22 + tile * 31, y + 1, 10, 0.12, Math.PI - 0.12); ctx.stroke();
      }
      for (let windowIndex = 0; windowIndex < 2; windowIndex += 1) {
        const wx = x + 48 + windowIndex * 100;
        ctx.fillStyle = palette[2]; ctx.fillRect(wx - 10, y + 38, 20, 26);
        ctx.strokeStyle = 'rgba(55,40,65,.55)'; ctx.lineWidth = 2; ctx.strokeRect(wx - 10, y + 38, 20, 26);
      }
      ctx.strokeStyle = 'rgba(55,40,65,.46)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 28, y + 76); ctx.lineTo(x + width - 28, y + 76); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPartySkyline() {
    ctx.save(); ctx.globalAlpha = 0.68; ctx.fillStyle = '#211c48';
    for (let index = 0, worldX = 28450; worldX <= 35900; index += 1, worldX += 230) {
      const x = worldX - game.cameraX;
      if (x < -220 || x > canvas.width + 220) continue;
      const h = 68 + index % 3 * 22;
      ctx.fillRect(x, 397 - h, 178, h);
      ctx.beginPath(); ctx.moveTo(x - 8, 397 - h); ctx.lineTo(x + 89, 362 - h); ctx.lineTo(x + 186, 397 - h); ctx.fill();
      ctx.fillStyle = index % 2 ? '#ffcc71' : '#65d8ff';
      ctx.fillRect(x + 34, 347, 10, 18); ctx.fillRect(x + 122, 347, 10, 18);
      ctx.fillStyle = '#211c48';
    }
    ctx.restore();
  }

  function drawBackground(time) {
    world1Background.draw({
      cameraX: game.cameraX,
      playerX: player.x,
      time: game.levelTime,
      reducedMotion: game.reducedShake,
      bossHits: game.bossHits,
      bossDefeated: game.bossDefeated,
    });
  }

  function drawGroundGlow(time) {
    const section = currentSection();
    if (section.id !== 'party' && section.id !== 'victory' && section.id !== 'boss') return;
    ctx.fillStyle = section.id === 'party' ? 'rgba(101,216,255,.08)' : section.id === 'victory' ? 'rgba(255,214,90,.08)' : 'rgba(183,140,255,.06)';
    for (let x = 0; x < canvas.width; x += 80) ctx.fillRect(x, 448 + Math.sin(time * 0.006 + x) * 2, 44, 5);
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

  function paintedTerrainForPlatform(platform) {
    if (platform.ground) {
      return {
        'sunset-dirt': images.world1_3_ground_gauntlet_v1,
        'canyon-dirt': images.world1_3_ground_stampede_v1,
        'market-dirt': images.world1_3_ground_mercado_v1,
        'parade-road': images.world1_3_ground_parade_v1,
        'midnight-dirt': images.world1_3_ground_boss_v1,
        'showdown-stage': images.world1_3_ground_boss_v1,
        'neon-road': images.world1_3_ground_victory_v1,
        'fiesta-road': images.world1_3_ground_fiesta_v1,
      }[platform.style] || images.world1_3_ground_gauntlet_v1;
    }
    if (platform.style === 'mesa') return images.world1_3_platform_mesa_v1;
    if (platform.style === 'canyon-sign') return images.world1_3_platform_canyon_v1;
    if (platform.style === 'awning') return images.world1_3_platform_awning_v1;
    if (platform.style === 'float') return images.world1_3_platform_float_v1;
    if (platform.style === 'neon-sign') return images.world1_3_platform_neon_v1;
    if (platform.style === 'light-rig') return images.world1_3_platform_lightrig_v1;
    if (platform.style === 'sign') {
      const section = currentSection(platform.x).id;
      if (section === 'mercado') return images.world1_3_platform_awning_v1;
      if (section === 'boss') return images.world1_3_platform_neon_v1;
      if (section === 'canyon') return images.world1_3_platform_canyon_v1;
      return images.world1_3_platform_mesa_v1;
    }
    return images.world1_3_platform_rainbow_v1;
  }

  function drawPhase2DestinationAsset(image, centerWorldX, bottomY, width, options = {}) {
    if (!image || !visibleWorldX(centerWorldX - width * .6, width * 1.2, 180)) return;
    const ratio = (image.naturalHeight || image.height) / (image.naturalWidth || image.width);
    const height = width * ratio;
    const x = centerWorldX - game.cameraX - width * .5;
    const y = bottomY - height;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = options.alpha ?? 1;
    if (options.glow) {
      ctx.shadowColor = options.glow;
      ctx.shadowBlur = options.glowBlur || 16;
    }
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
  }

  function drawExplorationNameplate(worldX, y, title, subtitle, accent, active) {
    if (!visibleWorldX(worldX - 125, 250, 100)) return;
    const x = worldX - game.cameraX;
    ctx.save();
    ctx.fillStyle = 'rgba(37,21,52,.91)'; ctx.strokeStyle = accent; ctx.lineWidth = active ? 4 : 2;
    ctx.shadowColor = accent; ctx.shadowBlur = active ? 16 : 5;
    ctx.beginPath(); ctx.roundRect(x - 122, y, 244, 48, 11); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff8df'; ctx.font = '900 12px Arial'; ctx.fillText(title, x, y + 19);
    ctx.fillStyle = accent; ctx.font = '900 9px Arial'; ctx.fillText(subtitle, x, y + 36);
    ctx.restore();
  }

  function drawPepperMineLift(time) {
    const entry = showdownExplorationPlan[0];
    if (!visibleWorldX(entry.routeRange[0], entry.routeRange[1] - entry.routeRange[0], 220)) return;
    const state = showdownExplorationEntryState(entry);
    const active = Boolean(state?.completed);
    drawPhase2DestinationAsset(images.world1_3_super_pepper_mine_lift_v1, 4800, GROUND_Y + 2, 420, { glow: active ? '#ffd65a' : null, glowBlur: active ? 16 : 0 });
    const wheelX = 4800 - game.cameraX + 72; const wheelY = 72;
    ctx.save(); ctx.translate(wheelX, wheelY); ctx.rotate(active ? time * .0017 : 0); ctx.strokeStyle = active ? '#65d8ff' : 'rgba(255,214,90,.32)'; ctx.lineWidth = 3; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = active ? 13 : 0;
    for (let spoke = 0; spoke < 6; spoke += 1) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(34, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 37, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    if (active && (state?.spectacleTimer || 0) > 0) {
      const intensity = clamp(state.spectacleTimer / state.spectacleMaxTimer, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,214,90,${.25 + intensity * .42})`; ctx.lineWidth = 3;
      for (let trail = 0; trail < 5; trail += 1) { ctx.beginPath(); ctx.arc(4800 - game.cameraX, 150, 48 + ((time * .06 + trail * 38) % 170), Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
      ctx.restore();
    }
    drawExplorationNameplate(4800, 98, 'PEPPER MINE LIFT', active ? 'HOIST DRIVE • ONLINE' : 'HOIST DRIVE • OFFLINE', active ? '#ffd65a' : '#ff8d57', active);
  }

  function drawSalsaSilo(time) {
    const entry = showdownExplorationPlan[1];
    if (!visibleWorldX(entry.routeRange[0], entry.routeRange[1] - entry.routeRange[0], 220)) return;
    const state = showdownExplorationEntryState(entry); const active = Boolean(state?.completed);
    drawPhase2DestinationAsset(images.world1_3_super_salsa_silo_v1, 13745, GROUND_Y + 2, 410, { glow: active ? '#ff6fae' : null, glowBlur: active ? 19 : 0 });
    const gaugeX = 13745 - game.cameraX + 5;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const pulse = active ? .66 + Math.sin(time * .011) * .2 : .2;
    ctx.fillStyle = `rgba(255,89,103,${pulse})`; ctx.shadowColor = '#ff6fae'; ctx.shadowBlur = active ? 22 : 8; ctx.fillRect(gaugeX - 8, 190, 16, 112);
    if (active) {
      const intensity = clamp((state?.spectacleTimer || 0) / Math.max(.01, state?.spectacleMaxTimer || 1), 0, 1);
      ['#65d8ff', '#ff6fae', '#ffd65a'].forEach((color, index) => { ctx.strokeStyle = color; ctx.globalAlpha = .25 + intensity * .5; ctx.lineWidth = 7 - index; ctx.beginPath(); ctx.moveTo(gaugeX - 40 + index * 35, 78); ctx.bezierCurveTo(gaugeX - 90 + index * 55, 28 - Math.sin(time * .012 + index) * 18, gaugeX - 80 + index * 70, -18, gaugeX - 25 + index * 35, -54); ctx.stroke(); });
    }
    ctx.restore();
    drawExplorationNameplate(13745, 98, 'SALSA SILO', active ? 'PRESSURE • PERFECT' : 'PRESSURE ARRAY • STANDBY', active ? '#ff6fae' : '#65d8ff', active);
  }

  function drawWantedTower(time) {
    const entry = showdownExplorationPlan[2];
    if (!visibleWorldX(entry.routeRange[0], entry.routeRange[1] - entry.routeRange[0], 220)) return;
    const state = showdownExplorationEntryState(entry); const active = Boolean(state?.completed);
    drawPhase2DestinationAsset(images.world1_3_super_wanted_tower_v1, 19265, GROUND_Y + 2, 420, { glow: active ? '#ff6fae' : null, glowBlur: active ? 17 : 0 });
    const posterX = 19246 - game.cameraX;
    ctx.save(); ctx.textAlign = 'center'; ctx.rotate(-.012); ctx.strokeStyle = '#5b2a41'; ctx.lineWidth = 4; ctx.fillStyle = '#7c2d3d'; ctx.font = '900 21px Arial'; ctx.strokeText('EL GUACADILLO', posterX, 228); ctx.fillText('EL GUACADILLO', posterX, 228); ctx.font = '900 31px Arial'; ctx.fillStyle = '#d83f3e'; ctx.strokeText('WANTED', posterX, 263); ctx.fillText('WANTED', posterX, 263); ctx.font = '900 11px Arial'; ctx.fillStyle = '#5b2a41'; ctx.fillText('3 STOMPS • HUGE EGO', posterX, 286); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let bulb = 0; bulb < 10; bulb += 1) { const bx = 19135 - game.cameraX + bulb * 29; ctx.fillStyle = ['#ff6fae', '#65d8ff', '#ffd65a'][bulb % 3]; ctx.globalAlpha = active ? .76 + Math.sin(time * .01 + bulb) * .2 : .23; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = active ? 12 : 3; ctx.beginPath(); ctx.arc(bx, 115 + Math.sin(bulb) * 5, active ? 4 : 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    drawExplorationNameplate(19265, 98, 'EL GUACADILLO WANTED TOWER', active ? 'BOUNTY LIGHTS • ACTIVE' : 'OUTLAW WATCH • DARK', active ? '#ff6fae' : '#ffd65a', active);
  }

  function drawOutlawStash(time) {
    const state = game.showdownExploration?.secret;
    if (!visibleWorldX(outlawStashPlan.routeRange[0], outlawStashPlan.routeRange[1] - outlawStashPlan.routeRange[0], 180)) return;
    const x = outlawStashPlan.rewardX - game.cameraX;
    ctx.save(); ctx.translate(x, 6);
    const reveal = state?.completed ? 1 : 0;
    ctx.globalAlpha = reveal ? 1 : .42 + Math.sin(time * .008) * .08;
    ctx.fillStyle = '#45284f'; ctx.strokeStyle = reveal ? '#ffd65a' : '#6f5a78'; ctx.lineWidth = reveal ? 4 : 2; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = reveal ? 22 : 5;
    ctx.beginPath(); ctx.roundRect(-64, 0, 128, 57, 11); ctx.fill(); ctx.stroke();
    ctx.fillStyle = reveal ? '#ffd65a' : '#887190'; ctx.fillRect(-56, 17, 112, 9); ctx.fillRect(-8, 4, 16, 49);
    ctx.fillStyle = '#2b1530'; ctx.beginPath(); ctx.arc(0, 29, 6, 0, Math.PI * 2); ctx.fill();
    if (reveal) { const beam = ctx.createLinearGradient(0, 6, 0, -120); beam.addColorStop(0, 'rgba(255,214,90,.62)'); beam.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(-48, 8); ctx.lineTo(-82, -120); ctx.lineTo(82, -120); ctx.lineTo(48, 8); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  function drawGuacLookout(time) {
    const entry = showdownExplorationPlan[3];
    if (!visibleWorldX(entry.routeRange[0], entry.routeRange[1] - entry.routeRange[0], 220)) return;
    const state = showdownExplorationEntryState(entry); const active = Boolean(state?.completed); const power = active ? 1 : state?.power || 0;
    drawPhase2DestinationAsset(images.world1_3_super_guac_lookout_v1, 24045, GROUND_Y + 2, 430, { glow: power > .4 ? '#9bef70' : null, glowBlur: 10 + power * 15 });
    const beaconX = 23955 - game.cameraX; const beaconY = 52;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(beaconX, beaconY); ctx.rotate(time * .0012); ctx.strokeStyle = `rgba(155,239,112,${.18 + power * .65})`; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-128, -20); ctx.moveTo(8, 0); ctx.lineTo(128, 20); ctx.stroke(); ctx.rotate(Math.PI / 2); ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-88, -12); ctx.moveTo(5, 0); ctx.lineTo(88, 12); ctx.stroke(); ctx.restore();
    drawExplorationNameplate(24045, 98, 'GUAC LOOKOUT', active ? 'RIDGE LINK • SECURED' : 'RIDGE LINK • STANDBY', active ? '#9bef70' : '#65d8ff', active);
  }

  function drawShowdownExplorationBackdrop(time) {
    drawPepperMineLift(time); drawSalsaSilo(time); drawWantedTower(time); drawOutlawStash(time); drawGuacLookout(time);
  }

  function drawShowdownExplorationAccents(time) {
    for (const platform of world.platforms) {
      if (!platform.phase2Pilot || !visibleWorldX(platform.x, platform.w, 70)) continue;
      const state = showdownExplorationEntryState(platform.phase2Discovery === outlawStashPlan.id ? outlawStashPlan : showdownExplorationPlan.find((entry) => entry.id === platform.phase2Discovery));
      const active = Boolean(state?.completed) || (state?.progress || 0) >= (platform.phase2Waypoint || 0);
      const accent = platform.phase2Discovery === 'guac-lookout' ? '#9bef70' : platform.phase2Discovery === 'salsa-silo' || platform.phase2Discovery === 'wanted-tower' ? '#ff6fae' : platform.phase2Discovery === outlawStashPlan.id ? '#ffd65a' : '#65d8ff';
      const x = platform.x - game.cameraX;
      ctx.save(); ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = active ? 13 : 4; ctx.globalAlpha = active ? .72 + Math.sin(time * .009 + platform.x) * .16 : platform.phase2Hidden ? .2 : .3;
      for (let bulb = 16; bulb < platform.w - 10; bulb += 29) { ctx.beginPath(); ctx.arc(x + bulb, platform.y + 5, active ? 3.1 : 2.1, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }

  function drawPlatform(platform, time) {
    if (!visibleWorldX(platform.x, platform.w, 90)) return;
    const x = Math.floor(platform.x - game.cameraX);
    const y = Math.floor(platform.y);
    const art = paintedTerrainForPlatform(platform);
    const artHeight = platform.ground ? Math.max(112, platform.h + 20) : Math.max(42, platform.h + 20);
    const artY = y - (platform.ground ? 6 : 5);
    const sourceWidth = art.naturalWidth || art.width;
    const sourceCap = Math.min(platform.ground ? 132 : 166, Math.floor(sourceWidth * .24));
    const smoothing = ctx.imageSmoothingEnabled;

    ctx.save();
    if (platform.phase2Hidden && !game.showdownExploration?.secret?.completed) ctx.globalAlpha = .58;
    ctx.beginPath();
    ctx.rect(x - 1, artY - 2, platform.w + 2, artHeight + 4);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    if (platform.secret) { ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 14; }
    drawPaintedTerrainSlice(art, x, artY, platform.w, artHeight, sourceCap);
    ctx.imageSmoothingEnabled = smoothing;
    ctx.restore();

    // The contact highlight belongs to the collision surface, not to a shadow
    // baked into the painting. That keeps every platform immediately readable.
    ctx.save();
    ctx.globalAlpha = platform.ground ? .72 : .6;
    const accent = {
      'parade-road': '#ffb7dd', 'midnight-dirt': '#c9a4ff', 'showdown-stage': '#c5ff67',
      'neon-road': '#76e9ff', 'fiesta-road': '#ffd877', 'awning': '#fff3c4',
      'float': '#ffd65a', 'neon-sign': '#ff75ba', 'light-rig': '#c5ff67',
    }[platform.style] || '#ffe5a2';
    ctx.fillStyle = accent;
    ctx.fillRect(Math.floor(x + 7), Math.floor(y), Math.max(0, platform.w - 14), 2);
    if (platform.moving) {
      const pulse = (Math.sin(time * .01 + platform.phase) + 1) * .5;
      ctx.globalAlpha = 1;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 9 + pulse * 6;
      ctx.fillStyle = '#fff8df';
      ctx.beginPath();
      ctx.arc(x + 12, y + platform.h * .58, 3 + pulse, 0, Math.PI * 2);
      ctx.arc(x + platform.w - 12, y + platform.h * .58, 4 - pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCollectible(item, time) {
    if (item.collected || !visibleWorldX(item.x, item.w, 70)) return;
    const x = item.x - game.cameraX;
    const y = item.y + Math.sin(time * 0.005 + item.bob) * 4;
    ctx.save(); ctx.translate(x + item.w / 2, y + item.h / 2);
    if (item.dynamic) ctx.rotate(item.angle || 0);
    if (item.type === 'taco') {
      if (item.rainbowReward) {
        ctx.shadowColor = '#65d8ff'; ctx.shadowBlur = 24;
        ['#65d8ff', '#ff6fae', '#ffd65a', '#9bef70'].forEach((color, index) => {
          ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = .82 - index * .12;
          ctx.beginPath(); ctx.arc(0, 3, 15 - index * 3, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        });
        ctx.globalAlpha = 1;
      } else if (item.bonusReward) { ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 16; }
      ctx.drawImage(images.items, 0, 0, 16, 16, -item.w / 2, -item.h / 2, item.w, item.h);
    } else if (item.type === 'magnet') {
      ctx.shadowColor = '#65d8ff'; ctx.shadowBlur = 20;
      ctx.strokeStyle = '#fff5c8'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(0, -2, 10, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = '#ff6fae'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-10, 11); ctx.moveTo(10, -2); ctx.lineTo(10, 11); ctx.stroke();
      ctx.fillStyle = '#65d8ff'; ctx.fillRect(-14, 8, 8, 6); ctx.fillRect(6, 8, 8, 6);
    } else if (item.type === 'sombrero') {
      const pulse = 1 + Math.sin(time * 0.012) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 28;
      ctx.fillStyle = '#ffd65a'; ctx.strokeStyle = '#5b2a41'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 8, 20, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, 5); ctx.quadraticCurveTo(0, -20, 13, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff6fae'; ctx.fillRect(-13, 0, 26, 5);
      drawStar(0, -7, 5, '#fff4d0');
    } else {
      ctx.shadowColor = '#ff6f55'; ctx.shadowBlur = 22;
      ctx.fillStyle = '#d83f3e'; ctx.beginPath(); ctx.roundRect(-9, -14, 18, 27, 5); ctx.fill();
      ctx.fillStyle = '#ffd65a'; ctx.fillRect(-7, -9, 14, 10);
      ctx.fillStyle = '#fff4d0'; ctx.font = '900 9px Arial'; ctx.textAlign = 'center'; ctx.fillText('HOT', 0, -1);
      ctx.fillStyle = '#65c76a'; ctx.fillRect(-5, -19, 10, 7);
    }
    ctx.restore();
  }

  function drawShowdownEyes(y, look = 0, worried = false) {
    ctx.fillStyle = '#fff8df'; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(-6, y, 5, worried ? 6 : 5, 0, 0, Math.PI * 2); ctx.ellipse(6, y, 5, worried ? 6 : 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2d1730'; ctx.beginPath(); ctx.arc(-6 + look, y + 1, 2, 0, Math.PI * 2); ctx.arc(6 + look, y + 1, 2, 0, Math.PI * 2); ctx.fill();
  }

  function drawShowdownShoes(step, color = '#ff6fae') {
    ctx.fillStyle = color; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(-10, -1 + step, 9, 4.5, -0.12, 0, Math.PI * 2); ctx.ellipse(10, -1 - step, 9, 4.5, 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff5d2'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-15, -1 + step); ctx.lineTo(-8, -1 + step); ctx.moveTo(7, -1 - step); ctx.lineTo(14, -1 - step); ctx.stroke();
  }

  function drawShowdownGlove(x, y, wave = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(wave);
    ctx.fillStyle = '#fff5d2'; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(-3, -10); ctx.moveTo(1, -4); ctx.lineTo(2, -10); ctx.stroke();
    ctx.restore();
  }

  function remasteredEnemyFrame(enemy) {
    if (enemy.defeated) return enemy.defeatTimer > 0.23 ? 6 : 7;
    if (enemy.type === 'mole' && (enemy.emergeAmount ?? 1) < 0.42) return 4;
    if (enemy.type === 'mole' && (enemy.emergeAmount ?? 1) < 0.75) return 5;
    if (enemy.telegraph) return 4;
    const airborneSpecial = (enemy.behaviorType === 'onion' || enemy.behaviorType === 'jalapeno')
      && enemy.y < enemy.baseY - 2;
    if (enemy.charging || enemy.rolling || airborneSpecial) return 5;
    return Math.floor(enemy.anim || 0) % 4;
  }

  function drawEnemy(enemy) {
    if (!enemy.alive || (enemy.visible === false && enemy.type !== 'mole') || !visibleWorldX(enemy.x, enemy.w, 90)) return;
    const x = enemy.x - game.cameraX;
    const bounce = Math.sin(enemy.clock * 5) * 1.8;
    const step = Math.sin(enemy.clock * 8) * 1.6;
    const groundY = enemy.baseY + enemy.h;
    ctx.save();
    ctx.globalAlpha = enemy.defeated ? 0.14 : 0.2; ctx.fillStyle = '#25152d'; ctx.beginPath(); ctx.ellipse(x + enemy.w / 2, groundY + 2, enemy.boss ? 43 : enemy.defeated ? 22 : 16, enemy.boss ? 8 : enemy.defeated ? 5 : 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    if (!enemy.defeated) heroCore.drawEnemyBehaviorSignals(ctx, enemy, x, { warningColor: '#ffd65a', chargeColor: '#ff6fae', rollColor: '#65d8ff' });
    ctx.save(); ctx.translate(x + enemy.w / 2, enemy.boss ? enemy.y + enemy.h + bounce : enemy.defeated ? groundY : enemy.y + enemy.h); ctx.scale(enemy.dir, 1);
    if (enemy.boss && (images.guacodilloActions || images.guacodillo)) {
      const actionSheet = images.guacodilloActions;
      const state = enemy.state || 'patrol';
      const actionFrames = {
        intro: 0, patrol: 0, rage: 4, windup: 1, charge: 2,
        airstrike: enemy.shotsRemaining > 0 ? 3 : 4,
        'vulnerable-air': 6, 'final-opening': 6, stunned: 6, 'phase-break': 6,
      };
      const targetFrame = actionFrames[state] ?? 0;
      if (enemy.artFrame == null) {
        enemy.artFrame = targetFrame;
        enemy.artPreviousFrame = targetFrame;
        enemy.artBlendStarted = enemy.clock;
      } else if (enemy.artFrame !== targetFrame) {
        enemy.artPreviousFrame = enemy.artFrame;
        enemy.artFrame = targetFrame;
        enemy.artBlendStarted = enemy.clock;
      }
      const frame = enemy.artFrame;
      const artBlend = clamp((enemy.clock - enemy.artBlendStarted) / 0.14, 0, 1);
      const rage = clamp(game.bossHits / 3, 0, 1);
      const motionRate = state === 'charge' ? 6.2 : state === 'airstrike' ? 2.8 : 2.15;
      const runBeat = Math.sin(enemy.clock * motionRate);
      let scaleX = 1 + runBeat * (state === 'charge' ? .038 : .012 + rage * .008);
      let scaleY = 1 - runBeat * (state === 'charge' ? .028 : .008 + rage * .006);
      let tilt = state === 'charge' ? runBeat * .024 : state === 'airstrike' ? Math.sin(enemy.clock * 2.8) * .045 : 0;
      if (state === 'windup') { scaleX = 1.09 + runBeat * .02; scaleY = .9 - runBeat * .014; tilt = -0.055 * enemy.dir; }
      if (game.bossVulnerableTimer > 0) tilt += Math.sin(enemy.clock * 8.5) * .022;
      ctx.rotate(tilt);
      ctx.scale(scaleX, scaleY);
      if (game.bossVulnerableTimer > 0) {
        ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 34;
        ctx.strokeStyle = '#fff5c8'; ctx.lineWidth = 5; ctx.setLineDash([10, 7]);
        ctx.beginPath(); ctx.ellipse(0, -78, 92, 78, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ffd65a'; ctx.font = '900 18px Arial'; ctx.textAlign = 'center'; ctx.fillText('STOMP NOW! ↓', 0, -188);
      } else if (enemy.state === 'windup' || enemy.state === 'charge') {
        ctx.shadowColor = '#ff6fae'; ctx.shadowBlur = 28;
      } else if (enemy.state === 'airstrike') {
        ctx.shadowColor = '#8dff9c'; ctx.shadowBlur = 32;
      }
      if (actionSheet) {
        const cellW = actionSheet.width / 4;
        const cellH = actionSheet.height / 2;
        // The action cells have different transparent padding. Offset only the
        // ground attacks so El Guacodillo's visible feet stay planted on the
        // showdown stage; genuine air attacks keep their authored height.
        const groundedAction = state !== 'airstrike' && state !== 'vulnerable-air'
          && !(state === 'final-opening' && enemy.openingElevated);
        const groundOffsets = [8, 18, 21, 0, 0, 0, 41, 0];
        const drawActionFrame = (frameIndex, alpha = 1, offsetX = 0, offsetY = 0) => {
          const sourceX = (frameIndex % 4) * cellW;
          const sourceY = Math.floor(frameIndex / 4) * cellH;
          const actionOffsetY = groundedAction ? groundOffsets[frameIndex] || 0 : 0;
          ctx.save();
          ctx.globalAlpha *= alpha;
          ctx.translate(offsetX, offsetY);
          ctx.drawImage(actionSheet, sourceX, sourceY, cellW, cellH, -112, -216 + actionOffsetY, 224, 224);
          ctx.restore();
        };
        if (state === 'charge') {
          for (let trail = 3; trail > 0; trail -= 1) {
            drawActionFrame(frame, .06 + trail * .045, -enemy.dir * trail * 25, trail * 2);
          }
        }
        if (artBlend < 1 && enemy.artPreviousFrame !== frame) drawActionFrame(enemy.artPreviousFrame, 1 - artBlend);
        drawActionFrame(frame, artBlend < 1 ? artBlend : 1);
      } else {
        const phase = Math.min(2, game.bossHits);
        const cell = images.guacodillo.width / 4;
        ctx.drawImage(images.guacodillo, phase * cell, 0, cell, images.guacodillo.height, -102, -185, 204, 204);
      }
      const sparkCount = state === 'rage' || game.bossHits >= 2 ? 5 : 3;
      for (let spark = 0; spark < sparkCount; spark += 1) {
        const angle = enemy.clock * (.72 + rage * .42) + spark * Math.PI * 2 / sparkCount;
        const radius = 90 + Math.sin(enemy.clock * 4 + spark) * 8;
        drawStar(Math.cos(angle) * radius, -96 + Math.sin(angle) * 52, 4 + (spark % 2) * 2, ['#ffd65a', '#65d8ff', '#ff6fae'][spark % 3]);
      }
      ctx.shadowBlur = 0;
      ctx.restore(); ctx.restore(); return;
    }
    if (game.chainTimer > 0 && !enemy.boss && !enemy.defeated && enemy.x > player.x && enemy.x - player.x < 560) {
      ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 20; ctx.strokeStyle = 'rgba(255,246,170,.82)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -enemy.h / 2, Math.max(enemy.w, enemy.h) * 0.64, 0, Math.PI * 2); ctx.stroke();
      const targets = world.enemies
        .filter((candidate) => candidate.alive && !candidate.boss && candidate.x > player.x && candidate.x - player.x < 560)
        .sort((a, b) => a.x - b.x).slice(0, 2);
      const targetIndex = targets.indexOf(enemy);
      if (targetIndex >= 0) {
        ctx.shadowBlur = 8; ctx.fillStyle = targetIndex === 0 ? '#ffd65a' : '#65d8ff';
        ctx.font = '900 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(`${targetIndex + 1} ↓`, 0, -enemy.h - 17);
      }
    }
    const sprite = images[enemySpriteArt[enemy.type]];
    if (sprite) {
      const columns = 4;
      const rows = 2;
      const sourceW = sprite.naturalWidth / columns;
      const sourceH = sprite.naturalHeight / rows;
      const frame = remasteredEnemyFrame(enemy);
      const artSize = enemyArtSizes[enemy.type] || 74;
      const emergeSink = enemy.type === 'mole' ? (1 - (enemy.emergeAmount ?? 1)) * artSize * 0.54 : 0;
      const baselineInset = (enemyFrameBottomInsets[enemy.type]?.[frame] || 0) * artSize / sourceH;
      if (enemy.rolling && enemy.type === 'guac') ctx.rotate(Math.sin(enemy.clock * 10) * 0.12);
      if (enemy.defeated) ctx.globalAlpha = clamp(enemy.defeatTimer / 0.16, 0, 1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        sprite,
        (frame % columns) * sourceW,
        Math.floor(frame / columns) * sourceH,
        sourceW,
        sourceH,
        -artSize / 2,
        -artSize + baselineInset + emergeSink,
        artSize,
        artSize,
      );
      ctx.restore(); ctx.restore(); return;
    }
    ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 3;
    if (enemy.type === 'slime') {
      drawShowdownShoes(step, '#65d8ff');
      ctx.fillStyle = '#72dc65'; ctx.beginPath(); ctx.moveTo(-20, -5); ctx.quadraticCurveTo(-20, -31, 0, -34); ctx.quadraticCurveTo(20, -31, 21, -5); ctx.quadraticCurveTo(10, 2, 0, -5); ctx.quadraticCurveTo(-10, 2, -20, -5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b7f59a'; ctx.beginPath(); ctx.ellipse(-7, -27, 5, 3, -0.5, 0, Math.PI * 2); ctx.fill();
      drawShowdownEyes(-19, enemy.dir > 0 ? 1 : -1); drawShowdownGlove(-22, -16, -0.5); drawShowdownGlove(22, -14, 0.6);
      ctx.fillStyle = '#2d1730'; ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI); ctx.stroke();
    } else if (enemy.type === 'knight') {
      drawShowdownShoes(step, '#ff6fae');
      ctx.fillStyle = '#f2c851'; ctx.beginPath(); ctx.moveTo(-18, -36); ctx.lineTo(16, -36); ctx.lineTo(21, -5); ctx.lineTo(-20, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe887'; ctx.beginPath(); ctx.moveTo(-18, -36); ctx.lineTo(1, -45); ctx.lineTo(18, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#65d8ff'; ctx.beginPath(); ctx.moveTo(-25, -34); ctx.lineTo(-5, -22); ctx.lineTo(-23, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff6fae'; ctx.beginPath(); ctx.arc(-18, -20, 4, 0, Math.PI * 2); ctx.fill();
      drawShowdownEyes(-25, -1, true); drawShowdownGlove(21, -18, 0.7);
      ctx.strokeStyle = '#2d1730'; ctx.beginPath(); ctx.moveTo(-2, -15); ctx.lineTo(8, -15); ctx.stroke();
    } else if (enemy.type === 'jalapeno') {
      drawShowdownShoes(step, '#ffd65a');
      ctx.save(); ctx.rotate(-0.2); ctx.fillStyle = '#ef594d'; ctx.beginPath(); ctx.ellipse(0, -22, 13, 20, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff8f63'; ctx.beginPath(); ctx.ellipse(-5, -30, 3.5, 7, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#70d867'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-2, -40); ctx.quadraticCurveTo(4, -49, 11, -41); ctx.stroke();
      ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, -33); ctx.lineTo(13, -33); ctx.stroke();
      drawShowdownEyes(-23, 1, true); ctx.restore(); drawShowdownGlove(-18, -20, -0.7); drawShowdownGlove(18, -22, 0.7);
    } else if (enemy.type === 'guac') {
      ctx.rotate(enemy.clock * enemy.dir * 2.4); ctx.fillStyle = '#87d85f'; ctx.beginPath(); ctx.arc(0, -20, 21, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b9ec73'; ctx.beginPath(); ctx.arc(-4, -24, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3b2f'; ctx.beginPath(); ctx.arc(3, -17, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#65d8ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -20, 25, -0.6, 0.6); ctx.stroke();
    } else if (enemy.type === 'churro') {
      drawShowdownShoes(step, '#65d8ff');
      ctx.fillStyle = '#d6904e'; ctx.beginPath(); ctx.roundRect(-13, -47, 26, 43, 10); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f5c677'; ctx.lineWidth = 3; for (let line = -8; line <= 8; line += 8) { ctx.beginPath(); ctx.moveTo(line, -42); ctx.lineTo(line, -9); ctx.stroke(); }
      ctx.fillStyle = '#fff0b7'; for (let sugar = 0; sugar < 9; sugar += 1) ctx.fillRect(-10 + (sugar * 7) % 19, -42 + (sugar * 11) % 30, 2, 2);
      drawShowdownEyes(-30, 0); drawShowdownGlove(-18, -26, -0.8); drawShowdownGlove(18, -24, 0.8);
      ctx.strokeStyle = '#2d1730'; ctx.beginPath(); ctx.arc(0, -20, 6, 0.15, Math.PI - 0.15); ctx.stroke();
    } else if (enemy.type === 'mole') {
      ctx.fillStyle = '#65d8ff'; ctx.beginPath(); ctx.ellipse(0, -2, 22, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7b5a48'; ctx.beginPath(); ctx.ellipse(0, -17, 18, 18, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd65a'; ctx.beginPath(); ctx.ellipse(0, -31, 23, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff6fae'; ctx.fillRect(-10, -39, 20, 9);
      drawShowdownEyes(-21, enemy.dir > 0 ? 1 : -1); ctx.fillStyle = '#2d1730'; ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -10); ctx.quadraticCurveTo(-9, -5, -13, -10); ctx.moveTo(3, -10); ctx.quadraticCurveTo(9, -5, 13, -10); ctx.stroke();
    } else {
      // El Guacodillo is a full neon-luchador spectacle: readable silhouette,
      // animated shell lights, star shades, hit gems, and escalating rage glow.
      ctx.save(); ctx.scale(enemy.dir, 1);
      const rage = clamp(game.bossHits / 3, 0, 1);
      const bossPulse = 1 + Math.sin(enemy.clock * (3.4 + rage * 3)) * (0.025 + rage * 0.02);
      ctx.scale(bossPulse, bossPulse);

      const aura = ctx.createRadialGradient(0, -42, 8, 0, -42, 92);
      aura.addColorStop(0, `rgba(255,214,90,${0.2 + rage * 0.24})`);
      aura.addColorStop(0.45, `rgba(255,111,174,${0.12 + rage * 0.18})`);
      aura.addColorStop(1, 'rgba(101,216,255,0)');
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, -42, 92, 0, Math.PI * 2); ctx.fill();

      // Boots and oversized champion gloves keep the form lively at game scale.
      ctx.fillStyle = '#ff6fae'; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.ellipse(-34, -4 + step, 20, 8, -0.12, 0, Math.PI * 2); ctx.ellipse(34, -4 - step, 20, 8, 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#65d8ff'; ctx.fillRect(-48, -8 + step, 25, 4); ctx.fillRect(23, -8 - step, 25, 4);
      drawShowdownGlove(-65, -41 + Math.sin(enemy.clock * 4) * 5, -0.9);
      drawShowdownGlove(65, -43 - Math.sin(enemy.clock * 4) * 5, 0.9);

      // Avocado-armadillo body with a warm inner glow.
      ctx.shadowColor = game.bossHits >= 2 ? '#ffd65a' : '#9bef70'; ctx.shadowBlur = 24 + rage * 22;
      const body = ctx.createLinearGradient(-58, -78, 52, -12);
      body.addColorStop(0, '#d4f47c'); body.addColorStop(0.45, '#82dc58'); body.addColorStop(1, '#42a953');
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -43, 62, 39, -0.03, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#e9ff9b'; ctx.beginPath(); ctx.ellipse(-16, -48, 38, 25, -0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#94602d'; ctx.beginPath(); ctx.arc(-7, -39, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a391f'; ctx.beginPath(); ctx.arc(-4, -37, 7, 0, Math.PI * 2); ctx.fill();

      // Rainbow shell plates light in sequence as the player scores hits.
      const shellColors = ['#65d8ff', '#b78cff', '#ff6fae', '#ffd65a', '#8dff9c', '#ff8d57'];
      for (let plate = 0; plate < 6; plate += 1) {
        const angle = -1.2 + plate * 0.42;
        const px = -20 + plate * 12;
        const py = -58 + Math.abs(plate - 2.5) * 5;
        ctx.save(); ctx.translate(px, py); ctx.rotate(angle * 0.22);
        ctx.fillStyle = shellColors[plate]; ctx.shadowColor = shellColors[plate]; ctx.shadowBlur = 8 + rage * 9;
        ctx.beginPath(); ctx.roundRect(-9, -13, 18, 24, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      }

      // Snout, star shades, grin, and sparkling gold tooth.
      ctx.fillStyle = '#75c94f'; ctx.beginPath(); ctx.ellipse(51, -40, 25, 18, 0.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4d2b29'; ctx.beginPath(); ctx.arc(69, -38, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d1730';
      [-1, 1].forEach((side) => { ctx.save(); ctx.translate(35 + side * 11, -57); drawStar(0, 0, 10, side < 0 ? '#65d8ff' : '#ff6fae'); ctx.restore(); });
      ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(21, -57); ctx.lineTo(57, -57); ctx.stroke();
      if (game.bossHits >= 1) {
        ctx.strokeStyle = '#fff5d2'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(38, -66); ctx.lineTo(44, -58); ctx.lineTo(39, -51); ctx.moveTo(52, -65); ctx.lineTo(47, -58); ctx.lineTo(53, -52); ctx.stroke();
      }
      ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(53, -34, 13, 0.18, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = '#ffd65a'; ctx.fillRect(52, -25, 7, 7);

      // Championship sombrero: taller, jeweled, and impossible to miss.
      ctx.save();
      if (game.bossHits >= 2) { ctx.translate(-7, 1); ctx.rotate(-0.16); }
      ctx.fillStyle = '#ff4f96'; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-39, -77); ctx.quadraticCurveTo(0, -118, 41, -76); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7b4bd4'; ctx.fillRect(-55, -80, 110, 13); ctx.strokeRect(-55, -80, 110, 13);
      for (let gem = 0; gem < 7; gem += 1) {
        ctx.fillStyle = shellColors[gem % shellColors.length]; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(-42 + gem * 14, -73, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.fillStyle = '#ffd65a'; drawStar(0, -96, 12, '#ffd65a');
      ctx.restore();

      // The nameplate and three hit gems form a clear mini-boss HUD in-world.
      ctx.fillStyle = 'rgba(43,21,48,.58)'; ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-74, -143, 148, 28, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6d5'; ctx.font = '900 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('EL GUACODILLO', 0, -124);
      for (let hit = 0; hit < 3; hit += 1) {
        ctx.fillStyle = hit < game.bossHits ? ['#65d8ff', '#ff6fae', '#ffd65a'][hit] : 'rgba(255,255,255,.18)';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = hit < game.bossHits ? 12 : 0;
        drawStar(-24 + hit * 24, -107, 7, ctx.fillStyle);
      }
      ctx.shadowBlur = 0; ctx.restore();
    }
    ctx.restore(); ctx.restore();
  }

  function checkpointArtForLook(look) {
    return {
      sun: images.world1_3_checkpoint_gauntlet_v1,
      radio: images.world1_3_checkpoint_canyon_v1,
      awning: images.world1_3_checkpoint_mercado_v1,
      parade: images.world1_3_checkpoint_parade_v1,
      neon: images.world1_3_checkpoint_showdown_v1,
    }[look] || images.world1_3_checkpoint_gauntlet_v1;
  }

  function drawCheckpoint(checkpoint, time) {
    if (!visibleWorldX(checkpoint.x, checkpoint.w, 300)) return;
    const x = checkpoint.x - game.cameraX;
    const art = checkpointArtForLook(checkpoint.look);
    const artWidth = 252;
    const artHeight = artWidth * ((art.naturalHeight || art.height) / (art.naturalWidth || art.width));
    const centerX = x + 116;
    const artX = centerX - artWidth * .5;
    const artY = GROUND_Y - artHeight + 2;
    const nearby = Math.abs((player.x + player.w * .5) - (checkpoint.x + 116)) < 280;
    const pulse = (Math.sin(time * (checkpoint.activated ? .012 : .007)) + 1) * .5;

    ctx.save();
    // Location-colored pull-offs live on the terrain surface. The art and its
    // tiny tire shadows are separate, so no painted ellipse can lift the truck.
    ctx.fillStyle = 'rgba(29,20,39,.66)';
    ctx.strokeStyle = checkpoint.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(artX - 12, GROUND_Y - 9, artWidth + 24, 12, 5);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(artX - 8, GROUND_Y - 7, artWidth + 16, 7, 3);
    ctx.clip();
    ctx.strokeStyle = checkpoint.accent;
    ctx.globalAlpha = .56;
    ctx.lineWidth = 3;
    for (let stripe = -artWidth; stripe < artWidth * 2; stripe += 24) {
      ctx.beginPath();
      ctx.moveTo(artX + stripe, GROUND_Y + 1);
      ctx.lineTo(artX + stripe + 13, GROUND_Y - 8);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(20,13,29,.48)';
    for (const wheelCenter of [.25, .77]) {
      ctx.beginPath();
      ctx.ellipse(artX + artWidth * wheelCenter, GROUND_Y - 1, 18, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = checkpoint.activated ? 1 : .95;
    ctx.shadowColor = checkpoint.accent;
    ctx.shadowBlur = checkpoint.activated ? 22 + pulse * 8 : nearby ? 11 + pulse * 4 : 3;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(art, artX, artY, artWidth, artHeight);
    ctx.shadowBlur = 0;

    if (nearby || checkpoint.activated) {
      const sweepX = artX + ((game.levelTime * (checkpoint.activated ? 68 : 34)) % artWidth);
      ctx.globalAlpha = checkpoint.activated ? .82 : .46;
      ctx.strokeStyle = checkpoint.activated ? '#fff5c8' : checkpoint.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sweepX - 28, artY + artHeight * .23);
      ctx.lineTo(sweepX + 28, artY + artHeight * .23);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const words = checkpoint.sign.split(' ');
    const midpoint = Math.ceil(words.length / 2);
    const signLines = checkpoint.sign.length > 31
      ? [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')]
      : [checkpoint.sign];
    const bubbleW = Math.min(318, Math.max(230, 72 + Math.max(...signLines.map((line) => line.length)) * 5.6));
    const bubbleH = signLines.length > 1 ? 51 : 37;
    const bubbleX = centerX - bubbleW * .5;
    const bubbleY = artY - bubbleH - 20;
    ctx.fillStyle = 'rgba(43,21,48,.96)';
    ctx.strokeStyle = checkpoint.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX + 32, bubbleY + bubbleH - 2);
    ctx.lineTo(centerX + 47, bubbleY + bubbleH + 14);
    ctx.lineTo(centerX + 56, bubbleY + bubbleH - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff5d2';
    ctx.font = '900 11px Arial';
    signLines.forEach((line, index) => ctx.fillText(line, centerX, bubbleY + 21 + index * 16));
    const nameW = Math.min(190, Math.max(118, checkpoint.name.length * 7.1));
    const nameY = artY - 17;
    ctx.fillStyle = 'rgba(31,18,39,.94)';
    ctx.strokeStyle = checkpoint.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(centerX - nameW * .5, nameY, nameW, 20, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = checkpoint.accent;
    ctx.font = '900 10px Arial';
    ctx.fillText(checkpoint.activated ? `✓ ${checkpoint.name.toUpperCase()}` : checkpoint.name.toUpperCase(), centerX, nameY + 14);
    ctx.restore();
  }

  function drawGuacPackMember(x, y, scale, phase, accent, leader = false, memberIndex = 0, airborne = false, groundOffset = 0) {
    const flightBob = airborne ? Math.sin(phase * .72) * 7 : 0;
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = airborne ? 0.16 : 0.3; ctx.fillStyle = '#25152d'; ctx.beginPath();
    ctx.ellipse(0, groundOffset + 1, airborne ? 22 : 31, airborne ? 4 : 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    if (airborne) {
      ctx.strokeStyle = 'rgba(255,245,204,.62)'; ctx.lineWidth = 3;
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.globalAlpha = .58 - ring * .14; ctx.beginPath();
        ctx.ellipse(-28 - ring * 15, 7 + flightBob, 18 + ring * 5, 7 + ring * 2, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.translate(0, flightBob); ctx.scale(scale, scale);

    if (images.guacPack) {
      const run = Math.sin(phase * 2.15 + memberIndex * .7);
      const cellW = images.guacPack.width / 3;
      const cellH = images.guacPack.height / 2;
      const sourceX = (memberIndex % 3) * cellW;
      const sourceY = Math.floor(memberIndex / 3) * cellH;
      const footInsets = [10, 11, 9, 16, 16];
      ctx.rotate(run * .065 - .035);
      ctx.scale(1 + Math.abs(run) * .045, 1 - Math.abs(run) * .035);
      ctx.shadowColor = accent; ctx.shadowBlur = leader ? 20 : 11;
      ctx.drawImage(images.guacPack, sourceX, sourceY, cellW, cellH, -52, -104 + footInsets[memberIndex], 104, 104);
      ctx.shadowBlur = 0;
      for (let crumb = 0; crumb < 3; crumb += 1) {
        ctx.globalAlpha = .38 - crumb * .09; ctx.fillStyle = crumb % 2 ? accent : '#ffd65a';
        ctx.beginPath(); ctx.arc(-43 - crumb * 12 - Math.abs(run) * 5, -4 - crumb * 6, 3 - crumb * .5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Speed shoes and white cartoon gloves make each pack member readable.
    ctx.fillStyle = accent; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(-17, 0, 14, 6, -0.12, 0, Math.PI * 2); ctx.ellipse(17, 0, 14, 6, 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawShowdownGlove(-35, -29 + Math.sin(phase) * 4, -0.9); drawShowdownGlove(35, -28 - Math.sin(phase) * 4, 0.9);

    // Armadillo shell with individual neon plates instead of plain circles.
    ctx.shadowColor = accent; ctx.shadowBlur = leader ? 20 : 10;
    const shell = ctx.createRadialGradient(-10, -34, 4, 0, -26, 36);
    shell.addColorStop(0, '#e1f789'); shell.addColorStop(0.48, '#82d85b'); shell.addColorStop(1, '#3d9b51');
    ctx.fillStyle = shell; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(-4, -27, 33, 28, -0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    const plates = ['#65d8ff', '#b78cff', '#ff6fae', '#ffd65a'];
    for (let plate = 0; plate < 4; plate += 1) {
      ctx.fillStyle = plates[(plate + Math.floor(phase * 0.8)) % plates.length];
      ctx.beginPath(); ctx.roundRect(-27 + plate * 13, -48 + Math.abs(plate - 1.5) * 3, 12, 31, 6); ctx.fill(); ctx.stroke();
    }

    // Avocado snout, goggles, determined grin, and a tiny gold tooth.
    ctx.fillStyle = '#aeea6d'; ctx.beginPath(); ctx.ellipse(26, -26, 20, 15, 0.04, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b382b'; ctx.beginPath(); ctx.arc(39, -23, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8df'; ctx.beginPath(); ctx.arc(16, -37, 7, 0, Math.PI * 2); ctx.arc(30, -36, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2d1730'; ctx.beginPath(); ctx.arc(18, -36, 3, 0, Math.PI * 2); ctx.arc(32, -35, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(7, -39); ctx.lineTo(39, -37); ctx.stroke();
    ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(28, -20, 9, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = '#ffd65a'; ctx.fillRect(28, -13, 5, 5);

    // Every member wears a different festival bandana; the leader gets a star crest.
    ctx.fillStyle = accent; ctx.beginPath(); ctx.moveTo(-30, -49); ctx.lineTo(28, -53); ctx.lineTo(22, -45); ctx.lineTo(-28, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-27, -47); ctx.lineTo(-40, -58); ctx.lineTo(-37, -41); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (leader) {
      ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 12; drawStar(-3, -61, 10, '#ffd65a'); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawStampede(time) {
    if (!game.stampede.active) return;
    const x = game.stampede.x - game.cameraX;
    ctx.save();

    // Warm dust stays behind the characters so their silhouettes remain crisp.
    const cloud = ctx.createLinearGradient(x - 230, 0, x + 150, 0);
    cloud.addColorStop(0, 'rgba(93,43,48,.06)'); cloud.addColorStop(0.55, 'rgba(210,105,65,.42)'); cloud.addColorStop(1, 'rgba(255,214,90,.18)');
    ctx.fillStyle = cloud;
    for (let index = 0; index < 9; index += 1) {
      ctx.beginPath(); ctx.arc(x - 150 + index * 35, 403 - index % 3 * 16, 36 + index % 2 * 14, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,240,188,.6)'; ctx.lineWidth = 4;
    for (let streak = 0; streak < 5; streak += 1) { ctx.beginPath(); ctx.moveTo(x - 235 - streak * 22, 340 + streak * 19); ctx.lineTo(x - 145 - streak * 13, 340 + streak * 19); ctx.stroke(); }

    GUAC_PACK_FORMATION.forEach((member, index) => {
      const reacting = game.stampede.reactionTimer > 0 && game.stampede.reactionIndex === index;
      const reactionProgress = reacting ? 1 - game.stampede.reactionTimer / 1.65 : 0;
      ctx.save();
      ctx.translate(x + member.dx, member.y);
      if (reacting) {
        ctx.rotate(index % 2 ? Math.sin(reactionProgress * Math.PI * 3) * 0.36 : reactionProgress * Math.PI * 2);
        ctx.scale(1 + Math.sin(reactionProgress * Math.PI) * 0.22, 1 - Math.sin(reactionProgress * Math.PI) * 0.12);
      }
      if (images.guacPackRemaster) {
        const cellW = images.guacPackRemaster.naturalWidth / 5;
        const cellH = images.guacPackRemaster.naturalHeight / 2;
        const runBeat = Math.sin(time * 0.014 + index * 0.92);
        const artSize = 142 * member.scale;
        const sourceY = reacting ? cellH : 0;
        const visibleBaselineInset = artSize * (16 / 192);
        ctx.rotate(reacting ? 0 : runBeat * 0.025);
        ctx.translate(0, reacting ? 0 : -Math.abs(runBeat) * 3.5);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(images.guacPackRemaster, index * cellW, sourceY, cellW, cellH, -artSize / 2, -artSize + visibleBaselineInset, artSize, artSize);
      } else {
        drawGuacPackMember(0, 0, member.scale, time * 0.0068 + index * 0.85, member.accent, member.leader, index, member.airborne, GROUND_Y - member.y);
      }
      if (reacting) {
        ctx.fillStyle = '#ffd65a'; ctx.font = '900 18px Arial'; ctx.textAlign = 'center';
        ctx.fillText(['BONK!', 'MY HAT!', 'ABORT!', 'WHEEE!', 'RUDE!'][index], 0, -82);
        drawStar(-29, -70, 7, '#65d8ff'); drawStar(29, -66, 6, '#ff6fae');
      }
      ctx.restore();
    });

    ctx.fillStyle = 'rgba(43,21,48,.9)'; ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - 78, 300, 156, 34, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff5d2'; ctx.font = '900 16px Arial'; ctx.textAlign = 'center';
    ctx.fillText(game.stampede.reactionTimer > 0 ? 'THE GUAC PACK PANICS!' : 'THE GUAC PACK', x, 323);
    ctx.restore();
  }

  function drawBossBattleEffects(time) {
    const gateX = 28720 - game.cameraX;
    const arenaLeftX = BOSS_ARENA_LEFT - game.cameraX;
    const arenaRightX = BOSS_ARENA_RIGHT - game.cameraX;
    if (game.bossActive || game.bossDefeated) {
      ctx.save();
      // Reactive arena lights intensify after each successful stomp.
      const lightColors = ['#65d8ff', '#b78cff', '#ff6fae', '#ffd65a', '#8dff9c'];
      for (let light = 0; light < 8; light += 1) {
        const worldX = BOSS_ARENA_LEFT + 170 + light * 470;
        const x = worldX - game.cameraX;
        if (x < -120 || x > canvas.width + 120) continue;
        const active = light % 3 <= game.bossHits;
        ctx.globalAlpha = active ? 0.2 + game.bossHits * 0.07 : 0.07;
        ctx.fillStyle = lightColors[light % lightColors.length];
        ctx.beginPath(); ctx.moveTo(x, 72); ctx.lineTo(x - 115, 412); ctx.lineTo(x + 115, 412); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = active ? 18 : 5;
        ctx.beginPath(); ctx.arc(x, 72, active ? 9 : 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      // Salsa barrels are clear charge targets, not hidden collision objects.
      [25300, 28330].forEach((barrelWorldX, index) => {
        const x = barrelWorldX - game.cameraX;
        if (x < -80 || x > canvas.width + 80) return;
        const wobble = game.bossVulnerableTimer > 0 ? Math.sin(time * 0.04 + index) * 0.08 : 0;
        ctx.save(); ctx.translate(x, 389); ctx.rotate(wobble);
        ctx.shadowColor = '#ff6fae'; ctx.shadowBlur = 16;
        ctx.fillStyle = '#d84c56'; ctx.strokeStyle = '#351b35'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(-26, -48, 52, 50, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd65a'; ctx.fillRect(-28, -39, 56, 8); ctx.fillRect(-28, -11, 56, 8);
        ctx.fillStyle = '#fff5d2'; ctx.font = '900 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('SALSA', 0, -20);
        ctx.restore();
      });
      if (!game.bossDefeated && images.villagers) {
        const cellW = images.villagers.width / 4;
        const cellH = images.villagers.height / 2;
        [24970, 28555].forEach((villagerWorldX, index) => {
          const x = villagerWorldX - game.cameraX;
          if (x < -90 || x > canvas.width + 90) return;
          const peek = 18 + game.bossHits * 13 + Math.sin(time * 0.006 + index) * 3;
          ctx.save(); ctx.globalAlpha = 0.72 + game.bossHits * 0.09;
          ctx.beginPath(); ctx.rect(x - 60, 300, 120, 112); ctx.clip();
          ctx.drawImage(images.villagers, index * cellW, 0, cellW, cellH, x - 38, 405 - peek, 76, 102);
          ctx.fillStyle = '#3a2854'; ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(x - 48, 397, 96, 25, 8); ctx.fill(); ctx.stroke();
          ctx.restore();
        });
      }
      ctx.restore();
    }
    if (game.bossKO?.timer > 0 && (images.guacodilloActions || images.guacodillo)) {
      const x = game.bossKO.x - game.cameraX;
      const settle = Math.min(1, (12 - game.bossKO.timer) / 0.65);
      const wobble = Math.sin((12 - game.bossKO.timer) * 8) * Math.max(0, 1 - settle) * .2;
      ctx.save(); ctx.translate(x, 414); ctx.rotate(wobble); ctx.scale(settle, settle);
      ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 28;
      if (images.guacodilloActions) {
        const cellW = images.guacodilloActions.width / 4;
        const cellH = images.guacodilloActions.height / 2;
        ctx.drawImage(images.guacodilloActions, cellW * 3, cellH, cellW, cellH, -122, -232, 244, 244);
      } else {
        const cell = images.guacodillo.width / 4;
        ctx.drawImage(images.guacodillo, cell * 3, 0, cell, images.guacodillo.height, -112, -215, 224, 224);
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff5d2'; ctx.strokeStyle = '#2b1530'; ctx.lineWidth = 6; ctx.font = '900 22px Arial'; ctx.textAlign = 'center';
      ctx.strokeText('THE GUAC GOT ROCKED', 0, -222); ctx.fillText('THE GUAC GOT ROCKED', 0, -222);
      ctx.restore();
    }
    if (game.bossDefeated && gateX > -280 && gateX < canvas.width + 280) {
      const progress = game.gateUnlockTimer > 0 ? clamp(1 - game.gateUnlockTimer / 12.5, 0, 1) : 1;
      const marqueePulse = 1 + Math.sin(time * 0.008) * 0.018;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      const rainbow = ['#65d8ff', '#b78cff', '#ff6fae', '#ffd65a', '#8dff9c'];
      for (let ring = 0; ring < rainbow.length; ring += 1) {
        ctx.strokeStyle = rainbow[ring]; ctx.lineWidth = 11 - ring;
        ctx.globalAlpha = 0.5 + progress * 0.25 - ring * 0.065;
        ctx.beginPath();
        ctx.ellipse(gateX + 28 + progress * 36, 325, 30 + ring * 14 + progress * 42, 98 + ring * 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const marqueeW = (350 + progress * 80) * marqueePulse;
      const marqueeH = marqueeW * 0.5;
      const marqueeX = gateX + 48 - marqueeW / 2;
      const marqueeY = 92 - progress * 12;
      ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 18 + progress * 24;
      ctx.drawImage(images.rainbowTunnel, marqueeX, marqueeY, marqueeW, marqueeH);
      ctx.shadowBlur = 0;
      const plaqueCenter = gateX + 48;
      const plaqueTop = marqueeY + marqueeH * 0.735;
      ctx.textAlign = 'center'; ctx.strokeStyle = '#24152f'; ctx.lineWidth = 3;
      ctx.fillStyle = '#fff8d8'; ctx.font = `900 ${12 + progress * 2}px Arial`;
      ctx.strokeText('RAINBOW VICTORY TUNNEL', plaqueCenter, plaqueTop + 18);
      ctx.fillText('RAINBOW VICTORY TUNNEL', plaqueCenter, plaqueTop + 18);
      ctx.fillStyle = '#ffd65a'; ctx.font = `900 ${9 + progress}px Arial`;
      ctx.fillText('EL GUACODILLO GOT COOKED', plaqueCenter, plaqueTop + 34);
      for (let sparkle = 0; sparkle < 7; sparkle += 1) {
        const angle = time * 0.0018 + sparkle * Math.PI * 2 / 7;
        drawStar(plaqueCenter + Math.cos(angle) * (155 + sparkle % 2 * 18), marqueeY + 82 + Math.sin(angle) * 54, 3 + (sparkle % 3), rainbow[sparkle % rainbow.length]);
      }
      ctx.restore();
    }
    if (!game.bossActive || game.bossDefeated) return;
    // Lock both arena exits so the battle remains a focused solo showdown.
    [arenaLeftX, arenaRightX].forEach((barrierX) => {
      if (barrierX < -80 || barrierX > canvas.width + 80) return;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      const pulse = 0.38 + Math.sin(time * 0.015 + barrierX) * 0.16;
      const barrier = ctx.createLinearGradient(barrierX - 28, 0, barrierX + 28, 0);
      barrier.addColorStop(0, 'rgba(101,216,255,0)'); barrier.addColorStop(.5, `rgba(255,111,174,${pulse})`); barrier.addColorStop(1, 'rgba(101,216,255,0)');
      ctx.fillStyle = barrier; ctx.fillRect(barrierX - 34, 172, 68, GROUND_Y - 172);
      ctx.restore();
    });
    if (gateX > -100 && gateX < canvas.width + 100) {
      ctx.save();
      const pulse = 0.55 + Math.sin(time * 0.014) * 0.22;
      ctx.globalCompositeOperation = 'screen';
      const barrier = ctx.createLinearGradient(gateX - 34, 0, gateX + 34, 0);
      barrier.addColorStop(0, 'rgba(101,216,255,0)'); barrier.addColorStop(0.48, `rgba(183,140,255,${pulse})`); barrier.addColorStop(0.52, `rgba(255,111,174,${pulse})`); barrier.addColorStop(1, 'rgba(101,216,255,0)');
      ctx.fillStyle = barrier; ctx.fillRect(gateX - 40, 170, 80, GROUND_Y - 170);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#3a2854'; ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(gateX - 25, 145, 50, 34, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff5d2'; ctx.font = '900 10px Arial'; ctx.textAlign = 'center'; ctx.fillText(`${game.bossHits}/3`, gateX, 167);
      for (let y = 188, index = 0; y < GROUND_Y; y += 27, index += 1) {
        ctx.strokeStyle = ['#65d8ff', '#b78cff', '#ff6fae'][index % 3]; ctx.lineWidth = 5; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(gateX - 17 - Math.sin(time * 0.012 + index) * 8, y); ctx.lineTo(gateX + 17 + Math.sin(time * 0.012 + index) * 8, y + 13); ctx.stroke();
      }
      ctx.shadowBlur = 0; ctx.restore();
    }

    const boss = world.enemies.find((enemy) => enemy.boss && enemy.alive);
    if (boss?.chargeWindup > 0) {
      const x = boss.x - game.cameraX + boss.w / 2;
      const warning = 1 - boss.chargeWindup / (boss.chargeWindupMax || 0.72);
      ctx.save(); ctx.strokeStyle = warning > 0.6 ? '#ff6fae' : '#ffd65a'; ctx.lineWidth = 5; ctx.setLineDash([10, 7]);
      ctx.beginPath(); ctx.ellipse(x, 402, 68 + warning * 35, 15 + warning * 5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    for (const hazard of game.bossHazards) {
      const x = hazard.x - game.cameraX;
      if (x < -100 || x > canvas.width + 100) continue;
      ctx.save();
      if (hazard.type === 'blob') {
        ctx.translate(x, hazard.y); ctx.rotate(hazard.angle);
        ctx.shadowColor = '#8dff9c'; ctx.shadowBlur = 14;
        const blob = ctx.createRadialGradient(-5, -7, 2, 0, 0, hazard.radius + 3);
        blob.addColorStop(0, '#e7ff8d'); blob.addColorStop(0.5, '#8de65f'); blob.addColorStop(1, '#3c9b50');
        ctx.fillStyle = blob; ctx.strokeStyle = '#2d1730'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#6f422b'; ctx.beginPath(); ctx.arc(3, 2, hazard.radius * 0.34, 0, Math.PI * 2); ctx.fill();
        drawStar(-hazard.radius * 0.45, -hazard.radius * 0.5, 4, '#ffd65a');
      } else {
        const fade = clamp(hazard.life / 3.2, 0, 1);
        ctx.globalAlpha = 0.5 + fade * 0.35; ctx.fillStyle = '#72db59'; ctx.strokeStyle = '#2d6f45'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, hazard.y, hazard.w / 2, 9 + Math.sin(time * 0.012 + x) * 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#caff82'; for (let bubble = 0; bubble < 3; bubble += 1) { ctx.beginPath(); ctx.arc(x - 24 + bubble * 24, hazard.y - 5 - Math.sin(time * 0.01 + bubble) * 3, 3 + bubble, 0, Math.PI * 2); ctx.fill(); }
        if (hazard.type === 'spring') {
          ctx.globalAlpha = fade; ctx.fillStyle = '#fff5d2'; ctx.strokeStyle = '#2b1530'; ctx.lineWidth = 4; ctx.font = '900 13px Arial'; ctx.textAlign = 'center';
          ctx.strokeText('BOUNCE! ↑', x, hazard.y - 19); ctx.fillText('BOUNCE! ↑', x, hazard.y - 19);
        }
      }
      ctx.restore();
    }
  }

  function drawPads(time) {
    for (const pad of game.speedPads) {
      if (!visibleWorldX(pad.x, pad.w, 40)) continue;
      const x = pad.x - game.cameraX;
      ctx.fillStyle = 'rgba(114,220,101,.72)'; ctx.beginPath(); ctx.ellipse(x + pad.w / 2, pad.y, pad.w / 2, 8 + Math.sin(time * 0.01) * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const pad of game.springPads) {
      if (!visibleWorldX(pad.x, pad.w, 40)) continue;
      const x = pad.x - game.cameraX;
      ctx.fillStyle = '#d6904e'; ctx.fillRect(x, pad.y, pad.w, 9); ctx.fillStyle = '#ffd65a'; ctx.fillRect(x + 8, pad.y + 2, pad.w - 16, 3);
    }
  }

  function drawVictoryVillagers(time) {
    for (const villager of world.villagers) {
      if (!visibleWorldX(villager.x, 210, 240)) continue;
      const x = villager.x - game.cameraX;
      const wave = Math.sin(time * 0.011 + villager.phase);
      const cheerFlex = 1 + Math.sin(time * 0.008 + villager.phase) * .014;
      ctx.save(); ctx.translate(x, GROUND_Y - 1);
      ctx.globalAlpha = game.bossDefeated ? 1 : 0.38;

      ctx.fillStyle = 'rgba(25,14,36,.36)'; ctx.beginPath(); ctx.ellipse(0, 1, 29, 7, 0, 0, Math.PI * 2); ctx.fill();
      const signWords = villager.sign.split(' ');
      const split = Math.ceil(signWords.length / 2);
      const lines = villager.sign.length > 22 ? [signWords.slice(0, split).join(' '), signWords.slice(split).join(' ')] : [villager.sign];
      const signW = Math.min(202, Math.max(138, Math.max(...lines.map((line) => line.length)) * 7.2 + 28));
      const signH = lines.length > 1 ? 48 : 34;
      const signY = -154 - wave * 3;
      const signFills = ['#fff1b8', '#dff8ff', '#ffe1f0', '#e8ffce', '#eee2ff'];
      ctx.save(); ctx.translate(0, signY + signH / 2); ctx.rotate(wave * 0.022);
      ctx.shadowColor = villager.color; ctx.shadowBlur = 10;
      ctx.fillStyle = signFills[villager.sprite % signFills.length]; ctx.strokeStyle = villager.color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(-signW / 2, -signH / 2, signW, signH, 8); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(108,59,50,.22)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-signW / 2 + 10, -signH / 2 + 8); ctx.lineTo(signW / 2 - 10, -signH / 2 + 5); ctx.stroke();
      ctx.fillStyle = '#6c3b32';
      ctx.beginPath(); ctx.arc(-signW / 2 + 10, 0, 2.5, 0, Math.PI * 2); ctx.arc(signW / 2 - 10, 0, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b203b'; ctx.font = '900 9.5px Arial'; ctx.textAlign = 'center';
      lines.forEach((line, index) => ctx.fillText(line, 0, -3 + (index - (lines.length - 1) / 2) * 14));
      ctx.restore();

      // Eight remastered locals supply distinct idle, wave, cheer, music,
      // flag, sign-lift, and boss-reaction silhouettes along the victory dash.
      const sprite = villager.sprite % 8;
      const cellW = images.villagers.width / 4;
      const cellH = images.villagers.height / 2;
      const sourceX = (sprite % 4) * cellW;
      const sourceY = Math.floor(sprite / 4) * cellH;
      const personW = villager.side === 'back' ? 88 : 96;
      const personH = villager.side === 'back' ? 117 : 128;
      const hop = [2, 5, 7].includes(sprite) ? Math.abs(wave) * 7 : 0;
      const sway = [0, 1, 3, 4, 6].includes(sprite) ? wave * 0.025 : 0;
      const visibleBottomInsets = [12, 29, 29, 12, 35, 70, 35, 31];
      const footInset = personH * (visibleBottomInsets[sprite] / 256);
      ctx.save();
      ctx.rotate(sway);
      ctx.scale(villager.sprite >= 8 ? -1 : 1, cheerFlex);
      ctx.drawImage(images.villagers, sourceX, sourceY, cellW, cellH, -personW / 2, -personH + footInset - hop, personW, personH);
      ctx.restore();

      if (villager.sprite % 3 === 0) drawStar(55, -100 + wave * 4, 5, villager.color);
      if (villager.sprite % 3 === 1) drawStar(-53, -92 - wave * 4, 4, '#ffd65a');
      ctx.restore();
    }
  }

  function drawGoal(time) {
    const x = world.goal.x - game.cameraX;
    if (x < -520 || x > canvas.width + 520) return;
    const approach = game.state === 'celebrating' || game.state === 'won' ? 1 : clamp(1 - (world.goal.x - player.x) / 1700, 0, 1);
    const pulse = (Math.sin(time * 0.01) + 1) * 0.5;
    const centerX = x + 74;
    const bannerW = 210 + approach * 115;
    const bannerH = bannerW * 0.5;
    const bannerY = 238 - approach * 92 - pulse * approach * 5;
    ctx.save();
    if (approach > 0.02) {
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(centerX, bannerY + bannerH / 2, 20, centerX, bannerY + bannerH / 2, 180 + approach * 130);
      glow.addColorStop(0, `rgba(255,214,90,${0.18 + approach * 0.42})`); glow.addColorStop(0.5, `rgba(255,94,156,${approach * 0.2})`); glow.addColorStop(1, 'rgba(101,216,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(centerX - 320, bannerY - 160, 640, 470);
      for (let beam = 0; beam < 7; beam += 1) {
        const angle = -1.25 + beam * 0.42 + Math.sin(game.levelTime * 1.5 + beam) * 0.04;
        ctx.strokeStyle = beam % 2 ? `rgba(101,216,255,${0.07 + approach * 0.18})` : `rgba(255,214,90,${0.07 + approach * 0.2})`;
        ctx.lineWidth = 7 + approach * 8; ctx.beginPath(); ctx.moveTo(centerX, bannerY + bannerH / 2); ctx.lineTo(centerX + Math.cos(angle) * (130 + approach * 120), bannerY + bannerH / 2 + Math.sin(angle) * (130 + approach * 120)); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    const leftPole = centerX - bannerW * 0.41; const rightPole = centerX + bannerW * 0.41;
    const pole = ctx.createLinearGradient(0, bannerY, 0, GROUND_Y); pole.addColorStop(0, '#fff5c8'); pole.addColorStop(0.28, '#ff9d55'); pole.addColorStop(1, '#62304b');
    ctx.fillStyle = pole; ctx.strokeStyle = '#2b1530'; ctx.lineWidth = 3;
    ctx.fillRect(leftPole, bannerY + 32, 11, GROUND_Y - bannerY - 32); ctx.strokeRect(leftPole, bannerY + 32, 11, GROUND_Y - bannerY - 32);
    ctx.fillRect(rightPole - 11, bannerY + 32, 11, GROUND_Y - bannerY - 32); ctx.strokeRect(rightPole - 11, bannerY + 32, 11, GROUND_Y - bannerY - 32);
    ctx.shadowColor = pulse > 0.5 ? '#fff5c8' : '#ff6fae'; ctx.shadowBlur = 16 + approach * 32;
    ctx.drawImage(images.fiestaBanner, centerX - bannerW / 2, bannerY, bannerW, bannerH); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff5d2'; ctx.strokeStyle = '#2b1530'; ctx.lineWidth = 5; ctx.textAlign = 'center';
    const bannerLine1 = game.goldenSombrero ? 'CERTIFIED SALSA' : 'LOCAL TACO REFUSES';
    const bannerLine2 = game.goldenSombrero ? 'LEGEND' : 'TO TOUCH GRASS';
    ctx.font = `900 ${13 + approach * 6}px Arial`; ctx.strokeText(bannerLine1, centerX, bannerY + bannerH * 0.53); ctx.fillText(bannerLine1, centerX, bannerY + bannerH * 0.53);
    ctx.font = `900 ${12 + approach * 6}px Arial`; ctx.strokeText(bannerLine2, centerX, bannerY + bannerH * 0.68); ctx.fillStyle = '#ffd65a'; ctx.fillText(bannerLine2, centerX, bannerY + bannerH * 0.68);
    for (let index = 0; index < 12; index += 1) {
      const bulbX = centerX - bannerW * 0.39 + index * (bannerW * 0.78 / 11); const bulbY = bannerY - 4 - Math.sin(index / 11 * Math.PI) * 8;
      ctx.fillStyle = ['#ff6fae', '#65d8ff', '#ffd65a', '#8dff9c'][(index + Math.floor(time * 0.008)) % 4]; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10 + approach * 9;
      ctx.beginPath(); ctx.arc(bulbX, bulbY, 3 + approach * 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    const partyTruckArt = images.world1_3_checkpoint_fiesta_v1;
    const partyTruckW = 320;
    const partyTruckH = partyTruckW * ((partyTruckArt.naturalHeight || partyTruckArt.height) / (partyTruckArt.naturalWidth || partyTruckArt.width));
    const partyTruckX = x + 176;
    const partyTruckY = GROUND_Y - partyTruckH + 2;
    ctx.fillStyle = 'rgba(20,13,29,.48)';
    for (const wheelCenter of [.25, .77]) {
      ctx.beginPath();
      ctx.ellipse(partyTruckX + partyTruckW * wheelCenter, GROUND_Y - 1, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(partyTruckArt, partyTruckX, partyTruckY, partyTruckW, partyTruckH);
    const dancerCount = Math.min(12, 2 + game.hotSauce + Math.floor(game.bestChain / 2));
    for (let dancer = 0; dancer < dancerCount; dancer += 1) {
      const dx = x - 25 + dancer * 42;
      const dy = GROUND_Y - 13 - Math.abs(Math.sin(time * 0.012 + dancer)) * 12;
      ctx.fillStyle = ['#ff6fae', '#65d8ff', '#ffd65a', '#8dff9c'][dancer % 4];
      ctx.beginPath(); ctx.arc(dx, dy - 16, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(dx, dy - 10); ctx.lineTo(dx, dy + 4); ctx.moveTo(dx, dy - 6); ctx.lineTo(dx - 8, dy - 15); ctx.moveTo(dx, dy - 6); ctx.lineTo(dx + 8, dy - 15); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer(time) {
    if (heroCore.hidePlayerDuringRespawn(game.respawn)) return;
    const frame = game.state === 'celebrating' || game.state === 'won' ? 7
      : player.invulnerable > 0 ? 6
      : !player.grounded ? (player.vy < 0 ? 4 : 5)
      : Math.abs(player.vx) > 24 ? 1 + Math.floor(player.anim) % 3 : 0;
    const running = frame >= 1 && frame <= 3;
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    const x = player.x - game.cameraX + player.w / 2;
    const y = player.y + player.h / 2;
    if (game.limeShield) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = '#9bef70'; ctx.shadowColor = '#9bef70'; ctx.shadowBlur = 17; ctx.lineWidth = 3;
      ctx.globalAlpha = .62 + Math.sin(time * .012) * .14; ctx.beginPath(); ctx.ellipse(x, y + 1, 30 + Math.sin(time * .009) * 2, 35, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = .36; ctx.strokeStyle = '#65d8ff'; ctx.beginPath(); ctx.ellipse(x, y + 1, 36, 28, Math.sin(time * .004) * .2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    sharedAbilities.drawHeroEffects(ctx, game.abilities, player, game.cameraX, time, { reducedMotion: game.reducedShake });
    if (game.chainTrailTimer > 0) {
      const trailColors = ['#65d8ff', '#b78cff', '#ff6fae', '#ffd65a', '#8dff9c'];
      for (let trail = 0; trail < trailColors.length; trail += 1) {
        ctx.globalAlpha = 0.32 - trail * 0.035; ctx.fillStyle = trailColors[trail];
        ctx.beginPath(); ctx.ellipse(x - player.dir * (20 + trail * 15), y + 9 + Math.sin(time * 0.014 + trail) * 5, 18 - trail * 1.5, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(player.rotation || 0); sharedAbilities.applyHeroVisualTransform(ctx, game.abilities, { direction: player.dir, baseScale: player.scale || 1, anchorY: 33, time });
    if (game.chainCount >= 3 || sharedAbilities.isFrenzy(game.abilities)) {
      const color = sharedAbilities.isFrenzy(game.abilities) ? '#65d8ff' : game.chainCount >= 5 ? '#ff6fae' : '#ffd65a';
      ctx.shadowColor = color; ctx.shadowBlur = sharedAbilities.isFrenzy(game.abilities) ? 30 : game.chainCount >= 5 ? 24 : 14;
      ctx.strokeStyle = color; ctx.globalAlpha = 0.72; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 27, 25 + Math.sin(time * 0.014) * 2, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    sharedAbilities.applyHeroStyle(ctx, game.abilities);
    sharedAbilities.drawHeroSpriteFrame(ctx, game.abilities, images.hero, frame, { x: -33, y: -33, width: 66, height: 66, running, animation: player.anim });
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const wave of game.bossShockwaves) {
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      const x = wave.x - game.cameraX;
      const colors = ['#65d8ff', '#ff6fae', '#ffd65a', '#8dff9c', '#b78cff'];
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let ring = 0; ring < Math.min(colors.length, 2 + wave.strength); ring += 1) {
        const ringRadius = Math.max(2, wave.radius - ring * 13);
        ctx.globalAlpha = alpha * (0.48 - ring * 0.055);
        ctx.strokeStyle = colors[ring]; ctx.lineWidth = Math.max(2, 9 - ring);
        ctx.beginPath(); ctx.ellipse(x, wave.y, ringRadius, ringRadius * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
    for (const particle of game.particles) {
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      if (particle.star) drawStar(particle.x, particle.y, particle.size, particle.color);
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
      ctx.strokeStyle = '#2b1530'; ctx.lineWidth = 5; ctx.strokeText(text.text, x, text.y); ctx.fillStyle = text.color; ctx.fillText(text.text, x, text.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawProgress() {
    const x = 370, y = 18, width = 375;
    ctx.fillStyle = 'rgba(43,21,48,.34)'; ctx.beginPath(); ctx.roundRect(x, y, width, 71, 20); ctx.fill(); ctx.strokeStyle = 'rgba(255,214,90,.4)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.17)'; ctx.fillRect(x + 18, y + 17, width - 36, 8);
    ctx.fillStyle = sections[game.sectionIndex]?.accent || '#ffd65a'; ctx.fillRect(x + 18, y + 17, (width - 36) * clamp(player.x / WORLD_WIDTH, 0, 1), 8);
    sections.forEach((section, index) => {
      const dotX = x + 18 + (width - 36) * section.start / WORLD_WIDTH;
      ctx.fillStyle = index <= game.sectionIndex ? section.accent : '#765f7c'; ctx.beginPath(); ctx.arc(dotX, y + 21, 7, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#fff5d2'; ctx.textAlign = 'center'; ctx.font = '900 12px Arial'; ctx.fillText(sections[game.sectionIndex]?.name || 'Sunset Salsa Showdown', x + width / 2, y + 49);
    ctx.fillStyle = 'rgba(255,255,255,.68)'; ctx.font = '900 9px Arial'; ctx.fillText(`${Math.round(player.x).toLocaleString()} / ${WORLD_WIDTH.toLocaleString()}`, x + width / 2, y + 64);
  }

  function drawShowdownExplorationCompletionBanner(time) {
    const banner = game.showdownExploration?.completionBanner;
    if (!banner) return;
    const enter = clamp((banner.maxTimer - banner.timer) / .22, 0, 1);
    const exit = clamp(banner.timer / .34, 0, 1);
    const visibility = Math.min(enter, exit);
    const secret = banner.mode === 'secret';
    const compactDisplay = canvas.getBoundingClientRect().width < 520;
    const width = Math.min(compactDisplay ? (secret ? 840 : 700) : (secret ? 700 : 545), canvas.width - (compactDisplay ? 48 : secret ? 58 : 130));
    const height = compactDisplay ? (secret ? 160 : 116) : (secret ? 138 : 94);
    const x = (canvas.width - width) * .5;
    const y = canvas.height - height - (compactDisplay ? 18 : 28);
    const accent = secret ? '#ffd65a' : banner.mode === 'pressure-spectacle' || banner.mode === 'boss-foreshadowing' ? '#ff6fae' : banner.mode === 'character-preparation' ? '#9bef70' : '#65d8ff';
    ctx.save(); ctx.globalAlpha = visibility; ctx.translate(canvas.width * .5, y + height * .5);
    if (!game.reducedShake) { const pop = (secret ? .9 : .96) + enter * (secret ? .1 : .04) + Math.sin(time * .015) * (secret ? .012 : .004); ctx.scale(pop, pop); }
    ctx.translate(-canvas.width * .5, -(y + height * .5));
    const panel = ctx.createLinearGradient(x, y, x + width, y + height); panel.addColorStop(0, secret ? 'rgba(51,25,70,.98)' : 'rgba(43,21,48,.94)'); panel.addColorStop(.5, secret ? 'rgba(132,57,67,.99)' : 'rgba(91,45,76,.95)'); panel.addColorStop(1, secret ? 'rgba(27,91,98,.98)' : 'rgba(29,75,88,.94)');
    ctx.fillStyle = panel; ctx.strokeStyle = accent; ctx.lineWidth = secret ? 5 : 3; ctx.shadowColor = accent; ctx.shadowBlur = secret ? 28 : 14; ctx.beginPath(); ctx.roundRect(x, y, width, height, secret ? 23 : 17); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    if (secret) { for (let index = 0; index < 10; index += 1) { const sx = x + 36 + index * (width - 72) / 9; const sy = y + 20 + Math.sin(time * .012 + index) * 6; ctx.fillStyle = ['#ffd65a', '#ff6fae', '#65d8ff'][index % 3]; ctx.save(); ctx.translate(sx, sy); ctx.rotate(index * .7); ctx.fillRect(-6, -2, 12, 4); ctx.fillRect(-2, -6, 4, 12); ctx.restore(); } }
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff1a6'; ctx.font = `900 ${compactDisplay ? secret ? 17 : 15 : secret ? 13 : 11}px Arial`; ctx.fillText(banner.eyebrow, canvas.width * .5, y + (compactDisplay ? secret ? 31 : 27 : secret ? 28 : 21));
    ctx.fillStyle = '#fff9ed'; ctx.font = `900 ${compactDisplay ? secret ? 39 : banner.title.length > 25 ? 29 : 33 : secret ? 33 : banner.title.length > 25 ? 23 : 27}px Arial`; ctx.fillText(banner.title, canvas.width * .5, y + (compactDisplay ? secret ? 82 : 65 : secret ? 71 : 52));
    ctx.fillStyle = accent; ctx.font = `900 ${compactDisplay ? secret ? 19 : 17 : secret ? 15 : 13}px Arial`; ctx.fillText(banner.reward, canvas.width * .5, y + (compactDisplay ? secret ? 127 : 99 : secret ? 109 : 79)); ctx.restore();
  }

  function drawOliviaLookoutTransmission(time) {
    const transmission = game.showdownExploration?.transmission;
    if (!transmission) return;
    const elapsed = transmission.maxTimer - transmission.timer;
    const visibility = clamp(Math.min(elapsed / .18, transmission.timer / .32), 0, 1);
    const compactDisplay = canvas.getBoundingClientRect().width < 520;
    const width = Math.min(compactDisplay ? 790 : 560, canvas.width - 38);
    const height = compactDisplay ? 154 : 124;
    const x = canvas.width - width - 19;
    const y = 94;
    const portraitWidth = compactDisplay ? 138 : 118;
    const portraitHeight = compactDisplay ? 112 : 94;
    const textX = x + portraitWidth + (compactDisplay ? 34 : 26);
    ctx.save(); ctx.globalAlpha = visibility;
    if (!game.reducedShake) ctx.translate((1 - smoothstep(clamp(elapsed / .34, 0, 1))) * 18, 0);
    const panel = ctx.createLinearGradient(x, y, x + width, y + height); panel.addColorStop(0, 'rgba(24,20,54,.98)'); panel.addColorStop(.55, 'rgba(50,32,74,.98)'); panel.addColorStop(1, 'rgba(30,91,73,.98)');
    ctx.fillStyle = panel; ctx.strokeStyle = '#9bef70'; ctx.lineWidth = 3; ctx.shadowColor = '#9bef70'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.roundRect(x, y, width, height, 18); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x + 10, y + 10, portraitWidth, portraitHeight, 13); ctx.clip(); ctx.fillStyle = '#15152f'; ctx.fillRect(x + 10, y + 10, portraitWidth, portraitHeight);
    if (images.world1_1_taco_trekker_olivia_v1) ctx.drawImage(images.world1_1_taco_trekker_olivia_v1, x + 8, y + 6, portraitWidth + 14, portraitHeight + 12); ctx.restore();
    ctx.strokeStyle = '#65d8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 10, y + 10, portraitWidth, portraitHeight, 13); ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = '#9bef70'; ctx.font = `900 ${compactDisplay ? 15 : 11}px Arial`; ctx.fillText(`${transmission.speaker} • ${transmission.channel}`, textX, y + (compactDisplay ? 28 : 22));
    ctx.fillStyle = '#fff8ea'; ctx.font = `800 ${compactDisplay ? 19 : 15}px Arial`; ctx.fillText('“Trouble’s right over that ridge.', textX, y + (compactDisplay ? 62 : 50)); ctx.fillText('Take this. You’ll want some lime.”', textX, y + (compactDisplay ? 88 : 72));
    ctx.fillStyle = transmission.rewardVisible ? '#ffd65a' : '#65d8ff'; ctx.font = `900 ${compactDisplay ? 14 : 11}px Arial`; ctx.fillText(transmission.rewardVisible ? 'REWARD • LIME SHIELD • SHOWDOWN READY' : 'LOOKOUT LINK • OLIVIA CONNECTED', textX, y + (compactDisplay ? 125 : 101));
    for (let bar = 0; bar < 5; bar += 1) { const pulse = (Math.sin(time * .012) + 1) * 2.7; ctx.fillStyle = pulse > bar ? '#9bef70' : 'rgba(255,255,255,.2)'; ctx.fillRect(x + width - 68 + bar * 10, y + 14 - bar * 2, 6, 5 + bar * 2); }
    ctx.restore();
  }

  function drawHUD(time) {
    ctx.save();
    if (game.bossFinalFocus > 0) {
      const focus = clamp(game.bossFinalFocus / 1.4, 0, 1);
      ctx.strokeStyle = `rgba(255,214,90,${0.38 + focus * 0.42})`; ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
      ctx.fillStyle = `rgba(255,111,174,${0.04 + focus * 0.05})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = 'rgba(43,21,48,.36)'; ctx.fillRect(14, 14, 330, 151);
    ctx.strokeStyle = 'rgba(255,214,90,.4)'; ctx.strokeRect(14, 14, 330, 151);
    ctx.fillStyle = '#fff5d2'; ctx.font = '900 22px Arial'; ctx.fillText('World 1-3 • Salsa Showdown', 26, 42);
    ctx.font = '18px Arial'; ctx.fillText(`Score: ${game.score.toLocaleString()}`, 26, 71); ctx.fillText(`Tacos: ${game.collected}/${game.totalCollectibles}`, 26, 98);
    ctx.fillStyle = '#ffd65a'; ctx.font = '900 13px Arial'; ctx.fillText(`Hot Sauce ${game.hotSauce}/${game.totalHotSauce}  •  Splats ${game.defeated}`, 26, 122);
    sharedAbilities.drawTacoPowerHUD(ctx, game.abilities, { x: 99, y: 134, width: 232, height: 11, labelX: 26, labelY: 144, textColor: '#fff5d2' });
    if (sharedAbilities.hasMagnet(game.abilities)) { ctx.fillStyle = '#65d8ff'; ctx.fillText(`MAGNET ${Math.ceil(game.abilities.magnetTimer)}s`, 26, 158); }
    drawProgress();
    for (let index = 0; index < 3; index += 1) {
      const x = 920 - index * 33;
      ctx.fillStyle = index < game.hearts ? '#ff6fae' : 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(x, 34, 9, 0, Math.PI * 2); ctx.arc(x - 8, 27, 7, 0, Math.PI * 2); ctx.arc(x + 8, 27, 7, 0, Math.PI * 2); ctx.lineTo(x, 49); ctx.fill();
    }
    ctx.textAlign = 'right'; ctx.font = '900 15px Arial';
    if (sharedAbilities.isFrenzy(game.abilities)) { ctx.fillStyle = '#65d8ff'; ctx.fillText(`TACO FRENZY ${Math.ceil(game.abilities.frenzyTimer)}s`, 936, 60); }
    if (sharedAbilities.hasMagnet(game.abilities)) { ctx.fillStyle = '#ffd65a'; ctx.fillText(`TACO MAGNET ${Math.ceil(game.abilities.magnetTimer)}s`, 936, 82); }
    if (game.limeShield) { ctx.fillStyle = '#9bef70'; ctx.fillText('LIME SHIELD • READY', 936, 104); }
    if (game.chainCount > 0) {
      ctx.fillStyle = game.chainCount >= 5 ? '#ff6fae' : '#ffd65a';
      const chainLabel = game.chainCount >= 8 ? `SALSA SUPREMACY ×${game.chainCount}`
        : game.chainCount >= 5 ? `RAINBOW RAMPAGE ×${game.chainCount}`
        : `SPLAT CHAIN ×${game.chainCount}`;
      ctx.fillText(chainLabel, 936, game.limeShield ? 126 : 104);
    }
    if (game.stampede.active) { ctx.fillStyle = '#ff8d57'; ctx.fillText('GUAC PACK INCOMING!', 936, game.limeShield ? 148 : 126); }
    if (game.bossActive && !game.bossDefeated) {
      const cardX = 744; const cardY = 98; const cardW = 202; const cardH = 74;
      ctx.fillStyle = 'rgba(35,16,48,.78)'; ctx.strokeStyle = game.bossHits >= 2 ? '#ff6fae' : '#ffd65a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 16); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff5d2'; ctx.font = '900 13px Arial'; ctx.fillText('EL GUACODILLO', cardX + cardW / 2, cardY + 19);
      for (let segment = 0; segment < 3; segment += 1) {
        const x = cardX + 57 + segment * 44;
        const cleared = segment < game.bossHits;
        ctx.fillStyle = cleared ? 'rgba(255,255,255,.13)' : ['#8dff9c', '#65d8ff', '#ff6fae'][segment];
        ctx.strokeStyle = cleared ? '#75647b' : '#fff5d2'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, cardY + 40, 15, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = cleared ? '#5d4b64' : '#7a4b2d'; ctx.beginPath(); ctx.arc(x + 3, cardY + 42, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = game.bossVulnerableTimer > 0 ? '#ffd65a' : '#b78cff'; ctx.font = '900 10px Arial';
      ctx.fillText(game.bossVulnerableTimer > 0 ? 'STOMP OPEN!' : `${3 - game.bossHits} ARMOR SEGMENTS`, cardX + cardW / 2, cardY + 65);
    }

    if (game.messageTimer > 0 && game.state !== 'celebrating') {
      const pulse = 1 + Math.sin(time * 0.014) * 0.035;
      ctx.save(); ctx.translate(canvas.width / 2, 167); ctx.scale(pulse, pulse); ctx.textAlign = 'center';
      const size = game.message.length > 50 ? 20 : game.message.length > 38 ? 24 : 31;
      ctx.font = `900 ${size}px Arial`; ctx.strokeStyle = '#2b1530'; ctx.lineWidth = 8; ctx.strokeText(game.message, 0, 0); ctx.fillStyle = sections[game.sectionIndex]?.accent || '#ffd65a'; ctx.fillText(game.message, 0, 0); ctx.restore();
    }
    if (game.state === 'celebrating') {
      ctx.textAlign = 'center'; ctx.font = '900 31px Arial'; ctx.strokeStyle = '#2b1530'; ctx.lineWidth = 8; ctx.strokeText('NEON BLOCK PARTY! MAXIMUM CRUNCH!', canvas.width / 2, 170); ctx.fillStyle = '#ffd65a'; ctx.fillText('NEON BLOCK PARTY! MAXIMUM CRUNCH!', canvas.width / 2, 170);
    }
    if (game.bossPhaseBanner > 0 && game.bossIntroTimer <= 0 && game.messageTimer <= 0 && !game.bossDefeated) {
      const phaseAlpha = clamp(game.bossPhaseBanner / 0.35, 0, 1) * clamp((4.8 - game.bossPhaseBanner) / 0.25, 0, 1);
      ctx.globalAlpha = phaseAlpha;
      ctx.fillStyle = 'rgba(35,16,48,.82)'; ctx.strokeStyle = game.bossHits >= 2 ? '#ff6fae' : game.bossHits === 1 ? '#65d8ff' : '#ffd65a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(225, 204, 510, 62, 18); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff5d2'; ctx.font = '900 25px Arial'; ctx.fillText(game.bossPhaseTitle, 480, 243);
      ctx.globalAlpha = 1;
    }
    if (game.bossIntroTimer > 0 && !game.bossDefeated) {
      const intro = clamp((2.35 - game.bossIntroTimer) / 0.45, 0, 1) * clamp(game.bossIntroTimer / 0.35, 0, 1);
      ctx.globalAlpha = intro;
      ctx.fillStyle = 'rgba(35,16,48,.66)'; ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.roundRect(222, 205, 516, 132, 24); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6fae'; ctx.font = '900 15px Arial'; ctx.fillText('MIDNIGHT MAIN EVENT', 480, 234);
      ctx.fillStyle = '#fff5d2'; ctx.font = '900 41px Arial'; ctx.fillText('EL GUACODILLO', 480, 282);
      ctx.fillStyle = '#8dff9c'; ctx.font = '900 16px Arial'; ctx.fillText('3 PHASES • 3 OPENINGS • 1 HUGE EGO', 480, 315);
      ctx.globalAlpha = 1;
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
    const cameraLift = game.showdownExploration?.cameraLift || 0;
    ctx.save(); ctx.translate(0, cameraLift);
    drawShowdownExplorationBackdrop(time);
    drawGroundGlow(time);
    for (const platform of world.platforms) drawPlatform(platform, time);
    drawShowdownExplorationAccents(time);
    drawPads(time);
    for (const item of world.collectibles) drawCollectible(item, time);
    for (const checkpoint of world.checkpoints) drawCheckpoint(checkpoint, time);
    drawVictoryVillagers(time);
    drawStampede(time);
    drawGoal(time);
    drawBossBattleEffects(time);
    for (const enemy of world.enemies) drawEnemy(enemy);
    heroCore.drawRespawnFX(ctx, game.respawn, player, game.cameraX, time);
    drawPlayer(time);
    drawParticles();
    ctx.restore();
    ctx.restore();
    drawHUD(time);
    drawShowdownExplorationCompletionBanner(time);
    drawOliviaLookoutTransmission(time);
    if (qa) {
      canvas.dataset.qaState = JSON.stringify({
        sourceVersion: SOURCE_VERSION,
        superHero: { ...sharedAbilities.snapshot(game.abilities), collisionWidth: player.w, collisionHeight: player.h },
        state: game.state, hearts: game.hearts, player: {
          x: Math.round(player.x), y: Math.round(player.y),
          vx: Math.round(player.vx), vy: Math.round(player.vy), grounded: player.grounded,
          platform: player.platform ? {
            x: Math.round(player.platform.x), y: Math.round(player.platform.y),
            w: Math.round(player.platform.w), moving: Boolean(player.platform.moving),
          } : null,
        },
        heroPhysics,
        respawn: {
          active: game.respawn.active,
          phase: game.respawn.active ? (game.respawn.spawnPlaced ? 'drop' : game.respawn.timer < .38 ? 'vanish' : 'beam') : 'inactive',
          count: game.respawnCount, fallbacks: game.respawnFallbacks, lastLanding: game.lastRespawnLanding,
        },
        lastImpactText: game.impactTexts[game.impactTexts.length - 1]?.text || null,
        section: sections[game.sectionIndex]?.id, cameraX: Math.round(game.cameraX), platforms: world.platforms.length,
        movingPlatforms: world.platforms.filter((platform) => platform.moving).length,
        collectibles: game.totalCollectibles, routeMaxGap: game.routeMaxGap,
        platformOverlapCount: game.platformOverlapCount,
        platformOverlapPairs: game.platformOverlapPairs,
        showdownRemaster: game.showdownRemaster,
        showdownFormationRules: game.showdownFormationRules,
        showdownForbiddenEnemyCounts: game.showdownForbiddenEnemyCounts,
        showdownFormationOverlapPairs: game.showdownFormationOverlapPairs,
        enemyPatrolAudit: game.enemyPatrolAudit,
        platformEnemyStats: game.platformEnemyStats,
        enemyLayout: world.enemies.filter((enemy) => !enemy.boss).map((enemy) => ({
          id: enemy.showdownEncounter || enemy.type,
          type: enemy.type,
          x: Math.round(enemy.x), y: Math.round(enemy.y), w: enemy.w, h: enemy.h,
          role: enemy.role, groupId: enemy.groupId || null,
          platform: enemy.platform ? { id: enemy.platform.id, x: Math.round(enemy.platform.x), y: Math.round(enemy.platform.y), w: Math.round(enemy.platform.w) } : null,
          targetPlatformId: enemy.targetPlatformId || null,
        })),
        enemies: { total: game.totalEnemies, alive: world.enemies.filter((enemy) => enemy.alive).length, defeated: game.defeated },
        chain: { current: game.chainCount, best: game.bestChain, perfect: game.perfectStomps, trail: Number(game.chainTrailTimer.toFixed(2)) },
        goldenSombrero: game.goldenSombrero,
        stampede: { active: game.stampede.active, done: game.stampede.done, x: Math.round(game.stampede.x), nearMisses: game.stampede.nearMisses, reaction: game.stampede.reactionIndex },
        boss: {
          active: game.bossActive, hits: game.bossHits, defeated: game.bossDefeated,
          state: world.enemies.find((enemy) => enemy.boss && enemy.alive)?.state || (game.bossDefeated ? 'defeated' : 'missing'),
          x: Math.round(world.enemies.find((enemy) => enemy.boss && enemy.alive)?.x || 0),
          vulnerable: Number(game.bossVulnerableTimer.toFixed(2)), dodges: game.bossDodges,
          hazards: game.bossHazards.length, attackIndex: game.bossAttackIndex,
          attackCooldown: Number(game.bossAttackCooldown.toFixed(2)),
          gateLocked: game.bossActive && !game.bossDefeated,
          introTimer: Number(game.bossIntroTimer.toFixed(2)), unlockTimer: Number(game.gateUnlockTimer.toFixed(2)),
          ordinaryEnemiesInArena: world.enemies.filter((enemy) => !enemy.boss && enemy.x >= BOSS_ARENA_LEFT && enemy.x <= BOSS_ARENA_RIGHT).length,
        },
        abilities: { ...game.abilities },
        limeShield: { active: game.limeShield, activePower: game.activePower, damagePriority: 'lime-before-super-before-hearts' },
        showdownExplorationPhase2: game.showdownExploration ? {
          version: game.showdownExploration.version,
          scope: game.showdownExploration.scope,
          normalRouteUnaffected: game.showdownExploration.normalRouteUnaffected,
          noRequiredSuperTraversal: game.showdownExploration.noRequiredSuperTraversal,
          geometry: showdownExplorationGeometryAudit,
          destinationCenters: showdownExplorationPlan.map((entry) => Math.round(entry.trigger.x + entry.trigger.w * .5)),
          minimumDestinationSpacing: showdownExplorationPlan.slice().sort((a, b) => a.trigger.x - b.trigger.x).reduce((minimum, entry, index, entries) => index === 0 ? minimum : Math.min(minimum, (entry.trigger.x + entry.trigger.w * .5) - (entries[index - 1].trigger.x + entries[index - 1].trigger.w * .5)), Infinity),
          standardViewportSeparated: showdownExplorationPlan.every((entry, index, entries) => entries.every((other, otherIndex) => index === otherIndex || Math.abs((entry.trigger.x + entry.trigger.w * .5) - (other.trigger.x + other.trigger.w * .5)) > canvas.width)),
          camera: { lift: Number(game.showdownExploration.cameraLift.toFixed(2)), targetLift: Number(game.showdownExploration.cameraTargetLift.toFixed(2)), maximumLift: 116, backgroundSeamsExposed: false },
          completionBanner: game.showdownExploration.completionBanner,
          interaction: game.showdownExploration.interaction,
          transmission: game.showdownExploration.transmission,
          bossSafeguards: {
            arenaLeft: BOSS_ARENA_LEFT, arenaRight: BOSS_ARENA_RIGHT, triggerX: BOSS_TRIGGER_X,
            phase2MaximumX: showdownExplorationGeometryAudit?.maximumAuthoredX || null,
            phase2BossBuffer: showdownExplorationGeometryAudit?.bossBuffer || null,
            authoredLimitX: PHASE2_BOSS_BUFFER_X,
            phase2EndsBeforeBoss: Boolean(showdownExplorationGeometryAudit && showdownExplorationGeometryAudit.maximumAuthoredX <= PHASE2_BOSS_BUFFER_X),
            noPhase2PlatformsInArena: !world.platforms.some((platform) => platform.phase2Pilot && platform.x + platform.w > BOSS_ARENA_LEFT),
            ordinaryEnemiesInArena: world.enemies.filter((enemy) => !enemy.boss && enemy.x >= BOSS_ARENA_LEFT && enemy.x <= BOSS_ARENA_RIGHT).length,
            arenaPlatformCount: world.platforms.filter((platform) => platform.arena).length,
            bossOnlyArenaEnemy: world.enemies.filter((enemy) => enemy.boss && enemy.platform?.arena).length === 1,
            interactionClearedAtBoss: !game.bossActive || !game.showdownExploration.interaction,
            transitionCleanups: game.showdownExploration.bossTransitionCleanups,
          },
          completionHierarchy: {
            visibleRoutes: showdownExplorationPlan.map((entry) => entry.completionTitle),
            trueSecret: outlawStashPlan.completionTitle,
            discoveredBannerCount: [...showdownExplorationPlan, outlawStashPlan].filter((entry) => entry.completionTitle.includes('DISCOVERED!')).length,
          },
          frozenPhase1Balance: {
            tacoPowerThreshold: sharedAbilities.definitions.tacoPower.threshold,
            tacoContribution: sharedAbilities.definitions.tacoPower.contributions.taco,
            premiumContribution: sharedAbilities.definitions.tacoPower.contributions.premiumTaco,
            normalJumpVelocity: heroPhysics.jumpVelocity,
            superJumpVelocity: heroPhysics.superJumpVelocity,
            collisionWidth: player.w, collisionHeight: player.h,
          },
          destinations: showdownExplorationPlan.map((entry) => ({ id: entry.id, name: entry.name, presentation: entry.presentation, trigger: entry.trigger, routeRange: entry.routeRange, worldPercent: entry.worldPercent, score: entry.score, bonusTacos: entry.bonusTacos, rewardLabel: entry.rewardLabel, ...game.showdownExploration.destinations[entry.id] })),
          secret: { id: outlawStashPlan.id, name: outlawStashPlan.name, presentation: outlawStashPlan.presentation, trigger: outlawStashPlan.trigger, routeRange: outlawStashPlan.routeRange, score: outlawStashPlan.score, bonusTacos: outlawStashPlan.bonusTacos, rewardLabel: outlawStashPlan.rewardLabel, ...game.showdownExploration.secret },
          repeatTriggerProtection: {
            allCompletionCountsAtMostOne: [...showdownExplorationPlan.map((entry) => game.showdownExploration.destinations[entry.id]), game.showdownExploration.secret].every((state) => state.completionCount <= 1),
            allRewardSpawnCountsAtMostOne: [...showdownExplorationPlan.map((entry) => game.showdownExploration.destinations[entry.id]), game.showdownExploration.secret].every((state) => state.rewardSpawnCount <= 1),
          },
          rewardItems: world.collectibles.filter((item) => item.explorationReward).map((item) => ({
            discovery: item.phase2Discovery, rainbow: Boolean(item.rainbowReward), collected: item.collected,
            dynamic: Boolean(item.dynamic), inFlight: Boolean(item.rewardFlight),
            x: Number(item.x.toFixed(2)), y: Number(item.y.toFixed(2)),
            platformId: item.rewardLanding?.platformId || null,
            targetX: item.rewardLanding ? Number(item.rewardLanding.targetX.toFixed(2)) : null,
            targetY: item.rewardLanding ? Number(item.rewardLanding.targetY.toFixed(2)) : null,
            surfaceY: item.rewardLanding?.surfaceY ?? null,
            aboveSurface: item.rewardLanding ? item.y + item.h <= item.rewardLanding.surfaceY + .1 : null,
            horizontallySafe: item.rewardLanding ? item.rewardLanding.targetX >= item.rewardLanding.safeLeft - .1 && item.rewardLanding.targetX <= item.rewardLanding.safeRight + .1 : null,
            settled: Boolean(item.rewardLanding?.settled),
          })),
        } : null,
        background: world1Background.qaState(),
        foregroundRemaster: {
          version: 1,
          groundFamilies: 7,
          elevatedPlatformFamilies: 7,
          checkpointVehicles: 5,
          checkpointsGrounded: game.checkpointsGrounded,
          allCheckpointsGrounded: game.checkpointsGrounded === world.checkpoints.length,
          checkpointArtGroundedByVisibleBaseline: true,
          independentCheckpointShadows: true,
          partyTruckRemastered: Boolean(images.world1_3_checkpoint_fiesta_v1),
          paintedTerrainSlices: true,
        },
        characterRemaster: {
          version: 1,
          enemyTypes: Object.keys(enemySpriteArt),
          enemyAnimationFrames: 8,
          behaviorLinked: true,
          trueBodyGrounding: true,
          perFrameVisibleBaselineMetadata: true,
          separateContactShadows: true,
          defeatReactionFrames: true,
          guacPackCharacters: GUAC_PACK_FORMATION.length,
          guacPackRunAndPanicFrames: true,
          victoryCastCharacters: 8,
          victoryCastAnimated: true,
          elGuacodilloStateLinkedActions: true,
          elGuacodilloFrameCrossfades: true,
          collisionGeometryPreserved: true,
        },
        music: {
          active: game.activeMusic,
          transition: game.musicTransition ? {
            from: game.musicTransition.fromName,
            target: game.musicTransition.toName,
            progress: Number(clamp(game.musicTransition.elapsed / game.musicTransition.duration, 0, 1).toFixed(3)),
            duration: game.musicTransition.duration,
          } : null,
          playing: Object.entries(tracks).filter(([, track]) => !track.paused)
            .map(([name, track]) => ({ name, volume: Number(track.volume.toFixed(3)), time: Number(track.currentTime.toFixed(2)) })),
          overlapSafe: Object.values(tracks).filter((track) => !track.paused).length <= 2,
          transitions: game.musicTransitionCount,
          overlapRecoveries: game.musicOverlapRecoveries,
          maxPlaying: game.maxMusicPlaying,
        },
        platformAccess: game.platformAccess,
        victoryDash: {
          start: sections[5].start, end: sections[5].end,
          enemies: world.enemies.filter((enemy) => enemy.x >= sections[5].start).length,
          villagers: world.villagers.length,
          tacoCoins: world.collectibles.filter((item) => item.type === 'tacoCoin').length,
          tacos: world.collectibles.filter((item) => item.type === 'taco' && !item.bonusReward).length,
        },
        celebrationTime: Number(game.celebrationTime.toFixed(2)),
        fullscreenReady: Boolean(document.fullscreenEnabled || navigator.standalone),
      });
      if (previewCapture) canvas.dataset.qaFrame = canvas.toDataURL('image/png');
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

  const imageSources = Object.freeze({
    hero: 'assets/taco_hero_sheet.png',
    items: 'assets/items_sheet.png',
    fiestaBanner: 'assets/fiesta_finish_banner.png',
    rainbowTunnel: 'assets/rainbow_tunnel_v1.png',
    villagers: 'assets/world1_3_victory_cast_v1.webp',
    guacodillo: 'assets/el_guacodillo_phase_sheet_v2.png',
    guacodilloActions: 'assets/el_guacodillo_action_sheet_v3.png',
    guacPack: 'assets/guac_pack_sheet_v1.png',
    guacPackRemaster: 'assets/world1_3_guac_pack_action_sheet_v1.webp',
    world1_3_salsa_slime_sheet_v1: 'assets/world1_3_salsa_slime_sheet_v1.webp',
    world1_3_tortilla_knight_sheet_v1: 'assets/world1_3_tortilla_knight_sheet_v1.webp',
    world1_3_jalapeno_popper_sheet_v1: 'assets/world1_3_jalapeno_popper_sheet_v1.webp',
    world1_3_guac_roller_sheet_v1: 'assets/world1_3_guac_roller_sheet_v1.webp',
    world1_3_churro_jumper_sheet_v1: 'assets/world1_3_churro_jumper_sheet_v1.webp',
    world1_3_sombrero_mole_sheet_v1: 'assets/world1_3_sombrero_mole_sheet_v1.webp',
    world1_3_ground_gauntlet_v1: 'assets/world1_3_ground_gauntlet_v1.webp',
    world1_3_ground_stampede_v1: 'assets/world1_3_ground_stampede_v1.webp',
    world1_3_ground_mercado_v1: 'assets/world1_3_ground_mercado_v1.webp',
    world1_3_ground_parade_v1: 'assets/world1_3_ground_parade_v1.webp',
    world1_3_ground_boss_v1: 'assets/world1_3_ground_boss_v1.webp',
    world1_3_ground_victory_v1: 'assets/world1_3_ground_victory_v1.webp',
    world1_3_ground_fiesta_v1: 'assets/world1_3_ground_fiesta_v1.webp',
    world1_3_platform_mesa_v1: 'assets/world1_3_platform_mesa_v1.webp',
    world1_3_platform_canyon_v1: 'assets/world1_3_platform_canyon_v1.webp',
    world1_3_platform_awning_v1: 'assets/world1_3_platform_awning_v1.webp',
    world1_3_platform_float_v1: 'assets/world1_3_platform_float_v1.webp',
    world1_3_platform_neon_v1: 'assets/world1_3_platform_neon_v1.webp',
    world1_3_platform_lightrig_v1: 'assets/world1_3_platform_lightrig_v1.webp',
    world1_3_platform_rainbow_v1: 'assets/world1_3_platform_rainbow_v1.webp',
    world1_3_checkpoint_gauntlet_v1: 'assets/world1_3_checkpoint_gauntlet_v1.webp',
    world1_3_checkpoint_canyon_v1: 'assets/world1_3_checkpoint_canyon_v1.webp',
    world1_3_checkpoint_mercado_v1: 'assets/world1_3_checkpoint_mercado_v1.webp',
    world1_3_checkpoint_parade_v1: 'assets/world1_3_checkpoint_parade_v1.webp',
    world1_3_checkpoint_showdown_v1: 'assets/world1_3_checkpoint_showdown_v1.webp',
    world1_3_checkpoint_fiesta_v1: 'assets/world1_3_checkpoint_fiesta_v1.webp',
    world1_3_super_pepper_mine_lift_v1: 'assets/world1_3_super_pepper_mine_lift_v1.webp',
    world1_3_super_salsa_silo_v1: 'assets/world1_3_super_salsa_silo_v1.webp',
    world1_3_super_wanted_tower_v1: 'assets/world1_3_super_wanted_tower_v1.webp',
    world1_3_super_guac_lookout_v1: 'assets/world1_3_super_guac_lookout_v1.webp',
    world1_1_taco_trekker_olivia_v1: 'assets/world1_1_taco_trekker_olivia_v1.png',
  });
  const imageEntries = Object.entries(imageSources);
  Promise.all([
    world1Background.ready,
    ...imageEntries.map(([, path]) => loadImage(path)),
  ]).then(([, ...loadedImages]) => {
    loadedImages.forEach((image, index) => { images[imageEntries[index][0]] = image; });
    loadProgress(); setupInputs(); resetGame(); syncSettings(); updatePersonalBest();
    requestAnimationFrame(frame);
  }).catch((error) => {
    console.error('Could not load Sunset Salsa Showdown assets:', error);
    ctx.fillStyle = '#fff5d2'; ctx.font = '24px Arial'; ctx.fillText('The showdown assets could not be loaded.', 40, 60);
  });
})();
